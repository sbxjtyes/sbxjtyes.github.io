/**
 * Placeholder Image Generator Tool
 * Generate placeholder images of any size with custom text and colors.
 */
function initTool_placeholder_img(container) {
    const body = createToolLayout(container, '占位图生成器', '生成指定尺寸的占位图片，支持自定义文字和颜色');
    body.innerHTML = `
        <div class="panel">
            <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:end">
                <div>
                    <label>宽度 (px)</label>
                    <input type="number" id="piWidth" value="400" min="10" max="2000" style="width:100px">
                </div>
                <div>
                    <label>高度 (px)</label>
                    <input type="number" id="piHeight" value="300" min="10" max="2000" style="width:100px">
                </div>
                <div>
                    <label>背景色</label>
                    <input type="color" id="piBg" value="#2d333b" style="width:50px;height:30px;border:none;cursor:pointer;background:transparent">
                </div>
                <div>
                    <label>文字颜色</label>
                    <input type="color" id="piText" value="#8b949e" style="width:50px;height:30px;border:none;cursor:pointer;background:transparent">
                </div>
                <div style="flex:1;min-width:150px">
                    <label>显示文字（空为尺寸）</label>
                    <input type="text" id="piLabel" placeholder="留空则显示尺寸">
                </div>
            </div>
            <div class="btn-group" style="margin-top:16px">
                <button class="btn btn-primary" id="piGenerate">生成图片</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('piWidth').value=800;document.getElementById('piHeight').value=600">800×600</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('piWidth').value=1920;document.getElementById('piHeight').value=1080">1920×1080</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('piWidth').value=375;document.getElementById('piHeight').value=667">iPhone</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('piWidth').value=100;document.getElementById('piHeight').value=100">头像</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('piWidth').value=1200;document.getElementById('piHeight').value=630">OG Image</button>
            </div>
        </div>
        <div class="panel" style="text-align:center">
            <div class="panel-title">预览</div>
            <canvas id="piCanvas" style="max-width:100%;border-radius:var(--radius-md);border:1px solid var(--border-color)"></canvas>
            <div class="btn-group" style="margin-top:16px;justify-content:center">
                <button class="btn btn-primary" id="piDownloadPng">📥 下载 PNG</button>
                <button class="btn btn-secondary" id="piCopyDataUrl">复制 Data URL</button>
            </div>
        </div>
    `;

    function generate() {
        const w = parseInt(document.getElementById('piWidth').value) || 400;
        const h = parseInt(document.getElementById('piHeight').value) || 300;
        const bg = document.getElementById('piBg').value;
        const textColor = document.getElementById('piText').value;
        const label = document.getElementById('piLabel').value || `${w} × ${h}`;

        const canvas = document.getElementById('piCanvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Cross lines
        ctx.strokeStyle = textColor + '30';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(w, h);
        ctx.moveTo(w, 0); ctx.lineTo(0, h);
        ctx.stroke();

        // Text
        const fontSize = Math.max(12, Math.min(w, h) / 8);
        ctx.font = `500 ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, w / 2, h / 2);

        // Size label at bottom
        if (label !== `${w} × ${h}`) {
            ctx.font = `400 ${fontSize * 0.4}px Inter, sans-serif`;
            ctx.fillStyle = textColor + '80';
            ctx.fillText(`${w} × ${h}`, w / 2, h / 2 + fontSize * 0.8);
        }
    }

    document.getElementById('piGenerate').addEventListener('click', generate);

    document.getElementById('piDownloadPng').addEventListener('click', () => {
        const canvas = document.getElementById('piCanvas');
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        const w = canvas.width, h = canvas.height;
        a.download = `placeholder_${w}x${h}.png`;
        a.click();
    });

    document.getElementById('piCopyDataUrl').addEventListener('click', function () {
        const dataUrl = document.getElementById('piCanvas').toDataURL('image/png');
        copyToClipboard(dataUrl, this);
    });

    generate();
}
