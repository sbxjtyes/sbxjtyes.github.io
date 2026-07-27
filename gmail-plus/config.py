"""Configuration for the Gmail plus-alias temp mailbox.

Values come from a local `.env` file (or real environment variables).
Copy `.env.example` to `.env` and fill in your own Gmail + app password.
The app password lives only in your local `.env`; it is never sent anywhere
except to Google's IMAP server when fetching your mail.
"""
import os

# --- minimal .env loader (no external dependency) ----------------------------
def _load_dotenv(path: str) -> None:
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            # Do not override real environment variables if already set
            os.environ.setdefault(key, val)


_load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# --- Gmail account -----------------------------------------------------------
# Your REAL Gmail (or Google Workspace) address, e.g. yourname@gmail.com
GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS", "").strip()

# A Google *App Password* (16 chars). Create at:
#   Google Account -> Security -> 2-Step Verification -> App passwords
# Spaces are stripped automatically.
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "").strip()

# --- IMAP --------------------------------------------------------------------
IMAP_HOST = os.environ.get("IMAP_HOST", "imap.gmail.com")
IMAP_PORT = int(os.environ.get("IMAP_PORT", "993"))
# How many most-recent matching messages to load per alias (bounds the work).
MAX_RESULTS = int(os.environ.get("TEMPMAIL_MAX_RESULTS", "40"))

# --- Web server --------------------------------------------------------------
# Render (and most PaaS hosts) inject a $PORT env var and expect the app to
# bind 0.0.0.0 to it; TEMPMAIL_WEB_HOST/PORT still take precedence if set.
WEB_HOST = os.environ.get("TEMPMAIL_WEB_HOST", "0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
WEB_PORT = int(os.environ.get("TEMPMAIL_WEB_PORT", os.environ.get("PORT", "8000")))

# Demo mode is ON automatically when no app password is configured: the UI
# works with a canned sample message so you can try it before setting up IMAP.
DEMO_MODE = not (GMAIL_ADDRESS and GMAIL_APP_PASSWORD)
