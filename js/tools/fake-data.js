/**
 * Fake Data Generator Tool
 * Generate random names, emails, phone numbers, addresses, etc. for testing.
 */
function initTool_fake_data(container) {
    const body = createToolLayout(container, '假数据生成器', '生成随机姓名、邮箱、手机号、身份证号等测试数据');
    body.innerHTML = `
        <div class="panel">
            <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:end">
                <div>
                    <label>生成数量</label>
                    <input type="number" id="fdCount" value="10" min="1" max="100" style="width:80px">
                </div>
                <div>
                    <label>包含字段</label>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
                        <label class="checkbox-row"><input type="checkbox" class="fd-field" value="name" checked> 姓名</label>
                        <label class="checkbox-row"><input type="checkbox" class="fd-field" value="phone" checked> 手机号</label>
                        <label class="checkbox-row"><input type="checkbox" class="fd-field" value="email" checked> 邮箱</label>
                        <label class="checkbox-row"><input type="checkbox" class="fd-field" value="idcard" checked> 身份证号</label>
                        <label class="checkbox-row"><input type="checkbox" class="fd-field" value="address"> 地址</label>
                        <label class="checkbox-row"><input type="checkbox" class="fd-field" value="company"> 公司名</label>
                        <label class="checkbox-row"><input type="checkbox" class="fd-field" value="ip"> IP 地址</label>
                        <label class="checkbox-row"><input type="checkbox" class="fd-field" value="date"> 日期</label>
                    </div>
                </div>
            </div>
            <div class="btn-group" style="margin-top:16px">
                <button class="btn btn-primary" id="fdGenerate">🎲 生成数据</button>
                <button class="btn btn-secondary" id="fdCopyJson">复制 JSON</button>
                <button class="btn btn-secondary" id="fdCopyCsv">复制 CSV</button>
                <button class="btn btn-secondary" id="fdDownload">📥 下载 CSV</button>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">生成结果</div>
            <div id="fdPreview" style="overflow-x:auto"></div>
        </div>
    `;

    const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛雷贺倪汤殷罗毕郝邬安常于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹'.split('');
    const NAMES = '伟芳娜秀英敏静丽强磊军洋刚娟艳明超慧巧美婷玲佳龙亮建辉鹏飞云峰华鑫涛松彬博勇杰浩然宇欣怡雪松瑶琳凯翔宁'.split('');
    const EMAIL_DOMAINS = ['qq.com', '163.com', 'gmail.com', 'outlook.com', '126.com', 'foxmail.com'];
    const PROVINCES = ['北京市', '上海市', '广东省广州市', '广东省深圳市', '浙江省杭州市', '江苏省南京市', '四川省成都市', '湖北省武汉市', '湖南省长沙市', '陕西省西安市', '山东省济南市', '福建省福州市', '重庆市', '天津市'];
    const STREETS = ['中山路', '解放路', '人民路', '建设路', '长安街', '南京路', '和平路', '文化路', '科技路', '创新大道'];
    const COMPANIES = ['科技', '信息', '网络', '数据', '智能', '云计算', '互联', '软件', '电子', '通信'];
    const COMPANY_SUFFIX = ['有限公司', '科技有限公司', '集团', '股份有限公司'];

    function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    const generators = {
        name: () => rand(SURNAMES) + rand(NAMES) + (Math.random() > 0.5 ? rand(NAMES) : ''),
        phone: () => '1' + rand(['30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '50', '51', '52', '53', '55', '56', '57', '58', '59', '70', '71', '72', '73', '75', '76', '77', '78', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89']) + String(randInt(10000000, 99999999)),
        email: () => {
            const prefix = 'user' + randInt(100, 99999);
            return prefix + '@' + rand(EMAIL_DOMAINS);
        },
        idcard: () => {
            const area = String(randInt(110000, 659000));
            const year = randInt(1970, 2005);
            const month = String(randInt(1, 12)).padStart(2, '0');
            const day = String(randInt(1, 28)).padStart(2, '0');
            const seq = String(randInt(100, 999));
            const base = area + year + month + day + seq;
            const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
            const checks = '10X98765432';
            let sum = 0;
            for (let i = 0; i < 17; i++) sum += parseInt(base[i]) * weights[i];
            return base + checks[sum % 11];
        },
        address: () => rand(PROVINCES) + rand(STREETS) + randInt(1, 999) + '号',
        company: () => rand(PROVINCES).replace(/[省市].*/, '') + rand(COMPANIES) + rand(COMPANIES) + rand(COMPANY_SUFFIX),
        ip: () => `${randInt(1, 223)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
        date: () => `${randInt(2020, 2026)}-${String(randInt(1, 12)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`,
    };

    const fieldLabels = { name: '姓名', phone: '手机号', email: '邮箱', idcard: '身份证号', address: '地址', company: '公司', ip: 'IP', date: '日期' };
    let generatedData = [];

    document.getElementById('fdGenerate').addEventListener('click', () => {
        const count = Math.min(parseInt(document.getElementById('fdCount').value) || 10, 100);
        const fields = [...document.querySelectorAll('.fd-field:checked')].map(cb => cb.value);

        if (fields.length === 0) { showToast('⚠️ 请至少选择一个字段'); return; }

        generatedData = [];
        for (let i = 0; i < count; i++) {
            const row = {};
            fields.forEach(f => { row[fieldLabels[f]] = generators[f](); });
            generatedData.push(row);
        }

        const headers = fields.map(f => fieldLabels[f]);
        let html = '<table style="width:100%;border-collapse:collapse;font-size:0.82rem">';
        html += '<tr>' + headers.map(h => `<th style="padding:6px 10px;background:var(--bg-tertiary);border:1px solid var(--border-color);text-align:left;font-weight:600;color:var(--accent-secondary);white-space:nowrap">${h}</th>`).join('') + '</tr>';
        generatedData.forEach((row, i) => {
            html += '<tr>' + headers.map(h => `<td style="padding:5px 10px;border:1px solid var(--border-color);font-family:var(--font-mono);font-size:0.8rem;${i % 2 ? 'background:var(--bg-tertiary)' : ''}">${escapeHtml(row[h])}</td>`).join('') + '</tr>';
        });
        html += '</table>';
        document.getElementById('fdPreview').innerHTML = html;
        showToast(`✅ 已生成 ${count} 条数据`);
    });

    document.getElementById('fdCopyJson').addEventListener('click', function () {
        if (generatedData.length === 0) { showToast('请先生成数据'); return; }
        copyToClipboard(JSON.stringify(generatedData, null, 2), this);
    });

    document.getElementById('fdCopyCsv').addEventListener('click', function () {
        if (generatedData.length === 0) { showToast('请先生成数据'); return; }
        const headers = Object.keys(generatedData[0]);
        const csv = [headers.join(','), ...generatedData.map(row => headers.map(h => row[h]).join(','))].join('\n');
        copyToClipboard(csv, this);
    });

    document.getElementById('fdDownload').addEventListener('click', () => {
        if (generatedData.length === 0) { showToast('请先生成数据'); return; }
        const headers = Object.keys(generatedData[0]);
        const csv = '\ufeff' + [headers.join(','), ...generatedData.map(row => headers.map(h => row[h]).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'fake_data.csv';
        a.click();
    });
}
