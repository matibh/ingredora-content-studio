import * as THREE from "three";
import type { ProductionPackage, ProductionScene, SceneObject } from "./types";

export type RenderProgress = { frame: number; totalFrames: number; percent: number };

function geometryFor(shape: SceneObject["shape"]): THREE.BufferGeometry {
  switch (shape) {
    case "sphere": return new THREE.SphereGeometry(0.5, 32, 24);
    case "cylinder": return new THREE.CylinderGeometry(0.5, 0.5, 1, 48);
    case "torus": return new THREE.TorusGeometry(0.5, 0.16, 16, 48);
    case "cone": return new THREE.ConeGeometry(0.5, 1, 48);
    default: return new THREE.BoxGeometry(1, 1, 1);
  }
}

function createObject(item: SceneObject): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.48, metalness: 0.04 });
  const mesh = new THREE.Mesh(geometryFor(item.shape), material);
  mesh.name = item.id;
  mesh.position.set(...item.position);
  mesh.scale.set(...item.scale);
  if (item.rotation) mesh.rotation.set(...item.rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function drawOverlay(ctx: CanvasRenderingContext2D, scene: ProductionScene, width: number, height: number) {
  const accent = scene.accentColor || "#d8f36a";
  const gradient = ctx.createLinearGradient(0, height * 0.55, 0, height);
  gradient.addColorStop(0, "rgba(9,25,18,0)");
  gradient.addColorStop(1, "rgba(9,25,18,0.78)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (scene.headline) {
    const headlineSize = Math.round(width * 0.085);
    ctx.font = `800 ${headlineSize}px Arial, Helvetica, sans-serif`;
    ctx.lineWidth = Math.max(2, width * 0.004);
    ctx.strokeStyle = "rgba(8,20,14,.35)";
    ctx.fillStyle = "#ffffff";
    const words = scene.headline.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (ctx.measureText(candidate).width > width * 0.84 && line) { lines.push(line); line = word; }
      else line = candidate;
    }
    if (line) lines.push(line);
    const lineHeight = headlineSize * 1.08;
    const startY = height * 0.76 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((text, index) => {
      const y = startY + index * lineHeight;
      ctx.strokeText(text, width / 2, y, width * 0.9);
      ctx.fillText(text, width / 2, y, width * 0.9);
    });
  }
  if (scene.subline) {
    ctx.font = `600 ${Math.round(width * 0.032)}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = accent;
    ctx.fillText(scene.subline.toUpperCase(), width / 2, height * 0.91, width * 0.86);
  }
  ctx.fillStyle = "rgba(255,255,255,.68)";
  ctx.font = `700 ${Math.round(width * 0.018)}px Arial, Helvetica, sans-serif`;
  ctx.fillText("INGREDORA", width / 2, height * 0.055);
}

function sceneAtFrame(pkg: ProductionPackage, frame: number): ProductionScene {
  return [...pkg.scenes].reverse().find((scene) => frame >= scene.startFrame) ?? pkg.scenes[0];
}

function validatePackage(pkg: ProductionPackage) {
  if (pkg.schemaVersion !== 1 || pkg.engineVersion !== "1.0.0") throw new Error("Versión del paquete o motor no compatible.");
  if (!pkg.id || !pkg.title || !pkg.scenes.length) throw new Error("El paquete necesita ID, título y al menos una escena.");
  if (!Number.isInteger(pkg.fps) || pkg.fps < 24 || pkg.fps > 60) throw new Error("FPS fuera del rango permitido (24–60).");
  if (pkg.width < 320 || pkg.height < 320 || pkg.width * pkg.height > 2_500_000) throw new Error("Resolución no permitida para el render inicial.");
  const ids = new Set<string>();
  for (const scene of pkg.scenes) {
    if (!scene.id || ids.has(scene.id) || scene.startFrame < 0 || scene.durationFrames < 1) throw new Error("Escena inválida o con ID duplicado.");
    ids.add(scene.id);
    for (const item of scene.objects) {
      if (!item.id || !["box", "sphere", "cylinder", "torus", "cone"].includes(item.shape)) throw new Error("Objeto de escena no reconocido.");
      if (![...item.position, ...item.scale].every(Number.isFinite)) throw new Error("Transformación de objeto inválida.");
    }
  }
}

export async function renderPackageToWebM(
  pkg: ProductionPackage,
  onProgress: (progress: RenderProgress) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  validatePackage(pkg);
  if (!("MediaRecorder" in window) || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error("Este navegador no ofrece captura de video compatible. No se usó ningún servicio externo.");
  }

  const totalFrames = Math.max(...pkg.scenes.map((scene) => scene.startFrame + scene.durationFrames));
  const fps = pkg.fps;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(pkg.width, pkg.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const output = document.createElement("canvas");
  output.width = pkg.width;
  output.height = pkg.height;
  const ctx = output.getContext("2d", { alpha: false });
  if (!ctx) { renderer.dispose(); throw new Error("No se pudo preparar el lienzo de composición."); }

  const stream = output.captureStream(fps);
  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) { stream.getTracks().forEach((track) => track.stop()); renderer.dispose(); throw new Error("No hay un codec WebM compatible en este navegador."); }
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: pkg.width >= 1000 ? 8_000_000 : 5_000_000 });
  const chunks: BlobPart[] = [];
  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => reject(new Error("Falló la codificación del video en el navegador."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  const world = new THREE.Scene();
  const ambient = new THREE.HemisphereLight(0xffffff, 0x273b2c, 2.0);
  world.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(-3, 5, 6);
  key.castShadow = true;
  world.add(key);
  const rim = new THREE.DirectionalLight(0x9fcb83, 1.8);
  rim.position.set(4, 2, -4);
  world.add(rim);

  const camera = new THREE.PerspectiveCamera(34, pkg.width / pkg.height, 0.1, 100);
  const sceneObjects = new Map<string, THREE.Mesh>();
  const materialObjects = new Map<string, SceneObject>();
  let lastSceneId = "";

  const drawFrame = (frame: number) => {
    const current = sceneAtFrame(pkg, frame);
    if (current.id !== lastSceneId) {
      for (const object of sceneObjects.values()) {
        world.remove(object);
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      }
      sceneObjects.clear();
      materialObjects.clear();
      current.objects.forEach((item) => {
        const mesh = createObject(item);
        sceneObjects.set(item.id, mesh);
        materialObjects.set(item.id, item);
        world.add(mesh);
      });
      lastSceneId = current.id;
    }

    world.background = new THREE.Color(current.background);
    const cameraPosition = current.camera?.position || [0, 0.4, 7];
    const cameraTarget = current.camera?.target || [0, 0, 0];
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    camera.lookAt(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
    camera.fov = current.camera?.fov || 34;
    camera.updateProjectionMatrix();

    const localFrame = frame - current.startFrame;
    const time = localFrame / fps;
    for (const [id, mesh] of sceneObjects) {
      const item = materialObjects.get(id)!;
      const animation = item.animation;
      mesh.position.set(...item.position);
      mesh.rotation.set(...(item.rotation || [0, 0, 0]));
      mesh.scale.set(...item.scale);
      if (animation?.type === "float-rotate") {
        mesh.position.y += Math.sin(time * (animation.speed || 1.4) + (animation.phase || 0)) * (animation.amount || 0.18);
        mesh.rotation.y += time * (animation.speed || 1.4);
      } else if (animation?.type === "rotate") {
        mesh.rotation.y += time * (animation.speed || 1.2);
      } else if (animation?.type === "pulse") {
        const pulse = 1 + Math.sin(time * (animation.speed || 2)) * (animation.amount || 0.08);
        mesh.scale.multiplyScalar(pulse);
      }
    }

    renderer.render(world, camera);
    ctx.drawImage(renderer.domElement, 0, 0, pkg.width, pkg.height);
    drawOverlay(ctx, current, pkg.width, pkg.height);
  };

  return new Promise<Blob>((resolve, reject) => {
    let frame = 0;
    let timerId = 0;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timerId);
      signal?.removeEventListener("abort", onAbort);
      if (recorder.state !== "inactive") recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
      for (const object of sceneObjects.values()) {
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (error) reject(error);
      else void recorded.then(resolve, reject);
    };
    const onAbort = () => finish(new Error("Render cancelado."));
    if (signal?.aborted) { finish(new Error("Render cancelado.")); return; }
    signal?.addEventListener("abort", onAbort, { once: true });
    recorder.start(250);

    const tick = () => {
      try {
        if (signal?.aborted) { onAbort(); return; }
        drawFrame(frame);
        frame += 1;
        onProgress({ frame, totalFrames, percent: Math.min(100, Math.round((frame / totalFrames) * 100)) });
        if (frame >= totalFrames) {
          timerId = window.setTimeout(() => finish(), 1000 / fps);
          return;
        }
        timerId = window.setTimeout(tick, 1000 / fps);
      } catch (error) {
        finish(error instanceof Error ? error : new Error("Error inesperado durante el render."));
      }
    };
    tick();
  });
}
