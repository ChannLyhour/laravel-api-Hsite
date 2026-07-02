import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    FiCheck,
    FiMessageSquare,
    FiPhone,
    FiSend,
    FiChevronRight,
    FiX,
    FiEdit2,
    FiPlus,
    FiChevronLeft,
    FiMapPin,
    FiTag,
    FiCreditCard,
    FiShoppingBag,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { shippingAddressesService } from '@/api/owner/shippingAddresses';
import type { ShippingAddress } from '@/api/owner/shippingAddresses';
import { useCheckout } from '../hooks/useCheckout';
import { PopupPaymentKHQR } from './helpers/PopupPaymentKHQR';
import type { CouponRow } from '@/api/owner/coupons';
import { ordersService } from '@/api/owner/orders';

import { ModelCoupon } from './helpers/ModelCoupon';
import { FASHION_ROUTES } from '../routes';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CheckoutPageProps {
    cartItems?: any[];
    subtotal?: number;
    deliveryFee?: number;
    discount?: number;
    stores?: any;
    onNavigate?: (to: string) => void;
    coupons?: CouponRow[];
    ownerUserId?: number | string;
    clearCart?: () => void;
}

// ─── Cambodian Cities ──────────────────────────────────────────────────────────
const CAMBODIA_CITIES = [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville',
    'Kampong Cham', 'Koh Kong', 'Kratie', 'Takéo', 'Kampot',
    'Pursat', 'Prey Veng', 'Svay Rieng', 'Kandal', 'Mondulkiri',
    'Ratanakiri', 'Stung Treng', 'Preah Vihear', 'Oddar Meanchey',
    'Pailin', 'Kep', 'Tbong Khmum',
];

