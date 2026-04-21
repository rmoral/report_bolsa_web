#!/bin/bash
# Deploy desde tu máquina local al EC2
# 1. Sube el código con rsync
# 2. Entra por SSH y ejecuta deploy-ec2.sh en el servidor
#
# Configuración: define estas variables antes de ejecutar (o en .env.deploy):
#   DEPLOY_SSH_HOST     - ej: ec2-xx-xx-xx-xx.compute.amazonaws.com o IP
#   DEPLOY_SSH_USER     - ej: ubuntu o ec2-user
#   DEPLOY_REMOTE_PATH  - ej: /home/ubuntu/earlymarketreports
#   DEPLOY_SSH_KEY      - (opcional) ruta a la clave .pem para EC2
#
# Uso: ./scripts/deploy-from-local.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Cargar .env.deploy si existe (no subir este archivo al repo si tiene datos sensibles)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$PROJECT_ROOT/.env.deploy" ]; then
  set -a
  source "$PROJECT_ROOT/.env.deploy"
  set +a
fi

if [ -z "$DEPLOY_SSH_HOST" ] || [ -z "$DEPLOY_SSH_USER" ] || [ -z "$DEPLOY_REMOTE_PATH" ]; then
  echo -e "${RED}❌ Faltan variables de deploy.${NC}"
  echo ""
  echo "Define (o crea .env.deploy con):"
  echo "  export DEPLOY_SSH_HOST=tu-ec2.ejemplo.com"
  echo "  export DEPLOY_SSH_USER=ubuntu"
  echo "  export DEPLOY_REMOTE_PATH=/home/ubuntu/earlymarketreports"
  echo "  export DEPLOY_SSH_KEY=/ruta/a/tu-clave.pem   # opcional, para EC2"
  exit 1
fi

REMOTE="${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}"

# Opción: clave PEM para EC2 (rsync y ssh la usan)
RSYNC_SSH_OPTS=()
SSH_OPTS=()
if [ -n "$DEPLOY_SSH_KEY" ]; then
  if [ ! -f "$DEPLOY_SSH_KEY" ]; then
    echo -e "${RED}❌ Clave no encontrada: $DEPLOY_SSH_KEY${NC}"
    exit 1
  fi
  RSYNC_SSH_OPTS=(-e "ssh -i $DEPLOY_SSH_KEY -o StrictHostKeyChecking=accept-new")
  SSH_OPTS=(-i "$DEPLOY_SSH_KEY" -o StrictHostKeyChecking=accept-new)
  echo -e "${BLUE}🔑 Using key: $DEPLOY_SSH_KEY${NC}"
fi

echo -e "${BLUE}🚀 Deploy desde local → $REMOTE ($DEPLOY_REMOTE_PATH)${NC}"

# 1. Subir código con rsync (excluye node_modules, .next, .git, .env)
echo -e "${YELLOW}📤 Uploading files (rsync)...${NC}"
rsync -avz --delete "${RSYNC_SSH_OPTS[@]}" \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env*' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'media' \
  "$PROJECT_ROOT/" "$REMOTE:$DEPLOY_REMOTE_PATH/"

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ rsync failed. Check SSH key and host.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Files uploaded${NC}"

# 2. En el servidor: ejecutar deploy-ec2.sh
echo -e "${YELLOW}🔨 Running deploy on server...${NC}"
ssh "${SSH_OPTS[@]}" "$REMOTE" "cd $DEPLOY_REMOTE_PATH && chmod +x scripts/deploy-ec2.sh && ./scripts/deploy-ec2.sh"

echo -e "${GREEN}🎉 Deploy finished.${NC}"
