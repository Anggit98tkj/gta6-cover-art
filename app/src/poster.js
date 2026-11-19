// Poster drawing for Vice Poster Maker.
//
// One canvas, one drawing: the live preview and the exported PNG run
// the exact same render, so what you see is what you save. The
// renderer below is organised as a class, one method per stage, so a
// new layout or grade is a small local change. No Rockstar artwork,
// logo or typeface is used anywhere; the display lettering is Anton
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
    sun: ['#ffd319', '#ff7a18', '#ff2975'],
    caption: ['#ffe259', '#ffa751'],
    captionEdge: '#2b0a3d',
    band: '#170a24',
    tintTop: 'rgba(255, 122, 24, 0.00)',
    tintBottom: 'rgba(214, 36, 120, 0.42)',
  },
  neon: {
    label: 'Neon night',
    sun: ['#00e5ff', '#7c4dff', '#ff00e5'],
    caption: ['#a5f3fc', '#f0abfc'],
    captionEdge: '#0a1030',
    band: '#080b22',
    tintTop: 'rgba(0, 229, 255, 0.00)',
    tintBottom: 'rgba(255, 0, 229, 0.38)',
  },
  dusk: {
    label: 'Purple dusk',
    sun: ['#fbc2eb', '#a18cd1', '#5b2a86'],
    caption: ['#f5f3ff', '#c4b5fd'],
    captionEdge: '#1b0b2e',
    band: '#140a20',
    tintTop: 'rgba(124, 77, 255, 0.00)',
    tintBottom: 'rgba(43, 10, 61, 0.55)',
  },
  teal: {
    label: 'Teal dawn',
    sun: ['#fef08a', '#2dd4bf', '#0e7490'],
    caption: ['#ccfbf1', '#99f6e4'],
    captionEdge: '#042f2e',
    band: '#042f2e',
    tintTop: 'rgba(45, 212, 191, 0.00)',
    tintBottom: 'rgba(13, 148, 136, 0.48)',
  },
  duotone: {
    label: 'Duotone pop',
    duotone: true,
    sun: ['#ff2e88', '#f472b6', '#7c3aed'],
    caption: ['#fdf4ff', '#f0abfc'],
    captionEdge: '#2e1065',
    band: '#1e1033',
    tintTop: 'rgba(124, 58, 237, 0.00)',
    tintBottom: 'rgba(255, 46, 136, 0.45)',
    washA: 'rgba(124, 58, 237, 0.28)',
    washB: 'rgba(255, 46, 136, 0.28)',
  },
};

/** Border styles around the whole poster (and echoed on the panels). */
export const FRAMES = {
  none: { label: 'No frame' },
  thin: { label: 'Thin neon' },
  thick: { label: 'Thick poster' },
  halftone: { label: 'Halftone dots' },
};

/** Decal shapes the user can drop onto the cover. Each one is drawn in code. */
export const STICKERS = {
  sun: { label: 'Sun' },
  palm: { label: 'Palm' },
  bolt: { label: 'Lightning' },
  star: { label: 'Star' },
};

/** First landing spot of each sticker, as fractions of the canvas. */
export const STICKER_DEFAULTS = {
  sun: { x: 0.84, y: 0.16, size: 0.11, rot: 0 },
  palm: { x: 0.1, y: 0.84, size: 0.16, rot: 0 },
  bolt: { x: 0.13, y: 0.15, size: 0.1, rot: 0.18 },
  star: { x: 0.5, y: 0.42, size: 0.09, rot: 0.12 },
};

/** A fresh sticker of `type` at its default spot. */
export function defaultSticker(type) {
  const spot = STICKER_DEFAULTS[type] || STICKER_DEFAULTS.star;
  return { type, x: spot.x, y: spot.y, size: spot.size, rot: spot.rot };
}

export const SIZES = {
  square: { label: '1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 x 1350', w: 1080, h: 1350 },
  wide: { label: '1920 x 1080', w: 1920, h: 1080 },
};

/**
 * One-click looks: each preset sets the layout, grade, frame and both
 * caption lines together, so a whole poster style is one tap away.
 */
