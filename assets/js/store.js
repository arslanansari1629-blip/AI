/* ============================================================
   BotForge — local-first store
   Everything is stored in this browser (localStorage).
   No accounts, no servers, no tracking, no telemetry.
   ============================================================ */

const KEY = 'botforge.v1';

const DEFAULT_RULES = [
  {
    id: 'r_start',
    enabled: true,
    trigger: '/start',
    match: 'exact',
    reply: 'Hey {name}! 👋 I am {bot}, your personal assistant.\n\nTry /help to see everything I can do.',
    buttons: [
      { label: '📖 Commands', data: '/help' },
      { label: '🌐 Website', url: '' }
    ]
  },
  {
    id: 'r_help',
    enabled: true,
    trigger: '/help',
    match: 'exact',
    reply: 'Here is what I can do:\n\n/start — meet the bot\n/ping — latency check\n/id — show your Telegram ID\n/time — current time\n/about — what I am\n\nOr just say hi 🙂',
    buttons: []
  },
  {
    id: 'r_ping',
    enabled: true,
    trigger: '/ping',
    match: 'exact',
    reply: '🏓 Pong! Round trip: {latency}ms',
    buttons: []
  },
  {
    id: 'r_hi',
    enabled: true,
    trigger: 'hi',
    match: 'contains',
    reply: 'Hello {name}! Great to see you 💜\nType /help for the full command list.',
    buttons: []
  },
  {
    id: 'r_fallback',
    enabled: true,
    trigger: '',
    match: 'fallback',
    reply: "I didn't catch that 🤔\nTry /help — or ask me something specific.",
    buttons: [{ label: '📖 Show commands', data: '/help' }]
  }
];

export const DEFAULT_SETTINGS = {
  typing: true,
  cooldown: 600,
  ignoreBots: true,
  fallback: true,
  theme: 'dark',
  sound: false,
  autoScroll: true,
  prettyCode: true
};

export function defaultRules() {
  return JSON.parse(JSON.stringify(DEFAULT_RULES));
}

