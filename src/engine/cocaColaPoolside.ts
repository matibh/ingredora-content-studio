import * as THREE from "three";

export type PoolsideSet = {
  bottle: THREE.Group;
  water: THREE.Mesh;
  waterBase: Float32Array;
  pour: THREE.Mesh;
  update: (time: number) => void;
};

function makeLabelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear la etiqueta de Coca-Cola.");
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#ef242b");
  gradient.addColorStop(0.5, "#c8102e");
  gradient.addColorStop(1, "#a80c25");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.fillRect(0, 0, 1024, 18);
  ctx.fillRect(0, 494, 1024, 18);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(70,0,0,.3)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#fffdf8";
  ctx.font = "italic 900 158px Georgia, 'Times New Roman', serif";
  ctx.fillText("Coca-Cola", 512, 254);
  ctx.shadowBlur = 0;
  ctx.font = "700 25px Arial, sans-serif";
  ctx.fillText("SABOR ORIGINAL", 512, 405);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeBottle(): THREE.Group {
  const bottle = new THREE.Group();
  const cola = new THREE.MeshPhysicalMaterial({
    color: "#32130d",
    roughness: 0.2,
    metalness: 0.02,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });
  const profile = [
    new THREE.Vector2(0.28, 0),
    new THREE.Vector2(0.34, 0.05),
    new THREE.Vector2(0.37, 0.22),
    new THREE.Vector2(0.38, 0.72),
    new THREE.Vector2(0.36, 1.05),
    new THREE.Vector2(0.31, 1.25),
    new THREE.Vector2(0.25, 1.38),
    new THREE.Vector2(0.19, 1.48),
    new THREE.Vector2(0.16, 1.62),
    new THREE.Vector2(0.16, 1.78),
    new THREE.Vector2(0.19, 1.82),
    new THREE.Vector2(0.19, 1.9),
    new THREE.Vector2(0, 1.9),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 80), cola);
  body.castShadow = true;
  body.receiveShadow = true;
  bottle.add(body);

  const labelMaterial = new THREE.MeshStandardMaterial({
    map: makeLabelTexture(),
    roughness: 0.42,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.385, 0.385, 0.68, 80, 1, true),
    labelMaterial,
  );
  label.position.y = 0.78;
  bottle.add(label);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.25, 48),
    cola,
  );
  neck.position.y = 1.79;
  bottle.add(neck);
  const capMaterial = new THREE.MeshStandardMaterial({ color: "#e31b35", roughness: 0.38 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.16, 48), capMaterial);
  cap.position.y = 1.98;
  cap.castShadow = true;
  bottle.add(cap);
  for (let i = 0; i < 32; i += 1) {
    const angle = (i / 32) * Math.PI * 2;
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.11, 0.018), capMaterial);
    ridge.position.set(Math.cos(angle) * 0.188, 1.98, Math.sin(angle) * 0.188);
    ridge.rotation.y = angle;
    bottle.add(ridge);
  }

  const dropletMaterial = new THREE.MeshPhysicalMaterial({
    color: "#e8f8ff",
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.68,
    transmission: 0.28,
  });
  for (let i = 0; i < 46; i += 1) {
    const angle = i * 2.399963;
    const y = 0.16 + ((i * 37) % 100) / 100 * 1.12;
    const radius = 0.386 + (i % 4) * 0.002;
    const size = 0.012 + (i % 5) * 0.003;
    const drop = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), dropletMaterial);
    drop.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    bottle.add(drop);
  }
  return bottle;
}

