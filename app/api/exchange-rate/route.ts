import { NextResponse } from "next/server";
import { getUsdCopRate } from "@/lib/exchange-rate";

export async function GET() {
  const rate = await getUsdCopRate();

  return NextResponse.json({
    success: true,
    usdCopRate: rate,
    updatedAt: new Date().toISOString(),
  });
}