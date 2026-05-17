import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentsTable } from '@/components/agents-table';
import { AgentLogFeed } from '@/components/agent-log-feed';

async function getData() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [agentsResult, logsResult, tokenResult] = await Promise.all([
    supabase.from('agents').select('*').order('name'),
    supabase.from('agent_events').select('*').order('created_at', { ascending: false }).limit(40),
    supabase.from('agent_logs').select('tokens_input, tokens_output, model').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
  ]);

  const tokensByModel: Record<string, number> = {};
  for (const log of logsResult.data ?? []) {
    const l = log as { tokens_input: number; tokens_output: number; model: string };
    tokensByModel[l.model] = (tokensByModel[l.model] ?? 0) + l.tokens_input + l.tokens_output;
  }

  const totalTokens = Object.values(tokensByModel).reduce((a, b) => a + b, 0);

  return {
    agents: agentsResult.data ?? [],
    logs: logsResult.data ?? [],
    totalTokens,
  };
}

export default async function AgentsPage() {
  const { agents, logs, totalTokens } = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Agentes</h1>
        <p className="text-sm text-[var(--muted-fg)]">Status em tempo real · {totalTokens.toLocaleString('pt-BR')} tokens hoje</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Status dos Agentes</CardTitle></CardHeader>
        <AgentsTable initial={agents as Parameters<typeof AgentsTable>[0]['initial']} />
      </Card>

      <Card>
        <CardHeader><CardTitle>Log em Tempo Real</CardTitle></CardHeader>
        <AgentLogFeed initial={logs as Parameters<typeof AgentLogFeed>[0]['initial']} />
      </Card>
    </div>
  );
}
