import { createClient, asInsert, asUpdate } from '@jarvis/db';
import type { AgentName, AgentTask, TaskPriority } from '@jarvis/shared';
import { ScoutAgent } from '../scout/ScoutAgent.js';
import { CreativeAgent } from '../creative/CreativeAgent.js';
import { WhatsAppAgent } from '../whatsapp/WhatsAppAgent.js';

type AgentClass = { run: (task: AgentTask) => Promise<unknown> };

export class Orchestrator {
  private readonly db = createClient();
  private readonly agents: Partial<Record<AgentName, AgentClass>> = {};
  private running = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.agents['scout'] = new ScoutAgent();
    this.agents['creative'] = new CreativeAgent();
    this.agents['whatsapp'] = new WhatsAppAgent();
  }

  async start(pollMs = 5000): Promise<void> {
    console.log('[Orchestrator] Starting...');
    this.running = true;
    await this.heartbeat();
    this.pollInterval = setInterval(() => void this.processPendingTasks(), pollMs);
    console.log('[Orchestrator] Running. Polling every', pollMs, 'ms');
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.pollInterval) clearInterval(this.pollInterval);
    console.log('[Orchestrator] Stopped.');
  }

  async enqueue(agent: AgentName, type: string, payload: Record<string, unknown>, priority: TaskPriority = 3): Promise<string> {
    const { data: agentRow } = await this.db.from('agents').select('id').eq('name', agent).single();
    const agentId = (agentRow as { id?: string } | null)?.id ?? null;

    const { data, error } = await this.db.from('agent_tasks').insert(asInsert({
      agent_id: agentId,
      type,
      payload,
      priority,
    })).select('id').single();

    if (error) throw new Error(`Failed to enqueue task: ${error.message}`);
    const row = data as { id?: string } | null;
    console.log(`[Orchestrator] Enqueued ${agent}:${type} (id=${row?.id})`);
    return row?.id ?? '';
  }

  private async processPendingTasks(): Promise<void> {
    if (!this.running) return;

    const { data: tasks } = await this.db
      .from('agent_tasks')
      .select('*, agents(name)')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(5);

    if (!tasks?.length) return;

    for (const rawTask of tasks) {
      const task = rawTask as unknown as AgentTask & { agents?: { name: string } | null };
      const agentName = task.agents?.name as AgentName | undefined;

      if (!agentName || !this.agents[agentName]) {
        console.warn(`[Orchestrator] No agent registered for: ${agentName}`);
        continue;
      }

      await this.db.from('agent_tasks').update(asUpdate({ status: 'in_progress' })).eq('id', task.id);

      try {
        console.log(`[Orchestrator] Running ${agentName}:${task.type} (${task.id})`);
        await this.agents[agentName]!.run(task);
        await this.db.from('agent_tasks').update(asUpdate({
          status: 'done',
          completed_at: new Date().toISOString(),
        })).eq('id', task.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Orchestrator] Agent ${agentName} failed:`, msg);
        await this.db.from('agent_tasks').update(asUpdate({
          status: 'failed',
          error: msg,
          completed_at: new Date().toISOString(),
        })).eq('id', task.id);
      }
    }
  }

  private async heartbeat(): Promise<void> {
    await this.db.from('agents').update(asUpdate({
      status: 'idle',
      last_heartbeat: new Date().toISOString(),
    })).eq('name', 'orchestrator');
  }
}
