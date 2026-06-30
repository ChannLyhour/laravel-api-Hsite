import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiGlobe,
  FiFileText, FiLink, FiAlertCircle, FiCheckCircle, FiEyeOff
} from 'react-icons/fi';
import { pagesApi, toSlug } from '@/api/owner/cms';
import type { Page, PageCreate, PageUpdate } from '@/api/owner/cms';
import { useConfirm } from '@/components/ConfirmProvider';

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) =>
  status === 'published' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <FiCheckCircle className="w-3 h-3" /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
      <FiEyeOff className="w-3 h-3" /> Draft
    </span>
  );

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ─── Slide-over Form ─────────────────────────────────────────────────────────

interface PageFormProps {
  initial?: Page | null;
  onSave: (data: PageCreate | PageUpdate) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const PageForm: React.FC<PageFormProps> = ({ initial, onSave, onClose, loading }) => {
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
    await onSave({ title, slug, content, status });
  };

  return (
    <div className="fixed inset-0 z-[300] flex">
      {/* Backdrop */}
      <div className="flex-1 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50/80 to-white">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              {initial ? 'Edit Page' : 'New Page'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {initial ? `Updating "${initial.title}"` : 'Create a static page for your website'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FiFileText className="w-3.5 h-3.5 text-orange-500" /> Page Title *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g. About Us"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FiLink className="w-3.5 h-3.5 text-orange-500" /> URL Slug *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl shrink-0">/</span>
              <input
                required
                type="text"
                value={slug}
                onChange={e => { setSlugManual(true); setSlug(e.target.value); }}
                placeholder="about-us"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">Auto-generated from title. Edit to customise.</p>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Page Content (HTML)</label>
            <textarea
              rows={10}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="<p>Welcome to our store...</p>"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition-colors"
            />
          </div>

          {/* Status toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Visibility Status</label>
            <div className="flex gap-3">
              {(['published', 'draft'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer capitalize ${status === s
                      ? s === 'published'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                        : 'border-slate-400 bg-slate-100 text-slate-600'
                      : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                >
                  {s === 'published' ? '🌐 Published' : '🔒 Draft'}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm shadow-orange-500/20"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FiSave className="w-4 h-4" />
            )}
            {initial ? 'Save Changes' : 'Create Page'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────

interface PagesTabProps {
  ownerId?: number | string;
}

export const PagesTab: React.FC<PagesTabProps> = ({ ownerId }) => {
  const confirm = useConfirm();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pagesApi.list(ownerId);
      setPages(data);
    } catch (err: any) {
      setError(err?.details?.message || 'Failed to load pages.');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleOpenCreate = () => { setEditing(null); setFormOpen(true); };
  const handleOpenEdit = (p: Page) => { setEditing(p); setFormOpen(true); };
  const handleClose = () => { setFormOpen(false); setEditing(null); };

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      if (editing) {
        await pagesApi.update(editing.id, data);
      } else {
        await pagesApi.create({ ...data, created_by: ownerId });
      }
      await fetchPages();
      handleClose();
    } catch (err: any) {
      setError(err?.details?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page: Page) => {
    const ok = await confirm({
      title: 'Delete Page',
      message: `Are you sure you want to permanently delete "${page.title}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Keep It',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await pagesApi.delete(page.id);
      setPages(prev => prev.filter(p => p.id !== page.id));
    } catch (err: any) {
      setError(err?.details?.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FiGlobe className="text-orange-500" /> Static Pages
          </h2>
          <p className="text-slate-400 text-xs mt-1">Manage homepage, about, contact and other static pages.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <FiPlus className="w-4 h-4" /> New Page
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs font-semibold">
          <FiAlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 cursor-pointer"><FiX /></button>
        </div>
      )}

      {/* Table Card */}
      <div className="border rounded-2xl shadow-sm overflow-hidden custom-card-container">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <span className="w-8 h-8 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-xs font-semibold">Loading pages…</span>
          </div>
        ) : pages.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <FiFileText className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-extrabold text-slate-600">No pages yet</p>
              <p className="text-xs mt-1">Create your first page to get started</p>
            </div>
            <button onClick={handleOpenCreate} className="text-xs font-extrabold text-orange-500 hover:text-orange-600 cursor-pointer">
              + Create your first page
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b custom-card-header-bar">
                  <th className="text-left px-5 py-3.5 font-extrabold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3.5 font-extrabold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3.5 font-extrabold text-slate-500 uppercase tracking-wider hidden md:table-cell">Slug</th>
                  <th className="text-left px-5 py-3.5 font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 font-extrabold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                  <th className="text-right px-5 py-3.5 font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pages.map(page => (
                  <tr key={page.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4 font-extrabold text-slate-400">{page.id}</td>
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-slate-700">{page.title}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <code className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-mono">/{page.slug}</code>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={page.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-400 hidden lg:table-cell">{formatDate(page.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(page)}
                          className="p-2 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-lg transition-colors cursor-pointer"
                          title="Edit page"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(page)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Delete page"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Form */}
      {formOpen && (
        <PageForm
          initial={editing}
          onSave={handleSave}
          onClose={handleClose}
          loading={saving}
        />
      )}
    </div>
  );
};

