import React from 'react';
import type { GeneratedVariantRow } from '../helpers/ProductVariationSetup';

interface ProductSKUGenerateProps {
     setItemSku: (sku: string) => void;
     setVariants: React.Dispatch<React.SetStateAction<GeneratedVariantRow[]>>;
}

export const ProductSKUGenerate: React.FC<ProductSKUGenerateProps> = ({
     setItemSku,
     setVariants,
}) => {
     const handleGenerate = () => {
          const randCode = Math.floor(100000 + Math.random() * 900000);
          const newSku = `SKU-${randCode}`;
          setItemSku(newSku);
          // Sync to first variant SKU if simple
          setVariants(prev => {
               const next = [...prev];
               if (next[0]) {
                    next[0].sku = newSku;
               }
               return next;
          });
     };

     return (
          <button
               type="button"
               onClick={handleGenerate}
               className="text-xs font-bold text-[#1455ac] hover:underline cursor-pointer bg-transparent border-none p-0 outline-none"
          >
               Generate code
          </button>
     );
};
