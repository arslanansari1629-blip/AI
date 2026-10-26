/* ============================================================
   BotForge — code generators
   Turns any bot config into standalone, deployable source code.
   No BotForge account or server required at runtime.
   ============================================================ */

const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

const rulesJson = (bot) => JSON.stringify(
  (bot.rules || []).map((r) => ({
    enabled: r.enabled !== false,
    trigger: r.trigger || '',
    match: r.match,
    reply: r.reply || '',
    buttons: (r.buttons || []).filter((b) => b && b.label).map((b) => ({ label: b.label, data: b.data || '', url: b.url || '' }))
  })),
  null, 2
);

const safeName = (s = 'bot') => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bot';

/* ----------------------------- shared engine (JS) ----------------------------- */
const jsEngine = `
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function tgHtml(input) {
  const keep = [];
  return String(input)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;(\\/?)(b|i|code|pre|a|u|s)&gt;/gi, (_m, slash, tag) => {
      keep.push('<' + slash + tag.toLowerCase() + '>');
      return '@@' + (keep.length - 1) + '@@';
    })
    .replace(/@@(\\d+)@@/g, (_m, i) => keep[+i]);
}

function render(text, ctx) {
  const data = Object.assign({ name: 'there', args: '', bot: 'bot', id: '', time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() }, ctx);
  return String(text || '')
    .replace(/\\{\\{?\\s*random:([^}]+)\\}?\\}/gi, (_m, list) => {
      const arr = list.split('|');
      return arr[Math.floor(Math.random() * arr.length)].trim();
    })
    .replace(/\\{\\{?\\s*(\\w+)\\s*\\}?\\}/g, (m, k) => (data[k] !== undefined ? data[k] : m));
}

function matches(rule, raw, isCommand) {
  if (rule.enabled === false) return false;
  const text = String(raw || '').trim().toLowerCase();
  const trig = String(rule.trigger || '').trim().toLowerCase();
  if (!trig || rule.match === 'fallback') return false;
  if (rule.match === 'any') return true;
  if (rule.match === 'exact') return text === trig;
  if (rule.match === 'command') return isCommand && (text === trig || text.startsWith(trig + ' '));
  if (rule.match === 'start') return text.startsWith(trig);
  if (rule.match === 'regex') {
    try { return new RegExp(rule.trigger, 'i').test(String(raw)); } catch { return false; }
  }
  return text.includes(trig);
}

function replyFor(raw, from) {
  const isCommand = String(raw).startsWith('/');
  const user = Object.assign({ name: 'there', username: '', id: '' }, from || {});
  for (const rule of RULES) {
    if (matches(rule, raw, isCommand)) {
      return { text: render(rule.reply, { name: user.name, args: String(raw).split(/\\s+/).slice(1).join(' '), bot: BOT_NAME }), buttons: rule.buttons || [] };
    }
  }
  const fb = RULES.find((r) => r.match === 'fallback' && r.enabled !== false);
  return { text: render(fb ? fb.reply : "I didn't understand that. Try /help", { name: user.name, bot: BOT_NAME }), buttons: fb ? fb.buttons || [] : [] };
}

function keyboard(buttons) {
  const clean = (buttons || []).filter((b) => b && b.label);
  if (!clean.length) return undefined;
  const rows = [];
  for (let i = 0; i < clean.length; i += 3) {
    rows.push(clean.slice(i, i + 3).map((b) => (/^https?:\\/\\//i.test(b.url || '')
      ? { text: b.label, url: b.url }
      : { text: b.label, callback_data: String(b.data || b.label).slice(0, 64) })));
  }
  return { inline_keyboard: rows };
}
`;

