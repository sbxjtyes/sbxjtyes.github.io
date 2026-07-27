# TempMail on Cloudflare（用 sbxjtyes.me，无需公网服务器）

整个临时邮箱服务跑在 Cloudflare 免费套餐上：

- **收信**：Cloudflare Email Routing 用它自己的公网邮件服务器接收发往 `*@sbxjtyes.me` 的邮件
- **处理/存储**：一个 Worker 的 `email()` 处理器解析邮件并写入 D1 数据库
- **界面/接口**：同一个 Worker 的 `fetch()` 提供收件箱网页和 `/api/*`
- **清理**：Cron 定时删除过期邮件

你不需要任何服务器，电脑关机也能收信。地址是**你自己的域名** `sbxjtyes.me`。

> 你要用自己的账号完成「创建 Cloudflare 账号、改 Namecheap 的 nameserver、开启
> Email Routing、`wrangler login` 授权」这几步——这些涉及你的账号和密码，必须你本人操作。
> 代码、配置、命令我都准备好了，照着做即可。

---

## 前置

- 已装 Node（你本机是 v25，OK）
- 一个 Cloudflare 账号（免费，dash.cloudflare.com 注册）

---

## 步骤 A：把 sbxjtyes.me 接入 Cloudflare（保住你现有的网站）

你现在这个域名上挂着一个 **GitHub Pages 网站**，迁到 Cloudflare 后要把这些记录补回去，
网站才不会挂。当前需要保留的记录：

| 类型  | 名称   | 值                                                                 | 说明            |
|-------|--------|--------------------------------------------------------------------|-----------------|
| A     | `@`    | `185.199.108.153` `185.199.109.153` `185.199.110.153` `185.199.111.153` | GitHub Pages 站点（四条 A 记录） |
| CNAME | `www`  | `sbxjtyes.me`                                                       | www 跳主域       |

操作：

1. Cloudflare 仪表盘 → **Add a site** → 输入 `sbxjtyes.me` → 选 **Free** 套餐。
2. Cloudflare 会自动扫描并导入现有 DNS 记录。**核对上表两类记录都在**（不在就手动加）。
   - GitHub Pages 的这几条记录建议设为 **DNS only（灰色云朵）**。
3. Cloudflare 会给你两个 nameserver（形如 `xxx.ns.cloudflare.com`）。
4. 登录 **Namecheap → Domain List → sbxjtyes.me → Manage → Nameservers**，
   从「Namecheap BasicDNS」改成 **Custom DNS**，填入 Cloudflare 给的两个 NS，保存。
5. 等 Cloudflare 显示域名状态变为 **Active**（通常几分钟到几小时）。

> 迁走后，Namecheap 自带的邮件转发（原来的 `eforward` MX）会失效——这正是我们要替换的。
> 如果你原来靠它把某些邮箱转发到 Gmail，之后可以在 Cloudflare Email Routing 里用「转发规则」重建。

---

## 步骤 B：开启 Email Routing（先别急着配 catch-all）

1. Cloudflare 仪表盘 → 选中 `sbxjtyes.me` → 左侧 **Email** → **Email Routing** → **Enable**。
2. 它会自动添加接收邮件所需的 **MX 记录 + SPF**（会覆盖旧的 Namecheap 邮件设置）。
3. catch-all 规则等 Worker 部署完（步骤 D 之后）再设为「发送到 Worker」。

---

## 步骤 C：创建 D1 数据库并建表

在本目录（`cf-worker/`）里：

```bash
npx wrangler login          # 浏览器授权，你本人点“Allow”
npx wrangler d1 create tempmail
```

命令会输出一段 `database_id = "xxxxxxxx-..."`。把它填进 `wrangler.toml` 里
`PASTE_DATABASE_ID_HERE` 的位置，然后建表：

```bash
npx wrangler d1 execute tempmail --remote --file=./schema.sql
# 或： npm run db:init
```

---

## 步骤 D：部署 Worker

```bash
npm install        # 已装可跳过
npm run deploy     # = npx wrangler deploy
```

部署成功后会给你一个地址，形如：
`https://tempmail.<你的子域>.workers.dev`
——这就是你的临时邮箱**网页界面**，打开即用。

---

## 步骤 E：把收到的邮件接到 Worker

回到 **Email Routing** 页面：

1. **Routing rules → Catch-all address → Edit**。
2. Action 选 **Send to a Worker**，选择刚部署的 **tempmail**，保存并启用。

至此：任何发往 `任意名字@sbxjtyes.me` 的邮件都会进 Worker → 存进 D1 → 出现在你的网页收件箱。

---

## 步骤 F：验证

1. 打开你的 `*.workers.dev` 界面，页面顶部会显示一个 `xxxx@sbxjtyes.me` 地址。
2. 用另一个邮箱（如你的 Gmail）给这个地址发一封信。
3. 几秒后（自动刷新）邮件出现在收件箱，点开可看正文；外部图片默认拦截，可点「显示图片」。
   - 想看后台日志排查：`npm run tail`（= `npx wrangler tail`）。

---

## 常用配置

- 改保留时长 / 域名：编辑 `wrangler.toml` 的 `[vars]` 后重新 `npm run deploy`。
- 换一个更短的入口域名（可选）：在 Cloudflare Workers 里给这个 Worker 绑定自定义域，
  例如 `mail.sbxjtyes.me`（会在 DNS 里加一条记录，不影响你 apex 的 GitHub 站点）。
- 定时清理频率：`wrangler.toml` 的 `[triggers] crons`（默认每 15 分钟）。

## 免费额度（个人自用绰绰有余）

- Workers 请求：10 万/天
- Email Routing：免费、无固定条数上限（合理使用）
- D1：5GB 存储、每天数百万行读写额度
- Cron 触发器：免费

## 注意

- 这是公开可访问的网页，任何人知道地址都能查任意 `@sbxjtyes.me` 收件箱（临时邮箱本就无隐私）。
  如需私有，可在 Cloudflare 加 **Access**（零信任，免费）在界面前加一层登录。
- 附件目前不保存，只提取 text/html 正文。需要附件下载可再加。
- 邮件正文在沙箱 iframe 中渲染，默认禁脚本、禁外部图片（防跟踪像素）。
