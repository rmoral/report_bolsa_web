"""
Generates Twitter OAuth 1.0a Access Token and Secret via PIN-based flow.
Run this script once to get the tokens, then add them to your .env file.

Usage:
    pip install tweepy
    python get_twitter_tokens.py
"""
import tweepy

# Paste your Consumer Key and Consumer Secret from developers.x.com
API_KEY    = input("Consumer Key (API Key): ").strip()
API_SECRET = input("Consumer Secret (API Secret): ").strip()

auth = tweepy.OAuth1UserHandler(API_KEY, API_SECRET, callback="oob")

try:
    url = auth.get_authorization_url()
except tweepy.TweepyException as e:
    print(f"\nError getting authorization URL: {e}")
    raise

print(f"\n1. Open this URL in your browser:\n\n   {url}\n")
print("2. Authorize the app with the X account you want to post from.")
print("3. Copy the PIN shown on screen.\n")

pin = input("Enter the PIN: ").strip()

try:
    auth.get_access_token(pin)
except tweepy.TweepyException as e:
    print(f"\nError getting access token: {e}")
    raise

print("\n✅ Success! Add these lines to your .env file:\n")
print(f"TWITTER_ACCESS_TOKEN={auth.access_token}")
print(f"TWITTER_ACCESS_TOKEN_SECRET={auth.access_token_secret}")
