/* ============================================================
   THE BUTTON — script.js
   Button Interaction Research Facility
   ============================================================ */

'use strict';

// ── State ────────────────────────────────────────────────────
const STATE = {
  clicks: 0,
  page: 1,
  moneySpent: 0,
  startTime: Date.now(),
  loadingValue: 0,        // 0–100 internal float
  loadingStarted: false,
  payShown: false,
  muted: false,
  achUnlocked: new Set(),
  lastEventTime: 0,
  eventCooldown: 45000,   // ms between random events
  loadingGoal: 99.0,      // never naturally reaches 100
  loadingSpeed: 0.0008,   // per tick
  loadingTick: null,
  etaSeconds: 3,
  etaFlipTimer: null,
  secretShown: false,
};

// ── Persistence ──────────────────────────────────────────────
const SAVE_KEY = 'btn_research_v2';

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      clicks: STATE.clicks,
      page: STATE.page,
      moneySpent: STATE.moneySpent,
      achUnlocked: [...STATE.achUnlocked],
      elapsed: Date.now() - STATE.startTime,
    }));
  } catch (_) {}
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    STATE.clicks = s.clicks || 0;
    STATE.page = s.page || 1;
    STATE.moneySpent = s.moneySpent || 0;
    STATE.achUnlocked = new Set(s.achUnlocked || []);
    STATE.startTime = Date.now() - (s.elapsed || 0);
    return true;
  } catch (_) { return false; }
}

// ── DOM refs ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const mainBtn       = $('mainButton');
const clickCountEl  = $('clickCount');
const msgText       = $('msgText');
const loadPercent   = $('loadPercent');
const progressFill  = $('progressFill');
const etaText       = $('etaText');
const loadEvent     = $('loadEvent');
const paySection    = $('paySection');
const payAmount     = $('payAmount');
const payBtn        = $('payBtn');
const payNote       = $('payNote');
const statClicks    = $('statClicks');
const statTime      = $('statTime');
const statPage      = $('statPage');
const statMoney     = $('statMoney');
const statUseful    = $('statUseful');
const statCpm       = $('statCpm');
const statEff       = $('statEff');
const statRegret    = $('statRegret');
const scoreNum      = $('scoreNum');
const scoreVerdict  = $('scoreVerdict');
const scoreRingFill = $('scoreRingFill');
const pageBadge     = $('pageBadge');
const pageTitle     = $('pageTitle');
const pageSubtitle  = $('pageSubtitle');
const expResult     = $('expResult');
const expConclusion = $('expConclusion');
const achList       = $('achList');
const eventLog      = $('eventLog');
const tickerTime    = $('tickerTime');
const tickerTime2   = $('tickerTime2');
const footerTime    = $('footerTime');
const muteBtn       = $('muteBtn');
const lbBtn         = $('lbBtn');
const lbOverlay     = $('lbOverlay');
const lbClose       = $('lbClose');
const lbBody        = $('lbBody');
const payModal      = $('payModal');
const payClose      = $('payClose');
const payModalTitle = $('payModalTitle');
const payModalSub   = $('payModalSub');
const payInstructions = $('payInstructions');
const payConfirm    = $('payConfirm');
const eventModal    = $('eventModal');
const evtIcon       = $('evtIcon');
const evtTitle      = $('evtTitle');
const evtBody       = $('evtBody');
const evtBtns       = $('evtBtns');
const achToast      = $('achToast');
const achToastIcon  = $('achToastIcon');
const achToastTitle = $('achToastTitle');
const achToastDesc  = $('achToastDesc');
const welcomeBack   = $('welcomeBack');
const wbTitle       = $('wbTitle');
const wbBody        = $('wbBody');
const wbContinue    = $('wbContinue');
const secretEnding  = $('secretEnding');
const endingBack    = $('endingBack');

// ── Messages ─────────────────────────────────────────────────
const MESSAGES_EARLY = [
  "Okay.",
  "Noted.",
  "You clicked.",
  "Interesting.",
  "Processing...",
  "Acknowledged.",
  "Click registered.",
  "Signal received.",
  "Analyzing...",
  "Welcome.",
  "Input detected.",
  "Thank you for your contribution.",
  "Click logged.",
  "Data point added.",
  "Observation recorded.",
];

const MESSAGES_MID = [
  "Again?",
  "Keep going.",
  "Still here?",
  "We see you.",
  "Fascinating.",
  "This is becoming a pattern.",
  "Your dedication is noted.",
  "We didn't expect this.",
  "You're still clicking.",
  "Have you considered stopping?",
  "The button doesn't mind.",
  "Clicking detected. Intelligence: debatable.",
  "You could literally be doing anything else.",
  "Do you have homework?",
  "Your teacher would be disappointed.",
  "Have you eaten today?",
  "Is everything okay at home?",
  "The button says hi.",
  "You've achieved nothing so far. Keep it up.",
  "Congratulations. You accomplished nothing.",
];

