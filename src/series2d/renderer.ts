import {
  Application,
  Container,
  Graphics,
  Text,
} from "pixi.js";
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
import { createCharacter, updateCharacter, type CharacterRig } from "./characters";
import type { CharacterId, SitcomProductionPackage } from "./types";

export type Series2DRenderProgress = { frame: number; totalFrames: number; percent: number };

const WIDTH = 720;
const HEIGHT = 1280;
const INK = "#493C35";

function addShape(parent: Container, draw: (g: Graphics) => void, fill: string, stroke = INK, width = 4) {
  const g = new Graphics();
  draw(g);
  g.fill(fill);
  if (width > 0) g.stroke({ color: stroke, width, join: "round", cap: "round" });
  parent.addChild(g);
  return g;
}

function addLine(parent: Container, draw: (g: Graphics) => void, color: string, width: number) {
  const g = new Graphics();
  draw(g);
  g.stroke({ color, width, join: "round", cap: "round" });
  parent.addChild(g);
  return g;
}

function drawLivingRoom(stage: Container) {
  addShape(stage, g => g.rect(0, 0, WIDTH, HEIGHT), "#F4E8D7", "#F4E8D7", 0);
  addShape(stage, g => g.rect(0, 900, WIDTH, 380), "#C78C68", "#C78C68", 0);
  addShape(stage, g => g.rect(0, 890, WIDTH, 17), "#A96E54", "#A96E54", 0);

  // Window and curtains.
  addShape(stage, g => g.roundRect(38, 144, 165, 280, 20), "#FFF9EF", INK, 7);
  addShape(stage, g => g.roundRect(51, 157, 139, 254, 12), "#A8C9C6", "#D3E3D9", 3);
  addShape(stage, g => g.rect(117, 157, 7, 254), "#F7F0E4", "#F7F0E4", 0);
  addShape(stage, g => g.rect(51, 279, 139, 7), "#F7F0E4", "#F7F0E4", 0);
  addShape(stage, g => g.roundRect(26, 130, 20, 310, 10), "#D98D73", INK, 3);
  addShape(stage, g => g.roundRect(193, 130, 18, 310, 10), "#D98D73", INK, 3);

  // Wall art, low bookcase and a plant make the room lived-in.
  addShape(stage, g => g.roundRect(500, 142, 157, 124, 12), "#FFF8EC", INK, 5);
  addShape(stage, g => g.roundRect(513, 155, 131, 98, 7), "#A9C1AC", "#A9C1AC", 0);
  addShape(stage, g => {
    g.moveTo(529, 238).lineTo(563, 178).lineTo(590, 213).lineTo(612, 187).lineTo(632, 238).closePath();
  }, "#D9A64A", "#D9A64A", 0);
  addShape(stage, g => g.roundRect(514, 294, 136, 14, 6), "#9A684F", INK, 3);
  addShape(stage, g => g.roundRect(535, 308, 12, 66, 5), "#9A684F", INK, 2);
  addShape(stage, g => g.roundRect(614, 308, 12, 66, 5), "#9A684F", INK, 2);

  // Sofa with a clear seat line behind the cast.
  addShape(stage, g => g.roundRect(31, 635, 658, 315, 50), "#426E6C", INK, 8);
  addShape(stage, g => g.roundRect(52, 665, 616, 200, 35), "#58827D", "#365D5B", 5);
  addShape(stage, g => g.roundRect(35, 824, 650, 124, 24), "#365E5B", INK, 6);
  addShape(stage, g => g.roundRect(54, 838, 612, 91, 18), "#4D7772", "#315957", 4);
  addShape(stage, g => g.roundRect(52, 710, 94, 124, 18), "#D9A65A", INK, 4);
  addShape(stage, g => g.roundRect(572, 710, 94, 124, 18), "#D77D68", INK, 4);

  // Rug and small coffee table edge.
  addShape(stage, g => g.ellipse(360, 1000, 292, 51), "#E3C6A6", "#B78365", 4);
  addShape(stage, g => g.roundRect(75, 1014, 570, 18, 9), "#A96E54", INK, 3);
  addShape(stage, g => g.roundRect(104, 1028, 18, 49, 6), "#90604B", INK, 2);
  addShape(stage, g => g.roundRect(598, 1028, 18, 49, 6), "#90604B", INK, 2);

  const header = new Text({
    text: "EN EL DEPARTAMENTO",
    style: { fontFamily: "Arial", fontSize: 16, fontWeight: "700", fill: "#816C58", letterSpacing: 3 }
  });
  header.position.set(37, 55);
  stage.addChild(header);

  const rec = new Container();
  addShape(rec, g => g.roundRect(567, 46, 110, 42, 22), "#FFF9F0", INK, 3);
  addShape(rec, g => g.circle(588, 67, 7), "#D85C50", "#D85C50", 0);
  const recText = new Text({
    text: "REC",
    style: { fontFamily: "Arial", fontSize: 14, fontWeight: "800", fill: "#655347", letterSpacing: 1.5 }
  });
  recText.position.set(604, 56);
  rec.addChild(recText);
  stage.addChild(rec);
}

