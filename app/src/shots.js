// Fixed scenes for screenshots: ?shot=cover shows the poster alone at export size,
// ?shot=editor shows the editor with sample photos loaded. The query picks the layout,
// grade, size, caption and which sample photo leads. window.__shotReady is set once painted.
const SHOT_LAYOUTS = ['strips', 'hero', 'quad', 'duo'];
const SHOT_GRADES = ['sunset', 'neon', 'dusk'];
const SHOT_SIZES = ['square', 'portrait', 'wide'];

export async function runShot(shot, query, state, app) {
  const layout = query.get('layout');
  const grade = query.get('grade');
  const size = query.get('size');
  if (layout && SHOT_LAYOUTS.includes(layout)) state.layout = layout;
  if (grade && SHOT_GRADES.includes(grade)) state.grade = grade;
  if (size && SHOT_SIZES.includes(size)) state.size = size;
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
