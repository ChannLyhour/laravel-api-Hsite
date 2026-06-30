// @premium - These are paid smartphone & tablet app templates
// Owners must purchase before activating
// Each template is responsive across Mobile Phone and Tablet devices

export interface SmartPhoneThemeInfo {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  price: string;
  originalPrice: string;
  rating: number;
  reviews: string;
  sales: string;
  image: string;
  badge?: string;
  badgeBg?: string;
  isPremium: true;
  templateType: 'responsive'; // Supports both phone & tablet
  supportedDevices: ('phone' | 'tablet')[];
  features: string[];
  previewGradient: string;
}

export const paidSmartPhoneThemes: Record<string, SmartPhoneThemeInfo> = {
  smartphone_emarket: {
    id: 'smartphone_emarket',
    name: 'eMarket – Premium Mobile Store',
    description: 'A stunning full-featured mobile e-commerce experience with home, wishlist, cart, detail screens, variant selectors, and smooth navigation tabs. Responsive across phone & tablet.',
    author: 'BiteFlow Mobile Studio',
    category: 'Mobile Commerce & Storefront Apps',
    price: '$79',
    originalPrice: '$129',
    rating: 5,
    reviews: '6.2K',
    sales: '89,400 Sales',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=500&q=80',
    badge: 'Best Seller',
    badgeBg: 'bg-violet-600 text-white',
    isPremium: true,
    templateType: 'responsive',
    supportedDevices: ['phone', 'tablet'],
    features: [
      'Responsive Phone & Tablet layouts',
      'Home Screen with categories & product grid',
      'Wishlist with variant options & attribute display',
      'Shopping Cart with checkout flow',
      'Product Detail with grouped attribute selectors',
      'Color swatches & size pills',
      'Dark/Light theme adaptive',
      'Multi-language support (EN/KM)',
      'Bottom tab navigation (Phone)',
      'Split-panel layout (Tablet)',
    ],
    previewGradient: 'from-violet-600 via-purple-600 to-indigo-700',
  },
  smartphone_foodie: {
    id: 'smartphone_foodie',
    name: 'Foodie – Gourmet Delivery App',
    description: 'A premium food delivery mobile app template with rich animations, flash sale banners, category browsing, and an immersive ordering experience. Adapts beautifully from phone to tablet.',
    author: 'CulinaryTech Labs',
    category: 'Food Delivery & Restaurant Apps',
    price: '$69',
    originalPrice: '$109',
    rating: 5,
    reviews: '4.8K',
    sales: '67,200 Sales',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80',
    badge: 'Top Rated',
    badgeBg: 'bg-orange-600 text-white',
    isPremium: true,
    templateType: 'responsive',
    supportedDevices: ['phone', 'tablet'],
    features: [
      'Responsive Phone & Tablet layouts',
      'Gourmet product showcase grid',
      'Flash sale promotional banner',
      'Category filter with emoji icons',
      'Product detail with image gallery',
      'Cart with delivery fee calculation',
      'Order success confirmation screen',
      'Search with real-time filtering',
      'Tablet side-by-side cart panel',
      'Responsive bottom navigation',
    ],
    previewGradient: 'from-orange-500 via-rose-500 to-pink-600',
  },
  smartphone_luxe: {
    id: 'smartphone_luxe',
    name: 'Luxe – Fashion Boutique App',
    description: 'An elegant, high-end mobile shopping experience for fashion and luxury brands, with editorial layouts, variant pickers, and wishlist management. Designed for phone and tablet.',
    author: 'StyleForge Design',
    category: 'Fashion, Apparel & Luxury Apps',
    price: '$89',
    originalPrice: '$149',
    rating: 5,
    reviews: '3.6K',
    sales: '45,800 Sales',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=500&q=80',
    badge: 'Editor\'s Choice',
    badgeBg: 'bg-stone-900 text-white',
    isPremium: true,
    templateType: 'responsive',
    supportedDevices: ['phone', 'tablet'],
    features: [
      'Responsive Phone & Tablet layouts',
      'Luxury editorial product cards',
      'Size & color variant selectors',
      'Wishlist with category filters',
      'Immersive product detail view',
      'Premium dark mode support',
      'Cart with automatic discounts',
      'Elegant typography & spacing',
      'Tablet widescreen gallery view',
      'Smooth page transitions',
    ],
    previewGradient: 'from-stone-800 via-stone-700 to-amber-700',
  },
};
