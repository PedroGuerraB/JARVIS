import { asInsert } from '@jarvis/db';
import type { AgentTask, AgentResult } from '@jarvis/shared';
import { BaseAgent, type ToolHandler } from '../base/BaseAgent.js';
import { headlineGenTool } from '@jarvis/tools';

const SYSTEM_PROMPT = `Você é o Creative Agent do JARVIS.
Sua missão: geração e scoring de criativos para o nicho de alfabetização.

Responsabilidades:
- Gerar variações de headlines e copies com base em hooks validados
- Usar a memória de hooks vencedores para orientar a criação
- Classificar criativos por potencial antes de salvar
- Gerar estrutura completa: headline + copy + CTA

Nicho: alfabetização infantil, mães de crianças 4-10 anos.
Tom: urgência, esperança, transformação, prova social.

Sempre gere mínimo 5 variações por tarefa. Salve apenas as com score >= 6.`;

export class CreativeAgent extends BaseAgent {
  constructor() {
    const tools: ToolHandler[] = [
      headlineGenTool,
      {
        definition: {
          name: 'get_top_hooks',
          description: 'Busca os hooks com melhor score da biblioteca para usar como base',
          input_schema: {
            type: 'object' as const,
            properties: {
              limit: { type: 'number', default: 10 },
              tier: { type: 'string', enum: ['high-performance', 'testing'] },
            },
          },
        },
        execute: async (input) => {
          const { data } = await this.db
            .from('hooks_library')
            .select('id, text, category, score, conversion_rate')
            .eq('tier', (input['tier'] as string) ?? 'high-performance')
            .order('score', { ascending: false })
            .limit((input['limit'] as number) ?? 10);

          return data ?? [];
        },
      },
      {
        definition: {
          name: 'save_creative',
          description: 'Salva um criativo gerado no banco com score e status',
          input_schema: {
            type: 'object' as const,
            properties: {
              type: { type: 'string', enum: ['copy', 'image', 'video', 'carousel', 'reel'] },
              headline: { type: 'string' },
              copy: { type: 'string' },
              hook_id: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 10 },
              ab_group: { type: 'string' },
            },
            required: ['type', 'headline', 'score'],
          },
        },
        execute: async (input) => {
          const score = input['score'] as number;
          if (score < 6) return { saved: false, reason: 'Score below threshold (6.0)' };

          const { data, error } = await this.db.from('creatives').insert(asInsert({
            type: input['type'] as string,
            headline: (input['headline'] as string | undefined) ?? null,
            copy: (input['copy'] as string | undefined) ?? null,
            hook_id: (input['hook_id'] as string | undefined) ?? null,
            score,
            ab_group: (input['ab_group'] as string | undefined) ?? null,
          })).select('id').single();

          if (error) throw new Error(error.message);
          const row = data as { id?: string } | null;
          return { saved: true, id: row?.id, score };
        },
      },
    ];

    super('creative', tools, SYSTEM_PROMPT, 'powerful');
  }

  async run(task: AgentTask): Promise<AgentResult> {
    const { base_copy, n_variants = 10, use_top_hooks = true } = task.payload as {
      base_copy?: string;
      n_variants?: number;
      use_top_hooks?: boolean;
    };

    const userMessage = `${use_top_hooks ? 'Primeiro busque os top hooks com get_top_hooks. ' : ''}
Gere ${n_variants} variações de criativos ${base_copy ? `com base em: "${base_copy}"` : 'para o nicho de alfabetização'}.

Para cada criativo:
1. Crie headline (max 10 palavras, impacto imediato)
2. Crie copy completa (problema → agitação → solução → prova → CTA)
3. Classifique score de 0-10
4. Salve com save_creative (apenas score >= 6)`;

    const result = await this.execute(task, userMessage);

    if (result.success) {
      await this.obsidian.writeLearning('creative', `Geração: ${n_variants} variantes | Payload: ${JSON.stringify(task.payload)}`);
      await this.emitEvent('creative_generated', { agent: 'creative', task_id: task.id, ...result.output });
    }

    return result;
  }
}
