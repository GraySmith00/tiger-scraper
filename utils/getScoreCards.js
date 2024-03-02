const { getScorecard } = require('./getScoreCard');

exports.getScoreCards = async (page) => {
  try {
    // Wait for the page to load
    await page
      .waitForSelector('.groupList > div > div > a')
      .catch((error) =>
        console.error('Error waiting for scorecards list to load: ', error)
      );

    // Extract the score card URLs from the page
    const scoreCardUrls = await page
      .$$eval('.groupList > div > div > a', (links) =>
        links.map((link) => link.href)
      )
      .catch((error) => console.error('Error getting scorecard URLs: ', error));

    // Use `Promise.all` to fetch all scorecards concurrently
    const scoreCards = await Promise.all(
      scoreCardUrls.map(async (url) => getScorecard({ page, url }))
    );
    return scoreCards;
  } catch (error) {
    console.error('Error getting scorecards list:', error);
    return [];
  }
};
