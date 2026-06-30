import React, { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiShield, FiAlertCircle } from 'react-icons/fi';
import { authService } from '@/api/auth';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';

interface AdminLoginPageProps {
  onLoginSuccess: (token: string) => void;
  onNavigate: (to: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setValidationErrors({});
    setSuccessMessage(null);

    // Frontend Validations
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
      // Connect to normal backend auth
      const response = await authService.adminLogin({ email, password });

      if (response.success) {
        // Retrieve current profile to verify they are admin or staff
        localStorage.setItem('admin_token', response.token);

        try {
          const userProfile = await authService.getCurrentUser(response.token);
          const userRole = userProfile.user.role?.toLowerCase() || '';

          if (userRole === 'owner' || userRole === 'admin') {
            setSuccessMessage('Access Granted! Redirecting to Management Console...');
            toast.success('Access Granted! Welcome back.');
            setTimeout(() => {
              onLoginSuccess(response.token);
            }, 1000);
          } else {
            // Remove token as role is insufficient
            localStorage.removeItem('admin_token');
            setErrorMessage('Access Denied. Your account does not possess Management privileges.');
            toast.error('Access Denied. Owners/Managers only.');
          }
        } catch (profileErr) {
          // Fallback if profile API isn't fully completed but token was returned
          console.warn('Failed to retrieve user profile details.', profileErr);
          setSuccessMessage('Authenticated. Redirecting...');
          toast.success('Authenticated successfully.');
          setTimeout(() => {
            onLoginSuccess(response.token);
          }, 1000);
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const details = error.details;
        setErrorMessage(details.message || 'Verification failed. Please review your credentials.');
        toast.error(details.message || 'Verification failed.');
        if (details.errors && Object.keys(details.errors).length > 0) {
          setValidationErrors(details.errors);
        }
      } else {
        const errMsg = error instanceof Error ? error.message : 'An unexpected server error occurred.';
        setErrorMessage(errMsg);
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 relative overflow-hidden font-kuntomruy">
      {/* Dynamic Subtle Color Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-[150px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-purple-500/5 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* Grid Overlay background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        {/* Navigation back */}
        <button
          onClick={() => onNavigate('/')}
          className="mb-6 flex items-center space-x-2 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors duration-200 cursor-pointer active:scale-95 group border-none bg-transparent"
        >
          <FiArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back Website</span>
        </button>

        {/* Card Panel */}
        <div className="bg-white border border-slate-100 rounded-[5px] shadow-xl shadow-slate-200/50 p-8 sm:p-10 relative overflow-hidden">

          {/* Subtle line glow */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-50 border border-orange-200/60 rounded-[5px] mb-4 text-orange-500 animate-pulse">
              <FiShield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Owner Portal
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Secure access for Store Owners, Store Managers
            </p>
          </div>

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-[5px] flex items-start space-x-3 text-rose-700 text-sm animate-fade-in font-medium">
              <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-[5px] flex items-start space-x-3 text-emerald-700 text-sm animate-fade-in font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0 animate-ping"></div>
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wider block uppercase">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FiMail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@store.com"
                  disabled={loading}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50/50 border rounded-[5px] text-slate-900 text-sm sm:text-base placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium ${validationErrors.email ? 'border-rose-500/50 focus:ring-rose-500/30' : 'border-slate-200'
                    }`}
                />
              </div>
              {validationErrors.email && (
                <p className="text-xs font-semibold text-rose-500 mt-1 pl-1">
                  {validationErrors.email[0]}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-sm font-bold text-slate-700 tracking-wider uppercase block">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FiLock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full pl-11 pr-12 py-3 bg-slate-50/50 border rounded-[5px] text-slate-900 text-sm sm:text-base placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium ${validationErrors.password ? 'border-rose-500/50 focus:ring-rose-500/30' : 'border-slate-200'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs font-semibold text-rose-500 mt-1 pl-1">
                  {validationErrors.password[0]}
                </p>
              )}
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-extrabold text-sm sm:text-base rounded-[5px] transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 border border-transparent cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating Identity...</span>
                </>
              ) : (
                <span>Log In Securely</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
