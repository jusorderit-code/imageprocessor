const toolTitle = document.getElementById('tool-title');
const toolDescription = document.getElementById('tool-description');
const toolBody = document.getElementById('tool-body');
const toolStatus = document.getElementById('tool-status');
const toolButtons = [...document.querySelectorAll('.tool-button')];

const tools = {
  'image-compress': {
    title: 'Compress Image',
    description: 'Upload an image, adjust quality and width, then export a smaller PNG, JPEG, or WebP copy.',
    render: renderImageCompress,
  },
  'image-convert': {
    title: 'Convert Image',
    description: 'Convert raster images between PNG, JPEG, and WebP with a simple upload-first flow.',
    render: renderImageConvert,
  },
  'image-edit': {
    title: 'Edit Image',
    description: 'Use a lightweight in-browser editor for rotation, mirroring, grayscale, and brightness changes.',
    render: renderImageEdit,
  },
  'eps-convert': {
    title: 'EPS / PDF / PNG',
    description: 'This tool is scaffolded in the interface, but reliable EPS conversion should run on the backend using Ghostscript.',
    render: renderEPSPlaceholder,
  },
  'pdf-remove-pages': {
    title: 'Remove PDF Pages',
    description: 'Upload a PDF and remove page numbers like 1,3-5,8 directly in the browser.',
    render: renderPdfRemovePages,
  },
  'pdf-edit': {
    title: 'Edit PDF Text',
    description: 'This UI explains the recommended production approach. Reliable PDF text editing usually needs a backend service.',
    render: renderPdfEditPlaceholder,
  },
  'docx-to-pdf': {
    title: 'DOCX to PDF',
    description: 'This UI is ready for wiring to a backend conversion service that preserves formatting.',
    render: renderDocxToPdfPlaceholder,
  },
  'pdf-to-docx': {
    title: 'PDF to DOCX',
    description: 'This UI is ready for a backend service that converts PDFs to editable Word documents.',
    render: renderPdfToDocxPlaceholder,
  },
};

let activeTool = 'image-compress';

initialize();

function initialize() {
  toolButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTool(button.dataset.tool));
  });
  setActiveTool(activeTool);
}

function setActiveTool(toolId) {
  activeTool = toolId;
  toolButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tool === toolId);
  });

  const tool = tools[toolId];
  toolTitle.textContent = tool.title;
  toolDescription.textContent = tool.description;
  setStatus('Ready');
  tool.render();
}

function setStatus(message, type = 'neutral') {
  toolStatus.textContent = message;
  toolStatus.className = 'status-chip';
  if (type === 'ok') toolStatus.classList.add('status-ok');
  if (type === 'warn') toolStatus.classList.add('status-warn');
  if (type === 'error') toolStatus.classList.add('status-error');
}

