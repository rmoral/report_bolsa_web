"""
Video production pipeline.

Two modes:
  run_video_pipeline()       — HeyGen → download → YouTube upload → cleanup
  run_heygen_only_pipeline() — HeyGen → download → notify path (no YouTube)

Called from Telegram. Sends live progress updates throughout.
"""
import asyncio
import logging
from pathlib import Path
from typing import Optional

from social_automation.config import config
from social_automation.youtube.generator import VideoScript
from social_automation.youtube import heygen

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


async def _heygen_generate_and_download(
    script: VideoScript,
    chat_id: int,
    progress_msg_id: int,
    bot,
) -> Optional[Path]:
    """
    Shared steps 1-4: parse script, submit to HeyGen, poll, download.
    Returns the local video Path on success, None on failure.
    """
    video_path: Optional[Path] = None
    try:
        await _notify(bot, chat_id, progress_msg_id,
                      "Analizando guion y extrayendo escenas...")
        clips = heygen.parse_script_scenes(script.script_text)
        if not clips:
            raise ValueError(
                "No se encontraron bloques [PRESENTER] en el guion.\n"
                "Regenera el guion con /youtube e intenta de nuevo."
            )

        await _notify(
            bot, chat_id, progress_msg_id,
            f"{len(clips)} escenas extraídas. Enviando a HeyGen...\n"
            f"Modo: {'TEST (marca de agua)' if config.heygen_test_mode else 'PRODUCCIÓN'}\n"
            "La generación tarda entre 5 y 30 minutos.",
        )
        video_id = await heygen.create_video(clips)

        last_status = ""

        async def on_progress(status: str, elapsed: int) -> None:
            nonlocal last_status
            if status == last_status:
                return
            last_status = status
            m, s = elapsed // 60, elapsed % 60
            label = {"processing": "Procesando...", "waiting": "En cola..."}.get(status, status)
            await _notify(
                bot, chat_id, progress_msg_id,
                f"HeyGen: {label}\nVideo ID: {video_id}\nTiempo: {m}m {s}s",
            )

        video_url = await heygen.poll_until_ready(video_id, on_progress=on_progress)

        await _notify(bot, chat_id, progress_msg_id, "Descargando vídeo desde HeyGen...")
        safe_stem = (script.youtube_title or "video").lower()
        safe_stem = "".join(c if c.isalnum() or c in "-_ " else "_" for c in safe_stem)
        safe_stem = safe_stem.replace(" ", "_")[:50]
        video_path = await heygen.download_video(video_url, safe_stem)
        return video_path

    except Exception as exc:
        logger.error("HeyGen pipeline failed: %s", exc, exc_info=True)
        await _notify(bot, chat_id, progress_msg_id,
                      f"Error generando el vídeo:\n{str(exc)[:300]}")
        if video_path and video_path.exists():
            video_path.unlink(missing_ok=True)
        return None


async def run_heygen_only_pipeline(
    script: VideoScript,
    chat_id: int,
    progress_msg_id: int,
    bot,
) -> Optional[Path]:
    """
    Generate the video with HeyGen and save it locally.
    Does NOT upload to YouTube. Notifies the user with the server file path.
    """
    video_path = await _heygen_generate_and_download(
        script, chat_id, progress_msg_id, bot
    )
    if not video_path:
        return None

    size_mb = video_path.stat().st_size / (1024 * 1024)
    await _notify(
        bot, chat_id, progress_msg_id,
        f"Vídeo generado correctamente.\n\n"
        f"Archivo: {video_path}\n"
        f"Tamaño: {size_mb:.1f} MB\n\n"
        "Descárgalo con scp o FileZilla y súbelo a YouTube manualmente.",
    )
    await bot.send_message(
        chat_id=chat_id,
        text=(
            f"Vídeo listo en el servidor.\n\n"
            f"<b>Ruta:</b> <code>{video_path}</code>\n"
            f"<b>Tamaño:</b> {size_mb:.1f} MB\n\n"
            f"Para descargarlo:\n"
            f"<code>scp ubuntu@IP:{video_path} .</code>"
        ),
        parse_mode="HTML",
    )
    return video_path


async def run_video_pipeline(
    script: VideoScript,
    chat_id: int,
    progress_msg_id: int,
    bot,
) -> Optional[str]:
    """
    Full pipeline: HeyGen → download → YouTube upload → cleanup.
    Returns the YouTube URL on success, None on failure.
    """
    from social_automation.youtube import uploader

    video_path = await _heygen_generate_and_download(
        script, chat_id, progress_msg_id, bot
    )
    if not video_path:
        return None

    try:
        size_mb = video_path.stat().st_size / (1024 * 1024)
        await _notify(
            bot, chat_id, progress_msg_id,
            f"Subiendo a YouTube ({size_mb:.1f} MB)...\n"
            "Esto puede tardar unos minutos.",
        )
        loop = asyncio.get_event_loop()
        yt_url = await loop.run_in_executor(
            None, uploader.upload_video, video_path, script
        )
        video_path.unlink(missing_ok=True)

        await _notify(bot, chat_id, progress_msg_id,
                      f"Vídeo publicado en YouTube.\n{yt_url}")
        await bot.send_message(
            chat_id=chat_id,
            text=f"Vídeo publicado.\n\n<b>{script.youtube_title or script.title}</b>\n{yt_url}",
            parse_mode="HTML",
        )
        return yt_url

    except Exception as exc:
        logger.error("YouTube upload failed: %s", exc, exc_info=True)
        await _notify(bot, chat_id, progress_msg_id,
                      f"Error subiendo a YouTube:\n{str(exc)[:300]}\n\n"
                      f"El vídeo está guardado en: {video_path}")
        return None