export function createBot(partial = {}) {
  const now = Date.now();
  return {
    id: partial.id || `bot_${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    name: 'Nova',
    username: 'nova_bot',
    emoji: '🤖',
    about: 'Your friendly Telegram assistant, hosted for free.',
    token: '',
    tokenValid: null,
    tokenInfo: null,
    createdAt: now,
    updatedAt: now,
    settings: { ...DEFAULT_SETTINGS },
    commands: ['start', 'help', 'ping', 'id', 'time'],
    rules: defaultRules(),
    template: null,
    stats: { messages: 0, updates: 0, lastSeen: null },
    ...partial
  };
}

function loadData() {
  const base = {
    version: 1,
    bots: [],
    activeBotId: null,
    settings: { ...DEFAULT_SETTINGS },
    history: [],
    installedAt: Date.now()
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      bots: Array.isArray(parsed.bots) ? parsed.bots.map(normalizeBot) : []
    };
  } catch {
    return base;
  }
}

export function normalizeBot(b) {
  const d = createBot({ id: b.id });
  return {
    ...d,
    ...b,
    settings: { ...d.settings, ...(b.settings || {}) },
    rules: Array.isArray(b.rules) && b.rules.length ? b.rules.map(normalizeRule) : d.rules,
    stats: { ...d.stats, ...(b.stats || {}) }
  };
}

function normalizeRule(r) {
  return {
    id: r.id || `r_${Math.random().toString(36).slice(2, 9)}`,
    enabled: r.enabled !== false,
    trigger: r.trigger ?? '',
    match: r.match || 'contains',
    reply: r.reply ?? '',
    buttons: Array.isArray(r.buttons) ? r.buttons.filter((x) => x && (x.label || x.url)) : []
  };
}

class Store {
  constructor() {
    this.data = loadData();
    this.listeners = new Set();
    this.available = this._probe();
  }

  _probe() {
    try {
      localStorage.setItem('__bf_probe', '1');
      localStorage.removeItem('__bf_probe');
      return true;
    } catch {
      return false;
    }
  }

  _persist() {
    if (!this.available) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      this.available = false;
      // storage full / blocked — keep working in memory
      console.warn('[BotForge] Local storage unavailable, working in memory only.', e);
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.listeners.forEach((fn) => {
      try { fn(this.data); } catch (e) { console.error(e); }
    });
  }

  save() {
    this._persist();
    this.emit();
  }

  /* -------- bots -------- */
  get bots() { return this.data.bots; }
  get settings() { return this.data.settings; }

  getBot(id) { return this.data.bots.find((b) => b.id === id) || null; }

  saveBot(bot) {
    const idx = this.data.bots.findIndex((b) => b.id === bot.id);
    bot.updatedAt = Date.now();
    if (idx >= 0) this.data.bots[idx] = bot;
    else this.data.bots.unshift(bot);
    this.data.activeBotId = bot.id;
    this.save();
    return bot;
  }

  newBot(partial) {
    const bot = createBot(partial);
    this.data.bots.unshift(bot);
    this.data.activeBotId = bot.id;
    this.save();
    return bot;
  }

  deleteBot(id) {
    this.data.bots = this.data.bots.filter((b) => b.id !== id);
    if (this.data.activeBotId === id) this.data.activeBotId = this.data.bots[0]?.id || null;
    this.save();
  }

  duplicateBot(id) {
    const src = this.getBot(id);
    if (!src) return null;
    const copy = normalizeBot({
      ...JSON.parse(JSON.stringify(src)),
      id: undefined,
      name: `${src.name} copy`,
      username: src.username ? `${src.username}_copy` : '',
      createdAt: undefined,
      token: '',
      stats: { messages: 0, updates: 0, lastSeen: null }
    });
    copy.id = `bot_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    copy.createdAt = Date.now();
    this.data.bots.unshift(copy);
    this.save();
    return copy;
  }

  bumpStat(id, key, by = 1) {
    const b = this.getBot(id);
    if (!b) return;
    b.stats = b.stats || { messages: 0, updates: 0, lastSeen: null };
    b.stats[key] = (b.stats[key] || 0) + by;
    if (key !== 'lastSeen') b.stats.lastSeen = Date.now();
    this._persist();
  }

  /* -------- settings -------- */
  setSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
  }

  /* -------- history (runtime console, capped) -------- */
  addHistory(entry) {
    this.data.history.unshift(entry);
    if (this.data.history.length > 200) this.data.history.length = 200;
    this._persist();
  }

  clearHistory() {
    this.data.history = [];
    this.save();
  }

  /* -------- import / export -------- */
  exportAll() {
    return {
      app: 'BotForge',
      version: 1,
      exportedAt: new Date().toISOString(),
      bots: this.data.bots,
      settings: this.data.settings
    };
  }

  importAll(json, { merge = true } = {}) {
    const incoming = typeof json === 'string' ? JSON.parse(json) : json;
    const bots = Array.isArray(incoming?.bots) ? incoming.bots : Array.isArray(incoming) ? incoming : null;
    if (!bots) throw new Error('Not a BotForge export file');
    const normalized = bots.map(normalizeBot);
    if (merge) {
      const byId = new Map(this.data.bots.map((b) => [b.id, b]));
      normalized.forEach((b) => byId.set(b.id, b));
      this.data.bots = Array.from(byId.values());
    } else {
      this.data.bots = normalized;
    }
    if (incoming.settings) this.data.settings = { ...this.data.settings, ...incoming.settings };
    this.save();
    return normalized.length;
  }

  wipe() {
    this.data = loadData();
    this.data.bots = [];
    this.save();
  }

  totalStats() {
    return this.data.bots.reduce(
      (acc, b) => {
        acc.updates += b.stats?.updates || 0;
        acc.messages += b.stats?.messages || 0;
        return acc;
      },
      { updates: 0, messages: 0 }
    );
  }
}

export const store = new Store();

/* ----------------------------- reply engine ----------------------------- */

export function renderTemplate(text = '', ctx = {}) {
  const safe = {
    name: 'there',
    username: 'friend',
    id: '000000000',
    bot: 'your bot',
    args: '',
    latency: '42',
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
    chat: 'private chat',
    ...ctx
  };
  return String(text)
    .replace(/\{\{?\s*random:([^}]+)\}?\}/gi, (_, opts) => {
      const arr = opts.split('|');
      return arr[Math.floor(Math.random() * arr.length)].trim();
    })
    .replace(/\{\{?\s*(\w+)\s*\}?\}/g, (m, key) => (safe[key] !== undefined ? String(safe[key]) : m));
}

