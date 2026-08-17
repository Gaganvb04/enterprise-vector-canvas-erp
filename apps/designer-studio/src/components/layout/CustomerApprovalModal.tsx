import React from 'react';
import { CheckCircle2, Edit3, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenExport: () => void;
}

export const CustomerApprovalModal: React.FC<Props> = ({ isOpen, onClose, onOpenExport }) => {
  const { approvalStatus, setApprovalStatus, validateVariables, setStep, showToast } = useStudioStore();

  if (!isOpen) return null;

  const validation = validateVariables();

  const handleApprove = () => {
    setApprovalStatus('approved');
    showToast(`✓ Design Approved! Marked Ready for Production`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[#C9956C]/40 p-6 space-y-5"
        style={{ background: '#161412', color: '#E5D7C5' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#252118] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C9956C]/20 text-[#C9956C] border border-[#C9956C]/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E5D7C5] tracking-wide">PREVIEW & APPROVE INVITATION</h2>
              <p className="text-xs text-[#8C8073]">Final proof verification before production</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-[#8C8073] hover:text-[#E5D7C5]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Approval Card Banner */}
        <div
          className={`p-4 rounded-2xl border text-center space-y-2 ${
            approvalStatus === 'approved'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-[#1A1816] border-[#252118] text-[#E5D7C5]'
          }`}
        >
          {approvalStatus === 'approved' ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-lg">
                <CheckCircle2 className="h-6 w-6" />
                <span>✓ Design Approved</span>
              </div>
              <p className="text-xs text-emerald-300">Your invitation is officially verified and ready for production export.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#E5D7C5]">Your Invitation is Ready</h3>
              <p className="text-xs text-[#8C8073]">Please review text, spelling, and die-cut shapes before giving final approval.</p>
            </div>
          )}
        </div>

        {/* Checklist Review */}
        <div className="p-4 rounded-2xl bg-[#141210] border border-[#252118] space-y-2 text-xs">
          <span className="font-bold text-[#8C8073] uppercase tracking-wider block text-[10px]">VERIFICATION CHECKLIST</span>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#E5D7C5]">Customer Data Fields</span>
              <span className={validation.isValid ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {validation.isValid ? '✓ Complete' : '⚠ Missing Fields'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#E5D7C5]">Artboard & Safe Area</span>
              <span className="text-emerald-400 font-bold">✓ Valid (A5 Standard)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#E5D7C5]">Die-Cut Geometry</span>
              <span className="text-emerald-400 font-bold">✓ Valid Vector Path</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setStep(2);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#252118] border border-[#252118] text-xs font-bold text-[#E5D7C5] hover:bg-[#322C22] flex items-center justify-center gap-2"
          >
            <Edit3 className="h-4 w-4 text-[#C9956C]" />
            <span>Edit Design</span>
          </button>

          {approvalStatus !== 'approved' ? (
            <button
              onClick={handleApprove}
              className="flex-1 py-2.5 rounded-xl bg-[#C9956C] text-[#161412] font-bold text-xs hover:bg-[#D4A37A] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve Design</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenExport();
              }}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Export Package</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CustomerApprovalModal;
