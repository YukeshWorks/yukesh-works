// BLINK Buddy 3D v2 — a living VRM anime companion.
// Physics hair + skirt (spring bones), blinking, look-at, talking mouth, 12+ expressions,
// actions (walk, wave, cheer, sit on a chair she builds, eat ice cream, blow balloons that decorate
// the screen and pop on tap, crawl, snake-slither, stand sideways, peek, dance, sleep, sulk, shy),
// event reactions (gym, sleep, food, water, screen time, study, wake) and a live edit panel.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';

const MODEL = window.BUDDY_MODEL || 'buddy.vrm';
const DANCE = window.BUDDY_DANCE || 'idle.vrma';
const $ = (id) => document.getElementById(id);
const msg = $('msg'), sayEl = $('say');

// ---------------------------------------------------------------- scene --
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 50);
const CAM = new THREE.Vector3(0, 1.0, 4.2);
camera.position.copy(CAM); camera.lookAt(0, 0.85, 0);
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(1, 2, 3); scene.add(sun);
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.25 }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002; scene.add(shadow);
const halfW = () => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM.z * camera.aspect;
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const lookTarget = new THREE.Object3D(); camera.add(lookTarget); scene.add(camera);
addEventListener('pointermove', (e) => { lookTarget.position.set((e.clientX / innerWidth - 0.5) * 4, -(e.clientY / innerHeight - 0.5) * 3, -2); });

// ---------------------------------------------------------------- state --
let vrm, mixer, danceClip, danceAction;
const S = { t: 0, x: 0, targetX: null, dir: 1, walkPhase: 0, speed: 0, action: null, actionT: 0, actionDur: 0,
  blinkAt: 2, blinkT: -1, expr: {}, sayT: 0, nextThink: 6, mood: 'neutral', moodT: 0, sleepy: 0, yaw: 0, autoplay: true };
function say(text, secs = 3) { sayEl.textContent = text; sayEl.classList.add('on'); S.sayT = secs; }
function setMood(name, secs = 3) { S.mood = name; S.moodT = secs; }
function act(name, secs) {
  if (S.action === 'blow' && name !== 'blow' && held) { clearHeld(); }
  if (S.action === 'eat' && name !== 'eat') clearHeld();
  if (chairObj && name !== 'sit' && name !== 'build') { props.remove(chairObj); chairObj = null; }
  if (S.action === 'dance' && danceAction && name !== 'dance') danceAction.fadeOut(0.3);
  S.action = name; S.actionT = 0; S.actionDur = secs; S.targetX = null;
}
const damp = (c, t, k, dt) => c + (t - c) * (1 - Math.exp(-k * dt));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------------------------------------------------------------- props --
const props = new THREE.Group(); scene.add(props);
const mat = (c, o = {}) => new THREE.MeshToonMaterial({ color: c, ...o });
function iceCream() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.09, 16), mat(0xd9a05b)); cone.rotation.x = Math.PI; cone.position.y = -0.045;
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), mat(0xff9ec4)); s1.position.y = 0.01;
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), mat(0xfff1c9)); s2.position.y = 0.04;
  g.add(cone, s1, s2); g.scale.setScalar(1.6); g.userData.kind = 'ice'; return g;
}
function chair() {
  const g = new THREE.Group(), wood = mat(0xc98b52);
  const parts = [[0.42, 0.04, 0.38, 0, 0.42, 0], [0.04, 0.42, 0.04, -0.18, 0.21, -0.16], [0.04, 0.42, 0.04, 0.18, 0.21, -0.16], [0.04, 0.42, 0.04, -0.18, 0.21, 0.16], [0.04, 0.42, 0.04, 0.18, 0.21, 0.16], [0.42, 0.42, 0.04, 0, 0.65, -0.18]];
  parts.forEach(([w, h, d, x, y, z], i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); m.scale.setScalar(0.001); m.userData.order = i; g.add(m); });
  g.userData.kind = 'chair'; return g;
}
const balloons = [];
const BCOL = [0xff5c8a, 0xffc93c, 0x5cc8ff, 0x9b7bff, 0x6be59a, 0xff8f5c];
function makeBalloon(color) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 18), new THREE.MeshToonMaterial({ color })); b.scale.y = 1.18;
  const knot = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.03, 8), new THREE.MeshToonMaterial({ color })); knot.position.y = -0.135; knot.rotation.x = Math.PI;
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); shine.position.set(-0.04, 0.05, 0.08);
  const str = new THREE.Line(new THREE.BufferGeometry().setFromPoints([0, 1, 2, 3, 4, 5].map((i) => new THREE.Vector3(Math.sin(i) * 0.01, -0.15 - i * 0.05, 0))), new THREE.LineBasicMaterial({ color: 0xeeeeee }));
  g.add(b, knot, shine, str); g.userData = { kind: 'balloon', ball: b, color, bob: Math.random() * 6 }; return g;
}
let held = null, chairObj = null;
function clearHeld() { if (held) { held.parent && held.parent.remove(held); held = null; } }

