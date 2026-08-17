import React, { useState } from 'react';
import { UserCheck, CheckCircle2, AlertTriangle, X, MessageSquare } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DesignerReviewModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    customerVariables,
    customerSubmissionStatus,
    setCustomerSubmissionStatus,
    approvalStatus,
    setApprovalStatus,
    designerReviewNotes,
    setDesignerReviewNotes,
    showToast,
    documentName,
  } = useStudioStore();

  const [message, setMessage] = useState(designerReviewNotes || '');

  if (!isOpen) return null;

  const handleApprove = () => {
    setCustomerSubmissionStatus('approved');
    setApprovalStatus('approved');
    showToast(`✓ Customer submission approved! Ready for production.`);
    onClose();
  };

  const handleRequestChanges = () => {
    setCustomerSubmissionStatus('changes_requested');
    setDesignerReviewNotes(message);
    showToast(`✉ Requested changes sent to customer.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border p-6 space-y-5 text-xs select-none"
        style={{ background: '#161412', borderColor: '#252118', color: '#E5D7C5' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#252118' }}>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#C9956C]" />
            <div>
              <h3 className="font-serif font-bold text-base text-[#E5D7C5]">
                Designer Review — Customer Submission
              </h3>
              <span className="text-[10px] text-[#8C8073]">Document: {documentName}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#8C8073] hover:text-[#E5D7C5]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Submission Status Pill */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#1A1816] border border-[#252118]">
          <span className="text-xs text-[#8C8073]">Submission Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            customerSubmissionStatus === 'approved' || approvalStatus === 'approved'
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
              : customerSubmissionStatus === 'submitted'
              ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
              : customerSubmissionStatus === 'changes_requested'
              ? 'bg-red-950/60 text-red-400 border border-red-500/40'
              : 'bg-[#252118] text-[#8C8073]'
          }`}>
            {customerSubmissionStatus.replace('_', ' ')}
          </span>
        </div>

        {/* Customer Data Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#8C8073] uppercase tracking-wider">
            Submitted Customer Personalization Data
          </h4>
          <div className="p-3 rounded-xl bg-[#1A1816] border border-[#252118] space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {Object.entries(customerVariables).map(([key, v]) => (
              <div key={key} className="flex items-center justify-between text-xs py-1 border-b border-[#252118]/50 last:border-0">
                <span className="text-[#8C8073] font-medium">{v.label}:</span>
                <span className="font-bold text-[#C9956C] font-mono">{v.value || '(Empty)'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change Request Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#8C8073] flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#C9956C]" />
            <span>Designer Review Notes / Change Request Message</span>
          </label>
          <textarea
            rows={2}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type notes or change request details for customer…"
            className="w-full bg-[#1A1816] text-[#E5D7C5] text-xs p-3 rounded-xl outline-none border border-[#252118] focus:border-[#C9956C]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleRequestChanges}
            className="px-4 py-2.5 rounded-xl font-bold bg-[#252118] text-red-400 hover:bg-red-950/40 border border-red-500/30 flex items-center gap-1.5"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Request Changes</span>
          </button>
          <button
            type="button"
            onClick={handleApprove}
            className="px-5 py-2.5 rounded-xl font-bold bg-[#C9956C] text-[#161412] hover:bg-[#D4A37A] shadow-lg flex items-center gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Approve Submission</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignerReviewModal;
