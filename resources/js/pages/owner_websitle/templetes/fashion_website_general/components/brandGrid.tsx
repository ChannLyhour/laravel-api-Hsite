import React, { useState, useEffect } from 'react';
import { brandsService, type Brand } from '@/api/owner/brands';
import { resolveImageUrl } from '../utils/imageUtils';

interface BrandGridProps {
     ownerUserId?: number | string;
}

export const BrandGrid: React.FC<BrandGridProps> = ({ ownerUserId }) => {
     const [brands, setBrands] = useState<Brand[]>([]);

     useEffect(() => {
          if (ownerUserId) {
               brandsService
                    .getBrands(100, 0, ownerUserId)
                    .then((data) => setBrands((data || []).filter((b) => b.status)))
                    .catch((err) => console.error('Failed to load brands:', err));
          }
     }, [ownerUserId]);

     if (brands.length === 0) return null;

     return (
          <div className="w-full bg-white py-6 border-t border-slate-100">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 items-center justify-items-center">
                         {brands.map((brand, idx) => (
                              <div
                                   key={brand.id || idx}
                                   className="w-full max-w-[140px] aspect-[5/2] bg-white dark:bg-stone-900 text-slate-800 dark:text-stone-200 flex items-center justify-center gap-2 px-3 border border-slate-200/60 dark:border-stone-800 hover:border-slate-300 dark:hover:border-stone-700 select-none shadow-xs hover:shadow-sm rounded-[4px] transition-all duration-300"
                              >
                                   {brand.logo && (
                                        <img
                                             src={resolveImageUrl(brand.logo)}
                                             alt={brand.name}
                                             className="w-6 h-6 object-contain rounded-xs"
                                        />
                                   )}
                                   <span className="font-kontomruy font-bold text-[10px] sm:text-xs uppercase tracking-wider text-slate-700 dark:text-stone-300 truncate">
                                        {brand.name}
                                   </span>
                              </div>
                         ))}
                    </div>
               </div>
          </div>
     );
};
