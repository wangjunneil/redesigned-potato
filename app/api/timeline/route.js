import { NextResponse } from "next/server";
import { insertTimeLine } from "@/database/modules/timeLineRepository";

export async function POST(request) {
  try {
    const body = await request.json();
    const data = await insertTimeLine(body);
    return NextResponse.json({ status: "ok", data });
  } catch (error) {
    console.error("创建时间线失败:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
