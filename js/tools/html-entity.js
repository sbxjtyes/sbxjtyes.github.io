/**
 * HTML Entity Encoder/Decoder Tool
 * Encode and decode HTML entities.
 */
function initTool_html_entity(container) {
    const body = createToolLayout(container, 'HTML 实体转义', 'HTML 特殊字符编码与解码');
    body.innerHTML = `
        <div class="split-pane">
            <div class="panel">
                <div class="panel-title">原始文本</div>
                <textarea id="heText" rows="6" placeholder='<div class="hello">你好 & "世界"</div>'></textarea>
                <button class="btn btn-primary" style="margin-top:12px" id="heEncode">编码 →</button>
            </div>
            <div class="panel">
                <div class="panel-title">转义结果</div>
                <div class="copy-wrap">
                    <button class="copy-btn" id="heCopy">复制</button>
                    <textarea id="heResult" rows="6" placeholder="&amp;lt;div&amp;gt;..."></textarea>
                </div>
                <button class="btn btn-primary" style="margin-top:12px" id="heDecode">← 解码</button>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">常用 HTML 实体参考</div>
            <div id="heRef" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;font-size:0.82rem;font-family:var(--font-mono)"></div>
        </div>
    `;

    const ENTITIES = [
        ['&', '&amp;amp;', 'ampersand'],
        ['<', '&amp;lt;', 'less than'],
        ['>', '&amp;gt;', 'greater than'],
        ['"', '&amp;quot;', 'double quote'],
        ["'", '&amp;apos;', 'apostrophe'],
        ['©', '&amp;copy;', 'copyright'],
        ['®', '&amp;reg;', 'registered'],
        ['™', '&amp;trade;', 'trademark'],
        ['€', '&amp;euro;', 'euro'],
        ['£', '&amp;pound;', 'pound'],
        ['¥', '&amp;yen;', 'yen'],
        ['°', '&amp;deg;', 'degree'],
        ['±', '&amp;plusmn;', 'plus-minus'],
        ['×', '&amp;times;', 'multiply'],
        ['÷', '&amp;divide;', 'divide'],
        ['·', '&amp;middot;', 'middle dot'],
    ];

    document.getElementById('heRef').innerHTML = ENTITIES.map(([char, entity, name]) =>
        `<div style="padding:4px 8px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-sm)">
            <span style="color:var(--accent-primary)">${char}</span> = <span style="color:var(--text-secondary)">${entity}</span>
        </div>`
    ).join('');

    document.getElementById('heEncode').addEventListener('click', () => {
        const text = document.getElementById('heText').value;
        const encoded = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        document.getElementById('heResult').value = encoded;
    });

    document.getElementById('heDecode').addEventListener('click', () => {
        const text = document.getElementById('heResult').value;
        const el = document.createElement('textarea');
        el.innerHTML = text;
        document.getElementById('heText').value = el.value;
    });

    document.getElementById('heCopy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('heResult').value, this);
    });
}
