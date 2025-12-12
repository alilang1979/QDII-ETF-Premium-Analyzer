
import React, { useState } from 'react';
import { getPercentileStats, getNannyAdvice, evaluateEtf } from '../services/dataService';
import ReactMarkdown from 'react-markdown';

interface MarketDashboardProps {
  volatility: number;
  rsi: number;
  premium: number;
  historyPremiums: number[]; // Used to calculate percentile context
  timeRangeLabel: string;    // e.g., "最近3个月"
  lagDays?: number; // Add lagDays prop
}

// ---------------- SUB-COMPONENTS ----------------

const InfoCard: React.FC<{ title: string; children: React.ReactNode; color?: string; onHelp?: () => void }> = ({ title, children, color = 'border-slate-200', onHelp }) => (
  <div className={`bg-white p-4 rounded-xl border ${color} shadow-sm hover:shadow-md transition-shadow relative group`}>
    <div className="flex justify-between items-start mb-3">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
         {title}
      </h4>
      {onHelp && (
        <button 
          onClick={(e) => { e.stopPropagation(); onHelp(); }}
          className="text-slate-300 hover:text-indigo-500 transition-colors"
          title="点击查看详细解释"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </button>
      )}
    </div>
    <div className="text-slate-800">{children}</div>
  </div>
);

// Visual Bar for Percentiles
const PercentileBar: React.FC<{ current: number; min: number; max: number; avg: number; rank: number }> = ({ current, min, max, avg, rank }) => {
   const range = max - min;
   const pos = range === 0 ? 50 : ((current - min) / range) * 100;
   const safePos = Math.min(Math.max(pos, 0), 100);

   let statusColor = "bg-blue-500";
   if (rank > 80) statusColor = "bg-rose-500";
   if (rank < 20) statusColor = "bg-emerald-500";

   return (
      <div className="mt-3">
         <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
            <span>最低: {min.toFixed(2)}%</span>
            <span>平均: {avg.toFixed(2)}%</span>
            <span>最高: {max.toFixed(2)}%</span>
         </div>
         <div className="h-3 w-full bg-slate-100 rounded-full relative overflow-hidden group cursor-help" title={`当前值: ${current.toFixed(2)}%`}>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 via-blue-50 to-rose-100 opacity-50"></div>
            <div 
               className={`absolute top-0 bottom-0 w-2 ${statusColor} rounded-full shadow-sm transform -translate-x-1/2 transition-all duration-500 border border-white`}
               style={{ left: `${safePos}%` }}
            ></div>
         </div>
         <div className="text-center mt-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rank < 20 ? 'text-emerald-700 bg-emerald-100' : rank > 80 ? 'text-rose-700 bg-rose-100' : 'text-blue-700 bg-blue-100'}`}>
               比历史上 {rank}% 的时间都要{current > avg ? '贵' : '便宜'}
            </span>
         </div>
      </div>
   );
};

// "Nanny" Explanation Dictionary Item
const GlossaryItem: React.FC<{ term: string; analogy: string; detail: string; goodWhen: string; scale?: React.ReactNode }> = ({ term, analogy, detail, goodWhen, scale }) => (
   <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
         <h5 className="font-bold text-slate-800 text-base">{term}</h5>
         <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100 self-start sm:self-auto">比喻：{analogy}</span>
      </div>
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">{detail}</p>
      
      {scale && <div className="mb-4 bg-slate-50 p-3 rounded-lg">{scale}</div>}

      <div className="text-xs bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
         <span className="font-bold shrink-0">✅ 实战指南：</span>
         <span>{goodWhen}</span>
      </div>
   </div>
);

