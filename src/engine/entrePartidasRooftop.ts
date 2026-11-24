import * as THREE from "three";
import { BufferTarget, CanvasSource, Output, Quality, WebMOutputFormat, canEncodeVideo } from "mediabunny";
import { createDiner, type DinnerSpeaker, type DinerRig } from "./entrePartidasDinner";

type LeadId = "bruno" | "martina" | "ernesto";
export type RooftopShot = "exterior" | "wide" | "pair" | "bruno" | "martina" | "ernesto" | "group" | "phone" | "ranking";
export type RooftopCue = {
  id: string;
  speaker: LeadId;
  text: string;
  start: number;
  end: number;
  look?: LeadId;
  shot: RooftopShot;
};
export type RooftopPackage = {
  schemaVersion: 1;
  engineVersion: "entre-partidas-rooftop-1.0.0";
  id: string;
  title: string;
  createdAt: string;
  fps: number;
  width: number;
  height: number;
  durationSeconds: number;
  endCardStart: number;
  chapterNumber: number;
  dialogue: RooftopCue[];
};
export type RooftopProgress = { frame: number; totalFrames: number; percent: number };

const ROOF_Y = 17.36;
const mat = (color: string, roughness = .82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const box = (parent: THREE.Object3D, size: [number, number, number], material: THREE.Material, pos: [number, number, number], cast = true) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};
const sphere = (parent: THREE.Object3D, size: [number, number, number], material: THREE.Material, pos: [number, number, number], segments = 12) => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(.5, segments, 10), material);
  mesh.position.set(...pos);
  mesh.scale.set(...size);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};
const texture = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 256) => {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear una textura de Entre Partidas.");
  draw(ctx, w, h);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
};

function createPhone(label: string) {
  const group = new THREE.Group();
  const shell = mat("#171b21", .28, .22);
  const glass = mat("#061b20", .16, .12);
  box(group, [.245, .425, .045], shell, [0, 0, 0]);
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 256; screenCanvas.height = 448;
  const ctx = screenCanvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear la pantalla del celular.");
  const gradient = ctx.createLinearGradient(0, 0, 256, 448);
  gradient.addColorStop(0, "#143e32"); gradient.addColorStop(1, "#0b241e");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 448);
  ctx.fillStyle = "#d7e8ad"; ctx.font = "900 22px Arial"; ctx.textAlign = "center";
  ctx.fillText("INGREDORA", 128, 45);
  ctx.fillStyle = "#fff8e8"; ctx.font = "800 13px Arial"; ctx.fillText("DESAFÍO", 128, 78);
  ctx.fillStyle = "#2a5847"; ctx.fillRect(18, 98, 220, 105);
  ctx.fillStyle = "#f0d18b"; ctx.font = "700 12px Arial"; ctx.fillText("¿QUÉ INGREDIENTE", 128, 135);
  ctx.fillText("RECONOCÉS?", 128, 153);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i === 1 ? "#b6d58e" : "#e6e2d5";
    ctx.fillRect(22, 220 + i * 46, 212, 34);
    ctx.fillStyle = "#18382d"; ctx.font = "700 11px Arial"; ctx.textAlign = "left";
    ctx.fillText(["Harina de maíz", "Maltodextrina", "Jarabe de maíz", "Conservantes"][i], 34, 242 + i * 46);
  }
  ctx.fillStyle = "#f0d18b"; ctx.font = "800 13px Arial"; ctx.textAlign = "center";
  ctx.fillText(label, 128, 424);
  const map = new THREE.CanvasTexture(screenCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(.216, .385), new THREE.MeshBasicMaterial({ map, toneMapped: false }));
  screen.position.set(0, .008, .024);
  group.add(screen);
  box(group, [.055, .008, .008], glass, [0, -.201, .025], false);
  sphere(group, [.018, .018, .01], mat("#88969a", .3), [0, .204, .025], 8);
  return group;
}

const shirtBase: Record<DinnerSpeaker, string> = {
  bruno: "#c46a43", martina: "#f4cbd6", tomas: "#527c78", valentina: "#47788a", ernesto: "#718064"
};
const hairBase: Record<DinnerSpeaker, string> = {
  bruno: "#30241f", martina: "#30201c", tomas: "#4b3328", valentina: "#211b1a", ernesto: "#8b8a82"
};
const pantsBase: Record<DinnerSpeaker, string> = {
  bruno: "#35414a", martina: "#8eaabd", tomas: "#35414a", valentina: "#35414a", ernesto: "#4b5148"
};

type Outfit = { shirt: string; pants: string; hair: string; accent: string; style: "plain" | "jacket" | "vest" | "tie" | "scarf" | "stripes" | "skirt"; female?: boolean };
function dressRig(rig: DinerRig, archetype: DinnerSpeaker, outfit: Outfit) {
  const shirt = shirtBase[archetype].replace("#", "").toLowerCase();
  const hair = hairBase[archetype].replace("#", "").toLowerCase();
  const pants = pantsBase[archetype].replace("#", "").toLowerCase();
  rig.root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      const color = material.color.getHexString().toLowerCase();
      if (color === shirt) material.color.set(outfit.shirt);
      else if (color === hair) material.color.set(outfit.hair);
      else if (color === pants) material.color.set(outfit.pants);
    }
  });
  const detail = mat(outfit.accent, .78);
  if (outfit.style === "jacket") {
    box(rig.root, [.20, .88, .045], detail, [-.27, 2.08, .274], false);
    box(rig.root, [.20, .88, .045], detail, [.27, 2.08, .274], false);
  } else if (outfit.style === "vest") {
    box(rig.root, [.57, .78, .045], detail, [0, 2.06, .278], false);
    box(rig.root, [.11, .20, .052], mat("#f4ead5"), [0, 1.62, .30], false);
  } else if (outfit.style === "tie") {
    box(rig.root, [.11, .48, .038], detail, [0, 2.03, .292], false);
    box(rig.root, [.18, .13, .04], detail, [0, 2.30, .294], false);
  } else if (outfit.style === "scarf") {
    box(rig.root, [.52, .16, .055], detail, [0, 2.60, .29], false);
    box(rig.root, [.13, .42, .05], detail, [.16, 2.35, .30], false);
  } else if (outfit.style === "stripes") {
    box(rig.root, [.72, .075, .035], detail, [0, 2.30, .28], false);
    box(rig.root, [.72, .075, .035], detail, [0, 1.93, .28], false);
  } else if (outfit.style === "skirt") {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.47, .63, .62, 6), detail);
    skirt.position.set(0, 1.03, .06);
    skirt.castShadow = false; skirt.receiveShadow = false; rig.root.add(skirt);
  }
}

