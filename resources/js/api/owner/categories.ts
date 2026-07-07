import { client, API_BASE_URL } from '../client';
import type { Brand } from './brands';
import type { ProductBadge } from './productBadges';

export interface CategoriesResponse {
  total: number;
  limit: number;
  offset: number;
  categories: Category[];
}

export interface Category {
  id: number;
  name: string;
  description: string;
  status: number;
  is_menu: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | string | null;
  parent_id?: number | null;
  parent?: Category | null;
  children?: Category[];
  menu_items: MenuItem[];
  priority?: number;
  image?: string | null;
}

export interface ProductTranslation {
  id?: number;
  product_id?: number;
  locale: string;
  name: string;
  description: string | null;
  slug: string;
}

export interface ProductVariant {
  id?: number;
  product_id?: number;
  variant_sku: string;
  region_code: string;
  currency_code: string;
  purchase_price: string;
  retail_price: string;
  compare_at_price: string | null;
  stock_qty: number;
  low_stock_threshold: number | null;
  attribute_values?: any[];
  imageFile?: File;
  image_url?: string;
}

export interface ProductImage {
  id?: number;
  product_id?: number;
  product_variant_id: number | null;
  image_path?: string | string[];
  image?: string | string[];
  is_primary: boolean;
  sort_order: number;
}

export interface ProductAddon {
  id?: number;
  product_id?: number;
  addon_name: string;
  additional_price: string | number;
  discount?: string | number;
  discount_type?: 'flat' | 'percent';
  image?: string | null;
  imageFile?: File;
  is_default?: boolean;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  status: string;
  created_at: string;
  updated_at: string;
  display_image: string;
  likes_count: number;
  created_by: number | string | null;
  translations?: ProductTranslation[];
  variants?: ProductVariant[];
  images?: ProductImage[];
  sku?: string;
  barcode?: string | null;
  has_options?: boolean;

  product_type?: string;
  brand_id?: number | null;
  brand?: Brand | null;
  product_badge_id?: number | null;
  badge?: ProductBadge | null;
  unit?: string;
  search_tags?: string | null;
  min_order_qty?: number;
  discount_amount?: string | number;
  discount_type?: string;
  shipping_cost?: string | number;
  multiply_qty_shipping?: boolean;
  compare_at_price?: string | null;
  addons?: ProductAddon[];
  is_special?: boolean;
  category?: Category | null;
}

// Top Selling Types requested by user
export type Root = Root2[];

export interface Root2 {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  status: string;
  created_at: string;
  updated_at: string;
  order_items_count: number;
  display_image: string;
  likes_count: number;
  rating: number;
  created_by?: number | string | null;
  translations?: ProductTranslation[];
  variants?: ProductVariant[];
  images?: ProductImage[];
  sku?: string;
  barcode?: string | null;
  has_options?: boolean;
  shipping_cost?: string | number;
  multiply_qty_shipping?: boolean;
  brand_id?: number | null;
  brand?: Brand | null;
  product_badge_id?: number | null;
  badge?: ProductBadge | null;
  compare_at_price?: string | null;
  code?: string | null;
  addons?: ProductAddon[];
  is_special?: boolean;
  category?: Category | null;
}

// Shared raw API shape returned by backend CategoryResponse
interface FastApiCategoryResponse {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
  is_menu: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | string | null;
  parent_id?: number | null;
  parent?: FastApiCategoryResponse | null;
  children?: FastApiCategoryResponse[];
  priority?: number;
  image?: string | null;
}

/** Map raw FastAPI category response to our Category interface */
function mapCategory(cat: FastApiCategoryResponse): Category {
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description || '',
    status: cat.status ? 1 : 0,
    is_menu: !!cat.is_menu,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
    created_by: cat.created_by ?? null,
    parent_id: cat.parent_id ?? null,
    parent: cat.parent ? mapCategory(cat.parent) : null,
    children: cat.children ? cat.children.map(mapCategory) : [],
    menu_items: [],
    priority: cat.priority ?? 0,
    image: cat.image ?? null,
  };
}

