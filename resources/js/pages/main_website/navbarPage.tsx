import React, { useState, useEffect } from 'react';
import { FiShoppingBag, FiMenu, FiX, FiArrowRight, FiLogIn, FiHome, FiLayers, FiDollarSign, FiUsers } from 'react-icons/fi';
import { AboutComponent } from './components/AboutComponent';
import { StoresComponent } from './components/StoresComponent';
import { FeaturesComponent } from './components/FeaturesComponent';
import { PricingComponent } from './components/PricingComponent';
import { JoinComponent } from './components/JoinComponent';
import { StoreRegister } from './auth/StoreRegister';
import { SettingService } from '../admin_manage/services/SettingService';
import type { PlatformFooterSettings } from '../admin_manage/services/SettingService';
import { TranslationProvider, useTranslation } from './lang/i18n';

interface NavbarPageProps {
     onNavigate: (to: string) => void;
     currentPath?: string;
}

export const NavbarPage: React.FC<NavbarPageProps> = (props) => {
     return (
          <TranslationProvider>
               <NavbarPageContent {...props} />
          </TranslationProvider>
     );
};

const NavbarPageContent: React.FC<NavbarPageProps> = ({
     onNavigate,
     currentPath = '/'
}) => {
     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
     const [langDropdownOpen, setLangDropdownOpen] = useState(false);
     const [footerSettings, setFooterSettings] = useState<PlatformFooterSettings | null>(null);
     const { t, language, setLanguage } = useTranslation();

     useEffect(() => {
          if (!langDropdownOpen) return;
          const handleClose = (e: MouseEvent) => {
               const target = e.target as HTMLElement;
               if (target.closest('#lang-switcher-container')) {
                    return;
               }
               setLangDropdownOpen(false);
          };
          document.addEventListener('click', handleClose);
          return () => document.removeEventListener('click', handleClose);
     }, [langDropdownOpen]);

     useEffect(() => {
          const loadFooter = async () => {
               const data = await SettingService.getFooterSettings();
               setFooterSettings(data);
          };
          loadFooter();
     }, []);

     const navLinks = [
          { path: '/', label: t('navbar.home'), icon: <FiHome className="w-4 h-4" /> },
          { path: '/about', label: t('navbar.platform'), icon: <FiLayers className="w-4 h-4" /> },
          { path: '/features', label: t('navbar.features'), icon: <FiLayers className="w-4 h-4" /> },
          { path: '/pricing', label: t('navbar.pricing'), icon: <FiDollarSign className="w-4 h-4" /> },
          { path: '/join', label: t('navbar.partner'), icon: <FiUsers className="w-4 h-4" /> },
     ];

     return (
          <div className="light min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] text-slate-850 dark:text-slate-300 font-sans selection:bg-amber-500/10 selection:text-amber-500 transition-colors duration-300">

               {/* ── MODERN STICKY GLASSMOPHISM NAVBAR ─────────────────── */}
               <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">

                         {/* Logo & Platform Name */}
                         <div
                              onClick={() => onNavigate('/')}
                              className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
                         >
                              <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-[5px] flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 duration-300 transition-all">
                                   <FiShoppingBag className="w-6 h-6" />
                              </div>
                              <div>
                                   <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white block leading-none">
                                        {footerSettings?.platform_name.split(' ')[0] || 'Prime'} <span className="text-amber-500">{footerSettings?.platform_name.split(' ').slice(1).join(' ') || 'Website'}</span>
                                   </span>
                                   <span className="block text-[8px] font-black text-amber-500/60 tracking-[0.25em] uppercase mt-0.5">
                                        Premium Platform
                                   </span>
                              </div>
                         </div>

                         {/* Desktop Navigation Links */}
                         <nav className="hidden md:flex items-center space-x-1">
                              {navLinks.map(link => {
                                   const isActive = currentPath === link.path || (link.path === '/' && currentPath === '/');
                                   const isHomeActive = link.path === '/' && (currentPath === '/' || !navLinks.some(l => l.path === currentPath));
                                   const selected = isActive || (link.path === '/' && isHomeActive);

                                   return (
                                        <button
                                             key={link.path}
                                             onClick={() => onNavigate(link.path)}
                                             className={`relative px-4 py-2 rounded-[5px] transition-all duration-200 cursor-pointer border-none text-xs font-black tracking-wider uppercase bg-transparent active:scale-[0.98] ${selected
                                                       ? 'text-amber-500 bg-amber-500/5'
                                                       : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                                  }`}
                                        >
                                             {link.label}
                                             {selected && (
                                                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-500 rounded-full" />
                                             )}
                                        </button>
                                   );
                              })}
                         </nav>

                         {/* Desktop Action Buttons */}
                         <div className="hidden md:flex items-center space-x-3 shrink-0">
                              {/* Language Switcher Dropdown */}
                              <div id="lang-switcher-container" className="relative shrink-0">
                                   <button
                                        onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                                        className="flex items-center space-x-1.5 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all py-2.5 px-3 rounded-[5px] hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer bg-transparent border-none active:scale-[0.98]"
                                   >
                                        <span>🌐 {language === 'en' ? 'EN' : language === 'kh' ? 'KH' : 'ZH'}</span>
                                   </button>
                                   {langDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                                             <button
                                                  onClick={() => { setLanguage('en'); setLangDropdownOpen(false); }}
                                                  className={`w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer border-none bg-transparent ${language === 'en' ? 'text-amber-500' : 'text-slate-700 dark:text-slate-350'}`}
                                             >
                                                  English
                                             </button>
                                             <button
                                                  onClick={() => { setLanguage('kh'); setLangDropdownOpen(false); }}
                                                  className={`w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer border-none bg-transparent ${language === 'kh' ? 'text-amber-500' : 'text-slate-700 dark:text-slate-350'}`}
                                             >
                                                  ខ្មែរ (KH)
                                             </button>
                                             <button
                                                  onClick={() => { setLanguage('zh'); setLangDropdownOpen(false); }}
                                                  className={`w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer border-none bg-transparent ${language === 'zh' ? 'text-amber-500' : 'text-slate-700 dark:text-slate-350'}`}
                                             >
                                                  中文 (ZH)
                                             </button>
                                        </div>
                                   )}
                              </div>

                              <button
                                   onClick={() => onNavigate('/owner/login')}
                                   className="flex items-center space-x-1.5 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all py-2.5 px-4 rounded-[5px] hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer bg-transparent border-none active:scale-[0.98]"
                              >
                                   <FiLogIn className="w-4 h-4" />
                                   <span>{t('navbar.merchant_login')}</span>
                              </button>
                              <button
                                   onClick={() => onNavigate('/register-owner')}
                                   className="bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 px-5 rounded-[5px] font-black text-xs transition-all cursor-pointer shadow-sm active:scale-[0.98] duration-200 flex items-center space-x-1.5 tracking-widest border-none hover:shadow-lg hover:shadow-amber-500/15"
                              >
                                   <span>{t('navbar.store_register')}</span>
                                   <FiArrowRight className="w-3.5 h-3.5" />
                              </button>
                         </div>

                         {/* Mobile Menu Toggle */}
                         <div className="flex md:hidden">
                              <button
                                   onClick={() => setMobileMenuOpen(true)}
                                   className="w-10 h-10 flex items-center justify-center rounded-[5px] border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-slate-100/5 dark:bg-white/5 cursor-pointer active:scale-[0.98] duration-150"
                                   title="Open Navigation Menu"
                              >
                                   <FiMenu className="w-6 h-6" />
                              </button>
                         </div>

                    </div>
               </header>

               {/* ── MOBILE MENU DRAWER ───────────────────── */}
               {mobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-50 flex">
                         {/* Backdrop */}
                         <div
                              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]"
                              onClick={() => setMobileMenuOpen(false)}
                         />
                         {/* Drawer container */}
                         <aside className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-[#020617] border-r border-slate-200 dark:border-white/10 shadow-2xl flex flex-col justify-between p-6 animate-slide-in-right transition-colors duration-300">
                              <div className="space-y-8">
                                   <div className="flex items-center justify-between">
                                        {/* Logo */}
                                        <div
                                             onClick={() => { onNavigate('/'); setMobileMenuOpen(false); }}
                                             className="flex items-center space-x-2 cursor-pointer"
                                        >
                                             <div className="w-8 h-8 bg-amber-500 rounded-[5px] flex items-center justify-center text-slate-950">
                                                  <FiShoppingBag className="w-5 h-5" />
                                             </div>
                                             <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                                                  {footerSettings?.platform_name.split(' ')[0] || 'Prime'} <span className="text-amber-500">{footerSettings?.platform_name.split(' ').slice(1).join(' ') || 'Website'}</span>
                                             </span>
                                        </div>
                                        <button
                                             onClick={() => setMobileMenuOpen(false)}
                                             className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-950 bg-transparent border-none cursor-pointer"
                                        >
                                             <FiX className="w-6 h-6" />
                                        </button>
                                   </div>

                                   {/* Navigation links list */}
                                   <nav className="space-y-1">
                                        {navLinks.map(link => {
                                             const isActive = currentPath === link.path || (link.path === '/' && currentPath === '/');
                                             const isHomeActive = link.path === '/' && (currentPath === '/' || !navLinks.some(l => l.path === currentPath));
                                             const selected = isActive || (link.path === '/' && isHomeActive);

                                             return (
                                                  <button
                                                       key={link.path}
                                                       onClick={() => { onNavigate(link.path); setMobileMenuOpen(false); }}
                                                       className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[5px] transition-all duration-200 cursor-pointer border-none text-sm font-bold active:scale-[0.98] ${selected
                                                                 ? 'text-amber-500 bg-amber-500/10'
                                                                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                                            }`}
                                                  >
                                                       <span>{link.icon}</span>
                                                       <span>{link.label}</span>
                                                  </button>
                                             );
                                        })}
                                   </nav>
                              </div>

                              {/* Bottom Actions */}
                              <div className="pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                                   {/* Mobile Language Switcher Row */}
                                   <div className="flex items-center justify-between px-2">
                                        <span className="text-xs font-bold text-slate-500">Language / ភាសា</span>
                                        <div className="flex items-center space-x-2">
                                             <button
                                                  onClick={() => setLanguage('en')}
                                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all ${language === 'en' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'}`}
                                             >
                                                  EN
                                             </button>
                                             <button
                                                  onClick={() => setLanguage('kh')}
                                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all ${language === 'kh' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'}`}
                                             >
                                                  KH
                                             </button>
                                             <button
                                                  onClick={() => setLanguage('zh')}
                                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all ${language === 'zh' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'}`}
                                             >
                                                  ZH
                                             </button>
                                        </div>
                                   </div>

                                   <button
                                        onClick={() => { onNavigate('/owner/login'); setMobileMenuOpen(false); }}
                                        className="w-full flex items-center justify-center space-x-2 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-slate-950 transition-all py-3 px-4 rounded-[5px] hover:bg-slate-100 cursor-pointer bg-transparent border-none active:scale-[0.98]"
                                   >
                                        <FiLogIn className="w-4 h-4" />
                                        <span>{t('navbar.merchant_login')}</span>
                                   </button>
                                   <button
                                        onClick={() => { onNavigate('/register-owner'); setMobileMenuOpen(false); }}
                                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 px-4 rounded-[5px] font-black text-xs transition-all cursor-pointer shadow-sm active:scale-[0.98] duration-200 flex items-center justify-center space-x-2 tracking-widest border-none"
                                   >
                                        <span>{t('navbar.store_register')}</span>
                                        <FiArrowRight className="w-4 h-4" />
                                   </button>
                              </div>
                         </aside>
                    </div>
               )}

               {/* ── MAIN CONTENT AREA ───────────────── */}
               <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

                    {/* Render page component based on active routing */}
                    <div className="flex-1">
                         {currentPath === '/about' && <AboutComponent />}
                         {currentPath === '/stores' && <StoresComponent onNavigate={onNavigate} />}
                         {currentPath === '/features' && <FeaturesComponent />}
                         {currentPath === '/pricing' && <PricingComponent onNavigate={onNavigate} />}
                         {currentPath === '/join' && <JoinComponent onNavigate={onNavigate} />}
                         {currentPath === '/register-owner' && <StoreRegister onNavigate={onNavigate} />}

                         {/* Home / Fallback view: Show sections in single page scroll-down style */}
                         {(currentPath === '/' || (!navLinks.some(l => l.path === currentPath) && currentPath !== '/register-owner')) && (
                              <main className="flex-1">
                                   <AboutComponent />
                                   <FeaturesComponent />
                                   <PricingComponent onNavigate={onNavigate} />
                                   <JoinComponent onNavigate={onNavigate} />
                              </main>
                         )}
                    </div>

                    {/* ── PREMIUM PLATFORM FOOTER ──────────────── */}
                    <footer className="bg-white dark:bg-[#020617] text-slate-500 py-20 border-t border-slate-200 dark:border-white/5 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
                         <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-16">

                              {/* Logo & Platform Info */}
                              <div className="space-y-6">
                                   <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-amber-500 rounded-[5px] flex items-center justify-center text-slate-950">
                                             <FiShoppingBag className="w-6 h-6" />
                                        </div>
                                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                             Prime <span className="text-amber-500">Website</span>
                                        </span>
                                   </div>
                                   <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
                                        Siem Reap's ultra-premium Multi-store Food Ordering & Management System Platform. Engineered for the next generation of culinary excellence.
                                   </p>
                                   <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/10 px-3 py-1.5 rounded-[5px] w-max ${footerSettings?.is_online ? 'text-amber-500' : 'text-slate-400'}`}>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${footerSettings?.is_online ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                                        <span>{footerSettings?.status_label || 'Platform Online'}</span>
                                   </div>
                              </div>

                              {/* Quick links */}
                              <div className="space-y-6">
                                   <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Platform</h4>
                                   <ul className="space-y-3 text-sm font-semibold">
                                        {(footerSettings?.platform_links || []).map((link, i) => (
                                             <li key={i}><a href={link.url} className="hover:text-amber-500 transition-colors">{link.label}</a></li>
                                        ))}
                                        {!footerSettings && (
                                             <>
                                                  <li><a href="#about" className="hover:text-amber-500 transition-colors">Merchant Panel</a></li>
                                                  <li><a href="#features" className="hover:text-amber-500 transition-colors">Isolated Outlets</a></li>
                                                  <li><a href="#stores" className="hover:text-amber-500 transition-colors">Digital Categories</a></li>
                                                  <li><a href="#join" className="hover:text-amber-500 transition-colors">Become a Partner</a></li>
                                             </>
                                        )}
                                   </ul>
                              </div>

                              {/* Top Vendors */}
                              <div className="space-y-6">
                                   <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Top Stores</h4>
                                   <ul className="space-y-3 text-sm font-semibold">
                                        {(footerSettings?.top_stores || []).map((link, i) => (
                                             <li key={i}>
                                                  <span
                                                       onClick={() => onNavigate(link.url)}
                                                       className="hover:text-amber-500 cursor-pointer transition-colors"
                                                  >
                                                       {link.label}
                                                  </span>
                                             </li>
                                        ))}
                                        {!footerSettings && (
                                             <>
                                                  <li><span onClick={() => onNavigate('/Food_Ordering_System')} className="hover:text-amber-500 cursor-pointer transition-colors">Food Ordering System</span></li>
                                                  <li><span onClick={() => onNavigate('/Chivorn_Store_kh')} className="hover:text-amber-500 cursor-pointer transition-colors">Chivorn Store kh</span></li>
                                             </>
                                        )}
                                   </ul>
                              </div>

                              {/* Merchant Support */}
                              <div className="space-y-6">
                                   <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Merchant Access</h4>
                                   <ul className="space-y-3 text-sm font-semibold">
                                        {(footerSettings?.merchant_access_links || []).map((link, i) => (
                                             <li key={i}>
                                                  <span
                                                       onClick={() => onNavigate(link.url)}
                                                       className="hover:text-amber-500 cursor-pointer transition-colors"
                                                  >
                                                       {link.label}
                                                  </span>
                                             </li>
                                        ))}
                                        {!footerSettings && (
                                             <>
                                                  <li><span onClick={() => onNavigate('/owner/login')} className="hover:text-amber-500 cursor-pointer transition-colors">Owner login portal</span></li>
                                                  <li><span onClick={() => onNavigate('/owner')} className="hover:text-amber-500 cursor-pointer transition-colors">Store dashboard</span></li>
                                             </>
                                        )}
                                   </ul>
                              </div>

                         </div>

                         <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5 mt-16 pt-10 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-6">
                              <span>&copy; {new Date().getFullYear()} {footerSettings?.copyright_text || 'Prime Website Platform. All Rights Reserved.'}</span>
                              <div className="flex items-center justify-center space-x-6">
                                   <a href={footerSettings?.terms_url || '#'} className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Use</a>
                                   <span className="text-slate-300 dark:text-slate-800">&bull;</span>
                                   <a href={footerSettings?.privacy_policy_url || '#'} className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
                              </div>
                         </div>
                    </footer>

               </div>
          </div>
     );
};
