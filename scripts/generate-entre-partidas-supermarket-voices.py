import asyncio
import json
import subprocess
from pathlib import Path
from datetime import datetime, timezone

import edge_tts
import imageio_ffmpeg
from pydub import AudioSegment

AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()
PACKAGE_PATH = Path("public/studio/packages/entre-partidas-supermarket.v1.json")
OUTPUT_DIR = Path("public/studio/audio/entre-partidas/supermarket-01")
VOICE_CAST = {
    "martina": {"voice":"es-AR-ElenaNeural","rate":"+12%","pitch":"-2Hz","volume":"+5%"},
    "bruno": {"voice":"es-AR-TomasNeural","rate":"+20%","pitch":"+4Hz","volume":"+7%"},
    "valentina": {"voice":"es-UY-ValentinaNeural","rate":"+10%","pitch":"-1Hz","volume":"+5%"},
}

async def synthesize(cue, index):
    cast = VOICE_CAST[cue["speaker"]]
    communicate = edge_tts.Communicate(
        cue["text"], cast["voice"], rate=cast["rate"],
        pitch=cast["pitch"], volume=cast["volume"], boundary="WordBoundary",
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
        raise RuntimeError("No se generó voz o sincronización para el diálogo " + str(index))
    decoded = subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error",
         "-i", "pipe:0", "-f", "s16le", "-acodec", "pcm_s16le",
         "-ar", "24000", "-ac", "2", "pipe:1"],
        input=b"".join(chunks), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True,
    )
    audio = AudioSegment(data=decoded.stdout, sample_width=2, frame_rate=24000, channels=2)
    # Keep the dialogue brisk and sitcom-paced without making the neural voices sound rushed.
    # A gentler time stretch preserves consonants and gives the three voices room to breathe.
    audio = audio.speedup(playback_speed=1.17, chunk_size=180, crossfade=35)
    ending = cue["text"].strip()
    if ending.endswith("!"):
        audio = audio + 1.2
    elif ending.endswith("?"):
        audio = audio + 0.45
    audio = audio.fade_in(12).fade_out(35)
    if len(audio) < 250:
        raise RuntimeError("El diálogo quedó vacío: " + str(index))
    return audio, words

async def main():
    package = json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))
    total_ms = round(float(package.get("durationSeconds", 65)) * 1000)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    master = AudioSegment.silent(duration=total_ms, frame_rate=24000).set_channels(2)
    stems = {speaker: AudioSegment.silent(duration=total_ms, frame_rate=24000).set_channels(2) for speaker in VOICE_CAST}
    timings, segments = [], []
    cursor_ms = 1800

    for index, cue in enumerate(package["dialogue"], start=1):
        if cue["speaker"] not in VOICE_CAST:
            raise RuntimeError("Personaje sin voz asignada: " + cue["speaker"])
        audio, words = await synthesize(cue, index)
        preferred_ms = round(cue.get("start", 0) * 1000)
        start_ms = max(preferred_ms, cursor_ms)
        end_ms = start_ms + len(audio)
        if end_ms > total_ms:
            raise RuntimeError(
                "El diálogo " + str(index) + " supera la duración de la escena: "
                + str(round(end_ms / 1000, 2)) + "s / " + str(total_ms / 1000) + "s."
            )
        master = master.overlay(audio, position=start_ms)
        stems[cue["speaker"]] = stems[cue["speaker"]].overlay(audio, position=start_ms)
        cue["start"] = round(start_ms / 1000, 4)
        cue["end"] = round(end_ms / 1000, 4)
        segment_id = f"{index:02d}-{cue['speaker']}"
        segments.append({
            "id": segment_id, "speaker": cue["speaker"], "text": cue["text"],
            "start": cue["start"], "end": cue["end"],
            "voice": VOICE_CAST[cue["speaker"]]["voice"], "wordCount": len(words),
        })
        timings.extend({
            "text": word["text"], "start": round(start_ms / 1000 + word["start"], 4),
            "end": round(start_ms / 1000 + word["end"], 4),
            "speaker": cue["speaker"], "segment": index - 1,
        } for word in words)
        cursor_ms = end_ms + 50

    if master.rms < 250 or len(master) != total_ms:
        raise RuntimeError("La mezcla de voces está vacía o tiene duración incorrecta.")
    voice_path = OUTPUT_DIR / "voice-track.mp3"
    master.export(voice_path, format="mp3", bitrate="192k")
    for speaker, stem in stems.items():
        stem_path = OUTPUT_DIR / (speaker + ".mp3")
        stem.export(stem_path, format="mp3", bitrate="160k")
        if not stem_path.exists() or stem_path.stat().st_size < 1024:
            raise RuntimeError("No se pudo guardar la pista individual de " + speaker)

    timing_path = OUTPUT_DIR / "word-timings.json"
    timing_path.write_text(json.dumps({
        "engine":"edge-tts", "durationSeconds":total_ms / 1000,
        "words":timings, "segments":segments,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if not voice_path.exists() or voice_path.stat().st_size < 4096:
        raise RuntimeError("La mezcla final no produjo un MP3 válido.")

    package["voiceoverUrl"] = "studio/audio/entre-partidas/supermarket-01/voice-track.mp3"
    package["wordTimingsUrl"] = "studio/audio/entre-partidas/supermarket-01/word-timings.json"
    package["voiceoverOffsetSeconds"] = 0
    PACKAGE_PATH.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    manifest_path = Path("public/studio/productions.json")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    production = next((p for p in manifest["productions"] if p["id"] == package["id"]), None)
    if production is None:
        raise RuntimeError("La producción no está registrada en productions.json.")
    production["language"] = "Español rioplatense — tres voces diferenciadas"
    production["description"] = "Sitcom 3D cinematográfica en supermercado, con tres voces diferenciadas, música original, actuación y montaje de cámara."
    production["version"] = "2.1.0-ad-engine-voices"
    manifest["updatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Voces generadas:", len(VOICE_CAST), "| diálogos:", len(segments), "| duración:", total_ms / 1000, "s")
    for segment in segments:
        print(segment["speaker"], segment["start"], segment["end"], segment["voice"], segment["text"])

if __name__ == "__main__":
    asyncio.run(main())
