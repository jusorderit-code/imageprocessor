const toolTitle = document.getElementById('tool-title');
const toolDescription = document.getElementById('tool-description');
const toolBody = document.getElementById('tool-body');
const toolStatus = document.getElementById('tool-status');
const toolMode = document.getElementById('tool-mode');
const toolSearch = document.getElementById('tool-search');
const toolButtons = [...document.querySelectorAll('.tool-button')];

const tools = {
  'image-compress': {
    title: 'Compress Image',
    description: 'Upload an image, choose target width and quality, and download a smaller PNG, JPEG, or WebP copy.',
    mode: 'local',
    render: renderImageCompress,
  },
  'image-convert': {
    title: 'Convert Image',
    description: 'Convert raster images between PNG, JPEG, and WebP directly in the browser.',
    mode: 'local',
    render: renderImageConvert,
  },
  'image-edit': {
    title: 'Edit Image',
    description: 'Use a lightweight local editor for rotate, flip, grayscale, brightness, and contrast.',
    mode: 'local',
    render: renderImageEdit,
  },
  'images-to-pdf': {
    title: 'Images to PDF',
    description: 'Upload multiple images and export them into a single PDF without a server.',
    mode: 'local',
    render: renderImagesToPdf,
  },
  'pdf-remove-pages': {
    title: 'Remove PDF Pages',
    description: 'Remove selected pages like 1,3-5,8 from a PDF and download the result.',
    mode: 'local',
    render: renderPdfRemovePages,
  },
  'pdf-extract-pages': {
    title: 'Extract PDF Pages',
    description: 'Choose selected pages from a PDF and export only those pages as a new PDF.',
    mode: 'local',
    render: renderPdfExtractPages,
  },
  'pdf-to-images': {
    title: 'PDF to Images',
    description: 'Render PDF pages to PNG previews and download selected pages as images.',
    mode: 'local',
    render: renderPdfToImages,
  },
  'eps-convert': {
    title: 'EPS / PDF / PNG',
    description: 'Reliable EPS conversion needs a stronger backend or desktop conversion pipeline.',
    mode: 'advanced',
    render: renderEPSPlaceholder,
  },
  'pdf-edit': {
    title: 'Edit PDF Text',
    description: 'True PDF text editing is an advanced workflow and should use a layout-aware backend.',
    mode: 'advanced',
    render: renderPdfEditPlaceholder,
  },
  'docx-to-pdf': {
    title: 'DOCX to PDF',
    description: 'DOCX to PDF should use a mature converter when formatting needs to survive.',
    mode: 'advanced',
    render: renderDocxToPdfPlaceholder,
  },
  'pdf-to-docx': {
    title: 'PDF to DOCX',
    description: 'PDF to DOCX needs an extraction pipeline or OCR-aware backend for reliable results.',
    mode: 'advanced',
    render: renderPdfToDocxPlaceholder,
  },
};

let activeTool = localStorage.getItem('ip:last-tool') || 'image-compress';

initialize();

function initialize() {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  toolButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTool(button.dataset.tool));
  });

  toolSearch.addEventListener('input', () => {
    const query = toolSearch.value.trim().toLowerCase();
    toolButtons.forEach((button) => {
      const label = button.textContent.toLowerCase();
      button.classList.toggle('is-hidden', query && !label.includes(query));
    });
  });

  if (!tools[activeTool]) activeTool = 'image-compress';
  setActiveTool(activeTool);
}

