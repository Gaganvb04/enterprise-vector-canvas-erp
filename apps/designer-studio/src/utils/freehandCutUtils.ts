/**
 * Freehand Vector Die-Cut Utility Engine
 * Converts raw canvas mouse points into clean, smooth, production-ready SVG pathD strings
 * using Chaikin's Corner-Cutting Subdivision Algorithm.
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
 * Simplifies array of 2D points to reduce initial mouse drag noise (pre-pass).
 */
export function simplifyPoints(points: Point[], level: SmoothingLevel = 'medium'): Point[] {
  if (!points || points.length <= 2) return points;

  const stepMap: Record<SmoothingLevel, number> = {
    low: 2,
    medium: 4,
    high: 6,
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
 * Chaikin's Corner-Cutting Subdivision Algorithm
 * ─────────────────────────────────────────────────────────────
 * Given a polyline defined by control points, Chaikin's algorithm cuts off sharp corners
 * by creating two new points on each segment at 25% (Q) and 75% (R) parametric positions:
 *
 *   Q_i = 0.75 * P_i + 0.25 * P_{i+1}
 *   R_i = 0.25 * P_i + 0.75 * P_{i+1}
 *
 * Each iteration pass doubles the vertex density and smoothly rounds geometric corners.
 *
 * @param points Array of 2D control points
 * @param iterations Number of subdivision passes (1 = low, 2 = medium, 3 = high)
 * @param isClosed Whether the path forms a closed loop
 */
export function applyChaikinSubdivision(
  points: Point[],
  iterations: number = 2,
  isClosed: boolean = false
): Point[] {
  if (!points || points.length < 2) return points;

  let currentPoints = [...points];

  for (let pass = 0; pass < iterations; pass++) {
    const nextPoints: Point[] = [];
    const n = currentPoints.length;

    if (n < 2) break;

    if (isClosed) {
      for (let i = 0; i < n; i++) {
        const p0 = currentPoints[i];
        const p1 = currentPoints[(i + 1) % n];

        const q: Point = {
          x: 0.75 * p0.x + 0.25 * p1.x,
          y: 0.75 * p0.y + 0.25 * p1.y,
        };
        const r: Point = {
          x: 0.25 * p0.x + 0.75 * p1.x,
          y: 0.25 * p0.y + 0.75 * p1.y,
        };

        nextPoints.push(q, r);
      }
    } else {
      // Keep start point P0 anchored for open paths
      nextPoints.push(currentPoints[0]);

      for (let i = 0; i < n - 1; i++) {
        const p0 = currentPoints[i];
        const p1 = currentPoints[i + 1];

        const q: Point = {
          x: 0.75 * p0.x + 0.25 * p1.x,
          y: 0.75 * p0.y + 0.25 * p1.y,
        };
        const r: Point = {
          x: 0.25 * p0.x + 0.75 * p1.x,
          y: 0.25 * p0.y + 0.75 * p1.y,
        };

        nextPoints.push(q, r);
      }

      // Keep end point Pn anchored for open paths
      nextPoints.push(currentPoints[n - 1]);
    }

    currentPoints = nextPoints;
  }

  return currentPoints;
}

/**
 * Converts mouse points to a smooth SVG path string relative to bounding box
 * using Chaikin's subdivision algorithm.
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

  // 1. Initial noise reduction pass
  const simplified = simplifyPoints(points, level);

  // 2. Check closure proximity (< 30px distance between start & end)
  const startP = simplified[0];
  const endP = simplified[simplified.length - 1];
  const dist = Math.hypot(endP.x - startP.x, endP.y - startP.y);
  const isClosed = forceClose || dist < 30;

  // 3. Convert points to relative coordinates inside bounding box
  const relPoints = simplified.map(p => ({
    x: Math.round((p.x - minX) * 10) / 10,
    y: Math.round((p.y - minY) * 10) / 10,
  }));

  // 4. Map smoothing level to Chaikin iteration depth
  const iterationsMap: Record<SmoothingLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };
  const iterations = iterationsMap[level] || 2;

  // 5. Apply Chaikin subdivision
  const smoothedPoints = applyChaikinSubdivision(relPoints, iterations, isClosed);

  // 6. Generate SVG Path D String
  let svgPathD = `M ${smoothedPoints[0].x.toFixed(1)} ${smoothedPoints[0].y.toFixed(1)}`;
  for (let i = 1; i < smoothedPoints.length; i++) {
    svgPathD += ` L ${smoothedPoints[i].x.toFixed(1)} ${smoothedPoints[i].y.toFixed(1)}`;
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
