'use strict';
/* ===== flight simulation: patched conics. Powered/atmospheric flight is integrated numerically;
   coasting above the atmosphere runs "on rails" with exact Kepler propagation and SOI hand-offs. ===== */
const WARPS = [1, 2, 4, 10, 25, 50, 100, 250, 500, 1000, 5000, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9];
const wi = v => WARPS.indexOf(v);
const GOALS = [
  ['space', 'Cross the Kármán line (100 km)'],
  ['orbit', 'Reach a stable orbit of Earth'],
  ['moon',  'Enter the Moon’s sphere of influence'],
  ['land',  'Land on the Moon'],
  ['home',  'Return to Earth from the Moon'],
  ['mars',  'Reach Mars’s sphere of influence'],
  ['outer', 'Reach Jupiter or beyond'],
  ['escape','Escape the Sun’s gravity'],
];
const input = {rotL:false, rotR:false, thUp:false, thDn:false};
const SETTINGS = Object.assign({shake:true, particles:'high', markers:true, ui:100}, (() => { try { return JSON.parse(localStorage.getItem('orbitforge2.settings')) || {}; } catch (e){ return {}; } })());
let F = null;
const hooks = {toast:() => {}, onCrash:() => {}, onChange:() => {}};

function startFlight(bp){
  setEpoch(Date.now());
  const {keep} = rootComponent(bp);
  const parts = cloneParts(keep, true);
  const e = absB(EARTH, 0), sunAng = Math.atan2(-e.y, -e.x);
  SITE_LON = wrapPi(sunAng + 60 * deg - spinB(EARTH, 0));
  F = {
    t:0, p:EARTH, x:0, y:0, vx:0, vy:0, ang:0, av:0, parts, st:null, com:{x:0, y:0}, bb:null, decQ:decQueue(parts),
    landed:{lon:SITE_LON}, mode:'phys', el:null, throttle:0, chuteOn:false, chute:0, sas:'free', apAng:null,
    heat:0, q:0, gload:1, thrustNow:0, debris:[], smoke:[], fx:[], frags:[], booms:[], scorch:[], flash:0, warp:0,
    zoom:1, camRot:0, flags:{}, dead:false, deadMsg:'', shake:0, map:null, pred:null, predTick:0, ap:null
  };
  restructure(true);
  F.zoom = clamp(fgH() * 0.42 / Math.max(F.bb.h, 4), 0.6, 14);
  placeLanded();
  F.camRot = Math.PI / 2 - F.ang;
}
function fgH(){ return document.getElementById('fg').getBoundingClientRect().height || 800; }
const v2w = (lx, ly) => { const a = F.ang - Math.PI / 2, c = Math.cos(a), s = Math.sin(a); return [lx * c - ly * s, lx * s + ly * c]; };
function restructure(first){
  F.st = structure(F.parts);
  const nc = comOf(F.parts);
  if (!first){ const [ox, oy] = v2w(nc.x - F.com.x, nc.y - F.com.y); F.x += ox; F.y += oy; }
  F.com = nc; F.bb = bboxOf(F.parts, nc);
}
function refreshCom(){
  const nc = comOf(F.parts);
  if (Math.abs(nc.x - F.com.x) + Math.abs(nc.y - F.com.y) > 1e-3){ const [ox, oy] = v2w(nc.x - F.com.x, nc.y - F.com.y); F.x += ox; F.y += oy; F.com = nc; F.bb = bboxOf(F.parts, nc); }
}
function placeLanded(){
  const b = F.p, off = -F.bb.y0, phi = F.landed.lon + spinB(b, F.t);
  F.x = Math.cos(phi) * (b.R + off); F.y = Math.sin(phi) * (b.R + off);
  F.vx = -b.w * F.y; F.vy = b.w * F.x; F.ang = phi; F.av = 0;
}
function liveEngines(){ const st = F.st; return st.act.filter(i => groupFuel(F.parts, st, st.comp[i]) > 0); }
function hasThrust(){ return !!F && F.throttle > 0 && liveEngines().length > 0; }
const altNow = () => Math.hypot(F.x, F.y) - F.p.R;
function airVel(){ const w = F.p.w; return [F.vx + w * F.y, F.vy - w * F.x]; }
function refVel(){ return (F.p.atm && altNow() < F.p.atm.top) || altNow() < 30000 ? airVel() : [F.vx, F.vy]; }
const hasLegs = () => countKind(F.parts, 'leg') > 0;

