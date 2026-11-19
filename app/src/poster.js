// Draws the poster: multi-panel photo collage, colour grade, bold caption lettering,
// selectable frames and placeable sticker decals. Everything is drawn on one canvas
// at any size, so the live preview and the exported PNG are the same drawing.
// No Rockstar art, logo or font is used anywhere; the lettering is Anton
// (SIL Open Font License), shipped under app/fonts/.

export const LAYOUTS = {
  strips: { label: 'Three strips' },
  hero: { label: 'Hero + two' },
  quad: { label: 'Four squares' },
  duo: { label: 'Duo split' },
  center: { label: 'Center hero' },
  film: { label: 'Film strip' },
};

export const GRADES = {
  sunset: {
    label: 'Vice sunset',
    tintTop: 'rgba(255, 122, 24, 0.00)',
    tintBottom: 'rgba(214, 36, 120, 0.42)',
    sun: ['#ffd319', '#ff7a18', '#ff2975'],
    caption: ['#ffe259', '#ffa751'],
    captionEdge: '#2b0a3d',
    band: '#170a24',
  },
  neon: {
    label: 'Neon night',
    tintTop: 'rgba(0, 229, 255, 0.00)',
    tintBottom: 'rgba(255, 0, 229, 0.38)',
    sun: ['#00e5ff', '#7c4dff', '#ff00e5'],
    caption: ['#a5f3fc', '#f0abfc'],
    captionEdge: '#0a1030',
    band: '#080b22',
  },
  dusk: {
    label: 'Purple dusk',
    tintTop: 'rgba(124, 77, 255, 0.00)',
    tintBottom: 'rgba(43, 10, 61, 0.55)',
    sun: ['#fbc2eb', '#a18cd1', '#5b2a86'],
    caption: ['#f5f3ff', '#c4b5fd'],
    captionEdge: '#1b0b2e',
    band: '#140a20',
  },
  teal: {
    label: 'Teal dawn',
    tintTop: 'rgba(45, 212, 191, 0.00)',
    tintBottom: 'rgba(13, 148, 136, 0.48)',
    sun: ['#fef08a', '#2dd4bf', '#0e7490'],
    caption: ['#ccfbf1', '#99f6e4'],
    captionEdge: '#042f2e',
    band: '#042f2e',
  },
};

/** Outer border styles drawn around the whole poster (and echoed on the panels). */
export const FRAMES = {
  none: { label: 'No frame' },
  thin: { label: 'Thin neon' },
  thick: { label: 'Thick poster' },
  halftone: { label: 'Halftone dots' },
};

/** Decal shapes the user can place on the cover. Each sticker is drawn in code. */
export const STICKERS = {
  sun: { label: 'Sun' },
  palm: { label: 'Palm' },
  bolt: { label: 'Lightning' },
  star: { label: 'Star' },
};

/** Where a sticker of each type first lands, as fractions of the canvas. */
export const STICKER_DEFAULTS = {
  sun: { x: 0.84, y: 0.16, size: 0.11, rot: 0 },
  palm: { x: 0.1, y: 0.84, size: 0.16, rot: 0 },
  bolt: { x: 0.13, y: 0.15, size: 0.1, rot: 0.18 },
  star: { x: 0.5, y: 0.42, size: 0.09, rot: 0.12 },
};

/** A fresh sticker of `type` at its default spot. */
export function defaultSticker(type) {
  const d = STICKER_DEFAULTS[type] || STICKER_DEFAULTS.star;
  return { type, x: d.x, y: d.y, size: d.size, rot: d.rot };
}

export const SIZES = {
  square: { label: '1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 x 1350', w: 1080, h: 1350 },
  wide: { label: '1920 x 1080', w: 1920, h: 1080 },
};

const CAPTION_BAND = 0.21; // fraction of height the caption band takes

function panelArea(w, h, captionPos) {
  const band = h * CAPTION_BAND;
  return captionPos === 'top'
    ? { x: 0, y: band, w, h: h - band }
    : { x: 0, y: 0, w, h: h - band };
}

