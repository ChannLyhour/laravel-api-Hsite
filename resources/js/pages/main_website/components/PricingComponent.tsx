import React from 'react';
import { useTranslation } from '../lang/i18n';

interface PricingFeature {
  label: string;
  icon: React.ReactNode;
  availableIn: ('free' | 'basic' | 'standard' | 'premium')[];
  labelOverrides?: {
    [key in 'free' | 'basic' | 'standard' | 'premium']?: string;
  };
}

interface PricingComponentProps {
  onNavigate?: (to: string) => void;
}

export const PricingComponent: React.FC<PricingComponentProps> = React.memo(({ onNavigate }) => {
  const { t } = useTranslation();

  const plans = [
    {
      id: 'free' as const,
      name: t('pricing.free'),
      price: 'Free',
      period: t('pricing.period_free'),
      cta: t('pricing.cta_register'),
      badge: null,
      highlight: false,
    },
    {
      id: 'basic' as const,
      name: t('pricing.basic'),
      price: '$3.99',
      period: t('pricing.period_mo'),
      cta: t('pricing.cta_get_started'),
      badge: null,
      highlight: false,
    },
    {
      id: 'standard' as const,
      name: t('pricing.standard'),
      price: '$5.99',
      period: t('pricing.period_mo'),
      cta: t('pricing.cta_get_started'),
      badge: t('pricing.popular'),
      highlight: true,
      highlightClass: 'border-2 border-amber-500 shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] scale-[1.05] z-10',
    },
    {
      id: 'premium' as const,
      name: t('pricing.premium'),
      price: '$9.99',
      period: t('pricing.period_mo'),
      cta: t('pricing.cta_get_started'),
      badge: null,
      highlight: false,
    },
  ];

  const features: PricingFeature[] = [
    {
      label: t('pricing.feature_products'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      availableIn: ['free', 'basic', 'standard', 'premium'],
      labelOverrides: {
        free: `10 ${t('about.products')}`,
        basic: `35 ${t('about.products')}`,
        standard: `150 ${t('about.products')}`,
        premium: `Unlimited ${t('about.products')}`,
      }
    },
    {
      label: t('pricing.feature_categories'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      availableIn: ['free', 'basic', 'standard', 'premium'],
      labelOverrides: {
        free: '2 Categories',
        basic: '4 Categories',
        standard: '10 Categories',
        premium: 'Unlimited Categories',
      }
    },
    {
      label: t('pricing.feature_orders'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      availableIn: ['free', 'basic', 'standard', 'premium'],
      labelOverrides: {
        free: '10 Orders/mo',
        basic: 'Unlimited Orders/mo',
        standard: 'Unlimited Orders/mo',
        premium: 'Unlimited Orders/mo',
      }
    },
    {
      label: t('pricing.feature_staff'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      availableIn: ['free', 'basic', 'standard', 'premium'],
      labelOverrides: {
        free: '0 Staff',
        basic: 'Unlimited Staff',
        standard: 'Unlimited Staff',
        premium: 'Unlimited Staff',
      }
    },
    {
      label: t('pricing.feature_ordering'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      availableIn: ['free', 'basic', 'standard', 'premium'],
    },
    {
      label: t('pricing.feature_reviews'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
        </svg>
      ),
      availableIn: ['free', 'basic', 'standard', 'premium'],
    },
    {
      label: t('pricing.feature_reservations'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      availableIn: ['basic', 'standard', 'premium'],
    },
    {
      label: t('pricing.feature_analytics'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      availableIn: ['basic', 'standard', 'premium'],
    },
    {
      label: t('pricing.feature_delivery'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      availableIn: ['standard', 'premium'],
    },
    {
      label: t('pricing.feature_coupons'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      availableIn: ['standard', 'premium'],
    },
    {
      label: t('pricing.feature_qr'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 11v1m4-6h1m-9 0h1m4-4h.01M9 16h.01M5 5h4v4H5V5zm0 10h4v4H5v-4zm10-10h4v4h-4V5z" />
        </svg>
      ),
      availableIn: ['free', 'basic', 'standard', 'premium'],
    },
    {
      label: t('pricing.feature_domain'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      availableIn: ['premium'],
    },
    {
      label: t('pricing.feature_ai'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      availableIn: ['standard', 'premium'],
    },
  ];

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#020617] border-y border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300" id="pricing">
      {/* Background Accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto text-center mb-20">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-amber-500 bg-amber-500/10 uppercase tracking-wider border border-amber-500/25 mb-6">
          {t('pricing.badge')}
        </span>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-4">
          {t('pricing.headline')}
        </h2>
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          {t('pricing.desc')}
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
        {plans.map((plan, idx) => {
          return (
            <div
              key={plan.id}
              data-aos="fade-up"
              data-aos-delay={idx * 50}
              data-aos-anchor-placement="top-bottom"
              className={`relative bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-xl flex flex-col transition-all duration-500 transition-colors duration-300 ${
                plan.highlight
                  ? 'border-2 border-amber-500 shadow-[0_0_40px_-10px_rgba(245,158,11,0.15)] dark:shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)] scale-[1.05] z-10'
                  : 'border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-900/80'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold text-slate-950 bg-amber-500 tracking-wider shadow-lg shadow-amber-500/30 uppercase">
                  {plan.badge}
                </span>
              )}

              {/* Card Header */}
              <div className="p-8 border-b border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] block mb-3">
                  {plan.name}
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-500 capitalize">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Card Features */}
              <div className="p-8 flex-1 space-y-5">
                {features.map((feature, index) => {
                  const isAvailable = feature.availableIn.includes(plan.id);
                  const displayLabel = feature.labelOverrides?.[plan.id] || feature.label;

                  return (
                    <div
                      key={index}
                      className={`flex items-center text-xs font-bold transition-colors ${
                        isAvailable ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {isAvailable ? (
                        <span
                          className={`w-6 h-6 rounded-lg inline-flex items-center justify-center shrink-0 mr-4 ${
                            plan.highlight
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-100 dark:bg-white/5 text-amber-500'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-700 inline-flex items-center justify-center shrink-0 mr-4">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}

                      {/* Feature Label */}
                      <span className="truncate tracking-wide">{displayLabel}</span>
                    </div>
                  );
                })}
              </div>

              {/* Card Footer */}
              <div className="p-8 border-t border-slate-200 dark:border-white/5 mt-auto bg-slate-50 dark:bg-black/20 rounded-b-xl">
                <button
                  onClick={() => {
                    onNavigate?.(`/register-owner?tier=${plan.id}`);
                  }}
                  className={`w-full py-3.5 px-6 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border-none uppercase tracking-wider ${
                    plan.highlight
                      ? 'bg-[#FFAD21] hover:bg-[#FFAD21]/90 text-slate-950 shadow-md shadow-[#FFAD21]/15 active:scale-[0.98]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white active:scale-[0.98]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
