import React from 'react';
import { FiPlusCircle, FiLink, FiSmartphone, FiShoppingCart, FiSliders, FiGrid } from 'react-icons/fi';
import { useTranslation } from '../lang/i18n';

export const FeaturesComponent: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const capabilities = [
    {
      title: t('features.step1_title'),
      desc: t('features.step1_desc'),
      icon: <FiPlusCircle className="w-6 h-6 text-rose-500" />,
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      step: '01'
    },
    {
      title: t('features.step2_title'),
      desc: t('features.step2_desc'),
      icon: <FiLink className="w-6 h-6 text-sky-500" />,
      bg: 'bg-sky-50 dark:bg-sky-500/10',
      step: '02'
    },
    {
      title: t('features.step3_title'),
      desc: t('features.step3_desc'),
      icon: <FiSmartphone className="w-6 h-6 text-emerald-500" />,
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      step: '03'
    },
    {
      title: t('features.step4_title'),
      desc: t('features.step4_desc'),
      icon: <FiShoppingCart className="w-6 h-6 text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      step: '04'
    },
    {
      title: t('features.step5_title'),
      desc: t('features.step5_desc'),
      icon: <FiSliders className="w-6 h-6 text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      step: '05'
    },
    {
      title: t('features.step6_title'),
      desc: t('features.step6_desc'),
      icon: <FiGrid className="w-6 h-6 text-teal-500" />,
      bg: 'bg-teal-50 dark:bg-teal-500/10',
      step: '06'
    },
  ];

  return (
    <section id="features" className="py-24 sm:py-32 bg-slate-50 dark:bg-[#020617] border-y border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-orange-500/5 dark:bg-orange-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-24">
          <span className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider">
            ⚡
            <span>{t('features.badge')}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('features.headline')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
            {t('features.desc')}
          </p>
        </div>

        {/* Vertical Timeline Container */}
        <div className="relative max-w-5xl mx-auto">
          
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-slate-800/80 -translate-x-1/2 -z-10">
            {/* Ambient vertical line gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500 via-orange-500 to-amber-500 opacity-60" />
          </div>

          <div className="space-y-12 md:space-y-16">
            {capabilities.map((item, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={idx}
                  data-aos="fade-up"
                  data-aos-anchor-placement="top-bottom"
                  data-aos-delay={idx * 50}
                  className="relative flex flex-col md:flex-row items-stretch group"
                >
                  {/* Left Column (Alternates Card or Space) */}
                  <div className="w-full md:w-1/2 flex md:justify-end px-4 md:px-12 pl-16 md:pl-12 order-2 md:order-1">
                    {isEven ? (
                      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 md:hover:-translate-x-1.5 shadow-xs hover:shadow-lg hover:shadow-amber-500/5 w-full text-left">
                        <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xs`}>
                          {item.icon}
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ) : (
                      /* Empty slot on desktop, hidden on mobile to avoid layout gaps */
                      <div className="hidden md:block w-full" />
                    )}
                  </div>

                  {/* Center Timeline Circle/Node */}
                  <div className="absolute left-6 md:left-1/2 top-[56px] -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                    {/* Glowing outer ring */}
                    <div className="absolute w-10 h-10 rounded-full bg-amber-500/10 dark:bg-amber-500/20 scale-0 group-hover:scale-125 transition-transform duration-300" />
                    
                    {/* Circle Node Badge */}
                    <div className="w-8 h-8 rounded-full border-4 border-slate-50 dark:border-[#020617] bg-slate-200 text-slate-600 dark:text-slate-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-100 dark:group-hover:border-amber-950 flex items-center justify-center text-[10px] font-bold transition-all duration-300 shadow-sm z-10">
                      {item.step}
                    </div>
                  </div>

                  {/* Right Column (Alternates Card or Space) */}
                  <div className="w-full md:w-1/2 flex md:justify-start px-4 md:px-12 pl-16 md:pl-12 order-3">
                    {!isEven ? (
                      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 md:hover:translate-x-1.5 shadow-xs hover:shadow-lg hover:shadow-amber-500/5 w-full text-left">
                        <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xs`}>
                          {item.icon}
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ) : (
                      /* Empty slot on desktop, hidden on mobile to avoid layout gaps */
                      <div className="hidden md:block w-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
});
