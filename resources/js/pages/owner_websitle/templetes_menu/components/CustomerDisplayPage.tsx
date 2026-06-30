import React, { useState, useEffect, useMemo } from 'react';
import { FiLoader, FiCheck, FiShoppingBag } from 'react-icons/fi';
import { resolveImageUrl } from '@/api/imageUtils';

export const CustomerDisplayPage: React.FC = () => {
    const [cart, setCart] = useState<any[]>([]);
    const [checkoutState, setCheckoutState] = useState<any>(null);
    const [paymentQr, setPaymentQr] = useState<any>(null);
    const [storeSettings, setStoreSettings] = useState<any>(null);
    const [zoomScale, setZoomScale] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('walkin_zoom_scale');
            return saved ? parseFloat(saved) : 1.0;
        } catch {
            return 1.0;
        }
    });

    // Load initial values from localStorage
    useEffect(() => {
        const loadLocalState = () => {
            try {
                const localCart = localStorage.getItem('aura_cart');
                if (localCart) setCart(JSON.parse(localCart));

                const localState = localStorage.getItem('walkin_checkout_state');
                if (localState) setCheckoutState(JSON.parse(localState));

                const localQr = localStorage.getItem('walkin_payment_qr');
                if (localQr) setPaymentQr(JSON.parse(localQr));

                const localSettings = localStorage.getItem('store_settings');
                if (localSettings) setStoreSettings(JSON.parse(localSettings));
            } catch (e) {
                console.error('Failed to load local storage state for customer display', e);
            }
        };

        loadLocalState();

        // Listen for storage events from the cashier window
        const handleStorageChange = (e: StorageEvent) => {
            try {
                if (e.key === 'aura_cart') {
                    setCart(e.newValue ? JSON.parse(e.newValue) : []);
                }
                if (e.key === 'walkin_checkout_state') {
                    setCheckoutState(e.newValue ? JSON.parse(e.newValue) : null);
                }
                if (e.key === 'walkin_payment_qr') {
                    setPaymentQr(e.newValue ? JSON.parse(e.newValue) : null);
                }
                if (e.key === 'store_settings') {
                    setStoreSettings(e.newValue ? JSON.parse(e.newValue) : null);
                }
            } catch (err) {
                console.error('Error handling storage update', err);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Slide presentation image indices
    const [activeSlide, setActiveSlide] = useState(0);
    const slides = useMemo(() => [
        {
            url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
            title: 'Fresh & Healthy Ingredients',
            desc: 'We use only organic, farm-fresh ingredients in every meal.'
        },
        {
            url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
            title: 'Made to Order',
            desc: 'Cooked fresh by our expert chefs the moment you order.'
        },
        {
            url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800',
            title: 'Delicious Local Walk-in Specials',
            desc: 'Ask our cashier about our daily chef specials and discounts!'
        }
    ], []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides]);

    const activeStoreName = storeSettings?.store_name || 'BiteFlow Store';
    const logoUrl = storeSettings?.logo_url ? resolveImageUrl(storeSettings.logo_url) : null;

    // Computed totals
    const subtotal = checkoutState?.subtotal || cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.qty || 1), 0);
    const deliveryFee = checkoutState?.deliveryFee || 0;
    const discount = checkoutState?.totalDiscount || 0;
    const totalAmount = checkoutState?.totalAmount || Math.max(0, subtotal + deliveryFee - discount);
    const activeStep = checkoutState?.activeStep || 'browsing';

    if (activeStep === 'completed') {
        return (
            <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
                <div className="bg-white p-12 sm:p-16 rounded-[12px] border border-slate-200/50 shadow-2xl max-w-lg w-full text-center space-y-8 animate-scale-in">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-lg shadow-emerald-500/20 animate-bounce">
                        <FiCheck className="w-12 h-12 stroke-[3]" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-2xl sm:text-3.5xl font-black text-slate-900 uppercase tracking-widest leading-none">Order Placed!</h1>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                            Thank you for your visit. Your order has been registered at the register and is being prepared. Enjoy your meal!
                        </p>
                    </div>

                    {checkoutState?.pendingOrderNo && (
                        <div className="bg-slate-50 py-3.5 px-6 rounded-md border border-slate-100 max-w-xs mx-auto">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Order Ticket</span>
                            <span className="text-lg font-black text-slate-800 tracking-wider mt-1 block">#{checkoutState.pendingOrderNo}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC] relative">
            <div
                style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                    width: `${100 / zoomScale}%`,
                    height: `${100 / zoomScale}%`,
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
                className="font-sans grid grid-cols-12 overflow-hidden select-none bg-[#F8FAFC]"
            >
                {/* Left Column: Brand Identity & Marketing Carousel */}
                <div className="col-span-7 relative bg-slate-950 flex flex-col justify-between p-8 text-white h-screen">
                    {/* Background Slider */}
                    <div className="absolute inset-0 z-0 opacity-45 transition-all duration-1000 overflow-hidden">
                        <img
                            src={slides[activeSlide].url}
                            alt="Promo Slide"
                            className="w-full h-full object-cover transition-transform duration-[5000ms] scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent z-1" />

                    {/* Top Brand Header */}
                    <div className="relative z-10 flex items-center space-x-3.5">
                        {logoUrl ? (
                            <img src={logoUrl} alt={activeStoreName} className="h-10 object-contain bg-white rounded-md p-1" />
                        ) : (
                            <div className="w-10 h-10 rounded-md bg-white text-slate-900 flex items-center justify-center font-black text-lg">
                                {activeStoreName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-black tracking-tight leading-none uppercase">{activeStoreName}</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Walk-in Customer Display</p>
                        </div>
                    </div>

                    {/* Main Welcome Message */}
                    <div className="relative z-10 my-auto py-12 max-w-md space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-[#E61E25]">Special Offerings</p>
                        <h2 className="text-3xl sm:text-4.5xl font-black tracking-tight leading-tight uppercase transition-all duration-500">
                            {slides[activeSlide].title}
                        </h2>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium transition-all duration-500">
                            {slides[activeSlide].desc}
                        </p>
                    </div>

                    {/* Bottom Footer Info */}
                    <div className="relative z-10 border-t border-white/10 pt-4 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>© {new Date().getFullYear()} {activeStoreName}</span>
                        <span>Self-Service Checkout Synced</span>
                    </div>
                </div>

                {/* Right Column: Real-time Order Summary & QR Checkout */}
                <div className="col-span-5 bg-white border-l border-slate-100 flex flex-col justify-between h-screen">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <FiShoppingBag className="w-4 h-4" />
                            <span>Walk-in Order Cart</span>
                        </h3>
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-black uppercase rounded-full">
                            {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
                        </span>
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                <span className="text-4xl animate-bounce">🍔</span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Cart is Empty</h4>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[200px] mt-1.5 mx-auto">
                                        Your order will show up here in real-time as the cashier adds items to your bag.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Order Item List */}
                                <div className="divide-y divide-slate-50 max-h-[35vh] overflow-y-auto pr-1">
                                    {cart.map((item, idx) => (
                                        <div key={item.id + idx} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                                            <div className="w-14 h-16 bg-slate-50 border border-slate-100 rounded-md overflow-hidden shrink-0">
                                                <img
                                                    src={item.selectedImage || item.image || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=400'}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between text-xs">
                                                <div className="space-y-0.5">
                                                    <h4 className="font-bold text-slate-900 text-sm truncate max-w-[180px]">{item.name}</h4>
                                                    {item.variant && <p className="text-[9px] uppercase font-bold text-slate-400">{item.variant}</p>}
                                                    <p className="text-[10px] text-slate-500 font-medium">Quantity x {item.qty}</p>
                                                </div>
                                                <span className="text-xs font-black text-slate-800">
                                                    US ${(parseFloat(item.price || '0') * item.qty).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Financial breakdown */}
                                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs font-bold text-slate-500">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="text-slate-800">US ${subtotal.toFixed(2)}</span>
                                    </div>
                                    {deliveryFee > 0 && (
                                        <div className="flex justify-between">
                                            <span>Delivery fee</span>
                                            <span className="text-slate-800">US ${deliveryFee.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-rose-500">
                                            <span>Discount</span>
                                            <span>- US ${discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black text-slate-900 uppercase">
                                        <span>Total to Pay</span>
                                        <span className="text-lg text-[#E61E25]">US ${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Payment Gateway QR Box */}
                    <div className="bg-slate-50 p-6 border-t border-slate-100 shrink-0 flex flex-col items-center">
                        {cart.length > 0 && activeStep === 'checkout' && (paymentQr?.qrString || paymentQr?.qrImage) ? (
                            <div className="w-full flex flex-col items-center space-y-4 text-center">
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-md w-48 h-48 flex items-center justify-center relative select-none">
                                    <img
                                        src={paymentQr.qrImage || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentQr.qrString || '')}`}
                                        alt="Payment KHQR"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[9px] font-black uppercase tracking-wider select-none">
                                        KHQR PAY
                                    </span>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mt-2">
                                        Scan with your banking app
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px] mx-auto">
                                        Scan to complete sandbox payment in real-time. Cashier verifies the transaction status automatically.
                                    </p>
                                </div>
                            </div>
                        ) : cart.length > 0 && activeStep === 'checkout' && checkoutState?.selectedPayment ? (
                            <div className="w-full flex flex-col items-center py-4 text-center space-y-3">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl shadow-xs">
                                    💵
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                                        {checkoutState.selectedPayment === 'cod' ? 'Cash Payment selected' : 'Manual Bank Transfer'}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px] mx-auto">
                                        Please proceed to make the payment directly to our cashier at the cash register counter.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 text-center select-none font-bold text-slate-400 text-3xs uppercase tracking-wider leading-relaxed">
                                <span>Ready for payment scanning...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Discreet floating zoom controls in bottom-left */}
            <div className="fixed bottom-4 left-4 z-[999] group flex items-center bg-white/85 backdrop-blur-xs border border-slate-200 rounded-lg p-1.5 shadow-md opacity-20 hover:opacity-100 transition-opacity duration-300 select-none">
                <button
                    onClick={() => {
                        const newScale = Math.max(0.5, zoomScale - 0.05);
                        setZoomScale(newScale);
                        localStorage.setItem('walkin_zoom_scale', newScale.toFixed(2));
                    }}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 border-none font-bold text-slate-700 cursor-pointer flex items-center justify-center text-xs"
                >
                    -
                </button>
                <span className="px-2 text-[10px] font-black text-slate-605 font-mono min-w-[36px] text-center">
                    {Math.round(zoomScale * 100)}%
                </span>
                <button
                    onClick={() => {
                        const newScale = Math.min(2.0, zoomScale + 0.05);
                        setZoomScale(newScale);
                        localStorage.setItem('walkin_zoom_scale', newScale.toFixed(2));
                    }}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 border-none font-bold text-slate-700 cursor-pointer flex items-center justify-center text-xs"
                >
                    +
                </button>
                <button
                    onClick={() => {
                        setZoomScale(1.0);
                        localStorage.setItem('walkin_zoom_scale', '1.00');
                    }}
                    className="ml-1.5 px-1.5 py-1 rounded hover:bg-slate-100 text-[8px] font-black uppercase text-slate-400 border border-slate-200/60 cursor-pointer"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};
