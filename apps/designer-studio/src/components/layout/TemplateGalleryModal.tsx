import React, { useState } from 'react';
import { Sparkles, Heart, X, FilePlus, ArrowRight } from 'lucide-react';
import { STARTER_TEMPLATES, type StarterTemplate } from '../../data/starterTemplates';
import { useStudioStore } from '../../store/studioStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'ALL', label: 'All Templates' },
  { id: 'Wedding', label: 'Wedding' },
  { id: 'Engagement', label: 'Engagement' },
  { id: 'Reception', label: 'Reception' },
  { id: 'Birthday', label: 'Birthday' },
  { id: 'Baby Shower', label: 'Baby Shower' },
  { id: 'Housewarming', label: 'Housewarming' },
  { id: 'Anniversary', label: 'Anniversary' },
  { id: 'Naming Ceremony', label: 'Naming' },
  { id: 'Traditional', label: 'Traditional' },
  { id: 'Minimal', label: 'Minimal' },
  { id: 'Luxury', label: 'Luxury' },
  { id: 'Floral', label: 'Floral' },
  { id: 'Indian Traditional', label: 'Indian Traditional' },
];

export const TemplateGalleryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createNewDesign, setDocumentName, loadStarterTemplate, showToast } = useStudioStore();
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(['tmpl-royal-floral']);

  if (!isOpen) return null;

  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavoriteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredTemplates = STARTER_TEMPLATES.filter(t => {
    if (selectedCat === 'ALL') return true;
    return t.category === selectedCat || t.style.toLowerCase().includes(selectedCat.toLowerCase());
  });

  const handleSelectTemplate = (template: StarterTemplate) => {
    loadStarterTemplate(template);
    showToast(`✨ Loaded template "${template.name}"`);
    onClose();
  };

  const handleStartBlank = () => {
    createNewDesign();
    setDocumentName('Untitled Invitation');
    showToast(`✦ Started Blank Canvas`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-[#C9956C]/30 flex flex-col max-h-[90vh]"
        style={{ background: '#161412', color: '#E5D7C5' }}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#252118] bg-[#1A1816] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#C9956C]" />
              <h2 className="text-xl font-bold text-[#E5D7C5] tracking-wide">CREATE YOUR INVITATION</h2>
            </div>
            <p className="text-xs text-[#8C8073] mt-1">Choose a professionally designed vector template or start from scratch.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartBlank}
              className="px-4 py-2 rounded-xl bg-[#252118] border border-[#252118] text-xs font-bold text-[#E5D7C5] hover:bg-[#322C22] hover:border-[#C9956C] transition-all flex items-center gap-2"
            >
              <FilePlus className="h-4 w-4 text-[#C9956C]" />
              <span>Start Blank</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[#252118] text-[#8C8073] hover:text-[#E5D7C5]">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="px-6 py-3 border-b border-[#252118] bg-[#141210] flex items-center gap-2 overflow-x-auto custom-scrollbar flex-shrink-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCat === cat.id
                  ? 'bg-[#C9956C] text-[#161412] border-[#C9956C] shadow-md'
                  : 'bg-[#1A1816] text-[#8C8073] border-[#252118] hover:text-[#E5D7C5]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid Container */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTemplates.map(template => {
              const isFav = favoriteIds.includes(template.id);

              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group rounded-2xl bg-[#1A1816] border border-[#252118] hover:border-[#C9956C] p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:shadow-[#C9956C]/10 cursor-pointer relative"
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between z-10 mb-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#141210]/80 text-[#C9956C] font-mono border border-[#252118]">
                      {template.category} • {template.pageCount} {template.pageCount === 1 ? 'Page' : 'Pages'}
                    </span>
                    <button
                      onClick={e => toggleFav(e, template.id)}
                      className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
                        isFav ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-[#141210]/60 text-[#8C8073] border-[#252118] hover:text-rose-400'
                      }`}
                    >
                      <Heart className="h-3.5 w-3.5 fill-current" />
                    </button>
                  </div>

                  {/* SVG Card Thumbnail */}
                  <div className="w-full h-64 rounded-xl overflow-hidden bg-[#141210] border border-[#252118] p-2 flex items-center justify-center relative group-hover:scale-[1.02] transition-transform duration-300">
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: template.previewSvg }} />
                  </div>

                  {/* Template Meta Info */}
                  <div className="mt-3 space-y-1.5">
                    <h3 className="font-bold text-sm text-[#E5D7C5] group-hover:text-[#C9956C] transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-[11px] text-[#8C8073] line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>

                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full mt-2 py-2 rounded-xl bg-[#252118] group-hover:bg-[#C9956C] text-[#E5D7C5] group-hover:text-[#161412] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TemplateGalleryModal;
