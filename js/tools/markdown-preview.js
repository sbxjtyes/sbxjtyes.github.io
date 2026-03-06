/**
 * Markdown Preview Tool
 * Side-by-side Markdown editor with live preview using marked + highlight.js.
 */
function initTool_markdown_preview(container) {
    const body = createToolLayout(container, 'Markdown 预览', '左右分栏编辑器，实时渲染 Markdown');
    body.innerHTML = `
        <div class="split-pane" style="min-height:500px">
            <div class="panel" style="display:flex;flex-direction:column">
                <div class="panel-title">Markdown 编辑</div>
                <textarea id="mdInput" style="flex:1;min-height:400px;resize:none" placeholder="在此输入 Markdown...">
# 欢迎使用 Markdown 预览

## 功能演示

这是一个 **实时预览** 的 Markdown 编辑器。支持以下功能：

### 列表
- 无序列表项 1
- 无序列表项 2
  - 嵌套项

### 代码
\`\`\`javascript
function hello() {
    console.log("Hello, DevToolbox!");
}
\`\`\`

### 表格

| 功能 | 状态 |
|------|------|
| 标题 | ✅ |
| 代码高亮 | ✅ |
| 表格 | ✅ |

> 引用文本也支持哦！

---

*斜体* 和 **粗体** 还有 ~~删除线~~
                </textarea>
            </div>
            <div class="panel" style="display:flex;flex-direction:column">
                <div class="panel-title">预览</div>
                <div id="mdOutput" class="output-area" style="flex:1;min-height:400px;overflow-y:auto;white-space:normal;word-break:normal;font-family:var(--font-sans)"></div>
            </div>
        </div>
    `;

    const input = document.getElementById('mdInput');
    const output = document.getElementById('mdOutput');

    function renderMd() {
        try {
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    highlight: function (code, lang) {
                        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                            return hljs.highlight(code, { language: lang }).value;
                        }
                        return code;
                    },
                    breaks: true,
                    gfm: true
                });
                output.innerHTML = marked.parse(input.value);
            } else {
                output.textContent = input.value;
            }
        } catch (e) {
            output.textContent = input.value;
        }
    }

    input.addEventListener('input', renderMd);
    renderMd();
}
