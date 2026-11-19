import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const key = process.env.AZURE_SPEECH_KEY;
const region = process.env.AZURE_SPEECH_REGION;
if (!key || !region) throw new Error("Faltan AZURE_SPEECH_KEY o AZURE_SPEECH_REGION.");
if (!/^[a-z0-9-]+$/i.test(region)) throw new Error("AZURE_SPEECH_REGION no tiene un formato válido.");

const voice = "es-AR-ElenaNeural";
const ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-AR">
  <voice name="${voice}">
    <prosody rate="+3%" pitch="+1%">
      Lo reconocés enseguida. Pero… ¿sabés qué tiene realmente?
      <break time="250ms"/>
      Vamos a mirar el dorso del frasco.
      <break time="250ms"/>
      Siete ingredientes: azúcar, aceite vegetal, avellanas, leche descremada en polvo, cacao en polvo desgrasado, emulsificante, lecitinas y saborizante.
      <break time="350ms"/>
      Ahora te toca a vos: ¿cuántos recordabas? Comentá y jugá con Ingredora.
    </prosody>
  </voice>
</speak>`;

const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Ocp-Apim-Subscription-Key": key,
    "Content-Type": "application/ssml+xml",
    "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
    "User-Agent": "IngredoraContentStudio"
  },
  body: ssml
});
if (!response.ok) {
  const detail = await response.text();
  throw new Error(`Azure Speech devolvió HTTP ${response.status}: ${detail.slice(0, 500)}`);
}
const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.length < 2048 || bytes.subarray(0, 3).toString() !== "ID3") {
  throw new Error("Azure no devolvió un MP3 válido.");
}
const output = "public/studio/audio/nutella-v5-voice-es-AR.mp3";
await mkdir(dirname(output), { recursive: true });
await writeFile(output, bytes);
console.log(`Voz generada con ${voice}: ${bytes.length} bytes -> ${output}`);
