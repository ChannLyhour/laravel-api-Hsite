import React from 'react';
import { FiPrinter, FiX } from 'react-icons/fi';

export interface ReceiptItem {
     id: string | number;
     name: string;
     quantity: number;
     price: number;
}

export interface ReceiptData {
     orderId: string | number;
     customer: string;
     paymentMethod: string;
     date: string;
     items: ReceiptItem[];
     subtotal: number;
     couponDiscount: number;
     extraDiscount: number;
     taxPercentage?: number;
     tax: number;
     total: number;
}

interface ReceiptProps {
     isOpen: boolean;
     onClose: () => void;
     activeReceipt: ReceiptData | null;
}

export const Receipt: React.FC<ReceiptProps> = ({ isOpen, onClose, activeReceipt }) => {
     if (!isOpen || !activeReceipt) return null;

     return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in p-4 bg-slate-900/40">
               <div className="bg-white rounded-[14px] border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">

                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50/80 to-white">
                         <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                              <FiPrinter className="text-primary w-4 h-4" /> Transaction Invoice
                         </h4>
                         <button
                              onClick={onClose}
                              className="p-1 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer bg-transparent"
                         >
                              <FiX className="w-4 h-4" />
                         </button>
                    </div>

                    {/* Receipt Content */}
                    <div className="p-5 flex-1 overflow-y-auto space-y-4 text-slate-700 font-mono text-[11px] leading-tight custom-scrollbar">

                         <div className="text-center space-y-1">
                              <h2 className="text-sm font-black tracking-tight text-slate-800">VH OUTLET</h2>
                              <p className="text-slate-400">Order Invoice Summary</p>
                         </div>

                         <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-slate-500 font-bold">
                              <div className="flex justify-between">
                                   <span>INVOICE:</span>
                                   <span className="text-slate-800">{activeReceipt.orderId}</span>
                              </div>
                              <div className="flex justify-between">
                                   <span>CUSTOMER:</span>
                                   <span className="text-slate-800">{activeReceipt.customer}</span>
                              </div>
                              <div className="flex justify-between">
                                   <span>PAY METHOD:</span>
                                   <span className="text-slate-800 uppercase">{activeReceipt.paymentMethod}</span>
                              </div>
                              <div className="flex justify-between">
                                   <span>DATE/TIME:</span>
                                   <span className="text-slate-800">{activeReceipt.date}</span>
                              </div>
                         </div>

                         {/* Items Table */}
                         <div className="border-t border-b border-dashed border-slate-200 py-3 space-y-2">
                              <div className="flex justify-between text-slate-800 font-black">
                                   <span>ITEM</span>
                                   <span className="w-16 text-right">PRICE</span>
                              </div>
                              {activeReceipt.items.map((item) => (
                                   <div key={item.id} className="flex justify-between text-slate-600 font-semibold">
                                        <span>{item.name} (x{item.quantity})</span>
                                        <span className="w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                                   </div>
                              ))}
                         </div>

                         {/* Totals */}
                         <div className="space-y-1 pt-1 font-bold text-slate-500">
                              <div className="flex justify-between">
                                   <span>SUBTOTAL:</span>
                                   <span className="text-slate-800">${activeReceipt.subtotal.toFixed(2)}</span>
                              </div>
                              {activeReceipt.couponDiscount > 0 && (
                                   <div className="flex justify-between">
                                        <span>COUPON DISCOUNT:</span>
                                        <span className="text-slate-800">-${activeReceipt.couponDiscount.toFixed(2)}</span>
                                   </div>
                              )}
                              {activeReceipt.extraDiscount > 0 && (
                                   <div className="flex justify-between">
                                        <span>EXTRA DISCOUNT:</span>
                                        <span className="text-slate-800">-${activeReceipt.extraDiscount.toFixed(2)}</span>
                                   </div>
                              )}
                              <div className="flex justify-between">
                                   <span>VAT TAX ({activeReceipt.taxPercentage !== undefined ? activeReceipt.taxPercentage : 10}%):</span>
                                   <span className="text-slate-800">${activeReceipt.tax.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-slate-800 font-black text-sm pt-2 border-t border-slate-100">
                                   <span>TOTAL AMOUNT:</span>
                                   <span className="text-primary">${activeReceipt.total.toFixed(2)}</span>
                              </div>
                         </div>

                         <div className="text-center text-slate-400 text-[10px] pt-4 leading-relaxed font-semibold">
                              Thank you for ordering with us!<br />
                              Software powered by BiteFlow POS System.
                         </div>

                    </div>

                    {/* Modal Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5 shrink-0">
                         <button
                              onClick={() => { window.print(); }}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-[8px] font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95 duration-100"
                         >
                              <FiPrinter className="w-3.5 h-3.5" />
                              <span>Print Bill</span>
                         </button>
                         <button
                              onClick={onClose}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-[8px] font-bold text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                         >
                              <span>Close Invoice</span>
                         </button>
                    </div>

               </div>
          </div>
     );
};
