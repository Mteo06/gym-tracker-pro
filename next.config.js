/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['supabase.co'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
