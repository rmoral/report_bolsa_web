# Scan del estado del código – Payload CMS integrado

**Fecha:** 30 enero 2025  
**Proyecto:** earlymarketreports (Next.js 15 + Payload 3.72)

---

## 1. Resumen

Payload está instalado y configurado con la estructura oficial generada por el proyecto (layout, vistas, API y GraphQL bajo el route group `(payload)`). El admin está en **`/cms`** (y `/admin` redirige a `/cms`). Hay que tener en cuenta: **falta el layout raíz** de la app y la variable de BD que usa Payload (`DATABASE_URI`).

---

## 2. Estructura de rutas

### Payload (route group `(payload)`)

| Ruta real   | Origen | Descripción |
|------------|--------|-------------|
| `/cms`     | `(payload)/cms/[[...segments]]/page.tsx` | Admin de Payload (login, dashboard, colecciones) |
| `/admin/*` | Redirect en `next.config.ts` → `/cms/:path*` | Redirección a CMS |
| `/api/[...slug]` | `(payload)/api/[...slug]/route.ts` | API REST de Payload (colecciones, auth, etc.) |
| `/api/graphql` | `(payload)/api/graphql/route.ts` | GraphQL |
| `/api/graphql-playground` | `(payload)/api/graphql-playground/route.ts` | GraphQL Playground |

Las rutas bajo `app/api/` (auth, admin, stripe, me, health, subscribe) siguen siendo las mismas; Next resuelve por segmentos concretos antes que por el catch-all de Payload, así que no hay conflicto.

### Sitio (route group `(site)`)

- `(site)/page.tsx` → `/` (home)
- `(site)/[locale]/...` → `/{en|es}/...` (blog, dashboard, precios, etc.)
- `(site)/(admin)/admin/...` → `/admin/...` (tu panel: users, subscriptions; distinto del Payload admin)
- `(site)/(auth)/login`, `reset-password`, etc.
- `(site)/(marketing)/precios`, `subscribe`, legal, etc.
- `(site)/(private)/dashboard`, `reports/...`

---

## 3. Archivos clave de Payload

| Archivo | Estado |
|---------|--------|
| `src/payload.config.ts` | Configuración: MongoDB (`mongooseAdapter`), rutas admin `/cms` y api `/api`, colecciones `users` (auth) y `posts` (Lexical, localización, hooks). Usa `DATABASE_URI`. |
| `next.config.ts` | `withPayload(nextConfig)` + redirect `/admin/:path*` → `/cms/:path*`. |
| `src/app/(payload)/layout.tsx` | Layout generado por Payload: `RootLayout` + `handleServerFunctions`, importMap de `cms/importMap.js`, `custom.scss`. |
| `src/app/(payload)/cms/[[...segments]]/page.tsx` | Página del admin: `RootPage` + `generatePageMetadata`, importMap. |
| `src/app/(payload)/cms/[[...segments]]/not-found.tsx` | 404 del admin. |
| `src/app/(payload)/cms/importMap.js` | Import map generado (Lexical + UI RSC). |
| `src/app/(payload)/api/[...slug]/route.ts` | REST GET/POST/PUT/PATCH/DELETE/OPTIONS. |
| `src/app/(payload)/api/graphql/route.ts` | GraphQL POST/OPTIONS. |
| `src/app/(payload)/api/graphql-playground/route.ts` | GraphQL Playground. |
| `tsconfig.json` | Alias `"@payload-config": ["./src/payload.config.ts"]`. |

`(payload)/admin/importMap.js` existe pero no se usa (el layout usa `cms/importMap.js`).

---

## 4. Middleware

- **`src/middleware.ts`**: Si la ruta es `/cms` o `/admin`, hace `NextResponse.next()` sin lógica de i18n ni seguridad extra.
- El matcher excluye `api`, `cms`, `admin`, `_next/static`, `_next/image`, `favicon.ico`, `reports`.
- El resto de rutas pasan por health, security, api security e i18n (redirect a `/{locale}/...`).

---

