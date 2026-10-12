import { NextResponse } from "next/server";
import { loginShopee } from "@/lib/shopee/auth";

export const runtime = "nodejs";

export async function POST() {
    try {
        const result =
            await loginShopee();

        return NextResponse.json(
            result
        );
    } catch (error) {
        console.error(
            "Shopee auth error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Đăng nhập Shopee thất bại",
            },
            {
                status: 500,
            }
        );
    }
}