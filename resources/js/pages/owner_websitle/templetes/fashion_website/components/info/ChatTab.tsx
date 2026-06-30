import React from 'react';
import { ChatTab as ChatIndex } from './chat/index';

interface ChatTabProps {
  ownerUserId?: number | string;
  user: any;
  stores?: any;
  onTabChange?: (tab: 'profile' | 'orders' | 'giftcard' | 'address' | 'chat') => void;
}

export const ChatTab: React.FC<ChatTabProps> = (props) => {
  return <ChatIndex {...props} />;
};
