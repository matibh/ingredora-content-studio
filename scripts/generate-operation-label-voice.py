import asyncio
import json
from pathlib import Path
import subprocess

import edge_tts
import imageio_ffmpeg
from pydub import AudioSegment

AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()

VOICE = "es-AR-TomasNeural"
OUTPUT = Path("public/studio/audio/operation-label-voice-es-AR.mp3")
TIMINGS_OUTPUT = Path("public/studio/audio/operation-label-word-timings.json")
DURATION_MS = 30_000

# Performance: Argentine male detective, close-miked, low and conspiratorial at
# the start, then emphatic and playful on the reveal and the Ingredora invitation.
# Six seconds of absolute narration silence are reserved for the visual countdown.
SEGMENTS = [
    {"start": 0.25, "text": "¡Alto! Tenemos un nuevo caso.", "rate": "+4%", "pitch": "-5Hz", "volume": "+16%"},
    {"start": 4.15, "text": "El sospechoso: un producto del súper.", "rate": "+6%", "pitch": "-7Hz", "volume": "+15%"},
    {"start": 8.15, "text": "La pista está en su etiqueta.", "rate": "+7%", "pitch": "-3Hz", "volume": "+16%"},
    {"start": 11.05, "text": "Leé los ingredientes. Tenés seis segundos para memorizarlos.", "rate": "+8%", "pitch": "-2Hz", "volume": "+17%"},
    {"start": 23.25, "text": "¡Tiempo! ¿Cuántos recordás?", "rate": "+10%", "pitch": "+2Hz", "volume": "+19%"},
    {"start": 25.60, "text": "Resolvé más casos en Ingredora punto com.", "rate": "+8%", "pitch": "+1Hz", "volume": "+18%"},
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
            **word,
            "start": round(segment["start"] + word["start"], 4),
            "end": round(segment["start"] + word["end"], 4),
        } for word in words)
        manifest.append({
            "text": segment["text"],
            "start": segment["start"],
            "end": round(end_ms / 1000, 4),
            "wordCount": len(words),
            "rate": segment["rate"],
            "pitch": segment["pitch"],
            "volume": segment["volume"],
        })

    if master.rms < 900 or len(master) < 5_000:
        raise RuntimeError(f"La voz generada no tiene energía suficiente (RMS={master.rms}, duración={len(master)} ms).")
    master.export(OUTPUT, format="mp3", bitrate="192k")
    TIMINGS_OUTPUT.write_text(json.dumps({
        "voice": VOICE,
        "style": "Argentine male noir detective, suspenseful and playful",
        "durationSeconds": DURATION_MS / 1000,
        "segments": manifest,
        "words": all_words,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    data = OUTPUT.read_bytes()
    valid_mp3 = data[:3] == b"ID3" or (len(data) > 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0)
    if len(data) < 2048 or not valid_mp3:
        raise RuntimeError("La síntesis no produjo un MP3 válido.")
    print(f"Voz argentina generada con {VOICE}: {len(data)} bytes")
    print(f"Marcas de palabra: {len(all_words)}")
    for item in manifest:
        print(f'{item["start"]:.2f}s–{item["end"]:.2f}s: {item["text"]}')

if __name__ == "__main__":
    asyncio.run(main())
