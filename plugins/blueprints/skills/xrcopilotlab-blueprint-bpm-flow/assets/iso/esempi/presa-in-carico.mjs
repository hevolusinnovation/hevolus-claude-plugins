// Esempio di figura d'autore: «Presa in carico di una comunicazione».
// Un nastro che porta le comunicazioni: la vaschetta degli arrivi, l'arco dell'assistente che legge (viola),
// il bivio che smista (ambra), la scrivania dove una persona controlla (azzurro), il timbro automatico (verde)
// e la vaschetta delle pratiche chiuse. Ogni cosa che si vede è un passo del processo; il disegno non dice
// niente che il manifest non dica.
//
// La figura si muove (SMIL, nessuno script): le comunicazioni scorrono sul nastro, il timbro batte, l'occhio dell'arco
// pulsa, la lancetta oscilla. Regola per chi ne scrive una: ogni movimento sta in un elemento `animate*` figlio della
// parte (così PDF e Word, che li tolgono, restano con la parte a riposo) o in un gruppo `.iso-anim`; ciò che a riposo
// va mostrato al posto di un gruppo mobile sta in un gruppo `.iso-static` (la pagina lo nasconde mentre anima).
//
//   node presa-in-carico.mjs [uscita.svg] [--preview]
//
// Senza --preview scrive solo l'SVG (quello che si dà a `assembla.sh`); con --preview scrive anche una pagina
// per guardarla (chiaro e scuro) accanto al file.
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const OUT = resolve(args.find((a) => !a.startsWith("--")) ?? join(HERE, "presa-in-carico.svg"));

const WIDTH = 1000;
const HEIGHT = 440;
// Vista quasi frontale (azimut 72°): il nastro corre in orizzontale e un poco in diagonale, così si vede anche il fianco dei pezzi.
const AZ = 72;
const EL = 30;

const BASE = { x: -190, y: -104, w: 380, d: 208, r: 9 };
const BASE_H = 10;
const FOOT_H = 5;
const BELT = { x: -122, y: -14, w: 248, d: 28, r: 3 };
const BELT_Z = 5;

const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-80, 0, 52], [100, 0, 44], [70, 48, 40]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 40 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (list, pick = (e) => e) => [...list].sort((a, b) => k.depthOf([pick(a)[0], pick(a)[1], 0], P) - k.depthOf([pick(b)[0], pick(b)[1], 0], P));
const rotRect = (cx, cy, w, d, deg) => {
  const a = (deg * Math.PI) / 180;
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
};
const screws = (plan, z, inset) => {
  const pts = k.corners(plan, inset);
  return L(pts.map(([x, y]) => k.ring(x, y, 1.8, z, P, 12)).join(""), { tone: "lo" }) + D(pts.map(([x, y]) => at([x, y, z])), { size: 0.45 });
};

// ───────── il banco ─────────
function banco() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 20))) {
    out.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.8, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6.2, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 6), 0, P), { tone: "faint" }));
  out.push(screws(BASE, 0, 11));
  // la targhetta con il righello, sul bordo davanti
  const plate = { x: -176, y: BASE.y + BASE.d - 22, w: 120, d: 14, r: 1.5 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(plate.x + 5, plate.x + plate.w - 5, 4, 5, plate.y + 1.2, 0.8, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([plate.x + 8, plate.y + 11], 0.8, P, "x"), "PRESA IN CARICO", { size: 4.6, tone: "mid" }));
  out.push(D([at([plate.x + 2.4, plate.y + 7, 0.8]), at([plate.x + plate.w - 2.4, plate.y + 7, 0.8])], { size: 0.45 }));
  return out.join("");
}

