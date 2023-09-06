import { NextResponse } from "next/server";

export function middleware(request) {
    const response = NextResponse.next();
    const requestHeaders = new Headers(request.headers)

    // Cloudflare Authorization
    const cfAccessUserEmail = requestHeaders.get('Cf-Access-Authenticated-User-Email');
    const cfAccessJwt = requestHeaders.get('Cf-Access-Jwt-Assertion');
    console.info('cfAccessUserEmail', cfAccessUserEmail, 'cfAccessJwt', cfAccessJwt);

    return response;
}