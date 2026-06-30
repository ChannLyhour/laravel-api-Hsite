import { client, API_BASE_URL } from '../client';
import type { Brand } from './brands';
import type { ProductBadge } from './productBadges';
import type {
  MenuItem as Products,
  ProductTranslation,
  ProductVariant,
  ProductImage,
} from './categories';

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

/** Map raw FastAPI menu item response to our Products interface */
function mapProducts(item: ProductsResponse): Products {
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
    unit: item.unit || 'pc',
    search_tags: item.search_tags ?? null,
    min_order_qty: item.min_order_qty ?? 1,
    discount_amount: item.discount_amount ?? 0,
    discount_type: item.discount_type || 'flat',
    shipping_cost: item.shipping_cost ?? 0,
    multiply_qty_shipping: !!item.multiply_qty_shipping,
  };
}

export const ProductsService = {
  async getProducts(limit = 100, skip = 0, createdBy?: number | string): Promise<Products[]> {
    const params = createdBy !== undefined
      ? `/products?limit=${limit}&skip=${skip}&created_by=${createdBy}`
      : `/products?limit=${limit}&skip=${skip}`;
    const res = await client.get<ProductsResponse[]>(params);
    return res.map(mapProducts);
  },

  async getProduct(id: number): Promise<Products> {
    const res = await client.get<ProductsResponse>(`/products/${id}`);
    return mapProducts(res);
  },

  async createProduct(data: {
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
    unit?: string;
    search_tags?: string | null;
    min_order_qty?: number;
    discount_amount?: string | number;
    discount_type?: string;
    shipping_cost?: string | number;
    multiply_qty_shipping?: boolean;
  }): Promise<Products> {
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
    if (data.brand_id !== undefined && data.brand_id !== null) {
      fd.append('brand_id', String(data.brand_id));
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
        if (varItem.image_url) {
          fd.append(`variants[${index}][image_url]`, varItem.image_url);
        }
      });
    } else {
      fd.append('name', data.name || '');
      fd.append('description', data.description || '');
      fd.append('price', data.price || '0.00');
    }

    const res = await client.postFormData<ProductsResponse>('/products', fd);
    return mapProducts(res);
  },

  async updateProduct(id: number, data: {
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
    unit?: string;
    search_tags?: string | null;
    min_order_qty?: number;
    discount_amount?: string | number;
    discount_type?: string;
    shipping_cost?: string | number;
    multiply_qty_shipping?: boolean;
  }): Promise<Products> {
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
    if (data.brand_id !== undefined && data.brand_id !== null) {
      fd.append('brand_id', String(data.brand_id));
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
        if (varItem.image_url) {
          fd.append(`variants[${index}][image_url]`, varItem.image_url);
        }
      });
    } else {
      fd.append('name', data.name || '');
      fd.append('description', data.description || '');
      fd.append('price', data.price || '0.00');
    }

    const res = await client.putFormData<ProductsResponse>(`/products/${id}`, fd);
    return mapProducts(res);
  },

  async deleteProduct(id: number): Promise<void> {
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

