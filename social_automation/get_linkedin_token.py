"""
LinkedIn OAuth 2.0 helper — run once to get your access token.

Usage:
    python get_linkedin_token.py

Requirements in .env (or set as env vars before running):
    LINKEDIN_CLIENT_ID=...
    LINKEDIN_CLIENT_SECRET=...

Steps this script performs:
    1. Prints the LinkedIn authorization URL — open it in your browser
    2. After you authorize, LinkedIn redirects to the callback URL
       Copy the full redirect URL and paste it here
    3. Exchanges the code for an access token
    4. Prints the token and your person URN to copy into .env
"""
import os
import sys
import json
import secrets
import urllib.parse

import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "").strip()
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "").strip()

# Use a localhost redirect URI — must be registered in your LinkedIn app
REDIRECT_URI = "http://localhost:8000/callback"

SCOPES = ["openid", "profile", "email", "w_member_social"]


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        print("ERROR: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be set in .env")
        sys.exit(1)

    state = secrets.token_urlsafe(16)

    # ── Step 1: Build authorization URL ──────────────────────────────────────
    auth_params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": " ".join(SCOPES),
        "state": state,
    }
    auth_url = "https://www.linkedin.com/oauth/v2/authorization?" + urllib.parse.urlencode(auth_params)

    print("\n" + "="*70)
    print("STEP 1 — Open this URL in your browser and authorize the app:")
    print("="*70)
    print(auth_url)
    print("="*70)
    print(f"\nIMPORTANT: Make sure '{REDIRECT_URI}' is listed as an")
    print("Authorized Redirect URL in your LinkedIn app settings.")
    print("\nAfter authorizing, your browser will be redirected to a URL like:")
    print(f"  {REDIRECT_URI}?code=AQT...&state={state}")
    print("\nThe page may show an error (localhost not running) — that's fine.")
    print("Just copy the FULL URL from the browser address bar.\n")

    redirect_response = input("Paste the full redirect URL here: ").strip()

    # ── Step 2: Extract code ──────────────────────────────────────────────────
    parsed = urllib.parse.urlparse(redirect_response)
    params = urllib.parse.parse_qs(parsed.query)

    if "error" in params:
        print(f"ERROR: {params.get('error_description', params['error'])}")
        sys.exit(1)

    code = params.get("code", [None])[0]
    returned_state = params.get("state", [None])[0]

    if not code:
        print("ERROR: No authorization code found in the URL.")
        sys.exit(1)

    if returned_state != state:
        print("WARNING: State mismatch — possible CSRF. Proceeding anyway for manual use.")

    # ── Step 3: Exchange code for access token ────────────────────────────────
    token_resp = requests.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    token_resp.raise_for_status()
    token_data = token_resp.json()

    access_token = token_data.get("access_token")
    expires_in = token_data.get("expires_in", 0)
    expires_days = expires_in // 86400

    if not access_token:
        print(f"ERROR: No access_token in response: {token_data}")
        sys.exit(1)

    # ── Step 4: Get person URN via /v2/userinfo (OpenID) ─────────────────────
    userinfo_resp = requests.get(
        "https://api.linkedin.com/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    sub = None
    name = ""
    if userinfo_resp.ok:
        udata = userinfo_resp.json()
        sub = udata.get("sub")          # LinkedIn person ID
        name = udata.get("name", "")
    else:
        # Fallback: /v2/me
        me_resp = requests.get(
            "https://api.linkedin.com/v2/me",
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
            },
            timeout=15,
        )
        if me_resp.ok:
            mdata = me_resp.json()
            sub = mdata.get("id")
            first = mdata.get("localizedFirstName", "")
            last = mdata.get("localizedLastName", "")
            name = f"{first} {last}".strip()

    if not sub:
        print("WARNING: Could not retrieve your LinkedIn person ID automatically.")
        print("You can find it manually — see instructions below.\n")
        person_urn = "urn:li:person:REPLACE_WITH_YOUR_ID"
    else:
        person_urn = f"urn:li:person:{sub}"

    # ── Output ────────────────────────────────────────────────────────────────
    print("\n" + "="*70)
    print("SUCCESS! Add these lines to your .env file on the server:")
    print("="*70)
    print(f"LINKEDIN_ACCESS_TOKEN={access_token}")
    print(f"LINKEDIN_PERSON_URN={person_urn}")
    print("="*70)
    if name:
        print(f"Authenticated as: {name}")
    print(f"Token valid for approximately {expires_days} days.")
    print("\nIMPORTANT: LinkedIn access tokens expire. Re-run this script")
    print("before expiry and update .env + restart the service.")
    if not sub:
        print("\nTo find your person URN manually:")
        print("  1. Go to linkedin.com/in/YOUR-PROFILE")
        print("  2. Run this in the browser console:")
        print('     fetch("https://api.linkedin.com/v2/me", {headers:{Authorization:"Bearer TOKEN"}})')
        print('        .then(r=>r.json()).then(d=>console.log(d.id))')


if __name__ == "__main__":
    main()
