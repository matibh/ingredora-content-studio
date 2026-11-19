import * as THREE from "three";

export type PoolsideSet = {
  bottle: THREE.Group;
  glass: THREE.Group;
  update: (time: number) => void;
};

function canvasTexture(
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  width = 1024,
  height = 768,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar una textura de la playa.");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeBottleLabel() {
  return canvasTexture((ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#f52d35");
    gradient.addColorStop(0.45, "#cf102d");
    gradient.addColorStop(1, "#a90825");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.fillRect(0, 0, width, 12);
    ctx.fillRect(0, height - 12, width, 12);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(54,0,0,.38)";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#fffefa";
    ctx.font = "italic 900 166px Georgia, 'Times New Roman', serif";
    ctx.fillText("Coca-Cola", width / 2, height * 0.48);
    ctx.shadowBlur = 0;
    ctx.font = "800 35px Arial, Helvetica, sans-serif";
    ctx.fillText("SABOR ORIGINAL", width / 2, height * 0.79);
  }, 1024, 512);
}

function makeBottle(): THREE.Group {
  const pivot = new THREE.Group();
  const model = new THREE.Group();
  model.position.y = -0.95;
  pivot.add(model);

  const cola = new THREE.MeshPhysicalMaterial({
    color: "#32120c",
    roughness: 0.18,
    metalness: 0.01,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
  const profile = [
    new THREE.Vector2(0.27, 0.02),
    new THREE.Vector2(0.34, 0.07),
    new THREE.Vector2(0.385, 0.20),
    new THREE.Vector2(0.395, 0.36),
    new THREE.Vector2(0.385, 0.52),
    new THREE.Vector2(0.395, 0.70),
    new THREE.Vector2(0.385, 0.94),
    new THREE.Vector2(0.35, 1.12),
    new THREE.Vector2(0.29, 1.30),
    new THREE.Vector2(0.215, 1.42),
    new THREE.Vector2(0.17, 1.52),
    new THREE.Vector2(0.16, 1.70),
    new THREE.Vector2(0.17, 1.78),
    new THREE.Vector2(0.155, 1.82),
    new THREE.Vector2(0, 1.82),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 112), cola);
  body.castShadow = true;
  body.receiveShadow = true;
  model.add(body);

  const ridgeMaterial = new THREE.MeshPhysicalMaterial({
    color: "#512015",
    roughness: 0.24,
    clearcoat: 0.8,
    transparent: true,
    opacity: 0.46,
  });
  for (const y of [0.29, 0.48, 0.87]) {
    const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.387, 0.018, 8, 96), ridgeMaterial);
    ridge.rotation.x = Math.PI / 2;
    ridge.position.y = y;
    model.add(ridge);
  }

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.402, 0.402, 0.68, 112, 1, true),
    new THREE.MeshStandardMaterial({
      map: makeBottleLabel(),
      roughness: 0.36,
      metalness: 0.015,
      side: THREE.DoubleSide,
    }),
  );
  label.position.y = 0.76;
  label.castShadow = true;
  model.add(label);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.24, 64, 1, true), cola);
  neck.position.y = 1.68;
  model.add(neck);
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.158, 0.025, 12, 64),
    new THREE.MeshPhysicalMaterial({ color: "#4e2116", roughness: 0.2, clearcoat: 1 }),
  );
  mouth.rotation.x = Math.PI / 2;
  mouth.position.y = 1.815;
  model.add(mouth);
  const innerMouth = new THREE.Mesh(
    new THREE.CircleGeometry(0.125, 48),
    new THREE.MeshBasicMaterial({ color: "#160805" }),
  );
  innerMouth.position.y = 1.785;
  innerMouth.rotation.x = -Math.PI / 2;
  model.add(innerMouth);

  const capMaterial = new THREE.MeshStandardMaterial({ color: "#e21c35", roughness: 0.4 });
  const removedCap = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.15, 56), capMaterial);
  cap.castShadow = true;
  removedCap.add(cap);
  for (let i = 0; i < 36; i += 1) {
    const angle = (i / 36) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.11, 0.016), capMaterial);
    rib.position.set(Math.cos(angle) * 0.188, 0, Math.sin(angle) * 0.188);
    rib.rotation.y = angle;
    removedCap.add(rib);
  }
  removedCap.position.set(2.7, -1.95, 0.25);
  removedCap.rotation.set(0.1, 0.4, 0.38);

  const dropletMaterial = new THREE.MeshPhysicalMaterial({
    color: "#e7f8ff",
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.72,
    transmission: 0.4,
    thickness: 0.08,
  });
  for (let i = 0; i < 76; i += 1) {
    const angle = i * 2.399963;
    const y = 0.18 + ((i * 37) % 100) / 100 * 1.18;
    const radius = y > 1.05 ? 0.30 : 0.399;
    const size = 0.009 + (i % 5) * 0.003;
    const drop = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), dropletMaterial);
    drop.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    model.add(drop);
  }

  pivot.userData.model = model;
  pivot.userData.removedCap = removedCap;
  pivot.userData.mouthPoint = new THREE.Vector3(0, 0.865, 0);
  return pivot;
}

