(function () {
  const fileInput = document.getElementById('saveEditorFileInput');
  const controls = document.getElementById('saveEditorControls');
  const statusEl = document.getElementById('saveEditorStatus');
  const noteEl = document.getElementById('saveEditorNote');
  const panelEl = document.getElementById('saveEditorPanel');
  const modeSelect = document.getElementById('saveEditorMode');
  const downloadBtn = document.getElementById('saveEditorDownload');
  const downloadBtnBottom = document.getElementById('saveEditorDownloadBottom');

  if (!fileInput || !controls || !statusEl || !noteEl || !panelEl || !modeSelect || !downloadBtn || !downloadBtnBottom) {
    return;
  }

  // Mirror the original behavior: controls only appear after a valid file is parsed.
  controls.hidden = true;
  statusEl.hidden = true;

  const state = {
    file: null,
    fileType: null,
    fileData: null,
    editorMode: 'normal',
    openState: new Map(),
  };

  const returnPrefix = /^\s*return\s+/;
  const stringKeys = /\["(.*?)"\]=/g;
  const numberKeys = /\[(\d+)\]=/g;
  const trailingObjectCommas = /,}/g;
  const trailingArrayCommas = /,]/g;

  const numberKey = /"NOSTRING_(\d+)":/g;
  const stringKey = /"([^"]*?)":/g;

  const MODE_NOTES = {
    normal: 'Normal mode is the safest way to edit. Always back up your save first.',
    json: 'JSON mode is powerful but easier to break. Edit carefully and keep backups.',
    raw: 'Raw mode edits the underlying Lua-style table. Use only if you know what you are doing.',
  };

  const MAX_ARRAY_PREVIEW = 200;

  function setStatus(message, type) {
    const hasMessage = Boolean(message);
    statusEl.hidden = !hasMessage;
    statusEl.textContent = hasMessage ? message : '';
    statusEl.classList.remove('error', 'success');
    if (hasMessage && type) {
      statusEl.classList.add(type);
    }
  }

  function updateNote() {
    noteEl.textContent = MODE_NOTES[state.editorMode] || MODE_NOTES.normal;
    if (state.fileType === 'save' && state.editorMode === 'normal') {
      noteEl.textContent = 'Save files can be very large. If this view feels slow, switch to JSON mode.';
    }
  }

  function isMobile() {
    const patterns = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i,
    ];

    if (typeof navigator === 'undefined' || !navigator.userAgent) {
      return false;
    }

    return patterns.some((pattern) => pattern.test(navigator.userAgent));
  }

  function supportsCompressionStreams() {
    return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
  }

  async function streamToUint8Array(stream) {
    const arrayBuffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  async function decompressRaw(buffer) {
    if (!supportsCompressionStreams()) {
      throw new Error('This browser does not support CompressionStream/DecompressionStream. Please use a recent version of Chrome or Edge.');
    }

    let stream;
    try {
      const ds = new DecompressionStream('deflate-raw');
      stream = new Blob([buffer]).stream().pipeThrough(ds);
    } catch (err) {
      throw new Error('Your browser cannot decompress deflate-raw data. Please use a recent version of Chrome or Edge.');
    }

    const bytes = await streamToUint8Array(stream);
    return new TextDecoder().decode(bytes);
  }

  async function compressRaw(text) {
    if (!supportsCompressionStreams()) {
      throw new Error('This browser does not support CompressionStream/DecompressionStream. Please use a recent version of Chrome or Edge.');
    }

    let stream;
    try {
      const cs = new CompressionStream('deflate-raw');
      stream = new Blob([text]).stream().pipeThrough(cs);
    } catch (err) {
      throw new Error('Your browser cannot compress deflate-raw data. Please use a recent version of Chrome or Edge.');
    }

    return streamToUint8Array(stream);
  }

  function rawToJSON(data) {
    return JSON.parse(
      data
        .replace(returnPrefix, '')
        .replace(stringKeys, '"$1":')
        .replace(numberKeys, '"NOSTRING_$1":')
        .replace(trailingObjectCommas, '}')
        .replace(trailingArrayCommas, ']')
    );
  }

  function fixJSONArrays(json) {
    if (typeof json !== 'object' || json === null) {
      return json;
    }

    const keys = Object.keys(json);
    if (keys.length === 0) {
      return json;
    }

    const allNoString = keys.every((key) => key.startsWith('NOSTRING_'));
    if (!allNoString) {
      for (const key of keys) {
        json[key] = fixJSONArrays(json[key]);
      }
      return json;
    }

    const array = [];
    for (const key of keys) {
      const idx = parseInt(key.slice(9), 10) - 1;
      array[idx] = fixJSONArrays(json[key]);
    }
    return array;
  }

  function fixLuaArrays(json) {
    if (Array.isArray(json)) {
      const arrayObj = {};
      for (let i = 0; i < json.length; i += 1) {
        arrayObj[`NOSTRING_${i + 1}`] = fixLuaArrays(json[i]);
      }
      return arrayObj;
    }

    if (typeof json === 'object' && json !== null) {
      const next = {};
      for (const key of Object.keys(json)) {
        next[key] = fixLuaArrays(json[key]);
      }
      return next;
    }

    return json;
  }

  function jsonToRaw(data) {
    return `return ${JSON.stringify(data)
      .replace(numberKey, '[$1]=')
      .replace(stringKey, '["$1"]=')}`;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  async function processFile(buffer) {
    const data = await decompressRaw(buffer);
    const json = rawToJSON(data);

    if (json.GRAPHICS) {
      json.GRAPHICS.shadows = json.GRAPHICS.shadows === 'On';
    }

    return fixJSONArrays(json);
  }

  async function processJSON(json) {
    const clone = deepClone(json);
    const luaStyle = fixLuaArrays(clone);

    if (luaStyle.GRAPHICS) {
      luaStyle.GRAPHICS.shadows = luaStyle.GRAPHICS.shadows ? 'On' : 'Off';
    }

    const raw = jsonToRaw(luaStyle);
    return compressRaw(raw);
  }

  function getFileType(fileName) {
    const lower = String(fileName || '').toLowerCase();
    if (lower.includes('settings')) return 'settings';
    if (lower.includes('meta')) return 'meta';
    if (lower.includes('profile')) return 'profile';
    if (lower.includes('save')) return 'save';
    return null;
  }

  function setValueAtPath(root, path, value) {
    if (!root || !path.length) return;
    let cur = root;
    for (let i = 0; i < path.length - 1; i += 1) {
      cur = cur[path[i]];
      if (cur === undefined || cur === null) {
        return;
      }
    }
    cur[path[path.length - 1]] = value;
  }

  function pathKey(path) {
    return path
      .map((part) => (typeof part === 'number' ? `[${part}]` : String(part)))
      .join('::');
  }

  function rememberOpenState(detailsEl, path, defaultOpen) {
    const key = pathKey(path);
    const stored = state.openState.get(key);
    detailsEl.open = typeof stored === 'boolean' ? stored : defaultOpen;
    detailsEl.addEventListener('toggle', () => {
      state.openState.set(key, detailsEl.open);
    });
  }

  function createFieldRow(labelText, controlEl) {
    const row = document.createElement('div');
    row.className = 'save-editor-field';

    const label = document.createElement('div');
    label.className = 'save-editor-label';
    label.textContent = labelText;

    row.appendChild(label);
    row.appendChild(controlEl);

    return row;
  }

  function coerceNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function renderPrimitive(key, value, path, container) {
    if (typeof value === 'boolean') {
      const wrapper = document.createElement('label');
      wrapper.className = 'save-editor-checkbox';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = value;
      input.addEventListener('change', () => {
        setValueAtPath(state.fileData, path, input.checked);
      });

      const text = document.createElement('span');
      text.textContent = value ? 'True' : 'False';

      input.addEventListener('change', () => {
        text.textContent = input.checked ? 'True' : 'False';
      });

      wrapper.appendChild(input);
      wrapper.appendChild(text);

      container.appendChild(createFieldRow(key, wrapper));
      return;
    }

    const input = document.createElement('input');
    input.className = 'save-editor-input';

    if (typeof value === 'number') {
      input.type = 'number';
      input.step = 'any';
      input.value = String(value);

      const updateNumber = () => {
        const raw = input.value.trim();
        if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
          return;
        }
        const next = coerceNumber(raw, value);
        setValueAtPath(state.fileData, path, next);
      };

      input.addEventListener('input', updateNumber);
      input.addEventListener('change', updateNumber);
    } else {
      input.type = 'text';
      input.value = value == null ? '' : String(value);
      input.addEventListener('input', () => {
        setValueAtPath(state.fileData, path, input.value);
      });
    }

    container.appendChild(createFieldRow(key, input));
  }

  function renderArray(array, key, path, container, depth) {
    const details = document.createElement('details');
    details.className = 'save-editor-section';
    rememberOpenState(details, path, depth < 2);

    const summary = document.createElement('summary');
    summary.textContent = `${key} [${array.length}]`;

    const body = document.createElement('div');
    body.className = 'save-editor-section-body';

    const arrayBox = document.createElement('div');
    arrayBox.className = 'save-editor-array';

    const meta = document.createElement('div');
    meta.className = 'save-editor-array-meta';

    const metaText = document.createElement('span');
    metaText.textContent = `Length: ${array.length}`;

    const metaHint = document.createElement('span');
    metaHint.textContent = array.length > MAX_ARRAY_PREVIEW ? `Showing first ${MAX_ARRAY_PREVIEW}` : 'Preview';

    meta.appendChild(metaText);
    meta.appendChild(metaHint);

    const list = document.createElement('div');
    list.className = 'save-editor-array-list';

    const limit = array.length > MAX_ARRAY_PREVIEW ? MAX_ARRAY_PREVIEW : array.length;
    for (let i = 0; i < limit; i += 1) {
      renderValue(String(i), array[i], path.concat(i), list, depth + 1);
    }

    if (array.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'save-editor-empty';
      empty.textContent = 'This array is empty.';
      list.appendChild(empty);
    }

    if (array.length > MAX_ARRAY_PREVIEW) {
      const expandBtn = document.createElement('button');
      expandBtn.type = 'button';
      expandBtn.className = 'save-editor-btn';
      expandBtn.textContent = 'Render All Items';
      expandBtn.addEventListener('click', () => {
        expandBtn.disabled = true;
        metaHint.textContent = 'Showing all items';
        for (let i = MAX_ARRAY_PREVIEW; i < array.length; i += 1) {
          renderValue(String(i), array[i], path.concat(i), list, depth + 1);
        }
      });
      arrayBox.appendChild(expandBtn);
    }

    arrayBox.appendChild(meta);
    arrayBox.appendChild(list);
    body.appendChild(arrayBox);

    details.appendChild(summary);
    details.appendChild(body);
    container.appendChild(details);
  }

  function renderObject(obj, key, path, container, depth) {
    const details = document.createElement('details');
    details.className = 'save-editor-section';
    rememberOpenState(details, path, depth === 0);

    const summary = document.createElement('summary');
    const count = Object.keys(obj).length;
    summary.textContent = `${key} {${count}}`;

    const body = document.createElement('div');
    body.className = 'save-editor-section-body';

    const keys = Object.keys(obj);
    keys.sort((a, b) => a.localeCompare(b));

    for (const childKey of keys) {
      renderValue(childKey, obj[childKey], path.concat(childKey), body, depth + 1);
    }

    if (keys.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'save-editor-empty';
      empty.textContent = 'This object has no fields.';
      body.appendChild(empty);
    }

    details.appendChild(summary);
    details.appendChild(body);
    container.appendChild(details);
  }

  function renderValue(key, value, path, container, depth) {
    if (Array.isArray(value)) {
      renderArray(value, key, path, container, depth);
      return;
    }

    if (typeof value === 'object' && value !== null) {
      renderObject(value, key, path, container, depth);
      return;
    }

    renderPrimitive(key, value, path, container);
  }

  function renderNormalEditor() {
    panelEl.innerHTML = '';

    if (!state.fileData || typeof state.fileData !== 'object') {
      const empty = document.createElement('div');
      empty.className = 'save-editor-empty';
      empty.textContent = 'No data loaded yet.';
      panelEl.appendChild(empty);
      return;
    }

    const rootKeys = Object.keys(state.fileData);
    rootKeys.sort((a, b) => a.localeCompare(b));

    if (rootKeys.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'save-editor-empty';
      empty.textContent = 'This file has no editable keys.';
      panelEl.appendChild(empty);
      return;
    }

    for (const key of rootKeys) {
      renderValue(key, state.fileData[key], [key], panelEl, 0);
    }
  }

  function renderJsonEditor() {
    panelEl.innerHTML = '';

    const errorEl = document.createElement('div');
    errorEl.className = 'save-editor-raw-error';

    const textarea = document.createElement('textarea');
    textarea.className = 'save-editor-textarea';
    textarea.value = JSON.stringify(state.fileData, null, 2);

    textarea.addEventListener('input', () => {
      const raw = textarea.value;
      try {
        const parsed = JSON.parse(raw);
        state.fileData = parsed;
        errorEl.textContent = '';
      } catch (err) {
        errorEl.textContent = (err && err.message) ? err.message : 'Invalid JSON.';
      }
    });

    panelEl.appendChild(errorEl);
    panelEl.appendChild(textarea);
  }

  function renderRawEditor() {
    panelEl.innerHTML = '';

    const errorEl = document.createElement('div');
    errorEl.className = 'save-editor-raw-error';

    const textarea = document.createElement('textarea');
    textarea.className = 'save-editor-textarea';

    let rawText = '';
    try {
      const luaReady = fixLuaArrays(deepClone(state.fileData));
      if (luaReady.GRAPHICS) {
        luaReady.GRAPHICS.shadows = luaReady.GRAPHICS.shadows ? 'On' : 'Off';
      }
      rawText = jsonToRaw(luaReady);
    } catch (err) {
      rawText = '';
      errorEl.textContent = 'Unable to render raw data.';
    }

    textarea.value = rawText;

    textarea.addEventListener('input', () => {
      const raw = textarea.value;
      try {
        const parsed = rawToJSON(raw);
        if (parsed.GRAPHICS) {
          parsed.GRAPHICS.shadows = parsed.GRAPHICS.shadows === 'On';
        }
        state.fileData = fixJSONArrays(parsed);
        errorEl.textContent = '';
      } catch (err) {
        errorEl.textContent = (err && err.message) ? err.message : 'Invalid raw data.';
      }
    });

    panelEl.appendChild(errorEl);
    panelEl.appendChild(textarea);
  }

  function renderMode() {
    updateNote();

    if (!state.fileData) {
      panelEl.innerHTML = '';
      return;
    }

    if (state.editorMode === 'json') {
      renderJsonEditor();
      return;
    }

    if (state.editorMode === 'raw') {
      renderRawEditor();
      return;
    }

    renderNormalEditor();
  }

  async function handleFile(file) {
    state.file = file;
    state.fileType = getFileType(file.name);
    state.fileData = null;
    state.openState.clear();

    if (!state.fileType) {
      controls.hidden = true;
      setStatus(`Unknown file type '${file.name}'. It must include settings, meta, profile, or save.`, 'error');
      return;
    }

    setStatus('');

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const json = await processFile(buffer);
      state.fileData = json;
      controls.hidden = false;
      setStatus('');
      renderMode();
    } catch (err) {
      controls.hidden = true;
      const message = err && err.message ? err.message : 'There was an error parsing the file.';
      setStatus(message, 'error');
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  async function download() {
    if (!state.fileData || !state.file) {
      setStatus('Load a .jkr file first.', 'error');
      return;
    }

    setStatus('');

    try {
      const rawData = await processJSON(state.fileData);
      const blob = new Blob([rawData]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = state.file.name;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('');
    } catch (err) {
      const message = err && err.message ? err.message : 'Failed to build the download.';
      setStatus(message, 'error');
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  modeSelect.addEventListener('change', () => {
    state.editorMode = modeSelect.value;
    renderMode();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    handleFile(file);
  });

  downloadBtn.addEventListener('click', download);
  downloadBtnBottom.addEventListener('click', download);

  if (isMobile()) {
    fileInput.disabled = true;
    controls.hidden = true;
    setStatus('The save editor is not supported on mobile yet. Please use a desktop browser.', 'error');
    return;
  }

  if (!supportsCompressionStreams()) {
    setStatus('This browser cannot load .jkr files. Please use a recent version of Chrome or Edge.', 'error');
  } else {
    setStatus('');
  }
})();
