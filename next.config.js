/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['mongoose']
  },
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
