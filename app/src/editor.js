// Editor for Vice Poster Maker: photo slots, layout and grade buttons,
// caption fields, drag-to-crop on the preview, frames, stickers,
// keyboard shortcuts, shuffle, and the PNG export. Photos are read
// on this machine only and never uploaded anywhere.
import { LAYOUTS, GRADES, SIZES, FRAMES, STICKERS, PRESETS, panelsFor, drawPoster, defaultSticker } from './poster.js';
import { runShot } from './shots.js';

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}

const SAMPLE_FILES = ['sunset.jpg', 'neon.jpg', 'palms.jpg'];
const ZOOM_DEFAULT = 1.15;

function freshPhoto() {
  return { img: null, zoom: ZOOM_DEFAULT, ox: 0, oy: 0 };
}

/** Owns the editor state, the controls, and the preview canvas. */
class Editor {
  constructor() {
    this.canvas = document.getElementById('preview');
    this.statusEl = document.getElementById('status');
    this.sizeLabel = document.getElementById('sizeLabel');
    this.state = {
      layout: 'strips',
      fill: 'single',
      photos: [freshPhoto(), freshPhoto(), freshPhoto()],
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
    this.layoutKeys = Object.keys(LAYOUTS);
    this.gradeKeys = Object.keys(GRADES);
    this.frameKeys = Object.keys(FRAMES);
    this.drag = null;
  }

  /** Builds the controls, then paints the first preview (or a shot scene). */
  boot() {
    this.bindControls();
    const params = new URLSearchParams(location.search);
    const shot = params.get('shot');
    if (shot) {
      runShot(shot, params, this.state, {
        loadImage,
        loadSamples: () => this.loadSamples(),
        applySize: (key) => this.applySize(key),
        redraw: () => this.render(),
        ensureFonts: () => this.loadFonts(),
        syncControls: () => this.syncControls(),
      });
      return;
    }
    this.loadFonts().then(() => this.render());
    this.render();
  }

  /** Paints the preview and refreshes the size label. */
  render() {
    drawPoster(this.canvas, this.state);
    this.sizeLabel.textContent = `— ${SIZES[this.state.size].label}`;
  }

  /** Waits for the display font so the caption is drawn in Bebas Neue.
   *  The face is served locally from app/fonts/BebasNeue-Regular.ttf
   *  via the @font-face rule in style.css, so this load never hits the network. */
  async loadFonts() {
    try {
      await document.fonts.load('80px "Bebas Neue"');
      await document.fonts.ready;
    } catch { /* fall back to sans-serif */ }
  }

  /** How many photo slots currently hold an image. */
  loadedPhotoCount() {
    return this.state.photos.filter((p) => p.img).length;
  }

  /** One-line message under the controls. */
  announce(text) {
    this.statusEl.textContent = text;
  }

  /** Puts a photo slot on the selected panel (multi fill) or on every panel (single). */
  assignPhoto(slot) {
    if (this.state.fill === 'single') {
      this.state.panelPhoto = this.state.panelPhoto.map(() => slot);
    } else {
      this.state.panelPhoto[this.state.selectedPanel] = slot;
    }
    this.syncZoom();
    this.render();
  }

  /** Moves the zoom slider to the selected panel's photo. */
  syncZoom() {
    const slot = this.state.panelPhoto[this.state.selectedPanel] ?? 0;
    document.getElementById('zoom').value = String(this.state.photos[slot].zoom);
  }

  /** Adds a sticker of `type` at its default spot, or removes it if already placed. */
  toggleSticker(type) {
    const at = this.state.stickers.findIndex((s) => s.type === type);
    if (at >= 0) {
      this.state.stickers.splice(at, 1);
      this.announce(`${STICKERS[type].label} sticker removed.`);
    } else {
      this.state.stickers.push(defaultSticker(type));
      this.announce(`${STICKERS[type].label} sticker added. Drag it on the preview to move it.`);
    }
    this.syncStickerButtons();
    this.render();
  }

  /** Marks each sticker button pressed or not, from the placed stickers. */
  syncStickerButtons() {
    const placed = new Set(this.state.stickers.map((s) => s.type));
    document.querySelectorAll('#stickerButtons button').forEach((b) => {
      b.setAttribute('aria-pressed', placed.has(b.dataset.key) ? 'true' : 'false');
    });
  }

  /** Builds the toggle buttons for the sticker layer. */
  buildStickerButtons() {
    const host = document.getElementById('stickerButtons');
    Object.entries(STICKERS).forEach(([key, value]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = value.label;
      button.dataset.key = key;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => this.toggleSticker(key));
      host.appendChild(button);
    });
  }