const tsEngine = `
const tgHtml = (input: string): string => {
  const keep: string[] = [];
  return String(input)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;(\\/?)(b|i|code|pre|a|u|s)&gt;/gi, (_m: string, slash: string, tag: string) => {
      keep.push('<' + slash + tag.toLowerCase() + '>');
      return '@@' + (keep.length - 1) + '@@';
    })
    .replace(/@@(\\d+)@@/g, (_m: string, i: string) => keep[Number(i)]);
};

const render = (text: string, ctx: Record<string, string | number>): string => {
  const data: Record<string, string | number> = Object.assign(
    { name: 'there', args: '', bot: 'bot', id: '', time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() },
    ctx
  );
  return String(text || '')
    .replace(/\\{\\{?\\s*random:([^}]+)\\}?\\}/gi, (_m: string, list: string) => {
      const arr = list.split('|');
      return arr[Math.floor(Math.random() * arr.length)].trim();
    })
    .replace(/\\{\\{?\\s*(\\w+)\\s*\\}?\\}/g, (m: string, k: string) => (data[k] !== undefined ? String(data[k]) : m));
};

const matches = (rule: any, raw: string, isCommand: boolean): boolean => {
  if (rule.enabled === false) return false;
  const text = String(raw || '').trim().toLowerCase();
  const trig = String(rule.trigger || '').trim().toLowerCase();
  if (!trig || rule.match === 'fallback') return false;
  if (rule.match === 'any') return true;
  if (rule.match === 'exact') return text === trig;
  if (rule.match === 'command') return isCommand && (text === trig || text.startsWith(trig + ' '));
  if (rule.match === 'start') return text.startsWith(trig);
  if (rule.match === 'regex') {
    try { return new RegExp(rule.trigger, 'i').test(String(raw)); } catch { return false; }
  }
  return text.includes(trig);
};

const replyFor = (raw: string, from?: { name?: string; username?: string; id?: string | number }) => {
  const isCommand = String(raw).startsWith('/');
  const user = Object.assign({ name: 'there', username: '', id: '' }, from || {});
  for (const rule of RULES) {
    if (matches(rule, raw, isCommand)) {
      return {
        text: render(rule.reply, { name: user.name, args: String(raw).split(/\\s+/).slice(1).join(' '), bot: BOT_NAME }),
        buttons: rule.buttons || []
      };
    }
  }
  const fb = RULES.find((r: any) => r.match === 'fallback' && r.enabled !== false);
  return { text: render(fb ? fb.reply : "I didn't understand that. Try /help", { name: user.name, bot: BOT_NAME }), buttons: fb ? fb.buttons || [] : [] };
};

const keyboard = (buttons: any[]) => {
  const clean = (buttons || []).filter((b: any) => b && b.label);
  if (!clean.length) return undefined;
  const rows: any[] = [];
  for (let i = 0; i < clean.length; i += 3) {
    rows.push(clean.slice(i, i + 3).map((b: any) => (/^https?:\\/\\//i.test(b.url || '')
      ? { text: b.label, url: b.url }
      : { text: b.label, callback_data: String(b.data || b.label).slice(0, 64) })));
  }
  return { inline_keyboard: rows };
};
`;

/* ----------------------------- Cloudflare Worker ----------------------------- */
export function genCloudflareWorker(bot) {
  const name = bot.name || 'BotForge bot';
  const username = bot.username || 'your_bot';
  return `/**
 * BotForge · Cloudflare Worker
 * Bot: ${name} (@${username})
 * Generated: ${stamp()}
 *
 * Deploy (free tier, no card):
 *   1. https://dash.cloudflare.com  →  Workers & Pages  →  Create Worker
 *   2. Paste this whole file, Deploy
 *   3. Worker → Settings → Variables:
 *        BOT_TOKEN       = 123456:ABC...      (secret)
 *        WEBHOOK_SECRET  = ${randomSecret()}
 *   4. Register the webhook (run once in a terminal / Postman):
 *        curl "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=https://YOUR-WORKER.workers.dev/webhook/$WEBHOOK_SECRET"
 *
 * That's it — the bot answers 24/7 on Cloudflare's free plan.
 */

const BOT_NAME = ${JSON.stringify(name)};
const RULES = ${rulesJson(bot)};
${jsEngine}
async function sendMessage(env, chatId, text, buttons, replyTo) {
  const body = {
    chat_id: chatId,
    text: tgHtml(text),
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  const kb = keyboard(buttons);
  if (kb) body.reply_markup = kb;
  if (replyTo) body.reply_parameters = { message_id: replyTo, allow_sending_without_reply: true };

  await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function handleUpdate(update, env) {
  if (update.callback_query) {
    const cq = update.callback_query;
    await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/answerCallbackQuery', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cq.id })
    });
    const from = cq.from || {};
    const reply = replyFor(cq.data || '', { name: from.first_name || 'there', username: from.username });
    await sendMessage(env, cq.message && cq.message.chat && cq.message.chat.id, reply.text, reply.buttons, cq.message && cq.message.message_id);
    return;
  }

  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) return;
  if (msg.from && msg.from.is_bot) return;

  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'there';
  const reply = replyFor(msg.text, { name, username: from.username, id: from.id });
  await sendMessage(env, msg.chat.id, reply.text, reply.buttons, msg.message_id);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      return new Response(
        '<!doctype html><title>${name} bot</title>' +
        '<body style="font-family:system-ui;background:#070a13;color:#e7ecf7;display:grid;place-items:center;height:100vh;margin:0">' +
        '<div style="text-align:center"><h1 style="margin:0 0 8px">🤖 ${name}</h1>' +
        '<p style="opacity:.7;margin:0">Webhook is live · powered by BotForge</p></div></body>',
        { headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    }

    if (!env.BOT_TOKEN) return new Response('Missing BOT_TOKEN variable', { status: 500 });
    if (env.WEBHOOK_SECRET && url.pathname !== '/webhook/' + env.WEBHOOK_SECRET) {
      return new Response('Not found', { status: 404 });
    }

    let update;
    try { update = await request.json(); } catch { return new Response('Bad request', { status: 400 }); }

    ctx.waitUntil(handleUpdate(update, env).catch((e) => console.error('handler error', e)));
    return new Response('ok');
  }
};
`;
}

