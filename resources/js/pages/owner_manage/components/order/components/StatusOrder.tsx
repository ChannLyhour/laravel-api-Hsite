import React from 'react';
import { FiClock, FiCheck, FiPackage, FiCheckCircle, FiShoppingBag } from 'react-icons/fi';

interface StatusOrderProps {
     status: 'pending' | 'confirm' | 'processing' | 'canceled' | 'cancelled' | 'complete';
     isWalkIn?: boolean;
}

export const StatusOrder: React.FC<StatusOrderProps> = ({ status, isWalkIn }) => {
     if (status === 'canceled' || status === 'cancelled') {
          return null;
     }

     if (isWalkIn) {
          return (
               <div className="border p-5 rounded-[5px] flex items-center gap-4 print:hidden mb-6 animate-fade-in custom-card-container">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-xs">
                         <FiShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                         <h4 className="text-xs font-black tracking-tight leading-tight uppercase">Walk-in Order</h4>
                         <p className="text-[10px] opacity-60 font-medium leading-normal mt-0.5">This transaction was checked out locally in the shop.</p>
                    </div>
               </div>
          );
     }

     const steps = [
          { key: 'pending', label: 'Order Placed', desc: 'Received & pending', icon: <FiClock className="w-4 h-4" /> },
          { key: 'confirm', label: 'Confirmed', desc: 'Order confirmed', icon: <FiCheck className="w-4 h-4" /> },
          { key: 'processing', label: 'Processing', desc: 'Preparing your items', icon: <FiPackage className="w-4 h-4" /> },
          { key: 'complete', label: 'Delivered', desc: 'Package received', icon: <FiCheckCircle className="w-4 h-4" /> }
     ];

     const getStepIndex = (s: typeof status) => {
          switch (s) {
               case 'pending': return 0;
               case 'confirm': return 1;
               case 'processing': return 2;
               case 'complete': return 3;
               default: return -1;
          }
     };

     const activeStep = getStepIndex(status);

     return (
          <div className="p-5 sm:p-6 rounded-[5px] border shadow-xs print:hidden mb-6 custom-card-container">
               <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">

                    {/* Progress bar line for Desktop */}
                    <div className="hidden md:block absolute top-5 left-[8%] right-[8%] h-[2px] bg-black/[0.08] -z-0">
                         <div
                              className="h-full bg-primary transition-all duration-500 ease-out"
                              style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                         />
                    </div>

                    {steps.map((step, idx) => {
                         const isCompleted = idx < activeStep || (activeStep === 3 && idx === 3);
                         const isCurrent = idx === activeStep && activeStep < 3;
                         const isPending = idx > activeStep;

                         return (
                              <div key={idx} className="flex md:flex-col items-center md:text-center gap-4 md:gap-3 flex-1 w-full relative z-10">
                                   {/* Mobile vertical line connecting step circles */}
                                   {idx > 0 && (
                                        <div className="md:hidden absolute -top-4 left-5 w-[2px] h-4 bg-black/[0.08]" />
                                   )}

                                   <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${isCompleted
                                             ? 'bg-primary border-primary text-white shadow-xs'
                                             : isCurrent
                                                  ? 'bg-primary/10 border-primary text-primary ring-4 ring-primary/20 shadow-sm scale-105'
                                                  : 'bg-black/[0.03] border-stone-200 text-stone-400'
                                        }`}>
                                        {isCompleted ? <FiCheck className="w-4 h-4" /> : step.icon}
                                   </div>

                                   <div className="space-y-0.5">
                                        <h4 className={`text-xs font-black tracking-tight leading-tight ${isCurrent ? 'text-primary' : isPending ? 'opacity-40' : 'opacity-85'}`}>
                                             {step.label}
                                        </h4>
                                        <p className="text-[10px] opacity-55 font-medium leading-normal">{step.desc}</p>
                                   </div>
                              </div>
                         );
                    })}
               </div>
          </div>
     );
};
