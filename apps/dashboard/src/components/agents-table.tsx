'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatusDot } from './ui/status-dot';
import { timeAgo } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'error' | 'offline';
  last_heartbeat: string | null;
  capabilities: string[];
}

export function AgentsTable({ initial }: { initial: Agent[] }) {
  const [agents, setAgents] = useState<Agent[]>(initial);

  useEffect(() => {
    const channel = supabase
      .channel('agents-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agents' }, (payload) => {
        setAgents(prev => prev.map(a => a.id === (payload.new as Agent).id ? payload.new as Agent : a));
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--card-border)] text-left text-xs text-[var(--muted-fg)] uppercase tracking-wider">
            <th className="pb-3 pr-4">Agente</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Capacidades</th>
            <th className="pb-3">Último heartbeat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--card-border)]">
          {agents.map((agent) => (
            <tr key={agent.id} className="group">
              <td className="py-3 pr-4 font-medium text-[var(--foreground)]">{agent.name}</td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <StatusDot status={agent.status} />
                  <span className="text-[var(--muted-fg)]">{agent.status}</span>
                </div>
              </td>
              <td className="py-3 pr-4 text-[var(--muted-fg)] text-xs">
                {(agent.capabilities as unknown as string[]).slice(0, 2).join(', ')}
                {(agent.capabilities as unknown as string[]).length > 2 && ' ...'}
              </td>
              <td className="py-3 text-[var(--muted-fg)]">
                {agent.last_heartbeat ? timeAgo(agent.last_heartbeat) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
