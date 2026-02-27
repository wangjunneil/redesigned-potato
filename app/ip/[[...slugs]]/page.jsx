import React from "react";
import { headers } from "next/headers";
import Image from "next/image";

const get_ipdata = async (ip) => {
  const API_KEY = process.env.IPIFY_API_KEY;
  const isDev = process.env.NODE_ENV === "development";

  // 本地开发环境返回模拟数据（因为可能无法访问 geo.ipify.org）
  if (isDev) {
    return {
      ip: ip,
      location: {
        country: "CN",
        region: "Beijing",
        city: "Beijing",
        lat: 39.9042,
        lng: 116.4074,
        postalCode: "100000",
        timezone: "+08:00"
      },
      isp: "China Telecom (开发环境模拟数据)"
    };
  }

  const res = await fetch(
    `https://geo.ipify.org/api/v2/country,city?apiKey=${API_KEY}&ipAddress=${ip}`,
    {
      cache: "force-cache",
    }
  );
  return res.json();
};

const IPPage = async ({ params }) => {
  const slugs = params.slugs;

  const x_real_ip = headers().get("X-Real-IP");
  const x_forward_for = headers().get("x-forwarded-for");
  const user_agent = headers().get("user-agent");

  // 优先取参数ip，其次获取请求头中的ip
  const ip = slugs
    ? slugs[0]
    : x_real_ip
    ? x_real_ip
    : x_forward_for
    ? x_forward_for
    : " Not Found";

  // 检测本地IP地址
  const isLocalIP = ip === "::1" || ip === "127.0.0.1" || ip === " Not Found" || ip.trim() === "";

  let ip_data;

  if (isLocalIP) {
    // 本地开发环境，返回友好提示
    ip_data = {
      code: 100,
      messages: `本地开发环境无法获取真实IP地址。请在URL中指定IP地址，例如: /ip/8.8.8.8`
    };
  } else {
    // 获取IP数据
    ip_data = await get_ipdata(ip);
  }

  return ip_data.code ? (
    <div className="flex items-center justify-center min-h-screen pt-[30px] px-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm text-red-600 text-center">{ip_data.messages}</p>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-screen pt-[30px] px-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-md w-full">
        {/* IP地址和国旗 */}
        <div className="flex items-center justify-center mb-6">
          <Image
            src={`https://ipdata.co/flags/${ip_data.location.country.toLowerCase()}.png`}
            width={48}
            height={48}
            alt="country"
            className="rounded-md shadow-sm"
          />
          <div className="ml-4">
            <div className="text-xs text-gray-500 mb-1">IP Address</div>
            <div className="text-2xl font-bold text-green-800">{ip_data.ip}</div>
          </div>
        </div>

        {/* 位置信息 */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Location</div>
              <div className="text-sm text-gray-800">
                {ip_data?.location.city}, {ip_data?.location.region}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{ip_data?.location.country}</div>
            </div>
          </div>

          {ip_data?.isp && (
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">ISP</div>
                <div className="text-sm text-gray-800">{ip_data.isp}</div>
              </div>
            </div>
          )}

          {user_agent && (
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">User Agent</div>
                <div className="text-xs text-gray-600 break-all">{user_agent}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const metadata = {
  title: "IP Infomation",
  description: "IP位置信息查询",
};

export default IPPage;
