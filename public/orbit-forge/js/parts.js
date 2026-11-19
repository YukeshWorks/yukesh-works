'use strict';
/* ===== parts: real-scale components. mass & fuel in tonnes, thrust in kN (vacuum), isp in s, sizes in m ===== */
const PARTS = {
  capsule:{name:'Halcyon Capsule', kind:'capsule', w:4, h:3.6, mass:6.0, torque:300, info:'Three-seat crew capsule with reaction wheels'},
  probe:  {name:'Wisp Probe', kind:'probe', w:1.6, h:1.0, mass:0.4, torque:40, info:'Light uncrewed core with solar panels'},
  nose:   {name:'Ogive Fairing', kind:'nose', w:5, h:7, mass:2.5, info:'Streamlines the top of a 5 m stack'},
  chute:  {name:'Canopy Pack', kind:'chute', w:2, h:0.8, mass:0.25, info:'Main parachute. Open in air below 250 m/s'},
  shield: {name:'Ablative Shield', kind:'shield', w:4, h:0.6, mass:1.2, info:'Survives re-entry heating up to ~8 MW/m²'},
  dec:    {name:'Stage Ring', kind:'dec', w:5, h:0.8, mass:0.5, info:'Separates stages. Rotate it to mount side boosters'},
  adapter:{name:'Adapter 5→2.5', kind:'adapter', w:5, h:2, mass:0.6, info:'Joins a 2.5 m stack onto 5 m'},
  truss:  {name:'Truss', kind:'truss', w:5, h:1, mass:0.4, info:'Structural beam'},
  trussT: {name:'Truss Tall', kind:'truss', w:1, h:5, mass:0.4, info:'Vertical structural beam'},
  leg:    {name:'Landing Leg', kind:'leg', w:1.2, h:3.2, mass:0.3, info:'Lets you land at up to 15 m/s and 45° tilt'},
  nose25: {name:'Nose 2.5', kind:'nose', w:2.5, h:3.5, mass:0.4, info:'Streamlines a 2.5 m stack'},
  fin:    {name:'Fin', kind:'fin', w:1.2, h:2.6, mass:0.15, info:'Aerodynamic fin'},
  t8:     {name:'Tank 8', kind:'tank', w:2.5, h:2.5, mass:0.5, fuel:8},
  t30:    {name:'Tank 30', kind:'tank', w:2.5, h:6, mass:1.6, fuel:30},
  t80:    {name:'Tank 80', kind:'tank', w:5, h:5, mass:4, fuel:80},
  t200:   {name:'Tank 200', kind:'tank', w:5, h:12, mass:9, fuel:200},
  t400:   {name:'Tank 400', kind:'tank', w:5, h:24, mass:17, fuel:400},
  kite:   {name:'Kite', kind:'engine', w:2.2, h:2.6, mass:0.6, thrust:110, isp:345, ispSL:210, bells:[[0, 1.9, 1]]},
  vela:   {name:'Vela', kind:'engine', w:3.6, h:4.6, mass:2.6, thrust:1100, isp:348, ispSL:250, bells:[[0, 3.3, 1]]},
  nonet:  {name:'Nonet Cluster', kind:'engine', w:5, h:3.6, mass:9.5, thrust:8000, isp:311, ispSL:282,
           bells:[[-1.7,1.05,0],[0,1.05,0],[1.7,1.05,0],[-0.85,1.15,1],[0.85,1.15,1]]},
  colossus:{name:'Colossus Cluster', kind:'engine', w:5.6, h:5.4, mass:30, thrust:20000, isp:300, ispSL:268,
           bells:[[-2.2,1.3,1],[-1.1,1.3,0],[0,1.35,1],[1.1,1.3,0],[2.2,1.3,1]]},
};
const CATS = [
  ['Command', ['capsule','probe','chute','shield']],
  ['Fuel', ['t8','t30','t80','t200','t400']],
  ['Engines', ['kite','vela','nonet','colossus']],
  ['Staging', ['dec','adapter','truss','trussT','leg']],
  ['Aero', ['nose','nose25','fin']],
];
const ORDER = CATS.flatMap(c => c[1]);
const DESTS = [['Low Earth orbit',9400],['Moon flyby',12600],['Mars transfer',13000],['Lunar orbit',13400],['Lunar landing',15100],['Jupiter transfer',15700],['Solar escape',18200]];
const idOf = p => typeof p === 'string' ? p : p.id;
const defOf = p => PARTS[idOf(p)];
const fuelOf = p => typeof p === 'string' ? (PARTS[p].fuel || 0) : (p.fuel == null ? (PARTS[p.id].fuel || 0) : p.fuel);
const massOf = p => defOf(p).mass + fuelOf(p);
const totalMass = parts => parts.reduce((m, p) => m + massOf(p), 0);
const countKind = (parts, k) => parts.reduce((n, p) => n + (defOf(p).kind === k ? 1 : 0), 0);
/* example blueprints: stacks are listed top to bottom and stood on y = 0 */
function stackBP(ids, x, y0, out){
  let y = y0 || 0;
  for (let i = ids.length - 1; i >= 0; i--){ const d = PARTS[ids[i]]; out.push({id:ids[i], x:x || 0, y:y + d.h / 2, r:0, f:false}); y += d.h; }
  return y;
}
function boosterPair(out, coreW, ids, attachY){
  const dec = PARTS.dec, bw = Math.max(...ids.map(i => PARTS[i].w)), off = coreW / 2 + dec.h + bw / 2;
  for (const s of [-1, 1]){ stackBP(ids, s * off, 0, out); out.push({id:'dec', x:s * (coreW / 2 + dec.h / 2), y:attachY, r:1, f:false}); }
}
const EXAMPLES = (() => {
  const halcyon = []; stackBP(['chute','capsule','shield','dec','t80','vela','dec','t400','nonet','dec','t400','t400','colossus'], 0, 0, halcyon);
  const lander = []; const top = stackBP(['probe','t80','vela','dec','t400','nonet','dec','t400','t400','t400','colossus'], 0, 0, lander);
  const vY = lander.find(p => p.id === 'vela').y;
  lander.push({id:'leg', x:-(PARTS.vela.w / 2 + PARTS.leg.w / 2), y:vY - 0.2, r:0, f:true}, {id:'leg', x:PARTS.vela.w / 2 + PARTS.leg.w / 2, y:vY - 0.2, r:0, f:false});
  boosterPair(lander, 5, ['t400','nonet'], 18);
  const probe = []; stackBP(['probe','t30','kite','dec','t80','vela','dec','t400','nonet','dec','t400','t400','colossus'], 0, 0, probe);
  boosterPair(probe, 5, ['t400','nonet'], 18);
  const hop = []; stackBP(['chute','capsule','shield','dec','t200','nonet'], 0, 0, hop);
  return [
    {name:'Halcyon Heavy', note:'Crewed, 3 stages. Earth orbit and a Moon flyby.', parts:halcyon},
    {name:'Selene Lander', note:'Uncrewed Moon lander with legs and 2 side boosters.', parts:lander},
    {name:'Wanderer Probe', note:'Light probe with boosters for Mars, Venus and Jupiter.', parts:probe},
    {name:'Hopper', note:'Small suborbital capsule. Good for practising splashdowns.', parts:hop},
  ];
})();
/* ===== part drawing: metres, y up, part bottom at yb ===== */
function gradX(c, w, stops){ const g = c.createLinearGradient(-w / 2, 0, w / 2, 0); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; }
const HULL = ['#6f7789','#eef1f6','#f7f9fc','#dde2ea','#5b6374'];
const DARK = ['#151922','#3c4352','#59606f','#2a2f3b','#10131a'];
const BELL = ['#1c140f','#6e4a33','#c78a57','#5e3e2a','#140e0a'];
const FOIL = ['#5a400d','#d8b24e','#f6dc85','#b18a2c','#3e2c07'];
function drawBell(c, x, yb, ew, bh, back){
  const tw = ew * 0.32, yt = yb + bh;
  c.save(); c.translate(x, 0);
  c.fillStyle = gradX(c, ew, back ? ['#0f0b08','#3d2a1e','#6b4a33','#2e2016','#0b0806'] : BELL);
  c.beginPath(); c.moveTo(-tw / 2, yt);
  c.bezierCurveTo(-tw / 2, yt - bh * 0.45, -ew * 0.44, yb + bh * 0.28, -ew / 2, yb);
  c.lineTo(ew / 2, yb);
  c.bezierCurveTo(ew * 0.44, yb + bh * 0.28, tw / 2, yt - bh * 0.45, tw / 2, yt);
  c.closePath(); c.fill();
  c.fillStyle = back ? '#3a3f4a' : '#9aa1ad'; c.fillRect(-ew / 2, yb, ew, Math.max(0.05, ew * 0.035));
  c.fillStyle = '#2a2f3b'; c.fillRect(-tw * 0.7, yt - 0.06, tw * 1.4, 0.12);
  c.restore();
}
function drawPart(c, d, yb){
  const w = d.w, h = d.h, hw = w / 2;
  switch (d.kind){
    case 'tank': {
      c.fillStyle = gradX(c, w, HULL); c.fillRect(-hw, yb, w, h);
      c.fillStyle = 'rgba(40,50,70,.10)';
      for (let k = -2; k <= 2; k++) c.fillRect(k * w / 5 - 0.02, yb, 0.04, h);
      c.fillStyle = gradX(c, w, DARK); c.fillRect(-hw, yb + h - Math.min(0.6, h * 0.12), w, Math.min(0.6, h * 0.12));
      c.fillStyle = 'rgba(30,36,50,.45)'; c.fillRect(-hw, yb, w, 0.06);
      if (h >= 10){ c.fillStyle = '#ffb454'; c.fillRect(-hw, yb + h * 0.62, w, 0.35); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(-hw, yb + h * 0.62, w, 0.05); }
      break;
    }
    case 'capsule': {
      const tw = 1.2, xAt = y => hw - (hw - tw / 2) * (y - yb) / h;
      c.fillStyle = gradX(c, w, HULL);
      c.beginPath(); c.moveTo(-hw, yb); c.lineTo(hw, yb); c.lineTo(tw / 2, yb + h); c.lineTo(-tw / 2, yb + h); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(40,50,70,.18)'; c.lineWidth = 0.03;
      for (let k = 1; k < 5; k++){ const y = yb + h * k / 5; c.beginPath(); c.moveTo(-xAt(y), y); c.lineTo(xAt(y), y); c.stroke(); }
      c.fillStyle = '#0d1626';
      for (const s of [-1, 1]){ c.beginPath(); c.moveTo(s * 0.25, yb + 1.55); c.lineTo(s * 0.95, yb + 1.55); c.lineTo(s * 0.78, yb + 2.15); c.lineTo(s * 0.3, yb + 2.15); c.closePath(); c.fill(); }
      c.fillStyle = 'rgba(124,199,255,.45)'; c.fillRect(-0.85, yb + 1.95, 0.22, 0.12);
      c.fillStyle = '#ffb454'; c.fillRect(-xAt(yb + 0.55), yb + 0.42, xAt(yb + 0.55) * 2, 0.16);
      c.fillStyle = gradX(c, tw, DARK); c.fillRect(-tw / 2, yb + h - 0.22, tw, 0.22);
      c.fillStyle = '#2a2f3b'; c.fillRect(-xAt(yb + 2.7) - 0.08, yb + 2.6, 0.12, 0.22); c.fillRect(xAt(yb + 2.7) - 0.04, yb + 2.6, 0.12, 0.22);
      break;
    }
    case 'probe': {
      c.fillStyle = '#1b2a55';
      for (const s of [-1, 1]){ c.fillRect(s > 0 ? hw : -hw - 2.4, yb + 0.38, 2.4, 0.18); }
      c.fillStyle = 'rgba(124,199,255,.35)';
      for (const s of [-1, 1]) for (let k = 1; k < 4; k++) c.fillRect((s > 0 ? hw : -hw - 2.4) + k * 0.6, yb + 0.38, 0.03, 0.18);
      c.fillStyle = gradX(c, w, FOIL); c.fillRect(-hw, yb, w, h);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-hw, yb + 0.48, w, 0.04);
      c.fillStyle = '#e9eef7'; c.beginPath(); c.ellipse(0, yb + h + 0.12, 0.55, 0.14, 0, 0, TAU); c.fill();
      c.fillStyle = '#8f9bb4'; c.fillRect(-0.03, yb + h, 0.06, 0.12);
      break;
    }
    case 'nose': {
      c.fillStyle = gradX(c, w, HULL);
      c.beginPath(); c.moveTo(-hw, yb); c.bezierCurveTo(-hw, yb + h * 0.55, -hw * 0.45, yb + h * 0.95, 0, yb + h);
      c.bezierCurveTo(hw * 0.45, yb + h * 0.95, hw, yb + h * 0.55, hw, yb); c.closePath(); c.fill();
      c.fillStyle = 'rgba(40,50,70,.25)'; c.fillRect(-0.02, yb, 0.04, h * 0.97);
      c.fillStyle = gradX(c, w, DARK); c.fillRect(-hw, yb, w, 0.35);
      break;
    }
    case 'chute': {
      c.fillStyle = gradX(c, w, HULL); c.fillRect(-hw, yb, w, h * 0.55);
      c.fillStyle = '#e8603e';
      c.beginPath(); c.moveTo(-hw, yb + h * 0.55); c.quadraticCurveTo(-hw, yb + h, 0, yb + h); c.quadraticCurveTo(hw, yb + h, hw, yb + h * 0.55); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-hw * 0.5, yb + h * 0.75, hw * 0.35, 0.06);
      break;
    }
    case 'shield': {
      c.fillStyle = gradX(c, w, ['#1d140e','#4e3626','#6e4d36','#3e2b1e','#160f0a']);
      c.beginPath(); c.moveTo(-hw, yb + h); c.lineTo(hw, yb + h); c.lineTo(hw, yb + h * 0.55); c.quadraticCurveTo(0, yb - h * 0.25, -hw, yb + h * 0.55); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,180,84,.25)'; c.fillRect(-hw, yb + h - 0.08, w, 0.08);
      break;
    }
    case 'dec': {
      c.fillStyle = gradX(c, w, DARK); c.fillRect(-hw, yb, w, h);
      c.fillStyle = '#ffb454'; c.fillRect(-hw, yb + h / 2 - 0.05, w, 0.1);
      c.fillStyle = '#8f9bb4';
      for (let k = -2; k <= 2; k++){ c.fillRect(k * w / 5.4 - 0.06, yb + 0.12, 0.12, 0.12); c.fillRect(k * w / 5.4 - 0.06, yb + h - 0.24, 0.12, 0.12); }
      break;
    }
    case 'adapter': {
      c.fillStyle = gradX(c, w, HULL);
      c.beginPath(); c.moveTo(-hw, yb); c.lineTo(hw, yb); c.lineTo(hw * 0.5, yb + h); c.lineTo(-hw * 0.5, yb + h); c.closePath(); c.fill();
      c.fillStyle = gradX(c, w, DARK); c.fillRect(-hw, yb, w, 0.18); c.fillRect(-hw * 0.5, yb + h - 0.14, w * 0.5, 0.14);
      break;
    }
    case 'truss': {
      c.strokeStyle = '#8f9bb4'; c.lineWidth = Math.min(w, h) * 0.12;
      c.strokeRect(-hw + c.lineWidth / 2, yb + c.lineWidth / 2, w - c.lineWidth, h - c.lineWidth);
      c.lineWidth *= 0.7; c.beginPath();
      const long = w > h, n = Math.max(1, Math.round((long ? w : h) / Math.min(w, h)));
      for (let k = 0; k < n; k++){
        if (long){ const x0 = -hw + k * w / n, x1 = x0 + w / n; c.moveTo(x0, yb + (k % 2 ? h : 0)); c.lineTo(x1, yb + (k % 2 ? 0 : h)); }
        else { const y0 = yb + k * h / n, y1 = y0 + h / n; c.moveTo(k % 2 ? hw : -hw, y0); c.lineTo(k % 2 ? -hw : hw, y1); }
      }
      c.stroke(); break;
    }
    case 'leg': {
      c.strokeStyle = '#c9cfdb'; c.lineWidth = 0.18; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-hw * 0.6, yb + h); c.lineTo(hw * 0.5, yb + 0.25); c.stroke();
      c.strokeStyle = '#8f9bb4'; c.lineWidth = 0.1; c.beginPath(); c.moveTo(-hw * 0.6, yb + h * 0.55); c.lineTo(hw * 0.35, yb + 0.6); c.stroke();
      c.fillStyle = '#ffb454'; c.fillRect(-hw * 0.8, yb + h - 0.4, 0.35, 0.4);
      c.fillStyle = '#5b6374'; c.beginPath(); c.ellipse(hw * 0.5, yb + 0.12, 0.42, 0.12, 0, 0, TAU); c.fill();
      break;
    }
    case 'fin': {
      c.fillStyle = gradX(c, w, DARK);
      c.beginPath(); c.moveTo(-hw, yb); c.lineTo(hw, yb); c.lineTo(-hw, yb + h); c.closePath(); c.fill();
      c.fillStyle = '#ffb454'; c.beginPath(); c.moveTo(-hw, yb); c.lineTo(-hw + w * 0.35, yb); c.lineTo(-hw, yb + h * 0.35); c.closePath(); c.fill();
      break;
    }
    case 'engine': {
      const mh = Math.min(1.3, h * 0.26), bh = h - mh;
      c.fillStyle = gradX(c, w, DARK);
      c.beginPath(); c.moveTo(-hw * 0.98, yb + h); c.lineTo(hw * 0.98, yb + h); c.lineTo(hw * 0.7, yb + bh); c.lineTo(-hw * 0.7, yb + bh); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(160,170,190,.25)'; c.lineWidth = 0.05;
      c.beginPath(); for (let k = -3; k <= 3; k++){ c.moveTo(k * hw / 4, yb + h); c.lineTo(k * hw / 5.6, yb + bh); } c.stroke();
      for (const z of [0, 1]) for (const [x, ew, bz] of d.bells) if (bz === z) drawBell(c, x, yb, ew, bh, z === 0);
      break;
    }
  }
}
/* exhaust plume: dense = air pressure fraction (0 vacuum .. 1 sea level) */
function drawFlames(c, exits, thr, dense){
  if (thr <= 0 || !exits.length) return;
  const vac = 1 - dense;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const e of exits){
    const L = e.ew * (2.4 + 5.2 * thr) * (1 + 1.8 * vac) * (0.93 + Math.random() * 0.14);
    const sp = e.ew * (0.95 + 2.6 * vac);
    let g = c.createRadialGradient(e.x, e.y - L * 0.2, 0, e.x, e.y - L * 0.2, L * 0.75);
    g.addColorStop(0, `rgba(255,170,80,${0.32 * thr})`); g.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y - L * 0.2, L * 0.75, 0, TAU); c.fill();
    g = c.createLinearGradient(0, e.y, 0, e.y - L);
    if (dense > 0.15){ g.addColorStop(0, 'rgba(255,246,214,.95)'); g.addColorStop(.3, 'rgba(255,176,82,.85)'); g.addColorStop(1, 'rgba(255,86,30,0)'); }
    else { g.addColorStop(0, 'rgba(235,240,255,.75)'); g.addColorStop(.25, 'rgba(170,190,255,.32)'); g.addColorStop(1, 'rgba(120,140,255,0)'); }
    c.fillStyle = g;
    c.beginPath(); c.moveTo(e.x - e.ew * 0.46, e.y);
    c.quadraticCurveTo(e.x - sp * 0.62, e.y - L * 0.42, e.x, e.y - L);
    c.quadraticCurveTo(e.x + sp * 0.62, e.y - L * 0.42, e.x + e.ew * 0.46, e.y); c.closePath(); c.fill();
    g = c.createLinearGradient(0, e.y, 0, e.y - L * 0.45);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(200,225,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(e.x - e.ew * 0.24, e.y); c.quadraticCurveTo(e.x - e.ew * 0.1, e.y - L * 0.25, e.x, e.y - L * 0.45);
    c.quadraticCurveTo(e.x + e.ew * 0.1, e.y - L * 0.25, e.x + e.ew * 0.24, e.y); c.closePath(); c.fill();
    if (dense > 0.2){
      for (let k = 1; k <= 5; k++){
        const y = e.y - e.ew * 0.95 * k, r = e.ew * 0.2 * (1 - k * 0.13);
        c.fillStyle = `rgba(255,250,230,${0.45 * dense * thr * (1 - k * 0.15)})`;
        c.beginPath(); c.ellipse(e.x, y, r, r * 0.6, 0, 0, TAU); c.fill();
      }
    }
  }
  c.restore();
}
function drawCanopy(c, topY, open, n){
  const cw = 1.5 + 20 * open, ch = 1 + 7 * open, cy = topY + 2 + 16 * open;
  c.strokeStyle = 'rgba(233,238,247,.55)'; c.lineWidth = 0.08;
  c.beginPath(); for (const f of [-1, -.5, 0, .5, 1]){ c.moveTo(0, topY); c.lineTo(f * cw / 2, cy); } c.stroke();
  for (let k = 0; k < Math.max(1, n); k++){
    const ox = (k - (n - 1) / 2) * cw * 0.7;
    c.fillStyle = '#e8603e';
    c.beginPath(); c.moveTo(ox - cw / 2, cy); c.quadraticCurveTo(ox - cw / 2, cy + ch * 1.3, ox, cy + ch * 1.3);
    c.quadraticCurveTo(ox + cw / 2, cy + ch * 1.3, ox + cw / 2, cy); c.quadraticCurveTo(ox, cy + ch * 0.35, ox - cw / 2, cy); c.fill();
    c.fillStyle = '#f4eee6';
    for (const f of [-0.28, 0.28]){ c.beginPath(); c.moveTo(ox + f * cw - cw * 0.06, cy + ch * 0.2); c.lineTo(ox + f * cw + cw * 0.06, cy + ch * 0.2); c.lineTo(ox + f * cw * 0.8 + cw * 0.04, cy + ch * 1.22); c.lineTo(ox + f * cw * 0.8 - cw * 0.04, cy + ch * 1.22); c.closePath(); c.fill(); }
  }
}
