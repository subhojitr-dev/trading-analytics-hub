import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, makeAuthCookieValue, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const expected = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!expected || !secret || !verifyPassword(password, expected)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "1");
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const target = next.startsWith("/") ? next : "/";
  const response = NextResponse.redirect(new URL(target, request.url), { status: 303 });
  response.cookies.set(AUTH_COOKIE_NAME, makeAuthCookieValue(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
