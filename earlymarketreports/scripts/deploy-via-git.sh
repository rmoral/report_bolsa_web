#!/bin/bash
# Deploy a producción usando Git (recomendado para repo público)
# 1. Conecta por SSH al servidor
# 2. Hace git pull origin main en el repo
# 3. Ejecuta deploy-ec2.sh dentro de earlymarketreports
#
# Configuración: .env.deploy con:
#   DEPLOY_SSH_HOST, DEPLOY_SSH_USER, DEPLOY_SSH_KEY (opcional)
#   DEPLOY_REMOTE_REPO - ruta en el servidor donde está clonado el repo (ej: /home/ubuntu/web/report_bolsa_web)
#
# Uso: ./scripts/deploy-via-git.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$PROJECT_ROOT/.env.deploy" ]; then
  set -a
  source "$PROJECT_ROOT/.env.deploy"
  set +a
fi

if [ -z "$DEPLOY_SSH_HOST" ] || [ -z "$DEPLOY_SSH_USER" ]; then
  echo -e "${RED}❌ Faltan DEPLOY_SSH_HOST y/o DEPLOY_SSH_USER.${NC}"
  echo "Configura .env.deploy (o export) con: DEPLOY_SSH_HOST, DEPLOY_SSH_USER, DEPLOY_REMOTE_REPO"
  exit 1
fi

if [ -z "$DEPLOY_REMOTE_REPO" ]; then
  echo -e "${RED}❌ Falta DEPLOY_REMOTE_REPO (ruta en el servidor donde está clonado el repo).${NC}"
  echo "Ejemplo: /home/ubuntu/web/report_bolsa_web"
  exit 1
fi

REMOTE="${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}"
SSH_OPTS=()
if [ -n "$DEPLOY_SSH_KEY" ]; then
  if [ ! -f "$DEPLOY_SSH_KEY" ]; then
    echo -e "${RED}❌ Clave no encontrada: $DEPLOY_SSH_KEY${NC}"
    exit 1
  fi
  SSH_OPTS=(-i "$DEPLOY_SSH_KEY" -o StrictHostKeyChecking=accept-new)
  echo -e "${BLUE}🔑 Using key: $DEPLOY_SSH_KEY${NC}"
fi

echo -e "${BLUE}🚀 Deploy vía Git → $REMOTE (repo: $DEPLOY_REMOTE_REPO)${NC}"

# En el servidor: git pull y luego deploy desde earlymarketreports
ssh "${SSH_OPTS[@]}" "$REMOTE" "cd $DEPLOY_REMOTE_REPO && git pull origin main && cd earlymarketreports && chmod +x scripts/deploy-ec2.sh && ./scripts/deploy-ec2.sh"

echo -e "${GREEN}🎉 Deploy finished.${NC}"
