export const AGENT_MAX_ITERATIONS = Number(process.env['AGENT_MAX_ITERATIONS'] ?? 25);
export const AGENT_DAILY_TOKEN_LIMIT = Number(process.env['AGENT_DAILY_TOKEN_LIMIT'] ?? 1_000_000);

export const MODELS = {
  powerful: 'claude-opus-4-7' as const,
  fast: 'claude-sonnet-4-6' as const,
  light: 'claude-haiku-4-5-20251001' as const,
} as const;
