const { chromium } = require('playwright');
const { getScoreCards } = require('./utils/getScoreCards');
const fs = require('fs');

const urls = [
  'https://www.greenskeeper.org/hawaii/golf_courses/',
  'https://www.greenskeeper.org/southern_california/golf_courses/',
  'https://www.greenskeeper.org/central_california/golf_courses/',
  'https://www.greenskeeper.org/northern_california/golf_courses/',
  'https://www.greenskeeper.org/southern_nevada/golf_courses/',
  'https://www.greenskeeper.org/arizona/golf_courses/',
  'https://www.greenskeeper.org/colorado/golf_courses/',
  'https://www.greenskeeper.org/new_mexico/golf_courses/',
  'https://www.greenskeeper.org/oregon/golf_courses/',
  'https://www.greenskeeper.org/texas/golf_courses/',
  'https://www.greenskeeper.org/washington/golf_courses/',
  'https://www.greenskeeper.org/south_florida/golf_courses/',
  'https://www.greenskeeper.org/central_florida/golf_courses/',
  'https://www.greenskeeper.org/north_florida/golf_courses/',
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let allScoreCards = [];

  for (let i = 0; i < 1; i++) {
    const url = urls[i];
    await page.goto(url);

    const scoreCards = await getScoreCards(page);

    allScoreCards = [...allScoreCards, ...scoreCards];
  }

  await fs.promises
    .writeFile(`data-${Date.now()}.json`, JSON.stringify(allScoreCards), 'utf8')
    .then(() => {
      console.log('File written successfully');
    })
    .catch((error) => console.log('Error while writing file', error));
})();