const MESSAGES_LATE = [
  "Why are you doing this?",
  "This is becoming concerning.",
  "You have committed to this.",
  "There is literally nothing here.",
  "The button is getting tired.",
  "This is your life now.",
  "The button knows what you did.",
  "Please stop.",
  "I said please.",
  "Fine. Keep clicking.",
  "Why?",
  "Seriously?",
  "Are you sure this is how you want to spend your time?",
  "You have achieved absolutely nothing.",
  "The researchers are concerned about you.",
  "A notification from your future self: please stop.",
  "We've filed a report on your behavior.",
  "You're in the system now.",
  "The button is filing a restraining order.",
  "We've contacted your family.",
  "This is not normal clicking behavior.",
  "The button is crying. Are you happy now?",
  "You monster.",
  "Still going? Respect.",
  "At this point it's personal.",
  "The button remembers everything.",
  "Someone is watching you click. They're worried.",
];

const MESSAGES_EXTREME = [
  "We've run out of things to say.",
  "This is unprecedented.",
  "The researchers have gone home.",
  "Only you and the button remain.",
  "The button has accepted its fate.",
  "You have transcended clicking.",
  "Clicking is now your personality.",
  "History books will not mention this.",
  "The button salutes your pointless dedication.",
  "At this point, the button IS you.",
  "You are the button now.",
  "The button quit. You didn't.",
  "We're legally required to tell you: this doesn't do anything.",
  "Certified brainworm achieved.",
  "You could have learned a skill. You didn't.",
  "Your thumbs have a support group now.",
  "Legend. Absolutely unhinged legend.",
];

const PAGE_ARRIVAL_MESSAGES = [
  "You paid for this.",
  "Yep. Still useless.",
  "Same thing. Different number.",
  "The number changed. Nothing else did.",
  "Congratulations on reaching this page. It means nothing.",
  "You're still here. We respect that. Slightly.",
  "Another page. Another moment of your life, gone.",
  "The button missed you.",
  "New page. Same energy. Zero purpose.",
  "You've come so far. For so little.",
  "This page is exactly as useful as the last one.",
  "The loading bar is ready to disappoint you again.",
  "Nothing here either. But you already knew that.",
  "The button is waiting. It has nowhere else to be.",
  "We could put something useful here. We chose not to.",
];

function getClickMessage() {
  const c = STATE.clicks;
  let pool;
  if (c <= 5) pool = MESSAGES_EARLY;
  else if (c <= 30) pool = [...MESSAGES_EARLY, ...MESSAGES_MID];
  else if (c <= 150) pool = [...MESSAGES_MID, ...MESSAGES_LATE];
  else pool = [...MESSAGES_LATE, ...MESSAGES_EXTREME];
  return pool[Math.floor(Math.random() * pool.length)];
}

const MILESTONE_MESSAGES = {
  1:     "Welcome. Your mistake begins now.",
  5:     "Five clicks. Still nothing.",
  10:    "Okay, we get it. You can click.",
  25:    "You're still clicking. Interesting.",
  50:    "50 clicks. You are committed.",
  100:   "100 clicks. This is impressive. Also concerning.",
  200:   "200 clicks. The researchers are taking notes.",
  500:   "500 clicks. Do you have nothing else to do?",
  750:   "750 clicks. This is beyond curiosity.",
  1000:  "1,000 clicks. Seriously?",
  2500:  "2,500 clicks. We've notified your family.",
  5000:  "5,000 clicks. This is no longer a game.",
  10000: "10,000 clicks. This is a lifestyle.",
  25000: "25,000 clicks. You are the button now.",
  50000: "50,000 clicks. The button has accepted you as its god.",
};

