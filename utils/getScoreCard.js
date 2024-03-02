const { cleanData } = require('./cleanData');

exports.getScorecard = async ({ page, url }) => {
  console.log('url', url);
  await page.goto(url).catch((error) => console.error(error));
  await page.waitForLoadState().catch((error) => console.error(error));

  // Get name
  const name = await page
    .$eval('#gcheader-i > div > div > p', (el) => el.textContent)
    .catch((error) => {
      console.error('Error getting name:', error);
      return '';
    });

  // Get city, state, zip, phone
  const addPhoneCombo = await page
    .$eval('.address > p', (el) => el.innerHTML)
    .catch((error) => {
      console.error('Error getting address and phone:', error);
      return '';
    });
  const [city, stateZip] = addPhoneCombo.split('<br>')[1].split(',');
  const [state, zip] = stateZip.trim().split(' ');
  const phone = addPhoneCombo.split(' •	')[1];

  // Get website
  const website = await page
    .$eval('.local-links a', (el) => el.href)
    .catch((error) => {
      console.error('Error getting website:', error);
      return '';
    });

  // Find scorecard link
  const scorecardLink = await page
    .locator("a[href*='scorecard.cfm']")
    .catch((error) => {
      console.error('Error getting scorecard link:', error);
      return '';
    });
  const linkText = await scorecardLink.innerText();

  // Check if course has scrorecard
  if (linkText.trim() !== 'Scorecard (Yes)') {
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
  await scorecardLink.click();
  await page.waitForLoadState();

  const frontRows = await page
    .locator('#gcscorecard table:nth-child(3) tbody tr td')
    .allInnerTexts()
    .catch((error) => {
      console.error('Error getting front rows:', error);
      return '';
    });
  const frontData = cleanData(frontRows);

  const backRows = await page
    .locator('#gcscorecard table:nth-child(4) tbody tr td')
    .allInnerTexts()
    .catch((error) => {
      console.error('Error getting back rows:', error);
      return '';
    });

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
};
