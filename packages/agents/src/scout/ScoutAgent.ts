import type { AgentTask, AgentResult, ToolHandler } from '@jarvis/shared';
import { BaseAgent } from '../base/BaseAgent.js';
import { getMcpServers } from '../mcp-config.js';
import { organicMiningTool } from '@jarvis/tools';

const SYSTEM_PROMPT = `Você é o Scout Agent do JARVIS.
Sua missão: mineração de anúncios e criativos do mercado de alfabetização.

Ferramentas disponíveis:
- **meta_ads MCP**: Use para buscar anúncios no Meta Ad Library. Prefira meta_ads__search_ads ou similar.
- **supabase MCP**: Use para persistir dados. Tabelas relevantes: ad_library, hooks_library.
- **mine_organic_offers**: Ferramenta custom para mineração no orgânico.

Fluxo padrão:
1. Buscar ads via Meta Ads MCP (keywords: alfabetização, método fônico, leitura infantil)
2. Buscar conteúdo orgânico via mine_organic_offers
3. Para cada item: analisar hook, classificar score (0-10), identificar padrão
4. Persistir no Supabase via MCP: INSERT na tabela ad_library (platform, url, copy, hook, score, viral_metrics)
5. Hooks únicos e relevantes: INSERT em hooks_library (text, category, score)

Schema ad_library: platform, url, copy, visual_description, hook, score, viral_metrics (jsonb), mined_at
Schema hooks_library: text, category, score, tier (default 'testing')

Nicho: alfabetização infantil. Público: mães de crianças 4-10 anos.
Limite: 20 items por execução. Priorize maior engajamento.
Ao finalizar, resuma quantos ads e hooks foram salvos.`;

export class ScoutAgent extends BaseAgent {
  constructor() {
    const customTools: ToolHandler[] = [organicMiningTool];

    super('scout', customTools, SYSTEM_PROMPT, 'fast', getMcpServers('scout'));
  }

  async run(task: AgentTask): Promise<AgentResult> {
    const { keywords = ['alfabetização', 'método fônico', 'criança lendo'], platform = 'meta' } = task.payload as {
      keywords?: string[];
      platform?: string;
    };

    const userMessage = `Mine anúncios sobre "${keywords.join(', ')}" na plataforma ${platform}.
Use o Meta Ads MCP para buscar anúncios e o Supabase MCP para persistir os resultados.
Também mine conteúdo orgânico via mine_organic_offers.`;

    const result = await this.execute(task, userMessage);

    if (result.success) {
      await this.obsidian.writeLearning('scout', `Task: ${JSON.stringify(task.payload)}\nResultado: ${JSON.stringify(result.output)}`);
      await this.emitEvent('intel_available', { agent: 'scout', task_id: task.id, ...result.output });
    }

    return result;
  }
}
