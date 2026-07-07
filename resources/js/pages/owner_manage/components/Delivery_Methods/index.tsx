import React, { useEffect, useState } from 'react';
import { deliveryMethodsService, type DeliveryMethod } from '@/api/owner/deliveryMethods';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
  FiTruck, FiTrash2, FiEdit2,
  FiInfo, FiCalendar, FiDollarSign, FiClock
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';
import { HelperTable } from '../../helper/HelperTable';
import type { HelperTableColumn } from '../../helper/HelperTable';
import { resolveImageUrl } from '@/api/imageUtils';
import { useTranslation } from '../../lang/i18n';

// Import subcomponents
import { DeliveryMethodCreatePage } from './create';
import { DeliveryMethodEditPage } from './edit';
import { DeliveryMethodShowPage } from './show';

export const DeliveryMethodsTab: React.FC = () => {
  const { t } = useTranslation();
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('itemsPerPage_delivery_methods');
    return saved ? parseInt(saved, 10) : 10;
  });

  // Navigation View State
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'show'>('list');
  const [selectedMethodForEdit, setSelectedMethodForEdit] = useState<DeliveryMethod | null>(null);
  const [selectedMethodForShow, setSelectedMethodForShow] = useState<DeliveryMethod | null>(null);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryMethodsService.getMyDeliveryMethods();
      setMethods(data || []);
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        setError(err.details.message);
      } else {
        setError('Failed to fetch delivery methods. Please check database connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredMethods = methods.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.code?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q)
    );
  });

  const handleOpenCreatePage = () => {
    setView('create');
  };

  const handleOpenEditPage = (method: DeliveryMethod) => {
    setSelectedMethodForEdit(method);
    setView('edit');
  };

  const handleOpenShowPage = (method: DeliveryMethod) => {
    setSelectedMethodForShow(method);
    setView('show');
  };

  const handleCreateSuccess = (newMethod: DeliveryMethod) => {
    setMethods(prev => [newMethod, ...prev]);
  };

  const handleEditSuccess = (savedMethod: DeliveryMethod) => {
    setMethods(prev => prev.map(m => m.id === savedMethod.id ? { ...m, ...savedMethod } : m));
  };

  const handleDelete = async (method: DeliveryMethod) => {
    if (!window.confirm(`Are you sure you want to delete "${method.name}"? This action cannot be undone.`)) return;
    try {
      await deliveryMethodsService.deleteDeliveryMethod(method.id);
      setMethods(prev => prev.filter(m => m.id !== method.id));
      toast.success(`Delivery method "${method.name}" deleted.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete delivery method.');
    }
  };

  const handleToggleActive = async (method: DeliveryMethod) => {
    try {
      const updated = await deliveryMethodsService.toggleDeliveryMethod(method.id);
      setMethods(prev => prev.map(m => m.id === method.id ? { ...m, is_active: updated.is_active } : m));
      toast.success(`Status updated for "${method.name}".`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  // Pagination calculations
  const totalItems = filteredMethods.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMethods = filteredMethods.slice(indexOfFirstItem, indexOfLastItem);

  const columns: HelperTableColumn[] = [
    { key: 'sl', label: t('categories.sl'), align: 'left', className: 'w-16' },
    { key: 'name', label: t('delivery_methods.name_col'), align: 'left' },
    { key: 'cost', label: t('delivery_methods.cost_col'), align: 'left' },
    { key: 'estimates', label: t('delivery_methods.estimates_col'), align: 'left', className: 'hidden md:table-cell' },
    { key: 'status', label: t('delivery_methods.status_col'), align: 'center' },
    { key: 'action', label: t('delivery_methods.action_col'), align: 'right', className: 'text-right' }
  ];

  if (view === 'create') {
    return (
      <DeliveryMethodCreatePage
        onClose={() => setView('list')}
        onSave={handleCreateSuccess}
      />
    );
  }

  if (view === 'edit' && selectedMethodForEdit) {
    return (
      <DeliveryMethodEditPage
        onClose={() => {
          setView('list');
          setSelectedMethodForEdit(null);
        }}
        method={selectedMethodForEdit}
        onSave={handleEditSuccess}
      />
    );
  }

  if (view === 'show' && selectedMethodForShow) {
    return (
      <DeliveryMethodShowPage
        onClose={() => {
          setView('list');
          setSelectedMethodForShow(null);
        }}
        method={selectedMethodForShow}
        onEdit={(method) => {
          setSelectedMethodForEdit(method);
          setView('edit');
        }}
      />
    );
  }

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <span>{t('delivery_methods.title')}</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {t('delivery_methods.subtitle')}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-5 bg-rose-50 border border-rose-100 rounded-[5px] flex items-start space-x-3 text-rose-800 text-xs animate-slide-up">
          <FiInfo className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="font-semibold leading-relaxed">{error}</div>
        </div>
      )}

      {/* Helper Table */}
      {!error && (
        <HelperTable<DeliveryMethod>
          columns={columns}
          data={currentMethods}
          loading={loading}
          title={t('delivery_methods.table_title')}
          count={totalItems}
          searchPlaceholder={t('delivery_methods.search_placeholder')}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          getRowId={(item) => item.id}
          bulkActions={[
            {
              label: 'Bulk Delete',
              className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-250 hover:border-rose-350',
              onClick: async (ids) => {
                if (!window.confirm(`Are you sure you want to delete the ${ids.length} selected delivery methods? This action cannot be undone.`)) return;
                try {
                  await Promise.all(ids.map(id => deliveryMethodsService.deleteDeliveryMethod(id)));
                  setMethods(prev => prev.filter(m => !ids.includes(m.id)));
                  setSelectedIds([]);
                  toast.success('Successfully deleted selected delivery methods!');
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to delete some delivery methods.');
                }
              }
            }
          ]}
          addButton={{
            label: t('delivery_methods.add_method'),
            onClick: handleOpenCreatePage,
          }}
          renderRow={(method, idx) => {
            const sl = indexOfFirstItem + idx + 1;
            const logoUrl = method.image ? resolveImageUrl(method.image) : null;
            return (
              <tr key={method.id} className="hover:bg-slate-50/40 transition-colors">
                <td className="py-3.5 px-5 text-left font-bold text-slate-800">{sl}</td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[5px] overflow-hidden bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={method.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className="w-full h-full flex items-center justify-center" style={{ display: logoUrl ? 'none' : 'flex' }}>
                        <FiTruck className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">{method.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {method.code}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-left">
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600">
                    <FiDollarSign className="w-3.5 h-3.5 shrink-0" />
                    <span>${parseFloat(String(method.cost)).toFixed(2)}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 hidden md:table-cell">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <FiClock className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                    <span>{method.estimated_days_min} - {method.estimated_days_max} {t('delivery_methods.days')}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-center">
                  <button
                    onClick={() => handleToggleActive(method)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-[5px] text-[10px] uppercase tracking-wider font-extrabold cursor-pointer border transition-colors select-none ${
                      method.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50'
                        : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100/50'
                    }`}
                  >
                    {method.is_active ? t('delivery_methods.active') : t('delivery_methods.disabled')}
                  </button>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => handleOpenShowPage(method)}
                      className="w-8 h-8 border border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer bg-transparent"
                      title="View details"
                    >
                      <FiInfo className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditPage(method)}
                      className="w-8 h-8 border border-blue-500/50 text-blue-500 hover:bg-blue-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer bg-transparent"
                      title="Edit method"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(method)}
                      className="w-8 h-8 border border-red-500/50 text-red-500 hover:bg-red-50 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer bg-transparent"
                      title="Delete method"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            localStorage.setItem('itemsPerPage_delivery_methods', size.toString());
            setCurrentPage(1);
          }}
          emptyStateText="No Records Found"
          emptyStateSubtext="Try adjusting search or filter criteria to view records."
        />
      )}
    </div>
  );
};
