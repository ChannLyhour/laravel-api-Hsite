import React, { useState, useEffect, useRef } from 'react';
import {
    FiArrowLeft,
    FiUser,
    FiShoppingBag,
    FiGift,
    FiMapPin,
    FiLock,
    FiLogOut,
    FiEye,
    FiEyeOff,
    FiChevronRight,
    FiCheckCircle,
    FiKey,
    FiCamera,
    FiChevronDown
} from 'react-icons/fi';
import { toast } from '../../utils/toast';
import { client } from '@/api/client';
import { resolveImageUrl } from '@/api/imageUtils';

import { OrderHistoryTab } from '../../components/info/OrderHistoryTab';
import { VouchersTab } from '../../components/info/VouchersTab';
import { ShippingAddressTab } from '../../components/info/ShippingAddressTab';

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

const stripPhonePrefix = (p: string) => {
    if (!p) return '';
    return p.replace(/^(\+?855\s*)+/, '').replace(/^0/, '').trim();
};

interface FashionProfileCustomerProps {
    isDarkTheme: boolean;
    user: any;
    ownerUserId?: number | string;
    logout: () => void;
    onClose: () => void;
    locale?: 'en' | 'km';
}

type SectionState = 'menu' | 'profile' | 'orders' | 'giftcard' | 'address';

