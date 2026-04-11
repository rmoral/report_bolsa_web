"""
Full video production pipeline:
  Script → HeyGen (clips) → poll → download → YouTube upload → notify → cleanup

Called from Telegram after the script is approved via the inline button.
Sends progress updates to Telegram throughout the process (5-35 min total).
"""
import asyncio
import logging
from pathlib import Path
from typing import Optional

from social_automation.config import config
from social_automation.youtube.generator import VideoScript
from social_automation.youtube import heygen, uploader

logger = logging.getLogger(__name__)


async def _notify(bot, chat_id: int, msg_id: int, text: str) -> None:
    """Edit the Telegram progress message (best-effort, never raises)."""
    try:
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=msg_id,
            text=text,
        )
    except Exception as exc:
        logger.debug("Could not edit progress message: %s", exc)


async def run_video_pipeline(
    script: VideoScript,
    chat_id: int,
    progress_msg_id: int,
    bot,
) -> Optional[str]:
    """
    Full pipeline: generate → download → upload → clean up.
    Returns the YouTube URL on success, None on failure.
    Sends live status updates to Telegram.
    """
    video_path: Optional[Path] = None

    try:
        # ── Step 1: Parse script into clips ──────────────────────────────────
        await _notify(
            bot, chat_id, progress_msg_id,
            "Preparando guion...\nParsing escenas del script.",
        )
        clips = heygen.parse_script_scenes(script.script_text)
        if not clips:
            raise ValueError(
                "No se pudieron extraer escenas del guion. "
                "Asegúrate de que el guion tiene bloques [PRESENTER]."
            )

        # ── Step 2: Submit to HeyGen ─────────────────────────────────────────
        await _notify(
            bot, chat_id, progress_msg_id,
            f"Enviando a HeyGen...\n{len(clips)} clips extraídos del guion.\n"
            "La generación puede tardar entre 5 y 30 minutos.",
        )
        video_id = await heygen.create_video(clips)

        # ── Step 3: Poll for completion ───────────────────────────────────────
        last_status = ""

        async def on_progress(status: str, elapsed: int) -> None:
            nonlocal last_status
            if status == last_status:
                return
            last_status = status
            minutes = elapsed // 60
            seconds = elapsed % 60
            status_label = {
                "processing": "Procesando vídeo...",
                "waiting": "En cola de renderizado...",
            }.get(status, status)
            await _notify(
                bot, chat_id, progress_msg_id,
                f"HeyGen: {status_label}\n"
                f"Video ID: <code>{video_id}</code>\n"
                f"Tiempo transcurrido: {minutes}m {seconds}s",
            )

        video_url = await heygen.poll_until_ready(video_id, on_progress=on_progress)

        # ── Step 4: Download ──────────────────────────────────────────────────
        await _notify(
            bot, chat_id, progress_msg_id,
            "Descargando vídeo desde HeyGen...",
        )
        safe_stem = (script.youtube_title or "video").lower()
        safe_stem = "".join(c if c.isalnum() or c in "-_ " else "_" for c in safe_stem)
        safe_stem = safe_stem.replace(" ", "_")[:50]

        video_path = await heygen.download_video(video_url, safe_stem)
        size_mb = video_path.stat().st_size / (1024 * 1024)

        # ── Step 5: Upload to YouTube ─────────────────────────────────────────
        await _notify(
            bot, chat_id, progress_msg_id,
            f"Subiendo a YouTube ({size_mb:.1f} MB)...\n"
            "Esto puede tardar unos minutos según el tamaño del vídeo.",
        )
        loop = asyncio.get_event_loop()
        yt_url = await loop.run_in_executor(
            None, uploader.upload_video, video_path, script
        )

        # ── Step 6: Cleanup ───────────────────────────────────────────────────
        try:
            video_path.unlink()
            logger.info("Deleted local video file: %s", video_path)
        except Exception:
            pass

        # ── Step 7: Final notification ────────────────────────────────────────
        await _notify(
            bot, chat_id, progress_msg_id,
            f"Vídeo publicado en YouTube.\n\n"
            f"<b>{script.youtube_title or script.title}</b>\n"
            f"{yt_url}",
        )
        await bot.send_message(
            chat_id=chat_id,
            text=(
                f"Video publicado.\n\n"
                f"<b>{script.youtube_title or script.title}</b>\n"
                f"{yt_url}"
            ),
            parse_mode="HTML",
        )
        return yt_url

    except Exception as exc:
        logger.error("Video pipeline failed: %s", exc, exc_info=True)
        error_msg = str(exc)[:300]
        try:
            await _notify(
                bot, chat_id, progress_msg_id,
                f"Error en el pipeline de vídeo:\n{error_msg}\n\n"
                "Revisa los logs para más detalles.",
            )
        except Exception:
            pass
        # Clean up partial download if it exists
        if video_path and video_path.exists():
            try:
                video_path.unlink()
            except Exception:
                pass
        return None