function grid(area, cols, rows, gutter) {
  const rects = [];
  const cw = (area.w - gutter * (cols + 1)) / cols;
  const ch = (area.h - gutter * (rows + 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push({
        x: area.x + gutter + c * (cw + gutter),
        y: area.y + gutter + r * (ch + gutter),
        w: cw,
        h: ch,
      });
    }
  }
  return rects;
}

function stripPanels(w, h, captionPos) {
  const area = panelArea(w, h, captionPos);
  return grid(area, 3, 1, Math.max(6, w * 0.008));
}
function heroPanels(w, h, captionPos) {
  const area = panelArea(w, h, captionPos);
  const g = Math.max(6, w * 0.008);
  const heroH = area.h * 0.58;
  const lowH = area.h - heroH - g * 2;
  return [
    { x: area.x + g, y: area.y + g, w: area.w - g * 2, h: heroH },
    { x: area.x + g, y: area.y + g + heroH + g, w: (area.w - g * 3) / 2, h: lowH },
    { x: area.x + g * 2 + (area.w - g * 3) / 2, y: area.y + g + heroH + g, w: (area.w - g * 3) / 2, h: lowH },
  ];
}
function quadPanels(w, h, captionPos) {
  const area = panelArea(w, h, captionPos);
  return grid(area, 2, 2, Math.max(6, w * 0.008));
}
function duoPanels(w, h, captionPos) {
  const area = panelArea(w, h, captionPos);
  const g = Math.max(6, w * 0.008);
  const leftW = area.w * 0.58;
  const rightW = area.w - leftW - g * 3;
  const halfH = (area.h - g * 3) / 2;
  return [
    { x: area.x + g, y: area.y + g, w: leftW, h: area.h - g * 2 },
    { x: area.x + g * 2 + leftW, y: area.y + g, w: rightW, h: halfH },
    { x: area.x + g * 2 + leftW, y: area.y + g * 2 + halfH, w: rightW, h: halfH },
  ];
}

/** One tall hero in the middle, flanked by two narrow vertical strips. */
function centerPanels(w, h, captionPos) {
  const area = panelArea(w, h, captionPos);
  const g = Math.max(6, w * 0.008);
  const sideW = (area.w - g * 4) * 0.2;
  const heroW = area.w - sideW * 2 - g * 4;
  return [
    { x: area.x + g, y: area.y + g, w: sideW, h: area.h - g * 2 },
    { x: area.x + g * 2 + sideW, y: area.y + g, w: heroW, h: area.h - g * 2 },
    { x: area.x + g * 3 + sideW + heroW, y: area.y + g, w: sideW, h: area.h - g * 2 },
  ];
}

/** A wide hero on top, like a film frame, over a strip of three small frames. */
function filmPanels(w, h, captionPos) {
  const area = panelArea(w, h, captionPos);
  const g = Math.max(6, w * 0.008);
  const heroH = area.h * 0.62;
  const stripH = area.h - heroH - g * 3;
  const smallW = (area.w - g * 4) / 3;
  const stripY = area.y + g * 2 + heroH;
  return [
    { x: area.x + g, y: area.y + g, w: area.w - g * 2, h: heroH },
    { x: area.x + g, y: stripY, w: smallW, h: stripH },
    { x: area.x + g * 2 + smallW, y: stripY, w: smallW, h: stripH },
    { x: area.x + g * 3 + smallW * 2, y: stripY, w: smallW, h: stripH },
  ];
}

/** Panel rectangles for a layout at this size. Caption position moves the band. */
export function panelsFor(layout, w, h, captionPos) {
  if (layout === 'strips') return stripPanels(w, h, captionPos);
  if (layout === 'hero') return heroPanels(w, h, captionPos);
  if (layout === 'quad') return quadPanels(w, h, captionPos);
  if (layout === 'center') return centerPanels(w, h, captionPos);
  if (layout === 'film') return filmPanels(w, h, captionPos);
  return duoPanels(w, h, captionPos);
}

