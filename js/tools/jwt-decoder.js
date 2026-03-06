/**
 * JWT Decoder Tool
 * Decode JWT tokens and display header, payload, and signature.
 */
function initTool_jwt_decoder(container) {
    const body = createToolLayout(container, 'JWT 解析', '解码 JWT Token，查看 Header / Payload / 签名信息');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">输入 JWT Token</div>
            <textarea id="jwtInput" rows="4" placeholder="粘贴 JWT Token（eyJhbGciOiJ...）"></textarea>
            <button class="btn btn-primary" style="margin-top:12px" id="jwtDecode">解析</button>
        </div>
        <div class="split-pane">
            <div class="panel">
                <div class="panel-title">Header</div>
                <pre class="output-area" id="jwtHeader" style="min-height:80px"></pre>
            </div>
            <div class="panel">
                <div class="panel-title">Payload</div>
                <pre class="output-area" id="jwtPayload" style="min-height:80px"></pre>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">Token 信息</div>
            <div id="jwtInfo" class="output-area" style="min-height:60px;font-family:var(--font-sans)"></div>
        </div>
    `;

    function base64UrlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return decodeURIComponent(escape(atob(str)));
    }

    document.getElementById('jwtDecode').addEventListener('click', () => {
        const jwt = document.getElementById('jwtInput').value.trim();
        const headerEl = document.getElementById('jwtHeader');
        const payloadEl = document.getElementById('jwtPayload');
        const infoEl = document.getElementById('jwtInfo');

        const parts = jwt.split('.');
        if (parts.length !== 3) {
            headerEl.textContent = '';
            payloadEl.textContent = '';
            infoEl.innerHTML = '<span style="color:var(--danger)">⚠️ 无效的 JWT 格式（应有 3 个部分，用 "." 分隔）</span>';
            return;
        }

        try {
            const header = JSON.parse(base64UrlDecode(parts[0]));
            const payload = JSON.parse(base64UrlDecode(parts[1]));

            headerEl.textContent = JSON.stringify(header, null, 2);
            payloadEl.textContent = JSON.stringify(payload, null, 2);

            let infoHtml = '';
            infoHtml += `<div style="margin-bottom:8px"><strong>算法:</strong> ${escapeHtml(header.alg || 'N/A')}</div>`;
            infoHtml += `<div style="margin-bottom:8px"><strong>类型:</strong> ${escapeHtml(header.typ || 'N/A')}</div>`;

            if (payload.iat) {
                const iatDate = new Date(payload.iat * 1000);
                infoHtml += `<div style="margin-bottom:8px"><strong>签发时间 (iat):</strong> ${iatDate.toLocaleString('zh-CN')}</div>`;
            }
            if (payload.exp) {
                const expDate = new Date(payload.exp * 1000);
                const isExpired = expDate < new Date();
                infoHtml += `<div style="margin-bottom:8px"><strong>过期时间 (exp):</strong> ${expDate.toLocaleString('zh-CN')} `;
                infoHtml += isExpired
                    ? '<span style="color:var(--danger)">⛔ 已过期</span>'
                    : '<span style="color:var(--success)">✅ 未过期</span>';
                infoHtml += '</div>';
            }
            if (payload.sub) {
                infoHtml += `<div style="margin-bottom:8px"><strong>主体 (sub):</strong> ${escapeHtml(String(payload.sub))}</div>`;
            }
            if (payload.iss) {
                infoHtml += `<div style="margin-bottom:8px"><strong>签发者 (iss):</strong> ${escapeHtml(String(payload.iss))}</div>`;
            }

            infoHtml += `<div style="margin-top:12px;font-size:0.8rem;color:var(--text-muted)">⚠️ 签名验证需要密钥，此工具仅解码不验证签名</div>`;
            infoEl.innerHTML = infoHtml;

        } catch (e) {
            headerEl.textContent = '';
            payloadEl.textContent = '';
            infoEl.innerHTML = `<span style="color:var(--danger)">❌ 解码失败: ${escapeHtml(e.message)}</span>`;
        }
    });
}
