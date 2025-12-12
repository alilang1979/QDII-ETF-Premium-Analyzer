
import React from 'react';
import { EtfDataPoint } from '../types';

interface DataTableProps {
  data: EtfDataPoint[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (data.length === 0) return null;

  // Reverse data to show newest first
  const displayData = [...data].reverse();

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">数据核验表</h3>
        <span className="text-xs text-slate-400">共 {data.length} 天</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-slate-900 bg-slate-100">交易日 (T)</th>
              <th className="px-4 py-3 bg-slate-100">收盘价</th>
              <th className="px-4 py-3 text-blue-800 bg-blue-50">净值日期 (T-1)</th>
              <th className="px-4 py-3 text-blue-800 bg-blue-50">参考净值</th>
              <th className="px-4 py-3 text-right bg-slate-100">溢价率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayData.map((row, index) => {
               const isPremiumHigh = row.premiumRate > 3; // Highlight > 3%
               const isDiscount = row.premiumRate < 0;
               // Considering T-1 is standard (diff 1 day). 
               // Monday (T) -> Friday (T-1) is 3 days.
               // So if diff > 4, it is definitely stale. If diff > 2 on Tue-Fri, it is stale.
               // Simplified logic: Just show badge if > 4 days (definitely stale) or maybe > 2 to be cautious
               const isStale = (row.lagDays || 0) > 4;
               const isLagging = (row.lagDays || 0) > 2 && !isStale;

               return (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-medium text-slate-700">{row.date}</td>
                  <td className="px-4 py-2.5 font-mono">{row.closePrice.toFixed(3)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600 bg-blue-50/30">
                    <div className="flex items-center gap-2">
                       {row.refDate}
                       {isStale && <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-bold whitespace-nowrap">⚠️ 滞后 {(row.lagDays || 0)} 天</span>}
                       {isLagging && <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 whitespace-nowrap">⏳ 疑似滞后</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600 bg-blue-50/30">{row.referenceValue.toFixed(4)}</td>
                  <td className={`px-4 py-2.5 text-right font-bold font-mono ${isPremiumHigh ? 'text-rose-600' : isDiscount ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {row.premiumRate > 0 ? '+' : ''}{row.premiumRate.toFixed(2)}%
                  </td>
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
