import asyncio
import json
from pathlib import Path
from datetime import datetime, timezone
import subprocess

import edge_tts
import imageio_ffmpeg
from pydub import AudioSegment

AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()
OUTPUT_DIR = Path("public/studio/audio/entre-partidas/supermarket-scene-v1")
TOTAL_MS = 68_000

# Tres identidades claramente diferenciadas, en español del Río de la Plata.
# Martina y Bruno usan voces argentinas; Valentina conserva su identidad uruguaya
# del casting general, con interpretación segura y de timing seco.
VOICE_CAST = {
    "martina": {
        "voice": "es-AR-ElenaNeural", "region": "Argentina",
        "rate": "-3%", "pitch": "-2Hz", "volume": "+4%",
        "direction": "natural, observant, measured, dry"
    },
    "bruno": {
        "voice": "es-AR-TomasNeural", "region": "Argentina",
        "rate": "+4%", "pitch": "+2Hz", "volume": "+5%",
        "direction": "energetic but focused, quick, sincerely competitive"
    },
    "valentina": {
        "voice": "es-UY-ValentinaNeural", "region": "Uruguay",
        "rate": "-4%", "pitch": "-1Hz", "volume": "+4%",
        "direction": "confident, ironic, conversational, precise timing"
    },
}

SEGMENTS = [
    {"id": "01-bruno", "speaker": "bruno", "start": 0.55, "pauseAfter": 0.25,
     "text": "Harina de trigo... azúcar... aceite vegetal... maltodextrina."},
    {"id": "02-martina", "speaker": "martina", "pauseAfter": 0.22,
     "text": "¿Qué está haciendo?"},
    {"id": "03-valentina", "speaker": "valentina", "pauseAfter": 0.20,
     "text": "Mirá."},
    {"id": "04-valentina", "speaker": "valentina", "pauseAfter": 0.20,
     "text": "Bruno..."},
    {"id": "05-valentina", "speaker": "valentina", "pauseAfter": 0.28,
     "text": "Bruno."},
    {"id": "06-bruno", "speaker": "bruno", "pauseAfter": 0.25,
     "text": "Un segundo..."},
    {"id": "07-martina", "speaker": "martina", "pauseAfter": 0.25,
     "text": "¿Estás leyendo los ingredientes?"},
    {"id": "08-bruno", "speaker": "bruno", "pauseAfter": 0.25,
     "text": "Me estoy preparando."},
    {"id": "09-valentina", "speaker": "valentina", "pauseAfter": 0.28,
     "text": "¿Para qué? ¿Te toman examen?"},
    {"id": "10-bruno", "speaker": "bruno", "pauseAfter": 0.25,
     "text": "Mañana es el Desafío Diario. Esta vez lo quiero hacer bien."},
    {"id": "11-martina", "speaker": "martina", "pauseAfter": 0.25,
     "text": "¿Y ya sabés qué producto va a salir?"},
    {"id": "12-bruno", "speaker": "bruno", "pauseAfter": 0.32,
     "text": "No."},
    {"id": "13-valentina", "speaker": "valentina", "pauseAfter": 0.28,
     "text": "Ah, bueno."},
    {"id": "14-bruno", "speaker": "bruno", "pauseAfter": 0.25,
     "text": "Justamente. Por eso estoy estudiando."},
    {"id": "15-bruno", "speaker": "bruno", "pauseAfter": 0.25,
     "text": "Puede tocar cualquier producto. Son quince segundos. No puedo quedarme pensando qué significa cada ingrediente."},
    {"id": "16-martina", "speaker": "martina", "pauseAfter": 0.25,
     "text": "¿Tu plan es leer todos los productos del supermercado?"},
    {"id": "17-bruno", "speaker": "bruno", "pauseAfter": 0.30,
     "text": "No todos. Empecé por galletitas. Después sigo con lácteos, conservas y congelados."},
    {"id": "18-valentina", "speaker": "valentina", "pauseAfter": 0.25,
     "text": "¿Y cuándo pensás comprar algo?"},
    {"id": "19-bruno", "speaker": "bruno", "pauseAfter": 0.38,
     "text": "Después."},
    {"id": "20-valentina", "speaker": "valentina", "pauseAfter": 0.25,
     "text": "¡Y acordate de comprar comida!"},
    {"id": "21-bruno", "speaker": "bruno", "pauseAfter": 0.0,
     "text": "Sí, sí..."},
]

