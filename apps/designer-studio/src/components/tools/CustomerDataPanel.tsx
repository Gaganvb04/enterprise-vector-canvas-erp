import React, { useState } from 'react';
import {
  Users, Plus, Sparkles, CheckCircle2, AlertTriangle, RotateCcw,
  Eye, EyeOff, Trash2, Tag, ChevronDown, ChevronRight
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import type { VariableCategory, VariableDataType } from '../../types/variable';

const CATEGORIES: Array<{ id: VariableCategory; label: string; icon: string }> = [
  { id: 'COUPLE', label: 'Bride & Groom', icon: '🤵👰' },
  { id: 'EVENT', label: 'Event & Timings', icon: '📅' },
  { id: 'VENUE', label: 'Venue & Location', icon: '🏰' },
  { id: 'FAMILY', label: 'Host Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'RSVP', label: 'RSVP Contacts', icon: '📞' },
  { id: 'CUSTOM', label: 'Custom Fields', icon: '✨' },
];

export const CustomerDataPanel: React.FC = () => {
  const {
    variables,
    updateVariableValue,
    addCustomVariable,
    deleteCustomVariable,
    resetPreviewData,
    previewVariables,
    togglePreviewVariables,
    showVariableHighlights,
    toggleVariableHighlights,
    validateVariables,
    activePageId,
    addTextBlock,
    showToast,
  } = useStudioStore();

  const [expandedCategories, setExpandedCategories] = useState<Record<VariableCategory, boolean>>({
    COUPLE: true,
    EVENT: true,
    VENUE: true,
    FAMILY: false,
    RSVP: false,
    CUSTOM: true,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newDefaultVal, setNewDefaultVal] = useState('');
  const [newCategory, setNewCategory] = useState<VariableCategory>('CUSTOM');
  const [newDataType, setNewDataType] = useState<VariableDataType>('text');

  const validation = validateVariables();

  const toggleCategory = (cat: VariableCategory) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleCreateCustomVar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      showToast('⚠️ Please enter a Field Name');
      return;
    }

    const generatedKey = newKey.trim()
      ? newKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : newLabel.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    addCustomVariable({
      key: generatedKey,
      label: newLabel.trim(),
      category: newCategory,
      value: newDefaultVal.trim() || newLabel.trim(),
      defaultValue: newDefaultVal.trim() || newLabel.trim(),
      dataType: newDataType,
      required: false,
      isCustom: true,
    });

    setNewLabel('');
    setNewKey('');
    setNewDefaultVal('');
    setShowAddModal(false);
    showToast(`✨ Created Custom Variable {{${generatedKey}}}`);
  };

  const handleInsertVariableToCanvas = (key: string, label: string) => {
    addTextBlock(activePageId, {
      blockType: 'free',
      name: `${label} Variable`,
      content: `{{${key}}}`,
      language: 'en',
      x: 60,
      y: 180,
      width: 440,
      fontFamily: 'Playfair Display',
      fontSize: 22,
      fontWeight: '600',
      fontStyle: 'normal',
      fontColor: '#7B1E1E',
      textAlign: 'center',
      lineHeight: 1.5,
      letterSpacing: 0,
      locked: false,
      visible: true,
      variableKey: key,
      isCustomizable: true,
      editableByCustomer: true,
    });
    showToast(`✦ Inserted Linked Variable {{${key}}} to Canvas`);
  };

  return (
    <div className="h-full flex flex-col bg-[#161412] text-[#E5D7C5] text-xs select-none">
      
      {/* ── 1. PANEL HEADER ─────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-[#252118] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#C9956C]" />
            <h2 className="font-bold text-sm text-[#E5D7C5] tracking-wide">Customer Data & Merge</h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9956C]/20 text-[#C9956C] font-mono border border-[#C9956C]/40">
            Live Merge
          </span>
        </div>

        {/* Global Control Switches */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={togglePreviewVariables}
            className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all font-bold text-[11px] ${
              previewVariables
                ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]'
                : 'bg-[#1a1816] text-[#8C8073] border-[#252118] hover:text-[#E5D7C5]'
            }`}
            title="Toggle Live Customer Data Preview"
          >
            {previewVariables ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{previewVariables ? 'Live Merge: ON' : 'Raw Tags: ON'}</span>
          </button>

          <button
            onClick={toggleVariableHighlights}
            className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all font-bold text-[11px] ${
              showVariableHighlights
                ? 'bg-[#252118] text-amber-300 border-[#C9956C]'
                : 'bg-[#1a1816] text-[#8C8073] border-[#252118] hover:text-[#E5D7C5]'
            }`}
            title="Toggle Variable Visual Highlights on Canvas"
          >
            <Tag className="h-3.5 w-3.5 text-[#C9956C]" />
            <span>{showVariableHighlights ? 'Outline: ON' : 'Outline: OFF'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. PREFLIGHT CHECK STATUS BANNER ────────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-1">
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
            validation.isValid
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            )}
            <span className="font-semibold truncate">
              {validation.isValid
                ? 'All required fields populated'
                : `Missing: ${validation.missingFields.slice(0, 2).join(', ')}${
                    validation.missingFields.length > 2 ? '...' : ''
                  }`}
            </span>
          </div>

          <button
            onClick={resetPreviewData}
            className="p-1 rounded hover:bg-[#252118] text-[#8C8073] hover:text-[#E5D7C5] transition-colors"
            title="Reset Sample Preview Data"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── 3. VARIABLE CATEGORY LIST ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {CATEGORIES.map(cat => {
          const catVars = variables.filter(v => v.category === cat.id);
          if (catVars.length === 0 && cat.id !== 'CUSTOM') return null;

          const isExpanded = expandedCategories[cat.id];

          return (
            <div key={cat.id} className="rounded-xl bg-[#1a1816] border border-[#252118] overflow-hidden">
              
              {/* Category Header Bar */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full p-2.5 bg-[#141210] flex items-center justify-between text-xs font-bold text-[#E5D7C5] hover:bg-[#1f1c19] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#252118] text-[#8C8073] font-mono">
                    {catVars.length}
                  </span>
                </div>
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[#8C8073]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#8C8073]" />}
              </button>

              {/* Category Input Fields */}
              {isExpanded && (
                <div className="p-2.5 space-y-2.5 border-t border-[#252118]/60">
                  {catVars.map(v => (
                    <div key={v.key} className="space-y-1 group">
                      <div className="flex items-center justify-between text-[11px]">
                        <label className="font-semibold text-[#C9956C] flex items-center gap-1">
                          <span>{v.label}</span>
                          {v.required && <span className="text-red-400">*</span>}
                        </label>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleInsertVariableToCanvas(v.key, v.label)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[#252118] hover:bg-[#C9956C] hover:text-[#161412] text-[#9E9285] font-mono transition-colors"
                            title={`Insert {{${v.key}}} onto active page`}
                          >
                            + Canvas
                          </button>

                          {v.isCustom && (
                            <button
                              onClick={() => {
                                deleteCustomVariable(v.key);
                                showToast(`Removed variable {{${v.key}}}`);
                              }}
                              className="p-0.5 text-red-400 hover:text-red-300"
                              title="Delete Custom Variable"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type={v.dataType === 'date' ? 'text' : v.dataType === 'time' ? 'text' : 'text'}
                          value={v.value}
                          onChange={e => updateVariableValue(v.key, e.target.value)}
                          placeholder={v.defaultValue}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141210] border border-[#252118] text-xs outline-none text-[#E5D7C5] placeholder-[#554d44] focus:border-[#C9956C] transition-all font-mono"
                        />
                        <span className="absolute right-2 top-2 text-[9px] text-[#665c52] font-mono select-all">
                          &#123;&#123;{v.key}&#125;&#125;
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Add Custom Button under Custom Category */}
                  {cat.id === 'CUSTOM' && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="w-full py-1.5 rounded-lg border border-dashed border-[#C9956C]/40 text-[#C9956C] hover:bg-[#C9956C]/10 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all mt-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Add Custom Variable Field</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* ── 4. ADD CUSTOM FIELD MODAL ───────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomVar}
            className="w-full max-w-sm bg-[#1A1816] border border-[#C9956C]/40 rounded-2xl p-4 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#252118] pb-2">
              <span className="font-bold text-sm text-[#E5D7C5] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C9956C]" /> Add Custom Variable
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#8C8073] hover:text-[#E5D7C5]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8C8073] uppercase">Field Label Name</label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={e => {
                  setNewLabel(e.target.value);
                  if (!newKey) {
                    setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                  }
                }}
                placeholder="e.g. Reception Venue"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#141210] border border-[#252118] text-xs outline-none text-[#E5D7C5] focus:border-[#C9956C]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8C8073] uppercase">Variable Tag Key</label>
              <input
                type="text"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="e.g. reception_venue"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#141210] border border-[#252118] text-xs outline-none font-mono text-amber-300 focus:border-[#C9956C]"
              />
              <span className="text-[9px] text-[#776c60]">Tag will be: &#123;&#123;{newKey || 'key'}&#125;&#125;</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8C8073] uppercase">Default Sample Value</label>
              <input
                type="text"
                value={newDefaultVal}
                onChange={e => setNewDefaultVal(e.target.value)}
                placeholder="e.g. Grand Palace Hall"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#141210] border border-[#252118] text-xs outline-none text-[#E5D7C5] focus:border-[#C9956C]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8C8073] uppercase">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as VariableCategory)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#141210] border border-[#252118] text-xs outline-none text-[#E5D7C5] focus:border-[#C9956C]"
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="COUPLE">Couple</option>
                  <option value="EVENT">Event</option>
                  <option value="VENUE">Venue</option>
                  <option value="FAMILY">Family</option>
                  <option value="RSVP">RSVP</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8C8073] uppercase">Data Type</label>
                <select
                  value={newDataType}
                  onChange={e => setNewDataType(e.target.value as VariableDataType)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#141210] border border-[#252118] text-xs outline-none text-[#E5D7C5] focus:border-[#C9956C]"
                >
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-1.5 rounded-lg bg-[#252118] text-[#8C8073] font-bold hover:text-[#E5D7C5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 rounded-lg bg-[#C9956C] text-[#161412] font-bold hover:bg-[#D4A37A]"
              >
                Create Variable
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default CustomerDataPanel;
