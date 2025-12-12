
import { EtfDataPoint, CalculationMethod, EtfProfile } from '../types';

// --- ETF 列表 (汉化) ---
export const POPULAR_ETFS: EtfProfile[] = [
  { 
    ticker: '513100', 
    marketCode: '1.513100', // SH
    name: '国泰纳斯达克100', 
    description: '成交活跃，流动性好，适合短线交易。',
    navSourceUrl: 'https://www.gtfund.com/',
    priceSourceUrl: 'https://quote.eastmoney.com/sh513100.html'
  },
  { 
    ticker: '159941', 
    marketCode: '0.159941', // SZ
    name: '广发纳斯达克100', 
    description: '规模大户，历史悠久，跟踪误差小。',
    navSourceUrl: 'http://www.gffunds.com.cn/',
    priceSourceUrl: 'https://quote.eastmoney.com/sz159941.html'
  },
  { 
    ticker: '159696', 
    marketCode: '0.159696', // SZ
    name: '易方达纳斯达克100', 
    description: '费率较低，适合长期定投。',
    navSourceUrl: 'https://www.efunds.com.cn/',
    priceSourceUrl: 'https://quote.eastmoney.com/sz159696.html'
  },
  { 
    ticker: '513300', 
    marketCode: '1.513300', // SH
    name: '华夏纳斯达克100', 
    description: '老牌基金公司，规模较大。',
    navSourceUrl: 'https://www.chinaamc.com/',
    priceSourceUrl: 'https://quote.eastmoney.com/sh513300.html'
  },
  { 
    ticker: '159501', 
    marketCode: '0.159501', // SZ
    name: '嘉实纳斯达克100', 
    description: '近年来新发产品，关注费率优惠。',
    navSourceUrl: 'http://www.jsfund.cn/',
    priceSourceUrl: 'https://quote.eastmoney.com/sz159501.html'
  },
  { 
    ticker: '159660', 
    marketCode: '0.159660', // SZ
    name: '汇添富纳斯达克100', 
    description: '知名基金公司管理。',
    navSourceUrl: 'https://www.99fund.com/',
    priceSourceUrl: 'https://quote.eastmoney.com/sz159660.html'
  },
  { 
    ticker: '159632', 
    marketCode: '0.159632', // SZ
    name: '华安纳斯达克100', 
    description: '华安基金管理。',
    navSourceUrl: 'https://www.huaan.com.cn/',
    priceSourceUrl: 'https://quote.eastmoney.com/sz159632.html'
  }
];

// --- 工具函数 ---

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const loadScriptData = (url: string, globalVarName: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      const data = (window as any)[globalVarName];
      document.body.removeChild(script);
      if (data) {
        resolve(data);
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      document.body.removeChild(script);
      reject(new Error(`Failed to load script: ${url}`));
    };

    document.body.appendChild(script);
  });
};

const fetchJsonp = (url: string, callbackParam: string = 'cb'): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_cb_' + Math.round(100000 * Math.random());
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    const script = document.createElement('script');
    script.src = `${url}${url.includes('?') ? '&' : '?'}${callbackParam}=${callbackName}`;
    script.onerror = () => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      reject(new Error(`JSONP request failed: ${url}`));
    };
    document.body.appendChild(script);
  });
};

// --- 技术指标计算 ---

/**
 * 计算 RSI (相对强弱指数)
 * period: 默认为 14
 */
const calculateRSI = (prices: number[], period: number = 14): number[] => {
  if (prices.length < period) return new Array(prices.length).fill(0);
  
  const rsiArray: number[] = new Array(period).fill(0); // 前面填充0
  let gains = 0;
  let losses = 0;

  // 初始平均
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;

  // 初始RSI
  rsiArray.push(100 - (100 / (1 + avgGain / (avgLoss === 0 ? 1 : avgLoss))));

  // 平滑计算后续
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiArray.push(100 - (100 / (1 + rs)));
  }

  return rsiArray;
};

/**
 * 计算历史波动率 (Historical Volatility)
 * 使用过去 N 天的对数收益率的标准差 * sqrt(252)
 */
const calculateVolatility = (prices: number[], windowSize: number = 30): number[] => {
  const volatilities: number[] = new Array(prices.length).fill(0);
  if (prices.length < windowSize + 1) return volatilities;

  // 计算对数收益率
  const logReturns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    logReturns.push(Math.log(prices[i] / prices[i - 1]));
  }

  for (let i = windowSize; i < prices.length; i++) {
    const slice = logReturns.slice(i - windowSize, i);
    const mean = slice.reduce((a, b) => a + b, 0) / windowSize;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (windowSize - 1);
    const stdDev = Math.sqrt(variance);
    // 年化波动率
    volatilities[i] = stdDev * Math.sqrt(252) * 100;
  }

  return volatilities;
};


// --- 风险分析工具 ---

export interface RiskAnalysis {
  level: 'SAFE' | 'NORMAL' | 'CAUTION' | 'HIGH';
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
  advice: string;
}

