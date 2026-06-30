import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
  FiPercent, FiZap, FiGift, FiVolume2, FiBell, FiSettings,
  FiPlus, FiSave, FiEdit, FiTrash2, FiRefreshCw, FiX, FiCheck,
  FiTag, FiCalendar, FiUser, FiUsers, FiShoppingBag, FiCopy,
  FiImage, FiLoader, FiArrowLeft, FiBox, FiChevronDown, FiSearch, FiAlertTriangle,
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';
import {
  couponsService,
  type CouponRow, type CouponType, type DiscountType, type CreateCouponPayload,
} from '@/api/owner/coupons';
import { customersService, type Customer } from '@/api/owner/customers';
import { HelperTable, type HelperTableColumn } from '@/pages/owner_manage/helper/HelperTable';
import { GroupDiv } from '@/pages/owner_manage/helper/GroupDiv';
import { flashDealsService, type FlashDealRow } from '@/api/owner/flashDeals';
import { featuredDealsService, type FeaturedDealRow } from '@/api/owner/featuredDeals';
import { clearanceSalesService, type ClearanceSaleRow, type ClearanceProduct } from '@/api/owner/clearanceSales';
import { menuItemsService, categoriesService, type MenuItem, type Category } from '@/api/owner/categories';

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
                          <FiCopy className="w-3 h-3" />
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

// ─────────────────────────────────────────────────────────────────────────────
// 2. Flash Deals Tab Component
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Flash Deal Modals
// ─────────────────────────────────────────────────────────────────────────────
interface FlashDealModalProps {
  deal: FlashDealRow | null;
  onClose: () => void;
  onSaved: (saved: FlashDealRow) => void;
}

