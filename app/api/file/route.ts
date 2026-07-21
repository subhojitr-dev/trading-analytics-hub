import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { STOCK_PREFIX, TRADES_PREFIX } from "@/lib/blob";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path || !(path.startsWith(STOCK_PREFIX) || path.startsWith(TRADES_PREFIX))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = await get(path, { access: "private" });

  if (!result || result.statusCode !== 200) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=300",
    },
  });
}
