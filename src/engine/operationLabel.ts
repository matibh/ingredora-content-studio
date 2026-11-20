import * as THREE from "three";

export type OperationWord = { text: string; start: number; end: number; segment?: number };
type OperationSegment = { text?: string; start?: number; end?: number };
type CaptionWord = OperationWord & { captionText?: string };
type CaptionGroup = { words: CaptionWord[]; start: number; end: number };

export type OperationLabelSet = { update: (time: number) => void };

function makeTexture(draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear la textura de la etiqueta de investigación.");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function makeEvidenceCard(title: string, subtitle: string, accent: string) {
  return makeTexture((ctx, w, h) => {
    ctx.fillStyle = "#e7dcc2"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent; ctx.fillRect(0, 0, w, 26);
    ctx.fillStyle = "#202a2a"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.font = "900 38px Arial"; ctx.fillText(title, 28, 92, w - 56);
    ctx.font = "600 24px Arial"; ctx.fillStyle = "#53605a"; ctx.fillText(subtitle, 28, 145, w - 56);
    ctx.strokeStyle = "#b5a88e"; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(28, 190 + i * 38); ctx.lineTo(w - 28 - i * 18, 190 + i * 38); ctx.stroke(); }
  }, 512, 300);
}

export function createOperationLabelSet(world: THREE.Scene): OperationLabelSet {
  world.background = new THREE.Color("#07171b");
  world.fog = new THREE.Fog("#07171b", 18, 38);
  const material = (color: string, roughness = 0.72, metalness = 0.02) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const addBox = (name: string, color: string, position: [number, number, number], size: [number, number, number], mat?: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat ?? material(color));
    mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; world.add(mesh); return mesh;
  };
  const addSphere = (name: string, color: string, position: [number, number, number], scale: [number, number, number], mat?: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), mat ?? material(color));
    mesh.name = name; mesh.position.set(...position); mesh.scale.set(...scale); mesh.castShadow = true; world.add(mesh); return mesh;
  };

  // A small detective's office, built as a tactile miniature set rather than a generic stage.
  addBox("midnight-office-wall", "#10272a", [0, 2.4, -7.3], [18, 12, 0.5], material("#10272a", 0.95));
  addBox("wall-lower-panel", "#0a1d20", [0, -1.3, -7.0], [18, 3.2, 0.12], material("#0a1d20", 0.88));
  addBox("wooden-floor", "#172a28", [0, -2.03, -1.5], [22, 0.25, 22], material("#172a28", 0.46));
  // Warm corkboard with pinned clues, red string and brass frame.
  addBox("corkboard-frame", "#a77943", [0, 2.4, -6.88], [12.5, 7.0, 0.28], material("#8c6136", 0.52, 0.22));
  addBox("corkboard", "#96724d", [0, 2.4, -6.70], [12.1, 6.6, 0.12], material("#96724d", 0.98));
  const cardLeft = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.26), new THREE.MeshBasicMaterial({ map: makeEvidenceCard("CASO 047", "ALFAJOR GUAYMALLÉN", "#b84d3d") }));
  cardLeft.position.set(-3.55, 3.15, -6.61); world.add(cardLeft);
  const cardRight = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 1.25), new THREE.MeshBasicMaterial({ map: makeEvidenceCard("INGREDIENTES", "LISTA NO ENCONTRADA", "#a64437") }));
  cardRight.position.set(3.55, 3.15, -6.61); world.add(cardRight);
  const pinnedPhoto = makeTexture((ctx, w, h) => {
    ctx.fillStyle = "#e8dfca"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#b8a98a"; ctx.lineWidth = 8; ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = "#33453c"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 25px Arial"; ctx.fillText("LISTA DE", w / 2, h * .13);
    ctx.font = "900 30px Arial"; ctx.fillText("INGREDIENTES", w / 2, h * .22);
    ctx.strokeStyle = "#aaa087"; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(28, h * (.38 + i * .105)); ctx.lineTo(w - 28, h * (.38 + i * .105)); ctx.stroke(); }
    ctx.save(); ctx.translate(w / 2, h * .82); ctx.rotate(-.12);
    ctx.fillStyle = "#a64437"; ctx.font = "900 34px Arial"; ctx.fillText("NO LOCALIZADA", 0, 0);
    ctx.restore();
  }, 320, 420);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.85), new THREE.MeshBasicMaterial({ map: pinnedPhoto }));
  photo.position.set(0, 2.25, -6.60); photo.rotation.z = -0.06; world.add(photo);
  const threadMat = new THREE.MeshBasicMaterial({ color: "#a84035" });
  const addThread = (a: THREE.Vector3, b: THREE.Vector3) => {
    const curve = new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.16, (a.z + b.z) / 2), b);
    const thread = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.025, 6, false), threadMat);
    world.add(thread);
  };
  addThread(new THREE.Vector3(-2.45, 2.7, -6.54), new THREE.Vector3(-0.72, 2.4, -6.54));
  addThread(new THREE.Vector3(0.72, 2.4, -6.54), new THREE.Vector3(2.45, 2.7, -6.54));
  addThread(new THREE.Vector3(-0.7, 2.4, -6.54), new THREE.Vector3(-3.0, 1.2, -6.54));
  addThread(new THREE.Vector3(0.7, 2.4, -6.54), new THREE.Vector3(3.0, 1.2, -6.54));
  for (const [x, y] of [[-3.55, 3.15], [3.55, 3.15], [0, 2.25], [-3, 1.2], [3, 1.2]] as [number, number][]) {
    addSphere("brass-evidence-pin", "#d7ad61", [x, y + 0.53, -6.53], [0.10, 0.10, 0.07], material("#d7ad61", 0.28, 0.65));
  }

  // Heavy investigator's desk with paper evidence, notebook and desk lamp.
  addBox("desk-body", "#263b35", [0, -1.78, 0], [11.5, 0.48, 7.2], material("#24372f", 0.36, 0.12));
  addBox("desk-front-lip", "#68472f", [0, -1.47, 3.43], [11.5, 0.18, 0.22], material("#68472f", 0.32));
  for (const x of [-4.5, 4.5]) addBox("desk-leg", "#342b24", [x, -2.75, 2.5], [0.34, 1.65, 0.34], material("#342b24", 0.56));
  const paperMat = material("#d9ceb4", 0.94);
  const paper = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.045, 1.85), paperMat);
  paper.position.set(-3.35, -1.48, 1.15); paper.rotation.y = 0.22; paper.rotation.z = -0.06; world.add(paper);
  const notebook = addBox("case-notebook", "#506b5b", [-3.5, -1.41, 1.0], [1.45, 0.08, 1.95], material("#496653", 0.68));
  notebook.rotation.y = 0.2;
  const notebookSpine = addBox("notebook-spine", "#bb9454", [-4.18, -1.35, 1.0], [0.075, 0.045, 1.88], material("#bb9454", 0.42, 0.28));
  notebookSpine.rotation.y = 0.2;
  addBox("evidence-pencil", "#d6a34e", [-2.58, -1.38, 1.35], [0.11, 0.11, 1.45], material("#d6a34e", 0.36));
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.13, 32), material("#b48a4d", 0.28, 0.72));
  lampBase.position.set(4.25, -1.45, -1.6); world.add(lampBase);
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.55, 14), material("#b48a4d", 0.3, 0.72));
  lampStem.position.set(4.25, -0.7, -1.6); lampStem.rotation.z = -0.14; world.add(lampStem);
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.72, 32, 1, true), material("#b58b4d", 0.35, 0.44));
  lampShade.position.set(4.05, 0.10, -1.6); lampShade.rotation.z = Math.PI; world.add(lampShade);
  const lampGlow = new THREE.PointLight(0xffc16b, 18, 11, 1.8); lampGlow.position.set(3.95, -0.15, 0.2); world.add(lampGlow);

  // The suspect: an individually wrapped Guaymallén alfajor. The mystery is that
  // the ingredients list cannot be found; no ingredient names are shown anywhere.
  const product = new THREE.Group(); product.name = "guaymallen-alfajor"; product.position.set(1.22, -0.36, 0.25); product.rotation.y = -0.10; world.add(product);
  const foil = material("#e6b91f", 0.30, 0.76);
  const wrapper = new THREE.Mesh(new THREE.BoxGeometry(2.72, 1.24, 0.62), foil);
  wrapper.castShadow = true; wrapper.receiveShadow = true; product.add(wrapper);

  // Crimped, folded foil ends create the familiar pillow-pack silhouette.
  for (const side of [-1, 1]) {
    const end = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.12, 0.68), material("#f0c72c", 0.28, 0.82));
    end.position.x = side * 1.18; end.rotation.z = side * 0.045; product.add(end);
    for (let fold = 0; fold < 5; fold++) {
      const crease = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 1.06, 0.025),
        new THREE.MeshBasicMaterial({ color: fold % 2 ? "#fff09a" : "#b88917" })
      );
      crease.position.set(side * (1.25 + fold * 0.065), 0, 0.345);
      crease.rotation.z = side * 0.045;
      product.add(crease);
    }
  }

  const wrapperTexture = makeTexture((ctx, w, h) => {
    const gold = ctx.createLinearGradient(0, 0, 0, h);
    gold.addColorStop(0, "#ffe56a"); gold.addColorStop(.48, "#e8b91d"); gold.addColorStop(1, "#c88f12");
    ctx.fillStyle = gold; ctx.fillRect(0, 0, w, h);

    // Fine white sunburst lines radiate outward from the central brand panel.
    ctx.save();
    ctx.strokeStyle = "rgba(255,250,198,.82)"; ctx.lineWidth = 5;
    for (let i = -9; i <= 9; i++) {
      const y = h * .5 + i * 72;
      ctx.beginPath(); ctx.moveTo(w * .5, h * .5); ctx.lineTo(i < 0 ? 0 : w, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * .5, h * .5); ctx.lineTo(i < 0 ? w : 0, y); ctx.stroke();
    }
    ctx.restore();

    // A dark chocolate central field, with the red-and-white Guaymallén wordmark.
    ctx.fillStyle = "#59321e"; ctx.fillRect(w * .285, 0, w * .43, h);
    ctx.fillStyle = "#fff4d6"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 54px Georgia, serif"; ctx.fillText("ALFAJOR", w * .5, h * .13);
    ctx.font = "900 82px Georgia, serif";
    ctx.lineWidth = 18; ctx.strokeStyle = "#fffaf0"; ctx.strokeText("GUAYMALLÉN", w * .5, h * .43, w * .47);
    ctx.fillStyle = "#d82428"; ctx.fillText("GUAYMALLÉN", w * .5, h * .43, w * .47);
    ctx.fillStyle = "#fff1cf"; ctx.font = "800 38px Arial"; ctx.fillText("DULCE DE LECHE", w * .5, h * .68);
    ctx.font = "700 27px Arial"; ctx.fillText("BAÑO DE REPOSTERÍA", w * .5, h * .83);

    ctx.font = "800 27px Arial"; ctx.fillStyle = "#5b351e";
    ctx.fillText("38 g", w * .855, h * .86);
    ctx.fillStyle = "rgba(255,249,204,.8)"; ctx.font = "700 20px Arial";
    ctx.fillText("INDUSTRIA ARGENTINA", w * .5, h * .96);
  }, 1280, 560);
  const wrapperFront = new THREE.Mesh(
    new THREE.PlaneGeometry(2.69, 1.21),
    new THREE.MeshBasicMaterial({ map: wrapperTexture })
  );
  wrapperFront.position.set(0, 0, 0.316); product.add(wrapperFront);
  const wrapperBack = new THREE.Mesh(new THREE.PlaneGeometry(2.69, 1.21), material("#d8ab23", .34, .65));
  wrapperBack.position.z = -0.316; wrapperBack.rotation.y = Math.PI; product.add(wrapperBack);
  const crimpTop = material("#fff0a0", .24, .7);
  for (const side of [-1, 1]) {
    for (let fold = 0; fold < 4; fold++) {
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(.11, 1.13, .035), crimpTop);
      ridge.position.set(side * (1.29 + fold * .035), 0, .355);
      ridge.rotation.z = side * .08;
      product.add(ridge);
    }
  }

  // A torn-open-looking file sleeve rests next to the wrapped alfajor; it is empty.
  const emptySleeve = new THREE.Mesh(new THREE.BoxGeometry(1.12, .075, 1.55), material("#d4c5a4", .92));
  emptySleeve.position.set(-3.20, -1.43, 1.15); emptySleeve.rotation.y = .24; emptySleeve.rotation.z = -.07; world.add(emptySleeve);
  const emptyFileTexture = makeTexture((ctx, w, h) => {
    ctx.fillStyle = "#e8dfca"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#b7a88b"; ctx.lineWidth = 6; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#314339";
    ctx.font = "900 31px Arial"; ctx.fillText("INGREDIENTES", w / 2, h * .19);
    ctx.font = "700 24px Arial"; ctx.fillText("LISTA SOLICITADA", w / 2, h * .34);
    ctx.strokeStyle = "#aaa087"; ctx.lineWidth = 2;
    for (let line = 0; line < 4; line++) { ctx.beginPath(); ctx.moveTo(28, h * (.48 + line * .09)); ctx.lineTo(w - 28, h * (.48 + line * .09)); ctx.stroke(); }
    ctx.save(); ctx.translate(w / 2, h * .86); ctx.rotate(-.10);
    ctx.fillStyle = "#a64437"; ctx.font = "900 36px Arial"; ctx.fillText("SIN DATOS", 0, 0);
    ctx.restore();
  }, 480, 640);
  const emptyFile = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.46), new THREE.MeshBasicMaterial({ map: emptyFileTexture }));
  emptyFile.position.set(-3.20, -1.375, 1.94); emptyFile.rotation.y = .24; emptyFile.rotation.z = -.07; world.add(emptyFile);

  // A charming blocky noir detective with trench coat, fedora and articulated magnifying glass.
  const detective = new THREE.Group(); detective.name = "detective"; detective.position.set(-1.18, -1.58, 0.38); world.add(detective);
  const coat = material("#28473f", 0.82), coatDark = material("#1c342f", 0.88), skin = material("#d6a77f", 0.9), hair = material("#282b27", 0.9);
  const shirt = material("#e6dcc4", 0.94), trousers = material("#3d4941", 0.88), shoe = material("#201f1a", 0.62);
  const block = (name: string, mat: THREE.Material, pos: [number, number, number], size: [number, number, number]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    mesh.name = name; mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; detective.add(mesh); return mesh;
  };
  for (const side of [-1, 1]) {
    block("detective-leg", trousers, [side * 0.20, 0.23, 0], [0.26, 0.72, 0.3]);
    block("detective-shoe", shoe, [side * 0.20, -0.13, 0.10], [0.34, 0.22, 0.50]);
  }
  block("trenchcoat-body", coat, [0, 0.98, 0], [0.92, 1.12, 0.52]);
  block("coat-left-lapel", coatDark, [-0.21, 1.32, 0.28], [0.20, 0.52, 0.06]);
  block("coat-right-lapel", coatDark, [0.21, 1.32, 0.28], [0.20, 0.52, 0.06]);
  block("shirt-front", shirt, [0, 1.20, 0.274], [0.28, 0.72, 0.035]);
  block("detective-belt", material("#b48a4d", 0.4, 0.5), [0, 0.55, 0.275], [0.76, 0.09, 0.045]);
  for (const y of [1.16, 0.93, 0.70]) addSphere("coat-button", "#d6b16a", [0.08, y, 0.31], [0.045, 0.045, 0.025], material("#d6b16a", 0.3, 0.7));
  block("detective-neck", skin, [0, 1.63, 0.02], [0.24, 0.24, 0.24]);
  block("detective-square-head", skin, [0, 2.02, 0.025], [0.72, 0.70, 0.62]);
  block("hair-cap", hair, [0, 2.34, -0.015], [0.75, 0.16, 0.66]);
  block("hair-back", hair, [0, 2.00, -0.285], [0.74, 0.59, 0.10]);
  for (const side of [-1, 1]) {
    block("detective-eye-white", shirt, [side * 0.16, 2.04, 0.346], [0.13, 0.105, 0.026]);
    block("detective-eye", hair, [side * 0.16, 2.04, 0.365], [0.055, 0.09, 0.025]);
    block("detective-brow", hair, [side * 0.16, 2.16, 0.35], [0.17, 0.05, 0.035]);
    block("sideburn", hair, [side * 0.34, 2.00, 0.01], [0.10, 0.35, 0.30]);
  }
  block("detective-nose", skin, [0, 1.94, 0.39], [0.11, 0.13, 0.10]);
  block("detective-moustache", hair, [0, 1.84, 0.365], [0.26, 0.07, 0.07]);
  // Fedora brim and crown.
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.10, 12), hair); brim.position.set(0, 2.42, 0.02); brim.castShadow = true; detective.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.48, 10), hair); crown.position.set(0, 2.68, -0.015); crown.castShadow = true; detective.add(crown);
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.49, 0.075, 10), material("#a65a3e", 0.72)); hatBand.position.set(0, 2.49, -0.015); detective.add(hatBand);
  const leftArm = new THREE.Group(); leftArm.position.set(-0.46, 1.35, 0.02); detective.add(leftArm);
  const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.72, 0.30), coat); sleeveL.position.set(-0.04, -0.20, 0); sleeveL.rotation.z = 0.16; leftArm.add(sleeveL);
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.18, 0.20), skin); handL.position.set(-0.08, -0.55, 0.10); leftArm.add(handL);
  const rightArm = new THREE.Group(); rightArm.position.set(0.46, 1.35, 0.02); detective.add(rightArm);
  const sleeveR = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.64, 0.30), coat); sleeveR.position.set(0.03, -0.18, 0); rightArm.add(sleeveR);
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.18, 0.20), skin); handR.position.set(0.10, -0.49, 0.08); rightArm.add(handR);
  // Magnifier: a glass disc with a brass rim, mounted in the detective's right hand.
  const magnifier = new THREE.Group(); magnifier.position.set(0.90, 1.78, 0.46); magnifier.rotation.z = -0.38; detective.add(magnifier);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.39, 48), new THREE.MeshPhysicalMaterial({ color: "#b9dfcf", transparent: true, opacity: 0.23, roughness: 0.1, metalness: 0.1, transmission: 0.45, thickness: 0.08 }));
  lens.position.z = 0.015; magnifier.add(lens);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.075, 12, 48), material("#d7ad61", 0.22, 0.78)); rim.position.z = 0.04; magnifier.add(rim);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.78, 10), material("#71513a", 0.42, 0.35));
  handle.position.set(0.30, -0.52, 0.01); handle.rotation.z = -0.55; magnifier.add(handle);

  // Cinematic lights: one warm pool from the desk lamp and a cool moonlit rim.
  world.add(new THREE.HemisphereLight(0xc4d9d5, 0x0b1818, 1.1));
  const key = new THREE.SpotLight(0xffdca0, 72, 22, Math.PI / 5.5, 0.65, 1.25);
  key.position.set(3.4, 7.5, 4.8); key.target.position.set(0.5, -0.2, 0); key.castShadow = true; world.add(key, key.target);
  const rimLight = new THREE.DirectionalLight(0x7cb7c0, 2.0); rimLight.position.set(-5, 4, -3); world.add(rimLight);
  const fill = new THREE.PointLight(0xffa85c, 5.5, 13, 1.5); fill.position.set(-3.8, 1.6, 2.7); world.add(fill);

  // Slow floating dust catches the spotlights without obscuring the product.
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) {
    dustPositions[i * 3] = Math.sin(i * 18.73) * 6.0;
    dustPositions[i * 3 + 1] = -0.2 + (i % 15) * 0.34;
    dustPositions[i * 3 + 2] = -4 + Math.cos(i * 7.19) * 4.5;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: "#e4c48f", size: 0.035, transparent: true, opacity: 0.35, sizeAttenuation: true }));
  world.add(dust);

  const update = (time: number) => {
    detective.position.y = -1.58 + Math.sin(time * 1.65) * 0.025;
    detective.rotation.y = Math.sin(time * 0.62) * 0.045;
    detective.rotation.z = Math.sin(time * 0.9) * 0.012;
    magnifier.rotation.z = -0.38 + Math.sin(time * 1.35) * 0.045;
    rightArm.rotation.z = -0.05 + Math.sin(time * 1.1) * 0.025;
    leftArm.rotation.z = Math.sin(time * 0.85) * 0.035;
    product.rotation.y = Math.sin(time * 0.72) * 0.022;
    product.position.y = -0.34 + Math.sin(time * 1.3 + 0.6) * 0.018;
    dust.rotation.y = time * 0.012;
    if (time >= 16.5) {
      // He stops examining the package, turns squarely toward the viewer and asks for help.
      detective.rotation.y = Math.sin(time * 1.8) * 0.018;
      leftArm.rotation.z = -0.48 + Math.sin(time * 3.2) * 0.045;
      rightArm.rotation.z = 0.18;
      magnifier.rotation.z = -0.10 + Math.sin(time * 2.3) * 0.025;
    }
  };
  return { update };
}

