'use strict';
/* ===== autopilot: launch, orbit, Hohmann transfers to the Moon and planets, capture, landing =====
   Real orbital mechanics: transfer windows from phase angles, hyperbolic ejection at the right point in
   the parking orbit, a prograde/retrograde correction chosen by searching the predicted miss distance,
   capture at periapsis, and a suicide-burn style descent on airless worlds. */
const AP_TARGETS = [
  {id:'leo', name:'Earth orbit', body:'earth', mode:'orbit'},
  {id:'earthland', name:'Land back on Earth', body:'earth', mode:'land'},
  {id:'moon', name:'Moon orbit', body:'moon', mode:'orbit'},
  {id:'moonland', name:'Land on the Moon', body:'moon', mode:'land'},
  {id:'mercury', name:'Mercury orbit', body:'mercury', mode:'orbit'},
  {id:'mercuryland', name:'Land on Mercury', body:'mercury', mode:'land'},
  {id:'venus', name:'Venus orbit', body:'venus', mode:'orbit'},
  {id:'mars', name:'Mars orbit', body:'mars', mode:'orbit'},
  {id:'jupiter', name:'Jupiter orbit', body:'jupiter', mode:'orbit'},
  {id:'saturn', name:'Saturn orbit', body:'saturn', mode:'orbit'},
  {id:'uranus', name:'Uranus orbit', body:'uranus', mode:'orbit'},
  {id:'neptune', name:'Neptune orbit', body:'neptune', mode:'orbit'},
];
const wrapPos = a => ((a % TAU) + TAU) % TAU;
function apStart(id){
  const tg = AP_TARGETS.find(t => t.id === id); if (!F || !tg || F.dead) return;
  const T = B[tg.body];
  F.ap = {tg, T, phase:'', msg:'', tries:0, cool:0, tick:0};
  F.sas = 'free';
  const el = F.landed ? null : currentEl();
  const stableEarth = F.p === EARTH && el && el.e < 1 && peOf(el) > EARTH.R + EARTH.atm.top;
  if (tg.id === 'earthland'){ if (F.p !== EARTH){ F.ap = null; hooks.toast('Fly back into Earth\u2019s gravity first'); return; } if (F.landed){ F.ap = null; hooks.toast('Already on the ground'); return; } if (!countKind(F.parts, 'shield') || !countKind(F.parts, 'chute')){ F.ap = null; hooks.toast('This vessel needs an Ablative Shield and a Canopy Pack to land on Earth'); return; } setPhase('deorbitE'); }
  else if (F.p === T && T !== EARTH) setPhase(tg.mode === 'land' && el && el.e < 1 ? 'deorbit' : 'capture');
  else if (F.p === EARTH && (F.landed || !stableEarth)) setPhase(F.landed ? 'ascent' : (el && apOf(el) - EARTH.R > 140e3 ? 'coastAp' : 'ascent'));
  else if (stableEarth) setPhase(T === EARTH ? 'done' : T === B.moon ? 'tliWait' : 'windowWait');
  else if (F.p === SUN && T.parentB === SUN) setPhase('correct');
  else { F.ap = null; hooks.toast('The autopilot can’t plan that route from here'); return; }
  AUD.sfx('auto'); hooks.toast('Autopilot engaged: ' + tg.name);
}
function apStop(msg){ if (!F || !F.ap) return; AUD.sfx('autoOff'); F.ap = null; F.apAng = null; setThrottleRaw(0); F.warp = 0; if (msg) hooks.toast(msg); hooks.onChange(); }
function setPhase(p){ F.ap.phase = p; F.ap.t0 = F.t; F.ap.userWarp = null; }
function thrustAvail(){ return liveEngines().reduce((s, i) => s + defOf(F.parts[i]).thrust, 0); }
function burnTime(dv){ const th = thrustAvail(); if (th <= 0) return 0; const m0 = totalMass(F.parts), isp = 320; return m0 * (1 - Math.exp(-Math.abs(dv) / (isp * G0))) / (th / (isp * G0)); }
function aligned(tol){ return F.apAng != null && Math.abs(wrapPi(F.apAng - F.ang)) < (tol || 0.06); }
function apWarp(tte){
  const cap = warpCap(); let i = 0;
  if (tte > 3) for (let k = cap; k >= 0; k--) if (WARPS[k] * 1.5 <= tte){ i = k; break; }
  // the player's own warp choice wins: faster is allowed until ~0.35 s (real time) before the next event
  const u0 = F.ap.userWarp;
  if (u0 != null){
    if (u0 > i){ let u = Math.min(u0, cap); while (u > 0 && WARPS[u] * 0.35 > tte) u--; i = Math.max(i, u); }
    else i = u0;
  }
  F.warp = i;
}
function progradeAng(){ return Math.atan2(F.vy, F.vx); }
function surfRetroAng(){ const [vx, vy] = airVel(); return Math.atan2(-vy, -vx); }
function timeToAnomaly(el, Mt){ const M = el.e < 1 ? wrapPi(el.M0 + el.n * (F.t - el.t0)) : el.M0 + el.n * (F.t - el.t0); return el.e < 1 ? wrapPos(Mt - M) / el.n : Math.max(0, (Mt - M) / el.n); }
function autoStage(){
  if (F.ap.cool > 0) return;
  if (F.throttle > 0 && !liveEngines().length){
    const more = F.decQ.some(g => g.some(u => F.parts.some(p => p.uid === u)));
    if (more){ doStage(); F.ap.cool = 0.6; } else apStop('Autopilot stopped: out of fuel');
  }
}
function capAlt(T){ return T.atm ? T.atm.top + 120e3 : Math.max(50e3, T.R * 0.08); }
/* closest approach to child body c of the current parent if we add dv along prograde now */
function missFor(dv, c, horizon){
  const sp = Math.hypot(F.vx, F.vy), ux = F.vx / sp, uy = F.vy / sp;
  const el = toEl(F.x, F.y, F.vx + ux * dv, F.vy + uy * dv, F.p.mu, F.t), N = 360;
  let best = Infinity, bt = F.t;
  for (let k = 1; k <= N; k++){ const t = F.t + horizon * k / N, s = prop(el, t), q = relB(c, t), d = Math.hypot(s.x - q.x, s.y - q.y); if (d < best){ best = d; bt = t; } }
  let lo = Math.max(F.t, bt - horizon / N), hi = bt + horizon / N;
  const f = t => { const s = prop(el, t), q = relB(c, t); return Math.hypot(s.x - q.x, s.y - q.y); };
  for (let k = 0; k < 40; k++){ const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1; }
  const t = (lo + hi) / 2, s = prop(el, t), q = relB(c, t);
  return {d:f(t), t, vinf:Math.hypot(s.vx - q.vx, s.vy - q.vy)};
}
function planCorrection(){
  const T = F.ap.T, c = T;
  const horizon = T === B.moon ? 7 * DAY : Math.PI * Math.sqrt(((EARTH.a + T.a) / 2) ** 3 / SUN.mu) * 1.6;
  const rp = T.R + capAlt(T);
  const err = dv => { const m = missFor(dv, c, horizon), b = rp * Math.sqrt(1 + 2 * T.mu / (rp * Math.max(m.vinf, 50) ** 2)); return Math.abs(m.d - b); };
  const D = T === B.moon ? 120 : 600, n = 48;
  let bestDv = 0, bestE = Infinity;
  for (let k = 0; k <= n; k++){ const dv = -D + 2 * D * k / n, e = err(dv); if (e < bestE){ bestE = e; bestDv = dv; } }
  let lo = bestDv - 2 * D / n, hi = bestDv + 2 * D / n;
  for (let k = 0; k < 30; k++){ const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (err(m1) < err(m2)) hi = m2; else lo = m1; }
  return (lo + hi) / 2;
}

