import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import SetPageAlternates from '@/components/SetPageAlternates'
import BlogPostContent from '@/components/BlogPostContent'

async function originFromHeaders() {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

/** Usa nuestra API que hace find con depth=3 para que los uploads dentro del contenido Lexical vengan poblados */
async function fetchPostBySlug(locale: string, slug: string) {
  const origin = await originFromHeaders()
  const res = await fetch(
    `${origin}/api/blog-post?locale=${encodeURIComponent(locale)}&slug=${encodeURIComponent(slug)}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return null
  return res.json()
}

async function fetchPostByCanonicalKey(locale: string, canonicalKey: string) {
  const origin = await originFromHeaders()
  const res = await fetch(
    `${origin}/api/posts?locale=${locale}&where[canonicalKey][equals]=${encodeURIComponent(canonicalKey)}&limit=1&depth=2`,
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
  const post = await fetchPostBySlug(locale, slug)
  if (!post || post.status !== 'published') return {}

  // Trae slugs por idioma para hreflang
  const en = await fetchPostByCanonicalKey('en', post.canonicalKey)
  const es = await fetchPostByCanonicalKey('es', post.canonicalKey)

  const title = post.seoTitle ?? post.title
  const description = post.seoDescription ?? post.excerpt ?? (post.content_text ? String(post.content_text).slice(0, 180) : '')

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/blog/${post.slug}`,
      languages: {
        'en': en ? `/en/blog/${en.slug}` : undefined,
        'es': es ? `/es/blog/${es.slug}` : undefined,
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
    },
  }
}

export default async function BlogPostPage(props: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await props.params
  const post = await fetchPostBySlug(locale, slug)
  if (!post || post.status !== 'published') notFound()

  const [enDoc, esDoc] = await Promise.all([
    fetchPostByCanonicalKey('en', post.canonicalKey),
    fetchPostByCanonicalKey('es', post.canonicalKey),
  ])

  const alternates = {
    en: enDoc && enDoc.status === 'published' ? `/en/blog/${enDoc.slug}` : '/en/blog',
    es: esDoc && esDoc.status === 'published' ? `/es/blog/${esDoc.slug}` : '/es/blog',
  }

  const featuredImage =
    post.featuredImage && typeof post.featuredImage === 'object'
      ? {
          url: post.featuredImage.url ?? '',
          alt: post.featuredImage.alt ?? null,
          width: post.featuredImage.width ?? null,
          height: post.featuredImage.height ?? null,
        }
      : null

  return (
    <>
      <SetPageAlternates en={alternates.en} es={alternates.es} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{post.title}</h1>

        <article className="mt-8">
          <BlogPostContent
            content={post.content ?? null}
            featuredImage={featuredImage}
          />
        </article>
      </div>
    </>
  )
}
