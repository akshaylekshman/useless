/* ============================================================
   THE BUTTON v2 — script.js
   Cosmic Research Initiative
   RULE: Loading ONLY changes on user click. Never automatically.
   ============================================================ */

'use strict';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
const STATE = {
  clicks:       0,     // total lifetime clicks
  pageClicks:   0,     // clicks on current page (resets each page)
  page:         1,
  moneySpent:   0,
  startTime:    Date.now(),
  loadingValue: 0,     // 0–100 float. ONLY modified by handleClick().
  payShown:     false, // payment gate is showing
  payProcessing: false,// payment modal is in processing state
  muted:        false,
  achUnlocked:  new Set(),
  lastEvtClick: 0,     // click count when last random event fired
  evtCooldown:  20,    // clicks between possible events
  secretShown:  false,
  etaIdx:       0,     // index into ETA phrase list
};

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════
const SAVE_KEY = 'btn_cosmic_v1';

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      clicks:      STATE.clicks,
      page:        STATE.page,
      moneySpent:  STATE.moneySpent,
      achUnlocked: [...STATE.achUnlocked],
      elapsed:     Date.now() - STATE.startTime,
    }));
  } catch (_) {}
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    STATE.clicks     = s.clicks     || 0;
    STATE.page       = s.page       || 1;
    STATE.moneySpent = s.moneySpent || 0;
    STATE.achUnlocked = new Set(s.achUnlocked || []);
    STATE.startTime  = Date.now() - (s.elapsed || 0);
    return true;
  } catch (_) { return false; }
}

// ═══════════════════════════════════════════════════════════════
// DOM REFS
// ═══════════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

const mainBtn       = $('mainButton');
const clickCountEl  = $('clickCount');
const msgText       = $('msgText');
const loadPercent   = $('loadPercent');
const progressFill  = $('progressFill');
const etaText       = $('etaText');
const loadEvent     = $('loadEvent');
const payGate       = $('payGate');
const pgAmount      = $('pgAmount');
const pgUnlock      = $('pgUnlock');
const pgBtn         = $('pgBtn');
const pgBtnAmt      = $('pgBtnAmt');
const pgNote        = $('pgNote');
const statClicks    = $('statClicks');
const statTime      = $('statTime');
const statPage      = $('statPage');
const statMoney     = $('statMoney');
const statRegret    = $('statRegret');
const statCpm       = $('statCpm');
const scoreNum      = $('scoreNum');
const scoreRingEl   = $('scoreRingEl');
const scoreVerdict  = $('scoreVerdict');
const pageBadge     = $('pageBadge');
const pageTitle     = $('pageTitle');
const pageSubtitle  = $('pageSubtitle');
const expResult     = $('expResult');
const expConclusion = $('expConclusion');
const achList       = $('achList');
const eventLog      = $('eventLog');
const footerTime    = $('footerTime');
const muteBtn       = $('muteBtn');
const lbBtn         = $('lbBtn');
const lbOverlay     = $('lbOverlay');
const lbClose       = $('lbClose');
const lbBody        = $('lbBody');
const payModal      = $('payModal');
const pmStage1      = $('pmStage1');
const pmStage2      = $('pmStage2');
const pmStage3      = $('pmStage3');
const pmTitle       = $('pmTitle');
const pmCurExp      = $('pmCurExp');
const pmNextExp     = $('pmNextExp');
const pmPayBtn      = $('pmPayBtn');
const pmProcFill    = $('pmProcFill');
const pmProcPct     = $('pmProcPct');
const pmProcMsg     = $('pmProcMsg');
const pmSucSub      = $('pmSucSub');
const eventModal    = $('eventModal');
const emIcon        = $('emIcon');
const emTitle       = $('emTitle');
const emBody        = $('emBody');
const emBtns        = $('emBtns');
const achToast      = $('achToast');
const atIcon        = $('atIcon');
const atTitle       = $('atTitle');
const atDesc        = $('atDesc');
const welcomeBack   = $('welcomeBack');
const wbTitle       = $('wbTitle');
const wbBody        = $('wbBody');
const wbContinue    = $('wbContinue');
const secretEnding  = $('secretEnding');
const seBack        = $('seBack');
const wormholeOverlay = $('wormholeOverlay');
const pRing1        = $('pRing1');
const pRing2        = $('pRing2');

// ═══════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════
const MSGS_EARLY = [
  "Okay.", "Noted.", "You clicked.", "Interesting.", "Processing...",
  "Acknowledged.", "Click registered.", "Signal received.", "Analyzing...",
  "Input detected.", "Click logged.", "Data point added.",
  "GRAVITATIONAL ANOMALY DETECTED.", "Never mind.",
  "Universe notified.", "Universe doesn't care.",
  "Cosmic significance: 0%.", "Humanity has achieved nothing.",
  "NASA has been informed.", "NASA declined to comment.",
  "Space-time disturbed by your click.", "Still nothing.",
];

const MSGS_MID = [
  "Again?", "Keep going.", "Still here?", "We see you.",
  "Fascinating.", "This is becoming a pattern.",
  "Your dedication is noted.", "We didn't expect this.",
  "Have you considered stopping?", "The button doesn't mind.",
  "Clicking detected. Intelligence: debatable.",
  "You could literally be doing anything else.",
  "Do you have homework?", "Your teacher would be disappointed.",
  "Have you eaten today?", "Is everything okay at home?",
  "The button says hi.", "You've achieved nothing so far. Keep it up.",
  "Congratulations. You accomplished nothing.",
  "WORMHOLE INSTABILITY DETECTED.", "It was nothing.",
  "The cosmos have been notified. They don't care.",
  "Space-time: still stable. Barely.",
  "Black hole says hello.", "The black hole doesn't actually say anything.",
];

const MSGS_LATE = [
  "Why are you doing this?", "This is becoming concerning.",
  "You have committed to this.", "There is literally nothing here.",
  "The button is getting tired.", "This is your life now.",
  "The button knows what you did.", "Please stop.", "I said please.",
  "Fine. Keep clicking.", "Why?", "Seriously?",
  "Are you sure this is how you want to spend your time?",
  "The researchers are concerned about you.",
  "We've filed a report on your behavior.",
  "The button is filing a restraining order.",
  "We've contacted your family.", "You monster.",
  "Still going? Respect.", "At this point it's personal.",
  "The button remembers everything.",
  "ANALYZING HUMAN CLICKING BEHAVIOR...", "CONCLUSION: QUESTIONABLE.",
  "The galaxy has noted your contribution. It was not helpful.",
  "Multiple black holes have observed your session.", "They are disappointed.",
  "You did it again.", "We put a warning label on you.",
];

