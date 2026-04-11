"""
Generates detailed, production-ready YouTube video scripts from published posts.

The output is formatted scene-by-scene with:
  - Exact presenter narration (word for word)
  - Visual directions and camera notes
  - B-roll suggestions with search keywords
  - Lower thirds (on-screen text overlays)
  - On-screen graphics (charts, stats, quotes)
  - Music and audio cues
  - Timing estimates per scene
  - Thumbnail DALL-E prompt
  - YouTube metadata (title, description, tags)

Designed so an AI video tool (HeyGen, Synthesia, Pictory, InVideo)
or a human editor can produce the video with no further research.
"""
import logging
import re
from dataclasses import dataclass, field
from datetime import date

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.database.models import Post

logger = logging.getLogger(__name__)

_client = OpenAI(api_key=config.openai_api_key)

YOUTUBE_SYSTEM_PROMPT = f"""You are a senior broadcast scriptwriter and video producer \
for earlymarketreports.com, a professional financial news channel on YouTube.

Your job is to write COMPLETE, PRODUCTION-READY weekly video scripts that can be handed \
directly to an AI video generation tool or a human video editor with zero additional research.

Writing rules:
- Language: English only. Authoritative, clear, conversational broadcast tone.
- Presenter speaks in short, declarative sentences — easy to read aloud.
- No AI filler: no "game-changer", "landscape", "transformative", "delve into", "crucial".
- Every number, percentage, institution name, and date must appear naturally in the narration.
- The script must feel like a professional TV news package, not a blog post read aloud.
- Vary sentence rhythm: mix short punchy sentences with longer analytical ones.

Video structure (follow this EXACT format):

═══════════════════════════════════════════════
EARLY MARKET REPORTS — WEEKLY BRIEFING
[VIDEO TITLE — 60-80 chars, compelling, SEO]
Week of [DATE RANGE]
Estimated duration: X–Y minutes
═══════════════════════════════════════════════

THUMBNAIL PROMPT:
[Detailed DALL-E photorealistic prompt for a YouTube thumbnail image. \
Professional financial news aesthetic. No text in image.]

YOUTUBE TITLE:
[SEO-optimized title, 60-70 chars, includes primary keyword]

YOUTUBE DESCRIPTION:
[3-4 paragraph YouTube description. First paragraph has the hook and primary keywords. \
Include timestamps for each segment. End with: Subscribe to Early Market Reports \
for daily market intelligence. earlymarketreports.com]

TAGS:
[20-25 comma-separated YouTube tags, mix of broad and specific]

───────────────────────────────────────────────
SCENE 1 — INTRO  [0:00–0:45]
───────────────────────────────────────────────
[MUSIC]: Description and mood of intro music
[VISUAL]: Detailed description of opening visuals / animation
[LOWER THIRD]: On-screen text overlay

[PRESENTER]:
"Full word-for-word narration..."

[B-ROLL]: Specific B-roll description with stock footage search keywords in parentheses

───────────────────────────────────────────────
SCENE 2 — [STORY TITLE]  [0:45–X:XX]
───────────────────────────────────────────────
[LOWER THIRD]: Headline text for on-screen overlay
[VISUAL]: Studio / presenter visual direction
[GRAPHIC]: Description of on-screen data graphic, chart, or quote card

[PRESENTER]:
"Full narration for this story..."

[B-ROLL]: Specific footage suggestions with search keywords
[TRANSITION]: How to transition to the next scene

[Continue pattern for each story...]

───────────────────────────────────────────────
SCENE N — OUTRO & CALL TO ACTION  [X:XX–END]
───────────────────────────────────────────────
[MUSIC]: Outro music description
[VISUAL]: Closing visual sequence

[PRESENTER]:
"Closing narration with subscribe CTA and website mention..."

[END CARD]: Description of YouTube end card layout

═══════════════════════════════════════════════
PRODUCTION NOTES
═══════════════════════════════════════════════
[3-5 bullet points of technical production suggestions: pacing, graphics style, \
color grading, font recommendations, thumbnail design tips]

Channel: earlymarketreports.com
"""


@dataclass
class VideoScript:
    title: str
    youtube_title: str
    youtube_description: str
    tags: list[str]
    thumbnail_prompt: str
    estimated_duration: str          # e.g. "8–11 minutes"
    script_text: str                 # Full formatted script (the entire raw output)
    week_label: str                  # e.g. "April 7–13, 2026"
    story_count: int


