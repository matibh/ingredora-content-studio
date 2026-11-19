import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  canEncodeAudio,
  canEncodeVideo,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
} from "mediabunny";

export type Mp4ConversionProgress = (progress: number) => void;

/**
 * Independent finishing stage: converts an already-rendered WebM into MP4.
 * It never touches or replaces the original WebM Blob.
 */
export async function convertWebMToMp4(
  sourceBlob: Blob,
  onProgress: Mp4ConversionProgress = () => undefined,
): Promise<Blob> {
  if (!sourceBlob || sourceBlob.size === 0) {
    throw new Error("No encontramos el video original para convertir.");
  }

  const [videoSupported, audioSupported] = await Promise.all([
    canEncodeVideo("avc"),
    canEncodeAudio("aac"),
  ]);

  if (!videoSupported || !audioSupported) {
    const missing = [
      !videoSupported ? "H.264" : "",
      !audioSupported ? "AAC" : "",
    ].filter(Boolean).join(" y ");
    throw new Error(
      `Este navegador no tiene disponible el codificador ${missing}. El video original WebM sigue intacto; probá con Chrome actualizado o Edge.`,
    );
  }

  const input = new Input({
    source: new BlobSource(sourceBlob),
    formats: ALL_FORMATS,
  });
  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  });

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      codec: "avc",
      quality: new Quality("high"),
    },
    audio: {
      codec: "aac",
    },
  });

  if (!conversion.isValid) {
    throw new Error(
      "No se pudo preparar la conversión MP4. El navegador no pudo conservar las pistas de video y audio.",
    );
  }

  conversion.onProgress = (progress) => {
    onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
  };

  try {
    await conversion.execute();
    const buffer = target.buffer;
    if (!buffer || buffer.byteLength === 0) {
      throw new Error("La conversión terminó, pero no generó un archivo MP4.");
    }
    onProgress(100);
    return new Blob([buffer], { type: "video/mp4" });
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Ocurrió un error inesperado al convertir el video a MP4.");
  }
}
