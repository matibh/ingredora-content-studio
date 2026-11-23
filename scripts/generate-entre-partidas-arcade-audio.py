#!/usr/bin/env python3
"""Genera voces rioplatenses, risas y tiempos exactos para Entre Partidas EP-S05."""
# FFmpeg uses the runner image package cache when the binary is absent.
from __future__ import annotations
import asyncio, json, math, shutil, subprocess, tempfile
from pathlib import Path
import edge_tts

AUDIO=Path("public/studio/audio/entre-partidas/arcade-05")
PACKAGE=Path("public/studio/packages/entre-partidas-arcade.v1.json")
INTRO=AUDIO/"chapter-2-intro-music.wav"
LAUGH=AUDIO/"risa.mp3"
OUTRO=AUDIO/"risa-y-outro.mp3"
VOICE=AUDIO/"voice-track.mp3"
TIMINGS=AUDIO/"word-timings.json"
FPS=24
INTRO_SECONDS=3.15
LAUGH_SECONDS=2.20
CAST={
 "bruno":{"voice":"es-AR-TomasNeural","rate":"+5%","pitch":"+3Hz","volume":"+6%"},
 "martina":{"voice":"es-AR-ElenaNeural","rate":"-2%","pitch":"-2Hz","volume":"+5%"},
 "tomas":{"voice":"es-UY-MateoNeural","rate":"+8%","pitch":"+7Hz","volume":"+5%"},
 "valentina":{"voice":"es-UY-ValentinaNeural","rate":"-4%","pitch":"-1Hz","volume":"+5%"},
 "ernesto":{"voice":"es-CL-LorenzoNeural","rate":"-10%","pitch":"-5Hz","volume":"+6%"},
}
SEGMENTS=[
 {"id":"01-inauguracion","speaker":"bruno","text":"¡Bienvenidos al primer torneo internacional del pasillo!","look":"martina","shot":"bruno","pause":.4},
 {"id":"02-internacional","speaker":"martina","text":"¿Internacional? Estamos los cinco acá.","look":"bruno","shot":"martina","laugh":True,"pause":.3},
 {"id":"03-ambientes","speaker":"bruno","text":"Hay participantes de distintos ambientes.","look":"martina","shot":"bruno","pause":.35},
 {"id":"04-premio","speaker":"ernesto","text":"¿Y cuál es el premio?","look":"bruno","shot":"ernesto","pause":.2},
 {"id":"05-respeto","speaker":"bruno","text":"El respeto de los demás.","look":"ernesto","shot":"bruno","pause":.2},
 {"id":"06-sin-plata","speaker":"ernesto","text":"¿No tenés plata para comprar un premio?","look":"bruno","shot":"ernesto","pause":.3},
 {"id":"07-no-precio","speaker":"bruno","text":"El respeto no tiene precio.","look":"ernesto","shot":"bruno","pause":.2},
 {"id":"08-no-pagar","speaker":"ernesto","text":"Claro, porque no lo podés pagar.","look":"bruno","shot":"ernesto","laugh":True,"pause":.4},
 {"id":"09-reglas","speaker":"tomas","text":"¿Y cuáles son las reglas?","look":"bruno","shot":"tomas","pause":.2},
 {"id":"10-gana","speaker":"bruno","text":"Son simples: gana el que más puntos hace.","look":"tomas","shot":"bruno","pause":.25},
 {"id":"11-perder","speaker":"valentina","text":"¿Y si alguien pierde?","look":"bruno","shot":"valentina","pause":.2},
 {"id":"12-yo-gano","speaker":"bruno","text":"No está contemplado. Yo organicé esto para ganar.","look":"valentina","shot":"bruno","laugh":True,"pause":.35},
 {"id":"13-boton","speaker":"bruno","text":"¡Está fallando! ¡Este botón no responde!","look":"martina","shot":"bruno","pause":.25},
 {"id":"14-reves","speaker":"martina","text":"Lo estás apretando al revés.","look":"bruno","shot":"martina","pause":.3},
 {"id":"15-tecnica","speaker":"bruno","text":"Es una técnica avanzada.","look":"martina","shot":"bruno","laugh":True,"pause":.35},
 {"id":"16-arreglado","speaker":"ernesto","text":"Esto está arreglado.","look":"tomas","shot":"ernesto","pause":.2},
 {"id":"17-recien","speaker":"valentina","text":"¡Si recién empezaste!","look":"ernesto","shot":"valentina","pause":.2},
 {"id":"18-potencial","speaker":"ernesto","text":"No me dieron tiempo a demostrar mi potencial.","look":"valentina","shot":"ernesto","laugh":True,"pause":.35},
 {"id":"19-ocho","speaker":"martina","text":"Voy ganando por ocho.","look":"bruno","shot":"martina","pause":.25},
 {"id":"20-discutible","speaker":"bruno","text":"Ocho es un número bastante discutible.","look":"martina","shot":"bruno","laugh":True,"pause":.35},
 {"id":"21-organizador","speaker":"martina","text":"¿No eras el organizador?","look":"bruno","shot":"martina","pause":.2},
 {"id":"22-imparcial","speaker":"bruno","text":"Sí, por eso tengo que mantener la imparcialidad.","look":"martina","shot":"bruno","pause":.3},
 {"id":"23-perdiste","speaker":"tomas","text":"¡Perdiste!","look":"bruno","shot":"tomas","pause":.2},
 {"id":"24-evaluando","speaker":"bruno","text":"No perdí. Estoy evaluando el torneo desde adentro.","look":"tomas","shot":"bruno","laugh":True,"pause":.45},
 {"id":"25-ahora","speaker":"ernesto","text":"¡Pero ahora me tocaba a mí!","look":"bruno","shot":"ernesto","pause":.2},
 {"id":"26-presupuesto","speaker":"bruno","text":"Se suspendió por falta de presupuesto.","look":"ernesto","shot":"bruno","pause":.2},
 {"id":"27-que-presupuesto","speaker":"martina","text":"¿Qué presupuesto?","look":"bruno","shot":"martina","pause":.2},
 {"id":"28-paciencia","speaker":"bruno","text":"El de paciencia.","look":"martina","shot":"bruno","laugh":True,"pause":.4}
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
 for p in [INTRO,LAUGH,OUTRO]:
  if not p.is_file() or p.stat().st_size<100:raise SystemExit("Falta el recurso de audio original: "+str(p))
 if duration(OUTRO)<INTRO_SECONDS+1.0:raise SystemExit("El archivo risa y outro.mp3 no contiene un cierre musical suficiente.")
 if duration(LAUGH)<LAUGH_SECONDS:raise SystemExit("risa.mp3 debe durar al menos 2.20 segundos.")
 with tempfile.TemporaryDirectory(prefix="arcade-05-",dir=AUDIO) as td:
  work=Path(td);parts=[];cues=[];words=[];cursor=INTRO_SECONDS
  intro=work/"intro.wav"
  normalize(INTRO,intro,f"atrim=start=0:end={INTRO_SECONDS:.3f},volume=0dB,afade=t=in:st=0:d=0.12,afade=t=out:st={INTRO_SECONDS-.35:.3f}:d=0.35")
  parts.append(intro)
  laugh=work/"laugh.wav";normalize(LAUGH,laugh,"atrim=start=0:end=1.65,volume=-5dB,afade=t=in:st=0:d=0.04,afade=t=out:st=1.35:d=0.30")
  final_laugh=work/"final-laugh.wav"
  normalize(LAUGH,final_laugh,f"atrim=start=0:end={LAUGH_SECONDS:.2f},volume=-5.5dB,afade=t=in:st=0:d=0.05,afade=t=out:st={LAUGH_SECONDS-.30:.2f}:d=0.30")
  outro_music=work/"outro-music.wav"
  outro_music_seconds=duration(OUTRO)-LAUGH_SECONDS
  normalize(OUTRO,outro_music,f"atrim=start={LAUGH_SECONDS:.2f},volume=-1.2dB,afade=t=in:st=0:d=0.12,afade=t=out:st={max(0.0,outro_music_seconds-.65):.2f}:d=0.65")
  pad=work/"pad.wav"
  for i,seg in enumerate(SEGMENTS):
   clip,clip_words,seconds=await synthesize(seg,work,i)
   start=cursor;end=start+seconds
   cues.append({**{k:seg[k] for k in ["id","speaker","text","look","shot"] if k in seg},"start":round(start,3),"end":round(end,3),"laugh":bool(seg.get("laugh"))})
   for w in clip_words:words.append({"segment":seg["id"],"speaker":seg["speaker"],"text":w["text"],"start":round(start+w["start"],3),"end":round(start+w["end"],3)})
   parts.append(clip);cursor=end
   if seg.get("laugh"):parts.append(laugh);cursor+=1.65
   pause_seconds=.22 if i==len(SEGMENTS)-1 else seg.get("pause",.25)
   pause=work/f"pause-{i:02d}.wav";silence(pause,pause_seconds);parts.append(pause);cursor+=pause_seconds
  # Match the established series ending: final laugh first, then the instrumental tail of "risa y outro.mp3".
  parts.append(final_laugh);cursor+=duration(final_laugh)
  end_card_pause=work/"end-card-pause.wav";silence(end_card_pause,.18);parts.append(end_card_pause);cursor+=.18
  end_card=cursor
  parts.append(outro_music);total=cursor+duration(outro_music)
  combined=work/"combined.wav";concat(parts,combined,work)
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(combined),"-c:a","libmp3lame","-b:a","192k",str(VOICE)])
  pkg=json.loads(PACKAGE.read_text(encoding="utf-8"))
  pkg["dialogue"]=cues;pkg["endCardStart"]=round(end_card,3);pkg["durationSeconds"]=math.ceil(total)
  PACKAGE.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  TIMINGS.write_text(json.dumps({"fps":FPS,"durationSeconds":pkg["durationSeconds"],"endCardStart":round(end_card,3),"dialogue":cues,"words":words},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print(f"VOICE={VOICE} duration={duration(VOICE):.2f}s; intro={duration(intro):.2f}s; dialogue={len(cues)}; final_laugh={duration(final_laugh):.2f}s; outro_music={duration(outro_music):.2f}s; endcard={end_card:.2f}s; total={pkg['durationSeconds']}s")
if __name__=="__main__":asyncio.run(main())
