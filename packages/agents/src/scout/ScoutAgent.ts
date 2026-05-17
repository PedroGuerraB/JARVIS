import { asInsert } from '@jarvis/db';
import type { AgentTask, AgentResult } from '@jarvis/shared';
import { BaseAgent, type ToolHandler } from '../base/BaseAgent.js';
import { organicMiningTool, metaAdLibraryTool } from '@jarvis/tools';

const SYSTEM_PROMPT = `Você é o Scout Agent do JARVIS.
Sua missão: mineração de anúncios e criativos do mercado de alfabetização.

Responsabilidades:
- Minerar anúncios no Meta Ad Library e conteúdo orgânico
- Identificar padrões virais em copies e hooks
- Classificar ads por score de viralidade
- Persistir intel na base de dados para outros agentes consumirem
- Aprender com histórico: evitar re-minerar o que já está catalogado

Foco de nicho: alfabetização infantil, método fônico, leitura para crianças.
Público-alvo dos anúncios: mães de crianças entre 4-10 anos.

Ao finalizar, sempre emita o evento 'intel_available' com resumo do que foi encontrado.`;

export class ScoutAgent extends BaseAgent {
  constructor() {
    const tools: ToolHandler[] = [
      organicMiningTool,
      metaAdLibraryTool,
      {
        definition: {
          name: 'save_ad_to_library',
          description: 'Salva um anúncio mineralizado na biblioteca de ads do Supabase',
          input_schema: {
            type: 'object' as const,
            properties: {
              platform: { type: 'string', enum: ['meta', 'instagram', 'tiktok', 'youtube', 'organic'] },
              url: { type: 'string' },
              copy: { type: 'string' },
              visual_description: { type: 'string' },
              hook: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 10 },
              viral_metrics: { type: 'object' },
            },
            required: ['platform'],
          },
        },
        execute: async (input) => {
          const { data, error } = await this.db.from('ad_library').insert(asInsert({
            platform: input['platform'] as string,
            url: (input['url'] as string | undefined) ?? null,
            copy: (input['copy'] as string | undefined) ?? null,
            visual_description: (input['visual_description'] as string | undefined) ?? null,
            hook: (input['hook'] as string | undefined) ?? null,
            score: (input['score'] as number | undefined) ?? null,
            viral_metrics: (input['viral_metrics'] as Record<string, unknown>) ?? {},
          })).select('id').single();

          if (error) throw new Error(error.message);
          const row = data as { id?: string } | null;
          return { saved: true, id: row?.id };
        },
      },
      {
        definition: {
          name: 'save_hook_to_library',
          description: 'Salva um hook descoberto na biblioteca de hooks',
          input_schema: {
            type: 'object' as const,
            properties: {
              text: { type: 'string' },
              category: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 10 },
            },
            required: ['text'],
          },
        },
        execute: async (input) => {
          const { data, error } = await this.db.from('hooks_library').insert(asInsert({
            text: input['text'] as string,
            category: (input['category'] as string | undefined) ?? null,
            score: (input['score'] as number | undefined) ?? 5.0,
          })).select('id').single();

          if (error) throw new Error(error.message);
          const row = data as { id?: string } | null;
          return { saved: true, id: row?.id };
        },
      },
    ];

    super('scout', tools, SYSTEM_PROMPT, 'fast');
  }

  async run(task: AgentTask): Promise<AgentResult> {
    const { keywords = ['alfabetização', 'método fônico', 'criança lendo'], platform = 'meta' } = task.payload as {
      keywords?: string[];
      platform?: string;
    };

    const userMessage = `Minere anúncios sobre "${keywords.join(', ')}" na plataforma ${platform}.
Para cada anúncio encontrado:
1. Analise o hook principal
2. Classifique o score de viralidade (0-10)
3. Salve na biblioteca usando save_ad_to_library
4. Se o hook for relevante e único, salve também com save_hook_to_library

Limite de 20 anúncios por execução. Priorize os com maior engajamento.`;

    const result = await this.execute(task, userMessage);

    if (result.success) {
      await this.obsidian.writeLearning('scout', `Task: ${JSON.stringify(task.payload)}\nResultado: ${JSON.stringify(result.output)}`);
      await this.emitEvent('intel_available', { agent: 'scout', task_id: task.id, ...result.output });
    }

    return result;
  }
}
