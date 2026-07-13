import React from 'react';
import { FiArrowLeft, FiEdit2, FiFileText, FiLink, FiCalendar, FiClock } from 'react-icons/fi';
import type { Policy } from '@/api/owner/policies';
import { StatusBadge } from './index';

interface ShowPageProps {
  policy: Policy;
  onClose: () => void;
  onEdit: (policy: Policy) => void;
}

export const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export const ShowPage: React.FC<ShowPageProps> = ({ policy, onClose, onEdit }) => {
  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 border border-slate-200 rounded-[5px] hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-2xs"
            title="Back to list"
          >
            <FiArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <FiFileText className="text-orange-500 w-6 h-6" />
              <span>Policy Details</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Review and manage this store policy.
            </p>
          </div>
        </div>

        <button
          onClick={() => onEdit(policy)}
          className="py-2 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-[5px] text-xs font-bold transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 flex items-center space-x-2 cursor-pointer border-none active:scale-95 duration-200"
        >
          <FiEdit2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Edit Policy</span>
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Left Column (2/3 width) - Policy Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[5px] p-6 sm:p-8 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                Policy Content
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Title</span>
                <div className="text-base sm:text-lg font-black text-slate-900">{policy.title}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Content</span>
                <div className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-6 border border-slate-100 rounded-[5px] whitespace-pre-line">
                  {policy.content}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) - Policy Settings & Metadata */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-[5px] p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                Settings & Metadata
              </h3>
            </div>

            <div className="space-y-4.5">
              {/* Status */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Status</span>
                <StatusBadge status={policy.status} />
              </div>

              {/* URL Slug */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Slug / Route</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-150 rounded-[5px] px-3 py-2 w-fit">
                  <FiLink className="w-3.5 h-3.5 text-slate-400" />
                  <code>/policies/{policy.slug}</code>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-center gap-3 text-slate-600">
                <FiCalendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Created Date</span>
                  <span className="text-xs font-bold">{formatDate(policy.created_at)}</span>
                </div>
              </div>

              {/* Updated At */}
              <div className="flex items-center gap-3 text-slate-600">
                <FiClock className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Last Updated</span>
                  <span className="text-xs font-bold">{formatDate(policy.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
