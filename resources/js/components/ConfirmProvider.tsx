import React, { createContext, useContext, useState, useRef } from 'react';
import { FiAlertTriangle, FiLogOut, FiCheckCircle, FiInfo } from 'react-icons/fi';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
}

type ConfirmPromiseResolver = (value: boolean) => void;

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = (): ((options: ConfirmOptions) => Promise<boolean>) => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

interface ConfirmProviderProps {
  children: React.ReactNode;
}

export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<ConfirmPromiseResolver | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
    }
  };

  // Select icon based on type
  const renderIcon = () => {
    const type = options?.type || 'warning';
    switch (type) {
      case 'danger':
      case 'warning':
        return (
          <div className="mx-auto w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 mb-4 animate-pulse-slow">
            <FiAlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'success':
        return (
          <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-4 animate-pulse-slow">
            <FiCheckCircle className="w-6 h-6" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="mx-auto w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-4 animate-pulse-slow">
            <FiInfo className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Global Confirmation Modal Overlay */}
      {isOpen && options && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop click outside to close */}
          <div className="absolute inset-0 cursor-default" onClick={handleCancel}></div>
          
          {/* Modal Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full relative z-10 animate-slide-up border border-slate-100 food-shadow text-center">
            {renderIcon()}
            
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {options.title}
            </h3>
            
            <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed font-semibold">
              {options.message}
            </p>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleCancel}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm rounded-[10px] transition-all cursor-pointer border border-transparent"
              >
                {options.cancelText || 'Cancel'}
              </button>
              
              <button
                onClick={handleConfirm}
                className={`w-full py-2.5 text-white font-extrabold text-xs sm:text-sm rounded-[10px] transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1.5 border border-transparent ${
                  options.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                    : 'bg-primary hover:bg-primary-hover shadow-orange-500/10'
                }`}
              >
                {options.type === 'danger' && <FiLogOut className="w-3.5 h-3.5" />}
                <span>{options.confirmText || 'Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