function makeTowelTexture() {
  return canvasTexture((ctx, width, height) => {
    ctx.fillStyle = "#f4e6cb";
    ctx.fillRect(0, 0, width, height);
    const colors = ["#d94a3d", "#f5efe0", "#247c89", "#f5efe0", "#e0ae59"];
    const bandWidth = width / colors.length;
    colors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(index * bandWidth, 0, bandWidth * 0.72, height);
    });
    ctx.fillStyle = "rgba(255,255,255,.16)";
    for (let y = 0; y < height; y += 9) ctx.fillRect(0, y, width, 2);
    ctx.fillStyle = "#fff8e9";
    ctx.fillRect(0, 0, width, 18);
    ctx.fillRect(0, height - 18, width, 18);
  }, 512, 1024);
}

function addPalm(world: THREE.Scene, x: number, z: number, scale: number) {
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#8d6544", roughness: 0.92 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.32, 5.2, 18, 6), trunkMaterial);
  trunk.position.set(x, 0.52, z);
  trunk.rotation.z = -0.11;
  trunk.scale.setScalar(scale);
  trunk.castShadow = true;
  world.add(trunk);

  const crown = new THREE.Group();
  crown.position.set(x - 0.22 * scale, 3.05 * scale, z);
  world.add(crown);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: "#247a4d", roughness: 0.82, side: THREE.DoubleSide });
  const leafLight = new THREE.MeshStandardMaterial({ color: "#3a9861", roughness: 0.85, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i += 1) {
    const angle = (i / 9) * Math.PI * 2;
    const length = (2.3 + (i % 3) * 0.22) * scale;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), i % 2 ? leafMaterial : leafLight);
    leaf.position.set(Math.cos(angle) * length * 0.47, -0.35 * scale, Math.sin(angle) * length * 0.47);
    leaf.scale.set(length * 0.68, 0.105 * scale, 0.26 * scale);
    leaf.rotation.y = -angle;
    leaf.rotation.z = -0.23;
    leaf.castShadow = true;
    crown.add(leaf);
  }
}

function addUmbrella(world: THREE.Scene) {
  const poleMaterial = new THREE.MeshStandardMaterial({ color: "#e8dfcf", roughness: 0.42, metalness: 0.15 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 3.7, 24), poleMaterial);
  pole.position.set(4.1, -0.18, -4.8);
  pole.castShadow = true;
  world.add(pole);

  const canopyColors = ["#f8efe0", "#df5145", "#f8efe0", "#df5145", "#f8efe0", "#df5145"];
  for (let i = 0; i < canopyColors.length; i += 1) {
    const wedge = new THREE.Mesh(
      new THREE.ConeGeometry(1.72, 0.48, 12, 1, true, (i / 6) * Math.PI * 2, (Math.PI * 2) / 6),
      new THREE.MeshStandardMaterial({ color: canopyColors[i], roughness: 0.72, side: THREE.DoubleSide }),
    );
    wedge.position.set(4.1, 1.65, -4.8);
    wedge.castShadow = true;
    world.add(wedge);
  }
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), poleMaterial);
  finial.position.set(4.1, 1.9, -4.8);
  world.add(finial);
}

function makeIceCube(index: number, material: THREE.Material) {
  const group = new THREE.Group();
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.31, 0.29), material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  group.add(cube);
  const glint = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.22, 0.012),
    new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.64 }),
  );
  glint.position.set(-0.12, 0.015, 0.15);
  group.add(glint);
  group.rotation.set(0.16 * index, 0.38 * index, 0.12 * index);
  return group;
}

