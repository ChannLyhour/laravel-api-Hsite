import React from 'react';
import { FiSave, FiLoader } from 'react-icons/fi';

interface FormActionsProps {
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
  disabled?: boolean;
  cancelLabel?: string;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  saving,
  submitLabel,
  disabled = false,
  cancelLabel = 'Cancel',
  className = '',
}) => {
  return (
    <div className={`pt-6 border-t border-slate-100 flex justify-end space-x-3 w-full ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2.5 bg-black/[0.04] hover:bg-black/[0.08] text-inherit rounded-[5px] text-xs font-extrabold transition-all cursor-pointer border-none font-kuntomruy"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={saving || disabled}
        className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-[5px] text-xs font-extrabold shadow-xs active:scale-98 transition-all border-none cursor-pointer flex items-center gap-1.5 font-kuntomruy"
      >
        {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
        <span>{submitLabel}</span>
      </button>
    </div>
  );
};
