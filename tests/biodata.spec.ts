import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createDraft, paginate, parseDraft, storageKey, templates, validateData } from '../src/model';
import type { DocItem } from '../src/model';

test('draft parsing rejects incompatible formats and unsafe photo data', () => {
  const valid = createDraft();
  valid.data.fullName = 'अनन्या शर्मा';
  expect(parseDraft(JSON.stringify(valid)).data.fullName).toBe('अनन्या शर्मा');
  expect(() => parseDraft(JSON.stringify({ ...valid, version: 900 }))).toThrow();
  expect(() => parseDraft(JSON.stringify({ ...valid, photo: 'https://external.example/photo.jpg' }))).toThrow();
  expect(() => parseDraft(JSON.stringify({ ...valid, settings: { ...valid.settings, color: 'url(https://external.example)' } }))).toThrow();
  valid.data.dateOfBirth = '2025-02-31';
  expect(validateData(valid.data)).toHaveProperty('dateOfBirth');
  valid.data.fullName = '  ';
  expect(validateData(valid.data)).toHaveProperty('fullName');
});

test('pagination keeps headings with their content and repeats headings on continuation pages', () => {
  const items: DocItem[] = [
    { id: 'personal', section: 'personal', kind: 'heading', label: 'Personal', value: '' },
    { id: 'one', section: 'personal', kind: 'row', label: 'One', value: 'A' },
    { id: 'two', section: 'personal', kind: 'row', label: 'Two', value: 'B' },
    { id: 'family', section: 'family', kind: 'heading', label: 'Family', value: '' },
    { id: 'three', section: 'family', kind: 'row', label: 'Three', value: 'C' },
  ];
  const pages = paginate(items, { personal: 25, one: 45, two: 45, family: 25, three: 45 }, 90);
  expect(pages).toHaveLength(3);
  expect(pages[0].map(item => item.id)).toEqual(['personal', 'one']);
  expect(pages[1][0].label).toContain('continued');
  expect(pages[2].map(item => item.id)).toEqual(['family', 'three']);
});

test('editor validates, switches all 32 free themes, and hides optional sections', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('Example preview · Your details will replace this')).toBeVisible();
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Enter your full name');
  await page.getByLabel('Full name').fill('Ananya Sharma');
  await page.getByLabel('Education', { exact: true }).fill('M.Tech, Computer Science');
  await expect(page.getByText('Example preview · Your details will replace this')).toHaveCount(0);
  await page.getByRole('button', { name: /Browse all themes/ }).click();
  await expect(page.locator('[data-theme-id]')).toHaveCount(32);
  for (const template of templates) {
    expect(template.price).toBe(0);
    await page.getByRole('button', { name: `${template.name} template`, exact: true }).click();
    await expect(page.locator('[data-pdf-page]').first()).toHaveClass(new RegExp(`document-${template.id}`));
    await expect(page.locator('[data-pdf-page]').first().getByRole('heading', { name: 'Ananya Sharma' })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Customize' }).click();
  await page.getByLabel('Heading font').selectOption('sans');
  await page.locator('#design-settings').getByLabel('Personal', { exact: true }).uncheck();
  await expect(page.locator('[data-pdf-page]').getByText('M.Tech, Computer Science')).toHaveCount(0);
  await page.locator('#design-settings').getByLabel('Personal', { exact: true }).check();
  await expect(page.locator('[data-pdf-page]').getByText('M.Tech, Computer Science')).toBeVisible();
  await page.getByRole('tab', { name: /Contact/ }).click();
  await page.getByLabel('Email address', { exact: true }).fill('invalid-email');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('valid email');
  expect(errors).toEqual([]);
});

test('saving is opt-in, drafts round-trip, reset clears storage, and invalid imports are rejected', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Full name').fill('Kavya Verma');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.getByRole('switch', { name: /Save on this device/ }).check();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Full name')).toHaveValue('Kavya Verma');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download draft', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const raw = await readFile(path!, 'utf8');
  expect(parseDraft(raw).data.fullName).toBe('Kavya Verma');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('button', { name: 'Clear & start fresh' }).click();
  await expect(page.getByLabel('Full name')).toHaveValue('');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.getByLabel('Open draft file').setInputFiles({ name: 'draft.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
  await expect(page.getByLabel('Full name')).toHaveValue('Kavya Verma');
  await page.getByLabel('Open draft file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":900}') });
  await expect(page.getByRole('status')).toContainText('not supported');
  await expect(page.getByLabel('Full name')).toHaveValue('Kavya Verma');
});