SHOT_ANCHORS = [
    ("01-observational-wide", None, "02-martina"),
    ("02-label-insert", "02-martina", "03-valentina"),
    ("03-reveal-pan", "03-valentina", "07-martina"),
    ("04-women-two-shot", "07-martina", "08-bruno"),
    ("05-three-shot", "08-bruno", "10-bruno"),
    ("06-bruno-medium", "10-bruno", "11-martina"),
    ("07-martina-over-shoulder", "11-martina", "12-bruno"),
    ("08-shared-reaction", "12-bruno", "14-bruno"),
    ("09-bruno-explanation", "14-bruno", "16-martina"),
    ("10-group-question", "16-martina", "18-valentina"),
    ("11-valentina-close", "18-valentina", "19-bruno"),
    ("12-button-and-hold", "19-bruno", None),
]

def find_segment_timing(segments, segment_id):
    item = next((entry for entry in segments if entry["id"] == segment_id), None)
    if item is None:
        raise RuntimeError("Falta el segmento de voz requerido: " + segment_id)
    return item

async def synthesize(segment):
    cast = VOICE_CAST[segment["speaker"]]
    communicate = edge_tts.Communicate(
        segment["text"], cast["voice"],
        rate=cast["rate"], pitch=cast["pitch"], volume=cast["volume"],
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
            imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error",
            "-i", "pipe:0", "-f", "s16le", "-acodec", "pcm_s16le",
            "-ar", "24000", "-ac", "2", "pipe:1",
        ],
        input=b"".join(chunks), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True,
    )
    audio = AudioSegment(
        data=decoded.stdout, sample_width=2, frame_rate=24_000, channels=2,
    )
    if len(audio) < 250:
        raise RuntimeError("El diálogo quedó vacío: " + segment["id"])
    return audio, words