function attitude(h, mass){
  const torque = F.parts.reduce((s, p) => s + (defOf(p).torque || 0), 0) + F.thrustNow * 0.05;
  const alpha = clamp(torque / Math.max(mass, 0.5), 0.03, 2.2);
  const rot = (input.rotL ? 1 : 0) - (input.rotR ? 1 : 0);
  if (F.chuteOn && F.chute > 0.2){
    const [ax, ay] = airVel();
    if (Math.hypot(ax, ay) > 2) F.ang += wrapPi(Math.atan2(-ay, -ax) - F.ang) * Math.min(1, 1.2 * h);
    F.av = 0; return;
  }
  if (torque <= 0) return;
  let target = null;
  if (F.chuteOn && !F.ap && density(F.p, altNow()) > 1e-4){ const [ax, ay] = airVel(); if (Math.hypot(ax, ay) > 5) target = Math.atan2(-ay, -ax); }
  if (target == null && F.ap && F.apAng != null) target = F.apAng;
  else if (target == null && F.sas !== 'free'){ const [vx, vy] = refVel(); if (Math.hypot(vx, vy) > 0.5) target = Math.atan2(vy, vx) + (F.sas === 'retro' ? Math.PI : 0); }
  if (rot && !F.ap){ F.av += rot * alpha * h; }
  else if (target != null){
    const want = clamp(wrapPi(target - F.ang) * 2.5, -0.8, 0.8);
    F.av += clamp(want - F.av, -alpha * h, alpha * h);
  } else F.av *= Math.exp(-3.5 * h);
  F.av = clamp(F.av, -0.9, 0.9);
  F.ang += F.av * h;
}

