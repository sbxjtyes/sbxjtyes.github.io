"""Web API + UI for the Gmail plus-alias temp mailbox.

    python run.py

Generates `base+tag@gmail.com` aliases and reads them back from your Gmail
over IMAP, filtered by the +tag.
"""
import asyncio
import os
import random
import string
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import config
import gmail_client

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

client = gmail_client.make_client()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not config.DEMO_MODE:
        try:
            status = await asyncio.to_thread(client.check)
            print("  " + status)
        except Exception as e:
            print(f"  ⚠ IMAP 登录失败：{e}")
            print("  请检查 .env 里的 GMAIL_ADDRESS / GMAIL_APP_PASSWORD，以及是否已开两步验证并生成应用专用密码。")
    yield


app = FastAPI(title="Gmail TempMail", lifespan=lifespan)


def _random_tag(n: int = 8) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(n))


def _base_parts():
    base = config.GMAIL_ADDRESS or "youraccount@gmail.com"
    local, _, domain = base.partition("@")
    return local, domain or "gmail.com"


@app.get("/api/config")
async def api_config():
    local, domain = _base_parts()
    return {
        "base_address": f"{local}@{domain}",
        "local": local,
        "domain": domain,
        "demo": config.DEMO_MODE,
    }


@app.post("/api/generate")
async def api_generate(tag: Optional[str] = None):
    local, domain = _base_parts()
    t = (tag or _random_tag()).strip().lower()
    # keep tag to characters Gmail allows in the local part
    t = "".join(ch for ch in t if ch.isalnum() or ch in "._-") or _random_tag()
    return {"address": f"{local}+{t}@{domain}", "tag": t}


@app.get("/api/inbox")
async def api_inbox(address: str = Query(..., min_length=3)):
    try:
        msgs = await asyncio.to_thread(client.list_for_address, address)
    except Exception as e:
        raise HTTPException(502, f"读取 Gmail 失败：{e}")
    return {"address": address, "count": len(msgs), "messages": msgs}


@app.get("/api/message/{mid}")
async def api_message(mid: str):
    msg = await asyncio.to_thread(client.get_message, mid)
    if not msg:
        raise HTTPException(404, "not found")
    return msg


@app.delete("/api/message/{mid}")
async def api_delete_message(mid: str):
    n = await asyncio.to_thread(client.trash, mid)
    return {"trashed": n}


@app.delete("/api/inbox")
async def api_destroy(address: str = Query(..., min_length=3)):
    n = await asyncio.to_thread(client.trash_all_for_address, address)
    return {"trashed": n}


@app.get("/")
async def index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
