import React, { useEffect, useState } from 'react';
import { categoriesService } from '@/api/owner/categories';
import type { Root2 } from '@/api/owner/categories';
import { ApiError } from '@/api/client';
import {
  FiMapPin, FiPhone, FiMail,
  FiTrendingUp,
  FiMinus, FiPlus, FiTrash2, FiCoffee, FiCompass
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { Store_setting } from '@/api/owner/stores';
import { storeBrandingService } from '@/api/created_by/getFaviconById';
import '@/pages/owner_manage/style/font.css';
import type { SettingResponse } from '@/api/setting';

interface CafeShopPageProps {
  ownerUserId?: number | string;
  profile?: any;
  onNavigate?: (to: string) => void;
  storeName?: string;
  locale?: 'en' | 'km';
  settings?: SettingResponse['settings'] | null;
}

interface CartItem {
  id: string;
  item: Root2;
  qty: number;
}

export const CafeShopPage: React.FC<CafeShopPageProps> = ({
  ownerUserId,
  storeName = 'Cafe Blend',
  settings,
}) => {
  const [items, setItems] = useState<Root2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderMethod, setOrderMethod] = useState<'delivery' | 'pickup'>('delivery');

  // Dynamically update favicon for this specific store
  useEffect(() => {
    if (ownerUserId) {
      storeBrandingService.getFaviconByOwnerId(ownerUserId)
        .then(url => {
          if (url) storeBrandingService.applyFavicon(`${url}?v=${Date.now()}`);
        })
        .catch(err => console.warn('CafeShopPage: Failed to load favicon', err));
    }
  }, [ownerUserId]);

  useEffect(() => {
    const fetchBrews = async () => {
      try {
        setLoading(true);
        setError(null);
        // Load top 8 cafe products
        const data = await categoriesService.getTopSelling(8, ownerUserId);
        setItems(data || []);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.details.message);
        } else {
          setError('Failed to fetch beverages catalog.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBrews();
  }, [ownerUserId]);

  const addToCart = (item: Root2) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.id === String(item.id));
      if (existing) {
        toast.success(`Incremented cup count for ${item.name}!`);
        return prev.map(ci => ci.id === String(item.id) ? { ...ci, qty: ci.qty + 1 } : ci);
      }
      toast.success(`Added ${item.name} to cup!`);
      return [...prev, { id: String(item.id), item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(ci => ci.id === id ? { ...ci, qty: Math.max(1, ci.qty + delta) } : ci));
  };

  const removeFromCart = (id: string, name: string) => {
    setCart(prev => prev.filter(ci => ci.id !== id));
    toast.error(`Removed ${name} from cup.`);
  };

  const subtotal = cart.reduce((sum, ci) => sum + (parseFloat(ci.item.price) * ci.qty), 0);

  const dynamicSettings = Store_setting();
  const shippingFee = settings?.shipping_fee ? parseFloat(settings.shipping_fee) : (dynamicSettings?.shipping_fee ? parseFloat(dynamicSettings.shipping_fee) : 0);
  const threshold = settings?.free_shipping_threshold ? parseFloat(settings.free_shipping_threshold) : (dynamicSettings?.free_shipping_threshold ? parseFloat(dynamicSettings.free_shipping_threshold) : 0);

  const deliveryFee = orderMethod === 'delivery' && subtotal > 0 ? ((threshold > 0 && subtotal > threshold) ? 0 : shippingFee) : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#2B1B15] font-sans antialiased">

      {/* Dynamic Warm Cafe Header */}
      <header className="sticky top-0 z-50 bg-[#FCF9F4]/90 backdrop-blur-md border-b border-amber-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-800 p-2.5 rounded-[5px] text-white shadow-md">
              <FiCoffee className="w-5.5 h-5.5" />
            </div>
            <span className="font-serif font-black text-xl tracking-wide text-amber-950">
              {settings?.store_name || storeName}
            </span>
          </div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 rounded-[5px] text-2xs font-black text-amber-800 uppercase tracking-widest">
            ☕ Cafe Shop
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-amber-100/30 to-transparent border-b border-amber-900/5">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-amber-200/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* Left: Serifs Typography & CTAs */}
            <div className="lg:col-span-6 text-left space-y-6">
              <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-amber-100 rounded-[5px] text-xs font-black text-amber-850 uppercase tracking-wider">
                <FiCompass className="animate-spin" style={{ animationDuration: '8s' }} />
                <span>Exquisite Bean Selections</span>
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-amber-950 leading-tight">
                Brewing Happiness, <br />
                One Cup At A Time
              </h1>

              <p className="text-amber-800/80 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-medium">
                Savor handcrafted organic Arabica brews, single-origin hand drips, and sweet freshly-baked artisan pastries prepared daily.
              </p>

              <div className="flex gap-4 pt-2">
                <a
                  href="#menu"
                  className="px-8 py-4 bg-amber-800 hover:bg-amber-900 text-white font-extrabold rounded-[5px] transition-all shadow-lg shadow-amber-950/10 flex items-center space-x-2 text-base"
                >
                  <span>Browse Our Roast Brews</span>
                  <FiCoffee className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Right: Graphic Card Mockup */}
            <div className="lg:col-span-6 flex justify-center relative">
              <div className="absolute w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] bg-amber-300/10 rounded-full blur-3xl -z-10 animate-pulse" />
              <div className="relative w-full max-w-[460px] bg-white p-3.5 rounded-[5px] shadow-lg border border-amber-100/50 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
                  alt="Cozy Premium Coffee Layout"
                  className="rounded-[5px] w-full h-[300px] object-cover shadow-xs"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Showcase & Cart Split */}
      <section id="menu" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Products Column */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 rounded-[5px] text-[10px] font-black text-amber-850 uppercase tracking-wider">
                <FiTrendingUp />
                <span>Today's Roast Special</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-amber-950 tracking-tight">
                Handcrafted Beverages &amp; Pastries
              </h2>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin h-9 w-9 border-4 border-amber-850 border-t-transparent rounded-full" />
                <p className="text-amber-800 text-xs font-bold">Grinding beans...</p>
              </div>
            )}

            {error && (
              <div className="text-rose-705 bg-rose-50 border border-rose-100 p-4 rounded-[5px] text-xs font-bold text-center">
                ⚠️ {error}
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="text-center py-16 space-y-2 bg-white rounded-[5px] border border-amber-100/60">
                <span className="text-3xl">☕</span>
                <h4 className="font-extrabold text-amber-900">Cafeteria menu is quiet today</h4>
              </div>
            )}

            {/* Coffee Grid */}
            {!loading && items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-[5px] border border-amber-100/60 p-4 flex flex-col justify-between gap-4 hover:border-amber-300 hover:shadow-md transition-all duration-300 relative group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow space-y-2">
                        <h4 className="font-serif font-black text-amber-950 text-sm sm:text-base leading-tight group-hover:text-amber-700 transition-colors">
                          {item.name}
                        </h4>
                        <div className="text-xs font-black text-amber-800">${parseFloat(item.price).toFixed(2)}</div>
                        <p className="text-amber-850/60 text-2xs leading-relaxed line-clamp-2 font-medium">
                          {item.description || 'Delicately extracted to preserve complete tasting profiles.'}
                        </p>
                      </div>

                      <div className="relative shrink-0 w-24 h-24 overflow-hidden rounded-[5px] border border-amber-100 bg-amber-50">
                        <img
                          src={item.display_image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          onClick={() => addToCart(item)}
                          className="absolute bottom-1.5 right-1.5 w-6.5 h-6.5 bg-amber-800 hover:bg-amber-900 text-white rounded-[5px] flex items-center justify-center shadow-md font-black transition-all cursor-pointer text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-[5px] w-max mt-1">
                      <span>☕</span>
                      <span>Barista Craft</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1 bg-white border border-amber-100 rounded-[5px] p-5 shadow-sm sticky top-24 space-y-6">
            <div className="flex p-1 bg-[#FCF9F4] rounded-[5px] border border-amber-100">
              <button
                onClick={() => setOrderMethod('delivery')}
                className={`flex-1 py-2 text-center text-xs font-extrabold rounded-[5px] transition-all cursor-pointer ${orderMethod === 'delivery'
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'text-amber-850/60 hover:text-amber-900'
                  }`}
              >
                Delivery
              </button>
              <button
                onClick={() => setOrderMethod('pickup')}
                className={`flex-1 py-2 text-center text-xs font-extrabold rounded-[5px] transition-all cursor-pointer ${orderMethod === 'pickup'
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'text-amber-850/60 hover:text-amber-900'
                  }`}
              >
                Takeaway
              </button>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                <h4 className="text-2xs font-black text-amber-800 uppercase tracking-wider border-b border-amber-50 pb-2">
                  My Daily Selection
                </h4>
                <div className="divide-y divide-amber-50 space-y-3">
                  {cart.map(ci => (
                    <div key={ci.id} className="flex justify-between items-center pt-3 gap-2 text-xs">
                      <div className="flex-grow">
                        <p className="font-extrabold text-amber-950 leading-snug">{ci.item.name}</p>
                        <p className="text-amber-700 font-bold text-2xs mt-0.5">${parseFloat(ci.item.price).toFixed(2)} each</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => updateQty(ci.id, -1)}
                          className="w-5.5 h-5.5 rounded-[5px] bg-amber-50 hover:bg-amber-100 text-amber-800 flex items-center justify-center transition-colors text-2xs"
                        >
                          <FiMinus />
                        </button>
                        <span className="font-black text-amber-950 w-4 text-center">{ci.qty}</span>
                        <button
                          onClick={() => updateQty(ci.id, 1)}
                          className="w-5.5 h-5.5 rounded-[5px] bg-amber-50 hover:bg-amber-100 text-amber-800 flex items-center justify-center transition-colors text-2xs"
                        >
                          <FiPlus />
                        </button>
                        <button
                          onClick={() => removeFromCart(ci.id, ci.item.name)}
                          className="text-amber-800/40 hover:text-rose-600 p-1 transition-colors"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-3xl">☕</span>
                <div>
                  <h4 className="font-extrabold text-amber-950 text-sm">Your cup is empty</h4>
                  <p className="text-amber-800/50 text-2xs font-semibold mt-1">Add items to place order!</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-amber-50 space-y-2 text-xs font-semibold text-amber-850/60">
              <div className="flex justify-between items-center text-sm font-black text-amber-950 pt-1">
                <span>Total Due</span>
                <span className="text-base text-amber-950 font-black">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => toast.success('Order placed! Coffee beans are brewing...')}
              className={`w-full py-3.5 rounded-[5px] font-black text-xs text-center transition-all cursor-pointer ${cart.length > 0
                  ? 'bg-amber-800 hover:bg-amber-900 text-white shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              Order &amp; Brew Coffee
            </button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E1711] text-amber-200/60 pt-16 pb-10 mt-16 border-t border-amber-950/20 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            <div className="col-span-1 md:col-span-6 space-y-5">
              <span className="font-serif font-black text-2xl text-white">{settings?.store_name || storeName}</span>
              <p className="text-xs leading-relaxed max-w-sm font-medium text-amber-200/50">
                Freshly roasted beans, delicious morning pastries, and curated cafe blends that will fuel your entire day.
              </p>
            </div>

            <div className="col-span-1 md:col-span-6 space-y-4 text-xs font-semibold">
              <h4 className="text-white font-black text-sm uppercase tracking-wider">Cafe Details</h4>
              <div className="space-y-2.5">
                <p className="flex items-center gap-2">
                  <FiMapPin className="text-amber-400 shrink-0" />
                  <span>{settings?.store_address || '45 Crema St, Cafe District'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <FiPhone className="text-amber-400 shrink-0" />
                  <span>{settings?.store_phone || '+855 12 345 678'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <FiMail className="text-amber-400 shrink-0" />
                  <span>{settings?.store_email || 'hello@cafeshop.com'}</span>
                </p>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-amber-900/10 flex flex-col sm:flex-row justify-between items-center text-3xs font-black tracking-widest text-amber-200/30 uppercase">
            <span>&copy; {new Date().getFullYear()} {settings?.store_name || storeName}. Handcrafted coffee.</span>
            <span>BiteFlow Cafe System</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

