import React, { useState, useMemo } from 'react';
import { Scissors, RotateCcw, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useStudioStore, type CutOut } from '../../store/studioStore';
import { PARTIAL_CUT_SHAPES, buildPartialCutObject } from '../../utils/partialCutShapes';
import { DieCutLibraryRegistry, type LibraryShapeItem } from '../../data/diecutLibrary';
import type { EdgeSide } from '../../types/diecut';

// ─── Section collapse component ───────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #2a2520' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-neutral-800/50"
        style={{ color: '#C9956C', background: '#1a1a1a' }}
      >
        <span className="flex items-center gap-1.5">
          <Scissors className="h-3 w-3 text-amber-500" />{title}
        </span>
        {open ? <ChevronDown className="h-3 w-3 text-amber-500" /> : <ChevronRight className="h-3 w-3 text-amber-500" />}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
};

// ─── Edge Side Selector ───────────────────────────────────────────────────────
const EdgeSideSelector: React.FC = () => {
  const {
    selectedEdgeSide, setSelectedEdgeSide,
    setApplyAllEdges, setMirrorEdges, resetEdges, getActivePage,
  } = useStudioStore();

  const page = getActivePage();
  const four = page?.cardShape.fourSides;

  const sides: { id: EdgeSide; label: string }[] = [
    { id: 'top', label: 'TOP' },
    { id: 'right', label: 'RIGHT' },
    { id: 'bottom', label: 'BOTTOM' },
    { id: 'left', label: 'LEFT' },
  ];

  const currentEdge = (side: EdgeSide) => {
    if (!four) return 'straight_edge';
    if (side === 'top') return four.topEdge;
    if (side === 'right') return four.rightEdge;
    if (side === 'bottom') return four.bottomEdge;
    return four.leftEdge;
  };

  const getEdgeLabel = (id: string) => {
    const item = DieCutLibraryRegistry.getById(id);
    if (item) return item.name;
    return id.replace(/_/g, ' ');
  };

  return (
    <div className="px-3 py-2 space-y-2">
      {/* Side buttons */}
      <div className="grid grid-cols-4 gap-1">
        {sides.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedEdgeSide(s.id)}
            className="py-1.5 rounded text-[10px] font-bold transition-all"
            style={{
              background: selectedEdgeSide === s.id ? '#C9956C' : '#111',
              color: selectedEdgeSide === s.id ? '#111' : '#7a7068',
              border: '1px solid ' + (selectedEdgeSide === s.id ? '#C9956C' : '#2a2520'),
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Current edge display */}
      <div className="text-[10px] text-center font-semibold" style={{ color: '#5a5048' }}>
        {selectedEdgeSide.toUpperCase()} EDGE → <span style={{ color: '#C9956C' }}>
          {getEdgeLabel(currentEdge(selectedEdgeSide))}
        </span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-1">
        <button onClick={() => {
          const ce = currentEdge(selectedEdgeSide);
          setApplyAllEdges(ce);
        }} className="py-1 rounded text-[9px] font-bold hover:border-amber-500 transition-all" style={{ background: '#111', border: '1px solid #2a2520', color: '#c8bfb0' }}>
          All Sides
        </button>
        <button onClick={setMirrorEdges} className="py-1 rounded text-[9px] font-bold hover:border-amber-500 transition-all" style={{ background: '#111', border: '1px solid #2a2520', color: '#c8bfb0' }}>
          Mirror Opp.
        </button>
        <button onClick={resetEdges} className="py-1 rounded text-[9px] font-bold flex items-center justify-center gap-1 hover:border-red-500 transition-all" style={{ background: '#111', border: '1px solid #2a2520', color: '#ef4444' }}>
          <RotateCcw className="h-2.5 w-2.5" /> Reset
        </button>
      </div>
    </div>
  );
};

// ─── 388 Vector Shape Library Browser ──────────────────────────────────────────
const VectorLibraryBrowser: React.FC = () => {
  const {
    selectedEdgeSide, setEdgeSide, setCornerSide,
    addPartialCutObject, addCutOut, activePageId, showToast
  } = useStudioStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All 388' },
    { id: 'Edge Cut', label: 'Edge Cuts (271)' },
    { id: 'Corner Cut', label: 'Corners (30)' },
    { id: 'Partial Cut', label: 'Partial Cuts (35)' },
    { id: 'Aperture', label: 'Apertures (7)' },
    { id: 'NATURE', label: 'Nature' },
    { id: 'WEDDING', label: 'Wedding' },
    { id: 'INDIAN', label: 'Indian Traditional' },
    { id: 'ORNAMENTAL', label: 'Ornamental' },
    { id: 'GEOMETRIC', label: 'Geometric' },
  ];

  const filteredItems = useMemo(() => {
    let items = DieCutLibraryRegistry.getAll();
    if (selectedTab !== 'all') {
      if (['Edge Cut', 'Corner Cut', 'Partial Cut', 'Aperture', 'Technical'].includes(selectedTab)) {
        items = items.filter(i => i.category === selectedTab);
      } else {
        items = items.filter(i => i.subCategory === selectedTab || i.category.toLowerCase().includes(selectedTab.toLowerCase()));
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.subCategory.toLowerCase().includes(q) ||
        i.numId.toString() === q
      );
    }
    return items;
  }, [selectedTab, searchQuery]);

  const handleApplyShape = (item: LibraryShapeItem) => {
    if (item.category === 'Edge Cut') {
      setEdgeSide(selectedEdgeSide, item.id);
      showToast(`Applied ${item.name} to ${selectedEdgeSide.toUpperCase()} Edge!`);
    } else if (item.category === 'Corner Cut') {
      setCornerSide('topLeft', item.id);
      setCornerSide('topRight', item.id);
      setCornerSide('bottomLeft', item.id);
      setCornerSide('bottomRight', item.id);
      showToast(`Applied ${item.name} to All 4 Corners!`);
    } else if (item.category === 'Partial Cut') {
      const builtinPartial = PARTIAL_CUT_SHAPES.find(s => s.name.toLowerCase() === item.name.toLowerCase() || item.name.toLowerCase().includes(s.id));
      if (builtinPartial) {
        const obj = buildPartialCutObject(builtinPartial, 185, 300);
        addPartialCutObject(obj);
      } else {
        addPartialCutObject({
          id: `pc-${Date.now()}`,
          name: item.name,
          shapeId: item.id,
          cutType: 'partial_cut',
          x: 180,
          y: 280,
          width: Math.round(item.defaultWidthMm * 3.78),
          height: Math.round(item.defaultHeightMm * 3.78),
          rotation: 0,
          bridges: { count: 2, widthMm: 1.0, position: 50, bridgePoints: [{ positionPct: 25, widthMm: 1 }, { positionPct: 75, widthMm: 1 }] },
          fold: 'vertical',
          popState: 'lifted',
          popAngle: 30,
          svgPathD: item.pathD,
          scoreLines: [`M ${Math.round(item.defaultWidthMm * 3.78 / 2)} 0 L ${Math.round(item.defaultWidthMm * 3.78 / 2)} ${Math.round(item.defaultHeightMm * 3.78)}`],
          visible: true,
          locked: false,
        });
      }
      showToast(`Added ${item.name} Partial Cut Object to Canvas!`);
    } else if (item.category === 'Aperture') {
      const newCutOut: CutOut = {
        id: `cut-${Date.now()}`,
        name: item.name,
        shape: item.id,
        cutMode: 'inner_hole',
        x: 190,
        y: 300,
        width: 180,
        height: 180,
        rotation: 0,
        svgPathD: item.pathD,
        previewSvg: `<path d="${item.pathD}" fill="none" stroke="#FF0000" stroke-width="2"/>`
      };
      addCutOut(activePageId, newCutOut);
      showToast(`Added ${item.name} Window Hole Aperture!`);
    } else {
      showToast(`Selected ${item.name}`);
    }
  };

  return (
    <div className="px-2 pb-2 space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
        <input
          type="text"
          placeholder="Search 388 vector shapes (e.g. Butterfly, Royal Arch, Lotus)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full text-[11px] pl-8 pr-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 placeholder-neutral-500 outline-none focus:border-amber-500/80 transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-xs text-neutral-400 hover:text-white">✕</button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedTab(cat.id)}
            className={`px-2 py-1 rounded text-[9px] font-bold flex-shrink-0 transition-all ${
              selectedTab === cat.id
                ? 'bg-amber-600 text-white shadow'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-[9px] text-neutral-400 px-1 flex items-center justify-between">
        <span>Showing <strong>{filteredItems.length}</strong> vector shapes</span>
        <span>Target Edge: <strong className="text-amber-400">{selectedEdgeSide.toUpperCase()}</strong></span>
      </div>

      {/* Vector Shapes Grid */}
      <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto p-0.5 custom-scrollbar">
        {filteredItems.slice(0, 90).map(item => {
          const colorMap: Record<string, string> = {
            'Edge Cut': '#C9956C',
            'Corner Cut': '#FF9800',
            'Partial Cut': '#FF00FF',
            'Aperture': '#FF0000',
            'Technical': '#2196F3',
          };
          const strokeColor = colorMap[item.category] || '#C9956C';

          return (
            <button
              key={item.id}
              onClick={() => handleApplyShape(item)}
              className="flex flex-col items-center justify-between p-1.5 rounded bg-neutral-900/90 border border-neutral-800 hover:border-amber-500 hover:bg-neutral-800/90 transition-all group text-center"
              title={`Click to apply ${item.name} (${item.category} #${item.numId})`}
            >
              {/* SVG Vector Preview */}
              <div className="w-full h-10 flex items-center justify-center overflow-hidden py-1">
                <svg
                  viewBox={item.viewBox}
                  className="w-full h-full max-h-8 text-amber-500/90 group-hover:scale-105 transition-transform"
                >
                  <path
                    d={item.pathD}
                    fill={item.category === 'Aperture' ? 'rgba(255,0,0,0.15)' : 'none'}
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeDasharray={item.operation === 'SCORE' ? '4,4' : item.operation === 'PERFORATION' ? '2,2' : 'none'}
                  />
                </svg>
              </div>

              {/* Label */}
              <span className="text-[8px] font-semibold text-neutral-300 group-hover:text-amber-300 truncate w-full mt-0.5">
                {item.name}
              </span>
              <span className="text-[7px] text-neutral-500 uppercase tracking-tighter">
                #{item.numId} · {item.category.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Edge parameters ──────────────────────────────────────────────────────────
const EdgeParams: React.FC = () => {
  const { getActivePage, activePageId, setCardShape, selectedEdgeSide } = useStudioStore();
  const page = getActivePage();
  const four = page?.cardShape.fourSides;
  const baseParams = four?.params ?? {};

  // Per-side parameter overrides support
  const sideParamKey = `${selectedEdgeSide}Params` as 'topParams' | 'rightParams' | 'bottomParams' | 'leftParams';
  const currentSideParams = (four as any)?.[sideParamKey] || baseParams;

  const update = (key: string, value: number) => {
    if (!four) return;
    const updatedSideParams = { ...currentSideParams, [key]: value };
    const updatedFour = {
      ...four,
      params: { ...four.params, [key]: value }, // update base
      [sideParamKey]: updatedSideParams, // update per-side override
    };
    setCardShape(activePageId, { fourSides: updatedFour });
  };

  const ParamRow = ({ label, paramKey, min, max, step = 0.5 }: {
    label: string; paramKey: string; min: number; max: number; step?: number;
  }) => {
    const val = (currentSideParams as any)[paramKey] ?? (baseParams as any)[paramKey] ?? 0;
    return (
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] flex-1 text-neutral-400">{label} ({selectedEdgeSide.toUpperCase()})</span>
        <div className="flex items-center gap-1">
          <input type="range" min={min} max={max} step={step} value={val}
            onChange={e => update(paramKey, Number(e.target.value))}
            className="w-16 accent-amber-600 cursor-pointer" />
          <span className="text-[10px] w-8 text-right tabular-nums text-amber-400 font-mono">
            {val.toFixed(1)}mm
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="px-3 py-2">
      <div className="text-[9px] text-amber-500 font-bold uppercase tracking-wider mb-2">
        Independent Parameters for {selectedEdgeSide.toUpperCase()} Edge
      </div>
      <ParamRow label="Wave Amplitude" paramKey="waveAmplitude" min={0.5} max={20} />
      <ParamRow label="Wave Frequency" paramKey="waveFrequency" min={2} max={50} />
      <ParamRow label="Scallop Radius" paramKey="scallopRadius" min={1} max={20} />
      <ParamRow label="Notch Depth" paramKey="notchDepth" min={1} max={30} />
      <ParamRow label="Notch Width" paramKey="notchWidth" min={2} max={50} />
      <ParamRow label="Corner Radius" paramKey="cornerRadius" min={1} max={50} />
      <ParamRow label="Arch Height" paramKey="archHeight" min={5} max={80} />
      <ParamRow label="Zig-Zag Height" paramKey="zigzagHeight" min={1} max={30} />
      <ParamRow label="Zig-Zag Width" paramKey="zigzagWidth" min={2} max={40} />
    </div>
  );
};

// ─── Partial Cut section ──────────────────────────────────────────────────────
const PartialCutsSection: React.FC = () => {
  const { addPartialCutObject, partialCuts, removePartialCutObject, setSelectedPartialCutId, showToast } = useStudioStore();

  const handleAdd = (shapeId: string) => {
    const def = PARTIAL_CUT_SHAPES.find(s => s.id === shapeId);
    if (!def) return;
    const obj = buildPartialCutObject(def, 185, 300);
    addPartialCutObject(obj);
    showToast(`Added ${def.name} partial cut`);
  };

  return (
    <div className="px-2 py-2 space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        {PARTIAL_CUT_SHAPES.map(shape => (
          <button
            key={shape.id}
            onClick={() => handleAdd(shape.id)}
            className="flex flex-col items-center p-2 rounded transition-all group bg-neutral-900 border border-neutral-800 hover:border-amber-500"
          >
            <svg viewBox="0 0 60 60" className="w-10 h-10 mb-1"
              stroke="#C9956C" fill="none" strokeWidth="1.5"
              dangerouslySetInnerHTML={{ __html: shape.previewSvg }}
            />
            <span className="text-[9px] font-semibold truncate w-full text-center text-neutral-300">
              {shape.name}
            </span>
            <span className="text-[8px] text-neutral-500">
              {shape.category}
            </span>
          </button>
        ))}
      </div>

      {/* Active partial cuts list */}
      {partialCuts.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-neutral-800">
          <div className="text-[10px] font-bold uppercase tracking-widest px-1 text-neutral-400">
            Active Partial Cuts ({partialCuts.length})
          </div>
          {partialCuts.map(pc => (
            <div key={pc.id}
              onClick={() => setSelectedPartialCutId(pc.id)}
              className="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all bg-neutral-900 border border-neutral-800 hover:border-amber-500">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-neutral-200">{pc.name}</span>
                <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-400 font-mono">
                  {pc.cutType}
                </span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removePartialCutObject(pc.id); }}
                className="text-red-400 hover:text-red-200 text-xs px-1">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Production Settings ──────────────────────────────────────────────────────
const ProductionSettingsSection: React.FC = () => {
  const { materialConfig, setMaterialGsm, setBleedMm, setSafeAreaMm, showToast } = useStudioStore();

  return (
    <div className="px-3 py-2 space-y-2">
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wide block mb-1 text-neutral-400">GSM (Paper Weight)</label>
        <div className="flex flex-wrap gap-1">
          {([180, 220, 250, 300, 350, 400] as const).map(g => (
            <button key={g} onClick={() => { setMaterialGsm(g); showToast(`GSM set to ${g}`); }}
              className="px-2 py-1 rounded text-[10px] font-bold transition-all"
              style={{
                background: materialConfig.gsm === g ? '#C9956C' : '#111',
                color: materialConfig.gsm === g ? '#111' : '#7a7068',
                border: '1px solid ' + (materialConfig.gsm === g ? '#C9956C' : '#2a2520'),
              }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold block mb-1 text-neutral-400">Bleed (mm)</label>
          <input type="number" min={0} max={10} step={0.5} value={materialConfig.bleedMm}
            onChange={e => setBleedMm(Number(e.target.value))}
            className="w-full px-2 py-1 rounded text-xs outline-none bg-neutral-900 border border-neutral-800 text-neutral-200" />
        </div>
        <div>
          <label className="text-[10px] font-bold block mb-1 text-neutral-400">Safe Area (mm)</label>
          <input type="number" min={0} max={20} step={0.5} value={materialConfig.safeAreaMm}
            onChange={e => setSafeAreaMm(Number(e.target.value))}
            className="w-full px-2 py-1 rounded text-xs outline-none bg-neutral-900 border border-neutral-800 text-neutral-200" />
        </div>
      </div>

      <div className="p-2 rounded text-[10px] leading-relaxed bg-neutral-950 border border-neutral-800 text-neutral-400">
        Card: A5 — 148 × 210 mm ({materialConfig.gsm} GSM)<br />
        Bleed: {materialConfig.bleedMm}mm · Safe: {materialConfig.safeAreaMm}mm<br />
        Min Cut: {materialConfig.minCutWidthMm}mm · Min Bridge: {materialConfig.minBridgeWidthMm ?? 0.8}mm
      </div>
    </div>
  );
};

// ─── Validation section ───────────────────────────────────────────────────────
const ValidationSection: React.FC = () => {
  const { validationWarnings, runProductionValidation } = useStudioStore();

  return (
    <div className="px-3 py-2 space-y-2">
      <button onClick={runProductionValidation}
        className="w-full py-1.5 rounded text-xs font-bold transition-all bg-amber-950/40 border border-amber-500 text-amber-400 hover:bg-amber-900/60">
        ▶ Run Production Validation
      </button>

      {validationWarnings.length === 0 ? (
        <div className="text-center text-xs py-2 text-emerald-400 font-semibold">✓ VALID — All paths production safe</div>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
          {validationWarnings.map(w => (
            <div key={w.id} className="px-2 py-1.5 rounded text-[10px]"
              style={{
                background: w.severity === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                border: '1px solid ' + (w.severity === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'),
                color: w.severity === 'error' ? '#ef4444' : '#f59e0b',
              }}>
              {w.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Panel ────────────────────────────────────────────────────────────────
export const AdvancedDieCutPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full overflow-y-auto text-xs bg-neutral-950">
      {/* Header */}
      <div className="px-3 py-2 flex-shrink-0 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-2">
          <Scissors className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Vector Die-Cut Studio (388 Library)
          </span>
        </div>
        <p className="text-[9px] mt-0.5 text-neutral-400">
          Edge Cut, Die-Cut & Partial-Cut Production Engine
        </p>
      </div>

      {/* Sections */}
      <Section title="Edge Side Selector" defaultOpen>
        <EdgeSideSelector />
      </Section>

      {/* Section 2: 388 Vector Shape Registry Browser */}
      <Section title="Vector Shape Library (388)" defaultOpen>
        <VectorLibraryBrowser />
      </Section>

      <Section title="Edge Parameters">
        <EdgeParams />
      </Section>

      <Section title="Partial / Pop-Up Cuts" defaultOpen>
        <PartialCutsSection />
      </Section>

      <Section title="Production Settings">
        <ProductionSettingsSection />
      </Section>

      <Section title="Validation">
        <ValidationSection />
      </Section>
    </div>
  );
};

export default AdvancedDieCutPanel;
