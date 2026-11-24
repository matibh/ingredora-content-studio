import * as THREE from "three";
import { BufferTarget, CanvasSource, Output, Quality, WebMOutputFormat, canEncodeVideo } from "mediabunny";
import { type DinnerSpeaker, type DinerRig, createDiner } from "./entrePartidasDinner";

export type BusStopShot = "exterior" | "master" | "bruno" | "tomas" | "valentina";
export type BusStopCue = {
  id: string;
  speaker: DinnerSpeaker;
  text: string;
  start: number;
  end: number;
  look?: DinnerSpeaker;
  shot: BusStopShot;
  laugh?: boolean;
};
export type BusStopPackage = {
  schemaVersion: 1;
  engineVersion: "entre-partidas-bus-stop-1.0.0";
  id: string;
  title: string;
  createdAt: string;
  fps: number;
  width: number;
  height: number;
  durationSeconds: number;
  endCardStart: number;
  chapterNumber?: number;
  dialogue: BusStopCue[];
};
export type BusStopProgress = { frame: number; totalFrames: number; percent: number };

const mat = (color: string, roughness = .82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const box = (parent: THREE.Object3D, size: [number, number, number], material: THREE.Material, pos: [number, number, number], cast = true) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh;
};
const sphere = (parent: THREE.Object3D, size: [number, number, number], material: THREE.Material, pos: [number, number, number], segments = 12) => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(.5, segments, 8), material);
  mesh.scale.set(...size); mesh.position.set(...pos); mesh.castShadow = true; parent.add(mesh); return mesh;
};
const rod = (parent: THREE.Object3D, a: [number, number, number], b: [number, number, number], radius: number, material: THREE.Material) => {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 8), material);
  mesh.position.copy(start.add(end).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  mesh.castShadow = true; parent.add(mesh); return mesh;
};
const textMap = (title: string, subtitle: string, bg: string, fg = "#fff5df") => {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No se pudo crear la señalética de la parada.");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = fg; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "900 78px Arial"; ctx.fillText(title, 256, 94);
  ctx.font = "700 34px Arial"; ctx.fillText(subtitle, 256, 178);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; return map;
};
const label = (parent: THREE.Object3D, title: string, subtitle: string, pos: [number, number, number], size: [number, number], bg: string, side: THREE.Side = THREE.DoubleSide) => {
  const map = textMap(title, subtitle, bg);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ map, side, toneMapped: false }));
  mesh.position.set(...pos); parent.add(mesh); return mesh;
};
const ease = (v: number) => { const x = Math.max(0, Math.min(1, v)); return x * x * (3 - 2 * x); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type BusRig = {
  root: THREE.Group;
  doorLeft: THREE.Mesh;
  doorRight: THREE.Mesh;
  headlights: THREE.PointLight[];
  boarded: boolean;
};

function makeBus(scene: THREE.Scene): BusRig {
  const root = new THREE.Group(); root.name = "BusStopBus"; root.position.set(-19, -2.08, -6.0); scene.add(root);
  const body = mat("#e3e3d7", .56), lower = mat("#183e50", .48), stripe = mat("#f0b94f", .48);
  const glass = new THREE.MeshStandardMaterial({ color: "#315064", roughness: .20, metalness: .12, transparent: true, opacity: .58, depthWrite: false, emissive: "#142b38", emissiveIntensity: .22 });
  const rubber = mat("#171a1c", .94), hub = mat("#8b9798", .36, .62), lamp = new THREE.MeshStandardMaterial({ color: "#fff0bd", emissive: "#ffd775", emissiveIntensity: 2.8 });
  box(root, [8.25, 2.65, 1.20], body, [0, 1.52, 0]);
  box(root, [8.22, .62, 2.55], lower, [0, .42, 0]);
  box(root, [8.24, .18, 2.57], stripe, [0, 1.05, 0], false);
  box(root, [8.15, .12, 2.58], mat("#142e3b", .55), [0, .12, 0], false);
  // Side rails keep the body silhouette while leaving the passenger windows and door readable.\n  for (const side of [-1, 1]) {\n    box(root, [8.18, .30, .14], lower, [0, 2.73, side * 1.20], false);\n    box(root, [8.18, .12, .14], stripe, [0, 2.93, side * 1.20], false);\n  }\n  // Front and rear windscreens.
  box(root, [.045, 1.34, 2.12], glass, [4.135, 2.05, 0], false);
  box(root, [.045, 1.20, 2.10], glass, [-4.135, 2.08, 0], false);
  // Repeated passenger windows, kept simple and flush with both bus sides.
  for (const side of [-1, 1]) {
    for (const x of [-3.35, -2.38, -.88, .25, 1.38, 2.52, 3.48]) {
      if (side === 1 && x > -2.0 && x < -.9) continue;
      box(root, [.80, 1.02, .045], glass, [x, 2.02, side * 1.273], false);
      box(root, [.84, .055, .06], stripe, [x, 2.54, side * 1.275], false);
    }
  }
  // Double sliding passenger door on the camera-facing side.
  const doorMat = mat("#bac8c5", .54);
  const doorLeft = box(root, [.88, 1.88, .065], doorMat, [-1.88, 1.72, 1.295], false);
  const doorRight = box(root, [.88, 1.88, .065], doorMat, [-.98, 1.72, 1.295], false);
  // The sliding door panels stay solid; the gap behind them is open when they part.
  // Wheels and metallic hubs.
  for (const x of [-2.75, 2.75]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.51, .51, .22, 14), rubber);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(x, .48, 1.20); wheel.castShadow = true; root.add(wheel);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .235, 12), hub);
    cap.rotation.x = Math.PI / 2; cap.position.set(x, .48, 1.325); root.add(cap);
    const farWheel = wheel.clone(); farWheel.position.z = -1.20; root.add(farWheel);
  }
  // Small route panel on the visible side.
  label(root, "LÍNEA 122", "CENTRO", [2.56, 2.84, 1.285], [1.48, .42], "#143c4c", THREE.FrontSide);
  const destination = label(root, "122", "CENTRO", [4.165, 2.53, 0], [1.25, .52], "#173b4a", THREE.DoubleSide);
  destination.rotation.y = Math.PI / 2;
  // Headlights and a discreet front destination glow.
  const headlights: THREE.PointLight[] = [];
  for (const z of [-.82, .82]) {
    box(root, [.09, .28, .48], lamp, [4.19, .86, z], false);
    const glow = new THREE.PointLight(0xffdf9b, 12, 17, 1.9); glow.position.set(4.45, .95, z); root.add(glow); headlights.push(glow);
  }
  return { root, doorLeft, doorRight, headlights, boarded: false };
}

function makeWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#081321");
  scene.fog = new THREE.Fog("#0a1727", 34, 88);
  scene.add(new THREE.HemisphereLight(0x9ab5e4, 0x171b24, 1.45));
  const moon = new THREE.DirectionalLight(0x9eb8e8, 1.55); moon.position.set(-8, 12, 7); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.left = -22; moon.shadow.camera.right = 22; moon.shadow.camera.top = 18; moon.shadow.camera.bottom = -18; scene.add(moon);
  const soft = new THREE.DirectionalLight(0xbacbe2, .55); soft.position.set(8, 6, -10); scene.add(soft);
  const asphalt = mat("#242b34", .98), pavement = mat("#777b7b", .98), curb = mat("#b7b5ac", .95);
  const soil = mat("#242b2d", 1);
  box(scene, [90, .12, 90], soil, [0, -2.17, 0], false);
  box(scene, [50, .14, 14], asphalt, [0, -2.17, -6.7], false);
  box(scene, [50, .18, 8.2], pavement, [0, -2.20, 3.35], false);
  box(scene, [50, .23, .42], curb, [0, -2.145, -.86], false);
  box(scene, [50, .035, .16], mat("#e6dfc7", .88), [0, -2.08, -13.52], false);
  for (let x = -22; x <= 22; x += 5.5) box(scene, [2.65, .025, .14], mat("#e2d8bd", .88), [x, -2.08, -6.65], false);
  // Quiet low-rise neighborhood with warm windows behind the stop.
  const wall = mat("#323d4a", .98), wallAlt = mat("#41434a", .98), frame = mat("#1b2936", .76);
  const lit = new THREE.MeshStandardMaterial({ color: "#e7bd79", emissive: "#e5a84f", emissiveIntensity: 1.25, roughness: .45 });
  const darkGlass = mat("#1b2b3a", .34, .08);
  const buildings = [
    { x: -13, z: -14, w: 8, h: 9, c: wall }, { x: -4.3, z: -15.5, w: 7.5, h: 7, c: wallAlt },
    { x: 5.2, z: -15, w: 9, h: 10.5, c: wall }, { x: 14.8, z: -14, w: 8, h: 8, c: wallAlt }
  ];
  for (const b of buildings) {
    box(scene, [b.w, b.h, .8], b.c, [b.x, -2.10 + b.h / 2, b.z], false);
    for (let row = 0; row < Math.floor((b.h - .7) / 1.65); row++) for (let col = 0; col < Math.floor((b.w - .7) / 1.55); col++) {
      const x = b.x - b.w / 2 + .95 + col * 1.55, y = -1.0 + row * 1.65;
      box(scene, [.74, .82, .045], (row + col) % 3 === 0 ? darkGlass : lit, [x, y, b.z + .42], false);
      box(scene, [.055, .88, .06], frame, [x - .39, y, b.z + .45], false);
    }
  }
  // A single tree and rubbish bin create a readable Argentine neighborhood corner.
  const trunk = mat("#4b352b", .98), leaves = mat("#263d38", .98), leavesLight = mat("#375248", .98);
  rod(scene, [-9.2, -2.11, .9], [-9.2, 1.35, .9], .19, trunk);
  for (let i = 0; i < 4; i++) sphere(scene, [1.8, 1.55, 1.7], i % 2 ? leaves : leavesLight, [-9.2 + Math.cos(i * Math.PI / 2) * .72, 1.6 + (i % 2) * .32, .9 + Math.sin(i * Math.PI / 2) * .65], 8);
  const bin = new THREE.Group(); bin.position.set(8.1, -2.11, .7); scene.add(bin);
  const metal = mat("#4a5559", .52, .45);
  const binBody = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, .88, 9), metal); binBody.position.y = .44; bin.add(binBody);
  const binLid = new THREE.Mesh(new THREE.CylinderGeometry(.39, .39, .10, 9), mat("#29353a", .42, .42)); binLid.position.y = .92; bin.add(binLid);
  // Neighborhood streetlamp: a warm pool of light highlights the three leads.
  const poleMat = mat("#303c42", .65, .52), poleX = -5.8;
  rod(scene, [poleX, -2.11, .2], [poleX, 5.1, .2], .095, poleMat);
  rod(scene, [poleX, 5.0, .2], [poleX + 1.1, 5.0, .2], .08, poleMat);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.34, .58, .24, 10), mat("#39464a", .6, .36)); shade.position.set(poleX + 1.1, 4.88, .2); scene.add(shade);
  sphere(scene, [.34, .18, .34], new THREE.MeshStandardMaterial({ color: "#ffe1a1", emissive: "#ffc66f", emissiveIntensity: 3.2 }), [poleX + 1.1, 4.72, .2], 10);
  const streetGlow = new THREE.PointLight(0xffc77f, 52, 18, 1.8); streetGlow.position.set(poleX + 1.0, 4.45, .2); scene.add(streetGlow);
  const fill = new THREE.PointLight(0xffddb1, 14, 15, 1.9); fill.position.set(0, 4.2, 3.4); scene.add(fill);
  // Bus shelter: four posts, roof, back panels, bench, route sign and a little advertising panel.
  const shelter = new THREE.Group(); shelter.position.set(0, -2.11, .05); scene.add(shelter);
  const steel = mat("#343f46", .44, .62), glass = new THREE.MeshStandardMaterial({ color: "#6f8b96", roughness: .3, metalness: .12, transparent: true, opacity: .24 });
  for (const x of [-3.55, -1.2, 1.2, 3.55]) rod(shelter, [x, 0, -.38], [x, 3.1, -.38], .065, steel);
  box(shelter, [7.55, .18, 1.95], mat("#253641", .5, .38), [0, 3.13, -.35], false);
  box(shelter, [7.2, .08, .06], mat("#d2b26c", .5, .5), [0, 3.02, .66], false);
  box(shelter, [7.2, 2.64, .035], glass, [0, 1.53, -.36], false);
  box(shelter, [.06, 2.55, .08], steel, [-2.35, 1.53, -.31], false);
  box(shelter, [.06, 2.55, .08], steel, [2.35, 1.53, -.31], false);
  // Bench and supports.
  box(shelter, [3.65, .16, .62], mat("#8b6847", .72), [0, .72, .30]);
  box(shelter, [3.65, .12, .10], mat("#5b493a", .72), [0, 1.24, -.02]);
  for (const x of [-1.45, 1.45]) box(shelter, [.12, .70, .12], steel, [x, .33, .25]);
  label(shelter, "PARADA", "LÍNEA 122", [-3.95, 2.45, -.28], [1.8, .82], "#193b4d");
  // Small side panels show a restrained Ingredora poster.
  label(shelter, "JUGÁ", "INGREDORA.COM", [3.80, 1.75, -.28], [1.0, 1.25], "#173a2d");
  // Sparse stars and moon, all static; no post-processing or expensive environment maps.
  const skyOrb = new THREE.Mesh(new THREE.SphereGeometry(1.08, 16, 12), new THREE.MeshBasicMaterial({ color: "#e6eaf0" }));
  skyOrb.position.set(12.2, 12.0, -21); scene.add(skyOrb);
  const starMat = new THREE.MeshBasicMaterial({ color: "#d6e3fa" });
  for (let i = 0; i < 42; i++) sphere(scene, [.055, .055, .055], starMat, [-19 + ((i * 37) % 38), 7 + ((i * 17) % 12), -22 + ((i * 13) % 8)], 6);
  const rigs = {
    bruno: createDiner("bruno", -2.9, 2.3, 0, false, true),
    tomas: createDiner("tomas", .05, 2.3, 0, false, true),
    valentina: createDiner("valentina", 3.0, 2.3, 0, false, true),
  };
  Object.values(rigs).forEach(rig => scene.add(rig.root));
  // Bruno keeps staring at a small illuminated phone held close to his chest.
  const phoneBody = box(rigs.bruno.rightArm, [.30, .52, .075], mat("#15191e", .28, .32), [.025, -.28, .12], false);
  phoneBody.rotation.x = -.08;
  box(rigs.bruno.rightArm, [.245, .425, .018], new THREE.MeshBasicMaterial({ color: "#87d9ef" }), [.025, -.275, .166], false);
  const bus = makeBus(scene);
  return { scene, rigs, bus, streetGlow, fill };
}

