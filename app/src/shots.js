import { defaultSticker, PRESETS } from './poster.js';

// Fixed scenes for screenshots: ?shot=cover shows the poster alone at
// export size, ?shot=editor shows the editor with sample photos loaded.
// The query picks the layout, grade, size, caption, frame and stickers,
// and which sample photo leads. window.__shotReady is set once painted.
const SHOT_OPTIONS = {
  layout: ['strips', 'hero', 'quad', 'duo', 'center', 'film'],
  grade: ['sunset', 'neon', 'dusk', 'teal', 'duotone'],
  frame: ['none', 'thin', 'thick', 'halftone'],
  size: ['square', 'portrait', 'wide'],
  sticker: ['sun', 'palm', 'bolt', 'star'],
  preset: ['golden', 'midnight', 'pastel'],
};

/** Reads one allowed value from the query, or null. */
function pickParam(query, name) {
  const value = query.get(name);
  if (!value) return null;
  return SHOT_OPTIONS[name].includes(value) ? value : null;
}

/** Applies the query's scene choices to the editor state. */
function applyScene(query, state) {
  // A preset goes first: it sets layout, grade, frame and caption,
  // and the other query values override it one by one.
  const presetName = pickParam(query, 'preset');
  if (presetName) {
    const preset = PRESETS[presetName];
    state.layout = preset.layout;
    state.grade = preset.grade;
    state.frame = preset.frame;
    state.caption = preset.caption;
    state.subcaption = preset.subcaption;
    state.captionPos = preset.captionPos;
  }
  const layout = pickParam(query, 'layout');
  const grade = pickParam(query, 'grade');
  const size = pickParam(query, 'size');
  const frame = pickParam(query, 'frame');
  if (layout) state.layout = layout;
  if (grade) state.grade = grade;
  if (size) state.size = size;
  if (frame) state.frame = frame;
  const stickers = (query.get('stickers') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => SHOT_OPTIONS.sticker.includes(s));
  state.stickers = stickers.map((type) => defaultSticker(type));
  state.caption = query.get('caption') ?? state.caption;
  state.subcaption = query.get('sub') ?? state.subcaption;
  state.fill = query.get('fill') ?? state.fill;
  if (query.get('pos')) state.captionPos = query.get('pos');
}

/** Chooses which sample photo leads the panels for this scene. */
function applyLeadPhoto(query, state) {
  const lead = Number(query.get('photo') ?? 0);
  if (state.fill === 'single' && lead > 0) {
    state.panelPhoto = state.panelPhoto.map(() => lead);
  }
  if (state.fill === 'multi') {
    state.panelPhoto = state.panelPhoto.map((_, i) => (lead + i) % 3);
  }
}

export async function runShot(shot, query, state, app) {
  applyScene(query, state);
  await app.loadSamples();
  applyLeadPhoto(query, state);

  if (shot === 'cover') document.body.classList.add('shot-cover');
  app.applySize(state.size);
  await app.ensureFonts();
  app.syncControls();
  app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