export const categoriesService = {
  /**
   * Retrieve active categories and their eager-loaded menu items from the database.
   */
  async getCategories(limit = 100, offset = 0, createdBy?: number | string, storeId?: number): Promise<CategoriesResponse> {
    let url = `/categories?limit=${limit}&offset=${offset}`;
    if (createdBy !== undefined && createdBy !== null) {
      url += `&created_by=${createdBy}`;
    }
    if (storeId !== undefined && storeId !== null) {
      url += `&store_id=${storeId}`;
    }
    const res = await client.get<FastApiCategoryResponse[]>(url);
    const categories = res.map(mapCategory);
    return {
      total: categories.length,
      limit,
      offset,
      categories,
    };
  },

  /**
   * Retrieve only categories created by the currently authenticated admin user.
   */
  async getMyCategories(limit = 100, offset = 0, createdBy?: number | string, storeId?: number): Promise<CategoriesResponse> {
    // Attempt with specific filters if provided
    let url = `/categories/mine?limit=${limit}&skip=${offset}`;
    if (createdBy !== undefined && createdBy !== null) {
      url += `&created_by=${createdBy}`;
    }
    if (storeId !== undefined && storeId !== null) {
      url += `&store_id=${storeId}`;
    }
    
    const res = await client.get<FastApiCategoryResponse[]>(url);
    const categories = res.map(mapCategory);
    return {
      total: categories.length,
      limit,
      offset,
      categories,
    };
  },

  /**
   * Fetch top selling menu items based on order volume.
   * Pass createdBy to scope items to a specific admin user.
   */
  async getTopSelling(limit = 3, createdBy?: number | string): Promise<Root> {
    const params = createdBy !== undefined
      ? `/products/top-selling?limit=${limit}&created_by=${createdBy}`
      : `/products/top-selling?limit=${limit}`;
    const res = await client.get<ProductsResponse[]>(params);
    return res.map(item => {
      return {
        ...item,
        display_image: getImageUrl(item.image),
        likes_count: 0,
        rating: 4.5,
        order_items_count: 0,
        category_id: item.category_id || 0,
        description: item.description || '',
        translations: item.translations || [],
        variants: item.variants || [],
        images: item.images || [],
        sku: item.sku || '',
        barcode: item.barcode || null,
        addons: item.addons || [],
      };
    }) as unknown as Root;
  },

  async createCategory(data: {
    name: string;
    description?: string;
    status: number;
    is_menu?: boolean;
    created_by?: number | string;
    parent_id?: number | null;
    priority?: number;
    image?: string | null;
    imageFile?: File;
  }): Promise<Category> {
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('description', data.description || '');
    fd.append('status', data.status === 1 ? '1' : '0');
    fd.append('is_menu', data.is_menu ?? true ? '1' : '0');
    if (data.parent_id !== undefined && data.parent_id !== null) {
      fd.append('parent_id', String(data.parent_id));
    }
    fd.append('priority', String(data.priority ?? 0));
    if (data.imageFile) {
      fd.append('image', data.imageFile);
    } else if (data.image) {
      fd.append('image', data.image);
    }
    if (data.created_by !== undefined && data.created_by !== null) {
      fd.append('created_by', String(data.created_by));
    }

    const res = await client.postFormData<FastApiCategoryResponse>('/categories', fd);
    return mapCategory(res);
  },

  async updateCategory(id: number, data: {
    name: string;
    description?: string;
    status: number;
    is_menu?: boolean;
    parent_id?: number | null;
    priority?: number;
    image?: string | null;
    imageFile?: File;
  }): Promise<Category> {
    const fd = new FormData();
    fd.append('_method', 'PUT'); // Laravel spoofing for multipart/form-data PUT
    fd.append('name', data.name);
    fd.append('description', data.description || '');
    fd.append('status', data.status === 1 ? '1' : '0');
    fd.append('is_menu', data.is_menu ?? true ? '1' : '0');
    if (data.parent_id !== undefined && data.parent_id !== null) {
      fd.append('parent_id', String(data.parent_id));
    }
    fd.append('priority', String(data.priority ?? 0));
    if (data.imageFile) {
      fd.append('image', data.imageFile);
    } else if (data.image) {
      fd.append('image', data.image);
    }

    const res = await client.postFormData<FastApiCategoryResponse>(`/categories/${id}`, fd);
    return mapCategory(res);
  },

  async deleteCategory(id: number): Promise<void> {
    await client.delete(`/categories/${id}`);
  }
};

