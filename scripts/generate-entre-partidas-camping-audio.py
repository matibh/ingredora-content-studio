#!/usr/bin/env python3
"""Genera voces rioplatenses, risas y tiempos exactos para Entre Partidas EP-S07."""
from __future__ import annotations
import asyncio, json, math, subprocess, tempfile
from pathlib import Path
import edge_tts

AUDIO=Path("public/studio/audio/entre-partidas/camping-07")
PACKAGE=Path("public/studio/packages/entre-partidas-camping.v1.json")
INTRO=AUDIO/"chapter-2-intro-music.wav"
LAUGH=AUDIO/"risa.mp3"
OUTRO=AUDIO/"risa-y-outro.mp3"
VOICE=AUDIO/"voice-track.mp3"
TIMINGS=AUDIO/"word-timings.json"
FPS=24
INTRO_SECONDS=3.15
CAST={
 "bruno":{"voice":"es-AR-TomasNeural","rate":"+5%","pitch":"+3Hz","volume":"+6%"},
 "martina":{"voice":"es-AR-ElenaNeural","rate":"-2%","pitch":"-2Hz","volume":"+5%"},
 "tomas":{"voice":"es-UY-MateoNeural","rate":"+8%","pitch":"+7Hz","volume":"+5%"},
 "valentina":{"voice":"es-UY-ValentinaNeural","rate":"-4%","pitch":"-1Hz","volume":"+5%"},
 "ernesto":{"voice":"es-CL-LorenzoNeural","rate":"-10%","pitch":"-5Hz","volume":"+6%"},
}
SEGMENTS=[
 {"id":"01-bruno-sin-senal","speaker":"bruno","text":"¡No puede ser! ¡No tengo señal!","look":"martina","shot":"bruno","pause":.30},
 {"id":"02-martina-bosque","speaker":"martina","text":"Bruno, estamos en medio del bosque.","look":"bruno","shot":"martina","pause":.24},
 {"id":"03-bruno-reto","speaker":"bruno","text":"¡Me voy a perder el reto diario de Ingredora!","look":"martina","shot":"bruno","pause":.28},
 {"id":"04-tomas-manana","speaker":"tomas","text":"Bueno, mañana tenés otro.","look":"bruno","shot":"tomas","pause":.22},
 {"id":"05-bruno-no-se-acumula","speaker":"bruno","text":"¡Pero el de hoy se pierde! ¡No se guarda para mañana!","look":"tomas","shot":"bruno","pause":.30},
 {"id":"06-ernesto-deuda","speaker":"ernesto","text":"Al fin entendí la diferencia entre un reto y una deuda.","look":"bruno","shot":"ernesto","laugh":True,"pause":.38},
 {"id":"07-valentina-dia","speaker":"valentina","text":"¿No podés pasar un día sin jugar?","look":"bruno","shot":"valentina","pause":.22},
 {"id":"08-bruno-es-ingredora","speaker":"bruno","text":"No. ¡Es el reto diario de Ingredora!","look":"valentina","shot":"bruno","pause":.25},
 {"id":"09-tomas-entrada","speaker":"tomas","text":"Probá cerca de la entrada. Capaz llega algo.","look":"bruno","shot":"tomas","pause":.24},
 {"id":"10-bruno-alguien","speaker":"bruno","text":"¿Alguien tiene señal?","look":"reaction","shot":"bruno","pause":.20},
 {"id":"11-martina-no","speaker":"martina","text":"No.","look":"bruno","shot":"martina","pause":.20},
 {"id":"12-valentina-tampoco","speaker":"valentina","text":"Tampoco.","look":"bruno","shot":"valentina","pause":.20},
 {"id":"13-ernesto-senal","speaker":"ernesto","text":"Yo tengo una señal.","look":"bruno","shot":"ernesto","pause":.20},
 {"id":"14-bruno-cual","speaker":"bruno","text":"¿Cuál?","look":"ernesto","shot":"bruno","pause":.18},
 {"id":"15-ernesto-nada","speaker":"ernesto","text":"La señal de que estamos en el medio de la nada.","look":"bruno","shot":"ernesto","laugh":True,"pause":.36},
 {"id":"16-bruno-solucion","speaker":"bruno","text":"¡Tiene que haber una solución! ¿No hay un lugar más alto?","look":"tomas","shot":"bruno","pause":.26},
 {"id":"17-tomas-torre","speaker":"tomas","text":"Estamos en un bosque, Bruno. No en una torre.","look":"bruno","shot":"tomas","laugh":True,"pause":.35},
 {"id":"18-martina-arbol","speaker":"martina","text":"No vas a treparte a un árbol por un jueguito.","look":"bruno","shot":"martina","pause":.24},
 {"id":"19-bruno-no-jueguito","speaker":"bruno","text":"¡No es un jueguito! ¡Es Ingredora!","look":"martina","shot":"bruno","pause":.25},
 {"id":"20-valentina-disfruta","speaker":"valentina","text":"Dejá el celular y disfrutá del camping.","look":"bruno","shot":"valentina","pause":.24},
 {"id":"21-bruno-no-puedo","speaker":"bruno","text":"¡No puedo! ¡El reto de hoy desaparece para siempre!","look":"valentina","shot":"bruno","pause":.30},
 {"id":"22-bruno-rayita","speaker":"bruno","text":"¡Una rayita! ¡Tengo una rayita!","look":"martina","shot":"bruno","pause":.18},
 {"id":"23-martina-entra","speaker":"martina","text":"¡Entrá rápido!","look":"bruno","shot":"martina","pause":.18},
 {"id":"24-bruno-bateria","speaker":"bruno","text":"No, pará... es la batería.","look":"martina","shot":"bruno","laugh":True,"pause":.34},
 {"id":"25-tomas-senal","speaker":"tomas","text":"¿No tenés señal?","look":"bruno","shot":"tomas","pause":.20},
 {"id":"26-bruno-sin-bateria","speaker":"bruno","text":"No. Y ahora tampoco batería.","look":"tomas","shot":"bruno","pause":.28},
 {"id":"27-valentina-ahora","speaker":"valentina","text":"Bueno, ahora sí podés disfrutar del camping.","look":"bruno","shot":"valentina","pause":.25},
 {"id":"28-bruno-perdi","speaker":"bruno","text":"Perdí el reto diario...","look":"valentina","shot":"bruno","pause":.26},
 {"id":"29-ernesto-senal-humo","speaker":"ernesto","text":"No te preocupes. El camping tiene señal.","look":"bruno","shot":"ernesto","pause":.22},
 {"id":"30-bruno-en-serio","speaker":"bruno","text":"¿En serio?","look":"ernesto","shot":"bruno","pause":.18},
 {"id":"31-ernesto-humo","speaker":"ernesto","text":"Sí. La de humo.","look":"bruno","shot":"ernesto","pause":.38},
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
  elif event["type"]=="WordBoundary":words.append({"text":event["text"],"start":event["offset"]/10_000_000,"end":(event["offset"]+event["duration"])/10_000_000})
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
 if duration(OUTRO)<1.0:raise SystemExit("El archivo risa y outro.mp3 no contiene un cierre suficiente.")
 if duration(LAUGH)<1.65:raise SystemExit("risa.mp3 debe durar al menos 1.65 segundos.")
 with tempfile.TemporaryDirectory(prefix="camping-07-",dir=AUDIO) as td:
  work=Path(td);parts=[];cues=[];words=[];cursor=INTRO_SECONDS
  intro=work/"intro.wav";normalize(INTRO,intro,f"atrim=start=0:end={INTRO_SECONDS:.3f},volume=0dB,afade=t=in:st=0:d=0.12,afade=t=out:st={INTRO_SECONDS-.35:.3f}:d=0.35");parts.append(intro)
  laugh=work/"laugh.wav";normalize(LAUGH,laugh,"atrim=start=0:end=1.65,volume=-5dB,afade=t=in:st=0:d=0.04,afade=t=out:st=1.35:d=0.30")
  outro_track=work/"outro-y-risas-completo.wav";normalize(OUTRO,outro_track)
  for i,seg in enumerate(SEGMENTS):
   clip,clip_words,seconds=await synthesize(seg,work,i);start=cursor;end=start+seconds
   cues.append({**{k:seg[k] for k in ["id","speaker","text","look","shot"] if k in seg},"start":round(start,3),"end":round(end,3),"laugh":bool(seg.get("laugh"))})
   for w in clip_words:words.append({"segment":seg["id"],"speaker":seg["speaker"],"text":w["text"],"start":round(start+w["start"],3),"end":round(start+w["end"],3)})
   parts.append(clip);cursor=end
   if seg.get("laugh"):parts.append(laugh);cursor+=1.65
   pause_seconds=seg.get("pause",.25);pause=work/f"pause-{i:02d}.wav";silence(pause,pause_seconds);parts.append(pause);cursor+=pause_seconds
  end_card=cursor;parts.append(outro_track);total=cursor+duration(outro_track)
  combined=work/"combined.wav";concat(parts,combined,work)
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(combined),"-c:a","libmp3lame","-b:a","192k",str(VOICE)])
  pkg=json.loads(PACKAGE.read_text(encoding="utf-8"));pkg["dialogue"]=cues;pkg["endCardStart"]=round(end_card,3);pkg["durationSeconds"]=math.ceil(total)
  PACKAGE.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  TIMINGS.write_text(json.dumps({"fps":FPS,"durationSeconds":pkg["durationSeconds"],"endCardStart":round(end_card,3),"dialogue":cues,"words":words},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print(f"VOICE={VOICE} duration={duration(VOICE):.2f}s; dialogue={len(cues)}; complete outro={duration(outro_track):.2f}s; endcard={end_card:.2f}s; total={pkg['durationSeconds']}s")
if __name__=="__main__":asyncio.run(main())
