import React, { useState, useEffect, useMemo } from 'react';
import type { StoreRow } from '@/api/owner/stores';
import { CardProduct } from './CardProduct';
import { FASHION_ROUTES } from '../../routes';
import { resolveImageUrl } from '../../utils/imageUtils';
import { SkeletonCard } from './SkeletonSt';

interface FlashDealsGridProps {
  deal?: any;
  displayItems?: any[];
  ownerUserId?: number | string;
  stores?: StoreRow;
  storeName?: string;
  onNavigate?: (to: string) => void;
  addToCart?: (item: any, qty?: number, size?: string, color?: string, price?: number) => void;
  favorites?: Record<string, boolean>;
  toggleFavorite?: (id: string, name: string) => void;
  isLoading?: boolean;
}

export const FlashDealsGrid: React.FC<FlashDealsGridProps> = (props) => {
  if (props.isLoading) {
    return (
      <div className="w-full text-left py-4 border-b border-stone-200/40 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Column: Visual Banner & Countdown Placeholder */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-4">
            <div className="w-full rounded-[6px] relative overflow-hidden flex flex-col justify-end p-6 min-h-[200px] lg:min-h-[230px] bg-stone-200 dark:bg-stone-850 shadow-sm" />
            <div className="w-full bg-white dark:bg-stone-950 border border-stone-200/80 dark:border-stone-850 px-4 py-4 rounded-[6px] shadow-3xs flex flex-col items-center justify-center min-h-[120px] space-y-2">
              <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
              <div className="flex gap-2 w-full justify-center">
                <div className="w-12 h-10 bg-stone-200 dark:bg-stone-800 rounded" />
                <div className="w-12 h-10 bg-stone-200 dark:bg-stone-800 rounded" />
                <div className="w-12 h-10 bg-stone-200 dark:bg-stone-800 rounded" />
                <div className="w-12 h-10 bg-stone-200 dark:bg-stone-800 rounded" />
              </div>
            </div>
          </div>
          {/* Right Column: Products Vertical Grid Placeholder */}
          <div className="flex-grow w-full">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 sm:gap-y-10 w-full">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <FlashDealsGridInner {...props} />;
};

const FlashDealsGridInner: React.FC<FlashDealsGridProps> = ({
  deal,
  displayItems = [],
  ownerUserId,
  stores,
  storeName = '',
  onNavigate,
  addToCart,
  favorites = {},
  toggleFavorite,
}) => {

  const [status, setStatus] = useState<'upcoming' | 'active' | 'ended'>('active');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const products = useMemo(() => {
    const rawProducts = deal.products || [];
    return [...rawProducts].sort((a, b) => {
      const idA = a.pivot?.id ?? 0;
      const idB = b.pivot?.id ?? 0;
      if (idA !== idB) return idA - idB;
      return a.id - b.id;
    });
  }, [deal.products]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = deal.start_date ? new Date(deal.start_date).getTime() : 0;
      const end = deal.end_date ? new Date(deal.end_date).getTime() : 0;

      let difference = 0;
      let newStatus: 'upcoming' | 'active' | 'ended' = 'active';

      if (start && now < start) {
        newStatus = 'upcoming';
        difference = start - now;
      } else if (end && now <= end) {
        newStatus = 'active';
        difference = end - now;
      } else {
        newStatus = 'ended';
        difference = 0;
      }

      setStatus(newStatus);

      let left = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };

      if (difference > 0) {
        left = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return left;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deal.start_date, deal.end_date]);

  const resolvedBannerImg = deal.image
    ? resolveImageUrl(deal.image)
    : (products[0] ? resolveImageUrl(products[0].display_image || products[0].image) : null);

  if (products.length === 0) return null;

  const handleBannerClick = (e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
      onNavigate(FASHION_ROUTES.getOffers(ownerUserId, storeSlug, 'flash'));
    }
  };

  return (
    <div className="w-full text-left border-b border-stone-200/40 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Column: Visual Banner & Countdown (Sticky) */}
        <div className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-[90px] self-start space-y-4">

          {/* Banner Card */}
          <div
            data-aos="fade-right"
            className="w-full rounded-[6px] relative overflow-hidden flex flex-col justify-end p-6 min-h-[200px] lg:min-h-[230px] shadow-sm select-none group cursor-pointer"
            onClick={handleBannerClick}
          >
            {/* Zooming Background Image/Gradient */}
            <div
              className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                background: resolvedBannerImg
                  ? `linear-gradient(to top, rgba(10, 10, 10, 0.9) 0%, rgba(10, 10, 10, 0.2) 60%), url(${resolvedBannerImg}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #1c1c1c 0%, #3a0d16 100%)'
              }}
            />

            {/* Subtle glow/flare */}
            {!resolvedBannerImg && (
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#E61E25]/10 rounded-full blur-2xl z-0" />
            )}

            <div className="space-y-3 relative z-10">
              {/* Tag Badges */}
              {/* <div className="flex flex-wrap gap-2 items-center">
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 text-white text-[9px] font-black uppercase tracking-widest rounded-full leading-none shadow-xs ${
                  status === 'upcoming' 
                    ? 'bg-amber-500' 
                    : status === 'ended' 
                    ? 'bg-stone-500' 
                    : 'bg-[#E61E25]'
                }`}>
                  <span>⚡ {status === 'upcoming' ? 'Starts In' : status === 'ended' ? 'Ended' : 'Flash Sale'}</span>
                </div>
              </div> */}

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-tight">
                  {deal.title}
                </h3>
                {/* <p className="text-stone-300 text-2xs font-semibold leading-relaxed tracking-wide uppercase line-clamp-3">
                  {status === 'upcoming'
                    ? 'Get ready! The sale is starting soon.'
                    : status === 'ended'
                    ? 'This deal has ended. Stay tuned for the next offer!'
                    : 'Hurry Up! The offer is limited. Grab while it lasts.'}
                </p> */}
              </div>

              <button
                onClick={handleBannerClick}
                className="px-4 py-2 border border-white hover:bg-white hover:text-stone-950 text-white text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer rounded-[2px]"
              >
                Shop Flash Deals
              </button>
            </div>
          </div>

          {/* Countdown Card (Below the Banner Card) */}
          {status !== 'ended' && (
            <div className="w-full bg-white dark:bg-stone-950 border border-stone-200/80 dark:border-stone-850 px-4 py-4 rounded-[6px] shadow-3xs flex flex-col items-center justify-center animate-fade-in">
              <span className={`text-[10px] font-black uppercase tracking-widest mb-3.5 flex items-center gap-1 ${status === 'upcoming' ? 'text-amber-500' : 'text-[#E61E25]'
                }`}>
                ⚡ {status === 'upcoming' ? 'Sale Starts In' : 'Flash Sale Ends In'}
              </span>
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
                {/* Days */}
                <div className="flex flex-col items-center min-w-[48px]">
                  <span className="font-mono font-black text-lg bg-stone-50 dark:bg-stone-800 px-2.5 py-1.5 rounded border border-stone-200/60 dark:border-stone-700 shadow-3xs">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider mt-1.5 text-stone-400">Days</span>
                </div>
                <span className="text-lg font-black text-stone-300 dark:text-stone-700 pb-5">:</span>

                {/* Hours */}
                <div className="flex flex-col items-center min-w-[48px]">
                  <span className="font-mono font-black text-lg bg-stone-50 dark:bg-stone-800 px-2.5 py-1.5 rounded border border-stone-200/60 dark:border-stone-700 shadow-3xs">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider mt-1.5 text-stone-400">Hours</span>
                </div>
                <span className="text-lg font-black text-stone-300 dark:text-stone-700 pb-5">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center min-w-[48px]">
                  <span className="font-mono font-black text-lg bg-stone-50 dark:bg-stone-800 px-2.5 py-1.5 rounded border border-stone-200/60 dark:border-stone-700 shadow-3xs">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider mt-1.5 text-stone-400">Mins</span>
                </div>
                <span className="text-lg font-black text-stone-300 dark:text-stone-700 pb-5">:</span>

                {/* Seconds */}
                <div className="flex flex-col items-center min-w-[48px]">
                  <span className="font-mono font-black text-lg bg-stone-50 dark:bg-stone-800 px-2.5 py-1.5 rounded border border-stone-200/60 dark:border-stone-700 shadow-3xs">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider mt-1.5 text-stone-400">Secs</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Products Vertical Grid */}
        <div className="flex-grow w-full">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 sm:gap-y-10 w-full">
            {products.map((product: any, idx: number) => {
              const isFavorited = !!favorites[String(product.id)];
              const fullProduct = displayItems.find((item) => item.id === product.id) || product;
              return (
                <div
                  key={product.id}
                  className="w-full"
                >
                  <CardProduct
                    item={fullProduct}
                    ownerUserId={ownerUserId}
                    stores={stores}
                    storeName={storeName}
                    onNavigate={onNavigate}
                    addToCart={addToCart}
                    isFavorited={isFavorited}
                    onToggleFavorite={toggleFavorite}
                    aosDelay={(idx % 3) * 100}
                  />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

