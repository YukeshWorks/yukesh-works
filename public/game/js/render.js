'use strict';
/* ===== flight view rendering ===== */
const bgc = $('#bg'), glc = $('#gl'), fgc = $('#fg');
const bctx = bgc.getContext('2d', {alpha:false, desynchronized:true}) || bgc.getContext('2d'), ctx = fgc.getContext('2d');
let W = 0, H = 0, DPR = 1;
const K2D = {W:0, H:0, ctx:null};
function resize(){
  const q = Q(), r = fgc.getBoundingClientRect(); W = r.width; H = r.height;
  // pixel budget: big or high-DPI windows never get oversized canvases
  DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, q.dpr, Math.sqrt(q.px / Math.max(1, W * H))));
  for (const c of [bgc, fgc]){ const w = Math.round(W * DPR), h = Math.round(H * DPR); if (c.width !== w || c.height !== h){ c.width = w; c.height = h; } }
  const gd = Math.max(0.5, Math.min(window.devicePixelRatio || 1, q.gl, Math.sqrt(q.glpx / Math.max(1, W * H)))), gw = Math.round(W * gd), gh = Math.round(H * gd);
  if (glc.width !== gw || glc.height !== gh){ glc.width = gw; glc.height = gh; }
  K2D.W = W; K2D.H = H; K2D.ctx = bctx; starCache = null;
  if (typeof BLD !== 'undefined') BLD.v = (BLD.v || 0) + 1;
}
window.addEventListener('resize', resize);
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a == null ? 1 : a})`;
function hexRgb(h){ const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
const SKY_NIGHT = [6, 10, 22];

/* starfield pre-rendered once per size/tier, then drawn rotated as a single image */
let starCache = null;
function buildStarCache(){
  const D = Math.ceil(Math.hypot(W, H)), k = DPR, c = document.createElement('canvas');
  c.width = c.height = Math.ceil(D * k); const x = c.getContext('2d'); x.scale(k, k);
  const n = Math.min(STARS.length, Q().stars);
  for (let i = 0; i < n; i++){ const st = STARS[i]; x.globalAlpha = st.a; x.fillStyle = st.c; x.fillRect(D / 2 + st.x * D, D / 2 + st.y * D, st.s, st.s); }
  starCache = {c, D};
}
function drawStarsTo(c, alpha, rot){
  if (alpha <= 0.01) return;
  if (!starCache) buildStarCache();
  const {D} = starCache;
  c.save(); c.globalAlpha = alpha; c.translate(W / 2, H / 2); c.rotate(-rot); c.drawImage(starCache.c, -D / 2, -D / 2, D, D); c.restore();
}
function sunInfo(){
  const vx = F.p.X + F.x, vy = F.p.Y + F.y;
  let sx = SUN.X - vx, sy = SUN.Y - vy; const sd = Math.hypot(sx, sy) || 1; sx /= sd; sy /= sd;
  const r = Math.hypot(F.x, F.y), ux = F.x / r, uy = F.y / r;
  const elev = ux * sx + uy * sy;
  let lit = 1;
  if (F.p !== SUN){ const along = F.x * sx + F.y * sy, perp = Math.abs(F.x * sy - F.y * sx); if (along < 0 && perp < F.p.R) lit = clamp((perp - F.p.R * 0.985) / (F.p.R * 0.015), 0, 1); }
  return {sx, sy, elev, lit, dist:sd};
}
function toScreenDir(x, y, rot){ const c = Math.cos(rot), s = Math.sin(rot); return [x * c - y * s, x * s + y * c]; }

/* ground seen from close range */
function terrainColor(b, lon){
  if (b === EARTH){
    const v = landness(lon);
    if (v < 0.5) return v > 0.47 ? [46, 120, 160] : [12, 52, 98];
    const d = n1(lon * 40 + 3);
    return v < 0.53 ? [196, 178, 128] : mixc([52, 96, 40], [150, 128, 80], clamp(d * 1.4 - 0.3, 0, 1));
  }
  const base = hexRgb(b.col), k = 0.82 + 0.3 * n1(lon * 60 + b.seed * 10);
  return [base[0] * k, base[1] * k, base[2] * k];
}
function drawHorizon(b, dx, dy, s, light, alpha){
  const view = Math.hypot(W, H) / s, d = Math.hypot(dx, dy);
  if (d - b.R > view || alpha <= 0) return;
  const phc = Math.atan2(-dy, -dx), span = Math.min(Math.PI, view / b.R * 1.3 + 1e-5), N = Q().horizon, sp = spinB(b, F.t);
  const P = [];
  for (let i = 0; i <= N; i++){
    const a = phc - span + 2 * span * i / N, lon = a - sp;
    P.push([a, dx + Math.cos(a) * b.R, dy + Math.sin(a) * b.R, lon]);   // the drawn ground is exactly the physical surface
  }
  const deep = b.R - view * 2;
  ctx.save(); ctx.globalAlpha = alpha;
  const dcol = b.gas ? hexRgb(b.col) : terrainColor(b, phc - sp).map(v => v * 0.35);
  ctx.fillStyle = rgba(dcol);
  ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[1], p[2]) : ctx.moveTo(p[1], p[2]));
  ctx.lineTo(dx + Math.cos(phc) * deep, dy + Math.sin(phc) * deep); ctx.closePath(); ctx.fill();
  if (!b.gas){
    const bd = Math.min(Math.max(view * 0.035, 25), b.R * 0.02), bd2 = Math.min(Math.max(view * 0.12, 120), b.R * 0.06);
    for (let i = 0; i < N; i++){
      const p0 = P[i], p1 = P[i + 1], c = terrainColor(b, (p0[3] + p1[3]) / 2);
      for (const [depth, k] of [[bd2, 0.55], [bd, 1]]){
        ctx.fillStyle = rgba([c[0] * k, c[1] * k, c[2] * k]);
        ctx.beginPath(); ctx.moveTo(p0[1], p0[2]); ctx.lineTo(p1[1], p1[2]);
        ctx.lineTo(dx + Math.cos(p1[0]) * (b.R - depth), dy + Math.sin(p1[0]) * (b.R - depth));
        ctx.lineTo(dx + Math.cos(p0[0]) * (b.R - depth), dy + Math.sin(p0[0]) * (b.R - depth)); ctx.closePath(); ctx.fill();
      }
    }
  }
  // night shading
  ctx.fillStyle = `rgba(2,4,12,${(1 - light) * 0.82})`;
  ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[1], p[2]) : ctx.moveTo(p[1], p[2]));
  ctx.lineTo(dx + Math.cos(phc) * deep, dy + Math.sin(phc) * deep); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = b === EARTH ? `rgba(220,236,255,${0.25 * light})` : `rgba(255,255,255,${0.18 * light})`; ctx.lineWidth = 1.5 / s;
  ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[1], p[2]) : ctx.moveTo(p[1], p[2])); ctx.stroke();
  ctx.restore();
}
/* cloud / haze layers for every world with air */
const CLOUDS = {
  earth:{a0:1200, a1:8700, w0:1800, w1:7000, cell:3000, keep:0.42, col:'rgba(255,255,255,.95)', col2:'rgba(255,255,255,.55)', op:0.75},
  venus:{a0:46e3, a1:66e3, w0:9000, w1:26000, cell:7000, keep:0.05, col:'rgba(255,236,190,.95)', col2:'rgba(240,210,150,.6)', op:0.9},
  mars:{a0:6000, a1:24000, w0:6000, w1:20000, cell:14000, keep:0.72, col:'rgba(255,220,200,.7)', col2:'rgba(230,170,140,.35)', op:0.35},
  titan:{a0:25e3, a1:120e3, w0:12000, w1:40000, cell:9000, keep:0.25, col:'rgba(255,190,110,.9)', col2:'rgba(220,150,70,.5)', op:0.6},
};
function drawClouds(dx, dy, s, light, sunset){
  const b = F.p, C = CLOUDS[b.id]; if (!C || s < 0.0004) return;
  const alt = altNow(); if (alt > C.a1 * 3) return;
  const view = Math.hypot(W, H) / s, sp = spinB(b, F.t), phc = Math.atan2(-dy, -dx);
  const aSpan = view / b.R * 0.8, i0 = Math.floor((phc - aSpan - sp) * b.R / C.cell), i1 = Math.ceil((phc + aSpan - sp) * b.R / C.cell);
  if (i1 - i0 > 260) return;
  const fade = smooth(0.0004, 0.004, s) * (b === EARTH ? smooth(0.0015, 0.01, s) * 0.6 + 0.4 : 1);
  const W1 = softSprite('cloud_' + b.id, C.col, C.col2), O1 = softSprite('cloudO', 'rgba(255,170,110,.95)', 'rgba(255,140,90,.5)');
  const cs = Q().cloudStep;
  for (let i = i0; i <= i1; i++){
    if (cs > 1 && i % cs) continue;
    const hsh = h1(i * 1.7 + 0.3 + b.seed); if (hsh < C.keep) continue;
    const drift = F.t * 4 / b.R;   // clouds drift slowly with the wind
    const ca = (i + 0.5) * C.cell / b.R + sp + drift + (h1(i * 9.1) - 0.5) * C.cell / b.R;
    const calt = C.a0 + h1(i * 3.1) * (C.a1 - C.a0), cw = C.w0 + h1(i * 5.3) * (C.w1 - C.w0), ch = cw * (0.18 + h1(i * 7.7) * 0.12);
    const px = dx + Math.cos(ca) * (b.R + calt), py = dy + Math.sin(ca) * (b.R + calt);
    if (Math.hypot(px, py) > view * 0.6 + cw || cw * s > Math.hypot(W, H) * 5) continue;   // off-screen or larger than the view
    ctx.save(); ctx.translate(px, py); ctx.rotate(ca - Math.PI / 2);
    const a0 = (0.35 + 0.4 * hsh) * fade * C.op * (0.22 + 0.78 * light);
    for (let k = 0; k < 3; k++){
      const ox = (k - 1) * cw * 0.28, oy = (k === 1 ? 0.18 : 0) * ch, sw = cw * (k === 1 ? 0.7 : 0.5), sh = ch * (k === 1 ? 1.3 : 0.9);
      ctx.globalAlpha = a0; ctx.drawImage(W1, ox - sw / 2, oy - sh / 2, sw, sh);
      if (sunset > 0.05){ ctx.globalAlpha = a0 * sunset * 0.7; ctx.drawImage(O1, ox - sw / 2, oy - sh / 2, sw, sh); }
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
/* boulders and crater rims on airless and rocky worlds, drawn on the true surface line */
function drawRocks(b, dx, dy, s, light){
  if (b === EARTH || b.gas || b.type === 0 || s < 0.15) return;
  const view = Math.hypot(W, H) / s, sp = spinB(b, F.t), phc = Math.atan2(-dy, -dx), cell = 9;
  const aSpan = view / b.R * 0.7, i0 = Math.floor((phc - aSpan - sp) * b.R / cell), i1 = Math.ceil((phc + aSpan - sp) * b.R / cell);
  if (i1 - i0 > 400) return;
  const base = hexRgb(b.col), k = 0.35 + 0.65 * light;
  for (let i = i0; i <= i1; i++){
    const h = h1(i * 2.3 + b.seed); if (h < 0.55) continue;
    const a = (i + 0.5) * cell / b.R + sp, x = dx + Math.cos(a) * b.R, y = dy + Math.sin(a) * b.R, r = 0.3 + h1(i * 7.1) * (h > 0.95 ? 2.6 : 1.1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a - Math.PI / 2);
    ctx.fillStyle = rgba([base[0] * 0.55 * k, base[1] * 0.55 * k, base[2] * 0.55 * k]);
    ctx.beginPath(); ctx.ellipse(0, r * 0.35, r, r * 0.7, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = rgba([base[0] * 1.1 * k, base[1] * 1.1 * k, base[2] * 1.1 * k], 0.6);
    ctx.beginPath(); ctx.ellipse(-r * 0.25, r * 0.55, r * 0.45, r * 0.25, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
  }
}
function drawPad(dx, dy, s, light){
  if (F.p !== EARTH) return;
  const a = SITE_LON + spinB(EARTH, F.t), px = dx + Math.cos(a) * EARTH.R, py = dy + Math.sin(a) * EARTH.R;
  if (Math.hypot(px, py) > 4000) return;
  ctx.save(); ctx.translate(px, py); ctx.rotate(a - Math.PI / 2);
  ctx.fillStyle = '#5a5f69'; ctx.fillRect(-40, -3, 80, 3);
  ctx.fillStyle = '#2b2f37'; ctx.fillRect(-6, -3.2, 12, 3.2);
  ctx.fillStyle = '#3b404b'; ctx.fillRect(-14, 0, 28, 1.2);
  const tx = -12, th = 110;
  ctx.fillStyle = '#4a505d'; ctx.fillRect(tx - 3, 0, 0.8, th); ctx.fillRect(tx + 2.2, 0, 0.8, th);
  ctx.strokeStyle = '#4a505d'; ctx.lineWidth = 0.35; ctx.beginPath();
  for (let y = 0; y < th - 3; y += 4){ ctx.moveTo(tx - 2.6, y); ctx.lineTo(tx + 2.6, y + 4); ctx.moveTo(tx + 2.6, y); ctx.lineTo(tx - 2.6, y + 4); }
  ctx.stroke();
  for (let y = 20; y < th; y += 30){ ctx.fillStyle = '#4a505d'; ctx.fillRect(tx + 2.6, y, 6.5, 0.6); }
  for (const mx of [-34, 30]){ ctx.fillStyle = '#4a505d'; ctx.fillRect(mx, 0, 0.6, 130); }
  const blink = (Math.floor(performance.now() / 700) % 2) ? 1 : 0.25;
  ctx.fillStyle = `rgba(255,70,60,${blink})`; ctx.fillRect(tx - 1.5, th, 3, 1.5); ctx.fillRect(-34.7, 130, 2, 1.4); ctx.fillRect(29.3, 130, 2, 1.4);
  if (light < 0.6){ const g = ctx.createRadialGradient(0, 20, 0, 0, 20, 90); g.addColorStop(0, `rgba(255,236,190,${0.22 * (1 - light)})`); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; ctx.fillRect(-90, -10, 180, 120); }
  ctx.restore();
}

