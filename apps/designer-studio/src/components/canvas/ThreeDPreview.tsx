/**
 * ThreeDPreview
 * CSS-based 3D simulation for partial-cut objects.
 * States: flat | lifted | folded | popped
 *
 * Renders only when a partial-cut object is selected and
 * its popState is not 'flat'.
 */

import React from 'react';
import type { PartialCutObject, PopState } from '../../types/diecut';

interface Props {
  obj: PartialCutObject;
  zoom: number;
}

function getTransform(popState: PopState, popAngle: number, fold: string): React.CSSProperties {
  switch (popState) {
    case 'flat':
      return { transform: 'none', opacity: 1 };
    case 'lifted': {
      const deg = popAngle || 30;
      return {
        transform: `rotateX(${-deg}deg) translateZ(${deg * 0.5}px)`,
        transformOrigin: fold === 'vertical' ? '50% 100%' : '100% 50%',
        filter: `drop-shadow(0 ${deg * 0.3}px ${deg * 0.5}px rgba(0,0,0,0.4))`,
      };
    }
    case 'folded': {
      const deg = popAngle || 60;
      return {
        transform: `rotateX(${-deg}deg)`,
        transformOrigin: fold === 'vertical' ? '50% 100%' : '100% 50%',
        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.5))',
      };
    }
    case 'popped': {
      return {
        transform: 'rotateX(-75deg) translateZ(20px) scale(1.05)',
        transformOrigin: '50% 100%',
        filter: 'drop-shadow(0 16px 24px rgba(0,0,0,0.6))',
      };
    }
    default:
      return {};
  }
}

export const ThreeDPreview: React.FC<Props> = ({ obj, zoom }) => {
  if (obj.popState === 'flat') return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: obj.x * zoom,
    top: obj.y * zoom,
    width: obj.width * zoom,
    height: obj.height * zoom,
    transformStyle: 'preserve-3d',
    perspective: 600,
    pointerEvents: 'none',
    zIndex: 50,
    ...getTransform(obj.popState, obj.popAngle, obj.fold),
  };

  return (
    <div style={style}>
      {/* Wing overlay for butterfly-like shapes */}
      {obj.svgPathD && (
        <svg
          viewBox={`0 0 ${obj.width} ${obj.height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <path
            d={obj.svgPathD}
            fill="rgba(201,149,108,0.25)"
            stroke="#C9956C"
            strokeWidth="1.5"
          />
          {(obj.scoreLines ?? []).map((sl, i) => (
            <path key={i} d={sl} fill="none" stroke="#2196F3" strokeWidth="1.5" strokeDasharray="5,3" />
          ))}
        </svg>
      )}
    </div>
  );
};

export default ThreeDPreview;
