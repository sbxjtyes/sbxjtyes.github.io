"""Reads a Gmail account over IMAP and filters by plus-alias (+tag).

Gmail delivers mail sent to `base+anything@gmail.com` into `base@gmail.com`,
and records the exact recipient in the message's `Delivered-To` header. We use
Gmail's `deliveredto:` search operator (via the IMAP X-GM-RAW extension) to pull
exactly the messages addressed to one alias.

imaplib is blocking and not thread-safe, so every operation is serialized behind
a single lock; the web layer calls these through asyncio.to_thread.
"""
import email
import imaplib
import re
import threading
import time
from email.header import decode_header, make_header
from email.utils import parsedate_to_datetime, parseaddr
from typing import Dict, List, Optional, Tuple

import config


# --------------------------------------------------------------------------- #
#  MIME parsing helpers
# --------------------------------------------------------------------------- #
def _decode(value: Optional[str]) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value)))
    except Exception:
        return value


def _extract_bodies(msg) -> Tuple[str, str]:
    text, html = "", ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.is_multipart():
                continue
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition") or "")
            if "attachment" in disp.lower():
                continue
            payload = part.get_payload(decode=True)
            if payload is None:
                continue
            charset = part.get_content_charset() or "utf-8"
            try:
                decoded = payload.decode(charset, errors="replace")
            except (LookupError, UnicodeDecodeError):
                decoded = payload.decode("utf-8", errors="replace")
            if ctype == "text/plain" and not text:
                text = decoded
            elif ctype == "text/html" and not html:
                html = decoded
    else:
        payload = msg.get_payload(decode=True)
        charset = msg.get_content_charset() or "utf-8"
        decoded = (payload or b"").decode(charset, errors="replace")
        if msg.get_content_type() == "text/html":
            html = decoded
        else:
            text = decoded
    return text, html


def _parse_raw(raw: bytes) -> dict:
    msg = email.message_from_bytes(raw)
    subject = _decode(msg.get("Subject"))
    from_name, from_addr = parseaddr(_decode(msg.get("From")))
    sender = from_addr or ""
    if from_name:
        sender = f"{from_name} <{from_addr}>"
    received_at = int(time.time())
    try:
        dt = parsedate_to_datetime(msg.get("Date"))
        if dt is not None:
            received_at = int(dt.timestamp())
    except Exception:
        pass
    text, html = _extract_bodies(msg)
    return {
        "sender": sender,
        "subject": subject,
        "received_at": received_at,
        "body_text": text,
        "body_html": html,
    }


