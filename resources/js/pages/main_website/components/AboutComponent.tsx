import React from 'react';
import { FiAward, FiShoppingBag, FiEye, FiPackage } from 'react-icons/fi';

import aba from '../Company_bank/aba.png';
import wing from '../Company_bank/wing.png';
import canadia from '../Company_bank/canadia.png';
import chipmong from '../Company_bank/chipmong.png';
import dgb from '../Company_bank/dgb.png';
import lolc from '../Company_bank/lolc.png';
import phillip from '../Company_bank/phillip.png';
import ppcb from '../Company_bank/ppcb.png';
import shinhan from '../Company_bank/shinhan.png';
import truemoney from '../Company_bank/truemoney.png';
import amret from '../Company_bank/amret.png';
import apd from '../Company_bank/apd.png';
import lyhour from '../Company_bank/lyhour.png';
import reviewImg from '../../../assets/images/reveiw.avif';
import { useTranslation } from '../lang/i18n';

const bankLogos = [
  aba,
  wing,
  canadia,
  chipmong,
  dgb,
  lolc,
  phillip,
  ppcb,
  shinhan,
  truemoney,
  amret,
  apd,
  lyhour
];

export const AboutComponent: React.FC = () => {
  const { t, language } = useTranslation();
  const headline = t('about.headline');
  const hasChineseComma = headline.includes('，');
  const parts = hasChineseComma ? headline.split('，') : headline.split(',');

  return (
    <section id="about" className="relative pt-20 sm:pt-32 pb-24 sm:pb-40 bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-300 overflow-hidden transition-colors duration-300">
      {/* Decorative Ambient Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Column 1: About text content & stats */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 sm:space-y-10 animate-fade-in-left">
            <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider">
              <FiAward className="w-3.5 h-3.5" />
              <span>{t('about.badge')}</span>
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] font-kontomruy">
              {parts[0]}{parts.length > 1 ? (hasChineseComma ? '，' : ',') : ''}
              {parts.length > 1 && <br className="hidden sm:inline" />}
              {parts.length > 1 ? (
                <span>
                  {language === 'en' && (
                    <>
                      empowering <span className="text-amber-500 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">stores</span>.
                    </>
                  )}
                  {language === 'zh' && (
                    <>
                      赋能<span className="text-amber-500 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">商家</span>。
                    </>
                  )}
                  {language === 'kh' && (
                    <>
                      គាំទ្រ<span className="text-amber-500 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">អាជីវកម្ម</span>របស់អ្នក។
                    </>
                  )}
                </span>
              ) : (
                parts[0]
              )}
            </h1>

            <p className="text-slate-655 dark:text-slate-400 text-sm sm:text-lg max-w-xl font-medium leading-relaxed">
              {t('about.desc')}
            </p>

            {/* Stats Counters */}
            <div className="grid grid-cols-3 gap-6 pt-8 w-full border-t border-slate-200 dark:border-white/5 text-center lg:text-left">
              <div className="space-y-2 flex flex-col items-center lg:items-start">
                <FiShoppingBag className="w-6 h-6 text-amber-500 mb-1" />
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white block tracking-tight">2</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('about.shops')}</span>
              </div>
              <div className="space-y-2 flex flex-col items-center lg:items-start border-x border-slate-200 dark:border-white/5 px-2">
                <FiEye className="w-6 h-6 text-amber-500 mb-1" />
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white block tracking-tight">9999,99</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('about.views')}</span>
              </div>
              <div className="space-y-2 flex flex-col items-center lg:items-start">
                <FiPackage className="w-6 h-6 text-amber-500 mb-1" />
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white block tracking-tight">Unlimited</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('about.products')}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Image showcase */}
          <div className="flex justify-center lg:justify-end animate-fade-in-right">
            <div className="relative group w-full max-w-lg lg:max-w-none animate-float">
              <div className="absolute -inset-1 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl blur-lg opacity-25 group-hover:opacity-35 transition duration-500" />
              <img
                src={reviewImg}
                alt="Prime Customer Review Dashboard"
                className="relative rounded-2xl shadow-2xl hover:scale-[1.01] transition-all duration-500 border border-slate-200/50 dark:border-white/5 object-cover w-full h-auto aspect-4/3"
              />
            </div>
          </div>

        </div>

        {/* Bank Logos Marquee */}
        <div className="pt-20 mt-20 border-t border-slate-200 dark:border-white/5 w-full space-y-6">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
            {t('about.marquee')}
          </p>
          <div className="group relative w-full overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            <div className="flex h-full items-center gap-12 w-max py-2 group-hover:[animation-play-state:paused] motion-safe:animate-infinite-scroll-x motion-safe:[animation-duration:60s]">
              {bankLogos.map((logo, idx) => (
                <img
                  key={idx}
                  src={logo}
                  alt="Bank Logo"
                  className="h-[70px] w-auto object-contain hover:scale-105 transition-all duration-300 select-none"
                />
              ))}
              {bankLogos.map((logo, idx) => (
                <img
                  key={`dup-${idx}`}
                  src={logo}
                  alt="Bank Logo"
                  className="h-[70px] w-auto object-contain hover:scale-105 transition-all duration-300 select-none"
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