## 5. Layout raíz (importante)

- **No existe `src/app/layout.tsx`.** Solo hay `layout.tsx.bkp` y `layout.tsx.min.bkp` en `src/app/`.
- En App Router, **Next.js exige un layout raíz** en `app/layout.tsx`. Sin él, la app puede fallar o comportarse mal.
- El contenido que antes estaría en el root layout (html, body, fuentes, GTM, I18nProvider, Header/Footer) está en **`src/app/(site)/layout.tsx`**, que solo envuelve las rutas del grupo `(site)`.
- Las rutas de Payload (`/cms`) usan solo `(payload)/layout.tsx` (RootLayout de Payload). Si Next no encuentra un layout raíz, puede que esté usando un default o que haya otro layout no localizado; en cualquier caso, es recomendable tener un **`src/app/layout.tsx`** que, como mínimo, renderice `<html><body>{children}</body></html>` para toda la app.

**Recomendación:** Crear `src/app/layout.tsx` que renderice solo `{children}` (o delegar en el contenido actual de `(site)/layout.tsx` para el sitio y dejar que `(payload)/layout.tsx` siga envolviendo `/cms`). Así se cumple el requisito de Next y se evitan errores raros.

---

## 6. Variables de entorno

- **Payload** (`payload.config.ts`): `PAYLOAD_SECRET`, **`DATABASE_URI`** (URI de MongoDB).
- **Resto del proyecto** (`src/lib/db.ts`, README): **`MONGODB_URI`**, `MONGODB_DB`.

Si usas la misma base para Payload y para el resto de la app, conviene unificar: por ejemplo tener `MONGODB_URI` en `.env` y en `payload.config.ts` usar `process.env.MONGODB_URI || process.env.DATABASE_URI || ''`, o definir `DATABASE_URI` y usar esa misma en `db.ts`. Así no hay confusión ni doble configuración.

---

## 7. Payload config – Colecciones

- **users**: auth activado, sin campos extra.
- **posts**:  
  - Lectura: si no hay `req.user`, solo documentos con `status: 'published'`.  
  - Campos: title, slug, excerpt, status, publishedAt, content (Lexical), content_html (lexicalHTML), content_text, canonicalKey; localización en/en,es.  
  - Hooks: `beforeChange` para `publishedAt` y `canonicalKey`; `beforeValidate` en canonicalKey.

Localización de Payload: `en`, `es`; default `en`, fallback activado.

---

## 8. Dependencias (package.json)

Payload y relacionadas:

- `payload`: 3.72.0  
- `@payloadcms/db-mongodb`: ^3.72.0  
- `@payloadcms/next`: ^3.72.0  
- `@payloadcms/richtext-lexical`: ^3.72.0  
- `@payloadcms/ui`: ^3.72.0  

Script: `"payload:importmap": "payload generate:importmap"`.

---

## 9. Otros archivos del proyecto que mencionan Payload

- `src/lib/payload/lexicalToHtml.ts`: convierte Lexical a HTML (uso en front/publicación).
- Rutas como `api/admin/*`, `api/me` usan “payload” como nombre de variable JWT (no como Payload CMS).

---

## 10. Posibles siguientes pasos

1. **Añadir `src/app/layout.tsx`** raíz que renderice `<html><body>{children}</body></html>` (o la estructura mínima que quieras a nivel global) para cumplir con Next y evitar problemas.
2. **Unificar variable de BD**: usar `DATABASE_URI` o `MONGODB_URI` en un solo sitio y referenciarla en `payload.config.ts` y en `db.ts`.
3. **Probar flujo**: `npm run dev`, abrir `/cms`, crear primer usuario admin si pide, y comprobar login y listado de Posts/Users.
4. Si quieres que el **blog público** consuma los posts de Payload, usar la API REST (`/api/posts`) o GraphQL desde las páginas bajo `(site)/[locale]/blog/`.

Si indicas qué quieres hacer primero (layout raíz, env, o probar /cms), se puede bajar a cambios concretos de código o comandos.
