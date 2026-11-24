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
  const root = new THREE.Group(); root.name = "BusStopBus"; root.position.set(-19, -2.08, -3.0); root.scale.set(1.08, 1.40, 1.08); scene.add(root);
  const body = mat("#e3e3d7", .56), lower = mat("#183e50", .48), stripe = mat("#f0b94f", .48);
  const glass = new THREE.MeshStandardMaterial({ color: "#315064", roughness: .20, metalness: .12, transparent: true, opacity: .58, depthWrite: false, emissive: "#142b38", emissiveIntensity: .22 });
  const rubber = mat("#171a1c", .94), hub = mat("#8b9798", .36, .62), lamp = new THREE.MeshStandardMaterial({ color: "#fff0bd", emissive: "#ffd775", emissiveIntensity: 2.8 });
  box(root, [8.25, 2.65, 2.52], body, [0, 1.52, 0]);
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
  // Keep the base well below road/sidewalk tops: no coplanar surfaces can flicker in the establishing shot.
  box(scene, [90, .12, 90], soil, [0, -3.0, 0], false);
  box(scene, [50, .14, 14], asphalt, [0, -2.17, -6.7], false);
  box(scene, [50, .18, 8.2], pavement, [0, -2.20, 3.35], false);
  box(scene, [50, .23, .42], curb, [0, -2.145, -.86], false);
  box(scene, [50, .035, .16], mat("#e6dfc7", .88), [0, -2.08, -13.52], false);
  for (let x = -22; x <= 22; x += 5.5) box(scene, [2.65, .025, .14], mat("#e2d8bd", .88), [x, -2.08, -6.65], false);
  // Quiet low-rise neighborhood with warm windows behind the stop.
  const wall = mat("#b8ad9d", .98), wallAlt = mat("#9d9a91", .98);
  const facadeLight = mat("#d2c7b6", .94), facadeShadow = mat("#756f66", .96);
  const frame = mat("#514c46", .72), darkGlass = mat("#172b38", .30, .10);
  const lit = new THREE.MeshStandardMaterial({ color: "#d8b77e", emissive: "#d6a45d", emissiveIntensity: .72, roughness: .48 });
  const doorPaint = [mat("#34434a", .70), mat("#594638", .74), mat("#344d4b", .74), mat("#51453d", .74)];
  const brass = mat("#b89a61", .34, .72), balconyMetal = mat("#343d40", .48, .58);
  const buildings = [
    { x: -13, z: -14, w: 8, h: 9, c: wall }, { x: -4.3, z: -15.5, w: 7.5, h: 7, c: wallAlt },
    { x: 5.2, z: -15, w: 9, h: 10.5, c: wall }, { x: 14.8, z: -14, w: 8, h: 8, c: wallAlt }
  ];
  for (const [index, b] of buildings.entries()) {
    const baseY = -2.10, faceZ = b.z + .405;
    box(scene, [b.w, b.h, .8], b.c, [b.x, baseY + b.h / 2, b.z], false);
    // Building plinth, corner pilasters and a projecting roof cornice add depth to each street façade.
    box(scene, [b.w + .08, .22, .20], facadeShadow, [b.x, baseY + .12, faceZ + .10], false);
    box(scene, [b.w + .28, .20, .24], facadeLight, [b.x, baseY + b.h - .16, faceZ + .10], false);
    box(scene, [b.w + .16, .10, .18], facadeShadow, [b.x, baseY + b.h - .34, faceZ + .08], false);
    for (const side of [-1, 1]) {
      box(scene, [.20, b.h - .38, .16], facadeLight, [b.x + side * (b.w / 2 - .15), baseY + b.h / 2, faceZ + .10], false);
    }
    // Upper floors only: ground level is reserved for entrances, never windows.
    const upperFloors = Math.max(1, Math.floor((b.h - 2.7) / 1.8));
    const columns = Math.max(2, Math.floor((b.w - 1.0) / 1.85));
    const spacing = (b.w - 1.6) / columns;
    for (let floor = 0; floor < upperFloors; floor++) {
      const y = baseY + 3.85 + floor * 1.8;
      for (let col = 0; col < columns; col++) {
        const x = b.x - ((columns - 1) * spacing) / 2 + col * spacing;
        const windowMaterial = (floor + col + index) % 3 === 0 ? lit : darkGlass;
        box(scene, [1.02, 1.22, .12], facadeShadow, [x, y, faceZ + .075], false);
        box(scene, [.86, 1.04, .055], windowMaterial, [x, y, faceZ + .15], false);
        box(scene, [.055, 1.12, .07], frame, [x - .45, y, faceZ + .185], false);
        box(scene, [.055, 1.12, .07], frame, [x + .45, y, faceZ + .185], false);
        box(scene, [.94, .075, .10], facadeLight, [x, y - .56, faceZ + .21], false);
        box(scene, [.94, .065, .08], facadeLight, [x, y + .56, faceZ + .19], false);
        box(scene, [.035, 1.0, .045], frame, [x, y, faceZ + .205], false);
        if ((floor + col + index) % 2 === 0 && floor < 2) {
          // Small projecting balconies with metal balustrades, not flat painted-on window boxes.
          box(scene, [1.48, .10, .58], facadeShadow, [x, y - .66, faceZ + .36], false);
          box(scene, [1.46, .055, .055], balconyMetal, [x, y - .12, faceZ + .63], false);
          for (let rail = 0; rail < 9; rail++) {
            box(scene, [.035, .52, .035], balconyMetal, [x - .68 + rail * .17, y - .39, faceZ + .63], false);
          }
        }
      }
      box(scene, [b.w - .35, .09, .12], facadeLight, [b.x, y - 1.08, faceZ + .08], false);
    }
    // Opaque street-level entry: solid door leaf, recessed panels, brass hardware and a shallow canopy.
    const entryX = b.x + (index % 2 === 0 ? -.38 : .38);
    const doorFrame = mat("#d7cbb8", .90);
    box(scene, [1.38, 2.18, .18], facadeShadow, [entryX, baseY + 1.10, faceZ + .10], false);
    box(scene, [1.17, 2.05, .16], doorFrame, [entryX, baseY + 1.08, faceZ + .19], false);
    box(scene, [.96, 1.88, .10], doorPaint[index], [entryX, baseY + 1.00, faceZ + .27], false);
    box(scene, [.72, .70, .035], facadeShadow, [entryX, baseY + 1.36, faceZ + .335], false);
    box(scene, [.60, .56, .035], doorPaint[index], [entryX, baseY + 1.36, faceZ + .36], false);
    box(scene, [.72, .48, .035], facadeShadow, [entryX, baseY + .67, faceZ + .335], false);
    box(scene, [.60, .34, .035], doorPaint[index], [entryX, baseY + .67, faceZ + .36], false);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 8), brass);
    handle.position.set(entryX + .32, baseY + 1.02, faceZ + .405); scene.add(handle);
    box(scene, [1.64, .12, .62], facadeShadow, [entryX, baseY + 2.18, faceZ + .37], false);
    box(scene, [1.52, .08, .56], facadeLight, [entryX, baseY + 2.27, faceZ + .37], false);
    box(scene, [1.55, .13, .45], facadeShadow, [entryX, baseY + .08, faceZ + .35], false);
    for (const side of [-1, 1]) {
      const sconce = new THREE.Mesh(new THREE.SphereGeometry(.085, 8, 8), new THREE.MeshStandardMaterial({ color: "#f3d49c", emissive: "#e6ae5f", emissiveIntensity: 1.6 }));
      sconce.position.set(entryX + side * .92, baseY + 1.70, faceZ + .20); scene.add(sconce);
    }
    // A narrow address plaque gives each entrance a lived-in, finished street presence.
    box(scene, [.44, .19, .045], facadeShadow, [entryX, baseY + 2.53, faceZ + .18], false);
    box(scene, [.38, .12, .03], brass, [entryX, baseY + 2.53, faceZ + .215], false);
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
  // Only a simple free-standing bench remains at the stop; no roof, railings, glass or stop-sign structure.
  const bench = new THREE.Group(); bench.position.set(0, -2.11, .05); scene.add(bench);
  const benchWood = mat("#8b6847", .72), benchMetal = mat("#343f46", .48, .58);
  box(bench, [3.65, .14, .58], benchWood, [0, .72, .30]);
  for (let slat = 0; slat < 3; slat++) {
    box(bench, [3.58, .045, .13], mat(slat === 1 ? "#9a7551" : "#79583c", .78), [0, .63 + slat * .085, .30 + (slat - 1) * .17], false);
  }
  for (const x of [-1.42, 1.42]) {
    box(bench, [.10, .72, .13], benchMetal, [x, .34, .25]);
    box(bench, [.52, .08, .72], benchMetal, [x, .055, .27]);
  }
  // Sparse stars and moon, all static; no post-processing or expensive environment maps.
  const skyOrb = new THREE.Mesh(new THREE.SphereGeometry(1.08, 16, 12), new THREE.MeshBasicMaterial({ color: "#e6eaf0" }));
  skyOrb.position.set(12.2, 12.0, -21); scene.add(skyOrb);
  const starMat = new THREE.MeshBasicMaterial({ color: "#d6e3fa" });
  for (let i = 0; i < 42; i++) sphere(scene, [.055, .055, .055], starMat, [-19 + ((i * 37) % 38), 7 + ((i * 17) % 12), -22 + ((i * 13) % 8)], 6);
  const rigs = {
    bruno: createDiner("bruno", -2.9, 2.3, 0, false, true),
    tomas: createDiner("tomas", .05, 2.3, 0, false, true, false, false, false, true),
    valentina: createDiner("valentina", 3.0, 2.3, 0, false, true, false, false, true, true),
  };
  Object.values(rigs).forEach(rig => scene.add(rig.root));
  // Bruno keeps his phone in the right hand, with the arm lowered and held clear of his torso.
  rigs.bruno.rightArm.position.x += .08;
  rigs.bruno.rightArm.rotation.z = .12;
  const phone = new THREE.Group();
  phone.position.set(.02, -.81, .27); phone.rotation.set(-.035, 0, -.035); rigs.bruno.rightArm.add(phone);
  box(phone, [.29, .50, .055], mat("#101820", .28, .30), [0, 0, 0], false);
  const phoneCanvas = document.createElement("canvas"); phoneCanvas.width = 256; phoneCanvas.height = 512;
  const phoneCtx = phoneCanvas.getContext("2d");
  if (!phoneCtx) throw new Error("No se pudo crear la pantalla del celular de Bruno.");
  const phoneGradient = phoneCtx.createLinearGradient(0, 0, 0, 512);
  phoneGradient.addColorStop(0, "#19394a"); phoneGradient.addColorStop(1, "#0b202c");
  phoneCtx.fillStyle = phoneGradient; phoneCtx.fillRect(0, 0, 256, 512);
  phoneCtx.fillStyle = "#a8d5d6"; phoneCtx.font = "600 18px Arial"; phoneCtx.textAlign = "center";
  phoneCtx.fillText("LUN · LÍNEA 122", 128, 48);
  phoneCtx.fillStyle = "#fff5dc"; phoneCtx.font = "900 62px Arial"; phoneCtx.fillText("23:48", 128, 150);
  phoneCtx.fillStyle = "#d0e5e5"; phoneCtx.font = "700 23px Arial"; phoneCtx.fillText("PRÓXIMO COLECTIVO", 128, 215);
  phoneCtx.fillStyle = "#f0c878"; phoneCtx.font = "900 42px Arial"; phoneCtx.fillText("23:50", 128, 276);
  phoneCtx.fillStyle = "#a8d5d6"; phoneCtx.font = "600 18px Arial"; phoneCtx.fillText("DESAFÍO DIARIO", 128, 366);
  phoneCtx.fillStyle = "#fff5dc"; phoneCtx.font = "800 24px Arial"; phoneCtx.fillText("INGREDORA", 128, 404);
  phoneCtx.fillStyle = "#7bc4c8"; phoneCtx.fillRect(84, 454, 88, 5);
  const phoneTexture = new THREE.CanvasTexture(phoneCanvas); phoneTexture.colorSpace = THREE.SRGBColorSpace;
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(.258, .462), new THREE.MeshBasicMaterial({ map: phoneTexture, toneMapped: false }));
  phoneScreen.position.set(0, 0, .029); phone.add(phoneScreen);
  box(phone, [.07, .008, .006], mat("#9fb6be", .24), [0, -.232, .032], false);
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
type WalkMotion = { phase: number; intensity: number; yaw: number };
function updateCharacters(
  rigs: Record<"bruno" | "tomas" | "valentina", DinerRig>,
  cue: BusStopCue | undefined,
  time: number,
  walking: Partial<Record<"tomas" | "valentina", WalkMotion>> = {},
) {
  const values = Object.values(rigs);
  values.forEach((rig, index) => {
    const talking = rig.name === cue?.speaker, idlePhase = index * .91;
    const motion = rig.name === "tomas" || rig.name === "valentina" ? walking[rig.name] : undefined;
    const targetLook = cue?.look === rig.name ? 0 : cue?.look ? (rig.x < rigs[cue.look as keyof typeof rigs]?.x ? .10 : -.10) : 0;
    rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, targetLook, .10);
    rig.head.rotation.x = talking ? Math.sin(time * 3.1 + idlePhase) * .022 : Math.sin(time * .54 + idlePhase) * .006;
    const syllables = cue?.text.toLowerCase().match(/[aeiouáéíóúü]/g)?.length ?? 2;
    const progress = cue ? Math.max(0, Math.min(.999, (time - cue.start) / Math.max(.08, cue.end - cue.start))) : 0;
    const mouthOpen = talking ? .04 + Math.pow(Math.max(0, Math.sin(progress * Math.max(2, syllables) * Math.PI * 2)), .8) * .64 : .026;
    rig.mouth.scale.set(1, mouthOpen, 1);
    if (motion && motion.intensity > .01) {
      const swing = Math.sin(motion.phase) * motion.intensity;
      if (rig.leftLeg) rig.leftLeg.rotation.x = swing * .28;
      if (rig.rightLeg) rig.rightLeg.rotation.x = -swing * .28;
      rig.leftArm.rotation.x = -swing * .10;
      rig.rightArm.rotation.x = swing * .10;
      rig.leftArm.rotation.z = -.015;
      rig.rightArm.rotation.z = rig.name === "bruno" ? -.08 : .015;
      if (rig.root.parent?.name !== "BusStopBus") rig.root.rotation.y = motion.yaw;
    } else {
      if (rig.leftLeg) rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, .22);
      if (rig.rightLeg) rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, .22);
      rig.leftArm.rotation.z = talking ? -.035 - Math.sin(time * 1.8 + idlePhase) * .025 : -.012;
      rig.rightArm.rotation.z = rig.name === "bruno" ? -.08 : talking ? .035 + Math.sin(time * 1.7 + idlePhase) * .025 : .012;
      rig.leftArm.rotation.x = talking ? .018 : 0;
      rig.rightArm.rotation.x = rig.name === "bruno" ? .035 : talking ? -.018 : 0;
      if (rig.root.parent?.name !== "BusStopBus") rig.root.position.y = -1.92 + Math.sin(time * .65 + idlePhase) * (rig.name === "bruno" ? .002 : .003);
    }
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
  const stopX = 2.25, stopZ = -3.0;
  const initialTomas = world.rigs.tomas.root.position.clone();
  const initialValentina = world.rigs.valentina.root.position.clone();
  // Each passenger gets an individual curved route and reaches the doorway in single file.
  const finalTomas = new THREE.Vector3(.80, -1.17, stopZ + .68);
  const finalValentina = new THREE.Vector3(1.16, -1.17, stopZ + .25);
  const tomasPath = new THREE.CatmullRomCurve3([
    initialTomas.clone(),
    new THREE.Vector3(-.10, -1.92, 1.15),
    new THREE.Vector3(.10, -1.92, .15),
    new THREE.Vector3(.43, -1.78, -.85),
    new THREE.Vector3(.74, -1.52, -1.95),
    finalTomas.clone(),
  ]);
  const valentinaPath = new THREE.CatmullRomCurve3([
    initialValentina.clone(),
    new THREE.Vector3(2.86, -1.92, 1.20),
    new THREE.Vector3(2.45, -1.92, -.05),
    new THREE.Vector3(1.94, -1.78, -.95),
    new THREE.Vector3(1.39, -1.52, -2.15),
    finalValentina.clone(),
  ]);
  const tomasWalkStart = doorsAt + .28;
  const valentinaWalkStart = doorsAt + 1.02;
  const walkFinish = boardEnd + .22;
  const tomasWalkDuration = Math.max(2.8, walkFinish - tomasWalkStart);
  const valentinaWalkDuration = Math.max(2.5, walkFinish - valentinaWalkStart);
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
      // Tomás goes first; Valentina follows half a beat later. Both use a curved path, alternating leg/arm swings and a visible step-up.
      const walking: Partial<Record<"tomas" | "valentina", WalkMotion>> = {};
      const movePassenger = (rig: DinerRig, path: THREE.CatmullRomCurve3, start: number, duration: number) => {
        const elapsed = time - start;
        const p = ease(elapsed / Math.max(.1, duration));
        const position = path.getPointAt(Math.max(0, Math.min(1, p)));
        const tangent = path.getTangentAt(Math.max(0, Math.min(.999, p))).normalize();
        const blend = Math.min(ease(elapsed / .34), 1 - ease((duration - elapsed) / .40));
        const phase = Math.max(0, elapsed) * 5.4;
        position.y += Math.abs(Math.sin(phase * 2)) * .012 * Math.max(0, blend);
        rig.root.position.copy(position);
        rig.root.scale.setScalar(lerp(1, .84, p));
        rig.root.rotation.y = Math.atan2(tangent.x, tangent.z);
        if (elapsed >= 0 && elapsed <= duration + .02 && blend > .01) {
          walking[rig.name as "tomas" | "valentina"] = { phase, intensity: blend, yaw: rig.root.rotation.y };
        }
      };
      if (!world.bus.boarded && time >= tomasWalkStart && time < walkFinish) {
        movePassenger(world.rigs.tomas, tomasPath, tomasWalkStart, tomasWalkDuration);
      }
      if (!world.bus.boarded && time >= valentinaWalkStart && time < walkFinish) {
        movePassenger(world.rigs.valentina, valentinaPath, valentinaWalkStart, valentinaWalkDuration);
      }
      if (time >= boardEnd && !world.bus.boarded) {
        world.rigs.tomas.root.position.copy(finalTomas);
        world.rigs.tomas.root.scale.setScalar(.84);
        world.rigs.valentina.root.position.copy(finalValentina);
        world.rigs.valentina.root.scale.setScalar(.84);
        world.scene.updateMatrixWorld(true); world.bus.root.updateMatrixWorld(true);
        world.bus.root.attach(world.rigs.tomas.root); world.bus.root.attach(world.rigs.valentina.root);
        world.bus.boarded = true;
      }
      // The bus pulls away only after both passengers have reached the inside of the open doorway.
      if (time >= departAt) world.bus.root.position.x = lerp(stopX, 22, ease((time - departAt) / 3.1));
      else if (time < departAt) world.bus.root.position.x = lerp(-19, stopX, arrivalProgress);
      updateCharacters(world.rigs, cue, time, walking);
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
