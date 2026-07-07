import React, { useState } from 'react';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
  FiVolume2, FiBell, FiSettings, FiSave,
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';

import { CouponsTab } from './offers/conpon';
import { FlashDealsTab } from './offers/FlashDeals';
import { FeaturedDealsSubTab } from './offers/FeatureDeal';
import { ClearanceSalesSubTab } from './offers/ClearanceSale';

export { CouponsTab } from './offers/conpon';
export { FlashDealsTab } from './offers/FlashDeals';

interface GenericDealProps {
  type: 'featured' | 'clearance';
  ownerId?: number | string;
  storeId?: number;
}

export const GenericDealsTab: React.FC<GenericDealProps> = ({ type, ownerId, storeId }) => {
  if (type === 'featured') {
    return <FeaturedDealsSubTab ownerId={ownerId} storeId={storeId} />;
  }
  if (type === 'clearance') {
    return <ClearanceSalesSubTab ownerId={ownerId} storeId={storeId} />;
  }

  // Fallback (should not be reached)
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Send Notification Tab Component
// ─────────────────────────────────────────────────────────────────────────────
export const SendNotificationTab: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Title and message text are required.');
      return;
    }
    toast.success('Push notification sent to all active users (Demo Mode)!');
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      <div>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiVolume2 className="text-orange-500 w-5 h-5" />
          <span>Send Notification</span>
        </h3>
        <p className="text-slate-400 text-xs mt-1">Broadcast direct message alerts to customer app instances instantly.</p>
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-6">
        <h4 className="text-sm font-black text-slate-800 tracking-tight">New Broadcast Notification</h4>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Notification Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Free Delivery Weekend!"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Message Description *</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter message details for your customers..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="submit" className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center space-x-1.5 shadow-2xs">
              <FiBell className="w-3.5 h-3.5" />
              <span>Send Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Push Notifications Setup Tab
// ─────────────────────────────────────────────────────────────────────────────
export const PushNotificationsSetupTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      <div>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiSettings className="text-orange-500 w-5 h-5" />
          <span>Push Notification Setup</span>
        </h3>
        <p className="text-slate-400 text-xs mt-1">Configure Firebase Cloud Messaging credentials and API keys.</p>
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-6">
        <h4 className="text-sm font-black text-slate-800 tracking-tight">FCM Server Configurations</h4>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Firebase API Key</label>
            <input type="password" value="****************************************" disabled className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none bg-slate-50 text-slate-400 font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">FCM Project ID</label>
            <input type="text" value="valley-food-delivery-f31d2" disabled className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none bg-slate-50 text-slate-400 font-mono" />
          </div>
          <div className="flex justify-end">
            <button onClick={() => toast.success('FCM configurations saved (Demo Mode)!')} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center space-x-1.5">
              <FiSave className="w-3.5 h-3.5" />
              <span>Save Configurations</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Announcement Tab Component
// ─────────────────────────────────────────────────────────────────────────────
export const AnnouncementTab: React.FC = () => {
  const [announcementText, setAnnouncementText] = useState('Free shipping on all orders above $50.00 this week! Use code FREESHIP at checkout.');

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700">
      <div>
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiVolume2 className="text-orange-500 w-5 h-5" />
          <span>Storewide Announcement</span>
        </h3>
        <p className="text-slate-400 text-xs mt-1">Setup marquee scrolling announcements or alert banners shown at the top of your homepage storefront.</p>
      </div>

      <div className="bg-white border border-slate-100 p-6 rounded-[5px] shadow-xs space-y-6">
        <h4 className="text-sm font-black text-slate-800 tracking-tight">Configure Announcement Banner</h4>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Announcement Text</label>
            <input
              type="text"
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
              placeholder="e.g. Free shipping on all products!"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
            />
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-slate-700">Enable Scrolling Banner</label>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
            </label>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => toast.success('Announcement details saved (Demo Mode)!')} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all border-none cursor-pointer flex items-center space-x-1.5">
              <FiSave className="w-3.5 h-3.5" />
              <span>Save Announcement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
