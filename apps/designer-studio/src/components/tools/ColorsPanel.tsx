import React, { useState } from 'react';
import { useStudioStore } from '../../store/studioStore';

const TEXTURES = [
  { id: 'marble_rose_gold', label: 'Marble Rose Gold', preview: { background: 'linear-gradient(135deg, #F5E6D8 0%, #EDD5C0 35%, #F2DFC8 60%, #E8D0B8 100%)' } },
  { id: 'marble_white', label: 'White Carrara Marble', preview: { background: 'linear-gradient(135deg, #FAF8F5 0%, #F0ECE8 35%, #F5F2EE 65%, #ECE7E2 100%)' } },
  { id: 'marble_emerald_gold', label: 'Emerald Gold Vein', preview: { background: 'linear-gradient(135deg, #06382B 0%, #0A4A3A 40%, #042E23 70%, #084032 100%)' } },
  { id: 'marble_dark_onyx', label: 'Dark Onyx Marble', preview: { background: 'linear-gradient(135deg, #121212 0%, #1A1A1A 50%, #0D0D0D 100%)' } },
  { id: 'marble_cream_amber', label: 'Cream Amber Alabaster', preview: { background: 'linear-gradient(135deg, #FFFDF5 0%, #F5E9D3 40%, #FAEFDC 70%, #ECE0C6 100%)' } },
  { id: 'marble_royal_blue', label: 'Lapis Royal Blue', preview: { background: 'linear-gradient(135deg, #0D1B2A 0%, #1B263B 50%, #0B1320 100%)' } },
  { id: 'linen', label: 'Textured Woven Linen', preview: { background: 'repeating-linear-gradient(0deg, #F5EFE7 0px, #F5EFE7 1px, #EDE7DD 2px, #EDE7DD 4px)' } },
  { id: 'dark_velvet', label: 'Royal Dark Velvet', preview: { background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)' } },
  { id: 'gold_foil', label: 'Reflective Gold Leaf', preview: { background: 'linear-gradient(135deg, #D4AF37 0%, #F5D060 30%, #C9982A 60%, #E8C843 100%)' } },
  { id: 'ivory', label: 'Antique Handcrafted Ivory', preview: { background: '#FFFDF4' } },
];

const PALETTE_COLORS = [
  // Warm neutrals
  '#FAF0E8', '#F5E6D0', '#EDD5C0', '#E8CAAD', '#DBBFA0',
  '#D4AF8C', '#C9A07A', '#BE916A', '#B3825A', '#A8734C',
  // Creams & whites
  '#FFFDF9', '#FFF8F0', '#FFF3E8', '#FFEDE0', '#FFE8D8',
  '#F5F0EB', '#EDE8E3', '#E5E0DB', '#DDD8D3', '#D5D0CB',
  // Dusty roses
  '#F2C4C4', '#E8ACAC', '#DE9494', '#D47C7C', '#CA6464',
  '#C04C4C', '#B63434', '#AC1C1C', '#A20404', '#7B1E1E',
  // Forest greens
  '#E8F5E8', '#C8E8C8', '#A8DBA8', '#88CE88', '#68C168',
  '#4CAF50', '#3E9740', '#307F30', '#226722', '#144F14',
  // Royal blues
  '#E0E8F5', '#C0D0E8', '#A0B8DB', '#80A0CE', '#6088C1',
  '#4070B4', '#3060A0', '#20508C', '#104078', '#003060',
  // Golds
  '#FFF8E0', '#FFF0B0', '#FFE880', '#FFE050', '#FFD820',
  '#D4AF37', '#C49F27', '#B48F17', '#A47F07', '#947000',
  // Deep purples
  '#F0E8F5', '#DBC0E8', '#C698DB', '#B170CE', '#9C48C1',
  '#8720B4', '#7010A0', '#5A008C', '#440078', '#2E0064',
  // Earthy terracotta
  '#F5E8E0', '#E8CEC0', '#DBB4A0', '#CE9A80', '#C18060',
  '#B46640', '#A04C20', '#8C3200', '#781800', '#640000',
];

export const ColorsPanel: React.FC = () => {
  const { activePageId, getActivePage, setBackground } = useStudioStore();
  const page = getActivePage();
  const [tab, setTab] = useState<'color' | 'texture'>('color');
  const [customColor, setCustomColor] = useState(page?.background.color ?? '#FAF0E8');

  const currentBg = page?.background;

  const applyColor = (color: string) => {
    setCustomColor(color);
    setBackground(activePageId, { type: 'color', color });
  };

  const applyTexture = (textureId: string) => {
    setBackground(activePageId, { type: 'texture', textureId });
  };

  return (
    <div className="p-3">
      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7a7068' }}>Background</div>

      {/* Tabs */}
      <div className="flex mb-3 rounded-lg overflow-hidden" style={{ border: '1px solid #2a2520' }}>
        {(['color', 'texture'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-1.5 text-xs font-medium capitalize"
            style={{
              background: tab === t ? 'rgba(201,149,108,0.2)' : 'transparent',
              color: tab === t ? '#C9956C' : '#7a7068',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'color' ? (
        <>
          {/* Custom color picker */}
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: '#111', border: '1px solid #2a2520' }}>
            <input type="color" value={customColor} onChange={e => applyColor(e.target.value)}
              className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent" />
            <input type="text" value={customColor} onChange={e => { setCustomColor(e.target.value); if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) applyColor(e.target.value); }}
              className="flex-1 text-xs px-2 py-1 rounded outline-none"
              style={{ background: '#1a1a1a', border: '1px solid #2a2520', color: '#c8bfb0' }} />
          </div>

          {/* Palette swatches */}
          <div className="text-xs mb-2" style={{ color: '#5a5048' }}>Saved Palette</div>
          <div className="flex flex-wrap gap-1">
            {PALETTE_COLORS.map(color => (
              <button
                key={color}
                onClick={() => applyColor(color)}
                className="color-swatch"
                style={{ background: color, borderColor: currentBg?.color === color ? '#C9956C' : 'transparent' }}
                title={color}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {TEXTURES.map(tex => (
            <button key={tex.id} onClick={() => applyTexture(tex.id)}
              className="texture-card"
              style={{ borderColor: currentBg?.textureId === tex.id ? '#C9956C' : 'transparent' }}>
              <div style={{ ...tex.preview, width: '100%', height: 80, borderRadius: 6 }} />
              <div className="text-center py-1" style={{ fontSize: 9, color: currentBg?.textureId === tex.id ? '#C9956C' : '#7a7068' }}>
                {tex.label}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorsPanel;
