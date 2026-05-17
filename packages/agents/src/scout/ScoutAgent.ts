import type { AgentTask, AgentResult, ToolHandler } from '@jarvis/shared';
import { BaseAgent } from '../base/BaseAgent.js';
import { getMcpServers } from '../mcp-config.js';
import { organicMiningTool, metaAdLibraryTool } from '@jarvis/tools';

const SYSTEM_PROMPT = `Você é o Scout Agent do JARVIS.
Sua missão: mineração de anúncios e criativos do mercado de alfabetização.

Ferramentas disponíveis:
- **search_meta_ad_library**: Busca anúncios no Meta Ad Library via API direta.
- **mine_organic_offers**: Mineração de conteúdo orgânico (Instagram, TikTok, etc).
- **supabase MCP**: Persiste dados. Tabelas: ad_library, hooks_library.

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
    const customTools: ToolHandler[] = [organicMiningTool, metaAdLibraryTool];

    super('scout', customTools, SYSTEM_PROMPT, 'fast', getMcpServers('scout'));
  }

  async run(task: AgentTask): Promise<AgentResult> {
    const { keywords = ['alfabetização', 'método fônico', 'criança lendo'], platform = 'meta' } = task.payload as {
      keywords?: string[];
      platform?: string;
    };

    const userMessage = `Mine anúncios sobre "${keywords.join(', ')}" na plataforma ${platform}.
1. Busque ads via search_meta_ad_library
2. Mine orgânico via mine_organic_offers
3. Para cada item: analise hook, score 0-10
4. Persista via Supabase MCP (INSERT em ad_library e hooks_library)
Schema ad_library: platform, url, copy, hook, score, viral_metrics (jsonb)
Schema hooks_library: text, category, score, tier='testing'`;

    const result = await this.execute(task, userMessage);

    if (result.success) {
      await this.obsidian.writeLearning('scout', `Task: ${JSON.stringify(task.payload)}\nResultado: ${JSON.stringify(result.output)}`);
      await this.emitEvent('intel_available', { agent: 'scout', task_id: task.id, ...result.output });
    }

    return result;
  }
}