/** Draws `img` to cover `rect`, zoomed and offset by fractions of the rect. */
export function drawPhotoCover(ctx, img, rect, zoom, ox, oy) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  // Clamp the offset so the photo still covers the panel.
  const maxX = Math.max(0, (pw - rect.w) / 2);
  const maxY = Math.max(0, (ph - rect.h) / 2);
  const dx = Math.max(-maxX, Math.min(maxX, ox * rect.w));
  const dy = Math.max(-maxY, Math.min(maxY, oy * rect.h));
  ctx.drawImage(img, rect.x + (rect.w - pw) / 2 + dx, rect.y + (rect.h - ph) / 2 + dy, pw, ph);
}

/** A retro striped sun disc, drawn inside `rect` near its top right. */
function drawSun(ctx, rect, colors) {
  const r = Math.min(rect.w, rect.h) * 0.34;
  const cx = rect.x + rect.w - r * 1.05;
  const cy = rect.y + r * 1.15;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.55, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20, 8, 30, 0.85)';
  let y = cy + r * 0.08;
  let gap = r * 0.07;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap * 2.4;
    gap *= 1.5;
  }
  ctx.restore();
}

/** A small striped sun disc, the sticker version of the big panel sun. */
function drawStickerSun(ctx, cx, cy, r, colors) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.55, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20, 8, 30, 0.85)';
  let y = cy + r * 0.1;
  let gap = r * 0.08;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap * 2.4;
    gap *= 1.5;
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 8, 30, 0.9)';
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** A palm silhouette: curved trunk with five drooping fronds. */
function drawStickerPalm(ctx, cx, cy, r, colors) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#0d1f0a';
  ctx.fillStyle = '#0d1f0a';
  ctx.lineWidth = Math.max(3, r * 0.12);
  ctx.lineCap = 'round';
  // Trunk, leaning right.
  ctx.beginPath();
  ctx.moveTo(0, r * 0.95);
  ctx.quadraticCurveTo(r * 0.1, r * 0.1, r * 0.35, -r * 0.55);
  ctx.stroke();
  // Fronds fan out from the trunk top.
  const topX = r * 0.35;
  const topY = -r * 0.55;
  const fronds = [
    [-1.15, 0.9], [-0.6, 1.05], [0.05, 1.1], [0.7, 1.0], [1.25, 0.75],
  ];
  for (const [angle, len] of fronds) {
    const ex = topX + Math.sin(angle) * r * len;
    const ey = topY - Math.cos(angle) * r * len * 0.55 + r * 0.35;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.sin(angle) * r * len * 0.6,
      topY - Math.cos(angle) * r * len * 0.7,
      ex, ey,
    );
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - r * 0.08, topY + r * 0.14, r * 0.09, 0, Math.PI * 2);
  ctx.arc(topX + r * 0.12, topY + r * 0.16, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A jagged lightning bolt, filled with the grade's brightest colour. */
function drawStickerBolt(ctx, cx, cy, r, colors) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(r * 0.25, -r);
  ctx.lineTo(-r * 0.55, r * 0.15);
  ctx.lineTo(-r * 0.05, r * 0.15);
  ctx.lineTo(-r * 0.35, r);
  ctx.lineTo(r * 0.6, -r * 0.2);
  ctx.lineTo(r * 0.05, -r * 0.2);
  ctx.closePath();
  ctx.fillStyle = colors[0];
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 8, 30, 0.9)';
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

/** A five-pointed star, filled with the grade's brightest colour. */
function drawStickerStar(ctx, cx, cy, r, colors) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = colors[0];
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 8, 30, 0.9)';
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

const STICKER_DRAW = {
  sun: drawStickerSun,
  palm: drawStickerPalm,
  bolt: drawStickerBolt,
  star: drawStickerStar,
};

/** Draws one sticker at its stored position, scaled to the canvas. */
function drawSticker(ctx, sticker, w, h, grade) {
  const draw = STICKER_DRAW[sticker.type] || STICKER_DRAW.star;
  const r = (sticker.size || 0.1) * Math.min(w, h);
  const cx = (sticker.x ?? 0.5) * w;
  const cy = (sticker.y ?? 0.5) * h;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(sticker.rot || 0);
  ctx.translate(-cx, -cy);
  draw(ctx, cx, cy, r, grade.sun);
  ctx.restore();
}