// ── Achievements ─────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first',       icon: '🏆', name: 'FIRST MISTAKE',        desc: 'Click the button for the first time.',    check: () => STATE.clicks >= 1 },
  { id: 'ten',         icon: '👆', name: 'WARM UP',               desc: 'Click 10 times.',                         check: () => STATE.clicks >= 10 },
  { id: 'hundred',     icon: '💯', name: 'KEEP GOING',            desc: 'Click 100 times.',                        check: () => STATE.clicks >= 100 },
  { id: 'thousand',    icon: '😶', name: 'NO LIFE',               desc: 'Click 1,000 times.',                      check: () => STATE.clicks >= 1000 },
  { id: 'tenthousand', icon: '🤯', name: 'WHY?',                  desc: 'Click 10,000 times.',                     check: () => STATE.clicks >= 10000 },
  { id: 'pay1',        icon: '💸', name: 'FINANCIAL MISTAKE',     desc: 'Pay ₹1. For nothing.',                    check: () => STATE.moneySpent >= 1 },
  { id: 'pay10',       icon: '📉', name: 'BAD DECISION',          desc: 'Pay ₹10 total.',                          check: () => STATE.moneySpent >= 10 },
  { id: 'pay55',       icon: '🔥', name: 'FINANCIAL DISASTER',    desc: 'Pay ₹55 total (Pages 1-10).',             check: () => STATE.moneySpent >= 55 },
  { id: 'pay100',      icon: '💀', name: 'BEYOND REASON',         desc: 'Pay ₹100 total.',                         check: () => STATE.moneySpent >= 100 },
  { id: 'page5',       icon: '📄', name: 'STILL HERE',            desc: 'Reach Page 5.',                           check: () => STATE.page >= 5 },
  { id: 'page10',      icon: '🚀', name: "THERE'S NO GOING BACK", desc: 'Reach Page 10.',                          check: () => STATE.page >= 10 },
  { id: 'page25',      icon: '🌀', name: 'DEEP IN THE VOID',      desc: 'Reach Page 25.',                          check: () => STATE.page >= 25 },
  { id: 'page50',      icon: '👑', name: 'THE FINAL IDIOT',       desc: 'Reach Page 50.',                          check: () => STATE.page >= 50 },
  { id: 'page100',     icon: '🌌', name: 'ASCENDED',              desc: 'Reach Page 100. You found the secret.',   check: () => STATE.page >= 100 },
  { id: 'speedrun',    icon: '⚡', name: 'SPEED RUNNER',          desc: 'Click 50 times in under 30 seconds.',     check: () => STATE.clicks >= 50 && (Date.now() - STATE.startTime) < 30000 },
  { id: 'patient',     icon: '🧘', name: 'PATIENCE',              desc: 'Spend 10 minutes on this website.',       check: () => (Date.now() - STATE.startTime) > 600000 },
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
    if (!STATE.achUnlocked.has(a.id) && a.check()) {
      STATE.achUnlocked.add(a.id);
      const el = document.getElementById('ach-' + a.id);
      if (el) el.classList.add('unlocked');
      showAchToast(a);

      // Secret ending trigger
      if (a.id === 'page100' && !STATE.secretShown) {
        setTimeout(() => triggerSecretEnding(), 3000);
      }
    }
  });
}

function showAchToast(a) {
  achToastIcon.textContent = a.icon;
  achToastTitle.textContent = a.name;
  achToastDesc.textContent = a.desc;
  achToast.classList.add('show');
  playSound('achievement');
  setTimeout(() => achToast.classList.remove('show'), 3500);
}

// ── Leaderboard ──────────────────────────────────────────────
const FAKE_LB = [
  { name: 'Rahul_2024',    page: 47, clicks: 18432, money: 1128 },
  { name: 'Akshay',        page: 32, clicks: 12045, money: 528  },
  { name: 'Adithya_K',     page: 28, clicks: 9821,  money: 406  },
  { name: 'Sneha_M',       page: 21, clicks: 7340,  money: 231  },
  { name: 'ButtonFan99',   page: 19, clicks: 6250,  money: 190  },
  { name: 'ClickMaster',   page: 15, clicks: 5100,  money: 120  },
  { name: 'WhydoIdothis',  page: 12, clicks: 4300,  money: 78   },
  { name: 'NoregretZ',     page: 9,  clicks: 2840,  money: 45   },
  { name: 'Curious_Cat',   page: 6,  clicks: 1920,  money: 21   },
  { name: 'FirstTimer',    page: 2,  clicks: 340,   money: 1    },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const ROW_CLASSES = ['gold', 'silver', 'bronze'];

function renderLeaderboard() {
  // Insert player's entry
  const entries = [...FAKE_LB];
  const playerEntry = {
    name: 'YOU (right now)',
    page: STATE.page,
    clicks: STATE.clicks,
    money: STATE.moneySpent,
    isPlayer: true
  };

  // find where player fits
  let inserted = false;
  for (let i = 0; i < entries.length; i++) {
    if (playerEntry.page > entries[i].page || (playerEntry.page === entries[i].page && playerEntry.clicks > entries[i].clicks)) {
      entries.splice(i, 0, playerEntry);
      inserted = true;
      break;
    }
  }
  if (!inserted) entries.push(playerEntry);

  lbBody.innerHTML = '';
  entries.slice(0, 12).forEach((e, i) => {
    const tr = document.createElement('tr');
    if (i < 3) tr.className = ROW_CLASSES[i];
    if (e.isPlayer) tr.style.cssText = 'background:rgba(0,200,255,0.08);border:1px solid rgba(0,200,255,0.3)';
    const medal = i < 3 ? `<span class="lb-medal">${MEDALS[i]}</span>` : `${i+1}.`;
    tr.innerHTML = `
      <td>${medal}</td>
      <td>${e.isPlayer ? '<strong style="color:var(--cyan)">' + e.name + '</strong>' : e.name}</td>
      <td style="color:var(--yellow)">${e.page}</td>
      <td>${e.clicks.toLocaleString()}</td>
      <td style="color:var(--red)">₹${e.money}</td>`;
    lbBody.appendChild(tr);
  });
}

// ── Sound (Web Audio API) ─────────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(_) {}
  }
  return audioCtx;
}

