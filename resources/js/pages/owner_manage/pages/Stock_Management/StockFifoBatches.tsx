import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiBox, FiSliders, FiCalendar, FiDatabase, FiTag, FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import { HelperTable, type HelperTableColumn } from '../../helper/HelperTable';
import { toast } from '@/pages/owner_manage/utils/toast';
import { useConfirm } from '@/components/ConfirmProvider';
import { stockManagementService } from '@/api/owner/stockManagement';
import '@/pages/owner_manage/style/font.css';

interface StockFifoBatchesProps {
  items: MenuItem[];
  loading: boolean;
  onUpdateStock: (variantId: number, qty: number, threshold: number | null, purchasePrice?: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

interface BatchRow {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  variantId: number;
  sku: string;
  attributes: string;
  createdAt: string;
  initialQty: number;
  remainingQty: number;
  purchasePrice: number;
  capitalValue: number;
  lowStockThreshold: number | null;
  currentStockQty: number;
}

export const StockFifoBatches: React.FC<StockFifoBatchesProps> = ({
  items,
  loading,
  onUpdateStock,
  onRefresh,
}) => {
  const confirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'consumed'>('all');
  
  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [importQty, setImportQty] = useState<number>(10);
  const [importCost, setImportCost] = useState<number>(5.00);
  const [importing, setImporting] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchRow | null>(null);
  const [editInitialQty, setEditInitialQty] = useState<number>(0);
  const [editRemainingQty, setEditRemainingQty] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Gather all variants for dropdown select
  const allVariants: Array<{
    variantId: number;
    displayName: string;
    currentStock: number;
    threshold: number | null;
  }> = [];

  items.forEach(item => {
    const vars = item.variants || [];
    vars.forEach(v => {
      const attrString = v.attribute_values && v.attribute_values.length > 0
        ? ' (' + v.attribute_values.map((av: any) => av.value?.includes('|') ? av.value.split('|')[0] : av.value).join(', ') + ')'
        : '';
      allVariants.push({
        variantId: v.id!,
        displayName: `${item.name}${attrString} - SKU: ${v.variant_sku}`,
        currentStock: v.stock_qty,
        threshold: v.low_stock_threshold,
      });
    });
  });

  // Flatten all batches
  const batchRows: BatchRow[] = [];
  items.forEach(item => {
    const vars = item.variants || [];
    vars.forEach(v => {
      const attrString = v.attribute_values && v.attribute_values.length > 0
        ? v.attribute_values.map((av: any) => av.value?.includes('|') ? av.value.split('|')[0] : av.value).join(', ')
        : 'Default';

      const batches = v.stock_batches || [];
      batches.forEach((batch: any) => {
        const initialQty = parseInt(batch.initial_qty) || 0;
        const remainingQty = parseInt(batch.remaining_qty) || 0;
        const purchasePrice = parseFloat(batch.purchase_price) || 0;
        
        batchRows.push({
          id: batch.id,
          productId: item.id,
          productName: item.name,
          productImage: v.image_url || item.display_image || item.image || '',
          variantId: v.id!,
          sku: v.variant_sku,
          attributes: attrString,
          createdAt: batch.created_at,
          initialQty,
          remainingQty,
          purchasePrice,
          capitalValue: remainingQty * purchasePrice,
          lowStockThreshold: v.low_stock_threshold,
          currentStockQty: v.stock_qty,
        });
      });
    });
  });

  // Filter batch rows
  const filteredRows = batchRows.filter(row => {
    const matchesSearch =
      row.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.sku.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'active' && row.remainingQty <= 0) return false;
    if (statusFilter === 'consumed' && row.remainingQty > 0) return false;

    return true;
  });

  // Sort batches by creation date descending (newest imports first)
  filteredRows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Paginated rows
  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

  const handleOpenImport = () => {
    if (allVariants.length > 0) {
      setSelectedVariantId(allVariants[0].variantId);
    }
    setImportQty(10);
    setImportCost(5.00);
    setIsImportOpen(true);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      toast.error('Please select a product variant.');
      return;
    }
    if (importQty <= 0) {
      toast.error('Quantity must be greater than 0.');
      return;
    }
    if (importCost < 0) {
      toast.error('Cost price cannot be negative.');
      return;
    }

    const selectedVar = allVariants.find(v => v.variantId === selectedVariantId);
    if (!selectedVar) return;

    try {
      setImporting(true);
      // New stock quantity = current stock + imported quantity
      const newStockQty = selectedVar.currentStock + importQty;
      await onUpdateStock(selectedVariantId, newStockQty, selectedVar.threshold, importCost);
      await onRefresh();
      setIsImportOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleOpenEdit = (row: BatchRow) => {
    setEditingBatch(row);
    setEditInitialQty(row.initialQty);
    setEditRemainingQty(row.remainingQty);
    setEditCost(row.purchasePrice);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    if (editInitialQty < 0) {
      toast.error('Initial quantity cannot be negative.');
      return;
    }
    if (editRemainingQty < 0) {
      toast.error('Remaining quantity cannot be negative.');
      return;
    }
    if (editRemainingQty > editInitialQty) {
      toast.error('Remaining quantity cannot exceed initial quantity.');
      return;
    }
    if (editCost < 0) {
      toast.error('Cost price cannot be negative.');
      return;
    }

    try {
      setSaving(true);
      await stockManagementService.updateStockBatch(editingBatch.id, {
        initial_qty: editInitialQty,
        remaining_qty: editRemainingQty,
        purchase_price: editCost
      });
      toast.success('Stock batch updated successfully!');
      await onRefresh();
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stock batch.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async (row: BatchRow) => {
    const confirmed = await confirm({
      title: 'លុបបាច់ទំនិញ (Delete Stock Batch)',
      message: `តើអ្នកពិតជាចង់លុបបាច់ទំនិញរបស់ "${row.productName}" នេះមែនទេ? ស្តុករបស់ Variant នឹងត្រូវកាត់បន្ថយចំនួន ${row.remainingQty} គ្រឿងដោយស្វ័យប្រវត្ត។`,
      confirmText: 'Confirm Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await stockManagementService.deleteStockBatch(row.id);
        toast.success('Stock batch deleted successfully!');
        await onRefresh();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete stock batch.');
      }
    }
  };

  const columns: HelperTableColumn[] = [
    { key: 'sl', label: 'SL', align: 'center', className: 'w-12 text-slate-400 font-bold' },
    { key: 'details', label: 'Product Details' },
    { key: 'sku', label: 'SKU' },
    { key: 'date', label: 'Import Date' },
    { key: 'cost', label: 'Cost Price', align: 'right' },
    { key: 'qty', label: 'Remaining Stock', align: 'center' },
    { key: 'value', label: 'Capital Value', align: 'right' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'center' }
  ];

  const renderRow = (row: BatchRow, idx: number) => {
    const sl = indexOfFirstItem + idx + 1;
    const isBatchConsumed = row.remainingQty <= 0;

    return (
      <tr key={row.id} className="hover:bg-slate-50/20 transition-colors">
        <td className="py-3.5 px-5 text-center text-[12px] font-bold text-slate-400">{sl}</td>
        <td className="py-3.5 px-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[5px] overflow-hidden bg-slate-50 border border-slate-150 shrink-0">
              <img
                src={resolveImageUrl(row.productImage)}
                alt={row.productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                }}
              />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-800 leading-tight">{row.productName}</div>
              <span className="px-1.5 py-0.5 rounded-[3px] bg-slate-100 text-slate-500 text-[9px] font-bold border border-slate-200 mt-1 inline-block">
                Option: {row.attributes}
              </span>
            </div>
          </div>
        </td>
        <td className="py-3.5 px-5 text-[11px] font-bold text-slate-500">{row.sku}</td>
        <td className="py-3.5 px-5 text-[11px] font-bold text-slate-450">
          <div className="flex items-center gap-1.5">
            <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {new Date(row.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </td>
        <td className="py-3.5 px-5 text-right text-xs font-black text-slate-850">
          ${row.purchasePrice.toFixed(2)}
        </td>
        <td className="py-3.5 px-5 text-center">
          <div className="flex flex-col items-center">
            <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black ${
              isBatchConsumed
                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                : 'bg-orange-50 text-orange-650 border border-orange-100'
            }`}>
              {row.remainingQty} / {row.initialQty}
            </span>
          </div>
        </td>
        <td className="py-3.5 px-5 text-right text-xs font-black text-slate-900">
          ${row.capitalValue.toFixed(2)}
        </td>
        <td className="py-3.5 px-5 text-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${
            isBatchConsumed
              ? 'bg-slate-100 text-slate-400'
              : row.remainingQty < row.initialQty
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
          }`}>
            {isBatchConsumed ? 'Consumed' : row.remainingQty < row.initialQty ? 'Partial' : 'Active'}
          </span>
        </td>
        <td className="py-3.5 px-5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-[5px] cursor-pointer shadow-3xs transition-all active:scale-95 flex items-center justify-center"
              title="Edit Batch"
            >
              <FiEdit className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteBatch(row)}
              className="p-1.5 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-[5px] cursor-pointer shadow-3xs transition-all active:scale-95 flex items-center justify-center"
              title="Delete Batch"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      {/* Tabs / Filter states - System & Website Settings Style */}
      <div className="flex border-b border-slate-200 overflow-x-auto pb-px gap-6 no-scrollbar select-none">
        <button
          onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          className={`flex items-center gap-2 pb-3.5 text-xs font-black uppercase tracking-wider cursor-pointer border-none bg-transparent whitespace-nowrap transition-all duration-200 outline-none ${
            statusFilter === 'all'
              ? 'text-[#0f53a1] border-b-2 border-[#0f53a1]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>All Batches</span>
        </button>

        <button
          onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
          className={`flex items-center gap-2 pb-3.5 text-xs font-black uppercase tracking-wider cursor-pointer border-none bg-transparent whitespace-nowrap transition-all duration-200 outline-none ${
            statusFilter === 'active'
              ? 'text-[#0f53a1] border-b-2 border-[#0f53a1]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Active Batches</span>
        </button>

        <button
          onClick={() => { setStatusFilter('consumed'); setCurrentPage(1); }}
          className={`flex items-center gap-2 pb-3.5 text-xs font-black uppercase tracking-wider cursor-pointer border-none bg-transparent whitespace-nowrap transition-all duration-200 outline-none ${
            statusFilter === 'consumed'
              ? 'text-[#0f53a1] border-b-2 border-[#0f53a1]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Consumed Batches</span>
        </button>
      </div>

      <HelperTable<BatchRow>
        columns={columns}
        data={currentRows}
        loading={loading}
        title="FIFO Stock Batches"
        count={totalItems}
        searchPlaceholder="Search products or SKUs..."
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        addButton={{
          label: 'Import New Batch',
          onClick: handleOpenImport,
        }}
        renderRow={renderRow}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
        emptyStateText="No stock batches found"
        emptyStateSubtext="Try adjusting your filters or import a new batch."
      />

      {/* Import Modal */}
      {isImportOpen && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 animate-fade-in">
          {/* Close click area */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsImportOpen(false)}></div>

          {/* Modal Container */}
          <div className="w-full max-w-lg bg-white rounded-[5px] p-6 sm:p-8 relative z-10 border border-slate-100 shadow-2xl animate-slide-up text-left">
            <button
              onClick={() => setIsImportOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[5px] p-2 transition-all cursor-pointer border border-transparent flex items-center justify-center"
            >
              <FiX className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <FiPlus className="text-[#0f53a1] w-5 h-5 shrink-0" />
                <span>នាំចូលបាច់ទំនិញថ្មី (Import New Batch)</span>
              </h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                ជ្រើសរើស Variant និងបញ្ចូលបរិមាណដើម្បីបន្ថែមបាច់ទំនិញថ្មី។
              </p>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  ជ្រើសរើសទំនិញ (Select Product Variant) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedVariantId || ''}
                  onChange={(e) => setSelectedVariantId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f53a1]/20 focus:border-[#0f53a1] font-medium text-slate-800 bg-white"
                  required
                >
                  {allVariants.map(v => (
                    <option key={v.variantId} value={v.variantId}>
                      {v.displayName} (Current Stock: {v.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                    ចំនួននាំចូល (Quantity) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={importQty}
                    onChange={(e) => setImportQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f53a1]/20 focus:border-[#0f53a1] font-medium text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                    តម្លៃដើមទិញ ($ Cost) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={importCost}
                    onChange={(e) => setImportCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f53a1]/20 focus:border-[#0f53a1] font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#0f53a1]/5 border border-[#0f53a1]/15 rounded-[5px] p-3 text-[11px] text-[#0f53a1] leading-relaxed font-semibold">
                ⚠️ **ចំណាំ៖** ការនាំចូលនេះនឹងបន្ថែមបរិមាណស្តុក `{importQty}` គ្រឿងទៅលើស្តុកសរុបបច្ចុប្បន្នរបស់ Variant និងបង្កើតបាច់ទំនិញថ្មីដែលមានតម្លៃដើម `{importCost.toFixed(2)}$` សម្រាប់ប្រើប្រាស់កាត់ស្តុក FIFO។
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => setIsImportOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-sm font-bold transition-all border border-slate-200/50 cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="flex-1 py-2.5 px-4 bg-[#0f53a1] hover:bg-[#0b4789] text-white rounded-[5px] text-sm font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 border-none"
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Import</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {isEditOpen && editingBatch && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 animate-fade-in">
          {/* Close click area */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsEditOpen(false)}></div>

          {/* Modal Container */}
          <div className="w-full max-w-lg bg-white rounded-[5px] p-6 sm:p-8 relative z-10 border border-slate-100 shadow-2xl animate-slide-up text-left">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[5px] p-2 transition-all cursor-pointer border border-transparent flex items-center justify-center"
            >
              <FiX className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <FiEdit className="text-[#0f53a1] w-5 h-5 shrink-0" />
                <span>កែប្រែបាច់ទំនិញ (Edit Stock Batch)</span>
              </h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {editingBatch.productName} (SKU: {editingBatch.sku} | Option: {editingBatch.attributes})
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                    ចំនួនដើមនាំចូល (Initial Qty) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editInitialQty}
                    onChange={(e) => setEditInitialQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f53a1]/20 focus:border-[#0f53a1] font-medium text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                    ចំនួននៅសល់ (Remaining Qty) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editInitialQty}
                    value={editRemainingQty}
                    onChange={(e) => setEditRemainingQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f53a1]/20 focus:border-[#0f53a1] font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">
                  តម្លៃដើមទិញ ($ Cost) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editCost}
                  onChange={(e) => setEditCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f53a1]/20 focus:border-[#0f53a1] font-medium text-slate-800"
                  required
                />
              </div>

              <div className="bg-[#0f53a1]/5 border border-[#0f53a1]/15 rounded-[5px] p-3 text-[11px] text-[#0f53a1] leading-relaxed font-semibold">
                ⚠️ **ចំណាំ៖** ការផ្លាស់ប្តូរចំនួននៅសល់ (Remaining Qty) នឹងកែប្រែចំនួនស្តុកសរុបរបស់ Variant នេះនៅលើប្រព័ន្ធដោយស្វ័យប្រវត្ត។
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-sm font-bold transition-all border border-slate-200/50 cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 bg-[#0f53a1] hover:bg-[#0b4789] text-white rounded-[5px] text-sm font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 border-none"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