// pop particles
const sparks = [];
function burst(pos, color) {
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), new THREE.MeshBasicMaterial({ color }));
    m.position.copy(pos); m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 0.6); m.userData.life = 0.7;
    scene.add(m); sparks.push(m);
  }
}

// ---------------------------------------------------------------- load --
const loader = new GLTFLoader();
loader.register((p) => new VRMLoaderPlugin(p));
loader.register((p) => new VRMAnimationLoaderPlugin(p));
loader.load(MODEL, (gltf) => {
  vrm = gltf.userData.vrm; window.__vrm = vrm;
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  if (VRMUtils.combineSkeletons) VRMUtils.combineSkeletons(gltf.scene);
  if (vrm.meta && vrm.meta.metaVersion === '0') VRMUtils.rotateVRM0(vrm);
  vrm.scene.traverse((o) => { o.frustumCulled = false; });
  scene.add(vrm.scene);
  if (vrm.lookAt) vrm.lookAt.target = lookTarget;
  mixer = new THREE.AnimationMixer(vrm.scene);
  collectMaterials();
  buildEditor();
  msg.textContent = 'Tap her · tap balloons to pop · move your mouse, she looks at you';
  window.__ready = true;
  say('Hi! I\'m your BLINK buddy 💕', 3);
  loader.load(DANCE, (g) => { const a = g.userData.vrmAnimations && g.userData.vrmAnimations[0]; if (a) danceClip = createVRMAnimationClip(a, vrm); });
}, (p) => { if (p.total) msg.textContent = `Loading ${Math.round(p.loaded / p.total * 100)}%`; }, (e) => { msg.textContent = 'Could not load model: ' + e.message; });

// ---------------------------------------------------------------- edit panel --
const MATS = { top: [], skirt: [], hair: [], eye: [], skin: [] };
const cropPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.07);
function collectMaterials() {
  vrm.scene.traverse((o) => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      const n = (m.name || '').toLowerCase();
      if (n.includes('tops')) MATS.top.push(m);
      else if (n.includes('skirt') || n.includes('bottoms')) MATS.skirt.push(m);
      else if (n.includes('hair')) MATS.hair.push(m);
      else if (n.includes('iris')) MATS.eye.push(m);
      else if (n.includes('skin')) MATS.skin.push(m);
    });
  });
  MATS.top.forEach((m) => { m.clippingPlanes = [cropPlane]; });
}
function tint(list, hex) { list.forEach((m) => { if (m.color) m.color.set(hex); if (m.uniforms && m.uniforms.litFactor) m.uniforms.litFactor.value.set(hex); m.needsUpdate = true; }); }
function buildEditor() {
  const ed = $('editor'); if (!ed) return;
  const row = (label, html) => `<label><span>${label}</span>${html}</label>`;
  ed.innerHTML = `<b>Edit her</b>
    ${row('Top', '<input type="color" data-t="top" value="#ffffff">')}
    ${row('Skirt', '<input type="color" data-t="skirt" value="#1c2452">')}
    ${row('Hair', '<input type="color" data-t="hair" value="#ffffff">')}
    ${row('Eyes', '<input type="color" data-t="eye" value="#ffffff">')}
    ${row('Crop', '<input type="range" id="crop" min="0.86" max="1.2" step="0.005" value="1.07">')}
    <div class="exprs">${['happy', 'angry', 'sad', 'relaxed', 'surprised', 'blink', 'blinkLeft', 'aa', 'ih', 'ou', 'ee', 'oh'].map((e) => `<button data-x="${e}">${e}</button>`).join('')}</div>`;
  ed.querySelectorAll('input[type=color]').forEach((i) => i.addEventListener('input', () => tint(MATS[i.dataset.t], i.value)));
  $('crop').addEventListener('input', (e) => { cropPlane.constant = -Number(e.target.value); });
  ed.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => { S.forceExpr = b.dataset.x; S.forceT = 2; }));
}

