import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string;
  imageCaption?: string;
  imageAlt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  imageCaption,
  imageAlt,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-between p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Header controls */}
      <div
        className="w-full max-w-5xl flex items-center justify-between text-white p-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-bold text-slate-200">
            {imageAlt || 'Scientific Diagram / Image Inspection'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-300">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white ml-1 border-l border-slate-700"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto w-full p-4 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={imageAlt || 'Scientific Diagram'}
          style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
          className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl bg-white/5 border border-white/10"
        />
      </div>

      {/* Caption footer */}
      {imageCaption && (
        <div
          className="bg-slate-900/90 border border-slate-800 text-slate-200 text-xs px-4 py-2.5 rounded-xl max-w-2xl text-center shadow-lg mb-2"
          onClick={(e) => e.stopPropagation()}
        >
          <strong className="text-blue-400">Figure Caption: </strong>
          {imageCaption}
        </div>
      )}
    </div>
  );
};
