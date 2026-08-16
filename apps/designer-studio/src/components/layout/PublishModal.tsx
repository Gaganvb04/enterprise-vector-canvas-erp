import React, { useState } from 'react';
import { X, Send, ShieldCheck, Tag, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose }) => {
  const {
    version, designerNotes, priceTier, eventType,
    documentName, pages, publishTemplate,
  } = useStudioStore();

  const [versionTag, setVersionTag] = useState(version || 'v1.0');
  const [notes, setNotes] = useState(designerNotes || 'Production ready invitation template.');
  const [selectedTier, setSelectedTier] = useState<'Standard' | 'Premium' | 'Luxury'>(priceTier || 'Premium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const totalElements = pages.reduce((acc, p) => acc + p.elements.length, 0);
  const totalTextBlocks = pages.reduce((acc, p) => acc + p.textBlocks.length, 0);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    publishTemplate(versionTag, notes, selectedTier);
    setIsSubmitting(false);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border"
        style={{ background: '#161616', borderColor: '#2a2520', color: '#e8e0d8' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#2a2520' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Publish Template & Version Control</h3>
              <p className="text-xs text-neutral-400">Make template available for production & customer portal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handlePublish} className="p-5 space-y-4 text-xs">
          {successMsg ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
              <h4 className="text-base font-bold text-emerald-400">Template Published Successfully!</h4>
              <p className="text-neutral-400 text-xs max-w-xs">
                Version <span className="text-amber-500 font-bold">{versionTag}</span> has been frozen and pushed to the Customer Portal & Print ERP.
              </p>
            </div>
          ) : (
            <>
              {/* Document Summary Card */}
              <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-500 text-xs">{documentName}</span>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Category: <span className="text-neutral-200 font-medium">{eventType}</span> — 5 Artboard Pages
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block">Objects</span>
                  <span className="font-semibold text-neutral-300">{totalElements} elements, {totalTextBlocks} text</span>
                </div>
              </div>

              {/* Version & Tier Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-300 mb-1 flex items-center gap-1">
                    <Tag className="h-3 w-3 text-amber-500" /> Version Tag
                  </label>
                  <input
                    type="text"
                    value={versionTag}
                    onChange={e => setVersionTag(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg outline-none font-mono text-xs"
                    style={{ background: '#111', border: '1px solid #2a2520', color: '#e8e0d8' }}
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-300 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Pricing Tier
                  </label>
                  <select
                    value={selectedTier}
                    onChange={e => setSelectedTier(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg outline-none text-xs"
                    style={{ background: '#111', border: '1px solid #2a2520', color: '#e8e0d8' }}
                  >
                    <option value="Standard">Standard (₹125/card)</option>
                    <option value="Premium">Premium (₹180/card)</option>
                    <option value="Luxury">Luxury (₹250/card)</option>
                  </select>
                </div>
              </div>

              {/* Designer Notes */}
              <div>
                <label className="font-semibold text-neutral-300 mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-amber-500" /> Designer Release Notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg outline-none text-xs leading-relaxed"
                  style={{ background: '#111', border: '1px solid #2a2520', color: '#e8e0d8' }}
                  placeholder="Summarize changes, foil requirements, or special font instructions..."
                />
              </div>

              {/* Enterprise Business Rule Notice */}
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Publishing marks this template as <span className="font-bold text-amber-400">PRINT_APPROVED</span>.
                  Future edits will branch into a new version to preserve backward compatibility for active customer orders.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg hover:scale-105"
                  style={{ background: '#C9956C', color: '#fff' }}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? 'Publishing...' : 'Publish Template'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default PublishModal;
