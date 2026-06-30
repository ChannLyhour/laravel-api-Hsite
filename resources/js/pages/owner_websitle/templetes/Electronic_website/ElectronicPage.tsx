import React, { useEffect, useState } from 'react';
import { categoriesService } from '@/api/owner/categories';
import type { Root2 } from '@/api/owner/categories';
import { ApiError } from '@/api/client';
import {
  FiCpu, FiHardDrive, FiShoppingBag,
  FiMapPin, FiPhone, FiMail,
  FiMinus, FiPlus, FiTrash2, FiZap, FiGrid
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { Store_setting } from '@/api/owner/stores';
import { storeBrandingService } from '@/api/created_by/getFaviconById';
import '@/pages/owner_manage/style/font.css';
import type { SettingResponse } from '@/api/setting';

interface ElectronicPageProps {
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

export const ElectronicPage: React.FC<ElectronicPageProps> = ({
  ownerUserId,
  storeName = 'ElectroGear',
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
        .catch(err => console.warn('ElectronicPage: Failed to load favicon', err));
    }
  }, [ownerUserId]);

  useEffect(() => {
    const fetchTech = async () => {
      try {
        setLoading(true);
        setError(null);
        // Load top 8 electronic tech items
        const data = await categoriesService.getTopSelling(8, ownerUserId);
        setItems(data || []);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.details.message);
        } else {
          setError('Failed to fetch tech inventory.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTech();
  }, [ownerUserId]);

  const addToCart = (item: Root2) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.id === String(item.id));
      if (existing) {
        toast.success(`Incremented quantity for ${item.name}!`);
        return prev.map(ci => ci.id === String(item.id) ? { ...ci, qty: ci.qty + 1 } : ci);
      }
      toast.success(`Added ${item.name} to cart!`);
      return [...prev, { id: String(item.id), item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(ci => ci.id === id ? { ...ci, qty: Math.max(1, ci.qty + delta) } : ci));
  };

  const removeFromCart = (id: string, name: string) => {
    setCart(prev => prev.filter(ci => ci.id !== id));
    toast.error(`Removed ${name} from cart.`);
  };

  const subtotal = cart.reduce((sum, ci) => sum + (parseFloat(ci.item.price) * ci.qty), 0);

  const dynamicSettings = Store_setting();
  const shippingFee = settings?.shipping_fee ? parseFloat(settings.shipping_fee) : (dynamicSettings?.shipping_fee ? parseFloat(dynamicSettings.shipping_fee) : 0);
  const threshold = settings?.free_shipping_threshold ? parseFloat(settings.free_shipping_threshold) : (dynamicSettings?.free_shipping_threshold ? parseFloat(dynamicSettings.free_shipping_threshold) : 0);

  const deliveryFee = orderMethod === 'delivery' && subtotal > 0 ? ((threshold > 0 && subtotal > threshold) ? 0 : shippingFee) : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#CBD5E1] font-sans antialiased">

      {/* High-Tech Navbar */}
      <header className="sticky top-0 z-50 bg-[#0E1322]/90 backdrop-blur-md border-b border-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-[5px] text-white shadow-md shadow-blue-500/10">
              <FiCpu className="w-5.5 h-5.5 text-cyan-300" />
            </div>
            <span className="font-sans font-black text-xl tracking-tight text-white uppercase">
              {settings?.store_name || storeName}
            </span>
          </div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-950/60 border border-blue-800/40 rounded-[5px] text-2xs font-black text-cyan-400 uppercase tracking-widest">
            ⚡ Tech Hub
          </span>
        </div>
      </header>

      {/* Cyber Hero Banner */}
      <section className="relative py-20 lg:py-28 overflow-hidden border-b border-blue-950/40 bg-gradient-to-b from-blue-950/20 to-transparent">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* Left Detail copy */}
            <div className="lg:col-span-6 text-left space-y-6">
              <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-blue-950/60 border border-blue-800/40 rounded-[5px] text-xs font-black text-cyan-400 uppercase tracking-wider">
                <FiZap className="animate-pulse" />
                <span>Next-Gen Smart Gear</span>
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight uppercase tracking-tight">
                Supercharged <br />
                Smart Equipment
              </h1>

              <p className="text-slate-400 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-medium">
                Elevate your daily operations with smart gear, high-fidelity wireless headphones, and top-tier electronics designed for tech enthusiasts.
              </p>

              <div className="flex gap-4 pt-2">
                <a
                  href="#menu"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-[5px] transition-all shadow-lg shadow-blue-500/20 flex items-center space-x-2 text-base border border-transparent cursor-pointer"
                >
                  <span>Explore Smart Tech</span>
                  <FiShoppingBag className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Right mock frame */}
            <div className="lg:col-span-6 flex justify-center relative">
              <div className="absolute w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-blue-600/10 rounded-full blur-3xl -z-10" />
              <div className="relative w-full max-w-[460px] bg-[#111827]/70 p-3.5 rounded-[5px] shadow-2xl border border-blue-950/40 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80"
                  alt="Tech Showcase mockup"
                  className="rounded-[5px] w-full h-[300px] object-cover shadow-md"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Grid split */}
      <section id="menu" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Tech Grid Showcase */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-950/60 border border-blue-800/40 rounded-[5px] text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                <FiGrid />
                <span>Featured Tech Inventory</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Top Rated Smart Devices
              </h2>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin h-9 w-9 border-4 border-cyan-400 border-t-transparent rounded-full" />
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Retrieving spec sheets...</p>
              </div>
            )}

            {error && (
              <div className="text-rose-500 bg-rose-950/20 border border-rose-900/40 p-4 rounded-[5px] text-xs font-bold text-center">
                ⚠️ {error}
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="text-center py-16 space-y-2 bg-[#111827]/40 rounded-[5px] border border-blue-950/40">
                <span className="text-3xl">💻</span>
                <h4 className="font-extrabold text-white uppercase">Tech inventory is empty</h4>
              </div>
            )}

            {/* Electronic Grid */}
            {!loading && items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="bg-[#111827]/60 rounded-[5px] border border-blue-950/40 p-4 flex flex-col justify-between gap-4 hover:border-blue-800/60 hover:shadow-lg transition-all duration-300 relative group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow space-y-2">
                        <h4 className="font-black text-white text-sm sm:text-base leading-tight group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                          {item.name}
                        </h4>
                        <div className="text-xs font-black text-cyan-400">${parseFloat(item.price).toFixed(2)}</div>
                        <p className="text-slate-400 text-2xs leading-relaxed line-clamp-2 font-medium">
                          {item.description || 'Smart hardware designed with elite components for high productivity operations.'}
                        </p>
                      </div>

                      <div className="relative shrink-0 w-24 h-24 overflow-hidden rounded-[5px] border border-blue-950/40 bg-[#0E1322]">
                        <img
                          src={item.display_image || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=500&q=80'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          onClick={() => addToCart(item)}
                          className="absolute bottom-1.5 right-1.5 w-6.5 h-6.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[5px] flex items-center justify-center shadow-md font-black transition-all cursor-pointer text-xs border-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-black text-cyan-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded-[5px] w-max mt-1">
                      <FiHardDrive className="w-3.5 h-3.5" />
                      <span>Certified Spec</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart sidebar */}
          <div className="lg:col-span-1 bg-[#111827]/70 backdrop-blur-xs border border-blue-950/40 rounded-[5px] p-5 shadow-lg sticky top-24 space-y-6">
            <div className="flex p-1 bg-[#0E1322]/80 rounded-[5px] border border-blue-950/40">
              <button
                onClick={() => setOrderMethod('delivery')}
                className={`flex-1 py-2 text-center text-xs font-extrabold rounded-[5px] transition-all cursor-pointer border-none ${orderMethod === 'delivery'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Shipping
              </button>
              <button
                onClick={() => setOrderMethod('pickup')}
                className={`flex-1 py-2 text-center text-xs font-extrabold rounded-[5px] transition-all cursor-pointer border-none ${orderMethod === 'pickup'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                In-Store Pickup
              </button>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                <h4 className="text-2xs font-black text-cyan-400 uppercase tracking-wider border-b border-blue-950/30 pb-2">
                  My Tech Specs Selection
                </h4>
                <div className="divide-y divide-blue-950/30 space-y-3">
                  {cart.map(ci => (
                    <div key={ci.id} className="flex justify-between items-center pt-3 gap-2 text-xs">
                      <div className="flex-grow">
                        <p className="font-extrabold text-white leading-snug">{ci.item.name}</p>
                        <p className="text-cyan-400 font-bold text-2xs mt-0.5">${parseFloat(ci.item.price).toFixed(2)} each</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => updateQty(ci.id, -1)}
                          className="w-5.5 h-5.5 rounded-[5px] bg-[#0E1322] border border-blue-950/40 hover:bg-blue-950 text-cyan-400 flex items-center justify-center transition-colors text-2xs"
                        >
                          <FiMinus />
                        </button>
                        <span className="font-black text-white w-4 text-center">{ci.qty}</span>
                        <button
                          onClick={() => updateQty(ci.id, 1)}
                          className="w-5.5 h-5.5 rounded-[5px] bg-[#0E1322] border border-blue-950/40 hover:bg-blue-950 text-cyan-400 flex items-center justify-center transition-colors text-2xs"
                        >
                          <FiPlus />
                        </button>
                        <button
                          onClick={() => removeFromCart(ci.id, ci.item.name)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors border-none bg-transparent cursor-pointer"
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
                <span className="text-3xl">🤖</span>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Cart is empty</h4>
                  <p className="text-slate-500 text-2xs font-semibold mt-1">Select Next-Gen hardware items!</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-blue-950/40 space-y-2 text-xs font-semibold text-slate-400">
              <div className="flex justify-between items-center text-sm font-black text-white pt-1">
                <span>Total Budget</span>
                <span className="text-base text-cyan-400 font-black">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => toast.success('Order logged! Processing shipment details...')}
              className={`w-full py-3.5 rounded-[5px] font-black text-xs text-center border-none transition-all cursor-pointer ${cart.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10'
                  : 'bg-[#1F2937] text-slate-500 cursor-not-allowed'
                }`}
            >
              Checkout Specifications
            </button>
          </div>

        </div>
      </section>

      {/* Tech Footer */}
      <footer className="bg-[#06080F] text-slate-400 pt-16 pb-10 mt-16 border-t border-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            <div className="col-span-1 md:col-span-6 space-y-5">
              <span className="font-sans font-black text-2xl text-white uppercase tracking-tight">{settings?.store_name || storeName}</span>
              <p className="text-xs leading-relaxed max-w-sm font-medium text-slate-550">
                Premium certified merchant offering original tech assets, smart hardware upgrades, and secure global express shipping.
              </p>
            </div>

            <div className="col-span-1 md:col-span-6 space-y-4 text-xs font-semibold">
              <h4 className="text-white font-black text-sm uppercase tracking-wider">Authorized Hub</h4>
              <div className="space-y-2.5">
                <p className="flex items-center gap-2">
                  <FiMapPin className="text-cyan-400 shrink-0" />
                  <span>{settings?.store_address || 'Silicon Outlet Center, Phase 2'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <FiPhone className="text-cyan-400 shrink-0" />
                  <span>{settings?.store_phone || '+855 12 345 678'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <FiMail className="text-cyan-400 shrink-0" />
                  <span>{settings?.store_email || 'tech@electrogear.com'}</span>
                </p>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-blue-950/30 flex flex-col sm:flex-row justify-between items-center text-3xs font-black tracking-widest text-slate-650 uppercase">
            <span>&copy; {new Date().getFullYear()} {settings?.store_name || storeName}. All specs certified.</span>
            <span>BiteFlow Enterprise Tech</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

