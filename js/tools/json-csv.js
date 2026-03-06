/**
 * JSON to CSV Converter Tool
 * Convert between JSON arrays and CSV format.
 */
function initTool_json_csv(container) {
    const body = createToolLayout(container, 'JSON ↔ CSV 转换', 'JSON 数组与 CSV 表格格式互转');
    body.innerHTML = `
        <div class="split-pane">
            <div class="panel">
                <div class="panel-title">JSON</div>
                <textarea id="jcJson" rows="10" placeholder='[{"name":"张三","age":20},{"name":"李四","age":25}]'>[{"name":"张三","age":20,"city":"北京"},{"name":"李四","age":25,"city":"上海"},{"name":"王五","age":30,"city":"广州"}]</textarea>
                <button class="btn btn-primary" style="margin-top:12px" id="jcToCsv">转为 CSV →</button>
            </div>
            <div class="panel">
                <div class="panel-title">CSV</div>
                <div class="copy-wrap">
                    <button class="copy-btn" id="jcCopyCsv">复制</button>
                    <textarea id="jcCsv" rows="10" placeholder="name,age,city&#10;张三,20,北京"></textarea>
                </div>
                <button class="btn btn-primary" style="margin-top:12px" id="jcToJson">← 转为 JSON</button>
            </div>
        </div>
        <div class="panel" id="jcPreviewPanel" style="display:none">
            <div class="panel-title">表格预览</div>
            <div id="jcPreview" style="overflow-x:auto"></div>
        </div>
        <div class="btn-group" style="margin-top:8px">
            <button class="btn btn-secondary" id="jcDownloadCsv">📥 下载 CSV</button>
            <button class="btn btn-secondary" id="jcDownloadJson">📥 下载 JSON</button>
        </div>
    `;

    function jsonToCsv(jsonStr) {
        const arr = JSON.parse(jsonStr);
        if (!Array.isArray(arr) || arr.length === 0) throw new Error('输入必须是非空 JSON 数组');
        const headers = [...new Set(arr.flatMap(obj => Object.keys(obj)))];
        const rows = arr.map(obj => headers.map(h => {
            const val = obj[h] !== undefined ? String(obj[h]) : '';
            return val.includes(',') || val.includes('"') || val.includes('\n') ? '"' + val.replace(/"/g, '""') + '"' : val;
        }).join(','));
        return [headers.join(','), ...rows].join('\n');
    }

    function csvToJson(csvStr) {
        const lines = csvStr.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV 至少需要标题行和一行数据');
        const headers = parseCsvLine(lines[0]);
        return lines.slice(1).filter(l => l.trim()).map(line => {
            const values = parseCsvLine(line);
            const obj = {};
            headers.forEach((h, i) => { obj[h] = values[i] || ''; });
            return obj;
        });
    }

    function parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
                else if (ch === '"') { inQuotes = false; }
                else { current += ch; }
            } else {
                if (ch === '"') { inQuotes = true; }
                else if (ch === ',') { result.push(current); current = ''; }
                else { current += ch; }
            }
        }
        result.push(current);
        return result;
    }

    function showPreview(headers, rows) {
        const panel = document.getElementById('jcPreviewPanel');
        panel.style.display = '';
        let html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem">';
        html += '<tr>' + headers.map(h => `<th style="padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border-color);text-align:left;font-weight:600;color:var(--accent-secondary)">${escapeHtml(h)}</th>`).join('') + '</tr>';
        rows.forEach((row, i) => {
            html += '<tr>' + row.map(cell => `<td style="padding:6px 12px;border:1px solid var(--border-color);${i % 2 ? 'background:var(--bg-tertiary)' : ''}">${escapeHtml(cell)}</td>`).join('') + '</tr>';
        });
        html += '</table>';
        document.getElementById('jcPreview').innerHTML = html;
    }

    document.getElementById('jcToCsv').addEventListener('click', () => {
        try {
            const csv = jsonToCsv(document.getElementById('jcJson').value);
            document.getElementById('jcCsv').value = csv;
            const arr = JSON.parse(document.getElementById('jcJson').value);
            const headers = [...new Set(arr.flatMap(obj => Object.keys(obj)))];
            showPreview(headers, arr.map(obj => headers.map(h => String(obj[h] || ''))));
            showToast('✅ 转换成功');
        } catch (e) {
            showToast('❌ ' + e.message);
        }
    });

    document.getElementById('jcToJson').addEventListener('click', () => {
        try {
            const json = csvToJson(document.getElementById('jcCsv').value);
            document.getElementById('jcJson').value = JSON.stringify(json, null, 2);
            const headers = Object.keys(json[0] || {});
            showPreview(headers, json.map(obj => headers.map(h => String(obj[h] || ''))));
            showToast('✅ 转换成功');
        } catch (e) {
            showToast('❌ ' + e.message);
        }
    });

    document.getElementById('jcCopyCsv').addEventListener('click', function () {
        copyToClipboard(document.getElementById('jcCsv').value, this);
    });

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    }

    document.getElementById('jcDownloadCsv').addEventListener('click', () => {
        const csv = document.getElementById('jcCsv').value;
        if (csv) downloadFile(csv, 'data.csv', 'text/csv;charset=utf-8');
    });

    document.getElementById('jcDownloadJson').addEventListener('click', () => {
        const json = document.getElementById('jcJson').value;
        if (json) downloadFile(json, 'data.json', 'application/json');
    });
}
