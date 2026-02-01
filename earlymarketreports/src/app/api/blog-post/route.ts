import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

/**
 * Obtiene un post por slug y locale usando la Local API de Payload,
 * con depth suficiente para que los uploads dentro del contenido Lexical vengan poblados.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const locale = searchParams.get('locale')

  if (!slug || !locale) {
    return NextResponse.json(
      { error: 'Missing slug or locale' },
      { status: 400 }
    )
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      locale,
      depth: 3,
      limit: 1,
    })

    const post = result.docs[0] ?? null
    if (!post || post.status !== 'published') {
      return NextResponse.json(null, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (err) {
    console.error('[blog-post API]', err)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}
