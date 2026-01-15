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
# Excluir archivos temporales de macOS y otros archivos innecesarios
tar --exclude='._*' --exclude='.DS_Store' --exclude='node_modules' --exclude='.next' -czf earlymarketreports.tgz earlymarketreports

echo "[2/4] Copiando paquete al servidor"
scp -o StrictHostKeyChecking=accept-new -i "$KEY" earlymarketreports.tgz "$SERVER:$REMOTE_DIR/"

echo "[3/4] Desplegando en el servidor"
ssh -o StrictHostKeyChecking=accept-new -i "$KEY" $SERVER 'bash -s' <<'REMOTE'
set -euo pipefail
REMOTE_DIR="/home/ubuntu/web/dailyreportweb"
cd "$REMOTE_DIR"

# Detener la aplicación antes de desplegar
pm2 stop earlymarketreports || true

# Limpiar espacio en disco antes de desplegar
echo "Limpiando espacio en disco..."
# Limpiar backups antiguos (mantener solo el más reciente)
ls -td earlymarketreports.backup.* 2>/dev/null | tail -n +2 | xargs rm -rf 2>/dev/null || true
# Limpiar node_modules y .next del directorio actual si existe
if [ -d "earlymarketreports" ]; then
  rm -rf earlymarketreports/node_modules earlymarketreports/.next 2>/dev/null || true
fi
# Limpiar cache de npm
npm cache clean --force 2>/dev/null || true

# Crear backup del directorio actual por si acaso (solo si hay espacio)
AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -gt 1048576 ]; then  # Más de 1GB disponible
  if [ -d "earlymarketreports" ]; then
    mv earlymarketreports "earlymarketreports.backup.$(date +%s)" || true
  fi
else
  echo "⚠️  Poco espacio disponible, eliminando directorio anterior sin backup..."
  rm -rf earlymarketreports || true
fi

# Extraer el nuevo código
# Usar --warning=no-unknown-keyword para suprimir warnings de macOS
# Redirigir stderr a /dev/null para evitar warnings pero capturar errores reales
if ! tar --warning=no-unknown-keyword -xzf earlymarketreports.tgz 2>/dev/null; then
  echo "⚠️  Primera extracción falló, intentando sin supresión de warnings..."
  tar -xzf earlymarketreports.tgz 2>&1 | grep -v "TAR_ENTRY_ERROR\|Ignoring unknown" || {
    echo "❌ ERROR: No se pudo extraer el archivo tar"
    exit 1
  }
fi
rm -f earlymarketreports.tgz

cd earlymarketreports

# Limpiar archivos temporales de macOS si existen
find . -name "._*" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

# Verificar Node.js
if ! command -v node >/dev/null 2>&1; then 
  echo "ERROR: Node.js no está instalado en el servidor" >&2
  exit 2
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "⚠️  ADVERTENCIA: Node.js v$(node -v) detectado. Algunos paquetes requieren Node.js >= 20.0.0"
fi

# Verificar PM2
if ! command -v pm2 >/dev/null 2>&1; then 
  echo "ERROR: PM2 no está instalado en el servidor (sudo npm i -g pm2)" >&2
  exit 2
fi

# Limpiar node_modules y .next para instalación limpia
echo "Limpiando instalación anterior..."
rm -rf node_modules .next
# Asegurar que el directorio node_modules existe
mkdir -p node_modules

# Verificar espacio en disco antes de instalar
AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 524288 ]; then  # Menos de 512MB
  echo "❌ ERROR: Espacio insuficiente en disco (menos de 512MB disponible)"
  exit 1
fi

# Instalar dependencias con manejo mejorado de errores
echo "Instalando dependencias..."

# Función para instalar con filtrado de warnings
install_deps() {
  if [ -f package-lock.json ]; then
    npm ci --loglevel=error 2>&1 | grep -v "EBADENGINE\|TAR_ENTRY_ERROR\|npm warn tar" || return 1
  else
    npm install --loglevel=error 2>&1 | grep -v "EBADENGINE\|TAR_ENTRY_ERROR\|npm warn tar" || return 1
  fi
}

# Intentar instalación
if ! install_deps; then
  echo "⚠️  Primera instalación falló, limpiando completamente e intentando de nuevo..."
  rm -rf node_modules package-lock.json
  mkdir -p node_modules
  if ! install_deps; then
    echo "❌ ERROR: No se pudieron instalar las dependencias después de 2 intentos"
    echo "Verificando espacio en disco..."
    df -h /
    exit 1
  fi
fi

# Verificar que las dependencias críticas estén instaladas
echo "Verificando dependencias críticas..."
MISSING_DEPS=0

if [ ! -d "node_modules/next" ]; then
  echo "❌ ERROR: Next.js no está instalado"
  MISSING_DEPS=$((MISSING_DEPS + 1))
fi

if [ ! -d "node_modules/styled-jsx" ]; then
  echo "❌ ERROR: styled-jsx no está instalado"
  MISSING_DEPS=$((MISSING_DEPS + 1))
fi

if [ ! -d "node_modules/react" ]; then
  echo "❌ ERROR: React no está instalado"
  MISSING_DEPS=$((MISSING_DEPS + 1))
fi

# Si faltan dependencias críticas, reinstalar
if [ "$MISSING_DEPS" -gt 0 ]; then
  echo "⚠️  Faltan $MISSING_DEPS dependencias críticas. Reinstalando todas las dependencias..."
  rm -rf node_modules package-lock.json
  npm install --loglevel=error 2>&1 | grep -v "EBADENGINE\|TAR_ENTRY_ERROR\|npm warn tar" || {
    echo "❌ ERROR: No se pudieron instalar las dependencias"
    exit 1
  }
fi

# Verificación final
if [ ! -d "node_modules/next" ] || [ ! -d "node_modules/styled-jsx" ]; then
  echo "❌ ERROR: Dependencias críticas aún faltantes después de reinstalación"
  exit 1
fi

echo "✅ Todas las dependencias instaladas correctamente"

# Build
echo "Compilando aplicación..."
npm run build

# Reiniciar aplicación
echo "Reiniciando aplicación..."
pm2 delete earlymarketreports || true
pm2 start npm --name earlymarketreports -- run start -- -p 3000
pm2 save

# Recargar Apache
sudo systemctl reload apache2 || true

# Limpiar backup antiguo (mantener solo el más reciente)
cd "$REMOTE_DIR"
ls -td earlymarketreports.backup.* 2>/dev/null | tail -n +2 | xargs rm -rf 2>/dev/null || true

echo "✅ Deploy completado exitosamente"
REMOTE

echo "[4/4] Limpieza local"
rm -f earlymarketreports.tgz

echo "Despliegue completado: http://18.217.132.43"


