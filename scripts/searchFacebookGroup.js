import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const SESSIONS_DIR = path.resolve(process.cwd(), 'sessions');
const sessionFile = path.join(SESSIONS_DIR, 'facebook.json');

function getBrowserPath() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(chromePath)) return chromePath;
  if (fs.existsSync(edgePath)) return edgePath;
  throw new Error('Neither Chrome nor Edge was found at default locations.');
}

async function searchFacebook(query = 'water heater flush', location = 'River Islands') {
  if (!fs.existsSync(sessionFile)) {
    console.error(`\n[ERROR] No saved Facebook session found.`);
    console.error(`Please run: npm run auth:facebook to log in once.\n`);
    process.exit(1);
  }

  console.log(`\n========================================================================`);
  console.log(`  FACEBOOK SCOUT | Searching: "${query}" in "${location}"`);
  console.log(`========================================================================`);

  const browser = await chromium.launch({
    executablePath: getBrowserPath(),
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    storageState: sessionFile,
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Search query on Facebook
  const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(`${query} ${location}`)}`;
  console.log(`Navigating to: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.waitForTimeout(4000);

  // Extract visible posts and comments with prices
  const results = await page.evaluate(() => {
    const extracted = [];
    const elements = document.querySelectorAll('div[role="feed"] div, div[role="article"]');
    elements.forEach(el => {
      const text = el.innerText || '';
      if (text.includes('$') || text.toLowerCase().includes('flush') || text.toLowerCase().includes('heater')) {
        // extract price if any
        const match = text.match(/\$(\d+)/);
        extracted.push({
          preview: text.slice(0, 160).replace(/\n/g, ' '),
          price: match ? parseInt(match[1], 10) : null
        });
      }
    });
    return extracted.slice(0, 5);
  });

  console.log(`\nFound ${results.length} related posts / recommendations:`);
  results.forEach((r, i) => {
    console.log(`[#${i + 1}] Price: ${r.price ? `$${r.price}` : 'N/A'} | ${r.preview}`);
  });

  await browser.close();
}

const q = process.argv[2] || 'water heater flush';
const loc = process.argv[3] || 'River Islands';
searchFacebook(q, loc).catch(console.error);
