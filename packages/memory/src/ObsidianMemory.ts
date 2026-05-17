import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { AgentName } from '@jarvis/shared';

const VAULT = process.env['OBSIDIAN_VAULT_PATH'] ?? '/Users/pedroguerra/JARVIS-Vault';

const VAULT_STRUCTURE = [
  'Agents/scout', 'Agents/creative', 'Agents/whatsapp',
  'Agents/analyst', 'Agents/traffic', 'Agents/bi',
  'Agents/insight', 'Agents/learning', 'Agents/orchestrator',
  'Offers/Active', 'Offers/Winners', 'Offers/Testing',
  'Hooks/High-Performance', 'Hooks/Testing', 'Hooks/Graveyard',
  'Seasonal',
  'Playbooks',
  'Insights/Daily', 'Insights/Strategic',
];

export class ObsidianMemory {
  private vault: string;

  constructor(vaultPath?: string) {
    this.vault = vaultPath ?? VAULT;
  }

  async init(): Promise<void> {
    for (const dir of VAULT_STRUCTURE) {
      await fs.mkdir(path.join(this.vault, dir), { recursive: true });
    }
  }

  async readContext(agent: AgentName): Promise<string> {
    const agentDir = path.join(this.vault, 'Agents', agent);
    const files = ['learnings.md', 'patterns.md', 'winners.md'];
    const parts: string[] = [];

    for (const file of files) {
      const filePath = path.join(agentDir, file);
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = matter(raw);
        parts.push(`## ${file.replace('.md', '')}\n${parsed.content}`);
      } catch {
        // file doesn't exist yet — skip
      }
    }

    return parts.join('\n\n');
  }

  async writeLearning(agent: AgentName, content: string, frontmatter?: Record<string, unknown>): Promise<void> {
    const filePath = path.join(this.vault, 'Agents', agent, 'learnings.md');
    const existing = await this.readFile(filePath);

    const timestamp = new Date().toISOString();
    const entry = `\n\n### ${timestamp}\n${content}`;

    if (existing) {
      const parsed = matter(existing);
      await this.writeFile(filePath, { ...parsed.data, ...frontmatter, updated_at: timestamp }, parsed.content + entry);
    } else {
      await this.writeFile(filePath, { agent, created_at: timestamp, updated_at: timestamp, ...frontmatter }, `# ${agent} learnings${entry}`);
    }
  }

  async writeNote(notePath: string, content: string, frontmatter: Record<string, unknown> = {}): Promise<void> {
    const filePath = path.join(this.vault, notePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await this.writeFile(filePath, { created_at: new Date().toISOString(), ...frontmatter }, content);
  }

  async readNote(notePath: string): Promise<{ content: string; data: Record<string, unknown> } | null> {
    const filePath = path.join(this.vault, notePath);
    const raw = await this.readFile(filePath);
    if (!raw) return null;
    const parsed = matter(raw);
    return { content: parsed.content, data: parsed.data as Record<string, unknown> };
  }

  async moveNote(fromPath: string, toPath: string): Promise<void> {
    const from = path.join(this.vault, fromPath);
    const to = path.join(this.vault, toPath);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.rename(from, to);
  }

  async listNotes(dir: string): Promise<string[]> {
    const dirPath = path.join(this.vault, dir);
    try {
      const entries = await fs.readdir(dirPath);
      return entries.filter(f => f.endsWith('.md'));
    } catch {
      return [];
    }
  }

  private async readFile(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  private async writeFile(filePath: string, frontmatter: Record<string, unknown>, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const raw = matter.stringify(content, frontmatter);
    await fs.writeFile(filePath, raw, 'utf8');
  }
}
