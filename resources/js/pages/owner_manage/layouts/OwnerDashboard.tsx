import React, { useState, useEffect, useRef } from 'react';
import '@/pages/owner_manage/style/font.css';
import {
  FiGrid,
  FiLayers,
  FiShoppingBag,
  FiCheckSquare,
  FiSettings,
  FiMenu,
  FiX,
  FiBell,
  FiUser,
  FiSearch,
  FiFileText,
  FiEdit,
  FiChevronRight,
  FiChevronLeft,
  FiHome,
  FiShare2,
  FiSliders,
  FiLayout,
  FiVolume2,
  FiCoffee,
  FiChevronDown,
  FiMessageSquare,
} from 'react-icons/fi';
import { OverviewTab } from '../components/OverviewTab';
import { CategoriesTab } from '../components/CategoriesTab';
import { MenuItemsTab } from '../components/MenuItemsTab';
import { OrdersTab } from '../components/OrdersTab';
import { PostsTab } from '../components/PostsTab';
import { SettingsTab } from '../components/Store_Settings/Store_SettingsTab';
import { AttributesTab } from '../components/AttributesTab';
import { ChatInboxTab } from '../components/ChatInboxTab';
import { useConfirm } from '@/components/ConfirmProvider';
import { authService } from '@/api/auth';
import { chatService } from '@/api/owner/chat';
import { toast, setToastRef } from '../utils/toast';
import { Toast } from 'primereact/toast';
import { Storefront_ThemeTab } from '../components/Store_Settings/Storefront_ThemeTab';
import { PagesBuilderTab } from '../components/PagesBuilderTab';
import { BrandsTab } from '../components/BrandsTab';
import { ProductBadgesTab } from '../components/ProductBadgesTab';
import { CustomersTab } from '../components/CustomersTab';
import { CustomerReviewsTab } from '../components/CustomerReviewsTab';
import { PosTab } from '../components/PosTab';
import { Sidebar } from './Sidebar';
import { storesService } from '@/api/owner/stores';
import { ordersService } from '@/api/owner/orders';
import { RealTimeOrderPopup } from '../components/order/popupOrderRealTime';
import { SocialMediaTab } from '../components/Store_Settings/SocialMediaTab';
import { BannersTab } from '../components/BannersTab';
import { CouponsTab, FlashDealsTab, GenericDealsTab, SendNotificationTab, PushNotificationsSetupTab, AnnouncementTab } from '../components/MarketingPlaceholders';
import { PartnerStoresTab } from '../components/PartnerStoresTab';
import { ThirdPartyFirebaseTab, ThirdPartyMarketingTab } from '../components/ThirdPartySetupTab';
import { TelegramBotSettings } from '../components/telegrambot/TelegramBotSettings';
import { Social_Login_SetupTab } from '../components/Store_Settings/Social_Login_SetupTab';
import { Pusher_ConfigurationTab } from '../components/Store_Settings/Pusher_ConfigurationTab';
import { Payment_Gateways_SetupTab } from '../components/Store_Settings/Payment_Gateways_SetupTab';
import { TranslationProvider, useTranslation } from '../lang/i18n';
import { getStoreUrl } from '@Security/Owner/configUrl';
import { resolveImageUrl } from '@/api/imageUtils';
import { ProfileOwnerTab } from '../components/ProfileOwnerTab';
import { CustomizeSystemTab } from '../components/Store_Settings/CustomizeSystemTab';
import { DeliveryMethodsTab } from '../components/Delivery_Methods';

interface AdminDashboardProps {
  token: string | null;
  currentPath: string;
  onNavigate: (to: string) => void;
  onLogout: () => void;
}

type TabId = 'overview' | 'pos' | 'categories' | 'sub-categories' | 'sub-sub-categories' | 'brands' | 'product-badges' | 'menu-items' | 'orders' | 'orders-pending' | 'orders-processing' | 'orders-completed' | 'orders-cancelled' | 'pages-builder' | 'posts' | 'settings' | 'attributes' | 'theme' | 'customers' | 'customer-reviews' | 'social-media' | 'settings-delivery-methods' | 'settings-thirdparty-payment' | 'settings-thirdparty-firebase' | 'settings-thirdparty-pusher' | 'settings-thirdparty-marketing' | 'settings-thirdparty-oauth' | 'settings-thirdparty-telegram' | 'marketing-banners' | 'marketing-coupons' | 'marketing-flash-deals' | 'marketing-featured-deal' | 'marketing-clearance-sale' | 'marketing-send-notification' | 'marketing-push-notification' | 'marketing-announcement' | 'partner-stores' | 'inbox' | 'profile-owner' | 'customize-system';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'order' | 'chat' | 'stock' | 'system';
  action?: {
    tab: TabId;
    orderId?: string;
  };
}

