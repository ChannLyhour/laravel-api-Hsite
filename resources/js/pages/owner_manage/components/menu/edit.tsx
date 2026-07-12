import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiShoppingBag, FiDollarSign, FiCheck, FiX, FiArrowLeft, FiTag } from 'react-icons/fi';
import { menuItemsService, categoriesService, getImageUrl } from '@/api/owner/categories';
import { brandsService, type Brand } from '@/api/owner/brands';
import { productBadgesService, type ProductBadge } from '@/api/owner/productBadges';
import type { Category, MenuItem } from '@/api/owner/categories';
import type { SocialMediaLinks } from '@/api/owner/product';
import { ProductGalleryUpload } from './helpers/ProductGalleryUpload';
import type { GalleryImage } from './helpers/ProductGalleryUpload';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import { ProductVariationSetup } from './helpers/ProductVariationSetup';
import type { GeneratedVariantRow } from './helpers/ProductVariationSetup';
import { validateProductForm, scrollToFirstError, type ProductValidationErrors } from './validations/productValidation';

const getCategoryLevel = (cat: Category, allCats: Category[]): number => {
  let level = 0;
  let current = cat;
  while (current.parent_id) {
    const parent = allCats.find(c => Number(c.id) === Number(current.parent_id));
    if (!parent || Number(parent.id) === Number(current.id)) break; // prevent infinite loops
    level++;
    current = parent;
  }
  return level;
};

const getSinglePath = (path?: any): string => {
  if (!path) return '';
  let resolved = path;
  if (Array.isArray(resolved)) {
    resolved = resolved[0];
  }
  if (typeof resolved === 'string') {
    resolved = resolved.trim();
    if (resolved.startsWith('[') || resolved.startsWith('{')) {
      try {
        const parsed = JSON.parse(resolved);
        if (Array.isArray(parsed)) {
          resolved = parsed[0];
        } else if (parsed && typeof parsed === 'object') {
          resolved = Object.values(parsed)[0];
        }
      } catch (e) { }
    }
  } else if (resolved && typeof resolved === 'object') {
    resolved = Object.values(resolved)[0] || '';
  }
  return typeof resolved === 'string' ? resolved : '';
};

import { useTranslation } from '../../lang/i18n';

interface EditPageProps {
  onClose: () => void;
  categories: Category[];
  item: MenuItem;
  onSave: (updatedItem: MenuItem) => void;
  ownerId?: number | string;
  storeId?: number;
  onCategoriesUpdated?: (categories: Category[]) => void;
}

