const playwright = require('playwright')

const main = async () => {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage()

    await page.goto('https://www.masters.com/en_US/players/player_list.html')



    const els = await page.locator.allTextContents

    console.log('els', els)


    // const locator = page.locator('text="Tiger Woods"')
    // const isTiger = await locator.innerText()
    // console.log('isTiger', isTiger)


}

main()