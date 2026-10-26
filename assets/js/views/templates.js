/* ============================================================
   BotForge — template gallery
   ============================================================ */

import { h, icon, esc, $, $$, toast, ok, openModal, err } from '../ui.js';
import { store } from '../store.js';
import { TEMPLATES, TEMPLATE_CATEGORIES, getTemplate, applyTemplate } from '../templates.js';
import { createChat } from '../chat.js';
import { generateReply } from '../store.js';

export function render({ query }) {
  let activeCat = 'All';
  let search = '';

  const el = h(`
  <div class="wrap">
    <div class="page-head">
      <div class="breadcrumbs"><a href="#/">Home</a><span>/</span>Templates</div>
      <div class="row-between">
        <div>
          <h1>Templates</h1>
          <p>Thirteen production-shaped bots. Pick one, name it, and you land in the builder with every rule already written.</p>
        </div>
        <a class="btn btn-outline" href="#/builder">${icon('plus')} Start from blank</a>
      </div>
    </div>

    <div class="filter-bar">
      ${TEMPLATE_CATEGORIES.map((c) => `<button class="chip ${c === 'All' ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
      <div class="input-affix" style="margin-left:auto;max-width:260px">
        <span class="prefix">${icon('search')}</span>
        <input class="input" data-search placeholder="Search templates…" autocomplete="off" />
      </div>
    </div>

    <div class="tpl-grid" data-grid></div>

    <section class="section-tight">
      <div class="card pad" style="background:radial-gradient(600px 240px at 15% 0%,rgba(99,102,241,.18),transparent 70%),var(--surface)">
        <div class="row-between" style="gap:20px">
          <div style="max-width:60ch">
            <h3>Every template is fully editable</h3>
            <p class="mt-1">Templates are just starting points — rules, buttons, variables and settings are all yours. Nothing is locked, nothing phones home.</p>
          </div>
          <div class="row">
            <span class="pill">${icon('code')} Free source export</span>
            <span class="pill">${icon('shield')} No account</span>
          </div>
        </div>
      </div>
    </section>
  </div>`);

  const grid = el.querySelector('[data-grid]');

  function previewTemplate(tpl) {
    const bot = { ...applyTemplate(tpl.id), name: tpl.name.replace(/\s+/g, '').slice(0, 14) || 'Demo', username: `${tpl.id.replace(/-/g, '_')}_bot` };
    openModal({
      title: `${tpl.emoji} ${tpl.name}`,
      subtitle: `${tpl.category} · ${tpl.tags.join(' · ')}`,
      body: `
        <p class="small text-dim mb-3">${esc(tpl.blurb)}</p>
        <div data-chat style="max-width:380px;margin:0 auto"></div>`,
      footer: `<button class="btn btn-outline" data-close>Close</button><button class="btn btn-primary" data-use>${icon('rocket')} Use this template</button>`,
      onMount(modal, close) {
        const chat = createChat({
          getBot: () => bot,
          quickReplies: (bot.commands || ['start', 'help']).slice(0, 3).map((c) => `/${c.replace(/^\//, '')}`),
          height: 300
        });
        modal.querySelector('[data-chat]').appendChild(chat.el);
        modal.querySelector('[data-use]').addEventListener('click', () => { close(); useTemplate(tpl); });
      }
    });
  }

  function useTemplate(tpl) {
    const built = applyTemplate(tpl.id, { name: tpl.defaultName || tpl.name });
    openModal({
      title: `Create “${tpl.name}”`,
      subtitle: 'Name it however you like. You can change everything later.',
      body: `
        <div class="field">
          <label class="label">Bot display name</label>
          <input class="input" data-name value="${esc(built.name)}" maxlength="40" />
        </div>
        <div class="field">
          <label class="label">Telegram username <span class="hint-dot">(optional)</span></label>
          <div class="input-affix"><span class="prefix">@</span><input class="input" data-username placeholder="my_bot" value="" spellcheck="false" /></div>
          <span class="field-hint">Leave empty for now — it is filled automatically when you verify a token in the builder.</span>
        </div>
        <div class="field">
          <label class="label">Avatar</label>
          <div class="emoji-grid" data-emojis>
            ${['🤖', '🚀', '🧠', '🛍️', '🎧', '🎓', '📅', '💌', '🍽️', '📈', '🗂️', '📊'].map((e) => `<button type="button" class="emoji-opt ${e === built.emoji ? 'active' : ''}" data-emoji="${e}">${e}</button>`).join('')}
          </div>
        </div>`,
      footer: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" data-create>${icon('plus')} Create bot</button>`,
      onMount(modal, close) {
        const emojiWrap = modal.querySelector('[data-emojis]');
        emojiWrap.addEventListener('click', (e) => {
          const b = e.target.closest('[data-emoji]');
          if (!b) return;
          built.emoji = b.dataset.emoji;
          emojiWrap.querySelectorAll('[data-emoji]').forEach((x) => x.classList.toggle('active', x.dataset.emoji === built.emoji));
        });
        modal.querySelector('[data-create]').addEventListener('click', () => {
          const name = modal.querySelector('[data-name]').value.trim() || built.name;
          const username = modal.querySelector('[data-username]').value.trim().replace(/^@/, '');
          if (username && !/^[a-zA-Z][a-zA-Z0-9_]{3,30}bot$/i.test(username)) {
            err('Usernames must be 5–32 characters, letters/numbers/underscores, and end with “bot”.');
            return;
          }
          const bot = store.newBot({
            ...built,
            name,
            username,
            emoji: built.emoji
          });
          close();
          ok(`“${name}” created from ${tpl.name}`, 'Nice choice');
          location.hash = `/builder/${bot.id}`;
        });
      }
    });
  }

  function renderGrid() {
    const list = TEMPLATES.filter((t) => {
      if (activeCat !== 'All' && t.category !== activeCat) return false;
      if (search) {
        const q = search.toLowerCase();
        return (t.name + t.blurb + t.tags.join(' ')).toLowerCase().includes(q);
      }
      return true;
    });
    if (!list.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-ico">${icon('search')}</div><h3>Nothing here</h3><p>Try a different category or search term.</p></div>`;
      return;
    }
    grid.innerHTML = list.map((t) => `
      <article class="card tpl-card hover reveal" data-tpl="${t.id}">
        <div class="tpl-top">
          <span class="tpl-emoji">${t.emoji}</span>
          <div style="min-width:0">
            <h2 class="card-h">${esc(t.name)}</h2>
            <div class="tpl-cat">${esc(t.category)}</div>
          </div>
        </div>
        <p>${esc(t.blurb)}</p>
        <div class="tpl-foot">
          ${t.tags.slice(0, 2).map((g) => `<span class="pill">${esc(g)}</span>`).join('')}
          <span class="tpl-go">Use ${icon('arrowRight')}</span>
        </div>
      </article>`).join('');

    grid.querySelectorAll('[data-tpl]').forEach((card) => {
      const tpl = getTemplate(card.dataset.tpl);
      card.addEventListener('click', () => useTemplate(tpl));
    });

    // re-run reveal
    document.dispatchEvent(new CustomEvent('botforge:reveal'));
    grid.querySelectorAll('.reveal').forEach((r) => r.classList.add('in'));
  }

  el.querySelectorAll('[data-cat]').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCat = chip.dataset.cat;
      el.querySelectorAll('[data-cat]').forEach((c) => c.classList.toggle('active', c === chip));
      renderGrid();
    });
  });
  el.querySelector('[data-search]').addEventListener('input', (e) => {
    search = e.target.value;
    renderGrid();
  });

  renderGrid();

  if (query.use) {
    const tpl = getTemplate(query.use);
    if (tpl) setTimeout(() => useTemplate(tpl), 220);
    else err('Template not found');
  }

  return el;
}