# --------------------------------------------------------------------------- #
#  Real Gmail client
# --------------------------------------------------------------------------- #
class GmailClient:
    def __init__(self):
        self._lock = threading.Lock()
        self._imap: Optional[imaplib.IMAP4_SSL] = None
        self._mailbox = '"[Gmail]/All Mail"'
        self._cache: Dict[str, dict] = {}  # msgid -> parsed message

    # -- connection ---------------------------------------------------------
    def _connect(self):
        imap = imaplib.IMAP4_SSL(config.IMAP_HOST, config.IMAP_PORT)
        imap.login(config.GMAIL_ADDRESS, config.GMAIL_APP_PASSWORD)
        self._mailbox = self._find_all_mail(imap)
        imap.select(self._mailbox, readonly=False)
        self._imap = imap

    def _find_all_mail(self, imap) -> str:
        """Locate the 'All Mail' folder (language-independent via \\All flag)."""
        try:
            typ, boxes = imap.list()
            if typ == "OK":
                for b in boxes:
                    line = b.decode("utf-8", "replace") if isinstance(b, bytes) else str(b)
                    if "\\All" in line:
                        m = re.search(r'"([^"]*)"\s*$', line) or re.search(r'([^ ]+)\s*$', line)
                        if m:
                            name = m.group(1)
                            return '"%s"' % name if " " in name or "[" in name else name
        except Exception:
            pass
        return '"[Gmail]/All Mail"'

    def _ensure(self):
        if self._imap is None:
            self._connect()
            return
        try:
            self._imap.noop()
        except Exception:
            try:
                self._imap.logout()
            except Exception:
                pass
            self._imap = None
            self._connect()

    def _run(self, fn):
        """Serialize + auto-reconnect wrapper for a callable taking the imap obj."""
        with self._lock:
            self._ensure()
            try:
                return fn(self._imap)
            except (imaplib.IMAP4.abort, imaplib.IMAP4.error, OSError):
                # one reconnect + retry
                self._imap = None
                self._ensure()
                return fn(self._imap)

    # -- search / fetch -----------------------------------------------------
    def _search_uids(self, imap, address: str) -> List[bytes]:
        query = '"deliveredto:%s"' % address.replace('"', "")
        typ, data = imap.uid("SEARCH", "X-GM-RAW", query)
        if typ != "OK" or not data or data[0] is None:
            return []
        uids = data[0].split()
        return uids[-config.MAX_RESULTS:]

    def _fetch_headers(self, imap, uids: List[bytes]) -> List[Tuple[str, int, bytes]]:
        if not uids:
            return []
        uid_set = b",".join(uids)
        typ, data = imap.uid(
            "FETCH",
            uid_set,
            "(X-GM-MSGID FLAGS BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])",
        )
        if typ != "OK" or not data:
            return []
        out = []
        for item in data:
            if not isinstance(item, tuple) or len(item) < 2:
                continue
            meta = item[0].decode("utf-8", "replace")
            headers = item[1]
            m = re.search(r"X-GM-MSGID (\d+)", meta)
            msgid = m.group(1) if m else None
            seen = 1 if "\\Seen" in meta else 0
            if msgid and isinstance(headers, (bytes, bytearray)):
                out.append((msgid, seen, bytes(headers)))
        return out

    def _uid_for_msgid(self, imap, msgid: str) -> Optional[bytes]:
        typ, data = imap.uid("SEARCH", "X-GM-MSGID", str(msgid))
        if typ == "OK" and data and data[0]:
            parts = data[0].split()
            if parts:
                return parts[-1]
        return None

    # -- public API ---------------------------------------------------------
    def list_for_address(self, address: str) -> List[dict]:
        def op(imap):
            uids = self._search_uids(imap, address)
            rows = []
            for msgid, seen, headers in self._fetch_headers(imap, uids):
                parsed = _parse_raw(headers)
                rows.append({
                    "id": msgid,
                    "sender": parsed["sender"],
                    "subject": parsed["subject"],
                    "received_at": parsed["received_at"],
                    "seen": seen,
                    "has_html": 0,
                })
            rows.sort(key=lambda r: r["received_at"], reverse=True)
            return rows
        return self._run(op)

    def get_message(self, msgid: str) -> Optional[dict]:
        if msgid in self._cache:
            p = self._cache[msgid]
            return {"id": msgid, **p, "address": ""}

        def op(imap):
            uid = self._uid_for_msgid(imap, msgid)
            if not uid:
                return None
            typ, data = imap.uid("FETCH", uid, "(BODY.PEEK[])")
            if typ != "OK" or not data or not isinstance(data[0], tuple):
                return None
            parsed = _parse_raw(bytes(data[0][1]))
            self._cache[msgid] = parsed
            return {"id": msgid, **parsed, "address": ""}
        return self._run(op)

    def trash(self, msgid: str) -> int:
        def op(imap):
            uid = self._uid_for_msgid(imap, msgid)
            if not uid:
                return 0
            imap.uid("STORE", uid, "+X-GM-LABELS", "(\\Trash)")
            self._cache.pop(msgid, None)
            return 1
        return self._run(op)

    def trash_all_for_address(self, address: str) -> int:
        def op(imap):
            uids = self._search_uids(imap, address)
            if not uids:
                return 0
            imap.uid("STORE", b",".join(uids), "+X-GM-LABELS", "(\\Trash)")
            return len(uids)
        return self._run(op)

    def check(self) -> str:
        """Connectivity self-test; returns a human-readable status line."""
        def op(imap):
            typ, data = imap.uid("SEARCH", "ALL")
            n = len(data[0].split()) if (typ == "OK" and data and data[0]) else 0
            return f"IMAP OK · mailbox {self._mailbox} · {n} messages visible"
        return self._run(op)


# --------------------------------------------------------------------------- #
#  Demo client (used when no app password is configured)
# --------------------------------------------------------------------------- #
class DemoClient:
    def __init__(self):
        self._store: Dict[str, List[dict]] = {}

    def _seed(self, address: str):
        if address in self._store:
            return
        now = int(time.time())
        self._store[address] = [{
            "id": "demo1",
            "address": address,
            "sender": "GitHub <noreply@github.com>",
            "subject": "[GitHub] 验证码 728416（演示邮件）",
            "received_at": now,
            "seen": 0,
            "body_text": "这是演示模式的示例邮件。\n配置 .env 后会读取你真实的 Gmail。\n验证码 728416",
            "body_html": "<div style='font-family:sans-serif'><h2>验证你的邮箱（演示）</h2>"
                         "<p>验证码 <b style='font-size:22px;color:#3f74f0'>728416</b></p>"
                         "<p>配置 <code>.env</code> 里的 Gmail 与应用专用密码后，这里会显示你真实收到的邮件。</p></div>",
        }]

    def list_for_address(self, address: str) -> List[dict]:
        self._seed(address)
        return [{k: m[k] for k in ("id", "sender", "subject", "received_at", "seen")}
                | {"has_html": 1 if m["body_html"] else 0}
                for m in self._store[address]]

    def get_message(self, msgid: str) -> Optional[dict]:
        for msgs in self._store.values():
            for m in msgs:
                if m["id"] == msgid:
                    return m
        return None

    def trash(self, msgid: str) -> int:
        for msgs in self._store.values():
            before = len(msgs)
            msgs[:] = [m for m in msgs if m["id"] != msgid]
            if len(msgs) != before:
                return 1
        return 0

    def trash_all_for_address(self, address: str) -> int:
        n = len(self._store.get(address, []))
        self._store[address] = []
        return n

    def check(self) -> str:
        return "DEMO MODE · 未配置 .env，使用示例邮件"


def make_client():
    return DemoClient() if config.DEMO_MODE else GmailClient()
