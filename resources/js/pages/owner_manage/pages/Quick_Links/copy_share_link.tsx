import React from 'react';
import { FiShare2 } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { useTranslation } from '../../lang/i18n';
import { getStoreUrl, getStoreSlugFromDomain } from '@Security/Owner/configUrl';
import type { StoreRow } from '@/api/owner/stores';

interface CopyShareLinkProps {
  stores?: StoreRow | null;
  profile: any;
}

export const CopyShareLink: React.FC<CopyShareLinkProps> = ({ stores, profile }) => {
  const { t } = useTranslation();

  const handleCopy = () => {
    const ownerId = stores?.hashid || stores?.owner_id || stores?.created_by || (profile?.user?.role === 'admin'
      ? (localStorage.getItem('selected_owner_id') || profile?.user?.hashid || profile?.user?.id)
      : (profile?.user?.hashid || profile?.user?.id));
    const resolvedStoreName = stores?.custom_domain ? getStoreSlugFromDomain(stores.custom_domain) : (stores?.store_name || 'Store');
    const path = getStoreUrl(resolvedStoreName, ownerId, false, true);
    const shareUrl = path;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Storefront link copied!');
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-[5px] text-indigo-100 hover:text-white hover:bg-white/5 text-[11px] font-bold transition-all border-none bg-transparent cursor-pointer"
    >
      <FiShare2 className="w-4 h-4 text-indigo-200/80" />
      <span>{t('sidebar.copy_share_link')}</span>
    </button>
  );
};

export default CopyShareLink;
