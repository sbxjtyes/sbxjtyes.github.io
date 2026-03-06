/**
 * Password Generator Tool
 * Generate random passwords with customizable options and strength meter.
 */
function initTool_password_generator(container) {
    const body = createToolLayout(container, '随机密码生成器', '自定义长度与字符类型，密码强度评估');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">设置</div>
            <div style="margin-bottom:16px">
                <label>密码长度: <strong id="pwLenVal">16</strong></label>
                <input type="range" id="pwLength" min="4" max="64" value="16">
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:16px">
                <label class="checkbox-row"><input type="checkbox" id="pwUpper" checked> 大写字母 (A-Z)</label>
                <label class="checkbox-row"><input type="checkbox" id="pwLower" checked> 小写字母 (a-z)</label>
                <label class="checkbox-row"><input type="checkbox" id="pwDigits" checked> 数字 (0-9)</label>
                <label class="checkbox-row"><input type="checkbox" id="pwSymbols" checked> 特殊字符 (!@#$...)</label>
            </div>
            <div class="btn-group">
                <button class="btn btn-primary" id="pwGenerate">🎲 生成密码</button>
                <button class="btn btn-secondary" id="pwBatch">批量生成 (5个)</button>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">生成结果</div>
            <div class="copy-wrap">
                <button class="copy-btn" id="pwCopy">复制</button>
                <div class="output-area" id="pwOutput" style="font-size:1.2rem;min-height:40px;display:flex;align-items:center;padding:14px"></div>
            </div>
            <div style="margin-top:8px">
                <div style="display:flex;justify-content:space-between;font-size:0.8rem">
                    <span>密码强度</span>
                    <span id="pwStrengthLabel" style="font-weight:600"></span>
                </div>
                <div class="strength-meter">
                    <div class="strength-meter-fill" id="pwStrength"></div>
                </div>
            </div>
        </div>
        <div class="panel" id="pwBatchPanel" style="display:none">
            <div class="panel-title">批量结果</div>
            <div id="pwBatchResult" class="output-area" style="min-height:80px"></div>
            <button class="btn btn-sm btn-secondary" id="pwBatchCopy" style="margin-top:8px">复制全部</button>
        </div>
    `;

    const CHARS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        digits: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    function generatePassword() {
        const len = parseInt(document.getElementById('pwLength').value);
        let charset = '';
        if (document.getElementById('pwUpper').checked) charset += CHARS.upper;
        if (document.getElementById('pwLower').checked) charset += CHARS.lower;
        if (document.getElementById('pwDigits').checked) charset += CHARS.digits;
        if (document.getElementById('pwSymbols').checked) charset += CHARS.symbols;

        if (!charset) {
            showToast('⚠️ 请至少选择一种字符类型');
            return '';
        }

        const array = new Uint32Array(len);
        crypto.getRandomValues(array);
        return Array.from(array, v => charset[v % charset.length]).join('');
    }

    function evaluateStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        const fill = document.getElementById('pwStrength');
        const label = document.getElementById('pwStrengthLabel');

        if (score <= 2) {
            fill.style.width = '25%'; fill.style.background = 'var(--danger)';
            label.textContent = '弱'; label.style.color = 'var(--danger)';
        } else if (score <= 4) {
            fill.style.width = '50%'; fill.style.background = 'var(--warning)';
            label.textContent = '中等'; label.style.color = 'var(--warning)';
        } else if (score <= 5) {
            fill.style.width = '75%'; fill.style.background = 'var(--accent-secondary)';
            label.textContent = '强'; label.style.color = 'var(--accent-secondary)';
        } else {
            fill.style.width = '100%'; fill.style.background = 'var(--success)';
            label.textContent = '非常强'; label.style.color = 'var(--success)';
        }
    }

    document.getElementById('pwLength').addEventListener('input', function () {
        document.getElementById('pwLenVal').textContent = this.value;
    });

    document.getElementById('pwGenerate').addEventListener('click', () => {
        const pw = generatePassword();
        if (pw) {
            document.getElementById('pwOutput').textContent = pw;
            evaluateStrength(pw);
        }
    });

    document.getElementById('pwBatch').addEventListener('click', () => {
        const passwords = [];
        for (let i = 0; i < 5; i++) {
            const pw = generatePassword();
            if (pw) passwords.push(pw);
        }
        if (passwords.length > 0) {
            document.getElementById('pwBatchPanel').style.display = '';
            document.getElementById('pwBatchResult').textContent = passwords.join('\n');
        }
    });

    document.getElementById('pwCopy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('pwOutput').textContent, this);
    });

    document.getElementById('pwBatchCopy').addEventListener('click', function () {
        copyToClipboard(document.getElementById('pwBatchResult').textContent, this);
    });

    // Generate one on init
    const pw = generatePassword();
    if (pw) {
        document.getElementById('pwOutput').textContent = pw;
        evaluateStrength(pw);
    }
}
