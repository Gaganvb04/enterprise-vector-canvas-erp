import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

export const LayersPanel: React.FC = () => {
  const {
    getActivePage, activePageId, selected, setSelected,
    updateElement, deleteElement,
    updateTextBlock, deleteTextBlock,
  } = useStudioStore();

  const page = getActivePage();
  if (!page) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b" style={{ borderColor: '#2a2520' }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7a7068' }}>Layers</span>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Layer 3: Text Blocks ──────────────────────────────────── */}
        <div className="layer-group-header" style={{ color: '#8B9FBF' }}>
          <span>Layer 3 — Text</span>
          <span className="ml-auto text-xs" style={{ color: '#3a4558' }}>{page.textBlocks.length}</span>
        </div>
        {page.textBlocks.length === 0 && (
          <div className="px-3 py-2 text-xs" style={{ color: '#3a3028' }}>No text blocks</div>
        )}
        {[...page.textBlocks].reverse().map(tb => {
          const isSelected = selected?.layer === 'textblock' && selected.id === tb.id;
          return (
            <div
              key={tb.id}
              className={`layer-item ${isSelected ? 'selected' : ''} group`}
              onClick={() => setSelected({ layer: 'textblock', id: tb.id })}
            >
              <span className="flex-shrink-0 text-xs font-bold" style={{ color: '#8B9FBF' }}>T</span>
              <span className="flex-1 text-xs truncate">{tb.name}</span>
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-blue-400">
                M3: Text
              </span>
              {tb.printFinish && tb.printFinish !== 'none' && (
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  M4B: Foil
                </span>
              )}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); updateTextBlock(activePageId, tb.id, { visible: !tb.visible }); }}
                  className="p-0.5 rounded" style={{ color: '#7a7068' }}>
                  {tb.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
                <button onClick={e => { e.stopPropagation(); updateTextBlock(activePageId, tb.id, { locked: !tb.locked }); }}
                  className="p-0.5 rounded" style={{ color: '#7a7068' }}>
                  {tb.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </button>
                <button onClick={e => { e.stopPropagation(); deleteTextBlock(activePageId, tb.id); setSelected(null); }}
                  className="p-0.5 rounded"
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a7068')}
                  style={{ color: '#7a7068' }}>
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* ── Layer 2: Design Elements ──────────────────────────────── */}
        <div className="layer-group-header" style={{ color: '#C9956C' }}>
          <span>Layer 2 — Elements</span>
          <span className="ml-auto text-xs" style={{ color: '#4a3520' }}>{page.elements.length}</span>
        </div>
        {page.elements.length === 0 && (
          <div className="px-3 py-2 text-xs" style={{ color: '#3a3028' }}>No elements</div>
        )}
        {[...page.elements].reverse().map(el => {
          const isSelected = selected?.layer === 'element' && selected.id === el.id;
          return (
            <div
              key={el.id}
              className={`layer-item ${isSelected ? 'selected' : ''} group`}
              onClick={() => setSelected({ layer: 'element', id: el.id })}
            >
              <span className="flex-shrink-0 text-xs font-bold" style={{ color: '#C9956C' }}>✦</span>
              <span className="flex-1 text-xs truncate">{el.name}</span>
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-amber-500">
                M2: Artwork
              </span>
              {el.printFinish && el.printFinish !== 'none' && (
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  M4A: Foil
                </span>
              )}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); updateElement(activePageId, el.id, { visible: !el.visible }); }}
                  className="p-0.5 rounded" style={{ color: '#7a7068' }}>
                  {el.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
                <button onClick={e => { e.stopPropagation(); updateElement(activePageId, el.id, { locked: !el.locked }); }}
                  className="p-0.5 rounded" style={{ color: '#7a7068' }}>
                  {el.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </button>
                <button onClick={e => { e.stopPropagation(); deleteElement(activePageId, el.id); setSelected(null); }}
                  className="p-0.5 rounded"
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a7068')}
                  style={{ color: '#7a7068' }}>
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* ── Layer 1: Background ───────────────────────────────────── */}
        <div className="layer-group-header" style={{ color: '#A8886A' }}>
          <span>Layer 1 — Background & Card Die-Cut</span>
        </div>
        <div className="layer-item" style={{ cursor: 'default' }}>
          <span className="flex-shrink-0 text-xs" style={{ color: '#A8886A' }}>▣</span>
          <span className="flex-1 text-xs truncate">
            {page.background.type === 'texture'
              ? page.background.textureId?.replace(/_/g, ' ')
              : page.background.type === 'gradient'
              ? 'Gradient'
              : page.background.color}
          </span>
          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-pink-950/40 border border-pink-800/40 text-pink-400">
            M1: Die-Cut
          </span>
          <div className="w-5 h-5 rounded flex-shrink-0"
            style={{
              background: page.background.type === 'color'
                ? page.background.color
                : 'linear-gradient(135deg, #F5E6D8, #EDD5C0)',
              border: '1px solid #3a3028',
            }} />
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;
