import React from 'react';

interface ButtonToggleStatusProps {
     status: boolean | number;
     onToggle: () => void;
     activeColor?: string; // defaults to 'bg-[#0f53a1]'
     className?: string; // defaults to 'mx-auto'
}

export const ButtonToggleStatus: React.FC<ButtonToggleStatusProps> = ({
     status,
     onToggle,
     activeColor = 'bg-[#0f53a1]',
     className = 'mx-auto',
}) => {
     const isActive = status === true || status === 1;

     return (
          <button
               type="button"
               onClick={onToggle}
               className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${className} ${isActive ? `${activeColor} shadow-2xs` : 'bg-slate-200'
                    }`}
          >
               <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'
                         }`}
               />
          </button>
     );
};
