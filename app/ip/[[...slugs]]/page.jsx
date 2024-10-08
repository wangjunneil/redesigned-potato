import React from "react";
import { headers } from "next/headers";
import Image from "next/image";
// import { getSecretValue } from "@/services";

const get_ipdata = async (ip) => {
  const API_KEY = "at_0iHJDJVsG3dqkwkwF2SeJQBAOnKMf";

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

  // {code: 403, messages: 'Access restricted. Check credits balance or enter the correct API key.'}
  // https://geo.ipify.org/service/account-balance?apiKey=at_7cZromxgLsvsBaXToB3sYx1NRhqmJ
  let ip_data = await get_ipdata(ip);
  console.info(ip_data);

  if (ip === "::1") {
    ip_data = { code: 100, messages: `invalid ip, ${ip}` };
  }

  return ip_data.code ? (
    <div className="inline p-3">
      <span className="text-xs text-red-600">{ip_data.messages}</span>
    </div>
  ) : (
    <div style={{ padding: "10px" }}>
      <Image
        src={`https://ipdata.co/flags/${ip_data.location.country.toLowerCase()}.png`}
        width={32}
        height={32}
        alt="country"
        className="align-middle inline"
      />
      <div className="text-green-800 font-bold align-middle pl-1 inline">
        {ip_data.ip}
        <span className="inline text-gray-400 pl-1 text-xs">
          {ip_data?.location.country},{ip_data?.location.region},
          {ip_data?.location.city}
        </span>
      </div>
      <div className="text-xs text-gray-400 pt-1">{user_agent}</div>
    </div>
  );
};

export const metadata = {
  title: "IP Infomation",
  description: "IP位置信息查询",
};

export default IPPage;