export const PRESETS = {
  golden: {
    label: 'Golden hour',
    layout: 'hero',
    grade: 'sunset',
    frame: 'thick',
    caption: 'SUNSET HEIST',
    subcaption: 'PALM DRIVE · EST. 2026',
    captionPos: 'bottom',
  },
  midnight: {
    label: 'Midnight run',
    layout: 'center',
    grade: 'neon',
    frame: 'thin',
    caption: 'MIDNIGHT RUN',
    subcaption: 'NO BRAKES · PALM DRIVE',
    captionPos: 'bottom',
  },
  pastel: {
    label: 'Pastel drive',
    layout: 'film',
    grade: 'dusk',
    frame: 'halftone',
    caption: 'VICE NIGHTS',
    subcaption: 'FOUR CORNERS',
    captionPos: 'top',
  },
  neonnights: {
    label: 'Neon nights',
    layout: 'quad',
    grade: 'duotone',
    frame: 'none',
    caption: 'NEON NIGHTS',
    subcaption: 'CITY LIGHTS · AFTER DARK',
    captionPos: 'bottom',
  },
  tealmorning: {
    label: 'Teal morning',
    layout: 'strips',
    grade: 'teal',
    frame: 'thin',
    caption: 'TEAL MORNING',
    subcaption: 'OCEAN DRIVE · FIRST LIGHT',
    captionPos: 'top',
  },
};

const BAND_FRACTION = 0.21; // share of the height the caption band takes
const DARK_EDGE = 'rgba(20, 8, 30, 0.9)';
const PANEL_EDGE = 'rgba(245, 238, 247, 0.9)';

let dotTile = null; // shared halftone tile, built once per page

/** Area left for the panels once the caption band is reserved. */
function photoArea(w, h, captionPos) {
  const band = h * BAND_FRACTION;
  if (captionPos === 'top') return { x: 0, y: band, w, h: h - band };
  return { x: 0, y: 0, w, h: h - band };
}

/** Even `cols` x `rows` cells inside `area`, separated by `gap`. */
function tileArea(area, cols, rows, gap) {
  const cellW = (area.w - gap * (cols + 1)) / cols;
  const cellH = (area.h - gap * (rows + 1)) / rows;
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: area.x + gap + col * (cellW + gap),
        y: area.y + gap + row * (cellH + gap),
        w: cellW,
        h: cellH,
      });
    }
  }
  return cells;
}

/**
 * Panel rectangles for a layout at this size. The caption position
 * shifts the photo area; the gap scales with the canvas width.
 * Written as one switch so every layout's geometry lives together.
 */
export function panelsFor(layout, w, h, captionPos) {
  const area = photoArea(w, h, captionPos);
  const gap = Math.max(6, w * 0.008);
  switch (layout) {
    case 'strips':
      return tileArea(area, 3, 1, gap);
    case 'quad':
      return tileArea(area, 2, 2, gap);
    case 'hero': {
      const heroH = area.h * 0.58;
      const lowerH = area.h - heroH - gap * 2;
      const lowerW = (area.w - gap * 3) / 2;
      return [
        { x: area.x + gap, y: area.y + gap, w: area.w - gap * 2, h: heroH },
        { x: area.x + gap, y: area.y + gap + heroH + gap, w: lowerW, h: lowerH },
        { x: area.x + gap * 2 + lowerW, y: area.y + gap + heroH + gap, w: lowerW, h: lowerH },
      ];
    }
    case 'center': {
      const sideW = (area.w - gap * 4) * 0.2;
      const midW = area.w - sideW * 2 - gap * 4;
      return [
        { x: area.x + gap, y: area.y + gap, w: sideW, h: area.h - gap * 2 },
        { x: area.x + gap * 2 + sideW, y: area.y + gap, w: midW, h: area.h - gap * 2 },
        { x: area.x + gap * 3 + sideW + midW, y: area.y + gap, w: sideW, h: area.h - gap * 2 },
      ];
    }
    case 'film': {
      const heroH = area.h * 0.62;
      const stripH = area.h - heroH - gap * 3;
      const smallW = (area.w - gap * 4) / 3;
      const stripY = area.y + gap * 2 + heroH;
      return [
        { x: area.x + gap, y: area.y + gap, w: area.w - gap * 2, h: heroH },
        { x: area.x + gap, y: stripY, w: smallW, h: stripH },
        { x: area.x + gap * 2 + smallW, y: stripY, w: smallW, h: stripH },
        { x: area.x + gap * 3 + smallW * 2, y: stripY, w: smallW, h: stripH },
      ];
    }
    case 'duo':
    default: {
      const leftW = area.w * 0.58;
      const rightW = area.w - leftW - gap * 3;
      const halfH = (area.h - gap * 3) / 2;
      return [
        { x: area.x + gap, y: area.y + gap, w: leftW, h: area.h - gap * 2 },
        { x: area.x + gap * 2 + leftW, y: area.y + gap, w: rightW, h: halfH },
        { x: area.x + gap * 2 + leftW, y: area.y + gap * 2 + halfH, w: rightW, h: halfH },
      ];
    }
  }
}

