/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'

// Endurecimiento: el GraphQL Playground expone el esquema completo (introspección).
// Se desactiva en producción; sigue disponible en desarrollo.
export const GET =
  process.env.NODE_ENV === 'production'
    ? () => new Response('Not found', { status: 404 })
    : GRAPHQL_PLAYGROUND_GET(config)
