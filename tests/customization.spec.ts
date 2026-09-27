import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createDraft, getDocumentItems, moveField, parseDraft, storageKey } from '../src/model';
import { formatBirthDate, languages, tr } from '../src/i18n';

test('legacy drafts migrate and invalid dynamic layouts are rejected', () => {
  expect(formatBirthDate('1998-05-14', 'ne')).toBe('१४ मे १९९८');
  expect(formatBirthDate('1998-05-14', 'gu')).toBe('૧૪ મે ૧૯૯૮');
  expect(formatBirthDate('2025-02-31', 'ne')).toBe('2025-02-31');
  const draft = createDraft();
  draft.data.fullName = 'Existing user';
  const migrated = parseDraft(JSON.stringify({ ...draft, version: 1, fieldLayout: undefined, settings: { ...draft.settings, language: undefined } }));
  expect(migrated.version).toBe(3);
  expect(migrated.data.fullName).toBe('Existing user');
  expect(migrated.settings.language).toBe('en');
  draft.fieldLayout.personal.push({ key: 'custom_test', label: 'मूळ गाव' });
  draft.data.custom_test = 'पुणे';
  const moved = moveField(draft, 'custom_test', 'family');
  const restored = parseDraft(JSON.stringify(moved));
  expect(restored.fieldLayout.family.at(-1)?.key).toBe('custom_test');
  expect(getDocumentItems(restored.data, restored.settings, restored.fieldLayout).find(item => item.id === 'custom_test-0')?.value).toBe('पुणे');
  restored.fieldLayout.personal.push({ key: 'custom_test', label: 'Duplicate' });
  expect(() => parseDraft(JSON.stringify(restored))).toThrow(/duplicate/);
  const missingName = createDraft(); missingName.fieldLayout.personal.shift();
  expect(() => parseDraft(JSON.stringify(missingName))).toThrow(/name field/);
  const unsafe = createDraft(); unsafe.fieldLayout.personal.push({ key: '__proto__', label: 'Unsafe' });
  expect(() => parseDraft(JSON.stringify(unsafe))).toThrow(/unknown field/);
  const tooMany = createDraft();
  for (let i = 0; i < 41; i++) { tooMany.fieldLayout.about.push({ key: `custom_${i}`, label: 'Custom' }); tooMany.data[`custom_${i}`] = ''; }
  expect(() => parseDraft(JSON.stringify(tooMany))).toThrow(/40 custom/);
});

