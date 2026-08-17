import React, { useState } from 'react';
import {
  Type, Sparkles, Languages, Heading1, Heading2, AlignLeft,
  Search, Wand2
} from 'lucide-react';
import { useStudioStore, type TextBlock, type TextBlockType } from '../../store/studioStore';

type Tab = 'presets' | 'variables' | 'fonts';

const DYNAMIC_VARIABLES = [
  { tag: '{{groom_name}}', label: 'Groom Name', icon: '🤵', category: 'Couple' },
  { tag: '{{bride_name}}', label: 'Bride Name', icon: '👰', category: 'Couple' },
  { tag: '{{wedding_date}}', label: 'Wedding Date', icon: '📅', category: 'Event' },
  { tag: '{{wedding_time}}', label: 'Muhurtham Time', icon: '⏰', category: 'Event' },
  { tag: '{{reception_time}}', label: 'Reception Time', icon: '🍸', category: 'Event' },
  { tag: '{{venue_name}}', label: 'Venue Name', icon: '🏰', category: 'Venue' },
  { tag: '{{venue_address}}', label: 'Venue Address', icon: '📍', category: 'Venue' },
  { tag: '{{rsvp_phone}}', label: 'RSVP Contact', icon: '📞', category: 'RSVP' },
  { tag: '{{host_family}}', label: 'Host Family', icon: '👨‍👩‍👧‍👦', category: 'Family' },
  { tag: '{{blessing_deity}}', label: 'Deity Blessing', icon: '🕉', category: 'Blessing' },
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
    label: 'Deity Invocation Header',
    lang: 'en',
    description: 'Header invocation blessing line',
    content: '|| {{blessing_deity}} ||',
    fontFamily: 'Playfair Display',
    fontSize: 14,
    fontWeight: '600',
    fontColor: '#7B1E1E',
    textAlign: 'center',
  },
  {
    blockType: 'couple_names',
    label: 'Bride & Groom Calligraphy',
    lang: 'en',
    description: 'Royal script bride & groom names',
    content: '{{groom_name}}\n&\n{{bride_name}}',
    fontFamily: 'Great Vibes',
    fontSize: 38,
    fontWeight: '400',
    fontColor: '#7B1E1E',
    textAlign: 'center',
  },
  {
    blockType: 'parent_names',
    label: 'Host Family Honor Block',
    lang: 'en',
    description: 'Parents & family invitation host text',
    content: '{{host_family}}\nsolicit your gracious presence on the auspicious occasion of the wedding of',
    fontFamily: 'Cormorant Garamond',
    fontSize: 13,
    fontWeight: '500',
    fontColor: '#3A2010',
    textAlign: 'center',
  },
  {
    blockType: 'event_details',
    label: 'Muhurtham & Timings',
    lang: 'en',
    description: 'Auspicious date, time & lagna details',
    content: 'Auspicious Muhurtham\n{{wedding_date}}\n{{wedding_time}}\n\nReception\n{{reception_time}}',
    fontFamily: 'Cinzel',
    fontSize: 13,
    fontWeight: '600',
    fontColor: '#5C1A1A',
    textAlign: 'center',
  },
  {
    blockType: 'venue',
    label: 'Venue & Address Block',
    lang: 'en',
    description: 'Venue hall name & full address',
    content: 'Venue\n{{venue_name}}\n{{venue_address}}',
    fontFamily: 'Lora',
    fontSize: 13,
    fontWeight: '500',
    fontColor: '#3A2010',
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
    fontColor: '#7B1E1E',
    textAlign: 'center',
  },
  {
    blockType: 'couple_names',
    label: 'ವರ & ವಧು ದಂಪತಿ ಹೆಸರು',
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
    label: 'ಮಂಗಳ ಮುಹೂರ್ತ ವಿವರ',
    lang: 'kn',
    description: 'ಕನ್ನಡ ದಿನಾಂಕ & ಮುಹೂರ್ತ ಸಮಯ',
    content: 'ಮಂಗಳ ಮುಹೂರ್ತ\n{{wedding_date}}\n{{wedding_time}}',
    fontFamily: 'Baloo Tamma 2',
    fontSize: 14,
    fontWeight: '600',
    fontColor: '#3A2010',
    textAlign: 'center',
  },

  // Hindi / Sanskrit Presets 🕉
  {
    blockType: 'invocation',
    label: '।। श्री गणेशाय नमः ।।',
    lang: 'hi',
    description: 'देवनागरी मङ्गलाचरणम्',
    content: '।। श्री गणेशाय नमः ।।',
    fontFamily: 'Noto Serif Devanagari',
    fontSize: 15,
    fontWeight: '700',
    fontColor: '#7B1E1E',
    textAlign: 'center',
  },
  {
    blockType: 'couple_names',
    label: 'वर एवं वधू (हिन्दी)',
    lang: 'hi',
    description: 'वर वधू परिणय सूत्र नाम',
    content: '{{groom_name}}\nसंग\n{{bride_name}}',
    fontFamily: 'Noto Serif Devanagari',
    fontSize: 28,
    fontWeight: '700',
    fontColor: '#7B1E1E',
    textAlign: 'center',
  },
];

