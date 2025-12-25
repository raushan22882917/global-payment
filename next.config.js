/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ]
  },
  // Disable strict mode to prevent double rendering in development
  reactStrictMode: false,
  // Ensure proper static file handling
  trailingSlash: false,
  // Ensure proper asset handling
  assetPrefix: '',
}

module.exports = nextConfig