// ---------------------------------------------------------------- actions --
const LINES = {
  gym: ['Gym time! Let\'s go! 💪', 'One more set! You got this!'], sleep: ['It\'s late… sleepy time 😴', 'Bed. Now. Please?'],
  food: ['Ice cream break! 🍦', 'Fuel up, but eat veggies too!'], water: ['Drink some water! 💧', 'Hydration check~'],
  screen: ['Hey! Put the phone down! 😤', 'You said just 5 minutes…'], study: ['Focus mode! I\'ll sit quietly 📚'], wake: ['Good morning!! ☀️ Stretch with me!']
};
const A = {
  hello: () => { act('wave', 2.4); setMood('happy', 2.4); say('Hello! 👋'); },
  walk: () => { S.action = null; S.targetX = (S.x > 0 ? -1 : 1) * (Math.random() * halfW() * 0.6); },
  cheer: () => { act('jump', 2.2); setMood('happy', 2.4); },
  sit: () => {
    if (!chairObj) { chairObj = chair(); chairObj.position.set(S.x, 0, -0.12); props.add(chairObj); act('build', 2.4); say('Let me build a chair… 🔨', 2.4); S.after = 'sit'; return; }
    act('sit', 6); setMood('relaxed', 6); say('Ahh, comfy~', 2);
  },
  eat: () => { clearHeld(); held = iceCream(); act('eat', 6); setMood('happy', 6); say(pick(LINES.food)); },
  balloon: () => { clearHeld(); held = makeBalloon(pick(BCOL)); held.scale.setScalar(0.05); act('blow', 3.2); say('Fuuuu… 🎈', 2.4); },
  decorate: () => { let n = 0; const spawn = () => { A.balloon(); if (++n < 4) S.queue.push({ at: S.t + 3.6, fn: spawn }); }; spawn(); say('Let me decorate your screen! 🎈🎈', 2.5); },
  crawl: () => { act('crawl', 6); setMood('happy', 6); say('Crawl crawl~ 👶', 2); S.crawlDir = S.x > 0 ? -1 : 1; },
  snake: () => { act('snake', 6); setMood('relaxed', 6); say('Sssss~ 🐍', 2); S.crawlDir = S.x > 0 ? -1 : 1; },
  sideways: () => { act('side', 4); say('Hmm? 👀', 1.6); },
  peek: () => { act('peek', 4.5); setMood('surprised', 1.5); say('Peekaboo! 🙈', 2); },
  dance: () => { if (!danceClip) return say('Loading dance…', 1.5); act('dance', danceClip.duration * 2); setMood('happy', danceClip.duration * 2); danceAction = mixer.clipAction(danceClip); danceAction.reset().fadeIn(0.3).play(); },
  sulk: () => { act('stomp', 3); setMood('angry', 3); say(pick(LINES.screen)); },
  sad: () => { act('droop', 3); setMood('sad', 3); say('You skipped the gym… 🥺'); },
  shy: () => { act('shy', 3); setMood('happy', 3); say('D-don\'t stare… 😳'); },
  sleep: () => { act('droop', 5); setMood('relaxed', 5); S.sleepy = 5; say(pick(LINES.sleep), 4); },
  // events
  gym: () => { A.cheer(); say(pick(LINES.gym)); },
  food: () => A.eat(),
  water: () => { act('drink', 3); setMood('happy', 3); say(pick(LINES.water)); },
  screen: () => A.sulk(),
  study: () => { A.sit(); say(pick(LINES.study)); },
  wake: () => { act('stretch', 3); setMood('happy', 3); say(pick(LINES.wake)); }
};
S.queue = [];
document.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { S.autoplayPause = 20; A[b.dataset.a] && A[b.dataset.a](); }));
window.buddy = { do: (a) => A[a] && A[a](), state: S, react: (ev) => A[ev] && A[ev]() };

