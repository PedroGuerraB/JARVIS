'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import { Badge } from './ui/badge';

interface Event {
  id: string;
  source_agent: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export function AgentLogFeed({ initial }: { initial: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initial);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel('agent-log-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_events' }, (payload) => {
        setEvents(prev => [payload.new as Event, ...prev].slice(0, 100));
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="font-mono text-xs space-y-1.5 max-h-96 overflow-y-auto pr-1" ref={bottomRef}>
      {events.length === 0 && (
        <p className="text-[var(--muted-fg)] py-4 font-sans text-sm">Sem eventos. Inicie o orchestrator.</p>
      )}
      {events.map((ev) => (
        <div key={ev.id} className="flex items-start gap-3">
          <span className="text-[var(--muted-fg)] shrink-0 w-16">{timeAgo(ev.created_at)}</span>
          <Badge variant="muted" className="shrink-0">{ev.source_agent}</Badge>
          <span className="text-emerald-400">{ev.event_type}</span>
          <span className="text-[var(--muted-fg)] truncate">
            {JSON.stringify(ev.payload).slice(0, 80)}
          </span>
        </div>
      ))}
    </div>
  );
}
