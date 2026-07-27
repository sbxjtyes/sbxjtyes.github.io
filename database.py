"""SQLite storage layer.

Uses short-lived connections per operation so it is safe to call from both the
web server (asyncio thread) and the aiosmtpd controller (its own thread).
"""
import sqlite3
import time
import uuid
from typing import List, Optional, Dict, Any

import config

_SCHEMA = """
CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    address     TEXT NOT NULL,          -- recipient (lowercased), the inbox
    sender      TEXT,                   -- From: header / envelope sender
    subject     TEXT,
    body_text   TEXT,
    body_html   TEXT,
    received_at INTEGER NOT NULL,       -- epoch seconds
    seen        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_messages_address ON messages(address);
CREATE INDEX IF NOT EXISTS idx_messages_received ON messages(received_at);
"""


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(config.DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.executescript(_SCHEMA)


def insert_message(
    address: str,
    sender: str,
    subject: str,
    body_text: str,
    body_html: str,
) -> str:
    mid = uuid.uuid4().hex
    with _connect() as conn:
        conn.execute(
            "INSERT INTO messages "
            "(id, address, sender, subject, body_text, body_html, received_at, seen) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
            (
                mid,
                address.lower().strip(),
                sender,
                subject,
                body_text,
                body_html,
                int(time.time()),
            ),
        )
    return mid


def list_messages(address: str) -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT id, sender, subject, received_at, seen, "
            "       (body_html IS NOT NULL AND body_html != '') AS has_html "
            "FROM messages WHERE address = ? ORDER BY received_at DESC",
            (address.lower().strip(),),
        ).fetchall()
    return [dict(r) for r in rows]


def get_message(mid: str) -> Optional[Dict[str, Any]]:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM messages WHERE id = ?", (mid,)
        ).fetchone()
        if row is not None:
            conn.execute("UPDATE messages SET seen = 1 WHERE id = ?", (mid,))
    return dict(row) if row else None


def delete_message(mid: str) -> int:
    with _connect() as conn:
        cur = conn.execute("DELETE FROM messages WHERE id = ?", (mid,))
    return cur.rowcount


def delete_by_address(address: str) -> int:
    with _connect() as conn:
        cur = conn.execute(
            "DELETE FROM messages WHERE address = ?",
            (address.lower().strip(),),
        )
    return cur.rowcount


def purge_expired(retention_minutes: int) -> int:
    cutoff = int(time.time()) - retention_minutes * 60
    with _connect() as conn:
        cur = conn.execute("DELETE FROM messages WHERE received_at < ?", (cutoff,))
    return cur.rowcount
