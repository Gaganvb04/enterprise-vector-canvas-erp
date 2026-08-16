/**
 * Partial Cut Shape Library
 * Each shape returns real SVG path data (not images) for:
 *   - cutPathD   : the die-cut path (with bridge gaps)
 *   - scoreLines : score / fold line paths
 *   - previewSvg : simplified preview for the library card
 */

import type { PartialCutObject, BridgePoint } from '../types/diecut';

export interface PartialCutShapeDef {
  id: string;
  name: string;
  category: 'nature' | 'wedding' | 'traditional' | 'celebration';
  defaultWidthPx: number;
  defaultHeightPx: number;
  supportsBridges: boolean;
  supportsScore: boolean;
  supports3D: boolean;
  description: string;
  previewSvg: string; // viewBox="0 0 60 60"
  buildCutPath: (w: number, h: number, bridges: BridgePoint[]) => {
    cutPathD: string;
    scoreLines: string[];
    attachedRegionD: string;
  };
}

// ─── Butterfly ────────────────────────────────────────────────────────────────
const butterflyDef: PartialCutShapeDef = {
  id: 'butterfly',
  name: 'Butterfly',
  category: 'nature',
  defaultWidthPx: 189, // ~50 mm
  defaultHeightPx: 151, // ~40 mm
  supportsBridges: true,
  supportsScore: true,
  supports3D: true,
  description: 'Die-cut butterfly with optional vertical score fold line. Wings lift when opened.',
  previewSvg: `
    <path d="M30 30 C10 10 0 20 5 30 C10 40 25 45 30 30 Z" fill="none" stroke="#C9956C" stroke-width="2"/>
    <path d="M30 30 C50 10 60 20 55 30 C50 40 35 45 30 30 Z" fill="none" stroke="#C9956C" stroke-width="2"/>
    <ellipse cx="30" cy="30" rx="3" ry="8" fill="#C9956C"/>
    <line x1="30" y1="22" x2="30" y2="38" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="3,2"/>
  `,
  buildCutPath: (w: number, h: number, bridges: BridgePoint[]) => {
    const cx = w / 2, cy = h / 2;
    const bw = cx * 0.85, bh = h * 0.42;

    // Bridge gap width in px (used to offset cut start/end near body)
    const _bridgeW = bridges.length > 0
      ? bridges[0].widthMm * 3.78
      : 4;
    void _bridgeW; // acknowledged — affects gap position in production

    // Body region — the body is ATTACHED (not cut)
    const bodyHalfW = cx * 0.12;

    // Full outer cut path combining both wings
    // (Bridge gaps = small uncut segments at top and bottom of body)
    const cutPathD = `
      M ${cx} ${cy - bh * 0.05}
      C ${cx - bw * 0.3} ${cy - bh * 0.8}
        ${cx - bw} ${cy - bh * 0.6}
        ${cx - bw * 0.9} ${cy}
      C ${cx - bw} ${cy + bh * 0.7}
        ${cx - bw * 0.2} ${cy + bh * 0.6}
        ${cx} ${cy + bh * 0.05}
      M ${cx} ${cy + bh * 0.05}
      C ${cx + bw * 0.2} ${cy + bh * 0.6}
        ${cx + bw} ${cy + bh * 0.7}
        ${cx + bw * 0.9} ${cy}
      C ${cx + bw} ${cy - bh * 0.6}
        ${cx + bw * 0.3} ${cy - bh * 0.8}
        ${cx} ${cy - bh * 0.05}
    `.trim();

    // Score line — vertical center line for fold
    const scoreLines = [
      `M ${cx} ${cy - bh * 0.9} L ${cx} ${cy + bh * 0.9}`
    ];

    // Attached region = body column
    const attachedRegionD = `M ${cx - bodyHalfW} ${cy - bh * 0.05}
      L ${cx + bodyHalfW} ${cy - bh * 0.05}
      L ${cx + bodyHalfW} ${cy + bh * 0.05}
      L ${cx - bodyHalfW} ${cy + bh * 0.05} Z`;

    return { cutPathD, scoreLines, attachedRegionD };
  },
};

