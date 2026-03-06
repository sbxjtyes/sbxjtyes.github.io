/**
 * Base64 Encoder/Decoder Tool
 * Encode text to Base64 and decode Base64 to text.
 */
function initTool_base64(container) {
    const body = createToolLayout(container, 'Base64 编码 / 解码', '文本与 Base64 互转');
    body.innerHTML = `
        <div class="split-pane">
            <div class="panel">
                <div class="panel-title">文本</div>
                <textarea id="b64Text" rows="8" placeholder="输入文本..."></textarea>
                <button class="btn btn-primary" style="margin-top:12px" id="b64Encode">编码 →</button>
            </div>
            <div class="panel">
                <div class="panel-title">Base64</div>
                <div class="copy-wrap">
                    <button class="copy-btn" id="b64Copy">复制</button>
                    <textarea id="b64Result" rows="8" placeholder="Base64 结果..."></textarea>
                </div>
                <button class="btn btn-primary" style="margin-top:12px" id="b64Decode">← 解码</button>
            </div>
        </div>
    `;

    document.getElementById('b64Encode').addEventListener('click', () => {
        try {
            const text = document.getElementById('b64Text').value;
            document.getElementById('b64Result').value = btoa(unescape(encodeURIComponent(text)));
        } catch (e) {
            showToast('❌ 编码失败: ' + e.message);
        }
    });

    document.getElementById('b64Decode').addEventListener('click', () => {
        try {
            const b64 = document.getElementById('b64Result').value;
            document.getElementById('b64Text').value = decodeURIComponent(escape(atob(b64)));
        } catch (e) {
            showToast('❌ 解码失败: 无效的 Base64 字符串');
        }
    });

    document.getElementById('b64Copy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('b64Result').value, this);
    });
}
