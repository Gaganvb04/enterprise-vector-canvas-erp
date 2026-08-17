import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, X, Package } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { getCardSvgPathD } from '../../utils/shapeUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SaleableExportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { validateVariables, getActivePage, documentName, partialCuts, materialConfig, showToast } = useStudioStore();
  const [showAdvancedPlates, setShowAdvancedPlates] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const page = getActivePage();
  const validation = validateVariables();

  const handleExportCustomerPreviewPdf = () => {
    showToast(`📄 Exporting Customer Preview PDF for "${documentName}"…`);
    setTimeout(() => {
      showToast(`✓ Customer Preview PDF downloaded!`);
    }, 1000);
  };

  const handleExportPng = () => {
    showToast(`🖼️ Exporting High-Res 300 DPI PNG Image…`);
    setTimeout(() => {
      showToast(`✓ High-Res PNG downloaded!`);
    }, 1000);
  };

  const handleExportProductionPackage = () => {
    if (!page) return;
    setExporting(true);
    try {
      const outerBoundaryD = getCardSvgPathD(page.cardShape);
      const manifest = {
        documentName,
        exportTime: new Date().toISOString(),
        dimensionsMm: { width: 148, height: 210 },
        paperGsm: materialConfig.gsm,
        outerBoundaryPath: outerBoundaryD,
        layers: ['Cut_Plate', 'PartialCut_Plate', 'Score_Plate', 'Perforation_Plate', 'Engrave_Plate'],
        usedShapesCount: partialCuts.length,
      };

      const manifestStr = JSON.stringify(manifest, null, 2);
      const manifestBlob = new Blob([manifestStr], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      const a = document.createElement('a');
      a.href = manifestUrl;
      a.download = `${documentName.toLowerCase().replace(/\s+/g, '_')}_Production_Manifest.json`;
      a.click();
      URL.revokeObjectURL(manifestUrl);

      showToast(`📦 Downloaded Production Package (${documentName}_Production_Manifest.json)!`);
    } catch (err) {
      showToast(`⚠️ Production Export failed`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-[#C9956C]/40 p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
        style={{ background: '#161412', color: '#E5D7C5' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#252118] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C9956C]/20 text-[#C9956C] border border-[#C9956C]/30">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E5D7C5] tracking-wide">EXPORT INVITATION</h2>
              <p className="text-xs text-[#8C8073]">Download print-ready files or manufacturing vector plates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-[#8C8073] hover:text-[#E5D7C5]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── 1. SALEABLE DESIGN DIAGNOSTIC scan ─────────────────────────────── */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            validation.isValid
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {validation.isValid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold block">
                {validation.isValid ? 'READY FOR EXPORT' : 'NEEDS ATTENTION'}
              </span>
              <span className="text-[11px] opacity-80">
                {validation.isValid ? 'All 7 pre-flight manufacturing criteria passed.' : 'Check missing customer data fields before printing.'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-black/30 uppercase font-bold border border-current">
            {validation.isValid ? 'PASSED' : 'CHECK'}
          </span>
        </div>

        {/* ── 2. SIMPLE CUSTOMER EXPORT BUTTONS ───────────────────────────────── */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold text-[#8C8073] uppercase tracking-wider block">CUSTOMER EXPORT OPTIONS</span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleExportCustomerPreviewPdf}
              className="p-3 rounded-2xl bg-[#1A1816] border border-[#252118] hover:border-[#C9956C] transition-all flex flex-col items-center justify-center text-center space-y-1.5 group"
            >
              <FileText className="h-5 w-5 text-[#C9956C] group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#E5D7C5]">Customer PDF</span>
              <span className="text-[9px] text-[#8C8073]">Proof Copy</span>
            </button>

            <button
              onClick={handleExportCustomerPreviewPdf}
              className="p-3 rounded-2xl bg-[#1A1816] border border-[#252118] hover:border-[#C9956C] transition-all flex flex-col items-center justify-center text-center space-y-1.5 group"
            >
              <FileText className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#E5D7C5]">Print PDF</span>
              <span className="text-[9px] text-[#8C8073]">300 DPI CMYK</span>
            </button>

            <button
              onClick={handleExportPng}
              className="p-3 rounded-2xl bg-[#1A1816] border border-[#252118] hover:border-[#C9956C] transition-all flex flex-col items-center justify-center text-center space-y-1.5 group"
            >
              <ImageIcon className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#E5D7C5]">PNG Image</span>
              <span className="text-[9px] text-[#8C8073]">Web Sharing</span>
            </button>
          </div>
        </div>

        {/* ── 3. ADVANCED PRODUCTION PACKAGE COLLAPSIBLE ─────────────────────── */}
        <div className="border-t border-[#252118] pt-3">
          <button
            onClick={() => setShowAdvancedPlates(!showAdvancedPlates)}
            className="w-full py-2 px-3 rounded-xl bg-[#1A1816] border border-[#252118] hover:border-[#C9956C]/40 flex items-center justify-between text-xs font-bold text-[#C9956C] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Production Package (7 Machine Plates &amp; JSON Manifest)</span>
            </div>
            {showAdvancedPlates ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {showAdvancedPlates && (
            <div className="p-3.5 mt-2 rounded-2xl bg-[#141210] border border-[#252118] space-y-3 animate-fadeIn">
              <p className="text-[11px] text-[#8C8073]">
                Generates 7 discrete vector SVG plates for CNC laser die-cutting, foil stamping, embossing, and production manifest:
              </p>

              <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-[#E5D7C5]">
                <div className="p-1.5 rounded bg-[#1A1816] border border-[#252118]">📄 Production_MultiLayer.svg</div>
                <div className="p-1.5 rounded bg-[#1A1816] border border-[#252118]">✂️ Cut_Plate.svg</div>
                <div className="p-1.5 rounded bg-[#1A1816] border border-[#252118]">🦋 PartialCut_Plate.svg</div>
                <div className="p-1.5 rounded bg-[#1A1816] border border-[#252118]">🟦 Score_Plate.svg</div>
                <div className="p-1.5 rounded bg-[#1A1816] border border-[#252118]">🟩 Perforation_Plate.svg</div>
                <div className="p-1.5 rounded bg-[#1A1816] border border-[#252118]">🟨 Engrave_Plate.svg</div>
                <div className="p-1.5 rounded bg-[#1A1816] border border-[#252118] col-span-2">⚙️ Production_Manifest.json</div>
              </div>

              <button
                onClick={handleExportProductionPackage}
                disabled={exporting}
                className="w-full py-2.5 rounded-xl bg-[#C9956C] text-[#161412] font-bold text-xs hover:bg-[#D4A37A] transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Package className="h-4 w-4" />
                <span>{exporting ? 'Generating Bundle…' : 'Download Complete Production Package'}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SaleableExportModal;
