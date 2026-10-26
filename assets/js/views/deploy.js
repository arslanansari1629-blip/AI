/* ============================================================
   BotForge — free hosting / deploy guide
   ============================================================ */

import { h, icon, esc, $, $$, toast, ok, err, info, copy, download, openModal, highlight, setLoading } from '../ui.js';
import { store } from '../store.js';
import { TARGETS, getTarget, webhookCurl } from '../deploy.js';
import { GENERATORS, genRequirements, genPackageJson, genWrangler, randomSecret } from '../codegen.js';
import { downloadZip } from '../zip.js';

export function render({ params }) {
  const bot = params[0] ? store.getBot(params[0]) : store.getBot(store.data.activeBotId) || store.bots[0];

  if (!bot) {
    return h(`
      <div class="wrap section">
        <div class="empty">
          <div class="empty-ico">${icon('cloud')}</div>
          <h3>Build a bot first</h3>
          <p>The deploy guide generates real code from your bot's rules — create one and come back.</p>
          <div class="row" style="justify-content:center">
            <a class="btn btn-primary" href="#/builder">${icon('plus')} Create a bot</a>
            <a class="btn btn-outline" href="#/templates">${icon('layers')} Browse templates</a>
          </div>
        </div>
      </div>`);
  }

  let targetId = 'cloudflare';
  let codeTab = 'worker';
  let secret = bot.webhookSecret || randomSecret(20);
  bot.webhookSecret = secret;
  store.saveBot(bot);

  const el = h(`
  <div class="wrap">
    <div class="page-head">
      <div class="breadcrumbs"><a href="#/">Home</a><span>/</span><a href="#/bots">My bots</a><span>/</span>Deploy</div>
      <div class="row-between">
        <div>
          <h1>Deploy for free</h1>
          <p>Generate real, standalone code and host it on a permanent free tier. Typically three minutes, no card.</p>
        </div>
        <div class="row">
          <select class="select" data-picker aria-label="Choose a bot" style="width:auto;min-height:40px;padding:9px 34px 9px 12px;font-size:.84rem">
            ${store.bots.map((b) => `<option value="${b.id}" ${b.id === bot.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
          </select>
          <a class="btn btn-outline" href="#/builder/${bot.id}">${icon('pen')} Edit</a>
        </div>
      </div>
    </div>

    <div class="notice mb-4">
      ${icon('shieldCheck')}
      <div><b>Your token is never embedded in generated files.</b> Every target reads <code class="code-inline">BOT_TOKEN</code> from environment variables, so you can share the code publicly.</div>
    </div>

    <div class="target-grid mb-4" data-targets>
      ${TARGETS.map((t) => `
        <button class="card pad target ${t.id === 'cloudflare' ? 'active' : ''}" data-target="${t.id}">
          <div class="target-top">
            <span class="target-ico">${t.emoji}</span>
            <div><h2 class="card-h">${esc(t.name)}</h2></div>
          </div>
          <p>${esc(t.tagline)}</p>
          <div class="t-meta">
            <span class="pill">${esc(t.free)}</span>
            <span class="pill">${esc(t.setup)}</span>
            ${t.tags.includes('recommended') ? '<span class="pill ok">recommended</span>' : ''}
          </div>
        </button>`).join('')}
    </div>

    <div class="deploy-grid">
      <div>
        <div class="card pad mb-3">
          <div class="row-between mb-3">
            <div>
              <h2 class="card-h" data-target-name>Cloudflare Workers</h2>
              <p class="tiny muted" data-target-meta></p>
            </div>
            <span class="pill ok" data-target-cost></span>
          </div>
          <div class="step-list" data-steps></div>
          <div class="row mt-4">
            <a class="btn btn-primary btn-sm" data-target-link target="_blank" rel="noopener">${icon('arrowUpRight')} Open provider</a>
            <button class="btn btn-outline btn-sm" data-zip>${icon('package')} Download .zip</button>
            <button class="btn btn-ghost btn-sm" data-copy-who title="Copy webhook secret">${icon('copy')} Copy webhook secret</button>
          </div>
        </div>

        <div class="card pad mb-3">
          <h3 style="font-size:1rem">Webhook helper</h3>
          <p class="small mt-1">Once your worker is deployed, register it with Telegram. Replace the host with your own URL.</p>
          <div class="field mt-3">
            <label class="label">Your deployment host</label>
            <div class="input-affix">
              <span class="prefix">https://</span>
              <input class="input" data-host placeholder="${esc(bot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}.workers.dev" spellcheck="false" />
            </div>
          </div>
          <div class="field">
            <label class="label">Webhook secret</label>
            <div class="input-row">
              <input class="input mono-input" data-secret aria-label="Webhook secret" value="${esc(secret)}" spellcheck="false" />
              <button class="btn btn-outline btn-sm" data-regen aria-label="Generate a new webhook secret" title="Generate a new secret">${icon('refresh')}</button>
            </div>
          </div>
          <div class="code-block mt-3">
            <div class="code-head">
              <div class="dots"><i></i><i></i><i></i></div>
              <span class="code-title">register webhook</span>
              <button class="btn btn-ghost btn-sm" data-copy-curl aria-label="Copy webhook command" title="Copy">${icon('copy')} Copy</button>
            </div>
            <pre data-curl tabindex="0"></pre>
          </div>
          <p class="field-hint mt-2">Paste it into a terminal, or open the URL in a browser tab — Telegram returns <code>{"ok":true}</code>.</p>
        </div>

        <div class="card pad">
          <div class="row-between mb-3">
            <h3 style="font-size:1rem">Launch checklist</h3>
            <button class="btn btn-ghost btn-sm" data-reset-checks>Reset</button>
          </div>
          <div class="checklist" data-checks></div>
        </div>
      </div>

      <div class="stack" style="gap:16px">
        <div class="code-panel">
          <div class="tabs" data-tabs>
            ${Object.entries(GENERATORS).map(([k, g], i) => `
              <button class="tab ${i === 0 ? 'active' : ''}" data-tab="${k}">${g.icon} ${esc(g.label)}</button>`).join('')}
          </div>
          <div class="code-block">
            <div class="code-head">
              <div class="dots"><i></i><i></i><i></i></div>
              <span class="code-title" data-file>worker.js</span>
              <button class="btn btn-ghost btn-sm" data-copy-code aria-label="Copy code" title="Copy">${icon('copy')} Copy</button>
              <button class="btn btn-ghost btn-sm" data-download-code aria-label="Download this file" title="Download">${icon('download')}</button>
            </div>
            <pre data-code tabindex="0"></pre>
          </div>
        </div>

        <div class="card pad">
          <h3 style="font-size:.95rem">Deployment cheat sheet</h3>
          <div class="table-wrap mt-2">
            <table class="table">
              <thead><tr><th>Target</th><th>Free tier</th><th>Model</th></tr></thead>
              <tbody>
                <tr><td>Cloudflare</td><td>100k req/day</td><td>webhook</td></tr>
                <tr><td>Deno Deploy</td><td>1M req/mo</td><td>webhook</td></tr>
                <tr><td>GitHub Actions</td><td>2,000 min/mo</td><td>polling</td></tr>
                <tr><td>Koyeb</td><td>1 free service</td><td>polling</td></tr>
              </tbody>
            </table>
          </div>
          <p class="tiny muted mt-2">Telegram's hard limit is ~30 messages/second; the free tiers above are far beyond a normal community bot.</p>
        </div>

        <div class="hint-card">
          ${icon('key')}
          <div>Set <code>BOT_TOKEN</code> as a <b>secret</b> environment variable in your provider — never in the code.</div>
        </div>
      </div>
    </div>
  </div>`);

  /* ----------------------------- code rendering ----------------------------- */
  const codeEl = el.querySelector('[data-code]');
  const fileEl = el.querySelector('[data-file]');
  const curlEl = el.querySelector('[data-curl]');
  const hostInput = el.querySelector('[data-host]');
  const secretInput = el.querySelector('[data-secret]');

  function currentCode() {
    return GENERATORS[codeTab].gen(bot);
  }

  function renderCode() {
    const g = GENERATORS[codeTab];
    fileEl.textContent = g.file;
    const raw = currentCode();
    codeEl.innerHTML = bot.settings?.prettyCode === false ? esc(raw) : highlight(raw);
  }

  function renderCurl() {
    const host = hostInput.value.trim() || `${bot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.workers.dev`;
    curlEl.textContent = webhookCurl(bot.token || '', host, secretInput.value.trim() || secret);
  }

  el.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      codeTab = tab.dataset.tab;
      el.querySelectorAll('[data-tab]').forEach((t) => t.classList.toggle('active', t === tab));
      renderCode();
    });
  });

  el.querySelector('[data-copy-code]').addEventListener('click', () => {
    copy(currentCode(), `${GENERATORS[codeTab].file} copied`);
  });
  el.querySelector('[data-download-code]').addEventListener('click', () => {
    const g = GENERATORS[codeTab];
    download(g.file, currentCode(), g.mime);
    ok(`${g.file} downloaded`);
  });
  el.querySelector('[data-copy-curl]').addEventListener('click', () => copy(curlEl.textContent, 'Webhook command copied'));
  el.querySelector('[data-copy-who]').addEventListener('click', () => copy(secretInput.value, 'Webhook secret copied'));
  el.querySelector('[data-regen]').addEventListener('click', () => {
    secret = randomSecret(20);
    secretInput.value = secret;
    bot.webhookSecret = secret;
    store.saveBot(bot);
    renderCurl();
    toast('New webhook secret generated — update it in your worker variables too', { type: 'warn', timeout: 6000 });
  });
  hostInput.addEventListener('input', renderCurl);
  secretInput.addEventListener('input', () => {
    secret = secretInput.value.trim();
    bot.webhookSecret = secret;
    renderCurl();
  });

  el.querySelector('[data-zip]').addEventListener('click', () => {
    const files = Object.values(GENERATORS).map((g) => ({ name: g.file, content: g.gen(bot) }));
    files.push({ name: 'package.json', content: genPackageJson(bot) });
    files.push({ name: 'requirements.txt', content: genRequirements() });
    files.push({ name: 'wrangler.toml', content: genWrangler(bot) });
    downloadZip(`${bot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-bot.zip`, files);
    ok('All files zipped');
  });

  /* ----------------------------- targets ----------------------------- */
  function renderTarget() {
    const t = getTarget(targetId);
    el.querySelectorAll('[data-target]').forEach((c) => c.classList.toggle('active', c.dataset.target === targetId));
    el.querySelector('[data-target-name]').textContent = t.name;
    el.querySelector('[data-target-meta]').textContent = `${t.tagline} · ${t.difficulty} · ${t.setup}`;
    el.querySelector('[data-target-cost]').textContent = t.free;

    el.querySelector('[data-steps]').innerHTML = t.steps.map((s, i) => `
      <div class="dstep">
        <span class="dnum">${i + 1}</span>
        <div class="dbody">
          <h3>${esc(s.title)}</h3>
          <p>${s.desc}</p>
          ${s.code ? `<div class="code-block"><div class="code-head"><div class="dots"><i></i><i></i><i></i></div><span class="code-title">${esc(s.lang || 'bash')}</span><button class="btn btn-ghost btn-sm" data-copy-step="${i}">${icon('copy')} Copy</button></div><pre tabindex="0">${esc(s.code)}</pre></div>` : ''}
        </div>
      </div>`).join('');

    el.querySelectorAll('[data-copy-step]').forEach((b) => {
      b.addEventListener('click', () => copy(t.steps[Number(b.dataset.copyStep)].code, 'Copied'));
    });

    const link = el.querySelector('[data-target-link]');
    if (t.url) { link.href = t.url; link.style.display = ''; }
    else { link.style.display = 'none'; }

    // checklist per target
    bot.deployChecks = bot.deployChecks || {};
    const checks = bot.deployChecks[t.id] || {};
    el.querySelector('[data-checks]').innerHTML = t.steps.map((s, i) => `
      <label class="checklist-item ${checks[i] ? 'done' : ''}">
        <input type="checkbox" data-check-step="${i}" ${checks[i] ? 'checked' : ''} />
        <span>${esc(s.title)}</span>
      </label>`).join('');
    el.querySelectorAll('[data-check-step]').forEach((cb) => {
      cb.addEventListener('change', () => {
        bot.deployChecks[t.id] = bot.deployChecks[t.id] || {};
        bot.deployChecks[t.id][cb.dataset.checkStep] = cb.checked;
        cb.closest('.checklist-item').classList.toggle('done', cb.checked);
        store.saveBot(bot);
      });
    });

    if (t.id === 'browser') {
      el.querySelector('[data-target-link]').style.display = 'none';
    }
  }

  el.querySelectorAll('[data-target]').forEach((card) => {
    card.addEventListener('click', () => {
      targetId = card.dataset.target;
      renderTarget();
    });
  });
  el.querySelector('[data-reset-checks]').addEventListener('click', () => {
    bot.deployChecks[targetId] = {};
    store.saveBot(bot);
    renderTarget();
    toast('Checklist reset', { type: 'info' });
  });

  el.querySelector('[data-picker]').addEventListener('change', (e) => {
    location.hash = `/deploy/${e.target.value}`;
  });

  renderCode();
  renderTarget();
  renderCurl();

  return el;
}