function cueById(pkg: BusStopPackage, id: string) { return pkg.dialogue.find(c => c.id === id); }
function cueStart(pkg: BusStopPackage, id: string, fallback: number) { return cueById(pkg, id)?.start ?? fallback; }
function cueEnd(pkg: BusStopPackage, id: string, fallback: number) { return cueById(pkg, id)?.end ?? fallback; }
function getCueAt(pkg: BusStopPackage, time: number) { return pkg.dialogue.find(c => time >= c.start && time <= c.end); }
function lastShotAt(pkg: BusStopPackage, time: number): BusStopShot {
  let shot: BusStopShot = "master";
  for (const cue of pkg.dialogue) { if (cue.start > time) break; shot = cue.shot; }
  return shot;
}
function cameraFor(shot: BusStopShot, camera: THREE.PerspectiveCamera) {
  const views: Record<BusStopShot, { p: [number, number, number]; target: [number, number, number]; fov: number }> = {
    exterior: { p: [0, 6.1, 27.5], target: [0, .0, -2.3], fov: 52 },
    master: { p: [0, 4.0, 17.8], target: [0, .05, -2.1], fov: 49 },
    bruno: { p: [-2.9, 2.6, 10.7], target: [-2.9, .65, 1.75], fov: 39 },
    tomas: { p: [.05, 2.6, 10.7], target: [.05, .65, 1.75], fov: 39 },
    valentina: { p: [3.0, 2.6, 10.7], target: [3.0, .65, 1.75], fov: 39 },
  };
  const v = views[shot]; camera.position.set(...v.p); camera.lookAt(...v.target); camera.fov = v.fov; camera.updateProjectionMatrix();
}
function updateCharacters(rigs: Record<"bruno" | "tomas" | "valentina", DinerRig>, cue: BusStopCue | undefined, time: number) {
  const values = Object.values(rigs);
  values.forEach((rig, index) => {
    const talking = rig.name === cue?.speaker, phase = index * .91;
    const targetLook = cue?.look === rig.name ? 0 : cue?.look ? (rig.x < rigs[cue.look as keyof typeof rigs]?.x ? .10 : -.10) : 0;
    rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, targetLook, .10);
    rig.head.rotation.x = talking ? Math.sin(time * 3.1 + phase) * .022 : Math.sin(time * .54 + phase) * .006;
    const syllables = cue?.text.toLowerCase().match(/[aeiouáéíóúü]/g)?.length ?? 2;
    const progress = cue ? Math.max(0, Math.min(.999, (time - cue.start) / Math.max(.08, cue.end - cue.start))) : 0;
    const mouthOpen = talking ? .04 + Math.pow(Math.max(0, Math.sin(progress * Math.max(2, syllables) * Math.PI * 2)), .8) * .64 : .026;
    rig.mouth.scale.set(1, mouthOpen, 1);
    // Calm, small gestures; Bruno keeps the phone hand raised.
    rig.leftArm.rotation.z = talking ? -.035 - Math.sin(time * 1.8 + phase) * .025 : -.012;
    rig.rightArm.rotation.z = rig.name === "bruno" ? -.24 : talking ? .035 + Math.sin(time * 1.7 + phase) * .025 : .012;
    rig.leftArm.rotation.x = talking ? .018 : 0;
    rig.rightArm.rotation.x = rig.name === "bruno" ? -.12 : talking ? -.018 : 0;
    if (rig.root.parent?.name !== "BusStopBus") rig.root.position.y = -1.92 + Math.sin(time * .65 + phase) * (rig.name === "bruno" ? .002 : .003);
  });
}

