# 🤖 TeleHost ∞ — Free Unlimited Telegram Bot Hosting

**Host unlimited Telegram bots. Free forever. No login. No credit card. No server setup.**

🌐 **Live site:** https://arslanansari1629-blip.github.io/AI/

![Free Forever](https://img.shields.io/badge/Price-%240%20Forever-00c98d)
![No Login](https://img.shields.io/badge/Login-Not%20Required-8b5cff)
![Bots](https://img.shields.io/badge/Bots-Unlimited%20%E2%88%9E-00d4ff)
![Hosting](https://img.shields.io/badge/Hosted%20Free%20on-GitHub%20Pages-24292f)

## ✨ Features

| Feature | Details |
|---|---|
| 🚀 **Instant hosting** | Paste a @BotFather token → press ▶ Start → bot is live in 10 seconds |
| ♾️ **Unlimited bots** | Add, duplicate and run as many bots as you want |
| 🔓 **No login** | No account, no email, no card — data lives only in your browser |
| 🧩 **No-code rules** | Auto-replies by command / keyword / exact / starts-with / regex, with inline buttons |
| 💻 **JS Code Lab** | Write real JavaScript bot logic (`reply()`, `replyButtons()`) that runs live |
| 📱 **Playground** | Fake Telegram chat to test any bot instantly — no token needed |
| 🎨 **9 pro templates** | Shop, Support, Fun & Games, Quiz, Group Greeter, Assistant, Local Business… |
| 🛠 **API toolkit** | Token validator, send test message, webhook manager, chat-ID finder |
| ♾️ **24/7 export** | One-click generates complete **Python** or **Node.js** projects (your rules baked in) + `requirements.txt`/`package.json` + `Dockerfile` for free hosts (Render / Railway / Koyeb / Replit) |
| 💾 **Backup/restore** | Export/import all bots as JSON — you own your data |

## 🏃 How to use

1. Open Telegram → **@BotFather** → `/newbot` → copy your token
2. Open the live site → paste token → **Add & Validate Bot**
3. Add auto-reply rules (or apply a template) → press **▶ Start**
4. Message your bot on Telegram — it replies instantly 🎉

> 💡 The in-browser engine runs while the tab is open (that's why it's 100% free & private).
> For closed-tab 24/7, use the **24/7 Deploy Export** on the site (3 minutes, still $0).

## 🔒 Privacy & security

- There is **no backend and no database**. Tokens are stored only in your browser's `localStorage`.
- Tokens are sent **only** to `api.telegram.org` (Telegram's official Bot API) — verify in `index.html`.
- Treat tokens like passwords. If one leaks: @BotFather → `/revoke`.

## 🛠 Run / host it yourself (free)

This is a pure static site — no build step.

```bash
# Local preview
python3 -m http.server 8080
# → open http://localhost:8080
```

**GitHub Pages (already configured):** every push to `main` auto-deploys via
`.github/workflows/deploy-pages.yml`. Fork this repo → Settings → Pages →
Source: *GitHub Actions* → push → your copy is live free at
`https://<your-username>.github.io/AI/`.

## 📁 Files

| File | Purpose |
|---|---|
| `index.html` | The entire app (UI + bot engine + generators) |
| `404.html` | Same app as SPA fallback |
| `manifest.json` + `icon.svg` | Installable PWA metadata + icon |
| `.github/workflows/deploy-pages.yml` | Free GitHub Pages auto-deploy |
| `.nojekyll` | Tells Pages to serve files as-is |

## ⚠️ Honest notes

- "Free forever" = this static site on GitHub Pages + Telegram's free Bot API + your browser as the engine. Nobody gets a server bill, so nobody needs to charge you.
- Telegram's own API limits apply (~30 msgs/sec per bot).
- If two places poll the same token, Telegram returns a `Conflict` error — run each token in one place at a time.

Not affiliated with Telegram. Made with the official Telegram Bot API.