function playSound(type) {
  if (STATE.muted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'achievement') {
      // Triumphant little jingle
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0, now + i * 0.08);
        g.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
        o.start(now + i * 0.08);
        o.stop(now + i * 0.08 + 0.15);
      });
    } else if (type === 'pay') {
      // Cash register
      [880, 1100, 1320].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.08, now + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.12);
        o.start(now + i * 0.06);
        o.stop(now + i * 0.06 + 0.12);
      });
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'unlock') {
      // Page unlock fanfare
      [262, 330, 392, 523, 659, 784].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0, now + i * 0.07);
        g.gain.linearRampToValueAtTime(0.18, now + i * 0.07 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
        o.start(now + i * 0.07);
        o.stop(now + i * 0.07 + 0.2);
      });
    }
  } catch(_) {}
}

// ── Utilities ────────────────────────────────────────────────
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ' + (s % 60) + 's';
  const h = Math.floor(m / 60);
  return h + 'h ' + (m % 60) + 'm';
}

function formatTimeFull(ms) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatPercent(v) {
  // v is 0–100
  if (v < 90) return v.toFixed(1) + '%';
  if (v < 99) return v.toFixed(2) + '%';
  if (v < 99.9) return v.toFixed(3) + '%';
  if (v < 99.99) return v.toFixed(4) + '%';
  if (v < 99.999) return v.toFixed(5) + '%';
  if (v < 99.9999) return v.toFixed(6) + '%';
  if (v < 99.99999) return v.toFixed(7) + '%';
  if (v < 99.999999) return v.toFixed(8) + '%';
  return v.toFixed(9) + '%';
}

function addEventLog(msg, type = '') {
  const elapsed = Date.now() - STATE.startTime;
  const t = formatTimeFull(elapsed);
  const entry = document.createElement('div');
  entry.className = 'event-entry' + (type ? ' ' + type : '');
  entry.innerHTML = `<span class="etime">${t}</span>${msg}`;
  eventLog.insertBefore(entry, eventLog.firstChild);
  // Keep max 40 entries
  while (eventLog.children.length > 40) {
    eventLog.removeChild(eventLog.lastChild);
  }
}

function showMessage(text) {
  msgText.classList.remove('show');
  setTimeout(() => {
    msgText.textContent = text;
    msgText.classList.add('show');
  }, 50);
}

function bumpClickCounter() {
  clickCountEl.classList.remove('bump');
  void clickCountEl.offsetWidth; // reflow
  clickCountEl.classList.add('bump');
  setTimeout(() => clickCountEl.classList.remove('bump'), 150);
}

// ── Loading logic ────────────────────────────────────────────
const ETA_PHRASES = [
  () => '3 seconds',
  () => '3 seconds',
  () => '1 second',
  () => 'almost done',
  () => '3 seconds',
  () => '0.000001 seconds',
  () => '2 minutes (sorry)',
  () => 'soon™',
  () => 'unknown',
  () => 'calculating...',
  () => '3 seconds',
  () => 'negative 4 seconds (???)',
  () => 'a moment',
  () => 'please hold',
  () => '3 seconds',
  () => 'infinity',
  () => 'error: time not found',
];
let etaPhraseIdx = 0;

function startLoading() {
  if (STATE.loadingStarted) return;
  STATE.loadingStarted = true;
  STATE.loadingValue = 0;
  STATE.payShown = false;
  paySection.classList.remove('show');
  updateProgressUI();
  addEventLog('Loading sequence initiated.', 'success');

  // Start ETA cycling
  if (STATE.etaFlipTimer) clearInterval(STATE.etaFlipTimer);
  STATE.etaFlipTimer = setInterval(() => {
    if (!STATE.loadingStarted) return;
    const phrase = ETA_PHRASES[etaPhraseIdx % ETA_PHRASES.length]();
    etaPhraseIdx++;
    etaText.textContent = 'ETA: ' + phrase;
  }, 3000);

  tickLoading();
}

function resetLoading() {
  STATE.loadingStarted = false;
  STATE.payShown = false;
  STATE.loadingValue = 0;
  STATE.loadingGoal = 99.0;
  if (STATE.loadingTick) clearTimeout(STATE.loadingTick);
  if (STATE.etaFlipTimer) clearInterval(STATE.etaFlipTimer);
  progressFill.style.width = '0%';
  loadPercent.textContent = '0.0000%';
  loadPercent.classList.remove('backwards');
  loadEvent.textContent = '';
  etaText.textContent = 'ETA: Awaiting first click...';
  paySection.classList.remove('show');
}

