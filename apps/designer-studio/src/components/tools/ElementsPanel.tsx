import React, { useState } from 'react';
import { Search, GripVertical } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import type { DesignElement } from '../../store/studioStore';

// ─── Built-in SVG Elements ────────────────────────────────────────────────────
// These are inline SVG strings matching what's visible in the reference photos

const ELEMENTS: Array<Omit<DesignElement, 'id' | 'x' | 'y' | 'rotation' | 'opacity' | 'blendMode' | 'flipH' | 'flipV' | 'locked' | 'visible'>> = [
  // ── Florals (1-20)
  {
    elementId: 'floral-rose-cluster-pink',
    name: 'Pink Rose Cluster',
    category: 'floral',
    width: 180, height: 160,
    src: `<svg viewBox="0 0 180 160" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="80" r="35" fill="#E8A0A0" opacity="0.8"/>
      <circle cx="60" cy="80" r="22" fill="#D47878" opacity="0.9"/>
      <circle cx="60" cy="80" r="12" fill="#C05060"/>
      <circle cx="105" cy="65" r="28" fill="#DDA0B8" opacity="0.85"/>
      <circle cx="105" cy="65" r="18" fill="#CC8098" opacity="0.9"/>
      <circle cx="105" cy="65" r="10" fill="#B8607A"/>
      <circle cx="135" cy="95" r="22" fill="#F0B8C0" opacity="0.8"/>
      <ellipse cx="45" cy="115" rx="20" ry="12" fill="#A8C888" opacity="0.7"/>
      <ellipse cx="90" cy="125" rx="25" ry="10" fill="#90B870" opacity="0.6"/>
    </svg>`,
  },
  {
    elementId: 'floral-rose-cluster-purple',
    name: 'Purple Floral Cluster',
    category: 'floral',
    width: 160, height: 140,
    src: `<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="70" r="30" fill="#C8A0D8" opacity="0.8"/>
      <circle cx="50" cy="70" r="18" fill="#B080C0" opacity="0.9"/>
      <circle cx="95" cy="55" r="25" fill="#E0C0E8" opacity="0.8"/>
      <circle cx="120" cy="85" r="20" fill="#B890D0" opacity="0.75"/>
      <ellipse cx="40" cy="100" rx="18" ry="10" fill="#8BAA6A" opacity="0.65"/>
    </svg>`,
  },
  {
    elementId: 'floral-white-blooms',
    name: 'White Blossoms',
    category: 'floral',
    width: 150, height: 130,
    src: `<svg viewBox="0 0 150 130" xmlns="http://www.w3.org/2000/svg">
      <circle cx="55" cy="65" r="28" fill="#F5F0EC" stroke="#E0D8D0" strokeWidth="1"/>
      <circle cx="55" cy="65" r="16" fill="#EDE8E4"/>
      <circle cx="55" cy="65" r="8" fill="#E8C880"/>
      <circle cx="95" cy="50" r="22" fill="#F8F5F2" stroke="#E8E0D8" strokeWidth="1"/>
      <ellipse cx="35" cy="95" rx="20" ry="11" fill="#A0BB80" opacity="0.6"/>
    </svg>`,
  },
  {
    elementId: 'floral-sacred-lotus-gold',
    name: 'Golden Lotus Blossom',
    category: 'floral',
    width: 120, height: 100,
    src: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 10 C45 35 30 60 60 85 C90 60 75 35 60 10 Z" fill="none" stroke="#D4AF37" strokeWidth="2"/>
      <path d="M60 25 C40 45 20 65 60 85 C100 65 80 45 60 25 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5"/>
      <path d="M60 40 C35 55 10 70 60 85 C110 70 85 55 60 40 Z" fill="none" stroke="#D4AF37" strokeWidth="1"/>
    </svg>`,
  },
  {
    elementId: 'floral-jasmine-garland',
    name: 'Jasmine Garland Arch',
    category: 'floral',
    width: 200, height: 80,
    src: `<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 40 Q 100 0 190 40" fill="none" stroke="#8A9A5B" strokeWidth="2"/>
      <circle cx="30" cy="25" r="8" fill="#FFFDF4" stroke="#D4AF37" strokeWidth="1"/>
      <circle cx="60" cy="15" r="9" fill="#FFFDF4" stroke="#D4AF37" strokeWidth="1"/>
      <circle cx="100" cy="10" r="10" fill="#FFFDF4" stroke="#D4AF37" strokeWidth="1.2"/>
      <circle cx="140" cy="15" r="9" fill="#FFFDF4" stroke="#D4AF37" strokeWidth="1"/>
      <circle cx="170" cy="25" r="8" fill="#FFFDF4" stroke="#D4AF37" strokeWidth="1"/>
    </svg>`,
  },
  {
    elementId: 'floral-marigold-burst',
    name: 'Marigold Mandala Burst',
    category: 'floral',
    width: 120, height: 120,
    src: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="45" fill="none" stroke="#FF9900" strokeWidth="2" strokeDasharray="6 3"/>
      <circle cx="60" cy="60" r="32" fill="none" stroke="#FFCC00" strokeWidth="2"/>
      <circle cx="60" cy="60" r="18" fill="#FF8800"/>
    </svg>`,
  },
  {
    elementId: 'floral-botanical-branch',
    name: 'Gold Botanical Branch',
    category: 'floral',
    width: 140, height: 140,
    src: `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 130 Q 70 70 130 10" fill="none" stroke="#C9956C" strokeWidth="2"/>
      <ellipse cx="40" cy="90" rx="14" ry="7" fill="none" stroke="#C9956C" strokeWidth="1.5" transform="rotate(-45 40 90)"/>
      <ellipse cx="70" cy="60" rx="14" ry="7" fill="none" stroke="#C9956C" strokeWidth="1.5" transform="rotate(-45 70 60)"/>
      <ellipse cx="100" cy="30" rx="14" ry="7" fill="none" stroke="#C9956C" strokeWidth="1.5" transform="rotate(-45 100 30)"/>
    </svg>`,
  },
  {
    elementId: 'floral-laurel-wreath',
    name: 'Royal Laurel Wreath',
    category: 'floral',
    width: 150, height: 150,
    src: `<svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <path d="M 75 135 C 30 135 15 90 25 45 C 30 25 45 15 65 15" fill="none" stroke="#D4AF37" strokeWidth="2"/>
      <path d="M 75 135 C 120 135 135 90 125 45 C 120 25 105 15 85 15" fill="none" stroke="#D4AF37" strokeWidth="2"/>
    </svg>`,
  },
  {
    elementId: 'floral-vintage-peony',
    name: 'Vintage Peony Motif',
    category: 'floral',
    width: 140, height: 140,
    src: `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <circle cx="70" cy="70" r="40" fill="#E8B0C0" opacity="0.6"/>
      <circle cx="70" cy="70" r="28" fill="#D48098" opacity="0.7"/>
      <circle cx="70" cy="70" r="16" fill="#C05070"/>
    </svg>`,
  },

  // ── Deity & Heritage (21-40)
  {
    elementId: 'deity-ganesha-gold-emblem',
    name: 'Lord Ganesha Royal Emblem',
    category: 'deity',
    width: 90, height: 110,
    src: `<svg viewBox="0 0 90 110" xmlns="http://www.w3.org/2000/svg">
      <path d="M 45 15 Q 25 25 25 45 Q 25 65 45 75 Q 65 65 65 45 Q 65 25 45 15 Z" fill="none" stroke="#D4AF37" strokeWidth="2"/>
      <path d="M 45 30 Q 30 45 45 95 C 55 95 60 80 50 70" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="45" cy="20" r="3" fill="#D4AF37"/>
    </svg>`,
  },
  {
    elementId: 'deity-kalash-sacred',
    name: 'Sacred Mangal Kalash',
    category: 'deity',
    width: 80, height: 100,
    src: `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 50 Q 10 70 40 90 Q 70 70 60 50 Z" fill="none" stroke="#D4AF37" strokeWidth="2"/>
      <ellipse cx="40" cy="48" rx="20" ry="6" fill="none" stroke="#D4AF37" strokeWidth="1.5"/>
      <circle cx="40" cy="30" r="14" fill="none" stroke="#D4AF37" strokeWidth="2"/>
    </svg>`,
  },
  {
    elementId: 'deity-swastik-gold',
    name: 'Auspicious Swastika',
    category: 'deity',
    width: 70, height: 70,
    src: `<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
      <path d="M 35 10 L 35 60 M 10 35 L 60 35 M 35 10 L 50 10 M 60 35 L 60 50 M 35 60 L 20 60 M 10 35 L 10 20" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="22" cy="22" r="2.5" fill="#D4AF37"/>
      <circle cx="48" cy="22" r="2.5" fill="#D4AF37"/>
      <circle cx="22" cy="48" r="2.5" fill="#D4AF37"/>
      <circle cx="48" cy="48" r="2.5" fill="#D4AF37"/>
    </svg>`,
  },
  {
    elementId: 'deity-om-sacred',
    name: 'Sacred Om Emblem',
    category: 'deity',
    width: 80, height: 80,
    src: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="none" stroke="#D4AF37" strokeWidth="2"/>
      <text x="40" y="52" fontFamily="serif" fontSize="38" textAnchor="middle" fill="#D4AF37" fontWeight="bold">ॐ</text>
    </svg>`,
  },
  {
    elementId: 'deity-royal-elephant',
    name: 'Royal Procession Elephant',
    category: 'deity',
    width: 120, height: 90,
    src: `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 60 C 10 30 40 10 70 20 C 90 20 105 35 100 55 C 95 70 85 80 75 80" fill="none" stroke="#C9956C" strokeWidth="2.5"/>
    </svg>`,
  },
  {
    elementId: 'deity-bride-silhouette',
    name: 'Bride Silhouette',
    category: 'deity',
    width: 60, height: 100,
    src: `<svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="12" rx="10" ry="11" fill="#7B3B3B" opacity="0.85"/>
      <path d="M20 23 Q15 35 15 55 Q15 65 20 70 L25 65 L30 70 L35 65 L40 70 Q45 65 45 55 Q45 35 40 23 Z" fill="#8B4040" opacity="0.8"/>
    </svg>`,
  },
  {
    elementId: 'deity-groom-silhouette',
    name: 'Groom Silhouette',
    category: 'deity',
    width: 60, height: 100,
    src: `<svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="12" rx="9" ry="10" fill="#5C3A1E" opacity="0.85"/>
      <path d="M15 23 L13 75 L28 75 L30 45 L32 75 L47 75 L45 23 Z" fill="#6B4428" opacity="0.8"/>
    </svg>`,
  },
  {
    elementId: 'deity-wedding-lamp',
    name: 'Wedding Lamp (Diya)',
    category: 'deity',
    width: 50, height: 70,
    src: `<svg viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 45 Q10 45 8 55 L42 55 Q40 45 30 45 Z" fill="#C8901A"/>
      <path d="M22 30 Q20 20 25 15 Q30 20 28 30 Q26 35 25 44 Z" fill="#FF8800"/>
    </svg>`,
  },

  // ── Frames & Borders (41-70)
  {
    elementId: 'frame-ornate-circle-gold',
    name: 'Ornate Circle Frame',
    category: 'frame',
    width: 120, height: 120,
    src: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="none" stroke="#D4AF37" strokeWidth="3"/>
      <circle cx="60" cy="60" r="48" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 3"/>
      <circle cx="60" cy="60" r="42" fill="none" stroke="#D4AF37" strokeWidth="2"/>
    </svg>`,
  },
  {
    elementId: 'frame-hexagonal-gold',
    name: 'Geometric Hexagon Frame',
    category: 'frame',
    width: 130, height: 130,
    src: `<svg viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
      <polygon points="65,5 120,35 120,95 65,125 10,95 10,35" fill="none" stroke="#D4AF37" strokeWidth="2"/>
      <polygon points="65,12 113,38 113,92 65,118 17,92 17,38" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 2"/>
    </svg>`,
  },
  {
    elementId: 'frame-baroque-crest',
    name: 'Baroque Royal Crest Frame',
    category: 'frame',
    width: 140, height: 160,
    src: `<svg viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="120" height="140" rx="20" fill="none" stroke="#C9956C" strokeWidth="2"/>
      <rect x="16" y="16" width="108" height="128" rx="14" fill="none" stroke="#C9956C" strokeWidth="1" strokeDasharray="3 2"/>
    </svg>`,
  },
  {
    elementId: 'border-corner-floral',
    name: 'Corner Floral TL',
    category: 'border',
    width: 140, height: 120,
    src: `<svg viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5 L5 60" stroke="#C9956C" strokeWidth="2"/>
      <path d="M5 5 L60 5" stroke="#C9956C" strokeWidth="2"/>
      <circle cx="20" cy="20" r="12" fill="#E8A0A0" opacity="0.7"/>
    </svg>`,
  },

  // ── Dividers & Badges (71-100+)
  {
    elementId: 'divider-floral-line',
    name: 'Floral Line Divider',
    category: 'divider',
    width: 300, height: 20,
    src: `<svg viewBox="0 0 300 20" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="10" x2="115" y2="10" stroke="#C9956C" strokeWidth="1"/>
      <circle cx="150" cy="10" r="6" fill="#C9956C"/>
      <line x1="185" y1="10" x2="300" y2="10" stroke="#C9956C" strokeWidth="1"/>
    </svg>`,
  },
  {
    elementId: 'divider-swirl',
    name: 'Royal Swirl Divider',
    category: 'divider',
    width: 280, height: 24,
    src: `<svg viewBox="0 0 280 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12 Q50 2 100 12 Q140 22 180 12 Q230 2 270 12" fill="none" stroke="#D4AF37" strokeWidth="1.5"/>
    </svg>`,
  },
  {
    elementId: 'divider-gold-triple',
    name: 'Gold Triple Line Divider',
    category: 'divider',
    width: 300, height: 12,
    src: `<svg viewBox="0 0 300 12" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="3" x2="300" y2="3" stroke="#D4AF37" strokeWidth="1"/>
      <line x1="0" y1="6" x2="300" y2="6" stroke="#D4AF37" strokeWidth="1.8"/>
      <line x1="0" y1="9" x2="300" y2="9" stroke="#D4AF37" strokeWidth="1"/>
    </svg>`,
  },
  {
    elementId: 'badge-wedding-invitation',
    name: 'Wedding Invitation Badge',
    category: 'badge',
    width: 140, height: 50,
    src: `<svg viewBox="0 0 140 50" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="136" height="46" rx="23" fill="none" stroke="#D4AF37" strokeWidth="2"/>
      <text x="70" y="28" fontFamily="Playfair Display, serif" fontSize="11" fontWeight="700" textAnchor="middle" fill="#D4AF37" letterSpacing="3">INVITATION</text>
    </svg>`,
  },
  {
    elementId: 'badge-wax-monogram-seal',
    name: 'Wax Monogram Seal',
    category: 'badge',
    width: 90, height: 90,
    src: `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <circle cx="45" cy="45" r="40" fill="#7B1E1E" stroke="#D4AF37" strokeWidth="2"/>
      <circle cx="45" cy="45" r="32" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3 2"/>
      <text x="45" y="52" fontFamily="serif" fontSize="22" fontWeight="bold" textAnchor="middle" fill="#D4AF37">RM</text>
    </svg>`,
  },
  {
    elementId: 'badge-save-the-date',
    name: 'Save The Date Emblem',
    category: 'badge',
    width: 130, height: 55,
    src: `<svg viewBox="0 0 130 55" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="126" height="51" fill="none" stroke="#C9956C" strokeWidth="1.5"/>
      <text x="65" y="24" fontFamily="serif" fontSize="10" textAnchor="middle" fill="#C9956C" letterSpacing="2">SAVE THE DATE</text>
    </svg>`,
  },
];

