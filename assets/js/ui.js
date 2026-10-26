/* ============================================================
   BotForge — UI kit (icons, toasts, modals, helpers)
   No dependencies. Everything runs locally.
   ============================================================ */

/* ----------------------------- icons ----------------------------- */
const P = {
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronLeft: '<path d="m15 5-7 7 7 7"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronUp: '<path d="m6 15 6-6 6 6"/>',
  arrowRight: '<path d="M4 12h15M13 6l7 6-7 6"/>',
  arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H5.5A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15"/>',
  download: '<path d="M12 3v12M7 11l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 16V4M7 8l5-5 5 5M4 21h16"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
  edit: '<path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m14.5 5.5 4 4"/>',
  pen: '<path d="M3 21h4l12-12a2.8 2.8 0 0 0-4-4L3 17v4Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  play: '<path d="M7 4.5v15l13-7.5-13-7.5Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.5 6.4"/><path d="M20 4v7h-7"/>',
  send: '<path d="M21 3 3 10.5l6.5 2.8L12 21l9-18Z"/><path d="m9.5 13.3 4.3-4.3"/>',
  terminal: '<path d="m5 7 5 5-5 5M13 17h6"/>',
  zap: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z"/>',
  shield: '<path d="M12 3 4.8 6v6c0 4.6 3 7.9 7.2 9 4.2-1.1 7.2-4.4 7.2-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9.5 2.5v3M14.5 2.5v3M9.5 18.5v3M14.5 18.5v3M2.5 9.5h3M2.5 14.5h3M18.5 9.5h3M18.5 14.5h3"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
  rocket: '<path d="M13.5 4.5c3.5-2 6-1.5 6-1.5s.5 2.5-1.5 6L14 13l-3-3 2.5-5.5Z"/><path d="M11 10 5 12l-1.5 4.5L8 15l2 2L11.5 21 15 15"/><circle cx="15.5" cy="8.5" r="1.5"/>',
  github: '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8.2v.1"/>',
  warning: '<path d="M12 3.5 2.8 19.5h18.4L12 3.5Z"/><path d="M12 9.5v4.2M12 16.8v.1"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.6 3.3M6.2 7.4A16 16 0 0 0 2.5 12S6 18 12 18c1.2 0 2.3-.2 3.3-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  key: '<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8-8M17 6l2 2M14.5 8.5l2 2"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  message: '<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5Z"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="4"/><path d="M12 4v4M8.5 14v.1M15.5 14v.1M9 17.5h6"/><circle cx="12" cy="3" r="1.4"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  link: '<path d="M10.5 13.5a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 1 0-6.4-6.4l-1 1"/><path d="M13.5 10.5a4.5 4.5 0 0 0-6.4 0l-2.6 2.6a4.5 4.5 0 1 0 6.4 6.4l1-1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.4-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4Z"/>',
  save: '<path d="M4 4h12l4 4v12H4V4Z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>',
  wifi: '<path d="M2.5 8.5a16 16 0 0 1 19 0M5.5 12a11.5 11.5 0 0 1 13 0M8.5 15.5a7 7 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>',
  server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5v.1M7 17.5v.1"/>',
  database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  filter: '<path d="M3 5h18l-7 8.5V21l-4-2v-5.5L3 5Z"/>',
  star: '<path d="m12 3 2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.3 6.5 20.3l1.1-6.3L3 9.6l6.3-.9L12 3Z"/>',
  package: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5"/>',
  gitBranch: '<circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 7.5v9M18 10.5c0 3-3 3.5-7 4.5"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  cloud: '<path d="M6.5 19a4.5 4.5 0 0 1-.4-9A6.5 6.5 0 0 1 18.6 9a4.5 4.5 0 0 1-.6 10H6.5Z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6v.1M3.5 12v.1M3.5 18v.1"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  drag: '<path d="M9 5h.1M15 5h.1M9 12h.1M15 12h.1M9 19h.1M15 19h.1"/>',
  pause2: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M7.5 15h9"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  shieldCheck: '<path d="M12 3 4.8 6v6c0 4.6 3 7.9 7.2 9 4.2-1.1 7.2-4.4 7.2-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.4a6.5 6.5 0 0 1 4 5.6"/>',
  spark: '<path d="M4 20 20 4M4 4l16 16"/>',
  inbox: '<path d="M3 12h5l2 3h4l2-3h5"/><path d="M4.5 5h15L21 12v7H3v-7l1.5-7Z"/>',
  key2: '<path d="M4 12h10M14 8h6v8h-6M18 8V5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  telegram: '<path d="M21.5 4.3 18.6 19c-.2 1-1.4 1.3-2.2.8l-5-3.7-2.4 2.3c-.3.3-.8.2-.9-.2l-1.2-4.4L19 6.2c.2-.2 0-.5-.3-.4L5.4 13.6 2 12.5c-1-.3-1-1.5.1-1.9L20.3 3.3c.9-.3 1.7.4 1.2 1Z"/>'
};

const FILLED = new Set(['telegram', 'github', 'star']);

export function icon(name, cls = '', size = 20) {
  const d = P[name];
  if (!d) return '';
  const fill = FILLED.has(name) ? 'currentColor' : 'none';
  return `<svg class="${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" aria-hidden="true">${d}</svg>`;
}

