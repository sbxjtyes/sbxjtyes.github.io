/**
 * Code Formatter Tool
 * Beautify HTML, CSS, and JavaScript code using js-beautify.
 */
function initTool_code_formatter(container) {
    const body = createToolLayout(container, '代码格式化', 'HTML / CSS / JavaScript 代码美化');
    body.innerHTML = `
        <div class="panel">
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
                <label style="margin-bottom:0">语言</label>
                <select id="codeLang" style="width:auto;min-width:140px">
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="js" selected>JavaScript</option>
                </select>
                <label style="margin-bottom:0">缩进</label>
                <select id="codeIndent" style="width:auto;min-width:120px">
                    <option value="2">2 空格</option>
                    <option value="4">4 空格</option>
                    <option value="\t">Tab</option>
                </select>
            </div>
            <textarea id="codeInput" rows="12" placeholder="粘贴代码..."></textarea>
            <div class="btn-group" style="margin-top:12px">
                <button class="btn btn-primary" id="codeFormat">格式化</button>
                <button class="btn btn-secondary" id="codeClear">清空</button>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">格式化结果</div>
            <div class="copy-wrap">
                <button class="copy-btn" id="codeCopy">复制</button>
                <pre class="output-area" id="codeOutput" style="min-height:200px"></pre>
            </div>
        </div>
    `;

    document.getElementById('codeFormat').addEventListener('click', () => {
        const lang = document.getElementById('codeLang').value;
        const code = document.getElementById('codeInput').value;
        const indentVal = document.getElementById('codeIndent').value;
        const output = document.getElementById('codeOutput');
        const opts = {
            indent_size: indentVal === '\\t' ? 1 : Number(indentVal),
            indent_char: indentVal === '\\t' ? '\t' : ' ',
            max_preserve_newlines: 2,
            end_with_newline: true
        };

        try {
            let result = '';
            if (lang === 'html' && typeof html_beautify !== 'undefined') {
                result = html_beautify(code, opts);
            } else if (lang === 'css' && typeof css_beautify !== 'undefined') {
                result = css_beautify(code, opts);
            } else if (typeof js_beautify !== 'undefined') {
                result = js_beautify(code, opts);
            } else {
                result = code;
                showToast('⚠️ js-beautify 库未加载');
            }
            output.textContent = result;
        } catch (e) {
            output.textContent = '格式化失败: ' + e.message;
        }
    });

    document.getElementById('codeClear').addEventListener('click', () => {
        document.getElementById('codeInput').value = '';
        document.getElementById('codeOutput').textContent = '';
    });

    document.getElementById('codeCopy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('codeOutput').textContent, this);
    });
}
