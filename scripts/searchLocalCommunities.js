import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const SESSIONS_DIR = path.resolve(process.cwd(), 'sessions');
const fbSession = path.join(SESSIONS_DIR, 'facebook.json');
const ndSession = path.join(SESSIONS_DIR, 'nextdoor.json');

function getBrowserPath(preferred = 'edge') {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (preferred === 'edge' && fs.existsSync(edgePath)) return edgePath;
  if (fs.existsSync(edgePath)) return edgePath;
  if (fs.existsSync(chromePath)) return chromePath;
  throw new Error('Neither Edge nor Chrome browser found.');
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0';

/**
 * Deep-mine Nextdoor: specifically clicks the "Posts" tab and extracts comment replies & phone numbers
 */
export async function searchNextdoor(query, options = { headless: true }) {
  if (!fs.existsSync(ndSession)) {
    return { platform: 'Nextdoor', error: 'No Nextdoor session found' };
  }

  const browser = await chromium.launch({
    executablePath: getBrowserPath('edge'),
    headless: options.headless,
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
  });

  try {
    const context = await browser.newContext({
      storageState: ndSession,
      userAgent: DEFAULT_USER_AGENT
    });
    const page = await context.newPage();

    // Hydrate Nextdoor local neighborhood feed first
    await page.goto('https://nextdoor.com/news_feed/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);

    const searchUrl = `https://nextdoor.com/search/?query=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);

    // CRITICAL: Nextdoor defaults to sponsored ads. Explicitly click the "Posts" tab!
    try {
      const postsTab = page.getByRole('tab', { name: 'Posts' }).or(page.getByText('Posts', { exact: true })).first();
      await postsTab.waitFor({ state: 'visible', timeout: 6000 });
      await postsTab.click();
      await page.waitForTimeout(3500);
    } catch (e) {
      console.warn('Could not click Posts tab:', e.message);
    }

    // Select post bodies and comment threads (Nextdoor renders in div/p/article)
    const extracted = await page.evaluate(() => {
      const leads = [];
      const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
      const priceRegex = /\$(\d+)/;

      const elements = document.querySelectorAll('div, article, p, span');
      elements.forEach(el => {
        const text = el.innerText || '';
        if (text.length > 35 && text.length < 400 && !text.includes('Cookies') && !text.includes('Settings') && !text.includes('Terms')) {
          const phoneMatch = text.match(phoneRegex);
          const priceMatch = text.match(priceRegex);
          
          if (phoneMatch || text.toLowerCase().includes('cook') || text.toLowerCase().includes('recommend') || text.toLowerCase().includes('food')) {
            leads.push({
              text: text.slice(0, 300).replace(/\s+/g, ' '),
              phone: phoneMatch ? phoneMatch[0] : null,
              price: priceMatch ? `$${priceMatch[1]}` : null,
              hasContact: Boolean(phoneMatch || text.toLowerCase().includes('call') || text.toLowerCase().includes('dm') || text.toLowerCase().includes('contact'))
            });
          }
        }
      });

      // Filter and de-duplicate
      const unique = [];
      const seen = new Set();
      leads.forEach(l => {
        const key = l.text.slice(0, 45);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(l);
        }
      });

      unique.sort((a, b) => (b.hasContact ? 1 : 0) - (a.hasContact ? 1 : 0));
      return unique.slice(0, 6);
    });

    await browser.close();
    return { platform: 'Nextdoor', query, count: extracted.length, leads: extracted };
  } catch (err) {
    await browser.close();
    return { platform: 'Nextdoor', error: err.message };
  }
}

/**
 * Deep-mine Facebook posts & comments
 */
export async function searchFacebook(query, options = { headless: true }) {
  if (!fs.existsSync(fbSession)) {
    return { platform: 'Facebook', error: 'No Facebook session found' };
  }

  const browser = await chromium.launch({
    executablePath: getBrowserPath('edge'),
    headless: options.headless,
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
  });

  try {
    const context = await browser.newContext({
      storageState: fbSession,
      userAgent: DEFAULT_USER_AGENT
    });
    const page = await context.newPage();
    const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(4000);

    const extracted = await page.evaluate(() => {
      const leads = [];
      const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
      const priceRegex = /\$(\d+)/;

      const elements = document.querySelectorAll('div[role="feed"] div, div[role="article"]');
      elements.forEach(el => {
        const text = el.innerText || '';
        if (text.length > 35 && !text.startsWith('Facebook Facebook')) {
          const phoneMatch = text.match(phoneRegex);
          const priceMatch = text.match(priceRegex);

          leads.push({
            text: text.slice(0, 300).replace(/\s+/g, ' '),
            phone: phoneMatch ? phoneMatch[0] : null,
            price: priceMatch ? `$${priceMatch[1]}` : null,
            hasContact: Boolean(phoneMatch || text.toLowerCase().includes('message') || text.toLowerCase().includes('call'))
          });
        }
      });

      const unique = [];
      const seen = new Set();
      leads.forEach(l => {
        const key = l.text.slice(0, 40);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(l);
        }
      });

      unique.sort((a, b) => (b.hasContact ? 1 : 0) - (a.hasContact ? 1 : 0));
      return unique.slice(0, 6);
    });

    await browser.close();
    return { platform: 'Facebook', query, count: extracted.length, leads: extracted };
  } catch (err) {
    await browser.close();
    return { platform: 'Facebook', error: err.message };
  }
}

// Unified parallel scout
export async function scoutAllCommunities(query) {
  const [nextdoor, facebook] = await Promise.all([
    searchNextdoor(query),
    searchFacebook(query)
  ]);
  return { nextdoor, facebook };
}

// CLI runner
if (process.argv[1]?.endsWith('searchLocalCommunities.js')) {
  const q = process.argv[2] || 'cook';
  scoutAllCommunities(q).then(res => {
    console.log(JSON.stringify(res, null, 2));
  }).catch(console.error);
}
