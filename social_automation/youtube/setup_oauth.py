"""
One-time OAuth 2.0 setup for YouTube Data API.

Run this script ONCE from the terminal to authorise the application
to upload videos to your YouTube channel:

    python social_automation/youtube/setup_oauth.py

Prerequisites:
  1. Create a project in Google Cloud Console
  2. Enable the YouTube Data API v3
  3. Create OAuth 2.0 credentials (Desktop app)
  4. Download the credentials JSON file
  5. Set YOUTUBE_CLIENT_SECRETS_FILE in your .env

The script will open a browser for Google login, then save
youtube_token.json (path set by YOUTUBE_TOKEN_FILE in .env).
"""
import os
import sys

# Allow running from inside the directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from social_automation.config import config

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def main():
    secrets_path = Path(config.youtube_client_secrets_file)
    token_path = Path(config.youtube_token_file)

    if not secrets_path.exists():
        print(f"ERROR: Client secrets file not found: {secrets_path}")
        print("Download it from Google Cloud Console → APIs & Services → Credentials")
        sys.exit(1)

    print(f"Starting OAuth flow for YouTube...")
    print(f"  Secrets: {secrets_path}")
    print(f"  Token will be saved to: {token_path}\n")

    flow = InstalledAppFlow.from_client_secrets_file(str(secrets_path), SCOPES)
    creds = flow.run_local_server(port=0)

    token_path.parent.mkdir(parents=True, exist_ok=True)
    token_path.write_text(creds.to_json())

    print(f"\nOAuth token saved to: {token_path}")
    print("You can now use /youtube in Telegram to generate and publish videos.")


if __name__ == "__main__":
    main()
