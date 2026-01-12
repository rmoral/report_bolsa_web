# Troubleshooting del Deploy

## Problemas Comunes y Soluciones

### 1. Warnings de `tar` sobre atributos extendidos de macOS

**Síntoma:**
```
tar: Ignoring unknown extended header keyword 'LIBARCHIVE.xattr.com.apple.provenance'
```

**Causa:** Los archivos creados en macOS incluyen atributos extendidos (xattr) que Linux no reconoce.

**Solución:** Ya implementada en el script de deploy. El script ahora usa `--warning=no-unknown-keyword` para suprimir estos mensajes.

**Impacto:** Ninguno. Son solo advertencias y no afectan la funcionalidad.

---

### 2. Warnings de npm `EBADENGINE`

**Síntoma:**
```
npm warn EBADENGINE Unsupported engine {
  package: '@firebase/component@0.7.0',
  required: { node: '>=20.0.0' },
  current: { node: 'v18.20.8', npm: '10.8.2' }
}
```

**Causa:** Algunos paquetes de Firebase requieren Node.js >= 20.0.0, pero el servidor tiene Node.js v18.20.8.

**Soluciones:**

#### Opción A: Actualizar Node.js en el servidor (Recomendado)

```bash
# Conectar al servidor
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43

# Instalar nvm si no está instalado
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verificar versión
node -v  # Debería mostrar v20.x.x

# Reiniciar PM2 con la nueva versión
pm2 delete earlymarketreports
pm2 start npm --name earlymarketreports -- run start -- -p 3000
pm2 save
```

#### Opción B: Suprimir warnings (Temporal)

Ya implementado en el script de deploy. Los warnings se filtran durante `npm ci` y `npm install`.

**Impacto:** 
- Los warnings no afectan la funcionalidad actual
- Podrían causar problemas en futuras actualizaciones de Firebase
- Se recomienda actualizar a Node.js 20 para evitar problemas futuros

---

### 3. Verificar el estado del deploy

Después de un deploy, verifica que todo esté funcionando:

```bash
# Verificar que PM2 está corriendo
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 list"

# Ver logs de la aplicación
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 logs earlymarketreports --lines 50"

# Verificar que el servidor responde
curl -I https://earlymarketreports.com
```

---

### 4. Mejoras implementadas en el script de deploy

1. ✅ Supresión de warnings de `tar` sobre atributos extendidos
2. ✅ Verificación de versión de Node.js con advertencia si es < 20
3. ✅ Filtrado de warnings `EBADENGINE` durante instalación de dependencias
4. ✅ Limpieza automática de archivos temporales de macOS

---

### 5. Próximos pasos recomendados

1. **Actualizar Node.js a versión 20 LTS** en el servidor (ver Opción A arriba)
2. **Configurar `.nvmrc`** en el proyecto para especificar la versión de Node.js requerida
3. **Añadir verificación de versión** en el script de deploy que falle si Node.js < 20

---

## Comandos útiles

```bash
# Ver versión de Node.js en el servidor
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "node -v"

# Ver versión de npm
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "npm -v"

# Ver procesos de PM2
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 list"

# Reiniciar la aplicación
ssh -i /Users/rubenmoral/certs/personal.pem ubuntu@18.217.132.43 "pm2 restart earlymarketreports"
```
