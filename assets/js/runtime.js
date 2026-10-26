/* ============================================================
   BotForge — live polling runtime
   Long-polls the Telegram Bot API from the browser, answers using
   your BotForge rules and logs everything to the console panel.
   ============================================================ */

import { tg, TelegramError, buildInlineKeyboard } from './telegram.js';
import { generateReply } from './store.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Escape text for Telegram HTML mode while keeping <b>, <i>, <code>, <a>. */
export function toTelegramHtml(text = '') {
  const allowed = [];
  const stashed = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;(\/?)(b|i|code|pre|a|u|s)&gt;/gi, (_, slash, tag) => {
      allowed.push(`<${slash}${tag.toLowerCase()}>`);
      return `\u0000${allowed.length - 1}\u0000`;
    });
  return stashed.replace(/\u0000(\d+)\u0000/g, (_, i) => allowed[Number(i)]);
}

export class BotRunner {
  /**
   * @param {object} opts
   * @param {() => object} opts.getBot     live bot config
   * @param {(entry) => void} [opts.onLog]
   * @param {(status, detail) => void} [opts.onStatus]
   * @param {(update) => void} [opts.onUpdate]
   * @param {() => void} [opts.onStats]
   */
  constructor({ getBot, onLog, onStatus, onUpdate, onStats }) {
    this.getBot = getBot;
    this.onLog = onLog || (() => {});
    this.onStatus = onStatus || (() => {});
    this.onUpdate = onUpdate || (() => {});
    this.onStats = onStats || (() => {});

    this.status = 'idle';
    this.running = false;
    this.offset = 0;
    this.ctrl = null;
    this.cooldowns = new Map();
    this.stats = { updates: 0, replies: 0, errors: 0, startedAt: null };
    this._loopPromise = null;
  }

  log(type, msg, extra = {}) {
    this.onLog({ type, msg, ts: Date.now(), ...extra });
  }

  setStatus(status, detail = '') {
    this.status = status;
    this.onStatus(status, detail);
  }

  async start() {
    if (this.running) return true;
    const bot = this.getBot();
    if (!bot?.token) {
      this.setStatus('error', 'Add a bot token in the builder to go live.');
      return false;
    }

    this.running = true;
    this.offset = 0;
    this.stats = { updates: 0, replies: 0, errors: 0, startedAt: Date.now() };
    this.ctrl = new AbortController();
    this.setStatus('starting', 'Connecting to Telegram…');
    this.log('info', `Connecting to Telegram as <span class="hl">@${bot.username || 'unknown'}</span>…`);

    this._loopPromise = this.#loop();
    return true;
  }

  stop(reason = 'Stopped by you') {
    if (!this.running) return;
    this.running = false;
    this.ctrl?.abort();
    this.setStatus('stopped');
    this.log('warn', reason);
  }

  get uptime() {
    return this.stats.startedAt ? Math.floor((Date.now() - this.stats.startedAt) / 1000) : 0;
  }

