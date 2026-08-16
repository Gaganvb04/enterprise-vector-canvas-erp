import type { EdgeParams, FourSideEdgeConfig } from '../types/diecut';
import { DieCutLibraryRegistry } from '../data/diecutLibrary';

// ─── mm → px helper (96 PPI, 1 inch = 25.4 mm) ───────────────────────────────
export const mmToPx = (mm: number): number => (mm / 25.4) * 96;

export type SegFn = (
  x0: number, y0: number,
  x1: number, y1: number,
  params: EdgeParams,
  cardW: number,
  cardH: number,
  side?: 'top' | 'right' | 'bottom' | 'left'
) => string;

/** Straight edge */
const straight: SegFn = (_x0, _y0, x1, y1) => `L ${x1.toFixed(2)} ${y1.toFixed(2)}`;

/** Rounded edge — a single quadratic bulge toward the interior */
const rounded: SegFn = (x0, y0, x1, y1, params) => {
  const r = mmToPx(params.cornerRadius ?? 10);
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return '';
  const nx = -dy / len, ny = dx / len; // inward normal
  return `Q ${(mx + nx * r).toFixed(2)} ${(my + ny * r).toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

/** Wave edge */
const wave: SegFn = (x0, y0, x1, y1, params) => {
  const amp = mmToPx(params.waveAmplitude ?? 3);
  const freq = mmToPx(params.waveFrequency ?? 8);
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return '';
  const nx = -dy / len, ny = dx / len; // inward normal
  const steps = Math.max(4, Math.round(len / Math.max(1, freq)));
  let d = '';
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const waveVal = Math.sin(t * Math.PI * 2 * (len / Math.max(1, freq))) * amp;
    const px = x0 + dx * t + nx * waveVal;
    const py = y0 + dy * t + ny * waveVal;
    d += ` L ${px.toFixed(2)} ${py.toFixed(2)}`;
  }
  return d;
};

/** Scallop edge */
const scallop: SegFn = (x0, y0, x1, y1, params) => {
  const r = mmToPx(params.scallopRadius ?? 5);
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return '';
  const nx = -dy / len, ny = dx / len;
  const steps = Math.max(2, Math.round(len / Math.max(1, r * 2)));
  let d = '';
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const mx = x0 + dx * (t0 + t1) / 2 + nx * r;
    const my = y0 + dy * (t0 + t1) / 2 + ny * r;
    const ex = x0 + dx * t1;
    const ey = y0 + dy * t1;
    d += ` Q ${mx.toFixed(2)} ${my.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  }
  return d;
};

