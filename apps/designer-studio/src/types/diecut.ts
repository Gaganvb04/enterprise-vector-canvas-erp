// ─── Core Cut Line Types ─────────────────────────────────────────────────────
export type CutLineType = 'cut' | 'partial_cut' | 'score' | 'perforation' | 'engrave' | 'print';
export type EdgeSide = 'top' | 'right' | 'bottom' | 'left';
export type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export type PopState = 'flat' | 'lifted' | 'folded' | 'popped';

// ─── Edge & Corner Parameters ────────────────────────────────────────────────
export interface EdgeParams {
  waveAmplitude?: number;  // mm  (default 3)
  waveFrequency?: number;  // mm  (default 8)
  scallopRadius?: number;  // mm  (default 5)
  scallopSpacing?: number; // mm  (default 0)
  notchDepth?: number;     // mm  (default 5)
  notchWidth?: number;     // mm  (default 10)
  cornerRadius?: number;   // mm  (default 10)
  zigzagHeight?: number;   // mm  (default 5)
  zigzagWidth?: number;    // mm  (default 8)
  archHeight?: number;     // px  (default 100)
}

export interface FourSideEdgeConfig {
  topEdge: string;
  rightEdge: string;
  bottomEdge: string;
  leftEdge: string;
  topLeftCorner: string;
  topRightCorner: string;
  bottomLeftCorner: string;
  bottomRightCorner: string;
  params: EdgeParams;
}

// ─── Attachment Bridges ──────────────────────────────────────────────────────
export interface BridgePoint {
  positionPct: number; // 0-100% along the partial-cut perimeter
  widthMm: number;     // physical width of this bridge
}

export interface AttachmentBridge {
  count: number;        // 1 | 2 | 3 | 4
  widthMm: number;      // default bridge width mm
  position: number;     // legacy: primary position 0-100%
  bridgePoints?: BridgePoint[]; // actual bridge positions
}

// ─── Partial Cut Object ──────────────────────────────────────────────────────
export interface PartialCutObject {
  id: string;
  name: string;
  shapeId: string;
  cutType: CutLineType;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  rotation: number;
  bridges: AttachmentBridge;
  fold: 'none' | 'vertical' | 'horizontal';
  popState: PopState;
  popAngle: number;     // 0 - 90 deg
  svgPathD?: string;    // the cut path (with bridge gaps)
  scoreLines?: string[]; // score line SVG paths
  attachedPathD?: string; // attached portion path
  previewSvg?: string;
  locked?: boolean;
  visible?: boolean;
}

// ─── Score Line ──────────────────────────────────────────────────────────────
export interface ScoreLine {
  id: string;
  name: string;
  pathD: string;       // SVG path
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scoreType: 'horizontal' | 'vertical' | 'diagonal' | 'custom';
}

// ─── Perforation ─────────────────────────────────────────────────────────────
export interface PerforationLine {
  id: string;
  pathD: string;
  cutLengthMm: number;  // default 3
  gapLengthMm: number;  // default 2
  angle: number;
}

// ─── Material & Production Config ────────────────────────────────────────────
export interface MaterialConfig {
  gsm: 180 | 220 | 250 | 300 | 350 | 400;
  paperType: 'Premium Cardstock' | 'Textured Paper' | 'Handmade Paper' | 'Metallic Foil';
  bleedMm: number;          // default 3.0
  safeAreaMm: number;       // default 5.0
  minCutWidthMm: number;    // default 1.0
  minBridgeWidthMm: number; // default 0.8
  minGapMm: number;         // default 0.8
}

// ─── Card Dimensions ──────────────────────────────────────────────────────────
export interface CardDimensions {
  widthMm: number;   // e.g. 148
  heightMm: number;  // e.g. 210
  widthPx: number;   // internal canvas px  e.g. 561
  heightPx: number;  // internal canvas px  e.g. 794
}

export const A5_DIMENSIONS: CardDimensions = {
  widthMm: 148, heightMm: 210, widthPx: 561, heightPx: 794,
};

// ─── Validation ──────────────────────────────────────────────────────────────
export interface ValidationWarning {
  id: string;
  severity: 'valid' | 'warning' | 'error';
  category: 'bridge' | 'geometry' | 'score' | 'bleed' | 'path' | 'material';
  message: string;
  objectId?: string;
}

// ─── DieCut Shape Definition (library item) ──────────────────────────────────
export type DieCutCategory =
  | 'edge' | 'corner' | 'partial' | 'aperture'
  | 'score' | 'perforation' | 'ornamental'
  | 'traditional' | 'wedding' | 'nature' | 'geometric' | 'technical';

export type DieCutOperation =
  | 'cut' | 'partial_cut' | 'aperture' | 'score' | 'perforation' | 'engrave' | 'print';

export interface DieCutShapeDef {
  id: string;
  name: string;
  category: DieCutCategory;
  operation: DieCutOperation;
  defaultCutType: CutLineType;
  svgPathD: string;
  previewSvg: string;
  defaultWidth: number;
  defaultHeight: number;
  supportsRotation: boolean;
  supportsScaling: boolean;
  supportsBridges: boolean;
  supports3D: boolean;
  supportsFold: boolean;
  description: string;
  productionColor?: string; // for production overlay
}

// ─── Production Manifest ──────────────────────────────────────────────────────
export interface ProductionManifest {
  card: { widthMm: number; heightMm: number };
  material: { gsm: number; paperType: string };
  bleedMm: number;
  safeAreaMm: number;
  edges: FourSideEdgeConfig | null;
  cutPaths: string[];
  partialCutPaths: PartialCutObject[];
  scorePaths: ScoreLine[];
  perforationPaths: PerforationLine[];
  engravePaths: string[];
  validation: ValidationWarning[];
  generatedAt: string;
}