function validateSitcomPackage(pkg: SitcomProductionPackage) {
  if (pkg.schemaVersion !== 1 || pkg.engineVersion !== "pixi-2d-1.0.0") {
    throw new Error("Versión de paquete 2D no compatible.");
  }
  if (!pkg.id || !pkg.title || !pkg.voiceTrackUrl || !pkg.dialogue.length) {
    throw new Error("La serie necesita ID, título, pista de voces y diálogos.");
  }
  if (!Number.isInteger(pkg.fps) || pkg.fps < 24 || pkg.fps > 30) {
    throw new Error("El motor 2D admite entre 24 y 30 FPS en esta versión.");
  }
  if (pkg.width !== WIDTH || pkg.height !== HEIGHT) {
    throw new Error("El primer perfil de Entre Partidas debe ser 720 × 1280 (9:16).");
  }
  if (!Number.isFinite(pkg.durationSeconds) || pkg.durationSeconds <= 0 || pkg.durationSeconds > 90) {
    throw new Error("Duración de episodio no válida (máximo 90 segundos en esta versión).");
  }
  const known = new Set<CharacterId>(["martina", "bruno", "tomas", "valentina", "ernesto"]);
  const ids = new Set<CharacterId>();
  for (const character of pkg.characters) {
    if (!known.has(character.id) || ids.has(character.id)) throw new Error("Personaje desconocido o repetido.");
    if (![character.x, character.baselineY, character.scale].every(Number.isFinite) || character.scale <= 0) {
      throw new Error("Posición o escala de personaje no válida.");
    }
    ids.add(character.id);
  }
  if (ids.size < 2) throw new Error("Una escena de serie necesita al menos dos personajes.");
  const dialogueIds = new Set<string>();
  let previousStart = -1;
  for (const cue of pkg.dialogue) {
    if (!cue.id || dialogueIds.has(cue.id) || !known.has(cue.speaker) || !ids.has(cue.speaker)) {
      throw new Error("Diálogo con ID duplicado o hablante desconocido.");
    }
    if (!cue.text.trim() || cue.startSeconds < 0 || cue.endSeconds <= cue.startSeconds || cue.endSeconds > pkg.durationSeconds) {
      throw new Error("Tiempo o texto de diálogo no válido.");
    }
    if (cue.startSeconds < previousStart) throw new Error("Los diálogos deben estar ordenados cronológicamente.");
    if (cue.lookAt !== "camera" && !known.has(cue.lookAt)) throw new Error("Destino de mirada no válido.");
    dialogueIds.add(cue.id);
    previousStart = cue.startSeconds;
  }
}

async function selectSeriesEncoder(width: number, height: number, fps: number) {
  for (const codec of ["vp9", "vp8"] as const) {
    if (await canEncodeVideo(codec, { width, height, frameRate: fps })) {
      if (await canEncodeAudio("opus", { numberOfChannels: 2, sampleRate: 48_000 })) return codec;
      throw new Error("El navegador no puede codificar audio Opus. Se canceló el render para no generar una serie sin voces.");
    }
  }
  throw new Error("Este navegador no dispone de un codificador WebM VP9/VP8 compatible.");
}

type WordTiming = { text: string; start: number; end: number; speaker?: CharacterId };

