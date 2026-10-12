"use client";

import React, { useEffect, useState } from "react";

interface ParsedData {
    name: string;
    phone: string;
    address: string;

    province: string;
    district: string;

    orderCode: string;
    product: string;

    // Doanh thu đơn hàng ước tính
    productPrice: number | null;

    // Tổng tiền sản phẩm
    subtotal: number | null;

    // Chỉ nhập 1 trong 2
    shippingFee: number | null;
    installationFee: number | null;

    // productPrice + shippingFee / installationFee
    totalAmount: number | null;

    weight: number;
    packages: number;

    // Người dùng tự nhập
    cod: number | null;

    deliveryDate: string;
}

function NTX() {
    // =========================================================
    // TEXT ĐƠN HÀNG
    // =========================================================

    const [text, setText] = useState("");

    // =========================================================
    // SHIPPING
    // =========================================================

    const [weight, setWeight] = useState<number>(0);
    const [packages, setPackages] = useState<number>(1);
    const [cod, setCod] = useState("");

    // =========================================================
    // PARSED DATA
    // =========================================================

    const [data, setData] = useState<ParsedData | null>(null);

    // =========================================================
    // LOADING
    // =========================================================

    const [loading, setLoading] = useState(false);

    // =========================================================
    // SHOPEE
    // =========================================================

    const [shopeeUrl, setShopeeUrl] = useState("");
    const [shopeeLoading, setShopeeLoading] = useState(false);
    const [shopeeLoginLoading, setShopeeLoginLoading] =
        useState(false);

    const [shopeeAuthenticated, setShopeeAuthenticated] =
        useState(false);

    const [shopeeMessage, setShopeeMessage] =
        useState("");

    // =========================================================
    // API
    // =========================================================

    const apiUsername = process.env.NTX_API_USERNAME;
    const apiPassword = process.env.NTX_API_PASSWORD;

    // =========================================================
    // FORMAT MONEY
    // =========================================================

    function parseMoney(value: string): number {
        return Number(value.replace(/[^\d]/g, ""));
    }

    function formatMoney(value: number | null) {
        if (value === null || Number.isNaN(value)) {
            return "0";
        }

        return new Intl.NumberFormat("vi-VN").format(value);
    }

    // =========================================================
    // PARSE ADDRESS
    // =========================================================

    function parseAddress(address: string) {
        const provinceMatch = address.match(
            /\b(Tỉnh|Thành phố)\s+([^,]+?)(?=,|$)/i
        );

        const districtMatch = address.match(
            /\b(Phường|Xã|Thị trấn|Quận|Huyện|Thị xã)\s+([^,]+?)(?=,|$)/i
        );

        const province = provinceMatch
            ? `${provinceMatch[1]} ${provinceMatch[2]}`.trim()
            : "";

        const district = districtMatch
            ? `${districtMatch[1]} ${districtMatch[2]}`.trim()
            : "";

        return {
            province,
            district,
        };
    }

    // =========================================================
    // PARSE ORDER TEXT
    // =========================================================

    function parseOrderText(inputText: string) {
        const lines = inputText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length === 0) {
            alert("Vui lòng nhập thông tin đơn hàng");
            return;
        }

        // =====================================================
        // TÊN + SĐT
        // =====================================================

        const customerMatch = lines[0].match(
            /^(.+?),\s*(\d{9,15})$/
        );

        const name = customerMatch
            ? customerMatch[1].trim()
            : "";

        const phone = customerMatch
            ? customerMatch[2].trim()
            : "";

        // =====================================================
        // ADDRESS
        // =====================================================

        const address = lines[1] || "";

        const {
            province,
            district,
        } = parseAddress(address);

        // =====================================================
        // ORDER CODE
        // =====================================================

        const orderCode = lines[2] || "";

        // =====================================================
        // PRODUCT
        //
        // CHỈ LẤY THÔNG TIN BAN ĐẦU
        // USER CÓ THỂ SỬA SAU
        // =====================================================

        const product = lines[3] || "";

        // =====================================================
        // MONEY
        // =====================================================

        const moneyMatches =
            inputText.match(
                /\b\d{1,3}(?:\.\d{3})+\b/g
            ) || [];

        const moneyValues =
            moneyMatches.map(parseMoney);

        // =====================================================
        // TIỀN HÀNG
        // =====================================================

        const productPrice =
            moneyValues.length > 0
                ? moneyValues[0]
                : null;

        // =====================================================
        // PHÍ VẬN CHUYỂN
        // =====================================================

        const shippingMatch =
            inputText.match(
                /phí\s*(?:vc|vận chuyển)[^\d]*([\d.,]+)\s*k?/i
            );

        let shippingFee: number | null = null;

        if (shippingMatch) {
            shippingFee =
                parseMoney(shippingMatch[1]) *
                (/k/i.test(shippingMatch[0])
                    ? 1000
                    : 1);
        }

        // =====================================================
        // PHÍ LẮP ĐẶT
        // =====================================================

        const installationMatch =
            inputText.match(
                /phí\s+lắp\s+đặt\s+([\d.,]+)\s*k?/i
            );

        let installationFee: number | null = null;

        if (installationMatch) {
            installationFee =
                parseMoney(
                    installationMatch[1]
                ) *
                (/k/i.test(
                    installationMatch[0]
                )
                    ? 1000
                    : 1);
        }

        // =====================================================
        // TỔNG THU
        // =====================================================

        const totalMatch =
            inputText.match(
                /(?:thu|tổng thu|tổng tiền)[^\d]*([\d.,]+)/i
            );

        const totalAmount =
            totalMatch
                ? parseMoney(
                    totalMatch[1]
                )
                : null;

        const subtotal =
            totalMatch
                ? parseMoney(
                    totalMatch[1]
                )
                : null;

        // =====================================================
        // COD
        //
        // ƯU TIÊN:
        // "Còn 300k thu hộ"
        // =====================================================

        const codMatch =
            inputText.match(
                /(?:còn|cod)[^\d]*([\d.,]+)\s*k?\s*(?:thu hộ)?/i
            );

        let parsedCod: number | null =
            null;

        if (codMatch) {
            parsedCod =
                parseMoney(
                    codMatch[1]
                ) *
                (/k/i.test(
                    codMatch[0]
                )
                    ? 1000
                    : 1);
        }

        // =====================================================
        // DELIVERY DATE
        // =====================================================

        const deliveryMatch =
            inputText.match(
                /(\d{1,2}\/\d{1,2})\s+giao/i
            );

        const deliveryDate =
            deliveryMatch
                ? deliveryMatch[1]
                : "";

        // =====================================================
        // SET DATA
        // =====================================================

        const newData: ParsedData = {
            name,
            phone,
            address,

            province,
            district,

            orderCode,
            product,

            productPrice,
            shippingFee,
            installationFee,
            totalAmount,
            subtotal,
            weight,
            packages,


            cod:
                parsedCod !== null
                    ? parsedCod
                    : cod
                        ? parseMoney(cod)
                        : null,

            deliveryDate,
        };

        setData(newData);

        // Đồng bộ COD input
        if (
            newData.cod !== null
        ) {
            setCod(
                String(newData.cod)
            );
        }
    }

    // =========================================================
    // PHÂN TÍCH ĐƠN HÀNG
    // =========================================================

    function parseData() {
        parseOrderText(text);
    }

    // =========================================================
    // SHOPEE LOGIN
    // =========================================================

    async function loginShopee() {
        setShopeeLoginLoading(true);

        setShopeeMessage(
            "Đang mở trình duyệt Shopee..."
        );

        try {
            const response =
                await fetch(
                    "/api/shopee/auth",
                    {
                        method: "POST",
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result?.message ||
                    "Đăng nhập Shopee thất bại"
                );
            }

            setShopeeAuthenticated(
                true
            );

            setShopeeMessage(
                "Đăng nhập Shopee thành công."
            );
        } catch (error) {
            console.error(
                "Shopee login error:",
                error
            );

            setShopeeAuthenticated(
                false
            );

            setShopeeMessage(
                error instanceof Error
                    ? error.message
                    : "Đăng nhập Shopee thất bại"
            );
        } finally {
            setShopeeLoginLoading(
                false
            );
        }
    }

    // =========================================================
    // CHECK SESSION
    // =========================================================

    async function checkShopeeSession() {
        try {
            const response =
                await fetch(
                    "/api/shopee/auth-status"
                );

            const result =
                await response.json();

            const authenticated =
                result?.authenticated === true;

            setShopeeAuthenticated(
                authenticated
            );

            if (authenticated) {
                setShopeeMessage(
                    "Shopee đang đăng nhập."
                );
            }

            return authenticated;
        } catch (error) {
            console.error(
                "Check Shopee session error:",
                error
            );

            setShopeeAuthenticated(
                false
            );

            return false;
        }
    }

    // =========================================================
    // CHECK SESSION KHI MỞ TRANG
    // =========================================================

    useEffect(() => {
        checkShopeeSession();
    }, []);

    // =========================================================
    // CRAWL SHOPEE
    // =========================================================

    async function crawlShopeeOrder() {
        if (!shopeeUrl.trim()) {
            alert(
                "Vui lòng nhập link đơn hàng Shopee"
            );
            return;
        }

        // =====================================================
        // CHECK LOGIN
        // =====================================================

        const authenticated =
            await checkShopeeSession();

        if (!authenticated) {
            alert(
                "Bạn chưa đăng nhập Shopee.\n\nHãy bấm 'Đăng nhập Shopee' trước."
            );

            return;
        }

        setShopeeLoading(true);

        setShopeeMessage(
            "Đang mở đơn hàng Shopee..."
        );

        try {
            const response =
                await fetch(
                    "/api/shopee/order",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            url: shopeeUrl.trim(),
                        }),
                    }
                );

            const result =
                await response.json();

            // =================================================
            // SESSION EXPIRED
            // =================================================

            if (
                result?.code ===
                "SHOPEE_SESSION_EXPIRED" ||
                result?.code ===
                "SHOPEE_NOT_AUTHENTICATED"
            ) {
                setShopeeAuthenticated(
                    false
                );

                throw new Error(
                    "Session Shopee đã hết hạn. Hãy đăng nhập lại."
                );
            }

            if (
                !response.ok
            ) {
                throw new Error(
                    result?.message ||
                    "Không thể crawl đơn Shopee"
                );
            }

            // =================================================
            // LẤY TEXT CRAWL
            // =================================================

            let crawledText = "";
            /*
             * API nên trả:
             *
             * {
             *   success: true,
             *   data: {...},
             *   text: "..."
             * }
             */

            if (
                typeof result?.text ===
                "string"
            ) {
                crawledText =
                    result.text;
            }

            // =================================================
            // FALLBACK
            //
            // Nếu API hiện tại chỉ trả data
            // thì tạo lại text
            // =================================================

            if (
                !crawledText &&
                result?.data
            ) {
                const parsed =
                    result.data;

                crawledText = [
                    `${parsed.name || ""}, ${parsed.phone || ""
                    }`,
                    parsed.address || "",
                    parsed.orderCode || "",
                    parsed.product || "",
                    "\n",
                    parsed.finalAmount
                        ? formatMoney(
                            parsed.finalAmount
                        )
                        : "",
                    parsed.shippingFee
                        ? `Phí vc ${parsed.shippingFee}`
                        : "",
                    parsed.installationFee
                        ? `Phí lắp đặt ${parsed.installationFee}`
                        : "",
                    parsed.totalAmount
                        ? `Thu ${parsed.totalAmount}`
                        : "",
                    cod
                        ? `Còn ${cod} thu hộ`
                        : "",
                    parsed.subtotal
                        ? `${parsed.subtotal}` : "",
                    parsed.deliveryDate
                        ? `${parsed.deliveryDate} giao`
                        : "",
                ]
                    .filter(Boolean)
                    .join("\n");
            }

            // =================================================
            // QUAN TRỌNG
            //
            // ĐỔ KẾT QUẢ CRAWL VÀO TEXTAREA
            // =================================================

            setText(
                crawledText
            );

            // =================================================
            // TỰ ĐỘNG PARSE
            // =================================================
            if (result?.data) {
                const parsed = result.data;

                const {
                    province,
                    district,
                } = parseAddress(
                    parsed.address || ""
                );

                const newData: ParsedData = {
                    name: parsed.name || "",
                    phone: parsed.phone || "",
                    address: parsed.address || "",
                    province,
                    district,
                    orderCode:
                        parsed.orderCode || "",
                    product: "",
                    // Shopee
                    productPrice:
                        parsed.finalAmount ?? null,
                    subtotal:
                        parsed.subtotal ?? null,
                    // Người dùng tự nhập
                    shippingFee: null,
                    installationFee: null,
                    // Ban đầu = giá tiền
                    totalAmount:
                        parsed.finalAmount ?? null,
                    weight,
                    packages,

                    // Người dùng tự nhập
                    cod: null,

                    deliveryDate: "",
                };

                setData(newData);

                setCod("");
            }

            setShopeeAuthenticated(
                true
            );

            setShopeeMessage(
                "Crawl thành công. Bạn có thể chỉnh sửa dữ liệu trong ô bên dưới."
            );
        } catch (error) {
            console.error(
                "Shopee crawl error:",
                error
            );

            setShopeeMessage(
                error instanceof Error
                    ? error.message
                    : "Crawl đơn hàng thất bại"
            );
        } finally {
            setShopeeLoading(
                false
            );
        }
    }

    // =========================================================
    // CREATE BILL
    // =========================================================

    async function createBill() {
        if (!data) {
            alert(
                "Chưa có dữ liệu đơn hàng"
            );
            return;
        }

        if (
            !weight ||
            weight <= 0
        ) {
            alert(
                "Vui lòng nhập số KG"
            );
            return;
        }

        if (
            !packages ||
            packages <= 0
        ) {
            alert(
                "Vui lòng nhập số kiện"
            );
            return;
        }

        if (
            data.cod === null
        ) {
            alert(
                "Vui lòng nhập tiền COD"
            );
            return;
        }

        if (!data.province) {
            alert(
                "Không tìm thấy Tỉnh/Thành phố"
            );
            return;
        }

        if (!data.district) {
            alert(
                "Không tìm thấy Phường/Xã/Quận/Huyện"
            );
            return;
        }

        setLoading(true);

        try {
            const payload = {
                partner_id: 39801,

                // =========================
                // NGƯỜI GỬI
                // =========================

                s_name:
                    "HOÀNG LÊ MỘC",

                s_phone:
                    "0862760909",

                s_address:
                    "B7 / 33 / 1 Đường Rạch Cầu Suối, Ấp 2",

                s_province:
                    "Hồ Chí Minh",

                s_district:
                    "Xã Vĩnh Lộc",

                s_ward: null,

                // =========================
                // NGƯỜI NHẬN
                // =========================

                r_name:
                    data.name,

                r_phone:
                    data.phone,

                r_address:
                    data.address,

                r_province:
                    data.province,

                r_district:
                    data.district,

                r_ward: null,

                // =========================
                // VẬN ĐƠN
                // =========================

                service: 2,

                payment_method: 11,

                cod_amount:
                    data.cod,

                weight:
                    data.weight,

                package_no:
                    data.packages,

                ref_code:
                    data.orderCode,

                // =========================
                // HÀNG HÓA
                // =========================

                cargo_content_id: 2,

                cargo_content:
                    data.product,

                cargo_value:
                    data.productPrice,

                // =========================
                // KÍCH THƯỚC
                // =========================

                length: 0,
                width: 0,
                height: 0,

                // =========================
                // NOTE
                // =========================

                note:
                    "Cho xem hàng. Đi giao có sự cố (hẻm nhỏ, cấm tải,..) liên hệ Mai Trần 0981302493 để xử lý. NN yêu cầu lên lầu thì tự thu phí NN.",

                utm_source:
                    "API_HLM",
            };

            console.log(
                "NTX PAYLOAD:",
                payload
            );

            const response =
                await fetch(
                    "/api/ntx/bill",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            username:
                                apiUsername ||
                                "",

                            password:
                                apiPassword ||
                                "",
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            const result =
                await response.json();

            console.log(
                "NTX RESULT:",
                result
            );

            if (
                !response.ok
            ) {
                alert(
                    result?.message ||
                    "Tạo vận đơn thất bại"
                );

                return;
            }

            alert(
                "Tạo vận đơn NTX thành công"
            );
        } catch (error) {
            console.error(
                "Create bill error:",
                error
            );

            alert(
                "Có lỗi khi tạo vận đơn"
            );
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // UPDATE DATA
    // =========================================================

    function updateData(
        field: keyof ParsedData,
        value: any
    ) {
        setData(
            (prev) =>
                prev
                    ? {
                        ...prev,
                        [field]:
                            value,
                    }
                    : prev
        );
    }

    // =========================================================
    // RETURN
    // =========================================================

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-6xl">

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-lg font-bold text-white">
                            N
                        </div>

                        <div>

                            <h1 className="text-2xl font-bold text-slate-900">
                                NTX Parser
                            </h1>

                            <p className="text-sm text-slate-500">
                                Shopee → NTX
                            </p>

                        </div>

                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">

                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        NTX API Ready

                    </div>

                </div>

                {/* ================================================= */}
                {/* SHOPEE */}
                {/* ================================================= */}

                <div className="mb-6 rounded-2xl border border-orange-200 bg-white shadow-sm">

                    <div className="border-b border-orange-100 bg-orange-50/60 px-6 py-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 font-bold text-white">
                                    S
                                </div>

                                <div>

                                    <h2 className="font-semibold text-slate-900">
                                        Shopee Crawler
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Đăng nhập và lấy thông tin đơn hàng
                                    </p>

                                </div>

                            </div>

                            <div
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${shopeeAuthenticated
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-100 text-slate-500"
                                    }`}
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${shopeeAuthenticated
                                        ? "bg-emerald-500"
                                        : "bg-slate-400"
                                        }`}
                                />
                                {shopeeAuthenticated
                                    ? "Shopee đã đăng nhập"
                                    : "Chưa đăng nhập"}
                            </div>

                        </div>

                    </div>

                    <div className="p-6">

                        {/* LOGIN */}

                        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <p className="font-medium text-slate-800">
                                    Tài khoản Shopee
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Đăng nhập một lần. Session sẽ được lưu để sử dụng cho các lần crawl sau.
                                </p>

                            </div>

                            <button
                                onClick={
                                    loginShopee
                                }
                                disabled={
                                    shopeeLoginLoading
                                }
                                className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {shopeeLoginLoading
                                    ? "Đang mở Shopee..."
                                    : shopeeAuthenticated
                                        ? "Đăng nhập lại"
                                        : "Đăng nhập Shopee"}
                            </button>

                        </div>

                        {/* URL */}

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Link đơn hàng Shopee
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            <input
                                type="url"
                                value={
                                    shopeeUrl
                                }
                                onChange={(e) =>
                                    setShopeeUrl(
                                        e.target.value
                                    )
                                }
                                placeholder="Dán link đơn hàng Shopee vào đây..."
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10"
                            />

                            <button
                                onClick={
                                    crawlShopeeOrder
                                }
                                disabled={
                                    shopeeLoading
                                }
                                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                                {shopeeLoading
                                    ? "Đang crawl..."
                                    : "Crawl đơn hàng"}
                            </button>

                        </div>

                        {shopeeMessage && (
                            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                {shopeeMessage}
                            </div>
                        )}

                    </div>

                </div>

                {/* ================================================= */}
                {/* SHIPPING INPUT */}
                {/* ================================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-100 px-6 py-5">

                        <h2 className="font-semibold text-slate-900">
                            Thông tin vận chuyển
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Những thông tin này có thể chỉnh sửa trước khi tạo vận đơn.
                        </p>

                    </div>

                    <div className="grid gap-5 p-6 md:grid-cols-3">

                        {/* KG */}

                        <div>

                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Số KG
                            </label>

                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                    weight ||
                                    ""
                                }
                                onChange={(e) => {
                                    const value =
                                        e.target
                                            .valueAsNumber;

                                    setWeight(
                                        Number.isNaN(
                                            value
                                        )
                                            ? 0
                                            : value
                                    );

                                    setData(
                                        (prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    weight:
                                                        Number.isNaN(
                                                            value
                                                        )
                                                            ? 0
                                                            : value,
                                                }
                                                : prev
                                    );
                                }}
                                placeholder="10"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-black focus:bg-white"
                            />

                        </div>

                        {/* PACKAGES */}

                        <div>

                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Số kiện
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={
                                    packages
                                }
                                onChange={(e) => {
                                    const value =
                                        e.target
                                            .valueAsNumber;

                                    const newValue =
                                        Number.isNaN(
                                            value
                                        )
                                            ? 1
                                            : value;

                                    setPackages(
                                        newValue
                                    );

                                    setData(
                                        (prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    packages:
                                                        newValue,
                                                }
                                                : prev
                                    );
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-black focus:bg-white"
                            />

                        </div>

                        {/* COD */}

                        <div>

                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                COD
                            </label>

                            <input
                                type="text"
                                value={
                                    cod
                                }
                                onChange={(e) => {
                                    const value =
                                        e.target
                                            .value;

                                    setCod(
                                        value
                                    );

                                    setData(
                                        (prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    cod:
                                                        value
                                                            ? parseMoney(
                                                                value
                                                            )
                                                            : null,
                                                }
                                                : prev
                                    );
                                }}
                                placeholder="300000"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-black focus:bg-white"
                            />

                        </div>

                    </div>

                </div>

                {/* ================================================= */}
                {/* ORDER TEXT */}
                {/* ================================================= */}

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-100 px-6 py-5">

                        <div className="flex items-center justify-between">

                            <div>

                                <h2 className="font-semibold text-slate-900">
                                    Dữ liệu đơn hàng
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Crawl Shopee sẽ tự động đưa dữ liệu vào đây. Bạn có thể sửa trước khi phân tích.
                                </p>

                            </div>

                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                                Editable
                            </span>

                        </div>

                    </div>

                    <div className="p-6">

                        <textarea
                            value={
                                text
                            }
                            onChange={(e) =>
                                setText(
                                    e.target.value
                                )
                            }
                            rows={15}
                            placeholder={`Dán dữ liệu đơn hàng hoặc crawl từ Shopee...

                            Ví dụ:

                            Võ ngọc Phượng, 84833363838
                            Cafe Mùa Xuân, 53 Phùng Hưng, Phường Nam Nha Trang, Tỉnh Khánh Hòa
                            261007144FKHKF
                            Giường Bánh mì ,1m8x2m,bọc mã FP 25059-4
                            4.563.215
                            Phí vc 300k
                            THu 4.863.215
                            Còn 300k thu hộ
                            5.955.100`}
                            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10"
                        />

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between">

                            <button
                                onClick={() =>
                                    setText(
                                        ""
                                    )
                                }
                                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Xóa dữ liệu
                            </button>

                            <button
                                onClick={
                                    parseData
                                }
                                className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Phân tích đơn hàng
                            </button>

                        </div>

                    </div>

                </div>

                {/* ================================================= */}
                {/* RESULT */}
                {/* ================================================= */}

                {data && (
                    <div className="mt-6 space-y-6">

                        <div className="flex items-center justify-between">

                            <div>

                                <h2 className="text-xl font-bold text-slate-900">
                                    Kết quả phân tích
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Tất cả dữ liệu bên dưới đều có thể chỉnh sửa.
                                </p>

                            </div>

                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                Ready
                            </span>

                        </div>

                        {/* ================================================= */}
                        {/* CUSTOMER */}
                        {/* ================================================= */}

                        <div className="grid gap-6 lg:grid-cols-2">

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 px-6 py-4">
                                    <h3 className="font-semibold text-slate-900">
                                        Khách hàng
                                    </h3>
                                </div>

                                <div className="space-y-4 p-6">

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-400">
                                            Họ tên
                                        </label>

                                        <input
                                            value={
                                                data.name
                                            }
                                            onChange={(e) =>
                                                updateData(
                                                    "name",
                                                    e.target
                                                        .value
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-black"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-400">
                                            Số điện thoại
                                        </label>

                                        <input
                                            value={
                                                data.phone
                                            }
                                            onChange={(e) =>
                                                updateData(
                                                    "phone",
                                                    e.target
                                                        .value
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-black"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-400">
                                            Mã đơn
                                        </label>

                                        <input
                                            value={
                                                data.orderCode
                                            }
                                            onChange={(e) =>
                                                updateData(
                                                    "orderCode",
                                                    e.target
                                                        .value
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-black"
                                        />
                                    </div>

                                </div>

                            </div>

                            {/* ================================================= */}
                            {/* ADDRESS */}
                            {/* ================================================= */}

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 px-6 py-4">
                                    <h3 className="font-semibold text-slate-900">
                                        Địa chỉ nhận hàng
                                    </h3>
                                </div>

                                <div className="space-y-4 p-6">

                                    <div>

                                        <label className="mb-1 block text-xs font-medium text-slate-400">
                                            Địa chỉ
                                        </label>

                                        <textarea
                                            value={
                                                data.address
                                            }
                                            onChange={(e) => {

                                                const address =
                                                    e.target.value;

                                                const {
                                                    province,
                                                    district,
                                                } =
                                                    parseAddress(
                                                        address
                                                    );

                                                setData(
                                                    (prev) =>
                                                        prev
                                                            ? {
                                                                ...prev,
                                                                address,
                                                                province,
                                                                district,
                                                            }
                                                            : prev
                                                );

                                            }}
                                            rows={3}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-black"
                                        />

                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">

                                        <div>

                                            <label className="mb-1 block text-xs font-medium text-slate-400">
                                                Tỉnh / Thành phố
                                            </label>

                                            <input
                                                value={
                                                    data.province
                                                }
                                                onChange={(e) =>
                                                    updateData(
                                                        "province",
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-black"
                                            />

                                        </div>

                                        <div>

                                            <label className="mb-1 block text-xs font-medium text-slate-400">
                                                Phường / Xã / Quận / Huyện
                                            </label>

                                            <input
                                                value={
                                                    data.district
                                                }
                                                onChange={(e) =>
                                                    updateData(
                                                        "district",
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-black"
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* ================================================= */}
                        {/* PRODUCT */}
                        {/* ================================================= */}

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-100 px-6 py-4">

                                <h3 className="font-semibold text-slate-900">
                                    Sản phẩm
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Có thể sửa lại sản phẩm trước khi tạo vận đơn.
                                </p>

                            </div>

                            <div className="p-6">

                                <textarea
                                    value={
                                        data.product
                                    }
                                    onChange={(e) =>
                                        updateData(
                                            "product",
                                            e.target
                                                .value
                                        )
                                    }
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-black focus:bg-white"
                                />

                            </div>

                        </div>

                        {/* ================================================= */}
                        {/* MONEY */}
                        {/* ================================================= */}

                        <div className="grid gap-4 md:grid-cols-4">

                            {/* PRODUCT PRICE */}

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                <label className="text-xs font-medium text-slate-400">
                                    Tiền hàng
                                </label>

                                <input
                                    type="text"
                                    value={
                                        data.productPrice ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        updateData(
                                            "productPrice",
                                            e.target
                                                .value
                                                ? parseMoney(
                                                    e.target
                                                        .value
                                                )
                                                : null
                                        )
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-lg font-bold outline-none focus:border-black"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    {formatMoney(
                                        data.productPrice
                                    )}{" "}
                                    ₫
                                </p>

                            </div>

                            {/* SHIPPING */}

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                <label className="text-xs font-medium text-slate-400">
                                    Phí vận chuyển
                                </label>

                                <input
                                    type="text"
                                    value={
                                        data.shippingFee ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        updateData(
                                            "shippingFee",
                                            e.target
                                                .value
                                                ? parseMoney(
                                                    e.target
                                                        .value
                                                )
                                                : null
                                        )
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-lg font-bold outline-none focus:border-black"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    {formatMoney(
                                        data.shippingFee
                                    )}{" "}
                                    ₫
                                </p>

                            </div>

                            {/* INSTALLATION */}

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                <label className="text-xs font-medium text-slate-400">
                                    Phí lắp đặt
                                </label>

                                <input
                                    type="text"
                                    value={
                                        data.installationFee ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        updateData(
                                            "installationFee",
                                            e.target
                                                .value
                                                ? parseMoney(
                                                    e.target
                                                        .value
                                                )
                                                : null
                                        )
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-lg font-bold outline-none focus:border-black"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    {formatMoney(
                                        data.installationFee
                                    )}{" "}
                                    ₫
                                </p>

                            </div>

                            {/* COD */}

                            <div className="rounded-2xl border border-slate-900 bg-slate-900 p-5 shadow-sm">

                                <label className="text-xs font-medium text-slate-300">
                                    COD
                                </label>

                                <input
                                    type="text"
                                    value={
                                        data.cod ??
                                        ""
                                    }
                                    onChange={(e) => {

                                        const value =
                                            e.target
                                                .value
                                                ? parseMoney(
                                                    e.target
                                                        .value
                                                )
                                                : null;

                                        updateData(
                                            "cod",
                                            value
                                        );

                                        setCod(
                                            value ===
                                                null
                                                ? ""
                                                : String(
                                                    value
                                                )
                                        );

                                    }}
                                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-lg font-bold text-white outline-none focus:border-white"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    {formatMoney(
                                        data.cod
                                    )}{" "}
                                    ₫
                                </p>

                            </div>

                        </div>

                        {/* ================================================= */}
                        {/* TOTAL */}
                        {/* ================================================= */}

                        <div className="rounded-2xl bg-slate-900 p-6 text-white">

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                <div>

                                    <p className="text-sm text-slate-400">
                                        Tổng thu
                                    </p>

                                    <p className="mt-1 text-3xl font-bold">
                                        {formatMoney(
                                            data.totalAmount
                                        )}{" "}
                                        ₫
                                    </p>

                                </div>

                                <div>

                                    <label className="mb-1 block text-xs text-slate-400">
                                        Có thể chỉnh sửa
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            data.totalAmount ??
                                            ""
                                        }
                                        onChange={(e) =>
                                            updateData(
                                                "totalAmount",
                                                e.target
                                                    .value
                                                    ? parseMoney(
                                                        e.target
                                                            .value
                                                    )
                                                    : null
                                            )
                                        }
                                        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-right font-semibold text-white outline-none focus:border-white"
                                    />

                                </div>

                            </div>

                        </div>

                        {/* ================================================= */}
                        {/* DELIVERY */}
                        {/* ================================================= */}

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-100 px-6 py-4">

                                <h3 className="font-semibold text-slate-900">
                                    Vận chuyển
                                </h3>

                            </div>

                            <div className="grid gap-5 p-6 sm:grid-cols-3">

                                <div>

                                    <label className="mb-2 block text-xs font-medium text-slate-400">
                                        Khối lượng
                                    </label>

                                    <input
                                        type="number"
                                        value={
                                            data.weight
                                        }
                                        onChange={(e) => {

                                            const value =
                                                Number(
                                                    e.target
                                                        .value
                                                );

                                            setWeight(
                                                value
                                            );

                                            updateData(
                                                "weight",
                                                value
                                            );

                                        }}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-black"
                                    />

                                </div>

                                <div>

                                    <label className="mb-2 block text-xs font-medium text-slate-400">
                                        Số kiện
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        value={
                                            data.packages
                                        }
                                        onChange={(e) => {

                                            const value =
                                                Number(
                                                    e.target
                                                        .value
                                                );

                                            setPackages(
                                                value
                                            );

                                            updateData(
                                                "packages",
                                                value
                                            );

                                        }}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-black"
                                    />

                                </div>

                                <div>

                                    <label className="mb-2 block text-xs font-medium text-slate-400">
                                        Ngày giao
                                    </label>

                                    <input
                                        value={
                                            data.deliveryDate
                                        }
                                        onChange={(e) =>
                                            updateData(
                                                "deliveryDate",
                                                e.target
                                                    .value
                                            )
                                        }
                                        placeholder="10/10"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-black"
                                    />

                                </div>

                            </div>

                        </div>

                        {/* ================================================= */}
                        {/* NTX ADDRESS */}
                        {/* ================================================= */}

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-100 px-6 py-4">

                                <h3 className="font-semibold text-slate-900">
                                    NTX Address
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Dữ liệu cuối cùng gửi tới NTX
                                </p>

                            </div>

                            <div className="p-6">

                                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-5 text-sm leading-6 text-slate-200">
                                    {JSON.stringify(
                                        {
                                            r_name:
                                                data.name,
                                            r_phone:
                                                data.phone,
                                            r_address:
                                                data.address,
                                            r_province:
                                                data.province,
                                            r_district:
                                                data.district,
                                            r_ward:
                                                null,
                                        },
                                        null,
                                        2
                                    )}
                                </pre>

                            </div>

                        </div>

                        {/* ================================================= */}
                        {/* CREATE BILL */}
                        {/* ================================================= */}

                        <div className="sticky bottom-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                <div>

                                    <p className="font-semibold text-slate-900">
                                        Sẵn sàng tạo vận đơn?
                                    </p>

                                    <p className="text-sm text-slate-500">
                                        Kiểm tra lại thông tin trước khi gửi NTX.
                                    </p>

                                </div>

                                <button
                                    onClick={
                                        createBill
                                    }
                                    disabled={
                                        loading
                                    }
                                    className={`min-w-[220px] rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition ${loading
                                        ? "cursor-not-allowed bg-slate-400"
                                        : "bg-black hover:bg-slate-800"
                                        }`}
                                >
                                    {loading
                                        ? "Đang tạo vận đơn..."
                                        : "Tạo vận đơn NTX"}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}

export default NTX; 