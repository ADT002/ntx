import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const apiUsername = process.env.NTX_API_USERNAME;
        const apiPassword = process.env.NTX_API_PASSWORD;
        const partnerId = process.env.NTX_PARTNER_ID;

        if (!apiUsername || !apiPassword || !partnerId) {
            return NextResponse.json(
                {
                    message:
                        "NTX API credentials chưa được cấu hình",
                },
                { status: 500 }
            );
        }

        const response = await fetch(
            "https://apiws.ntx.com.vn/v1/bill/create-by-location",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    username: apiUsername,
                    password: apiPassword,
                },
                body: JSON.stringify({
                    ...body,
                    partner_id: Number(partnerId),
                }),
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
                {
                    status: response.status,
                }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(
            "POST /api/ntx/bill error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Không thể kết nối NTX API",
            },
            { status: 500 }
        );
    }
}
