import type { McpServerConfig } from './base/BaseAgent.js';

// Supabase MCP — remote HTTP/SSE server (works with Anthropic API mcp_servers)
// PAT: https://supabase.com/dashboard/account/tokens
// The local stdio MCP (@supabase/mcp-server-supabase) in ~/.claude.json is for
// Claude Code only — Anthropic API needs the remote SSE endpoint.
export const supabaseMcp: McpServerConfig = {
  name: 'supabase',
  url: 'https://mcp.supabase.com/sse',
  authToken: process.env['SUPABASE_PERSONAL_ACCESS_TOKEN'],
};

// Meta Ads — no official MCP server available.
// Using direct Meta API via custom tool wrapper in packages/tools/src/meta-ads/
// (mcp__claude_ai_Meta_Ads_Oficial__ only exists as a claude.ai web plugin, not local)

// Obsidian MCP — optional, only if Local REST API plugin is running in Obsidian app
// Plugin: https://github.com/coddingtonbear/obsidian-local-rest-api
export const obsidianMcp: McpServerConfig = {
  name: 'obsidian',
  url: process.env['OBSIDIAN_MCP_URL'] ?? 'http://localhost:27123/mcp',
  authToken: process.env['OBSIDIAN_API_KEY'],
};

// MCP profiles per agent — only Supabase remote MCP for now
export const MCP_PROFILES = {
  scout:       [supabaseMcp],
  creative:    [supabaseMcp],
  whatsapp:    [supabaseMcp],
  analyst:     [supabaseMcp],
  traffic:     [supabaseMcp],
  bi:          [supabaseMcp],
  insight:     [supabaseMcp],
  learning:    [supabaseMcp],
  orchestrator:[supabaseMcp],
} as const;

export function getMcpServers(profile: keyof typeof MCP_PROFILES): McpServerConfig[] {
  return MCP_PROFILES[profile].filter(s => Boolean(s.url) && Boolean(s.authToken));
}
