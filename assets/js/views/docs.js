/* ============================================================
   BotForge — documentation
   ============================================================ */

import { h, icon, esc, copy, highlight } from '../ui.js';

const code = (id, title, text) => `
  <div class="code-block">
    <div class="code-head"><div class="dots"><i></i><i></i><i></i></div><span class="code-title">${esc(title)}</span><button class="btn btn-ghost btn-sm" data-copy-code="${esc(id)}">${icon('copy')} Copy</button></div>
    <pre tabindex="0">${highlight(text)}</pre>
  </div>`;

export function render() {
  const snippets = {};

  const el = h(`
  <div class="wrap">
    <div class="page-head">
      <div class="breadcrumbs"><a href="#/">Home</a><span>/</span>Docs</div>
      <h1>Documentation</h1>
      <p>Everything about building, running and hosting a Telegram bot without an account, a server bill or a single line of boilerplate.</p>
      <div class="pill-row mt-3">
        <span class="pill ok">Updated today</span>
        <span class="pill">Telegram Bot API 7.x</span>
        <span class="pill">No login required</span>
      </div>
    </div>

    <div class="doc-grid section-tight">
      <nav class="doc-nav" data-doc-nav>
        <a href="#start" class="active">Quick start</a>
        <a href="#builder">The builder</a>
        <a href="#rules">Rule engine</a>
        <a href="#runtime">Browser runtime</a>
        <a href="#hosting">Free hosting</a>
        <a href="#webhooks">Webhook vs polling</a>
        <a href="#api">Telegram API cheatsheet</a>
        <a href="#data">Backups & data</a>
        <a href="#privacy">Privacy & security</a>
        <a href="#trouble">Troubleshooting</a>
        <a href="#faq">FAQ</a>
      </nav>

      <article class="doc-body">
        <h2 id="start">Quick start</h2>
        <p>You need two things: a Telegram account and a browser. No BotForge account exists — there is nothing to sign up for.</p>
        <div class="step-list mt-3">
          <div class="dstep"><span class="dnum">1</span><div class="dbody"><h3>Create the bot in Telegram</h3><p>Open <a class="text-dim" style="text-decoration:underline" href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a>, send <code class="code-inline">/newbot</code>, pick a display name and a username ending in <code class="code-inline">bot</code>. It replies with a token such as <code class="code-inline">8123456789:AAH…</code>. That token <b>is</b> your bot's password.</p></div></div>
          <div class="dstep"><span class="dnum">2</span><div class="dbody"><h3>Build the personality</h3><p>Open the <a href="#/builder">builder</a>. Add a name, paste the token (step 2), then write replies in step 3. Everything autosaves to this browser.</p></div></div>
          <div class="dstep"><span class="dnum">3</span><div class="dbody"><h3>Test it</h3><p>The right-hand panel is a live simulator. Type a message, press a button, verify the reply. No network, no rate limits.</p></div></div>
          <div class="dstep"><span class="dnum">4</span><div class="dbody"><h3>Put it online</h3><p>For a quick demo, open the <a href="#/runtime">runtime</a> and press Start. For 24/7 uptime, generate the Cloudflare Worker in <a href="#/deploy">Deploy</a> and paste it into their free tier.</p></div></div>
        </div>

        <h2 id="builder">The builder</h2>
        <p>The builder has five steps. Each one writes to the same local JSON object, so you can jump around in any order.</p>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Step</th><th>What it does</th><th>Required?</th></tr></thead>
          <tbody>
            <tr><td><b>Identity</b></td><td>Name, @username, emoji avatar, description.</td><td>Name only</td></tr>
            <tr><td><b>Token</b></td><td>Paste + verify the BotFather token. Detects the username automatically.</td><td>For live running</td></tr>
            <tr><td><b>Replies</b></td><td>Rules, triggers, reply text, inline buttons, ordering.</td><td>At least one</td></tr>
            <tr><td><b>Behaviour</b></td><td>Typing indicator, cooldown, fallback, command menu.</td><td>No</td></tr>
            <tr><td><b>Launch</b></td><td>Checklist, downloads, links to runtime + deploy.</td><td>No</td></tr>
          </tbody>
        </table></div>

        <h2 id="rules">Rule engine</h2>
        <p>Rules are evaluated <b>top to bottom</b>. The first one that matches wins. If nothing matches and a fallback rule exists, the fallback answers; otherwise the message is ignored.</p>
        <h3>Match modes</h3>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Mode</th><th>Matches</th><th>Example trigger</th></tr></thead>
          <tbody>
            <tr><td><code>exact</code></td><td>The whole message, case-insensitive.</td><td><code>/start</code></td></tr>
            <tr><td><code>contains</code></td><td>Anywhere inside the message.</td><td><code>price</code></td></tr>
            <tr><td><code>start</code></td><td>Message begins with the trigger.</td><td><code>/price</code> (also matches <code>/price btc</code>)</td></tr>
            <tr><td><code>command</code></td><td>A slash command, with optional arguments.</td><td><code>/ban</code></td></tr>
            <tr><td><code>regex</code></td><td>A JavaScript regular expression.</td><td><code>refund|money back</code></td></tr>
            <tr><td><code>any</code></td><td>Every message (use sparingly).</td><td>—</td></tr>
            <tr><td><code>fallback</code></td><td>Only when nothing else matched.</td><td>—</td></tr>
          </tbody>
        </table></div>

        <h3>Template variables</h3>
        <p>Write these inside any reply and they are replaced at send time:</p>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Variable</th><th>Becomes</th></tr></thead>
          <tbody>
            <tr><td><code>{name}</code></td><td>The sender's first name</td></tr>
            <tr><td><code>{username}</code></td><td>Their @username (without @)</td></tr>
            <tr><td><code>{id}</code></td><td>Their numeric Telegram id</td></tr>
            <tr><td><code>{args}</code></td><td>Everything after the command, e.g. <code>btc</code> in <code>/price btc</code></td></tr>
            <tr><td><code>{time}</code> / <code>{date}</code></td><td>Current local time and date</td></tr>
            <tr><td><code>{bot}</code></td><td>Your bot's display name</td></tr>
            <tr><td><code>{random:a|b|c}</code></td><td>One of the options, picked each time</td></tr>
          </tbody>
        </table></div>

        <h3>Formatting & buttons</h3>
        <p>Replies are sent with <code>parse_mode: HTML</code>. Use <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>, <code>&lt;s&gt;</code>, <code>&lt;code&gt;</code> and <code>&lt;a href="…"&gt;</code>. Everything else is escaped automatically, so it is safe to echo user input.</p>
        <p>Each button becomes part of an inline keyboard. A button with a URL opens that link; a button without one sends its callback data back to the bot, which is fed through the rule engine again. That is how multi-step menus work without any state.</p>

        <h2 id="runtime">Browser runtime</h2>
        <p>The runtime performs long polling: it calls <code>getUpdates</code> with a 25 second timeout, handles each update with your rules, sends the answer with <code>sendMessage</code>, then repeats. The console logs every step.</p>
        <div class="notice warn mt-2">${icon('warning')}<div><b>Two limitations of any browser.</b> (1) It only runs while the tab is open. (2) Telegram does not send CORS headers, so some browsers block direct API calls. If you see a network/CORS error, the token is still fine — deploy a generated Worker instead.</div></div>
        <p class="mt-2">The simulator in the corner is separate: it never touches the network. It uses the same engine, so it is the fastest way to test rules.</p>

        <h2 id="hosting">Free hosting, honestly compared</h2>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Target</th><th>Free tier</th><th>Always on?</th><th>Setup</th></tr></thead>
          <tbody>
            <tr><td><b>Cloudflare Workers</b></td><td>100,000 requests/day</td><td>Yes</td><td>~3 min</td></tr>
            <tr><td><b>Deno Deploy</b></td><td>1,000,000 requests/month</td><td>Yes</td><td>~4 min</td></tr>
            <tr><td><b>GitHub Actions</b></td><td>2,000 minutes/month (private)</td><td>6h per run, then restarts</td><td>~5 min</td></tr>
            <tr><td><b>Koyeb</b></td><td>1 free service</td><td>Yes (with sleep policy)</td><td>~5 min</td></tr>
            <tr><td><b>Oracle Always Free</b></td><td>VMs forever free</td><td>Yes, self-managed</td><td>~20 min</td></tr>
            <tr><td><b>This browser</b></td><td>Unlimited</td><td>Only while open</td><td>0 sec</td></tr>
          </tbody>
        </table></div>
        <p class="mt-2">Free tiers change. The two we trust for “free forever” are Cloudflare Workers and Deno Deploy — both have offered a permanent free tier for years and neither requires a card.</p>

        <h3>Cloudflare Worker in 60 seconds</h3>
        <p>From <a href="#/deploy">Deploy</a>, copy <code>worker.js</code>, paste it into a new Worker, add the <code>BOT_TOKEN</code> and <code>WEBHOOK_SECRET</code> variables, then run:</p>
        ${code('setwebhook', 'bash', 'curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<WORKER>.workers.dev/webhook/<SECRET>"')}

        <h2 id="webhooks">Webhook vs polling</h2>
        <div class="table-wrap"><table class="table">
          <thead><tr><th scope="col">Feature</th><th scope="col">Webhook</th><th>Long polling</th></tr></thead>
          <tbody>
            <tr><td>How it works</td><td>Telegram POSTs updates to your URL</td><td>You ask Telegram for updates in a loop</td></tr>
            <tr><td>Needs a public URL</td><td>Yes</td><td>No</td></tr>
            <tr><td>Latency</td><td>Instant</td><td>Under a second</td></tr>
            <tr><td>Best for</td><td>Serverless (Cloudflare, Deno)</td><td>VPS, home server, GitHub Actions</td></tr>
            <tr><td>Used by</td><td>Worker / Deno targets</td><td>Node / Python targets</td></tr>
          </tbody>
        </table></div>
        <p>Telegram allows exactly one delivery method per bot. If a webhook exists, <code>getUpdates</code> fails with <b>409 Conflict</b>. Remove it with <code>deleteWebhook</code> (there is a button in the runtime) before switching to polling.</p>

        <h2 id="api">Telegram API cheatsheet</h2>
        <p>The methods BotForge uses, and what they are for. All of them are free and require only your token: <code>https://api.telegram.org/bot&lt;TOKEN&gt;/&lt;method&gt;</code>.</p>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Method</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>getMe</code></td><td>Validate a token and read the bot identity</td></tr>
            <tr><td><code>getUpdates</code></td><td>Receive messages (polling)</td></tr>
            <tr><td><code>sendMessage</code></td><td>Send text, HTML and inline keyboards</td></tr>
            <tr><td><code>sendChatAction</code></td><td>Show “typing…”</td></tr>
            <tr><td><code>answerCallbackQuery</code></td><td>Acknowledge a button tap</td></tr>
            <tr><td><code>setWebhook</code> / <code>deleteWebhook</code></td><td>Switch delivery method</td></tr>
            <tr><td><code>getWebhookInfo</code></td><td>Inspect the current webhook</td></tr>
            <tr><td><code>setMyCommands</code></td><td>Publish the command menu</td></tr>
            <tr><td><code>setMyDescription</code></td><td>Set the profile description</td></tr>
          </tbody>
        </table></div>
        <h3>Limits worth knowing</h3>
        <ul>
          <li>~30 messages per second to different chats; ~1 message per second to the same chat.</li>
          <li>4,096 characters per message; longer text must be split.</li>
          <li>100 updates per <code>getUpdates</code> call; 64 bytes per <code>callback_data</code>.</li>
          <li>A bot cannot start a conversation — the user must message it first.</li>
          <li>Bots cannot read messages in groups unless privacy mode is disabled or the bot is an admin.</li>
        </ul>

        <h2 id="data">Backups & data</h2>
        <p>Everything is stored in <code>localStorage</code> under the key <code>botforge.v1</code>. That means:</p>
        <ul>
          <li>Clearing site data or private-mode windows will delete your bots.</li>
          <li>Bots do not sync between devices or browsers.</li>
          <li>Exporting produces a JSON file you can import anywhere — including from the command palette (Ctrl K → “Import”).</li>
          <li>The full source bundle (.zip) of a bot is downloadable from the builder menu, and it never contains your token.</li>
        </ul>

        <h2 id="privacy">Privacy & security</h2>
        <p>BotForge is a static site. There is no backend, no database, no analytics and no cookies beyond your own preferences. Network requests only happen when you explicitly test a token, read webhook info, or start the live runtime — and those go to <code>api.telegram.org</code>.</p>
        <ul>
          <li>Never commit a token to a public repo. If leaked, revoke it with @BotFather → <code>/revoke</code>.</li>
          <li>Generated code always reads the token from an environment variable or secret.</li>
          <li>Anyone with your token fully controls the bot — treat it like a password.</li>
          <li>If you use a shared computer, export your bots and delete them afterwards.</li>
        </ul>

        <h2 id="trouble">Troubleshooting</h2>
        <div class="faq">
          <div class="faq-item open"><button class="faq-q">401 Unauthorized ${icon('plus', 'faq-ic')}</button><div class="faq-a">Telegram rejected the token. Copy it again from BotFather → /mybots → API Token. If it was revoked, generate a new one. Tokens look like digits, a colon, then 35 characters.</div></div>
          <div class="faq-item"><button class="faq-q">409 Conflict: terminated by other getUpdates / webhook is active ${icon('plus', 'faq-ic')}</button><div class="faq-a">Two processes are polling, or a webhook is registered. Stop other copies, then press “Remove webhook” on the runtime page and restart. Only one receiver can exist per bot.</div></div>
          <div class="faq-item"><button class="faq-q">Browser says “Failed to fetch” or shows a CORS error ${icon('plus', 'faq-ic')}</button><div class="faq-a">Telegram does not send CORS headers to web pages. Some browsers allow the call anyway, most do not. This never affects deployed code — Node, Deno and Workers make server-side requests with no CORS involved.</div></div>
          <div class="faq-item"><button class="faq-q">400 Bad Request: can't parse entities ${icon('plus', 'faq-ic')}</button><div class="faq-a">Your reply contains HTML that Telegram cannot parse, usually an unclosed &lt;b&gt; or a literal &. BotForge sanitises replies automatically; if you write your own code, escape user input first.</div></div>
          <div class="faq-item"><button class="faq-q">429 Too Many Requests ${icon('plus', 'faq-ic')}</button><div class="faq-a">You are sending faster than Telegram allows. The API returns retry_after in seconds; BotForge's runtime backs off automatically. Raise the per-chat cooldown in Behaviour.</div></div>
          <div class="faq-item"><button class="faq-q">The bot replies in the simulator but not in Telegram ${icon('plus', 'faq-ic')}</button><div class="faq-a">The simulator never touches the network. Check that the runtime is running (or a worker deployed), that no webhook is blocking polling, and that the token belongs to the same bot you are messaging.</div></div>
          <div class="faq-item"><button class="faq-q">My bot goes silent in groups ${icon('plus', 'faq-ic')}</button><div class="faq-a">Privacy mode is on by default, so the bot only sees commands and replies. Ask BotFather → /setprivacy → Disable, then remove and re-add the bot to the group.</div></div>
          <div class="faq-item"><button class="faq-q">The webhook says “ok: true” but nothing happens ${icon('plus', 'faq-ic')}</button><div class="faq-a">Check that the Worker URL path matches <code>/webhook/&lt;secret&gt;</code> exactly, that BOT_TOKEN is set as a secret, and open the Worker URL in a browser — it should show a small status page.</div></div>
        </div>

        <h2 id="faq">FAQ</h2>
        <div class="faq mt-2">
          <div class="faq-item"><button class="faq-q">Is BotForge really free? ${icon('plus', 'faq-ic')}</button><div class="faq-a">Yes. It is a static open-source site with no server costs, and the hosting it targets has permanent free tiers. There is no paid plan to upgrade to.</div></div>
          <div class="faq-item"><button class="faq-q">Will you ever add accounts? ${icon('plus', 'faq-ic')}</button><div class="faq-a">No. Accounts would mean a database, a privacy policy and a bill. The local-first design is the feature.</div></div>
          <div class="faq-item"><button class="faq-q">Can I use this for a commercial bot? ${icon('plus', 'faq-ic')}</button><div class="faq-a">Yes. The generated code is yours, released under the MIT license. Telegram's own rules for your bot still apply.</div></div>
          <div class="faq-item"><button class="faq-q">Does it support payments, files or inline mode? ${icon('plus', 'faq-ic')}</button><div class="faq-a">The builder focuses on text, keyboards and command flows. The generated source is plain, readable JavaScript/Python — extend it with any Bot API method you need.</div></div>
          <div class="faq-item"><button class="faq-q">Where is the source code? ${icon('plus', 'faq-ic')}</button><div class="faq-a">On <a class="text-dim" style="text-decoration:underline" href="https://github.com/arslanansari1629-blip/AI" target="_blank" rel="noopener">GitHub</a>. Fork it, self-host it on GitHub Pages in one click, and change anything.</div></div>
        </div>

        <div class="card pad mt-4" style="background:radial-gradient(500px 200px at 10% 0%,rgba(99,102,241,.16),transparent 70%),var(--surface)">
          <div class="row-between">
            <div><h3 style="font-size:1rem">Still stuck?</h3><p class="small mt-1">Open an issue with your log output — never paste your token.</p></div>
            <a class="btn btn-outline btn-sm" href="https://github.com/arslanansari1629-blip/AI/issues" target="_blank" rel="noopener">${icon('github')} Ask on GitHub</a>
          </div>
        </div>
      </article>
    </div>
  </div>`);

  /* copy buttons for code snippets */
  el.querySelectorAll('[data-copy-code]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('.code-block').querySelector('pre');
      copy(pre.textContent, 'Copied');
    });
  });

  /* scroll-spy for the doc nav */
  const links = Array.from(el.querySelectorAll('[data-doc-nav] a'));
  const sections = links
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  const setActive = (id) => links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));

  const onScroll = () => {
    let current = sections[0]?.id;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= 140) current = s.id;
    }
    if (current) setActive(current);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  el.querySelectorAll('[data-doc-nav] a').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#/docs`);
      setActive(id);
    });
  });

  el.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const siblings = Array.from(item.parentElement.children);
      const wasOpen = item.classList.contains('open');
      siblings.forEach((s) => s.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  el._cleanup = () => window.removeEventListener('scroll', onScroll);
  return el;
}