// ───────── la vaschetta degli arrivi, con le comunicazioni dentro ─────────
const TRAY = { x: -178, y: -34, w: 50, d: 68, r: 2 };
function arrivi() {
  const out = [S(k.slabOf(TRAY, 0, 3, P, 4, 0.5), { tone: "mid" })];
  const wall = (plan) => S(k.slabOf(plan, 3, 9, P, 2, 0.4), { tone: "mid", crease: "faint" });
  out.push(wall({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: 3, r: 0.6 }));
  out.push(wall({ x: TRAY.x, y: TRAY.y, w: 3, d: TRAY.d, r: 0.6 }));
  for (let i = 0; i < 5; i++) {
    const z = 3 + i * 1.5;
    const ring = rotRect(TRAY.x + 25 + (i % 2 ? 1.2 : -0.8), TRAY.y + 33 + (i % 3 ? 0.6 : -1), 30, 44, (i - 2) * 2.5);
    out.push(S(k.extrude(ring, z, 1.3, P, { convex: true }), { tone: "hi", crease: "none" }));
  }
  const top = rotRect(TRAY.x + 25, TRAY.y + 33, 30, 44, 5);
  const row = (t) => [top[0][0] + (top[3][0] - top[0][0]) * t, top[0][1] + (top[3][1] - top[0][1]) * t];
  out.push(L([0.2, 0.32, 0.44, 0.56].map((t) => k.lineOnTop([row(t)[0] + 4, row(t)[1]], [row(t)[0] + 22, row(t)[1] + 1], 3 + 4 * 1.5 + 1.3, P)).join(""), { tone: "lo" }));
  out.push(wall({ x: TRAY.x, y: TRAY.y + TRAY.d - 3, w: TRAY.w, d: 3, r: 0.6 }));
  out.push(D([at([TRAY.x + TRAY.w - 5, TRAY.y + 5, 3]), at([TRAY.x + TRAY.w - 5, TRAY.y + TRAY.d - 5, 3])], { size: 0.45 }));
  return out.join("");
}

// ───────── il nastro ─────────
function nastro() {
  const out = [];
  out.push(S(k.slabOf({ x: BELT.x, y: BELT.y - 4, w: BELT.w, d: 4, r: 1 }, 0, 11, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf(BELT, 0, BELT_Z, P, 4, 0.6), { tone: "lo" }));
  const ticks = [];
  for (let x = BELT.x + 6; x < BELT.x + BELT.w - 4; x += 8) ticks.push(k.lineOnTop([x, BELT.y + 2.5], [x, BELT.y + BELT.d - 2.5], BELT_Z, P));
  out.push(L(ticks.join(""), { tone: "faint" }));
  // le frecce del verso di marcia, sul nastro
  const chev = [-62, -20, 24, 80].map((x) => k.lineOnTop([x - 2.5, -4], [x + 1.5, 0], BELT_Z, P) + k.lineOnTop([x - 2.5, 4], [x + 1.5, 0], BELT_Z, P));
  out.push(L(chev.join(""), { tone: "mid" }));
  out.push(D([at([BELT.x + 4, BELT.y - 2, 11]), at([BELT.x + BELT.w - 4, BELT.y - 2, 11])], { size: 0.45 }));
  return out.join("");
}
function nastroDavanti() {
  const out = [S(k.slabOf({ x: BELT.x, y: BELT.y + BELT.d, w: BELT.w, d: 4, r: 1 }, 0, 11, P, 3, 0.5), { tone: "mid" })];
  out.push(D([at([BELT.x + 4, BELT.y + BELT.d + 4, 11]), at([BELT.x + BELT.w - 4, BELT.y + BELT.d + 4, 11])], { size: 0.45 }));
  for (const x of [BELT.x + 28, BELT.x + 118, BELT.x + 214]) out.push(S(k.slabOf({ x: x - 4, y: BELT.y + BELT.d + 4, w: 8, d: 6, r: 1 }, 0, 9, P, 2, 0.3), { tone: "lo" }));
  return out.join("");
}

// ───────── le comunicazioni sul nastro ─────────
const LETTERS = [[-104, -3, 4], [-94, 4, -6], [-70, -2, 3], [-30, 3, -4], [20, -4, 5], [100, 2, -3]];
function lettera([x, y, deg]) {
  const ring = rotRect(x, y, 13, 9.5, deg);
  const out = [S(k.extrude(ring, BELT_Z, 1.4, P, { convex: true }), { tone: "hi", crease: "none" })];
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const pt = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  out.push(L(k.lineOnTop(pt(-4.5, -1.2), pt(3, -1.2), BELT_Z + 1.4, P) + k.lineOnTop(pt(-4.5, 1.2), pt(1.2, 1.2), BELT_Z + 1.4, P), { tone: "lo" }));
  return out.join("");
}

// Le comunicazioni che scorrono: sei lettere fanno il giro del nastro, sfasate; a riposo ne restano due ferme.
const RUN = k.axisVector(P, [232, 0, 0]);
function lettereMobili() {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const y = [-3, 3, -2, 4, -4, 2][i];
    out.push(
      `<g opacity="0"><g>${lettera([-114, y, (i % 2 ? -5 : 4)])}</g>` +
        `<animateTransform attributeName="transform" type="translate" values="0 0;${RUN[0].toFixed(1)} ${RUN[1].toFixed(1)}" dur="21s" begin="-${(i * 3.5).toFixed(1)}s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.93;1" dur="21s" begin="-${(i * 3.5).toFixed(1)}s" repeatCount="indefinite"/></g>`,
    );
  }
  return `<g class="iso-anim">${out.join("")}</g>`;
}

