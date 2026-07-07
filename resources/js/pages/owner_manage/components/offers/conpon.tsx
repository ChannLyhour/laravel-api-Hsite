import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
  FiPercent, FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiX, FiCheck,
  FiTag, FiCalendar, FiUser, FiUsers, FiCopy,
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';
import {
  couponsService,
  type CouponRow, type CouponType, type DiscountType, type CreateCouponPayload,
} from '@/api/owner/coupons';
import { customersService, type Customer } from '@/api/owner/customers';
import { HelperTable, type HelperTableColumn } from '@/pages/owner_manage/helper/HelperTable';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  first_order: 'First Order',
  discount_on_purchase: 'Discount',
  free_delivery: 'Free Delivery',
};

const COUPON_TYPE_COLORS: Record<CouponType, string> = {
  first_order: 'bg-violet-50 text-violet-600 border border-violet-100',
  discount_on_purchase: 'bg-blue-50 text-blue-600 border border-blue-100',
  free_delivery: 'bg-teal-50 text-teal-600 border border-teal-100',
};

function formatDiscount(row: CouponRow) {
  if (row.coupon_type === 'free_delivery') return 'Free Delivery';
  if (row.discount_type === 'percentage') return `${row.discount_amount}%`;
  return `$${Number(row.discount_amount).toFixed(2)}`;
}

function formatDate(raw: string) {
  if (!raw) return '—';
  const clean = raw.replace('T', ' ');
  return clean.slice(0, 16);
}

function formatForDateTimeInput(raw: string) {
  if (!raw) return '';
  const clean = raw.replace(' ', 'T');
  return clean.slice(0, 16);
}

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Modal
// ─────────────────────────────────────────────────────────────────────────────
interface EditModalProps {
  coupon: CouponRow;
  customers: Customer[];
  onClose: () => void;
  onSaved: (updated: CouponRow) => void;
}

