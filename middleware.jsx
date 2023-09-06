import { NextResponse } from "next/server";

export function middleware(request) {
    const response = NextResponse.next();
    const requestHeaders = new Headers(request.headers)

    // Cloudflare Authorization
    const cfAccessUserEmail = requestHeaders.get('Cf-Access-Authenticated-User-Email');
    const cfAccessJwt = requestHeaders.get('Cf-Access-Jwt-Assertion');
    console.info('cfAccessUserEmail', cfAccessUserEmail);
    console.info('cfAccessJwt', cfAccessJwt);

    const cfAuthorization = request.cookies.get('CF_Authorization');
    console.info('cfAuthorization', cfAuthorization);
    // https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

    return response;
}