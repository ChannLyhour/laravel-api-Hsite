import React, { useState, useEffect } from 'react';
import {
  FiLayers,
  FiShoppingBag,
  FiCheckSquare,
  FiUsers,
  FiStar,
  FiZap,
  FiSettings,
  FiLogOut,
  FiFileText,
  FiEdit,
  FiHome,
  FiSliders,
  FiLayout,
  FiChevronDown,
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiFolder,
  FiVolume2,
  FiTag,
  FiMessageSquare,
  FiMonitor,
  FiTruck,
  FiMapPin,
  FiBox,
  FiAlertTriangle,
  FiPlus,
  FiList,
  FiImage,
  FiDownload,
  FiShare2,
} from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import type { StoreRow } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';
import { ordersService } from '@/api/owner/orders';
import { stockManagementService } from '@/api/owner/stockManagement';
import { useTranslation } from '../lang/i18n';
import { getStoreUrl, slugifyStoreName } from '@Security/Owner/configUrl';
import { defaultPlanFeatures } from '@/pages/admin_manage/components/subscriptions/index';
import CopyShareLink from '../components/Quick_Links/copy_share_link';
import VisitLiveStore from '../components/Quick_Links/visit_live_store';
import LocalShopSale from '../components/Quick_Links/Local_Shop_Sale';

