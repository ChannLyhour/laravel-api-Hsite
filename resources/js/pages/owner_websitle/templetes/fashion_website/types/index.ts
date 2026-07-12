/**
 * Fashion Website Template — Shared TypeScript Types
 *
 * All interfaces used across the fashion_website template components.
 * Import from this file to avoid circular deps and keep types DRY.
 */

import type { Root2 } from '@/api/owner/categories';
import type { StoreRow } from '@/api/owner/stores';
import type { BannerRow } from '@/api/owner/banners';
import type { User } from '@/api/auth';

// ─── Domain Types ─────────────────────────────────────────────────────────────

/** Lightweight UI-layer fashion item used for product listings */
export interface FashionItem {
  id: number;
  category_id?: number;
  name: string;
  price: string;
  compare_at_price?: string | null;
  code?: string | null;
  discount?: string | null;
  display_image: string;
  description: string;
  colors?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
  order_items_count?: number;
  likes_count?: number;
  rating?: number;
}

/** A single item in the shopping cart */
export interface CartItem {
  id: string;
  dbId?: number;
  item: Root2;
  qty: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedImage?: string;
  variantId?: number | null;
}

/** A single image in the product detail gallery */
export interface GalleryItem {
  url: string;
  color?: string;
}

// ─── Component Prop Types ─────────────────────────────────────────────────────

export interface FashionPageProps {
  ownerUserId?: number | string;
  profile?: any;
  onNavigate?: (to: string) => void;
  storeName?: string;
  locale?: string;
  onChangeLanguage?: (locale: 'en' | 'km') => void;
  stores?: StoreRow;
  currentPath?: string;
  banners?: BannerRow[];
}

export interface NavbarPageProps {
  cartCount: number;
  favoritesCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  user?: User | null;
  storeName?: string;
  stores?: StoreRow;
  onNavigate?: (to: string) => void;
  ownerUserId?: number | string;
  categories?: any[];
  isLoading?: boolean;
  locale?: string;
  onChangeLanguage?: (locale: 'en' | 'km') => void;
  /** Called when the user submits the Login form */
  onLogin?: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  /** Called when the user submits the Register form */
  onRegister?: (data: {
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    gender?: 'male' | 'female' | 'other';
  }) => Promise<{ success: boolean; message: string }>;
  /** Called when the user clicks sign-out */
  onLogout?: () => void;
  /** Whether an auth request is in flight */
  isSubmitting?: boolean;
  /** True while the session token is being validated — hides auth buttons to prevent flash */
  isAuthLoading?: boolean;
}


export interface HeroPageProps {
  storeName?: string;
  stores?: StoreRow;
  onNavigate?: (to: string) => void;
  ownerUserId?: number | string;
  banners?: BannerRow[];
  isLoading?: boolean;
}

export interface FooterPageProps {
  storeName?: string;
  stores?: StoreRow;
  ownerUserId?: number | string;
  onNavigate?: (to: string) => void;
  categories?: any[];
}

export interface DetailPageProps {
  product: Root2;
  onClose?: () => void;
  addToCart: (item: Root2, qty: number, size: string, color: string, addonsPrice?: number) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string, name: string) => void;
  storeName?: string;
  stores?: StoreRow;
  isFullPage?: boolean;
  user?: any;
  onNavigate?: (to: string) => void;
  items?: Root2[];
  categories?: any[];
  // Coupon support
  appliedCoupon?: any;
  applyCoupon?: (code: string) => Promise<void>;
  removeCoupon?: () => void;
  coupons?: any[];
  isLoading?: boolean;
}

export interface ListProdoctProps {
  items: Root2[];
  categories: any[];
  onNavigate?: (to: string) => void;
  addToCart: (item: Root2, qty: number, size?: string, color?: string) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string, name: string) => void;
  storeName?: string;
  stores?: StoreRow;
  ownerUserId?: number | string;
  selectedCategoryHash?: string;
  onCategoryChange?: (hash: string) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  flashDeals?: any[];
  featuredDeals?: any[];
  clearanceSales?: any[];
}

// ─── Mega Menu Types ──────────────────────────────────────────────────────────

export interface MegaMenuColumn {
  title: string;
  items: string[];
  isRed?: boolean;
}

export interface MegaMenuConfig {
  [categoryKey: string]: MegaMenuColumn[];
}

// ─── Countdown Types ──────────────────────────────────────────────────────────

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
