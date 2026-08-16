import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import type { TextBlock, TextBlockType } from '../../store/studioStore';

const DYNAMIC_VARIABLES = [
  { tag: '{{groom_name}}', label: 'Groom Name', icon: '🤵' },
  { tag: '{{bride_name}}', label: 'Bride Name', icon: '👰' },
  { tag: '{{wedding_date}}', label: 'Wedding Date', icon: '📅' },
  { tag: '{{wedding_time}}', label: 'Muhurtham Time', icon: '⏰' },
  { tag: '{{reception_time}}', label: 'Reception Time', icon: '🍸' },
  { tag: '{{venue_name}}', label: 'Venue Name', icon: '🏰' },
  { tag: '{{venue_address}}', label: 'Venue Address', icon: '📍' },
  { tag: '{{rsvp_phone}}', label: 'RSVP Phone', icon: '📞' },
  { tag: '{{host_family}}', label: 'Host Family', icon: '👨‍👩‍👧‍👦' },
  { tag: '{{blessing_deity}}', label: 'Deity Blessing', icon: '🕉' },
];

const TEXT_PRESETS: Array<{
  blockType: TextBlockType;
  label: string;
  lang: 'en' | 'kn' | 'hi' | 'te';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontColor: string;
  textAlign: 'left' | 'center' | 'right';
  description: string;
}> = [
  // English Presets
  {
    blockType: 'invocation',
    label: 'Deity Blessing Header',
    lang: 'en',
    description: 'Header invocation blessing',
    content: '{{blessing_deity}}',
    fontFamily: 'Playfair Display',
    fontSize: 13,
    fontWeight: '600',
    fontColor: '#5C1A1A',
    textAlign: 'center',
  },
  {
    blockType: 'parent_names',
    label: 'Host Family Invitation',
    lang: 'en',
    description: 'Parents & family host text',
    content: '{{host_family}}\nsolicit your gracious presence on the auspicious occasion of the wedding of',
    fontFamily: 'Playfair Display',
    fontSize: 13,
    fontWeight: '500',
    fontColor: '#3A2010',
    textAlign: 'center',
  },
  {
    blockType: 'couple_names',
    label: 'Bride & Groom Dynamic Names',
    lang: 'en',
    description: 'Dynamic bride & groom names',
    content: '{{groom_name}}\n&\n{{bride_name}}',
    fontFamily: 'Great Vibes',
    fontSize: 36,
    fontWeight: '400',
    fontColor: '#7B1E1E',
    textAlign: 'center',
  },
  {
    blockType: 'event_details',
    label: 'Muhurtham & Timings',
    lang: 'en',
    description: 'Date, time, lagna variables',
    content: 'Muhurtham\n{{wedding_date}}\n{{wedding_time}}\n\nReception\n{{reception_time}}',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    fontColor: '#7B1E1E',
    textAlign: 'center',
  },
  {
    blockType: 'venue',
    label: 'Venue Location Block',
    lang: 'en',
    description: 'Venue hall name & full address',
    content: 'Venue\n{{venue_name}}\n{{venue_address}}',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    fontColor: '#5C1A1A',
    textAlign: 'center',
  },

  // Kannada Script Presets 🇮🇳
  {
    blockType: 'invocation',
    label: 'ಶ್ರೀ ಲಕ್ಷ್ಮೀ ನರಸಿಂಹ ಪ್ರಸನ್ನ',
    lang: 'kn',
    description: 'ಕನ್ನಡ ದೇವತಾ ಪ್ರಾರ್ಥನೆ',
    content: '|| ಶ್ರೀ ಲಕ್ಷ್ಮೀ ನರಸಿಂಹ ಸ್ವಾಮಿ ಪ್ರಸನ್ನ ||',
    fontFamily: 'Noto Serif Kannada',
    fontSize: 14,
    fontWeight: '600',
    fontColor: '#5C1A1A',
    textAlign: 'center',
  },
  {
    blockType: 'couple_names',
    label: 'ವರ & ವಧು ದಂಪತಿ ಹೆಸರು (ಕನ್ನಡ)',
    lang: 'kn',
    description: 'ಕನ್ನಡ ವಧು ವರರ ಹೆಸರುಗಳು',
    content: '{{groom_name}}\nಮತ್ತು\n{{bride_name}}',
    fontFamily: 'Noto Serif Kannada',
    fontSize: 28,
    fontWeight: '700',
    fontColor: '#7B1E1E',
    textAlign: 'center',
  },
  {
    blockType: 'event_details',
    label: 'ಮಂಗಳ ಮುಹೂರ್ತ (ಕನ್ನಡ)',
    lang: 'kn',
    description: 'ಕನ್ನಡ ದಿನಾಂಕ & ಮುಹೂರ್ತ ವಿವರ',
    content: 'ಮಂಗಳ ಮುಹೂರ್ತ\n{{wedding_date}}\n{{wedding_time}}',
    fontFamily: 'Baloo Tamma 2',
    fontSize: 14,
    fontWeight: '600',
    fontColor: '#3A2010',
    textAlign: 'center',
  },
];

