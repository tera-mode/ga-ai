'use client';

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatNumber } from '@/lib/utils';

interface ChartSpec {
  chartType: 'bar' | 'line' | 'table' | 'number';
  xField?: string;
  yField?: string;
  title?: string;
}

interface Props {
  chartSpec: ChartSpec;
  data: Array<Record<string, string | null>>;
}

export function DataChart({ chartSpec, data }: Props) {
  if (!data || data.length === 0) return null;

  const { chartType, xField, yField, title } = chartSpec;

  // 数値に変換
  const numericData = data.map((row) => {
    const out: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(row)) {
      const n = parseFloat(v ?? '');
      out[k] = isNaN(n) ? (v ?? '') : n;
    }
    return out;
  });

  const xKey = xField ?? Object.keys(numericData[0])[0];
  const yKey = yField ?? Object.keys(numericData[0]).find((k) => k !== xKey) ?? Object.keys(numericData[0])[1];

  if (chartType === 'number' && numericData.length > 0) {
    const val = numericData[0][yKey ?? xKey];
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        {title && <p className="mb-2 text-sm text-gray-500">{title}</p>}
        <p className="text-4xl font-bold text-blue-600">
          {typeof val === 'number' ? formatNumber(val) : val}
        </p>
      </div>
    );
  }

  if (chartType === 'table') {
    const fields = Object.keys(numericData[0]);
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {title && <p className="px-4 py-2.5 text-sm font-semibold text-gray-800 border-b border-gray-100">{title}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {fields.map((f) => (
                  <th key={f} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {numericData.slice(0, 20).map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  {fields.map((f) => (
                    <td key={f} className="px-3 py-2 text-gray-700 font-mono text-xs">
                      {typeof row[f] === 'number' ? formatNumber(row[f] as number) : String(row[f] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const display = numericData.slice(0, 20);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {title && <p className="mb-3 text-sm font-semibold text-gray-800">{title}</p>}
      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'line' ? (
          <LineChart data={display}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => typeof v === 'number' ? formatNumber(v) : v} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              formatter={(v) => [typeof v === 'number' ? formatNumber(v) : v, yKey]}
            />
            <Line type="monotone" dataKey={yKey} stroke="#2563EB" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={display}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => typeof v === 'number' ? formatNumber(v) : v} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              formatter={(v) => [typeof v === 'number' ? formatNumber(v) : v, yKey]}
            />
            <Bar dataKey={yKey} fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