/** Draws `img` so it covers `rect`, zoomed and shifted by fractions of the rect. */
export function drawPhotoCover(ctx, img, rect, zoom, ox, oy) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const picW = img.naturalWidth * scale;
  const picH = img.naturalHeight * scale;
  // Clamp the shift so the photo never leaves a gap at the panel edge.
  const slackX = Math.max(0, (picW - rect.w) / 2);
  const slackY = Math.max(0, (picH - rect.h) / 2);
  const shiftX = Math.max(-slackX, Math.min(slackX, ox * rect.w));
  const shiftY = Math.max(-slackY, Math.min(slackY, oy * rect.h));
  ctx.drawImage(img, rect.x + (rect.w - picW) / 2 + shiftX, rect.y + (rect.h - picH) / 2 + shiftY, picW, picH);
}

/** The striped retro sun disc, centred on (cx, cy) with radius r. */
function paintSunDisc(ctx, cx, cy, r, colors, stripeStart = 0.08, stripeGap = 0.07) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const wash = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  wash.addColorStop(0, colors[0]);
  wash.addColorStop(0.55, colors[1]);
  wash.addColorStop(1, colors[2]);
  ctx.fillStyle = wash;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20, 8, 30, 0.85)';
  let stripeY = cy + r * stripeStart;
  let stripeH = r * stripeGap;
  while (stripeY < cy + r) {
    ctx.fillRect(cx - r, stripeY, r * 2, stripeH);
    stripeY += stripeH * 2.4;
    stripeH *= 1.5;
  }
  ctx.restore();
}

