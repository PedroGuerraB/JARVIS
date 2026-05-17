'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import { Badge } from './ui/badge';

interface AgentEvent {
  id: string;
  source_agent: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

const EVENT_STYLE: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'muted' }> = {
  intel_available:     { label: 'Intel',    variant: 'info' },
  creative_generated:  { label: 'Criativo', variant: 'success' },
  lead_updated:        { label: 'Lead',     variant: 'info' },
  insight_generated:   { label: 'Insight',  variant: 'warning' },
  task_failed:         { label: 'Erro',     variant: 'danger' },
  alert:               { label: 'Alerta',   variant: 'warning' },
};

export function AlertFeed({ initial }: { initial: AgentEvent[] }) {
  const [events, setEvents] = useState<AgentEvent[]>(initial);

  useEffect(() => {
    const channel = supabase
      .channel('agent-events-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_events' }, (payload) => {
        setEvents(prev => [payload.new as AgentEvent, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  if (!events.length) {
    return <p className="text-sm text-[var(--muted-fg)] py-4">Aguardando eventos dos agentes...</p>;
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {events.map((ev) => {
        const style = EVENT_STYLE[ev.event_type] ?? { label: ev.event_type, variant: 'muted' as const };
        return (
          <div key={ev.id} className="flex items-start gap-3 text-sm">
            <span className="text-[var(--muted-fg)] shrink-0 text-xs pt-0.5 w-7">{timeAgo(ev.created_at)}</span>
            <Badge variant={style.variant}>{style.label}</Badge>
            <span className="text-[var(--muted-fg)] truncate">
              <span className="text-[var(--foreground)] font-medium">{ev.source_agent}</span>
              {' · '}
              {String((ev.payload as Record<string, unknown>)['response'] ?? ev.event_type)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
