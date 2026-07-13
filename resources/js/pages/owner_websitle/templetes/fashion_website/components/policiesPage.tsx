import React, { useState, useEffect } from 'react';
import { policiesApi } from '@/api/owner/policies';
import type { Policy } from '@/api/owner/policies';
import { FiFileText, FiClock, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

interface PolicyPageProps {
     ownerUserId?: number | string;
     slug: string;
     stores?: any;
     onNavigate?: (to: string) => void;
     buildStoreLink: (path: string) => string;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({
     ownerUserId,
     slug,
     stores,
     onNavigate,
     buildStoreLink,
}) => {
     const [policy, setPolicy] = useState<Policy | null>(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          if (!ownerUserId || !slug) return;

          setLoading(true);
          setError(null);

          policiesApi.getPublicPolicy(ownerUserId, slug)
               .then(res => {
                    if (res && res.success) {
                         setPolicy(res.data);
                    } else {
                         setError('Policy could not be loaded.');
                    }
               })
               .catch(err => {
                    console.warn('PolicyPage: Failed to load policy', err);
                    setError('Policy not found or not published.');
               })
               .finally(() => {
                    setLoading(false);
               });
     }, [ownerUserId, slug]);

     const formatDate = (dateStr: string | null) => {
          if (!dateStr) return '';
          return new Date(dateStr).toLocaleDateString('en-US', {
               year: 'numeric',
               month: 'long',
               day: 'numeric'
          });
     };

     return (
          <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 font-kuntomruy animate-fade-in">
               {/* Back button */}
               <button
                    onClick={() => onNavigate?.(buildStoreLink('/'))}
                    className="group mb-8 flex items-center gap-2 text-[10px] font-black uppercase text-stone-500 hover:text-stone-900 transition-colors border-none bg-transparent cursor-pointer tracking-widest"
               >
                    <FiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Store
               </button>

               {loading ? (
                    <div className="bg-white border border-stone-200/60 shadow-3xs p-16 flex flex-col items-center justify-center space-y-4 rounded-[4px]">
                         <div className="w-9 h-9 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
                         <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Loading policy...</span>
                    </div>
               ) : error || !policy ? (
                    <div className="bg-white border border-stone-200/60 shadow-3xs p-16 flex flex-col items-center justify-center text-center space-y-4 rounded-[4px]">
                         <div className="w-14 h-14 bg-stone-50 border border-stone-150 rounded-lg flex items-center justify-center text-stone-500 shadow-3xs">
                              <FiAlertTriangle className="w-6 h-6 text-stone-600" />
                         </div>
                         <div>
                              <h3 className="text-xs font-black text-stone-850 uppercase tracking-wider">Policy Not Available</h3>
                              <p className="text-[11px] font-bold text-stone-400 mt-1 max-w-sm leading-relaxed">
                                   {error || 'This policy is either not published or does not exist.'}
                              </p>
                         </div>
                    </div>
               ) : (
                    <article className="bg-white border border-stone-200/60 shadow-xs p-6 sm:p-10 space-y-8 rounded-[4px]">
                         {/* Header */}
                         <div className="border-b border-stone-100 pb-6 space-y-3">
                              <div className="flex items-center gap-2">
                                   <span className="w-7 h-7 rounded bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                                        <FiFileText className="w-3.5 h-3.5" />
                                   </span>
                                   <span className="text-[10px] font-black text-stone-500 tracking-wider uppercase">Store Policy</span>
                              </div>
                              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                                   {policy.title}
                              </h1>
                              {policy.updated_at && (
                                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-450 uppercase tracking-wider">
                                        <FiClock className="w-3.5 h-3.5 text-stone-400" />
                                        <span>Last Updated: {formatDate(policy.updated_at)}</span>
                                   </div>
                              )}
                         </div>

                         {/* Content Body */}
                         <div
                              className="prose prose-stone max-w-none text-xs sm:text-sm leading-relaxed font-medium text-stone-650 whitespace-pre-line"
                              dangerouslySetInnerHTML={{ __html: policy.content }}
                         />
                    </article>
               )}
          </div>
     );
};
