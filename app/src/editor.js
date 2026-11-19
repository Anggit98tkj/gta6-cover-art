// Wires the editor: photo slots, layout and grade buttons, caption fields, drag-to-crop
// on the preview, frames, stickers, keyboard shortcuts, shuffle, and the PNG export.
// Photos are read on this machine only, never uploaded.
import { LAYOUTS, GRADES, SIZES, FRAMES, STICKERS, panelsFor, drawPoster, defaultSticker } from './poster.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('preview');
const statusEl = document.getElementById('status');
const sizeLabel = document.getElementById('sizeLabel');

const state = {
  layout: 'strips',
  fill: 'single',
  photos: [
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
  ],
  panelPhoto: [0, 0, 0, 0],
  caption: 'SUNSET HEIST',
  subcaption: 'PALM DRIVE · EST. 2026',
  captionPos: 'bottom',
  grade: 'sunset',
  frame: 'thin',
  stickers: [],
  size: 'square',
  selectedPanel: 0,
};

const SAMPLES = ['sunset.jpg', 'neon.jpg', 'palms.jpg'];

function loadedCount() {
  return state.photos.filter((p) => p.img).length;
}

function setStatus(text) {
  statusEl.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}

function redraw() {
  drawPoster(canvas, state);
  const size = SIZES[state.size];
  sizeLabel.textContent = `— ${size.label}`;
}

async function ensureFonts() {
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.ready;
  } catch { /* fall back to sans-serif */ }
}

/** Assigns a photo slot to the selected panel (multi fill) or to every panel (single). */
function assignPhoto(slot) {
  if (state.fill === 'single') {
    state.panelPhoto = state.panelPhoto.map(() => slot);
  } else {
    state.panelPhoto[state.selectedPanel] = slot;
  }
  syncZoomSlider();
  redraw();
}

function syncZoomSlider() {
  const slot = state.panelPhoto[state.selectedPanel] ?? 0;
  document.getElementById('zoom').value = String(state.photos[slot].zoom);
}

/** Adds a sticker of `type` at its default spot, or removes it if already placed. */
function toggleSticker(type) {
  const at = state.stickers.findIndex((s) => s.type === type);
  if (at >= 0) {
    state.stickers.splice(at, 1);
    setStatus(`${STICKERS[type].label} sticker removed.`);
  } else {
    state.stickers.push(defaultSticker(type));
    setStatus(`${STICKERS[type].label} sticker added. Drag it on the preview to move it.`);
  }
  syncStickerButtons();
  redraw();
}

function syncStickerButtons() {
  const placed = new Set(state.stickers.map((s) => s.type));
  document.querySelectorAll('#stickerButtons button').forEach((b) => {
    b.setAttribute('aria-pressed', placed.has(b.dataset.key) ? 'true' : 'false');
  });
}

/** Builds the toggle buttons for the sticker layer. */
function buildStickerButtons() {
  const host = document.getElementById('stickerButtons');
  Object.entries(STICKERS).forEach(([key, value]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value.label;
    button.dataset.key = key;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => toggleSticker(key));
    host.appendChild(button);
  });
}

/** Index of the topmost sticker under canvas point (x, y), or -1. */
function stickerAtPoint(x, y) {
  const reach = Math.min(canvas.width, canvas.height);
  for (let i = state.stickers.length - 1; i >= 0; i--) {
    const s = state.stickers[i];
    const r = (s.size || 0.1) * reach * 0.75;
    const dx = x - s.x * canvas.width;
    const dy = y - s.y * canvas.height;
    if (dx * dx + dy * dy <= r * r) return i;
  }
  return -1;
}

function buildPhotoSlots() {
  const host = document.getElementById('photoSlots');
  state.photos.forEach((photo, slot) => {
    const label = document.createElement('label');
    label.className = 'photo-slot';
    label.setAttribute('aria-pressed', slot === 0 ? 'true' : 'false');
    label.innerHTML = `<span>Photo ${slot + 1}</span><input type="file" accept="image/*">`;
    const input = label.querySelector('input');
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      photo.img = await loadImage(URL.createObjectURL(file));
      photo.zoom = 1.15;
      photo.ox = 0;
      photo.oy = 0;
      const thumb = document.createElement('img');
      thumb.src = URL.createObjectURL(file);
      thumb.alt = `Photo ${slot + 1}`;
      label.querySelector('span').after(thumb);
      assignPhoto(slot);
      setStatus(`Photo ${slot + 1} loaded.`);
    });
    label.addEventListener('click', (e) => {
      if (e.target === input) return;
      if (!photo.img) return;
      document.querySelectorAll('.photo-slot').forEach((el) => el.setAttribute('aria-pressed', 'false'));
      label.setAttribute('aria-pressed', 'true');
      assignPhoto(slot);
    });
    host.appendChild(label);
  });
}

