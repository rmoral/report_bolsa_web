EarlyMarketReports – Web App
============================

Aplicación web en Next.js orientada a captar suscriptores para informes bursátiles diarios. Incluye landing responsive, registro de leads en Firestore, autenticación JWT, área privada y backoffice básico.

Requisitos
---------
- Node.js 18+
- Cuenta de Firebase con Firestore habilitado
- (Opcional) MongoDB si quieres usar los modelos existentes de ejemplo

Variables de entorno (`.env.local`)
-----------------------------------
Colocar este archivo en `earlymarketreports/.env.local` (no se sube a git):

```
# Firebase Admin (Firestore)
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=service-account@tu-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Si usas multi-base, especifica el ID; si no, omite para usar (default)
FIREBASE_DATABASE_ID=(default)

# Auth (JWT) y ejemplo Mongo (opcional)
JWT_SECRET=cambia-esto
MONGODB_URI=mongodb+srv://user:pass@cluster/db?retryWrites=true&w=majority
MONGODB_DB=earlymarketreports
```

Instalación y desarrollo
------------------------
```
npm install
npm run dev
```
Abrir `http://localhost:3000`.

Endpoints útiles
----------------
- POST `/api/subscribe` → guarda lead en Firestore.
- POST `/api/auth/register` y `/api/auth/login` → usuarios (Mongo de ejemplo).
- GET `/api/me` → perfil con JWT.
- GET `/api/health/firebase` → chequeo de Firestore.

Despliegue en Vercel
--------------------
1. Conecta el repo a Vercel.
2. En Project Settings → Environment Variables, añade todas las variables anteriores.
3. Deploy. La app usa App Router y funciona en environments serverless.

Estructura principal
--------------------
- `src/app/page.tsx` landing y CTA.
- `src/components/LeadCapture.tsx` formulario lead → Firestore.
- `src/app/(auth)/*` login.
- `src/app/(private)/dashboard` área privada.
- `src/app/(admin)/admin/subscriptions` listado y export CSV.

Seguridad
---------
- Las claves de servicio no deben subirse. Añadidas reglas en `.gitignore`.
- GitHub Push Protection bloquea secretos; evita incluir JSON de cuentas de servicio.
