/**
 * Cron Parser Tool
 * Parse cron expressions and show next N execution times.
 */
function initTool_cron_parser(container) {
    const body = createToolLayout(container, 'Cron 表达式解析', '解析 Cron 表达式，显示未来执行时间');
    body.innerHTML = `
        <div class="panel">
            <label>Cron 表达式（5 字段：分 时 日 月 周）</label>
            <input type="text" id="cronInput" placeholder="例如: */5 * * * *" value="*/5 * * * *">
            <div class="btn-group" style="margin-top:12px">
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('cronInput').value='0 * * * *';document.getElementById('cronInput').dispatchEvent(new Event('input'))">每小时</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('cronInput').value='0 0 * * *';document.getElementById('cronInput').dispatchEvent(new Event('input'))">每天</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('cronInput').value='0 0 * * 1';document.getElementById('cronInput').dispatchEvent(new Event('input'))">每周一</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('cronInput').value='0 0 1 * *';document.getElementById('cronInput').dispatchEvent(new Event('input'))">每月</button>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('cronInput').value='*/5 * * * *';document.getElementById('cronInput').dispatchEvent(new Event('input'))">每 5 分钟</button>
            </div>
        </div>
        <div class="panel">
            <div class="panel-title">解析结果</div>
            <div id="cronDesc" style="font-size:0.95rem;margin-bottom:16px;color:var(--accent-secondary)"></div>
            <div class="panel-title">未来 10 次执行时间</div>
            <div id="cronNext" class="output-area" style="min-height:120px"></div>
        </div>
    `;

    const FIELD_NAMES = ['分钟', '小时', '日', '月', '星期'];
    const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

    function describeCron(expr) {
        const parts = expr.trim().split(/\s+/);
        if (parts.length !== 5) return '⚠️ 需要 5 个字段（分 时 日 月 周）';

        const [min, hour, day, month, weekday] = parts;
        let desc = '';

        if (min === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
            return '每分钟执行';
        }

        if (min.startsWith('*/')) {
            desc += `每 ${min.slice(2)} 分钟`;
        } else if (hour.startsWith('*/')) {
            desc += `每 ${hour.slice(2)} 小时`;
            if (min !== '*') desc += `（第 ${min} 分）`;
        } else {
            if (day === '*' && month === '*' && weekday === '*') {
                desc += `每天 ${hour === '*' ? '每小时' : hour + ':' + (min === '*' ? '00' : min.padStart(2, '0'))}`;
            } else if (weekday !== '*') {
                const days = weekday.split(',').map(d => '周' + (WEEKDAYS[Number(d)] || d)).join('、');
                desc += `每${days} ${hour}:${min.padStart(2, '0')}`;
            } else if (day !== '*') {
                desc += `每月 ${day} 日 ${hour}:${min.padStart(2, '0')}`;
            } else {
                desc += `${month !== '*' ? month + '月 ' : ''}${day !== '*' ? day + '日 ' : ''}${hour !== '*' ? hour + ':' : ''}${min !== '*' ? min.padStart(2, '0') : '*'}`;
            }
        }

        return desc + ' 执行';
    }

    function matchField(fieldExpr, value, max) {
        if (fieldExpr === '*') return true;
        return fieldExpr.split(',').some(part => {
            if (part.includes('/')) {
                const [range, step] = part.split('/');
                const s = Number(step);
                const start = range === '*' ? 0 : Number(range);
                return value >= start && (value - start) % s === 0;
            }
            if (part.includes('-')) {
                const [lo, hi] = part.split('-').map(Number);
                return value >= lo && value <= hi;
            }
            return Number(part) === value;
        });
    }

    function getNextExecutions(expr, count = 10) {
        const parts = expr.trim().split(/\s+/);
        if (parts.length !== 5) return [];
        const [minE, hourE, dayE, monthE, weekdayE] = parts;

        const results = [];
        const now = new Date();
        const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
        const limit = 525600; // max 1 year of minutes

        for (let i = 0; i < limit && results.length < count; i++) {
            const d = new Date(cursor.getTime() + i * 60000);
            if (
                matchField(minE, d.getMinutes(), 59) &&
                matchField(hourE, d.getHours(), 23) &&
                matchField(dayE, d.getDate(), 31) &&
                matchField(monthE, d.getMonth() + 1, 12) &&
                matchField(weekdayE, d.getDay(), 6)
            ) {
                results.push(d);
            }
        }
        return results;
    }

    function parseCron() {
        const expr = document.getElementById('cronInput').value.trim();
        document.getElementById('cronDesc').textContent = describeCron(expr);

        const times = getNextExecutions(expr);
        if (times.length === 0) {
            document.getElementById('cronNext').textContent = '无法计算执行时间，请检查表达式';
            return;
        }
        document.getElementById('cronNext').innerHTML = times.map((t, i) =>
            `<div style="padding:3px 0;${i % 2 === 0 ? '' : 'color:var(--text-secondary)'}">` +
            `${(i + 1).toString().padStart(2, ' ')}. ${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ` +
            `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')} ` +
            `周${WEEKDAYS[t.getDay()]}</div>`
        ).join('');
    }

    document.getElementById('cronInput').addEventListener('input', parseCron);
    parseCron();
}
