const { chromium } = require("playwright");
const fs = require("fs");

const getScoreCards = async (page) => {
  // Wait for the page to load
  await page.waitForSelector(".groupList > div > div > a");

  // Extract the score card URLs from the page
  const scoreCardUrls = await page.$$eval(
    ".groupList > div > div > a",
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
  console.log("url", url);
  try {
    await page.goto(url);
    await page.waitForLoadState();

    // Get name
    const name = await page
      .$eval("#gcheader-i > div > div > p", (el) => el.textContent)
      .catch((error) => {
        console.log("error", error);
        return "";
      });

    // Get city, state, zip, phone
    const addPhoneCombo = await page
      .$eval(".address > p", (el) => el.innerHTML)
      .catch((error) => {
        console.log("error", error);
        return "";
      });
    const [city, stateZip] = addPhoneCombo.split("<br>")[1].split(",");
    const [state, zip] = stateZip.trim().split(" ");
    const phone = addPhoneCombo.split(" •	")[1];

    // Get website
    const website = await page
      .$eval(".local-links a", (el) => el.href)
      .catch((error) => {
        console.log("error", error);
        return "";
      });

    // Find scorecard link
    await page.waitForSelector("a[href*='scorecard.cfm']");
    const linkText = await page
      .$eval("a[href*='scorecard.cfm']", (el) => el.textContent)
      .catch((error) => {
        console.log("error", error);
        return "";
      });

    // Check if course has scrorecard
    if (linkText.trim() !== "Scorecard (Yes)") {
      return {
        name,
        phone,
        city,
        state,
        zip,
        website,
        holes: [],
      };
    }

    // If has scorecard, get link el
    const scorecardLink = page.locator("a", {
      hasText: " Scorecard (Yes)",
    });

    await scorecardLink.click();
    await page.waitForLoadState();

    const frontRows = await page
      .locator("#gcscorecard table:nth-child(3) tbody tr td")
      .allInnerTexts();
    const frontData = cleanData(frontRows);

    const backRows = await page
      .locator("#gcscorecard table:nth-child(4) tbody tr td")
      .allInnerTexts();

    const backData = cleanData(backRows, true);

    const holes = { ...frontData, ...backData };

    const scorecard = {
      name,
      phone,
      city,
      state,
      zip,
      website,
      holes,
    };

    return scorecard;
  } catch (error) {
    console.log("error", error);
    return {
      name: "",
      phone: "",
      city: "",
      state: "",
      zip: "",
      website: "",
      holes: [],
    };
  }
};

const urls = [
  // 'https://www.greenskeeper.org/hawaii/golf_courses/',
  "https://www.greenskeeper.org/southern_california/golf_courses/",
  // 'https://www.greenskeeper.org/central_california/golf_courses/',
  // 'https://www.greenskeeper.org/northern_california/golf_courses/',
  // 'https://www.greenskeeper.org/southern_nevada/golf_courses/',
  // 'https://www.greenskeeper.org/arizona/golf_courses/',
  // 'https://www.greenskeeper.org/colorado/golf_courses/',
  // 'https://www.greenskeeper.org/new_mexico/golf_courses/',
  // 'https://www.greenskeeper.org/oregon/golf_courses/',
  // 'https://www.greenskeeper.org/texas/golf_courses/',
  // 'https://www.greenskeeper.org/washington/golf_courses/',
  // 'https://www.greenskeeper.org/south_florida/golf_courses/',
  // 'https://www.greenskeeper.org/central_florida/golf_courses/',
  // 'https://www.greenskeeper.org/north_florida/golf_courses/',
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // await page.goto('https://www.greenskeeper.org/golf_courses/main.cfm');
  // const urls = await page.evaluate(() => {
  //   const anchors = Array.from(document.querySelectorAll('.gkglobalbody b a'));
  //   return anchors.map((a) => a.href);
  // });
  // console.log('urls', urls);

  let allScoreCards = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    await page.goto(url);

    const scoreCards = await getScoreCards(page);

    allScoreCards = [...allScoreCards, ...scoreCards];
  }

  console.log("allScoreCards.length", allScoreCards.length);
  console.log("allScoreCards[0]", allScoreCards[0]);
  console.log("allScoreCards[1]", allScoreCards[1]);

  fs.promises
    .writeFile(`data-${Date.now()}.json`, JSON.stringify(allScoreCards), "utf8")
    .then(() => {
      console.log("File written successfully");
    })
    .catch((error) => console.log("Error while writing file", error));

  await browser.close();
})();