export const EditPage: React.FC<EditPageProps> = ({
  onClose,
  categories,
  item,
  onSave,
  ownerId,
  onCategoriesUpdated,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'en' | 'km'>('en');
  const [itemNameEn, setItemNameEn] = useState('');
  const [itemNameKh, setItemNameKh] = useState('');
  const [selectedRootId, setSelectedRootId] = useState<number | 'new' | ''>('');
  const [selectedSubId, setSelectedSubId] = useState<number | 'new' | ''>('');
  const [selectedSubSubId, setSelectedSubSubId] = useState<number | 'new' | ''>('');

  // Category inline creation states
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryType, setCategoryType] = useState<'root' | 'sub' | 'subsub'>('root');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescEn, setItemDescEn] = useState('');
  const [itemDescKh, setItemDescKh] = useState('');

  // Custom SKU & Barcode
  const [itemSku, setItemSku] = useState('');
  const [validationErrors, setValidationErrors] = useState<ProductValidationErrors>({});
  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialMediaLinks>({
    facebook: '',
    instagram: '',
    tiktok: '',
    telegram: '',
    youtube: '',
  });
  const [itemBarcode, setItemBarcode] = useState('');
  const [itemPurchasePrice, setItemPurchasePrice] = useState('0.00');
  const [itemStockQty, setItemStockQty] = useState<number>(100);

  const [variants, setVariants] = useState<GeneratedVariantRow[]>([]);
  const [addons, setAddons] = useState<{
    id?: number;
    addon_name: string;
    additional_price: string;
    discount?: string;
    discount_type?: 'flat' | 'percent';
    image?: string;
    imageUrl?: string;
    imageFile?: File;
    is_default?: boolean;
  }[]>([]);

  const addonPriceTotal = addons.reduce((sum, addon) => {
    const price = parseFloat(addon.additional_price) || 0;
    const discountVal = parseFloat(addon.discount || '0.00') || 0;
    const eff = addon.discount_type === 'percent'
      ? Math.max(0, price - (price * discountVal / 100))
      : Math.max(0, price - discountVal);
    return sum + eff;
  }, 0);
  const [colorWiseImages, setColorWiseImages] = useState<Record<string, { file?: File; url?: string }>>({});
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [itemStatus, setItemStatus] = useState<string>('active');
  const [isSpecial, setIsSpecial] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasOptions, setHasOptions] = useState(false);

  // Extended fields
  const [productType, setProductType] = useState('physical');
  const [selectedBrandId, setSelectedBrandId] = useState<number | ''>('');
  const [unit, setUnit] = useState('pc');
  const [searchTags, setSearchTags] = useState('');
  const [minOrderQty, setMinOrderQty] = useState<number>(1);
  const [discountAmount, setDiscountAmount] = useState('0');
  const [discountType, setDiscountType] = useState('flat');
  const [shippingCost, setShippingCost] = useState('0');
  const [multiplyQtyShipping, setMultiplyQtyShipping] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productBadges, setProductBadges] = useState<ProductBadge[]>([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | ''>('');

  const lastInitializedId = useRef<number | null>(null);

  const [localItem, setLocalItem] = useState<MenuItem | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Load brands and badges on mount
  useEffect(() => {
    brandsService.getMyBrands(100, 0, ownerId)
      .then(data => {
        setBrands(data || []);
      })
      .catch(() => { });

    productBadgesService.getMyProductBadges(100, 0)
      .then(data => {
        setProductBadges(data || []);
      })
      .catch(() => {
        productBadgesService.getProductBadges(100, 0)
          .then(data => setProductBadges(data || []))
          .catch(() => { });
      });
  }, [ownerId]);

  // Fetch product details on mount / item prop change to fetch addons correctly
  useEffect(() => {
    if (item && item.id) {
      setLoadingProduct(true);
      menuItemsService.getMenuItem(item.id)
        .then(data => {
          setLocalItem(data);
        })
        .catch(err => {
          console.error('Failed to load menu item details:', err);
          setLocalItem(item); // Fallback to prop item
        })
        .finally(() => {
          setLoadingProduct(false);
        });
    }
  }, [item]);

  useEffect(() => {
    if (localItem) {
      const hasCategoriesLoaded = categories.length > 0;
      const alreadyInitialized = lastInitializedId.current === localItem.id;

      if (!alreadyInitialized && hasCategoriesLoaded) {
        lastInitializedId.current = localItem.id;

        // Find translations
        const transEn = localItem.translations?.find(t => t.locale === 'en');
        const transKh = localItem.translations?.find(t => t.locale === 'km');

        setItemNameEn(transEn?.name || localItem.name);
        setItemNameKh(transKh?.name || '');

        // Trace parent categories
        if (localItem.category_id && categories.length > 0) {
          const cat = categories.find(c => Number(c.id) === Number(localItem.category_id));
          if (cat) {
            const lvl = getCategoryLevel(cat, categories);
            if (lvl === 2) {
              setSelectedSubSubId(cat.id);
              setSelectedSubId(cat.parent_id || '');
              const parent = categories.find(c => c.id === cat.parent_id);
              setSelectedRootId(parent?.parent_id || '');
            } else if (lvl === 1) {
              setSelectedSubSubId('');
              setSelectedSubId(cat.id);
              setSelectedRootId(cat.parent_id || '');
            } else {
              setSelectedSubSubId('');
              setSelectedSubId('');
              setSelectedRootId(cat.id);
            }
          } else {
            setSelectedSubSubId('');
            setSelectedSubId('');
            setSelectedRootId('');
          }
        } else {
          setSelectedSubSubId('');
          setSelectedSubId('');
          setSelectedRootId('');
        }

        setItemPrice(localItem.price ? parseFloat(String(localItem.price)).toFixed(2) : '');
        setItemDescEn(transEn?.description || localItem.description || '');
        setItemDescKh(transKh?.description || '');

        setItemSku(localItem.sku || `PROD-${localItem.id}`);
        setItemBarcode(localItem.barcode || '');

        // Populate extended fields
        setProductType(localItem.product_type || 'physical');
        setSelectedBrandId(localItem.brand_id || '');
        setSelectedBadgeId(localItem.product_badge_id || '');
        setUnit(localItem.unit || 'pc');
        setSearchTags(localItem.search_tags || '');
        setMinOrderQty(localItem.min_order_qty ?? 1);
        setDiscountAmount(localItem.discount_amount !== undefined ? String(localItem.discount_amount) : '0');
        setDiscountType(localItem.discount_type || 'flat');
        setShippingCost(localItem.shipping_cost !== undefined ? String(localItem.shipping_cost) : '0');
        setMultiplyQtyShipping(!!localItem.multiply_qty_shipping);
        setIsSpecial(!!localItem.is_special);
        setSocialMediaLinks({
          facebook: localItem.social_media_link?.facebook || '',
          instagram: localItem.social_media_link?.instagram || '',
          tiktok: localItem.social_media_link?.tiktok || '',
          telegram: localItem.social_media_link?.telegram || '',
          youtube: localItem.social_media_link?.youtube || '',
        });

        if (localItem.addons) {
          setAddons(localItem.addons.map(a => ({
            id: a.id,
            addon_name: a.addon_name,
            additional_price: a.additional_price ? parseFloat(String(a.additional_price)).toFixed(2) : '0.00',
            discount: (a as any).discount ? parseFloat(String((a as any).discount)).toFixed(2) : '0.00',
            discount_type: (a as any).discount_type || 'flat',
            image: a.image || '',
            is_default: !!a.is_default
          })));
        } else {
          setAddons([]);
        }

        setHasOptions(!!localItem.has_options);
        if (localItem.variants && localItem.variants.length > 0) {
          if (!localItem.has_options) {
            const baseVar = localItem.variants[0];
            setItemPurchasePrice(baseVar?.purchase_price ? parseFloat(String(baseVar.purchase_price)).toFixed(2) : '0.00');
            setItemStockQty(baseVar?.stock_qty ?? 100);
          }

          setVariants(localItem.variants.map(v => {
            const varImage = localItem.images?.find(img => img.product_variant_id === v.id);
            const colorVal = (v.attribute_values || []).find((val: any) => val.attribute?.name?.toLowerCase() === 'color');
            const isColorFormat = colorVal && colorVal.value.includes('|');
            const colorName = colorVal ? (isColorFormat ? colorVal.value.split('|')[0] : colorVal.value) : undefined;

            return {
              id: v.id,
              combinationName: (v.attribute_values || []).map((val: any) => val.value.includes('|') ? val.value.split('|')[0] : val.value).join('-'),
              price: v.retail_price ? parseFloat(String(v.retail_price)).toFixed(2) : '',
              sku: v.variant_sku,
              stock: v.stock_qty,
              purchasePrice: v.purchase_price ? parseFloat(String(v.purchase_price)).toFixed(2) : '',
              attrValueIds: (v.attribute_values || []).map((val: any) => val.id),
              colorName,
              imageUrl: getSinglePath(varImage?.image),
            };
          }));

          const initialColorWiseImages: Record<string, { file?: File; url?: string }> = {};
          localItem.variants.forEach(v => {
            const colorVal = (v.attribute_values || []).find((val: any) => val.attribute?.name?.toLowerCase() === 'color');
            if (colorVal) {
              const isColorFormat = colorVal.value.includes('|');
              const colorName = isColorFormat ? colorVal.value.split('|')[0] : colorVal.value;
              const varImage = localItem.images?.find(img => img.product_variant_id === v.id);
              const resolvedVarPath = getSinglePath(varImage?.image);
              if (resolvedVarPath) {
                initialColorWiseImages[colorName] = { url: resolvedVarPath };
              }
            }
          });
          setColorWiseImages(initialColorWiseImages);
        } else {
          setVariants([]);
          setHasOptions(false);
          setItemPurchasePrice('0.00');
          setItemStockQty(100);
        }

        // Populate multi-image gallery
        const tempGallery: GalleryImage[] = [];
        const addedPaths = new Set<string>();

        const mainImagePath = localItem.image && localItem.image.trim() !== '' && !localItem.image.includes('default.png')
          ? localItem.image
          : (localItem.display_image && localItem.display_image.trim() !== '' && !localItem.display_image.includes('default.png') ? localItem.display_image : '');

        // 1. Get all root/product-level images from localItem.images
        const dbRootImages = (localItem.images || []).filter(img => {
          const pathStr = getSinglePath(img.image);
          return img.product_variant_id === null && pathStr && pathStr.trim() !== '' && !pathStr.includes('default.png');
        });

        // 2. Add the database images to tempGallery
        dbRootImages.forEach(img => {
          const pathStr = getSinglePath(img.image);
          if (pathStr) {
            tempGallery.push({
              id: img.id,
              url: pathStr,
              isPrimary: !!img.is_primary,
            });
            addedPaths.add(pathStr.toLowerCase());
          }
        });

        // 3. If the main image path is not in the list, let's add it
        if (mainImagePath && !addedPaths.has(mainImagePath.toLowerCase())) {
          const hasPrimary = tempGallery.some(img => img.isPrimary);
          tempGallery.unshift({
            url: mainImagePath,
            isPrimary: !hasPrimary,
          });
        }

        setGallery(tempGallery);

        setItemStatus(localItem.status);
      }
    }
  }, [localItem, categories]);

  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  // Gallery handler functions
  const handleUploadGalleryImages = (files: FileList) => {
    const newImgs: GalleryImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newImgs.push({
          url: URL.createObjectURL(file),
          file,
          isPrimary: false
        });
      }
    }
    if (newImgs.length > 0) {
      setGallery(prev => {
        const updated = [...prev, ...newImgs];
        // If there is no primary image, set the first one as primary
        if (!updated.some(img => img.isPrimary)) {
          updated[0].isPrimary = true;
        }
        return updated;
      });
      toast.success(`Added ${newImgs.length} image(s) to gallery.`);
    }
  };

  const handleSetMainPicture = (index: number) => {
    setGallery(prev =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    );
    toast.success('Main picture updated!');
  };

  const handleRemoveGalleryImage = (index: number) => {
    const imgToRemove = gallery[index];
    if (imgToRemove && imgToRemove.id) {
      setDeletedImageIds(prev => [...prev, imgToRemove.id!]);
    }

    setGallery(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If the removed image was primary and there are remaining images, set the first one as primary
      if (prev[index]?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
    toast.success('Image removed from gallery.');
  };

  const handleReplaceGalleryImage = (index: number, file: File) => {
    const oldImg = gallery[index];
    if (oldImg && oldImg.id) {
      setDeletedImageIds(prev => [...prev, oldImg.id!]);
    }
    setGallery(prev =>
      prev.map((img, i) =>
        i === index
          ? {
            url: URL.createObjectURL(file),
            file,
            isPrimary: img.isPrimary,
          }
          : img
      )
    );
    toast.success('Gallery image updated.');
  };



  const handleNameEnChange = (val: string) => {
    setItemNameEn(val);
    const slugPart = val.trim().toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 12);
    if (slugPart) {
      setItemSku(`PROD-${slugPart}`);
    } else {
      setItemSku('');
    }
  };

  const handlePriceChange = (val: string) => {
    setItemPrice(val);
  };

  const handleAddonImageChange = (index: number, files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const newAddons = [...addons];
      newAddons[index].imageFile = file;
      newAddons[index].imageUrl = URL.createObjectURL(file);
      setAddons(newAddons);
    }
  };
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validateProductForm({
      itemNameEn,
      itemPrice,
      selectedRootId,
      selectedSubId,
      selectedSubSubId,
      itemSku,
    });
    setValidationErrors(errs);

    if (Object.keys(errs).length > 0) {
      scrollToFirstError(errs, setActiveTab);
      return;
    }

    const finalCategoryId = selectedSubSubId || selectedSubId || selectedRootId;

    setSubmitting(true);
    try {
      // Find the primary/main image from gallery
      const primaryImg = gallery.find(img => img.isPrimary) || gallery[0];

      // Identify if the primary image changed from the initial load
      const initialPrimaryDbImage = localItem?.images?.find(img => img.product_variant_id === null && img.is_primary);
      const initialPrimaryId = initialPrimaryDbImage?.id;

      // If the primary image has changed
      if (primaryImg && primaryImg.id !== initialPrimaryId) {
        // 1. Update the old primary image record to be secondary (is_primary = false)
        if (initialPrimaryId) {
          try {
            await menuItemsService.updateProductImage(initialPrimaryId, { isPrimary: false });
          } catch (err) {
            console.warn('Failed to update old primary image status', err);
          }
        }

        // 2. If the new primary image exists in DB, update it to be primary (is_primary = true)
        if (primaryImg.id) {
          try {
            await menuItemsService.updateProductImage(primaryImg.id, { isPrimary: true });
          } catch (err) {
            console.warn('Failed to update new primary image status', err);
          }
        }
      }

      const imageFile = primaryImg?.id ? undefined : (primaryImg?.file || undefined);
      const imageUrl = imageFile ? undefined : (primaryImg?.url || '');

      // Structure translations payload
      const translationsPayload = [
        {
          locale: 'en',
          name: itemNameEn,
          description: itemDescEn,
          slug: itemNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        },
        ...(itemNameKh.trim() ? [{
          locale: 'km',
          name: itemNameKh,
          description: itemDescKh,
          slug: itemNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }] : []),
      ];

      // Structure variants payload
      const productSku = itemSku || `PROD-${localItem?.id}`;
      const variantsPayload = !hasOptions
        ? [
          {
            id: variants[0]?.id,
            variant_sku: `${productSku}-GLO`,
            purchase_price: itemPurchasePrice || '0.00',
            retail_price: itemPrice || '0.00',
            stock_qty: itemStockQty ?? 100,
            region_code: 'GLO',
            currency_code: 'USD',
            compare_at_price: null,
            low_stock_threshold: null,
            attribute_values: [],
          }
        ]
        : variants.map((v, idx) => {
          const resolvedFile = v.imageFile || (v.colorName ? colorWiseImages[v.colorName]?.file : undefined);
          let resolvedUrl = undefined;
          if (!resolvedFile) {
            if (v.imageUrl && !v.imageUrl.startsWith('blob:')) {
              resolvedUrl = v.imageUrl;
            } else if (v.colorName) {
              const colorImg = colorWiseImages[v.colorName];
              if (colorImg && colorImg.url && !colorImg.url.startsWith('blob:')) {
                resolvedUrl = colorImg.url;
              }
            }
          }
          return {
            id: v.id,
            variant_sku: v.sku || `${productSku}-${idx + 1}`,
            purchase_price: v.purchasePrice || '0.00',
            retail_price: v.price || '0.00',
            stock_qty: v.stock ?? 100,
            region_code: 'GLO',
            currency_code: 'USD',
            compare_at_price: null,
            low_stock_threshold: null,
            attribute_values: v.attrValueIds || [],
            imageFile: resolvedFile,
            image_url: resolvedUrl,
          };
        });
      console.log('[UPDATE] productSku:', productSku);
      console.log('[UPDATE] translationsPayload:', JSON.stringify(translationsPayload, null, 2));
      console.log('[UPDATE] variantsPayload:', JSON.stringify(variantsPayload, null, 2));

      const updatedItem = await menuItemsService.updateMenuItem(localItem?.id!, {
        name: itemNameEn,
        description: itemDescEn,
        price: itemPrice,
        image_url: imageUrl,
        imageFile: imageFile,
        status: itemStatus,
        category_id: Number(finalCategoryId),
        created_by: ownerId,
        is_special: isSpecial,

        // Structured params
        sku: productSku,
        barcode: itemBarcode || null,
        has_options: hasOptions,
        translations: translationsPayload,
        variants: variantsPayload as any,

        product_type: productType,
        brand_id: selectedBrandId ? Number(selectedBrandId) : null,
        product_badge_id: selectedBadgeId ? Number(selectedBadgeId) : null,
        unit: unit,
        search_tags: searchTags || null,
        min_order_qty: minOrderQty,
        discount_amount: parseFloat(discountAmount) || 0,
        discount_type: discountType,
        shipping_cost: parseFloat(shippingCost) || 0,
        multiply_qty_shipping: multiplyQtyShipping,
        social_media_link: Object.values(socialMediaLinks).some(v => !!v) ? socialMediaLinks : null,
        addons: addons.map(a => ({
          id: a.id,
          addon_name: a.addon_name,
          additional_price: parseFloat(a.additional_price) || 0,
          discount: parseFloat(a.discount || '0.00') || 0,
          discount_type: a.discount_type || 'flat',
          image: a.image,
          imageFile: a.imageFile,
          is_default: !!a.is_default
        })),
      });

      // 1. Delete removed gallery images from DB
      for (const imgId of deletedImageIds) {
        try {
          await menuItemsService.deleteProductImage(imgId);
        } catch (e) {
          console.warn('Failed to delete legacy product image', imgId, e);
        }
      }

      // 2. Upload newly added secondary images to DB
      const secondaryNewImages = gallery.filter(img => !img.isPrimary && !img.id);
      for (const newImg of secondaryNewImages) {
        try {
          await menuItemsService.addProductImage(updatedItem.id, {
            imageFile: newImg.file,
            imageUrl: newImg.file ? undefined : newImg.url,
            isPrimary: false
          });
        } catch (e) {
          console.warn('Failed to upload secondary gallery image to DB', newImg.url, e);
        }
      }

      // Reload active items from DB to fetch all newly synchronized images
      const reloadedItem = await menuItemsService.getMenuItem(updatedItem.id).catch(() => updatedItem);

      onSave(reloadedItem);
      toast.success('Product and all gallery images synchronized successfully!');
      window.dispatchEvent(new CustomEvent('data_updated'));
      new BroadcastChannel('data_updates').postMessage('refresh');
      onClose();
    } catch (err) {
      console.error('Failed to save menu item:', err);
      let errorMessage = 'Failed to save menu item. Please verify all SKU values are unique.';
      let hasInlineErrors = false;

      if (err && typeof err === 'object') {
        const anyErr = err as any;
        if (anyErr.details?.errors && typeof anyErr.details.errors === 'object') {
          const backendErrors = anyErr.details.errors;
          const newValidationErrs: ProductValidationErrors = {};

          const skuErrorKey = Object.keys(backendErrors).find(key => key.toLowerCase().includes('sku'));
          if (skuErrorKey) {
            newValidationErrs.itemSku = backendErrors[skuErrorKey].join(', ');
            hasInlineErrors = true;
          }

          const nameErrorKey = Object.keys(backendErrors).find(key => key.toLowerCase().includes('name'));
          if (nameErrorKey) {
            newValidationErrs.itemNameEn = backendErrors[nameErrorKey].join(', ');
            hasInlineErrors = true;
          }

          const priceErrorKey = Object.keys(backendErrors).find(key => key.toLowerCase().includes('price') && !key.toLowerCase().includes('purchase'));
          if (priceErrorKey) {
            newValidationErrs.itemPrice = backendErrors[priceErrorKey].join(', ');
            hasInlineErrors = true;
          }

          const categoryErrorKey = Object.keys(backendErrors).find(key => key.toLowerCase().includes('category'));
          if (categoryErrorKey) {
            newValidationErrs.category = backendErrors[categoryErrorKey].join(', ');
            hasInlineErrors = true;
          }

          if (hasInlineErrors) {
            setValidationErrors(newValidationErrs);
            scrollToFirstError(newValidationErrs, setActiveTab);
          }
        }

        if (!hasInlineErrors) {
          if (anyErr.details?.message) {
            errorMessage = anyErr.details.message;
            if (anyErr.details.errors && typeof anyErr.details.errors === 'object') {
              const errorKeys = Object.keys(anyErr.details.errors);
              if (errorKeys.length > 0) {
                const detailsList = errorKeys.map(key => anyErr.details.errors[key].join(', ')).join('; ');
                errorMessage = `${anyErr.details.message} (${detailsList})`;
              }
            }
          } else if (anyErr.message) {
            errorMessage = anyErr.message;
          }
          toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateCategoryModal = (type: 'root' | 'sub' | 'subsub') => {
    setCategoryType(type);
    setNewCategoryName('');
    setNewCategoryDesc('');
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    if (selectedRootId === 'new') setSelectedRootId('');
    if (selectedSubId === 'new') setSelectedSubId('');
    if (selectedSubSubId === 'new') setSelectedSubSubId('');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setCategorySubmitting(true);
    try {
      let parentId: number | null = null;
      if (categoryType === 'sub') {
        parentId = selectedRootId ? Number(selectedRootId) : null;
      } else if (categoryType === 'subsub') {
        parentId = selectedSubId ? Number(selectedSubId) : null;
      }

      const newCat = await categoriesService.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim(),
        status: 1,
        is_menu: true,
        parent_id: parentId,
        created_by: ownerId,
      });

      const updatedCats = [...localCategories, newCat];
      setLocalCategories(updatedCats);
      onCategoriesUpdated?.(updatedCats);

      if (categoryType === 'root') {
        setSelectedRootId(newCat.id);
        setSelectedSubId('');
        setSelectedSubSubId('');
      } else if (categoryType === 'sub') {
        setSelectedSubId(newCat.id);
        setSelectedSubSubId('');
      } else if (categoryType === 'subsub') {
        setSelectedSubSubId(newCat.id);
      }

      toast.success('Category created successfully!');
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create category:', err);
      const errMsg = err?.details?.message || err?.message || 'Failed to create category.';
      toast.error(errMsg);
    } finally {
      setCategorySubmitting(false);
    }
  };

  const rootCategories = localCategories.filter(c => getCategoryLevel(c, localCategories) === 0);
  const subCategories = selectedRootId && selectedRootId !== 'new'
    ? localCategories.filter(c => getCategoryLevel(c, localCategories) === 1 && c.parent_id == selectedRootId)
    : [];
  const subSubCategories = selectedSubId && selectedSubId !== 'new'
    ? localCategories.filter(c => getCategoryLevel(c, localCategories) === 2 && c.parent_id == selectedSubId)
    : [];

  if (loadingProduct || !localItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 w-full bg-white border border-slate-100 rounded-[10px] shadow-xs font-kuntomruy animate-fade-in">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-[#1455ac] rounded-full animate-spin"></div>
        </div>
        <span className="text-slate-400 font-extrabold text-xs tracking-wider uppercase">Loading Product Setup...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in w-full">
      {/* Navigation Header */}
      <div className="flex items-center space-x-3 pb-2">
        <button
          onClick={onClose}
          className="p-2 border border-slate-200 rounded-[5px] hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-2xs"
          title="Back to products list"
        >
          <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <FiShoppingBag className="text-[#1455ac]" />
            <span>Edit Product</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Modify dish parameters, active pricing matrices, or recipe images.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveItem} className="space-y-6 w-full" noValidate>
        {/* Two Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">

          {/* Left Column: General Information Card */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Setup Card */}
            <div className="bg-white border border-slate-100 rounded-[10px] p-6 sm:p-8 shadow-xs space-y-4">
              <div className="mb-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800">{t('menu.general_info')}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{t('menu.subtitle')}</p>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-lg space-y-4">
                {/* Language Tabs Selector */}
                <div className="flex gap-6 border-b border-slate-100 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('en')}
                    className={`pb-2.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${activeTab === 'en'
                      ? 'border-[#1455ac] text-[#1455ac]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <span className="inline-block w-4 h-4 rounded-full bg-blue-50 text-[#1455ac] text-[9px] font-black flex items-center justify-center border border-blue-200 shrink-0">EN</span>
                    <span>English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('km')}
                    className={`pb-2.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${activeTab === 'km'
                      ? 'border-[#1455ac] text-[#1455ac]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <span className="inline-block w-4 h-4 rounded-full bg-rose-50 text-rose-600 text-[9px] font-black flex items-center justify-center border border-rose-200 shrink-0">KH</span>
                    <span>Khmer</span>
                  </button>
                </div>

                {/* Tab Contents */}
                {activeTab === 'en' ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                        {t('menu.name')} (EN) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="itemNameEn"
                        type="text"
                        required={activeTab === 'en'}
                        value={itemNameEn}
                        onChange={(e) => {
                          handleNameEnChange(e.target.value);
                          if (validationErrors.itemNameEn) {
                            setValidationErrors(prev => ({ ...prev, itemNameEn: '' }));
                          }
                        }}
                        placeholder="e.g. iPhone 15 Pro"
                        className={`w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 font-medium ${validationErrors.itemNameEn
                          ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 text-rose-800 bg-rose-50/10'
                          : 'border-slate-200 focus:ring-[#1455ac]/20 focus:border-[#1455ac] text-slate-800'
                          }`}
                      />
                      {validationErrors.itemNameEn && (
                        <p className="text-xs text-rose-500 font-bold mt-1">
                          {validationErrors.itemNameEn}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                        {t('menu.description')} (EN)
                      </label>
                      <textarea
                        value={itemDescEn}
                        onChange={(e) => setItemDescEn(e.target.value)}
                        placeholder="Flagship dynamic smartphone with titanium design..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800 resize-none font-kuntomruy"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                        {t('menu.name')} (KH) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={activeTab === 'km'}
                        value={itemNameKh}
                        onChange={(e) => setItemNameKh(e.target.value)}
                        placeholder="ឧទាហរណ៍៖ អាយហ្វូន ១៥ ប្រូ"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                        {t('menu.description')} (KH)
                      </label>
                      <textarea
                        value={itemDescKh}
                        onChange={(e) => setItemDescKh(e.target.value)}
                        placeholder="ទូរស័ព្ទដៃទំនើបចុងក្រោយបង្អស់..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800 resize-none font-kuntomruy"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media Links */}
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-extrabold text-slate-700">{t('menu.social_links')}</span>
                  <span className="text-slate-400 text-xs cursor-help" title={t('menu.social_links_tip')}>ℹ️</span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{t('menu.social_links_desc')}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  {/* Facebook */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Facebook</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center pointer-events-none text-[#1877F2]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={socialMediaLinks.facebook || ''}
                        onChange={(e) => setSocialMediaLinks(prev => ({ ...prev, facebook: e.target.value }))}
                        placeholder="https://facebook.com/..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Instagram</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center pointer-events-none text-[#E1306C]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={socialMediaLinks.instagram || ''}
                        onChange={(e) => setSocialMediaLinks(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="https://instagram.com/..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">TikTok</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center pointer-events-none text-[#010101]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.07-2.89-.52-4.06-1.39v7.86c-.03 2.44-1.18 4.86-3.23 6.13-2.45 1.57-5.83 1.67-8.38.25-2.52-1.4-3.89-4.32-3.39-7.18.39-2.52 2.22-4.71 4.73-5.26.79-.17 1.61-.17 2.41-.02v4.08c-.89-.25-1.89-.13-2.67.36-.92.56-1.4 1.62-1.28 2.68.1 1.05.81 1.99 1.83 2.26 1.03.3 2.18-.08 2.77-.95.34-.52.48-1.14.47-1.76l-.02-12.42z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={socialMediaLinks.tiktok || ''}
                        onChange={(e) => setSocialMediaLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                        placeholder="https://tiktok.com/@..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Telegram */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Telegram</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center pointer-events-none text-[#0088cc]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.19-.03.29z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={socialMediaLinks.telegram || ''}
                        onChange={(e) => setSocialMediaLinks(prev => ({ ...prev, telegram: e.target.value }))}
                        placeholder="https://t.me/..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* YouTube */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">YouTube</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center pointer-events-none text-[#FF0000]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.108C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.555a3.003 3.003 0 00-2.11 2.108C0 8.017 0 12 0 12s0 3.982.502 5.837a3.003 3.003 0 002.11 2.108C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.555a3.003 3.003 0 002.11-2.108C24 15.982 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={socialMediaLinks.youtube || ''}
                        onChange={(e) => setSocialMediaLinks(prev => ({ ...prev, youtube: e.target.value }))}
                        placeholder="https://youtube.com/..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Media Upload & Availability Status */}
          <div className="lg:col-span-1 space-y-6">
            <ProductGalleryUpload
              gallery={gallery}
              onUploadImages={handleUploadGalleryImages}
              onRemoveImage={handleRemoveGalleryImage}
              onSetMainPicture={handleSetMainPicture}
              onReplaceImage={handleReplaceGalleryImage}
            >
              <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-lg space-y-4">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.status')}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setItemStatus('active')}
                    className={`flex-1 py-2.5 px-3 border rounded-[5px] text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${itemStatus === 'active'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    <FiCheck className="w-4 h-4 stroke-[3]" />
                    <span>{t('menu.active')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemStatus('inactive')}
                    className={`flex-1 py-2.5 px-3 border rounded-[5px] text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${itemStatus === 'inactive'
                      ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    <FiX className="w-4 h-4 stroke-[3]" />
                    <span>{t('menu.inactive')}</span>
                  </button>
                </div>
              </div>
            </ProductGalleryUpload>
          </div>
        </div>

        {/* General Setup Card */}
        <div className="bg-white border border-slate-100 rounded-[10px] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="mb-2">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800">{t('menu.general_info')}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{t('menu.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Product settings group */}
            <div className="flex flex-col col-span-1 bg-slate-50/50 border border-slate-100 p-5 rounded-lg space-y-4">
              {/* Product Type */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.product_type')} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] transition-all bg-white cursor-pointer"
                >
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                </select>
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  Brand
                </label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setSelectedBrandId(val);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] transition-all bg-white cursor-pointer"
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Badge */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.badges')}
                </label>
                <select
                  value={selectedBadgeId}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setSelectedBadgeId(val);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] transition-all bg-white cursor-pointer"
                >
                  <option value="">Select Badge</option>
                  {productBadges.map(badge => (
                    <option key={badge.id} value={badge.id}>
                      {badge.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categories group */}
            <div className="flex flex-col col-span-1 bg-slate-50/50 border border-slate-100 p-5 rounded-lg space-y-4">
              {/* Category (Root) */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.category')} <span className="text-rose-500">*</span>
                </label>
                <select
                  id="selectedRootId"
                  value={selectedRootId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'new') {
                      setSelectedRootId('new');
                      handleOpenCreateCategoryModal('root');
                      return;
                    }
                    setSelectedRootId(val ? Number(val) : '');
                    setSelectedSubId('');
                    setSelectedSubSubId('');
                    if (validationErrors.category) {
                      setValidationErrors(prev => ({ ...prev, category: '' }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-[5px] text-sm font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${validationErrors.category
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 text-rose-800 bg-rose-50/10'
                    : 'border-slate-200 focus:ring-[#1455ac]/20 focus:border-[#1455ac] text-slate-700 bg-white'
                    }`}
                >
                  <option value="">Select category</option>
                  {rootCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="new" className="text-[#1455ac] font-bold">+ Add New Category</option>
                </select>
                {validationErrors.category && (
                  <p className="text-xs text-rose-500 font-bold mt-1">
                    {validationErrors.category}
                  </p>
                )}
              </div>

              {/* Sub Category */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  Sub Category
                </label>
                <select
                  disabled={!selectedRootId || selectedRootId === 'new'}
                  value={selectedSubId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'new') {
                      setSelectedSubId('new');
                      handleOpenCreateCategoryModal('sub');
                      return;
                    }
                    setSelectedSubId(val ? Number(val) : '');
                    setSelectedSubSubId('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] transition-all bg-white cursor-pointer disabled:opacity-50"
                >
                  <option value="">Select Sub Category</option>
                  {subCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  {selectedRootId && selectedRootId !== 'new' && (
                    <option value="new" className="text-[#1455ac] font-bold">+ Add New Sub Category</option>
                  )}
                </select>
              </div>

              {/* Sub Sub Category */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  Sub Sub Category
                </label>
                <select
                  disabled={!selectedSubId || selectedSubId === 'new'}
                  value={selectedSubSubId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'new') {
                      setSelectedSubSubId('new');
                      handleOpenCreateCategoryModal('subsub');
                      return;
                    }
                    setSelectedSubSubId(val ? Number(val) : '');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] transition-all bg-white cursor-pointer disabled:opacity-50"
                >
                  <option value="">Select Sub Sub Category</option>
                  {subSubCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  {selectedSubId && selectedSubId !== 'new' && (
                    <option value="new" className="text-[#1455ac] font-bold">+ Add New Sub Sub Category</option>
                  )}
                </select>
              </div>
            </div>

            {/* Product SKU & Unit group */}
            <div className="flex flex-col col-span-1 bg-slate-50/50 border border-slate-100 p-5 rounded-lg space-y-4">
              {/* Product SKU */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    {t('menu.sku')} <span className="text-rose-500">*</span>
                    <span className="text-slate-400 cursor-help" title="Unique product code.">ℹ️</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randCode = Math.floor(100000 + Math.random() * 900000);
                      setItemSku(`PROD-${randCode}`);
                      if (validationErrors.itemSku) {
                        setValidationErrors(prev => ({ ...prev, itemSku: '' }));
                      }
                      // Sync SKU to variants if simple
                      setVariants(prev => {
                        const next = [...prev];
                        if (next[0]) {
                          next[0].sku = `PROD-${randCode}-GLO`;
                        }
                        return next;
                      });
                    }}
                    className="text-xs font-bold text-[#1455ac] hover:underline cursor-pointer"
                  >
                    {t('menu.generate_code')}
                  </button>
                </div>
                <input
                  id="itemSku"
                  type="text"
                  required
                  value={itemSku}
                  onChange={(e) => {
                    setItemSku(e.target.value);
                    if (validationErrors.itemSku) {
                      setValidationErrors(prev => ({ ...prev, itemSku: '' }));
                    }
                    // Sync SKU to variants if simple
                    setVariants(prev => {
                      const next = [...prev];
                      if (next[0]) {
                        next[0].sku = `${e.target.value}-GLO`;
                      }
                      return next;
                    });
                  }}
                  placeholder="Ex: 161183"
                  className={`w-full px-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 font-bold ${validationErrors.itemSku
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 text-rose-800 bg-rose-50/10'
                    : 'border-slate-200 focus:ring-[#1455ac]/20 focus:border-[#1455ac] text-slate-800'
                    }`}
                />
                {validationErrors.itemSku && (
                  <p className="text-xs text-rose-500 font-bold mt-1">
                    {validationErrors.itemSku}
                  </p>
                )}
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.unit')} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] transition-all bg-white cursor-pointer"
                >
                  <option value="pc">pc</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lbs">lbs</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                  <option value="liter">liter</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            {/* Search Tags */}
            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                {t('menu.search_tags')}
                <span className="text-slate-400 cursor-help" title="Enter search keywords to help users find the product.">ℹ️</span>
              </label>
              <input
                type="text"
                value={searchTags}
                onChange={(e) => setSearchTags(e.target.value)}
                placeholder="Enter tag"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800"
              />
            </div>

          </div>
        </div>

        {/* Pricing & Others Card */}
        <div className="bg-white border border-slate-100 rounded-[10px] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="mb-2 border-b border-slate-100 pb-3">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800">{t('menu.price')}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{t('menu.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Pricing & Stock group */}
            <div className="flex flex-col col-span-1 bg-slate-50/50 border border-slate-100 p-5 rounded-lg space-y-4">
              {/* Unit Price */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.price')} ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <FiDollarSign className="w-4 h-4" />
                  </span>
                  <input
                    id="itemPrice"
                    type="number"
                    step="0.01"
                    required
                    value={itemPrice}
                    onChange={(e) => {
                      handlePriceChange(e.target.value);
                      if (validationErrors.itemPrice) {
                        setValidationErrors(prev => ({ ...prev, itemPrice: '' }));
                      }
                    }}
                    placeholder="Unit Price"
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-[5px] text-sm focus:outline-none focus:ring-2 font-bold ${validationErrors.itemPrice
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 text-rose-800 bg-rose-50/10'
                      : 'border-slate-200 focus:ring-[#1455ac]/20 focus:border-[#1455ac] text-slate-800'
                      }`}
                  />
                </div>
                {validationErrors.itemPrice && (
                  <p className="text-xs text-rose-500 font-bold mt-1">
                    {validationErrors.itemPrice}
                  </p>
                )}
              </div>

              {/* Base Purchase Price */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.purchase_price')} (USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <FiDollarSign className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={itemPurchasePrice}
                    onChange={(e) => {
                      setItemPurchasePrice(e.target.value);
                      setVariants(prev => {
                        const next = [...prev];
                        if (next[0]) {
                          next[0].purchasePrice = e.target.value;
                        }
                        return next;
                      });
                    }}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Current Stock Qty */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  {t('menu.stock_qty')} <span className="text-rose-500">*</span>
                  <span className="text-slate-400 cursor-help" title="Quantity currently in stock.">ℹ️</span>
                </label>
                <input
                  type="number"
                  required
                  disabled={hasOptions}
                  value={hasOptions ? variants.reduce((sum, v) => sum + (v.stock || 0), 0) : itemStockQty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setItemStockQty(val);
                    setVariants(prev => {
                      const next = [...prev];
                      if (next[0]) {
                        next[0].stock = val;
                      }
                      return next;
                    });
                  }}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-bold text-slate-800 disabled:bg-slate-50"
                />
              </div>

              {/* Minimum Order Qty */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  {t('menu.min_order_qty')} <span className="text-rose-500">*</span>
                  <span className="text-slate-400 cursor-help" title="Minimum quantity a customer can order.">ℹ️</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={minOrderQty}
                  onChange={(e) => setMinOrderQty(parseInt(e.target.value) || 1)}
                  placeholder="1"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Discount & Shipping group */}
            <div className="flex flex-col col-span-1 bg-slate-50/50 border border-slate-100 p-5 rounded-lg space-y-4">
              {/* Discount Amount */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  {t('menu.discount_amount')} <span className="text-rose-500">*</span>
                  <span className="text-slate-400 cursor-help" title="Discount value.">ℹ️</span>
                </label>
                <div className="flex rounded-[5px] border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#1455ac]/20 focus-within:border-[#1455ac]">
                  <input
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none border-none bg-white"
                    placeholder="0"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="bg-slate-50 border-l border-slate-200 px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="flat">{t('menu.flat')}</option>
                    <option value="percent">{t('menu.percent')}</option>
                  </select>
                </div>
              </div>

              {/* Shipping Cost */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  {t('menu.shipping_cost')} ($)
                  <span className="text-slate-400 cursor-help" title="Shipping charge for this product.">ℹ️</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <FiDollarSign className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Shipping Cost Multiply with Qty */}
              <div className="flex flex-col justify-center pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
                    {t('menu.shipping_multiply')}
                  </label>
                  <div
                    onClick={() => setMultiplyQtyShipping(!multiplyQtyShipping)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${multiplyQtyShipping ? 'bg-[#1455ac]' : 'bg-slate-300'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${multiplyQtyShipping ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Barcode & Identification group */}
            <div className="flex flex-col col-span-1 bg-slate-50/50 border border-slate-100 p-5 rounded-lg space-y-4">
              {/* Barcode / EAN */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.barcode_optional')}
                </label>
                <input
                  type="text"
                  value={itemBarcode}
                  onChange={(e) => setItemBarcode(e.target.value)}
                  placeholder="e.g. 195949033321"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800"
                />
              </div>

              {/* Special Product Checkbox */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="isSpecial"
                  checked={isSpecial}
                  onChange={(e) => setIsSpecial(e.target.checked)}
                  className="w-4.5 h-4.5 text-[#1455ac] border-slate-300 rounded focus:ring-[#1455ac] cursor-pointer"
                />
                <label htmlFor="isSpecial" className="text-xs sm:text-sm font-bold text-slate-700 cursor-pointer select-none">
                  {t('menu.special_product')}
                </label>
              </div>
            </div>
          </div>
        </div>
        {/* Product Addons Card */}
        <div className="bg-white border border-slate-100 rounded-[10px] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="mb-2 border-b border-slate-100 pb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800">{t('menu.product_addons')}</h3>
              <p className="text-slate-400 text-xs mt-0.5">{t('menu.addons_desc')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
              {addons.length > 0 && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-[5px] border border-slate-200/50 text-xs font-extrabold text-slate-700">
                    <span>{t('menu.total_addons')}: ${addonPriceTotal.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setItemPrice(addonPriceTotal.toFixed(2));
                        toast.success(`Unit price set to $${addonPriceTotal.toFixed(2)}!`);
                      }}
                      className="ml-1 px-2 py-0.5 bg-[#1455ac] text-white rounded-[3px] text-[10px] font-extrabold transition-all hover:bg-[#0f4d9c] cursor-pointer border-none"
                    >
                      {t('menu.set_unit_price')}
                    </button>
                  </div>
                  {parseFloat(itemPrice) === addonPriceTotal && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      ✔️ {t('menu.unit_price_matches')}
                    </span>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setAddons(prev => [...prev, { addon_name: '', additional_price: '0.00', discount: '0.00', discount_type: 'flat', is_default: false }])}
                className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-xs font-bold transition-all border border-slate-200/50 cursor-pointer whitespace-nowrap"
              >
                {t('menu.add_addon_option')}
              </button>
            </div>
          </div>

          {addons.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-[5px] text-slate-400 text-xs font-medium">
              {t('menu.no_addons_configured')}
            </div>
          ) : (
            <div className="space-y-3">
              {addons.map((addon, index) => (
                <div key={index} className="flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/50 border border-slate-100 p-4 lg:p-3.5 rounded-lg">
                  {/* Left Column: Image Upload + Addon Name */}
                  <div className="flex items-center gap-3 w-full lg:w-auto lg:flex-[3]">
                    {/* Thumbnail upload field */}
                    <div className="relative w-12 h-12 border border-slate-200 rounded-[5px] bg-white flex items-center justify-center overflow-hidden shrink-0 group">
                      {addon.imageUrl || addon.image ? (
                        <>
                          <img
                            src={addon.imageUrl || getImageUrl(addon.image)}
                            alt="Addon preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="text-[10px] text-white font-bold cursor-pointer">
                              {t('menu.change')}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleAddonImageChange(index, e.target.files)}
                              />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-[#1455ac] hover:bg-slate-50/80 transition-all cursor-pointer">
                          <span className="text-[10px] font-bold">{t('menu.image')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleAddonImageChange(index, e.target.files)}
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t('menu.addon_name')}</label>
                      <input
                        type="text"
                        required
                        value={addon.addon_name}
                        onChange={(e) => {
                          const newAddons = [...addons];
                          newAddons[index].addon_name = e.target.value;
                          setAddons(newAddons);
                        }}
                        placeholder="e.g. Extra Pearl, Oat Milk, Cheese"
                        className="w-full px-3 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800 bg-white"
                      />
                    </div>
                  </div>

                  {/* Right Column Grid: Price, Discount, Auto Check, Delete */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-3.5 w-full lg:w-auto lg:flex-[5.5]">
                    <div className="space-y-1 col-span-1 lg:flex-[1.5] w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t('menu.additional_price')} ($)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">
                          <FiDollarSign className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={addon.additional_price}
                          onChange={(e) => {
                            const newAddons = [...addons];
                            newAddons[index].additional_price = e.target.value;
                            setAddons(newAddons);
                          }}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-bold text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 col-span-1 lg:flex-[2] w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t('menu.discount')}</label>
                      <div className="flex rounded-[5px] border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#1455ac]/20 focus-within:border-[#1455ac]">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">
                            <FiDollarSign className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={addon.discount}
                            onChange={(e) => {
                              const newAddons = [...addons];
                              newAddons[index].discount = e.target.value;
                              setAddons(newAddons);
                            }}
                            placeholder="0.00"
                            className="w-full pl-7 pr-2 py-2 text-sm font-bold text-slate-800 focus:outline-none border-none bg-transparent"
                          />
                        </div>
                        <select
                          value={addon.discount_type || 'flat'}
                          onChange={(e) => {
                            const newAddons = [...addons];
                            newAddons[index].discount_type = e.target.value as 'flat' | 'percent';
                            setAddons(newAddons);
                          }}
                          className="bg-slate-50 border-l border-slate-200 px-2 py-2 text-2xs font-extrabold text-slate-650 focus:outline-none cursor-pointer"
                        >
                          <option value="flat">{t('menu.flat')} ($)</option>
                          <option value="percent">{t('menu.percent')} (%)</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Auto Checkbox toggle */}
                    <div className="w-full lg:w-20 col-span-1 lg:shrink-0 space-y-1 flex flex-col justify-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t('menu.auto_check')}</label>
                      <div className="pt-2">
                        <div
                          onClick={() => {
                            const newAddons = [...addons];
                            newAddons[index].is_default = !newAddons[index].is_default;
                            setAddons(newAddons);
                          }}
                          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${addon.is_default ? 'bg-[#1455ac]' : 'bg-slate-300'}`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${addon.is_default ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 lg:shrink-0 flex items-center justify-end lg:justify-start pt-5 lg:pt-4">
                      <button
                        type="button"
                        onClick={() => setAddons(prev => prev.filter((_, i) => i !== index))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-[5px] transition-colors border-none cursor-pointer"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Variants Card */}
        <ProductVariationSetup
          ownerId={ownerId}
          basePrice={itemPrice}
          baseSku={itemSku}
          basePurchasePrice={itemPurchasePrice}
          hasOptions={hasOptions}
          onHasOptionsChange={setHasOptions}
          variants={variants}
          onChangeVariants={setVariants}
          colorWiseImages={colorWiseImages}
          onChangeColorWiseImages={setColorWiseImages}
        />

        {/* Action Buttons Footer row */}
        <div className="flex items-center space-x-4 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[10px] text-sm font-bold transition-all border border-slate-200/50 cursor-pointer min-w-[120px]"
          >
            {t('menu.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="py-2.5 px-6 bg-[#1455ac] hover:bg-[#0f4d9c] text-white rounded-[10px] text-sm font-bold transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 border-none min-w-[180px]"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('menu.save')}...</span>
              </>
            ) : (
              <span>{t('menu.save')}</span>
            )}
          </button>
        </div>

      </form>

      {/* Category Creation Modal Backdrop */}
      {isCategoryModalOpen && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 animate-fade-in">
          <div className="absolute inset-0 cursor-default" onClick={handleCloseCategoryModal}></div>

          <div className="w-full max-w-md bg-white rounded-[5px] p-6 sm:p-8 relative z-10 border border-slate-100 shadow-2xl animate-slide-up text-left font-kuntomruy">
            <button
              onClick={handleCloseCategoryModal}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[5px] p-2 transition-all cursor-pointer border-none"
            >
              <FiX className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <FiTag className="text-[#1455ac] w-5 h-5" />
                <span>
                  {categoryType === 'root' && t('menu.create_root_category')}
                  {categoryType === 'sub' && t('menu.create_sub_category')}
                  {categoryType === 'subsub' && t('menu.create_subsub_category')}
                </span>
              </h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {t('menu.category_desc')}
              </p>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              {/* Display Parent Category Info if adding Sub / Sub-Sub Category */}
              {categoryType !== 'root' && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-[5px] space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t('menu.parent_group')}</span>
                  <span className="text-xs font-extrabold text-slate-705">
                    {categoryType === 'sub' && localCategories.find(c => c.id === selectedRootId)?.name}
                    {categoryType === 'subsub' && localCategories.find(c => c.id === selectedSubId)?.name}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.category_name')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('menu.category_name_placeholder') || 'e.g. Drinks, Desserts, Accessories'}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  {t('menu.description')}
                </label>
                <textarea
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder={t('menu.category_desc_placeholder') || 'Optional description of this category...'}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1455ac]/20 focus:border-[#1455ac] font-medium text-slate-800 resize-none font-kuntomruy"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-sm font-bold transition-all border border-slate-200/50 cursor-pointer"
                >
                  {t('menu.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting || !newCategoryName.trim()}
                  className="flex-1 py-2.5 px-4 bg-[#1455ac] hover:bg-[#0f4d9c] text-white rounded-[5px] text-sm font-bold transition-all shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 border-none cursor-pointer"
                >
                  {categorySubmitting ? t('menu.creating') : t('menu.create')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