const FONTS = [
  { name: 'Playfair Display', script: 'Serif (Classic)', sample: 'Sublime Luxury Elegance' },
  { name: 'Great Vibes', script: 'Calligraphy', sample: 'Groom & Bride Names' },
  { name: 'Cormorant Garamond', script: 'Royal Serif', sample: 'Solicit your gracious presence' },
  { name: 'Cinzel', script: 'Royal Caps', sample: 'WEDDING INVITATION' },
  { name: 'Dancing Script', script: 'Casual Script', sample: 'Together with their families' },
  { name: 'Lora', script: 'Book Serif', sample: 'Auspicious Muhurtham' },
  { name: 'Inter', script: 'Modern Sans', sample: 'Venue & Address Details' },
  { name: 'Noto Serif Kannada', script: 'ಕನ್ನಡ Serif', sample: 'ಶ್ರೀ ಮಂಜುನಾಥ ಪ್ರಸನ್ನ' },
  { name: 'Baloo Tamma 2', script: 'ಕನ್ನಡ Rounded', sample: 'ಮಂಗಳ ಮುಹೂರ್ತ ದಿನಾಂಕ' },
  { name: 'Noto Sans Kannada', script: 'ಕನ್ನಡ Sans', sample: 'ಶುಭ ವಿವಾಹ ಆಹ್ವಾನ' },
  { name: 'Noto Serif Devanagari', script: 'हिंदी / संस्कृत', sample: '।। श्री गणेशाय नमः ।।' },
  { name: 'Noto Sans Telugu', script: 'తెలుగు Sans', sample: 'శ్రీ లక్ష్మీ ప్రసన్న' },
];

