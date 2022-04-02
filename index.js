const playwright = require('playwright');

const main = async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36',
  });

  await page.goto('https://www.masters.com/en_US/players/player_list.html');

  const interval = setInterval(() => checkTiger(page), 30 * 60000);
};

const checkTiger = async (page) => {
  await page.waitForTimeout(3000);
  const title = await page.locator('.name').allInnerTexts();
  if (title && title.includes('Tiger Woods')) {
    console.log("Let's go Tigre!!!");
  } else if (title && title.length) {
    console.log('Sheeet wtf happened to Tigre');
  } else {
    console.log('We got an issue with the scraper');
  }
};

main();
