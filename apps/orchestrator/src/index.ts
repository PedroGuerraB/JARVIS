import 'dotenv/config';
import { Orchestrator } from '@jarvis/agents';
import { ObsidianMemory } from '@jarvis/memory';

async function main() {
  // Init Obsidian vault structure on first run
  const obsidian = new ObsidianMemory();
  await obsidian.init();
  console.log('[JARVIS] Obsidian vault initialized');

  const orchestrator = new Orchestrator();
  await orchestrator.start(5000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[JARVIS] Shutting down...');
    await orchestrator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await orchestrator.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[JARVIS] Fatal error:', err);
  process.exit(1);
});