// ─── Add New Address Modal ──────────────────────────────────────────────────────
interface AddAddressModalProps {
    onClose: () => void;
    onSave: (addr: ShippingAddress) => void;
    isLoggedIn?: boolean;
    addressToEdit?: ShippingAddress | null;
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({
    onClose,
    onSave,
    isLoggedIn = false,
    addressToEdit = null,
}) => {
    // Helper to strip any +855 prefix from saved telephone number for displaying in the form input
    const formatInitialPhone = (phone: string) => {
        if (!phone) return '';
        let clean = phone.trim();
        clean = clean.replace(/^(\+?855\s*)+/, '');
        if (clean.startsWith('0')) {
            clean = clean.slice(1);
        }
        return clean;
    };

    const [form, setForm] = useState({
        first_name: addressToEdit?.first_name || '',
        last_name: addressToEdit?.last_name || '',
        telephone: addressToEdit ? formatInitialPhone(addressToEdit.telephone) : '',
        address: addressToEdit?.address || '',
        country: addressToEdit?.country || 'Cambodia',
        city_province: addressToEdit?.city_province || '',
    });
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSave = async () => {
        if (!form.telephone || !form.address || !form.city_province) {
            toast.error('Please fill in all required fields.');
            return;
        }

        if (!isLoggedIn) {
            // Local address for guest checkout
            const guestAddress: ShippingAddress = {
                id: addressToEdit ? addressToEdit.id : Date.now(),
                user_id: 0,
                first_name: form.first_name,
                last_name: form.last_name,
                telephone: form.telephone,
                address: form.address,
                city_province: form.city_province,
                country: form.country,
                set_as_default: true,
                created_at: addressToEdit ? addressToEdit.created_at : new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            onSave(guestAddress);
            onClose();
            toast.success(addressToEdit ? 'Address updated!' : 'Address set for this order!');
            return;
        }

        setLoading(true);
        try {
            if (addressToEdit) {
                const updatedAddress = await shippingAddressesService.updateAddress(addressToEdit.id, {
                    first_name: form.first_name,
                    last_name: form.last_name,
                    telephone: form.telephone,
                    address: form.address,
                    city_province: form.city_province,
                    country: form.country,
                    set_as_default: addressToEdit.set_as_default
                });
                onSave(updatedAddress);
                onClose();
                toast.success('Address updated successfully!');
            } else {
                const newAddress = await shippingAddressesService.createAddress({
                    first_name: form.first_name,
                    last_name: form.last_name,
                    telephone: form.telephone,
                    address: form.address,
                    city_province: form.city_province,
                    country: form.country,
                    set_as_default: false
                });
                onSave(newAddress);
                onClose();
                toast.success('New address saved!');
            }
        } catch (error) {
            toast.error('Failed to save address.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-stone-950/40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 bg-white w-full max-w-md rounded-sm shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                        {addressToEdit ? 'Modify Address' : 'Add new address'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500 transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <FiX className="w-4 h-4 stroke-[2.5]" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 space-y-4">
                    {/* First & Last name */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                First name
                            </label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={set('first_name')}
                                placeholder="Enter first name"
                                className="w-full px-3 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                Last name
                            </label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={set('last_name')}
                                placeholder="Enter last name"
                                className="w-full px-3 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                            Telephone <span className="text-red-400">(Required)</span>
                        </label>
                        <div className="flex gap-2">
                            <div className="flex items-center px-3 py-2.5 border border-stone-200 rounded-[3px] bg-stone-50 text-xs font-black text-stone-700 shrink-0">
                                + 855
                            </div>
                            <input
                                type="tel"
                                value={form.telephone}
                                onChange={set('telephone')}
                                placeholder="Enter phone number"
                                className="flex-1 px-3 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                            Address <span className="text-red-400">(Required)</span>
                        </label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={set('address')}
                            placeholder="Enter address"
                            className="w-full px-3 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                        />
                    </div>

                    {/* Country + City */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Country */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                Country
                            </label>
                            <div className="relative">
                                <select
                                    value={form.country}
                                    onChange={set('country')}
                                    className="w-full appearance-none px-3 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 focus:outline-none focus:border-stone-900 bg-white pr-8 cursor-pointer"
                                >
                                    <option value="Cambodia">Cambodia</option>
                                </select>
                                <FiChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* City */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                City/province <span className="text-red-400">(Required)</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setCityDropdownOpen(v => !v)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-[3px] text-xs text-left cursor-pointer bg-white transition-colors ${form.city_province ? 'text-stone-800 font-medium' : 'text-stone-300'} ${cityDropdownOpen ? 'border-stone-900' : 'border-stone-200'}`}
                                >
                                    {form.city_province || '— Select city / province *'}
                                    <FiChevronRight className={`w-3.5 h-3.5 text-stone-400 transition-transform ${cityDropdownOpen ? 'rotate-90' : ''}`} />
                                </button>
                                {cityDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-[3px] shadow-lg z-50 max-h-48 overflow-y-auto">
                                        {CAMBODIA_CITIES.map(city => (
                                            <button
                                                key={city}
                                                type="button"
                                                onClick={() => {
                                                    setForm(p => ({ ...p, city_province: city }));
                                                    setCityDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs font-medium cursor-pointer border-none transition-colors ${form.city_province === city ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50'}`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`w-full py-3.5 bg-stone-900 hover:bg-stone-850 text-white font-black text-xs uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Saving...' : (addressToEdit ? 'Apply Changes' : 'Save')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Address Book Drawer ────────────────────────────────────────────────────────
interface AddressBookDrawerProps {
    addresses: ShippingAddress[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onClose: () => void;
    onAddNew: () => void;
    onEdit: (id: number) => void;
    isLoggedIn?: boolean;
}

const AddressBookDrawer: React.FC<AddressBookDrawerProps> = ({
    addresses,
    selectedId,
    onSelect,
    onClose,
    onAddNew,
    onEdit,
    isLoggedIn = true,
}) => createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
        {/* Backdrop */}
        <div
            className="absolute inset-0 bg-stone-950/30"
            onClick={onClose}
        />

        {/* Drawer */}
        <div className="relative z-10 w-full max-w-sm bg-white h-full flex flex-col shadow-2xl animate-slide-left">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                    <FiChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                    Address book
                </h2>
            </div>

            {/* Address list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {!isLoggedIn ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center text-stone-600 animate-fade-in">
                        <FiMapPin className="w-8 h-8 text-stone-400 stroke-[1.5]" />
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-wider text-stone-900">Login Required</p>
                            <p className="text-[11px] text-stone-500 font-medium px-4">Please login or register to see your saved address book.</p>
                        </div>
                        <button
                            onClick={() => {
                                onClose();
                                window.dispatchEvent(new CustomEvent('request_login'));
                            }}
                            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-black text-xs uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors duration-200"
                        >
                            Login / Register
                        </button>
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-stone-400">
                        <FiMapPin className="w-8 h-8 stroke-[1.5]" />
                        <p className="text-xs font-bold uppercase tracking-wider">No saved addresses</p>
                    </div>
                ) : (
                    addresses.map(addr => (
                        <div
                            key={addr.id}
                            className={`relative p-4 border rounded-sm cursor-pointer transition-colors ${selectedId === addr.id
                                ? 'border-stone-900 bg-stone-50/60'
                                : 'border-stone-150 hover:bg-stone-50'
                                }`}
                            onClick={() => { onSelect(addr.id); onClose(); }}
                        >
                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${selectedId === addr.id ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
                                    {selectedId === addr.id && <FiCheck className="w-2.5 h-2.5 text-white stroke-[3]" />}
                                </div>

                                <div className="flex-1 text-xs space-y-0.5">
                                    <h3 className="font-bold text-stone-900 text-sm">
                                        {addr.first_name} {addr.last_name}
                                        {addr.set_as_default && (
                                            <span className="ml-2 text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wide">
                                                Default
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-stone-500">{addr.city_province}</p>
                                    <p className="text-stone-400">{addr.telephone}</p>
                                </div>

                                <button
                                    onClick={e => { e.stopPropagation(); onEdit(addr.id); }}
                                    className="text-[10px] font-black text-stone-400 hover:text-stone-900 flex items-center gap-0.5 transition-colors border-none bg-transparent cursor-pointer"
                                >
                                    Edit <FiEdit2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-stone-100">
                {isLoggedIn ? (
                    <button
                        onClick={onAddNew}
                        className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                        <FiPlus className="w-4 h-4 stroke-[2.5]" />
                        Add new address
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            onClose();
                            window.dispatchEvent(new CustomEvent('request_login'));
                        }}
                        className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                        Login / Register
                    </button>
                )}
            </div>
        </div>
    </div>,
    document.body
);

// ─── Main Component ─────────────────────────────────────────────────────────────
export const CheckoutPage: React.FC<CheckoutPageProps> = ({
    cartItems,
    subtotal: propSubtotal,
    deliveryFee: propDeliveryFee,
    discount: propDiscount = 0,
    stores,
    coupons: propCoupons,
    ownerUserId,
    clearCart,
    onNavigate,
}) => {
    const {
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

        addressBtnRef,
        preferredContactRef,
        contactInputRef,
        paymentRef,

        displayCartItems,
        subtotal,
        deliveryFee,
        totalDiscount,
        totalAmount,
        isGuestCheckoutEnabled,
        selectedAddress,
        isCheckingOut,

        fetchAddresses,
        handleVoucherClick,
        handleApplyCode,
        handleCopyCode,
        handleCheckout,
        sendOrderNotificationToChat
    } = useCheckout({
        cartItems,
        propSubtotal,
        propDeliveryFee,
        propDiscount,
        stores,
        propCoupons,
        ownerUserId,
        clearCart,
        onNavigate,
    });

    const [isVoucherDrawerOpen, setIsVoucherDrawerOpen] = useState(false);

    const checkoutDeliveryAddress = storeSettings?.checkout_delivery_address || 'open';
    const checkoutPreferredContact = storeSettings?.checkout_preferred_contact || 'open';
    const checkoutNote = storeSettings?.checkout_note || 'open';
    const checkoutClaimCode = storeSettings?.checkout_claim_code || 'open';

    const paymentMethods = React.useMemo(() => {
        const methodsBase = [
            {
                key: 'aba',
                logo: <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center shadow-3xs bg-[#005D7E] text-white font-sans font-black text-[13px] tracking-tight relative">ABA<div className="absolute top-0 right-0 w-2 h-2 bg-[#E61E25]" /></div>,
                name: 'ABA PAY',
                desc: 'Scan to pay with ABA Mobile',
            },
            {
                key: 'bakong',
                logo: <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-[#b30006] text-white font-sans font-black text-[9px] tracking-tight relative">Bakong</div>,
                name: 'Bakong KHQR',
                desc: 'Scan to pay with Bakong App or any KHQR supported bank',
            },
            {
                key: 'card',
                logo: <div className="w-10 h-7 rounded shrink-0 flex items-center justify-center bg-stone-100 border border-stone-200/80"><div className="grid grid-cols-2 gap-[2px] p-[2px]"><span className="text-[6px] font-black text-blue-800">VISA</span><span className="text-[6px] font-black text-red-500">MC</span><span className="text-[6px] font-black text-green-700">JCB</span><span className="text-[6px] font-black text-blue-900">UP</span></div></div>,
                name: 'Credit/Debit Card',
                desc: <div className="flex items-center gap-1.5 mt-0.5"><span className="text-[8px] bg-blue-50 text-blue-700 font-bold px-0.5 rounded">VISA</span><span className="text-[8px] bg-red-50 text-red-700 font-bold px-0.5 rounded">MC</span><span className="text-[8px] bg-green-50 text-green-700 font-bold px-0.5 rounded">JCB</span></div>,
            },
            {
                key: 'acleda',
                logo: <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-[#0d3b66] text-amber-400 font-bold text-[8px]">ACLEDA</div>,
                name: 'ACLEDA PAY',
                desc: 'Pay securely with ACLEDA.',
            },
            {
                key: 'wing',
                logo: <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-[#84bd00] text-blue-900 font-black text-[10px]">Wing</div>,
                name: 'Wing Bank',
                desc: 'Pay securely with WingPay',
            },
            {
                key: 'chipmong',
                logo: <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-[#009b72] text-white font-bold text-[8px]">CMB</div>,
                name: 'CHIP MONG BANK',
                desc: 'Tab to pay with CHIP MONG',
            },
            {
                key: 'transfer',
                logo: <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-stone-100 border border-stone-200"><span className="text-[14px]">🏦</span></div>,
                name: 'Bank Transfer',
                desc: <span className="font-kuntomruy">ទូទាត់តាមគណនីធនាគារ</span>,
            },
            {
                key: 'cod',
                logo: <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-stone-100 border border-stone-200"><span className="text-[14px]">💵</span></div>,
                name: 'Cash on Delivery',
                desc: <span className="font-kuntomruy">បង់ប្រាក់នៅពេលទទួលបានទំនិញ</span>,
            },
        ];

        return methodsBase.filter(p => {
            const methods = storeSettings.payment_methods || {};
            const config = methods[p.key];
            if (config) return config.enabled;

            const legacyConfig = storeSettings[`payment_gw_${p.key}`];
            if (legacyConfig) {
                try {
                    const parsed = typeof legacyConfig === 'string' ? JSON.parse(legacyConfig) : legacyConfig;
                    return parsed.enabled;
                } catch { return false; }
            }
            return p.key === 'cod' || p.key === 'transfer';
        });
    }, [storeSettings]);

    // Sync selected payment if list changes (only clear if selected method is no longer available)
    useEffect(() => {
        if (selectedPayment && paymentMethods.length > 0) {
            if (!paymentMethods.some(m => m.key === selectedPayment)) {
                setSelectedPayment('');
            }
        }
    }, [paymentMethods, selectedPayment]);

    // Guest checkout check
    if (!isGuestCheckoutEnabled && !isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-sm shadow-2xs min-h-[50vh] mt-8 font-kuntomruy">
                <h2 className="text-lg font-black text-stone-900 uppercase">Login Required</h2>
                <p className="text-sm text-stone-500 mt-2">You must be logged in to checkout in this store.</p>
                <button
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('request_login'));
                    }}
                    className="mt-6 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors"
                >
                    Login / Register
                </button>
            </div>
        );
    }

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 font-kuntomruy animate-fade-in">
                <div className="bg-white p-8 sm:p-12 rounded-sm border border-stone-200/60 shadow-2xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                        <FiCheck className="w-10 h-10 stroke-[3]" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl font-black text-stone-900 uppercase tracking-widest">Order Placed!</h1>
                        <p className="text-sm text-stone-500 leading-relaxed">
                            Thank you for your purchase. Your order is being processed and will be delivered soon.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex flex-col gap-3">
                        <button
                            onClick={() => {
                                const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                                onNavigate?.(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'orders'));
                            }}
                            className="w-full py-4 bg-stone-900 hover:bg-stone-850 text-white rounded-[3px] font-black text-xs uppercase tracking-widest border-none transition-all cursor-pointer shadow-sm focus:outline-none"
                        >
                            View My Orders
                        </button>
                        <button
                            onClick={() => {
                                const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                                onNavigate?.(FASHION_ROUTES.getHome(storeSlug));
                            }}
                            className="w-full py-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 rounded-[3px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer focus:outline-none"
                        >
                            Continue Shopping
                        </button>
                    </div>

                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest pt-2">
                        Redirecting to profile in 4 seconds...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 font-kuntomruy pb-16">


            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN */}
                <section className="lg:col-span-7 space-y-6">

                    {/* Delivery address & Preferred contact card */}
                    {(checkoutDeliveryAddress !== 'close' || checkoutPreferredContact !== 'close') && (
                        <div className={`bg-white p-5 rounded-sm border shadow-2xs transition-all duration-200 ${(validationError?.field === 'address' || validationError?.field === 'preferredContact' || validationError?.field === 'contactInput') ? 'border-red-500 ring-1 ring-red-500/20' : 'border-stone-200/60'} space-y-6`}>
                            {/* Delivery address section */}
                            {checkoutDeliveryAddress !== 'close' && (
                                <div>
                                    <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FiMapPin className="w-4 h-4 text-stone-900 stroke-[2.5]" />
                                        Delivery address {checkoutDeliveryAddress === 'null' && <span className="text-stone-400 lowercase font-medium text-xs">(optional)</span>}
                                    </h2>

                            <div className="space-y-4">
                                {/* Selected address */}
                                <div className={`flex items-start gap-4 p-4 border rounded-sm relative transition-all duration-200 ${validationError?.field === 'address' ? 'border-red-500 bg-red-50/10' : 'border-stone-200 bg-stone-50/50'}`}>
                                    <div className={`mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-full border transition-all duration-200 ${validationError?.field === 'address' ? 'border-red-500 bg-red-500 text-white' : 'border-stone-900 bg-stone-900 text-white'}`}>
                                        <FiCheck className="w-2.5 h-2.5 stroke-[4]" />
                                    </div>

                                    <div className="flex-1 text-xs text-stone-600 space-y-1">
                                        <h3 className="font-bold text-stone-900 text-sm">
                                            {selectedAddress ? `${selectedAddress.first_name} ${selectedAddress.last_name}` : 'Guest Customer'}
                                        </h3>
                                        <p>{selectedAddress?.city_province || 'No address selected'}</p>
                                        <p>{selectedAddress?.telephone || 'No phone number'}</p>
                                    </div>

                                    <button
                                        ref={addressBtnRef}
                                        onClick={() => setShowAddressBook(true)}
                                        className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer ${validationError?.field === 'address' ? 'text-red-600 hover:text-red-800' : 'text-stone-400 hover:text-stone-900'}`}
                                    >
                                        {selectedAddress ? 'Change Address' : 'Add Address'} <FiChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {validationError?.field === 'address' && (
                                    <p className="text-[11px] font-bold text-red-500 animate-fade-in mt-1 flex items-center gap-1">
                                        <span>⚠️</span>
                                        <span>{validationError.message}</span>
                                    </p>
                                )}
                                </div>
                                </div>
                            )}

                            {/* Preferred contact line section */}
                            {checkoutPreferredContact !== 'close' && (
                                <div className={`${checkoutDeliveryAddress !== 'close' ? 'border-t border-stone-100 pt-6' : ''}`}>
                                    <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FiPhone className="w-4 h-4 text-stone-900 stroke-[2.5]" />
                                        Preferred contact line {checkoutPreferredContact === 'null' && <span className="text-stone-400 lowercase font-medium text-xs">(optional)</span>}
                                    </h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: 'phone', icon: <FiPhone className="w-3.5 h-3.5" />, label: 'Phone call' },
                                        { key: 'telegram', icon: <FiSend className="w-3.5 h-3.5 rotate-[-15deg]" />, label: 'Telegram' },
                                        { key: 'whatsapp', icon: <FiMessageSquare className="w-3.5 h-3.5" />, label: 'WhatsApp' },
                                    ].map((c, idx) => (
                                        <button
                                            key={c.key}
                                            type="button"
                                            ref={idx === 0 ? preferredContactRef : undefined}
                                            onClick={() => setPreferredContact(c.key)}
                                            className={`flex items-center justify-center gap-1.5 py-2.5 px-1.5 border rounded-[3px] text-xs font-bold transition-all cursor-pointer ${preferredContact === c.key
                                                ? 'bg-stone-900 text-white border-stone-900'
                                                : validationError?.field === 'preferredContact'
                                                    ? 'bg-white text-red-500 border-red-300 hover:bg-red-50/50'
                                                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                                }`}
                                        >
                                            {c.icon}
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                                {validationError?.field === 'preferredContact' && (
                                    <p className="text-[11px] font-bold text-red-500 animate-fade-in mt-1 flex items-center gap-1">
                                        <span>⚠️</span>
                                        <span>{validationError.message}</span>
                                    </p>
                                )}

                                <div className="space-y-1.5">
                                    <input
                                        type="text"
                                        ref={contactInputRef}
                                        value={contactInput}
                                        onChange={(e) => setContactInput(e.target.value)}
                                        placeholder={
                                            preferredContact === 'phone'
                                                ? 'Enter phone number (+855...)'
                                                : preferredContact === 'telegram'
                                                    ? 'Enter Telegram username or phone'
                                                    : preferredContact === 'whatsapp'
                                                        ? 'Enter WhatsApp number'
                                                        : 'Enter contact information'
                                        }
                                        className={`w-full px-3.5 py-2.5 border rounded-[3px] text-xs font-bold text-stone-850 focus:outline-none transition-all duration-200 ${validationError?.field === 'contactInput'
                                            ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/35 bg-red-50/5'
                                            : 'border-stone-200 focus:border-stone-900'
                                            }`}
                                    />
                                    {validationError?.field === 'contactInput' && (
                                        <p className="text-[11px] font-bold text-red-500 animate-fade-in mt-1 flex items-center gap-1">
                                            <span>⚠️</span>
                                            <span>{validationError.message}</span>
                                        </p>
                                    )}
                                </div>
                                </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Shopping Bag items */}
                    <div className="bg-white p-5 rounded-sm border border-stone-200/60 shadow-2xs">
                        <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FiShoppingBag className="w-4 h-4 text-stone-900 stroke-[2.5]" />
                            My shopping bag ({displayCartItems.length})
                        </h2>

                        <div className="divide-y divide-stone-100">
                            {displayCartItems.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center justify-center gap-4 animate-fade-in">
                                    <span className="text-3xl text-stone-300">🛍️</span>
                                    <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">Your shopping bag is empty</p>
                                    <button
                                        onClick={() => {
                                            if (onNavigate) {
                                                const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                                                const resolvedId = ownerUserId || stores?.created_by || storeSettings?.created_by || stores?.id || '';
                                                onNavigate(FASHION_ROUTES.getShop(resolvedId, storeSlug));
                                            }
                                        }}
                                        className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-[3px] font-black text-xs uppercase tracking-widest border-none cursor-pointer transition-colors duration-200 shadow-xs focus:outline-none"
                                    >
                                        Go to Shop
                                    </button>
                                </div>
                            ) : (
                                displayCartItems.map((item, idx) => (
                                    <div key={item.id + idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                        <div className="w-20 h-24 bg-stone-50 border border-stone-100 rounded-sm overflow-hidden shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between text-xs text-stone-500">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-stone-900 text-sm">{item.name}</h3>
                                                {item.code && <p className="text-[10px]">Code: {item.code}</p>}
                                                {item.variant && (
                                                    <p className="text-[10px] uppercase font-bold text-stone-400">
                                                        {item.variant}
                                                    </p>
                                                )}
                                                <p className="text-[10px] font-medium">Quantity x {item.qty}</p>
                                            </div>

                                            <div className="flex justify-between items-baseline mt-2">
                                                <span className="text-xs font-black text-stone-900">
                                                    US ${item.price.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </section>

                {/* RIGHT COLUMN */}
                <section className="lg:col-span-5 space-y-6">

                    {/* Payment Card */}
                    <div className={`bg-white p-5 rounded-sm border shadow-2xs transition-all duration-200 ${validationError?.field === 'payment' ? 'border-red-500 ring-1 ring-red-500/20' : 'border-stone-200/60'}`}>
                        <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FiCreditCard className="w-4 h-4 text-stone-900 stroke-[2.5]" />
                            Payment
                        </h2>

                        <div className="space-y-3">
                            {paymentMethods.length === 0 ? (
                                <div className="text-center py-6 text-stone-400 text-xs font-bold uppercase tracking-wider">
                                    No payment methods available
                                </div>
                            ) : paymentMethods.map((p, idx) => (
                                <label
                                    key={p.key}
                                    className={`flex items-center gap-4 p-3 border rounded-sm cursor-pointer transition-colors ${selectedPayment === p.key
                                        ? 'border-stone-900 bg-stone-50/40'
                                        : validationError?.field === 'payment'
                                            ? 'border-red-300 hover:border-red-400 hover:bg-stone-50'
                                            : 'border-stone-150 hover:bg-stone-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        ref={idx === 0 ? paymentRef : undefined}
                                        checked={selectedPayment === p.key}
                                        onChange={() => setSelectedPayment(p.key)}
                                        className={`w-4 h-4 text-stone-900 border-stone-300 focus:ring-0 cursor-pointer shrink-0 ${validationError?.field === 'payment' ? 'accent-red-500 text-red-500' : ''}`}
                                    />
                                    {p.logo}
                                    <div className="text-xs">
                                        <p className="font-bold text-stone-900">{p.name}</p>
                                        <p className="text-[10px] text-stone-400 font-medium">{p.desc}</p>
                                    </div>
                                </label>
                            ))}
                            {validationError?.field === 'payment' && (
                                <p className="text-[11px] font-bold text-red-500 animate-fade-in mt-1 flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span>{validationError.message}</span>
                                </p>
                            )}
                        </div>
                    </div>




                    {/* Note */}
                    {checkoutNote !== 'close' && (
                        <div className="bg-white p-5 rounded-sm border border-stone-200/60 shadow-2xs space-y-4">
                            <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                                Note {checkoutNote === 'null' && <span className="text-stone-400 lowercase font-medium text-xs">(optional)</span>}
                            </h2>

                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Note"
                                rows={3}
                                className="w-full p-4 border border-stone-200 rounded-[3px] text-xs font-bold text-stone-850 placeholder:text-stone-300 focus:outline-none focus:border-stone-950 resize-none"
                            />
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="px-6 py-5 border border-stone-150 bg-stone-50 rounded-sm space-y-4">
                        {/* Claim code inputs inside summary card */}
                        {checkoutClaimCode !== 'close' && (
                            <div className="space-y-3 pb-4 border-b border-stone-200/60">
                                <h2 className="text-xs font-black text-stone-900 uppercase tracking-widest">
                                    Claim code {checkoutClaimCode === 'null' && <span className="text-stone-400 lowercase font-medium text-[9px]">(optional)</span>}
                                </h2>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={claimCode}
                                    onChange={(e) => {
                                        setClaimCode(e.target.value);
                                        if (appliedCoupon && appliedCoupon.code !== e.target.value) {
                                            setAppliedCoupon(null);
                                        }
                                    }}
                                    placeholder="Claim code"
                                    className="flex-1 px-3 py-2 border border-stone-200 rounded-[3px] text-xs font-bold text-stone-850 uppercase placeholder:text-stone-300 focus:outline-none focus:border-stone-950 bg-white"
                                />
                                <button
                                    onClick={handleApplyCode}
                                    disabled={!claimCode.trim()}
                                    className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-950 hover:text-white rounded-[3px] text-xs font-black uppercase tracking-wider text-stone-900 transition-all cursor-pointer disabled:bg-stone-50 disabled:text-stone-300 disabled:border-stone-150"
                                >
                                    Apply
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsVoucherDrawerOpen(true)}
                                className="ProductDetailsDescription_apply_voucher_txt__2Iss6 relative flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 rounded-[3px] text-[10px] font-black uppercase tracking-wider text-stone-700 hover:text-stone-950 transition-all border border-stone-200 cursor-pointer shrink-0 select-none focus:outline-none w-fit"
                            >
                                <span>{appliedCoupon ? `Code: ${appliedCoupon.code}` : 'Free Voucher'}</span>
                                <svg className="w-3.5 h-3.5 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                                    <line x1="13" y1="5" x2="13" y2="19" />
                                </svg>
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#E61E25] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs">
                                    {appliedCoupon ? '✓' : coupons.length}
                                </span>
                            </button>
                        </div>
                    )}

                        <div className="space-y-2.5 pt-1">
                            <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                                <span>Subtotal</span>
                                <span>US ${subtotal.toFixed(2)}</span>
                            </div>

                            {totalDiscount > 0 && (
                                <div className="flex justify-between items-center text-xs font-bold text-[#E61E25]">
                                    <span className="flex items-center gap-1">
                                        <FiTag className="w-3.5 h-3.5" />
                                        Save
                                    </span>
                                    <span>- US ${totalDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                                <span className="flex items-center gap-1">
                                    <span>Delivery fee ({stores?.store_name})</span>
                                    {appliedCoupon?.coupon_type === 'free_delivery' && (
                                        <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded-sm uppercase font-bold">Coupon</span>
                                    )}
                                </span>
                                <span>{deliveryFee === 0 ? 'FREE' : `US $${deliveryFee.toFixed(2)}`}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm font-black text-stone-900 border-t border-stone-200/60 pt-3">
                            <span>Amount to pay</span>
                            <span className="text-base font-black">US ${totalAmount.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className={`w-full py-4 bg-stone-900 hover:bg-stone-850 text-white rounded-[3px] font-black text-xs uppercase tracking-widest border-none transition-all cursor-pointer shadow-sm mt-2 focus:outline-none ${isCheckingOut ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isCheckingOut ? 'Processing...' : 'Checkout'}
                        </button>
                    </div>

                </section>

            </main>

            {/* Address Book Drawer */}
            {showAddressBook && (
                <AddressBookDrawer
                    addresses={savedAddresses}
                    selectedId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                    onClose={() => setShowAddressBook(false)}
                    onAddNew={() => { setShowAddressBook(false); setShowAddModal(true); }}
                    onEdit={(id) => {
                        const addr = savedAddresses.find(a => a.id === id);
                        if (addr) {
                            setEditingAddress(addr);
                            setShowAddressBook(false);
                        }
                    }}
                    isLoggedIn={isLoggedIn}
                />
            )}

            {/* Add New Address Modal */}
            {(showAddModal || editingAddress) && (
                <AddAddressModal
                    addressToEdit={editingAddress}
                    onClose={() => { setShowAddModal(false); setEditingAddress(null); }}
                    onSave={(addr) => {
                        if (isLoggedIn) {
                            fetchAddresses();
                        } else {
                            // Guest
                            setSavedAddresses([addr]);
                            setSelectedAddressId(addr.id);
                        }
                    }}
                    isLoggedIn={isLoggedIn}
                />
            )}

            {/* Voucher Drawer */}
            <ModelCoupon
                isOpen={isVoucherDrawerOpen}
                onClose={() => setIsVoucherDrawerOpen(false)}
                coupons={coupons}
                appliedCoupon={appliedCoupon}
                onApplyCoupon={handleVoucherClick}
                subtotal={subtotal}
                copiedCode={copiedCode}
                onCopyCode={handleCopyCode}
                isLoggedIn={isLoggedIn}
                couponUseCounts={couponUseCounts}
            />

            {/* Payment KHQR Popup */}
            <PopupPaymentKHQR
                isOpen={isKHQROpen}
                onClose={async () => {
                    setIsKHQROpen(false);
                    if (pendingOrderId) {
                        const loadingToast = toast.loading('Canceling order...');
                        try {
                            await ordersService.deleteOrder(pendingOrderId);
                            toast.dismiss(loadingToast);
                            toast.error('Payment canceled. The order has been canceled.');
                        } catch (err) {
                            toast.dismiss(loadingToast);
                            console.error('Failed to cancel abandoned order:', err);
                        } finally {
                            setPendingOrderId(null);
                            setPendingOrderNo(null);
                        }
                    }
                }}
                onConfirmPayment={() => {
                    setIsKHQROpen(false);
                    if (clearCart) clearCart();
                    setOrderSuccess(true);
                    if (pendingOrderId) {
                        window.dispatchEvent(new CustomEvent('aura_order_placed', { detail: { id: pendingOrderId } }));
                        sendOrderNotificationToChat(pendingOrderId, pendingOrderNo, totalAmount, selectedPayment);
                    }
                    if (onNavigate) {
                        const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                        setTimeout(() => {
                            onNavigate(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'orders'));
                        }, 4000);
                    }
                }}
                amount={totalAmount}
                merchantName={stores?.store_name || storeSettings?.store_name || 'Our20s Collection'}
                currency="USD"
                orderId={pendingOrderId}
                paymentMethod={selectedPayment}
            />
        </div>
    );
};

