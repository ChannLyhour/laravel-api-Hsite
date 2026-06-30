import React from 'react';
import { OrdersTab as RefactoredOrdersTab } from './order/index';

interface OrdersTabProps {
  ownerId?: number | string;
  storeId?: number;
  defaultStatusFilter?: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ ownerId, storeId, defaultStatusFilter }) => {
  return <RefactoredOrdersTab ownerId={ownerId} storeId={storeId} defaultStatusFilter={defaultStatusFilter} />;
};