export const analyzeRisk = (premium: number): RiskAnalysis => {
  if (premium < 0.5) {
    return { 
      level: 'SAFE', 
      label: '超值低估', 
      color: '#10b981', 
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      advice: '当前价格接近或低于净值，是较好的配置时机。'
    };
  } else if (premium < 1.5) {
    return { 
      level: 'NORMAL', 
      label: '价格合理', 
      color: '#3b82f6',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      advice: '属于正常市场波动范围，适合定投或分批买入。'
    };
  } else if (premium < 3.0) {
    return { 
      level: 'CAUTION', 
      label: '明显溢价', 
      color: '#f59e0b',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      advice: '你正在支付额外成本。建议观望，或等待回调。'
    };
  } else {
    return { 
      level: 'HIGH', 
      label: '高危溢价', 
      color: '#ef4444',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      advice: '严重偏离真实价值！溢价回落将导致即刻亏损，请极度谨慎。'
    };
  }
};

/**
 * 获取详细的百分位统计数据
 */
export const getPercentileStats = (current: number, history: number[]) => {
  if (history.length === 0) return { rank: 0, max: 0, min: 0, avg: 0 };
  
  const sorted = [...history].sort((a, b) => a - b);
  const max = sorted[sorted.length - 1];
  const min = sorted[0];
  const avg = sorted.reduce((a,b) => a+b, 0) / sorted.length;
  
  // Rank: How many items are smaller than current?
  const rankIndex = sorted.findIndex(p => p >= current);
  const rank = rankIndex === -1 ? 100 : Math.round((rankIndex / sorted.length) * 100);
  
  return { rank, max, min, avg };
};

export const calculatePercentile = (current: number, history: number[]): number => {
  const { rank } = getPercentileStats(current, history);
  return rank;
};

/**
 * 综合评估 ETF 得分
 * 返回 0-100 分，分数越高越值得买
 */
export const evaluateEtf = (premium: number, rank: number): { score: number, label: string, color: string } => {
  // 基础分 100
  // 溢价率扣分: 每 1% 扣 20分
  let score = 100 - (premium * 20);
  
  // 百分位扣分: 每 10% rank 扣 2分
  score = score - (rank * 0.2);

  // 修正
  if (premium < 0) score += 10; // 折价奖励
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let label = '观望';
  let color = 'text-slate-500 bg-slate-100';

  if (score >= 80) {
    label = '强烈推荐';
    color = 'text-emerald-700 bg-emerald-100';
  } else if (score >= 60) {
    label = '推荐关注';
    color = 'text-blue-700 bg-blue-100';
  } else if (score >= 40) {
    label = '中性持有';
    color = 'text-amber-700 bg-amber-100';
  } else {
    label = '建议卖出';
    color = 'text-rose-700 bg-rose-100';
  }

  return { score: Math.round(score), label, color };
};

/**
 * 生成保姆式建议 - 综合结论版
 */
export const getNannyAdvice = (
  premium: number, 
  rank: number, 
  rsi: number, 
  volatility: number,
  score: number
): string => {
  let advice = "";

  // 1. 综合结论 (基于分数)
  if (score >= 80) {
    advice += "🔥 **综合结论：买入信号！** 综合评分优秀，当前价格具有极高性价比。";
  } else if (score >= 60) {
    advice += "👍 **综合结论：可以关注。** 整体基本面健康，适合分批建仓。";
  } else if (score >= 40) {
    advice += "✋ **综合结论：建议观望。** 性价比一般，现在买入可能不是最佳时机。";
  } else {
    advice += "🛑 **综合结论：强烈建议卖出/空仓！** 即使这是目前最好的选择，但绝对评分太低，市场风险极大。";
  }
  
  advice += "\n\n"; // Markdown 换行

  // 2. 溢价率分析 (Premium)
  advice += `🔹 **溢价区位 (${premium.toFixed(2)}%)：** `;
  if (premium < 0) {
    advice += "当前处于**折价**状态。意味着你可以用比净值更低的价格买入一篮子美股，这是非常明确的**安全边际**。";
  } else if (premium < 1.5) {
    advice += "溢价率较低。意味着你支付的额外成本很少，价格**公允**，没有太多泡沫。";
  } else {
    advice += "溢价率偏高。意味着你每买100元，就要多付" + premium.toFixed(1) + "元的**冤枉钱**给市场，这部分成本很难通过市场上涨赚回来。";
  }

  // 3. 历史分位分析 (Rank)
  advice += `\n🔹 **历史位置 (P${rank})：** `;
  if (rank < 20) {
    advice += "在过去半年里，现在的溢价率比80%的时间都要便宜。这是一个**底部区域**的信号。";
  } else if (rank > 80) {
    advice += "在过去半年里，现在的溢价率比80%的时间都要贵。这是一个**顶部区域**，历史上到达这个位置后通常会回落。";
  } else {
    advice += "处于历史平均水平。不算贵也不算便宜，缺乏明确的择时优势。";
  }

  // 4. RSI 分析
  advice += `\n🔹 **RSI指标 (${rsi.toFixed(1)})：** `;
  if (rsi < 30) {
    advice += "数值低于30，意味着市场**严重超卖**（跌过头了）。这种情况下，短期内出现反弹修复的概率很大。";
  } else if (rsi > 70) {
    advice += "数值高于70，意味着市场**严重超买**（涨过头了）。这种情况下，短期内回调下跌的风险很高。";
  } else {
    advice += "数值在30-70之间，市场情绪平稳，没有极端的反转信号。";
  }

  // 5. 波动率分析 (Volatility)
  advice += `\n🔹 **波动特征 (${volatility.toFixed(1)}%)：** `;
  if (volatility < 15) {
    advice += "波动率极低。意味着近期走势像**心电图直线**一样平稳，适合追求稳健的长期持有者。";
  } else if (volatility > 25) {
    advice += "波动率较高。意味着近期价格**上蹿下跳**剧烈。这提供了做差价（套利）的机会，但也极其考验心脏承受力，新手慎入。";
  } else {
    advice += "波动率适中，市场表现正常。";
  }

  return advice;
};


