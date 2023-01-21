const { chromium } = require('playwright');

const url = 'https://greenskeeper.org/colorado/golf_courses/';

const getScoreCards = async (page) => {
  // Wait for the page to load
  await page.waitForSelector('.groupList > div > div > a');

  // Extract the score card URLs from the page
  const scoreCardUrls = await page.$$eval(
    '.groupList > div > div > a',
    (links) => links.map((link) => link.href)
  );

  // Navigate to each score card URL and extract the score card information
  const scoreCards = [];
  for (let i = 0; i < scoreCardUrls.length; i++) {
    const scoreCardUrl = scoreCardUrls[i];
    const scoreCard = await getScorecard({
      page,
      url: scoreCardUrl,
    });

    scoreCards.push(scoreCard);
  }

  return scoreCards;
};

const getChunks = (arr, size) => {
  const result = [];
  let chunkArr = [];

  for (let i = 0; i < arr.length; i++) {
    if (chunkArr.length === size) {
      result.push(chunkArr);
      chunkArr = [];
    }
    chunkArr.push(arr[i]);
  }

  result.push(chunkArr);

  return result;
};

const cleanData = (arr, backNine) => {
  const chunks = getChunks(arr, 10);
  const baseObj = {};
  if (backNine) {
    for (let i = 10; i < 19; i++) {
      baseObj[i] = {};
    }
  } else {
    for (let i = 1; i < 10; i++) {
      baseObj[i] = {};
    }
  }

  const data = chunks.reduce((acc, row) => {
    row.forEach((el, i) => {
      if (i === 0) {
        Object.keys(acc).forEach(
          (key) => (acc[key] = { ...acc[key], [el]: {} })
        );
      } else {
        if (backNine) {
          acc[i + 9][row[0]] = el;
        } else {
          acc[i][row[0]] = el;
        }
      }
    });
    return acc;
  }, baseObj);

  return data;
};

const getScorecard = async ({ page, url }) => {
  await page.goto(url);
  await page.waitForLoadState();

  // Get name
  const name = await page.$eval(
    '#gcheader-i > div > div > p',
    (el) => el.textContent
  );

  // Get city, state, zip, phone
  const addPhoneCombo = await page.$eval('.address > p', (el) => el.innerHTML);
  const [city, stateZip] = addPhoneCombo.split('<br>')[1].split(',');
  const [state, zip] = stateZip.trim().split(' ');
  const phone = addPhoneCombo.split(' •	')[1];

  // Find scorecard link
  await page.waitForSelector("a[href*='scorecard.cfm']");
  const linkText = await page.$eval(
    "a[href*='scorecard.cfm']",
    (el) => el.textContent
  );

  // Check if course has scrorecard
  if (linkText.trim() !== 'Scorecard (Yes)') {
    return {
      name,
      phone,
      city,
      state,
      zip,
    };
  }

  // If has scorecard, get link el
  const scorecardLink = page.locator('a', {
    hasText: ' Scorecard (Yes)',
  });

  await scorecardLink.click();
  await page.waitForLoadState();

  const frontRows = await page
    .locator('#gcscorecard table:nth-child(3) tbody tr td')
    .allInnerTexts();
  const frontData = cleanData(frontRows);

  const backRows = await page
    .locator('#gcscorecard table:nth-child(4) tbody tr td')
    .allInnerTexts();

  const backData = cleanData(backRows, true);

  const holes = { ...frontData, ...backData };

  return {
    name,
    phone,
    city,
    state,
    zip,
    holes,
  };
};

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // await page.goto(url);

  // const scoreCards = await getScoreCards(page);

  // console.log(scoreCards);

  await browser.close();
})();
