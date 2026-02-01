# Configuración inicial de Payload CMS en producción

Guía para crear el primer usuario admin y dejar la base de datos lista la primera vez que usas Payload en producción.

---

## 1. Variables de entorno en el servidor

En `.env.production` (o donde cargue tu proceso en EC2) Payload necesita:

| Variable        | Descripción |
|-----------------|-------------|
| **DATABASE_URI** | URI de MongoDB (ej. `mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority`). Puede ser la misma que usas para el resto de la app (`MONGODB_URI`). |
| **PAYLOAD_SECRET** | Cadena secreta para firmar sesiones y tokens. Genera una aleatoria (ej. `openssl rand -base64 32`). |

Ejemplo:

```bash
DATABASE_URI=mongodb+srv://usuario:password@cluster.mongodb.net/earlymarketreports?retryWrites=true&w=majority
PAYLOAD_SECRET=tu-secreto-aleatorio-muy-largo
```

Si el resto de la app ya usa MongoDB con `MONGODB_URI`, puedes poner:

```bash
DATABASE_URI=$MONGODB_URI
# o simplemente repetir el mismo valor
```

---

## 2. Base de datos

**No hace falta crear colecciones a mano.** Payload las crea al usarlas por primera vez (por ejemplo al crear el primer usuario o el primer post).

- Asegúrate de que la URI apunte a una base existente o que MongoDB permita crearla.
- El usuario de la URI debe tener permisos de lectura/escritura en esa base.

---

## 3. Crear el primer usuario admin

1. **Reinicia la app** en el servidor para que cargue las variables (si acabas de añadirlas):
   ```bash
   sudo systemctl restart earlymarketreports   # o el nombre de tu servicio
   ```

2. **Abre el panel de Payload** en el navegador:
   ```
   https://tu-dominio.com/cms
   ```
   (Si tienes redirect de `/admin` → `/cms`, también vale `https://tu-dominio.com/admin`.)

3. **Primera vez:** si no existe ningún usuario en la colección `users`, Payload muestra la pantalla **“Create first user”**.

4. **Rellena**:
   - **Email**: el que usarás para entrar al CMS (ej. `admin@tudominio.com`).
   - **Password**: una contraseña segura.

5. **Enviar.** Ese usuario queda como primer admin y ya puedes entrar al panel.

A partir de ahí puedes:
- Crear más usuarios desde **CMS → Users**.
- Crear y publicar **Posts** para el blog.
- Cambiar contraseña desde el propio panel.

---

## 4. Comprobar que todo va bien

- **Login:** `https://tu-dominio.com/cms` → email y contraseña del usuario creado.
- **API:** `https://tu-dominio.com/api/users` (o la ruta que tengas para la colección) debería responder según los permisos (autenticado/admin).
- **MongoDB:** en la base indicada en `DATABASE_URI` deberían aparecer colecciones como `payload_preferences`, `users`, `posts` (cuando los uses).

---

## Resumen

| Paso | Acción |
|------|--------|
| 1 | Definir `DATABASE_URI` y `PAYLOAD_SECRET` en `.env.production` (o equivalente). |
| 2 | Reiniciar la aplicación en el servidor. |
| 3 | Ir a `https://tu-dominio.com/cms` y crear el primer usuario en la pantalla “Create first user”. |
| 4 | Entrar al CMS con ese usuario y configurar contenido (posts, etc.). |

No hace falta ningún script ni comando en el servidor para crear el usuario: Payload lo hace desde la interfaz web la primera vez que no hay usuarios.
