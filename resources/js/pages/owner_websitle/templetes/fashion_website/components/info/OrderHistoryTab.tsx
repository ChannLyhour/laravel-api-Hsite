import React from 'react';
import { OrderHistoryIndex } from './orderHistory/index';

interface OrderHistoryTabProps {
    user: any;
    ownerUserId?: number | string;
    locale?: string;
}

export const OrderHistoryTab: React.FC<OrderHistoryTabProps> = (props) => {
    return <OrderHistoryIndex {...props} />;
};
