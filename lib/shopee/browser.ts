import { chromium, Browser, BrowserContext } from "playwright";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
    if (browser) {
        return browser;
    }

    browser = await chromium.launch({
        headless: false,
    });

    return browser;
}

export async function createShopeeContext(
    storageState?: string
): Promise<BrowserContext> {
    const browser = await getBrowser();

    const context = await browser.newContext({
        ...(storageState ? { storageState } : {}),

        viewport: {
            width: 1440,
            height: 900,
        },

        locale: "vi-VN",

        timezoneId: "Asia/Ho_Chi_Minh",
    });

    return context;
}

export async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}