// --- 数据获取 ---

const fetchNavHistory = async (ticker: string): Promise<{ date: string; value: number }[]> => {
  try {
    const url = `https://fund.eastmoney.com/pingzhongdata/${ticker}.js?v=${Date.now()}`;
    (window as any).Data_netWorthTrend = null;

    const rawData = await loadScriptData(url, 'Data_netWorthTrend');
    
    if (!rawData || !Array.isArray(rawData)) {
      console.warn(`No NAV data found for ${ticker}`);
      return [];
    }

    return rawData.map((item: any) => ({
      date: formatDate(new Date(item.x)),
      value: parseFloat(item.y)
    }));
  } catch (error) {
    console.error("Error fetching NAV:", error);
    return [];
  }
};

const fetchPriceHistory = async (marketCode: string, days: number = 365): Promise<{ date: string; close: number }[]> => {
  try {
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${marketCode}&fields1=f1%2Cf2%2Cf3%2Cf4%2Cf5%2Cf6&fields2=f51%2Cf53&klt=101&fqt=1&end=20500101&lmt=${days}`;
    const response = await fetchJsonp(url, 'cb');
    
    if (!response || !response.data || !response.data.klines) {
      console.warn(`No Price data found for ${marketCode}`);
      return [];
    }

    return response.data.klines.map((line: string) => {
      const parts = line.split(',');
      return {
        date: parts[0],
        close: parseFloat(parts[1])
      };
    });
  } catch (error) {
    console.error("Error fetching Prices:", error);
    return [];
  }
};

// --- 核心逻辑 ---

export const fetchMarketData = async (ticker: string, method: CalculationMethod, days: number = 365): Promise<EtfDataPoint[]> => {
  const profile = POPULAR_ETFS.find(p => p.ticker === ticker);
  if (!profile) return [];

  const [navHistory, priceHistory] = await Promise.all([
    fetchNavHistory(ticker),
    fetchPriceHistory(profile.marketCode, days)
  ]);

  if (priceHistory.length === 0) return [];

  // 计算技术指标所需的纯价格数组
  const prices = priceHistory.map(p => p.close);
  const rsiSeries = calculateRSI(prices);
  const volSeries = calculateVolatility(prices);

  const combinedData: EtfDataPoint[] = [];

  priceHistory.forEach((pricePoint, index) => {
    const tradeDate = pricePoint.date;
    let refNav = null;
    let refNavDate = '';

    for (let i = navHistory.length - 1; i >= 0; i--) {
      if (navHistory[i].date < tradeDate) {
        refNav = navHistory[i].value;
        refNavDate = navHistory[i].date;
        break;
      }
    }

    if (refNav !== null) {
      const premium = ((pricePoint.close - refNav) / refNav) * 100;
      
      // Calculate Lag Days (Difference between Trade Date and NAV Date)
      const diffTime = new Date(tradeDate).getTime() - new Date(refNavDate).getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)); 

      combinedData.push({
        date: tradeDate,
        closePrice: pricePoint.close,
        refDate: refNavDate,
        referenceValue: refNav,
        premiumRate: parseFloat(premium.toFixed(2)),
        source: 'EastMoney (Real)',
        isReal: true,
        rsi: parseFloat(rsiSeries[index]?.toFixed(2)) || 0,
        volatility: parseFloat(volSeries[index]?.toFixed(2)) || 0,
        lagDays: diffDays
      });
    }
  });

  return combinedData;
};

export const parseCsvData = (csvContent: string): EtfDataPoint[] => {
  const lines = csvContent.trim().split('\n');
  const data: EtfDataPoint[] = [];

  lines.forEach((line) => {
    if (line.toLowerCase().includes('date') || line.toLowerCase().includes('price')) return;

    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 4) {
      const date = parts[0];
      const price = parseFloat(parts[1]);
      const refDate = parts[2];
      const ref = parseFloat(parts[3]);

      if (!isNaN(price) && !isNaN(ref)) {
        const premium = ((price - ref) / ref) * 100;
        data.push({
          date,
          closePrice: price,
          refDate,
          referenceValue: ref,
          premiumRate: Number(premium.toFixed(2)),
          source: 'User CSV',
          isReal: true,
          rsi: 0, 
          volatility: 0,
          lagDays: 0
        });
      }
    }
  });

  return data;
};
