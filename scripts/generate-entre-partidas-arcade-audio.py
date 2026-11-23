#!/usr/bin/env python3
"""Genera voces rioplatenses, risas y tiempos exactos para Entre Partidas EP-S04."""
# FFmpeg is supplied by the runner image whenever available.
from __future__ import annotations
import asyncio, json, math, shutil, subprocess, tempfile
from pathlib import Path
import edge_tts

AUDIO=Path("public/studio/audio/entre-partidas/arcade-04")
PACKAGE=Path("public/studio/packages/entre-partidas-arcade.v1.json")
LAUGH=AUDIO/"risa.mp3"
OUTRO=AUDIO/"risa-y-outro.mp3"
VOICE=AUDIO/"voice-track.mp3"
TIMINGS=AUDIO/"word-timings.json"
FPS=24
CAST={
 "bruno":{"voice":"es-AR-TomasNeural","rate":"+5%","pitch":"+3Hz","volume":"+6%"},
 "martina":{"voice":"es-AR-ElenaNeural","rate":"-2%","pitch":"-2Hz","volume":"+5%"},
 "tomas":{"voice":"es-UY-MateoNeural","rate":"+8%","pitch":"+7Hz","volume":"+5%"},
 "valentina":{"voice":"es-UY-ValentinaNeural","rate":"-4%","pitch":"-1Hz","volume":"+5%"},
 "ernesto":{"voice":"es-CL-LorenzoNeural","rate":"-10%","pitch":"-5Hz","volume":"+6%"},
}
SEGMENTS=[
 {"id":"01-bruno-empuja","speaker":"bruno","text":"¡Dale, dale! ¡Un poquito más!","look":"martina","shot":"master","pause":.25},
 {"id":"02-martina-no-entra","speaker":"martina","text":"¡Bruno, no entra!","look":"bruno","shot":"martina","pause":.25},
 {"id":"03-bruno-si-entra","speaker":"bruno","text":"¡Sí entra! ¡Tiene que entrar!","look":"martina","shot":"bruno","pause":.35},
 {"id":"04-tomas-costado","speaker":"tomas","text":"¿Y si la ponemos de costado?","look":"ernesto","shot":"tomas","pause":.22},
 {"id":"05-ernesto-costado","speaker":"ernesto","text":"¡Está de costado!","look":"tomas","shot":"ernesto","pause":.2},
 {"id":"06-tomas-otro-lado","speaker":"tomas","text":"Bueno... ¡del otro costado!","look":"martina","shot":"tomas","pause":.35},
 {"id":"07-valentina-mediste","speaker":"valentina","text":"Bruno, ¿vos mediste la puerta antes de comprarla?","look":"bruno","shot":"valentina","pause":.8},
 {"id":"08-bruno-no","speaker":"bruno","text":"Bueno... no.","look":"valentina","shot":"bruno","pause":.4},
 {"id":"09-martina-como-que-no","speaker":"martina","text":"¿Cómo que no?","look":"bruno","shot":"martina","pause":.25},
 {"id":"10-tomas-genio","speaker":"tomas","text":"¡Ja, ja, ja! ¡El genio de Ingredora!","look":"bruno","shot":"tomas","laugh":True,"pause":.55},
 {"id":"11-bruno-ayuden","speaker":"bruno","text":"¡No se rían! ¡Ayuden!","look":"tomas","shot":"bruno","pause":.35},
 {"id":"12-ernesto-ahora","speaker":"ernesto","text":"¿Y ahora qué hacemos?","look":"martina","shot":"ernesto","pause":.3},
 {"id":"13-martina-idea","speaker":"martina","text":"No sé. ¿Tenés alguna idea?","look":"bruno","shot":"martina","pause":.55},
 {"id":"14-bruno-mudarnos","speaker":"bruno","text":"Sí. Nos vamos a tener que mudar.","look":"valentina","shot":"bruno","pause":.8},
]
def run(cmd:list[str])->str:
 p=subprocess.run(cmd,check=True,capture_output=True,text=True);return p.stdout.strip()
def duration(path:Path)->float:
 return float(run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)]))
