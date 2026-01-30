# Deploy en producción – EarlyMarketReports

Esta app es **Next.js con servidor** (API routes, Payload CMS, Server Components). No es un sitio estático: necesita un entorno que ejecute Node y sirva la app con `next start`.

---

## 1. Antes del deploy

### 1.1 Build local

Comprueba que el build pasa en tu máquina:

```bash
# Regenerar import map de Payload (recomendado antes de cada build)
pnpm run payload:importmap

# Build
pnpm run build

# Probar en local
pnpm run start
```

Si algo falla en `payload:importmap` o en `build`, corrígelo antes de desplegar.

### 1.2 Variables de entorno en producción

Configura **todas** estas variables en la plataforma donde despliegues (Vercel, Railway, etc.):

| Variable | Uso | Obligatoria |
|----------|-----|-------------|
| **Payload / MongoDB** | | |
| `PAYLOAD_SECRET` | Firmar sesiones y tokens de Payload | ✅ |
| `DATABASE_URI` | URI de MongoDB para Payload (ej. `mongodb+srv://user:pass@cluster/db`) | ✅ |
| **App / sitio** | | |
| `NEXT_PUBLIC_BASE_URL` | URL pública del sitio (ej. `https://earlymarketreports.com`) | ✅ |
| **MongoDB (resto de la app)** | | |
| `MONGODB_URI` | URI de MongoDB para suscripciones/usuarios (puede ser la misma que `DATABASE_URI`) | ✅ |
| `MONGODB_DB` | Nombre de la base (ej. `earlymarketreports`) | Opcional |
| **Stripe** | | |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública (visible en el cliente) | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook de Stripe (crear endpoint en Stripe Dashboard) | ✅ |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Price ID del plan Pro mensual | ✅ |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Price ID del plan Pro anual | Opcional |
| **Firebase** | | |
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | ✅ |
| `FIREBASE_CLIENT_EMAIL` | Email del service account | ✅ |
| `FIREBASE_PRIVATE_KEY` | Clave privada del service account (con `\n` reales o escapados según la plataforma) | ✅ |
| `FIREBASE_DATABASE_ID` | ID de Firestore si no es `(default)` | Opcional |
| **Auth / JWT** | | |
| `JWT_SECRET` | Clave para firmar/verificar JWTs de la app | ✅ |
| **Analytics** | | |
| `NEXT_PUBLIC_GA_ID` | ID de Google Analytics (ej. `G-XXXXXXXXXX`) | Opcional |

En producción, **no** uses valores de desarrollo ni dejes claves por defecto (ej. `whsec_your_webhook_secret`).

### 1.3 Stripe en producción

- Crea (o usa) una cuenta Stripe en modo **Live**.
- Crea productos y precios en Live y pon sus IDs en las variables anteriores.
- Crea un **Webhook** en Stripe apuntando a:
  `https://earlymarketreports.com/api/stripe/webhook`
- Usa el **Signing secret** del webhook como `STRIPE_WEBHOOK_SECRET`.

### 1.4 MongoDB en producción

- Usa MongoDB Atlas (o un MongoDB gestionado) y una URI con usuario/contraseña y red accesible desde tu hosting.
- Asegura que la IP del servicio de deploy esté permitida (o usa acceso desde cualquier IP si el clúster lo permite).
- Puedes usar la **misma base** para Payload y para el resto de la app: en ese caso `DATABASE_URI` y `MONGODB_URI` pueden ser la misma cadena.

---

## 2. Opción recomendada: Vercel

Vercel está pensado para Next.js y suele ser lo más sencillo.

### Pasos

