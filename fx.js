/* ============================================================
   Painel do Comercial · cena de fundo

   Uma parede de azulejos luminosos atrás do deck inteiro: cada azulejo é
   uma conversa. A mesma nuvem se rearranja conforme a narrativa:

     scatter   conversas soltas, sem ordem (o WhatsApp de hoje)
     queue     a fila — linhas de clientes, os da frente acesos em laranja
     wall      a parede: a grade de números da TV
     funnel    o funil do CRM
     clock     o anel do alvo de 5 minutos, com o arco vencido em vermelho
     bars      resultados, coluna a coluna
     burst     encerramento

   Cada azulejo carrega um estado (0 neutro · 1 ok · 2 alerta) que vira cor
   no shader. Degradação: sem WebGL o canvas não sobe e o deck segue em
   HTML; com prefers-reduced-motion a cena congela e só redesenha na troca
   de slide; com a aba oculta o loop para.
   ============================================================ */

import * as THREE from "./vendor/three.module.min.js";

const COUNT = 1800;
const R = 14;

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260916);

function emptyForm() {
  return { pos: new Float32Array(COUNT * 3), st: new Float32Array(COUNT) };
}

/* ---------- formações ---------- */

function fmtScatter() {
  const f = emptyForm();
  for (let i = 0; i < COUNT; i++) {
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    const r = 8 + rnd() * 22;
    f.pos[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.6;
    f.pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    f.pos[i * 3 + 2] = r * Math.cos(ph) * 0.6;
    const u = rnd();
    f.st[i] = u < 0.08 ? 2 : u < 0.2 ? 1 : 0;
  }
  return f;
}

// A fila: linhas horizontais, quem está na frente (esquerda) espera há mais
// tempo e acende em alerta.
function fmtQueue() {
  const f = emptyForm();
  const rows = 9;
  const perRow = Math.ceil(COUNT / rows);
  for (let i = 0; i < COUNT; i++) {
    const r = i % rows;
    const c = Math.floor(i / rows);
    const x = (c - perRow / 2) * 0.62 + (rnd() - 0.5) * 0.2;
    f.pos[i * 3] = x;
    f.pos[i * 3 + 1] = (r - (rows - 1) / 2) * 2.6 + (rnd() - 0.5) * 0.4;
    f.pos[i * 3 + 2] = (rnd() - 0.5) * 2;
    const t = c / perRow;
    f.st[i] = t < 0.06 ? 2 : t < 0.14 ? 1 : 0;
  }
  return f;
}

// A parede: grade de azulejos como a TV, com a primeira linha acesa (o placar).
function fmtWall() {
  const f = emptyForm();
  const cols = 30;
  const rows = 15;
  for (let i = 0; i < COUNT; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols) % rows;
    const camada = Math.floor(i / (cols * rows));
    f.pos[i * 3] = (c - (cols - 1) / 2) * 1.35;
    f.pos[i * 3 + 1] = (r - (rows - 1) / 2) * 1.55;
    f.pos[i * 3 + 2] = -camada * 6 + (rnd() - 0.5) * 0.4;
    f.st[i] = camada === 0 && r === rows - 1 ? (c % 7 === 3 ? 2 : 1) : camada === 0 && rnd() < 0.04 ? 1 : 0;
  }
  return f;
}

function fmtFunnel() {
  const f = emptyForm();
  for (let i = 0; i < COUNT; i++) {
    const t = Math.pow(rnd(), 0.8);
    const y = R * 1.3 - t * R * 2.5;
    const raio = (1 - t) * R * 1.3 + 0.8;
    const a = rnd() * Math.PI * 2;
    const j = 0.85 + rnd() * 0.15;
    f.pos[i * 3] = Math.cos(a) * raio * j;
    f.pos[i * 3 + 1] = y;
    f.pos[i * 3 + 2] = Math.sin(a) * raio * j * 0.5;
    f.st[i] = t > 0.94 ? 1 : t > 0.35 && t < 0.5 && rnd() < 0.5 ? 2 : 0;
  }
  return f;
}

// O relógio: anel com 5/6 aceso (o alvo) e o arco que passou em alerta.
function fmtClock() {
  const f = emptyForm();
  for (let i = 0; i < COUNT; i++) {
    const anel = i % 4 === 0 ? 1 : 0;
    const raio = anel ? R * 0.7 : R * 1.05;
    const a = (i / COUNT) * Math.PI * 2 * 2 + rnd() * 0.05;
    const esp = (rnd() - 0.5) * (anel ? 0.9 : 1.5);
    f.pos[i * 3] = Math.cos(a) * (raio + esp);
    f.pos[i * 3 + 1] = Math.sin(a) * (raio + esp);
    f.pos[i * 3 + 2] = (rnd() - 0.5) * 2;
    const ang = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // sentido horário a partir do topo: os primeiros 5/6 são ok, o resto passou
    const horario = ((Math.PI / 2 - ang) + Math.PI * 2) % (Math.PI * 2);
    f.st[i] = anel ? 0 : horario < (Math.PI * 2 * 5) / 6 ? 1 : 2;
  }
  return f;
}

