/* ============================================================
   BotForge — live runtime page
   Long-polls Telegram from this tab, logs everything, plus a
   simulator that works with no token at all.
   ============================================================ */

import { h, icon, esc, $, $$, toast, ok, err, info, openModal, copy, setLoading, timeAgo, num, fmtTime } from '../ui.js';
import { store, generateReply } from '../store.js';
import { createChat } from '../chat.js';
import { BotRunner } from '../runtime.js';
import { tg, probeToken, redact } from '../telegram.js';

const STATUS_META = {
  idle: { label: 'Idle', cls: '', dot: 'off' },
  starting: { label: 'Connecting…', cls: 'info', dot: 'warn' },
  running: { label: 'Live', cls: 'ok', dot: '' },
  retrying: { label: 'Retrying', cls: 'warn', dot: 'warn' },
  stopped: { label: 'Stopped', cls: '', dot: 'off' },
  error: { label: 'Error', cls: 'danger', dot: 'warn' },
  blocked: { label: 'Blocked', cls: 'danger', dot: 'warn' }
};

const oneLine = (text, max = 150) => {
  const flat = String(text).replace(/\s*\n+\s*/g, ' ⏎ ');
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
};

const uptime = (s) => {
  if (!s) return '0s';
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return hh ? `${hh}h ${mm}m` : mm ? `${mm}m ${ss}s` : `${ss}s`;
};

