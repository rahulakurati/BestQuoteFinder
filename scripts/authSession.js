import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { chromium } from 'playwright-core';

const SESSIONS_DIR = path.resolve(process.cwd(), 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Find local browser binary
function getBrowserPath() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(chromePath)) return chromePath;
  if (fs.existsSync(edgePath)) return edgePath;
  throw new Error('Neither Chrome nor Edge was found at default locations.');
}

const PLATFORMS = {
  facebook: {
    name: 'Facebook',
    url: 'https://www.facebook.com/login',
    sessionFile: path.join(SESSIONS_DIR, 'facebook.json'),
    checkLogin: async (context) => {
      const cookies = await context.cookies();
      return cookies.some(c => c.name === 'c_user');
    }
  },
  thumbtack: {
    name: 'Thumbtack',
    url: 'https://www.thumbtack.com/login',
    sessionFile: path.join(SESSIONS_DIR, 'thumbtack.json'),
    checkLogin: async (context) => {
      const cookies = await context.cookies();
      return cookies.some(c => c.name.includes('session') || c.name.includes('auth') || c.name.includes('user'));
    }
  },
  nextdoor: {
    name: 'Nextdoor',
    url: 'https://nextdoor.com/login/',
    sessionFile: path.join(SESSIONS_DIR, 'nextdoor.json'),
    checkLogin: async (context, page) => {
      const url = page.url();
      if (!url.includes('/login') && (url.includes('/news_feed') || url.includes('/home') || url.includes('nextdoor.com/'))) {
        return true;
      }
      const cookies = await context.cookies();
      return cookies.some(c => c.name === 'sessionid' || c.name === 'auth_token');
    }
  },
  google: {
    name: 'Google',
    url: 'https://accounts.google.com/',
    sessionFile: path.join(SESSIONS_DIR, 'google.json'),
    checkLogin: async (context) => {
      const cookies = await context.cookies();
      return cookies.some(c => c.name === 'SID' || c.name === 'HSID');
    }
  }
};

async function authenticate(platformKey) {
  const target = PLATFORMS[platformKey];
  if (!target) {
    console.error(`Unknown platform: ${platformKey}. Available: facebook, thumbtack, google`);
    process.exit(1);
  }

  const browserPath = getBrowserPath();
  console.log(`\n========================================================================`);
  console.log(`  AUTHENTICATING: ${target.name}`);
  console.log(`========================================================================`);
  console.log(`Opening browser at: ${target.url}`);
  console.log(`Log into your ${target.name} account in the opened window.`);
  console.log(`Once you are logged in, this script will automatically save your session.`);
  console.log(`------------------------------------------------------------------------\n`);

  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  await page.goto(target.url);

  console.log(`Waiting for login completion... (Press ENTER here once you're logged in if not detected automatically)`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Watch for login via cookies or manual enter
  const waitForAuth = new Promise((resolve) => {
    rl.on('line', () => {
      resolve('manual');
    });

    const interval = setInterval(async () => {
      try {
        const loggedIn = await target.checkLogin(context, page);
        if (loggedIn) {
          clearInterval(interval);
          resolve('auto');
        }
      } catch (e) {
        // ignore page closing errors
      }
    }, 2000);
  });

  await waitForAuth;
  rl.close();

  // Save session state (cookies + local storage)
  await context.storageState({ path: target.sessionFile });
  console.log(`\n[SUCCESS] Session saved to: ${target.sessionFile}`);
  console.log(`(This file is in .gitignore and will NEVER be committed to Git)`);

  await browser.close();
  console.log(`\nConnection established! ${target.name} searches are now unlocked.\n`);
}

const arg = process.argv[2] || 'facebook';
authenticate(arg).catch(err => {
  console.error('Error during authentication:', err);
  process.exit(1);
});
