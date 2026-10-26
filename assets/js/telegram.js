/* ============================================================
   BotForge — Telegram Bot API client (browser)
   Talks directly to api.telegram.org. The bot token never leaves
   this device except in requests to Telegram itself.
   ============================================================ */

export const API_BASE = 'https://api.telegram.org';
export const TOKEN_RE = /^\d{6,12}:[A-Za-z0-9_-]{30,45}$/;

export class TelegramError extends Error {
  constructor(description, code, payload) {
    super(description || 'Telegram API error');
    this.name = 'TelegramError';
    this.code = code;
    this.payload = payload;
  }
}

export function isValidToken(token = '') {
  return TOKEN_RE.test(String(token).trim());
}

export function redact(token = '') {
  if (!token) return '—';
  const [id, secret] = String(token).split(':');
  if (!secret) return '••••';
  return `${id}:${secret.slice(0, 4)}…${secret.slice(-4)}`;
}

export function botIdFromToken(token = '') {
  return String(token).split(':')[0] || '';
}

/**
 * Low level call. Throws TelegramError on API errors and TypeError on
 * network/CORS failures (browser-specific).
 */
export async function tgCall(token, method, params = {}, { timeout = 15000, signal } = {}) {
  if (!token) throw new TelegramError('Missing bot token', 401);
  const url = `${API_BASE}/bot${token}/${method}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const onAbort = () => ctrl.abort();
  if (signal) signal.addEventListener('abort', onAbort, { once: true });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: ctrl.signal,
      cache: 'no-store'
    });
    let data;
    try { data = await res.json(); } catch { throw new TelegramError(`Invalid response (HTTP ${res.status})`, res.status); }
    if (!data.ok) {
      const retry = data.parameters?.retry_after;
      throw new TelegramError(data.description || `Telegram refused the request (${res.status})`, res.status, { ...data, retry_after: retry });
    }
    return data.result;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

export const tg = {
  getMe: (token, opts) => tgCall(token, 'getMe', {}, opts),
  getUpdates: (token, { offset = 0, timeout = 0, limit = 100, allowed_updates } = {}, opts) =>
    tgCall(token, 'getUpdates', { offset, timeout, limit, allowed_updates: allowed_updates || ['message', 'callback_query'] }, { timeout: (timeout + 12) * 1000, ...opts }),
  sendMessage: (token, chat_id, text, extra = {}, opts) =>
    tgCall(token, 'sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra }, opts),
  sendChatAction: (token, chat_id, action = 'typing', opts) => tgCall(token, 'sendChatAction', { chat_id, action }, opts),
  answerCallbackQuery: (token, callback_query_id, payload = {}, opts) => tgCall(token, 'answerCallbackQuery', { callback_query_id, ...payload }, opts),
  deleteWebhook: (token, opts) => tgCall(token, 'deleteWebhook', { drop_pending_updates: false }, opts),
  setWebhook: (token, url, opts) => tgCall(token, 'setWebhook', { url, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true }, opts),
  getWebhookInfo: (token, opts) => tgCall(token, 'getWebhookInfo', {}, opts),
  setMyCommands: (token, commands, opts) => tgCall(token, 'setMyCommands', { commands }, opts),
  getMyCommands: (token, opts) => tgCall(token, 'getMyCommands', {}, opts),
  setMyDescription: (token, description, opts) => tgCall(token, 'setMyDescription', { description }, opts),
  setMyShortDescription: (token, short_description, opts) => tgCall(token, 'setMyShortDescription', { short_description }, opts)
};

/**
 * Friendly probe used by the builder + runtime pages.
 * Returns { ok, reason, me } and never throws.
 */
export async function probeToken(token) {
  if (!isValidToken(token)) return { ok: false, reason: 'format' };
  try {
    const me = await tg.getMe(token, { timeout: 12000 });
    return { ok: true, me };
  } catch (e) {
    if (e instanceof TelegramError) {
      if (e.code === 401) return { ok: false, reason: 'unauthorized', detail: e.message };
      return { ok: false, reason: 'api', detail: e.message };
    }
    return { ok: false, reason: 'cors' };
  }
}

/**
 * Convert BotForge button config into Telegram inline_keyboard markup.
 * Rows capped at 3 per row for readability on mobile.
 */
export function buildInlineKeyboard(buttons = []) {
  const clean = buttons.filter((b) => b && b.label);
  if (!clean.length) return undefined;
  const rows = [];
  for (let i = 0; i < clean.length; i += 3) {
    rows.push(clean.slice(i, i + 3).map((b) => {
      if (b.url && /^https?:\/\//i.test(b.url)) return { text: b.label, url: b.url };
      return { text: b.label, callback_data: (b.data || b.label).slice(0, 64) };
    }));
  }
  return { inline_keyboard: rows };
}

export function telegramDeepLink(username) {
  const u = String(username || '').replace(/^@/, '').trim();
  return u ? `https://t.me/${u}` : '';
}
