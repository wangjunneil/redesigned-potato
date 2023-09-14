import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Life Time Line",
  description: "只是想做个记录",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{ background: "url(/bg.webp) repeat 5px 5px" }}
        className={inter.className}
      >
        {children}
      </body>
    </html>
  );
}
