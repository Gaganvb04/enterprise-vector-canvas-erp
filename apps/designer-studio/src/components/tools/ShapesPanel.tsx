import React, { useState } from 'react';
import {
  Scissors, History, Star, Clock, Check, Sparkles, X,
  Pencil, Trash2, ChevronRight, Layers, LayoutGrid
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { ShapeData } from '../../data/shapes';

const SECTIONS = [
  { id: 'all', label: 'All' },
  { id: '1. Basic Edge Cuts', label: 'Edge Cuts' },
  { id: '2. Wave & Scallop Edge Cuts', label: 'Wave & Scallop' },
  { id: '3. Notch & Step Edge Cuts', label: 'Notch & Step' },
  { id: '4. Pointed & Zig Zag Edge Cuts', label: 'Zig Zag' },
  { id: '5. Arch & Curve Decorative Cuts', label: 'Arch & Curve' },
  { id: '6. Special Cuts & Holes', label: 'Apertures' },
];

export const ShapesPanel: React.FC = () => {
  const {
    activePageId, getActivePage, showToast,
    activeTool, setActiveTool,
    addCutOut, setCardShape, resetEdges,
    updateCutOut, setCutOutMode, removeCutOut,
    selectedShapeForDrawing, setSelectedShapeForDrawing,
    recentShapes, addRecentShape, removeRecentShape, clearRecentShapes,
    favorites, toggleFavorite,
  } = useStudioStore();

  const page = getActivePage();
  const cutOuts = page?.cardShape?.cutOuts ?? [];
  const isPencilActive = activeTool === 'pencil';

  const [activeTab, setActiveTab] = useState<SubTab>('library');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredShapes = ShapeData.getShapesBySection(selectedCategory);

  const handleSelectShape = (shapeId: string) => {
    const shapeDef = ShapeData.getShape(shapeId);
    if (!shapeDef) return;

    // 1. Record selection in history
    addRecentShape(shapeId);
    setSelectedShapeForDrawing(shapeDef);

    // 2. Immediately apply shape cut or corner rounding to active page
    if (shapeId === 'straight_edge') {
      resetEdges();
    } else if (shapeId === 'rounded_corner_sm') {
      setCardShape(activePageId, { shapeId: 'rectangle', cornerRadius: 24 });
      showToast('✦ Applied Small Rounded Corners (24px)');
    } else if (shapeId === 'rounded_corner_md') {
      setCardShape(activePageId, { shapeId: 'rectangle', cornerRadius: 45 });
      showToast('✦ Applied Medium Rounded Corners (45px)');
    } else if (shapeId === 'rounded_corner_lg') {
      setCardShape(activePageId, { shapeId: 'rectangle', cornerRadius: 80 });
      showToast('✦ Applied Large Rounded Corners (80px)');
    } else if (shapeId === 'arch_top' || shapeId === 'arch_tall') {
      setCardShape(activePageId, { shapeId: 'arch_top', archHeight: 200 });
      showToast('✦ Applied Arch Top Paper Shape');
    } else {
      const newCutOut = {
        id: `cut-${Date.now()}`,
        name: shapeDef.label,
        shape: shapeId,
        cutMode: shapeDef.defaultCutMode || 'outer_shape',
        x: shapeDef.defaultCutMode === 'inner_hole' ? 180 : 0,
        y: shapeDef.defaultCutMode === 'inner_hole' ? 250 : 0,
        width: shapeDef.defaultWidth || 561,
        height: shapeDef.defaultHeight || 100,
        svgPathD: shapeDef.svgPathD,
      };
      addCutOut(activePageId, newCutOut);
      showToast(`✦ Applied "${shapeDef.label}" to Card Page!`);
    }
  };

  // Resolve shape objects for history and favorites
  const recentShapeObjs = (recentShapes || [])
    .map(id => ShapeData.getShape(id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined && s !== null);

  const favoriteShapeObjs = (favorites || [])
    .map(id => ShapeData.getShape(id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined && s !== null);

  return (
    <div className="flex flex-col h-full bg-[#161412] text-[#e8e0d8] text-xs select-none">

      {/* ── 1. MINIMALIST HEADER ─────────────────────────────────────────────── */}
      <div className="p-3 border-b border-[#252118] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
            <Scissors className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#E5D7C5]">Die-Cut & Shape Library</h3>
            <p className="text-[10px] text-[#8C8073]">Vector aperture cutters & edge tools</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#252118] text-[#C9956C]">
          55 Shapes
        </span>
      </div>

      {/* ── 2. ACTIVE SELECTION STRIP (ONLY WHEN SHAPE SELECTED) ─────────────── */}
      {selectedShapeForDrawing && (
        <div className="px-3 py-2 bg-gradient-to-r from-amber-950/40 to-amber-900/30 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="text-[11px] font-bold text-amber-300 truncate">
              Active: {selectedShapeForDrawing.label}
            </span>
          </div>
          <button
            onClick={() => setSelectedShapeForDrawing(null)}
            className="p-1 rounded text-amber-400/80 hover:text-white hover:bg-amber-500/20"
            title="Deselect shape tool"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── 3. CLEAN SEGMENTED CONTROL TABS ─────────────────────────────────── */}
      <div className="p-2 border-b border-[#252118] bg-[#1a1816]">
        <div className="grid grid-cols-3 p-0.5 rounded-lg bg-[#11100e] border border-[#252118]">
          <button
            onClick={() => setActiveTab('library')}
            className={`py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'library'
                ? 'bg-[#C9956C] text-[#161412] shadow-md font-extrabold'
                : 'text-[#9E9285] hover:text-[#E5D7C5]'
            }`}
          >
            <LayoutGrid className="h-3 w-3" />
            <span>Library</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'history'
                ? 'bg-[#C9956C] text-[#161412] shadow-md font-extrabold'
                : 'text-[#9E9285] hover:text-[#E5D7C5]'
            }`}
          >
            <History className="h-3 w-3" />
            <span>History ({recentShapeObjs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'favorites'
                ? 'bg-[#C9956C] text-[#161412] shadow-md font-extrabold'
                : 'text-[#9E9285] hover:text-[#E5D7C5]'
            }`}
          >
            <Star className="h-3 w-3" />
            <span>Favs ({favoriteShapeObjs.length})</span>
          </button>
        </div>
      </div>

      {/* ── 4. TAB CONTENTS ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">

        {/* ── TAB 1: FULL SHAPE LIBRARY ────────────────────────────────────── */}
        {activeTab === 'library' && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
              {SECTIONS.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedCategory(sec.id)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === sec.id
                      ? 'bg-[#C9956C] text-[#161412] font-bold'
                      : 'bg-[#1a1816] text-[#8C8073] hover:text-[#E5D7C5] border border-[#252118]'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Shape Grid */}
            <div className="grid grid-cols-3 gap-2">
              {filteredShapes.map(shape => {
                const isSelected = selectedShapeForDrawing?.id === shape.id;
                const isFav = favorites?.includes(shape.id);

                return (
                  <div
                    key={shape.id}
                    onClick={() => handleSelectShape(shape.id)}
                    className={`group flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer text-center relative ${
                      isSelected
                        ? 'bg-amber-500/20 border-[#C9956C] shadow-lg scale-[1.02]'
                        : 'bg-[#1a1816] border-[#252118] hover:border-[#C9956C]/50 hover:bg-[#221e1a]'
                    }`}
                    title={`Click to apply ${shape.label} to Card Page`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(shape.id);
                      }}
                      className="absolute top-1 right-1 p-1 rounded text-neutral-500 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star className={`h-3 w-3 ${isFav ? 'fill-amber-400 text-amber-400 opacity-100' : ''}`} />
                    </button>

                    <svg
                      viewBox="0 0 48 68"
                      className="w-7 h-9 mb-1"
                      fill="rgba(201,149,108,0.15)"
                      stroke="#C9956C"
                      strokeWidth="2"
                      dangerouslySetInnerHTML={{ __html: shape.previewSvg }}
                    />
                    <span className="font-semibold text-[10px] text-[#E5D7C5] truncate w-full leading-tight">
                      {shape.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: RECENT SELECTION HISTORY ─────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#C9956C]">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Recently Picked Shape Tools
              </span>

              {recentShapeObjs.length > 0 && (
                <button
                  onClick={clearRecentShapes}
                  className="text-[10px] text-red-400 hover:text-red-300 font-normal flex items-center gap-0.5"
                  title="Clear shape selection history"
                >
                  <Trash2 className="h-3 w-3" /> Clear All
                </button>
              )}
            </div>

            <p className="text-[10px] text-[#8C8073]">
              Click any shape tool below or press <strong>+ Apply</strong> to place it onto your active workspace card.
            </p>

            {recentShapeObjs.length === 0 ? (
              <div className="py-10 text-center text-[#8C8073]">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-xs text-[#b0a496]">No Recent History</p>
                <p className="text-[10px] text-[#786d62] mt-0.5">Shapes you pick from the library will appear here for quick access.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentShapeObjs.map((shape) => {
                  const isSelected = selectedShapeForDrawing?.id === shape.id;
                  const isFav = favorites?.includes(shape.id);

                  return (
                    <div
                      key={shape.id}
                      onClick={() => handleSelectShape(shape.id)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-[#C9956C]'
                          : 'bg-[#1a1816] border-[#252118] hover:border-[#C9956C]/50 hover:bg-[#221e1a]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <svg
                          viewBox="0 0 48 68"
                          className="w-5 h-7 flex-shrink-0"
                          fill="rgba(201,149,108,0.15)"
                          stroke="#C9956C"
                          strokeWidth="2"
                          dangerouslySetInnerHTML={{ __html: shape.previewSvg }}
                        />
                        <div className="truncate">
                          <h4 className="font-bold text-xs text-[#E5D7C5] truncate">{shape.label}</h4>
                          <span className="text-[10px] text-[#8C8073] block truncate">{shape.section}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectShape(shape.id);
                          }}
                          className="px-2 py-1 rounded bg-[#C9956C] text-[#161412] font-bold text-[10px] hover:bg-[#D4A37A] transition-colors"
                          title={`Apply "${shape.label}" to workspace page`}
                        >
                          + Apply
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(shape.id);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-amber-400"
                          title={isFav ? 'Remove favorite' : 'Add favorite'}
                        >
                          <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentShape(shape.id);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800/80 transition-colors"
                          title="Remove from history"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: FAVORITES ─────────────────────────────────────────────── */}
        {activeTab === 'favorites' && (
          <div className="space-y-2">
            {favoriteShapeObjs.length === 0 ? (
              <div className="py-10 text-center text-[#8C8073]">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="font-semibold text-xs text-[#b0a496]">No Favorites Starred Yet</p>
                <p className="text-[10px] text-[#786d62] mt-0.5">Click the star icon on any shape in the library to bookmark it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {favoriteShapeObjs.map(shape => {
                  const isSelected = selectedShapeForDrawing?.id === shape.id;

                  return (
                    <div
                      key={shape.id}
                      onClick={() => handleSelectShape(shape.id)}
                      className={`flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer text-center relative ${
                        isSelected
                          ? 'bg-amber-500/15 border-[#C9956C]'
                          : 'bg-[#1a1816] border-[#252118] hover:border-[#C9956C]/50'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(shape.id);
                        }}
                        className="absolute top-1.5 right-1.5 p-0.5 text-amber-400"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                      </button>

                      <svg
                        viewBox="0 0 48 68"
                        className="w-8 h-10 mb-1.5"
                        fill="rgba(201,149,108,0.2)"
                        stroke="#C9956C"
                        strokeWidth="2"
                        dangerouslySetInnerHTML={{ __html: shape.previewSvg }}
                      />
                      <span className="font-bold text-xs text-[#E5D7C5] truncate w-full">{shape.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 5. PLACED CARD SHAPES SECTION ─────────────────────────────────── */}
        <div className="pt-3 border-t border-[#252118] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#C9956C] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Placed Cutters ({cutOuts.length})
            </span>

            <button
              onClick={() => {
                resetEdges();
              }}
              className="text-[10px] text-amber-400/80 hover:text-amber-200 font-bold transition-colors"
              title="Reset card page boundary to standard flat rectangle with no rounded corners or serrated edge cuts"
            >
              Reset to Flat Rectangle
            </button>
          </div>

          {cutOuts.length === 0 ? (
            <div className="p-3 rounded-xl bg-[#141210] border border-dashed border-[#252118] text-center text-[11px] text-[#786d62]">
              No shape cutouts placed on page yet. Select any shape above to draw it.
            </div>
          ) : (
            <div className="space-y-2">
              {cutOuts.map((c, i) => (
                <div key={c.id} className="p-2.5 rounded-xl bg-[#1a1816] border border-[#252118] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#E5D7C5] text-xs">
                      {c.name || `Cutout #${i + 1}`}
                    </span>
                    <button
                      onClick={() => {
                        removeCutOut(activePageId, c.id);
                        showToast('Removed cutout from page');
                      }}
                      className="p-1 text-red-400 hover:text-red-200"
                      title="Remove cutout"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Cut Mode Switcher */}
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setCutOutMode(activePageId, c.id, 'inner_hole')}
                      className={`py-1 rounded text-[9px] font-bold text-center transition-all ${
                        c.cutMode === 'inner_hole' ? 'bg-[#C9956C] text-[#161412]' : 'bg-[#221e1a] text-[#8C8073]'
                      }`}
                    >
                      Hole Window
                    </button>

                    <button
                      onClick={() => setCutOutMode(activePageId, c.id, 'outer_shape')}
                      className={`py-1 rounded text-[9px] font-bold text-center transition-all ${
                        c.cutMode === 'outer_shape' ? 'bg-[#C9956C] text-[#161412]' : 'bg-[#221e1a] text-[#8C8073]'
                      }`}
                    >
                      Outer Edge
                    </button>

                    <button
                      onClick={() => setCutOutMode(activePageId, c.id, 'partial_popup')}
                      className={`py-1 rounded text-[9px] font-bold text-center transition-all ${
                        c.cutMode === 'partial_popup' ? 'bg-[#C9956C] text-[#161412]' : 'bg-[#221e1a] text-[#8C8073]'
                      }`}
                    >
                      3D Pop-Up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 6. FREEHAND VECTOR PENCIL TOOL ─────────────────────────────────── */}
        <div className="pt-3 border-t border-[#252118]">
          <button
            onClick={() => {
              const next = isPencilActive ? 'select' : 'pencil';
              setActiveTool(next);
              showToast(next === 'pencil' ? 'Pencil Tool Active' : 'Select Tool Active');
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isPencilActive
                ? 'bg-[#C9956C] text-[#161412] shadow-md'
                : 'bg-[#1a1816] text-[#b0a496] border border-dashed border-[#322c26] hover:border-[#C9956C]/50 hover:text-[#E5D7C5]'
            }`}
          >
            <Pencil className="h-4 w-4" />
            <span>{isPencilActive ? 'Drawing Freehand (Click to Finish)' : 'Draw Freehand Cut Line (P)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ShapesPanel;