const FlashDealModal: React.FC<FlashDealModalProps> = ({ deal, onClose, onSaved }) => {
  const [title, setTitle] = useState(deal?.title || '');
  const [startDate, setStartDate] = useState(deal?.start_date ? deal.start_date.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(deal?.end_date ? deal.end_date.slice(0, 10) : '');
  const [priority, setPriority] = useState(deal?.priority != null ? String(deal.priority) : '0');
  const [isPublished, setIsPublished] = useState(deal?.is_published ?? false);
  const [metaTitle, setMetaTitle] = useState(deal?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(deal?.meta_description || '');

  // Images
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(deal?.image || null);
  const [metaImageFile, setMetaImageFile] = useState<File | null>(null);
  const [metaImagePreview, setMetaImagePreview] = useState<string | null>(deal?.meta_image || null);

  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const metaFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isMeta: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }
      if (isMeta) {
        setMetaImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setMetaImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      toast.error('Title, Start Date and End Date are required.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('start_date', startDate);
      fd.append('end_date', endDate);
      fd.append('is_published', isPublished ? '1' : '0');
      fd.append('priority', priority);
      if (metaTitle) fd.append('meta_title', metaTitle);
      if (metaDescription) fd.append('meta_description', metaDescription);

      if (imageFile) {
        fd.append('image', imageFile);
      }
      if (metaImageFile) {
        fd.append('meta_image', metaImageFile);
      }

      let saved: FlashDealRow;
      if (deal) {
        saved = await flashDealsService.updateFlashDeal(deal.id, fd);
        toast.success('Flash deal updated successfully!');
      } else {
        saved = await flashDealsService.createFlashDeal(fd);
        toast.success('Flash deal created successfully!');
      }
      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to save flash deal.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white';
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-fade-in overflow-y-auto py-10">
      <div className="bg-white rounded-[8px] shadow-2xl w-full max-w-2xl mx-4 my-auto overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiZap className="text-orange-500 w-4 h-4" />
            <span>{deal ? 'Edit Flash Deal Details' : 'Create Flash Deal'}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Flash Deal Title *</label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Summer Mega Sale" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>End Date *</label>
              <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <input type="number" className={inputCls} value={priority} onChange={e => setPriority(e.target.value)} placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pt-2">
                <label className="text-xs font-bold text-slate-700">Publish Immediately</label>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                </label>
              </div>

              <div>
                <label className={labelCls}>Meta Title (Optional)</label>
                <input className={inputCls} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO Meta Title" />
              </div>

              <div>
                <label className={labelCls}>Meta Description (Optional)</label>
                <textarea rows={3} className={`${inputCls} resize-none`} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="SEO Meta Description..." />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Banner Image</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-[5px] h-28 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all p-2 relative overflow-hidden">
                  <input type="file" ref={fileInputRef} onChange={e => handleFileChange(e, false)} accept="image/*" className="hidden" />
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Banner Preview" className="w-full h-full object-cover rounded-[3px]" />
                      <button type="button" onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border-none"><FiX className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <FiImage className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-500">Upload Banner File</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Meta Image</label>
                <div onClick={() => metaFileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-[5px] h-28 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all p-2 relative overflow-hidden">
                  <input type="file" ref={metaFileInputRef} onChange={e => handleFileChange(e, true)} accept="image/*" className="hidden" />
                  {metaImagePreview ? (
                    <>
                      <img src={metaImagePreview} alt="Meta Preview" className="w-full h-full object-cover rounded-[3px]" />
                      <button type="button" onClick={e => { e.stopPropagation(); setMetaImageFile(null); setMetaImagePreview(null); if (metaFileInputRef.current) metaFileInputRef.current.value = ''; }} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border-none"><FiX className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <FiImage className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-500">Upload Meta Image File</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[5px] border-none cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 shadow-xs">
              {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
              {deal ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ManageProductsModalProps {
  deal: FlashDealRow;
  products: MenuItem[];
  onClose: () => void;
  onUpdated: (updated: FlashDealRow) => void;
}

const ManageProductsModal: React.FC<ManageProductsModalProps> = ({ deal, products, onClose, onUpdated }) => {
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const associatedIds = new Set((deal.products || []).map(p => p.id));

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleProduct = async (productId: number, currentlyAssociated: boolean) => {
    setTogglingId(productId);
    try {
      let updated: FlashDealRow;
      if (currentlyAssociated) {
        updated = await flashDealsService.removeProduct(deal.id, productId);
        toast.success('Product removed from flash deal!');
      } else {
        updated = await flashDealsService.addProducts(deal.id, [productId]);
        toast.success('Product added to flash deal!');
      }
      onUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to update product association.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-fade-in py-10">
      <div className="bg-white rounded-[8px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50/80 to-white">
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiShoppingBag className="text-orange-500 w-4 h-4 animate-bounce" />
            <span>Manage Products — {deal.title}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-50 shrink-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full px-3.5 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredProducts.length === 0 ? (
            <p className="text-center text-xs font-bold text-slate-400 py-6">No products found.</p>
          ) : (
            filteredProducts.map(p => {
              const isAssociated = associatedIds.has(p.id);
              const isToggling = togglingId === p.id;
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-[5px] border border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                      {p.display_image ? (
                        <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><FiImage className="w-4 h-4 text-slate-350" /></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{p.name}</h4>
                      <p className="text-[10px] text-slate-450 font-bold">${Number(p.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    {isToggling ? (
                      <FiLoader className="w-4 h-4 text-orange-500 animate-spin" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={isAssociated}
                        onChange={() => handleToggleProduct(p.id, isAssociated)}
                        className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                      />
                    )}
                  </label>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-[5px] text-xs font-extrabold border-none cursor-pointer transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Add Product Page View Component
// ─────────────────────────────────────────────────────────────────────────────
interface AddProductPageViewProps {
  deal: FlashDealRow;
  products: MenuItem[];
  categories: Category[];
  onBack: () => void;
  onUpdated: (updated: FlashDealRow) => void;
}

const AddProductPageView: React.FC<AddProductPageViewProps> = ({ deal, products, categories, onBack, onUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [_loading, setLoading] = useState(false);
  const [activeDeal, setActiveDeal] = useState<FlashDealRow>(deal);

  const [selectedMainCatId, setSelectedMainCatId] = useState<number | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<number | null>(null);
  const [selectedSubSubCatId, setSelectedSubSubCatId] = useState<number | null>(null);

  const mainCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id);
  }, [categories]);

  const subCategories = useMemo(() => {
    if (!selectedMainCatId) return [];
    return categories.filter(c => c.parent_id === selectedMainCatId);
  }, [categories, selectedMainCatId]);

  const subSubCategories = useMemo(() => {
    if (!selectedSubCatId) return [];
    return categories.filter(c => c.parent_id === selectedSubCatId);
  }, [categories, selectedSubCatId]);

  const shopName = (() => {
    try {
      const local = localStorage.getItem('store_settings');
      if (local) {
        return JSON.parse(local).store_name || '6valley CMS';
      }
    } catch (e) { }
    return '6valley CMS';
  })();

  const getCategoryName = (catId: number) => {
    const found = categories.find(c => c.id === catId);
    return found ? found.name : "Women's Fashion";
  };

  const associatedIds = new Set((activeDeal.products || []).map(p => p.id));

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedSubSubCatId) {
      return p.category_id === selectedSubSubCatId;
    }
    if (selectedSubCatId) {
      const isDirectMatch = p.category_id === selectedSubCatId;
      const isChildMatch = categories.some(c => c.parent_id === selectedSubCatId && c.id === p.category_id);
      return isDirectMatch || isChildMatch;
    }
    if (selectedMainCatId) {
      const getDescendantIds = (catId: number): number[] => {
        const children = categories.filter(c => c.parent_id === catId);
        let ids = [catId];
        children.forEach(child => {
          ids = [...ids, ...getDescendantIds(child.id)];
        });
        return ids;
      };
      const allowedIds = getDescendantIds(selectedMainCatId);
      return p.category_id && allowedIds.includes(p.category_id);
    }
    return true;
  });

  const handleToggleProduct = async (productId: number, currentlyAssociated: boolean) => {
    setLoading(true);
    try {
      let updated: FlashDealRow;
      if (currentlyAssociated) {
        updated = await flashDealsService.removeProduct(activeDeal.id, productId);
        toast.success('Product removed from flash deal!');
      } else {
        updated = await flashDealsService.addProducts(activeDeal.id, [productId]);
        toast.success('Product added to flash deal!');
      }
      setActiveDeal(updated);
      onUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to update product association.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      {/* Header / Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border-none cursor-pointer flex items-center justify-center shrink-0"
          title="Back to Flash Deals List"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <FiBox className="text-orange-500 w-5 h-5" />
          <span>Add New Product</span>
        </h3>
      </div>

      {/* Card 1: Setup Card */}
      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-4 relative">
        <div className="border-b border-slate-50 pb-4">
          <h4 className="text-sm font-black text-slate-800 tracking-tight">Flash Deal</h4>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Select products</label>

          {/* Clickaway Overlay */}
          {isOpen && (
            <div className="fixed inset-0 z-20 cursor-default" onClick={() => {
              setIsOpen(false);
              setSelectedMainCatId(null);
              setSelectedSubCatId(null);
              setSelectedSubSubCatId(null);
            }} />
          )}

          <div className="relative w-full">
            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                if (isOpen) {
                  setSelectedMainCatId(null);
                  setSelectedSubCatId(null);
                  setSelectedSubSubCatId(null);
                }
              }}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white flex items-center justify-between cursor-pointer"
            >
              <span className="text-slate-500 font-semibold">Select products</span>
              <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Box */}
            {isOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-[5px] shadow-lg z-30 flex flex-col max-h-[350px]">
                {/* Search Bar */}
                <div className="p-3 border-b border-slate-100 flex items-center relative">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by product name..."
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white"
                    autoFocus
                  />
                  <FiSearch className="absolute right-6 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Categories Selectors Filter */}
                <div className="px-3 pb-3 border-b border-slate-100 grid grid-cols-3 gap-2 shrink-0">
                  <select
                    value={selectedMainCatId || ''}
                    onChange={e => {
                      setSelectedMainCatId(e.target.value ? Number(e.target.value) : null);
                      setSelectedSubCatId(null);
                      setSelectedSubSubCatId(null);
                    }}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {mainCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubCatId || ''}
                    onChange={e => {
                      setSelectedSubCatId(e.target.value ? Number(e.target.value) : null);
                      setSelectedSubSubCatId(null);
                    }}
                    disabled={!selectedMainCatId}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="">All Sub</option>
                    {subCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubSubCatId || ''}
                    onChange={e => {
                      setSelectedSubSubCatId(e.target.value ? Number(e.target.value) : null);
                    }}
                    disabled={!selectedSubCatId}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="">All Sub Sub</option>
                    {subSubCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Section Header */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">All Products</span>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto py-1">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">No products found</div>
                  ) : (
                    filteredProducts.map(p => {
                      const isAlreadyAdded = associatedIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleProduct(p.id, isAlreadyAdded)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-none ${isAlreadyAdded ? 'bg-orange-50/20 hover:bg-orange-50/40' : ''
                            }`}
                        >
                          {/* Image */}
                          <div className="w-12 h-12 rounded bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.display_image ? (
                              <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <FiImage className="w-5 h-5 text-slate-350" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className={`text-xs font-bold text-slate-800 truncate ${isAlreadyAdded ? 'text-orange-600 font-extrabold' : ''}`}>
                                {p.name}
                              </h5>
                              {isAlreadyAdded && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] bg-orange-100 text-orange-600 font-black shrink-0">Added</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                              Price : ${Number(p.price).toFixed(2)} Category : {getCategoryName(p.category_id)} Brand : {p.brand?.name || 'UrbanEdge'} Shop : {shopName}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Selected Products Grid / Empty state */}
      <div className="space-y-4">
        {(!activeDeal.products || activeDeal.products.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-slate-100 rounded-[5px] shadow-xs">
            <div className="relative mb-4 flex items-center justify-center">
              {/* Sheet Graphic */}
              <div className="w-14 h-16 bg-slate-100 rounded-[4px] border border-slate-200 relative flex flex-col justify-between p-2 shadow-2xs">
                <div className="h-0.5 w-6 bg-slate-300 rounded" />
                <div className="h-0.5 w-8 bg-slate-300 rounded" />
                <div className="h-0.5 w-5 bg-slate-300 rounded" />
                <div className="h-0.5 w-7 bg-slate-300 rounded" />
              </div>
              {/* Warning badge */}
              <div className="absolute -bottom-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-xs">
                <FiAlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 tracking-tight">No product select yet</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[5px] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 tracking-tight">Selected Products</h4>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                {activeDeal.products.length} {activeDeal.products.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-450 uppercase tracking-wider">
                    <th className="px-6 py-4 w-16">SL</th>
                    <th className="px-6 py-4">Product Info</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDeal.products.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0">
                            {p.display_image ? (
                              <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                <FiImage className="w-4 h-4 text-slate-350" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</h5>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{getCategoryName(p.category_id)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-700">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProduct(p.id, true)}
                            className="p-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 cursor-pointer transition-colors"
                            title="Remove Product"
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
          </div>
        )}
      </div>
    </div>
  );
};

interface FlashDealsTabProps {
  ownerId?: number | string;
  storeId?: number;
}

export const FlashDealsTab: React.FC<FlashDealsTabProps> = ({ ownerId, storeId }) => {
  const [deals, setDeals] = useState<FlashDealRow[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDealForAddProduct, setSelectedDealForAddProduct] = useState<FlashDealRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<FlashDealRow | null>(null);
  const [productsTarget, setProductsTarget] = useState<FlashDealRow | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const FLASH_DEAL_COLUMNS: HelperTableColumn[] = [
    { key: 'sl', label: 'SL' },
    { key: 'title', label: 'Title' },
    { key: 'duration', label: 'Duration' },
    { key: 'priority', label: 'Priority', align: 'center' },
    { key: 'status', label: 'Status' },
    { key: 'active_products', label: 'Active Products', align: 'center' },
    { key: 'publish', label: 'Publish', align: 'center' },
    { key: 'action', label: 'Action', align: 'center' },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, prods, catsData] = await Promise.all([
        flashDealsService.getMyFlashDeals(0, 100, ownerId),
        menuItemsService.getMenuItems(200, 0, ownerId, storeId),
        categoriesService.getCategories(100, 0, ownerId, storeId),
      ]);
      setDeals(data || []);
      setProducts(prods || []);
      setCategories(catsData?.categories || []);
    } catch (err) {
      console.error('Failed to load flash deals data:', err);
      toast.error('Failed to load flash deals.');
    } finally {
      setLoading(false);
    }
  }, [ownerId, storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = deals.filter(d =>
    !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fmtDate = (iso: string) => {
    if (!iso) return '—';
    const datePart = iso.slice(0, 10);
    const parts = datePart.split('-');
    if (parts.length < 3) return datePart;
    const [y, m, d] = parts;
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(m, 10);
    const monthLabel = months[monthIndex] || m;
    return `${d}-${monthLabel}-${y.slice(2)}`;
  };

  const togglePublish = async (id: number) => {
    try {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, is_published: !d.is_published } : d));
      const updated = await flashDealsService.toggleFlashDeal(id);
      setDeals(prev => prev.map(d => d.id === id ? updated : d));
      toast.success('Publish status updated!');
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
      toast.error('Failed to toggle status.');
      // Revert
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this flash deal? This action cannot be undone.')) return;
    try {
      await flashDealsService.deleteFlashDeal(id);
      setDeals(prev => prev.filter(d => d.id !== id));
      toast.success('Flash deal deleted successfully.');
    } catch (err) {
      console.error('Failed to delete flash deal:', err);
      toast.error('Failed to delete flash deal.');
    }
  };

  const statusColors: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    Expired: 'bg-rose-50 text-rose-500 border border-rose-100',
    Upcoming: 'bg-blue-50 text-blue-600 border border-blue-100',
  };

  if (selectedDealForAddProduct) {
    return (
      <AddProductPageView
        deal={selectedDealForAddProduct}
        products={products}
        categories={categories}
        onBack={() => setSelectedDealForAddProduct(null)}
        onUpdated={updated => {
          setSelectedDealForAddProduct(updated);
          setDeals(prev => prev.map(d => d.id === updated.id ? updated : d));
        }}
      />
    );
  }

  return (
    <>
      {showModal && (
        <FlashDealModal
          deal={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={saved => {
            if (editTarget) {
              setDeals(prev => prev.map(d => d.id === saved.id ? saved : d));
            } else {
              setDeals(prev => [saved, ...prev]);
            }
          }}
        />
      )}

      {productsTarget && (
        <ManageProductsModal
          deal={productsTarget}
          products={products}
          onClose={() => setProductsTarget(null)}
          onUpdated={updated => {
            setProductsTarget(updated);
            setDeals(prev => prev.map(d => d.id === updated.id ? updated : d));
          }}
        />
      )}

      <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <FiZap className="text-orange-500 w-5 h-5 animate-pulse" />
              <span>Flash Deals</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">Configure time-limited flash sales with custom product discounts.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-500 border-none cursor-pointer transition-colors flex items-center justify-center shrink-0"
              title="Refresh"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { setEditTarget(null); setShowModal(true); }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <FiPlus className="w-3.5 h-3.5" /> + Create Flash Deals
            </button>
          </div>
        </div>

        {/* Table */}
        <HelperTable<FlashDealRow>
          title="Flash Deal Table"
          count={filtered.length}
          columns={FLASH_DEAL_COLUMNS}
          data={paginated}
          loading={loading}
          searchPlaceholder="Search by Title…"
          searchValue={searchQuery}
          onSearchChange={v => { setSearchQuery(v); setCurrentPage(1); }}
          emptyStateText="No Flash Deals Found"
          emptyStateSubtext="Create your first flash deal using the button above."
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={size => { setItemsPerPage(size); setCurrentPage(1); }}
          renderRow={(deal, index) => (
            <tr key={deal.id} className="hover:bg-slate-50/40 transition-colors">
              {/* SL */}
              <td className="px-5 py-3.5 text-xs font-bold text-slate-500">
                {(currentPage - 1) * itemsPerPage + index + 1}
              </td>
              {/* Title */}
              <td className="px-5 py-3.5">
                <span className="text-xs font-semibold text-slate-700 line-clamp-1">{deal.title}</span>
              </td>
              {/* Duration */}
              <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold whitespace-nowrap">
                {fmtDate(deal.start_date)} – {fmtDate(deal.end_date)}
              </td>
              {/* Priority */}
              <td className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500">
                {deal.priority ?? 0}
              </td>
              {/* Status */}
              <td className="px-5 py-3.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${statusColors[deal.status] ?? ''}`}>
                  {deal.status}
                </span>
              </td>
              {/* Active Products */}
              <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-600">
                {deal.active_products}
              </td>
              {/* Publish toggle */}
              <td className="px-5 py-3.5 text-center">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deal.is_published}
                    onChange={() => togglePublish(deal.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                </label>
              </td>
              {/* Actions */}
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedDealForAddProduct(deal)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 rounded-[5px] text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FiPlus className="w-3 h-3" /> Add Product
                  </button>
                  <button
                    onClick={() => { setEditTarget(deal); setShowModal(true); }}
                    className="p-1.5 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/50 cursor-pointer transition-colors"
                  >
                    <FiEdit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(deal.id)}
                    className="p-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 cursor-pointer transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Featured Deal Modals & Views
// ─────────────────────────────────────────────────────────────────────────────
interface FeaturedDealModalProps {
  deal: FeaturedDealRow | null;
  onClose: () => void;
  onSaved: (saved: FeaturedDealRow) => void;
}

const FeaturedDealModal: React.FC<FeaturedDealModalProps> = ({ deal, onClose, onSaved }) => {
  const [title, setTitle] = useState(deal?.title || '');
  const [startDate, setStartDate] = useState(deal?.start_date ? deal.start_date.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(deal?.end_date ? deal.end_date.slice(0, 10) : '');
  const [priority, setPriority] = useState(deal?.priority != null ? String(deal.priority) : '0');
  const [isPublished, setIsPublished] = useState(deal?.is_published ?? false);
  const [metaTitle, setMetaTitle] = useState(deal?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(deal?.meta_description || '');

  // Images
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(deal?.image || null);
  const [metaImageFile, setMetaImageFile] = useState<File | null>(null);
  const [metaImagePreview, setMetaImagePreview] = useState<string | null>(deal?.meta_image || null);

  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const metaFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isMeta: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }
      if (isMeta) {
        setMetaImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setMetaImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      toast.error('Title, Start Date and End Date are required.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('start_date', startDate);
      fd.append('end_date', endDate);
      fd.append('is_published', isPublished ? '1' : '0');
      fd.append('priority', priority);
      if (metaTitle) fd.append('meta_title', metaTitle);
      if (metaDescription) fd.append('meta_description', metaDescription);

      if (imageFile) {
        fd.append('image', imageFile);
      }
      if (metaImageFile) {
        fd.append('meta_image', metaImageFile);
      }

      let saved: FeaturedDealRow;
      if (deal) {
        saved = await featuredDealsService.updateFeaturedDeal(deal.id, fd);
        toast.success('Featured deal updated successfully!');
      } else {
        saved = await featuredDealsService.createFeaturedDeal(fd);
        toast.success('Featured deal created successfully!');
      }
      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to save featured deal.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white';
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-fade-in overflow-y-auto py-10">
      <div className="bg-white rounded-[8px] shadow-2xl w-full max-w-2xl mx-4 my-auto overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiGift className="text-orange-500 w-4 h-4" />
            <span>{deal ? 'Edit Featured Deal Details' : 'Create Featured Deal'}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Featured Deal Title *</label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Special Holiday Deal" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>End Date *</label>
              <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <input type="number" className={inputCls} value={priority} onChange={e => setPriority(e.target.value)} placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pt-2">
                <label className="text-xs font-bold text-slate-700">Publish Immediately</label>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                </label>
              </div>

              <div>
                <label className={labelCls}>Meta Title (Optional)</label>
                <input className={inputCls} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO Meta Title" />
              </div>

              <div>
                <label className={labelCls}>Meta Description (Optional)</label>
                <textarea rows={3} className={`${inputCls} resize-none`} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="SEO Meta Description..." />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Banner Image</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-[5px] h-28 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all p-2 relative overflow-hidden">
                  <input type="file" ref={fileInputRef} onChange={e => handleFileChange(e, false)} accept="image/*" className="hidden" />
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Banner Preview" className="w-full h-full object-cover rounded-[3px]" />
                      <button type="button" onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border-none"><FiX className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <FiImage className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-500">Upload Banner File</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Meta Image</label>
                <div onClick={() => metaFileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-[5px] h-28 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all p-2 relative overflow-hidden">
                  <input type="file" ref={metaFileInputRef} onChange={e => handleFileChange(e, true)} accept="image/*" className="hidden" />
                  {metaImagePreview ? (
                    <>
                      <img src={metaImagePreview} alt="Meta Preview" className="w-full h-full object-cover rounded-[3px]" />
                      <button type="button" onClick={e => { e.stopPropagation(); setMetaImageFile(null); setMetaImagePreview(null); if (metaFileInputRef.current) metaFileInputRef.current.value = ''; }} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border-none"><FiX className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <FiImage className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-500">Upload Meta Image File</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[5px] border-none cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 shadow-xs">
              {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
              {deal ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface FeaturedManageProductsModalProps {
  deal: FeaturedDealRow;
  products: MenuItem[];
  onClose: () => void;
  onUpdated: (updated: FeaturedDealRow) => void;
}

const FeaturedManageProductsModal: React.FC<FeaturedManageProductsModalProps> = ({ deal, products, onClose, onUpdated }) => {
  const [search, setSearch] = useState('');
  const [toggingId, setToggingId] = useState<number | null>(null);

  const associatedIds = new Set((deal.products || []).map(p => p.id));

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleProduct = async (productId: number, currentlyAssociated: boolean) => {
    setToggingId(productId);
    try {
      let updated: FeaturedDealRow;
      if (currentlyAssociated) {
        updated = await featuredDealsService.removeProduct(deal.id, productId);
        toast.success('Product removed from featured deal!');
      } else {
        updated = await featuredDealsService.addProducts(deal.id, [productId]);
        toast.success('Product added to featured deal!');
      }
      onUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to update product association.');
    } finally {
      setToggingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-fade-in py-10">
      <div className="bg-white rounded-[8px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50/80 to-white">
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiShoppingBag className="text-orange-500 w-4 h-4 animate-bounce" />
            <span>Manage Products — {deal.title}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-50 shrink-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full px-3.5 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredProducts.length === 0 ? (
            <p className="text-center text-xs font-bold text-slate-400 py-6">No products found.</p>
          ) : (
            filteredProducts.map(p => {
              const isAssociated = associatedIds.has(p.id);
              const isToggling = toggingId === p.id;
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-[5px] border border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                      {p.display_image ? (
                        <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><FiImage className="w-4 h-4 text-slate-350" /></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{p.name}</h4>
                      <p className="text-[10px] text-slate-450 font-bold">${Number(p.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    {isToggling ? (
                      <FiLoader className="w-4 h-4 text-orange-500 animate-spin" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={isAssociated}
                        onChange={() => handleToggleProduct(p.id, isAssociated)}
                        className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                      />
                    )}
                  </label>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-[5px] text-xs font-extrabold border-none cursor-pointer transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface FeaturedAddProductPageViewProps {
  deal: FeaturedDealRow;
  products: MenuItem[];
  categories: Category[];
  onBack: () => void;
  onUpdated: (updated: FeaturedDealRow) => void;
}

const FeaturedAddProductPageView: React.FC<FeaturedAddProductPageViewProps> = ({ deal, products, categories, onBack, onUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [_loading, setLoading] = useState(false);
  const [activeDeal, setActiveDeal] = useState<FeaturedDealRow>(deal);

  const [selectedMainCatId, setSelectedMainCatId] = useState<number | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<number | null>(null);
  const [selectedSubSubCatId, setSelectedSubSubCatId] = useState<number | null>(null);

  const mainCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id);
  }, [categories]);

  const subCategories = useMemo(() => {
    if (!selectedMainCatId) return [];
    return categories.filter(c => c.parent_id === selectedMainCatId);
  }, [categories, selectedMainCatId]);

  const subSubCategories = useMemo(() => {
    if (!selectedSubCatId) return [];
    return categories.filter(c => c.parent_id === selectedSubCatId);
  }, [categories, selectedSubCatId]);

  const shopName = (() => {
    try {
      const local = localStorage.getItem('store_settings');
      if (local) {
        return JSON.parse(local).store_name || '6valley CMS';
      }
    } catch (e) { }
    return '6valley CMS';
  })();

  const getCategoryName = (catId: number) => {
    const found = categories.find(c => c.id === catId);
    return found ? found.name : "Women's Fashion";
  };

  const associatedIds = new Set((activeDeal.products || []).map(p => p.id));

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedSubSubCatId) {
      return p.category_id === selectedSubSubCatId;
    }
    if (selectedSubCatId) {
      const isDirectMatch = p.category_id === selectedSubCatId;
      const isChildMatch = categories.some(c => c.parent_id === selectedSubCatId && c.id === p.category_id);
      return isDirectMatch || isChildMatch;
    }
    if (selectedMainCatId) {
      const getDescendantIds = (catId: number): number[] => {
        const children = categories.filter(c => c.parent_id === catId);
        let ids = [catId];
        children.forEach(child => {
          ids = [...ids, ...getDescendantIds(child.id)];
        });
        return ids;
      };
      const allowedIds = getDescendantIds(selectedMainCatId);
      return p.category_id && allowedIds.includes(p.category_id);
    }
    return true;
  });

  const handleToggleProduct = async (productId: number, currentlyAssociated: boolean) => {
    setLoading(true);
    try {
      let updated: FeaturedDealRow;
      if (currentlyAssociated) {
        updated = await featuredDealsService.removeProduct(activeDeal.id, productId);
        toast.success('Product removed from featured deal!');
      } else {
        updated = await featuredDealsService.addProducts(activeDeal.id, [productId]);
        toast.success('Product added to featured deal!');
      }
      setActiveDeal(updated);
      onUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to update product association.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      {/* Header / Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border-none cursor-pointer flex items-center justify-center shrink-0"
          title="Back to Featured Deals List"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <FiBox className="text-orange-500 w-5 h-5" />
          <span>Add New Product</span>
        </h3>
      </div>

      {/* Card 1: Setup Card */}
      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-4 relative">
        <div className="border-b border-slate-50 pb-4">
          <h4 className="text-sm font-black text-slate-800 tracking-tight">Featured Deal</h4>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Select products</label>

          {/* Clickaway Overlay */}
          {isOpen && (
            <div className="fixed inset-0 z-20 cursor-default" onClick={() => {
              setIsOpen(false);
              setSelectedMainCatId(null);
              setSelectedSubCatId(null);
              setSelectedSubSubCatId(null);
            }} />
          )}

          <div className="relative w-full">
            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                if (isOpen) {
                  setSelectedMainCatId(null);
                  setSelectedSubCatId(null);
                  setSelectedSubSubCatId(null);
                }
              }}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white flex items-center justify-between cursor-pointer"
            >
              <span className="text-slate-500 font-semibold">Select products</span>
              <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Box */}
            {isOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-[5px] shadow-lg z-30 flex flex-col max-h-[350px]">
                {/* Search Bar */}
                <div className="p-3 border-b border-slate-100 flex items-center relative">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by product name..."
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white"
                    autoFocus
                  />
                  <FiSearch className="absolute right-6 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Categories Selectors Filter */}
                <div className="px-3 pb-3 border-b border-slate-100 grid grid-cols-3 gap-2 shrink-0">
                  <select
                    value={selectedMainCatId || ''}
                    onChange={e => {
                      setSelectedMainCatId(e.target.value ? Number(e.target.value) : null);
                      setSelectedSubCatId(null);
                      setSelectedSubSubCatId(null);
                    }}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {mainCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubCatId || ''}
                    onChange={e => {
                      setSelectedSubCatId(e.target.value ? Number(e.target.value) : null);
                      setSelectedSubSubCatId(null);
                    }}
                    disabled={!selectedMainCatId}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="">All Sub</option>
                    {subCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubSubCatId || ''}
                    onChange={e => {
                      setSelectedSubSubCatId(e.target.value ? Number(e.target.value) : null);
                    }}
                    disabled={!selectedSubCatId}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="">All Sub Sub</option>
                    {subSubCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Section Header */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">All Products</span>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto py-1">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">No products found</div>
                  ) : (
                    filteredProducts.map(p => {
                      const isAlreadyAdded = associatedIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleProduct(p.id, isAlreadyAdded)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-none ${isAlreadyAdded ? 'bg-orange-50/20 hover:bg-orange-50/40' : ''
                            }`}
                        >
                          {/* Image */}
                          <div className="w-12 h-12 rounded bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.display_image ? (
                              <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <FiImage className="w-5 h-5 text-slate-350" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className={`text-xs font-bold text-slate-800 truncate ${isAlreadyAdded ? 'text-orange-600 font-extrabold' : ''}`}>
                                {p.name}
                              </h5>
                              {isAlreadyAdded && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] bg-orange-100 text-orange-600 font-black shrink-0">Added</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                              Price : ${Number(p.price).toFixed(2)} Category : {getCategoryName(p.category_id)} Brand : {p.brand?.name || 'UrbanEdge'} Shop : {shopName}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Selected Products Grid / Empty state */}
      <div className="space-y-4">
        {(!activeDeal.products || activeDeal.products.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-slate-100 rounded-[5px] shadow-xs">
            <div className="relative mb-4 flex items-center justify-center">
              {/* Sheet Graphic */}
              <div className="w-14 h-16 bg-slate-100 rounded-[4px] border border-slate-200 relative flex flex-col justify-between p-2 shadow-2xs">
                <div className="h-0.5 w-6 bg-slate-300 rounded" />
                <div className="h-0.5 w-8 bg-slate-300 rounded" />
                <div className="h-0.5 w-5 bg-slate-300 rounded" />
                <div className="h-0.5 w-7 bg-slate-300 rounded" />
              </div>
              {/* Warning badge */}
              <div className="absolute -bottom-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-xs">
                <FiAlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 tracking-tight">No product select yet</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[5px] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 tracking-tight">Selected Products</h4>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                {activeDeal.products.length} {activeDeal.products.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-450 uppercase tracking-wider">
                    <th className="px-6 py-4 w-16">SL</th>
                    <th className="px-6 py-4">Product Info</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDeal.products.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0">
                            {p.display_image ? (
                              <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                <FiImage className="w-4 h-4 text-slate-350" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</h5>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{getCategoryName(p.category_id)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-700">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProduct(p.id, true)}
                            className="p-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 cursor-pointer transition-colors"
                            title="Remove Product"
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
          </div>
        )}
      </div>
    </div>
  );
};

interface FeaturedDealsSubTabProps {
  ownerId?: number | string;
  storeId?: number;
}

const FeaturedDealsSubTab: React.FC<FeaturedDealsSubTabProps> = ({ ownerId, storeId }) => {
  const [deals, setDeals] = useState<FeaturedDealRow[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDealForAddProduct, setSelectedDealForAddProduct] = useState<FeaturedDealRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<FeaturedDealRow | null>(null);
  const [productsTarget, setProductsTarget] = useState<FeaturedDealRow | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const FEATURED_DEAL_COLUMNS: HelperTableColumn[] = [
    { key: 'sl', label: 'SL' },
    { key: 'title', label: 'Title' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'priority', label: 'Priority', align: 'center' },
    { key: 'active_expired', label: 'Active / Expired' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: 'Action', align: 'center' },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, prods, catsData] = await Promise.all([
        featuredDealsService.getMyFeaturedDeals(0, 100, ownerId),
        menuItemsService.getMenuItems(200, 0, ownerId, storeId),
        categoriesService.getCategories(100, 0, ownerId, storeId),
      ]);
      setDeals(data || []);
      setProducts(prods || []);
      setCategories(catsData?.categories || []);
    } catch (err) {
      console.error('Failed to load featured deals data:', err);
      toast.error('Failed to load featured deals.');
    } finally {
      setLoading(false);
    }
  }, [ownerId, storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = deals.filter(d =>
    !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fmtDateFeatured = (iso: string) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    const d = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${d}-${month}-${year}`;
  };

  const togglePublish = async (id: number) => {
    try {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, is_published: !d.is_published } : d));
      const updated = await featuredDealsService.toggleFeaturedDeal(id);
      setDeals(prev => prev.map(d => d.id === id ? updated : d));
      toast.success('Publish status updated!');
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
      toast.error('Failed to toggle status.');
      loadData();
    }
  };

  const handlePrioritySetup = () => {
    toast.success('Product priority setup saved successfully!');
  };

  const statusColors: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    Expired: 'bg-rose-50 text-rose-500 border border-rose-100',
    Upcoming: 'bg-blue-50 text-blue-600 border border-blue-100',
  };

  if (selectedDealForAddProduct) {
    return (
      <FeaturedAddProductPageView
        deal={selectedDealForAddProduct}
        products={products}
        categories={categories}
        onBack={() => setSelectedDealForAddProduct(null)}
        onUpdated={updated => {
          setSelectedDealForAddProduct(updated);
          setDeals(prev => prev.map(d => d.id === updated.id ? updated : d));
        }}
      />
    );
  }

  return (
    <>
      {showModal && (
        <FeaturedDealModal
          deal={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={saved => {
            if (editTarget) {
              setDeals(prev => prev.map(d => d.id === saved.id ? saved : d));
            } else {
              setDeals(prev => [saved, ...prev]);
            }
          }}
        />
      )}

      {productsTarget && (
        <FeaturedManageProductsModal
          deal={productsTarget}
          products={products}
          onClose={() => setProductsTarget(null)}
          onUpdated={updated => {
            setProductsTarget(updated);
            setDeals(prev => prev.map(d => d.id === updated.id ? updated : d));
          }}
        />
      )}

      <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <span className="text-orange-500">★</span>
              <span>Feature Deal</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">Configure featured deals with special highlights and priority products.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-500 border-none cursor-pointer transition-colors flex items-center justify-center shrink-0"
              title="Refresh"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handlePrioritySetup}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center shadow-xs shrink-0"
            >
              Product priority Setup
            </button>
          </div>
        </div>

        {/* Table container */}
        <HelperTable<FeaturedDealRow>
          title="Feature Deal Table"
          count={filtered.length}
          columns={FEATURED_DEAL_COLUMNS}
          data={paginated}
          loading={loading}
          searchPlaceholder="Search by title"
          searchValue={searchQuery}
          onSearchChange={v => { setSearchQuery(v); setCurrentPage(1); }}
          emptyStateText="No Featured Deals Found"
          emptyStateSubtext="Create your first featured deal using the button above."
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={size => { setItemsPerPage(size); setCurrentPage(1); }}
          addButton={{
            label: 'Create Featured Deal',
            onClick: () => { setEditTarget(null); setShowModal(true); }
          }}
          renderRow={(deal, index) => (
            <tr key={deal.id} className="hover:bg-slate-50/40 transition-colors">
              {/* SL */}
              <td className="px-5 py-3.5 text-xs font-bold text-slate-500">
                {(currentPage - 1) * itemsPerPage + index + 1}
              </td>
              {/* Title */}
              <td className="px-5 py-3.5">
                <span className="text-xs font-semibold text-slate-700 line-clamp-1">{deal.title}</span>
              </td>
              {/* Start Date */}
              <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold whitespace-nowrap">
                {fmtDateFeatured(deal.start_date)}
              </td>
              {/* End Date */}
              <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold whitespace-nowrap">
                {fmtDateFeatured(deal.end_date)}
              </td>
              {/* Priority */}
              <td className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500">
                {deal.priority ?? 0}
              </td>
              {/* Active / Expired */}
              <td className="px-5 py-3.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${statusColors[deal.status] ?? ''}`}>
                  {deal.status}
                </span>
              </td>
              {/* Status publish toggle */}
              <td className="px-5 py-3.5">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deal.is_published}
                    onChange={() => togglePublish(deal.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0f53a1]" />
                </label>
              </td>
              {/* Actions */}
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedDealForAddProduct(deal)}
                    className="px-2.5 py-1.5 text-[#0f53a1] border border-slate-200 hover:bg-slate-50 rounded-[5px] text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors bg-white"
                  >
                    <FiPlus className="w-3 h-3" /> Add product
                  </button>
                  <button
                    onClick={() => { setEditTarget(deal); setShowModal(true); }}
                    className="p-1.5 rounded-[5px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                  >
                    <FiEdit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Clearance Sales Modals & Views
// ─────────────────────────────────────────────────────────────────────────────
interface ClearanceSaleModalProps {
  deal: ClearanceSaleRow | null;
  onClose: () => void;
  onSaved: (saved: ClearanceSaleRow) => void;
}

const ClearanceSaleModal: React.FC<ClearanceSaleModalProps> = ({ deal, onClose, onSaved }) => {
  const [title, setTitle] = useState(deal?.title || '');
  const [startDate, setStartDate] = useState(deal?.start_date ? deal.start_date.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(deal?.end_date ? deal.end_date.slice(0, 10) : '');
  const [isActive, setIsActive] = useState(deal?.is_active ?? false);
  const [discountType, setDiscountType] = useState<'flat' | 'product_wise'>(deal?.discount_type || 'flat');
  const [discountAmount, setDiscountAmount] = useState(deal?.discount_amount != null ? String(deal.discount_amount) : '');
  const [discountAmountType, setDiscountAmountType] = useState<'flat' | 'percent'>(deal?.discount_amount_type || 'flat');
  const [offerActiveTime, setOfferActiveTime] = useState<'always' | 'specific_time'>(deal?.offer_active_time || 'always');
  const [activeStartTime, setActiveStartTime] = useState(deal?.active_start_time || '');
  const [activeEndTime, setActiveEndTime] = useState(deal?.active_end_time || '');
  const [showInHomePage, setShowInHomePage] = useState(deal?.show_in_home_page ?? false);
  const [priority, setPriority] = useState(deal?.priority != null ? String(deal.priority) : '0');
  const [metaTitle, setMetaTitle] = useState(deal?.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(deal?.meta_description || '');

  // Meta image upload
  const [metaImageFile, setMetaImageFile] = useState<File | null>(null);
  const [metaImagePreview, setMetaImagePreview] = useState<string | null>(deal?.meta_image || null);

  const [saving, setSaving] = useState(false);
  const metaFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }
      setMetaImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setMetaImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Start Date and End Date are required.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title || 'Clearance Sale');
      fd.append('start_date', startDate);
      fd.append('end_date', endDate);
      fd.append('is_active', isActive ? '1' : '0');
      fd.append('discount_type', discountType);
      if (discountType === 'flat') {
        fd.append('discount_amount', discountAmount || '0');
        fd.append('discount_amount_type', discountAmountType);
      }
      fd.append('offer_active_time', offerActiveTime);
      if (offerActiveTime === 'specific_time') {
        if (activeStartTime) fd.append('active_start_time', activeStartTime);
        if (activeEndTime) fd.append('active_end_time', activeEndTime);
      }
      fd.append('show_in_home_page', showInHomePage ? '1' : '0');
      fd.append('priority', priority || '0');
      if (metaTitle) fd.append('meta_title', metaTitle);
      if (metaDescription) fd.append('meta_description', metaDescription);
      if (metaImageFile) {
        fd.append('meta_image', metaImageFile);
      }

      let saved: ClearanceSaleRow;
      if (deal) {
        saved = await clearanceSalesService.updateClearanceSale(deal.id, fd);
        toast.success('Clearance sale updated successfully!');
      } else {
        saved = await clearanceSalesService.createClearanceSale(fd);
        toast.success('Clearance sale created successfully!');
      }
      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to save clearance sale.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white';
  const labelCls = 'block text-xs font-bold text-slate-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs animate-fade-in overflow-y-auto py-10">
      <div className="bg-white rounded-[8px] shadow-2xl w-full max-w-2xl mx-4 my-auto overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiPercent className="text-orange-500 w-4 h-4" />
            <span>{deal ? 'Edit Clearance Sale Details' : 'Create Clearance Sale'}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 border-none cursor-pointer transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Clearance Sale Title *</label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. End of Season Clearance" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>End Date *</label>
              <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <input type="number" className={inputCls} value={priority} onChange={e => setPriority(e.target.value)} placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Discount Type</label>
              <select className={inputCls} value={discountType} onChange={e => setDiscountType(e.target.value as any)}>
                <option value="flat">Flat Discount (All Products)</option>
                <option value="product_wise">Product Wise (Custom Discount per Item)</option>
              </select>
            </div>
            {discountType === 'flat' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Discount Amount</label>
                  <input type="number" step="0.01" className={inputCls} value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Amount Type</label>
                  <select className={inputCls} value={discountAmountType} onChange={e => setDiscountAmountType(e.target.value as any)}>
                    <option value="flat">Flat ($)</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Offer Active Time</label>
              <select className={inputCls} value={offerActiveTime} onChange={e => setOfferActiveTime(e.target.value as any)}>
                <option value="always">Always Active (During dates)</option>
                <option value="specific_time">Specific Daily Window</option>
              </select>
            </div>
            {offerActiveTime === 'specific_time' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Daily Start Time</label>
                  <input type="time" className={inputCls} value={activeStartTime} onChange={e => setActiveStartTime(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Daily End Time</label>
                  <input type="time" className={inputCls} value={activeEndTime} onChange={e => setActiveEndTime(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pt-2">
                <label className="text-xs font-bold text-slate-700">Active Immediately</label>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <label className="text-xs font-bold text-slate-700">Show in Home Page</label>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={showInHomePage} onChange={e => setShowInHomePage(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                </label>
              </div>

              <div>
                <label className={labelCls}>Meta Title (Optional)</label>
                <input className={inputCls} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO Meta Title" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Meta Description (Optional)</label>
                <textarea rows={3} className={`${inputCls} resize-none`} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="SEO Meta Description..." />
              </div>

              <div>
                <label className={labelCls}>Meta Image</label>
                <div onClick={() => metaFileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-[5px] h-28 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all p-2 relative overflow-hidden">
                  <input type="file" ref={metaFileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  {metaImagePreview ? (
                    <>
                      <img src={metaImagePreview} alt="Meta Preview" className="w-full h-full object-cover rounded-[3px]" />
                      <button type="button" onClick={e => { e.stopPropagation(); setMetaImageFile(null); setMetaImagePreview(null); if (metaFileInputRef.current) metaFileInputRef.current.value = ''; }} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors border-none"><FiX className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <FiImage className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-500">Upload Meta Image File</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[5px] border-none cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 shadow-xs">
              {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
              {deal ? 'Save Changes' : 'Create Clearance Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ClearanceAddProductPageViewProps {
  deal: ClearanceSaleRow;
  products: MenuItem[];
  categories: Category[];
  onBack: () => void;
  onUpdated: (updated: ClearanceSaleRow) => void;
}

const ClearanceAddProductPageView: React.FC<ClearanceAddProductPageViewProps> = ({ deal, products, categories, onBack, onUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDeal, setActiveDeal] = useState<ClearanceSaleRow>(deal);

  const [selectedMainCatId, setSelectedMainCatId] = useState<number | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<number | null>(null);
  const [selectedSubSubCatId, setSelectedSubSubCatId] = useState<number | null>(null);

  const mainCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id);
  }, [categories]);

  const subCategories = useMemo(() => {
    if (!selectedMainCatId) return [];
    return categories.filter(c => c.parent_id === selectedMainCatId);
  }, [categories, selectedMainCatId]);

  const subSubCategories = useMemo(() => {
    if (!selectedSubCatId) return [];
    return categories.filter(c => c.parent_id === selectedSubCatId);
  }, [categories, selectedSubCatId]);

  // Pivot edit state
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [pivotForm, setPivotForm] = useState({
    discount_amount: '0.00',
    discount_type: 'flat' as 'flat' | 'percent',
    is_active: true,
  });

  const shopName = (() => {
    try {
      const local = localStorage.getItem('store_settings');
      if (local) {
        return JSON.parse(local).store_name || '6valley CMS';
      }
    } catch (e) { }
    return '6valley CMS';
  })();

  const getCategoryName = (catId: number) => {
    const found = categories.find(c => c.id === catId);
    return found ? found.name : "Women's Fashion";
  };

  const associatedIds = new Set((activeDeal.products || []).map(p => p.id));

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedSubSubCatId) {
      return p.category_id === selectedSubSubCatId;
    }
    if (selectedSubCatId) {
      const isDirectMatch = p.category_id === selectedSubCatId;
      const isChildMatch = categories.some(c => c.parent_id === selectedSubCatId && c.id === p.category_id);
      return isDirectMatch || isChildMatch;
    }
    if (selectedMainCatId) {
      const getDescendantIds = (catId: number): number[] => {
        const children = categories.filter(c => c.parent_id === catId);
        let ids = [catId];
        children.forEach(child => {
          ids = [...ids, ...getDescendantIds(child.id)];
        });
        return ids;
      };
      const allowedIds = getDescendantIds(selectedMainCatId);
      return p.category_id && allowedIds.includes(p.category_id);
    }
    return true;
  });

  const handleToggleProduct = async (productId: number, currentlyAssociated: boolean) => {
    setLoading(true);
    try {
      let updated: ClearanceSaleRow;
      if (currentlyAssociated) {
        updated = await clearanceSalesService.removeProduct(activeDeal.id, productId);
        toast.success('Product removed from clearance sale!');
      } else {
        updated = await clearanceSalesService.addProducts(activeDeal.id, [productId]);
        toast.success('Product added to clearance sale!');
      }
      setActiveDeal(updated);
      onUpdated(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.details?.message || 'Failed to update product association.');
    } finally {
      setLoading(false);
    }
  };

  const startEditingPivot = (product: ClearanceProduct) => {
    setEditingProductId(product.id);
    setPivotForm({
      discount_amount: product.pivot ? String(product.pivot.discount_amount) : '0.00',
      discount_type: product.pivot?.discount_type || 'flat',
      is_active: product.pivot ? product.pivot.is_active : true,
    });
  };

  const savePivot = async (productId: number) => {
    setLoading(true);
    try {
      const updated = await clearanceSalesService.updateProductPivot(activeDeal.id, productId, {
        discount_amount: parseFloat(pivotForm.discount_amount) || 0,
        discount_type: pivotForm.discount_type,
        is_active: pivotForm.is_active,
      });
      setActiveDeal(updated);
      onUpdated(updated);
      setEditingProductId(null);
      toast.success('Product discount updated!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update product discount.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      {/* Header / Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-[5px] bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border-none cursor-pointer flex items-center justify-center shrink-0"
          title="Back to Clearance Sales List"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <FiBox className="text-orange-500 w-5 h-5" />
          <span>Add & Setup Products</span>
        </h3>
      </div>

      {/* Card 1: Setup Card */}
      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-4 relative">
        <div className="border-b border-slate-50 pb-4">
          <h4 className="text-sm font-black text-slate-800 tracking-tight">Clearance Sale : {activeDeal.title}</h4>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Select products to add</label>

          {/* Clickaway Overlay */}
          {isOpen && (
            <div className="fixed inset-0 z-20 cursor-default" onClick={() => {
              setIsOpen(false);
              setSelectedMainCatId(null);
              setSelectedSubCatId(null);
              setSelectedSubSubCatId(null);
            }} />
          )}

          <div className="relative w-full">
            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                if (isOpen) {
                  setSelectedMainCatId(null);
                  setSelectedSubCatId(null);
                  setSelectedSubSubCatId(null);
                }
              }}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white flex items-center justify-between cursor-pointer"
            >
              <span className="text-slate-500 font-semibold">Select products</span>
              <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Box */}
            {isOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-[5px] shadow-lg z-30 flex flex-col max-h-[350px]">
                {/* Search Bar */}
                <div className="p-3 border-b border-slate-100 flex items-center relative">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by product name..."
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold bg-white"
                    autoFocus
                  />
                  <FiSearch className="absolute right-6 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Categories Selectors Filter */}
                <div className="px-3 pb-3 border-b border-slate-100 grid grid-cols-3 gap-2 shrink-0">
                  <select
                    value={selectedMainCatId || ''}
                    onChange={e => {
                      setSelectedMainCatId(e.target.value ? Number(e.target.value) : null);
                      setSelectedSubCatId(null);
                      setSelectedSubSubCatId(null);
                    }}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {mainCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubCatId || ''}
                    onChange={e => {
                      setSelectedSubCatId(e.target.value ? Number(e.target.value) : null);
                      setSelectedSubSubCatId(null);
                    }}
                    disabled={!selectedMainCatId}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="">All Sub</option>
                    {subCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubSubCatId || ''}
                    onChange={e => {
                      setSelectedSubSubCatId(e.target.value ? Number(e.target.value) : null);
                    }}
                    disabled={!selectedSubCatId}
                    className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold bg-white disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="">All Sub Sub</option>
                    {subSubCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto py-1">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">No products found</div>
                  ) : (
                    filteredProducts.map(p => {
                      const isAlreadyAdded = associatedIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleProduct(p.id, isAlreadyAdded)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-none ${isAlreadyAdded ? 'bg-orange-50/20 hover:bg-orange-50/40' : ''
                            }`}
                        >
                          {/* Image */}
                          <div className="w-12 h-12 rounded bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.display_image ? (
                              <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <FiImage className="w-5 h-5 text-slate-350" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className={`text-xs font-bold text-slate-800 truncate ${isAlreadyAdded ? 'text-orange-600 font-extrabold' : ''}`}>
                                {p.name}
                              </h5>
                              {isAlreadyAdded && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] bg-orange-100 text-orange-600 font-black shrink-0">Added</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                              Price : ${Number(p.price).toFixed(2)} Category : {getCategoryName(p.category_id)} Brand : {p.brand?.name || 'UrbanEdge'} Shop : {shopName}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Selected Products Grid */}
      <div className="space-y-4">
        {(!activeDeal.products || activeDeal.products.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-slate-100 rounded-[5px] shadow-xs">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-14 h-16 bg-slate-100 rounded-[4px] border border-slate-200 relative flex flex-col justify-between p-2 shadow-2xs">
                <div className="h-0.5 w-6 bg-slate-300 rounded" />
                <div className="h-0.5 w-8 bg-slate-300 rounded" />
                <div className="h-0.5 w-5 bg-slate-300 rounded" />
                <div className="h-0.5 w-7 bg-slate-300 rounded" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-xs">
                <FiAlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 tracking-tight">No products selected yet</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[5px] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 tracking-tight">Selected Products</h4>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                {activeDeal.products.length} {activeDeal.products.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-450 uppercase tracking-wider">
                    <th className="px-6 py-4 w-16">SL</th>
                    <th className="px-6 py-4">Product Info</th>
                    <th className="px-6 py-4">Original Price</th>
                    {activeDeal.discount_type === 'product_wise' && (
                      <th className="px-6 py-4">Clearance Discount</th>
                    )}
                    <th className="px-6 py-4 text-center w-36">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDeal.products.map((p, idx) => {
                    const isEditing = editingProductId === p.id;
                    const displayDiscount = (() => {
                      if (activeDeal.discount_type === 'flat') {
                        return `${activeDeal.discount_amount_type === 'percent' ? `${activeDeal.discount_amount}%` : `$${Number(activeDeal.discount_amount).toFixed(2)}`} (Flat)`;
                      }
                      if (p.pivot) {
                        return `${p.pivot.discount_type === 'percent' ? `${p.pivot.discount_amount}%` : `$${Number(p.pivot.discount_amount).toFixed(2)}`}`;
                      }
                      return 'No Discount';
                    })();

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0">
                              {p.display_image ? (
                                <img src={p.display_image} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                  <FiImage className="w-4 h-4 text-slate-350" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</h5>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{getCategoryName(p.category_id)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-slate-700">
                          ${Number(p.price).toFixed(2)}
                        </td>
                        {activeDeal.discount_type === 'product_wise' && (
                          <td className="px-6 py-4 text-xs font-bold">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-16 px-1.5 py-1 text-xs border border-slate-250 rounded bg-white font-semibold"
                                  value={pivotForm.discount_amount}
                                  onChange={e => setPivotForm(pf => ({ ...pf, discount_amount: e.target.value }))}
                                />
                                <select
                                  className="px-1.5 py-1 text-xs border border-slate-250 rounded bg-white font-semibold"
                                  value={pivotForm.discount_type}
                                  onChange={e => setPivotForm(pf => ({ ...pf, discount_type: e.target.value as any }))}
                                >
                                  <option value="flat">Flat ($)</option>
                                  <option value="percent">%</option>
                                </select>
                                <label className="flex items-center gap-1 text-[10px] text-slate-500 font-bold ml-1">
                                  <input
                                    type="checkbox"
                                    checked={pivotForm.is_active}
                                    onChange={e => setPivotForm(pf => ({ ...pf, is_active: e.target.checked }))}
                                    className="w-3 h-3 text-orange-600 border-slate-350 accent-orange-600 rounded"
                                  />
                                  Active
                                </label>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-orange-600 font-extrabold">{displayDiscount}</span>
                                {p.pivot && !p.pivot.is_active && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-slate-100 text-slate-500 font-black">Inactive</span>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {activeDeal.discount_type === 'product_wise' && (
                              isEditing ? (
                                <>
                                  <button
                                    onClick={() => savePivot(p.id)}
                                    disabled={loading}
                                    className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-pointer"
                                    title="Save Discount"
                                  >
                                    <FiCheck className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingProductId(null)}
                                    className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer"
                                    title="Cancel"
                                  >
                                    <FiX className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => startEditingPivot(p)}
                                  className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 cursor-pointer"
                                  title="Edit Discount Setup"
                                >
                                  <FiEdit className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleProduct(p.id, true)}
                              disabled={loading}
                              className="p-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 cursor-pointer transition-colors"
                              title="Remove Product"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ClearanceSalesSubTabProps {
  ownerId?: number | string;
  storeId?: number;
}

const ClearanceSalesSubTab: React.FC<ClearanceSalesSubTabProps> = ({ ownerId, storeId }) => {
  const [deals, setDeals] = useState<ClearanceSaleRow[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDealForAddProduct, setSelectedDealForAddProduct] = useState<ClearanceSaleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ClearanceSaleRow | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const CLEARANCE_COLUMNS: HelperTableColumn[] = [
    { key: 'sl', label: 'SL' },
    { key: 'title', label: 'Title' },
    { key: 'duration', label: 'Duration' },
    { key: 'priority', label: 'Priority', align: 'center' },
    { key: 'discount_info', label: 'Discount Setup' },
    { key: 'active', label: 'Active', align: 'center' },
    { key: 'action', label: 'Action', align: 'center' },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, prods, catsData] = await Promise.all([
        clearanceSalesService.getMyClearanceSales(0, 100, ownerId),
        menuItemsService.getMenuItems(200, 0, ownerId, storeId),
        categoriesService.getCategories(100, 0, ownerId, storeId),
      ]);
      setDeals(data || []);
      setProducts(prods || []);
      setCategories(catsData?.categories || []);
    } catch (err) {
      console.error('Failed to load clearance sales:', err);
      toast.error('Failed to load clearance sales.');
    } finally {
      setLoading(false);
    }
  }, [ownerId, storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = deals.filter(d =>
    !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fmtDate = (iso: string) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    const d = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d}-${months[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
  };

  const toggleActive = async (id: number) => {
    try {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, is_active: !d.is_active } : d));
      const updated = await clearanceSalesService.toggleClearanceSale(id);
      setDeals(prev => prev.map(d => d.id === id ? updated : d));
      toast.success('Active status updated!');
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      toast.error('Failed to toggle active status.');
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this clearance sale? This cannot be undone.')) return;
    try {
      await clearanceSalesService.deleteClearanceSale(id);
      setDeals(prev => prev.filter(d => d.id !== id));
      toast.success('Clearance sale deleted.');
    } catch (err) {
      console.error('Failed to delete:', err);
      toast.error('Failed to delete clearance sale.');
    }
  };

  if (selectedDealForAddProduct) {
    return (
      <ClearanceAddProductPageView
        deal={selectedDealForAddProduct}
        products={products}
        categories={categories}
        onBack={() => setSelectedDealForAddProduct(null)}
        onUpdated={updated => {
          setSelectedDealForAddProduct(updated);
          setDeals(prev => prev.map(d => d.id === updated.id ? updated : d));
        }}
      />
    );
  }

  return (
    <>
      {showModal && (
        <ClearanceSaleModal
          deal={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={saved => {
            if (editTarget) {
              setDeals(prev => prev.map(d => d.id === saved.id ? saved : d));
            } else {
              setDeals(prev => [saved, ...prev]);
            }
          }}
        />
      )}

      <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <FiPercent className="text-orange-500 w-5 h-5" />
              <span>Clearance Sale</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">Create and manage clearance events with flat or product-wise discounts.</p>
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

        <HelperTable<ClearanceSaleRow>
          title="Clearance Sale Table"
          count={filtered.length}
          columns={CLEARANCE_COLUMNS}
          data={paginated}
          loading={loading}
          searchPlaceholder="Search by title"
          searchValue={searchQuery}
          onSearchChange={v => { setSearchQuery(v); setCurrentPage(1); }}
          emptyStateText="No Clearance Sales Found"
          emptyStateSubtext="Create your first clearance sale event."
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={size => { setItemsPerPage(size); setCurrentPage(1); }}
          addButton={{
            label: 'Create Clearance Sale',
            onClick: () => { setEditTarget(null); setShowModal(true); }
          }}
          renderRow={(deal, index) => {
            const displayDiscount = (() => {
              if (deal.discount_type === 'product_wise') {
                return (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black">
                    Product Wise
                  </span>
                );
              }
              const isPercent = deal.discount_amount_type === 'percent';
              return (
                <span className="text-xs font-extrabold text-slate-800">
                  {isPercent ? `${deal.discount_amount}%` : `$${Number(deal.discount_amount).toFixed(2)}`}
                  <span className="ml-1 text-[10px] font-bold text-slate-400">Flat</span>
                </span>
              );
            })();

            return (
              <tr key={deal.id} className="hover:bg-slate-50/40 transition-colors">
                {/* SL */}
                <td className="px-5 py-3.5 text-xs font-bold text-slate-500">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                {/* Title */}
                <td className="px-5 py-3.5 text-slate-700 max-w-[200px]">
                  <span className="line-clamp-1 text-xs font-semibold">{deal.title}</span>
                </td>
                {/* Duration */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <FiCalendar className="w-3 h-3" />
                    <span>{fmtDate(deal.start_date)}</span>
                    <span className="text-slate-300">→</span>
                    <span>{fmtDate(deal.end_date)}</span>
                  </div>
                </td>
                {/* Priority */}
                <td className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500">
                  {deal.priority ?? 0}
                </td>
                {/* Discount Setup */}
                <td className="px-5 py-3.5">
                  {displayDiscount}
                </td>
                {/* Active toggle */}
                <td className="px-5 py-3.5 text-center">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deal.is_active}
                      onChange={() => toggleActive(deal.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                  </label>
                </td>
                {/* Actions */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedDealForAddProduct(deal)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 rounded-[5px] text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <FiPlus className="w-3 h-3" /> Setup Products
                    </button>
                    <button
                      onClick={() => { setEditTarget(deal); setShowModal(true); }}
                      className="p-1.5 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200/50 cursor-pointer"
                    >
                      <FiEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
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
      </div>
    </>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// 3. Generic Deal Configurations Tab (Featured Deal, Clearance Sale)
// ─────────────────────────────────────────────────────────────────────────────
interface GenericDealProps {
  type: 'featured' | 'clearance';
  ownerId?: number | string;
  storeId?: number;
}

export const GenericDealsTab: React.FC<GenericDealProps> = ({ type, ownerId, storeId }) => {
  if (type === 'featured') {
    return <FeaturedDealsSubTab ownerId={ownerId} storeId={storeId} />;
  }
  if (type === 'clearance') {
    return <ClearanceSalesSubTab ownerId={ownerId} storeId={storeId} />;
  }

  // Fallback (should not be reached)
  return null;
};



// ─────────────────────────────────────────────────────────────────────────────
// 4. Send Notification Tab Component
// ─────────────────────────────────────────────────────────────────────────────
export const SendNotificationTab: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Title and message text are required.');
      return;
    }
    toast.success('Push notification sent to all active users (Demo Mode)!');
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      <div>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiVolume2 className="text-orange-500 w-5 h-5" />
          <span>Send Notification</span>
        </h3>
        <p className="text-slate-400 text-xs mt-1">Broadcast direct message alerts to customer app instances instantly.</p>
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-6">
        <h4 className="text-sm font-black text-slate-800 tracking-tight">New Broadcast Notification</h4>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Notification Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Free Delivery Weekend!"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Message Description *</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter message details for your customers..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="submit" className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center space-x-1.5 shadow-2xs">
              <FiBell className="w-3.5 h-3.5" />
              <span>Send Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Push Notifications Setup Tab
// ─────────────────────────────────────────────────────────────────────────────
export const PushNotificationsSetupTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      <div>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiSettings className="text-orange-500 w-5 h-5" />
          <span>Push Notification Setup</span>
        </h3>
        <p className="text-slate-400 text-xs mt-1">Configure Firebase Cloud Messaging credentials and API keys.</p>
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-6">
        <h4 className="text-sm font-black text-slate-800 tracking-tight">FCM Server Configurations</h4>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Firebase API Key</label>
            <input type="password" value="****************************************" disabled className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none bg-slate-50 text-slate-400 font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">FCM Project ID</label>
            <input type="text" value="valley-food-delivery-f31d2" disabled className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none bg-slate-50 text-slate-400 font-mono" />
          </div>
          <div className="flex justify-end">
            <button onClick={() => toast.success('FCM configurations saved (Demo Mode)!')} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center space-x-1.5">
              <FiSave className="w-3.5 h-3.5" />
              <span>Save Configurations</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Announcement Tab Component
// ─────────────────────────────────────────────────────────────────────────────
export const AnnouncementTab: React.FC = () => {
  const [announcementText, setAnnouncementText] = useState('Free shipping on all orders above $50.00 this week! Use code FREESHIP at checkout.');

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      <div>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiVolume2 className="text-orange-500 w-5 h-5" />
          <span>Storewide Announcement</span>
        </h3>
        <p className="text-slate-400 text-xs mt-1">Setup marquee scrolling announcements or alert banners shown at the top of your homepage storefront.</p>
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-6">
        <h4 className="text-sm font-black text-slate-800 tracking-tight">Configure Announcement Banner</h4>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Announcement Text</label>
            <input
              type="text"
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
              placeholder="e.g. Free shipping on all products!"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
            />
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-slate-700">Enable Scrolling Banner</label>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
            </label>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => toast.success('Announcement details saved (Demo Mode)!')} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center space-x-1.5">
              <FiSave className="w-3.5 h-3.5" />
              <span>Save Announcement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
