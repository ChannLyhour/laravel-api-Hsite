import React, { useState } from 'react';
import { FiX, FiEye, FiEyeOff, FiChevronDown } from 'react-icons/fi';
import '../../styles/animation.css';
import { AuthSuccessOverlay } from '../../message/LoadingTime';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CAMBODIA_PROVINCES = [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville',
    'Kampong Cham', 'Koh Kong', 'Kratie', 'Takéo', 'Kampot',
    'Pursat', 'Prey Veng', 'Svay Rieng', 'Kandal', 'Mondulkiri',
    'Ratanakiri', 'Stung Treng', 'Preah Vihear', 'Oddar Meanchey',
    'Pailin', 'Kep', 'Tbong Khmum',
];

const COUNTRIES = [
    { code: 'KH', label: 'Cambodia' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterPageProps {
    onClose: () => void;
    onRegister: (data: {
        name: string;
        first_name: string;
        last_name: string;
        email: string;
        password: string;
        phone?: string;
        address?: string;
        city?: string;
        country?: string;
        gender?: 'male' | 'female' | 'other';
    }) => Promise<{ success: boolean; message: string }>;
    onSwitchToLogin: () => void;
    isSubmitting?: boolean;
    storeName?: string;
}

// ─── Shared style tokens (mirror LoginPage exactly) ────────────────────────────

const inputCls =
    'w-full py-2.5 border border-stone-200 rounded-[6px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-colors';

const labelCls = 'text-[10px] font-black uppercase tracking-wider text-stone-500 block';

// ─── Component ─────────────────────────────────────────────────────────────────

export const RegisterPage: React.FC<RegisterPageProps> = ({
    onClose,
    onRegister,
    onSwitchToLogin,
    isSubmitting = false,
    storeName = 'AURA',
}) => {
    // ── Form fields ───────────────────────────────────────────────────────────
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('Cambodia');
    const [city, setCity] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // ── UI state ──────────────────────────────────────────────────────────────
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // ── Validation & submit ───────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!gender) { setError('Please select your gender.'); return; }
        if (!firstName.trim() || !lastName.trim()) { setError('First name and last name are required.'); return; }
        if (!phone.trim()) { setError('Mobile number is required.'); return; }
        if (!email.trim()) { setError('Email address is required.'); return; }
        if (!password) { setError('Password is required.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

        const res = await onRegister({
            name: `${firstName.trim()} ${lastName.trim()}`,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            password,
            phone: phone.trim() || undefined,
            city: city || undefined,
            country: country || undefined,
            gender: gender || undefined,
        });

        if (!res.success) {
            setError(res.message);
        } else {
            setShowSuccess(true);
        }
    };

    const handleSuccessDone = () => {
        onClose();
        window.location.reload();
    };

    // ── Password strength ─────────────────────────────────────────────────────
    const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
    const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-400'][strength];

    return (
        <>
            {showSuccess && (
                <AuthSuccessOverlay
                    mode="register"
                    storeName={storeName}
                    onDone={handleSuccessDone}
                />
            )}
            <div className="fixed inset-0 z-[900] overflow-y-auto flex items-center justify-center p-4 py-8 md:py-16">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-stone-950/40 " onClick={onClose} />

            {/* Panel — same max-w, rounded, shadow as LoginPage */}
            <div className="relative z-10 bg-white w-full max-w-sm rounded-[12px] shadow-2xl border border-stone-100 animate-modal-zando">

                {/* ── Header — same structure as LoginPage ── */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                            {storeName}
                        </p>
                        <h2 className="text-xl font-black text-stone-900 tracking-tight mt-0.5">
                            Create account
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <FiX className="w-4 h-4 stroke-[2.5]" />
                    </button>
                </div>

                {/* ── Form area ── */}
                <div>
                    <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">

                        {/* Error banner — same as LoginPage */}
                        {error && (
                            <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-[6px] text-xs font-bold text-red-600">
                                {error}
                            </div>
                        )}

                        {/* ── Gender ── */}
                        <div className="space-y-1.5">
                            <span className={labelCls}>
                                Gender <span className="normal-case font-medium text-stone-400 tracking-normal">(Required)</span>
                            </span>
                            <div className="flex items-center gap-5">
                                {(['male', 'female'] as const).map(g => (
                                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                                        <div
                                            onClick={() => setGender(g)}
                                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${gender === g ? 'border-stone-900' : 'border-stone-300'}`}
                                        >
                                            {gender === g && <div className="w-2 h-2 rounded-full bg-stone-900" />}
                                        </div>
                                        <span className="text-xs font-medium text-stone-800 capitalize">{g}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* ── First + Last name ── */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className={labelCls}>First name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    placeholder="Enter first name"
                                    autoComplete="given-name"
                                    className={`${inputCls} px-3.5`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelCls}>Last name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    placeholder="Enter last name"
                                    autoComplete="family-name"
                                    className={`${inputCls} px-3.5`}
                                />
                            </div>
                        </div>

                        {/* ── Mobile ── */}
                        <div className="space-y-1.5">
                            <label className={labelCls}>Mobile number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="Enter phone number"
                                autoComplete="tel"
                                className={`${inputCls} px-3.5`}
                            />
                        </div>

                        {/* ── Email ── */}
                        <div className="space-y-1.5">
                            <label className={labelCls}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter email"
                                autoComplete="email"
                                className={`${inputCls} px-3.5`}
                            />
                        </div>

                        {/* ── Country + City ── */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Country */}
                            <div className="space-y-1.5">
                                <label className={labelCls}>Country</label>
                                <div className="relative">
                                    <select
                                        value={country}
                                        onChange={e => { setCountry(e.target.value); setCity(''); }}
                                        className={`${inputCls} pl-3.5 pr-8 appearance-none cursor-pointer`}
                                    >
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.label}>{c.label}</option>
                                        ))}
                                    </select>
                                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* City / Province */}
                            <div className="space-y-1.5">
                                <label className={labelCls}>City/province</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setCityOpen(v => !v)}
                                        className={`${inputCls} pl-3.5 pr-8 flex items-center justify-between w-full text-left cursor-pointer ${!city ? 'text-stone-300' : 'text-stone-800'}`}
                                    >
                                        <span>{city || 'City/province'}</span>
                                        <FiChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                    </button>
                                    {cityOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-0.5 bg-white border border-stone-200 rounded-[6px] shadow-lg z-50 max-h-44 overflow-y-auto">
                                            {(country === 'Cambodia' ? CAMBODIA_PROVINCES : ['Select country first']).map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => { setCity(c); setCityOpen(false); }}
                                                    className={`w-full text-left px-3.5 py-2 text-xs font-medium border-none cursor-pointer transition-colors ${city === c ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50'}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Password ── */}
                        <div className="space-y-1.5">
                            <label className={labelCls}>Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                    className={`${inputCls} pl-3.5 pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 bg-transparent border-none cursor-pointer p-0 flex items-center justify-center transition-colors"
                                >
                                    {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                                </button>
                            </div>

                            {/* Password strength bar */}
                            {password.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-stone-200'}`}
                                        />
                                    ))}
                                    <span className="text-[10px] font-bold text-stone-400 ml-0.5 w-9 shrink-0">{strengthLabel}</span>
                                </div>
                            )}
                        </div>

                        {/* ── Confirm password ── */}
                        <div className="space-y-1.5">
                            <label className={labelCls}>Confirm password</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    autoComplete="new-password"
                                    className={`${inputCls} pl-3.5 pr-10 ${confirmPassword && confirmPassword !== password ? 'border-red-300 focus:border-red-400' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 bg-transparent border-none cursor-pointer p-0 flex items-center justify-center transition-colors"
                                >
                                    {showConfirm ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* ── Submit — same style as LoginPage ── */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-black text-xs uppercase tracking-widest rounded-[6px] border-none cursor-pointer transition-colors mt-2"
                        >
                            {isSubmitting ? 'Creating account…' : 'Create account'}
                        </button>

                        {/* ── Switch to Login — same style as LoginPage ── */}
                        <p className="text-center text-[11px] text-stone-400 font-medium">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToLogin}
                                className="font-black text-stone-900 hover:underline bg-transparent border-none cursor-pointer p-0"
                            >
                                Sign in
                            </button>
                        </p>

                    </form>
                </div>
            </div>
        </div>
        </>
    );
};
