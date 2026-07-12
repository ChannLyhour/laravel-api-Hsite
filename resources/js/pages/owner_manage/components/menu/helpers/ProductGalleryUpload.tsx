import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiX, FiEdit } from 'react-icons/fi';
import { API_BASE_URL } from '@/api/client';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

function validateFiles(files: FileList): { valid: File[]; rejected: string[] } {
  const valid: File[] = [];
  const rejected: string[] = [];
  Array.from(files).forEach(file => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      rejected.push(`"${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    } else {
      valid.push(file);
    }
  });
  return { valid, rejected };
}

/**
 * Compress an image using Canvas API.
 * Scales down to maxWidth (800px) and re-encodes as JPEG at the given quality (0.7).
 * If the compressed result is larger than the original the original file is returned.
 */
async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<File> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return; }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
  });
}

export interface GalleryImage {
  id?: number;
  url: string;
  file?: File;
  isPrimary: boolean;
}

interface ProductGalleryUploadProps {
  gallery: GalleryImage[];
  onUploadImages: (files: FileList) => void;
  onRemoveImage: (index: number) => void;
  onSetMainPicture: (index: number) => void;
  onReplaceImage?: (index: number, file: File) => void;
  children?: React.ReactNode;
}

import { useTranslation } from '../../../lang/i18n';

export const ProductGalleryUpload: React.FC<ProductGalleryUploadProps> = ({
  gallery,
  onUploadImages,
  onRemoveImage,
  onSetMainPicture,
  onReplaceImage,
  children,
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replacementInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerReplace = (index: number) => {
    setReplaceIndex(index);
    replacementInputRef.current?.click();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[10px] p-6 sm:p-8 shadow-xs space-y-4">
      <div>
        <label className="text-xs sm:text-sm font-bold text-slate-700 block flex items-center gap-1">
          {t('menu.thumbnail')} <span className="text-rose-500">*</span>
        </label>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          {t('menu.upload_image')}
        </p>
      </div>

      <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-lg space-y-4">
        {/* Upload Drag & Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
              const { valid, rejected } = validateFiles(files);
              if (rejected.length > 0) {
                alert(`These files exceed the 50 MB limit and were skipped:\n${rejected.join('\n')}`);
              }
              if (valid.length > 0) {
                const compressed = await Promise.all(valid.map(f => compressImage(f)));
                const dt = new DataTransfer();
                compressed.forEach(f => dt.items.add(f));
                onUploadImages(dt.files);
              }
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[5px] p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group min-h-[140px] ${
            isDragging
              ? 'border-[#1455ac] bg-blue-50/50 scale-[0.99] shadow-inner'
              : 'border-slate-200 bg-slate-50/30 hover:border-[#1455ac] hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={async (e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                const { valid, rejected } = validateFiles(files);
                if (rejected.length > 0) {
                  alert(`These files exceed the 50 MB limit and were skipped:\n${rejected.join('\n')}`);
                }
                if (valid.length > 0) {
                  const compressed = await Promise.all(valid.map(f => compressImage(f)));
                  const dt = new DataTransfer();
                  compressed.forEach(f => dt.items.add(f));
                  onUploadImages(dt.files);
                }
              }
              e.target.value = '';
            }}
            accept="image/*"
            multiple
            className="hidden"
          />

          <div className="text-center py-1 space-y-2 relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-50 text-[#1455ac] rounded-[5px] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mb-1">
              <FiUploadCloud className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1455ac] group-hover:underline">
                {t('menu.click_upload')}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {t('menu.drag_drop')}
              </p>
            </div>
          </div>
        </div>

        {/* Upload constraint info */}
        <p className="text-[10px] text-slate-400 font-medium text-center mt-2 leading-relaxed">
          {t('menu.upload_constraints')}
        </p>

        {/* Gallery Thumbnails List */}
        {gallery.filter(img => img && img.url && img.url.trim() !== '').length > 0 ? (
          <div className="max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="grid grid-cols-3 gap-3 pt-1 pb-2">
              {gallery.map((img, originalIdx) => {
                if (!img || !img.url || img.url.trim() === '') return null;
                const displayUrl = (() => {
                  if (img.url.startsWith('http://') || img.url.startsWith('https://') || img.url.startsWith('blob:') || img.url.startsWith('data:')) {
                    return img.url;
                  }
                  const serverBase = API_BASE_URL.replace(/\/api$/, '');
                  const cleanPath = img.url.replace(/^\//, '');
                  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('static/')) {
                    return `${serverBase}/${cleanPath}`;
                  }
                  return `${serverBase}/uploads/${cleanPath}`;
                })();
                return (
                  <div
                    key={originalIdx}
                    className={`relative aspect-square rounded-[5px] overflow-hidden border bg-slate-50 flex flex-col items-center justify-center group shadow-2xs transition-all ${img.isPrimary? 'border-[#1455ac] ring-2 ring-[#1455ac]/10' : 'border-slate-200'}`}
                  >
                    <img
                      src={displayUrl}
                      alt={`Gallery ${originalIdx + 1}`}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => setPreviewImage(displayUrl)}
                    />

                    {/* Top-Right Edit / Update button */}
                    {onReplaceImage && (
                      <button
                        type="button"
                        onClick={() => handleTriggerReplace(originalIdx)}
                        className="absolute top-1 right-7 p-1 bg-white/90 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full shadow-sm border-none cursor-pointer opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200"
                        title="Change image"
                      >
                        <FiEdit className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}

                    {/* Top-Right Trash delete button */}
                    <button
                      type="button"
                      onClick={() => onRemoveImage(originalIdx)}
                      className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full shadow-sm border-none cursor-pointer opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200"
                      title={t('menu.delete_product')}
                    >
                      <FiX className="w-3 h-3 stroke-[2.5]" />
                    </button>

                    {/* Bottom-left Make Main/Star Badge button */}
                    <button
                      type="button"
                      onClick={() => onSetMainPicture(originalIdx)}
                      className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black tracking-wide flex items-center gap-0.5 cursor-pointer border-none transition-all duration-200 ${
                        img.isPrimary
                          ? 'bg-[#1455ac] text-white shadow-2xs opacity-100 scale-100'
                          : 'bg-white/90 hover:bg-white text-slate-500 hover:text-[#1455ac] opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
                      }`}
                      title={img.isPrimary ? 'Primary Main Image' : t('menu.set_main_pic')}
                    >
                      <span className="text-[10px]">★</span>
                      {img.isPrimary && <span>MAIN</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-4 border border-dashed border-slate-100 rounded-[5px] text-center text-[11px] font-bold text-slate-400 italic bg-slate-50/20">
            {t('menu.no_gallery')}
          </div>
        )}
      </div>

      {/* Hidden File Input for Replacing/Updating specific gallery images */}
      <input
        type="file"
        ref={replacementInputRef}
        onChange={async (e) => {
          const files = e.target.files;
          if (files && files.length > 0 && replaceIndex !== null && onReplaceImage) {
            const file = files[0];
            if (file.size > MAX_FILE_SIZE_BYTES) {
              alert(`"${file.name}" exceeds the 50 MB limit. Please choose a smaller image.`);
            } else {
              const compressed = await compressImage(file);
              onReplaceImage(replaceIndex, compressed);
            }
          }
          // Reset file value to allow choosing the same file subsequently
          e.target.value = '';
          setReplaceIndex(null);
        }}
        accept="image/*"
        className="hidden"
      />

      {children && (
        <div className="pt-5 border-t border-slate-200/80 mt-2">
          {children}
        </div>
      )}

      {/* Preview Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[85vh] bg-white rounded-lg overflow-hidden shadow-2xl p-2 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/50 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer border-none shadow-md z-10 animate-fade-in"
              title="Close Preview"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Preview Image */}
            <img
              src={previewImage}
              alt="Gallery Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  );
};