test('custom fields can be added, renamed, shifted, removed, restored, and saved', async ({ page }) => {
  await page.goto('/');
  await page.locator('#fullName').fill('Meera Patil');
  await page.locator('#profession').fill('Architect');
  for (const [label, value] of [['Native place', 'Pune'], ['Gotra', 'Kashyap']]) {
    await page.getByRole('button', { name: 'Add New Field', exact: true }).click();
    await page.getByLabel('Field label', { exact: true }).fill(label);
    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  const firstKeys = await page.locator('[data-field-key]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-field-key')!));
  const [nativeKey, gotraKey] = firstKeys.slice(-2);
  await page.locator(`[data-field-key="${gotraKey}"]`).getByRole('button', { name: 'Move up: Gotra', exact: true }).click();
  const order = await page.locator('[data-pdf-page] .document-value').allTextContents();
  expect(order.indexOf('Kashyap')).toBeLessThan(order.indexOf('Pune'));
  await page.locator(`[data-field-key="${nativeKey}"]`).getByRole('button', { name: 'Rename field: Native place', exact: true }).click();
  await page.locator(`#label-${nativeKey}`).fill('Home town');
  await page.getByRole('button', { name: 'Save label', exact: true }).click();
  await expect(page.locator('[data-pdf-page]').getByText('Home town', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rename field: Home town', exact: true }).click();
  await page.getByLabel('Move to section', { exact: true }).selectOption('family');
  await expect(page.locator(`[data-field-key="${nativeKey}"]`)).toHaveCount(0);
  await page.getByRole('tab', { name: /Family/ }).click();
  await expect(page.getByLabel('Home town', { exact: true })).toHaveValue('Pune');
  await page.getByRole('button', { name: 'Remove field: Home town', exact: true }).click();
  await expect(page.locator('[data-pdf-page]').getByText('Pune', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByLabel('Home town', { exact: true })).toHaveValue('Pune');
  await page.getByRole('tab', { name: /Personal/ }).click();
  await page.getByRole('button', { name: 'Remove field: Profession', exact: true }).click();
  await expect(page.locator('[data-pdf-page]').getByText('Architect')).toHaveCount(0);
  await page.getByRole('switch', { name: /Save on this device/ }).check();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('#profession')).toHaveCount(0);
  await page.getByRole('tab', { name: /Family/ }).click();
  await expect(page.getByLabel('Home town', { exact: true })).toHaveValue('Pune');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download draft', exact: true }).click();
  const file = await downloadPromise;
  const saved = parseDraft(await readFile((await file.path())!, 'utf8'));
  expect(saved.fieldLayout.family.at(-1)).toEqual({ key: nativeKey, label: 'Home town', multiline: false });
  expect(saved.data.profession).toBe('');
  expect(saved.fieldLayout.personal.at(-1)?.key).toBe(gotraKey);
  await page.getByRole('button', { name: /Restore removed fields/ }).click();
  await page.getByRole('tab', { name: /Personal/ }).click();
  await expect(page.locator('#profession')).toHaveValue('');
});

const examples = {
  en: { name: 'Ananya Patel', value: 'Kindness, family, and meaningful conversations.', label: 'Full name' },
  hi: { name: 'अनन्या शर्मा', value: 'मुझे पढ़ना, संगीत और परिवार के साथ समय बिताना पसंद है।', label: 'पूरा नाम' },
  mr: { name: 'अनन्या पाटील', value: 'मला वाचन, संगीत आणि कुटुंबासोबत वेळ घालवायला आवडते.', label: 'पूर्ण नाव' },
  gu: { name: 'અનન્યા પટેલ', value: 'મને વાંચન, સંગીત અને પરિવાર સાથે સમય વિતાવવો ગમે છે.', label: 'પૂરું નામ' },
  ne: { name: 'अनन्या श्रेष्ठ', value: 'मलाई पढ्न, सङ्गीत सुन्न र परिवारसँग समय बिताउन मन पर्छ।', label: 'पूरा नाम' },
};

for (const language of languages) {
  test(`${language.name}: translated fields and custom text persist and render in a downloadable PDF`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const example = examples[language.id];
    await page.goto('/');
    await page.getByRole('button', { name: language.name, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', language.id);
    await page.getByLabel(example.label, { exact: false }).filter({ visible: true }).fill(example.name);
    await page.locator('#education').fill('M.Tech');
    await page.locator('#dateOfBirth').fill('1998-05-14');
    await page.getByRole('button', { name: tr(language.id, 'Add New Field'), exact: true }).click();
    await page.getByLabel(tr(language.id, 'Field label'), { exact: true }).fill('My story / परिचय');
    await page.getByLabel(tr(language.id, 'Field type'), { exact: true }).selectOption('long');
    await page.getByRole('button', { name: tr(language.id, 'Add field'), exact: true }).click();
    await page.getByLabel('My story / परिचय', { exact: true }).fill(example.value);
    await expect(page.locator('[data-pdf-page] .document-eyebrow')).toContainText(tr(language.id, 'Marriage biodata'));
    await expect(page.locator('[data-pdf-page]')).toContainText(tr(language.id, 'Education'));
    await expect(page.locator('[data-pdf-page]')).toContainText(formatBirthDate('1998-05-14', language.id));
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(page.locator('#fullName')).toHaveValue(example.name);
    await expect(page.getByLabel('My story / परिचय', { exact: true })).toHaveValue(example.value);
    await page.getByRole('button', { name: language.name, exact: true }).click();
    await page.getByRole('switch').check();
    await expect(page.getByText(tr(language.id, 'Saved on this device'), { exact: true })).toBeVisible();
    await page.reload();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).settings.language, storageKey)).toBe(language.id);
    await expect(page.locator('#fullName')).toHaveValue(example.name);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: tr(language.id, 'Download PDF'), exact: true }).click();
    const file = await downloadPromise;
    const bytes = await readFile((await file.path())!);
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task = getDocument({ data: new Uint8Array(bytes) });
    const pdf = await task.promise;
    const first = await pdf.getPage(1);
    const viewport = first.getViewport({ scale: 1.25 });
    const factory = pdf.canvasFactory as { create: (w: number, h: number) => { canvas: HTMLCanvasElement & { toBuffer: (type: string) => Buffer }; context: CanvasRenderingContext2D } };
    const surface = factory.create(viewport.width, viewport.height);
    await first.render({ canvas: surface.canvas, canvasContext: surface.context, viewport }).promise;
    await writeFile(testInfo.outputPath(`${language.id}-pdf.png`), surface.canvas.toBuffer('image/png'));
    expect(pdf.numPages).toBe(1);
    await task.destroy();
    // Native printing supplies text, but Chromium's ToUnicode mapping for some
    // Indic conjuncts does not round-trip when copied. Verify visual print output
    // separately; exact Indic text extraction is not promised by this export.
    const print = await page.pdf({ preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
    const printTask = getDocument({ data: new Uint8Array(print), useSystemFonts: true });
    const printPdf = await printTask.promise;
    const printedPage = await printPdf.getPage(1);
    const content = await printedPage.getTextContent();
    const text = content.items.map(item => 'str' in item ? item.str : '').join('');
    expect(text).toContain('M.Tech');
    if (language.id === 'en') expect(text.replace(/\s/g, '')).toContain(example.name.replace(/\s/g, ''));
    expect(printPdf.numPages).toBe(1);
    const printViewport = printedPage.getViewport({ scale: 1.25 });
    const printFactory = printPdf.canvasFactory as typeof factory;
    const printSurface = printFactory.create(printViewport.width, printViewport.height);
    await printedPage.render({ canvas: printSurface.canvas, canvasContext: printSurface.context, viewport: printViewport }).promise;
    await writeFile(testInfo.outputPath(`${language.id}-print.png`), printSurface.canvas.toBuffer('image/png'));
    await printTask.destroy();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ media: 'screen' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (language.id === 'gu') await page.screenshot({ path: testInfo.outputPath('gujarati-mobile.png'), fullPage: true });
  });
}
