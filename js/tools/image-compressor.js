/**
 * Image Compressor Tool
 * Compress images in the browser using Compressor.js (no upload).
 */
function initTool_image_compressor(container) {
    const body = createToolLayout(container, '图片压缩', '浏览器端图片压缩，数据不上传服务器');
    body.innerHTML = `
        <div class="panel">
            <div class="panel-title">设置</div>
            <div style="margin-bottom:16px">
                <label>压缩质量: <strong id="icQualVal">80</strong>%</label>
                <input type="range" id="icQuality" min="10" max="100" value="80">
            </div>
            <div style="margin-bottom:16px">
                <label>最大宽度 (px，0 = 不限制)</label>
                <input type="number" id="icMaxWidth" value="0" min="0" step="100">
            </div>
        </div>
        <div class="panel">
            <div class="dropzone" id="icDropzone">
                <div class="dropzone-icon">🖼️</div>
                <div>点击或拖拽图片到这里</div>
                <div style="font-size:0.8rem;margin-top:4px">支持 JPG、PNG、WebP</div>
                <input type="file" id="icFile" accept="image/jpeg,image/png,image/webp">
            </div>
        </div>
        <div class="panel" id="icResultPanel" style="display:none">
            <div class="panel-title">压缩结果</div>
            <div class="stats-row" style="margin-bottom:16px">
                <div class="stat-item"><div class="stat-value" id="icOrigSize">-</div><div class="stat-label">原始大小</div></div>
                <div class="stat-item"><div class="stat-value" id="icCompSize">-</div><div class="stat-label">压缩后大小</div></div>
                <div class="stat-item"><div class="stat-value" id="icRatio">-</div><div class="stat-label">压缩率</div></div>
            </div>
            <div class="img-compare">
                <div>
                    <p style="font-size:0.85rem;margin-bottom:8px;color:var(--text-secondary)">原图</p>
                    <img id="icOrigImg" src="" alt="原图">
                </div>
                <div>
                    <p style="font-size:0.85rem;margin-bottom:8px;color:var(--text-secondary)">压缩后</p>
                    <img id="icCompImg" src="" alt="压缩后">
                </div>
            </div>
            <button class="btn btn-primary" style="margin-top:16px" id="icDownload">📥 下载压缩后图片</button>
        </div>
    `;

    let compressedBlob = null;
    let originalFileName = '';

    const dropzone = document.getElementById('icDropzone');
    const fileInput = document.getElementById('icFile');

    document.getElementById('icQuality').addEventListener('input', function () {
        document.getElementById('icQualVal').textContent = this.value;
    });

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) processFile(fileInput.files[0]);
    });

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }

    function processFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast('❌ 请选择图片文件');
            return;
        }

        originalFileName = file.name;
        const quality = parseInt(document.getElementById('icQuality').value) / 100;
        const maxWidth = parseInt(document.getElementById('icMaxWidth').value) || undefined;

        // Show original
        const origUrl = URL.createObjectURL(file);
        document.getElementById('icOrigImg').src = origUrl;
        document.getElementById('icOrigSize').textContent = formatSize(file.size);

        if (typeof Compressor === 'undefined') {
            showToast('⚠️ Compressor.js 库未加载，使用 Canvas 压缩');
            // Fallback to canvas
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (maxWidth && w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                canvas.toBlob(blob => {
                    compressedBlob = blob;
                    showResult(file.size, blob);
                }, file.type, quality);
            };
            img.src = origUrl;
            return;
        }

        new Compressor(file, {
            quality: quality,
            maxWidth: maxWidth,
            success(result) {
                compressedBlob = result;
                showResult(file.size, result);
            },
            error(err) {
                showToast('❌ 压缩失败: ' + err.message);
            }
        });
    }

    function showResult(origSize, blob) {
        document.getElementById('icResultPanel').style.display = '';
        document.getElementById('icCompSize').textContent = formatSize(blob.size);
        const ratio = ((1 - blob.size / origSize) * 100).toFixed(1);
        document.getElementById('icRatio').textContent = ratio + '%';
        document.getElementById('icCompImg').src = URL.createObjectURL(blob);
    }

    document.getElementById('icDownload').addEventListener('click', () => {
        if (!compressedBlob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(compressedBlob);
        const ext = originalFileName.split('.').pop();
        a.download = originalFileName.replace(`.${ext}`, `_compressed.${ext}`);
        a.click();
    });
}
