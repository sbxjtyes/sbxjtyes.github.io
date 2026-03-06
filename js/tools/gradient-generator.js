/**
 * CSS Gradient Generator Tool
 * Visual CSS gradient editor with live preview and code output.
 */
function initTool_gradient_generator(container) {
    const body = createToolLayout(container, 'CSS 渐变生成器', '可视化调节方向、颜色，实时预览 + 代码复制');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">渐变预览</div>
            <div class="gradient-preview" id="ggPreview" style="height:150px"></div>
        </div>
        <div class="panel">
            <div class="panel-title">设置</div>
            <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:end">
                <div>
                    <label>类型</label>
                    <select id="ggType" style="width:auto;min-width:130px">
                        <option value="linear">线性渐变</option>
                        <option value="radial">径向渐变</option>
                    </select>
                </div>
                <div id="ggAngleWrap">
                    <label>角度: <span id="ggAngleVal">135</span>°</label>
                    <input type="range" id="ggAngle" min="0" max="360" value="135" style="width:200px">
                </div>
                <div>
                    <label>颜色 1</label>
                    <input type="color" id="ggColor1" value="#7c5cfc" style="width:50px;height:32px;border:none;cursor:pointer;background:transparent">
                </div>
                <div>
                    <label>颜色 2</label>
                    <input type="color" id="ggColor2" value="#58a6ff" style="width:50px;height:32px;border:none;cursor:pointer;background:transparent">
                </div>
                <div>
                    <label>颜色 3 (可选)</label>
                    <input type="color" id="ggColor3" value="#3fb950" style="width:50px;height:32px;border:none;cursor:pointer;background:transparent">
                    <label class="checkbox-row" style="margin-top:4px">
                        <input type="checkbox" id="ggUse3"> 启用
                    </label>
                </div>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">CSS 代码</div>
            <div class="copy-wrap">
                <button class="copy-btn" id="ggCopy">复制</button>
                <div class="output-area" id="ggCode" style="min-height:40px"></div>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">预设模板</div>
            <div class="btn-group" id="ggPresets"></div>
        </div>
    `;

    const presets = [
        { name: '紫蓝', c1: '#7c5cfc', c2: '#58a6ff', angle: 135 },
        { name: '日落', c1: '#f093fb', c2: '#f5576c', angle: 135 },
        { name: '海洋', c1: '#667eea', c2: '#764ba2', angle: 135 },
        { name: '极光', c1: '#43e97b', c2: '#38f9d7', angle: 135 },
        { name: '火焰', c1: '#f83600', c2: '#f9d423', angle: 135 },
        { name: '星空', c1: '#0c0d1a', c2: '#3a1c71', angle: 135 },
        { name: '薄荷', c1: '#0ba360', c2: '#3cba92', angle: 135 },
        { name: '柔粉', c1: '#fbc2eb', c2: '#a6c1ee', angle: 135 },
    ];

    const presetsEl = document.getElementById('ggPresets');
    presets.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-secondary';
        btn.textContent = p.name;
        btn.style.background = `linear-gradient(135deg, ${p.c1}, ${p.c2})`;
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.addEventListener('click', () => {
            document.getElementById('ggColor1').value = p.c1;
            document.getElementById('ggColor2').value = p.c2;
            document.getElementById('ggAngle').value = p.angle;
            document.getElementById('ggUse3').checked = false;
            updateGradient();
        });
        presetsEl.appendChild(btn);
    });

    function updateGradient() {
        const type = document.getElementById('ggType').value;
        const angle = document.getElementById('ggAngle').value;
        const c1 = document.getElementById('ggColor1').value;
        const c2 = document.getElementById('ggColor2').value;
        const c3 = document.getElementById('ggColor3').value;
        const use3 = document.getElementById('ggUse3').checked;

        document.getElementById('ggAngleVal').textContent = angle;
        document.getElementById('ggAngleWrap').style.display = type === 'linear' ? '' : 'none';

        const colors = use3 ? `${c1}, ${c3}, ${c2}` : `${c1}, ${c2}`;
        let css;

        if (type === 'linear') {
            css = `linear-gradient(${angle}deg, ${colors})`;
        } else {
            css = `radial-gradient(circle, ${colors})`;
        }

        document.getElementById('ggPreview').style.background = css;
        document.getElementById('ggCode').textContent = `background: ${css};`;
    }

    ['ggType', 'ggAngle', 'ggColor1', 'ggColor2', 'ggColor3', 'ggUse3'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateGradient);
        document.getElementById(id).addEventListener('change', updateGradient);
    });

    document.getElementById('ggCopy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('ggCode').textContent, this);
    });

    updateGradient();
}
