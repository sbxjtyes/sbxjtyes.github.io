# Gmail 临时邮箱（“+” 别名模式）

用 Gmail 官方支持的 **加号别名（plus addressing）**做临时邮箱：
发给 `你的账号+任意标签@gmail.com` 的邮件都会进你真实的 `你的账号@gmail.com` 收件箱。
这个工具帮你**生成带标签的地址**，并用 IMAP **只读取属于某个标签的邮件**，展示成临时邮箱界面。

**优点**：不需要域名、不需要 Cloudflare、不需要任何服务器。你的电脑只对 Gmail 发出站连接，
不用被外网访问。

> 关于密码安全：你要用的是 Google 的 **应用专用密码**（不是你的登录密码）。它由你本人在
> Google 账号里生成，只写进你本地的 `.env` 文件。程序只把它用于连接 Google 的 IMAP 服务器
> 收信，不会发到别处。

---

## 一、先跑演示（不需要任何配置）

```powershell
cd "C:\Users\YS\Desktop\A\running\注册机\TemGmailRegister"
# 复用上层已建好的 venv（已装 fastapi/uvicorn）
venv\Scripts\python.exe -m pip install -r gmail-plus\requirements.txt   # 已装可跳过
cd gmail-plus
..\venv\Scripts\python.exe run.py
```

打开 <http://127.0.0.1:8000> —— 没配置 `.env` 时是**演示模式**，用示例邮件让你先看界面。

---

## 二、接上你真实的 Gmail

### 1. 生成 Google 应用专用密码
1. 打开 <https://myaccount.google.com/security>，确保 **两步验证（2-Step Verification）已开启**
   （没开就先开，应用专用密码需要它）。
2. 打开 <https://myaccount.google.com/apppasswords>，随便起个名字（如 `tempmail`），
   生成一个 **16 位密码**，复制下来。
3. 确认 IMAP 已开启：Gmail 网页 → 设置（齿轮）→ 查看所有设置 →
   “转发和 POP/IMAP” → **启用 IMAP**（新账号一般默认已开）。

### 2. 填 `.env`
把 `gmail-plus\.env.example` 复制成 `gmail-plus\.env`，填入：

```
GMAIL_ADDRESS=你的账号@gmail.com
GMAIL_APP_PASSWORD=刚生成的16位应用专用密码
```

### 3. 自测连接
```powershell
cd gmail-plus
..\venv\Scripts\python.exe check.py
# 想顺便看某个别名命中几封：
..\venv\Scripts\python.exe check.py 你的账号+test@gmail.com
```
看到 `IMAP OK ...` 就说明配置成功。

### 4. 启动
```powershell
..\venv\Scripts\python.exe run.py
```
打开 <http://127.0.0.1:8000>，页面顶部会显示 `你的账号+随机标签@gmail.com`。

---

## 三、怎么用

1. 页面上会有一个 `你的账号+xxxx@gmail.com` 地址。可以在“标签”框里**自己填一个好记的标签**
   （比如某网站名），或点“随机标签”。
2. 把这个地址填到需要验证的网站。
3. 收到的邮件几秒后自动出现在收件箱（每 6 秒刷新），点开看正文。外部图片默认拦截。
4. 想按不同用途区分，就用不同标签，每个标签是一个独立“收件箱”视图。

---

## 工作原理（技术）

- 生成的地址形如 `local+tag@gmail.com`，Gmail 把 `+tag` 之后忽略，投进 `local@gmail.com`。
- 每封邮件头里的 `Delivered-To` 会保留完整的 `local+tag@gmail.com`。
- 后端用 Gmail 的 IMAP 扩展搜索 `X-GM-RAW "deliveredto:local+tag@gmail.com"`，
  精确取出发给该标签的邮件（走 Gmail 索引，很快）。
- 用 `BODY.PEEK[]` 读取，不会把邮件标成已读；删除是给邮件打上 `\Trash` 标签
  （= 移到回收站，30 天内可在 Gmail 里恢复），**不会永久删除**。

## 说明与限制

- 需要保持本程序运行才能刷新收件箱（它是本地工具；Gmail 一直在替你收信，不怕漏）。
- 附件目前不下载，只展示 text/html 正文。
- 只读你自己的这个 Gmail；`.env` 不要提交/分享。
- 有些网站会拒绝带 `+` 的邮箱地址注册——遇到这种就换用 Cloudflare 自有域名方案（见 `../cf-worker/`）。

## 文件

```
config.py         读取 .env 的配置
gmail_client.py   IMAP 连接、按别名搜索/读取/移回收站、演示客户端
app.py            FastAPI Web/API
run.py            启动
check.py          连接自测
static/           界面
.env.example      配置模板（复制成 .env 填写）
```
