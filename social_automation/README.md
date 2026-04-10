# Social Media Automation System

Automatización completa de publicaciones en **LinkedIn**, **X (Twitter)** e **Instagram** basada en noticias económicas, políticas y bursátiles de impacto mundial. Control total vía **Telegram**.

## Arquitectura

```
social_automation/
├── main.py              ← Punto de entrada (scheduler + bot Telegram)
├── pipeline.py          ← Pipeline diario: noticias → contenido → aprobación
├── scheduler.py         ← APScheduler: ejecución automática diaria
├── config.py            ← Configuración desde variables de entorno
├── requirements.txt
├── setup.sh             ← Script de instalación
│
├── news/
│   ├── fetcher.py       ← Búsqueda de noticias (RSS + NewsAPI)
│   └── ranker.py        ← Ranking por impacto global
│
├── content/
│   └── generator.py     ← Generación de contenido con Claude AI
│
├── publishers/
│   ├── twitter.py       ← Publicación en X/Twitter (Tweepy v4)
│   ├── linkedin.py      ← Publicación en LinkedIn (UGC API v2)
│   └── instagram.py     ← Publicación en Instagram (Graph API)
│
├── telegram/
│   ├── bot.py           ← Configuración del bot
│   └── handlers.py      ← Comandos y callbacks de aprobación
│
└── database/
    ├── models.py         ← Modelos SQLAlchemy (NewsItem, Post, etc.)
    └── db.py             ← Operaciones async de base de datos
```

## Flujo de trabajo

```
07:00 (configurable)
  │
  ▼
[Fetch] RSS + NewsAPI → 30-80 artículos
  │
  ▼
[Rank] Puntuación por impacto, fuente y recencia → Top 5
  │
  ▼
[Generate] Claude AI genera contenido específico para cada red social
  │
  ▼
[Telegram] Admin recibe preview con botones: ✅ Aprobar / ❌ Rechazar / ✏️ Editar
  │
  ▼
[Publish] Publicación automática tras aprobación
  │
  ▼
[Log] Resultado guardado en SQLite + confirmación en Telegram
```

## Instalación

### 1. Prerrequisitos

- Python 3.10+
- Cuenta de desarrollador en cada plataforma (ver abajo)
- Bot de Telegram creado via @BotFather

### 2. Setup

```bash
cd social_automation
chmod +x setup.sh
./setup.sh
```

### 3. Configurar credenciales

```bash
cp .env.example .env
nano .env   # Rellenar todas las claves API
```

### 4. Ejecutar

```bash
source .venv/bin/activate
python main.py
```

### 5. Instalar como servicio (producción)

```bash
# Ajusta la ruta en social-automation.service
sudo cp social-automation.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable social-automation
sudo systemctl start social-automation
sudo journalctl -u social-automation -f  # Ver logs
```

## Credenciales necesarias

### Telegram
1. Habla con [@BotFather](https://t.me/BotFather) → `/newbot`
2. Copia el token → `TELEGRAM_BOT_TOKEN`
3. Tu chat ID personal → habla con [@userinfobot](https://t.me/userinfobot) → `TELEGRAM_ADMIN_CHAT_ID`

### X / Twitter
1. Accede a [developer.twitter.com](https://developer.twitter.com)
2. Crea una App con permisos de Read + Write
3. Genera Access Token con OAuth 1.0a User Context
4. Copia las 5 claves al `.env`

### LinkedIn
1. Accede a [linkedin.com/developers](https://www.linkedin.com/developers/)
2. Crea una App con los permisos: `w_member_social`, `r_liteprofile`
3. Genera un Access Token (OAuth 2.0) — duración 60 días, renovar periódicamente
4. Tu Person URN: ve a tu perfil → URL → extrae el ID numérico → `urn:li:person:XXXXX`

### Instagram
**Opción A (recomendada): Meta Graph API**
1. Necesitas: Cuenta de Instagram Business/Creator + Página de Facebook vinculada
2. En [developers.facebook.com](https://developers.facebook.com), crea una App tipo "Business"
3. Añade producto "Instagram Graph API"
4. Genera un token de larga duración (60 días) → `INSTAGRAM_ACCESS_TOKEN`
5. Obtén el `ig-user-id` → `INSTAGRAM_ACCOUNT_ID`

**Opción B: Login directo (instagrapi)**
- Requiere `INSTAGRAM_USERNAME` + `INSTAGRAM_PASSWORD` en `.env`
- No requiere cuenta Business
- Menos estable (puede requerir 2FA manual)
- **Nota**: Las imágenes son obligatorias para Instagram

### NewsAPI (opcional pero recomendado)
- Registro gratuito en [newsapi.org](https://newsapi.org/) → `NEWSAPI_KEY`
- Plan gratuito: 100 peticiones/día (suficiente para uso diario)

## Comandos Telegram

| Comando | Descripción |
|---------|-------------|
| `/start` | Bienvenida y menú de comandos |
| `/help` | Ayuda completa |
| `/run` | Lanzar proceso manualmente |
| `/pending` | Ver publicaciones pendientes de aprobación |
| `/news [n]` | Ver las últimas n noticias procesadas |
| `/stats` | Estadísticas de publicación (últimos 7 días) |
| `/status` | Estado de conexión de cada plataforma |
| `/cancel` | Cancelar operación en curso |

## Configuración avanzada

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DAILY_RUN_HOUR` | `7` | Hora de ejecución diaria (formato 24h) |
| `DAILY_RUN_MINUTE` | `0` | Minuto de ejecución |
| `TIMEZONE` | `Europe/Madrid` | Zona horaria del scheduler |
| `MAX_NEWS_ITEMS` | `5` | Noticias a procesar por ejecución |
| `CONTENT_LANGUAGE` | `es` | Idioma del contenido (`es` o `en`) |
| `AUTO_PUBLISH` | `false` | Publicar sin aprobación manual |

## Notas importantes

- **Instagram requiere imagen**: El API de Instagram no permite posts solo de texto. El sistema genera un prompt de imagen; deberás integrar DALL-E o similar para auto-generar imágenes, o usar imágenes de stock.
- **Límites de Twitter**: El plan gratuito de X API permite 1 tweet cada 15 minutos por cuenta.
- **Token de LinkedIn**: Caduca a los 60 días. Configura un recordatorio para renovarlo.
- **Base de datos**: SQLite en `social_automation.db`. Para producción de alta escala, migrar a PostgreSQL cambiando `DATABASE_URL`.
