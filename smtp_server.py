"""Incoming-mail receiver built on aiosmtpd.

Parses each incoming message and stores one row per recipient inbox.
Runs inside its own thread via aiosmtpd's Controller; call start_smtp() /
stop_smtp() from the web app's lifecycle hooks.
"""
from email import message_from_bytes
from email.header import decode_header, make_header
from email.utils import parseaddr
from typing import Optional, Tuple

from aiosmtpd.controller import Controller

import config
import database


def _decode(value: Optional[str]) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value)))
    except Exception:
        return value


def _extract_bodies(msg) -> Tuple[str, str]:
    """Return (text, html) bodies from an email.message.Message."""
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


class TempMailHandler:
    async def handle_RCPT(self, server, session, envelope, address, rcpt_options):
        if config.RESTRICT_TO_DOMAINS:
            domain = address.split("@")[-1].lower()
            if domain not in [d.strip().lower() for d in config.DOMAINS]:
                return "550 not a recipient this server accepts"
        envelope.rcpt_tos.append(address)
        return "250 OK"

    async def handle_DATA(self, server, session, envelope):
        if len(envelope.content) > config.MAX_MESSAGE_BYTES:
            return "552 message too large"

        msg = message_from_bytes(envelope.content)
        subject = _decode(msg.get("Subject"))
        from_name, from_addr = parseaddr(_decode(msg.get("From")))
        sender = from_addr or envelope.mail_from or ""
        if from_name:
            sender = f"{from_name} <{sender}>"
        text, html = _extract_bodies(msg)

        for rcpt in envelope.rcpt_tos:
            _, rcpt_addr = parseaddr(rcpt)
            rcpt_addr = rcpt_addr or rcpt
            database.insert_message(
                address=rcpt_addr,
                sender=sender,
                subject=subject,
                body_text=text,
                body_html=html,
            )
        return "250 Message accepted for delivery"


_controller: Optional[Controller] = None


def start_smtp() -> None:
    global _controller
    if _controller is not None:
        return
    # aiosmtpd binds to all interfaces when hostname == "" and then runs its
    # readiness probe against localhost. Passing "0.0.0.0" makes the probe try
    # to *connect* to 0.0.0.0, which is invalid on Windows (WinError 10049), so
    # normalize any bind-all address to "".
    host = config.SMTP_HOST
    if host in ("0.0.0.0", "::", "*"):
        host = ""
    _controller = Controller(
        TempMailHandler(),
        hostname=host,
        port=config.SMTP_PORT,
    )
    _controller.start()


def stop_smtp() -> None:
    global _controller
    if _controller is not None:
        _controller.stop()
        _controller = None