/** Zigzag edge */
const zigzag: SegFn = (x0, y0, x1, y1, params) => {
  const h = mmToPx(params.zigzagHeight ?? 5);
  const w = mmToPx(params.zigzagWidth ?? 8);
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return '';
  const nx = -dy / len, ny = dx / len;
  const steps = Math.max(2, Math.round(len / Math.max(1, w)));
  let d = '';
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const side = i % 2 === 0 ? 1 : -1;
    const px = x0 + dx * t + nx * h * side;
    const py = y0 + dy * t + ny * h * side;
    d += ` L ${px.toFixed(2)} ${py.toFixed(2)}`;
    const ex = x0 + dx * (i + 1) / steps;
    const ey = y0 + dy * (i + 1) / steps;
    d += ` L ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  }
  return d;
};

/** Notch edge — single rectangular notch at center */
const notch: SegFn = (x0, y0, x1, y1, params) => {
  const depth = mmToPx(params.notchDepth ?? 5);
  const width = mmToPx(params.notchWidth ?? 10);
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return '';
  const nx = -dy / len, ny = dx / len;
  const notchStart = Math.max(0.05, 0.5 - (width / 2) / len);
  const notchEnd   = Math.min(0.95, 0.5 + (width / 2) / len);
  const ns = { x: x0 + dx * notchStart, y: y0 + dy * notchStart };
  const ne = { x: x0 + dx * notchEnd,   y: y0 + dy * notchEnd };
  return [
    `L ${ns.x.toFixed(2)} ${ns.y.toFixed(2)}`,
    `L ${(ns.x + nx * depth).toFixed(2)} ${(ns.y + ny * depth).toFixed(2)}`,
    `L ${(ne.x + nx * depth).toFixed(2)} ${(ne.y + ny * depth).toFixed(2)}`,
    `L ${ne.x.toFixed(2)} ${ne.y.toFixed(2)}`,
    `L ${x1.toFixed(2)} ${y1.toFixed(2)}`,
  ].join(' ');
};

/** Arch edge */
const arch: SegFn = (x0, y0, x1, y1, params) => {
  const h = mmToPx(params.archHeight ?? 25);
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return '';
  const nx = -dy / len, ny = dx / len;
  return `Q ${(mx + nx * h).toFixed(2)} ${(my + ny * h).toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

/** Bracket edge */
const bracket: SegFn = (x0, y0, x1, y1, params) => {
  const r = mmToPx(params.cornerRadius ?? 15);
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return '';
  const nx = -dy / len, ny = dx / len;
  const c1x = x0 + dx * 0.25 + nx * r;
  const c1y = y0 + dy * 0.25 + ny * r;
  const c2x = x0 + dx * 0.75 - nx * r;
  const c2y = y0 + dy * 0.75 - ny * r;
  return `C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

// ─── Library SVG Path Transformer ─────────────────────────────────────────────
/**
 * Maps a library SVG pathD (viewBox 0 0 220 80, baseline Y=40, running X=10..210)
 * to run along side segment from (x0, y0) to (x1, y1).
 */
export function buildLibraryEdgeSegment(
  pathD: string,
  x0: number, y0: number,
  x1: number, y1: number,
  _params: EdgeParams
): string {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len === 0) return `L ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  const nx = -dy / len, ny = dx / len; // inward normal

  // Parse path tokens (M, L, Q, C, Z, numbers)
  const tokens = pathD.match(/[a-zA-Z]|[-+]?[0-9]*\.?[0-9]+/g);
  if (!tokens || tokens.length === 0) return `L ${x1.toFixed(2)} ${y1.toFixed(2)}`;

  let d = '';
  let idx = 0;
  let cmd = '';

  const transformPoint = (px: number, py: number) => {
    // Normalization: X from 10..210 maps to t from 0..1
    const t = Math.max(0, Math.min(1, (px - 10) / 200));
    // Offset from Y=40
    const off = (py - 40);
    const cx = x0 + dx * t + nx * off;
    const cy = y0 + dy * t + ny * off;
    return `${cx.toFixed(2)} ${cy.toFixed(2)}`;
  };

  while (idx < tokens.length) {
    const tok = tokens[idx];
    if (/^[a-zA-Z]$/.test(tok)) {
      cmd = tok.toUpperCase();
      idx++;
    }

    if (cmd === 'M' || cmd === 'L') {
      if (idx + 1 >= tokens.length) break;
      const px = parseFloat(tokens[idx++]);
      const py = parseFloat(tokens[idx++]);
      const pt = transformPoint(px, py);
      d += ` L ${pt}`;
    } else if (cmd === 'Q') {
      if (idx + 3 >= tokens.length) break;
      const qx = parseFloat(tokens[idx++]);
      const qy = parseFloat(tokens[idx++]);
      const px = parseFloat(tokens[idx++]);
      const py = parseFloat(tokens[idx++]);
      const qpt = transformPoint(qx, qy);
      const pt = transformPoint(px, py);
      d += ` Q ${qpt} ${pt}`;
    } else if (cmd === 'C') {
      if (idx + 5 >= tokens.length) break;
      const c1x = parseFloat(tokens[idx++]);
      const c1y = parseFloat(tokens[idx++]);
      const c2x = parseFloat(tokens[idx++]);
      const c2y = parseFloat(tokens[idx++]);
      const px = parseFloat(tokens[idx++]);
      const py = parseFloat(tokens[idx++]);
      const c1pt = transformPoint(c1x, c1y);
      const c2pt = transformPoint(c2x, c2y);
      const pt = transformPoint(px, py);
      d += ` C ${c1pt} ${c2pt} ${pt}`;
    } else {
      idx++;
    }
  }

  // Ensure segment ends at (x1, y1)
  d += ` L ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  return d;
}

// ─── Registry ─────────────────────────────────────────────────────────────────
const EDGE_GENERATORS: Record<string, SegFn> = {
  straight_edge: straight,
  rounded_corner_sm: (x0,y0,x1,y1,p) => rounded(x0,y0,x1,y1,{...p,cornerRadius:5},0,0),
  rounded_corner_md: (x0,y0,x1,y1,p) => rounded(x0,y0,x1,y1,{...p,cornerRadius:15},0,0),
  rounded_corner_lg: (x0,y0,x1,y1,p) => rounded(x0,y0,x1,y1,{...p,cornerRadius:30},0,0),
  wave_soft: (x0,y0,x1,y1,p,cw,ch) => wave(x0,y0,x1,y1,{...p,waveAmplitude:3,waveFrequency:8},cw,ch),
  wave_deep: (x0,y0,x1,y1,p,cw,ch) => wave(x0,y0,x1,y1,{...p,waveAmplitude:6,waveFrequency:10},cw,ch),
  scallop_sm: (x0,y0,x1,y1,p,cw,ch) => scallop(x0,y0,x1,y1,{...p,scallopRadius:4},cw,ch),
  scallop_md: (x0,y0,x1,y1,p,cw,ch) => scallop(x0,y0,x1,y1,{...p,scallopRadius:8},cw,ch),
  scallop_lg: (x0,y0,x1,y1,p,cw,ch) => scallop(x0,y0,x1,y1,{...p,scallopRadius:14},cw,ch),
  zigzag_sm:  (x0,y0,x1,y1,p,cw,ch) => zigzag(x0,y0,x1,y1,{...p,zigzagHeight:3,zigzagWidth:6},cw,ch),
  zigzag_lg:  (x0,y0,x1,y1,p,cw,ch) => zigzag(x0,y0,x1,y1,{...p,zigzagHeight:6,zigzagWidth:10},cw,ch),
  small_notch: (x0,y0,x1,y1,p,cw,ch) => notch(x0,y0,x1,y1,{...p,notchDepth:4,notchWidth:8},cw,ch),
  medium_notch:(x0,y0,x1,y1,p,cw,ch) => notch(x0,y0,x1,y1,{...p,notchDepth:7,notchWidth:14},cw,ch),
  large_notch: (x0,y0,x1,y1,p,cw,ch) => notch(x0,y0,x1,y1,{...p,notchDepth:12,notchWidth:20},cw,ch),
  u_notch:     (x0,y0,x1,y1,p,cw,ch) => notch(x0,y0,x1,y1,{...p,notchDepth:8,notchWidth:10},cw,ch),
  v_notch:     (x0,y0,x1,y1,p) => {
    const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy),h=mmToPx(p.notchDepth??8);
    if (len === 0) return '';
    const nx=-dy/len,ny=dx/len;
    const mx=x0+dx*0.5,my=y0+dy*0.5;
    return `L ${(mx+nx*h).toFixed(2)} ${(my+ny*h).toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  },
  arch_edge:   (x0,y0,x1,y1,p,cw,ch) => arch(x0,y0,x1,y1,{...p,archHeight:25},cw,ch),
  royal_curve: (x0,y0,x1,y1,p,cw,ch) => arch(x0,y0,x1,y1,{...p,archHeight:40},cw,ch),
  mosque_arch: (x0,y0,x1,y1,p) => {
    const h=mmToPx(p.archHeight??45);
    const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy);
    if (len === 0) return '';
    const nx=-dy/len,ny=dx/len;
    const q0x=x0+dx*0.25+nx*h*0.5, q0y=y0+dy*0.25+ny*h*0.5;
    const mx=x0+dx*0.5+nx*h, my=y0+dy*0.5+ny*h;
    const q1x=x0+dx*0.75+nx*h*0.5, q1y=y0+dy*0.75+ny*h*0.5;
    return `Q ${q0x.toFixed(2)} ${q0y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)} Q ${q1x.toFixed(2)} ${q1y.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  },
  indian_arch: (x0,y0,x1,y1,p,cw,ch) => arch(x0,y0,x1,y1,{...p,archHeight:50},cw,ch),
  bracket_edge: bracket,
  curved_bracket: (x0,y0,x1,y1,p,cw,ch) => bracket(x0,y0,x1,y1,{...p,cornerRadius:20},cw,ch),
  crown_edge: (x0,y0,x1,y1,p) => {
    const h=mmToPx(p.archHeight??30);
    const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy);
    if (len === 0) return '';
    const nx=-dy/len,ny=dx/len;
    const p1={x:x0+dx*0.25+nx*h*0.7,y:y0+dy*0.25+ny*h*0.7};
    const p2={x:x0+dx*0.5+nx*h,y:y0+dy*0.5+ny*h};
    const p3={x:x0+dx*0.75+nx*h*0.7,y:y0+dy*0.75+ny*h*0.7};
    return `L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  },
};

// ─── Main boundary builder ────────────────────────────────────────────────────
/**
 * Builds one continuous closed SVG path for the card outer boundary
 * given a FourSideEdgeConfig.
 * Supports per-side independent parameters (topParams, rightParams, etc.)
 * and library shape items!
 */
export function buildFourSideBoundaryPath(
  cfg: FourSideEdgeConfig & {
    topParams?: EdgeParams;
    rightParams?: EdgeParams;
    bottomParams?: EdgeParams;
    leftParams?: EdgeParams;
  },
  cardW: number,
  cardH: number,
): string {
  const baseParams = cfg.params || {};
  const topP = cfg.topParams || baseParams;
  const rightP = cfg.rightParams || baseParams;
  const bottomP = cfg.bottomParams || baseParams;
  const leftP = cfg.leftParams || baseParams;

  // Corner coordinates (card corners)
  const TL = { x: 0,     y: 0     };
  const TR = { x: cardW, y: 0     };
  const BR = { x: cardW, y: cardH };
  const BL = { x: 0,     y: cardH };

  const getSeg = (id: string, x0: number, y0: number, x1: number, y1: number, p: EdgeParams, sideName: 'top'|'right'|'bottom'|'left') => {
    // 1. Check built-in generators
    if (EDGE_GENERATORS[id]) {
      return EDGE_GENERATORS[id](x0, y0, x1, y1, p, cardW, cardH, sideName);
    }
    // 2. Check library registry
    const libItem = DieCutLibraryRegistry.getById(id);
    if (libItem && libItem.pathD) {
      return buildLibraryEdgeSegment(libItem.pathD, x0, y0, x1, y1, p);
    }
    return straight(x0, y0, x1, y1, p, cardW, cardH);
  };

  // Start at top-left
  let d = `M ${TL.x} ${TL.y}`;

  // TOP (TL → TR)
  d += ' ' + getSeg(cfg.topEdge, TL.x, TL.y, TR.x, TR.y, topP, 'top');

  // RIGHT (TR → BR)
  d += ' ' + getSeg(cfg.rightEdge, TR.x, TR.y, BR.x, BR.y, rightP, 'right');

  // BOTTOM (BR → BL)
  d += ' ' + getSeg(cfg.bottomEdge, BR.x, BR.y, BL.x, BL.y, bottomP, 'bottom');

  // LEFT (BL → TL)
  d += ' ' + getSeg(cfg.leftEdge, BL.x, BL.y, TL.x, TL.y, leftP, 'left');

  d += ' Z';
  return d;
}

/** Returns a CSS clip-path string from the four-side config */
export function buildFourSideClipPath(
  cfg: FourSideEdgeConfig,
  cardW: number,
  cardH: number,
): string {
  return `path('${buildFourSideBoundaryPath(cfg, cardW, cardH)}')`;
}

/** List of edge shape IDs available in the UI */
export const EDGE_SHAPE_IDS = Object.keys(EDGE_GENERATORS);

/** Default four-side config (all straight) */
export function defaultFourSideConfig(): FourSideEdgeConfig {
  return {
    topEdge: 'straight_edge',
    rightEdge: 'straight_edge',
    bottomEdge: 'straight_edge',
    leftEdge: 'straight_edge',
    topLeftCorner: 'square',
    topRightCorner: 'square',
    bottomLeftCorner: 'square',
    bottomRightCorner: 'square',
    params: {
      waveAmplitude: 3, waveFrequency: 8,
      scallopRadius: 5, notchDepth: 5, notchWidth: 10,
      cornerRadius: 10, zigzagHeight: 5, zigzagWidth: 8,
      archHeight: 25,
    },
  };
}
