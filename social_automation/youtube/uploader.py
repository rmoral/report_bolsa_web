"""
YouTube Data API v3 uploader.

Authentication: OAuth 2.0 (required for channel uploads).
  - First run: python youtube/setup_oauth.py  →  saves youtube_token.json
  - Subsequent runs: token is loaded and refreshed automatically.

Upload uses resumable upload to handle large video files reliably.
"""
import json
import logging
from pathlib import Path
from typing import Optional

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from social_automation.config import config
from social_automation.youtube.generator import VideoScript

logger = logging.getLogger(__name__)

YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
YOUTUBE_CATEGORY_NEWS = "25"   # News & Politics
CHUNK_SIZE = 10 * 1024 * 1024  # 10 MB resumable chunks


def _load_credentials() -> Credentials:
    """
    Load OAuth2 credentials from the token file.
    Refreshes automatically if the access token is expired.
    Raises FileNotFoundError if the token file has not been created yet.
    """
    token_path = Path(config.youtube_token_file)
    if not token_path.exists():
        raise FileNotFoundError(
            f"YouTube token not found at {token_path}. "
            "Run: python social_automation/youtube/setup_oauth.py"
        )

    creds = Credentials.from_authorized_user_file(
        str(token_path), scopes=YOUTUBE_SCOPES
    )

    if creds.expired and creds.refresh_token:
        logger.info("Refreshing expired YouTube OAuth token...")
        creds.refresh(Request())
        # Persist refreshed token
        token_path.write_text(creds.to_json())

    if not creds.valid:
        raise RuntimeError(
            "YouTube credentials are invalid. "
            "Re-run: python social_automation/youtube/setup_oauth.py"
        )

    return creds


def _build_video_body(script: VideoScript, privacy: str) -> dict:
    """Build the YouTube video metadata body."""
    # Truncate title to YouTube's 100-char limit
    title = (script.youtube_title or script.title)[:100]

    # Build description: GPT description + timestamp block + attribution
    description = script.youtube_description
    if config.website_url:
        description += f"\n\n{config.website_url}"

    return {
        "snippet": {
            "title": title,
            "description": description[:5000],
            "tags": script.tags[:500],         # YouTube tag list limit
            "categoryId": YOUTUBE_CATEGORY_NEWS,
            "defaultLanguage": "en",
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }


def upload_video(video_path: Path, script: VideoScript) -> str:
    """
    Upload a local video file to YouTube with metadata from the VideoScript.
    Returns the YouTube video URL (https://youtu.be/{id}).

    This is a synchronous function — wrap with run_in_executor for async contexts.
    """
    privacy = config.youtube_default_privacy  # "public" | "unlisted" | "private"
    creds = _load_credentials()

    youtube = build("youtube", "v3", credentials=creds, cache_discovery=False)

    body = _build_video_body(script, privacy)
    media = MediaFileUpload(
        str(video_path),
        mimetype="video/mp4",
        resumable=True,
        chunksize=CHUNK_SIZE,
    )

    logger.info(
        "Uploading %s (%.1f MB) to YouTube as '%s' [%s]...",
        video_path.name,
        video_path.stat().st_size / (1024 * 1024),
        body["snippet"]["title"],
        privacy,
    )

    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            logger.debug("YouTube upload progress: %d%%", pct)

    video_id = response.get("id", "")
    url = f"https://youtu.be/{video_id}"
    logger.info("YouTube upload complete: %s", url)
    return url
