import asyncio
import json
from pathlib import Path
from datetime import datetime, timezone
import subprocess

import edge_tts
import imageio_ffmpeg
from pydub import AudioSegment

AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()
OUTPUT_DIR = Path("public/studio/audio/entre-partidas/prepilot-v1")
TOTAL_MS = 30_000

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
    {"id": "01-bruno", "speaker": "bruno", "start": 0.45, "pauseAfter": 0.28,
     "text": "Yo nunca pierdo. El juego a veces no entiende mi estrategia."},
    {"id": "02-martina", "speaker": "martina", "pauseAfter": 0.35,
     "text": "No es el juego. Es que no sabés perder."},
    {"id": "03-tomas", "speaker": "tomas", "pauseAfter": 0.30,
     "text": "Pará, tengo una teoría. Capaz el juego detecta el miedo."},
    {"id": "04-valentina", "speaker": "valentina", "pauseAfter": 0.42,
     "text": "Entonces a vos te detecta desde la puerta."},
    {"id": "05-ernesto", "speaker": "ernesto", "pauseAfter": 0.32,
     "text": "En mis tiempos, para perder así, había que salir de casa."},
    {"id": "06-bruno", "speaker": "bruno", "pauseAfter": 0.35,
     "text": "Bueno, ¿podemos hablar de otra cosa?"},
    {"id": "07-martina", "speaker": "martina", "pauseAfter": 0.75,
     "text": "Tarde. Ya estamos grabando."},
    {"id": "08-ernesto", "speaker": "ernesto", "pauseAfter": 1.0,
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
    speaker_samples = {speaker: [] for speaker in VOICE_CAST}

    timeline_cursor_ms = round(SEGMENTS[0]["start"] * 1000)
    for segment in SEGMENTS:
        audio, words = await synthesize(segment)
        start_ms = timeline_cursor_ms
        end_ms = start_ms + len(audio)
        if end_ms > TOTAL_MS:
            raise RuntimeError(
                "El diálogo " + segment["id"] + " termina en "
                + str(round(end_ms / 1000, 2)) + "s y supera los "
                + str(TOTAL_MS / 1000) + "s disponibles. Aumentar la duración total."
            )

        master = master.overlay(audio, position=start_ms)
        stems[segment["speaker"]] = stems[segment["speaker"]].overlay(audio, position=start_ms)
        speaker_samples[segment["speaker"]].append(audio)
        word_timings.extend({
            "text": word["text"],
            "start": round(start_ms / 1000 + word["start"], 4),
            "end": round(start_ms / 1000 + word["end"], 4),
            "speaker": segment["speaker"],
            "segmentId": segment["id"],
        } for word in words)
        segment_manifest.append({
            "id": segment["id"],
            "speaker": segment["speaker"],
            "text": segment["text"],
            "start": round(start_ms / 1000, 4),
            "end": round(end_ms / 1000, 4),
            "durationSeconds": round(len(audio) / 1000, 4),
            "voice": VOICE_CAST[segment["speaker"]]["voice"],
            "wordCount": len(words),
        })
        timeline_cursor_ms = end_ms + round(segment.get("pauseAfter", 0.35) * 1000)

    if master.rms < 250 or len(master) != TOTAL_MS:
        raise RuntimeError("La mezcla de voces está vacía o tiene duración incorrecta.")

    master_path = OUTPUT_DIR / "voice-track.mp3"
    master.export(master_path, format="mp3", bitrate="192k")
    audition_files = {}
    for speaker, stem in stems.items():
        stem_path = OUTPUT_DIR / (speaker + ".mp3")
        stem.export(stem_path, format="mp3", bitrate="160k")
        if not stem_path.exists() or stem_path.stat().st_size < 1024:
            raise RuntimeError("No se pudo guardar la pista individual de " + speaker)
        audition = AudioSegment.silent(duration=220, frame_rate=24_000).set_channels(2)
        for take in speaker_samples[speaker]:
            audition += take + AudioSegment.silent(duration=280, frame_rate=24_000).set_channels(2)
        audition_name = "audition-" + speaker + ".mp3"
        audition_path = OUTPUT_DIR / audition_name
        audition.export(audition_path, format="mp3", bitrate="160k")
        audition_files[speaker] = audition_name
        if not audition_path.exists() or audition_path.stat().st_size < 1024:
            raise RuntimeError("No se pudo crear la muestra de voz de " + speaker)

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
            "cast": {speaker: {**details, "auditionFile": audition_files[speaker]} for speaker, details in VOICE_CAST.items()},
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

def activate_series_production():
    manifest_path = Path("public/studio/productions.json")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    production_id = "ingredora-entre-partidas-prepilot-v1"
    production = next((item for item in manifest.get("productions", []) if item.get("id") == production_id), None)
    if production is None:
        raise RuntimeError("El paquete del prepiloto no está registrado en productions.json.")
    package_path = Path("public/studio/series/entre-partidas/episodes/prepiloto-v1.json")
    episode_package = json.loads(package_path.read_text(encoding="utf-8"))
    cue_by_id = {cue["id"]: cue for cue in episode_package.get("dialogue", [])}
    for segment in segment_manifest:
        cue = cue_by_id.get(segment["id"])
        if cue is None or cue.get("speaker") != segment["speaker"]:
            raise RuntimeError("El paquete del episodio no coincide con el guion de voz: " + segment["id"])
        cue["startSeconds"] = segment["start"]
        cue["endSeconds"] = segment["end"]
    episode_package["durationSeconds"] = TOTAL_MS / 1000
    episode_package["voiceTrackUrl"] = "studio/audio/entre-partidas/prepilot-v1/voice-track.mp3"
    episode_package["wordTimingsUrl"] = "studio/audio/entre-partidas/prepilot-v1/word-timings.json"
    episode_package["voiceStems"] = {
        speaker: "studio/audio/entre-partidas/prepilot-v1/" + speaker + ".mp3"
        for speaker in VOICE_CAST
    }
    package_path.write_text(json.dumps(episode_package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    production["durationSeconds"] = TOTAL_MS / 1000
    required_audio = [
        OUTPUT_DIR / "voice-track.mp3",
        OUTPUT_DIR / "word-timings.json",
        *(OUTPUT_DIR / (speaker + ".mp3") for speaker in VOICE_CAST),
        *(OUTPUT_DIR / ("audition-" + speaker + ".mp3") for speaker in VOICE_CAST),
    ]
    missing = [str(path) for path in required_audio if not path.exists() or path.stat().st_size < 1024]
    if missing:
        raise RuntimeError("Faltan pistas de voz: " + ", ".join(missing))
    production["status"] = "rendering"
    manifest["updatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    asyncio.run(main())
    activate_series_production()