export function createCocaColaPoolsideSet(world: THREE.Scene): PoolsideSet {
  world.background = new THREE.Color("#f2b77e");
  world.fog = new THREE.Fog("#f2b77e", 26, 52);

  const deckMaterial = new THREE.MeshStandardMaterial({ color: "#d8c4a2", roughness: 0.92 });
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), deckMaterial);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, -2.05, 0);
  deck.receiveShadow = true;
  world.add(deck);

  const waterGeometry = new THREE.PlaneGeometry(15, 8, 48, 28);
  waterGeometry.rotateX(-Math.PI / 2);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: "#087f9e",
    roughness: 0.27,
    metalness: 0.02,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16,
    transparent: false,
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.set(0, -1.91, -4.4);
  water.receiveShadow = true;
  world.add(water);
  const waterPositions = waterGeometry.attributes.position.array as Float32Array;
  const waterBase = new Float32Array(waterPositions);

  const poolEdgeMaterial = new THREE.MeshStandardMaterial({ color: "#f6f0df", roughness: 0.62 });
  for (const [x, z, sx, sz] of [
    [0, -8.48, 15.5, 0.22],
    [0, -0.32, 15.5, 0.22],
    [-7.65, -4.4, 0.22, 8.3],
    [7.65, -4.4, 0.22, 8.3],
  ]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.18, sz), poolEdgeMaterial);
    edge.position.set(x, -1.83, z);
    edge.receiveShadow = true;
    world.add(edge);
  }

  const tileMaterial = new THREE.MeshStandardMaterial({ color: "#d8e0cf", roughness: 0.52 });
  for (let i = 0; i < 12; i += 1) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 7.7), tileMaterial);
    tile.position.set(-6.7 + i * 1.22, -1.89, -4.4);
    world.add(tile);
  }

  const hedgeMaterial = new THREE.MeshStandardMaterial({ color: "#397b50", roughness: 0.92 });
  for (let i = 0; i < 18; i += 1) {
    const shrub = new THREE.Mesh(
      new THREE.SphereGeometry(0.55 + (i % 3) * 0.12, 16, 12),
      hedgeMaterial,
    );
    shrub.position.set(-8.5 + i * 1.0, -0.25 + (i % 2) * 0.12, -9.2 - (i % 3) * 0.3);
    shrub.scale.set(1.35, 0.85, 0.75);
    world.add(shrub);
  }

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 32, 24),
    new THREE.MeshBasicMaterial({ color: "#fff0ae" }),
  );
  sun.position.set(4.7, 4.7, -8.8);
  world.add(sun);

  const umbrellaPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 3.4, 16),
    new THREE.MeshStandardMaterial({ color: "#e8e2d4", metalness: 0.45, roughness: 0.42 }),
  );
  umbrellaPole.position.set(4.4, -0.25, -3.8);
  world.add(umbrellaPole);
  const umbrella = new THREE.Mesh(
    new THREE.ConeGeometry(2.1, 0.42, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: "#f7f0e4", side: THREE.DoubleSide, roughness: 0.7 }),
  );
  umbrella.rotation.x = Math.PI;
  umbrella.position.set(4.4, 1.55, -3.8);
  world.add(umbrella);

  const bottle = makeBottle();
  bottle.position.set(-1.05, -1.91, 0.45);
  bottle.rotation.z = -0.04;
  bottle.scale.setScalar(0.88);
  world.add(bottle);

  const glassGroup = new THREE.Group();
  glassGroup.position.set(1.05, -1.91, 0.55);
  world.add(glassGroup);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: "#e6f8ff",
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.24,
    transmission: 0.68,
    thickness: 0.18,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.34, 1.12, 56, 1, true),
    glassMaterial,
  );
  glass.position.y = 0.56;
  glassGroup.add(glass);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.43, 0.025, 10, 56),
    new THREE.MeshStandardMaterial({ color: "#e9fbff", roughness: 0.12, metalness: 0.12 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.12;
  glassGroup.add(rim);
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.06, 48),
    glassMaterial,
  );
  bottom.position.y = 0.04;
  glassGroup.add(bottom);

  const colaLiquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.335, 0.335, 0.58, 48),
    new THREE.MeshPhysicalMaterial({ color: "#5a160c", roughness: 0.16, clearcoat: 0.9 }),
  );
  colaLiquid.position.y = 0.39;
  glassGroup.add(colaLiquid);

  const iceMaterial = new THREE.MeshPhysicalMaterial({
    color: "#e6f7ff",
    roughness: 0.12,
    metalness: 0.02,
    transparent: true,
    opacity: 0.68,
    transmission: 0.45,
    thickness: 0.22,
  });
  const iceCubes: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i += 1) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.25, 0.25), iceMaterial);
    cube.position.set(
      [-0.13, 0.12, -0.08, 0.15][i],
      0.69 + (i % 2) * 0.12,
      [-0.1, 0.08, 0.13, -0.16][i],
    );
    cube.rotation.set(0.24 * i, 0.32 * i, 0.18 * i);
    glassGroup.add(cube);
    iceCubes.push(cube);
  }

  const bubbleMaterial = new THREE.MeshBasicMaterial({ color: "#f5fcff", transparent: true, opacity: 0.8 });
  const bubbles: THREE.Mesh[] = [];
  for (let i = 0; i < 18; i += 1) {
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.018 + (i % 3) * 0.008, 8, 6), bubbleMaterial);
    bubble.position.set(Math.sin(i * 2.1) * 0.23, 0.18 + (i % 6) * 0.075, Math.cos(i * 1.7) * 0.23);
    glassGroup.add(bubble);
    bubbles.push(bubble);
  }

  const streamMaterial = new THREE.MeshPhysicalMaterial({
    color: "#9a3a1d",
    roughness: 0.12,
    transparent: true,
    opacity: 0.88,
    clearcoat: 1,
  });
  const pour = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.65, 20), streamMaterial);
  pour.position.set(0.38, -0.45, 0.52);
  pour.rotation.z = -0.72;
  pour.visible = false;
  world.add(pour);

  const key = new THREE.DirectionalLight("#fff2d0", 3.0);
  key.position.set(-3.5, 6.5, 5.5);
  world.add(key);
  const fill = new THREE.DirectionalLight("#ffe0b2", 1.0);
  fill.position.set(4.5, 2.8, 4);
  world.add(fill);
  const rimLight = new THREE.PointLight("#ffb46a", 18, 22);
  rimLight.position.set(-3, 1.8, -1);
  world.add(rimLight);
  world.add(new THREE.HemisphereLight("#ffe3c1", "#344b35", 1.35));

  const waterPosition = waterGeometry.attributes.position;
  const update = (time: number) => {
    const pourIn = Math.max(0, Math.min(1, (time - 3.1) / 0.45));
    const pourOut = 1 - Math.max(0, Math.min(1, (time - 6.0) / 0.45));
    pour.visible = pourIn * pourOut > 0.02;
    pour.scale.y = 0.15 + 0.85 * pourIn * pourOut;
    pour.material.opacity = 0.88 * pourIn * pourOut;
    bottle.rotation.z = time < 3 ? -0.04 : time < 5.7
      ? -0.04 - 0.66 * Math.max(0, Math.min(1, (time - 3) / 1.1))
      : time < 7.1 ? -0.70 + 0.66 * Math.max(0, Math.min(1, (time - 5.7) / 1.0))
      : -0.04;
    bottle.position.y = -1.91 + Math.sin(Math.min(time, 7.1) * 1.5) * 0.018;
    for (let i = 0; i < iceCubes.length; i += 1) {
      iceCubes[i].rotation.y = 0.32 * i + Math.sin(time * 1.4 + i) * 0.045;
      iceCubes[i].position.y = 0.69 + (i % 2) * 0.12 + Math.sin(time * 1.7 + i) * 0.018;
    }
    bubbles.forEach((bubble, i) => {
      const phase = (time * 0.34 + i / bubbles.length) % 1;
      bubble.position.y = 0.12 + phase * 0.68;
      bubble.visible = phase < 0.88;
    });
    const waveTime = Math.min(time, 7.2);
    const positions = waterPosition.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = waterBase[i];
      const z = waterBase[i + 2];
      positions[i + 1] = waterBase[i + 1]
        + Math.sin(x * 1.6 + waveTime * 1.8) * 0.018
        + Math.cos(z * 2.2 - waveTime * 1.35) * 0.012;
    }
    waterPosition.needsUpdate = true;
    waterGeometry.computeVertexNormals();
  };

  return { bottle, water, waterBase, pour, update };
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  let size = 26;
  while (size > 15) {
    ctx.font = "800 " + size + "px Arial, Helvetica, sans-serif";
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return size;
}

