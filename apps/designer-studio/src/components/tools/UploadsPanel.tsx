import React, { useRef } from 'react';
import { Upload, Trash2, Plus } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

const SAMPLE_UPLOADS = [
  {
    name: 'Royal Monogram Seal',
    type: 'svg' as const,
    src: `<svg viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" stroke-width="2" stroke-dasharray="4 2"/><circle cx="50" cy="50" r="38" fill="none" stroke="#D4AF37" stroke-width="1"/><path d="M 35 60 L 50 30 L 65 60 Z" fill="none" stroke="#D4AF37" stroke-width="2"/><text x="50" y="58" text-anchor="middle" font-family="Playfair Display" font-size="20" fill="#D4AF37" font-weight="bold">RM</text></svg>`,
  },
  {
    name: 'Botanical Leaf Motif',
    type: 'svg' as const,
    src: `<svg viewBox="0 0 100 100" width="100" height="100"><path d="M 50 90 C 20 60 20 30 50 10 C 80 30 80 60 50 90 Z" fill="none" stroke="#C9956C" stroke-width="2"/><path d="M 50 10 L 50 90" stroke="#C9956C" stroke-width="1.5"/><path d="M 50 30 C 65 35 70 45 50 50 C 35 45 30 35 50 30 Z" fill="rgba(201,149,108,0.2)" stroke="#C9956C" stroke-width="1"/></svg>`,
  },
];

export const UploadsPanel: React.FC = () => {
  const { userUploads, addUpload, removeUpload, addElement, activePageId, showToast } = useStudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const isSvg = file.type.includes('svg') || file.name.endsWith('.svg');
      const reader = new FileReader();

      if (isSvg) {
        reader.onload = (event) => {
          const content = event.target?.result as string;
          addUpload({
            name: file.name.replace(/\.[^/.]+$/, ''),
            src: content,
            type: 'svg',
          });
        };
        reader.readAsText(file);
      } else {
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          addUpload({
            name: file.name.replace(/\.[^/.]+$/, ''),
            src: dataUrl,
            type: 'image',
          });
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddToCanvas = (src: string, name: string, category: 'custom' = 'custom') => {
    addElement(activePageId, {
      elementId: `upload-${Date.now()}`,
      name,
      category,
      src,
      x: 180,
      y: 250,
      width: 180,
      height: 180,
      rotation: 0,
      opacity: 1,
      blendMode: 'normal',
      flipH: false,
      flipV: false,
      locked: false,
      visible: true,
    });
    showToast(`Added ${name} to page`);
  };

  const handleDragStart = (e: React.DragEvent, asset: { name: string; src: string; type: string }) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'upload',
      element: {
        elementId: `upload-${Date.now()}`,
        name: asset.name,
        category: 'custom',
        src: asset.src,
        width: 180,
        height: 180,
      }
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="p-3 flex flex-col h-full space-y-4">
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7a7068' }}>
        Asset Uploads
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center p-5 rounded-lg cursor-pointer transition-all hover:border-amber-600/60"
        style={{ border: '1.5px dashed #3a3530', background: '#141414', color: '#7a7068' }}
      >
        <Upload className="h-6 w-6 mb-2 text-amber-600" />
        <span className="text-xs font-semibold text-neutral-200 text-center">
          Upload Custom SVG or Image
        </span>
        <span className="text-[10px] text-neutral-500 mt-1 text-center">
          Supports .SVG, .PNG, .JPG, .WEBP
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/png,image/jpeg,image/webp"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Uploaded Gallery */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
          <span>Your Library ({userUploads.length})</span>
        </div>

        {userUploads.length === 0 ? (
          <div className="text-center py-4 space-y-2" style={{ color: '#5a5048' }}>
            <p className="text-xs">No uploaded files yet.</p>
            <span className="text-[10px] block text-neutral-500">
              Click or drag samples below to test asset drop:
            </span>

            {/* Quick Sample Assets */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {SAMPLE_UPLOADS.map((sample, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={e => handleDragStart(e, sample)}
                  onClick={() => handleAddToCanvas(sample.src, sample.name)}
                  className="p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 cursor-grab active:cursor-grabbing flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: sample.src }} />
                  <span className="text-[10px] text-neutral-400 truncate w-full text-center group-hover:text-amber-500">
                    + {sample.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {userUploads.map(asset => (
              <div
                key={asset.id}
                draggable
                onDragStart={e => handleDragStart(e, asset)}
                className="relative group p-2 rounded bg-neutral-900/90 border border-neutral-800 hover:border-amber-600 transition-all flex flex-col items-center cursor-grab active:cursor-grabbing"
              >
                <div
                  onClick={() => handleAddToCanvas(asset.src, asset.name)}
                  className="w-16 h-16 flex items-center justify-center cursor-pointer overflow-hidden"
                >
                  {asset.type === 'svg' ? (
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: asset.src }} />
                  ) : (
                    <img src={asset.src} alt={asset.name} className="w-full h-full object-contain" />
                  )}
                </div>

                <span className="text-[10px] text-neutral-300 truncate w-full text-center mt-1">
                  {asset.name}
                </span>

                {/* Floating Add / Remove Actions */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-black/80 rounded p-0.5 transition-opacity">
                  <button
                    onClick={() => handleAddToCanvas(asset.src, asset.name)}
                    className="p-1 text-amber-500 hover:text-white"
                    title="Add to canvas"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeUpload(asset.id)}
                    className="p-1 text-red-400 hover:text-red-200"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadsPanel;
