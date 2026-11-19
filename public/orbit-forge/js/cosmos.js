'use strict';
/* ===== cosmos: real catalog beyond the Solar System + procedural imagery =====
   Distances are real. Directions use galactic longitude/latitude projected onto the galactic plane
   (x toward the galactic centre), so positions are approximate in 2D. */
function gal(dly, l, b){ const d = dly * LY * Math.cos(b * deg); return [d * Math.cos(l * deg), d * Math.sin(l * deg)]; }
const COSMOS = [];
function addObj(o){ const [x, y] = gal(o.d, o.l, o.b); o.x = x; o.y = y; o.dist = o.d * LY; COSMOS.push(o); return o; }
// stars: name, distance ly, l, b, colour, brightness rank (lower = label first)
[
  ['Proxima Centauri',4.246,313.9,-1.9,'#ff8a65',2,'The nearest star to the Sun, a small red dwarf with at least one Earth-mass planet.'],
  ['Alpha Centauri A & B',4.37,315.7,-0.7,'#fff1c4',1,'A Sun-like pair. Light from them left 4.4 years ago.'],
  ["Barnard's Star",5.96,31.0,14.1,'#ff8a65',3,'Fastest-moving star across our sky.'],
  ['Wolf 359',7.86,244.0,56.1,'#ff7a5c',5],
  ['Lalande 21185',8.31,185.1,64.9,'#ff8a65',5],
  ['Sirius',8.60,227.2,-8.9,'#cfe3ff',1,'The brightest star in Earth’s night sky, twice the Sun’s mass.'],
  ['Ross 154',9.70,11.3,-10.3,'#ff8a65',6],
  ['Epsilon Eridani',10.5,195.8,-48.1,'#ffc58a',3,'A young orange star with a dusty debris disk.'],
  ['Procyon',11.46,213.7,13.0,'#fff8e6',2],
  ['61 Cygni',11.4,82.3,-5.8,'#ffbe7a',4,'First star to have its distance measured, by Bessel in 1838.'],
  ['Tau Ceti',11.9,173.1,-73.4,'#fff0c8',3],
  ['Epsilon Indi',11.9,336.2,-48.0,'#ffbe7a',5],
  ['Altair',16.7,47.7,-8.9,'#f2f6ff',2],
  ['Vega',25.0,67.4,19.2,'#d8e6ff',1,'Once the North Star and will be again in about 12,000 years.'],
  ['Fomalhaut',25.1,20.5,-64.9,'#e6eeff',3],
  ['Arcturus',36.7,15.1,69.1,'#ffb36b',1],
  ['Capella',42.9,162.6,4.6,'#fff0c0',2],
  ['Aldebaran',65,181.0,-20.2,'#ffa05a',2],
  ['Regulus',79,226.4,48.9,'#dfe9ff',3],
  ['Polaris',433,123.3,26.5,'#fff6dc',1,'The current North Star, a supergiant about 433 light-years away.'],
  ['Pleiades',444,166.6,-23.5,'#a9c8ff',1,'A young open cluster of hot blue stars.'],
  ['Betelgeuse',548,199.8,-9.0,'#ff7a45',1,'A red supergiant near the end of its life. It will explode as a supernova.'],
  ['Rigel',860,209.2,-25.2,'#b9d2ff',1],
  ['Orion Nebula',1344,209.0,-19.4,'#ff8fb6',1,'The nearest large star-forming region to Earth.'],
  ['Deneb',2600,84.3,2.0,'#eef3ff',2],
  ['Crab Nebula',6500,184.6,-5.8,'#8fd3ff',2,'Remains of a supernova seen from Earth in 1054.'],
  ['Eta Carinae',7500,287.6,-0.6,'#ffd0a0',2],
  ['Sagittarius A*',26670,0,0,'#ffcf8a',0,'The supermassive black hole at the centre of the Milky Way, about 4 million Suns.'],
].forEach(([name, d, l, b, col, rank, fact]) => addObj({kind:'star', name, d, l, b, col, rank, fact}));
// galaxies: name, distance ly, l, b, diameter ly, style, axis ratio, rotation, fact
[
  ['Sagittarius Dwarf',70000,5.6,-14.2,10000,'ell',0.5,0.3],
  ['Large Magellanic Cloud',163000,280.5,-32.9,32000,'irr',0.8,0.6,'The largest satellite galaxy of the Milky Way.'],
  ['Small Magellanic Cloud',200000,302.8,-44.3,18900,'irr',0.6,1.0],
  ['Andromeda (M31)',2537000,121.2,-21.6,152000,'spiral',0.32,0.65,'The nearest large galaxy. It will merge with the Milky Way in roughly 4.5 billion years.'],
  ['M32',2490000,121.15,-22.0,6500,'ell',0.8,0],
  ['M110',2690000,120.7,-21.1,17000,'ell',0.5,0.4],
  ['Triangulum (M33)',2730000,133.6,-31.3,61000,'spiral',0.6,1.2,'Third-largest member of the Local Group.'],
  ['M81',11700000,142.1,40.9,90000,'spiral',0.5,0.2],
  ['Centaurus A',12000000,309.5,19.4,60000,'ell',0.75,0.5,'A giant elliptical with a jet-launching black hole.'],
  ['Whirlpool (M51)',23000000,104.9,68.6,76000,'spiral',0.9,0.8],
  ['Sombrero (M104)',29000000,298.5,51.1,50000,'spiral',0.2,0.1],
  ['Virgo Cluster',53500000,283.8,74.5,15000000,'cluster',1,0,'About 1,300 galaxies. Its core holds the giant elliptical M87.'],
].forEach(([name, d, l, b, size, style, ratio, rot, fact]) => addObj({kind:'galaxy', name, d, l, b, size:size * LY, style, ratio, rot, fact}));
[
  ['Great Attractor',250e6,307,9,'The gravitational centre of the Laniakea supercluster, pulling our galaxy at about 600 km/s.'],
  ['Perseus–Pisces Supercluster',250e6,150,-13],
  ['Coma Cluster',321e6,58,88],
  ['Shapley Supercluster',650e6,312,31,'The most massive concentration of galaxies in the nearby universe.'],
  ['Sloan Great Wall',1.37e9,200,70,'A wall of galaxies about 1.4 billion light-years long.'],
].forEach(([name, d, l, b, fact]) => addObj({kind:'super', name, d, l, b, fact}));
const GC = gal(26670, 0, 0);           // galactic centre
const GA = COSMOS.find(o => o.name === 'Great Attractor');
const ANDRO = COSMOS.find(o => o.name.startsWith('Andromeda'));
const MW_R = 52850 * LY, LANI_R = 260e6 * LY, UNI_R = 46.5e9 * LY;
const SITES = [ // Voyager positions are approximate for 2026, projected onto the ecliptic
  {kind:'probe', name:'Voyager 1', x:137 * AU * Math.cos(-255.5 * deg), y:137 * AU * Math.sin(-255.5 * deg), dist:167 * AU, fact:'Launched 1977. The most distant human-made object, about 167 AU out (approx.).'},
  {kind:'probe', name:'Voyager 2', x:116 * AU * Math.cos(-289 * deg), y:116 * AU * Math.sin(-289 * deg), dist:140 * AU, fact:'The only spacecraft to visit Uranus and Neptune (approx. position).'},
];

