import React, { useState, useEffect } from 'react';
import { FiBox, FiLayers, FiAlertTriangle, FiActivity, FiSliders } from 'react-icons/fi';
import { stockManagementService } from '@/api/owner/stockManagement';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { toast } from '@/pages/owner_manage/utils/toast';
import { StockOverview } from './StockOverview';
import { StockItems } from './StockItems';
import { StockLowAlerts } from './StockLowAlerts';
import { StockFifoBatches } from './StockFifoBatches';
import { HelperFilter, type FilterSection } from '../../helper/HelperFilter';
import '@/pages/owner_manage/style/font.css';

interface StockManagementProps {
  defaultView?: 'overview' | 'items' | 'low' | 'movements' | 'fifo';
  ownerId?: number | string;
  storeId?: number;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  defaultView = 'overview',
  ownerId,
  storeId,
}) => {
  const [view, setView] = useState<'overview' | 'items' | 'low' | 'movements' | 'fifo'>(defaultView);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({
    status: 'all',
    price: 'all'
  });
  const [tempFilters, setTempFilters] = useState<Record<string, any>>({
    status: 'all',
    price: 'all'
  });

  const filterSections: FilterSection[] = [
    {
      id: 'status',
      title: 'Stock Status (ស្ថានភាពស្តុក)',
      type: 'radio',
      options: [
        { id: 'all', label: 'All Inventory (ស្តុកទាំងអស់)' },
        { id: 'instock', label: 'In Stock (មានក្នុងស្តុក)' },
        { id: 'low', label: 'Low Stock (ស្តុកទាប)' },
        { id: 'out', label: 'Out of Stock (ដាច់ស្តុក)' }
      ]
    },
    {
      id: 'price',
      title: 'Retail Price (តម្លៃលក់រាយ)',
      type: 'radio',
      options: [
        { id: 'all', label: 'Any Price (គ្រប់តម្លៃ)' },
        { id: 'under_10', label: 'Under $10 (ក្រោម $10)' },
        { id: '10_to_50', label: '$10 to $50 ($10 ដល់ $50)' },
        { id: 'over_50', label: 'Over $50 (លើសពី $50)' }
      ]
    }
  ];

  // Sync state if prop changes (e.g. sidebar navigation clicks)
  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await stockManagementService.getStockItems(ownerId, storeId);
      setItems(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [ownerId, storeId]);

  const handleUpdateStock = async (variantId: number, qty: number, threshold: number | null, purchasePrice?: number) => {
    try {
      const payload: any = {
        stock_qty: qty,
        purchase_price: purchasePrice
      };
      if (threshold !== null && threshold !== undefined) {
        payload.low_stock_threshold = threshold;
      }
      await stockManagementService.updateVariantStock(variantId, payload);
      toast.success('Stock level updated successfully!');
      
      // Update local state instead of full refetch to be ultra smooth
      setItems(prevItems => 
        prevItems.map(item => {
          if (item.variants && item.variants.some(v => v.id === variantId)) {
            return {
              ...item,
              variants: item.variants.map(v => 
                v.id === variantId 
                  ? { 
                      ...v, 
                      stock_qty: qty, 
                      low_stock_threshold: threshold,
                      ...(purchasePrice !== undefined ? { purchase_price: String(purchasePrice) } : {})
                    }
                  : v
              )
            };
          }
          return item;
        })
      );

      // Dispatch global events for other components (e.g. POS)
      window.dispatchEvent(new CustomEvent('data_updated'));
      const channel = new BroadcastChannel('data_updates');
      channel.postMessage('refresh');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stock level.');
      throw err;
    }
  };

  const handleQuickRestock = (variant: ProductVariant, productName: string) => {
    // Focus view onto "Stock Items" list
    setView('items');
    toast.info(`Restocking "${productName}" - please adjust values using the inline editor below.`);
  };

  const handleFilterChange = (key: string, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const cleared = { status: 'all', price: 'all' };
    setTempFilters(cleared);
    setFilters(cleared);
    setShowFilters(false);
  };

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy w-full text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <FiBox className="text-orange-500 w-6 h-6 shrink-0" />
            <span>គ្រប់គ្រងស្តុក (Stock Management)</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            តាមដាន កែប្រែបរិមាណ និងវិភាគស្ថិតិស្តុកទំនិញទាំងអស់របស់ហាងអ្នកឱ្យមានប្រសិទ្ធភាព។
          </p>
        </div>
      </div>

      {/* Render subcomponents based on selected view */}
      {view === 'overview' && (
        <StockOverview
          items={items}
          onQuickRestock={handleQuickRestock}
          onNavigateToTab={(tab) => {
            const sidebarTabs: Record<string, string> = {
              overview: 'stock-overview',
              items: 'stock-items',
              low: 'stock-low',
              movements: 'stock-movements',
              fifo: 'stock-fifo'
            };
            const targetTab = sidebarTabs[tab];
            if (targetTab) {
              window.dispatchEvent(new CustomEvent('change_admin_tab', { detail: targetTab }));
            }
          }}
        />
      )}

      {view === 'items' && (
        <StockItems
          items={items}
          onUpdateStock={handleUpdateStock}
          loading={loading}
          filters={filters}
          onFilterChange={(key, value) => {
            setFilters(prev => ({ ...prev, [key]: value }));
            setTempFilters(prev => ({ ...prev, [key]: value }));
          }}
          onFilterClick={() => setShowFilters(true)}
        />
      )}

      {view === 'low' && (
        <StockLowAlerts
          items={items}
          onUpdateStock={handleUpdateStock}
          loading={loading}
        />
      )}

      {view === 'movements' && (
        <div className="bg-white border rounded-[10px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-center space-y-4 max-w-lg mx-auto mt-6">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto">
            <FiActivity className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800">Stock Movements History</h3>
            <p className="text-[11px] sm:text-[12px] text-slate-500 font-semibold leading-relaxed">
              This panel will list detailed histories of stock ins, sales deductions, quick updates, and waste tracking logs.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
              Coming Soon
            </span>
          </div>
        </div>
      )}


      {view === 'fifo' && (
        <StockFifoBatches
          items={items}
          loading={loading}
          onUpdateStock={handleUpdateStock}
          onRefresh={fetchItems}
        />
      )}

      <HelperFilter
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        sections={filterSections}
        selectedValues={tempFilters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
      />
    </div>
  );
};