function addCrowdAccessory(rig: DinerRig, index: number, accent: string) {
  if (index % 7 === 0) {
    const cap = mat(accent, .9);
    box(rig.head, [.84, .16, .78], cap, [0, .42, -.02], false);
    box(rig.head, [.48, .08, .28], cap, [0, .36, .30], false);
  } else if (index % 7 === 2) {
    box(rig.root, [.10, .62, .035], mat(accent), [0, 1.42, .305], false);
    box(rig.root, [.42, .09, .04], mat("#f0e7d5"), [0, 1.72, .31], false);
  } else if (index % 7 === 4) {
    sphere(rig.head, [.27, .23, .24], mat(accent), [0, .43, -.30], 8);
  }
}

function createCrowd(scene: THREE.Scene) {
  const specs: Array<[number, number, DinnerSpeaker, number, number, number]> = [
    [-5.25, -5.75, "tomas", 0, .70, 0], [-4.10, -6.15, "martina", 1, .72, 0], [-4.80, -6.90, "bruno", 2, .72, 0],
    [4.05, -5.80, "valentina", 3, .70, 1], [5.20, -6.25, "ernesto", 5, .70, 1], [4.70, -7.00, "tomas", 9, .73, 1],
    [-5.30, -8.75, "valentina", 14, .71, 2], [-4.15, -9.35, "bruno", 6, .72, 2], [-4.90, -10.10, "martina", 7, .70, 2],
    [4.10, -8.85, "ernesto", 13, .73, 3], [5.20, -9.40, "martina", 8, .70, 3], [4.80, -10.15, "valentina", 10, .70, 3],
    [-4.70, -11.60, "martina", 12, .70, 4], [-3.50, -12.40, "tomas", 15, .73, 4], [-4.60, -13.20, "valentina", 19, .72, 4],
    [-1.90, -11.60, "bruno", 11, .72, 5], [-.80, -12.50, "tomas", 16, .72, 5], [-1.60, -13.20, "martina", 17, .70, 5],
    [1.00, -11.60, "valentina", 21, .70, 6], [2.00, -12.50, "ernesto", 18, .73, 6], [1.20, -13.20, "bruno", 20, .71, 6],
    [3.60, -11.60, "bruno", 23, .72, 7], [4.60, -12.40, "tomas", 4, .70, 7], [3.80, -13.20, "martina", 22, .70, 7]
  ];
  const clusterCenters: Array<[number, number]> = [
    [-4.72, -6.25], [4.65, -6.35], [-4.78, -9.40], [4.70, -9.45],
    [-4.25, -12.40], [-1.42, -12.42], [1.42, -12.42], [4.00, -12.40]
  ];
  const outfits: Outfit[] = [
    { shirt: "#557e87", pants: "#303b48", hair: "#4b3328", accent: "#d5c6a6", style: "jacket" },
    { shirt: "#7b5465", pants: "#b8aa93", hair: "#56382c", accent: "#e6cda3", style: "scarf", female: true },
    { shirt: "#c19a58", pants: "#4b4d48", hair: "#30241f", accent: "#f0e9dc", style: "vest" },
    { shirt: "#4d718f", pants: "#343e4a", hair: "#211b1a", accent: "#d6c3a6", style: "stripes", female: true },
    { shirt: "#9b6850", pants: "#41434a", hair: "#5d3b2e", accent: "#e3d8c5", style: "tie" },
    { shirt: "#647d58", pants: "#a99c85", hair: "#8b8a82", accent: "#e2d6bc", style: "plain" },
    { shirt: "#5b668d", pants: "#3f4852", hair: "#2c211c", accent: "#b4c5d2", style: "jacket" },
    { shirt: "#a86d79", pants: "#39424b", hair: "#30201c", accent: "#f0d6c7", style: "skirt", female: true },
    { shirt: "#c08b46", pants: "#34444a", hair: "#5a3329", accent: "#eee1c9", style: "vest", female: true },
    { shirt: "#557f72", pants: "#c4b59c", hair: "#4b3328", accent: "#e8dfc9", style: "stripes" },
    { shirt: "#765b83", pants: "#424a55", hair: "#211b1a", accent: "#ddcfae", style: "skirt", female: true },
    { shirt: "#b65e4e", pants: "#39424a", hair: "#30241f", accent: "#e6d5b6", style: "jacket" },
    { shirt: "#6386a0", pants: "#a99b84", hair: "#30201c", accent: "#f2e9d9", style: "scarf", female: true },
    { shirt: "#8d8668", pants: "#3f4843", hair: "#8b8a82", accent: "#d4c39b", style: "plain" },
    { shirt: "#875b54", pants: "#323d46", hair: "#211b1a", accent: "#d8b56d", style: "skirt", female: true },
    { shirt: "#527e86", pants: "#3d4650", hair: "#6a503a", accent: "#e3d6bf", style: "tie" },
    { shirt: "#bd7857", pants: "#3d454d", hair: "#4b3328", accent: "#e9d7b8", style: "jacket" },
    { shirt: "#766d91", pants: "#39434e", hair: "#30201c", accent: "#e4d6c2", style: "scarf", female: true },
    { shirt: "#748b5c", pants: "#454d52", hair: "#8b8a82", accent: "#d8c49a", style: "vest" },
    { shirt: "#b66c78", pants: "#b7a88e", hair: "#211b1a", accent: "#f0e0cb", style: "skirt", female: true },
    { shirt: "#4f7485", pants: "#3b424a", hair: "#30241f", accent: "#e5d2ad", style: "stripes" },
    { shirt: "#b18b53", pants: "#a99b84", hair: "#30201c", accent: "#f0e8d7", style: "skirt", female: true },
    { shirt: "#6e586f", pants: "#38434b", hair: "#4b3328", accent: "#ddc9a6", style: "jacket", female: true },
    { shirt: "#8a6a52", pants: "#343f49", hair: "#5a3329", accent: "#e4d9c5", style: "vest" }
  ];
  const crowd: DinerRig[] = [];
  specs.forEach(([x, z, archetype, outfitIndex, scale, cluster], index) => {
    const outfit = outfits[outfitIndex];
    const [centerX, centerZ] = clusterCenters[cluster];
    const turn = Math.atan2(centerX - x, centerZ - z) + ((index % 3) - 1) * .10;
    const rig = createDiner(archetype, x, z, turn, false, true);
    dressRig(rig, archetype, outfit);
    addCrowdAccessory(rig, index, outfit.accent);
    rig.root.scale.setScalar(scale);
    rig.root.position.y = ROOF_Y + .08 * scale;
    rig.root.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = false; o.receiveShadow = false; } });
    scene.add(rig.root);
    crowd.push(rig);
  });
  return crowd;
}

