import React from 'react';
import { FiChevronRight } from 'react-icons/fi';

interface JoinComponentProps {
  onNavigate: (to: string) => void;
}

export const JoinComponent: React.FC<JoinComponentProps> = ({ onNavigate }) => {
  return (
    <section id="join" className="py-24 sm:py-32 bg-slate-50 dark:bg-[#020617] relative overflow-hidden transition-colors duration-300">
      {/* Background Accent Graphics */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-[#0f172a] dark:to-slate-900 rounded-[5px] p-10 sm:p-20 text-slate-900 dark:text-white flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/5 transition-colors duration-300">
          
          {/* Banner details */}
          <div className="space-y-6 lg:max-w-xl text-center lg:text-left relative z-10">
            <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-amber-500/10 backdrop-blur-md rounded-[5px] text-[10px] sm:text-xs font-black text-amber-500 uppercase tracking-widest border border-amber-500/20">
              <span>Immediate Onboarding</span>
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
              Are you a food vendor? <br className="hidden sm:inline" />
              Launch your storefront now!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
              Join the elite Prime Website food network. Access a premium customer base, digitize your culinary offerings, and master your daily operations with our sophisticated dashboard.
            </p>
          </div>

          {/* CTA action button */}
          <button
            onClick={() => onNavigate('/owner/login')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-10 py-5 rounded-[5px] font-black text-sm transition-all shadow-xl shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] duration-150 flex items-center space-x-2 shrink-0 cursor-pointer border-none relative z-10"
          >
            <span>Merchant Workspace</span>
            <FiChevronRight className="w-5 h-5" />
          </button>

          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 -rotate-45 translate-x-32 -translate-y-32 rounded-[5px]" />
        </div>
      </div>
    </section>
  );
};
