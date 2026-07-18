import type { Root2 } from '@/api/owner/categories';

/** All recognized CSS color names for attribute detection */
const COLOR_NAMES = [
  'red', 'black', 'blue', 'green', 'purple', 'violet', 'indigo',
  'white', 'yellow', 'pink', 'gray', 'orange', 'brown',
];

/**
 * Unified parser for product attribute values.
 * Handles three formats:
 *   1. Hex color:     "#FF0000"
 *   2. Named color:   "Red"
 *   3. Pipe-delimited: "Cream|#FFFDD0"   → colorName="Cream", colorHex="#FFFDD0"
 *   4. Non-color:     "M", "XL"          → isColor=false
 */
export const parseAttributeValue = (val: string, isColorOverride?: boolean) => {
  if (!val) return { isColor: false, value: '', colorName: '', colorHex: '' };

  // Pipe-delimited format: "Cream|#FFFDD0"
  if (val.includes('|')) {
    const [name, hex] = val.split('|');
    return {
      isColor: true,
      value: name.trim(),
      colorName: name.trim(),
      colorHex: hex.trim(),
    };
  }

  // Hex or named color
  const isColor =
    !!isColorOverride ||
    val.startsWith('#') ||
    COLOR_NAMES.includes(val.toLowerCase());

  return {
    isColor,
    value: val,
    colorName: isColor ? val : '',
    colorHex: val.startsWith('#') ? val : '',
  };
};

/**
 * Resolves a color name to its hex value if available in the product variants.
 */
export const resolveColorHex = (product: Root2, colorName: string): string => {
  if (!colorName) return '#CCCCCC';
  if (colorName.startsWith('#')) return colorName;
  if (product.variants) {
    for (const v of product.variants) {
      if (v.attribute_values) {
        for (const av of v.attribute_values) {
          const parsed = parseAttributeValue(
            av.value,
            av.attribute?.name?.toLowerCase() === 'color' ||
            av.attribute?.name?.toLowerCase() === 'colour'
          );
          if (
            parsed.isColor &&
            parsed.colorName.toLowerCase() === colorName.toLowerCase() &&
            parsed.colorHex
          ) {
            return parsed.colorHex;
          }
        }
      }
    }
  }
  return colorName;
};

/**
 * Extracts a unique list of color names from a product's variants.
 */
export const getProductColors = (item: Root2) => {
  const colorsList: string[] = [];
  if (item.variants && item.variants.length > 0) {
    item.variants.forEach((v: any) => {
      if (v.attribute_values) {
        v.attribute_values.forEach((av: any) => {
          const parsed = parseAttributeValue(
            av.value,
            av.attribute?.name?.toLowerCase() === 'color' ||
            av.attribute?.name?.toLowerCase() === 'colour'
          );
          if (parsed.isColor && parsed.colorName) {
            const exists = colorsList.some(
              c => c.toLowerCase() === parsed.colorName.toLowerCase()
            );
            if (!exists) {
              colorsList.push(parsed.colorName);
            }
          }
        });
      }
    });
  }
  return colorsList;
};

export const getProductSizes = (item: Root2) => {
  const sizesList: string[] = [];
  if (item.variants && item.variants.length > 0) {
    item.variants.forEach((v: any) => {
      if (v.attribute_values && v.attribute_values.length > 0) {
        v.attribute_values.forEach((av: any) => {
          const attrName = av.attribute?.name?.toLowerCase() || '';
          const isColorAttr = attrName === 'color' || attrName === 'colour';
          const parsed = parseAttributeValue(av.value, isColorAttr);
          if (parsed.value && !parsed.isColor) {
            const exists = sizesList.some(
              s => s.toLowerCase() === parsed.value.toLowerCase()
            );
            if (!exists) {
              sizesList.push(parsed.value);
            }
          }
        });
      } else {
        const vTitle = (v as any).variant || (v as any).title || (v as any).name;
        if (vTitle && typeof vTitle === 'string') {
          const parsed = parseAttributeValue(vTitle);
          if (parsed.value && !parsed.isColor) {
            const exists = sizesList.some(
              s => s.toLowerCase() === parsed.value.toLowerCase()
            );
            if (!exists) {
              sizesList.push(parsed.value);
            }
          }
        }
      }
    });
  }
  return sizesList;
};

/**
 * Maps database items to look like mockup items with discounts, colors,
 * sizes, and compare prices. Uses unified attribute parsing with dedup.
 */
export const mapToUIItem = (item: Root2) => {
  const variant = item.variants?.[0];
  const compareAt = variant?.compare_at_price;
  const price = parseFloat(item.price);
  let comparePrice = compareAt ? parseFloat(compareAt) : null;
  let discount: string | null = null;

  // 1. Check for variant-level "compare at" price (Sale price)
  if (comparePrice && comparePrice > price) {
    discount = `-${Math.round((1 - price / comparePrice) * 100)}%`;
  }
  // 2. Fallback: Check for root-level discount_amount set during creation
  else if ((item as any).discount_amount && parseFloat(String((item as any).discount_amount)) > 0) {
    const discAmt = parseFloat(String((item as any).discount_amount));
    const discType = (item as any).discount_type || 'flat';

    if (discType === 'percent' || discType === 'percentage') {
      discount = `-${discAmt}%`;
      comparePrice = price / (1 - discAmt / 100);
    } else {
      discount = `-$${discAmt.toFixed(2)}`;
      comparePrice = price + discAmt;
    }
  }

  // Extract unique colors and sizes from variant attribute values
  const colorsSet = new Set<string>();
  const sizesSet = new Set<string>();

  if (item.variants && item.variants.length > 0) {
    item.variants.forEach(v => {
      if (v.attribute_values && v.attribute_values.length > 0) {
        v.attribute_values.forEach((av: any) => {
          const attrName = av.attribute?.name?.toLowerCase() || '';
          const isColorAttr = attrName === 'color' || attrName === 'colour';
          const parsed = parseAttributeValue(av.value, isColorAttr);
          if (parsed.isColor) {
            colorsSet.add(parsed.colorHex || parsed.colorName);
          } else if (parsed.value) {
            sizesSet.add(parsed.value);
          }
        });
      } else {
        const vTitle = (v as any).variant || (v as any).title || (v as any).name;
        if (vTitle && typeof vTitle === 'string') {
          const parsed = parseAttributeValue(vTitle);
          if (parsed.isColor) {
            colorsSet.add(parsed.colorHex || parsed.colorName);
          } else if (parsed.value) {
            sizesSet.add(parsed.value);
          }
        }
      }
    });
  }

  const colors = [...colorsSet];
  const sizes = [...sizesSet];

  return {
    ...item,
    compare_at_price: comparePrice ? comparePrice.toFixed(2) : null,
    discount,
    colors,
    sizes,
    code: item.sku || null,
  };
};
