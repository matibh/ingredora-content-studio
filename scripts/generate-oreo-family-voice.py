import asyncio
import json
from pathlib import Path
import edge_tts

VOICE = "es-AR-ElenaNeural"
TEXT = (
    "¡Hola! ¿Cuánto sabés de lo que comés? "
    "Mirá cómo sale esta Oreo del paquete. "
    "Ahora pensá rápido: ¿qué ingredientes tiene Oreo Original? "
    "Tenés seis segundos: seis, cinco, cuatro, tres, dos, uno... ¡Tiempo! "
    "Azúcar, harina de trigo, aceite vegetal, cacao... ¡y varios más! "
    "¿Cuántos acertaste? Entrá a Ingredora punto com. ¡Te espero!"
)
OUTPUT = Path("public/studio/audio/oreo-family-v1-voice-es-AR.mp3")
TIMINGS_OUTPUT = Path("public/studio/audio/oreo-family-v1-word-timings.json")

async def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(
        TEXT, VOICE, rate="+8%", pitch="+5Hz", volume="+10%",
        boundary="WordBoundary",
    )
    audio_chunks = []
    word_timings = []
    async for event in communicate.stream():
        if event["type"] == "audio":
            audio_chunks.append(event["data"])
        elif event["type"] == "WordBoundary":
            word_timings.append({
                "text": event["text"],
                "start": event["offset"] / 10_000_000,
                "end": (event["offset"] + event["duration"]) / 10_000_000,
            })
    OUTPUT.write_bytes(b"".join(audio_chunks))
    if not word_timings:
        raise RuntimeError("Edge TTS no devolvió marcas de tiempo.")
    TIMINGS_OUTPUT.write_text(
        json.dumps({"voice": VOICE, "words": word_timings}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    data = OUTPUT.read_bytes()
    valid_mp3 = data[:3] == b"ID3" or (
        len(data) > 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0
    )
    if len(data) < 2048 or not valid_mp3:
        raise RuntimeError("La síntesis no produjo un MP3 válido.")
    print(f"Voz femenina argentina generada con {VOICE}: {len(data)} bytes")
    print(f"Marcas de palabras: {len(word_timings)}")

if __name__ == "__main__":
    asyncio.run(main())
