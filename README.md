# TempMail · 临时邮箱服务

一个可自建、可真正收信的临时邮箱服务，功能对标 temptom.com：免注册、即用即弃、
自动刷新收件箱、到期自动销毁、默认拦截外部图片与脚本。

- **SMTP 接收端**（`aiosmtpd`）：接收发往 `任意用户名@你的域名` 的真实邮件
- **Web 界面 + API**（FastAPI）：生成地址、自动刷新收件箱、查看邮件、销毁邮件
- **SQLite 存储**：SMTP 与 Web 共用，后台定时清理过期邮件

---

## 1. 快速开始（本地 / 演示模式）

无需域名即可先把界面跑起来体验：

```powershell
cd "C:\Users\YS\Desktop\A\running\注册机\TemGmailRegister"

# 首次：创建虚拟环境并安装依赖
python -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt

# 启动（同时启动 Web + SMTP 接收端）
venv\Scripts\python.exe run.py
```

浏览器打开 <http://127.0.0.1:8000>

**验证界面**：页面底部「🧪 演示 / 自测」里点「投递一封测试邮件」，或另开一个终端：

```powershell
venv\Scripts\python.exe send_test.py 你看到的地址@tempmail.local
```

几秒后（自动刷新）邮件就会出现在收件箱。

> 本地默认域名是 `example.com` / `mail.example.com`，仅用于演示。要收真实邮件，
> 必须换成你自己拥有、且已把 MX 记录指向本机的域名，见下一节。

---

## 2. 接收真实邮件（正式使用）

要真正收到互联网发来的邮件，需要满足三件事：**你拥有一个域名** → **该域名的 MX
记录指向这台服务器** → **这台服务器的 25 端口能被外网访问**。

### 2.1 准备一台公网服务器

- 一台有公网 IP 的 VPS / 云服务器（Linux 最方便）。
- **重要**：很多云厂商与家庭宽带默认**封禁 25 端口**（入站/出站）。选服务器前先确认
  25 端口可用，否则收不到信。若 25 被封，可改用方案 B（见 2.5）。

### 2.2 配置 DNS

假设你的域名是 `mail.example.com`，服务器公网 IP 是 `203.0.113.10`：

| 类型 | 主机记录            | 值               | 说明                    |
|------|---------------------|------------------|-------------------------|
| A    | `mx`                | `203.0.113.10`   | 邮件服务器的地址        |
| MX   | `@`（或子域）       | `mx.example.com` （优先级 10） | 告诉全网往哪投信 |

生效后用 `nslookup -type=mx example.com` 验证。

### 2.3 启动服务并绑定域名 / 端口

用环境变量把域名换成你的，SMTP 端口设为 25，Web 对外监听：

```powershell
# Windows（管理员 PowerShell，25 端口需要管理员权限）
$env:TEMPMAIL_DOMAINS="example.com,mail.example.com"
$env:TEMPMAIL_SMTP_PORT="25"
$env:TEMPMAIL_WEB_HOST="0.0.0.0"
venv\Scripts\python.exe run.py
```

```bash
# Linux
export TEMPMAIL_DOMAINS="example.com,mail.example.com"
export TEMPMAIL_SMTP_PORT=25
export TEMPMAIL_WEB_HOST=0.0.0.0
# 25 是特权端口：用 sudo，或用 setcap 授权，或用防火墙把 25 转发到 2525
sudo -E venv/bin/python run.py
```

Linux 上不想用 root 跑 25 端口，可以让服务监听 2525，再用防火墙转发：

```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 25 -j REDIRECT --to-port 2525
```

### 2.4 生产部署建议

- **Web 加 HTTPS**：用 Nginx / Caddy 反向代理到 `127.0.0.1:8000`，配好证书。
- **常驻运行**：Linux 用 `systemd`，Windows 用 `NSSM` 把 `run.py` 注册成服务。
- **防滥用**：`TEMPMAIL_RESTRICT=true`（默认）只接收你自己域名的邮件，避免变成
  全网垃圾邮件的接收站。

### 2.5 方案 B：没有公网服务器 / 25 端口被封 → 用 Cloudflare（推荐）

如果你没有公网服务器，或 25 端口被封，就走 Cloudflare 免费方案：邮件由 Cloudflare 的
公网服务器代收，一个 Worker 存信并展示界面，全程无需你自己的服务器，电脑关机也在线。

**这套已经实现好了，见 [`cf-worker/`](cf-worker/README.md)**，里面有完整代码和一步步的
部署清单（用你自己的域名 `sbxjtyes.me`）。

---

## 3. 配置项（环境变量）

| 变量                   | 默认值                      | 说明                                   |
|------------------------|-----------------------------|----------------------------------------|
| `TEMPMAIL_DOMAINS`     | `example.com,mail.example.com` | 逗号分隔的可用域名列表              |
| `TEMPMAIL_RETENTION`   | `60`                        | 邮件保留分钟数（后台清理阈值）         |
| `TEMPMAIL_SMTP_HOST`   | `0.0.0.0`                   | SMTP 监听地址（自动兼容 Windows）      |
| `TEMPMAIL_SMTP_PORT`   | `2525`                      | SMTP 端口，正式收信设为 `25`           |
| `TEMPMAIL_RESTRICT`    | `true`                      | 只接收 `DOMAINS` 内的收件人            |
| `TEMPMAIL_WEB_HOST`    | `127.0.0.1`                 | Web 监听地址，对外设 `0.0.0.0`         |
| `TEMPMAIL_WEB_PORT`    | `8000`                      | Web 端口                               |
| `TEMPMAIL_DB`          | 项目目录 `mail.db`          | SQLite 文件路径                        |
| `TEMPMAIL_MAX_BYTES`   | `2097152`                   | 单封邮件大小上限（字节）               |

---

## 4. HTTP API

| 方法   | 路径                        | 说明                       |
|--------|-----------------------------|----------------------------|
| GET    | `/api/config`               | 域名、保留时间等配置       |
| POST   | `/api/generate?domain=...`  | 生成一个随机地址           |
| GET    | `/api/inbox?address=...`    | 列出某地址的邮件（元信息） |
| GET    | `/api/message/{id}`         | 查看单封邮件全文           |
| DELETE | `/api/message/{id}`         | 删除单封邮件               |
| DELETE | `/api/inbox?address=...`    | 销毁该地址所有邮件         |
| POST   | `/api/test-inject`          | 注入一封测试邮件（自测用） |

---

## 5. 文件结构

```
config.py         配置（域名、端口、保留时间…）
database.py       SQLite 存储层
smtp_server.py    aiosmtpd 收信端 + 邮件解析
app.py            FastAPI Web/API + 生命周期（启动 SMTP、定时清理）
run.py            入口：一条命令同时起 Web 和 SMTP
static/           前端（index.html / style.css / app.js）
send_test.py      本地发测试邮件的小工具
requirements.txt  依赖
```

---

## 6. 说明与限制

- 「保留时间」下拉框：后台清理按 `TEMPMAIL_RETENTION` 执行；前端下拉框还会按所选时长
  过滤显示，超时的邮件不再展示。
- HTML 邮件在**沙箱 iframe** 中渲染，默认禁用脚本、禁止加载外部图片（防跟踪像素），
  可点「显示图片」临时加载。
- 附件当前不保存（只提取正文 text/html）。需要下载附件可告诉我，我再加。
- 这是给你自己用的自建服务；对外公开前请务必加 HTTPS、限制域名、并考虑加访问控制。
```
