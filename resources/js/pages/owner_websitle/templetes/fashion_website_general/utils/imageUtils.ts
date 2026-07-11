import { resolveImageUrl } from '@/api/imageUtils';

export { resolveImageUrl };

/**
 * Returns a high-quality Unsplash image placeholder based on category name.
 */
export const getCategoryImage = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('accessory') || n.includes('accessories')) {
    return 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cf4?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('electronic')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('phone') || n.includes('mobile') || n.includes('smartphone')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('watch')) {
    return 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('bag') || n.includes('handbag')) {
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('shoe') || n.includes('footwear') || n.includes('sneaker')) {
    return 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('hat') || n.includes('cap')) {
    return 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('jacket') || n.includes('outerwear') || n.includes('coat')) {
    return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80';
  }
  if (
    n.includes('fashion') ||
    n.includes('clothing') ||
    n.includes('apparel') ||
    n.includes('shirt') ||
    n.includes('top')
  ) {
    return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80';
};

/**
 * Returns the second image of a product to use as hover effect, or a variant image
 * if available, falling back to null if no secondary image exists.
 */
export const getHoverImage = (item: any): string | null => {
  if (!item) return null;
  let images = item.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = null;
    }
  }
  if (images && Array.isArray(images) && images.length > 0) {
    const primaryUrl = resolveImageUrl(item.display_image || item.image);
    const nonPrimary = images.find((img: any) => {
      if (!img) return false;
      const rawPath = typeof img === 'string' ? img : (img.image || img.image_path);
      const imgUrl = resolveImageUrl(rawPath);
      return imgUrl && imgUrl !== primaryUrl;
    });
    if (nonPrimary) {
      const rawPath = typeof nonPrimary === 'string' ? nonPrimary : (nonPrimary.image || nonPrimary.image_path);
      return resolveImageUrl(rawPath);
    }
    if (images.length > 1) {
      const rawPath = typeof images[1] === 'string' ? images[1] : (images[1].image || images[1].image_path);
      return resolveImageUrl(rawPath);
    }
  }
  
  let variants = item.variants;
  if (typeof variants === 'string') {
    try {
      variants = JSON.parse(variants);
    } catch (e) {
      variants = null;
    }
  }
  if (variants && Array.isArray(variants) && variants.length > 0) {
    const primaryUrl = resolveImageUrl(item.display_image || item.image);
    const variantImg = variants.find((v: any) => {
      if (!v) return false;
      const vUrl = resolveImageUrl(v.image_url);
      return vUrl && vUrl !== primaryUrl;
    });
    if (variantImg) {
      return resolveImageUrl(variantImg.image_url);
    }
  }
  return null;
};