export function createCocaColaPoolsideSet(world: THREE.Scene): PoolsideSet {
  world.background = new THREE.Color("#70b7e8");
  world.fog = new THREE.Fog("#b4d9ed", 34, 78);

  const skyTexture = canvasTexture((ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#2789d4");
    gradient.addColorStop(0.46, "#65b4e8");
    gradient.addColorStop(0.82, "#b9e0f3");
    gradient.addColorStop(1, "#e2f0ed");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    const haze = ctx.createLinearGradient(0, height * 0.72, 0, height);
    haze.addColorStop(0, "rgba(255,255,255,0)");
    haze.addColorStop(1, "rgba(255,248,224,.34)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
  }, 1024, 512);
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 44),
    new THREE.MeshBasicMaterial({ map: skyTexture, depthWrite: false }),
  );
  sky.position.set(0, 10.5, -27);
  world.add(sky);

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: "#fffdf7",
    roughness: 1,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const cloudGroups: THREE.Group[] = [];
  const cloudSpecs = [
    [-7.0, 7.2, -15.5, 1.0],
    [-2.7, 8.4, -20.0, 0.76],
    [4.5, 7.6, -17.5, 0.92],
    [9.0, 8.5, -22.0, 0.66],
  ];
  cloudSpecs.forEach(([x, y, z, scale], index) => {
    const cloud = new THREE.Group();
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(scale);
    for (let i = 0; i < 6; i += 1) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.9 + (i % 3) * 0.22, 20, 14),
        cloudMaterial,
      );
      puff.position.set((i - 2.5) * 0.65, Math.sin(i * 1.7) * 0.22, Math.cos(i * 0.8) * 0.12);
      puff.scale.set(1.0, 0.56 + (i % 2) * 0.12, 0.72);
      cloud.add(puff);
    }
    cloud.userData.baseX = x;
    cloud.userData.baseY = y;
    cloud.userData.phase = index * 1.7;
    cloudGroups.push(cloud);
    world.add(cloud);
  });

  const sunTexture = canvasTexture((ctx, width, height) => {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 6, width / 2, height / 2, width * 0.48);
    gradient.addColorStop(0, "rgba(255,255,244,1)");
    gradient.addColorStop(0.12, "rgba(255,249,219,.98)");
    gradient.addColorStop(0.32, "rgba(255,238,177,.42)");
    gradient.addColorStop(0.66, "rgba(255,225,153,.12)");
    gradient.addColorStop(1, "rgba(255,225,153,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, 256, 256);
  const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTexture, transparent: true, depthWrite: false }));
  sunHalo.position.set(4.5, 7.2, -18);
  sunHalo.scale.set(9, 9, 1);
  world.add(sunHalo);
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.54, 36, 28),
    new THREE.MeshBasicMaterial({ color: "#fff7d5" }),
  );
  sunCore.position.set(4.5, 7.2, -18);
  world.add(sunCore);

  const sandTexture = canvasTexture((ctx, width, height) => {
    ctx.fillStyle = "#d9bd88";
    ctx.fillRect(0, 0, width, height);
    const bands = ctx.createLinearGradient(0, 0, width, height);
    bands.addColorStop(0, "rgba(255,244,205,.22)");
    bands.addColorStop(0.52, "rgba(196,151,93,.04)");
    bands.addColorStop(1, "rgba(145,104,58,.13)");
    ctx.fillStyle = bands;
    ctx.fillRect(0, 0, width, height);
    let seed = 7193;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    for (let i = 0; i < 9000; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = 0.7 + random() * 2.2;
      const shade = random() > 0.5 ? "rgba(255,248,221," : "rgba(124,88,50,";
      ctx.fillStyle = shade + (0.025 + random() * 0.055) + ")";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,246,215,.16)";
    ctx.lineWidth = 5;
    for (let y = 40; y < height; y += 92) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * 0.24, y - 16, width * 0.64, y + 18, width, y - 5);
      ctx.stroke();
    }
  }, 1024, 1024);
  sandTexture.wrapS = THREE.RepeatWrapping;
  sandTexture.wrapT = THREE.RepeatWrapping;
  sandTexture.repeat.set(3, 3);
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(66, 50),
    new THREE.MeshStandardMaterial({ map: sandTexture, color: "#fff0d0", roughness: 0.98 }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -2.08, -2);
  sand.receiveShadow = true;
  world.add(sand);

  const oceanGeometry = new THREE.PlaneGeometry(66, 22, 38, 16);
  oceanGeometry.rotateX(-Math.PI / 2);
  const oceanMaterial = new THREE.MeshPhysicalMaterial({
    color: "#168ab0",
    roughness: 0.22,
    metalness: 0.04,
    clearcoat: 0.95,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  });
  const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
  ocean.position.set(0, -1.96, -14.0);
  ocean.receiveShadow = true;
  world.add(ocean);
  const oceanPositions = oceanGeometry.attributes.position.array as Float32Array;
  const oceanBase = new Float32Array(oceanPositions);

  const foamMaterial = new THREE.MeshBasicMaterial({ color: "#fffdf6", transparent: true, opacity: 0.46, side: THREE.DoubleSide });
  const foamBands: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i += 1) {
    const band = new THREE.Mesh(new THREE.PlaneGeometry(38, 0.10 + i * 0.025), foamMaterial);
    band.rotation.x = -Math.PI / 2;
    band.position.set((i % 2 ? -0.7 : 0.9), -1.925 + i * 0.003, -5.0 - i * 0.42);
    band.rotation.z = (i % 2 ? -0.015 : 0.012);
    world.add(band);
    foamBands.push(band);
  }

  const shorelineWet = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 2.3),
    new THREE.MeshPhysicalMaterial({ color: "#bca77d", roughness: 0.3, metalness: 0.03, clearcoat: 0.48, transparent: true, opacity: 0.78 }),
  );
  shorelineWet.rotation.x = -Math.PI / 2;
  shorelineWet.position.set(0, -2.055, -4.1);
  world.add(shorelineWet);

  addPalm(world, -7.8, -6.3, 1.0);
  addUmbrella(world);

  const towel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 3.1),
    new THREE.MeshStandardMaterial({ map: makeTowelTexture(), roughness: 0.96 }),
  );
  towel.rotation.x = -Math.PI / 2;
  towel.rotation.z = 0.18;
  towel.position.set(-3.0, -2.035, 0.35);
  towel.receiveShadow = true;
  world.add(towel);
  const rolledTowel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 1.78, 24),
    new THREE.MeshStandardMaterial({ color: "#e6d6b9", roughness: 0.95 }),
  );
  rolledTowel.rotation.z = Math.PI / 2;
  rolledTowel.position.set(-3.1, -1.93, 1.92);
  world.add(rolledTowel);

  const coolerMaterial = new THREE.MeshPhysicalMaterial({ color: "#2d8b91", roughness: 0.3, clearcoat: 0.5 });
  const cooler = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.7, 0.74), coolerMaterial);
  cooler.position.set(-4.0, -1.72, 0.3);
  cooler.castShadow = true;
  cooler.receiveShadow = true;
  world.add(cooler);
  const coolerLid = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.15, 0.8), new THREE.MeshStandardMaterial({ color: "#e9e2d0", roughness: 0.46 }));
  coolerLid.position.set(-4.0, -1.29, 0.3);
  coolerLid.castShadow = true;
  world.add(coolerLid);
  const coolerHandle = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.028, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: "#e9e2d0", metalness: 0.2, roughness: 0.4 }));
  coolerHandle.position.set(-4.0, -1.18, 0.3);
  coolerHandle.rotation.z = Math.PI;
  world.add(coolerHandle);

  const sandPropsMaterial = new THREE.MeshStandardMaterial({ color: "#f2dfb4", roughness: 0.94 });
  for (let i = 0; i < 17; i += 1) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (i % 3) * 0.018, 12, 8), sandPropsMaterial);
    shell.scale.set(1.35, 0.52, 0.9);
    shell.position.set(-5.2 + (i * 1.37) % 10.2, -2.0, -0.2 + (i * 0.83) % 2.6);
    shell.rotation.y = i * 0.79;
    shell.castShadow = true;
    world.add(shell);
  }

  const bottle = makeBottle();
  bottle.position.set(0.95, 0.12, 0.72);
  bottle.rotation.set(-0.04, 0.02, 0.06);
  world.add(bottle);
  world.add(bottle.userData.removedCap as THREE.Group);

  const glass = new THREE.Group();
  glass.position.set(0.12, -2.045, 0.88);
  world.add(glass);

  const glassOuterMaterial = new THREE.MeshPhysicalMaterial({
    color: "#f3fbff",
    roughness: 0.055,
    metalness: 0,
    transparent: true,
    opacity: 0.19,
    transmission: 0.92,
    thickness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const glassBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.405, 0.34, 1.30, 72, 1, true),
    glassOuterMaterial,
  );
  glassBody.position.y = 0.65;
  glassBody.castShadow = true;
  glass.add(glassBody);

  const rimMaterial = new THREE.MeshPhysicalMaterial({ color: "#f9ffff", roughness: 0.07, metalness: 0.06, clearcoat: 1 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.405, 0.026, 12, 72), rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.30;
  glass.add(rim);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.085, 64), rimMaterial);
  base.position.y = 0.045;
  base.castShadow = true;
  glass.add(base);

  const liquidMaterial = new THREE.MeshPhysicalMaterial({
    color: "#4b170e",
    roughness: 0.14,
    metalness: 0.01,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.325, 0.92, 64), liquidMaterial);
  liquid.position.y = 0.12 + 0.27;
  liquid.scale.y = 0.28;
  liquid.castShadow = true;
  glass.add(liquid);
  const liquidSurfaceGeometry = new THREE.CircleGeometry(0.333, 64);
  liquidSurfaceGeometry.rotateX(-Math.PI / 2);
  const liquidSurfacePositions = liquidSurfaceGeometry.attributes.position as THREE.BufferAttribute;
  const liquidSurfaceBase = new Float32Array(liquidSurfacePositions.array as Float32Array);
  const liquidSurface = new THREE.Mesh(
    liquidSurfaceGeometry,
    new THREE.MeshPhysicalMaterial({ color: "#7c2d16", roughness: 0.11, clearcoat: 1, side: THREE.DoubleSide }),
  );
  liquidSurface.position.y = 0.39;
  glass.add(liquidSurface);

  const iceMaterial = new THREE.MeshPhysicalMaterial({
    color: "#ebfaff",
    roughness: 0.08,
    metalness: 0.015,
    transparent: true,
    opacity: 0.78,
    transmission: 0.72,
    thickness: 0.28,
    clearcoat: 1,
  });
  const iceCubes: THREE.Group[] = [];
  const icePositions = [
    [-0.13, 0.88, -0.11],
    [0.13, 1.02, 0.13],
    [-0.12, 1.16, 0.14],
    [0.15, 0.78, -0.14],
  ];
  icePositions.forEach((position, index) => {
    const cube = makeIceCube(index, iceMaterial);
    cube.position.set(position[0], position[1], position[2]);
    glass.add(cube);
    iceCubes.push(cube);
  });

  const bubbleMaterial = new THREE.MeshBasicMaterial({ color: "#fffaf0", transparent: true, opacity: 0.82 });
  const bubbles: THREE.Mesh[] = [];
  for (let i = 0; i < 28; i += 1) {
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.012 + (i % 4) * 0.006, 10, 8), bubbleMaterial);
    bubble.position.set(Math.sin(i * 2.1) * 0.23, 0.15 + (i % 8) * 0.075, Math.cos(i * 1.7) * 0.22);
    bubbles.push(bubble);
    glass.add(bubble);
  }

  // A continuous, dynamically deformed liquid column. Its first vertex is
  // anchored to the bottle's actual inner mouth; gravity bends the stream.
  const streamMaterial = new THREE.MeshPhysicalMaterial({
    color: "#632311",
    roughness: 0.075,
    metalness: 0.015,
    clearcoat: 1,
    clearcoatRoughness: 0.045,
    side: THREE.DoubleSide,
  });
  const streamSegments = 28;
  const streamRadialSegments = 10;
  const streamPositions = new Float32Array((streamSegments + 1) * (streamRadialSegments + 1) * 3);
  const streamIndices: number[] = [];
  for (let y = 0; y <= streamSegments; y += 1) {
    for (let x = 0; x <= streamRadialSegments; x += 1) {
      const current = y * (streamRadialSegments + 1) + x;
      if (y < streamSegments && x < streamRadialSegments) {
        const next = current + streamRadialSegments + 1;
        streamIndices.push(current, next, current + 1, next, next + 1, current + 1);
      }
    }
  }
  const streamGeometry = new THREE.BufferGeometry();
  const streamAttribute = new THREE.BufferAttribute(streamPositions, 3);
  streamAttribute.setUsage(THREE.DynamicDrawUsage);
  streamGeometry.setAttribute("position", streamAttribute);
  streamGeometry.setIndex(streamIndices);
  const stream = new THREE.Mesh(streamGeometry, streamMaterial);
  stream.frustumCulled = false;
  stream.visible = false;
  stream.castShadow = true;
  world.add(stream);

  // Satellite droplets follow the same nozzle velocity and gravity as the main stream.
  const dropletMaterial = new THREE.MeshPhysicalMaterial({
    color: "#8e351b",
    roughness: 0.09,
    metalness: 0.01,
    clearcoat: 1,
    transparent: true,
    opacity: 0.95,
  });
  const dropletGeometry = new THREE.SphereGeometry(0.026, 12, 10);
  const streamDroplets: THREE.Mesh[] = [];
  for (let i = 0; i < 18; i += 1) {
    const drop = new THREE.Mesh(dropletGeometry, dropletMaterial);
    const size = 0.42 + (i % 5) * 0.12;
    drop.scale.setScalar(size);
    drop.visible = false;
    world.add(drop);
    streamDroplets.push(drop);
  }

  const foamMaterial = new THREE.MeshPhysicalMaterial({
    color: "#d9a77b",
    roughness: 0.22,
    transparent: true,
    opacity: 0.34,
    clearcoat: 0.65,
  });
  const foam = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.016, 8, 64), foamMaterial);
  foam.rotation.x = Math.PI / 2;
  foam.visible = false;
  glass.add(foam);
  const impactDropletMaterial = new THREE.MeshPhysicalMaterial({
    color: "#8e351b",
    roughness: 0.10,
    clearcoat: 0.8,
    transparent: true,
    opacity: 0.82,
  });
  const impactDroplets: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i += 1) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.018 + (i % 3) * 0.006, 10, 8), impactDropletMaterial);
    drop.visible = false;
    glass.add(drop);
    impactDroplets.push(drop);
  }

  const key = new THREE.DirectionalLight("#fff1cf", 4.2);
  key.position.set(-5.5, 10.5, 5.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -11;
  key.shadow.camera.right = 11;
  key.shadow.camera.top = 11;
  key.shadow.camera.bottom = -11;
  key.shadow.bias = -0.00018;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 4;
  world.add(key);

  const skyFill = new THREE.DirectionalLight("#c8e9ff", 1.35);
  skyFill.position.set(2.5, 6, -8);
  world.add(skyFill);
  const bounce = new THREE.DirectionalLight("#f5d8a7", 1.1);
  bounce.position.set(2.5, 2.0, 7);
  world.add(bounce);
  world.add(new THREE.HemisphereLight("#ccecff", "#9d8058", 1.35));

  const oceanPosition = oceanGeometry.attributes.position;
  const mouthLocal = bottle.userData.mouthPoint as THREE.Vector3;
  const mouthWorld = new THREE.Vector3();
  const exitDirection = new THREE.Vector3();
  const gravity = new THREE.Vector3(0, -9.81, 0);
  const gravityHalf = new THREE.Vector3();
  const streamTangent = new THREE.Vector3();
  const streamSide = new THREE.Vector3();
  const streamNormal = new THREE.Vector3();
  const streamPoint = new THREE.Vector3();
  const streamVelocity = new THREE.Vector3();
  const glassImpactLocal = new THREE.Vector3();
  const streamFlightTime = 0.34;
  const streamSpeed = 1.9;
  const referenceAxis = new THREE.Vector3(0, 0, 1);
  const alternateAxis = new THREE.Vector3(1, 0, 0);

  const ease = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };

  const update = (time: number) => {
    const pourAngle = 0.06 + 2.29 * ease((time - 3.0) / 0.98);
    const returnAngle = 2.29 * (1 - ease((time - 6.08) / 0.88));
    bottle.rotation.z = time < 3.0 ? 0.06 : time < 6.08 ? pourAngle : 0.06 + returnAngle;
    bottle.rotation.y = 0.02 + Math.sin(Math.min(time, 7.1) * 1.1) * 0.018;
    bottle.position.y = 0.12 + Math.sin(Math.min(time, 7.1) * 1.35) * 0.012;
    bottle.updateMatrixWorld(true);

    // The liquid only leaves the bottle once the neck is angled downward.
    const pourIn = ease((time - 3.90) / 0.28);
    const pourOut = 1 - ease((time - 6.38) / 0.34);
    const pourStrength = pourIn * pourOut;
    bottle.localToWorld(mouthWorld.copy(mouthLocal));
    exitDirection.set(0, 1, 0).applyQuaternion(bottle.quaternion).normalize();

    // Ballistic trajectory: v is aligned to the bottle opening, then gravity
    // accelerates the cola down into the inner footprint of the glass.
    streamVelocity.copy(exitDirection).multiplyScalar(streamSpeed);
    gravityHalf.copy(gravity).multiplyScalar(0.5);
    const flightEnd = mouthWorld.clone()
      .addScaledVector(streamVelocity, streamFlightTime)
      .addScaledVector(gravityHalf, streamFlightTime * streamFlightTime);

    stream.visible = pourStrength > 0.018;
    if (stream.visible) {
      const positions = streamGeometry.attributes.position as THREE.BufferAttribute;
      const array = positions.array as Float32Array;
      const zAxis = Math.abs(exitDirection.dot(referenceAxis)) > 0.92 ? alternateAxis : referenceAxis;
      for (let ring = 0; ring <= streamSegments; ring += 1) {
        const u = ring / streamSegments;
        const seconds = u * streamFlightTime;
        streamPoint.copy(mouthWorld)
          .addScaledVector(streamVelocity, seconds)
          .addScaledVector(gravityHalf, seconds * seconds);
        streamTangent.copy(streamVelocity).addScaledVector(gravity, seconds).normalize();
        streamSide.crossVectors(streamTangent, zAxis).normalize();
        streamNormal.crossVectors(streamTangent, streamSide).normalize();
        const pulse = 1 + Math.sin(time * 24 - u * 16) * 0.055;
        const taper = 0.80 + 0.20 * Math.sin(Math.PI * u);
        const radius = 0.044 * pulse * taper * (0.93 + 0.07 * pourStrength);
        for (let radial = 0; radial <= streamRadialSegments; radial += 1) {
          const angle = (radial / streamRadialSegments) * Math.PI * 2;
          const offsetSide = Math.cos(angle) * radius;
          const offsetNormal = Math.sin(angle) * radius;
          const vertex = (ring * (streamRadialSegments + 1) + radial) * 3;
          array[vertex] = streamPoint.x + streamSide.x * offsetSide + streamNormal.x * offsetNormal;
          array[vertex + 1] = streamPoint.y + streamSide.y * offsetSide + streamNormal.y * offsetNormal;
          array[vertex + 2] = streamPoint.z + streamSide.z * offsetSide + streamNormal.z * offsetNormal;
        }
      }
      positions.needsUpdate = true;
      streamGeometry.computeVertexNormals();
      streamGeometry.computeBoundingSphere();
    }

    // Small satellite droplets are emitted from the same opening and use
    // the same nozzle velocity and gravity, not arbitrary positions around the glass.
    streamDroplets.forEach((drop, index) => {
      const stagger = index * 0.035;
      const cycle = 0.40;
      const age = ((time - 3.94 + stagger) % cycle + cycle) % cycle;
      const visible = time >= 3.94 && pourStrength > 0.14 && age < streamFlightTime;
      drop.visible = visible;
      if (!visible) return;
      const lateral = Math.sin(index * 2.17) * 0.018;
      drop.position.copy(mouthWorld)
        .addScaledVector(streamVelocity, age)
        .addScaledVector(gravityHalf, age * age)
        .addScaledVector(streamSide, lateral);
      const fade = Math.min(1, pourStrength * 2, (streamFlightTime - age) * 5);
      drop.scale.setScalar((0.42 + (index % 5) * 0.12) * Math.max(0.2, fade));
    });

    // The cup level rises only while the stream is actually entering it.
    const fillAmount = 0.24 + 0.43 * ease((time - 3.90) / 2.55);
    liquid.scale.y = fillAmount;
    liquid.position.y = 0.10 + fillAmount * 0.46;
    const surfaceY = 0.10 + fillAmount * 0.92;
    liquidSurface.position.y = surfaceY;
    const surfaceArray = liquidSurfacePositions.array as Float32Array;
    for (let i = 0; i < surfaceArray.length; i += 3) {
      const x = liquidSurfaceBase[i];
      const z = liquidSurfaceBase[i + 2];
      const radial = Math.sqrt(x * x + z * z);
      const ripple = pourStrength * Math.max(0, 1 - radial / 0.34)
        * (Math.sin(radial * 47 - time * 19) * 0.014 + Math.sin(x * 31 + z * 17 + time * 13) * 0.006);
      surfaceArray[i + 1] = liquidSurfaceBase[i + 1] + ripple;
    }
    liquidSurfacePositions.needsUpdate = true;
    liquidSurfaceGeometry.computeVertexNormals();

    iceCubes.forEach((cube, index) => {
      const hitImpulse = pourStrength * (0.035 + (index % 2) * 0.012);
      cube.rotation.x = 0.12 * index + Math.sin(time * 1.15 + index) * 0.035 + hitImpulse;
      cube.rotation.y = 0.28 * index + Math.sin(time * 1.35 + index) * 0.055;
      cube.position.y = icePositions[index][1] + Math.sin(time * 1.4 + index) * 0.012 + hitImpulse;
    });
    bubbles.forEach((bubble, index) => {
      const phase = (time * 0.42 + index / bubbles.length) % 1;
      bubble.position.y = 0.12 + phase * 0.96;
      bubble.visible = phase < 0.9 && fillAmount > 0.3;
    });

    glass.updateMatrixWorld(true);
    glass.worldToLocal(glassImpactLocal.copy(flightEnd));
    const impactX = Math.max(-0.22, Math.min(0.22, glassImpactLocal.x));
    const impactZ = Math.max(-0.22, Math.min(0.22, glassImpactLocal.z));
    foam.visible = pourStrength > 0.08;
    foam.position.set(impactX, surfaceY + 0.012, impactZ);
    foam.scale.setScalar(0.72 + pourStrength * 0.6);
    (foam.material as THREE.MeshPhysicalMaterial).opacity = 0.18 + pourStrength * 0.26;
    impactDroplets.forEach((drop, index) => {
      const phase = (time * 2.8 + index / impactDroplets.length) % 1;
      drop.visible = pourStrength > 0.16 && phase < 0.72;
      const angle = index * 2.4;
      const radius = 0.055 + phase * 0.12;
      drop.position.set(
        impactX + Math.cos(angle) * radius,
        surfaceY + 0.015 + Math.sin(phase * Math.PI) * (0.055 + (index % 3) * 0.018),
        impactZ + Math.sin(angle) * radius,
      );
    });

    const positions = oceanPosition.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = oceanBase[i];
      const z = oceanBase[i + 2];
      positions[i + 1] = oceanBase[i + 1]
        + Math.sin(x * 0.72 + time * 1.7) * 0.052
        + Math.cos(z * 0.82 - time * 1.2) * 0.026;
    }
    oceanPosition.needsUpdate = true;
    oceanGeometry.computeVertexNormals();
    cloudGroups.forEach((cloud) => {
      cloud.position.x = (cloud.userData.baseX as number) + Math.sin(time * 0.12 + (cloud.userData.phase as number)) * 0.34;
      cloud.position.y = (cloud.userData.baseY as number) + Math.sin(time * 0.18 + (cloud.userData.phase as number)) * 0.055;
    });
    foamBands.forEach((band, index) => {
      band.position.x = Math.sin(time * 0.22 + index) * (0.5 + index * 0.15);
    });
  };

  return { bottle, glass, update };
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawTextFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  preferredSize: number,
  color: string,
  weight = 800,
  align: CanvasTextAlign = "center",
) {
  let size = preferredSize;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  while (size > 16) {
    ctx.font = weight + " " + size + "px Arial, Helvetica, sans-serif";
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y, maxWidth);
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawCocaColaPoolsideOverlay(
  ctx: CanvasRenderingContext2D,
  time: number,
  width: number,
  height: number,
) {
  const ease = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const white = "#fffdf8";
  const red = "#ef233c";
  const scale = width / 720;

  const topShade = ctx.createLinearGradient(0, 0, 0, height * 0.24);
  topShade.addColorStop(0, "rgba(8,32,48,.45)");
  topShade.addColorStop(1, "rgba(8,32,48,0)");
  ctx.fillStyle = topShade;
  ctx.fillRect(0, 0, width, height * 0.24);

  const brandW = width * 0.42;
  const brandH = height * 0.038;
  const brandX = (width - brandW) / 2;
  const brandY = height * 0.045;
  roundedRect(ctx, brandX, brandY, brandW, brandH, brandH / 2);
  ctx.fillStyle = "rgba(6,24,36,.72)";
  ctx.fill();
  drawTextFit(ctx, "INGREDORA ORIGINALS", width / 2, brandY + brandH / 2, brandW * 0.88, 18 * scale, white, 900);

  if (time < 3.0) {
    const intro = ease(time / 0.36);
    ctx.save();
    ctx.globalAlpha = intro;
    ctx.shadowColor = "rgba(4,24,40,.48)";
    ctx.shadowBlur = 18 * scale;
    drawTextFit(ctx, "UN DÍA DE CALOR…", width / 2, height * 0.205, width * 0.88, 49 * scale, white, 900);
    ctx.shadowBlur = 0;
    drawTextFit(ctx, "PLAYA, SOL Y UNA COCA BIEN FRÍA", width / 2, height * 0.252, width * 0.9, 24 * scale, "#fff0b7", 800);
    ctx.restore();
  } else if (time < 7.2) {
    const close = ease((time - 3.0) / 0.3) * (1 - ease((time - 6.6) / 0.5));
    ctx.save();
    ctx.globalAlpha = close * 0.92;
    roundedRect(ctx, width * 0.12, height * 0.12, width * 0.76, height * 0.052, height * 0.026);
    ctx.fillStyle = "rgba(4,19,29,.66)";
    ctx.fill();
    drawTextFit(ctx, "HIELO · BURBUJAS · BIEN FRÍA", width / 2, height * 0.146, width * 0.70, 20 * scale, white, 850);
    ctx.restore();
  } else if (time < 10) {
    const intro = ease((time - 7.2) / 0.22);
    ctx.save();
    ctx.globalAlpha = intro;
    ctx.fillStyle = "rgba(5,19,28,.20)";
    ctx.fillRect(0, 0, width, height);
    roundedRect(ctx, width * 0.085, height * 0.20, width * 0.83, height * 0.18, height * 0.025);
    ctx.fillStyle = "rgba(4,18,27,.78)";
    ctx.fill();
    drawTextFit(ctx, "PERO PARÁ…", width / 2, height * 0.255, width * 0.72, 46 * scale, "#fff0b7", 900);
    drawTextFit(ctx, "¿SABÉS QUÉ TIENE ADENTRO?", width / 2, height * 0.32, width * 0.74, 32 * scale, white, 900);
    ctx.restore();
  } else if (time < 16) {
    const elapsed = Math.max(0, Math.min(5.999, time - 10));
    const remaining = Math.max(1, 6 - Math.floor(elapsed));
    const pulse = 1 + Math.sin(time * 9) * 0.018;
    const panelW = width * 0.74;
    const panelH = height * 0.37;
    const panelX = (width - panelW) / 2;
    const panelY = height * 0.265;
    roundedRect(ctx, panelX, panelY, panelW, panelH, panelH * 0.10);
    const panel = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
    panel.addColorStop(0, "rgba(5,24,36,.80)");
    panel.addColorStop(1, "rgba(6,20,29,.92)");
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,240,183,.48)";
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    drawTextFit(ctx, "TENÉS", width / 2, panelY + panelH * 0.18, panelW * 0.8, 29 * scale, white, 900);
    ctx.save();
    ctx.translate(width / 2, panelY + panelH * 0.50);
    ctx.scale(pulse, pulse);
    ctx.font = "900 " + Math.round(190 * scale) + "px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = remaining <= 2 ? red : "#fffdf8";
    ctx.shadowColor = remaining <= 2 ? "rgba(239,35,60,.62)" : "rgba(255,255,255,.28)";
    ctx.shadowBlur = 30 * scale;
    ctx.fillText(String(remaining), 0, 0);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = "rgba(255,225,154,.25)";
    ctx.shadowBlur = 16 * scale;
    drawTextFit(ctx, "SEGUNDOS", width / 2, panelY + panelH * 0.76, panelW * 0.82, 34 * scale, "#fff0b7", 900);
    ctx.restore();
    const barX = panelX + panelW * 0.12;
    const barY = panelY + panelH * 0.90;
    const barW = panelW * 0.76;
    roundedRect(ctx, barX, barY, barW, height * 0.008, height * 0.004);
    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.fill();
    roundedRect(ctx, barX, barY, barW * (elapsed / 6), height * 0.008, height * 0.004);
    ctx.fillStyle = red;
    ctx.fill();
    drawTextFit(ctx, "PARA ADIVINAR", width / 2, height * 0.685, width * 0.8, 25 * scale, white, 800);
  } else if (time < 29.35) {
    const reveal = ease((time - 16) / 0.34);
    ctx.save();
    ctx.fillStyle = "rgba(4,18,27,.76)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = reveal;
    drawTextFit(ctx, "ESTOS SON SUS INGREDIENTES", width / 2, height * 0.145, width * 0.92, 36 * scale, "#fff0b7", 900);
    drawTextFit(ctx, "COCA-COLA SABOR ORIGINAL · ARGENTINA", width / 2, height * 0.188, width * 0.9, 17 * scale, "rgba(255,255,255,.82)", 700);
    const ingredients = [
      "AGUA CARBONATADA",
      "AZÚCAR O JARABE DE MAÍZ DE ALTA FRUCTOSA",
      "COLORANTE CARAMELO IV (E150d)",
      "ÁCIDO FOSFÓRICO (E338)",
      "AROMATIZANTES",
      "SUCRALOSA (4,3 mg/100 ml)",
    ];
    const gridX = width * 0.055;
    const gridY = height * 0.235;
    const gridW = width * 0.89;
    const gapX = width * 0.022;
    const gapY = height * 0.018;
    const cardW = (gridW - gapX) / 2;
    const cardH = height * 0.155;
    ingredients.forEach((ingredient, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = gridX + col * (cardW + gapX);
      const y = gridY + row * (cardH + gapY);
      roundedRect(ctx, x, y, cardW, cardH, cardH * 0.12);
      const cardGradient = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
      cardGradient.addColorStop(0, "rgba(9,34,49,.96)");
      cardGradient.addColorStop(1, "rgba(12,26,34,.94)");
      ctx.fillStyle = cardGradient;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.20)";
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      const badgeX = x + cardW * 0.14;
      const badgeY = y + cardH * 0.5;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, cardH * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = red;
      ctx.fill();
      drawTextFit(ctx, String(index + 1), badgeX, badgeY, cardH * 0.25, 24 * scale, white, 900);
      const textX = x + cardW * 0.28;
      const textWidth = cardW * 0.66;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      let fontSize = 22 * scale;
      ctx.font = "850 " + Math.round(fontSize) + "px Arial, Helvetica, sans-serif";
      let lines = wrapCanvasText(ctx, ingredient, textWidth);
      while (lines.length > 3 && fontSize > 16 * scale) {
        fontSize -= 1.5 * scale;
        ctx.font = "850 " + Math.round(fontSize) + "px Arial, Helvetica, sans-serif";
        lines = wrapCanvasText(ctx, ingredient, textWidth);
      }
      const lineHeight = fontSize * 1.18;
      const textStartY = badgeY - ((lines.length - 1) * lineHeight) / 2;
      ctx.fillStyle = white;
      lines.slice(0, 3).forEach((line, lineIndex) => {
        ctx.fillText(line, textX, textStartY + lineIndex * lineHeight, textWidth);
      });
    });
    roundedRect(ctx, width * 0.12, height * 0.77, width * 0.76, height * 0.062, height * 0.031);
    ctx.fillStyle = "rgba(239,35,60,.94)";
    ctx.fill();
    drawTextFit(ctx, "TAMBIÉN CONTIENE CAFEÍNA", width / 2, height * 0.801, width * 0.70, 21 * scale, white, 900);
    ctx.restore();
  } else {
    const p = ease((time - 29.35) / 0.42);
    ctx.save();
    ctx.fillStyle = "rgba(3,17,27,.58)";
    ctx.fillRect(0, height * 0.10, width, height * 0.82);
    ctx.globalAlpha = p;
    const glow = ctx.createRadialGradient(width / 2, height * 0.46, 0, width / 2, height * 0.46, width * 0.80);
    glow.addColorStop(0, "rgba(239,35,60,.28)");
    glow.addColorStop(0.55, "rgba(239,35,60,.09)");
    glow.addColorStop(1, "rgba(239,35,60,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, height * 0.12, width, height * 0.7);
    drawTextFit(ctx, "¿CUÁNTOS ACERTASTE?", width / 2, height * 0.35, width * 0.9, 43 * scale, white, 900);
    drawTextFit(ctx, "INGREDORA.COM", width / 2, height * 0.455, width * 0.92, 58 * scale, "#fff0b7", 900);
    roundedRect(ctx, width * 0.18, height * 0.52, width * 0.64, height * 0.074, height * 0.037);
    ctx.fillStyle = red;
    ctx.fill();
    drawTextFit(ctx, "¡JUGÁ EN INGREDORA!", width / 2, height * 0.557, width * 0.58, 24 * scale, white, 900);
    drawTextFit(ctx, "UN PRODUCTO · SEIS INGREDIENTES · UN DESAFÍO", width / 2, height * 0.645, width * 0.88, 16 * scale, white, 750);
    ctx.restore();
  }
}
