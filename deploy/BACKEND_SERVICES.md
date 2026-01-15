# Gestión de Servicios Backend en Producción

## Servicios Backend Disponibles

En el servidor de producción hay dos servicios backend gestionados con PM2:

1. **chatbot-backend** - Servicio principal del chatbot (Node.js)
   - Estado: ✅ Online
   - Ubicación: `/var/www/html/chatbot/dist/server.js`
   - Puerto: Configurado en el código del servicio

2. **embeddings-server** - Servidor de embeddings (Python/Flask)
   - Estado: ❌ Errored
   - Ubicación: `/var/www/html/chatbot/embedding_server.py`
   - Problema: Error de importación de numpy/spacy

## Comandos Rápidos para Levantar Servicios

### Levantar chatbot-backend

```bash
# Si está detenido, iniciarlo
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 start chatbot-backend"

# Si necesita reinicio
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 restart chatbot-backend"
```

### Levantar embeddings-server

```bash
# Opción 1: Usar el script automático (recomendado)
cd /Users/rubenmoral/AI/report_bolsa_web
./deploy/fix-embeddings-server.sh

# Opción 2: Reiniciar manualmente (si ya está arreglado)
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 restart embeddings-server"
```

## Comandos Útiles

### Ver estado de todos los servicios

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 list"
```

### Ver información detallada de un servicio

```bash
# Para chatbot-backend
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 describe chatbot-backend"

# Para embeddings-server
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 describe embeddings-server"
```

### Ver logs de un servicio

```bash
# Logs en tiempo real
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 logs chatbot-backend"

# Últimas 50 líneas
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 logs chatbot-backend --lines 50 --nostream"

# Logs de embeddings-server
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 logs embeddings-server --lines 50 --nostream"
```

### Reiniciar un servicio

```bash
# Reiniciar chatbot-backend
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 restart chatbot-backend"

# Reiniciar embeddings-server
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 restart embeddings-server"
```

### Detener un servicio

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 stop chatbot-backend"
```

### Iniciar un servicio

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 start chatbot-backend"
```

### Guardar configuración de PM2

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 save"
```

## Solución Rápida: Script Automático

Para arreglar y levantar el servicio `embeddings-server` automáticamente:

```bash
cd /Users/rubenmoral/AI/report_bolsa_web
./deploy/fix-embeddings-server.sh
```

Este script:
- Elimina el entorno virtual corrupto
- Crea un nuevo entorno virtual
- Instala todas las dependencias necesarias
- Descarga el modelo de spacy
- Recrea el servicio en PM2

## Solución Manual para embeddings-server

El servicio `embeddings-server` está fallando debido a un problema con numpy y un entorno virtual corrupto. Para solucionarlo manualmente:

### Opción 1: Recrear entorno virtual (Recomendado)

El entorno virtual está apuntando a rutas de macOS que no existen en el servidor Linux. La mejor solución es recrearlo:

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 << 'EOF'
cd /var/www/html/chatbot

# Eliminar entorno virtual corrupto
rm -rf venv

# Crear nuevo entorno virtual
python3 -m venv venv

# Activar y actualizar
source venv/bin/activate
pip install --upgrade pip

# Instalar dependencias
pip install flask spacy numpy

# Descargar modelo de spacy
python -m spacy download es_core_news_md

# Recrear servicio PM2
pm2 delete embeddings-server || true
pm2 start embedding_server.py \
  --name embeddings-server \
  --interpreter venv/bin/python \
  --cwd /var/www/html/chatbot \
  --env production
pm2 save
EOF
```

### Opción 2: Reinstalar dependencias Python

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 << 'EOF'
cd /var/www/html/chatbot

# Activar entorno virtual
source venv/bin/activate

# Reinstalar numpy y spacy
pip uninstall -y numpy spacy
pip install numpy spacy

# Verificar que el modelo de spacy esté instalado
python -c "import spacy; spacy.load('es_core_news_md')"

# Reiniciar el servicio
pm2 restart embeddings-server
EOF
```

### Opción 3: Verificar y corregir el entorno virtual

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 << 'EOF'
cd /var/www/html/chatbot

# Verificar que el entorno virtual existe
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activar y actualizar pip
source venv/bin/activate
pip install --upgrade pip

# Instalar dependencias
pip install flask spacy numpy

# Descargar modelo de spacy si no está instalado
python -m spacy download es_core_news_md

# Probar que funciona
python embedding_server.py

# Si funciona, reiniciar con PM2
pm2 restart embeddings-server
EOF
```

### Opción 4: Recrear el servicio en PM2

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 << 'EOF'
cd /var/www/html/chatbot

# Eliminar el servicio actual
pm2 delete embeddings-server

# Crear nuevo servicio
pm2 start embedding_server.py \
  --name embeddings-server \
  --interpreter python3 \
  --cwd /var/www/html/chatbot \
  --env production

# Guardar configuración
pm2 save
EOF
```

## Verificar que los servicios están funcionando

### Verificar chatbot-backend

```bash
# Verificar que responde (ajusta el puerto según tu configuración)
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "curl -s http://localhost:PUERTO/health || echo 'Servicio no responde'"
```

### Verificar embeddings-server

```bash
# Probar el endpoint de embeddings
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 << 'EOF'
curl -X POST http://localhost:PUERTO/generate-embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}'
EOF
```

## Monitoreo Continuo

### Ver todos los logs en tiempo real

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 logs"
```

### Ver métricas de recursos

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 monit"
```

### Verificar que PM2 se inicia automáticamente al reiniciar el servidor

```bash
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 startup"
```

Este comando mostrará un comando que debes ejecutar con `sudo` para configurar el inicio automático.

## Troubleshooting

### Si un servicio no inicia

1. Ver los logs de error:
   ```bash
   ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 logs NOMBRE_SERVICIO --err --lines 50"
   ```

2. Verificar que el archivo existe:
   ```bash
   ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "ls -la /ruta/al/archivo"
   ```

3. Probar ejecutar el servicio manualmente:
   ```bash
   ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "cd /ruta/del/servicio && node archivo.js"
   ```

### Si un servicio se reinicia constantemente

1. Ver el número de reinicios:
   ```bash
   ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 list"
   ```

2. Ver logs para identificar el error:
   ```bash
   ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 logs NOMBRE_SERVICIO --lines 100"
   ```

3. Aumentar el límite de reinicios o deshabilitar el auto-restart temporalmente:
   ```bash
   ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 stop NOMBRE_SERVICIO"
   ```
