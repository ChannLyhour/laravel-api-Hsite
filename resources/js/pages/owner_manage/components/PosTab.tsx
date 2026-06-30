import React, { useState, useEffect, useMemo } from 'react';
import {
  FiSearch, FiShoppingBag, FiTrash2, FiPlus, FiMinus,
  FiPrinter, FiX, FiRefreshCw,
  FiFilter, FiChevronDown, FiEdit2, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { client } from '@/api/client';
import { resolveImageUrl } from '@/api/imageUtils';
import { Store_setting } from '@/api/owner/stores';
import { ordersService } from '@/api/owner/orders';
import { customersService, type Customer } from '@/api/owner/customers';
import { ModelPlaceOrder } from './pos/ModelPlaceOrder';
import { ModelCreateCustomer } from './pos/ModelCreateCustomer';
import { PopupPaymentKHQR } from './pos/popupKhqr';

interface PosTabProps {
  ownerId?: number | string;
  storeId?: number;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  selectedOptions?: {
    Size?: string;
    Color?: string;
  };
}

interface HeldOrder {
  id: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxPercentage: number;
  total: number;
  couponDiscount: number;
  extraDiscount: number;
  date: string;
}


export const PosTab: React.FC<PosTabProps> = ({ ownerId, storeId }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [productType, setProductType] = useState<'physical' | 'digital'>('physical');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Custom filter states to match screenshot drawer
  const [sortBy, setSortBy] = useState<'default' | 'oldest' | 'top_selling' | 'popular'>('default');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Temp filter states for the drawer
  const [tempSortBy, setTempSortBy] = useState<'default' | 'oldest' | 'top_selling' | 'popular'>('default');
  const [tempSelectedBrands, setTempSelectedBrands] = useState<string[]>([]);
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([]);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Cart & checkout states
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_cart');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((item: any) => {
            const id = item.variantId || item.item?.id || parseInt(item.id);
            const optionsStr = [item.selectedSize, item.selectedColor].filter(Boolean).join(', ');
            const name = optionsStr ? `${item.item?.name || item.item?.title || 'Item'} (${optionsStr})` : (item.item?.name || item.item?.title || 'Item');
            return {
              id,
              name,
              price: parseFloat(item.item?.price || item.item?.unit_price || '0') || 0,
              quantity: item.qty,
              image: item.selectedImage || item.item?.image || item.item?.image_url,
              sku: item.item?.sku || `SKU-${id}`,
              selectedOptions: {
                Size: item.selectedSize,
                Color: item.selectedColor
              }
            };
          });
        } catch (e) {
          console.warn('Failed to parse initial aura_cart in POS', e);
        }
      }
    }
    return [];
  });
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 0, name: 'Walk In Customer', phone: '', email: '', user_id: null, created_at: '', updated_at: '', deleted_at: null, address: null, city: null, created_by: null }
  ]);
  const [customerName, setCustomerName] = useState('Walk In Customer');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<any>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Held orders states
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  // Receipt modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Place Order Modal
  const [isPlaceOrderOpen, setIsPlaceOrderOpen] = useState(false);

  // Create Customer Modal
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);

  // KHQR Payment Popup Modal
  const [isKhqrOpen, setIsKhqrOpen] = useState(false);
  const [pendingOrderDetails, setPendingOrderDetails] = useState<any>(null);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<string>('aba');

  // Fetch customers from backend API
  const fetchCustomers = async () => {
    try {
      const data = await customersService.getCustomers(0, 500);
      if (Array.isArray(data)) {
        setCustomers([
          { id: 0, name: 'Walk In Customer', phone: '', email: '', user_id: null, created_at: '', updated_at: '', deleted_at: null, address: null, city: null, created_by: null },
          ...data
        ]);
      }
    } catch (err) {
      console.warn('Failed to fetch customers list for POS select menu.', err);
    }
  };

  // Filtered customers based on search query (name or phone)
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = customerSearchQuery.toLowerCase().trim();
      if (!q) return true;
      const matchesName = c.name?.toLowerCase().includes(q);
      const matchesPhone = c.phone?.toLowerCase().includes(q);
      return matchesName || matchesPhone;
    });
  }, [customers, customerSearchQuery]);

  // Click outside to close customer dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = () => {
      setIsDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Discount states
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [extraDiscount, setExtraDiscount] = useState(0);

  // Dynamic Tax Percentage State
  const [taxPercentage, setTaxPercentage] = useState<number>(() => {
    const settings = Store_setting();
    if (settings && settings.tax_percentage !== undefined && settings.tax_percentage !== null) {
      const parsed = parseFloat(settings.tax_percentage);
      if (!isNaN(parsed)) return parsed;
    }
    return 10; // Default fallback to 10%
  });

  // Keep tax percentage synchronized when settings change
  useEffect(() => {
    const syncTaxRate = () => {
      const settings = Store_setting();
      if (settings && settings.tax_percentage !== undefined && settings.tax_percentage !== null) {
        const parsed = parseFloat(settings.tax_percentage);
        if (!isNaN(parsed)) {
          setTaxPercentage(parsed);
        }
      }
    };
    window.addEventListener('settings_updated', syncTaxRate);
    return () => {
      window.removeEventListener('settings_updated', syncTaxRate);
    };
  }, []);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch real store products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = ownerId !== undefined
        ? `/products?limit=200&created_by=${ownerId}`
        : '/products?limit=200';
      const response = await client.get<any[]>(url);

      if (Array.isArray(response) && response.length > 0) {
        // Map real product model fields to POS standard fields
        const mapped = response.map((item: any) => ({
          id: item.id,
          name: item.name || item.title || 'Unnamed Item',
          price: Number(item.price || item.unit_price || 0),
          category: item.category?.name || 'Main',
          stock: item.variants && item.variants.length > 0
            ? item.variants.reduce((sum: number, v: any) => sum + (Number(v.stock_qty) || 0), 0)
            : (item.stock_quantity ?? item.quantity ?? 0),
          image: item.image || item.image_url || undefined,
          type: item.type || 'physical',
          sku: item.sku || `SKU-${item.id}`,
          brand: item.brand?.name || item.brand || 'No Brand',
          variants: item.variants || [],
          images: item.images || [],
        }));
        setProducts(mapped);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn('Failed to load store products for POS.', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [ownerId]);

  // 1. Listen for storefront cart changes and sync them to POS state in real-time
  useEffect(() => {
    const handleCartSync = () => {
      try {
        const saved = localStorage.getItem('aura_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          const mapped = parsed.map((item: any) => {
            const id = item.variantId || item.item?.id || parseInt(item.id);
            const optionsStr = [item.selectedSize, item.selectedColor].filter(Boolean).join(', ');
            const name = optionsStr ? `${item.item?.name || item.item?.title || 'Item'} (${optionsStr})` : (item.item?.name || item.item?.title || 'Item');
            return {
              id,
              name,
              price: parseFloat(item.item?.price || item.item?.unit_price || '0') || 0,
              quantity: item.qty,
              image: item.selectedImage || item.item?.image || item.item?.image_url,
              sku: item.item?.sku || `SKU-${id}`,
              selectedOptions: {
                Size: item.selectedSize,
                Color: item.selectedColor
              }
            };
          });

          setCart(currentCart => {
            const isSame = currentCart.length === mapped.length && currentCart.every((itemA, index) => {
              const itemB = mapped[index];
              if (!itemB) return false;
              return (
                itemA.id === itemB.id &&
                itemA.name === itemB.name &&
                itemA.price === itemB.price &&
                itemA.quantity === itemB.quantity &&
                itemA.image === itemB.image &&
                itemA.sku === itemB.sku &&
                itemA.selectedOptions?.Size === itemB.selectedOptions?.Size &&
                itemA.selectedOptions?.Color === itemB.selectedOptions?.Color
              );
            });
            return isSame ? currentCart : mapped;
          });
        } else {
          setCart(currentCart => {
            if (currentCart.length > 0) {
              return [];
            }
            return currentCart;
          });
        }
      } catch (err) {
        console.warn('Failed to sync aura_cart in POS', err);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'aura_cart') {
        handleCartSync();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('aura_cart_updated', handleCartSync);

    // Initial sync
    handleCartSync();

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('aura_cart_updated', handleCartSync);
    };
  }, []);

  // 2. Sync POS cart state modifications back to storefront aura_cart in localStorage
  useEffect(() => {
    if (products.length === 0) return; // Wait until catalog products are loaded so we can resolve details

    try {
      const storefrontCart = cart.map(posItem => {
        // Find the product in products list (catalog)
        const product = products.find(p => {
          if (p.id === posItem.id) return true;
          if (p.variants && p.variants.some((v: any) => v.id === posItem.id)) return true;
          return false;
        });

        const isVariant = product && product.variants && product.variants.some((v: any) => v.id === posItem.id);
        const variant = isVariant ? product.variants.find((v: any) => v.id === posItem.id) : null;

        const productId = product ? product.id : posItem.id;
        const variantId = variant ? variant.id : null;

        // Build the same format cartItemId:
        const sizeVal = posItem.selectedOptions?.Size || '';
        const colorVal = posItem.selectedOptions?.Color || '';
        const cartItemId = sizeVal || colorVal ? `${productId}-${sizeVal}-${colorVal}` : String(productId);

        return {
          id: cartItemId,
          qty: posItem.quantity,
          selectedSize: sizeVal || undefined,
          selectedColor: colorVal || undefined,
          selectedImage: posItem.image || (product ? product.image : undefined),
          variantId: variantId,
          item: {
            id: productId,
            name: product ? product.name : posItem.name,
            price: product ? String(product.price) : String(posItem.price),
            image: product ? product.image : posItem.image,
            sku: posItem.sku || (product ? product.sku : undefined),
            variants: product ? product.variants : undefined,
            ...product
          }
        };
      });

      const currentSavedStr = localStorage.getItem('aura_cart') || '[]';
      const newStr = JSON.stringify(storefrontCart);

      if (currentSavedStr !== newStr) {
        localStorage.setItem('aura_cart', newStr);
        // Dispatch event for other tabs / customer displays
        window.dispatchEvent(new CustomEvent('aura_cart_updated'));
      }
    } catch (err) {
      console.warn('Failed to sync POS modifications to aura_cart', err);
    }
  }, [cart, products]);

  // Extract categories dynamically (fallback to screenshot categories if none in database)
  const categoriesList = useMemo(() => {
    const unique = new Set(products.map(p => p.category).filter(Boolean));
    const extracted = Array.from(unique);
    if (extracted.length === 0) {
      return ['Digital Products', 'Automotive', 'Gifts & Crafts', 'Musical Instruments', 'Groceries & Dailies', 'Books & Stationery', 'Travel & Luggage'];
    }
    return extracted;
  }, [products]);

  // Extract brands dynamically (fallback to screenshot brands if none in database)
  const brands = useMemo(() => {
    const unique = new Set(products.map(p => p.brand).filter(Boolean));
    const extracted = Array.from(unique);
    if (extracted.length === 0) {
      return ['Keithston', 'Electrical Charge', 'Electronic Store', 'Global Tech', 'UrbanEdge', 'Cool Sneakers', 'Tech Connect', 'OTO Speedios'];
    }
    return extracted;
  }, [products]);

  // Filter products based on search, type, brand, and category lists
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = p.type === productType;
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      return matchesSearch && matchesType && matchesBrand && matchesCategory;
    });
  }, [products, searchQuery, productType, selectedBrands, selectedCategories]);

  // Sort products
  const sortedProducts = useMemo(() => {
    let list = [...filteredProducts];
    if (sortBy === 'oldest') {
      list.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'top_selling') {
      list.sort((a, b) => b.stock - a.stock);
    } else if (sortBy === 'popular') {
      list.sort((a, b) => b.name.length - a.name.length); // mock popular rating
    } else {
      // default: recent first
      list.sort((a, b) => b.id - a.id);
    }
    return list;
  }, [filteredProducts, sortBy]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage));
  }, [sortedProducts]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Add to Cart
  // const handleAddToCart = (product: any) => {
  //   setCart(prev => {
  //     const existing = prev.find(item => item.id === product.id);
  //     if (existing) {
  //       return prev.map(item =>
  //         item.id === product.id
  //           ? { ...item, quantity: item.quantity + 1 }
  //           : item
  //       );
  //     }
  //     return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }];
  //   });
  //   toast.success(`${product.name} added to cart`);
  // };

  // Adjust cart item quantity
  const handleUpdateQty = (itemId: number, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove item from cart
  const handleRemoveItem = (itemId: number) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Pricing calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const tax = useMemo(() => {
    const discounted = Math.max(0, subtotal - couponDiscount - extraDiscount);
    return discounted * (taxPercentage / 100);
  }, [subtotal, couponDiscount, extraDiscount, taxPercentage]);

  const total = useMemo(() => {
    const discounted = Math.max(0, subtotal - couponDiscount - extraDiscount);
    return discounted + tax;
  }, [subtotal, tax, couponDiscount, extraDiscount]);

  const changeAmount = useMemo(() => {
    return Math.max(0, Number(paidAmount || 0) - total);
  }, [paidAmount, total]);

  // Sync POS checkout state to localStorage for customer walk-in display
  useEffect(() => {
    const activeStep = isReceiptOpen
      ? 'completed'
      : (isPlaceOrderOpen || isKhqrOpen)
        ? 'checkout'
        : 'browsing';

    const payload = {
      activeStep,
      selectedPayment: pendingPaymentMethod || 'cash',
      totalAmount: total,
      subtotal,
      deliveryFee: 0,
      totalDiscount: couponDiscount + extraDiscount,
      isKHQROpen: isKhqrOpen,
      pendingOrderId: pendingOrderDetails?.id || null,
      pendingOrderNo: pendingOrderDetails?.order_no || null,
      currency: 'USD',
    };
    localStorage.setItem('walkin_checkout_state', JSON.stringify(payload));
  }, [isReceiptOpen, isPlaceOrderOpen, isKhqrOpen, pendingPaymentMethod, total, subtotal, couponDiscount, extraDiscount, pendingOrderDetails]);

  // Selected options state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Reset/Initialize options when product detail modal opens
  useEffect(() => {
    if (selectedDetailProduct && selectedDetailProduct.variants && selectedDetailProduct.variants.length > 0) {
      const initial: Record<string, string> = {};
      selectedDetailProduct.variants.forEach((v: any) => {
        v.attribute_values?.forEach((av: any) => {
          const name = av.attribute?.name;
          const val = av.value?.split('|')[0] || '';
          if (name && !initial[name]) {
            initial[name] = val;
          }
        });
      });
      setSelectedOptions(initial);
    } else {
      setSelectedOptions({});
    }
  }, [selectedDetailProduct]);

  // Extract unique colors/sizes/options from variants
  const productOptions = useMemo(() => {
    if (!selectedDetailProduct || !selectedDetailProduct.variants || selectedDetailProduct.variants.length === 0) {
      return {};
    }
    const options: Record<string, string[]> = {};
    selectedDetailProduct.variants.forEach((v: any) => {
      v.attribute_values?.forEach((av: any) => {
        const name = av.attribute?.name || 'Option';
        const val = av.value?.split('|')[0] || '';
        if (val) {
          if (!options[name]) {
            options[name] = [];
          }
          if (!options[name].includes(val)) {
            options[name].push(val);
          }
        }
      });
    });
    return options;
  }, [selectedDetailProduct]);

  // Find active variant matching chosen selections
  const activeVariant = useMemo(() => {
    if (!selectedDetailProduct || !selectedDetailProduct.variants || selectedDetailProduct.variants.length === 0) {
      return null;
    }
    return selectedDetailProduct.variants.find((v: any) => {
      return Object.entries(selectedOptions).every(([name, value]) => {
        return v.attribute_values?.some((av: any) => {
          const avName = av.attribute?.name || '';
          const avVal = av.value?.split('|')[0] || '';
          return avName.toLowerCase() === name.toLowerCase() && avVal === value;
        });
      });
    });
  }, [selectedDetailProduct, selectedOptions]);

  // gallery images list:
  const galleryImages = useMemo(() => {
    if (!selectedDetailProduct) return [];
    const imgs: string[] = [];
    if (selectedDetailProduct.image) {
      imgs.push(selectedDetailProduct.image);
    }
    if (Array.isArray(selectedDetailProduct.images)) {
      selectedDetailProduct.images.forEach((img: any) => {
        const url = img?.image || img;
        if (url && url !== selectedDetailProduct.image) {
          imgs.push(url);
        }
      });
    }
    return imgs;
  }, [selectedDetailProduct]);

  // Get active image URL (variant specific or gallery browser)
  const activeImageUrl = useMemo(() => {
    if (!selectedDetailProduct) return '';
    if (activeVariant && Array.isArray(selectedDetailProduct.images)) {
      const varImgObj = selectedDetailProduct.images.find((img: any) => img.product_variant_id === activeVariant.id);
      if (varImgObj?.image) {
        return varImgObj.image;
      }
    }
    return galleryImages[activeImageIndex] || selectedDetailProduct.image || '';
  }, [selectedDetailProduct, activeVariant, galleryImages, activeImageIndex]);

  // Handle Checkout Click - Opens Place Order Popup modal
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your POS checkout cart is empty!');
      return;
    }
    setIsPlaceOrderOpen(true);
  };

  // Callback from ModelPlaceOrder after payment confirmation
  const handlePlaceOrderConfirm = async (chosenPaymentMethod: string, finalPaidAmount: number) => {
    setIsSavingOrder(true);
    let orderPayload: any = null;
    try {
      const resolvedStoreId = storeId || Store_setting()?.id || 1;
      const orderItems = cart.map(posItem => {
        const product = products.find(p => {
          if (p.id === posItem.id) return true;
          if (p.variants && p.variants.some((v: any) => v.id === posItem.id)) return true;
          return false;
        });

        const isVariant = product && product.variants && product.variants.some((v: any) => v.id === posItem.id);
        const variant = isVariant ? product.variants.find((v: any) => v.id === posItem.id) : null;

        return {
          menu_item_id: product ? product.id : posItem.id,
          product_variant_id: variant ? variant.id : null,
          quantity: posItem.quantity,
          price: posItem.price
        };
      });

      orderPayload = {
        store_id: Number(resolvedStoreId),
        total_amount: total,
        customer_name: customerName || 'Walk In Customer',
        customer_phone: '',
        customer_address: '',
        payment_method: chosenPaymentMethod,
        items: orderItems,
        subtotal: subtotal,
        discount_amount: couponDiscount + extraDiscount,
        delivery_fee: 0,
        order_type: 'walk_in',
      };

      const isGateway = chosenPaymentMethod !== 'cash' && chosenPaymentMethod !== 'card';

      if (isGateway) {
        const virtualOrderId = 'POS-' + Math.floor(100000 + Math.random() * 900000);
        const receiptData = {
          orderId: virtualOrderId,
          customer: customerName,
          items: [...cart],
          subtotal,
          tax,
          taxPercentage,
          total,
          couponDiscount,
          extraDiscount,
          paymentMethod: chosenPaymentMethod,
          date: new Date().toLocaleString(),
        };

        setPendingOrderDetails({
          id: virtualOrderId,
          order_no: virtualOrderId,
          amount: total,
          receiptData: receiptData,
          orderPayload: orderPayload
        });
        setPendingPaymentMethod(chosenPaymentMethod);
        setIsPlaceOrderOpen(false);
        setIsKhqrOpen(true);
      } else {
        const createdOrder = await ordersService.createOrder(orderPayload);
        const orderId = createdOrder.order_no;

        const receiptData = {
          orderId,
          customer: customerName,
          items: [...cart],
          subtotal,
          tax,
          taxPercentage,
          total,
          couponDiscount,
          extraDiscount,
          paymentMethod: chosenPaymentMethod,
          date: new Date().toLocaleString(),
        };

        setActiveReceipt(receiptData);
        setIsReceiptOpen(true);
        setIsPlaceOrderOpen(false);
        toast.success(`Transaction placed successfully and saved! Order No: ${orderId}`);
        setCart([]); // Reset Cart
        setPaidAmount('');
      }
    } catch (err: any) {
      console.error('Failed to save POS order to database:', err);
      toast.error(err?.message || 'Failed to save order to database. Placing in-memory transaction.');

      // Fallback: place in-memory if DB call fails so cashier can still print receipt
      const fallbackOrderId = 'POS-' + Math.floor(100000 + Math.random() * 900000);
      const receiptData = {
        orderId: fallbackOrderId,
        customer: customerName,
        items: [...cart],
        subtotal,
        tax,
        taxPercentage,
        total,
        couponDiscount,
        extraDiscount,
        paymentMethod: chosenPaymentMethod,
        date: new Date().toLocaleString(),
      };

      const isGateway = chosenPaymentMethod !== 'cash' && chosenPaymentMethod !== 'card';
      if (isGateway) {
        setPendingOrderDetails({
          id: fallbackOrderId,
          order_no: fallbackOrderId,
          amount: total,
          receiptData: receiptData,
          orderPayload: orderPayload
        });
        setPendingPaymentMethod(chosenPaymentMethod);
        setIsPlaceOrderOpen(false);
        setIsKhqrOpen(true);
      } else {
        setActiveReceipt(receiptData);
        setIsReceiptOpen(true);
        setIsPlaceOrderOpen(false);
        setCart([]);
        setPaidAmount('');
      }
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleKhqrPaymentSuccess = async () => {
    if (pendingOrderDetails) {
      setIsSavingOrder(true);
      try {
        const finalPayload = {
          ...pendingOrderDetails.orderPayload,
          payment_status: 'Paid',
        };
        const createdOrder = await ordersService.createOrder(finalPayload);
        const orderId = createdOrder.order_no;

        const updatedReceipt = {
          ...pendingOrderDetails.receiptData,
          orderId: orderId,
        };

        setActiveReceipt(updatedReceipt);
        setIsReceiptOpen(true);
        toast.success(`Transaction placed successfully and saved! Order No: ${orderId}`);
      } catch (err: any) {
        console.error('Failed to save POS order to database after payment:', err);
        setActiveReceipt(pendingOrderDetails.receiptData);
        setIsReceiptOpen(true);
        toast.error('Payment succeeded but failed to save order to database. Showing temporary receipt.');
      } finally {
        setIsSavingOrder(false);
      }
    }
    setIsKhqrOpen(false);
    setCart([]); // Reset Cart
    setPaidAmount('');
    setPendingOrderDetails(null);
  };

  // Hold active order
  const handleHoldOrder = () => {
    if (cart.length === 0) {
      toast.error('Cannot hold an empty cart!');
      return;
    }
    const holdId = 'HOLD-' + Math.floor(1000 + Math.random() * 9000);
    const newHold: HeldOrder = {
      id: holdId,
      customerName,
      items: [...cart],
      subtotal,
      tax,
      taxPercentage,
      total,
      couponDiscount,
      extraDiscount,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHeldOrders(prev => [...prev, newHold]);
    setCart([]);
    setPaidAmount('');
    toast.success(`Order ${holdId} put on hold.`);
  };

  const handleEditCouponDiscount = () => {
    const val = prompt('Enter coupon discount amount ($):', couponDiscount.toString());
    if (val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) {
        setCouponDiscount(num);
      } else {
        toast.error('Please enter a valid positive number');
      }
    }
  };

  const handleEditExtraDiscount = () => {
    const val = prompt('Enter extra discount amount ($):', extraDiscount.toString());
    if (val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) {
        setExtraDiscount(num);
      } else {
        toast.error('Please enter a valid positive number');
      }
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 animate-fade-in font-sans">

        {/* ── Left Side: Products Catalog ──────────────────────── */}
        <div className="flex-1 flex flex-col border rounded-[5px] p-5 overflow-hidden custom-card-container">

          {/* Top Controls: Search, Filter, and Reload */}
          <div className="flex items-center gap-4 mb-4 shrink-0">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or sku"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/[0.03] border rounded-[8px] text-xs font-semibold outline-none focus:border-primary transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Filter Button */}
            <div>
              <button
                onClick={() => {
                  setTempSortBy(sortBy);
                  setTempSelectedBrands(selectedBrands);
                  setTempSelectedCategories(selectedCategories);
                  setIsFilterDropdownOpen(true);
                }}
                className="px-4 py-2.5 text-xs font-bold rounded-[8px] bg-black/[0.03] hover:bg-black/[0.06] border text-inherit flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FiFilter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
            </div>

            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-2.5 rounded-[8px] bg-black/[0.03] hover:bg-black/[0.06] border text-inherit cursor-pointer transition-colors"
              title="Refresh Menu Items"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Product Type Tabs */}
          <div className="flex border-b mb-4 shrink-0">
            <button
              onClick={() => { setProductType('physical'); setCurrentPage(1); }}
              className={`pb-2 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${productType === 'physical'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-450 hover:text-inherit'
                }`}
            >
              Physical Products
            </button>
            <button
              onClick={() => { setProductType('digital'); setCurrentPage(1); }}
              className={`pb-2 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${productType === 'digital'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-450 hover:text-inherit'
                }`}
            >
              Digital Products
            </button>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-[5px] animate-spin" />
                  <p className="text-xs font-bold text-slate-400">Loading catalog...</p>
                </div>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <FiShoppingBag className="w-10 h-10 opacity-40 text-slate-500" />
                <p className="text-xs font-bold">No items match your search filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 pb-4">
                {paginatedProducts.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setSelectedDetailProduct(prod);
                      setDetailQty(1);
                      setActiveImageIndex(0);
                    }}
                    className="border rounded-[5px] p-2 flex flex-col justify-between hover:shadow-md transition-all group duration-200 text-center relative overflow-hidden cursor-pointer custom-card-container"
                  >
                    <div className="space-y-1">
                      {/* Thumbnail Image */}
                      <div className="aspect-square w-full rounded-[5px] bg-black/[0.02] overflow-hidden relative border flex items-center justify-center mb-1">
                        {prod.image ? (
                          <img
                            src={prod.image.startsWith('http') ? prod.image : resolveImageUrl(prod.image)}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 font-extrabold text-2xl bg-black/[0.03]">
                            📦
                          </div>
                        )}

                        {/* Dark overlay showing stock on hover */}
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white p-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold">Total stock</span>
                          <span className="text-sm font-bold mt-0.5">{prod.stock}</span>
                        </div>
                      </div>

                      <h4 className="text-[11px] font-semibold text-slate-700 line-clamp-2 leading-tight text-center px-1 min-h-[28px] flex items-center justify-center">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="mt-1 text-center">
                      <span className="text-xs font-bold text-primary">
                        ${prod.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-[5px] border border-slate-200/60 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-[5px] text-xs font-bold border transition-colors cursor-pointer ${currentPage === page
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-white border-slate-200/60 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-[5px] border bg-transparent text-inherit hover:bg-black/[0.04] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

        {/* ── Right Side: Active Checkout Cart ───────────────────── */}
        <div className="w-full lg:w-[380px] border rounded-[5px] p-5 flex flex-col overflow-hidden shrink-0 custom-card-container">

          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b mb-4 shrink-0">
            <h3 className="text-sm font-bold">Billing Section</h3>
            <button
              onClick={() => setIsHoldModalOpen(true)}
              className="px-3 py-1.5 rounded-[5px] border text-inherit hover:bg-black/[0.04] text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 bg-transparent"
            >
              <span>View All Hold Orders</span>
              {heldOrders.length > 0 && (
                <span className="w-4 h-4 rounded-[5px] bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {heldOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Searchable Customer Dropdown */}
          <div className="relative mb-4 shrink-0" onClick={e => e.stopPropagation()}>
            {/* Selector Button */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-3.5 py-2.5 bg-black/[0.03] border rounded-[5px] text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer flex justify-between items-center select-none"
            >
              <span>{customerName}</span>
              <FiChevronDown className="text-slate-400 w-4 h-4" />
            </div>

            {/* Dropdown panel */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 border rounded-[5px] shadow-lg z-[999] p-2 flex flex-col gap-2 animate-fade-in animate-duration-150 custom-card-container">

                {/* Search input inside dropdown */}
                <div className="relative shrink-0">
                  <input
                    type="text"
                    placeholder="Search name or phone..."
                    value={customerSearchQuery}
                    onChange={e => setCustomerSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-black/[0.03] border rounded-[5px] text-xs font-semibold outline-none focus:border-primary transition-all"
                    autoFocus
                    onClick={e => e.stopPropagation()} // Prevent closing dropdown on input click
                  />
                </div>

                {/* Scrollable list with limit of 5 items visible before scrolling */}
                <div className="overflow-y-auto max-h-[165px] custom-scrollbar divide-y border-t mt-1">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-4 text-[11px] font-bold">
                      No customers found
                    </div>
                  ) : (
                    filteredCustomers.map(c => (
                      <div
                        key={c.id || c.name}
                        onClick={() => {
                          setCustomerName(c.name);
                          setIsDropdownOpen(false);
                          setCustomerSearchQuery('');
                        }}
                        className="px-3 py-2 hover:bg-black/[0.04] text-xs cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div className="font-bold truncate">{c.name}</div>
                        {c.phone && (
                          <div className="text-[10px] opacity-60 font-semibold">{c.phone}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* "+ Add New Customer" Action Button */}
                <div
                  onClick={() => {
                    setIsCreateCustomerOpen(true);
                    setIsDropdownOpen(false);
                    setCustomerSearchQuery('');
                  }}
                  className="border-t border-slate-100 pt-1 text-center"
                >
                  <button
                    type="button"
                    className="w-full py-2 hover:bg-primary/5 text-primary rounded-[5px] text-xs font-black transition-colors cursor-pointer border-none bg-transparent"
                  >
                    + Add New Customer
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Cart Item List Section Header */}
          <div className="bg-black/[0.04] border border-black/5 px-4 py-2 rounded-[5px] text-xs font-bold mb-2 shrink-0">
            Cart Item List
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mb-4 border-b border-slate-100 py-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <span className="text-3xl opacity-40">🛒</span>
                <p className="text-[11px] font-bold">Point of sale cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-black/[0.015] p-2 rounded-[5px] border">
                    {/* Photo Thumbnail */}
                    <div className="w-10 h-10 rounded-[5px] bg-black/[0.03] overflow-hidden shrink-0 border">
                      {item.image ? (
                        <img
                          src={item.image.startsWith('http') ? item.image : resolveImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-black/[0.02] font-bold text-base">
                          🍔
                        </div>
                      )}
                    </div>

                    {/* Title & Price info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[11px] font-bold truncate leading-tight">{item.name}</h5>
                      <p className="text-[10px] opacity-60 font-bold mt-0.5">${item.price.toFixed(2)} each</p>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-black/[0.02] border rounded-[5px] overflow-hidden">
                        <button
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="p-1 hover:bg-black/[0.04] text-slate-500 border-none cursor-pointer bg-transparent"
                        >
                          <FiMinus className="w-2.5 h-2.5" />
                        </button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="p-1 hover:bg-black/[0.04] text-slate-500 border-none cursor-pointer bg-transparent"
                        >
                          <FiPlus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[5px] transition-colors border-none bg-transparent cursor-pointer"
                        title="Delete Item"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Summary Section Header */}
          <div className="bg-black/[0.04] border border-black/5 px-4 py-2 rounded-[5px] text-xs font-bold mb-3 shrink-0">
            Billing Summary
          </div>

          {/* Invoice Summary */}
          <div className="space-y-2.5 border-b pb-4 mb-4 text-xs font-semibold shrink-0">
            <div className="flex justify-between">
              <span>Sub Total :</span>
              <span className="font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Product Discount :</span>
              <span className="font-bold">$0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span>Coupon Discount :</span>
                <button
                  onClick={handleEditCouponDiscount}
                  className="opacity-60 hover:opacity-100 transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center text-inherit"
                  title="Edit Discount"
                >
                  <FiEdit2 className="w-3 h-3" />
                </button>
              </span>
              <span className="font-bold">${couponDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span>Extra Discount :</span>
                <button
                  onClick={handleEditExtraDiscount}
                  className="opacity-60 hover:opacity-100 transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center text-inherit"
                  title="Edit Discount"
                >
                  <FiEdit2 className="w-3 h-3" />
                </button>
              </span>
              <span className="font-bold">${extraDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT/TAX ({taxPercentage}%):</span>
              <span className="font-bold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1 border-t">
              <span>Total :</span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </div>
          </div>



          {/* Footer Action Buttons */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <button
              onClick={() => {
                setCart([]);
                setPaidAmount('');
                setCouponDiscount(0);
                setExtraDiscount(0);
                toast.success('Cart cleared!');
              }}
              className="py-2.5 border border-rose-200/50 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 rounded-[5px] font-bold text-[11px] transition-all cursor-pointer text-center"
            >
              Clear Cart
            </button>

            <button
              onClick={handleHoldOrder}
              className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-[5px] font-bold text-[11px] transition-all cursor-pointer text-center border-none"
            >
              Hold
            </button>

            <button
              onClick={handleCheckout}
              disabled={isSavingOrder}
              className={`py-2.5 rounded-[5px] font-bold text-[11px] transition-all text-center border-none shadow-md shadow-orange-500/10 active:scale-95 duration-100 flex items-center justify-center gap-1.5 cursor-pointer ${isSavingOrder
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-hover text-white'
                }`}
            >
              {isSavingOrder && <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />}
              <span>{isSavingOrder ? 'Saving...' : 'Place Order'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── Hold Orders Modal popup ─────────────────────────── */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in p-4 bg-slate-900/40 ">
          <div className="bg-white rounded-[14px] border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
              <h4 className="text-sm font-black text-slate-800">Held Orders ({heldOrders.length})</h4>
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="p-1 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer bg-transparent"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-3 custom-scrollbar text-xs">
              {heldOrders.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <span className="text-2xl">📥</span>
                  <p className="font-semibold mt-2">No held orders available.</p>
                </div>
              ) : (
                heldOrders.map(order => (
                  <div key={order.id} className="p-3 border border-slate-200/80 rounded-[8px] bg-slate-50/50 flex flex-col gap-2">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-primary">{order.id}</span>
                      <span className="text-slate-400">{order.date}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p><strong>Customer:</strong> {order.customerName}</p>
                      <p><strong>Items:</strong> {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                      <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2 mt-1 shrink-0">
                      <button
                        onClick={() => {
                          setCart(order.items);
                          setCustomerName(order.customerName);
                          setCouponDiscount(order.couponDiscount);
                          setExtraDiscount(order.extraDiscount);
                          setHeldOrders(prev => prev.filter(o => o.id !== order.id));
                          setIsHoldModalOpen(false);
                          toast.success(`Restored order ${order.id}`);
                        }}
                        className="flex-1 bg-primary text-white py-1.5 rounded-[5px] text-[10px] font-bold border-none cursor-pointer"
                      >
                        Restore Cart
                      </button>
                      <button
                        onClick={() => {
                          setHeldOrders(prev => prev.filter(o => o.id !== order.id));
                          toast.success(`Deleted held order ${order.id}`);
                        }}
                        className="px-3 bg-rose-50 text-rose-600 border border-rose-200 py-1.5 rounded-[5px] text-[10px] font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout Receipt Modal popup ────────────────────────── */}
      {isReceiptOpen && activeReceipt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center  animate-fade-in p-4">
          <div className="bg-white rounded-[14px] border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50/80 to-white">
              <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <FiPrinter className="text-primary w-4 h-4" /> Transaction Invoice
              </h4>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="p-1 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer bg-transparent"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-slate-700 font-mono text-[11px] leading-tight custom-scrollbar">

              <div className="text-center space-y-1">
                <h2 className="text-sm font-black tracking-tight text-slate-800">VH OUTLET</h2>
                <p className="text-slate-400">Order Invoice Summary</p>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-slate-500 font-bold">
                <div className="flex justify-between">
                  <span>INVOICE:</span>
                  <span className="text-slate-800">{activeReceipt.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="text-slate-800">{activeReceipt.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span>PAY METHOD:</span>
                  <span className="text-slate-800 uppercase">{activeReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span className="text-slate-800">{activeReceipt.date}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-slate-200 py-3 space-y-2">
                <div className="flex justify-between text-slate-800 font-black">
                  <span>ITEM</span>
                  <span className="w-16 text-right">PRICE</span>
                </div>
                {activeReceipt.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-slate-600 font-semibold">
                    <span>{item.name} (x{item.quantity})</span>
                    <span className="w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 pt-1 font-bold text-slate-500">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span className="text-slate-800">${activeReceipt.subtotal.toFixed(2)}</span>
                </div>
                {activeReceipt.couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span>COUPON DISCOUNT:</span>
                    <span className="text-slate-800">-${activeReceipt.couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {activeReceipt.extraDiscount > 0 && (
                  <div className="flex justify-between">
                    <span>EXTRA DISCOUNT:</span>
                    <span className="text-slate-800">-${activeReceipt.extraDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT TAX ({activeReceipt.taxPercentage !== undefined ? activeReceipt.taxPercentage : 10}%):</span>
                  <span className="text-slate-800">${activeReceipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-black text-sm pt-2 border-t border-slate-100">
                  <span>TOTAL AMOUNT:</span>
                  <span className="text-primary">${activeReceipt.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-slate-400 text-[10px] pt-4 leading-relaxed font-semibold">
                Thank you for ordering with us!<br />
                Software powered by BiteFlow POS System.
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => { window.print(); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-[8px] font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95 duration-100"
              >
                <FiPrinter className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-[8px] font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Close Invoice</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Product Detail Modal popup ───────────────────────── */}
      {selectedDetailProduct && (() => {
        const displaySku = activeVariant?.variant_sku || selectedDetailProduct.sku || `PROD-${selectedDetailProduct.id}`;
        const displayPrice = activeVariant ? Number(activeVariant.retail_price) : selectedDetailProduct.price || 0;
        const displayStock = activeVariant ? activeVariant.stock_qty : selectedDetailProduct.stock ?? 0;

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in p-4 bg-slate-900/40 ">
            <div className="bg-white rounded-[5px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col p-6 relative">

              {/* Close Button */}
              <button
                onClick={() => setSelectedDetailProduct(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-500 border-none cursor-pointer transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>

              {/* Main Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Side: Images & Info */}
                <div className="space-y-4">
                  {/* Main Image Box */}
                  <div className="aspect-square w-full rounded-[12px] border border-slate-200 bg-slate-50 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-[5px] border border-slate-100 bg-white flex items-center justify-center text-slate-500 shadow-sm">
                      <span className="text-xs">📦</span>
                    </div>

                    {activeImageUrl ? (
                      <img
                        src={activeImageUrl.startsWith('http') ? activeImageUrl : resolveImageUrl(activeImageUrl)}
                        alt={selectedDetailProduct.name}
                        className="w-full h-full object-cover animate-fade-in"
                      />
                    ) : (
                      <div className="text-slate-300 font-extrabold text-5xl">📦</div>
                    )}
                  </div>

                  {/* Thumbnails list */}
                  {galleryImages.length > 1 && (
                    <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                      {galleryImages.map((imgUrl, idx) => {
                        const isSelected = idx === activeImageIndex;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-12 h-12 rounded-[5px] border-2 overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer transition-all shrink-0 ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            <img
                              src={imgUrl.startsWith('http') ? imgUrl : resolveImageUrl(imgUrl)}
                              alt={`thumb-${idx}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="text-xs text-slate-500 pt-2 space-y-1.5">
                    <p className="font-semibold text-slate-800">
                      SKU: <span className="font-normal text-slate-500">{displaySku}</span>
                    </p>
                    <p className="font-semibold text-slate-800">
                      Categories: <span className="font-normal text-slate-500">{selectedDetailProduct.category || 'Main'}</span>
                    </p>
                    <p className="font-semibold text-slate-800">
                      Brand: <span className="font-normal text-slate-500">{selectedDetailProduct.brand || 'No Brand'}</span>
                    </p>
                  </div>
                </div>

                {/* Right Side: Details & Add to Cart */}
                <div className="flex flex-col justify-between pt-2">

                  <div className="space-y-4">
                    {/* Stock Badge */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">Stock : <strong className="text-slate-800 font-bold">{displayStock}</strong></span>
                      {displayStock > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-50 text-emerald-600">
                          In stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-rose-50 text-rose-600">
                          Out of stock
                        </span>
                      )}
                    </div>

                    {/* Product Title */}
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">
                      {selectedDetailProduct.name}
                    </h3>

                    {/* Price */}
                    <div className="text-3xl font-extrabold text-primary">
                      ${displayPrice.toFixed(2)}
                    </div>

                    {/* Attribute Selectors (Color, Size, etc.) */}
                    {Object.keys(productOptions).length > 0 && (
                      <div className="space-y-3 pt-1 border-t border-slate-100 pb-2">
                        {Object.entries(productOptions).map(([optionName, optionValues]) => (
                          <div key={optionName} className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{optionName}</span>
                            <div className="flex flex-wrap gap-2">
                              {optionValues.map(val => {
                                const isSelected = selectedOptions[optionName] === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => setSelectedOptions(prev => ({ ...prev, [optionName]: val }))}
                                    className={`px-3 py-1.5 rounded-[5px] text-xs font-bold border cursor-pointer transition-all ${isSelected
                                      ? 'bg-primary border-primary text-white shadow-sm'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                      }`}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-xs font-semibold text-slate-500">Qty</span>

                      <div className="flex items-center bg-white border border-slate-200 rounded-[5px] overflow-hidden">
                        <button
                          onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1 text-slate-500 border-none cursor-pointer bg-transparent"
                        >
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span className="px-4 text-sm font-bold text-slate-800">{detailQty}</span>
                        <button
                          onClick={() => setDetailQty(prev => prev + 1)}
                          className="px-3 py-1 text-slate-500 border-none cursor-pointer bg-transparent"
                        >
                          <FiPlus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-slate-600 ml-2">
                        Total Price: <strong className="text-primary font-bold">${(displayPrice * detailQty).toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="pt-6">
                    <button
                      onClick={() => {
                        setCart(prev => {
                          const cartId = activeVariant ? activeVariant.id : selectedDetailProduct.id;
                          const itemName = activeVariant
                            ? `${selectedDetailProduct.name} (${Object.values(selectedOptions).join(', ')})`
                            : selectedDetailProduct.name;

                          const existing = prev.find(item => item.id === cartId);
                          if (existing) {
                            return prev.map(item =>
                              item.id === cartId
                                ? { ...item, quantity: item.quantity + detailQty }
                                : item
                            );
                          }
                          return [...prev, {
                            id: cartId,
                            name: itemName,
                            price: displayPrice,
                            quantity: detailQty,
                            image: activeImageUrl,
                            sku: displaySku,
                            selectedOptions: activeVariant ? selectedOptions : undefined
                          }];
                        });
                        toast.success(`${selectedDetailProduct.name} added to cart`);
                        setSelectedDetailProduct(null);
                      }}
                      className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-[8px] font-bold text-sm tracking-wide transition-all border-none cursor-pointer shadow-md shadow-orange-500/10 active:scale-95 duration-100"
                    >
                      Add to cart
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* ── Filter Drawer overlay ───────────────────────────── */}
      {isFilterDropdownOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in animate-duration-200">
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0"
            onClick={() => setIsFilterDropdownOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-slide-in-right z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50/80 to-white">
              <h4 className="text-sm font-black text-slate-800">Filter</h4>
              <button
                onClick={() => setIsFilterDropdownOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-500 border-none cursor-pointer transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">

              {/* Sorting Section */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sorting</h5>
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-[10px] p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">
                    <input
                      type="radio"
                      name="tempSortBy"
                      checked={tempSortBy === 'default'}
                      onChange={() => setTempSortBy('default')}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300 accent-primary"
                    />
                    <span>Default (Recent Created)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">
                    <input
                      type="radio"
                      name="tempSortBy"
                      checked={tempSortBy === 'oldest'}
                      onChange={() => setTempSortBy('oldest')}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300 accent-primary"
                    />
                    <span>Show Older First</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">
                    <input
                      type="radio"
                      name="tempSortBy"
                      checked={tempSortBy === 'top_selling'}
                      onChange={() => setTempSortBy('top_selling')}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300 accent-primary"
                    />
                    <span>Top Selling Products</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">
                    <input
                      type="radio"
                      name="tempSortBy"
                      checked={tempSortBy === 'popular'}
                      onChange={() => setTempSortBy('popular')}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300 accent-primary"
                    />
                    <span>Most Popular Products</span>
                  </label>
                </div>
              </div>

              {/* Brand Section */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Brand</h5>
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-[10px] p-4">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {(showAllBrands ? brands : brands.slice(0, 8)).map(brandName => {
                      const isChecked = tempSelectedBrands.includes(brandName);
                      return (
                        <label key={brandName} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setTempSelectedBrands(prev => prev.filter(b => b !== brandName));
                              } else {
                                setTempSelectedBrands(prev => [...prev, brandName]);
                              }
                            }}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 accent-primary"
                          />
                          <span className="truncate" title={brandName}>{brandName}</span>
                        </label>
                      );
                    })}
                  </div>
                  {brands.length > 8 && (
                    <div className="flex justify-center mt-3 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAllBrands(!showAllBrands)}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer bg-transparent border-none"
                      >
                        {showAllBrands ? 'See Less' : 'See More'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Section */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</h5>
                <div className="border border-slate-200/60 rounded-[10px] bg-slate-50/50 divide-y divide-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                  {categoriesList.map(cat => {
                    const isChecked = tempSelectedCategories.includes(cat);
                    return (
                      <label key={cat} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-100/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setTempSelectedCategories(prev => prev.filter(c => c !== cat));
                              } else {
                                setTempSelectedCategories(prev => [...prev, cat]);
                              }
                            }}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 accent-primary"
                          />
                          <span className="text-xs font-semibold text-slate-600">{cat}</span>
                        </div>
                        <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center gap-4 bg-white shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTempSortBy('default');
                  setTempSelectedBrands([]);
                  setTempSelectedCategories([]);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-[8px] font-bold text-xs transition-colors text-center cursor-pointer border-none"
              >
                Clear Filter
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy(tempSortBy);
                  setSelectedBrands(tempSelectedBrands);
                  setSelectedCategories(tempSelectedCategories);
                  setIsFilterDropdownOpen(false);
                  setCurrentPage(1);
                  toast.success('Filters applied successfully');
                }}
                className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-[8px] font-bold text-xs transition-all text-center cursor-pointer border-none shadow-md shadow-orange-500/10"
              >
                Apply
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Place Order Modal ────────────────────────────── */}
      <ModelPlaceOrder
        isOpen={isPlaceOrderOpen}
        onClose={() => setIsPlaceOrderOpen(false)}
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        taxPercentage={taxPercentage}
        total={total}
        couponDiscount={couponDiscount}
        extraDiscount={extraDiscount}
        customerName={customerName}
        isSaving={isSavingOrder}
        onConfirm={handlePlaceOrderConfirm}
      />

      {/* ── KHQR Payment Modal ───────────────────────────── */}
      <PopupPaymentKHQR
        isOpen={isKhqrOpen}
        onClose={() => setIsKhqrOpen(false)}
        onConfirmPayment={handleKhqrPaymentSuccess}
        amount={pendingOrderDetails?.amount || total}
        orderId={pendingOrderDetails?.id || null}
        paymentMethod={pendingPaymentMethod}
        merchantName={Store_setting()?.store_name || 'BiteFlow Store'}
        storeId={storeId || Store_setting()?.id}
      />

      {/* ── Create Customer Modal ────────────────────────── */}
      <ModelCreateCustomer
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onCreated={(newCustomer) => {
          setCustomers(prev => [...prev, newCustomer]);
          setCustomerName(newCustomer.name);
          setIsCreateCustomerOpen(false);
        }}
      />
    </>
  );
};