function tickLoading() {
  if (!STATE.loadingStarted) return;

  // Determine approach speed — slows as it gets close to goal
  const gap = STATE.loadingGoal - STATE.loadingValue;
  const speed = Math.max(0.0001, gap * 0.0018 + STATE.loadingSpeed);

  // Occasional backwards event (rare: 0.3% chance per tick)
  if (Math.random() < 0.003 && STATE.loadingValue > 30) {
    const drop = Math.random() < 0.5
      ? Math.random() * 0.005           // tiny drop
      : (Math.random() * 3 + 0.5);     // big drop

    STATE.loadingValue = Math.max(0, STATE.loadingValue - drop);
    loadPercent.classList.add('backwards');
    loadEvent.textContent = drop > 1 ? '⚠ Major setback detected.' : '⚠ Minor complication.';
    addEventLog('Loading regressed by ' + drop.toFixed(4) + '%.', 'error');
    playSound('error');

    setTimeout(() => {
      loadPercent.classList.remove('backwards');
      loadEvent.textContent = drop > 1 ? '✓ Issue resolved. Probably.' : '✓ Continuing...';
      setTimeout(() => { loadEvent.textContent = ''; }, 3000);
    }, 2000);

  } else {
    STATE.loadingValue = Math.min(STATE.loadingValue + speed, STATE.loadingGoal);
    loadPercent.classList.remove('backwards');
  }

  updateProgressUI();

  // Show pay section if close enough to goal
  if (!STATE.payShown && STATE.loadingValue >= STATE.loadingGoal - 0.01) {
    STATE.payShown = true;
    STATE.loadingValue = STATE.loadingGoal;
    updateProgressUI();
    showPaySection();
    STATE.loadingTick = null;
    return; // Stop ticking until paid
  }

  // Random goal creep — make the goal slide just out of reach
  if (STATE.loadingValue > STATE.loadingGoal - 0.5 && !STATE.payShown) {
    // Extend goal slightly
    STATE.loadingGoal = Math.min(STATE.loadingGoal + 0.0001, 99.9999999);
  }

  const delay = 200 + Math.random() * 300;
  STATE.loadingTick = setTimeout(tickLoading, delay);
}

function updateProgressUI() {
  const v = STATE.loadingValue;
  loadPercent.textContent = formatPercent(v);
  // Visual bar is capped at 99.9% width so it never looks full
  const barPct = Math.min(v, 99.9);
  progressFill.style.width = barPct + '%';
}

// ── Pay section ──────────────────────────────────────────────
const PAGE_PAID_COMMENTS = [
  'Nothing awaits you here.',
  'Same thing. Different page.',
  'You paid for this. Incredible.',
  'The button is pleased.',
  'Another page, another disappointment.',
  'You really did it. Wow.',
  'Financially questionable. Emotionally understandable.',
  'The researchers are baffled.',
  'History will not remember this.',
  'The button salutes you.',
  'Keep scrolling. There\'s nothing to see.',
  'Your commitment is unmatched. And pointless.',
];

function showPaySection() {
  const p = STATE.page;
  const nextPage = p + 1;
  payAmount.textContent = `PAY ₹${p} TO CONTINUE`;
  payBtn.textContent = `⚡ PAY ₹${p} & UNLOCK PAGE ${nextPage}`;
  payNote.textContent = `You are voluntarily paying ₹${p} to unlock another completely useless page. The humor is intentional.`;
  paySection.classList.add('show');
  addEventLog(`Payment required: ₹${p} to unlock Page ${nextPage}.`, 'warn');
  showMessage(`Loading has reached its limit. Pay ₹${p} to continue. (Why would you do this?)`);
}

function openPayModal() {
  const p = STATE.page;
  payModalTitle.textContent = `⚡ PAY ₹${p} TO CONTINUE`;
  payModalSub.textContent = `You are about to pay ₹${p} for absolutely nothing. Page ${p+1} is exactly as useless as this one.`;
  payInstructions.innerHTML = `
    1. Scan the QR code above<br>
    2. Pay ₹${p} using any UPI app<br>
    3. Click "I PAID" below<br>
    <br>
    <em>UPI ID: thebutton@paytm</em><br>
    <em style="color:#ff4466">(This is a demo. No real payment is processed.)</em>`;
  payModal.classList.add('open');
}

function confirmPayment() {
  const p = STATE.page;
  STATE.moneySpent += p;
  payModal.classList.remove('open');

  // Progress bar hits 100%
  STATE.loadingValue = 100;
  progressFill.style.width = '100%';
  loadPercent.textContent = '100.0000%';
  loadPercent.style.color = '#00ff88';
  loadEvent.textContent = '✓ Complete.';

  playSound('unlock');
  addEventLog(`Payment confirmed: ₹${p}. Total spent: ₹${STATE.moneySpent}.`, 'success');
  showMessage(`₹${p} paid. Loading complete. Welcome to Page ${p + 1}.`);

  setTimeout(() => {
    advancePage();
  }, 1800);
}

