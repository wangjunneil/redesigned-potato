import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Life TimeLine',
  description: '只是想做个记录',
  viewport: 'width=device-width, initial-scale=1.0',
  manifest: '/manifest.json',
  themeColor: '#f7f8fa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ background: '#f7f8fa' }}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LifeTimeLine" />
      </head>
      <body
        style={{ background: '#f7f8fa url(/bg.webp) repeat 5px 5px' }}
        className={inter.className}
      >
        {children}
      </body>
    </html>
  );
}
