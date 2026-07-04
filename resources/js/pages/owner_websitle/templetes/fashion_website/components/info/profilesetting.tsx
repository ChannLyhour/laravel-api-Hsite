import React, { useState, useEffect, useRef } from 'react';
import {
    FiUser,
    FiShoppingBag,
    FiGift,
    FiMapPin,
    FiLock,
    FiLogOut,
    FiEye,
    FiEyeOff,
    FiChevronDown,
    FiCheckCircle,
    FiKey,
    FiCamera,
    FiMessageSquare,
} from 'react-icons/fi';
import { toast } from '../../utils/toast';
import { client } from '@/api/client';
import { resolveImageUrl } from '@/api/imageUtils';
import { useTranslation } from '../../utils/translate';
import { VouchersTab } from './VouchersTab';
import { ShippingAddressTab } from './ShippingAddressTab';
import { OrderHistoryTab } from './OrderHistoryTab';
import { ChatTab } from './ChatTab';
import { Store_setting } from '@/api/owner/stores';

const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    let clean = phone.trim();

    // If it starts with + but is not +855, keep as is
    if (clean.startsWith('+') && !clean.startsWith('+855')) {
        return clean;
    }

    // Remove any repeating +855 or 855 prefixes (e.g. "+855 +85598765476", "855 85598765476")
    clean = clean.replace(/^(\+?855\s*)+/, '');

    // Strip leading 0
    if (clean.startsWith('0')) {
        clean = clean.slice(1);
    }

    return `+855 ${clean}`;
};

interface ProfileSettingProps {
    user: any;
    onClose: () => void;
    ownerUserId?: number | string;
    logout: () => void;
    locale?: string;
    stores?: any;
}

type TabState = 'profile' | 'orders' | 'giftcard' | 'address' | 'chat';