/* scale stops for the map's level column */
const LEVELS = [
  {id:'orbit',  name:'Orbit'},
  {id:'inner',  name:'Inner planets', c:[0,0], ext:1.9 * AU},
  {id:'solar',  name:'Solar System', c:[0,0], ext:33 * AU},
  {id:'helio',  name:'Heliosphere', c:[0,0], ext:180 * AU},
  {id:'oort',   name:'Oort cloud', c:[0,0], ext:1.15e5 * AU},
  {id:'stars',  name:'Nearest stars', c:[0,0], ext:14 * LY},
  {id:'arm',    name:'Orion Arm', c:[0,0], ext:3200 * LY},
  {id:'galaxy', name:'Milky Way', c:[GC[0] * 0.55, 0], ext:62000 * LY},
  {id:'local',  name:'Local Group', c:[ANDRO.x * 0.45, ANDRO.y * 0.45], ext:2.0e6 * LY},
  {id:'lani',   name:'Laniakea', c:[GA.x, GA.y], ext:330e6 * LY},
  {id:'cosmos', name:'Observable universe', c:[0,0], ext:50e9 * LY},
];
function scaleName(ext){
  if (ext < 0.02 * AU) return 'Planetary';
  if (ext < 6 * AU) return 'Inner Solar System';
  if (ext < 70 * AU) return 'Solar System';
  if (ext < 2000 * AU) return 'Heliosphere';
  if (ext < 1.5 * LY) return 'Oort cloud';
  if (ext < 300 * LY) return 'Stellar neighbourhood';
  if (ext < 15000 * LY) return 'Orion Arm';
  if (ext < 4e5 * LY) return 'Milky Way';
  if (ext < 3e7 * LY) return 'Local Group';
  if (ext < 2e9 * LY) return 'Laniakea supercluster';
  return 'Observable universe';
}