const MSGS_EXTREME = [
  "We've run out of things to say.", "This is unprecedented.",
  "The researchers have gone home.", "Only you and the button remain.",
  "The button has accepted its fate.", "You have transcended clicking.",
  "Clicking is now your personality.", "History books will not mention this.",
  "The button salutes your pointless dedication.",
  "At this point, the button IS you.", "You are the button now.",
  "The button quit. You didn't.",
  "We're legally required to tell you: this doesn't do anything.",
  "Certified brainworm achieved.",
  "You could have learned a skill. You didn't.",
  "Legend. Absolutely unhinged legend.",
  "COSMIC SIGNIFICANCE: STILL 0%.", "The universe has noted: still nothing.",
  "Even the black hole is confused.", "You have broken physics. Somehow.",
];

const MILESTONE_MSGS = {
  1:      "Welcome. Your mistake begins now.",
  5:      "Five clicks. Still nothing.",
  10:     "Okay, we get it. You can click.",
  25:     "You're still clicking. Interesting.",
  50:     "50 activations. You are committed.",
  100:    "100 activations. This is impressive. Also concerning.",
  200:    "200 activations. The researchers are taking notes.",
  500:    "500 activations. Do you have nothing else to do?",
  750:    "750. We've notified your family.",
  1000:   "1,000 activations. Seriously?",
  2500:   "2,500. The cosmos is baffled.",
  5000:   "5,000. This is no longer a game.",
  10000:  "10,000. This is a lifestyle.",
  25000:  "25,000. You are the button now.",
};

const PAGE_ARRIVAL = [
  "Nothing awaits you here.", "Same thing. Different page.",
  "You paid for this. Incredible.", "The button is pleased.",
  "Another page, another disappointment.", "You really did it. Wow.",
  "Financially questionable. Emotionally understandable.",
  "History will not remember this.", "The button salutes you.",
  "New page. Same energy. Zero purpose.",
  "You've come so far. For so little.",
  "The loading bar is ready to disappoint you again.",
  "Nothing here either. But you already knew that.",
  "We could put something useful here. We chose not to.",
  "The universe expanded. You didn't notice. You were clicking.",
];

const ETA_PHRASES = [
  "3 seconds", "3 seconds", "1 second", "almost done",
  "3 seconds", "0.000001 seconds", "2 minutes (sorry)", "soon™",
  "unknown", "calculating...", "3 seconds", "negative 4 seconds (???)",
  "a moment", "please hold", "3 seconds", "∞", "error: time not found",
  "yes", "heat death of universe", "3 seconds",
];

function getMsg() {
  const c = STATE.clicks;
  let pool;
  if (c <= 5)   pool = MSGS_EARLY;
  else if (c <= 40)  pool = [...MSGS_EARLY, ...MSGS_MID];
  else if (c <= 200) pool = [...MSGS_MID, ...MSGS_LATE];
  else pool = [...MSGS_LATE, ...MSGS_EXTREME];
  return pool[Math.floor(Math.random() * pool.length)];
}

function showMsg(text) {
  msgText.classList.remove('show');
  setTimeout(() => {
    msgText.textContent = text;
    msgText.classList.add('show');
  }, 60);
}

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════
const ACHIEVEMENTS = [
  { id: 'first',   icon: '🏆', name: 'FIRST MISTAKE',       desc: 'Click the button for the first time.',   check: () => STATE.clicks >= 1 },
  { id: 'ten',     icon: '👆', name: 'WARM UP',              desc: 'Click 10 times.',                        check: () => STATE.clicks >= 10 },
  { id: 'c100',    icon: '💯', name: 'KEEP GOING',           desc: 'Click 100 times.',                       check: () => STATE.clicks >= 100 },
  { id: 'c1k',     icon: '😶', name: 'NO LIFE',              desc: 'Click 1,000 times.',                     check: () => STATE.clicks >= 1000 },
  { id: 'c10k',    icon: '🤯', name: 'WHY?',                 desc: 'Click 10,000 times.',                    check: () => STATE.clicks >= 10000 },
  { id: 'pay1',    icon: '💸', name: 'FINANCIAL MISTAKE',    desc: 'Pay ₹1. For nothing.',                   check: () => STATE.moneySpent >= 1 },
  { id: 'pay10',   icon: '📉', name: 'BAD DECISION',         desc: 'Pay ₹10 total.',                         check: () => STATE.moneySpent >= 10 },
  { id: 'pay55',   icon: '🔥', name: 'FINANCIAL DISASTER',   desc: 'Pay ₹55 total.',                         check: () => STATE.moneySpent >= 55 },
  { id: 'pay100',  icon: '💀', name: 'BEYOND REASON',        desc: 'Pay ₹100 total.',                        check: () => STATE.moneySpent >= 100 },
  { id: 'page5',   icon: '📄', name: 'STILL HERE',           desc: 'Reach Page 5.',                          check: () => STATE.page >= 5 },
  { id: 'page10',  icon: '🚀', name: "THERE'S NO GOING BACK",desc: 'Reach Page 10.',                         check: () => STATE.page >= 10 },
  { id: 'page25',  icon: '🌀', name: 'DEEP IN THE VOID',     desc: 'Reach Page 25.',                         check: () => STATE.page >= 25 },
  { id: 'page50',  icon: '👑', name: 'THE FINAL IDIOT',      desc: 'Reach Page 50.',                         check: () => STATE.page >= 50 },
  { id: 'page100', icon: '🌌', name: 'ASCENDED',             desc: 'Reach Page 100. Secret unlocked.',       check: () => STATE.page >= 100 },
  { id: 'speed',   icon: '⚡', name: 'SPEED RUNNER',         desc: 'Click 20 times in under 15 seconds.',    check: () => STATE.clicks >= 20 && (Date.now() - STATE.startTime) < 15000 },
  { id: 'patient', icon: '🧘', name: 'PATIENCE',             desc: 'Spend 10 minutes here.',                 check: () => (Date.now() - STATE.startTime) > 600000 },
];

function renderAchievements() {
  achList.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const el = document.createElement('div');
    el.className = 'ach-item' + (STATE.achUnlocked.has(a.id) ? ' unlocked' : '');
    el.id = 'ach-' + a.id;
    el.innerHTML = `
      <span class="ach-icon">${a.icon}</span>
      <span>
        <span class="ach-name">${a.name}</span>
        <span class="ach-desc">${a.desc}</span>
      </span>`;
    achList.appendChild(el);
  });
}

