"""Entry point: starts the SMTP receiver and the web server together.

    python run.py

The SMTP receiver is started from the FastAPI lifespan hook (see app.py),
so we just launch uvicorn here.
"""
import uvicorn

import config

if __name__ == "__main__":
    print("=" * 60)
    print("  TempMail service starting")
    print(f"  Web UI   : http://{config.WEB_HOST}:{config.WEB_PORT}")
    print(f"  SMTP recv: {config.SMTP_HOST}:{config.SMTP_PORT}")
    print(f"  Domains  : {', '.join(config.DOMAINS)}")
    print("=" * 60)
    uvicorn.run(
        "app:app",
        host=config.WEB_HOST,
        port=config.WEB_PORT,
        log_level="info",
    )