const DashboardContent: React.FC<AdminDashboardProps> = ({
  token: _token,
  currentPath: _currentPath,
  onNavigate,
  onLogout,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('admin_active_tab');
    if (saved) return saved as TabId;
    return 'overview';
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('owner_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) { }
    }
    return [
      {
        id: 'mock-1',
        title: 'New Order #1204',
        description: 'Pending payment verification from Lyhour Chann ($32.50)',
        time: '5 mins ago',
        read: false,
        type: 'order',
        action: { tab: 'orders' }
      },
      {
        id: 'mock-2',
        title: 'Customer Message',
        description: 'Sarah Connor: "Is my order on the way?"',
        time: '20 mins ago',
        read: false,
        type: 'chat',
        action: { tab: 'inbox' }
      },
      {
        id: 'mock-3',
        title: 'Low Stock Alert',
        description: 'Coca-Cola Can is down to 3 units.',
        time: '1 hour ago',
        read: true,
        type: 'stock',
        action: { tab: 'menu-items' }
      },
      {
        id: 'mock-4',
        title: 'System Announcement',
        description: 'VAT and Store Location settings successfully updated.',
        time: '2 hours ago',
        read: true,
        type: 'system',
        action: { tab: 'settings' }
      }
    ];
  });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save notifications to local storage on change
  useEffect(() => {
    localStorage.setItem('owner_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Listen to new_notification custom event
  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<Omit<NotificationItem, 'time' | 'id'>>;
      if (customEvent.detail) {
        setNotifications(prev => [
          {
            ...customEvent.detail,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            time: 'Just now',
            read: false
          } as NotificationItem,
          ...prev
        ]);
      }
    };
    window.addEventListener('new_notification', handleNewNotification);
    return () => window.removeEventListener('new_notification', handleNewNotification);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (n: NotificationItem) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(item => (item.id === n.id ? { ...item, read: true } : item))
    );

    // Perform navigation/action
    if (n.action) {
      if (n.action.tab === 'menu-items') {
        localStorage.setItem('menu_items_view', 'list');
      }
      setActiveTab(n.action.tab);
      if (n.action.orderId) {
        // Dispatch to view details after brief timeout to let view render
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('view_order_details', { detail: { orderId: n.action?.orderId } })
          );
        }, 100);
      }
    }
    setIsNotificationOpen(false);
  };

  const getIconStyles = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return 'bg-orange-50 text-orange-500 border border-orange-100';
      case 'chat':
        return 'bg-blue-50 text-[#1a73e8] border border-blue-100';
      case 'stock':
        return 'bg-rose-50 text-rose-500 border border-rose-100';
      case 'system':
      default:
        return 'bg-slate-50 text-slate-500 border border-slate-100';
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return <FiShoppingBag className="w-4 h-4" />;
      case 'chat':
        return <FiMessageSquare className="w-4 h-4" />;
      case 'stock':
        return <FiSliders className="w-4 h-4" />;
      case 'system':
      default:
        return <FiSettings className="w-4 h-4" />;
    }
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', label: 'English', flagUrl: 'https://flagcdn.com/us.svg' },
    { code: 'km', label: 'Khmer', flagUrl: 'https://flagcdn.com/kh.svg' },
    { code: 'zh', label: 'Chinese', flagUrl: 'https://flagcdn.com/cn.svg' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleChangeTab = (e: Event) => {
      const customEvent = e as CustomEvent<TabId>;
      if (customEvent.detail) {
        if (customEvent.detail === 'menu-items') {
          localStorage.setItem('menu_items_view', 'list');
        }
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('change_admin_tab', handleChangeTab as EventListener);
    return () => window.removeEventListener('change_admin_tab', handleChangeTab as EventListener);
  }, []);

  // Auto-open order details and execute actions from URL query parameter (Deep-linking)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('order_id') || params.get('orderId');
    const actionParam = params.get('action');

    if (orderIdParam) {
      setActiveTab('orders');

      // Handle confirm/cancel status transitions directly from URL click
      if (actionParam === 'confirm') {
        ordersService.updateOrderStatus(orderIdParam, 'confirm')
          .then(() => {
            toast.success(`Order #${orderIdParam} has been successfully confirmed!`);
            window.dispatchEvent(new CustomEvent('data_updated'));
          })
          .catch(() => {
            toast.error(`Failed to confirm order #${orderIdParam}.`);
          });
      } else if (actionParam === 'cancel') {
        ordersService.updateOrderStatus(orderIdParam, 'canceled')
          .then(() => {
            toast.error(`Order #${orderIdParam} has been canceled.`);
            window.dispatchEvent(new CustomEvent('data_updated'));
          })
          .catch(() => {
            toast.error(`Failed to cancel order #${orderIdParam}.`);
          });
      }

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('view_order_details', { detail: { orderId: orderIdParam } })
        );
      }, 1000); // Give dashboard and orders tab enough time to initialize
    }
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const savedTab = localStorage.getItem('admin_active_tab') || 'overview';
    if (savedTab === 'overview') {
      return true;
    }
    const savedCollapsed = localStorage.getItem('admin_sidebar_collapsed');
    return savedCollapsed === 'true';
  });

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const prevUnreadCountsRef = useRef<Record<number, number>>({});
  const isFirstChatLoadRef = useRef(true);

  useEffect(() => {
    if (!profile) return;

    const fetchUnreadChatCount = async () => {
      try {
        const convos = await chatService.getMyConversations();
        if (convos && Array.isArray(convos)) {
          const totalUnread = convos.reduce((sum, c) => sum + (c.unread_count || 0), 0);
          setUnreadChatCount(totalUnread);

          if (isFirstChatLoadRef.current) {
            convos.forEach(c => {
              prevUnreadCountsRef.current[c.id] = c.unread_count || 0;
            });
            isFirstChatLoadRef.current = false;
          } else {
            convos.forEach(c => {
              const prevCount = prevUnreadCountsRef.current[c.id] || 0;
              const currentCount = c.unread_count || 0;
              if (currentCount > prevCount && c.last_message && c.last_message.sender_id === c.other_user.id) {
                const customerName = c.other_user.first_name || c.other_user.last_name
                  ? `${c.other_user.first_name || ''} ${c.other_user.last_name || ''}`.trim()
                  : c.other_user.name;

                // Play custom chime sound
                import('@/pages/owner_manage/components/order/popupOrderRealTime').then(m => {
                  if (m.playNotificationChime) m.playNotificationChime();
                }).catch(() => { });

                // Alert notification with 10s duration
                toast.custom((t) => (
                  <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'
                      } max-w-sm w-full bg-white/95 backdrop-blur-md border border-blue-100 rounded-[5px] pointer-events-auto flex flex-col overflow-hidden font-sans transition-all duration-300 shadow-lg`}
                  >
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                        <FiMessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[9px] font-black text-[#1a73e8] tracking-widest uppercase">
                          New Message
                        </span>
                        <h4 className="text-xs font-black text-slate-800 truncate">
                          {customerName}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                          {c.last_message?.body || 'Sent an attachment'}
                        </p>
                      </div>
                    </div>
                    <div className="flex border-t border-slate-100 divide-x divide-slate-100 bg-slate-50/50">
                      <button
                        onClick={() => {
                          setActiveTab('inbox');
                          setSidebarCollapsed(true);
                          setIsMobileMenuOpen(false);
                          (window as any).pendingViewConvoId = c.id;
                          window.dispatchEvent(new CustomEvent('change_admin_tab', { detail: 'inbox' }));
                          toast.dismiss(t.id);
                        }}
                        className="flex-1 py-2.5 text-[10px] font-black text-[#1a73e8] hover:text-blue-700 hover:bg-slate-100/50 transition-colors cursor-pointer border-none bg-transparent text-center select-none outline-none"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 py-2.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 transition-colors cursor-pointer border-none bg-transparent text-center select-none outline-none"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ), { duration: 10000 });
              }
              prevUnreadCountsRef.current[c.id] = currentCount;
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch unread chat count for dashboard', err);
      }
    };

    // Initial fetch
    fetchUnreadChatCount();

    // Poll every 10 seconds for updates when not in ChatInboxTab
    const interval = setInterval(fetchUnreadChatCount, 10000);

    // Listen to immediate custom event updates from ChatInboxTab
    const handleUnreadCountUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === 'number') {
        setUnreadChatCount(customEvent.detail);
      }
    };

    window.addEventListener('chat_unread_count_updated', handleUnreadCountUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('chat_unread_count_updated', handleUnreadCountUpdate);
    };
  }, [profile]);

  const handleProfileUpdate = () => {
    authService.getCurrentUser()
      .then(data => setProfile(data))
      .catch(err => console.warn('Failed to refresh owner profile', err));
  };

  const [isCategorySetupOpen, setIsCategorySetupOpen] = useState<boolean>(() => {
    const savedOpen = localStorage.getItem('is_category_setup_open');
    if (savedOpen !== null) {
      return savedOpen === 'true';
    }
    const saved = localStorage.getItem('admin_active_tab');
    if (saved === 'categories' || saved === 'sub-categories' || saved === 'sub-sub-categories') {
      return true;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('is_category_setup_open', String(isCategorySetupOpen));
  }, [isCategorySetupOpen]);



  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id') || params.get('owner');

    authService.getCurrentUser()
      .then(data => {
        setProfile(data);
        const isAdmin = data?.user?.role === 'admin';

        // Resolve active owner ID: URL param/localStorage overrides are strictly allowed only for platform admins
        let activeOwnerId: number | string | null = null;
        if (urlId && isAdmin) {
          activeOwnerId = isNaN(Number(urlId)) ? urlId : parseInt(urlId, 10);
        } else if (isAdmin) {
          const saved = localStorage.getItem('selected_owner_id');
          if (saved) activeOwnerId = isNaN(Number(saved)) ? saved : parseInt(saved, 10);
        }

        if (!activeOwnerId) {
          activeOwnerId = data?.user?.hashid || data?.user?.id;
        }

        if (activeOwnerId) {
          if (isAdmin) {
            localStorage.setItem('selected_owner_id', String(activeOwnerId));
          }
          storesService.getStoreByOwner(activeOwnerId)
            .then((sData: any) => {
              if (sData) setSettings(sData);
            })
            .catch((err: any) => console.warn('Failed to load store settings for dashboard', err));
        }
      })
      .catch((err: any) => console.warn('Failed to load admin profile', err));
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      const updated = localStorage.getItem('store_settings');
      if (updated) {
        setSettings(JSON.parse(updated));
      }
    };
    window.addEventListener('settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings_updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const handleChangeTab = (e: Event) => {
      const customEvent = e as CustomEvent<TabId>;
      if (customEvent.detail) {
        if (customEvent.detail === 'menu-items') {
          localStorage.setItem('menu_items_view', 'list');
        }
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('change_admin_tab', handleChangeTab);
    return () => window.removeEventListener('change_admin_tab', handleChangeTab);
  }, []);

  // Periodic heartbeat while dashboard is open to maintain online presence
  useEffect(() => {
    if (!profile) return;

    // Trigger initial heartbeat
    authService.heartbeat();

    const interval = setInterval(() => {
      authService.heartbeat();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [profile]);

  // Mark owner offline immediately when tab/browser is closed or navigated away
  useEffect(() => {
    if (!profile) return;
    const handleOffline = () => {
      authService.markOffline();
    };
    window.addEventListener('pagehide', handleOffline);
    window.addEventListener('beforeunload', handleOffline);
    return () => {
      window.removeEventListener('pagehide', handleOffline);
      window.removeEventListener('beforeunload', handleOffline);
    };
  }, [profile]);

  const handleLogoutClick = async () => {
    const confirmed = await confirm({
      title: 'Sign Out Admin Console',
      message: 'Are you sure you want to end your administrative session?',
      confirmText: 'Sign Out',
      cancelText: 'Keep Logged In',
      type: 'danger',
    });
    if (confirmed) onLogout();
  };

  const navSections = [
    {
      section: 'OVERVIEW',
      items: [
        { id: 'overview', label: t('sidebar.dashboard'), icon: <FiGrid className="w-[18px] h-[18px]" /> },
        {
          id: 'orders',
          label: t('sidebar.orders'),
          icon: <FiCheckSquare className="w-[18px] h-[18px]" />,
          subItems: [
            { id: 'orders', label: t('sidebar.all_orders'), icon: <span className="text-xs">•</span> },
            { id: 'orders-pending', label: t('sidebar.pending'), icon: <span className="text-xs">•</span> },
            { id: 'orders-processing', label: t('sidebar.processing'), icon: <span className="text-xs">•</span> },
            { id: 'orders-completed', label: t('sidebar.completed'), icon: <span className="text-xs">•</span> },
            { id: 'orders-cancelled', label: t('sidebar.cancelled'), icon: <span className="text-xs">•</span> },
          ]
        },
      ]
    },
    {
      section: 'ORGANIZATION',
      items: [
        {
          id: 'category-setup' as const,
          label: t('sidebar.category_setup'),
          icon: <FiLayers className="w-[18px] h-[18px]" />,
          subItems: [
            { id: 'categories', label: t('sidebar.categories'), icon: <span className="text-xs">•</span> },
            { id: 'sub-categories', label: t('sidebar.sub_categories'), icon: <span className="text-xs">•</span> },
            { id: 'sub-sub-categories', label: t('sidebar.sub_sub_categories'), icon: <span className="text-xs">•</span> },
          ]
        },
        { id: 'brands', label: t('sidebar.brand_setup'), icon: <FiLayers className="w-[18px] h-[18px]" /> },
        { id: 'attributes', label: t('sidebar.product_attributes'), icon: <FiSliders className="w-[18px] h-[18px]" /> },
        { id: 'menu-items', label: t('sidebar.product_list'), icon: <FiShoppingBag className="w-[18px] h-[18px]" /> },
      ]
    },
    {
      section: 'MARKETING',
      items: [
        { id: 'marketing-banners', label: t('sidebar.banner_setup'), icon: <FiLayers className="w-[18px] h-[18px]" /> },
        {
          id: 'offers-deals',
          label: t('sidebar.offers_deals'),
          icon: <FiShoppingBag className="w-[18px] h-[18px]" />,
          subItems: [
            { id: 'marketing-coupons', label: t('sidebar.coupon'), icon: <span className="text-xs">•</span> },
            { id: 'marketing-flash-deals', label: t('sidebar.flash_deals'), icon: <span className="text-xs">•</span> },
            { id: 'marketing-featured-deal', label: t('sidebar.featured_deal'), icon: <span className="text-xs">•</span> },
            { id: 'marketing-clearance-sale', label: t('sidebar.clearance_sale'), icon: <span className="text-xs">•</span> },
          ]
        },
        { id: 'inbox', label: 'Customer Chat', icon: <FiMessageSquare className="w-[18px] h-[18px]" /> },
        { id: 'marketing-send-notification', label: t('sidebar.send_notification'), icon: <FiVolume2 className="w-[18px] h-[18px]" /> },
        { id: 'marketing-push-notification', label: t('sidebar.push_notifications'), icon: <FiSettings className="w-[18px] h-[18px]" /> },
        { id: 'marketing-announcement', label: t('sidebar.announcement'), icon: <FiVolume2 className="w-[18px] h-[18px]" /> },
      ]
    },
    {
      section: 'CONTENT',
      items: [
        { id: 'pages', label: t('sidebar.static_pages'), icon: <FiFileText className="w-[18px] h-[18px]" /> },
        { id: 'posts', label: t('sidebar.blog_news'), icon: <FiEdit className="w-[18px] h-[18px]" /> },
      ]
    },
    {
      section: 'PEOPLE',
      items: [
        { id: 'customers', label: t('sidebar.customer_list'), icon: <FiUser className="w-[18px] h-[18px]" /> },
        { id: 'customer-reviews', label: t('sidebar.customer_reviews'), icon: <FiCheckSquare className="w-[18px] h-[18px]" /> },
        { id: 'partner-stores', label: t('sidebar.people'), icon: <FiCoffee className="w-[18px] h-[18px]" /> },
      ]
    },
    {
      section: 'SYSTEM',
      items: [
        { id: 'theme', label: t('sidebar.storefront_themes'), icon: <FiLayout className="w-[18px] h-[18px]" /> },
        { id: 'settings', label: t('sidebar.store_settings'), icon: <FiSettings className="w-[18px] h-[18px]" /> },
        { id: 'social-media', label: t('sidebar.social_media'), icon: <FiShare2 className="w-[18px] h-[18px]" /> },
        { id: 'settings-thirdparty-payment', label: t('sidebar.payment_methods'), icon: <FiSettings className="w-[18px] h-[18px]" /> },
        { id: 'settings-thirdparty-firebase', label: t('sidebar.firebase'), icon: <FiSettings className="w-[18px] h-[18px]" /> },
        { id: 'settings-thirdparty-pusher', label: t('sidebar.pusher_config'), icon: <FiSettings className="w-[18px] h-[18px]" /> },
        { id: 'settings-thirdparty-marketing', label: t('sidebar.marketing_tools'), icon: <FiSettings className="w-[18px] h-[18px]" /> },
        { id: 'settings-thirdparty-oauth', label: 'Social Login (OAuth)', icon: <FiSettings className="w-[18px] h-[18px]" /> },
        { id: 'settings-thirdparty-telegram', label: 'Telegram Bot', icon: <FiSettings className="w-[18px] h-[18px]" /> },
      ]
    }
  ];

  const getActiveLabel = (): string => {
    for (const section of navSections) {
      for (const item of section.items) {
        if ('subItems' in item) {
          const sub = (item as any).subItems.find((s: any) => s.id === activeTab);
          if (sub) return sub.label;
        } else {
          if (item.id === activeTab) return item.label;
        }
      }
    }
    return t('sidebar.dashboard');
  };
  const activeLabel = getActiveLabel();

  const isAdmin = profile?.user?.role === 'admin';
  const ownerIdStr = localStorage.getItem('selected_owner_id');
  const activeOwnerId = profile ? (isAdmin && ownerIdStr ? (isNaN(Number(ownerIdStr)) ? ownerIdStr : parseInt(ownerIdStr, 10)) : (profile?.user?.hashid || profile?.user?.id)) : undefined;

  const renderActiveTab = () => {
    if (!profile) return null;

    switch (activeTab) {
      case 'overview': return <OverviewTab ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'pos': return <PosTab ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'categories': return <CategoriesTab ownerId={activeOwnerId} storeId={settings?.id} levelFilter={0} />;
      case 'sub-categories': return <CategoriesTab ownerId={activeOwnerId} storeId={settings?.id} levelFilter={1} />;
      case 'sub-sub-categories': return <CategoriesTab ownerId={activeOwnerId} storeId={settings?.id} levelFilter={2} />;
      case 'menu-items': return <MenuItemsTab ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'brands': return <BrandsTab ownerId={activeOwnerId} />;
      case 'product-badges': return <ProductBadgesTab ownerId={activeOwnerId} />;
      case 'orders': return <OrdersTab ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'orders-pending': return <OrdersTab ownerId={activeOwnerId} storeId={settings?.id} defaultStatusFilter="pending" />;
      case 'orders-processing': return <OrdersTab ownerId={activeOwnerId} storeId={settings?.id} defaultStatusFilter="processing" />;
      case 'orders-completed': return <OrdersTab ownerId={activeOwnerId} storeId={settings?.id} defaultStatusFilter="complete" />;
      case 'orders-cancelled': return <OrdersTab ownerId={activeOwnerId} storeId={settings?.id} defaultStatusFilter="canceled" />;
      case 'posts': return <PostsTab ownerId={activeOwnerId} />;
      case 'pages-builder': return <PagesBuilderTab ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'theme': return <Storefront_ThemeTab ownerId={activeOwnerId} profile={profile} />;
      case 'customize-system': return <CustomizeSystemTab />;
      case 'settings': return <SettingsTab profile={profile} ownerId={activeOwnerId} />;
      case 'attributes': return <AttributesTab ownerId={activeOwnerId} />;
      case 'customers': return <CustomersTab ownerId={activeOwnerId} />;
      case 'customer-reviews': return <CustomerReviewsTab ownerId={activeOwnerId} />;
      case 'social-media': return <SocialMediaTab ownerId={activeOwnerId} />;
      case 'settings-delivery-methods': return <DeliveryMethodsTab />;
      case 'settings-thirdparty-payment': return <Payment_Gateways_SetupTab ownerId={activeOwnerId} profile={profile} />;
      case 'settings-thirdparty-firebase': return <ThirdPartyFirebaseTab ownerId={activeOwnerId} profile={profile} />;
      case 'settings-thirdparty-pusher': return <Pusher_ConfigurationTab ownerId={activeOwnerId} profile={profile} />;
      case 'settings-thirdparty-marketing': return <ThirdPartyMarketingTab ownerId={activeOwnerId} profile={profile} />;
      case 'settings-thirdparty-oauth': return <Social_Login_SetupTab ownerId={activeOwnerId} profile={profile} />;
      case 'settings-thirdparty-telegram': return <TelegramBotSettings />;
      case 'marketing-banners': return <BannersTab ownerId={activeOwnerId} />;
      case 'marketing-coupons': return <CouponsTab ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'marketing-flash-deals': return <FlashDealsTab ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'marketing-featured-deal': return <GenericDealsTab type="featured" ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'marketing-clearance-sale': return <GenericDealsTab type="clearance" ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'marketing-send-notification': return <SendNotificationTab />;
      case 'marketing-push-notification': return <PushNotificationsSetupTab />;
      case 'marketing-announcement': return <AnnouncementTab />;
      case 'partner-stores': return <PartnerStoresTab onNavigate={onNavigate} />;
      case 'inbox': return <ChatInboxTab ownerId={activeOwnerId} storeId={settings?.id} />;
      case 'profile-owner': return <ProfileOwnerTab profile={profile} onProfileUpdate={handleProfileUpdate} />;
    }
  };

  if (!profile) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--dashboard-main-bg, #F4F7FE)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 font-kuntomruy">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex font-sans text-slate-700 overflow-hidden"
      style={{ backgroundColor: 'var(--dashboard-main-bg, #F4F7FE)' }}
    >

      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside
        className={`relative z-40 hidden md:flex flex-col border-r shrink-0 h-screen transition-[width] duration-300 ease-in-out ${sidebarCollapsed ? 'w-[70px]' : 'w-[270px]'
          }`}
        style={{
          backgroundColor: 'var(--sidebar-menu-bg, #3f51b5)',
          borderColor: 'color-mix(in srgb, var(--sidebar-text-color, #e0e7ff) 10%, transparent)'
        }}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          profile={profile}
          stores={settings}
          isCategorySetupOpen={isCategorySetupOpen}
          setIsCategorySetupOpen={setIsCategorySetupOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onLogout={handleLogoutClick}
          unreadChatCount={unreadChatCount}
        />
      </aside>

      {/* ── Mobile Overlay ──────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ───────────────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 ${activeTab === 'inbox' ? 'w-[70px]' : 'w-[270px]'} border-r flex flex-col z-[210] md:hidden transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{
          backgroundColor: 'var(--sidebar-menu-bg, #3f51b5)',
          borderColor: 'color-mix(in srgb, var(--sidebar-text-color, #e0e7ff) 10%, transparent)'
        }}
      >
        {activeTab !== 'inbox' && (
          <div className="absolute top-4 right-4">
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 cursor-pointer">
              <FiX className="w-5 h-5" />
            </button>
          </div>
        )}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          profile={profile}
          stores={settings}
          isCategorySetupOpen={isCategorySetupOpen}
          setIsCategorySetupOpen={setIsCategorySetupOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onLogout={handleLogoutClick}
          mobile
          unreadChatCount={unreadChatCount}
        />
      </aside>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Header */}
        <header className="h-16 border-b flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm custom-header-container">

          {/* Left: sidebar toggle + breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(p => !p)}
              className="hidden md:flex w-8 h-8 items-center justify-center rounded-[8px] hover:bg-black/[0.04] text-inherit transition-all cursor-pointer border-none bg-transparent"
            >
              {sidebarCollapsed ? (
                <FiChevronRight className="w-[18px] h-[18px]" />
              ) : (
                <FiChevronLeft className="w-[18px] h-[18px]" />
              )}
            </button>
            {/* Mobile drawer toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-black/[0.04] text-inherit cursor-pointer border-none bg-transparent"
            >
              <FiMenu className="w-[18px] h-[18px]" />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
              <button onClick={() => setActiveTab('overview')} className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                <FiGrid className="w-3.5 h-3.5" />
                <span>{t('sidebar.dashboard')}</span>
              </button>
              <FiChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-700 font-bold">{activeLabel}</span>
            </nav>
          </div>

          {/* Center: Premium Merchant Control Bar (Sandbox Mode Integrated) */}
          {profile?.user?.role === 'admin' && (
            <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-[5px] text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-extrabold text-slate-800 tracking-tight shrink-0">{t('header.merchant_sandbox')}</span>
                <span className="font-semibold text-slate-500 truncate max-w-[200px]" title={settings?.store_name || 'Store'}>
                  {t('header.previewing')} <strong className="text-slate-900 font-extrabold">{settings?.store_name || 'Store'}</strong>
                </span>
              </div>

              <div className="h-4 w-px bg-slate-200 shrink-0" />

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const activeOwnerId = settings?.hashid || settings?.owner_id || settings?.created_by || (profile?.user?.role === 'admin'
                      ? (localStorage.getItem('selected_owner_id') || profile?.user?.hashid || profile?.user?.id)
                      : (profile?.user?.hashid || profile?.user?.id));
                    const path = getStoreUrl(settings?.store_name || profile?.user?.name || 'Store', activeOwnerId);
                    const shareUrl = path.startsWith('http') ? path : `${window.location.origin}${path}`;
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Public storefront link copied!');
                  }}
                  className="text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 bg-transparent border border-slate-200/60 px-2 py-1 rounded-[5px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <FiShare2 className="w-3 h-3 text-slate-400" />
                  <span>{t('sidebar.copy_share_link')}</span>
                </button>

                <button
                  onClick={() => {
                    const activeOwnerId = settings?.hashid || settings?.owner_id || settings?.created_by || (profile?.user?.role === 'admin'
                      ? (localStorage.getItem('selected_owner_id') || profile?.user?.hashid || profile?.user?.id)
                      : (profile?.user?.hashid || profile?.user?.id));
                    const path = getStoreUrl(settings?.store_name || profile?.user?.name || 'Store', activeOwnerId);
                    window.open(path, '_blank');
                  }}
                  className="bg-primary hover:bg-primary-hover text-white px-2.5 py-1 rounded-[5px] font-bold transition-all cursor-pointer flex items-center space-x-1 shadow-sm shadow-orange-500/10 active:scale-95 duration-200 border-none"
                >
                  <FiHome className="w-3 h-3" />
                  <span>{t('sidebar.visit_live_store')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Right: search + bells + profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search bar — hidden on small screens */}
            <div className="hidden lg:flex items-center gap-2 bg-black/[0.03] border rounded-[10px] px-3 py-2 w-52">
              <FiSearch className="w-3.5 h-3.5 text-slate-450 shrink-0" />
              <input
                type="text"
                placeholder={t('header.search_placeholder')}
                className="bg-transparent text-[12px] font-semibold placeholder:text-slate-400 outline-none w-full text-inherit"
              />
              <span className="hidden xl:flex items-center gap-0.5 text-[10px] font-bold opacity-40 border rounded px-1">⌘K</span>
            </div>

            {/* Fullscreen Toggle */}
            <button
              className="v2-icon-btn w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-black/[0.04] text-inherit transition-all cursor-pointer border-none bg-transparent"
              type="button"
              id="v2-fullscreen-toggle"
              onClick={toggleFullscreen}
              data-v2-tooltip={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              data-v2-tip-enter="Enter fullscreen"
              data-v2-tip-exit="Exit fullscreen"
            >
              <svg
                className="v2-fs-icon v2-fs-enter"
                style={{ display: isFullscreen ? 'none' : 'block' }}
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 9V5a1 1 0 0 1 1-1h4"></path>
                <path d="M15 4h4a1 1 0 0 1 1 1v4"></path>
                <path d="M20 15v4a1 1 0 0 1-1 1h-4"></path>
                <path d="M9 20H5a1 1 0 0 1-1-1v-4"></path>
              </svg>
              <svg
                className="v2-fs-icon v2-fs-exit"
                style={{ display: isFullscreen ? 'block' : 'none' }}
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 4v4a1 1 0 0 1-1 1H4"></path>
                <path d="M15 4v4a1 1 0 0 0 1 1h4"></path>
                <path d="M15 20v-4a1 1 0 0 1 1-1h4"></path>
                <path d="M9 20v-4a1 1 0 0 0-1-1H4"></path>
              </svg>
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-black/[0.04] text-inherit transition-all cursor-pointer border-none bg-transparent group relative ${isNotificationOpen ? 'bg-black/[0.06]' : ''
                  }`}
              >
                <FiBell className="w-[18px] h-[18px] transition-transform duration-300 group-hover:rotate-12" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 bg-primary text-white text-[9px] font-black px-1 min-w-[15px] h-3.5 rounded-full flex items-center justify-center border border-white leading-none shadow-sm shadow-orange-500/20">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute top-[calc(100%+8px)] right-[-80px] sm:right-0 w-[320px] sm:w-[360px] rounded-[5px] shadow-lg border z-[300] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 custom-card-container">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b custom-card-header-bar">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[12px] font-black uppercase tracking-wider">Notifications</h3>
                      {notifications.filter((n) => !n.read).length > 0 && (
                        <span className="bg-primary/10 text-primary text-[9px] font-black px-1.5 py-0.5 rounded-[3px]">
                          {notifications.filter((n) => !n.read).length} New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <>
                          <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-bold text-primary hover:underline border-none bg-transparent cursor-pointer select-none"
                          >
                            Mark all read
                          </button>
                          <span className="opacity-20 text-xs">|</span>
                          <button
                            onClick={clearAllNotifications}
                            className="text-[10px] font-bold opacity-60 hover:opacity-100 hover:text-red-500 hover:underline border-none bg-transparent cursor-pointer select-none"
                          >
                            Clear all
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Scrollable list */}
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar divide-y">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-black/[0.03] flex items-center justify-center opacity-60 mb-2">
                          <FiBell className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold">All caught up!</p>
                        <p className="text-[11px] opacity-60 mt-0.5">No notifications at the moment.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`flex items-start gap-3 p-3.5 hover:bg-black/[0.04] transition-colors cursor-pointer relative group ${!n.read ? 'bg-primary/[0.02]' : ''
                            }`}
                        >
                          {/* Type Indicator Icon */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${getIconStyles(n.type)}`}>
                            {getNotificationIcon(n.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-start justify-between gap-1">
                              <p className={`text-[12px] font-black leading-snug truncate ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                {n.title}
                              </p>
                              <span className="text-[9px] font-bold text-slate-400 shrink-0 whitespace-nowrap">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-400/90 font-medium leading-relaxed mt-0.5 break-words">
                              {n.description}
                            </p>
                          </div>

                          {/* Unread Dot & Delete Action */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border-none bg-transparent cursor-pointer"
                              title="Delete notification"
                            >
                              <FiX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Language Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-[10px] hover:bg-black/[0.04] text-inherit transition-all cursor-pointer border-none bg-transparent group"
              >
                <div className="w-7 h-6 flex items-center justify-center rounded-[3px] overflow-hidden shadow-sm border border-black/5 bg-black/[0.03] shrink-0">
                  <img
                    src={currentLang.flagUrl}
                    alt={currentLang.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-extrabold opacity-75 hidden sm:block uppercase tracking-wider">{currentLang.code}</span>
                <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isLangDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[150px] rounded-[5px] shadow-lg border z-[300] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 custom-card-container">
                  <div className="flex flex-col">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as any);
                          setIsLangDropdownOpen(false);
                          toast.success(`Language changed to ${lang.label}`);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all border-none cursor-pointer ${language === lang.code
                          ? 'bg-primary text-white'
                          : 'bg-transparent text-inherit hover:bg-black/[0.04]'
                          }`}
                      >
                        <div className={`w-8 h-6 rounded-[4px] overflow-hidden shrink-0 shadow-sm border flex items-center justify-center ${language === lang.code ? 'border-white/20 bg-white/10' : 'border-black/5 bg-black/[0.03]'
                          }`}>
                          <img
                            src={lang.flagUrl}
                            alt={lang.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[13px] font-medium leading-none">
                          {lang.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-7 w-px bg-slate-100 hidden sm:block" />

            {/* Profile pill */}
            <div
              onClick={() => setActiveTab('profile-owner')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden">
                {profile?.user?.image_url ? (
                  <img src={resolveImageUrl(profile.user.image_url)} alt="Avatar" className="w-full h-full object-cover" />
                ) : profile?.user?.name ? (
                  profile.user.name.charAt(0).toUpperCase()
                ) : (
                  <FiUser className="w-4 h-4" />
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[12px] font-black text-slate-800 leading-tight group-hover:text-primary transition-colors">
                  {profile?.user?.name || t('header.administrator')}
                </p>
                <p className="text-[10px] font-bold text-slate-400 capitalize leading-tight">
                  {profile?.user?.role || t('header.master_admin')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {renderActiveTab()}
        </main>
      </div>
      <RealTimeOrderPopup ownerId={activeOwnerId} storeId={settings?.id} />
      <Toast ref={setToastRef} position="bottom-right" />
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => (
  <TranslationProvider>
    <DashboardContent {...props} />
  </TranslationProvider>
);


