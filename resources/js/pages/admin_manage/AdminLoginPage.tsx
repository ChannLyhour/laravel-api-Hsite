import React, { useState } from 'react';
import { FiMail, FiLock, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { authService } from '@/api/auth';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.adminLogin({ email, password });
      
      // Save token temporarily to fetch user profile
      localStorage.setItem('master_admin_token', res.token);
      
      try {
        const profile = await authService.getCurrentUser(res.token);
        if (profile.user.role === 'admin') {
          setIsLoading(false);
          toast.success('Platform Master Admin authentication successful!');
          onLoginSuccess(res.token);
        } else {
          localStorage.removeItem('master_admin_token');
          setIsLoading(false);
          toast.error('Access Denied: You do not have Master Admin privileges.');
        }
      } catch (profileErr) {
        localStorage.removeItem('master_admin_token');
        setIsLoading(false);
        toast.error('Failed to verify user role. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err.response?.data?.detail || err.message || 'Invalid master credentials. Please try again.';
      toast.error(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-orange-500/20 selection:text-orange-500">
      {/* Decorative Blur Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => onNavigate('/')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center space-x-2 text-xs font-black uppercase tracking-wider bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-[5px] cursor-pointer"
      >
        <FiArrowLeft className="w-3.5 h-3.5" />
        <span>Return Home</span>
      </button>

      {/* Login Box Wrapper */}
      <div className="w-full max-w-[420px] z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-gradient-to-tr from-primary to-orange-400 rounded-[5px] items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-4 animate-pulse">
            <FiShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white leading-none">BiteFlow</h1>
          <p className="text-[10px] font-black text-primary tracking-widest uppercase mt-1">Platform Master Console</p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-[5px] p-6 sm:p-8 shadow-2xl relative">
          <h2 className="text-lg font-bold text-white mb-1">Administrative Access</h2>
          <p className="text-xs font-semibold text-slate-400 mb-6">Enter platform credentials to manage all multi-tenant stores.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Master Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <FiMail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="admin@biteflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-[5px] text-xs font-semibold text-white placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Master Secure Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <FiLock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-[5px] text-xs font-semibold text-white placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Hint alert */}
            <div className="bg-orange-500/10 border border-orange-500/10 rounded-[5px] p-3 text-[11px] font-semibold text-orange-400 leading-relaxed space-y-1">
              <div>💡 <strong>Database Credentials:</strong></div>
              <div className="text-[10px] font-bold text-slate-300">Super Admin: admin@example.com / password123</div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:bg-slate-800 text-white font-extrabold text-xs rounded-[5px] transition-all cursor-pointer shadow-md shadow-orange-500/10 active:scale-[0.98] flex items-center justify-center space-x-2 border-none mt-2"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In Master Panel</span>
              )}
            </button>
          </form>
        </div>

        {/* Platform Footer */}
        <p className="text-center text-[10px] font-black text-slate-600 tracking-wider uppercase mt-8 leading-none">
          BiteFlow Multi-Store Engine © 2026
        </p>
      </div>
    </div>
  );
};