/* ----------------------------- Deno Deploy ----------------------------- */
export function genDenoDeploy(bot) {
  const name = bot.name || 'BotForge bot';
  return `/**
 * BotForge · Deno Deploy
 * Bot: ${name} (@${bot.username || 'your_bot'})
 * Generated: ${stamp()}
 *
 * Deploy (free, no card):
 *   1. Push this file to a GitHub repo
 *   2. https://dash.deno.com → New Project → Import your repo → entrypoint: main.ts
 *   3. Settings → Environment Variables:
 *        BOT_TOKEN      = 123456:ABC...
 *        WEBHOOK_SECRET = ${randomSecret()}
 *   4. Point Telegram at it:
 *        curl "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=https://YOUR-PROJECT.deno.dev/webhook/$WEBHOOK_SECRET"
 */

const BOT_NAME = ${JSON.stringify(name)};
const RULES = ${rulesJson(bot)};
${tsEngine}
async function sendMessage(chatId: number | string, text: string, buttons: any[], replyTo?: number) {
  const token = Deno.env.get('BOT_TOKEN');
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: tgHtml(text),
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  const kb = keyboard(buttons);
  if (kb) body.reply_markup = kb;
  if (replyTo) body.reply_parameters = { message_id: replyTo, allow_sending_without_reply: true };
  await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function handleUpdate(update: any) {
  if (update.callback_query) {
    const cq = update.callback_query;
    const token = Deno.env.get('BOT_TOKEN');
    await fetch('https://api.telegram.org/bot' + token + '/answerCallbackQuery', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cq.id })
    });
    const reply = replyFor(cq.data || '', { name: cq.from?.first_name || 'there' });
    await sendMessage(cq.message?.chat?.id, reply.text, reply.buttons, cq.message?.message_id);
    return;
  }
  const msg = update.message || update.edited_message;
  if (!msg?.text || msg.from?.is_bot) return;
  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'there';
  const reply = replyFor(msg.text, { name, username: from.username, id: from.id });
  await sendMessage(msg.chat.id, reply.text, reply.buttons, msg.message_id);
}

Deno.serve(async (request: Request) => {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    return new Response('🤖 ${name} — webhook live (BotForge)', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (secret && url.pathname !== '/webhook/' + secret) return new Response('Not found', { status: 404 });
  if (!Deno.env.get('BOT_TOKEN')) return new Response('Missing BOT_TOKEN', { status: 500 });

  let update: any;
  try { update = await request.json(); } catch { return new Response('Bad request', { status: 400 }); }
  // Respond fast, work in the background (Telegram needs a reply in < 60s, ideally < 1s)
  handleUpdate(update).catch((e) => console.error(e));
  return new Response('ok');
});
`;
}