function advancePage() {
  STATE.page++;
  saveState();
  checkAchievements();
  updateUI();
  resetLoading();

  const comment = PAGE_PAID_COMMENTS[Math.floor(Math.random() * PAGE_PAID_COMMENTS.length)];
  pageTitle.textContent = 'PAGE ' + STATE.page;
  pageSubtitle.textContent = comment;

  // Animate page transition
  pageTitle.style.opacity = '0';
  pageTitle.style.transform = 'translateY(10px)';
  setTimeout(() => {
    pageTitle.style.transition = 'all 0.5s ease';
    pageTitle.style.opacity = '1';
    pageTitle.style.transform = 'translateY(0)';
  }, 100);

  addEventLog(`Entered Page ${STATE.page}. Money spent so far: ₹${STATE.moneySpent}.`, 'success');

  // Money-based page commentary
  const moneyMsgs = {
    1:   `You paid ₹${STATE.moneySpent} for this. Respect. Slightly.`,
    10:  `₹10 total. Interesting financial decision.`,
    55:  `₹55 total. You've reached double digits in foolishness.`,
    100: `₹100. You could have bought something useful. You didn't.`,
    200: `₹200. The researchers have started a charity in your name.`,
    500: `₹500. This is art. Expensive, useless art.`,
  };
  for (const [amt, msg] of Object.entries(moneyMsgs)) {
    if (STATE.moneySpent >= +amt && STATE.moneySpent < +amt + STATE.page) {
      showMessage(msg);
      break;
    }
  }

  // Start loading again after brief delay
  setTimeout(() => {
    startLoading();
    showMessage(`Page ${STATE.page} loaded. Enjoy doing nothing.`);
  }, 1000);
}

// ── Random Events ─────────────────────────────────────────────
const RANDOM_EVENTS = [
  {
    icon: '🚨',
    title: 'BUTTON EMERGENCY',
    body: 'An unexpected situation has occurred with the button.\nStand by for further instructions.',
    resolve: (resolve) => {
      setTimeout(() => {
        evtBody.textContent = 'Never mind. The button is fine.';
        evtBtns.innerHTML = '<button class="evt-btn" id="evtOk2">OK</button>';
        document.getElementById('evtOk2').onclick = () => { resolve(); eventModal.classList.remove('open'); };
      }, 2000);
    },
    btns: null,
  },
  {
    icon: '🔬',
    title: 'FAKE ANALYSIS',
    body: 'Analyzing your clicking behavior...\n\nPlease wait.',
    resolve: (resolve) => {
      setTimeout(() => {
        evtBody.innerHTML = 'Analysis complete.<br><br><strong style="color:var(--cyan)">Conclusion: Questionable.</strong>';
        evtBtns.innerHTML = '<button class="evt-btn" id="evtOk2">I accept my results</button>';
        document.getElementById('evtOk2').onclick = () => { resolve(); eventModal.classList.remove('open'); };
      }, 2500);
    },
    btns: null,
  },
  {
    icon: '🎉',
    title: 'YOU WON!',
    body: 'Congratulations! You have won!',
    resolve: (resolve) => {
      setTimeout(() => {
        evtBody.innerHTML = 'Prize: <strong style="color:var(--red)">Nothing.</strong><br><br>Better luck next time.';
        evtBtns.innerHTML = '<button class="evt-btn" id="evtOk2">Oh.</button>';
        document.getElementById('evtOk2').onclick = () => { resolve(); eventModal.classList.remove('open'); };
      }, 1500);
    },
    btns: null,
  },
  {
    icon: '❓',
    title: 'CONFIRMATION REQUIRED',
    body: 'Are you sure you want to continue?',
    btns: [
      { label: 'YES', action: (resolve) => {
          evtBody.innerHTML = '<strong style="color:var(--red)">Wrong answer.</strong>';
          evtBtns.innerHTML = '<button class="evt-btn" id="evtOk2">...</button>';
          document.getElementById('evtOk2').onclick = () => { resolve(); eventModal.classList.remove('open'); };
      }},
      { label: 'NO', action: (resolve) => {
          evtBody.innerHTML = '<strong style="color:var(--red)">Wrong answer.</strong>';
          evtBtns.innerHTML = '<button class="evt-btn" id="evtOk2">...</button>';
          document.getElementById('evtOk2').onclick = () => { resolve(); eventModal.classList.remove('open'); };
      }},
    ],
  },
  {
    icon: '😴',
    title: 'INACTIVITY DETECTED',
    body: 'The button notices you slowed down.\n\nDid something important come up?\n\nProbably not.',
    btns: [{ label: 'Nothing came up.', action: (resolve) => { resolve(); eventModal.classList.remove('open'); } }],
  },
  {
    icon: '📋',
    title: 'PROGRESS REPORT',
    body: () => `Subject has clicked ${STATE.clicks.toLocaleString()} times.\nMoney wasted: ₹${STATE.moneySpent}.\nPages completed: ${STATE.page - 1}.\n\nConclusion: No comment.`,
    btns: [{ label: 'Noted.', action: (resolve) => { resolve(); eventModal.classList.remove('open'); } }],
  },
  {
    icon: '🤔',
    title: 'PHILOSOPHICAL MOMENT',
    body: 'If a button is clicked and nothing happens...\ndoes it make a sound?\n\n...\n\nNo. It does not.',
    btns: [{ label: 'Deep.', action: (resolve) => { resolve(); eventModal.classList.remove('open'); } }],
  },
  {
    icon: '🔄',
    title: 'UPDATE AVAILABLE',
    body: 'A new update is available for this button.\n\nChanges in v2.0:\n• Still does nothing.\n• Now does nothing faster.',
    btns: [{ label: 'Install Update', action: (resolve) => {
      evtBody.textContent = 'Installing...\n\nUpdate complete. Nothing has changed.';
      evtBtns.innerHTML = '<button class="evt-btn" id="evtOk2">Great.</button>';
      document.getElementById('evtOk2').onclick = () => { resolve(); eventModal.classList.remove('open'); };
    }}],
  },
];

