/* ============================================================
   BotForge — landing page
   ============================================================ */

import { h, icon, esc, $, $$ } from '../ui.js';
import { store } from '../store.js';
import { createChat } from '../chat.js';
import { TEMPLATES } from '../templates.js';

const demoBot = {
  name: 'Nova',
  username: 'nova_demo_bot',
  emoji: '🤖',
  settings: { typing: true, fallback: true },
  rules: [
    { enabled: true, match: 'exact', trigger: '/start', reply: "Hey {name}! 👋 I'm Nova — your personal assistant.\n\nI can answer questions, show menus and run tiny workflows. Try /help.", buttons: [{ label: '📖 Commands', data: '/help' }, { label: '💳 Pricing', data: 'pricing' }] },
    { enabled: true, match: 'exact', trigger: '/help', reply: 'Here is what I can do:\n\n/ping — check latency\n/id — your Telegram ID\n/time — current time\n\nOr ask me about <b>pricing</b> or <b>hosting</b>.' },
    { enabled: true, match: 'exact', trigger: '/ping', reply: '🏓 Pong! 42ms — running in your browser right now.' },
    { enabled: true, match: 'exact', trigger: '/id', reply: '🪪 Your demo Telegram ID: <code>7700123</code>\n(The real one appears in the live runtime.)' },
    { enabled: true, match: 'exact', trigger: '/time', reply: '🕐 {time} — on your device.' },
    { enabled: true, match: 'contains', trigger: 'hi', reply: 'Hello {name}! Great to see you 💜' },
    { enabled: true, match: 'contains', trigger: 'pricing', reply: '💸 <b>Pricing</b>\n\nBotForge — $0 forever.\nNo account. No card. No bot limits.\n\nThe hosting it generates is free too (Cloudflare / Deno free tiers).' },
    { enabled: true, match: 'contains', trigger: 'host', reply: '☁️ You can run me three ways:\n\n1. In this browser tab (instant)\n2. Free Cloudflare Worker (24/7)\n3. Free Deno Deploy (24/7)\n\nAll three cost $0.' },
    { enabled: true, match: 'contains', trigger: 'login|signup|account', reply: '🔓 There is no login. Your bots live in this browser — nothing is uploaded anywhere.' },
    { enabled: true, match: 'fallback', trigger: '', reply: "I didn't catch that 🤔\nTry /help — or type <b>pricing</b>.", buttons: [{ label: '📖 Commands', data: '/help' }] }
  ]
};

const FEATURES = [
  { icon: 'sliders', title: 'Visual bot builder', desc: 'Triggers, replies, inline keyboards and fallbacks — a 5-step wizard with live preview, zero code required.', tag: 'no code' },
  { icon: 'flask', title: 'Real simulator', desc: 'Chat with your bot before it exists. Every rule is tested locally, including buttons and command arguments.', tag: 'sandbox' },
  { icon: 'play', title: 'Browser runtime', desc: 'Start long-polling straight from this tab. Useful for demos, testing and private communities.', tag: 'instant' },
  { icon: 'code', title: '5 code targets', desc: 'Generate Cloudflare Worker, Deno Deploy, Node, Python or a portable config — real code, no lock-in.', tag: 'export' },
  { icon: 'rocket', title: 'Free-forever deploys', desc: 'Guided deployment to free serverless tiers. Typically 3 minutes from token to 24/7 uptime.', tag: '$0' },
  { icon: 'layers', title: '13 templates', desc: 'Support desk, mini store, FAQ brain, course drip, booking, poll bot and more — ready in one click.', tag: 'instant' },
  { icon: 'bot', title: 'Inline keyboards', desc: 'Multi-button menus with callbacks or URLs, rendered exactly like Telegram does on mobile.', tag: 'native' },
  { icon: 'shield', title: 'Local-first & private', desc: 'No accounts, no analytics, no servers. Tokens and configs never leave this device unless you export them.', tag: 'private' }
];

const FAQ = [
  ['Is it really free, forever?', 'Yes. BotForge is a static site — there is no backend to pay for. You can use every feature without paying anything, and the hosting targets we generate (Cloudflare Workers, Deno Deploy, GitHub Actions) all have permanent free tiers. No trial, no card, no “free until…” clause.'],
  ['Do I need to make an account?', 'No. There is no signup, login, email or password anywhere. Your bots are stored in your browser with localStorage. Use Export in the top-right of “My bots” to keep a backup or move to another device.'],
  ['Where is my bot token stored?', 'Only in this browser, on this device. It is sent to api.telegram.org when you run or test the bot — nowhere else. BotForge has no server that could see it. Exported code files never contain your token either.'],
  ['How can a bot run without my computer being on?', 'The “browser runtime” answers messages only while the tab is open. For 24/7 uptime, generate the Cloudflare Worker or Deno code and paste it into their free tier. Your bot then runs on their edge network, entirely independent of you.'],
  ['How many bots can I host?', 'Unlimited. Create as many as you want, duplicate, export and import them. Telegram itself limits one token per bot, but you can host dozens of bots on the same free Cloudflare account.'],
  ['Does it work on mobile?', 'Yes. The builder, simulator and console are fully responsive. Deploying the browser runtime works on Android Chrome; on iOS Safari background tabs are suspended quickly, so use the serverless targets for real bots.'],
  ['What if something breaks?', 'Open the Docs page — it has a troubleshooting matrix with every common error (401, 409, CORS, “webhook is active”, rate limits). The runtime console also explains errors in plain English.']
];

