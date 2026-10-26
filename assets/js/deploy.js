/* ============================================================
   BotForge — deploy targets & hand-off helpers
   These are the genuinely-free-forever options we recommend.
   ============================================================ */

export const TARGETS = [
  {
    id: 'browser',
    name: 'This browser',
    emoji: '⚡',
    tagline: 'Run it right now — zero setup',
    free: 'Unlimited · while the tab is open',
    setup: '0 sec',
    difficulty: 'Instant',
    tags: ['instant', 'no signup'],
    steps: [
      {
        title: 'Add your token in the builder',
        desc: 'Paste the token from @BotFather in step 2 of the builder and hit <b>Test token</b>.'
      },
      {
        title: 'Open the live runtime',
        desc: 'Start polling. Every message your bot receives is answered by the rules you built here — directly from this tab.'
      },
      {
        title: 'Understand the limit',
        desc: 'A browser tab is not a server: if you close it, the bot sleeps. It is perfect for testing and demos. For 24/7, use one of the free serverless targets below (about 3 minutes of setup, still free forever).'
      }
    ]
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers',
    emoji: '☁️',
    tagline: 'The best free-forever option',
    free: '100,000 requests/day · no card',
    setup: '~3 min',
    difficulty: 'Easy',
    tags: ['24/7', 'webhook', 'recommended'],
    url: 'https://dash.cloudflare.com',
    steps: [
      {
        title: 'Create a free Cloudflare account',
        desc: 'Go to dash.cloudflare.com → Workers & Pages → <b>Create</b> → Worker. No credit card is required for the free plan.'
      },
      {
        title: 'Paste the generated code',
        desc: 'Open the <b>Code</b> tab on this page, copy <code>worker.js</code> and paste it over the default Worker code. Deploy.'
      },
      {
        title: 'Add two variables',
        desc: 'Worker → Settings → Variables and Secrets → add <code>BOT_TOKEN</code> (secret) and <code>WEBHOOK_SECRET</code> (any random string).'
      },
      {
        title: 'Register the webhook',
        desc: 'Run this once in your terminal, or paste it in a browser tab:',
        code: 'curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR-WORKER>.workers.dev/webhook/<WEBHOOK_SECRET>"',
        lang: 'bash'
      },
      {
        title: 'Done — it is live 24/7',
        desc: 'Message your bot. Cloudflare free tier covers 100k requests per day, which is far more than a typical community bot needs.'
      }
    ]
  },
  {
    id: 'deno',
    name: 'Deno Deploy',
    emoji: '🦕',
    tagline: 'Git-connected, globally distributed',
    free: '1M requests/month · no card',
    setup: '~4 min',
    difficulty: 'Easy',
    tags: ['24/7', 'webhook', 'github'],
    url: 'https://dash.deno.com',
    steps: [
      {
        title: 'Push the generated file to GitHub',
        desc: 'Download <code>deno.ts</code> from the Code tab and commit it to a repo (public or private).'
      },
      {
        title: 'Import the repo in Deno Deploy',
        desc: 'dash.deno.com → New Project → Import from GitHub → choose the repo → entrypoint <code>deno.ts</code>. Deploy.'
      },
      {
        title: 'Add environment variables',
        desc: 'Project → Settings → Environment Variables: <code>BOT_TOKEN</code> and <code>WEBHOOK_SECRET</code>.'
      },
      {
        title: 'Set the webhook',
        desc: 'Point Telegram to your Deno project URL:',
        code: 'curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR-PROJECT>.deno.dev/webhook/<WEBHOOK_SECRET>"',
        lang: 'bash'
      }
    ]
  },
  {
    id: 'github',
    name: 'GitHub Actions',
    emoji: '🐙',
    tagline: 'Your repo becomes the server',
    free: '2,000 min/month on private repos',
    setup: '~5 min',
    difficulty: 'Medium',
    tags: ['24/7-ish', 'polling', 'github'],
    url: 'https://github.com/arslanansari1629-blip/AI',
    steps: [
      {
        title: 'Create a repo with the generated files',
        desc: 'Commit <code>index.js</code> (Node version) and the workflow file <code>.github/workflows/bot.yml</code>.'
      },
      {
        title: 'Add your token as a secret',
        desc: 'Repo → Settings → Secrets and variables → Actions → New repository secret → name it <code>BOT_TOKEN</code>.'
      },
      {
        title: 'Enable the workflow',
        desc: 'Actions tab → select the workflow → Run workflow. It re-runs every 5 hours automatically.'
      },
      {
        title: 'Know the trade-off',
        desc: 'Each GitHub job can run up to 6 hours, so there is a short gap between runs. Great for low-traffic bots on private repos (public repos get free minutes). For gap-free uptime use Cloudflare.'
      }
    ]
  },
  {
    id: 'node-host',
    name: 'Koyeb / Render / Replit',
    emoji: '🟢',
    tagline: 'Classic free Node hosting',
    free: 'Free tier · sleeps when idle (Render)',
    setup: '~5 min',
    difficulty: 'Medium',
    tags: ['24/7', 'polling', 'node'],
    url: 'https://koyeb.com',
    steps: [
      {
        title: 'Push the Node version to GitHub',
        desc: 'Use <code>index.js</code> + <code>package.json</code> from the Code tab. No dependencies are needed (Node 18+).'
      },
      {
        title: 'Create a free service',
        desc: 'Koyeb, Render or Replit → New Service → Import repo → Build: <code>npm install</code> → Start: <code>npm start</code>.'
      },
      {
        title: 'Set BOT_TOKEN',
        desc: 'Environment variables → <code>BOT_TOKEN</code>. The bot uses long polling, so no webhook is required (it deletes any existing one at startup).'
      },
      {
        title: 'Free-tier reality check',
        desc: 'Render free web services sleep after 15 minutes of inactivity. Koyeb and Oracle Free Tier can stay awake. A worker on Cloudflare never sleeps and is still the cheapest option.'
      }
    ]
  },
  {
    id: 'python',
    name: 'Python host',
    emoji: '🐍',
    tagline: 'python-telegram-bot, anywhere',
    free: 'Free tiers on Koyeb / PythonAnywhere trials',
    setup: '~4 min',
    difficulty: 'Easy',
    tags: ['polling', 'python'],
    url: 'https://www.pythonanywhere.com',
    steps: [
      {
        title: 'Download three files',
        desc: '<code>bot.py</code> and <code>requirements.txt</code> from the Code tab.'
      },
      {
        title: 'Install and run',
        desc: 'Any machine with Python 3.10+:',
        code: 'pip install -r requirements.txt\nBOT_TOKEN=123456:ABC... python bot.py',
        lang: 'bash'
      },
      {
        title: 'Host it for free',
        desc: 'Koyeb, Oracle Cloud Always Free, or a Raspberry Pi at home. The bot uses long polling, so no public URL is required.'
      }
    ]
  },
  {
    id: 'vps',
    name: 'Your own server',
    emoji: '🖥️',
    tagline: 'Full control, still zero cost on free tiers',
    free: 'Oracle Always Free / home hardware',
    setup: '~10 min',
    difficulty: 'Advanced',
    tags: ['24/7', 'systemd', 'vps'],
    steps: [
      {
        title: 'Copy the Node version to the server',
        desc: 'Upload <code>index.js</code> and <code>package.json</code>. Node 18+ is required.'
      },
      {
        title: 'Run it as a service',
        desc: 'Create <code>/etc/systemd/system/telegram-bot.service</code>:',
        code: '[Unit]\nDescription=Telegram bot\nAfter=network.target\n\n[Service]\nEnvironment=BOT_TOKEN=123456:ABC...\nExecStart=/usr/bin/node /opt/bot/index.js\nRestart=always\n\n[Install]\nWantedBy=multi-user.target',
        lang: 'ini'
      },
      {
        title: 'Enable and start',
        desc: 'The bot restarts automatically after crashes or reboots.',
        code: 'sudo systemctl daemon-reload\nsudo systemctl enable --now telegram-bot\nsudo journalctl -u telegram-bot -f',
        lang: 'bash'
      }
    ]
  }
];

export function getTarget(id) {
  return TARGETS.find((t) => t.id === id) || TARGETS[0];
}

export function webhookCurl(token, host, secret) {
  const safeToken = token || '<YOUR_TOKEN>';
  const safeSecret = secret || '<WEBHOOK_SECRET>';
  const safeHost = host || '<YOUR-WORKER>.workers.dev';
  const url = safeHost.startsWith('http') ? `${safeHost.replace(/\/$/, '')}/webhook/${safeSecret}` : `https://${safeHost.replace(/\/$/, '')}/webhook/${safeSecret}`;
  return `curl "https://api.telegram.org/bot${safeToken}/setWebhook?url=${url}"`;
}

export const DEPLOY_CHECKLIST = [
  'Bot created in @BotFather and token saved',
  'Token tested successfully (getMe)',
  'Rules added and previewed in the simulator',
  'Code generated for a serverless target',
  'BOT_TOKEN + WEBHOOK_SECRET set as secrets',
  'Webhook registered with setWebhook',
  'First real message answered end-to-end',
  'Webhook status verified with getWebhookInfo'
];
