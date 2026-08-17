import type { CardShape } from '../store/studioStore';
import { ShapeData } from '../data/shapes';
import { buildFourSideBoundaryPath } from './edgeEngine';

export const CARD_WIDTH = 561;
export const CARD_HEIGHT = 794;

/**
 * Returns a dynamic CSS clip-path string for the card paper shape
 */
export function getCardClipPath(cardShape: CardShape): string {
  const { shapeId, archHeight = 200, cornerRadius = 0, flapDepth = 150, fourSides, cutOuts } = cardShape;

  // 1. Prioritize outer_shape CutOut placed on page
  const outerCut = cutOuts?.find(c => c.cutMode === 'outer_shape');
  if (outerCut) {
    const shapeDef = ShapeData.getShape(outerCut.shape || outerCut.name || '');
    if (shapeDef && shapeDef.svgPathD) {
      return `path('${shapeDef.svgPathD}')`;
    }
    if (outerCut.svgPathD) {
      return `path('${outerCut.svgPathD}')`;
    }
  }

  // 2. Check 4-side edge configuration if non-straight
  if (fourSides) {
    const isCustomFour =
      fourSides.topEdge !== 'straight_edge' ||
      fourSides.rightEdge !== 'straight_edge' ||
      fourSides.bottomEdge !== 'straight_edge' ||
      fourSides.leftEdge !== 'straight_edge' ||
      fourSides.topLeftCorner !== 'square' ||
      fourSides.topRightCorner !== 'square' ||
      fourSides.bottomLeftCorner !== 'square' ||
      fourSides.bottomRightCorner !== 'square';

    if (isCustomFour) {
      const pathD = buildFourSideBoundaryPath(fourSides, CARD_WIDTH, CARD_HEIGHT);
      return `path('${pathD}')`;
    }
  }

  if (shapeId === 'rectangle') {
    if (cornerRadius > 0) {
      const r = Math.min(cornerRadius, 280);
      return `path('M ${r} 0 L ${CARD_WIDTH - r} 0 Q ${CARD_WIDTH} 0 ${CARD_WIDTH} ${r} L ${CARD_WIDTH} ${CARD_HEIGHT - r} Q ${CARD_WIDTH} ${CARD_HEIGHT} ${CARD_WIDTH - r} ${CARD_HEIGHT} L ${r} ${CARD_HEIGHT} Q 0 ${CARD_HEIGHT} 0 ${CARD_HEIGHT - r} L 0 ${r} Q 0 0 ${r} 0 Z')`;
    }
    return 'inset(0% 0% 0% 0% round 0px)';
  }

  if (shapeId === 'arch_top' || shapeId === 'arch_tall') {
    const h = Math.min(Math.max(50, archHeight), 500);
    return `path('M 0 ${CARD_HEIGHT} L 0 ${h} Q ${CARD_WIDTH / 2} 0 ${CARD_WIDTH} ${h} L ${CARD_WIDTH} ${CARD_HEIGHT} Z')`;
  }

  if (shapeId === 'envelope_flap' || shapeId === 'top_flap') {
    const d = Math.min(Math.max(50, flapDepth), 350);
    return `path('M 0 0 L ${CARD_WIDTH} 0 L ${CARD_WIDTH} 80 Q ${CARD_WIDTH / 2} ${80 + d} 0 80 Z')`;
  }

  if (shapeId === 'gothic_arch') {
    const h = Math.min(Math.max(50, archHeight), 400);
    return `path('M 0 ${CARD_HEIGHT} L 0 ${h} Q 0 0 ${CARD_WIDTH / 2} 0 Q ${CARD_WIDTH} 0 ${CARD_WIDTH} ${h} L ${CARD_WIDTH} ${CARD_HEIGHT} Z')`;
  }

  if (shapeId === 'mihrab_arch') {
    const h = Math.min(Math.max(50, archHeight), 450);
    return `path('M 0 ${CARD_HEIGHT} L 0 ${h} Q ${CARD_WIDTH * 0.25} ${h * 0.5} ${CARD_WIDTH / 2} 0 Q ${CARD_WIDTH * 0.75} ${h * 0.5} ${CARD_WIDTH} ${h} L ${CARD_WIDTH} ${CARD_HEIGHT} Z')`;
  }

  const def = ShapeData.getShape(shapeId);
  if (def && def.svgPathD) {
    return `path('${def.svgPathD}')`;
  }

  return 'inset(0% 0% 0% 0%)';
}

/**
 * Returns raw SVG path D string for rendering die-cut outlines
 */
