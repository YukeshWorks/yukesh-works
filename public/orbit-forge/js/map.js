'use strict';
/* ===== map: one continuous log-zoom camera from orbit to the observable universe ===== */
let mapHits = [];
const PATCH_COL = ['#ffb454', '#7cc7ff', '#c79bff', '#7ee0a1'];
function vesselAbs(){ return [F.p.X + F.x, F.p.Y + F.y]; }
function focusPos(f){
  if (f.k === 'vessel') return vesselAbs();
  if (f.k === 'body') return [f.b.X, f.b.Y];
  return [f.x, f.y];
}
function mapScaleFor(ext){ return Math.min(W, H) / 2 / ext; }
function fitOrbit(){
  snapBodies(F.t);
  // camera follows the vessel and frames its whole orbit around the current body
  const b = F.p, r = Math.hypot(F.x, F.y); let ext = b.R * 1.6 + r - b.R;
  if (!F.landed){ const el = currentEl(), ap = apOf(el); ext = Math.max(ext, r + (isFinite(ap) && ap < b.soi ? ap : Math.min(b.soi, r * 3)) * 1.05); }
  return {focus:{k:'vessel'}, s:mapScaleFor(ext)};
}
function openMap(){
  if (!F.map){ const f = fitOrbit(); F.map = {s:f.s, focus:f.focus, px:0, py:0, anim:null}; }
  else { const f = fitOrbit(); animTo(f.focus, f.s, 900); }
}
function mapCenter(){
  const M = F.map;
  if (M.anim){
    const a = M.anim, u = clamp((performance.now() - a.t0) / a.dur, 0, 1), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    M.s = Math.exp(lerp(Math.log(a.s0), Math.log(a.s1), e));
    const c1 = focusPos(a.focus);
    if (u >= 1){ M.focus = a.focus; M.px = M.py = 0; M.anim = null; return c1; }
    // keep motion pleasant across huge scale changes: move in log-weighted steps
    const w = a.s1 < a.s0 ? Math.min(1, e * 1.6) : Math.max(0, (e - 0.35) / 0.65);
    return [lerp(a.c0[0], c1[0], w), lerp(a.c0[1], c1[1], w)];
  }
  const c = focusPos(M.focus); return [c[0] + M.px, c[1] + M.py];
}
function animTo(focus, s1, dur){
  const M = F.map; const c0 = mapCenter();
  M.anim = {t0:performance.now(), dur:reduceMotion ? 1 : (dur || 1700), s0:M.s, s1, c0, focus};
}
function goLevel(id){
  const lv = LEVELS.find(l => l.id === id); if (!lv || !F) return;
  if (id === 'orbit'){ const f = fitOrbit(); animTo(f.focus, f.s); return; }
  const focus = (lv.c[0] === 0 && lv.c[1] === 0) ? {k:'body', b:SUN} : {k:'pt', x:lv.c[0], y:lv.c[1]};
  animTo(focus, mapScaleFor(lv.ext));
}
function mapZoom(k){ const M = F.map; if (M.anim) return; M.s = clamp(M.s * k, 1e-26, 1e-2); }

