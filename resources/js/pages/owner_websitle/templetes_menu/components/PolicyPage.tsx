import React, { useState, useEffect } from 'react';
import { policiesApi } from '@/api/owner/policies';
import type { Policy } from '@/api/owner/policies';
import { FiFileText, FiClock, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { themes } from '@/pages/owner_manage/templete_website/themes';
import { getLightTheme } from '../utils/themeHelper';

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

  const activeTheme = getLightTheme(themes[stores?.website_theme || 'default'] || themes.default);

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
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      {/* Back button */}
      <button
        onClick={() => onNavigate?.(buildStoreLink('/'))}
        className="group mb-8 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer"
      >
        <FiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Store
      </button>

      {loading ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800/80 shadow-3xs p-16 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading policy content...</span>
        </div>
      ) : error || !policy ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800/80 shadow-3xs p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center justify-center text-red-500 shadow-3xs">
            <FiAlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Policy Not Available</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm">
              {error || 'This policy is either not published or does not exist.'}
            </p>
          </div>
        </div>
      ) : (
        <article className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800/80 shadow-sm p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 dark:border-stone-800/80 pb-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center shrink-0">
                <FiFileText className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-orange-500 tracking-wider uppercase">Store Policy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {policy.title}
            </h1>
            {policy.updated_at && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <FiClock className="w-3.5 h-3.5" />
                <span>Last Updated: {formatDate(policy.updated_at)}</span>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div 
            className="prose prose-slate max-w-none dark:prose-invert text-sm leading-relaxed font-medium text-slate-650 dark:text-stone-300 space-y-4"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />
        </article>
      )}
    </div>
  );
};