function createApartmentBuilding(scene: THREE.Scene) {
  // Reproducción del edificio maestro de los capítulos anteriores:
  // misma fachada crema, seis pisos, tres ventanas por planta y placa 284.
  const facade = mat("#c9bca8", .94), facadeLight = mat("#e1d4c0", .92);
  const concrete = mat("#8d887e", .86), frame = mat("#554f49", .62);
  box(scene, [13.2, 19, 10.3], facade, [0, 7.45, -9.45], false);
  box(scene, [13.2, 19, .95], facade, [0, 7.45, -4.72], false);
  box(scene, [13.45, .42, 1.08], concrete, [0, 17.15, -4.72], false);
  box(scene, [13.35, .22, 1.02], facadeLight, [0, -2.05, -4.72], false);
  box(scene, [.34, 18.2, 1.04], facadeLight, [-6.35, 7.45, -4.72], false);
  box(scene, [.34, 18.2, 1.04], facadeLight, [6.35, 7.45, -4.72], false);
  for (let floor = 0; floor < 6; floor++) {
    const y = -.35 + floor * 2.82;
    for (let column = 0; column < 3; column++) {
      const x = (column - 1) * 3.85;
      box(scene, [1.82, 1.62, .075], frame, [x, y, -4.20], false);
      const lit = (floor * 5 + column * 3) % 4 !== 0;
      const pane = new THREE.MeshStandardMaterial({
        color: lit ? "#d4c29e" : "#263b4b",
        roughness: .22, metalness: .18,
        emissive: lit ? "#bd8e4e" : "#182a35",
        emissiveIntensity: lit ? .34 : .08
      });
      box(scene, [1.64, 1.44, .035], pane, [x, y, -4.155], false);
      box(scene, [.055, 1.48, .055], facadeLight, [x, y, -4.12], false);
      box(scene, [1.70, .055, .055], facadeLight, [x, y + .72, -4.12], false);
      box(scene, [1.70, .055, .055], facadeLight, [x, y - .72, -4.12], false);
      box(scene, [.045, 1.42, .045], frame, [x, y, -4.115], false);
      box(scene, [1.95, .10, .20], concrete, [x, y - .88, -4.26], false);
    }
    box(scene, [12.8, .10, .18], facadeLight, [0, y - 1.28, -4.16], false);
    box(scene, [12.8, .035, .035], mat("#bd9858", .34, .64), [0, y + 1.02, -4.18], false);
  }
  box(scene, [2.15, 2.55, .12], frame, [0, -.72, -4.18], false);
  box(scene, [1.82, 2.26, .05], mat("#243640", .32, .2), [0, -.78, -4.11], false);
  box(scene, [.09, 2.25, .08], mat("#bd9858", .34, .64), [-.91, -.78, -4.06], false);
  box(scene, [.09, 2.25, .08], mat("#bd9858", .34, .64), [.91, -.78, -4.06], false);
  box(scene, [2.8, .18, 1.05], mat("#49382a", .5), [0, -2.12, -4.55], false);
  box(scene, [1.45, .42, .08], facadeLight, [0, 1.12, -4.24], false);
  const number = texture((ctx, w, h) => {
    ctx.fillStyle = "#344b40"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f7e9cc"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 92px Arial"; ctx.fillText("284", w / 2, h / 2);
  }, 256, 128);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.35, .34), new THREE.MeshBasicMaterial({ map: number, toneMapped: false }));
  plate.position.set(0, 1.12, -4.185); scene.add(plate);

  // Azotea plana con el mismo zócalo de hormigón de la fachada maestra.
  const roof = mat("#555a58", .94), roofEdge = mat("#92938b", .88), roofDark = mat("#343b3c", .72, .12);
  box(scene, [13.0, .18, 10.25], roof, [0, 17.27, -9.45], false);
  box(scene, [13.0, .14, .18], roofEdge, [0, ROOF_Y + .07, -4.38], false);
  box(scene, [13.0, .14, .18], roofEdge, [0, ROOF_Y + .07, -14.52], false);
  box(scene, [.18, .14, 10.1], roofEdge, [-6.40, ROOF_Y + .07, -9.45], false);
  box(scene, [.18, .14, 10.1], roofEdge, [6.40, ROOF_Y + .07, -9.45], false);
  const parapet = mat("#b9b3a6", .9), parapetCap = mat("#ded5c5", .82);
  box(scene, [13.0, 1.0, .20], parapet, [0, ROOF_Y + .50, -4.40], false);
  box(scene, [13.0, .10, .27], parapetCap, [0, ROOF_Y + 1.03, -4.40], false);
  box(scene, [13.0, 1.0, .20], parapet, [0, ROOF_Y + .50, -14.48], false);
  box(scene, [13.0, .10, .27], parapetCap, [0, ROOF_Y + 1.03, -14.48], false);
  for (const x of [-6.40, 6.40]) {
    box(scene, [.20, 1.0, 10.05], parapet, [x, ROOF_Y + .50, -9.45], false);
    box(scene, [.27, .10, 10.10], parapetCap, [x, ROOF_Y + 1.03, -9.45], false);
  }
  // Casilla de acceso, tanque y ventilaciones discretas junto al fondo de la terraza.
  box(scene, [2.1, 1.85, 1.9], mat("#c8bca8", .94), [4.35, ROOF_Y + .93, -12.75], false);
  box(scene, [2.12, .12, 1.95], parapetCap, [4.35, ROOF_Y + 1.90, -12.75], false);
  box(scene, [.92, 1.36, .08], mat("#594538", .72), [4.35, ROOF_Y + .68, -11.76], false);
  const tank = mat("#697c80", .5, .18);
  for (const x of [-4.8, -3.65]) {
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, 1.05, 16), tank);
    cylinder.position.set(x, ROOF_Y + .66, -12.85); cylinder.castShadow = true; scene.add(cylinder);
    box(scene, [.12, .16, .12], roofDark, [x, ROOF_Y + 1.28, -12.85], false);
  }
}