export function drawCocaColaPoolsideOverlay(
  ctx: CanvasRenderingContext2D,
  time: number,
  width: number,
  height: number,
) {
  const ease = (v: number) => {
    const x = Math.max(0, Math.min(1, v));
    return x * x * (3 - 2 * x);
  };
  const white = "#fffdf8";
  const red = "#ef233c";
  const dark = "rgba(7,20,29,.88)";
  const scale = width / 720;

  const topShade = ctx.createLinearGradient(0, 0, 0, height * 0.34);
  topShade.addColorStop(0, "rgba(0,34,52,.42)");
  topShade.addColorStop(1, "rgba(0,34,52,0)");
  ctx.fillStyle = topShade;
  ctx.fillRect(0, 0, width, height * 0.34);

  roundedRect(ctx, width * 0.31, height * 0.045, width * 0.38, height * 0.045, height * 0.022);
  ctx.fillStyle = "rgba(7,24,34,.68)";
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 " + Math.round(18 * scale) + "px Arial, Helvetica, sans-serif";
  ctx.fillStyle = white;
  ctx.fillText("INGREDORA ORIGINALS", width / 2, height * 0.067);

  if (time < 3.0) {
    const p = ease(time / 0.42);
    ctx.globalAlpha = p;
    ctx.font = "900 " + Math.round(48 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = white;
    ctx.shadowColor = "rgba(0,0,0,.32)";
    ctx.shadowBlur = 16 * scale;
    ctx.fillText("UN DÍA DE CALOR…", width / 2, height * 0.22, width * 0.9);
    ctx.font = "700 " + Math.round(23 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#fff0ae";
    ctx.fillText("PILETA, SOL Y ALGO BIEN FRÍO", width / 2, height * 0.265, width * 0.88);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  } else if (time < 7.2) {
    ctx.font = "900 " + Math.round(33 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = white;
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 12 * scale;
    ctx.fillText("UNA COCA BIEN FRÍA", width / 2, height * 0.19, width * 0.9);
    ctx.fillText("EN UN DÍA DE CALOR", width / 2, height * 0.225, width * 0.9);
    ctx.shadowBlur = 0;
  } else if (time < 10) {
    const freeze = ease((time - 7.2) / 0.25);
    ctx.fillStyle = "rgba(255,244,220," + (0.10 + freeze * 0.12) + ")";
    ctx.fillRect(0, 0, width, height);
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.12, width / 2, height / 2, width * 0.85);
    vignette.addColorStop(0, "rgba(255,244,220,0)");
    vignette.addColorStop(1, "rgba(255,220,174,.34)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.font = "900 " + Math.round(48 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#103247";
    ctx.shadowColor = "rgba(255,255,255,.75)";
    ctx.shadowBlur = 14 * scale;
    ctx.fillText("PERO PARÁ…", width / 2, height * 0.24, width * 0.9);
    ctx.font = "900 " + Math.round(36 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillText("¿SABÉS QUÉ TIENE", width / 2, height * 0.30, width * 0.9);
    ctx.fillText("ADENTRO?", width / 2, height * 0.345, width * 0.9);
    ctx.shadowBlur = 0;
  } else if (time < 25) {
    const elapsed = Math.max(0, Math.min(14.999, time - 10));
    const remaining = Math.max(0, 15 - Math.floor(elapsed));
    const pulse = 1 + Math.sin(time * 7) * 0.018;
    ctx.textAlign = "center";
    ctx.font = "900 " + Math.round(25 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = white;
    ctx.fillText("TENÉS 15 SEGUNDOS", width / 2, height * 0.20);
    ctx.font = "900 " + Math.round(178 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = remaining <= 3 ? red : white;
    ctx.shadowColor = remaining <= 3 ? "rgba(239,35,60,.48)" : "rgba(255,255,255,.32)";
    ctx.shadowBlur = 22 * scale;
    ctx.save();
    ctx.translate(width / 2, height * 0.36);
    ctx.scale(pulse, pulse);
    ctx.fillText(String(remaining).padStart(2, "0"), 0, 0);
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.font = "900 " + Math.round(29 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#fff0ae";
    ctx.fillText("ADIVINÁ SUS INGREDIENTES", width / 2, height * 0.47, width * 0.9);
    const barX = width * 0.12;
    const barY = height * 0.505;
    const barW = width * 0.76;
    roundedRect(ctx, barX, barY, barW, height * 0.009, height * 0.005);
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.fill();
    roundedRect(ctx, barX, barY, barW * (elapsed / 15), height * 0.009, height * 0.005);
    ctx.fillStyle = red;
    ctx.fill();
    ctx.font = "700 " + Math.round(19 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = white;
    ctx.fillText("¿CUÁNTOS PODÉS DESCUBRIR?", width / 2, height * 0.56);
  } else if (time < 31) {
    const reveal = ease((time - 25) / 0.28);
    ctx.fillStyle = "rgba(4,16,24,.83)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = reveal;
    ctx.font = "900 " + Math.round(34 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#fff0ae";
    ctx.fillText("ESTOS SON SUS INGREDIENTES", width / 2, height * 0.17, width * 0.94);
    ctx.font = "700 " + Math.round(16 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.fillText("COCA-COLA SABOR ORIGINAL · ARGENTINA", width / 2, height * 0.205, width * 0.94);

    const ingredients = [
      "Agua carbonatada",
      "Azúcar o jarabe de maíz de alta fructosa",
      "Colorante caramelo IV (E150d)",
      "Ácido fosfórico (E338)",
      "Aromatizantes",
      "Sucralosa (4,3 mg/100 ml)",
    ];
    const cardX = width * 0.075;
    const cardW = width * 0.85;
    const rowH = height * 0.071;
    const startY = height * 0.25;
    roundedRect(ctx, cardX, startY, cardW, rowH * 6.35, 18 * scale);
    ctx.fillStyle = dark;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
    ingredients.forEach((ingredient, index) => {
      const y = startY + rowH * (index + 0.52);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = red;
      ctx.beginPath();
      ctx.arc(cardX + 27 * scale, y, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
      const fontSize = fitText(ctx, ingredient, cardW - 76 * scale);
      ctx.font = "800 " + Math.round(fontSize * scale) + "px Arial, Helvetica, sans-serif";
      ctx.fillStyle = white;
      ctx.fillText(ingredient, cardX + 48 * scale, y, cardW - 72 * scale);
      if (index < ingredients.length - 1) {
        ctx.strokeStyle = "rgba(255,255,255,.10)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX + 22 * scale, startY + rowH * (index + 1));
        ctx.lineTo(cardX + cardW - 22 * scale, startY + rowH * (index + 1));
        ctx.stroke();
      }
    });
    ctx.textAlign = "center";
    ctx.font = "800 " + Math.round(19 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#fff0ae";
    ctx.fillText("TAMBIÉN CONTIENE CAFEÍNA", width / 2, height * 0.735);
    ctx.globalAlpha = 1;
  } else {
    const p = ease((time - 31) / 0.42);
    ctx.fillStyle = "rgba(3,15,23,.84)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = p;
    const glow = ctx.createRadialGradient(width / 2, height * 0.44, 0, width / 2, height * 0.44, width * 0.78);
    glow.addColorStop(0, "rgba(239,35,60,.28)");
    glow.addColorStop(0.55, "rgba(239,35,60,.08)");
    glow.addColorStop(1, "rgba(239,35,60,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, height * 0.12, width, height * 0.68);
    ctx.font = "900 " + Math.round(42 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = white;
    ctx.fillText("¿CUÁNTOS ACERTASTE?", width / 2, height * 0.36, width * 0.94);
    ctx.font = "900 " + Math.round(58 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#fff0ae";
    ctx.fillText("INGREDORA.COM", width / 2, height * 0.46, width * 0.94);
    roundedRect(ctx, width * 0.15, height * 0.52, width * 0.70, height * 0.075, height * 0.037);
    ctx.fillStyle = red;
    ctx.fill();
    ctx.font = "900 " + Math.round(25 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = white;
    ctx.fillText("ENTRÁ Y JUGÁ", width / 2, height * 0.558);
    ctx.font = "700 " + Math.round(19 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.fillText("15 SEGUNDOS. UN PRODUCTO. VOS.", width / 2, height * 0.64);
    ctx.globalAlpha = 1;
  }
}
