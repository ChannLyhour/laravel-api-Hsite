import React from 'react';
import { GroupDiv } from '../../../helper/GroupDiv';
import { useTranslation } from '../../../lang/i18n';

interface FinancialConfigurationsTabProps {
  taxPercentage: string;
  setTaxPercentage: (val: string) => void;
  currency: string;
  setCurrency: (val: string) => void;
}

export const FinancialConfigurationsTab: React.FC<FinancialConfigurationsTabProps> = ({
  taxPercentage,
  setTaxPercentage,
  currency,
  setCurrency,
}) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in font-kuntomruy">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.financial_assets')}</h4>
      <GroupDiv>
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.tax_rate')}</label>
          <input
            type="number"
            value={taxPercentage}
            onChange={(e) => setTaxPercentage(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-black"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-bold text-slate-700 block">{t('settings.base_currency')}</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="USD">USD ($) - US Dollar</option>
            <option value="KHR">KHR (៛) - Cambodian Riel</option>
            <option value="EUR">EUR (€) - Euro</option>
          </select>
        </div>
      </GroupDiv>
    </div>
  );
};