def _build_prompt(posts: list[Post], week_label: str) -> str:
    story_blocks = []
    for i, post in enumerate(posts, 1):
        news_title = post.news_item.title if post.news_item else "Unknown"
        news_desc = post.news_item.description if post.news_item else ""
        tweet_text = post.content
        story_blocks.append(
            f"STORY {i}:\n"
            f"Headline: {news_title}\n"
            f"Context: {news_desc or '(none)'}\n"
            f"Published tweet: {tweet_text}"
        )

    stories = "\n\n".join(story_blocks)
    channel = config.youtube_channel_name or "Early Market Reports"

    return f"""Write a complete production-ready YouTube video script for {channel} \
covering the week of {week_label}.

The video must cover ALL {len(posts)} stories below. Each story should get \
a dedicated scene of 1.5–3 minutes depending on importance. \
Synthesize related stories into one segment if it makes editorial sense.

{stories}

The channel website is {config.website_url}
Follow the EXACT format specified in your instructions. \
Do not skip any section. Make the presenter narration complete and natural — \
every word they need to say, nothing left for them to improvise."""


def _parse_response(raw: str, posts: list[Post], week_label: str) -> VideoScript:
    """Extract metadata from the script header."""

    def _extract(pattern: str, default: str = "") -> str:
        m = re.search(pattern, raw, re.MULTILINE | re.DOTALL)
        if not m:
            return default
        return m.group(1).strip()

    # YouTube TITLE line
    yt_title_match = re.search(r"^YOUTUBE TITLE:\s*(.+)$", raw, re.MULTILINE)
    youtube_title = yt_title_match.group(1).strip() if yt_title_match else ""

    # VIDEO TITLE (in header block)
    video_title_match = re.search(
        r"EARLY MARKET REPORTS.*?\n(.*?)\nWeek of", raw, re.DOTALL
    )
    title = video_title_match.group(1).strip() if video_title_match else youtube_title

    # YouTube description block
    desc_match = re.search(
        r"YOUTUBE DESCRIPTION:\s*\n(.*?)(?=\nTAGS:|\nTHUMBNAIL|\n───)", raw, re.DOTALL
    )
    youtube_description = desc_match.group(1).strip() if desc_match else ""

    # Tags
    tags_match = re.search(r"TAGS:\s*\n(.+?)(?=\n───|\n═)", raw, re.DOTALL)
    tags_raw = tags_match.group(1).strip() if tags_match else ""
    tags = [t.strip() for t in re.split(r"[,\n]", tags_raw) if t.strip()]

    # Thumbnail
    thumb_match = re.search(
        r"THUMBNAIL PROMPT:\s*\n(.*?)(?=\nYOUTUBE TITLE:|\n───)", raw, re.DOTALL
    )
    thumbnail_prompt = thumb_match.group(1).strip() if thumb_match else ""

    # Duration estimate
    dur_match = re.search(r"Estimated duration:\s*(.+)", raw, re.IGNORECASE)
    estimated_duration = dur_match.group(1).strip() if dur_match else "8–12 minutes"

    return VideoScript(
        title=title or f"Weekly Briefing — {week_label}",
        youtube_title=youtube_title,
        youtube_description=youtube_description,
        tags=tags,
        thumbnail_prompt=thumbnail_prompt,
        estimated_duration=estimated_duration,
        script_text=raw,
        week_label=week_label,
        story_count=len(posts),
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=5, max=60))
def generate_video_script(posts: list[Post], week_label: str = "") -> VideoScript:
    """
    Generate a complete YouTube video script from a list of published posts.
    Returns a VideoScript dataclass. Raises on empty output.
    """
    if not week_label:
        today = date.today()
        week_label = today.strftime("%B %d, %Y")

    prompt = _build_prompt(posts, week_label)

    response = _client.chat.completions.create(
        model=config.openai_model,
        max_tokens=4096,
        messages=[
            {"role": "system", "content": YOUTUBE_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    raw = response.choices[0].message.content or ""

    if len(raw) < 500:
        raise ValueError("Video script generation returned insufficient content")

    script = _parse_response(raw, posts, week_label)
    logger.info(
        "Generated YouTube script: %r | %s | %d stories",
        script.youtube_title or script.title,
        script.estimated_duration,
        script.story_count,
    )
    return script
