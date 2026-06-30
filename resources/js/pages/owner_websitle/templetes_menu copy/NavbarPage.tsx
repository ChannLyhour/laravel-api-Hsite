import React, { useState, useEffect } from 'react';
import type { UserResponse } from '@/api/auth';
import { themes } from '@/pages/owner_manage/templete_website/themes';
import { Store_setting } from '@/api/owner/stores';
import { useOwnerURL } from '@/app/OwnerURL';
import { getLightTheme } from './utils/themeHelper';
import { FiChevronDown, FiMenu, FiX, FiShoppingCart, FiHeart, FiBell, FiHome, FiBookOpen } from 'react-icons/fi';
import { resolveImageUrl } from '@/api/imageUtils';

interface NavbarPageProps {
    token: string | null;
    profile: UserResponse | null;
    onNavigateLogin: () => void;
    onLogout: () => void;
    onNavigate: (to: string) => void;
    currentPath: string;
    stores: any;
    onOwnerChange: (id: number) => void;
    storeName?: string;
    ownerUserId?: number | string;
    locale: 'en' | 'km';
    setLocale: (l: 'en' | 'km') => void;
    onCartClick?: () => void;
}

export const NavbarPage: React.FC<NavbarPageProps> = ({
    token: _token,
    profile,
    onNavigateLogin,
    onLogout,
    onNavigate,
    currentPath,
    stores,
    onOwnerChange: _onOwnerChange,
    storeName = '',
    ownerUserId,
    locale: _locale,
    setLocale: _setLocale,
    onCartClick,
}) => {
    // Local state to track dynamic settings for real-time updates
    const [dynamicStores, setDynamicStores] = useState<any>(() => stores || Store_setting());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [favoritesCount, setFavoritesCount] = useState(0);

    // Sync cart and wishlist counts from localStorage
    useEffect(() => {
        const updateCounts = () => {
            try {
                const cartData = localStorage.getItem('aura_cart');
                if (cartData) {
                    const parsed = JSON.parse(cartData);
                    setCartCount(Array.isArray(parsed) ? parsed.reduce((sum, item) => sum + (item.qty || item.quantity || 0), 0) : 0);
                } else {
                    setCartCount(0);
                }
            } catch {
                setCartCount(0);
            }

            try {
                const wishData = localStorage.getItem('aura_wishlist');
                if (wishData) {
                    const parsed = JSON.parse(wishData);
                    setFavoritesCount(Array.isArray(parsed) ? parsed.length : 0);
                } else {
                    setFavoritesCount(0);
                }
            } catch {
                setFavoritesCount(0);
            }
        };

        updateCounts();

        // Listen for storage changes and custom events
        window.addEventListener('storage', updateCounts);
        window.addEventListener('aura_cart_updated', updateCounts);
        window.addEventListener('aura_wishlist_updated', updateCounts);

        const interval = setInterval(updateCounts, 1000);

        return () => {
            window.removeEventListener('storage', updateCounts);
            window.removeEventListener('aura_cart_updated', updateCounts);
            window.removeEventListener('aura_wishlist_updated', updateCounts);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleUpdate = () => {
            const updated = Store_setting();
            if (updated) setDynamicStores(updated);
        };
        window.addEventListener('settings_updated', handleUpdate);
        return () => window.removeEventListener('settings_updated', handleUpdate);
    }, []);

    // Sync if props change
    useEffect(() => {
        let active = true;
        if (stores && active) setDynamicStores(stores);
        return () => { active = false; };
    }, [stores]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsProfileDropdownOpen(false);

            if (currentScrollY > 100) {
                if (currentScrollY > lastScrollY) {
                    setIsVisible(false); // Scrolling down - hide navbar
                } else {
                    setIsVisible(true); // Scrolling up - reveal navbar
                }
            } else {
                setIsVisible(true); // Near the top - always show
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        const handleClickOutside = () => {
            setIsProfileDropdownOpen(false);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const settings = dynamicStores || stores;
    const activeTheme = getLightTheme(themes[settings?.website_theme || 'default'] || themes.default);

    const { buildLink: buildStoreLink } = useOwnerURL(
        ownerUserId || settings?.created_by || settings?.owner_id || settings?.hashid,
        storeName || settings?.store_name
    );

    const isActive = (path: string) => {
        if (path === '/') {
            return currentPath === '/' || currentPath === '/home';
        }
        if (path === '/menu') {
            return currentPath === '/menu';
        }
        return false;
    };

    const getLinkClass = (path: string) => {
        const active = isActive(path);
        return `relative text-2xs font-extrabold tracking-widest uppercase py-8 cursor-pointer transition-colors duration-300 ${active ? activeTheme.primaryText : 'text-stone-850 hover:text-[#E61E25]'
            }`;
    };

    const activeStoreName = settings?.store_name || storeName || 'BiteFlow Store';
    const user = profile?.user;

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 border-b border-stone-200/60 shadow-2xs font-sans ${activeTheme.navbarBg
                } ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative">

                {/* Left: Brand Logo & Name */}
                <div className="flex items-center space-x-3 shrink-0">
                    <a
                        href={buildStoreLink('/')}
                        onClick={(e) => { e.preventDefault(); onNavigate(buildStoreLink('/')); }}
                        className="flex items-center space-x-3 cursor-pointer select-none"
                    >
                        {settings?.logo_url ? (
                            <img
                                src={resolveImageUrl(settings.logo_url)}
                                alt={activeStoreName}
                                className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105"
                            />
                        ) : (
                            <span className="font-sans font-black text-xl tracking-[0.2em] uppercase text-stone-950">
                                {activeStoreName}
                            </span>
                        )}
                    </a>
                </div>

                {/* Center: Navigation Links */}
                <nav className="hidden md:flex space-x-8 items-center h-full">
                    <a
                        href={buildStoreLink('/')}
                        onClick={(e) => { e.preventDefault(); onNavigate(buildStoreLink('/')); }}
                        className={getLinkClass('/')}
                    >
                        <span className="flex items-center gap-1.5">
                            <FiHome className="w-3.5 h-3.5" />
                            <span>Home</span>
                        </span>
                        <span className={`absolute bottom-0 left-0 w-full h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${activeTheme.primaryBg} ${isActive('/') ? 'scale-x-100' : ''}`} />
                    </a>
                    <a
                        href={buildStoreLink('/menu')}
                        onClick={(e) => { e.preventDefault(); onNavigate(buildStoreLink('/menu')); }}
                        className={getLinkClass('/menu')}
                    >
                        <span className="flex items-center gap-1.5">
                            <FiBookOpen className="w-3.5 h-3.5" />
                            <span>Menu</span>
                        </span>
                        <span className={`absolute bottom-0 left-0 w-full h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${activeTheme.primaryBg} ${isActive('/menu') ? 'scale-x-100' : ''}`} />
                    </a>
                </nav>

                {/* Right: Auth Action Buttons / User Dropdown */}
                <div className="flex items-center space-x-4">
                    {/* Bell Icon */}
                    <button className="relative p-2 text-stone-850 hover:text-[#E61E25] bg-transparent border-none cursor-pointer transition-all duration-300 hover:scale-105 flex items-center justify-center focus:outline-none" title="Notifications">
                        <FiBell className="w-5 h-5 text-stone-800" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#E61E25] rounded-full animate-pulse" />
                    </button>

                    {/* Favorites/Like Icon */}
                    <button
                        onClick={() => {
                            onNavigate(buildStoreLink('/wishlist'));
                        }}
                        className="relative p-2 text-stone-850 hover:text-[#E61E25] bg-transparent border-none cursor-pointer transition-all duration-300 hover:scale-105 flex items-center justify-center focus:outline-none"
                        title="Wishlist"
                    >
                        <FiHeart className={`w-5 h-5 text-stone-800 ${favoritesCount > 0 ? 'text-[#E61E25] fill-[#E61E25]' : ''}`} />
                        {favoritesCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#E61E25] text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs">
                                {favoritesCount}
                            </span>
                        )}
                    </button>

                    {/* Shopping Bag Icon */}
                    <button
                        onClick={() => {
                            if (onCartClick) {
                                onCartClick();
                            } else {
                                onNavigate(buildStoreLink('/checkout'));
                            }
                        }}
                        className="relative p-2 text-stone-850 hover:text-[#E61E25] bg-transparent border-none cursor-pointer transition-all duration-300 hover:scale-105 flex items-center justify-center focus:outline-none"
                        title="Cart"
                    >
                        <FiShoppingCart className="w-5 h-5 text-stone-800" />
                        {cartCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#E61E25] text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs animate-cart-pop">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {/* Vertical Divider */}
                    <span className="h-5 w-px bg-stone-200 hidden sm:block" />

                    <div className="hidden sm:flex items-center space-x-3 text-3xs font-black tracking-widest text-stone-600 uppercase">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsProfileDropdownOpen(prev => !prev);
                                    }}
                                    className="flex items-center gap-2 hover:text-stone-900 bg-transparent border-none cursor-pointer transition-colors font-bold focus:outline-none"
                                >
                                    {user.image_url ? (
                                        <img src={user.image_url} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-stone-200" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[8px] font-black">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                                    <FiChevronDown className={`w-3 h-3 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={onNavigateLogin}
                                    className="hover:text-stone-900 bg-transparent border-none cursor-pointer transition-colors font-bold focus:outline-none"
                                >
                                    Login
                                </button>
                                <span className="text-stone-300 font-normal">|</span>
                                <button
                                    onClick={onNavigateLogin}
                                    className="hover:text-stone-900 bg-transparent border-none cursor-pointer transition-colors font-bold focus:outline-none"
                                >
                                    Register
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-stone-800 hover:text-stone-600 bg-transparent border-none cursor-pointer focus:outline-none flex items-center justify-center"
                    >
                        {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-stone-200/60 py-4 px-6 space-y-4 animate-fade-in">
                    <a
                        href={buildStoreLink('/')}
                        onClick={(e) => { e.preventDefault(); onNavigate(buildStoreLink('/')); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${isActive('/') ? activeTheme.primaryText : 'text-stone-700'}`}
                    >
                        <FiHome className="w-3.5 h-3.5" />
                        Home
                    </a>
                    <a
                        href={buildStoreLink('/menu')}
                        onClick={(e) => { e.preventDefault(); onNavigate(buildStoreLink('/menu')); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${isActive('/menu') ? activeTheme.primaryText : 'text-stone-700'}`}
                    >
                        <FiBookOpen className="w-3.5 h-3.5" />
                        Menu
                    </a>
                    <div className="pt-4 border-t border-stone-100 flex flex-col space-y-3">
                        {user ? (
                            <>
                                <span className="text-xs font-bold text-stone-500">Hello, {user.name}</span>
                                {(user.role === 'owner' || user.role === 'admin' || user.role === 'staff') && (
                                    <button
                                        onClick={() => {
                                            onNavigate('/owner');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="text-left text-xs font-black uppercase tracking-widest text-stone-700 bg-transparent border-none cursor-pointer"
                                    >
                                        Dashboard
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        onLogout();
                                        onNavigate(buildStoreLink('/'));
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="text-left text-xs font-black uppercase tracking-widest text-red-500 bg-transparent border-none cursor-pointer"
                                >
                                    Sign out
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => { onNavigateLogin(); setIsMobileMenuOpen(false); }}
                                className="text-left text-xs font-black uppercase tracking-widest text-stone-700 bg-transparent border-none cursor-pointer"
                            >
                                Login / Register
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};
