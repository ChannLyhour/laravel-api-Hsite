import React from 'react';
import { FiShoppingBag } from 'react-icons/fi';
import { getStoreUrl } from '@Security/Owner/configUrl';
import type { StoreRow } from '@/api/owner/stores';

interface LocalShopSaleProps {
     stores?: StoreRow | null;
     profile: any;
}

export const LocalShopSale: React.FC<LocalShopSaleProps> = ({ stores, profile }) => {
     const handleSale = () => {
          const ownerId = stores?.hashid || stores?.owner_id || stores?.created_by || (profile?.user?.role === 'admin'
               ? (localStorage.getItem('selected_owner_id') || profile?.user?.hashid || profile?.user?.id)
               : (profile?.user?.hashid || profile?.user?.id));
          // 1. Open storefront cashier screen in a new tab
          const path = getStoreUrl(stores?.store_name || profile?.user?.name || 'Store', ownerId, true);
          const localPath = path.includes('?') ? `${path}&local=true` : `${path}?local=true`;
          window.open(localPath, 'cashier_display', 'width=1200,height=800,menubar=no,status=no,toolbar=no');
     };

     return (
          <button
               onClick={handleSale}
               className="w-full flex items-center gap-2 px-3 py-2 rounded-[5px] text-indigo-100 hover:text-white hover:bg-white/5 text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer"
          >
               <FiShoppingBag className="w-4 h-4 text-indigo-200/80" />
               <span>Local Shop Sale</span>
          </button>
     );
};

export default LocalShopSale;
