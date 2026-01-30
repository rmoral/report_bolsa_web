import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
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
}

export default withPayload(nextConfig)