function fmtBars() {
  const f = emptyForm();
  const barras = 14;
  const alturas = [0.3, 0.42, 0.38, 0.55, 0.5, 0.62, 0.7, 0.66, 0.78, 0.84, 0.8, 0.9, 0.96, 1];
  for (let i = 0; i < COUNT; i++) {
    const b = i % barras;
    const h = alturas[b] * R * 1.9;
    const t = rnd();
    f.pos[i * 3] = (b - (barras - 1) / 2) * 2.7 + (rnd() - 0.5) * 1.3;
    f.pos[i * 3 + 1] = -R * 1 + t * h;
    f.pos[i * 3 + 2] = (rnd() - 0.5) * 2.5;
    f.st[i] = t > 0.93 ? 1 : 0;
  }
  return f;
}

function fmtBurst() {
  const f = emptyForm();
  for (let i = 0; i < COUNT; i++) {
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    const r = 24 + Math.pow(rnd(), 0.35) * 34;
    f.pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    f.pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
    f.pos[i * 3 + 2] = r * Math.cos(ph) * 0.6;
    f.st[i] = rnd() < 0.18 ? 1 : 0;
  }
  return f;
}

const FORMS = {
  scatter: fmtScatter(),
  queue: fmtQueue(),
  wall: fmtWall(),
  funnel: fmtFunnel(),
  clock: fmtClock(),
  bars: fmtBars(),
  burst: fmtBurst(),
};

/* ---------- shaders ---------- */

const VERT = `
attribute vec3 aPosA;
attribute vec3 aPosB;
attribute float aStA;
attribute float aStB;
attribute float aSeed;
uniform float uTime;
uniform float uMorph;
uniform float uSize;
uniform float uDrift;
varying float vAlpha;
varying float vSt;

void main() {
  vec3 p = mix(aPosA, aPosB, uMorph);
  float arco = sin(uMorph * 3.14159);
  p += vec3(sin(aSeed * 31.0), cos(aSeed * 17.0), sin(aSeed * 11.0)) * arco * 2.4;
  float t = uTime * 0.3 + aSeed * 6.28318;
  p += vec3(sin(t), cos(t * 0.9), sin(t * 1.3)) * uDrift;

  vSt = mix(aStA, aStB, uMorph);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (1.0 + step(0.5, vSt) * 0.7) * (280.0 / -mv.z);
  vAlpha = (0.45 + 0.55 * min(vSt, 1.0)) * smoothstep(-240.0, -18.0, mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

// Azulejo: quadrado de cantos arredondados com borda mais clara.
const FRAG = `
precision mediump float;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform float uOpacity;
varying float vAlpha;
varying float vSt;

