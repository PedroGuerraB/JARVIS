import type { ToolHandler } from '@jarvis/shared';

const HEADLINE_URL = process.env['HEADLINE_GEN_URL'] ?? '';
const HEADLINE_KEY = process.env['HEADLINE_GEN_API_KEY'] ?? '';

export const headlineGenTool: ToolHandler = {
  definition: {
    name: 'generate_headline_variations',
    description: 'Gera variações de headline para criativos com base em copy base',
    input_schema: {
      type: 'object' as const,
      properties: {
        base_copy: { type: 'string', description: 'Copy ou contexto base' },
        n_variants: { type: 'number', description: 'Número de variações (default 10)', default: 10 },
        tone: {
          type: 'string',
          enum: ['urgency', 'curiosity', 'social_proof', 'transformation', 'fear'],
          description: 'Tom emocional principal',
        },
        max_chars: { type: 'number', description: 'Máximo de caracteres por headline', default: 80 },
      },
      required: ['base_copy'],
    },
  },
  execute: async (input) => {
    if (!HEADLINE_URL) {
      return {
        status: 'not_configured',
        message: 'HEADLINE_GEN_URL not set. Configure in .env.',
        mock_variants: [
          'Seu filho vai aprender a ler em 21 dias (ou você recebe o dinheiro de volta)',
          'A técnica que 12.847 mães usaram para alfabetizar o filho em casa',
          'Por que seu filho ainda não lê? (A resposta vai te surpreender)',
        ],
      };
    }

    const res = await fetch(`${HEADLINE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HEADLINE_KEY ? { Authorization: `Bearer ${HEADLINE_KEY}` } : {}),
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) throw new Error(`Headline gen failed: ${res.status}`);
    return res.json();
  },
};
