import { createShopeeContext } from "./browser";
import { loadSession } from "./session";

export interface ShopeeRawOrder {
    url: string;

    orderCode: string;

    name: string;
    phone: string;
    address: string;

    finalAmount: number | null;
    subtotal: number | null;
}

// =========================
// PARSE MONEY
// =========================

function parseMoney(value: string): number | null {
    if (!value) {
        return null;
    }

    const number = Number(
        value.replace(/[^\d]/g, "")
    );

    return Number.isNaN(number)
        ? null
        : number;
}

export async function getShopeeOrder(
    orderUrl: string
): Promise<ShopeeRawOrder> {

    const session = await loadSession();

    if (!session) {
        throw new Error(
            "SHOPEE_NOT_AUTHENTICATED"
        );
    }

    const context =
        await createShopeeContext(session);

    const page =
        await context.newPage();

    try {

        // =========================
        // OPEN ORDER
        // =========================

        await page.goto(orderUrl, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });

        /*
         * Chờ Shopee render Vue
         */
        await page.waitForSelector(
            '[data-testid="odp-order-summary"]',
            {
                timeout: 30000,
            }
        );

        // Chờ thêm một chút để các component
        // tiền / remote-component render đầy đủ
        await page.waitForTimeout(2000);

        // =========================
        // KIỂM TRA LOGIN
        // =========================

        const currentUrl = page.url();

        if (
            currentUrl.includes(
                "/account/signin"
            )
        ) {
            throw new Error(
                "SHOPEE_SESSION_EXPIRED"
            );
        }

        // =========================
        // MÃ ĐƠN
        // =========================

        const orderCode =
            await page
                .locator(
                    '[data-testid="odp-label-order-id"] .body'
                )
                .innerText()
                .catch(() => "");

        // =========================
        // KHÁCH HÀNG
        // =========================

        const buyerText =
            await page
                .locator(
                    '[data-testid="odp-label-address"] .buyer-contact-information'
                )
                .innerText()
                .catch(() => "");

        /*
         * Ví dụ:
         *
         * Võ ngọc Phượng, 84833363838
         */

        const buyerMatch =
            buyerText.match(
                /^(.+?),\s*(\d+)$/
            );

        const name =
            buyerMatch
                ? buyerMatch[1].trim()
                : "";

        const phone =
            buyerMatch
                ? buyerMatch[2].trim()
                : "";

        // =========================
        // ĐỊA CHỈ
        // =========================

        const address =
            await page
                .locator(
                    '[data-testid="odp-label-address"] .ship-address'
                )
                .innerText()
                .catch(() => "");

        // =========================
        // SỐ TIỀN CUỐI CÙNG
        // =========================

        /*
         * HTML thực tế:
         *
         * <div class="cardStyle" type="FinalAmount">
         *
         *     <div class="card-title">
         *         Số tiền cuối cùng
         *     </div>
         *
         *     <div class="amount">
         *         ₫4.563.215
         *     </div>
         *
         * </div>
         */

        const finalAmountText =
            await page
                .locator(
                    '.cardStyle[type="FinalAmount"] .amount'
                )
                .first()
                .innerText()
                .catch(() => "");

        const finalAmount =
            parseMoney(finalAmountText);



        // =========================
        // DOANH SỐ
        // =========================

        /*
         * HTML:
         *
         * <div class="subtotal">
         *     5.955.100
         * </div>
         */

        const subtotalText = await page
            .locator(".income-item.income-subtotal.strong")
            .filter({ hasText: "Tổng tiền sản phẩm" })
            .locator(".income-value")
            .innerText()
            .catch(() => "");

        const subtotal =
            parseMoney(subtotalText);

        // =========================
        // DEBUG
        // =========================

        console.log(
            "SHOPEE ORDER:",
            {
                orderCode:
                    orderCode.trim(),

                name,

                phone,

                address:
                    address.trim(),

                finalAmount,

                subtotal,
            }
        );

        // =========================
        // RETURN
        // =========================

        return {
            url: page.url(),

            orderCode: orderCode.trim(),

            name,
            phone,
            address: address.trim(),

            finalAmount,
            subtotal,
        };

    } finally {

        await context.close();

    }
}