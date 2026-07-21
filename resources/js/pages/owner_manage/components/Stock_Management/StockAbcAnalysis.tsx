import React from 'react';
import { FiTrendingUp, FiCheckCircle, FiInfo } from 'react-icons/fi';
import type { MenuItem, ProductVariant } from '@/api/owner/categories';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';

interface StockAbcAnalysisProps {
  items: MenuItem[];
  loading: boolean;
}

export const StockAbcAnalysis: React.FC<StockAbcAnalysisProps> = ({
  items,
  loading,
}) => {
  // Flatten all variants
  const variants: Array<{
    productName: string;
    productImage: string;
    variant: ProductVariant;
    value: number; // Value = price * quantity (capital tied up)
  }> = [];

  items.forEach(item => {
    const vars = item.variants || [];
    vars.forEach(v => {
      const price = parseFloat(v.purchase_price) || 0;
      const qty = v.stock_qty || 0;
      variants.push({
        productName: item.name,
        productImage: item.display_image || item.image || '',
        variant: v,
        value: price * qty, // Capital Tied Up
      });
    });
  });

  // Sort by capital value descending
  variants.sort((a, b) => b.value - a.value);

  // Group variants using ABC cumulative value theory:
  // Group A: Top 70% of total value (usually representing ~20% of inventory items)
  // Group B: Next 20% of total value (usually representing ~30% of inventory items)
  // Group C: Bottom 10% of total value (usually representing ~50% of inventory items)
  const totalValue = variants.reduce((sum, v) => sum + v.value, 0);

  const groupA: typeof variants = [];
  const groupB: typeof variants = [];
  const groupC: typeof variants = [];

  let runningSum = 0;
  variants.forEach(v => {
    runningSum += v.value;
    const percentage = totalValue > 0 ? (runningSum / totalValue) * 100 : 0;

    if (percentage <= 70 || groupA.length === 0) {
      groupA.push(v);
    } else if (percentage <= 90 || groupB.length === 0) {
      groupB.push(v);
    } else {
      groupC.push(v);
    }
  });

  const getPercentageString = (count: number) => {
    if (variants.length === 0) return '0%';
    return `${Math.round((count / variants.length) * 100)}%`;
  };

  const getValPercentageString = (valSum: number) => {
    if (totalValue === 0) return '0%';
    return `${Math.round((valSum / totalValue) * 100)}%`;
  };

  const groupAValue = groupA.reduce((sum, v) => sum + v.value, 0);
  const groupBValue = groupB.reduce((sum, v) => sum + v.value, 0);
  const groupCValue = groupC.reduce((sum, v) => sum + v.value, 0);

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      {/* Informational intro card in Khmer */}
      <div className="bg-gradient-to-br from-[#0f53a1]/5 to-indigo-500/3 border border-[#0f53a1]/10 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_-4px_rgba(15,83,161,0.02)]">
        <h4 className="text-xs sm:text-sm font-extrabold text-[#0f53a1] flex items-center gap-2">
          <FiTrendingUp className="w-5 h-5 text-[#0f53a1]" />
          <span>ការវិភាគស្តុក ABC (ABC Inventory Analysis)</span>
        </h4>
        <p className="text-slate-500 text-3xs font-semibold leading-relaxed">
          ABC Analysis គឺជាវិធីសាស្ត្របែងចែកទំនិញជា ៣ ក្រុម ទៅតាមតម្លៃហិរញ្ញវត្ថុ និងសារៈសំខាន់នៃការវិនិយោគទុន ដើម្បីជួយឱ្យម្ចាស់អាជីវកម្មគ្រប់គ្រងស្តុកបានត្រឹមត្រូវ និងចៀសវាងការកកស្ទះទុន៖
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-3xs hover:shadow-xs transition-all duration-300">
            <h5 className="text-[11px] font-black text-rose-600">Group A (ទំនិញតម្លៃខ្ពស់បំផុត)</h5>
            <p className="text-[10px] text-slate-450 font-semibold leading-relaxed mt-1.5">
              ជាទំនិញដែលមានតម្លៃខ្ពស់បំផុត និងមានទុនកកស្ទះច្រើនជាងគេ (ប្រហែល ៧០%-៨០% នៃតម្លៃស្តុកសរុប)។ ត្រូវតាមដាន និងគ្រប់គ្រងស្តុកឱ្យតឹងរ៉ឹងបំផុត។
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-3xs hover:shadow-xs transition-all duration-300">
            <h5 className="text-[11px] font-black text-amber-600">Group B (ទំនិញតម្លៃមធ្យម)</h5>
            <p className="text-[10px] text-slate-450 font-semibold leading-relaxed mt-1.5">
              ជាទំនិញដែលមានតម្លៃ និងតម្រូវការមធ្យម (ប្រហែល ១៥%-២០% នៃតម្លៃស្តុកសរុប)។ គ្រប់គ្រងស្តុកកម្រិតមធ្យម និងកុម្ម៉ង់ទិញបន្ថែមជាប្រចាំ។
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-3xs hover:shadow-xs transition-all duration-300">
            <h5 className="text-[11px] font-black text-emerald-600">Group C (ទំនិញតម្លៃទាប)</h5>
            <p className="text-[10px] text-slate-450 font-semibold leading-relaxed mt-1.5">
              ជាទំនិញដែលមានតម្លៃទាប ឬលក់ដាច់យឺត (ប្រហែល ៥%-១០% នៃតម្លៃស្តុកសរុប)។ មិនបាច់តាមដានតឹងរ៉ឹងពេកទេ អាចកុម្ម៉ង់ទិញទុកច្រើនម្តងៗបាន។
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 bg-white border rounded-2xl">
          <div className="w-8 h-8 border-4 border-[#0f53a1] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Analyzing stock values...</p>
        </div>
      ) : variants.length === 0 ? (
        <div className="py-20 text-center text-slate-450 bg-white border rounded-2xl">No variants available for analysis.</div>
      ) : (
        <div className="space-y-6">
          {/* Visual Progress Bar Chart */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4">
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 font-black">Value Breakdown (ការបែងចែកតម្លៃទុន)</h4>
              <p className="text-slate-400 text-3xs font-semibold mt-0.5">Tied-up capital distribution across groups.</p>
            </div>

            <div className="h-7 w-full rounded-full bg-slate-100 overflow-hidden flex font-extrabold text-[10px] text-white shadow-inner">
              {groupAValue > 0 && (
                <div
                  style={{ width: getValPercentageString(groupAValue) }}
                  className="bg-gradient-to-r from-rose-500 to-red-500 flex items-center justify-center h-full transition-all duration-300"
                  title={`Group A: ${getValPercentageString(groupAValue)}`}
                >
                  {getValPercentageString(groupAValue)}
                </div>
              )}
              {groupBValue > 0 && (
                <div
                  style={{ width: getValPercentageString(groupBValue) }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-550 flex items-center justify-center h-full transition-all duration-300"
                  title={`Group B: ${getValPercentageString(groupBValue)}`}
                >
                  {getValPercentageString(groupBValue)}
                </div>
              )}
              {groupCValue > 0 && (
                <div
                  style={{ width: getValPercentageString(groupCValue) }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center h-full transition-all duration-300"
                  title={`Group C: ${getValPercentageString(groupCValue)}`}
                >
                  {getValPercentageString(groupCValue)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between text-2xs font-black text-slate-500 gap-4 pt-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                <span>Group A: {groupA.length} items ({getPercentageString(groupA.length)}) — Value: ${groupAValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
                <span>Group B: {groupB.length} items ({getPercentageString(groupB.length)}) — Value: ${groupBValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                <span>Group C: {groupC.length} items ({getPercentageString(groupC.length)}) — Value: ${groupCValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Group Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Group A Column */}
            <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(244,63,94,0.01)] hover:shadow-sm duration-300">
              <div className="bg-rose-500 text-white p-4 flex justify-between items-center">
                <h4 className="text-[12px] font-black tracking-tight uppercase">Group A (High Control)</h4>
                <span className="bg-white/20 px-2 py-0.5 rounded-[4px] text-[10px] font-bold">{groupA.length} items</span>
              </div>
              <div className="divide-y divide-slate-100 p-2 max-h-[380px] overflow-y-auto custom-scrollbar">
                {groupA.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50/70 transition-all rounded-xl duration-200">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 border shrink-0 shadow-3xs">
                        <img
                          src={resolveImageUrl(item.variant.image_url || item.productImage)}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-slate-400 text-4xs font-semibold truncate">SKU: {item.variant.variant_sku}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-[11px] font-black text-slate-800">${parseFloat(item.variant.retail_price).toFixed(2)}</p>
                      <p className="text-slate-400 text-[10px] font-bold">Stock: {item.variant.stock_qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group B Column */}
            <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(245,158,11,0.01)] hover:shadow-sm duration-300">
              <div className="bg-amber-500 text-white p-4 flex justify-between items-center">
                <h4 className="text-[12px] font-black tracking-tight uppercase">Group B (Medium Control)</h4>
                <span className="bg-white/20 px-2 py-0.5 rounded-[4px] text-[10px] font-bold">{groupB.length} items</span>
              </div>
              <div className="divide-y divide-slate-100 p-2 max-h-[380px] overflow-y-auto custom-scrollbar">
                {groupB.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50/70 transition-all rounded-xl duration-200">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 border shrink-0 shadow-3xs">
                        <img
                          src={resolveImageUrl(item.variant.image_url || item.productImage)}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-slate-400 text-4xs font-semibold truncate">SKU: {item.variant.variant_sku}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-[11px] font-black text-slate-800">${parseFloat(item.variant.retail_price).toFixed(2)}</p>
                      <p className="text-slate-400 text-[10px] font-bold">Stock: {item.variant.stock_qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group C Column */}
            <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(16,185,129,0.01)] hover:shadow-sm duration-300">
              <div className="bg-emerald-500 text-white p-4 flex justify-between items-center">
                <h4 className="text-[12px] font-black tracking-tight uppercase">Group C (Low Control)</h4>
                <span className="bg-white/20 px-2 py-0.5 rounded-[4px] text-[10px] font-bold">{groupC.length} items</span>
              </div>
              <div className="divide-y divide-slate-100 p-2 max-h-[380px] overflow-y-auto custom-scrollbar">
                {groupC.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50/70 transition-all rounded-xl duration-200">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 border shrink-0 shadow-3xs">
                        <img
                          src={resolveImageUrl(item.variant.image_url || item.productImage)}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-slate-400 text-4xs font-semibold truncate">SKU: {item.variant.variant_sku}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-[11px] font-black text-slate-800">${parseFloat(item.variant.retail_price).toFixed(2)}</p>
                      <p className="text-slate-400 text-[10px] font-bold">Stock: {item.variant.stock_qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
