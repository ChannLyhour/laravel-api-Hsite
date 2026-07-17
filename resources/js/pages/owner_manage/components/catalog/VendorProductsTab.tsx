import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiEye, FiClock, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';
import { HelperTable, HelperTableColumn } from '../../helper/HelperTable';

interface VendorProductsTabProps {
  defaultSubView?: 'new' | 'update' | 'approved' | 'denied';
}

interface VendorProduct {
  id: number;
  productName: string;
  image: string;
  vendorShop: string;
  category: string;
  price: number;
  dateSubmitted: string;
  status: 'new' | 'update' | 'approved' | 'denied';
  changesDescription?: string;
}

export const VendorProductsTab: React.FC<VendorProductsTabProps> = ({ defaultSubView = 'new' }) => {
  const [subView, setSubView] = useState<'new' | 'update' | 'approved' | 'denied'>(defaultSubView);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [viewingProduct, setViewingProduct] = useState<VendorProduct | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sync with prop
  useEffect(() => {
    setSubView(defaultSubView);
  }, [defaultSubView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, subView]);

  const loadVendorProducts = () => {
    setLoading(true);
    // Seed detailed vendor product request mock data
    const mockVendorProducts: VendorProduct[] = [
      {
        id: 301,
        productName: 'Wireless Bluetooth Earbuds Pro',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=120&auto=format&fit=crop&q=60',
        vendorShop: 'TechWorld Hub Store',
        category: 'Electronics',
        price: 49.99,
        dateSubmitted: '2026-07-16 10:20 AM',
        status: 'new'
      },
      {
        id: 302,
        productName: 'Ergonomic Office Chair',
        image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=120&auto=format&fit=crop&q=60',
        vendorShop: 'Modern Living Furniture',
        category: 'Furniture',
        price: 189.00,
        dateSubmitted: '2026-07-16 02:45 PM',
        status: 'new'
      },
      {
        id: 303,
        productName: 'Organic Green Tea (Pack of 3)',
        image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=120&auto=format&fit=crop&q=60',
        vendorShop: 'Nature Herbs & Spices',
        category: 'Grocery',
        price: 15.50,
        dateSubmitted: '2026-07-15 09:00 AM',
        status: 'update',
        changesDescription: 'Price updated from $12.00 to $15.50. Stock replenished.'
      },
      {
        id: 304,
        productName: 'Ultra Protective Phone Case',
        image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=120&auto=format&fit=crop&q=60',
        vendorShop: 'Gadget Addicts Shop',
        category: 'Accessories',
        price: 9.99,
        dateSubmitted: '2026-07-15 11:30 AM',
        status: 'approved'
      },
      {
        id: 305,
        productName: 'Waterproof Running Jacket',
        image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=120&auto=format&fit=crop&q=60',
        vendorShop: 'Apex Sports Store',
        category: 'Apparel',
        price: 59.95,
        dateSubmitted: '2026-07-14 04:15 PM',
        status: 'approved'
      },
      {
        id: 306,
        productName: 'Non-stick Ceramic Frying Pan',
        image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=120&auto=format&fit=crop&q=60',
        vendorShop: 'Kitchen Goods Co.',
        category: 'Kitchenware',
        price: 34.99,
        dateSubmitted: '2026-07-13 01:10 PM',
        status: 'denied',
        changesDescription: 'Denied due to low image quality and missing specifications.'
      }
    ];
    setProducts(mockVendorProducts);
    setLoading(false);
  };

  useEffect(() => {
    loadVendorProducts();

    const channel = new BroadcastChannel('data_updates');
    const handleUpdate = () => {
      loadVendorProducts();
    };
    channel.addEventListener('message', handleUpdate);
    window.addEventListener('data_updated', handleUpdate);

    return () => {
      channel.removeEventListener('message', handleUpdate);
      channel.close();
      window.removeEventListener('data_updated', handleUpdate);
    };
  }, []);

  const handleApprove = (id: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    toast.success('Vendor product successfully approved and added to storefront!');
  };

  const handleDeny = (id: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'denied' } : p));
    toast.warn('Vendor product request declined.');
  };

  const filteredProducts = products
    .filter(p => p.status === subView)
    .filter(p =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendorShop.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getSubViewTitle = () => {
    switch (subView) {
      case 'new': return 'New Product Requests';
      case 'update': return 'Product Update Requests';
      case 'approved': return 'Approved Products';
      case 'denied': return 'Denied Products';
      default: return 'Vendor Products';
    }
  };

  const columns: HelperTableColumn[] = [
    { key: 'id', label: 'ID', className: 'w-16' },
    { key: 'product', label: 'Product Info' },
    { key: 'vendor', label: 'Vendor Shop' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'action', label: 'Action', className: 'w-36', align: 'right' }
  ];

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedData = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">{getSubViewTitle()}</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Moderation queue for products uploaded or updated by third-party storefront vendors.
          </p>
        </div>
        <button
          onClick={loadVendorProducts}
          className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-4 py-2 rounded-[10px] text-xs transition-all border-none cursor-pointer self-start"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Sub tabs Selector Row */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1.5 rounded-xl self-start inline-flex">
        {[
          { id: 'new', label: 'New Requests' },
          { id: 'update', label: 'Updates' },
          { id: 'approved', label: 'Approved' },
          { id: 'denied', label: 'Denied' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubView(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
              subView === tab.id
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 bg-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <HelperTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        title="Vendor Moderation Queue"
        count={filteredProducts.length}
        searchPlaceholder="Search vendor products/shops..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredProducts.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        emptyStateText="No products in this queue."
        renderRow={(p) => (
          <tr key={p.id}>
            <td className="text-xs font-bold text-slate-400">#{p.id}</td>
            <td>
              <div className="flex items-center gap-3">
                <img
                  src={p.image}
                  alt={p.productName}
                  className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100"
                />
                <div>
                  <p className="text-xs font-extrabold text-slate-700 leading-snug">{p.productName}</p>
                  {p.changesDescription && (
                    <p className="text-[9px] text-amber-600 font-extrabold mt-0.5 max-w-xs truncate">
                      Change: {p.changesDescription}
                    </p>
                  )}
                </div>
              </div>
            </td>
            <td className="text-xs font-extrabold text-slate-600">{p.vendorShop}</td>
            <td className="text-xs font-bold text-slate-500">{p.category}</td>
            <td className="text-xs font-black text-slate-700">${p.price.toFixed(2)}</td>
            <td className="text-xs text-slate-400 font-semibold">{p.dateSubmitted}</td>
            <td className="text-right">
              {p.status === 'new' || p.status === 'update' ? (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                    title="Approve Product"
                  >
                    <FiCheckCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeny(p.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                    title="Reject Product"
                  >
                    <FiXCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewingProduct(p)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                    title="View Details"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className={`px-2 py-0.5 rounded-[5px] text-3xs font-black uppercase tracking-wider ${
                  p.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {p.status}
                </span>
              )}
            </td>
          </tr>
        )}
      />

      {/* Review Details Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-kuntomruy">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-fade-in text-left">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">Review Vendor Product Request</h3>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <img
                  src={viewingProduct.image}
                  alt={viewingProduct.productName}
                  className="w-24 h-24 rounded-xl object-cover border border-slate-100"
                />
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-3xs font-black uppercase rounded-[5px]">
                    {viewingProduct.category}
                  </span>
                  <h4 className="text-sm font-black text-slate-800">{viewingProduct.productName}</h4>
                  <p className="text-xs text-slate-400 font-bold">Uploaded by: {viewingProduct.vendorShop}</p>
                  <p className="text-sm font-black text-indigo-600 mt-1">${viewingProduct.price.toFixed(2)}</p>
                </div>
              </div>

              {viewingProduct.changesDescription && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Submitted Changes:</span>
                  <p className="text-xs text-amber-700 font-bold mt-1 leading-relaxed">{viewingProduct.changesDescription}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    handleDeny(viewingProduct.id);
                    setViewingProduct(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs border-none cursor-pointer"
                >
                  Reject & Close
                </button>
                <button
                  onClick={() => {
                    handleApprove(viewingProduct.id);
                    setViewingProduct(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs border-none cursor-pointer"
                >
                  Approve Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
