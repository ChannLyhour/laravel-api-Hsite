import React from 'react';
import { MenuItemsTab as ModularMenuItemsTab } from './menu/index';

interface MenuItemsTabProps {
  ownerId?: number | string;
  storeId?: number;
}

export const MenuItemsTab: React.FC<MenuItemsTabProps> = ({ ownerId, storeId }) => {
  return <ModularMenuItemsTab ownerId={ownerId} storeId={storeId} />;
};

