import * as THREE from "three";
import {
  AudioBufferSource as MediabunnyAudioBufferSource,
  BufferTarget,
  canEncodeAudio,
  canEncodeVideo,
  CanvasSource,
  Output,
  Quality,
  WebMOutputFormat,
} from "mediabunny";
import { generateOriginalSoundtrack } from "./audio";
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

function makeCanvasTexture(draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, width = 1024, height = 768) {
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No se pudo crear la etiqueta del producto.");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; return texture;
}

function createNutellaSet(world: THREE.Scene) {
  world.background = new THREE.Color("#d8d4c9"); world.fog = new THREE.Fog("#d8d4c9", 11, 24);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 26), new THREE.MeshStandardMaterial({ color: "#aaa69b", roughness: 0.88 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -2.25, -2); world.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), new THREE.MeshStandardMaterial({ color: "#e7e4dc", roughness: 1 }));
  wall.position.set(0, 2.5, -5.5); world.add(wall);
  const shelfMat = new THREE.MeshStandardMaterial({ color: "#45494a", roughness: 0.58, metalness: 0.32 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: "#c5c4bd", roughness: 0.45, metalness: 0.55 });
  const colors = ["#e6d5ad","#9d3428","#d6a92c","#426b53","#e5e0d3","#3c4650","#bd6e35","#8b9a6d"];
  for (let row=0; row<4; row++) {
    const y=-1.25+row*1.05;
    const shelf=new THREE.Mesh(new THREE.BoxGeometry(14,.12,1.15),shelfMat); shelf.position.set(0,y,-4.15); world.add(shelf);
    const lip=new THREE.Mesh(new THREE.BoxGeometry(14,.13,.09),edgeMat); lip.position.set(0,y-.01,-3.55); world.add(lip);
    for(let i=0;i<20;i++){
      const x=-6.4+i*.67, h=.46+((i*7+row*3)%5)*.085, w=.34+(i%3)*.045;
      const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,.48),new THREE.MeshStandardMaterial({color:colors[(i+row*2)%colors.length],roughness:.72}));
      box.position.set(x,y+.12+h/2,-4.25+(i%2)*.04); world.add(box);
    }
    const strip=new THREE.Mesh(new THREE.BoxGeometry(14,.18,.08),new THREE.MeshStandardMaterial({color:"#f4f1e8",roughness:.8}));
    strip.position.set(0,y-.08,-3.49); world.add(strip);
    for(let i=0;i<7;i++){
      const tag=new THREE.Mesh(new THREE.BoxGeometry(.7,.09,.025),new THREE.MeshBasicMaterial({color:i===2?"#c83b2b":"#343a35"}));
      tag.position.set(-6+i*1.8,y-.08,-3.43); world.add(tag);
    }
  }
  for(const x of [-7.15,7.15]){const upright=new THREE.Mesh(new THREE.BoxGeometry(.16,5.4,.18),edgeMat);upright.position.set(x,.4,-4.05);world.add(upright);}
  const light=new THREE.Mesh(new THREE.BoxGeometry(5.2,.08,.45),new THREE.MeshBasicMaterial({color:"#fff4d8"}));light.position.set(-1.1,4.1,-1.5);world.add(light);

  const jar=new THREE.Group(); jar.position.set(0,-.35,.15); world.add(jar);
  const spread=new THREE.MeshPhysicalMaterial({color:"#4b2114",roughness:.28,clearcoat:.65,clearcoatRoughness:.2});
  const profile=[new THREE.Vector2(.58,-1.35),new THREE.Vector2(.72,-1.27),new THREE.Vector2(.82,-1.02),new THREE.Vector2(.86,-.35),new THREE.Vector2(.82,.55),new THREE.Vector2(.72,.94),new THREE.Vector2(.67,1.02),new THREE.Vector2(.67,1.22),new THREE.Vector2(.58,1.28),new THREE.Vector2(.56,1.18),new THREE.Vector2(.56,.95),new THREE.Vector2(0,.95)];
  const body=new THREE.Mesh(new THREE.LatheGeometry(profile,96),spread);body.castShadow=true;body.receiveShadow=true;jar.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.58,.62,.24,64),new THREE.MeshPhysicalMaterial({color:"#5b2919",roughness:.3,clearcoat:.5}));neck.position.y=1.12;jar.add(neck);
  const capMat=new THREE.MeshStandardMaterial({color:"#e52b22",roughness:.38});
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.69,.69,.32,96),capMat);cap.position.y=1.34;cap.castShadow=true;jar.add(cap);
  for(let i=0;i<48;i++){const a=i/48*Math.PI*2,ridge=new THREE.Mesh(new THREE.BoxGeometry(.035,.22,.035),capMat);ridge.position.set(Math.sin(a)*.685,1.34,Math.cos(a)*.685);ridge.rotation.y=a;jar.add(ridge);}
  const frontTex=makeCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#f7f4e8";ctx.fillRect(0,0,w,h);ctx.fillStyle="#171717";ctx.font="900 170px Arial";ctx.textAlign="center";ctx.fillText("n",270,330);ctx.fillStyle="#c92824";ctx.fillText("utella",590,330);
    ctx.fillStyle="#4b281b";ctx.beginPath();ctx.ellipse(w/2,535,290,125,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f2d7a4";ctx.font="bold 54px Arial";ctx.fillText("CREMA DE AVELLANAS",w/2,710);ctx.font="42px Arial";ctx.fillText("CON CACAO",w/2,770);
  },1024,900);
  const backTex=makeCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#f5f1e5";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#c8c0ad";ctx.lineWidth=12;ctx.strokeRect(24,24,w-48,h-48);
    ctx.fillStyle="#33291f";ctx.textAlign="left";ctx.font="bold 76px Arial";ctx.fillText("INGREDIENTES",72,145);ctx.font="48px Arial";
    ["Azúcar, aceite vegetal,","avellanas, leche descremada","en polvo, cacao en polvo","desgrasado, emulsificante","(lecitinas) y saborizante."].forEach((line,i)=>ctx.fillText(line,72,270+i*94));
    ctx.fillStyle="#6b6255";ctx.font="34px Arial";ctx.fillText("Nutella Argentina",72,805);
  },1024,900);
  const front=new THREE.Mesh(new THREE.PlaneGeometry(1.47,1.25),new THREE.MeshStandardMaterial({map:frontTex,roughness:.62}));front.position.set(0,.02,.835);jar.add(front);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(1.47,1.25),new THREE.MeshStandardMaterial({map:backTex,roughness:.7,side:THREE.DoubleSide}));back.position.set(0,.02,-.835);back.rotation.y=Math.PI;jar.add(back);
  const key=new THREE.DirectionalLight("#fff1d8",4.2);key.position.set(-3.5,5.5,6);world.add(key);
  const fill=new THREE.DirectionalLight("#ffffff",2.1);fill.position.set(4,1.8,4);world.add(fill);
  const rim=new THREE.PointLight("#ffbd73",32,12);rim.position.set(-2.8,.6,-.3);world.add(rim);
  world.add(new THREE.HemisphereLight("#ffffff","#665142",1.4));
  return {jar};
}

