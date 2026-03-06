/**
 * DevToolbox — Core Application Logic
 *
 * Handles hash-based routing, navigation, tool registration,
 * search filtering, and global utility helpers.
 */

/* ---- Tool Registry ---- */
const TOOLS = [
    // Developer Tools
    { id: 'json-formatter',     name: 'JSON 格式化',    icon: '{ }', desc: 'JSON 格式化、压缩、语法验证',           category: 'dev' },
    { id: 'regex-tester',       name: '正则测试',       icon: '.*',  desc: '正则表达式实时匹配测试',              category: 'dev' },
    { id: 'markdown-preview',   name: 'Markdown 预览',  icon: 'M↓',  desc: 'Markdown 编辑器与实时预览',           category: 'dev' },
    { id: 'diff-viewer',        name: 'Diff 对比',      icon: '≠',   desc: '文本逐行差异对比',                    category: 'dev' },
    { id: 'code-formatter',     name: '代码格式化',      icon: '⟨⟩',  desc: 'HTML / CSS / JS 代码美化',           category: 'dev' },
    { id: 'cron-parser',        name: 'Cron 解析',      icon: '⏱',   desc: 'Cron 表达式解析与可视化',             category: 'dev' },
    // Encoding
    { id: 'base64',             name: 'Base64',         icon: 'B64', desc: 'Base64 编码 / 解码',                  category: 'encode' },
    { id: 'url-codec',          name: 'URL 编解码',     icon: '%',   desc: 'URL 编码 / 解码',                     category: 'encode' },
    { id: 'hash-generator',     name: 'Hash 生成',      icon: '#',   desc: 'MD5 / SHA1 / SHA256 / SHA512',       category: 'encode' },
    { id: 'jwt-decoder',        name: 'JWT 解析',       icon: 'JWT', desc: 'JWT Token 解码与验证',                category: 'encode' },
    { id: 'number-base',        name: '进制转换',       icon: '0x',  desc: '二/八/十/十六进制互转',               category: 'encode' },
    // Text
    { id: 'text-counter',       name: '字数统计',       icon: 'Aa',  desc: '字数、字符数、行数统计',              category: 'text' },
    { id: 'text-dedup',         name: '去重 / 排序',    icon: '⇅',   desc: '文本按行去重与排序',                  category: 'text' },
    // Design
    { id: 'color-converter',    name: '颜色转换',       icon: '🎨',  desc: 'HEX / RGB / HSL 颜色互转',           category: 'design' },
    { id: 'gradient-generator', name: '渐变生成器',     icon: '◑',   desc: 'CSS 渐变可视化编辑器',                category: 'design' },
    // Data
    { id: 'timestamp',          name: '时间戳转换',     icon: '⏰',  desc: 'Unix 时间戳与日期互转',               category: 'data' },
    { id: 'unit-converter',     name: '单位换算',       icon: '⇄',   desc: '长度/重量/温度等单位换算',            category: 'data' },
    // Generator
    { id: 'qrcode-generator',   name: '二维码生成',     icon: '▣',   desc: '文本/URL 生成二维码',                 category: 'gen' },
    { id: 'password-generator', name: '密码生成',       icon: '🔒',  desc: '随机密码生成与强度评估',              category: 'gen' },
    // File
    { id: 'image-compressor',   name: '图片压缩',       icon: '🖼',  desc: '浏览器端图片压缩',                    category: 'file' },
];

/* ---- DOM References ---- */
const navMenu        = document.getElementById('navMenu');
const toolSearch     = document.getElementById('toolSearch');
const mainContent    = document.getElementById('mainContent');
const toolGrid       = document.getElementById('toolGrid');
const sidebar        = document.getElementById('sidebar');
const sidebarClose   = document.getElementById('sidebarClose');
const mobileMenuBtn  = document.getElementById('mobileMenuBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');