function createCityAndSky(scene: THREE.Scene) {
  scene.background = new THREE.Color("#071426");
  scene.fog = new THREE.Fog("#071426", 58, 125);
  const positions: number[] = [];
  for (let i = 0; i < 190; i++) {
    const x = ((i * 73) % 290) / 10 - 14.5;
    const y = 22 + ((i * 37) % 150) / 10;
    const z = -27 - ((i * 19) % 36);
    positions.push(x, y, z);
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: "#edf3ff", size: .075, sizeAttenuation: true, transparent: true, opacity: .88 }));
  scene.add(stars);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.25, 24, 18), new THREE.MeshStandardMaterial({ color: "#f0ead7", emissive: "#aab8d0", emissiveIntensity: .25, roughness: .95 }));
  moon.position.set(10.5, 31.0, -34.0); scene.add(moon);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(3.5, 18, 14), new THREE.MeshBasicMaterial({ color: "#a9c6e8", transparent: true, opacity: .07, side: THREE.BackSide, depthWrite: false }));
  halo.position.copy(moon.position); scene.add(halo);
  const skylineMats = ["#18283a", "#202d3d", "#263344", "#172638"].map(c => mat(c, .98));
  for (let i = 0; i < 13; i++) {
    const x = -22 + i * 3.65;
    const h = 19.5 + (i * 7 % 9) * 1.65;
    const z = -34 - (i % 3) * 3.0;
    const cityBottom = -2.20;

    // Every tower owns its façade details: windows stay attached when the camera moves.
    const building = new THREE.Group();
    building.position.set(x, cityBottom, z);
    scene.add(building);
    box(building, [2.65, h, 2.5], skylineMats[i % skylineMats.length], [0, h / 2, 0], false);

    const glow = new THREE.MeshBasicMaterial({ color: "#dfb97c", transparent: true, opacity: .7 });
    const rows = Math.max(1, Math.floor((h - .9) / 1.3));
    for (let row = 0; row < rows; row++) {
      const windowY = .70 + row * 1.25;
      if (windowY + .21 >= h) continue;

      // Two separated front columns, built as shallow panes flush with the wall.
      for (let col = 0; col < 2; col++) {
        if ((i + row + col) % 3 === 0) continue;
        const pane = new THREE.Mesh(new THREE.BoxGeometry(.34, .42, .045), glow);
        pane.position.set(col === 0 ? -.57 : .57, windowY, 1.272);
        building.add(pane);
      }

      // Side panes are part of the same building group for oblique camera angles.
      for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
        if ((i + row + sideIndex + 1) % 4 === 0) continue;
        const sidePane = new THREE.Mesh(new THREE.BoxGeometry(.045, .42, .34), glow);
        sidePane.position.set(sideIndex === 0 ? -1.327 : 1.327, windowY, 0);
        building.add(sidePane);
      }
    }
  }
  const streetGround = new THREE.Mesh(new THREE.PlaneGeometry(65, 65), mat("#171f2a", .98));
  streetGround.rotation.x = -Math.PI / 2; streetGround.position.set(0, -2.22, -6.5); streetGround.receiveShadow = true; scene.add(streetGround);
  // Volumenes vecinos bajos anclan la fachada durante el plano de situación.
  box(scene, [7.0, 9.2, 7.0], mat("#77766e", .96), [-10.8, 2.55, -8.8], false);
  box(scene, [7.3, 11.0, 7.0], mat("#9c9587", .96), [10.6, 3.45, -9.5], false);
  const road = mat("#30363c", .98);
  box(scene, [46, .10, 7.5], road, [0, -2.15, 3.0], false);
}