// tap: pop balloons first, else poke her
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(balloons.map((b) => b.userData.ball), false)[0];
  if (hit) { const g = balloons.find((b) => b.userData.ball === hit.object); popBalloon(g); return; }
  if (vrm && ray.intersectObject(vrm.scene, true).length) { S.pokes = (S.pokes || 0) + 1; (S.pokes % 3 === 0 ? A.shy : A.hello)(); }
});
function popBalloon(g) {
  const p = new THREE.Vector3(); g.userData.ball.getWorldPosition(p); burst(p, g.userData.color);
  scene.remove(g); balloons.splice(balloons.indexOf(g), 1);
  setMood('surprised', 1); say(pick(['Pop! 😆', 'Hey, that was mine! 😤', 'Hehe, again!']), 1.6);
}

// ---------------------------------------------------------------- pose --
function pose(dt) {
  const t = S.t, h = vrm.humanoid, B = (n) => h.getNormalizedBoneNode(n);
  const set = (n, x = 0, y = 0, z = 0, k = 12) => { const b = B(n); if (b) { b.rotation.x = damp(b.rotation.x, x, k, dt); b.rotation.y = damp(b.rotation.y, y, k, dt); b.rotation.z = damp(b.rotation.z, z, k, dt); } };
  const walking = S.speed > 0.02, ph = S.walkPhase, sw = Math.sin(ph), sw2 = Math.sin(ph * 2);
  const breathe = Math.sin(t * 2.2) * 0.03, a = S.action, k = S.actionDur ? S.actionT / S.actionDur : 0;
  let LU = [0, 0, -1.2], RU = [0, 0, 1.2], LL = [0, 0, -0.15], RL = [0, 0, 0.15], LH = [0, 0, 0], RH = [0, 0, 0];
  let spine = [breathe * 0.3, 0, 0], chest = [breathe, 0, 0], neck = [0, 0, Math.sin(t * 0.7) * 0.04], head = [0, 0, 0], hips = [0, 0, 0];
  let lul = [0, 0, 0], rul = [0, 0, 0], lll = [0, 0, 0], rll = [0, 0, 0], lf = [0, 0, 0], rf = [0, 0, 0];
  let hipsY = 0, rootX = 0, rootRotX = 0;
  if (walking) {
    const am = Math.min(1, S.speed / 0.6);
    lul = [-0.55 * sw * am, 0, 0]; rul = [0.55 * sw * am, 0, 0];
    lll = [0.7 * Math.max(0, -sw) * am + 0.1, 0, 0]; rll = [0.7 * Math.max(0, sw) * am + 0.1, 0, 0];
    LU = [0.45 * sw * am, 0, -1.25]; RU = [-0.45 * sw * am, 0, 1.25]; spine = [0.05, 0.08 * sw * am, 0]; hipsY = Math.abs(sw2) * 0.025 * am;
  }
  switch (a) {
    case 'wave': RU = [0, 0, -0.55]; RL = [0, 0, -1.1 + Math.sin(t * 9) * 0.45]; neck = [0, 0, 0.12]; break;
    case 'jump': { const j = Math.max(0, Math.sin(k * Math.PI * 3)); hipsY = j * 0.18; LU = [0, 0, 1.0]; RU = [0, 0, -1.0]; LL = [0, 0, 0.3]; RL = [0, 0, -0.3]; lul = rul = [-0.4 * j, 0, 0]; lll = rll = [0.8 * j, 0, 0]; break; }
    case 'stomp': { const s = Math.max(0, Math.sin(t * 10)); lul = [-0.5 * s, 0, 0]; lll = [0.7 * s, 0, 0]; LU = [0, 0.4, -0.95]; RU = [0, -0.4, 0.95]; LL = [0, 1.6, 0]; RL = [0, -1.6, 0]; neck = [0.1, Math.sin(t * 3) * 0.2, 0]; break; }
    case 'droop': neck = [0.35, 0, 0.1]; spine = [0.15, 0, 0]; LU = [0, 0, -1.35]; RU = [0, 0, 1.35]; break;
    case 'shy': neck = [0.2, 0.35, 0.1]; LU = [0.3, 0, -1.1]; RU = [0.3, 0, 1.1]; LL = [0, 0.9, 0]; RL = [0, -0.9, 0]; hips = [0, 0, Math.sin(t * 3) * 0.04]; break;
    case 'stretch': { const s = Math.sin(Math.min(1, k * 1.3) * Math.PI); LU = [0, 0, 1.3 * s - 1.2 * (1 - s)]; RU = [0, 0, -1.3 * s + 1.2 * (1 - s)]; spine = [-0.15 * s, 0, 0]; neck = [-0.25 * s, 0, 0]; break; }
    case 'drink': RU = [0, 1.0, -0.95]; RL = [0, 2.4, 0]; neck = [-0.35 * Math.max(0, Math.sin(k * Math.PI)), 0, 0]; break;
    case 'eat': RU = [0, 1.0, -0.85 + Math.max(0, Math.sin(t * 6)) * 0.12]; RL = [0, 2.3, 0]; neck = [0.12 + Math.max(0, Math.sin(t * 6)) * 0.1, -0.1, 0]; break;
    case 'blow': RU = [0, 1.0, -0.95]; RL = [0, 2.4, 0]; LU = [0, -1.0, 0.95]; LL = [0, -2.4, 0]; chest = [-0.05 - 0.05 * Math.sin(t * 5), 0, 0]; break;
    case 'build': { const s = Math.sin(t * 14); spine = [0.5, 0, 0]; neck = [0.2, 0, 0]; RU = [-0.6, 0, 0.9 + 0.3 * s]; RL = [0, -1.2, 0]; LU = [-0.4, 0, -0.9]; break; }
    case 'sit': hipsY = -0.36; lul = rul = [-1.45, 0, 0]; lll = rll = [1.45, 0, 0]; LU = [0.2, 0, -1.15]; RU = [0.2, 0, 1.15]; LL = [0, 0.6, 0]; RL = [0, -0.6, 0]; neck = [0.05, Math.sin(t * 0.6) * 0.15, 0]; lf = rf = [0.1 * Math.sin(t * 3), 0, 0]; break;
    case 'crawl': { const c = Math.sin(t * 6); hips = [1.35, 0, 0]; hipsY = -0.5; lul = [-1.35 + 0.25 * c, 0, 0]; rul = [-1.35 - 0.25 * c, 0, 0]; lll = rll = [1.55, 0, 0]; LU = [-1.35 - 0.25 * c, 0, -1.2]; RU = [-1.35 + 0.25 * c, 0, 1.2]; LL = RL = [0, 0, 0]; spine = [0, 0, 0]; chest = [0, 0, 0]; neck = [-0.7, 0, 0]; head = [-0.4, 0, 0]; break; }
    case 'snake': { const c = Math.sin(t * 5); hips = [1.5, 0, 0.18 * c]; hipsY = -0.8; spine = [0, 0, -0.3 * c]; chest = [0, 0, 0.3 * c]; lul = [0, 0, 0.15 * c]; rul = [0, 0, 0.15 * c]; LU = [0, 0, 1.4]; RU = [0, 0, -1.4]; neck = [-0.9, 0, -0.2 * c]; head = [-0.4, 0, 0]; break; }
    case 'side': head = [0, -0.5 * Math.sin(Math.min(1, k * 3) * Math.PI * 0.5), 0.1]; break;
    case 'peek': { const p = Math.sin(k * Math.PI); hips = [0, 0, 0.35 * p]; neck = [0, 0, 0.3 * p]; LU = [0, 0, -0.9]; RU = [0, 0, 0.9]; break; }
  }
  if (a !== 'dance') {
    set('leftUpperArm', ...LU); set('rightUpperArm', ...RU); set('leftLowerArm', ...LL); set('rightLowerArm', ...RL); set('leftHand', ...LH); set('rightHand', ...RH);
    set('spine', ...spine); set('chest', ...chest); set('neck', ...neck); set('head', ...head); set('hips', ...hips);
    set('leftUpperLeg', ...lul); set('rightUpperLeg', ...rul); set('leftLowerLeg', ...lll); set('rightLowerLeg', ...rll); set('leftFoot', ...lf); set('rightFoot', ...rf);
    const hb = B('hips'); if (hb) hb.position.y = damp(hb.position.y, (hb.userData.y0 ??= hb.position.y) + hipsY, 10, dt);
  }
  S.rootRotX = damp(S.rootRotX || 0, rootRotX, 6, dt);
  vrm.scene.rotation.x = S.rootRotX;
  return rootX;
}

