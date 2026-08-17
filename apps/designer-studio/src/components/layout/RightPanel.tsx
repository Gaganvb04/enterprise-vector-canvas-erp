import React, { useState } from 'react';
import {
  Trash2, Lock, Unlock, RotateCcw, FlipHorizontal, FlipVertical,
  ChevronDown, ChevronRight, Scissors, Box, Sliders,
  FileText, Type as TypeIcon, Image as ImageIcon, Grid,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { useStudioStore, type PrintFinish } from '../../store/studioStore';
import { VECTOR_DIE_CUT_LIBRARY } from '../../data/diecutLibrary';
import ProductionValidationPanel from '../tools/ProductionValidationPanel';

const mmToPx = 3.78;
const pxToMm = (px: number) => Math.round(px / mmToPx);

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode }> = ({
  title, children, defaultOpen = true, icon
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#252118]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#C9956C] bg-[#161412] hover:bg-[#1A1816] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-[#8C8073]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#8C8073]" />}
      </button>
      {open && <div className="p-3 space-y-3 bg-[#1A1816]">{children}</div>}
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-2 text-xs">
    <span className="text-[10px] font-bold text-[#8C8073] uppercase tracking-wider">{label}</span>
    <div className="flex items-center gap-1">{children}</div>
  </div>
);

const NumInput: React.FC<{ value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }> = ({
  value, onChange, min, max, step = 1, suffix
}) => (
  <div className="flex items-center gap-1">
    <input
      type="number"
      value={Math.round(value)}
      min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value))}
      className="w-14 text-xs px-2 py-1 rounded bg-[#1A1816] text-[#E5D7C5] border border-[#252118] text-right outline-none focus:border-[#C9956C]"
    />
    {suffix && <span className="text-[10px] font-mono text-[#8C8073]">{suffix}</span>}
  </div>
);

const PRINT_FINISHES: { id: PrintFinish; label: string }[] = [
  { id: 'none', label: 'Standard Ink' },
  { id: 'gold_foil', label: 'Gold Foil' },
  { id: 'silver_foil', label: 'Silver Foil' },
  { id: 'rose_gold', label: 'Rose Gold' },
  { id: 'copper_foil', label: 'Copper Foil' },
  { id: 'spot_uv', label: 'Spot UV' },
  { id: 'emboss', label: '3D Emboss' },
];

