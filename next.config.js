/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'ipdata.co',
          },
          {
            protocol: 'https',
            hostname: 'kms.wangjun.dev',
          },
        ],
      },
}

module.exports = nextConfig