def silence(path:Path,seconds:float):
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","lavfi","-i","anullsrc=r=48000:cl=stereo","-t",f"{max(seconds,.001):.6f}","-c:a","pcm_s16le",str(path)])
def normalize(src:Path,dst:Path,filters:str=""):
 cmd=["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(src)]
 if filters:cmd+=["-af",filters]
 cmd += ["-vn","-ac","2","-ar","48000","-c:a","pcm_s16le",str(dst)]
 run(cmd)
async def synthesize(seg:dict,work:Path,index:int):
 v=CAST[seg["speaker"]]
 talker=edge_tts.Communicate(seg["text"],v["voice"],rate=v["rate"],pitch=v["pitch"],volume=v["volume"],boundary="WordBoundary")
 chunks=[];words=[]
 async for event in talker.stream():
  if event["type"]=="audio":chunks.append(event["data"])
  elif event["type"]=="WordBoundary":
   words.append({"text":event["text"],"start":event["offset"]/10_000_000,"end":(event["offset"]+event["duration"])/10_000_000})
 if not chunks:raise RuntimeError("Edge TTS no generó audio para "+seg["id"])
 raw=work/f"clip-{index:02d}.mp3";raw.write_bytes(b"".join(chunks))
 wav=work/f"clip-{index:02d}.wav";normalize(raw,wav)
 return wav,words,duration(wav)
def concat(items:list[Path],dst:Path,work:Path):
 listing=work/"concat.txt"
 listing.write_text("\n".join("file '"+str(p.resolve()).replace("'","'\\''")+"'" for p in items)+"\n",encoding="utf-8")
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(listing),"-c:a","pcm_s16le","-ar","48000","-ac","2",str(dst)])
async def main():
 AUDIO.mkdir(parents=True,exist_ok=True)
 for p in [LAUGH,OUTRO]:
  if not p.is_file() or p.stat().st_size<100:raise SystemExit("Falta el recurso de audio original: "+str(p))
 with tempfile.TemporaryDirectory(prefix="arcade-04-",dir=AUDIO) as td:
  work=Path(td);parts=[];cues=[];words=[];cursor=3.15
  intro=work/"intro.wav";silence(intro,cursor);parts.append(intro)
  laugh=work/"laugh.wav";normalize(LAUGH,laugh,"atrim=start=0:end=1.65,volume=-5dB,afade=t=in:st=0:d=0.04,afade=t=out:st=1.35:d=0.30")
  pad=work/"pad.wav"
  for i,seg in enumerate(SEGMENTS):
   clip,clip_words,seconds=await synthesize(seg,work,i)
   start=cursor;end=start+seconds
   cues.append({**{k:seg[k] for k in ["id","speaker","text","look","shot"] if k in seg},"start":round(start,3),"end":round(end,3),"laugh":bool(seg.get("laugh"))})
   for w in clip_words:words.append({"segment":seg["id"],"speaker":seg["speaker"],"text":w["text"],"start":round(start+w["start"],3),"end":round(start+w["end"],3)})
   parts.append(clip);cursor=end
   if seg.get("laugh"):parts.append(laugh);cursor+=1.65
   pause=work/f"pause-{i:02d}.wav";silence(pause,seg.get("pause",.25));parts.append(pause);cursor+=seg.get("pause",.25)
  end_card=cursor
  outro_wav=work/"outro.wav";normalize(OUTRO,outro_wav,"volume=-1.2dB,afade=t=in:st=0:d=0.12")
  parts.append(outro_wav);total=cursor+duration(OUTRO)
  combined=work/"combined.wav";concat(parts,combined,work)
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(combined),"-c:a","libmp3lame","-b:a","192k",str(VOICE)])
  pkg=json.loads(PACKAGE.read_text(encoding="utf-8"))
  pkg["dialogue"]=cues;pkg["endCardStart"]=round(end_card,3);pkg["durationSeconds"]=math.ceil(total)
  PACKAGE.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  TIMINGS.write_text(json.dumps({"fps":FPS,"durationSeconds":pkg["durationSeconds"],"dialogue":cues,"words":words},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print(f"VOICE={VOICE} duration={duration(VOICE):.2f}s; dialogue={len(cues)}; endcard={end_card:.2f}s; total={pkg['durationSeconds']}s")
if __name__=="__main__":asyncio.run(main())
