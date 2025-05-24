require('dotenv').config();
const puppeteer = require('puppeteer-core');

async function getSkills(profileId /* string "hamzah-ali-…" */) {
  const BROWSER_PATH =
    process.env.CHROME_PATH ||
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    headless: true,                // change to false+devtools for debugging
    executablePath: BROWSER_PATH,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  // Spoof a normal UA
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/113.0.0.0 Safari/537.36'
  );

  // 1️⃣ Go to the login page
  await page.goto('https://www.linkedin.com/login', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // 2️⃣ Fill in email + password from your .env
  await page.type('#username', process.env.LINKEDIN_EMAIL,    { delay: 50 });
  await page.type('#password', process.env.LINKEDIN_PASSWORD, { delay: 50 });

  // 3️⃣ Click “Sign in” and wait for a known post-login element
  await Promise.all([
    page.click('button[type=submit]'),
    page.waitForSelector('nav.global-nav__primary-item', {
      timeout: 30000  // LinkedIn’s main nav only appears once logged in
    })
  ]);

  // 4️⃣ Now navigate to the target profile
  await page.goto(`https://www.linkedin.com/in/${profileId}`, {
    waitUntil: 'networkidle2',
    timeout:   60000
  });

  // 5️⃣ Wait for the skills section to load
  await page.waitForSelector('.pv-skill-category-entity__skill-wrapper', {
    timeout: 15000
  });

  // 6️⃣ Scrape out name + years
  const skills = await page.$$eval(
    '.pv-skill-category-entity__skill-wrapper',
    nodes => nodes.map(n => {
      const skill    = n.querySelector('.pv-skill-category-entity__name-text')?.innerText.trim() || null;
      const yearsTxt = n.querySelector('.pv-skill-category-entity__endorsement-count')?.innerText || '';
      const m        = yearsTxt.match(/(\d+)\+?\s*years?/i);
      return { skill, years: m ? parseInt(m[1], 10) : null };
    })
  );

  await browser.close();
  return skills;
}

module.exports = { getSkills };
