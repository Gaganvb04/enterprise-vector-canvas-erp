import React, { useState, useRef, useEffect } from 'react';
import {
  X, RotateCw, RotateCcw, ZoomIn, ZoomOut, RefreshCw, Box
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { getCardClipPath } from '../../utils/shapeUtils';
import type { PopState } from '../../types/diecut';

// A5 card dimensions
const CARD_W = 561; // 148mm
const CARD_H = 794; // 210mm

interface ThreeDPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreeDPreviewModal: React.FC<ThreeDPreviewModalProps> = ({ isOpen, onClose }) => {
  const { getActivePage, partialCuts, materialConfig, documentName, selectedPartialCutId } = useStudioStore();
  const page = getActivePage();

  // Camera & view state
  const [rotX, setRotX] = useState<number>(20);
  const [rotY, setRotY] = useState<number>(-15);
  const [zoomScale, setZoomScale] = useState<number>(0.75);
  const [globalPopState, setGlobalPopState] = useState<PopState>('lifted');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !page) return null;

  // Mouse Drag Camera Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRotY(dragStart.current.ry + dx * 0.4);
    setRotX(Math.max(-60, Math.min(60, dragStart.current.rx - dy * 0.4)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const resetCamera = () => {
    setRotX(20);
    setRotY(-15);
    setZoomScale(0.75);
  };

  const effectiveClipPath = getCardClipPath(page.cardShape);
  const thicknessPx = Math.max(2, Math.round(materialConfig.gsm / 100));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* ─── 1. MODAL HEADER BAR ────────────────────────────────────────── */}
      <div className="w-full h-12 bg-[#141412] border-b border-[#252118] px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[#C9956C]/20 border border-[#C9956C]/40 text-[#C9956C]">
            <Box className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#E5D7C5]">
              3D Physical Invitation Preview
            </h2>
            <p className="text-[10px] text-[#8C8073]">
              {documentName} — {materialConfig.gsm} GSM Paper Thickness
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#8C8073] hover:text-[#E5D7C5] hover:bg-[#252118] transition-colors"
          title="Close Preview (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ─── 2. MAIN 3D VIEWPORT CONTAINER ─────────────────────────────── */}
      <div
        className="flex-1 w-full flex items-center justify-center relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ perspective: '1200px' }}
      >
        {/* Soft Background Studio Glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(201,149,108,0.12)_0%,transparent_70%)]" />

        {/* 3D Transform Paper Card */}
        <div
          className="relative transition-transform duration-75"
          style={{
            width: CARD_W,
            height: CARD_H,
            transformStyle: 'preserve-3d',
            transform: `scale(${zoomScale}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {/* Real Physical Shadow Cast on Studio Floor */}
          <div
            className="absolute inset-0 rounded-lg pointer-events-none transition-all duration-300"
            style={{
              transform: 'translateZ(-20px) scale(0.98)',
              boxShadow: globalPopState === 'flat'
                ? '0 10px 40px rgba(0,0,0,0.5)'
                : globalPopState === 'lifted'
                ? '0 30px 70px rgba(0,0,0,0.65)'
                : globalPopState === 'folded'
                ? '0 40px 90px rgba(0,0,0,0.75)'
                : '0 50px 110px rgba(0,0,0,0.85)',
            }}
          />

          {/* Paper Edge Thickness Layer */}
          <div
            className="absolute inset-0 rounded-sm bg-[#D4C3B3] pointer-events-none"
            style={{
              transform: `translateZ(-${thicknessPx}px)`,
              clipPath: effectiveClipPath,
              WebkitClipPath: effectiveClipPath,
            }}
          />

          {/* Main Invitation Surface */}
          <div
            className="invitation-card-3d relative w-full h-full rounded-sm overflow-hidden"
            style={{
              clipPath: effectiveClipPath,
              WebkitClipPath: effectiveClipPath,
              background: page.background.color || '#FAF0E8',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
            }}
          >
            {/* Background Texture/Gradient */}
            {page.background.type === 'texture' && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#FAF0E8] via-[#F5E6D8] to-[#EAD3BC]" />
            )}

            {/* Design Elements */}
            {page.elements.map(el => (
              el.visible && (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    transform: `rotate(${el.rotation || 0}deg)`,
                    opacity: el.opacity,
                  }}
                >
                  {el.src.startsWith('<svg') ? (
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: el.src }} />
                  ) : (
                    <img src={el.src} alt={el.name} className="w-full h-full object-contain" />
                  )}
                </div>
              )
            ))}

            {/* Text Blocks */}
            {page.textBlocks.map(tb => (
              tb.visible && (
                <div
                  key={tb.id}
                  style={{
                    position: 'absolute',
                    left: tb.x,
                    top: tb.y,
                    width: tb.width,
                    fontFamily: tb.fontFamily,
                    fontSize: tb.fontSize,
                    fontWeight: tb.fontWeight,
                    color: tb.fontColor,
                    textAlign: tb.textAlign,
                    lineHeight: tb.lineHeight,
                    letterSpacing: tb.letterSpacing,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {tb.content}
                </div>
              )
            ))}

            {/* 3D Lifted Partial-Cut / Pop-Up Elements */}
            {partialCuts.map(pc => {
              if (pc.visible === false) return null;
              const isSelected = selectedPartialCutId === pc.id;
              const currentState = globalPopState !== 'flat' ? globalPopState : pc.popState;

              let liftTransform = 'none';
              let filterShadow = 'none';

              if (currentState === 'lifted') {
                liftTransform = `rotateX(-35deg) translateZ(25px)`;
                filterShadow = 'drop-shadow(0 12px 18px rgba(0,0,0,0.45))';
              } else if (currentState === 'folded') {
                liftTransform = pc.fold === 'horizontal' ? 'rotateY(-60deg) translateZ(40px)' : 'rotateX(-60deg) translateZ(40px)';
                filterShadow = 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))';
              } else if (currentState === 'popped') {
                liftTransform = `rotateX(-75deg) translateZ(50px) scale(1.08)`;
                filterShadow = 'drop-shadow(0 25px 40px rgba(0,0,0,0.7))';
              }

              return (
                <div
                  key={pc.id}
                  className="transition-all duration-500 ease-out"
                  style={{
                    position: 'absolute',
                    left: pc.x,
                    top: pc.y,
                    width: pc.width,
                    height: pc.height,
                    transform: `rotate(${pc.rotation || 0}deg) ${liftTransform}`,
                    transformOrigin: pc.fold === 'horizontal' ? '0% 50%' : '50% 100%',
                    transformStyle: 'preserve-3d',
                    filter: filterShadow,
                    outline: isSelected ? '2px solid #C9956C' : 'none',
                    zIndex: 40,
                  }}
                >
                  {pc.svgPathD && (
                    <svg viewBox={`0 0 ${pc.width} ${pc.height}`} className="w-full h-full overflow-visible">
                      <path
                        d={pc.svgPathD}
                        fill="rgba(201, 149, 108, 0.35)"
                        stroke="#C9956C"
                        strokeWidth="2"
                      />
                      {(pc.scoreLines ?? []).map((sl, i) => (
                        <path key={i} d={sl} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4,3" />
                      ))}
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 3. BOTTOM CONTROLS BAR ─────────────────────────────────────── */}
      <div className="w-full h-16 bg-[#141412] border-t border-[#252118] px-8 flex items-center justify-between z-20">
        {/* Pop State Selectors */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#1A1816] border border-[#252118]">
          {(['flat', 'lifted', 'folded', 'popped'] as const).map(st => (
            <button
              key={st}
              onClick={() => setGlobalPopState(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                globalPopState === st
                  ? 'bg-[#C9956C] text-[#161412] shadow-md'
                  : 'text-[#9E9285] hover:text-[#E5D7C5] hover:bg-[#252118]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Camera Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRotY(r => r - 15)}
            className="p-2 rounded-lg bg-[#1A1816] border border-[#252118] text-[#E5D7C5] hover:border-[#C9956C]"
            title="Rotate Left"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setRotY(r => r + 15)}
            className="p-2 rounded-lg bg-[#1A1816] border border-[#252118] text-[#E5D7C5] hover:border-[#C9956C]"
            title="Rotate Right"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-[#252118]" />
          <button
            onClick={() => setZoomScale(z => Math.max(0.4, z - 0.1))}
            className="p-2 rounded-lg bg-[#1A1816] border border-[#252118] text-[#E5D7C5] hover:border-[#C9956C]"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoomScale(z => Math.min(1.4, z + 0.1))}
            className="p-2 rounded-lg bg-[#1A1816] border border-[#252118] text-[#E5D7C5] hover:border-[#C9956C]"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={resetCamera}
            className="p-2 rounded-lg bg-[#1A1816] border border-[#252118] text-[#C9956C] hover:bg-[#252118]"
            title="Reset Camera View"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreeDPreviewModal;
