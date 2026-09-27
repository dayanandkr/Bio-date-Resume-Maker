import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Try example', exact: true }).click();
  await page.getByRole('button', { name: /Browse all themes/ }).click();
  await page.getByRole('textbox', { name: 'Search themes' }).fill('lotus');
  await page.getByRole('button', { name: 'Abstract Lotus template', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search themes' }).fill('');
  await page.locator('[data-pdf-page]').first().waitFor();
  await mkdir('test-results/review', { recursive: true });
  await page.locator('#templates').screenshot({ path: 'test-results/review/gallery.png' });
  await page.locator('[data-pdf-page]').first().screenshot({ path: 'test-results/review/lotus.png' });
  await page.locator('#editor').screenshot({ path: 'test-results/review/editor.png' });
  console.log('Updated BioResume app verified at http://127.0.0.1:5173. Theme search and selection worked.');
} finally { await browser.close(); }
