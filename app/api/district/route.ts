import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const provinceId = request.nextUrl.searchParams.get("province_id");

        if (!provinceId) {
            return NextResponse.json(
                {
                    message: "Thiếu province_id",
                },
                { status: 400 }
            );
        }

        const apiUsername = process.env.NTX_API_USERNAME;
        const apiPassword = process.env.NTX_API_PASSWORD;
        const partnerId = process.env.NTX_PARTNER_ID;

        if (!apiUsername || !apiPassword || !partnerId) {
            return NextResponse.json(
                {
                    message: "NTX API credentials chưa được cấu hình",
                },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://apisandbox.ntx.com.vn/v1/loc/districts?province_id=${provinceId}&is_new=Y`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    username: apiUsername,
                    password: apiPassword,
                    partner_id: partnerId,
                },
                cache: "no-store",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    message: "NTX API trả về lỗi",
                    status: response.status,
                    data,
                },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("GET /api/districts error:", error);

        return NextResponse.json(
            {
                message: "Không thể kết nối NTX API",
            },
            { status: 500 }
        );
    }
}