function buildCaptionGroups(words: OperationWord[], segments: OperationSegment[]): CaptionGroup[] {
  const bySegment = new Map<number, OperationWord[]>();
  for (const word of words) {
    const key = word.segment ?? 0;
    const list = bySegment.get(key) ?? [];
    list.push(word);
    bySegment.set(key, list);
  }
  const groups: CaptionGroup[] = [];
  for (const [segmentIndex, phrase] of bySegment) {
    phrase.sort((a, b) => a.start - b.start);
    const tokens = segments[segmentIndex]?.text?.trim().match(/\\S+/g) ?? [];
    const restored = tokens.length === phrase.length &&
      tokens.every((token, index) => normalize(token) === normalize(phrase[index].text))
      ? phrase.map((word, index) => ({ ...word, captionText: tokens[index] }))
      : phrase;
    const count = Math.ceil(phrase.length / 4);
    const base = Math.floor(phrase.length / count);
    const extra = phrase.length % count;
    let cursor = 0;
    for (let index = 0; index < count; index++) {
      const size = base + (index < extra ? 1 : 0);
      const chunk = restored.slice(cursor, cursor + size);
      cursor += size;
      const nextStart = cursor < phrase.length ? phrase[cursor].start : Number.POSITIVE_INFINITY;
      groups.push({ words: chunk, start: chunk[0].start, end: Math.min(chunk[chunk.length - 1].end + 0.24, nextStart) });
    }
  }
  return groups.sort((a, b) => a.start - b.start);
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function drawOperationLabelOverlay(
  ctx: CanvasRenderingContext2D,
  time: number,
  width: number,
  height: number,
  words: OperationWord[],
  segments: OperationSegment[],
) {
  const groups = buildCaptionGroups(words, segments);
  const active = groups.find((group) => time >= group.start && time < group.end);
  if (active) {
    const visible = active.words.filter((word) => word.start <= time);
    const caption = visible.map((word) => word.captionText ?? word.text).join(" ").toLocaleUpperCase("es-AR");
    if (caption) {
      const scale = width / 720;
      const fontSize = Math.round(33 * scale);
      ctx.save();
      ctx.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(2, 3.2 * scale); ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(3,12,14,.98)"; ctx.fillStyle = "#fff8e8";
      const maxWidth = width * 0.86;
      const lines: string[] = [];
      let line = "";
      for (const word of caption.split(/\\s+/)) {
        const candidate = line ? line + " " + word : word;
        if (ctx.measureText(candidate).width > maxWidth && line) { lines.push(line); line = word; }
        else line = candidate;
      }
      if (line) lines.push(line);
      const lineHeight = fontSize * 1.13;
      const baseY = height * 0.79 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((value, index) => {
        const y = baseY + index * lineHeight;
        ctx.strokeText(value, width / 2, y, maxWidth);
        ctx.fillText(value, width / 2, y, maxWidth);
      });
      ctx.restore();
    }
  }

  // A restrained case-file marker is part of the scenery, not a second subtitle.
  ctx.save();
  const badgeW = width * 0.36, badgeH = height * 0.044, badgeX = width * 0.055, badgeY = height * 0.045;
  rounded(ctx, badgeX, badgeY, badgeW, badgeH, badgeH * 0.22);
  ctx.fillStyle = "rgba(7,25,27,.86)"; ctx.fill();
  ctx.strokeStyle = "rgba(218,178,111,.76)"; ctx.lineWidth = Math.max(1.5, width * 0.002); ctx.stroke();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(width * 0.031)}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = "#e3c58c"; ctx.fillText("INGREDORA  /  CASO GUAYMALLÉN", badgeX + badgeW / 2, badgeY + badgeH / 2, badgeW * 0.93);
  ctx.restore();

  // The detective turns the open file toward the viewer: this case now needs an audience response.
  if (time >= 21.5) {
    const progress = Math.min(1, (time - 21.5) / 0.55);
    const scale = width / 720;
    const panelW = width * 0.72, panelH = height * 0.052;
    const x = (width - panelW) / 2, y = height * 0.14 - height * 0.035 * (1 - progress);
    ctx.save();
    ctx.globalAlpha = progress;
    rounded(ctx, x, y, panelW, panelH, panelH * 0.48);
    ctx.fillStyle = "rgba(12,34,28,.92)"; ctx.fill();
    ctx.strokeStyle = "#d4b06d"; ctx.lineWidth = 2 * scale; ctx.stroke();
    ctx.font = `900 ${Math.round(width * 0.037)}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#f2d79d";
    ctx.fillText("CASO EN TUS MANOS", width / 2, y + panelH / 2, panelW * 0.92);
    ctx.restore();
  }
}