/** Sun sticker: the striped disc, plus a dark ring around it. */
function paintSunDecal(ctx, cx, cy, r, colors) {
  paintSunDisc(ctx, cx, cy, r, colors, 0.1, 0.08);
  ctx.save();
  ctx.strokeStyle = DARK_EDGE;
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Palm sticker: a leaning trunk, five drooping fronds, two coconuts. */
function paintPalmDecal(ctx, cx, cy, r) {
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
  const crownX = r * 0.35;
  const crownY = -r * 0.55;
  const fronds = [
    { angle: -1.15, len: 0.9 },
    { angle: -0.6, len: 1.05 },
    { angle: 0.05, len: 1.1 },
    { angle: 0.7, len: 1.0 },
    { angle: 1.25, len: 0.75 },
  ];
  for (const frond of fronds) {
    const tipX = crownX + Math.sin(frond.angle) * r * frond.len;
    const tipY = crownY - Math.cos(frond.angle) * r * frond.len * 0.55 + r * 0.35;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.sin(frond.angle) * r * frond.len * 0.6,
      crownY - Math.cos(frond.angle) * r * frond.len * 0.7,
      tipX,
      tipY,
    );
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(crownX - r * 0.08, crownY + r * 0.14, r * 0.09, 0, Math.PI * 2);
  ctx.arc(crownX + r * 0.12, crownY + r * 0.16, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Lightning sticker: a jagged bolt in the grade's brightest colour. */
function paintBoltDecal(ctx, cx, cy, r, colors) {
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
  ctx.strokeStyle = DARK_EDGE;
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

/** Star sticker: a five-pointed star in the grade's brightest colour. */
function paintStarDecal(ctx, cx, cy, r, colors) {
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
  ctx.strokeStyle = DARK_EDGE;
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

const DECAL_PAINT = {
  sun: paintSunDecal,
  palm: paintPalmDecal,
  bolt: paintBoltDecal,
  star: paintStarDecal,
};

/**
 * Renders one poster onto a canvas. Construct with the canvas and the
 * editor state, then call render(). State shape:
 * { layout, fill, photos: [{img, zoom, ox, oy}], panelPhoto: [photoIndex],
 *   caption, subcaption, captionPos, grade, frame, stickers: [{type, x, y, size, rot}] }
 */
export class PosterRenderer {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;
    this.state = state;
    this.grade = GRADES[state.grade] || GRADES.sunset;
  }

  /** Full draw, one stage at a time, in stacking order. */
  render() {
    this.paintBase();
    const rects = panelsFor(this.state.layout, this.w, this.h, this.state.captionPos);
    rects.forEach((rect, i) => this.paintOnePanel(rect, i));
    this.paintAllStickers();
    this.paintHalftone();
    this.paintVignette();
    this.paintBorder();
    this.paintCaption();
  }

  /** The poster's dark base colour. */
  paintBase() {
    this.ctx.fillStyle = '#160a1e';
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  /** One panel: photo (or placeholder), grade tint, sun, and its edge. */
  paintOnePanel(rect, i) {
    const { ctx } = this;
    const slot = this.state.panelPhoto[i] ?? 0;
    const photo = this.state.photos[slot];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (photo && photo.img) {
      drawPhotoCover(ctx, photo.img, rect, photo.zoom || 1.15, photo.ox || 0, photo.oy || 0);
    } else {
      this.paintEmptyPanel(rect);
    }
    this.paintTint(rect);
    // The sun sits in the first panel, on top of the tint.
    if (i === 0 && this.state.grade !== 'dusk') {
      const r = Math.min(rect.w, rect.h) * 0.34;
      paintSunDisc(ctx, rect.x + rect.w - r * 1.05, rect.y + r * 1.15, r, this.grade.sun);
    }
    ctx.restore();
    // Poster frame around the panel; the width follows the frame style.
    ctx.strokeStyle = PANEL_EDGE;
    ctx.lineWidth = this.borderWidth();
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  /** Diagonal placeholder gradient for a panel with no photo yet. */
  paintEmptyPanel(rect) {
    const wash = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    wash.addColorStop(0, '#3d2350');
    wash.addColorStop(1, '#1d1026');
    this.ctx.fillStyle = wash;
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  /** Grade tint rising from the bottom of the panel. */
  paintTint(rect) {
    if (this.grade.duotone) {
      // Duotone: two flat colour washes, violet on top and pink below,
      // instead of a smooth gradient.
      const split = rect.y + rect.h * 0.5;
      this.ctx.fillStyle = this.grade.washA;
      this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h * 0.5);
      this.ctx.fillStyle = this.grade.washB;
      this.ctx.fillRect(rect.x, split, rect.w, rect.h * 0.5);
      return;
    }
    const tint = this.ctx.createLinearGradient(0, rect.y + rect.h * 0.3, 0, rect.y + rect.h);
    tint.addColorStop(0, this.grade.tintTop);
    tint.addColorStop(1, this.grade.tintBottom);
    this.ctx.fillStyle = tint;
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  /** Panel edge width for the current frame style, in canvas pixels. */
  borderWidth() {
    const frame = this.state.frame || 'none';
    if (frame === 'thick') return Math.max(6, this.w * 0.008);
    if (frame === 'halftone') return Math.max(4, this.w * 0.005);
    return Math.max(2, this.w * 0.002);
  }

  /** Every sticker in state.stickers, on top of the panels. */
  paintAllStickers() {
    for (const sticker of this.state.stickers || []) this.paintOneSticker(sticker);
  }

  /** One sticker at its stored position, scaled to the canvas. */
  paintOneSticker(sticker) {
    const paint = DECAL_PAINT[sticker.type] || DECAL_PAINT.star;
    const r = (sticker.size || 0.1) * Math.min(this.w, this.h);
    const cx = (sticker.x ?? 0.5) * this.w;
    const cy = (sticker.y ?? 0.5) * this.h;
    const { ctx } = this;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sticker.rot || 0);
    ctx.translate(-cx, -cy);
    paint(ctx, cx, cy, r, this.grade.sun);
    ctx.restore();
  }

  /** Comic-print dot texture over the whole poster. */
  paintHalftone() {
    if (!dotTile) {
      const tile = document.createElement('canvas');
      tile.width = 9;
      tile.height = 9;
      const t = tile.getContext('2d');
      t.fillStyle = 'rgba(0,0,0,0.5)';
      t.beginPath();
      t.arc(4.5, 4.5, 1.4, 0, Math.PI * 2);
      t.fill();
      dotTile = this.ctx.createPattern(tile, 'repeat');
    }
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = dotTile;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.restore();
  }

  /** Darkened corners so the caption band and stickers sit on the poster. */
  paintVignette() {
    const vg = this.ctx.createRadialGradient(
      this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.45,
      this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75,
    );
    vg.addColorStop(0, 'rgba(10,4,16,0)');
    vg.addColorStop(1, 'rgba(10,4,16,0.35)');
    this.ctx.fillStyle = vg;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  /** The outer border around the whole poster for the frame style. */
  paintBorder() {
    const frame = this.state.frame || 'none';
    if (frame === 'none') return;
    const { ctx, w, h } = this;
    const pad = Math.max(4, w * 0.006);
    if (frame === 'thin') {
      ctx.save();
      ctx.strokeStyle = this.grade.caption[0];
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
      ctx.fillStyle = this.grade.band;
      ctx.fillRect(0, 0, w, band);
      ctx.fillRect(0, h - band, w, band);
      ctx.fillRect(0, 0, band, h);
      ctx.fillRect(w - band, 0, band, h);
      ctx.strokeStyle = this.grade.caption[0];
      ctx.lineWidth = Math.max(2, w * 0.002);
      ctx.strokeRect(band * 0.55, band * 0.55, w - band * 1.1, h - band * 1.1);
      ctx.restore();
      return;
    }
    // Halftone dots: a dotted ring just inside the edge.
    ctx.save();
    ctx.fillStyle = this.grade.caption[0];
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

  /** Shrinks the font until `text` fits `maxWidth`. */
  shrinkToFit(text, maxWidth, startSize, family) {
    let size = startSize;
    const { ctx } = this;
    ctx.font = `${size}px ${family}`;
    while (size > 14 && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = `${size}px ${family}`;
    }
    return size;
  }

  /** Like shrinkToFit, counting the extra width letter spacing adds. */
  shrinkSpaced(text, maxWidth, startSize, family, spacingRatio) {
    let size = startSize;
    const { ctx } = this;
    for (;;) {
      ctx.font = `${size}px ${family}`;
      const spacing = size * spacingRatio;
      const width = ctx.measureText(text).width + spacing * Math.max(0, text.length - 1);
      if (width <= maxWidth || size <= 12) return { size, spacing };
      size -= 2;
    }
  }

  /** The caption band: big gradient lettering with a dark edge, plus the sub-caption. */
  paintCaption() {
    const { ctx, w, h } = this;
    const bandH = h * BAND_FRACTION;
    const bandY = this.state.captionPos === 'top' ? 0 : h - bandH;
    ctx.fillStyle = this.grade.band;
    ctx.fillRect(0, bandY, w, bandH);
    const rule = Math.max(3, h * 0.004);
    ctx.fillStyle = this.grade.caption[0];
    ctx.fillRect(0, bandY, w, rule);
    if (this.state.captionPos === 'bottom') ctx.fillRect(0, bandY + bandH - rule, w, rule);

    const text = (this.state.caption || '').trim().toUpperCase();
    const sub = (this.state.subcaption || '').trim().toUpperCase();
    const cx = w / 2;
    if (text) {
      // The caption sits in the upper part of the band when a sub-caption follows it.
      const centerY = sub ? bandY + bandH * 0.36 : bandY + bandH * 0.54;
      const startSize = sub ? bandH * 0.44 : bandH * 0.56;
      const size = this.shrinkToFit(text, w * 0.92, startSize, 'Anton, sans-serif');
      const grad = ctx.createLinearGradient(0, centerY - size / 2, 0, centerY + size / 2);
      grad.addColorStop(0, this.grade.caption[0]);
      grad.addColorStop(1, this.grade.caption[1]);
      ctx.save();
      ctx.translate(cx, centerY);
      ctx.rotate(-0.015);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = this.grade.captionEdge;
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeText(text, 0, 0);
      ctx.fillStyle = grad;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
    if (sub) {
      const fitted = this.shrinkSpaced(sub, w * 0.86, bandH * 0.15, '700 sans-serif', 0.18);
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
}

/** Draws the whole poster onto `canvas` at its own size. */
export function drawPoster(canvas, state) {
  new PosterRenderer(canvas, state).render();
}
