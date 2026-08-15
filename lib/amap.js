// 高德地图 API 统一签名 + 请求封装
// 签名算法：参数按 key 升序排序拼接，末尾追加私钥，再 MD5

async function amapSign(params) {
  const res = await fetch("/api/amap/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ params }),
  });
  const data = await res.json();
  return data.sig;
}

// 获取签名后的完整 URL（用于静态地图等 <a>/<img> 直接访问的场景）
export async function amapStaticMapUrl(params) {
  const key = process.env.NEXT_PUBLIC_AMAP_ACCESS_KEY;
  const allParams = { key, ...params };
  const sig = await amapSign(params);
  const query = Object.entries(allParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `https://restapi.amap.com/v3/staticmap?${query}&sig=${sig}`;
}

// 通用 GET 请求（regeo / weather 等），自动附带 key 和 sig
export async function amapGet(path, params) {
  const key = process.env.NEXT_PUBLIC_AMAP_ACCESS_KEY;
  const sig = await amapSign(params);
  const query = Object.entries({ key, ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const res = await fetch(`https://restapi.amap.com${path}?${query}&sig=${sig}`, {
    cache: "force-cache",
  });
  return res.json();
}

export default { amapSign, amapStaticMapUrl, amapGet };
