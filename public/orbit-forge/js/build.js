'use strict';
/* ===== assembly bay: free placement on graph paper ===== */
const BLD = {parts:[], sel:null, cam:{x:0, y:30, s:8}, undo:[], cat:0, drag:null, fitted:false, v:1, drawn:-1};
function bstore(k, v){ try { localStorage.setItem('orbitforge2.' + k, JSON.stringify(v)); } catch (e){} }
function bload(k){ try { const s = localStorage.getItem('orbitforge2.' + k); return s ? JSON.parse(s) : null; } catch (e){ return null; } }
const bpOut = parts => parts.map(p => ({id:p.id, x:p.x, y:p.y, r:p.r || 0, f:!!p.f}));
function setParts(list){ BLD.v++; BLD.parts = list.filter(p => PARTS[p.id]).map(p => ({id:p.id, x:p.x, y:p.y, r:p.r || 0, f:!!p.f, uid:UID++})); BLD.sel = null; }
function pushUndo(){ BLD.undo.push(JSON.stringify(bpOut(BLD.parts))); if (BLD.undo.length > 60) BLD.undo.shift(); }
function undo(){ const s = BLD.undo.pop(); if (!s){ toast('Nothing to undo'); return; } setParts(JSON.parse(s)); buildChanged(); }
const selPart = () => BLD.parts.find(p => p.uid === BLD.sel) || null;
function fitView(){
  if (!BLD.parts.length){ BLD.cam = {x:0, y:12, s:14}; return; }
  const bb = bboxOf(BLD.parts), top = 200, bot = 170, h = Math.max(4, bb.h), w = Math.max(4, bb.w);
  const s = clamp(Math.min((H - top - bot) / (h * 1.12), (W - 150) / (w * 1.25)), 1.2, 40);
  BLD.cam = {x:(bb.x0 + bb.x1) / 2, y:(bb.y0 + bb.y1) / 2 - (bot - top) / 2 / s, s};
}
const w2sB = (x, y) => [W / 2 + (x - BLD.cam.x) * BLD.cam.s, H / 2 - (y - BLD.cam.y) * BLD.cam.s];
const s2wB = (sx, sy) => [BLD.cam.x + (sx - W / 2) / BLD.cam.s, BLD.cam.y - (sy - H / 2) / BLD.cam.s];

/* snapping: edges and centres of nearby parts first, then the 0.5 m grid */
function snapPos(p, x, y){
  const [w, h] = dims(p), th = 14 / BLD.cam.s;
  let bx = null, bdx = th, by = null, bdy = th;
  const cx = [0], cy = [h / 2];
  for (const q of BLD.parts){
    if (q.uid === p.uid) continue;
    const r = rectOf(q);
    cx.push(q.x, r[0] + w / 2, r[2] - w / 2, r[0] - w / 2, r[2] + w / 2);
    cy.push(q.y, r[3] + h / 2, r[1] - h / 2, r[1] + h / 2, r[3] - h / 2);
  }
  for (const v of cx){ const d = Math.abs(v - x); if (d < bdx){ bdx = d; bx = v; } }
  for (const v of cy){ const d = Math.abs(v - y); if (d < bdy){ bdy = d; by = v; } }
  const g = v => Math.round(v / GRID) * GRID;
  return [bx != null ? bx : g(x - w / 2) + w / 2, by != null ? by : g(y - h / 2) + h / 2];
}
function freeSpot(p){
  for (let k = 0; k < 80; k++){ if (!BLD.parts.some(q => q.uid !== p.uid && overlapR(rectOf(q), rectOf(p), 0.05))) return; p.y -= GRID; }
}
function addPart(id){
  if (BLD.parts.length >= 80){ toast('A vessel can have up to 80 parts'); return; }
  pushUndo();
  const d = PARTS[id], s = selPart(), p = {id, x:0, y:0, r:0, f:false, uid:UID++};
  if (s){ const r = rectOf(s); p.x = s.x; p.y = r[1] - d.h / 2; }
  else if (BLD.parts.length){ const bb = bboxOf(BLD.parts); p.x = 0; p.y = bb.y0 - d.h / 2; }
  else { p.x = 0; p.y = d.h / 2; }
  BLD.parts.push(p); freeSpot(p); BLD.sel = p.uid; buildChanged(); AUD.sfx('place');
  const [sx, sy] = w2sB(p.x, p.y); if (sy > H - 190 || sy < 180 || sx < 40 || sx > W - 40) BLD.cam.y = p.y + (H / 2 - (H - 200) * 0.55) / BLD.cam.s * -1 + 0;
}
function toolDup(){ const s = selPart(); if (!s) return; pushUndo(); AUD.sfx('place'); const r = rectOf(s), [w] = dims(s); const p = {...s, uid:UID++, x:r[2] + w / 2}; BLD.parts.push(p); freeSpot(p); BLD.sel = p.uid; buildChanged(); }
function toolRot(){ const s = selPart(); if (!s) return; pushUndo(); AUD.sfx('rotate'); s.r = (s.r + 1) % 4; const [x, y] = snapPos(s, s.x, s.y); s.x = x; s.y = y; buildChanged(); }
function toolFlip(){ const s = selPart(); if (!s) return; pushUndo(); AUD.sfx('rotate'); s.f = !s.f; buildChanged(); }
function toolMirror(){
  const s = selPart(); if (!s) return;
  if (Math.abs(s.x) < 0.25){ toast('Move the part off the centre line to mirror it'); return; }
  pushUndo(); AUD.sfx('place'); const p = {...s, uid:UID++, x:-s.x, f:!s.f, r:(s.r & 1) ? (s.r + 2) % 4 : s.r}; BLD.parts.push(p); BLD.sel = p.uid; buildChanged();
}
function toolDel(){ const s = selPart(); if (!s) return; pushUndo(); AUD.sfx('del'); BLD.parts = BLD.parts.filter(p => p !== s); BLD.sel = null; buildChanged(); }

