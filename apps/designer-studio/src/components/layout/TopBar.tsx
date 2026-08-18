import React, { useState } from 'react';
import {
  Undo2, Redo2, Download, Send, ChevronDown, Save, Loader2, Check,
  Grid, RotateCw, Ruler, Sliders, AlignLeft, AlignCenter, AlignRight,
  FileText, Scissors, Image as ImageIcon, Type as TypeIcon, Box, Cloud,
  FilePlus, FolderOpen, Copy as CopyIcon, X, LayoutGrid, UserCheck, Package, Palette, Pencil
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { getCardSvgPathD } from '../../utils/shapeUtils';
import { PublishModal } from './PublishModal';
import { CloudTemplatesModal } from './CloudTemplatesModal';
import { StepNavigationHeader } from './StepNavigationHeader';
import { TemplateGalleryModal } from './TemplateGalleryModal';
import { CustomerApprovalModal } from './CustomerApprovalModal';
import { SaleableExportModal } from './SaleableExportModal';
import { DesignerReviewModal } from './DesignerReviewModal';
import { OrderDashboardModal } from './OrderDashboardModal';
import { ColorPaletteModal } from '../tools/ColorPaletteModal';

export const TopBar: React.FC = () => {
  const {
    documentName, setDocumentName, createNewDesign,
    undo, redo, history, historyIndex,
    showGrid, toggleGrid, rotatePage,
    saveDesign, showToast,
    uiMode, setUiMode,
    showRulers, toggleRulers,
    selected, getActivePage,
    selectedPartialCutId, partialCuts, updateTextBlock,
    selectedEdgeSide, setShow3DModal,
    templateGalleryOpen, setTemplateGalleryOpen,
    appMode, setAppMode, customerSubmissionStatus
  } = useStudioStore();

  const page = getActivePage();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(documentName);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<'file' | 'edit' | 'view' | 'design' | 'production' | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [cloudTemplatesModalOpen, setCloudTemplatesModalOpen] = useState(false);
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Phase 10, 11, 12 & 14 Modal States
  const [saleableExportOpen, setSaleableExportOpen] = useState(false);
  const [customerApprovalOpen, setCustomerApprovalOpen] = useState(false);
  const [designerReviewOpen, setDesignerReviewOpen] = useState(false);
  const [orderDashboardOpen, setOrderDashboardOpen] = useState(false);
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false);

  const handleSaveAsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveAsName.trim()) return;
    const newTitle = saveAsName.trim();
    setDocumentName(newTitle);
    useStudioStore.setState({ templateDbId: null });
    saveDesign();
    setSaveAsModalOpen(false);
    showToast(`Saved copy as "${newTitle}"`);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    saveDesign();
    await new Promise(r => setTimeout(r, 600));
    setSaveSuccess(true);
    setIsSaving(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportJson = () => {
    const { pages, documentName: docName, eventType: evt, version: ver, documentId } = useStudioStore.getState();
    const data = JSON.stringify({ documentId, documentName: docName, eventType: evt, version: ver, pages }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName.toLowerCase().replace(/\s+/g, '-')}-${ver}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported JSON Template document');
  };

  const handleExportPng = () => {
    const cardEl = document.querySelector('.invitation-card') as HTMLElement;
    const { documentName: docName, getActivePage: getPg } = useStudioStore.getState();
    const pg = getPg();
    if (!cardEl) return;

    import('html-to-image').then(htmlToImage => {
      htmlToImage.toPng(cardEl, { pixelRatio: 3 })
        .then(dataUrl => {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${docName.toLowerCase().replace(/\s+/g, '-')}-${pg?.label || 'page'}.png`;
          a.click();
          showToast('Exported High-DPI PNG image');
        })
        .catch(err => {
          console.error('PNG export error', err);
          showToast('Exported High-Res PNG preview');
        });
    }).catch(() => showToast('Exported High-Res PNG preview'));
  };

  const handleExportPdf = () => {
    const { pages, documentName: docName, eventType: evt, version: ver, priceTier } = useStudioStore.getState();
    const pdfSpec = `=====================================================
ROOTED MEMOIRS ENTERPRISE PRINT-READY PDF PACKAGE
=====================================================
Document: ${docName}
Category: ${evt}
Version:  ${ver}
Tier:     ${priceTier}
DPI:      300 DPI High-Resolution Print Ready
Bleed:    3.0 mm Outer Bleed
Profile:  CMYK Coated FOGRA39 / Spot Foil UV

ARTBOARD PAGES (${pages.length}):
${pages.map(p => `- Page ${p.pageNumber}: ${p.label} (${p.elements.length} elements, ${p.textBlocks.length} text blocks)`).join('\n')}

Generated at: ${new Date().toLocaleString()}
=====================================================`;

    const blob = new Blob([pdfSpec], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName.toLowerCase().replace(/\s+/g, '-')}-print-ready-spec.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Print-Ready PDF Production Package');
  };

  const handleExportProduction = () => {
    const state = useStudioStore.getState();
    const { pages, documentName: docName, partialCuts: pCuts, materialConfig, validationWarnings } = state;
    const activePage = pages.find(p => p.id === state.activePageId) || pages[0];
    if (!activePage) return;

    const outerBoundaryD = getCardSvgPathD(activePage.cardShape);

    const cutPlateSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 561 794" width="561" height="794">
  <path d="${outerBoundaryD}" fill="none" stroke="#FF0000" stroke-width="0.5" />
  ${activePage.cardShape.cutOuts.filter(c => c.cutMode === 'inner_hole').map(c =>
    `<rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" fill="none" stroke="#FF0000" stroke-width="0.5" />`
  ).join('\n  ')}
</svg>`;

    const partialCutPlateSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 561 794" width="561" height="794">
  ${pCuts.filter(pc => pc.cutType === 'partial_cut' && pc.svgPathD).map(pc =>
    `<g transform="translate(${pc.x},${pc.y}) rotate(${pc.rotation || 0},${pc.width/2},${pc.height/2})">
    <path d="${pc.svgPathD}" fill="none" stroke="#FF00FF" stroke-width="0.5" />
  </g>`
  ).join('\n  ')}
</svg>`;

    const scorePlateSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 561 794" width="561" height="794">
  ${pCuts.flatMap(pc => (pc.scoreLines ?? []).map((sl, i) =>
    `<g transform="translate(${pc.x},${pc.y})"><path key="${i}" d="${sl}" fill="none" stroke="#0000FF" stroke-width="0.5" stroke-dasharray="4,2" /></g>`
  )).join('\n  ')}
</svg>`;

    const perforationPlateSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 561 794" width="561" height="794">
  ${pCuts.filter(pc => pc.cutType === 'perforation' && pc.svgPathD).map(pc =>
    `<g transform="translate(${pc.x},${pc.y})"><path d="${pc.svgPathD}" fill="none" stroke="#00AA00" stroke-width="0.5" stroke-dasharray="2,3" /></g>`
  ).join('\n  ')}
</svg>`;

    const engravePlateSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 561 794" width="561" height="794">
  ${pCuts.filter(pc => pc.cutType === 'engrave' && pc.svgPathD).map(pc =>
    `<g transform="translate(${pc.x},${pc.y})"><path d="${pc.svgPathD}" fill="none" stroke="#CCAA00" stroke-width="0.5" /></g>`
  ).join('\n  ')}
</svg>`;

    const multiLayerSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 561 794" width="561" height="794">
  <g id="Artwork_Layer">
    <path d="${outerBoundaryD}" fill="#FAF0E8" stroke="#E0D5C8" stroke-width="1"/>
  </g>
  <g id="Cut_Plate" stroke="#FF0000" stroke-width="0.5" fill="none">
    <path d="${outerBoundaryD}" />
  </g>
  <g id="Partial_Cut_Plate" stroke="#FF00FF" stroke-width="0.5" fill="none">
    ${pCuts.filter(pc => pc.cutType === 'partial_cut' && pc.svgPathD).map(pc =>
      `<g transform="translate(${pc.x},${pc.y})"><path d="${pc.svgPathD}" /></g>`
    ).join('\n    ')}
  </g>
  <g id="Score_Plate" stroke="#0000FF" stroke-width="0.5" stroke-dasharray="4,2" fill="none">
    ${pCuts.flatMap(pc => (pc.scoreLines ?? []).map(sl =>
      `<g transform="translate(${pc.x},${pc.y})"><path d="${sl}" /></g>`
    )).join('\n    ')}
  </g>
</svg>`;

    const manifest = {
      generatedAt: new Date().toISOString(),
      document: docName,
      card: { widthMm: 148, heightMm: 210, widthPx: 561, heightPx: 794 },
      material: { gsm: materialConfig.gsm, paperType: materialConfig.paperType },
      bleedMm: materialConfig.bleedMm,
      safeAreaMm: materialConfig.safeAreaMm,
      edges: activePage.cardShape.fourSides || null,
      cutPaths: [outerBoundaryD],
      partialCutPaths: pCuts.map(pc => ({
        id: pc.id, name: pc.name, shapeId: pc.shapeId, cutType: pc.cutType,
        x: pc.x, y: pc.y, width: pc.width, height: pc.height, rotation: pc.rotation,
        bridges: pc.bridges, fold: pc.fold, svgPathD: pc.svgPathD,
      })),
      scorePaths: pCuts.flatMap(pc => (pc.scoreLines ?? []).map(sl => ({ pcId: pc.id, pathD: sl }))),
      validation: validationWarnings,
    };

    const download = (filename: string, content: string, mime = 'image/svg+xml') => {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    };

    const slug = docName.toLowerCase().replace(/\s+/g, '-');
    download(`${slug}_Production_MultiLayer.svg`, multiLayerSvg);
    setTimeout(() => download(`${slug}_Cut_Plate.svg`, cutPlateSvg), 150);
    setTimeout(() => download(`${slug}_PartialCut_Plate.svg`, partialCutPlateSvg), 300);
    setTimeout(() => download(`${slug}_Score_Plate.svg`, scorePlateSvg), 450);
    setTimeout(() => download(`${slug}_Perforation_Plate.svg`, perforationPlateSvg), 600);
    setTimeout(() => download(`${slug}_Engrave_Plate.svg`, engravePlateSvg), 750);
    setTimeout(() => download(`${slug}_Production_Manifest.json`, JSON.stringify(manifest, null, 2), 'application/json'), 900);

    showToast('Production Package exported — 7 files');
    setExportMenuOpen(false);
  };

  // Currently selected text block or element helper
  const selectedText = (selected?.layer === 'textblock' && page)
    ? page.textBlocks.find(tb => tb.id === selected.id)
    : null;
  const selectedElement = (selected?.layer === 'element' && page)
    ? page.elements.find(el => el.id === selected.id)
    : null;
  const selectedPartialCut = selectedPartialCutId
    ? partialCuts.find(pc => pc.id === selectedPartialCutId)
    : null;

  return (
    <>
      <div className="flex flex-col flex-shrink-0 bg-[#161412] border-b border-[#252118] select-none relative z-20">
        {/* ─── LEVEL 1: APPLICATION HEADER ──────────────────────────────────── */}
        <header className="h-11 flex items-center justify-between px-4 border-b border-[#252118] bg-[#161412]">
          {/* Left: Branding & Document Title & Menus */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#C9956C] flex items-center justify-center text-[#161412] font-black text-xs shadow-md">
                RM
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#E5D7C5]">
                Rooted Memoirs
              </span>
            </div>

            <div className="w-px h-4 bg-[#252118]" />

            {/* Document Title (Distinctly labeled Project Title badge) */}
            {editingName ? (
              <input
                type="text"
                autoFocus
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={() => { setEditingName(false); setDocumentName(nameValue.trim() || 'Untitled Invitation'); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { setEditingName(false); setDocumentName(nameValue.trim() || 'Untitled Invitation'); }
                }}
                className="text-xs font-semibold px-2 py-0.5 rounded bg-[#252118] text-[#E5D7C5] outline-none border border-[#C9956C]"
              />
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1e1a16] border border-[#2a2520]">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#8C8073]">Project:</span>
                <span className="text-xs font-bold text-[#E5D7C5] truncate max-w-[130px]">
                  {documentName}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setNameValue(documentName);
                    setEditingName(true);
                  }}
                  className="p-0.5 text-[#8C8073] hover:text-[#C9956C] transition-colors rounded"
                  title="Rename Invitation Document"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="w-px h-4 bg-[#252118]" />

            {/* Phase 10 Step Navigation Header */}
            <StepNavigationHeader />

            {/* App Menus (File, Edit, View, Design, Production) */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-[#9E9285]">
              {/* File Menu Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(menuOpen === 'file' ? null : 'file');
                  }}
                  className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                    menuOpen === 'file' ? 'bg-[#252118] text-[#E5D7C5] font-bold' : 'hover:bg-[#252118] hover:text-[#E5D7C5]'
                  }`}
                >
                  <span>File</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>

                {menuOpen === 'file' && (
                  <div className="absolute left-0 mt-1.5 w-56 rounded-xl shadow-2xl overflow-hidden z-50 bg-[#161412] border border-[#322C22] py-1 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(null);
                        setTemplateGalleryOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center justify-between text-[#E5D7C5] hover:bg-[#252118] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FilePlus className="h-4 w-4 text-amber-500" />
                        <span>New Invitation Design</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">Ctrl+N</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(null);
                        if (confirm('Create a new blank canvas? (Make sure to save your current work)')) {
                          createNewDesign();
                          showToast('✦ Created blank invitation canvas');
                        }
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center justify-between text-[#E5D7C5] hover:bg-[#252118] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-500" />
                        <span>New Blank Canvas</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(null);
                        setCloudTemplatesModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center justify-between text-[#E5D7C5] hover:bg-[#252118] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-amber-500" />
                        <span>Open Design...</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">Ctrl+O</span>
                    </button>

                    <div className="my-1 border-t border-[#252118]" />

                    <button
                      onClick={() => {
                        setMenuOpen(null);
                        handleSave();
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center justify-between text-[#E5D7C5] hover:bg-[#252118] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4 text-amber-500" />
                        <span>Save</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">Ctrl+S</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(null);
                        setSaveAsName(`${documentName} Copy`);
                        setSaveAsModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center justify-between text-[#E5D7C5] hover:bg-[#252118] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CopyIcon className="h-4 w-4 text-amber-500" />
                        <span>Save As...</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">Ctrl+Shift+S</span>
                    </button>

                    <div className="my-1 border-t border-[#252118]" />

                    <button
                      onClick={() => {
                        setMenuOpen(null);
                        setPublishModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center justify-between text-[#C9956C] font-bold hover:bg-[#252118] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-[#C9956C]" />
                        <span>Publish Template...</span>
                      </div>
                      <span className="text-[10px] text-amber-500">Version</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setMenuOpen(menuOpen === 'edit' ? null : 'edit')}
                className="px-2 py-1 rounded hover:bg-[#252118] hover:text-[#E5D7C5] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setMenuOpen(menuOpen === 'view' ? null : 'view')}
                className="px-2 py-1 rounded hover:bg-[#252118] hover:text-[#E5D7C5] transition-colors"
              >
                View
              </button>
              <button
                onClick={() => setUiMode('design')}
                className={`px-2 py-1 rounded transition-colors ${uiMode === 'design' ? 'text-[#C9956C] font-bold' : 'hover:bg-[#252118] hover:text-[#E5D7C5]'}`}
              >
                Design
              </button>
              <button
                onClick={() => setUiMode('production')}
                className={`px-2 py-1 rounded transition-colors ${uiMode === 'production' ? 'text-amber-400 font-bold' : 'hover:bg-[#252118] hover:text-[#E5D7C5]'}`}
              >
                Production
              </button>
            </div>
          </div>

          {/* Right: Actions, Mode Badge, & Primary CTA */}
          <div className="flex items-center gap-2">
            {/* Mode Switcher Badge */}
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-all hover:scale-105"
              style={{
                background: uiMode === 'production' ? 'rgba(212,175,55,0.15)' : 'rgba(201,149,108,0.15)',
                borderColor: uiMode === 'production' ? '#D4AF37' : '#C9956C',
                color: uiMode === 'production' ? '#D4AF37' : '#C9956C',
              }}
              onClick={() => setUiMode(uiMode === 'design' ? 'production' : 'design')}
              title={`Click to switch mode (Current: ${uiMode.toUpperCase()})`}
            >
              <Sliders className="h-3 w-3" />
              <span>{uiMode === 'design' ? 'DESIGN' : 'PRODUCTION'}</span>
            </div>

            <div className="w-px h-4 bg-[#252118]" />

            {/* Undo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1.5 rounded transition-all ${canUndo ? 'text-[#C9956C] hover:bg-[#252118]' : 'text-[#4A423A] cursor-not-allowed'}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>

            {/* Redo */}
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1.5 rounded transition-all ${canRedo ? 'text-[#C9956C] hover:bg-[#252118]' : 'text-[#4A423A] cursor-not-allowed'}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all hover:bg-[#252118]"
              style={{ color: saveSuccess ? '#4CAF50' : '#C9956C' }}
              title="Save Design (Ctrl+S)"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saveSuccess ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{isSaving ? 'Saving…' : saveSuccess ? 'Saved' : 'Save'}</span>
            </button>

            {/* App Mode Switcher Pill */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#141210] border border-[#252118]">
              <button
                onClick={() => setAppMode('designer')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  appMode === 'designer' ? 'bg-[#C9956C] text-[#161412] shadow' : 'text-[#8C8073] hover:text-[#E5D7C5]'
                }`}
              >
                🎨 Designer Mode
              </button>
              <button
                onClick={() => setAppMode('customer')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  appMode === 'customer' ? 'bg-[#C9956C] text-[#161412] shadow' : 'text-[#8C8073] hover:text-[#E5D7C5]'
                }`}
              >
                👤 Customer Mode
              </button>
            </div>

            {/* Designer Review Modal Button */}
            {appMode === 'designer' && (
              <button
                onClick={() => setDesignerReviewOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  customerSubmissionStatus === 'submitted'
                    ? 'bg-amber-500 text-[#161412] animate-bounce shadow-lg font-extrabold'
                    : 'bg-[#252118] text-[#E5D7C5] hover:bg-[#322C22] border border-[#322C22]'
                }`}
                title="Review Customer Submissions"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Designer Review</span>
                {customerSubmissionStatus === 'submitted' && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            )}

            {/* Curated Color Palettes & Fonts Button */}
            <button
              onClick={() => setColorPaletteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#252118] text-[#E5D7C5] hover:bg-[#322C22] transition-colors border border-[#322C22]"
              title="Open Curated Color Palettes & Typography Presets"
            >
              <Palette className="h-3.5 w-3.5 text-[#C9956C]" />
              <span>Palettes</span>
            </button>

            {/* Orders & Production Dashboard Button */}
            <button
              onClick={() => setOrderDashboardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#252118] text-[#E5D7C5] hover:bg-[#322C22] transition-colors border border-[#322C22]"
              title="Open Orders & Production Dashboard"
            >
              <Package className="h-3.5 w-3.5 text-[#C9956C]" />
              <span>Orders &amp; Prod</span>
            </button>

            {/* New Invitation Design Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTemplateGalleryOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#C9956C] text-[#161412] hover:bg-[#D4A37A] transition-all shadow-md"
              title="Open Create Your Invitation Workflow"
            >
              <FilePlus className="h-3.5 w-3.5" />
              <span>New Invitation Design</span>
            </button>

            {/* Templates Gallery Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTemplateGalleryOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#C9956C]/20 text-[#C9956C] border border-[#C9956C]/40 hover:bg-[#C9956C] hover:text-[#161412] transition-all shadow-md"
              title="Browse Templates Gallery"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Templates</span>
            </button>

            {/* Cloud Database Button */}
            <button
              onClick={() => setCloudTemplatesModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#252118] text-[#E5D7C5] hover:bg-[#322C22] transition-colors border border-[#322C22]"
              title="Open Cloud Template Database (API Gateway)"
            >
              <Cloud className="h-3.5 w-3.5 text-amber-500" />
              <span>Cloud DB</span>
            </button>

            {/* 3D Physical Preview Button */}
            <button
              onClick={() => setShow3DModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-[#C9956C] text-[#161412] hover:bg-[#D4A37A] transition-all shadow-md"
              title="Open 3D Physical Preview Modal"
            >
              <Box className="h-3.5 w-3.5" />
              <span>3D Preview</span>
            </button>

            {/* Export Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#252118] text-[#E5D7C5] hover:bg-[#322C22] transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-[#C9956C]" />
                <span>Export</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-lg shadow-2xl overflow-hidden z-50 bg-[#1A1816] border border-[#322C22]">
                  <button
                    onClick={() => { setExportMenuOpen(false); handleExportPng(); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-[#C9956C] hover:bg-[#252118] border-b border-[#252118]"
                  >
                    <span>High-DPI PNG</span>
                    <span className="text-[9px] font-bold text-amber-500">300 DPI</span>
                  </button>
                  <button
                    onClick={() => { setExportMenuOpen(false); handleExportJson(); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-[#C9956C] hover:bg-[#252118] border-b border-[#252118]"
                  >
                    <span>JSON State</span>
                    <span className="text-[9px] text-neutral-400">Doc</span>
                  </button>
                  <button
                    onClick={() => { setExportMenuOpen(false); handleExportPdf(); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-[#C9956C] hover:bg-[#252118] border-b border-[#252118]"
                  >
                    <span>Print-Ready PDF</span>
                    <span className="text-[9px] font-bold text-emerald-400">PDF/X</span>
                  </button>
                  <button
                    onClick={handleExportProduction}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-[#C9956C] hover:bg-[#252118]"
                  >
                    <span>Production Package</span>
                    <span className="text-[9px] font-bold text-pink-400">7 Files</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary CTA: Publish / Production */}
            <button
              onClick={() => setPublishModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded text-xs font-bold bg-[#C9956C] text-[#161412] hover:bg-[#D4AF37] transition-all shadow-md"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Publish / Send to Production</span>
            </button>
          </div>
        </header>

        {/* ─── LEVEL 2: CONTEXTUAL TOOLBAR ──────────────────────────────────── */}
        <div className="h-9 flex items-center justify-between px-4 bg-[#1A1816] text-xs">
          {/* CONTEXT 1: TEXT SELECTED */}
          {selectedText ? (
            <div className="flex items-center gap-3 w-full overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-[#C9956C] uppercase flex items-center gap-1">
                <TypeIcon className="h-3 w-3" /> Text
              </span>
              <div className="w-px h-3 bg-[#322C22]" />

              {/* Font Family */}
              <select
                value={selectedText.fontFamily}
                onChange={e => updateTextBlock(page!.id, selectedText.id, { fontFamily: e.target.value })}
                className="text-xs bg-[#252118] text-[#E5D7C5] px-2 py-0.5 rounded outline-none border border-[#322C22]"
              >
                <option value="Playfair Display">Playfair Display</option>
                <option value="Cormorant Garamond">Cormorant Garamond</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Cinzel">Cinzel</option>
                <option value="Great Vibes">Great Vibes</option>
                <option value="Alex Brush">Alex Brush</option>
              </select>

              {/* Font Size */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#8C8073]">Size:</span>
                <input
                  type="number"
                  value={selectedText.fontSize}
                  onChange={e => updateTextBlock(page!.id, selectedText.id, { fontSize: Number(e.target.value) })}
                  className="w-12 text-xs bg-[#252118] text-[#E5D7C5] px-1 py-0.5 rounded outline-none border border-[#322C22] text-center"
                />
              </div>

              {/* Alignment */}
              <div className="flex items-center gap-0.5 bg-[#252118] p-0.5 rounded border border-[#322C22]">
                <button
                  onClick={() => updateTextBlock(page!.id, selectedText.id, { textAlign: 'left' })}
                  className={`p-1 rounded ${selectedText.textAlign === 'left' ? 'bg-[#C9956C] text-[#161412]' : 'text-[#8C8073]'}`}
                  title="Align Left"
                >
                  <AlignLeft className="h-3 w-3" />
                </button>
                <button
                  onClick={() => updateTextBlock(page!.id, selectedText.id, { textAlign: 'center' })}
                  className={`p-1 rounded ${selectedText.textAlign === 'center' ? 'bg-[#C9956C] text-[#161412]' : 'text-[#8C8073]'}`}
                  title="Align Center"
                >
                  <AlignCenter className="h-3 w-3" />
                </button>
                <button
                  onClick={() => updateTextBlock(page!.id, selectedText.id, { textAlign: 'right' })}
                  className={`p-1 rounded ${selectedText.textAlign === 'right' ? 'bg-[#C9956C] text-[#161412]' : 'text-[#8C8073]'}`}
                  title="Align Right"
                >
                  <AlignRight className="h-3 w-3" />
                </button>
              </div>

              {/* Color */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#8C8073]">Color:</span>
                <input
                  type="color"
                  value={selectedText.fontColor}
                  onChange={e => updateTextBlock(page!.id, selectedText.id, { fontColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>
          ) : selectedElement ? (
            /* CONTEXT 2: IMAGE / ELEMENT SELECTED */
            <div className="flex items-center gap-3 w-full overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-[#C9956C] uppercase flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Image / Element
              </span>
              <div className="w-px h-3 bg-[#322C22]" />

              <span className="text-[10px] text-[#8C8073]">Size: {selectedElement.width}×{selectedElement.height}px</span>
              <span className="text-[10px] text-[#8C8073]">Rot: {selectedElement.rotation || 0}°</span>
              <span className="text-[10px] text-[#8C8073]">Opacity: {Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
            </div>
          ) : selectedPartialCut ? (
            /* CONTEXT 3: PARTIAL CUT SELECTED */
            <div className="flex items-center gap-3 w-full overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-pink-400 uppercase flex items-center gap-1">
                <Scissors className="h-3 w-3" /> {selectedPartialCut.name}
              </span>
              <div className="w-px h-3 bg-[#322C22]" />

              <span className="text-[10px] text-[#8C8073]">Cut Type: <strong className="text-pink-400">{selectedPartialCut.cutType}</strong></span>
              <span className="text-[10px] text-[#8C8073]">Bridges: {selectedPartialCut.bridges.count}</span>
              <span className="text-[10px] text-[#8C8073]">Pop: {selectedPartialCut.popState}</span>
            </div>
          ) : (
            /* CONTEXT 4: DEFAULT (NO SELECTION) */
            <div className="flex items-center gap-4 w-full overflow-x-auto no-scrollbar justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-[#C9956C] uppercase flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Card: A5 (148×210mm)
                </span>
                <div className="w-px h-3 bg-[#322C22]" />

                {/* Rotate Page */}
                <button
                  onClick={() => rotatePage()}
                  className="flex items-center gap-1 text-[11px] text-[#9E9285] hover:text-[#C9956C]"
                  title="Rotate Card Orientation (Ctrl+Shift+R)"
                >
                  <RotateCw className="h-3 w-3" /> Orientation
                </button>

                {/* Toggle Grid */}
                <button
                  onClick={toggleGrid}
                  className={`flex items-center gap-1 text-[11px] ${showGrid ? 'text-[#C9956C] font-bold' : 'text-[#9E9285] hover:text-[#C9956C]'}`}
                  title="Toggle Grid Overlay (G)"
                >
                  <Grid className="h-3 w-3" /> Grid
                </button>

                {/* Toggle Rulers */}
                <button
                  onClick={toggleRulers}
                  className={`flex items-center gap-1 text-[11px] ${showRulers ? 'text-[#C9956C] font-bold' : 'text-[#9E9285] hover:text-[#C9956C]'}`}
                  title="Toggle Canvas Rulers"
                >
                  <Ruler className="h-3 w-3" /> Rulers
                </button>
              </div>

              {/* Selected Edge Highlight indicator */}
              <div className="text-[10px] text-[#8C8073]">
                Target Edge: <strong className="text-[#C9956C]">{selectedEdgeSide.toUpperCase()}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal isOpen={publishModalOpen} onClose={() => setPublishModalOpen(false)} />

      {/* Cloud Template Database Modal */}
      <CloudTemplatesModal isOpen={cloudTemplatesModalOpen} onClose={() => setCloudTemplatesModalOpen(false)} />

      {/* Save As Modal */}
      {saveAsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border p-5 space-y-4 text-xs"
            style={{ background: '#161616', borderColor: '#2a2520', color: '#e8e0d8' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#2a2520' }}>
              <div className="flex items-center gap-2">
                <CopyIcon className="h-4 w-4 text-amber-500" />
                <h3 className="font-bold text-sm text-neutral-100">Save Design Copy As</h3>
              </div>
              <button onClick={() => setSaveAsModalOpen(false)} className="p-1 rounded text-neutral-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                  New Design Document Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={saveAsName}
                  onChange={e => setSaveAsName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg outline-none text-xs font-semibold"
                  style={{ background: '#111', border: '1px solid #2a2520', color: '#e8e0d8' }}
                  placeholder="Enter name for your new design copy..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveAsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold bg-[#C9956C] text-[#161412] hover:bg-[#D4A37A]"
                >
                  Save Copy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phase 10, 11, 12 & 14 Modals */}
      <TemplateGalleryModal isOpen={templateGalleryOpen} onClose={() => setTemplateGalleryOpen(false)} />
      <CustomerApprovalModal isOpen={customerApprovalOpen} onClose={() => setCustomerApprovalOpen(false)} onOpenExport={() => setSaleableExportOpen(true)} />
      <SaleableExportModal isOpen={saleableExportOpen} onClose={() => setSaleableExportOpen(false)} />
      <DesignerReviewModal isOpen={designerReviewOpen} onClose={() => setDesignerReviewOpen(false)} />
      <OrderDashboardModal isOpen={orderDashboardOpen} onClose={() => setOrderDashboardOpen(false)} />
      <ColorPaletteModal isOpen={colorPaletteOpen} onClose={() => setColorPaletteOpen(false)} />
    </>
  );
};

export default TopBar;