// ───────── l'arco dell'assistente (viola) ─────────
const ARCO = { x: -86, h: 36 };
function arcoPosti(front) {
  const y = front ? 21 : -27;
  const out = [S(k.slabOf({ x: ARCO.x, y, w: 14, d: 6, r: 1 }, 0, ARCO.h, P, 3, 0.5), { tone: "violet" })];
  out.push(D([at([ARCO.x + 7, y + (front ? 6 : 0), 4]), at([ARCO.x + 7, y + (front ? 6 : 0), ARCO.h - 4])], { size: 0.45, tone: "mid" }));
  return out.join("");
}
function arcoTrave() {
  const beam = { x: ARCO.x - 2, y: -29, w: 18, d: 58, r: 2 };
  const out = [S(k.slabOf(beam, ARCO.h, 9, P, 4, 0.6), { tone: "violet" })];
  out.push(L(k.planOutline(k.insetPlan(beam, 3), ARCO.h + 9, P, 3), { tone: "faint" }));
  out.push(`<g>${S(k.cylinder(ARCO.x + 7, 0, 5, ARCO.h - 5, 5, P, 24), { tone: "violet", lit: true })}<animate attributeName="opacity" values="1;.45;1" dur="1.8s" repeatCount="indefinite"/></g>`);
  out.push(D([at([ARCO.x + 7, 0, ARCO.h - 5])], { size: 0.7, tone: "hi" }));
  const lamp = [ARCO.x + 7, 20];
  out.push(S(k.cylinder(lamp[0], lamp[1], 2.2, ARCO.h + 9, 2.4, P, 16), { tone: "violet" }));
  out.push(D([at([lamp[0], lamp[1], ARCO.h + 11.4])], { size: 0.55, tone: "hi" }));
  return out.join("");
}

// ───────── il bivio (ambra) e i due rami ─────────
const GATE = { x: 56, y: 0 };
function rami() {
  const out = [];
  const back = { x: GATE.x - 8, y: -62, w: 16, d: 48, r: 2 };
  const front = { x: GATE.x - 8, y: 14, w: 16, d: 52, r: 2 };
  out.push(S(k.slabOf(back, 0, 4, P, 3, 0.5), { tone: "lo" }));
  out.push(L(k.topTicks(back.y + 4, back.y + back.d - 3, 7, 7, back.x + 2, 4, [0, 12], P, "y").major, { tone: "faint" }));
  out.push(S(k.slabOf(front, 0, 4, P, 3, 0.5), { tone: "lo" }));
  return { out: out.join(""), back, front };
}
function bidone(cx, cy, n) {
  const plan = { x: cx - 20, y: cy - 16, w: 40, d: 32, r: 2 };
  const out = [S(k.slabOf(plan, 0, 3, P, 3, 0.4), { tone: "mid" })];
  out.push(S(k.slabOf({ ...plan, d: 3, y: plan.y }, 3, 7, P, 2, 0.3), { tone: "mid", crease: "faint" }));
  out.push(S(k.slabOf({ ...plan, w: 3 }, 3, 7, P, 2, 0.3), { tone: "mid", crease: "faint" }));
  for (let i = 0; i < n; i++) {
    const ring = rotRect(cx + 1 + (i % 2) * 1.4, cy + 1, 28, 20, (i - 1) * 3);
    out.push(S(k.extrude(ring, 3 + i * 2.2, 2, P, { convex: true }), { tone: "hi", crease: "none" }));
  }
  out.push(S(k.slabOf({ ...plan, y: plan.y + plan.d - 3, d: 3 }, 3, 7, P, 2, 0.3), { tone: "mid", crease: "faint" }));
  return out.join("");
}
function deviatore() {
  const out = [S(k.extrude([[GATE.x - 10, 0], [GATE.x, -10], [GATE.x + 10, 0], [GATE.x, 10]], BELT_Z, 3, P, { convex: true, bevel: 0.4 }), { tone: "amber" })];
  out.push(S(k.extrude(rotRect(GATE.x + 3, 7, 36, 4, 58), BELT_Z + 3, 4, P, { convex: true }), { tone: "amber", crease: "none" }));
  out.push(S(k.cylinder(GATE.x, 0, 2.4, BELT_Z + 3, 6, P, 16), { tone: "amber" }));
  out.push(D([at([GATE.x, 0, BELT_Z + 9])], { size: 0.55, tone: "hi" }));
  return out.join("");
}

