import React from 'react';
import { FiCoffee } from 'react-icons/fi';
import { StoresComponent } from '@/pages/main_website/components/StoresComponent';

interface PartnerStoresTabProps {
  onNavigate: (to: string) => void;
}

export const PartnerStoresTab: React.FC<PartnerStoresTabProps> = () => {
  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <FiCoffee className="text-orange-500" />
            <span>Platform Network</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Browse and visit other partner stores across the platform network.
          </p>
        </div>
      </div>

      {/* Reusing StoresComponent with a specialized view */}
      <div className="bg-white border border-slate-100 rounded-[5px] overflow-hidden shadow-xs">
        <div className="p-1">
          <StoresComponent onNavigate={(to) => {
            // In the dashboard, we want to open in a new tab to not lose context
            window.open(to, '_blank');
          }} />
        </div>
      </div>
    </div>
  );
};
