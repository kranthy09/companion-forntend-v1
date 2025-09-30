/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone for dev
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
}

export default nextConfig
