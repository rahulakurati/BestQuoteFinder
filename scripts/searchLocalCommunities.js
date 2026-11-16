import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const SESSIONS_DIR = path.resolve(process.cwd(), 'sessions');
const fbSession = path.join(SESSIONS_DIR, 'facebook.json');
const ndSession = path.join(SESSIONS_DIR, 'nextdoor.json');

function getBrowserPath() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(chromePath)) return chromePath;
  if (fs.existsSync(edgePath)) return edgePath;
  throw new Error('Neither Chrome nor Edge was found.');
}

export async function searchNextdoor(query = 'water heater flush') {
  if (!fs.existsSync(ndSession)) {
    return { error: 'No Nextdoor session found' };
  }

  const browser = await chromium.launch({
    executablePath: getBrowserPath(),
    headless: true
  });

  try {
    const context = await browser.newContext({ storageState: ndSession });
    const page = await context.newPage();
    const url = `https://nextdoor.com/search/?query=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const items = [];
      const posts = document.querySelectorAll('article, div[data-testid="search-result-item"], [data-testid="post-body"]');
      posts.forEach(p => {
        const text = p.innerText || '';
        if (text.length > 20) {
          const priceMatch = text.match(/\$(\d+)/);
          items.push({
            snippet: text.slice(0, 180).replace(/\n/g, ' '),
            price: priceMatch ? parseInt(priceMatch[1], 10) : null
          });
        }
      });
      return items.slice(0, 6);
    });

    await browser.close();
    return { platform: 'Nextdoor', query, count: results.length, results };
  } catch (err) {
    await browser.close();
    return { platform: 'Nextdoor', error: err.message };
  }
}

export async function searchFacebook(query = 'water heater flush') {
  if (!fs.existsSync(fbSession)) {
    return { error: 'No Facebook session found' };
  }

  const browser = await chromium.launch({
    executablePath: getBrowserPath(),
    headless: true
  });

  try {
    const context = await browser.newContext({ storageState: fbSession });
    const page = await context.newPage();
    const url = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const items = [];
      const posts = document.querySelectorAll('div[role="feed"] div, div[role="article"]');
      posts.forEach(p => {
        const text = p.innerText || '';
        if (text.includes('$') || text.length > 40) {
          const priceMatch = text.match(/\$(\d+)/);
          items.push({
            snippet: text.slice(0, 180).replace(/\n/g, ' '),
            price: priceMatch ? parseInt(priceMatch[1], 10) : null
          });
        }
      });
      return items.slice(0, 6);
    });

    await browser.close();
    return { platform: 'Facebook', query, count: results.length, results };
  } catch (err) {
    await browser.close();
    return { platform: 'Facebook', error: err.message };
  }
}

// CLI runner if invoked directly
if (process.argv[1]?.endsWith('searchLocalCommunities.js')) {
  const query = process.argv[2] || 'water heater flush';
  Promise.all([searchFacebook(query), searchNextdoor(query)]).then(([fb, nd]) => {
    console.log('\n--- Facebook Results ---');
    console.log(JSON.stringify(fb, null, 2));
    console.log('\n--- Nextdoor Results ---');
    console.log(JSON.stringify(nd, null, 2));
  }).catch(console.error);
}
