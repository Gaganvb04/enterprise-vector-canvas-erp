import React, { useEffect, useState } from 'react';
import { TopBar } from './components/layout/TopBar';
import { LeftPanel } from './components/layout/LeftPanel';
import { CanvasArea } from './components/canvas/CanvasArea';
import { RightPanel } from './components/layout/RightPanel';
import { ThreeDPreviewModal } from './components/canvas/ThreeDPreviewModal';
import { useStudioStore } from './store/studioStore';
import { X, Keyboard } from 'lucide-react';
import type { PartialCutObject } from './types/diecut';
import './index.css';

import { CustomerPersonalizationPanel } from './components/layout/CustomerPersonalizationPanel';

export const App: React.FC = () => {
  const {
    setActiveTool, undo, redo, selected, setSelected,
    deleteElement, deleteTextBlock, activePageId, getActivePage,
    copySelected, cutSelected, pasteClipboard, duplicateSelected, nudgeSelected,
    rotateSelected, rotatePage, flipSelectedH, flipSelectedV,
    toggleLockSelected, toggleVisibilitySelected, bringForward, sendBackward,
    zoom, setZoom, toggleGrid, saveDesign, loadDesign,
    show3DModal, setShow3DModal,
    appMode, setStep,
    // Die-Cut & Partial Cut state & actions
    selectedPartialCutId, setSelectedPartialCutId, partialCuts,
    removePartialCutObject, updatePartialCutObject, addPartialCutObject, showToast
  } = useStudioStore();

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Load saved design on initial mount
  useEffect(() => {
    loadDesign();
  }, [loadDesign]);

  // Global keyboard shortcuts engine (Handles text, elements, and die-cuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const isCtrl = e.ctrlKey || e.metaKey;

      // ─── Save (Ctrl + S)
      if (isCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveDesign();
        return;
      }

      // ─── Rotate Page (Ctrl + Shift + R)
      if (isCtrl && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        rotatePage();
        return;
      }

      // ─── Undo (Ctrl + Z)
      if (isCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // ─── Redo (Ctrl + Y or Ctrl + Shift + Z)
      if (isCtrl && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // ─── Copy (Ctrl + C)
      if (isCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelected();
        return;
      }

      // ─── Cut (Ctrl + X)
      if (isCtrl && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cutSelected();
        return;
      }

      // ─── Paste (Ctrl + V)
      if (isCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteClipboard();
        return;
      }

      // ─── Duplicate (Ctrl + D)
      if (isCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedPartialCutId) {
          const pc = partialCuts.find(p => p.id === selectedPartialCutId);
          if (pc) {
            const dup: PartialCutObject = {
              ...pc,
              id: `custom-cut-${Date.now()}`,
              name: `${pc.name} (Copy)`,
              x: pc.x + 20,
              y: pc.y + 20,
            };
            addPartialCutObject(dup);
            setSelectedPartialCutId(dup.id);
            showToast(`✦ Duplicated ${pc.name}`);
          }
          return;
        }
        duplicateSelected();
        return;
      }

      // ─── Lock / Unlock (Ctrl + L)
      if (isCtrl && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (selectedPartialCutId) {
          const pc = partialCuts.find(p => p.id === selectedPartialCutId);
          if (pc) {
            updatePartialCutObject(pc.id, { locked: !pc.locked });
            showToast(pc.locked ? '✦ Unlocked die-cut' : '✦ Locked die-cut');
          }
          return;
        }
        toggleLockSelected();
        return;
      }

      // ─── Hide / Show (Ctrl + H)
      if (isCtrl && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (selectedPartialCutId) {
          const pc = partialCuts.find(p => p.id === selectedPartialCutId);
          if (pc) {
            updatePartialCutObject(pc.id, { visible: pc.visible === false ? true : false });
            showToast(pc.visible === false ? '✦ Show die-cut' : '✦ Hide die-cut');
          }
          return;
        }
        toggleVisibilitySelected();
        return;
      }

      // ─── Layer Up / Down (Ctrl + ] / Ctrl + [)
      if (isCtrl && e.key === ']') {
        e.preventDefault();
        bringForward();
        return;
      }
      if (isCtrl && e.key === '[') {
        e.preventDefault();
        sendBackward();
        return;
      }

      // ─── Zoom Controls (Ctrl + + / Ctrl + - / Ctrl + 0)
      if (isCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(zoom + 0.1);
        return;
      }
      if (isCtrl && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setZoom(zoom - 0.1);
        return;
      }
      if (isCtrl && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
        return;
      }

      // ─── Select All (Ctrl + A)
      if (isCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const page = getActivePage();
        if (page) {
          if (page.elements.length > 0) {
            setSelected({ layer: 'element', id: page.elements[0].id });
          } else if (page.textBlocks.length > 0) {
            setSelected({ layer: 'textblock', id: page.textBlocks[0].id });
          }
        }
        return;
      }

      // ─── Single key shortcuts (When not holding Ctrl)
      if (!isCtrl) {
        // Delete selected item (Delete or Backspace)
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          if (selectedPartialCutId) {
            const pc = partialCuts.find(p => p.id === selectedPartialCutId);
            removePartialCutObject(selectedPartialCutId);
            setSelectedPartialCutId(null);
            showToast(`✦ Deleted ${pc ? pc.name : 'die-cut'}`);
            return;
          }
          if (selected) {
            if (selected.layer === 'element') deleteElement(activePageId, selected.id);
            if (selected.layer === 'textblock') deleteTextBlock(activePageId, selected.id);
            setSelected(null);
            showToast('✦ Deleted object');
          }
          return;
        }

        // Rotate Selected Item (R)
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          if (selectedPartialCutId) {
            const pc = partialCuts.find(p => p.id === selectedPartialCutId);
            if (pc) {
              const nextRot = ((pc.rotation || 0) + 90) % 360;
              updatePartialCutObject(pc.id, { rotation: nextRot });
              showToast(`✦ Rotated ${nextRot}°`);
            }
            return;
          }
          rotateSelected(90);
          return;
        }

        // Flip Horizontal (Shift + H) / Flip Vertical (Shift + V)
        if (e.shiftKey && (e.key === 'H' || e.key === 'h')) {
          e.preventDefault();
          flipSelectedH();
          return;
        }
        if (e.shiftKey && (e.key === 'V' || e.key === 'v')) {
          e.preventDefault();
          flipSelectedV();
          return;
        }

        // Toggle Grid (G)
        if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          toggleGrid();
          return;
        }

        // Tool Switching
        if (e.key === 'v' || e.key === 'V') setActiveTool('select');
        if (e.key === 't' || e.key === 'T') setActiveTool('text');
        if (e.key === 'e' || e.key === 'E') setActiveTool('element');
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          const { activeTool: curTool } = useStudioStore.getState();
          const next = curTool === 'pencil' ? 'select' : 'pencil';
          setActiveTool(next);
          showToast(next === 'pencil' ? 'Pencil Tool active (P)' : 'Select Tool active');
        }

        // Toggle Shortcuts Help Modal (?)
        if (e.key === '?') {
          setShowShortcutsModal(prev => !prev);
          return;
        }

        // Escape (Deselect)
        if (e.key === 'Escape') {
          setSelected(null);
          setSelectedPartialCutId(null);
          return;
        }

        // Arrow Keys Nudge
        const step = e.shiftKey ? 10 : 1;
        if (selectedPartialCutId) {
          const pc = partialCuts.find(p => p.id === selectedPartialCutId);
          if (pc) {
            if (e.key === 'ArrowUp') { e.preventDefault(); updatePartialCutObject(pc.id, { y: pc.y - step }); }
            if (e.key === 'ArrowDown') { e.preventDefault(); updatePartialCutObject(pc.id, { y: pc.y + step }); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); updatePartialCutObject(pc.id, { x: pc.x - step }); }
            if (e.key === 'ArrowRight') { e.preventDefault(); updatePartialCutObject(pc.id, { x: pc.x + step }); }
            return;
          }
        }

        if (e.key === 'ArrowUp') { e.preventDefault(); nudgeSelected(0, -step); }
        if (e.key === 'ArrowDown') { e.preventDefault(); nudgeSelected(0, step); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); nudgeSelected(-step, 0); }
        if (e.key === 'ArrowRight') { e.preventDefault(); nudgeSelected(step, 0); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveTool, undo, redo, selected, setSelected, deleteElement, deleteTextBlock,
    activePageId, getActivePage, copySelected, cutSelected, pasteClipboard,
    duplicateSelected, nudgeSelected, rotateSelected, rotatePage, flipSelectedH, flipSelectedV,
    toggleLockSelected, toggleVisibilitySelected, bringForward, sendBackward,
    zoom, setZoom, toggleGrid, saveDesign, loadDesign,
    selectedPartialCutId, setSelectedPartialCutId, partialCuts, removePartialCutObject,
    updatePartialCutObject, addPartialCutObject, showToast
  ]);

  return (
    <div className="studio-root relative">
      <TopBar />
      <div className="studio-body">
        {appMode === 'customer' ? (
          <>
            <CustomerPersonalizationPanel onOpenPreview={() => setStep(3)} />
            <CanvasArea />
          </>
        ) : (
          <>
            <LeftPanel />
            <CanvasArea />
            <RightPanel />
          </>
        )}
      </div>

      {/* 3D Physical Preview Modal */}
      <ThreeDPreviewModal isOpen={show3DModal} onClose={() => setShow3DModal(false)} />

      {/* Floating Keyboard Shortcuts Help Button */}
      <button
        onClick={() => setShowShortcutsModal(true)}
        className="fixed bottom-4 left-4 z-50 p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
        style={{ background: '#252118', border: '1px solid #C9956C', color: '#C9956C' }}
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard className="h-4 w-4" />
      </button>

      {/* Shortcuts Guide Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#161412] border border-[#C9956C] rounded-xl max-w-lg w-full p-6 text-[#E5D7C5] shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-[#252118] pb-3">
              <span className="font-bold text-sm text-[#C9956C] uppercase tracking-wider flex items-center gap-2">
                <Keyboard className="h-4 w-4" /> Studio Keyboard Shortcuts
              </span>
              <button onClick={() => setShowShortcutsModal(false)} className="p-1 rounded text-[#8C8073] hover:text-[#E5D7C5]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-[#8C8073] uppercase text-[10px]">Editing & Objects</span>
                <div className="flex justify-between"><span>Delete / Backspace</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Del</kbd></div>
                <div className="flex justify-between"><span>Undo</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Ctrl+Z</kbd></div>
                <div className="flex justify-between"><span>Redo</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Ctrl+Y</kbd></div>
                <div className="flex justify-between"><span>Duplicate</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Ctrl+D</kbd></div>
                <div className="flex justify-between"><span>Copy</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Ctrl+C</kbd></div>
                <div className="flex justify-between"><span>Paste</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Ctrl+V</kbd></div>
                <div className="flex justify-between"><span>Save Design</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Ctrl+S</kbd></div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-[#8C8073] uppercase text-[10px]">Transform & Canvas</span>
                <div className="flex justify-between"><span>Rotate 90°</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">R</kbd></div>
                <div className="flex justify-between"><span>Nudge 1px / 10px</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Arrows / Shift+Arrows</kbd></div>
                <div className="flex justify-between"><span>Lock / Unlock</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Ctrl+L</kbd></div>
                <div className="flex justify-between"><span>Hide / Show</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Ctrl+H</kbd></div>
                <div className="flex justify-between"><span>Toggle Grid</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">G</kbd></div>
                <div className="flex justify-between"><span>Deselect All</span><kbd className="px-1.5 py-0.5 rounded bg-[#252118] text-[10px]">Esc</kbd></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
