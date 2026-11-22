#!/usr/bin/env python3
"""Generate the complete Tomás/Ernesto dialogue track and attach the series outro."""
from __future__ import annotations
import json, math, os, subprocess, sys
from pathlib import Path

PACKAGE=Path("public/studio/packages/entre-partidas-supermarket.v1.json")
AUDIO_DIR=Path("public/studio/audio/entre-partidas/supermarket-02")
VOICE=AUDIO_DIR/"voice-track.mp3"
OUTRO=AUDIO_DIR/"risa-y-outro.mp3"
FPS=30

def run(args:list[str])->str:
    p=subprocess.run(args,check=True,capture_output=True,text=True)
    return p.stdout.strip()

def duration(path:Path)->float:
    return float(run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)]))

AUDIO_DIR.mkdir(parents=True,exist_ok=True)
package=json.loads(PACKAGE.read_text(encoding="utf-8"))
dialogue=package.get("dialogue",[])
if len(dialogue)<15: raise SystemExit("El paquete de Tomás está incompleto.")
if not OUTRO.is_file() or OUTRO.stat().st_size<100: raise SystemExit(f"Falta el outro: {OUTRO}")

clips=[]
for index,cue in enumerate(dialogue):
    speaker=cue["speaker"]
    voice="es-AR-TomasNeural" if speaker=="tomas" else "es-ES-AlvaroNeural"
    target=max(.5,float(cue["end"])-float(cue["start"]))
    raw=AUDIO_DIR/f"line-{index:02d}.mp3"
    fitted=AUDIO_DIR/f"line-{index:02d}-fit.mp3"
    run([sys.executable,"-m","edge_tts","--voice",voice,"--rate","+0%","--text",cue["text"],"--write-media",str(raw)])
    if not raw.exists() or raw.stat().st_size<1000: raise SystemExit(f"Edge TTS no generó la línea {index}: {cue['text']}")
    actual=duration(raw)
    tempo=max(0.5,min(2.0,actual/target))
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(raw),"-af",f"atempo={tempo:.6f}","-ar","48000","-ac","2","-c:a","libmp3lame","-b:a","160k",str(fitted)])
    raw.unlink(missing_ok=True)
    clips.append((fitted,float(cue["start"])))

outro_duration=duration(OUTRO)
end_card_start=124.0
inputs=[]
for path,_ in clips: inputs += ["-i",str(path)]
outro_index=len(clips)
inputs += ["-i",str(OUTRO)]
filters=[]
labels=[]
for i,(_,start) in enumerate(clips):
    delay=max(0,round(start*1000))
    filters.append(f"[{i}:a]adelay={delay}|{delay},volume=1.0[a{i}]")
    labels.append(f"[a{i}]")
filters.append(f"[{outro_index}:a]adelay={round(end_card_start*1000)}|{round(end_card_start*1000)},volume=0.58[outro]")
labels.append("[outro]")
total=end_card_start+outro_duration
filters.append("".join(labels)+f"amix=inputs={len(labels)}:duration=longest:dropout_transition=0:normalize=0,atrim=duration={total:.4f},alimiter=limit=0.95[mix]")
run(["ffmpeg","-hide_banner","-loglevel","error","-y",*inputs,"-filter_complex",";".join(filters),"-map","[mix]","-c:a","libmp3lame","-b:a","192k","-ar","48000","-ac","2",str(VOICE)])
if not VOICE.exists() or VOICE.stat().st_size<100000: raise SystemExit("La pista final quedó vacía o incompleta.")
for path,_ in clips: path.unlink(missing_ok=True)
package["endCardStart"]=end_card_start
package["durationSeconds"]=math.ceil(total*FPS)/FPS
for scene in package["scenes"]: scene["durationFrames"]=math.ceil(total*FPS)
PACKAGE.write_text(json.dumps(package,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"TOMAS_AUDIO_OK lines={len(clips)} outro={outro_duration:.2f}s duration={package['durationSeconds']:.2f}s bytes={VOICE.stat().st_size}")
