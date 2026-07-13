import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiSave, FiFileText, FiLink, FiCheckCircle, FiEyeOff } from 'react-icons/fi';
import { toSlug } from '@/api/owner/policies';
import type { Policy, PolicySave } from '@/api/owner/policies';

interface EditPageProps {
  initial?: Policy | null;
  onSave: (data: PolicySave) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export const EditPage: React.FC<EditPageProps> = ({ initial, onSave, onClose, loading }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [status, setStatus] = useState<'published' | 'draft'>(
    (initial?.status as 'published' | 'draft') ?? 'draft'
  );
  const [slugManual, setSlugManual] = useState(!!initial);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugManual) setSlug(toSlug(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) return;
    await onSave({
      title,
      slug,
      content,
      status,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 border border-slate-200 rounded-[5px] hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-2xs"
            title="Cancel and back"
          >
            <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <FiFileText className="text-orange-500 w-6 h-6" />
              <span>{initial ? 'Edit Policy' : 'New Policy'}</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              {initial ? `Updating policy "${initial.title}"` : 'Create a privacy, refund, or custom store policy.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="py-2 px-5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-[5px] text-xs font-bold transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 flex items-center space-x-2 cursor-pointer border-none active:scale-95 duration-200"
        >
          <FiSave className="w-3.5 h-3.5" />
          <span>{loading ? 'Saving...' : 'Save Policy'}</span>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Left Column (2/3 width) - Main Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[5px] p-6 sm:p-8 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                Policy Information
              </h3>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                Policy Title *
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. Privacy Policy"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-between w-full">
                <span className="flex items-center gap-1.5">
                  Link / URL Slug *
                </span>
                <button
                  type="button"
                  onClick={() => setSlugManual(!slugManual)}
                  className="text-[10px] text-orange-500 hover:underline cursor-pointer font-bold"
                >
                  {slugManual ? 'Auto-generate' : 'Edit Manually'}
                </button>
              </label>
              <div className="flex rounded-[5px] shadow-3xs overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
                <span className="px-3 bg-slate-100 flex items-center text-xs font-bold text-slate-400 select-none border-r border-slate-200">
                  /policies/
                </span>
                <input
                  required
                  type="text"
                  disabled={!slugManual}
                  value={slug}
                  onChange={e => setSlug(toSlug(e.target.value))}
                  placeholder="privacy-policy"
                  className="flex-1 px-3 py-2.5 text-sm text-slate-650 disabled:text-slate-400 font-semibold bg-white disabled:bg-slate-50 focus:outline-none"
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                Policy Content *
              </label>
              <textarea
                required
                rows={14}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your policy terms and conditions here..."
                className="w-full px-4 py-3 border border-slate-200 rounded-[5px] text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) - Status/Settings */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                Publishing Status
              </h3>
            </div>

            {/* Status Option Radios */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status *</label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between p-3.5 border border-slate-200 rounded-[5px] cursor-pointer hover:bg-slate-50 select-none">
                  <div className="flex items-center gap-2.5">
                    <FiEyeOff className="w-4.5 h-4.5 text-slate-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-700">Draft</div>
                      <div className="text-[10px] text-slate-400">Hidden from customers</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 border border-slate-200 rounded-[5px] cursor-pointer hover:bg-slate-50 select-none">
                  <div className="flex items-center gap-2.5">
                    <FiCheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-700">Published</div>
                      <div className="text-[10px] text-slate-400">Publicly visible</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions Footer Card */}
          <div className="bg-white border border-slate-100 rounded-[5px] p-5 shadow-sm flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[5px] border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-[5px] bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiSave className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