const COMPARISON = [
  ['Price', '$0 forever', '$5 – $25 per month'],
  ['Account required', 'None', 'Email + card'],
  ['Bot limit', 'Unlimited', '1 – 3 on free plans'],
  ['Setup time', 'Under 3 minutes', '15 – 30 minutes'],
  ['Where data lives', 'Your device', 'Vendor servers'],
  ['Bot goes offline', 'Never (on serverless free tiers)', 'When trial ends'],
  ['Lock-in', 'Full source code export', 'Platform-specific'],
  ['Hidden limits', 'Only Telegram API limits', 'Messages, users, uptime caps']
];

export function render() {
  const el = h(`
  <div>
    <!-- ============================ HERO ============================ -->
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow reveal"><span class="tag">FREE</span> Telegram bot cloud · no account needed</div>
          <h1 class="reveal">Host a Telegram bot.<br /><span class="line-2">Free forever. No login.</span></h1>
          <p class="lead reveal">Design a bot visually, chat with it instantly, then deploy it to free serverless infrastructure that never sleeps. No signup, no credit card, no limits — just you and the Telegram API.</p>
          <div class="hero-cta reveal">
            <a class="btn btn-primary btn-lg" href="#/builder">${icon('rocket')} Build your first bot</a>
            <a class="btn btn-outline btn-lg" href="#/runtime">${icon('play')} See it live</a>
          </div>
          <div class="hero-note reveal">
            <span><strong>0</strong> accounts</span><span class="sep"></span>
            <span><strong>$0.00</strong> / month</span><span class="sep"></span>
            <span><strong>Unlimited</strong> bots</span><span class="sep"></span>
            <span>Open source</span>
          </div>
          <div class="hero-stats">
            <div class="hero-stat reveal"><b>13</b><span>templates</span></div>
            <div class="hero-stat reveal"><b>5</b><span>code targets</span></div>
            <div class="hero-stat reveal"><b>&lt;3 min</b><span>to 24/7 uptime</span></div>
          </div>
        </div>

        <div class="hero-visual reveal">
          <div class="terminal">
            <div class="term-bar">
              <div class="dots"><i></i><i></i><i></i></div>
              <span>botforge — zsh</span>
              <span class="term-live"><i class="dot-live"></i> live</span>
            </div>
            <div class="term-body">
              <div><span class="c-dim">$</span> botforge deploy <span class="c-dim">--free --no-login</span></div>
              <div><span class="c-ok">✓</span> bot registered <span class="c-cyan">@nova_bot</span></div>
              <div><span class="c-ok">✓</span> token verified <span class="c-dim">· getMe 200 OK</span></div>
              <div><span class="c-ok">✓</span> 9 rules compiled <span class="c-dim">·</span> 12 keyboards</div>
              <div><span class="c-ok">✓</span> simulator passed <span class="c-dim">· 0 errors</span></div>
              <div><span class="c-violet">→</span> generating cloudflare worker…</div>
              <div><span class="c-ok">✓</span> deployed <span class="c-cyan">nova-bot.workers.dev</span></div>
              <div><span class="c-ok">✓</span> webhook set <span class="c-dim">· allowed: message, callback</span></div>
              <div><span class="c-warn">●</span> live 24/7 <span class="c-dim">· $0.00 / month</span></div>
              <div style="margin-top:10px"><span class="c-dim"># your move</span> <span class="caret"></span></div>
            </div>
          </div>
          <div class="float-badge fb-1">
            <span class="fb-ico">${icon('shieldCheck')}</span>
            <div><b>Token stays local</b><br /><span class="muted" style="font-size:.68rem">no server, ever</span></div>
          </div>
          <div class="float-badge fb-2">
            <span class="fb-ico" style="background:rgba(34,211,238,.14);color:var(--brand-1)">${icon('zap')}</span>
            <div><b>42 ms replies</b><br /><span class="muted" style="font-size:.68rem">edge runtime</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================ TRUST ============================ -->
    <section class="wrap section-tight">
      <div class="trust reveal">
        <div class="trust-item">${icon('lock')} <span><b>No signup</b> — nothing to log in to</span></div>
        <div class="trust-item">${icon('shieldCheck')} <span><b>Local-first</b> — bots stay in your browser</span></div>
        <div class="trust-item">${icon('cloud')} <span><b>Free tiers</b> — Cloudflare · Deno · GitHub</span></div>
        <div class="trust-item">${icon('code')} <span><b>Open source</b> — MIT, no lock-in</span></div>
      </div>
    </section>

    <!-- ============================ FEATURES ============================ -->
    <section class="wrap section" id="features">
      <div class="section-head reveal">
        <div class="eyebrow">Everything included</div>
        <h2>A complete bot platform.<br /><span class="gradient-text">Actually free.</span></h2>
        <p>Most “free” bot hosts cap you at one bot and one week. BotForge gives you the builder, the runtime, the code generator and the deploy guide — with no account in sight.</p>
      </div>
      <div class="grid g-4">
        ${FEATURES.map((f) => `
          <article class="card feature hover reveal">
            <div class="feature-ico">${icon(f.icon)}</div>
            <h3>${esc(f.title)}</h3>
            <p>${esc(f.desc)}</p>
            <span class="feat-tag">${esc(f.tag)}</span>
          </article>`).join('')}
      </div>
    </section>

    <!-- ============================ DEMO ============================ -->
    <section class="wrap section">
      <div class="hero-grid" style="align-items:center">
        <div>
          <div class="eyebrow reveal">Try it now</div>
          <h2 class="reveal mt-2">Talk to a bot that<br /><span class="gradient-text">isn't running anywhere.</span></h2>
          <p class="lead reveal mt-2">This chat is generated entirely on your device from a JSON config. Same engine, same rules, same keyboards — the exact code that goes live on Telegram.</p>
          <ul class="mt-4" style="display:flex;flex-direction:column;gap:12px">
            <li class="row" style="gap:10px">${icon('check', 'text-ok')} <span class="small text-dim">Every reply runs through the real rule engine</span></li>
            <li class="row" style="gap:10px">${icon('check', 'text-ok')} <span class="small text-dim">Buttons, commands and fallbacks behave natively</span></li>
            <li class="row" style="gap:10px">${icon('check', 'text-ok')} <span class="small text-dim">Zero network calls — watch the DevTools Network tab</span></li>
            <li class="row" style="gap:10px">${icon('check', 'text-ok')} <span class="small text-dim">Open the builder to fork this exact experience</span></li>
          </ul>
          <div class="row mt-4">
            <a class="btn btn-primary" href="#/builder">${icon('sliders')} Customise this bot</a>
            <a class="btn btn-ghost" href="#/templates">${icon('layers')} Browse templates</a>
          </div>
        </div>
        <div class="reveal" data-chat></div>
      </div>
    </section>

    <!-- ============================ HOW IT WORKS ============================ -->
    <section class="wrap section" id="how">
      <div class="section-head center reveal">
        <div class="eyebrow">Three steps</div>
        <h2>From idea to <span class="gradient-text">live bot</span></h2>
        <p>No terminal required for the first two steps. The third is copy-paste.</p>
      </div>
      <div class="steps">
        <article class="card pad step-card hover reveal">
          <span class="step-num">01</span>
          <h3>Describe your bot</h3>
          <p>Pick a name, paste the token from @BotFather, and choose a template. The builder validates the token and configures commands for you.</p>
          <a class="step-link" href="#/builder">Open builder ${icon('arrowRight')}</a>
        </article>
        <article class="card pad step-card hover reveal">
          <span class="step-num">02</span>
          <h3>Design replies</h3>
          <p>Add triggers, template variables and inline buttons. Test everything in the simulator — no rate limits, no waiting, no risk.</p>
          <a class="step-link" href="#/templates">Start from a template ${icon('arrowRight')}</a>
        </article>
        <article class="card pad step-card hover reveal">
          <span class="step-num">03</span>
          <h3>Deploy for $0</h3>
          <p>Generate a Cloudflare Worker and paste it into their free tier. Register one webhook URL. Your bot now answers 24/7 without you.</p>
          <a class="step-link" href="#/deploy">Follow deploy guide ${icon('arrowRight')}</a>
        </article>
      </div>
    </section>

    <!-- ============================ COMPARISON ============================ -->
    <section class="wrap section">
      <div class="section-head reveal">
        <div class="eyebrow">Honest comparison</div>
        <h2>Why “free” here means free</h2>
        <p>BotForge is static files on GitHub Pages. There is no server bill to pass on to you, so there is no reason to invent a paywall.</p>
      </div>
      <div class="card reveal" style="overflow:hidden">
        <div class="table-wrap">
          <table class="table" style="border:0">
            <thead><tr><th>What you get</th><th style="color:var(--brand-1)">BotForge</th><th>Typical bot host</th></tr></thead>
            <tbody>
              ${COMPARISON.map(([k, a, b]) => `<tr><td>${esc(k)}</td><td><b style="color:var(--text)">${esc(a)}</b></td><td class="muted">${esc(b)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ============================ TEMPLATES ============================ -->
    <section class="wrap section">
      <div class="row-between reveal" style="margin-bottom:26px">
        <div class="section-head" style="margin-bottom:0">
          <div class="eyebrow">Ready-made</div>
          <h2 class="mt-2">Start from a <span class="gradient-text">template</span></h2>
        </div>
        <a class="btn btn-outline" href="#/templates">All ${TEMPLATES.length} templates ${icon('arrowRight')}</a>
      </div>
      <div class="tpl-grid">
        ${TEMPLATES.slice(0, 4).map((t) => `
          <article class="card tpl-card hover reveal" data-tpl="${t.id}">
            <div class="tpl-top">
              <span class="tpl-emoji">${t.emoji}</span>
              <div><h3>${esc(t.name)}</h3><div class="tpl-cat">${esc(t.category)}</div></div>
            </div>
            <p>${esc(t.blurb)}</p>
            <div class="tpl-foot">
              ${t.tags.slice(0, 2).map((g) => `<span class="pill">${esc(g)}</span>`).join('')}
              <span class="tpl-go">Use ${icon('arrowRight')}</span>
            </div>
          </article>`).join('')}
      </div>
    </section>

    <!-- ============================ FAQ ============================ -->
    <section class="wrap section">
      <div class="grid g-2" style="gap:clamp(24px,4vw,56px);align-items:start">
        <div class="reveal">
          <div class="eyebrow">FAQ</div>
          <h2 class="mt-2">Questions,<br /><span class="gradient-text">answered plainly.</span></h2>
          <p class="lead mt-2">No asterisks, no “terms apply”. If a limit exists, it is Telegram's, not ours.</p>
          <div class="card pad mt-4">
            <div class="row" style="gap:12px">
              <span class="feature-ico" style="margin:0">${icon('message')}</span>
              <div>
                <h3 style="font-size:.95rem">Still curious?</h3>
                <p class="small" style="margin-top:3px">Read the full docs or open an issue on GitHub.</p>
              </div>
            </div>
            <div class="row mt-3">
              <a class="btn btn-outline btn-sm" href="#/docs">${icon('book')} Docs</a>
              <a class="btn btn-ghost btn-sm" href="https://github.com/arslanansari1629-blip/AI/issues" target="_blank" rel="noopener">${icon('github')} Issues</a>
            </div>
          </div>
        </div>
        <div class="faq reveal">
          ${FAQ.map(([q, a], i) => `
            <div class="faq-item ${i === 0 ? 'open' : ''}">
              <button class="faq-q" type="button">${esc(q)} ${icon('plus', 'faq-ic')}</button>
              <div class="faq-a">${esc(a)}</div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ============================ CTA ============================ -->
    <section class="wrap section">
      <div class="card reveal" style="padding:clamp(28px,6vw,64px);text-align:center;background:radial-gradient(700px 300px at 50% 0%,rgba(99,102,241,.22),transparent 70%),var(--surface);overflow:hidden">
        <div class="eyebrow" style="margin-inline:auto">No login · no limits · free forever</div>
        <h2 style="margin-top:18px">Your bot could be live <span class="gradient-text">in three minutes.</span></h2>
        <p class="lead mx-auto" style="margin-top:14px;text-align:center">Open the builder, pick a template and paste a token. That's the whole onboarding.</p>
        <div class="row" style="justify-content:center;margin-top:28px">
          <a class="btn btn-primary btn-lg" href="#/builder">${icon('rocket')} Start building — free</a>
          <a class="btn btn-outline btn-lg" href="#/deploy">${icon('cloud')} See hosting options</a>
        </div>
        <p class="tiny muted" style="margin-top:20px">No credit card · no email · no catch</p>
      </div>
    </section>
  </div>`);

  /* interactive demo chat */
  const mount = el.querySelector('[data-chat]');
  const chat = createChat({
    getBot: () => demoBot,
    greeting: `👋 Hi! I'm <b>Nova</b>, a demo bot rendered entirely in your browser.\n\nTry /start, ask about <b>pricing</b> or tap a suggestion below.`,
    quickReplies: ['/start', '/help', 'pricing', 'how to host?']
  });
  mount.appendChild(chat.el);

  /* template cards → open templates page */
  el.querySelectorAll('[data-tpl]').forEach((card) => {
    card.addEventListener('click', () => {
      location.hash = `/templates?use=${card.dataset.tpl}`;
    });
  });

  /* FAQ accordion */
  el.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.contains('open');
      el.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });

  return el;
}
