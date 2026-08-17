import React from 'react';
import { Scissors, Trash2, Eye, EyeOff, Box } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { VECTOR_DIE_CUT_LIBRARY } from '../../data/diecutLibrary';

export const UsedShapesPanel: React.FC = () => {
  const {
    getActivePage,
    partialCuts,
    setEdgeSide,
    removePartialCutObject,
    removeCutOut,
    setSelectedPartialCutId,
    updatePartialCutObject,
    setSelected,
    showToast,
  } = useStudioStore();

  const page = getActivePage();
  if (!page) return null;

  const fourSides = page.cardShape?.fourSides;
  const cutOuts = page.cardShape?.cutOuts ?? [];

  // Collect all active edge shapes
  const edgeItems: Array<{ side: 'top' | 'right' | 'bottom' | 'left'; shapeId: string }> = [];
  if (fourSides?.topEdge && fourSides.topEdge !== 'straight') {
    edgeItems.push({ side: 'top', shapeId: fourSides.topEdge });
  }
  if (fourSides?.rightEdge && fourSides.rightEdge !== 'straight') {
    edgeItems.push({ side: 'right', shapeId: fourSides.rightEdge });
  }
  if (fourSides?.bottomEdge && fourSides.bottomEdge !== 'straight') {
    edgeItems.push({ side: 'bottom', shapeId: fourSides.bottomEdge });
  }
  if (fourSides?.leftEdge && fourSides.leftEdge !== 'straight') {
    edgeItems.push({ side: 'left', shapeId: fourSides.leftEdge });
  }

  const hasUsedShapes = edgeItems.length > 0 || partialCuts.length > 0 || cutOuts.length > 0;

  return (
    <div className="p-3 rounded-2xl bg-[#1A1816] border border-[#252118] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#E5D7C5] uppercase tracking-wider flex items-center gap-1.5">
          <Scissors className="h-3.5 w-3.5 text-[#C9956C]" /> USED IN THIS DESIGN
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9956C]/20 text-[#C9956C] font-mono border border-[#C9956C]/30">
          Page-Aware
        </span>
      </div>

      {!hasUsedShapes ? (
        <div className="p-3 text-center rounded-xl bg-[#141210] border border-[#252118] text-[11px] text-[#8C8073]">
          No die-cut shapes applied to current artboard page yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
          
          {/* 1. USED EDGE CUTS */}
          {edgeItems.map(item => {
            const shape = VECTOR_DIE_CUT_LIBRARY.find(s => s.id === item.shapeId);
            const name = shape ? shape.name : item.shapeId;

            return (
              <div key={`edge-${item.side}`} className="p-2 rounded-xl bg-[#141210] border border-[#252118] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1A1816] border border-[#252118] flex items-center justify-center text-[#C9956C] font-mono text-[10px] uppercase font-bold">
                    {item.side[0]}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#E5D7C5]">{name}</div>
                    <span className="text-[9px] text-[#8C8073] uppercase">{item.side} Edge Cut</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEdgeSide(item.side, 'straight');
                    showToast(`Reset ${item.side.toUpperCase()} edge to Straight`);
                  }}
                  className="p-1 text-red-400 hover:bg-red-950/40 rounded transition-colors"
                  title="Remove Edge Shape"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {/* 2. USED PARTIAL CUT OBJECTS */}
          {partialCuts.map(pc => (
            <div key={pc.id} className="p-2 rounded-xl bg-[#141210] border border-[#252118] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1A1816] border border-[#252118] flex items-center justify-center text-pink-400">
                  <Box className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#E5D7C5] truncate max-w-[110px]">{pc.name}</div>
                  <span className="text-[9px] text-pink-400 font-mono uppercase">{pc.cutType || 'Partial Cut'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedPartialCutId(pc.id);
                    setSelected(null);
                    showToast(`Selected ${pc.name}`);
                  }}
                  className="p-1 text-[#C9956C] hover:bg-[#252118] rounded"
                  title="Select on canvas"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => {
                    updatePartialCutObject(pc.id, { visible: pc.visible === false ? true : false });
                    showToast(`${pc.visible === false ? 'Shown' : 'Hidden'} ${pc.name}`);
                  }}
                  className="p-1 text-[#8C8073] hover:text-[#E5D7C5] hover:bg-[#252118] rounded"
                  title={pc.visible === false ? "Show on canvas" : "Hide from canvas"}
                >
                  {pc.visible === false ? <EyeOff className="h-3.5 w-3.5 text-red-400" /> : <Eye className="h-3.5 w-3.5" />}
                </button>

                <button
                  onClick={() => {
                    removePartialCutObject(pc.id);
                    showToast(`Removed ${pc.name}`);
                  }}
                  className="p-1 text-red-400 hover:bg-red-950/40 rounded"
                  title="Remove Partial Cut"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* 3. USED APERTURES / INNER CUTOUTS */}
          {cutOuts.map(c => (
            <div key={c.id} className="p-2 rounded-xl bg-[#141210] border border-[#252118] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1A1816] border border-[#252118] flex items-center justify-center text-amber-400">
                  <Scissors className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#E5D7C5] truncate max-w-[110px]">{c.name || c.shape}</div>
                  <span className="text-[9px] text-amber-400 font-mono uppercase">{c.cutMode}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  removeCutOut(page.id, c.id);
                  showToast(`Removed cut-out aperture`);
                }}
                className="p-1 text-red-400 hover:bg-red-950/40 rounded"
                title="Remove Aperture"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default UsedShapesPanel;
