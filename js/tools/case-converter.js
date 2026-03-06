/**
 * Case Converter Tool
 * Convert text between camelCase, snake_case, PascalCase, UPPER_CASE, kebab-case, etc.
 */
function initTool_case_converter(container) {
    const body = createToolLayout(container, '大小写 / 命名转换', 'camelCase、snake_case、PascalCase 等命名风格互转');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">输入文本</div>
            <textarea id="ccInput" rows="3" placeholder="输入变量名或文本，如 hello world 或 helloWorld">hello world example text</textarea>
            <button class="btn btn-primary" style="margin-top:12px" id="ccConvert">转换</button>
        </div>
        <div class="panel">
            <div class="panel-title">转换结果</div>
            <div id="ccResults" style="display:flex;flex-direction:column;gap:12px"></div>
        </div>
    `;

    function splitWords(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[_\-./]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase()
            .split(' ')
            .filter(w => w.length > 0);
    }

    const conversions = [
        { name: 'camelCase',       fn: words => words[0] + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1)).join('') },
        { name: 'PascalCase',      fn: words => words.map(w => w[0].toUpperCase() + w.slice(1)).join('') },
        { name: 'snake_case',      fn: words => words.join('_') },
        { name: 'UPPER_SNAKE_CASE', fn: words => words.map(w => w.toUpperCase()).join('_') },
        { name: 'kebab-case',      fn: words => words.join('-') },
        { name: 'dot.case',        fn: words => words.join('.') },
        { name: 'path/case',       fn: words => words.join('/') },
        { name: 'UPPER CASE',      fn: words => words.map(w => w.toUpperCase()).join(' ') },
        { name: 'lower case',      fn: words => words.join(' ') },
        { name: 'Title Case',      fn: words => words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ') },
        { name: 'Sentence case',   fn: words => words[0][0].toUpperCase() + words[0].slice(1) + ' ' + words.slice(1).join(' ') },
    ];

    document.getElementById('ccConvert').addEventListener('click', () => {
        const text = document.getElementById('ccInput').value.trim();
        const words = splitWords(text);
        if (words.length === 0) return;

        document.getElementById('ccResults').innerHTML = conversions.map(c => {
            const result = c.fn(words);
            return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-input);border:1px solid var(--border-color);border-radius:var(--radius-md)">
                <div>
                    <span style="font-size:0.75rem;color:var(--text-muted);display:block">${c.name}</span>
                    <span style="font-family:var(--font-mono);font-size:0.9rem">${escapeHtml(result)}</span>
                </div>
                <button class="btn btn-sm btn-secondary cc-result-copy" data-val="${escapeHtml(result)}">复制</button>
            </div>`;
        }).join('');

        document.querySelectorAll('.cc-result-copy').forEach(btn => {
            btn.addEventListener('click', function() { copyToClipboard(this.dataset.val, this); });
        });
    });
}
