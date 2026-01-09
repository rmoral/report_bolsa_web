#!/bin/bash

# Script de verificación de Google Tag Manager
# Verifica que GTM esté presente en todas las páginas del sitio

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

GTM_ID="GTM-PVZFJ4WV"
BASE_URL="${1:-https://earlymarketreports.com}"

echo -e "${BLUE}🔍 Verificando Google Tag Manager en todas las páginas...${NC}"
echo -e "${YELLOW}URL base: $BASE_URL${NC}\n"

# Verificar que curl está disponible
if ! command -v curl &> /dev/null; then
  echo -e "${RED}❌ ERROR: curl no está instalado${NC}"
  exit 1
fi

# Verificar conectividad básica
echo -e "${BLUE}🔗 Verificando conectividad...${NC}"
if ! curl -s -k --max-time 5 --head "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  ADVERTENCIA: No se pudo conectar a $BASE_URL${NC}"
  echo -e "${YELLOW}   Intentando continuar de todas formas...${NC}\n"
else
  echo -e "${GREEN}✅ Conectividad OK${NC}\n"
fi

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
  
  # Determinar directorio temporal (Snap curl no puede escribir en /tmp)
  # Usar directorio home o directorio actual
  if [ -w "$HOME" ] && [ -n "$HOME" ]; then
    TEMP_DIR="$HOME"
  elif [ -w "." ]; then
    TEMP_DIR="."
  else
    TEMP_DIR="/tmp"
  fi
  
  TEMP_FILE="${TEMP_DIR}/.verify-gtm-$$-${RANDOM}.html"
  ERROR_FILE="${TEMP_DIR}/.verify-gtm-error-$$-${RANDOM}.log"
  
  # Limpiar archivos temporales previos si existen
  rm -f "$TEMP_FILE" "$ERROR_FILE" 2>/dev/null || true
  
  # Capturar el contenido directamente en una variable como fallback
  # Primero intentar con archivo temporal
  HTTP_CODE=$(curl -s -k -o "$TEMP_FILE" -w "%{http_code}" -L --max-time 15 --connect-timeout 10 \
    -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
    -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
    -H "Accept-Language: en-US,en;q=0.9" \
    "$full_url" 2>"$ERROR_FILE" || echo "000")
  
  CURL_EXIT_CODE=$?
  
  # Si el archivo no existe pero curl fue exitoso, capturar directamente en variable
  if [ "$CURL_EXIT_CODE" -eq 0 ] && [ "$HTTP_CODE" = "200" ] && [ ! -f "$TEMP_FILE" ]; then
    # Capturar directamente en variable (método alternativo para Snap curl)
    HTML=$(curl -s -k -L --max-time 15 --connect-timeout 10 \
      -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
      -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
      -H "Accept-Language: en-US,en;q=0.9" \
      "$full_url" 2>"$ERROR_FILE")
    HTML_LENGTH=${#HTML}
    
    # Si tenemos contenido, continuar con la verificación
    if [ "$HTML_LENGTH" -gt 100 ]; then
      # Saltar la lectura del archivo y continuar con la verificación
      FILE_SIZE=$HTML_LENGTH
    else
      CURL_ERROR=$(cat "$ERROR_FILE" 2>/dev/null | head -3 || echo "No se pudo obtener error")
      echo -e "${RED}❌ ERROR: No se pudo obtener contenido${NC}"
      echo -e "   ${YELLOW}Exit code: $CURL_EXIT_CODE${NC}"
      echo -e "   ${YELLOW}HTTP Code: $HTTP_CODE${NC}"
      echo -e "   ${YELLOW}Longitud: $HTML_LENGTH caracteres${NC}"
      echo -e "   ${YELLOW}Error: $CURL_ERROR${NC}"
      rm -f "$TEMP_FILE" "$ERROR_FILE" 2>/dev/null || true
      FAILED=$((FAILED + 1))
      return 1
    fi
  elif [ ! -f "$TEMP_FILE" ]; then
    CURL_ERROR=$(cat "$ERROR_FILE" 2>/dev/null | head -3 || echo "No se pudo obtener error")
    echo -e "${RED}❌ ERROR: Archivo temporal no creado${NC}"
    echo -e "   ${YELLOW}Exit code: $CURL_EXIT_CODE${NC}"
    echo -e "   ${YELLOW}HTTP Code: $HTTP_CODE${NC}"
    echo -e "   ${YELLOW}Error: $CURL_ERROR${NC}"
    echo -e "   ${YELLOW}TEMP_DIR: $TEMP_DIR${NC}"
    rm -f "$TEMP_FILE" "$ERROR_FILE" 2>/dev/null || true
    FAILED=$((FAILED + 1))
    return 1
  else
    # Leer el contenido del archivo
    HTML=$(cat "$TEMP_FILE" 2>/dev/null || echo "")
    HTML_LENGTH=${#HTML}
    FILE_SIZE=$(stat -f%z "$TEMP_FILE" 2>/dev/null || stat -c%s "$TEMP_FILE" 2>/dev/null || echo "0")
  fi
  
  # El contenido ya fue leído arriba o capturado directamente
  CURL_ERROR=$(cat "$ERROR_FILE" 2>/dev/null || echo "")
  
  # Debug: mostrar información adicional si falla
  if [ "$HTTP_CODE" = "000" ] || [ "$HTTP_CODE" != "200" ] || [ "$HTML_LENGTH" -lt 100 ]; then
    REDIRECT_URL=$(curl -s -k -I -L --max-time 5 "$full_url" 2>/dev/null | grep -i "location:" | tail -1 | cut -d' ' -f2 | tr -d '\r\n' || echo "N/A")
    CONTENT_TYPE=$(curl -s -k -I --max-time 5 "$full_url" 2>/dev/null | grep -i "content-type:" | head -1 | sed 's/Content-Type: //i' | tr -d '\r\n' || echo "N/A")
  fi
  
  # Limpiar archivos temporales
  rm -f "$TEMP_FILE" "$ERROR_FILE" 2>/dev/null || true
  
  # Verificar código HTTP
  if [ "$HTTP_CODE" = "000" ]; then
    if [ -n "$CURL_ERROR" ]; then
      ERROR_MSG=$(echo "$CURL_ERROR" | head -1 | cut -c1-80)
      echo -e "${RED}❌ ERROR: Conexión fallida${NC}"
      echo -e "   ${YELLOW}Detalle: $ERROR_MSG${NC}"
    else
      echo -e "${RED}❌ ERROR: No se pudo conectar${NC}"
    fi
    FAILED=$((FAILED + 1))
    return 1
  fi
  
  if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}❌ ERROR: HTTP $HTTP_CODE${NC}"
    if [ "$REDIRECT_URL" != "N/A" ] && [ -n "$REDIRECT_URL" ]; then
      echo -e "   ${YELLOW}Redirige a: $REDIRECT_URL${NC}"
    fi
    if [ "$CONTENT_TYPE" != "N/A" ] && [ -n "$CONTENT_TYPE" ]; then
      echo -e "   ${YELLOW}Content-Type: $CONTENT_TYPE${NC}"
    fi
    FAILED=$((FAILED + 1))
    return 1
  fi
  
  # Verificar que el HTML no esté vacío
  if [ -z "$HTML" ] || [ "$HTML_LENGTH" -lt 100 ]; then
    echo -e "${RED}❌ ERROR: Respuesta vacía o muy corta${NC}"
    echo -e "   ${YELLOW}HTTP Code: $HTTP_CODE${NC}"
    echo -e "   ${YELLOW}Longitud HTML: ${HTML_LENGTH} caracteres${NC}"
    echo -e "   ${YELLOW}Tamaño archivo: ${FILE_SIZE} bytes${NC}"
    if [ "$CONTENT_TYPE" != "N/A" ] && [ -n "$CONTENT_TYPE" ]; then
      echo -e "   ${YELLOW}Content-Type: $CONTENT_TYPE${NC}"
    fi
    if [ "$REDIRECT_URL" != "N/A" ] && [ -n "$REDIRECT_URL" ]; then
      echo -e "   ${YELLOW}Redirige a: $REDIRECT_URL${NC}"
    fi
    # Mostrar primeros caracteres de la respuesta si existe
    if [ "$HTML_LENGTH" -gt 0 ]; then
      PREVIEW=$(echo "$HTML" | head -c 100 | tr -d '\n' | sed 's/\(.\{50\}\).*/\1.../')
      echo -e "   ${YELLOW}Preview: $PREVIEW${NC}"
    fi
    # Mostrar error de curl si existe
    if [ -n "$CURL_ERROR" ]; then
      ERROR_MSG=$(echo "$CURL_ERROR" | head -1 | cut -c1-100)
      echo -e "   ${YELLOW}Curl error: $ERROR_MSG${NC}"
    fi
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
  IN_HEAD=$(echo "$HEAD_SECTION" | grep -o "$GTM_ID" | wc -l | tr -d ' \n' || echo "0")
  IN_HEAD=${IN_HEAD:-0}
  
  # Verificar que aparece en el body (noscript)
  BODY_SECTION=$(echo "$HTML" | sed -n '/<body>/,/<\/body>/p')
  IN_BODY=$(echo "$BODY_SECTION" | grep -o "$GTM_ID" | wc -l | tr -d ' \n' || echo "0")
  IN_BODY=${IN_BODY:-0}
  
  if [ "$IN_HEAD" -eq "0" ] || [ -z "$IN_HEAD" ]; then
    echo -e "${RED}❌ ERROR: GTM no encontrado en <head>${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
  
  if [ "$IN_BODY" -eq "0" ] || [ -z "$IN_BODY" ]; then
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