const EditModal: React.FC<EditModalProps> = ({ coupon, customers, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: coupon.title,
    code: coupon.code,
    coupon_type: coupon.coupon_type as CouponType,
    discount_type: coupon.discount_type as DiscountType,
    discount_amount: String(coupon.discount_amount),
    minimum_purchase: coupon.minimum_purchase != null ? String(coupon.minimum_purchase) : '',
    limit_same_user: coupon.limit_same_user != null ? String(coupon.limit_same_user) : '',
    limit_total: coupon.limit_total != null ? String(coupon.limit_total) : '',
    customer_id: coupon.customer_id != null ? String(coupon.customer_id) : '',
    start_date: formatForDateTimeInput(coupon.start_date),
    expire_date: formatForDateTimeInput(coupon.expire_date),
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<CreateCouponPayload> = {
        title: form.title,
        code: form.code || undefined,
        coupon_type: form.coupon_type,
        discount_type: form.discount_type,
        discount_amount: parseFloat(form.discount_amount) || 0,
        minimum_purchase: form.minimum_purchase ? parseFloat(form.minimum_purchase) : null,
        limit_same_user: form.limit_same_user ? parseInt(form.limit_same_user) : null,
        limit_total: form.limit_total ? parseInt(form.limit_total) : null,
        customer_id: form.customer_id ? parseInt(form.customer_id) : null,
        start_date: form.start_date,
        expire_date: form.expire_date,
      };
      const updated = await couponsService.updateCoupon(coupon.id, payload);
      onSaved(updated);
      toast.success('Coupon updated!');
      onClose();
    } catch {
      toast.error('Failed to update coupon.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white';
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[8px] shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiEdit className="text-orange-500 w-4 h-4" /> Edit Coupon
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Code</label>
              <div className="flex gap-1.5">
                <input className={inputCls} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="Auto-generate if blank" />
                <button type="button" onClick={() => set('code', randomCode())} className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[5px] text-xs font-bold border-none cursor-pointer whitespace-nowrap transition-colors">
                  <FiRefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.coupon_type} onChange={e => set('coupon_type', e.target.value)}>
                <option value="first_order">First Order</option>
                <option value="discount_on_purchase">Discount</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Discount Type</label>
              <select className={inputCls} value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
                <option value="amount">Flat ($)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Amount *</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.discount_amount} onChange={e => set('discount_amount', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Min. Purchase ($)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.minimum_purchase} onChange={e => set('minimum_purchase', e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className={labelCls}>User Limit</label>
              <input type="number" min="1" className={inputCls} value={form.limit_same_user} onChange={e => set('limit_same_user', e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className={labelCls}>Total Limit</label>
              <input type="number" min="1" className={inputCls} value={form.limit_total} onChange={e => set('limit_total', e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className={labelCls}>Customer</label>
              <select className={inputCls} value={form.customer_id} onChange={e => set('customer_id', e.target.value)}>
                <option value="">All Customers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="datetime-local" className={inputCls} value={form.start_date} onChange={e => set('start_date', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Expire Date *</label>
              <input type="datetime-local" className={inputCls} value={form.expire_date} onChange={e => set('expire_date', e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[5px] border-none cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5">
              {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
interface CouponsTabProps {
  ownerId?: number | string;
  storeId?: number;
}

export const CouponsTab: React.FC<CouponsTabProps> = ({ ownerId }) => {
  // ── state ──────────────────────────────────────────────────────────────────
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<CouponRow | null>(null);

  // form fields
  const [fTitle, setFTitle] = useState('');
  const [fCode, setFCode] = useState('');
  const [fCouponType, setFCouponType] = useState<CouponType>('discount_on_purchase');
  const [fDiscountType, setFDiscountType] = useState<DiscountType>('percentage');
  const [fDiscountAmt, setFDiscountAmt] = useState('');
  const [fMinPurchase, setFMinPurchase] = useState('');
  const [fLimitUser, setFLimitUser] = useState('');
  const [fLimitTotal, setFLimitTotal] = useState('');
  const [fCustomerId, setFCustomerId] = useState('');
  const [fStartDate, setFStartDate] = useState('');
  const [fExpireDate, setFExpireDate] = useState('');

  // validate-code UI
  const [validateInput, setValidateInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [validateResult, setValidateResult] = useState<CouponRow | null>(null);
  const validateRef = useRef<HTMLInputElement>(null);

  // ── pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // ── load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, custs] = await Promise.all([
        couponsService.getMyCoupons(0, 100, ownerId),
        customersService.getCustomers(),
      ]);
      setCoupons(c);
      setCustomers(custs);
    } catch {
      toast.error('Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── create ─────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle || !fDiscountAmt || !fStartDate || !fExpireDate) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateCouponPayload = {
        title: fTitle,
        code: fCode.trim().toUpperCase() || undefined,
        coupon_type: fCouponType,
        discount_type: fDiscountType,
        discount_amount: parseFloat(fDiscountAmt),
        minimum_purchase: fMinPurchase ? parseFloat(fMinPurchase) : null,
        limit_same_user: fLimitUser ? parseInt(fLimitUser) : null,
        limit_total: fLimitTotal ? parseInt(fLimitTotal) : null,
        customer_id: fCustomerId ? parseInt(fCustomerId) : null,
        start_date: fStartDate,
        expire_date: fExpireDate,
      };
      const created = await couponsService.createCoupon(payload);
      setCoupons(prev => [created, ...prev]);
      setFTitle(''); setFCode(''); setFDiscountAmt(''); setFMinPurchase('');
      setFLimitUser(''); setFLimitTotal(''); setFCustomerId(''); setFStartDate(''); setFExpireDate('');
      toast.success('Coupon created!');
    } catch (err: any) {
      toast.error(err?.details?.message || 'Failed to create coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── toggle ─────────────────────────────────────────────────────────────────
  const handleToggle = async (id: number) => {
    try {
      const updated = await couponsService.toggleCoupon(id);
      setCoupons(prev => prev.map(c => c.id === id ? updated : c));
      toast.success('Coupon status updated!');
    } catch {
      toast.error('Failed to toggle status.');
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this coupon? This cannot be undone.')) return;
    try {
      await couponsService.deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('Coupon deleted.');
    } catch {
      toast.error('Failed to delete coupon.');
    }
  };

  // ── validate code ──────────────────────────────────────────────────────────
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput.trim()) return;
    setValidating(true);
    setValidateResult(null);
    try {
      const result = await couponsService.validateCode(validateInput.trim());
      setValidateResult(result);
      toast.success('Valid coupon code!');
    } catch (err: any) {
      const msg = err?.details?.message || 'Invalid or expired code.';
      toast.error(msg);
    } finally {
      setValidating(false);
    }
  };

  // ── shared classes ─────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white';
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1';

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {editTarget && (
        <EditModal
          coupon={editTarget}
          customers={customers}
          onClose={() => setEditTarget(null)}
          onSaved={updated => setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c))}
        />
      )}

      <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <FiPercent className="text-orange-500 w-5 h-5" />
              <span>Coupon Setup</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">Create and manage discount codes for checkout promotions.</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-500 border-none cursor-pointer transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ── Create Form ── */}
        <div className="space-y-4">
          <h4 className="text-sm font-black text-inherit tracking-tight flex items-center gap-2">
            <FiPlus className="text-orange-500 w-4 h-4" /> Add New Coupon
          </h4>
          <form onSubmit={handleCreate} className="space-y-5">
            {/* GroupDiv 1: Basic Info */}
            <GroupDiv className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coupon Basics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Coupon Title *</label>
                  <input className={inputCls} value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Autumn 15% Off" />
                </div>
                <div>
                  <label className={labelCls}>Coupon Code <span className="text-slate-400 font-normal">(blank = auto)</span></label>
                  <div className="flex gap-1.5">
                    <input className={inputCls} value={fCode} onChange={e => setFCode(e.target.value.toUpperCase())} placeholder="e.g. AUTUMN15" />
                    <button type="button" onClick={() => setFCode(randomCode())} title="Generate random code" className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[5px] text-xs font-bold border-none cursor-pointer transition-colors shrink-0">
                      <FiRefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Coupon Type</label>
                  <select className={inputCls} value={fCouponType} onChange={e => setFCouponType(e.target.value as CouponType)}>
                    <option value="discount_on_purchase">Discount on Purchase</option>
                    <option value="first_order">First Order</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                </div>
              </div>
            </GroupDiv>

            {/* GroupDiv 2: Discount Config */}
            <GroupDiv className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Discount Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Discount Type</label>
                  <select className={inputCls} value={fDiscountType} onChange={e => setFDiscountType(e.target.value as DiscountType)}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Flat Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Discount Amount *</label>
                  <input type="number" step="0.01" min="0" className={inputCls} value={fDiscountAmt} onChange={e => setFDiscountAmt(e.target.value)} placeholder={fDiscountType === 'percentage' ? '15' : '5.00'} />
                </div>
                <div>
                  <label className={labelCls}>Min. Purchase ($)</label>
                  <input type="number" step="0.01" min="0" className={inputCls} value={fMinPurchase} onChange={e => setFMinPurchase(e.target.value)} placeholder="Optional" />
                </div>
              </div>
            </GroupDiv>

            {/* GroupDiv 3: Usage Limits */}
            <GroupDiv className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usage Limits & Target</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>User Limit</label>
                  <input type="number" min="1" className={inputCls} value={fLimitUser} onChange={e => setFLimitUser(e.target.value)} placeholder="Unlimited" />
                </div>
                <div>
                  <label className={labelCls}>Total Limit</label>
                  <input type="number" min="1" className={inputCls} value={fLimitTotal} onChange={e => setFLimitTotal(e.target.value)} placeholder="Unlimited" />
                </div>
                <div>
                  <label className={labelCls}>Customer <span className="text-slate-400 font-normal">(optional)</span></label>
                  <select className={inputCls} value={fCustomerId} onChange={e => setFCustomerId(e.target.value)}>
                    <option value="">All Customers</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </GroupDiv>

            {/* GroupDiv 4: Duration */}
            <GroupDiv className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Start Date *</label>
                  <input type="datetime-local" className={inputCls} value={fStartDate} onChange={e => setFStartDate(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Expire Date *</label>
                  <input type="datetime-local" className={inputCls} value={fExpireDate} onChange={e => setFExpireDate(e.target.value)} />
                </div>
              </div>
            </GroupDiv>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={submitting} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 shadow-xs">
                {submitting ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiPlus className="w-3.5 h-3.5" />}
                Create Coupon
              </button>
            </div>
          </form>
        </div>

        {/* ── Validate Code Tool ── */}
        <GroupDiv className="p-5 space-y-0">
          <h4 className="text-sm font-black text-slate-800 tracking-tight mb-3 flex items-center gap-2">
            <FiTag className="text-orange-500 w-4 h-4" /> Validate Coupon Code
          </h4>
          <form onSubmit={handleValidate} className="flex items-center gap-3">
            <input
              ref={validateRef}
              type="text"
              value={validateInput}
              onChange={e => { setValidateInput(e.target.value.toUpperCase()); setValidateResult(null); }}
              placeholder="Enter code to check…"
              className="flex-1 px-3.5 py-2.5 border rounded-[5px] text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono uppercase"
            />
            <button type="submit" disabled={validating || !validateInput.trim()} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-[5px] text-xs font-extrabold border-none cursor-pointer transition-all flex items-center gap-1.5">
              {validating ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
              Check
            </button>
          </form>
          {validateResult && (
            <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-[5px] flex items-start gap-3 text-xs">
              <FiCheck className="text-emerald-500 w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-0.5">
                <p className="font-black text-emerald-700">{validateResult.code} — Valid</p>
                <p className="text-emerald-600">{validateResult.title} · {formatDiscount(validateResult)}
                  {validateResult.minimum_purchase ? ` · Min $${validateResult.minimum_purchase}` : ''}
                  · Expires {formatDate(validateResult.expire_date)}
                </p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(validateResult.code); toast.success('Copied!'); }} className="p-1.5 rounded hover:bg-emerald-100 text-emerald-500 border-none cursor-pointer transition-colors shrink-0">
                <FiCopy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </GroupDiv>

        {/* ── Coupon Table ── */}
        {(() => {
          const COUPON_COLUMNS: HelperTableColumn[] = [
            { key: 'code', label: 'Code' },
            { key: 'title', label: 'Title' },
            { key: 'type', label: 'Type' },
            { key: 'discount', label: 'Discount' },
            { key: 'min_buy', label: 'Min Buy' },
            { key: 'customer', label: 'Customer' },
            { key: 'dates', label: 'Dates' },
            { key: 'used', label: 'Used' },
            { key: 'status', label: 'Status', align: 'center' },
            { key: 'actions', label: 'Actions', align: 'center' },
          ];

          const filtered = coupons.filter(c =>
            !searchQuery ||
            c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
          const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

          return (
            <HelperTable<CouponRow>
              title="Coupon List"
              count={filtered.length}
              columns={COUPON_COLUMNS}
              data={paginated}
              loading={loading}
              searchPlaceholder="Search code or title…"
              searchValue={searchQuery}
              onSearchChange={v => { setSearchQuery(v); setCurrentPage(1); }}
              emptyStateText="No Coupons Found"
              emptyStateSubtext="Create your first coupon using the form above."
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={size => { setItemsPerPage(size); setCurrentPage(1); }}
              renderRow={(coupon) => {
                const isExpired = coupon.expire_date ? new Date(coupon.expire_date) < new Date() : false;

                return (
                  <tr key={coupon.id} className={`hover:bg-slate-50/40 transition-colors ${isExpired ? 'opacity-75 bg-slate-50/20' : ''}`}>
                    {/* Code */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-black tracking-widest text-xs ${isExpired ? 'text-slate-400' : 'text-orange-600'}`}>{coupon.code}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success('Copied!'); }}
                          className="p-0.5 rounded hover:bg-orange-50 text-slate-300 hover:text-orange-400 border-none cursor-pointer transition-colors"
                        >
                          <FiCopy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    {/* Title */}
                    <td className="px-5 py-3.5 text-slate-700 max-w-[180px]">
                      <span className={`line-clamp-1 text-xs font-semibold ${isExpired ? 'text-slate-400 line-through' : ''}`}>{coupon.title}</span>
                    </td>
                    {/* Type badge */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isExpired ? 'bg-slate-100 text-slate-500 border border-slate-200' : COUPON_TYPE_COLORS[coupon.coupon_type]}`}>
                        {COUPON_TYPE_LABELS[coupon.coupon_type]}
                      </span>
                    </td>
                    {/* Discount */}
                    <td className="px-5 py-3.5 text-slate-800 font-extrabold text-xs">{formatDiscount(coupon)}</td>
                    {/* Min purchase */}
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {coupon.minimum_purchase ? `$${Number(coupon.minimum_purchase).toFixed(2)}` : <span className="text-slate-300">—</span>}
                    </td>
                    {/* Customer */}
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {coupon.customer ? (
                        <span className="flex items-center gap-1"><FiUser className="w-3 h-3 text-slate-300" />{coupon.customer.name}</span>
                      ) : <span className="flex items-center gap-1"><FiUsers className="w-3 h-3 text-slate-300" />All</span>}
                    </td>
                    {/* Dates */}
                    <td className="px-5 py-3.5">
                      <div className={`flex items-center gap-1 text-[11px] ${isExpired ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                        <FiCalendar className="w-3 h-3" />
                        <span>{formatDate(coupon.start_date)}</span>
                        <span className="text-slate-300">→</span>
                        <span>{formatDate(coupon.expire_date)}</span>
                      </div>
                    </td>
                    {/* Used */}
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      <div className="space-y-0.5">
                        <div>Used: <span className="font-extrabold text-slate-800">{coupon.total_used}</span> / <span className="font-semibold text-slate-600">{coupon.limit_total || '∞'}</span></div>
                        <div className="text-[10px] text-slate-400">User limit: {coupon.limit_same_user || '∞'}</div>
                      </div>
                    </td>
                    {/* Status toggle */}
                    <td className="px-5 py-3.5 text-center">
                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider">
                          Expired
                        </span>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                           <input
                            type="checkbox"
                            checked={coupon.is_active}
                            onChange={() => handleToggle(coupon.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                        </label>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditTarget(coupon)}
                          className="p-1.5 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200/50 cursor-pointer"
                        >
                          <FiEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200/50 cursor-pointer"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          );
        })()}
      </div>
    </>
  );
};
