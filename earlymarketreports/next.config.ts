import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'

const nextConfig: NextConfig = {
  // Fix: repo root has another pnpm-lock.yaml — tell Next.js the correct root
  outputFileTracingRoot: path.join(__dirname, '../'),
  // Limit webpack workers to 1 to avoid OOM on low-RAM instances (t3.small / 2 GB)
  experimental: {
    cpus: 1,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/admin/:path*',
        destination: '/cms/:path*',
        permanent: false,
      },
      {
        source: '/blog',
        destination: '/en/blog',
        permanent: false,
      },
      {
        source: '/blog/',
        destination: '/en/blog',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob: https://www.gravatar.com https://*.gravatar.com",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com https://analytics.google.com https://region1.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "frame-src 'self' https://www.googletagmanager.com https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)