function createPartyProps(scene: THREE.Scene) {
  const darkWood = mat("#49382d", .64), wood = mat("#866244", .78), metal = mat("#343d40", .5, .28);
  const brass = mat("#c09a59", .38, .58), cream = mat("#f0e6d4", .72);
  const makeHighTable = (x: number, z: number, topColor: string) => {
    const group = new THREE.Group(); group.position.set(x, ROOF_Y, z); scene.add(group);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.78, .78, .13, 12), mat(topColor, .52));
    top.position.y = 1.30; top.castShadow = true; group.add(top);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.10, .14, 1.25, 10), metal); stem.position.y = .64; group.add(stem);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.50, .50, .10, 12), metal); foot.position.y = .08; group.add(foot);
    for (let i = 0; i < 3; i++) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(.09, .075, .22, 10), new THREE.MeshStandardMaterial({ color: "#e1e6df", roughness: .24, transparent: true, opacity: .88 }));
      cup.position.set(-.25 + i * .22, 1.48, .14); group.add(cup);
    }
  };
  makeHighTable(-4.45, -9.25, "#765640");
  makeHighTable(4.55, -8.75, "#5f4a39");
  makeHighTable(3.85, -12.1, "#87644b");
  const buffet = new THREE.Group(); buffet.position.set(-4.60, ROOF_Y, -12.15); scene.add(buffet);
  box(buffet, [2.6, .22, .92], wood, [0, 1.02, 0]);
  box(buffet, [2.45, .11, .82], darkWood, [0, .89, 0]);
  for (const x of [-.95, .95]) for (const z of [-.28, .28]) box(buffet, [.11, .92, .11], darkWood, [x, .43, z]);
  for (let i = 0; i < 4; i++) {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, .56, 10), mat(["#54775a", "#8e493e", "#9b8050", "#557a8c"][i], .28));
    bottle.position.set(-.82 + i * .52, 1.40, -.12); buffet.add(bottle);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .08, 10), brass); cap.position.set(-.82 + i * .52, 1.72, -.12); buffet.add(cap);
  }
  for (let i = 0; i < 3; i++) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .04, 18), cream);
    plate.position.set(-.72 + i * .70, 1.16, .25); buffet.add(plate);
    for (let j = 0; j < 3; j++) sphere(plate, [.11, .055, .11], mat(["#c48c43", "#9a6640", "#d1ae6c"][j], .9), [-.12 + j * .12, .06, 0], 8);
  }
  // DJ corner with paired speakers and a compact mixer; background guests can dance nearby.
  const dj = new THREE.Group(); dj.position.set(-4.95, ROOF_Y, -7.55); scene.add(dj);
  box(dj, [1.55, .88, .65], darkWood, [0, 1.0, 0]);
  box(dj, [1.45, .10, .56], metal, [0, 1.48, 0]);
  for (const side of [-1, 1]) {
    box(dj, [.76, 1.75, .60], mat("#252b31", .5), [side * 1.25, .92, -.18]);
    for (const y of [.48, 1.23]) {
      const speaker = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .06, 18), mat("#101519", .34, .12));
      speaker.rotation.x = Math.PI / 2; speaker.position.set(side * 1.25, y, .14); dj.add(speaker);
      sphere(dj, [.19, .19, .06], mat("#3a454b", .42, .2), [side * 1.25, y, .18], 12);
    }
  }
  for (let i = 0; i < 6; i++) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(.11, .035, .035), new THREE.MeshBasicMaterial({ color: ["#7ed0ae", "#e7c76a", "#d47e88"][i % 3] }));
    led.position.set(-.52 + i * .20, 1.56, .30); dj.add(led);
  }
  // Guirnaldas cálidas: luz de fiesta, sin ocultar las caras ni quemar los subtítulos.
  const cordMat = mat("#40352e", .9);
  const points = [
    new THREE.Vector3(-5.65, ROOF_Y + 4.10, -5.15),
    new THREE.Vector3(-2.55, ROOF_Y + 4.65, -7.15),
    new THREE.Vector3(1.10, ROOF_Y + 4.28, -5.70),
    new THREE.Vector3(5.45, ROOF_Y + 4.55, -7.25)
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 54, .018, 6, false), cordMat);
  scene.add(cable);
  const bulbs: THREE.PointLight[] = [];
  for (let i = 0; i <= 12; i++) {
    const p = curve.getPoint(i / 12);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 8), new THREE.MeshBasicMaterial({ color: "#ffe7b2" }));
    bulb.position.copy(p); scene.add(bulb);
    if (i % 3 === 0) {
      const light = new THREE.PointLight("#ffc978", 10, 9, 2);
      light.position.copy(p); scene.add(light); bulbs.push(light);
    }
  }
  const colored = [
    { p: [-4.8, ROOF_Y + 3.0, -7.4] as [number, number, number], c: "#e78f96" },
    { p: [4.9, ROOF_Y + 3.1, -9.6] as [number, number, number], c: "#84b5d0" }
  ];
  const colorLights: THREE.PointLight[] = [];
  for (const item of colored) {
    const light = new THREE.PointLight(item.c, 8, 11, 2);
    light.position.set(...item.p); scene.add(light); colorLights.push(light);
  }
  return { bulbs, colorLights };
}