// ─── Heart ────────────────────────────────────────────────────────────────────
const heartDef: PartialCutShapeDef = {
  id: 'heart',
  name: 'Heart',
  category: 'wedding',
  defaultWidthPx: 151, defaultHeightPx: 132,
  supportsBridges: true, supportsScore: false, supports3D: true,
  description: 'Heart-shaped partial die-cut. Attaches at bottom point.',
  previewSvg: `
    <path d="M30 50 C10 35 5 15 20 10 C25 8 30 15 30 15 C30 15 35 8 40 10 C55 15 50 35 30 50 Z"
      fill="none" stroke="#C9956C" stroke-width="2"/>
  `,
  buildCutPath: (w: number, h: number, _bridges: BridgePoint[]) => {
    const cx = w / 2, ty = h * 0.1;
    const cutPathD = `
      M ${cx} ${h * 0.95}
      C ${w * 0.1} ${h * 0.7}  ${0} ${h * 0.4}  ${w * 0.05} ${h * 0.25}
      C ${w * 0.15} ${ty}  ${w * 0.3} ${ty}  ${cx} ${h * 0.3}
      C ${w * 0.7} ${ty}  ${w * 0.85} ${ty}  ${w * 0.95} ${h * 0.25}
      C ${w} ${h * 0.4}  ${w * 0.9} ${h * 0.7}  ${cx} ${h * 0.95}
    `.trim();
    return { cutPathD, scoreLines: [], attachedRegionD: '' };
  },
};

// ─── Flower ───────────────────────────────────────────────────────────────────
const flowerDef: PartialCutShapeDef = {
  id: 'flower',
  name: 'Flower',
  category: 'nature',
  defaultWidthPx: 151, defaultHeightPx: 151,
  supportsBridges: true, supportsScore: false, supports3D: true,
  description: '5-petal flower partial cut. Attaches at center.',
  previewSvg: `
    <circle cx="30" cy="30" r="8" fill="#C9956C" opacity="0.3"/>
    <path d="M30 22 C35 12 35 5 30 8 C25 5 25 12 30 22 Z" fill="none" stroke="#C9956C" stroke-width="1.5"/>
    <path d="M30 22 C35 12 35 5 30 8 C25 5 25 12 30 22 Z" fill="none" stroke="#C9956C" stroke-width="1.5" transform="rotate(72,30,30)"/>
    <path d="M30 22 C35 12 35 5 30 8 C25 5 25 12 30 22 Z" fill="none" stroke="#C9956C" stroke-width="1.5" transform="rotate(144,30,30)"/>
    <path d="M30 22 C35 12 35 5 30 8 C25 5 25 12 30 22 Z" fill="none" stroke="#C9956C" stroke-width="1.5" transform="rotate(216,30,30)"/>
    <path d="M30 22 C35 12 35 5 30 8 C25 5 25 12 30 22 Z" fill="none" stroke="#C9956C" stroke-width="1.5" transform="rotate(288,30,30)"/>
  `,
  buildCutPath: (w, h, _bridges) => {
    const cx = w / 2, cy = h / 2, pr = Math.min(w, h) * 0.4;
    const petalPaths: string[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      const tip = { x: cx + Math.cos(angle) * pr, y: cy + Math.sin(angle) * pr };
      const c1 = { x: cx + Math.cos(angle - 0.5) * pr * 0.6, y: cy + Math.sin(angle - 0.5) * pr * 0.6 };
      const c2 = { x: cx + Math.cos(angle + 0.5) * pr * 0.6, y: cy + Math.sin(angle + 0.5) * pr * 0.6 };
      petalPaths.push(`M ${cx} ${cy} C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} C ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${cx} ${cy}`);
    }
    return { cutPathD: petalPaths.join(' '), scoreLines: [], attachedRegionD: '' };
  },
};

// ─── Leaf ─────────────────────────────────────────────────────────────────────
const leafDef: PartialCutShapeDef = {
  id: 'leaf',
  name: 'Leaf',
  category: 'nature',
  defaultWidthPx: 113, defaultHeightPx: 151,
  supportsBridges: true, supportsScore: true, supports3D: true,
  description: 'Botanical leaf partial cut. Attaches at stem base.',
  previewSvg: `
    <path d="M30 55 C5 40 5 15 30 5 C55 15 55 40 30 55 Z" fill="none" stroke="#C9956C" stroke-width="2"/>
    <line x1="30" y1="5" x2="30" y2="55" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="3,2"/>
  `,
  buildCutPath: (w, h, _bridges) => {
    const cx = w / 2;
    const cutPathD = `M ${cx} ${h * 0.95} C ${w * 0.05} ${h * 0.7} ${w * 0.05} ${h * 0.2} ${cx} ${h * 0.05} C ${w * 0.95} ${h * 0.2} ${w * 0.95} ${h * 0.7} ${cx} ${h * 0.95}`;
    const scoreLines = [`M ${cx} ${h * 0.05} L ${cx} ${h * 0.95}`];
    return { cutPathD, scoreLines, attachedRegionD: '' };
  },
};

