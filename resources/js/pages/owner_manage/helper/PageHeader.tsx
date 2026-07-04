import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  onClose?: () => void;
  backTitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onClose,
  backTitle = 'Back',
  action,
}) => {
  return (
    <div className="flex items-center space-x-3 pb-2 border-b border-slate-100 w-full text-left">
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="p-2 border rounded-[5px] hover:bg-black/[0.04] text-inherit opacity-75 hover:opacity-100 transition-all cursor-pointer flex items-center justify-center shadow-2xs custom-card-container border-none"
          title={backTitle}
        >
          <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2 font-kuntomruy">
          <span>{title}</span>
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-kuntomruy">
          {subtitle}
        </p>
      </div>
      {action && (
        <div className="flex-1 flex justify-end font-kuntomruy">
          {action}
        </div>
      )}
    </div>
  );
};
