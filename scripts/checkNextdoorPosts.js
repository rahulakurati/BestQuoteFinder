import path from 'path';
import { chromium } from 'playwright-core';

const sessionFile = path.resolve(process.cwd(), 'sessions/nextdoor.json');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const context = await browser.newContext({ storageState: sessionFile });
  const page = await context.newPage();

  // First check what neighborhood is associated with this account
  await page.goto('https://nextdoor.com/news_feed/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  const feedTitle = await page.title();
  console.log('Nextdoor Session Title / Neighborhood:', feedTitle);

  const queries = ['cook', 'indian cook', 'home cook', 'tiffin'];
  for (const q of queries) {
    console.log(`\n=== Query: "${q}" ===`);
    await page.goto(`https://nextdoor.com/search/?query=${encodeURIComponent(q)}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(4000);

    const data = await page.evaluate(() => {
      const posts = [];
      const elements = document.querySelectorAll('article, [data-testid="post-body"], [data-testid="search-result-item"], [role="article"]');
      elements.forEach(el => {
        const text = el.innerText || '';
        if (text.length > 25 && !text.includes('Cookies') && !text.includes('Privacy')) {
          posts.push(text.slice(0, 240).replace(/\s+/g, ' '));
        }
      });
      return posts.slice(0, 5);
    });

    console.log(`Results count: ${data.length}`);
    data.forEach((p, i) => console.log(`  [${i + 1}] ${p}`));
  }

  await browser.close();
}

run().catch(console.error);
