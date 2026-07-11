// @premium - Responsive Mobile Template Preview Card
// Renders a rich preview card for phone & tablet templates in the Storefront Theme Selection panel

import React, { useState } from 'react';
import type { SmartPhoneThemeInfo } from './paidSmartPhoneThemes';
import { 
  FiSmartphone, FiStar, FiLock, FiShoppingCart, FiEye, FiCheck, 
  FiCheckCircle, FiX, FiCreditCard, FiInfo, FiZap, FiTablet, FiDownload
} from 'react-icons/fi';

interface SmartPhoneTemplateCardProps {
  template: SmartPhoneThemeInfo;
  isUnlocked: boolean;
  isActive: boolean;
  onPurchase: (template: SmartPhoneThemeInfo) => void;
  onActivate: (templateId: string) => void;
  onPreview: (templateId: string) => void;
  onDownload?: (templateId: string) => void;
  isAdmin?: boolean;
}

export const SmartPhoneTemplateCard: React.FC<SmartPhoneTemplateCardProps> = ({
  template,
  isUnlocked,
  isActive,
  onPurchase,
  onActivate,
  onPreview,
  onDownload,
  isAdmin = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const supportsPhone = template.supportedDevices.includes('phone');
  const supportsTablet = template.supportedDevices.includes('tablet');

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }).map((_, idx) => (
        <FiStar key={idx} className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      ))}
    </div>
  );

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => isUnlocked ? onActivate(template.id) : onPurchase(template)}
      className={`relative border rounded-[4px] overflow-hidden cursor-pointer transition-all duration-300 flex flex-col group bg-white ${
        isActive
          ? 'border-violet-500 ring-2 ring-violet-500/10 shadow-md scale-[1.01]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Preview Area – Dual device mockup gradient */}
      <div className={`h-52 relative bg-gradient-to-br ${template.previewGradient} overflow-hidden select-none border-b border-slate-150 shrink-0`}>
        
        {/* Decorative dual-device frame in center */}
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          {/* Phone mockup */}
          {supportsPhone && (
            <div className={`w-16 h-28 rounded-[10px] border-2 border-white/30 bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center space-y-1 shadow-lg transition-all duration-500 ${isHovered ? 'scale-105 -translate-x-1' : ''}`}>
              <FiSmartphone className="w-4 h-4 text-white/80" />
              <div className="space-y-0.5 flex flex-col items-center">
                <div className="w-8 h-0.5 bg-white/30 rounded-full" />
                <div className="w-5 h-0.5 bg-white/20 rounded-full" />
              </div>
              <div className="flex space-x-0.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
              </div>
            </div>
          )}

          {/* Tablet mockup */}
          {supportsTablet && (
            <div className={`w-28 h-20 rounded-[8px] border-2 border-white/25 bg-white/8 backdrop-blur-sm flex flex-col items-center justify-center space-y-1 shadow-lg transition-all duration-500 ${isHovered ? 'scale-105 translate-x-1' : ''}`}>
              <FiTablet className="w-5 h-5 text-white/70" />
              <div className="flex space-x-1">
                <div className="w-8 h-3 rounded-[3px] bg-white/15 border border-white/10" />
                <div className="w-8 h-3 rounded-[3px] bg-white/10 border border-white/10" />
              </div>
            </div>
          )}
        </div>

        {/* Floating decorative circles */}
        <div className="absolute top-3 right-3 w-12 h-12 bg-white/5 rounded-full blur-md" />
        <div className="absolute bottom-3 left-3 w-8 h-8 bg-white/5 rounded-full blur-sm" />
        <div className="absolute top-1/2 left-6 w-6 h-6 bg-white/3 rounded-full blur-xs" />

        {/* Badge */}
        {template.badge && (
          <span className={`absolute top-3 left-3 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-[3px] shadow-2xs ${template.badgeBg}`}>
            {template.badge}
          </span>
        )}

        {/* Device Support Tags – bottom-right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {supportsPhone && (
            <span className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest rounded-[3px] bg-black/30 text-white/80 backdrop-blur-xs flex items-center gap-0.5">
              <FiSmartphone className="w-2.5 h-2.5" />
              Phone
            </span>
          )}
          {supportsTablet && (
            <span className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest rounded-[3px] bg-black/30 text-white/80 backdrop-blur-xs flex items-center gap-0.5">
              <FiTablet className="w-2.5 h-2.5" />
              Tablet
            </span>
          )}
        </div>

        {/* Premium Lock Overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center transition-all opacity-100 group-hover:bg-slate-900/50 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-sm text-slate-800 text-[10px] font-bold uppercase tracking-wider scale-95 group-hover:scale-100 transition-all">
              <FiLock className="text-violet-500 w-3 h-3" />
              <span>Premium Responsive App</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Details Block */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow gap-3">
        {/* Title, Category & Authors */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2.5">
            <h5 className="font-black text-slate-800 text-sm sm:text-base leading-tight hover:text-violet-600 transition-colors line-clamp-2 min-h-[38px] flex-grow pr-1">
              {template.name}
            </h5>
            
            {/* Prices */}
            <div className="text-right shrink-0 flex flex-col items-end pt-0.5">
              <span className="text-[10px] font-semibold text-slate-400 line-through leading-none">{template.originalPrice}</span>
              <span className={`text-sm font-black leading-none mt-0.5 ${!isUnlocked ? 'text-violet-600' : 'text-emerald-600'}`}>
                {isUnlocked ? 'Unlocked' : template.price}
              </span>
            </div>
          </div>

          {/* Device support indicators */}
          <div className="flex items-center space-x-1.5 py-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Devices:</span>
            <div className="flex items-center gap-1.5">
              {supportsPhone && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-[3px]">
                  <FiSmartphone className="w-2.5 h-2.5" />
                  Phone
                </span>
              )}
              {supportsTablet && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-[3px]">
                  <FiTablet className="w-2.5 h-2.5" />
                  Tablet
                </span>
              )}
              <span className={`w-3.5 h-3.5 rounded-full border border-white bg-gradient-to-r ${template.previewGradient} shadow-3xs`} />
            </div>
          </div>

          {/* Author Line */}
          <p className="text-[10px] font-semibold text-slate-400 leading-none">
            by <span className="text-slate-500 hover:text-violet-500 transition-colors cursor-pointer">{template.author}</span> in <span className="text-violet-500 hover:underline cursor-pointer">{template.category}</span>
          </p>
        </div>

        {/* Features list – collapsed */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Key Features</span>
          <div className="grid grid-cols-1 gap-0.5">
            {template.features.slice(0, 5).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <FiCheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[10px] font-semibold text-slate-500 line-clamp-1">{feature}</span>
              </div>
            ))}
            {template.features.length > 5 && (
              <span className="text-[9px] font-bold text-violet-400 pl-4.5">
                +{template.features.length - 5} more features
              </span>
            )}
          </div>
        </div>

        {/* Star Ratings & Sales Count */}
        <div className="flex items-center justify-between text-slate-400 border-t border-slate-50 pt-3">
          <div className="flex items-center gap-1">
            {renderStars(template.rating)}
            <span className="text-[10px] font-black text-slate-600">({template.reviews})</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500">{template.sales}</span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          {/* Cart Selection / Purchase Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              isUnlocked ? onActivate(template.id) : onPurchase(template);
            }}
            className={`p-2 rounded-[4px] transition-all cursor-pointer border ${
              isActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300'
            }`}
            title={
              isActive 
                ? 'Template activated' 
                : !isUnlocked 
                  ? (isAdmin ? 'This template is locked. Please assign it from the Admin Panel.' : 'Purchase this premium template') 
                  : 'Activate this mobile template'
            }
          >
            {isActive ? (
              <FiCheck className="w-4 h-4" />
            ) : !isUnlocked ? (
              <FiShoppingCart className="w-4 h-4 text-violet-500" />
            ) : (
              <FiShoppingCart className="w-4 h-4" />
            )}
          </button>

          {isUnlocked && onDownload && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(template.id);
              }}
              className="p-2 border border-slate-200 hover:border-emerald-350 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-[4px] transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Download Source Code ZIP"
            >
              <FiDownload className="w-4 h-4" />
            </button>
          )}

          {/* Preview Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(template.id);
            }}
            className="flex-grow py-2 px-3.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-850 hover:bg-slate-50 text-xs font-black rounded-[4px] transition-all cursor-pointer text-center flex items-center justify-center space-x-1"
          >
            <FiEye className="w-3.5 h-3.5 text-slate-400" />
            <span>Live Preview</span>
          </button>

          {/* Apply / Buy / Active Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              isUnlocked ? onActivate(template.id) : onPurchase(template);
            }}
            className={`px-4 py-2 text-xs font-black rounded-[4px] transition-all cursor-pointer border ${
              isActive
                ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white shadow-2xs'
                : !isUnlocked
                  ? (isAdmin 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-violet-500 hover:bg-violet-600 border-transparent text-white shadow-2xs')
                  : 'bg-white hover:bg-violet-50 border-violet-500 text-violet-600 hover:text-violet-700'
            }`}
          >
            {isActive 
              ? 'Active' 
              : !isUnlocked 
                ? (isAdmin ? 'Locked' : 'Buy App') 
                : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Purchase Modal for Responsive Mobile Templates ──────────────────────────
interface SmartPhonePurchaseModalProps {
  template: SmartPhoneThemeInfo;
  isProcessing: boolean;
  paymentForm: { cardName: string; cardNumber: string; expiry: string; cvv: string };
  setPaymentForm: (form: { cardName: string; cardNumber: string; expiry: string; cvv: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const SmartPhonePurchaseModal: React.FC<SmartPhonePurchaseModalProps> = ({
  template,
  isProcessing,
  paymentForm,
  setPaymentForm,
  onSubmit,
  onClose,
}) => {
  const supportsPhone = template.supportedDevices.includes('phone');
  const supportsTablet = template.supportedDevices.includes('tablet');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[8px] max-w-md w-full overflow-hidden shadow-2xl animate-fade-in border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 shrink-0">
          <div className="flex items-center space-x-2">
            <FiSmartphone className="text-violet-500 w-4 h-4" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Unlock Mobile App Template</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit} className="p-5 space-y-5 flex-grow overflow-y-auto">
          
          {/* Product Preview Info */}
          <div className="bg-violet-50/50 border border-violet-100/50 p-4 rounded-[4px] flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-[6px] bg-gradient-to-br ${template.previewGradient} flex items-center justify-center shadow-md relative`}>
              <FiSmartphone className="w-5 h-5 text-white absolute left-2.5 top-3" />
              <FiTablet className="w-5 h-5 text-white/60 absolute right-2 bottom-2.5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm leading-tight">{template.name}</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">One-time developer license purchase</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {supportsPhone && (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider">
                    <FiSmartphone className="w-2 h-2" /> Phone
                  </span>
                )}
                {supportsTablet && (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider">
                    <FiTablet className="w-2 h-2" /> Tablet
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline space-x-1.5">
                <span className="text-xs text-slate-400 line-through leading-none">
                  {template.originalPrice}
                </span>
                <span className="text-base font-black text-violet-600 leading-none">
                  {template.price}
                </span>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-[4px] space-y-2">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <FiZap className="text-violet-400 w-3 h-3" />
              Included Features
            </h5>
            <div className="grid grid-cols-2 gap-1">
              {template.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <FiCheckCircle className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span className="text-[9px] font-semibold text-slate-500 line-clamp-1">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details Form */}
          <div className="space-y-3.5">
            <h5 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FiCreditCard className="text-slate-400" />
              <span>Cardholder Information</span>
            </h5>

            {/* Cardholder Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Card Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                disabled={isProcessing}
                value={paymentForm.cardName}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-semibold focus:outline-none focus:border-violet-500 disabled:bg-slate-50 transition-colors"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Card Number</label>
              <input
                type="text"
                required
                placeholder="•••• •••• •••• ••••"
                disabled={isProcessing}
                value={paymentForm.cardNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-semibold focus:outline-none focus:border-violet-500 disabled:bg-slate-50 transition-colors"
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Expiration</label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  disabled={isProcessing}
                  value={paymentForm.expiry}
                  onChange={(e) => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-semibold focus:outline-none focus:border-violet-500 disabled:bg-slate-50 transition-colors text-center"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">CVV</label>
                <input
                  type="password"
                  required
                  placeholder="•••"
                  maxLength={4}
                  disabled={isProcessing}
                  value={paymentForm.cvv}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-semibold focus:outline-none focus:border-violet-500 disabled:bg-slate-50 transition-colors text-center"
                />
              </div>
            </div>
          </div>

          {/* Secure Info Alert */}
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-[4px] flex items-start space-x-2.5">
            <FiInfo className="text-slate-400 w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-[10px] font-semibold text-slate-500 leading-normal">
              Your billing details are transmitted securely. This license includes both phone & tablet layouts. By continuing, you agree to purchase the mobile app template license.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 px-4 bg-violet-500 hover:bg-violet-600 text-white rounded-[4px] text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing Secure Payment...</span>
              </>
            ) : (
              <span>Authorize & Pay {template.price}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
