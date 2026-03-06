/**
 * Device Info Tool
 * Display current browser, device, network, and screen information.
 */
function initTool_device_info(container) {
    const body = createToolLayout(container, '设备信息', '查看浏览器、系统、屏幕、网络等设备信息');
    body.innerHTML = `
        <div class="btn-group" style="margin-bottom:16px">
            <button class="btn btn-primary" id="diRefresh">🔄 刷新信息</button>
            <button class="btn btn-secondary" id="diCopy">复制全部</button>
        </div>
        <div id="diContent" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px"></div>
    `;

    function getInfo() {
        const nav = navigator;
        const scr = screen;
        const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

        const sections = [
            {
                title: '🌐 浏览器',
                items: [
                    ['User Agent', nav.userAgent],
                    ['平台', nav.platform],
                    ['语言', nav.language],
                    ['Cookie 启用', nav.cookieEnabled ? '✅ 是' : '❌ 否'],
                    ['在线状态', nav.onLine ? '✅ 在线' : '❌ 离线'],
                    ['Do Not Track', nav.doNotTrack === '1' ? '✅ 已启用' : '❌ 未启用'],
                    ['硬件并发数 (CPU 核心)', nav.hardwareConcurrency || '未知'],
                    ['设备内存', nav.deviceMemory ? nav.deviceMemory + ' GB' : '未知'],
                ]
            },
            {
                title: '🖥️ 屏幕',
                items: [
                    ['屏幕分辨率', `${scr.width} × ${scr.height}`],
                    ['可用区域', `${scr.availWidth} × ${scr.availHeight}`],
                    ['浏览器窗口', `${window.innerWidth} × ${window.innerHeight}`],
                    ['设备像素比', window.devicePixelRatio],
                    ['色深', scr.colorDepth + ' bit'],
                    ['屏幕方向', scr.orientation ? scr.orientation.type : '未知'],
                    ['触摸支持', 'ontouchstart' in window ? '✅ 是' : '❌ 否'],
                ]
            },
            {
                title: '🔗 网络',
                items: conn ? [
                    ['连接类型', conn.effectiveType || '未知'],
                    ['下行速度', conn.downlink ? conn.downlink + ' Mbps' : '未知'],
                    ['RTT 延迟', conn.rtt ? conn.rtt + ' ms' : '未知'],
                    ['节省流量', conn.saveData ? '✅ 已启用' : '❌ 未启用'],
                ] : [['网络信息', '浏览器不支持 Network API']],
            },
            {
                title: '⏰ 时间',
                items: [
                    ['时区', Intl.DateTimeFormat().resolvedOptions().timeZone],
                    ['时区偏移', 'UTC' + (new Date().getTimezoneOffset() > 0 ? '-' : '+') + Math.abs(new Date().getTimezoneOffset() / 60)],
                    ['本地时间', new Date().toLocaleString('zh-CN')],
                ]
            },
            {
                title: '🛡️ 功能支持',
                items: [
                    ['WebGL', (() => { try { return !!document.createElement('canvas').getContext('webgl') ? '✅ 支持' : '❌ 不支持'; } catch (e) { return '❌ 不支持'; } })()],
                    ['WebSocket', 'WebSocket' in window ? '✅ 支持' : '❌ 不支持'],
                    ['Service Worker', 'serviceWorker' in nav ? '✅ 支持' : '❌ 不支持'],
                    ['Web Workers', 'Worker' in window ? '✅ 支持' : '❌ 不支持'],
                    ['Clipboard API', nav.clipboard ? '✅ 支持' : '❌ 不支持'],
                    ['通知权限', 'Notification' in window ? (Notification.permission === 'granted' ? '✅ 已授权' : '⚠️ ' + Notification.permission) : '❌ 不支持'],
                    ['Geolocation', 'geolocation' in nav ? '✅ 支持' : '❌ 不支持'],
                ]
            }
        ];

        return sections;
    }

    function render() {
        const sections = getInfo();
        document.getElementById('diContent').innerHTML = sections.map(sec => `
            <div class="panel">
                <div class="panel-title">${sec.title}</div>
                ${sec.items.map(([label, value]) => `
                    <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border-color);font-size:0.82rem;gap:12px">
                        <span style="color:var(--text-secondary);flex-shrink:0">${label}</span>
                        <span style="text-align:right;word-break:break-all;font-family:var(--font-mono);font-size:0.78rem">${escapeHtml(String(value))}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    document.getElementById('diRefresh').addEventListener('click', render);
    document.getElementById('diCopy').addEventListener('click', function () {
        const sections = getInfo();
        const text = sections.map(sec =>
            sec.title + '\n' + sec.items.map(([k, v]) => `  ${k}: ${v}`).join('\n')
        ).join('\n\n');
        copyToClipboard(text, this);
    });

    render();
}