export async function renderEntrePartidasBusStopToWebM(pkg: BusStopPackage, onProgress: (p: BusStopProgress) => void, signal?: AbortSignal): Promise<Blob> {
  if (pkg.schemaVersion !== 1 || pkg.engineVersion !== "entre-partidas-bus-stop-1.0.0") throw new Error("Paquete de «La parada» incompatible.");
  if (pkg.width !== 720 || pkg.height !== 1280 || pkg.fps !== 24) throw new Error("«La parada» requiere 720×1280 a 24 FPS.");
  if (!pkg.dialogue.length || pkg.durationSeconds <= 0) throw new Error("El capítulo necesita diálogos y una duración válida.");
  if (!(await canEncodeVideo("vp9", { width: pkg.width, height: pkg.height, frameRate: pkg.fps }))) throw new Error("No hay codificador VP9 disponible para el render.");
  const totalFrames = Math.round(pkg.durationSeconds * pkg.fps);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(pkg.width, pkg.height, false); renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
  const world = makeWorld(), camera = new THREE.PerspectiveCamera(49, pkg.width / pkg.height, .1, 150);
  const canvas = document.createElement("canvas"); canvas.width = pkg.width; canvas.height = pkg.height;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No se pudo crear el lienzo del capítulo.");
  const target = new BufferTarget(), output = new Output({ format: new WebMOutputFormat(), target });
  const videoSource = new CanvasSource(canvas, { codec: "vp9", quality: new Quality({ bitrate: 8_000_000 }) });
  output.addVideoTrack(videoSource, { frameRate: pkg.fps });
  output.setMetadataTags({ title: pkg.title, artist: "Ingredora — Entre Partidas", date: new Date(pkg.createdAt) });
  const firstCue = pkg.dialogue[0];
  const busArrival = cueStart(pkg, "12-valentina-ahiviene", 35);
  const doorsAt = cueStart(pkg, "15-valentina-puertas", busArrival + 8);
  const boardAt = cueStart(pkg, "16-tomas-vamos", doorsAt + 1.2);
  const boardEnd = cueEnd(pkg, "17-bruno-yavoy", boardAt + 3.0) + .18;
  const departAt = boardEnd + .42;
  const stopX = 2.25, stopZ = -6.0;
  const initialTomas = world.rigs.tomas.root.position.clone();
  const initialValentina = world.rigs.valentina.root.position.clone();
  const finalTomas = new THREE.Vector3(.70, -1.70, stopZ + .72);
  const finalValentina = new THREE.Vector3(1.56, -1.70, stopZ + .72);
  let started = false;
  try {
    await output.start(); started = true;
    for (let frame = 0; frame < totalFrames; frame++) {
      if (signal?.aborted) throw new Error("Render cancelado.");
      const time = frame / pkg.fps, cue = getCueAt(pkg, time);
      // Keep the previous shot through silence. Camera changes only when a new spoken line begins.
      const shot: BusStopShot = time < 3.2 ? "exterior" : time >= (firstCue?.start ?? 3.2) ? lastShotAt(pkg, time) : "exterior";
      world.rigs.bruno.root.position.y = -1.92 + Math.sin(time * .7) * .002;
      const arrivalProgress = ease((time - (busArrival - 3.15)) / 3.25);
      world.bus.root.position.x = lerp(-19, stopX, arrivalProgress);
      world.bus.root.position.z = stopZ;
      // The bus waits with its headlights on; the double door opens when Valentina points it out.
      const doorOpen = ease((time - doorsAt) / .75) * (1 - ease((time - (boardEnd + .14)) / .48));
      world.bus.doorLeft.position.x = -1.88 - doorOpen * .52;
      world.bus.doorRight.position.x = -.98 + doorOpen * .52;
      world.bus.headlights.forEach((light, i) => { light.intensity = 11.5 + Math.sin(time * 1.4 + i) * .25; });
      // Tomás and Valentina walk toward the open doors. A slight body bob keeps the movement alive.
      if (time >= boardAt && time < boardEnd && !world.bus.boarded) {
        const p = ease((time - boardAt) / Math.max(.1, boardEnd - boardAt));
        world.rigs.tomas.root.position.lerpVectors(initialTomas, finalTomas, p);
        world.rigs.valentina.root.position.lerpVectors(initialValentina, finalValentina, p);
        world.rigs.tomas.root.rotation.y = lerp(0, Math.PI, p);
        world.rigs.valentina.root.rotation.y = lerp(0, Math.PI, p);
        world.rigs.tomas.root.position.y += Math.sin(time * 9) * .028 * (1 - p);
        world.rigs.valentina.root.position.y += Math.sin(time * 9 + .8) * .028 * (1 - p);
      }
      if (time >= boardEnd && !world.bus.boarded) {
        world.scene.updateMatrixWorld(true); world.bus.root.updateMatrixWorld(true);
        world.bus.root.attach(world.rigs.tomas.root); world.bus.root.attach(world.rigs.valentina.root);
        world.bus.boarded = true;
      }
      // The bus pulls away just after both passengers get on, leaving Bruno at the curb.
      if (time >= departAt) world.bus.root.position.x = lerp(stopX, 22, ease((time - departAt) / 3.1));
      else if (time < departAt) world.bus.root.position.x = lerp(-19, stopX, arrivalProgress);
      updateCharacters(world.rigs, cue, time);
      cameraFor(shot, camera);
      if (time < 3.2) {
        const p = ease(time / 3.2);
        camera.position.z = lerp(29.5, 27.5, p);
        camera.lookAt(0, lerp(.15, 0, p), -2.3);
      }
      renderer.render(world.scene, camera);
      ctx.drawImage(renderer.domElement, 0, 0, pkg.width, pkg.height);
      const vignette = ctx.createRadialGradient(360, 540, 260, 360, 650, 960);
      vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(2,7,15,.25)");
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, pkg.width, pkg.height);
      drawCaptions(ctx, pkg, time); drawBranding(ctx, pkg, time);
      await videoSource.add(time, 1 / pkg.fps);
      if (frame % 8 === 0 || frame === totalFrames - 1) onProgress({ frame: frame + 1, totalFrames, percent: Math.round((frame + 1) / totalFrames * 100) });
    }
    videoSource.close(); await output.finalize();
    const buffer = target.buffer; if (!buffer?.byteLength) throw new Error("El render terminó sin generar el WebM.");
    return new Blob([buffer], { type: await output.getMimeType() });
  } catch (error) {
    if (started && output.state !== "finalized" && output.state !== "canceled") await output.cancel().catch(() => undefined);
    throw error instanceof Error ? error : new Error("Falló el render de «La parada».");
  } finally {
    renderer.dispose();
    world.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const material = object.material;
        const materials = Array.isArray(material) ? material : [material];
        materials.forEach(m => { if ("map" in m && m.map) m.map.dispose(); m.dispose(); });
      }
    });
  }
}

