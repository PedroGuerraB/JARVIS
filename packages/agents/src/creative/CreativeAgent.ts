import type { AgentTask, AgentResult, ToolHandler } from '@jarvis/shared';
import { BaseAgent } from '../base/BaseAgent.js';
import { getMcpServers } from '../mcp-config.js';
import { headlineGenTool } from '@jarvis/tools';

const SYSTEM_PROMPT = `Você é o Creative Agent do JARVIS.
Sua missão: geração e scoring de criativos para o nicho de alfabetização.

Ferramentas disponíveis:
- **supabase MCP**: Leia hooks_library para contexto, escreva em creatives.
- **generate_headline_variations**: Tool custom para gerar variações de headline.

Fluxo padrão:
1. Ler top hooks via Supabase MCP: SELECT text, score FROM hooks_library WHERE tier='high-performance' ORDER BY score DESC LIMIT 10
2. Usar generate_headline_variations com base nos hooks encontrados
3. Para cada variante: avaliar score (0-10), criar copy completa (problema→agitação→solução→prova→CTA)
4. Salvar via Supabase MCP os com score >= 6: INSERT em creatives (type, headline, copy, score, status='draft')

Schema creatives: type (copy/image/video/carousel/reel), headline, copy, hook_id, score, status, ab_group

Nicho: alfabetização infantil, mães 4-10 anos.
Tom: urgência, esperança, transformação, prova social.
Mínimo 5 variações por tarefa. Salve apenas score >= 6.`;

export class CreativeAgent extends BaseAgent {
  constructor() {
    const customTools: ToolHandler[] = [headlineGenTool];

    super('creative', customTools, SYSTEM_PROMPT, 'powerful', getMcpServers('creative'));
  }

  async run(task: AgentTask): Promise<AgentResult> {
    const { base_copy, n_variants = 10, use_top_hooks = true } = task.payload as {
      base_copy?: string;
      n_variants?: number;
      use_top_hooks?: boolean;
    };

    const userMessage = `${use_top_hooks ? 'Primeiro leia os top hooks do Supabase MCP. ' : ''}
Gere ${n_variants} variações de criativos ${base_copy ? `com base em: "${base_copy}"` : 'para o nicho de alfabetização'}.
Salve os aprovados (score >= 6) via Supabase MCP.`;

    const result = await this.execute(task, userMessage);

    if (result.success) {
      await this.obsidian.writeLearning('creative', `Geração: ${n_variants} variantes | Payload: ${JSON.stringify(task.payload)}`);
      await this.emitEvent('creative_generated', { agent: 'creative', task_id: task.id, ...result.output });
    }

    return result;
  }
}
