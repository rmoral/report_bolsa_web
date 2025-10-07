#!/usr/bin/env bash
set -euo pipefail

# Modo debug: ./deploy/aws_apache_deploy.sh --debug
if [[ "${1:-}" == "--debug" ]]; then
  set -x
fi

# Configuración
SERVER="ubuntu@18.217.132.43"
KEY="/Users/rubenmoral/certs/personal.pem"
REMOTE_DIR="/home/ubuntu/web/dailyreportweb"
APP_DIR="$REMOTE_DIR/earlymarketreports"

if [[ ! -f "$KEY" ]]; then
  echo "ERROR: No existe la clave SSH en $KEY" >&2
  exit 1
fi

chmod 400 "$KEY" || true

echo "[0/4] Comprobando conexión SSH"
ssh -o StrictHostKeyChecking=accept-new -i "$KEY" $SERVER 'echo "SSH OK"' || {
  echo "ERROR: No se pudo establecer conexión SSH" >&2
  exit 1
}

echo "[1/4] Empaquetando proyecto (earlymarketreports)"
tar -czf earlymarketreports.tgz earlymarketreports

echo "[2/4] Copiando paquete al servidor"
scp -o StrictHostKeyChecking=accept-new -i "$KEY" earlymarketreports.tgz "$SERVER:$REMOTE_DIR/"

echo "[3/4] Desplegando en el servidor"
ssh -o StrictHostKeyChecking=accept-new -i "$KEY" $SERVER 'bash -s' <<'REMOTE'
set -euo pipefail
REMOTE_DIR="/home/ubuntu/web/dailyreportweb"
cd "$REMOTE_DIR"
rm -rf earlymarketreports
tar -xzf earlymarketreports.tgz && rm earlymarketreports.tgz
cd earlymarketreports
if ! command -v node >/dev/null 2>&1; then echo "ERROR: Node.js no está instalado en el servidor" >&2; exit 2; fi
if ! command -v pm2 >/dev/null 2>&1; then echo "ERROR: PM2 no está instalado en el servidor (sudo npm i -g pm2)" >&2; exit 2; fi
# Instala dependencias (fallback a npm install si no hay lock)
if [ -f package-lock.json ]; then npm ci; else npm install; fi
npm run build
pm2 delete earlymarketreports || true
pm2 start npm --name earlymarketreports -- run start -- -p 3000
pm2 save
sudo systemctl reload apache2 || true
REMOTE

echo "[4/4] Limpieza local"
rm -f earlymarketreports.tgz

echo "Despliegue completado: http://18.217.132.43"


