import { NextRequest, NextResponse } from "next/server";
import { getShopeeOrder } from "@/lib/shopee/order";

export const runtime = "nodejs";

export async function POST(
    request: NextRequest
) {

    try {

        const body =
            await request.json();

        const url =
            body?.url;

        if (!url) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Thiếu Shopee URL",
                },
                {
                    status: 400,
                }
            );

        }

        const data =
            await getShopeeOrder(url);

        return NextResponse.json({

            success: true,

            data,

        });

    } catch (error) {

        console.error(
            "Shopee order error:",
            error
        );

        const message =
            error instanceof Error
                ? error.message
                : "Unknown error";

        if (
            message ===
            "SHOPEE_NOT_AUTHENTICATED"
        ) {

            return NextResponse.json(
                {
                    success: false,

                    code:
                        "SHOPEE_NOT_AUTHENTICATED",

                    message:
                        "Chưa đăng nhập Shopee",
                },
                {
                    status: 401,
                }
            );

        }

        if (
            message ===
            "SHOPEE_SESSION_EXPIRED"
        ) {

            return NextResponse.json(
                {
                    success: false,

                    code:
                        "SHOPEE_SESSION_EXPIRED",

                    message:
                        "Session Shopee đã hết hạn",
                },
                {
                    status: 401,
                }
            );

        }

        return NextResponse.json(
            {
                success: false,

                message:
                    "Không thể lấy đơn Shopee",
            },
            {
                status: 500,
            }
        );
    }
}