  /** Applies one preset: layout, grade, frame and both caption lines at once. */
  applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    this.state.layout = preset.layout;
    this.state.grade = preset.grade;
    this.state.frame = preset.frame;
    this.state.caption = preset.caption;
    this.state.subcaption = preset.subcaption;
    this.state.captionPos = preset.captionPos;
    this.syncControls();
    this.render();
    this.announce(`Preset: ${preset.label}.`);
  }

  /** Builds the one-click preset buttons. */
  buildPresetButtons() {
    const host = document.getElementById('presetButtons');
    Object.entries(PRESETS).forEach(([key, value]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = value.label;
      button.dataset.key = key;
      button.addEventListener('click', () => this.applyPreset(key));
      host.appendChild(button);
    });
  }

  /** Index of the topmost sticker under canvas point (x, y), or -1. */
  stickerAt(x, y) {
    const reach = Math.min(this.canvas.width, this.canvas.height);
    for (let i = this.state.stickers.length - 1; i >= 0; i--) {
      const s = this.state.stickers[i];
      const r = (s.size || 0.1) * reach * 0.75;
      const dx = x - s.x * this.canvas.width;
      const dy = y - s.y * this.canvas.height;
      if (dx * dx + dy * dy <= r * r) return i;
    }
    return -1;
  }

  /** Builds the three photo slots with their file pickers. */
  buildPhotoSlots() {
    const host = document.getElementById('photoSlots');
    this.state.photos.forEach((photo, slot) => {
      const label = document.createElement('label');
      label.className = 'photo-slot';
      label.setAttribute('aria-pressed', slot === 0 ? 'true' : 'false');
      label.innerHTML = `<span>Photo ${slot + 1}</span><input type="file" accept="image/*">`;
      const input = label.querySelector('input');
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        photo.img = await loadImage(URL.createObjectURL(file));
        photo.zoom = ZOOM_DEFAULT;
        photo.ox = 0;
        photo.oy = 0;
        const thumb = document.createElement('img');
        thumb.src = URL.createObjectURL(file);
        thumb.alt = `Photo ${slot + 1}`;
        label.querySelector('span').after(thumb);
        this.assignPhoto(slot);
        this.announce(`Photo ${slot + 1} loaded.`);
      });
      label.addEventListener('click', (e) => {
        if (e.target === input) return;
        if (!photo.img) return;
        document.querySelectorAll('.photo-slot').forEach((el) => el.setAttribute('aria-pressed', 'false'));
        label.setAttribute('aria-pressed', 'true');
        this.assignPhoto(slot);
      });
      host.appendChild(label);
    });
  }

  /** Builds a row of option buttons that set one state key. */
  buildOptionButtons(hostId, entries, current, onPick) {
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

  /** Switches the export size and resizes the preview canvas. */
  applySize(key) {
    this.state.size = key;
    const size = SIZES[key];
    this.canvas.width = size.w;
    this.canvas.height = size.h;
    this.render();
  }

  /** Index of the panel under canvas point (x, y), or -1. */
  panelAt(x, y) {
    const panels = panelsFor(this.state.layout, this.canvas.width, this.canvas.height, this.state.captionPos);
    return panels.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  }

  /** Pointer drag: stickers move first, then the photo inside a panel. */
  bindDrag() {
    const toCanvas = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * this.canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * this.canvas.height,
      };
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      const { x, y } = toCanvas(e);
      const sticker = this.stickerAt(x, y);
      if (sticker >= 0) {
        this.drag = { x, y, sticker };
        this.canvas.setPointerCapture(e.pointerId);
        return;
      }
      const panel = this.panelAt(x, y);
      if (panel < 0) return;
      this.state.selectedPanel = panel;
      this.syncZoom();
      this.drag = { x, y, panel };
      this.canvas.setPointerCapture(e.pointerId);
      this.render();
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const { x, y } = toCanvas(e);
      if (this.drag.sticker !== undefined) {
        const s = this.state.stickers[this.drag.sticker];
        if (!s) return;
        s.x = Math.max(0, Math.min(1, s.x + (x - this.drag.x) / this.canvas.width));
        s.y = Math.max(0, Math.min(1, s.y + (y - this.drag.y) / this.canvas.height));
        this.drag = { x, y, sticker: this.drag.sticker };
        this.render();
        return;
      }
      const panels = panelsFor(this.state.layout, this.canvas.width, this.canvas.height, this.state.captionPos);
      const panelRect = panels[this.drag.panel];
      const slot = this.state.panelPhoto[this.drag.panel] ?? 0;
      const photo = this.state.photos[slot];
      if (!photo.img || !panelRect) return;
      photo.ox += (x - this.drag.x) / panelRect.w;
      photo.oy += (y - this.drag.y) / panelRect.h;
      this.drag = { x, y, panel: this.drag.panel };
      this.render();
    });
    this.canvas.addEventListener('pointerup', () => { this.drag = null; });
  }

  /** Next key in `list` after `current`, wrapping around. */
  cycleKey(list, current) {
    return list[(list.indexOf(current) + 1) % list.length];
  }

  /** Picks a random arrangement: layout, grade, frame, fill, photos and stickers. */
  shuffle() {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    this.state.layout = pick(this.layoutKeys);
    this.state.grade = pick(this.gradeKeys);
    this.state.frame = pick(this.frameKeys);
    this.state.captionPos = Math.random() < 0.5 ? 'top' : 'bottom';
    this.state.fill = Math.random() < 0.5 ? 'single' : 'multi';
    const count = Math.max(1, this.loadedPhotoCount());
    this.state.panelPhoto = this.state.panelPhoto.map((_, i) => (this.state.fill === 'single' ? 0 : i % count));
    this.state.stickers = [];
    const types = Object.keys(STICKERS).sort(() => Math.random() - 0.5);
    const n = Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) this.state.stickers.push(defaultSticker(types[i]));
    this.syncControls();
    this.syncStickerButtons();
    this.render();
    this.announce('Shuffled: new layout, grade, frame and stickers. Shuffle again for another look.');
  }

  /** Keyboard shortcuts: 1-6 layout, G grade, F frame, E export, S shuffle. */
  bindShortcuts() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key >= '1' && key <= String(this.layoutKeys.length)) {
        this.state.layout = this.layoutKeys[Number(key) - 1];
        this.syncControls();
        this.render();
        this.announce(`Layout: ${LAYOUTS[this.state.layout].label}`);
      } else if (key === 'g') {
        this.state.grade = this.cycleKey(this.gradeKeys, this.state.grade);
        this.syncControls();
        this.render();
        this.announce(`Grade: ${GRADES[this.state.grade].label}`);
      } else if (key === 'f') {
        this.state.frame = this.cycleKey(this.frameKeys, this.state.frame);
        this.syncControls();
        this.render();
        this.announce(`Frame: ${FRAMES[this.state.frame].label}`);
      } else if (key === 'e') {
        e.preventDefault();
        this.exportPng();
      } else if (key === 's') {
        this.shuffle();
      }
    });
  }

  /** Turns caption text into a safe file-name slug, e.g. "Sunset Heist" -> "sunset-heist". */
  fileSlug(text) {
    const slug = (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'poster';
  }

  /** Renders the poster at full export size and downloads it as a PNG. */
  async exportPng() {
    const size = SIZES[this.state.size];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    await this.loadFonts();
    drawPoster(off, this.state);
    off.toBlob((blob) => {
      if (!blob) {
        this.announce('Export failed, try again.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const name = `vice-poster-${this.fileSlug(this.state.caption)}-${size.w}x${size.h}.png`;
      a.download = name;
      a.click();
      this.announce(`Saved ${name}`);
    }, 'image/png');
  }

  /** Loads the three bundled sample photos into the slots. */
  async loadSamples() {
    for (let i = 0; i < SAMPLE_FILES.length; i++) {
      const photo = this.state.photos[i];
      photo.img = await loadImage(`samples/${SAMPLE_FILES[i]}`);
      photo.zoom = ZOOM_DEFAULT;
      photo.ox = 0;
      photo.oy = 0;
      const slot = document.querySelectorAll('.photo-slot')[i];
      if (slot && !slot.querySelector('img')) {
        const thumb = document.createElement('img');
        thumb.src = `samples/${SAMPLE_FILES[i]}`;
        thumb.alt = `Sample photo ${i + 1}`;
        slot.querySelector('span').after(thumb);
      }
    }
    this.state.panelPhoto = this.state.panelPhoto.map((_, i) => (this.state.fill === 'multi' ? i % SAMPLE_FILES.length : 0));
    this.render();
    this.announce('Sample photos loaded. Pick your own photos any time.');
  }

  /** Wires every control in the left panel. */
  bindControls() {
    this.buildPhotoSlots();
    this.buildOptionButtons('layoutButtons', LAYOUTS, this.state.layout, (key) => {
      this.state.layout = key;
      this.render();
    });
    this.buildPresetButtons();
    this.buildOptionButtons('gradeButtons', GRADES, this.state.grade, (key) => {
      this.state.grade = key;
      this.render();
    });
    this.buildOptionButtons('sizeButtons', SIZES, this.state.size, (key) => this.applySize(key));
    this.buildOptionButtons('frameButtons', FRAMES, this.state.frame, (key) => {
      this.state.frame = key;
      this.render();
    });
    this.buildStickerButtons();
    document.getElementById('clearStickers').addEventListener('click', () => {
      this.state.stickers = [];
      this.syncStickerButtons();
      this.render();
      this.announce('Stickers cleared.');
    });
    document.getElementById('shuffle').addEventListener('click', () => this.shuffle());

    document.getElementById('caption').addEventListener('input', (e) => {
      this.state.caption = e.target.value;
      this.render();
    });
    document.getElementById('subcaption').addEventListener('input', (e) => {
      this.state.subcaption = e.target.value;
      this.render();
    });
    document.getElementById('captionPos').addEventListener('change', (e) => {
      this.state.captionPos = e.target.value;
      this.render();
    });
    document.querySelectorAll('input[name="fill"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        this.state.fill = radio.value;
        if (this.state.fill === 'single') this.state.panelPhoto = this.state.panelPhoto.map(() => 0);
        else this.state.panelPhoto = this.state.panelPhoto.map((_, i) => i % Math.max(1, this.loadedPhotoCount()));
        this.render();
      });
    });
    document.getElementById('zoom').addEventListener('input', (e) => {
      const slot = this.state.panelPhoto[this.state.selectedPanel] ?? 0;
      this.state.photos[slot].zoom = Number(e.target.value);
      this.render();
    });
    document.getElementById('loadSamples').addEventListener('click', () => this.loadSamples());
    document.getElementById('clearPhotos').addEventListener('click', () => {
      this.state.photos.forEach((p) => { p.img = null; p.zoom = ZOOM_DEFAULT; p.ox = 0; p.oy = 0; });
      document.querySelectorAll('.photo-slot img').forEach((img) => img.remove());
      this.render();
      this.announce('Photos cleared.');
    });
    document.getElementById('export').addEventListener('click', () => this.exportPng());
    this.bindDrag();
    this.bindShortcuts();
  }

  /** Makes every control show the current state (used after a shot scene sets it). */
  syncControls() {
    const mark = (hostId, key) => {
      document.querySelectorAll(`#${hostId} button`).forEach((b) => {
        b.setAttribute('aria-pressed', b.dataset.key === key ? 'true' : 'false');
      });
    };
    mark('layoutButtons', this.state.layout);
    mark('gradeButtons', this.state.grade);
    mark('sizeButtons', this.state.size);
    mark('frameButtons', this.state.frame);
    this.syncStickerButtons();
    document.querySelectorAll('input[name="fill"]').forEach((radio) => {
      radio.checked = radio.value === this.state.fill;
    });
    document.getElementById('caption').value = this.state.caption;
    document.getElementById('subcaption').value = this.state.subcaption;
    document.getElementById('captionPos').value = this.state.captionPos;
    this.syncZoom();
  }
}

const editor = new Editor();
editor.boot();