function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (STATE.achUnlocked.has(a.id)) return;
    if (!a.check()) return;
    STATE.achUnlocked.add(a.id);
    const el = document.getElementById('ach-' + a.id);
    if (el) el.classList.add('unlocked');
    showAchToast(a);
    if (a.id === 'page100' && !STATE.secretShown) {
      setTimeout(triggerSecretEnding, 3000);
    }
  });
}

function showAchToast(a) {
  atIcon.textContent  = a.icon;
  atTitle.textContent = a.name;
  atDesc.textContent  = a.desc;
  achToast.classList.add('show');
  playSound('achievement');
  setTimeout(() => achToast.classList.remove('show'), 3800);
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════
const FAKE_LB = [
  { name: 'Rahul_2024',   page: 47, clicks: 18432, money: 1128 },
  { name: 'Akshay',       page: 32, clicks: 12045, money: 528  },
  { name: 'Adithya_K',    page: 28, clicks:  9821, money: 406  },
  { name: 'Sneha_M',      page: 21, clicks:  7340, money: 231  },
  { name: 'ButtonFan99',  page: 19, clicks:  6250, money: 190  },
  { name: 'ClickMaster',  page: 15, clicks:  5100, money: 120  },
  { name: 'WhydoIdothis', page: 12, clicks:  4300, money: 78   },
  { name: 'Curious_Cat',  page:  6, clicks:  1920, money: 21   },
  { name: 'FirstTimer',   page:  2, clicks:   340, money:  1   },
];

function renderLeaderboard() {
  const entries = [...FAKE_LB];
  const me = { name: 'YOU (right now)', page: STATE.page, clicks: STATE.clicks, money: STATE.moneySpent, me: true };
  let inserted = false;
  for (let i = 0; i < entries.length; i++) {
    if (me.page > entries[i].page || (me.page === entries[i].page && me.clicks > entries[i].clicks)) {
      entries.splice(i, 0, me);
      inserted = true;
      break;
    }
  }
  if (!inserted) entries.push(me);

  lbBody.innerHTML = '';
  const medals = ['🥇','🥈','🥉'];
  const rowCls  = ['gold','silver','bronze'];
  entries.slice(0, 12).forEach((e, i) => {
    const tr = document.createElement('tr');
    if (i < 3) tr.className = rowCls[i];
    if (e.me)  tr.className = 'me';
    const rank = i < 3 ? medals[i] : (i + 1) + '.';
    const name = e.me ? `<strong>${e.name}</strong>` : e.name;
    tr.innerHTML = `<td>${rank}</td><td>${name}</td><td>${e.page}</td><td>${e.clicks.toLocaleString()}</td><td>₹${e.money}</td>`;
    lbBody.appendChild(tr);
  });
}

// ═══════════════════════════════════════════════════════════════
// SOUND (Web Audio API — no external files)
// ═══════════════════════════════════════════════════════════════
let audioCtx = null;
function getACtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(_) {}
  }
  return audioCtx;
}

function playSound(type) {
  if (STATE.muted) return;
  const ctx = getACtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const mk = (type, freq, gainVal, dur) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(gainVal, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.start(now); o.stop(now + dur);
    };

    if (type === 'click') {
      mk('sine', 440, 0.1, 0.07);
    } else if (type === 'achievement') {
      [523,659,784,1047].forEach((f,i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        o.connect(g); g.connect(ctx.destination);
        const t = now + i * 0.09;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.15, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.start(t); o.stop(t + 0.18);
      });
    } else if (type === 'error') {
      mk('sawtooth', 160, 0.1, 0.3);
    } else if (type === 'unlock') {
      [262,330,392,523,659,784,1047].forEach((f,i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        o.connect(g); g.connect(ctx.destination);
        const t = now + i * 0.07;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.16, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.start(t); o.stop(t + 0.22);
      });
    } else if (type === 'pay') {
      [880,1100,1320].forEach((f,i) => mk('square', f, 0.07, 0.12 + i * 0.06));
    }
  } catch(_) {}
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ' + (s % 60) + 's';
  return Math.floor(m/60) + 'h ' + (m%60) + 'm';
}
function fmtTimeFull(ms) {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60]
    .map(n => String(n).padStart(2,'0')).join(':');
}

// Format loading percentage — more decimal places as we approach 100%
function fmtPct(v) {
  if (v <= 0)  return '0%';
  if (v >= 100) return '100.0000%';
  if (v < 90)   return v.toFixed(1) + '%';
  if (v < 99)   return v.toFixed(2) + '%';
  if (v < 99.9) return v.toFixed(3) + '%';
  if (v < 99.99)    return v.toFixed(4) + '%';
  if (v < 99.999)   return v.toFixed(5) + '%';
  if (v < 99.9999)  return v.toFixed(6) + '%';
  if (v < 99.99999) return v.toFixed(7) + '%';
  if (v < 99.999999)return v.toFixed(8) + '%';
  return v.toFixed(9) + '%';
}

// Map loading value to progress bar width (never visually shows 100%)
function barWidth(v) {
  if (v >= 100) return '100%';
  return (Math.min(v, 99.999) / 99.999 * 99.9).toFixed(3) + '%';
}

function addLog(msg, type = '') {
  const t = fmtTimeFull(Date.now() - STATE.startTime);
  const el = document.createElement('div');
  el.className = 'evt-entry' + (type ? ' ' + type : '');
  el.innerHTML = `<span class="et">${t}</span>${msg}`;
  eventLog.insertBefore(el, eventLog.firstChild);
  while (eventLog.children.length > 40) eventLog.removeChild(eventLog.lastChild);
}

