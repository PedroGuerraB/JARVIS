'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface DataPoint { date: string; value: number }

export function RevenueChart({ data }: { data: DataPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[var(--muted-fg)]">
        Sem dados de receita ainda
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R$${v}`} width={50} />
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(value: number) => [formatCurrency(value), 'Receita']}
        />
        <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fill="url(#grad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
