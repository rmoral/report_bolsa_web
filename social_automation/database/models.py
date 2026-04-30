"""
SQLAlchemy ORM models for the social automation database.
"""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, DateTime, Enum, ForeignKey, Integer, String, Text, Boolean, Float
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class PostStatus(str, PyEnum):
    PENDING = "pending"        # Awaiting admin approval via Telegram
    APPROVED = "approved"      # Admin approved, ready to publish
    REJECTED = "rejected"      # Admin rejected
    PUBLISHING = "publishing"  # Currently being published
    PUBLISHED = "published"    # Successfully published
    FAILED = "failed"          # Publication failed


class Platform(str, PyEnum):
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"


class NewsItem(Base):
    """A news article fetched from external sources."""
    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    url = Column(String(1000))
    source = Column(String(200))
    category = Column(String(100))          # economic, political, market
    published_at = Column(DateTime)
    impact_score = Column(Float, default=0.0)  # Calculated relevance/impact score
    fetched_at = Column(DateTime, default=datetime.utcnow)
    run_id = Column(String(50), index=True)    # Groups items from the same daily run

    posts = relationship("Post", back_populates="news_item", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<NewsItem id={self.id} title={self.title[:50]!r}>"


class Post(Base):
    """A generated social media post linked to a news item."""
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    news_item_id = Column(Integer, ForeignKey("news_items.id"), nullable=True)  # NULL for educational posts
    platform = Column(Enum(Platform), nullable=False)
    content = Column(Text, nullable=False)           # Generated text content
    hashtags = Column(Text)                          # Space-separated hashtags
    image_prompt = Column(Text)                      # Dalle/image generation prompt
    image_path = Column(String(500))                 # Local path to generated/downloaded image
    status = Column(Enum(PostStatus), default=PostStatus.PENDING, nullable=False)
    telegram_message_id = Column(Integer)            # Message ID in Telegram for editing
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime)
    published_at = Column(DateTime)
    platform_post_id = Column(String(200))           # ID returned by platform API after publish
    error_message = Column(Text)                     # Error details if failed
    run_id = Column(String(50), index=True)
    account_id = Column(String(50), nullable=True)  # Twitter account id; None means "1" (default)

    news_item = relationship("NewsItem", back_populates="posts")

    @property
    def full_content(self) -> str:
        """Content with hashtags appended."""
        if self.hashtags:
            return f"{self.content}\n\n{self.hashtags}"
        return self.content

    def __repr__(self) -> str:
        return f"<Post id={self.id} platform={self.platform} status={self.status}>"


class PublicationLog(Base):
    """Audit log for all publication attempts."""
    __tablename__ = "publication_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    platform = Column(String(50))
    action = Column(String(50))      # publish, approve, reject, edit, retry
    success = Column(Boolean, default=False)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post")

    def __repr__(self) -> str:
        return f"<PublicationLog id={self.id} post={self.post_id} action={self.action}>"


class DailyRun(Base):
    """Tracks each daily automation run."""
    __tablename__ = "daily_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(50), unique=True, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    news_fetched = Column(Integer, default=0)
    posts_generated = Column(Integer, default=0)
    posts_published = Column(Integer, default=0)
    posts_failed = Column(Integer, default=0)
    status = Column(String(50), default="running")   # running, completed, failed
    error_message = Column(Text)

    def __repr__(self) -> str:
        return f"<DailyRun id={self.id} run_id={self.run_id} status={self.status}>"
