# Guía de Verificación de Google Tag Manager

Esta guía te ayudará a verificar que los scripts de Google Tag Manager (GTM) están correctamente implementados en todas las páginas del sitio.

## 📋 Lista de Páginas a Verificar

### Páginas Principales
- `/` - Homepage (inglés)
- `/es` - Homepage (español)
- `/precios` - Página de precios
- `/es/precios` - Página de precios (español)
- `/subscribe` - Página de suscripción
- `/es/subscribe` - Página de suscripción (español)
- `/login` - Página de login
- `/es/login` - Página de login (español)

### Páginas Legales
- `/legal/terminos` - Términos y condiciones
- `/es/legal/terminos` - Términos y condiciones (español)
- `/legal/privacidad` - Política de privacidad
- `/es/legal/privacidad` - Política de privacidad (español)
- `/legal/cookies` - Política de cookies
- `/es/legal/cookies` - Política de cookies (español)
- `/legal/aviso-riesgos` - Aviso de riesgos
- `/es/legal/aviso-riesgos` - Aviso de riesgos (español)

### Páginas Protegidas (requieren autenticación)
- `/dashboard` - Dashboard del usuario
- `/es/dashboard` - Dashboard del usuario (español)
- `/reports/[filename]` - Informes completos

### Páginas de Administración
- `/admin/subscriptions` - Administración de suscripciones
- `/admin/users` - Administración de usuarios

## 🔍 Métodos de Verificación

### Método 1: Verificación en el Código Fuente (View Source)

**Pasos:**
1. Abre cualquier página del sitio en tu navegador
2. Haz clic derecho → "Ver código fuente" (o `Ctrl+U` / `Cmd+Option+U`)
3. Busca `GTM-PVZFJ4WV` en el código fuente

**Qué buscar:**
- ✅ Debe aparecer **en el `<head>`**: Script de GTM con `dataLayer`
- ✅ Debe aparecer **en el `<body>`**: Tag `<noscript>` con iframe

**Ejemplo de lo que deberías ver:**

```html
<head>
  <!-- Google Tag Manager -->
  <script>
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-PVZFJ4WV');
  </script>
  <!-- End Google Tag Manager -->
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript>
    <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PVZFJ4WV"
    height="0" width="0" style="display:none;visibility:hidden"></iframe>
  </noscript>
  <!-- End Google Tag Manager (noscript) -->
</body>
```

### Método 2: Verificación con Herramientas de Desarrollador (DevTools)

**Pasos:**
1. Abre cualquier página del sitio
2. Presiona `F12` o `Cmd+Option+I` (Mac) para abrir DevTools
3. Ve a la pestaña **Console**
4. Escribe: `dataLayer` y presiona Enter

**Resultado esperado:**
- ✅ Debe mostrar un array con objetos de GTM
- ✅ Debe contener `gtm.start` y otros eventos

**Ejemplo:**
```javascript
> dataLayer
Array(1)
  0: {gtm.start: 1234567890, event: "gtm.js"}
```

### Método 3: Verificación en la Pestaña Network

**Pasos:**
1. Abre DevTools (`F12`)
2. Ve a la pestaña **Network**
3. Recarga la página (`Ctrl+R` / `Cmd+R`)
4. Busca `gtm.js` en el filtro

**Resultado esperado:**
- ✅ Debe aparecer una petición a `https://www.googletagmanager.com/gtm.js?id=GTM-PVZFJ4WV`
- ✅ El status debe ser `200` (OK)
- ✅ El tipo debe ser `script`

### Método 4: Verificación con Google Tag Assistant

**Pasos:**
1. Instala la extensión [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk) en Chrome
2. Navega a cualquier página del sitio
3. Haz clic en el icono de Tag Assistant
4. Haz clic en "Enable" y recarga la página

**Resultado esperado:**
- ✅ Debe detectar Google Tag Manager
- ✅ Debe mostrar el Container ID: `GTM-PVZFJ4WV`
- ✅ No debe mostrar errores

### Método 5: Verificación en el Dashboard de GTM