export function render({ params }) {
  const bot = params[0] ? store.getBot(params[0]) : store.getBot(store.data.activeBotId) || store.bots[0];

  if (!bot) {
    return h(`
      <div class="wrap section">
        <div class="empty">
          <div class="empty-ico">${icon('bot')}</div>
          <h3>No bot to run yet</h3>
          <p>Create a bot first — it takes about two minutes, and you only need a token if you want it live on Telegram.</p>
          <div class="row" style="justify-content:center">
            <a class="btn btn-primary" href="#/builder">${icon('plus')} Create a bot</a>
            <a class="btn btn-outline" href="#/templates">${icon('layers')} Start from a template</a>
          </div>
        </div>
      </div>`);
  }

  const el = h(`
  <div class="wrap">
    <div class="page-head">
      <div class="breadcrumbs"><a href="#/">Home</a><span>/</span><a href="#/bots">My bots</a><span>/</span>Runtime</div>
      <div class="row-between">
        <div>
          <h1>Live runtime</h1>
          <p>Answer Telegram messages from this tab, or test the engine with zero network calls.</p>
        </div>
        <div class="row">
          <a class="btn btn-outline" href="#/builder/${bot.id}">${icon('pen')} Edit bot</a>
          <a class="btn btn-outline" href="#/deploy/${bot.id}">${icon('cloud')} 24/7 hosting</a>
        </div>
      </div>
    </div>

    <!-- bot bar -->
    <div class="card pad mb-4" style="padding:16px 18px">
      <div class="row-between" style="gap:14px">
        <div class="row" style="gap:12px;flex-wrap:nowrap;min-width:0">
          <span class="bot-avatar">${esc(bot.emoji || '🤖')}</span>
          <div style="min-width:0">
            <div class="row" style="gap:8px">
              <b>${esc(bot.name)}</b>
              <span class="pill ${bot.token ? (bot.tokenInfo ? 'ok' : 'info') : 'warn'}" style="font-size:.62rem">
                ${bot.tokenInfo ? `verified · @${esc(bot.tokenInfo.username)}` : bot.token ? `token ${esc(redact(bot.token))}` : 'no token'}
              </span>
            </div>
            <div class="tiny muted">${bot.rules.length} rules · ${(bot.commands || []).length} commands · updated ${timeAgo(bot.updatedAt)}</div>
          </div>
        </div>
        <div class="row" style="gap:8px">
          <select class="select" data-picker aria-label="Choose a bot" style="width:auto;min-height:38px;padding:8px 34px 8px 12px;font-size:.82rem">
            ${store.bots.map((b) => `<option value="${b.id}" ${b.id === bot.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
          </select>
          <span class="pill" data-status-pill style="font-size:.7rem"><i class="dot-live off" data-status-dot></i> <span data-status-text>Idle</span></span>
        </div>
      </div>
    </div>

    <div class="stat-grid mb-4">
      <div class="stat-block"><b data-uptime>0s</b><span>uptime</span></div>
      <div class="stat-block"><b data-updates>0</b><span>updates</span></div>
      <div class="stat-block"><b data-replies>0</b><span>replies</span></div>
      <div class="stat-block"><b data-errors>0</b><span>errors</span></div>
    </div>

    <div class="runtime-grid">
      <div>
        <div class="console">
          <div class="console-bar">
            <div class="dots"><i></i><i></i><i></i></div>
            <span class="console-title">botforge · runtime.log</span>
            <div class="console-actions">
              <select class="select" data-filter aria-label="Filter log entries" style="width:auto;min-height:28px;padding:3px 26px 3px 8px;font-size:.68rem;background-color:transparent">
                <option value="all">All</option>
                <option value="traffic">Traffic</option>
                <option value="errors">Errors</option>
              </select>
              <button class="icon-btn" data-copy-log title="Copy log" style="width:28px;height:28px;border-radius:8px">${icon('copy')}</button>
              <button class="icon-btn" data-clear-log title="Clear log" style="width:28px;height:28px;border-radius:8px">${icon('trash')}</button>
            </div>
          </div>
          <div class="console-body" data-log tabindex="0" role="log" aria-label="Runtime console output">
            <div class="console-empty">
              ${icon('terminal')}
              <div>Console ready.<br />Start the runtime or use the simulator.</div>
            </div>
          </div>
        </div>

        <div class="card pad mt-3">
          <div class="row" style="gap:9px;flex-wrap:wrap">
            <button class="btn btn-primary" data-start>${icon('play')} Start runtime</button>
            <button class="btn btn-outline" data-stop disabled>${icon('pause')} Stop</button>
            <button class="btn btn-ghost btn-sm" data-test>${icon('wifi')} Test token</button>
            <button class="btn btn-ghost btn-sm" data-webhook>${icon('info')} Webhook info</button>
            <button class="btn btn-ghost btn-sm" data-remove-hook>${icon('trash')} Remove webhook</button>
            <button class="btn btn-ghost btn-sm" data-send>${icon('send')} Send message</button>
            <label class="switch" style="margin-left:auto;font-size:.74rem"><input type="checkbox" data-follow checked><span class="track"></span> Follow log</label>
          </div>
        </div>
      </div>

      <div class="stack" style="gap:16px">
        <div class="card pad">
          <div class="row-between mb-2">
            <h2 class="card-h" style="margin:0">Simulator</h2>
            <span class="pill" style="font-size:.6rem">offline</span>
          </div>
          <div data-chat></div>
          <p class="tiny muted mt-2" style="text-align:center">Runs only in this browser · no rate limits</p>
        </div>

        <div class="card pad">
          <h2 class="card-h">Need 24/7 uptime?</h2>
          <p class="small mt-1">This tab answers messages while it is open. Deploy the generated Worker to Cloudflare's free tier and your bot runs forever without you.</p>
          <a class="btn btn-outline btn-sm mt-2" href="#/deploy/${bot.id}">${icon('rocket')} Free deploy guide</a>
        </div>

        <div class="hint-card">
          ${icon('info')}
          <div><b>409 Conflict?</b> Telegram allows either a webhook or polling, never both. Tap <b>Remove webhook</b> once, then start again.</div>
        </div>
        <div class="hint-card">
          ${icon('shield')}
          <div>Tokens stay in this browser. The runtime talks straight to <code>api.telegram.org</code> — no BotForge server in between.</div>
        </div>
      </div>
    </div>
  </div>`);

  /* ----------------------------- refs ----------------------------- */
  const logEl = el.querySelector('[data-log]');
  const startBtn = el.querySelector('[data-start]');
  const stopBtn = el.querySelector('[data-stop]');
  const followEl = el.querySelector('[data-follow]');
  const filterEl = el.querySelector('[data-filter]');
  const statusText = el.querySelector('[data-status-text]');
  const statusDot = el.querySelector('[data-status-dot]');
  const statusPill = el.querySelector('[data-status-pill]');

  let entries = [];
  let filter = 'all';

  /* ----------------------------- logging ----------------------------- */
  function renderLog() {
    const visible = entries.filter((e) => {
      if (filter === 'all') return true;
      if (filter === 'traffic') return e.type === 'in' || e.type === 'out';
      return e.type === 'err' || e.type === 'warn';
    });
    if (!visible.length) {
      logEl.innerHTML = `<div class="console-empty">${icon('terminal')}<div>${entries.length ? 'No entries match this filter.' : 'Console ready.<br />Start the runtime or use the simulator.'}</div></div>`;
      return;
    }
    logEl.innerHTML = visible.slice(-300).map((e) => `
      <div class="log-line">
        <span class="lt">${fmtTime(e.ts)}</span>
        <span class="log-tag ${e.type}">${{ in: 'IN', out: 'OUT', info: 'INFO', warn: 'WARN', err: 'ERR' }[e.type] || 'INFO'}</span>
        <span class="log-msg">${e.msg}</span>
      </div>`).join('');
    if (followEl.checked) logEl.scrollTop = logEl.scrollHeight;
  }

  const log = (entry) => {
    entries.push({ ts: Date.now(), ...entry });
    if (entries.length > 400) entries = entries.slice(-400);
    renderLog();
  };

  log({ type: 'info', msg: `Runtime ready for <span class="hl">${esc(bot.name)}</span> · engine v2 · token ${bot.token ? 'present' : '<span class="dim">missing</span>'}` });
  log({ type: 'info', msg: `Tip: use <span class="hl">Start runtime</span> (needs a token) or send messages in the simulator.` });

  /* ----------------------------- status ----------------------------- */
  function setStatus(status, detail = '') {
    const meta = STATUS_META[status] || STATUS_META.idle;
    statusText.textContent = detail || meta.label;
    statusPill.className = `pill ${meta.cls}`;
    statusDot.className = `dot-live ${meta.dot}`;
    const live = status === 'running' || status === 'starting' || status === 'retrying';
    startBtn.disabled = live;
    stopBtn.disabled = !live;
  }

  /* ----------------------------- runner ----------------------------- */
  const runner = new BotRunner({
    getBot: () => bot,
    onLog: (entry) => {
      log(entry);
      if (entry.success && entry.type === 'out') store.bumpStat(bot.id, 'messages');
    },
    onStatus: (status, detail) => {
      setStatus(status, detail);
      if (status === 'running') toast('Bot is live — message it on Telegram', { type: 'ok', title: 'Connected' });
    },
    onUpdate: () => store.bumpStat(bot.id, 'updates'),
    onStats: () => updateStats()
  });

  function updateStats() {
    el.querySelector('[data-updates]').textContent = num(runner.stats.updates);
    el.querySelector('[data-replies]').textContent = num(runner.stats.replies);
    el.querySelector('[data-errors]').textContent = num(runner.stats.errors);
    el.querySelector('[data-uptime]').textContent = uptime(runner.uptime);
  }

  const uptimeTimer = setInterval(updateStats, 1000);

  /* ----------------------------- actions ----------------------------- */
  startBtn.addEventListener('click', async () => {
    if (!bot.token) {
      openModal({
        title: 'A token is required to go live',
        subtitle: 'You can still use the simulator without one.',
        body: `
          <div class="stack gap-2">
            <p class="small text-dim">Open @BotFather on Telegram, send <code class="code-inline">/newbot</code>, and copy the token. Then paste it in step 2 of the builder.</p>
            <div class="link-box"><span>https://t.me/BotFather</span><button class="btn btn-ghost btn-sm" data-copy>${icon('copy')}</button></div>
          </div>`,
        footer: `<a class="btn btn-outline" data-close>Cancel</a><a class="btn btn-primary" href="#/builder/${bot.id}">Open builder</a>`,
        onMount(modal) {
          modal.querySelector('[data-copy]').addEventListener('click', () => copy('https://t.me/BotFather'));
        }
      });
      return;
    }
    setStatus('starting');
    const started = await runner.start();
    if (!started) setStatus('error', 'Could not start');
    updateStats();
  });

  stopBtn.addEventListener('click', () => { runner.stop(); updateStats(); });

  el.querySelector('[data-test]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (!bot.token) return err('No token saved for this bot');
    setLoading(btn, true, 'Testing');
    const res = await probeToken(bot.token);
    setLoading(btn, false);
    if (res.ok) {
      bot.tokenInfo = res.me; store.saveBot(bot);
      log({ type: 'info', msg: `✅ Token valid — <span class="hl">@${esc(res.me.username)}</span> (${esc(res.me.first_name)})` });
      ok(`Connected as @${res.me.username}`);
    } else if (res.reason === 'cors') {
      log({ type: 'warn', msg: '⚠️ Browser blocked api.telegram.org (CORS). Deploy the generated Worker for reliable 24/7 operation.' });
      info('Browser blocked Telegram. Use a generated Cloudflare Worker for production hosting.', 'CORS restriction');
    } else {
      log({ type: 'err', msg: `❌ Token check failed: ${esc(res.detail || res.reason)}` });
      err(res.detail || 'Token check failed');
    }
  });

  el.querySelector('[data-webhook]').addEventListener('click', async () => {
    if (!bot.token) return err('No token saved');
    try {
      const infoRes = await tg.getWebhookInfo(bot.token);
      log({ type: 'info', msg: infoRes.url ? `🔗 Webhook: <span class="hl">${esc(infoRes.url)}</span> · pending ${infoRes.pending_update_count || 0}` : '🔗 No webhook registered — polling is allowed.' });
      ok(infoRes.url ? 'A webhook is registered' : 'No webhook registered', 'Webhook status');
    } catch (e) {
      log({ type: 'warn', msg: `⚠️ Could not read webhook info: ${esc(e.message || 'network/CORS')}` });
      info(e.message || 'Request blocked (network/CORS)', 'Webhook info unavailable');
    }
  });

  el.querySelector('[data-remove-hook]').addEventListener('click', async (e) => {
    if (!bot.token) return err('No token saved');
    const btn = e.currentTarget;
    setLoading(btn, true, 'Removing');
    try {
      await tg.deleteWebhook(bot.token);
      log({ type: 'info', msg: '🧹 Webhook removed — polling can start now.' });
      ok('Webhook deleted. You can start polling.');
    } catch (ex) {
      log({ type: 'err', msg: `❌ deleteWebhook failed: ${esc(ex.message || 'network/CORS')}` });
      err(ex.message || 'Could not delete webhook');
    } finally {
      setLoading(btn, false);
    }
  });

  el.querySelector('[data-send]').addEventListener('click', () => {
    if (!bot.token) return err('No token saved');
    openModal({
      title: 'Send a message',
      subtitle: 'Useful for testing after someone has messaged your bot (their chat id shows in the log).',
      body: `
        <div class="field">
          <label class="label">Chat ID</label>
          <input class="input" data-chat-id placeholder="123456789" inputmode="numeric" />
          <span class="field-hint">Find it in the console log — every IN line shows the chat id on send.</span>
        </div>
        <div class="field">
          <label class="label">Message</label>
          <textarea class="textarea" data-text placeholder="Hello from BotForge 👋">Hello from BotForge 👋</textarea>
        </div>`,
      footer: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" data-send-now>${icon('send')} Send</button>`,
      onMount(modal, close) {
        modal.querySelector('[data-send-now]').addEventListener('click', async (e) => {
          const chatId = modal.querySelector('[data-chat-id]').value.trim();
          const text = modal.querySelector('[data-text]').value.trim();
          if (!chatId || !text) return err('Both fields are required');
          setLoading(e.currentTarget, true, 'Sending');
          try {
            await tg.sendMessage(bot.token, chatId, text);
            log({ type: 'out', msg: `📨 Manual message sent to <span class="hl">${esc(chatId)}</span>` });
            ok('Message sent');
            close();
          } catch (ex) {
            err(ex.message || 'Telegram rejected the message');
          } finally {
            setLoading(e.currentTarget, false);
          }
        });
      }
    });
  });

  el.querySelector('[data-clear-log]').addEventListener('click', () => {
    entries = [];
    log({ type: 'info', msg: 'Console cleared.' });
  });
  el.querySelector('[data-copy-log]').addEventListener('click', () => {
    const text = entries.map((e) => `[${fmtTime(e.ts)}] ${e.type.toUpperCase()} ${e.msg.replace(/<[^>]+>/g, '')}`).join('\n');
    copy(text, 'Log copied');
  });
  el.querySelector('[data-filter]').addEventListener('change', (e) => {
    filter = e.target.value;
    renderLog();
  });
  el.querySelector('[data-picker]').addEventListener('change', (e) => {
    location.hash = `/runtime/${e.target.value}`;
  });

  /* ----------------------------- simulator ----------------------------- */
  const chat = createChat({
    getBot: () => bot,
    quickReplies: ['/start', ...(bot.commands || []).filter((c) => c !== 'start').slice(0, 3).map((c) => `/${c}`)],
    height: 300,
    onUserMessage: (text) => {
      log({ type: 'in', msg: `🧪 <span class="hl">${esc(text)}</span> <span class="dim">← simulator</span>` });
    },
    onReply: (reply) => {
      log({ type: 'out', msg: `📤 <span class="hl">${esc(oneLine(reply.text, 150))}</span> <span class="dim">· local engine ${reply.latency}ms</span>` });
    }
  });
  el.querySelector('[data-chat]').appendChild(chat.el);

  updateStats();
  setStatus('idle');

  el._cleanup = () => {
    clearInterval(uptimeTimer);
    runner.stop('Runtime closed (tab navigated away)');
  };

  return el;
}
