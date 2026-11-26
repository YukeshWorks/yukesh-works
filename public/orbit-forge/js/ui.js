'use strict';
/* ===== UI shell: menus, flight HUD, autopilot panel, input, main loop ===== */
let screen = 'hangar', paused = false;
function toast(msg, ms){
  const el = document.createElement('div'); el.textContent = msg;
  const box = $('#toast'); box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), ms || 3200);
}
hooks.toast = toast;
hooks.onCrash = () => showPause(true);
hooks.onChange = () => { updateChuteBtn(); planCache = null; };

/* ---------- generic modal ---------- */
function openModal(title, build){
  AUD.sfx('open'); $('#mTitle').textContent = title; const body = $('#mBody'); body.innerHTML = ''; build(body); $('#modal').hidden = false;
}
function closeModal(){ $('#modal').hidden = true; }
$('#mClose').onclick = closeModal;
function btn(label, fn, cls){ const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.textContent = label; b.onclick = fn; return b; }
function row(label, control){ const r = document.createElement('div'); r.className = 'setrow'; const l = document.createElement('span'); l.textContent = label; r.append(l, control); return r; }
function toggle(on, fn){ const b = document.createElement('button'); b.className = 'switch' + (on ? ' on' : ''); b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', on); b.onclick = () => { on = !on; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); fn(on); }; return b; }
function slider(label, id, val, fn){ const r = document.createElement('label'); r.className = 'setrow'; r.htmlFor = id; const l = document.createElement('span'); l.textContent = label;
  const i = document.createElement('input'); i.type = 'range'; i.id = id; i.min = 0; i.max = 100; i.value = Math.round(val * 100); i.className = 'range'; i.oninput = () => fn(i.value / 100); r.append(l, i); return r; }
function saveSettings(){ try { localStorage.setItem('orbitforge2.settings', JSON.stringify(SETTINGS)); } catch (e){} }

function menuBuild(){
  openModal('Menu', body => {
    const g = document.createElement('div'); g.className = 'grid2';
    g.append(btn('Save blueprint', saveDialog), btn('Load blueprint', loadDialog), btn('Example rockets', examplesDialog), btn('Clear', clearDialog));
    body.append(g, btn('Settings', settingsDialog), btn('Fit rocket to view', () => { fitView(); closeModal(); }));
  });
}
function saveDialog(){
  openModal('Save blueprint', body => {
    const inp = document.createElement('input'); inp.id = 'bpName'; inp.className = 'field'; inp.placeholder = 'Name, e.g. Moon lander'; inp.maxLength = 40;
    body.append(inp, btn('Save', () => {
      const name = inp.value.trim() || 'Rocket ' + new Date().toLocaleDateString();
      const list = bload('bps') || []; const i = list.findIndex(b => b.name === name);
      const item = {name, parts:bpOut(BLD.parts), at:Date.now()}; if (i >= 0) list[i] = item; else list.unshift(item);
      bstore('bps', list.slice(0, 40)); closeModal(); toast('Saved “' + name + '”');
    }, 'primary'));
    setTimeout(() => inp.focus(), 50);
  });
}
function loadDialog(){
  const list = bload('bps') || [];
  openModal('Load blueprint', body => {
    if (!list.length){ const p = document.createElement('p'); p.textContent = 'No saved blueprints yet. Use Save blueprint in the menu.'; body.append(p); return; }
    for (const it of list){
      const r = document.createElement('div'); r.className = 'listrow';
      const t = document.createElement('div'); t.innerHTML = '<b></b><small></small>'; t.firstChild.textContent = it.name; t.lastChild.textContent = it.parts.length + ' parts · ' + new Date(it.at).toLocaleDateString();
      r.append(t, btn('Load', () => { pushUndo(); setParts(it.parts); fitView(); buildChanged(); closeModal(); }), btn('✕', () => { bstore('bps', list.filter(x => x !== it)); loadDialog(); }, 'warn'));
      body.append(r);
    }
  });
}
function examplesDialog(){
  openModal('Example rockets', body => {
    for (const ex of EXAMPLES){
      const r = document.createElement('div'); r.className = 'listrow';
      const t = document.createElement('div'); t.innerHTML = '<b></b><small></small>'; t.firstChild.textContent = ex.name; t.lastChild.textContent = ex.note;
      r.append(t, btn('Load', () => { pushUndo(); setParts(ex.parts); fitView(); buildChanged(); closeModal(); toast('Loaded ' + ex.name); }, 'primary'));
      body.append(r);
    }
  });
}
function clearDialog(){
  openModal('Clear the assembly bay?', body => {
    const p = document.createElement('p'); p.textContent = 'This removes every part. You can undo it afterwards.';
    body.append(p, btn('Clear all parts', () => { pushUndo(); setParts([]); buildChanged(); closeModal(); }, 'warn'));
  });
}
function settingsDialog(){
  openModal('Settings', body => {
    body.append(
      row('Camera shake', toggle(SETTINGS.shake, v => { SETTINGS.shake = v; saveSettings(); })),
      row('Flight markers', toggle(SETTINGS.markers, v => { SETTINGS.markers = v; saveSettings(); })),
      row('Detailed smoke & debris', toggle(SETTINGS.particles !== 'low', v => { SETTINGS.particles = v ? 'high' : 'low'; saveSettings(); })),
      row('Show frame rate', toggle(PERF.showFps, v => { PERF.showFps = v; perfSave(); })),
      row('Sound', toggle(!AUD.V.mute, v => AUD.setMute(!v))),
      slider('Effects volume', 'volSfx', AUD.V.sfx, v => AUD.setVol('sfx', v)),
      slider('Music volume', 'volMus', AUD.V.music, v => AUD.setVol('music', v)));
    const seg = (label, opts, cur, fn) => { const wrap = document.createElement('div'); wrap.className = 'seg';
      for (const [v, t] of opts){ const b = document.createElement('button'); b.className = 'chipbtn' + (String(v) === String(cur) ? ' on' : ''); b.textContent = t;
        b.onclick = () => { fn(v); wrap.querySelectorAll('.chipbtn').forEach(x => x.classList.toggle('on', x === b)); }; wrap.appendChild(b); }
      const r = document.createElement('div'); r.className = 'setcol'; const l = document.createElement('span'); l.textContent = label; r.append(l, wrap); return r; };
    body.append(
      seg('Graphics', [['auto', 'Auto'], [0, 'Battery'], [1, 'Balanced'], [2, 'High']], PERF.mode, v => { PERF.mode = v; if (v !== 'auto') setTier(+v); perfSave(); }),
      seg('Frame rate', [[60, '60'], [90, '90'], [120, '120'], [144, 'Max']], PERF.cap, v => { PERF.cap = +v; perfSave(); }));
    const note = document.createElement('p'); note.className = 'note';
    note.textContent = 'Auto watches your frame times and adjusts resolution, planet detail and particles. Now: ' + Q().name + (GLR.ok ? ' · WebGL planets' : ' · 2D planets') + '.';
    body.append(note);
  });
}
function autopilotDialog(){
  openModal('Autopilot', body => {
    const p = document.createElement('p'); p.textContent = 'Flies the whole mission with real transfer windows. Needs enough Δv: Moon orbit ~13.4 km/s total, Mars ~15 km/s, Jupiter ~17 km/s from the pad.';
    body.append(p);
    const g = document.createElement('div'); g.className = 'grid2';
    for (const t of AP_TARGETS) g.append(btn(t.name, () => { closeModal(); apStart(t.id); }, F && F.ap && F.ap.tg.id === t.id ? 'primary' : ''));
    body.append(g);
    if (F && F.ap) body.append(btn('Stop autopilot', () => { closeModal(); apStop('Autopilot off'); }, 'warn'));
  });
}

/* ---------- assembly bay wiring ---------- */
$('#bMenuB').onclick = menuBuild;
$('#bUndo').onclick = undo;
$('#tDup').onclick = toolDup; $('#tRot').onclick = toolRot; $('#tFlip').onclick = toolFlip; $('#tMir').onclick = toolMirror; $('#tDel').onclick = toolDel;
$('#bLaunch').onclick = launch;

/* ---------- flight ---------- */
let planCache = null;
function launch(){
  const {keep, loose} = rootComponent(BLD.parts);
  if (!keep.length) return;
  startFlight(BLD.parts); screen = 'flight'; paused = false; AUD.sfx('launch'); prevThrust = 0;
  $('#hangar').hidden = true; $('#flight').hidden = false; $('#pause').hidden = true; hideInfo();
  setMapMode(false); setThrottle(0); setSas('free'); updateWarp(); updateChuteBtn();
  toast(loose.length ? loose.length + ' unattached part(s) stayed in the bay' : 'Raise the throttle to lift off, or tap Auto for the autopilot');
}
function toHangar(){ screen = 'hangar'; F = null; $('#hangar').hidden = false; $('#flight').hidden = true; $('#pause').hidden = true; closeModal(); buildChanged(); }
function setThrottle(t){ if (!F) return; if (t > 0 && F.throttle === 0 && !F.dead && !liveEngines().length && !F.ap) toast(F.decQ.some(g => g.some(u => F.parts.some(p => p.uid === u))) ? 'No engine can fire yet. Press Stage to drop the part blocking it' : 'No engine with fuel on this vessel'); setThrottleRaw(t); $('#thFill').style.height = (F.throttle * 100) + '%'; $('#thVal').textContent = Math.round(F.throttle * 100) + '%'; }
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function updateWarp(){ if (!F) return; const w = WARPS[F.warp]; $('#wVal').textContent = w >= 1e4 ? '10' + SUP[Math.round(Math.log10(w))] + '×' : nf0.format(w) + '×'; }
function setWarp(i){
  if (!F || F.dead) return;
  const cap = warpCap();
  if (i > cap){ toast(hasThrust() ? 'Cut the engines for faster time warp' : density(F.p, altNow()) > 0 ? 'Time warp is limited inside an atmosphere' : 'Warp limited here'); i = cap; }
  if (i !== F.warp) AUD.sfx('warp', i > F.warp); F.warp = clamp(i, 0, WARPS.length - 1); if (F.ap) F.ap.userWarp = F.warp; updateWarp();
}
function setSas(m){ if (F){ F.sas = m; if (F.ap && m !== 'free') apStop('Autopilot off'); } document.querySelectorAll('#sas .chipbtn').forEach(b => b.classList.toggle('on', b.dataset.sas === m)); }
function updateChuteBtn(){ const b = $('#bChute'); const has = F && countKind(F.parts, 'chute') > 0; b.hidden = !has; b.textContent = F && F.chuteOn ? (F.chute > 0 ? 'Cut chute' : 'Armed') : 'Chute'; }
function setMapMode(on){
  if (!F) return;
  F.mapOn = on; $('#bMap').textContent = on ? 'Flight' : 'Map';
  $('#levels').hidden = !on; $('#zoomBox').hidden = on && matchMedia('(pointer:coarse)').matches; if (!on) hideInfo();
  if (on){ openMap(); F.pred = null; }
}
function buildLevels(){
  const list = $('#scaleList'), btn = $('#scaleBtn');
  const close = () => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  for (const lv of LEVELS){ const b = document.createElement('button'); b.dataset.id = lv.id; b.innerHTML = '<span></span><small></small>'; b.firstChild.textContent = lv.name; b.lastChild.textContent = lv.hint || '';
    b.onclick = () => { goLevel(lv.id); close(); }; list.appendChild(b); }
  btn.onclick = () => { list.hidden = !list.hidden; btn.setAttribute('aria-expanded', String(!list.hidden)); };
  fgc.addEventListener('pointerdown', close);
}
function updateScaleBtn(name){ const el = $('#scaleName'); if (el.textContent !== name) el.textContent = name; }
let hudTick = 0;
function updateHud(){
  const b = F.p, alt = altNow();
  $('#tBody').textContent = b.name;
  const el = F.landed ? null : currentEl();
  let status;
  if (F.dead) status = 'Vessel lost';
  else if (F.landed) status = F.t < 1 ? 'On the launch pad' : 'Landed';
  else if (el.e >= 1) status = 'Escape trajectory';
  else if (peOf(el) < b.R + railAlt(b)) status = density(b, alt) > 0 ? 'Atmospheric flight' : 'Suborbital';
  else status = 'Orbiting ' + b.name;
  $('#tStatus').textContent = status;
  const surf = (b.atm && alt < b.atm.top) || alt < 30000, [vx, vy] = surf ? airVel() : [F.vx, F.vy];
  $('#tVelL').textContent = surf ? 'SRF' : 'ORB';
  if (!el){ $('#tAp').textContent = '—'; $('#tPe').textContent = '—'; }
  else { const ap = apOf(el); $('#tAp').textContent = isFinite(ap) && ap < b.soi ? fDist(ap - b.R) : 'escape'; const pe = peOf(el) - b.R; $('#tPe').textContent = pe < 0 ? 'below surface' : fDist(pe); }
  if (!planCache || hudTick % 20 === 0) planCache = stagePlan(F.parts, G0);
  $('#tDv').textContent = fVel(planCache.reduce((a, s) => a + s.dv, 0));
  const g = b.mu / (Math.hypot(F.x, F.y) ** 2), live = liveEngines(), thr = F.thrustNow > 0 ? F.thrustNow : live.reduce((s, i) => s + defOf(F.parts[i]).thrust, 0);
  const twr = thr / (totalMass(F.parts) * g); $('#tTwr').textContent = twr > 99 ? '>99' : twr.toFixed(2);
  const hp = clamp(F.heat, 0, 1.2);
  $('#heatWrap').hidden = hp < 0.08; $('#tHeat').textContent = Math.round(hp * 100) + '%'; $('#heatBar').style.width = Math.min(100, hp * 100) + '%';
  $('#tMet').textContent = fMET(F.t) + '\n' + new Date(epochMs + F.t * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const left = F.decQ.filter(gq => gq.some(u => F.parts.some(p => p.uid === u))).length;
  $('#stN').textContent = left + 1;
  let f = 0, m = 0; const groups = new Set(F.st.act.map(i => F.st.comp[i]));
  for (const gi of groups) for (const i of (F.st.tanks[gi] || [])){ f += F.parts[i].fuel; m += defOf(F.parts[i]).fuel; }
  const bar = $('#fuelBar'); bar.style.width = (m > 0 ? f / m * 100 : 0) + '%'; bar.style.background = m > 0 && f / m < 0.15 ? 'var(--bad)' : 'var(--sun)';
  $('#bStage').disabled = !left; updateChuteBtn();
  updateWarp();
  $('#thFill').style.height = (F.throttle * 100) + '%'; $('#thVal').textContent = Math.round(F.throttle * 100) + '%';
  const ap = $('#apStat'); ap.hidden = !F.ap; if (F.ap) $('#apMsg').textContent = F.ap.msg || '…';
  $('#bAuto').classList.toggle('primary', !!F.ap);
}
function showPause(dead){
  if (!F) return;
  $('#pause').hidden = false; $('#pTitle').textContent = dead ? 'Vessel lost' : 'Paused';
  $('#pText').textContent = dead ? F.deadMsg : 'Mission goals'; $('#pResume').hidden = !!dead;
  const ul = $('#goals'); ul.innerHTML = '';
  for (const [k, t] of GOALS){ const li = document.createElement('li'); li.className = F.flags[k] ? 'done' : ''; li.innerHTML = '<i></i><span></span>'; li.lastChild.textContent = t; ul.appendChild(li); }
  paused = !dead;
}
$('#bMenu').onclick = () => showPause(false);
$('#pResume').onclick = () => { $('#pause').hidden = true; paused = false; };
$('#pRestart').onclick = () => launch();
$('#pHangar').onclick = () => { paused = false; toHangar(); };
const sndLabel = () => { $('#pSound').textContent = 'Sound: ' + (AUD.V.mute ? 'off' : 'on'); };
$('#pSound').onclick = () => { AUD.setMute(!AUD.V.mute); sndLabel(); };
$('#bMap').onclick = () => setMapMode(!F.mapOn);
$('#bAuto').onclick = autopilotDialog;
$('#apStop').onclick = () => apStop('Autopilot off');
$('#infoX').onclick = hideInfo;
$('#wUp').onclick = () => setWarp(F.warp + 1);
$('#wDn').onclick = () => setWarp(F.warp - 1);
$('#bStage').onclick = doStage;
$('#bChute').onclick = toggleChute;
$('#thMax').onclick = () => { if (F && F.ap) apStop('Autopilot off'); setThrottle(1); };
$('#thCut').onclick = () => { if (F && F.ap) apStop('Autopilot off'); setThrottle(0); };
document.querySelectorAll('#sas .chipbtn').forEach(b => b.onclick = () => setSas(b.dataset.sas));
// soft click for every button press
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button'); if (b && !b.closest('.card') && !['tDup','tRot','tFlip','tMir','tDel','bStage','bChute','wUp','wDn'].includes(b.id)) AUD.sfx('click'); }, true);
function zoomBy(k, px, py){ if (screen === 'hangar'){ buildZoom(k, px, py); return; } if (!F) return; if (F.mapOn) mapZoom(k); else F.zoom = clamp(F.zoom * k, 1e-7, 60); }
$('#zIn').onclick = () => zoomBy(1.6);
$('#zOut').onclick = () => zoomBy(1 / 1.6);
function hold(id, key){
  const el = $(id);
  const on = e => { e.preventDefault(); if (F && F.ap) apStop('Autopilot off'); input[key] = true; el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (_){} };
  const off = () => { input[key] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
hold('#rL', 'rotL'); hold('#rR', 'rotR');
(() => { const rail = $('#rail'); const setFrom = e => { if (F && F.ap) apStop('Autopilot off'); const r = rail.getBoundingClientRect(); setThrottle(1 - (e.clientY - r.top) / r.height); };
  rail.addEventListener('pointerdown', e => { e.preventDefault(); rail.setPointerCapture(e.pointerId); setFrom(e); });
  rail.addEventListener('pointermove', e => { if (rail.hasPointerCapture(e.pointerId)) setFrom(e); }); })();
window.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (screen === 'hangar'){
    if ((e.key === 'Delete' || e.key === 'Backspace') && BLD.sel != null){ toolDel(); e.preventDefault(); }
    if (e.key === 'r' || e.key === 'R') toolRot();
    if ((e.ctrlKey || e.metaKey) && e.key === 'z'){ undo(); e.preventDefault(); }
    return;
  }
  if (!F) return;
  switch (e.code){
    case 'KeyA': case 'ArrowLeft': input.rotL = true; break;
    case 'KeyD': case 'ArrowRight': input.rotR = true; break;
    case 'KeyW': case 'ShiftLeft': input.thUp = true; break;
    case 'KeyS': case 'ControlLeft': input.thDn = true; break;
    case 'KeyZ': setThrottle(1); break;
    case 'KeyX': setThrottle(0); break;
    case 'Space': if (!e.repeat) doStage(); e.preventDefault(); break;
    case 'KeyP': if (!e.repeat) toggleChute(); break;
    case 'KeyM': if (!e.repeat) setMapMode(!F.mapOn); break;
    case 'Period': setWarp(F.warp + 1); break;
    case 'Comma': setWarp(F.warp - 1); break;
    case 'Equal': case 'NumpadAdd': zoomBy(1.4); break;
    case 'Minus': case 'NumpadSubtract': zoomBy(1 / 1.4); break;
    case 'Escape': if ($('#pause').hidden) showPause(false); else if (!F.dead){ $('#pause').hidden = true; paused = false; } break;
  }
});
window.addEventListener('keyup', e => {
  switch (e.code){
    case 'KeyA': case 'ArrowLeft': input.rotL = false; break;
    case 'KeyD': case 'ArrowRight': input.rotR = false; break;
    case 'KeyW': case 'ShiftLeft': input.thUp = false; break;
    case 'KeyS': case 'ControlLeft': input.thDn = false; break;
  }
});
/* canvas pointer: assembly bay drag/pan, map tap/pan, pinch, wheel */
const ptrs = new Map(); let pinch = null, tap = null, panLast = null;
const posOf = e => { const r = fgc.getBoundingClientRect(); return {x:e.clientX - r.left, y:e.clientY - r.top}; };
fgc.addEventListener('pointerdown', e => {
  fgc.setPointerCapture(e.pointerId); const p = posOf(e); ptrs.set(e.pointerId, p);
  if (ptrs.size === 1){ tap = {...p}; panLast = {...p}; if (screen === 'hangar') buildDown(p); }
  if (ptrs.size === 2){ const [a, b] = [...ptrs.values()]; pinch = {last:Math.hypot(a.x - b.x, a.y - b.y)}; tap = null; panLast = null; if (screen === 'hangar') BLD.drag = null; }
});
fgc.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  const p = posOf(e); ptrs.set(e.pointerId, p);
  if (tap && Math.hypot(p.x - tap.x, p.y - tap.y) > 10) tap = null;
  if (pinch && ptrs.size === 2){ const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomBy(d / pinch.last, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch.last = d; }
  else if (screen === 'hangar') buildMove(p);
  else if (F && F.mapOn && panLast && ptrs.size === 1 && !tap && !F.map.anim){ F.map.px -= (p.x - panLast.x) / F.map.s; F.map.py += (p.y - panLast.y) / F.map.s; panLast = p; }
});
const ptrEnd = e => {
  if (screen === 'hangar' && ptrs.size === 1) buildUp();
  else if (tap && ptrs.size === 1 && F && F.mapOn) mapTap(tap.x, tap.y);
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size){ tap = null; panLast = null; }
};
fgc.addEventListener('pointerup', ptrEnd); fgc.addEventListener('pointercancel', ptrEnd);
fgc.addEventListener('wheel', e => { e.preventDefault(); const p = posOf(e); zoomBy(Math.exp(-e.deltaY * 0.0015), p.x, p.y); }, {passive:false});

