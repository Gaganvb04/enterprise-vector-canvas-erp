import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, Plus, Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { uploadFileToS3, deleteS3Object, getS3Status } from '../../lib/s3UploadService';

// ─── Types ─────────────────────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileUploadState {
  name: string;
  status: UploadStatus;
  error?: string;
}

type S3Mode = 'real' | 'mock' | 'unknown';

// ─── Sample Assets (shown when library is empty) ────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────────

export const UploadsPanel: React.FC = () => {
  const { userUploads, addUpload, removeUpload, addElement, activePageId, showToast } = useStudioStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Per-file upload progress states
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // S3 connection status badge
  const [s3Mode, setS3Mode] = useState<S3Mode>('unknown');
  const [s3StatusMsg, setS3StatusMsg] = useState('Checking S3 status...');

  // ── Fetch S3 status on mount ─────────────────────────────────────────────────
  useEffect(() => {
    getS3Status().then(status => {
      setS3Mode(status.mode);
      setS3StatusMsg(status.message);
    });
  }, []);

  // ── Handle file selection ────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    // Initialise progress states
    const initialStates: FileUploadState[] = fileList.map(f => ({
      name: f.name,
      status: 'uploading',
    }));
    setUploadStates(initialStates);
    setIsUploading(true);

    const isSvg = (file: File) =>
      file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg');

    // Upload each file concurrently
    await Promise.all(
      fileList.map(async (file, idx) => {
        try {
          const result = await uploadFileToS3(file);

          // Determine asset type based on file
          const type = isSvg(file) ? 'svg' : 'image';
          const baseName = file.name.replace(/\.[^/.]+$/, '');

          addUpload({
            name: baseName,
            src: result.src,
            type,
            ...(result.uploadedToS3 && {
              s3Key: result.s3Key,
              cdnUrl: result.cdnUrl,
              uploadedToS3: true,
            }),
          });

          setUploadStates(prev =>
            prev.map((s, i) =>
              i === idx
                ? {
                    ...s,
                    status: 'success',
                  }
                : s
            )
          );
        } catch (err: any) {
          console.error('[UploadsPanel] Upload failed:', err);
          setUploadStates(prev =>
            prev.map((s, i) =>
              i === idx
                ? {
                    ...s,
                    status: 'error',
                    error: err?.message || 'Upload failed',
                  }
                : s
            )
          );
          showToast(`Failed to upload ${file.name}`);
        }
      })
    );

    setIsUploading(false);

    // Clear progress indicators after a short delay
    setTimeout(() => setUploadStates([]), 3000);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Remove upload + trigger S3 delete ────────────────────────────────────────
  const handleRemoveUpload = (id: string) => {
    const asset = userUploads.find(u => u.id === id);
    if (asset?.s3Key) {
      deleteS3Object(asset.s3Key); // fire-and-forget
    }
    removeUpload(id);
  };

  // ── Add asset to canvas ──────────────────────────────────────────────────────
  const handleAddToCanvas = (src: string, name: string) => {
    addElement(activePageId, {
      elementId: `upload-${Date.now()}`,
      name,
      category: 'custom',
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
    showToast(`Added "${name}" to canvas`);
  };

  // ── Drag from panel to canvas ────────────────────────────────────────────────
  const handleDragStart = (
    e: React.DragEvent,
    asset: { name: string; src: string }
  ) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'upload',
        element: {
          elementId: `upload-${Date.now()}`,
          name: asset.name,
          category: 'custom',
          src: asset.src,
          width: 180,
          height: 180,
        },
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  // ── Drag-and-drop onto the dropzone ─────────────────────────────────────────
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDropzoneDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
      f.type.includes('svg') ||
      f.type.includes('png') ||
      f.type.includes('jpeg') ||
      f.type.includes('webp') ||
      f.name.endsWith('.svg')
    );
    if (droppedFiles.length === 0) return;

    // Simulate a change event using a DataTransfer trick
    const dt = new DataTransfer();
    droppedFiles.forEach(f => dt.items.add(f));
    const syntheticEvent = {
      target: { files: dt.files },
    } as React.ChangeEvent<HTMLInputElement>;
    await handleFileUpload(syntheticEvent);
  };

  // ── S3 status badge ──────────────────────────────────────────────────────────
  const S3Badge = () => (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold"
      style={{
        background: s3Mode === 'real' ? 'rgba(34,197,94,0.12)' : 'rgba(250,204,21,0.10)',
        color: s3Mode === 'real' ? '#4ade80' : '#fbbf24',
        border: `1px solid ${s3Mode === 'real' ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.25)'}`,
      }}
      title={s3StatusMsg}
    >
      {s3Mode === 'real' ? (
        <Cloud className="h-3 w-3" />
      ) : (
        <CloudOff className="h-3 w-3" />
      )}
      {s3Mode === 'unknown' ? 'Checking…' : s3Mode === 'real' ? 'S3 Live' : 'Local Mode'}
    </div>
  );

  // ── Upload progress list ─────────────────────────────────────────────────────
  const UploadProgress = () => {
    if (uploadStates.length === 0) return null;
    return (
      <div className="space-y-1.5">
        {uploadStates.map((state, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px]"
            style={{ background: '#1a1714', border: '1px solid #2a2520' }}
          >
            {state.status === 'uploading' && (
              <Loader2 className="h-3 w-3 text-amber-500 animate-spin flex-shrink-0" />
            )}
            {state.status === 'success' && (
              <CheckCircle2 className="h-3 w-3 text-green-400 flex-shrink-0" />
            )}
            {state.status === 'error' && (
              <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
            )}
            <span
              className="truncate flex-1"
              style={{
                color:
                  state.status === 'success'
                    ? '#4ade80'
                    : state.status === 'error'
                    ? '#f87171'
                    : '#a09080',
              }}
            >
              {state.name}
            </span>
            {state.status === 'uploading' && (
              <span className="text-amber-600 text-[10px]">
                {s3Mode === 'real' ? 'Uploading to S3…' : 'Processing…'}
              </span>
            )}
            {state.status === 'error' && state.error && (
              <span className="text-red-400 text-[10px] truncate">{state.error}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-3 flex flex-col h-full space-y-3">

      {/* ── Header Row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7a7068' }}>
          Asset Uploads
        </span>
        <S3Badge />
      </div>

      {/* ── Upload Dropzone ──────────────────────────────────────────────────── */}
      <div
        id="upload-dropzone"
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDropzoneDrop}
        className="flex flex-col items-center justify-center p-5 rounded-lg cursor-pointer transition-all"
        style={{
          border: isDragOver
            ? '1.5px dashed #C9956C'
            : isUploading
            ? '1.5px dashed #4a4540'
            : '1.5px dashed #3a3530',
          background: isDragOver ? 'rgba(201,149,108,0.06)' : '#141414',
          color: '#7a7068',
          opacity: isUploading ? 0.6 : 1,
          cursor: isUploading ? 'not-allowed' : 'pointer',
        }}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 mb-2 text-amber-600 animate-spin" />
        ) : (
          <Upload
            className="h-6 w-6 mb-2 transition-colors"
            style={{ color: isDragOver ? '#C9956C' : '#b87333' }}
          />
        )}
        <span className="text-xs font-semibold text-neutral-200 text-center">
          {isUploading
            ? 'Uploading…'
            : isDragOver
            ? 'Drop files here'
            : s3Mode === 'real'
            ? 'Upload to AWS S3'
            : 'Upload Custom SVG or Image'}
        </span>
        <span className="text-[10px] text-neutral-500 mt-1 text-center">
          {s3Mode === 'real'
            ? 'Files are uploaded directly to your S3 bucket'
            : 'Supports .SVG, .PNG, .JPG, .WEBP — stored locally'}
        </span>
        <input
          ref={fileInputRef}
          id="upload-file-input"
          type="file"
          accept=".svg,image/png,image/jpeg,image/webp"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* ── Upload Progress Tracker ──────────────────────────────────────────── */}
      <UploadProgress />

      {/* ── Uploaded Gallery ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
          <span>
            Your Library ({userUploads.length})
          </span>
          {userUploads.some(u => u.uploadedToS3) && (
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: '#4ade80' }}
            >
              <Cloud className="h-3 w-3" />
              {userUploads.filter(u => u.uploadedToS3).length} on S3
            </span>
          )}
        </div>

        {userUploads.length === 0 ? (
          <div className="text-center py-4 space-y-2" style={{ color: '#5a5048' }}>
            <p className="text-xs">No uploaded files yet.</p>
            <span className="text-[10px] block text-neutral-500">
              Try these sample assets:
            </span>

            {/* ── Quick Sample Assets ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {SAMPLE_UPLOADS.map((sample, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={e => handleDragStart(e, sample)}
                  onClick={() => handleAddToCanvas(sample.src, sample.name)}
                  className="p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-amber-600/50 cursor-grab active:cursor-grabbing flex flex-col items-center gap-1 group"
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: sample.src }}
                  />
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
                {/* S3 cloud badge on individual asset */}
                {asset.uploadedToS3 && (
                  <div
                    className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold z-10"
                    style={{
                      background: 'rgba(34,197,94,0.15)',
                      color: '#4ade80',
                      border: '1px solid rgba(74,222,128,0.25)',
                    }}
                    title={`S3 Key: ${asset.s3Key}`}
                  >
                    <Cloud className="h-2.5 w-2.5" />
                    S3
                  </div>
                )}

                {/* Asset Thumbnail */}
                <div
                  id={`asset-thumb-${asset.id}`}
                  onClick={() => handleAddToCanvas(asset.src, asset.name)}
                  className="w-16 h-16 flex items-center justify-center cursor-pointer overflow-hidden"
                >
                  {asset.type === 'svg' ? (
                    <div
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: asset.src }}
                    />
                  ) : (
                    <img
                      src={asset.src}
                      alt={asset.name}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <span className="text-[10px] text-neutral-300 truncate w-full text-center mt-1">
                  {asset.name}
                </span>

                {/* Floating Add / Remove Actions */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-black/80 rounded p-0.5 transition-opacity">
                  <button
                    id={`add-to-canvas-${asset.id}`}
                    onClick={() => handleAddToCanvas(asset.src, asset.name)}
                    className="p-1 text-amber-500 hover:text-white"
                    title="Add to canvas"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    id={`remove-upload-${asset.id}`}
                    onClick={() => handleRemoveUpload(asset.id)}
                    className="p-1 text-red-400 hover:text-red-200"
                    title={asset.uploadedToS3 ? 'Delete from S3 & library' : 'Remove from library'}
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
