import { NextResponse } from "next/server";

function decodeBase64Url(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  return atob(padded);
}

function isExpired(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (!payload.exp) return false; // no exp claim, fall through
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true;
  }
}

export async function middleware(request) {
  const response = NextResponse.next();
  if (process.env.NODE_ENV === "development") return response;

  const cfAuthorization = request.cookies.get("CF_Authorization")?.value;
  const pathname = request.nextUrl.pathname;

  // 注意：此处校验 JWT 结构与过期，但未做签名校验。
  // 安全前提：Cloudflare Access 始终位于源站之前拦截未认证请求。
  // 若源站可被直连，需改为验证 JWT 签名（拉取 Cloudflare JWKS）。
  if (
    (pathname.startsWith("/timeline") || pathname.startsWith("/api/")) &&
    (!cfAuthorization || isExpired(cfAuthorization))
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