function face(dt) {
  const em = vrm.expressionManager; if (!em) return;
  S.blinkAt -= dt;
  if (S.blinkAt <= 0) { S.blinkT = 0; S.blinkAt = Math.random() < 0.2 ? 0.3 : 2.5 + Math.random() * 3; }
  let bl = 0;
  if (S.blinkT >= 0) { S.blinkT += dt; const q = S.blinkT / 0.22; bl = q < 0.4 ? q / 0.4 : q < 1 ? 1 - (q - 0.4) / 0.6 : 0; if (q >= 1) S.blinkT = -1; }
  if (S.sleepy > 0) bl = Math.max(bl, 0.55 + 0.4 * Math.max(0, Math.sin(S.t * 1.5)));
  const want = { happy: 0, angry: 0, sad: 0, surprised: 0, relaxed: 0, aa: 0, ih: 0, ou: 0, ee: 0, oh: 0, blinkLeft: 0 };
  if (S.mood in want) want[S.mood] = 1;
  if (S.forceT > 0) { S.forceT -= dt; if (S.forceExpr in want) want[S.forceExpr] = 1; if (S.forceExpr === 'blink') bl = 1; }
  if (S.action === 'blow') want.ou = 1;
  if (S.action === 'eat') want.aa = 0.4 * Math.max(0, Math.sin(S.t * 6));
  const talk = S.sayT > 0.4 && S.action !== 'blow' ? Math.max(0, Math.sin(S.t * 18) * Math.sin(S.t * 7)) * 0.7 : 0;
  want.aa = Math.max(want.aa, talk);
  for (const [k, v] of Object.entries(want)) { S.expr[k] = damp(S.expr[k] || 0, v, 10, dt); em.setValue(k, S.expr[k]); }
  em.setValue('blink', bl * (1 - (S.expr.happy || 0) * 0.5));
}

