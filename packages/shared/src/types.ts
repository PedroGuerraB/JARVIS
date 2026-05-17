import type Anthropic from '@anthropic-ai/sdk';

export interface ToolHandler {
  definition: Anthropic.Tool;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

export type AgentName =
  | 'orchestrator'
  | 'scout'
  | 'creative'
  | 'whatsapp'
  | 'analyst'
  | 'traffic'
  | 'bi'
  | 'insight'
  | 'learning';

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'failed' | 'cancelled';
export type TaskPriority = 1 | 2 | 3 | 4 | 5;
export type AgentStatus = 'idle' | 'running' | 'error' | 'offline';
export type EventType =
  | 'task_created'
  | 'task_started'
  | 'task_done'
  | 'task_failed'
  | 'intel_available'
  | 'creative_generated'
  | 'lead_updated'
  | 'insight_generated'
  | 'learning_updated'
  | 'alert';

export interface AgentTask {
  id: string;
  agent: AgentName;
  type: string;
  payload: Record<string, unknown>;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  completed_at?: string;
  error?: string;
}

export interface AgentResult {
  success: boolean;
  output: Record<string, unknown>;
  tokens_used: number;
  duration_ms: number;
  error?: string;
}

export interface AgentEvent {
  id: string;
  source_agent: AgentName;
  event_type: EventType;
  payload: Record<string, unknown>;
  created_at: string;
}
