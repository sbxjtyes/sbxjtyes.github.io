"""Send a test email into the local SMTP receiver.

    python send_test.py 收件地址@yourdomain

Handy for verifying the pipeline without a real domain.
"""
import sys
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import config

to_addr = sys.argv[1] if len(sys.argv) > 1 else f"test@{config.DOMAINS[0].strip()}"

msg = MIMEMultipart("alternative")
msg["From"] = "测试发件人 Test <noreply@example.com>"
msg["To"] = to_addr
msg["Subject"] = "测试邮件 · 验证码 123456"
msg.attach(MIMEText("你好，这是一封测试邮件。\n验证码：123456", "plain", "utf-8"))
msg.attach(MIMEText(
    "<h2>测试邮件</h2><p>验证码：<b style='font-size:20px'>123456</b></p>",
    "html", "utf-8",
))

with smtplib.SMTP("127.0.0.1", config.SMTP_PORT, timeout=10) as s:
    s.send_message(msg)

print(f"已发送到 {to_addr} （SMTP 127.0.0.1:{config.SMTP_PORT}）")
