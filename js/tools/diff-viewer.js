/**
 * Diff Viewer Tool
 * Side-by-side text comparison with line-by-line diff highlighting.
 */
function initTool_diff_viewer(container) {
    const body = createToolLayout(container, 'Diff 对比', '对比两段文本，逐行高亮差异');
    body.innerHTML = `
        <div class="split-pane">
            <div class="panel">
                <div class="panel-title">原始文本</div>
                <textarea id="diffOld" rows="12" placeholder="粘贴原始文本..."></textarea>
            </div>
            <div class="panel">
                <div class="panel-title">修改后文本</div>
                <textarea id="diffNew" rows="12" placeholder="粘贴修改后文本..."></textarea>
            </div>
        </div>
        <div class="btn-group">
            <button class="btn btn-primary" id="diffCompare">对比差异</button>
            <button class="btn btn-secondary" id="diffClear">清空</button>
        </div>
        <div class="panel diff-output" id="diffResult">
            <div class="panel-title">差异结果</div>
            <div id="diffOutput" class="output-area" style="white-space:normal;font-family:var(--font-sans)"></div>
        </div>
    `;

    function computeDiff() {
        const oldText = document.getElementById('diffOld').value;
        const newText = document.getElementById('diffNew').value;
        const output = document.getElementById('diffOutput');

        if (!oldText && !newText) { output.innerHTML = ''; return; }

        const oldLines = oldText.split('\n');
        const newLines = newText.split('\n');
        const maxLen = Math.max(oldLines.length, newLines.length);
        let html = '<table style="width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:0.85rem">';

        for (let i = 0; i < maxLen; i++) {
            const oldLine = i < oldLines.length ? oldLines[i] : undefined;
            const newLine = i < newLines.length ? newLines[i] : undefined;

            if (oldLine === newLine) {
                html += `<tr>
                    <td style="color:var(--text-muted);padding:2px 8px;text-align:right;user-select:none;width:30px">${i + 1}</td>
                    <td style="padding:2px 8px">${escapeHtml(oldLine)}</td>
                </tr>`;
            } else {
                if (oldLine !== undefined) {
                    html += `<tr style="background:rgba(248,81,73,0.1)">
                        <td style="color:var(--danger);padding:2px 8px;text-align:right;user-select:none;width:30px">-</td>
                        <td style="padding:2px 8px;color:var(--danger)">${escapeHtml(oldLine)}</td>
                    </tr>`;
                }
                if (newLine !== undefined) {
                    html += `<tr style="background:rgba(63,185,80,0.1)">
                        <td style="color:var(--success);padding:2px 8px;text-align:right;user-select:none;width:30px">+</td>
                        <td style="padding:2px 8px;color:var(--success)">${escapeHtml(newLine)}</td>
                    </tr>`;
                }
            }
        }

        html += '</table>';

        const added = newLines.filter((l, i) => i >= oldLines.length || l !== oldLines[i]).length;
        const removed = oldLines.filter((l, i) => i >= newLines.length || l !== newLines[i]).length;
        output.innerHTML = `<div style="margin-bottom:12px;font-size:0.85rem;color:var(--text-secondary)">
            <span style="color:var(--success)">+${added} 行新增</span> &nbsp;
            <span style="color:var(--danger)">-${removed} 行删除</span>
        </div>` + html;
    }

    document.getElementById('diffCompare').addEventListener('click', computeDiff);
    document.getElementById('diffClear').addEventListener('click', () => {
        document.getElementById('diffOld').value = '';
        document.getElementById('diffNew').value = '';
        document.getElementById('diffOutput').innerHTML = '';
    });
}
