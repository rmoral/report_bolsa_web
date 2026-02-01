#!/bin/bash
# EarlyMarketReports - Deploy en EC2 (Next.js + Payload)
# Ejecutar en el servidor EC2 (o vía SSH) desde la raíz del proyecto.
# Requiere: Node 20, npm o pnpm, variables de entorno en .env.production (o exportadas).

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detectar gestor de paquetes: pnpm si existe, si no npm
# En el servidor suele usarse npm; npm ci exige package-lock.json sincronizado (este repo usa pnpm), así que usamos npm install
if command -v pnpm &> /dev/null; then
  PKG=pnpm
  INSTALL_CMD="pnpm install --frozen-lockfile"
else
  PKG=npm
  INSTALL_CMD="npm install"
fi
echo -e "${BLUE}📦 Using: $PKG${NC}"

echo -e "${BLUE}🚀 Deploy EarlyMarketReports (EC2)...${NC}"

# Opcional: cargar .env.production si existe
if [ -f .env.production ]; then
  echo -e "${YELLOW}📄 Loading .env.production${NC}"
  set -a
  source .env.production
  set +a
fi

# Comprobar Node 20 (payload:importmap lo necesita)
NODE_VER=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VER" ] || [ "$NODE_VER" -lt 20 ]; then
  echo -e "${YELLOW}⚠️  Node 20+ recommended. If payload:importmap fails, switch: nvm use 20${NC}"
fi

# Con npm: borrar node_modules para evitar ENOTEMPTY (restos de instalaciones anteriores)
if [ "$PKG" = "npm" ] && [ -d node_modules ]; then
  echo -e "${YELLOW}🧹 Cleaning node_modules for fresh install...${NC}"
  rm -rf node_modules
fi

# Limitar memoria de Node en servidores con poca RAM (evita OOM al instalar)
if [ -z "$NODE_OPTIONS" ]; then
  export NODE_OPTIONS="--max-old-space-size=1536"
  echo -e "${BLUE}📌 NODE_OPTIONS=$NODE_OPTIONS (para evitar quedarse sin memoria)${NC}"
fi

# Instalar dependencias (--no-audit --no-fund acelera y reduce uso de red/memoria)
echo -e "${YELLOW}📦 Installing dependencies... (puede tardar varios minutos en EC2)${NC}"
if [ "$PKG" = "npm" ]; then
  npm install --no-audit --no-fund
else
  $INSTALL_CMD
fi

# Import map de Payload (requiere Node 20)
echo -e "${YELLOW}📋 Generating Payload import map...${NC}"
$PKG run payload:importmap || {
  echo -e "${YELLOW}⚠️  payload:importmap failed (e.g. Node 24). Try: nvm use 20 && $PKG run payload:importmap${NC}"
  echo -e "${YELLOW}   Continuing with existing import map if present.${NC}"
}

# Build
echo -e "${YELLOW}🔨 Building Next.js...${NC}"
$PKG run build

echo -e "${GREEN}✅ Build completed${NC}"

# Reiniciar la aplicación: systemd (si SYSTEMD_SERVICE está definido) o PM2
if [ -n "$SYSTEMD_SERVICE" ]; then
  echo -e "${YELLOW}🔄 Restarting systemd service: $SYSTEMD_SERVICE${NC}"
  sudo systemctl restart "$SYSTEMD_SERVICE"
  echo -e "${GREEN}✅ Service restarted${NC}"
elif command -v pm2 &> /dev/null; then
  APP_NAME="${PM2_APP_NAME:-earlymarketreports}"
  echo -e "${YELLOW}🔄 Restarting PM2 ($APP_NAME) from current directory...${NC}"
  pm2 delete "$APP_NAME" 2>/dev/null || true
  pm2 start npm --name "$APP_NAME" -- run start
  pm2 save 2>/dev/null || true
  echo -e "${GREEN}✅ PM2 started from $(pwd)${NC}"
else
  echo -e "${GREEN}✅ Build done. Restart the app manually.${NC}"
  echo -e "${YELLOW}   Si usas systemd, define SYSTEMD_SERVICE=nombre-servicio (en .env.production o export) y vuelve a ejecutar el deploy.${NC}"
  echo -e "${YELLOW}   Ejemplo: sudo systemctl restart tu-servicio${NC}"
fi

echo -e "${GREEN}🎉 Deploy done.${NC}"