async def main():
    global TOTAL_MS
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    master = AudioSegment.silent(duration=TOTAL_MS, frame_rate=24_000).set_channels(2)
    stems = {
        speaker: AudioSegment.silent(duration=TOTAL_MS, frame_rate=24_000).set_channels(2)
        for speaker in VOICE_CAST
    }
    word_timings, segment_manifest = [], []
    speaker_samples = {speaker: [] for speaker in VOICE_CAST}
    cursor_ms = round(SEGMENTS[0]["start"] * 1000)

    for segment in SEGMENTS:
        audio, words = await synthesize(segment)
        start_ms = cursor_ms
        end_ms = start_ms + len(audio)
        if end_ms > TOTAL_MS:
            raise RuntimeError(
                "El diálogo " + segment["id"] + " termina en "
                + str(round(end_ms / 1000, 2)) + "s y supera la duración de "
                + str(TOTAL_MS / 1000) + "s. Aumentar TOTAL_MS."
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
            "id": segment["id"], "speaker": segment["speaker"], "text": segment["text"],
            "start": round(start_ms / 1000, 4), "end": round(end_ms / 1000, 4),
            "durationSeconds": round(len(audio) / 1000, 4),
            "voice": VOICE_CAST[segment["speaker"]]["voice"], "wordCount": len(words),
        })
        cursor_ms = end_ms + round(segment.get("pauseAfter", 0.25) * 1000)

    # End the episode shortly after the final response instead of leaving dead air.
    final_end_ms = round(segment_manifest[-1]["end"] * 1000)
    TOTAL_MS = min(TOTAL_MS, final_end_ms + 1800)
    master = master[:TOTAL_MS]
    stems = {speaker: stem[:TOTAL_MS] for speaker, stem in stems.items()}

    master_path = OUTPUT_DIR / "voice-track.mp3"
    master.export(master_path, format="mp3", bitrate="192k")
    auditions = {}
    for speaker, stem in stems.items():
        stem_path = OUTPUT_DIR / (speaker + ".mp3")
        stem.export(stem_path, format="mp3", bitrate="160k")
        if not stem_path.exists() or stem_path.stat().st_size < 1024:
            raise RuntimeError("No se pudo guardar la pista individual: " + speaker)
        audition = AudioSegment.silent(duration=180, frame_rate=24_000).set_channels(2)
        for take in speaker_samples[speaker]:
            audition += take + AudioSegment.silent(duration=240, frame_rate=24_000)
        name = "audition-" + speaker + ".mp3"
        audition.export(OUTPUT_DIR / name, format="mp3", bitrate="160k")
        auditions[speaker] = name

    (OUTPUT_DIR / "word-timings.json").write_text(json.dumps({
        "engine": "edge-tts",
        "durationSeconds": TOTAL_MS / 1000,
        "words": word_timings,
        "segments": segment_manifest,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUTPUT_DIR / "voice-cast.json").write_text(json.dumps({
        "status": "provisional scene casting",
        "note": "Three Spanish neural voices for the supermarket scene. Review accent, performance and commercial rights before public distribution.",
        "cast": {speaker: {**details, "auditionFile": auditions[speaker]} for speaker, details in VOICE_CAST.items()},
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    if master.rms < 250 or len(master) != TOTAL_MS or master_path.stat().st_size < 4096:
        raise RuntimeError("La mezcla de voces está vacía o tiene duración incorrecta.")
    print("Voces generadas:", len(VOICE_CAST), "· diálogos:", len(segment_manifest))
    for item in segment_manifest:
        print(item["start"], item["end"], item["speaker"], item["text"])

def activate_scene():
    package_path = Path("public/studio/series/entre-partidas/episodes/s01e01-supermarket-scene-01.json")
    manifest_path = Path("public/studio/productions.json")
    package = json.loads(package_path.read_text(encoding="utf-8"))
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    timing_path = OUTPUT_DIR / "word-timings.json"
    timing_data = json.loads(timing_path.read_text(encoding="utf-8"))
    generated = timing_data.get("segments", [])
    if len(generated) != len(SEGMENTS):
        raise RuntimeError("El archivo de tiempos no contiene los 21 diálogos esperados.")
    package_cues = {cue["id"]: cue for cue in package.get("dialogue", [])}
    generated_by_id = {item["id"]: item for item in generated}
    for segment in generated:
        cue = package_cues.get(segment["id"])
        if cue is None or cue.get("speaker") != segment["speaker"] or cue.get("text") != segment["text"]:
            raise RuntimeError("El paquete no coincide con el guion de voz: " + segment["id"])
        cue["startSeconds"], cue["endSeconds"] = segment["start"], segment["end"]
    for shot_id, start_id, end_id in SHOT_ANCHORS:
        shot = next((item for item in package["cameraShots"] if item["id"] == shot_id), None)
        if shot is None:
            raise RuntimeError("Falta el plano de cámara: " + shot_id)
        shot["startSeconds"] = 0.0 if start_id is None else generated_by_id[start_id]["start"]
        shot["endSeconds"] = TOTAL_MS / 1000 if end_id is None else generated_by_id[end_id]["start"]
        if shot["endSeconds"] <= shot["startSeconds"]:
            raise RuntimeError("Duración inválida en el plano " + shot_id)
    entry_time = generated_by_id["03-valentina"]["start"]
    for character in package["characters"]:
        if character["id"] in ("martina", "valentina"):
            character["entrance"]["startSeconds"] = entry_time

    package["durationSeconds"] = TOTAL_MS / 1000
    package["voiceTrackUrl"] = "studio/audio/entre-partidas/supermarket-scene-v1/voice-track.mp3"
    package["wordTimingsUrl"] = "studio/audio/entre-partidas/supermarket-scene-v1/word-timings.json"
    package["voiceStems"] = {
        speaker: "studio/audio/entre-partidas/supermarket-scene-v1/" + speaker + ".mp3"
        for speaker in VOICE_CAST
    }
    package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    production_id = package["id"]
    production = next((item for item in manifest.get("productions", []) if item.get("id") == production_id), None)
    if production is None:
        raise RuntimeError("La escena de supermercado no está registrada en productions.json.")
    required = [
        OUTPUT_DIR / "voice-track.mp3", OUTPUT_DIR / "word-timings.json",
        *(OUTPUT_DIR / (speaker + ".mp3") for speaker in VOICE_CAST),
        *(OUTPUT_DIR / ("audition-" + speaker + ".mp3") for speaker in VOICE_CAST),
    ]
    missing = [str(path) for path in required if not path.exists() or path.stat().st_size < 1024]
    if missing:
        raise RuntimeError("Faltan archivos de audio: " + ", ".join(missing))
    production["durationSeconds"] = TOTAL_MS / 1000
    production["status"] = "rendering"
    production["version"] = "1.0.1"
    manifest["updatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Paquete activado para el render en Ingredora Studio.")

if __name__ == "__main__":
    asyncio.run(main())
    activate_scene()
