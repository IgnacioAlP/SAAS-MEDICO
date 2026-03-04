/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;