function buildButtons(hostId, entries, current, onPick) {
  const host = document.getElementById(hostId);
  Object.entries(entries).forEach(([key, value]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value.label;
    button.dataset.key = key;
    button.setAttribute('aria-pressed', key === current ? 'true' : 'false');
    button.addEventListener('click', () => {
      host.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      onPick(key);
    });
    host.appendChild(button);
  });
}

function applySize(key) {
  state.size = key;
  const size = SIZES[key];
  canvas.width = size.w;
  canvas.height = size.h;
  redraw();
}

function panelAtPoint(x, y) {
  const panels = panelsFor(state.layout, canvas.width, canvas.height, state.captionPos);
  return panels.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

function bindDrag() {
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    // A sticker under the pointer is dragged first; panels come second.
    const sticker = stickerAtPoint(x, y);
    if (sticker >= 0) {
      drag = { x, y, sticker };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
    const panel = panelAtPoint(x, y);
    if (panel < 0) return;
    state.selectedPanel = panel;
    syncZoomSlider();
    drag = { x, y, panel };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    if (drag.sticker !== undefined) {
      const s = state.stickers[drag.sticker];
      if (!s) return;
      s.x = Math.max(0, Math.min(1, s.x + (x - drag.x) / canvas.width));
      s.y = Math.max(0, Math.min(1, s.y + (y - drag.y) / canvas.height));
      drag = { x, y, sticker: drag.sticker };
      redraw();
      return;
    }
    const panels = panelsFor(state.layout, canvas.width, canvas.height, state.captionPos);
    const panelRect = panels[drag.panel];
    const slot = state.panelPhoto[drag.panel] ?? 0;
    const photo = state.photos[slot];
    if (!photo.img || !panelRect) return;
    photo.ox += (x - drag.x) / panelRect.w;
    photo.oy += (y - drag.y) / panelRect.h;
    drag = { x, y, panel: drag.panel };
    redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
}

const LAYOUT_KEYS = Object.keys(LAYOUTS);
const GRADE_KEYS = Object.keys(GRADES);
const FRAME_KEYS = Object.keys(FRAMES);

/** Cycles `list` one step forward from `current` and returns the next key. */
function cycleKey(list, current) {
  return list[(list.indexOf(current) + 1) % list.length];
}

/** Picks a random arrangement: layout, grade, frame, fill, photos and stickers. */
function shufflePoster() {
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  state.layout = pick(LAYOUT_KEYS);
  state.grade = pick(GRADE_KEYS);
  state.frame = pick(FRAME_KEYS);
  state.captionPos = Math.random() < 0.5 ? 'top' : 'bottom';
  state.fill = Math.random() < 0.5 ? 'single' : 'multi';
  const count = Math.max(1, loadedCount());
  state.panelPhoto = state.panelPhoto.map((_, i) => (state.fill === 'single' ? 0 : i % count));
  state.stickers = [];
  const types = Object.keys(STICKERS).sort(() => Math.random() - 0.5);
  const n = Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) state.stickers.push(defaultSticker(types[i]));
  syncControls();
  syncStickerButtons();
  redraw();
  setStatus('Shuffled: new layout, grade, frame and stickers. Shuffle again for another look.');
}

function bindShortcuts() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key >= '1' && key <= String(LAYOUT_KEYS.length)) {
      state.layout = LAYOUT_KEYS[Number(key) - 1];
      syncControls();
      redraw();
      setStatus(`Layout: ${LAYOUTS[state.layout].label}`);
    } else if (key === 'g') {
      state.grade = cycleKey(GRADE_KEYS, state.grade);
      syncControls();
      redraw();
      setStatus(`Grade: ${GRADES[state.grade].label}`);
    } else if (key === 'f') {
      state.frame = cycleKey(FRAME_KEYS, state.frame);
      syncControls();
      redraw();
      setStatus(`Frame: ${FRAMES[state.frame].label}`);
    } else if (key === 'e') {
      e.preventDefault();
      exportPng();
    } else if (key === 's') {
      shufflePoster();
    }
  });
}

