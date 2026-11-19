'use strict';
/* ===== vessel graph: free-form layouts on a 0.5 m grid =====
   A part is {id, x, y, r, f, uid[, fuel]}: centre in metres, r = clockwise quarter turns, f = mirrored.
   Parts connect when their edges touch. Fuel flows through everything except stage rings.
   An engine fires only when nothing is attached in front of its nozzle, so upper stages wait their turn. */
const GRID = 0.5;
let UID = 1;
function dims(p){ const d = defOf(p); return (p.r & 1) ? [d.h, d.w] : [d.w, d.h]; }
function rectOf(p){ const [w, h] = dims(p); return [p.x - w / 2, p.y - h / 2, p.x + w / 2, p.y + h / 2]; }
function overlapR(A, B, m){ m = m || 0.02; return Math.min(A[2], B[2]) - Math.max(A[0], B[0]) > m && Math.min(A[3], B[3]) - Math.max(A[1], B[1]) > m; }
function touching(a, b){
  const A = rectOf(a), B = rectOf(b);
  const ix = Math.min(A[2], B[2]) - Math.max(A[0], B[0]), iy = Math.min(A[3], B[3]) - Math.max(A[1], B[1]);
  return (ix > 0.2 && iy > -0.06) || (iy > 0.2 && ix > -0.06);
}
function adjacency(parts){
  const n = parts.length, adj = Array.from({length:n}, () => []);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (touching(parts[i], parts[j])){ adj[i].push(j); adj[j].push(i); }
  return adj;
}
function components(parts, adj, skip){
  const lab = new Array(parts.length).fill(-1); let c = 0;
  for (let i = 0; i < parts.length; i++){
    if (lab[i] >= 0 || (skip && skip.has(i))) continue;
    const st = [i]; lab[i] = c;
    while (st.length){ const k = st.pop(); for (const j of adj[k]) if (lab[j] < 0 && !(skip && skip.has(j))){ lab[j] = c; st.push(j); } }
    c++;
  }
  return lab;
}
function rootIndex(parts){ const i = parts.findIndex(p => { const k = defOf(p).kind; return k === 'capsule' || k === 'probe'; }); return i < 0 ? 0 : i; }
// part-local vector -> blueprint vector
function localDir(p, x, y){
  const fx = p.f ? -x : x, a = -p.r * Math.PI / 2, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a));
  return [fx * c - y * s, fx * s + y * c];
}
function activeEngines(parts){
  const out = [];
  parts.forEach((p, i) => {
    const d = defOf(p); if (d.kind !== 'engine') return;
    const [nx, ny] = localDir(p, 0, -1), side = Math.abs(nx) > 0.5;
    const cx = p.x + nx * (d.h / 2 + 0.3), cy = p.y + ny * (d.h / 2 + 0.3);
    const hw = side ? 0.28 : d.w * 0.32, hh = side ? d.w * 0.32 : 0.28;
    const R = [cx - hw, cy - hh, cx + hw, cy + hh];
    if (!parts.some((q, j) => j !== i && overlapR(rectOf(q), R))) out.push(i);
  });
  return out;
}
function structure(parts){
  const adj = adjacency(parts), skip = new Set();
  parts.forEach((p, i) => { if (defOf(p).kind === 'dec') skip.add(i); });
  const comp = components(parts, adj, skip), act = activeEngines(parts), tanks = {};
  parts.forEach((p, i) => { if (defOf(p).kind === 'tank') (tanks[comp[i]] = tanks[comp[i]] || []).push(i); });
  for (const k in tanks) tanks[k].sort((a, b) => parts[b].y - parts[a].y);
  return {adj, comp, act, tanks};
}
function groupFuel(parts, st, g){ let f = 0; for (const i of (st.tanks[g] || [])) f += parts[i].fuel; return f; }
function decQueue(parts){
  const decs = parts.filter(p => defOf(p).kind === 'dec').sort((a, b) => a.y - b.y), q = [];
  for (const d of decs){ const last = q[q.length - 1]; if (last && Math.abs(last.y - d.y) < 0.3) last.uids.push(d.uid); else q.push({y:d.y, uids:[d.uid]}); }
  return q.map(g => g.uids);
}
function comOf(parts){
  let m = 0, x = 0, y = 0;
  for (const p of parts){ const k = massOf(p); m += k; x += p.x * k; y += p.y * k; }
  return m > 0 ? {x:x / m, y:y / m, m} : {x:0, y:0, m:0};
}
function bboxOf(parts, com){
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of parts){ const r = rectOf(p); x0 = Math.min(x0, r[0]); y0 = Math.min(y0, r[1]); x1 = Math.max(x1, r[2]); y1 = Math.max(y1, r[3]); }
  if (!parts.length) return {x0:-1, y0:-1, x1:1, y1:1, w:2, h:2};
  const c = com || {x:0, y:0};
  return {x0:x0 - c.x, y0:y0 - c.y, x1:x1 - c.x, y1:y1 - c.y, w:x1 - x0, h:y1 - y0};
}
// parts connected to the root (the vessel that will actually fly)
function rootComponent(parts){
  if (!parts.length) return {keep:[], loose:[]};
  const adj = adjacency(parts), lab = components(parts, adj), r = lab[rootIndex(parts)];
  return {keep:parts.filter((p, i) => lab[i] === r), loose:parts.filter((p, i) => lab[i] !== r)};
}
// fire a group of stage rings: returns the part list that stays plus the pieces that fall away
function splitAt(parts, uids){
  const rm = new Set(uids), rest = parts.filter(p => !rm.has(p.uid));
  const decs = parts.filter(p => rm.has(p.uid));
  if (!rest.length) return {keep:[], drops:[decs]};
  const adj = adjacency(rest), lab = components(rest, adj), r = lab[rootIndex(rest)], groups = {};
  rest.forEach((p, i) => { if (lab[i] !== r) (groups[lab[i]] = groups[lab[i]] || []).push(p); });
  const drops = Object.values(groups);
  // each ring travels with the falling piece it touches
  for (const d of decs){ const g = drops.find(gr => gr.some(q => touching(q, d))); if (g) g.push(d); else drops.push([d]); }
  return {keep:rest.filter((p, i) => lab[i] === r), drops};
}
function cloneParts(parts, full){ return parts.map(p => ({id:p.id, x:p.x, y:p.y, r:p.r || 0, f:!!p.f, uid:p.uid || UID++, fuel:full || p.fuel == null ? (PARTS[p.id].fuel || 0) : p.fuel})); }