function setActiveTool(toolId) {
  activeTool = toolId;
  localStorage.setItem('ip:last-tool', toolId);

  toolButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tool === toolId);
  });

  const tool = tools[toolId];
  toolTitle.textContent = tool.title;
  toolDescription.textContent = tool.description;
  toolMode.textContent = tool.mode === 'local' ? 'Local browser tool' : 'Advanced tool';
  toolMode.className = tool.mode === 'local' ? 'badge badge-live' : 'badge';
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
        <h4>Upload and compress</h4>
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
        </div>
        <div class="field">
          <label for="compress-width">Maximum width in pixels</label>
          <input id="compress-width" type="number" min="50" step="10" value="1600" />
        </div>
        <div class="button-row">
          <button id="compress-generate" class="secondary-btn">Generate Preview</button>
          <button id="compress-download" class="primary-btn">Download Output</button>
          <button id="compress-reset" class="ghost-btn">Reset</button>
        </div>
        <div id="compress-meta" class="inline-metrics"></div>
      </div>
      <div class="preview-panel">
        <h4>Preview</h4>
        <div class="preview-box">
          <img id="compress-preview" alt="Compressed preview" hidden />
          <p id="compress-empty" class="small-note">Upload a PNG, JPEG, or WebP image to start.</p>
        </div>
      </div>
    </div>
  `;

  const fileInput = document.getElementById('compress-file');
  const formatInput = document.getElementById('compress-format');
  const qualityInput = document.getElementById('compress-quality');
  const qualityValue = document.getElementById('compress-quality-value');
  const widthInput = document.getElementById('compress-width');
  const meta = document.getElementById('compress-meta');
  const preview = document.getElementById('compress-preview');
  const empty = document.getElementById('compress-empty');

  let outputBlob = null;

  qualityInput.addEventListener('input', () => {
    qualityValue.textContent = Number(qualityInput.value).toFixed(2);
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    empty.hidden = true;
    const image = await loadImageFromFile(file);
    meta.innerHTML = `
      <span class="metric-chip">Original size: ${formatBytes(file.size)}</span>
      <span class="metric-chip">Dimensions: ${image.width} × ${image.height}</span>
    `;
    outputBlob = null;
    setStatus('Image loaded', 'ok');
  });

  document.getElementById('compress-generate').addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      setStatus('Upload an image first', 'warn');
      return;
    }

    try {
      setStatus('Generating compressed preview...');
      const image = await loadImageFromFile(file);
      const mime = formatInput.value;
      const quality = Number(qualityInput.value);
      const maxWidth = Math.max(1, Number(widthInput.value) || image.width);
      outputBlob = await rasterTransformFromImage(image, {
        mime,
        quality,
        maxWidth,
      });

      preview.src = URL.createObjectURL(outputBlob);
      preview.hidden = false;
      empty.hidden = true;
      meta.innerHTML += `<span class="metric-chip">Output size: ${formatBytes(outputBlob.size)}</span>`;
      setStatus('Compressed preview ready', 'ok');
    } catch (error) {
      console.error(error);
      setStatus('Could not compress image', 'error');
    }
  });

  document.getElementById('compress-download').addEventListener('click', async () => {
    if (!outputBlob) {
      document.getElementById('compress-generate').click();
      return;
    }
    const file = fileInput.files?.[0];
    downloadBlob(outputBlob, `${stripExtension(file.name)}-compressed.${mimeToExtension(formatInput.value)}`);
    setStatus('Compressed image downloaded', 'ok');
  });

  document.getElementById('compress-reset').addEventListener('click', () => {
    setActiveTool('image-compress');
  });
}

function renderImageConvert() {
  toolBody.innerHTML = `
    <div class="panel-grid two-col">
      <div class="panel">
        <h4>Convert raster image</h4>
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
          <button id="convert-button" class="primary-btn">Convert and Download</button>
        </div>
        <p class="small-note">This is for raster images only. EPS is separated because it needs a stronger pipeline.</p>
      </div>
      <div class="preview-panel">
        <h4>Preview</h4>
        <div class="preview-box">
          <img id="convert-preview" alt="Conversion preview" hidden />
          <p id="convert-empty" class="small-note">Preview appears here after upload.</p>
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

  document.getElementById('convert-button').addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      setStatus('Upload an image first', 'warn');
      return;
    }

    try {
      setStatus('Converting image...');
      const image = await loadImageFromFile(file);
      const outputBlob = await rasterTransformFromImage(image, {
        mime: formatInput.value,
        quality: Number(qualityInput.value),
      });
      downloadBlob(outputBlob, `${stripExtension(file.name)}.${mimeToExtension(formatInput.value)}`);
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
          <label for="edit-contrast">Contrast: <span id="edit-contrast-value">100%</span></label>
          <input id="edit-contrast" type="range" min="50" max="180" step="1" value="100" />
        </div>
        <div class="field">
          <label><input id="edit-grayscale" type="checkbox" /> Apply grayscale</label>
        </div>
        <div class="action-grid">
          <button id="rotate-left" class="secondary-btn">Rotate Left</button>
          <button id="rotate-right" class="secondary-btn">Rotate Right</button>
          <button id="flip-horizontal" class="ghost-btn">Flip Horizontal</button>
          <button id="edit-reset" class="ghost-btn">Reset</button>
          <button id="edit-download" class="primary-btn">Download Edited Image</button>
        </div>
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
  const contrast = document.getElementById('edit-contrast');
  const contrastValue = document.getElementById('edit-contrast-value');
  const grayscale = document.getElementById('edit-grayscale');
  const canvas = document.getElementById('edit-canvas');
  const ctx = canvas.getContext('2d');

  const state = {
    image: null,
    rotation: 0,
    flipX: false,
    brightness: 100,
    contrast: 100,
    grayscale: false,
  };

  function resetAdjustments() {
    state.rotation = 0;
    state.flipX = false;
    state.brightness = 100;
    state.contrast = 100;
    state.grayscale = false;
    brightness.value = '100';
    brightnessValue.textContent = '100%';
    contrast.value = '100';
    contrastValue.textContent = '100%';
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
    ctx.filter = `${state.grayscale ? 'grayscale(100%)' : 'grayscale(0%)'} brightness(${state.brightness}%) contrast(${state.contrast}%)`;
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

  contrast.addEventListener('input', () => {
    state.contrast = Number(contrast.value);
    contrastValue.textContent = `${state.contrast}%`;
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

function renderImagesToPdf() {
  toolBody.innerHTML = `
    <div class="panel-grid two-col">
      <div class="panel">
        <h4>Convert images to one PDF</h4>
        <div class="field">
          <label for="images-pdf-files">Upload one or more images</label>
          <input id="images-pdf-files" type="file" accept="image/png,image/jpeg,image/webp" multiple />
        </div>
        <div class="field">
          <label for="images-pdf-margin">Page margin (points)</label>
          <input id="images-pdf-margin" type="number" min="0" step="2" value="20" />
        </div>
        <div class="button-row">
          <button id="images-pdf-generate" class="primary-btn">Create PDF and Download</button>
        </div>
        <div id="images-pdf-meta" class="inline-metrics"></div>
      </div>
      <div class="preview-panel">
        <h4>Queued images</h4>
        <div id="images-pdf-preview" class="thumbs-grid">
          <p class="small-note">Image thumbnails will appear here after upload.</p>
        </div>
      </div>
    </div>
  `;

  const fileInput = document.getElementById('images-pdf-files');
  const marginInput = document.getElementById('images-pdf-margin');
  const preview = document.getElementById('images-pdf-preview');
  const meta = document.getElementById('images-pdf-meta');

  fileInput.addEventListener('change', () => {
    const files = [...(fileInput.files || [])];
    if (!files.length) return;

    preview.innerHTML = files.map((file, index) => `
      <div class="thumb-card">
        <img src="${URL.createObjectURL(file)}" alt="Uploaded image ${index + 1}" />
        <div class="page-tag">${file.name}</div>
      </div>
    `).join('');

    meta.innerHTML = `
      <span class="metric-chip">Images: ${files.length}</span>
      <span class="metric-chip">Total size: ${formatBytes(files.reduce((sum, file) => sum + file.size, 0))}</span>
    `;
    setStatus('Images queued', 'ok');
  });

  document.getElementById('images-pdf-generate').addEventListener('click', async () => {
    const files = [...(fileInput.files || [])];
    if (!files.length) {
      setStatus('Upload at least one image', 'warn');
      return;
    }

    try {
      setStatus('Building PDF...');
      const margin = Math.max(0, Number(marginInput.value) || 0);
      const pdfDoc = await PDFLib.PDFDocument.create();

      for (const file of files) {
        const image = await loadImageFromFile(file);
        const jpegBlob = await rasterTransformFromImage(image, {
          mime: 'image/jpeg',
          quality: 0.92,
        });
        const imageBytes = new Uint8Array(await jpegBlob.arrayBuffer());
        const embedded = await pdfDoc.embedJpg(imageBytes);
        const page = pdfDoc.addPage([embedded.width + margin * 2, embedded.height + margin * 2]);
        page.drawImage(embedded, {
          x: margin,
          y: margin,
          width: embedded.width,
          height: embedded.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'images-to-pdf.pdf');
      setStatus('PDF downloaded', 'ok');
    } catch (error) {
      console.error(error);
      setStatus('Could not create PDF', 'error');
    }
  });
}

function renderPdfRemovePages() {
  toolBody.innerHTML = `
    <div class="panel-grid two-col">
      <div class="panel">
        <h4>Remove pages from PDF</h4>
        <div class="field">
          <label for="pdf-remove-file">Upload PDF</label>
          <input id="pdf-remove-file" type="file" accept="application/pdf" />
        </div>
        <div class="field">
          <label for="pdf-remove-pages">Pages to remove</label>
          <input id="pdf-remove-pages" type="text" placeholder="Example: 1,3-5,8" />
          <div class="range-hint">Use normal one-based page numbers.</div>
        </div>
        <div class="button-row">
          <button id="pdf-remove-button" class="warning-btn">Remove Pages and Download</button>
        </div>
        <div id="pdf-remove-meta" class="inline-metrics"></div>
      </div>
      <div class="note-box">
        <h4>Local workflow</h4>
        <p>This runs in the browser using PDF-Lib and does not need an external server for standard PDFs.</p>
      </div>
    </div>
  `;

  setupPdfSelectionTool({
    fileInputId: 'pdf-remove-file',
    selectionInputId: 'pdf-remove-pages',
    actionButtonId: 'pdf-remove-button',
    metaId: 'pdf-remove-meta',
    mode: 'remove',
  });
}

function renderPdfExtractPages() {
  toolBody.innerHTML = `
    <div class="panel-grid two-col">
      <div class="panel">
        <h4>Extract selected pages</h4>
        <div class="field">
          <label for="pdf-extract-file">Upload PDF</label>
          <input id="pdf-extract-file" type="file" accept="application/pdf" />
        </div>
        <div class="field">
          <label for="pdf-extract-pages">Pages to extract</label>
          <input id="pdf-extract-pages" type="text" placeholder="Example: 1,3-5,8" />
          <div class="range-hint">Use normal one-based page numbers.</div>
        </div>
        <div class="button-row">
          <button id="pdf-extract-button" class="primary-btn">Extract Pages and Download</button>
        </div>
        <div id="pdf-extract-meta" class="inline-metrics"></div>
      </div>
      <div class="note-box">
        <h4>Use case</h4>
        <p>This is helpful when someone only wants a few pages from a larger document without opening desktop software.</p>
      </div>
    </div>
  `;

  setupPdfSelectionTool({
    fileInputId: 'pdf-extract-file',
    selectionInputId: 'pdf-extract-pages',
    actionButtonId: 'pdf-extract-button',
    metaId: 'pdf-extract-meta',
    mode: 'extract',
  });
}

function setupPdfSelectionTool({ fileInputId, selectionInputId, actionButtonId, metaId, mode }) {
  const fileInput = document.getElementById(fileInputId);
  const selectionInput = document.getElementById(selectionInputId);
  const meta = document.getElementById(metaId);

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

  document.getElementById(actionButtonId).addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file || !pdfBuffer) {
      setStatus('Upload a PDF first', 'warn');
      return;
    }

    try {
      const selectedPages = parsePageSelection(selectionInput.value, pageCount);
      if (selectedPages.size === 0) {
        setStatus(`No pages selected to ${mode}`, 'warn');
        return;
      }

      setStatus(mode === 'remove' ? 'Removing pages...' : 'Extracting pages...');
      const sourcePdf = await PDFLib.PDFDocument.load(pdfBuffer);
      const outputPdf = await PDFLib.PDFDocument.create();

      const pageIndices = [];
      for (let i = 0; i < pageCount; i += 1) {
        const pageNumber = i + 1;
        if (mode === 'remove' && !selectedPages.has(pageNumber)) pageIndices.push(i);
        if (mode === 'extract' && selectedPages.has(pageNumber)) pageIndices.push(i);
      }

      if (!pageIndices.length) {
        setStatus(mode === 'remove' ? 'You cannot remove every page' : 'No pages available after selection', 'warn');
        return;
      }

      const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => outputPdf.addPage(page));

      const bytes = await outputPdf.save();
      const suffix = mode === 'remove' ? 'pages-removed' : 'extracted-pages';
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${stripExtension(file.name)}-${suffix}.pdf`);
      setStatus('Updated PDF downloaded', 'ok');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Failed to process PDF', 'error');
    }
  });
}

function renderPdfToImages() {
  toolBody.innerHTML = `
    <div class="panel-grid two-col">
      <div class="panel">
        <h4>Render PDF pages to PNG</h4>
        <div class="field">
          <label for="pdf-images-file">Upload PDF</label>
          <input id="pdf-images-file" type="file" accept="application/pdf" />
        </div>
        <div class="field">
          <label for="pdf-images-pages">Pages to render</label>
          <input id="pdf-images-pages" type="text" placeholder="Leave blank for all pages, or use 1,3-5" />
        </div>
        <div class="field">
          <label for="pdf-images-scale">Render scale</label>
          <input id="pdf-images-scale" type="number" min="0.5" step="0.25" value="1.5" />
        </div>
        <div class="button-row">
          <button id="pdf-images-render" class="secondary-btn">Render Pages</button>
          <button id="pdf-images-zip" class="primary-btn">Download All as ZIP</button>
        </div>
        <div id="pdf-images-meta" class="inline-metrics"></div>
      </div>
      <div class="preview-panel">
        <h4>Rendered pages</h4>
        <div id="pdf-images-output" class="rendered-pages">
          <p class="small-note">Rendered pages will appear here after processing.</p>
        </div>
      </div>
    </div>
  `;

  const fileInput = document.getElementById('pdf-images-file');
  const pagesInput = document.getElementById('pdf-images-pages');
  const scaleInput = document.getElementById('pdf-images-scale');
  const output = document.getElementById('pdf-images-output');
  const meta = document.getElementById('pdf-images-meta');

  let pdfBytes = null;
  let pdfPageCount = 0;
  let renderedPages = [];

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    pdfBytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    pdfPageCount = pdf.numPages;
    renderedPages = [];
    output.innerHTML = '<p class="small-note">PDF loaded. Click render to generate images.</p>';
    meta.innerHTML = `
      <span class="metric-chip">File: ${file.name}</span>
      <span class="metric-chip">Pages: ${pdfPageCount}</span>
      <span class="metric-chip">Size: ${formatBytes(file.size)}</span>
    `;
    setStatus('PDF ready for rendering', 'ok');
  });

  document.getElementById('pdf-images-render').addEventListener('click', async () => {
    if (!pdfBytes) {
      setStatus('Upload a PDF first', 'warn');
      return;
    }

    try {
      setStatus('Rendering PDF pages...');
      const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      const selectedPages = pagesInput.value.trim()
        ? [...parsePageSelection(pagesInput.value, pdfPageCount)].sort((a, b) => a - b)
        : Array.from({ length: pdfPageCount }, (_, index) => index + 1);

      const scale = Math.max(0.5, Number(scaleInput.value) || 1.5);
      renderedPages = [];
      output.innerHTML = '';

      for (const pageNumber of selectedPages) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const blob = await canvasToBlob(canvas, 'image/png', 1);
        renderedPages.push({ pageNumber, blob });

        const card = document.createElement('div');
        card.className = 'rendered-page';

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = canvas.height;
        pageCanvas.getContext('2d').drawImage(canvas, 0, 0);

        const actions = document.createElement('div');
        actions.className = 'rendered-page-actions';
        actions.innerHTML = `
          <span class="page-tag">Page ${pageNumber}</span>
          <button class="ghost-btn" data-page="${pageNumber}">Download PNG</button>
        `;

        actions.querySelector('button').addEventListener('click', () => {
          downloadBlob(blob, `page-${pageNumber}.png`);
        });

        card.appendChild(pageCanvas);
        card.appendChild(actions);
        output.appendChild(card);
      }

      if (!renderedPages.length) {
        output.innerHTML = '<p class="small-note">No pages were rendered.</p>';
      }

      setStatus('Rendered pages ready', 'ok');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'PDF rendering failed', 'error');
    }
  });

  document.getElementById('pdf-images-zip').addEventListener('click', async () => {
    if (!renderedPages.length) {
      setStatus('Render pages first', 'warn');
      return;
    }

    try {
      setStatus('Building ZIP file...');
      const zip = new JSZip();
      renderedPages.forEach(({ pageNumber, blob }) => {
        zip.file(`page-${pageNumber}.png`, blob);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'pdf-pages-images.zip');
      setStatus('ZIP downloaded', 'ok');
    } catch (error) {
      console.error(error);
      setStatus('Could not build ZIP file', 'error');
    }
  });
}

function renderEPSPlaceholder() {
  toolBody.innerHTML = `
    <div class="placeholder-box">
      <h4>EPS conversion is not a simple browser tool</h4>
      <p>EPS is PostScript-based. Reliable conversion usually needs Ghostscript or a similar pipeline outside the browser.</p>
      <div class="note-box">
        <h4>Recommended stack later</h4>
        <p>Use Ghostscript for EPS to PDF, EPS to PNG, and related conversions when you move beyond the free static mode.</p>
      </div>
    </div>
  `;
  setStatus('Advanced workflow', 'warn');
}

function renderPdfEditPlaceholder() {
  toolBody.innerHTML = `
    <div class="placeholder-box">
      <h4>Real PDF text editing stays advanced</h4>
      <p>PDFs are layout instructions, not simple editable text files. Production-grade editing needs a layout-aware service.</p>
      <div class="note-box">
        <h4>What a serious version needs</h4>
        <p>Text extraction, coordinate preservation, optional OCR for scanned PDFs, and controlled reflow or redrawing.</p>
      </div>
    </div>
  `;
  setStatus('Advanced workflow', 'warn');
}

function renderDocxToPdfPlaceholder() {
  toolBody.innerHTML = `
    <div class="placeholder-box">
      <h4>DOCX to PDF is advanced for a reason</h4>
      <p>When equations, tables, and page breaks matter, use a mature converter such as LibreOffice headless on the backend.</p>
    </div>
  `;
  setStatus('Advanced workflow', 'warn');
}

function renderPdfToDocxPlaceholder() {
  toolBody.innerHTML = `
    <div class="placeholder-box">
      <h4>PDF to DOCX needs extraction logic</h4>
      <p>Reliable conversion usually needs OCR, structural extraction, and reconstruction of editable paragraphs and tables.</p>
    </div>
  `;
  setStatus('Advanced workflow', 'warn');
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

async function rasterTransformFromImage(image, { mime, quality = 0.92, maxWidth = image.width }) {
  const scale = Math.min(1, maxWidth / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, mime, quality);
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
  setTimeout(() => URL.revokeObjectURL(url), 1500);
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
