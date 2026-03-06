/**
 * Unit Converter Tool
 * Convert between various units: length, weight, temperature, area, speed, data.
 */
function initTool_unit_converter(container) {
    const body = createToolLayout(container, '单位换算', '长度 / 重量 / 温度 / 面积 / 速度 / 数据存储');
    body.innerHTML = `
        <div class="panel">
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
                <label style="margin-bottom:0">类别</label>
                <select id="ucCategory" style="width:auto;min-width:140px"></select>
            </div>
            <div class="split-pane" style="gap:12px">
                <div>
                    <label>从</label>
                    <select id="ucFrom" style="margin-bottom:8px"></select>
                    <input type="number" id="ucInput" value="1" step="any">
                </div>
                <div>
                    <label>到</label>
                    <select id="ucTo" style="margin-bottom:8px"></select>
                    <div class="copy-wrap">
                        <button class="copy-btn" id="ucCopy">复制</button>
                        <input type="text" id="ucOutput" readonly style="font-weight:600;font-size:1.1rem">
                    </div>
                </div>
            </div>
            <button class="btn btn-secondary" style="margin-top:12px" id="ucSwap">⇄ 交换</button>
        </div>
        <div class="panel">
            <div class="panel-title">全部换算结果</div>
            <div id="ucAll" style="font-size:0.85rem"></div>
        </div>
    `;

    const categories = {
        '长度': {
            units: ['米(m)', '千米(km)', '厘米(cm)', '毫米(mm)', '英里(mi)', '码(yd)', '英尺(ft)', '英寸(in)'],
            toBase: [1, 1000, 0.01, 0.001, 1609.344, 0.9144, 0.3048, 0.0254]
        },
        '重量': {
            units: ['千克(kg)', '克(g)', '毫克(mg)', '吨(t)', '磅(lb)', '盎司(oz)', '斤', '两'],
            toBase: [1, 0.001, 0.000001, 1000, 0.453592, 0.0283495, 0.5, 0.05]
        },
        '面积': {
            units: ['平方米(m²)', '平方千米(km²)', '平方厘米(cm²)', '公顷(ha)', '亩', '平方英尺(ft²)', '平方英里(mi²)', '英亩(acre)'],
            toBase: [1, 1e6, 1e-4, 1e4, 666.667, 0.092903, 2.59e6, 4046.86]
        },
        '速度': {
            units: ['米/秒(m/s)', '千米/时(km/h)', '英里/时(mph)', '节(knot)', '马赫(Mach)'],
            toBase: [1, 0.277778, 0.44704, 0.514444, 340.29]
        },
        '数据存储': {
            units: ['字节(B)', 'KB', 'MB', 'GB', 'TB', 'PB'],
            toBase: [1, 1024, 1048576, 1073741824, 1099511627776, 1125899906842624]
        },
    };

    const catSelect = document.getElementById('ucCategory');
    const fromSelect = document.getElementById('ucFrom');
    const toSelect = document.getElementById('ucTo');
    const inputEl = document.getElementById('ucInput');
    const outputEl = document.getElementById('ucOutput');
    const allEl = document.getElementById('ucAll');

    // Temperature handled separately
    const TEMP_UNITS = ['摄氏度(°C)', '华氏度(°F)', '开尔文(K)'];

    // Build category select
    Object.keys(categories).forEach(cat => {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    catSelect.innerHTML += `<option value="温度">温度</option>`;

    function buildSelects() {
        const cat = catSelect.value;
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        const units = cat === '温度' ? TEMP_UNITS : categories[cat].units;
        units.forEach((u, i) => {
            fromSelect.innerHTML += `<option value="${i}">${u}</option>`;
            toSelect.innerHTML += `<option value="${i}">${u}</option>`;
        });
        if (toSelect.options.length > 1) toSelect.selectedIndex = 1;
        convert();
    }

    function convertTemp(val, fromIdx, toIdx) {
        // 0:C, 1:F, 2:K
        let celsius;
        if (fromIdx === 0) celsius = val;
        else if (fromIdx === 1) celsius = (val - 32) * 5 / 9;
        else celsius = val - 273.15;

        if (toIdx === 0) return celsius;
        if (toIdx === 1) return celsius * 9 / 5 + 32;
        return celsius + 273.15;
    }

    function convert() {
        const cat = catSelect.value;
        const val = parseFloat(inputEl.value);
        const fromI = parseInt(fromSelect.value);
        const toI = parseInt(toSelect.value);

        if (isNaN(val)) { outputEl.value = ''; allEl.innerHTML = ''; return; }

        if (cat === '温度') {
            const result = convertTemp(val, fromI, toI);
            outputEl.value = parseFloat(result.toFixed(6));
            allEl.innerHTML = TEMP_UNITS.map((u, i) => {
                const r = convertTemp(val, fromI, i);
                return `<div style="padding:3px 0">${parseFloat(r.toFixed(6))} ${u}</div>`;
            }).join('');
        } else {
            const data = categories[cat];
            const baseVal = val * data.toBase[fromI];
            const result = baseVal / data.toBase[toI];
            outputEl.value = parseFloat(result.toPrecision(10));
            allEl.innerHTML = data.units.map((u, i) => {
                const r = baseVal / data.toBase[i];
                return `<div style="padding:3px 0">${parseFloat(r.toPrecision(10))} ${u}</div>`;
            }).join('');
        }
    }

    catSelect.addEventListener('change', buildSelects);
    fromSelect.addEventListener('change', convert);
    toSelect.addEventListener('change', convert);
    inputEl.addEventListener('input', convert);

    document.getElementById('ucSwap').addEventListener('click', () => {
        const tmp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = tmp;
        convert();
    });

    document.getElementById('ucCopy').addEventListener('click', function () {
        copyToClipboard(outputEl.value, this);
    });

    buildSelects();
}
