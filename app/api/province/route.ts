import { NextResponse } from "next/server";

export async function GET() {
    try {
        const apiUsername = process.env.NTX_API_USERNAME;
        const apiPassword = process.env.NTX_API_PASSWORD;

        const username = process.env.NTX_API_USERNAME;
        const password = process.env.NTX_API_PASSWORD;
        const partnerId = process.env.NTX_PARTNER_ID;

        if (!apiUsername || !apiPassword) {
            return NextResponse.json(
                { message: "NTX API credentials chưa được cấu hình" },
                { status: 500 }
            );
        }

        if (!username || !password || !partnerId) {
            return NextResponse.json(
                { message: "NTX request data chưa được cấu hình", username, partnerId, password },
                { status: 500 }
            );
        }

        const response = await fetch(
            "https://apisandbox.ntx.com.vn/v1/loc/provinces?Y",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    username: apiUsername,
                    password: apiPassword,
                    partner_id: partnerId
                },
                // body: JSON.stringify({
                //     username,
                //     password,
                //     partner_id: Number(partnerId),
                // }),
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
        console.error("GET /api/province error:", error);

        return NextResponse.json(
            {
                message: "Không thể kết nối NTX API",
            },
            { status: 500 }
        );
    }
}
