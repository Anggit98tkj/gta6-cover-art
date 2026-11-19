import { defaultSticker } from './poster.js';

// Fixed scenes for screenshots: ?shot=cover shows the poster alone at export size,
// ?shot=editor shows the editor with sample photos loaded. The query picks the layout,
// grade, size, caption, frame and stickers, and which sample photo leads.
// window.__shotReady is set once painted.
const SHOT_LAYOUTS = ['strips', 'hero', 'quad', 'duo', 'center', 'film'];
const SHOT_GRADES = ['sunset', 'neon', 'dusk', 'teal'];
const SHOT_FRAMES = ['none', 'thin', 'thick', 'halftone'];
const SHOT_SIZES = ['square', 'portrait', 'wide'];
const SHOT_STICKERS = ['sun', 'palm', 'bolt', 'star'];

export async function runShot(shot, query, state, app) {
  const layout = query.get('layout');
  const grade = query.get('grade');
  const size = query.get('size');
  const frame = query.get('frame');
  if (layout && SHOT_LAYOUTS.includes(layout)) state.layout = layout;
  if (grade && SHOT_GRADES.includes(grade)) state.grade = grade;
  if (size && SHOT_SIZES.includes(size)) state.size = size;
  if (frame && SHOT_FRAMES.includes(frame)) state.frame = frame;
  const stickers = (query.get('stickers') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => SHOT_STICKERS.includes(s));
  state.stickers = stickers.map((type) => defaultSticker(type));
  state.caption = query.get('caption') ?? state.caption;
  state.subcaption = query.get('sub') ?? state.subcaption;
  state.fill = query.get('fill') ?? state.fill;
  if (query.get('pos')) state.captionPos = query.get('pos');

  await app.loadSamples();
  const lead = Number(query.get('photo') ?? 0);
  if (state.fill === 'single' && lead > 0) state.panelPhoto = state.panelPhoto.map(() => lead);
  if (state.fill === 'multi') state.panelPhoto = state.panelPhoto.map((_, i) => (lead + i) % 3);

  if (shot === 'cover') document.body.classList.add('shot-cover');
  app.applySize(state.size);
  await app.ensureFonts();
  app.syncControls();
  app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