function physStep(h){
  const b = F.p; F.t += h;
  const parts = F.parts, st = F.st, mass = totalMass(parts);
  const r = Math.hypot(F.x, F.y), alt = r - b.R, rho = density(b, alt), pf = Math.min(1, rho / 1.225);
  // engines: constant mass flow, thrust follows pressure-dependent Isp, direction follows each nozzle
  let tlx = 0, tly = 0, thr = 0; const need = {};
  if (F.throttle > 0){
    for (const i of st.act){
      const g = st.comp[i]; if (groupFuel(parts, st, g) <= 0) continue;
      const d = defOf(parts[i]), md = d.thrust / (d.isp * G0) * F.throttle, f = md * (d.isp - (d.isp - d.ispSL) * pf) * G0;
      const [nx, ny] = localDir(parts[i], 0, -1);
      tlx -= nx * f; tly -= ny * f; thr += f; need[g] = (need[g] || 0) + md * h;
    }
  }
  for (const g in need){ let n = need[g]; for (const i of st.tanks[g]){ const take = Math.min(parts[i].fuel, n); parts[i].fuel -= take; n -= take; if (n <= 0) break; } }
  F.thrustNow = thr;
  const [twx, twy] = v2w(tlx, tly);
  let ax = twx / mass, ay = twy / mass;     // kN / t = m/s²
  if (F.landed){
    const phi = F.landed.lon + spinB(b, F.t), nx = Math.cos(phi), ny = Math.sin(phi);
    if (ax * nx + ay * ny > b.mu / (b.R * b.R) * 1.0005){ F.landed = null; hooks.onChange(); }
    else { placeLanded(); F.q = 0; F.gload = 1; return; }
  }
  attitude(h, mass);
  const r3 = r * r * r; ax -= b.mu * F.x / r3; ay -= b.mu * F.y / r3;
  let aDrag = 0;
  if (rho > 0){
    const [rvx, rvy] = airVel(), sp = Math.hypot(rvx, rvy);
    if (sp > 0.01){
      const topP = parts.reduce((a, p) => p.y > a.y ? p : a, parts[0]), w = F.bb.w;
      // drag depends on which end meets the air: nose first is streamlined, a blunt shield/base first is draggy
      const fwd = (Math.cos(F.ang) * rvx + Math.sin(F.ang) * rvy) / sp;
      const cdF = ['nose','capsule','probe','chute'].includes(defOf(topP).kind) ? 0.4 : 0.8;
      const cdB = countKind(parts, 'shield') || countKind(parts, 'capsule') ? 1.3 : 0.95;
      let cda = (fwd >= 0 ? lerp(0.8, cdF, fwd) : lerp(0.8, cdB, -fwd)) * Math.PI * (w / 2) ** 2;
      if (F.chuteOn){   // armed chutes open by themselves once the air is thick enough and speed is safe
        if (sp < 300 && rho > 0.003){ if (F.chute === 0) AUD.sfx('chute'); F.chute = Math.min(1, F.chute + h * 0.4); }
        cda += countKind(parts, 'chute') * 2000 * F.chute * F.chute;
      }
      aDrag = Math.min(0.5 * rho * sp * sp * cda / (mass * 1000), sp / h * 0.9);
      ax -= rvx / sp * aDrag; ay -= rvy / sp * aDrag;
      F.q = 1.83e-4 * Math.sqrt(rho / Math.max(1, w / 2)) * sp * sp * sp;   // Sutton–Graves stagnation heating, W/m²
    }
  } else F.q = 0;
  const qLim = countKind(parts, 'shield') ? 8e6 : 3.5e5;
  F.heat = Math.max(0, F.heat + (F.q / qLim - F.heat) * Math.min(1, h * 0.35));
  if (F.heat > 1){ crash('Burned up on re-entry. Fit an Ablative Shield before coming home.', true); return; }
  F.gload = (thr / mass + aDrag) / G0;
  F.vx += ax * h; F.vy += ay * h; F.x += F.vx * h; F.y += F.vy * h;
  contact();
}
function contact(){
  const b = F.p, bb = F.bb;
  let hit = false;
  for (const [lx, ly] of [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x0, bb.y1], [bb.x1, bb.y1], [0, 0]]){
    const [ox, oy] = v2w(lx, ly); if (Math.hypot(F.x + ox, F.y + oy) < b.R){ hit = true; break; }
  }
  if (!hit) return;
  if (b.gas || b.type === 0){ crash(b.type === 0 ? 'Vaporised by the Sun.' : 'Crushed deep in ' + b.name + '’s atmosphere. Gas giants have no surface.'); return; }
  const dc = Math.hypot(F.x, F.y), nx = F.x / dc, ny = F.y / dc, [rvx, rvy] = airVel(), sp = Math.hypot(rvx, rvy);
  const tilt = Math.acos(clamp(Math.cos(F.ang) * nx + Math.sin(F.ang) * ny, -1, 1));
  const lon = Math.atan2(ny, nx) - spinB(b, F.t);
  const water = b === EARTH && landness(lon) < 0.5, legs = hasLegs();
  const vmax = water ? 20 : legs ? 18 : 14, tmax = legs ? 0.9 : 0.65;
  if (sp < vmax && tilt < tmax) touchdown(lon, sp, water);
  else crash('Impact at ' + nf0.format(sp) + ' m/s. Touch down under ' + vmax + ' m/s with the rocket upright' + (legs ? '.' : ', or fit landing legs.'));
}
function touchdown(lon, sp, water){
  F.landed = {lon}; F.av = 0; F.chuteOn = false; F.chute = 0;
  placeLanded();
  AUD.sfx(water ? 'splash' : 'thud');
  hooks.toast((water ? 'Splashdown' : 'Touchdown') + ' on ' + F.p.name + ' at ' + sp.toFixed(1) + ' m/s');
  for (let k = 0; k < 30; k++){ const a = Math.random() * TAU, s = 2 + Math.random() * 8; const [bx, by] = v2w(0, F.bb.y0);
    F.smoke.push({x:F.x + bx, y:F.y + by, vx:F.vx + Math.cos(a) * s, vy:F.vy + Math.sin(a) * s, life:0, max:3 + Math.random() * 3, r:1.5, g:2.5, dust:!F.p.atm || F.p !== EARTH}); }
  if (F.p === B.moon) goal('land');
  if (F.p === EARTH && F.flags.moon) goal('home');
  hooks.onChange();
}
/* crash: the vessel breaks into burning fragments, a fireball, a shockwave and a smoke column */
function crash(msg, burnup){
  if (F.dead) return;
  F.dead = true; F.deadMsg = msg; F.throttle = 0; F.warp = 0; F.shake = 18; F.flash = burnup ? 0.4 : 1;
  const b = F.p, mass = totalMass(F.parts), size = clamp(Math.cbrt(mass) * 6, 8, 90);
  const air = density(b, altNow()) > 0.001;
  F.booms.push({x:F.x, y:F.y, vx:F.vx, vy:F.vy, t:0, r:size, air});
  AUD.boom(size * (burnup ? 0.5 : 1), 0, air);
  const fuel = F.parts.reduce((s, p) => s + (p.fuel || 0), 0);
  for (const p of F.parts){
    const [ox, oy] = v2w(p.x - F.com.x, p.y - F.com.y);
    const ang = Math.atan2(oy, ox) + (Math.random() - .5), sp = 8 + Math.random() * 32;
    const [ux, uy] = [F.x / Math.hypot(F.x, F.y), F.y / Math.hypot(F.x, F.y)];
    F.frags.push({p:{...p, x:0, y:0}, x:F.x + ox, y:F.y + oy, vx:F.vx * 0.15 - b.w * F.y * 0.85 + Math.cos(ang) * sp + ux * (6 + Math.random() * 18), vy:F.vy * 0.15 + b.w * F.x * 0.85 + Math.sin(ang) * sp + uy * (6 + Math.random() * 18),
      ang:F.ang - Math.PI / 2, av:(Math.random() - .5) * 6, t:0, life:10 + Math.random() * 6, burn:1, rest:false});
  }
  for (let i = 0; i < Q().fx; i++){
    const a = Math.random() * TAU, s = 6 + Math.random() * 60;
    F.fx.push({x:F.x, y:F.y, vx:F.vx * 0.2 + Math.cos(a) * s, vy:F.vy * 0.2 + Math.sin(a) * s, life:0, max:0.6 + Math.random() * 1.6, r:1 + Math.random() * 4, hot:Math.random() < 0.8, spark:Math.random() < 0.35});
  }
  F.secondary = Math.min(6, Math.round(fuel / 40));
  if (b.atm || !air){ const [ux, uy] = [F.x / Math.hypot(F.x, F.y), F.y / Math.hypot(F.x, F.y)];
    if (altNow() < 300) F.scorch.push({x:ux * b.R, y:uy * b.R, r:size * 1.3, lon:Math.atan2(uy, ux) - spinB(b, F.t)}); }
  F.smokeColumn = air ? 5 : 0;
  setTimeout(() => hooks.onCrash(), 3800);
}
function ripChute(){
  const i = F.parts.findIndex(p => defOf(p).kind === 'chute');
  if (i >= 0){ F.parts.splice(i, 1); restructure(); }
  F.chuteOn = false; F.chute = 0; AUD.sfx('tear');
  hooks.toast('Parachute torn off. Open it below 250 m/s'); hooks.onChange();
}

