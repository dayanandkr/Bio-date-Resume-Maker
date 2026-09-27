import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createDraft, parseDraft, sampleData, templates } from '../src/model';
import { backgrounds, createPresentation } from '../src/presentation';
import { languages, tr } from '../src/i18n';

test('v2 drafts migrate without losing content and presentation imports reject unsafe settings', () => {
  const draft = createDraft();
  draft.data.fullName = 'Meera Patel';
  draft.settings.language = 'gu';
  const restored = parseDraft(JSON.stringify({ ...draft, version: 2, presentation: undefined }));
  expect(restored.presentation).toEqual(createPresentation());
  expect(restored.data.fullName).toBe('Meera Patel');
  expect(restored.settings.language).toBe('gu');
  for (const patch of [
    { background: 'unknown' }, { customBackground: 'https://example.org/photo.png' },
    { devotionalImage: 'custom' }, { customDevotionalImage: 'data:image/svg+xml;base64,PHN2Zz4=' },
    { title: 'x'.repeat(81) }, { godName: 'x'.repeat(121) }, { godImageSize: 500 },
    { backgroundStrength: -1 }, { pageMode: 'crop' }, { contentSize: 0 }, { targetPages: 999 },
  ]) expect(() => parseDraft(JSON.stringify({ ...draft, presentation: { ...draft.presentation, ...patch } }))).toThrow();
});

test('backgrounds and heading artwork work independently of templates and persist in drafts', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.locator('#fullName').fill('Meera Patel');
  await page.getByLabel('Biodata Title', { exact: true }).fill('Biodata');
  await page.getByLabel('God Name / blessing', { exact: true }).fill('॥ श्री गणेशाय नमः ॥');
  await page.getByRole('button', { name: 'Change God Photo', exact: true }).click();
  await page.getByRole('button', { name: 'Golden Ganesha Free', exact: true }).click();
  await expect(page.locator('[data-pdf-page] .document-god-image')).toHaveAttribute('src', '/artwork/ganesha-gold.png');
  await page.getByRole('button', { name: 'Change background', exact: true }).click();
  for (const background of backgrounds) {
    await page.getByRole('button', { name: background.name, exact: true }).click();
    await expect(page.getByRole('button', { name: background.name, exact: true })).toHaveAttribute('aria-pressed', 'true');
    if (background.id !== 'original') await expect(page.locator('[data-pdf-page] .document-background')).toHaveAttribute('data-background', background.id);
  }
  await page.getByLabel('Background intensity', { exact: false }).fill('75');
  await page.getByRole('dialog').screenshot({ path: testInfo.outputPath('background-picker.png') });
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Modern template', exact: true }).click();
  await expect(page.locator('[data-pdf-page] .document-background')).toHaveAttribute('data-background', 'floral');
  await expect(page.locator('[data-pdf-page] .document-eyebrow')).toHaveText('Biodata');
  await page.getByRole('button', { name: 'Change God Photo', exact: true }).click();
  await page.getByRole('dialog').screenshot({ path: testInfo.outputPath('god-picker.png') });
  await page.getByRole('button', { name: 'Krishna Free', exact: true }).click();
  await expect(page.getByLabel('God Name / blessing', { exact: true })).toHaveValue('॥ श्री गणेशाय नमः ॥');
  await page.getByRole('button', { name: 'Use suggested blessing', exact: true }).click();
  await expect(page.locator('[data-pdf-page] .document-blessing')).toHaveText('॥ श्री कृष्णाय नमः ॥');
  await page.getByRole('switch').check();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-pdf-page] .document-background')).toHaveAttribute('data-background', 'floral');
  await expect(page.locator('[data-pdf-page] .document-god-image')).toHaveAttribute('src', '/artwork/krishna-peacock.png');
  await page.getByRole('button', { name: 'Remove God photo', exact: true }).click();
  await expect(page.locator('[data-pdf-page] .document-god-image')).toHaveCount(0);
  await expect(page.locator('[data-pdf-page] .document-blessing')).toHaveText('॥ श्री कृष्णाय नमः ॥');
});

