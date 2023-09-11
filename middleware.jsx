import { NextResponse } from "next/server";

export function middleware(request) {
    const response = NextResponse.next();
    const requestHeaders = new Headers(request.headers)

    // 登录态过期，访问时弹出 Cloudflare 登录鉴权页面
    // 登录后跳转到后置应用时会带上下面两个消息头
    const cfAccessUserEmail = requestHeaders.get('Cf-Access-Authenticated-User-Email');
    const cfAccessJwt = requestHeaders.get('Cf-Access-Jwt-Assertion');
    if (cfAccessUserEmail && cfAccessJwt) {
        // 做用户保存动作
        // ......
    }

    // 在登录态有效期内直接访问，都会在 Cookie 中带上 CF_Authorization 值
    // 此值就是上面的 cfAccessJwt，即 cfAuthorization == cfAccessJwt
    const cfAuthorization = request.cookies.get('CF_Authorization');
    // console.info('cfAuthorization', cfAuthorization);

    
    // https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

    return response;
}