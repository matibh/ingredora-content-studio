import asyncio
import json
from pathlib import Path
import edge_tts

VOICE = "es-AR-ElenaNeural"
# CTA directa al sitio y alternativa para quienes llegan desde redes sociales.
TEXT = (
    "¡Lo reconocés enseguida! Pero… ¿sabés qué tiene realmente? "
    "Vamos a mirar el dorso del frasco. "
    "La etiqueta tiene toda la información: siete ingredientes. "
    "Leelos, memorizalos y contame cuántos recordás. "
    "Para seguir jugando, entrá a Ingredora punto com, "
    "o buscá el link en mi perfil. ¡Te espero!"
)
OUTPUT = Path("public/studio/audio/nutella-v9-voice-es-AR.mp3")
TIMINGS_OUTPUT = Path("public/studio/audio/nutella-v9-word-timings.json")

async def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(
        TEXT,
        VOICE,
        rate="+10%",
        pitch="+4Hz",
        volume="+12%",
    )
    audio_chunks = []
    word_timings = []
    async for event in communicate.stream():
        if event['type'] == 'audio':
            audio_chunks.append(event['data'])
        elif event['type'] == 'WordBoundary':
            word_timings.append({
                'text': event['text'],
                'start': event['offset'] / 10_000_000,
                'end': (event['offset'] + event['duration']) / 10_000_000,
            })
    OUTPUT.write_bytes(b''.join(audio_chunks))
    if not word_timings:
        raise RuntimeError('Edge TTS no devolvió marcas de tiempo de palabras.')
    TIMINGS_OUTPUT.write_text(
        json.dumps({'voice': VOICE, 'words': word_timings}, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )
    data = OUTPUT.read_bytes()
    valid_mp3 = data[:3] == b"ID3" or (
        len(data) > 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0
    )
    if len(data) < 2048 or not valid_mp3:
        raise RuntimeError("La síntesis no produjo un MP3 válido.")
    print(f"Voz generada con {VOICE}: {len(data)} bytes -> {OUTPUT}")
    print(f"Marcas de tiempo: {len(word_timings)} palabras -> {TIMINGS_OUTPUT}")

if __name__ == "__main__":
    asyncio.run(main())
