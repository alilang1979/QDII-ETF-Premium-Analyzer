
import React, { useState } from 'react';
import { EtfProfile, EtfDataPoint } from '../types';
import { calculatePercentile, evaluateEtf, analyzeRisk } from '../services/dataService';

interface EtfRankingTableProps {
  datasets: { profile: EtfProfile; data: EtfDataPoint[] }[];
  onSelectEtf: (ticker: string) => void;
}

const EtfRankingTable: React.FC<EtfRankingTableProps> = ({ datasets, onSelectEtf }) => {
  const [sortConfig, setSortConfig] = useState<{ key: 'score' | 'premium' | 'rank'; direction: 'asc' | 'desc' }>({ key: 'score', direction: 'desc' });

  if (!datasets.length) return null;

  // Process data for the table
  const tableData = datasets.map(item => {
    const latest = item.data.length > 0 ? item.data[item.data.length - 1] : null;
    const currentPremium = latest ? latest.premiumRate : 0;
    const historyPremiums = item.data.map(d => d.premiumRate);
    
    // Calculate 6-Month Percentile
    const rank = latest ? calculatePercentile(currentPremium, historyPremiums) : 50;
    
    // Calculate Composite Score
    const evaluation = evaluateEtf(currentPremium, rank);
    const risk = analyzeRisk(currentPremium);

    return {
      ticker: item.profile.ticker,
      name: item.profile.name,
      premium: currentPremium,
      rank,
      score: evaluation.score,
      evalLabel: evaluation.label,
      evalColor: evaluation.color,
      riskLabel: risk.label,
      riskColor: risk.textColor,
      riskBg: risk.bgColor,
      lastUpdate: latest?.date
    };
  });

  // Sorting
  const sortedData = [...tableData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key: 'score' | 'premium' | 'rank') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (key === 'score') {
       direction = 'desc'; // Default desc for score
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ active, direction }: { active: boolean, direction: 'asc' | 'desc' }) => (
     <span className={`ml-1 text-[10px] ${active ? 'text-indigo-600 font-bold' : 'text-slate-300'}`}>
        {active ? (direction === 'asc' ? '▲' : '▼') : '▲▼'}
     </span>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
       <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">ETF 价值评估矩阵 (长期持有视角)</h3>
             <p className="text-xs text-slate-500 mt-1">基于过去半年(180天)数据，综合计算当前溢价与历史分位。</p>
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                   <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('score')}>
                      代码/名称 <SortIcon active={sortConfig.key === 'score'} direction={sortConfig.direction} />
                   </th>
                   <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('premium')}>
                      当前溢价率 <SortIcon active={sortConfig.key === 'premium'} direction={sortConfig.direction} />
                   </th>
                   <th className="px-4 py-3 w-1/4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('rank')}>
                      历史百分位 (半年) <SortIcon active={sortConfig.key === 'rank'} direction={sortConfig.direction} />
                   </th>
                   <th className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('score')}>
                      综合评分 <SortIcon active={sortConfig.key === 'score'} direction={sortConfig.direction} />
                   </th>
                   <th className="px-4 py-3 text-right">操作</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {sortedData.map((row) => (
                   <tr key={row.ticker} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer" onClick={() => onSelectEtf(row.ticker)}>
                      <td className="px-4 py-3">
                         <div className="font-bold text-slate-700 font-mono group-hover:text-indigo-600 transition-colors">{row.ticker}</div>
                         <div className="text-xs text-slate-500">{row.name}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                         <div className={`font-mono font-bold ${row.premium > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {row.premium > 0 ? '+' : ''}{row.premium.toFixed(2)}%
                         </div>
                         <div className={`text-[10px] inline-block px-1.5 rounded ${row.riskBg} ${row.riskColor}`}>
                            {row.riskLabel}
                         </div>
                      </td>
                      <td className="px-4 py-3">
                         <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                               <span>便宜</span>
                               <span className="font-bold text-slate-600">{row.rank}%</span>
                               <span>贵</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                  className={`h-full rounded-full transition-all duration-500 ${row.rank > 80 ? 'bg-rose-400' : row.rank < 20 ? 'bg-emerald-400' : 'bg-blue-400'}`}
                                  style={{ width: `${Math.max(row.rank, 5)}%` }}
                               ></div>
                            </div>
                         </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.evalColor}`}>
                               {row.evalLabel}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                               得分: {row.score}
                            </div>
                         </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                         <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors">
                            深度分析 &rarr;
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default EtfRankingTable;
