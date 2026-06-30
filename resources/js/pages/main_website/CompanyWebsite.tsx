import React, { useState, useEffect } from 'react';
import { FiShoppingBag, FiMenu, FiX, FiHome, FiLayers, FiDollarSign, FiUsers, FiArrowRight, FiLogIn } from 'react-icons/fi';
import { AboutComponent } from './components/AboutComponent';
import { StoresComponent } from './components/StoresComponent';
import { FeaturesComponent } from './components/FeaturesComponent';
import { PricingComponent } from './components/PricingComponent';
import { JoinComponent } from './components/JoinComponent';
import { OwnerRegisterComponent } from './components/OwnerRegisterComponent';
import { SettingService } from '../admin_manage/services/SettingService';
import type { PlatformFooterSettings } from '../admin_manage/services/SettingService';

interface CompanyWebsiteProps {
  onNavigate: (to: string) => void;
  currentPath?: string;
}

export const CompanyWebsite: React.FC<CompanyWebsiteProps> = ({
  onNavigate,
  currentPath = '/'
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = 'light';
  const [footerSettings, setFooterSettings] = useState<PlatformFooterSettings | null>(null);

  useEffect(() => {
    const loadFooter = async () => {
      const data = await SettingService.getFooterSettings();
      setFooterSettings(data);
    };
    loadFooter();
  }, []);

  const navLinks = [
    { path: '/', label: 'Home', icon: <FiHome /> },
    { path: '/about', label: 'Platform', icon: <FiLayers /> },
    { path: '/features', label: 'Features', icon: <FiLayers /> },
    { path: '/pricing', label: 'Pricing', icon: <FiDollarSign /> },
    { path: '/join', label: 'Partner', icon: <FiUsers /> },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-8 px-6 justify-between bg-white dark:bg-[#020617]">
      <div className="space-y-8 flex-1">
        {/* Logo Area */}
        <div
          onClick={() => { onNavigate('/'); setSidebarOpen(false); }}
          className="flex items-center space-x-3 cursor-pointer group mb-12 select-none"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-[5px] flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 duration-300 transition-all">
            <FiShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white block">
              {footerSettings?.platform_name.split(' ')[0] || 'Prime'} <span className="text-amber-500">{footerSettings?.platform_name.split(' ').slice(1).join(' ') || 'Website'}</span>
            </span>
            <span className="block text-[8px] font-black text-amber-500/60 tracking-[0.2em] uppercase">
              Premium Platform
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navLinks.map(link => {
            const isActive = currentPath === link.path || (link.path === '/' && currentPath === '/');
            const isHomeActive = link.path === '/' && (currentPath === '/' || !navLinks.some(l => l.path === currentPath));

            return (
              <button
                key={link.path}
                onClick={() => { onNavigate(link.path); setSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[5px] transition-all duration-200 cursor-pointer border-none text-sm font-bold active:scale-[0.98] ${isActive || (link.path === '/' && isHomeActive)
                    ? 'text-amber-500 bg-amber-500/10 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
        <div className="space-y-2.5">
          <button
            onClick={() => onNavigate('/owner/login')}
            className="w-full flex items-center justify-center space-x-2 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-slate-955 dark:hover:text-white transition-all py-3 px-4 rounded-[5px] hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer bg-transparent border-none active:scale-[0.98]"
          >
            <FiLogIn className="w-4 h-4" />
            <span>MERCHANT LOGIN</span>
          </button>
          <button
            onClick={() => onNavigate('/owner')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 px-4 rounded-[5px] font-black text-xs transition-all cursor-pointer shadow-sm active:scale-[0.98] duration-200 flex items-center justify-center space-x-2 tracking-widest border-none hover:shadow-lg hover:shadow-amber-500/15"
          >
            <span>JOIN AS STORE</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={theme}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-850 dark:text-slate-300 flex font-sans selection:bg-amber-500/10 selection:text-amber-500 transition-colors duration-300">

        {/* ── DESKTOP SIDEBAR ─────────────────── */}
        <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#020617] border-r border-slate-200 dark:border-white/5 z-50 transition-colors duration-300">
          <SidebarContent />
        </aside>

        {/* ── MOBILE HEADER ───────────────────── */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 py-4 flex items-center justify-between transition-colors duration-300">
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-amber-500 rounded-[5px] flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <FiShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {footerSettings?.platform_name.split(' ')[0] || 'Prime'} <span className="text-amber-500">{footerSettings?.platform_name.split(' ').slice(1).join(' ') || 'Website'}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-[5px] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-slate-100/5 dark:bg-white/5 cursor-pointer border-none active:scale-[0.98] duration-150"
              title="Open navigation menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* ── MOBILE DRAWER ───────────────────── */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-[#020617] border-r border-slate-200 dark:border-white/10 shadow-2xl animate-slide-in-right transition-colors duration-300">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent border-none cursor-pointer"
              >
                <FiX className="w-6 h-6" />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* ── MAIN CONTENT AREA ───────────────── */}
        <div className="flex-1 flex flex-col lg:ml-72 min-w-0 overflow-x-hidden">

          <div className="pt-20 lg:pt-0"> {/* Offset for mobile header */}
            {/* ── PAGE CONTENT based on currentPath ──────── */}
            {currentPath === '/about' && <AboutComponent />}
            {currentPath === '/stores' && <StoresComponent onNavigate={onNavigate} />}
            {currentPath === '/features' && <FeaturesComponent />}
            {currentPath === '/pricing' && <PricingComponent onNavigate={onNavigate} />}
            {currentPath === '/join' && <JoinComponent onNavigate={onNavigate} />}
            {currentPath === '/register-owner' && <OwnerRegisterComponent onNavigate={onNavigate} />}

            {/* ── HOME: Show all sections when on / ───────── */}
            {(currentPath === '/' || (!navLinks.some(l => l.path === currentPath) && currentPath !== '/register-owner')) && (
              <main className="flex-1">
                <AboutComponent />
                <FeaturesComponent />
                <PricingComponent onNavigate={onNavigate} />
                <JoinComponent onNavigate={onNavigate} />
              </main>
            )}
          </div>

          {/* ========================================== */}
          {/* ── PREMIUM PLATFORM FOOTER ──────────────── */}
          {/* ========================================== */}
          <footer className="mt-auto bg-white dark:bg-[#020617] text-slate-500 py-20 border-t border-slate-200 dark:border-white/5 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
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
    </div>
  );
};
