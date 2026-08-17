import React, { useRef, useState, useCallback } from 'react';
import {
  RotateCw, Lock, EyeOff, Copy, Scissors, Clipboard,
  Trash2, FlipHorizontal, FlipVertical, ArrowUp, ArrowDown, Layers,
  ZoomIn, ZoomOut, Grid, Ruler
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { getCardClipPath } from '../../utils/shapeUtils';
import { ShapeData } from '../../data/shapes';
import type { DesignElement, TextBlock } from '../../store/studioStore';
import type { PartialCutObject } from '../../types/diecut';
import { ProductionOverlay } from './ProductionOverlay';
import { processFreehandPath, generatePresetShapeCutPath, getShrinkWrappedViewBox } from '../../utils/freehandCutUtils';

// ─── Background renderer ────────────────────────────────────────────────────
const TEXTURES: Record<string, React.CSSProperties> = {
  marble_rose_gold: {
    background: `
      radial-gradient(ellipse at 15% 15%, rgba(220, 160, 130, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 85%, rgba(190, 130, 110, 0.3) 0%, transparent 50%),
      linear-gradient(135deg, #F5E6D8 0%, #EDD5C0 15%, #F7E2CE 30%, #E8CEBA 45%, #F0D8C5 60%, #EAD3BC 75%, #F2DEC9 90%, #E6CEBA 100%)
    `,
  },
  marble_white: {
    background: `
      radial-gradient(ellipse at 20% 30%, rgba(180, 180, 190, 0.25) 0%, transparent 40%),
      linear-gradient(135deg, #FAF8F5 0%, #F0ECE8 35%, #F5F2EE 65%, #ECE7E2 100%)
    `,
  },
  marble_dark_onyx: {
    background: `
      radial-gradient(ellipse at 25% 25%, rgba(201, 149, 108, 0.3) 0%, transparent 50%),
      linear-gradient(135deg, #121212 0%, #1A1A1A 50%, #0D0D0D 100%)
    `,
  },
  linen: {
    background: `
      repeating-linear-gradient(0deg, #F5EFE7 0px, #F5EFE7 1px, #EDE7DD 2px, #EDE7DD 4px),
      linear-gradient(135deg, #F7F2EC 0%, #EDE6DC 100%)
    `,
  },
  ivory: {
    background: '#FFFDF4',
  },
};

const CardBackground: React.FC<{
  page: ReturnType<typeof useStudioStore.getState>['pages'][number];
  width: number;
  height: number;
}> = ({ page, width, height }) => {
  const { background } = page;
  const activeFoilMaskView = useStudioStore(s => s.activeFoilMaskView);
  const activeMachinePass = useStudioStore(s => s.activeMachinePass);

  const style: React.CSSProperties = { position: 'absolute', inset: 0, width, height };

  if (activeMachinePass === 'm1_diecut' || activeMachinePass === 'm3_text' || activeMachinePass === 'm4a_design_foil' || activeMachinePass === 'm4b_text_foil') {
    return <div style={{ ...style, background: '#FFFFFF' }} />;
  }
  if (activeFoilMaskView !== 'composite') {
    return <div style={{ ...style, background: '#000000' }} />;
  }
  if (background.type === 'texture' && background.textureId && TEXTURES[background.textureId]) {
    return <div style={{ ...style, ...TEXTURES[background.textureId] }} />;
  }
  if (background.type === 'gradient' && background.gradient) {
    const { from, to, angle } = background.gradient;
    return <div style={{ ...style, background: `linear-gradient(${angle}deg, ${from}, ${to})` }} />;
  }
  if (background.type === 'image' && background.imageUrl) {
    return <div style={{ ...style, backgroundImage: `url(${background.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />;
  }
  return <div style={{ ...style, background: background.color || '#FAF0E8' }} />;
};

// ─── Draggable element on canvas ────────────────────────────────────────────
const DraggableElement: React.FC<{
  element: DesignElement;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<DesignElement>) => void;
}> = ({ element, isSelected, scale, onSelect, onUpdate }) => {
  const dragStart = useRef<{ mx: number; my: number; ex: number; ey: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    if (element.locked) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, ex: element.x, ey: element.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (ev.clientX - dragStart.current.mx) / scale;
      const dy = (ev.clientY - dragStart.current.my) / scale;
      onUpdate({ x: Math.round(dragStart.current.ex + dx), y: Math.round(dragStart.current.ey + dy) });
    };
    const onUp = () => { dragStart.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResize = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (element.locked) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = element.width;
    const startH = element.height;
    const startPosX = element.x;
    const startPosY = element.y;

    const onResizeMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      let newW = startW;
      let newH = startH;
      let newX = startPosX;
      let newY = startPosY;

      if (handle.includes('e')) newW = Math.max(20, startW + dx);
      if (handle.includes('s')) newH = Math.max(20, startH + dy);
      if (handle.includes('w')) {
        const wDelta = startW - Math.max(20, startW - dx);
        newW = Math.max(20, startW - dx);
        newX = startPosX + wDelta;
      }
      if (handle.includes('n')) {
        const hDelta = startH - Math.max(20, startH - dy);
        newH = Math.max(20, startH - dy);
        newY = startPosY + hDelta;
      }
      onUpdate({ width: Math.round(newW), height: Math.round(newH), x: Math.round(newX), y: Math.round(newY) });
    };

    const onResizeUp = () => {
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeUp);
    };
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);
  };

  const handleRotateDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.locked) return;
    const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 };

    const onRotateMove = (ev: MouseEvent) => {
      const cardEl = (e.target as HTMLElement).closest('.invitation-card');
      if (!cardEl) return;
      const rect = cardEl.getBoundingClientRect();
      const mouseX = (ev.clientX - rect.left) / scale;
      const mouseY = (ev.clientY - rect.top) / scale;
      const rad = Math.atan2(mouseY - center.y, mouseX - center.x);
      let deg = Math.round(rad * (180 / Math.PI)) + 90;
      if (deg < 0) deg += 360;
      onUpdate({ rotation: deg });
    };

    const onRotateUp = () => {
      window.removeEventListener('mousemove', onRotateMove);
      window.removeEventListener('mouseup', onRotateUp);
    };
    window.addEventListener('mousemove', onRotateMove);
    window.addEventListener('mouseup', onRotateUp);
  };

  if (!element.visible) return null;

  return (
    <div
      className={`element-wrapper ${isSelected ? 'selected ring-2 ring-[#C9956C]' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg) scaleX(${element.flipH ? -1 : 1}) scaleY(${element.flipV ? -1 : 1})`,
        opacity: element.opacity,
        mixBlendMode: element.blendMode as any,
        position: 'absolute',
        cursor: element.locked ? 'not-allowed' : 'move',
      }}
      onMouseDown={handleMouseDown}
    >
      {element.locked && (
        <div style={{ position: 'absolute', top: -8, right: -8, zIndex: 10, background: '#C9956C', color: '#111', padding: 2, borderRadius: '50%' }}>
          <Lock className="h-3 w-3" />
        </div>
      )}

      {element.src.startsWith('<svg') || element.src.startsWith('<SVG') ? (
        <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }} dangerouslySetInnerHTML={{ __html: element.src }} />
      ) : (
        <img src={element.src} alt={element.name} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
      )}

      {isSelected && !element.locked && (
        <>
          <div
            onMouseDown={handleRotateDrag}
            style={{
              position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
              width: 16, height: 16, borderRadius: '50%', background: '#C9956C', color: '#161412',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', zIndex: 30,
            }}
          >
            <RotateCw className="h-2.5 w-2.5" />
          </div>
          {[
            { id: 'nw', style: { top: -4, left: -4 } },
            { id: 'ne', style: { top: -4, right: -4 } },
            { id: 'sw', style: { bottom: -4, left: -4 } },
            { id: 'se', style: { bottom: -4, right: -4 } },
          ].map(h => (
            <div key={h.id} onMouseDown={e => handleResize(e, h.id)}
              style={{ position: 'absolute', width: 8, height: 8, background: '#fff', border: '1.5px solid #C9956C', borderRadius: 2, zIndex: 25, ...h.style }} />
          ))}
        </>
      )}
    </div>
  );
};

// ─── Draggable text block on canvas ─────────────────────────────────────────
const DraggableTextBlock: React.FC<{
  block: TextBlock;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBlock>) => void;
}> = ({ block, isSelected, scale, onSelect, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; bx: number; by: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editing) return;
    e.stopPropagation();
    onSelect();
    if (block.locked) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: block.x, by: block.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (ev.clientX - dragStart.current.mx) / scale;
      const dy = (ev.clientY - dragStart.current.my) / scale;
      onUpdate({ x: dragStart.current.bx + dx, y: dragStart.current.by + dy });
    };
    const onUp = () => { dragStart.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!block.visible) return null;

  const textStyle: React.CSSProperties = {
    fontFamily: block.fontFamily,
    fontSize: block.fontSize,
    fontWeight: block.fontWeight,
    fontStyle: block.fontStyle,
    color: block.fontColor,
    textAlign: block.textAlign,
    lineHeight: block.lineHeight,
    letterSpacing: block.letterSpacing,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    width: '100%',
  };

  const resolveVariables = useStudioStore(s => s.resolveVariables);
  const displayContent = resolveVariables(block.content);

  return (
    <div
      className={`text-block-wrapper ${isSelected ? 'selected ring-2 ring-[#C9956C]' : ''}`}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        position: 'absolute',
        cursor: block.locked ? 'not-allowed' : 'move',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => !block.locked && setEditing(true)}
    >
      {editing ? (
        <textarea
          autoFocus
          value={block.content}
          onChange={e => onUpdate({ content: e.target.value })}
          onBlur={() => setEditing(false)}
          className="w-full bg-[#161412]/80 p-2 border border-[#C9956C] rounded outline-none"
          style={textStyle}
          rows={Math.max(2, block.content.split('\n').length + 1)}
        />
      ) : (
        <div style={textStyle}>{displayContent}</div>
      )}
    </div>
  );
};

// ─── Draggable Die-Cut Shape on Canvas (With Full MS Paint Drag Resize Handles) ────────────────────────
const DraggablePartialCut: React.FC<{
  pc: PartialCutObject;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<PartialCutObject>) => void;
}> = ({ pc, isSelected, scale, onSelect, onUpdate }) => {
  const dragStart = useRef<{ mx: number; my: number; ex: number; ey: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    if (pc.locked) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, ex: pc.x, ey: pc.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (ev.clientX - dragStart.current.mx) / scale;
      const dy = (ev.clientY - dragStart.current.my) / scale;
      onUpdate({ x: Math.round(dragStart.current.ex + dx), y: Math.round(dragStart.current.ey + dy) });
    };
    const onUp = () => { dragStart.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResize = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (pc.locked) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = pc.width;
    const startH = pc.height;
    const startPosX = pc.x;
    const startPosY = pc.y;

    const onResizeMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      let newW = startW;
      let newH = startH;
      let newX = startPosX;
      let newY = startPosY;

      if (handle.includes('e')) newW = Math.max(20, startW + dx);
      if (handle.includes('s')) newH = Math.max(20, startH + dy);
      if (handle.includes('w')) {
        const wDelta = startW - Math.max(20, startW - dx);
        newW = Math.max(20, startW - dx);
        newX = startPosX + wDelta;
      }
      if (handle.includes('n')) {
        const hDelta = startH - Math.max(20, startH - dy);
        newH = Math.max(20, startH - dy);
        newY = startPosY + hDelta;
      }
      onUpdate({ width: Math.round(newW), height: Math.round(newH), x: Math.round(newX), y: Math.round(newY) });
    };

    const onResizeUp = () => {
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeUp);
    };
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);
  };

  const handleRotateDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pc.locked) return;
    const center = { x: pc.x + pc.width / 2, y: pc.y + pc.height / 2 };

    const onRotateMove = (ev: MouseEvent) => {
      const cardEl = (e.target as HTMLElement).closest('.invitation-card');
      if (!cardEl) return;
      const rect = cardEl.getBoundingClientRect();
      const mouseX = (ev.clientX - rect.left) / scale;
      const mouseY = (ev.clientY - rect.top) / scale;
      const rad = Math.atan2(mouseY - center.y, mouseX - center.x);
      let deg = Math.round(rad * (180 / Math.PI)) + 90;
      if (deg < 0) deg += 360;
      onUpdate({ rotation: deg });
    };

    const onRotateUp = () => {
      window.removeEventListener('mousemove', onRotateMove);
      window.removeEventListener('mouseup', onRotateUp);
    };
    window.addEventListener('mousemove', onRotateMove);
    window.addEventListener('mouseup', onRotateUp);
  };

  if (pc.visible === false) return null;

  const colorMap: Record<string, string> = {
    cut: '#FF0000',
    partial_cut: '#FF00FF',
    score: '#0000FF',
    perforation: '#00AA00',
    engrave: '#CCAA00',
  };
  const color = colorMap[pc.cutType] || '#FF00FF';

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: pc.x,
        top: pc.y,
        width: pc.width,
        height: pc.height,
        transform: `rotate(${pc.rotation || 0}deg)`,
        cursor: pc.locked ? 'default' : 'move',
        zIndex: 30,
        outline: isSelected ? `2px solid ${color}` : 'none',
      }}
      title={`${pc.name} (${pc.cutType}) — Drag handles to resize`}
    >
      {pc.svgPathD && (
        <svg
          viewBox={getShrinkWrappedViewBox(pc.svgPathD, `0 0 ${pc.originalWidth || 100} ${pc.originalHeight || 40}`)}
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <path d={pc.svgPathD} fill={`${color}18`} stroke={color} strokeWidth="1.5" strokeDasharray={pc.cutType === 'partial_cut' ? '6,3' : 'none'} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', color, fontSize: 8, padding: '1px 6px', borderRadius: 3, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        ✂ {pc.name} ({Math.round(pc.width / 3.78)}×{Math.round(pc.height / 3.78)}mm)
      </div>

      {isSelected && !pc.locked && (
        <>
          {/* Top Rotation handle */}
          <div
            onMouseDown={handleRotateDrag}
            style={{
              position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
              width: 16, height: 16, borderRadius: '50%', background: color, color: '#161412',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', zIndex: 45,
            }}
            title="Rotate Shape"
          >
            <RotateCw className="h-2.5 w-2.5" />
          </div>

          {/* 8 MS Paint Style Drag Resize Handles */}
          {[
            { id: 'nw', cursor: 'nwse-resize', style: { top: -5, left: -5 } },
            { id: 'ne', cursor: 'nesw-resize', style: { top: -5, right: -5 } },
            { id: 'sw', cursor: 'nesw-resize', style: { bottom: -5, left: -5 } },
            { id: 'se', cursor: 'nwse-resize', style: { bottom: -5, right: -5 } },
            { id: 'n', cursor: 'ns-resize', style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
            { id: 's', cursor: 'ns-resize', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
            { id: 'w', cursor: 'ew-resize', style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
            { id: 'e', cursor: 'ew-resize', style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
          ].map(h => (
            <div
              key={h.id}
              onMouseDown={e => handleResize(e, h.id)}
              style={{
                position: 'absolute', width: 10, height: 10, background: '#ffffff', border: `2px solid ${color}`,
                borderRadius: 2, zIndex: 40, cursor: h.cursor, boxShadow: '0 2px 4px rgba(0,0,0,0.5)', ...h.style
              }}
              title="Drag handle to resize shape"
            />
          ))}
        </>
      )}
    </div>
  );
};

// ─── Main Canvas Area Component ──────────────────────────────────────────────
const CARD_W = 561; // 148mm
const CARD_H = 794; // 210mm

export const CanvasArea: React.FC = () => {
  const {
    zoom, setZoom, showGrid, toggleGrid, getActivePage, activePageId,
    selected, setSelected, activeTool,
    updateElement, updateTextBlock, deleteElement, deleteTextBlock,
    copySelected, cutSelected, pasteClipboard, duplicateSelected,
    rotateSelected, flipSelectedH, flipSelectedV,
    toggleLockSelected, toggleVisibilitySelected, bringForward, sendBackward,
    toastMessage, partialCuts, selectedPartialCutId, setSelectedPartialCutId, updatePartialCutObject,
    addPartialCutObject, showToast,
    // Phase 1 & Phase 8 UI State
    uiMode, setUiMode, showRulers, toggleRulers,
    fitZoomToScreen, fitZoomToWidth, setZoomPreset, selectedEdgeSide,
    drawDieCutTool, drawDieCutOperation, drawSmoothingLevel, drawForceClose,
    drawBridgeCount, drawBridgeWidthMm, drawScoreFold
  } = useStudioStore();

  const page = getActivePage();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const isDrawing = useRef(false);

  const cardW = CARD_W * zoom;
  const cardH = CARD_H * zoom;

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'pencil' || activeTool === 'draw_shape') return;
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('invitation-card')) {
      setSelected(null);
      setSelectedPartialCutId(null);
    }
  }, [setSelected, setSelectedPartialCutId, activeTool]);

  const handlePencilMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'pencil' && activeTool !== 'draw_shape') return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    isDrawing.current = true;
    setDrawingPoints([{ x, y }]);
  };

  const handlePencilMouseMove = (e: React.MouseEvent) => {
    if ((activeTool !== 'pencil' && activeTool !== 'draw_shape') || !isDrawing.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setDrawingPoints(pts => [...pts, { x, y }]);
  };

  const handlePencilMouseUp = () => {
    if ((activeTool !== 'pencil' && activeTool !== 'draw_shape') || !isDrawing.current || drawingPoints.length < 2) {
      isDrawing.current = false;
      setDrawingPoints([]);
      return;
    }
    isDrawing.current = false;

    // Process drawn stroke into real SVG path geometry
    let res: { svgPathD: string; minX: number; minY: number; width: number; height: number; isClosed: boolean } | null = null;

    if (drawDieCutTool === 'freehand') {
      res = processFreehandPath(drawingPoints, drawSmoothingLevel, drawForceClose);
    } else {
      const startP = drawingPoints[0];
      const lastP = drawingPoints[drawingPoints.length - 1];
      const minX = Math.round(Math.min(startP.x, lastP.x));
      const minY = Math.round(Math.min(startP.y, lastP.y));
      const width = Math.max(30, Math.round(Math.abs(lastP.x - startP.x)));
      const height = Math.max(30, Math.round(Math.abs(lastP.y - startP.y)));
      const svgPathD = generatePresetShapeCutPath(drawDieCutTool, width, height);
      res = { svgPathD, minX, minY, width, height, isClosed: true };
    }

    if (res && res.svgPathD) {
      const customCount = partialCuts.filter(pc => pc.name.startsWith('Custom Cut')).length + 1;
      const newCut: PartialCutObject = {
        id: `custom-cut-${Date.now()}`,
        name: `Custom Cut ${customCount}`,
        shapeId: `custom-drawn-${Date.now()}`,
        cutType: drawDieCutOperation,
        x: res.minX,
        y: res.minY,
        width: res.width,
        height: res.height,
        originalWidth: res.width,
        originalHeight: res.height,
        rotation: 0,
        bridges: {
          count: drawBridgeCount,
          widthMm: drawBridgeWidthMm,
          position: 50,
        },
        fold: drawScoreFold,
        popState: 'flat',
        popAngle: 45,
        svgPathD: res.svgPathD,
        scoreLines: drawScoreFold === 'vertical'
          ? [`M ${res.width / 2} 0 L ${res.width / 2} ${res.height}`]
          : drawScoreFold === 'horizontal'
          ? [`M 0 ${res.height / 2} L ${res.width} ${res.height / 2}`]
          : [],
        visible: true,
        locked: false,
      };

      addPartialCutObject(newCut);
      setSelectedPartialCutId(newCut.id);
      showToast(`✦ Created Custom Cut (${newCut.name})`);
    }

    setDrawingPoints([]);
  };

  if (!page) return null;

  const pageRot = page.rotation || 0;
  const effectiveClipPath = getCardClipPath(page.cardShape);

  // Build live rubber-band preview path D for Paint-style shape drawing
  let previewPathD = '';
  if (drawingPoints.length > 1) {
    const startP = drawingPoints[0];
    const lastP = drawingPoints[drawingPoints.length - 1];

    if (drawDieCutTool === 'freehand') {
      previewPathD = `M ${drawingPoints[0].x} ${drawingPoints[0].y}`;
      for (let i = 1; i < drawingPoints.length; i++) {
        previewPathD += ` L ${drawingPoints[i].x} ${drawingPoints[i].y}`;
      }
    } else {
      const minX = Math.min(startP.x, lastP.x);
      const minY = Math.min(startP.y, lastP.y);
      const w = Math.max(10, Math.abs(lastP.x - startP.x));
      const h = Math.max(10, Math.abs(lastP.y - startP.y));

      if (drawDieCutTool === 'rectangle') {
        previewPathD = `M ${minX} ${minY} L ${minX + w} ${minY} L ${minX + w} ${minY + h} L ${minX} ${minY + h} Z`;
      } else if (drawDieCutTool === 'circle') {
        const rx = w / 2;
        const ry = h / 2;
        previewPathD = `M ${minX} ${minY + ry} A ${rx} ${ry} 0 1 0 ${minX + w} ${minY + ry} A ${rx} ${ry} 0 1 0 ${minX} ${minY + ry} Z`;
      } else if (drawDieCutTool === 'line') {
        previewPathD = `M ${startP.x} ${startP.y} L ${lastP.x} ${lastP.y}`;
      } else if (drawDieCutTool === 'curve') {
        previewPathD = `M ${startP.x} ${lastP.y} Q ${(startP.x + lastP.x) / 2} ${startP.y} ${lastP.x} ${lastP.y}`;
      } else {
        previewPathD = `M ${minX} ${minY} L ${minX + w} ${minY} L ${minX + w} ${minY + h} L ${minX} ${minY + h} Z`;
      }
    }
  }

  return (
    <div
      className="canvas-workspace relative flex-1 flex flex-col items-center justify-between overflow-hidden select-none"
      style={{ background: '#12100E' }}
      onClick={handleCanvasClick}
    >
      {/* Active Drawing Mode Banner */}
      {(activeTool === 'draw_shape' || activeTool === 'pencil') && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#C9956C] text-[#161412] text-xs font-bold px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 animate-pulse">
          <RotateCw className="h-3.5 w-3.5 animate-spin" />
          <span>PAINT MODE ACTIVE: Click & drag on invitation card to draw {drawDieCutTool.toUpperCase()} cut</span>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-[#C9956C] text-[#161412] text-xs font-bold px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2">
          <span>✦</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Canvas Quick Actions Bar */}
      {selected && (
        <div className="absolute top-4 z-40 bg-[#1A1816] border border-[#C9956C] rounded-lg px-3 py-1.5 shadow-2xl flex items-center gap-2 text-[#E5D7C5]">
          <button onClick={cutSelected} className="p-1 rounded hover:bg-[#252118]" title="Cut (Ctrl+X)"><Scissors className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <button onClick={copySelected} className="p-1 rounded hover:bg-[#252118]" title="Copy (Ctrl+C)"><Copy className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <button onClick={pasteClipboard} className="p-1 rounded hover:bg-[#252118]" title="Paste (Ctrl+V)"><Clipboard className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <button onClick={duplicateSelected} className="p-1 rounded hover:bg-[#252118]" title="Duplicate (Ctrl+D)"><Layers className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <div className="w-px h-4 bg-[#252118]" />
          <button onClick={() => rotateSelected(90)} className="p-1 rounded hover:bg-[#252118]" title="Rotate 90° (R)"><RotateCw className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <button onClick={flipSelectedH} className="p-1 rounded hover:bg-[#252118]" title="Flip Horizontal (Shift+H)"><FlipHorizontal className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <button onClick={flipSelectedV} className="p-1 rounded hover:bg-[#252118]" title="Flip Vertical (Shift+V)"><FlipVertical className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <div className="w-px h-4 bg-[#252118]" />
          <button onClick={bringForward} className="p-1 rounded hover:bg-[#252118]" title="Bring Forward (Ctrl+]"><ArrowUp className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <button onClick={sendBackward} className="p-1 rounded hover:bg-[#252118]" title="Send Backward (Ctrl+["><ArrowDown className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <div className="w-px h-4 bg-[#252118]" />
          <button onClick={toggleLockSelected} className="p-1 rounded hover:bg-[#252118]" title="Lock/Unlock (Ctrl+L)"><Lock className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <button onClick={toggleVisibilitySelected} className="p-1 rounded hover:bg-[#252118]" title="Hide/Show (Ctrl+H)"><EyeOff className="h-3.5 w-3.5 text-[#C9956C]" /></button>
          <button onClick={() => {
            if (selected.layer === 'element') deleteElement(activePageId, selected.id);
            if (selected.layer === 'textblock') deleteTextBlock(activePageId, selected.id);
          }} className="p-1 rounded hover:bg-red-950/60 text-red-400" title="Delete (Del)"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Main Canvas Scroll Viewport */}
      <div className="flex-1 w-full flex items-center justify-center relative overflow-auto p-8 no-scrollbar">
        {/* mm Rulers */}
        {showRulers && (
          <div className="absolute top-2 left-2 right-2 h-5 border-b border-[#252118] text-[9px] font-mono text-[#8C8073] flex items-center justify-between px-10 pointer-events-none">
            <span>0mm</span>
            <span>25mm</span>
            <span>50mm</span>
            <span>75mm</span>
            <span>100mm</span>
            <span>125mm</span>
            <span>148mm</span>
          </div>
        )}

        {/* Hero Invitation Card */}
        <div
          ref={canvasRef}
          className="invitation-card relative transition-all duration-300 rounded-sm"
          style={{
            width: cardW,
            height: cardH,
            clipPath: effectiveClipPath,
            WebkitClipPath: effectiveClipPath,
            transform: `rotate(${pageRot}deg)`,
            boxShadow: '0 20px 60px -10px rgba(0,0,0,0.65), 0 0 1px 1px rgba(255,255,255,0.05)',
            cursor: activeTool === 'pencil' || activeTool === 'draw_shape' ? 'crosshair' : 'default',
          }}
          onMouseDown={handlePencilMouseDown}
          onMouseMove={handlePencilMouseMove}
          onMouseUp={handlePencilMouseUp}
        >
          {/* Card Background */}
          <CardBackground page={page} width={cardW} height={cardH} />

          {/* Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-10" style={{
              backgroundImage: 'radial-gradient(circle, rgba(201, 149, 108, 0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          )}

          {/* Target Edge Side Highlight (Only in Production Mode) */}
          {uiMode === 'production' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              {selectedEdgeSide === 'top' && <line x1="0" y1="2" x2={cardW} y2="2" stroke="#C9956C" strokeWidth="4" />}
              {selectedEdgeSide === 'right' && <line x1={cardW - 2} y1="0" x2={cardW - 2} y2={cardH} stroke="#C9956C" strokeWidth="4" />}
              {selectedEdgeSide === 'bottom' && <line x1="0" y1={cardH - 2} x2={cardW} y2={cardH - 2} stroke="#C9956C" strokeWidth="4" />}
              {selectedEdgeSide === 'left' && <line x1="2" y1="0" x2="2" y2={cardH} stroke="#C9956C" strokeWidth="4" />}
            </svg>
          )}

          {/* Content Layer Scale Container */}
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '0 0', width: CARD_W, height: CARD_H }}>
            {/* Live Freehand Cut Drawing Path Preview Overlay */}
            {(activeTool === 'pencil' || activeTool === 'draw_shape') && previewPathD && (
              <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 60, width: CARD_W, height: CARD_H }}>
                <path
                  d={previewPathD}
                  fill="none"
                  stroke={drawDieCutOperation === 'cut' ? '#FF0000' : drawDieCutOperation === 'partial_cut' ? '#FF00FF' : '#0000FF'}
                  strokeWidth="2"
                  strokeDasharray="4,2"
                />
              </svg>
            )}

            {/* Placed Page Cutouts & Aperture Windows Overlay */}
            {page.cardShape?.cutOuts?.map(cut => {
              const shapeDef = ShapeData.getShape(cut.shape || cut.name || '');
              const pathD = cut.svgPathD || shapeDef?.svgPathD;
              if (!pathD) return null;

              return (
                <svg
                  key={cut.id}
                  style={{
                    position: 'absolute',
                    left: cut.x ?? 0,
                    top: cut.y ?? 0,
                    width: cut.width || CARD_W,
                    height: cut.height || 100,
                    pointerEvents: 'none',
                    zIndex: 45,
                  }}
                  viewBox={`0 0 ${cut.width || CARD_W} ${cut.height || 100}`}
                  preserveAspectRatio="none"
                >
                  <path
                    d={pathD}
                    fill={cut.cutMode === 'inner_hole' ? 'rgba(22, 20, 18, 0.95)' : 'none'}
                    stroke={cut.cutMode === 'inner_hole' ? '#FF0055' : '#C9956C'}
                    strokeWidth="2.5"
                    strokeDasharray={cut.cutMode === 'partial_popup' ? '5,3' : undefined}
                  />
                </svg>
              );
            })}

            {/* Partial Cut Objects */}
            {partialCuts.map(pc => (
              <DraggablePartialCut
                key={pc.id}
                pc={pc}
                isSelected={selectedPartialCutId === pc.id}
                scale={zoom}
                onSelect={() => {
                  setSelectedPartialCutId(pc.id);
                  setSelected(null);
                }}
                onUpdate={updates => updatePartialCutObject(pc.id, updates)}
              />
            ))}

            {/* Design Elements */}
            {page.elements.map(el => (
              <DraggableElement
                key={el.id}
                element={el}
                isSelected={selected?.layer === 'element' && selected.id === el.id}
                scale={zoom}
                onSelect={() => setSelected({ layer: 'element', id: el.id })}
                onUpdate={updates => updateElement(activePageId, el.id, updates)}
              />
            ))}

            {/* Text Blocks */}
            {page.textBlocks.map(tb => (
              <DraggableTextBlock
                key={tb.id}
                block={tb}
                isSelected={selected?.layer === 'textblock' && selected.id === tb.id}
                scale={zoom}
                onSelect={() => setSelected({ layer: 'textblock', id: tb.id })}
                onUpdate={updates => updateTextBlock(activePageId, tb.id, updates)}
              />
            ))}
          </div>

          {/* Production Mode Line Overlay */}
          <ProductionOverlay cardW={CARD_W} cardH={CARD_H} />
        </div>
      </div>

      {/* ─── 3. BOTTOM WORKSPACE CONTROLS BAR ───────────────────────────── */}
      <div className="w-full h-10 bg-[#161412] border-t border-[#252118] px-4 flex items-center justify-between text-xs text-[#9E9285] select-none z-30">
        {/* Left: Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            className="p-1 rounded hover:bg-[#252118] hover:text-[#E5D7C5]"
            title="Zoom Out (Ctrl-)"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>

          <select
            value={Math.round(zoom * 100)}
            onChange={e => setZoomPreset(Number(e.target.value))}
            className="bg-[#1A1816] text-[#E5D7C5] text-xs px-2 py-0.5 rounded outline-none border border-[#252118]"
          >
            <option value="25">25%</option>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
          </select>

          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="p-1 rounded hover:bg-[#252118] hover:text-[#E5D7C5]"
            title="Zoom In (Ctrl+)"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Center: Zoom Presets */}
        <div className="flex items-center gap-1 font-semibold">
          <button
            onClick={fitZoomToScreen}
            className="px-2.5 py-0.5 rounded bg-[#1A1816] border border-[#252118] text-[#E5D7C5] hover:border-[#C9956C]"
          >
            Fit Screen
          </button>
          <button
            onClick={fitZoomToWidth}
            className="px-2.5 py-0.5 rounded bg-[#1A1816] border border-[#252118] text-[#E5D7C5] hover:border-[#C9956C]"
          >
            Fit Width
          </button>
          <button
            onClick={() => setZoomPreset(100)}
            className="px-2.5 py-0.5 rounded bg-[#1A1816] border border-[#252118] text-[#E5D7C5] hover:border-[#C9956C]"
          >
            100%
          </button>
        </div>

        {/* Right: Mode & Overlay Toggles */}
        <div className="flex items-center gap-3">
          {/* Rulers Toggle */}
          <button
            onClick={toggleRulers}
            className={`flex items-center gap-1 text-[11px] ${showRulers ? 'text-[#C9956C] font-bold' : 'hover:text-[#E5D7C5]'}`}
            title="Toggle mm Rulers"
          >
            <Ruler className="h-3 w-3" /> Rulers
          </button>

          {/* Grid Toggle */}
          <button
            onClick={toggleGrid}
            className={`flex items-center gap-1 text-[11px] ${showGrid ? 'text-[#C9956C] font-bold' : 'hover:text-[#E5D7C5]'}`}
            title="Toggle Grid (G)"
          >
            <Grid className="h-3 w-3" /> Grid
          </button>

          <div className="w-px h-3 bg-[#252118]" />

          {/* Mode Indicator */}
          <div
            onClick={() => setUiMode(uiMode === 'design' ? 'production' : 'design')}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-all ${
              uiMode === 'production' ? 'bg-amber-950/40 text-amber-400 border-amber-500' : 'bg-[#252118] text-[#C9956C] border-[#C9956C]'
            }`}
          >
            {uiMode === 'design' ? '🎨 DESIGN MODE' : '⚙ PRODUCTION MODE'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