type LeadRig = { id: LeadId; rig: DinerRig; phone?: THREE.Group; phoneHand: "left" | "right" | "none" };
function makeLead(scene: THREE.Scene, id: LeadId, archetype: DinnerSpeaker, x: number, z: number, outfit: Outfit, turn: number, phoneHand: "left" | "right" | "none") : LeadRig {
  const rig = createDiner(archetype, x, z, turn, false, true);
  rig.root.position.y = ROOF_Y + .08;
  dressRig(rig, archetype, outfit);
  let phone: THREE.Group | undefined;
  if (phoneHand !== "none") {
    phone = createPhone(id.toUpperCase());
    if (phoneHand === "right") {
      phone.position.set(.10, -.68, .40);
      phone.rotation.set(-.16, 0, .03);
      rig.rightArm.add(phone);
    } else {
      phone.position.set(-.10, -.68, .40);
      phone.rotation.set(-.16, 0, -.03);
      rig.leftArm.add(phone);
    }
  }
  rig.root.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = false; o.receiveShadow = false; } });
  scene.add(rig.root);
  return { id, rig, phone, phoneHand };
}

function buildParty() {
  const scene = new THREE.Scene();
  createCityAndSky(scene);
  createApartmentBuilding(scene);
  const lights = new THREE.Group();
  scene.add(lights);
  scene.add(new THREE.HemisphereLight(0x9fb4d0, 0x1b222b, 1.45));
  const moonlight = new THREE.DirectionalLight(0xb8d1ef, 1.35);
  moonlight.position.set(-8, 29, 8); moonlight.castShadow = true; scene.add(moonlight);
  const warmFill = new THREE.DirectionalLight(0xffd4a3, .62);
  warmFill.position.set(5, 22, -7); scene.add(warmFill);
  const rooftopFill = new THREE.PointLight(0xffc98c, 18, 22, 1.8);
  rooftopFill.position.set(0, ROOF_Y + 4.5, -8.1); scene.add(rooftopFill);
  createPartyProps(scene);
  const bruno = makeLead(scene, "bruno", "bruno", -2.15, -7.55,
    { shirt: "#c46a43", pants: "#35414a", hair: "#30241f", accent: "#a95637", style: "plain" }, .14, "right");
  const martina = makeLead(scene, "martina", "martina", .05, -7.55,
    { shirt: "#f4cbd6", pants: "#8eaabd", hair: "#30201c", accent: "#e5c3a7", style: "plain", female: true }, -.05, "left");
  const ernesto = makeLead(scene, "ernesto", "ernesto", 2.25, -7.55,
    { shirt: "#718064", pants: "#4b5148", hair: "#8b8a82", accent: "#d3c7a9", style: "plain" }, -.18, "none");
  const crowd = createCrowd(scene);
  void lights;
  return { scene, leads: [bruno, martina, ernesto], crowd };
}

function cameraFor(shot: RooftopShot, camera: THREE.PerspectiveCamera, t: number, party: ReturnType<typeof buildParty>) {
  void party;
  const floor = ROOF_Y;
  const views: Record<RooftopShot, { p: [number, number, number]; target: [number, number, number]; fov: number }> = {
    exterior: { p: [0, 10.3, 38.0], target: [0, 7.7, -8.6], fov: 35 },
    wide: { p: [0, floor + 7.0, -.05], target: [0, floor + 2.55, -8.0], fov: 52 },
    pair: { p: [-.85, floor + 5.15, -1.55], target: [-.95, floor + 3.72, -7.55], fov: 47 },
    bruno: { p: [-4.15, floor + 4.2, -1.70], target: [-2.15, floor + 2.75, -7.52], fov: 43 },
    martina: { p: [3.35, floor + 4.25, -1.85], target: [.05, floor + 2.72, -7.52], fov: 44 },
    ernesto: { p: [5.15, floor + 4.25, -1.90], target: [2.25, floor + 2.72, -7.52], fov: 44 },
    group: { p: [0, floor + 6.2, -1.05], target: [0, floor + 2.52, -7.60], fov: 49 },
    phone: { p: [-1.2, floor + 3.0, -2.55], target: [-1.1, floor + 2.02, -6.90], fov: 38 },
    ranking: { p: [.25, floor + 4.35, -1.40], target: [.0, floor + 2.65, -7.40], fov: 42 }
  };
  const view = views[shot] ?? views.wide;
  let [x, y, z] = view.p;
  if (shot === "exterior") {
    const approach = Math.max(0, Math.min(1, t / 3.2));
    x += Math.sin(t * .10) * .12;
    z -= approach * 1.5;
  } else {
    x += Math.sin(t * .17) * .035;
    y += Math.sin(t * .14) * .018;
  }
  camera.position.set(x, y, z);
  camera.lookAt(...view.target);
  camera.fov = view.fov;
  camera.updateProjectionMatrix();
}

