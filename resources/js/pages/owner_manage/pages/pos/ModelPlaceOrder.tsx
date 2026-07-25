import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiCheck, FiDollarSign, FiCreditCard, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { Store_setting } from '@/api/owner/stores';
import { resolveImageUrl } from '@/api/imageUtils';

export interface CartItem {
     id: number;
     name: string;
     price: number;
     quantity: number;
     image?: string;
     sku?: string;
     selectedOptions?: {
          [key: string]: string | undefined;
     };
     addons?: {
          id: number | string;
          addon_name: string;
          additional_price: number | string;
     }[];
}

export interface ModelPlaceOrderProps {
     isOpen: boolean;
     onClose: () => void;
     cart: CartItem[];
     subtotal: number;
     tax: number;
     taxPercentage: number;
     total: number;
     couponDiscount: number;
     extraDiscount: number;
     customerName: string;
     isSaving?: boolean;
     onConfirm: (paymentMethodId: string, paidAmount: number) => Promise<void> | void;
}

interface GatewayOption {
     id: string;
     name: string;
     logoColor: string;
     textColor: string;
     logoText: string;
}

const GATEWAY_TEMPLATES: GatewayOption[] = [
     { id: 'aba', name: 'ABA PAY', logoColor: 'bg-[#005d7e]', textColor: 'text-white', logoText: 'ABA' },
     { id: 'bakong', name: 'Bakong KHQR', logoColor: 'bg-[#b30006]', textColor: 'text-white', logoText: 'Bakong' },
     { id: 'card', name: 'Credit/Debit Card', logoColor: 'bg-slate-100 border border-slate-200', textColor: 'text-slate-800', logoText: '💳' },
     { id: 'acleda', name: 'ACLEDA PAY', logoColor: 'bg-[#0d3b66]', textColor: 'text-amber-400', logoText: 'ACLEDA' },
     { id: 'wing', name: 'Wing Bank', logoColor: 'bg-[#84bd00]', textColor: 'text-blue-900', logoText: 'Wing' },
     { id: 'chipmong', name: 'CHIP MONG BANK', logoColor: 'bg-[#009b72]', textColor: 'text-white', logoText: 'CMB' },
     { id: 'transfer', name: 'Bank Transfer', logoColor: 'bg-slate-50 border border-slate-200', textColor: 'text-slate-700', logoText: '🏦' },
     { id: 'cod', name: 'Cash on Delivery', logoColor: 'bg-slate-50 border border-slate-200', textColor: 'text-slate-700', logoText: '💵' }
];

