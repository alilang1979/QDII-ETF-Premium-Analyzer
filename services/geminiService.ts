
import { GoogleGenAI } from "@google/genai";
import { EtfDataPoint, CalculationMethod } from '../types';

const STORAGE_KEY = 'GEMINI_API_KEY';

export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const setStoredApiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY, key);
};

const getAiClient = () => {
  const apiKey = getStoredApiKey() || (typeof process !== 'undefined' && process.env ? process.env.API_KEY : null);
  
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzePremiumTrend = async (
  ticker: string, 
  data: EtfDataPoint[], 
  method: CalculationMethod
): Promise<string> => {
  try {
    const ai = getAiClient();
    const recentData = data.slice(-5);
    const context = recentData.map(d => 
      `日期: ${d.date}, 价格: ${d.closePrice}, 净值: ${d.referenceValue}, 溢价率: ${d.premiumRate}%, RSI: ${d.rsi}, 波动率: ${d.volatility}%`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        请分析代码为 ${ticker} 的ETF最近的溢价率趋势和技术指标。
        数据如下:
        ${context}
        
        请用**中文**提供 3 点简短的分析摘要，包括溢价风险、技术面(RSI/波动率)状态和操作建议。
        不要搜索网络，仅基于提供的数字进行数学和逻辑分析。
        格式要求 Markdown。
      `,
    });

    return response.text || "无法进行分析。";
  } catch (error: any) {
    console.error("Analysis Error:", error);
    if (error.message === "MISSING_API_KEY") {
      throw error; // Re-throw to be handled by UI
    }
    return "分析服务暂时不可用，请检查网络或 Key 是否有效。";
  }
};