/* ----------------------------- Node long polling ----------------------------- */
export function genNodePolling(bot) {
  const name = bot.name || 'BotForge bot';
  return `/**
 * BotForge · Node.js long-polling bot
 * Bot: ${name} (@${bot.username || 'your_bot'})
 * Generated: ${stamp()}
 *
 * Runs anywhere Node 18+ is available. No dependencies.
 *
 *   BOT_TOKEN=123456:ABC... node index.js
 *
 * Free 24/7 options: Koyeb, Railway trial, Replit, Oracle Cloud free tier,
 * a Raspberry Pi, or any spare machine. For zero-maintenance hosting use the
 * Cloudflare Worker version instead.
 */

const TOKEN = process.env.BOT_TOKEN || 'PASTE_YOUR_TOKEN_HERE';
const BOT_NAME = ${JSON.stringify(name)};
const RULES = ${rulesJson(bot)};
${jsEngine}
const API = 'https://api.telegram.org/bot' + TOKEN;

async function call(method, payload) {
  const res = await fetch(API + '/' + method, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(method + ' failed: ' + data.description);
  return data.result;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendMessage(chatId, text, buttons, replyTo) {
  const payload = {
    chat_id: chatId,
    text: tgHtml(text),
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  const kb = keyboard(buttons);
  if (kb) payload.reply_markup = kb;
  if (replyTo) payload.reply_parameters = { message_id: replyTo, allow_sending_without_reply: true };
  try {
    await call('sendMessage', payload);
  } catch (e) {
    console.error('sendMessage failed:', e.message);
  }
}

async function handleUpdate(update) {
  if (update.callback_query) {
    const cq = update.callback_query;
    try { await call('answerCallbackQuery', { callback_query_id: cq.id }); } catch {}
    const reply = replyFor(cq.data || '', { name: cq.from?.first_name || 'there' });
    await sendMessage(cq.message?.chat?.id, reply.text, reply.buttons, cq.message?.message_id);
    return;
  }
  const msg = update.message || update.edited_message;
  if (!msg?.text || msg.from?.is_bot) return;

  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'there';
  const reply = replyFor(msg.text, { name, username: from.username, id: from.id });

  try { await call('sendChatAction', { chat_id: msg.chat.id, action: 'typing' }); } catch {}
  await sleep(300);
  await sendMessage(msg.chat.id, reply.text, reply.buttons, msg.message_id);
}

async function main() {
  if (!TOKEN || TOKEN.indexOf(':') === -1) {
    console.error('Set BOT_TOKEN first:  BOT_TOKEN=123:abc node index.js');
    process.exit(1);
  }
  const me = await call('getMe', {});
  console.log('✅ Running as @' + me.username);

  // A webhook blocks polling — remove it once at startup.
  try { await call('deleteWebhook', { drop_pending_updates: false }); } catch {}

  let offset = 0;
  let backoff = 1000;

  while (true) {
    try {
      const updates = await call('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] });
      backoff = 1000;
      for (const update of updates || []) {
        offset = Math.max(offset, update.update_id + 1);
        try { await handleUpdate(update); } catch (e) { console.error('update error:', e.message); }
      }
    } catch (e) {
      console.error('polling error:', e.message, '— retrying in', backoff / 1000 + 's');
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 30000);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
`;
}

