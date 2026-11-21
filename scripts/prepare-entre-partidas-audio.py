#!/usr/bin/env python3
"""Prepare the revised Entre Partidas voice track from the original recorded voice.

The voice is kept intact and only existing Bruno/Valentina word fragments are
reordered and retimed. No external TTS, stock audio or replacement voice is used.
"""
from __future__ import annotations

import os
import subprocess
from pathlib import Path

VOICE = Path(os.environ.get(
    "ENTRE_PARTIDAS_VOICE_TRACK",
    "public/studio/audio/entre-partidas/supermarket-01/voice-track.mp3",
))
TEMP = VOICE.with_name("voice-track.revised.mp3")

if not VOICE.exists():
    raise SystemExit(f"Missing source narration: {VOICE}")

filters: list[str] = []
labels: list[str] = []
counter = 0


def source_clip(start: float, end: float, label: str | None = None) -> str:
    global counter
    name = label or f"a{counter}"
    counter += 1
    filters.append(
        f"[0:a]atrim=start={start:.4f}:end={end:.4f},"
        f"asetpts=PTS-STARTPTS,aresample=48000,"
        f"aformat=sample_fmts=fltp:channel_layouts=stereo[{name}]"
    )
    labels.append(f"[{name}]")
    return name


def silence(duration: float, label: str | None = None) -> str:
    global counter
    name = label or f"a{counter}"
    counter += 1
    filters.append(
        f"anullsrc=r=48000:cl=stereo,atrim=duration={duration:.4f},"
        f"asetpts=PTS-STARTPTS, aformat=sample_fmts=fltp:channel_layouts=stereo[{name}]"
    )
    labels.append(f"[{name}]")
    return name


# Original first section, then the two calls moved together to 11.0s.
source_clip(0.0, 11.0, "prefix")
source_clip(12.05, 12.55, "bruno_call_1")
silence(0.02, "call_gap")
source_clip(14.05, 14.58, "bruno_call_2")
silence(1.05, "before_response")

# Preserve the original exchange between the two calls and the corrected line.
source_clip(15.711, 25.0, "middle")

# Rebuild: "El Desafío Diario de mañana lo quiero hacer bien."
# Each syllable comes from the same original Bruno recording.
phrase = [
    (25.66, 25.78, "el"),
    (25.78, 26.16, "desafio"),
    (26.16, 26.53, "diario"),
    (2.405, 2.56, "de"),
    (25.04, 25.56, "manana"),
    (27.745, 27.93, "lo"),
    (27.925, 28.12, "quiero"),
    (28.12, 28.34, "hacer"),
    (28.34, 28.64, "bien"),
]
for index, (start, end, label) in enumerate(phrase):
    source_clip(start, end, f"phrase_{label}")
    if index < len(phrase) - 1:
        silence(0.04, f"phrase_gap_{index}")

# The new sentence occupies 25.0–27.765s; retain the original 1.235s pause
# before Martina's next line at 29.0s.
silence(1.235, "after_corrected_line")
source_clip(29.0, 65.0, "tail")
# The dialogue after "Bruno, Bruno" was moved 2.611s earlier. Restore the
# original 65-second programme duration with silence after the last line.
silence(2.611, "end_padding")

graph = ";".join(filters) + ";" + "".join(labels) + f"concat=n={len(labels)}:v=0:a=1[out]"

command = [
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
    "-i", str(VOICE),
    "-filter_complex", graph,
    "-map", "[out]",
    "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000",
    str(TEMP),
]
subprocess.run(command, check=True)
if not TEMP.exists() or TEMP.stat().st_size < 100_000:
    raise SystemExit("The revised voice track was not created correctly.")
TEMP.replace(VOICE)
print(f"Prepared revised Entre Partidas narration: {VOICE.stat().st_size} bytes")
