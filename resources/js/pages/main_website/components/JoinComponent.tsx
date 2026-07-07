import React from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { useTranslation } from '../lang/i18n';

interface JoinComponentProps {
  onNavigate: (to: string) => void;
}

export const JoinComponent: React.FC<JoinComponentProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <section id="join" className="py-24 sm:py-32 bg-slate-50 dark:bg-[#020617] relative overflow-hidden transition-colors duration-300">
      {/* Background Accent Graphics */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-[#0f172a] dark:to-slate-900 rounded-2xl p-10 sm:p-20 text-slate-900 dark:text-white flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/5 transition-colors duration-300">
          
          {/* Banner details */}
          <div className="space-y-6 lg:max-w-xl text-center lg:text-left relative z-10">
            <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-amber-500/10 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider border border-amber-500/25">
              <span>{t('join.badge')}</span>
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
              {t('join.headline').split('?')[0]}? <br className="hidden sm:inline" />
              {t('join.headline').split('?')[1] || ''}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
              {t('join.desc')}
            </p>
          </div>

          {/* CTA action button */}
          <button
            onClick={() => onNavigate('/owner/login')}
            className="bg-[#FFAD21] hover:bg-[#FFAD21]/90 text-slate-950 px-8 py-4 rounded-xl font-bold text-sm tracking-wider transition-all shadow-md shadow-[#FFAD21]/10 hover:shadow-lg hover:shadow-[#FFAD21]/20 hover:scale-[1.02] active:scale-[0.98] duration-200 flex items-center space-x-2 shrink-0 cursor-pointer border-none relative z-10"
          >
            <span>{t('join.cta')}</span>
            <FiChevronRight className="w-5 h-5" />
          </button>

          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 -rotate-45 translate-x-32 -translate-y-32 rounded-xl" />
        </div>
      </div>
    </section>
  );
};
