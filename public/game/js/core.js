'use strict';
/* ===== core: constants, utilities, real solar-system data, Kepler orbits ===== */
const $ = s => document.querySelector(s);
const TAU = Math.PI * 2, deg = Math.PI / 180;
const AU = 1.495978707e11, LY = 9.4607304725808e15, C_LIGHT = 299792458;
const G0 = 9.80665, DAY = 86400, YEAR = 365.25 * DAY;
const J2000 = Date.UTC(2000, 0, 1, 12);
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function wrapPi(a){ a %= TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; }
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// deterministic noise helpers
function h1(i){ const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function n1(x){ const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(h1(i), h1(i + 1), u); }
function rng(seed){ let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// formatting
const nf0 = new Intl.NumberFormat('en-US', {maximumFractionDigits:0});
const nf1 = new Intl.NumberFormat('en-US', {minimumFractionDigits:1, maximumFractionDigits:1});
const nf2 = new Intl.NumberFormat('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
function fDist(m){
  if (!isFinite(m)) return '∞';
  const a = Math.abs(m);
  if (a < 1e4) return nf0.format(m) + ' m';
  if (a < 1e7) return nf1.format(m / 1e3) + ' km';
  if (a < 1e10) return nf0.format(m / 1e3) + ' km';
  if (a < 5e3 * AU){ const v = m / AU, av = Math.abs(v); return (av < 10 ? nf2 : av < 1000 ? nf1 : nf0).format(v) + ' AU'; }
  const ly = m / LY, al = Math.abs(ly);
  if (al < 1e6) return (al < 10 ? nf2 : al < 100 ? nf1 : nf0).format(ly) + ' ly';
  if (al < 1e9) return (al < 1e7 ? nf2 : al < 1e8 ? nf1 : nf0).format(ly / 1e6) + ' million ly';
  return nf1.format(ly / 1e9) + ' billion ly';
}
const fVel = v => (Math.abs(v) < 1e4 ? nf0.format(v) + ' m/s' : nf1.format(v / 1000) + ' km/s');
function fTime(s){
  s = Math.max(0, s);
  if (s < 60) return nf0.format(s) + ' s';
  if (s < 3600) return Math.floor(s / 60) + ' min ' + String(Math.floor(s % 60)).padStart(2, '0') + ' s';
  if (s < 86400) return Math.floor(s / 3600) + ' h ' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ' min';
  if (s < YEAR) return nf1.format(s / 86400) + ' days';
  if (s < 1e4 * YEAR) return nf2.format(s / YEAR) + ' years';
  if (s < 1e9 * YEAR) return nf0.format(s / YEAR) + ' years';
  return nf1.format(s / YEAR / 1e9) + ' billion years';
}
function fMET(s){
  s = Math.floor(Math.max(0, s));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  const p = n => String(n).padStart(2, '0');
  return 'T+ ' + (d ? d + 'd ' : '') + p(h) + ':' + p(m) + ':' + p(x);
}

/* ===== bodies (real radii, GM, semi-major axes, rotation, obliquity) =====
   Orbits are circular and coplanar; starting angles come from J2000 mean longitudes, so planets sit
   roughly where they really are on today's date. The 2D world is viewed from ecliptic south,
   so prograde motion is clockwise on screen and launching to the right uses Earth's spin. */
const BODIES = [
  {id:'sun', name:'Sun', R:696340e3, mu:1.32712440018e20, rotP:609.12*3600, tilt:7.25, type:0, col:'#ffd27a',
    fact:'Holds 99.86% of the Solar System’s mass. Its light takes about 8 min 20 s to reach Earth.'},
  {id:'mercury', parent:'sun', name:'Mercury', R:2439.7e3, mu:2.2032e13, a:0.387098*AU, L0:252.25, rotP:1407.6*3600, tilt:0.03, type:3, col:'#a39a92',
    fact:'Smallest planet. One year lasts 88 Earth days.'},
  {id:'venus', parent:'sun', name:'Venus', R:6051.8e3, mu:3.24859e14, a:0.723332*AU, L0:181.98, rotP:-5832.5*3600, tilt:2.6, type:4, col:'#e8cc95',
    atm:{rho0:65, H:15900, top:150e3, zen:[196,150,80], hor:[232,198,132], set:[205,120,60], glow:[1,.85,.55], k:1.1, h:.07},
    fact:'Hottest planet, about 465 °C at the surface. It spins backwards, slower than it orbits.'},
  {id:'earth', parent:'sun', name:'Earth', R:6371e3, mu:3.986004418e14, a:1.000001*AU, L0:100.46, rotP:23.9345*3600, tilt:23.44, type:1, col:'#4f86d9',
    atm:{rho0:1.225, H:8500, top:100e3, zen:[38,104,212], hor:[168,204,242], set:[240,136,74], glow:[.35,.6,1], k:.95, h:.055},
    fact:'Home. The only world known to host life.'},
  {id:'moon', parent:'earth', name:'Moon', R:1737.4e3, mu:4.9048695e12, a:384400e3, L0:218.32, lock:true, tilt:6.7, type:2, col:'#b0b0b0',
    fact:'Tidally locked: the same face always points at Earth.'},
  {id:'mars', parent:'sun', name:'Mars', R:3389.5e3, mu:4.282837e13, a:1.523679*AU, L0:355.45, rotP:24.6229*3600, tilt:25.19, type:5, col:'#d0673a',
    atm:{rho0:0.020, H:11100, top:80e3, zen:[170,122,86], hor:[214,170,125], set:[110,140,205], glow:[.95,.62,.45], k:.45, h:.04},
    fact:'Home to Olympus Mons, the tallest volcano known in the Solar System.'},
  {id:'phobos', parent:'mars', name:'Phobos', R:11.27e3, mu:7.087e5, a:9376e3, L0:40, lock:true, tilt:0, type:14, col:'#7a6e64', seed:3,
    fact:'Orbits Mars three times a day and is slowly spiralling inward.'},
  {id:'deimos', parent:'mars', name:'Deimos', R:6.2e3, mu:9.8e4, a:23463e3, L0:200, lock:true, tilt:0, type:14, col:'#8a7e72', seed:7,
    fact:'The smaller, outer moon of Mars, about 12 km across.'},
  {id:'jupiter', parent:'sun', name:'Jupiter', R:69911e3, mu:1.26686534e17, a:5.2044*AU, L0:34.40, rotP:9.925*3600, tilt:3.13, type:6, col:'#d8b98e', gas:true,
    atm:{rho0:.16, H:27000, top:400e3, zen:[150,128,98], hor:[205,182,140], set:[180,110,70], glow:[.85,.78,.62], k:.35, h:.03},
    fact:'More than twice as massive as all other planets combined. The Great Red Spot is a storm wider than Earth.'},
  {id:'io', parent:'jupiter', name:'Io', R:1821.6e3, mu:5.959916e12, a:421700e3, L0:10, lock:true, tilt:0, type:10, col:'#e0cc62',
    fact:'The most volcanically active body known.'},
  {id:'europa', parent:'jupiter', name:'Europa', R:1560.8e3, mu:3.202739e12, a:671034e3, L0:120, lock:true, tilt:0, type:11, col:'#d9d1bf',
    fact:'An ice shell over a global salty ocean.'},
  {id:'ganymede', parent:'jupiter', name:'Ganymede', R:2634.1e3, mu:9.887834e12, a:1070412e3, L0:250, lock:true, tilt:0, type:12, col:'#9c9284', seed:2,
    fact:'The largest moon in the Solar System, bigger than Mercury.'},
  {id:'callisto', parent:'jupiter', name:'Callisto', R:2410.3e3, mu:7.179289e12, a:1882709e3, L0:300, lock:true, tilt:0, type:12, col:'#6f665c', seed:9,
    fact:'One of the most heavily cratered surfaces known.'},
  {id:'saturn', parent:'sun', name:'Saturn', R:58232e3, mu:3.7931187e16, a:9.5826*AU, L0:49.94, rotP:10.656*3600, tilt:26.73, type:7, col:'#e3cf9c', gas:true, rings:[1.24, 2.27],
    atm:{rho0:.19, H:59500, top:500e3, zen:[170,150,110], hor:[215,196,150], set:[190,130,80], glow:[.92,.82,.6], k:.35, h:.03},
    fact:'Less dense than water on average. Its rings are mostly water ice.'},
  {id:'titan', parent:'saturn', name:'Titan', R:2574.7e3, mu:8.978138e12, a:1221870e3, L0:60, lock:true, tilt:0, type:13, col:'#d39b4a',
    atm:{rho0:5.3, H:21000, top:600e3, zen:[150,100,50], hor:[205,152,82], set:[120,80,40], glow:[1,.68,.3], k:1.2, h:.16},
    fact:'A thick nitrogen atmosphere and lakes of liquid methane.'},
  {id:'uranus', parent:'sun', name:'Uranus', R:25362e3, mu:5.793939e15, a:19.2184*AU, L0:313.23, rotP:-17.24*3600, tilt:97.77, type:8, col:'#9fd8e0', gas:true, rings:[1.64, 2.0],
    atm:{rho0:.42, H:27700, top:300e3, zen:[90,160,180], hor:[150,210,220], set:[100,150,170], glow:[.6,.9,1], k:.5, h:.04},
    fact:'Rolls around the Sun on its side, tilted 98°.'},
  {id:'neptune', parent:'sun', name:'Neptune', R:24622e3, mu:6.836529e15, a:30.11*AU, L0:304.88, rotP:16.11*3600, tilt:28.32, type:9, col:'#4a74e0', gas:true,
    atm:{rho0:.45, H:19700, top:300e3, zen:[40,80,170], hor:[90,130,210], set:[60,90,170], glow:[.45,.62,1], k:.5, h:.04},
    fact:'The fastest winds measured in the Solar System, over 2,000 km/h.'},
];
const B = {};
BODIES.forEach(b => { B[b.id] = b; b.children = []; b.seed = b.seed || (b.id.length * 1.37); });
BODIES.forEach(b => {
  b.parentB = b.parent ? B[b.parent] : null;
  if (b.parentB){
    b.parentB.children.push(b);
    b.n = Math.sqrt(b.parentB.mu / (b.a ** 3));
    b.soi = b.a * Math.pow(b.mu / b.parentB.mu, 0.4);
    b.period = TAU / b.n;
  } else { b.n = 0; b.soi = Infinity; b.a = 0; }
  b.w = b.lock ? -b.n : -TAU / b.rotP;   // spin rate (rad/s), clockwise = prograde
  b.g = b.mu / (b.R * b.R);
  b.vesc = Math.sqrt(2 * b.mu / b.R);
});
const SUN = B.sun, EARTH = B.earth;

let epochMs = Date.now();
function setEpoch(ms){
  epochMs = ms;
  const tEp = (ms - J2000) / 1000;
  BODIES.forEach(b => {
    if (b.parentB) b.th0 = wrapPi(-((b.L0 || 0) * deg + b.n * tEp));
    b.sp0 = b.lock ? b.th0 + Math.PI : wrapPi(b.w * tEp);
  });
}
setEpoch(epochMs);

function relB(b, t){
  const th = b.th0 - b.n * t, c = Math.cos(th), s = Math.sin(th), an = b.a * b.n;
  return {x:b.a * c, y:b.a * s, vx:an * s, vy:-an * c};
}
function absB(b, t){
  if (!b.parentB) return {x:0, y:0, vx:0, vy:0};
  const p = absB(b.parentB, t), r = relB(b, t);
  return {x:p.x + r.x, y:p.y + r.y, vx:p.vx + r.vx, vy:p.vy + r.vy};
}
const spinB = (b, t) => b.sp0 + b.w * t;
function snapBodies(t){ for (const b of BODIES){ const s = absB(b, t); b.X = s.x; b.Y = s.y; b.VX = s.vx; b.VY = s.vy; } }
function density(b, alt){ return (b.atm && alt < b.atm.top) ? b.atm.rho0 * Math.exp(-Math.max(0, alt) / b.atm.H) : 0; }
function railAlt(b){ return b.atm ? b.atm.top : Math.max(8000, Math.min(20000, b.R * 0.006)); }

/* ===== 2D Kepler elements & propagation (elliptic + hyperbolic) ===== */
function toEl(x, y, vx, vy, mu, t, nudged){
  const r = Math.hypot(x, y), v2 = vx * vx + vy * vy, h = x * vy - y * vx;
  const eps = v2 / 2 - mu / r, rv = x * vx + y * vy;
  const ex = ((v2 - mu / r) * x - rv * vx) / mu, ey = ((v2 - mu / r) * y - rv * vy) / mu;
  const e = Math.hypot(ex, ey);
  if (!nudged && (Math.abs(e - 1) < 1e-6 || Math.abs(h) < 1e-3)){
    const k = 0.999995;
    return toEl(x, y, (vx - y / r * 0.05) * k, (vy + x / r * 0.05) * k, mu, t, true);
  }
  const s = h >= 0 ? 1 : -1;
  const a = -mu / (2 * eps);
  const w = e > 1e-9 ? Math.atan2(ey, ex) : Math.atan2(y, x);
  const nu = wrapPi(s * (Math.atan2(y, x) - w));
  let M, n;
  if (e < 1){
    const E = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
    M = E - e * Math.sin(E); n = Math.sqrt(mu / (a * a * a));
  } else {
    const arg = clamp(Math.sqrt((e - 1) / (e + 1)) * Math.tan(nu / 2), -0.999999999, 0.999999999);
    const F = 2 * Math.atanh(arg);
    M = e * Math.sinh(F) - F; n = Math.sqrt(mu / (-a * a * a));
  }
  return {mu, a, e, w, s, M0:M, t0:t, n, p:a * (1 - e * e)};
}
function prop(el, t){
  const {mu, a, e, w, s, n, p} = el;
  let M = el.M0 + n * (t - el.t0), r, nu;
  if (e < 1){
    M = wrapPi(M);
    let E = e < 0.8 ? M : Math.PI * (M < 0 ? -1 : 1);
    for (let i = 0; i < 50; i++){ const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-12) break; }
    nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    r = a * (1 - e * Math.cos(E));
  } else {
    let F = Math.sign(M) * Math.log(2 * Math.abs(M) / e + 1.8);
    for (let i = 0; i < 60; i++){ const d = (e * Math.sinh(F) - F - M) / (e * Math.cosh(F) - 1); F -= d; if (Math.abs(d) < 1e-12) break; }
    nu = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(F / 2));
    r = a * (1 - e * Math.cosh(F));
  }
  const ang = w + s * nu, c = Math.cos(ang), sn = Math.sin(ang);
  const k = Math.sqrt(mu / p), vr = k * e * Math.sin(nu), vt = k * (1 + e * Math.cos(nu));
  return {x:r * c, y:r * sn, vx:vr * c - s * vt * sn, vy:vr * sn + s * vt * c, nu, r};
}
const peOf = el => el.a * (1 - el.e);
const apOf = el => el.e < 1 ? el.a * (1 + el.e) : Infinity;

/* event search along a conic: 'low' (below radius lowR), 'exit' (leave SOI), 'enter' (child SOI).
   Only events the orbit can physically reach are checked: if periapsis/apoapsis rule them all out,
   we jump straight to t1 with no stepping at all. A per-call time budget keeps frames smooth. */
function reach(p, el, lowR){
  const rp = peOf(el), ra = apOf(el);
  return {low:rp < lowR, exit:isFinite(p.soi) && ra > p.soi, kids:p.children.filter(c => rp < c.a + c.soi && ra > c.a - c.soi)};
}
function evAt(p, el, t, lowR, R){
  R = R || reach(p, el, lowR);
  const s = prop(el, t), r = Math.hypot(s.x, s.y);
  if (R.low && r < lowR) return {k:'low'};
  if (R.exit && r > p.soi) return {k:'exit'};
  for (const c of R.kids){ const q = relB(c, t); if (Math.hypot(s.x - q.x, s.y - q.y) < c.soi) return {k:'enter', c}; }
  return null;
}
function findEvent(p, el, t0, t1, lowR, maxIter, budgetMs){
  const R = reach(p, el, lowR);
  if (!R.low && !R.exit && !R.kids.length) return {t:t1, ev:null};
  const per = el.e < 1 ? TAU / el.n : Infinity, tStart = performance.now(), budget = budgetMs || 4;
  let t = t0, it = 0;
  while (t < t1 && it++ < (maxIter || 700)){
    if ((it & 31) === 0 && performance.now() - tStart > budget) break;
    const s = prop(el, t), r = Math.hypot(s.x, s.y), v = Math.max(Math.hypot(s.vx, s.vy), 1e-3);
    let dt = Infinity;
    if (R.low || R.exit) dt = Math.min(0.04 * r / v + 1, per * 0.02 + 1);
    for (const c of R.kids){
      const q = relB(c, t), d = Math.hypot(s.x - q.x, s.y - q.y) - c.soi;
      dt = Math.min(dt, Math.max(d, 0) / (v + c.a * c.n) * 0.9 + 1);
    }
    if (R.exit) dt = Math.min(dt, Math.max(p.soi - r, 0) / v * 0.9 + 1);
    dt = Math.min(dt, t1 - t);
    if (evAt(p, el, t + dt, lowR, R)){
      let lo = t, hi = t + dt;
      for (let k = 0; k < 44; k++){ const m = (lo + hi) / 2; if (evAt(p, el, m, lowR, R)) hi = m; else lo = m; }
      return {t:hi, ev:evAt(p, el, hi, lowR, R)};
    }
    t += dt;
  }
  return {t:Math.min(t, t1), ev:null};
}

// hydrate a body's surface "landness" (Earth only) – 1D noise along body-fixed longitude
let SITE_LON = 0;
function landness(lon){
  const x = lon * 7;
  let v = n1(x) * 0.58 + n1(x * 3.1 + 5) * 0.3 + n1(x * 9.7 + 2) * 0.12;
  const dl = Math.abs(wrapPi(lon - SITE_LON));
  if (dl < 0.005) v = Math.max(v, 0.72 - dl * 20);
  return v;
}
