/* ============================================================
   BotForge — app bootstrap, hash router, theme, palette, fx
   ============================================================ */

import { $, $$, icon, esc, toast, err, ok, openModal, closeModal, download, h } from './ui.js';
import { store } from './store.js';
import { exportBots, importBots } from './io.js';

/* ----------------------------- views ----------------------------- */
import * as home from './views/home.js';
import * as builder from './views/builder.js';
import * as bots from './views/bots.js';
import * as runtime from './views/runtime.js';
import * as templates from './views/templates.js';
import * as deploy from './views/deploy.js';
import * as docs from './views/docs.js';

const ROUTES = [
  { name: 'home', re: /^\/?$/, view: home, nav: 'home', title: 'BotForge — Free Telegram Bot Hosting, No Login, Unlimited' },
  { name: 'builder', re: /^\/builder(?:\/([\w-]+))?$/, view: builder, nav: 'builder', title: 'Bot Builder — BotForge' },
  { name: 'bots', re: /^\/bots$/, view: bots, nav: 'bots', title: 'My bots — BotForge' },
  { name: 'runtime', re: /^\/runtime(?:\/([\w-]+))?$/, view: runtime, nav: 'runtime', title: 'Live runtime — BotForge' },
  { name: 'templates', re: /^\/templates$/, view: templates, nav: 'templates', title: 'Templates — BotForge' },
  { name: 'deploy', re: /^\/deploy(?:\/([\w-]+))?$/, view: deploy, nav: 'deploy', title: 'Deploy for free — BotForge' },
  { name: 'docs', re: /^\/docs$/, view: docs, nav: 'docs', title: 'Docs — BotForge' }
];

let currentCleanup = null;
let currentView = null;

/* ----------------------------- theme ----------------------------- */
function applyTheme(theme) {
  const resolved = theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', resolved === 'light' ? '#f4f6fc' : '#05060a');
}

function initTheme() {
  applyTheme(store.settings.theme === 'auto' ? null : store.settings.theme);
  $('#themeBtn')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.setSetting('theme', next);
    toast(`${next[0].toUpperCase() + next.slice(1)} mode on`, { type: 'info', timeout: 1600 });
  });
}

/* ----------------------------- router ----------------------------- */
function parseHash() {
  const raw = (location.hash || '#/').slice(1);
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart || '/';
  const query = Object.fromEntries(new URLSearchParams(queryPart || ''));
  return { path, query };
}

function setProgress(state) {
  const bar = $('#routeProgress');
  if (!bar) return;
  bar.classList.remove('loading', 'done');
  if (state === 'loading') bar.classList.add('loading');
  if (state === 'done') {
    bar.classList.add('done');
    setTimeout(() => bar.classList.remove('done'), 500);
  }
}

