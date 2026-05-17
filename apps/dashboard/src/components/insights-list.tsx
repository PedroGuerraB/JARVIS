'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from './ui/badge';
import { timeAgo } from '@/lib/utils';

interface Recommendation {
  id: string;
  type: 'action' | 'alert' | 'opportunity' | 'warning';
  content: string;
  priority: number;
  impact_estimate: string | null;
  acted_on: boolean;
  created_at: string;
}

const TYPE_STYLE: Record<string, { label: string; variant: 'danger' | 'warning' | 'success' | 'info' }> = {
  alert:       { label: 'Alerta',       variant: 'danger' },
  warning:     { label: 'Atenção',      variant: 'warning' },
  opportunity: { label: 'Oportunidade', variant: 'success' },
  action:      { label: 'Ação',         variant: 'info' },
};

const PRIORITY_LABEL = ['', 'Crítico', 'Alto', 'Médio', 'Baixo', 'Info'];

export function InsightsList({ initial }: { initial: Recommendation[] }) {
  const [items, setItems] = useState<Recommendation[]>(initial);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const channel = supabase
      .channel('recommendations-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'recommendations' }, (payload) => {
        setItems(prev => [payload.new as Recommendation, ...prev]);
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  async function markActedOn(id: string) {
    await supabase.from('recommendations').update({ acted_on: true, acted_on_at: new Date().toISOString() } as never).eq('id', id);
    startTransition(() => setItems(prev => prev.filter(i => i.id !== id)));
  }

  if (!items.length) {
    return (
      <p className="text-sm text-[var(--muted-fg)] py-4">Nenhuma recomendação pendente. Os agentes estão monitorando.</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const style = TYPE_STYLE[item.type] ?? TYPE_STYLE['action']!;
        return (
          <div key={item.id} className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)] p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={style.variant}>{style.label}</Badge>
              <span className="text-xs text-[var(--muted-fg)]">P{item.priority} · {PRIORITY_LABEL[item.priority]}</span>
              <span className="ml-auto text-xs text-[var(--muted-fg)]">{timeAgo(item.created_at)}</span>
            </div>

            <p className="text-sm text-[var(--foreground)]">{item.content}</p>

            {item.impact_estimate && (
              <p className="text-xs text-[var(--muted-fg)]">Impacto estimado: {item.impact_estimate}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => void markActedOn(item.id)}
                className="text-xs px-3 py-1 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-muted)] transition-colors"
              >
                Aplicar
              </button>
              <button
                onClick={() => void markActedOn(item.id)}
                className="text-xs px-3 py-1 rounded-md border border-[var(--card-border)] text-[var(--muted-fg)] hover:text-[var(--foreground)] transition-colors"
              >
                Ignorar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
