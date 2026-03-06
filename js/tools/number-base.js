/**
 * Number Base Converter Tool
 * Convert between binary, octal, decimal, and hexadecimal.
 */
function initTool_number_base(container) {
    const body = createToolLayout(container, '进制转换', '二进制 / 八进制 / 十进制 / 十六进制 互转');
    body.innerHTML = `
        <div class="panel">
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
                <label style="margin-bottom:0">输入进制</label>
                <select id="nbFrom" style="width:auto;min-width:120px">
                    <option value="2">二进制 (BIN)</option>
                    <option value="8">八进制 (OCT)</option>
                    <option value="10" selected>十进制 (DEC)</option>
                    <option value="16">十六进制 (HEX)</option>
                </select>
            </div>
            <input type="text" id="nbInput" placeholder="输入数值..." value="255">
        </div>
        <div class="panel">
            <div class="panel-title">转换结果</div>
            <div class="stats-row" id="nbResults">
                <div class="stat-item">
                    <div class="stat-label">二进制 (BIN)</div>
                    <div class="stat-value" id="nbBin" style="font-size:1.1rem;word-break:break-all">-</div>
                    <button class="btn btn-sm btn-secondary nb-copy" data-target="nbBin" style="margin-top:8px">复制</button>
                </div>
                <div class="stat-item">
                    <div class="stat-label">八进制 (OCT)</div>
                    <div class="stat-value" id="nbOct" style="font-size:1.1rem">-</div>
                    <button class="btn btn-sm btn-secondary nb-copy" data-target="nbOct" style="margin-top:8px">复制</button>
                </div>
                <div class="stat-item">
                    <div class="stat-label">十进制 (DEC)</div>
                    <div class="stat-value" id="nbDec" style="font-size:1.1rem">-</div>
                    <button class="btn btn-sm btn-secondary nb-copy" data-target="nbDec" style="margin-top:8px">复制</button>
                </div>
                <div class="stat-item">
                    <div class="stat-label">十六进制 (HEX)</div>
                    <div class="stat-value" id="nbHex" style="font-size:1.1rem">-</div>
                    <button class="btn btn-sm btn-secondary nb-copy" data-target="nbHex" style="margin-top:8px">复制</button>
                </div>
            </div>
        </div>
    `;

    function convert() {
        const base = parseInt(document.getElementById('nbFrom').value);
        const input = document.getElementById('nbInput').value.trim();

        if (!input) {
            ['nbBin', 'nbOct', 'nbDec', 'nbHex'].forEach(id => document.getElementById(id).textContent = '-');
            return;
        }

        const num = parseInt(input, base);
        if (isNaN(num)) {
            ['nbBin', 'nbOct', 'nbDec', 'nbHex'].forEach(id => document.getElementById(id).textContent = '无效');
            return;
        }

        document.getElementById('nbBin').textContent = num.toString(2);
        document.getElementById('nbOct').textContent = num.toString(8);
        document.getElementById('nbDec').textContent = num.toString(10);
        document.getElementById('nbHex').textContent = num.toString(16).toUpperCase();
    }

    document.getElementById('nbInput').addEventListener('input', convert);
    document.getElementById('nbFrom').addEventListener('change', convert);
    convert();

    document.querySelectorAll('.nb-copy').forEach(btn => {
        btn.addEventListener('click', function () {
            const text = document.getElementById(this.dataset.target).textContent;
            copyToClipboard(text, this);
        });
    });
}