function drawNutellaOverlay(ctx: CanvasRenderingContext2D, frame: number, fps: number, width: number, height: number) {
  const time=frame/fps, back=time>=4.3&&time<8.1, y=height*.755;
  const gradient=ctx.createLinearGradient(0,y-90,0,height);gradient.addColorStop(0,"rgba(10,17,15,0)");gradient.addColorStop(.32,"rgba(10,17,15,.78)");gradient.addColorStop(1,"rgba(10,17,15,.92)");
  ctx.fillStyle=gradient;ctx.fillRect(0,y-90,width,height-y+90);
  ctx.fillStyle="rgba(8,17,14,.48)";ctx.beginPath();ctx.roundRect(width*.055,height*.035,width*.33,height*.047,18);ctx.fill();
  ctx.fillStyle="#d8f36a";ctx.font=`900 ${Math.round(width*.044)}px Arial`;ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText("INGREDORA",width*.078,height*.058);
  ctx.textAlign="center";ctx.fillStyle="#d8f36a";ctx.font=`800 ${Math.round(width*.026)}px Arial`;ctx.fillText(back?"DETRÁS DE LA ETIQUETA":"UN CLÁSICO EN LA GÓNDOLA",width/2,height*.785);
  ctx.fillStyle="#fff";ctx.font=`900 ${Math.round(width*.073)}px Arial`;ctx.fillText(back?"7 INGREDIENTES.":"NUTELLA.",width/2,height*.842);
  ctx.fillStyle="rgba(255,255,255,.9)";ctx.font=`500 ${Math.round(width*.025)}px Arial`;
  ctx.fillText(back?"Azúcar · aceite vegetal · avellanas · leche · cacao · lecitinas · saborizante":"Una receta reconocible. ¿Cuántos ingredientes conocés?",width/2,height*.895,width*.92);
  ctx.fillStyle="rgba(255,255,255,.62)";ctx.font=`600 ${Math.round(width*.018)}px Arial`;ctx.fillText("UN PRODUCTO REAL. UN DESAFÍO PARA TU MEMORIA.",width/2,height*.955);
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
  const orderedScenes = [...pkg.scenes].sort((a, b) => a.startFrame - b.startFrame);
  if (orderedScenes[0].startFrame !== 0) throw new Error("La primera escena debe comenzar en el frame 0.");
  let expectedStart = 0;
  for (const scene of orderedScenes) {
    if (!scene.id || ids.has(scene.id) || scene.startFrame !== expectedStart || scene.durationFrames < 1) throw new Error("La línea de tiempo tiene escenas duplicadas, superpuestas o con espacios vacíos.");
    ids.add(scene.id);
    expectedStart = scene.startFrame + scene.durationFrames;
    if (!/^#[0-9a-f]{6}$/i.test(scene.background) || (scene.accentColor && !/^#[0-9a-f]{6}$/i.test(scene.accentColor))) throw new Error("Color de escena inválido.");
    const objectIds = new Set<string>();
    for (const item of scene.objects) {
      if (!item.id || objectIds.has(item.id) || !["box", "sphere", "cylinder", "torus", "cone"].includes(item.shape)) throw new Error("Objeto de escena no reconocido o con ID duplicado.");
      objectIds.add(item.id);
      if (![...item.position, ...item.scale, ...(item.rotation || [])].every(Number.isFinite) || item.scale.some((value) => value === 0)) throw new Error("Transformación de objeto inválida.");
      if (!/^#[0-9a-f]{6}$/i.test(item.color)) throw new Error("Color de objeto inválido.");
    }
  }
}

async function selectEncoders(width: number, height: number, fps: number) {
  for (const codec of ["vp9", "vp8"] as const) {
    if (await canEncodeVideo(codec, { width, height, frameRate: fps })) {
      if (await canEncodeAudio("opus", { numberOfChannels: 2, sampleRate: 48_000 })) return codec;
      throw new Error("El navegador no puede codificar audio Opus. No se generará un video silencioso.");
    }
  }
  throw new Error("El navegador no dispone de un codificador WebM compatible (VP9/VP8).");
}

export async function renderPackageToWebM(
  pkg: ProductionPackage,
  onProgress: (progress: RenderProgress) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  validatePackage(pkg);
  const totalFrames = Math.max(...pkg.scenes.map((scene) => scene.startFrame + scene.durationFrames));
  const fps = pkg.fps;
  const durationSeconds = totalFrames / fps;
  const videoCodec = await selectEncoders(pkg.width, pkg.height, fps);
  if (signal?.aborted) throw new Error("Render cancelado.");

  // The soundtrack is synthesized offline; no AudioContext playback or user gesture is required.
  const soundtrack = await generateOriginalSoundtrack({ durationSeconds, sampleRate: 48_000 });
  if (signal?.aborted) throw new Error("Render cancelado.");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(pkg.width, pkg.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = pkg.width;
  outputCanvas.height = pkg.height;
  const ctx = outputCanvas.getContext("2d", { alpha: false });
  if (!ctx) {
    renderer.dispose();
    throw new Error("No se pudo preparar el lienzo de composición.");
  }

  const target = new BufferTarget();
  const output = new Output({ format: new WebMOutputFormat(), target });
  const videoSource = new CanvasSource(outputCanvas, {
    codec: videoCodec,
    quality: new Quality({ bitrate: pkg.width >= 1000 ? 8_000_000 : 5_000_000 }),
  });
  const audioSource = new MediabunnyAudioBufferSource({
    codec: "opus",
    quality: new Quality({ bitrate: 128_000 }),
  });
  output.addVideoTrack(videoSource, { frameRate: fps });
  output.addAudioTrack(audioSource);
  output.setMetadataTags({ title: pkg.title, artist: "Ingredora Content Studio", date: new Date(pkg.createdAt) });

  const world = new THREE.Scene();
  world.add(new THREE.HemisphereLight(0xffffff, 0x273b2c, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(-3, 5, 6);
  key.castShadow = true;
  world.add(key);
  const rim = new THREE.DirectionalLight(0x9fcb83, 1.8);
  rim.position.set(4, 2, -4);
  world.add(rim);

  const camera = new THREE.PerspectiveCamera(34, pkg.width / pkg.height, 0.1, 100);\n  const nutellaSet = pkg.visualPreset === "nutella-supermarket" ? createNutellaSet(world) : null;
  const sceneObjects = new Map<string, THREE.Mesh>();
  const materialObjects = new Map<string, SceneObject>();
  let lastSceneId = "";

  const drawFrame = (frame: number) => {
    if (nutellaSet) {
      const time = frame / fps;
      const turn = time < 3.2 ? 0 : time < 4.5 ? ((time - 3.2) / 1.3) * Math.PI : time < 8 ? Math.PI : Math.PI + ((time - 8) / Math.max(.1, durationSeconds - 8)) * Math.PI;
      nutellaSet.jar.rotation.y = turn;
      nutellaSet.jar.position.y = -.35 + Math.sin(time * 1.4) * .035;
      camera.position.set(.15,.48,8.7); camera.lookAt(0,-.15,0); camera.fov=32; camera.updateProjectionMatrix();
      renderer.render(world,camera); ctx.drawImage(renderer.domElement,0,0,pkg.width,pkg.height);
      drawNutellaOverlay(ctx,frame,fps,pkg.width,pkg.height); return;
    }
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

  let outputStarted = false;
  try {
    await output.start();
    outputStarted = true;
    await audioSource.add(soundtrack);
    audioSource.close();

    for (let frame = 0; frame < totalFrames; frame += 1) {
      if (signal?.aborted) throw new Error("Render cancelado.");
      drawFrame(frame);
      await videoSource.add(frame / fps, 1 / fps);
      onProgress({ frame: frame + 1, totalFrames, percent: Math.min(100, Math.round(((frame + 1) / totalFrames) * 100)) });
    }

    videoSource.close();
    await output.finalize();
    const buffer = target.buffer;
    if (!buffer || buffer.byteLength === 0) throw new Error("El render terminó sin generar un archivo audiovisual.");
    return new Blob([buffer], { type: await output.getMimeType() });
  } catch (error) {
    if (outputStarted && output.state !== "finalized" && output.state !== "canceled") {
      await output.cancel().catch(() => undefined);
    }
    throw error instanceof Error ? error : new Error("Error inesperado durante el render audiovisual.");
  } finally {
    for (const object of sceneObjects.values()) {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }
    renderer.dispose();
  }
}