/* Δv plan: burn until a fuel group runs dry, drop the next rings once nothing on the far side can still fire */
function stagePlan(parts0, g){
  let parts = cloneParts(parts0, false);
  const q = decQueue(parts), out = [];
  for (let phase = 0; phase < 24 && parts.length; phase++){
    let m = totalMass(parts), dv = 0, burn = 0, twr = null, thr0 = 0;
    for (let sub = 0; sub < 12; sub++){
      const st = structure(parts), live = st.act.filter(i => groupFuel(parts, st, st.comp[i]) > 1e-6);
      if (!live.length) break;
      const gm = {}; let thr = 0, thrSL = 0, md = 0;
      for (const i of live){ const d = defOf(parts[i]), k = d.thrust / (d.isp * G0), gi = st.comp[i]; gm[gi] = (gm[gi] || 0) + k; md += k; thr += d.thrust; thrSL += d.thrust * d.ispSL / d.isp; }
      if (twr === null){ twr = thrSL / (m * g); thr0 = thr; }
      let t = Infinity; for (const gi in gm) t = Math.min(t, groupFuel(parts, st, +gi) / gm[gi]);
      const dm = md * t, isp = thr / (md * G0);
      dv += isp * G0 * Math.log(m / (m - dm)); burn += t; m -= dm;
      for (const gi in gm){ let need = gm[gi] * t; for (const i of st.tanks[gi]){ const take = Math.min(parts[i].fuel, need); parts[i].fuel -= take; need -= take; } }
      const next = q.find(gq => gq.some(u => parts.some(p => p.uid === u)));
      if (next){
        const sp = splitAt(parts, next), dropUids = new Set(sp.drops.flat().map(p => p.uid));
        const st2 = structure(parts);
        const stillLive = st2.act.some(i => dropUids.has(parts[i].uid) && groupFuel(parts, st2, st2.comp[i]) > 1e-6);
        if (!stillLive) break;
      }
    }
    if (dv > 0 || twr) out.push({n:out.length + 1, dv, twr:twr || 0, thr:thr0, burn});
    const next = q.find(gq => gq.some(u => parts.some(p => p.uid === u)));
    if (!next) break;
    parts = splitAt(parts, next).keep;
  }
  return out;
}

/* drawing */
function drawVessel(c, parts, com, tint){
  for (const p of parts){
    const d = defOf(p);
    c.save(); c.translate(p.x - com.x, p.y - com.y); c.rotate(-(p.r || 0) * Math.PI / 2); if (p.f) c.scale(-1, 1);
    drawPart(c, d, -d.h / 2);
    if (tint){ c.fillStyle = tint; c.fillRect(-d.w / 2, -d.h / 2, d.w, d.h); }
    c.restore();
  }
}
function drawVesselFlames(c, parts, act, com, thr, dense, liveSet){
  if (thr <= 0) return;
  for (const i of act){
    if (liveSet && !liveSet.has(i)) continue;
    const p = parts[i], d = defOf(p);
    c.save(); c.translate(p.x - com.x, p.y - com.y); c.rotate(-(p.r || 0) * Math.PI / 2); if (p.f) c.scale(-1, 1);
    drawFlames(c, d.bells.map(([x, ew]) => ({x, y:-d.h / 2, ew})), thr, dense);
    c.restore();
  }
}
// nozzle exits in vessel coordinates (relative to the CoM) with exhaust direction
function exitsOf(parts, act, com, liveSet){
  const out = [];
  for (const i of act){
    if (liveSet && !liveSet.has(i)) continue;
    const p = parts[i], d = defOf(p), [nx, ny] = localDir(p, 0, -1);
    for (const [bx, ew] of d.bells){ const [ox, oy] = localDir(p, bx, -d.h / 2); out.push({x:p.x - com.x + ox, y:p.y - com.y + oy, nx, ny, ew}); }
  }
  return out;
}
