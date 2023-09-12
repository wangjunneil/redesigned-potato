/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ["mongoose"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipdata.co",
      },
      {
        protocol: "https",
        hostname: "restapi.amap.com",
      },
    ],
  },
};

module.exports = nextConfig;
