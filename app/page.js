import { headers } from "next/headers";
import { isMobile } from "@/lib/device";

export default function Home() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";

  if (isMobile(userAgent)) {
    // 移动端：快速录入页（后续任务替换为真实组件）
    return (
      <div style={{ padding: 24, fontSize: 16 }}>移动端录入页占位</div>
    );
  }

  return (
    <div className='p-3 text-green-800 hover:text-green-300 text-sm'>
      the server is running...
    </div>
  );
}
