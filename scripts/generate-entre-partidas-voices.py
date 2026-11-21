import asyncio
import io
import json
from pathlib import Path
import subprocess

import edge_tts
import imageio_ffmpeg
from pydub import AudioSegment

AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()
OUTPUT_DIR = Path("public/studio/audio/entre-partidas/prepilot-v1")
TOTAL_MS = 27_000

# Five separate Spanish neural voices. The two Argentine voices are
# supplemented with Uruguayan and Chilean voices to give every character
# a genuinely different voice identity while staying in the Southern Cone.
VOICE_CAST = {
    "martina": {
        "voice": "es-AR-ElenaNeural", "region": "Argentina",
        "rate": "-3%", "pitch": "-2Hz", "volume": "+5%",
        "direction": "measured, observant, dry and self-assured"
    },
    "bruno": {
        "voice": "es-AR-TomasNeural", "region": "Argentina",
        "rate": "+7%", "pitch": "+4Hz", "volume": "+7%",
        "direction": "energetic, competitive, quick and expressive"
    },
    "tomas": {
        "voice": "es-UY-MateoNeural", "region": "Uruguay",
        "rate": "+9%", "pitch": "+7Hz", "volume": "+5%",
        "direction": "curious, playful, slightly improvisational"
    },
    "valentina": {
        "voice": "es-UY-ValentinaNeural", "region": "Uruguay",
        "rate": "-5%", "pitch": "-1Hz", "volume": "+5%",
        "direction": "confident, ironic, precise and relaxed"
    },
    "ernesto": {
        "voice": "es-CL-LorenzoNeural", "region": "Chile",
        "rate": "-12%", "pitch": "-6Hz", "volume": "+6%",
        "direction": "warm, lower, calm and dry"
    },
}

SEGMENTS = [
    {"id": "01-bruno", "speaker": "bruno", "start": 0.45,
     "text": "Yo nunca pierdo. El juego a veces no entiende mi estrategia."},
    {"id": "02-martina", "speaker": "martina", "start": 4.80,
     "text": "No es el juego. Es que no sabés perder."},
    {"id": "03-tomas", "speaker": "tomas", "start": 8.00,
     "text": "Pará, tengo una teoría. Capaz el juego detecta el miedo."},
    {"id": "04-valentina", "speaker": "valentina", "start": 11.70,
     "text": "Entonces a vos te detecta desde la puerta."},
    {"id": "05-ernesto", "speaker": "ernesto", "start": 15.00,
     "text": "En mis tiempos, para perder así, había que salir de casa."},
    {"id": "06-bruno", "speaker": "bruno", "start": 19.20,
     "text": "Bueno, ¿podemos hablar de otra cosa?"},
    {"id": "07-martina", "speaker": "martina", "start": 21.90,
     "text": "Tarde. Ya estamos grabando."},
    {"id": "08-ernesto", "speaker": "ernesto", "start": 24.00,
     "text": "¿Saludamos?"},
]

async def synthesize(segment):
    cast = VOICE_CAST[segment["speaker"]]
    communicate = edge_tts.Communicate(
        segment["text"],
        cast["voice"],
        rate=cast["rate"],
        pitch=cast["pitch"],
        volume=cast["volume"],
        boundary="WordBoundary",
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
            })
    if not chunks or not words:
        raise RuntimeError("No se generó audio o marcas de palabra para " + segment["id"])
    audio = AudioSegment.from_file(io.BytesIO(b"".join(chunks)), format="mp3")
    audio = audio.set_frame_rate(24_000).set_channels(2)
    if len(audio) < 250:
        raise RuntimeError("El diálogo quedó vacío: " + segment["id"])
    return audio, words

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    master = AudioSegment.silent(duration=TOTAL_MS, frame_rate=24_000).set_channels(2)
    stems = {
        speaker: AudioSegment.silent(duration=TOTAL_MS, frame_rate=24_000).set_channels(2)
        for speaker in VOICE_CAST
    }
    word_timings = []
    segment_manifest = []

    for index, segment in enumerate(SEGMENTS):
        audio, words = await synthesize(segment)
        start_ms = round(segment["start"] * 1000)
        end_ms = start_ms + len(audio)
        next_start_ms = (
            round(SEGMENTS[index + 1]["start"] * 1000)
            if index + 1 < len(SEGMENTS) else TOTAL_MS
        )
        if end_ms > next_start_ms - 120:
            raise RuntimeError(
                "La voz " + segment["id"] + " dura " + str(round(len(audio) / 1000, 2))
                + "s y se superpone con el siguiente turno. Ajustar el guion o el ritmo."
            )
        if end_ms > TOTAL_MS:
            raise RuntimeError("La voz excede la duración del prepiloto: " + segment["id"])

        master = master.overlay(audio, position=start_ms)
        stems[segment["speaker"]] = stems[segment["speaker"]].overlay(audio, position=start_ms)
        word_timings.extend({
            "text": word["text"],
            "start": round(segment["start"] + word["start"], 4),
            "end": round(segment["start"] + word["end"], 4),
            "speaker": segment["speaker"],
            "segmentId": segment["id"],
        } for word in words)
        segment_manifest.append({
            "id": segment["id"],
            "speaker": segment["speaker"],
            "text": segment["text"],
            "start": segment["start"],
            "end": round(end_ms / 1000, 4),
            "durationSeconds": round(len(audio) / 1000, 4),
            "voice": VOICE_CAST[segment["speaker"]]["voice"],
            "wordCount": len(words),
        })

    if master.rms < 250 or len(master) != TOTAL_MS:
        raise RuntimeError("La mezcla de voces está vacía o tiene duración incorrecta.")

    master_path = OUTPUT_DIR / "voice-track.mp3"
    master.export(master_path, format="mp3", bitrate="192k")
    for speaker, stem in stems.items():
        stem_path = OUTPUT_DIR / (speaker + ".mp3")
        stem.export(stem_path, format="mp3", bitrate="160k")
        if not stem_path.exists() or stem_path.stat().st_size < 1024:
            raise RuntimeError("No se pudo guardar la pista individual de " + speaker)

    (OUTPUT_DIR / "word-timings.json").write_text(
        json.dumps({
            "engine": "edge-tts",
            "durationSeconds": TOTAL_MS / 1000,
            "words": word_timings,
            "segments": segment_manifest,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (OUTPUT_DIR / "voice-cast.json").write_text(
        json.dumps({
            "status": "provisional casting test",
            "note": "Distinct Spanish neural voice IDs. Regional identity varies within the Southern Cone; review before public release.",
            "cast": VOICE_CAST,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    if not master_path.exists() or master_path.stat().st_size < 4096:
        raise RuntimeError("La mezcla final no produjo un MP3 válido.")
    print("Voces generadas:", len(VOICE_CAST))
    print("Diálogos:", len(segment_manifest))
    print("Duración de la pista:", TOTAL_MS / 1000, "s")
    for item in segment_manifest:
        print(item["speaker"], item["start"], item["end"], item["voice"], item["text"])

if __name__ == "__main__":
    asyncio.run(main())