function drawCaptions(ctx: CanvasRenderingContext2D, pkg: BusStopPackage, time: number) {
  const cue = getCueAt(pkg, time); if (!cue) return;
  const names: Record<DinnerSpeaker, string> = { bruno: "BRUNO", martina: "MARTINA", tomas: "TOMÁS", valentina: "VALENTINA", ernesto: "ERNESTO" };
  const s = pkg.width / 720, maxWidth = pkg.width * .88; ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
  const font = 27 * s; ctx.font = "800 " + font + "px Arial";
  const lines: string[] = []; let line = "";
  for (const word of cue.text.split(/\s+/)) { const next = line ? line + " " + word : word; if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line);
  const shown = lines.length <= 2 ? lines : [lines.slice(0, Math.ceil(lines.length / 2)).join(" "), lines.slice(Math.ceil(lines.length / 2)).join(" ")];
  const h = (32 + shown.length * 36 + 22) * s, y = pkg.height - h - 30 * s;
  ctx.fillStyle = "rgba(10,22,36,.91)"; ctx.beginPath(); ctx.roundRect(pkg.width * .055, y, pkg.width * .89, h, 12 * s); ctx.fill();
  ctx.fillStyle = "#f0cf89"; ctx.font = "900 " + (17 * s) + "px Arial"; ctx.fillText(names[cue.speaker], pkg.width / 2, y + 18 * s);
  ctx.fillStyle = "#fffaf0"; ctx.font = "800 " + font + "px Arial"; shown.forEach((row, i) => ctx.fillText(row, pkg.width / 2, y + (48 + i * 36) * s, maxWidth));
  ctx.restore();
}
function drawBranding(ctx: CanvasRenderingContext2D, pkg: BusStopPackage, time: number) {
  const w = pkg.width, h = pkg.height, s = w / 720;
  if (time < 2.25) {
    const alpha = Math.max(0, Math.min(1, time / .28, (2.25 - time) / .36)); ctx.save(); ctx.globalAlpha = alpha;
    const pw = w * .90, ph = h * .155, x = (w - pw) / 2, y = h * .045;
    ctx.shadowColor = "rgba(0,0,0,.44)"; ctx.shadowBlur = 24 * s;
    const gradient = ctx.createLinearGradient(x, y, x + pw, y + ph); gradient.addColorStop(0, "rgba(18,39,59,.97)"); gradient.addColorStop(1, "rgba(28,55,70,.96)");
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.roundRect(x, y, pw, ph, 20 * s); ctx.fill(); ctx.shadowBlur = 0;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#f0cf89"; ctx.font = "900 " + Math.round(16 * s) + "px Arial"; ctx.fillText("INGREDORA ORIGINALS", w / 2, y + ph * .17);
    ctx.fillStyle = "#fffaf0"; ctx.font = "900 " + Math.round(54 * s) + "px Arial Black,Arial"; ctx.fillText("ENTRE PARTIDAS", w / 2, y + ph * .49);
    ctx.fillStyle = "#f0cf89"; ctx.font = "900 " + Math.round(22 * s) + "px Arial"; ctx.fillText("CAPÍTULO " + (pkg.chapterNumber ?? 9), w / 2, y + ph * .82); ctx.restore();
  }
  if (time >= pkg.endCardStart) {
    const alpha = Math.min(1, (time - pkg.endCardStart) / .48); ctx.save(); ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0b1929"); g.addColorStop(.52, "#173449"); g.addColorStop(1, "#08131f");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = "rgba(240,207,137,.68)"; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(w * .10, h * .22, w * .80, h * .56, 22 * s); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#f0cf89"; ctx.font = "900 " + Math.round(22 * s) + "px Arial"; ctx.fillText("INGREDORA ORIGINALS", w / 2, h * .31);
    ctx.fillStyle = "#fffaf0"; ctx.font = "900 " + Math.round(58 * s) + "px Arial Black,Arial"; ctx.fillText("ENTRE PARTIDAS", w / 2, h * .42);
    ctx.fillStyle = "#f0cf89"; ctx.font = "800 " + Math.round(24 * s) + "px Arial"; ctx.fillText("Una serie de Ingredora", w / 2, h * .50);
    ctx.fillStyle = "#f5d792"; ctx.font = "900 " + Math.round(42 * s) + "px Arial"; ctx.fillText("ingredora.com", w / 2, h * .61);
    ctx.fillStyle = "#e8e2d5"; ctx.font = "700 " + Math.round(18 * s) + "px Arial"; ctx.fillText("Bruno · Tomás · Valentina", w / 2, h * .70);
    ctx.fillStyle = "rgba(232,226,213,.78)"; ctx.font = "600 " + Math.round(16 * s) + "px Arial"; ctx.fillText("Creado y producido por Ingredora", w / 2, h * .75); ctx.restore();
  }
}