const RangeScale: React.FC<{ labels: string[], colors: string[] }> = ({ labels, colors }) => (
   <div className="w-full">
      <div className="flex h-2 rounded-full overflow-hidden mb-1">
         {colors.map((c, i) => (
            <div key={i} className={`flex-1 ${c}`}></div>
         ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
         {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
   </div>
);

// ---------------- MAIN COMPONENT ----------------

const MarketDashboard: React.FC<MarketDashboardProps> = ({ 
  volatility, 
  rsi, 
  premium, 
  historyPremiums,
  timeRangeLabel,
  lagDays = 0
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'glossary'>('dashboard');

  // Calculate detailed stats
  const stats = getPercentileStats(premium, historyPremiums);
  // Calculate Score locally for the advice
  const { score } = evaluateEtf(premium, stats.rank);
  
  const nannyAdvice = getNannyAdvice(premium, stats.rank, rsi, volatility, score);

  // Status Colors
  let rsiColor = "text-slate-600 bg-slate-100";
  if (rsi > 70) rsiColor = "text-rose-700 bg-rose-100";
  if (rsi < 30) rsiColor = "text-emerald-700 bg-emerald-100";

  // Data Freshness Warning
  // Lag > 3 days usually means data is stale (even with weekend).
  const isDataStale = lagDays > 3;

  return (
    <div className="mb-6 bg-slate-50/50 rounded-xl border border-slate-200 p-1">
      
      {/* Tab Switcher */}
      <div className="flex p-1 gap-1 mb-2">
         <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}
         >
            <span>📊</span> 实时盘面
         </button>
         <button 
            onClick={() => setActiveTab('glossary')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 ${activeTab === 'glossary' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:bg-white/50'}`}
         >
            <span>📖</span> 小白百科 (详细解释)
         </button>
      </div>

      <div className="p-3">
         {activeTab === 'dashboard' ? (
            <div className="space-y-4 animate-fade-in">
               
               {/* STALE DATA WARNING */}
               {isDataStale && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                     <span className="text-xl">⚠️</span>
                     <div>
                        <h4 className="text-sm font-bold text-amber-800">数据时效性预警</h4>
                        <p className="text-xs text-amber-700 mt-1">
                           检测到当前使用的参考净值滞后 <strong>{lagDays}天</strong>（可能因海外假期或数据源延迟）。
                           请注意，当前的溢价率可能无法反映最新市场变化。
                        </p>
                     </div>
                  </div>
               )}

               {/* 1. Nanny Advice Card (Summary) */}
               <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-white/10 w-20 h-20 rounded-full blur-xl"></div>
                  <div className="relative flex items-start gap-4 z-10">
                     <div className="text-4xl filter drop-shadow-md">🤖</div>
                     <div className="flex-1">
                        <h3 className="font-bold text-indigo-100 text-xs uppercase mb-1 flex items-center gap-1">
                           AI 智能决策建议
                           <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">Beta</span>
                        </h3>
                        <div className="text-sm font-medium leading-relaxed text-indigo-50 prose prose-invert prose-sm max-w-none">
                           <ReactMarkdown>{nannyAdvice}</ReactMarkdown>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 2. Premium & Percentile */}
                  <InfoCard title="溢价率 & 历史百分位" onHelp={() => setActiveTab('glossary')}>
                     <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold font-mono tracking-tight ${premium > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                           {premium > 0 ? '+' : ''}{premium.toFixed(2)}%
                        </span>
                        <span className="text-xs text-slate-500">当前实时</span>
                     </div>
                     
                     <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-xs font-bold text-slate-700">在 {timeRangeLabel} 中的位置</span>
                        </div>
                        <PercentileBar 
                           current={premium} 
                           min={stats.min} 
                           max={stats.max} 
                           avg={stats.avg} 
                           rank={stats.rank} 
                        />
                     </div>
                  </InfoCard>

                  {/* 3. Technicals */}
                  <div className="md:col-span-2">
                     <InfoCard title="技术指标 (RSI/波动率)" onHelp={() => setActiveTab('glossary')}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {/* RSI */}
                           <div>
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-xs font-medium text-slate-500">RSI 强弱指标</span>
                                 <span className={`text-xs font-bold px-2 py-0.5 rounded ${rsiColor}`}>
                                    {rsi.toFixed(1)}
                                 </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${rsi > 70 ? 'bg-rose-400' : rsi < 30 ? 'bg-emerald-400' : 'bg-slate-400'}`} 
                                    style={{ width: `${rsi}%` }}
                                 ></div>
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                                 <span>0 (超卖)</span>
                                 <span>50</span>
                                 <span>100 (超买)</span>
                              </div>
                           </div>

                           {/* Volatility */}
                           <div>
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-xs font-medium text-slate-500">年化波动率 (HV)</span>
                                 <span className="text-xs font-bold text-slate-700">{volatility.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="flex-1 bg-slate-100 h-1.5 rounded-full">
                                    <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${Math.min(volatility, 50) * 2}%` }}></div>
                                 </div>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">
                                 {volatility > 25 ? '⚠️ 波动剧烈，注意风控' : '✅ 走势相对平稳'}
                              </p>
                           </div>
                       </div>
                     </InfoCard>
                  </div>
               </div>
            </div>
         ) : (
            <div className="bg-white rounded-xl p-6 shadow-inner animate-fade-in border border-slate-200">
               <div className="mb-8 text-center max-w-2xl mx-auto">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                     📚 投资指标详解
                  </h3>
                  <p className="text-sm text-slate-500">
                     不要被专业术语吓到。这里用最通俗的语言解释所有你需要知道的数据。
                  </p>
               </div>
               
               <div className="space-y-8">
                  
                  {/* Section 1: Basic */}
                  <div>
                     <h4 className="text-sm font-bold text-indigo-900 uppercase border-b border-indigo-100 pb-2 mb-4">一、基础交易指标</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlossaryItem 
                           term="溢价率 (Premium Rate)"
                           analogy="黄牛加价"
                           detail="这是ETF最核心的指标。它代表你从二级市场买入的价格，比基金份额的真实净值贵了多少。正数代表贵了，负数代表打折。"
                           scale={<RangeScale labels={['折价(打折)', '0%', '1%以内', '3%以上']} colors={['bg-emerald-400', 'bg-emerald-200', 'bg-blue-300', 'bg-rose-400']} />}
                           goodWhen="越低越好！负数（折价）最好。通常0%~1%是合理区间，超过3%就是高风险。"
                        />
                        <GlossaryItem 
                           term="历史百分位 (Percentile)"
                           analogy="全班排名"
                           detail="把现在的溢价率放到过去（如半年）里去排名。如果百分位是10%，说明现在比历史上90%的时候都要便宜，处于底部区域。"
                           scale={<RangeScale labels={['0% (史低)', '20%', '50%', '80%', '100% (史高)']} colors={['bg-emerald-500', 'bg-emerald-300', 'bg-blue-200', 'bg-rose-300', 'bg-rose-500']} />}
                           goodWhen="数值越小越安全。小于20%代表极具性价比（地板价）；大于80%代表处于历史高位（天花板价），容易被套。"
                        />
                     </div>
                  </div>

                  {/* Section 2: Technical */}
                  <div>
                     <h4 className="text-sm font-bold text-indigo-900 uppercase border-b border-indigo-100 pb-2 mb-4">二、技术分析指标</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlossaryItem 
                           term="RSI (相对强弱指数)"
                           analogy="弹簧的松紧"
                           detail="衡量价格跑得太快还是太慢。数值范围0-100。如果数值很大（>70），说明买的人太多，价格可能虚高；如果数值很小（<30），说明跌过头了。"
                           scale={<RangeScale labels={['0', '30 (超卖)', '50 (中性)', '70 (超买)', '100']} colors={['bg-emerald-500', 'bg-emerald-300', 'bg-slate-200', 'bg-rose-300', 'bg-rose-500']} />}
                           goodWhen="RSI < 30 是短线反弹信号（捡便宜）；RSI > 70 是短线回调信号（该跑了）。"
                        />
                         <GlossaryItem 
                           term="历史波动率 (Volatility)"
                           analogy="海浪的大小"
                           detail="数值越大，说明价格忽上忽下越剧烈，像坐过山车。数值越小，说明走势越平稳。通常用于衡量持仓体验的舒适度。"
                           goodWhen="新手建议选波动率低的（<20%）。但在溢价套利时，波动率高（>30%）往往伴随着更大的价差机会。"
                        />
                     </div>
                  </div>
                  
                  {/* Summary Table */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                     <h4 className="text-center font-bold text-slate-700 mb-4">🏆 一图流：什么时候该买？</h4>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b">
                              <tr>
                                 <th className="px-4 py-2">指标</th>
                                 <th className="px-4 py-2 text-emerald-600">🟢 适合买入 (低估/安全)</th>
                                 <th className="px-4 py-2 text-rose-600">🔴 建议卖出 (高估/危险)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-200">
                              <tr>
                                 <td className="px-4 py-2 font-bold text-slate-700">溢价率</td>
                                 <td className="px-4 py-2">小于 0.5% (或负数)</td>
                                 <td className="px-4 py-2">大于 3%</td>
                              </tr>
                              <tr>
                                 <td className="px-4 py-2 font-bold text-slate-700">历史百分位</td>
                                 <td className="px-4 py-2">小于 20%</td>
                                 <td className="px-4 py-2">大于 80%</td>
                              </tr>
                              <tr>
                                 <td className="px-4 py-2 font-bold text-slate-700">RSI</td>
                                 <td className="px-4 py-2">小于 30 (超卖)</td>
                                 <td className="px-4 py-2">大于 70 (超买)</td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                  </div>

               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default MarketDashboard;
