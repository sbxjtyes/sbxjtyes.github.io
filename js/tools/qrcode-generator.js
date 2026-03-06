/**
 * QR Code Generator Tool
 * Generate QR codes from text/URL using qrcode.js.
 */
function initTool_qrcode_generator(container) {
    const body = createToolLayout(container, '二维码生成器', '输入文本或 URL，生成可下载的二维码');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">输入内容</div>
            <textarea id="qrInput" rows="3" placeholder="输入文本或 URL...">https://sbxjtyes.github.io</textarea>
            <div style="display:flex;gap:16px;align-items:center;margin-top:12px">
                <div>
                    <label>尺寸</label>
                    <select id="qrSize" style="width:auto;min-width:100px">
                        <option value="128">128 × 128</option>
                        <option value="200" selected>200 × 200</option>
                        <option value="300">300 × 300</option>
                        <option value="400">400 × 400</option>
                    </select>
                </div>
                <div>
                    <label>前景色</label>
                    <input type="color" id="qrFg" value="#000000" style="width:40px;height:30px;border:none;cursor:pointer;background:transparent">
                </div>
                <div>
                    <label>背景色</label>
                    <input type="color" id="qrBg" value="#ffffff" style="width:40px;height:30px;border:none;cursor:pointer;background:transparent">
                </div>
            </div>
            <button class="btn btn-primary" style="margin-top:12px" id="qrGenerate">生成二维码</button>
        </div>
        <div class="panel" style="text-align:center">
            <div class="panel-title">二维码</div>
            <div id="qrContainer" style="display:inline-block;padding:16px;background:#fff;border-radius:var(--radius-md);margin-bottom:12px"></div>
            <div>
                <button class="btn btn-secondary" id="qrDownload" style="display:none">📥 下载 PNG</button>
            </div>
        </div>
    `;

    let qrInstance = null;

    document.getElementById('qrGenerate').addEventListener('click', () => {
        const text = document.getElementById('qrInput').value.trim();
        if (!text) { showToast('请输入内容'); return; }

        const size = parseInt(document.getElementById('qrSize').value);
        const fg = document.getElementById('qrFg').value;
        const bg = document.getElementById('qrBg').value;
        const qrContainer = document.getElementById('qrContainer');

        qrContainer.innerHTML = '';

        if (typeof QRCode === 'undefined') {
            qrContainer.textContent = 'QRCode 库未加载';
            return;
        }

        qrInstance = new QRCode(qrContainer, {
            text: text,
            width: size,
            height: size,
            colorDark: fg,
            colorLight: bg,
            correctLevel: QRCode.CorrectLevel.M
        });

        document.getElementById('qrDownload').style.display = 'inline-flex';
    });

    document.getElementById('qrDownload').addEventListener('click', () => {
        const canvas = document.querySelector('#qrContainer canvas');
        if (!canvas) {
            const img = document.querySelector('#qrContainer img');
            if (img) {
                const a = document.createElement('a');
                a.href = img.src;
                a.download = 'qrcode.png';
                a.click();
            }
            return;
        }
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'qrcode.png';
        a.click();
    });
}
