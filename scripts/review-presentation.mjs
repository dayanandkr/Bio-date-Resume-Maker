import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(15_000);
  page.on('pageerror', error => console.log('Browser error:', error.message));
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button', { name: 'Try example', exact: true }).click();
  await page.getByLabel('Biodata Title', { exact: true }).fill('Biodata');
  await page.getByRole('button', { name: 'Change God Photo', exact: true }).click();
  await page.getByRole('button', { name: 'Golden Ganesha Free', exact: true }).click();
  await page.getByRole('button', { name: 'Use suggested blessing', exact: true }).click();
  await page.getByRole('button', { name: 'Change background', exact: true }).click();
  await page.getByRole('button', { name: 'Ivory botanicals', exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  console.log('Heading and background selected.');
  await page.locator('.page-layout-editor summary').click();
  await page.getByLabel('Arrange content', { exact: true }).selectOption('single');
  console.log('Single-page layout selected.');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).waitFor();
  await page.waitForFunction(() => !document.querySelector('.download-button').disabled);
  await page.locator('[data-pdf-page] img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await mkdir('test-results/presentation-review', { recursive: true });
  await page.locator('[data-pdf-page]').first().screenshot({ path: 'test-results/presentation-review/floral-biodata.png' });
  await page.locator('#editor').screenshot({ path: 'test-results/presentation-review/editor.png' });
  console.log('Reviewed local app:', await page.locator('.page-count').textContent());
} finally { await browser.close(); }
