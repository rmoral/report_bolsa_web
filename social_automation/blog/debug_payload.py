"""
Debug script to test the Payload CMS API step by step.

Run from the social_automation directory:
    python3 blog/debug_payload.py

Shows the full request and response for each step so you can
identify exactly which fields Payload accepts or rejects.
"""
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

import httpx
from social_automation.config import config
from social_automation.blog.lexical import markdown_to_lexical


BASE = config.payload_api_url.rstrip("/")
HEADERS_JSON = {"Content-Type": "application/json"}


def _p(label: str, data):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print('='*60)
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, default=str)[:3000])
    else:
        print(str(data)[:3000])


async def main():
    print(f"\nTarget: {BASE}/api/posts")
    print(f"Email:  {config.payload_email}")

    async with httpx.AsyncClient(timeout=30) as client:

        # ── Step 1: Login ────────────────────────────────────────────────────
        print("\n[1/4] Logging in...")
        resp = await client.post(
            f"{BASE}/api/users/login",
            json={"email": config.payload_email, "password": config.payload_password},
        )
        _p("Login response", resp.json())
        if resp.status_code != 200:
            print("LOGIN FAILED — check PAYLOAD_EMAIL and PAYLOAD_PASSWORD in .env")
            return
        token = resp.json()["token"]
        auth = {"Authorization": f"Bearer {token}"}
        print("  Login OK")

        # ── Step 2: Minimal post (no content) ───────────────────────────────
        print("\n[2/4] Creating minimal post (title + slug + status only)...")
        import uuid
        test_slug = f"debug-test-{uuid.uuid4().hex[:8]}"
        minimal = {
            "title": "DEBUG TEST — borrar",
            "slug": test_slug,
            "status": "published",
            "publishedAt": "2026-01-01T00:00:00.000Z",
        }
        _p("Request body", minimal)

        resp = await client.post(
            f"{BASE}/api/posts",
            headers={**auth, **HEADERS_JSON},
            json=minimal,
            params={"locale": "en"},
        )
        _p(f"Response [{resp.status_code}]", resp.json())

        resp_data = resp.json()
        errors = resp_data.get("errors", [])
        if errors:
            print(f"\n  FIELD ERRORS: {errors}")
        else:
            saved = resp_data.get("doc", resp_data)
            print(f"\n  title saved:  {saved.get('title')!r}")
            print(f"  slug saved:   {saved.get('slug')!r}")
            print(f"  status saved: {saved.get('status')!r}")
            doc_id = saved.get("id")

        # ── Step 3: Post with Lexical content ────────────────────────────────
        print("\n[3/4] Creating post WITH Lexical content...")
        sample_md = """## Introduction

This is a test paragraph to verify Lexical content is saved correctly.

## Section Two

Another paragraph here with some financial context."""

        lexical = markdown_to_lexical(sample_md)
        test_slug2 = f"debug-lexical-{uuid.uuid4().hex[:8]}"
        full_post = {
            "title": "DEBUG LEXICAL TEST — borrar",
            "slug": test_slug2,
            "excerpt": "Test meta description for SEO.",
            "status": "published",
            "publishedAt": "2026-01-01T00:00:00.000Z",
            "content": lexical,
        }

        resp2 = await client.post(
            f"{BASE}/api/posts",
            headers={**auth, **HEADERS_JSON},
            json=full_post,
            params={"locale": "en"},
        )
        _p(f"Response [{resp2.status_code}]", resp2.json())

        resp2_data = resp2.json()
        errors2 = resp2_data.get("errors", [])
        if errors2:
            print(f"\n  FIELD ERRORS: {errors2}")
        else:
            saved2 = resp2_data.get("doc", resp2_data)
            print(f"\n  title saved:    {saved2.get('title')!r}")
            print(f"  slug saved:     {saved2.get('slug')!r}")
            print(f"  status saved:   {saved2.get('status')!r}")
            has_content = bool(saved2.get("content"))
            print(f"  content saved:  {has_content}")

        # ── Step 4: Cleanup ───────────────────────────────────────────────────
        print("\n[4/4] Cleaning up test posts...")
        for slug in [test_slug, test_slug2]:
            sr = await client.get(
                f"{BASE}/api/posts",
                headers=auth,
                params={"where[slug][equals]": slug, "locale": "en", "limit": 1},
            )
            docs = sr.json().get("docs", [])
            if docs:
                del_id = docs[0]["id"]
                await client.delete(f"{BASE}/api/posts/{del_id}", headers=auth)
                print(f"  Deleted test post: {slug}")

        print("\nDone. Review the responses above to identify the issue.")


if __name__ == "__main__":
    asyncio.run(main())
