import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSave,
  FiFileText, FiLink, FiCheckCircle, FiEyeOff, FiAlertCircle
} from 'react-icons/fi';
import { policiesApi, toSlug } from '@/api/owner/policies';
import type { Policy, PolicySave } from '@/api/owner/policies';
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

interface PolicyFormProps {
  initial?: Policy | null;
  onSave: (data: PolicySave) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const PolicyForm: React.FC<PolicyFormProps> = ({ initial, onSave, onClose, loading }) => {
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
    await onSave({
      title,
      slug,
      content,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex">
      <div className="flex-1 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50/80 to-white">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              {initial ? 'Edit Policy' : 'New Policy'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {initial ? `Updating "${initial.title}"` : 'Create a privacy, refund, or custom store policy'}
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
              <FiFileText className="w-3.5 h-3.5 text-orange-500" /> Policy Title *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g. Privacy Policy"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-between w-full">
              <span className="flex items-center gap-1.5">
                <FiLink className="w-3.5 h-3.5 text-orange-500" /> Link / URL Slug *
              </span>
              <button
                type="button"
                onClick={() => setSlugManual(!slugManual)}
                className="text-[10px] text-orange-500 hover:underline cursor-pointer"
              >
                {slugManual ? 'Auto-generate' : 'Edit Manually'}
              </button>
            </label>
            <div className="flex rounded-xl shadow-3xs overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all bg-slate-55">
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
                className="flex-1 px-3 py-2.5 text-sm text-slate-600 disabled:text-slate-400 font-semibold bg-white disabled:bg-slate-50 focus:outline-none"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FiFileText className="w-3.5 h-3.5 text-orange-500" /> Policy Content *
            </label>
            <textarea
              required
              rows={12}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your policy detailed terms here..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Status *</label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center justify-between p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 select-none">
                <div className="flex items-center gap-2">
                  <FiEyeOff className="w-4 h-4 text-slate-400" />
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

              <label className="flex-1 flex items-center justify-between p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 select-none">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-emerald-500" />
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

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiSave className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Tab Component ──────────────────────────────────────────────────────

interface PoliciesTabProps {
  ownerId?: number | string;
}

export const PoliciesTab: React.FC<PoliciesTabProps> = ({ ownerId }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const confirm = useConfirm();

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await policiesApi.list();
      if (res && res.success) {
        setPolicies(res.data);
      } else {
        setError('Failed to fetch policies');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleCreateOpen = () => {
    setEditingPolicy(null);
    setFormOpen(true);
  };

  const handleEditOpen = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormOpen(true);
  };

  const handleSave = async (data: PolicySave) => {
    try {
      setFormLoading(true);
      const res = await policiesApi.save(data);
      if (res && res.success) {
        await fetchPolicies();
        setFormOpen(false);
        setEditingPolicy(null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error saving policy.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete Policy?',
      message: 'Are you sure you want to delete this policy? This action cannot be undone.',
    });
    if (!ok) return;

    try {
      setLoading(true);
      const res = await policiesApi.delete(id);
      if (res && res.success) {
        await fetchPolicies();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error deleting policy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-3xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-orange-500" /> Store Policies
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Manage your store's Privacy Policy, Refund Policy, and Terms of Service.
          </p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <FiPlus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
          <FiAlertCircle className="w-4.5 h-4.5" /> {error}
        </div>
      )}

      {loading && policies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading policies...</span>
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shadow-3xs">
            <FiFileText className="w-7 h-7 text-slate-400/80" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-700">No Policies Created Yet</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm">
              Creating store policies (like a Refund Policy or Privacy Policy) helps build trust with your buyers.
            </p>
          </div>
          <button
            onClick={handleCreateOpen}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> Get Started
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-3xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Policy Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Slug / Route</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map(policy => (
                  <tr key={policy.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center font-bold text-sm">
                          <FiFileText className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-800 block hover:text-orange-500 transition-colors">
                            {policy.title}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <code className="text-xs font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">
                        /policies/{policy.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4.5">
                      <StatusBadge status={policy.status} />
                    </td>
                    <td className="px-6 py-4.5 text-xs font-semibold text-slate-500">
                      {formatDate(policy.updated_at)}
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditOpen(policy)}
                          title="Edit Policy"
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.id)}
                          title="Delete Policy"
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Form Container */}
      {formOpen && (
        <PolicyForm
          initial={editingPolicy}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
          loading={formLoading}
        />
      )}
    </div>
  );
};