/* ===== particles & starfields ===== */
const STARS = (() => { const r = rng(7), out = []; for (let i = 0; i < 900; i++){ const t = r(); out.push({x:r() - .5, y:r() - .5, s:r() * 1.25 + .35, a:Math.pow(r(), 2.2) * .85 + .15, c:t < .12 ? '#ffd2a8' : t < .3 ? '#cfe0ff' : '#ffffff'}); } return out; })();
function belt(n, a0, a1, seed, logr){
  const r = rng(seed), a = new Float64Array(n), th = new Float64Array(n);
  for (let i = 0; i < n; i++){ a[i] = logr ? a0 * Math.pow(a1 / a0, r()) : a0 + (a1 - a0) * Math.pow(r(), 0.8); th[i] = r() * TAU; }
  return {a, th, n};
}
const ASTEROIDS = belt(1800, 2.1 * AU, 3.3 * AU, 11);
const KUIPER = belt(1800, 30 * AU, 50 * AU, 12);
const OORT = belt(2600, 2000 * AU, 100000 * AU, 13, true);

/* ===== procedural images (lazy) ===== */
const IMG = {};
function mkCanvas(s){ const c = document.createElement('canvas'); c.width = c.height = s; return [c, c.getContext('2d')]; }
function gauss(r){ return (r() + r() + r() - 1.5) / 1.5; }
function milkyWay(){
  if (IMG.mw) return IMG.mw;
  const S = 1024, [c, x] = mkCanvas(S), k = (S / 2) / 55000, cx = S / 2, r = rng(42);
  let g = x.createRadialGradient(cx, cx, 0, cx, cx, 9000 * k);
  g.addColorStop(0, 'rgba(255,236,196,.95)'); g.addColorStop(.35, 'rgba(255,214,160,.45)'); g.addColorStop(1, 'rgba(255,200,150,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  g = x.createRadialGradient(cx, cx, 0, cx, cx, 50000 * k);
  g.addColorStop(0, 'rgba(160,170,210,.18)'); g.addColorStop(1, 'rgba(120,130,190,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.globalCompositeOperation = 'lighter';
  const pitch = Math.tan(12.5 * deg), arms = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  for (let i = 0; i < 52000; i++){
    let rad = 3000 + -Math.log(1 - r() * 0.995) * 11000; if (rad > 53000) continue;
    let th;
    if (r() < 0.7){ th = arms[(r() * 4) | 0] + Math.log(rad / 3500) / pitch + gauss(r) * (0.22 + 1600 / rad); }
    else th = r() * TAU;
    const px = cx + Math.cos(th) * rad * k, py = cx + Math.sin(th) * rad * k;
    const hii = r() < 0.025 && rad > 7000;
    const warm = rad < 7000 || r() < 0.25;
    x.fillStyle = hii ? 'rgba(255,120,170,.75)' : warm ? `rgba(255,222,178,${.25 + r() * .35})` : `rgba(180,205,255,${.22 + r() * .38})`;
    const s = hii ? 1.8 : r() < 0.05 ? 1.6 : 1;
    x.fillRect(px, py, s, s);
  }
  const ba = 27 * deg;
  for (let i = 0; i < 9000; i++){
    const u = gauss(r) * 13500, v = gauss(r) * 3200;
    x.fillStyle = `rgba(255,214,160,${.18 + r() * .3})`;
    x.fillRect(cx + (u * Math.cos(ba) - v * Math.sin(ba)) * k, cx + (u * Math.sin(ba) + v * Math.cos(ba)) * k, 1.2, 1.2);
  }
  x.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 9000; i++){
    const rad = 4500 + r() * 38000, th = arms[(r() * 4) | 0] + Math.log(rad / 3500) / pitch - 0.12 + gauss(r) * 0.05;
    x.fillStyle = 'rgba(25,12,8,.10)';
    x.beginPath(); x.arc(cx + Math.cos(th) * rad * k, cx + Math.sin(th) * rad * k, 1.5 + r() * 2.5, 0, TAU); x.fill();
  }
  return IMG.mw = c;
}
function galaxySprite(style, seed){
  const key = style + seed; if (IMG[key]) return IMG[key];
  const S = 256, [c, x] = mkCanvas(S), cx = S / 2, r = rng(seed * 31 + 5);
  if (style === 'ell' || style === 'cluster'){
    const g = x.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0, 'rgba(255,236,206,1)'); g.addColorStop(.25, 'rgba(255,214,170,.55)'); g.addColorStop(1, 'rgba(255,200,160,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    if (style === 'cluster'){ x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 260; i++){ const a = r() * TAU, d = Math.pow(r(), .6) * cx * .95; x.fillStyle = `rgba(255,230,200,${.3 + r() * .5})`; x.beginPath(); x.ellipse(cx + Math.cos(a) * d, cx + Math.sin(a) * d, 1 + r() * 2.5, 1 + r() * 1.5, r() * 3, 0, TAU); x.fill(); } }
  } else {
    const g = x.createRadialGradient(cx, cx, 0, cx, cx, cx * .35);
    g.addColorStop(0, 'rgba(255,238,205,1)'); g.addColorStop(1, 'rgba(255,220,180,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'lighter';
    const irr = style === 'irr';
    for (let i = 0; i < 5000; i++){
      const rad = Math.pow(r(), .7) * cx * .95;
      let th = irr ? r() * TAU : (r() < .5 ? 0 : Math.PI) + Math.log(rad / 6 + 1) * 2.1 + gauss(r) * .35;
      const px = cx + Math.cos(th) * rad + (irr ? gauss(r) * 18 : 0), py = cx + Math.sin(th) * rad + (irr ? gauss(r) * 12 : 0);
      x.fillStyle = r() < .04 ? 'rgba(255,140,180,.7)' : `rgba(${rad < 30 ? '255,225,190' : '185,208,255'},${.25 + r() * .35})`;
      x.fillRect(px, py, 1.4, 1.4);
    }
  }
  return IMG[key] = c;
}
function laniakea(){
  if (IMG.lani) return IMG.lani;
  const S = 768, [c, x] = mkCanvas(S), cx = S / 2, r = rng(77);
  x.globalCompositeOperation = 'lighter'; x.lineWidth = 1;
  for (let i = 0; i < 700; i++){
    let a = r() * TAU, d = (0.35 + 0.65 * Math.sqrt(r())) * cx * 0.96;
    let px = cx + Math.cos(a) * d, py = cx + Math.sin(a) * d;
    x.strokeStyle = `rgba(150,180,255,${.05 + r() * .07})`; x.beginPath(); x.moveTo(px, py);
    for (let s = 0; s < 60; s++){
      const dx = cx - px, dy = cy0() - py, dd = Math.hypot(dx, dy) || 1;
      const sw = Math.sin(px * 0.02 + py * 0.013) * 0.9;
      px += (dx / dd + sw * -dy / dd * 0.6) * 5; py += (dy / dd + sw * dx / dd * 0.6) * 5;
      x.lineTo(px, py); if (dd < 8) break;
    }
    x.stroke();
  }
  function cy0(){ return cx; }
  for (let i = 0; i < 2600; i++){ const a = r() * TAU, d = Math.pow(r(), .55) * cx * .97; x.fillStyle = `rgba(230,236,255,${.2 + r() * .5})`; x.fillRect(cx + Math.cos(a) * d, cx + Math.sin(a) * d, 1.2, 1.2); }
  const g = x.createRadialGradient(cx, cx, 0, cx, cx, 40); g.addColorStop(0, 'rgba(255,220,170,.8)'); g.addColorStop(1, 'rgba(255,200,150,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return IMG.lani = c;
}
function universe(){
  if (IMG.uni) return IMG.uni;
  const S = 1024, [c, x] = mkCanvas(S), cx = S / 2, R = 470, r = rng(99);
  const g0 = x.createRadialGradient(cx, cx, 0, cx, cx, R); g0.addColorStop(0, 'rgba(20,24,48,.9)'); g0.addColorStop(1, 'rgba(10,10,26,.9)');
  x.fillStyle = g0; x.beginPath(); x.arc(cx, cx, R, 0, TAU); x.fill();
  const N = 1300, px = new Float32Array(N), py = new Float32Array(N);
  for (let i = 0; i < N; i++){ let a, d; do { a = r() * TAU; d = Math.sqrt(r()) * R * .98; } while (false); px[i] = cx + Math.cos(a) * d; py[i] = cx + Math.sin(a) * d; }
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < N; i++){
    const near = [];
    for (let j = 0; j < N; j++) if (j !== i){ const d = (px[i] - px[j]) ** 2 + (py[i] - py[j]) ** 2; if (near.length < 3 || d < near[2][0]){ near.push([d, j]); near.sort((a, b) => a[0] - b[0]); if (near.length > 3) near.pop(); } }
    for (const [d, j] of near){ if (d > 2600) continue; x.strokeStyle = 'rgba(140,165,255,.16)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(px[i], py[i]); x.lineTo(px[j], py[j]); x.stroke(); }
    x.fillStyle = `rgba(220,228,255,${.25 + r() * .45})`; x.beginPath(); x.arc(px[i], py[i], .8 + r() * 1.6, 0, TAU); x.fill();
  }
  for (let i = 0; i < 4200; i++){ const a = r() * TAU, d = R + 2 + r() * 26, t = r();
    x.fillStyle = t < .45 ? `rgba(255,120,70,${.25 + r() * .35})` : t < .8 ? `rgba(255,190,110,${.2 + r() * .3})` : `rgba(100,150,255,${.25 + r() * .35})`;
    x.beginPath(); x.arc(cx + Math.cos(a) * d, cx + Math.sin(a) * d, 1.5 + r() * 3, 0, TAU); x.fill(); }
  return IMG.uni = c;
}
function softSprite(key, inner, outer){
  if (IMG[key]) return IMG[key];
  const [c, x] = mkCanvas(64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, inner); g.addColorStop(.45, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return IMG[key] = c;
}