function setActiveNav(name) {
  $$('#nav a').forEach((a) => {
    const active = a.dataset.nav === name;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function renderRoute() {
  const { path, query } = parseHash();
  const match = ROUTES.map((r) => ({ r, m: path.match(r.re) })).find((x) => x.m);
  const route = match?.r || ROUTES[0];
  const params = match?.m?.slice(1).filter(Boolean) || [];

  setProgress('loading');
  if (currentCleanup) {
    try { currentCleanup(); } catch (e) { console.error(e); }
    currentCleanup = null;
  }

  document.title = route.title;
  setActiveNav(route.nav);
  $('#nav')?.classList.remove('open');
  $('#burger')?.setAttribute('aria-expanded', 'false');

  const main = $('#view');
  main.innerHTML = '';
  main.style.minHeight = `${Math.max(main.offsetHeight, 320)}px`;

  try {
    const view = route.view.render({ params, query, path });
    if (!view) throw new Error('View returned nothing');
    main.appendChild(view);
    currentView = route.name;
    currentCleanup = view._cleanup || null;
    initReveal(main);
    document.dispatchEvent(new CustomEvent('botforge:view', { detail: { name: route.name, params, query } }));
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  } catch (e) {
    console.error('[BotForge] Route error:', e);
    main.innerHTML = `
      <div class="wrap section">
        <div class="empty">
          <div class="empty-ico">${icon('warning')}</div>
          <h3>Something went wrong rendering this page</h3>
          <p class="mono small">${esc(e.message || String(e))}</p>
          <a class="btn btn-primary" href="#/">Back to home</a>
        </div>
      </div>`;
    currentCleanup = null;
  }
  setProgress('done');
  updateFooter();
}

export function navigate(path) {
  if ((location.hash || '#/') === `#${path}`) renderRoute();
  else location.hash = path;
}

/* ----------------------------- reveal ----------------------------- */
let revealObserver;
function initReveal(root = document) {
  if (!('IntersectionObserver' in window)) {
    $$('.reveal', root).forEach((el) => el.classList.add('in'));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  }
  const vh = window.innerHeight || 800;
  $$('.reveal:not(.in)', root).forEach((el, i) => {
    const rect = el.getBoundingClientRect();
    // Anything already on screen (or above it) shows immediately — no flash, no hidden content.
    if (rect.top < vh * 1.05) {
      el.classList.add('in');
      return;
    }
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 55}ms`;
    revealObserver.observe(el);
  });

  // Failsafe: never leave content invisible.
  clearTimeout(window.__revealFailsafe);
  window.__revealFailsafe = setTimeout(() => {
    $$('.reveal:not(.in)', root).forEach((el) => {
      if (el.getBoundingClientRect().top < (window.innerHeight || 800) * 1.4) el.classList.add('in');
    });
  }, 1200);
}

/* ----------------------------- footer ----------------------------- */
function updateFooter() {
  const el = $('#footerBots');
  if (!el) return;
  const n = store.bots.length;
  const t = store.totalStats();
  el.textContent = `${n} bot${n === 1 ? '' : 's'}`;
  el.title = `${t.updates} updates · ${t.messages} replies handled locally`;
  $('#year') && ($('#year').textContent = new Date().getFullYear());
}

/* ----------------------------- header ----------------------------- */
function initHeader() {
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger');
  const nav = $('#nav');
  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav?.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ----------------------------- palette ----------------------------- */
function paletteItems() {
  return [
    { group: 'Pages', label: 'Home', sub: 'G #/', icon: 'sparkles', run: () => navigate('/') },
    { group: 'Pages', label: 'Bot builder', sub: 'G #/builder', icon: 'sliders', run: () => navigate('/builder') },
    { group: 'Pages', label: 'My bots', sub: 'G #/bots', icon: 'bot', run: () => navigate('/bots') },
    { group: 'Pages', label: 'Live runtime', sub: 'G #/runtime', icon: 'play', run: () => navigate('/runtime') },
    { group: 'Pages', label: 'Templates', sub: 'G #/templates', icon: 'layers', run: () => navigate('/templates') },
    { group: 'Pages', label: 'Deploy for free', sub: 'G #/deploy', icon: 'rocket', run: () => navigate('/deploy') },
    { group: 'Pages', label: 'Documentation', sub: 'G #/docs', icon: 'book', run: () => navigate('/docs') },
    {
      group: 'Actions', label: 'Create a new bot', sub: 'Instant', icon: 'plus', run: () => {
        const bot = store.newBot({ name: `Bot ${store.bots.length + 1}`, username: '' });
        toast('New bot created', { type: 'ok' });
        navigate(`/builder/${bot.id}`);
      }
    },
    { group: 'Actions', label: 'Toggle dark / light theme', sub: 'Appearance', icon: 'eye', run: () => $('#themeBtn')?.click() },
    { group: 'Actions', label: 'Export all bots as JSON', sub: 'Backup', icon: 'download', run: () => exportBots() },
    { group: 'Actions', label: 'Import bots from JSON', sub: 'Restore', icon: 'upload', run: () => importBots() },
    { group: 'Actions', label: 'Open source on GitHub', sub: 'External', icon: 'github', run: () => window.open('https://github.com/arslanansari1629-blip/AI', '_blank', 'noopener') }
  ];
}

let paletteIndex = 0;

function openPalette() {
  const root = $('#palette');
  root.hidden = false;
  const input = $('#paletteInput');
  input.value = '';
  paletteIndex = 0;
  drawPalette('');
  setTimeout(() => input.focus(), 30);
}

function closePalette() {
  const root = $('#palette');
  if (root) root.hidden = true;
}

function drawPalette(query) {
  const list = $('#paletteList');
  const q = query.toLowerCase().trim();
  const items = paletteItems().filter((i) => !q || `${i.label} ${i.group} ${i.sub}`.toLowerCase().includes(q));
  paletteIndex = Math.min(paletteIndex, Math.max(items.length - 1, 0));
  if (!items.length) {
    list.innerHTML = `<div class="palette-group">No matches</div><div class="palette-item">Try “builder”, “deploy” or “export”</div>`;
    return;
  }
  let lastGroup = '';
  list.innerHTML = items.map((item, i) => {
    const g = item.group !== lastGroup ? `<div class="palette-group">${esc(item.group)}</div>` : '';
    lastGroup = item.group;
    return `${g}<button class="palette-item ${i === paletteIndex ? 'selected' : ''}" data-i="${i}" role="option" aria-selected="${i === paletteIndex}">
      <span class="pi-ico">${icon(item.icon)}</span>
      <span>${esc(item.label)}</span>
      <span class="pi-sub">${esc(item.sub)}</span>
    </button>`;
  }).join('');
  list.querySelectorAll('.palette-item[data-i]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = items[Number(btn.dataset.i)];
      closePalette();
      item?.run();
    });
  });
}

function initPalette() {
  $('#paletteBtn')?.addEventListener('click', openPalette);
  const input = $('#paletteInput');
  input?.addEventListener('input', () => { paletteIndex = 0; drawPalette(input.value); });
  $('#palette')?.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closePalette();
  });
  document.addEventListener('keydown', (e) => {
    const paletteOpen = !$('#palette')?.hidden;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      paletteOpen ? closePalette() : openPalette();
      return;
    }
    if (!paletteOpen) return;
    const items = $('#paletteList').querySelectorAll('.palette-item[data-i]');
    if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      paletteIndex = (paletteIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((el, i) => {
        el.classList.toggle('selected', i === paletteIndex);
        el.setAttribute('aria-selected', String(i === paletteIndex));
        if (i === paletteIndex) el.scrollIntoView({ block: 'nearest' });
      });
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      items[paletteIndex]?.click();
    }
  });
}

/* ----------------------------- card spotlight ----------------------------- */
function initCardSpotlight() {
  if (matchMedia('(hover: none)').matches) return;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.feature, .tpl-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  }, { passive: true });
}

/* ----------------------------- background fx ----------------------------- */
function initBackground() {
  const canvas = $('#bgCanvas');
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w, h, dpr, particles = [], raf = 0;
  const mouse = { x: -999, y: -999 };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(78, Math.round((w * h) / 26000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.5 + 0.5
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    const isLight = document.documentElement.dataset.theme === 'light';
    const dot = isLight ? 'rgba(79,70,229,' : 'rgba(148,163,255,';
    const line = isLight ? 'rgba(79,70,229,' : 'rgba(99,102,241,';

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = dot + '0.5)';
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = dx * dx + dy * dy;
        if (dist < 16000) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = line + (0.12 * (1 - dist / 16000)).toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
      const mdx = particles[i].x - mouse.x, mdy = particles[i].y - mouse.y;
      const md = mdx * mdx + mdy * mdy;
      if (md < 24000) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = line + (0.2 * (1 - md / 24000)).toFixed(3) + ')';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('pointerleave', () => { mouse.x = -999; mouse.y = -999; });
  resize();
  tick();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) tick();
  });
}

/* ----------------------------- boot ----------------------------- */
function boot() {
  initTheme();
  initHeader();
  initPalette();
  initCardSpotlight();
  initBackground();
  updateFooter();

  store.subscribe(updateFooter);

  // Global delegated links → hash router already handles, but make external safe.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (a) {
      const target = a.getAttribute('href');
      if (target === location.hash) {
        e.preventDefault();
        renderRoute();
      }
    }
    const ext = e.target.closest('a[target="_blank"]');
    if (ext) ext.setAttribute('rel', 'noopener noreferrer');
  });

  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('storage', (e) => {
    if (e.key === 'botforge.v1') {
      location.reload();
    }
  });

  if (!location.hash) history.replaceState(null, '', '#/');
  renderRoute();

  // PWA
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // Flag first visit
  if (!store.bots.length && !store.data.seenWelcome) {
    store.data.seenWelcome = true;
    store.save();
  }
}

boot();

export { renderRoute, openModal, closeModal, h };
