'use strict';
/* ===== performance governor =====
   Watches real frame times and moves between quality tiers so the game stays fluid on any phone.
   Tiers trade render resolution, shader octaves, particle counts and terrain detail. */
const TIERS = [
  {name:'Battery',  dpr:1.15, px:1.2e6, glpx:0.5e6, gl:0.75,  oct:3, smoke:160, fx:50,  horizon:64,  cloudStep:2, stars:380, pred:18},
  {name:'Balanced', dpr:1.5,  px:2.0e6, glpx:1.0e6, gl:1.0,  oct:4, smoke:360, fx:90,  horizon:96,  cloudStep:1, stars:620, pred:12},
  {name:'High',     dpr:2,    px:3.2e6, glpx:1.8e6, gl:1.5, oct:5, smoke:650, fx:120, horizon:140, cloudStep:1, stars:900, pred:8},
];
const PERF = (() => {
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('orbitforge2.perf')) || {}; } catch (e){}
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  const guess = mem >= 6 && cores >= 8 ? 2 : mem >= 4 ? 1 : 0;
  return {
    mode:saved.mode || 'auto',                 // 'auto' | 0 | 1 | 2
    cap:saved.cap || 120,                       // frame-rate cap: 60, 90, 120, 144 (144 = uncapped)
    showFps:!!saved.showFps,
    tier:saved.mode != null && saved.mode !== 'auto' ? saved.mode : (saved.lastTier != null ? saved.lastTier : guess),
    ema:16, work:6, fps:60, slow:0, fast:0, lastChange:0, frames:0, fpsT:0, fpsN:0,
  };
})();
const Q = () => TIERS[PERF.tier];
function perfSave(){ try { localStorage.setItem('orbitforge2.perf', JSON.stringify({mode:PERF.mode, cap:PERF.cap, showFps:PERF.showFps, lastTier:PERF.tier})); } catch (e){} }
function setTier(t, why){
  t = clamp(t, 0, TIERS.length - 1); if (t === PERF.tier) return;
  PERF.tier = t; PERF.lastChange = performance.now(); PERF.slow = PERF.fast = 0;
  perfSave(); if (typeof resize === 'function') resize();
  if (typeof onTierChange === 'function') onTierChange(why);
}
/* called once per drawn frame: interval = time since previous drawn frame, work = JS time spent this frame */
function perfFrame(interval, work, now){
  PERF.ema += (interval - PERF.ema) * 0.08; PERF.work += (work - PERF.work) * 0.08;
  PERF.fpsN++; if (now - PERF.fpsT > 500){ PERF.fps = PERF.fpsN * 1000 / (now - PERF.fpsT); PERF.fpsN = 0; PERF.fpsT = now; }
  if (PERF.mode !== 'auto' || now - PERF.lastChange < 2500) return;
  const target = 1000 / Math.min(PERF.cap, 120);
  if (PERF.ema > Math.max(target * 1.3, 1000 / 50) || PERF.work > 14) PERF.slow++; else PERF.slow = Math.max(0, PERF.slow - 1);
  if (PERF.ema < target * 1.08 && PERF.work < 5.5) PERF.fast++; else PERF.fast = 0;
  if (PERF.slow > 45){ setTier(PERF.tier - 1, 'down'); PERF.noUpUntil = now + 60000; }
  else if (PERF.fast > 2400 && now > (PERF.noUpUntil || 0)) setTier(PERF.tier + 1, 'up');
}
// even frame pacing: estimate the display refresh, then draw on every k-th refresh (no judder)
PERF.vs = 16.67; PERF.cnt = 0; PERF.lastRaf = 0;
function skipFrame(now){
  const raw = PERF.lastRaf ? now - PERF.lastRaf : 16.67; PERF.lastRaf = now;
  if (raw > 3 && raw < 40) PERF.vs += (raw - PERF.vs) * 0.05;
  if (PERF.cap >= 144) return false;
  const k = Math.max(1, Math.round((1000 / PERF.cap) / PERF.vs));
  PERF.cnt = (PERF.cnt + 1) % k; return PERF.cnt !== 0;
}