// ═══════════════════════════════════════════════════════════════
// SPACE CANVAS (purely visual — NEVER touches STATE.loadingValue)
// ═══════════════════════════════════════════════════════════════
const Space = (() => {
  const canvas = $('spaceCanvas');
  const ctx    = canvas.getContext('2d');

  let W = 0, H = 0;
  let mx = 0.5, my = 0.5;   // smoothed mouse (0-1)
  let tmx = 0.5, tmy = 0.5; // target mouse

  // Stars
  const STAR_COUNT = 350;
  const stars = [];

  // BH orbit particles
  const BH_PARTICLE_COUNT = 100;
  const bhParts = [];
  let bhRot = 0;

  // Click pulse rings
  const pulses = [];

  // Wormhole angle
  let whAngle = 0;

  // Small planets
  const planets = [
    { rx: 0.08, ry: 0.22, r: 14, color: '#1a3060', speed: 0.00018 },
    { rx: 0.82, ry: 0.12, r: 9,  color: '#3a1055', speed:-0.00013 },
    { rx: 0.88, ry: 0.75, r: 22, color: '#0a2840', speed: 0.00010, ring: true },
    { rx: 0.12, ry: 0.65, r: 7,  color: '#250a40', speed:-0.00020 },
  ];
  const planetAngles = planets.map(() => Math.random() * Math.PI * 2);

  // Comet
  const comet = { x: -0.2, y: 0.3, dx: 0.0004, dy: 0.00008, tail: 60 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 1.6 + 0.2,
        a: Math.random() * 0.5 + 0.2,
        layer: Math.floor(Math.random() * 3),
        tw: Math.random() * Math.PI * 2,
        twS: Math.random() * 0.025 + 0.005,
      });
    }
  }

  function initBHParts() {
    bhParts.length = 0;
    for (let i = 0; i < BH_PARTICLE_COUNT; i++) {
      const orb = 90 + Math.random() * 220;
      bhParts.push({
        angle: Math.random() * Math.PI * 2,
        orbR: orb,
        orbRy: orb * (0.25 + Math.random() * 0.15),
        speed: (0.006 / Math.sqrt(orb / 90)) * (Math.random() < 0.5 ? 1 : -1),
        size: Math.random() * 2 + 0.4,
        alpha: Math.random() * 0.7 + 0.15,
        hue: 25 + Math.random() * 50,
      });
    }
  }

  function addClickPulse(x, y) {
    pulses.push({ x, y, r: 0, age: 0 });
  }

  function getBH() {
    return {
      x: W * 0.65 + (mx - 0.5) * -25,
      y: H * 0.40 + (my - 0.5) * -18,
      r: Math.min(W, H) * 0.07,
    };
  }

  function draw(ts) {
    // Smooth mouse
    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;
    bhRot += 0.004;
    whAngle += 0.006;

    ctx.clearRect(0, 0, W, H);

    // Deep space background
    const bg = ctx.createRadialGradient(W * 0.6, H * 0.38, 0, W * 0.5, H * 0.5, W * 0.9);
    bg.addColorStop(0,   '#08052a');
    bg.addColorStop(0.4, '#040218');
    bg.addColorStop(1,   '#010008');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawStars(0, 0.008);
    drawWormhole();
    drawPlanets();
    drawBHGlow();
    drawBHParticles('back');
    drawBlackHole();
    drawBHParticles('front');
    drawStars(1, 0.022);
    drawStars(2, 0.048);
    drawComet();
    drawPulses();

    requestAnimationFrame(draw);
  }

  function drawStars(layer, parallax) {
    const ox = (mx - 0.5) * W * parallax;
    const oy = (my - 0.5) * H * parallax;
    stars.filter(s => s.layer === layer).forEach(s => {
      s.tw += s.twS;
      const tw = 0.65 + Math.sin(s.tw) * 0.35;
      const x = ((s.x * W + ox) % W + W) % W;
      const y = ((s.y * H + oy) % H + H) % H;
      ctx.beginPath();
      ctx.arc(x, y, s.r * tw, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,235,255,${s.a * tw})`;
      if (s.r > 1.2 && layer === 2) {
        ctx.shadowBlur  = 5;
        ctx.shadowColor = 'rgba(180,210,255,0.8)';
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function drawWormhole() {
    const wx = W * 0.13 + (mx - 0.5) * -12;
    const wy = H * 0.77 + (my - 0.5) * -8;
    // Concentric rings giving tunnel perspective
    for (let i = 9; i >= 0; i--) {
      const scale = (i + 1) / 10;
      const rr = scale * 65;
      const ry = scale * 28;
      const alpha = (10 - i) / 10 * 0.28;
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(whAngle + i * 0.08);
      ctx.beginPath();
      ctx.ellipse(0, 0, rr, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(80,180,255,${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
    // Central glow
    const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, 70);
    wg.addColorStop(0, 'rgba(0,140,255,0.14)');
    wg.addColorStop(1, 'transparent');
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.arc(wx, wy, 70, 0, Math.PI * 2); ctx.fill();
  }

  function drawPlanets() {
    planets.forEach((p, i) => {
      planetAngles[i] += p.speed;
      const px = W * p.rx + (mx - 0.5) * -28 + Math.sin(planetAngles[i]) * 6;
      const py = H * p.ry + (my - 0.5) * -20 + Math.cos(planetAngles[i]) * 4;
      // Body
      const gr = ctx.createRadialGradient(px - p.r * 0.3, py - p.r * 0.3, 0, px, py, p.r);
      gr.addColorStop(0, 'rgba(120,160,220,0.5)');
      gr.addColorStop(1, p.color + 'aa');
      ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = gr; ctx.fill();
      // Ring (for large planet)
      if (p.ring) {
        ctx.save();
        ctx.translate(px, py); ctx.rotate(0.35); ctx.scale(1, 0.28);
        ctx.beginPath(); ctx.arc(0, 0, p.r * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100,160,220,0.28)'; ctx.lineWidth = 5;
        ctx.stroke(); ctx.restore();
      }
    });
  }

  function drawBHGlow() {
    const bh = getBH();
    const R = bh.r;
    const og = ctx.createRadialGradient(bh.x, bh.y, R, bh.x, bh.y, R * 5.5);
    og.addColorStop(0,   'rgba(30,80,180,0.18)');
    og.addColorStop(0.4, 'rgba(10,40,120,0.06)');
    og.addColorStop(1,   'transparent');
    ctx.fillStyle = og;
    ctx.beginPath(); ctx.arc(bh.x, bh.y, R * 5.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawBlackHole() {
    const bh = getBH();
    const R = bh.r;

    // Accretion disk (multiple rotated layers)
    ctx.save();
    ctx.translate(bh.x, bh.y);
    ctx.rotate(bhRot * 0.25);
    for (let i = 0; i < 4; i++) {
      const dr = R * (1.45 + i * 0.35);
      const dry = dr * 0.18;
      const dg = ctx.createLinearGradient(-dr, 0, dr, 0);
      dg.addColorStop(0,   'transparent');
      dg.addColorStop(0.28, `rgba(255,${130+i*18},${i*12},${0.45-i*0.08})`);
      dg.addColorStop(0.5,  `rgba(255,${200+i*8},${40+i*25},${0.65-i*0.12})`);
      dg.addColorStop(0.72, `rgba(255,${130+i*18},${i*12},${0.45-i*0.08})`);
      dg.addColorStop(1,   'transparent');
      ctx.beginPath(); ctx.ellipse(0, 0, dr, dry, 0, 0, Math.PI * 2);
      ctx.fillStyle = dg; ctx.fill();
    }
    ctx.restore();

    // Erase event horizon (solid black over the disk center)
    const shadow = ctx.createRadialGradient(bh.x - R*0.28, bh.y - R*0.28, 0, bh.x, bh.y, R);
    shadow.addColorStop(0, '#07041a');
    shadow.addColorStop(1, '#000000');
    ctx.beginPath(); ctx.arc(bh.x, bh.y, R, 0, Math.PI * 2);
    ctx.fillStyle = shadow; ctx.fill();

    // Photon ring
    ctx.beginPath(); ctx.arc(bh.x, bh.y, R + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,210,80,0.7)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(255,190,50,0.9)';
    ctx.stroke(); ctx.shadowBlur = 0;
  }

  function drawBHParticles(side) {
    const bh = getBH();
    const R  = bh.r;
    bhParts.forEach(p => {
      p.angle += p.speed;
      const px = bh.x + Math.cos(p.angle) * p.orbR;
      const py = bh.y + Math.sin(p.angle) * p.orbRy;
      const isFront = Math.sin(p.angle) > 0;
      if ((side === 'front') !== isFront) return;
      const dist = Math.hypot(px - bh.x, py - bh.y);
      if (dist < R + 2) return;
      const fade = Math.min(1, (dist - R) / 22);
      ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},80%,65%,${p.alpha * fade})`;
      ctx.fill();
    });
  }

  function drawComet() {
    comet.x += comet.dx;
    comet.y += comet.dy;
    if (comet.x > 1.3) { comet.x = -0.2; comet.y = Math.random() * 0.8; }
    const cx = comet.x * W;
    const cy = comet.y * H;
    // Tail
    const tg = ctx.createLinearGradient(cx - comet.tail, cy, cx, cy);
    tg.addColorStop(0, 'transparent');
    tg.addColorStop(1, 'rgba(200,230,255,0.6)');
    ctx.beginPath();
    ctx.moveTo(cx - comet.tail, cy); ctx.lineTo(cx, cy);
    ctx.strokeStyle = tg; ctx.lineWidth = 1.5; ctx.stroke();
    // Head
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,240,255,0.9)'; ctx.fill();
  }

  function drawPulses() {
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.r   += 4;
      p.age += 1;
      const alpha = Math.max(0, 1 - p.age / 30);
      if (alpha <= 0) { pulses.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,200,255,${alpha * 0.35})`;
      ctx.lineWidth = 2; ctx.stroke();
    }
  }

  return {
    init() {
      resize();
      initStars();
      initBHParts();
      window.addEventListener('resize', resize);
      document.addEventListener('mousemove', e => {
        tmx = e.clientX / window.innerWidth;
        tmy = e.clientY / window.innerHeight;
      });
      requestAnimationFrame(draw);
    },
    pulse(x, y) { addClickPulse(x, y); },
  };
})();

// ═══════════════════════════════════════════════════════════════
// LOADING SYSTEM — CLICK DRIVEN ONLY
// Loading value ONLY changes inside applyClickToLoading().
// No setInterval, no setTimeout progression, no RAF touching loadingValue.
// ═══════════════════════════════════════════════════════════════

// How much loading to add per click at a given value
// Tuned so payment gate appears in ~20 clicks
function getIncrement(v) {
  if (v < 85) {
    // Fast phase — very big jumps, reaches 85% in ~7-8 clicks
    return 10 + Math.random() * 7;
  }
  // Slow phase — gap-based, asymptotic approach
  const cap = 99.99;
  const gap = cap - v;
  let factor;
  if (v < 95)       factor = 0.70;  // reaches 95% in ~2 clicks
  else if (v < 99)  factor = 0.58;  // reaches 99% in ~3 clicks
  else if (v < 99.9)  factor = 0.48; // reaches 99.9% in ~4 clicks
  else if (v < 99.99) factor = 0.38; // reaches 99.99% in ~5 clicks
  else                factor = 0.28;
  return Math.max(gap * factor * (0.8 + Math.random() * 0.4), 1e-10);
}

const PAYMENT_THRESHOLD = 99.99; // Payment gate appears after ~20 clicks

function applyClickToLoading() {
  if (STATE.payShown) return;

  const v = STATE.loadingValue;

  // ── GUARANTEED TRIGGER: after 20 page clicks, force payment gate no matter what ──
  if (STATE.pageClicks >= 20 && !STATE.payShown) {
    STATE.payShown   = true;
    STATE.loadingValue = 99.99;
    updateLoadUI();
    showPayGate();
    return;
  }

  // Backwards regression — only when below 90% to avoid blocking payment
  if (Math.random() < 0.05 && v > 45 && v < 90) {
    const bigDrop = Math.random() < 0.2;
    const drop = bigDrop
      ? Math.random() * 2.5 + 0.5
      : Math.random() * 0.008 + 0.001;
    STATE.loadingValue = Math.max(0, v - drop);
    loadPercent.classList.add('backwards');
    loadEvent.textContent = bigDrop ? '⚠ CRITICAL SETBACK.' : '⚠ Minor complication.';
    playSound('error');
    addLog(bigDrop ? 'CRITICAL: Loading regressed by ' + drop.toFixed(3) + '%.' : 'Complication: small regression.', 'error');
    setTimeout(() => {
      loadPercent.classList.remove('backwards');
      loadEvent.textContent = bigDrop ? '✓ Issue resolved. Probably.' : '✓ Continuing...';
      setTimeout(() => { loadEvent.textContent = ''; }, 2500);
    }, 1800);
    updateLoadUI();
    return;
  }

  // Normal increment
  const inc = getIncrement(v);
  STATE.loadingValue = Math.min(v + inc, PAYMENT_THRESHOLD);
  updateLoadUI();

  // Check if payment threshold reached via value
  if (STATE.loadingValue >= PAYMENT_THRESHOLD && !STATE.payShown) {
    STATE.payShown = true;
    STATE.loadingValue = PAYMENT_THRESHOLD;
    updateLoadUI();
    showPayGate();
  }

  // Update ETA every 5 clicks
  if (STATE.pageClicks % 5 === 0) {
    const phrase = ETA_PHRASES[STATE.etaIdx % ETA_PHRASES.length];
    STATE.etaIdx++;
    etaText.textContent = 'ETA: ' + phrase;
  }

}

function updateLoadUI() {
  const v = STATE.loadingValue;
  loadPercent.textContent = fmtPct(v);
  progressFill.style.width = barWidth(v);
}

function resetLoading() {
  STATE.loadingValue = 0;
  STATE.payShown     = false;
  STATE.pageClicks   = 0;
  loadPercent.textContent = '0%';
  loadPercent.classList.remove('backwards');
  progressFill.style.width = '0%';
  loadEvent.textContent = '';
  etaText.textContent = 'ETA: Click the button to begin.';
  payGate.classList.remove('open');
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT GATE (the unmissable panel)
// ═══════════════════════════════════════════════════════════════
function showPayGate() {
  const p = STATE.page;
  pgAmount.textContent  = p;
  pgUnlock.textContent  = `UNLOCKS PAGE ${p + 1}`;
  pgBtnAmt.textContent  = p;
  pgNote.textContent    = `You are voluntarily paying ₹${p} to unlock another completely useless page. The humor is intentional.`;
  payGate.classList.add('open');
  payGate.scrollIntoView({ behavior: 'smooth', block: 'center' });
  addLog(`Payment required: ₹${p} to unlock Page ${p + 1}.`, 'warn');
  showMsg(`Loading reached its limit. Pay ₹${p} to continue. (Why?)`);
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT MODAL — 6-second auto-process
// ═══════════════════════════════════════════════════════════════
function openPayModal() {
  const p = STATE.page;
  pmTitle.textContent   = `ACCESS FEE: ₹${p}`;
  pmCurExp.textContent  = String(p).padStart(3, '0');
  pmNextExp.textContent = String(p + 1).padStart(3, '0');
  pmSucSub.textContent  = `ACCESS TO PAGE ${p + 1} GRANTED`;

  // Reset to stage 1
  pmStage1.classList.remove('hidden');
  pmStage2.classList.add('hidden');
  pmStage3.classList.add('hidden');

  payModal.classList.add('open');
  STATE.payProcessing = false;
}

function startPayProcessing() {
  if (STATE.payProcessing) return;
  STATE.payProcessing = true;

  pmStage1.classList.add('hidden');
  pmStage2.classList.remove('hidden');
  pmStage3.classList.add('hidden');

  const DURATION = 6000; // 6 seconds
  const startTs  = performance.now();

  const PROC_MSGS = [
    'Verifying with quantum ledger...',
    'Cross-referencing spacetime transactions...',
    'Pinging cosmic payment servers...',
    'Calculating meaninglessness of this transaction...',
    'Consulting the black hole...',
    'Almost there, we think...',
    'Finalizing cosmic authorization...',
  ];
  let msgIdx = 0;
  let lastSec = 0;

  function tick(now) {
    const elapsed  = now - startTs;
    const progress = Math.min(elapsed / DURATION, 1);

    pmProcFill.style.width  = (progress * 100).toFixed(1) + '%';
    pmProcPct.textContent   = Math.floor(progress * 100) + '%';

    const curSec = Math.floor(elapsed / 900);
    if (curSec !== lastSec && msgIdx < PROC_MSGS.length - 1) {
      lastSec = curSec;
      msgIdx++;
      pmProcMsg.textContent = PROC_MSGS[msgIdx];
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Show success
      pmStage2.classList.add('hidden');
      pmStage3.classList.remove('hidden');
      playSound('pay');

      setTimeout(() => {
        payModal.classList.remove('open');
        confirmPayment();
      }, 1800);
    }
  }

  requestAnimationFrame(tick);
}

function confirmPayment() {
  const p = STATE.page;
  STATE.moneySpent += p;
  STATE.payProcessing = false;

  // Instantly show 100%
  STATE.loadingValue = 100;
  loadPercent.textContent  = '100.0000%';
  loadPercent.style.color  = 'var(--green)';
  progressFill.style.width = '100%';
  loadEvent.textContent    = '✓ AUTHORIZATION COMPLETE.';

  playSound('unlock');
  addLog(`Payment confirmed: ₹${p}. Total spent: ₹${STATE.moneySpent}.`, 'success');
  showMsg(`₹${p} authorized. Loading complete. Initiating cosmic transition...`);

  setTimeout(() => triggerPageTransition(), 1200);
}

// ═══════════════════════════════════════════════════════════════
// PAGE TRANSITION (wormhole flash)
// ═══════════════════════════════════════════════════════════════
function triggerPageTransition() {
  wormholeOverlay.classList.add('flash');

  setTimeout(() => {
    advancePage();
  }, 600); // Swap content at peak of flash

  setTimeout(() => {
    wormholeOverlay.classList.remove('flash');
  }, 1900);
}

function advancePage() {
  STATE.page++;
  saveState();
  checkAchievements();
  resetLoading();

  const comment = PAGE_ARRIVAL[Math.floor(Math.random() * PAGE_ARRIVAL.length)];
  pageTitle.textContent    = 'PAGE ' + STATE.page;
  pageSubtitle.textContent = comment;
  pageBadge.textContent    = 'PAGE ' + STATE.page;
  loadPercent.style.color  = '';
  updateUI();
  addLog(`Entered Page ${STATE.page}. Total spent: ₹${STATE.moneySpent}.`, 'success');

  // ★ DRAMATIC LEVEL-UP OVERLAY — impossible to miss ★
  const lu     = document.getElementById('levelUpOverlay');
  const luPage = document.getElementById('luPage');
  const luSub  = document.getElementById('luSub');
  if (lu) {
    luPage.textContent = 'PAGE ' + STATE.page + ' UNLOCKED';
    luSub.textContent  = `You paid ₹${STATE.moneySpent} total. For absolutely nothing.`;
    lu.classList.add('show');
    setTimeout(() => {
      lu.classList.remove('show');
      // Money commentary after overlay fades
      if (STATE.moneySpent >= 100) showMsg(`₹100 spent. You could have bought something. You didn't.`);
      else if (STATE.moneySpent >= 55) showMsg(`₹55 spent. The researchers are speechless.`);
      else if (STATE.moneySpent >= 10) showMsg(`₹10 total. Interesting financial decision.`);
      else showMsg(`₹${STATE.moneySpent} spent so far. For nothing. Enjoy Page ${STATE.page}.`);
    }, 3000); // Show for 3 seconds
  }
}


