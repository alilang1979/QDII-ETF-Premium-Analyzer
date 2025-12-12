
export enum CalculationMethod {
  REALTIME_IOPV = 'REALTIME_IOPV', // 方式1: 盘中估算 (静态IOPV)
  PRECISE_NAV = 'PRECISE_NAV'      // 方式2: 盘后精准 (T-1 官方净值)
}

export interface EtfProfile {
  ticker: string;
  marketCode: string; // '0' for SZ, '1' for SH (用于东财接口)
  name: string;
  description: string;
  navSourceUrl: string;   // 基金官网链接
  priceSourceUrl: string; // 行情网站链接
}

export interface EtfDataPoint {
  date: string;       // 中国交易日 (T日)
  closePrice: number; // T日收盘价
  refDate: string;    // 参考净值日期 (通常为美股 T-1)
  referenceValue: number; // 参考净值 (NAV 或 IOPV)
  premiumRate: number;    // 溢价率
  source: string;
  isReal?: boolean;
  
  // 新增决策指标
  rsi?: number;           // 相对强弱指标 (14日)
  volatility?: number;    // 历史波动率 (30日年化)
  lagDays?: number;       // 净值滞后天数 (用于判断数据是否失真)
}

export interface AnalysisResult {
  summary: string;
  riskAssessment: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  keyInsights: string[];
}
