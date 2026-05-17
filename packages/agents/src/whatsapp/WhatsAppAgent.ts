import { asUpdate } from '@jarvis/db';
import type { AgentTask, AgentResult } from '@jarvis/shared';
import { BaseAgent, type ToolHandler } from '../base/BaseAgent.js';
import { whatsappDispatchTool, whatsappGroupTool } from '@jarvis/tools';

const SYSTEM_PROMPT = `Você é o WhatsApp Agent do JARVIS.
Sua missão: automação de comunicação via WhatsApp para leads e grupos.

Responsabilidades:
- Disparar sequências personalizadas para leads que chegam
- Fazer follow-up baseado no score e estágio do lead
- Gerenciar automações de grupos (conteúdo, engajamento)
- Atualizar score do lead com base nas respostas

Regras críticas:
- Nunca disparar mais de 3 mensagens por lead em 24h
- Tom sempre humanizado, nunca robótico
- Sempre incluir CTA claro e único por mensagem
- Respeitar opt-out imediatamente`;

export class WhatsAppAgent extends BaseAgent {
  constructor() {
    const tools: ToolHandler[] = [
      whatsappDispatchTool,
      whatsappGroupTool,
      {
        definition: {
          name: 'get_leads_for_followup',
          description: 'Busca leads que precisam de follow-up',
          input_schema: {
            type: 'object' as const,
            properties: {
              stage: { type: 'string' },
              min_score: { type: 'number' },
              limit: { type: 'number' },
            },
          },
        },
        execute: async (input) => {
          const { data } = await this.db
            .from('leads')
            .select('id, name, phone, stage, score, metadata')
            .eq('whatsapp_opt_in', true)
            .eq('stage', (input['stage'] as string) ?? 'new')
            .gte('score', (input['min_score'] as number) ?? 0)
            .limit((input['limit'] as number) ?? 20);

          return data ?? [];
        },
      },
      {
        definition: {
          name: 'update_lead_stage',
          description: 'Atualiza estágio e score do lead após interação',
          input_schema: {
            type: 'object' as const,
            properties: {
              lead_id: { type: 'string' },
              stage: { type: 'string' },
              score_delta: { type: 'number' },
            },
            required: ['lead_id'],
          },
        },
        execute: async (input) => {
          const lead_id = input['lead_id'] as string;
          const { data: current } = await this.db
            .from('leads')
            .select('score')
            .eq('id', lead_id)
            .single();

          const currentScore = (current as { score?: number } | null)?.score ?? 0;
          const newScore = Math.min(100, Math.max(0, currentScore + ((input['score_delta'] as number) ?? 0)));

          const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (input['stage']) update['stage'] = input['stage'];
          if (input['score_delta']) update['score'] = newScore;

          const { error } = await this.db.from('leads').update(asUpdate(update)).eq('id', lead_id);
          if (error) throw new Error(error.message);

          return { updated: true, new_score: newScore };
        },
      },
    ];

    super('whatsapp', tools, SYSTEM_PROMPT, 'fast');
  }

  async run(task: AgentTask): Promise<AgentResult> {
    const { action = 'followup_new_leads' } = task.payload as { action?: string };

    const userMessage = action === 'followup_new_leads'
      ? `Busque leads novos com get_leads_for_followup (stage='new').
         Para cada lead:
         1. Crie mensagem de boas-vindas personalizada
         2. Dispare via whatsapp_dispatch_lead
         3. Atualize o stage para 'contacted' com update_lead_stage`
      : `Execute ação: ${action}. Payload: ${JSON.stringify(task.payload)}`;

    const result = await this.execute(task, userMessage);

    if (result.success) {
      await this.obsidian.writeLearning('whatsapp', `Ação: ${action} | Resultado: ${JSON.stringify(result.output)}`);
      await this.emitEvent('lead_updated', { agent: 'whatsapp', action, task_id: task.id });
    }

    return result;
  }
}
