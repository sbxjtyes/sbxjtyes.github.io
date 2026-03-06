/**
 * Timestamp Converter Tool
 * Convert between Unix timestamps and human-readable dates.
 */
function initTool_timestamp(container) {
    const body = createToolLayout(container, '时间戳转换', 'Unix 时间戳 ↔ 可读日期互转，显示当前时间戳');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">⏰ 当前时间戳（实时）</div>
            <div style="display:flex;align-items:center;gap:16px">
                <span class="stat-value" id="tsNow" style="font-size:1.8rem"></span>
                <button class="btn btn-sm btn-secondary" id="tsNowCopy">复制</button>
            </div>
            <div id="tsNowDate" style="color:var(--text-secondary);font-size:0.9rem;margin-top:6px"></div>
        </div>
        <div class="split-pane">
            <div class="panel">
                <div class="panel-title">时间戳 → 日期</div>
                <input type="text" id="tsInput" placeholder="输入 Unix 时间戳（秒或毫秒）">
                <button class="btn btn-primary" style="margin-top:12px" id="tsToDate">转换</button>
                <div class="output-area" id="tsDateResult" style="margin-top:12px;min-height:60px"></div>
            </div>
            <div class="panel">
                <div class="panel-title">日期 → 时间戳</div>
                <input type="datetime-local" id="tsDateInput" style="font-family:var(--font-sans)">
                <button class="btn btn-primary" style="margin-top:12px" id="tsToStamp">转换</button>
                <div class="output-area" id="tsStampResult" style="margin-top:12px;min-height:60px"></div>
            </div>
        </div>
    `;

    // Real-time clock
    const nowEl = document.getElementById('tsNow');
    const nowDate = document.getElementById('tsNowDate');
    function updateNow() {
        const now = Math.floor(Date.now() / 1000);
        nowEl.textContent = now;
        nowDate.textContent = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    updateNow();
    setInterval(updateNow, 1000);

    document.getElementById('tsNowCopy').addEventListener('click', function () {
        copyToClipboard(nowEl.textContent, this);
    });

    // Timestamp to date
    document.getElementById('tsToDate').addEventListener('click', () => {
        let ts = document.getElementById('tsInput').value.trim();
        if (!ts) return;
        ts = Number(ts);
        // Auto-detect milliseconds vs seconds
        if (ts > 9999999999) ts = ts / 1000;
        const date = new Date(ts * 1000);
        if (isNaN(date.getTime())) {
            document.getElementById('tsDateResult').innerHTML = '<span style="color:var(--danger)">无效的时间戳</span>';
            return;
        }
        document.getElementById('tsDateResult').innerHTML = `
            <div><strong>本地时间：</strong>${date.toLocaleString('zh-CN')}</div>
            <div style="margin-top:4px"><strong>UTC 时间：</strong>${date.toUTCString()}</div>
            <div style="margin-top:4px"><strong>ISO 格式：</strong>${date.toISOString()}</div>
            <div style="margin-top:4px"><strong>距今：</strong>${getTimeAgo(date)}</div>
        `;
    });

    // Date to timestamp
    const dtInput = document.getElementById('tsDateInput');
    const now = new Date();
    dtInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    document.getElementById('tsToStamp').addEventListener('click', () => {
        const date = new Date(dtInput.value);
        if (isNaN(date.getTime())) {
            document.getElementById('tsStampResult').innerHTML = '<span style="color:var(--danger)">无效日期</span>';
            return;
        }
        const seconds = Math.floor(date.getTime() / 1000);
        const millis = date.getTime();
        document.getElementById('tsStampResult').innerHTML = `
            <div><strong>秒级时间戳：</strong>${seconds}</div>
            <div style="margin-top:4px"><strong>毫秒级时间戳：</strong>${millis}</div>
        `;
    });

    function getTimeAgo(date) {
        const diff = Math.abs(Date.now() - date.getTime()) / 1000;
        const future = date.getTime() > Date.now();
        const prefix = future ? '未来 ' : '';
        const suffix = future ? '' : '前';
        if (diff < 60) return prefix + Math.round(diff) + ' 秒' + suffix;
        if (diff < 3600) return prefix + Math.round(diff / 60) + ' 分钟' + suffix;
        if (diff < 86400) return prefix + Math.round(diff / 3600) + ' 小时' + suffix;
        return prefix + Math.round(diff / 86400) + ' 天' + suffix;
    }
}
