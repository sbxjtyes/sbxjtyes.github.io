/**
 * 智答 — 主应用逻辑
 * 分类过滤、卡片渲染、展开/收起、已读统计
 */
(function () {
    'use strict';

    const CATEGORIES = [
        { key: 'all', label: '全部', icon: '📋' },
        { key: '职场', label: '职场', icon: '🏢' },
        { key: '社交', label: '社交', icon: '👥' },
        { key: '亲友', label: '亲友', icon: '👨‍👩‍👧' },
        { key: '情感', label: '情感', icon: '❤️' },
        { key: '尴尬化解', label: '尴尬化解', icon: '😅' },
        { key: '饭局', label: '饭局', icon: '🍽️' },
        { key: '自我提升', label: '自我提升', icon: '🧠' },
        { key: '校园', label: '校园', icon: '🎓' },
    ];

    const STORAGE_KEY = 'zhida_read';
    let currentCategory = 'all';
    let displayCount = 8;

    /* ---- Read tracking ---- */
    function getRead() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    }
    function markRead(idx) {
        const read = getRead();
        if (!read.includes(idx)) {
            read.push(idx);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(read));
        }
    }
    function getReadCount() { return getRead().length; }

    /* ---- Render tabs ---- */
    function renderTabs() {
        const tabsEl = document.getElementById('tabs');
        tabsEl.innerHTML = CATEGORIES.map(c =>
            `<button class="tab${c.key === currentCategory ? ' active' : ''}" data-cat="${c.key}">${c.icon} ${c.label}</button>`
        ).join('');

        tabsEl.querySelectorAll('.tab').forEach(btn => {
            btn.addEventListener('click', () => {
                currentCategory = btn.dataset.cat;
                displayCount = 8;
                renderTabs();
                renderCards();
            });
        });
    }

    /* ---- Filter questions ---- */
    function getFiltered() {
        if (currentCategory === 'all') return QUESTIONS.map((q, i) => ({ ...q, _idx: i }));
        return QUESTIONS
            .map((q, i) => ({ ...q, _idx: i }))
            .filter(q => q.category === currentCategory);
    }

    /* ---- Render cards ---- */
    function renderCards() {
        const container = document.getElementById('cardList');
        const filtered = getFiltered();
        const showing = filtered.slice(0, displayCount);
        const read = getRead();

        if (filtered.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">🤔</div><p>这个分类暂时没有问题</p></div>`;
            return;
        }

        container.innerHTML = showing.map((q, i) => `
            <div class="card" data-idx="${q._idx}" style="animation-delay:${i * 0.05}s">
                <div class="card-header">
                    <span class="card-category">${getCategoryIcon(q.category)} ${q.category}</span>
                    <span class="card-number">#${q._idx + 1}</span>
                    <div class="card-question">${escapeHtml(q.question)}</div>
                    ${q.scene ? `<div class="card-scene">💬 场景：${escapeHtml(q.scene)}</div>` : ''}
                </div>
                <button class="card-toggle" aria-label="展开答案">
                    <span>查看高情商回答</span>
                    <span class="arrow">▼</span>
                </button>
                <div class="card-answer">
                    <div class="answer-content">
                        <div class="answer-section">
                            <div class="answer-label bad">❌ 低情商回答</div>
                            <div class="answer-text bad-text">${escapeHtml(q.bad)}</div>
                        </div>
                        <div class="answer-section">
                            <div class="answer-label good">✅ 高情商回答</div>
                            <div class="answer-text good-text">${escapeHtml(q.good)}</div>
                            ${q.goodAlt ? `<div class="answer-alt"><strong>备选：</strong>${escapeHtml(q.goodAlt)}</div>` : ''}
                        </div>
                        <div class="answer-section">
                            <div class="answer-label tip">💡 回答思路</div>
                            <div class="answer-text tip-text">${escapeHtml(q.tip)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Load more button
        if (filtered.length > displayCount) {
            container.innerHTML += `<button class="load-more" id="loadMore">加载更多（还有 ${filtered.length - displayCount} 题）</button>`;
            document.getElementById('loadMore').addEventListener('click', () => {
                displayCount += 8;
                renderCards();
            });
        }

        // Toggle cards
        container.querySelectorAll('.card-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.card');
                const wasOpen = card.classList.contains('open');
                card.classList.toggle('open');
                btn.querySelector('span:first-child').textContent = wasOpen ? '查看高情商回答' : '收起答案';
                if (!wasOpen) {
                    const idx = parseInt(card.dataset.idx);
                    markRead(idx);
                    updateStats();
                }
            });
        });

        updateStats();
    }

    /* ---- Stats ---- */
    function updateStats() {
        document.getElementById('statTotal').textContent = QUESTIONS.length;
        document.getElementById('statRead').textContent = getReadCount();
        document.getElementById('statCategories').textContent = CATEGORIES.length - 1;
    }

    /* ---- Helpers ---- */
    function getCategoryIcon(cat) {
        const found = CATEGORIES.find(c => c.key === cat);
        return found ? found.icon : '📋';
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /* ---- Init ---- */
    function init() {
        renderTabs();
        renderCards();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
