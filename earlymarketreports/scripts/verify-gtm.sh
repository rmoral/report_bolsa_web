#!/bin/bash

# Script de verificación de Google Tag Manager
# Verifica que GTM esté presente en todas las páginas del sitio

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

GTM_ID="GTM-PVZFJ4WV"
BASE_URL="${1:-http://18.217.132.43}"

echo -e "${BLUE}🔍 Verificando Google Tag Manager en todas las páginas...${NC}"
echo -e "${YELLOW}URL base: $BASE_URL${NC}\n"

# Lista de páginas a verificar
PAGES=(
  "/"
  "/precios"
  "/subscribe"
  "/login"
  "/legal/terminos"
  "/legal/privacidad"
  "/legal/cookies"
  "/legal/aviso-riesgos"
  "/es"
  "/es/precios"
  "/es/subscribe"
  "/es/login"
  "/es/legal/terminos"
  "/es/legal/privacidad"
  "/es/legal/cookies"
  "/es/legal/aviso-riesgos"
)

# Contadores
TOTAL=0
PASSED=0
FAILED=0

# Función para verificar una página
check_page() {
  local url=$1
  local full_url="${BASE_URL}${url}"
  
  TOTAL=$((TOTAL + 1))
  
  echo -n "Verificando ${url}... "
  
  # Obtener el HTML de la página
  HTML=$(curl -s -L "$full_url" 2>/dev/null || echo "")
  
  if [ -z "$HTML" ]; then
    echo -e "${RED}❌ ERROR: No se pudo cargar la página${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
  
  # Verificar que GTM aparece en el HTML
  GTM_COUNT=$(echo "$HTML" | grep -o "$GTM_ID" | wc -l | tr -d ' ')
  
  if [ "$GTM_COUNT" -eq "0" ]; then
    echo -e "${RED}❌ ERROR: GTM no encontrado${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
  
  # Verificar que aparece en el head
  HEAD_SECTION=$(echo "$HTML" | sed -n '/<head>/,/<\/head>/p')
  IN_HEAD=$(echo "$HEAD_SECTION" | grep -c "$GTM_ID" || echo "0")
  
  # Verificar que aparece en el body (noscript)
  BODY_SECTION=$(echo "$HTML" | sed -n '/<body>/,/<\/body>/p')
  IN_BODY=$(echo "$BODY_SECTION" | grep -c "$GTM_ID" || echo "0")
  
  if [ "$IN_HEAD" -eq "0" ]; then
    echo -e "${RED}❌ ERROR: GTM no encontrado en <head>${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
  
  if [ "$IN_BODY" -eq "0" ]; then
    echo -e "${YELLOW}⚠️  WARNING: GTM noscript no encontrado en <body>${NC}"
    # No contamos esto como fallo crítico, pero lo reportamos
  fi
  
  echo -e "${GREEN}✅ OK${NC} (encontrado $GTM_COUNT veces)"
  PASSED=$((PASSED + 1))
  return 0
}

# Verificar todas las páginas
echo -e "${BLUE}📋 Verificando ${#PAGES[@]} páginas...${NC}\n"

for page in "${PAGES[@]}"; do
  check_page "$page"
done

# Resumen
echo -e "\n${BLUE}📊 Resumen de Verificación:${NC}"
echo -e "   Total de páginas: $TOTAL"
echo -e "   ${GREEN}✅ Exitosas: $PASSED${NC}"
echo -e "   ${RED}❌ Fallidas: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}🎉 ¡Todas las páginas tienen GTM correctamente implementado!${NC}"
  exit 0
else
  echo -e "\n${RED}⚠️  Algunas páginas tienen problemas. Revisa los errores arriba.${NC}"
  exit 1
fi