function renderImageCompress() {
  toolBody.innerHTML = `
    <div class="panel-grid two-col">
      <div class="panel">
        <h4>Upload and export</h4>
        <div class="field">
          <label for="compress-file">Upload image</label>
          <input id="compress-file" type="file" accept="image/png,image/jpeg,image/webp" />
        </div>
        <div class="field">
          <label for="compress-format">Output format</label>
          <select id="compress-format">
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>
        <div class="field">
          <label for="compress-quality">Quality: <span id="compress-quality-value">0.82</span></label>
          <input id="compress-quality" type="range" min="0.1" max="1" step="0.01" value="0.82" />
          <div class="range-hint">Lower quality usually means a smaller file.</div>
        </div>
        <div class="field">
          <label for="compress-width">Maximum width in pixels</label>
          <input id="compress-width" type="number" min="50" step="10" value="1600" />
        </div>
        <div class="button-row">
          <button id="compress-download" class="primary-btn">Compress and Download</button>
          <button id="compress-reset" class="ghost-btn">Reset</button>
        </div>
        <div id="compress-meta" class="inline-metrics"></div>
      </div>
      <div class="preview-panel">
        <h4>Preview</h4>
        <div class="preview-box">
          <img id="compress-preview" alt="Uploaded preview" hidden />
          <p id="compress-empty" class="small-note">Upload a PNG, JPEG, or WebP image to preview it here.</p>
        </div>
      </div>
    </div>
  `;

  const fileInput = document.getElementById('compress-file');
  const qualityInput = document.getElementById('compress-quality');
  const qualityValue = document.getElementById('compress-quality-value');
  const widthInput = document.getElementById('compress-width');
  const formatInput = document.getElementById('compress-format');
  const preview = document.getElementById('compress-preview');
  const empty = document.getElementById('compress-empty');
  const meta = document.getElementById('compress-meta');

  qualityInput.addEventListener('input', () => {
    qualityValue.textContent = Number(qualityInput.value).toFixed(2);
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.hidden = false;
    empty.hidden = true;
    const img = await loadImageFromFile(file);
    meta.innerHTML = `
      <span class="metric-chip">Original size: ${formatBytes(file.size)}</span>
      <span class="metric-chip">Dimensions: ${img.width} × ${img.height}</span>
    `;
    setStatus('Image loaded', 'ok');
  });

  document.getElementById('compress-download').addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      setStatus('Upload an image first', 'warn');
      return;
    }

    try {
      setStatus('Compressing image...');
      const img = await loadImageFromFile(file);
      const targetWidth = Math.max(1, Number(widthInput.value) || img.width);
      const scale = Math.min(1, targetWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const mime = formatInput.value;
      const quality = Number(qualityInput.value);
      const blob = await canvasToBlob(canvas, mime, quality);
      const extension = mimeToExtension(mime);
      downloadBlob(blob, `${stripExtension(file.name)}-compressed.${extension}`);
      meta.innerHTML += `<span class="metric-chip">Output size: ${formatBytes(blob.size)}</span>`;
      setStatus('Compressed image downloaded', 'ok');
    } catch (error) {
      console.error(error);
      setStatus('Compression failed', 'error');
    }
  });

  document.getElementById('compress-reset').addEventListener('click', () => {
    setActiveTool('image-compress');
  });
}

function renderImageConvert() {
  toolBody.innerHTML = `
    <div class="panel-grid two-col">
      <div class="panel">
        <h4>Convert image format</h4>
        <div class="field">
          <label for="convert-file">Upload image</label>
          <input id="convert-file" type="file" accept="image/png,image/jpeg,image/webp" />
        </div>
        <div class="field">
          <label for="convert-format">Target format</label>
          <select id="convert-format">
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>
        <div class="field">
          <label for="convert-quality">Quality for JPEG/WebP: <span id="convert-quality-value">0.92</span></label>
          <input id="convert-quality" type="range" min="0.1" max="1" step="0.01" value="0.92" />
        </div>
        <div class="button-row">
          <button id="convert-download" class="primary-btn">Convert and Download</button>
        </div>
        <p class="small-note">This browser tool handles raster images. EPS conversion is handled separately because that needs a backend pipeline.</p>
      </div>
      <div class="preview-panel">
        <h4>Preview</h4>
        <div class="preview-box">
          <img id="convert-preview" alt="Conversion preview" hidden />
          <p id="convert-empty" class="small-note">Preview will appear here after upload.</p>
        </div>
      </div>
    </div>
  `;

  const fileInput = document.getElementById('convert-file');
  const formatInput = document.getElementById('convert-format');
  const qualityInput = document.getElementById('convert-quality');
  const qualityValue = document.getElementById('convert-quality-value');
  const preview = document.getElementById('convert-preview');
  const empty = document.getElementById('convert-empty');

  qualityInput.addEventListener('input', () => {
    qualityValue.textContent = Number(qualityInput.value).toFixed(2);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    empty.hidden = true;
    setStatus('Image loaded', 'ok');
  });

  document.getElementById('convert-download').addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      setStatus('Upload an image first', 'warn');
      return;
    }
    try {
      setStatus('Converting image...');
      const img = await loadImageFromFile(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const mime = formatInput.value;
      const quality = Number(qualityInput.value);
      const blob = await canvasToBlob(canvas, mime, quality);
      downloadBlob(blob, `${stripExtension(file.name)}.${mimeToExtension(mime)}`);
      setStatus('Converted image downloaded', 'ok');
    } catch (error) {
      console.error(error);
      setStatus('Image conversion failed', 'error');
    }
  });
}

