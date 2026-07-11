export interface ThemeMarketplaceInfo {
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
}

export const paidThemes: Record<string, ThemeMarketplaceInfo> = {
  cafe_shop: {
    author: 'RoastMaster Cafe',
    category: 'Cafe, Bakery & Espresso Outlets',
    price: '$49',
    originalPrice: '$79',
    rating: 5,
    reviews: '4.1K',
    sales: '62,400 Sales',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80',
    badge: 'Top Rated',
    badgeBg: 'bg-amber-700 text-white',
  },
  electronic: {
    author: 'ElectroGear Co',
    category: 'Gadgets, Tech & Smart Equipment',
    price: '$59',
    originalPrice: '$89',
    rating: 5,
    reviews: '2.9K',
    sales: '38,900 Sales',
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=500&q=80',
    badge: 'Featured Tech',
    badgeBg: 'bg-blue-600 text-white',
  },
  fashion: {
    author: 'CoutureStyles Boutique',
    category: 'Fashion, Apparel & Luxury Styling',
    price: '$55',
    originalPrice: '$99',
    rating: 5,
    reviews: '3.5K',
    sales: '51,300 Sales',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80',
    badge: 'Unlimited Updates',
    badgeBg: 'bg-stone-900 text-white',
  },
  fashion_website_general: {
    author: 'CoutureStyles Boutique',
    category: 'Fashion, Apparel & Zine Aesthetic',
    price: '$65',
    originalPrice: '$89',
    rating: 5,
    reviews: '2.2K',
    sales: '14,200 Sales',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80',
    badge: 'Retro Collage',
    badgeBg: 'bg-[#003CFF] text-white',
  },
  minimal_dark_gold: {
    author: 'AuraSteak & Grill',
    category: 'Luxury Steakhouse, Maroon Bar & Grill',
    price: '$65',
    originalPrice: '$119',
    rating: 5,
    reviews: '1.9K',
    sales: '18,500 Sales',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
    badge: 'Luxury Select',
    badgeBg: 'bg-yellow-600 text-white',
  }
};
