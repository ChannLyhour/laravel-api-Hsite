import React, { useState, useEffect } from 'react';
import {
    FiMapPin, FiPlus, FiEdit2, FiArrowLeft,
    FiPhone, FiChevronDown, FiGlobe, FiTrash2,
    FiCheckCircle, FiInfo
} from 'react-icons/fi';
import { toast } from '../../utils/toast';
import { shippingAddressesService, type ShippingAddress, type ShippingAddressPayload } from '@/api/owner/shippingAddresses';
import { useTranslation } from '../../utils/translate';
import { openLocationMapModal } from '../helpers/autoLocationCustomer';
import { Store_setting } from '@/api/owner/stores';

const CITIES = [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville',
    'Kampot', 'Kep', 'Kandal', 'Kampong Cham', 'Kampong Speu',
    'Kratie', 'Mondulkiri', 'Preah Vihear', 'Prey Veng', 'Pursat',
    'Ratanakiri', 'Stung Treng', 'Svay Rieng', 'Takeo', 'Tbong Khmum'
];

const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    let clean = phone.trim();

    if (clean.startsWith('+') && !clean.startsWith('+855')) {
        return clean;
    }

    clean = clean.replace(/^(\+?855\s*)+/, '');

    if (clean.startsWith('0')) {
        clean = clean.slice(1);
    }

    return `+855 ${clean}`;
};

interface ShippingAddressTabProps {
    user: any;
    locale?: string;
}

