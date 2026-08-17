import React, { useState } from 'react';
import { UserCheck, Sparkles, Upload, CheckCircle2, AlertCircle, Eye, Send, ArrowRight, Lock, Download } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { downloadCustomerProofPdf } from '../../utils/generateCustomerProofPdf';
import { CustomerPhotoCropModal } from './CustomerPhotoCropModal';

interface Props {
  onOpenPreview: () => void;
}

export const CustomerPersonalizationPanel: React.FC<Props> = ({ onOpenPreview }) => {
  const {
    pages,
    activePageId,
    customerVariables,
    updateVariableValue,
    customerSubmissionStatus,
    setCustomerSubmissionStatus,
    showToast,
    updateElement,
    documentName
  } = useStudioStore();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState<{ elementId: string; src: string } | null>(null);

  // Handle Image Upload with Crop Modal
  const handleImageUploadWithCrop = (e: React.ChangeEvent<HTMLInputElement>, elementId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setPendingCropImage({ elementId, src });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (croppedSrc: string) => {
    if (!pendingCropImage) return;
    const pageId = activePageId || pages[0]?.id;
    if (pageId) {
      updateElement(pageId, pendingCropImage.elementId, { src: croppedSrc });
      showToast(`✓ Photo cropped & placed on invitation!`);
    }
    setCropModalOpen(false);
    setPendingCropImage(null);
  };

  // Collect all customer-editable text blocks across all pages
  const editableTextBlocks = pages.flatMap(p =>
    p.textBlocks.filter(tb => tb.editableByCustomer || tb.isCustomizable)
  );

  // Collect all customer-editable image elements across all pages
  const editableImageElements = pages.flatMap(p =>
    p.elements.filter(el => (el.editableByCustomer || (el as any).isCustomizable) && el.type === 'image')
  );

  const completedCount = editableTextBlocks.filter(tb => {
    if (tb.variableKey) {
      const val = customerVariables[tb.variableKey];
      return val && val.value && val.value.trim().length > 0;
    }
    return tb.content && tb.content.trim().length > 0;
  }).length;

  const totalCount = editableTextBlocks.length + editableImageElements.length;

  const handleFieldChange = (key: string, value: string, blockId?: string) => {
    if (key) {
      updateVariableValue(key, value);
    }
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy[key || blockId || ''];
      return copy;
    });
  };

  const handleSubmitForApproval = () => {
    const errors: Record<string, string> = {};
    editableTextBlocks.forEach(tb => {
      const key = tb.variableKey;
      if (key) {
        const val = customerVariables[key]?.value;
        if (!val || !val.trim()) {
          errors[key] = `Please enter ${customerVariables[key]?.label || tb.name}`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast(`⚠ Please fill in all required personalization fields.`);
      return;
    }

    setCustomerSubmissionStatus('submitted');
    showToast(`🎉 Invitation submitted for designer approval!`);
  };

  return (
    <div className="w-full max-w-md bg-[#161412] border-r border-[#252118] flex flex-col h-full flex-shrink-0 select-none overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Panel Header */}
      <div className="space-y-2 border-b border-[#252118] pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9956C] px-2 py-0.5 rounded-full bg-[#C9956C]/10 border border-[#C9956C]/30 flex items-center gap-1.5">
            <UserCheck className="h-3 w-3" /> CUSTOMER PERSONALIZATION MODE
          </span>
          <span className="text-xs font-mono text-[#8C8073]">
            {completedCount}/{totalCount} Completed
          </span>
        </div>
        <h2 className="text-xl font-serif font-bold text-[#E5D7C5]">
          Personalize Your Invitation
        </h2>
        <p className="text-xs text-[#8C8073]">
          Fill in your wedding event details below. The invitation preview on the right updates instantly in real time.
        </p>
      </div>

      {/* Submitted Status Notification Banner */}
      {customerSubmissionStatus === 'submitted' && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>Submitted for Designer Approval</span>
          </div>
          <p className="text-[#E5D7C5]">
            Your invitation proof has been submitted to Rooted Memoirs Studio. Our design team will review your proof and send your final high-resolution print files.
          </p>
        </div>
      )}

      {/* Editable Fields Form */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C8073] flex items-center justify-between">
          <span>Personalization Details</span>
          <span className="text-[10px] text-[#C9956C] font-normal flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Live Updates Enabled
          </span>
        </h3>

        {editableTextBlocks.length === 0 && editableImageElements.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#1A1816] border border-[#252118] text-center text-xs text-[#8C8073]">
            No customer-editable fields configured for this invitation design template yet.
          </div>
        ) : (
          editableTextBlocks.map(tb => {
            const varKey = tb.variableKey;
            const varDef = varKey ? customerVariables[varKey] : null;
            const label = varDef?.label || tb.name || 'Personalization Field';
            const value = varKey ? (customerVariables[varKey]?.value || '') : tb.content;
            const error = varKey ? validationErrors[varKey] : null;

            return (
              <div key={tb.id} className="space-y-1.5 p-3 rounded-xl bg-[#1A1816] border border-[#252118] focus-within:border-[#C9956C] transition-all">
                <label className="text-xs font-semibold text-[#E5D7C5] flex items-center justify-between">
                  <span>{label}</span>
                  {varDef?.category && (
                    <span className="text-[9px] uppercase tracking-wider text-[#8C8073] font-mono">
                      {varDef.category}
                    </span>
                  )}
                </label>

                {tb.content.includes('\n') || (varDef && varDef.value.length > 40) ? (
                  <textarea
                    rows={2}
                    value={value}
                    onChange={e => handleFieldChange(varKey || '', e.target.value, tb.id)}
                    placeholder={`Enter ${label.toLowerCase()}…`}
                    className="w-full bg-[#141210] text-[#E5D7C5] text-xs px-3 py-2 rounded-lg outline-none border border-[#252118] focus:border-[#C9956C] transition-colors"
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={e => handleFieldChange(varKey || '', e.target.value, tb.id)}
                    placeholder={`Enter ${label.toLowerCase()}…`}
                    className="w-full bg-[#141210] text-[#E5D7C5] text-xs px-3 py-2 rounded-lg outline-none border border-[#252118] focus:border-[#C9956C] transition-colors"
                  />
                )}

                {error && (
                  <span className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {error}
                  </span>
                )}
              </div>
            );
          })
        )}

        {/* Customer Image Upload Inputs */}
        {editableImageElements.map(el => (
          <div key={el.id} className="p-3 rounded-xl bg-[#1A1816] border border-[#252118] space-y-2">
            <label className="text-xs font-semibold text-[#E5D7C5] flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 text-[#C9956C]" />
              <span>Customer Photo / Logo</span>
            </label>
            <div className="flex items-center gap-3">
              {el.src && (
                <img src={el.src} alt="Uploaded Photo" className="w-12 h-12 rounded-lg object-cover border border-[#C9956C]" />
              )}
              <label className="flex-1 px-3 py-2 rounded-lg bg-[#252118] text-[#C9956C] hover:bg-[#322C22] cursor-pointer text-xs font-bold text-center border border-[#C9956C]/40 transition-colors">
                Choose Image File
                <input type="file" accept="image/*" onChange={e => handleImageUploadWithCrop(e, el.id)} className="hidden" />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Protected Template Guarantee Notice */}
      <div className="p-3 rounded-xl bg-[#1A1816]/60 border border-[#252118] flex items-center gap-2.5 text-[11px] text-[#8C8073]">
        <Lock className="h-4 w-4 text-[#C9956C] flex-shrink-0" />
        <span>Template layout, die-cut vector shapes, and background motifs are protected by the designer.</span>
      </div>

      {/* Primary Action Buttons */}
      <div className="pt-4 border-t border-[#252118] space-y-2">
        <button
          onClick={onOpenPreview}
          className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#252118] text-[#E5D7C5] hover:bg-[#322C22] border border-[#252118] flex items-center justify-center gap-2 transition-all"
        >
          <Eye className="h-4 w-4 text-[#C9956C]" />
          <span>Preview Full Invitation</span>
        </button>

        <button
          onClick={() => downloadCustomerProofPdf(pages, customerVariables, documentName)}
          className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#252118] text-[#E5D7C5] hover:bg-[#322C22] border border-[#252118] flex items-center justify-center gap-2 transition-all"
        >
          <Download className="h-4 w-4 text-[#C9956C]" />
          <span>Download Customer Proof PDF</span>
        </button>

        <button
          onClick={handleSubmitForApproval}
          disabled={customerSubmissionStatus === 'submitted'}
          className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
            customerSubmissionStatus === 'submitted'
              ? 'bg-emerald-800/50 text-emerald-200 cursor-not-allowed border border-emerald-600/40'
              : 'bg-[#C9956C] text-[#161412] hover:bg-[#D4A37A]'
          }`}
        >
          {customerSubmissionStatus === 'submitted' ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>✓ Submitted for Approval</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit for Designer Approval</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Photo Crop Modal */}
      <CustomerPhotoCropModal
        isOpen={cropModalOpen}
        imageSrc={pendingCropImage?.src || ''}
        onConfirm={handleCropConfirm}
        onCancel={() => {
          setCropModalOpen(false);
          setPendingCropImage(null);
        }}
      />
    </div>
  );
};

export default CustomerPersonalizationPanel;
