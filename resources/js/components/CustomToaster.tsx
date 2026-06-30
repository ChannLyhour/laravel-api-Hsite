import React from 'react';
import { Toaster, resolveValue, toast } from 'react-hot-toast';

interface CustomToastProps {
  t: any;
}

const CustomToast: React.FC<CustomToastProps> = ({ t }) => {
  const message = resolveValue(t.message, t);

  // Determine the toast style based on type
  let toastType = t.type;
  let displayMessage = message;

  // Auto-detect warning/info prefixed messages
  if (typeof message === 'string') {
    if (message.startsWith('Warning:')) {
      toastType = 'warning';
      displayMessage = message.replace(/^Warning:\s*/i, '');
    } else if (message.startsWith('Info:') || message.startsWith('Information:')) {
      toastType = 'info';
      displayMessage = message.replace(/^(Info|Information):\s*/i, '');
    }
  }

  // Also support custom IDs or custom parameters if passed
  if (t.id === 'warning') toastType = 'warning';
  if (t.id === 'info' || t.id === 'information') toastType = 'info';

  // Config mapping for color schemes
  let bgColor = 'bg-[#F3F4F6] border-[#E5E7EB]';
  let barColor = 'bg-[#4B5563]';
  let titleColor = 'text-[#1F2937]';
  let msgColor = 'text-[#4B5563]';
  let closeColor = 'text-[#9CA3AF] hover:bg-[#E5E7EB]';
  let titleText = 'Custom message';
  let icon = null;

  switch (toastType) {
    case 'success':
      bgColor = 'bg-[#E6F9F1] border-[#C2F1DC]';
      barColor = 'bg-[#10B981]';
      titleColor = 'text-[#065F46]';
      msgColor = 'text-[#047857]';
      closeColor = 'text-[#10B981] hover:bg-[#D1F7E5]';
      titleText = 'Success';
      icon = (
        <svg className="w-5 h-5 text-[#10B981] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
      break;
    case 'warning':
      bgColor = 'bg-[#FEF3C7] border-[#FDE68A]';
      barColor = 'bg-[#F59E0B]';
      titleColor = 'text-[#92400E]';
      msgColor = 'text-[#B45309]';
      closeColor = 'text-[#F59E0B] hover:bg-[#FDE68A]';
      titleText = 'Warning';
      icon = (
        <svg className="w-5 h-5 text-[#F59E0B] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
      break;
    case 'info':
      bgColor = 'bg-[#EFF6FF] border-[#BFDBFE]';
      barColor = 'bg-[#3B82F6]';
      titleColor = 'text-[#1E3A8A]';
      msgColor = 'text-[#1D4ED8]';
      closeColor = 'text-[#3B82F6] hover:bg-[#DBEAFE]';
      titleText = 'Information';
      icon = (
        <svg className="w-5 h-5 text-[#3B82F6] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
      break;
    case 'error':
      bgColor = 'bg-[#FEF2F2] border-[#FCA5A5]';
      barColor = 'bg-[#EF4444]';
      titleColor = 'text-[#7F1D1D]';
      msgColor = 'text-[#B91C1C]';
      closeColor = 'text-[#EF4444] hover:bg-[#FEE2E2]';
      titleText = 'Error';
      icon = (
        <svg className="w-5 h-5 text-[#EF4444] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
      break;
    case 'loading':
      bgColor = 'bg-[#EFF6FF] border-[#BFDBFE]';
      barColor = 'bg-[#3B82F6]';
      titleColor = 'text-[#1E3A8A]';
      msgColor = 'text-[#1D4ED8]';
      closeColor = 'text-[#3B82F6] hover:bg-[#DBEAFE]';
      titleText = 'Loading';
      icon = (
        <svg className="w-5 h-5 text-[#3B82F6] animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
      break;
    default:
      bgColor = 'bg-[#F3F4F6] border-[#E5E7EB]';
      barColor = 'bg-[#4B5563]';
      titleColor = 'text-[#1F2937]';
      msgColor = 'text-[#4B5563]';
      closeColor = 'text-[#9CA3AF] hover:bg-[#E5E7EB]';
      titleText = 'Custom message';
      icon = null;
      break;
  }

  // Animation support
  const animationClass = t.visible ? 'animate-slide-in-right' : 'opacity-0 scale-95 pointer-events-none transition-all duration-200';

  return (
    <div
      className={`relative flex items-center w-full min-w-[320px] sm:min-w-[360px] max-w-[500px] rounded-xl border p-4 shadow-md overflow-hidden transition-all duration-300 ${bgColor} ${animationClass}`}
      style={{
        boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* Thick left border accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-[6px] ${barColor}`} />

      {/* Main Content Area */}
      <div className="flex items-center gap-3 w-full pl-2 pr-6">
        {icon}
        <div className="flex flex-col text-left">
          <span className={`text-sm font-bold leading-tight ${titleColor}`}>
            {titleText}
          </span>
          <span className={`text-xs font-semibold leading-normal mt-0.5 ${msgColor}`}>
            {displayMessage}
          </span>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => toast.dismiss(t.id)}
        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors border-none bg-transparent cursor-pointer ${closeColor}`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

export const CustomToaster: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        // Give custom components ample exit time to fade out nicely
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          border: 'none',
          padding: 0,
        }
      }}
    >
      {(t) => <CustomToast t={t} />}
    </Toaster>
  );
};