export const ShippingAddressTab: React.FC<ShippingAddressTabProps> = ({ user, locale }) => {
    const { t } = useTranslation(locale);
    const storeSettings = Store_setting();
    const checkoutDeliveryAddress = storeSettings?.checkout_delivery_address || 'open';

    if (checkoutDeliveryAddress === 'close') {
        return (
            <div className="py-20 text-center space-y-4 max-w-md mx-auto animate-fade-in font-sans">
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto border border-stone-100/50">
                    <FiMapPin className="w-5 h-5 text-stone-300" />
                </div>
                <div className="space-y-1.5 text-center">
                    <p className="text-[11px] font-black text-stone-900 uppercase tracking-widest">
                        Shipping Address Disabled
                    </p>
                    <p className="text-[10px] text-stone-400 font-semibold leading-relaxed">
                        The store owner has disabled shipping addresses for this website. You do not need to configure delivery locations.
                    </p>
                </div>
            </div>
        );
    }

    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [addressFormData, setAddressFormData] = useState<ShippingAddressPayload>({
        first_name: '',
        last_name: '',
        telephone: '',
        address: '',
        city_province: 'Phnom Penh',
        country: 'Cambodia',
        set_as_default: false,
        latitude: null,
        longitude: null
    });

    const fetchAddresses = () => {
        setIsLoadingAddresses(true);
        shippingAddressesService.getAddresses()
            .then(data => setAddresses(data || []))
            .catch(err => {
                console.error('Failed to load addresses', err);
                toast.error('Could not load shipping addresses');
            })
            .finally(() => setIsLoadingAddresses(false));
    };

    useEffect(() => {
        if (user) {
            fetchAddresses();
        }
    }, [user]);

    const openAddAddress = () => {
        setEditingAddress(null);
        setAddressFormData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            telephone: user?.phone || '',
            address: '',
            city_province: 'Phnom Penh',
            country: 'Cambodia',
            set_as_default: addresses.length === 0,
            latitude: null,
            longitude: null
        });
        setShowAddressForm(true);
    };

    const openEditAddress = (addr: ShippingAddress) => {
        setEditingAddress(addr);
        setAddressFormData({
            first_name: addr.first_name || '',
            last_name: addr.last_name || '',
            telephone: addr.telephone,
            address: addr.address,
            city_province: addr.city_province,
            country: addr.country || 'Cambodia',
            set_as_default: addr.set_as_default,
            latitude: addr.latitude || null,
            longitude: addr.longitude || null
        });
        setShowAddressForm(true);
    };

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addressFormData.telephone || !addressFormData.address) {
            toast.error('Telephone and Address are required');
            return;
        }

        setIsUpdating(true);
        try {
            if (editingAddress) {
                await shippingAddressesService.updateAddress(editingAddress.id, addressFormData);
                toast.success('Address updated successfully!');
            } else {
                await shippingAddressesService.createAddress(addressFormData);
                toast.success('New address added!');
            }
            setShowAddressForm(false);
            fetchAddresses();
        } catch (err: any) {
            toast.error(err?.details?.message || err?.message || 'Failed to save address');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAddress = async (id: number) => {
        if (!window.confirm('Are you sure you want to remove this address?')) return;
        try {
            await shippingAddressesService.deleteAddress(id);
            toast.success('Address removed');
            fetchAddresses();
        } catch (err) {
            toast.error('Failed to delete address');
        }
    };

    const handleSetDefaultAddress = async (id: number) => {
        try {
            await shippingAddressesService.setDefault(id);
            toast.success('Default address updated');
            fetchAddresses();
        } catch (err) {
            toast.error('Failed to set default address');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div className="sticky top-14 z-30 bg-white -mx-4 px-4 sm:-mx-5 sm:px-5 pt-4 pb-3 mb-6 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <FiMapPin className="w-5 h-5 text-stone-800" />
                    <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                        {t('addressBook.title')}
                    </h2>
                </div>
                {!showAddressForm && (
                    <button
                        onClick={openAddAddress}
                        className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-850 active:scale-98 text-white text-[9px] font-black uppercase tracking-widest rounded-xl border-none cursor-pointer transition-all shadow-md"
                    >
                        <FiPlus className="w-3.5 h-3.5" /> {t('addressBook.addNew')}
                    </button>
                )}
            </div>

            {isLoadingAddresses ? (
                <div className="py-16 flex justify-center items-center">
                    <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                </div>
            ) : showAddressForm ? (
                /* Address Creation / Edit Form */
                <div className="bg-white border border-stone-200/50 p-6 rounded-2xl shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-2">
                            {editingAddress ? <FiEdit2 /> : <FiPlus />}
                            {editingAddress ? t('addressBook.modify') : t('addressBook.registerNew')}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowAddressForm(false)}
                            className="flex items-center gap-1 text-[9px] font-bold text-stone-400 hover:text-stone-900 uppercase tracking-widest border-none bg-transparent cursor-pointer transition-colors"
                        >
                            <FiArrowLeft className="w-3.5 h-3.5" /> {t('addressBook.back')}
                        </button>
                    </div>

                    <form onSubmit={handleAddressSubmit} className="space-y-4 font-sans">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">{t('addressBook.firstName')}</label>
                                <input
                                    type="text"
                                    value={addressFormData.first_name}
                                    onChange={e => setAddressFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-850 focus:border-stone-950 transition-colors focus:outline-none"
                                    placeholder="First name"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">{t('addressBook.lastName')}</label>
                                <input
                                    type="text"
                                    value={addressFormData.last_name}
                                    onChange={e => setAddressFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-850 focus:border-stone-950 transition-colors focus:outline-none"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">{t('addressBook.phone')} <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                    <FiPhone className="w-3.5 h-3.5" />
                                </div>
                                <input
                                    type="tel"
                                    required
                                    value={addressFormData.telephone}
                                    onChange={e => setAddressFormData(prev => ({ ...prev, telephone: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-850 focus:border-stone-955 transition-colors focus:outline-none"
                                    placeholder="e.g. 012 345 678"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">{t('addressBook.city')} <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        value={addressFormData.city_province}
                                        onChange={e => setAddressFormData(prev => ({ ...prev, city_province: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-855 focus:border-stone-955 transition-colors focus:outline-none appearance-none cursor-pointer"
                                    >
                                        {CITIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">{t('addressBook.country')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                        <FiGlobe className="w-3.5 h-3.5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={addressFormData.country}
                                        onChange={e => setAddressFormData(prev => ({ ...prev, country: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-850 focus:border-stone-955 transition-colors focus:outline-none"
                                        placeholder="Cambodia"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black uppercase tracking-wider text-stone-400">Detailed Shipping Address <span className="text-red-500">*</span></label>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const result = await openLocationMapModal(
                                            addressFormData.latitude ? parseFloat(String(addressFormData.latitude)) : null,
                                            addressFormData.longitude ? parseFloat(String(addressFormData.longitude)) : null
                                        );
                                        if (result) {
                                            setAddressFormData(prev => ({
                                                ...prev,
                                                address: result.address,
                                                city_province: result.city_province || prev.city_province,
                                                latitude: result.latitude,
                                                longitude: result.longitude
                                            }));
                                            toast.success('Location loaded from map!');
                                        }
                                    }}
                                    className="text-[9px] font-bold text-stone-600 hover:text-stone-900 uppercase tracking-wider flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
                                >
                                    <FiMapPin className="w-3.5 h-3.5" /> Detect on Map
                                </button>
                            </div>
                            <textarea
                                required
                                rows={3}
                                value={addressFormData.address}
                                onChange={e => setAddressFormData(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-850 focus:border-stone-955 transition-colors focus:outline-none resize-none"
                                placeholder="Street No, House No, Group, Village..."
                            />
                        </div>



                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="set_default"
                                checked={addressFormData.set_as_default}
                                onChange={e => setAddressFormData(prev => ({ ...prev, set_as_default: e.target.checked }))}
                                className="w-4 h-4 accent-stone-900 cursor-pointer"
                            />
                            <label htmlFor="set_default" className="text-[10px] font-bold text-stone-600 cursor-pointer select-none">
                                {t('addressBook.setDefault')}
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowAddressForm(false)}
                                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-800 text-[10px] font-black uppercase tracking-widest rounded-xl border-none cursor-pointer transition-all"
                            >
                                {t('addressBook.back')}
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="px-8 py-3.5 bg-stone-900 hover:bg-stone-850 active:scale-98 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border-none cursor-pointer transition-all shadow-md disabled:opacity-50"
                            >
                                {isUpdating ? t('profile.saving') : (editingAddress ? t('addressBook.modify') : t('addressBook.saveAddress'))}
                            </button>
                        </div>
                    </form>
                </div>
            ) : addresses.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                    <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
                        <FiMapPin className="w-6 h-6 text-stone-200" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-black text-stone-900 uppercase tracking-widest">No Addresses Saved</p>
                        <p className="text-[10px] text-stone-400 font-medium">Add a delivery location for faster checkout during your next purchase.</p>
                    </div>
                    <button
                        onClick={openAddAddress}
                        className="px-6 py-3 bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-900 text-[9px] font-black uppercase tracking-widest rounded-xl border-none cursor-pointer transition-all shadow-sm"
                    >
                        Add First Address
                    </button>
                </div>
            ) : (
                /* Address Listing Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                        <div
                            key={addr.id}
                            className={`group relative p-5 rounded-2xl transition-all flex flex-col justify-between ${addr.set_as_default
                                ? 'bg-stone-50 border border-stone-900 shadow-sm'
                                : 'bg-white border border-stone-200/60 hover:border-stone-400 hover:shadow-xs'
                                }`}
                        >
                            {/* Status Badge */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center ${addr.set_as_default ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-50 text-stone-400'}`}>
                                        <FiMapPin className="w-4 h-4" />
                                    </div>
                                    {addr.set_as_default && (
                                        <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-full leading-none">
                                            Primary
                                        </span>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditAddress(addr)}
                                        className="p-1.5 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                                        title="Edit"
                                    >
                                        <FiEdit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAddress(addr.id)}
                                        className="p-1.5 rounded-xl transition-colors border-none bg-transparent cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-red-50"
                                        title="Delete"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Address Info */}
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-black uppercase tracking-tight truncate text-stone-900">
                                    {(addr.first_name || addr.last_name)
                                        ? `${addr.first_name || ''} ${addr.last_name || ''}`.trim()
                                        : user?.name}
                                </h4>

                                <div className="space-y-1">
                                    <div className={`flex items-start gap-2 text-[10px] font-medium leading-relaxed ${addr.set_as_default ? 'text-stone-650' : 'text-stone-500'}`}>
                                        <span className="shrink-0 mt-0.5 text-[14px]">🇰🇭</span>
                                        <span className="break-words line-clamp-2">{addr.address}, {addr.city_province}</span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-[10px] font-bold ${addr.set_as_default ? 'text-stone-800' : 'text-stone-600'}`}>
                                        <FiPhone className="w-3 h-3 text-stone-450" />
                                        <span>{formatPhoneNumber(addr.telephone)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className={`mt-5 pt-4 border-t border-dashed flex justify-end ${addr.set_as_default ? 'border-stone-250' : 'border-stone-150'}`}>
                                {!addr.set_as_default ? (
                                    <button
                                        onClick={() => handleSetDefaultAddress(addr.id)}
                                        className="text-[8px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 border-none bg-transparent cursor-pointer transition-colors"
                                    >
                                        Use as primary address
                                    </button>
                                ) : (
                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                                        <FiCheckCircle className="w-3.5 h-3.5" /> System Default
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pro-tip for users */}
            <div className="bg-stone-50 border border-stone-200/50 p-5 rounded-2xl flex items-start gap-3 mt-4 shadow-3xs">
                <FiInfo className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-stone-500 font-medium leading-relaxed italic">
                    Keeping multiple addresses allows you to quickly switch between home, office, or gift locations during checkout. Your primary address is selected by default for every new order.
                </p>
            </div>
        </div>
    );
};
