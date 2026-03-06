# DevToolbox — 在线开发者工具箱

> ⚡ 20+ 实用工具，纯浏览器端运行，无需安装，数据不上传服务器

🔗 **在线访问**: [sbxjtyes.github.io](https://sbxjtyes.github.io)

## ✨ 功能列表

### 🔧 开发者工具
| 工具 | 说明 |
|------|------|
| JSON 格式化 | JSON 格式化、压缩、语法验证 |
| 正则测试 | 正则表达式实时匹配、捕获组显示 |
| Markdown 预览 | 左右分栏编辑器，实时渲染 |
| Diff 对比 | 文本逐行差异对比 |
| 代码格式化 | HTML / CSS / JS 代码美化 |
| Cron 解析 | Cron 表达式解析，显示执行时间 |

### 🔐 编码 / 加密
| 工具 | 说明 |
|------|------|
| Base64 | Base64 编码 / 解码 |
| URL 编解码 | URL 编码 / 解码 |
| Hash 生成 | MD5 / SHA1 / SHA256 / SHA512 |
| JWT 解析 | JWT Token 解码与过期检测 |
| 进制转换 | 二/八/十/十六进制互转 |

### 📝 文本处理
| 工具 | 说明 |
|------|------|
| 字数统计 | 字数、字符数、行数、中英文分计 |
| 去重 / 排序 | 文本按行去重、排序、打乱 |

### 🎨 设计工具
| 工具 | 说明 |
|------|------|
| 颜色转换 | HEX / RGB / HSL 颜色互转 |
| 渐变生成器 | CSS 渐变可视化编辑器 |

### 📊 数据计算
| 工具 | 说明 |
|------|------|
| 时间戳转换 | Unix 时间戳与日期互转 |
| 单位换算 | 长度/重量/温度/面积/速度/数据 |

### 🔑 生成器
| 工具 | 说明 |
|------|------|
| 二维码生成 | 文本/URL 生成可下载二维码 |
| 密码生成 | 随机密码生成与强度评估 |

### 📁 文件处理
| 工具 | 说明 |
|------|------|
| 图片压缩 | 浏览器端图片压缩 |

## 🛠 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **架构**: 单页面应用 (SPA)，Hash 路由
- **样式**: 暗色主题 + 玻璃拟态 (Glassmorphism)
- **字体**: Inter + JetBrains Mono (Google Fonts)
- **部署**: GitHub Pages

### 第三方库 (CDN)
- [CryptoJS](https://github.com/brix/crypto-js) — 哈希计算
- [marked](https://github.com/markedjs/marked) — Markdown 渲染
- [highlight.js](https://github.com/highlightjs/highlight.js) — 代码高亮
- [js-beautify](https://github.com/beautifier/js-beautify) — 代码格式化
- [qrcode.js](https://github.com/davidshimjs/qrcodejs) — 二维码生成
- [Compressor.js](https://github.com/fengyuanchen/compressorjs) — 图片压缩

## 📂 目录结构

```
├── index.html          # SPA 主入口
├── css/
│   └── style.css       # 设计系统 + 组件样式
├── js/
│   ├── app.js          # 路由、导航、全局工具方法
│   └── tools/          # 20 个工具脚本（每个工具一个文件）
├── CNAME               # 自定义域名配置
└── README.md           # 本文件
```

## 🚀 本地开发

```bash
# 克隆仓库
git clone https://github.com/sbxjtyes/sbxjtyes.github.io.git
cd sbxjtyes.github.io

# 启动本地服务器
npx serve .

# 浏览器打开 http://localhost:3000
```

## 📝 许可

MIT License
