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

  // Determine active left column category based on activeTab
  let activeCategory = 'stats';
  if (['overview', 'payments'].includes(activeTab)) {
    activeCategory = 'stats';
  } else if (['merchants', 'assign-template', 'subscriptions'].includes(activeTab)) {
    activeCategory = 'merchants_group';
  } else if (['settings'].includes(activeTab)) {
    activeCategory = 'settings_group';
  }

  // Left side main categories list
  const leftMenuItems = [
    { id: 'stats', label: 'Stats Overview', icon: <FiGrid className="w-[18px] h-[18px]" /> },
    { id: 'merchants_group', label: 'Merchants & Plans', icon: <FiUsers className="w-[18px] h-[18px]" /> },
    { id: 'settings_group', label: 'Global Configuration', icon: <FiSettings className="w-[18px] h-[18px]" /> },
  ];

  const handleLeftItemClick = (categoryId: string) => {
    if (categoryId === 'stats') {
      setActiveTab('overview');
    } else if (categoryId === 'merchants_group') {
      setActiveTab('merchants');
    } else if (categoryId === 'settings_group') {
      setActiveTab('settings');
    }
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };

  const getSubmenuItems = () => {
    switch (activeCategory) {
      case 'stats':
        return [
          { id: 'overview', label: 'Platform Stats', icon: <FiGrid className="w-[14px] h-[14px]" /> },
          { id: 'payments', label: 'Gross Revenue', icon: <FiCreditCard className="w-[14px] h-[14px]" /> },
        ];
      case 'merchants_group':
        return [
          { id: 'merchants', label: 'All Merchants', icon: <FiUsers className="w-[14px] h-[14px]" /> },
          { id: 'assign-template', label: 'Assign Template', icon: <FiBookOpen className="w-[14px] h-[14px]" /> },
          { id: 'subscriptions', label: 'Package Toggles', icon: <FiSliders className="w-[14px] h-[14px]" /> },
        ];
      case 'settings_group':
        return [
          { id: 'settings', label: 'Global Settings', icon: <FiSettings className="w-[14px] h-[14px]" /> },
        ];
      default:
        return [];
    }
  };

  const showSubmenu = !sidebarCollapsed || mobile;
  const submenuItems = getSubmenuItems();

  return (
    <div className="flex h-full w-full bg-transparent select-none">
      <style>{`
        .child-sidebar-container button {
          color: #e0e7ff !important;
          transition: all 0.2s ease-in-out !important;
        }
        .child-sidebar-container button svg {
          color: rgba(224, 231, 255, 0.8) !important;
          transition: color 0.2s ease-in-out !important;
        }
        .child-sidebar-container button:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
        .child-sidebar-container button:hover svg {
          color: #ffffff !important;
        }
        .child-sidebar-container button[class*="bg-white/10"] {
          background-color: rgba(255, 255, 255, 0.12) !important;
          color: #ffffff !important;
          font-weight: 800 !important;
        }
        .child-sidebar-container button[class*="bg-white/10"] svg {
          color: #ffffff !important;
        }
        .child-sidebar-header {
          border-color: rgba(224, 231, 255, 0.1) !important;
        }
      `}</style>
      
      {/* ── Left Column: Main Icon Bar ──────────────────────── */}
      <div 
        className="w-[70px] flex flex-col items-center border-r shrink-0 h-full py-4 justify-between"
        style={{
          backgroundColor: '#303f9f',
          borderColor: 'rgba(224, 231, 255, 0.1)'
        }}
      >
        
        <div className="flex flex-col items-center w-full gap-5">
          {/* Circular Brand Logo */}
          <div 
            className="w-10 h-10 rounded-[5px] flex items-center justify-center text-white font-black text-base shadow-sm overflow-hidden border"
            style={{
              backgroundColor: '#3f51b5',
              borderColor: 'rgba(224, 231, 255, 0.3)'
            }}
          >
             B
          </div>
 
          {/* Vertical Menu Icons */}
          <div className="flex flex-col items-center w-full gap-2 px-2 mt-4">
            {leftMenuItems.map(item => {
              const isActive = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleLeftItemClick(item.id)}
                  title={item.label}
                  className={`w-11 h-11 flex items-center justify-center rounded-[7px] transition-all duration-200 border-none cursor-pointer relative group ${
                    isActive 
                      ? 'text-white shadow-md' 
                      : 'text-indigo-200/80 hover:text-white hover:bg-white/10 bg-transparent'
                  }`}
                  style={isActive ? {
                    backgroundColor: '#ff6b35',
                    boxShadow: '0 4px 12px rgba(255, 107, 53, 0.25)'
                  } : undefined}
                >
                  {item.icon}
                  {/* Tooltip on Hover */}
                  <div 
                    className="absolute left-[54px] text-[10px] font-bold px-2 py-1 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[300] shadow-sm"
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff'
                    }}
                  >
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-[#0f172a]" />
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
            className="w-11 h-11 flex items-center justify-center text-indigo-200/80 hover:text-rose-455 hover:bg-rose-500/10 rounded-[10px] transition-all border-none bg-transparent cursor-pointer"
          >
            <FiLogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
 
      </div>
 
      {/* ── Right Column: Submenu Panel ──────────────────────── */}
      <div 
        className="flex flex-col h-full transition-[width] duration-300 ease-in-out overflow-hidden child-sidebar-container"
        style={{
          width: showSubmenu ? '200px' : '0',
          backgroundColor: '#3f51b5'
        }}
      >
        <div className="w-[200px] h-full flex flex-col shrink-0">
          {/* Panel Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b shrink-0 child-sidebar-header">
            <span className="text-[14px] font-black text-white capitalize tracking-tight">
              {leftMenuItems.find(m => m.id === activeCategory)?.label || activeCategory}
            </span>
            {!mobile && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded-[5px] hover:bg-white/10 text-indigo-200 hover:text-white cursor-pointer border-none bg-transparent"
                title="Collapse Menu"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
 
          {/* Navigation list */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2 custom-scrollbar">
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-2">
                Management
              </p>
 
              {submenuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabId);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer relative ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white font-extrabold'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {activeTab === item.id && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-[4px]" style={{ backgroundColor: '#ff6b35' }} />
                  )}
                  <div className={`shrink-0 ${activeTab === item.id ? 'pl-2' : ''}`}>{item.icon}</div>
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
