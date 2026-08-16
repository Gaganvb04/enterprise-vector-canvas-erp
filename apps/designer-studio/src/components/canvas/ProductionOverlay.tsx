/**
 * ProductionOverlay
 * Renders colour-coded production geometry over the canvas when
 * "Production View" is toggled ON.
 *
 * 🔴 RED     = Full Cut (card outer boundary)
 * 🟣 MAGENTA = Partial Cut
 * 🔵 BLUE    = Score
 * 🟢 GREEN   = Perforation
 * 🟡 YELLOW  = Engrave
 * ⚪ GREY    = Bleed zone
 * CYAN        = Safe area
 */

import React from 'react';
import { useStudioStore } from '../../store/studioStore';
import { getCardSvgPathD } from '../../utils/shapeUtils';
import { mmToPx } from '../../utils/edgeEngine';

interface ProductionOverlayProps {
  cardW: number;
  cardH: number;
}

export const ProductionOverlay: React.FC<ProductionOverlayProps> = ({ cardW, cardH }) => {
  const { getActivePage, partialCuts, materialConfig, showProductionLines } = useStudioStore();

  if (!showProductionLines) return null;

  const page = getActivePage();
  if (!page) return null;

  const bleedPx  = mmToPx(materialConfig.bleedMm);
  const safePx   = mmToPx(materialConfig.safeAreaMm);

  const cardOutlineD = getCardSvgPathD(page.cardShape);

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: cardW, height: cardH, zIndex: 90, pointerEvents: 'none' }}
      viewBox={`0 0 ${cardW} ${cardH}`}
    >
      {/* ── Bleed zone (grey, outside boundary) ── */}
      <rect
        x={-bleedPx} y={-bleedPx}
        width={cardW + bleedPx * 2}
        height={cardH + bleedPx * 2}
        fill="rgba(160,160,160,0.08)"
        stroke="#888" strokeWidth="1" strokeDasharray="6,4"
      />

      {/* ── Safe area (cyan) ── */}
      <rect
        x={safePx} y={safePx}
        width={cardW - safePx * 2}
        height={cardH - safePx * 2}
        fill="none"
        stroke="cyan" strokeWidth="0.75" strokeDasharray="4,4" opacity="0.6"
      />

      {/* ── Full Cut path — RED ── */}
      <path
        d={cardOutlineD}
        fill="none"
        stroke="#FF0000"
        strokeWidth="2"
      />

      {/* ── Card cut-outs inner holes — RED ── */}
      {page.cardShape.cutOuts?.filter(c => c.cutMode === 'inner_hole').map(c => (
        <rect key={c.id}
          x={c.x} y={c.y} width={c.width} height={c.height}
          fill="none" stroke="#FF0000" strokeWidth="1.5"
          transform={c.rotation ? `rotate(${c.rotation},${c.x + c.width/2},${c.y + c.height/2})` : undefined}
        />
      ))}

      {/* ── Partial Cuts — MAGENTA ── */}
      {partialCuts.filter(pc => pc.visible !== false).map(pc => (
        <g key={pc.id} transform={`translate(${pc.x},${pc.y}) rotate(${pc.rotation},${pc.width/2},${pc.height/2})`}>
          {pc.svgPathD && (
            <path
              d={pc.svgPathD}
              fill="rgba(255,0,255,0.06)"
              stroke="#FF00FF"
              strokeWidth="1.5"
            />
          )}
          {/* Score lines — BLUE dashed */}
          {(pc.scoreLines ?? []).map((sl, idx) => (
            <path
              key={idx}
              d={sl}
              fill="none"
              stroke="#2196F3"
              strokeWidth="1.2"
              strokeDasharray="5,3"
            />
          ))}
          {/* Bridge indicator dots */}
          {(pc.bridges.bridgePoints ?? []).map((bp, idx) => (
            <circle
              key={idx}
              cx={pc.width / 2}
              cy={bp.positionPct / 100 * pc.height}
              r={3}
              fill="#FF00FF"
              opacity="0.9"
            />
          ))}
          {/* Label */}
          <text
            x={pc.width / 2}
            y={pc.height / 2}
            textAnchor="middle"
            fontSize="9"
            fill="#FF00FF"
            fontFamily="monospace"
            fontWeight="bold"
          >
            🟣 {pc.name}
          </text>
        </g>
      ))}

      {/* ── Legend ── */}
      <g transform={`translate(8,${cardH - 80})`}>
        <rect x="-2" y="-2" width="130" height="78" rx="4" fill="rgba(0,0,0,0.7)" />
        {[
          { color: '#FF0000', label: 'CUT' },
          { color: '#FF00FF', label: 'PARTIAL CUT' },
          { color: '#2196F3', label: 'SCORE' },
          { color: '#4CAF50', label: 'PERFORATION' },
          { color: '#FFEB3B', label: 'ENGRAVE' },
          { color: '#888', label: 'BLEED' },
          { color: 'cyan',  label: 'SAFE AREA' },
        ].map((item, i) => (
          <g key={item.label} transform={`translate(4,${i * 10 + 4})`}>
            <rect width="8" height="6" rx="1" fill={item.color} opacity="0.9" />
            <text x="12" y="6" fontSize="7" fill="#e8e0d8" fontFamily="monospace">{item.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
};

export default ProductionOverlay;
