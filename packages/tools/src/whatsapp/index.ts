import type { ToolHandler } from '@jarvis/shared';

const ROIBOT_URL = process.env['ROIBOT_API_URL'] ?? 'http://localhost:3001';
const ROIBOT_KEY = process.env['ROIBOT_API_KEY'] ?? '';

async function roibotPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${ROIBOT_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ROIBOT_KEY ? { Authorization: `Bearer ${ROIBOT_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`ROIBOT ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export const whatsappDispatchTool: ToolHandler = {
  definition: {
    name: 'whatsapp_dispatch_lead',
    description: 'Dispara mensagem automática para um lead via WhatsApp',
    input_schema: {
      type: 'object' as const,
      properties: {
        lead_id: { type: 'string', description: 'ID do lead no banco' },
        phone: { type: 'string', description: 'Número com DDI (ex: 5511999999999)' },
        message: { type: 'string', description: 'Mensagem a ser enviada' },
        template: { type: 'string', description: 'Nome do template pré-aprovado (opcional)' },
        variables: { type: 'object', description: 'Variáveis do template' },
      },
      required: ['phone', 'message'],
    },
  },
  execute: async (input) => {
    return roibotPost('/api/dispatch', {
      phone: input['phone'],
      message: input['message'],
      template: input['template'],
      variables: input['variables'],
      metadata: { lead_id: input['lead_id'] },
    });
  },
};

export const whatsappGroupTool: ToolHandler = {
  definition: {
    name: 'whatsapp_group_automation',
    description: 'Executa automação em grupos do WhatsApp',
    input_schema: {
      type: 'object' as const,
      properties: {
        group_id: { type: 'string', description: 'ID do grupo WhatsApp' },
        action: { type: 'string', enum: ['send_message', 'pin_message', 'schedule'], description: 'Ação a executar' },
        content: { type: 'string', description: 'Conteúdo da mensagem' },
        schedule_at: { type: 'string', description: 'ISO datetime para agendamento' },
      },
      required: ['group_id', 'action', 'content'],
    },
  },
  execute: async (input) => {
    return roibotPost('/api/groups/automate', {
      group_id: input['group_id'],
      action: input['action'],
      content: input['content'],
      schedule_at: input['schedule_at'],
    });
  },
};