export interface ProductsResponse {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  status: string;
  category_id: number | null;
  created_at: string;
  updated_at: string;
  created_by: number | string | null;
  translations?: ProductTranslation[];
  variants?: ProductVariant[];
  images?: ProductImage[];
  sku?: string;
  barcode?: string | null;
  has_options?: boolean;

  product_type?: string;
  brand_id?: number | null;
  brand?: Brand | null;
  product_badge_id?: number | null;
  badge?: ProductBadge | null;
  unit?: string;
  search_tags?: string | null;
  min_order_qty?: number;
  discount_amount?: string | number;
  discount_type?: string;
  shipping_cost?: string | number;
  multiply_qty_shipping?: boolean;
  addons?: ProductAddon[];
  is_special?: boolean;
  category?: any;
}

/** Map image paths/JSON to absolute URL string based on server base */
export const getImageUrl = (image: any): string => {
  if (!image) return '';
  let resolvedImg = image;
  if (Array.isArray(resolvedImg)) {
    resolvedImg = resolvedImg[0];
  }
  if (typeof resolvedImg === 'string') {
    resolvedImg = resolvedImg.trim();
    if (resolvedImg.startsWith('[') || resolvedImg.startsWith('{')) {
      try {
        const parsed = JSON.parse(resolvedImg);
        if (Array.isArray(parsed)) {
          resolvedImg = parsed[0];
        } else if (parsed && typeof parsed === 'object') {
          resolvedImg = Object.values(parsed)[0];
        }
      } catch (e) { }
    }
  } else if (resolvedImg && typeof resolvedImg === 'object') {
    resolvedImg = Object.values(resolvedImg)[0] || '';
  }

  if (typeof resolvedImg !== 'string') return '';
  const cleanImg = resolvedImg.trim();
  if (!cleanImg) return '';

  if (cleanImg.startsWith('http://') || cleanImg.startsWith('https://') || cleanImg.startsWith('data:') || cleanImg.startsWith('blob:')) {
    return cleanImg;
  }
  const serverBase = API_BASE_URL.replace(/\/api$/, '');
  const cleanPath = cleanImg.replace(/^\//, '');
  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('static/')) {
    return `${serverBase}/${cleanPath}`;
  }
  return `${serverBase}/uploads/${cleanPath}`;
};

/** Map raw FastAPI menu item response to our MenuItem interface */
function mapProducts(item: ProductsResponse): MenuItem {
  // Fallback to first variant image if root image is empty
  let mappedImagePath = item.image || '';
  if (!mappedImagePath && item.images && item.images.length > 0) {
    const firstVarImg = item.images.find(img => img.product_variant_id !== null);
    if (firstVarImg) {
      const rawPath = firstVarImg.image;
      mappedImagePath = Array.isArray(rawPath) ? (rawPath[0] || '') : (rawPath || '');
    }
  }

  return {
    id: item.id,
    category_id: item.category_id || 0,
    name: item.name,
    description: item.description || '',
    price: item.price,
    display_image: getImageUrl(mappedImagePath) || '',
    image: item.image || '',
    status: (item.status === 'available' || item.status === 'active') ? 'active' : (item.status === 'archived' ? 'archived' : 'inactive'),
    likes_count: 0,
    created_by: item.created_by ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at,
    translations: item.translations || [],
    variants: item.variants || [],
    images: item.images || [],
    sku: item.sku || '',
    barcode: item.barcode || null,
    has_options: !!item.has_options,
    product_type: item.product_type || 'physical',
    brand_id: item.brand_id ?? null,
    brand: item.brand ?? null,
    product_badge_id: item.product_badge_id ?? null,
    badge: item.badge ?? null,
    unit: item.unit || 'pc',
    search_tags: item.search_tags ?? null,
    min_order_qty: item.min_order_qty ?? 1,
    discount_amount: item.discount_amount ?? 0,
    discount_type: item.discount_type || 'flat',
    shipping_cost: item.shipping_cost ?? 0,
    multiply_qty_shipping: !!item.multiply_qty_shipping,
    addons: item.addons || [],
    is_special: !!item.is_special,
    category: item.category,
  };
}

