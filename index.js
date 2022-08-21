const playwright = require('playwright');
require('dotenv').config();

const main = async () => {
  const browser = await playwright.chromium.launch({
    headless: false,
  });

  try {
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36',
    });

    await page.goto(
      'https://greenskeeper.org/colorado/Denver_North_Boulder_Fort_Collins/coal_creek_golf_course/'
    );
    await page.waitForLoadState();

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

    console.log('data', data);
  } catch (error) {
    console.log('error', error);
  }

  // getScorecard({
  //   page,

  //   url: 'https://greenskeeper.org/colorado/Denver_North_Boulder_Fort_Collins/coal_creek_golf_course/',
  // });

  // await page.goto('https://greenskeeper.org/colorado/golf_courses');
  // await page.waitForLoadState();
  // const links = await page.locator('.courseName a');
  // const count = await links.count();
  // console.log('count', count);

  // const text = await links.allTextContents();
  // console.log('text', text);
  // for (let i = 0; i < count; i++) {
  //   const link = links.nth(i);
  //   const text = await link.getAttribute('href');
  //   await page.bringToFront();

  //   try {
  //     const [newPage] = await Promise.all([
  //       context.waitForEvent('page', { timeout: 5000 }),
  //       links.nth(i).click({ modifiers: ['Control', 'Shift'] }),
  //     ]);
  //     console.log('newPage', newPage);
  //     await newPage.waitForLoadState();
  //     console.log('Title:', await newPage.title());
  //     console.log('URL: ', page.url());

  //     await newPage.close();
  //   } catch {
  //     continue;
  //   }
  // }

  await browser.close();
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

// const getScorecard = ({ page, url }) => {
//   await page.
// };

// const checkTiger = async (page) => {
//   await page.waitForTimeout(3000);
//   const title = await page.locator('.name').allInnerTexts();
//   if (title && title.includes('Tiger Woods')) {
//     console.log("Let's go Tigre!!!");
//   } else if (title && title.length) {
//     console.log('Sheeet wtf happened to Tigre');
//   } else {
//     console.log('We got an issue with the scraper');
//   }
// };

main();
