import asyncio
import json
from pathlib import Path
import subprocess

import edge_tts
import imageio_ffmpeg
from pydub import AudioSegment

AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()

VOICE = "es-AR-ElenaNeural"
RATE = "+10%"
PITCH = "+4Hz"
VOLUME = "+12%"
DURATION_MS = 34_000
OUTPUT = Path("public/studio/audio/coca-cola-poolside-v2-voice-es-AR.mp3")
TIMINGS_OUTPUT = Path("public/studio/audio/coca-cola-poolside-v2-word-timings.json")

# Each line is synthesized separately so the narration follows the visual beats.
# The six-second guessing window and the ingredient reveal intentionally stay quiet.
SEGMENTS = [
    {"start": 0.22, "text": "Un día de calor..."},
    {"start": 3.10, "text": "Una Coca bien fría, con hielo y burbujas."},
    {"start": 7.42, "text": "Pero pará... ¿sabés qué tiene adentro?"},
    {"start": 10.50, "text": "Tenés seis segundos para adivinar sus ingredientes."},
    {"start": 29.45, "text": "¿Cuántos acertaste?"},
    {"start": 31.60, "text": "¡Jugá en Ingredora!"},
]

async def synthesize_segment(segment, index):
    communicate = edge_tts.Communicate(
        segment["text"],
        VOICE,
        rate=RATE,
        pitch=PITCH,
        volume=VOLUME,
        boundary="WordBoundary",
    )
    chunks = []
    words = []
    async for event in communicate.stream():
        if event["type"] == "audio":
            chunks.append(event["data"])
        elif event["type"] == "WordBoundary":
            words.append({
                "text": event["text"],
                "start": event["offset"] / 10_000_000,
                "end": (event["offset"] + event["duration"]) / 10_000_000,
                "segment": index,
            })
    if not chunks or not words:
        raise RuntimeError(f"Edge TTS no devolvió audio y marcas de palabra para el segmento {index + 1}.")
    decoded = subprocess.run(
        [
            imageio_ffmpeg.get_ffmpeg_exe(),
            "-hide_banner", "-loglevel", "error",
            "-i", "pipe:0",
            "-f", "s16le", "-acodec", "pcm_s16le",
            "-ar", "24000", "-ac", "2", "pipe:1",
        ],
        input=b"".join(chunks),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    audio = AudioSegment(
        data=decoded.stdout,
        sample_width=2,
        frame_rate=24_000,
        channels=2,
    )
    if len(audio) < 100:
        raise RuntimeError(f"El segmento {index + 1} quedó vacío.")
    return audio, words

async def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    master = AudioSegment.silent(duration=DURATION_MS, frame_rate=24_000).set_channels(2)
    all_words = []
    segment_manifest = []

    for index, segment in enumerate(SEGMENTS):
        audio, words = await synthesize_segment(segment, index)
        start_ms = round(segment["start"] * 1000)
        end_ms = start_ms + len(audio)
        if end_ms > DURATION_MS:
            raise RuntimeError(
                f"El segmento {index + 1} termina en {end_ms / 1000:.2f}s "
                f"y excede la duración del video ({DURATION_MS / 1000:.0f}s)."
            )
        if index + 1 < len(SEGMENTS):
            next_start_ms = round(SEGMENTS[index + 1]["start"] * 1000)
            if end_ms > next_start_ms:
                raise RuntimeError(
                    f"El segmento {index + 1} invade el siguiente bloque: "
                    f"{end_ms / 1000:.2f}s > {next_start_ms / 1000:.2f}s."
                )
        master = master.overlay(audio, position=start_ms)
        for word in words:
            all_words.append({
                **word,
                "start": round(segment["start"] + word["start"], 4),
                "end": round(segment["start"] + word["end"], 4),
            })
        segment_manifest.append({
            "text": segment["text"],
            "start": segment["start"],
            "end": round(end_ms / 1000, 4),
            "wordCount": len(words),
        })

    master = master.set_frame_rate(24_000)
    master.export(OUTPUT, format="mp3", bitrate="192k")
    if not all_words:
        raise RuntimeError("No se generaron marcas de tiempo de palabras.")
    TIMINGS_OUTPUT.write_text(
        json.dumps({
            "voice": VOICE,
            "rate": RATE,
            "pitch": PITCH,
            "volume": VOLUME,
            "durationSeconds": DURATION_MS / 1000,
            "segments": segment_manifest,
            "words": all_words,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    data = OUTPUT.read_bytes()
    valid_mp3 = data[:3] == b"ID3" or (
        len(data) > 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0
    )
    if len(data) < 2048 or not valid_mp3:
        raise RuntimeError("La síntesis no produjo un MP3 válido.")
    print(f"Voz generada con {VOICE}: {len(data)} bytes -> {OUTPUT}")
    print(f"Marcas de tiempo: {len(all_words)} palabras -> {TIMINGS_OUTPUT}")
    for item in segment_manifest:
        print(f'{item["start"]:.2f}s–{item["end"]:.2f}s: {item["text"]}')

if __name__ == "__main__":
    asyncio.run(main())