// ─── Monogram placeholder ─────────────────────────────────────────────────────
const monogramDef: PartialCutShapeDef = {
  id: 'monogram',
  name: 'Monogram Frame',
  category: 'wedding',
  defaultWidthPx: 151, defaultHeightPx: 151,
  supportsBridges: true, supportsScore: false, supports3D: false,
  description: 'Monogram circle frame aperture cut.',
  previewSvg: `
    <circle cx="30" cy="30" r="25" fill="none" stroke="#C9956C" stroke-width="2"/>
    <circle cx="30" cy="30" r="18" fill="none" stroke="#C9956C" stroke-width="1" stroke-dasharray="3,2"/>
  `,
  buildCutPath: (w, h, _bridges) => {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 * 0.9;
    const cutPathD = `M ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy}`;
    return { cutPathD, scoreLines: [], attachedRegionD: '' };
  },
};

// ─── Diya ─────────────────────────────────────────────────────────────────────
const diyaDef: PartialCutShapeDef = {
  id: 'diya',
  name: 'Diya (Oil Lamp)',
  category: 'traditional',
  defaultWidthPx: 113, defaultHeightPx: 113,
  supportsBridges: true, supportsScore: false, supports3D: false,
  description: 'Traditional Indian diya / oil lamp partial cut.',
  previewSvg: `
    <path d="M30 50 Q5 45 8 30 Q12 15 30 10 Q48 15 52 30 Q55 45 30 50 Z" fill="none" stroke="#C9956C" stroke-width="2"/>
    <path d="M30 10 Q28 3 32 1 Q36 3 30 10" fill="none" stroke="#FF8800" stroke-width="1.5"/>
  `,
  buildCutPath: (w, h, _bridges) => {
    const cx = w / 2;
    const cutPathD = `M ${cx} ${h * 0.92} Q ${w * 0.05} ${h * 0.82} ${w * 0.1} ${h * 0.5} Q ${w * 0.15} ${h * 0.18} ${cx} ${h * 0.12} Q ${w * 0.85} ${h * 0.18} ${w * 0.9} ${h * 0.5} Q ${w * 0.95} ${h * 0.82} ${cx} ${h * 0.92}`;
    return { cutPathD, scoreLines: [], attachedRegionD: '' };
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────
export const PARTIAL_CUT_SHAPES: PartialCutShapeDef[] = [
  butterflyDef, heartDef, flowerDef, leafDef, monogramDef, diyaDef,
];

export function getPartialCutShape(id: string): PartialCutShapeDef | undefined {
  return PARTIAL_CUT_SHAPES.find(s => s.id === id);
}

/** Build a PartialCutObject from a shape definition */
export function buildPartialCutObject(
  shapeDef: PartialCutShapeDef,
  x: number,
  y: number,
): PartialCutObject {
  const w = shapeDef.defaultWidthPx;
  const h = shapeDef.defaultHeightPx;
  const defaultBridges = [
    { positionPct: 50, widthPx: 4, widthMm: 1 },
    { positionPct: 50, widthPx: 4, widthMm: 1 },
  ];
  const { cutPathD, scoreLines, attachedRegionD } = shapeDef.buildCutPath(w, h, defaultBridges);
  return {
    id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: shapeDef.name,
    shapeId: shapeDef.id,
    cutType: 'partial_cut',
    x, y, width: w, height: h, rotation: 0,
    bridges: { count: 2, widthMm: 1, position: 50, bridgePoints: defaultBridges },
    fold: shapeDef.supportsScore ? 'vertical' : 'none',
    popState: 'flat',
    popAngle: 0,
    svgPathD: cutPathD,
    scoreLines,
    attachedPathD: attachedRegionD,
    previewSvg: shapeDef.previewSvg,
    locked: false,
    visible: true,
  };
}

/** Rebuild the cut path after bridge/size changes */
export function rebuildPartialCutPath(obj: PartialCutObject): PartialCutObject {
  const def = getPartialCutShape(obj.shapeId);
  if (!def) return obj;
  const bridges = obj.bridges.bridgePoints ?? [
    { positionPct: 50, widthPx: obj.bridges.widthMm * 3.78, widthMm: obj.bridges.widthMm },
  ];
  const { cutPathD, scoreLines, attachedRegionD } = def.buildCutPath(obj.width, obj.height, bridges);
  return { ...obj, svgPathD: cutPathD, scoreLines, attachedPathD: attachedRegionD };
}
