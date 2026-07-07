import React from 'react';
import type { StoreRow } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { getLightTheme } from '../utils/themeHelper';
import { themes } from '@/pages/owner_manage/templete_website/themes';

import abaLogo from '@/pages/main_website/Company_bank/aba.png';
import acledaLogo from '@/pages/main_website/Company_bank/acleda.png';
import bakongLogo from '@/pages/main_website/Company_bank/bakong.png';

interface FooterPageProps {
     stores: StoreRow | null;
     storeName?: string;
}

export const FooterPage: React.FC<FooterPageProps> = ({
     stores,
     storeName = '',
     ...restProps
}) => {
     const activeTheme = getLightTheme(themes[stores?.website_theme || 'default'] || themes.default);

     // We ignore unused prop warnings or declare destructured variables properly
     const dummy = restProps;

     return (
          <footer className="w-full text-stone-900 py-6 border-t border-stone-200 min-h-[200px] flex flex-col justify-between font-sans relative overflow-hidden bg-white">
               {/* Ambient subtle grid pattern */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000002_1px,transparent_1px),linear-gradient(to_bottom,#00000002_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

               <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-start my-auto z-10">
                    {/* Column 1: Store Brand Info */}
                    <div className="space-y-4 text-left">
                         <h4 className="text-xs font-black uppercase tracking-widest text-stone-900 border-b border-stone-200 pb-2">
                              {stores?.store_name || storeName || 'Storefront'}
                         </h4>
                         <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs">
                              {stores?.store_description || 'Welcome to our online store! Discover premium products curated just for you.'}
                         </p>
                    </div>

                    {/* Column 2: Contact Store */}
                    <div className="space-y-4 text-left">
                         <h4 className="text-xs font-black uppercase tracking-widest text-stone-900 border-b border-stone-200 pb-2">
                              Contact Store
                         </h4>
                         <ul className="space-y-2.5 text-xs text-stone-600 font-semibold">
                              <li className="flex items-center gap-2.5 hover:text-stone-900 transition-colors">
                                   <FiPhone className="w-4 h-4 text-stone-400 shrink-0" />
                                   <span>{stores?.store_phone || '---'}</span>
                              </li>
                              <li className="flex items-center gap-2.5 hover:text-stone-900 transition-colors">
                                   <FiMail className="w-4 h-4 text-stone-400 shrink-0" />
                                   <span>{stores?.store_email || 'info@store.com'}</span>
                              </li>
                              <li className="flex items-center gap-2.5 hover:text-stone-900 transition-colors">
                                   <FiMapPin className="w-4 h-4 text-stone-400 shrink-0" />
                                   <span className="truncate max-w-[280px]">{stores?.store_address || 'No address configured'}</span>
                              </li>
                         </ul>
                    </div>

                    {/* Column 3: Payment Methods */}
                    <div className="space-y-4 text-left">
                         <h4 className="text-xs font-black uppercase tracking-widest text-stone-900 border-b border-stone-200 pb-2">
                              Payment Method
                         </h4>
                         <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs">
                              We support convenient secure local bank transfers and dynamic KHQR payments:
                         </p>
                         <div className="flex flex-wrap items-center gap-2.5 pt-1">
                              {/* ABA Bank Logo */}
                              <img
                                   src={abaLogo}
                                   alt="ABA Bank"
                                   className="w-14 h-12 rounded object-contain bg-white border border-stone-200 p-[2px] transition-transform duration-300 hover:scale-105"
                              />
                              {/* Bakong KHQR Logo */}
                              <img
                                   src={bakongLogo}
                                   alt="Bakong KHQR"
                                   className="w-14 h-12 rounded object-contain bg-white border border-stone-200 p-[2px] transition-transform duration-300 hover:scale-105"
                              />
                              {/* ACLEDA PAY Logo */}
                              <img
                                   src={acledaLogo}
                                   alt="ACLEDA PAY"
                                   className="w-14 h-12 rounded object-contain bg-white border border-stone-200 p-[2px] transition-transform duration-300 hover:scale-105"
                              />
                         </div>
                    </div>
               </div>

               {/* Bottom Copy Right bar */}
               <div className="w-full max-w-7xl mx-auto px-6 border-t mt-2 border-stone-200 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-stone-500 font-semibold z-10">
                    <p>&copy; {new Date().getFullYear()} {stores?.store_name || storeName || 'Storefront'}. All rights reserved.</p>
                    <div className="flex items-center gap-1.5">
                         <span>Powered by</span>
                         <a
                              href="https://github.com/ChannLyhour"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-stone-500 hover:text-stone-900 transition-colors font-bold"
                         >
                              ChannLyhour
                         </a>
                    </div>
               </div>
          </footer>
     );
};
