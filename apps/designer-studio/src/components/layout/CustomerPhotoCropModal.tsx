import React, { useState } from 'react';
import { Camera, ZoomIn, RotateCw, Check, X, Crop } from 'lucide-react';

interface Props {
  isOpen: boolean;
  imageSrc: string;
  onConfirm: (croppedSrc: string) => void;
  onCancel: () => void;
}

export const CustomerPhotoCropModal: React.FC<Props> = ({ isOpen, imageSrc, onConfirm, onCancel }) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen) return null;

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleConfirm = () => {
    // Pass confirmed photo src back to customer panel
    onConfirm(imageSrc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border flex flex-col text-xs space-y-4 p-5"
        style={{ background: '#161412', borderColor: '#252118', color: '#E5D7C5' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#252118] pb-3">
          <div className="flex items-center gap-2">
            <Crop className="h-4 w-4 text-[#C9956C]" />
            <h3 className="font-bold text-sm text-[#E5D7C5]">Crop &amp; Adjust Customer Photo</h3>
          </div>
          <button onClick={onCancel} className="p-1 text-[#8C8073] hover:text-[#E5D7C5]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Photo Preview Canvas Area */}
        <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black border border-[#252118] flex items-center justify-center">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Customer Crop Preview"
              className="max-h-full max-w-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
              }}
            />
          ) : (
            <div className="text-center text-[#8C8073]">
              <Camera className="h-8 w-8 mx-auto mb-1 text-[#C9956C]" />
              <span>Select an image to crop</span>
            </div>
          )}

          {/* Circular/Square Crop Frame Guideline Overlay */}
          <div className="absolute inset-4 rounded-xl border-2 border-dashed border-[#C9956C]/60 pointer-events-none flex items-center justify-center">
            <span className="text-[10px] bg-black/70 text-[#C9956C] px-2 py-0.5 rounded font-mono">
              Invitation Photo Frame
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3 bg-[#1A1816] p-3 rounded-xl border border-[#252118]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#8C8073] flex items-center gap-1">
              <ZoomIn className="h-3.5 w-3.5 text-[#C9956C]" /> Zoom: <strong>{zoom}%</strong>
            </span>
            <input
              type="range"
              min="100"
              max="200"
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-36 accent-[#C9956C] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#8C8073] flex items-center gap-1">
              <RotateCw className="h-3.5 w-3.5 text-[#C9956C]" /> Rotation: <strong>{rotation}°</strong>
            </span>
            <button
              onClick={handleRotate}
              className="px-3 py-1 rounded-lg bg-[#252118] text-[#E5D7C5] hover:bg-[#322C22] text-xs font-semibold flex items-center gap-1 border border-[#322C22]"
            >
              <RotateCw className="h-3 w-3" /> Rotate 90°
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8C8073] hover:text-[#E5D7C5]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#C9956C] text-[#161412] hover:bg-[#D4A37A] transition-all shadow-md min-h-[44px]"
          >
            <Check className="h-4 w-4" />
            <span>Use Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerPhotoCropModal;