**Pasos:**
1. Ve a [Google Tag Manager](https://tagmanager.google.com/)
2. Selecciona tu contenedor: `GTM-PVZFJ4WV`
3. Ve a **Preview** (Vista previa)
4. Ingresa la URL de tu sitio: `http://18.217.132.43` o `https://earlymarketreports.com`
5. Haz clic en "Connect"

**Resultado esperado:**
- ✅ Debe conectarse exitosamente
- ✅ Debe mostrar todas las páginas navegadas
- ✅ Debe mostrar los tags activos en cada página

### Método 6: Verificación con Script de Automatización

Puedes usar este script en la consola del navegador para verificar múltiples páginas:

```javascript
// Script de verificación de GTM
const pagesToCheck = [
  '/',
  '/precios',
  '/subscribe',
  '/login',
  '/legal/terminos',
  '/legal/privacidad',
  '/legal/cookies',
  '/legal/aviso-riesgos'
];

async function checkGTM(page) {
  try {
    const response = await fetch(page);
    const html = await response.text();
    const hasGTMScript = html.includes('GTM-PVZFJ4WV');
    const hasGTMInHead = html.includes('<head>') && html.split('<head>')[1].includes('GTM-PVZFJ4WV');
    const hasGTMInBody = html.includes('<body>') && html.split('<body>')[1].includes('GTM-PVZFJ4WV');
    
    return {
      page,
      hasGTM: hasGTMScript,
      inHead: hasGTMInHead,
      inBody: hasGTMInBody,
      status: hasGTMScript && hasGTMInHead && hasGTMInBody ? '✅ OK' : '❌ ERROR'
    };
  } catch (error) {
    return { page, error: error.message, status: '❌ ERROR' };
  }
}

// Ejecutar verificación
Promise.all(pagesToCheck.map(checkGTM)).then(results => {
  console.table(results);
});
```

## ✅ Checklist de Verificación

Para cada página, verifica:

- [ ] El script de GTM aparece en el `<head>` del código fuente
- [ ] El tag `<noscript>` aparece en el `<body>` del código fuente
- [ ] `dataLayer` está disponible en la consola
- [ ] La petición a `gtm.js?id=GTM-PVZFJ4WV` se carga correctamente (Network tab)
- [ ] Google Tag Assistant detecta GTM sin errores
- [ ] El Preview de GTM se conecta exitosamente

## 🐛 Solución de Problemas

### Problema: GTM no aparece en el código fuente
**Solución:** Verifica que el componente `GoogleTagManagerScript` esté importado y usado en `layout.tsx`

### Problema: `dataLayer` no está definido
**Solución:** Verifica que el script de GTM se esté cargando correctamente. Revisa la pestaña Network para ver si hay errores.

### Problema: Tag Assistant no detecta GTM
**Solución:** 
- Verifica que el Container ID sea correcto: `GTM-PVZFJ4WV`
- Asegúrate de que el script esté en el `<head>` y el noscript en el `<body>`
- Verifica que no haya errores de JavaScript que bloqueen la carga

### Problema: GTM solo funciona en algunas páginas
**Solución:** Verifica que el layout raíz (`src/app/layout.tsx`) esté aplicándose a todas las páginas. No debe haber layouts anidados que sobrescriban el layout raíz.

## 📊 Verificación Rápida con cURL

Puedes verificar rápidamente desde la terminal:

```bash
# Verificar homepage
curl -s http://18.217.132.43 | grep -o "GTM-PVZFJ4WV" | head -1

# Verificar página de precios
curl -s http://18.217.132.43/precios | grep -o "GTM-PVZFJ4WV" | head -1

# Verificar que aparece en head y body
curl -s http://18.217.132.43 | grep -c "GTM-PVZFJ4WV"
# Debe retornar 2 (una vez en head, una vez en body)
```

## 🎯 Verificación Final

Una vez que hayas verificado todas las páginas, deberías tener:

- ✅ GTM cargándose en todas las páginas públicas
- ✅ `dataLayer` disponible en todas las páginas
- ✅ Sin errores en la consola relacionados con GTM
- ✅ Tags de GTM funcionando correctamente en el Preview mode

## 📝 Notas Importantes

1. **Cache del navegador:** Si no ves los cambios, limpia la caché del navegador (`Ctrl+Shift+Delete` / `Cmd+Shift+Delete`)

2. **Modo Incógnito:** Usa el modo incógnito para evitar problemas de caché durante las pruebas

3. **HTTPS vs HTTP:** Asegúrate de verificar tanto en HTTP (desarrollo) como HTTPS (producción) si aplica

4. **Ad Blockers:** Desactiva los bloqueadores de anuncios durante las pruebas, ya que pueden bloquear GTM
