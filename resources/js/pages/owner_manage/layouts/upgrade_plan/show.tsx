import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiInfo, FiActivity, FiBriefcase, FiZap, FiAward } from 'react-icons/fi';
import { storesService } from '@/api/owner/stores';
import { toast } from '@/pages/owner_manage/utils/toast';
import { useTranslation } from '../../lang/i18n';

interface UpgradePlanShowProps {
     ownerId?: number | string;
     storeSettings?: any;
     onUpdateSettings?: (settings: any) => void;
}

interface PlanCard {
     id: 'free' | 'basic' | 'standard' | 'premium';
     name: string;
     price: string;
     period: string;
     description: string;
     color: string;
     gradient: string;
     icon: React.ReactNode;
     popular?: boolean;
     features: { name: string; included: boolean; detail?: string }[];
}

export const UpgradePlanShow: React.FC<UpgradePlanShowProps> = ({
     ownerId,
     storeSettings,
     onUpdateSettings
}) => {
     const { t } = useTranslation();
     const currentTier = storeSettings?.subscription_tier || 'free';
     const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
     const [prices, setPrices] = useState<Record<string, number>>({
          free: 0,
          basic: 5.99,
          standard: 9.99,
          premium: 14.99
     });

     useEffect(() => {
          const fetchPrices = async () => {
               try {
                    const res = await fetch('/api/subscriptions/prices');
                    if (res.ok) {
                         const data = await res.json();
                         setPrices(data);
                    }
               } catch (err) {
                    console.warn('Failed to fetch subscription prices:', err);
               }
          };
          fetchPrices();
     }, []);

     const handleUpgrade = async (tier: 'free' | 'basic' | 'standard' | 'premium') => {
          if (tier === currentTier) {
               toast.info('You are already on this plan!');
               return;
          }

           setLoadingPlan(tier);
           try {
                const updated = await storesService.updateStore({ subscription_tier: tier }, ownerId);
                if (onUpdateSettings) {
                     onUpdateSettings(updated);
                }
                toast.success(`Successfully switched to the ${tier.toUpperCase()} plan!`);
                // Notify other parts of the app about data update
                window.dispatchEvent(new CustomEvent('data_updated'));
                new BroadcastChannel('data_updates').postMessage('refresh');
           } catch (err) {
                console.error(err);
                toast.error('Failed to change subscription plan.');
           } finally {
                setLoadingPlan(null);
           }
      };

     const plans: PlanCard[] = [
          {
               id: 'free',
               name: 'Free Plan',
               price: `$${prices.free !== undefined ? prices.free : 0}`,
               period: 'forever',
               description: 'Perfect for testing and setting up your storefront.',
               color: 'from-slate-500 to-slate-700',
               gradient: 'bg-gradient-to-br from-slate-500/10 via-slate-600/5 to-transparent',
               icon: <FiBriefcase className="w-6 h-6 text-slate-500" />,
               features: [
                    { name: 'Products Limit: 10 Products', included: true },
                    { name: 'Categories Limit: 2 Categories', included: true },
                    { name: 'Orders Limit: 10 Orders/mo', included: true },
                    { name: 'Staff Accounts: 0 Staff', included: true },
                    { name: 'Online Ordering Storefront', included: true },
                    { name: 'Customer Reviews', included: true },
                    { name: 'QR Payment Integration', included: true },
                    { name: 'Advanced Reservations', included: false },
                    { name: 'Analytics & Sales Reports', included: false },
                    { name: 'Custom Delivery Zones', included: false },
                    { name: 'Coupons & Discounts', included: false },
                    { name: 'POS (Point of Sale) System', included: false },
                    { name: 'Custom Domains', included: false },
                    { name: 'Inventory Management', included: false },
               ]
          },
          {
               id: 'basic',
               name: 'Basic Plan',
               price: `$${prices.basic !== undefined ? prices.basic : 5.99}`,
               period: 'month',
               description: 'Great for small businesses and startup cafes.',
               color: 'from-blue-500 to-cyan-600',
               gradient: 'bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent',
               icon: <FiActivity className="w-6 h-6 text-blue-500" />,
               features: [
                    { name: 'Products Limit: 35 Products', included: true },
                    { name: 'Categories Limit: 4 Categories', included: true },
                    { name: 'Orders Limit: Unlimited Orders/mo', included: true },
                    { name: 'Staff Accounts: Unlimited Staff', included: true },
                    { name: 'Online Ordering Storefront', included: true },
                    { name: 'Customer Reviews', included: true },
                    { name: 'QR Payment Integration', included: true },
                    { name: 'Advanced Reservations', included: true },
                    { name: 'Analytics & Sales Reports', included: true },
                    { name: 'Custom Delivery Zones', included: false },
                    { name: 'Coupons & Discounts', included: false },
                    { name: 'POS (Point of Sale) System', included: false },
                    { name: 'Custom Domains', included: false },
                    { name: 'Inventory Management', included: false },
               ]
          },
          {
               id: 'standard',
               name: 'Standard Plan',
               price: `$${prices.standard !== undefined ? prices.standard : 9.99}`,
               period: 'month',
               description: 'Ideal plan for growing retail shops and restaurants.',
               color: 'from-orange-500 to-amber-600',
               gradient: 'bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent',
               icon: <FiZap className="w-6 h-6 text-orange-500" />,
               popular: true,
               features: [
                    { name: 'Products Limit: 150 Products', included: true },
                    { name: 'Categories Limit: 10 Categories', included: true },
                    { name: 'Orders Limit: Unlimited Orders/mo', included: true },
                    { name: 'Staff Accounts: Unlimited Staff', included: true },
                    { name: 'Online Ordering Storefront', included: true },
                    { name: 'Customer Reviews', included: true },
                    { name: 'QR Payment Integration', included: true },
                    { name: 'Advanced Reservations', included: true },
                    { name: 'Analytics & Sales Reports', included: true },
                    { name: 'Custom Delivery Zones', included: true },
                    { name: 'Coupons & Discounts', included: true },
                    { name: 'POS (Point of Sale) System', included: true },
                    { name: 'Custom Domains', included: false },
                    { name: 'Inventory Management', included: false },
               ]
          },
          {
               id: 'premium',
               name: 'Premium Plan',
               price: `$${prices.premium !== undefined ? prices.premium : 14.99}`,
               period: 'month',
               description: 'Ultimate power and customization for large enterprises.',
               color: 'from-violet-600 to-fuchsia-600',
               gradient: 'bg-gradient-to-br from-violet-600/10 via-fuchsia-500/5 to-transparent',
               icon: <FiAward className="w-6 h-6 text-violet-600" />,
               features: [
                    { name: 'Products Limit: Unlimited Products', included: true },
                    { name: 'Categories Limit: Unlimited Categories', included: true },
                    { name: 'Orders Limit: Unlimited Orders/mo', included: true },
                    { name: 'Staff Accounts: Unlimited Staff', included: true },
                    { name: 'Online Ordering Storefront', included: true },
                    { name: 'Customer Reviews', included: true },
                    { name: 'QR Payment Integration', included: true },
                    { name: 'Advanced Reservations', included: true },
                    { name: 'Analytics & Sales Reports', included: true },
                    { name: 'Custom Delivery Zones', included: true },
                    { name: 'Coupons & Discounts', included: true },
                    { name: 'POS (Point of Sale) System', included: true },
                    { name: 'Custom Domains & Branding', included: true },
                    { name: 'Inventory Management & Logs', included: true },
               ]
          }
     ];

     return (
          <div className="space-y-8 animate-fade-in font-kuntomruy w-full max-w-7xl mx-auto px-4 py-8">
               {/* Header section */}
               <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider">
                         <FiZap className="w-3.5 h-3.5 animate-pulse" />
                         Subscription Plans
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                         Scale Your E-Commerce Storefront
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">
                         Choose the plan that fits your business needs. Upgrade, downgrade, or cancel at any time instantly.
                    </p>
               </div>

               {/* Grid containing plans */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                    {plans.map((plan) => {
                         const isCurrent = plan.id === currentTier;

                         return (
                              <div
                                   key={plan.id}
                                   className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${plan.popular
                                             ? 'border-orange-500/40 shadow-md md:-translate-y-2'
                                             : 'border-slate-200 shadow-sm hover:shadow-md'
                                        } ${plan.gradient} overflow-hidden bg-white group`}
                              >
                                   {plan.popular && (
                                        <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black text-center py-1 uppercase tracking-widest">
                                             Best Value Plan
                                        </div>
                                   )}

                                   {/* Card Header */}
                                   <div className={`p-6 space-y-4 ${plan.popular ? 'pt-8' : ''}`}>
                                        <div className="flex items-center justify-between">
                                             <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs group-hover:scale-110 transition-all duration-300">
                                                  {plan.icon}
                                             </div>
                                             {isCurrent && (
                                                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                       Current Plan
                                                  </span>
                                             )}
                                        </div>

                                        <div className="space-y-1">
                                             <h3 className="text-lg font-black text-slate-800 group-hover:text-slate-900">
                                                  {plan.name}
                                             </h3>
                                             <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                  {plan.description}
                                             </p>
                                        </div>

                                        <div className="flex items-baseline gap-1 pt-2 border-b border-slate-100 pb-4">
                                             <span className="text-3xl font-extrabold text-slate-800">
                                                  {plan.price}
                                             </span>
                                             <span className="text-xs text-slate-400 font-bold">
                                                  /{plan.period}
                                             </span>
                                        </div>
                                   </div>

                                   {/* Features list */}
                                   <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[360px] custom-scrollbar space-y-3">
                                        {plan.features.map((feature, idx) => (
                                             <div key={idx} className="flex items-start gap-2 text-[11px] font-semibold">
                                                  {feature.included ? (
                                                       <FiCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                  ) : (
                                                       <FiX className="w-4 h-4 text-slate-350 shrink-0 mt-0.5" />
                                                  )}
                                                  <span className={feature.included ? 'text-slate-650' : 'text-slate-350 line-through'}>
                                                       {feature.name}
                                                  </span>
                                             </div>
                                        ))}
                                   </div>

                                   {/* Action button */}
                                   <div className="p-6 pt-0 mt-auto">
                                        <button
                                             onClick={() => handleUpgrade(plan.id)}
                                             disabled={loadingPlan !== null}
                                             className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-97 cursor-pointer border-none flex items-center justify-center gap-2 ${isCurrent
                                                       ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                       : plan.popular
                                                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm hover:shadow-md'
                                                            : 'bg-slate-800 hover:bg-slate-900 text-white shadow-xs'
                                                  }`}
                                        >
                                             {loadingPlan === plan.id ? (
                                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                             ) : isCurrent ? (
                                                  'Your Current Plan'
                                             ) : (
                                                  `Upgrade to ${plan.name.split(' ')[0]}`
                                             )}
                                        </button>
                                   </div>
                              </div>
                         );
                    })}
               </div>

               {/* FAQ Banner */}
               <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200/60 rounded-xl max-w-4xl mx-auto shadow-3xs">
                    <FiInfo className="w-5 h-5 text-slate-500 shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                         <strong>Important Note:</strong> Switching plans will immediately configure your storefront limit parameters. Existing items exceeding the new plan limit will remain visible but editing or duplicating them will be capped under your new plan's rules.
                    </p>
               </div>
          </div>
     );
};