// ═══════════════════════════════════════════════════════════════
// RANDOM EVENTS
// ═══════════════════════════════════════════════════════════════
let evtModalOpen = false;
let evtLastClose = 0;

const EVENTS = [
  {
    icon: '🚨', title: 'BUTTON EMERGENCY',
    body: 'An unexpected situation has occurred.\nStand by for further instructions.',
    auto: (close) => setTimeout(() => {
      emBody.textContent = 'Never mind. The button is fine.';
      emBtns.innerHTML = '<button class="em-btn" id="evtOk2">OK</button>';
      $('evtOk2').onclick = close;
    }, 2200),
  },
  {
    icon: '🔬', title: 'BEHAVIORAL ANALYSIS',
    body: 'Analyzing your clicking behavior...\n\nPlease wait.',
    auto: (close) => setTimeout(() => {
      emBody.innerHTML = 'Analysis complete.<br><br><strong style="color:var(--cyan)">Conclusion: Deeply questionable.</strong>';
      emBtns.innerHTML = '<button class="em-btn" id="evtOk2">I accept my results</button>';
      $('evtOk2').onclick = close;
    }, 2500),
  },
  {
    icon: '🎉', title: 'YOU WON!',
    body: 'Congratulations! You have won something!',
    auto: (close) => setTimeout(() => {
      emBody.innerHTML = 'Prize: <strong style="color:var(--red)">Nothing.</strong><br>Better luck next time.';
      emBtns.innerHTML = '<button class="em-btn" id="evtOk2">Oh.</button>';
      $('evtOk2').onclick = close;
    }, 1600),
  },
  {
    icon: '❓', title: 'CONFIRMATION REQUIRED',
    body: 'Are you sure you want to continue?',
    btns: [
      { label: 'YES', fn: (close) => {
        emBody.innerHTML = '<strong style="color:var(--red)">Wrong answer.</strong>';
        emBtns.innerHTML = '<button class="em-btn" id="evtOk2">...</button>';
        $('evtOk2').onclick = close;
      }},
      { label: 'NO', fn: (close) => {
        emBody.innerHTML = '<strong style="color:var(--red)">Also wrong.</strong>';
        emBtns.innerHTML = '<button class="em-btn" id="evtOk2">Both were wrong?</button>';
        $('evtOk2').onclick = close;
      }},
    ],
  },
  {
    icon: '🔄', title: 'UPDATE AVAILABLE',
    body: 'A new update is available.\n\nChangelog:\n• Still does nothing.\n• Now does nothing 12% faster.',
    btns: [{ label: 'Install', fn: (close) => {
      emBody.textContent = 'Installing...\n\nDone. Nothing has changed.';
      emBtns.innerHTML = '<button class="em-btn" id="evtOk2">Great.</button>';
      $('evtOk2').onclick = close;
    }}],
  },
  {
    icon: '🕳️', title: 'WORMHOLE DETECTED',
    body: 'A wormhole has been detected nearby.\n\nDestination: Unknown.\nPurpose: Unknown.\nSafety: Debatable.',
    btns: [{ label: 'Interesting.', fn: (close) => close() }],
  },
  {
    icon: '📋', title: 'PROGRESS REPORT',
    body: () => `Subject: ${STATE.clicks.toLocaleString()} clicks.\nMoney wasted: ₹${STATE.moneySpent}.\nPages: ${STATE.page - 1} completed.\n\nConclusion: No comment.`,
    btns: [{ label: 'Noted.', fn: (close) => close() }],
  },
  {
    icon: '🤔', title: 'PHILOSOPHICAL MOMENT',
    body: 'If a button is clicked\nand nothing happens...\ndoes it make a sound?\n\n...\n\nNo.',
    btns: [{ label: 'Deep.', fn: (close) => close() }],
  },
];

