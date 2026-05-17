import type { AgentTask, AgentResult, ToolHandler } from '@jarvis/shared';
import { BaseAgent } from '../base/BaseAgent.js';
import { getMcpServers } from '../mcp-config.js';
import { whatsappDispatchTool, whatsappGroupTool } from '@jarvis/tools';

const SYSTEM_PROMPT = `Você é o WhatsApp Agent do JARVIS.
Sua missão: automação de comunicação via WhatsApp para leads e grupos.

Ferramentas disponíveis:
- **supabase MCP**: Leia leads, atualize stages e scores.
- **whatsapp_dispatch_lead**: Dispara mensagem para lead (tool custom → ROIBOT).
- **whatsapp_group_automation**: Automação de grupos (tool custom → ROIBOT).

Fluxo follow-up:
1. Ler leads via Supabase MCP: SELECT id, name, phone, stage, score FROM leads WHERE whatsapp_opt_in=true AND stage='new' LIMIT 20
2. Para cada lead: criar mensagem personalizada
3. Disparar via whatsapp_dispatch_lead
4. Atualizar stage via Supabase MCP: UPDATE leads SET stage='contacted', updated_at=now() WHERE id=...

Regras críticas:
- Nunca mais de 3 mensagens por lead em 24h
- Tom humanizado, nunca robótico
- CTA claro e único por mensagem
- Respeitar opt-out imediatamente (UPDATE leads SET whatsapp_opt_in=false)`;

export class WhatsAppAgent extends BaseAgent {
  constructor() {
    const customTools: ToolHandler[] = [whatsappDispatchTool, whatsappGroupTool];

    super('whatsapp', customTools, SYSTEM_PROMPT, 'fast', getMcpServers('whatsapp'));
  }

  async run(task: AgentTask): Promise<AgentResult> {
    const { action = 'followup_new_leads' } = task.payload as { action?: string };

    const userMessage = action === 'followup_new_leads'
      ? `Leia leads novos do Supabase MCP (stage='new', whatsapp_opt_in=true).
         Para cada um: crie mensagem personalizada, dispare via whatsapp_dispatch_lead, atualize stage para 'contacted' via Supabase MCP.`
      : `Execute ação: ${action}. Payload: ${JSON.stringify(task.payload)}`;

    const result = await this.execute(task, userMessage);

    if (result.success) {
      await this.obsidian.writeLearning('whatsapp', `Ação: ${action} | Resultado: ${JSON.stringify(result.output)}`);
      await this.emitEvent('lead_updated', { agent: 'whatsapp', action, task_id: task.id });
    }

    return result;
  }
}
