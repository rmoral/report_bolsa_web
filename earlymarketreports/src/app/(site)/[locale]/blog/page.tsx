import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getOrigin() {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

async function getPostBySlug(locale: string, slug: string) {
  const origin = await getOrigin()
  const res = await fetch(
    `${origin}/api/posts?locale=${locale}&where[slug][equals]=${encodeURIComponent(slug)}&limit=1`,
    { cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data?.docs?.[0] ?? null
}

async function getPostByCanonicalKey(locale: string, canonicalKey: string) {
  const origin = await getOrigin()
  const res = await fetch(
    `${origin}/api/posts?locale=${locale}&where[canonicalKey][equals]=${encodeURIComponent(canonicalKey)}&limit=1`,
    { cache: 'no-store' }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data?.docs?.[0] ?? null
}

export async function generateMetadata(
  props: { params: Promise<{ locale: string; slug: string }> }
): Promise<Metadata> {
  const { locale, slug } = await props.params

  const post = await getPostBySlug(locale, slug)
  if (!post || post.status !== 'published') return {}

  const [enDoc, esDoc] = await Promise.all([
    getPostByCanonicalKey('en', post.canonicalKey),
    getPostByCanonicalKey('es', post.canonicalKey),
  ])

  const title = post.title
  const html = typeof post.content_html === 'string' ? post.content_html : ''
  const description =
    post.excerpt ||
    (html ? stripHtml(html).slice(0, 180) : 'EarlyMarketReports blog post')

  const canonical = `/${locale}/blog/${post.slug}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: enDoc ? `/en/blog/${enDoc.slug}` : undefined,
        es: esDoc ? `/es/blog/${esDoc.slug}` : undefined,
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function BlogPostPage(
  props: { params: Promise<{ locale: string; slug: string }> }
) {
  const { locale, slug } = await props.params
  const post = await getPostBySlug(locale, slug)
  if (!post || post.status !== 'published') notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">{post.title}</h1>

      <article
        className="mt-8"
        dangerouslySetInnerHTML={{ __html: post.content_html || '' }}
      />
    </div>
  )
}
