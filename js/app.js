/**
 * 智答 — 主应用逻辑
 * 分类过滤、卡片渲染、展开/收起、已读统计
 */
(function () {
    'use strict';

    const CATEGORY_META = [
        { key: '职场', label: '职场', icon: '🏢' },
        { key: '社交', label: '社交', icon: '👥' },
        { key: '亲友', label: '亲友', icon: '👨‍👩‍👧' },
        { key: '情感', label: '情感', icon: '❤️' },
        { key: '尴尬化解', label: '尴尬化解', icon: '😅' },
        { key: '饭局', label: '饭局', icon: '🍽️' },
        { key: '自我提升', label: '自我提升', icon: '🧠' },
        { key: '校园', label: '校园', icon: '🎓' },
        { key: '脑筋急转弯', label: '脑筋急转弯', icon: '🧩' },
        { key: '笑话', label: '笑话', icon: '😂' }
    ];

    const STORAGE_KEY = 'zhida_read';
    let currentCategory = 'all';
    let displayCount = 8;

    function getAvailableCategories() {
        const keys = [...new Set(QUESTIONS.map((q) => q.category).filter(Boolean))];
        return [
            { key: 'all', label: '全部', icon: '📋' },
            ...keys.map((key) => {
                const found = CATEGORY_META.find((category) => category.key === key);
                return found || { key, label: key, icon: '📋' };
            })
        ];
    }

    /* ---- Read tracking ---- */
    function getRead() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(raw)) {
                return [];
            }
            return raw.filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < QUESTIONS.length);
        } catch {
            return [];
        }
    }

    function markRead(idx) {
        if (!Number.isInteger(idx) || idx < 0 || idx >= QUESTIONS.length) {
            return;
        }

        const read = getRead();
        if (!read.includes(idx)) {
            read.push(idx);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(read));
        }
    }

    function getReadCount() {
        return getRead().length;
    }

    /* ---- Render tabs ---- */
    function renderTabs() {
        const tabsEl = document.getElementById('tabs');
        const wrapper = document.querySelector('.tabs-wrapper');
        const categories = getAvailableCategories();

        if (QUESTIONS.length === 0) {
            wrapper.hidden = true;
            tabsEl.innerHTML = '';
            return;
        }

        wrapper.hidden = false;

        if (!categories.some((category) => category.key === currentCategory)) {
            currentCategory = 'all';
        }

        tabsEl.innerHTML = categories.map((category) =>
            `<button class="tab${category.key === currentCategory ? ' active' : ''}" data-cat="${category.key}">${category.icon} ${category.label}</button>`
        ).join('');

        tabsEl.querySelectorAll('.tab').forEach((btn) => {
            btn.addEventListener('click', () => {
                currentCategory = btn.dataset.cat;
                displayCount = 8;
                renderTabs();
                renderCards();
            });
        });
    }

    /* ---- Filter content ---- */
    function getFiltered() {
        if (currentCategory === 'all') {
            return QUESTIONS.map((item, index) => ({ ...item, _idx: index }));
        }

        return QUESTIONS
            .map((item, index) => ({ ...item, _idx: index }))
            .filter((item) => item.category === currentCategory);
    }

    /* ---- Render cards ---- */
    function renderCards() {
        const container = document.getElementById('cardList');
        const statsBar = document.querySelector('.stats-bar');
        const filtered = getFiltered();
        const showing = filtered.slice(0, displayCount);

        statsBar.hidden = QUESTIONS.length === 0;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>当前暂无内容</p>
                    <p>页面内容已清空。</p>
                </div>`;
            updateStats();
            return;
        }

        container.innerHTML = showing.map((item, index) => {
            const type = item.type || 'eq';
            const toggleLabel = type === 'riddle' ? '查看答案' : type === 'joke' ? '查看笑点' : '查看高情商回答';
            return `
            <div class="card" data-idx="${item._idx}" data-type="${type}" style="animation-delay:${index * 0.05}s">
                <div class="card-header">
                    <span class="card-category">${getCategoryIcon(item.category)} ${item.category}</span>
                    <span class="card-number">#${item._idx + 1}</span>
                    <div class="card-question">${escapeHtml(item.question)}</div>
                    ${item.scene ? `<div class="card-scene">💬 场景：${escapeHtml(item.scene)}</div>` : ''}
                </div>
                <button class="card-toggle" aria-label="展开答案">
                    <span>${toggleLabel}</span>
                    <span class="arrow">▼</span>
                </button>
                <div class="card-answer">
                    <div class="answer-content">
                        ${renderAnswerBody(item, type)}
                    </div>
                </div>
            </div>`;
        }).join('');

        if (filtered.length > displayCount) {
            container.innerHTML += `<button class="load-more" id="loadMore">加载更多（还有 ${filtered.length - displayCount} 项）</button>`;
            document.getElementById('loadMore').addEventListener('click', () => {
                displayCount += 8;
                renderCards();
            });
        }

        container.querySelectorAll('.card-toggle').forEach((btn) => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.card');
                const wasOpen = card.classList.contains('open');
                card.classList.toggle('open');
                const type = card.dataset.type || 'eq';
                const label = type === 'riddle' ? '查看答案' : type === 'joke' ? '查看笑点' : '查看高情商回答';
                btn.querySelector('span:first-child').textContent = wasOpen ? label : '收起';
                if (!wasOpen) {
                    const idx = parseInt(card.dataset.idx, 10);
                    markRead(idx);
                    updateStats();
                }
            });
        });

        updateStats();
    }

    /* ---- Stats ---- */
    function updateStats() {
        const categoryCount = new Set(QUESTIONS.map((item) => item.category).filter(Boolean)).size;
        document.getElementById('statTotal').textContent = QUESTIONS.length;
        document.getElementById('statRead').textContent = getReadCount();
        document.getElementById('statCategories').textContent = categoryCount;
    }

    /* ---- Helpers ---- */
    function getCategoryIcon(categoryKey) {
        const found = CATEGORY_META.find((category) => category.key === categoryKey);
        return found ? found.icon : '📋';
    }

    function escapeHtml(str) {
        if (!str) {
            return '';
        }
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderAnswerBody(item, type) {
        if (type === 'riddle') {
            return `
                <div class="answer-section">
                    <div class="answer-label good">✅ 答案</div>
                    <div class="answer-text good-text">${escapeHtml(item.good)}</div>
                </div>
                ${item.tip ? `<div class="answer-section">
                    <div class="answer-label tip">💡 解析</div>
                    <div class="answer-text tip-text">${escapeHtml(item.tip)}</div>
                </div>` : ''}`;
        }

        if (type === 'joke') {
            return `
                <div class="answer-section">
                    <div class="answer-label good">😂 笑点</div>
                    <div class="answer-text good-text">${escapeHtml(item.good)}</div>
                </div>
                ${item.tip ? `<div class="answer-section">
                    <div class="answer-label tip">💬 解读</div>
                    <div class="answer-text tip-text">${escapeHtml(item.tip)}</div>
                </div>` : ''}`;
        }

        return `
            <div class="answer-section">
                <div class="answer-label bad">❌ 低情商回答</div>
                <div class="answer-text bad-text">${escapeHtml(item.bad)}</div>
            </div>
            <div class="answer-section">
                <div class="answer-label good">✅ 高情商回答</div>
                <div class="answer-text good-text">${escapeHtml(item.good)}</div>
                ${item.goodAlt ? `<div class="answer-alt"><strong>备选：</strong>${escapeHtml(item.goodAlt)}</div>` : ''}
            </div>
            <div class="answer-section">
                <div class="answer-label tip">💡 回答思路</div>
                <div class="answer-text tip-text">${escapeHtml(item.tip)}</div>
            </div>`;
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
