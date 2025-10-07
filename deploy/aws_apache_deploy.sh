#!/usr/bin/env bash
set -euo pipefail

# Configuración
SERVER="ubuntu@18.217.132.43"
KEY="/Users/rubenmoral/certs/personal.pem"
REMOTE_DIR="/home/ubuntu/web/dailyreportweb"
APP_DIR="$REMOTE_DIR/earlymarketreports"

echo "[1/4] Empaquetando proyecto (earlymarketreports)"
tar -czf earlymarketreports.tgz earlymarketreports

echo "[2/4] Copiando paquete al servidor"
scp -i "$KEY" earlymarketreports.tgz "$SERVER:$REMOTE_DIR/"

echo "[3/4] Desplegando en el servidor"
ssh -i "$KEY" $SERVER bash -lc "'
  set -euo pipefail
  cd $REMOTE_DIR
  rm -rf earlymarketreports
  tar -xzf earlymarketreports.tgz && rm earlymarketreports.tgz
  cd earlymarketreports
  npm ci
  npm run build
  pm2 delete earlymarketreports || true
  pm2 start npm --name earlymarketreports -- run start -- -p 3000
  pm2 save
  sudo systemctl reload apache2 || true
'"

echo "[4/4] Limpieza local"
rm -f earlymarketreports.tgz

echo "Despliegue completado: http://18.217.132.43"


