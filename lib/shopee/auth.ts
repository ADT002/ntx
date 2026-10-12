import { createShopeeContext } from "./browser";
import {
    saveSession,
    loadSession,
    deleteSession,
} from "./session";

const SHOPEE_LOGIN_URL =
    "https://banhang.shopee.vn/account/signin";

const SHOPEE_HOME_URL =
    "https://banhang.shopee.vn/";

export async function loginShopee() {
    // Nếu có session cũ thì xóa trước
    await deleteSession();

    const context =
        await createShopeeContext();

    const page =
        await context.newPage();

    await page.goto(
        SHOPEE_LOGIN_URL,
        {
            waitUntil: "domcontentloaded",
        }
    );

    console.log(
        "Shopee login browser opened."
    );

    console.log(
        "Hãy đăng nhập Shopee trong browser..."
    );

    // Chờ user hoàn thành login
    await page.waitForURL(
        (url) =>
            !url.toString().includes(
                "/account/signin"
            ),
        {
            timeout: 60000,
        }
    );

    console.log(
        "Shopee login detected."
    );

    // Chờ thêm một chút để cookie/session được set
    await page.waitForTimeout(60000);

    const storageState =
        await context.storageState();

    await saveSession(
        storageState
    );

    console.log(
        "Shopee session saved."
    );

    await context.close();

    return {
        success: true,
        message:
            "Shopee login thành công",
    };
}

export async function checkShopeeSession() {
    const session =
        await loadSession();

    if (!session) {
        return {
            authenticated: false,
            message:
                "Chưa có Shopee session",
        };
    }

    const context =
        await createShopeeContext(
            session
        );

    const page =
        await context.newPage();

    try {
        await page.goto(
            SHOPEE_HOME_URL,
            {
                waitUntil:
                    "domcontentloaded",
                timeout: 30000,
            }
        );

        const currentUrl =
            page.url();

        const authenticated =
            !currentUrl.includes(
                "/account/signin"
            );

        return {
            authenticated,
            url: currentUrl,
        };
    } catch (error) {
        console.error(
            "Shopee session check error:",
            error
        );

        return {
            authenticated: false,
        };
    } finally {
        await context.close();
    }
}