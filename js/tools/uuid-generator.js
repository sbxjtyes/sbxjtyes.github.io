/**
 * UUID Generator Tool
 * Generate UUID v4 with batch support.
 */
function initTool_uuid_generator(container) {
    const body = createToolLayout(container, 'UUID 生成器', '生成 UUID v4，支持批量生成');
    body.innerHTML = `
        <div class="panel">
            <div style="display:flex;gap:16px;align-items:end;flex-wrap:wrap">
                <div>
                    <label>生成数量</label>
                    <input type="number" id="uuidCount" value="1" min="1" max="100" style="width:80px">
                </div>
                <div>
                    <label>格式</label>
                    <select id="uuidFormat" style="width:auto;min-width:160px">
                        <option value="standard">标准 (带连字符)</option>
                        <option value="nohyphen">无连字符</option>
                        <option value="upper">大写</option>
                        <option value="braces">带花括号</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="uuidGenerate">🎲 生成</button>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">生成结果</div>
            <div class="copy-wrap">
                <button class="copy-btn" id="uuidCopy">复制全部</button>
                <div class="output-area" id="uuidOutput" style="min-height:40px"></div>
            </div>
        </div>
    `;

    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    function formatUUID(uuid, format) {
        switch (format) {
            case 'nohyphen': return uuid.replace(/-/g, '');
            case 'upper': return uuid.toUpperCase();
            case 'braces': return '{' + uuid + '}';
            default: return uuid;
        }
    }

    document.getElementById('uuidGenerate').addEventListener('click', () => {
        const count = Math.min(parseInt(document.getElementById('uuidCount').value) || 1, 100);
        const format = document.getElementById('uuidFormat').value;
        const uuids = [];
        for (let i = 0; i < count; i++) {
            uuids.push(formatUUID(generateUUID(), format));
        }
        document.getElementById('uuidOutput').textContent = uuids.join('\n');
    });

    document.getElementById('uuidCopy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('uuidOutput').textContent, this);
    });

    // Generate one on init
    document.getElementById('uuidOutput').textContent = generateUUID();
}
