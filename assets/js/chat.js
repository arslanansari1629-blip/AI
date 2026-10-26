/* ============================================================
   BotForge — Telegram-style chat simulator component
   Used on the home page, inside the builder and on the runtime page.
   ============================================================ */

import { esc, icon, h, fmtTime } from './ui.js';
import { generateReply } from './store.js';

function telegramFmt(text = '') {
  return esc(text)
    .replace(/&lt;(\/?)(b|strong)&gt;/gi, '<$1b>')
    .replace(/&lt;(\/?)(i|em)&gt;/gi, '<$1i>')
    .replace(/&lt;(\/?)(code|pre)&gt;/gi, '<$1code>')
    .replace(/&lt;(\/?)(u|s)&gt;/gi, '<$1$2>')
    .replace(/\n/g, '<br>');
}

/**
 * @param {object} opts
 * @param {() => object} opts.getBot
 * @param {string} [opts.greeting]
 * @param {(text:string) => void} [opts.onUserMessage]
 */
export function createChat({ getBot, greeting, onUserMessage, onReply, quickReplies = [], height }) {
  const el = h(`
    <div class="phone">
      <div class="phone-top">
        <div class="phone-avatar" data-avatar>N</div>
        <div class="phone-meta">
          <div class="phone-name">
            <span data-name>Nova</span>
            <svg class="verified" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.6 12.4 2.9 2.9 5.9-6.2" stroke="#070a13" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="phone-status"><i class="dot-live" data-dot></i><span data-status>bot · online</span></div>
        </div>
        <button class="icon-btn" data-reset title="Reset chat" aria-label="Reset chat" style="width:30px;height:30px;border-radius:9px">${icon('refresh')}</button>
      </div>
      <div class="phone-body" data-body tabindex="0" role="log" aria-label="Chat messages" style="${height ? `max-height:${height}px` : ''}"></div>
      <div class="chat-form">
        <input data-input type="text" placeholder="Message…" autocomplete="off" aria-label="Message the bot" />
        <button data-send type="button" aria-label="Send">${icon('send')}</button>
      </div>
      ${quickReplies.length ? `<div class="quick-row">${quickReplies.map((q) => `<button class="quick-chip" data-quick="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
    </div>`);

  const body = el.querySelector('[data-body]');
  const input = el.querySelector('[data-input]');
  const quickRow = el.querySelector('.quick-row');

  function syncIdentity() {
    const bot = getBot() || {};
    el.querySelector('[data-name]').textContent = bot.name || 'Nova';
    el.querySelector('[data-avatar]').textContent = bot.emoji || (bot.name || 'N').charAt(0).toUpperCase();
    el.querySelector('[data-status]').textContent = `@${bot.username || 'your_bot'} · simulated`;
  }

  function scroll() {
    requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
  }

  function addMsg(text, who = 'bot', buttons = []) {
    const wrap = document.createElement('div');
    wrap.className = `msg ${who}`;
    const btns = buttons?.length
      ? `<div class="msg-buttons">${buttons.filter((b) => b && b.label).map((b) => `<button class="kbd-key" data-cb="${esc(b.data || b.label)}">${esc(b.label)}</button>`).join('')}</div>`
      : '';
    wrap.innerHTML = `
      <div class="bubble">${telegramFmt(text)}${btns}</div>
      <div class="msg-time">${fmtTime()}${who === 'me' ? ' ✓✓' : ''}</div>`;
    wrap.querySelectorAll('[data-cb]').forEach((b) => b.addEventListener('click', () => {
      addMsg(b.dataset.cb, 'me');
      respond(b.dataset.cb);
    }));
    body.appendChild(wrap);
    scroll();
  }

  function typing() {
    const t = h(`<div class="msg bot"><div class="bubble typing"><i></i><i></i><i></i></div></div>`);
    body.appendChild(t);
    scroll();
    return t;
  }

  function respond(text, fromName = 'Alex') {
    onUserMessage?.(text);
    const bot = getBot() || {};
    const reply = generateReply(bot, text, { fromName, fromUsername: 'alex_dev', fromId: '7700123' });
    const delay = bot.settings?.typing === false ? 320 : Math.min(1150, 380 + String(reply.text).length * 6);
    const t = typing();
    setTimeout(() => {
      t.remove();
      addMsg(reply.text, 'bot', reply.buttons);
      onReply?.(reply, text);
    }, delay);
    return reply;
  }

  function submit(value) {
    const text = (value ?? input.value).trim();
    if (!text) return;
    addMsg(text, 'me');
    input.value = '';
    respond(text);
  }

  el.querySelector('[data-send]').addEventListener('click', () => submit());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  });
  quickRow?.querySelectorAll('[data-quick]').forEach((b) => {
    b.addEventListener('click', () => submit(b.dataset.quick));
  });
  el.querySelector('[data-reset]').addEventListener('click', () => {
    body.innerHTML = '';
    start(greeting);
  });

  function start(text) {
    const bot = getBot() || {};
    const msg = text || `👋 Hi! I'm <b>${bot.name || 'Nova'}</b>, built with BotForge.\n\nTry /start, /help or just say hi.`;
    addMsg(msg, 'bot', [{ label: '🚀 /start', data: '/start' }, { label: '❓ /help', data: '/help' }]);
  }

  syncIdentity();
  start(greeting);

  return {
    el,
    addMsg,
    respond,
    submit,
    reset: () => { body.innerHTML = ''; start(greeting); },
    setBot: syncIdentity,
    setStatus: (text, live = true) => {
      el.querySelector('[data-status]').textContent = text;
      el.querySelector('[data-dot]').classList.toggle('off', !live);
    }
  };
}