function buildChanged(){
  BLD.v++;
  bstore('bp', bpOut(BLD.parts));
  const {keep, loose} = rootComponent(BLD.parts), plan = stagePlan(keep, G0);
  const dv = plan.reduce((a, s) => a + s.dv, 0), lift = plan.length ? plan[0].twr : 0, thr0 = plan.length ? plan[0].thr : 0;
  const figs = $('#figs'); figs.innerHTML = '';
  const add = (label, val, cls) => { const d = document.createElement('div'); d.className = 'fig'; d.innerHTML = '<span class="label"></span><b></b>'; d.firstChild.textContent = label; d.lastChild.textContent = val; if (cls) d.lastChild.className = cls; figs.appendChild(d); };
  add('Δv (vac)', nf0.format(dv) + ' m/s');
  add('TWR', keep.length ? lift.toFixed(2) : '—', keep.length ? (lift < 1 ? 'bad' : 'ok') : '');
  add('Mass', nf1.format(totalMass(keep)) + ' t');
  add('Thrust', nf0.format(thr0) + ' kN');
  const chips = $('#chips'); chips.innerHTML = '';
  const warn = t => { const c = document.createElement('span'); c.className = 'chip'; c.style.color = 'var(--bad)'; c.textContent = t; chips.appendChild(c); };
  if (loose.length) warn(loose.length + ' part' + (loose.length > 1 ? 's' : '') + ' not attached');
  if (keep.length && !plan.length) warn('No engine can fire');
  else if (keep.length && lift < 1) warn('Too heavy to lift off');
  plan.forEach(s => { if (s.dv <= 0) return; const c = document.createElement('span'); c.className = 'chip'; c.innerHTML = 'S' + s.n + ' <b></b> · TWR ' + s.twr.toFixed(2) + ' · ' + Math.round(s.burn) + ' s'; c.querySelector('b').textContent = nf0.format(s.dv) + ' m/s'; chips.appendChild(c); });
  const dests = $('#dests'); dests.innerHTML = '';
  for (const [n, need] of DESTS){ const c = document.createElement('span'), ok = dv >= need; c.className = 'chip ' + (ok ? 'yes' : 'no'); c.textContent = (ok ? '✓ ' : '') + n + ' ' + nf1.format(need / 1000) + ' km/s'; dests.appendChild(c); }
  const s = selPart();
  $('#tools').hidden = !s;
  const info = $('#selInfo');
  if (s){ const d = defOf(s); let t = d.name + ' · ' + d.mass + ' t'; if (d.fuel) t += ' + ' + d.fuel + ' t fuel'; if (d.thrust) t += ' · ' + nf0.format(d.thrust) + ' kN'; info.textContent = t; info.hidden = false; } else info.hidden = true;
  $('#bLaunch').disabled = !keep.length;
}
function buildTray(){
  const tabs = $('#cats'), tray = $('#tray');
  tabs.innerHTML = '';
  CATS.forEach(([name], i) => { const b = document.createElement('button'); b.className = 'chipbtn' + (i === BLD.cat ? ' on' : ''); b.textContent = name; b.onclick = () => { BLD.cat = i; buildTray(); }; tabs.appendChild(b); });
  tray.innerHTML = '';
  for (const id of CATS[BLD.cat][1]){
    const d = PARTS[id], b = document.createElement('button'); b.className = 'card'; b.type = 'button';
    const c = document.createElement('canvas'); c.width = 128; c.height = 124;
    const x = c.getContext('2d'), extra = d.kind === 'probe' ? 5 : 0, s = Math.min(112 / (d.w + extra), 104 / (d.h + 0.4), 50);
    x.translate(64, 62 + d.h * s / 2); x.scale(s, -s); drawPart(x, d, 0);
    const spec = d.kind === 'tank' ? d.fuel + ' t fuel' : d.kind === 'engine' ? nf0.format(d.thrust) + ' kN · ' + d.isp + ' s' : d.mass + ' t';
    const nm = document.createElement('b'); nm.textContent = d.name;
    const sp = document.createElement('span'); sp.textContent = spec;
    b.append(c, nm, sp); b.addEventListener('click', () => addPart(id)); tray.appendChild(b);
  }
}
function renderBuild(){
  if (!BLD.fitted && W > 0){ fitView(); BLD.fitted = true; BLD.v++; }
  const sig = BLD.v + '|' + BLD.cam.x + '|' + BLD.cam.y + '|' + BLD.cam.s + '|' + W + '|' + H;
  if (sig === BLD.drawn) return false;      // nothing changed: skip the redraw entirely
  BLD.drawn = sig;
  const {s} = BLD.cam;
  bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const g = bctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#060912'); g.addColorStop(1, '#0d1424');
  bctx.fillStyle = g; bctx.fillRect(0, 0, W, H);
  GLR.begin();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  // graph paper
  const [wx0, wy1] = s2wB(0, 0), [wx1, wy0] = s2wB(W, H);
  const line = (step, col, wdt) => {
    if (step * s < 5) return;
    ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.beginPath();
    for (let x = Math.ceil(wx0 / step) * step; x <= wx1; x += step){ const [sx] = w2sB(x, 0); ctx.moveTo(Math.round(sx) + .5, 0); ctx.lineTo(Math.round(sx) + .5, H); }
    for (let y = Math.ceil(wy0 / step) * step; y <= wy1; y += step){ const [, sy] = w2sB(0, y); ctx.moveTo(0, Math.round(sy) + .5); ctx.lineTo(W, Math.round(sy) + .5); }
    ctx.stroke();
  };
  line(0.5, 'rgba(124,160,230,.05)', 1); line(1, 'rgba(124,160,230,.08)', 1); line(5, 'rgba(124,160,230,.16)', 1);
  const [ax] = w2sB(0, 0), [, gy] = w2sB(0, 0);
  ctx.strokeStyle = 'rgba(255,180,84,.28)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(ax + .5, 0); ctx.lineTo(ax + .5, H); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(126,224,161,.35)'; ctx.beginPath(); ctx.moveTo(0, gy + .5); ctx.lineTo(W, gy + .5); ctx.stroke();
  ctx.fillStyle = 'rgba(126,224,161,.6)'; ctx.font = '500 10px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText('PAD  0 m', 8, gy - 5);
  if (s * 5 > 22){ ctx.fillStyle = 'rgba(143,155,180,.55)'; for (let y = Math.ceil(wy0 / 5) * 5; y <= wy1; y += 5){ if (y === 0) continue; const [, sy] = w2sB(0, y); ctx.fillText(y + ' m', 8, sy - 3); } }
  // parts
  const {loose} = rootComponent(BLD.parts), looseSet = new Set(loose.map(p => p.uid));
  ctx.save(); ctx.translate(W / 2 - BLD.cam.x * s, H / 2 + BLD.cam.y * s); ctx.scale(s, -s);
  for (const p of BLD.parts) drawVessel(ctx, [p], {x:0, y:0}, looseSet.has(p.uid) ? 'rgba(255,80,80,.35)' : null);
  const sp = selPart();
  if (sp){ const r = rectOf(sp); ctx.strokeStyle = '#ffb454'; ctx.lineWidth = 2 / s; ctx.setLineDash([6 / s, 4 / s]); ctx.strokeRect(r[0] - 0.15, r[1] - 0.15, r[2] - r[0] + 0.3, r[3] - r[1] + 0.3); ctx.setLineDash([]); }
  ctx.restore();
  // engine markers: green = fires at launch, dim = waits for staging
  const keep = rootComponent(BLD.parts).keep, act = new Set(activeEngines(keep).map(i => keep[i].uid));
  for (const p of keep){
    if (defOf(p).kind !== 'engine') continue;
    const d = defOf(p), [nx, ny] = localDir(p, 0, -1), [ex, ey] = w2sB(p.x + nx * (d.h / 2 + 0.4), p.y + ny * (d.h / 2 + 0.4)), on = act.has(p.uid);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(Math.atan2(-ny, nx) - Math.PI / 2);
    ctx.fillStyle = on ? 'rgba(126,224,161,.9)' : 'rgba(143,155,180,.45)';
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.lineTo(0, 9); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // centre of mass marker
  if (keep.length){
    const c = comOf(keep), [cx, cy] = w2sB(c.x, c.y), R = 9;
    ctx.fillStyle = '#0d121e'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb454'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, -Math.PI / 2, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffb454'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  }
  if (!BLD.parts.length){ ctx.fillStyle = 'rgba(233,238,247,.65)'; ctx.font = '600 16px "Saira Semi Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Pick a part below, or open the menu for example rockets', W / 2, H / 2); }
}
/* pointer handling for the assembly bay (called from ui.js) */
function buildDown(p){
  const [wx, wy] = s2wB(p.x, p.y);
  let hit = null;
  for (let i = BLD.parts.length - 1; i >= 0; i--){ const r = rectOf(BLD.parts[i]), m = 6 / BLD.cam.s; if (wx > r[0] - m && wx < r[2] + m && wy > r[1] - m && wy < r[3] + m){ hit = BLD.parts[i]; break; } }
  if (hit){ BLD.drag = {uid:hit.uid, ox:wx - hit.x, oy:wy - hit.y, moved:false, start:JSON.stringify(bpOut(BLD.parts))}; if (BLD.sel !== hit.uid){ BLD.sel = hit.uid; buildChanged(); } BLD.v++; }
  else BLD.drag = {pan:true, lx:p.x, ly:p.y, moved:false};
}
function buildMove(p){
  const d = BLD.drag; if (!d) return;
  if (d.pan){ if (Math.hypot(p.x - d.lx, p.y - d.ly) > 2) d.moved = true; BLD.cam.x -= (p.x - d.lx) / BLD.cam.s; BLD.cam.y += (p.y - d.ly) / BLD.cam.s; d.lx = p.x; d.ly = p.y; return; }
  const part = BLD.parts.find(q => q.uid === d.uid); if (!part) return;
  const [wx, wy] = s2wB(p.x, p.y), [x, y] = snapPos(part, wx - d.ox, wy - d.oy);
  if (x !== part.x || y !== part.y){ if (d.moved) AUD.sfx('snap'); if (!d.moved){ BLD.undo.push(d.start); d.moved = true; } part.x = x; part.y = y; BLD.v++; }
}
function buildUp(){
  const d = BLD.drag; BLD.drag = null; if (!d) return;
  if (d.pan && !d.moved && BLD.sel != null){ BLD.sel = null; buildChanged(); }
  else if (d.moved && !d.pan) buildChanged();
}
function buildZoom(k, px, py){
  const [wx, wy] = s2wB(px == null ? W / 2 : px, py == null ? H / 2 : py);
  BLD.cam.s = clamp(BLD.cam.s * k, 0.8, 60);
  const [nx, ny] = s2wB(px == null ? W / 2 : px, py == null ? H / 2 : py);
  BLD.cam.x += wx - nx; BLD.cam.y += wy - ny;
}
