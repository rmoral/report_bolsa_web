import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalHTML } from '@payloadcms/richtext-lexical'
import { lexicalEditor, HTMLConverterFeature } from '@payloadcms/richtext-lexical'
import crypto from 'node:crypto'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  editor: lexicalEditor({}),
  routes: {
    admin: '/cms',
    api: '/api',
  },
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    fallback: true, // si falta traducción en ES, usa EN
  },
  admin: {
    user: 'users',
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      // Endurecimiento: solo un usuario autenticado puede leer/crear/editar/borrar
      // usuarios. Payload sigue permitiendo crear el PRIMER usuario cuando la
      // colección está vacía (bootstrap), pero una vez existe un admin, el
      // registro público queda cerrado. Crea el admin nada más desplegar,
      // antes de exponer el puerto 443.
      access: {
        read: ({ req }) => Boolean(req.user),
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
        admin: ({ req }) => Boolean(req.user),
      },
      fields: [
        // añade campos extra si quieres (role, etc.)
      ],
    },
    {
      slug: 'media',
      access: {
        // Permitir lectura pública de medios para que las imágenes del blog se muestren sin login
        read: () => true,
      },
      upload: {
        staticDir: 'media',
        // Lista explícita de tipos rasterizados. Se excluye image/svg+xml a
        // propósito: un SVG puede llevar <script> y provocar XSS almacenado.
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
        imageSizes: [
          { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
          { name: 'card', width: 768, height: 1024, position: 'centre' },
          { name: 'tablet', width: 1024, height: undefined, position: 'centre' },
        ],
        adminThumbnail: 'thumbnail',
      },
      fields: [
        { name: 'alt', type: 'text', label: 'Texto alternativo (accesibilidad)' },
      ],
    },
    {
  slug: 'posts',
  access: {
    read: ({ req }) => (req.user ? true : { status: { equals: 'published' } }),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      localized: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen destacada',
      admin: { description: 'Imagen de portada del post (opcional)' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    { name: 'publishedAt', type: 'date' },

    {
       name: 'content',
       type: 'richText',
       localized: true,
       editor: lexicalEditor({
       features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HTMLConverterFeature({}),
         ],
      }),
    },
    // HTML derivado y persistido (por idioma)
    lexicalHTML('content', {
      name: 'content_html',
      storeInDB: true,
      hidden: true,
      // Si quieres verlo en admin, pon hidden: false y readOnly:
      // admin: { readOnly: true }
    }),

    // Texto plano derivado (por idioma) — lo calcularemos desde HTML en hook
    {
      name: 'content_text',
      type: 'textarea',
      localized: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'canonicalKey',
      type: 'text',
      unique: true,
      required: true,
      admin: { readOnly: true },
      hooks: {
     	beforeValidate: [
      	  ({ value }) => value || crypto.randomUUID(),
        ],
      },
    },
  ],
hooks: {
  beforeChange: [
    ({ data, operation }) => {
      // Set publishedAt al publicar por primera vez
      if (data?.status === 'published' && !data?.publishedAt) {
        data.publishedAt = new Date().toISOString()
      }

      // Garantiza canonicalKey si por algún motivo no viene (redundante con beforeValidate, pero seguro)
      if (!data?.canonicalKey) {
        data.canonicalKey = crypto.randomUUID()
      }

      return data
    },
  ],
},
}
  ],
})

