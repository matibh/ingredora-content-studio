import asyncio
import json
from pathlib import Path
import subprocess

import edge_tts
import imageio_ffmpeg
from pydub import AudioSegment

AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()

VOICE = "es-AR-ElenaNeural"
OUTPUT = Path("public/studio/audio/cindor-game-show-voice-es-AR.mp3")
TIMINGS_OUTPUT = Path("public/studio/audio/cindor-game-show-word-timings.json")
DURATION_MS = 23_000

# Delivery: energetic Argentine TV game-show host. Strong projection, bright pitch,
# deliberate pauses, and emphatic exclamations. Separate phrases preserve the edit.
SEGMENTS = [
    {"start": 0.20, "text": "¡Bienvenidos a... el Desafío Ingredora!", "rate": "+2%", "pitch": "+8Hz", "volume": "+18%"},
    {"start": 4.15, "text": "¡Hoy tenemos una pregunta que parece fácil! ¿Qué ingredientes tiene Cindor?", "rate": "+5%", "pitch": "+7Hz", "volume": "+18%"},
    {"start": 8.10, "text": "¡Tienen seis segundos para responder! ¡Vamos!", "rate": "+8%", "pitch": "+10Hz", "volume": "+20%"},
    {"start": 14.10, "text": "¡Se terminó el tiempo! ¡No saben nada!", "rate": "+3%", "pitch": "+9Hz", "volume": "+20%"},
    {"start": 19.05, "text": "¡Ingresá en Ingredora punto com y jugá ya!", "rate": "+8%", "pitch": "+10Hz", "volume": "+20%"},
]

async def synthesize(segment, index):
    communicate = edge_tts.Communicate(
        segment["text"], VOICE,
        rate=segment["rate"], pitch=segment["pitch"],
        volume=segment["volume"], boundary="WordBoundary",
    )
    chunks, words = [], []
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
        raise RuntimeError(f"Edge TTS no devolvió audio/marcas para el segmento {index + 1}.")
    decoded = subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error",
         "-i", "pipe:0", "-f", "s16le", "-acodec", "pcm_s16le",
         "-ar", "24000", "-ac", "2", "pipe:1"],
        input=b"".join(chunks), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True,
    )
    audio = AudioSegment(data=decoded.stdout, sample_width=2, frame_rate=24000, channels=2)
    if len(audio) < 100:
        raise RuntimeError(f"El segmento {index + 1} quedó vacío.")
    return audio, words

async def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    master = AudioSegment.silent(duration=DURATION_MS, frame_rate=24000).set_channels(2)
    all_words, manifest = [], []
    for index, segment in enumerate(SEGMENTS):
        audio, words = await synthesize(segment, index)
        start_ms = round(segment["start"] * 1000)
        end_ms = start_ms + len(audio)
        next_start = round(SEGMENTS[index + 1]["start"] * 1000) if index + 1 < len(SEGMENTS) else DURATION_MS
        if end_ms > next_start:
            raise RuntimeError(f"Locución {index + 1} invade el siguiente bloque ({end_ms/1000:.2f}s > {next_start/1000:.2f}s).")
        master = master.overlay(audio, position=start_ms)
        all_words.extend({
            **word, "start": round(segment["start"] + word["start"], 4),
            "end": round(segment["start"] + word["end"], 4),
        } for word in words)
        manifest.append({"text": segment["text"], "start": segment["start"],
                         "end": round(end_ms / 1000, 4), "wordCount": len(words),
                         "rate": segment["rate"], "pitch": segment["pitch"], "volume": segment["volume"]})
    master.export(OUTPUT, format="mp3", bitrate="192k")
    TIMINGS_OUTPUT.write_text(json.dumps({
        "voice": VOICE, "style": "energetic Argentine TV game-show host",
        "durationSeconds": DURATION_MS / 1000, "segments": manifest, "words": all_words,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    data = OUTPUT.read_bytes()
    if len(data) < 2048 or not (data[:3] == b"ID3" or (data[0] == 0xFF and (data[1] & 0xE0) == 0xE0)):
        raise RuntimeError("La síntesis no produjo un MP3 válido.")
    print(f"Voz generada: {len(data)} bytes -> {OUTPUT}")
    print(f"Marcas de palabra: {len(all_words)} -> {TIMINGS_OUTPUT}")
    for item in manifest:
        print(f'{item["start"]:.2f}s–{item["end"]:.2f}s: {item["text"]}')

if __name__ == "__main__":
    asyncio.run(main())
