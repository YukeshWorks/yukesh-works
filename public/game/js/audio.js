'use strict';
/* ===== audio: everything is synthesised live with Web Audio (no files) =====
   Engine, wind and re-entry layers follow the physics every frame; one-shots for events;
   a generative score whose mood follows the flight. */
const AUD = (() => {
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('orbitforge2.audio')) || {}; } catch (e){}
  const V = {sfx:saved.sfx != null ? saved.sfx : 0.8, music:saved.music != null ? saved.music : 0.55, mute:!!saved.mute};
  let ac = null, master, sfxBus, musBus, revIn, white, brown, eng = null, mood = 'hangar', nextChord = 0, nextBell = 0, nextPulse = 0, chordIx = 0, sched = null, lastEngine = 0, alarmT = 0;
  const save = () => { try { localStorage.setItem('orbitforge2.audio', JSON.stringify(V)); } catch (e){} };
  const now = () => ac.currentTime;
  function noiseBuf(sec, brownian){
    const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); let last = 0;
      for (let i = 0; i < n; i++){ const w = Math.random() * 2 - 1; if (brownian){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } }
    return b;
  }
  function impulse(sec, decay){
    const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  function init(){
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
    ac = new C({latencyHint:'interactive'});
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25;
    master = ac.createGain(); master.gain.value = V.mute ? 0 : 1; master.connect(comp); comp.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = V.sfx; sfxBus.connect(master);
    musBus = ac.createGain(); musBus.gain.value = V.music; musBus.connect(master);
    const rev = ac.createConvolver(); rev.buffer = impulse(3.2, 2.6); revIn = ac.createGain(); revIn.gain.value = 0.9;
    const revOut = ac.createGain(); revOut.gain.value = 0.55; revIn.connect(rev); rev.connect(revOut); revOut.connect(master);
    white = noiseBuf(2, false); brown = noiseBuf(4, true);
    // continuous layers: engine roar, crackle, rumble, wind, re-entry
    const loop = (buf, rate) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate || 1; s.start(); return s; };
    const lp = (f, q) => { const n = ac.createBiquadFilter(); n.type = 'lowpass'; n.frequency.value = f; n.Q.value = q || 0.7; return n; };
    const bp = (f, q) => { const n = ac.createBiquadFilter(); n.type = 'bandpass'; n.frequency.value = f; n.Q.value = q || 1; return n; };
    const gain = v => { const g = ac.createGain(); g.gain.value = v; return g; };
    eng = {roarF:lp(300), roar:gain(0), crackF:bp(2400, 0.8), crack:gain(0), rum:gain(0), windF:bp(500, 0.9), wind:gain(0), reF:lp(900, 1.2), re:gain(0), alarm:gain(0)};
    loop(brown).connect(eng.roarF); eng.roarF.connect(eng.roar); eng.roar.connect(sfxBus);
    loop(white, 0.9).connect(eng.crackF); eng.crackF.connect(eng.crack); eng.crack.connect(sfxBus);
    const ro = ac.createOscillator(); ro.type = 'sine'; ro.frequency.value = 34; ro.start(); ro.connect(eng.rum); eng.ro = ro; eng.rum.connect(sfxBus);
    loop(white, 0.6).connect(eng.windF); eng.windF.connect(eng.wind); eng.wind.connect(sfxBus);
    loop(brown, 1.6).connect(eng.reF); eng.reF.connect(eng.re); eng.re.connect(sfxBus); eng.re.connect(revIn);
    const al = ac.createOscillator(); al.type = 'square'; al.frequency.value = 880; al.start(); const alF = lp(2200); al.connect(alF); alF.connect(eng.alarm); eng.alarm.connect(sfxBus);
    sched = setInterval(schedule, 150);
    return true;
  }
  function unlock(){ if (!ac && !init()) return; if (ac.state === 'suspended') ac.resume(); }
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => window.addEventListener(ev, unlock, {passive:true}));
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });
  const set = (p, v, tc) => { if (Number.isFinite(v)) p.setTargetAtTime(v, now(), tc || 0.08); };

  /* ---------- one-shot building blocks ---------- */
  function env(g, t, a, peak, dec){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function burst({dur = 0.5, f0 = 2000, f1 = 200, type = 'lowpass', q = 0.8, peak = 0.6, a = 0.005, rev = 0, rate = 1, delay = 0, buf}){
    if (!ac) return; const t = now() + delay, s = ac.createBufferSource(); s.buffer = buf || white; s.playbackRate.value = rate;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ac.createGain(); env(g, t, a, peak, dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); if (rev) { const r = ac.createGain(); r.gain.value = rev; g.connect(r); r.connect(revIn); }
    s.start(t, Math.random() * 1.5); s.stop(t + a + dur + 0.05);
  }
  function tone({f0 = 440, f1, dur = 0.2, type = 'sine', peak = 0.3, a = 0.004, rev = 0, delay = 0, bus}){
    if (!ac) return; const t = now() + delay, o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); env(g, t, a, peak, dur); o.connect(g); g.connect(bus || sfxBus);
    if (rev){ const r = ac.createGain(); r.gain.value = rev; g.connect(r); r.connect(revIn); }
    o.start(t); o.stop(t + a + dur + 0.05);
  }
  function bell(freq, peak, delay, bus){
    tone({f0:freq, dur:2.6, peak, a:0.004, rev:0.9, delay, bus});
    tone({f0:freq * 2.76, dur:1.1, peak:peak * 0.35, a:0.002, rev:0.9, delay, bus});
    tone({f0:freq * 5.4, dur:0.4, peak:peak * 0.12, a:0.002, rev:0.6, delay, bus});
  }
  /* ---------- named effects ---------- */
  const FX = {
    click(){ tone({f0:1700, f1:1300, dur:0.035, peak:0.08}); },
    place(){ tone({f0:520, dur:0.07, peak:0.14, type:'triangle'}); tone({f0:780, dur:0.09, peak:0.12, type:'triangle', delay:0.05}); burst({dur:0.05, f0:3000, f1:1500, type:'bandpass', peak:0.08}); },
    snap(){ if (now() - (FX.snapT || 0) < 0.06) return; FX.snapT = now(); burst({dur:0.03, f0:2500, f1:2000, type:'bandpass', q:3, peak:0.08}); },
    del(){ tone({f0:420, f1:160, dur:0.16, peak:0.14, type:'triangle'}); },
    rotate(){ tone({f0:900, dur:0.04, peak:0.1}); tone({f0:1200, dur:0.04, peak:0.08, delay:0.04}); },
    launch(){ burst({dur:1.6, f0:180, f1:900, peak:0.35, a:0.25, buf:brown}); },
    ignite(){ burst({dur:0.9, f0:120, f1:1400, peak:0.5, a:0.06, buf:brown, rev:0.3}); tone({f0:60, f1:38, dur:0.8, peak:0.35}); },
    cutoff(){ burst({dur:0.35, f0:900, f1:120, peak:0.25, buf:brown}); },
    stage(){ burst({dur:0.06, f0:6000, f1:3000, type:'highpass', peak:0.55}); burst({dur:0.5, f0:1400, f1:120, peak:0.45, delay:0.02, rev:0.4}); tone({f0:130, f1:55, dur:0.3, peak:0.4, delay:0.01}); },
    chute(){ burst({dur:1.3, f0:300, f1:1600, type:'bandpass', q:1.2, peak:0.35, a:0.05}); for (let i = 0; i < 8; i++) burst({dur:0.06, f0:900, f1:700, type:'bandpass', q:2, peak:0.12, delay:0.15 + i * 0.07}); },
    tear(){ burst({dur:0.4, f0:4000, f1:600, type:'bandpass', q:0.6, peak:0.5}); },
    thud(){ tone({f0:95, f1:40, dur:0.35, peak:0.5}); burst({dur:0.35, f0:600, f1:80, peak:0.35, buf:brown}); },
    splash(){ burst({dur:1.2, f0:2500, f1:300, peak:0.45, a:0.01, rev:0.3}); for (let i = 0; i < 6; i++) tone({f0:500 + Math.random() * 900, f1:300 + Math.random() * 1500, dur:0.07, peak:0.05, delay:0.25 + Math.random() * 0.8}); },
    chime(){ [0, 4, 7, 12].forEach((s, i) => bell(523.25 * Math.pow(2, s / 12), 0.12, i * 0.09)); },
    soi(){ [0, 7, 14].forEach((s, i) => bell(392 * Math.pow(2, s / 12), 0.08, i * 0.18)); },
    warp(up){ tone({f0:up ? 600 : 900, f1:up ? 900 : 600, dur:0.08, peak:0.09, type:'triangle'}); },
    auto(){ tone({f0:660, dur:0.12, peak:0.12, type:'triangle'}); tone({f0:990, dur:0.18, peak:0.12, type:'triangle', delay:0.12}); },
    autoOff(){ tone({f0:990, dur:0.1, peak:0.1, type:'triangle'}); tone({f0:660, dur:0.16, peak:0.1, type:'triangle', delay:0.1}); },
    open(){ tone({f0:700, f1:1000, dur:0.06, peak:0.07}); },
  };
  function sfx(name, arg){ if (!ac || V.mute) return; try { FX[name] && FX[name](arg); } catch (e){} }
  /* explosion: size in metres of fireball, dist in metres from the camera */
  function boom(size, dist, air){
    if (!ac || V.mute) return;
    const k = clamp(size / 40, 0.2, 2.2), att = clamp(1 / (1 + (dist || 0) / 600), 0.08, 1), vac = air === false ? 0.35 : 1;
    const delay = air === false ? 0 : Math.min(1.5, (dist || 0) / 343);   // sound arrives after the flash
    burst({dur:0.08, f0:8000, f1:3000, type:'highpass', peak:0.6 * att * vac, delay});
    burst({dur:1.2 + k * 1.4, f0:3500, f1:60, peak:0.9 * att * vac, a:0.004, rev:0.8, delay, buf:white});
    burst({dur:2 + k * 2.2, f0:500, f1:40, peak:0.9 * att, a:0.02, rev:0.5, delay, buf:brown});
    tone({f0:70, f1:24, dur:1 + k, peak:0.8 * att, delay});
    if (k > 0.8) for (let i = 0; i < 5; i++) burst({dur:0.5, f0:1200, f1:100, peak:0.25 * att * vac, delay:delay + 0.3 + Math.random() * 1.6, buf:brown});
  }
  /* ---------- per-frame layers ---------- */
  function update(st){
    if (!ac || !eng) return;
    const m = V.mute ? 0 : 1;
    const thr = st.active ? st.throttle : 0, dense = st.dense || 0, near = st.near == null ? 1 : st.near;
    const size = clamp(Math.log10(Math.max(st.thrust || 0, 10)) / 4.4, 0.2, 1.05);
    const lvl = thr * near * m;
    set(eng.roar.gain, lvl * (0.18 + 0.6 * dense) * (0.6 + 0.6 * size), 0.06);
    set(eng.roarF.frequency, 120 + (dense * 2200 + 380) * thr * (1.25 - size * 0.55), 0.08);
    const crackle = lvl * dense * (0.04 + 0.16 * Math.random()) * size;
    set(eng.crack.gain, crackle, 0.02); set(eng.crackF.frequency, 1500 + Math.random() * 2500, 0.03);
    set(eng.rum.gain, lvl * (0.25 + 0.35 * size), 0.1); set(eng.ro.frequency, 30 + 18 * (1 - size) + 10 * thr, 0.2);
    const qd = st.qdyn || 0, wk = clamp((Math.log10(qd + 1) - 1.5) / 3.2, 0, 1) * near * m;
    set(eng.wind.gain, wk * 0.35, 0.15); set(eng.windF.frequency, 250 + 1600 * wk, 0.2);
    const rk = clamp((Math.log10((st.heat || 0) + 1) - 4.4) / 2.2, 0, 1) * near * m;
    set(eng.re.gain, rk * 0.6, 0.2); set(eng.reF.frequency, 300 + 1400 * rk, 0.3);
    alarmT += st.dt || 0.016;
    set(eng.alarm.gain, st.alarm && (alarmT % 0.5) < 0.22 ? 0.05 * m : 0, 0.01);
    lastEngine = Math.max(lvl * (0.4 + dense * 0.6), rk);
    set(musBus.gain, V.music * (1 - 0.45 * clamp(lastEngine, 0, 1)), 0.4);
    if (st.mood && st.mood !== mood){ mood = st.mood; nextChord = Math.min(nextChord, now() + 0.5); nextBell = now() + 1; }
  }
  /* ---------- generative score ---------- */
  const MOODS = {
    hangar:{root:146.83, scale:[0, 2, 4, 7, 9], prog:[[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], wave:'triangle', cut:1100, bells:[2.5, 5], chordLen:7, pad:0.05},
    ascent:{root:110, scale:[0, 3, 5, 7, 10], prog:[[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]], wave:'sawtooth', cut:900, bells:[4, 8], chordLen:4, pad:0.04, pulse:true},
    orbit:{root:130.81, scale:[0, 2, 4, 6, 7, 11], prog:[[0, 4, 7, 11], [2, 6, 9], [-1, 2, 6, 7], [4, 7, 11, 14]], wave:'sine', cut:1600, bells:[1.6, 4], chordLen:9, pad:0.055},
    deep:{root:98, scale:[0, 2, 7, 9, 14], prog:[[0, 7, 14], [-5, 2, 9], [3, 10, 15], [0, 7, 12]], wave:'sine', cut:900, bells:[3, 7], chordLen:14, pad:0.06},
    landed:{root:146.83, scale:[0, 2, 4, 7, 9], prog:[[0, 4, 7, 12], [5, 9, 12], [2, 5, 9], [7, 11, 14]], wave:'triangle', cut:1300, bells:[2, 5], chordLen:8, pad:0.05},
    silence:null,
  };
  function padNote(freq, t, len, M){
    for (const det of [-6, 5]){
      const o = ac.createOscillator(); o.type = M.wave; o.frequency.value = freq; o.detune.value = det;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = M.cut; f.Q.value = 0.5;
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(M.pad, t + len * 0.35); g.gain.linearRampToValueAtTime(M.pad * 0.7, t + len * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + len + 2.5);
      o.connect(f); f.connect(g); g.connect(musBus); const r = ac.createGain(); r.gain.value = 0.5; g.connect(r); r.connect(revIn);
      o.start(t); o.stop(t + len + 2.6);
    }
  }
  function schedule(){
    if (!ac || ac.state !== 'running') return;
    const M = MOODS[mood], t = now();
    if (!M){ nextChord = t + 1; return; }
    if (t + 0.3 >= nextChord){
      const start = Math.max(t + 0.05, nextChord), ch = M.prog[chordIx++ % M.prog.length];
      for (const sem of ch) padNote(M.root * Math.pow(2, sem / 12), start, M.chordLen, M);
      padNote(M.root / 2 * Math.pow(2, ch[0] / 12), start, M.chordLen, Object.assign({}, M, {pad:M.pad * 0.8, wave:'sine'}));
      nextChord = start + M.chordLen;
      M.cur = ch;
    }
    if (t + 0.3 >= nextBell){
      const start = Math.max(t + 0.05, nextBell), sem = M.scale[(Math.random() * M.scale.length) | 0] + 12 * (1 + (Math.random() < 0.4 ? 1 : 0));
      bell(M.root * Math.pow(2, sem / 12), mood === 'deep' ? 0.05 : 0.06, start - t, musBus);
      if (Math.random() < 0.35) bell(M.root * Math.pow(2, (sem + M.scale[(Math.random() * M.scale.length) | 0]) / 12), 0.035, start - t + 0.33, musBus);
      nextBell = start + M.bells[0] + Math.random() * (M.bells[1] - M.bells[0]);
    }
    if (M.pulse){
      const step = 60 / 112 / 2;
      while (nextPulse < t + 0.35){
        if (nextPulse < t) nextPulse = t + 0.02;
        const ch = M.cur || M.prog[0], sem = ch[(Math.floor(nextPulse / step) % 4 === 3) ? 1 : 0] - 12;
        tone({f0:M.root * Math.pow(2, sem / 12), dur:step * 0.9, peak:0.06 * clamp(0.3 + lastEngine, 0, 1), type:'triangle', delay:nextPulse - t, bus:musBus});
        nextPulse += step;
      }
    }
  }
  function setVol(k, v){ V[k] = v; save(); if (!ac) return; if (k === 'sfx') set(sfxBus.gain, v, 0.05); if (k === 'music') set(musBus.gain, v, 0.05); }
  function setMute(b){ V.mute = b; save(); if (ac) set(master.gain, b ? 0 : 1, 0.05); }
  return {sfx, boom, update, unlock, setVol, setMute, get V(){ return V; }, get on(){ return !!ac && ac.state === 'running'; }};
})();
