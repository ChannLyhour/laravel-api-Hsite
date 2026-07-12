import React, { useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { resolveImageUrl } from '@/api/imageUtils';

import { useTranslation } from '../../../lang/i18n';

interface VariantImageUploadProps {
  index: number;
  image?: string;
  onChange: (file: File | null, previewUrl: string) => void;
  hideLabel?: boolean;
}

export const VariantImageUpload: React.FC<VariantImageUploadProps> = ({
  image,
  onChange,
  hideLabel,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={hideLabel ? "" : "space-y-1 sm:col-span-1"}>
      {!hideLabel && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t('menu.image')}</label>
      )}
      <div className={`flex items-center gap-2 ${hideLabel ? "justify-center" : ""}`}>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 border border-dashed border-slate-300 rounded-[5px] flex items-center justify-center cursor-pointer bg-white hover:bg-slate-50 transition-all overflow-hidden shrink-0 group relative"
        >
          {image ? (
            <img
              src={resolveImageUrl(image)}
              alt="Variant preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary">+</span>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onChange(file, URL.createObjectURL(file));
            }
          }}
        />
        {image && (
          <button
            type="button"
            onClick={() => onChange(null, '')}
            className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-[5px] transition-colors cursor-pointer border-none bg-transparent"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
