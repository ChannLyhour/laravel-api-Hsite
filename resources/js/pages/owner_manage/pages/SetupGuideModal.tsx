import React from 'react';
import { FiX, FiCheck, FiArrowRight } from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';

export interface SetupProgress {
  shippingMethod: boolean;
  customerLogin: boolean;
  categorySetup: boolean;
  brandSetup?: boolean;
  addNewProduct: boolean;
  generalSetup: boolean;
  languageSetup?: boolean;
  percentage: number;
}

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: SetupProgress;
  onStartStep: (tabId: string) => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  progress,
  onStartStep,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      id: 'shippingMethod',
      label: 'Shipping Method',
      isCompleted: progress.shippingMethod,
      tab: 'settings-delivery-methods',
    },
    {
      id: 'customerLogin',
      label: 'Customer Login',
      isCompleted: progress.customerLogin,
      tab: 'settings-thirdparty-gmailotp',
    },
    {
      id: 'categorySetup',
      label: 'Category Setup',
      isCompleted: progress.categorySetup,
      tab: 'categories',
    },
    {
      id: 'addNewProduct',
      label: 'Add New Product',
      isCompleted: progress.addNewProduct,
      tab: 'menu-items',
    },
    {
      id: 'generalSetup',
      label: 'General Setup',
      isCompleted: progress.generalSetup,
      tab: 'settings',
    },
  ];

  // Find the first uncompleted step to start with
  const firstUncompletedStep = steps.find((s) => !s.isCompleted) || steps[0];

  // Circular progress SVG values
  const radius = 20;
  const stroke = 2.5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-start bg-slate-900/20 backdrop-blur-xs p-6 animate-fade-in">
      <div 
        className="relative rounded-3xl w-full max-w-sm p-6 shadow-2xl border space-y-5 animate-scale-up font-sans custom-card-container transition-all duration-300"
        style={{
          backgroundColor: 'var(--dashboard-card-bg, #ffffff)',
          borderColor: 'var(--dashboard-card-border, #e2e8f0)',
          color: 'var(--dashboard-card-text, #334155)',
        }}
      >
        
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 pr-2">
            <h3 
              className="text-base font-extrabold tracking-tight leading-snug"
              style={{ color: 'var(--dashboard-card-text, #1e293b)' }}
            >
              Setup and Start your Selling
            </h3>
            <p 
              className="text-[11px] font-semibold leading-relaxed"
              style={{ color: 'color-mix(in srgb, var(--dashboard-card-text, #334155) 60%, transparent)' }}
            >
              Setup and start managing your business seamlessly
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Dynamic Circular Progress */}
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="22"
                  cy="22"
                  r={normalizedRadius}
                  strokeWidth={stroke}
                  stroke="currentColor"
                  fill="transparent"
                  style={{ color: 'color-mix(in srgb, var(--dashboard-card-text, #334155) 8%, transparent)' }}
                />
                <circle
                  cx="22"
                  cy="22"
                  r={normalizedRadius}
                  className="transition-all duration-500 ease-out"
                  strokeWidth={stroke}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  style={{ color: '#10b981' }} // Emerald green to match screenshot
                />
              </svg>
              <span 
                className="absolute text-[10px] font-black"
                style={{ color: 'var(--dashboard-card-text, #1e293b)' }}
              >
                {progress.percentage}%
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-650 transition-colors border bg-transparent cursor-pointer"
              style={{
                borderColor: 'var(--dashboard-card-border, #e2e8f0)',
              }}
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5 pt-1">
          {steps.map((step) => {
            const isActive = !step.isCompleted && step.id === firstUncompletedStep.id;
            return (
              <div
                key={step.id}
                onClick={() => {
                  onStartStep(step.tab);
                  onClose();
                }}
                className="w-full flex items-center justify-between py-0.5 bg-transparent cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5">
                  {step.isCompleted ? (
                    <div 
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: 'var(--sidebar-active-color, #2563eb)' }}
                    >
                      <FiCheck className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div 
                      className="w-[18px] h-[18px] rounded-full border shrink-0 transition-colors duration-300"
                      style={{ borderColor: 'color-mix(in srgb, var(--dashboard-card-text, #334155) 25%, transparent)' }}
                    />
                  )}
                  <span
                    className="text-xs sm:text-[13px] font-bold tracking-tight"
                    style={{
                      color: step.isCompleted
                        ? 'color-mix(in srgb, var(--dashboard-card-text, #334155) 50%, transparent)'
                        : 'var(--dashboard-card-text, #1e293b)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {isActive && (
                  <button
                    className="px-3.5 py-1.5 text-white rounded-[6px] text-[11px] font-bold flex items-center gap-1.5 transition-all border-none cursor-pointer shadow-xs active:scale-95 shrink-0"
                    style={{
                      backgroundColor: 'var(--sidebar-active-color, #2563eb)',
                      boxShadow: '0 2px 6px color-mix(in srgb, var(--sidebar-active-color, #2563eb) 20%, transparent)',
                    }}
                  >
                    <span>Lets Start</span>
                    <FiArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