export const ProfileSetting: React.FC<ProfileSettingProps> = ({
    user,
    onClose,
    ownerUserId,
    logout,
    locale = 'en',
    stores,
}) => {
    const { t } = useTranslation(locale);
    const localSettings = Store_setting();
    const activeSettings = { ...(stores || {}), ...(localSettings || {}) };
    const isChatEnabled = activeSettings?.customer_chat !== 'false' && activeSettings?.customer_chat !== false;

    const [activeTab, setActiveTab] = useState<TabState>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab') as TabState;
            if (['profile', 'orders', 'giftcard', 'address', 'chat'].includes(tab)) {
                if (tab === 'address' && Store_setting()?.checkout_delivery_address === 'close') {
                    return 'profile';
                }
                if (tab === 'chat' && !isChatEnabled) {
                    return 'profile';
                }
                return tab;
            }
        }
        return 'profile';
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const currentTab = params.get('tab');
            if (currentTab !== activeTab) {
                params.set('tab', activeTab);
                const newSearch = params.toString() ? `?${params.toString()}` : '';
                const newUrl = `${window.location.pathname}${newSearch}${window.location.hash}`;
                window.history.replaceState(null, '', newUrl);
            }
        }
    }, [activeTab]);

    useEffect(() => {
        const handleUrlChange = () => {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const tab = params.get('tab') as TabState;
                if (['profile', 'orders', 'giftcard', 'address', 'chat'].includes(tab)) {
                    if (tab === 'chat' && !isChatEnabled) {
                        setActiveTab('profile');
                    } else if (tab !== activeTab) {
                        setActiveTab(tab);
                    }
                } else {
                    if (activeTab !== 'profile') {
                        setActiveTab('profile');
                    }
                }
            }
        };

        window.addEventListener('popstate', handleUrlChange);
        window.addEventListener('navigation_changed', handleUrlChange);

        return () => {
            window.removeEventListener('popstate', handleUrlChange);
            window.removeEventListener('navigation_changed', handleUrlChange);
        };
    }, [activeTab]);

    const stripPhonePrefix = (p: string) => {
        if (!p) return '';
        return p.replace(/^(\+?855\s*)+/, '').replace(/^0/, '').trim();
    };

    // Profile update states
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [username, setUsername] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(stripPhonePrefix(user?.phone || ''));
    const [gender, setGender] = useState(user?.gender || 'male');
    const [country, setCountry] = useState(user?.country || 'Cambodia');
    const [address, setAddress] = useState(user?.address || '');
    const [city, setCity] = useState(user?.city || 'Phnom Penh');
    const [isUpdating, setIsUpdating] = useState(false);

    // Image upload states
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);





    // Password change states
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Sync state if user prop changes
    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setUsername(user.name || '');
            setEmail(user.email || '');
            setPhone(stripPhonePrefix(user.phone || ''));
            setGender(user.gender || 'male');
            setCountry(user.country || 'Cambodia');
            setAddress(user.address || '');
            setCity(user.city || 'Phnom Penh');
            setImagePreview(null);
            setImageFile(null);
        }
    }, [user]);



    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalName = username.trim() || `${firstName.trim()} ${lastName.trim()}`.trim();
        if (!finalName) {
            toast.error('Name is required');
            return;
        }
        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append('name', finalName);
            formData.append('first_name', firstName);
            formData.append('last_name', lastName);
            formData.append('gender', gender);
            formData.append('country', country);
            formData.append('phone', formatPhoneNumber(phone));
            formData.append('address', address);
            formData.append('city', city);

            if (imageFile) {
                formData.append('image', imageFile);
            }

            // Using /users/me as confirmed by Laravel routes (supports GET, PUT, POST)
            await client.postFormData('/users/me', formData);

            toast.success('Profile settings updated successfully!');
            window.dispatchEvent(new Event('settings_updated'));
            setImageFile(null);
        } catch (err: any) {
            toast.error(err?.details?.message || err?.message || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };


    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await client.put('/users/me', {
                password: newPassword,
            });
            toast.success('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err?.details?.message || err?.message || 'Failed to change password.');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleLogoutClick = () => {
        logout();
        toast.success('Logged out successfully');
        onClose();
    };

    return (
        <div className="w-full select-none animate-fade-in">
            <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-2 items-start">
                {/* ─── Left Sidebar ─────────────────────────────────────────────────── */}
                <div className="hidden lg:block w-full lg:w-64 bg-white border border-stone-200/50 rounded-[3px] p-6 space-y-6 shadow-3xs flex-shrink-0">
                    {/* User profile brief card header */}
                    <div className="flex flex-col items-center">
                        {user?.image_url || user?.image ? (
                            <img src={resolveImageUrl(user.image_url || user.image)} alt={user.name} className="w-14 h-14 rounded-full object-cover border border-stone-250/60 shadow-sm" />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center text-md font-black shadow-3xs">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h3 className="text-xs font-black text-stone-850 tracking-tight mt-3 truncate max-w-full">
                            {user?.name}
                        </h3>
                        <div className="mt-2">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase px-2 py-0.5 rounded-[1px] tracking-wider leading-none shadow-3xs">
                                Active Account
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-stone-100" />

                    {/* Menu Items */}
                    <div className="space-y-1 text-stone-850">
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 block px-4 pb-2 text-left">
                            Main Menu
                        </span>

                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left font-black uppercase tracking-wider text-[10px] border-none cursor-pointer transition-all rounded-[3px] focus:outline-none ${activeTab === 'profile'
                                ? 'bg-stone-900 text-white shadow-3xs'
                                : 'bg-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                                }`}
                        >
                            <FiUser className="w-4 h-4" />
                            {t('navbar.profile')}
                        </button>

                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left font-black uppercase tracking-wider text-[10px] border-none cursor-pointer transition-all rounded-[3px] focus:outline-none ${activeTab === 'orders'
                                ? 'bg-stone-900 text-white shadow-3xs'
                                : 'bg-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                                }`}
                        >
                            <FiShoppingBag className="w-4 h-4" />
                            {t('navbar.orderHistory')}
                        </button>

                        <button
                            onClick={() => setActiveTab('giftcard')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left font-black uppercase tracking-wider text-[10px] border-none cursor-pointer transition-all rounded-[3px] focus:outline-none ${activeTab === 'giftcard'
                                ? 'bg-stone-900 text-white shadow-3xs'
                                : 'bg-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                                }`}
                        >
                            <FiGift className="w-4 h-4" />
                            {t('navbar.vouchers')}
                        </button>

                        {Store_setting()?.checkout_delivery_address !== 'close' && (
                            <button
                                onClick={() => setActiveTab('address')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left font-black uppercase tracking-wider text-[10px] border-none cursor-pointer transition-all rounded-[3px] focus:outline-none ${activeTab === 'address'
                                    ? 'bg-stone-900 text-white shadow-3xs'
                                    : 'bg-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                                    }`}
                            >
                                <FiMapPin className="w-4 h-4" />
                                {t('navbar.addressBook')}
                            </button>
                        )}

                        {isChatEnabled && (
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left font-black uppercase tracking-wider text-[10px] border-none cursor-pointer transition-all rounded-[3px] focus:outline-none ${activeTab === 'chat'
                                    ? 'bg-stone-900 text-white shadow-3xs'
                                    : 'bg-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                                    }`}
                            >
                                <FiMessageSquare className="w-4 h-4" />
                                {t('navbar.messagesChat')}
                            </button>
                        )}
                    </div>

                    <div className="border-t border-stone-100" />

                    {/* Logout button at bottom of sidebar */}
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left font-black uppercase tracking-wider text-[10px] border-none bg-transparent cursor-pointer transition-all text-red-500 hover:text-red-700 hover:bg-red-50/50 rounded-[3px] focus:outline-none"
                    >
                        <FiLogOut className="w-4 h-4" />
                        {t('profile.logout')}
                    </button>
                </div>

                {/* ─── Right Content Area ───────────────────────────────────────────── */}
                <div className={`flex-1 w-full bg-white border-0 sm:border border-stone-200/50 rounded-none sm:rounded-[3px] shadow-none sm:shadow-3xs ${activeTab === 'chat'
                    ? 'h-[calc(100vh-80px)] sm:h-auto sm:min-h-[390px] p-0 sm:p-5 flex flex-col'
                    : 'min-h-[390px] p-4 sm:p-5'
                    }`}>
                    {/* TAB 1: Profile Settings & Password Change (Merged) */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Profile Details Section */}
                            <div className="space-y-6">
                                <div className="sticky top-14 z-30 bg-white -mx-4 px-4 sm:-mx-5 sm:px-5 pt-4 pb-3 border-b border-stone-100 flex items-center gap-2.5">
                                    <FiUser className="w-5 h-5 text-stone-800" />
                                    <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                                        {t('profile.personalInfo')}
                                    </h2>
                                </div>

                                {/* Avatar change display */}
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        {imagePreview || user?.image_url || user?.image ? (
                                            <img src={imagePreview || resolveImageUrl(user.image_url || user.image)} alt={user.name} className="w-20 h-20 rounded-full object-cover border border-stone-200 shadow-sm" />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-stone-900 text-white flex items-center justify-center text-xl font-black shadow-sm">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-950 text-white flex items-center justify-center border-2 border-white cursor-pointer focus:outline-none transition-colors shadow-xs"
                                        >
                                            <FiCamera className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                    <h3 className="text-xs font-black text-stone-850 mt-3">{username || user?.name}</h3>
                                    <span className="text-[10px] font-semibold text-stone-400 mt-1">{email || user?.email}</span>
                                </div>

                                {/* Update fields form */}
                                <form onSubmit={handleUpdateProfile} className="space-y-4 font-sans text-left">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">{t('profile.firstName')}</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={e => setFirstName(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-850 focus:bg-white focus:border-stone-900 transition-colors focus:outline-none"
                                                placeholder={t('profile.firstNamePlaceholder')}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">{t('profile.lastName')}</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={e => setLastName(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-850 focus:bg-white focus:border-stone-900 transition-colors focus:outline-none"
                                                placeholder={t('profile.lastNamePlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">{t('profile.gender')}</label>
                                            <div className="relative">
                                                <select
                                                    value={gender}
                                                    onChange={e => setGender(e.target.value)}
                                                    className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-850 focus:bg-white focus:border-stone-900 transition-colors focus:outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="male">{t('profile.male')}</option>
                                                    <option value="female">{t('profile.female')}</option>
                                                    <option value="other">{t('profile.other')}</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-500">
                                                    <FiChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">{t('profile.country')}</label>
                                            <div className="relative">
                                                <select
                                                    value={country}
                                                    onChange={e => setCountry(e.target.value)}
                                                    className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-850 focus:bg-white focus:border-stone-900 transition-colors focus:outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="Cambodia">Cambodia</option>
                                                    <option value="Vietnam">Vietnam</option>
                                                    <option value="USA">USA</option>
                                                    <option value="Other">{t('profile.other')}</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-500">
                                                    <FiChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">{t('profile.displayName')}</label>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-850 focus:bg-white focus:border-stone-900 transition-colors focus:outline-none"
                                                placeholder={t('profile.displayNamePlaceholder')}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center justify-between">
                                                {t('profile.email')}
                                                <span className="text-[8px] text-stone-400 normal-case font-bold flex items-center gap-1">
                                                    <FiLock className="w-2.5 h-2.5" /> {t('profile.locked')}
                                                </span>
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                readOnly
                                                className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-[3px] text-xs font-semibold text-stone-400 cursor-not-allowed outline-none select-none"
                                                placeholder={t('profile.emailPlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    {/* Phone field matching cambodia flag selector */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                                            {t('profile.phoneNumber')} <span className="text-[#E61E25] font-bold">*</span>
                                        </label>
                                        <div className="flex border border-stone-200 rounded-[3px] overflow-hidden focus-within:border-stone-900 transition-colors">
                                            <div className="flex items-center gap-1.5 px-3 bg-stone-50 border-r border-stone-200 text-xs font-semibold text-stone-600 select-none">
                                                <span>+855</span>
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className="flex-grow px-3.5 py-2.5 bg-white text-xs font-medium text-stone-850 focus:outline-none border-none"
                                                placeholder={t('profile.phonePlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="px-6 py-3 bg-stone-900 hover:bg-stone-950 text-white text-[10px] font-black uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors flex items-center gap-2 focus:outline-none disabled:opacity-50"
                                        >
                                            <FiCheckCircle className="w-4 h-4" />
                                            {isUpdating ? t('profile.saving') : t('profile.saveProfile')}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="border-t border-stone-100 my-8" />

                            {/* Password Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
                                    <FiLock className="w-5 h-5 text-stone-800" />
                                    <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                                        {t('profile.updatePassword')}
                                    </h2>
                                </div>

                                <form onSubmit={handleChangePassword} className="space-y-4 font-sans text-left">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1 relative">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">{t('profile.newPassword')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPass ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-850 focus:bg-white focus:border-stone-900 transition-colors pr-10 focus:outline-none"
                                                    placeholder={t('profile.newPasswordPlaceholder')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPass(!showNewPass)}
                                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-stone-400 hover:text-stone-700 bg-transparent border-none cursor-pointer focus:outline-none"
                                                >
                                                    {showNewPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1 relative">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">{t('profile.confirmPassword')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPass ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-200 rounded-[3px] text-xs font-medium text-stone-850 focus:bg-white focus:border-stone-900 transition-colors pr-10 focus:outline-none"
                                                    placeholder={t('profile.confirmPasswordPlaceholder')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-stone-400 hover:text-stone-700 bg-transparent border-none cursor-pointer focus:outline-none"
                                                >
                                                    {showConfirmPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={isUpdatingPassword}
                                            className="px-6 py-3 bg-stone-900 hover:bg-stone-950 text-white text-[10px] font-black uppercase tracking-widest rounded-[3px] border-none cursor-pointer transition-colors flex items-center gap-2 focus:outline-none disabled:opacity-50"
                                        >
                                            <FiKey className="w-4 h-4" />
                                            {isUpdatingPassword ? t('profile.saving') : t('profile.updatePassword')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Order History */}
                    {activeTab === 'orders' && (
                        <OrderHistoryTab user={user} ownerUserId={ownerUserId} locale={locale} />
                    )}

                    {/* TAB 3: Gift Vouchers */}
                    {activeTab === 'giftcard' && (
                        <VouchersTab user={user} ownerUserId={ownerUserId} locale={locale} />
                    )}

                    {/* TAB 4: Address Book (Multi-Address Support) */}
                    {activeTab === 'address' && (
                        <ShippingAddressTab user={user} locale={locale} />
                    )}

                    {/* TAB 5: Live Chat */}
                    {activeTab === 'chat' && isChatEnabled && (
                        <ChatTab user={user} ownerUserId={ownerUserId} stores={stores} onTabChange={setActiveTab} />
                    )}
                </div>
            </div>
        </div>
    );
};

