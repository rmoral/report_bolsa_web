"""
Central configuration loaded from environment variables.
"""
import os
from dataclasses import dataclass, field
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class TwitterAccount:
    """Credentials and metadata for a single Twitter/X account."""
    id: str
    name: str
    api_key: str
    api_secret: str
    access_token: str
    access_token_secret: str
    bearer_token: str

    @property
    def enabled(self) -> bool:
        return bool(self.api_key and self.access_token)


@dataclass
class Config:
    # OpenAI
    openai_api_key: str = field(default_factory=lambda: os.environ["OPENAI_API_KEY"])
    openai_model: str = field(default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-4.1-mini"))
    openai_image_model: str = field(default_factory=lambda: os.getenv("OPENAI_IMAGE_MODEL", "dall-e-3"))
    generate_images: bool = field(
        default_factory=lambda: os.getenv("GENERATE_IMAGES", "true").lower() == "true"
    )

    # News
    newsapi_key: str = field(default_factory=lambda: os.getenv("NEWSAPI_KEY", ""))
    brave_api_key: str = field(default_factory=lambda: os.getenv("BRAVE_API_KEY", ""))

    # Telegram
    telegram_bot_token: str = field(default_factory=lambda: os.environ["TELEGRAM_BOT_TOKEN"])
    telegram_admin_chat_id: int = field(
        default_factory=lambda: int(os.environ["TELEGRAM_ADMIN_CHAT_ID"])
    )

    # Twitter / X
    twitter_api_key: str = field(default_factory=lambda: os.getenv("TWITTER_API_KEY", ""))
    twitter_api_secret: str = field(default_factory=lambda: os.getenv("TWITTER_API_SECRET", ""))
    twitter_access_token: str = field(default_factory=lambda: os.getenv("TWITTER_ACCESS_TOKEN", ""))
    twitter_access_token_secret: str = field(
        default_factory=lambda: os.getenv("TWITTER_ACCESS_TOKEN_SECRET", "")
    )
    twitter_bearer_token: str = field(default_factory=lambda: os.getenv("TWITTER_BEARER_TOKEN", ""))

    # LinkedIn
    linkedin_client_id: str = field(default_factory=lambda: os.getenv("LINKEDIN_CLIENT_ID", ""))
    linkedin_client_secret: str = field(default_factory=lambda: os.getenv("LINKEDIN_CLIENT_SECRET", ""))
    linkedin_access_token: str = field(default_factory=lambda: os.getenv("LINKEDIN_ACCESS_TOKEN", ""))
    linkedin_person_urn: str = field(default_factory=lambda: os.getenv("LINKEDIN_PERSON_URN", ""))
    # When set, posts are published as the company page instead of the personal profile
    linkedin_organization_urn: str = field(default_factory=lambda: os.getenv("LINKEDIN_ORGANIZATION_URN", ""))

    # Instagram
    instagram_access_token: str = field(default_factory=lambda: os.getenv("INSTAGRAM_ACCESS_TOKEN", ""))
    instagram_account_id: str = field(default_factory=lambda: os.getenv("INSTAGRAM_ACCOUNT_ID", ""))
    instagram_username: str = field(default_factory=lambda: os.getenv("INSTAGRAM_USERNAME", ""))
    instagram_password: str = field(default_factory=lambda: os.getenv("INSTAGRAM_PASSWORD", ""))

    # Scheduling — morning run
    daily_run_hour: int = field(default_factory=lambda: int(os.getenv("DAILY_RUN_HOUR", "9")))
    daily_run_minute: int = field(default_factory=lambda: int(os.getenv("DAILY_RUN_MINUTE", "0")))
    # Scheduling — afternoon run (set AFTERNOON_RUN_HOUR=-1 to disable)
    afternoon_run_hour: int = field(default_factory=lambda: int(os.getenv("AFTERNOON_RUN_HOUR", "14")))
    afternoon_run_minute: int = field(default_factory=lambda: int(os.getenv("AFTERNOON_RUN_MINUTE", "0")))
    timezone: str = field(default_factory=lambda: os.getenv("TIMEZONE", "Europe/Madrid"))

    # Content
    max_news_items: int = field(default_factory=lambda: int(os.getenv("MAX_NEWS_ITEMS", "5")))
    content_language: str = field(default_factory=lambda: os.getenv("CONTENT_LANGUAGE", "en"))
    auto_publish: bool = field(
        default_factory=lambda: os.getenv("AUTO_PUBLISH", "false").lower() == "true"
    )
    website_url: str = field(
        default_factory=lambda: os.getenv("WEBSITE_URL", "https://earlymarketreports.com")
    )

    # Image generation provider: "dalle" | "imagen3"
    image_provider: str = field(
        default_factory=lambda: os.getenv("IMAGE_PROVIDER", "dalle").lower()
    )
    # Google AI API key (for Imagen 3 / Nano Banana) — get at aistudio.google.com
    google_ai_api_key: str = field(default_factory=lambda: os.getenv("GOOGLE_AI_API_KEY", ""))

    # Payload CMS
    payload_api_url: str = field(default_factory=lambda: os.getenv("PAYLOAD_API_URL", ""))
    payload_email: str = field(default_factory=lambda: os.getenv("PAYLOAD_EMAIL", ""))
    payload_password: str = field(default_factory=lambda: os.getenv("PAYLOAD_PASSWORD", ""))
    # URL path segment for blog posts, e.g. "blog" → https://site.com/blog/{slug}
    blog_url_prefix: str = field(default_factory=lambda: os.getenv("BLOG_URL_PREFIX", "blog"))

    # YouTube — channel metadata
    youtube_channel_name: str = field(
        default_factory=lambda: os.getenv("YOUTUBE_CHANNEL_NAME", "Early Market Reports")
    )
    youtube_client_secrets_file: str = field(
        default_factory=lambda: os.getenv("YOUTUBE_CLIENT_SECRETS_FILE", "youtube_client_secrets.json")
    )
    youtube_token_file: str = field(
        default_factory=lambda: os.getenv("YOUTUBE_TOKEN_FILE", "youtube_token.json")
    )
    youtube_default_privacy: str = field(
        default_factory=lambda: os.getenv("YOUTUBE_DEFAULT_PRIVACY", "private")
    )

    # HeyGen — AI video generation
    heygen_api_key: str = field(default_factory=lambda: os.getenv("HEYGEN_API_KEY", ""))
    heygen_avatar_id: str = field(default_factory=lambda: os.getenv("HEYGEN_AVATAR_ID", ""))
    heygen_voice_id: str = field(default_factory=lambda: os.getenv("HEYGEN_VOICE_ID", ""))
    heygen_background_color: str = field(
        default_factory=lambda: os.getenv("HEYGEN_BACKGROUND_COLOR", "#1a1a2e")
    )
    heygen_test_mode: bool = field(
        default_factory=lambda: os.getenv("HEYGEN_TEST_MODE", "true").lower() == "true"
    )

    # Database
    database_url: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL", "sqlite+aiosqlite:///social_automation.db"
        )
    )

    @property
    def twitter_enabled(self) -> bool:
        return bool(self.twitter_api_key and self.twitter_access_token)

    @property
    def twitter_accounts(self) -> List[TwitterAccount]:
        """Return all configured (enabled) Twitter accounts."""
        candidates = [
            TwitterAccount(
                id="1",
                name=os.getenv("TWITTER_ACCOUNT_NAME", "Account 1"),
                api_key=self.twitter_api_key,
                api_secret=self.twitter_api_secret,
                access_token=self.twitter_access_token,
                access_token_secret=self.twitter_access_token_secret,
                bearer_token=self.twitter_bearer_token,
            ),
            TwitterAccount(
                id="2",
                name=os.getenv("TWITTER_2_NAME", "Account 2"),
                api_key=os.getenv("TWITTER_2_API_KEY", ""),
                api_secret=os.getenv("TWITTER_2_API_SECRET", ""),
                access_token=os.getenv("TWITTER_2_ACCESS_TOKEN", ""),
                access_token_secret=os.getenv("TWITTER_2_ACCESS_TOKEN_SECRET", ""),
                bearer_token=os.getenv("TWITTER_2_BEARER_TOKEN", ""),
            ),
            TwitterAccount(
                id="3",
                name=os.getenv("TWITTER_3_NAME", "Account 3"),
                api_key=os.getenv("TWITTER_3_API_KEY", ""),
                api_secret=os.getenv("TWITTER_3_API_SECRET", ""),
                access_token=os.getenv("TWITTER_3_ACCESS_TOKEN", ""),
                access_token_secret=os.getenv("TWITTER_3_ACCESS_TOKEN_SECRET", ""),
                bearer_token=os.getenv("TWITTER_3_BEARER_TOKEN", ""),
            ),
        ]
        return [a for a in candidates if a.enabled]

    def twitter_account_by_id(self, account_id: str) -> Optional[TwitterAccount]:
        """Look up a Twitter account by its id string. Returns None if not found."""
        for account in self.twitter_accounts:
            if account.id == account_id:
                return account
        return None

    @property
    def linkedin_author_urn(self) -> str:
        """URN used as the post author — company page takes priority over personal profile."""
        return self.linkedin_organization_urn or self.linkedin_person_urn

    @property
    def linkedin_enabled(self) -> bool:
        return bool(self.linkedin_access_token and self.linkedin_author_urn)

    @property
    def instagram_enabled(self) -> bool:
        return bool(
            (self.instagram_access_token and self.instagram_account_id)
            or (self.instagram_username and self.instagram_password)
        )

    @property
    def newsapi_enabled(self) -> bool:
        return bool(self.newsapi_key)

    @property
    def payload_enabled(self) -> bool:
        return bool(self.payload_api_url and self.payload_email and self.payload_password)

    @property
    def heygen_enabled(self) -> bool:
        return bool(self.heygen_api_key and self.heygen_avatar_id and self.heygen_voice_id)

    @property
    def youtube_enabled(self) -> bool:
        from pathlib import Path
        return Path(self.youtube_token_file).exists()


# Singleton
config = Config()
