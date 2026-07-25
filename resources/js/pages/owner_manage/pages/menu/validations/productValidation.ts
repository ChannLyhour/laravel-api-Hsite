export interface ProductValidationFields {
  itemNameEn: string;
  itemPrice: string | number;
  selectedRootId: string | number | null;
  selectedSubId: string | number | null;
  selectedSubSubId: string | number | null;
  itemSku?: string;
}

export interface ProductValidationErrors {
  itemNameEn?: string;
  itemPrice?: string;
  category?: string;
  itemSku?: string;
}

/**
 * Validates product menu form fields (Product Name, Retail Price, Category).
 * Returns an errors object containing fields that failed validation.
 *
 * @param fields The form values to validate
 * @returns ProductValidationErrors object containing error messages, if any
 */
export const validateProductForm = (fields: ProductValidationFields): ProductValidationErrors => {
  const errors: ProductValidationErrors = {};
  const name = (fields.itemNameEn || '').trim();
  const price = String(fields.itemPrice || '').trim();
  const finalCategoryId = fields.selectedSubSubId || fields.selectedSubId || fields.selectedRootId;

  // 1. Validate Product Name
  if (!name) {
    errors.itemNameEn = 'Product Name (English) is required.';
  } else if (name.length < 3) {
    errors.itemNameEn = 'Product Name must be at least 3 characters.';
  } else if (name.length > 120) {
    errors.itemNameEn = 'Product Name cannot exceed 120 characters.';
  }

  // 2. Validate Category Selection
  if (!finalCategoryId || finalCategoryId === 'new') {
    errors.category = 'Please select a product category.';
  }

  // 3. Validate Retail Price
  if (!price) {
    errors.itemPrice = 'Retail price is required.';
  } else {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      errors.itemPrice = 'Retail price must be a valid number.';
    } else if (parsedPrice < 0) {
      errors.itemPrice = 'Retail price cannot be negative.';
    }
  }

  // 4. Validate SKU
  const sku = (fields.itemSku || '').trim();
  if (!sku) {
    errors.itemSku = 'Product SKU is required.';
  } else if (/\s/.test(sku)) {
    errors.itemSku = 'Product SKU cannot contain spaces.';
  }

  return errors;
};

/**
 * Automatically focuses and scrolls to the first validation error field.
 * Helps prevent forgetting smooth scroll behavior in forms.
 * 
 * @param errors The ProductValidationErrors object
 * @param setActiveTab Optional callback to set the active language tab
 */
export const scrollToFirstError = (
  errors: ProductValidationErrors,
  setActiveTab?: (tab: 'en' | 'km') => void
): void => {
  if (typeof window === 'undefined') return;

  if (errors.itemNameEn) {
    if (setActiveTab) setActiveTab('en');
    setTimeout(() => {
      const el = document.getElementById('itemNameEn');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  } else if (errors.category) {
    const el = document.getElementById('selectedRootId');
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else if (errors.itemPrice) {
    const el = document.getElementById('itemPrice');
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else if (errors.itemSku) {
    const el = document.getElementById('itemSku');
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
