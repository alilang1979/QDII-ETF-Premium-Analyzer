
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
import { EtfDataPoint, EtfProfile } from '../types';

interface ComparisonChartProps {
  datasets: { profile: EtfProfile; data: EtfDataPoint[] }[];
  onSelectEtf: (ticker: string) => void;
}

const COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

const ComparisonChart: React.FC<ComparisonChartProps> = ({ datasets, onSelectEtf }) => {
  if (!datasets.length) return null;

  // Flatten data for Recharts: { date: '...', '159696': 2.5, '513100': 3.1 }
  const chartData = datasets[0].data.map((point, index) => {
    const entry: any = { date: point.date };
    datasets.forEach(d => {
      const match = d.data.find(p => p.date === point.date);
      if (match) {
        entry[d.profile.ticker] = match.premiumRate;
      }
    });
    return entry;
  });

  return (
    <div className="h-[450px] w-full bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">7日溢价率横向对比</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis 
            tick={{ fontSize: 11, fill: '#64748b' }} 
            label={{ value: '溢价率 (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            itemSorter={(item) => (item.value as number) * -1}
          />
          <Legend 
            verticalAlign="top" 
            height={60} 
            iconType="circle"
            onClick={(e) => onSelectEtf(e.dataKey as string)}
            wrapperStyle={{ cursor: 'pointer', fontSize: '12px' }}
          />
          <ReferenceLine y={0} stroke="#cbd5e1" />
          {datasets.map((d, i) => (
            <Line
              key={d.profile.ticker}
              type="monotone"
              dataKey={d.profile.ticker}
              name={`${d.profile.ticker} ${d.profile.name}`}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-slate-400 mt-2 italic">点击图例可隐藏/显示特定ETF，点击下方卡片查看详情</p>
    </div>
  );
};

export default ComparisonChart;