/* ----------------------------- dom helpers ----------------------------- */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function frag(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content;
}

export function esc(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function debounce(fn, ms = 220) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ----------------------------- format ----------------------------- */
export function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 45e3) return 'just now';
  const m = Math.floor(d / 60e3);
  if (m < 60) return `${m}m ago`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtTime(ts = Date.now()) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(ts = Date.now()) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

export function initials(name = 'B') {
  return name.trim().charAt(0).toUpperCase() || 'B';
}

export function num(n) {
  return new Intl.NumberFormat(undefined).format(n);
}

/* ----------------------------- toasts ----------------------------- */
const toastRoot = () => document.getElementById('toasts');

export function toast(message, { type = 'info', title = '', timeout = 4200 } = {}) {
  const root = toastRoot();
  if (!root) return;
  const icoName = { ok: 'shieldCheck', err: 'warning', warn: 'warning', info: 'info' }[type] || 'info';
  const node = h(`
    <div class="toast ${type}">
      ${icon(icoName, 't-ico')}
      <div>${title ? `<b>${esc(title)}</b><br>` : ''}${esc(message)}</div>
      <button class="t-close" aria-label="Dismiss">${icon('x')}</button>
    </div>`);
  const close = () => {
    node.classList.add('out');
    setTimeout(() => node.remove(), 300);
  };
  node.querySelector('.t-close').addEventListener('click', close);
  root.appendChild(node);
  if (timeout) setTimeout(close, timeout);
  return close;
}

export const ok = (m, t) => toast(m, { type: 'ok', title: t });
export const err = (m, t) => toast(m, { type: 'err', title: t });
export const info = (m, t) => toast(m, { type: 'info', title: t });

/* ----------------------------- modal ----------------------------- */
let activeModal = null;

export function openModal({ title, subtitle = '', body = '', footer = '', size = '', onMount, onClose, dismissible = true }) {
  closeModal(true);
  const root = document.getElementById('modalRoot');
  root.hidden = false;
  root.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-head">
        <div><h3 id="modalTitle">${esc(title)}</h3>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
        <button class="icon-btn" data-close aria-label="Close dialog">${icon('x')}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
    </div>`;
  const modal = root.querySelector('.modal');
  const close = () => closeModal();
  activeModal = { close };
  if (dismissible) {
    root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  }
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  root._onKey = onKey;
  if (onMount) onMount(modal, close);
  setTimeout(() => {
    const f = modal.querySelector('input:not([type=hidden]), textarea, select, [data-autofocus]');
    if (f) f.focus();
  }, 60);
  if (onClose) modal._onClose = onClose;
  return close;
}

export function closeModal(silent = false) {
  const root = document.getElementById('modalRoot');
  if (!root || root.hidden) { activeModal = null; return; }
  const modal = root.querySelector('.modal');
  if (modal && modal._onClose && !silent) modal._onClose();
  if (root._onKey) document.removeEventListener('keydown', root._onKey);
  root.hidden = true;
  root.innerHTML = '';
  activeModal = null;
}

export function confirmDialog({ title = 'Are you sure?', message = '', confirm = 'Confirm', danger = false, onConfirm }) {
  openModal({
    title,
    body: `<p class="text-dim" style="font-size:.9rem;line-height:1.7">${message}</p>`,
    footer: `
      <button class="btn btn-outline" data-close>Cancel</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="cfmOk">${esc(confirm)}</button>`,
    size: '',
    onMount(el, close) {
      el.querySelector('#cfmOk').addEventListener('click', () => { close(); onConfirm && onConfirm(); });
    }
  });
}

/* ----------------------------- clipboard / files ----------------------------- */
export async function copy(text, label = 'Copied to clipboard') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    ok(label);
    return true;
  } catch {
    err('Clipboard is blocked by your browser');
    return false;
  }
}

export function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

/* ----------------------------- misc ----------------------------- */
export function setLoading(btn, loading, labelWhenBusy = '') {
  if (!btn) return;
  if (loading) {
    btn.dataset.label = btn.innerHTML;
    btn.classList.add('is-busy');
    btn.innerHTML = `<span class="spinner"></span>${labelWhenBusy ? ` ${esc(labelWhenBusy)}` : ''}`;
  } else if (btn.dataset.label) {
    btn.classList.remove('is-busy');
    btn.innerHTML = btn.dataset.label;
  }
}

export function highlight(code) {
  // Tiny highlighter: strings, comments, keywords, numbers.
  let s = esc(code);
  s = s.replace(/(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span style="color:#7f8db0">$1</span>');
  s = s.replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;|&#39;(?:[^&]|&(?!#39;))*?&#39;|`[^`]*`)/g, '<span style="color:#7ee7c7">$1</span>');
  s = s.replace(/\b(const|let|var|function|return|if|else|for|of|in|new|async|await|class|import|export|from|default|try|catch|throw|def|elif|lambda|true|false|null|undefined|None|True|False)\b/g, '<span style="color:#c4b5fd">$1</span>');
  s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#fbbf24">$1</span>');
  return s;
}

export function copyBtn(text, label = 'Copy') {
  const b = document.createElement('button');
  b.className = 'btn btn-ghost btn-sm';
  b.innerHTML = `${icon('copy')} ${esc(label)}`;
  b.addEventListener('click', () => copy(text));
  return b;
}

export const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
