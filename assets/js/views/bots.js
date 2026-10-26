/* ============================================================
   BotForge — “My bots” dashboard
   ============================================================ */

import { h, icon, esc, $, $$, toast, ok, err, openModal, confirmDialog, download, timeAgo, copy } from '../ui.js';
import { store, botQuickStats } from '../store.js';
import { createChat } from '../chat.js';
import { exportBots, importBots } from '../io.js';
import { GENERATORS } from '../codegen.js';
import { downloadZip } from '../zip.js';

export function render() {
  let query = '';
  let sort = 'recent';

  const el = h(`
  <div class="wrap">
    <div class="page-head">
      <div class="breadcrumbs"><a href="#/">Home</a><span>/</span>Dashboard</div>
      <div class="row-between">
        <div>
          <h1>My bots</h1>
          <p>Everything lives in this browser. No account, no sync, no surprises.</p>
        </div>
        <div class="row">
          <button class="btn btn-outline" data-import>${icon('upload')} Import</button>
          <button class="btn btn-outline" data-export>${icon('download')} Export</button>
          <button class="btn btn-primary" data-new>${icon('plus')} New bot</button>
        </div>
      </div>
    </div>

    <div class="stat-grid mb-4">
      <div class="stat-block"><b data-stat-bots>0</b><span>bots</span></div>
      <div class="stat-block"><b data-stat-rules>0</b><span>total rules</span></div>
      <div class="stat-block"><b data-stat-updates>0</b><span>updates handled</span></div>
      <div class="stat-block"><b data-stat-tokens>0</b><span>tokens verified</span></div>
    </div>

    <div class="row-between mb-4" style="gap:12px">
      <div class="input-row" style="max-width:340px;flex:1">
        <div class="input-affix" style="flex:1">
          <span class="prefix">${icon('search')}</span>
          <input class="input" data-search placeholder="Search your bots…" autocomplete="off" />
        </div>
      </div>
      <div class="row" style="gap:8px">
        <select class="select" data-sort aria-label="Sort bots" style="width:auto;min-height:38px;padding:8px 34px 8px 12px;font-size:.82rem">
          <option value="recent">Recently updated</option>
          <option value="created">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="rules">Most rules</option>
        </select>
      </div>
    </div>

    <div data-list class="bot-grid"></div>

    <div class="card pad mt-4" data-storage-note hidden>
      <div class="notice warn">${icon('warning')}<div><b>Local storage is blocked.</b> Your bots will work for this session but will disappear when you close the tab. Disable private browsing or allow site data for this domain, then export a backup.</div></div>
    </div>

    <section class="section-tight">
      <div class="grid g-3">
        <div class="card pad">
          <div class="feature-ico">${icon('shield')}</div>
          <h3>Private by design</h3>
          <p>Bot tokens and rules never leave this device. There is no BotForge server to leak them.</p>
        </div>
        <div class="card pad">
          <div class="feature-ico">${icon('package')}</div>
          <h3>Portable</h3>
          <p>Export a JSON backup, or download the whole source bundle for any bot as a .zip.</p>
        </div>
        <div class="card pad">
          <div class="feature-ico">${icon('cloud')}</div>
          <h3>Free forever hosting</h3>
          <p>Each bot can be deployed to Cloudflare Workers or Deno Deploy on their permanent free tiers.</p>
        </div>
      </div>
    </section>
  </div>`);

  const list = el.querySelector('[data-list]');

  function updateStats() {
    const bots = store.bots;
    el.querySelector('[data-stat-bots]').textContent = bots.length;
    el.querySelector('[data-stat-rules]').textContent = bots.reduce((n, b) => n + b.rules.length, 0);
    el.querySelector('[data-stat-updates]').textContent = store.totalStats().updates;
    el.querySelector('[data-stat-tokens]').textContent = bots.filter((b) => b.tokenInfo).length;
    el.querySelector('[data-storage-note]').hidden = store.available;
  }

  function sortedBots() {
    let bots = store.bots.filter((b) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (b.name || '').toLowerCase().includes(q) || (b.username || '').toLowerCase().includes(q) || (b.about || '').toLowerCase().includes(q);
    });
    const sorters = {
      recent: (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
      created: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      name: (a, b) => (a.name || '').localeCompare(b.name || ''),
      rules: (a, b) => b.rules.length - a.rules.length
    };
    return bots.sort(sorters[sort] || sorters.recent);
  }

  function renderList() {
    const bots = sortedBots();
    if (!bots.length && !store.bots.length) {
      list.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <div class="empty-ico">${icon('bot')}</div>
          <h3>No bots yet — let's fix that</h3>
          <p>Build one from scratch in about two minutes, or start from a template like a support desk or a mini store.</p>
          <div class="row" style="justify-content:center">
            <a class="btn btn-primary" href="#/builder">${icon('plus')} Create a bot</a>
            <a class="btn btn-outline" href="#/templates">${icon('layers')} Browse templates</a>
          </div>
        </div>`;
      return;
    }
    if (!bots.length) {
      list.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-ico">${icon('search')}</div><h3>No matches</h3><p>Nothing found for “${esc(query)}”.</p></div>`;
      return;
    }

    list.innerHTML = bots.map((b) => {
      const q = botQuickStats(b);
      return `
      <article class="card bot-card hover" data-bot="${b.id}">
        <div class="bot-top">
          <span class="bot-avatar">${esc(b.emoji || '🤖')}</span>
          <div class="bot-title">
            <h2 class="card-h">${esc(b.name)}</h2>
            <div class="bot-handle">@${esc(b.username || 'not-linked')}</div>
          </div>
          <span class="pill ${b.tokenInfo ? 'ok' : b.token ? 'info' : ''}" style="font-size:.62rem">
            ${b.tokenInfo ? 'verified' : b.token ? 'token saved' : 'no token'}
          </span>
        </div>
        <p class="small" style="color:var(--muted);min-height:2.4em">${esc((b.about || 'No description yet.').slice(0, 110))}</p>
        <div class="bot-meta">
          <span>${icon('message')} ${q.rules} rules</span>
          <span>${icon('list')} ${q.buttons} buttons</span>
          <span>${icon('clock')} ${timeAgo(b.updatedAt || b.createdAt)}</span>
          ${b.stats?.updates ? `<span>${icon('zap')} ${b.stats.updates} updates</span>` : ''}
        </div>
        <div class="bot-actions">
          <a class="btn btn-primary btn-sm" href="#/builder/${b.id}">${icon('pen')} Edit</a>
          <a class="btn btn-outline btn-sm" href="#/runtime/${b.id}">${icon('play')} Run</a>
          <a class="btn btn-ghost btn-sm" href="#/deploy/${b.id}">${icon('rocket')} Deploy</a>
          <span class="spacer"></span>
          <button class="btn btn-ghost btn-sm" data-preview title="Preview chatbot">${icon('eye')}</button>
          <button class="btn btn-ghost btn-sm" data-more title="More actions">${icon('more')}</button>
        </div>
      </article>`;
    }).join('');

    list.querySelectorAll('[data-bot]').forEach((card) => {
      const bot = store.getBot(card.dataset.bot);
      card.querySelector('[data-preview]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal({
          title: `${bot.name} — preview`,
          subtitle: 'Local simulation · nothing leaves this device',
          body: `<div data-chat style="max-width:380px;margin:0 auto"></div>`,
          onMount(modal) {
            const chat = createChat({
              getBot: () => bot,
              quickReplies: (bot.commands || ['start', 'help']).map((c) => `/${c.replace(/^\//, '')}`),
              height: 340
            });
            modal.querySelector('[data-chat]').appendChild(chat.el);
          }
        });
      });
      card.querySelector('[data-more]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal({
          title: bot.name,
          subtitle: `@${bot.username || 'not linked'} · updated ${timeAgo(bot.updatedAt || bot.createdAt)}`,
          body: `
            <div class="stack gap-2">
              <button class="btn btn-outline btn-block" data-act="duplicate">${icon('copy')} Duplicate bot</button>
              <button class="btn btn-outline btn-block" data-act="config">${icon('download')} Download config (JSON)</button>
              <button class="btn btn-outline btn-block" data-act="zip">${icon('package')} Download full source (.zip)</button>
              <button class="btn btn-outline btn-block" data-act="copy">${icon('link')} Copy share link</button>
              <div class="divider"></div>
              <button class="btn btn-danger btn-block" data-act="delete">${icon('trash')} Delete this bot</button>
            </div>`,
          onMount(modal, close) {
            modal.querySelector('[data-act="duplicate"]').addEventListener('click', () => {
              const copy = store.duplicateBot(bot.id);
              close();
              if (copy) { ok(`Duplicated as “${copy.name}”`); renderList(); updateStats(); }
            });
            modal.querySelector('[data-act="config"]').addEventListener('click', () => {
              download(`${(bot.name || 'bot').toLowerCase().replace(/\s+/g, '-')}.json`, GENERATORS.config.gen(bot), 'application/json');
            });
            modal.querySelector('[data-act="zip"]').addEventListener('click', () => {
              const files = Object.values(GENERATORS).map((g) => ({ name: g.file, content: g.gen(bot) }));
              downloadZip(`${(bot.name || 'bot').toLowerCase().replace(/\s+/g, '-')}.zip`, files);
              ok('Source bundle downloaded');
            });
            modal.querySelector('[data-act="copy"]').addEventListener('click', () => {
              copy(`${location.origin}${location.pathname}#/builder/${bot.id}`, 'Share link copied — config is not included');
            });
            modal.querySelector('[data-act="delete"]').addEventListener('click', () => {
              close();
              setTimeout(() => {
                confirmDialog({
                  title: 'Delete bot?',
                  message: `“${esc(bot.name)}” will be removed from this browser. Export a backup first if you want to keep it.`,
                  confirm: 'Delete',
                  danger: true,
                  onConfirm: () => {
                    store.deleteBot(bot.id);
                    toast('Bot deleted', { type: 'ok' });
                    renderList();
                    updateStats();
                  }
                });
              }, 120);
            });
          }
        });
      });
    });
  }

  el.querySelector('[data-new]').addEventListener('click', () => {
    const bot = store.newBot({ name: `Bot ${store.bots.length + 1}`, username: '', template: 'blank' });
    location.hash = `/builder/${bot.id}`;
  });
  el.querySelector('[data-import]').addEventListener('click', importBots);
  el.querySelector('[data-export]').addEventListener('click', () => {
    if (!store.bots.length) return err('Nothing to export yet');
    exportBots();
  });
  el.querySelector('[data-search]').addEventListener('input', (e) => {
    query = e.target.value;
    renderList();
  });
  el.querySelector('[data-sort]').addEventListener('change', (e) => {
    sort = e.target.value;
    renderList();
  });

  const unsubscribe = store.subscribe(() => { renderList(); updateStats(); });
  el._cleanup = unsubscribe;

  renderList();
  updateStats();
  return el;
}