let eventModalOpen = false;

function maybeShowRandomEvent() {
  if (eventModalOpen) return;
  const now = Date.now();
  if (now - STATE.lastEventTime < STATE.eventCooldown) return;
  if (Math.random() > 0.18) return; // ~18% chance per eligible click
  if (STATE.payShown) return; // don't interrupt payment flow

  STATE.lastEventTime = now;
  const evt = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  showRandomEvent(evt);
}

function showRandomEvent(evt) {
  eventModalOpen = true;
  evtIcon.textContent = evt.icon;
  evtTitle.textContent = evt.title;
  const body = typeof evt.body === 'function' ? evt.body() : evt.body;
  evtBody.textContent = body;
  evtBtns.innerHTML = '';

  const resolve = () => { eventModalOpen = false; STATE.lastEventTime = Date.now(); };

  if (evt.resolve) {
    // Auto-resolving event
    const okBtn = document.createElement('button');
    okBtn.className = 'evt-btn';
    okBtn.textContent = 'OK';
    okBtn.onclick = () => {}; // disabled until resolved
    evtBtns.appendChild(okBtn);
    evt.resolve(resolve);
  } else if (evt.btns) {
    evt.btns.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'evt-btn';
      btn.textContent = b.label;
      btn.onclick = () => b.action(resolve);
      evtBtns.appendChild(btn);
    });
  } else {
    const okBtn = document.createElement('button');
    okBtn.className = 'evt-btn';
    okBtn.textContent = 'OK';
    okBtn.onclick = () => { resolve(); eventModal.classList.remove('open'); };
    evtBtns.appendChild(okBtn);
  }

  eventModal.classList.add('open');
  addEventLog(`Event: ${evt.title}`, 'warn');
}

// ── Main click handler ───────────────────────────────────────
function handleClick(e) {
  STATE.clicks++;

  // Sound
  const highClickSound = STATE.clicks > 500;
  playSound('click');

  // Ripple
  const rect = mainBtn.getBoundingClientRect();
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = '50%';
  ripple.style.top = '50%';
  mainBtn.parentElement.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);

  // Button press class
  mainBtn.classList.add('pressed');
  setTimeout(() => mainBtn.classList.remove('pressed'), 150);

  // Bump counter
  bumpClickCounter();
  clickCountEl.textContent = STATE.clicks.toLocaleString();
  statClicks.textContent = STATE.clicks.toLocaleString();

  // Milestone messages
  if (MILESTONE_MESSAGES[STATE.clicks]) {
    showMessage(MILESTONE_MESSAGES[STATE.clicks]);
    addEventLog('Milestone: ' + STATE.clicks + ' clicks.', 'success');
  } else {
    showMessage(getClickMessage());
  }

  // Start loading after first click
  if (!STATE.loadingStarted) {
    setTimeout(() => startLoading(), 800);
  }

  // Random events
  maybeShowRandomEvent();

  // Achievements + stats
  checkAchievements();
  updateUI();
  saveState();
}

// ── Stats / Scoring ──────────────────────────────────────────
function calcStupidityScore() {
  // Completely meaningless formula
  const clickScore   = Math.min(STATE.clicks / 100, 40);
  const timeScore    = Math.min((Date.now() - STATE.startTime) / 60000 * 2, 25);
  const pageScore    = Math.min((STATE.page - 1) * 3, 20);
  const moneyScore   = Math.min(STATE.moneySpent / 10 * 5, 15);
  return Math.min(Math.round(clickScore + timeScore + pageScore + moneyScore), 100);
}

const VERDICTS = [
  [0,  'Newcomer.'],
  [10, 'Curious.'],
  [20, 'Suspicious.'],
  [35, 'Questionable.'],
  [50, 'Concerning.'],
  [65, 'Committed.'],
  [80, 'Exceptional.'],
  [90, 'Legendary.'],
  [99, 'TRANSCENDENT.'],
];

const REGRET_LEVELS = [
  [0,    'NONE'],
  [5,    'MINIMAL'],
  [30,   'GROWING'],
  [100,  'MODERATE'],
  [500,  'SIGNIFICANT'],
  [1000, 'SUBSTANTIAL'],
  [5000, 'IMMENSE'],
  [10000,'INFINITE'],
];