function renderImageEdit() {
  toolBody.innerHTML = `
    <div class="panel-grid two-col">
      <div class="panel">
        <h4>Basic image editor</h4>
        <div class="field">
          <label for="edit-file">Upload image</label>
          <input id="edit-file" type="file" accept="image/png,image/jpeg,image/webp" />
        </div>
        <div class="field">
          <label for="edit-brightness">Brightness: <span id="edit-brightness-value">100%</span></label>
          <input id="edit-brightness" type="range" min="50" max="160" step="1" value="100" />
        </div>
        <div class="field">
          <label>
            <input id="edit-grayscale" type="checkbox" />
            Apply grayscale
          </label>
        </div>
        <div class="action-grid">
          <button id="rotate-left" class="secondary-btn">Rotate Left</button>
          <button id="rotate-right" class="secondary-btn">Rotate Right</button>
          <button id="flip-horizontal" class="ghost-btn">Flip Horizontal</button>
          <button id="edit-reset" class="ghost-btn">Reset</button>
          <button id="edit-download" class="primary-btn">Download Edited Image</button>
        </div>
        <p class="small-note">This is a lightweight editor. More advanced editing can be layered on later.</p>
      </div>
      <div class="preview-panel">
        <h4>Canvas preview</h4>
        <div class="canvas-wrap">
          <canvas id="edit-canvas"></canvas>
        </div>
      </div>
    </div>
  `;

  const fileInput = document.getElementById('edit-file');
  const brightness = document.getElementById('edit-brightness');
  const brightnessValue = document.getElementById('edit-brightness-value');
  const grayscale = document.getElementById('edit-grayscale');
  const canvas = document.getElementById('edit-canvas');
  const ctx = canvas.getContext('2d');

  const state = {
    image: null,
    rotation: 0,
    flipX: false,
    brightness: 100,
    grayscale: false,
  };

  function resetAdjustments() {
    state.rotation = 0;
    state.flipX = false;
    state.brightness = 100;
    state.grayscale = false;
    brightness.value = '100';
    brightnessValue.textContent = '100%';
    grayscale.checked = false;
  }

  function renderCanvas() {
    if (!state.image) {
      canvas.width = 1;
      canvas.height = 1;
      ctx.clearRect(0, 0, 1, 1);
      return;
    }

    const normalizedRotation = ((state.rotation % 360) + 360) % 360;
    const swap = normalizedRotation === 90 || normalizedRotation === 270;
    canvas.width = swap ? state.image.height : state.image.width;
    canvas.height = swap ? state.image.width : state.image.height;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(state.flipX ? -1 : 1, 1);
    ctx.filter = `${state.grayscale ? 'grayscale(100%)' : 'grayscale(0%)'} brightness(${state.brightness}%)`;
    ctx.drawImage(state.image, -state.image.width / 2, -state.image.height / 2);
    ctx.restore();
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    state.image = await loadImageFromFile(file);
    resetAdjustments();
    renderCanvas();
    setStatus('Image ready for editing', 'ok');
  });

  brightness.addEventListener('input', () => {
    state.brightness = Number(brightness.value);
    brightnessValue.textContent = `${state.brightness}%`;
    renderCanvas();
  });

  grayscale.addEventListener('change', () => {
    state.grayscale = grayscale.checked;
    renderCanvas();
  });

  document.getElementById('rotate-left').addEventListener('click', () => {
    state.rotation -= 90;
    renderCanvas();
  });

  document.getElementById('rotate-right').addEventListener('click', () => {
    state.rotation += 90;
    renderCanvas();
  });

  document.getElementById('flip-horizontal').addEventListener('click', () => {
    state.flipX = !state.flipX;
    renderCanvas();
  });

  document.getElementById('edit-reset').addEventListener('click', () => {
    resetAdjustments();
    renderCanvas();
  });

  document.getElementById('edit-download').addEventListener('click', async () => {
    if (!state.image) {
      setStatus('Upload an image first', 'warn');
      return;
    }
    const blob = await canvasToBlob(canvas, 'image/png', 0.95);
    downloadBlob(blob, 'edited-image.png');
    setStatus('Edited image downloaded', 'ok');
  });

  renderCanvas();
}

