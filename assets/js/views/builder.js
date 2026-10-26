/* ============================================================
   BotForge — visual bot builder
   ============================================================ */

import { h, icon, esc, $, $$, toast, ok, err, info, copy, openModal, confirmDialog, debounce, uid, setLoading } from '../ui.js';
import { store, createBot } from '../store.js';
import { createChat } from '../chat.js';
import { probeToken, tg, isValidToken, redact, buildInlineKeyboard } from '../telegram.js';
import { applyTemplate } from '../templates.js';
import { GENERATORS, genCommandList, genPackageJson, genWrangler, genRequirements } from '../codegen.js';
import { downloadZip } from '../zip.js';
import { exportBots } from '../io.js';

const STEPS = [
  { id: 'identity', label: 'Identity', icon: 'sparkles' },
  { id: 'token', label: 'Token', icon: 'key' },
  { id: 'rules', label: 'Replies', icon: 'message' },
  { id: 'behavior', label: 'Behaviour', icon: 'sliders' },
  { id: 'launch', label: 'Launch', icon: 'rocket' }
];

const EMOJIS = ['🤖', '🚀', '🧠', '🛍️', '🎧', '🎓', '📅', '📊', '💌', '🍽️', '📈', '🗂️', '🐍', '🦕', '⚡', '💎'];

const RULE_PRESETS = [
  { label: '👋 Welcome', match: 'exact', trigger: '/start', reply: 'Hey {name}! 👋 Welcome.\n\nUse /help to see what I can do.', buttons: [{ label: '📖 Help', data: '/help' }] },
  { label: '❓ Help menu', match: 'exact', trigger: '/help', reply: 'Here is everything I can do:\n\n/start — begin\n/contact — reach a human', buttons: [] },
  { label: '💬 Pricing', match: 'contains', trigger: 'price', reply: '💳 Our plans:\n\n• Free — $0\n• Pro — $9/month\n\nReply with <b>human</b> for a custom quote.', buttons: [] },
  { label: '📞 Contact', match: 'exact', trigger: '/contact', reply: '📮 Reach us at hello@example.com — we reply within a day.', buttons: [] },
  { label: '🛡 Fallback', match: 'fallback', trigger: '', reply: "I didn't catch that 🤔\nTry /help for the full command list.", buttons: [{ label: '❓ Help', data: '/help' }] }
];

const MATCH_SHORT = {
  exact: 'exact', contains: 'contains', start: 'starts with',
  command: 'command', regex: 'regex', any: 'any', fallback: 'fallback'
};

const MATCH_LABELS = {
  exact: 'Exactly equals',
  contains: 'Contains text',
  start: 'Starts with',
  command: 'Command (with args)',
  regex: 'Regex pattern',
  any: 'Any message',
  fallback: 'Fallback (no match)'
};

/* ----------------------------- helpers ----------------------------- */
const matchLabel = (m) => MATCH_LABELS[m] || 'Contains text';

function usernameHint(value) {
  const v = (value || '').trim();
  if (!v) return { ok: true, msg: 'Optional — filled automatically when you verify the token.' };
  if (!/^[a-zA-Z][a-zA-Z0-9_]{3,30}$/.test(v.replace(/^@/, ''))) return { ok: false, msg: '5–32 characters, letters, numbers and underscores, starting with a letter.' };
  if (!/bot$/i.test(v)) return { ok: false, msg: 'Telegram bot usernames must end with “bot” (e.g. nova_bot).' };
  return { ok: true, msg: 'Looks like a valid Telegram bot username.' };
}

function resolveBot(params, query) {
  let bot = params[0] ? store.getBot(params[0]) : null;
  if (!bot && query.id) bot = store.getBot(query.id);
  if (!bot && store.data.activeBotId) bot = store.getBot(store.data.activeBotId);
  if (!bot) bot = store.bots[0] || null;

  if (!bot && query.template) {
    const tpl = applyTemplate(query.template, { name: 'Nova', username: '' });
    bot = store.newBot(tpl);
  }
  if (!bot) {
    bot = store.newBot(createBot({ name: 'Nova', username: '', template: 'starter' }));
  }
  if (location.hash !== `#/builder/${bot.id}`) history.replaceState(null, '', `#/builder/${bot.id}`);
  return bot;
}

