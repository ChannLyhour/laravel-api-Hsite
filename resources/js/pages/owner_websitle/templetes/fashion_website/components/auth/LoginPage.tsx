import React, { useState } from 'react';
import { FiX, FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi';
import '../../styles/animation.css';
import { AuthSuccessOverlay } from '../../message/LoadingTime';
import type { StoreRow } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LoginPageProps {
    onClose: () => void;
    onLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    onSwitchToRegister: () => void;
    isSubmitting?: boolean;
    storeName?: string;
    onLoginWithFacebook?: () => void;
    onLoginWithGoogle?: () => void;
    stores?: StoreRow;
    ownerUserId?: number | string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const LoginPage: React.FC<LoginPageProps> = ({
    onClose,
    onLogin,
    onSwitchToRegister,
    isSubmitting = false,
    storeName = 'AURA',
    onLoginWithFacebook,
    onLoginWithGoogle,
    stores,
    ownerUserId,
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const handleGoogleLogin = () => {
        if (onLoginWithGoogle) {
            onLoginWithGoogle();
            return;
        }

        const clientId = stores?.google_client_id;
        const enabled = stores?.google_enabled === true || stores?.google_enabled === 'true' || stores?.google_enabled === '1' || stores?.google_enabled === 1;

        if (!enabled || !clientId) {
            setError('Google login is not configured or enabled for this store.');
            return;
        }

        if (ownerUserId) localStorage.setItem('oauth_owner_id', String(ownerUserId));
        if (storeName) localStorage.setItem('oauth_store_name', storeName);
        if (stores?.logo_url) {
            localStorage.setItem('oauth_store_logo', resolveImageUrl(stores.logo_url));
        }

        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
        const scope = encodeURIComponent('email profile openid');
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;

        const width = 500;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
            googleAuthUrl,
            'GoogleLoginPopup',
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
        );
    };

    const handleFacebookLogin = () => {
        if (onLoginWithFacebook) {
            onLoginWithFacebook();
            return;
        }

        const appId = stores?.facebook_app_id;
        const enabled = stores?.facebook_enabled === true || stores?.facebook_enabled === 'true' || stores?.facebook_enabled === '1' || stores?.facebook_enabled === 1;

        if (!enabled || !appId) {
            setError('Facebook login is not configured or enabled for this store.');
            return;
        }

        if (ownerUserId) localStorage.setItem('oauth_owner_id', String(ownerUserId));
        if (storeName) localStorage.setItem('oauth_store_name', storeName);
        if (stores?.logo_url) {
            localStorage.setItem('oauth_store_logo', resolveImageUrl(stores.logo_url));
        }

        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/facebook/callback`);
        const scope = encodeURIComponent('email,public_profile');
        const facebookAuthUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;

        const width = 580;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
            facebookAuthUrl,
            'FacebookLoginPopup',
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }

        const res = await onLogin(email.trim(), password);
        if (!res.success) {
            setError(res.message);
        } else {
            // Show success overlay, then close & refresh
            setShowSuccess(true);
        }
    };

    const handleSuccessDone = () => {
        onClose();
        window.location.reload();
    };

    return (
        <>
            {/* Success overlay */}
            {showSuccess && (
                <AuthSuccessOverlay
                    mode="login"
                    storeName={storeName}
                    onDone={handleSuccessDone}
                />
            )}

            <div className="fixed inset-0 z-[900] overflow-y-auto flex items-center justify-center p-4 py-8 md:py-16">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-stone-950/40 " onClick={onClose} />

            {/* Panel */}
                <div className="relative z-10 bg-white w-full max-w-sm rounded-[12px] shadow-2xl border border-stone-100 animate-modal-zando">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-2">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                                {storeName}
                            </p>
                            <h2 className="text-xl font-black text-stone-900 tracking-tight mt-0.5">
                                Sign in
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors border-none bg-transparent cursor-pointer"
                        >
                            <FiX className="w-4 h-4 stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">

                        {/* Error banner */}
                        {error && (
                            <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-[6px] text-xs font-bold text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                                Email
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-[6px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                                Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    className="w-full pl-9 pr-10 py-2.5 border border-stone-200 rounded-[6px] text-xs font-medium text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 bg-transparent border-none cursor-pointer p-0 flex items-center justify-center transition-colors"
                                >
                                    {showPassword
                                        ? <FiEyeOff className="w-3.5 h-3.5" />
                                        : <FiEye className="w-3.5 h-3.5" />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-black text-xs uppercase tracking-widest rounded-[6px] border-none cursor-pointer transition-colors mt-2"
                        >
                            {isSubmitting ? 'Signing in…' : 'Sign in'}
                        </button>

                        {/* ── Divider ── */}
                        {((stores?.facebook_enabled === true || stores?.facebook_enabled === 'true' || stores?.facebook_enabled === '1' || stores?.facebook_enabled === 1) ||
                          (stores?.google_enabled === true || stores?.google_enabled === 'true' || stores?.google_enabled === '1' || stores?.google_enabled === 1)) && (
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-stone-200" />
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0">or</span>
                                <div className="flex-1 h-px bg-stone-200" />
                            </div>
                        )}

                        {/* ── Facebook ── */}
                        {(stores?.facebook_enabled === true || stores?.facebook_enabled === 'true' || stores?.facebook_enabled === '1' || stores?.facebook_enabled === 1) && (
                            <button
                                type="button"
                                onClick={handleFacebookLogin}
                                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-stone-200 rounded-[6px] text-xs font-bold text-stone-800 hover:bg-stone-50 bg-white transition-colors cursor-pointer"
                            >
                                {/* Facebook Logo SVG */}
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="4" fill="#1877F2"/>
                                    <path d="M16.5 12H13.5V9.75C13.5 9.12 13.87 8.25 15 8.25H16.5V5.625C16.5 5.625 15.25 5.25 14 5.25C11.58 5.25 10.5 6.75 10.5 9V12H7.5V15H10.5V22.5H13.5V15H16.5L17.25 12H16.5Z" fill="white"/>
                                </svg>
                                Continue with Facebook
                            </button>
                        )}

                        {/* ── Google ── */}
                        {(stores?.google_enabled === true || stores?.google_enabled === 'true' || stores?.google_enabled === '1' || stores?.google_enabled === 1) && (
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-stone-200 rounded-[6px] text-xs font-bold text-stone-800 hover:bg-stone-50 bg-white transition-colors cursor-pointer"
                            >
                                {/* Google Logo SVG */}
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </button>
                        )}

                        {/* Switch to Register */}
                        <p className="text-center text-[11px] text-stone-400 font-medium">
                            Don&apos;t have an account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToRegister}
                                className="font-black text-stone-900 hover:underline bg-transparent border-none cursor-pointer p-0"
                            >
                                Create one
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
};