export const ModelPlaceOrder: React.FC<ModelPlaceOrderProps> = ({
     isOpen,
     onClose,
     cart,
     subtotal,
     tax,
     taxPercentage,
     total,
     couponDiscount,
     extraDiscount,
     customerName,
     isSaving = false,
     onConfirm
}) => {
     const [selectedGateway, setSelectedGateway] = useState<string>('cash');
     const [paidAmount, setPaidAmount] = useState<string>('');

     // Group 1: Cash and Card
     const group1Gateways = useMemo(() => {
          const cashGw: GatewayOption = { id: 'cash', name: 'Cash', logoColor: 'bg-emerald-600', textColor: 'text-white', logoText: '💵' };
          const cardGw: GatewayOption = { id: 'card', name: 'Card', logoColor: 'bg-slate-700', textColor: 'text-white', logoText: '💳' };
          return [cashGw, cardGw];
     }, []);

     // Group 2: Payment Gateways from settings (excluding Cash and Card)
     const group2Gateways = useMemo(() => {
          const settings = Store_setting();
          const configuredMethods = settings?.payment_methods || {};
          
          const list: GatewayOption[] = [];
          GATEWAY_TEMPLATES.forEach(tmpl => {
               if (tmpl.id !== 'cash' && tmpl.id !== 'card' && configuredMethods[tmpl.id]?.enabled) {
                    list.push(tmpl);
               }
          });
          return list;
     }, [isOpen]);

     // Set default gateway when options load
     useEffect(() => {
          const allGateways = [...group1Gateways, ...group2Gateways];
          if (allGateways.length > 0 && !allGateways.some(g => g.id === selectedGateway)) {
               setSelectedGateway(allGateways[0].id);
          }
     }, [group1Gateways, group2Gateways]);

     // Set default paid amount to exact total when modal opens or total changes
     useEffect(() => {
          if (isOpen) {
               setPaidAmount(total.toFixed(2));
          }
     }, [isOpen, total]);

     // Automatically lock paid amount to checkout total for non-cash payments
     useEffect(() => {
          if (selectedGateway !== 'cash') {
               setPaidAmount(total.toFixed(2));
          }
     }, [selectedGateway, total]);

     // Calculate change
     const numericPaid = parseFloat(paidAmount) || 0;
     const changeAmount = Math.max(0, numericPaid - total);
     const isPaidAmountSufficient = numericPaid >= total - 0.001; // Allow minor floating point offset

     // Quick cash amounts based on total
     const quickCashAmounts = useMemo(() => {
          if (total <= 0) return [];
          const exact = parseFloat(total.toFixed(2));
          const next5 = Math.ceil(total / 5) * 5;
          const next10 = Math.ceil(total / 10) * 10;
          const next20 = Math.ceil(total / 20) * 20;
          const next50 = Math.ceil(total / 50) * 50;
          const next100 = Math.ceil(total / 100) * 100;

          const unique = new Set<number>();
          unique.add(exact);
          if (next5 > exact) unique.add(next5);
          if (next10 > exact) unique.add(next10);
          if (next20 > exact) unique.add(next20);
          if (next50 > exact) unique.add(next50);
          if (next100 > exact) unique.add(next100);

          return Array.from(unique).slice(0, 5);
     }, [total, isOpen]);

     const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (!isPaidAmountSufficient) return;
          onConfirm(selectedGateway, numericPaid);
     };

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 animate-fade-in p-4 font-sans">
               <div
                    className="absolute inset-0 cursor-default"
                    onClick={onClose}
               />

               <div className="relative w-full max-w-4xl bg-white rounded-[5px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 z-10 animate-scale-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white shrink-0">
                         <div>
                              <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                                   <span className="w-2 h-2 rounded-[1px] bg-primary animate-pulse" />
                                   Place Order & Process Payment
                              </h3>
                              <p className="text-slate-400 text-[11px] font-medium mt-0.5">
                                   Review transaction items and select active payment gateway
                              </p>
                         </div>
                         <button
                              onClick={onClose}
                              className="w-8 h-8 flex items-center justify-center rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-500 border-none cursor-pointer transition-colors"
                         >
                              <FiX className="w-4 h-4" />
                         </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col md:flex-row gap-6">

                         {/* Left Side: Order Details (Summary & Item list) */}
                         <div className="flex-1 flex flex-col border border-slate-200/60 rounded-[5px] bg-slate-50/50 overflow-hidden">
                              <div className="px-4 py-3 bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-100 flex justify-between items-center shrink-0">
                                   <span className="text-xs font-bold text-slate-700">Detail Order</span>
                                   <span className="px-2 py-0.5 rounded-[5px] bg-slate-200/60 text-slate-600 text-[10px] font-semibold">
                                        Customer: {customerName}
                                   </span>
                              </div>

                              {/* List Product Order */}
                              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                   {cart.map((item, idx) => {
                                        const itemSubtotal = item.price * item.quantity;
                                        return (
                                             <div
                                                  key={item.id || idx}
                                                  className="flex gap-3 p-3 bg-white border border-slate-200/60 rounded-[5px] shadow-2xs hover:border-slate-300 transition-all"
                                             >
                                                  {/* Image Thumbnail */}
                                                  <div className="w-12 h-12 rounded-md bg-slate-100 border border-slate-150 overflow-hidden shrink-0 flex items-center justify-center">
                                                       {item.image ? (
                                                            <img
                                                                 src={item.image.startsWith('http') ? item.image : resolveImageUrl(item.image)}
                                                                 alt={item.name}
                                                                 className="w-full h-full object-cover"
                                                            />
                                                       ) : (
                                                            <span className="text-lg">📦</span>
                                                       )}
                                                  </div>

                                                  {/* Product Metadata */}
                                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                       <div>
                                                            <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                                                                 {item.name}
                                                            </h4>

                                                            {/* Variations if have show */}
                                                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                                 <div className="flex flex-wrap gap-1 mt-1">
                                                                      {Object.entries(item.selectedOptions).map(([key, val]) => (
                                                                           <span
                                                                                key={key}
                                                                                className="bg-slate-100 text-slate-600 border border-slate-200/40 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
                                                                           >
                                                                                {key}: {val}
                                                                           </span>
                                                                      ))}
                                                                 </div>
                                                            )}

                                                            {/* Addons if have show */}
                                                            {item.addons && item.addons.length > 0 && (
                                                                 <div className="flex flex-wrap gap-1 mt-1">
                                                                      {item.addons.map((addon, aIdx) => (
                                                                           <span
                                                                                key={addon.id || aIdx}
                                                                                className="bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                                                           >
                                                                                + {addon.addon_name} (${Number(addon.additional_price).toFixed(2)})
                                                                           </span>
                                                                      ))}
                                                                 </div>
                                                            )}
                                                       </div>

                                                       <div className="flex justify-between items-center mt-1 text-[10px]">
                                                            <span className="text-slate-400 font-semibold">
                                                                 Price: <strong className="text-slate-700">${item.price.toFixed(2)}</strong> x {item.quantity}
                                                            </span>
                                                            <span className="text-slate-800 font-bold">
                                                                 ${itemSubtotal.toFixed(2)}
                                                            </span>
                                                       </div>
                                                  </div>
                                             </div>
                                        );
                                   })}
                              </div>

                              {/* Calculations and Breakdown */}
                              <div className="border-t border-slate-200 bg-slate-50/50 p-4 space-y-1.5 text-xs text-slate-500 font-medium shrink-0">
                                   <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="text-slate-800 font-semibold">${subtotal.toFixed(2)}</span>
                                   </div>
                                   {couponDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                             <span>Coupon Discount:</span>
                                             <span className="font-semibold">-${couponDiscount.toFixed(2)}</span>
                                        </div>
                                   )}
                                   {extraDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                             <span>Extra Discount:</span>
                                             <span className="font-semibold">-${extraDiscount.toFixed(2)}</span>
                                        </div>
                                   )}
                                   <div className="flex justify-between">
                                        <span>VAT Tax ({taxPercentage}%):</span>
                                        <span className="text-slate-800 font-semibold">${tax.toFixed(2)}</span>
                                   </div>
                                   <div className="flex justify-between text-slate-800 font-black text-sm pt-2.5 border-t border-slate-200/80 mt-1">
                                        <span>Total Amount:</span>
                                        <span className="text-primary font-bold text-base">${total.toFixed(2)}</span>
                                   </div>
                              </div>
                         </div>

                         {/* Right Side: Detail Payment */}
                         <div className="w-full md:w-[380px] flex flex-col space-y-4">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detail Payment</h4>

                              {/* Paid by selector */}
                              <div className="space-y-3">
                                   {/* Group 1: Cash & Card */}
                                   <div className="space-y-1.5">
                                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Method (Cash / Card)</span>
                                        <div className="grid grid-cols-2 gap-2">
                                             {group1Gateways.map(gw => {
                                                  const isSelected = selectedGateway === gw.id;
                                                  return (
                                                       <button
                                                            key={gw.id}
                                                            type="button"
                                                            onClick={() => setSelectedGateway(gw.id)}
                                                            className={`p-2.5 rounded-[5px] border text-left flex items-center gap-2.5 cursor-pointer transition-all relative overflow-hidden group ${isSelected
                                                                      ? 'border-primary bg-orange-50/20 shadow-sm ring-1 ring-primary/30'
                                                                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                                 }`}
                                                       >
                                                            <div className={`w-8 h-6 rounded-[3px] flex items-center justify-center font-bold text-[9px] shrink-0 ${gw.logoColor} ${gw.textColor}`}>
                                                                 {gw.logoText}
                                                            </div>
                                                            <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                                                                 {gw.name}
                                                            </span>
                                                            {isSelected && (
                                                                 <div className="absolute right-0 top-0 bg-primary text-white w-4 h-4 rounded-bl flex items-center justify-center">
                                                                      <FiCheck className="w-2.5 h-2.5" />
                                                                 </div>
                                                            )}
                                                       </button>
                                                  );
                                             })}
                                        </div>
                                   </div>

                                   {/* Group 2: Payment Gateways list */}
                                   {group2Gateways.length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                             <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Payment Gateways</span>
                                             <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-0.5 custom-scrollbar">
                                                  {group2Gateways.map(gw => {
                                                       const isSelected = selectedGateway === gw.id;
                                                       return (
                                                            <button
                                                                 key={gw.id}
                                                                 type="button"
                                                                 onClick={() => setSelectedGateway(gw.id)}
                                                                 className={`p-2.5 rounded-[5px] border text-left flex items-center gap-2.5 cursor-pointer transition-all relative overflow-hidden group ${isSelected
                                                                           ? 'border-primary bg-orange-50/20 shadow-sm ring-1 ring-primary/30'
                                                                           : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                                      }`}
                                                            >
                                                                 <div className={`w-8 h-6 rounded-[3px] flex items-center justify-center font-bold text-[9px] shrink-0 ${gw.logoColor} ${gw.textColor}`}>
                                                                      {gw.logoText}
                                                                 </div>
                                                                 <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                                                                      {gw.name}
                                                                 </span>
                                                                 {isSelected && (
                                                                      <div className="absolute right-0 top-0 bg-primary text-white w-4 h-4 rounded-bl flex items-center justify-center">
                                                                           <FiCheck className="w-2.5 h-2.5" />
                                                                      </div>
                                                                 )}
                                                            </button>
                                                       );
                                                  })}
                                             </div>
                                        </div>
                                   )}
                              </div>

                              {/* Calculations Form */}
                              <form onSubmit={handleSubmit} className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
                                   <div className="space-y-4">
                                        {/* Paid Amount */}
                                        <div className="space-y-1.5">
                                             <label className="text-[11px] font-bold text-slate-400 uppercase block">Paid Amount ($)</label>
                                             <div className="relative">
                                                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                                                  <input
                                                       type="number"
                                                       min="0"
                                                       step="0.01"
                                                       placeholder="0.00"
                                                       value={paidAmount}
                                                       onChange={e => setPaidAmount(e.target.value)}
                                                       readOnly={selectedGateway !== 'cash'}
                                                       className={`w-full pl-8 pr-4 py-3 border rounded-[5px] text-lg font-black text-slate-800 outline-none transition-all ${selectedGateway !== 'cash'
                                                                 ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
                                                                 : isPaidAmountSufficient
                                                                      ? 'bg-white border-slate-200 focus:border-primary'
                                                                      : 'bg-rose-50/10 border-rose-300 focus:border-rose-500'
                                                            }`}
                                                       required
                                                  />
                                             </div>

                                             {/* Paid Sufficiency Alert */}
                                             {!isPaidAmountSufficient && (
                                                  <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-bold mt-1">
                                                       <FiAlertCircle className="w-3.5 h-3.5" />
                                                       <span>Insufficient paid amount (Total: ${total.toFixed(2)})</span>
                                                  </div>
                                             )}
                                        </div>

                                        {/* Quick Cash helpers */}
                                        {selectedGateway === 'cash' && quickCashAmounts.length > 0 && (
                                             <div className="space-y-1.5">
                                                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Quick Cash Shortcuts</span>
                                                  <div className="flex flex-wrap gap-1.5">
                                                       {quickCashAmounts.map(val => (
                                                            <button
                                                                 key={val}
                                                                 type="button"
                                                                 onClick={() => setPaidAmount(val.toFixed(2))}
                                                                 className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[5px] text-[10px] font-bold border-none cursor-pointer transition-colors"
                                                            >
                                                                 ${val.toFixed(2)}
                                                            </button>
                                                       ))}
                                                  </div>
                                             </div>
                                        )}

                                        {/* Change amount */}
                                        <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 flex justify-between items-center">
                                             <div className="text-xs font-semibold text-slate-500">
                                                  Change Amount:
                                             </div>
                                             <div className="text-right">
                                                  <span className="text-lg font-extrabold text-slate-800">
                                                       ${changeAmount.toFixed(2)}
                                                  </span>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Action Buttons */}
                                   <div className="flex gap-3 pt-6 border-t border-slate-100 shrink-0">
                                        <button
                                             type="button"
                                             onClick={onClose}
                                             className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-[5px] font-bold text-xs transition-colors border-none cursor-pointer text-center"
                                        >
                                             Cancel
                                        </button>
                                        <button
                                             type="submit"
                                             disabled={isSaving || !isPaidAmountSufficient}
                                             className={`flex-1 text-white py-3 rounded-[5px] font-bold text-xs transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 ${isSaving || !isPaidAmountSufficient
                                                       ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                                       : 'bg-primary hover:bg-primary-hover active:scale-98'
                                                  }`}
                                        >
                                             {isSaving ? (
                                                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                             ) : (
                                                  <FiCheck className="w-3.5 h-3.5" />
                                             )}
                                             <span>{isSaving ? 'Processing...' : 'Confirm Checkout'}</span>
                                        </button>
                                   </div>
                              </form>
                         </div>

                    </div>
               </div>
          </div>
     );
};
