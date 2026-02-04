import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'

async function getOrigin() {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

async function getPosts(locale: string, page = 1, limit = 20) {
  const origin = await getOrigin()
  const res = await fetch(
    `${origin}/api/posts?locale=${locale}&where[status][equals]=published&limit=${limit}&page=${page}&sort=-publishedAt&depth=1`,
    { cache: 'no-store' }
  )
  if (!res.ok) return { docs: [], totalDocs: 0, totalPages: 0 }
  const data = await res.json()
  return {
    docs: data.docs ?? [],
    totalDocs: data.totalDocs ?? 0,
    totalPages: data.totalPages ?? 0,
  }
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const title = locale === 'es' ? 'Blog | EarlyMarketReports' : 'Blog | EarlyMarketReports'
  const description =
    locale === 'es'
      ? 'Artículos y análisis del mercado.'
      : 'Market reports and analysis articles.'
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/blog`,
      languages: { en: '/en/blog', es: '/es/blog' },
    },
  }
}

export default async function BlogIndexPage(props: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await props.params
  const { docs } = await getPosts(locale)

  const t = {
    title: locale === 'es' ? 'Blog' : 'Blog',
    empty: locale === 'es' ? 'No hay entradas publicadas aún.' : 'No published posts yet.',
    readMore: locale === 'es' ? 'Leer más' : 'Read more',
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-[--color-primary]">{t.title}</h1>

      {docs.length === 0 ? (
        <p className="mt-6 text-gray-600">{t.empty}</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {docs.map((post: {
            slug: string
            title: string
            excerpt?: string
            publishedAt?: string
            featuredImage?: { url?: string; alt?: string } | number | null
          }) => {
            const imgUrl = post.featuredImage && typeof post.featuredImage === 'object' && post.featuredImage?.url
            return (
              <li key={post.slug} className="border-b border-gray-200 pb-6 last:border-0">
                <Link href={`/${locale}/blog/${post.slug}`} className="flex gap-4 sm:gap-5 group">
                  {imgUrl ? (
                    <span className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={imgUrl}
                        alt={post.featuredImage && typeof post.featuredImage === 'object' ? (post.featuredImage.alt ?? '') : ''}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="112px"
                        unoptimized={imgUrl.startsWith('/')}
                      />
                    </span>
                  ) : (
                    <span className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                      —
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[--color-primary] group-hover:text-[--color-accent]">
                      {post.title}
                    </span>
                    {post.excerpt && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                    )}
                    {post.publishedAt && (
                      <time className="mt-2 block text-xs text-gray-500" dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US')}
                      </time>
                    )}
                    <span className="mt-2 inline-block text-sm font-medium text-[--color-accent] group-hover:underline">
                      {t.readMore} →
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