/* ----------------------------- Python ----------------------------- */
export function genPython(bot) {
  const name = bot.name || 'BotForge bot';
  const rules = [];
  (bot.rules || []).forEach((r) => {
    rules.push({
      enabled: r.enabled !== false,
      trigger: r.trigger || '',
      match: r.match,
      reply: r.reply || '',
      buttons: (r.buttons || []).filter((b) => b && b.label).map((b) => ({ label: b.label, data: b.data || '', url: b.url || '' }))
    });
  });
  return `"""
BotForge · Python bot (python-telegram-bot v21)
Bot: ${name} (@${bot.username || 'your_bot'})
Generated: ${stamp()}

Setup (free hosting: Koyeb, Render, Replit, Oracle free tier):
    pip install -r requirements.txt
    BOT_TOKEN=123456:ABC... python bot.py
"""

import json
import os
import random
import re
from datetime import datetime

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes, MessageHandler, filters

BOT_NAME = ${JSON.stringify(name)}
RULES = json.loads(r"""${JSON.stringify(rules, null, 2)}""")
TOKEN = os.environ.get("BOT_TOKEN", "PASTE_YOUR_TOKEN_HERE")


def render(text: str, ctx: dict) -> str:
    def rand(match):
        options = [o.strip() for o in match.group(1).split("|")]
        return random.choice(options)

    data = {
        "name": "there", "args": "", "bot": BOT_NAME,
        "time": datetime.now().strftime("%H:%M"), "date": datetime.now().strftime("%d %b %Y"),
    }
    data.update(ctx)
    text = re.sub(r"\\{\\{?\\s*random:([^}]+)\\}?\\}", rand, text or "")
    return re.sub(r"\\{\\{?\\s*(\\w+)\\s*\\}?\\}", lambda m: str(data.get(m.group(1), m.group(0))), text)


def matches(rule, raw: str, is_command: bool) -> bool:
    if rule.get("enabled") is False:
        return False
    text = (raw or "").strip().lower()
    trigger = (rule.get("trigger") or "").strip().lower()
    mode = rule.get("match", "contains")
    if not trigger or mode == "fallback":
        return False
    if mode == "any":
        return True
    if mode == "exact":
        return text == trigger
    if mode == "command":
        return is_command and (text == trigger or text.startswith(trigger + " "))
    if mode == "start":
        return text.startswith(trigger)
    if mode == "regex":
        try:
            return bool(re.search(rule.get("trigger", ""), raw, re.I))
        except re.error:
            return False
    return trigger in text


def reply_for(raw: str, name: str = "there") -> dict:
    is_command = (raw or "").startswith("/")
    for rule in RULES:
        if matches(rule, raw, is_command):
            args = " ".join((raw or "").split()[1:])
            return {"text": render(rule.get("reply", ""), {"name": name, "args": args}), "buttons": rule.get("buttons", [])}
    fb = next((r for r in RULES if r.get("match") == "fallback" and r.get("enabled") is not False), None)
    return {
        "text": render(fb.get("reply", "Try /help") if fb else "Try /help", {"name": name}),
        "buttons": fb.get("buttons", []) if fb else [],
    }


def keyboard(buttons):
    rows, row = [], []
    for b in buttons or []:
        if not b.get("label"):
            continue
        if re.match(r"^https?://", b.get("url") or ""):
            row.append(InlineKeyboardButton(b["label"], url=b["url"]))
        else:
            row.append(InlineKeyboardButton(b["label"], callback_data=(b.get("data") or b["label"])[:64]))
        if len(row) == 3:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    return InlineKeyboardMarkup(rows) if rows else None


async def reply(update: Update, text: str, buttons=None):
    await update.message.reply_text(
        text, parse_mode=ParseMode.HTML, disable_web_page_preview=True,
        reply_markup=keyboard(buttons),
    )


async def on_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg or not msg.text:
        return
    name = (msg.from_user.first_name or "") if msg.from_user else "there"
    result = reply_for(msg.text, name)
    await reply(update, result["text"], result["buttons"])


async def on_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    name = (query.from_user.first_name or "") if query.from_user else "there"
    result = reply_for(query.data or "", name)
    await query.message.reply_text(
        result["text"], parse_mode=ParseMode.HTML,
        reply_markup=keyboard(result["buttons"]),
    )


def main():
    if ":" not in TOKEN:
        raise SystemExit("Set BOT_TOKEN first:  BOT_TOKEN=123:abc python bot.py")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler(["start", "help"], on_message))
    app.add_handler(CallbackQueryHandler(on_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_message))
    print("Bot running…")
    app.run_polling(allowed_updates=["message", "callback_query"])


if __name__ == "__main__":
    main()
`;
}

/* ----------------------------- extras ----------------------------- */
export function genRequirements() {
  return 'python-telegram-bot==21.6\n';
}

export function genPackageJson(bot) {
  return `${JSON.stringify({
    name: safeName(bot.name),
    version: '1.0.0',
    private: true,
    type: 'module',
    description: `${bot.name} — Telegram bot generated with BotForge`,
    main: 'index.js',
    scripts: { start: 'node index.js' },
    engines: { node: '>=18' }
  }, null, 2)}\n`;
}