// ---------------------------------------------------------------- loop --
function handWorld(name) { const b = vrm.humanoid.getNormalizedBoneNode(name) && vrm.humanoid.getRawBoneNode(name); const p = new THREE.Vector3(); if (b) b.getWorldPosition(p); return p; }
const clock = new THREE.Clock();
function step(dt) {
  S.t += dt;
  S.queue = S.queue.filter((q) => (S.t >= q.at ? (q.fn(), false) : true));
  if (vrm) {
    if (S.action) {
      S.actionT += dt;
      if (S.actionT > S.actionDur) {
        const done = S.action; S.action = null;
        if (done === 'dance' && danceAction) danceAction.fadeOut(0.4);
        if (done === 'eat') clearHeld();
        if (done === 'blow' && held) { held.userData.floatTo = new THREE.Vector3((Math.random() - 0.5) * halfW() * 1.6, 1.45 + Math.random() * 0.45, -0.3); balloons.push(held); scene.attach(held); held = null; }
        if (done === 'build' && S.after === 'sit') { S.after = null; A.sit(); }
        if (done === 'sit' && chairObj) { props.remove(chairObj); chairObj = null; }
      }
    }
    if (S.moodT > 0 && (S.moodT -= dt) <= 0) S.mood = 'neutral';
    if (S.sleepy > 0) S.sleepy -= dt;
    if (S.sayT > 0 && (S.sayT -= dt) <= 0) sayEl.classList.remove('on');
    if (S.autoplayPause > 0) S.autoplayPause -= dt;
    S.nextThink -= dt;
    if (S.autoplay && !(S.autoplayPause > 0) && S.nextThink <= 0 && !S.action && S.targetX == null) {
      S.nextThink = 6 + Math.random() * 6;
      pick([A.walk, A.walk, A.walk, A.hello, A.eat, A.balloon, A.sit, A.crawl, A.snake, A.sideways, A.peek, A.dance, A.shy])();
    }
    // locomotion
    let wantSpeed = 0, faceY = 0;
    if (S.targetX != null && !S.action) {
      const d = S.targetX - S.x; S.dir = Math.sign(d) || 1; wantSpeed = Math.min(0.6, Math.abs(d) * 2); faceY = S.dir * Math.PI / 2;
      if (Math.abs(d) < 0.02) S.targetX = null;
    }
    const creeping = S.action === 'crawl' || S.action === 'snake';
    if (creeping) { wantSpeed = S.action === 'crawl' ? 0.22 : 0.15; S.dir = S.crawlDir; faceY = S.dir * Math.PI / 2; if (Math.abs(S.x) > halfW() * 0.75) S.crawlDir = -Math.sign(S.x); }
    if (S.action === 'side') faceY = Math.PI / 2 * (S.x > 0 ? -1 : 1);
    S.speed = damp(S.speed, wantSpeed, 6, dt);
    S.x += S.speed * S.dir * dt; S.x = THREE.MathUtils.clamp(S.x, -halfW() * 0.8, halfW() * 0.8);
    S.walkPhase += S.speed * dt * 11;
    vrm.scene.position.x = S.x;
    S.yaw = damp(S.yaw, (S.speed > 0.05 || S.action === 'side' || creeping) ? faceY : 0, 7, dt);
    vrm.scene.rotation.y = S.yaw; vrm.scene.rotation.order = 'YXZ';
    shadow.position.x = S.x;
    pose(dt); face(dt);
    if (mixer) mixer.update(dt);
    vrm.update(dt);
    // props follow the hand / grow
    if (held) {
      const hand = handWorld('rightHand');
      if (S.action === 'blow') { const head = handWorld('head'); held.position.copy(head).add(new THREE.Vector3(0, -0.02 + 0.12 * held.scale.x, 0.12 + 0.12 * held.scale.x).applyAxisAngle(new THREE.Vector3(0, 1, 0), S.yaw)); held.scale.setScalar(0.05 + 0.95 * Math.min(1, S.actionT / S.actionDur)); }
      else held.position.copy(hand).add(new THREE.Vector3(0, 0.06, 0.04));
      if (!held.parent) scene.add(held);
    }
    if (chairObj) chairObj.children.forEach((m) => { const s = S.action === 'build' ? Math.min(1, Math.max(0.001, S.actionT * 3 - m.userData.order * 0.35)) : 1; m.scale.setScalar(damp(m.scale.x, s, 12, dt)); });
  }
  balloons.forEach((g) => { const d = g.userData; if (d.floatTo) g.position.lerp(d.floatTo, 1 - Math.exp(-1.5 * dt)); g.position.y += Math.sin(S.t * 1.6 + d.bob) * 0.0008; g.rotation.z = Math.sin(S.t * 1.2 + d.bob) * 0.08; });
  for (let i = sparks.length - 1; i >= 0; i--) { const m = sparks[i]; m.userData.life -= dt; m.userData.v.y -= 3 * dt; m.position.addScaledVector(m.userData.v, dt); m.scale.setScalar(Math.max(0.01, m.userData.life / 0.7)); if (m.userData.life <= 0) { scene.remove(m); sparks.splice(i, 1); } }
  renderer.render(scene, camera);
}
window.__step = step;
if (!location.search.includes('rec')) renderer.setAnimationLoop(() => step(Math.min(0.05, clock.getDelta())));
