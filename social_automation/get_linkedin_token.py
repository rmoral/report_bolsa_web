"""
LinkedIn OAuth 2.0 helper — run on your LOCAL machine, not the server.

Usage:
    python get_linkedin_token.py

The script starts a temporary HTTP server on localhost:8000 to automatically
capture the OAuth redirect, so you don't need to copy/paste any URL.

Requirements in .env (or export before running):
    LINKEDIN_CLIENT_ID=...
    LINKEDIN_CLIENT_SECRET=...

ALTERNATIVE (simpler — no script needed):
    1. Go to https://www.linkedin.com/developers/tools/oauth/token-generator
    2. Select your app, check scopes: openid, profile, w_member_social
    3. Click "Request access token" — copy the token shown
    4. Get your URN:
         curl -H "Authorization: Bearer TOKEN" https://api.linkedin.com/v2/userinfo
       Copy the "sub" field → your URN is: urn:li:person:<sub>
    5. Add both to your server .env and restart the service
"""
import os
import sys
import json
import secrets
import threading
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "").strip()
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "").strip()
REDIRECT_URI = "http://localhost:8000/callback"
SCOPES = ["openid", "profile", "w_member_social"]

_received_code = None
_received_state = None


class _CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global _received_code, _received_state
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        _received_code = params.get("code", [None])[0]
        _received_state = params.get("state", [None])[0]

        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        if _received_code:
            body = b"<h2>Authorized! You can close this tab and return to the terminal.</h2>"
        else:
            error = params.get("error_description", params.get("error", ["Unknown error"]))[0]
            body = f"<h2>Error: {error}</h2>".encode()
        self.wfile.write(body)

    def log_message(self, *args):
        pass  # suppress request logs


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        print(
            "ERROR: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be set.\n"
            "Add them to .env or export them before running this script.\n\n"
            "SIMPLER ALTERNATIVE — no script needed:\n"
            "  1. https://www.linkedin.com/developers/tools/oauth/token-generator\n"
            "  2. Select app, check: openid profile w_member_social\n"
            "  3. Click 'Request access token' and copy the token\n"
            "  4. curl -H 'Authorization: Bearer TOKEN' https://api.linkedin.com/v2/userinfo\n"
            "     → copy the 'sub' value → URN is urn:li:person:<sub>\n"
        )
        sys.exit(1)

    state = secrets.token_urlsafe(16)

    auth_params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": " ".join(SCOPES),
        "state": state,
    }
    auth_url = (
        "https://www.linkedin.com/oauth/v2/authorization?"
        + urllib.parse.urlencode(auth_params)
    )

    # Start temporary HTTP server in a background thread
    server = HTTPServer(("localhost", 8000), _CallbackHandler)
    thread = threading.Thread(target=server.handle_request)
    thread.daemon = True
    thread.start()

    print("\nOpening LinkedIn authorization in your browser…")
    print("If the browser does not open automatically, go to:\n")
    print(f"  {auth_url}\n")
    webbrowser.open(auth_url)

    print("Waiting for LinkedIn to redirect back…")
    thread.join(timeout=120)
    server.server_close()

    if not _received_code:
        print("ERROR: No authorization code received within 2 minutes.")
        sys.exit(1)

    if _received_state != state:
        print("WARNING: State mismatch — potential CSRF. Aborting.")
        sys.exit(1)

    # Exchange code for token
    token_resp = requests.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        data={
            "grant_type": "authorization_code",
            "code": _received_code,
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
    expires_days = token_data.get("expires_in", 0) // 86400

    if not access_token:
        print(f"ERROR: {token_data}")
        sys.exit(1)

    # Get person URN
    userinfo = requests.get(
        "https://api.linkedin.com/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    sub = None
    name = ""
    if userinfo.ok:
        data = userinfo.json()
        sub = data.get("sub")
        name = data.get("name", "")

    person_urn = f"urn:li:person:{sub}" if sub else "urn:li:person:REPLACE_WITH_SUB"

    print("\n" + "=" * 65)
    print("Add these to your server .env, then restart the service:")
    print("=" * 65)
    print(f"LINKEDIN_ACCESS_TOKEN={access_token}")
    print(f"LINKEDIN_PERSON_URN={person_urn}")
    print("=" * 65)
    if name:
        print(f"Authenticated as: {name}")
    print(f"Token valid for ~{expires_days} days. Re-run before expiry.")


if __name__ == "__main__":
    main()
