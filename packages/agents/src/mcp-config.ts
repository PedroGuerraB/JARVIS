import type { McpServerConfig } from './base/BaseAgent.js';

// Supabase MCP — official remote server
// Docs: https://supabase.com/docs/guides/getting-started/mcp
export const supabaseMcp: McpServerConfig = {
  name: 'supabase',
  url: process.env['SUPABASE_MCP_URL'] ?? 'https://mcp.supabase.com/sse',
  authToken: process.env['SUPABASE_PERSONAL_ACCESS_TOKEN'],
};

// Meta Ads MCP — configured in Claude Code as mcp__claude_ai_Meta_Ads_Oficial__*
// Get URL from: ~/.claude/settings.json → mcpServers → Meta_Ads_Oficial → url
export const metaAdsMcp: McpServerConfig = {
  name: 'meta_ads',
  url: process.env['META_ADS_MCP_URL'] ?? '',
  authToken: process.env['META_ADS_MCP_TOKEN'],
};

// Obsidian MCP — only if user has Local REST API plugin running
// Plugin: https://github.com/coddingtonbear/obsidian-local-rest-api
export const obsidianMcp: McpServerConfig = {
  name: 'obsidian',
  url: process.env['OBSIDIAN_MCP_URL'] ?? 'http://localhost:27123/mcp',
  authToken: process.env['OBSIDIAN_API_KEY'],
};

// Common MCP combos per agent role
export const MCP_PROFILES = {
  scout:      [supabaseMcp, metaAdsMcp],
  creative:   [supabaseMcp],
  whatsapp:   [supabaseMcp],
  analyst:    [supabaseMcp, metaAdsMcp],
  traffic:    [supabaseMcp, metaAdsMcp],
  bi:         [supabaseMcp],
  insight:    [supabaseMcp],
  learning:   [supabaseMcp],
  orchestrator: [supabaseMcp],
} as const;

export function getMcpServers(profile: keyof typeof MCP_PROFILES): McpServerConfig[] {
  return MCP_PROFILES[profile].filter(s => s.url.length > 0);
}