/** Draws every sticker in `state.stickers` on top of the panels. */
function drawStickers(ctx, state, w, h, grade) {
  for (const sticker of state.stickers || []) drawSticker(ctx, sticker, w, h, grade);
}

/** Panel edge width for a frame style, in canvas pixels. */
function frameEdgeWidth(frame, w) {
  if (frame === 'thick') return Math.max(6, w * 0.008);
  if (frame === 'halftone') return Math.max(4, w * 0.005);
  if (frame === 'thin') return Math.max(2, w * 0.002);
  return Math.max(2, w * 0.002);
}

/** The outer border around the whole poster for a frame style. */
function drawOuterFrame(ctx, w, h, state, grade) {
  const frame = state.frame || 'none';
  if (frame === 'none') return;
  const pad = Math.max(4, w * 0.006);
  if (frame === 'thin') {
    ctx.save();
    ctx.strokeStyle = grade.caption[0];
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    ctx.strokeStyle = 'rgba(245,238,247,0.55)';
    ctx.lineWidth = Math.max(1, w * 0.001);
    ctx.strokeRect(pad * 2.4, pad * 2.4, w - pad * 4.8, h - pad * 4.8);
    ctx.restore();
    return;
  }
  if (frame === 'thick') {
    const band = Math.max(10, w * 0.018);
    ctx.save();
    ctx.fillStyle = grade.band;
    ctx.fillRect(0, 0, w, band);
    ctx.fillRect(0, h - band, w, band);
    ctx.fillRect(0, 0, band, h);
    ctx.fillRect(w - band, 0, band, h);
    ctx.strokeStyle = grade.caption[0];
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(band * 0.55, band * 0.55, w - band * 1.1, h - band * 1.1);
    ctx.restore();
    return;
  }
  // Halftone dots: a dotted ring just inside the edge.
  ctx.save();
  ctx.fillStyle = grade.caption[0];
  const step = Math.max(10, w * 0.012);
  const dotR = Math.max(2, w * 0.0022);
  for (let x = pad * 2; x <= w - pad * 2; x += step) {
    ctx.beginPath(); ctx.arc(x, pad * 2, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, h - pad * 2, dotR, 0, Math.PI * 2); ctx.fill();
  }
  for (let y = pad * 2 + step; y <= h - pad * 2 - step; y += step) {
    ctx.beginPath(); ctx.arc(pad * 2, y, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w - pad * 2, y, dotR, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

let halftonePattern = null;
/** Small dot pattern for the comic-print feel, built once per canvas size. */
function halftone(ctx, w, h) {
  if (!halftonePattern) {
    const tile = document.createElement('canvas');
    tile.width = 9;
    tile.height = 9;
    const t = tile.getContext('2d');
    t.fillStyle = 'rgba(0,0,0,0.5)';
    t.beginPath();
    t.arc(4.5, 4.5, 1.4, 0, Math.PI * 2);
    t.fill();
    halftonePattern = ctx.createPattern(tile, 'repeat');
  }
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = halftonePattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

/** Fits `text` to `maxWidth`, counting the extra width letter spacing adds. */
function fitSpacedText(ctx, text, maxWidth, startSize, family, spacingRatio) {
  let size = startSize;
  for (;;) {
    ctx.font = `${size}px ${family}`;
    const spacing = size * spacingRatio;
    const width = ctx.measureText(text).width + spacing * Math.max(0, text.length - 1);
    if (width <= maxWidth || size <= 12) return { size, spacing };
    size -= 2;
  }
}

/** The caption band: big gradient lettering with a dark edge, plus the sub-caption. */
function drawCaptionBand(ctx, w, h, state, grade) {
  const bandH = h * CAPTION_BAND;
  const bandY = state.captionPos === 'top' ? 0 : h - bandH;
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = grade.caption[0];
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));
  if (state.captionPos === 'bottom') ctx.fillRect(0, bandY + bandH - Math.max(3, h * 0.004), w, Math.max(3, h * 0.004));

  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subcaption || '').trim().toUpperCase();
  const cx = w / 2;
  if (text) {
    // The caption sits in the upper part of the band when a sub-caption follows it.
    const centerY = sub ? bandY + bandH * 0.36 : bandY + bandH * 0.54;
    const startSize = sub ? bandH * 0.44 : bandH * 0.56;
    const size = fitFont(ctx, text, w * 0.92, startSize, 'Anton, sans-serif');
    const grad = ctx.createLinearGradient(0, centerY - size / 2, 0, centerY + size / 2);
    grad.addColorStop(0, grade.caption[0]);
    grad.addColorStop(1, grade.caption[1]);
    ctx.save();
    ctx.translate(cx, centerY);
    ctx.rotate(-0.015);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = grade.captionEdge;
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = grad;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  if (sub) {
    const fitted = fitSpacedText(ctx, sub, w * 0.86, bandH * 0.15, '700 sans-serif', 0.18);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(245,238,247,0.85)';
    ctx.font = `${fitted.size}px ${'700 sans-serif'}`;
    try { ctx.letterSpacing = `${fitted.spacing}px`; } catch { /* older canvas */ }
    ctx.fillText(sub, cx, bandY + bandH * 0.82);
    ctx.restore();
  }
}

/** Fills the canvas with the poster's dark base colour. */
function paintBackground(ctx, w, h) {
  ctx.fillStyle = '#160a1e';
  ctx.fillRect(0, 0, w, h);
}

/** Draws one panel: photo (or placeholder), grade tint, sun, and its edge. */
function paintPanel(ctx, rect, i, state, grade, w) {
  const photoIndex = state.panelPhoto[i] ?? 0;
  const photo = state.photos[photoIndex];
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo && photo.img) {
    drawPhotoCover(ctx, photo.img, rect, photo.zoom || 1.15, photo.ox || 0, photo.oy || 0);
  } else {
    paintPlaceholder(ctx, rect);
  }
  paintPanelTint(ctx, rect, grade);
  // The sun sits in the first panel, behind the tint.
  if (i === 0 && state.grade !== 'dusk') drawSun(ctx, rect, grade.sun);
  ctx.restore();
  // Poster frame around the panel; the width follows the frame style.
  ctx.strokeStyle = 'rgba(245,238,247,0.9)';
  ctx.lineWidth = frameEdgeWidth(state.frame || 'none', w);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/** Diagonal placeholder gradient for a panel with no photo yet. */
function paintPlaceholder(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#3d2350');
  g.addColorStop(1, '#1d1026');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Sunset/neon tint rising from the bottom of the panel. */
function paintPanelTint(ctx, rect, grade) {
  const tint = ctx.createLinearGradient(0, rect.y + rect.h * 0.3, 0, rect.y + rect.h);
  tint.addColorStop(0, grade.tintTop);
  tint.addColorStop(1, grade.tintBottom);
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Darkens the corners so the caption band and stickers sit on the poster. */
function paintVignette(ctx, w, h) {
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(10,4,16,0)');
  vg.addColorStop(1, 'rgba(10,4,16,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Draws the whole poster onto `canvas` at its own size, one stage at a time:
 * background, panels, stickers, halftone, vignette, outer frame, caption band.
 * state: { layout, fill, photos: [{img, zoom, ox, oy}], panelPhoto: [photoIndex],
 *          caption, subcaption, captionPos, grade, frame, stickers: [{type, x, y, size, rot}] }
 */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const panels = panelsFor(state.layout, w, h, state.captionPos);

  paintBackground(ctx, w, h);
  panels.forEach((rect, i) => paintPanel(ctx, rect, i, state, grade, w));
  drawStickers(ctx, state, w, h, grade);
  halftone(ctx, w, h);
  paintVignette(ctx, w, h);
  drawOuterFrame(ctx, w, h, state, grade);
  drawCaptionBand(ctx, w, h, state, grade);
}