/* ---------- smoothly rolling altitude & speed (updated every frame, eased toward the true value) ---------- */
const HS = {alt:null, vel:null, p:null, ta:'', tv:''};
function hudFast(dt){
  if (!F) return;
  const b = F.p, alt = Math.max(0, altNow() + F.bb.y0);
  const surf = (b.atm && altNow() < b.atm.top) || altNow() < 30000, [vx, vy] = surf ? airVel() : [F.vx, F.vy], vel = F.landed ? 0 : Math.hypot(vx, vy);
  if (HS.p !== b || HS.alt == null || Math.abs(alt - HS.alt) > Math.max(5e6, alt * 2)){ HS.alt = alt; HS.vel = vel; HS.p = b; }
  const k = 1 - Math.exp(-dt * 14);
  HS.alt += (alt - HS.alt) * k; HS.vel += (vel - HS.vel) * k;
  const ta = fDist(HS.alt), tv = fVel(HS.vel);
  if (ta !== HS.ta){ HS.ta = ta; $('#tAlt').textContent = ta; }
  if (tv !== HS.tv){ HS.tv = tv; $('#tVel').textContent = tv; }
}
/* ---------- audio state each frame ---------- */
let prevThrust = 0;
function audioFrame(dt){
  if (screen === 'hangar' || !F){ AUD.update({mood:'hangar', dt}); return; }
  const b = F.p, alt = altNow(), rho = density(b, alt), [ax, ay] = airVel(), live = F.thrustNow > 0;
  if (!F.dead && !paused){ if (live && prevThrust <= 0) AUD.sfx('ignite'); else if (!live && prevThrust > 0 && F.throttle === 0) AUD.sfx('cutoff'); }
  prevThrust = F.dead ? 0 : F.thrustNow;
  let mood;
  if (F.dead) mood = 'silence';
  else if (F.mapOn && F.map && Math.min(W, H) / 2 / F.map.s > 0.5 * LY) mood = 'deep';
  else if (F.landed) mood = F.t < 2 && b === EARTH ? 'hangar' : 'landed';
  else if (rho > 0 || (live && alt < 200e3 && b === EARTH)) mood = 'ascent';
  else mood = 'orbit';
  const quiet = paused || F.dead || WARPS[F.warp] > 1000;
  const near = quiet ? 0 : (F.mapOn ? 0.35 : clamp(0.35 + Math.log10(F.zoom * 4 + 1) * 0.5, 0.25, 1));
  AUD.update({active:live && !quiet, throttle:F.throttle, thrust:F.thrustNow, dense:Math.min(1, rho / 1.225), near, qdyn:0.5 * rho * (ax * ax + ay * ay), heat:F.q, alarm:F.heat > 0.6 && !F.dead, mood, dt});
}
/* ---------- main loop: frame-rate cap + adaptive quality ---------- */
let lastT = performance.now(), lastDraw = 0, fpsEl = null;
function onTierChange(){ if (screen === 'hangar') BLD.v++; }
function frame(now){
  requestAnimationFrame(frame);
  if (skipFrame(now)) return;          // frame-rate cap with even pacing
  const interval = lastDraw ? now - lastDraw : 16.7; lastDraw = now;
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  const t0 = performance.now();
  try {
    if (screen === 'hangar') renderBuild();
    else if (F){
      if (!paused){ if (F.ap) apFrame(dt); simFrame(dt); effectsFrame(dt); hudFast(dt); if (now - (frame.hud || 0) > 90){ frame.hud = now; hudTick++; updateHud(); checkGoals(); } }
      if (F.mapOn) renderMap(dt); else renderFlight(dt);
    }
    audioFrame(dt);
    GLR.flush();
  } catch (err){ console.error(err); }
  if (document.visibilityState === 'visible') perfFrame(interval, performance.now() - t0, now);
  if (PERF.showFps){ if (!fpsEl) fpsEl = $('#fps'); if (++PERF.frames % 15 === 0){ fpsEl.hidden = false; fpsEl.textContent = Math.round(PERF.fps) + ' fps · ' + Q().name + ' · ' + PERF.work.toFixed(1) + ' ms'; } }
  else if (fpsEl && !fpsEl.hidden) fpsEl.hidden = true;
}
function start(data){
  const saved = (data && Array.isArray(data.bp)) ? data.bp : bload('bp');
  setParts(Array.isArray(saved) && saved.length ? saved : EXAMPLES[0].parts);
  resize(); GLR.init(glc); buildTray(); buildLevels(); buildChanged();
  requestAnimationFrame(t => { lastT = t; frame(t); });
  document.addEventListener('visibilitychange', () => { lastT = performance.now(); });
}
window.addEventListener('resize', () => { if (screen === 'hangar') BLD.fitted = false; });
window.__of = {get F(){ return F; }, B, BLD, setThrottle, doStage, setWarp, apStart, launch, setMapMode, goLevel, setParts, buildChanged};
try { if (window.claude && window.claude.hot && typeof window.claude.hot.snapshot === 'function') window.claude.hot.snapshot(() => ({bp:bpOut(BLD.parts)})); } catch (e){}
if (window.claude && window.claude.hot && typeof window.claude.hot.ready === 'function') window.claude.hot.ready(start);
else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
