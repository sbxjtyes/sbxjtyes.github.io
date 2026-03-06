/**
 * Color Converter Tool
 * Convert between HEX, RGB, and HSL color formats with live preview.
 */
function initTool_color_converter(container) {
    const body = createToolLayout(container, '颜色转换', 'HEX / RGB / HSL 颜色格式互转，实时预览');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">颜色预览</div>
            <div class="color-preview" id="ccPreview" style="background:#7c5cfc;height:100px;margin-bottom:16px"></div>
            <input type="color" id="ccPicker" value="#7c5cfc" style="width:60px;height:36px;border:none;cursor:pointer;background:transparent">
            <span style="font-size:0.85rem;color:var(--text-muted);margin-left:8px">点击选择颜色</span>
        </div>
        <div class="panel">
            <div style="display:flex;flex-direction:column;gap:16px">
                <div>
                    <label>HEX</label>
                    <div class="copy-wrap">
                        <button class="copy-btn cc-copy" data-target="ccHex">复制</button>
                        <input type="text" id="ccHex" value="#7C5CFC" placeholder="#RRGGBB">
                    </div>
                </div>
                <div>
                    <label>RGB</label>
                    <div class="copy-wrap">
                        <button class="copy-btn cc-copy" data-target="ccRgb">复制</button>
                        <input type="text" id="ccRgb" value="rgb(124, 92, 252)" placeholder="rgb(R, G, B)">
                    </div>
                </div>
                <div>
                    <label>HSL</label>
                    <div class="copy-wrap">
                        <button class="copy-btn cc-copy" data-target="ccHsl">复制</button>
                        <input type="text" id="ccHsl" value="hsl(252, 97%, 67%)" placeholder="hsl(H, S%, L%)">
                    </div>
                </div>
            </div>
        </div>
    `;

    const preview = document.getElementById('ccPreview');
    const picker = document.getElementById('ccPicker');
    const hexEl = document.getElementById('ccHex');
    const rgbEl = document.getElementById('ccRgb');
    const hslEl = document.getElementById('ccHsl');

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const n = parseInt(hex, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1; if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    function updateFromHex(hex) {
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        rgbEl.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        hslEl.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        preview.style.background = hex;
        picker.value = hex.length === 7 ? hex : rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    function updateFromRgb(str) {
        const m = str.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (!m) return;
        const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);
        hexEl.value = hex;
        hslEl.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        preview.style.background = hex;
        picker.value = hex;
    }

    function updateFromHsl(str) {
        const m = str.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
        if (!m) return;
        const rgb = hslToRgb(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        hexEl.value = hex;
        rgbEl.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        preview.style.background = hex;
        picker.value = hex;
    }

    hexEl.addEventListener('input', () => updateFromHex(hexEl.value));
    rgbEl.addEventListener('input', () => updateFromRgb(rgbEl.value));
    hslEl.addEventListener('input', () => updateFromHsl(hslEl.value));
    picker.addEventListener('input', () => {
        hexEl.value = picker.value.toUpperCase();
        updateFromHex(picker.value);
    });

    document.querySelectorAll('.cc-copy').forEach(btn => {
        btn.addEventListener('click', function () {
            copyToClipboard(document.getElementById(this.dataset.target).value, this);
        });
    });
}
