export interface ParsedShopeeOrder {
    name: string;

    phone: string;

    address: string;

    province: string;

    district: string;

    orderCode: string;

    product: string;

    productPrice: number | null;

    orderSales: number | null;

    installationFee: number | null;

    shippingFee: number | null;

    totalAmount: number | null;

    cod: number | null;

    deliveryDate: string;
}

function parseMoney(
    value: string
): number | null {
    const cleaned =
        value.replace(
            /[^\d]/g,
            ""
        );

    if (!cleaned) {
        return null;
    }

    return Number(cleaned);
}

function parseAddress(
    address: string
) {
    const provinceMatch =
        address.match(
            /\b(Tỉnh|Thành phố)\s+([^,]+?)(?=,|$)/i
        );

    const districtMatch =
        address.match(
            /\b(Phường|Xã|Thị trấn|Quận|Huyện|Thị xã)\s+([^,]+?)(?=,|$)/i
        );

    const province =
        provinceMatch
            ? `${provinceMatch[1]} ${provinceMatch[2]}`
                .trim()
            : "";

    const district =
        districtMatch
            ? `${districtMatch[1]} ${districtMatch[2]}`
                .trim()
            : "";

    return {
        province,
        district,
    };
}

function parseCustomer(
    line: string
) {
    const match =
        line.match(
            /^(.+?),\s*(\d{9,15})$/
        );

    if (!match) {
        return {
            name: "",
            phone: "",
        };
    }

    return {
        name: match[1].trim(),

        phone: match[2].trim(),
    };
}

export function parseShopeeOrder(
    text: string,

    finalAmountText: string,

    subtotalText: string
): ParsedShopeeOrder {
    const lines =
        text
            .split("\n")
            .map((line) =>
                line.trim()
            )
            .filter(Boolean);

    /*
     * ==============================
     * CUSTOMER
     * ==============================
     */

    const customer =
        parseCustomer(
            lines[0] || ""
        );

    /*
     * ==============================
     * ADDRESS
     * ==============================
     */

    const address =
        lines[1] || "";

    const {
        province,
        district,
    } = parseAddress(
        address
    );

    /*
     * ==============================
     * ORDER CODE
     * ==============================
     */

    const orderCode =
        lines[2] || "";

    /*
     * ==============================
     * PRODUCT
     * ==============================
     */

    const product =
        lines[3] || "";

    /*
     * ==============================
     * FINAL AMOUNT
     * ==============================
     */

    const productPrice =
        parseMoney(
            finalAmountText
        );

    /*
     * ==============================
     * ORDER SALES
     * ==============================
     */

    const orderSales =
        parseMoney(
            subtotalText
        );

    /*
     * ==============================
     * INSTALLATION
     * ==============================
     */

    const installationMatch =
        text.match(
            /phí\s+lắp\s+đặt\s+([\d.,]+)\s*k?/i
        );

    const installationFee =
        installationMatch
            ? parseMoney(
                installationMatch[1]
            )! *
            (
                /k/i.test(
                    installationMatch[0]
                )
                    ? 1000
                    : 1
            )
            : null;

    /*
     * ==============================
     * SHIPPING FEE
     * ==============================
     */

    const shippingMatch =
        text.match(
            /phí\s+(?:vc|vận chuyển)\s+([\d.,]+)\s*k?/i
        );

    const shippingFee =
        shippingMatch
            ? parseMoney(
                shippingMatch[1]
            )! *
            (
                /k/i.test(
                    shippingMatch[0]
                )
                    ? 1000
                    : 1
            )
            : null;

    /*
     * ==============================
     * TOTAL
     * ==============================
     */

    const totalMatch =
        text.match(
            /thu\s+([\d.,]+)/i
        );

    const totalAmount =
        totalMatch
            ? parseMoney(
                totalMatch[1]
            )
            : null;

    /*
     * ==============================
     * COD
     * ==============================
     */

    const codMatch =
        text.match(
            /còn\s+([\d.,]+)\s+thu\s+hộ/i
        );

    const cod =
        codMatch
            ? parseMoney(
                codMatch[1]
            )
            : null;

    /*
     * ==============================
     * DELIVERY DATE
     * ==============================
     */

    const deliveryMatch =
        text.match(
            /(\d{1,2}\/\d{1,2})\s+giao/i
        );

    const deliveryDate =
        deliveryMatch
            ? deliveryMatch[1]
            : "";

    return {
        name:
            customer.name,

        phone:
            customer.phone,

        address,

        province,

        district,

        orderCode,

        product,

        productPrice,

        orderSales,

        installationFee,

        shippingFee,

        totalAmount,

        cod,

        deliveryDate,
    };
}