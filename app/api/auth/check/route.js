import { NextResponse } from "next/server";

// 受 middleware /api/* 保护：无 cookie 时 middleware 直接返回 401，本函数不会执行。
export async function GET() {
  return NextResponse.json({ status: "ok", authenticated: true });
}