// ───────── la scrivania della persona (azzurro) ─────────
const DESK = { x: -58, y: 40, w: 62, d: 34, r: 2.5 };
function scrivania() {
  const out = [S(k.slabOf(DESK, 0, 20, P, 4, 0.7), { tone: "blue" })];
  out.push(L(k.planOutline(k.insetPlan(DESK, 3), 20, P, 4), { tone: "faint" }));
  out.push(D([at([DESK.x + 5, DESK.y + 5, 20]), at([DESK.x + DESK.w - 5, DESK.y + DESK.d - 5, 20])], { size: 0.45 }));
  const dial = [DESK.x + 18, DESK.y + 17];
  out.push(S(k.cylinder(dial[0], dial[1], 10, 20, 4, P, 36, 0.5), { tone: "blue" }));
  const t = k.radialTicks(dial[0], dial[1], 9, 20, 5, 24, [1.4, 2.6], P, -2.4, 4.8);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  const needle = (deg) => k.lineOnTop([dial[0], dial[1]], [dial[0] + 7.4 * Math.sin((deg * Math.PI) / 180), dial[1] - 7.4 * Math.cos((deg * Math.PI) / 180)], 24, P);
  out.push(
    L(needle(40), { tone: "hi" }).replace(/\/>$/, `><animate attributeName="d" values="${[needle(-55), needle(35), needle(-10), needle(50), needle(-55)].join(";")}" dur="9s" repeatCount="indefinite"/></path>`),
  );
  out.push(D([at([dial[0], dial[1], 24])], { size: 0.55, tone: "hi" }));
  const knob = [DESK.x + 44, DESK.y + 14];
  out.push(S(k.cylinder(knob[0], knob[1], 5, 20, 4, P, 28), { tone: "blue" }));
  out.push(L(k.knurl(knob[0], knob[1], 5, 20, 24, 28, P), { tone: "lo" }));
  out.push(L(k.lineOnTop([knob[0], knob[1]], [knob[0] + 5, knob[1]], 24, P), { tone: "hi" }));
  return out.join("");
}
function persona() {
  const x = DESK.x + 48, y = DESK.y - 12;
  const out = [S(k.cylinder(x, y, 5.5, 0, 14, P, 28, 0.5), { tone: "blue" })];
  out.push(S(k.cylinder(x, y, 3.8, 14, 5.5, P, 24, 0.4), { tone: "blue" }));
  out.push(D([at([x, y, 19.5])], { size: 0.45, tone: "hi" }));
  return out.join("");
}

