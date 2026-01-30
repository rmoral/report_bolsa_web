# Deploy en EC2 – EarlyMarketReports

La app es **Next.js con API y Payload**; debe ejecutarse con **Node** (`next start`), no como sitio estático. El script `deploy-aws.sh` antiguo (S3 + CloudFront + `./out`) **no aplica** a esta versión.

**Requisitos en el servidor:** Node 20+, pnpm, PM2 (recomendado).

---

## Subir código: ¿archivos directamente o Git?

- **Subir archivos directamente (rsync, SFTP, etc.)**  
  Es una opción válida: subes solo lo que cambia, no necesitas Git en el servidor. Útil si despliegas desde tu máquina y quieres controlar exactamente qué se sube.  
  **Importante:** después de subir, ejecuta **en el servidor** `./scripts/deploy-ec2.sh` para instalar deps, generar import map, hacer build y reiniciar PM2. No basta con copiar archivos: hace falta `pnpm install` y `pnpm run build` en el EC2.

- **Git pull en el servidor**  
  Suele ser más cómodo a largo plazo: en el EC2 haces `git pull` y luego `./scripts/deploy-ec2.sh`. Tienes historial y rollback con `git checkout` o `git reset`.

Puedes seguir subiendo archivos directamente; solo asegúrate de correr el script de deploy en el servidor después de cada subida para que se instalen dependencias, se genere el import map, se haga el build y se reinicie PM2.

---

## Qué hace el script `scripts/deploy-ec2.sh`

- Instala dependencias (`pnpm install`)
- Genera el import map de Payload (`payload:importmap`) — requiere **Node 20**
- Hace el build de Next.js (`pnpm run build`)
- Opcionalmente reinicia la app si usas **PM2** o **systemd**

Ejecución **en el servidor EC2**, desde la raíz del repo:

```bash
cd /ruta/al/proyecto/earlymarketreports
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh
```

- **Si la app corre con systemd** (servicio de Ubuntu): en el servidor, en `.env.production` o antes de ejecutar el script, define el nombre del servicio, por ejemplo:
  ```bash
  export SYSTEMD_SERVICE=earlymarketreports
  ```
  (sustituye por el nombre real del servicio; para verlo: `systemctl list-units --type=service` o `ls /etc/systemd/system/*.service`).
- Si usas PM2 y el proceso tiene otro nombre: `PM2_APP_NAME=tu-nombre ./scripts/deploy-ec2.sh`

**Flujo típico si subes archivos directamente:** subes los archivos (rsync/SFTP) al EC2, entras por SSH y ejecutas `./scripts/deploy-ec2.sh` en la carpeta del proyecto.

---

## Deploy desde la consola local (todo en un comando)

Desde tu máquina puedes subir el código y ejecutar el deploy en el servidor con un solo script:

1. **Configura una vez** (elige una opción):

   - Crear `.env.deploy` con tus datos (copia de `.env.deploy.example`):
     ```bash
     cp .env.deploy.example .env.deploy
     # Edita .env.deploy con: DEPLOY_SSH_HOST, DEPLOY_SSH_USER, DEPLOY_REMOTE_PATH
     ```
   - O pasar las variables al ejecutar:
     ```bash
     DEPLOY_SSH_HOST=tu-ec2.com DEPLOY_SSH_USER=ubuntu DEPLOY_REMOTE_PATH=/home/ubuntu/earlymarketreports ./scripts/deploy-from-local.sh
     ```

2. **Ejecutar el deploy:**
   ```bash
   chmod +x scripts/deploy-from-local.sh
   ./scripts/deploy-from-local.sh
   ```

El script hace:
- **rsync** del proyecto al EC2 (excluye `node_modules`, `.next`, `.git`, `.env*`)
- **SSH** al servidor y ejecuta `./scripts/deploy-ec2.sh` (install, importmap, build, restart del servicio systemd o PM2)

Requisitos en tu máquina: `rsync` y acceso SSH al EC2 (clave configurada o `ssh usuario@host` sin contraseña).

---

## Alternativa: solo SSH y script en el servidor

Si ya subiste el código por otro medio:

```bash
ssh usuario@tu-ec2 "cd /ruta/al/proyecto/earlymarketreports && ./scripts/deploy-ec2.sh"
```

---

## Si no se actualiza el código o no cargan los estilos

1. **Servicio systemd**  
   El servicio debe estar configurado con **WorkingDirectory** apuntando a la misma carpeta donde haces el deploy (donde está el `.next` recién generado). Revisa el unit file (ej. `/etc/systemd/system/tu-servicio.service`): debe tener `WorkingDirectory=/ruta/completa/al/proyecto`. Después de cambiar el unit: `sudo systemctl daemon-reload && sudo systemctl restart tu-servicio`.

2. **PM2**  
   Si usas PM2, el script hace `pm2 delete` + `pm2 start` desde el directorio del deploy. Comprueba con `pm2 show earlymarketreports` que **cwd** es la ruta del proyecto.

3. **Caché del navegador**  
   Prueba en ventana privada o Ctrl+Shift+R (hard refresh). Si hay proxy/CDN delante del servidor, puede estar cacheando: limpia caché allí o espera al TTL.

4. **Ruta de deploy**  
   Asegúrate de que `DEPLOY_REMOTE_PATH` en `.env.deploy` es exactamente la carpeta donde quieres el proyecto en el EC2 (la misma que usas al entrar por SSH y donde está el PM2 que quieres usar).

---

## Variables de entorno mínimas en producción

En el EC2 (o en el archivo que cargue tu proceso) deberías tener al menos:

**Para que el script reinicie el servicio al terminar el deploy**, en el servidor (en `.env.production` o exportadas) define:
- **SYSTEMD_SERVICE** = nombre del servicio systemd (ej. `earlymarketreports`). El script hace `sudo systemctl restart $SYSTEMD_SERVICE` al final.

```bash
# Payload / MongoDB
PAYLOAD_SECRET=<secreto-fuerte>
DATABASE_URI=mongodb+srv://...
MONGODB_URI=<igual-o-otra-uri>
NEXT_PUBLIC_BASE_URL=https://earlymarketreports.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
# + Price IDs si los usas

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."

# Auth
JWT_SECRET=...
```

---

## Uso de PM2 (recomendado en EC2)

Si aún no usas PM2:

```bash
npm install -g pm2
cd /ruta/al/proyecto/earlymarketreports
pm2 start pnpm --name earlymarketreports -- start
pm2 save
pm2 startup   # para que arranque al reiniciar el servidor
```

Tras cada deploy:

```bash
pm2 restart earlymarketreports --update-env
```

El script `deploy-ec2.sh` puede hacer este `pm2 restart` por ti si PM2 está instalado (ya está contemplado en el script).

---

## Resumen

- **Nuevo script:** `scripts/deploy-ec2.sh` — build + (opcional) reinicio en EC2.
- **Antiguo:** `deploy-aws.sh` — solo sirve para un sitio estático (S3/CloudFront); no lo uses para esta app.
- Cuando me digas cómo subes código al EC2, cómo ejecutas la app (PM2/systemd) y con qué Node/pnpm trabajas, adapto el script o los comandos exactos a tu flujo (por ejemplo: deploy desde tu máquina con `rsync` + SSH para ejecutar `deploy-ec2.sh` en el servidor).
