import React from 'react';
import {
  FiGrid,
  FiUsers,
  FiSliders,
  FiCreditCard,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiBookOpen,
} from 'react-icons/fi';
import { useTranslation } from '../lang/i18n';

type TabId = 'overview' | 'merchants' | 'subscriptions' | 'payments' | 'settings' | 'assign-template';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  mobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  onLogout,
  mobile = false,
}) => {
  const { t } = useTranslation();

  // Left side main categories list
  const leftMenuItems = [
    { id: 'overview', label: 'Platform Stats', icon: <FiGrid className="w-[18px] h-[18px]" /> },
    { id: 'merchants', label: 'All Merchants', icon: <FiUsers className="w-[18px] h-[18px]" /> },
    { id: 'assign-template', label: 'Assign Template', icon: <FiBookOpen className="w-[18px] h-[18px]" /> },
    { id: 'subscriptions', label: 'Package Toggles', icon: <FiSliders className="w-[18px] h-[18px]" /> },
    { id: 'payments', label: 'Gross Revenue', icon: <FiCreditCard className="w-[18px] h-[18px]" /> },
    { id: 'settings', label: 'Global Settings', icon: <FiSettings className="w-[18px] h-[18px]" /> },
  ];

  const handleLeftItemClick = (id: TabId) => {
    setActiveTab(id);
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };

  const showSubmenu = !sidebarCollapsed || mobile;

  return (
    <div className="flex h-full w-full bg-transparent select-none">
      
      {/* ── Left Column: Main Icon Bar ──────────────────────── */}
      <div className="w-[70px] flex flex-col items-center border-r border-slate-100 shrink-0 h-full bg-transparent py-4 justify-between">
        
        <div className="flex flex-col items-center w-full gap-5">
          {/* Circular Brand Logo */}
          <div className="w-10 h-10 rounded-[5px] bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white font-black text-base shadow-sm overflow-hidden">
             B
          </div>

          {/* Vertical Menu Icons */}
          <div className="flex flex-col items-center w-full gap-2 px-2 mt-4">
            {leftMenuItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleLeftItemClick(item.id as TabId)}
                  title={item.label}
                  className={`w-11 h-11 flex items-center justify-center rounded-[7px] transition-all duration-200 border-none cursor-pointer relative group ${
                    isActive 
                      ? 'bg-primary text-white shadow-md shadow-orange-500/25' 
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50 bg-transparent'
                  }`}
                >
                  {item.icon}
                  {/* Tooltip on Hover */}
                  <div className="absolute left-[54px] bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[300] shadow-sm">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions: Logout */}
        <div className="px-2 w-full flex flex-col items-center gap-4">
          <button
            onClick={onLogout}
            title={t('sidebar.sign_out')}
            className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[10px] transition-all border-none bg-transparent cursor-pointer"
          >
            <FiLogOut className="w-[18px] h-[18px]" />
          </button>
        </div>

      </div>

      {/* ── Right Column: Submenu Panel ──────────────────────── */}
      <div 
        className={`flex flex-col bg-transparent h-full transition-[width] duration-300 ease-in-out overflow-hidden ${
          showSubmenu ? 'w-[200px]' : 'w-0'
        }`}
      >
        <div className="w-[200px] h-full flex flex-col shrink-0">
        {/* Panel Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-50 shrink-0">
          <span className="text-[14px] font-black text-slate-800 capitalize tracking-tight">
            {leftMenuItems.find(m => m.id === activeTab)?.label || activeTab}
          </span>
          {!mobile && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1 rounded-[5px] hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent"
              title="Collapse Menu"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation list based on Active Category */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2 custom-scrollbar">
          
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
              Management
            </p>

            {leftMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

        </div>
        </div>

      </div>

    </div>
  );
};
