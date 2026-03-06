/**
 * Box Shadow Generator Tool
 * Visual CSS box-shadow editor with live preview.
 */
function initTool_shadow_generator(container) {
    const body = createToolLayout(container, 'CSS 阴影生成器', '可视化调节 box-shadow 参数，实时预览');
    body.innerHTML = `
        <div class="split-pane">
            <div class="panel">
                <div class="panel-title">预览</div>
                <div style="display:flex;align-items:center;justify-content:center;min-height:250px;background:var(--bg-tertiary);border-radius:var(--radius-md);padding:40px">
                    <div id="sgPreviewBox" style="width:160px;height:160px;background:var(--bg-card);border-radius:16px;transition:box-shadow 0.2s"></div>
                </div>
            </div>
            <div class="panel">
                <div class="panel-title">设置</div>
                <div style="display:flex;flex-direction:column;gap:14px">
                    <div>
                        <label>水平偏移 (X): <strong id="sgXVal">5</strong>px</label>
                        <input type="range" id="sgX" min="-50" max="50" value="5">
                    </div>
                    <div>
                        <label>垂直偏移 (Y): <strong id="sgYVal">5</strong>px</label>
                        <input type="range" id="sgY" min="-50" max="50" value="5">
                    </div>
                    <div>
                        <label>模糊半径: <strong id="sgBlurVal">15</strong>px</label>
                        <input type="range" id="sgBlur" min="0" max="100" value="15">
                    </div>
                    <div>
                        <label>扩展半径: <strong id="sgSpreadVal">0</strong>px</label>
                        <input type="range" id="sgSpread" min="-50" max="50" value="0">
                    </div>
                    <div style="display:flex;gap:16px;align-items:center">
                        <div>
                            <label>颜色</label>
                            <input type="color" id="sgColor" value="#000000" style="width:50px;height:30px;border:none;cursor:pointer;background:transparent">
                        </div>
                        <div>
                            <label>透明度: <strong id="sgAlphaVal">30</strong>%</label>
                            <input type="range" id="sgAlpha" min="0" max="100" value="30" style="width:120px">
                        </div>
                    </div>
                    <div class="toggle-row">
                        <label class="toggle">
                            <input type="checkbox" id="sgInset">
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="toggle-label">内阴影 (inset)</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">CSS 代码</div>
            <div class="copy-wrap">
                <button class="copy-btn" id="sgCopy">复制</button>
                <div class="output-area" id="sgCode" style="min-height:auto;padding:12px"></div>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">预设</div>
            <div class="btn-group" id="sgPresets"></div>
        </div>
    `;

    const presets = [
        { name: '柔和', x: 0, y: 4, blur: 15, spread: 0, color: '#000000', alpha: 15, inset: false },
        { name: '深沉', x: 0, y: 10, blur: 30, spread: -5, color: '#000000', alpha: 40, inset: false },
        { name: '上浮', x: 0, y: 20, blur: 40, spread: -10, color: '#000000', alpha: 25, inset: false },
        { name: '发光', x: 0, y: 0, blur: 20, spread: 5, color: '#7c5cfc', alpha: 50, inset: false },
        { name: '内凹', x: 0, y: 4, blur: 10, spread: 0, color: '#000000', alpha: 30, inset: true },
        { name: '锐利', x: 5, y: 5, blur: 0, spread: 0, color: '#000000', alpha: 25, inset: false },
    ];

    const presetsEl = document.getElementById('sgPresets');
    presets.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-secondary';
        btn.textContent = p.name;
        btn.addEventListener('click', () => {
            document.getElementById('sgX').value = p.x;
            document.getElementById('sgY').value = p.y;
            document.getElementById('sgBlur').value = p.blur;
            document.getElementById('sgSpread').value = p.spread;
            document.getElementById('sgColor').value = p.color;
            document.getElementById('sgAlpha').value = p.alpha;
            document.getElementById('sgInset').checked = p.inset;
            updateShadow();
        });
        presetsEl.appendChild(btn);
    });

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${(alpha / 100).toFixed(2)})`;
    }

    function updateShadow() {
        const x = document.getElementById('sgX').value;
        const y = document.getElementById('sgY').value;
        const blur = document.getElementById('sgBlur').value;
        const spread = document.getElementById('sgSpread').value;
        const color = document.getElementById('sgColor').value;
        const alpha = document.getElementById('sgAlpha').value;
        const inset = document.getElementById('sgInset').checked;

        document.getElementById('sgXVal').textContent = x;
        document.getElementById('sgYVal').textContent = y;
        document.getElementById('sgBlurVal').textContent = blur;
        document.getElementById('sgSpreadVal').textContent = spread;
        document.getElementById('sgAlphaVal').textContent = alpha;

        const rgba = hexToRgba(color, alpha);
        const shadow = `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px ${rgba}`;
        document.getElementById('sgPreviewBox').style.boxShadow = shadow;
        document.getElementById('sgCode').textContent = `box-shadow: ${shadow};`;
    }

    ['sgX', 'sgY', 'sgBlur', 'sgSpread', 'sgColor', 'sgAlpha', 'sgInset'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateShadow);
        document.getElementById(id).addEventListener('change', updateShadow);
    });

    document.getElementById('sgCopy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('sgCode').textContent, this);
    });

    updateShadow();
}
