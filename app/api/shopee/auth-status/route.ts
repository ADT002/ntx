import { NextResponse } from "next/server";

import {
    checkShopeeSession,
} from "@/lib/shopee/auth";

export const runtime = "nodejs";

export async function GET() {
    try {
        const result =
            await checkShopeeSession();

        return NextResponse.json(
            result
        );
    } catch (error) {
        console.error(
            "Shopee status error:",
            error
        );

        return NextResponse.json(
            {
                authenticated: false,
            },
            {
                status: 500,
            }
        );
    }
}