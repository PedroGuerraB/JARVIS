import type { ToolHandler } from '@jarvis/shared';

const MINING_URL = process.env['ORGANIC_MINING_URL'] ?? '';
const MINING_KEY = process.env['ORGANIC_MINING_API_KEY'] ?? '';

export const organicMiningTool: ToolHandler = {
  definition: {
    name: 'mine_organic_offers',
    description: 'Minera ofertas e conteúdos virais no orgânico (Instagram, TikTok, etc)',
    input_schema: {
      type: 'object' as const,
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Palavras-chave para busca',
        },
        platform: {
          type: 'string',
          enum: ['instagram', 'tiktok', 'youtube', 'all'],
          description: 'Plataforma alvo',
        },
        limit: { type: 'number', description: 'Máximo de resultados' },
        min_engagement: { type: 'number', description: 'Engajamento mínimo' },
      },
      required: ['keywords'],
    },
  },
  execute: async (input) => {
    if (!MINING_URL) {
      // Placeholder até path ser configurado
      return {
        status: 'not_configured',
        message: 'ORGANIC_MINING_URL not set. Configure in .env.',
        mock_results: [
          { platform: 'instagram', hook: 'Meu filho não sabia ler...', engagement: 12400 },
          { platform: 'tiktok', hook: 'Em 21 dias qualquer criança aprende', engagement: 34200 },
        ],
      };
    }

    const res = await fetch(`${MINING_URL}/mine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(MINING_KEY ? { Authorization: `Bearer ${MINING_KEY}` } : {}),
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) throw new Error(`Organic mining failed: ${res.status}`);
    return res.json();
  },
};
