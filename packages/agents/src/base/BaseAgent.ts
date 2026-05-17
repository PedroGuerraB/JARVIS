import Anthropic from '@anthropic-ai/sdk';
import { createClient, asInsert, asUpdate, type JarvisSupabaseClient } from '@jarvis/db';
import { ObsidianMemory, SupabaseMemory } from '@jarvis/memory';
import {
  AGENT_MAX_ITERATIONS,
  MODELS,
  type AgentName,
  type AgentResult,
  type AgentTask,
  type ToolHandler,
} from '@jarvis/shared';

export type { ToolHandler };

export interface McpServerConfig {
  name: string;
  url: string;
  authToken?: string | undefined;
}

// MCP tool names are prefixed with server name (e.g. "supabase__execute_sql")
function isMcpTool(toolName: string, mcpServers: McpServerConfig[]): boolean {
  return mcpServers.some(s => toolName.startsWith(`${s.name}__`) || toolName.startsWith(`${s.name}_`));
}

export abstract class BaseAgent {
  protected readonly client: Anthropic;
  protected readonly db: JarvisSupabaseClient;
  protected readonly obsidian: ObsidianMemory;
  protected readonly memory: SupabaseMemory;
  protected readonly model: string;
  protected readonly mcpServers: McpServerConfig[];

  constructor(
    readonly name: AgentName,
    protected readonly toolHandlers: ToolHandler[],
    protected readonly systemPrompt: string,
    model: keyof typeof MODELS = 'fast',
    mcpServers: McpServerConfig[] = [],
  ) {
    this.client = new Anthropic();
    this.db = createClient();
    this.obsidian = new ObsidianMemory();
    this.memory = new SupabaseMemory(this.db);
    this.model = MODELS[model];
    this.mcpServers = mcpServers;
  }

  abstract run(task: AgentTask): Promise<AgentResult>;

  protected async execute(task: AgentTask, userMessage: string): Promise<AgentResult> {
    const start = Date.now();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const context = await this.obsidian.readContext(this.name);
    const system = context
      ? `${this.systemPrompt}\n\n# Memória e Aprendizados Anteriores:\n${context}`
      : this.systemPrompt;

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage },
    ];

    // Build MCP servers config for Anthropic beta
    const mcpServersParam = this.mcpServers.map(s => ({
      type: 'url' as const,
      name: s.name,
      url: s.url,
      ...(s.authToken ? { authorization_token: s.authToken } : {}),
    }));

    const hasMcp = mcpServersParam.length > 0;
    const hasCustomTools = this.toolHandlers.length > 0;

    let iterations = 0;

    while (iterations < AGENT_MAX_ITERATIONS) {
      iterations++;

      // Use beta endpoint when MCP servers are configured
      const requestParams = {
        model: this.model,
        max_tokens: 8096,
        system,
        messages,
        ...(hasCustomTools ? { tools: this.toolHandlers.map(h => h.definition) } : {}),
      };

      const response = hasMcp
        ? await (this.client.beta.messages.create as Function)({
            ...requestParams,
            betas: ['mcp-client-2025-04-04'],
            mcp_servers: mcpServersParam,
          })
        : await this.client.messages.create(requestParams as Anthropic.MessageCreateParamsNonStreaming);

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      if (response.stop_reason === 'end_turn') {
        const textContent = response.content.find((b: { type: string }) => b.type === 'text') as { text: string } | undefined;
        const output = textContent ? { response: textContent.text } : {};
        await this.logExecution(task, true, totalInputTokens, totalOutputTokens, Date.now() - start);
        return {
          success: true,
          output,
          tokens_used: totalInputTokens + totalOutputTokens,
          duration_ms: Date.now() - start,
        };
      }

      if (response.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content as Array<{ type: string; id?: string; name?: string; input?: unknown }>) {
          if (block.type !== 'tool_use' || !block.id || !block.name) continue;

          // MCP tools are executed server-side by Anthropic — skip client handling
          if (isMcpTool(block.name, this.mcpServers)) continue;

          const handler = this.toolHandlers.find(h => h.definition.name === block.name);
          if (!handler) {
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'Tool not found', is_error: true });
            continue;
          }

          try {
            const result = await handler.execute(block.input as Record<string, unknown>);
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: msg, is_error: true });
          }
        }

        if (toolResults.length > 0) {
          messages.push({ role: 'user', content: toolResults });
        }
        continue;
      }

      break;
    }

    await this.logExecution(task, false, totalInputTokens, totalOutputTokens, Date.now() - start, 'Max iterations reached');
    return {
      success: false,
      output: {},
      tokens_used: totalInputTokens + totalOutputTokens,
      duration_ms: Date.now() - start,
      error: 'Max iterations reached',
    };
  }

  protected async emitEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    await this.db.from('agent_events').insert(asInsert({
      source_agent: this.name,
      event_type: eventType,
      payload,
    }));
  }

  private async logExecution(
    task: AgentTask,
    success: boolean,
    inputTokens: number,
    outputTokens: number,
    durationMs: number,
    error?: string,
  ): Promise<void> {
    const { data: agentRow } = await this.db.from('agents').select('id').eq('name', this.name).single();
    const agentId = (agentRow as { id?: string } | null)?.id ?? null;

    await this.db.from('agent_logs').insert(asInsert({
      agent_id: agentId,
      task_id: task.id,
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      duration_ms: durationMs,
      model: this.model,
      success,
      error: error ?? null,
    }));
  }

  protected async updateTaskStatus(taskId: string, status: string, error?: string): Promise<void> {
    await this.db.from('agent_tasks').update(asUpdate({
      status,
      completed_at: ['done', 'failed'].includes(status) ? new Date().toISOString() : undefined,
      ...(error ? { error } : {}),
    })).eq('id', taskId);
  }
}
