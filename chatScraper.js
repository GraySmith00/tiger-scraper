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

  console.log('scoreCardUrls', scoreCardUrls);

  // Navigate to each score card URL and extract the score card information
  const scoreCards = [];
  for (let i = 0; i < scoreCardUrls.length; i++) {
    const scoreCardUrl = scoreCardUrls[i];
    const scoreCard = await getScorecard({
      page,
      url: scoreCardUrl,
    });

    console.log('scoreCard', scoreCard);
    // await page.goto(scoreCardUrl);

    // // Extract the score card information
    // const name = await page.$eval(
    //   '#contentContainer > div > h1',
    //   (h1) => h1.innerText
    // );
    // const location = await page.$eval(
    //   '#contentContainer > div > div.col-md-12.col-sm-12.col-xs-12.col-lg-12 > div:nth-child(1) > div > div > div > div.col-md-8.col-sm-8.col-xs-12.col-lg-8 > h4',
    //   (h4) => h4.innerText
    // );
    // const phone = await page.$eval(
    //   '#contentContainer > div > div.col-md-12.col-sm-12.col-xs-12.col-lg-12 > div:nth-child(1) > div > div > div > div.col-md-4.col-sm-4.col-xs-12.col-lg-4 > h4',
    //   (h4) => h4.innerText
    // );
    // // const website = await page.$eval('#contentContainer > div > div.col-md-12.col-sm-12.col-xs-12.col-lg-12 > div:nth-child(1) > div >
    // const address = await page.$eval(
    //   '#contentContainer > div > div.col-md-12.col-sm-12.col-xs-12.col-lg-12 > div:nth-child(1) > div > div > div > div.col-md-4.col-sm-4.col-xs-12.col-lg-4 > a',
    //   (a) => a.innerText
    // );
    // // Extract the hole information
    // const holes = await page.$$eval('#courseContainer > div > div', (divs) => {
    //   return divs.map((div) => {
    //     const holeNumber = div.querySelector(
    //       '.col-md-1.col-sm-1.col-xs-1.col-lg-1.text-center > h4'
    //     ).innerText;
    //     const holePar = div.querySelector(
    //       '.col-md-1.col-sm-1.col-xs-1.col-lg-1.text-center > h5'
    //     ).innerText;
    //     const holeYardage = div.querySelector(
    //       '.col-md-1.col-sm-1.col-xs-1.col-lg-1.text-center > h5'
    //     ).innerText;
    //     return {
    //       holeNumber: holeNumber,
    //       holePar: holePar,
    //       holeYardage: holeYardage,
    //     };
    //   });
    // });

    // const scoreCard = {
    //   name: name,
    //   location: location,
    //   phone: phone,
    //   website: website,
    //   address: address,
    //   holes: holes,
    // };
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

  // Find scorecard link
  await page.waitForSelector("a[href*='scorecard.cfm']");
  const linkText = await page.$eval(
    "a[href*='scorecard.cfm']",
    (el) => el.textContent
  );

  // Check if course has scrorecard
  if (linkText.trim() !== 'Scorecard (Yes)') {
    return {};
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

  const data = { ...frontData, ...backData };

  return data;
};

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url);

  const scoreCards = await getScoreCards(page);

  console.log(scoreCards);

  await browser.close();
})();