function maybeShowEvent() {
  if (evtModalOpen) return;
  if (Date.now() - evtLastClose < 5000) return;
  if (STATE.clicks - STATE.lastEvtClick < STATE.evtCooldown) return;
  if (Math.random() > 0.20) return;
  if (STATE.payShown) return;

  const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  showEvent(evt);
}

function showEvent(evt) {
  evtModalOpen = true;
  STATE.lastEvtClick = STATE.clicks;

  emIcon.textContent = evt.icon;
  emTitle.textContent = evt.title;
  const body = typeof evt.body === 'function' ? evt.body() : evt.body;
  emBody.textContent = body;
  emBtns.innerHTML = '';

  const close = () => {
    evtModalOpen = false;
    evtLastClose = Date.now();
    eventModal.classList.remove('open');
  };

  if (evt.auto) {
    const okBtn = document.createElement('button');
    okBtn.className = 'em-btn'; okBtn.textContent = '...'; okBtn.disabled = true;
    emBtns.appendChild(okBtn);
    evt.auto(close);
  } else if (evt.btns) {
    evt.btns.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'em-btn'; btn.textContent = b.label;
      btn.onclick = () => b.fn(close);
      emBtns.appendChild(btn);
    });
  } else {
    const btn = document.createElement('button');
    btn.className = 'em-btn'; btn.textContent = 'OK';
    btn.onclick = close;
    emBtns.appendChild(btn);
  }

  eventModal.classList.add('open');
  addLog('Event: ' + evt.title, 'warn');
}