export const TextPanel: React.FC = () => {
  const { activePageId, addTextBlock, showToast } = useStudioStore();
  const [activeTab, setActiveTab] = useState<Tab>('presets');
  const [selectedLang, setSelectedLang] = useState<'all' | 'en' | 'kn' | 'hi'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPresets = selectedLang === 'all'
    ? TEXT_PRESETS
    : TEXT_PRESETS.filter(p => p.lang === selectedLang);

  const filteredFonts = searchQuery.trim()
    ? FONTS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.script.toLowerCase().includes(searchQuery.toLowerCase()))
    : FONTS;

  const handleAddQuickText = (type: 'heading' | 'subheading' | 'body') => {
    const configs = {
      heading: { name: 'Main Heading', content: 'Wedding Invitation', fontSize: 32, fontWeight: '700', fontFamily: 'Playfair Display', color: '#7B1E1E' },
      subheading: { name: 'Subheading', content: 'Together with their families', fontSize: 16, fontWeight: '600', fontFamily: 'Cormorant Garamond', color: '#3A2010' },
      body: { name: 'Body Text', content: 'Solicit your gracious presence on the auspicious occasion', fontSize: 13, fontWeight: '400', fontFamily: 'Lora', color: '#5C1A1A' },
    };

    const c = configs[type];
    const block: Omit<TextBlock, 'id'> = {
      blockType: 'free',
      name: c.name,
      content: c.content,
      language: 'en',
      x: 60,
      y: type === 'heading' ? 140 : type === 'subheading' ? 200 : 250,
      width: 440,
      fontFamily: c.fontFamily,
      fontSize: c.fontSize,
      fontWeight: c.fontWeight,
      fontStyle: 'normal',
      fontColor: c.color,
      textAlign: 'center',
      lineHeight: 1.5,
      letterSpacing: 0,
      locked: false,
      visible: true,
    };

    addTextBlock(activePageId, block);
    showToast(`✦ Added ${c.name} to Card Page`);
  };

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
    showToast(`✦ Added "${preset.label}" to Card Page`);
  };

  const handleAddVariableTag = (varObj: typeof DYNAMIC_VARIABLES[number]) => {
    const rawKey = varObj.tag.replace(/[{}]/g, '').trim();
    const block: Omit<TextBlock, 'id'> = {
      blockType: 'free',
      name: `${varObj.label} Variable`,
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
      variableKey: rawKey,
      isCustomizable: true,
      editableByCustomer: true,
    };

    addTextBlock(activePageId, block);
    showToast(`✦ Inserted Dynamic Variable ${varObj.tag}`);
  };

  const handleAddFontSpecimen = (fontName: string) => {
    const block: Omit<TextBlock, 'id'> = {
      blockType: 'free',
      name: `${fontName} Text`,
      content: 'Sample Invitation Text',
      language: 'en',
      x: 60,
      y: 200,
      width: 440,
      fontFamily: fontName,
      fontSize: 22,
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
    showToast(`✦ Added text block in "${fontName}"`);
  };

  return (
    <div className="h-full flex flex-col bg-[#161412] text-[#E5D7C5] text-xs select-none">

      {/* ── 1. PANEL HEADER ─────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-[#252118] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-[#C9956C]" />
            <h2 className="font-bold text-sm text-[#E5D7C5] tracking-wide">Typography & Text Tools</h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#252118] text-[#8C8073] font-mono">
            Multilingual
          </span>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={() => handleAddQuickText('heading')}
            className="p-2 rounded-xl bg-[#1a1816] border border-[#252118] hover:border-[#C9956C]/60 hover:bg-[#221e1a] text-center transition-all group"
            title="Add Main Heading (32px Playfair)"
          >
            <Heading1 className="h-4 w-4 mx-auto mb-1 text-[#C9956C] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[10px] text-[#E5D7C5] block truncate">+ Heading</span>
          </button>

          <button
            onClick={() => handleAddQuickText('subheading')}
            className="p-2 rounded-xl bg-[#1a1816] border border-[#252118] hover:border-[#C9956C]/60 hover:bg-[#221e1a] text-center transition-all group"
            title="Add Subheading (16px Garamond)"
          >
            <Heading2 className="h-4 w-4 mx-auto mb-1 text-[#C9956C] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[10px] text-[#E5D7C5] block truncate">+ Subhead</span>
          </button>

          <button
            onClick={() => handleAddQuickText('body')}
            className="p-2 rounded-xl bg-[#1a1816] border border-[#252118] hover:border-[#C9956C]/60 hover:bg-[#221e1a] text-center transition-all group"
            title="Add Body Text (13px Lora)"
          >
            <AlignLeft className="h-4 w-4 mx-auto mb-1 text-[#C9956C] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[10px] text-[#E5D7C5] block truncate">+ Body</span>
          </button>
        </div>
      </div>

      {/* ── 2. SUB-TAB SEGMENTED NAVIGATION ─────────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-1 border-b border-[#252118]">
        <div className="grid grid-cols-3 p-1 rounded-xl bg-[#141210] border border-[#252118] text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'presets'
                ? 'bg-[#C9956C] text-[#161412] shadow-md'
                : 'text-[#8C8073] hover:text-[#E5D7C5]'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('variables')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'variables'
                ? 'bg-[#C9956C] text-[#161412] shadow-md'
                : 'text-[#8C8073] hover:text-[#E5D7C5]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Variables</span>
          </button>

          <button
            onClick={() => setActiveTab('fonts')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'fonts'
                ? 'bg-[#C9956C] text-[#161412] shadow-md'
                : 'text-[#8C8073] hover:text-[#E5D7C5]'
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            <span>Fonts</span>
          </button>
        </div>
      </div>

      {/* ── 3. MAIN CONTENT VIEW ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">

        {/* ── TAB 1: TYPOGRAPHY PRESETS ─────────────────────────────────────── */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            {/* Script Language Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
              {[
                { id: 'all', label: 'All Scripts' },
                { id: 'en', label: 'English 🇬🇧' },
                { id: 'kn', label: 'ಕನ್ನಡ 🇮🇳' },
                { id: 'hi', label: 'हिंदी 🕉' },
              ].map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLang(lang.id as any)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                    selectedLang === lang.id
                      ? 'bg-[#C9956C] text-[#161412] font-bold'
                      : 'bg-[#1a1816] text-[#8C8073] hover:text-[#E5D7C5] border border-[#252118]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              {filteredPresets.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAddPreset(preset)}
                  className="group p-3 rounded-xl bg-[#1a1816] border border-[#252118] hover:border-[#C9956C]/60 hover:bg-[#221e1a] transition-all cursor-pointer space-y-1.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#E5D7C5] group-hover:text-amber-300 transition-colors">
                      {preset.label}
                    </span>
                    <button
                      className="px-2 py-0.5 rounded bg-[#C9956C] text-[#161412] font-bold text-[10px] group-hover:bg-[#D4A37A] transition-colors"
                      title="Apply preset to card page"
                    >
                      + Add
                    </button>
                  </div>

                  <p className="text-[10px] text-[#8C8073]">{preset.description}</p>

                  <div
                    className="p-2 rounded-lg bg-[#12100e] border border-[#252118] text-center font-mono truncate"
                    style={{
                      fontFamily: preset.fontFamily,
                      color: preset.fontColor,
                      fontSize: Math.min(preset.fontSize, 14),
                    }}
                  >
                    {preset.content.split('\n')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: DYNAMIC CUSTOMER VARIABLES ─────────────────────────────── */}
        {activeTab === 'variables' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-[#C9956C]/30 text-[11px] text-amber-200 leading-relaxed">
              <strong>✨ Dynamic RSVP & Customer Tags:</strong> Insert smart tags that automatically populate custom names, dates & venues during live print runs.
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DYNAMIC_VARIABLES.map(v => (
                <div
                  key={v.tag}
                  onClick={() => handleAddVariableTag(v)}
                  className="group p-2.5 rounded-xl bg-[#1a1816] border border-[#252118] hover:border-[#C9956C]/60 hover:bg-[#221e1a] transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-base">{v.icon}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#252118] text-amber-400 font-mono">
                      {v.category}
                    </span>
                  </div>
                  <span className="font-bold text-xs text-[#E5D7C5] block truncate">{v.label}</span>
                  <span className="text-[10px] text-amber-500 font-mono block truncate">{v.tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: MULTILINGUAL FONT CATALOG ─────────────────────────────── */}
        {activeTab === 'fonts' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8C8073]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search font family or script..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#141210] border border-[#252118] text-xs outline-none text-[#E5D7C5] placeholder-[#6b6055] focus:border-[#C9956C]"
              />
            </div>

            {/* Font Specimen Cards */}
            <div className="space-y-2">
              {filteredFonts.map(f => (
                <div
                  key={f.name}
                  onClick={() => handleAddFontSpecimen(f.name)}
                  className="group p-3 rounded-xl bg-[#1a1816] border border-[#252118] hover:border-[#C9956C]/60 hover:bg-[#221e1a] transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#E5D7C5]">{f.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#252118] text-[#8C8073] font-mono">
                      {f.script}
                    </span>
                  </div>

                  <div
                    className="text-sm font-semibold truncate pt-1"
                    style={{ fontFamily: f.name, color: '#C9956C' }}
                  >
                    {f.sample}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TextPanel;
