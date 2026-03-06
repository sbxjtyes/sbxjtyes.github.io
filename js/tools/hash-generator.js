/**
 * Hash Generator Tool
 * Compute MD5, SHA-1, SHA-256, SHA-512 hashes using CryptoJS.
 */
function initTool_hash_generator(container) {
    const body = createToolLayout(container, 'Hash 生成器', 'MD5 / SHA-1 / SHA-256 / SHA-512 哈希计算');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">输入文本</div>
            <textarea id="hashInput" rows="6" placeholder="输入要计算哈希的文本..."></textarea>
            <button class="btn btn-primary" style="margin-top:12px" id="hashCalc">计算哈希</button>
        </div>
        <div class="panel">
            <div class="panel-title">哈希结果</div>
            <div id="hashResults" style="display:flex;flex-direction:column;gap:12px"></div>
        </div>
    `;

    document.getElementById('hashCalc').addEventListener('click', () => {
        const text = document.getElementById('hashInput').value;
        const results = document.getElementById('hashResults');

        if (typeof CryptoJS === 'undefined') {
            results.innerHTML = '<p style="color:var(--danger)">CryptoJS 库未加载</p>';
            return;
        }

        const hashes = [
            { name: 'MD5', value: CryptoJS.MD5(text).toString() },
            { name: 'SHA-1', value: CryptoJS.SHA1(text).toString() },
            { name: 'SHA-256', value: CryptoJS.SHA256(text).toString() },
            { name: 'SHA-512', value: CryptoJS.SHA512(text).toString() },
        ];

        results.innerHTML = hashes.map(h => `
            <div>
                <label>${h.name}</label>
                <div class="copy-wrap">
                    <button class="copy-btn hash-copy-btn" data-hash="${h.value}">复制</button>
                    <div class="output-area" style="min-height:auto;padding:10px;font-size:0.82rem;word-break:break-all">${h.value}</div>
                </div>
            </div>
        `).join('');

        results.querySelectorAll('.hash-copy-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                copyToClipboard(this.dataset.hash, this);
            });
        });
    });
}
