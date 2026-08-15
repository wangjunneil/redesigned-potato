const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
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
});
