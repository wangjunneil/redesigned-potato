import { headers } from "next/headers";
import { isMobile } from "@/lib/device";
import QuickCapture from "@/components/home/QuickCapture";

export default function Home() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";

  if (isMobile(userAgent)) {
    return <QuickCapture />;
  }

  return (
    <div className='p-3 text-green-800 hover:text-green-300 text-sm'>
      the server is running...
    </div>
  );
}
