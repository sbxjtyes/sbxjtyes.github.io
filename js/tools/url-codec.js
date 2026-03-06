/**
 * URL Encoder/Decoder Tool
 * Encode and decode URL components.
 */
function initTool_url_codec(container) {
    const body = createToolLayout(container, 'URL 编码 / 解码', 'URL 特殊字符编码与解码');
    body.innerHTML = `
        <div class="split-pane">
            <div class="panel">
                <div class="panel-title">原始文本</div>
                <textarea id="urlText" rows="6" placeholder="输入文本或 URL..."></textarea>
                <div class="btn-group" style="margin-top:12px">
                    <button class="btn btn-primary" id="urlEncode">编码 →</button>
                    <button class="btn btn-secondary" id="urlEncodeAll">完整编码 →</button>
                </div>
            </div>
            <div class="panel">
                <div class="panel-title">编码结果</div>
                <div class="copy-wrap">
                    <button class="copy-btn" id="urlCopy">复制</button>
                    <textarea id="urlResult" rows="6" placeholder="编码结果..."></textarea>
                </div>
                <button class="btn btn-primary" style="margin-top:12px" id="urlDecode">← 解码</button>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">说明</div>
            <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6">
                <strong>编码</strong>：使用 encodeURIComponent，保留字母、数字及 <code>- _ . ! ~ * ' ( )</code><br>
                <strong>完整编码</strong>：使用 encodeURI，保留 URL 结构字符（<code>: / ? # [ ] @</code> 等）<br>
                <strong>解码</strong>：自动检测使用 decodeURIComponent 解码
            </p>
        </div>
    `;

    document.getElementById('urlEncode').addEventListener('click', () => {
        document.getElementById('urlResult').value = encodeURIComponent(document.getElementById('urlText').value);
    });

    document.getElementById('urlEncodeAll').addEventListener('click', () => {
        document.getElementById('urlResult').value = encodeURI(document.getElementById('urlText').value);
    });

    document.getElementById('urlDecode').addEventListener('click', () => {
        try {
            document.getElementById('urlText').value = decodeURIComponent(document.getElementById('urlResult').value);
        } catch (e) {
            showToast('❌ 解码失败: 无效的编码字符串');
        }
    });

    document.getElementById('urlCopy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('urlResult').value, this);
    });
}