export const menuItemsService = {
  async getMenuItems(limit = 100, skip = 0, createdBy?: number | string, storeId?: number): Promise<MenuItem[]> {
    let url = `/products?limit=${limit}&skip=${skip}`;
    if (createdBy !== undefined && createdBy !== null) {
      url += `&created_by=${createdBy}`;
    }
    if (storeId !== undefined && storeId !== null) {
      url += `&store_id=${storeId}`;
    }
    const res = await client.get<ProductsResponse[]>(url);
    return res.map(mapProducts);
  },

  async getMenuItem(id: number): Promise<MenuItem> {
    const res = await client.get<ProductsResponse>(`/products/${id}`);
    return mapProducts(res);
  },

  async createMenuItem(data: {
    name?: string;
    description?: string;
    price?: string;
    image_url?: string;
    imageFile?: File;
    status: string;
    category_id?: number | null;
    created_by?: number | string;
    sku?: string;
    barcode?: string | null;
    has_options?: boolean;
    translations?: ProductTranslation[];
    variants?: ProductVariant[];
    product_type?: string;
    brand_id?: number | null;
    product_badge_id?: number | null;
    unit?: string;
    search_tags?: string | null;
    min_order_qty?: number;
    discount_amount?: string | number;
    discount_type?: string;
    shipping_cost?: string | number;
    multiply_qty_shipping?: boolean;
    addons?: ProductAddon[];
    is_special?: boolean;
  }): Promise<MenuItem> {
    const fd = new FormData();
    fd.append('status', data.status === 'active' ? 'active' : 'draft');
    if (data.category_id !== undefined && data.category_id !== null && !isNaN(Number(data.category_id))) {
      fd.append('category_id', String(data.category_id));
    }
    if (data.imageFile) {
      fd.append('image', data.imageFile);
    }
    if (data.image_url) {
      fd.append('image_url', data.image_url);
    }
    if (data.created_by !== undefined && data.created_by !== null) {
      fd.append('created_by', String(data.created_by));
    }
    if (data.has_options !== undefined) {
      fd.append('has_options', data.has_options ? '1' : '0');
    }
    if (data.product_type !== undefined) {
      fd.append('product_type', data.product_type);
    }
    if (data.brand_id !== undefined) {
      fd.append('brand_id', data.brand_id !== null ? String(data.brand_id) : '');
    }
    if (data.product_badge_id !== undefined) {
      fd.append('product_badge_id', data.product_badge_id !== null ? String(data.product_badge_id) : '');
    }
    if (data.unit !== undefined) {
      fd.append('unit', data.unit);
    }
    if (data.search_tags !== undefined && data.search_tags !== null) {
      fd.append('search_tags', data.search_tags);
    }
    if (data.min_order_qty !== undefined && data.min_order_qty !== null) {
      fd.append('min_order_qty', String(data.min_order_qty));
    }
    if (data.discount_amount !== undefined && data.discount_amount !== null) {
      fd.append('discount_amount', String(data.discount_amount));
    }
    if (data.discount_type !== undefined && data.discount_type !== null) {
      fd.append('discount_type', data.discount_type);
    }
    if (data.shipping_cost !== undefined && data.shipping_cost !== null) {
      fd.append('shipping_cost', String(data.shipping_cost));
    }
    if (data.multiply_qty_shipping !== undefined) {
      fd.append('multiply_qty_shipping', data.multiply_qty_shipping ? '1' : '0');
    }
    if (data.is_special !== undefined) {
      fd.append('is_special', data.is_special ? '1' : '0');
    }

    const hasStructured = data.translations && data.translations.length > 0 && data.variants && data.variants.length > 0;
    if (hasStructured) {
      fd.append('sku', data.sku || '');
      fd.append('barcode', data.barcode || '');

      data.translations!.forEach((trans, index) => {
        fd.append(`translations[${index}][locale]`, trans.locale);
        fd.append(`translations[${index}][name]`, trans.name);
        fd.append(`translations[${index}][description]`, trans.description || '');
        fd.append(`translations[${index}][slug]`, trans.slug);
      });

      data.variants!.forEach((varItem, index) => {
        fd.append(`variants[${index}][variant_sku]`, varItem.variant_sku);
        fd.append(`variants[${index}][region_code]`, varItem.region_code || 'GLO');
        fd.append(`variants[${index}][currency_code]`, varItem.currency_code || 'USD');
        fd.append(`variants[${index}][purchase_price]`, String(varItem.purchase_price));
        fd.append(`variants[${index}][retail_price]`, String(varItem.retail_price));
        if (varItem.compare_at_price !== undefined && varItem.compare_at_price !== null) {
          fd.append(`variants[${index}][compare_at_price]`, String(varItem.compare_at_price));
        }
        fd.append(`variants[${index}][stock_qty]`, String(varItem.stock_qty));
        if (varItem.low_stock_threshold !== undefined && varItem.low_stock_threshold !== null) {
          fd.append(`variants[${index}][low_stock_threshold]`, String(varItem.low_stock_threshold));
        }
        if (varItem.attribute_values && varItem.attribute_values.length > 0) {
          varItem.attribute_values.forEach((valId: any, valIdx: number) => {
            fd.append(`variants[${index}][attribute_values][${valIdx}]`, String(valId));
          });
        }
        if (varItem.imageFile) {
          fd.append(`variants[${index}][image]`, varItem.imageFile);
        }
        if (varItem.image_url !== undefined && varItem.image_url !== null) {
          fd.append(`variants[${index}][image_url]`, varItem.image_url);
        }
      });
    } else {
      fd.append('name', data.name || '');
      fd.append('description', data.description || '');
      fd.append('price', data.price || '0.00');
    }

    if (data.addons && data.addons.length > 0) {
      data.addons.forEach((addon, index) => {
        if (addon.id !== undefined && addon.id !== null) {
          fd.append(`addons[${index}][id]`, String(addon.id));
        }
        fd.append(`addons[${index}][addon_name]`, addon.addon_name);
        fd.append(`addons[${index}][additional_price]`, String(addon.additional_price));
        fd.append(`addons[${index}][discount]`, String(addon.discount || '0.00'));
        fd.append(`addons[${index}][discount_type]`, addon.discount_type || 'flat');
        if (addon.imageFile) {
          fd.append(`addons[${index}][image]`, addon.imageFile);
        } else if (addon.image) {
          fd.append(`addons[${index}][image]`, addon.image);
        }
        fd.append(`addons[${index}][is_default]`, addon.is_default ? '1' : '0');
      });
    }

    console.log('[API CREATE] Payload:');
    fd.forEach((value, key) => {
      if (!(value instanceof File)) {
        console.log(`  ${key}:`, value);
      } else {
        console.log(`  ${key}: [File] ${value.name}`);
      }
    });

    const res = await client.postFormData<ProductsResponse>('/products', fd);
    return mapProducts(res);
  },

  async updateMenuItem(id: number, data: {
    name?: string;
    description?: string;
    price?: string;
    image_url?: string;
    imageFile?: File;
    status: string;
    category_id?: number | null;
    created_by?: number | string;
    sku?: string;
    barcode?: string | null;
    has_options?: boolean;
    translations?: ProductTranslation[];
    variants?: ProductVariant[];
    product_type?: string;
    brand_id?: number | null;
    product_badge_id?: number | null;
    unit?: string;
    search_tags?: string | null;
    min_order_qty?: number;
    discount_amount?: string | number;
    discount_type?: string;
    shipping_cost?: string | number;
    multiply_qty_shipping?: boolean;
    addons?: ProductAddon[];
    is_special?: boolean;
  }): Promise<MenuItem> {
    const fd = new FormData();
    fd.append('status', data.status === 'active' ? 'active' : 'draft');
    if (data.category_id !== undefined && data.category_id !== null && !isNaN(Number(data.category_id))) {
      fd.append('category_id', String(data.category_id));
    }
    if (data.imageFile) {
      fd.append('image', data.imageFile);
    }
    if (data.image_url) {
      fd.append('image_url', data.image_url);
    }
    if (data.created_by !== undefined && data.created_by !== null) {
      fd.append('created_by', String(data.created_by));
    }
    if (data.has_options !== undefined) {
      fd.append('has_options', data.has_options ? '1' : '0');
    }
    if (data.product_type !== undefined) {
      fd.append('product_type', data.product_type);
    }
    if (data.brand_id !== undefined) {
      fd.append('brand_id', data.brand_id !== null ? String(data.brand_id) : '');
    }
    if (data.product_badge_id !== undefined) {
      fd.append('product_badge_id', data.product_badge_id !== null ? String(data.product_badge_id) : '');
    }
    if (data.unit !== undefined) {
      fd.append('unit', data.unit);
    }
    if (data.search_tags !== undefined && data.search_tags !== null) {
      fd.append('search_tags', data.search_tags);
    }
    if (data.min_order_qty !== undefined && data.min_order_qty !== null) {
      fd.append('min_order_qty', String(data.min_order_qty));
    }
    if (data.discount_amount !== undefined && data.discount_amount !== null) {
      fd.append('discount_amount', String(data.discount_amount));
    }
    if (data.discount_type !== undefined && data.discount_type !== null) {
      fd.append('discount_type', data.discount_type);
    }
    if (data.shipping_cost !== undefined && data.shipping_cost !== null) {
      fd.append('shipping_cost', String(data.shipping_cost));
    }
    if (data.multiply_qty_shipping !== undefined) {
      fd.append('multiply_qty_shipping', data.multiply_qty_shipping ? '1' : '0');
    }
    if (data.is_special !== undefined) {
      fd.append('is_special', data.is_special ? '1' : '0');
    }

    const hasStructured = data.translations && data.translations.length > 0 && data.variants && data.variants.length > 0;
    if (hasStructured) {
      fd.append('sku', data.sku || '');
      fd.append('barcode', data.barcode || '');

      data.translations!.forEach((trans, index) => {
        fd.append(`translations[${index}][locale]`, trans.locale);
        fd.append(`translations[${index}][name]`, trans.name);
        fd.append(`translations[${index}][description]`, trans.description || '');
        fd.append(`translations[${index}][slug]`, trans.slug);
      });

      data.variants!.forEach((varItem, index) => {
        if (varItem.id !== undefined && varItem.id !== null) {
          fd.append(`variants[${index}][id]`, String(varItem.id));
        }
        fd.append(`variants[${index}][variant_sku]`, varItem.variant_sku);
        fd.append(`variants[${index}][region_code]`, varItem.region_code || 'GLO');
        fd.append(`variants[${index}][currency_code]`, varItem.currency_code || 'USD');
        fd.append(`variants[${index}][purchase_price]`, String(varItem.purchase_price));
        fd.append(`variants[${index}][retail_price]`, String(varItem.retail_price));
        if (varItem.compare_at_price !== undefined && varItem.compare_at_price !== null) {
          fd.append(`variants[${index}][compare_at_price]`, String(varItem.compare_at_price));
        }
        fd.append(`variants[${index}][stock_qty]`, String(varItem.stock_qty));
        if (varItem.low_stock_threshold !== undefined && varItem.low_stock_threshold !== null) {
          fd.append(`variants[${index}][low_stock_threshold]`, String(varItem.low_stock_threshold));
        }
        if (varItem.attribute_values && varItem.attribute_values.length > 0) {
          varItem.attribute_values.forEach((valId: any, valIdx: number) => {
            fd.append(`variants[${index}][attribute_values][${valIdx}]`, String(valId));
          });
        }
        if (varItem.imageFile) {
          fd.append(`variants[${index}][image]`, varItem.imageFile);
        }
        if (varItem.image_url !== undefined && varItem.image_url !== null) {
          fd.append(`variants[${index}][image_url]`, varItem.image_url);
        }
      });
    } else {
      fd.append('name', data.name || '');
      fd.append('description', data.description || '');
      fd.append('price', data.price || '0.00');
    }

    if (data.addons) {
      if (data.addons.length > 0) {
        data.addons.forEach((addon, index) => {
          if (addon.id !== undefined && addon.id !== null) {
            fd.append(`addons[${index}][id]`, String(addon.id));
          }
          fd.append(`addons[${index}][addon_name]`, addon.addon_name);
          fd.append(`addons[${index}][additional_price]`, String(addon.additional_price));
          fd.append(`addons[${index}][discount]`, String(addon.discount || '0.00'));
          fd.append(`addons[${index}][discount_type]`, addon.discount_type || 'flat');
          if (addon.imageFile) {
            fd.append(`addons[${index}][image]`, addon.imageFile);
          } else if (addon.image) {
            fd.append(`addons[${index}][image]`, addon.image);
          }
          fd.append(`addons[${index}][is_default]`, addon.is_default ? '1' : '0');
        });
      } else {
        fd.append('clear_addons', '1');
      }
    }

    console.log('[API UPDATE] Payload:');
    fd.forEach((value, key) => {
      if (!(value instanceof File)) {
        console.log(`  ${key}:`, value);
      } else {
        console.log(`  ${key}: [File] ${value.name}`);
      }
    });

    const res = await client.putFormData<ProductsResponse>(`/products/${id}`, fd);
    return mapProducts(res);
  },

  async deleteMenuItem(id: number): Promise<void> {
    await client.delete(`/products/${id}`);
  },

  async addProductImage(productId: number, data: { imageFile?: File; imageUrl?: string; isPrimary?: boolean }): Promise<any> {
    const fd = new FormData();
    if (data.imageFile) {
      fd.append('image', data.imageFile);
    }
    if (data.imageUrl) {
      fd.append('image_url', data.imageUrl);
    }
    if (data.isPrimary !== undefined) {
      fd.append('is_primary', data.isPrimary ? '1' : '0');
    }
    return await client.postFormData<any>(`/products/${productId}/images`, fd);
  },

  async deleteProductImage(imageId: number): Promise<void> {
    await client.delete(`/products/images/${imageId}`);
  },

  async updateProductImage(imageId: number, data: { isPrimary?: boolean; sortOrder?: number }): Promise<any> {
    return await client.put<any>(`/products/images/${imageId}`, {
      is_primary: data.isPrimary,
      sort_order: data.sortOrder,
    });
  }
};

export interface ProductAttributeValue {
  id: number;
  product_attribute_id: number;
  value: string;
  created_by: number | string | null;
  created_at?: string;
  updated_at?: string;
  attribute?: {
    id: number;
    name: string;
  };
}

export interface ProductAttribute {
  id: number;
  name: string;
  created_by: number | string | null;
  created_at?: string;
  updated_at?: string;
  values?: ProductAttributeValue[];
}

export const attributesService = {
  async getAttributes(createdBy?: number | string): Promise<ProductAttribute[]> {
    const params = createdBy !== undefined ? `/attributes?created_by=${createdBy}` : '/attributes';
    return await client.get<ProductAttribute[]>(params);
  },

  async createAttribute(name: string): Promise<ProductAttribute> {
    return await client.post<ProductAttribute>('/attributes', { name });
  },

  async createAttributeValue(attributeId: number, value: string): Promise<ProductAttributeValue> {
    return await client.post<ProductAttributeValue>(`/attributes/${attributeId}/values`, { value });
  },

  async deleteAttributeValue(valueId: number): Promise<void> {
    await client.delete(`/attributes/values/${valueId}`);
  },

  async deleteAttribute(id: number): Promise<void> {
    await client.delete(`/attributes/${id}`);
  }
};

