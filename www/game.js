// Loopback: every loop, your past self comes back. It works for you, and it can kill you.
(() => {
  'use strict';

  // ---------- Constants ----------
  const W = 360;                 // world width (height adapts to screen aspect)
  let H = 640;
  const STEP = 1 / 60;           // fixed sim step: replays are deterministic
  const LOOP_STEPS = 360;        // 6 seconds per loop
  const GRACE = 40;              // steps at loop start where echoes are inactive
  const R = 10;                  // player / echo radius
  const GEM_R = 11;
  const NEAR = R * 3.4;          // near-miss distance
  const BASE_SPEED = 6;          // max world units per step (slow enough that you need echoes to harvest)
  const SENS = 1.25;             // drag sensitivity
  const PREVIEW = 30;            // steps of future path shown for each echo
  const DRAFT_EVERY = 3;
  const FADE_AGE = 6;            // Short Memory: echoes live this many loops
  const HUD_TOP = 80;            // keep gems clear of the HUD

  const COLORS = {
    bg: '#0b0d17', arena: '#10142a', grid: 'rgba(255,255,255,0.035)',
    fg: '#e8ecff', muted: '#8a91b4', accent: '#5ef2ff',
    gem: '#ffd34d', rew: '#6c8cff', ok: '#5dffa0', danger: '#ff4d6d',
  };

  // ---------- Content ----------
  // In-run upgrade cards. `unlock` cards must be bought in the Lab first.
  const CARDS = {
    magnet:  { name: 'Magnet', icon: '🧲', desc: 'Grab gems from further away.', max: 3 },
    harvest: { name: 'Harvester', icon: '🌾', desc: 'Your echoes collect gems from further away.', max: 3 },
    eraser:  { name: 'Eraser', icon: '⌫', desc: 'Erase your 2 oldest echoes right now.', max: 99, need: () => ghosts.length > 0 },
    shield:  { name: 'Shield', icon: '🛡️', desc: 'Survive one echo hit. That echo is destroyed.', max: 3 },
    ghost:   { name: 'Ghost Step', icon: '👣', desc: 'Echoes stay harmless 0.5s longer each loop.', max: 2 },
    sprint:  { name: 'Sprint', icon: '⚡', desc: '+20% movement speed.', max: 2 },
    phase:   { name: 'Phase', icon: '🌀', desc: 'Double-tap to turn intangible for 0.5s. Once per loop.', max: 1, unlock: 60 },
    fade:    { name: 'Short Memory', icon: '⌛', desc: `Echoes vanish after ${FADE_AGE} loops.`, max: 1, unlock: 100 },
    golden:  { name: 'Golden Echo', icon: '✨', desc: 'Your next 2 echoes collect double gems.', max: 99, unlock: 70 },
    tiny:    { name: 'Tiny', icon: '🔹', desc: 'Your hitbox shrinks by 30%.', max: 1, unlock: 50 },
    bargain: { name: 'Bargain', icon: '⚖️', desc: 'Quota −1 every loop.', max: 2, unlock: 140 },
    surge:   { name: 'Rewind Surge', icon: '↺', desc: 'Rewind orbs (erase oldest echo) every 2 loops.', max: 1, unlock: 60 },
  };
  // Permanent Lab upgrades.
  const PERKS = {
    startShield: { name: 'Spare Shield', icon: '🛡️', desc: 'Start every run with 1 shield.', cost: 150 },
    early:       { name: 'Quick Start', icon: '⏩', desc: 'First upgrade draft after loop 1.', cost: 90 },
    reroll:      { name: 'Reroll', icon: '🎲', desc: 'One free draft reroll per run.', cost: 120 },
    fourth:      { name: 'Wider Draft', icon: '🃏', desc: 'Drafts offer 4 cards instead of 3.', cost: 220 },
  };
  const SKINS = {
    classic: { name: 'Classic', body: '#e8ecff', core: '#5ef2ff', cost: 0 },
    ember:   { name: 'Ember', body: '#ffe0d6', core: '#ff6b3d', cost: 40 },
    lime:    { name: 'Lime', body: '#efffdc', core: '#8dff3a', cost: 40 },
    violet:  { name: 'Violet', body: '#f1e6ff', core: '#b46bff', cost: 60 },
    gold:    { name: 'Gold', body: '#fff6d6', core: '#ffd34d', cost: 120 },
  };
  const TIPS = [
    'Grab ◆ to meet the quota. Faint ◇ are NEXT loop\'s gems.',
    'That\'s your echo: it collects gems for you. Never touch it!',
    'Pass through the faint ◇ now, and your new echo harvests them next loop.',
  ];

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const cv = $('game');
  const ctx = cv.getContext('2d');
  const ui = {
    menu: $('menu'), over: $('over'), draft: $('draft'), labScreen: $('labScreen'),
    play: $('play'), daily: $('daily'), lab: $('lab'), dailyBest: $('dailyBest'), menuBest: $('menuBest'),
    menuShards: $('menuShards'), draftTitle: $('draftTitle'), cards: $('cards'), reroll: $('reroll'),
    labShards: $('labShards'), labList: $('labList'), labBack: $('labBack'),
    score: $('score'), overLoop: $('overLoop'), split: $('split'), cause: $('cause'), newBest: $('newBest'),
    earn: $('earn'), unlockHint: $('unlockHint'), overTitle: $('overTitle'),
    retry: $('retry'), overLab: $('overLab'), share: $('share'), home: $('home'), mute: $('mute'), toast: $('toast'),
  };

  // ---------- Storage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('loopback.' + k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('loopback.' + k, String(v)); } catch (e) { /* private mode */ } },
  };
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  let owned;
  try { owned = new Set(JSON.parse(store.get('owned', '[]'))); } catch (e) { owned = new Set(); }
  let shards = +store.get('shards', 0);
  let skin = SKINS[store.get('skin', 'classic')] ? store.get('skin', 'classic') : 'classic';
  let best = +store.get('best2', 0);
  let runs = +store.get('runs', 0);
  const saveMeta = () => { store.set('owned', JSON.stringify([...owned])); store.set('shards', shards); store.set('skin', skin); };

  // ---------- RNG ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // ---------- Audio (synthesized, no assets) ----------
  let ac = null;
  let muted = store.get('mute', '0') === '1';
  function audioInit() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
  }
  function tone(freq, dur, type = 'sine', vol = 0.15, slideTo = 0, delay = 0) {
    if (!ac || muted) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  const PENTA = [0, 2, 4, 7, 9];
  const sfx = {
    gem(n) {
      const semis = PENTA[n % 5] + 12 * Math.min(2, Math.floor(n / 5));
      const f = 392 * Math.pow(2, semis / 12);
      tone(f, 0.12, 'triangle', 0.16);
      tone(f * 1.5, 0.18, 'triangle', 0.1, 0, 0.07);
    },
    echoGem() { tone(700 + Math.random() * 300, 0.07, 'sine', 0.05); },
    quota() { tone(523, 0.1, 'triangle', 0.14); tone(659, 0.1, 'triangle', 0.12, 0, 0.08); tone(784, 0.2, 'triangle', 0.12, 0, 0.16); },
    loop() { tone(180, 0.35, 'sine', 0.12, 520); },
    near() { tone(1400, 0.05, 'square', 0.035); },
    tick() { tone(900, 0.04, 'square', 0.04); },
    rewind() { tone(900, 0.45, 'sine', 0.14, 160); tone(600, 0.3, 'triangle', 0.08, 120, 0.05); },
    shield() { tone(200, 0.3, 'square', 0.1, 700); },
    phase() { tone(300, 0.3, 'sine', 0.1, 1200); },
    pick() { tone(440, 0.08, 'triangle', 0.12); tone(880, 0.15, 'triangle', 0.1, 0, 0.06); },
    death() { tone(320, 0.7, 'sawtooth', 0.16, 50); tone(90, 0.5, 'square', 0.08, 40); },
  };

  // ---------- Haptics (Capacitor native → web vibrate fallback) ----------
  function buzz(kind) {
    const cap = window.Capacitor;
    const hap = cap && cap.Plugins && cap.Plugins.Haptics;
    if (hap && cap.isNativePlatform && cap.isNativePlatform()) {
      try { hap.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }); } catch (e) { /* ignore */ }
      return;
    }
    if (navigator.vibrate) {
      try { navigator.vibrate(kind === 'heavy' ? [40, 30, 70] : kind === 'medium' ? 20 : 8); } catch (e) { /* ignore */ }
    }
  }

  // ---------- Canvas sizing ----------
  let dpr = 1, scale = 1, ox = 0, oy = 0;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    // World height follows the screen aspect, but is frozen during a run so replays stay valid.
    if (state === 'menu') H = Math.round(Math.max(560, Math.min(780, W * h / w)));
    scale = Math.min(w / W, h / H);
    ox = (w - W * scale) / 2;
    oy = (h - H * scale) / 2;
  }
  const toWorld = (e) => ({ x: (e.clientX - ox) / scale, y: (e.clientY - oy) / scale });

  // ---------- Game state ----------
  let state = 'menu';            // menu | play | draft | dead
  let mode = 'classic';          // classic | daily
  let rng = Math.random, rngDraft = Math.random;
  let px = 0, py = 0, tx = 0, ty = 0;
  let ghosts = [];               // { path: Float32Array, born, hue, armed, mult }
  let rec = null;                // current loop recording
  let step = 0, loops = 0, started = false, paused = false;
  let gems = [], nextGems = [], rewind = null;
  let collected = 0, totalYou = 0, totalEcho = 0;
  let perks = {}, taken = {};
  let shields = 0, invuln = 0, phaseT = 0, phaseCharge = 0, rerolls = 0, lastDownT = 0;
  let particles = [], texts = [], rings = [], trail = [];
  let shake = 0, flash = 0, time = 0;
  let anchor = null;
  let lastResult = null;
  let draftChoices = [];

  // Derived stats from the current build.
  const playerR = () => (perks.tiny ? R * 0.7 : R);
  const speed = () => BASE_SPEED * (1 + 0.2 * perks.sprint);
  const grace = () => GRACE + 30 * perks.ghost;
  const pickR = () => playerR() + GEM_R + perks.magnet * 9;
  const harvestR = () => R + GEM_R - 3 + perks.harvest * 9;
  const rewindEvery = () => (perks.surge ? 2 : 4);
  const gemCount = (L) => Math.min(18, 4 + L);
  const quotaNow = () => Math.max(1, Math.min(gems.length - 1, Math.floor(1 + (loops + 1) * 0.75)) - perks.bargain);
  const firstDraft = () => (owned.has('perk.early') ? 1 : DRAFT_EVERY);

  function newGame(m) {
    mode = m;
    state = 'menu'; resize();       // lock world height for this run
    const seed = hashStr('loopback-' + today());
    rng = m === 'daily' ? mulberry32(seed) : Math.random;
    rngDraft = m === 'daily' ? mulberry32(seed ^ 0x5bd1e995) : Math.random;
    px = tx = W / 2; py = ty = H * 0.62;
    ghosts = []; loops = 0; totalYou = 0; totalEcho = 0;
    perks = { magnet: 0, harvest: 0, ghost: 0, sprint: 0, phase: 0, fade: 0, golden: 0, tiny: 0, bargain: 0, surge: 0 };
    taken = {};
    shields = owned.has('perk.startShield') ? 1 : 0;
    rerolls = owned.has('perk.reroll') ? 1 : 0;
    invuln = 0; phaseT = 0;
    particles = []; texts = []; rings = []; trail = [];
    rewind = null; anchor = null; shake = 0; flash = 0; paused = false;
    nextGems = genGems(1);
    beginLoop();
    state = 'play';
    for (const s of [ui.menu, ui.over, ui.draft, ui.labScreen]) s.classList.add('hidden');
  }

  function genGems(L) {
    const out = [];
    const n = gemCount(L);
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0;
      for (let tries = 0; tries < 25; tries++) {
        x = 28 + rng() * (W - 56);
        y = HUD_TOP + rng() * (H - HUD_TOP - 28);
        if (out.every((g) => Math.hypot(g.x - x, g.y - y) > 44)) break;
      }
      out.push({ x, y, alive: true });
    }
    return out;
  }

  function beginLoop() {
    gems = nextGems;
    nextGems = genGems(loops + 2);
    collected = 0;
    step = 0;
    rec = new Float32Array(LOOP_STEPS * 2);
    phaseCharge = perks.phase ? 1 : 0;
    for (const g of ghosts) g.armed = false;
  }

  // ---------- Simulation ----------
  function tick() {
    time++;
    updateFx();
    if (state !== 'play' || !started || paused) return;
    if (invuln > 0) invuln--;
    if (phaseT > 0) phaseT--;

    // Move player toward target, speed-capped.
    let dx = tx - px, dy = ty - py;
    const d = Math.hypot(dx, dy), sp = speed();
    if (d > sp) { dx *= sp / d; dy *= sp / d; }
    px += dx; py += dy;
    rec[step * 2] = px; rec[step * 2 + 1] = py;
    trail.push(px, py);
    if (trail.length > 24) trail.splice(0, 2);

    // Echoes: harvest gems, then check collisions.
    if (step >= grace()) {
      const hr = harvestR(), hit = (playerR() + R) * 0.78;
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        const gx = g.path[step * 2], gy = g.path[step * 2 + 1];
        for (const gem of gems) {
          if (gem.alive && Math.hypot(gem.x - gx, gem.y - gy) < hr) collectGem(gem, g);
        }
        if (invuln > 0 || phaseT > 0) continue;
        const dd = Math.hypot(gx - px, gy - py);
        if (dd < hit) {
          if (shields > 0) {
            shields--; invuln = 50;
            ghosts.splice(i, 1); i--;
            burst(gx, gy, `hsl(${g.hue},90%,65%)`, 26, 3.5);
            rings.push({ x: px, y: py, r: 8, life: 24, c: COLORS.accent });
            texts.push({ x: px, y: py - 24, s: 'SHIELD!', c: COLORS.accent, life: 45 });
            sfx.shield(); buzz('medium'); shake = 6;
            continue;
          }
          die(g); return;
        }
        if (dd < NEAR) g.armed = true;
        else if (g.armed) {
          g.armed = false;
          texts.push({ x: px, y: py - 22, s: 'CLOSE!', c: COLORS.accent, life: 40 });
          sfx.near(); buzz('light');
        }
      }
    }

    // Player pickups.
    const pr = pickR();
    for (const gem of gems) {
      if (gem.alive && Math.hypot(gem.x - px, gem.y - py) < pr) collectGem(gem, null);
    }
    if (rewind && Math.hypot(rewind.x - px, rewind.y - py) < pr) {
      sfx.rewind(); buzz('medium');
      rings.push({ x: rewind.x, y: rewind.y, r: 6, life: 30, c: COLORS.rew });
      eraseOldest(1);
      rewind = null;
    }

    // Countdown ticks while the quota is unmet.
    const left = LOOP_STEPS - step;
    if (collected < quotaNow() && left <= 90 && left % 15 === 0) sfx.tick();

    step++;
    if (step >= LOOP_STEPS) endLoop();
  }

  function collectGem(gem, g) {
    gem.alive = false;
    const v = g ? g.mult : 1;
    const before = collected;
    collected += v;
    if (g) {
      totalEcho += v;
      const c = `hsl(${g.hue},90%,70%)`;
      burst(gem.x, gem.y, c, 8, 2);
      texts.push({ x: gem.x, y: gem.y - 14, s: '+' + v, c, life: 35 });
      sfx.echoGem();
    } else {
      totalYou += v;
      burst(gem.x, gem.y, COLORS.gem, 16, 3);
      rings.push({ x: gem.x, y: gem.y, r: 6, life: 24, c: COLORS.gem });
      sfx.gem(collected); buzz('light');
    }
    const q = quotaNow();
    if (before < q && collected >= q) {
      texts.push({ x: W / 2, y: 70, s: 'QUOTA MET', c: COLORS.ok, life: 50 });
      sfx.quota(); buzz('medium');
    }
  }

  function eraseOldest(n) {
    for (let i = 0; i < n && ghosts.length; i++) {
      const old = ghosts.shift();
      const s = Math.min(step, LOOP_STEPS - 1);
      const gx = old.path[s * 2], gy = old.path[s * 2 + 1];
      burst(gx, gy, `hsl(${old.hue},90%,65%)`, 26, 3.5);
      texts.push({ x: gx, y: gy - 20, s: `ECHO ${old.born} ERASED`, c: COLORS.rew, life: 60 });
    }
  }

  function endLoop() {
    const q = quotaNow();
    if (collected < q) { die(null, `Quota missed: ${collected}/${q} gems.`); return; }
    loops++;
    let mult = 1;
    if (perks.golden > 0) { perks.golden--; mult = 2; }
    ghosts.push({ path: rec, born: loops, hue: (190 + loops * 47) % 360, armed: false, mult });
    if (perks.fade) ghosts = ghosts.filter((g) => loops - g.born < FADE_AGE);
    rewind = null;
    if (loops % rewindEvery() === 0 && ghosts.length > 1) spawnRewind();
    rings.push({ x: px, y: py, r: 10, life: 30, c: COLORS.accent });
    texts.push({ x: W / 2, y: H * 0.3, s: `LOOP ${loops + 1}`, c: COLORS.fg, life: 50, big: true });
    sfx.loop(); buzz('light');
    beginLoop();
    if (loops >= firstDraft() && (loops - firstDraft()) % DRAFT_EVERY === 0) openDraft();
  }

  function spawnRewind() {
    // Not seeded: its timing depends on the player, so keep the daily gem sequence identical for everyone.
    rewind = { x: 30 + Math.random() * (W - 60), y: HUD_TOP + Math.random() * (H - HUD_TOP - 30) };
  }

  function die(g, why) {
    state = 'dead';
    shake = 14; flash = 1;
    burst(px, py, COLORS.danger, 44, 4.5);
    burst(px, py, COLORS.fg, 16, 2.5);
    sfx.death(); buzz('heavy');
    anchor = null;

    const total = totalYou + totalEcho;
    const cause = g ? `Caught by your past self from loop ${g.born}.` : why;
    let isBest = false;
    if (mode === 'daily') {
      const key = 'daily2.' + today();
      if (total > +store.get(key, 0)) { store.set(key, total); isBest = total > 0; }
    } else if (total > best) {
      best = total; store.set('best2', best); isBest = true;
    }
    shards += total;
    runs++;
    store.set('runs', runs);
    saveMeta();
    lastResult = { total, loops, you: totalYou, echo: totalEcho, cause, isBest, mode };
    setTimeout(showGameOver, 900);
  }

  function burst(x, y, c, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.3 + Math.random()) * spd;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 30 + Math.random() * 25, c });
    }
  }

  function updateFx() {
    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life--; }
    particles = particles.filter((p) => p.life > 0);
    for (const t of texts) { t.y -= t.big ? 0.2 : 0.6; t.life--; }
    texts = texts.filter((t) => t.life > 0);
    for (const r of rings) { r.r += 2.2; r.life--; }
    rings = rings.filter((r) => r.life > 0);
    shake *= 0.86;
    flash *= 0.9;
  }

  // ---------- Draft ----------
  function pickCards(n) {
    const pool = Object.keys(CARDS).filter((k) => {
      const c = CARDS[k];
      return (!c.unlock || owned.has('card.' + k)) && (taken[k] || 0) < c.max && (!c.need || c.need());
    });
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rngDraft() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, n);
  }

  function openDraft() {
    state = 'draft';
    anchor = null;
    draftChoices = pickCards(owned.has('perk.fourth') ? 4 : 3);
    ui.draftTitle.textContent = `LOOP ${loops} CLEARED`;
    renderDraft();
    ui.draft.classList.remove('hidden');
  }

  function renderDraft() {
    ui.cards.innerHTML = '';
    for (const k of draftChoices) {
      const c = CARDS[k];
      const b = document.createElement('button');
      b.className = 'card';
      const lv = taken[k] && c.max > 1 && c.max < 99 ? `<em class="lv">Lv ${taken[k] + 1}</em>` : '';
      b.innerHTML = `<div class="ic">${c.icon}</div><div><b>${c.name}${lv}</b><span>${c.desc}</span></div>`;
      b.addEventListener('click', () => pickCard(k));
      ui.cards.appendChild(b);
    }
    ui.reroll.style.display = rerolls > 0 ? '' : 'none';
    ui.reroll.textContent = `🎲 Reroll (${rerolls})`;
  }

  function pickCard(k) {
    if (state !== 'draft') return;
    taken[k] = (taken[k] || 0) + 1;
    if (k === 'shield') shields++;
    else if (k === 'eraser') eraseOldest(2);
    else if (k === 'golden') perks.golden += 2;
    else perks[k]++;
    sfx.pick(); buzz('light');
    ui.draft.classList.add('hidden');
    texts.push({ x: W / 2, y: H * 0.42, s: CARDS[k].name.toUpperCase(), c: COLORS.accent, life: 60, big: true });
    state = 'play';
    started = false;          // wait for touch so the player can plan
  }

  // ---------- Rendering ----------
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cv.width, cv.height);

    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + sx * scale), dpr * (oy + sy * scale));

    // Arena + grid.
    ctx.fillStyle = COLORS.arena;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 40; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 40; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (state === 'menu') { renderAttract(); return; }

    // Giant faint loop number.
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.font = '900 180px system-ui, sans-serif';
    ctx.fillText(String(loops + 1), W / 2, H / 2);

    // Next loop's gems (planning layer).
    ctx.strokeStyle = 'rgba(255,211,77,0.32)';
    ctx.lineWidth = 1.5;
    for (const g of nextGems) diamond(g.x, g.y, GEM_R * 0.75, false);

    for (const g of ghosts) drawGhost(g);

    for (const g of gems) if (g.alive) drawGem(g.x, g.y);
    if (rewind) drawRewind(rewind.x, rewind.y);

    if (state !== 'dead') drawPlayer();

    // FX.
    for (const r of rings) {
      ctx.globalAlpha = r.life / 30;
      ctx.strokeStyle = r.c;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    for (const t of texts) {
      ctx.globalAlpha = Math.min(1, t.life / 20);
      ctx.fillStyle = t.c;
      ctx.font = t.big ? '900 34px system-ui, sans-serif' : '800 14px system-ui, sans-serif';
      ctx.fillText(t.s, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    drawHud();

    if (flash > 0.02) {
      ctx.fillStyle = `rgba(255,77,109,${flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function diamond(x, y, s, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.8, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.8, y);
    ctx.closePath();
    if (fill) ctx.fill(); else ctx.stroke();
  }

  function drawPlayer() {
    const sk = SKINS[skin];
    const pr = playerR();
    if (trail.length >= 4) {
      ctx.strokeStyle = hexA(sk.core, 0.25);
      ctx.lineWidth = pr * 1.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(trail[0], trail[1]);
      for (let i = 2; i < trail.length; i += 2) ctx.lineTo(trail[i], trail[i + 1]);
      ctx.stroke();
    }
    const ghosted = phaseT > 0 || (invuln > 0 && time % 8 < 4);
    ctx.globalAlpha = ghosted ? 0.35 : 1;
    ctx.fillStyle = hexA(sk.core, 0.18);
    circle(px, py, pr * 2);
    ctx.fillStyle = sk.body;
    circle(px, py, pr);
    ctx.fillStyle = sk.core;
    circle(px, py, pr * 0.45);
    ctx.globalAlpha = 1;
    // Shield rings.
    ctx.strokeStyle = hexA(COLORS.accent, 0.7);
    ctx.lineWidth = 2;
    for (let i = 0; i < shields; i++) {
      ctx.beginPath(); ctx.arc(px, py, pr + 5 + i * 4, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawGhost(g) {
    const s = Math.min(step, LOOP_STEPS - 1);
    const gx = g.path[s * 2], gy = g.path[s * 2 + 1];
    const col = (a) => `hsla(${g.hue},90%,62%,${a})`;
    const expiring = perks.fade && loops - g.born >= FADE_AGE - 1;
    const baseA = expiring ? 0.45 : 1;
    const gr = grace();

    // Future preview dots.
    ctx.fillStyle = col(0.28);
    for (let k = s + 3; k < Math.min(LOOP_STEPS, s + PREVIEW); k += 3) {
      ctx.globalAlpha = (1 - (k - s) / PREVIEW) * baseA;
      circle(g.path[k * 2], g.path[k * 2 + 1], 2.2);
    }
    ctx.globalAlpha = baseA;

    if (s < gr && state !== 'dead') {
      // Inactive fade-in: growing dashed outline.
      ctx.strokeStyle = col(0.6);
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(gx, gy, R * (0.4 + 0.6 * s / gr), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      return;
    }

    // Short past trail.
    const from = Math.max(gr, s - 12);
    if (s - from >= 2) {
      ctx.strokeStyle = col(0.22);
      ctx.lineWidth = R * 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(g.path[from * 2], g.path[from * 2 + 1]);
      for (let k = from + 1; k <= s; k++) ctx.lineTo(g.path[k * 2], g.path[k * 2 + 1]);
      ctx.stroke();
    }
    // Harvest radius hint.
    ctx.fillStyle = col(0.12);
    circle(gx, gy, harvestR());
    ctx.fillStyle = col(0.95);
    circle(gx, gy, R);
    if (g.mult > 1) {
      ctx.strokeStyle = COLORS.gem;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gx, gy, R + 3, 0, Math.PI * 2); ctx.stroke();
    }
    // Little eyes so echoes read as "you", not bullets.
    ctx.fillStyle = 'rgba(11,13,23,0.85)';
    circle(gx - 3.2, gy - 1.5, 1.8);
    circle(gx + 3.2, gy - 1.5, 1.8);
    ctx.globalAlpha = 1;
  }

  function drawGem(x, y) {
    const pulse = 1 + Math.sin(time * 0.15 + x) * 0.12;
    ctx.fillStyle = 'rgba(255,211,77,0.14)';
    circle(x, y, GEM_R * 1.7 * pulse);
    ctx.fillStyle = COLORS.gem;
    diamond(x, y, GEM_R * pulse, true);
  }

  function drawRewind(x, y) {
    const pulse = 1 + Math.sin(time * 0.12) * 0.1;
    ctx.fillStyle = 'rgba(108,140,255,0.18)';
    circle(x, y, GEM_R * 2 * pulse);
    ctx.strokeStyle = COLORS.rew;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    const r = GEM_R * 0.9;
    const a0 = -time * 0.06;
    ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + Math.PI * 1.5); ctx.stroke();
    const ax = x + Math.cos(a0) * r, ay = y + Math.sin(a0) * r;
    ctx.fillStyle = COLORS.rew;
    ctx.beginPath();
    ctx.moveTo(ax + Math.cos(a0 - 1.2) * 7, ay + Math.sin(a0 - 1.2) * 7);
    ctx.lineTo(ax + Math.cos(a0 + 0.6) * 6, ay + Math.sin(a0 + 0.6) * 6);
    ctx.lineTo(ax + Math.cos(a0 + 2.6) * 6, ay + Math.sin(a0 + 2.6) * 6);
    ctx.closePath();
    ctx.fill();
  }

  function drawHud() {
    const q = quotaNow();
    const met = collected >= q;
    const frac = 1 - step / LOOP_STEPS;
    const urgent = !met && step > LOOP_STEPS - 90;

    // Loop timer bar.
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, W, 5);
    ctx.fillStyle = urgent ? (time % 16 < 8 ? COLORS.danger : COLORS.gem) : (met ? COLORS.ok : COLORS.gem);
    ctx.fillRect(0, 0, W * frac, 5);

    // Quota (centre).
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.fillStyle = met ? COLORS.ok : (urgent ? COLORS.danger : COLORS.gem);
    ctx.fillText(`◆ ${collected}/${q}`, W / 2, 30);
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(met ? 'QUOTA MET · BONUS GEMS' : 'QUOTA', W / 2, 50);

    // Left: loop + score + build status.
    ctx.textAlign = 'left';
    ctx.font = '800 16px system-ui, sans-serif';
    ctx.fillStyle = COLORS.fg;
    ctx.fillText(`LOOP ${loops + 1}`, 12, 22);
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(`${totalYou + totalEcho} ◆ total`, 12, 40);
    let status = '';
    if (shields) status += '🛡️'.repeat(shields) + ' ';
    if (perks.phase) status += phaseCharge ? '🌀 ' : '';
    if (perks.golden) status += `✨${perks.golden}`;
    if (status) ctx.fillText(status, 12, 58);

    ctx.textAlign = 'center';
    if (state === 'play' && !started) {
      ctx.fillStyle = 'rgba(11,13,23,0.62)';
      ctx.fillRect(0, H * 0.4, W, 92);
      ctx.fillStyle = COLORS.fg;
      ctx.font = '800 22px system-ui, sans-serif';
      ctx.fillText(loops === 0 ? 'Drag anywhere to start' : 'Drag to continue', W / 2, H * 0.4 + 32);
      ctx.fillStyle = COLORS.muted;
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillText(`Collect ${q} ◆ before the bar runs out`, W / 2, H * 0.4 + 64);
    }
    // Contextual tips for the first runs.
    if (runs < 3 && loops < TIPS.length && state === 'play') {
      ctx.fillStyle = 'rgba(11,13,23,0.7)';
      ctx.fillRect(0, H - 44, W, 44);
      ctx.fillStyle = COLORS.fg;
      ctx.font = '600 12.5px system-ui, sans-serif';
      ctx.fillText(TIPS[loops], W / 2, H - 22, W - 16);
    }
    if (paused) {
      ctx.fillStyle = 'rgba(11,13,23,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.fg;
      ctx.font = '900 30px system-ui, sans-serif';
      ctx.fillText('PAUSED', W / 2, H / 2 - 14);
      ctx.fillStyle = COLORS.muted;
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.fillText('touch to resume', W / 2, H / 2 + 18);
    }
  }

  // Menu background: echoes drifting on looping curves.
  function renderAttract() {
    const t = time / 60;
    for (let i = 0; i < 6; i++) {
      const hue = (190 + i * 47) % 360;
      const fx = (k) => W / 2 + Math.sin(k * (0.5 + i * 0.13) + i) * (W * 0.38);
      const fy = (k) => H / 2 + Math.cos(k * (0.37 + i * 0.09) + i * 2) * (H * 0.36);
      ctx.fillStyle = `hsla(${hue},90%,62%,0.25)`;
      for (let k = 1; k <= 10; k++) circle(fx(t + k * 0.05), fy(t + k * 0.05), 2.2);
      ctx.fillStyle = `hsla(${hue},90%,62%,0.18)`;
      circle(fx(t), fy(t), R * 1.7);
      ctx.fillStyle = `hsla(${hue},90%,62%,0.9)`;
      circle(fx(t), fy(t), R);
    }
  }

  // ---------- Screens ----------
  function refreshMenu() {
    ui.menuBest.textContent = best > 0 ? `Best: ${best} gems` : '';
    const db = +store.get('daily2.' + today(), 0);
    ui.dailyBest.textContent = db > 0 ? `· today ${db}` : '';
    ui.menuShards.textContent = `· ◆ ${shards}`;
    ui.mute.textContent = muted ? '🔇' : '🔊';
  }

  // Every purchasable thing, for the Lab and the "next unlock" hint.
  function shopItems() {
    const items = [];
    for (const k of Object.keys(CARDS)) {
      const c = CARDS[k];
      if (c.unlock) items.push({ id: 'card.' + k, group: 'New cards', icon: c.icon, name: c.name, desc: c.desc, cost: c.unlock });
    }
    for (const k of Object.keys(PERKS)) {
      const p = PERKS[k];
      items.push({ id: 'perk.' + k, group: 'Upgrades', icon: p.icon, name: p.name, desc: p.desc, cost: p.cost });
    }
    for (const k of Object.keys(SKINS)) {
      const s = SKINS[k];
      items.push({ id: 'skin.' + k, group: 'Skins', skin: k, name: s.name, desc: 'Player color', cost: s.cost });
    }
    return items;
  }
  const isOwned = (it) => it.cost === 0 || owned.has(it.id);

  function nextUnlockHint() {
    const open = shopItems().filter((it) => !isOwned(it)).sort((a, b) => a.cost - b.cost);
    if (!open.length) return 'Everything unlocked. Chase that high score!';
    if (shards >= open[0].cost) return '<b>You can afford a new unlock in the Lab!</b>';
    return `${open[0].cost - shards} more ◆ to unlock <b>${open[0].name}</b>`;
  }

  function renderLab() {
    ui.labShards.textContent = shards;
    ui.labList.innerHTML = '';
    let group = '';
    for (const it of shopItems()) {
      if (it.group !== group) {
        group = it.group;
        const h = document.createElement('h3');
        h.textContent = group.toUpperCase();
        ui.labList.appendChild(h);
      }
      const row = document.createElement('div');
      row.className = 'item';
      const ic = it.skin
        ? `<div class="ic"><div class="swatch" style="background:${SKINS[it.skin].body};border-color:${SKINS[it.skin].core}"></div></div>`
        : `<div class="ic">${it.icon}</div>`;
      row.innerHTML = `${ic}<div class="txt"><b>${it.name}</b><span>${it.desc}</span></div>`;
      const b = document.createElement('button');
      if (isOwned(it)) {
        if (it.skin) {
          const on = skin === it.skin;
          b.textContent = on ? 'Equipped' : 'Equip';
          b.className = on ? 'owned' : '';
          b.addEventListener('click', () => { skin = it.skin; saveMeta(); renderLab(); });
        } else {
          b.textContent = '✓ Owned';
          b.className = 'owned';
        }
      } else {
        b.textContent = `◆ ${it.cost}`;
        b.className = 'buy';
        b.disabled = shards < it.cost;
        b.addEventListener('click', () => {
          if (shards < it.cost) return;
          shards -= it.cost;
          owned.add(it.id);
          if (it.skin) skin = it.skin;
          saveMeta();
          sfx.quota(); buzz('medium');
          toast(`Unlocked ${it.name}!`);
          renderLab();
        });
      }
      row.appendChild(b);
      ui.labList.appendChild(row);
    }
  }

  function openLab() {
    renderLab();
    ui.labScreen.scrollTop = 0;
    ui.labScreen.classList.remove('hidden');
  }
  function closeLab() {
    ui.labScreen.classList.add('hidden');
    refreshMenu();
    if (state === 'dead' && lastResult) ui.unlockHint.innerHTML = nextUnlockHint();
  }

  function showGameOver() {
    if (state !== 'dead' || !lastResult) return;
    const r = lastResult;
    ui.score.textContent = r.total;
    ui.overLoop.textContent = r.loops + 1;
    ui.split.innerHTML = `You <b>${r.you}</b> · Echoes harvested <b>${r.echo}</b>`;
    ui.cause.textContent = r.cause;
    ui.overTitle.textContent = r.mode === 'daily' ? `DAILY LOOP · ${today()}` : 'GAME OVER';
    ui.newBest.textContent = r.isBest ? '★ New best!' : '';
    ui.earn.textContent = r.total ? `+${r.total} ◆ shards banked` : '';
    ui.unlockHint.innerHTML = nextUnlockHint();
    ui.over.classList.remove('hidden');
  }

  function goMenu() {
    state = 'menu';
    ui.over.classList.add('hidden');
    ui.menu.classList.remove('hidden');
    resize();
    refreshMenu();
  }

  function toast(msg) {
    ui.toast.textContent = msg;
    ui.toast.classList.remove('hidden');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => ui.toast.classList.add('hidden'), 1600);
  }

  async function share() {
    if (!lastResult) return;
    const r = lastResult;
    const text = r.mode === 'daily'
      ? `Loopback Daily ${today()}: ${r.total} ◆ · loop ${r.loops + 1} · my echoes harvested ${r.echo}. Can you beat me?`
      : `Loopback: ${r.total} ◆ · reached loop ${r.loops + 1} before my past self caught me.`;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    } catch (e) { /* user cancelled */ }
  }

  // ---------- Input ----------
  cv.addEventListener('pointerdown', (e) => {
    if (state !== 'play') return;   // newest touch always takes over (guards against lost pointerups)
    e.preventDefault();
    audioInit();
    const now = performance.now();
    if (started && !paused && phaseCharge > 0 && now - lastDownT < 280) {
      phaseCharge = 0; phaseT = 30;
      rings.push({ x: px, y: py, r: 6, life: 20, c: '#b46bff' });
      sfx.phase(); buzz('medium');
    }
    lastDownT = now;
    paused = false;
    started = true;
    const p = toWorld(e);
    anchor = { id: e.pointerId, x: p.x, y: p.y, px: tx, py: ty };
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!anchor || e.pointerId !== anchor.id) return;
    const p = toWorld(e);
    const rx = anchor.px + (p.x - anchor.x) * SENS;
    const ry = anchor.py + (p.y - anchor.y) * SENS;
    tx = Math.max(R, Math.min(W - R, rx));
    ty = Math.max(R + 6, Math.min(H - R, ry));
    // Re-anchor when clamped so reversing direction responds immediately.
    if (tx !== rx) anchor.x = p.x - (tx - anchor.px) / SENS;
    if (ty !== ry) anchor.y = p.y - (ty - anchor.py) / SENS;
  });
  const release = (e) => { if (anchor && e.pointerId === anchor.id) anchor = null; };
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);

  const tap = (el, fn) => el.addEventListener('click', (e) => { e.preventDefault(); audioInit(); fn(); });
  tap(ui.play, () => newGame('classic'));
  tap(ui.daily, () => newGame('daily'));
  tap(ui.lab, openLab);
  tap(ui.overLab, openLab);
  tap(ui.labBack, closeLab);
  tap(ui.retry, () => newGame(lastResult ? lastResult.mode : 'classic'));
  tap(ui.home, goMenu);
  tap(ui.share, share);
  tap(ui.reroll, () => { if (rerolls > 0) { rerolls--; draftChoices = pickCards(draftChoices.length); renderDraft(); } });
  tap(ui.mute, () => { muted = !muted; store.set('mute', muted ? 1 : 0); refreshMenu(); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'play' && started) { paused = true; anchor = null; }
  });
  window.addEventListener('resize', resize);
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- Main loop ----------
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    while (acc >= STEP) { tick(); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }

  resize();
  refreshMenu();
  requestAnimationFrame(frame);

  // Offline support on the web (Capacitor native apps bundle files already).
  const native = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !native) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // Test hook for automated playtesting.
  window.__loopback = {
    get state() {
      return { state, loops, step, ghosts: ghosts.length, collected, quota: quotaNow(), gems: gems.filter((g) => g.alive), nextGems, px, py, H, totalYou, totalEcho, shards, started, draftChoices };
    },
    // Echo positions `ahead` steps into the future (for the test bot).
    echoes(ahead = 0) {
      const s = Math.min(step + ahead, LOOP_STEPS - 1);
      return step + ahead < grace() ? [] : ghosts.map((g) => ({ x: g.path[s * 2], y: g.path[s * 2 + 1] }));
    },
    setTarget(x, y) { tx = x; ty = y; started = true; },
    newGame, pickCard, tick,
  };
})();