export function getCardSvgPathD(cardShape: CardShape): string {
  const { shapeId, clipPath, archHeight = 200, cornerRadius = 0, flapDepth = 150 } = cardShape;

  if (shapeId === 'custom' && clipPath) {
    const match = clipPath.match(/path\('([^']+)'\)/i) || clipPath.match(/path\("([^"]+)"\)/i);
    if (match && match[1]) return match[1];
  }

  const outerCut2 = cardShape.cutOuts?.find(c => c.cutMode === 'outer_shape');
  if (outerCut2) {
    const shapeDef2 = ShapeData.getShape(outerCut2.shape || outerCut2.name || '');
    if (shapeDef2 && shapeDef2.svgPathD) return shapeDef2.svgPathD;
  }

  if (cardShape.fourSides) {
    return buildFourSideBoundaryPath(cardShape.fourSides, CARD_WIDTH, CARD_HEIGHT);
  }

  if (shapeId === 'rectangle') {
    if (cornerRadius > 0) {
      const r = Math.min(cornerRadius, 280);
      return `M ${r} 0 L ${CARD_WIDTH - r} 0 Q ${CARD_WIDTH} 0 ${CARD_WIDTH} ${r} L ${CARD_WIDTH} ${CARD_HEIGHT - r} Q ${CARD_WIDTH} ${CARD_HEIGHT} ${CARD_WIDTH - r} ${CARD_HEIGHT} L ${r} ${CARD_HEIGHT} Q 0 ${CARD_HEIGHT} 0 ${CARD_HEIGHT - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
    }
    return `M 0 0 L ${CARD_WIDTH} 0 L ${CARD_WIDTH} ${CARD_HEIGHT} L 0 ${CARD_HEIGHT} Z`;
  }

  if (shapeId === 'arch_top' || shapeId === 'arch_tall') {
    const h = Math.min(Math.max(50, archHeight), 500);
    return `M 0 ${CARD_HEIGHT} L 0 ${h} Q ${CARD_WIDTH / 2} 0 ${CARD_WIDTH} ${h} L ${CARD_WIDTH} ${CARD_HEIGHT} Z`;
  }

  if (shapeId === 'envelope_flap' || shapeId === 'top_flap') {
    const d = Math.min(Math.max(50, flapDepth), 350);
    return `M 0 0 L ${CARD_WIDTH} 0 L ${CARD_WIDTH} 80 Q ${CARD_WIDTH / 2} ${80 + d} 0 80 Z`;
  }

  if (shapeId === 'gothic_arch') {
    const h = Math.min(Math.max(50, archHeight), 400);
    return `M 0 ${CARD_HEIGHT} L 0 ${h} Q 0 0 ${CARD_WIDTH / 2} 0 Q ${CARD_WIDTH} 0 ${CARD_WIDTH} ${h} L ${CARD_WIDTH} ${CARD_HEIGHT} Z`;
  }

  if (shapeId === 'mihrab_arch') {
    const h = Math.min(Math.max(50, archHeight), 450);
    return `M 0 ${CARD_HEIGHT} L 0 ${h} Q ${CARD_WIDTH * 0.25} ${h * 0.5} ${CARD_WIDTH / 2} 0 Q ${CARD_WIDTH * 0.75} ${h * 0.5} ${CARD_WIDTH} ${h} L ${CARD_WIDTH} ${CARD_HEIGHT} Z`;
  }

  const def = ShapeData.getShape(shapeId);
  if (def && def.svgPathD) {
    return def.svgPathD;
  }

  return `M 0 0 L ${CARD_WIDTH} 0 L ${CARD_WIDTH} ${CARD_HEIGHT} L 0 ${CARD_HEIGHT} Z`;
}

/**
 * Combines 4-side edge selections & corner cuts into one seamless vector outer boundary path D string
 */
export function combine4SideOuterBoundaryPath(cardShape: CardShape): string {
  if (!cardShape.fourSides) {
    return getCardSvgPathD(cardShape);
  }

  const { topEdge, rightEdge, bottomEdge, leftEdge } = cardShape.fourSides;

  // TOP EDGE SEGMENT
  let topPath = `M 0 0 L ${CARD_WIDTH} 0`;
  if (topEdge === 'arch_edge' || topEdge === 'royal_curve') {
    topPath = `M 0 100 Q ${CARD_WIDTH / 2} 0 ${CARD_WIDTH} 100`;
  } else if (topEdge === 'mosque_arch') {
    topPath = `M 0 120 Q ${CARD_WIDTH * 0.25} 60 ${CARD_WIDTH / 2} 0 Q ${CARD_WIDTH * 0.75} 60 ${CARD_WIDTH} 120`;
  } else if (topEdge === 'scallop_md' || topEdge === 'scallop_lg') {
    topPath = `M 0 40 Q 70 10 140 40 Q 210 10 280 40 Q 350 10 420 40 Q 490 10 ${CARD_WIDTH} 40`;
  } else if (topEdge === 'wave_soft' || topEdge === 'wave_deep') {
    topPath = `M 0 30 Q 140 60 280 30 T ${CARD_WIDTH} 30`;
  } else if (topEdge === 'crown_edge') {
    topPath = `M 0 80 L 140 0 L 280 80 L 420 0 L ${CARD_WIDTH} 80`;
  }

  // RIGHT EDGE SEGMENT
  let rightPath = `L ${CARD_WIDTH} ${CARD_HEIGHT}`;
  if (rightEdge === 'wave_soft' || rightEdge === 'wave_deep') {
    rightPath = `Q ${CARD_WIDTH + 30} ${CARD_HEIGHT / 2} ${CARD_WIDTH} ${CARD_HEIGHT}`;
  } else if (rightEdge === 'scallop_md') {
    rightPath = `Q ${CARD_WIDTH - 20} ${CARD_HEIGHT * 0.25} ${CARD_WIDTH} ${CARD_HEIGHT * 0.5} Q ${CARD_WIDTH - 20} ${CARD_HEIGHT * 0.75} ${CARD_WIDTH} ${CARD_HEIGHT}`;
  }

  // BOTTOM EDGE SEGMENT
  let bottomPath = `L 0 ${CARD_HEIGHT}`;
  if (bottomEdge === 'scallop_md' || bottomEdge === 'scallop_lg') {
    bottomPath = `Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT - 30} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT - 30} 0 ${CARD_HEIGHT}`;
  } else if (bottomEdge === 'concave_curve') {
    bottomPath = `Q ${CARD_WIDTH / 2} ${CARD_HEIGHT - 80} 0 ${CARD_HEIGHT}`;
  }

  // LEFT EDGE SEGMENT
  let leftPath = `Z`;
  if (leftEdge === 'wave_soft') {
    leftPath = `Q -30 ${CARD_HEIGHT / 2} 0 0 Z`;
  }

  return `${topPath} ${rightPath} ${bottomPath} ${leftPath}`;
}
