'use strict';
/* ===== flight view: vessel, exhaust, particles, crash effects, frame ===== */
const vcan = document.createElement('canvas'), vctx = vcan.getContext('2d');
function drawVesselLit(parts, com, bb, s, side, lit, ambient){
  const pad = 3.5, pw = (Math.max(Math.abs(bb.x0), Math.abs(bb.x1)) * 2 + pad * 2) * s, ph = (Math.max(Math.abs(bb.y0), Math.abs(bb.y1)) * 2 + pad * 2) * s;
  if (pw * ph > 2.6e6 || pw < 3){ drawVessel(ctx, parts, com); return; }
  const k = DPR, cw = Math.ceil(pw * k) + 2, ch = Math.ceil(ph * k) + 2;
  // the shaded image only changes when the parts, zoom or lighting change, so reuse it between frames
  const key = parts.length + ':' + parts[0].uid + ':' + parts[parts.length - 1].uid + '|' + s.toFixed(4) + '|' + side + '|' + Math.round(lit * 20) + '|' + Math.round(ambient * 10) + '|' + k;
  if (vcan.key === key){ ctx.save(); ctx.scale(1 / (s * k), -1 / (s * k)); ctx.drawImage(vcan, 0, 0, cw, ch, -cw / 2, -ch / 2, cw, ch); ctx.restore(); return; }
  vcan.key = key;
  if (vcan.width < cw || vcan.height < ch){ vcan.width = Math.max(cw, vcan.width); vcan.height = Math.max(ch, vcan.height); }
  vctx.setTransform(1, 0, 0, 1, 0, 0); vctx.clearRect(0, 0, cw, ch);
  vctx.setTransform(s * k, 0, 0, -s * k, cw / 2, ch / 2);
  drawVessel(vctx, parts, com);
  vctx.setTransform(1, 0, 0, 1, 0, 0); vctx.globalCompositeOperation = 'source-atop';
  const shade = 0.6 * lit + (1 - lit) * 0.15;
  const g = vctx.createLinearGradient(side > 0 ? 0 : cw, 0, side > 0 ? cw : 0, 0);
  g.addColorStop(0, `rgba(0,4,16,${shade})`); g.addColorStop(0.55, `rgba(0,4,16,${shade * 0.25})`); g.addColorStop(1, `rgba(255,236,210,${0.1 * lit})`);
  vctx.fillStyle = g; vctx.fillRect(0, 0, cw, ch);
  const dark = (1 - lit) * (0.72 - ambient * 0.3);
  if (dark > 0){ vctx.fillStyle = `rgba(3,6,18,${dark})`; vctx.fillRect(0, 0, cw, ch); }
  vctx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.scale(1 / (s * k), -1 / (s * k)); ctx.drawImage(vcan, 0, 0, cw, ch, -cw / 2, -ch / 2, cw, ch); ctx.restore();
}

