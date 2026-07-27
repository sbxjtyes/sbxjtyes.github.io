"""Quick connectivity self-test.

    python check.py                 # just logs in and reports
    python check.py you+tag@gmail.com   # also counts mail for that alias

Use this to confirm your .env / app password / IMAP work before launching.
"""
import sys

import config
import gmail_client

if config.DEMO_MODE:
    print("演示模式：未配置 .env（GMAIL_ADDRESS / GMAIL_APP_PASSWORD）。")
    print("复制 .env.example 为 .env 并填好后再运行本脚本。")
    sys.exit(0)

client = gmail_client.make_client()
try:
    print(client.check())
except Exception as e:
    print(f"❌ 登录/连接失败：{e}")
    print("排查：1) 是否已开两步验证并生成【应用专用密码】；2) 密码是否填对；")
    print("      3) Gmail 设置里 IMAP 是否开启；4) 地址是否写对。")
    sys.exit(1)

if len(sys.argv) > 1:
    alias = sys.argv[1]
    msgs = client.list_for_address(alias)
    print(f"别名 {alias} → 命中 {len(msgs)} 封")
    for m in msgs[:10]:
        print(f"  · {m['subject']}  ({m['sender']})")