float rbox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = rbox(p, vec2(0.36), 0.09);
  float corpo = 1.0 - smoothstep(-0.02, 0.02, d);
  float borda = 1.0 - smoothstep(0.0, 0.05, abs(d));
  // 0 neutro → 1 ok (ciano) → 2 alerta (laranja)
  vec3 col = vSt < 1.0 ? mix(uC0, uC1, vSt) : mix(uC1, uC2, clamp(vSt - 1.0, 0.0, 1.0));
  col += borda * 0.35;
  gl_FragColor = vec4(col, (corpo * 0.85 + borda * 0.5) * vAlpha * uOpacity);
}
`;

/* ---------- cena ---------- */

function boot() {
  const canvas = document.getElementById("fx");
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
    if (!renderer.getContext()) return null;
  } catch (e) {
    return null;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function sizeOf() {
    const r = canvas.getBoundingClientRect();
    return { w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) };
  }

  const first = sizeOf();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(first.w, first.h, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, first.w / first.h, 1, 500);
  camera.position.set(0, 0, 64);

  const group = new THREE.Group();
  scene.add(group);

  const geo = new THREE.BufferGeometry();
  const posA = new Float32Array(FORMS.scatter.pos);
  const posB = new Float32Array(FORMS.scatter.pos);
  const stA = new Float32Array(FORMS.scatter.st);
  const stB = new Float32Array(FORMS.scatter.st);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) seed[i] = rnd();

  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute("aPosA", new THREE.BufferAttribute(posA, 3));
  geo.setAttribute("aPosB", new THREE.BufferAttribute(posB, 3));
  geo.setAttribute("aStA", new THREE.BufferAttribute(stA, 1));
  geo.setAttribute("aStB", new THREE.BufferAttribute(stB, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 160);

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 1 },
    uSize: { value: 3.1 },
    uDrift: { value: 0.35 },
    uC0: { value: new THREE.Color("#2c4a7a") },
    uC1: { value: new THREE.Color("#35e3ff") },
    uC2: { value: new THREE.Color("#ff7a1a") },
    uOpacity: { value: 0 },
  };
  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false })
  );
  group.add(points);

  const state = { form: "scatter", pointerX: 0, pointerY: 0, tgtX: 0, tgtY: 0, rotY: 0 };
  const G = window.gsap;

  function tween(target, vars) {
    if (G && !reduced) return G.to(target, vars);
    Object.keys(vars).forEach((k) => {
      if (["duration", "ease", "delay", "onUpdate", "onComplete", "overwrite"].includes(k)) return;
      target[k] = vars[k];
    });
    if (vars.onUpdate) vars.onUpdate();
    return null;
  }

  function morphTo(formName, duration) {
    const next = FORMS[formName];
    if (!next || formName === state.form) return;
    const m = uniforms.uMorph.value;
    const a = geo.attributes.aPosA.array;
    const b = geo.attributes.aPosB.array;
    const sa = geo.attributes.aStA.array;
    const sb = geo.attributes.aStB.array;
    for (let i = 0; i < COUNT * 3; i++) a[i] = a[i] + (b[i] - a[i]) * m;
    for (let i = 0; i < COUNT; i++) sa[i] = sa[i] + (sb[i] - sa[i]) * m;
    b.set(next.pos);
    sb.set(next.st);
    geo.attributes.aPosA.needsUpdate = true;
    geo.attributes.aPosB.needsUpdate = true;
    geo.attributes.aStA.needsUpdate = true;
    geo.attributes.aStB.needsUpdate = true;
    uniforms.uMorph.value = 0;
    state.form = formName;
    tween(uniforms.uMorph, { value: 1, duration: duration || 1.7, ease: "power2.inOut", overwrite: true });
  }

  function narrowScale() {
    return window.innerWidth < 960 ? 0.6 : 1;
  }

  function worldHalfWidth() {
    const h = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z;
    return (h * camera.aspect) / 2;
  }

  function apply(el) {
    morphTo(el.dataset.fx || "scatter", 1.7);
    const dim = el.dataset.fxDim === "1";
    const light = el.classList.contains("slide--light");
    // No claro a cena briga com o texto: fica mais fraca ainda.
    const alvo = light ? (dim ? 0.1 : 0.26) : dim ? 0.16 : 0.9;
    tween(uniforms.uOpacity, { value: alvo, duration: 0.9, ease: "power2.out" });
    uniforms.uC0.value.set(light ? "#8fa4c4" : "#2c4a7a");
    uniforms.uC1.value.set(light ? "#0a7a8c" : "#35e3ff");
    uniforms.uC2.value.set(light ? "#d8600d" : "#ff7a1a");
    const escala = parseFloat(el.dataset.fxScale || "1") * narrowScale();
    tween(group.scale, { x: escala, y: escala, z: escala, duration: 1.1, ease: "power2.inOut" });
    const offX = parseFloat(el.dataset.fxOff || "0") * worldHalfWidth();
    tween(group.position, { x: offX, duration: 1.1, ease: "power2.inOut" });
    if (reduced) render();
  }

  let raf = 0;
  const clock = new THREE.Clock();

  function render() {
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
  }

  function frame() {
    state.pointerX += (state.tgtX - state.pointerX) * 0.045;
    state.pointerY += (state.tgtY - state.pointerY) * 0.045;
    state.rotY += 0.0007;
    group.rotation.y = state.rotY + state.pointerX * 0.22;
    group.rotation.x = -state.pointerY * 0.14;
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!raf && !reduced) raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      state.tgtX = e.clientX / window.innerWidth - 0.5;
      state.tgtY = e.clientY / window.innerHeight - 0.5;
    },
    { passive: true }
  );

  function resize() {
    const s = sizeOf();
    renderer.setSize(s.w, s.h, false);
    camera.aspect = s.w / s.h;
    camera.updateProjectionMatrix();
    render();
  }
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(canvas);

  start();
  render();

  // O módulo carrega depois do app.js: o primeiro slide já está ativo e
  // ninguém mais vai chamar setSlide por ele. Aplica agora.
  const ativo = document.querySelector(".slide.is-active");
  if (ativo) apply(ativo);

  return { setSlide: apply };
}

const api = boot();
if (api) window.PCFX = api;