function apFrame(dt){
  const A = F.ap; if (!A || F.dead) return;
  A.cool = Math.max(0, A.cool - dt); A.tick++;
  const T = A.T, b = F.p, el = F.landed ? null : currentEl(), alt = altNow(), mass = totalMass(F.parts);
  switch (A.phase){
    case 'ascent': {
      const up = Math.atan2(F.y, F.x), pitch = clamp(Math.pow(Math.max(0, alt - 1200) / 110000, 0.5), 0, 1) * Math.PI / 2 * 0.98;
      F.apAng = up - pitch; setThrottleRaw(1); autoStage();
      const apAlt = el && el.e < 1 ? apOf(el) - b.R : 0;
      A.msg = 'Ascent · apoapsis ' + fDist(Math.max(0, apAlt));
      if (apAlt > 150e3){ setThrottleRaw(0); setPhase('coastAp'); }
      F.warp = warpCap();
      break;
    }
    case 'coastAp': {
      setThrottleRaw(0); F.apAng = progradeAng();
      const ra = apOf(el), vAp = Math.sqrt(b.mu * (2 / ra - 1 / el.a)), dv = Math.sqrt(b.mu / ra) - vAp;
      const tAp = timeToAnomaly(el, Math.PI), lead = burnTime(dv) / 2 + 8;
      A.msg = 'Coasting to apoapsis · ' + fTime(tAp);
      if (tAp < lead || (el.e < 1 && tAp > el.n ** -1 * TAU * 0.8 && alt > 100e3)) setPhase('circ');
      else apWarp(tAp - lead);
      break;
    }
    case 'circ': {
      const up = Math.atan2(F.y, F.x), pro = progradeAng();
      const vr = (F.x * F.vx + F.y * F.vy) / Math.hypot(F.x, F.y);
      F.apAng = pro + clamp(-vr / 300, -0.25, 0.25) * (wrapPi(up - pro) > 0 ? 1 : -1);
      const pe = peOf(el) - b.R, apA = apOf(el) - b.R, goalPe = Math.min(apA - 4e3, 150e3);
      setThrottleRaw(aligned(0.12) ? clamp((goalPe - pe) / 40e3 + 0.05, 0.05, 1) : 0); autoStage();
      A.msg = 'Circularising · periapsis ' + fDist(Math.max(0, pe));
      if (pe >= goalPe - 1e3 || (el.e < 0.005 && pe > 120e3)){ setThrottleRaw(0); setPhase(T === EARTH ? 'done' : T === B.moon ? 'tliWait' : 'windowWait'); }
      F.warp = Math.min(warpCap(), wi(4));
      break;
    }
    case 'tliWait': {
      setThrottleRaw(0); F.apAng = progradeAng();
      const r1 = Math.hypot(F.x, F.y), r2 = T.a, at = (r1 + r2) / 2, tH = Math.PI * Math.sqrt(at ** 3 / b.mu), phi = Math.PI - T.n * tH;
      const s = Math.sign(F.x * F.vy - F.y * F.vx) || -1, m = relB(T, F.t);
      const lead = wrapPos(s * (Math.atan2(m.y, m.x) - Math.atan2(F.y, F.x))), nv = Math.sqrt(b.mu / r1 ** 3);
      const wait = wrapPos(lead - phi) / (nv - T.n), dv = Math.sqrt(b.mu * (2 / r1 - 1 / at)) - Math.sqrt(b.mu / r1), half = burnTime(dv) / 2;
      A.msg = 'Waiting for the Moon transfer window · ' + fTime(wait - half);
      if (wait - half < 4) setPhase('tliBurn'); else apWarp(wait - half - 4);
      break;
    }
    case 'tliBurn': {
      F.apAng = progradeAng(); setThrottleRaw(aligned() ? 1 : 0); autoStage();
      const ap = apOf(el); A.msg = 'Trans-lunar injection · apoapsis ' + fDist(Math.min(ap, 9e9) - b.R);
      if (ap >= T.a - T.soi * 0.15){ setThrottleRaw(0); setPhase('correct'); }
      F.warp = Math.min(warpCap(), wi(10));
      break;
    }
    case 'windowWait': {
      setThrottleRaw(0); F.apAng = progradeAng();
      const r1 = EARTH.a, r2 = T.a, at = (r1 + r2) / 2, tH = Math.PI * Math.sqrt(at ** 3 / SUN.mu), phi = Math.PI - T.n * tH;
      const e = absB(EARTH, F.t), q = absB(T, F.t), lead = wrapPos(-(Math.atan2(q.y, q.x) - Math.atan2(e.y, e.x))), rel = EARTH.n - T.n;
      const wait = rel > 0 ? wrapPos(lead - phi) / rel : wrapPos(phi - lead) / -rel;
      const per = TAU / Math.sqrt(b.mu / Math.hypot(F.x, F.y) ** 3);
      A.msg = 'Waiting for the ' + T.name + ' launch window · ' + fTime(wait);
      if (wait < per * 1.2 + 600 || wait > 0.999 * TAU / Math.abs(rel)) setPhase('ejectWait'); else apWarp(wait - per * 1.2 - 600);
      break;
    }
    case 'ejectWait': {
      setThrottleRaw(0); F.apAng = progradeAng();
      const r1 = EARTH.a, at = (r1 + T.a) / 2, vE = EARTH.a * EARTH.n, vinf = Math.sqrt(SUN.mu * (2 / r1 - 1 / at)) - vE;
      const e = absB(EARTH, F.t), alpha = Math.atan2(e.vy, e.vx) + (vinf < 0 ? Math.PI : 0);
      const rp = Math.hypot(F.x, F.y), ecc = 1 + rp * vinf * vinf / b.mu, nuInf = Math.acos(-1 / ecc), s = Math.sign(F.x * F.vy - F.y * F.vx) || -1;
      const thB = alpha - s * nuInf, nv = Math.sqrt(b.mu / rp ** 3);
      const dv = Math.sqrt(vinf * vinf + 2 * b.mu / rp) - Math.sqrt(b.mu / rp), half = burnTime(dv) / 2;
      const wait = wrapPos(s * (thB - Math.atan2(F.y, F.x))) / nv - half;
      A.vinf = Math.abs(vinf);
      A.msg = 'Lining up the escape burn · ' + fTime(Math.max(0, wait));
      if (wait < 3) setPhase('ejectBurn'); else apWarp(wait - 3);
      break;
    }
    case 'ejectBurn': {
      F.apAng = progradeAng(); setThrottleRaw(aligned() ? 1 : 0); autoStage();
      const r = Math.hypot(F.x, F.y), v2 = F.vx * F.vx + F.vy * F.vy, vinf = Math.sqrt(Math.max(0, v2 - 2 * b.mu / r));
      A.msg = 'Escape burn · excess speed ' + fVel(vinf) + ' of ' + fVel(A.vinf);
      if (vinf >= A.vinf){ setThrottleRaw(0); setPhase('coastExit'); }
      F.warp = Math.min(warpCap(), wi(10));
      break;
    }
    case 'coastExit': {
      setThrottleRaw(0); F.apAng = progradeAng();
      if (F.p === SUN){ setPhase('correct'); break; }
      if (A.tick % 20 === 1){ const pts = predictPatches(), ex = pts.find(p => p.ev && p.ev.k === 'exit'); A.tte = ex ? ex.t1 - F.t : 1e5; A.tt = F.t; }
      const tte = A.tte - (F.t - A.tt); A.msg = 'Leaving Earth’s gravity · ' + fTime(tte); apWarp(tte);
      break;
    }
    case 'correct': {
      setThrottleRaw(0); F.warp = 0;
      if (F.p !== T.parentB){ apStop('Autopilot stopped: off course'); break; }
      A.dv = planCorrection(); const sp = Math.hypot(F.vx, F.vy);
      A.u = [F.vx / sp, F.vy / sp]; A.v0 = [F.vx, F.vy];
      A.msg = 'Correction burn ' + fVel(Math.abs(A.dv));
      setPhase(Math.abs(A.dv) < 0.3 ? 'coastEnc' : 'corrBurn');
      break;
    }
    case 'corrBurn': {
      const pro = A.dv > 0; F.apAng = Math.atan2(A.u[1], A.u[0]) + (pro ? 0 : Math.PI);
      const ach = (F.vx - A.v0[0]) * A.u[0] + (F.vy - A.v0[1]) * A.u[1], rem = Math.abs(A.dv) - (pro ? ach : -ach);
      const acc = thrustAvail() / mass;
      setThrottleRaw(aligned(0.03) ? clamp(rem / Math.max(acc, 1e-3) / 1.5, 0.01, 1) : 0); autoStage();
      A.msg = 'Correction burn · ' + fVel(Math.max(0, rem)) + ' left';
      F.warp = rem > 40 ? Math.min(warpCap(), wi(10)) : 0;
      if (rem <= 0.15){ setThrottleRaw(0); setPhase('coastEnc'); }
      break;
    }
    case 'coastEnc': {
      setThrottleRaw(0); F.apAng = progradeAng();
      if (F.p === T){ setPhase('capture'); break; }
      if (A.tick % 30 === 1){
        const pts = predictPatches(), enc = pts.find(p => p.ev && p.ev.k === 'enter' && p.ev.c === T);
        if (!enc){ A.tries++; if (A.tries > 3){ apStop('Autopilot stopped: could not find an encounter with ' + T.name); break; } setPhase('correct'); break; }
        A.tte = enc.t1 - F.t; A.tt = F.t;
      }
      const tte = A.tte - (F.t - A.tt); A.msg = 'Coasting to ' + T.name + ' · ' + fTime(tte); apWarp(tte);
      break;
    }
    case 'capture': {
      const rp = peOf(el), want = T.R + capAlt(T), cap = capAlt(T), err = (rp - T.R) - cap;
      // first, trim the periapsis to a safe low altitude while still far out
      if (!A.peFixed){
        const tPe0 = timeToAnomaly(el, 0);
        if (Math.abs(err) > cap * 0.2 && tPe0 > 900 && (A.fixSign == null || Math.sign(err) === A.fixSign)){
          if (A.fixDir == null){
            const pro = progradeAng(); let best = null, bg = -Infinity;
            for (const a of [pro, pro + Math.PI, pro + Math.PI / 2, pro - Math.PI / 2]){
              const e2 = toEl(F.x, F.y, F.vx + Math.cos(a) * 2, F.vy + Math.sin(a) * 2, T.mu, F.t), g2 = Math.abs(err) - Math.abs(peOf(e2) - T.R - cap);
              if (g2 > bg){ bg = g2; best = a; }
            }
            A.fixDir = best - progradeAng(); A.fixSign = Math.sign(err);
          }
          F.apAng = progradeAng() + A.fixDir;
          setThrottleRaw(aligned(0.05) ? clamp(Math.abs(err) / (cap * 4), 0.02, 1) : 0); autoStage();
          A.msg = 'Adjusting ' + T.name + ' periapsis · ' + fDist(rp - T.R) + ' → ' + fDist(cap);
          F.warp = 0; break;
        }
        A.peFixed = true; setThrottleRaw(0);
      }
      const vpe = Math.sqrt(T.mu * (2 / rp - 1 / el.a)), dv = vpe - Math.sqrt(T.mu / rp), half = burnTime(dv) / 2;
      const tPe = timeToAnomaly(el, 0);
      F.apAng = Math.atan2(-F.vy, -F.vx);
      const burning = A.burning || (tPe < half + 2);
      if (burning){
        A.burning = true; setThrottleRaw(aligned() ? 1 : 0); autoStage(); F.warp = Math.min(warpCap(), wi(10));
        A.msg = 'Capture burn into ' + T.name + ' orbit';
        if (el.e < 0.12 || (el.e < 1 && apOf(el) < Math.max(rp * 1.6, want * 1.2))){ setThrottleRaw(0); A.burning = false; setPhase(A.tg.mode === 'land' ? 'deorbit' : 'done'); }
      } else { setThrottleRaw(0); A.msg = 'Periapsis at ' + T.name + ' in ' + fTime(tPe - half) + ' · ' + fDist(rp - T.R); apWarp(tPe - half - 3); }
      break;
    }
    case 'deorbit': {
      const r = Math.hypot(F.x, F.y), ux = F.x / r, uy = F.y / r, [vx, vy] = airVel(), vh = Math.abs(vx * -uy + vy * ux);
      F.apAng = surfRetroAng();
      if (!A.burning && el && el.e > 0.03){ const tPe = timeToAnomaly(el, 0), half = burnTime(vh) / 2; if (tPe > half + 2){ setThrottleRaw(0); A.msg = 'Deorbit burn in ' + fTime(tPe - half); apWarp(tPe - half - 2); break; } }
      A.burning = true; setThrottleRaw(aligned(0.05) ? clamp(vh / 60, 0.1, 1) : 0); autoStage(); F.warp = Math.min(warpCap(), wi(10));
      A.msg = 'Deorbit burn · horizontal ' + fVel(vh);
      if (vh < 12){ setThrottleRaw(0); A.burning = false; setPhase('descent'); }
      break;
    }
    case 'descent': {
      if (F.landed){ setPhase('done'); break; }
      const r = Math.hypot(F.x, F.y), ux = F.x / r, uy = F.y / r, [vx, vy] = airVel(), vz = vx * ux + vy * uy, vh = Math.hypot(vx - vz * ux, vy - vz * uy);
      const h = alt + F.bb.y0, g = b.mu / (r * r), amax = thrustAvail() / mass;
      F.apAng = h < 80 ? Math.atan2(uy, ux) + clamp(-(vx * -uy + vy * ux) * 0.02, -0.15, 0.15) : (vh > 1.5 || vz < -3 ? surfRetroAng() : Math.atan2(uy, ux));
      const vzT = h < 25 ? -2.2 : -clamp(Math.sqrt(2 * Math.max(0.3, amax * 0.55 - g) * Math.max(0, h - 15)), 2.2, 3000);
      const aProf = h < 25 ? 0 : Math.max(0.3, amax * 0.55 - g), need = (vz < vzT * 0.98 || h < 25 ? g + aProf : 0) + (vzT - vz) * 2;
      setThrottleRaw(aligned(0.2) || h < 300 ? clamp(need / Math.max(amax, 1e-3), 0, 1) : 0); if (F.throttle > 0) autoStage();
      A.msg = 'Powered descent · ' + fDist(Math.max(0, h)) + ' · ' + fVel(-vz) + ' down';
      const stop = vz < 0 ? vz * vz / (2 * Math.max(0.1, amax * 0.55 - g)) : 0;
      if (F.mode === 'rails') apWarp((h - stop * 1.6 - railAlt(b)) / Math.max(1, -vz) * 0.6); else F.warp = h > stop * 2.2 + 3000 && F.throttle === 0 ? Math.min(warpCap(), wi(10)) : 0;
      break;
    }
    case 'deorbitE': {
      const peA = el ? peOf(el) - b.R : 0;
      if (!el || peA < 40e3){ setThrottleRaw(0); setPhase('reentry'); break; }
      F.apAng = Math.atan2(-F.vy, -F.vx);
      if (!liveEngines().length && !F.decQ.some(g => g.some(u => F.parts.some(p => p.uid === u)))){ setThrottleRaw(0); setPhase('reentry'); break; }
      setThrottleRaw(aligned(0.08) ? clamp((peA - 30e3) / 40e3, 0.1, 1) : 0); autoStage();
      A.msg = 'Deorbit burn · periapsis ' + fDist(peA); F.warp = Math.min(warpCap(), wi(10));
      break;
    }
    case 'reentry': {
      setThrottleRaw(0);
      if (F.landed){ setPhase('done'); break; }
      // drop everything below the capsule, keep the heat shield facing the airflow, arm the chute
      if (A.cool <= 0 && F.decQ.some(g => g.some(u => F.parts.some(p => p.uid === u)))){ doStage(); A.cool = 1.2; }
      F.apAng = surfRetroAng();
      if (countKind(F.parts, 'chute') && !F.chuteOn){ F.chuteOn = true; F.chute = 0; }
      const [vx, vy] = airVel(), sp = Math.hypot(vx, vy);
      A.msg = (F.chute > 0 ? 'Under parachute · ' : 'Re-entry · ') + fDist(alt) + ' · ' + fVel(sp);
      if (F.mode === 'rails'){ const vr = Math.min(-1, (F.x * F.vx + F.y * F.vy) / Math.hypot(F.x, F.y)); apWarp((alt - b.atm.top) / -vr * 0.7); }
      else F.warp = alt > 30e3 ? Math.min(warpCap(), wi(4)) : (F.chute > 0 && alt > 1500 ? Math.min(warpCap(), wi(4)) : 0);
      break;
    }
    case 'done': {
      const what = A.tg.mode === 'land' ? (F.landed ? 'Landed on ' : 'Descending to ') + T.name : 'In orbit around ' + T.name;
      apStop('Autopilot complete: ' + what);
      break;
    }
  }
}
