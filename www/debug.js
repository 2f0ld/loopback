// Dev-only helpers, loaded by game.js when the URL has ?debug or ?shot=<name>.
// ?shot=play|draft|over|lab|goals stages a scene for store screenshots (see tools/screenshots.mjs).
(() => {
  'use strict';
  const L = window.__loopback;

  // Simple bot: chase the nearest gem, steer away from where echoes are about to be.
  function botStep() {
    const s = L.state;
    let goal = null, bd = 1e9;
    for (const g of s.gems) {
      const d = Math.hypot(g.x - s.px, g.y - s.py);
      if (d < bd) { bd = d; goal = g; }
    }
    let vx = 0, vy = 0;
    if (goal) { vx = (goal.x - s.px) / (bd || 1); vy = (goal.y - s.py) / (bd || 1); }
    for (const a of [0, 5, 10, 16]) {
      for (const e of L.echoes(a)) {
        const dx = s.px - e.x, dy = s.py - e.y, d = Math.hypot(dx, dy);
        if (d < 50) { const k = (50 - d) / 50 * 3; vx += dx / (d || 1) * k; vy += dy / (d || 1) * k; }
      }
    }
    L.setTarget(Math.max(12, Math.min(348, s.px + vx * 20)), Math.max(16, Math.min(s.H - 12, s.py + vy * 20)));
    L.tick();
  }

  // Plays until `until(state)` is true; retries fresh runs if the bot dies first.
  function playUntil(until, opts = {}) {
    for (let attempt = 0; attempt < 30; attempt++) {
      L.newGame('classic');
      for (let t = 0; t < 360 * 40; t++) {
        const s = L.state;
        if (until(s)) return true;
        if (s.state === 'dead') break;
        if (s.state === 'draft') {
          if (opts.stopAtDraft) return true;
          L.pickCard(s.draftChoices[0]);
        }
        botStep();
      }
      if (opts.allowDeath && L.state.state === 'dead') return true;
    }
    return false;
  }

  window.__bot = { botStep, playUntil };

  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return;
  L.skipTutorial();
  L.setShards(shot === 'lab' ? 260 : 0);
  const style = document.createElement('style');
  // Enlarge the HTML UI so wide headless viewports look like a phone.
  const z = (window.innerWidth / 380).toFixed(3);
  style.textContent = `#toast { display: none !important; } .screen { transition: none !important; } .screen > *, button.icon { zoom: ${z}; }`;
  document.head.appendChild(style);
  if (shot === 'play') {
    playUntil((s) => s.state === 'play' && s.loops >= 7 && s.step === 200);
    L.freeze(true);
  } else if (shot === 'draft') {
    playUntil((s) => s.loops >= 6 && s.state === 'draft', { stopAtDraft: false });
  } else if (shot === 'over') {
    // A mid-game death reads better than a cluttered late-game board.
    playUntil((s) => s.state === 'dead' && s.loops >= 7 && s.loops <= 13);
  } else if (shot === 'lab') {
    L.openLab();
  } else if (shot === 'goals') {
    L.openGoals();
  }
  document.documentElement.dataset.shotReady = '1';
})();
