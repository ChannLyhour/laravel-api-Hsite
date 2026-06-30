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
  return (
    <section id="about" className="relative pt-20 sm:pt-32 pb-24 sm:pb-40 bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-slate-300 overflow-hidden transition-colors duration-300">
      {/* Decorative Ambient Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="w-full max-w-3xl flex flex-col items-center justify-center text-center space-y-8 sm:space-y-10">
          
          <span className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-[5px] text-[10px] sm:text-xs font-black text-amber-500 uppercase tracking-widest">
            <FiAward className="w-3.5 h-3.5" />
            <span>Prime Multi-Store Platform</span>
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.05] font-kontomruy">
            Delivering taste, <br className="hidden sm:inline" />
            empowering <span className="text-amber-500 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">stores</span>.
          </h1>

          <p className="text-slate-655 dark:text-slate-400 text-base sm:text-xl max-w-xl mx-auto font-medium leading-relaxed">
            Experience the world's most sophisticated food network platform. Discover elite local stores, craft exquisite digital menus, and experience delivery precision that redefines excellence.
          </p>

        

          {/* Stats Counters */}
          <div className="grid grid-cols-3 gap-8 pt-8 w-full max-w-2xl mx-auto text-center">
            <div className="space-y-2 flex flex-col items-center">
              <FiShoppingBag className="w-6 h-6 text-amber-500 mb-1" />
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white block tracking-tighter">2</span>
              <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest block">Registered Shops</span>
            </div>
            <div className="space-y-2 flex flex-col items-center border-x border-slate-200 dark:border-white/5">
              <FiEye className="w-6 h-6 text-amber-500 mb-1" />
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white block tracking-tighter">9999,99</span>
              <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest block">Total Menu Views</span>
            </div>
            <div className="space-y-2 flex flex-col items-center">
              <FiPackage className="w-6 h-6 text-amber-500 mb-1" />
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white block tracking-tighter">Unlimited</span>
              <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest block">Products</span>
            </div>
          </div>

          {/* Bank Logos Marquee */}
          <div className="pt-16 border-t border-slate-200 dark:border-white/5 w-full space-y-6">
            <p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
              Accept payments from every major bank in Cambodia
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
      </div>
    </section>
  );
};