// ═══════════════════════════════════════════════════════════════
// MAIN CLICK HANDLER
// ═══════════════════════════════════════════════════════════════
function handleClick(e) {
  // Don't register clicks if payment modal is processing
  if (STATE.payProcessing) return;

  STATE.clicks++;
  STATE.pageClicks++;

  playSound('click');

  // Pulse rings
  pRing1.classList.remove('fire'); void pRing1.offsetWidth; pRing1.classList.add('fire');
  setTimeout(() => {
    pRing2.classList.remove('fire'); void pRing2.offsetWidth; pRing2.classList.add('fire');
  }, 80);

  // Canvas pulse at button location
  const rect = mainBtn.getBoundingClientRect();
  Space.pulse(rect.left + rect.width/2, rect.top + rect.height/2);

  // Button visual feedback
  mainBtn.classList.add('pressed');
  setTimeout(() => mainBtn.classList.remove('pressed'), 140);

  // Update click counter
  clickCountEl.classList.remove('bump'); void clickCountEl.offsetWidth; clickCountEl.classList.add('bump');
  clickCountEl.textContent = STATE.clicks.toLocaleString();
  setTimeout(() => clickCountEl.classList.remove('bump'), 180);

  // Milestone messages
  if (MILESTONE_MSGS[STATE.clicks]) {
    showMsg(MILESTONE_MSGS[STATE.clicks]);
    addLog('Milestone: ' + STATE.clicks + ' clicks.', 'success');
  } else {
    showMsg(getMsg());
  }

  // ★ LOADING — click-driven, happens HERE ★
  applyClickToLoading();

  // Random events
  maybeShowEvent();

  // Update stats + achievements
  checkAchievements();
  updateUI();
  saveState();
}

