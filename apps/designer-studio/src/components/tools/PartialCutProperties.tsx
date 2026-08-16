/**
 * PartialCutProperties
 * Properties inspector for a selected PartialCutObject.
 * Rendered inside RightPanel when selectedPartialCutId is set.
 */

import React from 'react';
import { Trash2, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { rebuildPartialCutPath } from '../../utils/partialCutShapes';
import type { CutLineType, PopState } from '../../types/diecut';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: '#7a7068' }}>
    {children}
  </label>
);

const NumInput: React.FC<{
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}> = ({ value, onChange, min, max, step = 1, suffix }) => (
  <div className="flex items-center gap-1">
    <input type="number" value={Math.round(value * 10) / 10} min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value))}
      className="w-16 text-xs px-1.5 py-1 rounded text-right outline-none"
      style={{ background: '#111', border: '1px solid #2a2520', color: '#e8e0d8' }}
    />
    {suffix && <span className="text-[10px]" style={{ color: '#5a5048' }}>{suffix}</span>}
  </div>
);

export const PartialCutProperties: React.FC<{ pcId: string }> = ({ pcId }) => {
  const {
    partialCuts, updatePartialCutObject, removePartialCutObject,
    setSelectedPartialCutId, showToast,
  } = useStudioStore();

  const pc = partialCuts.find(p => p.id === pcId);
  if (!pc) return null;

  const upd = (changes: Partial<typeof pc>) => {
    const updated = { ...pc, ...changes };
    // Rebuild SVG geometry when size / bridges change
    if ('width' in changes || 'height' in changes || 'bridges' in changes) {
      const rebuilt = rebuildPartialCutPath(updated as any);
      updatePartialCutObject(pcId, rebuilt);
    } else {
      updatePartialCutObject(pcId, changes);
    }
  };

  const CUT_TYPES: { id: CutLineType; label: string }[] = [
    { id: 'cut', label: 'Full Cut' },
    { id: 'partial_cut', label: 'Partial Cut' },
    { id: 'score', label: 'Score' },
    { id: 'perforation', label: 'Perforation' },
    { id: 'engrave', label: 'Engrave' },
  ];

  const POP_STATES: { id: PopState; label: string; icon: string }[] = [
    { id: 'flat',   label: 'Flat',   icon: '▬' },
    { id: 'lifted', label: 'Lifted', icon: '↗' },
    { id: 'folded', label: 'Folded', icon: '📐' },
    { id: 'popped', label: 'Popped', icon: '⬆' },
  ];

  return (
    <div className="p-3 space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: '#FF00FF' }}>🟣 Partial Cut</span>
        <div className="flex items-center gap-1">
          <button onClick={() => upd({ locked: !pc.locked })} className="p-1.5 rounded" style={{ color: '#7a7068' }}>
            {pc.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </button>
          <button onClick={() => upd({ visible: !pc.visible })} className="p-1.5 rounded" style={{ color: '#7a7068' }}>
            {pc.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>
          <button onClick={() => {
            removePartialCutObject(pcId);
            setSelectedPartialCutId(null);
            showToast('Removed partial cut');
          }} className="p-1.5 rounded" style={{ color: '#ef4444' }}>
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Name */}
      <div>
        <Label>Shape</Label>
        <div className="px-2 py-1.5 rounded text-xs" style={{ background: '#0d0d0d', border: '1px solid #2a2520', color: '#c8bfb0' }}>
          {pc.name} ({pc.shapeId})
        </div>
      </div>

      {/* Position & Size */}
      <div>
        <Label>Position & Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-[9px]" style={{ color: '#5a5048' }}>X</span>
            <NumInput value={pc.x} onChange={v => upd({ x: v })} suffix="px" /></div>
          <div><span className="text-[9px]" style={{ color: '#5a5048' }}>Y</span>
            <NumInput value={pc.y} onChange={v => upd({ y: v })} suffix="px" /></div>
          <div><span className="text-[9px]" style={{ color: '#5a5048' }}>W</span>
            <NumInput value={pc.width} onChange={v => upd({ width: Math.max(20, v) })} min={20} suffix="px" /></div>
          <div><span className="text-[9px]" style={{ color: '#5a5048' }}>H</span>
            <NumInput value={pc.height} onChange={v => upd({ height: Math.max(20, v) })} min={20} suffix="px" /></div>
        </div>
        <div className="mt-1.5 flex items-center gap-1">
          <span className="text-[9px]" style={{ color: '#5a5048' }}>Rotation</span>
          <NumInput value={pc.rotation} onChange={v => upd({ rotation: v })} min={-360} max={360} suffix="°" />
        </div>
      </div>

      <div className="h-px" style={{ background: '#2a2520' }} />

      {/* Cut Type */}
      <div>
        <Label>Operation</Label>
        <div className="grid grid-cols-2 gap-1">
          {CUT_TYPES.map(ct => (
            <button key={ct.id} onClick={() => upd({ cutType: ct.id })}
              className="py-1 px-2 rounded text-[10px] font-medium transition-all"
              style={{
                background: pc.cutType === ct.id ? 'rgba(201,149,108,0.2)' : '#111',
                color: pc.cutType === ct.id ? '#C9956C' : '#7a7068',
                border: '1px solid ' + (pc.cutType === ct.id ? '#C9956C' : '#2a2520'),
              }}>
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ background: '#2a2520' }} />

      {/* Bridges */}
      <div>
        <Label>Attachment Bridges</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[9px]" style={{ color: '#5a5048' }}>Count</span>
            <div className="flex gap-1 mt-0.5">
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => upd({ bridges: { ...pc.bridges, count: n } })}
                  className="flex-1 py-1 rounded text-[10px] font-bold"
                  style={{
                    background: pc.bridges.count === n ? '#C9956C' : '#111',
                    color: pc.bridges.count === n ? '#111' : '#7a7068',
                    border: '1px solid ' + (pc.bridges.count === n ? '#C9956C' : '#2a2520'),
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: '#5a5048' }}>Width (mm)</span>
            <select
              value={pc.bridges.widthMm}
              onChange={e => upd({ bridges: { ...pc.bridges, widthMm: Number(e.target.value) } })}
              className="mt-0.5 w-full px-1.5 py-1 rounded text-xs outline-none"
              style={{ background: '#111', border: '1px solid #2a2520', color: '#e8e0d8' }}>
              {[0.5, 1, 1.5, 2, 3, 5].map(w => (
                <option key={w} value={w}>{w} mm</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="h-px" style={{ background: '#2a2520' }} />

      {/* Fold */}
      <div>
        <Label>Fold Direction</Label>
        <div className="flex gap-1">
          {(['none', 'vertical', 'horizontal'] as const).map(f => (
            <button key={f} onClick={() => upd({ fold: f })}
              className="flex-1 py-1 rounded text-[10px] font-medium"
              style={{
                background: pc.fold === f ? 'rgba(33,150,243,0.2)' : '#111',
                color: pc.fold === f ? '#2196F3' : '#7a7068',
                border: '1px solid ' + (pc.fold === f ? '#2196F3' : '#2a2520'),
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ background: '#2a2520' }} />

      {/* 3D State */}
      <div>
        <Label>3D State</Label>
        <div className="grid grid-cols-2 gap-1">
          {POP_STATES.map(ps => (
            <button key={ps.id} onClick={() => upd({ popState: ps.id, popAngle: ps.id === 'lifted' ? 30 : ps.id === 'folded' ? 60 : ps.id === 'popped' ? 85 : 0 })}
              className="py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1"
              style={{
                background: pc.popState === ps.id ? 'rgba(201,149,108,0.2)' : '#111',
                color: pc.popState === ps.id ? '#C9956C' : '#7a7068',
                border: '1px solid ' + (pc.popState === ps.id ? '#C9956C' : '#2a2520'),
              }}>
              <span>{ps.icon}</span><span>{ps.label}</span>
            </button>
          ))}
        </div>
        {pc.popState !== 'flat' && (
          <div className="mt-1.5">
            <Label>Pop Angle</Label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={90} value={pc.popAngle}
                onChange={e => upd({ popAngle: Number(e.target.value) })}
                className="flex-1 accent-amber-600" />
              <span className="text-[10px] w-8 text-right" style={{ color: '#C9956C' }}>{pc.popAngle}°</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartialCutProperties;
