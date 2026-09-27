import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('https://freebiodatamaker.com/#create-biodata', { waitUntil: 'domcontentloaded' });
  const next = page.getByText('Next Step', { exact: true });
  await next.first().click();
  const details = await page.locator('#create-biodata').innerText();
  await mkdir('test-results/reference', { recursive: true });
  await writeFile('test-results/reference/editor.txt', details);
  await page.locator('#create-biodata').screenshot({ path: 'test-results/reference/editor.png' });
  console.log(details.slice(0, 10000));
} finally {
  await browser.close();
}
