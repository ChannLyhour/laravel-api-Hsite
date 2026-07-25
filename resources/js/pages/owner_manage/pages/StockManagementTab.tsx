import React, { useEffect, useState } from 'react';
import { StockManagement } from './Stock_Management/index';
import { authService } from '@/api/auth';
import { storesService } from '@/api/owner/stores';

interface StockManagementTabProps {
  defaultView?: 'overview' | 'items' | 'low' | 'movements' | 'fifo';
  ownerId?: number | string;
  storeId?: number;
}

export const StockManagementTab: React.FC<StockManagementTabProps> = ({
  defaultView = 'overview',
  ownerId: propOwnerId,
  storeId: propStoreId,
}) => {
  const [resolvedOwnerId, setResolvedOwnerId] = useState<number | string | undefined>(propOwnerId);
  const [resolvedStoreId, setResolvedStoreId] = useState<number | undefined>(propStoreId);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (propOwnerId !== undefined) {
      setResolvedOwnerId(propOwnerId);
    }
    if (propStoreId !== undefined) {
      setResolvedStoreId(propStoreId);
    }
  }, [propOwnerId, propStoreId]);

  useEffect(() => {
    if (propOwnerId === undefined || propStoreId === undefined) {
      const resolveData = async () => {
        try {
          setResolving(true);
          const userProfile = await authService.getCurrentUser();
          if (userProfile) {
            const isAdmin = userProfile.user?.role === 'admin';
            let activeOwnerId: number | string | null = null;
            
            if (isAdmin) {
              const saved = localStorage.getItem('selected_owner_id');
              if (saved) activeOwnerId = isNaN(Number(saved)) ? saved : parseInt(saved, 10);
            }
            
            if (!activeOwnerId) {
              activeOwnerId = userProfile.user?.hashid || userProfile.user?.id;
            }

            if (propOwnerId === undefined && activeOwnerId) {
              setResolvedOwnerId(activeOwnerId);
            }

            if (propStoreId === undefined && activeOwnerId) {
              const storeData = await storesService.getStoreByOwner(activeOwnerId);
              if (storeData && storeData.id) {
                setResolvedStoreId(storeData.id);
              }
            }
          }
        } catch (err) {
          console.warn('Failed to self-resolve stock management tab parameters:', err);
        } finally {
          setResolving(false);
        }
      };

      resolveData();
    }
  }, [propOwnerId, propStoreId]);

  if (resolving) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 font-kuntomruy">
        <svg className="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-500 text-xs font-bold">Resolving store identity...</span>
      </div>
    );
  }

  return (
    <StockManagement
      defaultView={defaultView}
      ownerId={resolvedOwnerId}
      storeId={resolvedStoreId}
    />
  );
};
