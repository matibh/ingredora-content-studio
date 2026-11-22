#!/usr/bin/env python3
"""Insert short sitcom laugh beats and the supplied credits outro into Entre Partidas."""
from __future__ import annotations

import json
import math
import subprocess
from datetime import datetime, timezone
from pathlib import Path

AUDIO_DIR = Path("public/studio/audio/entre-partidas/supermarket-01")
VOICE = AUDIO_DIR / "voice-track.mp3"
LAUGH = AUDIO_DIR / "risa.mp3"
OUTRO = AUDIO_DIR / "risa-y-outro.mp3"
PACKAGE = Path("public/studio/packages/entre-partidas-supermarket.v1.json")
TIMINGS = AUDIO_DIR / "word-timings.json"
TEMP = AUDIO_DIR / "voice-track.comedy.mp3"

FPS = 30
ORIGINAL_CREDITS_START = 57.20
LAUGH_SECONDS = 2.20
PAUSE_AFTER_LAUGH = 0.30
LAUGH_GAIN = 0.50
OUTRO_GAIN = 0.52
PRE_LAUGH_BEAT = 0.18

# Use only actual comic turns, not every line of dialogue.
PUNCHLINES = [
    {"text": "¿Maltodextrina...? Bueno, esto también lo tengo que aprender.", "segment": 1, "last_word": "aprender"},
    {"text": "Ah, bueno.", "segment": 10, "last_word": "bueno"},
    {"text": "Después.", "segment": 15, "last_word": "Después"},
    {"text": "¡Y acordate de comprar comida!", "segment": 17, "last_word": "comida"},
]


def run(command: list[str]) -> str:
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def duration(path: Path) -> float:
    return float(run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ]))


for required in (VOICE, LAUGH, OUTRO, PACKAGE, TIMINGS):
    if not required.is_file() or required.stat().st_size < 100:
        raise SystemExit(f"Falta un archivo de audio/guion necesario: {required}")

laugh_source_duration = duration(LAUGH)
outro_duration = duration(OUTRO)
if laugh_source_duration < LAUGH_SECONDS:
    raise SystemExit(
        f"risa.mp3 dura {laugh_source_duration:.3f}s; se necesitan al menos {LAUGH_SECONDS:.2f}s para los remates."
    )
if outro_duration < 2.0:
    raise SystemExit(f"El outro subido es demasiado corto: {outro_duration:.3f}s")

package = json.loads(PACKAGE.read_text(encoding="utf-8"))
timing_data = json.loads(TIMINGS.read_text(encoding="utf-8"))
words = timing_data.get("words", [])
dialogue = package.get("dialogue", [])
if len(dialogue) < 19 or not words:
    raise SystemExit("El guion o la sincronización de voces están incompletos.")

events: list[dict[str, object]] = []
for item in PUNCHLINES:
    cue = next((entry for entry in dialogue if entry.get("text") == item["text"]), None)
    if cue is None:
        raise SystemExit(f"No se encontró el remate en el diálogo: {item['text']}")
    matches = [
        word for word in words
        if word.get("segment") == item["segment"]
        and str(word.get("text", "")).strip(".,!?¡¿…").casefold() == item["last_word"].casefold()
    ]
    if not matches:
        raise SystemExit(f"No se encontró el tiempo de la última palabra de: {item['text']}")
    spoken_end = max(float(word["end"]) for word in matches)
    insert_at = spoken_end + PRE_LAUGH_BEAT
    if insert_at <= 0 or insert_at >= ORIGINAL_CREDITS_START:
        raise SystemExit(f"Tiempo de risa fuera del episodio: {insert_at}")
    # End the subtitle at the spoken punchline, then let the laugh have its own beat.
    cue["end"] = round(insert_at, 4)
    events.append({
        "at": insert_at,
        "cue": cue,
        "label": f"laugh_{len(events) + 1}",
    })

events.sort(key=lambda event: float(event["at"]))
if any(float(events[i]["at"]) >= float(events[i + 1]["at"]) for i in range(len(events) - 1)):
    raise SystemExit("Los momentos de risa no están en orden.")

filters: list[str] = []
parts: list[str] = []
counter = 0


def voice_clip(start: float, end: float) -> None:
    global counter
    if end - start < 0.015:
        return
    label = f"v{counter}"
    counter += 1
    filters.append(
        f"[0:a]atrim=start={start:.5f}:end={end:.5f},"
        f"asetpts=PTS-STARTPTS,aresample=48000,"
        f"aformat=sample_fmts=fltp:channel_layouts=stereo[{label}]"
    )
    parts.append(f"[{label}]")


