import React from 'react';
import { CustomersTab as ModularCustomersTab } from './customers/index';

interface CustomersTabProps {
  ownerId?: number | string;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ ownerId }) => {
  return <ModularCustomersTab ownerId={ownerId} />;
};


