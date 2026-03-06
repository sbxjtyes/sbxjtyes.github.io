/**
 * Text Counter Tool
 * Count characters, words, lines, paragraphs, Chinese/English words.
 */
function initTool_text_counter(container) {
    const body = createToolLayout(container, '字数统计', '字数、字符数、行数、段落数、中英文分计');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">输入文本</div>
            <textarea id="tcInput" rows="8" placeholder="粘贴或输入文本..."></textarea>
        </div>
        <div class="stats-row" id="tcStats">
            <div class="stat-item"><div class="stat-value" id="tcChars">0</div><div class="stat-label">总字符</div></div>
            <div class="stat-item"><div class="stat-value" id="tcCharsNoSpace">0</div><div class="stat-label">不含空格</div></div>
            <div class="stat-item"><div class="stat-value" id="tcWords">0</div><div class="stat-label">英文单词</div></div>
            <div class="stat-item"><div class="stat-value" id="tcChinese">0</div><div class="stat-label">中文字数</div></div>
            <div class="stat-item"><div class="stat-value" id="tcLines">0</div><div class="stat-label">行数</div></div>
            <div class="stat-item"><div class="stat-value" id="tcParas">0</div><div class="stat-label">段落数</div></div>
        </div>
    `;

    function count() {
        const text = document.getElementById('tcInput').value;
        document.getElementById('tcChars').textContent = text.length;
        document.getElementById('tcCharsNoSpace').textContent = text.replace(/\s/g, '').length;

        const englishWords = text.match(/[a-zA-Z]+/g);
        document.getElementById('tcWords').textContent = englishWords ? englishWords.length : 0;

        const chineseChars = text.match(/[\u4e00-\u9fff]/g);
        document.getElementById('tcChinese').textContent = chineseChars ? chineseChars.length : 0;

        document.getElementById('tcLines').textContent = text ? text.split('\n').length : 0;

        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        document.getElementById('tcParas').textContent = text.trim() ? paragraphs.length : 0;
    }

    document.getElementById('tcInput').addEventListener('input', count);
}
