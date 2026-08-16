/**
 * Freehand Vector Die-Cut Utility Engine
 * Converts raw canvas mouse points into clean, smooth, production-ready SVG pathD strings.
 */

export type DrawDieCutTool = 'freehand' | 'line' | 'curve' | 'rectangle' | 'circle' | 'polygon';
export type SmoothingLevel = 'low' | 'medium' | 'high';

export interface Point {
  x: number;
  y: number;
}

export interface ProcessedPathResult {
  svgPathD: string;
  minX: number;
  minY: number;
  width: number;
  height: number;
  isClosed: boolean;
}

/**
 * Simplifies array of 2D points to reduce noise
 */
export function simplifyPoints(points: Point[], level: SmoothingLevel = 'medium'): Point[] {
  if (points.length <= 2) return points;

  const stepMap: Record<SmoothingLevel, number> = {
    low: 2,
    medium: 4,
    high: 8,
  };
  const step = stepMap[level] || 4;

  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i += step) {
    result.push(points[i]);
  }
  result.push(points[points.length - 1]);
  return result;
}

/**
 * Converts mouse points to smooth SVG path string relative to bounding box
 */
export function processFreehandPath(
  points: Point[],
  level: SmoothingLevel = 'medium',
  forceClose: boolean = true
): ProcessedPathResult | null {
  if (!points || points.length < 2) return null;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;

  const width = Math.max(30, Math.round(rawWidth));
  const height = Math.max(30, Math.round(rawHeight));

  const simplified = simplifyPoints(points, level);

  // Check if start and end points are close enough (< 30px)
  const startP = simplified[0];
  const endP = simplified[simplified.length - 1];
  const dist = Math.hypot(endP.x - startP.x, endP.y - startP.y);
  const isClosed = forceClose || dist < 30;

  // Convert points to relative coords inside bounding box
  const relPoints = simplified.map(p => ({
    x: Math.round(p.x - minX),
    y: Math.round(p.y - minY),
  }));

  // Generate smooth SVG curve using quadratic / cubic segments
  let svgPathD = `M ${relPoints[0].x} ${relPoints[0].y}`;

  if (relPoints.length === 2) {
    svgPathD += ` L ${relPoints[1].x} ${relPoints[1].y}`;
  } else {
    for (let i = 1; i < relPoints.length - 1; i++) {
      const xc = (relPoints[i].x + relPoints[i + 1].x) / 2;
      const yc = (relPoints[i].y + relPoints[i + 1].y) / 2;
      svgPathD += ` Q ${relPoints[i].x} ${relPoints[i].y} ${Math.round(xc)} ${Math.round(yc)}`;
    }
    svgPathD += ` L ${relPoints[relPoints.length - 1].x} ${relPoints[relPoints.length - 1].y}`;
  }

  if (isClosed) {
    svgPathD += ' Z';
  }

  return {
    svgPathD,
    minX: Math.round(minX),
    minY: Math.round(minY),
    width,
    height,
    isClosed,
  };
}

/**
 * Generates vector path geometry for standard geometric cut tools
 */
export function generatePresetShapeCutPath(
  tool: DrawDieCutTool,
  w: number,
  h: number
): string {
  const width = Math.max(30, w);
  const height = Math.max(30, h);

  switch (tool) {
    case 'line':
      return `M 0 0 L ${width} ${height}`;
    case 'curve':
      return `M 0 ${height} Q ${Math.round(width / 2)} 0 ${width} ${height}`;
    case 'rectangle':
      return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;
    case 'circle': {
      const rx = Math.round(width / 2);
      const ry = Math.round(height / 2);
      return `M 0 ${ry} A ${rx} ${ry} 0 1 0 ${width} ${ry} A ${rx} ${ry} 0 1 0 0 ${ry} Z`;
    }
    case 'polygon': {
      const r = Math.min(width, height) / 2;
      const cx = width / 2;
      const cy = height / 2;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 * Math.PI) / 180;
        pts.push(`${Math.round(cx + r * Math.cos(a))},${Math.round(cy + r * Math.sin(a))}`);
      }
      return `M ${pts.join(' L ')} Z`;
    }
    default:
      return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;
  }
}

/**
 * Calculates a shrink-wrapped SVG viewBox string matching exact path bounds (no margin/padding)
 */
export function getShrinkWrappedViewBox(pathD: string, fallbackViewBox?: string): string {
  if (!pathD) return fallbackViewBox || '0 0 100 100';

  const numbers = pathD.match(/[-+]?\d*\.?\d+/g);
  if (!numbers || numbers.length < 2) return fallbackViewBox || '0 0 100 100';

  const xs: number[] = [];
  const ys: number[] = [];

  for (let i = 0; i < numbers.length - 1; i += 2) {
    const x = parseFloat(numbers[i]);
    const y = parseFloat(numbers[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      xs.push(x);
      ys.push(y);
    }
  }

  if (xs.length === 0 || ys.length === 0) return fallbackViewBox || '0 0 100 100';

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);

  return `${minX} ${minY} ${w} ${h}`;
}
