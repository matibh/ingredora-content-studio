#!/usr/bin/env python3
"""Prepare the revised Entre Partidas voice track with one clean Edge-TTS retake.

All original dialogue stays on the existing recordings. Only Bruno's sentence is
re-synthesized as one continuous utterance in the same es-AR-TomasNeural voice.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

VOICE = Path(os.environ.get(
    "ENTRE_PARTIDAS_VOICE_TRACK",
    "public/studio/audio/entre-partidas/supermarket-01/voice-track.mp3",
))
TEMP = VOICE.with_name("voice-track.revised.mp3")
PHRASE = VOICE.with_name("bruno-daily-challenge.generated.mp3")
NORMALIZED = VOICE.with_name("bruno-daily-challenge.normalized.mp3")
TARGET_LINE_SECONDS = 3.2
PHRASE_TEXT = "El Desafío Diario de mañana lo quiero hacer bien."

if not VOICE.exists():
    raise SystemExit(f"Missing source narration: {VOICE}")


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(result.stdout.strip())


# Generate a natural, complete utterance; no syllable splicing or patching.
run([
    sys.executable, "-m", "edge_tts",
    "--voice", "es-AR-TomasNeural",
    "--rate", "+0%",
    "--text", PHRASE_TEXT,
    "--write-media", str(PHRASE),
])
if not PHRASE.exists() or PHRASE.stat().st_size < 20_000:
    raise SystemExit("Edge TTS did not generate Bruno's replacement line.")

raw_duration = duration(PHRASE)
if not 1.5 <= raw_duration <= 7.0:
    raise SystemExit(f"Unexpected replacement line duration: {raw_duration:.3f}s")

# Fit the line to its exact 3.2-second dialogue slot without changing the voice.
tempo = raw_duration / TARGET_LINE_SECONDS
run([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
    "-i", str(PHRASE),
    "-filter:a", f"atempo={tempo:.7f}",
    "-ar", "48000", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "192k",
    str(NORMALIZED),
])
PHRASE.unlink(missing_ok=True)
NORMALIZED.replace(PHRASE)

filters: list[str] = []
labels: list[str] = []
counter = 0


def source_clip(start: float, end: float, label: str | None = None) -> None:
    global counter
    name = label or f"a{counter}"
    counter += 1
    filters.append(
        f"[0:a]atrim=start={start:.4f}:end={end:.4f},"
        f"asetpts=PTS-STARTPTS,aresample=48000,"
        f"aformat=sample_fmts=fltp:channel_layouts=stereo[{name}]"
    )
    labels.append(f"[{name}]")


def silence(seconds: float, label: str | None = None) -> None:
    global counter
    name = label or f"a{counter}"
    counter += 1
    filters.append(
        f"anullsrc=r=48000:cl=stereo,atrim=duration={seconds:.4f},"
        f"asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:channel_layouts=stereo[{name}]"
    )
    labels.append(f"[{name}]")


# Finish Bruno's thought, then Valentina calls just once, only 0.15–0.2s later.
# Her call now lands at 9.8s, shortly after Bruno finishes saying "aprender".
source_clip(0.0, 9.8, "prefix")
source_clip(12.05, 12.55, "valentina_single_call")
silence(0.20, "before_bruno_reply")

# Keep the original voices and performances for the remaining exchange.
source_clip(15.711, 25.0, "middle")

# The new, complete Argentine Bruno take replaces the previously stitched phrase.
filters.append(
    "[1:a]atrim=start=0:duration=3.2000,asetpts=PTS-STARTPTS,aresample=48000,"
    "aformat=sample_fmts=fltp:channel_layouts=stereo[daily_line]"
)
labels.append("[daily_line]")
silence(0.80, "after_daily_line")
source_clip(29.0, 65.0, "tail")

# Preserve the 65-second runtime after the earlier, cleaner exchange.
fixed_duration = 9.8 + 0.5 + 0.2 + (25.0 - 15.711) + 3.2 + 0.8 + (65.0 - 29.0)
end_padding = max(0.0, 65.0 - fixed_duration)
if end_padding:
    silence(end_padding, "end_padding")

graph = ";".join(filters) + ";" + "".join(labels) + f"concat=n={len(labels)}:v=0:a=1[out]"
run([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
    "-i", str(VOICE), "-i", str(PHRASE),
    "-filter_complex", graph,
    "-map", "[out]",
    "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000",
    str(TEMP),
])
if not TEMP.exists() or TEMP.stat().st_size < 100_000:
    raise SystemExit("The revised voice track was not created correctly.")
TEMP.replace(VOICE)
PHRASE.unlink(missing_ok=True)
print(f"Prepared 65-second revised Entre Partidas narration: {VOICE.stat().st_size} bytes")