type PartyWorld = ReturnType<typeof buildParty>;
function updateParty(t: number, cue: RooftopCue | undefined, party: PartyWorld) {
  const phaseFor = (id: LeadId) => id === "bruno" ? 0 : id === "martina" ? 1.4 : 2.7;
  const speaker = cue?.speaker;
  for (const lead of party.leads) {
    const { rig, id } = lead;
    const active = speaker === id;
    const phase = phaseFor(id);
    const targetAngle = cue?.look === id ? 0 : id === "bruno" ? .10 : id === "martina" ? -.07 : -.12;
    rig.head.rotation.y = targetAngle + Math.sin(t * .31 + phase) * .012;
    rig.head.rotation.x = active ? Math.sin(t * 3.4 + phase) * .018 : Math.sin(t * .46 + phase) * .006;
    const syllables = cue?.text.match(/[aeiouáéíóúü]/gi)?.length ?? 2;
    const progress = cue ? Math.max(0, Math.min(.999, (t - cue.start) / Math.max(.1, cue.end - cue.start))) : 0;
    const mouth = active ? .035 + Math.pow(Math.max(0, Math.sin(progress * Math.max(2, syllables) * Math.PI * 2)), .82) * .50 : .025;
    rig.mouth.scale.set(1, mouth, 1);
    // A phone hand stays calm and stable; only the free hand makes short, motivated gestures.
    if (id === "bruno") {
      rig.rightArm.rotation.x = .18 + Math.sin(t * .72) * .008;
      rig.rightArm.rotation.z = .10;
      rig.leftArm.rotation.x = active ? -.035 : .008;
      rig.leftArm.rotation.z = active ? -.075 - Math.sin(t * 1.6) * .015 : -.01;
    } else if (id === "martina") {
      rig.leftArm.rotation.x = .18 + Math.sin(t * .68 + .3) * .008;
      rig.leftArm.rotation.z = -.08;
      rig.rightArm.rotation.x = active ? -.035 : 0;
      rig.rightArm.rotation.z = active ? .07 + Math.sin(t * 1.5) * .012 : .01;
    } else {
      rig.leftArm.rotation.x = active ? -.025 : 0;
      rig.rightArm.rotation.x = active ? .02 : 0;
      rig.leftArm.rotation.z = active ? -.045 : -.008;
      rig.rightArm.rotation.z = active ? .045 : .008;
    }
    rig.root.position.y = ROOF_Y + .08 + Math.sin(t * .55 + phase) * .001;
  }
  party.crowd.forEach((rig, index) => {
    const phase = index * .73;
    const blinkCycle = (t + index * .83) % (4.0 + (index % 5) * .39);
    const blink = blinkCycle < .13 || (index % 7 === 2 && blinkCycle > .30 && blinkCycle < .42);
    rig.eyes.forEach(eye => { eye.scale.y = blink ? .10 : 1; });
    rig.head.rotation.y = Math.sin(t * (.52 + (index % 3) * .09) + phase) * .12
      + Math.sin(t * .20 + phase * .7) * .035;
    rig.head.rotation.x = Math.sin(t * (.72 + (index % 4) * .08) + phase * .5) * .030;
    rig.head.rotation.z = Math.sin(t * .58 + phase * .8) * .014;
    const talking = Math.max(0, Math.sin(t * (1.55 + (index % 4) * .11) + phase));
    rig.mouth.scale.y = .20 + talking * .75;
    rig.leftArm.rotation.z = -.018 + Math.sin(t * 1.08 + phase) * .060;
    rig.rightArm.rotation.z = .018 + Math.sin(t * 1.19 + phase + 1.25) * .060;
    rig.leftArm.rotation.x = Math.sin(t * .82 + phase) * .025;
    rig.rightArm.rotation.x = Math.sin(t * .88 + phase + .9) * .025;
  });
}

function drawCaptions(ctx: CanvasRenderingContext2D, pkg: RooftopPackage, time: number) {
  const cue = pkg.dialogue.find(item => time >= item.start && time <= item.end);
  if (!cue) return;
  const names: Record<LeadId, string> = { bruno: "BRUNO", martina: "MARTINA", ernesto: "ERNESTO" };
  const scale = pkg.width / 720, maxWidth = pkg.width * .88;
  ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
  const font = 26 * scale;
  ctx.font = "800 " + font + "px Arial";
  const words = cue.text.split(/\s+/), lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  let shown = lines;
  let chosenFont = font;
  if (lines.length > 2) {
    chosenFont = 22 * scale;
    ctx.font = "800 " + chosenFont + "px Arial";
    shown = [];
    let current = "";
    for (const word of words) {
      const next = current ? current + " " + word : word;
      if (ctx.measureText(next).width > maxWidth && current) { shown.push(current); current = word; }
      else current = next;
    }
    if (current) shown.push(current);
    if (shown.length > 2) shown = [shown.slice(0, Math.ceil(shown.length / 2)).join(" "), shown.slice(Math.ceil(shown.length / 2)).join(" ")];
  }
  const h = (30 + shown.length * 34 + 22) * scale, y = pkg.height - h - 28 * scale;
  ctx.fillStyle = "rgba(13,29,23,.90)"; ctx.beginPath(); ctx.roundRect(pkg.width * .055, y, pkg.width * .89, h, 12 * scale); ctx.fill();
  ctx.fillStyle = "#d7e8ad"; ctx.font = "900 " + (16 * scale) + "px Arial"; ctx.fillText(names[cue.speaker], pkg.width / 2, y + 17 * scale);
  ctx.fillStyle = "#fffaf0"; ctx.font = "800 " + chosenFont + "px Arial";
  shown.forEach((row, index) => ctx.fillText(row, pkg.width / 2, y + (45 + index * 34) * scale, maxWidth));
  ctx.restore();
}