export const FashionProfileCustomer: React.FC<FashionProfileCustomerProps> = ({
    isDarkTheme,
    user,
    ownerUserId,
    logout,
    onClose,
    locale = 'en',
}) => {
    const [activeSection, setActiveSection] = useState<SectionState>('menu');

    // Personal details state
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

    // Profile photo upload states
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password fields
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Sync values if user changes
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

            await client.postFormData('/users/me', formData);
            toast.success('Profile updated successfully!');
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

    const isKhmer = locale === 'km';

    // UI Translations
    const t = {
        title: isKhmer ? 'គណនីរបស់ខ្ញុំ' : 'My Account',
        personalInfo: isKhmer ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Details',
        orders: isKhmer ? 'ប្រវត្តិនៃការបញ្ជាទិញ' : 'Order History',
        vouchers: isKhmer ? 'ប័ណ្ណបញ្ចុះតម្លៃ' : 'Vouchers & Gifts',
        addresses: isKhmer ? 'សៀវភៅអាសយដ្ឋាន' : 'Shipping Addresses',
        logout: isKhmer ? 'ចាកចេញ' : 'Log Out',
        returnStore: isKhmer ? 'ត្រឡប់ទៅហាងវិញ' : 'Return to Boutique',
        save: isKhmer ? 'រក្សាទុក' : 'Save Details',
        saving: isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...',
        updatePass: isKhmer ? 'ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់' : 'Update Password',
        newPass: isKhmer ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password',
        confirmPass: isKhmer ? 'បញ្ជាក់ពាក្យសម្ងាត់' : 'Confirm Password',
        activeMember: isKhmer ? 'គណនីសកម្ម' : 'Active Member',
        displayName: isKhmer ? 'ឈ្មោះបង្ហាញ' : 'Display Name',
        email: isKhmer ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address',
        phone: isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number',
        gender: isKhmer ? 'ភេទ' : 'Gender',
        country: isKhmer ? 'ប្រទេស' : 'Country',
        city: isKhmer ? 'ក្រុង/ខេត្ត' : 'City / Province',
        streetAddress: isKhmer ? 'អាសយដ្ឋានលម្អិត' : 'Detailed Address',
        firstName: isKhmer ? 'នាមខ្លួន' : 'First Name',
        lastName: isKhmer ? 'នាមត្រកូល' : 'Last Name',
    };

    return (
        <div className={`w-full flex-grow flex flex-col pb-24 animate-fade-in overflow-hidden ${
            isDarkTheme ? 'text-stone-200' : 'text-stone-800'
        }`}>
            {/* Top Navigation Bar */}
            <div className={`px-4 py-3 shrink-0 flex items-center justify-between border-b ${
                isDarkTheme ? 'bg-stone-950/95 border-stone-900' : 'bg-white/95 border-stone-100 shadow-3xs'
            }`}>
                <button
                    onClick={activeSection === 'menu' ? onClose : () => setActiveSection('menu')}
                    className={`flex items-center gap-1.5 border-none bg-transparent font-black uppercase tracking-widest text-[9px] cursor-pointer transition-colors ${
                        isDarkTheme ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
                    }`}
                >
                    <FiArrowLeft className="w-3.5 h-3.5" />
                    <span>{activeSection === 'menu' ? t.returnStore : 'Back'}</span>
                </button>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                    isDarkTheme ? 'text-stone-400' : 'text-stone-500'
                }`}>
                    {activeSection === 'menu' ? t.title : t[activeSection as keyof typeof t]}
                </span>
                <div className="w-[50px]" /> {/* Spacer for symmetry */}
            </div>

            {/* Main Content Area */}
            <div className="flex-grow overflow-y-auto px-1.5 py-6 scrollbar-none">
                {activeSection === 'menu' ? (
                    /* Dashboard Main Menu */
                    <div className="space-y-6">
                        {/* Profile Brief Info Header */}
                        <div className={`p-5 rounded-[6px] border flex flex-col items-center text-center ${
                            isDarkTheme
                                ? 'bg-stone-900/40 border-stone-850'
                                : 'bg-white border-stone-150/70 shadow-3xs'
                        }`}>
                            <div className="relative">
                                {user?.image_url || user?.image ? (
                                    <img
                                        src={resolveImageUrl(user.image_url || user.image)}
                                        alt={user.name}
                                        className="w-16 h-16 rounded-full object-cover border border-stone-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-950 flex items-center justify-center text-lg font-black shadow-3xs">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h3 className={`text-sm font-black mt-3 truncate max-w-full ${
                                isDarkTheme ? 'text-white' : 'text-stone-900'
                            }`}>
                                {user?.name}
                            </h3>
                            <span className="text-[10px] text-stone-400 font-semibold">{user?.email}</span>
                            <div className="mt-2.5">
                                <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-[1px] tracking-wider leading-none shadow-3xs">
                                    {t.activeMember}
                                </span>
                            </div>
                        </div>

                        {/* Navigation Menu Links */}
                        <div className={`rounded-[6px] border divide-y overflow-hidden ${
                            isDarkTheme
                                ? 'bg-stone-900/20 border-stone-850 divide-stone-850/50'
                                : 'bg-white border-stone-150/70 divide-stone-100 shadow-3xs'
                        }`}>
                            {/* Personal Details */}
                            <button
                                onClick={() => setActiveSection('profile')}
                                className={`w-full flex items-center justify-between px-4 py-4 text-left border-none bg-transparent cursor-pointer transition-colors ${
                                    isDarkTheme ? 'hover:bg-stone-900/40 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <FiUser className="w-4.5 h-4.5 text-stone-400" />
                                    <span className="text-xs font-semibold">{t.personalInfo}</span>
                                </div>
                                <FiChevronRight className="w-4 h-4 text-stone-400" />
                            </button>

                            {/* Order History */}
                            <button
                                onClick={() => setActiveSection('orders')}
                                className={`w-full flex items-center justify-between px-4 py-4 text-left border-none bg-transparent cursor-pointer transition-colors ${
                                    isDarkTheme ? 'hover:bg-stone-900/40 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <FiShoppingBag className="w-4.5 h-4.5 text-stone-400" />
                                    <span className="text-xs font-semibold">{t.orders}</span>
                                </div>
                                <FiChevronRight className="w-4 h-4 text-stone-400" />
                            </button>

                            {/* Vouchers */}
                            <button
                                onClick={() => setActiveSection('giftcard')}
                                className={`w-full flex items-center justify-between px-4 py-4 text-left border-none bg-transparent cursor-pointer transition-colors ${
                                    isDarkTheme ? 'hover:bg-stone-900/40 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <FiGift className="w-4.5 h-4.5 text-stone-400" />
                                    <span className="text-xs font-semibold">{t.vouchers}</span>
                                </div>
                                <FiChevronRight className="w-4 h-4 text-stone-400" />
                            </button>

                            {/* Addresses */}
                            <button
                                onClick={() => setActiveSection('address')}
                                className={`w-full flex items-center justify-between px-4 py-4 text-left border-none bg-transparent cursor-pointer transition-colors ${
                                    isDarkTheme ? 'hover:bg-stone-900/40 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <FiMapPin className="w-4.5 h-4.5 text-stone-400" />
                                    <span className="text-xs font-semibold">{t.addresses}</span>
                                </div>
                                <FiChevronRight className="w-4 h-4 text-stone-400" />
                            </button>
                        </div>

                        {/* Logout Section */}
                        <div className="pt-2">
                            <button
                                onClick={handleLogoutClick}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 text-rose-600 dark:text-rose-455 font-black uppercase tracking-widest text-[10px] rounded-[6px] cursor-pointer transition-colors hover:opacity-90"
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span>{t.logout}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Sub-sections View */
                    <div className="space-y-6">
                        {activeSection === 'profile' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Profile Picture and Name Update Form */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2.5 border-b border-stone-200/20 pb-2">
                                        <FiUser className="w-4.5 h-4.5 text-stone-500" />
                                        <h3 className="text-[11px] font-black uppercase tracking-wider">
                                            {t.personalInfo}
                                        </h3>
                                    </div>

                                    {/* Avatar Selector UI */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            {imagePreview || user?.image_url || user?.image ? (
                                                <img
                                                    src={imagePreview || resolveImageUrl(user.image_url || user.image)}
                                                    alt={user.name}
                                                    className="w-20 h-20 rounded-full object-cover border border-stone-200 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-950 flex items-center justify-center text-xl font-black shadow-sm">
                                                    {user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-stone-950 hover:bg-black text-white flex items-center justify-center border-2 border-white cursor-pointer transition-colors shadow-xs"
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
                                    </div>

                                    {/* Update fields Form */}
                                    <form onSubmit={handleUpdateProfile} className="space-y-4 font-sans text-left">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">{t.firstName}</label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={e => setFirstName(e.target.value)}
                                                    className={`w-full px-3 py-2.5 border rounded-[3px] text-xs font-medium focus:outline-none transition-colors ${
                                                        isDarkTheme
                                                            ? 'bg-stone-900 border-stone-800 text-white focus:border-stone-600'
                                                            : 'bg-stone-50/50 border-stone-200 text-stone-850 focus:bg-white focus:border-stone-950'
                                                    }`}
                                                    placeholder="First name"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">{t.lastName}</label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={e => setLastName(e.target.value)}
                                                    className={`w-full px-3 py-2.5 border rounded-[3px] text-xs font-medium focus:outline-none transition-colors ${
                                                        isDarkTheme
                                                            ? 'bg-stone-900 border-stone-800 text-white focus:border-stone-600'
                                                            : 'bg-stone-50/50 border-stone-200 text-stone-850 focus:bg-white focus:border-stone-950'
                                                    }`}
                                                    placeholder="Last name"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">{t.displayName}</label>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                className={`w-full px-3 py-2.5 border rounded-[3px] text-xs font-medium focus:outline-none transition-colors ${
                                                    isDarkTheme
                                                        ? 'bg-stone-900 border-stone-800 text-white focus:border-stone-600'
                                                        : 'bg-stone-50/50 border-stone-200 text-stone-850 focus:bg-white focus:border-stone-950'
                                                }`}
                                                placeholder="Display name"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-500 flex items-center justify-between">
                                                <span>{t.email}</span>
                                                <span className="text-[8px] text-stone-400 normal-case font-bold flex items-center gap-1">
                                                    <FiLock className="w-2.5 h-2.5" /> Locked
                                                </span>
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                readOnly
                                                className={`w-full px-3 py-2.5 border rounded-[3px] text-xs font-semibold cursor-not-allowed outline-none select-none ${
                                                    isDarkTheme
                                                        ? 'bg-stone-950 border-stone-900 text-stone-600'
                                                        : 'bg-stone-100 border-stone-200 text-stone-400'
                                                }`}
                                                placeholder="Email address"
                                            />
                                        </div>

                                        {/* Cambodia Phone Input */}
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">
                                                {t.phone} <span className="text-[#E61E25] font-bold">*</span>
                                            </label>
                                            <div className={`flex border rounded-[3px] overflow-hidden focus-within:border-stone-950 transition-colors ${
                                                isDarkTheme ? 'border-stone-800 focus-within:border-stone-600' : 'border-stone-200'
                                            }`}>
                                                <div className={`flex items-center gap-1.5 px-3 border-r text-xs font-semibold select-none ${
                                                    isDarkTheme ? 'bg-stone-900 border-stone-850 text-stone-400' : 'bg-stone-55 border-stone-200 text-stone-600'
                                                }`}>
                                                    <span className="text-[14px]">🇰🇭</span>
                                                    <span>+855</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                    className={`flex-grow px-3 py-2.5 text-xs font-medium focus:outline-none border-none ${
                                                        isDarkTheme ? 'bg-stone-950 text-white' : 'bg-white text-stone-850'
                                                    }`}
                                                    placeholder="Phone number"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">{t.gender}</label>
                                                <div className="relative">
                                                    <select
                                                        value={gender}
                                                        onChange={e => setGender(e.target.value)}
                                                        className={`w-full px-3 py-2.5 border rounded-[3px] text-xs font-medium focus:outline-none appearance-none cursor-pointer transition-colors ${
                                                            isDarkTheme
                                                                ? 'bg-stone-900 border-stone-800 text-white focus:border-stone-600'
                                                                : 'bg-stone-50/50 border-stone-200 text-stone-850 focus:bg-white focus:border-stone-950'
                                                        }`}
                                                    >
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">{t.country}</label>
                                                <div className="relative">
                                                    <select
                                                        value={country}
                                                        onChange={e => setCountry(e.target.value)}
                                                        className={`w-full px-3 py-2.5 border rounded-[3px] text-xs font-medium focus:outline-none appearance-none cursor-pointer transition-colors ${
                                                            isDarkTheme
                                                                ? 'bg-stone-900 border-stone-800 text-white focus:border-stone-600'
                                                                : 'bg-stone-50/50 border-stone-200 text-stone-850 focus:bg-white focus:border-stone-950'
                                                        }`}
                                                    >
                                                        <option value="Cambodia">Cambodia</option>
                                                        <option value="Vietnam">Vietnam</option>
                                                        <option value="USA">USA</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">{t.city}</label>
                                            <div className="relative">
                                                <select
                                                    value={city}
                                                    onChange={e => setCity(e.target.value)}
                                                    className={`w-full px-3 py-2.5 border rounded-[3px] text-xs font-medium focus:outline-none appearance-none cursor-pointer transition-colors ${
                                                        isDarkTheme
                                                            ? 'bg-stone-900 border-stone-800 text-white focus:border-stone-600'
                                                            : 'bg-stone-50/50 border-stone-200 text-stone-850 focus:bg-white focus:border-stone-950'
                                                    }`}
                                                >
                                                    {CITIES.map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">{t.streetAddress}</label>
                                            <textarea
                                                rows={3}
                                                value={address}
                                                onChange={e => setAddress(e.target.value)}
                                                className={`w-full px-3 py-2.5 border rounded-[3px] text-xs font-medium focus:outline-none resize-none transition-colors ${
                                                    isDarkTheme
                                                        ? 'bg-stone-900 border-stone-800 text-white focus:border-stone-600'
                                                        : 'bg-stone-50/50 border-stone-200 text-stone-850 focus:bg-white focus:border-stone-950'
                                                }`}
                                                placeholder="Street No, House No, Village..."
                                            />
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="submit"
                                                disabled={isUpdating}
                                                className={`px-5 py-3 rounded-[3px] text-[9px] font-black uppercase tracking-widest border-none cursor-pointer transition-colors flex items-center gap-1.5 focus:outline-none disabled:opacity-50 ${
                                                    isDarkTheme
                                                        ? 'bg-white text-stone-950 hover:bg-stone-200'
                                                        : 'bg-stone-900 text-white hover:bg-stone-950'
                                                }`}
                                            >
                                                <FiCheckCircle className="w-3.5 h-3.5" />
                                                <span>{isUpdating ? t.saving : t.save}</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="border-t border-stone-200/10 my-6" />

                                {/* Password Change Form */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2.5 border-b border-stone-200/20 pb-2">
                                        <FiLock className="w-4.5 h-4.5 text-stone-500" />
                                        <h3 className="text-[11px] font-black uppercase tracking-wider">
                                            {t.updatePass}
                                        </h3>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="space-y-4 font-sans text-left">
                                        <div className="space-y-1 relative">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">{t.newPass}</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPass ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    className={`w-full px-3 pr-10 py-2.5 border rounded-[3px] text-xs font-medium focus:outline-none transition-colors ${
                                                        isDarkTheme
                                                            ? 'bg-stone-900 border-stone-800 text-white focus:border-stone-600'
                                                            : 'bg-stone-50/50 border-stone-200 text-stone-850 focus:bg-white focus:border-stone-950'
                                                    }`}
                                                    placeholder="At least 6 characters"
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
                                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-500">{t.confirmPass}</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPass ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    className={`w-full px-3 pr-10 py-2.5 border rounded-[3px] text-xs font-medium focus:outline-none transition-colors ${
                                                        isDarkTheme
                                                            ? 'bg-stone-900 border-stone-800 text-white focus:border-stone-600'
                                                            : 'bg-stone-50/50 border-stone-200 text-stone-850 focus:bg-white focus:border-stone-950'
                                                    }`}
                                                    placeholder="Verify new password"
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

                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="submit"
                                                disabled={isUpdatingPassword}
                                                className={`px-5 py-3 rounded-[3px] text-[9px] font-black uppercase tracking-widest border-none cursor-pointer transition-colors flex items-center gap-1.5 focus:outline-none disabled:opacity-50 ${
                                                    isDarkTheme
                                                        ? 'bg-white text-stone-950 hover:bg-stone-200'
                                                        : 'bg-stone-900 text-white hover:bg-stone-950'
                                                }`}
                                            >
                                                <FiKey className="w-3.5 h-3.5" />
                                                <span>{isUpdatingPassword ? t.saving : t.updatePass}</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeSection === 'orders' && (
                            <OrderHistoryTab user={user} ownerUserId={ownerUserId} />
                        )}

                        {activeSection === 'giftcard' && (
                            <VouchersTab user={user} ownerUserId={ownerUserId} locale={locale} />
                        )}

                        {activeSection === 'address' && (
                            <ShippingAddressTab user={user} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

