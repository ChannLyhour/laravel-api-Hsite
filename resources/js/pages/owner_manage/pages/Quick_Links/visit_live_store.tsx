import React from 'react';
import { FiHome } from 'react-icons/fi';
import { useTranslation } from '../../lang/i18n';
import { getStoreUrl, getStoreSlugFromDomain } from '@Security/Owner/configUrl';
import type { StoreRow } from '@/api/owner/stores';

interface VisitLiveStoreProps {
  stores?: StoreRow | null;
  profile: any;
}

export const VisitLiveStore: React.FC<VisitLiveStoreProps> = ({ stores, profile }) => {
  const { t } = useTranslation();

  const handleVisit = () => {
    const ownerId = stores?.hashid || stores?.owner_id || stores?.created_by || (profile?.user?.role === 'admin'
      ? (localStorage.getItem('selected_owner_id') || profile?.user?.hashid || profile?.user?.id)
      : (profile?.user?.hashid || profile?.user?.id));
    const resolvedStoreName = stores?.custom_domain ? getStoreSlugFromDomain(stores.custom_domain) : (stores?.store_name || 'Store');
    const path = getStoreUrl(resolvedStoreName, ownerId, false, true);
    window.open(path, '_blank');
  };

  return (
    <button
      onClick={handleVisit}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-[5px] text-indigo-100 hover:text-white hover:bg-white/5 text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer"
    >
      <FiHome className="w-4 h-4 text-indigo-200/80" />
      <span>{t('sidebar.visit_live_store')}</span>
    </button>
  );
};

export default VisitLiveStore;
