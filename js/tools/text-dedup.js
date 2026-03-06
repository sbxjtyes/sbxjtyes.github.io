/**
 * Text Dedup & Sort Tool
 * Remove duplicate lines and sort text.
 */
function initTool_text_dedup(container) {
    const body = createToolLayout(container, '文本去重 / 排序', '按行去重、排序、随机打乱');
    body.innerHTML = `
        <div class="split-pane">
            <div class="panel">
                <div class="panel-title">输入文本（每行一条）</div>
                <textarea id="tdInput" rows="10" placeholder="每行一条数据..."></textarea>
            </div>
            <div class="panel">
                <div class="panel-title">处理结果</div>
                <div class="copy-wrap">
                    <button class="copy-btn" id="tdCopy">复制</button>
                    <textarea id="tdOutput" rows="10" readonly placeholder="结果..."></textarea>
                </div>
            </div>
        </div>
        <div class="btn-group">
            <button class="btn btn-primary" id="tdDedup">去重</button>
            <button class="btn btn-secondary" id="tdSortAsc">升序排序</button>
            <button class="btn btn-secondary" id="tdSortDesc">降序排序</button>
            <button class="btn btn-secondary" id="tdShuffle">随机打乱</button>
            <button class="btn btn-secondary" id="tdTrim">去除空行</button>
            <button class="btn btn-danger" id="tdClear">清空</button>
        </div>
        <div id="tdInfo" style="margin-top:8px;font-size:0.85rem;color:var(--text-muted)"></div>
    `;

    function getLines() {
        return document.getElementById('tdInput').value.split('\n');
    }

    function setOutput(lines, msg) {
        document.getElementById('tdOutput').value = lines.join('\n');
        document.getElementById('tdInfo').textContent = msg || '';
    }

    document.getElementById('tdDedup').addEventListener('click', () => {
        const lines = getLines();
        const unique = [...new Set(lines)];
        setOutput(unique, `去重完成：${lines.length} → ${unique.length} 行（移除 ${lines.length - unique.length} 行重复）`);
    });

    document.getElementById('tdSortAsc').addEventListener('click', () => {
        setOutput(getLines().sort((a, b) => a.localeCompare(b, 'zh-CN')), '已升序排序');
    });

    document.getElementById('tdSortDesc').addEventListener('click', () => {
        setOutput(getLines().sort((a, b) => b.localeCompare(a, 'zh-CN')), '已降序排序');
    });

    document.getElementById('tdShuffle').addEventListener('click', () => {
        const lines = getLines();
        for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        setOutput(lines, '已随机打乱');
    });

    document.getElementById('tdTrim').addEventListener('click', () => {
        const lines = getLines();
        const trimmed = lines.filter(l => l.trim().length > 0);
        setOutput(trimmed, `已去除空行：${lines.length} → ${trimmed.length} 行`);
    });

    document.getElementById('tdClear').addEventListener('click', () => {
        document.getElementById('tdInput').value = '';
        document.getElementById('tdOutput').value = '';
        document.getElementById('tdInfo').textContent = '';
    });

    document.getElementById('tdCopy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('tdOutput').value, this);
    });
}
