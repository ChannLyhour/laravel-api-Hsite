import React, { useState } from 'react';
import { authService } from '@/api/auth';
import type { LoginRequest } from '@/api/auth';
import { ApiError } from '@/api/client';
import { toast } from 'react-hot-toast';
import type { SettingResponse } from '@/api/setting';
import { themes } from '@/pages/owner_manage/templete_website/themes';
import { getLightTheme } from './utils/themeHelper';

interface LoginPageProps {
    onLoginSuccess: (token: string) => void;
    onNavigateHome: () => void;
    settings?: SettingResponse['settings'] | null;
    ownerUserId?: number | string;
    onNavigate?: (to: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
    onLoginSuccess,
    onNavigateHome,
    settings,
    ownerUserId,
    onNavigate,
}) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isStaffError, setIsStaffError] = useState(false);

    // Registration specific fields
    const [regFirstName, setRegFirstName] = useState('');
    const [regLastName, setRegLastName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regAddress, setRegAddress] = useState('');
    const [regCity, setRegCity] = useState('');

    const activeTheme = getLightTheme(themes[settings?.website_theme || 'default'] || themes.default);
    const isDarkTheme = false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);
        setValidationErrors({});
        setIsStaffError(false);
        setSuccessMessage(null);

        // Basic Client Validation
        if (!email) {
            setValidationErrors(prev => ({ ...prev, email: ['The email field is required.'] }));
            setLoading(false);
            return;
        }
        if (!password) {
            setValidationErrors(prev => ({ ...prev, password: ['The password field is required.'] }));
            setLoading(false);
            return;
        }

        try {
            const credentials: LoginRequest = { email, password };
            const response = await authService.login(credentials);

            if (response.success) {
                setSuccessMessage('Logged in successfully! Redirecting...');
                toast.success('Logged in successfully!');
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('aura_customer_token', response.token);
                window.dispatchEvent(new Event('aura_token_changed'));

                // Let animation finish before setting state
                setTimeout(() => {
                    onLoginSuccess(response.token);
                }, 1000);
            }
        } catch (error) {
            if (error instanceof ApiError) {
                const details = error.details;
                setErrorMessage(details.message);
                toast.error(details.message || 'Login verification failed.');

                // Extract validation errors
                if (details.errors && Object.keys(details.errors).length > 0) {
                    setValidationErrors(details.errors);
                }

                // Handle specific block for staff / admin
                if (error.status === 403) {
                    setIsStaffError(true);
                }
            } else {
                const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred.';
                setErrorMessage(errMsg);
                toast.error(errMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);
        setValidationErrors({});
        setSuccessMessage(null);

        // Basic Client Validation
        if (!regFirstName.trim() || !regLastName.trim()) {
            setValidationErrors(prev => ({ ...prev, name: ['First and last name are required.'] }));
            setLoading(false);
            return;
        }
        if (!regEmail.trim()) {
            setValidationErrors(prev => ({ ...prev, email: ['The email field is required.'] }));
            setLoading(false);
            return;
        }
        if (!regPassword || regPassword.length < 6) {
            setValidationErrors(prev => ({ ...prev, password: ['The password must be at least 6 characters.'] }));
            setLoading(false);
            return;
        }

        try {
            const response = await authService.register({
                name: `${regFirstName.trim()} ${regLastName.trim()}`,
                first_name: regFirstName.trim(),
                last_name: regLastName.trim(),
                email: regEmail,
                password: regPassword,
                phone: regPhone || undefined,
                address: regAddress || undefined,
                city: regCity || undefined,
                created_by: ownerUserId,
            });

            if (response.success) {
                setSuccessMessage('Account registered successfully! Logging in...');
                toast.success('Account created successfully!');
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('aura_customer_token', response.token);
                window.dispatchEvent(new Event('aura_token_changed'));

                setTimeout(() => {
                    onLoginSuccess(response.token);
                }, 1000);
            }
        } catch (error) {
            if (error instanceof ApiError) {
                const details = error.details;
                setErrorMessage(details.message);
                toast.error(details.message || 'Registration failed.');

                if (details.errors && Object.keys(details.errors).length > 0) {
                    setValidationErrors(details.errors);
                }
            } else {
                const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred.';
                setErrorMessage(errMsg);
                toast.error(errMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-kuntomruy">
            {/* Click outside to close */}
            <div className="absolute inset-0 cursor-default" onClick={onNavigateHome}></div>

            {/* Decorative Blur Backgrounds dynamically themed */}
            <div className={`absolute top-1/4 left-1/4 w-72 h-72 ${activeTheme.primaryBg}/10 rounded-full blur-3xl -z-10 animate-pulse-slow pointer-events-none`}></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-slate-400/5 rounded-full blur-3xl -z-10 animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

            <div className={`w-full max-w-md ${activeTheme.cardBg} ${activeTheme.glassClass || ''} rounded-2xl p-8 sm:p-10 shadow-2xl border ${activeTheme.borderClass} relative z-10 animate-slide-up max-h-[90vh] overflow-y-auto`}>
                {/* Close Modal Button */}
                <button
                    onClick={onNavigateHome}
                    className={`absolute top-4 right-4 z-50 ${isDarkTheme ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'} p-2.5 rounded-lg shadow-sm transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center border-none`}
                    title="Close Modal"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mb-8">
                    <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-905'}`}>
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className={`text-sm mt-2 font-medium leading-relaxed ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isRegister 
                            ? 'Register a new customer account to place orders.' 
                            : 'Sign in to your customer account to place new orders and track deliveries.'
                        }
                    </p>
                </div>

                {/* Error Message Display */}
                {errorMessage && !isStaffError && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-3 text-rose-500 text-xs sm:text-sm animate-slide-up font-semibold">
                        <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="leading-relaxed">{errorMessage}</div>
                    </div>
                )}

                {/* Admin Blocked Alert (403 Custom Message) */}
                {isStaffError && !isRegister && (
                    <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col space-y-3 text-amber-500 animate-slide-up">
                        <div className="flex items-center space-x-3 text-sm">
                            <svg className="w-6 h-6 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-black">Owner Portal Required</span>
                        </div>
                        <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isDarkTheme ? 'text-slate-300' : 'text-slate-655'}`}>
                            {errorMessage || 'This account does not have customer access. Staff must use the Owner Portal.'}
                        </p>
                        <div className={`pt-2.5 border-t ${activeTheme.borderClass} flex justify-end`}>
                            <a
                                href="/owner/login"
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-black transition-all shadow-sm flex items-center space-x-1"
                            >
                                <span>Go to Owner Portal</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>
                )}

                {/* Success Message Display */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-500 text-xs sm:text-sm animate-slide-up font-semibold">
                        <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>{successMessage}</div>
                    </div>
                )}

                {/* Forms */}
                {!isRegister ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className={`text-xs sm:text-sm font-black tracking-wide block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    disabled={loading}
                                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-slate-750 focus:border-slate-700' : 'bg-slate-50/55 border-slate-200 text-slate-850 placeholder-slate-400 focus:ring-slate-200 focus:border-slate-300'} ${validationErrors.email ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                                />
                            </div>
                            {validationErrors.email && (
                                <p className="text-xs font-semibold text-rose-600 mt-1 pl-1">
                                    {validationErrors.email[0]}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className={`text-xs sm:text-sm font-black tracking-wide ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Password
                                </label>
                                <a href="#forgot" className={`text-xs font-bold ${activeTheme.primaryText} hover:opacity-85 transition-opacity`}>
                                    Forgot Password?
                                </a>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    className={`w-full pl-11 pr-12 py-3.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-slate-750 focus:border-slate-700' : 'bg-slate-50/55 border-slate-200 text-slate-850 placeholder-slate-400 focus:ring-slate-200 focus:border-slate-300'} ${validationErrors.password ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-655 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {validationErrors.password && (
                                <p className="text-xs font-semibold text-rose-600 mt-1 pl-1">
                                    {validationErrors.password[0]}
                                </p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <input id="remember-me" type="checkbox" className="check-btn cursor-pointer" />
                            <label htmlFor="remember-me" className={`ml-2 text-xs sm:text-sm font-bold cursor-pointer select-none ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                                Keep me logged in
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 px-4 ${activeTheme.primaryBg} ${activeTheme.primaryHover} hover:scale-[1.02] active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md ${activeTheme.shadowClass} flex items-center justify-center space-x-2 border border-transparent cursor-pointer disabled:opacity-50 disabled:pointer-events-none`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Verifying Credentials...</span>
                                </>
                            ) : (
                                <>
                                    <span>Login Securely</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <label className={`text-xs font-black tracking-wide block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                    First Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={regFirstName}
                                    onChange={(e) => setRegFirstName(e.target.value)}
                                    placeholder="John"
                                    disabled={loading}
                                    required
                                    className={`w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-slate-750 focus:border-slate-700' : 'bg-slate-50/55 border-slate-200 text-slate-850 placeholder-slate-400 focus:ring-slate-200 focus:border-slate-300'} ${validationErrors.name ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className={`text-xs font-black tracking-wide block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Last Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={regLastName}
                                    onChange={(e) => setRegLastName(e.target.value)}
                                    placeholder="Doe"
                                    disabled={loading}
                                    required
                                    className={`w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-slate-750 focus:border-slate-700' : 'bg-slate-50/55 border-slate-200 text-slate-850 placeholder-slate-400 focus:ring-slate-200 focus:border-slate-300'} ${validationErrors.name ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className={`text-xs font-black tracking-wide block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                Email Address <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    disabled={loading}
                                    required
                                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-slate-750 focus:border-slate-700' : 'bg-slate-50/55 border-slate-200 text-slate-850 placeholder-slate-400 focus:ring-slate-200 focus:border-slate-300'} ${validationErrors.email ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                                />
                            </div>
                            {validationErrors.email && (
                                <p className="text-xs font-semibold text-rose-600 mt-1 pl-1">
                                    {validationErrors.email[0]}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className={`text-xs font-black tracking-wide block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    required
                                    className={`w-full pl-11 pr-12 py-3.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-slate-750 focus:border-slate-700' : 'bg-slate-50/55 border-slate-200 text-slate-850 placeholder-slate-400 focus:ring-slate-200 focus:border-slate-300'} ${validationErrors.password ? 'border-rose-500 focus:ring-rose-200' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-655 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {validationErrors.password && (
                                <p className="text-xs font-semibold text-rose-600 mt-1 pl-1">
                                    {validationErrors.password[0]}
                                </p>
                            )}
                        </div>

                        {/* Phone & City */}
                        <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <label className={`text-xs font-black tracking-wide block ${isDarkTheme ? 'text-slate-350' : 'text-slate-700'}`}>Phone</label>
                                <input
                                    type="text"
                                    value={regPhone}
                                    onChange={(e) => setRegPhone(e.target.value)}
                                    placeholder="+855..."
                                    disabled={loading}
                                    className={`w-full px-3 py-2.5 rounded-lg text-xs transition-all focus:outline-none focus:ring-1 ${isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-655 focus:ring-slate-750' : 'bg-slate-50 border-slate-200 text-slate-850 placeholder-slate-400 focus:ring-slate-300'}`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className={`text-xs font-black tracking-wide block ${isDarkTheme ? 'text-slate-350' : 'text-slate-700'}`}>City</label>
                                <input
                                    type="text"
                                    value={regCity}
                                    onChange={(e) => setRegCity(e.target.value)}
                                    placeholder="Phnom Penh"
                                    disabled={loading}
                                    className={`w-full px-3 py-2.5 rounded-lg text-xs transition-all focus:outline-none focus:ring-1 ${isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-655 focus:ring-slate-750' : 'bg-slate-50 border-slate-200 text-slate-850 placeholder-slate-400 focus:ring-slate-300'}`}
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5">
                            <label className={`text-xs font-black tracking-wide block ${isDarkTheme ? 'text-slate-350' : 'text-slate-700'}`}>Address</label>
                            <input
                                type="text"
                                value={regAddress}
                                onChange={(e) => setRegAddress(e.target.value)}
                                placeholder="Street Name, Apt, etc."
                                disabled={loading}
                                className={`w-full px-3.5 py-2.5 rounded-lg text-xs transition-all focus:outline-none focus:ring-1 ${isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-655 focus:ring-slate-750' : 'bg-slate-50 border-slate-200 text-slate-850 placeholder-slate-400 focus:ring-slate-300'}`}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 px-4 ${activeTheme.primaryBg} ${activeTheme.primaryHover} hover:scale-[1.02] active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md ${activeTheme.shadowClass} flex items-center justify-center space-x-2 border border-transparent cursor-pointer disabled:opacity-50 disabled:pointer-events-none`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign Up</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className={`mt-8 pt-6 border-t ${isDarkTheme ? 'border-slate-800/60' : 'border-slate-100'} flex flex-col items-center space-y-4 font-semibold text-slate-500`}>
                    <p className="text-xs sm:text-sm">
                        {isRegister ? 'Already have an account? ' : 'New to store? '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setErrorMessage(null);
                                setValidationErrors({});
                            }}
                            className={`font-black hover:scale-105 active:scale-95 transition-transform ${activeTheme.primaryText} border-none bg-transparent cursor-pointer`}
                        >
                            {isRegister ? 'Login' : 'Create an account'}
                        </button>
                    </p>

                    {!isRegister && (
                        <p className="text-xs">
                            Are you a store owner?{' '}
                            <a
                                href="/owner/login"
                                onClick={(e) => {
                                    if (onNavigate) {
                                        e.preventDefault();
                                        onNavigate('/owner/login');
                                    }
                                }}
                                className={`font-black hover:scale-105 active:scale-95 transition-transform ${activeTheme.primaryText}`}
                            >
                                Owner Login
                            </a>
                        </p>
                    )}

                    <button
                        onClick={onNavigateHome}
                        className="text-xs font-bold text-slate-400 hover:text-slate-605 transition-colors flex items-center space-x-1 border-none bg-transparent cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back to Storefront</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

