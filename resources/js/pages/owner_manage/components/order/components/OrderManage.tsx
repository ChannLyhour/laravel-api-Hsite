import React from 'react';
import { FiCheck, FiXCircle, FiPlayCircle, FiTruck } from 'react-icons/fi';

interface OrderManageProps {
  status: 'pending' | 'confirm' | 'processing' | 'canceled' | 'cancelled' | 'complete' | 'delivering';
  transitionStatus: (newStatus: 'pending' | 'confirm' | 'processing' | 'canceled' | 'cancelled' | 'complete' | 'delivering') => void;
  getStatusLabel: (status: any) => string;
}

export const OrderManage: React.FC<OrderManageProps> = ({
  status,
  transitionStatus,
  getStatusLabel,
}) => {
  return (
    <div className="space-y-2.5">
      {/* Stepper Buttons based on current state */}
      {status === 'pending' && (
        <>
          <button
            onClick={() => transitionStatus('confirm')}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-[5px] text-xs font-black transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
          >
            <FiCheck className="w-4 h-4" />
            <span>Confirm Order</span>
          </button>
          <button
            onClick={() => transitionStatus('canceled')}
            className="w-full py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/50 hover:border-rose-100 rounded-[5px] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
          >
            <FiXCircle className="w-4 h-4" />
            <span>Cancel Order</span>
          </button>
        </>
      )}

      {status === 'confirm' && (
        <>
          <button
            onClick={() => transitionStatus('processing')}
            className="w-full py-3 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-600 text-white rounded-[5px] text-xs font-black transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
          >
            <FiPlayCircle className="w-4 h-4" />
            <span>Process Order</span>
          </button>
          <button
            onClick={() => transitionStatus('canceled')}
            className="w-full py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/50 hover:border-rose-100 rounded-[5px] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
          >
            <FiXCircle className="w-4 h-4" />
            <span>Cancel Order</span>
          </button>
        </>
      )}

      {status === 'processing' && (
        <>
          <button
            onClick={() => transitionStatus('delivering')}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-[5px] text-xs font-black transition-all shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/20 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
          >
            <FiTruck className="w-4 h-4" />
            <span>Ship / Deliver Order</span>
          </button>
          <button
            onClick={() => transitionStatus('canceled')}
            className="w-full py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/50 hover:border-rose-100 rounded-[5px] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
          >
            <FiXCircle className="w-4 h-4" />
            <span>Cancel Order</span>
          </button>
        </>
      )}

      {status === 'delivering' && (
        <>
          <button
            onClick={() => transitionStatus('complete')}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-[5px] text-xs font-black transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
          >
            <FiCheck className="w-4 h-4" />
            <span>Mark Order Complete</span>
          </button>
          <button
            onClick={() => transitionStatus('canceled')}
            className="w-full py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/50 hover:border-rose-100 rounded-[5px] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
          >
            <FiXCircle className="w-4 h-4" />
            <span>Cancel Order</span>
          </button>
        </>
      )}

      {(status === 'complete' || status === 'canceled') && (
        <div className="p-4 bg-slate-50 border border-slate-200/60 text-center text-xs font-semibold rounded-[5px] text-slate-400 leading-relaxed shadow-3xs">
          This transaction has been finalized in state: <span className="font-extrabold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-[3px] border border-slate-200/40 ml-1">{getStatusLabel(status)}</span>. No further workflow steps are available.
        </div>
      )}
    </div>
  );
};
