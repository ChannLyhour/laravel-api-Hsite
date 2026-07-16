import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { client } from '@/api/client';
import { SettingTab } from '../components/SettingTab';
import { Sidebar } from './Sidebar';
import { TranslationProvider } from '../lang/i18n';
import { SubscriptionsTab, defaultPlanFeatures } from '../components/subscriptions/index';
import type { PlanFeatures } from '../components/subscriptions/index';
import {
  FiCreditCard,
  FiMenu,
  FiX,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiCheck,
  FiShoppingBag,
  FiLock,
  FiTrendingUp,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiBookOpen,
} from 'react-icons/fi';

interface AdminDashboardProps {
  token: string;
  currentPath: string;
  onNavigate: (to: string) => void;
  onLogout: () => void;
}

type TabId = 'overview' | 'merchants' | 'subscriptions' | 'payments' | 'settings' | 'assign-template';

interface Merchant {
  id: number;
  name: string;
  email: string;
  storeName: string;
  phone: string;
  tier: 'free' | 'basic' | 'standard' | 'premium';
  status: 'active' | 'suspended';
  joinedDate: string;
  createdBy?: number | string;
  sidebarStatus?: boolean;
  subsidebarStatus?: boolean;
}

const DashboardContent: React.FC<AdminDashboardProps> = ({
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('master_active_tab');
    return (saved as TabId) || 'overview';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem('master_active_tab', activeTab);
  }, [activeTab]);

  // ─── STORES/MERCHANTS STATE ──────────────────────────────────────────────────
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const fetchStores = async () => {
    try {
      const data = await client.get<any[]>('/stores');
      const mapped = data.map((store: any) => ({
        id: store.id,
        name: store.owner?.name || 'Unknown Owner',
        email: store.owner?.email || store.store_email || 'No Email',
        storeName: store.store_name || 'Unnamed Store',
        phone: store.owner?.phone || store.store_phone || 'No Phone',
        tier: (store.subscription_tier || 'free') as 'free' | 'basic' | 'standard' | 'premium',
        status: (store.owner?.state === 'active' ? 'active' : 'suspended') as 'active' | 'suspended',
        joinedDate: store.created_at ? store.created_at.split(' ')[0] : new Date().toISOString().split('T')[0],
        createdBy: store.created_by,
        sidebarStatus: store.sidebar_status !== false, // default true
        subsidebarStatus: store.subsidebar_status !== false, // default true
      }));
      setMerchants(mapped);
    } catch (err: any) {
      console.error('Failed to fetch stores:', err);
      toast.error('Failed to load store merchants from database.');
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // ─── TEMPLATE ASSIGNMENTS STATE ──────────────────────────────────────────────
  const [templates, setTemplates] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ userId: '', templateId: '' });
  const [isEditAssignModalOpen, setIsEditAssignModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<{ id: number; userId: string; templateId: string } | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await client.get<{ success: boolean; data: any[] }>('/admin/templates');
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await client.get<{ success: boolean; data: any[] }>('/admin/template-assignments');
      setAssignments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch template assignments:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'assign-template') {
      fetchTemplates();
      fetchAssignments();
    }
  }, [activeTab]);

  const handleAssignTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.userId || !newAssignment.templateId) {
      toast.error('Please select both a store/owner and a template.');
      return;
    }

    try {
      await client.post('/admin/template-assignments', {
        user_id: parseInt(newAssignment.userId),
        template_id: parseInt(newAssignment.templateId),
      });
      toast.success('Template assigned successfully!');
      setIsAssignModalOpen(false);
      setNewAssignment({ userId: '', templateId: '' });
      fetchAssignments();
    } catch (err: any) {
      const errMsg = err.details?.message || err.message || 'Failed to assign template.';
      toast.error(errMsg);
    }
  };

  const handleRemoveAssignment = async (id: number, storeName: string, templateTitle: string) => {
    if (confirm(`Are you sure you want to remove template "${templateTitle}" from "${storeName}"?`)) {
      try {
        await client.delete(`/admin/template-assignments/${id}`);
        toast.success('Template assignment removed successfully.');
        fetchAssignments();
      } catch (err: any) {
        toast.error('Failed to remove template assignment.');
      }
    }
  };

  const handleEditAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAssignment || !currentAssignment.userId || !currentAssignment.templateId) {
      toast.error('Please select both a store/owner and a template.');
      return;
    }

    try {
      await client.put(`/admin/template-assignments/${currentAssignment.id}`, {
        user_id: parseInt(currentAssignment.userId),
        template_id: parseInt(currentAssignment.templateId),
      });
      toast.success('Template assignment updated successfully.');
      setIsEditAssignModalOpen(false);
      setCurrentAssignment(null);
      fetchAssignments();
    } catch (err: any) {
      const errMsg = err.details?.message || err.message || 'Failed to update template assignment.';
      toast.error(errMsg);
    }
  };

  // ─── SUBSCRIPTION PLAN FEATURES & PRICING STATE ───────────────────────────────
  // Pre-configured features matching standard listings
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures>(defaultPlanFeatures);
  const [planPrices, setPlanPrices] = useState<Record<string, number>>({
    free: 0,
    basic: 5.99,
    standard: 9.99,
    premium: 14.99
  });
  const isInitialLoad = useRef(true);
  const isInitialPricesLoad = useRef(true);

  useEffect(() => {
    const loadPlanFeatures = async () => {
      try {
        const data = await client.get<PlanFeatures>('/subscriptions/features');
        if (data) {
          // Filter out deleted features if any exist in backend data
          const deletedKeys = ['AR (Augmented Reality) Model', 'AR Table Cards', 'AI Features'];
          const cleaned = { ...data };
          Object.keys(cleaned).forEach(tier => {
            if (Array.isArray(cleaned[tier as keyof PlanFeatures])) {
              cleaned[tier as keyof PlanFeatures] = cleaned[tier as keyof PlanFeatures].filter((f: string) => !deletedKeys.includes(f));
            }
          });
          setPlanFeatures(cleaned);
        }
      } catch (err) {
        console.error('Failed to load plan features from backend:', err);
      } finally {
        isInitialLoad.current = false;
      }
    };

    const loadPlanPrices = async () => {
      try {
        const data = await client.get<Record<string, number>>('/subscriptions/prices');
        if (data) {
          setPlanPrices(data);
        }
      } catch (err) {
        console.error('Failed to load plan prices from backend:', err);
      } finally {
        isInitialPricesLoad.current = false;
      }
    };

    loadPlanFeatures();
    loadPlanPrices();
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) return;
    
    // Save to localStorage for instant local access
    localStorage.setItem('biteflow_plan_features', JSON.stringify(planFeatures));
    window.dispatchEvent(new Event('plan_features_updated'));

    // Save to Backend API
    const saveToBackend = async () => {
      try {
        await client.put('/admin/subscriptions/features', planFeatures);
      } catch (err) {
        console.error('Failed to sync plan features with backend:', err);
      }
    };
    saveToBackend();
  }, [planFeatures]);

  useEffect(() => {
    if (isInitialPricesLoad.current) return;

    const savePricesToBackend = async () => {
      try {
        await client.put('/admin/subscriptions/prices', planPrices);
      } catch (err) {
        console.error('Failed to sync plan prices with backend:', err);
      }
    };
    savePricesToBackend();
  }, [planPrices]);

  // ─── EDIT / ADD MERCHANT MODAL STATES ────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState<Partial<Merchant>>({});

  const handleAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMerchant.name || !currentMerchant.storeName || !currentMerchant.email) {
      toast.error('Please enter name, email and store name.');
      return;
    }

    try {
      // 1. Create owner user
      const regRes = await client.post<any>('/register', {
        name: currentMerchant.name,
        email: currentMerchant.email,
        password: 'password123',
        role_id: 30003, // Owner role
        phone: currentMerchant.phone || null,
        state: 'active',
      });

      const newUserId = regRes?.user?.id;
      if (!newUserId) {
        throw new Error('Failed to retrieve new user ID.');
      }

      // 2. Create store for this owner
      await client.post<any>('/stores', {
        created_by: newUserId,
        store_name: currentMerchant.storeName,
        store_phone: currentMerchant.phone || null,
        store_email: currentMerchant.email,
        subscription_tier: currentMerchant.tier || 'free',
        tax_percentage: 10.0,
      });

      toast.success('New store merchant created and database records registered!');
      setIsAddModalOpen(false);
      setCurrentMerchant({});
      fetchStores();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Failed to register store.';
      toast.error(errMsg);
    }
  };

  const handleEditMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMerchant.id || !currentMerchant.createdBy) return;

    try {
      // 1. Update owner user details
      await client.put<any>(`/users/${currentMerchant.createdBy}`, {
        name: currentMerchant.name,
        email: currentMerchant.email,
        phone: currentMerchant.phone || null,
        state: currentMerchant.status === 'active' ? 'active' : 'suspended',
      });

      // 2. Update store details
      await client.put<any>(`/stores/${currentMerchant.id}`, {
        store_name: currentMerchant.storeName,
        store_phone: currentMerchant.phone || null,
        store_email: currentMerchant.email,
        subscription_tier: currentMerchant.tier,
        sidebar_status: currentMerchant.sidebarStatus !== false,
        subsidebar_status: currentMerchant.subsidebarStatus !== false,
      });

      toast.success('Merchant profile and store settings updated successfully.');
      setIsEditModalOpen(false);
      setCurrentMerchant({});
      fetchStores();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Failed to update store settings.';
      toast.error(errMsg);
    }
  };



  // ─── BILLING / PAYMENTS TRANSACTIONS ─────────────────────────────────────────
  const transactions = [
    { id: 'TXN-4089', store: 'Chivorn Store kh', owner: 'Chivorn Srun', tier: 'premium', amount: 9.99, date: '2026-05-28', status: 'completed' },
    { id: 'TXN-3982', store: 'Lyhour Store Kh', owner: 'Chann Lyhour', tier: 'standard', amount: 5.99, date: '2026-05-10', status: 'completed' },
    { id: 'TXN-3881', store: 'Food Ordering System', owner: 'Master System Store', tier: 'premium', amount: 9.99, date: '2026-05-01', status: 'completed' },
    { id: 'TXN-3562', store: 'Lyhour Store Kh', owner: 'Chann Lyhour', tier: 'standard', amount: 5.99, date: '2026-04-10', status: 'completed' },
  ];

  return (
    <div className="h-screen bg-[#F4F7FE] flex font-sans text-slate-700 overflow-hidden">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside
        className={`relative z-40 hidden md:flex flex-col bg-white/80 backdrop-blur-md border-r border-slate-100 shrink-0 h-screen transition-[width] duration-300 ease-in-out ${sidebarCollapsed ? 'w-[70px]' : 'w-[270px]'
          }`}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          onLogout={onLogout}
        />
      </aside>

      {/* ── Mobile Overlay & Drawer ────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[270px] bg-white/80 backdrop-blur-md border-r border-slate-100 flex flex-col z-[210] md:hidden transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 cursor-pointer border-none bg-transparent"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          onLogout={onLogout}
          mobile
        />
      </aside>

      {/* ── Main Dashboard Layout ───────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed((p) => !p)}
              className="hidden md:flex w-8 h-8 items-center justify-center rounded-[8px] hover:bg-slate-100 text-slate-500 transition-all cursor-pointer border-none bg-transparent"
            >
              {sidebarCollapsed ? (
                <FiChevronRight className="w-[18px] h-[18px]" />
              ) : (
                <FiChevronLeft className="w-[18px] h-[18px]" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-slate-100 text-slate-500 cursor-pointer border-none bg-transparent"
            >
              <FiMenu className="w-[18px] h-[18px]" />
            </button>
            <span className="text-sm font-black text-slate-800 tracking-tight capitalize">{activeTab.replace('-', ' ')} Console</span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-[5px]">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
            <span>Master Authorized</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">

          {/* ── OVERVIEW TAB ────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total Registered Stores', val: merchants.length, pct: '+12.4% vs last mo', color: 'from-orange-500 to-amber-500', icon: <FiShoppingBag className="w-5 h-5 text-white" /> },
                  { title: 'Gross Annualized Billing', val: `$${(transactions.reduce((acc, t) => acc + t.amount, 0) * 12).toFixed(2)}`, pct: '+8.3% monthly MRR', color: 'from-emerald-500 to-teal-500', icon: <FiTrendingUp className="w-5 h-5 text-white" /> },
                  { title: 'Active Merchants Rate', val: `${((merchants.filter(m => m.status === 'active').length / merchants.length) * 100).toFixed(0)}%`, pct: '4 active licenses', color: 'from-indigo-500 to-blue-500', icon: <FiActivity className="w-5 h-5 text-white" /> },
                  { title: 'Platform Server Status', val: '99.98%', pct: 'Phnom Penh API active', color: 'from-purple-500 to-pink-500', icon: <FiLock className="w-5 h-5 text-white" /> },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-[5px] border border-slate-200/60 shadow-sm relative overflow-hidden flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{stat.title}</span>
                      <span className="text-2xl font-black text-slate-900 block">{stat.val}</span>
                      <span className="text-[10px] font-bold text-slate-500 block">{stat.pct}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-[5px] bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md shadow-slate-300/30`}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Subscriptions Grid Graph */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[5px] border border-slate-200/60 shadow-sm lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3">Package License Distribution</h3>
                  <div className="space-y-4">
                    {['premium', 'standard', 'basic', 'free'].map(tier => {
                      const count = merchants.filter(m => m.tier === tier).length;
                      const pct = merchants.length ? (count / merchants.length) * 100 : 0;
                      return (
                        <div key={tier} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold capitalize">
                            <span>{tier} plan ({count} stores)</span>
                            <span>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick platform logs */}
                <div className="bg-white p-6 rounded-[5px] border border-slate-200/60 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3">Audit logs</h3>
                  <div className="space-y-3.5">
                    {[
                      { msg: 'Lyhour Store Kh updated settings', time: '12 min ago' },
                      { msg: 'TXN-4089 processed successfully', time: '1 hr ago' },
                      { msg: 'New Merchant Chivorn Store registered', time: '1 day ago' },
                      { msg: 'Standard Plan features toggled', time: '3 days ago' },
                    ].map((log, i) => (
                      <div key={i} className="flex justify-between items-start text-xs font-semibold">
                        <span className="text-slate-700 truncate max-w-[180px]">{log.msg}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-bold">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MERCHANTS TAB ───────────────────────────────── */}
          {activeTab === 'merchants' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-[5px] border border-slate-200/60 shadow-sm">
                <span className="text-xs font-black text-slate-800 tracking-tight uppercase">Multi-store Merchant Directories ({merchants.length} registered)</span>
                <button
                  onClick={() => {
                    setCurrentMerchant({});
                    setIsAddModalOpen(true);
                  }}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-3.5 py-2 rounded-[5px] transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-orange-500/10 border-none w-max"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Register Store</span>
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-[5px] border border-slate-200/60 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-4">Owner ID</th>
                      <th className="p-4">Merchant Info</th>
                      <th className="p-4">Store Outlet</th>
                      <th className="p-4">Subscription</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                    {merchants.map((merchant) => (
                      <tr key={merchant.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">#{merchant.id}</td>
                        <td className="p-4 space-y-0.5">
                          <span className="block font-black text-slate-800 text-sm">{merchant.name}</span>
                          <span className="block text-[10px] text-slate-400 font-bold">{merchant.email} | {merchant.phone}</span>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{merchant.storeName}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${merchant.tier === 'premium' ? 'bg-indigo-50 text-indigo-600' :
                              merchant.tier === 'standard' ? 'bg-orange-50 text-orange-600' :
                                merchant.tier === 'basic' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {merchant.tier}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${merchant.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                            {merchant.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setCurrentMerchant({ ...merchant });
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-[5px] cursor-pointer transition-colors border-none bg-transparent"
                            title="Edit Merchant"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to completely deregister and delete store "${merchant.storeName}"?`)) {
                                try {
                                  if (merchant.createdBy) {
                                    await client.delete(`/users/${merchant.createdBy}`);
                                    toast.success('Merchant database record removed.');
                                    fetchStores();
                                  } else {
                                    toast.error('No owner associated with this store.');
                                  }
                                } catch (err: any) {
                                  toast.error('Failed to remove merchant.');
                                }
                              }
                            }}
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[5px] cursor-pointer transition-colors border-none bg-transparent"
                            title="Deregister Store"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SUBSCRIPTIONS TAB (20-Feature Grid Toggles) ───── */}
          {activeTab === 'subscriptions' && (
            <SubscriptionsTab
              planFeatures={planFeatures}
              setPlanFeatures={setPlanFeatures}
              planPrices={planPrices}
              setPlanPrices={setPlanPrices}
            />
          )}

          {/* ── PAYMENTS TAB ────────────────────────────────── */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Gross Stats */}
              <div className="bg-white p-5 rounded-[5px] border border-slate-200/60 shadow-sm max-w-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Platform Gross Invoices</span>
                  <span className="text-3xl font-black text-slate-900 block">
                    ${transactions.reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 block">Sum of all multi-store licenses fees processed.</span>
                </div>
                <div className="w-10 h-10 rounded-[5px] bg-primary/10 flex items-center justify-center">
                  <FiCreditCard className="w-5 h-5 text-primary" />
                </div>
              </div>

              {/* Transactions list */}
              <div className="bg-white rounded-[5px] border border-slate-200/60 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-4">TXN ID</th>
                      <th className="p-4">Store Name</th>
                      <th className="p-4">Plan License</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Invoice Date</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{txn.id}</td>
                        <td className="p-4">
                          <span className="block font-black text-slate-800">{txn.store}</span>
                          <span className="block text-[10px] text-slate-400 font-bold">Owner: {txn.owner}</span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600">
                            {txn.tier}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">${txn.amount.toFixed(2)}</td>
                        <td className="p-4 text-slate-500">{txn.date}</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ASSIGN TEMPLATE TAB ────────────────────────── */}
          {activeTab === 'assign-template' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-[5px] border border-slate-200/60 shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-800 tracking-tight uppercase block">Store Template Assignments ({assignments.length} assigned)</span>
                  <span className="text-[10px] font-bold text-slate-400 block">Manage which premium layout templates are assigned to which stores.</span>
                </div>
                <button
                  onClick={() => {
                    setNewAssignment({ userId: '', templateId: '' });
                    setIsAssignModalOpen(true);
                  }}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-3.5 py-2 rounded-[5px] transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-orange-500/10 border-none w-max"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Assign Template</span>
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-[5px] border border-slate-200/60 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-4">Assignment ID</th>
                      <th className="p-4">Merchant Info</th>
                      <th className="p-4">Store Outlet</th>
                      <th className="p-4">Assigned Template</th>
                      <th className="p-4">Code / Theme Key</th>
                      <th className="p-4">Assigned Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-bold text-sm">
                          No templates assigned yet. Click the "Assign Template" button to start.
                        </td>
                      </tr>
                    ) : (
                      assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-900">#{assignment.id}</td>
                          <td className="p-4 space-y-0.5">
                            <span className="block font-black text-slate-800 text-sm">
                              {assignment.user?.name || 'Unknown Owner'}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-bold">
                              {assignment.user?.email || 'No Email'}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-800">
                            {assignment.store?.store_name || 'Unnamed Store'}
                          </td>
                          <td className="p-4 font-bold text-slate-800 text-primary">
                            {assignment.template?.title || 'Unknown Template'}
                          </td>
                          <td className="p-4 space-y-0.5">
                            <span className="block text-slate-900 font-bold">{assignment.template?.tpl_code || 'N/A'}</span>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{assignment.template?.theme_key || 'N/A'}</span>
                          </td>
                          <td className="p-4 text-slate-500">
                            {assignment.purchased_at ? assignment.purchased_at.split(' ')[0] : 'N/A'}
                          </td>
                          <td className="p-4 text-right space-x-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setCurrentAssignment({
                                  id: assignment.id,
                                  userId: assignment.user_id.toString(),
                                  templateId: assignment.template_id.toString(),
                                });
                                setIsEditAssignModalOpen(true);
                              }}
                              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-[5px] cursor-pointer transition-colors border-none bg-transparent"
                              title="Edit Assignment"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveAssignment(assignment.id, assignment.store?.store_name || 'Store', assignment.template?.title || 'Template')}
                              className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[5px] cursor-pointer transition-colors border-none bg-transparent"
                              title="Remove Assignment"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ────────────────────────────────── */}
          {activeTab === 'settings' && <SettingTab />}

        </main>
      </div>

      {/* ─── ADD MERCHANT MODAL ──────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-2xl w-full max-w-md p-6 relative animate-slide-up">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Register Store Outlet</h3>

            <form onSubmit={handleAddMerchant} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hour Lyhour"
                  value={currentMerchant.name || ''}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Email</label>
                <input
                  type="email"
                  required
                  placeholder="hour@biteflow.com"
                  value={currentMerchant.email || ''}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Outlet Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lyhour Store Kh"
                  value={currentMerchant.storeName || ''}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, storeName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+855 -- --- ---"
                  value={currentMerchant.phone || ''}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, phone: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription package</label>
                <select
                  value={currentMerchant.tier || 'free'}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, tier: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic (${planPrices.basic}/mo)</option>
                  <option value="standard">Standard (${planPrices.standard}/mo)</option>
                  <option value="premium">Premium (${planPrices.premium}/mo)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-[5px] shadow-md border-none cursor-pointer mt-2"
              >
                Register & Save merchant
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT MERCHANT MODAL ─────────────────────────────────────────────── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-2xl w-full max-w-md p-6 relative animate-slide-up">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Edit Merchant Details</h3>

            <form onSubmit={handleEditMerchantSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Name</label>
                <input
                  type="text"
                  required
                  value={currentMerchant.name || ''}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Email</label>
                <input
                  type="email"
                  required
                  value={currentMerchant.email || ''}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Outlet Name</label>
                <input
                  type="text"
                  required
                  value={currentMerchant.storeName || ''}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, storeName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                <input
                  type="text"
                  value={currentMerchant.phone || ''}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, phone: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">License Package Plan</label>
                <select
                  value={currentMerchant.tier || 'free'}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, tier: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic (${planPrices.basic}/mo)</option>
                  <option value="standard">Standard (${planPrices.standard}/mo)</option>
                  <option value="premium">Premium (${planPrices.premium}/mo)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                <select
                  value={currentMerchant.status || 'active'}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, status: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sidebar Access</label>
                <select
                  value={currentMerchant.sidebarStatus !== false ? 'true' : 'false'}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, sidebarStatus: e.target.value === 'true' })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800"
                >
                  <option value="true">Open</option>
                  <option value="false">Closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subsidebar Access</label>
                <select
                  value={currentMerchant.subsidebarStatus !== false ? 'true' : 'false'}
                  onChange={(e) => setCurrentMerchant({ ...currentMerchant, subsidebarStatus: e.target.value === 'true' })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800"
                >
                  <option value="true">Open</option>
                  <option value="false">Closed</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-[5px] shadow-md border-none cursor-pointer mt-2"
              >
                Save Particulars
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN TEMPLATE MODAL ─────────────────────────────────────────────── */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-2xl w-full max-w-md p-6 relative animate-slide-up">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Assign Template to Store</h3>

            <form onSubmit={handleAssignTemplate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Store / Merchant</label>
                <select
                  required
                  value={newAssignment.userId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, userId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Choose Store --</option>
                  {merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.createdBy}>
                      {merchant.storeName} ({merchant.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Template</label>
                <select
                  required
                  value={newAssignment.templateId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, templateId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Choose Template --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title} ({tpl.tpl_code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-[5px] shadow-md border-none cursor-pointer mt-2"
              >
                Assign & Save
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditAssignModalOpen && currentAssignment && (
        <div className="fixed inset-0 z-[300] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-2xl w-full max-w-md p-6 relative animate-slide-up">
            <button
              onClick={() => {
                setIsEditAssignModalOpen(false);
                setCurrentAssignment(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Edit Template Assignment</h3>

            <form onSubmit={handleEditAssignmentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Store / Merchant</label>
                <select
                  required
                  value={currentAssignment.userId}
                  onChange={(e) => setCurrentAssignment({ ...currentAssignment, userId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Choose Store --</option>
                  {merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.createdBy}>
                      {merchant.storeName} ({merchant.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Template</label>
                <select
                  required
                  value={currentAssignment.templateId}
                  onChange={(e) => setCurrentAssignment({ ...currentAssignment, templateId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Choose Template --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title} ({tpl.tpl_code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-[5px] shadow-md border-none cursor-pointer mt-2"
              >
                Update Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => (
  <TranslationProvider>
    <DashboardContent {...props} />
  </TranslationProvider>
);