export function matchRule(rule, text, isCommand = false) {
  if (!rule.enabled) return false;
  const raw = (text || '').trim();
  const t = raw.toLowerCase();
  const trig = (rule.trigger || '').trim().toLowerCase();
  if (rule.match === 'fallback') return false;
  if (rule.match === 'any') return true;
  if (!trig) return false;

  switch (rule.match) {
    case 'exact':
      return t === trig;
    case 'command':
      return isCommand && (t === trig || t.startsWith(`${trig} `) || t.split(' ')[0] === trig);
    case 'start':
      return t.startsWith(trig);
    case 'regex':
      try {
        const re = new RegExp(rule.trigger, 'i');
        return re.test(raw);
      } catch {
        return false;
      }
    case 'contains':
    default:
      return t.includes(trig);
  }
}

/**
 * The local reply engine. Pure function: (bot, text) -> reply descriptor.
 * Safe for both the simulator and the live polling runtime.
 */
export function generateReply(bot, text, { fromName = 'Guest', fromUsername = 'guest', fromId = '1001' } = {}) {
  const raw = (text || '').trim();
  const isCommand = raw.startsWith('/');
  const cmd = isCommand ? raw.split(/\s+/)[0].toLowerCase() : '';
  const args = isCommand ? raw.split(/\s+/).slice(1).join(' ') : '';
  const started = performance.now();

  // built-ins first
  if (cmd === '/start') {
    const r = bot.rules.find((x) => x.match === 'exact' && x.trigger.toLowerCase() === '/start');
    return {
      text: renderTemplate(r?.reply || `Hey {name}! I'm {bot}.`, { name: fromName, bot: bot.name }),
      buttons: r?.buttons || [],
      rule: r?.id || 'builtin:start',
      latency: Math.round(performance.now() - started)
    };
  }

  if (cmd === '/id') {
    return {
      text: `🪪 Your Telegram ID: <code>${fromId}</code>\nUsername: @${fromUsername || '—'}`,
      buttons: [], rule: 'builtin:id', latency: 4
    };
  }

  if (cmd === '/time') {
    return { text: `🕐 ${new Date().toLocaleString()}`, buttons: [], rule: 'builtin:time', latency: 3 };
  }

  if (cmd === '/ping') {
    const r = bot.rules.find((x) => x.trigger.toLowerCase() === '/ping');
    return {
      text: renderTemplate(r?.reply || '🏓 Pong! {latency}ms', { latency: (Math.random() * 30 + 12).toFixed(0) }),
      buttons: r?.buttons || [], rule: r?.id || 'builtin:ping', latency: 2
    };
  }

  // user rules in order
  for (const rule of bot.rules) {
    if (rule.match === 'fallback') continue;
    if (matchRule(rule, raw, isCommand)) {
      return {
        text: renderTemplate(rule.reply, {
          name: fromName,
          username: fromUsername,
          id: fromId,
          bot: bot.name,
          args,
          latency: (Math.random() * 40 + 10).toFixed(0)
        }),
        buttons: rule.buttons,
        rule: rule.id,
        latency: Math.round(performance.now() - started)
      };
    }
  }

  // fallback
  const fb = bot.rules.find((x) => x.match === 'fallback');
  if (fb && fb.enabled && bot.settings.fallback !== false) {
    return {
      text: renderTemplate(fb.reply || "I didn't understand that. Try /help", { name: fromName, bot: bot.name }),
      buttons: fb.buttons || [],
      rule: fb.id,
      latency: 3
    };
  }

  return {
    text: renderTemplate(fb?.reply || "I didn't understand that. Try /help", { name: fromName, bot: bot.name }),
    buttons: [], rule: 'builtin:none', latency: 2
  };
}

export function botQuickStats(bot) {
  return {
    rules: bot.rules.filter((r) => r.match !== 'fallback').length,
    commands: bot.commands?.length || bot.rules.filter((r) => (r.trigger || '').startsWith('/')).length,
    buttons: bot.rules.reduce((n, r) => n + (r.buttons?.length || 0), 0)
  };
}
