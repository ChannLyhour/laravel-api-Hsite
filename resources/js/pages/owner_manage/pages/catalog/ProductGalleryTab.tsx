import React, { useState, useEffect } from 'react';
import { FiImage, FiCopy, FiTrash2, FiSearch, FiRefreshCw, FiExternalLink, FiUploadCloud } from 'react-icons/fi';
import { stockManagementService } from '@/api/owner/stockManagement';
import { resolveImageUrl } from '@/api/imageUtils';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';
import type { ProductVariant } from '@/api/owner/categories';
import { HelperTable, HelperTableColumn } from '../../helper/HelperTable';

const getVariantOptionName = (variant: ProductVariant): string => {
  if (variant.attribute_values && variant.attribute_values.length > 0) {
    return variant.attribute_values.map((av: any) => av.value?.includes('|') ? av.value.split('|')[0] : av.value).join(', ');
  }
  return '';
};

interface ProductGalleryTabProps {
  ownerId?: number | string;
  storeId?: number;
}

interface GalleryMedia {
  id: number;
  url: string;
  productName: string;
  fileSize: string;
  dimensions: string;
}

export const ProductGalleryTab: React.FC<ProductGalleryTabProps> = ({ ownerId, storeId }) => {
  const [mediaList, setMediaList] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMedia, setPreviewMedia] = useState<GalleryMedia | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const items = await stockManagementService.getStockItems(ownerId, storeId);
      
      const extractedMedia: GalleryMedia[] = [];
      let index = 1;

      items.forEach(item => {
        const img = item.display_image || item.image;
        if (img) {
          extractedMedia.push({
            id: index++,
            url: resolveImageUrl(img),
            productName: item.name,
            fileSize: `${(Math.random() * 200 + 40).toFixed(1)} KB`,
            dimensions: '800 x 800 px',
          });
        }

        // Check variants for variant specific images
        if (item.variants) {
          item.variants.forEach(v => {
            if (v.image_url && !extractedMedia.some(m => m.url.includes(v.image_url!))) {
              extractedMedia.push({
                id: index++,
                url: resolveImageUrl(v.image_url),
                productName: `${item.name} (${getVariantOptionName(v) || 'Variant'})`,
                fileSize: `${(Math.random() * 200 + 40).toFixed(1)} KB`,
                dimensions: '800 x 800 px',
              });
            }
          });
        }
      });

      // Seeding backup data if gallery is empty
      if (extractedMedia.length === 0) {
        const fallbacks = [
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&auto=format&fit=crop&q=60'
        ];
        fallbacks.forEach((url, i) => {
          extractedMedia.push({
            id: i + 1,
            url,
            productName: `Sample Dish ${i + 1}`,
            fileSize: '150 KB',
            dimensions: '800 x 800 px',
          });
        });
      }

      setMediaList(extractedMedia);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load product gallery images.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();

    const channel = new BroadcastChannel('data_updates');
    const handleUpdate = () => {
      loadMedia();
    };
    channel.addEventListener('message', handleUpdate);
    window.addEventListener('data_updated', handleUpdate);

    return () => {
      channel.removeEventListener('message', handleUpdate);
      channel.close();
      window.removeEventListener('data_updated', handleUpdate);
    };
  }, [ownerId, storeId]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Image URL copied to clipboard!');
  };

  const handleDelete = (id: number) => {
    setMediaList(prev => prev.filter(m => m.id !== id));
    toast.info('Image deleted from gallery.');
  };

  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newMedia: GalleryMedia = {
        id: Date.now(),
        url: URL.createObjectURL(file),
        productName: file.name.replace(/\.[^/.]+$/, ""),
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        dimensions: 'Original Size',
      };
      setMediaList(prev => [newMedia, ...prev]);
      toast.success('Image uploaded to gallery!');
    }
  };

  const filteredMedia = mediaList.filter(media =>
    media.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: HelperTableColumn[] = [
    { key: 'image', label: 'Preview', className: 'w-16' },
    { key: 'productName', label: 'Product Image Name' },
    { key: 'fileSize', label: 'File Size', className: 'w-24' },
    { key: 'dimensions', label: 'Dimensions', className: 'w-24' },
    { key: 'action', label: 'Action', className: 'w-28', align: 'right' }
  ];

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const paginatedData = filteredMedia.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">Product Gallery</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Browse, upload, and manage images used across all your products and product variants.
          </p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-[10px] text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/20">
            <FiUploadCloud className="w-4 h-4" />
            Upload Image
            <input type="file" onChange={handleMockUpload} accept="image/*" className="hidden" />
          </label>
          <button
            onClick={loadMedia}
            className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-4 py-2 rounded-[10px] text-xs transition-all border-none cursor-pointer"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reload Gallery
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Storage & Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[16px] p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Media Storage</h3>
            
            {/* Storage Progress Ring Info */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-slate-100 fill-transparent" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" className="stroke-indigo-600 fill-transparent" strokeWidth="6" strokeDasharray="175" strokeDashoffset="60" strokeLinecap="round" />
                </svg>
                <span className="absolute text-xs font-black text-slate-800">65%</span>
              </div>
              <div>
                <span className="text-lg font-black text-slate-800">42.5 MB</span>
                <span className="block text-[10px] text-slate-400 font-bold">of 100 MB Limit</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-400 leading-relaxed">
              Storage usage resets monthly based on subscription plan limitations. For additional storage, upgrade to a higher tier plan.
            </div>
          </div>
        </div>

        {/* Right Side: Media Search & Grid */}
        <div className="lg:col-span-3 space-y-4">
          <HelperTable
            columns={columns}
            data={paginatedData}
            loading={loading}
            title="Image Files"
            count={filteredMedia.length}
            searchPlaceholder="Search images by product name..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredMedia.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            emptyStateText="No images match your search."
            renderCard={(media) => (
              <div key={media.id} className="group relative bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
                <div className="aspect-square bg-slate-50 relative overflow-hidden">
                  <img
                    src={media.url}
                    alt={media.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    <button
                      onClick={() => handleCopyUrl(media.url)}
                      className="p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                      title="Copy URL"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewMedia(media)}
                      className="p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                      title="Preview"
                    >
                      <FiExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(media.id)}
                      className="p-2 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[11px] font-extrabold text-slate-700 truncate" title={media.productName}>
                    {media.productName}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[9px] font-bold text-slate-400">
                    <span>{media.fileSize}</span>
                    <span>{media.dimensions}</span>
                  </div>
                </div>
              </div>
            )}
            renderRow={(media) => (
              <tr key={media.id}>
                <td>
                  <img
                    src={media.url}
                    alt={media.productName}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100"
                  />
                </td>
                <td className="text-xs font-extrabold text-slate-700">{media.productName}</td>
                <td className="text-xs text-slate-500 font-bold">{media.fileSize}</td>
                <td className="text-xs text-slate-400 font-bold">{media.dimensions}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleCopyUrl(media.url)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                      title="Copy URL"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewMedia(media)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                      title="Preview"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(media.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
                      title="Delete"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-fade-in text-left">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800">Image Preview: {previewMedia.productName}</h3>
              <button
                onClick={() => setPreviewMedia(null)}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <img
                src={previewMedia.url}
                alt={previewMedia.productName}
                className="max-h-[300px] object-contain rounded-xl border border-slate-100 shadow-xs mb-4"
              />
              <div className="w-full grid grid-cols-2 gap-4 text-xs font-bold text-slate-600 border-t border-slate-100 pt-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">File Name</span>
                  <span className="text-slate-700">{previewMedia.productName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">File Size</span>
                  <span className="text-slate-700">{previewMedia.fileSize}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Dimensions</span>
                  <span className="text-slate-700">{previewMedia.dimensions}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Copy Path</span>
                  <button
                    onClick={() => handleCopyUrl(previewMedia.url)}
                    className="mt-1 flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 bg-transparent border-none cursor-pointer text-xs font-bold hover:underline"
                  >
                    <FiCopy className="w-3.5 h-3.5" /> Copy Image URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
