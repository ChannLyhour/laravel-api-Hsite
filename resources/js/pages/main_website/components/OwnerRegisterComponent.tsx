import React, { useState } from 'react';
import { FiUser, FiMail, FiLock, FiMapPin, FiShoppingBag, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { client } from '@/api/client';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../lang/i18n';

interface OwnerRegisterComponentProps {
  onNavigate: (to: string) => void;
}

export const OwnerRegisterComponent: React.FC<OwnerRegisterComponentProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  // Get initial tier from URL query parameters
  const getInitialTier = () => {
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier')?.toLowerCase();
    if (tier && ['free', 'basic', 'standard', 'premium'].includes(tier)) {
      return tier;
    }
    return 'free';
  };

  const [selectedTier, setSelectedTier] = useState<string>(getInitialTier);

  // Field validation
  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Valid owner email is required.');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!storeName.trim()) {
      toast.error('Store name is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);

    try {
      // 1. Create owner user
      const regRes = await client.post<any>('/register', {
        name: `${firstName.trim()} ${lastName.trim()}`,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        country: 'Cambodia',
        email,
        password,
        role_id: 30003, // Owner
        phone: null,
        state: 'active',
      });

      const token = regRes?.token;
      const newUserId = regRes?.user?.id;
      if (!token || !newUserId) {
        throw new Error('Registration succeeded, but token or user details were missing.');
      }

      // Log the user in locally
      localStorage.setItem('admin_token', token);
      localStorage.setItem('selected_owner_id', String(newUserId));

      // 2. Create the associated store record
      await client.post<any>('/stores', {
        created_by: newUserId,
        store_name: storeName,
        store_phone: null,
        store_email: email,
        store_address: storeAddress || null,
        subscription_tier: selectedTier,
        custom_domain: null,
        tax_percentage: 10.0,
      });

      toast.success('Registration successful! Launching your Prime workspace...');

      setTimeout(() => {
        window.location.href = '/owner';
      }, 1200);

    } catch (err: any) {
      localStorage.removeItem('admin_token');
      const errMsg = err.response?.data?.detail || err.message || 'Failed to complete registration.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-slate-50 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-2xl rounded-2xl border border-slate-200 p-8 sm:p-14 shadow-2xl z-10">
        
        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
              step === 1 ? 'bg-[#FFAD21] text-slate-950 shadow-md shadow-[#FFAD21]/20' : 'bg-emerald-500 text-slate-950'
            }`}>
              {step > 1 ? <FiCheck className="w-5 h-5" /> : '1'}
            </span>
            <span className={`text-xs font-bold tracking-wider uppercase transition-colors ${
              step === 1 ? 'text-slate-900' : 'text-slate-500'
            }`}>
              {t('register.profile')}
            </span>
          </div>

          <div className="h-px flex-1 bg-slate-200 mx-6" />

          <div className="flex items-center space-x-4">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
              step === 2 ? 'bg-[#FFAD21] text-slate-950 shadow-md shadow-[#FFAD21]/20' : 'bg-slate-200 text-slate-500'
            }`}>
              2
            </span>
            <span className={`text-xs font-bold tracking-wider uppercase transition-colors ${
              step === 2 ? 'text-slate-900' : 'text-slate-500'
            }`}>
              {t('register.outlet')}
            </span>
          </div>
        </div>

        {/* Section Header */}
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
            {step === 1 ? t('register.title_profile') : t('register.title_outlet')}
          </h2>
          <p className="text-slate-600 text-sm mt-3 font-medium">
            {step === 1 ? t('register.desc_profile') : t('register.desc_outlet')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (validateStep1()) setStep(2); } : handleSubmit} className="space-y-6">
          
          {step === 1 ? (
            /* ================= STEP 1: OWNER USER ACCOUNT ================= */
            <div className="space-y-5 animate-fade-in">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                    {t('register.first_name')} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chann"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                    {t('register.last_name')} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lyhour"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                  {t('register.email')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="owner@prime-website.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                  {t('register.password')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                    <FiLock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-8 py-3.5 bg-[#FFAD21] hover:bg-[#FFAD21]/90 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-[#FFAD21]/20 active:scale-[0.98] flex items-center justify-center space-x-2 border-none cursor-pointer uppercase tracking-wider"
              >
                <span>{t('register.continue')}</span>
                <FiArrowRight className="w-5 h-5" />
              </button>

            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                  {t('register.store_name')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                    <FiShoppingBag className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prime Gourmet"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                  {t('register.address')}
                </label>
                <div className="relative group">
                  <div className="absolute top-4 left-4 pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                    <FiMapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Full street address..."
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-amber-500/50 focus:bg-white focus:outline-none resize-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                  {t('register.tier')}
                </label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#FFAD21]/50 focus:bg-white focus:outline-none appearance-none cursor-pointer transition-all"
                >
                  <option value="free" className="bg-white text-slate-900">{t('register.tier_free')}</option>
                  <option value="basic" className="bg-white text-slate-900">{t('register.tier_basic')}</option>
                  <option value="standard" className="bg-white text-slate-900">{t('register.tier_standard')}</option>
                  <option value="premium" className="bg-white text-slate-900">{t('register.tier_premium')}</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center space-x-2 border-none cursor-pointer uppercase tracking-wider"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>{t('register.back')}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3.5 bg-[#FFAD21] hover:bg-[#FFAD21]/90 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-[#FFAD21]/20 active:scale-[0.98] flex items-center justify-center space-x-2 border-none cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t('register.finalize')}</span>
                      <FiCheck className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </form>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm font-bold text-slate-500">
            {t('register.already_registered')}{' '}
            <button
              onClick={() => onNavigate('/owner/login')}
              className="text-[#FFAD21] hover:text-[#FFAD21]/90 font-bold transition-colors border-none bg-transparent cursor-pointer ml-1"
            >
              {t('register.signin')}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
