import React, { useEffect, useState } from 'react';
import { client, ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
  FiStar, FiInfo, FiUser, FiPackage
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';
import { HelperTable } from '../helper/HelperTable';
import type { HelperTableColumn } from '../helper/HelperTable';

interface ProductRating {
  id: number;
  product_id: number;
  customer_id: number;
  order_id: number;
  rating: number;
  comment: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  product?: {
    id: number;
    name: string;
    display_image?: string;
  };
}

interface CustomerReviewsTabProps {
  ownerId?: number | string;
}

export const CustomerReviewsTab: React.FC<CustomerReviewsTabProps> = ({ ownerId }) => {
  const [reviews, setReviews] = useState<ProductRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('itemsPerPage_reviews');
    return saved ? parseInt(saved, 10) : 10;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all products for this owner, then aggregate their ratings
      const products = await client.get<any[]>(`/products?limit=500${ownerId ? `&created_by=${ownerId}` : ''}`);
      const allReviews: ProductRating[] = [];

      await Promise.all(
        (products || []).map(async (product) => {
          try {
            const ratings = await client.get<ProductRating[]>(`/products/${product.id}/ratings`);
            if (ratings && ratings.length > 0) {
              ratings.forEach(r => {
                allReviews.push({
                  ...r,
                  product: { id: product.id, name: product.name, display_image: product.display_image }
                });
              });
            }
          } catch {
            // Skip products with no ratings endpoint
          }
        })
      );

      // Sort by most recent first
      allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReviews(allReviews);
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        setError(err.details.message);
      } else {
        setError('Failed to fetch customer reviews.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [ownerId]);

  const filteredReviews = reviews.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.customer?.name?.toLowerCase().includes(q) ||
      r.product?.name?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <FiStar
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
          />
        ))}
      </div>
    );
  };

  // Summary stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: totalReviews > 0 ? (reviews.filter(r => r.rating === star).length / totalReviews) * 100 : 0,
  }));

  // Pagination calculations
  const totalItems = filteredReviews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);

  const columns: HelperTableColumn[] = [
    { key: 'sl', label: 'SL', align: 'left', className: 'w-16' },
    { key: 'customer', label: 'Customer', align: 'left' },
    { key: 'product', label: 'Product', align: 'left', className: 'hidden md:table-cell' },
    { key: 'rating', label: 'Rating', align: 'left' },
    { key: 'comment', label: 'Comment', align: 'left', className: 'hidden lg:table-cell' },
    { key: 'date', label: 'Date', align: 'left', className: 'hidden sm:table-cell' }
  ];

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <FiStar className="text-primary" />
            <span>Customer Reviews</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            View all product ratings and feedback submitted by your customers.
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

      {/* Summary Cards Row */}
      {!loading && !error && reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall Rating Card */}
          <div className="bg-white border border-slate-200/80 rounded-[5px] p-5 shadow-xs text-center space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Rating</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-slate-800">{avgRating}</span>
              <FiStar className="w-6 h-6 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-[11px] font-semibold text-slate-400">Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white border border-slate-200/80 rounded-[5px] p-5 shadow-xs col-span-1 md:col-span-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Rating Distribution</p>
            <div className="space-y-1.5">
              {ratingDistribution.map(d => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 w-4 text-right">{d.star}</span>
                  <FiStar className="w-3 h-3 text-amber-400 shrink-0" />
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 w-8">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Helper Table */}
      {!error && (
        <HelperTable<ProductRating>
          columns={columns}
          data={currentReviews}
          loading={loading && reviews.length === 0}
          title="Review List"
          count={totalItems}
          searchPlaceholder="Search by customer, product, or comment..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          getRowId={(item) => item.id}
          bulkActions={[
            {
              label: 'Bulk Dismiss',
              onClick: async (ids) => {
                setReviews(prev => prev.filter(r => !ids.includes(r.id)));
                setSelectedIds([]);
                toast.success(`Dismissed ${ids.length} reviews from this view!`);
              }
            }
          ]}
          renderRow={(review, idx) => {
            const sl = indexOfFirstItem + idx + 1;
            return (
              <tr key={review.id} className="hover:bg-slate-50/40 transition-colors">
                <td className="py-3.5 px-5 text-left font-bold text-slate-800">{sl}</td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                      {review.customer?.name ? review.customer.name.charAt(0).toUpperCase() : <FiUser className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-extrabold text-slate-700">{review.customer?.name || 'Anonymous'}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 hidden md:table-cell">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <FiPackage className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[160px]">{review.product?.name || `Product #${review.product_id}`}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5">
                  {renderStars(review.rating)}
                </td>
                <td className="py-3.5 px-5 hidden lg:table-cell">
                  <p className="text-[11px] font-medium text-slate-500 truncate max-w-[240px]">
                    {review.comment || <span className="text-slate-300 italic">No comment</span>}
                  </p>
                </td>
                <td className="py-3.5 px-5 hidden sm:table-cell">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {review.created_at ? formatDate(review.created_at) : '—'}
                  </span>
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
            localStorage.setItem('itemsPerPage_reviews', size.toString());
            setCurrentPage(1);
          }}
          emptyStateText="No Reviews Found"
          emptyStateSubtext="Customer reviews will appear here once customers rate your products after completing their orders."
        />
      )}

    </div>
  );
};

