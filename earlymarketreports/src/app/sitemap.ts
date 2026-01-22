import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

async function getOrigin() {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

async function fetchPosts(origin: string, locale: string) {
  const res = await fetch(
    `${origin}/api/posts?locale=${locale}&where[status][equals]=published&limit=1000&sort=-publishedAt`,
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data?.docs ?? []
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getOrigin()

  const [enPosts, esPosts] = await Promise.all([
    fetchPosts(origin, 'en'),
    fetchPosts(origin, 'es'),
  ])

  const base: MetadataRoute.Sitemap = [
    { url: `${origin}/en/blog`, lastModified: new Date() },
    { url: `${origin}/es/blog`, lastModified: new Date() },
  ]

  const enUrls = enPosts.map((p: any) => ({
    url: `${origin}/en/blog/${p.slug}`,
    lastModified: p.updatedAt ?? p.publishedAt ?? new Date(),
  }))

  const esUrls = esPosts.map((p: any) => ({
    url: `${origin}/es/blog/${p.slug}`,
    lastModified: p.updatedAt ?? p.publishedAt ?? new Date(),
  }))

  return [...base, ...enUrls, ...esUrls]
}