/* particles & crash simulation (runs on real time, capped at 4x) */
function effectsFrame(dt){
  if (!F) return;
  const b = F.p, warp = WARPS[F.warp], q = Q(), hi = SETTINGS.particles !== 'low' && PERF.tier > 0;
  if (warp > 10 || F.mode === 'rails') F.smoke.length = 0;
  const step = dt * Math.min(warp, 10);
  for (const p of F.smoke){
    p.life += step;
    const ax = -b.w * p.y, ay = b.w * p.x, k = 1 - Math.exp(-step * (p.dust ? 1.4 : 0.55));
    p.vx += (ax - p.vx) * k; p.vy += (ay - p.vy) * k;
    const r = Math.hypot(p.x, p.y);
    if (!p.dust){ p.vx += p.x / r * 0.6 * step; p.vy += p.y / r * 0.6 * step; }
    p.x += p.vx * step; p.y += p.vy * step; p.r += p.g * step;
    if (r < b.R + 1.5 && !b.gas){ const nx = p.x / r, ny = p.y / r, vr = p.vx * nx + p.vy * ny;
      if (vr < 0){ p.vx -= vr * nx * 1.6; p.vy -= vr * ny * 1.6; const side = (p.r % 2 > 1 ? 1 : -1); p.vx += -ny * side * Math.abs(vr) * 0.8; p.vy += nx * side * Math.abs(vr) * 0.8; }
      p.x = nx * (b.R + 1.5); p.y = ny * (b.R + 1.5); }
  }
  F.smoke = F.smoke.filter(p => p.life < p.max);
  for (const p of F.fx){ p.life += dt; if (p.spark){ const r = Math.hypot(p.x, p.y), g = b.mu / (r * r); p.vx -= p.x / r * g * dt; p.vy -= p.y / r * g * dt; } p.x += p.vx * dt; p.y += p.vy * dt; }
  F.fx = F.fx.filter(p => p.life < p.max);
  F.flash = Math.max(0, F.flash - dt * 2.2);
  for (const bm of F.booms){ bm.t += dt; bm.x += bm.vx * dt; bm.y += bm.vy * dt; }
  F.booms = F.booms.filter(bm => bm.t < (bm.small ? 2.5 : 4.5));
  // fragments: tumble, burn, bounce and settle
  for (const f of F.frags){
    f.t += dt; f.burn = Math.max(0, f.burn - dt * 0.12);
    if (f.rest){ const a = f.lon + spinB(b, F.t), R = b.R + 0.6; f.x = Math.cos(a) * R; f.y = Math.sin(a) * R; }
    else {
      const r = Math.hypot(f.x, f.y), g = b.mu / (r * r);
      f.vx -= f.x / r * g * dt; f.vy -= f.y / r * g * dt;
      const rho = density(b, r - b.R); if (rho > 0){ const rvx = f.vx + b.w * f.y, rvy = f.vy - b.w * f.x, k = Math.min(1, rho * 0.02 * dt); f.vx -= rvx * k; f.vy -= rvy * k; }
      f.x += f.vx * dt; f.y += f.vy * dt; f.ang += f.av * dt;
      if (r < b.R + 0.6 && !b.gas){
        const nx = f.x / r, ny = f.y / r, gvx = -b.w * f.y, gvy = b.w * f.x, rvx = f.vx - gvx, rvy = f.vy - gvy, vn = rvx * nx + rvy * ny;
        if (vn < 0){ const tx = rvx - vn * nx, ty = rvy - vn * ny; f.vx = gvx + tx * 0.55 - vn * nx * 0.32; f.vy = gvy + ty * 0.55 - vn * ny * 0.32; f.av *= 0.6;
          if (hi) for (let k = 0; k < 4; k++) F.fx.push({x:f.x, y:f.y, vx:gvx + (Math.random() - .5) * 8, vy:gvy + (Math.random() - .5) * 8, life:0, max:.4 + Math.random() * .4, r:.6, hot:true, spark:true});
          if (Math.abs(vn) < 2.5 && Math.hypot(tx, ty) < 2.5){ f.rest = true; f.lon = Math.atan2(ny, nx) - spinB(b, F.t); } }
        f.x = nx * (b.R + 0.6); f.y = ny * (b.R + 0.6);
      }
    }
    if (f.burn > 0.1 && hi && Math.random() < f.burn * 0.9 && F.smoke.length < q.smoke)
      F.smoke.push({x:f.x, y:f.y, vx:-b.w * f.y + (Math.random() - .5) * 2, vy:b.w * f.x + (Math.random() - .5) * 2, life:0, max:4 + Math.random() * 5, r:1, g:2.2 * (b.atm ? 1 : 0.4), dust:!b.atm, fire:f.burn});
  }
  if (F.dead && F.secondary > 0 && Math.random() < dt * 2.2 && F.frags.length){
    const f = F.frags[(Math.random() * F.frags.length) | 0]; F.secondary--;
    F.booms.push({x:f.x, y:f.y, vx:-b.w * f.y, vy:b.w * f.x, t:0, r:6 + Math.random() * 10, air:!!b.atm, small:true}); AUD.boom(10, Math.hypot(f.x - F.x, f.y - F.y) + 60, !!b.atm); F.shake = Math.max(F.shake, 6);
    for (let i = 0; i < 30; i++){ const a = Math.random() * TAU, s = 5 + Math.random() * 30; F.fx.push({x:f.x, y:f.y, vx:-b.w * f.y + Math.cos(a) * s, vy:b.w * f.x + Math.sin(a) * s, life:0, max:.5 + Math.random(), r:1 + Math.random() * 2, hot:true, spark:Math.random() < .5}); }
  }
  if (F.dead && F.smokeColumn > 0 && F.booms.length){
    F.smokeColumn -= dt; const bm = F.booms[0], r = Math.hypot(bm.x, bm.y), ux = bm.x / r, uy = bm.y / r;
    for (let i = 0; i < (hi ? 3 : 1); i++) F.smoke.push({x:bm.x + (Math.random() - .5) * bm.r, y:bm.y + (Math.random() - .5) * bm.r, vx:-b.w * bm.y + ux * (10 + Math.random() * 14), vy:b.w * bm.x + uy * (10 + Math.random() * 14), life:0, max:9 + Math.random() * 8, r:bm.r * 0.3, g:bm.r * 0.18, fire:0.6});
  }
  F.frags = F.frags.filter(f => f.t < f.life + 30);
  // engine exhaust smoke
  if (F.dead || warp > 10 || F.thrustNow <= 0) return;
  // exhaust kicks up surface dust on any solid world when close to the ground
  const hb = altNow() + F.bb.y0;
  if (!b.gas && hb < 80 && F.smoke.length < q.smoke){
    const r = Math.hypot(F.x, F.y), ux = F.x / r, uy = F.y / r, gx = ux * b.R, gy = uy * b.R, k = (1 - hb / 80) * F.throttle;
    for (let i = 0; i < (hi ? 4 : 2) * k + 0.3; i++){
      const side = Math.random() < 0.5 ? -1 : 1, v = 20 + Math.random() * 45, up = 2 + Math.random() * 6;
      F.smoke.push({x:gx + ux * 0.5, y:gy + uy * 0.5, vx:-b.w * gy + (-uy * side) * v + ux * up, vy:b.w * gx + (ux * side) * v + uy * up, life:0, max:1.5 + Math.random() * 2.5, r:1 + Math.random(), g:2.5 + Math.random() * 2, dust:true});
    }
  }
  const rho = density(b, altNow()); if (rho <= 0.0005) return;
  const live = new Set(liveEngines()), exits = exitsOf(F.parts, F.st.act, F.com, live);
  if (!exits.length) return;
  const dense = Math.min(1, rho / 1.225), n = Math.min(hi ? 5 : 2, Math.ceil(exits.length * 0.8));
  for (let i = 0; i < n * F.throttle + 0.5 && F.smoke.length < (SETTINGS.particles === 'low' ? Math.min(220, q.smoke) : q.smoke); i++){
    const e = exits[(Math.random() * exits.length) | 0];
    const [ex, ey] = v2w(e.x, e.y), [nx, ny] = v2w(e.nx, e.ny), [px, py] = [-ny, nx];
    const v = 60 + Math.random() * 60, j = (Math.random() - 0.5) * 20;
    F.smoke.push({x:F.x + ex + nx * e.ew * 2, y:F.y + ey + ny * e.ew * 2, vx:F.vx + nx * v + px * j, vy:F.vy + ny * v + py * j, life:0, max:(7 + Math.random() * 8) * (0.4 + 0.6 * dense), r:e.ew * 0.8, g:e.ew * (1.6 + Math.random()) * (1.6 - dense * 0.6)});
  }
}
/* one sprite per particle, culled to the view and capped in on-screen size (keeps fill-rate low on phones) */
function smokeSprite(light){
  const q = Math.round(clamp(light, 0, 1) * 4), key = 'smk' + q;
  if (!IMG[key]){ const t = q / 4, c = [52 + (232 - 52) * t, 56 + (236 - 56) * t, 66 + (242 - 66) * t].map(v => v | 0);
    softSprite(key, `rgba(${c[0]},${c[1]},${c[2]},.9)`, `rgba(${c[0]},${c[1]},${c[2]},.45)`); }
  return IMG[key];
}
function drawParticles(light, s){
  const SM = smokeSprite(light), DK = smokeSprite(0.05), dc = hexRgb(F.p.col);
  const DUB = softSprite('dust_' + F.p.id, `rgba(${dc[0]},${dc[1]},${dc[2]},.9)`, `rgba(${dc[0] * .85 | 0},${dc[1] * .85 | 0},${dc[2] * .85 | 0},.4)`);
  const FI = softSprite('fire', 'rgba(255,214,140,1)', 'rgba(255,120,40,.5)');
  const half = Math.hypot(W, H) / 2 / s, rmax = Math.min(W, H) * 0.6 / s;
  for (const p of F.smoke){
    const x = p.x - F.x, y = p.y - F.y, r = Math.min(p.r, rmax);
    if (Math.abs(x) > half + r || Math.abs(y) > half + r) continue;
    const k = p.life / p.max, a = (1 - k) * Math.min(1, p.life * 3) * 0.55;
    if (a < 0.02) continue;
    ctx.globalAlpha = p.dust ? a * (0.3 + 0.7 * light) : a * (p.fire ? 0.85 : 0.9);
    ctx.drawImage(p.dust ? DUB : (p.fire ? DK : SM), x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const p of F.smoke){
    const age = p.fire ? 1.2 : 0.6; if (p.life > age || p.dust) continue;
    const x = p.x - F.x, y = p.y - F.y, r = Math.min(p.r * 1.1, rmax); if (Math.abs(x) > half + r || Math.abs(y) > half + r) continue;
    ctx.globalAlpha = (1 - p.life / age) * (p.fire ? 0.6 * p.fire : 0.5); ctx.drawImage(FI, x - r, y - r, r * 2, r * 2);
  }
  for (const p of F.fx){
    const x = p.x - F.x, y = p.y - F.y; if (Math.abs(x) > half || Math.abs(y) > half) continue;
    const k = p.life / p.max; ctx.globalAlpha = Math.max(0, 1 - k) * (p.hot ? 1 : 0.6);
    if (p.spark){ ctx.strokeStyle = '#ffd89a'; ctx.lineWidth = p.r * 0.35; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.vx * 0.04, y - p.vy * 0.04); ctx.stroke(); }
    else { const r = Math.min(p.r * (1 + k * 2), rmax); ctx.drawImage(FI, x - r, y - r, r * 2, r * 2); }
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
function drawCrash(s){
  const b = F.p;
  for (const sc of F.scorch){
    const a = sc.lon + spinB(b, F.t), x = Math.cos(a) * b.R - F.x, y = Math.sin(a) * b.R - F.y;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a - Math.PI / 2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, sc.r); g.addColorStop(0, 'rgba(12,8,6,.85)'); g.addColorStop(1, 'rgba(12,8,6,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, sc.r, sc.r * 0.22, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  for (const f of F.frags){
    ctx.save(); ctx.translate(f.x - F.x, f.y - F.y); ctx.rotate(f.ang);
    drawVessel(ctx, [f.p], {x:0, y:0}, `rgba(16,10,8,${0.35 + 0.5 * (1 - f.burn)})`);
    if (f.burn > 0.05){ ctx.globalCompositeOperation = 'lighter'; const d = defOf(f.p), r = Math.max(d.w, d.h) * 0.7, FI = softSprite('fire', 'rgba(255,214,140,1)', 'rgba(255,120,40,.5)');
      ctx.globalAlpha = f.burn * (0.55 + 0.25 * Math.sin(performance.now() / 70 + f.x)); ctx.drawImage(FI, -r, -r, r * 2, r * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore();
  }
  for (const bm of F.booms){   // solid fire core and dark smoke shell, then the additive glow below
    const x = bm.x - F.x, y = bm.y - F.y, t = bm.t, grow = 1 - Math.exp(-t * 6), fade = Math.max(0, 1 - t / (bm.small ? 1.6 : 2.8)), R = bm.r * (0.4 + 1.3 * grow);
    if (bm.air){ const sm = ctx.createRadialGradient(x, y, R * 0.3, x, y, R * 1.25); sm.addColorStop(0, `rgba(40,30,26,${0.5 * fade})`); sm.addColorStop(1, 'rgba(40,30,26,0)'); ctx.fillStyle = sm; ctx.beginPath(); ctx.arc(x, y, R * 1.25, 0, TAU); ctx.fill(); }
    const g = ctx.createRadialGradient(x, y, 0, x, y, R * 0.85); g.addColorStop(0, `rgba(255,236,190,${0.95 * fade})`); g.addColorStop(0.45, `rgba(255,140,40,${0.85 * fade})`); g.addColorStop(1, 'rgba(200,60,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 0.85, 0, TAU); ctx.fill();
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const bm of F.booms){
    const x = bm.x - F.x, y = bm.y - F.y, t = bm.t;
    const grow = 1 - Math.exp(-t * 6), fade = Math.max(0, 1 - t / (bm.small ? 1.4 : 2.4)), R = bm.r * (0.4 + 1.3 * grow);
    let g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(255,252,236,${fade})`); g.addColorStop(0.25, `rgba(255,210,120,${0.9 * fade})`); g.addColorStop(0.6, `rgba(255,110,40,${0.55 * fade})`); g.addColorStop(1, 'rgba(160,40,10,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    if (!bm.small){
      const sr = bm.r * 0.6 + (bm.air ? 340 : 120) * t, sa = Math.max(0, 0.45 * (1 - t / 1.6));
      if (sa > 0){ ctx.strokeStyle = `rgba(255,236,210,${sa})`; ctx.lineWidth = Math.max(1.5 / s, bm.r * 0.08); ctx.beginPath(); ctx.arc(x, y, sr, 0, TAU); ctx.stroke(); }
    }
  }
  ctx.restore();
}
function drawPlasma(){
  if (F.q < 4e4 || F.dead) return;
  const k = clamp(Math.log10(F.q / 4e4) / 1.4, 0, 1), [vx, vy] = airVel(), sp = Math.hypot(vx, vy) || 1;
  const ux = vx / sp, uy = vy / sp, w = F.bb.w, hh = F.bb.h / 2, t = performance.now() / 1000;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const fx = ux * hh * 0.9, fy = uy * hh * 0.9;
  let g = ctx.createRadialGradient(fx, fy, 0, fx, fy, w * 1.6);
  g.addColorStop(0, `rgba(255,240,220,${0.8 * k})`); g.addColorStop(0.5, `rgba(255,140,90,${0.45 * k})`); g.addColorStop(1, 'rgba(255,90,140,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, w * 1.6, 0, TAU); ctx.fill();
  const px = -uy, py = ux;
  for (let j = 0; j < 9; j++){
    const off = (j / 8 - 0.5) * w * 1.3, L = hh * (2 + 6 * k) * (0.7 + 0.3 * Math.sin(t * 13 + j * 2.1)), sx = fx + px * off, sy = fy + py * off;
    g = ctx.createLinearGradient(sx, sy, sx - ux * L, sy - uy * L);
    g.addColorStop(0, `rgba(255,170,110,${0.45 * k})`); g.addColorStop(0.6, `rgba(255,90,150,${0.18 * k})`); g.addColorStop(1, 'rgba(255,60,160,0)');
    ctx.strokeStyle = g; ctx.lineWidth = w * 0.18; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - ux * L + px * off * 0.6, sy - uy * L + py * off * 0.6); ctx.stroke();
  }
  ctx.restore();
}

function renderFlight(dt){
  snapBodies(F.t);
  const s = F.zoom, b = F.p, alt = altNow();
  F.camRot += wrapPi(Math.PI / 2 - Math.atan2(F.y, F.x) - F.camRot) * Math.min(1, dt * 3);
  const rot = F.camRot, sun = sunInfo();
  const dayK = smooth(-0.1, 0.22, sun.elev) * sun.lit, sunsetK = Math.exp(-(((sun.elev - 0.03) / 0.13) ** 2)) * sun.lit;
  const light = b.atm ? clamp(0.12 + 0.88 * smooth(-0.12, 0.12, sun.elev), 0, 1) * (0.25 + 0.75 * sun.lit) : sun.lit * smooth(-0.05, 0.05, sun.elev + 0.02) * 0.9 + 0.1;
  let skyK = 0;
  if (b.atm) skyK = Math.exp(-Math.max(0, alt) / (b.atm.H * 2.2)) * Math.min(1, b.atm.rho0 / 0.4 + 0.25) * smooth(1.2e4, 3e4, b.R * s);
  bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bctx.fillStyle = '#020309'; bctx.fillRect(0, 0, W, H);
  drawStarsTo(bctx, clamp(1 - skyK * (0.4 + dayK * 1.6), 0, 1), rot, false);
  GLR.begin();
  const vxA = b.X + F.x, vyA = b.Y + F.y; let horizonA = 0;
  for (const o of BODIES){
    const [rx, ry] = toScreenDir(o === b ? -F.x : o.X - vxA, o === b ? -F.y : o.Y - vyA, rot), rpx = o.R * s;
    if (o === b) horizonA = smooth(1.2e4, 3e4, rpx);
    if ((o === b && rpx > 3.2e4) || rpx > 6e5 || Math.hypot(rx, ry) * s - rpx * 5 > Math.hypot(W, H)) continue;
    const lx = SUN.X - o.X, ly = SUN.Y - o.Y, ld = Math.hypot(lx, ly) || 1;
    GLR.sphere(o, W / 2 + rx * s, H / 2 - ry * s, Math.max(rpx, 0.6), toScreenDir(lx / ld, ly / ld, rot), F.t, K2D, 1);
  }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  if (skyK > 0.002){
    const a = b.atm, zen = mixc(mixc(SKY_NIGHT, a.zen, dayK), a.set, sunsetK * 0.25), hor = mixc(mixc([12, 18, 36], a.hor, dayK), a.set, sunsetK * 0.85);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(zen, skyK)); g.addColorStop(1, rgba(hor, Math.min(1, skyK * 1.15)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // small, subtle sun glint at the screen edge (space only; the lit sky already shows the sun in air)
  const [gx, gy] = toScreenDir(sun.sx, sun.sy, rot), gr = Math.min(W, H) * 0.5;
  const ga = sun.lit * (1 - clamp(skyK * 3, 0, 1)) * (b.atm && sun.elev < 0 ? 0 : 1);
  if (ga > 0.02){
    const px = W / 2 + gx * gr, py = H / 2 - gy * gr, rr = 70, g = ctx.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, `rgba(255,252,244,${0.22 * ga})`); g.addColorStop(0.35, `rgba(255,240,220,${0.06 * ga})`); g.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = g; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  let shx = 0, shy = 0;
  if (!reduceMotion && SETTINGS.shake){
    const rumble = F.thrustNow > 0 && alt < 15000 ? Math.min(1, F.thrustNow / 5000) * density(b, alt) * 1.6 : 0;
    const amp = F.shake + rumble; shx = (Math.random() - .5) * amp; shy = (Math.random() - .5) * amp;
  }
  F.shake *= Math.exp(-dt * 2.5);
  ctx.save(); ctx.translate(W / 2 + shx, H / 2 + shy); ctx.scale(s, -s); ctx.rotate(rot);
  drawHorizon(b, -F.x, -F.y, s, light, horizonA);
  drawRocks(b, -F.x, -F.y, s, light);
  drawClouds(-F.x, -F.y, s, light, sunsetK);
  drawPad(-F.x, -F.y, s, light);
  drawParticles(light, s);
  for (const d of F.debris){ ctx.save(); ctx.translate(d.x - F.x, d.y - F.y); ctx.rotate(d.ang - Math.PI / 2); drawVessel(ctx, d.parts, d.com); ctx.restore(); }
  if (!F.dead){
    ctx.save(); ctx.rotate(F.ang - Math.PI / 2);
    if (F.chuteOn){ const cp = F.parts.find(p => defOf(p).kind === 'chute'); if (cp){ ctx.save(); ctx.translate(cp.x - F.com.x, cp.y - F.com.y + defOf(cp).h / 2); drawCanopy(ctx, 0, Math.max(0.06, F.chute), countKind(F.parts, 'chute')); ctx.restore(); } }
    const side = Math.sign(sun.sx * Math.sin(F.ang) - sun.sy * Math.cos(F.ang)) || 1;
    drawVesselLit(F.parts, F.com, F.bb, s, side, sun.lit, skyK * dayK);
    if (F.thrustNow > 0) drawVesselFlames(ctx, F.parts, F.st.act, F.com, F.throttle, Math.min(1, density(b, alt) / 1.225), new Set(liveEngines()));
    ctx.restore();
    drawPlasma();
  }
  drawCrash(s);
  ctx.restore();
  if (F.flash > 0){ ctx.fillStyle = `rgba(255,244,226,${F.flash * 0.75})`; ctx.fillRect(0, 0, W, H); }
  const hpx = F.bb.h * s;
  if (!F.dead){
    if (hpx < 8){ ctx.strokeStyle = '#ffb454'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(W / 2, H / 2, 8, 0, TAU); ctx.stroke(); }
    const [vx, vy] = refVel();
    if (SETTINGS.markers && Math.hypot(vx, vy) > 1 && !F.landed){
      const R0 = clamp(hpx * 0.6 + 34, 60, Math.min(W, H) * 0.42), [sx, sy] = toScreenDir(vx, vy, rot), m = Math.hypot(sx, sy);
      const mk = (dir, retro) => {
        const x = W / 2 + sx / m * R0 * dir, y = H / 2 - sy / m * R0 * dir;
        ctx.strokeStyle = retro ? 'rgba(255,140,120,.9)' : 'rgba(126,224,161,.95)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.stroke();
        if (retro){ ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y - 11); ctx.moveTo(x - 6, y); ctx.lineTo(x - 11, y); ctx.moveTo(x + 6, y); ctx.lineTo(x + 11, y); ctx.stroke(); }
      };
      mk(1, false); mk(-1, true);
      const [hx, hy] = toScreenDir(Math.cos(F.ang), Math.sin(F.ang), rot), x = W / 2 + hx * (R0 + 12), y = H / 2 - hy * (R0 + 12);
      ctx.fillStyle = 'rgba(233,238,247,.85)'; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(-hy, hx)); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
}
