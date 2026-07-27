CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    address     TEXT NOT NULL,
    sender      TEXT,
    subject     TEXT,
    body_text   TEXT,
    body_html   TEXT,
    received_at INTEGER NOT NULL,
    seen        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_messages_address ON messages(address);
CREATE INDEX IF NOT EXISTS idx_messages_received ON messages(received_at);
