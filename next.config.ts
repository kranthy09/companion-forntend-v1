import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    turbo: {
      rules: {
        '*.css': ['css-loader'],
      },
    },
  },
}

export default nextConfig