// ─── Elements Panel ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'floral', label: 'Florals 🌸' },
  { id: 'deity', label: 'Deities 🔱' },
  { id: 'frame', label: 'Frames 🖼' },
  { id: 'badge', label: 'Badges 🎖' },
  { id: 'divider', label: 'Dividers ✒' },
  { id: 'border', label: 'Borders 💠' },
];

export const ElementsPanel: React.FC = () => {
  const { activePageId, addElement, showToast } = useStudioStore();
  const [cat, setCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = ELEMENTS.filter(e => {
    const matchesCat = cat === 'all' || e.category === cat;
    const matchesSearch = searchQuery === '' || e.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAdd = (el: typeof ELEMENTS[number]) => {
    addElement(activePageId, {
      ...el,
      x: 180,
      y: 240,
      rotation: 0,
      opacity: 1,
      blendMode: 'normal',
      flipH: false,
      flipV: false,
      locked: false,
      visible: true,
    });
    showToast(`Added ${el.name} to design`);
  };

  const handleDragStart = (e: React.DragEvent, el: typeof ELEMENTS[number]) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'element', element: el }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="p-3 space-y-3 flex flex-col h-full">
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7a7068' }}>
        Design Elements ({ELEMENTS.length})
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 focus-within:border-amber-600/60">
        <Search className="h-3.5 w-3.5 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search stickers & emblems..."
          className="w-full bg-transparent text-xs text-neutral-200 outline-none placeholder:text-neutral-500"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar flex-shrink-0">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 transition-all"
            style={{
              background: cat === c.id ? '#C9956C' : '#141414',
              color: cat === c.id ? '#111' : '#7a7068',
              border: '1px solid ' + (cat === c.id ? '#C9956C' : '#2a2520'),
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Element grid */}
      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-0.5">
        {filtered.map(el => (
          <div
            key={el.elementId}
            draggable
            onDragStart={e => handleDragStart(e, el)}
            onClick={() => handleAdd(el)}
            className="element-card p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 hover:border-amber-600 cursor-grab active:cursor-grabbing group relative transition-all"
            title={`Click or drag to add ${el.name}`}
          >
            <div
              className="w-full aspect-square flex items-center justify-center p-1"
              dangerouslySetInnerHTML={{
                __html: el.src.includes('<svg')
                  ? el.src
                  : `<img src="${el.src}" style="width:100%;height:100%;object-fit:contain" />`
              }}
            />
            <div className="text-center mt-1 truncate" style={{ fontSize: 9, color: '#a89880', lineHeight: 1.2 }}>
              {el.name}
            </div>

            {/* Drag Handle Indicator */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-0.5 rounded text-amber-500">
              <GripVertical className="h-3 w-3" />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-center text-neutral-500 pt-1 border-t border-neutral-800">
        ✦ Click or <span className="text-amber-500 font-bold">Drag & Drop</span> onto canvas
      </p>
    </div>
  );
};

export default ElementsPanel;