export const RightPanel: React.FC = () => {
  const {
    selected, getActivePage, selectedPartialCutId, partialCuts,
    updatePartialCutObject, updateElement, updateTextBlock, deleteElement, deleteTextBlock,
    setSelected, bringForward, sendBackward, bringToFront, sendToBack,
    uiMode, setUiMode, showRulers, toggleRulers, showGrid, toggleGrid, rotatePage,
    materialConfig, setMaterialGsm, setBleedMm, setSafeAreaMm,
    setEdgeSide, showToast,
  } = useStudioStore();

  const page = getActivePage();

  const selectedText = (selected?.layer === 'textblock' && page)
    ? page.textBlocks.find(tb => tb.id === selected.id)
    : null;
  const selectedElement = (selected?.layer === 'element' && page)
    ? page.elements.find(el => el.id === selected.id)
    : null;
  const selectedPartialCut = selectedPartialCutId
    ? partialCuts.find(pc => pc.id === selectedPartialCutId)
    : null;

  // ─── 1. PARTIAL CUT INSPECTOR ────────────────────────────────────────────────
  if (selectedPartialCut) {
    return (
      <div className="w-72 bg-[#161412] border-l border-[#252118] flex flex-col h-full flex-shrink-0 select-none overflow-y-auto no-scrollbar">
        <div className="h-10 px-3 flex items-center justify-between border-b border-[#252118] bg-[#1A1816]">
          <span className="text-xs font-bold uppercase tracking-widest text-pink-400 flex items-center gap-1.5">
            <Scissors className="h-3.5 w-3.5" /> PARTIAL CUT
          </span>
          <span className="text-[10px] text-[#8C8073] font-mono">{selectedPartialCut.name}</span>
        </div>

        {/* SVG Preview Card */}
        <div className="p-3 border-b border-[#252118] flex flex-col items-center justify-center bg-[#1A1816]">
          <div className="w-full h-24 flex items-center justify-center text-pink-400 p-2">
            {selectedPartialCut.svgPathD && (
              <svg viewBox={`0 0 ${selectedPartialCut.width} ${selectedPartialCut.height}`} className="w-full h-full max-h-20">
                <path d={selectedPartialCut.svgPathD} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6,3" />
              </svg>
            )}
          </div>
          <span className="text-xs font-bold text-[#E5D7C5] mt-1">{selectedPartialCut.name}</span>
        </div>

        {/* Outer Card Paper Trim Button */}
        <div className="p-3 border-b border-[#252118] bg-[#1A1816] space-y-1.5">
          <span className="text-[10px] font-bold text-[#8C8073] uppercase">Outer Card Boundary</span>
          <button
            onClick={() => {
              let side: 'top' | 'right' | 'bottom' | 'left' = 'top';
              if (selectedPartialCut.y < 250) side = 'top';
              else if (selectedPartialCut.y > 500) side = 'bottom';
              else if (selectedPartialCut.x < 150) side = 'left';
              else if (selectedPartialCut.x > 320) side = 'right';

              const item = VECTOR_DIE_CUT_LIBRARY.find(s => s.name.toLowerCase() === selectedPartialCut.name.toLowerCase() || s.id === selectedPartialCut.shapeId);
              const shapeIdToApply = item ? item.id : 'lib-5';

              setEdgeSide(side, shapeIdToApply);
              showToast(`✦ Trimmed paper card ${side.toUpperCase()} edge with ${selectedPartialCut.name}!`);
            }}
            className="w-full py-2 rounded-lg font-bold bg-[#C9956C] text-[#161412] shadow-lg flex items-center justify-center gap-1.5 hover:bg-[#D4A37A] transition-all text-xs"
          >
            <Scissors className="h-4 w-4" /> Trim Outer Card Edge ({selectedPartialCut.y < 250 ? 'TOP' : selectedPartialCut.y > 500 ? 'BOTTOM' : 'SIDE'})
          </button>
        </div>

        {/* Cut Behavior */}
        <CollapsibleSection title="Cut Operation Type" icon={<Scissors className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { type: 'partial_cut', label: 'Partial Cut', color: '#FF00FF' },
              { type: 'cut', label: 'Full Cut', color: '#FF0000' },
              { type: 'score', label: 'Score Line', color: '#0000FF' },
              { type: 'perforation', label: 'Perforation', color: '#00AA00' },
              { type: 'engrave', label: 'Engrave', color: '#CCAA00' },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => updatePartialCutObject(selectedPartialCut.id, { cutType: item.type as any })}
                className={`py-1.5 px-2 rounded text-[10px] font-bold border transition-all text-left ${
                  selectedPartialCut.cutType === item.type ? 'bg-[#252118] text-[#E5D7C5]' : 'bg-[#1A1816] text-[#8C8073] border-[#252118]'
                }`}
                style={{ borderColor: selectedPartialCut.cutType === item.type ? item.color : undefined }}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: item.color }} />
                {item.label}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Bridges Settings */}
        <CollapsibleSection title="Bridges & Attachment" icon={<Sliders className="h-3.5 w-3.5" />}>
          <Row label="Bridge Count">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(c => (
                <button
                  key={c}
                  onClick={() => updatePartialCutObject(selectedPartialCut.id, {
                    bridges: { ...selectedPartialCut.bridges, count: c }
                  })}
                  className={`w-7 py-1 rounded text-xs font-bold border ${
                    selectedPartialCut.bridges.count === c ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]' : 'bg-[#1A1816] text-[#8C8073] border-[#252118]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Bridge Width">
            <NumInput
              value={selectedPartialCut.bridges.widthMm}
              onChange={v => updatePartialCutObject(selectedPartialCut.id, {
                bridges: { ...selectedPartialCut.bridges, widthMm: Math.max(0.5, v) }
              })}
              min={0.5} max={5.0} step={0.1} suffix="mm"
            />
          </Row>
        </CollapsibleSection>

        {/* 3D Pop State */}
        <CollapsibleSection title="3D Physical State" icon={<Box className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-2 gap-1.5">
            {(['flat', 'lifted', 'folded', 'popped'] as const).map(state => (
              <button
                key={state}
                onClick={() => updatePartialCutObject(selectedPartialCut.id, { popState: state })}
                className={`py-1.5 rounded text-[10px] font-bold uppercase border transition-all ${
                  selectedPartialCut.popState === state ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]' : 'bg-[#1A1816] text-[#8C8073] border-[#252118]'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Transform */}
        <CollapsibleSection title="Transform">
          <Row label="Width"><NumInput value={pxToMm(selectedPartialCut.width)} onChange={v => updatePartialCutObject(selectedPartialCut.id, { width: v * mmToPx })} suffix="mm" /></Row>
          <Row label="Height"><NumInput value={pxToMm(selectedPartialCut.height)} onChange={v => updatePartialCutObject(selectedPartialCut.id, { height: v * mmToPx })} suffix="mm" /></Row>
          <Row label="Rotation"><NumInput value={selectedPartialCut.rotation || 0} onChange={v => updatePartialCutObject(selectedPartialCut.id, { rotation: v })} suffix="°" /></Row>
        </CollapsibleSection>
      </div>
    );
  }

  // ─── 2. TEXT INSPECTOR ───────────────────────────────────────────────────────
  if (selectedText && page) {
    return (
      <div className="w-72 bg-[#161412] border-l border-[#252118] flex flex-col h-full flex-shrink-0 select-none overflow-y-auto no-scrollbar">
        <div className="h-10 px-3 flex items-center justify-between border-b border-[#252118] bg-[#1A1816]">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C9956C] flex items-center gap-1.5">
            <TypeIcon className="h-3.5 w-3.5" /> TEXT BLOCK
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => updateTextBlock(page.id, selectedText.id, { locked: !selectedText.locked })} className="p-1 rounded text-[#8C8073] hover:text-[#E5D7C5]">
              {selectedText.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => { deleteTextBlock(page.id, selectedText.id); setSelected(null); }} className="p-1 rounded text-red-400 hover:bg-red-950/40">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3 border-b border-[#252118] space-y-2 bg-[#1A1816]">
          <span className="text-[10px] font-bold text-[#8C8073] uppercase">Text Content</span>
          <textarea
            value={selectedText.content}
            onChange={e => updateTextBlock(page.id, selectedText.id, { content: e.target.value })}
            rows={3}
            className="w-full bg-[#161412] text-[#E5D7C5] text-xs p-2 rounded border border-[#252118] outline-none focus:border-[#C9956C] font-mono"
          />
        </div>

        {/* Phase 9 Variable Binding & Customer Customization Inspector */}
        <CollapsibleSection title="Variable Binding & Mode" icon={<FileText className="h-3.5 w-3.5" />}>
          <Row label="Variable Tag">
            <span className="font-mono text-amber-300 font-bold text-xs">
              {selectedText.variableKey ? `{{${selectedText.variableKey}}}` : selectedText.content.includes('{{') ? 'Mixed Variable' : 'None (Static)'}
            </span>
          </Row>

          <Row label="Live Preview">
            <span className="font-semibold text-[#E5D7C5] text-xs truncate max-w-[130px]">
              {useStudioStore.getState().resolveVariables(selectedText.content)}
            </span>
          </Row>

          <Row label="Customer Editable">
            <button
              onClick={() => updateTextBlock(page.id, selectedText.id, {
                editableByCustomer: selectedText.editableByCustomer !== false ? false : true,
                isCustomizable: selectedText.editableByCustomer !== false ? false : true
              })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                selectedText.editableByCustomer !== false
                  ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]'
                  : 'bg-[#1A1816] text-[#8C8073] border-[#252118]'
              }`}
            >
              {selectedText.editableByCustomer !== false ? 'CUSTOMIZABLE' : 'STATIC TEXT'}
            </button>
          </Row>
        </CollapsibleSection>

        <CollapsibleSection title="Typography">
          <Row label="Font">
            <select
              value={selectedText.fontFamily}
              onChange={e => updateTextBlock(page.id, selectedText.id, { fontFamily: e.target.value })}
              className="bg-[#1A1816] text-[#E5D7C5] text-xs px-2 py-1 rounded border border-[#252118] outline-none"
            >
              {['Playfair Display', 'Cormorant Garamond', 'Montserrat', 'Cinzel', 'Great Vibes', 'Alex Brush'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Row>
          <Row label="Size"><NumInput value={selectedText.fontSize} onChange={v => updateTextBlock(page.id, selectedText.id, { fontSize: Math.max(6, v) })} suffix="pt" /></Row>
          <Row label="Alignment">
            <div className="flex gap-1 bg-[#1A1816] p-0.5 rounded border border-[#252118]">
              <button
                onClick={() => updateTextBlock(page.id, selectedText.id, { textAlign: 'left' })}
                className={`p-1 rounded text-xs ${selectedText.textAlign === 'left' ? 'bg-[#C9956C] text-[#161412]' : 'text-[#8C8073]'}`}
                title="Align Left"
              >
                <AlignLeft className="h-3 w-3" />
              </button>
              <button
                onClick={() => updateTextBlock(page.id, selectedText.id, { textAlign: 'center' })}
                className={`p-1 rounded text-xs ${selectedText.textAlign === 'center' ? 'bg-[#C9956C] text-[#161412]' : 'text-[#8C8073]'}`}
                title="Align Center"
              >
                <AlignCenter className="h-3 w-3" />
              </button>
              <button
                onClick={() => updateTextBlock(page.id, selectedText.id, { textAlign: 'right' })}
                className={`p-1 rounded text-xs ${selectedText.textAlign === 'right' ? 'bg-[#C9956C] text-[#161412]' : 'text-[#8C8073]'}`}
                title="Align Right"
              >
                <AlignRight className="h-3 w-3" />
              </button>
            </div>
          </Row>
          <Row label="Line Height"><NumInput value={selectedText.lineHeight || 1.4} onChange={v => updateTextBlock(page.id, selectedText.id, { lineHeight: v })} min={0.8} max={3.0} step={0.1} /></Row>
          <Row label="Letter Spacing"><NumInput value={selectedText.letterSpacing || 0} onChange={v => updateTextBlock(page.id, selectedText.id, { letterSpacing: v })} min={-2} max={10} step={0.5} suffix="px" /></Row>
        </CollapsibleSection>

        <CollapsibleSection title="Appearance">
          <Row label="Color">
            <input
              type="color"
              value={selectedText.fontColor}
              onChange={e => updateTextBlock(page.id, selectedText.id, { fontColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
          </Row>
          <Row label="Luxury Finish">
            <select
              value={selectedText.printFinish || 'none'}
              onChange={e => updateTextBlock(page.id, selectedText.id, { printFinish: e.target.value as any })}
              className="bg-[#1A1816] text-[#E5D7C5] text-xs px-2 py-1 rounded border border-[#252118] outline-none"
            >
              {PRINT_FINISHES.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </Row>
        </CollapsibleSection>

        <CollapsibleSection title="Spacing">
          <Row label="Letter Spacing"><NumInput value={selectedText.letterSpacing} onChange={v => updateTextBlock(page.id, selectedText.id, { letterSpacing: v })} suffix="px" /></Row>
          <Row label="Line Height"><NumInput value={selectedText.lineHeight} onChange={v => updateTextBlock(page.id, selectedText.id, { lineHeight: v })} step={0.1} /></Row>
        </CollapsibleSection>

        <CollapsibleSection title="Transform">
          <Row label="Width"><NumInput value={pxToMm(selectedText.width)} onChange={v => updateTextBlock(page.id, selectedText.id, { width: v * mmToPx })} suffix="mm" /></Row>
          <Row label="X"><NumInput value={pxToMm(selectedText.x)} onChange={v => updateTextBlock(page.id, selectedText.id, { x: v * mmToPx })} suffix="mm" /></Row>
          <Row label="Y"><NumInput value={pxToMm(selectedText.y)} onChange={v => updateTextBlock(page.id, selectedText.id, { y: v * mmToPx })} suffix="mm" /></Row>
        </CollapsibleSection>
      </div>
    );
  }

  // ─── 3. IMAGE / ELEMENT INSPECTOR ────────────────────────────────────────────
  if (selectedElement && page) {
    return (
      <div className="w-72 bg-[#161412] border-l border-[#252118] flex flex-col h-full flex-shrink-0 select-none overflow-y-auto no-scrollbar">
        <div className="h-10 px-3 flex items-center justify-between border-b border-[#252118] bg-[#1A1816]">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C9956C] flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> IMAGE / STICKER
          </span>
          <button onClick={() => { deleteElement(page.id, selectedElement.id); setSelected(null); }} className="p-1 rounded text-red-400 hover:bg-red-950/40">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-3 border-b border-[#252118] flex items-center justify-center bg-[#1A1816]">
          {selectedElement.src.startsWith('<svg') ? (
            <div className="w-20 h-20 text-[#C9956C]" dangerouslySetInnerHTML={{ __html: selectedElement.src }} />
          ) : (
            <img src={selectedElement.src} alt={selectedElement.name} className="max-h-24 max-w-full object-contain" />
          )}
        </div>

        <CollapsibleSection title="Customer Personalization" icon={<FileText className="h-3.5 w-3.5" />}>
          <Row label="Customer Editable">
            <button
              onClick={() => updateElement(page.id, selectedElement.id, { editableByCustomer: !selectedElement.editableByCustomer })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                selectedElement.editableByCustomer
                  ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]'
                  : 'bg-[#1A1816] text-[#8C8073] border-[#252118]'
              }`}
            >
              {selectedElement.editableByCustomer ? 'CUSTOMER EDITABLE: ON' : 'PROTECTED: OFF'}
            </button>
          </Row>
        </CollapsibleSection>

        <CollapsibleSection title="Transform">
          <Row label="Width"><NumInput value={pxToMm(selectedElement.width)} onChange={v => updateElement(page.id, selectedElement.id, { width: v * mmToPx })} suffix="mm" /></Row>
          <Row label="Height"><NumInput value={pxToMm(selectedElement.height)} onChange={v => updateElement(page.id, selectedElement.id, { height: v * mmToPx })} suffix="mm" /></Row>
          <Row label="Rotation"><NumInput value={selectedElement.rotation || 0} onChange={v => updateElement(page.id, selectedElement.id, { rotation: v })} suffix="°" /></Row>
        </CollapsibleSection>

        <CollapsibleSection title="Appearance">
          <Row label="Opacity">
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={selectedElement.opacity ?? 1}
              onChange={e => updateElement(page.id, selectedElement.id, { opacity: Number(e.target.value) })}
              className="w-28 accent-[#C9956C]"
            />
          </Row>
          <Row label="Flip">
            <div className="flex gap-1">
              <button onClick={() => updateElement(page.id, selectedElement.id, { flipH: !selectedElement.flipH })} className="px-2 py-0.5 rounded bg-[#1A1816] text-xs border border-[#252118]">
                <FlipHorizontal className="h-3 w-3" /> H
              </button>
              <button onClick={() => updateElement(page.id, selectedElement.id, { flipV: !selectedElement.flipV })} className="px-2 py-0.5 rounded bg-[#1A1816] text-xs border border-[#252118]">
                <FlipVertical className="h-3 w-3" /> V
              </button>
            </div>
          </Row>
        </CollapsibleSection>

        <CollapsibleSection title="Layer Depth">
          <div className="grid grid-cols-2 gap-1 text-xs">
            <button onClick={bringForward} className="py-1 rounded bg-[#1A1816] border border-[#252118] text-[#E5D7C5]">Forward</button>
            <button onClick={sendBackward} className="py-1 rounded bg-[#1A1816] border border-[#252118] text-[#E5D7C5]">Backward</button>
            <button onClick={bringToFront} className="py-1 rounded bg-[#1A1816] border border-[#252118] text-[#E5D7C5]">To Front</button>
            <button onClick={sendToBack} className="py-1 rounded bg-[#1A1816] border border-[#252118] text-[#E5D7C5]">To Back</button>
          </div>
        </CollapsibleSection>
      </div>
    );
  }

  // ─── 4. DEFAULT NO SELECTION / CARD PROPERTIES ─────────────────────────────
  return (
    <div className="w-72 bg-[#161412] border-l border-[#252118] flex flex-col h-full flex-shrink-0 select-none overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[#252118] bg-[#1A1816]">
        <span className="text-xs font-bold uppercase tracking-widest text-[#E5D7C5] flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-[#C9956C]" /> CARD SETTINGS
        </span>
      </div>

      <div className="p-3 border-b border-[#252118] bg-[#1A1816]/50 text-center">
        <span className="text-[10px] text-[#8C8073] italic">Select an object on the canvas to inspect its properties</span>
      </div>

      {/* Card Dimensions */}
      <CollapsibleSection title="Card Dimensions" icon={<FileText className="h-3.5 w-3.5" />}>
        <Row label="Format"><span className="font-bold text-[#C9956C]">A5 Standard</span></Row>
        <Row label="Width"><span className="font-mono text-[#E5D7C5]">148 mm</span></Row>
        <Row label="Height"><span className="font-mono text-[#E5D7C5]">210 mm</span></Row>
        <Row label="Orientation">
          <button onClick={() => rotatePage()} className="px-2 py-0.5 rounded bg-[#1A1816] border border-[#252118] text-xs text-[#E5D7C5] flex items-center gap-1">
            <RotateCcw className="h-3 w-3 text-[#C9956C]" /> Rotate 90°
          </button>
        </Row>
      </CollapsibleSection>

      {/* View & Canvas Toggles */}
      <CollapsibleSection title="View & Grid" icon={<Grid className="h-3.5 w-3.5" />}>
        <Row label="Grid Overlay">
          <button onClick={toggleGrid} className={`px-2 py-0.5 rounded text-xs border ${showGrid ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]' : 'bg-[#1A1816] text-[#8C8073] border-[#252118]'}`}>
            {showGrid ? 'ON' : 'OFF'}
          </button>
        </Row>
        <Row label="mm Rulers">
          <button onClick={toggleRulers} className={`px-2 py-0.5 rounded text-xs border ${showRulers ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]' : 'bg-[#1A1816] text-[#8C8073] border-[#252118]'}`}>
            {showRulers ? 'ON' : 'OFF'}
          </button>
        </Row>
        <Row label="Mode">
          <button onClick={() => setUiMode(uiMode === 'design' ? 'production' : 'design')} className="px-2 py-0.5 rounded text-[10px] font-bold border border-[#C9956C] text-[#C9956C]">
            {uiMode.toUpperCase()}
          </button>
        </Row>
      </CollapsibleSection>

      {/* Advanced Manufacturing Settings */}
      <CollapsibleSection title="Advanced Production" icon={<Sliders className="h-3.5 w-3.5" />} defaultOpen={uiMode === 'production'}>
        <Row label="Paper GSM">
          <select value={materialConfig.gsm} onChange={e => setMaterialGsm(Number(e.target.value) as any)} className="bg-[#1A1816] text-[#E5D7C5] text-xs px-2 py-1 rounded border border-[#252118]">
            <option value="250">250 GSM</option>
            <option value="300">300 GSM (Standard)</option>
            <option value="350">350 GSM</option>
            <option value="400">400 GSM (Heavy)</option>
          </select>
        </Row>
        <Row label="Bleed Outer"><NumInput value={materialConfig.bleedMm} onChange={v => setBleedMm(v)} suffix="mm" /></Row>
        <Row label="Safe Area Inner"><NumInput value={materialConfig.safeAreaMm} onChange={v => setSafeAreaMm(v)} suffix="mm" /></Row>
        <Row label="Min Bridge"><span className="font-mono text-[#8C8073]">{materialConfig.minBridgeWidthMm} mm</span></Row>
        <Row label="Min Gap"><span className="font-mono text-[#8C8073]">{materialConfig.minGapMm} mm</span></Row>

        {/* Validation Status */}
        <div className="mt-2">
          <ProductionValidationPanel />
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default RightPanel;
