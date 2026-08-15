import { NextResponse } from "next/server";
import crypto from "crypto";

function md5(str) {
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
}

export async function POST(request) {
  try {
    const { params } = await request.json();
    const AMAP_PRIVATE_KEY = process.env.AMAP_PRIVATE_KEY;
    const AMAP_ACCESS_KEY = process.env.NEXT_PUBLIC_AMAP_ACCESS_KEY;

    if (!AMAP_PRIVATE_KEY || !AMAP_ACCESS_KEY) {
      return NextResponse.json({ error: "Amap keys not configured" }, { status: 500 });
    }

    // Add key to params
    const allParams = { key: AMAP_ACCESS_KEY, ...params };

    // Sort by key alphabetically
    const sortedKeys = Object.keys(allParams).sort();
    const paramStr = sortedKeys.map((k) => `${k}=${allParams[k]}`).join("&");

    // Compute signature: MD5(paramStr + privateKey)
    const sig = md5(paramStr + AMAP_PRIVATE_KEY);

    return NextResponse.json({ sig, params: paramStr });
  } catch (error) {
    console.error("Amap sign error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