/* ----- mode switching & SOI changes ----- */
function toRails(){ F.el = toEl(F.x, F.y, F.vx, F.vy, F.p.mu, F.t); F.mode = 'rails'; F.smoke.length = 0; }
function toPhys(){ if (F.el){ const s = prop(F.el, F.t); F.x = s.x; F.y = s.y; F.vx = s.vx; F.vy = s.vy; } F.el = null; F.mode = 'phys'; }
function reparent(np){
  const a = absB(F.p, F.t), c = absB(np, F.t), old = F.p;
  F.x += a.x - c.x; F.y += a.y - c.y; F.vx += a.vx - c.vx; F.vy += a.vy - c.vy;
  F.p = np; F.debris.length = 0; F.smoke.length = 0; F.fx.length = 0; F.frags.length = 0; F.booms.length = 0; F.scorch.length = 0;
  if (F.mode === 'rails') F.el = toEl(F.x, F.y, F.vx, F.vy, np.mu, F.t);
  AUD.sfx('soi'); if (typeof mapOnReparent === 'function') setTimeout(mapOnReparent, 0);
  hooks.toast(np.parentB === old ? 'Entering ' + np.name + '’s sphere of influence' : 'Leaving ' + old.name + '’s sphere of influence');
  if (np === B.moon) goal('moon');
  if (np === B.mars) goal('mars');
  if (['jupiter','saturn','uranus','neptune'].includes(np.id)) goal('outer');
  hooks.onChange();
}
function railsAdvance(T){
  for (let g = 0; g < 8 && T > 1e-6; g++){
    const res = findEvent(F.p, F.el, F.t, F.t + T, F.p.R + railAlt(F.p), 600, 4);
    T -= res.t - F.t; F.t = res.t;
    const s = prop(F.el, F.t); F.x = s.x; F.y = s.y; F.vx = s.vx; F.vy = s.vy;
    if (!res.ev) break;
    if (res.ev.k === 'low'){ toPhys(); F.warp = Math.min(F.warp, warpCap()); hooks.onChange(); break; }
    if (res.ev.k === 'exit') reparent(F.p.parentB); else reparent(res.ev.c);
  }
}
function physSoiCheck(){
  const r = Math.hypot(F.x, F.y);
  if (r > F.p.soi && F.p.parentB){ reparent(F.p.parentB); return; }
  for (const c of F.p.children){ const q = relB(c, F.t); if (Math.hypot(F.x - q.x, F.y - q.y) < c.soi){ reparent(c); return; } }
}
function warpCap(){
  if (!F) return 0;
  if (F.landed && !hasThrust()) return WARPS.length - 1;
  if (F.mode === 'phys') return density(F.p, altNow()) > 0 ? wi(100) : wi(1000);   // 100x in air, 1000x powered in vacuum
  return WARPS.length - 1;
}

