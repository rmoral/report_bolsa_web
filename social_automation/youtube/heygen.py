"""
HeyGen API v2 client for programmatic video generation.

Workflow:
  1. parse_script_scenes() — extract per-scene presenter text from the script
  2. create_video()        — POST to HeyGen /v2/video/generate, get video_id
  3. poll_until_ready()   — async poll /v1/video_status.get until completed/failed
  4. download_video()     — stream the finished video to a local .mp4 file

HeyGen limits:
  - Max ~1 400 characters per clip (scene). Longer texts are split automatically.
  - API key via X-Api-Key header.
  - Polling recommended every 15-30 s; typical generation: 3-15 min.
"""
import asyncio
import logging
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import httpx

from social_automation.config import config

logger = logging.getLogger(__name__)

HEYGEN_BASE = "https://api.heygen.com"
MAX_CHARS_PER_CLIP = 1400   # HeyGen hard limit per scene text
POLL_INTERVAL_SEC = 20      # seconds between status checks
MAX_WAIT_SEC = 60 * 35      # 35 minutes hard timeout

VIDEOS_DIR = Path(__file__).parent.parent / "videos"
VIDEOS_DIR.mkdir(exist_ok=True)


@dataclass
class SceneClip:
    title: str
    text: str         # Presenter narration (already split to fit limit)


def _headers() -> dict:
    return {
        "X-Api-Key": config.heygen_api_key,
        "Content-Type": "application/json",
    }


# ── Script parsing ────────────────────────────────────────────────────────────

def _clean_text(raw: str) -> str:
    """Remove stage directions and normalise whitespace."""
    # Remove [VISUAL], [B-ROLL] etc. that may have leaked into presenter block
    text = re.sub(r"\[[^\]]*\]", "", raw)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Strip surrounding quotes
    text = text.strip('"').strip()
    return text


def _split_to_clips(title: str, text: str) -> list[SceneClip]:
    """Split a long presenter text into multiple clips of <= MAX_CHARS_PER_CLIP."""
    if len(text) <= MAX_CHARS_PER_CLIP:
        return [SceneClip(title=title, text=text)]

    clips: list[SceneClip] = []
    sentences = re.split(r"(?<=[.!?])\s+", text)
    current = ""
    part = 1
    for sentence in sentences:
        if len(current) + len(sentence) + 1 > MAX_CHARS_PER_CLIP:
            if current:
                clips.append(SceneClip(title=f"{title} (pt.{part})", text=current.strip()))
                part += 1
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        clips.append(SceneClip(title=f"{title} (pt.{part})", text=current.strip()))
    return clips


def parse_script_scenes(script_text: str) -> list[SceneClip]:
    """
    Parse the structured video script and extract one SceneClip per [PRESENTER] block.
    Splits clips that exceed HeyGen's character limit automatically.
    """
    # Match each SCENE block
    scene_blocks = re.split(r"─{3,}\n", script_text)

    clips: list[SceneClip] = []
    for block in scene_blocks:
        # Extract scene header  e.g. "SCENE 2 — INTRO  [0:00–0:45]"
        title_match = re.search(r"SCENE\s+\d+\s+[—–-]\s+([^\[\n]+)", block)
        title = title_match.group(1).strip() if title_match else "Scene"

        # Extract [PRESENTER]: "..." block
        presenter_match = re.search(
            r'\[PRESENTER\]:\s*\n"(.*?)"(?:\s*\n|$)', block, re.DOTALL
        )
        if not presenter_match:
            # Try without quotes
            presenter_match = re.search(
                r'\[PRESENTER\]:\s*\n(.+?)(?=\n\[|\Z)', block, re.DOTALL
            )
        if not presenter_match:
            continue

        raw_text = presenter_match.group(1)
        text = _clean_text(raw_text)
        if not text or len(text) < 20:
            continue

        clips.extend(_split_to_clips(title, text))

    logger.info("Parsed %d clips from script", len(clips))
    return clips


# ── Video creation ────────────────────────────────────────────────────────────

def _build_clip_input(text: str) -> dict:
    """Build a single HeyGen video_input entry."""
    clip: dict = {
        "character": {
            "type": "avatar",
            "avatar_id": config.heygen_avatar_id,
            "avatar_style": "normal",
        },
        "voice": {
            "type": "text",
            "input_text": text,
            "voice_id": config.heygen_voice_id,
            "speed": 1.0,
        },
        "background": {
            "type": "color",
            "value": config.heygen_background_color,
        },
    }
    return clip


