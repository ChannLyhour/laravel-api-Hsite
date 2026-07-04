import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
    shippingAddressesService, 
    couponsService, 
    ordersService, 
    chatService,
    Store_setting,
    type ShippingAddress,
    type CouponRow
} from '@/api/owner/method';
import { useAuth } from './useAuth';
import { useOrderPending } from './useOrderPending';
import { validateCheckoutForm } from '../request/FormCheckOutRequets';
import { type CheckoutValidationError } from '../validation/CheckoutValidationError';
import { FASHION_ROUTES } from '../routes';
import { nullOrRequest } from '../nullOrRequest';

interface UseCheckoutProps {
    cartItems?: any[];
    propSubtotal?: number;
    propDeliveryFee?: number;
    propDiscount?: number;
    stores?: any;
    propCoupons?: CouponRow[];
    ownerUserId?: number | string;
    clearCart?: () => void;
    onNavigate?: (to: string) => void;
}

export const useCheckout = ({
    cartItems,
    propSubtotal,
    propDeliveryFee,
    propDiscount = 0,
    stores,
    propCoupons,
    ownerUserId,
    clearCart,
    onNavigate,
}: UseCheckoutProps) => {
    const { isLoggedIn, user } = useAuth(nullOrRequest(stores?.id));
    const { submitOrder, isSubmitting: isCheckingOut } = useOrderPending();

    // ─── Local State & Ref Variables ───
    const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [showAddressBook, setShowAddressBook] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);

    const [storeSettings, setStoreSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('store_settings');
            const parsed = saved ? JSON.parse(saved) : {};
            return { ...stores, ...parsed };
        } catch {
            return stores || {};
        }
    });

    useEffect(() => {
        if (stores) {
            try {
                const saved = localStorage.getItem('store_settings');
                const parsed = saved ? JSON.parse(saved) : {};
                setStoreSettings({ ...stores, ...parsed });
            } catch {
                setStoreSettings(stores);
            }
        }
    }, [stores]);

    const [selectedPayment, setSelectedPayment] = useState<string>('cod');
    const [preferredContact, setPreferredContact] = useState<string>('');
    const [contactInput, setContactInput] = useState<string>('');
    const [note, setNote] = useState<string>('');

    const [customCustomerName, setCustomCustomerName] = useState<string>('');
    const [customCustomerPhone, setCustomCustomerPhone] = useState<string>('');
    const [customCustomerAddress, setCustomCustomerAddress] = useState<string>('');
    const [customLatitude, setCustomLatitude] = useState<string>('');
    const [customLongitude, setCustomLongitude] = useState<string>('');

    useEffect(() => {
        if (user) {
            setCustomCustomerName(user.name || '');
            setCustomCustomerPhone(user.phone || '');
        }
    }, [user]);

    const [usePoints] = useState<boolean>(false);
    const [claimCode, setClaimCode] = useState<string>('');
    const [appliedCoupon, setAppliedCoupon] = useState<CouponRow | null>(null);
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [copiedCode, setCopiedCode] = useState<string>('');
    const [couponUseCounts, setCouponUseCounts] = useState<Record<string, number>>({});

    const [orderSuccess, setOrderSuccess] = useState(false);
    const [isKHQROpen, setIsKHQROpen] = useState(false);
    const [pendingOrderId, setPendingOrderId] = useState<number | string | null>(null);
    const [pendingOrderNo, setPendingOrderNo] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<CheckoutValidationError | null>(null);

    // Form element focus/scroll refs
    const addressBtnRef = useRef<HTMLButtonElement>(null);
    const preferredContactRef = useRef<HTMLButtonElement>(null);
    const contactInputRef = useRef<HTMLInputElement>(null);
    const paymentRef = useRef<HTMLInputElement>(null);
    
    const customNameRef = useRef<HTMLInputElement>(null);
    const customPhoneRef = useRef<HTMLInputElement>(null);
    const customAddressRef = useRef<HTMLInputElement>(null);

    // ─── Computed Values ───
    const displayCartItems = useMemo(() => {
        return cartItems && cartItems.length > 0
            ? cartItems.map(item => {
                return {
                    id: item.id || item.item?.id,
                    name: item.name || item.item?.name || 'Item Name',
                    code: item.code || item.item?.sku || item.item?.code || '22226022357',
                    variant: item.variant || [item.selectedSize, item.selectedColor].filter(Boolean).join(' / ') || 'Light Green Wash / 28',
                    qty: item.qty || 1,
                    price: parseFloat(item.price || item.item?.price || '0'),
                    image: item.selectedImage || item.item?.display_image || item.item?.image || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=400'
                };
            })
            : [];
    }, [cartItems]);

    const subtotal = useMemo(() => {
        return propSubtotal !== undefined
            ? propSubtotal
            : displayCartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    }, [propSubtotal, displayCartItems]);

    const couponDiscount = useMemo(() => {
        if (!appliedCoupon) return propDiscount || 0;

        const minPurchase = appliedCoupon.minimum_purchase ? parseFloat(String(appliedCoupon.minimum_purchase)) : 0;
        if (subtotal < minPurchase) return 0;
        if (appliedCoupon.coupon_type === 'free_delivery') return 0;

        const discAmt = parseFloat(String(appliedCoupon.discount_amount));
        if (appliedCoupon.discount_type === 'percentage') {
            return (subtotal * discAmt) / 100;
        }
        return Math.min(subtotal, discAmt);
    }, [appliedCoupon, subtotal, propDiscount]);

    const deliveryFee = useMemo(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const isLocal = queryParams.get('local') === 'true';
        if (isLocal) return 0;

        if (propDeliveryFee !== undefined) return propDeliveryFee;
        if (appliedCoupon?.coupon_type === 'free_delivery') {
            const minPurchase = appliedCoupon.minimum_purchase ? parseFloat(String(appliedCoupon.minimum_purchase)) : 0;
            if (subtotal >= minPurchase) return 0;
        }

        const localSettings = Store_setting();
        const activeSettings = { ...(stores || {}), ...(localSettings || {}) };

        let fee = 0;
        let threshold = 0;
        if (activeSettings) {
            if (activeSettings.shipping_fee !== undefined && activeSettings.shipping_fee !== null) {
                fee = parseFloat(String(activeSettings.shipping_fee)) || 0;
            }
            if (activeSettings.free_shipping_threshold !== undefined && activeSettings.free_shipping_threshold !== null) {
                threshold = parseFloat(String(activeSettings.free_shipping_threshold)) || 0;
            }
        }
        return (threshold > 0 && subtotal >= threshold) ? 0 : fee;
    }, [propDeliveryFee, stores, subtotal, appliedCoupon]);

    const totalDiscount = useMemo(() => {
        return couponDiscount + (usePoints ? 2.00 : 0);
    }, [couponDiscount, usePoints]);

    const totalAmount = useMemo(() => {
        return Math.max(0, subtotal + deliveryFee - totalDiscount);
    }, [subtotal, deliveryFee, totalDiscount]);

    const isGuestCheckoutEnabled = useMemo(() => {
        return storeSettings?.guest_checkout !== false && storeSettings?.guest_checkout !== 'false';
    }, [storeSettings]);

    const selectedAddress = useMemo(() => {
        return savedAddresses.find(a => a.id === selectedAddressId);
    }, [savedAddresses, selectedAddressId]);

    // ─── Fetch Addresses ───
    const fetchAddresses = async () => {
        try {
            const data = await shippingAddressesService.getAddresses();
            setSavedAddresses(data);
            if (data.length > 0) {
                const defaultAddr = data.find(a => a.set_as_default) || data[0];
                setSelectedAddressId(defaultAddr.id);
            }
        } catch (error) {
            console.error('[useCheckout] Failed to fetch addresses', error);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchAddresses();
        }
    }, [isLoggedIn]);

    // ─── Load Coupons & Orders ───
    useEffect(() => {
        const loadCheckoutData = async () => {
            try {
                if (propCoupons !== undefined && propCoupons !== null) {
                    setCoupons(propCoupons);
                } else {
                    const resolvedVendor = nullOrRequest(ownerUserId) || nullOrRequest(stores?.created_by);
                    const data = await couponsService.getCoupons(resolvedVendor ? { vendor_id: resolvedVendor } : undefined);
                    const activeCoupons = data.filter(
                        c => c.is_active && (!c.customer_id || c.customer_id === user?.id)
                    );
                    setCoupons(activeCoupons);
                }

                if (isLoggedIn) {
                    const ordersData = await ordersService.getCustomerOrders(undefined);
                    const counts: Record<string, number> = {};
                    (ordersData || []).forEach(order => {
                        if (order.couponCode && order.status !== 'canceled') {
                            const code = order.couponCode.toUpperCase();
                            counts[code] = (counts[code] || 0) + 1;
                        }
                    });
                    setCouponUseCounts(counts);
                }
            } catch (err) {
                console.error('[useCheckout] Failed to load coupons/orders', err);
                setCoupons([]);
            }
        };
        loadCheckoutData();
    }, [stores, user, propCoupons, ownerUserId, isLoggedIn]);

    // ─── Continuous Form Validation Effect ───
    useEffect(() => {
        if (validationError) {
            const queryParams = new URLSearchParams(window.location.search);
            const isLocal = queryParams.get('local') === 'true';

            const checkoutDeliveryAddress = isLocal ? 'close' : (storeSettings?.checkout_delivery_address || 'open');
            const checkoutPreferredContact = isLocal ? 'close' : (storeSettings?.checkout_preferred_contact || 'open');
            const checkoutNote = storeSettings?.checkout_note || 'open';
            const checkoutClaimCode = storeSettings?.checkout_claim_code || 'open';

            const currentErr = validateCheckoutForm({
                hasSelectedAddress: isLocal ? true : !!selectedAddress,
                preferredContact: isLocal ? 'none' : preferredContact,
                contactInput: isLocal ? 'none' : contactInput,
                selectedPayment,
                isGuestCheckoutEnabled,
                checkoutDeliveryAddress,
                checkoutPreferredContact,
                checkoutNote,
                checkoutClaimCode
            });
            if (!currentErr || currentErr.field !== validationError.field) {
                setValidationError(currentErr);
            }
        }
    }, [selectedAddress, preferredContact, contactInput, selectedPayment, isGuestCheckoutEnabled, validationError, storeSettings]);

    // ─── Settings Update Listener ───
    useEffect(() => {
        const handleSettingsUpdate = () => {
            const updated = localStorage.getItem('store_settings');
            if (updated) {
                try {
                    setStoreSettings(JSON.parse(updated));
                } catch (e) {
                    console.error('[useCheckout] Failed to parse updated store settings', e);
                }
            }
        };
        window.addEventListener('settings_updated', handleSettingsUpdate);
        return () => window.removeEventListener('settings_updated', handleSettingsUpdate);
    }, []);

    // ─── Action Handlers ───
    const handleVoucherClick = async (code: string) => {
        if (appliedCoupon?.code === code) {
            setAppliedCoupon(null);
            setClaimCode('');
            toast.success('Coupon removed');
        } else {
            const loading = toast.loading('Validating voucher...');
            try {
                const foundCoupon = await couponsService.validateCode(code, contactInput);
                toast.dismiss(loading);

                if (foundCoupon) {
                    const minPurchase = foundCoupon.minimum_purchase ? parseFloat(String(foundCoupon.minimum_purchase)) : 0;
                    if (subtotal < minPurchase) {
                        toast.error(`Minimum purchase of $${minPurchase.toFixed(2)} required for this voucher.`);
                        return;
                    }
                    setAppliedCoupon(foundCoupon);
                    setClaimCode(foundCoupon.code);
                    toast.success('Voucher applied!');
                    handleCopyCode(code);
                } else {
                    toast.error('Invalid coupon code');
                }
            } catch (err: any) {
                toast.dismiss(loading);
                const msg = err.details?.message || err.message || 'Invalid coupon code or limit reached';
                toast.error(msg);
            }
        }
    };

    const handleApplyCode = async () => {
        if (!claimCode.trim()) return;
        const codeUpper = claimCode.trim().toUpperCase();

        const loading = toast.loading('Validating code...');
        try {
            const found = await couponsService.validateCode(codeUpper, contactInput);
            toast.dismiss(loading);

            if (found) {
                const minPurchase = found.minimum_purchase ? parseFloat(String(found.minimum_purchase)) : 0;
                if (subtotal < minPurchase) {
                    toast.error(`Minimum purchase of $${minPurchase.toFixed(2)} required for this voucher.`);
                    return;
                }
                setAppliedCoupon(found);
                setClaimCode(found.code);
                toast.success('Voucher applied!');
            } else {
                toast.error('Invalid coupon code');
            }
        } catch (err: any) {
            toast.dismiss(loading);
            const msg = err.details?.message || err.message || 'Invalid coupon code or limit reached';
            toast.error(msg);
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => {
            setCopiedCode(prev => (prev === code ? '' : prev));
        }, 1500);
    };

    const sendOrderNotificationToChat = async (orderId: number | string, orderNo: string | null, totalAmt: number, paymentMethod: string) => {
        const resolvedOwner = nullOrRequest(ownerUserId);
        if (!isLoggedIn || !user || !resolvedOwner) return;
        try {
            const vendorId = resolvedOwner || nullOrRequest(stores?.created_by) || nullOrRequest(storeSettings?.created_by);
            if (!vendorId) return;

            const convo = await chatService.startConversation(vendorId);
            if (convo && convo.id) {
                const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                const orderHistoryUrl = `{{BASE_URL}}/profile?id=${ownerUserId}&store=${storeSlug}&tab=orders&order_id=${orderId}`;
                const messageBody = `🛒 Order Placed successfully!\n\nOrder No: #${orderNo || orderId}\nTotal Amount: $${Number(totalAmt).toFixed(2)}\nPayment Method: ${paymentMethod.toUpperCase()}\n\nClick the link below to view details \n${orderHistoryUrl}`;
                await chatService.sendMessage(convo.id, messageBody, 'text');
                console.log('[useCheckout] Chat notification sent successfully!');
            }
        } catch (err) {
            console.error('[useCheckout] Failed to send chat notification for order:', err);
        }
    };

    const executeOrderSubmission = async () => {
        const validItems = (cartItems || []).map(ci => {
            let menuItemId = ci.item?.id || ci.productId;
            if (!menuItemId && ci.id && !String(ci.id).startsWith('mock')) {
                const parts = String(ci.id).split('-');
                const parsedId = parseInt(parts[0]);
                if (!isNaN(parsedId)) menuItemId = parsedId;
            }

            let variantId = ci.variantId || null;
            if (!variantId && ci.id && String(ci.id).includes('-')) {
                const parts = String(ci.id).split('-');
                if (parts.length > 1) {
                    const parsedVarId = parseInt(parts[1]);
                    if (!isNaN(parsedVarId)) variantId = parsedVarId;
                }
            }

            return {
                menu_item_id: menuItemId ? Number(menuItemId) : 0,
                product_variant_id: variantId ? Number(variantId) : null,
                quantity: Number(ci.qty || 1),
                price: parseFloat(ci.item?.price || ci.price || '0'),
            };
        }).filter(item => item.menu_item_id > 0);

        if (validItems.length === 0) {
            toast.error('No valid items found in your shopping bag.');
            return;
        }

        const resolvedStoreId = Number(stores?.id || storeSettings?.id || nullOrRequest(ownerUserId));
        
        const queryParams = new URLSearchParams(window.location.search);
        const isLocal = queryParams.get('local') === 'true';
        const checkoutDeliveryAddress = isLocal ? 'close' : (storeSettings?.checkout_delivery_address || 'open');

        const orderData = {
            store_id: resolvedStoreId,
            customer_id: isLoggedIn && user?.id ? Number(user.id) : null,
            subtotal: Number(subtotal.toFixed(2)),
            total_amount: Number(totalAmount.toFixed(2)),
            customer_name: isLocal 
                ? (user?.name || 'Walk In')
                : (checkoutDeliveryAddress === 'close'
                    ? customCustomerName
                    : (selectedAddress ? `${selectedAddress.first_name} ${selectedAddress.last_name}` : 'Guest Customer')),
            customer_phone: isLocal 
                ? (user?.phone || '') 
                : (checkoutDeliveryAddress === 'close'
                    ? customCustomerPhone
                    : contactInput),
            customer_address: isLocal
                ? 'Walk-in'
                : (checkoutDeliveryAddress === 'close'
                    ? customCustomerAddress
                    : (selectedAddress
                        ? `${selectedAddress.address}, ${selectedAddress.city_province}, ${selectedAddress.country}`
                        : 'Guest Address')),
            latitude: checkoutDeliveryAddress === 'close' ? (customLatitude ? parseFloat(customLatitude) : null) : (selectedAddress?.latitude || null),
            longitude: checkoutDeliveryAddress === 'close' ? (customLongitude ? parseFloat(customLongitude) : null) : (selectedAddress?.longitude || null),
            payment_method: selectedPayment || 'cod',
            notes: note || '',
            items: validItems,
            delivery_fee: isLocal ? 0 : Number(deliveryFee.toFixed(2)),
            discount_amount: Number(totalDiscount.toFixed(2)),
            coupon_code: appliedCoupon?.code || '',
            order_type: isLocal ? 'walk_in' : 'delivery',
        };

        console.log('[useCheckout] Submitting Order Data:', orderData);

        const isGateway = selectedPayment !== 'cod' && selectedPayment !== 'card';
        await submitOrder(orderData as any, (order) => {
            if (isGateway) {
                setPendingOrderId(order.id);
                setPendingOrderNo(order.order_no || null);
                setIsKHQROpen(true);
                return;
            }

            if (clearCart) clearCart();
            sendOrderNotificationToChat(order.id, order.order_no || null, order.total_amount || totalAmount, selectedPayment || 'cod');
            setOrderSuccess(true);
            window.dispatchEvent(new CustomEvent('aura_order_placed', { detail: order }));

            if (onNavigate) {
                const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                setTimeout(() => {
                    onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'orders'));
                }, 4000);
            }
        });
    };

    const handleCheckout = async () => {
        const queryParams = new URLSearchParams(window.location.search);
        const isLocal = queryParams.get('local') === 'true';

        const checkoutDeliveryAddress = isLocal ? 'close' : (storeSettings?.checkout_delivery_address || 'open');
        const checkoutPreferredContact = isLocal ? 'close' : (storeSettings?.checkout_preferred_contact || 'open');
        const checkoutNote = storeSettings?.checkout_note || 'open';
        const checkoutClaimCode = storeSettings?.checkout_claim_code || 'open';

        const err = validateCheckoutForm({
            hasSelectedAddress: isLocal ? true : !!selectedAddress,
            preferredContact: isLocal ? 'none' : preferredContact,
            contactInput: isLocal ? 'none' : contactInput,
            selectedPayment,
            isGuestCheckoutEnabled,
            checkoutDeliveryAddress,
            checkoutPreferredContact,
            checkoutNote,
            checkoutClaimCode,
            customCustomerName,
            customCustomerPhone,
            customCustomerAddress,
        });

        if (err) {
            setValidationError(err);
            toast.error(err.message);
            if (err.field === 'address') {
                addressBtnRef.current?.focus();
                addressBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (err.field === 'customCustomerName') {
                customNameRef.current?.focus();
                customNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (err.field === 'customCustomerPhone') {
                customPhoneRef.current?.focus();
                customPhoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (err.field === 'customCustomerAddress') {
                customAddressRef.current?.focus();
                customAddressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (err.field === 'preferredContact') {
                preferredContactRef.current?.focus();
                preferredContactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (err.field === 'contactInput') {
                contactInputRef.current?.focus();
                contactInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (err.field === 'payment') {
                paymentRef.current?.focus();
                paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setValidationError(null);
        await executeOrderSubmission();
    };

    return {
        // States & Getters
        savedAddresses,
        setSavedAddresses,
        selectedAddressId,
        setSelectedAddressId,
        showAddressBook,
        setShowAddressBook,
        showAddModal,
        setShowAddModal,
        editingAddress,
        setEditingAddress,
        storeSettings,
        selectedPayment,
        setSelectedPayment,
        preferredContact,
        setPreferredContact,
        contactInput,
        setContactInput,
        note,
        setNote,
        claimCode,
        setClaimCode,
        appliedCoupon,
        setAppliedCoupon,
        coupons,
        copiedCode,
        couponUseCounts,
        orderSuccess,
        setOrderSuccess,
        isKHQROpen,
        setIsKHQROpen,
        pendingOrderId,
        setPendingOrderId,
        pendingOrderNo,
        setPendingOrderNo,
        validationError,
        isLoggedIn,
        user,

        // Custom delivery fields
        customCustomerName,
        setCustomCustomerName,
        customCustomerPhone,
        setCustomCustomerPhone,
        customCustomerAddress,
        setCustomCustomerAddress,
        customLatitude,
        setCustomLatitude,
        customLongitude,
        setCustomLongitude,

        // Refs
        addressBtnRef,
        preferredContactRef,
        contactInputRef,
        paymentRef,
        customNameRef,
        customPhoneRef,
        customAddressRef,

        // Computed
        displayCartItems,
        subtotal,
        couponDiscount,
        deliveryFee,
        totalDiscount,
        totalAmount,
        isGuestCheckoutEnabled,
        selectedAddress,
        isCheckingOut,

        // Handlers
        fetchAddresses,
        handleVoucherClick,
        handleApplyCode,
        handleCopyCode,
        handleCheckout,
        sendOrderNotificationToChat
    };
};