async function loadWordTimings(url?: string): Promise<WordTiming[]> {
  if (!url) return [];
  const response = await fetch(import.meta.env.BASE_URL + url, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudieron cargar los tiempos de diálogo.");
  const value = await response.json() as { words?: WordTiming[] };
  return Array.isArray(value.words) ? value.words : [];
}

export async function renderSitcomPackageToWebM(
  pkg: SitcomProductionPackage,
  onProgress: (progress: Series2DRenderProgress) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  validateSitcomPackage(pkg);
  if (signal?.aborted) throw new Error("Render 2D cancelado.");

  const totalFrames = Math.round(pkg.durationSeconds * pkg.fps);
  const cameraRevealTime = pkg.dialogue.find(cue => cue.id === "07-martina")?.startSeconds ?? 23.6;
  const totalSamples = Math.ceil(pkg.durationSeconds * 48_000);
  const codec = await selectSeriesEncoder(pkg.width, pkg.height, pkg.fps);
  const audioUrl = import.meta.env.BASE_URL + pkg.voiceTrackUrl;
  const audioResponse = await fetch(audioUrl, { cache: "no-store" });
  if (!audioResponse.ok) throw new Error("No se pudo cargar la voz del prepiloto (" + audioResponse.status + ").");
  const audioBytes = await audioResponse.arrayBuffer();
  const decodeContext = new AudioContext({ sampleRate: 48_000 });
  let voice: AudioBuffer;
  try {
    voice = await decodeContext.decodeAudioData(audioBytes);
  } finally {
    await decodeContext.close();
  }
  if (!voice.duration || voice.length < 1) throw new Error("La pista de voces está vacía.");
  let voicePeak = 0;
  let voiceEnergy = 0;
  let sampleCount = 0;
  for (let channel = 0; channel < voice.numberOfChannels; channel += 1) {
    const samples = voice.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) {
      const value = Math.abs(samples[index]);
      if (value > voicePeak) voicePeak = value;
      voiceEnergy += samples[index] * samples[index];
      sampleCount += 1;
    }
  }
  const voiceRms = Math.sqrt(voiceEnergy / Math.max(1, sampleCount));
  if (voicePeak < 0.003 || voiceRms < 0.0002) {
    throw new Error("La mezcla de voces está prácticamente en silencio. Se canceló el render.");
  }

  const offline = new OfflineAudioContext(2, totalSamples, 48_000);
  const voiceSource = offline.createBufferSource();
  voiceSource.buffer = voice;
  const voiceGain = offline.createGain();
  voiceGain.gain.value = 0.92;
  const compressor = offline.createDynamicsCompressor();
  compressor.threshold.value = -10;
  compressor.knee.value = 8;
  compressor.ratio.value = 3.2;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.16;
  voiceSource.connect(voiceGain).connect(compressor).connect(offline.destination);
  voiceSource.start(0);
  const mixedAudio = await offline.startRendering();
  if (signal?.aborted) throw new Error("Render 2D cancelado.");

  const wordTimings = await loadWordTimings(pkg.wordTimingsUrl);
  const app = new Application();
  await app.init({
    width: pkg.width,
    height: pkg.height,
    backgroundColor: 0xF4E8D7,
    antialias: true,
    resolution: 1,
    autoStart: false,
    sharedTicker: false,
    preference: "webgl",
    powerPreference: "high-performance",
  });
  app.ticker.stop();

  const stage = app.stage;
  drawLivingRoom(stage);

  const floorY = 1077;
  const characters: CharacterRig[] = [];
  for (const placement of pkg.characters) {
    const rig = createCharacter(placement.id, placement.x, placement.baselineY || floorY, placement.scale);
    stage.addChild(rig.root);
    characters.push(rig);
  }

  const dialoguePanel = new Container();
  addShape(dialoguePanel, g => g.roundRect(31, 1110, 658, 142, 22), "#FFF9F0", "#59483E", 4);
  addShape(dialoguePanel, g => g.roundRect(31, 1110, 13, 142, 8), "#6A965D", "#6A965D", 0);
  const speaker = new Text({
    text: "",
    style: { fontFamily: "Arial", fontSize: 15, fontWeight: "800", fill: "#739064", letterSpacing: 2 }
  });
  speaker.position.set(63, 1131);
  const caption = new Text({
    text: "",
    style: {
      fontFamily: "Arial",
      fontSize: 27,
      fontWeight: "700",
      fill: "#493C35",
      wordWrap: true,
      wordWrapWidth: 600,
      breakWords: false,
      lineHeight: 34,
    }
  });
  caption.position.set(63, 1161);
  dialoguePanel.addChild(speaker, caption);
  stage.addChild(dialoguePanel);

  const target = new BufferTarget();
  const output = new Output({ format: new WebMOutputFormat(), target });
  const videoSource = new CanvasSource(app.canvas as HTMLCanvasElement, {
    codec,
    quality: new Quality({ bitrate: 5_000_000 }),
  });
  const audioSource = new MediabunnyAudioBufferSource({
    codec: "opus",
    quality: new Quality({ bitrate: 128_000 }),
  });
  output.addVideoTrack(videoSource, { frameRate: pkg.fps });
  output.addAudioTrack(audioSource);
  output.setMetadataTags({
    title: pkg.title,
    artist: "Ingredora Content Studio — Entre Partidas",
    date: new Date(pkg.createdAt),
  });

  let outputStarted = false;
  try {
    await output.start();
    outputStarted = true;
    await audioSource.add(mixedAudio);
    audioSource.close();

    for (let frame = 0; frame < totalFrames; frame += 1) {
      if (signal?.aborted) throw new Error("Render 2D cancelado.");
      const time = frame / pkg.fps;
      const activeCue = pkg.dialogue.find(cue => time >= cue.startSeconds && time <= cue.endSeconds);
      const cameraBeat = time >= cameraRevealTime;

      for (const rig of characters) {
        updateCharacter(
          rig,
          time,
          pkg.dialogue,
          pkg.characters.map(item => ({ id: item.id, x: item.x })),
          cameraBeat
        );
      }

      if (activeCue) {
        dialoguePanel.visible = true;
        speaker.text = activeCue.speaker.toUpperCase();
        caption.text = activeCue.text;
        const nameColor = activeCue.speaker === "bruno" ? "#D66F5A"
          : activeCue.speaker === "martina" ? "#A67B21"
          : activeCue.speaker === "tomas" ? "#5F8858"
          : activeCue.speaker === "valentina" ? "#367080" : "#A65F45";
        speaker.style.fill = nameColor;
        // A compact word-time signal drives the mouth more naturally than a perpetual flap.
        const word = wordTimings.find(item =>
          item.speaker === activeCue.speaker && time >= item.start && time <= item.end
        );
        const cueProgress = (time - activeCue.startSeconds) / Math.max(0.1, activeCue.endSeconds - activeCue.startSeconds);
        const mouthOpen = word
          ? Math.sin((time - word.start) * 31) > -0.15
          : Math.sin(cueProgress * Math.PI * 16) > 0.25;
        const rig = characters.find(item => item.id === activeCue.speaker);
        if (rig) {
          rig.mouth.clear();
          if (mouthOpen) {
            rig.mouth.ellipse(0, 31, 7.5, 5.8).fill("#723F42").stroke({ color: "#8A4E4B", width: 1.8 });
          } else {
            rig.mouth.moveTo(-8, 31).quadraticCurveTo(0, 36, 8, 31).stroke({ color: "#8A4E4B", width: 2.8, cap: "round" });
          }
        }
      } else {
        dialoguePanel.visible = false;
      }

      // At the final beat, every character deliberately turns their eyes toward the lens.
      app.renderer.render({ container: stage });
      await videoSource.add(time, 1 / pkg.fps);
      onProgress({
        frame: frame + 1,
        totalFrames,
        percent: Math.min(100, Math.round(((frame + 1) / totalFrames) * 100)),
      });
    }

    videoSource.close();
    await output.finalize();
    const buffer = target.buffer;
    if (!buffer || buffer.byteLength === 0) throw new Error("El motor 2D terminó sin generar un WebM.");
    return new Blob([buffer], { type: await output.getMimeType() });
  } catch (error) {
    if (outputStarted && output.state !== "finalized" && output.state !== "canceled") {
      await output.cancel().catch(() => undefined);
    }
    throw error instanceof Error ? error : new Error("Error inesperado durante el render de la serie 2D.");
  } finally {
    app.destroy();
  }
}
