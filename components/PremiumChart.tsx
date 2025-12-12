
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { EtfDataPoint } from '../types';

interface PremiumChartProps {
  data: EtfDataPoint[];
  ticker: string;
}

const PremiumChart: React.FC<PremiumChartProps> = ({ data, ticker }) => {
  if (data.length === 0) {
    return (
      <div className="h-96 w-full flex items-center justify-center bg-white border rounded-lg text-slate-400">
        暂无数据
      </div>
    );
  }

  const premiums = data.map(d => d.premiumRate);
  const maxPrem = Math.max(...premiums);
  const minPrem = Math.min(...premiums);

  // Add some padding to domain
  const domainMax = Math.ceil(maxPrem + 1);
  const domainMin = Math.floor(minPrem - 1);

  return (
    <div className="h-[500px] w-full bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">历史走势: {ticker}</h3>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-800"></span>现价</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 opacity-50"></span>参考净值</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>溢价率</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#94a3b8' }} 
            minTickGap={30}
          />
          {/* Left Axis: Price & NAV */}
          <YAxis 
            yAxisId="left" 
            domain={['auto', 'auto']} 
            tick={{ fontSize: 12, fill: '#64748b' }}
            label={{ value: '价格 (元)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11 } }}
          />
          {/* Right Axis: Premium % */}
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            domain={[domainMin, domainMax]} 
            tick={{ fontSize: 12, fill: '#f43f5e' }}
            label={{ value: '溢价率 (%)', angle: 90, position: 'insideRight', style: { fill: '#f43f5e', fontSize: 11 } }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
            formatter={(value: number, name: string) => {
              if (name === 'premiumRate') return [`${value.toFixed(2)}%`, '溢价率'];
              if (name === 'closePrice') return [value.toFixed(3), '收盘价'];
              if (name === 'referenceValue') return [value.toFixed(4), '参考净值'];
              return [value, name];
            }}
          />
          
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="closePrice" 
            stroke="#1e293b" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 6, fill: '#1e293b' }}
            animationDuration={1000}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="referenceValue" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false}
            strokeDasharray="4 4"
            opacity={0.6}
            animationDuration={1000}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="premiumRate" 
            stroke="#f43f5e" 
            strokeWidth={2} 
            dot={false}
            animationDuration={1000}
          />
          <ReferenceLine yAxisId="right" y={0} stroke="#10b981" strokeDasharray="3 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PremiumChart;
