import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const SESSIONS_DIR = path.resolve(process.cwd(), 'sessions');
const fbSession = path.join(SESSIONS_DIR, 'facebook.json');
const ndSession = path.join(SESSIONS_DIR, 'nextdoor.json');

// Prioritize Microsoft Edge over Chrome to bypass common headless Chrome automation blocks
function getBrowserPath(preferred = 'edge') {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  
  if (preferred === 'edge' && fs.existsSync(edgePath)) return edgePath;
  if (fs.existsSync(edgePath)) return edgePath;
  if (fs.existsSync(chromePath)) return chromePath;
  throw new Error('Neither Edge nor Chrome browser was found on this system.');
}

const DEFAULT_EDGE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0';

export async function searchNextdoor(query = 'water heater flush', options = { headless: true, browser: 'edge' }) {
  if (!fs.existsSync(ndSession)) {
    return { error: 'No Nextdoor session found' };
  }

  const browser = await chromium.launch({
    executablePath: getBrowserPath(options.browser),
    headless: options.headless,
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
  });

  try {
    const context = await browser.newContext({ 
      storageState: ndSession,
      userAgent: DEFAULT_EDGE_USER_AGENT
    });
    const page = await context.newPage();
    const url = `https://nextdoor.com/search/?query=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Check if automation challenge or login redirection occurred
    if (page.url().includes('/login') || page.url().includes('challenge')) {
      console.warn('[AUTOMATION_DETECTED] Headless Nextdoor was blocked/redirected. Escalate to headed Edge or Browser Subagent.');
      await browser.close();
      if (options.headless) {
        // Fallback: Retry with headed Microsoft Edge
        return searchNextdoor(query, { headless: false, browser: 'edge' });
      }
      return { platform: 'Nextdoor', error: 'AUTOMATION_BLOCKED', fallbackRequired: true };
    }

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
    return { platform: 'Nextdoor', browserUsed: 'Microsoft Edge', query, count: results.length, results };
  } catch (err) {
    await browser.close();
    return { platform: 'Nextdoor', error: err.message };
  }
}

export async function searchFacebook(query = 'water heater flush', options = { headless: true, browser: 'edge' }) {
  if (!fs.existsSync(fbSession)) {
    return { error: 'No Facebook session found' };
  }

  const browser = await chromium.launch({
    executablePath: getBrowserPath(options.browser),
    headless: options.headless,
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
  });

  try {
    const context = await browser.newContext({ 
      storageState: fbSession,
      userAgent: DEFAULT_EDGE_USER_AGENT
    });
    const page = await context.newPage();
    const url = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Check for Facebook checkpoint or login wall
    if (page.url().includes('checkpoint') || page.url().includes('/login')) {
      console.warn('[AUTOMATION_DETECTED] Facebook challenged headless mode. Escalating to headed Microsoft Edge.');
      await browser.close();
      if (options.headless) {
        // Fallback: Retry with headed Microsoft Edge
        return searchFacebook(query, { headless: false, browser: 'edge' });
      }
      return { platform: 'Facebook', error: 'AUTOMATION_BLOCKED', fallbackRequired: true };
    }

    const results = await page.evaluate(() => {
      const items = [];
      const posts = document.querySelectorAll('div[role="feed"] div, div[role="article"]');
      posts.forEach(el => {
        const text = el.innerText || '';
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
    return { platform: 'Facebook', browserUsed: 'Microsoft Edge', query, count: results.length, results };
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
