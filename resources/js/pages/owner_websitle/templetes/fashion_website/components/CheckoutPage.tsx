import React, { useState, useEffect, useMemo } from 'react';
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
    FiMap,
    FiSearch,
    FiTag,
    FiCreditCard,
    FiShoppingBag,
} from 'react-icons/fi';
import { toast } from '../utils/toast';
import { shippingAddressesService } from '@/api/owner/shippingAddresses';
import type { ShippingAddress } from '@/api/owner/shippingAddresses';
import { useAuth } from '../hooks/useAuth';
import { useOrderPending } from '../hooks/useOrderPending';
import { PopupPaymentKHQR } from './helpers/PopupPaymentKHQR';
import { PopOtpVerifyTele } from './helpers/otp/PopOtpVerifyTele';
import { PopVerifyOTPGmail } from './helpers/otp/PopVerifyOTPGmail';
import { couponsService, type CouponRow } from '@/api/owner/coupons';
import { ordersService } from '@/api/owner/orders';
import { chatService } from '@/api/owner/chat';
import { Store_setting } from '@/api/owner/stores';
import { resolveImageUrl } from '../utils/imageUtils';
import { deliveryMethodsService, type DeliveryMethod } from '@/api/owner/deliveryMethods';
import { deliveryZonesService, type DeliveryZone } from '@/api/owner/deliveryZones';
import { socialMediaService } from '@/api/owner/socialMedia';
import { FaTelegramPlane } from 'react-icons/fa';
import { paymentsService } from '@/api/owner/method/payments';

import abaLogo from '@/pages/main_website/Company_bank/aba.png';
import bakongLogo from '@/pages/main_website/Company_bank/bakong.png';
import acledaLogo from '@/pages/main_website/Company_bank/acleda.png';

import { useTranslation } from '../utils/translate';
import { ModelCoupon } from './helpers/ModelCoupon';
import { FASHION_ROUTES } from '../routes';
import { validateCheckoutForm } from '../request/FormCheckOutRequets';
import { type CheckoutValidationError } from '../validation/CheckoutValidationError';
import { useCustomerGuestCheckout } from '../hooks/useCustomerGuestCheckout';

import { List_Order_CheckoutTab } from './Checkout/List_Order_CheckoutTab';
import { Delivery_addressTab } from './Checkout/Delivery_addressTab';
import { PaymentTab } from './Checkout/PaymentTab';
import { SummaryOrder } from './Checkout/summaryorder';
import { openLocationMapModal } from './helpers/autoLocationCustomer';

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
    locale?: string;
}
// ─── Cambodian Cities ──────────────────────────────────────────────────────────
const CAMBODIA_CITIES = [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville',
    'Kampong Cham', 'Koh Kong', 'Kratie', 'Takéo', 'Kampot',
    'Pursat', 'Prey Veng', 'Svay Rieng', 'Kandal', 'Mondulkiri',
    'Ratanakiri', 'Stung Treng', 'Preah Vihear', 'Oddar Meanchey',
    'Pailin', 'Kep', 'Tbong Khmum', 'Banteay Meanchey',
    'Kampong Chhnang', 'Kampong Speu', 'Kampong Thom'
];

// ─── Map Matching Helper ────────────────────────────────────────────────────────
const findMatchingProvince = (addressObj: any): string => {
    if (!addressObj) return '';
    const fieldsToSearch = [
        addressObj.province,
        addressObj.state,
        addressObj.city,
        addressObj.town,
        addressObj.county,
        addressObj.municipality
    ];

    for (const val of fieldsToSearch) {
        if (!val) continue;
        const cleanVal = String(val).toLowerCase();

        if (cleanVal.includes('sihanouk') || cleanVal.includes('sihanoukville')) {
            return 'Sihanoukville';
        }

        // Find match in CAMBODIA_CITIES
        const matched = CAMBODIA_CITIES.find(city => {
            const cleanCity = city.toLowerCase().replace(/[\u0300-\u036f]/g, ""); // strip accents
            const cleanSearch = cleanVal.replace(/[\u0300-\u036f]/g, "");
            return cleanSearch.includes(cleanCity) || cleanCity.includes(cleanSearch);
        });

        if (matched) return matched;
    }
    return '';
};

// ─── Coordinate Distance & Polygon Matching Helpers ────────────────────────────
const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const parseWKTPolygon = (wkt: string): [number, number][] => {
    const match = wkt.match(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/i);
    if (!match) return [];
    const pointsStr = match[1].split(',');
    const points: [number, number][] = [];
    for (const p of pointsStr) {
        const coords = p.trim().split(/\s+/);
        if (coords.length >= 2) {
            const lng = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);
            if (!isNaN(lng) && !isNaN(lat)) {
                points.push([lat, lng]);
            }
        }
    }
    return points;
};