/* ----------------------------- view ----------------------------- */
export function render({ params, query }) {
  const bot = resolveBot(params, query);
  let editingRuleId = null;
  let saveState = 'saved';

  const el = h(`
  <div class="wrap builder-shell">
    <h1 class="sr-only">Bot builder</h1>
    <div class="builder-top">
      <a class="icon-btn" href="#/bots" title="All bots" aria-label="All bots">${icon('chevronLeft')}</a>
      <span class="bot-avatar" data-emoji style="width:40px;height:40px;border-radius:12px">${esc(bot.emoji || '🤖')}</span>
      <div class="bt-name">
        <input class="input" data-name value="${esc(bot.name)}" maxlength="40" aria-label="Bot display name" placeholder="Bot display name" />
      </div>
      <span class="save-state" data-save></span>
      <div class="row" style="gap:8px">
        <button class="btn btn-outline btn-sm" data-test-top>${icon('flask')} Test token</button>
        <button class="btn btn-primary btn-sm" data-open-launch>${icon('rocket')} Launch</button>
        <div class="menu-wrap">
          <button class="icon-btn" data-menu-btn aria-label="More actions" style="width:36px;height:36px">${icon('more')}</button>
          <div class="menu-pop" data-menu hidden>
            <button data-act="preview">${icon('eye')} Preview as Telegram</button>
            <button data-act="duplicate">${icon('copy')} Duplicate bot</button>
            <button data-act="export">${icon('download')} Download config</button>
            <button data-act="zip">${icon('package')} Download all files</button>
            <div class="menu-sep"></div>
            <a href="#/deploy/${bot.id}">${icon('cloud')} Deploy guide</a>
            <button class="danger" data-act="delete">${icon('trash')} Delete bot</button>
          </div>
        </div>
      </div>
    </div>

    <div class="builder-grid">
      <aside class="builder-rail" data-rail aria-label="Builder steps">
        ${STEPS.map((s, i) => `
          <button class="rail-step ${i === 0 ? 'active' : ''}" data-step-btn="${s.id}">
            <span class="rs-num">${i + 1}</span>
            <span class="rs-label">${s.label}</span>
            <span class="rs-check" data-step-check="${s.id}" hidden>${icon('check')}</span>
          </button>`).join('')}
        <div class="hint-card" style="margin-top:14px">
          ${icon('lock')}
          <div>Everything is stored <b>only in this browser</b>. Export a backup from “My bots”.</div>
        </div>
      </aside>

      <div class="builder-panel">
        <!-- ============ STEP 1 · IDENTITY ============ -->
        <section class="panel-step active" data-panel="identity">
          <div class="panel-head">
            <h2>Give your bot an identity</h2>
            <p>This is how the bot introduces itself. You can always change it later.</p>
          </div>

          <div class="field">
            <span class="label">Avatar emoji</span>
            <div class="emoji-grid" data-emojis>
              ${EMOJIS.map((e) => `<button type="button" class="emoji-opt ${e === bot.emoji ? 'active' : ''}" data-emoji="${e}">${e}</button>`).join('')}
            </div>
          </div>

          <div class="field mt-3">
            <label class="label" for="f-name">Display name <span class="req">*</span></label>
            <input class="input" id="f-name" data-field="name" value="${esc(bot.name)}" maxlength="40" placeholder="Nova" />
            <span class="field-hint">Shown in chats, the bot list and previews.</span>
          </div>

          <div class="field">
            <label class="label" for="f-username">Telegram username</label>
            <div class="input-affix">
              <span class="prefix">@</span>
              <input class="input" id="f-username" data-field="username" value="${esc(bot.username || '')}" placeholder="nova_bot" autocomplete="off" spellcheck="false" />
            </div>
            <span class="field-hint" data-user-hint>${esc(usernameHint(bot.username).msg)}</span>
          </div>

          <div class="field">
            <label class="label" for="f-about">Short description</label>
            <textarea class="textarea" id="f-about" data-field="about" maxlength="160" placeholder="A friendly assistant that answers instantly.">${esc(bot.about || '')}</textarea>
            <span class="field-hint">Telegram allows 120 characters for the profile description — we trim it when pushing.</span>
          </div>

          <div class="panel-foot">
            <span class="small muted">Step 1 of 5</span>
            <div class="right"><button class="btn btn-primary" data-next>Continue ${icon('arrowRight')}</button></div>
          </div>
        </section>

        <!-- ============ STEP 2 · TOKEN ============ -->
        <section class="panel-step" data-panel="token">
          <div class="panel-head">
            <h2>Connect your Telegram bot</h2>
            <p>BotForge talks directly to Telegram with a token from @BotFather. No account with us is needed — ever.</p>
          </div>

          <div class="card pad" style="background:var(--bg-soft);margin-bottom:20px">
            <div class="row" style="gap:12px;align-items:flex-start">
              <span class="feature-ico" style="margin:0;flex:none">${icon('telegram')}</span>
              <div>
                <h3 style="font-size:.95rem">Get a token in 30 seconds</h3>
                <ol class="small" style="color:var(--muted);margin-top:8px;display:flex;flex-direction:column;gap:5px;padding-left:2px">
                  <li>1. Open <a class="text-dim" style="text-decoration:underline" href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a> on Telegram</li>
                  <li>2. Send <code class="code-inline">/newbot</code> and choose a name + username</li>
                  <li>3. Copy the token it replies with</li>
                </ol>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label" for="f-token">Bot token <span class="hint-dot">— stored only on this device</span></label>
            <div class="input-row">
              <div class="input-affix" style="flex:1">
                <span class="prefix">bot</span>
                <input class="input" id="f-token" data-field="token" type="password" value="${esc(bot.token || '')}" placeholder="123456789:AAH…" autocomplete="off" spellcheck="false" />
                <button class="suffix" type="button" data-toggle-token aria-label="Show token" style="background:var(--surface)">${icon('eye')}</button>
              </div>
              <button class="btn btn-outline" data-test-token>${icon('wifi')} Test</button>
            </div>
            <span class="field-hint">Format: <code>123456789:AAH…</code> — 35+ characters. Never share it publicly.</span>
          </div>

          <div class="token-status ${bot.tokenInfo ? 'ok' : ''}" data-token-status style="margin-top:16px;${bot.tokenInfo ? '' : 'display:none'}">
            ${icon('shieldCheck')}
            <div data-token-result>${bot.tokenInfo ? `Connected as <b>@${esc(bot.tokenInfo.username)}</b> — ${esc(bot.tokenInfo.first_name)}` : ''}</div>
          </div>

          <div class="notice mt-3">
            ${icon('info')}
            <div><b>Why “Test” sometimes fails in a browser:</b> Telegram's API does not send CORS headers to browsers, so a direct call can be blocked even with a valid token. The token is still fine — the generated server code (Cloudflare / Deno / Node) always works because it has no browser sandbox.</div>
          </div>

          <div class="panel-foot">
            <button class="btn btn-ghost" data-prev>${icon('chevronLeft')} Back</button>
            <div class="right">
              <button class="btn btn-outline" data-skip-token>I'll add it later</button>
              <button class="btn btn-primary" data-next>Continue ${icon('arrowRight')}</button>
            </div>
          </div>
        </section>

        <!-- ============ STEP 3 · RULES ============ -->
        <section class="panel-step" data-panel="rules">
          <div class="panel-head">
            <h2>Teach your bot what to say</h2>
            <p>Rules are checked top to bottom. The first match wins; the fallback catches everything else.</p>
          </div>

          <div class="row-between mb-3">
            <div class="inline-list">
              ${RULE_PRESETS.map((p, i) => `<button class="chip" data-preset="${i}" type="button" title="${esc(p.trigger || 'no trigger')}">${p.label}</button>`).join('')}
            </div>
            <button class="btn btn-primary btn-sm" data-add-rule>${icon('plus')} New rule</button>
          </div>

          <div class="rules-list" data-rules></div>

          <div class="panel-foot">
            <button class="btn btn-ghost" data-prev>${icon('chevronLeft')} Back</button>
            <div class="right">
              <button class="btn btn-outline" data-open-sim>${icon('flask')} Test in preview</button>
              <button class="btn btn-primary" data-next>Continue ${icon('arrowRight')}</button>
            </div>
          </div>
        </section>

        <!-- ============ STEP 4 · BEHAVIOUR ============ -->
        <section class="panel-step" data-panel="behavior">
          <div class="panel-head">
            <h2>Behaviour & commands</h2>
            <p>Small details that make a bot feel human. All of this is stored locally.</p>
          </div>

          <div class="grid g-2" style="gap:12px">
            <label class="card pad row-between" style="padding:14px 16px;cursor:pointer">
              <div><b class="small">Typing indicator</b><div class="tiny muted">Show “typing…” before replying</div></div>
              <span class="switch"><input type="checkbox" data-setting="typing" ${bot.settings.typing !== false ? 'checked' : ''}><span class="track"></span></span>
            </label>
            <label class="card pad row-between" style="padding:14px 16px;cursor:pointer">
              <div><b class="small">Ignore other bots</b><div class="tiny muted">Skip messages from bot accounts</div></div>
              <span class="switch"><input type="checkbox" data-setting="ignoreBots" ${bot.settings.ignoreBots !== false ? 'checked' : ''}><span class="track"></span></span>
            </label>
            <label class="card pad row-between" style="padding:14px 16px;cursor:pointer">
              <div><b class="small">Smart fallback</b><div class="tiny muted">Answer when nothing matches</div></div>
              <span class="switch"><input type="checkbox" data-setting="fallback" ${bot.settings.fallback !== false ? 'checked' : ''}><span class="track"></span></span>
            </label>
            <label class="card pad row-between" style="padding:14px 16px;cursor:pointer">
              <div><b class="small">Pretty code</b><div class="tiny muted">Highlight generated source code</div></div>
              <span class="switch"><input type="checkbox" data-setting="prettyCode" ${bot.settings.prettyCode !== false ? 'checked' : ''}><span class="track"></span></span>
            </label>
          </div>

          <div class="field mt-4">
            <label class="label" for="f-cooldown">Per-chat cooldown</label>
            <div class="input-affix">
              <input class="input" id="f-cooldown" data-setting="cooldown" type="number" min="0" max="60000" step="100" value="${Number(bot.settings.cooldown ?? 600)}" />
              <span class="suffix">ms</span>
            </div>
            <span class="field-hint">Minimum gap between two replies in the same chat. 600 ms is a good default; use 0 for none.</span>
          </div>

          <div class="field mt-3">
            <label class="label" for="f-commands">Bot commands</label>
            <input class="input" id="f-commands" data-commands value="${esc((bot.commands || []).join(', '))}" placeholder="start, help, ping, id" spellcheck="false" />
            <span class="field-hint">Comma separated, without the slash. These become the Telegram command menu.</span>
          </div>

          <div class="card pad mt-3" style="background:var(--bg-soft)">
            <div class="row-between" style="gap:12px">
              <div>
                <b class="small">Push profile to Telegram</b>
                <p class="tiny" style="margin-top:4px">Set the command menu and descriptions on the real bot (requires a working token).</p>
              </div>
              <button class="btn btn-outline btn-sm" data-push-profile>${icon('upload')} Push</button>
            </div>
          </div>

          <div class="panel-foot">
            <button class="btn btn-ghost" data-prev>${icon('chevronLeft')} Back</button>
            <div class="right"><button class="btn btn-primary" data-next>Continue ${icon('arrowRight')}</button></div>
          </div>
        </section>

        <!-- ============ STEP 5 · LAUNCH ============ -->
        <section class="panel-step" data-panel="launch">
          <div class="panel-head">
            <h2>Launch checklist</h2>
            <p>You are minutes away from a live bot. Tick things off as you go — this list is just for you.</p>
          </div>

          <div class="stat-grid mb-4">
            <div class="stat-block"><b data-launch-rules>0</b><span>rules</span></div>
            <div class="stat-block"><b data-launch-buttons>0</b><span>buttons</span></div>
            <div class="stat-block"><b data-launch-cmds>0</b><span>commands</span></div>
            <div class="stat-block"><b data-launch-token>—</b><span>token</span></div>
          </div>

          <div class="checklist mb-4" data-checklist>
            ${[
              ['token', 'Bot created in @BotFather and token added'],
              ['test', 'Token tested successfully'],
              ['rules', 'At least 3 replies configured'],
              ['sim', 'Bot tested in the simulator'],
              ['deploy', 'Deployed to a free serverless host'],
              ['webhook', 'Webhook registered with Telegram']
            ].map(([k, label]) => `
              <label class="checklist-item" data-check-item="${k}">
                <input type="checkbox" data-check="${k}" ${bot.launch?.[k] ? 'checked' : ''} />
                <span>${esc(label)}</span>
              </label>`).join('')}
          </div>

          <div class="grid g-2" style="gap:12px">
            <button class="card pad target" data-goto-runtime style="text-align:left">
              <div class="target-top"><span class="target-ico">⚡</span><div><h4>Run in this browser</h4><p>Instant, zero setup</p></div></div>
              <span class="pill ok">${icon('play')} Start runtime</span>
            </button>
            <button class="card pad target" data-goto-deploy style="text-align:left">
              <div class="target-top"><span class="target-ico">☁️</span><div><h4>Deploy 24/7 for free</h4><p>Cloudflare · Deno · GitHub</p></div></div>
              <span class="pill info">${icon('rocket')} Deploy guide</span>
            </button>
            <button class="card pad target" data-act="zip" style="text-align:left">
              <div class="target-top"><span class="target-ico">📦</span><div><h4>Download all files</h4><p>Worker, Deno, Node, Python, config</p></div></div>
              <span class="pill">${icon('download')} .zip</span>
            </button>
            <button class="card pad target" data-preview-modal style="text-align:left">
              <div class="target-top"><span class="target-ico">💬</span><div><h4>Test the real bot</h4><p>Message it on Telegram</p></div></div>
              <span class="pill">${icon('telegram')} Open @${esc(bot.username || 'your_bot')}</span>
            </button>
          </div>

          <div class="notice mt-4">
            ${icon('shieldCheck')}
            <div><b>Nothing is uploaded.</b> Closing this tab does not delete your bot — it lives in this browser's local storage. Use Export for a portable backup, or import it on another device.</div>
          </div>

          <div class="panel-foot">
            <button class="btn btn-ghost" data-prev>${icon('chevronLeft')} Back</button>
            <div class="right">
              <button class="btn btn-outline" data-save-now>${icon('save')} Save now</button>
              <a class="btn btn-primary" href="#/runtime/${bot.id}">${icon('play')} Go live</a>
            </div>
          </div>
        </section>
      </div>

      <!-- ============ RIGHT COLUMN ============ -->
      <aside class="builder-tools" aria-label="Live preview">
        <div class="card preview-card glow-frame">
          <div class="preview-label"><span>Live preview</span><span class="pill ok" style="font-size:.6rem;padding:2px 7px"><i class="dot-live"></i> local</span></div>
          <div data-preview></div>
        </div>
        <div class="card quick-info">
          <div class="qi-row"><span>Username</span><b data-qi-user>@${esc(bot.username || '—')}</b></div>
          <div class="qi-row"><span>Rules</span><b data-qi-rules>0</b></div>
          <div class="qi-row"><span>Buttons</span><b data-qi-buttons>0</b></div>
          <div class="qi-row"><span>Token</span><b data-qi-token>${bot.tokenInfo ? 'verified' : bot.token ? 'saved' : 'missing'}</b></div>
          <div class="qi-row"><span>Template</span><b>${esc(bot.template || 'custom')}</b></div>
        </div>
        <div class="hint-card">
          ${icon('sparkles')}
          <div>Use <code>{name}</code>, <code>{username}</code>, <code>{args}</code> and <code>{random:a|b}</code> inside replies — they render per user at runtime.</div>
        </div>
      </aside>
    </div>
  </div>`);

  /* ----------------------------- references ----------------------------- */
  const nameInput = el.querySelector('[data-name]');
  const saveLabel = el.querySelector('[data-save]');
  const rulesList = el.querySelector('[data-rules]');
  const previewMount = el.querySelector('[data-preview]');

  /* ----------------------------- chat preview ----------------------------- */
  const chat = createChat({
    getBot: () => bot,
    greeting: `Hi! I'm <b>${esc(bot.name)}</b> ✨\n\nThis preview runs the same engine as your live bot. Try a command below.`,
    quickReplies: (bot.commands || ['start', 'help']).slice(0, 4).map((c) => `/${c.replace(/^\//, '')}`),
    height: 320
  });
  previewMount.appendChild(chat.el);

  /* ----------------------------- saving ----------------------------- */
  function setSaveState(state) {
    saveState = state;
    saveLabel.className = `save-state ${state === 'saved' ? 'saved' : ''}`;
    saveLabel.innerHTML = state === 'saving' ? `<span class="spinner" style="width:11px;height:11px"></span> saving…` : state === 'saved' ? `${icon('check')} saved` : `${icon('info')} unsaved`;
    if (state === 'saved') setTimeout(() => { if (saveState === 'saved') saveLabel.innerHTML = `${icon('check')} saved`; }, 1600);
  }

  const persist = () => {
    bot.updatedAt = Date.now();
    store.saveBot(bot);
    setSaveState('saved');
    updateQuickInfo();
  };
  const persistDebounced = debounce(persist, 420);

  function markDirty() {
    setSaveState('saving');
    persistDebounced();
  }

  function updateQuickInfo() {
    const rules = bot.rules.filter((r) => r.match !== 'fallback');
    const buttons = bot.rules.reduce((n, r) => n + (r.buttons?.length || 0), 0);
    el.querySelector('[data-qi-rules]').textContent = rules.length;
    el.querySelector('[data-qi-buttons]').textContent = buttons;
    el.querySelector('[data-qi-user]').textContent = bot.username ? `@${bot.username}` : '—';
    el.querySelector('[data-qi-token]').textContent = bot.tokenInfo ? 'verified' : bot.token ? 'saved' : 'missing';
    el.querySelector('[data-launch-rules]') && (el.querySelector('[data-launch-rules]').textContent = rules.length);
    el.querySelector('[data-launch-buttons]') && (el.querySelector('[data-launch-buttons]').textContent = buttons);
    el.querySelector('[data-launch-cmds]') && (el.querySelector('[data-launch-cmds]').textContent = (bot.commands || []).length);
    el.querySelector('[data-launch-token]') && (el.querySelector('[data-launch-token]').textContent = bot.tokenInfo ? 'ok' : bot.token ? 'saved' : '—');
    el.querySelector('[data-emoji]').textContent = bot.emoji || '🤖';
  }

  /* ----------------------------- step navigation ----------------------------- */
  function showStep(id, { scroll = true } = {}) {
    el.querySelectorAll('.panel-step').forEach((p) => p.classList.toggle('active', p.dataset.panel === id));
    el.querySelectorAll('[data-step-btn]').forEach((b) => b.classList.toggle('active', b.dataset.stepBtn === id));
    if (id === 'rules') renderRules();
    if (id === 'launch') renderChecklist();
    if (scroll) el.querySelector('.builder-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    location.hash = `#/builder/${bot.id}`;
  }

  el.querySelectorAll('[data-step-btn]').forEach((b) => b.addEventListener('click', () => showStep(b.dataset.stepBtn)));
  el.querySelectorAll('[data-panel] [data-next]').forEach((b) => b.addEventListener('click', () => {
    const current = b.closest('[data-panel]').dataset.panel;
    const i = STEPS.findIndex((s) => s.id === current);
    if (STEPS[i + 1]) showStep(STEPS[i + 1].id);
  }));
  el.querySelectorAll('[data-panel] [data-prev]').forEach((b) => b.addEventListener('click', () => {
    const current = b.closest('[data-panel]').dataset.panel;
    const i = STEPS.findIndex((s) => s.id === current);
    if (STEPS[i - 1]) showStep(STEPS[i - 1].id);
  }));
  el.querySelector('[data-open-launch]').addEventListener('click', () => showStep('launch'));
  el.querySelector('[data-open-sim]').addEventListener('click', () => {
    document.querySelector('.preview-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    chat.submit('/start');
  });

  /* ----------------------------- identity ----------------------------- */
  nameInput.addEventListener('input', () => {
    bot.name = nameInput.value.trim() || 'Untitled bot';
    el.querySelector('#f-name').value = bot.name;
    chat.setBot();
    markDirty();
  });
  el.querySelector('[data-field="name"]').addEventListener('input', (e) => {
    bot.name = e.target.value || 'Untitled bot';
    nameInput.value = bot.name;
    chat.setBot();
    markDirty();
  });
  el.querySelector('[data-field="username"]').addEventListener('input', (e) => {
    bot.username = e.target.value.replace(/^@/, '').trim();
    const hint = usernameHint(bot.username);
    const hintEl = el.querySelector('[data-user-hint]');
    hintEl.textContent = hint.msg;
    hintEl.style.color = hint.ok ? '' : 'var(--warn)';
    markDirty();
  });
  el.querySelector('[data-field="about"]').addEventListener('input', (e) => {
    bot.about = e.target.value;
    markDirty();
  });
  el.querySelector('[data-emojis]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-emoji]');
    if (!b) return;
    bot.emoji = b.dataset.emoji;
    el.querySelectorAll('[data-emoji]').forEach((x) => x.classList.toggle('active', x.dataset.emoji === bot.emoji));
    chat.setBot();
    markDirty();
  });

  /* ----------------------------- token ----------------------------- */
  const tokenInput = el.querySelector('[data-field="token"]');
  const tokenStatus = el.querySelector('[data-token-status]');
  const tokenResult = el.querySelector('[data-token-result]');

  el.querySelector('[data-toggle-token]').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const show = tokenInput.type === 'password';
    tokenInput.type = show ? 'text' : 'password';
    btn.innerHTML = icon(show ? 'eyeOff' : 'eye');
  });

  tokenInput.addEventListener('input', () => {
    bot.token = tokenInput.value.trim();
    bot.tokenInfo = null;
    bot.tokenValid = null;
    updateQuickInfo();
    markDirty();
  });

  tokenInput.addEventListener('change', () => {
    if (isValidToken(bot.token)) testToken();
  });

  async function testToken() {
    const token = (bot.token || '').trim();
    if (!token) {
      err('Add a token first — open @BotFather and send /newbot', 'Missing token');
      showStep('token');
      return false;
    }
    if (!isValidToken(token)) {
      tokenStatus.style.display = 'flex';
      tokenStatus.className = 'token-status err';
      tokenStatus.innerHTML = `${icon('warning')}<div><b>That doesn't look like a bot token.</b> It should look like <code>123456789:AAH…</code> (digits, a colon, then 35 characters).</div>`;
      return false;
    }

    const btn = el.querySelector('[data-test-token]');
    setLoading(btn, true, 'Testing');
    tokenStatus.style.display = 'flex';
    tokenStatus.className = 'token-status';
    tokenStatus.innerHTML = `${icon('wifi')}<div>Contacting <code>api.telegram.org</code>…</div>`;

    const result = await probeToken(token);
    setLoading(btn, false);

    if (result.ok) {
      bot.tokenInfo = result.me;
      bot.tokenValid = true;
      if (!bot.username) bot.username = result.me.username || '';
      bot.name = bot.name || result.me.first_name;
      tokenStatus.className = 'token-status ok';
      tokenStatus.innerHTML = `${icon('shieldCheck')}<div><b>Connected.</b> @${esc(result.me.username)} — ${esc(result.me.first_name)}${result.me.can_join_groups ? ' · groups enabled' : ''}</div>`;
      el.querySelector('[data-field="username"]').value = bot.username;
      el.querySelector('[data-user-hint]').textContent = usernameHint(bot.username).msg;
      el.querySelector('[data-username]') && (el.querySelector('[data-username]').textContent = `@${bot.username}`);
      updateQuickInfo();
      ok(`Token verified for @${result.me.username}`, 'Telegram connected');
      markDirty();
      persist();
      return true;
    }

    bot.tokenValid = false;
    if (result.reason === 'unauthorized') {
      tokenStatus.className = 'token-status err';
      tokenStatus.innerHTML = `${icon('warning')}<div><b>Telegram rejected this token.</b> ${esc(result.detail || 'Unauthorized')}. Copy it again from @BotFather → /mybots → API Token.</div>`;
    } else if (result.reason === 'cors') {
      tokenStatus.className = 'token-status warn';
      tokenStatus.innerHTML = `${icon('globe')}<div><b>Your browser blocked the request.</b> Telegram doesn't allow cross-origin calls from websites, so verification failed here — the token may still be perfectly valid. The browser runtime will show the same restriction; deploy the generated Worker to run 24/7 without it.</div>`;
      info('Browser blocked Telegram (CORS). Your token is saved locally — deploy the Worker for 24/7 hosting.', 'Network restricted');
    } else {
      tokenStatus.className = 'token-status warn';
      tokenStatus.innerHTML = `${icon('info')}<div><b>Could not verify right now.</b> ${esc(result.detail || 'Network error')}</div>`;
    }
    markDirty();
    return false;
  }

  el.querySelector('[data-test-token]').addEventListener('click', testToken);
  el.querySelector('[data-test-top]').addEventListener('click', () => { if (!bot.token) showStep('token'); testToken(); });
  el.querySelector('[data-skip-token]').addEventListener('click', () => showStep('rules'));

  /* ----------------------------- rules ----------------------------- */
  function ruleSummary(r) {
    if (r.match === 'fallback') return 'Everything else';
    if (r.match === 'any') return 'Any message';
    return r.trigger || '(empty trigger)';
  }

  function renderRules() {
    const activeRule = editingRuleId;
    rulesList.innerHTML = bot.rules.map((r, i) => `
      <div class="rule-item ${r.enabled === false ? 'disabled' : ''} ${activeRule === r.id ? 'editing' : ''}" data-rule="${r.id}">
        <div class="rule-head" data-head>
          <span class="rule-trigger">${esc(ruleSummary(r))}</span>
          <span class="rule-label">${esc((r.reply || '').replace(/\n/g, ' ').slice(0, 62) || 'Empty reply')}</span>
          <span class="rule-mode">${esc(MATCH_SHORT[r.match] || 'contains')}</span>
          <span class="rule-tools">
            <button data-up title="Move up" ${i === 0 ? 'disabled' : ''}>${icon('chevronUp')}</button>
            <button data-down title="Move down" ${i === bot.rules.length - 1 ? 'disabled' : ''}>${icon('chevronDown')}</button>
            <button data-del title="Delete rule">${icon('trash')}</button>
          </span>
        </div>
        <div class="rule-body">
          <div class="rule-row">
            <div class="field">
              <label class="label">When a message</label>
              <select class="select" data-rule-match>
                ${Object.entries(MATCH_LABELS).map(([v, l]) => `<option value="${v}" ${r.match === v ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="label">Trigger</label>
              <input class="input" data-rule-trigger value="${esc(r.trigger || '')}" placeholder="/start or a keyword" ${r.match === 'fallback' || r.match === 'any' ? 'disabled' : ''} spellcheck="false" />
            </div>
          </div>
          <div class="field">
            <label class="label">Reply <span class="hint-dot">Telegram HTML works: &lt;b&gt; &lt;i&gt; &lt;code&gt; &lt;a&gt;</span></label>
            <textarea class="textarea" data-rule-reply rows="4" placeholder="Type the answer…">${esc(r.reply || '')}</textarea>
          </div>
          <div class="field">
            <div class="row-between"><span class="label">Inline buttons</span><button class="btn btn-ghost btn-sm" data-add-btn>${icon('plus')} Add</button></div>
            <div class="btn-row" data-rule-buttons>${(r.buttons || []).map((b, bi) => `
              <div class="btn-editor-row" data-btn="${bi}">
                <input class="input" data-btn-label value="${esc(b.label || '')}" placeholder="Button label" />
                <input class="input" data-btn-data value="${esc(b.url || b.data || '')}" placeholder="callback data or https://link" spellcheck="false" />
                <span class="pill" style="font-size:.6rem">${b.url ? 'URL' : 'CB'}</span>
                <button class="btn-del" data-del-btn title="Remove">${icon('x')}</button>
              </div>`).join('')}
            </div>
          </div>
          <div class="row-between mt-3">
            <span class="switch"><input type="checkbox" data-rule-enabled ${r.enabled !== false ? 'checked' : ''}><span class="track"></span> Enabled</span>
            <button class="btn btn-ghost btn-sm" data-test-rule>${icon('play')} Test</button>
          </div>
        </div>
      </div>`).join('') || `<div class="empty" style="padding:34px"><div class="empty-ico">${icon('message')}</div><h3>No replies yet</h3><p>Add your first rule, or start from a preset above.</p></div>`;

    wireRules();
    updateQuickInfo();
  }

  function wireRules() {
    rulesList.querySelectorAll('[data-rule]').forEach((item) => {
      const id = item.dataset.rule;
      const rule = bot.rules.find((r) => r.id === id);
      const head = item.querySelector('[data-head]');
      head.addEventListener('click', (e) => {
        if (e.target.closest('[data-del]') || e.target.closest('[data-up]') || e.target.closest('[data-down]')) return;
        editingRuleId = editingRuleId === id ? null : id;
        renderRules();
      });

      item.querySelector('[data-rule-match]')?.addEventListener('change', (e) => {
        rule.match = e.target.value;
        if (rule.match === 'fallback' || rule.match === 'any') rule.trigger = '';
        markDirty();
        renderRules();
      });
      item.querySelector('[data-rule-trigger]')?.addEventListener('input', (e) => {
        rule.trigger = e.target.value;
        const trigEl = item.querySelector('.rule-trigger');
        trigEl.textContent = ruleSummary(rule);
        markDirty();
      });
      item.querySelector('[data-rule-reply]')?.addEventListener('input', (e) => {
        rule.reply = e.target.value;
        item.querySelector('.rule-label').textContent = (rule.reply || '').replace(/\n/g, ' ').slice(0, 62) || 'Empty reply';
        markDirty();
      });
      item.querySelector('[data-rule-enabled]')?.addEventListener('change', (e) => {
        rule.enabled = e.target.checked;
        item.classList.toggle('disabled', !rule.enabled);
        markDirty();
      });

      item.querySelector('[data-add-btn]')?.addEventListener('click', () => {
        rule.buttons = rule.buttons || [];
        rule.buttons.push({ label: '', data: '', url: '' });
        markDirty();
        renderRules();
      });
      item.querySelectorAll('[data-btn]').forEach((row) => {
        const bi = Number(row.dataset.btn);
        row.querySelector('[data-btn-label]')?.addEventListener('input', (e) => {
          rule.buttons[bi].label = e.target.value; markDirty();
        });
        row.querySelector('[data-btn-data]')?.addEventListener('input', (e) => {
          const v = e.target.value.trim();
          if (/^https?:\/\//i.test(v)) { rule.buttons[bi].url = v; rule.buttons[bi].data = ''; }
          else { rule.buttons[bi].data = v; rule.buttons[bi].url = ''; }
          row.querySelector('.pill').textContent = rule.buttons[bi].url ? 'URL' : 'CB';
          markDirty();
        });
        row.querySelector('[data-del-btn]')?.addEventListener('click', () => {
          rule.buttons.splice(bi, 1);
          markDirty();
          renderRules();
        });
      });

      item.querySelector('[data-test-rule]')?.addEventListener('click', () => {
        persist();
        const sample = rule.match === 'fallback' || rule.match === 'any' ? 'hello there' : (rule.trigger || '/start');
        chat.submit(sample);
        toast(`Sent “${sample}” to the preview`, { type: 'info', timeout: 2200 });
      });
      item.querySelector('[data-del]')?.addEventListener('click', () => {
        if (bot.rules.length <= 1) { err('A bot needs at least one rule'); return; }
        bot.rules = bot.rules.filter((r) => r.id !== id);
        if (editingRuleId === id) editingRuleId = null;
        markDirty();
        renderRules();
      });
      item.querySelector('[data-up]')?.addEventListener('click', () => {
        const i = bot.rules.findIndex((r) => r.id === id);
        if (i <= 0) return;
        [bot.rules[i - 1], bot.rules[i]] = [bot.rules[i], bot.rules[i - 1]];
        markDirty(); renderRules();
      });
      item.querySelector('[data-down]')?.addEventListener('click', () => {
        const i = bot.rules.findIndex((r) => r.id === id);
        if (i < 0 || i >= bot.rules.length - 1) return;
        [bot.rules[i + 1], bot.rules[i]] = [bot.rules[i], bot.rules[i + 1]];
        markDirty(); renderRules();
      });
    });
  }

  el.querySelector('[data-add-rule]').addEventListener('click', () => {
    const rule = { id: uid('rule'), enabled: true, trigger: '', match: 'contains', reply: '', buttons: [] };
    bot.rules.push(rule);
    editingRuleId = rule.id;
    markDirty();
    renderRules();
    setTimeout(() => {
      rulesList.querySelector(`[data-rule="${rule.id}"] [data-rule-trigger]`)?.focus();
    }, 50);
  });

  el.querySelectorAll('[data-preset]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const preset = RULE_PRESETS[Number(chip.dataset.preset)];
      const rule = {
        id: uid('rule'),
        enabled: true,
        match: preset.match,
        trigger: preset.trigger,
        reply: preset.reply,
        buttons: JSON.parse(JSON.stringify(preset.buttons || []))
      };
      bot.rules.push(rule);
      editingRuleId = rule.id;
      markDirty();
      renderRules();
      ok(`Added “${preset.label.replace(/^\S+\s/, '')}” rule`, 'Preset added');
    });
  });

  /* ----------------------------- behaviour ----------------------------- */
  el.querySelectorAll('[data-setting]').forEach((input) => {
    const key = input.dataset.setting;
    if (!key || key === 'cooldown') return;
    input.addEventListener('change', () => {
      bot.settings[key] = input.checked;
      if (key === 'fallback' && !input.checked) info('Fallback disabled — unmatched messages will be ignored.', 'Heads up');
      markDirty();
    });
  });
  el.querySelector('[data-setting="cooldown"]')?.addEventListener('input', (e) => {
    const v = Math.max(0, Math.min(60000, Number(e.target.value) || 0));
    bot.settings.cooldown = v;
    markDirty();
  });
  el.querySelector('[data-commands]')?.addEventListener('input', (e) => {
    bot.commands = e.target.value.split(',').map((c) => c.trim().replace(/^\//, '')).filter(Boolean).slice(0, 24);
    markDirty();
  });
  el.querySelector('[data-push-profile]')?.addEventListener('click', async (e) => {
    if (!bot.token) return err('Add and test a token first');
    const btn = e.currentTarget;
    setLoading(btn, true, 'Pushing');
    try {
      const cmds = genCommandList(bot);
      if (cmds.length) await tg.setMyCommands(bot.token, cmds);
      if (bot.about) {
        await tg.setMyDescription(bot.token, bot.about.slice(0, 512));
        await tg.setMyShortDescription(bot.token, bot.about.slice(0, 120));
      }
      ok('Command menu and description pushed to Telegram', 'Profile updated');
    } catch (ex) {
      err(ex.message || 'Telegram rejected the update (CORS or bad token)');
    } finally {
      setLoading(btn, false);
    }
  });

  /* ----------------------------- launch ----------------------------- */
  function renderChecklist() {
    bot.launch = bot.launch || {};
    el.querySelectorAll('[data-checklist] [data-check]').forEach((cb) => {
      cb.checked = !!bot.launch[cb.dataset.check];
      cb.closest('.checklist-item').classList.toggle('done', cb.checked);
    });
  }
  el.querySelectorAll('[data-checklist] [data-check]').forEach((cb) => {
    cb.addEventListener('change', () => {
      bot.launch = bot.launch || {};
      bot.launch[cb.dataset.check] = cb.checked;
      cb.closest('.checklist-item').classList.toggle('done', cb.checked);
      persist();
    });
  });
  el.querySelector('[data-goto-runtime]')?.addEventListener('click', () => { location.hash = `/runtime/${bot.id}`; });
  el.querySelector('[data-goto-deploy]')?.addEventListener('click', () => { location.hash = `/deploy/${bot.id}`; });
  el.querySelector('[data-preview-modal]')?.addEventListener('click', () => {
    if (!bot.username) return err('Set a username (or test your token) first');
    window.open(`https://t.me/${bot.username.replace(/^@/, '')}`, '_blank', 'noopener');
  });
  el.querySelector('[data-save-now]')?.addEventListener('click', () => { persist(); ok('Bot saved to this browser'); });

  /* ----------------------------- menu actions ----------------------------- */
  const menu = el.querySelector('[data-menu]');
  el.querySelector('[data-menu-btn]').addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });
  el.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-wrap')) menu.hidden = true;
  });

  function downloadAll() {
    const files = Object.entries(GENERATORS).map(([key, g]) => ({ name: g.file, content: g.gen(bot) }));
    files.push({ name: 'package.json', content: genPackageJson(bot) });
    files.push({ name: 'requirements.txt', content: genRequirements() });
    files.push({ name: 'wrangler.toml', content: genWrangler(bot) });
    downloadZip(`${(bot.name || 'bot').toLowerCase().replace(/\s+/g, '-')}-botforge.zip`, files);
    ok('Downloaded worker.js, deno.ts, index.js, bot.py, config and README', 'Bundle ready');
  }

  el.querySelectorAll('button[data-act="zip"]').forEach((b) => b.addEventListener('click', downloadAll));

  el.querySelectorAll('[data-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.act;
      menu.hidden = true;
      if (act === 'preview') {
        openModal({
          title: `${bot.name} — preview`,
          subtitle: 'Runs locally. Nothing is sent to Telegram.',
          size: 'wide',
          body: `<div data-modal-chat style="max-width:380px;margin:0 auto"></div>`,
          onMount(modal) {
            const c = createChat({ getBot: () => bot, quickReplies: ['/start', '/help'], height: 330 });
            modal.querySelector('[data-modal-chat]').appendChild(c.el);
          }
        });
      }
      if (act === 'duplicate') {
        const copy = store.duplicateBot(bot.id);
        if (copy) { ok(`Duplicated as “${copy.name}”`); location.hash = `/builder/${copy.id}`; location.reload(); }
      }
      if (act === 'export') {
        exportBots(bot);
      }
      if (act === 'delete') {
        confirmDialog({
          title: 'Delete this bot?',
          message: `“${esc(bot.name)}” and all of its rules will be removed from this browser. This cannot be undone.`,
          confirm: 'Delete bot',
          danger: true,
          onConfirm: () => {
            store.deleteBot(bot.id);
            toast('Bot deleted', { type: 'ok' });
            location.hash = '#/bots';
          }
        });
      }
    });
  });

  /* ----------------------------- preview updates ----------------------------- */
  function previewSnapshot() {
    try {
      chat.setBot();
    } catch (e) { /* preview is optional */ }
  }
  const previewTimer = setInterval(previewSnapshot, 1500);

  const onSaveKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      persist();
      ok('Saved');
    }
  };
  document.addEventListener('keydown', onSaveKey);
  el._cleanup = () => {
    clearInterval(previewTimer);
    document.removeEventListener('keydown', onSaveKey);
  };

  /* initial paint */
  renderRules();
  updateQuickInfo();
  renderChecklist();
  setSaveState('saved');

  return el;
}