function renderEPSPlaceholder() {
  toolBody.innerHTML = `
    <div class="placeholder-box">
      <h4>EPS conversion needs backend support</h4>
      <p>
        EPS is not handled the same way as PNG or JPEG. Browser-only conversion is usually unreliable.
      </p>
      <div class="note-box">
        <h4>Recommended production stack</h4>
        <p>Use Ghostscript on the server for:</p>
        <ul>
          <li>EPS → PDF</li>
          <li>EPS → PNG</li>
          <li>PDF → PNG</li>
          <li>PDF → EPS when required</li>
        </ul>
      </div>
      <div class="field">
        <label for="eps-placeholder">Planned upload field</label>
        <input id="eps-placeholder" type="file" accept=".eps,.pdf,.png,.jpg,.jpeg,.webp" disabled />
      </div>
      <button class="ghost-btn" disabled>Backend hook required</button>
    </div>
  `;
  setStatus('Backend required', 'warn');
}

function renderPdfRemovePages() {
  toolBody.innerHTML = `
    <div class="panel-grid two-col">
      <div class="panel">
        <h4>Remove pages from PDF</h4>
        <div class="field">
          <label for="pdf-file">Upload PDF</label>
          <input id="pdf-file" type="file" accept="application/pdf" />
        </div>
        <div class="field">
          <label for="pdf-pages">Pages to remove</label>
          <input id="pdf-pages" type="text" placeholder="Example: 1,3-5,8" />
          <div class="range-hint">Use one-based page numbers.</div>
        </div>
        <div class="button-row">
          <button id="pdf-remove-button" class="warning-btn">Remove Pages and Download</button>
        </div>
        <div id="pdf-meta" class="inline-metrics"></div>
      </div>
      <div class="note-box">
        <h4>How it works</h4>
        <p>
          This removes selected pages client-side in your browser using PDF-Lib.
          It does not upload the PDF anywhere from this static frontend.
        </p>
        <p>
          That is helpful for privacy, but it is different from full PDF editing.
        </p>
      </div>
    </div>
  `;

  const fileInput = document.getElementById('pdf-file');
  const pagesInput = document.getElementById('pdf-pages');
  const meta = document.getElementById('pdf-meta');
  let pdfBuffer = null;
  let pageCount = 0;

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    pdfBuffer = await file.arrayBuffer();
    const doc = await PDFLib.PDFDocument.load(pdfBuffer);
    pageCount = doc.getPageCount();
    meta.innerHTML = `
      <span class="metric-chip">File: ${file.name}</span>
      <span class="metric-chip">Pages: ${pageCount}</span>
      <span class="metric-chip">Size: ${formatBytes(file.size)}</span>
    `;
    setStatus('PDF loaded', 'ok');
  });

  document.getElementById('pdf-remove-button').addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file || !pdfBuffer) {
      setStatus('Upload a PDF first', 'warn');
      return;
    }

    try {
      const pagesToRemove = parsePageSelection(pagesInput.value, pageCount);
      if (pagesToRemove.size === 0) {
        setStatus('No pages selected to remove', 'warn');
        return;
      }
      if (pagesToRemove.size >= pageCount) {
        setStatus('You cannot remove every page', 'warn');
        return;
      }

      setStatus('Removing pages...');
      const sourcePdf = await PDFLib.PDFDocument.load(pdfBuffer);
      const outputPdf = await PDFLib.PDFDocument.create();
      const keepIndices = [];
      for (let i = 0; i < pageCount; i += 1) {
        if (!pagesToRemove.has(i + 1)) keepIndices.push(i);
      }

      const copiedPages = await outputPdf.copyPages(sourcePdf, keepIndices);
      copiedPages.forEach((page) => outputPdf.addPage(page));
      const bytes = await outputPdf.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${stripExtension(file.name)}-pages-removed.pdf`);
      setStatus('Updated PDF downloaded', 'ok');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Failed to process PDF', 'error');
    }
  });
}

function renderPdfEditPlaceholder() {
  toolBody.innerHTML = `
    <div class="placeholder-box">
      <h4>Reliable PDF text editing needs a stronger pipeline</h4>
      <p>
        PDFs are layout instructions, not always clean editable documents. A production system usually needs a backend service for stable results.
      </p>
      <div class="note-box">
        <h4>Recommended production approach</h4>
        <p>
          Extract text blocks, preserve coordinates, and write the edited content back with a controlled layout engine. For scanned PDFs, add OCR before editing.
        </p>
      </div>
      <div class="field">
        <label for="pdf-edit-upload">Planned PDF upload</label>
        <input id="pdf-edit-upload" type="file" accept="application/pdf" disabled />
      </div>
      <div class="field">
        <label for="pdf-edit-text">Planned find-and-replace text box</label>
        <textarea id="pdf-edit-text" placeholder="This will be wired to a backend editor" disabled></textarea>
      </div>
      <button class="ghost-btn" disabled>Needs backend PDF editor</button>
    </div>
  `;
  setStatus('Backend required', 'warn');
}

function renderDocxToPdfPlaceholder() {
  toolBody.innerHTML = `
    <div class="placeholder-box">
      <h4>DOCX to PDF</h4>
      <p>
        This should be done with LibreOffice headless on the backend if you want formatting to stay intact.
      </p>
      <div class="field">
        <label for="docx-upload">Planned DOCX upload</label>
        <input id="docx-upload" type="file" accept=".doc,.docx" disabled />
      </div>
      <button class="ghost-btn" disabled>Connect backend converter</button>
    </div>
  `;
  setStatus('Backend required', 'warn');
}

function renderPdfToDocxPlaceholder() {
  toolBody.innerHTML = `
    <div class="placeholder-box">
      <h4>PDF to DOCX</h4>
      <p>
        This should be handled by a dedicated conversion service or OCR-assisted pipeline depending on whether the PDF is digital or scanned.
      </p>
      <div class="field">
        <label for="pdf-docx-upload">Planned PDF upload</label>
        <input id="pdf-docx-upload" type="file" accept="application/pdf" disabled />
      </div>
      <button class="ghost-btn" disabled>Connect backend converter</button>
    </div>
  `;
  setStatus('Backend required', 'warn');
}

async function loadImageFromFile(file) {
  const dataUrl = await readFileAsDataURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create file blob'));
    }, mime, quality);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 2 : 1)} ${units[unitIndex]}`;
}

function mimeToExtension(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function stripExtension(filename) {
  return filename.replace(/\.[^.]+$/, '');
}

function parsePageSelection(value, maxPage) {
  const cleaned = value.trim();
  if (!cleaned) return new Set();

  const pages = new Set();
  const parts = cleaned.split(',').map((part) => part.trim()).filter(Boolean);

  parts.forEach((part) => {
    if (part.includes('-')) {
      const [startRaw, endRaw] = part.split('-').map((item) => Number(item.trim()));
      if (!Number.isInteger(startRaw) || !Number.isInteger(endRaw) || startRaw < 1 || endRaw < startRaw || endRaw > maxPage) {
        throw new Error(`Invalid page range: ${part}`);
      }
      for (let page = startRaw; page <= endRaw; page += 1) pages.add(page);
    } else {
      const page = Number(part);
      if (!Number.isInteger(page) || page < 1 || page > maxPage) {
        throw new Error(`Invalid page number: ${part}`);
      }
      pages.add(page);
    }
  });

  return pages;
}