export function genWrangler(bot) {
  return `name = "${safeName(bot.name)}-bot"
main = "worker.js"
compatibility_date = "2024-11-01"

# Secrets are set with:
#   wrangler secret put BOT_TOKEN
#   wrangler secret put WEBHOOK_SECRET
`;
}

export function genConfig(bot) {
  return `${JSON.stringify({
    app: 'BotForge',
    format: 1,
    bot: {
      name: bot.name,
      username: bot.username,
      emoji: bot.emoji,
      about: bot.about,
      commands: bot.commands,
      settings: bot.settings,
      rules: bot.rules
    }
  }, null, 2)}\n`;
}

export function genGitHubAction(bot) {
  return `# BotForge · free hosting with GitHub Actions
# Runs the bot in polling mode on a schedule (max 6h per job).
# Add BOT_TOKEN in: repo → Settings → Secrets and variables → Actions → New secret
name: ${bot.name} bot

on:
  schedule:
    - cron: "0 */5 * * *"   # every 5 hours
  workflow_dispatch:

concurrency:
  group: bot-poller
  cancel-in-progress: false

jobs:
  run:
    runs-on: ubuntu-latest
    timeout-minutes: 350
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run bot
        env:
          BOT_TOKEN: \${{ secrets.BOT_TOKEN }}
        run: node index.js
`;
}

export function genReadme(bot) {
  return `# ${bot.name}

> A Telegram bot generated with [BotForge](https://github.com/arslanansari1629-blip/AI).

@${bot.username || 'your_bot'} · ${(bot.rules || []).length} rules · ${bot.commands?.length || 0} commands

## 1. Create the bot (30 seconds)

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send \`/newbot\`, pick a name and a username
3. Copy the token it gives you (looks like \`123456789:AAH...\`)

## 2. Deploy (free)

### Cloudflare Workers — recommended (free forever)
1. Paste \`worker.js\` into a new Worker at https://dash.cloudflare.com
2. Add variables \`BOT_TOKEN\` and \`WEBHOOK_SECRET\`
3. Register the webhook:
\`\`\`bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<worker>.workers.dev/webhook/<WEBHOOK_SECRET>"
\`\`\`

### Node (any VPS, Replit, Koyeb…)
\`\`\`bash
npm start          # uses polling, no webhook needed
\`\`\`

### Python
\`\`\`bash
pip install -r requirements.txt
BOT_TOKEN=your:token python bot.py
\`\`\`

## Files

| File | What it is |
| --- | --- |
| \`worker.js\` | Cloudflare Worker (webhook) |
| \`deno.ts\` | Deno Deploy (webhook) |
| \`index.js\` | Node.js long polling |
| \`bot.py\` | Python (python-telegram-bot) |
| \`botforge.json\` | Your bot config — import it back into BotForge anytime |
| \`wrangler.toml\` | Cloudflare CLI config |

## Commands

${(bot.commands || []).map((c) => `- \`/${c}\``).join('\n') || '- `/start`'}

---

Generated ${stamp()} · BotForge keeps no copies, no logs, no account. Your token is yours.
`;
}

export function randomSecret(length = 24) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => alphabet[b % alphabet.length]).join('');
}

export function genCommandList(bot) {
  return (bot.commands || []).map((c) => ({
    command: c.replace(/^\//, '').toLowerCase(),
    description: `${bot.name} · /${c.replace(/^\//, '')}`
  }));
}

export const GENERATORS = {
  worker: { label: 'Cloudflare Worker', file: 'worker.js', mime: 'text/javascript', gen: genCloudflareWorker, icon: '☁️', cost: 'Free · always on' },
  deno: { label: 'Deno Deploy', file: 'deno.ts', mime: 'text/typescript', gen: genDenoDeploy, icon: '🦕', cost: 'Free · always on' },
  node: { label: 'Node.js', file: 'index.js', mime: 'text/javascript', gen: genNodePolling, icon: '🟢', cost: 'Any server' },
  python: { label: 'Python', file: 'bot.py', mime: 'text/x-python', gen: genPython, icon: '🐍', cost: 'Any server' },
  config: { label: 'botforge.json', file: 'botforge.json', mime: 'application/json', gen: genConfig, icon: '🧩', cost: 'Portable config' },
  readme: { label: 'README', file: 'README.md', mime: 'text/markdown', gen: genReadme, icon: '📘', cost: 'Docs' }
};
