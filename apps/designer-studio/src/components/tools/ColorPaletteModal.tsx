import React, { useState } from 'react';
import { Palette, Type, X, Check, RefreshCw, Sparkles } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export interface CuratedPalette {
  id: string;
  name: string;
  colors: [string, string, string]; // [Primary, Accent, Background]
}

export interface FontPreset {
  id: string;
  name: string;
  headingFont: string;
  bodyFont: string;
  sample: string;
}

export const CURATED_PALETTES: CuratedPalette[] = [
  { id: 'royal_gold', name: 'ROYAL GOLD', colors: ['#7B1E1E', '#C9956C', '#FAF5EF'] },
  { id: 'rose_gold', name: 'ROSE GOLD', colors: ['#B76E79', '#D4AF37', '#FFF5F5'] },
  { id: 'navy_silver', name: 'NAVY SILVER', colors: ['#1A2E40', '#C0C0C0', '#F8FAFC'] },
  { id: 'traditional_red', name: 'TRADITIONAL RED', colors: ['#990000', '#DAA520', '#FFFDF0'] },
  { id: 'mint_floral', name: 'MINT FLORAL', colors: ['#2D5A27', '#C9956C', '#F4F9F4'] },
  { id: 'peacock', name: 'PEACOCK', colors: ['#0F4C81', '#107C41', '#FAF5EF'] },
  { id: 'mughal_royal', name: 'MUGHAL ROYAL', colors: ['#58111A', '#B8860B', '#FDFBF7'] },
  { id: 'minimal', name: 'MINIMAL', colors: ['#161412', '#8C8073', '#FFFFFF'] },
];

export const FONT_PRESETS: FontPreset[] = [
  { id: 'classic_romance', name: 'CLASSIC ROMANCE', headingFont: 'Playfair Display', bodyFont: 'Cormorant Garamond', sample: 'Priya & Rahul' },
  { id: 'royal_indian', name: 'ROYAL INDIAN', headingFont: 'Cinzel', bodyFont: 'Noto Serif', sample: 'Ananya & Arjun' },
  { id: 'modern_elegance', name: 'MODERN ELEGANCE', headingFont: 'Montserrat', bodyFont: 'Cormorant Garamond', sample: 'Siddharth & Meera' },
  { id: 'traditional', name: 'TRADITIONAL', headingFont: 'Noto Serif', bodyFont: 'Noto Serif Kannada', sample: 'II Sri Ganeshaya Namah II' },
  { id: 'handwritten', name: 'HANDWRITTEN', headingFont: 'Great Vibes', bodyFont: 'Cormorant Garamond', sample: 'Together with their families' },
  { id: 'mughal_decor', name: 'MUGHAL DECORATIVE', headingFont: 'Cinzel', bodyFont: 'Cormorant Garamond', sample: 'Royal Wedding Celebration' },
];

export const ColorPaletteModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { getActivePage, updateTextBlock, updatePage, showToast } = useStudioStore();
  const [selectedPalette, setSelectedPalette] = useState<string>('royal_gold');
  const [selectedFontPreset, setSelectedFontPreset] = useState<string>('classic_romance');

  if (!isOpen) return null;

  const page = getActivePage();

  const handleApplyPalette = (palette: CuratedPalette) => {
    if (!page) return;
    setSelectedPalette(palette.id);

    // Update background
    updatePage(page.id, {
      background: { ...page.background, color: palette.colors[2] }
    });

    // Intelligently update text block colors
    page.textBlocks.forEach((tb, index) => {
      const isHeader = index < 3 || tb.fontSize >= 20;
      updateTextBlock(page.id, tb.id, {
        fontColor: isHeader ? palette.colors[0] : palette.colors[1]
      });
    });

    showToast(`🎨 Applied ${palette.name} curated color palette!`);
  };

  const handleApplyFontPreset = (preset: FontPreset) => {
    if (!page) return;
    setSelectedFontPreset(preset.id);

    page.textBlocks.forEach((tb, index) => {
      const isHeader = index < 3 || tb.fontSize >= 20;
      updateTextBlock(page.id, tb.id, {
        fontFamily: isHeader ? preset.headingFont : preset.bodyFont
      });
    });

    showToast(`✦ Applied ${preset.name} typography pairing!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col text-xs"
        style={{ background: '#161412', borderColor: '#252118', color: '#E5D7C5' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#252118' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C9956C]/10 text-[#C9956C] border border-[#C9956C]/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#E5D7C5]">Curated Design Palettes &amp; Typography</h3>
              <p className="text-[11px] text-[#8C8073]">1-Click luxury color swatches &amp; font pairings for invitation cards</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#8C8073] hover:text-[#E5D7C5]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* Section 1: Color Palettes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#C9956C] uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Curated Color Palettes
              </span>
              <button
                onClick={() => showToast(`Reset palette to template defaults.`)}
                className="text-[11px] text-[#8C8073] hover:text-[#C9956C] flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Reset Palette
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CURATED_PALETTES.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleApplyPalette(p)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    selectedPalette === p.id
                      ? 'bg-[#1A1816] border-[#C9956C] shadow-lg scale-[1.02]'
                      : 'bg-[#141210] border-[#252118] hover:border-[#C9956C]/40'
                  }`}
                >
                  <div className="flex items-center gap-1 h-6 rounded-lg overflow-hidden border border-black/30">
                    <div className="flex-1 h-full" style={{ background: p.colors[0] }} title="Primary Color" />
                    <div className="flex-1 h-full" style={{ background: p.colors[1] }} title="Accent Color" />
                    <div className="flex-1 h-full" style={{ background: p.colors[2] }} title="Card Background" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] text-[#E5D7C5] tracking-wider truncate">{p.name}</span>
                    {selectedPalette === p.id && <Check className="h-3 w-3 text-[#C9956C]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Font Pair Presets */}
          <div className="space-y-3 pt-2 border-t border-[#252118]">
            <span className="font-bold text-xs text-[#C9956C] uppercase tracking-wider flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" /> Curated Typography Presets
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {FONT_PRESETS.map(fp => (
                <div
                  key={fp.id}
                  onClick={() => handleApplyFontPreset(fp)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    selectedFontPreset === fp.id
                      ? 'bg-[#1A1816] border-[#C9956C] shadow-lg scale-[1.02]'
                      : 'bg-[#141210] border-[#252118] hover:border-[#C9956C]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] text-[#C9956C] uppercase tracking-wider">{fp.name}</span>
                    {selectedFontPreset === fp.id && <Check className="h-3 w-3 text-[#C9956C]" />}
                  </div>
                  <p className="text-xs font-serif text-[#E5D7C5] truncate" style={{ fontFamily: fp.headingFont }}>
                    {fp.sample}
                  </p>
                  <span className="text-[9px] text-[#8C8073] block truncate">
                    {fp.headingFont} + {fp.bodyFont}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: '#252118' }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold bg-[#C9956C] text-[#161412] hover:bg-[#D4A37A] text-xs transition-all"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPaletteModal;
