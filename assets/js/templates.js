import { defaultRules } from './store.js';

/* ============================================================
   BotForge — starter templates
   Each template returns a ready-to-run bot config.
   ============================================================ */

const B = (label, data = '', url = '') => ({ label, data, url });

const baseSettings = {
  typing: true,
  cooldown: 500,
  ignoreBots: true,
  fallback: true
};

export const TEMPLATES = [
  {
    id: 'starter',
    defaultName: 'Nova',
    emoji: '🚀',
    name: 'Starter Bot',
    category: 'Essentials',
    blurb: 'The classic first bot: greetings, help menu, ping, ID and a smart fallback. Perfect starting point.',
    tags: ['beginner', 'commands'],
    build: () => ({
      emoji: '🤖',
      about: 'Your friendly Telegram assistant.',
      commands: ['start', 'help', 'ping', 'id'],
      settings: { ...baseSettings }
    })
  },
  {
    id: 'support',
    defaultName: 'HelpDesk',
    emoji: '🎧',
    name: 'Support Desk',
    category: 'Business',
    blurb: 'A 24/7 helpdesk that answers FAQs, opens tickets and hands off to a human operator.',
    tags: ['faq', 'tickets', 'business'],
    build: () => ({
      emoji: '🎧',
      about: 'Support desk — instant answers, real humans when needed.',
      commands: ['start', 'help', 'ticket', 'status'],
      settings: { ...baseSettings, cooldown: 800 },
      rules: [
        { trigger: '/start', match: 'exact', reply: '👋 Welcome to support, {name}!\n\n• /help — FAQ & commands\n• /ticket — open a ticket\n• /status — check your ticket\n\nAverage reply time: under 2 minutes.', buttons: [B('❓ FAQ', '/help'), B('🎫 New ticket', '/ticket')] },
        { trigger: '/help', match: 'exact', reply: '📚 <b>Support topics</b>\n\n1. Pricing — /pricing\n2. Delivery — /delivery\n3. Refunds — /refund\n4. Human agent — /human\n5. Open ticket — /ticket', buttons: [B('💬 Talk to a human', '/human')] },
        { trigger: '/ticket', match: 'exact', reply: '🎫 <b>Ticket #{{random:1042|2087|3391|4470}} created.</b>\n\nAn agent will reply here shortly. Describe your issue in the next message and include screenshots if possible.', buttons: [B('📋 My tickets', '/status')] },
        { trigger: '/status', match: 'exact', reply: '📋 You have <b>1 open ticket</b>.\nStatus: <i>waiting for agent</i>\nPriority: normal', buttons: [] },
        { trigger: '/pricing', match: 'exact', reply: '💳 Our plans:\n\n• Starter — free\n• Pro — $9/mo\n• Team — $29/mo\n\nReply /human for a custom quote.' },
        { trigger: '/delivery', match: 'exact', reply: '📦 Digital delivery is instant. Physical orders ship in 24–48h with tracking.' },
        { trigger: '/refund', match: 'exact', reply: '↩️ Refunds are accepted within 14 days. Type /ticket and mention your order ID.' },
        { trigger: '/human', match: 'exact', reply: '👤 Connecting you to a human…\n\nAn agent will join this chat shortly. Your queue position: {{random:1|2|3}}.', buttons: [B('🎫 Open ticket instead', '/ticket')] },
        { trigger: 'refund', match: 'contains', reply: '↩️ I can help with refunds! Type /refund for the policy or /ticket to open a case.' },
        { trigger: 'price', match: 'contains', reply: '💳 Pricing starts free and Pro is $9/mo. Type /pricing for the full list.' },
        { trigger: '', match: 'fallback', reply: "I'm not sure I understood that 🤔\nTry /help, or type /human to reach an agent.", buttons: [B('❓ Help', '/help'), B('👤 Human', '/human')] }
      ].map((r, i) => ({ ...r, id: `support_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'store',
    defaultName: 'ShopBot',
    emoji: '🛍️',
    name: 'Mini Store',
    category: 'Business',
    blurb: 'Turn Telegram into a storefront: product catalog, cart, order flow and payment instructions.',
    tags: ['ecommerce', 'catalog'],
    build: () => ({
      emoji: '🛍️',
      about: 'The fastest shop on Telegram. Browse, order, pay — right here.',
      commands: ['start', 'catalog', 'cart', 'pay'],
      settings: { ...baseSettings },
      rules: [
        { trigger: '/start', match: 'exact', reply: '🛍️ Welcome to the shop, {name}!\n\nBrowse the catalog and check out in under a minute.', buttons: [B('📦 Catalog', '/catalog'), B('🛒 Cart', '/cart'), B('💳 Pay', '/pay')] },
        { trigger: '/catalog', match: 'exact', reply: '📦 <b>Catalog</b>\n\n1️⃣ Bot Starter Kit — $19\n2️⃣ Pro Automation Pack — $49\n3️⃣ Custom build — from $199\n\nTap a product to add it to your cart.', buttons: [B('1️⃣ Add Starter Kit', 'ADD starter'), B('2️⃣ Add Pro Pack', 'ADD pro'), B('3️⃣ Request custom', '/custom')] },
        { trigger: '/cart', match: 'exact', reply: '🛒 <b>Your cart</b>\n\n• Bot Starter Kit ×1 — $19\n\nSubtotal: $19\nShipping: free (digital)\n<b>Total: $19</b>', buttons: [B('💳 Checkout', '/pay'), B('🗑 Clear cart', '/clear')] },
        { trigger: '/pay', match: 'exact', reply: '💳 Pay securely here: example.com/pay\n\nAfter payment send the receipt to /support and we ship instantly.', buttons: [B('💳 Open checkout', '', 'https://example.com/pay')] },
        { trigger: 'ADD', match: 'start', reply: '✅ Added to cart!\n\nYour cart total is now $19. Type /cart to review or /pay to check out.' },
        { trigger: '/clear', match: 'exact', reply: '🗑 Cart cleared. Anything else? /catalog' },
        { trigger: '/custom', match: 'exact', reply: '🛠 Custom builds start at $199. Send your requirements and I will prepare a quote within 24h.' },
        { trigger: 'delivery', match: 'contains', reply: '📦 Digital products are delivered instantly. Physical goods ship in 24–48h.' },
        { trigger: '', match: 'fallback', reply: 'I can help you shop 🛍️\nTry /catalog, /cart or /pay.', buttons: [B('📦 Catalog', '/catalog')] }
      ].map((r, i) => ({ ...r, id: `store_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'ai-faq',
    defaultName: 'BrainBot',
    emoji: '🧠',
    name: 'AI Knowledge Bot',
    category: 'AI',
    blurb: 'A keyword-matching knowledge base that feels like AI. Add unlimited Q&A pairs with fuzzy matching.',
    tags: ['ai', 'knowledge', 'faq'],
    build: () => ({
      emoji: '🧠',
      about: 'Ask me anything about our product. Instant answers, 24/7.',
      commands: ['start', 'ask', 'topics'],
      settings: { ...baseSettings, cooldown: 300 },
      rules: [
        { trigger: '/start', match: 'exact', reply: '🧠 Hi {name}, I am a knowledge bot.\n\nAsk a question in plain language — for example: <i>“what is your refund policy?”</i>', buttons: [B('🎯 Topics', '/topics')] },
        { trigger: '/topics', match: 'exact', reply: '🎯 I know about:\n\n• pricing & plans\n• refunds\n• delivery & shipping\n• account & login\n• privacy\n• support hours', buttons: [B('💬 Try: pricing', 'pricing'), B('💬 Try: refund', 'refund')] },
        { trigger: 'refund|money back|cancel order', match: 'regex', reply: '↩️ <b>Refund policy</b>\n\nYou can request a refund within 14 days of purchase. Digital goods must be unused. Refunds land back on your card in 5–7 business days.' },
        { trigger: 'price|pricing|cost|plan', match: 'regex', reply: '💳 <b>Pricing</b>\n\n• Free — $0 forever\n• Pro — $9/month\n• Business — $29/month\n\nNo credit card required for the free plan.' },
        { trigger: 'delivery|shipping|ship', match: 'regex', reply: '📦 <b>Delivery</b>\n\nDigital: instant after payment.\nPhysical: 24–48h dispatch, tracking sent here.' },
        { trigger: 'login|password|account', match: 'regex', reply: '🔐 <b>Account help</b>\n\nUse “Forgot password” on the login screen. Still stuck? Type /support and we will reset it manually.' },
        { trigger: 'privacy|data|gdpr', match: 'regex', reply: '🛡 <b>Privacy</b>\n\nWe store only your email and order history. We never sell data. Delete everything anytime with /delete.' },
        { trigger: 'human|agent|support', match: 'regex', reply: '👤 A human will join shortly. Meanwhile, is there anything from /topics I can answer?' },
        { trigger: 'hours|open', match: 'regex', reply: '🕘 Support hours: 09:00–20:00 IST, every day. This bot answers 24/7.' },
        { trigger: '/ask', match: 'start', reply: '✍️ Send your question as the next message and I will search my knowledge base.' },
        { trigger: '', match: 'fallback', reply: "Hmm, that's outside my knowledge base 🤔\nTry rephrasing, or type /topics. A human can help at /human.", buttons: [B('🎯 Topics', '/topics'), B('👤 Human', '/human')] }
      ].map((r, i) => ({ ...r, id: `kb_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'welcome-gate',
    defaultName: 'GateKeeper',
    emoji: '🚪',
    name: 'Welcome Gate',
    category: 'Community',
    blurb: 'Greet new members, send rules, verify humans with a button and keep spam out of your group.',
    tags: ['group', 'moderation', 'welcome'],
    build: () => ({
      emoji: '🚪',
      about: 'Group guardian: welcomes, rules and human verification.',
      commands: ['start', 'rules', 'verify'],
      settings: { ...baseSettings, cooldown: 1200 },
      rules: [
        { trigger: '/start', match: 'exact', reply: '👋 Welcome to the community, {name}!\n\nPlease read /rules and tap verify below to unlock the chat.', buttons: [B('✅ I agree — verify me', 'VERIFY'), B('📜 Rules', '/rules')] },
        { trigger: '/rules', match: 'exact', reply: '📜 <b>Community rules</b>\n\n1. Be kind — no harassment\n2. No spam or unsolicited ads\n3. Keep it on-topic\n4. No NSFW content\n5. English & Hindi are welcome\n\nBreaking rules = mute or ban.' },
        { trigger: 'VERIFY', match: 'exact', reply: '✅ Verified! You now have full access.\n\nIntroduce yourself or ask your first question 🎉' },
        { trigger: 'welcome', match: 'contains', reply: '👋 Say hi to our newest member, {name}! Be nice 🙂' },
        { trigger: '/help', match: 'exact', reply: '🚪 <b>Gate commands</b>\n\n/start — welcome card\n/rules — community rules\n/verify — unlock chat\n/report — report a member', buttons: [B('✅ Verify', 'VERIFY')] },
        { trigger: '/report', match: 'exact', reply: '🚨 Report received. A moderator has been notified and will review within minutes.' },
        { trigger: '', match: 'fallback', reply: 'I manage this group 🚪\nTry /rules or /help.', buttons: [B('📜 Rules', '/rules')] }
      ].map((r, i) => ({ ...r, id: `gate_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'courses',
    defaultName: 'CourseBot',
    emoji: '🎓',
    name: 'Course Drip',
    category: 'Education',
    blurb: 'Deliver lessons day by day, track progress and unlock the next module on demand.',
    tags: ['education', 'drip', 'learning'],
    build: () => ({
      emoji: '🎓',
      about: 'Free 7-day course, delivered right inside Telegram.',
      commands: ['start', 'day1', 'progress'],
      settings: { ...baseSettings, cooldown: 600 },
      rules: [
        { trigger: '/start', match: 'exact', reply: '🎓 Welcome, {name}!\n\nThis is a 7-day course. One short lesson per day.\n\nReady? Start with /day1.' },
        { trigger: '/day1', match: 'exact', reply: '📘 <b>Day 1 — Foundations</b>\n\nEverything starts with a clear goal.\n\n✏️ Task: write one sentence describing what you want in 30 days.\n\nNext: /day2', buttons: [B('➡️ Next lesson', '/day2')] },
        { trigger: '/day2', match: 'exact', reply: '📗 <b>Day 2 — Habits</b>\n\nSmall daily actions beat big rare ones.\n\n✏️ Task: pick a 10-minute daily action.\n\nNext: /day3', buttons: [B('➡️ Next lesson', '/day3')] },
        { trigger: '/day3', match: 'exact', reply: '📙 <b>Day 3 — Focus</b>\n\nProtect one hour of deep work per day.\n\n✏️ Task: block a 60-minute slot in your calendar.\n\nNext: /day4', buttons: [B('➡️ Next lesson', '/day4')] },
        { trigger: '/progress', match: 'exact', reply: '📊 <b>Your progress</b>\n\n[■■■□□□□] 3 / 7 lessons\nStreak: 3 days 🔥\n\nKeep going — /day4' },
        { trigger: '/help', match: 'exact', reply: '🎓 Course commands:\n\n/day1 … /day7 — lessons\n/progress — your stats\n/start — restart intro' },
        { trigger: '', match: 'fallback', reply: '🎓 Type /start to begin the course, or /progress to see where you are.', buttons: [B('▶️ Start', '/start')] }
      ].map((r, i) => ({ ...r, id: `course_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'feedback',
    defaultName: 'FeedbackBox',
    emoji: '💌',
    name: 'Anonymous Feedback',
    category: 'Community',
    blurb: 'Collect anonymous suggestions and forward them to the owner with a private reference ID.',
    tags: ['feedback', 'anonymous', 'forms'],
    build: () => ({
      emoji: '💌',
      about: 'Anonymous feedback box. Say what you really think.',
      commands: ['start', 'send'],
      settings: { ...baseSettings, cooldown: 400 },
      rules: [
        { trigger: '/start', match: 'exact', reply: '💌 Hi {name}!\n\nThis is a fully anonymous feedback box. Send any message and it is forwarded to the owner without your name attached.', buttons: [B('✍️ Send feedback', '/send')] },
        { trigger: '/send', match: 'exact', reply: '✍️ Go ahead — type your feedback as the next message. Nothing is linked to your account.' },
        { trigger: '/help', match: 'exact', reply: '💌 <b>Help</b>\n\n/send — write feedback\n/privacy — how anonymity works' },
        { trigger: '/privacy', match: 'exact', reply: '🛡 Your feedback is stored with a random reference ID only. No usernames, no IDs, no tracking.' },
        { trigger: '', match: 'fallback', reply: '💌 Thanks! Your feedback was received anonymously.\nReference: #{{random:5821|7714|9032}}\n\nSend another message anytime, or /help.', buttons: [B('✍️ Feedback again', '/send')] }
      ].map((r, i) => ({ ...r, id: `fb_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'restaurant',
    defaultName: 'MenuBot',
    emoji: '🍽️',
    name: 'Restaurant Menu',
    category: 'Local',
    blurb: 'A beautiful digital menu with categories, dish details, opening hours and table reservations.',
    tags: ['food', 'menu', 'reservations'],
    build: () => ({
      emoji: '🍽️',
      about: 'Digital menu, hours and reservations — all in one chat.',
      commands: ['start', 'menu', 'hours', 'book'],
      settings: { ...baseSettings },
      rules: [
        { trigger: '/start', match: 'exact', reply: '🍽️ Welcome to our restaurant!\n\nWhat would you like?', buttons: [B('📖 Menu', '/menu'), B('🕘 Hours', '/hours'), B('📅 Book a table', '/book')] },
        { trigger: '/menu', match: 'exact', reply: '📖 <b>Menu</b>\n\n🥗 Starters\n• Paneer Tikka — ₹249\n• Chicken 65 — ₹289\n\n🍛 Mains\n• Butter Chicken — ₹399\n• Dal Makhani — ₹269\n• Biryani — ₹349\n\n🍰 Desserts\n• Gulab Jamun — ₹129', buttons: [B('🥗 Starters', 'START'), B('🍛 Mains', 'MAINS'), B('🍰 Desserts', 'DESSERT')] },
        { trigger: 'START', match: 'exact', reply: '🥗 Starters\n\n• Paneer Tikka — ₹249\n• Chicken 65 — ₹289\n• Veg Spring Rolls — ₹199' },
        { trigger: 'MAINS', match: 'exact', reply: '🍛 Mains\n\n• Butter Chicken — ₹399\n• Dal Makhani — ₹269\n• Hyderabadi Biryani — ₹349\n• Veg Thali — ₹299' },
        { trigger: 'DESSERT', match: 'exact', reply: '🍰 Desserts\n\n• Gulab Jamun — ₹129\n• Rasmalai — ₹149\n• Brownie — ₹179' },
        { trigger: '/hours', match: 'exact', reply: '🕘 <b>Opening hours</b>\n\nMon–Thu: 11:00 – 23:00\nFri–Sun: 11:00 – 01:00\n\nLast order 30 minutes before closing.' },
        { trigger: '/book', match: 'exact', reply: '📅 Table reservation\n\nSend this format:\n<i>Name, date, time, guests</i>\n\ne.g. <code>Arslan, 27 Oct, 8pm, 4</code>' },
        { trigger: '', match: 'fallback', reply: '🍽️ I can show you the /menu, our /hours or take a /book.', buttons: [B('📖 Menu', '/menu'), B('📅 Book', '/book')] }
      ].map((r, i) => ({ ...r, id: `rest_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'crypto',
    defaultName: 'CryptoAlerts',
    emoji: '📈',
    name: 'Crypto Alerts',
    category: 'Finance',
    blurb: 'Price lookups and alerts with a command interface. Wire it to any free price API.',
    tags: ['finance', 'alerts', 'api'],
    build: () => ({
      emoji: '📈',
      about: 'Live crypto prices and price alerts.',
      commands: ['start', 'price', 'alert'],
      settings: { ...baseSettings, cooldown: 300 },
      rules: [
        { trigger: '/start', match: 'exact', reply: '📈 Crypto Bot ready.\n\n/price btc — spot price\n/alert btc 100000 — set an alert\n/list — your alerts', buttons: [B('📈 BTC price', '/price btc'), B('🔔 Alerts', '/list')] },
        { trigger: '/price', match: 'start', reply: '📊 <b>{args}</b>\n\nPrice: ${{random:67,412|68,905|66,731}}\n24h: <b>+{{random:1.2|2.7|0.8}}%</b>\nUpdated just now.' },
        { trigger: '/alert', match: 'start', reply: '🔔 Alert created for <b>{args}</b>.\nYou will get a message here when it triggers.' },
        { trigger: '/list', match: 'exact', reply: '🔔 <b>Your alerts</b>\n\n1. BTC above $100,000\n2. ETH below $2,000\n\nTap /clear to remove all.' },
        { trigger: '/clear', match: 'exact', reply: '🗑 All alerts removed.' },
        { trigger: '', match: 'fallback', reply: '📈 Use /price btc or /alert btc 100000.', buttons: [B('📈 Price', '/price btc')] }
      ].map((r, i) => ({ ...r, id: `crypto_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'files',
    defaultName: 'FileDrop',
    emoji: '🗂️',
    name: 'File Drop',
    category: 'Utilities',
    blurb: 'Receive files, label them and send a download link back. Great for submissions and portfolios.',
    tags: ['files', 'upload', 'utility'],
    build: () => ({
      emoji: '🗂️',
      about: 'Drop a file here and get a shareable link back.',
      commands: ['start', 'help'],
      settings: { ...baseSettings, cooldown: 0 },
      rules: [
        { trigger: '/start', match: 'exact', reply: '🗂️ <b>File Drop</b>\n\nSend any document, photo or video and I will give you a share link + reference code.\n\nMax size: 2 GB (Telegram limit).' },
        { trigger: '/help', match: 'exact', reply: '🗂️ Send a file to upload. Use /list to see your recent drops.' },
        { trigger: '/list', match: 'exact', reply: '🗂️ <b>Recent drops</b>\n\n• report.pdf — #A82K\n• logo.png — #C19M' },
        { trigger: '', match: 'fallback', reply: '📎 Send me a file and I will create a share link.', buttons: [B('🗂️ Help', '/help')] }
      ].map((r, i) => ({ ...r, id: `files_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'booking',
    defaultName: 'BookBot',
    emoji: '📅',
    name: 'Appointment Booking',
    category: 'Business',
    blurb: 'Let clients pick a slot, confirm details and receive a reminder — a full booking funnel in chat.',
    tags: ['booking', 'calendar', 'business'],
    build: () => ({
      emoji: '📅',
      about: 'Book an appointment in under 30 seconds.',
      commands: ['start', 'slots', 'book', 'cancel'],
      settings: { ...baseSettings, cooldown: 500 },
      rules: [
        { trigger: '/start', match: 'exact', reply: '📅 Hi {name}! Let\'s get you booked.\n\nChoose a slot below or type /slots to see availability.', buttons: [B('🕘 See slots', '/slots'), B('📋 My booking', '/mybooking')] },
        { trigger: '/slots', match: 'exact', reply: '🕘 <b>Available today</b>\n\n• 10:00 ✅\n• 12:30 ✅\n• 15:00 ❌ booked\n• 17:30 ✅', buttons: [B('Book 10:00', 'BOOK 10:00'), B('Book 12:30', 'BOOK 12:30'), B('Book 17:30', 'BOOK 17:30')] },
        { trigger: 'BOOK', match: 'start', reply: '✅ <b>Slot reserved: {args}</b>\n\nSend your name + phone number to confirm. You will get a reminder 1 hour before.' },
        { trigger: '/book', match: 'exact', reply: '📅 Pick a time with /slots — it takes two taps.' },
        { trigger: '/mybooking', match: 'exact', reply: '📋 <b>Your booking</b>\n\nToday at 12:30\nStatus: confirmed ✅\n\nNeed to change it? /cancel' },
        { trigger: '/cancel', match: 'exact', reply: '🗑 Your booking is cancelled. Rebook anytime with /slots.' },
        { trigger: '', match: 'fallback', reply: '📅 Use /slots to book an appointment.', buttons: [B('🕘 Slots', '/slots')] }
      ].map((r, i) => ({ ...r, id: `book_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'poll',
    defaultName: 'PollBot',
    emoji: '📊',
    name: 'Poll & Survey',
    category: 'Community',
    blurb: 'Run polls, collect votes and show live results — perfect for communities and classrooms.',
    tags: ['polls', 'survey', 'community'],
    build: () => ({
      emoji: '📊',
      about: 'Quick polls and surveys, with live results.',
      commands: ['start', 'poll', 'results'],
      settings: { ...baseSettings },
      rules: [
        { trigger: '/start', match: 'exact', reply: '📊 Poll Bot here!\n\n/vote — answer today\'s poll\n/results — see live results', buttons: [B('🗳 Vote now', '/vote')] },
        { trigger: '/vote|/poll', match: 'regex', reply: '🗳 <b>Which feature should we build next?</b>\n\n1️⃣ AI replies\n2️⃣ Payments\n3️⃣ Analytics\n4️⃣ More templates', buttons: [B('1️⃣ AI replies', 'VOTE 1'), B('2️⃣ Payments', 'VOTE 2'), B('3️⃣ Analytics', 'VOTE 3'), B('4️⃣ Templates', 'VOTE 4')] },
        { trigger: 'VOTE', match: 'start', reply: '✅ Vote recorded: <b>{args}</b>\nThanks! Results update instantly — /results' },
        { trigger: '/results', match: 'exact', reply: '📊 <b>Live results</b>\n\n1️⃣ AI replies — 46%\n2️⃣ Payments — 27%\n3️⃣ Analytics — 18%\n4️⃣ Templates — 9%\n\nTotal votes: {{random:412|530|687}}' },
        { trigger: '', match: 'fallback', reply: '📊 Type /vote to join the poll or /results to see results.', buttons: [B('🗳 Vote', '/vote')] }
      ].map((r, i) => ({ ...r, id: `poll_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  },
  {
    id: 'empty',
    defaultName: 'BlankBot',
    emoji: '📄',
    name: 'Blank Canvas',
    category: 'Essentials',
    blurb: 'Start from zero with an empty rule set. Total control, no assumptions.',
    tags: ['blank', 'advanced'],
    build: () => ({
      emoji: '📄',
      about: 'A blank bot ready for your ideas.',
      commands: ['start'],
      settings: { ...baseSettings },
      rules: [
        { trigger: '/start', match: 'exact', reply: 'Hello {name}! This bot was built with BotForge.', buttons: [] },
        { trigger: '', match: 'fallback', reply: 'I am still learning. Add more rules in BotForge!', buttons: [] }
      ].map((r, i) => ({ ...r, id: `blank_${i}`, enabled: true, buttons: r.buttons || [] }))
    })
  }
];

export const TEMPLATE_CATEGORIES = ['All', ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}

/** Build a full bot from a template + chosen identity. */
export function applyTemplate(templateId, { name = 'Nova', username = 'nova_bot', emoji } = {}) {
  const tpl = getTemplate(templateId) || getTemplate('starter');
  const built = tpl.build();
  return {
    template: tpl.id,
    name,
    username,
    emoji: emoji || built.emoji || '🤖',
    about: built.about || '',
    commands: built.commands || ['start'],
    settings: { ...baseSettings, ...(built.settings || {}) },
    rules: (built.rules && built.rules.length ? built.rules : defaultRules()).map((r, i) => ({
      ...r,
      id: r.id || `${tpl.id}_${i}`,
      enabled: r.enabled !== false,
      buttons: r.buttons || []
    }))
  };
}
