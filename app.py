"""Web API + static frontend for the temporary mail service.

Run with:  python run.py    (starts SMTP receiver + web server together)
"""
import asyncio
import os
import random
import string
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import config
import database
import smtp_server

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


async def _purge_loop():
    while True:
        try:
            database.purge_expired(config.DEFAULT_RETENTION)
        except Exception:
            pass
        await asyncio.sleep(config.PURGE_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    smtp_server.start_smtp()
    task = asyncio.create_task(_purge_loop())
    try:
        yield
    finally:
        task.cancel()
        smtp_server.stop_smtp()


app = FastAPI(title="TempMail", lifespan=lifespan)


# --------------------------------------------------------------------------- #
#  API
# --------------------------------------------------------------------------- #
def _random_localpart(n: int = 10) -> str:
    alphabet = string.ascii_lowercase + string.digits
    first = random.choice(string.ascii_lowercase)
    return first + "".join(random.choice(alphabet) for _ in range(n - 1))


@app.get("/api/config")
async def api_config():
    return {
        "domains": [d.strip() for d in config.DOMAINS if d.strip()],
        "retention_options": config.RETENTION_OPTIONS,
        "default_retention": config.DEFAULT_RETENTION,
        "smtp_port": config.SMTP_PORT,
    }


@app.post("/api/generate")
async def api_generate(domain: Optional[str] = None):
    domains = [d.strip() for d in config.DOMAINS if d.strip()]
    if domain and domain not in domains:
        raise HTTPException(400, "unknown domain")
    chosen = domain or (domains[0] if domains else "example.com")
    return {"address": f"{_random_localpart()}@{chosen}"}


@app.get("/api/inbox")
async def api_inbox(address: str = Query(..., min_length=3)):
    msgs = database.list_messages(address)
    return {"address": address, "count": len(msgs), "messages": msgs}


@app.get("/api/message/{mid}")
async def api_message(mid: str):
    msg = database.get_message(mid)
    if not msg:
        raise HTTPException(404, "not found")
    return msg


@app.delete("/api/message/{mid}")
async def api_delete_message(mid: str):
    n = database.delete_message(mid)
    return {"deleted": n}


@app.delete("/api/inbox")
async def api_destroy(address: str = Query(..., min_length=3)):
    n = database.delete_by_address(address)
    return {"deleted": n}


# --- Demo helper: inject a fake message so you can test without a domain ----- #
class InjectBody(BaseModel):
    address: str
    sender: str = "demo@sender.test"
    subject: str = "测试邮件 Test message"
    body_text: str = "这是一封用于演示的测试邮件。\nThis is a demo message."
    body_html: str = ""


@app.post("/api/test-inject")
async def api_inject(body: InjectBody):
    mid = database.insert_message(
        address=body.address,
        sender=body.sender,
        subject=body.subject,
        body_text=body.body_text,
        body_html=body.body_html,
    )
    return {"id": mid}


# --------------------------------------------------------------------------- #
#  Static frontend
# --------------------------------------------------------------------------- #
@app.get("/")
async def index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
