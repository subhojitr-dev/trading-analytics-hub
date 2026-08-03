import { NextRequest, NextResponse } from "next/server";
import { saveAnalysisRequest } from "@/lib/requests";
import { sendRequestNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const stockSymbol = String(formData.get("stockSymbol") ?? "").trim().toUpperCase();
  const extraCriteria = String(formData.get("extraCriteria") ?? "").trim();
  const optionsSymbol = String(formData.get("optionsSymbol") ?? "").trim().toUpperCase();
  const strategyName = String(formData.get("strategyName") ?? "").trim();
  const strategyNotes = String(formData.get("strategyNotes") ?? "").trim();

  const hasStockRequest = stockSymbol !== "";
  const hasOptionsRequest = optionsSymbol !== "" && strategyName !== "";

  if (!hasStockRequest && !hasOptionsRequest) {
    const url = new URL("/requests", request.url);
    url.searchParams.set("error", "empty");
    return NextResponse.redirect(url, { status: 303 });
  }

  const record = {
    submittedAt: new Date().toISOString(),
    stock: hasStockRequest
      ? { symbol: stockSymbol, extraCriteria: extraCriteria || null }
      : null,
    optionsTest: hasOptionsRequest
      ? { symbol: optionsSymbol, strategy: strategyName, notes: strategyNotes || null }
      : null,
  };

  await saveAnalysisRequest(record);

  try {
    await sendRequestNotification(record);
  } catch (e) {
    // Don't let an email hiccup break the submission -- the request is
    // already saved and visible on the Requests tab either way.
    console.error("Failed to send request notification email:", e);
  }

  const url = new URL("/requests", request.url);
  url.searchParams.set("submitted", "1");
  return NextResponse.redirect(url, { status: 303 });
}
