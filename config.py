"""Central configuration for the temporary mail service.

Override any value with an environment variable of the same name.
"""
import os

# --- Domains offered to users when generating an address ---------------------
# These MUST be domains whose MX records point at this server if you want to
# receive REAL email. For local/demo use any value works.
DOMAINS = os.environ.get(
    "TEMPMAIL_DOMAINS",
    "example.com,mail.example.com"
).split(",")

# --- Retention: how long a message lives before auto-deletion ----------------
# Options shown in the UI (minutes). The first is the default.
RETENTION_OPTIONS = [5, 10, 30, 60]
DEFAULT_RETENTION = int(os.environ.get("TEMPMAIL_RETENTION", "60"))  # minutes

# --- SMTP receiver -----------------------------------------------------------
# Port 25 is the real SMTP port (needs privileges / firewall opening).
# For local testing use 2525 and send with a test client, or use --inject.
SMTP_HOST = os.environ.get("TEMPMAIL_SMTP_HOST", "0.0.0.0")
SMTP_PORT = int(os.environ.get("TEMPMAIL_SMTP_PORT", "2525"))
# Reject mail to any address whose domain is not in DOMAINS (recommended True
# in production so you are not an open relay/sink for the whole internet).
RESTRICT_TO_DOMAINS = os.environ.get("TEMPMAIL_RESTRICT", "true").lower() == "true"
MAX_MESSAGE_BYTES = int(os.environ.get("TEMPMAIL_MAX_BYTES", str(2 * 1024 * 1024)))

# --- Web server --------------------------------------------------------------
WEB_HOST = os.environ.get("TEMPMAIL_WEB_HOST", "127.0.0.1")
WEB_PORT = int(os.environ.get("TEMPMAIL_WEB_PORT", "8000"))

# --- Storage -----------------------------------------------------------------
DB_PATH = os.environ.get(
    "TEMPMAIL_DB",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "mail.db"),
)

# --- Housekeeping ------------------------------------------------------------
PURGE_INTERVAL_SECONDS = 60  # how often the background purge task runs