async def create_video(clips: list[SceneClip]) -> str:
    """
    Submit a video generation job to HeyGen.
    Returns the video_id to be used for polling.
    """
    video_inputs = [_build_clip_input(c.text) for c in clips]

    payload = {
        "video_inputs": video_inputs,
        "dimension": {"width": 1920, "height": 1080},
        "test": config.heygen_test_mode,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{HEYGEN_BASE}/v2/video/generate",
            headers=_headers(),
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    video_id = data.get("data", {}).get("video_id") or data.get("video_id", "")
    if not video_id:
        raise ValueError(f"HeyGen did not return a video_id. Response: {data}")

    logger.info("HeyGen video job created: video_id=%s (%d clips)", video_id, len(clips))
    return video_id


# ── Status polling ────────────────────────────────────────────────────────────

async def poll_until_ready(
    video_id: str,
    on_progress=None,   # optional async callable(status: str, elapsed_sec: int)
) -> str:
    """
    Poll HeyGen status until completed or failed.
    Returns the final video download URL.
    Raises RuntimeError on failure or timeout.
    """
    start = time.monotonic()
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            elapsed = int(time.monotonic() - start)
            if elapsed > MAX_WAIT_SEC:
                raise TimeoutError(
                    f"HeyGen video {video_id} did not complete within {MAX_WAIT_SEC // 60} minutes"
                )

            resp = await client.get(
                f"{HEYGEN_BASE}/v1/video_status.get",
                headers=_headers(),
                params={"video_id": video_id},
            )
            resp.raise_for_status()
            data = resp.json().get("data", {})
            status = data.get("status", "")

            logger.debug("HeyGen poll: video_id=%s status=%s elapsed=%ds", video_id, status, elapsed)

            if on_progress:
                await on_progress(status, elapsed)

            if status == "completed":
                url = data.get("video_url", "")
                if not url:
                    raise ValueError("HeyGen completed but no video_url in response")
                logger.info("HeyGen video ready: %s", url)
                return url

            if status == "failed":
                error = data.get("error", {})
                raise RuntimeError(f"HeyGen generation failed: {error}")

            await asyncio.sleep(POLL_INTERVAL_SEC)


# ── Download ──────────────────────────────────────────────────────────────────

async def download_video(url: str, filename_stem: str) -> Path:
    """
    Download the finished video from HeyGen to local disk.
    Returns the local Path.
    """
    dest = VIDEOS_DIR / f"{filename_stem}.mp4"
    logger.info("Downloading video from HeyGen → %s", dest)

    async with httpx.AsyncClient(timeout=300, follow_redirects=True) as client:
        async with client.stream("GET", url) as resp:
            resp.raise_for_status()
            with open(dest, "wb") as f:
                async for chunk in resp.aiter_bytes(chunk_size=1024 * 256):
                    f.write(chunk)

    size_mb = dest.stat().st_size / (1024 * 1024)
    logger.info("Downloaded %.1f MB → %s", size_mb, dest)
    return dest


# ── Convenience helpers ────────────────────────────────────────────────────────

async def list_avatars() -> list[dict]:
    """
    Return available HeyGen avatars. Tries v2 first, falls back to v1.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        # Try v2 endpoint first (current HeyGen API)
        for endpoint, path in [
            ("v2", "/v2/avatars"),
            ("v1", "/v1/avatar.list"),
        ]:
            try:
                resp = await client.get(f"{HEYGEN_BASE}{path}", headers=_headers())
                if resp.status_code == 200:
                    data = resp.json()
                    # v2 returns {"data": {"avatars": [...]}}
                    # v1 returns {"data": {"avatars": [...]}}
                    avatars = (
                        data.get("data", {}).get("avatars")
                        or data.get("avatars")
                        or data.get("data", [])
                    )
                    if isinstance(avatars, list):
                        return avatars
            except Exception:
                continue
    return []


async def list_voices() -> list[dict]:
    """
    Return available HeyGen voices. Tries v2 first, falls back to v1.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        for path in ["/v2/voices", "/v1/voice.list"]:
            try:
                resp = await client.get(f"{HEYGEN_BASE}{path}", headers=_headers())
                if resp.status_code == 200:
                    data = resp.json()
                    voices = (
                        data.get("data", {}).get("voices")
                        or data.get("voices")
                        or data.get("data", [])
                    )
                    if isinstance(voices, list):
                        return voices
            except Exception:
                continue
    return []
