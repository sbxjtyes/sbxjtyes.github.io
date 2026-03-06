/**
 * JSON Formatter Tool
 * Format, compress, and validate JSON with syntax highlighting.
 */
function initTool_json_formatter(container) {
    const body = createToolLayout(container, 'JSON 格式化', 'JSON 格式化、压缩与语法验证');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">输入 JSON</div>
            <textarea id="jsonInput" placeholder='粘贴 JSON，例如: {"name":"DevToolbox","version":1}' rows="10"></textarea>
            <div class="btn-group" style="margin-top:12px">
                <button class="btn btn-primary" id="jsonFormat">格式化</button>
                <button class="btn btn-secondary" id="jsonCompress">压缩</button>
                <button class="btn btn-secondary" id="jsonClear">清空</button>
                <select id="jsonIndent" style="width:auto;min-width:100px">
                    <option value="2">缩进 2 空格</option>
                    <option value="4">缩进 4 空格</option>
                    <option value="\t">缩进 Tab</option>
                </select>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">输出结果</div>
            <div class="copy-wrap">
                <button class="copy-btn" id="jsonCopy">复制</button>
                <pre class="output-area" id="jsonOutput"></pre>
            </div>
            <p id="jsonError" style="color:var(--danger);font-size:0.85rem;margin-top:8px;display:none"></p>
        </div>
    `;

    const input = document.getElementById('jsonInput');
    const output = document.getElementById('jsonOutput');
    const error = document.getElementById('jsonError');
    const indent = document.getElementById('jsonIndent');

    function formatJson() {
        error.style.display = 'none';
        const val = input.value.trim();
        if (!val) { output.textContent = ''; return; }
        try {
            const parsed = JSON.parse(val);
            const indentVal = indent.value === '\\t' ? '\t' : Number(indent.value);
            output.textContent = JSON.stringify(parsed, null, indentVal);
        } catch (e) {
            error.textContent = '❌ JSON 语法错误: ' + e.message;
            error.style.display = 'block';
        }
    }

    function compressJson() {
        error.style.display = 'none';
        const val = input.value.trim();
        if (!val) { output.textContent = ''; return; }
        try {
            output.textContent = JSON.stringify(JSON.parse(val));
        } catch (e) {
            error.textContent = '❌ JSON 语法错误: ' + e.message;
            error.style.display = 'block';
        }
    }

    document.getElementById('jsonFormat').addEventListener('click', formatJson);
    document.getElementById('jsonCompress').addEventListener('click', compressJson);
    document.getElementById('jsonClear').addEventListener('click', () => { input.value = ''; output.textContent = ''; error.style.display = 'none'; });
    document.getElementById('jsonCopy').addEventListener('click', function () { copyToClipboard(output.textContent, this); });
}