type TabId = 'overview' | 'pos' | 'categories' | 'sub-categories' | 'sub-sub-categories' | 'brands' | 'product-badges' | 'menu-items' | 'orders' | 'orders-pending' | 'orders-processing' | 'orders-delivering' | 'orders-completed' | 'orders-cancelled' | 'posts' | 'pages-builder' | 'settings' | 'policies' | 'attributes' | 'theme' | 'customers' | 'customer-reviews' | 'sharinglink' | 'social-media' | 'settings-delivery-methods' | 'settings-delivery-zones' | 'settings-thirdparty-payment' | 'settings-thirdparty-firebase' | 'settings-thirdparty-pusher' | 'settings-thirdparty-marketing' | 'settings-thirdparty-oauth' | 'settings-thirdparty-telegram' | 'settings-thirdparty-gmailotp' | 'marketing-banners' | 'marketing-coupons' | 'marketing-flash-deals' | 'marketing-featured-deal' | 'marketing-clearance-sale' | 'marketing-send-notification' | 'marketing-push-notification' | 'marketing-announcement' | 'partner-stores' | 'inbox' | 'profile-owner' | 'customize-system' | 'stock-overview' | 'stock-items' | 'stock-low' | 'stock-movements' | 'stock-fifo' | 'upgrade-plan' | 'catalog-limited-stock' | 'catalog-restock-requests' | 'catalog-bulk-import' | 'catalog-vendor-new' | 'catalog-vendor-update' | 'catalog-vendor-approved' | 'catalog-vendor-denied' | 'catalog-product-gallery';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  profile: any;
  stores?: StoreRow | null;
  isCategorySetupOpen: boolean;
  setIsCategorySetupOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
  mobile?: boolean;
  unreadChatCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  profile,
  stores,
  isCategorySetupOpen,
  setIsCategorySetupOpen,
  setIsMobileMenuOpen,
  onLogout,
  mobile = false,
  unreadChatCount = 0,
}) => {
  const { t } = useTranslation();

  const getActivePlanFeatures = (): string[] => {
    const tier = stores?.subscription_tier || 'free';
    try {
      const saved = localStorage.getItem('biteflow_plan_features');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[tier]) return parsed[tier];
      }
    } catch (_) {}
    
    return defaultPlanFeatures[tier as keyof typeof defaultPlanFeatures] || defaultPlanFeatures.free;
  };

  const isFeatureEnabled = (featureName: string): boolean => {
    const activeFeatures = getActivePlanFeatures();
    return activeFeatures.includes(featureName);
  };

  const [orderCounts, setOrderCounts] = useState({
    pending: 0,
    processing: 0,
    delivering: 0,
    complete: 0,
    canceled: 0,
  });
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [totalProductCount, setTotalProductCount] = useState<number>(0);

  const [isOffersDealsOpen, setIsOffersDealsOpen] = useState(false);

  // Cookie helpers for theme customization
  const setCookie = (name: string, value: string, days = 365) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
  };

  const getCookie = (name: string): string => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : '';
  };

  const [sidebarBg, setSidebarBg] = useState(() => getCookie('sidebar_menu_bg') || '#3f51b5');
  const [sidebarLeftBg, setSidebarLeftBg] = useState(() => getCookie('sidebar_left_bg') || '#303f9f');
  const [sidebarTextColor, setSidebarTextColor] = useState(() => getCookie('sidebar_text_color') || '#e0e7ff');
  const [sidebarActiveColor, setSidebarActiveColor] = useState(() => getCookie('sidebar_active_color') || '#ff6b35');
  const [sidebarLabelBg, setSidebarLabelBg] = useState(() => getCookie('sidebar_label_bg') || '#0f172a');
  const [sidebarLabelTextColor, setSidebarLabelTextColor] = useState(() => getCookie('sidebar_label_text_color') || '#ffffff');
  const [sidebarChildBg, setSidebarChildBg] = useState(() => getCookie('sidebar_child_bg') || '#3f51b5');
  const [sidebarChildTextColor, setSidebarChildTextColor] = useState(() => getCookie('sidebar_child_text') || '#e0e7ff');
  const [sidebarChildActiveBg, setSidebarChildActiveBg] = useState(() => getCookie('sidebar_child_active_bg') || '#ffffff');
  const [sidebarChildActiveTextColor, setSidebarChildActiveTextColor] = useState(() => getCookie('sidebar_child_active_text') || '#ffffff');
  const [dashboardMainBg, setDashboardMainBg] = useState(() => getCookie('dashboard_main_bg') || '#F4F7FE');
  const [dashboardH2Color, setDashboardH2Color] = useState(() => getCookie('dashboard_h2_color') || '#1e293b');
  const [dashboardCardBg, setDashboardCardBg] = useState(() => getCookie('dashboard_card_bg') || '#ffffff');
  const [dashboardCardBorder, setDashboardCardBorder] = useState(() => getCookie('dashboard_card_border') || '#e2e8f0');
  const [dashboardCardText, setDashboardCardText] = useState(() => getCookie('dashboard_card_text') || '#334155');
  const [dashboardHeaderBg, setDashboardHeaderBg] = useState(() => getCookie('dashboard_header_bg') || '#ffffff');
  const [dashboardHeaderBorder, setDashboardHeaderBorder] = useState(() => getCookie('dashboard_header_border') || '#e2e8f0');
  const [dashboardHeaderText, setDashboardHeaderText] = useState(() => getCookie('dashboard_header_text') || '#334155');

  // Set theme properties globally so that any parent elements (like the aside wrappers) can read them
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--sidebar-menu-bg', sidebarBg);
    root.style.setProperty('--sidebar-left-bg', sidebarLeftBg);
    root.style.setProperty('--sidebar-text-color', sidebarTextColor);
    root.style.setProperty('--sidebar-active-color', sidebarActiveColor);
    root.style.setProperty('--sidebar-label-bg', sidebarLabelBg);
    root.style.setProperty('--sidebar-label-text-color', sidebarLabelTextColor);
    root.style.setProperty('--sidebar-child-bg', sidebarChildBg);
    root.style.setProperty('--sidebar-child-text-color', sidebarChildTextColor);
    root.style.setProperty('--sidebar-child-active-bg', sidebarChildActiveBg);
    root.style.setProperty('--sidebar-child-active-text-color', sidebarChildActiveTextColor);
    root.style.setProperty('--dashboard-main-bg', dashboardMainBg);
    root.style.setProperty('--dashboard-h2-color', dashboardH2Color);
    root.style.setProperty('--dashboard-card-bg', dashboardCardBg);
    root.style.setProperty('--dashboard-card-border', dashboardCardBorder);
    root.style.setProperty('--dashboard-card-text', dashboardCardText);
    root.style.setProperty('--dashboard-header-bg', dashboardHeaderBg);
    root.style.setProperty('--dashboard-header-border', dashboardHeaderBorder);
    root.style.setProperty('--dashboard-header-text', dashboardHeaderText);
  }, [
    sidebarBg,
    sidebarLeftBg,
    sidebarTextColor,
    sidebarActiveColor,
    sidebarLabelBg,
    sidebarLabelTextColor,
    sidebarChildBg,
    sidebarChildTextColor,
    sidebarChildActiveBg,
    sidebarChildActiveTextColor,
    dashboardMainBg,
    dashboardH2Color,
    dashboardCardBg,
    dashboardCardBorder,
    dashboardCardText,
    dashboardHeaderBg,
  ]);

  useEffect(() => {
    const fetchPlanFeatures = async () => {
      try {
        const res = await fetch('/api/subscriptions/features');
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('biteflow_plan_features', JSON.stringify(data));
        }
      } catch (_) {}
    };
    fetchPlanFeatures();
  }, []);

  const handleSaveTheme = () => {
    setCookie('sidebar_menu_bg', sidebarBg);
    setCookie('sidebar_left_bg', sidebarLeftBg);
    setCookie('sidebar_text_color', sidebarTextColor);
    setCookie('sidebar_active_color', sidebarActiveColor);
    setCookie('sidebar_label_bg', sidebarLabelBg);
    setCookie('sidebar_label_text_color', sidebarLabelTextColor);
    setCookie('sidebar_child_bg', sidebarChildBg);
    setCookie('sidebar_child_text', sidebarChildTextColor);
    setCookie('sidebar_child_active_bg', sidebarChildActiveBg);
    setCookie('sidebar_child_active_text', sidebarChildActiveTextColor);
    setCookie('dashboard_main_bg', dashboardMainBg);
    setCookie('dashboard_h2_color', dashboardH2Color);
    setCookie('dashboard_header_bg', dashboardHeaderBg);
    setCookie('dashboard_header_border', dashboardHeaderBorder);
    setCookie('dashboard_header_text', dashboardHeaderText);
    toast.success('Sidebar layout colors saved to cookies!');
  };

  const handleResetTheme = () => {
    setSidebarBg('#3f51b5');
    setSidebarLeftBg('#303f9f');
    setSidebarTextColor('#e0e7ff');
    setSidebarActiveColor('#ff6b35');
    setSidebarLabelBg('#0f172a');
    setSidebarLabelTextColor('#ffffff');
    setSidebarChildBg('#3f51b5');
    setSidebarChildTextColor('#e0e7ff');
    setSidebarChildActiveBg('#ffffff');
    setSidebarChildActiveTextColor('#ffffff');
    setDashboardMainBg('#F4F7FE');
    setDashboardH2Color('#1e293b');
    setDashboardHeaderBg('#ffffff');
    setDashboardHeaderBorder('#e2e8f0');
    setDashboardHeaderText('#334155');
    setCookie('sidebar_menu_bg', '', -1);
    setCookie('sidebar_left_bg', '', -1);
    setCookie('sidebar_text_color', '', -1);
    setCookie('sidebar_active_color', '', -1);
    setCookie('sidebar_label_bg', '', -1);
    setCookie('sidebar_label_text_color', '', -1);
    setCookie('sidebar_child_bg', '', -1);
    setCookie('sidebar_child_text', '', -1);
    setCookie('sidebar_child_active_bg', '', -1);
    setCookie('sidebar_child_active_text', '', -1);
    setCookie('dashboard_main_bg', '', -1);
    setCookie('dashboard_h2_color', '', -1);
    setCookie('dashboard_header_bg', '', -1);
    setCookie('dashboard_header_border', '', -1);
    setCookie('dashboard_header_text', '', -1);
    toast.success('Sidebar layout colors reset to default!');
  };

  // Auto-expand offers & deals sub-menu if an inner tab is active
  useEffect(() => {
    if (['marketing-coupons', 'marketing-flash-deals', 'marketing-featured-deal', 'marketing-clearance-sale'].includes(activeTab)) {
      setIsOffersDealsOpen(true);
    }
  }, [activeTab]);

  useEffect(() => {
    const saved = localStorage.getItem('selected_owner_id');
    const ownerId = profile?.user?.role === 'admin'
      ? (saved ? (isNaN(Number(saved)) ? saved : parseInt(saved, 10)) : (profile?.user?.hashid || profile?.user?.id))
      : (profile?.user?.hashid || profile?.user?.id);

    ordersService.getMyStoreOrders(undefined, 0, 100, undefined, stores?.id, undefined, ownerId)
      .then(res => {
        if (res) {
          setOrderCounts({
            pending: res.filter(o => o.status === 'pending').length,
            processing: res.filter(o => o.status === 'processing').length,
            delivering: res.filter(o => o.status === 'delivering').length,
            complete: res.filter(o => o.status === 'complete').length,
            canceled: res.filter(o => o.status === 'canceled' || o.status === 'cancelled').length,
          });
        }
      })
      .catch(err => console.warn('Failed to load order counts in sidebar', err));

    stockManagementService.getStockItems(ownerId, stores?.id)
      .then(items => {
        if (items) {
          setTotalProductCount(items.length);
          let lowCount = 0;
          items.forEach(item => {
            const vars = item.variants || [];
            vars.forEach(v => {
              const threshold = v.low_stock_threshold ?? 5;
              const isOutOfStock = v.stock_qty === 0;
              const isLowStock = v.stock_qty <= threshold;
              if (isOutOfStock || isLowStock) {
                lowCount++;
              }
            });
          });
          setLowStockCount(lowCount);
        }
      })
      .catch(err => console.warn('Failed to load low stock count in sidebar', err));
  }, [profile, activeTab, stores?.id]);



  // Determine active category for left bar highlight
  const getActiveCategory = () => {
    if (activeTab === 'overview') return 'dashboard';
    if (activeTab === 'inbox') return 'inbox';
    if (activeTab.startsWith('orders')) return 'orders';
    if (['categories', 'sub-categories', 'sub-sub-categories', 'brands', 'product-badges', 'attributes', 'menu-items', 'catalog-limited-stock', 'catalog-restock-requests', 'catalog-bulk-import', 'catalog-vendor-new', 'catalog-vendor-update', 'catalog-vendor-approved', 'catalog-vendor-denied', 'catalog-product-gallery'].includes(activeTab)) return 'catalog';
    if (['stock-overview', 'stock-items', 'stock-low', 'stock-movements', 'stock-fifo'].includes(activeTab)) return 'stock';
    if (activeTab.startsWith('marketing')) return 'marketing';
    if (['customers', 'customer-reviews', 'partner-stores'].includes(activeTab)) return 'people';
    if (['settings-delivery-methods', 'settings-delivery-zones'].includes(activeTab)) return 'delivery';
    if (['theme', 'customize-system'].includes(activeTab)) return 'themes-layouts';
    if (['settings', 'policies', 'sharinglink', 'social-media', 'settings-thirdparty-payment', 'settings-thirdparty-firebase', 'settings-thirdparty-pusher', 'settings-thirdparty-marketing', 'settings-thirdparty-oauth', 'settings-thirdparty-telegram', 'settings-thirdparty-gmailotp'].includes(activeTab)) return 'settings';
    return 'dashboard';
  };

  const activeCategory = getActiveCategory();

  // Left side main categories list
  const leftMenuItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: <FiHome className="w-[18px] h-[18px]" /> },
    { id: 'catalog', label: t('sidebar.catalog'), icon: <FiLayers className="w-[18px] h-[18px]" /> },
    isFeatureEnabled('Inventory Management') ? { id: 'stock', label: 'Stock Manage', icon: <FiBox className="w-[18px] h-[18px]" /> } : null,
    { id: 'orders', label: t('sidebar.orders'), icon: <FiCheckSquare className="w-[18px] h-[18px]" /> },
    isFeatureEnabled('Customer Live Chat') ? { id: 'inbox', label: 'Customer Chat', icon: <FiMessageSquare className="w-[18px] h-[18px]" /> } : null,
    (isFeatureEnabled('Coupons & Discounts') || isFeatureEnabled('Email Campaigns')) ? { id: 'marketing', label: t('sidebar.marketing'), icon: <FiVolume2 className="w-[18px] h-[18px]" /> } : null,
    { id: 'people', label: t('sidebar.people'), icon: <FiUsers className="w-[18px] h-[18px]" /> },
    isFeatureEnabled('Delivery Zones') ? { id: 'delivery', label: 'Delivery', icon: <FiTruck className="w-[18px] h-[18px]" /> } : null,
    { id: 'themes-layouts', label: 'Themes & Layouts', icon: <FiLayout className="w-[18px] h-[18px]" /> },
    { id: 'settings', label: t('sidebar.settings'), icon: <FiSettings className="w-[18px] h-[18px]" /> },
  ].filter(Boolean) as { id: string; label: string; icon: React.ReactNode }[];

  const handleLeftItemClick = (id: string) => {
    switch (id) {
      case 'dashboard':
        setActiveTab('overview');
        setSidebarCollapsed(false);
        break;
      case 'orders':
        setActiveTab('orders-pending');
        setSidebarCollapsed(false);
        window.dispatchEvent(new CustomEvent('reset_order_view'));
        break;
      case 'inbox':
        setActiveTab('inbox');
        setSidebarCollapsed(true);
        setIsMobileMenuOpen(false);
        break;
      case 'catalog':
        localStorage.setItem('menu_items_view', 'list');
        window.dispatchEvent(new CustomEvent('menu_items_view_change', { detail: 'list' }));
        setActiveTab('menu-items');
        setSidebarCollapsed(false);
        setIsCategorySetupOpen(false);
        break;
      case 'stock':
        setActiveTab('stock-overview');
        setSidebarCollapsed(false);
        break;
      case 'marketing':
        setActiveTab('marketing-banners');
        setSidebarCollapsed(false);
        break;
      case 'people':
        setActiveTab('customers');
        setSidebarCollapsed(false);
        break;
      case 'delivery':
        setActiveTab('settings-delivery-methods');
        setSidebarCollapsed(false);
        break;
      case 'themes-layouts':
        setActiveTab('theme');
        setSidebarCollapsed(false);
        break;
      case 'settings':
        setActiveTab('settings');
        setSidebarCollapsed(false);
        break;
    }
  };

  const handleOrderTabClick = (tab: TabId) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('reset_order_view'));
  };

  const showSubmenu = (!sidebarCollapsed || mobile) && activeCategory !== 'inbox' && stores?.subsidebar_status !== false;



  return (
    <div 
      className="flex h-full w-full select-none"
      style={{
        backgroundColor: 'var(--sidebar-menu-bg, #3f51b5)',
        color: 'var(--sidebar-text-color, #e0e7ff)'
      }}
    >
      <style>{`
        .child-sidebar-container {
          background-color: var(--sidebar-child-bg, var(--sidebar-menu-bg, #3f51b5)) !important;
          color: var(--sidebar-child-text-color, var(--sidebar-text-color, #e0e7ff)) !important;
        }
        .child-sidebar-header {
          border-color: color-mix(in srgb, var(--sidebar-child-text-color, var(--sidebar-text-color, #e0e7ff)) 10%, transparent) !important;
        }
        .child-sidebar-header span {
          color: var(--sidebar-child-active-text-color, #ffffff) !important;
        }
        .child-sidebar-container p {
          color: color-mix(in srgb, var(--sidebar-child-text-color, var(--sidebar-text-color, #e0e7ff)) 55%, transparent) !important;
        }
        .child-sidebar-container button {
          color: var(--sidebar-child-text-color, var(--sidebar-text-color, #e0e7ff)) !important;
          background-color: transparent !important;
          transition: all 0.2s ease-in-out !important;
        }
        .child-sidebar-container button svg {
          color: color-mix(in srgb, var(--sidebar-child-text-color, var(--sidebar-text-color, #e0e7ff)) 80%, transparent) !important;
          transition: color 0.2s ease-in-out !important;
        }
        .child-sidebar-container button:hover {
          background-color: color-mix(in srgb, var(--sidebar-child-active-bg, #ffffff) 8%, transparent) !important;
          color: var(--sidebar-child-active-text-color, #ffffff) !important;
        }
        .child-sidebar-container button:hover svg {
          color: var(--sidebar-child-active-text-color, #ffffff) !important;
        }
        .child-sidebar-container button[class*="bg-white/10"] {
          background-color: color-mix(in srgb, var(--sidebar-child-active-bg, #ffffff) 12%, transparent) !important;
          color: var(--sidebar-child-active-text-color, #ffffff) !important;
          font-weight: 800 !important;
        }
        .child-sidebar-container button[class*="bg-white/10"] svg {
          color: var(--sidebar-child-active-text-color, #ffffff) !important;
        }
        .child-sidebar-divider {
          border-color: color-mix(in srgb, var(--sidebar-child-text-color, var(--sidebar-text-color, #e0e7ff)) 10%, transparent) !important;
        }
      `}</style>

      {/* ── Left Column: Main Icon Bar ──────────────────────── */}
      <div 
        className="w-[70px] flex flex-col items-center border-r shrink-0 h-full py-4 justify-between relative"
        style={{
          backgroundColor: 'var(--sidebar-left-bg, #303f9f)',
          borderColor: 'color-mix(in srgb, var(--sidebar-text-color, #e0e7ff) 10%, transparent)'
        }}
      >

        <div className="flex flex-col items-center w-full gap-5">
          {/* Circular Brand Logo */}
          <div 
            className="w-10 h-10 rounded-[5px] flex items-center justify-center text-white font-black text-base shadow-sm overflow-hidden border"
            style={{
              backgroundColor: 'var(--sidebar-menu-bg, #3f51b5)',
              borderColor: 'color-mix(in srgb, var(--sidebar-text-color, #e0e7ff) 30%, transparent)'
            }}
          >
            {stores?.logo_url ? (
              <img src={resolveImageUrl(stores.logo_url)} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              stores?.store_name ? stores.store_name.charAt(0).toUpperCase() : 'B'
            )}
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
                  className={`w-11 h-11 flex items-center justify-center rounded-[7px] transition-all duration-200 border-none cursor-pointer relative group ${isActive
                      ? 'text-white shadow-md'
                      : 'text-current/80 hover:text-white hover:bg-white/10 bg-transparent'
                    }`}
                  style={isActive ? {
                    backgroundColor: 'var(--sidebar-active-color, #ff6b35)',
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--sidebar-active-color, #ff6b35) 25%, transparent)'
                  } : undefined}
                >
                  {item.icon}
                  {item.id === 'inbox' && unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black px-1 min-w-[15px] h-3.5 rounded-full flex items-center justify-center border border-white leading-none shadow-sm shadow-red-500/25">
                      {unreadChatCount}
                    </span>
                  )}
                  {item.id === 'stock' && lowStockCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black px-1 min-w-[15px] h-3.5 rounded-full flex items-center justify-center border border-white leading-none shadow-sm shadow-red-500/25 animate-pulse">
                      {lowStockCount}
                    </span>
                  )}
                  {/* Tooltip on Hover */}
                  <div 
                    className="absolute left-[54px] text-[10px] font-bold px-2 py-1 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[300] shadow-sm"
                    style={{
                      backgroundColor: 'var(--sidebar-label-bg, #0f172a)',
                      color: 'var(--sidebar-label-text-color, #ffffff)'
                    }}
                  >
                    {item.label}
                    <div 
                      className="absolute top-1/2 -left-1 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4" 
                      style={{
                        borderRightColor: 'var(--sidebar-label-bg, #0f172a)'
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions: Logout */}
        <div className="px-2 w-full flex flex-col items-center gap-3 relative">

          <button
            onClick={onLogout}
            title={t('sidebar.sign_out')}
            className="w-11 h-11 flex items-center justify-center text-current/80 hover:text-rose-455 hover:bg-rose-500/10 rounded-[10px] transition-all border-none bg-transparent cursor-pointer"
          >
            <FiLogOut className="w-[18px] h-[18px]" />
          </button>
        </div>

      </div>

      {/* ── Right Column: Submenu Panel ──────────────────────── */}
      <div
        className={`flex flex-col h-full transition-[width] duration-300 ease-in-out overflow-hidden child-sidebar-container`}
        style={{
          width: showSubmenu ? '200px' : '0'
        }}
      >
        <div className="w-[200px] h-full flex flex-col shrink-0">
          {/* Panel Header */}
          <div 
            className="h-16 flex items-center justify-between px-4 border-b shrink-0 child-sidebar-header"
            style={{
              borderColor: 'color-mix(in srgb, var(--sidebar-text-color, #e0e7ff) 10%, transparent)'
            }}
          >
            <span className="text-[14px] font-black text-white capitalize tracking-tight">
              {activeCategory === 'dashboard' ? t('sidebar.dashboard') : leftMenuItems.find(m => m.id === activeCategory)?.label || activeCategory}
            </span>
          </div>

          {/* Navigation list based on Active Category */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2 custom-scrollbar">

            {activeCategory === 'dashboard' && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-2">
                    OVERVIEW
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer relative ${
                        activeTab === 'overview'
                          ? 'bg-white/10 text-white font-extrabold'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {activeTab === 'overview' && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-[4px]" style={{ backgroundColor: 'var(--sidebar-active-color, #ff6b35)' }} />
                        )}
                        <span className={activeTab === 'overview' ? 'pl-2' : ''}>Dashboard</span>
                      </div>
                    </button>

                    {isFeatureEnabled('POS System') && (
                      <button
                        onClick={() => { setActiveTab('pos'); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer relative ${
                          activeTab === 'pos'
                            ? 'bg-white/10 text-white font-extrabold'
                            : 'text-indigo-100 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {activeTab === 'pos' && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-[4px]" style={{ backgroundColor: 'var(--sidebar-active-color, #ff6b35)' }} />
                          )}
                          <span className={activeTab === 'pos' ? 'pl-2' : ''}>POS</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'catalog' && (
              <div className="space-y-3">
                {/* IN HOUSE PRODUCTS */}
                <div>
                  <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-1">
                    IN HOUSE PRODUCTS
                  </p>
                  <div className="space-y-0.5">
                    {/* Product List */}
                    <button
                      onClick={() => {
                        localStorage.setItem('menu_items_view', 'list');
                        window.dispatchEvent(new CustomEvent('menu_items_view_change', { detail: 'list' }));
                        setActiveTab('menu-items');
                        setIsMobileMenuOpen(false);
                      }}
                      title="Product List"
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                        activeTab === 'menu-items' && localStorage.getItem('menu_items_view') !== 'create'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiList className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Product List</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full shrink-0">
                        {totalProductCount}
                      </span>
                    </button>

                    {/* Add New Product */}
                    <button
                      onClick={() => {
                        localStorage.setItem('menu_items_view', 'create');
                        window.dispatchEvent(new CustomEvent('menu_items_view_change', { detail: 'create' }));
                        setActiveTab('menu-items');
                        setIsMobileMenuOpen(false);
                      }}
                      title="Add New Product"
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                        activeTab === 'menu-items' && localStorage.getItem('menu_items_view') === 'create'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiPlus className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Add New Product</span>
                      </div>
                    </button>

                    {/* Limited Stock */}
                    <button
                      onClick={() => {
                        setActiveTab('catalog-limited-stock');
                        setIsMobileMenuOpen(false);
                      }}
                      title="Limited Stock"
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                        activeTab === 'catalog-limited-stock'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiAlertTriangle className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Limited Stock</span>
                      </div>
                      {lowStockCount > 0 && (
                        <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
                          {lowStockCount}
                        </span>
                      )}
                    </button>

                    {/* Request Restock List */}
                    <button
                      onClick={() => {
                        setActiveTab('catalog-restock-requests');
                        setIsMobileMenuOpen(false);
                      }}
                      title="Request Restock List"
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                        activeTab === 'catalog-restock-requests'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiClock className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Request Restock List</span>
                      </div>
                    </button>

                    {/* Bulk Import */}
                    <button
                      onClick={() => {
                        setActiveTab('catalog-bulk-import');
                        setIsMobileMenuOpen(false);
                      }}
                      title="Bulk Import"
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                        activeTab === 'catalog-bulk-import'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiDownload className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Bulk Import</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* VENDOR PRODUCTS */}
                <div>
                  <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-1">
                    VENDOR PRODUCTS
                  </p>
                  <div className="space-y-0.5">
                    {/* New Products Request */}
                    <button
                      onClick={() => {
                        setActiveTab('catalog-vendor-new');
                        setIsMobileMenuOpen(false);
                      }}
                      title="New Products Request"
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                        activeTab === 'catalog-vendor-new'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiClock className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">New Products Request</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full shrink-0">
                        36
                      </span>
                    </button>

                    {/* Product Update Request */}
                    <button
                      onClick={() => {
                        setActiveTab('catalog-vendor-update');
                        setIsMobileMenuOpen(false);
                      }}
                      title="Product Update Request"
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                        activeTab === 'catalog-vendor-update'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiActivity className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Product Update Request</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white/25 text-white px-1.5 py-0.5 rounded-full shrink-0">
                        0
                      </span>
                    </button>

                    {/* Approved Products */}
                    <button
                      onClick={() => {
                        setActiveTab('catalog-vendor-approved');
                        setIsMobileMenuOpen(false);
                      }}
                      title="Approved Products"
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                        activeTab === 'catalog-vendor-approved'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiCheckCircle className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Approved Products</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full shrink-0">
                        172
                      </span>
                    </button>

                    {/* Denied Products */}
                    <button
                      onClick={() => {
                        setActiveTab('catalog-vendor-denied');
                        setIsMobileMenuOpen(false);
                      }}
                      title="Denied Products"
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${
                        activeTab === 'catalog-vendor-denied'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiXCircle className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Denied Products</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white/25 text-white px-1.5 py-0.5 rounded-full shrink-0">
                        0
                      </span>
                    </button>
                  </div>
                </div>

                {/* ORGANIZATION */}
                <div>
                  <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-1">
                    ORGANIZATION
                  </p>

                  <div className="space-y-0.5">
                    {/* Category Setup */}
                    <button
                      onClick={() => setIsCategorySetupOpen(!isCategorySetupOpen)}
                      title="Category Setup"
                      className="w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold text-indigo-100 hover:text-white hover:bg-white/5 border-none bg-transparent cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiLayers className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Category Setup</span>
                      </div>
                      <FiChevronDown 
                        className={`w-[14px] h-[14px] transition-transform duration-200 ${isCategorySetupOpen ? 'rotate-180' : 'text-indigo-200/80'}`} 
                        style={isCategorySetupOpen ? { color: 'var(--sidebar-active-color, #ff6b35)' } : undefined}
                      />
                    </button>

                    <div className={`grid transition-all duration-300 ease-in-out ${isCategorySetupOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                      <div className="overflow-hidden pl-3 space-y-0.5 border-l border-indigo-600/50 ml-5">
                        <button
                          onClick={() => { setActiveTab('categories'); setIsMobileMenuOpen(false); }}
                          title={t('sidebar.categories')}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'categories' ? 'text-white bg-white/10' : 'text-indigo-200/80 hover:text-white'
                            }`}
                        >
                          <FiFolder className="w-3.5 h-3.5 text-indigo-200/80 shrink-0" />
                          <span className="truncate">{t('sidebar.categories')}</span>
                        </button>
                        <button
                          onClick={() => { setActiveTab('sub-categories'); setIsMobileMenuOpen(false); }}
                          title={t('sidebar.sub_categories')}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'sub-categories' ? 'text-white bg-white/10' : 'text-indigo-200/80 hover:text-white'
                            }`}
                        >
                          <FiFolder className="w-3.5 h-3.5 text-indigo-200/80 shrink-0" />
                          <span className="truncate">{t('sidebar.sub_categories')}</span>
                        </button>
                        <button
                          onClick={() => { setActiveTab('sub-sub-categories'); setIsMobileMenuOpen(false); }}
                          title={t('sidebar.sub_sub_categories')}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'sub-sub-categories' ? 'text-white bg-white/10' : 'text-indigo-200/80 hover:text-white'
                            }`}
                        >
                          <FiFolder className="w-3.5 h-3.5 text-indigo-200/80 shrink-0" />
                          <span className="truncate">{t('sidebar.sub_sub_categories')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Brand Setup */}
                    <button
                      onClick={() => { setActiveTab('brands'); setIsMobileMenuOpen(false); }}
                      title={t('sidebar.brand_setup')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer mt-1 ${activeTab === 'brands'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiLayers className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">{t('sidebar.brand_setup')}</span>
                      </div>
                    </button>

                    {/* Attribute Setup */}
                    <button
                      onClick={() => { setActiveTab('attributes'); setIsMobileMenuOpen(false); }}
                      title={t('sidebar.product_attributes')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer mt-1 ${activeTab === 'attributes'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiSliders className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">{t('sidebar.product_attributes')}</span>
                      </div>
                    </button>

                    {/* Product Gallery */}
                    <button
                      onClick={() => { setActiveTab('catalog-product-gallery'); setIsMobileMenuOpen(false); }}
                      title="Product Gallery"
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer mt-1 ${activeTab === 'catalog-product-gallery'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FiImage className="w-4 h-4 text-indigo-200/80 shrink-0" />
                        <span className="truncate">Product Gallery</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'orders' && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-2">
                  {t('sidebar.order_management')}
                </p>
 
                <button
                  onClick={() => handleOrderTabClick('orders')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'orders'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiCheckSquare className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>{t('sidebar.all_orders')}</span>
                  </div>
                  <span className="bg-white/15 text-indigo-100 px-2 py-0.5 rounded-[4px] text-[10px] font-black">
                    {Object.values(orderCounts).reduce((a, b) => a + b, 0)}
                  </span>
                </button>
 
                <button
                  onClick={() => handleOrderTabClick('orders-pending')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'orders-pending'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiClock className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>{t('sidebar.pending')}</span>
                  </div>
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-[4px] text-[10px] font-black">
                    {orderCounts.pending}
                  </span>
                </button>
 
                <button
                  onClick={() => handleOrderTabClick('orders-processing')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'orders-processing'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiActivity className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>{t('sidebar.processing')}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-[4px] text-[10px] font-black">
                    {orderCounts.processing}
                  </span>
                </button>

                <button
                  onClick={() => handleOrderTabClick('orders-delivering')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'orders-delivering'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiTruck className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>{t('sidebar.delivering')}</span>
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-[4px] text-[10px] font-black">
                    {orderCounts.delivering}
                  </span>
                </button>
 
                <button
                  onClick={() => handleOrderTabClick('orders-completed')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'orders-completed'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiCheckCircle className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>{t('sidebar.completed')}</span>
                  </div>
                  <span className="bg-white/15 text-indigo-100 px-2 py-0.5 rounded-[4px] text-[10px] font-black">
                    {orderCounts.complete}
                  </span>
                </button>
 
                <button
                  onClick={() => handleOrderTabClick('orders-cancelled')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'orders-cancelled'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiXCircle className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>{t('sidebar.cancelled')}</span>
                  </div>
                  <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-[4px] text-[10px] font-black">
                    {orderCounts.canceled}
                  </span>
                </button>
              </div>
            )}

            {activeCategory === 'marketing' && (
              <div className="space-y-3">
                {isFeatureEnabled('Coupons & Discounts') && (
                  <div>
                    <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-1">
                      {t('sidebar.promotions')}
                    </p>
                    <button
                      onClick={() => { setActiveTab('marketing-banners'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'marketing-banners'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <FiLayers className="w-4 h-4 text-indigo-200/80 shrink-0" />
                      <span>{t('sidebar.banner_setup')}</span>
                    </button>

                    <div className="space-y-0.5 mt-1">
                      <button
                        onClick={() => setIsOffersDealsOpen(!isOffersDealsOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold text-indigo-100 hover:text-white hover:bg-white/5 border-none bg-transparent cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <FiShoppingBag className="w-4 h-4 text-indigo-200/80 shrink-0" />
                          <span>{t('sidebar.offers_deals')}</span>
                        </div>
                        <FiChevronDown 
                          className={`w-[14px] h-[14px] transition-transform duration-200 ${isOffersDealsOpen ? 'rotate-180' : 'text-indigo-200/80'}`} 
                          style={isOffersDealsOpen ? { color: 'var(--sidebar-active-color, #ff6b35)' } : undefined}
                        />
                      </button>

                      <div className={`grid transition-all duration-300 ease-in-out ${isOffersDealsOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                        <div className="overflow-hidden pl-3 space-y-0.5 border-l border-indigo-600/50 ml-5">
                          <button
                            onClick={() => { setActiveTab('marketing-coupons'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'marketing-coupons' ? 'text-white bg-white/10' : 'text-indigo-200/80 hover:text-white'
                              }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>{t('sidebar.coupon')}</span>
                          </button>
                          <button
                            onClick={() => { setActiveTab('marketing-flash-deals'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'marketing-flash-deals' ? 'text-white bg-white/10' : 'text-indigo-200/80 hover:text-white'
                              }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            <span>{t('sidebar.flash_deals')}</span>
                          </button>

                          <button
                            onClick={() => { setActiveTab('marketing-featured-deal'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'marketing-featured-deal' ? 'text-white bg-white/10' : 'text-indigo-200/80 hover:text-white'
                              }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                            <span>{t('sidebar.featured_deal')}</span>
                          </button>
                          <button
                            onClick={() => { setActiveTab('marketing-clearance-sale'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'marketing-clearance-sale' ? 'text-white bg-white/10' : 'text-indigo-200/80 hover:text-white'
                              }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{t('sidebar.clearance_sale')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isFeatureEnabled('Email Campaigns') && (
                  <div>
                    <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-1">
                      {t('sidebar.communication')}
                    </p>
                    <button
                      onClick={() => { setActiveTab('marketing-send-notification'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer mt-1 ${activeTab === 'marketing-send-notification'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <FiVolume2 className="w-4 h-4 text-indigo-200/80 shrink-0" />
                      <span>{t('sidebar.send_notification')}</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('marketing-push-notification'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer mt-1 ${activeTab === 'marketing-push-notification'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <FiSettings className="w-4 h-4 text-indigo-200/80 shrink-0" />
                      <span>{t('sidebar.push_notifications')}</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('marketing-announcement'); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer mt-1 ${activeTab === 'marketing-announcement'
                          ? 'bg-white/10 text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <FiVolume2 className="w-4 h-4 text-indigo-200/80 shrink-0" />
                      <span>{t('sidebar.announcement')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeCategory === 'people' && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-1">
                    {t('sidebar.people')}
                  </p>

                  <button
                    onClick={() => { setActiveTab('customers'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'customers'
                        ? 'bg-white/10 text-white'
                        : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <FiUsers className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>{t('sidebar.customer_list')}</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('customer-reviews'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'customer-reviews'
                        ? 'bg-white/10 text-white'
                        : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <FiStar className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>{t('sidebar.customer_reviews')}</span>
                  </button>
                </div>
              </div>
            )}

            {activeCategory === 'stock' && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                  <span>Stock Manage</span>
                  {lowStockCount > 0 && (
                    <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                      {lowStockCount} LOW
                    </span>
                  )}
                </p>

                <button
                  onClick={() => { setActiveTab('stock-overview'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'stock-overview'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiBox className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => { setActiveTab('stock-items'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'stock-items'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiLayers className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>Stock Items</span>
                </button>

                <button
                  onClick={() => { setActiveTab('stock-low'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'stock-low'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FiAlertTriangle className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>Low Stock Alerts</span>
                  </div>
                  {lowStockCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
                      {lowStockCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('stock-movements'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'stock-movements'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiActivity className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>Stock Movements</span>
                </button>


                <button
                  onClick={() => { setActiveTab('stock-fifo'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer mt-1 ${activeTab === 'stock-fifo'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiSliders className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>FIFO Batches</span>
                </button>
              </div>
            )}



            {activeCategory === 'delivery' && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-2">
                  Delivery
                </p>

                <button
                  onClick={() => { setActiveTab('settings-delivery-methods'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings-delivery-methods'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiTruck className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>Delivery Methods</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings-delivery-zones'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings-delivery-zones'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiMapPin className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>Delivery Zones</span>
                </button>
              </div>
            )}

            {activeCategory === 'themes-layouts' && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-2">
                  Themes & Layouts
                </p>

                <button
                  onClick={() => { setActiveTab('theme'); setIsMobileMenuOpen(false); }}
                  title={t('sidebar.storefront_themes')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'theme'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiLayout className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span className="truncate">{t('sidebar.storefront_themes')}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('customize-system'); setIsMobileMenuOpen(false); }}
                  title="Sidebar Theme Customizer"
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'customize-system'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiSliders className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span className="truncate">System Sidebar Customizer</span>
                </button>
              </div>
            )}

            {activeCategory === 'settings' && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-2">
                  {t('sidebar.settings')}
                </p>

                <button
                  onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiSettings className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>{t('sidebar.store_settings')}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('policies'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'policies'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiFileText className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>Store Policies</span>
                </button>

                <button
                  onClick={() => { setActiveTab('sharinglink'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'sharinglink'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiShare2 className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>Online Store</span>
                </button>

                <button
                  onClick={() => { setActiveTab('social-media'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'social-media'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiShare2 className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>{t('sidebar.social_media')}</span>
                </button>

                {/* 3RD PARTY SETUP section */}
                <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mt-4 mb-2">
                  {t('sidebar.third_party_setup')}
                </p>

                {isFeatureEnabled('QR Payment') && (
                  <button
                    onClick={() => { setActiveTab('settings-thirdparty-payment'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings-thirdparty-payment'
                        ? 'bg-white/10 text-white'
                        : 'text-indigo-100 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <FiSettings className="w-4 h-4 text-indigo-200/80 shrink-0" />
                    <span>{t('sidebar.payment_methods')}</span>
                  </button>
                )}

                <button
                  onClick={() => { setActiveTab('settings-thirdparty-firebase'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings-thirdparty-firebase'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiSettings className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>{t('sidebar.firebase')}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings-thirdparty-pusher'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings-thirdparty-pusher'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiSettings className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>{t('sidebar.pusher_config')}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings-thirdparty-marketing'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings-thirdparty-marketing'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiSettings className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>{t('sidebar.marketing_tools')}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings-thirdparty-oauth'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings-thirdparty-oauth'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiSettings className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>Social Login (OAuth)</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings-thirdparty-telegram'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings-thirdparty-telegram'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiSettings className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>Telegram Bot</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings-thirdparty-gmailotp'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-[12px] font-bold transition-all border-none bg-transparent cursor-pointer ${activeTab === 'settings-thirdparty-gmailotp'
                      ? 'bg-white/10 text-white'
                      : 'text-indigo-100 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <FiSettings className="w-4 h-4 text-indigo-200/80 shrink-0" />
                  <span>OTP Gmail / SMTP</span>
                </button>
              </div>
            )}

            {/* Quick shortcuts / actions */}
            {showSubmenu && (
              <div 
                className="pt-4 border-t space-y-1 child-sidebar-divider"
                style={{
                  borderColor: 'color-mix(in srgb, var(--sidebar-text-color, #e0e7ff) 10%, transparent)'
                }}
              >
                <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest px-3 mb-2">
                  Quick Links
                </p>

                <CopyShareLink stores={stores} profile={profile} />
                <VisitLiveStore stores={stores} profile={profile} />
                <LocalShopSale stores={stores} profile={profile} />
              </div>
            )}

          </div>

          {/* Fixed bottom upgrade plan section */}
          {showSubmenu && (
            <div className="p-3 mx-3 mb-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg flex flex-col items-center gap-1.5 text-center animate-fade-in group">
              <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-lg shadow-sm group-hover:scale-110 transition-all duration-300">
                <FiZap className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-indigo-200/50 uppercase tracking-widest">
                  Current Plan
                </span>
                <h4 className="text-[11px] font-extrabold text-white capitalize">
                  {(stores?.subscription_tier || 'free') === 'free' ? 'Free Trial' : (stores?.subscription_tier || 'free')} Plan
                </h4>
              </div>
              <button
                onClick={() => {
                  setActiveTab('upgrade-plan');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full mt-1.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 border-none cursor-pointer text-center select-none shadow-xs hover:shadow-md animate-pulse"
              >
                Upgrade Store
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

