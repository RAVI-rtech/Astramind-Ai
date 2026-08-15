const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    await browser.close();
    console.log("Puppeteer works");
  } catch (e) {
    console.error("Puppeteer failed", e);
  }
})();