const isPointInPolygon = (lat: number, lng: number, polygon: [number, number][]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][1], yi = polygon[i][0];
        const xj = polygon[j][1], yj = polygon[j][0];

        const intersect = ((yi > lat) !== (yj > lat))
            && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

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

    const formatPhoneNumber = (phone: string) => {
        let clean = phone.trim().replace(/^0/, '');
        return `+855${clean}`;
    };

    const [form, setForm] = useState({
        first_name: addressToEdit?.first_name || '',
        last_name: addressToEdit?.last_name || '',
        telephone: addressToEdit ? formatInitialPhone(addressToEdit.telephone) : '',
        address: addressToEdit?.address || '',
        country: addressToEdit?.country || 'Cambodia',
        city_province: addressToEdit?.city_province || '',
        latitude: addressToEdit?.latitude || null as number | string | null,
        longitude: addressToEdit?.longitude || null as number | string | null,
    });
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    const handleAutoGetLocation = async () => {
        try {
            setFetchingLocation(true);
            const result = await openLocationMapModal(
                form.latitude ? parseFloat(String(form.latitude)) : null,
                form.longitude ? parseFloat(String(form.longitude)) : null
            );
            if (result) {
                setForm(prev => ({
                    ...prev,
                    address: result.address,
                    city_province: result.city_province || prev.city_province,
                    latitude: result.latitude,
                    longitude: result.longitude,
                }));
                toast.success('Location updated from map!');
            }
        } catch (err) {
            console.error('Map selection error:', err);
            toast.error('Failed to select location from map.');
        } finally {
            setFetchingLocation(false);
        }
    };

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.telephone || !form.address || !form.city_province) {
            toast.error('Telephone, City/Province, and Address are required.');
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
                latitude: form.latitude,
                longitude: form.longitude,
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
                    set_as_default: addressToEdit.set_as_default,
                    latitude: form.latitude,
                    longitude: form.longitude,
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
                    set_as_default: false,
                    latitude: form.latitude,
                    longitude: form.longitude,
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
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                Address <span className="text-red-400">(Required)</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleAutoGetLocation}
                                disabled={fetchingLocation}
                                className="text-[10px] font-bold text-indigo-650 hover:text-indigo-850 uppercase tracking-wider flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
                            >
                                <FiMapPin className="w-3.5 h-3.5 animate-pulse" /> Allow Location Auto
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={form.address}
                                onChange={set('address')}
                                placeholder="Enter address or click auto location"
                                className="w-full pl-3 pr-10 py-2.5 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                            />
                            <button
                                type="button"
                                onClick={handleAutoGetLocation}
                                disabled={fetchingLocation}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-indigo-650 border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors"
                                title="Use Current GPS Location"
                            >
                                {fetchingLocation ? (
                                    <span className="w-3.5 h-3.5 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <FiMapPin className="w-4 h-4 text-indigo-550" />
                                )}
                            </button>
                        </div>
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



                    {form.latitude && form.longitude && !isNaN(parseFloat(String(form.latitude))) && !isNaN(parseFloat(String(form.longitude))) && (
                        <div className="w-full h-32 border border-stone-200 rounded-[3px] overflow-hidden mt-1 relative">
                            <iframe
                                title="Selected Location Preview"
                                src={`https://maps.google.com/maps?q=${parseFloat(String(form.latitude))},${parseFloat(String(form.longitude))}&z=15&output=embed`}
                                className="w-full h-full border-none"
                                loading="lazy"
                            />
                            <div className="absolute top-2 right-2 bg-stone-900/80 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs">
                                Pinned Map Preview
                            </div>
                        </div>
                    )}

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
    locale,
}) => {
    const { isLoggedIn, user } = useAuth(stores?.id);
    const { t } = useTranslation(locale);

    const displayCartItems = cartItems && cartItems.length > 0
        ? cartItems.map(item => ({
            id: item.id || item.item?.id,
            name: item.name || item.item?.name || '',
            code: item.code || item.item?.sku || item.item?.code || '',
            variant: item.variant || [item.selectedSize, item.selectedColor].filter(Boolean).join(' / ') || '',
            qty: item.qty || 1,
            price: parseFloat(item.price || item.item?.price || '0'),
            image: item.selectedImage || resolveImageUrl(item.item?.display_image || item.item?.image) || ''
        }))
        : [];

    const subtotal = propSubtotal !== undefined
        ? propSubtotal
        : displayCartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    const [appliedCoupon, setAppliedCoupon] = useState<CouponRow | null>(null);

    /**
     * Calculates the coupon discount dynamically based on the subtotal and applied coupon.
     * Replicates the robust logic from useCoupon.ts.
     */
    const couponDiscount = useMemo(() => {
        // If no coupon is applied, fallback to the prop discount (if any)
        if (!appliedCoupon) return propDiscount || 0;

        // Validation: Minimum purchase requirement
        const minPurchase = appliedCoupon.minimum_purchase ? parseFloat(String(appliedCoupon.minimum_purchase)) : 0;
        if (subtotal < minPurchase) return 0;

        // Free delivery coupons are handled in deliveryFee, not here
        if (appliedCoupon.coupon_type === 'free_delivery') return 0;

        const discAmt = parseFloat(String(appliedCoupon.discount_amount));
        if (appliedCoupon.discount_type === 'percentage') {
            return (subtotal * discAmt) / 100;
        }

        // Flat amount discount capped at subtotal
        return Math.min(subtotal, discAmt);
    }, [appliedCoupon, subtotal, propDiscount]);

    const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
    const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod | null>(null);
    const [loadingDeliveryMethods, setLoadingDeliveryMethods] = useState(false);

    const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
    const [loadingDeliveryZones, setLoadingDeliveryZones] = useState(false);

    useEffect(() => {
        if (ownerUserId) {
            fetchDeliveryMethods();
            fetchDeliveryZones();
        }
    }, [ownerUserId]);

    const fetchDeliveryMethods = async () => {
        try {
            setLoadingDeliveryMethods(true);
            const data = await deliveryMethodsService.getPublicDeliveryMethods(ownerUserId);
            const activeMethods = (data || []).filter(d => d.is_active);
            setDeliveryMethods(activeMethods);
        } catch (err) {
            console.error('Failed to fetch delivery methods:', err);
        } finally {
            setLoadingDeliveryMethods(false);
        }
    };

    const fetchDeliveryZones = async () => {
        try {
            setLoadingDeliveryZones(true);
            const data = await deliveryZonesService.getPublicDeliveryZones(ownerUserId);
            setDeliveryZones(data || []);
        } catch (err) {
            console.error('Failed to fetch delivery zones:', err);
        } finally {
            setLoadingDeliveryZones(false);
        }
    };

    // ── Address Book state ──
    const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [showAddressBook, setShowAddressBook] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);

    useEffect(() => {
        if (isLoggedIn) {
            fetchAddresses();
        }
    }, [isLoggedIn]);

    const fetchAddresses = async () => {
        try {
            const data = await shippingAddressesService.getAddresses();
            setSavedAddresses(data);
            if (data.length > 0) {
                const defaultAddr = data.find(a => a.set_as_default) || data[0];
                setSelectedAddressId(defaultAddr.id);
            }
        } catch (error) {
            console.error('Failed to fetch addresses', error);
        }
    };

    const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId);

    // ── Store settings & checkout configs ──
    const [storeSettings, setStoreSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('store_settings');
            const parsed = saved ? JSON.parse(saved) : {};
            // Merge stores prop as baseline settings
            return { ...stores, ...parsed };
        } catch {
            return stores || {};
        }
    });

    const checkoutDeliveryAddress = storeSettings?.checkout_delivery_address || 'open';
    const checkoutPreferredContact = storeSettings?.checkout_preferred_contact || 'open';
    const preferredContactPhone = storeSettings?.preferred_contact_phone !== false && storeSettings?.preferred_contact_phone !== 'false' && storeSettings?.preferred_contact_phone !== '0';
    const preferredContactTelegram = storeSettings?.preferred_contact_telegram !== false && storeSettings?.preferred_contact_telegram !== 'false' && storeSettings?.preferred_contact_telegram !== '0';
    const preferredContactWhatsapp = storeSettings?.preferred_contact_whatsapp !== false && storeSettings?.preferred_contact_whatsapp !== 'false' && storeSettings?.preferred_contact_whatsapp !== '0';

    const isGuestCheckoutEnabled = useMemo(() => {
        return storeSettings?.guest_checkout !== false && storeSettings?.guest_checkout !== 'false';
    }, [storeSettings]);

    // ── Custom address states & refs ──
    const {
        customCustomerName,
        setCustomCustomerName,
        customCustomerPhone,
        setCustomCustomerPhone,
        customCustomerAddress,
        setCustomCustomerAddress,
        clearGuestCheckoutCache,
    } = useCustomerGuestCheckout();
    const [customLatitude, setCustomLatitude] = useState<string>('');
    const [customLongitude, setCustomLongitude] = useState<string>('');

    const customNameRef = React.useRef<HTMLInputElement>(null);
    const customPhoneRef = React.useRef<HTMLInputElement>(null);
    const customAddressRef = React.useRef<HTMLInputElement>(null);

    const matchingZone = useMemo(() => {
        let lat: number | null = null;
        let lng: number | null = null;

        if (checkoutDeliveryAddress === 'close') {
            if (customLatitude && customLongitude) {
                lat = parseFloat(String(customLatitude));
                lng = parseFloat(String(customLongitude));
            }
        } else {
            if (selectedAddress && selectedAddress.latitude && selectedAddress.longitude) {
                lat = parseFloat(String(selectedAddress.latitude));
                lng = parseFloat(String(selectedAddress.longitude));
            }
        }

        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
            return null;
        }

        for (const zone of deliveryZones) {
            if (!zone.is_active) continue;

            if (!zone.type || zone.type === 'radius') {
                const centerLat = zone.center_lat ? parseFloat(String(zone.center_lat)) : null;
                const centerLng = zone.center_lng ? parseFloat(String(zone.center_lng)) : null;
                const radiusKm = zone.radius_km ? parseFloat(String(zone.radius_km)) : null;

                if (centerLat !== null && centerLng !== null && radiusKm !== null) {
                    const distance = getHaversineDistance(lat, lng, centerLat, centerLng);
                    if (distance <= radiusKm) {
                        return zone;
                    }
                }
            } else if (zone.type === 'polygon' && zone.polygon_coordinates) {
                const polygon = parseWKTPolygon(zone.polygon_coordinates);
                if (polygon.length > 0 && isPointInPolygon(lat, lng, polygon)) {
                    return zone;
                }
            }
        }
        return null;
    }, [selectedAddress, customLatitude, customLongitude, checkoutDeliveryAddress, deliveryZones]);

    const filteredDeliveryMethods = useMemo(() => {
        if (matchingZone) {
            // Local customer: Show ONLY methods restricted to this matching zone
            return (deliveryMethods || []).filter(m => m.delivery_zone_id === matchingZone.id);
        }
        // Out of Delivery Zone: Show Nationwide (Global) methods
        return (deliveryMethods || []).filter(m => !m.delivery_zone_id);
    }, [deliveryMethods, matchingZone]);

    useEffect(() => {
        if (selectedDeliveryMethod) {
            const stillValid = filteredDeliveryMethods.some(m => m.id === selectedDeliveryMethod.id);
            if (!stillValid) {
                setSelectedDeliveryMethod(null);
            }
        }
    }, [filteredDeliveryMethods]);

    const deliveryFee = useMemo(() => {
        // Validation: Free delivery coupon (Continuous validation) takes absolute priority
        if (appliedCoupon?.coupon_type === 'free_delivery') {
            const minPurchase = appliedCoupon.minimum_purchase ? parseFloat(String(appliedCoupon.minimum_purchase)) : 0;
            if (subtotal >= minPurchase) return 0;
        }

        if (selectedDeliveryMethod) {
            const isPickup = selectedDeliveryMethod.code?.toLowerCase().includes('pickup') ||
                selectedDeliveryMethod.code?.toLowerCase().includes('pick-up') ||
                selectedDeliveryMethod.name?.toLowerCase().includes('pickup') ||
                selectedDeliveryMethod.name?.toLowerCase().includes('pick up');
            if (!isPickup && matchingZone) {
                return parseFloat(String(matchingZone.delivery_fee)) || 0;
            }
            return parseFloat(String(selectedDeliveryMethod.cost)) || 0;
        }

        if (propDeliveryFee !== undefined) return propDeliveryFee;

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
    }, [propDeliveryFee, stores, subtotal, appliedCoupon, selectedDeliveryMethod, matchingZone]);

    // ── Payment & Contact state ──
    const [rawPaymentMethods, setRawPaymentMethods] = useState<any[]>([]);

    useEffect(() => {
        if (ownerUserId) {
            paymentsService.getActiveMethods(ownerUserId)
                .then(setRawPaymentMethods)
                .catch(err => console.error('Failed to fetch payment methods:', err));
        }
    }, [ownerUserId]);

    const paymentMethods = useMemo(() => {
        return rawPaymentMethods.map(p => {
            let logoEl = null;
            if (p.key === 'aba') {
                logoEl = (
                    <img
                        src={abaLogo}
                        alt="ABA Bank"
                        className="w-10 h-7 rounded object-contain bg-white border border-stone-200 p-[2px]"
                    />
                );
            } else if (p.key === 'bakong') {
                logoEl = (
                    <img
                        src={bakongLogo}
                        alt="Bakong KHQR"
                        className="w-10 h-7 rounded object-contain bg-white border border-stone-200 p-[2px]"
                    />
                );
            } else if (p.key === 'acleda') {
                logoEl = (
                    <img
                        src={acledaLogo}
                        alt="ACLEDA PAY"
                        className="w-10 h-7 rounded object-contain bg-white border border-stone-200 p-[2px]"
                    />
                );
            } else if (p.logo && p.logo.startsWith('emoji:')) {
                logoEl = (
                    <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-stone-100 border border-stone-200">
                        <span className="text-[14px]">{p.logo.substring(6)}</span>
                    </div>
                );
            } else if (p.logo) {
                logoEl = (
                    <img
                        src={p.logo}
                        alt={p.name}
                        className="w-10 h-7 rounded object-contain bg-white border border-stone-200 p-[2px]"
                    />
                );
            } else {
                logoEl = (
                    <div className="w-10 h-7 rounded overflow-hidden shrink-0 flex items-center justify-center bg-stone-100 border border-stone-200">
                        <span className="text-[10px] font-bold">{p.name.charAt(0)}</span>
                    </div>
                );
            }

            let descEl = p.desc;
            if (p.key === 'card') {
                descEl = (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] bg-blue-50 text-blue-700 font-bold px-0.5 rounded">VISA</span>
                        <span className="text-[8px] bg-red-50 text-red-700 font-bold px-0.5 rounded">MC</span>
                        <span className="text-[8px] bg-green-50 text-green-700 font-bold px-0.5 rounded">JCB</span>
                    </div>
                );
            } else if (p.key === 'transfer') {
                descEl = <span className="font-kuntomruy">ទូទាត់តាមគណនីធនាគារ</span>;
            } else if (p.key === 'cod') {
                descEl = <span className="font-kuntomruy">បង់ប្រាក់នៅពេលទទួលបានទំនិញ</span>;
            }

            return {
                key: p.key,
                logo: logoEl,
                name: p.name,
                desc: descEl
            };
        });
    }, [rawPaymentMethods]);

    const [selectedPayment, setSelectedPayment] = useState<string>('');
    const [preferredContact, setPreferredContact] = useState<string>('');
    const [contactInput, setContactInput] = useState<string>('');



    const addressBtnRef = React.useRef<HTMLButtonElement>(null);
    const preferredContactRef = React.useRef<HTMLButtonElement>(null);
    const contactInputRef = React.useRef<HTMLInputElement>(null);
    const paymentRef = React.useRef<HTMLInputElement>(null);

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [validationError, setValidationError] = useState<CheckoutValidationError | null>(null);

    const validateStep2 = () => {
        if (checkoutDeliveryAddress === 'close') {
            if (!customCustomerName || !customCustomerName.trim()) {
                const err = { field: 'customCustomerName', message: 'Please enter your name.' };
                setValidationError(err as any);
                toast.error(err.message);
                customNameRef.current?.focus();
                customNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
            if (!customCustomerPhone || !customCustomerPhone.trim()) {
                const err = { field: 'customCustomerPhone', message: 'Please enter your phone number or email address.' };
                setValidationError(err as any);
                toast.error(err.message);
                customPhoneRef.current?.focus();
                customPhoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
            const trimmed = customCustomerPhone.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^[+]*[0-9\s\-()]{6,20}$/;
            const isEmail = trimmed.includes('@');

            if (isEmail) {
                if (!emailRegex.test(trimmed)) {
                    const err = { field: 'customCustomerPhone', message: 'Please enter a valid email address.' };
                    setValidationError(err as any);
                    toast.error(err.message);
                    customPhoneRef.current?.focus();
                    customPhoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
            } else {
                if (!phoneRegex.test(trimmed)) {
                    const err = { field: 'customCustomerPhone', message: 'Please enter a valid phone number.' };
                    setValidationError(err as any);
                    toast.error(err.message);
                    customPhoneRef.current?.focus();
                    customPhoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
            }
            if (!customCustomerAddress || !customCustomerAddress.trim()) {
                const err = { field: 'customCustomerAddress', message: 'Please enter your delivery address.' };
                setValidationError(err as any);
                toast.error(err.message);
                customAddressRef.current?.focus();
                customAddressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
        } else {
            if (!selectedAddress) {
                const err = { field: 'address', message: 'Please select a delivery address.' };
                setValidationError(err as any);
                toast.error(err.message);
                addressBtnRef.current?.focus();
                addressBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
        }

        if (checkoutPreferredContact !== 'close') {
            if (!preferredContact) {
                const err = { field: 'preferredContact', message: 'Please select your preferred contact line.' };
                setValidationError(err as any);
                toast.error(err.message);
                preferredContactRef.current?.focus();
                preferredContactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
            if (!contactInput.trim()) {
                const err = { field: 'contactInput', message: 'Please enter your contact information.' };
                setValidationError(err as any);
                toast.error(err.message);
                contactInputRef.current?.focus();
                contactInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
        }
        if (filteredDeliveryMethods.length === 0) {
            const err = { field: 'address', message: 'We do not deliver to this location. Please choose another shipping address or pin location.' };
            setValidationError(err as any);
            toast.error(err.message);
            return false;
        }
        if (!selectedDeliveryMethod) {
            const err = { field: 'deliveryMethod', message: 'Please select a delivery method.' };
            setValidationError(err as any);
            toast.error(err.message);
            return false;
        }
        setValidationError(null);
        return true;
    };

    const validateStep3 = () => {
        if (!selectedPayment) {
            const err = { field: 'payment', message: 'Please select a payment method.' };
            setValidationError(err as any);
            toast.error(err.message);
            paymentRef.current?.focus();
            paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        setValidationError(null);
        return true;
    };

    const handleSubtotalAction = () => {
        if (currentStep === 1) {
            if (displayCartItems.length === 0) {
                toast.error('Your shopping bag is empty.');
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (validateStep2()) {
                setCurrentStep(3);
            }
        } else if (currentStep === 3) {
            if (validateStep2() && validateStep3()) {
                executeOrderSubmission();
            }
        }
    };

    useEffect(() => {
        if (validationError) {
            const currentErr = validateCheckoutForm({
                hasSelectedAddress: !!selectedAddress,
                preferredContact,
                contactInput,
                selectedPayment,
                isGuestCheckoutEnabled,
                hasSelectedDeliveryMethod: !!selectedDeliveryMethod,
                checkoutDeliveryAddress,
                checkoutPreferredContact,
                customCustomerName,
                customCustomerPhone,
                customCustomerAddress
            });
            if (!currentErr || currentErr.field !== validationError.field) {
                setValidationError(currentErr);
            }
        }
    }, [
        selectedAddress,
        preferredContact,
        contactInput,
        selectedPayment,
        isGuestCheckoutEnabled,
        selectedDeliveryMethod,
        checkoutDeliveryAddress,
        checkoutPreferredContact,
        customCustomerName,
        customCustomerPhone,
        customCustomerAddress,
        validationError
    ]);

    const [usePoints] = useState<boolean>(false);
    const [claimCode, setClaimCode] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [isVoucherDrawerOpen, setIsVoucherDrawerOpen] = useState(false);
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [copiedCode, setCopiedCode] = useState<string>('');
    const [couponUseCounts, setCouponUseCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const loadCheckoutData = async () => {
            try {
                // 1. Resolve coupons
                if (propCoupons !== undefined && propCoupons !== null) {
                    setCoupons(propCoupons);
                } else {
                    const vendorId = ownerUserId || stores?.created_by;
                    const data = await couponsService.getCoupons(vendorId ? { created_by: vendorId } : undefined);
                    const activeCoupons = data.filter(
                        c => c.is_active && (!c.customer_id || c.customer_id === user?.id)
                    );
                    setCoupons(activeCoupons);
                }

                // 2. Load order counts if logged in
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
                console.error('Failed to load coupons or orders in CheckoutPage', err);
                setCoupons([]);
            }
        };
        loadCheckoutData();
    }, [stores, user, propCoupons, ownerUserId, isLoggedIn]);

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

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => {
            setCopiedCode(prev => (prev === code ? '' : prev));
        }, 1500);
    };

    // Sync selected payment if list changes (only clear if selected method is no longer available)
    useEffect(() => {
        if (selectedPayment && paymentMethods.length > 0) {
            if (!paymentMethods.some(m => m.key === selectedPayment)) {
                setSelectedPayment('');
            }
        }
    }, [paymentMethods, selectedPayment]);

    // Listen for settings updates from parent App component
    useEffect(() => {
        const handleSettingsUpdate = () => {
            const updated = localStorage.getItem('store_settings');
            if (updated) {
                try {
                    setStoreSettings(JSON.parse(updated));
                } catch (e) {
                    console.error('Failed to parse updated store settings', e);
                }
            }
        };
        window.addEventListener('settings_updated', handleSettingsUpdate);
        return () => window.removeEventListener('settings_updated', handleSettingsUpdate);
    }, []);

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

    const { submitOrder, isSubmitting: isCheckingOut } = useOrderPending();
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [isKHQROpen, setIsKHQROpen] = useState(false);
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [otpMode, setOtpMode] = useState<'telegram' | 'gmail'>('telegram');
    const [contactEmail, setContactEmail] = useState<string>('');
    const [pendingOrderId, setPendingOrderId] = useState<number | string | null>(null);
    const [pendingOrderNo, setPendingOrderNo] = useState<string | null>(null);
    const [telegramBotLink, setTelegramBotLink] = useState<string | null>(null);

    const sendOrderNotificationToChat = async (orderId: number | string, orderNo: string | null, totalAmt: number, paymentMethod: string) => {
        if (!isLoggedIn || !user || !ownerUserId) return;

        // Check if Send Chat Order is enabled in settings
        const localSettings = Store_setting();
        const activeSettings = { ...(stores || {}), ...(localSettings || {}) };
        const isSendChatOrderEnabled = activeSettings?.send_chat_order !== 'false' && activeSettings?.send_chat_order !== false;

        if (!isSendChatOrderEnabled) {
            console.log('[Checkout] Send Chat Order is disabled. Skipping chat notification.');
            return;
        }

        try {
            const vendorId = ownerUserId || stores?.created_by || storeSettings?.created_by;
            if (!vendorId) return;

            // Start/get conversation
            const convo = await chatService.startConversation(vendorId);
            if (convo && convo.id) {
                const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                const orderHistoryUrl = `{{BASE_URL}}/profile?id=${ownerUserId}&store=${storeSlug}&tab=orders&order_no=${orderNo || orderId}`;

                const messageBody = `${t('checkout.chatOrderPlaced')}\n\n${t('checkout.chatOrderNo')}: #${orderNo || orderId}\n${t('checkout.chatTotalAmount')}: $${Number(totalAmt).toFixed(2)}\n${t('checkout.chatPaymentMethod')}: ${paymentMethod.toUpperCase()}\n\n${t('checkout.chatClickLink')}\n${orderHistoryUrl}`;

                await chatService.sendMessage(convo.id, messageBody, 'text');

            }
        } catch (err) {
            console.error('[Checkout] Failed to send chat notification for order:', err);
        }
    };

    const executeOrderSubmission = async () => {
        // Prepare order data with strict validation
        const validItems = (cartItems || []).map(ci => {
            // Priority: ci.item.id -> ci.productId -> parse from ci.id
            let menuItemId = ci.item?.id || ci.productId;

            if (!menuItemId && ci.id && !String(ci.id).startsWith('mock')) {
                const parts = String(ci.id).split('-');
                const parsedId = parseInt(parts[0]);
                if (!isNaN(parsedId)) menuItemId = parsedId;
            }

            // Extract variantId if present
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

        // Resolve the authoritative store ID
        // Priority: stores.id -> storeSettings.id -> ownerUserId
        const resolvedStoreId = Number(stores?.id || storeSettings?.id || ownerUserId);

        const orderNotes = selectedDeliveryMethod
            ? `[Delivery: ${selectedDeliveryMethod.name}] ${note || ''}`.trim()
            : (note || '');

        const rawPhone = checkoutDeliveryAddress === 'close'
            ? customCustomerPhone
            : (checkoutPreferredContact === 'close' ? (selectedAddress?.telephone || '') : contactInput);

        const formatPhone = (val: string) => {
            const trimmed = val.trim();
            if (trimmed.includes('@')) return trimmed;
            const clean = trimmed.replace(/[^0-9]/g, '');
            if (!clean) return trimmed;
            if (clean.startsWith('855')) return '+' + clean;
            if (clean.startsWith('0')) return '+855' + clean.slice(1);
            return '+855' + clean;
        };

        const resolvedPhone = rawPhone ? formatPhone(rawPhone) : '';

        const orderData = {
            store_id: resolvedStoreId,
            customer_id: isLoggedIn && user?.id ? Number(user.id) : null,
            subtotal: Number(subtotal.toFixed(2)),
            total_amount: Number(totalAmount.toFixed(2)),
            customer_name: checkoutDeliveryAddress === 'close'
                ? customCustomerName
                : (selectedAddress ? `${selectedAddress.first_name} ${selectedAddress.last_name}` : 'Guest Customer'),
            customer_phone: resolvedPhone,
            customer_address: checkoutDeliveryAddress === 'close'
                ? customCustomerAddress
                : (selectedAddress
                    ? `${selectedAddress.address}, ${selectedAddress.city_province}, ${selectedAddress.country}`
                    : 'Guest Address'),
            shipping_address_id: (isLoggedIn && selectedAddress && checkoutDeliveryAddress !== 'close') ? selectedAddress.id : null,
            latitude: checkoutDeliveryAddress === 'close' ? (customLatitude ? parseFloat(customLatitude) : null) : (selectedAddress?.latitude || null),
            longitude: checkoutDeliveryAddress === 'close' ? (customLongitude ? parseFloat(customLongitude) : null) : (selectedAddress?.longitude || null),
            payment_method: selectedPayment || 'cod',
            notes: orderNotes,
            items: validItems,
            delivery_fee: Number(deliveryFee.toFixed(2)),
            shipping_fee: Number(deliveryFee.toFixed(2)),
            discount_amount: Number(totalDiscount.toFixed(2)),
            coupon_code: appliedCoupon?.code || '',
        };

        console.log('[Checkout] Final Store ID:', resolvedStoreId);
        console.log('[Checkout] Submitting Order Data:', orderData);

        await submitOrder(orderData as any, (order) => {
            setPendingOrderId(order.id);
            setPendingOrderNo(order.order_no || null);
            if (order.telegram_bot_link) {
                setTelegramBotLink(order.telegram_bot_link);
            }

            if (order.otp_required) {
                const isEmailInput = rawPhone ? rawPhone.includes('@') : false;
                if (isEmailInput) {
                    setOtpMode('gmail');
                    setContactEmail(rawPhone);
                } else {
                    setOtpMode('telegram');
                }
                setIsOtpOpen(true);
                return;
            }

            // If OTP is not required
            if (selectedPayment === 'aba' || selectedPayment === 'bakong') {
                setIsKHQROpen(true);
                return;
            }

            // Clear cart immediately
            if (clearCart) clearCart();
            clearGuestCheckoutCache();

            // Send chat notification
            sendOrderNotificationToChat(order.id, order.order_no || null, order.total_amount || totalAmount, selectedPayment || 'cod');

            // Show success UI
            setOrderSuccess(true);

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('aura_order_placed', { detail: order }));
        });
    };

    const handleCheckout = async () => {
        if (validateStep2() && validateStep3()) {
            await executeOrderSubmission();
        }
    };

    // Calculations
    const totalDiscount = couponDiscount + (usePoints ? 2.00 : 0);
    const totalAmount = Math.max(0, subtotal + deliveryFee - totalDiscount);

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
                    className="mt-6 px-6 py-3 bg-stone-900 hover:bg-stone-850 text-white font-black text-xs uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors"
                >
                    Login / Register
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 font-kuntomruy pb-16 relative">

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Sticky persistent Subtotal/Summary Card on Desktop */}
                <section className="hidden lg:block lg:col-span-5">
                    <SummaryOrder
                        claimCode={claimCode}
                        setClaimCode={setClaimCode}
                        appliedCoupon={appliedCoupon}
                        setAppliedCoupon={setAppliedCoupon}
                        handleApplyCode={handleApplyCode}
                        setIsVoucherDrawerOpen={setIsVoucherDrawerOpen}
                        subtotal={subtotal}
                        totalDiscount={totalDiscount}
                        deliveryFee={deliveryFee}
                        stores={stores}
                        storeSettings={storeSettings}
                        totalAmount={totalAmount}
                        isCheckingOut={isCheckingOut}
                        currentStep={currentStep}
                        displayCartItems={displayCartItems}
                        selectedPayment={selectedPayment}
                        handleSubtotalAction={handleSubtotalAction}
                        coupons={coupons}
                    />
                </section>

                {/* RIGHT COLUMN: Stepper Tabs */}
                <section className="lg:col-span-7 space-y-6">
                    {/* Tab 1: Shopping Bag Order List */}
                    <List_Order_CheckoutTab
                        items={displayCartItems}
                        subtotal={subtotal}
                        isLocked={currentStep > 1}
                        onNext={() => setCurrentStep(2)}
                        onEdit={() => setCurrentStep(1)}
                        stores={stores}
                        ownerUserId={ownerUserId}
                        onNavigate={onNavigate}
                    />

                    {/* Tab 2: Delivery Address & Preferred Contact */}
                    {currentStep >= 2 ? (
                        <Delivery_addressTab
                            selectedAddress={selectedAddress}
                            savedAddresses={savedAddresses}
                            onSelectAddress={(id) => {
                                setSelectedAddressId(id);
                            }}
                            showAddressBook={() => setShowAddressBook(true)}
                            preferredContact={preferredContact}
                            setPreferredContact={setPreferredContact}
                            contactInput={contactInput}
                            setContactInput={setContactInput}
                            validationError={validationError}
                            isLocked={currentStep > 2}
                            onNext={() => {
                                if (validateStep2()) {
                                    setCurrentStep(3);
                                }
                            }}
                            onEdit={() => setCurrentStep(2)}
                            isLoggedIn={isLoggedIn}
                            setShowAddModal={setShowAddModal}
                            addressBtnRef={addressBtnRef}
                            preferredContactRef={preferredContactRef}
                            contactInputRef={contactInputRef}
                            deliveryMethods={filteredDeliveryMethods}
                            selectedDeliveryMethod={selectedDeliveryMethod}
                            onSelectDeliveryMethod={setSelectedDeliveryMethod}
                            loadingDeliveryMethods={loadingDeliveryMethods}
                            matchingZone={matchingZone}

                            // Custom delivery closed variables
                            checkoutDeliveryAddress={checkoutDeliveryAddress}
                            checkoutPreferredContact={checkoutPreferredContact}
                            preferredContactPhone={preferredContactPhone}
                            preferredContactTelegram={preferredContactTelegram}
                            preferredContactWhatsapp={preferredContactWhatsapp}
                            customCustomerName={customCustomerName}
                            setCustomCustomerName={setCustomCustomerName}
                            customCustomerPhone={customCustomerPhone}
                            setCustomCustomerPhone={setCustomCustomerPhone}
                            customCustomerAddress={customCustomerAddress}
                            setCustomCustomerAddress={setCustomCustomerAddress}
                            customLatitude={customLatitude}
                            setCustomLatitude={setCustomLatitude}
                            customLongitude={customLongitude}
                            setCustomLongitude={setCustomLongitude}
                            customNameRef={customNameRef}
                            customPhoneRef={customPhoneRef}
                            customAddressRef={customAddressRef}
                        />
                    ) : (
                        <div className="bg-white p-5 rounded-sm border border-stone-200/60 shadow-2xs flex items-center justify-between opacity-60 cursor-not-allowed select-none">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 shrink-0 font-bold text-xs">
                                    2
                                </div>
                                <div>
                                    <h2 className="text-xs font-black text-stone-400 uppercase tracking-widest">
                                        2. Delivery Address
                                    </h2>
                                    <p className="text-[11px] text-stone-400 font-bold mt-0.5">
                                        Enter delivery details and preferred contact line
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Payment Selection & Notes */}
                    <PaymentTab
                        selectedPayment={selectedPayment}
                        setSelectedPayment={setSelectedPayment}
                        paymentMethods={paymentMethods}
                        note={note}
                        setNote={setNote}
                        isCheckingOut={isCheckingOut}
                        onSubmit={handleCheckout}
                        validationError={validationError}
                        paymentRef={paymentRef}
                        isActive={currentStep === 3}
                        onEdit={() => setCurrentStep(3)}
                    />
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
                    clearGuestCheckoutCache();
                    setOrderSuccess(true);
                    if (pendingOrderId) {
                        window.dispatchEvent(new CustomEvent('aura_order_placed', { detail: { id: pendingOrderId } }));
                        sendOrderNotificationToChat(pendingOrderId, pendingOrderNo, totalAmount, selectedPayment);
                    }
                }}
                amount={totalAmount}
                merchantName={stores?.store_name || storeSettings?.store_name || 'Our20s Collection'}
                currency="USD"
                orderId={pendingOrderId}
                paymentMethod={selectedPayment}
            />

            {/* Gmail OTP Verification Modal */}
            {isOtpOpen && otpMode === 'gmail' && createPortal(
                <PopVerifyOTPGmail
                    isOpen={isOtpOpen}
                    orderId={pendingOrderId}
                    email={contactEmail}
                    onClose={() => {
                        setIsOtpOpen(false);
                    }}
                    onSuccess={(token) => {
                        setIsOtpOpen(false);

                        // If token is returned, store it and trigger login
                        if (token) {
                            localStorage.setItem('aura_customer_token', token);
                            window.dispatchEvent(new Event('aura_token_changed'));
                        }

                        // Now finalize checkout flow
                        if (selectedPayment === 'aba' || selectedPayment === 'bakong') {
                            setIsKHQROpen(true);
                            return;
                        }

                        if (clearCart) clearCart();
                        clearGuestCheckoutCache();

                        sendOrderNotificationToChat(pendingOrderId!, pendingOrderNo, totalAmount, selectedPayment || 'cod');
                        setOrderSuccess(true);
                    }}
                />,
                document.body
            )}

            {/* Telegram OTP Verification Modal */}
            {isOtpOpen && otpMode === 'telegram' && createPortal(
                <PopOtpVerifyTele
                    isOpen={isOtpOpen}
                    orderId={pendingOrderId}
                    telegramLink={telegramBotLink}
                    onClose={() => {
                        setIsOtpOpen(false);
                    }}
                    onSuccess={(token) => {
                        setIsOtpOpen(false);

                        // If token is returned, store it and trigger login
                        if (token) {
                            localStorage.setItem('aura_customer_token', token);
                            window.dispatchEvent(new Event('aura_token_changed'));
                        }

                        // Now finalize checkout flow
                        if (selectedPayment === 'aba' || selectedPayment === 'bakong') {
                            setIsKHQROpen(true);
                            return;
                        }

                        if (clearCart) clearCart();
                        clearGuestCheckoutCache();

                        sendOrderNotificationToChat(pendingOrderId!, pendingOrderNo, totalAmount, selectedPayment || 'cod');
                        setOrderSuccess(true);
                    }}
                />,
                document.body
            )}

            {/* Order Success Popup Modal */}
            {orderSuccess && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/45 backdrop-blur-2xs p-4 font-kuntomruy animate-fade-in">
                    <div
                        className="fixed inset-0 cursor-default"
                        onClick={() => {
                            // Keep modal open until they choose an action
                        }}
                    />
                    <div className="bg-white p-8 sm:p-12 rounded-[6px] border border-stone-200/60 shadow-2xl max-w-md w-full text-center space-y-6 relative z-10 animate-modal-zando">
                        <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center mx-auto text-white shadow-lg ">
                            <FiCheck className="w-10 h-10 stroke-[3]" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-xl font-black text-stone-900 uppercase tracking-widest">{t('checkout.orderPlaced')}</h1>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                {t('checkout.thankYou')}
                            </p>
                        </div>

                        {/* Order Status Timeline */}
                        <div className="pt-6 border-t border-stone-100 text-left space-y-4">
                            <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest text-center mb-5">
                                {t('checkout.orderStatusTimeline')}
                            </h3>

                            <div className="relative pl-6 border-l-2 border-stone-900 space-y-5 ml-4">
                                {/* Step 1 */}
                                <div className="relative">
                                    <div className="absolute -left-[33px] top-0.5 w-4.5 h-4.5 bg-stone-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                                        <FiCheck className="w-2.5 h-2.5 stroke-[4]" />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-black text-stone-900 uppercase tracking-wider">{t('checkout.orderPlaced').replace('!', '')}</p>
                                        <p className="text-stone-500 text-[10px] font-medium">{t('checkout.placedDesc')}</p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="relative">
                                    <div className="absolute -left-[33px] top-0.5 w-4.5 h-4.5 bg-stone-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                                        <FiCheck className="w-2.5 h-2.5 stroke-[4]" />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-black text-stone-900 uppercase tracking-wider">{t('checkout.addressVerified')}</p>
                                        <p className="text-stone-500 text-[10px] font-medium">{t('checkout.addressVerifiedDesc')}</p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="relative">
                                    <div className="absolute -left-[33px] top-0.5 w-4.5 h-4.5 bg-stone-150 text-stone-900 rounded-full flex items-center justify-center border-2 border-stone-900 shadow-xs">
                                        <span className="w-2.5 h-2.5 bg-[#E61E25] rounded-full animate-ping absolute" />
                                        <span className="w-2.5 h-2.5 bg-[#E61E25] rounded-full" />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                                            {t('checkout.processingOrder')}
                                        </p>
                                        <p className="text-stone-500 text-[10px] font-medium">{t('checkout.processingOrderDesc')}</p>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="relative">
                                    <div className="absolute -left-[33px] top-0.5 w-4.5 h-4.5 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center border-2 border-stone-200">
                                        <span className="w-1.5 h-1.5 bg-stone-200 rounded-full" />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-black text-stone-300 uppercase tracking-wider">{t('checkout.outForDelivery')}</p>
                                        <p className="text-stone-300 text-[10px] font-medium">{t('checkout.outForDeliveryDesc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-stone-100 flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                                    const orderParam = pendingOrderNo ? `&order_no=${pendingOrderNo}` : (pendingOrderId ? `&order_id=${pendingOrderId}` : '');
                                    const targetUrl = FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'orders') + orderParam;
                                    onNavigate?.(targetUrl);
                                }}
                                className="w-full py-4 bg-stone-900 hover:bg-stone-850 text-white rounded-[3px] font-black text-xs uppercase tracking-widest border-none transition-all cursor-pointer shadow-sm focus:outline-none"
                            >
                                {t('checkout.viewDetail')}
                            </button>
                            {telegramBotLink ? (
                                <a
                                    href={telegramBotLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 bg-white border border-[#24A1DE] hover:bg-[#24A1DE]/5 text-[#24A1DE] rounded-[3px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 text-center decoration-none focus:outline-none"
                                >
                                    <FaTelegramPlane className="w-4 h-4 shrink-0 text-[#24A1DE]" />
                                    {locale === 'km' ? 'ឆែកស្ថានភាពតាម Telegram' : 'Check Status via Telegram'}
                                </a>
                            ) : (
                                <button
                                    onClick={() => {
                                        const storeSlug = (stores?.store_name || storeSettings?.store_name || 'store').replace(/\s+/g, '_');
                                        onNavigate?.(FASHION_ROUTES.getProfile(ownerUserId, storeSlug, 'chat'));
                                    }}
                                    className="w-full py-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 rounded-[3px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer focus:outline-none"
                                >
                                    {t('checkout.chatToStore')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
            
            {/* Mobile Layout: Sleek Sticky Bottom Action Bar */}
            <div className="lg:hidden sticky bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-150">
                <SummaryOrder
                    claimCode={claimCode}
                    setClaimCode={setClaimCode}
                    appliedCoupon={appliedCoupon}
                    setAppliedCoupon={setAppliedCoupon}
                    handleApplyCode={handleApplyCode}
                    setIsVoucherDrawerOpen={setIsVoucherDrawerOpen}
                    subtotal={subtotal}
                    totalDiscount={totalDiscount}
                    deliveryFee={deliveryFee}
                    stores={stores}
                    storeSettings={storeSettings}
                    totalAmount={totalAmount}
                    isCheckingOut={isCheckingOut}
                    currentStep={currentStep}
                    displayCartItems={displayCartItems}
                    selectedPayment={selectedPayment}
                    handleSubtotalAction={handleSubtotalAction}
                    coupons={coupons}
                />
            </div>
        </div>
    );
};

