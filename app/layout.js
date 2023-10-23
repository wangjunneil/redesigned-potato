import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Life TimeLine',
  description: '只是想做个记录',
  viewport: 'width=device-width, initial-scale=1.0',
  manifest: '/manifest.json',
  themeColor: '#FFFFFF',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{ background: 'url(/bg.webp) repeat 5px 5px' }}
        className={inter.className}
      >
        {children}
      </body>
    </html>
  );
}
