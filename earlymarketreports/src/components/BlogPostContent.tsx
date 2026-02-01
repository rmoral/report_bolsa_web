'use client'

import type { SerializedEditorState } from 'lexical'
import {
  type JSXConvertersFunction,
  RichText,
} from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'

type FeaturedImage = {
  url: string
  alt?: string | null
  width?: number | null
  height?: number | null
}

type BlogPostContentProps = {
  content: SerializedEditorState | null
  featuredImage?: FeaturedImage | null
}

function isRelativeUrl(url: string) {
  return url.startsWith('/')
}

/** Conversor de upload que no falla cuando value es null (no poblado por la API) */
const safeUploadConverter: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: ({ node }) => {
    const uploadNode = node as { value?: { url?: string; mimeType?: string; alt?: string; filename?: string; width?: number; height?: number; sizes?: Record<string, { url?: string; width?: number; height?: number; mimeType?: string; filesize?: number; filename?: string }> } | null; fields?: { alt?: string } }
    const value = uploadNode?.value
    if (value == null || typeof value !== 'object' || !value.url) {
      return null
    }
    const uploadDoc = value
    const alt = uploadNode.fields?.alt ?? uploadDoc.alt ?? ''
    const url = uploadDoc.url
    if (!uploadDoc.mimeType?.startsWith('image')) {
      return (
        <a href={url} rel="noopener noreferrer" target="_blank">
          {uploadDoc.filename ?? 'Download'}
        </a>
      )
    }
    if (!uploadDoc.sizes || !Object.keys(uploadDoc.sizes).length) {
      return (
        <img
          alt={alt}
          src={url}
          width={uploadDoc.width ?? undefined}
          height={uploadDoc.height ?? undefined}
          className="rounded-lg shadow-md max-w-full h-auto"
        />
      )
    }
    const pictureJSX: React.ReactNode[] = []
    for (const size in uploadDoc.sizes) {
      const imageSize = uploadDoc.sizes[size]
      if (!imageSize?.url || !imageSize.width || !imageSize.height || !imageSize.mimeType) continue
      pictureJSX.push(
        <source
          key={size}
          media={`(max-width: ${imageSize.width}px)`}
          srcSet={imageSize.url}
          type={imageSize.mimeType}
        />
      )
    }
    pictureJSX.push(
      <img
        key="img"
        alt={alt}
        src={url}
        width={uploadDoc.width ?? undefined}
        height={uploadDoc.height ?? undefined}
        className="rounded-lg shadow-md max-w-full h-auto"
      />
    )
    return <picture>{pictureJSX}</picture>
  },
})

export default function BlogPostContent({ content, featuredImage }: BlogPostContentProps) {
  return (
    <div className="blog-post-content">
      {featuredImage?.url && (
        <figure className="mb-8 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
          <div className="relative aspect-video w-full bg-[var(--emr-gray)]">
            <Image
              src={featuredImage.url}
              alt={featuredImage.alt ?? ''}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              unoptimized={isRelativeUrl(featuredImage.url)}
            />
          </div>
          {featuredImage.alt && (
            <figcaption className="mt-2 text-sm text-gray-500 text-center">
              {featuredImage.alt}
            </figcaption>
          )}
        </figure>
      )}

      <div className="prose prose-lg prose-slate max-w-none prose-headings:font-semibold prose-headings:text-[var(--emr-blue)] prose-a:text-[var(--color-accent)] prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md">
        {content?.root?.children?.length ? (
          <RichText data={content} converters={safeUploadConverter} />
        ) : (
          <p className="text-gray-500">No content.</p>
        )}
      </div>
    </div>
  )
}
