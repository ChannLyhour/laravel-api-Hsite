import React, { useEffect, useState } from 'react';
import { deliveryZonesService, type DeliveryZone } from '@/api/owner/deliveryZones';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
  FiMapPin, FiTrash2, FiEdit2,
  FiInfo, FiCalendar, FiDollarSign, FiClock
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';
import { HelperTable } from '../../helper/HelperTable';
import type { HelperTableColumn } from '../../helper/HelperTable';

// Import subcomponents
import { DeliveryZoneCreatePage } from './create';
import { DeliveryZoneEditPage } from './edit';
import { DeliveryZoneShowPage } from './show';

export const DeliveryZonesTab: React.FC = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('itemsPerPage_delivery_zones');
    return saved ? parseInt(saved, 10) : 10;
  });

  // Navigation View State
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'show'>('list');
  const [selectedZoneForEdit, setSelectedZoneForEdit] = useState<DeliveryZone | null>(null);
  const [selectedZoneForShow, setSelectedZoneForShow] = useState<DeliveryZone | null>(null);

  const fetchZones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryZonesService.getMyDeliveryZones();
      setZones(data || []);
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        setError(err.details.message);
      } else {
        setError('Failed to fetch delivery zones. Please check database connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredZones = zones.filter(z => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      z.name?.toLowerCase().includes(q) ||
      z.code?.toLowerCase().includes(q) ||
      z.description?.toLowerCase().includes(q)
    );
  });

  const handleOpenCreatePage = () => {
    setView('create');
  };

  const handleOpenEditPage = (zone: DeliveryZone) => {
    setSelectedZoneForEdit(zone);
    setView('edit');
  };

  const handleOpenShowPage = (zone: DeliveryZone) => {
    setSelectedZoneForShow(zone);
    setView('show');
  };

  const handleCreateSuccess = (newZone: DeliveryZone) => {
    setZones(prev => [newZone, ...prev]);
  };

  const handleEditSuccess = (savedZone: DeliveryZone) => {
    setZones(prev => prev.map(z => z.id === savedZone.id ? { ...z, ...savedZone } : z));
  };

  const handleDelete = async (zone: DeliveryZone) => {
    if (!window.confirm(`Are you sure you want to delete "${zone.name}"? This action cannot be undone.`)) return;
    try {
      await deliveryZonesService.deleteDeliveryZone(zone.id);
      setZones(prev => prev.filter(z => z.id !== zone.id));
      toast.success(`Delivery zone "${zone.name}" deleted.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete delivery zone.');
    }
  };

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      const updated = await deliveryZonesService.toggleDeliveryZone(zone.id);
      setZones(prev => prev.map(z => z.id === zone.id ? { ...z, is_active: updated.is_active } : z));
      toast.success(`Status updated for "${zone.name}".`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  // Pagination calculations
  const totalItems = filteredZones.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentZones = filteredZones.slice(indexOfFirstItem, indexOfLastItem);

  const columns: HelperTableColumn[] = [
    { key: 'sl', label: 'SL', align: 'left', className: 'w-16' },
    { key: 'name', label: 'Delivery Zone', align: 'left' },
    { key: 'delivery_fee', label: 'Delivery Fee', align: 'left' },
    { key: 'estimates', label: 'Timeline', align: 'left', className: 'hidden md:table-cell' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'action', label: 'Action', align: 'right', className: 'text-right' }
  ];

  if (view === 'create') {
    return (
      <DeliveryZoneCreatePage
        onClose={() => setView('list')}
        onSave={handleCreateSuccess}
      />
    );
  }

  if (view === 'edit' && selectedZoneForEdit) {
    return (
      <DeliveryZoneEditPage
        onClose={() => {
          setView('list');
          setSelectedZoneForEdit(null);
        }}
        zone={selectedZoneForEdit}
        onSave={handleEditSuccess}
      />
    );
  }

  if (view === 'show' && selectedZoneForShow) {
    return (
      <DeliveryZoneShowPage
        onClose={() => {
          setView('list');
          setSelectedZoneForShow(null);
        }}
        zone={selectedZoneForShow}
        onEdit={(zone) => {
          setSelectedZoneForEdit(zone);
          setView('edit');
        }}
      />
    );
  }

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <FiMapPin className="text-primary" />
            <span>Delivery Zones Setup</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Configure regional delivery zones and customize pricing schedules.
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
        <HelperTable<DeliveryZone>
          columns={columns}
          data={currentZones}
          loading={loading}
          title="Delivery Zones"
          count={totalItems}
          searchPlaceholder="Search by zone name, code, description..."
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
                if (!window.confirm(`Are you sure you want to delete the ${ids.length} selected delivery zones? This action cannot be undone.`)) return;
                try {
                  await Promise.all(ids.map(id => deliveryZonesService.deleteDeliveryZone(id)));
                  setZones(prev => prev.filter(z => !ids.includes(z.id)));
                  setSelectedIds([]);
                  toast.success('Successfully deleted selected delivery zones!');
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to delete some delivery zones.');
                }
              }
            }
          ]}
          addButton={{
            label: 'Add Zone',
            onClick: handleOpenCreatePage,
          }}
          renderRow={(zone, idx) => {
            const sl = indexOfFirstItem + idx + 1;
            return (
              <tr key={zone.id} className="hover:bg-slate-50/40 transition-colors">
                <td className="py-3.5 px-5 text-left font-bold text-slate-800">{sl}</td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center font-black text-sm shadow-3xs shrink-0">
                      <FiMapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">{zone.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {zone.code}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-left">
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600">
                    <FiDollarSign className="w-3.5 h-3.5 shrink-0" />
                    <span>${parseFloat(String(zone.delivery_fee)).toFixed(2)}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 hidden md:table-cell">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <FiClock className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                    <span>{zone.estimated_delivery_time || '—'}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-center">
                  <button
                    onClick={() => handleToggleActive(zone)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer border transition-colors select-none ${
                      zone.is_active
                        ? 'bg-emerald-50 text-emerald-650 border-emerald-100 hover:bg-emerald-100/50'
                        : 'bg-rose-50 text-rose-650 border-rose-100 hover:bg-rose-100/50'
                    }`}
                  >
                    {zone.is_active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => handleOpenShowPage(zone)}
                      className="w-8 h-8 border border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-transparent"
                      title="View details"
                    >
                      <FiInfo className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditPage(zone)}
                      className="w-8 h-8 border border-blue-500/50 text-blue-500 hover:bg-blue-50 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-transparent"
                      title="Edit zone"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone)}
                      className="w-8 h-8 border border-red-500/50 text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-transparent"
                      title="Delete zone"
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
            localStorage.setItem('itemsPerPage_delivery_zones', size.toString());
            setCurrentPage(1);
          }}
          emptyStateText="No Records Found"
          emptyStateSubtext="Try adjusting search or filter criteria to view records."
        />
      )}
    </div>
  );
};
