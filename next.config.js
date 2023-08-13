/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'ipdata.co',
          },
        ],
      },
}

module.exports = nextConfig
