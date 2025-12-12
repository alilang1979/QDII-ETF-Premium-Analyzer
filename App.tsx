
import React, { useState, useEffect } from 'react';
import { EtfDataPoint, CalculationMethod, EtfProfile } from './types';
import { fetchMarketData, parseCsvData, POPULAR_ETFS, analyzeRisk, calculatePercentile, evaluateEtf } from './services/dataService';
import { analyzePremiumTrend, setStoredApiKey, getStoredApiKey } from './services/geminiService';
import PremiumChart from './components/PremiumChart';
import ComparisonChart from './components/ComparisonChart';
import DataTable from './components/DataTable';
import MarketDashboard from './components/MarketDashboard';
import EtfRankingTable from './components/EtfRankingTable';
import ReactMarkdown from 'react-markdown';

// Icons
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const TableCellsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m13.5 2.625v-1.5c0-.621.504-1.125 1.125-1.125m-9.75 0h9.75M3.375 5.625A1.125 1.125 0 014.5 4.5h4.125c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V5.625m-9.75 0h9.75" /></svg>;
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m1.172-2.828l-1.172 2.828m0 0a6.726 6.726 0 01-2.748-1.35m2.748 1.35l.89 3.098m0 0l-2.67.957m2.67-.957l2.67.957m0 0l.89-3.098" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.425-.109-2.167-.154m2.167.154a9.308 9.308 0 01-1.876 2.306 9.657 9.657 0 012.25 2.151c.454.566.827.854 1.11.854.275 0 .63-.263 1.11-.854a9.657 9.657 0 012.25-2.151c.64-.409 1.258-1.174 1.876-2.306m-6.723.154a9.308 9.308 0 001.876 2.306 9.657 9.657 0 002.25 2.151c.454.566.827.854 1.11.854.275 0 .63-.263 1.11-.854a9.657 9.657 0 002.25-2.151c.64-.409-1.258 1.174-1.876 2.306m-6.723-.154c.662.067 1.35.123 2.062.169t2.062-.169m0 0c.688.06 1.425.109 2.167.154m-2.167-.154a9.308 9.308 0 001.876-2.306 9.657 9.657 0 00-2.25-2.151c-.454-.566-.827-.854-1.11-.854-.275 0-.63.263-1.11.854a9.657 9.657 0 00-2.25 2.151c-.64.409-1.258 1.174-1.876 2.306m6.723.154a9.308 9.308 0 01-1.876-2.306 9.657 9.657 0 01-2.25-2.151c-.454-.566-.827-.854-1.11-.854-.275 0-.63.263-1.11.854a9.657 9.657 0 01-2.25 2.151c-.64.409-1.258 1.174-1.876 2.306m6.723-.154c-.662-.067-1.35-.123-2.062-.169t-2.062.169m0 0a9.308 9.308 0 01-1.876-2.306 9.657 9.657 0 01-2.25-2.151c-.454-.566-.827-.854-1.11-.854-.275 0-.63.263-1.11.854a9.657 9.657 0 01-2.25 2.151c-.64.409-1.258 1.174-1.876 2.306" /></svg>;

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');
  const [selectedTicker, setSelectedTicker] = useState<string>(POPULAR_ETFS[0].ticker);
  const [showGuide, setShowGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  // Data for all supported ETFs (for comparison view)
  const [allEtfData, setAllEtfData] = useState<{profile: EtfProfile, data: EtfDataPoint[]}[]>([]);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  
  // Data for the currently selected ETF (detailed history)
  const [fullDetailData, setFullDetailData] = useState<EtfDataPoint[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  const [timeRange, setTimeRange] = useState<number>(30); // Days: 30, 90, 180, 365
  const [method, setMethod] = useState<CalculationMethod>(CalculationMethod.PRECISE_NAV);
  const [csvInput, setCsvInput] = useState('');
  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [detailTab, setDetailTab] = useState<'chart' | 'data'>('chart');
  
  // Initialize API Key input from storage
  useEffect(() => {
    const key = getStoredApiKey();
    if (key) setApiKeyInput(key);
  }, []);

  // Load Overview Data
  useEffect(() => {
    const loadOverview = async () => {
      setIsOverviewLoading(true);
      try {
        const promises = POPULAR_ETFS.map(async (profile) => {
          // Changed to 180 days for overview to support meaningful 6-month percentile calculation
          const fullData = await fetchMarketData(profile.ticker, method, 180); 
          return { profile, data: fullData };
        });
        
        const results = await Promise.all(promises);
        setAllEtfData(results);
      } catch (err) {
        console.error("Failed to load market overview", err);
      } finally {
        setIsOverviewLoading(false);
      }
    };

    if (viewMode === 'overview') {
      loadOverview();
    }
  }, [method, viewMode]);

  // Load Detail Data
  useEffect(() => {
    if (viewMode === 'detail' && selectedTicker !== 'CUSTOM') {
      const loadDetail = async () => {
        setIsDetailLoading(true);
        setAnalysis('');
        
        try {
          const data = await fetchMarketData(selectedTicker, method, 365);
          setFullDetailData(data);
        } catch (err) {
          console.error("Failed to load detail data", err);
        } finally {
          setIsDetailLoading(false);
        }
      };
      loadDetail();
    }
  }, [viewMode, selectedTicker, method]);

  const handleSelectEtf = (ticker: string) => {
    setSelectedTicker(ticker);
    setViewMode('detail');
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
  };

  const handleParseCsv = () => {
    const parsed = parseCsvData(csvInput);
    if (parsed.length > 0) {
      setFullDetailData(parsed);
      setSelectedTicker("CUSTOM");
      setViewMode('detail');
    } else {
      alert("CSV格式错误。需要: 日期, 价格(T), 参考日期(T-1), 参考净值");
    }
  };

  const handleSaveApiKey = () => {
    setStoredApiKey(apiKeyInput);
    setShowSettings(false);
    alert("API Key 已保存至本地浏览器。");
  };

  const handleAnalyze = async () => {
    const dataToAnalyze = fullDetailData.slice(-30);
    if (dataToAnalyze.length === 0) return;
    setAnalyzing(true);
    setAnalysis('AI 正在分析市场数据...');
    try {
      const result = await analyzePremiumTrend(selectedTicker, dataToAnalyze, method);
      setAnalysis(result);
    } catch (e: any) {
      if (e.message === "MISSING_API_KEY") {
        setAnalysis('');
        setShowSettings(true); // Open settings
      } else {
        setAnalysis('分析失败，请检查网络设置或API Key余额。');
      }
    }
    setAnalyzing(false);
  };

  const displayedDetailData = fullDetailData.slice(-timeRange);
  const latestDetailPoint = displayedDetailData.length > 0 ? displayedDetailData[displayedDetailData.length - 1] : null;
  const detailRisk = latestDetailPoint ? analyzeRisk(latestDetailPoint.premiumRate) : null;
  const premiumRank = (latestDetailPoint && displayedDetailData.length > 0) 
    ? calculatePercentile(latestDetailPoint.premiumRate, displayedDetailData.map(d => d.premiumRate))
    : 0;

  const timeRangeLabel = timeRange === 30 ? '最近1个月' : timeRange === 90 ? '最近3个月' : timeRange === 180 ? '最近半年' : '最近1年';

  // Smart Evaluation logic for Best Deal
  const bestDeal = React.useMemo(() => {
    if (allEtfData.length === 0) return null;
    let best = null;
    let maxScore = -1;
    
    allEtfData.forEach(item => {
      const latest = item.data.length > 0 ? item.data[item.data.length - 1] : null;
      if (latest) {
        // Calculate Percentile
        const history = item.data.map(d => d.premiumRate);
        const rank = calculatePercentile(latest.premiumRate, history);
        
        // Calculate Score
        const evalResult = evaluateEtf(latest.premiumRate, rank);
        
        if (evalResult.score > maxScore) {
           maxScore = evalResult.score;
           best = { ...item, score: evalResult.score, label: evalResult.label };
        }
      }
    });
    return best;
  }, [allEtfData]);

  // Determine banner style based on score
  const isBestDealGood = bestDeal && bestDeal.score >= 60;
  const bannerGradient = isBestDealGood ? 'from-emerald-500 to-teal-600' : 'from-amber-500 to-orange-600';
  const bannerTitle = isBestDealGood ? '综合评分第一 (长期持有首选)' : '当前全市场性价比较低';
  const bannerDesc = isBestDealGood 
      ? '当前溢价低且处于历史低位区间，综合性价比最高。' 
      : '即使是得分最高的ETF，目前也存在一定风险，建议谨慎观望。';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 md:px-6 shadow-lg z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             {viewMode === 'detail' && (
                <button onClick={handleBackToOverview} className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white">
                   <ArrowLeftIcon />
                </button>
             )}
             <div>
               <h1 className="text-xl font-bold tracking-tight">QDII 溢价分析器</h1>
               <p className="text-slate-400 text-xs mt-0.5 hidden md:block">实时数据源: 东方财富 (JSONP直连)</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
            >
              <CogIcon /> <span className="hidden sm:inline">设置</span>
            </button>
            <button 
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
            >
              <InfoIcon /> <span className="hidden sm:inline">新手指南</span>
            </button>
          </div>
        </div>
      </header>

      {/* API Key Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">设置 API Key</h2>
            <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3 mb-4 text-xs text-indigo-800 leading-relaxed">
               <strong>为什么要设置 Key？</strong><br/>
               尽管本工具不进行网络搜索，但为了实现「智能分析师」功能（将复杂的 RSI、波动率、溢价数据翻译成可读的投资建议），我们需要调用 Google Gemini 的语言模型进行推理生成。
            </div>
            <p className="text-sm text-slate-500 mb-4">
              GitHub Pages 是纯静态环境，无法在后端存储密钥。
              <br/>
              您的密钥仅保存在<strong>本地浏览器 (LocalStorage)</strong> 中，刷新页面不会丢失，且不会上传到任何第三方服务器。
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Google Gemini API Key</label>
              <input 
                type="password" 
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveApiKey}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beginner Guide Banner */}
      {showGuide && (
         <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-fade-in">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-700">
               <div>
                  <h3 className="font-bold text-indigo-900 mb-1">什么是溢价率?</h3>
                  <p>这是ETF交易价格(你买的价格)与真实净值(实际价值)的差额比例。正溢价意味着你买贵了。尽量寻找<span className="font-bold text-emerald-600">低溢价或折价</span>的机会。</p>
               </div>
               <div>
                  <h3 className="font-bold text-indigo-900 mb-1">为什么有时间差?</h3>
                  <p>美股在我们睡觉时交易。官方净值(NAV)通常是昨晚(T-1)的数据。我们用今天的A股价格对比昨晚的美股净值来估算。</p>
               </div>
               <div>
                  <h3 className="font-bold text-indigo-900 mb-1">如何使用本工具?</h3>
                  <p>关注带有<span className="bg-emerald-100 text-emerald-800 px-1 rounded text-xs font-bold">超值低估</span>标签的产品。当出现<span className="bg-rose-100 text-rose-800 px-1 rounded text-xs font-bold">高危溢价</span>时，请避免追高。</p>
               </div>
            </div>
         </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {viewMode === 'overview' ? (
          <div className="animate-fade-in space-y-6">
             
             {/* Best Value Highlight */}
             {bestDeal && !isOverviewLoading && (
                <div 
                   onClick={() => handleSelectEtf(bestDeal.profile.ticker)}
                   className={`bg-gradient-to-r ${bannerGradient} rounded-xl p-6 text-white shadow-md cursor-pointer hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-center gap-4`}
                >
                   <div>
                      <div className="flex items-center gap-2 mb-2">
                         <div className="p-1.5 bg-white/20 rounded-full">
                           {isBestDealGood ? <TrophyIcon /> : <InfoIcon />}
                         </div>
                         <span className="font-bold text-white/90 text-sm uppercase tracking-wider">{bannerTitle}</span>
                      </div>
                      <h2 className="text-2xl font-bold">{bestDeal.profile.name} ({bestDeal.profile.ticker})</h2>
                      <p className="text-white/90 mt-1 opacity-90 text-sm">
                         {bannerDesc}
                      </p>
                   </div>
                   <div className="text-right flex items-center gap-6">
                      <div className="hidden md:block text-right">
                         <div className="text-xs text-white/80 uppercase">综合得分</div>
                         <div className="text-3xl font-bold">{bestDeal.score}</div>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                         <div className="text-3xl font-bold">
                            {bestDeal.data[bestDeal.data.length-1].premiumRate.toFixed(2)}%
                         </div>
                         <div className="text-xs opacity-75 mt-1">当前溢价率</div>
                      </div>
                   </div>
                </div>
             )}

             <div className="flex justify-between items-end pb-2 mt-8">
                <div>
                   <h2 className="text-xl font-bold text-slate-800">全市场比价矩阵</h2>
                   <p className="text-slate-500 text-sm mt-1">综合当前价格与历史分位，助您寻找长期洼地</p>
                </div>
                {isOverviewLoading && <span className="text-xs text-blue-600 font-bold animate-pulse">正在同步6个月历史数据...</span>}
             </div>
             
             {/* New Ranking Table */}
             {isOverviewLoading ? (
               <div className="h-[400px] bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
                   <div className="text-sm text-slate-500">正在计算所有ETF的历史分位...</div>
                 </div>
               </div>
             ) : (
               <>
                 <EtfRankingTable datasets={allEtfData} onSelectEtf={handleSelectEtf} />
                 
                 <div className="mt-8">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">7日短期趋势对比</h3>
                    <ComparisonChart datasets={allEtfData} onSelectEtf={handleSelectEtf} />
                 </div>
               </>
             )}

             {/* CSV Import */}
             <div className="mt-8 pt-6 border-t border-slate-200 opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">高级功能: 导入CSV分析</p>
                <div className="flex gap-2">
                   <input 
                      className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xs font-mono focus:outline-none" 
                      placeholder="粘贴CSV内容: Date, Price(T), RefDate(T-1), RefValue"
                      value={csvInput}
                      onChange={(e) => setCsvInput(e.target.value)}
                   />
                   <button 
                      onClick={handleParseCsv}
                      disabled={!csvInput}
                      className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-700 disabled:opacity-50"
                   >
                     分析
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
             
             {/* Left Column: Chart & Data */}
             <div className="lg:col-span-8 flex flex-col gap-4">
                
                {/* Market Dashboard (Macro + Technicals) */}
                {latestDetailPoint && (
                   <MarketDashboard 
                      volatility={latestDetailPoint.volatility || 0}
                      rsi={latestDetailPoint.rsi || 0}
                      premium={latestDetailPoint.premiumRate}
                      historyPremiums={displayedDetailData.map(d => d.premiumRate)}
                      timeRangeLabel={timeRangeLabel}
                      lagDays={latestDetailPoint.lagDays}
                   />
                )}

                {/* Risk Advice Banner (Detail View) */}
                {!isDetailLoading && latestDetailPoint && detailRisk && (
                   <div className={`p-4 rounded-lg border flex items-start gap-4 ${detailRisk.bgColor} ${detailRisk.level === 'HIGH' ? 'border-rose-200' : 'border-slate-100'}`}>
                      <div className={`p-2 rounded-full bg-white/50 ${detailRisk.textColor}`}>
                         {detailRisk.level === 'SAFE' ? <TrophyIcon /> : <InfoIcon />}
                      </div>
                      <div>
                         <h3 className={`font-bold ${detailRisk.textColor}`}>当前评级: {detailRisk.label}</h3>
                         <p className="text-sm text-slate-700 mt-1">{detailRisk.advice}</p>
                         <div className="mt-2 text-xs text-slate-500">
                            当前溢价率 ({latestDetailPoint.premiumRate.toFixed(2)}%) 高于{timeRangeLabel} <strong>{premiumRank}%</strong> 的时间。
                         </div>
                      </div>
                   </div>
                )}

                <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setDetailTab('chart')}
                        className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${detailTab === 'chart' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        <ChartBarIcon /> 走势图
                      </button>
                      <button 
                        onClick={() => setDetailTab('data')}
                        className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${detailTab === 'data' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        <TableCellsIcon /> 详细数据
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
                      {[30, 90, 180, 365].map((days) => {
                         const label = days === 30 ? '1月' : days === 90 ? '3月' : days === 180 ? '半年' : '1年';
                         return (
                            <button
                               key={days}
                               onClick={() => setTimeRange(days)}
                               className={`px-2 py-1 text-xs font-medium rounded ${timeRange === days ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                               {label}
                            </button>
                         );
                      })}
                   </div>
                </div>

                {isDetailLoading ? (
                  <div className="h-[500px] bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                     <div className="flex flex-col items-center gap-3">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                       <span className="text-xs text-slate-500">正在同步官方净值与行情...</span>
                     </div>
                  </div>
                ) : (
                  <>
                    {detailTab === 'chart' ? (
                      <PremiumChart data={displayedDetailData} ticker={selectedTicker} />
                    ) : (
                      <DataTable data={displayedDetailData} />
                    )}
                  </>
                )}
             </div>

             {/* Right Column: AI Analysis */}
             <div className="lg:col-span-4 space-y-4">
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm sticky top-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">AI 智能分析师</h3>
                  
                  <div className="space-y-3 mb-6">
                    <button 
                      onClick={handleAnalyze}
                      disabled={analyzing || isDetailLoading || fullDetailData.length === 0}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white text-sm rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <SparklesIcon /> {analyzing ? '思考中...' : '深度诊断 (RSI/溢价)'}
                    </button>
                  </div>

                  {analysis && (
                    <div className="prose prose-sm prose-slate max-w-none max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         <div className="mb-4 pb-4 border-b border-slate-100">
                           <span className="text-xs font-bold text-emerald-600 uppercase mb-1 block">AI 诊断报告</span>
                           <ReactMarkdown>{analysis}</ReactMarkdown>
                         </div>
                    </div>
                  )}
                  
                  {!analysis && (
                    <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                      点击上方按钮，让 AI 结合技术指标为您分析。
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
