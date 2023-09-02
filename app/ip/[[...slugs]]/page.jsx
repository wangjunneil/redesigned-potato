import React from 'react'
import { headers } from 'next/headers';
import Image from 'next/image'
import InfisicalClient from 'infisical-node';

const get_ipdata = async (ip) => {
  const client = new InfisicalClient({
    token: process.env.KMS_TOKEN,
    siteURL: 'https://kms.wangjun.dev',
    cacheTTL: 3600
  })
  const IPIFY_API_KEY = await client.getSecret('IPIFY_API_KEY', {environment:'prod',path:'/',type:'shared'})

  const res = await fetch(`https://geo.ipify.org/api/v2/country,city,vpn?apiKey=${IPIFY_API_KEY.secretValue}&ipAddress=${ip}`)
  return res.json();
}

const IPPage = async ({ params }) => {
  const slugs = params.slugs;

  const x_real_ip = headers().get('X-Real-IP');
  const x_forward_for = headers().get("x-forwarded-for");
  const user_agent = headers().get('user-agent');

  // 优先取参数ip，其次获取请求头中的ip
  const ip = slugs ? slugs[0] : x_real_ip ? x_real_ip : x_forward_for ? x_forward_for : ' Not Found';

  const ip_data = await get_ipdata(ip);
  console.log('ip_data', ip_data);

  return (
    <div class="inline p-3">
      <Image src={`https://ipdata.co/flags/${ip_data.location.country.toLowerCase()}.png`} width={32} height={32}
      alt="country" class="align-middle inline"/>
      <div class="text-green-800 font-bold align-middle pl-1 inline">
        {ip_data.ip}
        <span class="inline text-gray-400 pl-1 text-xs">
          {ip_data?.location.country},{ip_data?.location.region},{ip_data?.location.city}
        </span>
      </div>
      <div class="text-xs text-gray-400 pl-3">{user_agent}</div>
    </div>    
  )
}

export default IPPage


{/* <body style="font-family:sans-serif;font-size: 12px;color: darkgray;padding: 5px;">    
        <div>
            <img src="https://ipdata.co/flags/{{ip_data['location']['country'].lower()}}.png" style="vertical-align: middle;border: 1px solid #000;"/>
            <span style="font-size: 16px;font-weight: bold;color: #014901;vertical-align: middle;">
                {{ip_data['ip']}}
            </span>
            <div style="display: inline-block;vertical-align: bottom;">
                {{ip_data['location']['country']}}
                ,{{ip_data['location']['region']}}
                ,{{ip_data['location']['city']}}
            </div>        
        </div>
        <div style="padding-top: 3px;">
            {{request.headers['user-agent']}}
        </div>
    </body>  */}