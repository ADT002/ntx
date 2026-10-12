import { chromium } from "playwright";

async function main() {
    const browser = await chromium.launch({
        headless: false,
    });

    const page = await browser.newPage();

    await page.goto("https://www.google.com");

    console.log("Playwright OK");

    await page.waitForTimeout(5000);

    await browser.close();
}

main();