/* ----- one frame of simulation ----- */
function simFrame(dt){
  if (!F) return;
  if (F.dead){   // the wreck rides along with the rotating ground so the camera stays on the crash site
    const b = F.p; F.t += dt;
    if (altNow() < 50e3){ const a = b.w * dt, c = Math.cos(a), s = Math.sin(a), x = F.x; F.x = x * c - F.y * s; F.y = x * s + F.y * c; F.vx = -b.w * F.y; F.vy = b.w * F.x; }
    else { F.x += F.vx * dt; F.y += F.vy * dt; }
    return;
  }
  if (input.thUp) setThrottleRaw(F.throttle + dt * 0.7);
  if (input.thDn) setThrottleRaw(F.throttle - dt * 0.7);
  const cap = warpCap(); if (F.warp > cap) F.warp = cap;
  const simT = dt * WARPS[F.warp];
  const thrusting = hasThrust();
  if (F.mode === 'rails' && (thrusting || F.landed)) toPhys();
  if (F.mode === 'phys' && !F.landed && !thrusting && F.chute <= 0 && altNow() > railAlt(F.p) + 1000) toRails();
  if (F.mode === 'rails'){
    F.thrustNow = 0; F.q = 0; F.gload = 0; F.heat *= Math.exp(-dt);
    attitude(dt, totalMass(F.parts));
    railsAdvance(simT);
  } else if (F.landed && !thrusting){
    F.t += simT; placeLanded(); F.thrustNow = 0;
    if (F.ap) attitude(dt, totalMass(F.parts));
  } else {
    const h = density(F.p, altNow()) > 0 ? 0.02 : 0.05;
    const n = Math.min(1500, Math.ceil(simT / h)), hh = simT / n;
    for (let i = 0; i < n && !F.dead; i++) physStep(hh);
    if (!F.dead){ physSoiCheck(); refreshCom(); }
  }
  stepDebris(simT);
}
function stepDebris(simT){
  const b = F.p;
  for (const d of F.debris){
    const n = Math.min(40, Math.ceil(simT / 0.05)), h = simT / n;
    for (let i = 0; i < n && !d.gone; i++){
      const r = Math.hypot(d.x, d.y), r3 = r * r * r, rho = density(b, r - b.R);
      d.vx -= b.mu * d.x / r3 * h; d.vy -= b.mu * d.y / r3 * h;
      if (rho > 0){ const rvx = d.vx + b.w * d.y, rvy = d.vy - b.w * d.x, sp = Math.hypot(rvx, rvy);
        if (sp > .01){ const ad = Math.min(0.5 * rho * sp * sp * d.cda / (d.mass * 1000), sp / h * .9); d.vx -= rvx / sp * ad * h; d.vy -= rvy / sp * ad * h; } }
      d.x += d.vx * h; d.y += d.vy * h; d.ang += d.av * h; d.t += h;
      if (r < b.R + 2){
        d.gone = true;
        if (!b.gas && !F.dead && Math.hypot(d.x - F.x, d.y - F.y) < 2e5){ AUD.boom(clamp(Math.cbrt(d.mass) * 4, 5, 40), Math.hypot(d.x - F.x, d.y - F.y), !!b.atm); } if (!b.gas && !F.dead && Math.hypot(d.x - F.x, d.y - F.y) < 2e5) F.booms.push({x:d.x, y:d.y, vx:-b.w * d.y, vy:b.w * d.x, t:0, r:clamp(Math.cbrt(d.mass) * 4, 5, 40), air:!!b.atm, small:true});
      }
    }
    if (Math.hypot(d.x - F.x, d.y - F.y) > 4e5) d.gone = true;
  }
  F.debris = F.debris.filter(d => !d.gone);
}
function doStage(){
  if (!F || F.dead) return;
  const next = F.decQ.find(g => g.some(u => F.parts.some(p => p.uid === u)));
  if (!next){ hooks.toast('No stages left to separate'); return; }
  if (F.mode === 'rails') toPhys();
  const sp = splitAt(F.parts, next);
  if (!sp.keep.length) return;
  for (const piece of sp.drops){
    const c = comOf(piece), [ox, oy] = v2w(c.x - F.com.x, c.y - F.com.y), dd = Math.hypot(ox, oy) || 1;
    const push = 2.5;
    const bb = bboxOf(piece, c);
    F.debris.push({parts:piece, com:c, x:F.x + ox, y:F.y + oy, vx:F.vx + ox / dd * push, vy:F.vy + oy / dd * push, ang:F.ang, av:(Math.random() - .5) * .3 + (ox !== 0 ? Math.sign(ox) * -0.12 : 0),
      t:0, mass:c.m, cda:0.9 * Math.PI * (Math.max(bb.w, 1) / 2) ** 2});
    for (let k = 0; k < 18; k++){ const a = Math.random() * TAU, s = 2 + Math.random() * 7;
      F.smoke.push({x:F.x + ox * 0.5, y:F.y + oy * 0.5, vx:F.vx + Math.cos(a) * s, vy:F.vy + Math.sin(a) * s, life:0, max:2 + Math.random() * 2, r:1 + Math.random() * 2, g:3}); }
  }
  if (F.debris.length > 14) F.debris.splice(0, F.debris.length - 14);
  F.parts = sp.keep;
  AUD.sfx('stage');
  restructure();
  if (F.landed) placeLanded();
  if (F.mode === 'rails') toRails();
  hooks.onChange();
}
function toggleChute(){
  if (!F || F.dead) return;
  if (!countKind(F.parts, 'chute')){ hooks.toast('No parachute on this vessel'); return; }
  if (F.landed){ hooks.toast('Already on the ground'); return; }
  if (!F.p.atm){ hooks.toast(F.p.name + ' has no air, so parachutes can\u2019t work here'); return; }
  F.chuteOn = !F.chuteOn; if (!F.chuteOn) F.chute = 0;
  else { AUD.sfx('click'); hooks.toast('Parachute armed: it opens by itself below 300 m/s'); }
  hooks.onChange();
}
function setThrottleRaw(t){ if (F) F.throttle = clamp(t, 0, 1); }

