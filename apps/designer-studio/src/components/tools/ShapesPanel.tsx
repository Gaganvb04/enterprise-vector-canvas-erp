import React, { useState } from 'react';
import { Pencil, Trash2, Scissors } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { ShapeData } from '../../data/shapes';

export const ShapesPanel: React.FC = () => {
  const {
    activePageId, getActivePage, showToast,
    activeTool, setActiveTool,
    updateCutOut, setCutOutMode, removeCutOut,
  } = useStudioStore();

  const page = getActivePage();
  const cutOuts = page?.cardShape?.cutOuts ?? [];
  const isPencilActive = activeTool === 'pencil';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const filteredShapes = ShapeData.getShapesBySection(selectedCategory);

  const { selectedShapeForDrawing, setSelectedShapeForDrawing } = useStudioStore();

  const handleAddShapeCut = (shapeId: string) => {
    const shapeDef = ShapeData.getShape(shapeId);
    setSelectedShapeForDrawing(shapeDef);
    showToast(`🎨 Paint Shape Tool Active — Click & drag on canvas to draw ${shapeDef.label}!`);
  };

  return (
    <div className="p-3 space-y-4">
      {/* Header & Instructions */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-1 text-amber-500 flex items-center gap-1.5">
          <Scissors className="h-4 w-4" /> Die-Cut & Aperture Cutters
        </div>
        {selectedShapeForDrawing ? (
          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-600/30 to-amber-800/30 border border-amber-500/60 space-y-1.5 animate-pulse">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>🎨 Paint Shape Tool Active</span>
              <button
                onClick={() => setSelectedShapeForDrawing(null)}
                className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded text-neutral-400 hover:text-white"
              >
                Exit Tool
              </button>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-tight">
              Click & drag anywhere on your card page to draw <strong>{selectedShapeForDrawing.label}</strong>!
            </p>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-neutral-400">
            Pick any shape tool below like in Paint, then <strong>click & drag on your card to draw it</strong> to your exact size! Choose whether to <strong>remove the inside part (hole window)</strong>, <strong>trim outer edge</strong>, or <strong>3D pop-up lift cut</strong>.
          </p>
        )}
      </div>

      {/* Category Pills matching Reference Chart Sections */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 no-scrollbar">
        {[
          { id: 'all', label: 'All 55 Shapes' },
          { id: '1. Basic Edge Cuts', label: '1. Basic Edge Cuts' },
          { id: '2. Wave & Scallop Edge Cuts', label: '2. Wave & Scallop' },
          { id: '3. Notch & Step Edge Cuts', label: '3. Notch & Step' },
          { id: '4. Pointed & Zig Zag Edge Cuts', label: '4. Pointed & Zig Zag' },
          { id: '5. Arch & Curve Decorative Cuts', label: '5. Arch & Curve' },
          { id: '6. Special Cuts & Holes', label: '6. Holes & Apertures' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex-shrink-0 transition-all ${
              selectedCategory === cat.id
                ? 'bg-amber-600 text-white shadow'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Interactive Shapes Grid (Chart 1 & Chart 2) */}
      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-0.5 custom-scrollbar">
        {filteredShapes.map(shape => {
          const isSelectedTool = selectedShapeForDrawing?.id === shape.id;

          return (
            <button
              key={shape.id}
              onClick={() => handleAddShapeCut(shape.id)}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'shape_cut', shapeId: shape.id }));
              }}
              className={`group relative flex flex-col items-center justify-center p-2 rounded-lg transition-all text-center cursor-crosshair ${
                isSelectedTool
                  ? 'bg-amber-500/20 border-2 border-amber-500 shadow-md ring-2 ring-amber-500/50'
                  : 'bg-neutral-900 border border-neutral-800 hover:border-amber-500/80 hover:bg-neutral-800/80'
              }`}
              title={`Click to select tool & drag on canvas to draw ${shape.label}: ${shape.description}`}
            >
              <svg
                viewBox="0 0 48 68"
                className="w-10 h-12 mb-1 group-hover:scale-110 transition-transform"
                fill={isSelectedTool ? 'rgba(245,158,11,0.3)' : 'rgba(201,149,108,0.15)'}
                stroke={isSelectedTool ? '#F59E0B' : '#C9956C'}
                strokeWidth="2"
                dangerouslySetInnerHTML={{ __html: shape.previewSvg }}
              />
              <span className={`text-[9px] font-semibold truncate w-full ${isSelectedTool ? 'text-amber-300 font-bold' : 'text-neutral-300 group-hover:text-amber-300'}`}>
                {shape.label}
              </span>
              <span className="text-[8px] text-neutral-500 capitalize">
                {shape.defaultCutMode === 'inner_hole' ? '⭕ Hole Window' : shape.defaultCutMode === 'outer_shape' ? '✂ Edge Cut' : '🦋 Pop-Up'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Die-Cuts List & Cut Mode Switcher */}
      <div className="pt-3 border-t border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Active Card Shape Cutters ({cutOuts.length})
          </span>
          {cutOuts.length > 0 && (
            <span className="text-[10px] text-neutral-400">Click mode to toggle Inner Hole / Outer Edge</span>
          )}
        </div>

        {cutOuts.length === 0 ? (
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-dashed border-neutral-800 text-center text-xs text-neutral-500">
            No active shape cuts placed yet. Click any shape above to add it to your page!
          </div>
        ) : (
          <div className="space-y-3">
            {cutOuts.map((c, i) => (
              <div key={c.id} className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
                {/* Header: Name + Remove */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                    <Scissors className="h-3.5 w-3.5 text-amber-500" />
                    {c.name || `Shape Cut #${i + 1}`}
                  </span>
                  <button
                    onClick={() => {
                      removeCutOut(activePageId, c.id);
                      showToast('Removed shape cut from page');
                    }}
                    className="p-1 text-red-400 hover:text-red-200 transition-colors"
                    title="Delete this shape cut"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* CUT MODE TOGGLE BUTTONS: Inner Hole vs Outer Edge vs 3D Pop-Up */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                    Select Cut Action / Mode:
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setCutOutMode(activePageId, c.id, 'inner_hole')}
                      className={`py-1 px-1.5 rounded text-[9px] font-bold transition-all text-center ${
                        c.cutMode === 'inner_hole'
                          ? 'bg-amber-500 text-black shadow font-extrabold'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Punches out a hole window (removes the inside part so lower page reveals through)"
                    >
                      ⭕ Cut Inner Hole (Remove Inside)
                    </button>

                    <button
                      onClick={() => setCutOutMode(activePageId, c.id, 'outer_shape')}
                      className={`py-1 px-1.5 rounded text-[9px] font-bold transition-all text-center ${
                        c.cutMode === 'outer_shape'
                          ? 'bg-amber-500 text-black shadow font-extrabold'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Trims the outer paper boundary edge of the card"
                    >
                      ✂ Cut Outer Card Edge
                    </button>

                    <button
                      onClick={() => setCutOutMode(activePageId, c.id, 'partial_popup')}
                      className={`py-1 px-1.5 rounded text-[9px] font-bold transition-all text-center ${
                        c.cutMode === 'partial_popup'
                          ? 'bg-amber-500 text-black shadow font-extrabold'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Cuts outline leaving 1 edge attached for a 3D pop-up lift flap"
                    >
                      🦋 3D Pop-Up Lift Cut
                    </button>
                  </div>
                </div>

                {/* Position & Size Adjusters */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px]">
                  <div>
                    <span className="text-neutral-500 block">X (px)</span>
                    <input
                      type="number"
                      value={c.x}
                      onChange={e => updateCutOut(activePageId, c.id, { x: Number(e.target.value) })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200"
                    />
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Y (px)</span>
                    <input
                      type="number"
                      value={c.y}
                      onChange={e => updateCutOut(activePageId, c.id, { y: Number(e.target.value) })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200"
                    />
                  </div>
                  <div>
                    <span className="text-neutral-500 block">W (px)</span>
                    <input
                      type="number"
                      value={c.width}
                      onChange={e => updateCutOut(activePageId, c.id, { width: Number(e.target.value) })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200"
                    />
                  </div>
                  <div>
                    <span className="text-neutral-500 block">H (px)</span>
                    <input
                      type="number"
                      value={c.height}
                      onChange={e => updateCutOut(activePageId, c.id, { height: Number(e.target.value) })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Freehand Pencil Tool Section */}
      <div className="pt-3 border-t border-neutral-800 space-y-2">
        <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Vector Freehand Cut (Pencil P)</div>
        <button
          onClick={() => {
            const next = isPencilActive ? 'select' : 'pencil';
            setActiveTool(next);
            showToast(next === 'pencil' ? 'Pencil Draw Active — Draw freehand shape on canvas' : 'Select Tool active');
          }}
          className="w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
          style={{
            background: isPencilActive ? '#C9956C' : '#1e1a16',
            color: isPencilActive ? '#111' : '#e8e0d8',
            border: isPencilActive ? '1px solid #C9956C' : '1px dashed #3a3530',
          }}
        >
          <Pencil className="h-4 w-4" />
          {isPencilActive ? 'Drawing Active (Click to Finish)' : '✍ Draw Freehand Custom Cut Line (P)'}
        </button>
      </div>
    </div>
  );
};

export default ShapesPanel;
