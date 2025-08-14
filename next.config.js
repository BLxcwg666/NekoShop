/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'api.example.com', "api.nekoshop.com", "cdn.xcnya.cn"],
    unoptimized: false,
  },
}

module.exports = nextConfig