import React, { useEffect, useState } from 'react';
import { X, Cloud, Loader2, RefreshCw, Calendar, Tag, Layers, ArrowRight, Trash2 } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { fetchTemplatesFromApi, deleteTemplateFromApi } from '../../lib/templateApiService';
import type { BackendTemplateRecord } from '../../lib/templateApiService';

interface CloudTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudTemplatesModal: React.FC<CloudTemplatesModalProps> = ({ isOpen, onClose }) => {
  const { loadTemplateFromRecord, showToast } = useStudioStore();
  const [templates, setTemplates] = useState<BackendTemplateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    const result = await fetchTemplatesFromApi();
    setTemplates(result.templates);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTemplate = (template: BackendTemplateRecord) => {
    loadTemplateFromRecord(template);
    onClose();
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete template "${name}" from Cloud DB?`)) return;

    setDeletingId(id);
    const ok = await deleteTemplateFromApi(id);
    if (ok) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast(`Deleted template "${name}" from Cloud DB`);
    } else {
      showToast(`Failed to delete template`);
    }
    setDeletingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[85vh]"
        style={{ background: '#161616', borderColor: '#2a2520', color: '#e8e0d8' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: '#2a2520' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Cloud Template Database</h3>
              <p className="text-xs text-neutral-400">Templates synchronized with Express + Prisma + PostgreSQL API Gateway</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTemplates}
              disabled={loading}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Refresh templates"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
              <span className="text-xs text-neutral-400">Fetching templates from PostgreSQL DB…</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <Cloud className="h-10 w-10 text-neutral-600" />
              <p className="text-xs text-neutral-300 font-semibold">No templates found in Cloud DB.</p>
              <span className="text-[11px] text-neutral-500 max-w-xs">
                Click "Publish Template" in the top bar to save your current canvas design to the cloud database.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map(tpl => {
                const state = tpl.canvasState || {};
                const pageCount = state.pages?.length || 0;
                const version = state.version || 'v1.0';

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/60 cursor-pointer transition-all flex flex-col justify-between group hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-amber-400 text-xs truncate max-w-[180px] group-hover:text-amber-300">
                          {tpl.name}
                        </h4>
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider"
                          style={{
                            background: tpl.status === 'PUBLISHED' ? 'rgba(34,197,94,0.15)' : 'rgba(250,204,21,0.15)',
                            color: tpl.status === 'PUBLISHED' ? '#4ade80' : '#fbbf24',
                            border: `1px solid ${tpl.status === 'PUBLISHED' ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
                          }}
                        >
                          {tpl.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-amber-600" />
                          {tpl.eventType || 'Wedding'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-amber-600" />
                          {pageCount} Pages ({version})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800 text-[10px] text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(tpl.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteTemplate(e, tpl.id, tpl.name)}
                          disabled={deletingId === tpl.id}
                          className="p-1 rounded text-red-400 hover:text-red-200 hover:bg-neutral-800"
                          title="Delete template"
                        >
                          {deletingId === tpl.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </button>
                        <span className="flex items-center gap-1 text-amber-500 font-bold group-hover:translate-x-0.5 transition-transform">
                          Load <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudTemplatesModal;
