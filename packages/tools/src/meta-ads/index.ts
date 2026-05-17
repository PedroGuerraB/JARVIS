import type { ToolHandler } from '@jarvis/shared';

const ACCESS_TOKEN = process.env['META_ACCESS_TOKEN'] ?? '';
const AD_ACCOUNT_ID = process.env['META_AD_ACCOUNT_ID'] ?? '';
const API_VERSION = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export const metaAdLibraryTool: ToolHandler = {
  definition: {
    name: 'search_meta_ad_library',
    description: 'Busca anúncios ativos no Meta Ad Library por palavras-chave',
    input_schema: {
      type: 'object' as const,
      properties: {
        search_terms: { type: 'string', description: 'Termos de busca' },
        country: { type: 'string', default: 'BR', description: 'Código do país' },
        limit: { type: 'number', default: 20, description: 'Máximo de resultados' },
        ad_type: { type: 'string', enum: ['ALL', 'POLITICAL_AND_ISSUE_ADS'], default: 'ALL' },
      },
      required: ['search_terms'],
    },
  },
  execute: async (input) => {
    if (!ACCESS_TOKEN) {
      return {
        status: 'not_configured',
        message: 'META_ACCESS_TOKEN not set.',
        mock_ads: [
          { id: 'mock1', page_name: 'Alfabetização Fácil', ad_creative_body: 'Seu filho pode aprender a ler...', impressions: { lower_bound: '10000' } },
        ],
      };
    }

    const params = new URLSearchParams({
      search_terms: input['search_terms'] as string,
      ad_reached_countries: (input['country'] as string) ?? 'BR',
      ad_type: (input['ad_type'] as string) ?? 'ALL',
      limit: String((input['limit'] as number) ?? 20),
      fields: 'id,ad_creative_body,ad_creative_link_title,page_name,impressions,ad_delivery_start_time',
      access_token: ACCESS_TOKEN,
    });

    const res = await fetch(`${BASE_URL}/ads_archive?${params}`);
    if (!res.ok) throw new Error(`Meta Ad Library failed: ${res.status} ${await res.text()}`);
    return res.json();
  },
};