/* ----- orbit summary & prediction ----- */
function currentEl(){ return F.el || toEl(F.x, F.y, F.vx, F.vy, F.p.mu, F.t); }
function predictPatches(){
  if (!F || F.landed || F.dead) return [];
  const out = []; let p = F.p, x = F.x, y = F.y, vx = F.vx, vy = F.vy, t = F.t;
  for (let k = 0; k < 4; k++){
    const el = toEl(x, y, vx, vy, p.mu, t);
    const per = el.e < 1 ? TAU / el.n : Infinity;
    const t1 = t + Math.min(per, 40 * YEAR);
    const res = findEvent(p, el, t + 0.5, t1, p.R, 900, 3);
    out.push({p, el, t0:t, t1:res.t, ev:res.ev, full:!res.ev && per < 40 * YEAR});
    if (!res.ev || res.ev.k === 'low') break;
    const s = prop(el, res.t), np = res.ev.k === 'exit' ? p.parentB : res.ev.c;
    const a = absB(p, res.t), c = absB(np, res.t);
    x = s.x + a.x - c.x; y = s.y + a.y - c.y; vx = s.vx + a.vx - c.vx; vy = s.vy + a.vy - c.vy; p = np; t = res.t;
  }
  return out;
}
function goal(k){
  if (!F || F.flags[k]) return;
  F.flags[k] = true; AUD.sfx('chime');
  hooks.toast('Goal complete: ' + GOALS.find(g => g[0] === k)[1]);
}
function checkGoals(){
  if (!F || F.dead) return;
  if (F.p === EARTH && altNow() > 100e3) goal('space');
  const el = currentEl();
  if (F.p === EARTH && !F.landed && el.e < 1 && peOf(el) > EARTH.R + EARTH.atm.top && apOf(el) < EARTH.soi) goal('orbit');
  if (F.p === SUN && el.e >= 1) goal('escape');
}