test('custom images stay separate from the profile photo and round-trip through reset and import', async ({ page }) => {
  await page.goto('/');
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 100;
    const context = canvas.getContext('2d')!; context.fillStyle = '#b3915d'; context.fillRect(20, 20, 40, 60);
    return canvas.toDataURL().split(',')[1];
  });
  const file = { name: 'art.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') };
  await page.locator('#fullName').fill('My biodata');
  await page.getByLabel('Upload profile photo').setInputFiles(file);
  await page.getByRole('button', { name: 'Change God Photo', exact: true }).click();
  await page.getByLabel('Upload God photo', { exact: true }).setInputFiles(file);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Change background', exact: true }).click();
  await page.getByLabel('Upload background', { exact: true }).setInputFiles(file);
  await expect(page.getByRole('button', { name: 'Your background', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download draft', exact: true }).click();
  const saved = await download;
  const raw = await readFile((await saved.path())!, 'utf8');
  const draft = parseDraft(raw);
  expect(draft.photo).toMatch(/^data:image\/jpeg/);
  expect(draft.presentation.customDevotionalImage).toMatch(/^data:image\/png/);
  expect(draft.presentation.customBackground).toMatch(/^data:image\/jpeg/);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('button', { name: 'Clear & start fresh' }).click();
  await expect(page.locator('[data-pdf-page] .document-background')).toHaveCount(0);
  await page.getByLabel('Open draft file').setInputFiles({ name: 'draft.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
  await expect(page.locator('[data-pdf-page] .document-photo')).toHaveCount(1);
  await expect(page.locator('[data-pdf-page] .document-god-image')).toHaveCount(1);
  await expect(page.locator('[data-pdf-page] .document-background')).toHaveAttribute('data-background', 'custom');
  const alpha = await page.locator('[data-pdf-page] .document-god-image').evaluate(async (image: HTMLImageElement) => {
    await image.decode(); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0); return ctx.getImageData(0, 0, 1, 1).data[3];
  });
  expect(alpha).toBe(0);
});

test('page fitting preserves all content and exports the requested number of pages with artwork', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const csp = headers.split('\n').find(line => line.includes('Content-Security-Policy:'))!.split('Content-Security-Policy:')[1].trim();
  await page.route('http://127.0.0.1:4173/', async route => { const response = await route.fetch(); await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } }); });
  await page.goto('/');
  const draft = createDraft();
  draft.data = { ...sampleData, familyDetails: 'A close family with shared traditions and a love of travel. '.repeat(18).slice(0, 1200), aboutMe: 'I enjoy art, music, reading, and meaningful conversations. '.repeat(18).slice(0, 1200) };
  draft.presentation = { ...draft.presentation, title: 'Biodata', godName: '॥ श्री गणेशाय नमः ॥', devotionalImage: 'ganesha-gold', godImageSize: 112, background: 'floral' };
  await page.getByLabel('Open draft file').setInputFiles({ name: 'fit.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(draft)) });
  await expect.poll(() => page.locator('[data-pdf-page]').count()).toBeGreaterThan(1);
  const originalText = (await page.locator('[data-pdf-page] .document-value').allTextContents()).join('');
  await page.locator('.page-layout-editor summary').click();
  await page.getByLabel('Arrange content', { exact: true }).selectOption('single');
  await expect(page.locator('[data-pdf-page]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeEnabled();
  expect((await page.locator('[data-pdf-page] .document-value').allTextContents()).join('')).toBe(originalText);
  await page.getByRole('button', { name: /Browse all themes/ }).click();
  for (const template of templates.slice(0, 5)) {
    await page.getByRole('button', { name: `${template.name} template`, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeEnabled();
    await expect(page.locator('[data-pdf-page]')).toHaveCount(1);
    expect(await page.locator('[data-pdf-page]').evaluate(node => node.querySelector('.document-content')!.getBoundingClientRect().bottom < node.querySelector('.document-footer')!.getBoundingClientRect().top)).toBe(true);
  }
  await page.getByRole('button', { name: 'Traditional template', exact: true }).click();
  await page.locator('[data-pdf-page]').screenshot({ path: testInfo.outputPath('single-page-preview.png') });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const download = await downloadPromise;
  const bytes = await readFile((await download.path())!);
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(bytes) });
  const pdf = await task.promise;
  expect(pdf.numPages).toBe(1);
  expect((await pdf.getMetadata()).info).toMatchObject({ Title: `${draft.data.fullName} — Biodata` });
  const first = await pdf.getPage(1); const viewport = first.getViewport({ scale: 1.5 });
  const factory = pdf.canvasFactory as { create: (w: number, h: number) => { canvas: HTMLCanvasElement & { toBuffer: (type: string) => Buffer }; context: CanvasRenderingContext2D } };
  const surface = factory.create(viewport.width, viewport.height);
  await first.render({ canvas: surface.canvas, canvasContext: surface.context, viewport }).promise;
  await writeFile(testInfo.outputPath('single-page-pdf.png'), surface.canvas.toBuffer('image/png'));
  await task.destroy();
  await page.getByLabel('Arrange content', { exact: true }).selectOption('target');
  await page.getByLabel('Maximum pages', { exact: true }).selectOption('2');
  await expect(page.locator('[data-pdf-page]')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeEnabled();
  expect((await page.locator('[data-pdf-page] .document-value').allTextContents()).join('')).toBe(originalText);
  const print = await page.pdf({ preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
  const printTask = getDocument({ data: new Uint8Array(print) });
  const printed = await printTask.promise; expect(printed.numPages).toBe(2); await printTask.destroy();
  await page.getByRole('switch').check();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-pdf-page]')).toHaveCount(2);
  await page.locator('.page-layout-editor summary').click();
  await expect(page.getByLabel('Maximum pages', { exact: true })).toHaveValue('2');
  await page.getByLabel('Arrange content', { exact: true }).selectOption('auto');
  await page.getByLabel('Content size', { exact: false }).fill('110');
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeEnabled();
  const overflow = await page.locator('[data-pdf-page]').evaluateAll(nodes => nodes.some(node => node.querySelector('.document-content')!.getBoundingClientRect().bottom >= node.querySelector('.document-footer')!.getBoundingClientRect().top));
  expect(overflow).toBe(false);
  expect((await page.locator('[data-pdf-page] .document-value').allTextContents()).join('')).toBe(originalText);
});

test('new controls translate in five languages and fit mobile screens', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const language of languages) {
    await page.getByRole('button', { name: language.name, exact: true }).click();
    await expect(page.getByLabel(tr(language.id, 'Biodata Title'), { exact: true })).toBeVisible();
    await page.getByRole('button', { name: tr(language.id, 'Change background'), exact: true }).click();
    const bounds = await page.getByRole('dialog').boundingBox(); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    await page.getByRole('button', { name: tr(language.id, 'Done'), exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('.page-layout-editor summary').click();
  await page.getByLabel(tr('ne', 'Arrange content'), { exact: true }).selectOption('single');
  await expect(page.locator('[data-pdf-page]')).toHaveCount(1);
  await page.locator('.preview-column').screenshot({ path: testInfo.outputPath('mobile-page-controls.png') });
});