test('photo validation rejects unsupported and oversized images', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Upload profile photo').setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByRole('status')).toContainText('JPG, PNG, or WebP');
  await page.getByLabel('Upload profile photo').setInputFiles({ name: 'huge.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByRole('status')).toContainText('smaller than 5 MB');
});

test('long Hindi biodata with a photo paginates and downloads a valid A4 PDF', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const csp = headers.split('\n').find(line => line.includes('Content-Security-Policy:'))!.split('Content-Security-Policy:')[1].trim();
  await page.route('http://127.0.0.1:4173/', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } });
  });
  await page.goto('/');
  const draft = createDraft();
  draft.data.fullName = 'अनन्या शर्मा';
  draft.data.profession = 'सॉफ्टवेयर इंजीनियर';
  draft.data.education = 'M.Tech in Computer Science';
  draft.data.location = 'बेंगलुरु, कर्नाटक';
  draft.data.familyDetails = 'मेरा परिवार प्रेम और सम्मान में विश्वास रखता है। '.repeat(20).slice(0, 1200);
  draft.data.aboutMe = 'I value kindness, meaningful conversations, and new experiences. '.repeat(18).slice(0, 1200);
  draft.data.expectations = 'मैं एक सहयोगी और समझदार जीवनसाथी की तलाश में हूँ। '.repeat(20).slice(0, 1200);
  draft.data.horoscope = 'Optional horoscope and additional details. '.repeat(25).slice(0, 1200);
  await page.getByLabel('Open draft file').setInputFiles({ name: 'long.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(draft)) });
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 150; canvas.height = 180;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#d4b88a'; ctx.fillRect(0, 0, 150, 180);
    ctx.fillStyle = '#496653'; ctx.beginPath(); ctx.arc(75, 60, 30, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(35, 100, 80, 80);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Upload profile photo').setInputFiles({ name: 'profile.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64') });
  await expect(page.getByAltText('Your selected photo')).toBeVisible();
  await page.getByRole('button', { name: /Browse all themes/ }).click();
  for (const template of templates) {
    await page.getByRole('button', { name: `${template.name} template`, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeEnabled();
    await expect.poll(() => page.locator('[data-pdf-page]').count()).toBeGreaterThan(1);
    const overflow = await page.locator('[data-pdf-page]').evaluateAll(nodes => nodes.map(node => {
      const bottom = node.querySelector('.document-content')!.getBoundingClientRect().bottom;
      const footerTop = node.querySelector('.document-footer')!.getBoundingClientRect().top;
      return bottom > footerTop - 1;
    }));
    expect(overflow, `${template.name} must not overflow into footers`).not.toContain(true);
  }
  const expectedPages = await page.locator('[data-pdf-page]').count();
  const downloadPromise = page.waitForEvent('download', { timeout: 90_000 });
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('अनन्या-शर्मा-biodata.pdf');
  const pdfPath = testInfo.outputPath('hindi-biodata.pdf');
  await download.saveAs(pdfPath);
  const bytes = await readFile(pdfPath);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(30_000);
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
  const pdf = await loadingTask.promise;
  expect(pdf.numPages).toBe(expectedPages);
  const pdfPage = await pdf.getPage(1);
  const viewport = pdfPage.getViewport({ scale: 1 });
  expect(viewport.width).toBeCloseTo(595.28, 0);
  expect(viewport.height).toBeCloseTo(841.89, 0);
  const operators = await pdfPage.getOperatorList();
  expect(operators.fnArray).toContain(OPS.paintImageXObject);
  const factory = pdf.canvasFactory as { create: (width: number, height: number) => { canvas: HTMLCanvasElement & { toBuffer: (type: string) => Buffer }; context: CanvasRenderingContext2D } };
  const surface = factory.create(viewport.width, viewport.height);
  await pdfPage.render({ canvas: surface.canvas, canvasContext: surface.context, viewport }).promise;
  await writeFile(testInfo.outputPath('hindi-pdf-rendered.png'), surface.canvas.toBuffer('image/png'));
  await page.locator('[data-pdf-page]').first().screenshot({ path: testInfo.outputPath('hindi-preview.png') });
  await loadingTask.destroy();
  const nativeBytes = await page.pdf({ preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
  const nativeTask = getDocument({ data: new Uint8Array(nativeBytes), useSystemFonts: true });
  const nativePdf = await nativeTask.promise;
  expect(nativePdf.numPages).toBe(expectedPages);
  const text = await (await nativePdf.getPage(1)).getTextContent();
  expect(text.items.map(item => 'str' in item ? item.str : '').join(' ')).toContain('M.Tech in Computer Science');
  await nativeTask.destroy();
});

test('mobile layout supports form navigation, preview, and printing without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Full name').fill('Aarav Mehta');
  await page.getByRole('button', { name: 'Next: Family' }).click();
  await page.getByLabel('Father’s name', { exact: true }).fill('Raj Mehta');
  await expect(page.locator('[data-pdf-page]').getByText('Raj Mehta')).toBeVisible();
  await page.getByRole('tab', { name: /Personal/ }).click();
  await expect(page.getByLabel('Full name')).toHaveValue('Aarav Mehta');
  const sizes = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport);
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.form-column')).toBeHidden();
  await expect(page.locator('[data-pdf-page]')).toBeVisible();
});

test('desktop first visit has no runtime errors or requests to external services', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const external: string[] = [];
  const errors: string[] = [];
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4173')) external.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: true });
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