function updateUI() {
  const elapsed = Date.now() - STATE.startTime;

  // Clocks
  const ft = formatTime(elapsed);
  const ftFull = formatTimeFull(elapsed);
  statTime.textContent = ft;
  footerTime.textContent = ftFull;
  tickerTime.textContent = ft;
  tickerTime2.textContent = ft;

  // Stats
  statPage.textContent = STATE.page;
  statMoney.textContent = '₹' + STATE.moneySpent;
  pageBadge.textContent = 'PAGE ' + STATE.page;

  // CPM
  const mins = elapsed / 60000;
  statCpm.textContent = mins > 0.016 ? Math.round(STATE.clicks / mins) : 0;

  // Efficiency (always 0%)
  statEff.textContent = '0%';

  // Regret level
  let regret = REGRET_LEVELS[0][1];
  for (const [threshold, label] of REGRET_LEVELS) {
    if (STATE.clicks >= threshold) regret = label;
  }
  statRegret.textContent = regret;

  // Exp result / conclusion
  if (STATE.clicks > 50) {
    expResult.textContent = 'ONGOING';
    expConclusion.textContent = 'Questionable';
  }
  if (STATE.clicks > 200) {
    expResult.textContent = 'ANOMALOUS';
    expConclusion.textContent = 'Very Concerning';
  }

  // Stupidity score
  const score = calcStupidityScore();
  scoreNum.textContent = score;
  // Ring: dasharray=245 → offset=245 means 0%, offset=0 means 100%
  const offset = 245 - (score / 100) * 245;
  scoreRingFill.style.strokeDashoffset = offset;

  let verdict = VERDICTS[0][1];
  for (const [threshold, label] of VERDICTS) {
    if (score >= threshold) verdict = label;
  }
  scoreVerdict.textContent = verdict;
}

// ── Secret ending ─────────────────────────────────────────────
function triggerSecretEnding() {
  if (STATE.secretShown) return;
  STATE.secretShown = true;

  secretEnding.classList.add('show');
  const lines = [
    { id: 'e1', delay: 1000 },
    { id: 'e2', delay: 3500 },
    { id: 'e3', delay: 6000 },
    { id: 'e4', delay: 9000 },
    { id: 'endingBack', delay: 12500 },
  ];
  lines.forEach(({ id, delay }) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
    }, delay);
  });
}

// ── Welcome back ─────────────────────────────────────────────
const WB_MESSAGES = [
  ['YOU CAME BACK.', 'We knew you would.\nYour progress has been preserved.\nNot that it matters.'],
  ['WE NEED TO TALK.', 'You have returned to a website\nthat does nothing.\nAre you okay?'],
  ['I KNEW YOU\'D RETURN.', 'Your progress is exactly where you left it.\nThe button missed you.\nWe did not.'],
  ['YOU REALLY HAVEN\'T LEARNED ANYTHING.', 'Impressive.\nYour data is intact.\nPlease continue wasting time.'],
];

function showWelcomeBack() {
  const [title, body] = WB_MESSAGES[Math.floor(Math.random() * WB_MESSAGES.length)];
  wbTitle.textContent = title;
  wbBody.textContent = body + '\n\nClicks: ' + STATE.clicks.toLocaleString() + ' | Page: ' + STATE.page + ' | Money spent: ₹' + STATE.moneySpent;
  welcomeBack.classList.remove('hidden');
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  const returning = loadSave();

  renderAchievements();
  buildLeaderboard();

  // Restore page title
  pageTitle.textContent = 'PAGE ' + STATE.page;
  clickCountEl.textContent = STATE.clicks.toLocaleString();

  updateUI();

  // Set initial msg
  msgText.textContent = 'Waiting for subject to make a mistake...';
  msgText.classList.add('show');

  if (returning && STATE.clicks > 0) {
    showWelcomeBack();
    // Restart loading at a random point if page already in progress
    STATE.loadingValue = Math.random() * 40;
    STATE.loadingStarted = false;
    // Don't auto-start — let user click
  }

  // Clock tick
  setInterval(updateUI, 1000);

  // Event bindings
  mainBtn.addEventListener('click', handleClick);

  muteBtn.addEventListener('click', () => {
    STATE.muted = !STATE.muted;
    muteBtn.textContent = STATE.muted ? '🔇' : '🔊';
  });

  lbBtn.addEventListener('click', () => {
    renderLeaderboard();
    lbOverlay.classList.add('open');
  });

  lbClose.addEventListener('click', () => lbOverlay.classList.remove('open'));

  lbOverlay.addEventListener('click', (e) => {
    if (e.target === lbOverlay) lbOverlay.classList.remove('open');
  });

  payBtn.addEventListener('click', openPayModal);

  payClose.addEventListener('click', () => payModal.classList.remove('open'));
  payModal.addEventListener('click', (e) => {
    if (e.target === payModal) payModal.classList.remove('open');
  });

  payConfirm.addEventListener('click', () => {
    playSound('pay');
    confirmPayment();
  });

  wbContinue.addEventListener('click', () => {
    welcomeBack.classList.add('hidden');
    // Resume loading if needed
    if (!STATE.loadingStarted && STATE.clicks > 0) {
      setTimeout(() => startLoading(), 500);
    }
  });

  endingBack.addEventListener('click', () => {
    secretEnding.classList.remove('show');
    // Reset ending lines
    ['e1','e2','e3','e4','endingBack'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('visible');
    });
  });
}

function buildLeaderboard() {
  // Nothing needed at build time — rendered on open
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
