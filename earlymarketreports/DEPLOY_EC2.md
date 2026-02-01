# Deploy en EC2 – EarlyMarketReports

La app es **Next.js con API y Payload**; debe ejecutarse con **Node** (`next start`), no como sitio estático. El script `deploy-aws.sh` antiguo (S3 + CloudFront + `./out`) **no aplica** a esta versión.

**Requisitos en el servidor:** Node 20+, pnpm, PM2 (recomendado).

---

## Subir código: ¿archivos directamente o Git?

- **Deploy con Git (recomendado)**  
  El repo es público ([report_bolsa_web](https://github.com/rmoral/report_bolsa_web)); en el servidor no hace falta configurar claves. Una vez clonado el repo en el EC2, cada deploy es: `git pull origin main` + `./scripts/deploy-ec2.sh`. Desde tu máquina puedes usar un solo comando: `./scripts/deploy-via-git.sh` (SSH + pull + deploy). Ver más abajo **“Deploy con Git”**.

- **Subir archivos directamente (rsync, SFTP, etc.)**  
  Opción válida si prefieres no usar Git en el servidor. Después de subir, ejecuta **en el servidor** `./scripts/deploy-ec2.sh`. Desde local: `./scripts/deploy-from-local.sh` (rsync + deploy).

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

## Deploy con Git (recomendado)

Producción se actualiza con lo que está en `main` del repo. No hace falta rsync ni copiar ficheros a mano.

### Setup una vez en el servidor

1. **Clona el repo** en la ruta donde quieras la app (por ejemplo `/home/ubuntu/web/report_bolsa_web`):

   ```bash
   sudo mkdir -p /home/ubuntu/web
   sudo chown ubuntu:ubuntu /home/ubuntu/web
   cd /home/ubuntu/web
   git clone https://github.com/rmoral/report_bolsa_web.git
   ```

2. **Configura la app** dentro de `earlymarketreports`:
   - Crea `.env.production` con las variables de producción (MongoDB, Stripe, etc.).
   - Si usas systemd, añade en `.env.production`: `SYSTEMD_SERVICE=nombre-de-tu-servicio`.

3. **Primer deploy** (instalar deps, build, arrancar):

   ```bash
   cd /home/ubuntu/web/report_bolsa_web/earlymarketreports
   chmod +x scripts/deploy-ec2.sh
   ./scripts/deploy-ec2.sh
   ```

### Deploy desde tu máquina (un comando)

1. En tu **`.env.deploy`** añade la ruta del repo en el servidor:

   ```bash
   DEPLOY_REMOTE_REPO=/home/ubuntu/web/report_bolsa_web
   ```

   (El resto de variables ya las tienes: `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`.)

2. Cada vez que quieras desplegar:

   ```bash
   git push origin main
   ./scripts/deploy-via-git.sh
   ```

   El script entra por SSH, hace `git pull origin main` en el servidor y ejecuta `deploy-ec2.sh` en `earlymarketreports`.

### Rollback

En el servidor:

```bash
cd /home/ubuntu/web/report_bolsa_web
git log --oneline -5   # ver commits
git checkout <commit-o-tag>
cd earlymarketreports && ./scripts/deploy-ec2.sh
```

---

## Pasos para actualizar el código en producción (deploy por Git)

Sigue estos pasos cada vez que quieras subir cambios a producción usando Git.

### Desde tu máquina

1. **Subir cambios a GitHub**
   ```bash
   cd /ruta/report_bolsa_web
   git add -A
   git status                    # revisar qué se sube
   git commit -m "Descripción del cambio"
   git push origin main
   ```

2. **Lanzar el deploy al servidor**
   ```bash
   cd earlymarketreports
   ./scripts/deploy-via-git.sh
   ```
   El script hará por SSH: `git pull origin main` en el repo del servidor y luego `./scripts/deploy-ec2.sh` dentro de `earlymarketreports` (instalar deps, `payload:importmap`, build, reinicio del servicio).

### En el servidor (si entras por SSH a mano)

1. **Ir al repo y actualizar**
   ```bash
   cd /home/ubuntu/web/report_bolsa_web   # o tu DEPLOY_REMOTE_REPO
   git pull origin main
   ```

2. **Ejecutar el deploy**
   ```bash
   cd earlymarketreports
   ./scripts/deploy-ec2.sh
   ```

### Cambios que afectan al blog (Payload, media, API)

- **Variables de entorno:** En el servidor, `.env.production` debe tener al menos:
  - `DATABASE_URI` y `PAYLOAD_SECRET` (Payload)
  - `NEXT_PUBLIC_BASE_URL=https://tu-dominio.com`
  Si ya las tenías, no hace falta tocar nada al actualizar.

- **Import map de Payload:** El script `deploy-ec2.sh` ya ejecuta `payload:importmap`. Si añadiste colecciones o features (p. ej. media), ese paso regenera el mapa. Requiere **Node 20** en el servidor (`.nvmrc`); si usas `nvm`, haz `nvm use 20` antes de ejecutar el deploy.

- **Carpeta `media/`:** Las imágenes subidas desde el CMS se guardan en `earlymarketreports/media/`. No hace falta crearla a mano; se crea al subir el primer archivo. Esa ruta está en `.gitignore`, así que no se versiona.

- **Después del deploy:** Comprueba el blog en `https://tu-dominio.com/es/blog` (o `/en/blog`) y que un post con imagen cargue bien (p. ej. `/api/media/file/...` sin 403).

### Resumen rápido

| Dónde   | Qué hacer |
|--------|-----------|
| Local  | `git push origin main` |
| Local  | `cd earlymarketreports && ./scripts/deploy-via-git.sh` |
| Servidor | (Lo hace el script: `git pull` + `deploy-ec2.sh`) |

---

## Deploy desde la consola local (rsync + deploy)

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

## El deploy se detiene en «Installing dependencies»

En EC2 con poca RAM (p. ej. 1 GB), `npm install` puede quedarse colgado o ser matado por falta de memoria (OOM). El script ya limita la memoria de Node (`NODE_OPTIONS=--max-old-space-size=1536`) y usa `npm install --no-audit --no-fund`. Si aun así se para:

1. **Añadir swap en el servidor** (recomendado en instancias pequeñas):
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
   Luego vuelve a ejecutar `./scripts/deploy-ec2.sh`.

2. **Comprobar memoria:** `free -h` — si «available» es muy bajo, el swap ayuda.

3. **Ejecutar npm a mano** para ver si termina o da error:
   ```bash
   cd /home/ubuntu/web/report_bolsa_web/earlymarketreports
   export NODE_OPTIONS="--max-old-space-size=1536"
   npm install --no-audit --no-fund
   ```
   Si ves «Killed» sin más, suele ser OOM: añade swap o usa una instancia con más RAM.

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
