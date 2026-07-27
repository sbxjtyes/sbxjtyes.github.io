"""Entry point for the Gmail plus-alias temp mailbox."""
import uvicorn

import config

if __name__ == "__main__":
    local = config.GMAIL_ADDRESS or "(未配置)"
    print("=" * 60)
    print("  Gmail 临时邮箱（+ 别名模式）")
    print(f"  网页   : http://{config.WEB_HOST}:{config.WEB_PORT}")
    print(f"  账号   : {local}")
    print(f"  模式   : {'演示（未配置 .env）' if config.DEMO_MODE else '真实 Gmail'}")
    print("=" * 60)
    uvicorn.run("app:app", host=config.WEB_HOST, port=config.WEB_PORT, log_level="info")
