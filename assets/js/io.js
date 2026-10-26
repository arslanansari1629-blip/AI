/* ============================================================
   BotForge — import / export helpers (shared, cycle-free)
   ============================================================ */

import { download, ok, err } from './ui.js';
import { store } from './store.js';

export function exportBots(single = null) {
  const payload = single
    ? { app: 'BotForge', version: 1, bots: [single] }
    : store.exportAll();
  const stamp = new Date().toISOString().slice(0, 10);
  download(`botforge-backup-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json');
  ok('Backup downloaded — keep it somewhere safe');
}

export function importBots(onDone) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const n = store.importAll(text);
      ok(`Imported ${n} bot${n === 1 ? '' : 's'}`, 'Success');
      onDone?.(n);
    } catch (e) {
      err(`Could not read that file: ${e.message}`, 'Import failed');
    }
  });
  input.click();
}