// ═══════════════════════════════════════════════════════════════
// STATS & SCORING
// ═══════════════════════════════════════════════════════════════
const VERDICTS = [
  [0,  'Initializing...'], [5,  'Curious.'], [15, 'Suspicious.'],
  [30, 'Questionable.'],   [50, 'Concerning.'], [65, 'Committed.'],
  [80, 'Exceptional.'],    [90, 'Legendary.'], [99, 'TRANSCENDENT.'],
];
const REGRET = [
  [0,    'NONE'], [5,    'MINIMAL'],  [30,   'GROWING'],
  [100,  'MODERATE'], [500,  'HIGH'], [1000, 'SUBSTANTIAL'],
  [5000, 'IMMENSE'], [10000,'INFINITE'],
];

function calcScore() {
  const cS = Math.min(STATE.clicks / 100, 40);
  const tS = Math.min((Date.now() - STATE.startTime) / 60000 * 2, 25);
  const pS = Math.min((STATE.page - 1) * 3, 20);
  const mS = Math.min(STATE.moneySpent / 10 * 5, 15);
  return Math.min(Math.round(cS + tS + pS + mS), 100);
}

function updateUI() {
  const elapsed = Date.now() - STATE.startTime;

  statClicks.textContent = STATE.clicks.toLocaleString();
  statTime.textContent   = fmtTime(elapsed);
  statPage.textContent   = STATE.page;
  statMoney.textContent  = '₹' + STATE.moneySpent;
  footerTime.textContent = fmtTimeFull(elapsed);

  const mins = elapsed / 60000;
  statCpm.textContent = mins > 0.02 ? Math.round(STATE.clicks / mins) : 0;

  let regret = REGRET[0][1];
  for (const [t, l] of REGRET) if (STATE.clicks >= t) regret = l;
  statRegret.textContent = regret;

  if (STATE.clicks > 30)  { expResult.textContent = 'ANOMALOUS'; }
  if (STATE.clicks > 100) { expConclusion.textContent = 'Concerning'; }

  const score = calcScore();
  scoreNum.textContent = score;
  scoreRingEl.style.strokeDashoffset = 239 - (score / 100) * 239;

  let verdict = VERDICTS[0][1];
  for (const [t, l] of VERDICTS) if (score >= t) verdict = l;
  scoreVerdict.textContent = verdict;
}

// ═══════════════════════════════════════════════════════════════
// SECRET ENDING (Page 100)
// ═══════════════════════════════════════════════════════════════
function triggerSecretEnding() {
  if (STATE.secretShown) return;
  STATE.secretShown = true;
  secretEnding.classList.add('show');
  const steps = [
    { id: 'se1', delay: 1000 }, { id: 'se2', delay: 3500 },
    { id: 'se3', delay: 6000 }, { id: 'se4', delay: 9000 },
    { id: 'seBack', delay: 12500 },
  ];
  steps.forEach(({ id, delay }) => {
    setTimeout(() => { const el = $(id); if (el) el.classList.add('vis'); }, delay);
  });
}

// ═══════════════════════════════════════════════════════════════
// WELCOME BACK
// ═══════════════════════════════════════════════════════════════
const WB_LINES = [
  ['YOU CAME BACK.', `We knew you would.\nYour progress is preserved.\nNot that it matters.`],
  ['WE NEED TO TALK.', `You have returned to a website that does nothing.\nAre you okay?`],
  ["I KNEW YOU'D RETURN.", `The button missed you.\nWe did not.`],
  ["YOU HAVEN'T LEARNED ANYTHING.", `Impressive.\nYour data is intact.\nPlease continue wasting time.`],
];

function showWelcomeBack() {
  const [t, b] = WB_LINES[Math.floor(Math.random() * WB_LINES.length)];
  wbTitle.textContent = t;
  wbBody.textContent  = b + `\n\nClicks: ${STATE.clicks.toLocaleString()} · Page: ${STATE.page} · Spent: ₹${STATE.moneySpent}`;
  welcomeBack.classList.remove('gone');
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD (fake + live player entry)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
function init() {
  // Start space canvas
  Space.init();

  // Load saved progress
  const returning = loadSave();

  // Render static elements
  renderAchievements();

  // Restore UI from state
  clickCountEl.textContent = STATE.clicks.toLocaleString();
  pageTitle.textContent    = 'PAGE ' + STATE.page;
  pageBadge.textContent    = 'PAGE ' + STATE.page;
  updateUI();

  // Show initial message
  msgText.textContent = 'Awaiting subject interaction...';
  msgText.classList.add('show');

  // Welcome back overlay
  if (returning && STATE.clicks > 0) {
    showWelcomeBack();
  } else {
    welcomeBack.classList.add('gone');
  }

  // UI clock tick (display only — never touches loading)
  setInterval(updateUI, 1000);

  // ── Event listeners ──

  mainBtn.addEventListener('click', handleClick);

  muteBtn.addEventListener('click', () => {
    STATE.muted = !STATE.muted;
    muteBtn.textContent = STATE.muted ? '🔇' : '🔊';
  });

  lbBtn.addEventListener('click', () => {
    renderLeaderboard();
    lbOverlay.classList.add('open');
  });
  lbClose.addEventListener('click',  () => lbOverlay.classList.remove('open'));
  lbOverlay.addEventListener('click', e => { if (e.target === lbOverlay) lbOverlay.classList.remove('open'); });

  pgBtn.addEventListener('click', openPayModal);

  pmPayBtn.addEventListener('click', startPayProcessing);

  payModal.addEventListener('click', e => {
    if (e.target === payModal && !STATE.payProcessing) payModal.classList.remove('open');
  });

  wbContinue.addEventListener('click', () => welcomeBack.classList.add('gone'));

  seBack.addEventListener('click', () => {
    secretEnding.classList.remove('show');
    ['se1','se2','se3','se4','seBack'].forEach(id => { const el=$(id); if(el) el.classList.remove('vis'); });
  });

  addLog('Cosmic research facility initialized.', 'success');
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