function renderMap(dt){
  snapBodies(F.t);
  const M = F.map, [cx, cy] = mapCenter(), s = M.s, ext = Math.min(W, H) / 2 / s;
  M.cx = cx; M.cy = cy;
  const X = x => W / 2 + (x - cx) * s, Y = y => H / 2 - (y - cy) * s;
  mapHits = [];
  // ---- background layer
  bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bctx.fillStyle = '#020309'; bctx.fillRect(0, 0, W, H);
  drawStarsTo(bctx, 0.9 * (1 - smooth(0.6 * LY, 6 * LY, ext)), 0);
  // orbits
  for (const o of BODIES){
    if (!o.parentB) continue;
    const rp = o.a * s; if (rp < 5 || rp > 4e6) continue;
    const moon = o.parentB !== SUN;
    bctx.strokeStyle = moon ? `rgba(170,195,255,${0.16 * smooth(5, 40, rp)})` : `rgba(170,195,255,${0.26 * smooth(5, 40, rp)})`;
    bctx.lineWidth = 1; bctx.beginPath(); bctx.arc(X(o.parentB.X), Y(o.parentB.Y), rp, 0, TAU); bctx.stroke();
    if (o.soi * s > 30 && (o === F.p || o.parentB === F.p || o === B.moon)){ bctx.setLineDash([3, 6]); bctx.strokeStyle = 'rgba(124,199,255,.18)'; bctx.beginPath(); bctx.arc(X(o.X), Y(o.Y), o.soi * s, 0, TAU); bctx.stroke(); bctx.setLineDash([]); }
  }
  drawBelts(X, Y, s);
  drawCosmos(X, Y, s, ext);
  // ---- spheres
  GLR.begin();
  for (const o of BODIES){
    const rpx = o.R * s, sx = X(o.X), sy = Y(o.Y);
    if (o.parentB && o.a * s < 3 && o !== F.p) continue;
    if (rpx >= 1.5 && rpx < 2e6){
      let lx = SUN.X - o.X, ly = SUN.Y - o.Y; const ld = Math.hypot(lx, ly) || 1;
      GLR.sphere(o, sx, sy, rpx, [lx / ld, ly / ld], F.t, K2D, 1);
    }
  }
  // ---- foreground
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  const used = [];
  const label = (txt, x, y, col, size, sub) => {
    ctx.font = `600 ${size || 12}px "Saira Semi Condensed", sans-serif`;
    const w = ctx.measureText(txt).width;
    const r = [x - w / 2 - 3, y - 11, w + 6, sub ? 26 : 14];
    if (used.some(u => r[0] < u[0] + u[2] && r[0] + r[2] > u[0] && r[1] < u[1] + u[3] && r[1] + r[3] > u[1])) return false;
    used.push(r);
    ctx.fillStyle = col || 'rgba(233,238,247,.85)'; ctx.textAlign = 'center'; ctx.fillText(txt, x, y);
    if (sub){ ctx.font = '500 10px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(143,155,180,.9)'; ctx.fillText(sub, x, y + 12); }
    return true;
  };
  // bodies as dots + labels
  const sunR = SUN.R * s;
  if (ext < 3 * LY){
    const sx = X(0), sy = Y(0), gr = clamp(sunR * 3, 7, 40);
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr); g.addColorStop(0, 'rgba(255,246,220,1)'); g.addColorStop(.3, 'rgba(255,200,120,.6)'); g.addColorStop(1, 'rgba(255,170,90,0)');
    if (sunR < 2){ ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, gr, 0, TAU); ctx.fill(); }
  }
  for (const o of BODIES){
    const sx = X(o.X), sy = Y(o.Y), rpx = o.R * s;
    if (sx < -60 || sy < -60 || sx > W + 60 || sy > H + 60) continue;
    const vis = !o.parentB ? ext < 3 * LY : ((o.a * s > 3 || o === F.p) && ext < 3000 * AU);
    if (!vis) continue;
    if (rpx < 1.5 && o.parentB){ ctx.fillStyle = o.col; ctx.beginPath(); ctx.arc(sx, sy, o.parentB === SUN ? 2.6 : 1.8, 0, TAU); ctx.fill(); }
    const big = !o.parentB || o.parentB === SUN ? o.a * s > 26 || !o.parentB : o.a * s > 40;
    if (big || o === F.p){
      const ly = sy + Math.max(rpx * (o.rings ? 1.6 : 1), 3) + 15;
      label(o === SUN && ext > 3000 * AU ? 'Sun · you are here' : o.name, sx, ly, o === F.p ? '#ffb454' : null);
    }
    mapHits.push({x:sx, y:sy, r:Math.max(14, rpx), obj:o});
  }
  // vessel trajectory
  if (!F.dead && ext < 2000 * AU){
    if (++F.predTick % (F.throttle > 0 ? Math.max(4, Q().pred >> 1) : Q().pred) === 1 || !F.pred) F.pred = predictPatches();
    drawPatches(F.pred, X, Y, s, label);
  }
  // vessel
  const [vx, vy] = vesselAbs(), px = X(vx), py = Y(vy);
  if (ext < 2000 * AU){
    ctx.save(); ctx.translate(px, py); ctx.rotate(-F.ang + Math.PI / 2);
    ctx.fillStyle = F.dead ? '#ff6b6b' : '#ffb454'; ctx.strokeStyle = '#05070d'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3); ctx.lineTo(-6, 7); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
  }
  drawCosmosLabels(X, Y, s, ext, label);
  // scale bar + level name
  const target = 130 / s, pow = Math.pow(10, Math.floor(Math.log10(target)));
  const nice = [1, 2, 5, 10].map(k => k * pow).filter(k => k <= target).pop() || pow, len = nice * s;
  const by = H - 150, bx = W / 2 - len / 2;
  ctx.strokeStyle = 'rgba(233,238,247,.65)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by); ctx.lineTo(bx + len, by); ctx.lineTo(bx + len, by - 4); ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(233,238,247,.85)'; ctx.font = '500 11px "JetBrains Mono", monospace';
  ctx.fillText(fDist(nice) + '  ·  light: ' + fTime(nice / C_LIGHT), W / 2, by + 15);
  ctx.font = '600 13px "Saira Semi Condensed", sans-serif'; ctx.fillStyle = '#ffb454';
  ctx.fillText(scaleName(ext).toUpperCase(), W / 2, by - 10);
}
function drawBelts(X, Y, s){
  const draw = (bt, a, col, size) => {
    if (a <= 0.01) return;
    bctx.fillStyle = col; bctx.globalAlpha = a;
    for (let i = 0; i < bt.n; i++){
      const r = bt.a[i], th = bt.th[i] - Math.sqrt(SUN.mu / (r * r * r)) * F.t;
      const x = X(r * Math.cos(th)), y = Y(r * Math.sin(th));
      if (x < 0 || y < 0 || x > W || y > H) continue;
      bctx.fillRect(x, y, size, size);
    }
    bctx.globalAlpha = 1;
  };
  const a1 = 3.3 * AU * s, a2 = 50 * AU * s, a3 = 1e5 * AU * s;
  draw(ASTEROIDS, smooth(25, 80, a1) * (1 - smooth(3e4, 1e5, a1)) * 0.75, '#b9a58c', 1.2);
  draw(KUIPER, smooth(25, 80, a2) * (1 - smooth(3e4, 1e5, a2)) * 0.6, '#9fb6d6', 1.2);
  draw(OORT, smooth(30, 120, a3) * (1 - smooth(4e4, 2e5, a3)) * 0.45, '#8fa6cc', 1);
  const hp = 123 * AU * s;
  if (hp > 20 && hp < 2e5){
    const a = smooth(20, 80, hp) * (1 - smooth(5e4, 2e5, hp));
    bctx.strokeStyle = `rgba(124,199,255,${0.35 * a})`; bctx.lineWidth = 1.2; bctx.setLineDash([2, 5]);
    bctx.beginPath(); bctx.arc(X(0), Y(0), hp, 0, TAU); bctx.stroke();
    bctx.strokeStyle = `rgba(255,180,84,${0.22 * a})`; bctx.beginPath(); bctx.arc(X(0), Y(0), 94 * AU * s, 0, TAU); bctx.stroke(); bctx.setLineDash([]);
  }
}
function drawSprite(img, x, y, w, h, rot, a){ bctx.save(); bctx.globalAlpha = a; bctx.globalCompositeOperation = 'lighter'; bctx.translate(x, y); bctx.rotate(rot || 0); bctx.drawImage(img, -w / 2, -h / 2, w, h); bctx.restore(); }
function drawCosmos(X, Y, s, ext){
  // Milky Way
  const mwPx = MW_R * s;
  if (mwPx > 6){
    const a = smooth(14, 60, mwPx) * (1 - smooth(9000, 22000, mwPx));
    if (a > 0.01){ const img = milkyWay(), size = 55000 * LY * 2 * s; drawSprite(img, X(GC[0]), Y(GC[1]), size, size, 0, a); }
  }
  if (mwPx < 60 && mwPx > 0.3){ const a = 1 - smooth(20, 60, mwPx); drawSprite(galaxySprite('spiral', 1), X(GC[0]), Y(GC[1]), Math.max(4, mwPx * 2.3), Math.max(4, mwPx * 2.3), 0, a); }
  // stars (individual)
  for (const o of COSMOS){
    const px = X(o.x), py = Y(o.y), dpx = o.dist * s;
    if (px < -200 || py < -200 || px > W + 200 || py > H + 200) continue;
    if (o.kind === 'star'){
      if (dpx < 6 || dpx > 3e5) continue;
      const a = smooth(6, 20, dpx) * (1 - smooth(1e5, 3e5, dpx)), sz = o.rank <= 1 ? 3 : 2.2;
      const g = bctx.createRadialGradient(px, py, 0, px, py, sz * 4);
      g.addColorStop(0, o.col); g.addColorStop(.3, o.col + '88'); g.addColorStop(1, o.col + '00');
      bctx.globalAlpha = a; bctx.fillStyle = g; bctx.beginPath(); bctx.arc(px, py, sz * 4, 0, TAU); bctx.fill(); bctx.globalAlpha = 1;
    } else if (o.kind === 'galaxy'){
      if (dpx < 4 || dpx > 3e6) continue;
      const spx = Math.max(3, o.size * s), a = smooth(4, 16, dpx) * (1 - smooth(8000, 30000, spx));
      if (a < 0.01) continue;
      drawSprite(galaxySprite(o.style, o.name.length), px, py, spx, spx * (o.style === 'cluster' ? 1 : o.ratio), o.rot, a);
    } else {
      if (dpx < 10 || dpx > 3e5) continue;
      const a = smooth(10, 40, dpx) * (1 - smooth(5e4, 3e5, dpx));
      drawSprite(galaxySprite('cluster', o.name.length + 3), px, py, 26, 26, 0, a * 0.8);
    }
  }
  const lp = LANI_R * s;
  if (lp > 12 && lp < 2e4){ const a = smooth(12, 50, lp) * (1 - smooth(3000, 12000, lp)); drawSprite(laniakea(), X(GA.x), Y(GA.y), lp * 2, lp * 2, 0, a); }
  const up = UNI_R * s;
  if (up > 20 && up < 4e4){ const a = smooth(20, 70, up) * (1 - smooth(6000, 25000, up)); const S = up * 2 * 512 / 470; bctx.save(); bctx.globalAlpha = a; bctx.drawImage(universe(), X(0) - S / 2, Y(0) - S / 2, S, S); bctx.restore(); }
}
function drawCosmosLabels(X, Y, s, ext, label){
  const list = COSMOS.slice().sort((a, b) => (a.rank || 0) - (b.rank || 0));
  for (const o of list){
    const px = X(o.x), py = Y(o.y), dpx = o.dist * s;
    if (px < 0 || py < 0 || px > W || py > H) continue;
    let show = false;
    if (o.kind === 'star') show = dpx > 40 && dpx < 3e5;
    else if (o.kind === 'galaxy') show = dpx > 40 && dpx < 3e6 && o.size * s < 8000;
    else show = dpx > 40 && dpx < 3e5;
    if (!show) continue;
    if (label(o.name, px, py + 18, o.kind === 'star' ? 'rgba(233,238,247,.8)' : 'rgba(199,155,255,.9)', 11, fDist(o.dist))) mapHits.push({x:px, y:py, r:16, obj:o});
  }
  for (const o of SITES){ const px = X(o.x), py = Y(o.y), dp = o.dist * s; if (dp < 60 || dp > 2e4) continue;
    ctx.fillStyle = '#7ee0a1'; ctx.fillRect(px - 2, py - 2, 4, 4); if (label(o.name, px, py + 16, '#7ee0a1', 11)) mapHits.push({x:px, y:py, r:14, obj:o}); }
  const mwPx = MW_R * s;
  if (mwPx > 30 && mwPx < 8000){ label('Milky Way', X(GC[0]), Y(GC[1]) - mwPx * 1.02, '#ffb454', 13, '105,700 ly across'); mapHits.push({x:X(GC[0]), y:Y(GC[1]), r:30, obj:{kind:'mw', name:'Milky Way', dist:26670 * LY}}); }
  if (mwPx > 2 && mwPx <= 30) label('Milky Way', X(GC[0]), Y(GC[1]) + 18, '#ffb454', 11);
  const lp = LANI_R * s; if (lp > 40 && lp < 8000) label('Laniakea Supercluster', X(GA.x), Y(GA.y) - lp * 1.02, '#7cc7ff', 13, 'about 520 million ly across');
  const up = UNI_R * s; if (up > 40 && up < 2e4){ label('Edge of the observable universe', X(0), Y(0) - up * 1.08, '#ff9a6b', 13, '46.5 billion ly in every direction'); mapHits.push({x:X(0), y:Y(0) - up, r:30, obj:{kind:'uni', name:'Observable universe', dist:UNI_R}}); }
}
function drawPatches(patches, X, Y, s, label){
  patches.forEach((pt, i) => {
    const {p, el} = pt, col = PATCH_COL[i % 4], N = 260;
    const nu0 = prop(el, pt.t0).nu; let nu1 = prop(el, pt.t1).nu;
    if (el.e < 1){ let d = ((nu1 - nu0) % TAU + TAU) % TAU; if (pt.full || pt.t1 - pt.t0 > TAU / el.n * 0.999) d = TAU; nu1 = nu0 + d; }
    const ox = p.X, oy = p.Y;
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.globalAlpha = i ? 0.85 : 1;
    ctx.beginPath(); let started = false;
    for (let k = 0; k <= N; k++){
      const nu = nu0 + (nu1 - nu0) * k / N, r = el.p / (1 + el.e * Math.cos(nu));
      if (r <= 0 || r > 1e15){ started = false; continue; }
      const a = el.w + el.s * nu, x = X(ox + r * Math.cos(a)), y = Y(oy + r * Math.sin(a));
      if (!started){ ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
    const mark = (nu, txt, c) => {
      const r = el.p / (1 + el.e * Math.cos(nu)), a = el.w + el.s * nu, x = X(ox + r * Math.cos(a)), y = Y(oy + r * Math.sin(a));
      ctx.fillStyle = c || '#e9eef7'; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 5, y); ctx.closePath(); ctx.fill();
      ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillStyle = c || '#e9eef7'; ctx.fillText(txt, x + 9, y + 4);
    };
    const pe = peOf(el), ap = apOf(el);
    const inRange = nu => el.e < 1 ? true : (nu > Math.min(nu0, nu1) && nu < Math.max(nu0, nu1));
    if (el.e > 1e-3 && pe > p.R && inRange(0)) mark(0, (i ? p.name + ' ' : '') + 'Pe ' + fDist(pe - p.R), i ? col : null);
    if (i === 0 && el.e > 1e-3 && el.e < 1 && ap < p.soi) mark(Math.PI, 'Ap ' + fDist(ap - p.R));
    if (pt.ev){
      const s2 = prop(el, pt.t1), x = X(ox + s2.x), y = Y(oy + s2.y);
      ctx.strokeStyle = pt.ev.k === 'low' ? '#ff6b6b' : col; ctx.lineWidth = 2;
      if (pt.ev.k === 'low'){ ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.stroke(); }
      const txt = pt.ev.k === 'low' ? (p.atm ? 'Atmosphere / surface' : 'Impact') : pt.ev.k === 'enter' ? pt.ev.c.name + ' encounter' : 'Escape ' + p.name;
      ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.fillStyle = ctx.strokeStyle; ctx.textAlign = 'left';
      ctx.fillText(txt + ' · ' + fTime(pt.t1 - F.t), x + 9, y - 6);
    }
  });
}
function mapTap(x, y){
  let best = null, bd = 1e9;
  for (const h of mapHits){ const d = Math.hypot(h.x - x, h.y - y); if (d < Math.max(h.r, 18) && d < bd){ bd = d; best = h; } }
  if (!best){ hideInfo(); return; }
  const o = best.obj;
  if (o.R){ const ext = Math.max(o.R * 3, o.soi && isFinite(o.soi) ? Math.min(o.soi * 0.6, o.R * 40) : o.R * 3); animTo({k:'body', b:o}, mapScaleFor(ext), 1300); }
  else if (o.x !== undefined){ animTo({k:'pt', x:o.x, y:o.y}, F.map.s, 900); }
  showInfo(o);
}
function showInfo(o){
  const kv = [];
  let fact = o.fact || '';
  if (o.R){
    kv.push(['Radius', fDist(o.R)], ['Surface gravity', o.type === 0 ? nf1.format(o.g / G0) + ' g' : nf2.format(o.g / G0) + ' g'], ['Escape velocity', fVel(o.vesc)]);
    if (o.rotP || o.lock) kv.push(['Day length', o.lock ? 'tidally locked' : fTime(Math.abs(o.rotP))]);
    if (o.parentB) kv.push(['Orbital period', fTime(o.period)], [o.parentB === SUN ? 'From the Sun' : 'From ' + o.parentB.name, fDist(o.a)]);
    if (o !== EARTH){ const d = Math.hypot(o.X - EARTH.X, o.Y - EARTH.Y); kv.push(['Light from Earth', fTime(d / C_LIGHT)]); }
    const [vx, vy] = vesselAbs(); kv.push(['From your vessel', fDist(Math.hypot(o.X - vx, o.Y - vy))]);
  } else {
    kv.push(['Distance', fDist(o.dist)]);
    if (o.dist > 1e3 * AU) kv.push(['Light left it', fTime(o.dist / C_LIGHT) + ' ago']);
    if (o.size) kv.push(['Diameter', fDist(o.size)]);
    if (o.kind === 'mw'){ kv.push(['Diameter', '~105,700 ly'], ['Stars', '100–400 billion']); fact = 'Our home galaxy, a barred spiral. The Sun orbits its centre once every ~230 million years.'; }
    if (o.kind === 'uni'){ kv.push(['Age', '13.8 billion years']); fact = 'The farthest light we can see, the cosmic microwave background, has travelled for 13.8 billion years. Expansion has since carried its source 46.5 billion ly away.'; }
  }
  $('#infoT').textContent = o.name;
  const box = $('#infoKV'); box.innerHTML = '';
  for (const [k, v] of kv){ const a = document.createElement('span'), b = document.createElement('b'); a.textContent = k; b.textContent = v; box.append(a, b); }
  $('#infoP').textContent = fact; $('#infoP').hidden = !fact;
  $('#info').hidden = false;
}
function hideInfo(){ $('#info').hidden = true; }

function mapOnReparent(){ if (F && F.map && F.mapOn && (F.map.focus.k === 'vessel' || F.map.focus.k === 'body')){ const f = fitOrbit(); animTo(f.focus, f.s, 1400); } }