const FONTS = [
  { name: 'Playfair Display', script: 'Serif' },
  { name: 'Great Vibes', script: 'Calligraphy' },
  { name: 'Cormorant Garamond', script: 'Classic Serif' },
  { name: 'Cinzel', script: 'Royal Caps' },
  { name: 'Dancing Script', script: 'Casual Script' },
  { name: 'Lora', script: 'Book Serif' },
  { name: 'Inter', script: 'Sans' },
  { name: 'Noto Serif Kannada', script: 'ಕನ್ನಡ Serif' },
  { name: 'Baloo Tamma 2', script: 'ಕನ್ನಡ Rounded' },
  { name: 'Noto Sans Kannada', script: 'ಕನ್ನಡ Sans' },
  { name: 'Noto Serif Devanagari', script: 'हिंदी / संस्कृत' },
  { name: 'Noto Sans Telugu', script: 'తెలుగు' },
];

export const TextPanel: React.FC = () => {
  const { activePageId, addTextBlock, showToast } = useStudioStore();
  const [selectedLang, setSelectedLang] = useState<'all' | 'en' | 'kn' | 'hi' | 'te'>('all');

  const filteredPresets = selectedLang === 'all'
    ? TEXT_PRESETS
    : TEXT_PRESETS.filter(p => p.lang === selectedLang);

  const handleAddPreset = (preset: typeof TEXT_PRESETS[number]) => {
    const block: Omit<TextBlock, 'id'> = {
      blockType: preset.blockType,
      name: preset.label,
      content: preset.content,
      language: preset.lang,
      x: 60,
      y: 120,
      width: 440,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      fontStyle: 'normal',
      fontColor: preset.fontColor,
      textAlign: preset.textAlign,
      lineHeight: 1.6,
      letterSpacing: 0,
      locked: false,
      visible: true,
    };
    addTextBlock(activePageId, block);
    showToast(`Added ${preset.label}`);
  };

  const handleAddVariableTag = (varObj: typeof DYNAMIC_VARIABLES[number]) => {
    const block: Omit<TextBlock, 'id'> = {
      blockType: 'free',
      name: varObj.label,
      content: varObj.tag,
      language: 'en',
      x: 100,
      y: 180,
      width: 360,
      fontFamily: 'Playfair Display',
      fontSize: 16,
      fontWeight: '600',
      fontStyle: 'normal',
      fontColor: '#7B1E1E',
      textAlign: 'center',
      lineHeight: 1.5,
      letterSpacing: 0,
      locked: false,
      visible: true,
    };
    addTextBlock(activePageId, block);
    showToast(`Added Variable Tag ${varObj.tag}`);
  };

  return (
    <div className="p-3 space-y-4 flex flex-col h-full overflow-y-auto">
      {/* 1. Dynamic Variable Tags Inserter */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center justify-between" style={{ color: '#7a7068' }}>
          <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> Dynamic RSVP / Customer Tags</span>
        </div>
        <p className="text-xs mb-2 leading-relaxed" style={{ color: '#5a5048' }}>
          Click any tag to place dynamic customer variables. Auto-replaces during print generation.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {DYNAMIC_VARIABLES.map(v => (
            <button
              key={v.tag}
              onClick={() => handleAddVariableTag(v)}
              className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-amber-600/60 text-[10px] font-semibold flex items-center gap-1 text-neutral-200 transition-all hover:scale-105"
              title={`Insert ${v.tag}`}
            >
              <span>{v.icon}</span>
              <span>{v.label}</span>
              <span className="text-[9px] text-amber-500 font-mono opacity-80">{v.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Text Block Presets & Script Filter */}
      <div className="pt-3" style={{ borderTop: '1px solid #2a2520' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#7a7068' }}>Typography Presets</div>

        {/* Script Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 no-scrollbar">
          {[
            { id: 'all', label: 'All Scripts' },
            { id: 'en', label: 'English 🇬🇧' },
            { id: 'kn', label: 'ಕನ್ನಡ 🇮🇳' },
            { id: 'hi', label: 'हिंदी 🕉' },
          ].map(lang => (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(lang.id as any)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 transition-all"
              style={{
                background: selectedLang === lang.id ? '#C9956C' : '#141414',
                color: selectedLang === lang.id ? '#111' : '#7a7068',
                border: '1px solid ' + (selectedLang === lang.id ? '#C9956C' : '#2a2520'),
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {filteredPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleAddPreset(preset)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-colors group"
              style={{ background: '#161616', border: '1px solid #2a2520' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#C9956C', e.currentTarget.style.background = '#1e1a16')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2520', e.currentTarget.style.background = '#161616')}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: '#c8bfb0' }}>{preset.label}</span>
                <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#C9956C' }} />
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#5a5048' }}>{preset.description}</div>
              <div className="text-xs mt-1 truncate font-mono" style={{ fontFamily: preset.fontFamily, color: preset.fontColor, fontSize: Math.min(preset.fontSize, 12) }}>
                {preset.content.split('\n')[0]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Font Library */}
      <div className="pt-3" style={{ borderTop: '1px solid #2a2520' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#7a7068' }}>Multilingual Font Library</div>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
          {FONTS.map(f => (
            <div key={f.name} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800">
              <span style={{ fontFamily: f.name, fontSize: 13, color: '#c8bfb0' }}>{f.name}</span>
              <span className="text-[10px] text-neutral-500 font-mono">{f.script}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextPanel;