/* ---- Build Home Tool Grid ---- */
function buildToolGrid() {
    toolGrid.innerHTML = TOOLS.map(tool => `
        <a href="#${tool.id}" class="tool-card" data-tool="${tool.id}">
            <div class="tool-card-icon">${tool.icon}</div>
            <div class="tool-card-title">${tool.name}</div>
            <div class="tool-card-desc">${tool.desc}</div>
        </a>
    `).join('');
}
buildToolGrid();

/* ---- Hash Router ---- */
function navigateTo(toolId) {
    // Hide all pages
    document.querySelectorAll('.tool-page').forEach(p => p.classList.remove('active'));

    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    if (!toolId || toolId === 'home') {
        document.getElementById('page-home').classList.add('active');
    } else {
        const page = document.getElementById(`page-${toolId}`);
        if (page) {
            page.classList.add('active');

            // Initialize tool if not yet rendered
            if (!page.dataset.initialized && typeof window[`initTool_${toolId.replace(/-/g, '_')}`] === 'function') {
                window[`initTool_${toolId.replace(/-/g, '_')}`](page);
                page.dataset.initialized = 'true';
            }
        }

        const navItem = document.querySelector(`.nav-item[data-tool="${toolId}"]`);
        if (navItem) navItem.classList.add('active');
    }

    // Close sidebar on mobile
    closeSidebar();
}

function onHashChange() {
    const hash = location.hash.slice(1) || 'home';
    navigateTo(hash);
}

window.addEventListener('hashchange', onHashChange);
window.addEventListener('DOMContentLoaded', onHashChange);

/* ---- Search Filter ---- */
toolSearch.addEventListener('input', () => {
    const query = toolSearch.value.trim().toLowerCase();
    document.querySelectorAll('.nav-item').forEach(item => {
        const label = item.querySelector('.nav-label').textContent.toLowerCase();
        const toolId = item.dataset.tool;
        const toolDef = TOOLS.find(t => t.id === toolId);
        const desc = toolDef ? toolDef.desc.toLowerCase() : '';
        const match = label.includes(query) || desc.includes(query) || toolId.includes(query);
        item.classList.toggle('hidden', !match);
    });
});

/* ---- Mobile Sidebar ---- */
function openSidebar()  { sidebar.classList.add('open');    sidebarOverlay.classList.add('active'); }
function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); }

mobileMenuBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

/* ---- Global Helpers ---- */

/**
 * Show a temporary toast message at the bottom-right corner.
 *
 * @param {string} message - Toast message text.
 * @param {number} [duration=2500] - Duration in ms before auto-dismiss.
 */
function showToast(message, duration = 2500) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

/**
 * Copy text to clipboard and show a toast confirmation.
 *
 * @param {string} text - Text to copy.
 * @param {HTMLElement} [btn] - Optional button element to show "copied" state.
 */
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ 已复制到剪贴板');
        if (btn) {
            btn.textContent = '已复制 ✓';
            btn.classList.add('copied');
            setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('copied'); }, 2000);
        }
    }).catch(() => {
        showToast('❌ 复制失败，请手动复制');
    });
}

/**
 * Escape HTML to prevent XSS when rendering user input.
 *
 * @param {string} str - Raw string.
 * @returns {string} Escaped string safe for innerHTML.
 */
function escapeHtml(str) {
    const el = document.createElement('div');
    el.textContent = str;
    return el.innerHTML;
}

/**
 * Create a standard tool page layout with header, description, and body container.
 *
 * @param {HTMLElement} container - The page container element.
 * @param {string} title - Tool title.
 * @param {string} desc - Tool description.
 * @returns {HTMLElement} The body container for tool-specific content.
 */
function createToolLayout(container, title, desc) {
    container.innerHTML = `
        <div class="tool-header">
            <h1>${title}</h1>
            <p>${desc}</p>
        </div>
        <div class="tool-body" id="body-${container.id.replace('page-', '')}"></div>
    `;
    return container.querySelector('.tool-body');
}