def laugh_clip(label: str) -> None:
    filters.append(
        f"[1:a]atrim=start=0:duration={LAUGH_SECONDS:.4f},"
        f"asetpts=PTS-STARTPTS,aresample=48000,"
        f"aformat=sample_fmts=fltp:channel_layouts=stereo,"
        f"volume={LAUGH_GAIN:.3f},"
        f"afade=t=in:st=0:d=0.05,"
        f"afade=t=out:st={LAUGH_SECONDS - 0.32:.4f}:d=0.32[{label}]"
    )
    parts.append(f"[{label}]")


def silence(seconds: float, label: str) -> None:
    filters.append(
        f"anullsrc=r=48000:cl=stereo,atrim=duration={seconds:.4f},"
        f"asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:channel_layouts=stereo[{label}]"
    )
    parts.append(f"[{label}]")


cursor = 0.0
for event in events:
    at = float(event["at"])
    voice_clip(cursor, at)
    laugh_clip(str(event["label"]))
    silence(PAUSE_AFTER_LAUGH, f"pause_{len(parts)}")
    cursor = at

# Keep Bruno's final "Sí, sí..." and its existing reaction beat intact.
voice_clip(cursor, ORIGINAL_CREDITS_START)
filters.append(
    f"[2:a]atrim=start=0:duration={outro_duration:.5f},"
    f"asetpts=PTS-STARTPTS,aresample=48000,"
    f"aformat=sample_fmts=fltp:channel_layouts=stereo,"
    f"volume={OUTRO_GAIN:.3f},"
    f"afade=t=in:st=0:d=0.10,"
    f"afade=t=out:st={max(0.0, outro_duration - 0.65):.5f}:d=0.65[outro]"
)
parts.append("[outro]")
filters.append("".join(parts) + f"concat=n={len(parts)}:v=0:a=1[final_audio]")
graph = ";".join(filters)

run([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
    "-i", str(VOICE), "-i", str(LAUGH), "-i", str(OUTRO),
    "-filter_complex", graph,
    "-map", "[final_audio]", "-c:a", "libmp3lame", "-b:a", "192k",
    "-ar", "48000", "-ac", "2", str(TEMP),
])
if not TEMP.is_file() or TEMP.stat().st_size < 100_000:
    raise SystemExit("No se pudo crear la pista final con risas y outro.")
TEMP.replace(VOICE)

# Shift all dialogue/caption timings after each inserted laughter + reaction pause.
shift_per_event = LAUGH_SECONDS + PAUSE_AFTER_LAUGH
total_shift = len(events) * shift_per_event
for cue in dialogue:
    old_start = float(cue["start"])
    old_end = float(cue["end"])
    shift_start = sum(shift_per_event for event in events if old_start >= float(event["at"]))
    shift_end = sum(shift_per_event for event in events if old_end > float(event["at"]))
    cue["start"] = round(old_start + shift_start, 4)
    cue["end"] = round(old_end + shift_end, 4)

for word in words:
    old_start = float(word["start"])
    old_end = float(word["end"])
    shift_start = sum(shift_per_event for event in events if old_start >= float(event["at"]))
    shift_end = sum(shift_per_event for event in events if old_end > float(event["at"]))
    word["start"] = round(old_start + shift_start, 4)
    word["end"] = round(old_end + shift_end, 4)

credits_start = ORIGINAL_CREDITS_START + total_shift
total_duration = credits_start + outro_duration
total_frames = math.ceil(total_duration * FPS)
render_duration = total_frames / FPS
package["durationSeconds"] = render_duration
package["createdAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
for scene in package.get("scenes", []):
    if scene.get("id") == "supermarket-aisle-story":
        scene["durationFrames"] = total_frames
timing_data["durationSeconds"] = render_duration
PACKAGE.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
TIMINGS.write_text(json.dumps(timing_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

final_duration = duration(VOICE)
if abs(final_duration - render_duration) > 0.20:
    raise SystemExit(
        f"Duración de audio ({final_duration:.3f}s) y video ({render_duration:.3f}s) desalineadas."
    )

print(
    "COMEDY_AUDIO_OK "
    f"laughs={len(events)} laugh_clip={LAUGH_SECONDS:.2f}s "
    f"reaction_gap={PAUSE_AFTER_LAUGH:.2f}s "
    f"credits_start={credits_start:.2f}s outro={outro_duration:.2f}s "
    f"final_duration={render_duration:.2f}s"
)