async function exportPng() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  await ensureFonts();
  drawPoster(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed, try again.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-poster-${size.w}x${size.h}.png`;
    a.click();
    setStatus(`Saved vice-poster-${size.w}x${size.h}.png`);
  }, 'image/png');
}

async function loadSamples() {
  for (let i = 0; i < SAMPLES.length; i++) {
    const photo = state.photos[i];
    photo.img = await loadImage(`samples/${SAMPLES[i]}`);
    photo.zoom = 1.15;
    photo.ox = 0;
    photo.oy = 0;
    const slot = document.querySelectorAll('.photo-slot')[i];
    if (slot && !slot.querySelector('img')) {
      const thumb = document.createElement('img');
      thumb.src = `samples/${SAMPLES[i]}`;
      thumb.alt = `Sample photo ${i + 1}`;
      slot.querySelector('span').after(thumb);
    }
  }
  state.panelPhoto = state.panelPhoto.map((_, i) => (state.fill === 'multi' ? i % SAMPLES.length : 0));
  redraw();
  setStatus('Sample photos loaded. Pick your own photos any time.');
}

function bindControls() {
  buildPhotoSlots();
  buildButtons('layoutButtons', LAYOUTS, state.layout, (key) => {
    state.layout = key;
    redraw();
  });
  buildButtons('gradeButtons', GRADES, state.grade, (key) => {
    state.grade = key;
    redraw();
  });
  buildButtons('sizeButtons', SIZES, state.size, (key) => applySize(key));
  buildButtons('frameButtons', FRAMES, state.frame, (key) => {
    state.frame = key;
    redraw();
  });
  buildStickerButtons();
  document.getElementById('clearStickers').addEventListener('click', () => {
    state.stickers = [];
    syncStickerButtons();
    redraw();
    setStatus('Stickers cleared.');
  });
  document.getElementById('shuffle').addEventListener('click', shufflePoster);

  document.getElementById('caption').addEventListener('input', (e) => {
    state.caption = e.target.value;
    redraw();
  });
  document.getElementById('subcaption').addEventListener('input', (e) => {
    state.subcaption = e.target.value;
    redraw();
  });
  document.getElementById('captionPos').addEventListener('change', (e) => {
    state.captionPos = e.target.value;
    redraw();
  });
  document.querySelectorAll('input[name="fill"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.fill = radio.value;
      if (state.fill === 'single') state.panelPhoto = state.panelPhoto.map(() => 0);
      else state.panelPhoto = state.panelPhoto.map((_, i) => i % Math.max(1, loadedCount()));
      redraw();
    });
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    const slot = state.panelPhoto[state.selectedPanel] ?? 0;
    state.photos[slot].zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('loadSamples').addEventListener('click', loadSamples);
  document.getElementById('clearPhotos').addEventListener('click', () => {
    state.photos.forEach((p) => { p.img = null; p.zoom = 1.15; p.ox = 0; p.oy = 0; });
    document.querySelectorAll('.photo-slot img').forEach((img) => img.remove());
    redraw();
    setStatus('Photos cleared.');
  });
  document.getElementById('export').addEventListener('click', exportPng);
  bindDrag();
  bindShortcuts();
}

/** Makes every control show the current state (used after a screenshot scene sets it). */
function syncControls() {
  const mark = (hostId, key) => {
    document.querySelectorAll(`#${hostId} button`).forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.key === key ? 'true' : 'false');
    });
  };
  mark('layoutButtons', state.layout);
  mark('gradeButtons', state.grade);
  mark('sizeButtons', state.size);
  mark('frameButtons', state.frame);
  syncStickerButtons();
  document.querySelectorAll('input[name="fill"]').forEach((radio) => {
    radio.checked = radio.value === state.fill;
  });
  document.getElementById('caption').value = state.caption;
  document.getElementById('subcaption').value = state.subcaption;
  document.getElementById('captionPos').value = state.captionPos;
  syncZoomSlider();
}

bindControls();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, { loadImage, loadSamples, applySize, redraw, ensureFonts, syncControls });
} else {
  ensureFonts().then(redraw);
  redraw();
}
