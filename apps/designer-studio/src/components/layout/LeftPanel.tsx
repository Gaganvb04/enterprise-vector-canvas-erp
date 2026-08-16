import React, { useState, useMemo } from 'react';
import {
  MousePointer, PenTool, Type, Image as ImageIcon, Square, Scissors, Palette,
  Layers, FileText, X, Search, Star, Check, Edit2, Eye, EyeOff,
  Trash2
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { DieCutLibraryRegistry, VECTOR_DIE_CUT_LIBRARY, type LibraryShapeItem } from '../../data/diecutLibrary';
import { PARTIAL_CUT_SHAPES, buildPartialCutObject, type PartialCutShapeDef } from '../../utils/partialCutShapes';
import { getShrinkWrappedViewBox } from '../../utils/freehandCutUtils';
import type { EdgeSide } from '../../types/diecut';
import { ShapesPanel } from '../tools/ShapesPanel';
import { ColorsPanel } from '../tools/ColorsPanel';
import { TextPanel } from '../tools/TextPanel';
import { LayersPanel } from '../tools/LayersPanel';
import { UploadsPanel } from '../tools/UploadsPanel';

export type ToolDockItem = 'select' | 'draw' | 'text' | 'image' | 'shapes' | 'diecut' | 'colors' | 'layers' | 'pages';

export const LeftPanel: React.FC = () => {
  const {
    activeTool, setActiveTool,
    favorites, toggleFavorite, recentShapes, addRecentShape,
    selectedEdgeSide, setSelectedEdgeSide, setApplyAllEdges, setMirrorEdges, resetEdges,
    setEdgeSide, addPartialCutObject, updatePartialCutObject, removePartialCutObject,
    pages, activePageId, setActivePage, getActivePage, setSelectedPartialCutId,
    selectedPartialCutId,
    pencilStrokeColor, setPencilStrokeColor, pencilStrokeWidth, setPencilStrokeWidth, showToast,
    // Phase 8 Freehand State
    drawDieCutTool, setDrawDieCutTool,
    drawDieCutOperation, setDrawDieCutOperation,
    drawSmoothingLevel, setDrawSmoothingLevel,
    drawForceClose, setDrawForceClose,
  } = useStudioStore();

  const [activeDrawer, setActiveDrawer] = useState<ToolDockItem | null>('diecut');
  const [diecutTab, setDiecutTab] = useState<'LIBRARY' | 'DRAW' | 'USED'>('LIBRARY');
  const [diecutCategory, setDiecutCategory] = useState<'Edge' | 'Corner' | 'Partial' | 'Aperture'>('Edge');
  const [diecutSubCat, setDiecutSubCat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUsedId, setEditingUsedId] = useState<string | null>(null);
  const [editingUsedName, setEditingUsedName] = useState<string>('');

  const activePage = getActivePage();

  const handleToolClick = (tool: ToolDockItem) => {
    if (tool === 'select') {
      setActiveTool('select');
      setActiveDrawer(null);
      return;
    }
    if (tool === 'draw') {
      setActiveTool('pencil');
    } else {
      setActiveTool('select');
    }

    if (activeDrawer === tool) {
      setActiveDrawer(null);
    } else {
      setActiveDrawer(tool);
    }
  };

  // Filtered 388 vector shapes for Die-Cut drawer
  const filteredDieCutShapes = useMemo(() => {
    let list = VECTOR_DIE_CUT_LIBRARY;

    if (diecutCategory === 'Edge') {
      list = list.filter(s => s.category.toLowerCase().includes('edge'));
    } else if (diecutCategory === 'Corner') {
      list = list.filter(s => s.category.toLowerCase().includes('corner'));
    } else if (diecutCategory === 'Partial') {
      list = list.filter(s => s.category.toLowerCase().includes('partial'));
    } else if (diecutCategory === 'Aperture') {
      list = list.filter(s => s.category.toLowerCase().includes('aperture'));
    }

    if (diecutSubCat === 'FAVORITES') {
      list = list.filter(s => favorites.includes(s.id));
    } else if (diecutSubCat === 'RECENTS') {
      list = list.filter(s => recentShapes.includes(s.id));
    } else if (diecutSubCat !== 'ALL') {
      list = list.filter(s => s.subCategory.toUpperCase().includes(diecutSubCat.toUpperCase()));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.numId.toString() === q ||
        s.subCategory.toLowerCase().includes(q)
      );
    }

    return list;
  }, [diecutCategory, diecutSubCat, searchQuery, favorites, recentShapes]);

  // Apply shape from Die-Cut Drawer - Instantly places vector shape on invitation card!
  const handleApplyShape = (shape: LibraryShapeItem) => {
    addRecentShape(shape.id);

    if (diecutCategory === 'Edge') {
      setEdgeSide(selectedEdgeSide, shape.id);
    }

    const vb = getShrinkWrappedViewBox(shape.pathD);
    const parts = vb.split(' ').map(Number);
    const nativeW = parts[2] || 100;
    const nativeH = parts[3] || 40;

    // Scale initial box so width is 120mm (~450px) and height matches native aspect ratio perfectly
    const widthPx = 450;
    const heightPx = Math.max(30, Math.round(widthPx * (nativeH / nativeW)));

    const foundDef = PARTIAL_CUT_SHAPES.find(p => p.id === shape.id);
    const basePartial: PartialCutShapeDef = foundDef || {
      id: shape.id,
      name: shape.name,
      category: 'wedding',
      defaultWidthPx: widthPx,
      defaultHeightPx: heightPx,
      supportsBridges: true,
      supportsScore: true,
      supports3D: true,
      description: `Vector ${shape.category} (${shape.name})`,
      previewSvg: `<path d="${shape.pathD}" fill="none" stroke="#C9956C" stroke-width="2"/>`,
      buildCutPath: (w, h) => ({
        cutPathD: shape.pathD,
        scoreLines: [`M${w / 2},0 L${w / 2},${h}`],
        attachedRegionD: `M0,0 L${w},0 L${w},${h} L0,${h} Z`,
      }),
    };

    const pcObj = buildPartialCutObject(basePartial, 280 - widthPx / 2, 397 - heightPx / 2);
    pcObj.width = widthPx;
    pcObj.height = heightPx;
    pcObj.originalWidth = nativeW;
    pcObj.originalHeight = nativeH;

    addPartialCutObject(pcObj);
    setSelectedPartialCutId(pcObj.id);
    showToast(`✦ Added ${shape.name} Cut to Invitation Canvas!`);
  };

  const getEdgeLabel = (id: string) => {
    const item = DieCutLibraryRegistry.getById(id);
    return item ? item.name : id.replace(/_/g, ' ');
  };

  const currentFour = activePage?.cardShape.fourSides;
  const activeEdgeName = currentFour
    ? getEdgeLabel(
        selectedEdgeSide === 'top' ? currentFour.topEdge :
        selectedEdgeSide === 'right' ? currentFour.rightEdge :
        selectedEdgeSide === 'bottom' ? currentFour.bottomEdge : currentFour.leftEdge
      )
    : 'Straight';

  // Page-aware Used Die-Cuts list for active page
  const pagePartialCuts = useStudioStore(s => s.partialCuts);

  return (
    <div className="flex flex-shrink-0 h-full relative select-none z-30">
      {/* ─── 1. VERTICAL TOOL DOCK ────────────────────────────────────────── */}
      <div className="w-12 bg-[#141412] border-r border-[#252118] flex flex-col items-center py-3 gap-2 flex-shrink-0">
        <button
          onClick={() => handleToolClick('select')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'select' && !activeDrawer ? 'bg-[#C9956C] text-[#161412] font-bold shadow-md' : 'text-[#9E9285] hover:bg-[#252118] hover:text-[#E5D7C5]'
          }`}
          title="Select Tool (V)"
        >
          <MousePointer className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleToolClick('draw')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeDrawer === 'draw' ? 'bg-[#252118] text-[#C9956C] border border-[#C9956C]' : 'text-[#9E9285] hover:bg-[#252118] hover:text-[#E5D7C5]'
          }`}
          title="Pencil / Draw (P)"
        >
          <PenTool className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleToolClick('text')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeDrawer === 'text' ? 'bg-[#252118] text-[#C9956C] border border-[#C9956C]' : 'text-[#9E9285] hover:bg-[#252118] hover:text-[#E5D7C5]'
          }`}
          title="Text Tools (T)"
        >
          <Type className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleToolClick('image')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeDrawer === 'image' ? 'bg-[#252118] text-[#C9956C] border border-[#C9956C]' : 'text-[#9E9285] hover:bg-[#252118] hover:text-[#E5D7C5]'
          }`}
          title="Image & Uploads"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleToolClick('shapes')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeDrawer === 'shapes' ? 'bg-[#252118] text-[#C9956C] border border-[#C9956C]' : 'text-[#9E9285] hover:bg-[#252118] hover:text-[#E5D7C5]'
          }`}
          title="Shapes Library"
        >
          <Square className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleToolClick('diecut')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeDrawer === 'diecut' ? 'bg-[#252118] text-[#C9956C] border border-[#C9956C]' : 'text-[#9E9285] hover:bg-[#252118] hover:text-[#E5D7C5]'
          }`}
          title="Die-Cut Engine V2"
        >
          <Scissors className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleToolClick('colors')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeDrawer === 'colors' ? 'bg-[#252118] text-[#C9956C] border border-[#C9956C]' : 'text-[#9E9285] hover:bg-[#252118] hover:text-[#E5D7C5]'
          }`}
          title="Colors & Palette"
        >
          <Palette className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleToolClick('layers')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeDrawer === 'layers' ? 'bg-[#252118] text-[#C9956C] border border-[#C9956C]' : 'text-[#9E9285] hover:bg-[#252118] hover:text-[#E5D7C5]'
          }`}
          title="Layer Stack"
        >
          <Layers className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleToolClick('pages')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeDrawer === 'pages' ? 'bg-[#252118] text-[#C9956C] border border-[#C9956C]' : 'text-[#9E9285] hover:bg-[#252118] hover:text-[#E5D7C5]'
          }`}
          title="Artboard Pages"
        >
          <FileText className="h-4 w-4" />
        </button>
      </div>

      {/* ─── 2. CONTEXTUAL FLYOUT DRAWER (280px) ───────────────────────────── */}
      {activeDrawer && (
        <div className="w-72 bg-[#161412] border-r border-[#252118] flex flex-col h-full shadow-2xl flex-shrink-0 z-20 animate-in slide-in-from-left-2 duration-150">
          {/* Drawer Header */}
          <div className="h-10 px-3 flex items-center justify-between border-b border-[#252118] bg-[#1A1816]">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E5D7C5] flex items-center gap-1.5">
              {activeDrawer === 'diecut' && <Scissors className="h-3.5 w-3.5 text-[#C9956C]" />}
              {activeDrawer === 'draw' && <PenTool className="h-3.5 w-3.5 text-[#C9956C]" />}
              {activeDrawer === 'text' && <Type className="h-3.5 w-3.5 text-[#C9956C]" />}
              {activeDrawer === 'image' && <ImageIcon className="h-3.5 w-3.5 text-[#C9956C]" />}
              {activeDrawer === 'shapes' && <Square className="h-3.5 w-3.5 text-[#C9956C]" />}
              {activeDrawer === 'colors' && <Palette className="h-3.5 w-3.5 text-[#C9956C]" />}
              {activeDrawer === 'layers' && <Layers className="h-3.5 w-3.5 text-[#C9956C]" />}
              {activeDrawer === 'pages' && <FileText className="h-3.5 w-3.5 text-[#C9956C]" />}
              {activeDrawer.toUpperCase()}
            </span>
            <button onClick={() => setActiveDrawer(null)} className="p-1 rounded text-[#9E9285] hover:text-[#E5D7C5] hover:bg-[#252118]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* DRAWER 1: DIE-CUT DRAWER */}
            {activeDrawer === 'diecut' && (
              <div className="p-3 space-y-3">
                {/* Die-Cut Top Sub-Tabs: LIBRARY | DRAW | USED */}
                <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#1A1816] border border-[#252118]">
                  {(['LIBRARY', 'DRAW', 'USED'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDiecutTab(tab)}
                      className={`py-1 rounded text-[10px] font-bold tracking-wider transition-all ${
                        diecutTab === tab ? 'bg-[#C9956C] text-[#161412] shadow' : 'text-[#9E9285] hover:text-[#E5D7C5]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* ─── SUB-TAB 1: LIBRARY (388 PRESET VECTOR SHAPES) ───────────── */}
                {diecutTab === 'LIBRARY' && (
                  <div className="space-y-3">
                    {/* Category Mode Selector */}
                    <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-[#1A1816] border border-[#252118]">
                      {(['Edge', 'Corner', 'Partial', 'Aperture'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setDiecutCategory(cat)}
                          className={`py-1 rounded text-[10px] font-bold transition-all ${
                            diecutCategory === cat ? 'bg-[#C9956C] text-[#161412]' : 'text-[#9E9285] hover:text-[#E5D7C5]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Instant Search Bar */}
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-[#8C8073]" />
                      <input
                        type="text"
                        placeholder="Search 388 shapes..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1A1816] text-[#E5D7C5] text-xs pl-8 pr-3 py-1.5 rounded-md outline-none border border-[#252118] focus:border-[#C9956C]"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-[#8C8073] hover:text-[#E5D7C5]">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Subcategory Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'FAVORITES', label: '★ Favs' },
                        { id: 'RECENTS', label: 'Recents' },
                        { id: 'WEDDING', label: 'Wedding' },
                        { id: 'NATURE', label: 'Nature' },
                        { id: 'INDIAN', label: 'Indian' },
                        { id: 'ORNAMENTAL', label: 'Ornamental' },
                        { id: 'GEOMETRIC', label: 'Geometric' },
                      ].map(pill => (
                        <button
                          key={pill.id}
                          onClick={() => setDiecutSubCat(pill.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap border transition-all ${
                            diecutSubCat === pill.id
                              ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]'
                              : 'bg-[#1A1816] text-[#9E9285] border-[#252118] hover:text-[#E5D7C5]'
                          }`}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>

                    {/* Target Edge Side Selector (Edge Mode) */}
                    {diecutCategory === 'Edge' && (
                      <div className="p-2.5 rounded-lg bg-[#1A1816] border border-[#252118] space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-[#8C8073]">TARGET EDGE</span>
                          <span className="font-bold text-[#C9956C] uppercase">{selectedEdgeSide}: {activeEdgeName}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {(['top', 'right', 'bottom', 'left'] as EdgeSide[]).map(side => (
                            <button
                              key={side}
                              onClick={() => setSelectedEdgeSide(side)}
                              className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                selectedEdgeSide === side ? 'bg-[#C9956C] text-[#161412]' : 'bg-[#252118] text-[#9E9285] hover:text-[#E5D7C5]'
                              }`}
                            >
                              {side}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <button onClick={() => { const item = DieCutLibraryRegistry.getById(selectedEdgeSide); setApplyAllEdges(item?.id || 'lib-1'); }} className="flex-1 py-1 rounded bg-[#252118] text-[9px] font-bold text-[#E5D7C5] hover:bg-[#322C22]">
                            All Sides
                          </button>
                          <button onClick={setMirrorEdges} className="flex-1 py-1 rounded bg-[#252118] text-[9px] font-bold text-[#E5D7C5] hover:bg-[#322C22]">
                            Mirror
                          </button>
                          <button onClick={resetEdges} className="py-1 px-2 rounded bg-red-950/40 text-[9px] font-bold text-red-400 hover:bg-red-900/60">
                            Reset
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Shape Grid */}
                    <div className="grid grid-cols-2 gap-2 max-h-[48vh] overflow-y-auto pr-1">
                      {filteredDieCutShapes.map(shape => {
                        const isFav = favorites.includes(shape.id);
                        return (
                          <div
                            key={shape.id}
                            onClick={() => handleApplyShape(shape)}
                            className="group relative p-2 rounded-lg bg-[#1A1816] border border-[#252118] hover:border-[#C9956C] cursor-pointer transition-all flex flex-col items-center justify-center gap-1 hover:shadow-lg"
                          >
                            <button
                              onClick={e => { e.stopPropagation(); toggleFavorite(shape.id); }}
                              className={`absolute top-1.5 right-1.5 p-1 rounded-full ${isFav ? 'text-amber-400' : 'text-[#4A423A] opacity-0 group-hover:opacity-100 hover:text-white'}`}
                            >
                              <Star className="h-3 w-3 fill-current" />
                            </button>
                            <div className="w-full h-14 flex items-center justify-center text-[#C9956C]">
                              <svg viewBox={shape.viewBox || '0 0 220 80'} className="w-full h-full p-1 max-h-12">
                                <path d={shape.pathD} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </div>
                            <span className="text-[10px] font-semibold text-[#E5D7C5] truncate w-full text-center">{shape.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── SUB-TAB 2: DRAW (FREEHAND & SHAPE CUT DRAWING) ─────────── */}
                {diecutTab === 'DRAW' && (
                  <div className="space-y-3.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#1A1816] border border-[#252118] space-y-2">
                      <span className="font-bold text-[#C9956C] flex items-center gap-1.5">
                        <PenTool className="h-3.5 w-3.5" /> FREEHAND CUTTING TOOLS
                      </span>
                      <p className="text-[10px] text-[#8C8073]">
                        Draw custom cuts directly on the invitation. Your stroke converts into a production SVG vector cut.
                      </p>

                      {/* Tool Selector */}
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        {[
                          { id: 'freehand', label: 'Freehand' },
                          { id: 'line', label: 'Line' },
                          { id: 'curve', label: 'Curve' },
                          { id: 'rectangle', label: 'Rect' },
                          { id: 'circle', label: 'Circle' },
                          { id: 'polygon', label: 'Polygon' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setDrawDieCutTool(t.id as any);
                              setActiveTool('draw_shape');
                              showToast(`Paint Mode: Click & drag on card to draw ${t.label}`);
                            }}
                            className={`py-1 rounded text-[10px] font-bold border transition-all ${
                              drawDieCutTool === t.id ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]' : 'bg-[#252118] text-[#9E9285] border-[#252118]'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cut Operation Type */}
                    <div className="p-2.5 rounded-lg bg-[#1A1816] border border-[#252118] space-y-2">
                      <span className="font-bold text-[#8C8073]">CUT OPERATION TYPE</span>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { type: 'cut', label: 'Full Cut', color: '#FF0000' },
                          { type: 'partial_cut', label: 'Partial Cut', color: '#FF00FF' },
                          { type: 'score', label: 'Score Line', color: '#0000FF' },
                          { type: 'perforation', label: 'Perforation', color: '#00AA00' },
                          { type: 'engrave', label: 'Engrave', color: '#CCAA00' },
                        ].map(op => (
                          <button
                            key={op.type}
                            onClick={() => setDrawDieCutOperation(op.type as any)}
                            className={`py-1 px-2 rounded text-[10px] font-bold border transition-all text-left ${
                              drawDieCutOperation === op.type ? 'bg-[#252118] text-[#E5D7C5]' : 'bg-[#1A1816] text-[#8C8073] border-[#252118]'
                            }`}
                            style={{ borderColor: drawDieCutOperation === op.type ? op.color : undefined }}
                          >
                            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: op.color }} />
                            {op.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Smoothing & Close Path */}
                    <div className="p-2.5 rounded-lg bg-[#1A1816] border border-[#252118] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#8C8073]">SMOOTHING</span>
                        <div className="flex gap-1">
                          {(['low', 'medium', 'high'] as const).map(l => (
                            <button
                              key={l}
                              onClick={() => setDrawSmoothingLevel(l)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                drawSmoothingLevel === l ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]' : 'bg-[#252118] text-[#9E9285] border-[#252118]'
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-bold text-[#8C8073]">AUTO-CLOSE SHAPE</span>
                        <button
                          onClick={() => setDrawForceClose(!drawForceClose)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            drawForceClose ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]' : 'bg-[#252118] text-[#9E9285] border-[#252118]'
                          }`}
                        >
                          {drawForceClose ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Draw Action Button */}
                    <button
                      onClick={() => {
                        setActiveTool('draw_shape');
                        showToast(`Paint Mode: Click & drag on card to draw ${drawDieCutTool.toUpperCase()}`);
                      }}
                      className="w-full py-2 rounded-lg font-bold bg-[#C9956C] text-[#161412] shadow-lg flex items-center justify-center gap-2 hover:bg-[#D4A37A] transition-all"
                    >
                      <PenTool className="h-4 w-4" /> Start Drawing on Canvas
                    </button>
                  </div>
                )}

                {/* ─── SUB-TAB 3: USED DIE-CUTS LIST (PAGE-AWARE) ───────────── */}
                {diecutTab === 'USED' && (
                  <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-1">
                    <div className="p-2 rounded bg-[#1A1816] border border-[#252118] text-center">
                      <span className="text-[10px] text-[#8C8073]">
                        Die-Cuts present on Page {activePage?.pageNumber || 1}: {activePage?.label}
                      </span>
                    </div>

                    {/* Partial Cuts & Custom Drawn Cuts */}
                    {pagePartialCuts.map(pc => (
                      <div
                        key={pc.id}
                        onClick={() => {
                          setSelectedPartialCutId(pc.id);
                          showToast(`Selected ${pc.name}`);
                        }}
                        className={`p-2.5 rounded-lg border flex flex-col gap-1.5 cursor-pointer transition-all ${
                          selectedPartialCutId === pc.id ? 'bg-[#252118] border-[#C9956C]' : 'bg-[#1A1816] border-[#252118] hover:border-[#C9956C]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {editingUsedId === pc.id ? (
                            <input
                              type="text"
                              autoFocus
                              value={editingUsedName}
                              onChange={e => setEditingUsedName(e.target.value)}
                              onBlur={() => {
                                setEditingUsedId(null);
                                if (editingUsedName.trim()) updatePartialCutObject(pc.id, { name: editingUsedName.trim() });
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  setEditingUsedId(null);
                                  if (editingUsedName.trim()) updatePartialCutObject(pc.id, { name: editingUsedName.trim() });
                                }
                              }}
                              className="text-xs font-bold px-1 py-0.5 rounded bg-[#111] text-[#E5D7C5] outline-none border border-[#C9956C]"
                            />
                          ) : (
                            <span className="text-xs font-bold text-[#E5D7C5] flex items-center gap-1.5 truncate">
                              <Scissors className="h-3 w-3 text-pink-400" />
                              {pc.name}
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setEditingUsedId(pc.id);
                                setEditingUsedName(pc.name);
                              }}
                              className="p-1 rounded text-[#8C8073] hover:text-[#E5D7C5]"
                              title="Rename object"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                updatePartialCutObject(pc.id, { visible: pc.visible === false ? true : false });
                              }}
                              className="p-1 rounded text-[#8C8073] hover:text-[#E5D7C5]"
                            >
                              {pc.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-red-400" />}
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                removePartialCutObject(pc.id);
                                setSelectedPartialCutId(null);
                              }}
                              className="p-1 rounded text-red-400 hover:bg-red-950/40"
                              title="Delete die-cut"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#8C8073]">
                          <span className="uppercase font-mono text-[#C9956C]">{pc.cutType}</span>
                          <span>{Math.round(pc.width / 3.78)}×{Math.round(pc.height / 3.78)} mm</span>
                        </div>
                      </div>
                    ))}

                    {/* Outer Edge Configurations */}
                    {activePage?.cardShape.fourSides && (
                      <div className="p-2.5 rounded-lg bg-[#1A1816] border border-[#252118] space-y-1 text-xs">
                        <span className="text-[10px] font-bold text-[#8C8073] uppercase">Outer Die-Cut Boundary</span>
                        <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-[#E5D7C5]">
                          <span>Top: <strong className="text-[#C9956C]">{getEdgeLabel(activePage.cardShape.fourSides.topEdge)}</strong></span>
                          <span>Right: <strong className="text-[#C9956C]">{getEdgeLabel(activePage.cardShape.fourSides.rightEdge)}</strong></span>
                          <span>Bottom: <strong className="text-[#C9956C]">{getEdgeLabel(activePage.cardShape.fourSides.bottomEdge)}</strong></span>
                          <span>Left: <strong className="text-[#C9956C]">{getEdgeLabel(activePage.cardShape.fourSides.leftEdge)}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DRAWER 2: DRAW / PENCIL */}
            {activeDrawer === 'draw' && (
              <div className="p-4 space-y-4 text-xs">
                <span className="font-bold text-[#C9956C]">Pencil & Freehand Settings</span>

                <div className="space-y-1.5">
                  <span className="text-[#8C8073]">Stroke Color:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={pencilStrokeColor}
                      onChange={e => setPencilStrokeColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-[#E5D7C5]">{pencilStrokeColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[#8C8073]">Stroke Width: {pencilStrokeWidth}px</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={pencilStrokeWidth}
                    onChange={e => setPencilStrokeWidth(Number(e.target.value))}
                    className="w-full accent-[#C9956C]"
                  />
                </div>
              </div>
            )}

            {/* DRAWER 3: TEXT */}
            {activeDrawer === 'text' && <TextPanel />}

            {/* DRAWER 4: IMAGE */}
            {activeDrawer === 'image' && <UploadsPanel />}

            {/* DRAWER 5: SHAPES */}
            {activeDrawer === 'shapes' && <ShapesPanel />}

            {/* DRAWER 6: COLORS */}
            {activeDrawer === 'colors' && <ColorsPanel />}

            {/* DRAWER 7: LAYERS */}
            {activeDrawer === 'layers' && <LayersPanel />}

            {/* DRAWER 8: PAGES */}
            {activeDrawer === 'pages' && (
              <div className="p-3 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8C8073]">
                  Artboard Pages
                </span>
                <div className="space-y-2">
                  {pages.map((p, i) => (
                    <div
                      key={p.id}
                      onClick={() => setActivePage(p.id)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer ${
                        activePageId === p.id ? 'bg-[#252118] border-[#C9956C] text-[#E5D7C5]' : 'bg-[#1A1816] border-[#252118] text-[#8C8073]'
                      }`}
                    >
                      <span className="text-xs font-semibold">
                        Page {i + 1}: {p.label}
                      </span>
                      {activePageId === p.id && <Check className="h-3.5 w-3.5 text-[#C9956C]" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