  #isRunning() {
    return this.running && this.ctrl && !this.ctrl.signal.aborted;
  }

  async #loop() {
    let backoff = 1000;
    let connected = false;

    while (this.#isRunning()) {
      const bot = this.getBot();
      try {
        const updates = await tg.getUpdates(bot.token, { offset: this.offset, timeout: 25 }, { signal: this.ctrl.signal });

        if (!connected) {
          connected = true;
          backoff = 1000;
          this.setStatus('running', 'Polling Telegram');
          this.log('info', '✅ Connected. Waiting for updates…', { success: true });
        }

        for (const update of updates || []) {
          this.offset = Math.max(this.offset, update.update_id + 1);
          await this.#handleUpdate(update);
        }
      } catch (e) {
        if (!this.#isRunning() || e?.name === 'AbortError') break;
        this.stats.errors++;
        this.onStats();

        if (e instanceof TelegramError && e.code === 401) {
          this.running = false;
          this.setStatus('error', 'Telegram rejected the token (401).');
          this.log('err', `❌ 401 Unauthorized — the token is wrong or was revoked. Open the builder and test the token again.`);
          break;
        }
        if (e instanceof TelegramError && e.code === 409) {
          this.running = false;
          this.setStatus('error', 'A webhook is active for this bot (409).');
          this.log('err', `❌ 409 Conflict — a webhook is still registered. Remove it with <span class="hl">Delete webhook</span> and start again.`, { code: 409 });
          break;
        }
        if (e instanceof TypeError) {
          this.running = false;
          this.setStatus('blocked', 'Browser blocked the request to api.telegram.org');
          this.log('err', `❌ Network / CORS error. Browsers sometimes block direct Telegram calls. Use the free Cloudflare Worker from the Deploy page for 24/7 hosting.`);
          break;
        }

        const wait = Math.min(backoff, 30000);
        this.log('warn', `⚠️ ${e.message || 'Request failed'} — retrying in ${wait / 1000}s`, { code: e.code });
        this.setStatus('retrying', `Retrying in ${wait / 1000}s`);
        await sleep(wait);
        backoff *= 2;
      }
    }

    if (this.status !== 'error' && this.status !== 'blocked') this.setStatus('stopped');
  }

  async #handleUpdate(update) {
    const bot = this.getBot();
    this.stats.updates++;
    this.onStats();
    this.onUpdate(update);

    if (update.callback_query) {
      const cq = update.callback_query;
      try {
        await tg.answerCallbackQuery(bot.token, cq.id, {}, { signal: this.ctrl.signal });
      } catch { /* non-fatal */ }

      const name = [cq.from?.first_name, cq.from?.last_name].filter(Boolean).join(' ') || cq.from?.username || 'there';
      const reply = generateReply(bot, cq.data || '', {
        fromName: name,
        fromUsername: cq.from?.username || '',
        fromId: cq.from?.id || ''
      });
      this.log('in', `🔘 <span class="hl">${escapeLog(cq.data || '')}</span> <span class="dim">from @${escapeLog(cq.from?.username || cq.from?.id || 'unknown')}</span>`);
      await this.#respond(cq.message?.chat?.id, reply, { replyTo: cq.message?.message_id });
      return;
    }

    const msg = update.message || update.edited_message;
    if (!msg) return;
    const from = msg.from || {};
    if (bot.settings.ignoreBots && from.is_bot) {
      this.log('info', 'Ignored a message from another bot.');
      return;
    }

    const text = msg.text || msg.caption || '';
    if (!text) {
      this.log('in', `📎 <span class="dim">Unsupported message type (${escapeLog(Object.keys(msg).filter((k) => !['message_id', 'from', 'chat', 'date'].includes(k)).join(', ') || 'unknown')})</span>`);
      return;
    }

    const chatLabel = msg.chat?.type === 'private' ? `@${from.username || from.id}` : msg.chat?.title || msg.chat?.id;
    this.log('in', `💬 <span class="hl">${escapeLog(text.slice(0, 160))}</span> <span class="dim">← ${escapeLog(String(chatLabel))}</span>`);

    // per-chat cooldown
    const cd = Number(bot.settings.cooldown) || 0;
    const key = msg.chat?.id;
    if (cd > 0 && key) {
      const last = this.cooldowns.get(key) || 0;
      if (Date.now() - last < cd) {
        this.log('warn', `⏱ Cooldown active for this chat (${cd}ms) — skipped.`);
        return;
      }
      this.cooldowns.set(key, Date.now());
    }

    const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'there';
    const t0 = performance.now();
    const reply = generateReply(bot, text, {
      fromName: name,
      fromUsername: from.username || '',
      fromId: from.id || ''
    });
    reply.latency = Math.max(1, Math.round(performance.now() - t0));

    await this.#respond(msg.chat?.id, reply, { replyTo: msg.message_id });
  }

  async #respond(chatId, reply, { replyTo } = {}) {
    const bot = this.getBot();
    if (!chatId) return;
    this.stats.replies++;
    this.onStats();

    try {
      if (bot.settings.typing) {
        try {
          await tg.sendChatAction(bot.token, chatId, 'typing', { signal: this.ctrl.signal });
        } catch { /* non-fatal */ }
        const human = Math.min(1400, 260 + String(reply.text).length * 8);
        await sleep(human);
      } else {
        await sleep(120);
      }

      const markup = buildInlineKeyboard(reply.buttons);
      await tg.sendMessage(
        bot.token,
        chatId,
        toTelegramHtml(reply.text),
        {
          ...(markup ? { reply_markup: markup } : {}),
          ...(replyTo ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } } : {})
        },
        { signal: this.ctrl.signal }
      );
      this.log('out', `📤 <span class="hl">${escapeLog(String(reply.text).replace(/\s*\n+\s*/g, ' ⏎ ').slice(0, 160))}</span> <span class="dim">→ chat ${escapeLog(String(chatId))} · ${reply.latency}ms</span>`, { success: true });
    } catch (e) {
      if (e?.name === 'AbortError') return;
      this.stats.errors++;
      this.onStats();
      this.log('err', `❌ Failed to send: ${escapeLog(e.message || 'unknown error')}`);
    }
  }

  /** Run a message through the engine without touching Telegram. */
  simulate(text, fromName = 'Test User') {
    const bot = this.getBot();
    const reply = generateReply(bot, text, { fromName, fromUsername: 'test_user', fromId: '42424242' });
    this.log('in', `🧪 <span class="hl">${escapeLog(text)}</span> <span class="dim">← simulator</span>`);
    this.stats.updates++;
    this.onStats();
    setTimeout(() => {
      this.log('out', `📤 <span class="hl">${escapeLog(String(reply.text).replace(/\s*\n+\s*/g, ' ⏎ ').slice(0, 150))}</span> <span class="dim">· local engine ${reply.latency}ms</span>`, { success: true });
      this.stats.replies++;
      this.onStats();
    }, 280);
    return reply;
  }

  async sendManual(chatId, text) {
    const bot = this.getBot();
    await tg.sendMessage(bot.token, chatId, toTelegramHtml(text));
    this.log('out', `📨 Manual message sent to ${escapeLog(String(chatId))}`);
  }
}

export function escapeLog(s = '') {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