function drawBranding(ctx: CanvasRenderingContext2D, pkg: RooftopPackage, time: number) {
  const w = pkg.width, h = pkg.height, s = w / 720;
  if (time < 2.55) {
    const alpha = Math.max(0, Math.min(1, time / .28, (2.55 - time) / .38));
    ctx.save(); ctx.globalAlpha = alpha;
    const panelW = w * .90, panelH = h * .155, x = (w - panelW) / 2, y = h * .045;
    ctx.shadowColor = "rgba(0,0,0,.42)"; ctx.shadowBlur = 24 * s;
    const gradient = ctx.createLinearGradient(x, y, x + panelW, y + panelH);
    gradient.addColorStop(0, "rgba(20,48,39,.96)"); gradient.addColorStop(1, "rgba(31,67,54,.94)");
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.roundRect(x, y, panelW, panelH, 20 * s); ctx.fill(); ctx.shadowBlur = 0;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#d7e8ad"; ctx.font = "900 " + Math.round(16 * s) + "px Arial"; ctx.fillText("INGREDORA ORIGINALS", w / 2, y + panelH * .17);
    ctx.fillStyle = "#fffaf0"; ctx.font = "900 " + Math.round(53 * s) + "px Arial Black,Arial"; ctx.fillText("ENTRE PARTIDAS", w / 2, y + panelH * .49);
    ctx.fillStyle = "#f0d18b"; ctx.font = "900 " + Math.round(22 * s) + "px Arial";
    ctx.fillText("CAPÍTULO " + pkg.chapterNumber + " · LA ALUMNA", w / 2, y + panelH * .82);
    ctx.restore();
  }
  if (time >= pkg.endCardStart) {
    const alpha = Math.min(1, (time - pkg.endCardStart) / .48);
    ctx.save(); ctx.globalAlpha = alpha;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#10251d"); gradient.addColorStop(.5, "#17382c"); gradient.addColorStop(1, "#0b1914");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(215,232,173,.65)"; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.roundRect(w * .10, h * .23, w * .80, h * .54, 22 * s); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#d7e8ad";
    ctx.font = "900 " + Math.round(22 * s) + "px Arial"; ctx.fillText("INGREDORA ORIGINALS", w / 2, h * .32);
    ctx.fillStyle = "#fffaf0"; ctx.font = "900 " + Math.round(58 * s) + "px Arial Black,Arial"; ctx.fillText("ENTRE PARTIDAS", w / 2, h * .43);
    ctx.fillStyle = "#f0d18b"; ctx.font = "900 " + Math.round(25 * s) + "px Arial"; ctx.fillText("Una serie de Ingredora", w / 2, h * .51);
    ctx.fillStyle = "#f5d792"; ctx.font = "900 " + Math.round(42 * s) + "px Arial"; ctx.fillText("ingredora.com", w / 2, h * .62);
    ctx.fillStyle = "#e8e2d5"; ctx.font = "700 " + Math.round(18 * s) + "px Arial";
    ctx.fillText("Bruno · Martina · Tomás · Valentina · Ernesto", w / 2, h * .70);
    ctx.restore();
  }
}

export async function renderEntrePartidasRooftopToWebM(
  pkg: RooftopPackage,
  onProgress: (progress: RooftopProgress) => void,
  signal?: AbortSignal
): Promise<Blob> {
  if (pkg.schemaVersion !== 1 || pkg.engineVersion !== "entre-partidas-rooftop-1.0.0") throw new Error("Paquete del capítulo 8 incompatible.");
  if (pkg.width !== 720 || pkg.height !== 1280 || pkg.fps !== 24) throw new Error("El capítulo requiere 720×1280 a 24 FPS.");
  if (!pkg.dialogue.length || pkg.durationSeconds <= 0) throw new Error("El capítulo necesita diálogos y una duración válida.");
  if (!(await canEncodeVideo("vp9", { width: pkg.width, height: pkg.height, frameRate: pkg.fps }))) throw new Error("No hay codificador VP9 disponible para el render.");
  const totalFrames = Math.round(pkg.durationSeconds * pkg.fps);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(pkg.width, pkg.height, false);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.10;
  const party = buildParty();
  const camera = new THREE.PerspectiveCamera(48, pkg.width / pkg.height, .1, 180);
  const canvas = document.createElement("canvas");
  canvas.width = pkg.width; canvas.height = pkg.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el lienzo del capítulo.");
  const target = new BufferTarget();
  const output = new Output({ format: new WebMOutputFormat(), target });
  const videoSource = new CanvasSource(canvas, { codec: "vp9", quality: new Quality({ bitrate: 8_000_000 }) });
  output.addVideoTrack(videoSource, { frameRate: pkg.fps });
  output.setMetadataTags({ title: pkg.title, artist: "Ingredora — Entre Partidas", date: new Date(pkg.createdAt) });
  let started = false;
  try {
    await output.start(); started = true;
    for (let frame = 0; frame < totalFrames; frame++) {
      if (signal?.aborted) throw new Error("Render cancelado.");
      const time = frame / pkg.fps;
      const cue = pkg.dialogue.find(item => time >= item.start && time <= item.end);
      const shot: RooftopShot = time < 3.2 ? "exterior" : cue?.shot ?? "wide";
      updateParty(time, cue, party);
      cameraFor(shot, camera, time, party);
      renderer.render(party.scene, camera);
      ctx.drawImage(renderer.domElement, 0, 0, pkg.width, pkg.height);
      const vignette = ctx.createRadialGradient(360, 550, 280, 360, 640, 930);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(7,12,20,.22)");
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, pkg.width, pkg.height);
      drawCaptions(ctx, pkg, time);
      drawBranding(ctx, pkg, time);
      await videoSource.add(time, 1 / pkg.fps);
      if (frame % 8 === 0 || frame === totalFrames - 1) {
        onProgress({ frame: frame + 1, totalFrames, percent: Math.round((frame + 1) / totalFrames * 100) });
      }
    }
    videoSource.close();
    await output.finalize();
    const buffer = target.buffer;
    if (!buffer?.byteLength) throw new Error("El render terminó sin generar el WebM.");
    return new Blob([buffer], { type: await output.getMimeType() });
  } catch (error) {
    if (started && output.state !== "finalized" && output.state !== "canceled") await output.cancel().catch(() => undefined);
    throw error instanceof Error ? error : new Error("Falló el render de la terraza.");
  } finally {
    renderer.dispose();
    party.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const material = object.material;
      if (Array.isArray(material)) material.forEach(item => item.dispose());
      else material.dispose();
    });
  }
}
