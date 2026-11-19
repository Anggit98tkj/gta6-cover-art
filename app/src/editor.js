// Wires the editor: photo slots, layout and grade buttons, caption fields, drag-to-crop
// on the preview, and the PNG export. Photos are read on this machine only, never uploaded.
import { LAYOUTS, GRADES, SIZES, panelsFor, drawPoster } from './poster.js';
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
