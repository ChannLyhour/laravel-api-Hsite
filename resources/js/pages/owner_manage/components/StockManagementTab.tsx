import React from 'react';
import { StockManagement } from './Stock_Management/index';

interface StockManagementTabProps {
  defaultView?: 'overview' | 'items' | 'low' | 'movements' | 'abc';
  ownerId?: number | string;
  storeId?: number;
}

export const StockManagementTab: React.FC<StockManagementTabProps> = ({
  defaultView = 'overview',
  ownerId,
  storeId,
}) => {
  return (
    <StockManagement
      defaultView={defaultView}
      ownerId={ownerId}
      storeId={storeId}
    />
  );
};