// ───────── il timbro (verde) ─────────
const TIMBRO = { x: 94 };
function timbroPosti(front) {
  const y = front ? 21 : -27;
  return S(k.slabOf({ x: TIMBRO.x, y, w: 12, d: 6, r: 1 }, 0, 26, P, 3, 0.5), { tone: "green" });
}
function timbroTesta() {
  const out = [S(k.slabOf({ x: TIMBRO.x - 2, y: -29, w: 16, d: 58, r: 2 }, 26, 7, P, 4, 0.5), { tone: "green" })];
  out.push(S(k.cylinder(TIMBRO.x + 6, 0, 2, 20, 6, P, 16), { tone: "green", crease: "none" }));
  const DOWN = k.axisVector(P, [0, 0, 7]);
  out.push(
    `<g>${S(k.cylinder(TIMBRO.x + 6, 0, 6.4, BELT_Z + 3, 11, P, 28, 0.5), { tone: "green" })}${L(k.knurl(TIMBRO.x + 6, 0, 6.4, BELT_Z + 3, BELT_Z + 14, 24, P), { tone: "lo" })}` +
      `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;${DOWN[0].toFixed(1)} ${DOWN[1].toFixed(1)};0 0;0 0" keyTimes="0;0.55;0.62;0.7;1" dur="3.5s" repeatCount="indefinite"/></g>`,
  );
  return out.join("");
}

// ───────── la vaschetta delle pratiche chiuse ─────────
const FINE = { x: 138, y: -26, w: 44, d: 52, r: 2 };
function chiuse() {
  const out = [S(k.slabOf(FINE, 0, 3, P, 4, 0.5), { tone: "mid" })];
  out.push(S(k.slabOf({ ...FINE, d: 3 }, 3, 8, P, 2, 0.3), { tone: "mid", crease: "faint" }));
  out.push(S(k.slabOf({ ...FINE, x: FINE.x + FINE.w - 3, w: 3 }, 3, 8, P, 2, 0.3), { tone: "mid", crease: "faint" }));
  for (let i = 0; i < 4; i++) {
    const ring = rotRect(FINE.x + 20 + (i % 2) * 1.2, FINE.y + 26, 30, 38, (i - 1.5) * 2.5);
    out.push(S(k.extrude(ring, 3 + i * 2, 1.8, P, { convex: true }), { tone: "hi", crease: "none" }));
  }
  out.push(S(k.slabOf({ ...FINE, y: FINE.y + FINE.d - 3, d: 3 }, 3, 8, P, 2, 0.3), { tone: "mid", crease: "faint" }));
  out.push(D([at([FINE.x + 6, FINE.y + 6, 3]), at([FINE.x + 6, FINE.y + FINE.d - 6, 3])], { size: 0.45 }));
  return out.join("");
}

// ───────── composizione, dal fondo al davanti ─────────
const r = rami();
const body = [
  banco(),
  bidone(GATE.x, -80, 3),
  arrivi(),
  nastro(),
  r.out,
  arcoPosti(false),
  timbroPosti(false),
  `<g class="iso-static">${[LETTERS[2], LETTERS[4]].map(lettera).join("")}</g>`,
  lettereMobili(),
  deviatore(),
  nastroDavanti(),
  arcoPosti(true),
  arcoTrave(),
  timbroPosti(true),
  timbroTesta(),
  chiuse(),
  bidone(GATE.x, 84, 4),
  persona(),
  scrivania(),
].filter(Boolean);

const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: "Presa in carico di una comunicazione: arrivi, lettura dell'assistente, bivio, controllo di una persona, timbro e pratiche chiuse", body });
writeFileSync(OUT, svg);
console.log(`scritto ${OUT} (${(svg.length / 1024).toFixed(0)} KB)`);

if (args.includes("--preview")) {
  for (const theme of ["dark", "light"]) {
    const extra = `<style>.iso{--anatomy-violet:#9d7de4;--anatomy-amber:#c07a28;--anatomy-blue:#4f7fe8;--anatomy-green:#2f9f63}.iso[data-theme="light"]{--anatomy-violet:#b08af5;--anatomy-amber:#b45309;--anatomy-blue:#2f5fd0;--anatomy-green:#2a9d5c}.iso-line[data-tone="violet"]{stroke:var(--anatomy-violet)}.iso-line[data-tone="amber"]{stroke:var(--anatomy-amber)}</style>`;
    const html = k.pageHtml({ title: "Presa in carico", theme, width: 900, body: k.plateHtml({ fig: "Fig 1", title: "Presa in carico", hint: "Anteprima", readout: "", body: svg }) });
    writeFileSync(OUT.replace(/\.svg$/, `-${theme}.html`), html.replace("</head>", extra + "</head>"));
  }
}