1. **Cuenta y proyecto**
   - Entra en [vercel.com](https://vercel.com) y conecta el repositorio Git del proyecto (GitHub/GitLab/Bitbucket).

2. **Configuración del proyecto**
   - **Framework Preset:** Next.js (detectado automáticamente).
   - **Build Command:** `pnpm run payload:importmap && pnpm run build`  
     (o `npm run payload:importmap && npm run build` si usas npm).
   - **Output Directory:** dejar por defecto (no usar `out`).
   - **Install Command:** `pnpm install` (o `npm install`).

3. **Variables de entorno**
   - En el proyecto de Vercel: **Settings → Environment Variables**.
   - Añade todas las variables de la tabla anterior para **Production** (y si quieres también para Preview).
   - Para `FIREBASE_PRIVATE_KEY`, si Vercel pide el valor en una sola línea, pega la clave incluyendo los `\n` literales; Vercel suele aceptarlos bien.

4. **Dominio**
   - En **Settings → Domains** añade `earlymarketreports.com` (y www si lo usas).
   - Configura en tu registrador los registros DNS que Vercel indique (CNAME o A).

5. **Deploy**
   - Cada push a la rama principal (p. ej. `main`) puede hacer deploy automático, o lanza un deploy manual desde el dashboard.

### Comandos en Vercel (Build)

Puedes dejar solo:

- **Build:** `pnpm run build`  
y asegurarte de que el import map de Payload se genera en build. Si en tu repo ya está generado y commiteado (`src/app/(payload)/cms/importMap.js`), a veces no hace falta ejecutar `payload:importmap` en cada build; si no, usa:

- **Build:** `pnpm run payload:importmap && pnpm run build`

---

## 3. Otras plataformas (Railway, Render, AWS Amplify, etc.)

Cualquier hosting que ejecute Node y pueda servir una app Next.js vale.

### Build y start

- **Install:** `pnpm install` (o `npm ci`).
- **Build:** `pnpm run payload:importmap && pnpm run build`.
- **Start:** `pnpm run start` (puerto por defecto 3000; muchas plataformas leen `PORT`).

### Ejemplos por plataforma

- **Railway / Render:** Conectar el repo, definir el comando de build anterior y el de start `pnpm start`. Añadir todas las variables de entorno en el panel.
- **AWS Amplify:** Conectar el repo, usar el preset Next.js y en “Build settings” poner el build command que incluya `payload:importmap` y `build`. Añadir las variables en Amplify → Environment variables.
- **VPS / EC2 / Docker:** Instalar Node, clonar el repo, configurar las variables de entorno (`.env.production` o export), ejecutar `payload:importmap`, `build` y luego `start` detrás de un reverse proxy (nginx) y, si quieres, HTTPS con Let’s Encrypt.

---

## 4. Después del primer deploy

1. **Payload (CMS)**  
   - Entra en `https://earlymarketreports.com/cms` y crea el primer usuario admin si Payload lo pide.

2. **Stripe**  
   - Comprueba que el webhook recibe eventos (Stripe Dashboard → Webhooks → ver intentos y respuestas).
   - Prueba un pago de prueba en Live si lo tienes habilitado.

3. **Firebase**  
   - Verifica que el login y la lógica que usa Firestore funcionan en la URL de producción.

4. **Enlaces y SEO**  
   - Revisa que `NEXT_PUBLIC_BASE_URL` sea la URL final (con `https://`) para que los enlaces y OG images sean correctos.

---

## 5. Sobre el script `scripts/deploy-aws.sh`

El script actual sube la carpeta **`./out`** a S3 y usa CloudFront como sitio estático. Eso solo sirve para una app exportada con `next export` (sitio estático).

Esta app **no** es estática: tiene API routes, Payload y lógica en servidor, por lo que **no** uses ese script tal cual para este proyecto. Para desplegar en AWS con esta app necesitarías, por ejemplo:

- **Amplify** (Next.js con SSR), o  
- **ECS/Fargate / EC2** ejecutando `next start` detrás de un balanceador y con MongoDB/Stripe/Firebase configurados.

Si en el futuro quieres seguir usando S3/CloudFront, sería solo para **assets estáticos** (o un front estático distinto); la app actual debe correr en un servidor Node.

---

## 6. Resumen rápido (Vercel)

```text
1. Conectar repo en Vercel.
2. Build command: pnpm run payload:importmap && pnpm run build
3. Añadir todas las variables de entorno (Payload, MongoDB, Stripe, Firebase, JWT, NEXT_PUBLIC_BASE_URL).
4. Añadir dominio earlymarketreports.com en Vercel y DNS en el registrador.
5. Deploy (automático o manual).
6. Crear primer usuario en /cms y probar Stripe/Firebase en producción.
```

Si indicas en qué plataforma quieres desplegar primero (Vercel, Railway, AWS, etc.), se pueden detallar solo los pasos para esa.
