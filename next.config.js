/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
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
