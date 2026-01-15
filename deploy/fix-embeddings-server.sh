#!/usr/bin/env bash
# Script para arreglar y levantar el servicio embeddings-server

set -euo pipefail

SERVER="ubuntu@18.217.132.43"
KEY="/Users/rubenmoral/certs/personal.pem"

echo "🔧 Arreglando embeddings-server..."

ssh -i "$KEY" $SERVER << 'EOF'
set -euo pipefail

cd /var/www/html/chatbot

echo "1. Eliminando entorno virtual corrupto..."
rm -rf venv

echo "2. Creando nuevo entorno virtual..."
python3 -m venv venv

echo "3. Activando entorno virtual..."
source venv/bin/activate

echo "4. Actualizando pip..."
pip install --upgrade pip

echo "5. Instalando dependencias..."
pip install flask spacy numpy

echo "6. Descargando modelo de spacy (es_core_news_md)..."
python -m spacy download es_core_news_md || {
    echo "⚠️  No se pudo descargar el modelo automáticamente"
    echo "   Puedes descargarlo manualmente con: python -m spacy download es_core_news_md"
}

echo "7. Verificando instalación..."
python -c "import flask, spacy, numpy; print('✅ Todas las dependencias instaladas correctamente')"

echo "8. Probando carga del modelo..."
python -c "import spacy; nlp = spacy.load('es_core_news_md'); print('✅ Modelo cargado correctamente')" || {
    echo "⚠️  El modelo no se pudo cargar. Verifica que esté instalado."
}

echo "9. Eliminando servicio PM2 antiguo..."
pm2 delete embeddings-server || true

echo "10. Creando nuevo servicio PM2..."
pm2 start embedding_server.py \
  --name embeddings-server \
  --interpreter venv/bin/python \
  --cwd /var/www/html/chatbot \
  --env production

echo "11. Guardando configuración PM2..."
pm2 save

echo "12. Verificando estado..."
sleep 2
pm2 list | grep embeddings-server

echo ""
echo "✅ Proceso completado!"
echo "📋 Verifica los logs con: pm2 logs embeddings-server"
EOF

echo ""
echo "✅ Script completado. Verifica el estado con:"
echo "   ssh -i $KEY $SERVER 'pm2 list'"
