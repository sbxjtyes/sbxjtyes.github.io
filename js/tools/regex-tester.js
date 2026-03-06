/**
 * Regex Tester Tool
 * Real-time regex matching with highlight and capture groups.
 */
function initTool_regex_tester(container) {
    const body = createToolLayout(container, '正则表达式测试', '实时匹配测试、捕获组显示、常用模板');
    body.innerHTML = `
        <div class="panel">
            <label>正则表达式</label>
            <div style="display:flex;gap:8px;align-items:center">
                <span style="color:var(--accent-primary);font-family:var(--font-mono)">/</span>
                <input type="text" id="regexPattern" placeholder="输入正则表达式" style="flex:1">
                <span style="color:var(--accent-primary);font-family:var(--font-mono)">/</span>
                <input type="text" id="regexFlags" value="gi" style="width:60px;text-align:center">
            </div>
            <div class="btn-group" style="margin-top:12px">
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('regexPattern').value='[\\\\w.+-]+@[\\\\w-]+\\\\.[\\\\w.]+';document.getElementById('regexPattern').dispatchEvent(new Event('input'))">邮箱</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('regexPattern').value='1[3-9]\\\\d{9}';document.getElementById('regexPattern').dispatchEvent(new Event('input'))">手机号</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('regexPattern').value='https?://[\\\\w\\\\-._~:/?#\\\\[\\\\]@!$&\\'()*+,;=%]+';document.getElementById('regexPattern').dispatchEvent(new Event('input'))">URL</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('regexPattern').value='\\\\b\\\\d{1,3}(\\\\.\\\\d{1,3}){3}\\\\b';document.getElementById('regexPattern').dispatchEvent(new Event('input'))">IP 地址</button>
            </div>
        </div>
        <div class="panel">
            <label>测试文本</label>
            <textarea id="regexInput" placeholder="输入要测试的文本" rows="6"></textarea>
        </div>
        <div class="panel">
            <div class="panel-title">匹配结果</div>
            <div id="regexResult" class="output-area" style="min-height:60px"></div>
            <div id="regexGroups" style="margin-top:12px"></div>
        </div>
    `;

    const patternEl = document.getElementById('regexPattern');
    const flagsEl = document.getElementById('regexFlags');
    const inputEl = document.getElementById('regexInput');
    const resultEl = document.getElementById('regexResult');
    const groupsEl = document.getElementById('regexGroups');

    function runRegex() {
        const pattern = patternEl.value;
        const flags = flagsEl.value;
        const text = inputEl.value;

        if (!pattern || !text) {
            resultEl.innerHTML = '';
            groupsEl.innerHTML = '';
            return;
        }

        try {
            const regex = new RegExp(pattern, flags);
            let highlighted = '';
            let lastIndex = 0;
            let matchCount = 0;
            const groups = [];
            let match;

            // Reset regex
            regex.lastIndex = 0;

            if (flags.includes('g')) {
                while ((match = regex.exec(text)) !== null) {
                    matchCount++;
                    highlighted += escapeHtml(text.slice(lastIndex, match.index));
                    highlighted += '<span class="regex-match">' + escapeHtml(match[0]) + '</span>';
                    lastIndex = match.index + match[0].length;
                    if (match.length > 1) {
                        groups.push({ index: matchCount, captures: match.slice(1) });
                    }
                    if (match[0].length === 0) { regex.lastIndex++; }
                }
            } else {
                match = regex.exec(text);
                if (match) {
                    matchCount = 1;
                    highlighted += escapeHtml(text.slice(0, match.index));
                    highlighted += '<span class="regex-match">' + escapeHtml(match[0]) + '</span>';
                    lastIndex = match.index + match[0].length;
                    if (match.length > 1) {
                        groups.push({ index: 1, captures: match.slice(1) });
                    }
                }
            }

            highlighted += escapeHtml(text.slice(lastIndex));
            resultEl.innerHTML = highlighted || '<span style="color:var(--text-muted)">无匹配</span>';
            resultEl.insertAdjacentHTML('afterbegin',
                `<div style="margin-bottom:8px;font-size:0.8rem;color:var(--text-muted)">共 ${matchCount} 个匹配</div>`);

            if (groups.length > 0) {
                groupsEl.innerHTML = '<div class="panel-title">捕获组</div>' + groups.map(g =>
                    `<div style="font-size:0.85rem;margin-bottom:4px;font-family:var(--font-mono)">` +
                    `匹配 #${g.index}: ` + g.captures.map((c, i) => `<span style="color:var(--accent-secondary)">$${i + 1}="${escapeHtml(c || '')}"</span>`).join(' ') +
                    `</div>`
                ).join('');
            } else {
                groupsEl.innerHTML = '';
            }
        } catch (e) {
            resultEl.innerHTML = `<span style="color:var(--danger)">正则语法错误: ${escapeHtml(e.message)}</span>`;
            groupsEl.innerHTML = '';
        }
    }

    patternEl.addEventListener('input', runRegex);
    flagsEl.addEventListener('input', runRegex);
    inputEl.addEventListener('input', runRegex);
}
