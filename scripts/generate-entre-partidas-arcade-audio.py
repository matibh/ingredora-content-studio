#!/usr/bin/env python3
"""Genera voces rioplatenses, risas y tiempos exactos para Entre Partidas EP-S06."""
# FFmpeg uses the runner image package cache when the binary is absent.
from __future__ import annotations
import asyncio, json, math, shutil, subprocess, tempfile
from pathlib import Path
import edge_tts

AUDIO=Path("public/studio/audio/entre-partidas/arcade-06")
PACKAGE=Path("public/studio/packages/entre-partidas-arcade.v1.json")
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
 {"id":"01-martina-devolucion","speaker":"martina","text":"Bueno, Bruno. Ya terminamos. ¿Querés la devolución?","look":"bruno","shot":"martina","pause":.28},
 {"id":"02-bruno-sincera","speaker":"bruno","text":"Sí, pero sean justos. Es mi primera vez.","look":"martina","shot":"bruno","pause":.25},
 {"id":"03-tomas-sincera","speaker":"tomas","text":"¿Sincera o para que no te enojes?","look":"bruno","shot":"tomas","laugh":True,"pause":.32},
 {"id":"04-bruno-obvio","speaker":"bruno","text":"Sincera, obvio.","look":"tomas","shot":"bruno","pause":.22},
 {"id":"05-ernesto-supervivencia","speaker":"ernesto","text":"Entonces tengo una pregunta: ¿la receta era para cinco o para sobrevivir cinco?","look":"bruno","shot":"ernesto","laugh":True,"pause":.36},
 {"id":"06-martina-delivery","speaker":"martina","text":"A mí me gustó. Especialmente cuando llegó el delivery.","look":"bruno","shot":"martina","pause":.25},
 {"id":"07-bruno-comida","speaker":"bruno","text":"¡Pero mi comida estaba bastante bien!","look":"martina","shot":"bruno","pause":.22},
 {"id":"08-valentina-ingredientes","speaker":"valentina","text":"Bruno, el queso estaba frío, el huevo crudo y había una cáscara entera.","look":"bruno","shot":"valentina","pause":.28},
 {"id":"09-bruno-texturas","speaker":"bruno","text":"Era una experiencia gastronómica de texturas.","look":"valentina","shot":"bruno","pause":.24},
 {"id":"10-tomas-adivinar","speaker":"tomas","text":"Sí. Había que adivinar cuál textura te iba a tocar.","look":"bruno","shot":"tomas","laugh":True,"pause":.35},
 {"id":"11-ernesto-principal","speaker":"ernesto","text":"Yo todavía estoy buscando el ingrediente principal.","look":"bruno","shot":"ernesto","pause":.24},
 {"id":"12-bruno-experimental","speaker":"bruno","text":"¡Era una receta experimental!","look":"ernesto","shot":"bruno","pause":.22},
 {"id":"13-ernesto-hospital","speaker":"ernesto","text":"¿Experimental para quién? ¿Para nosotros o para el hospital?","look":"bruno","shot":"ernesto","laugh":True,"pause":.38},
 {"id":"14-bruno-primera-prueba","speaker":"bruno","text":"Bueno, acepto las críticas. Esto fue una primera prueba.","look":"valentina","shot":"bruno","pause":.25},
 {"id":"15-valentina-volver","speaker":"valentina","text":"¿Vas a volver a cocinar?","look":"bruno","shot":"valentina","pause":.22},
 {"id":"16-bruno-mejor","speaker":"bruno","text":"Por supuesto. La próxima vez voy a preparar algo mucho mejor.","look":"valentina","shot":"bruno","pause":.25},
 {"id":"17-tomas-cambiar","speaker":"tomas","text":"¿Y qué vas a cambiar?","look":"bruno","shot":"tomas","pause":.22},
 {"id":"18-bruno-todo","speaker":"bruno","text":"Todo.","look":"tomas","shot":"bruno","pause":.20},
 {"id":"19-ernesto-receta","speaker":"ernesto","text":"¿La receta?","look":"bruno","shot":"ernesto","pause":.22},
 {"id":"20-bruno-publico","speaker":"bruno","text":"No. El público.","look":"ernesto","shot":"bruno","laugh":True,"pause":.38},
 {"id":"21-martina-para-vos","speaker":"martina","text":"La próxima vez cocinás para vos.","look":"bruno","shot":"martina","pause":.24},
 {"id":"22-bruno-sin-criticas","speaker":"bruno","text":"Perfecto. ¡Así no tengo críticas!","look":"martina","shot":"bruno","pause":.24},
 {"id":"23-ernesto-sin-testigos","speaker":"ernesto","text":"Ni testigos.","look":"bruno","shot":"ernesto","laugh":True,"pause":.40},
 {"id":"24-tomas-delantal","speaker":"tomas","text":"¿Y el delantal? ¿Lo vas a guardar?","look":"bruno","shot":"tomas","pause":.24},
 {"id":"25-bruno-restaurante","speaker":"bruno","text":"No. Lo reservo para mi próximo restaurante.","look":"tomas","shot":"bruno","pause":.24},
 {"id":"26-valentina-nombre","speaker":"valentina","text":"¿Cómo se va a llamar?","look":"bruno","shot":"valentina","pause":.22},
 {"id":"27-bruno-brunos","speaker":"bruno","text":"Bruno's.","look":"valentina","shot":"bruno","pause":.24},
 {"id":"28-ernesto-que-sirven","speaker":"ernesto","text":"¿Y qué sirven?","look":"bruno","shot":"ernesto","pause":.22},
 {"id":"29-bruno-delivery","speaker":"bruno","text":"Delivery.","look":"ernesto","shot":"bruno","pause":.12}
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
 if duration(OUTRO)<1.0:raise SystemExit("El archivo risa y outro.mp3 no contiene un cierre suficiente.")
 if duration(LAUGH)<1.65:raise SystemExit("risa.mp3 debe durar al menos 1.65 segundos para los remates intermedios.")
 with tempfile.TemporaryDirectory(prefix="arcade-05-",dir=AUDIO) as td:
  work=Path(td);parts=[];cues=[];words=[];cursor=INTRO_SECONDS
  intro=work/"intro.wav"
  normalize(INTRO,intro,f"atrim=start=0:end={INTRO_SECONDS:.3f},volume=0dB,afade=t=in:st=0:d=0.12,afade=t=out:st={INTRO_SECONDS-.35:.3f}:d=0.35")
  parts.append(intro)
  laugh=work/"laugh.wav";normalize(LAUGH,laugh,"atrim=start=0:end=1.65,volume=-5dB,afade=t=in:st=0:d=0.04,afade=t=out:st=1.35:d=0.30")
  outro_track=work/"outro-y-risas-completo.wav"
  # The original combined outro asset already contains its own laughter and music. Use it once, intact.
  normalize(OUTRO,outro_track)
  for i,seg in enumerate(SEGMENTS):
   clip,clip_words,seconds=await synthesize(seg,work,i)
   start=cursor;end=start+seconds
   cues.append({**{k:seg[k] for k in ["id","speaker","text","look","shot"] if k in seg},"start":round(start,3),"end":round(end,3),"laugh":bool(seg.get("laugh"))})
   for w in clip_words:words.append({"segment":seg["id"],"speaker":seg["speaker"],"text":w["text"],"start":round(start+w["start"],3),"end":round(start+w["end"],3)})
   parts.append(clip);cursor=end
   if seg.get("laugh"):parts.append(laugh);cursor+=1.65
   pause_seconds=.12 if i==len(SEGMENTS)-1 else seg.get("pause",.25)
   pause=work/f"pause-{i:02d}.wav";silence(pause,pause_seconds);parts.append(pause);cursor+=pause_seconds
  # After the final punchline, play only the complete original "risa y outro.mp3" asset.
  end_card=cursor
  parts.append(outro_track);total=cursor+duration(outro_track)
  combined=work/"combined.wav";concat(parts,combined,work)
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(combined),"-c:a","libmp3lame","-b:a","192k",str(VOICE)])
  pkg=json.loads(PACKAGE.read_text(encoding="utf-8"))
  pkg["dialogue"]=cues;pkg["endCardStart"]=round(end_card,3);pkg["durationSeconds"]=math.ceil(total)
  PACKAGE.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  TIMINGS.write_text(json.dumps({"fps":FPS,"durationSeconds":pkg["durationSeconds"],"endCardStart":round(end_card,3),"dialogue":cues,"words":words},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  print(f"VOICE={VOICE} duration={duration(VOICE):.2f}s; intro={duration(intro):.2f}s; dialogue={len(cues)}; outro_y_risas={duration(outro_track):.2f}s (complete original file); endcard={end_card:.2f}s; total={pkg['durationSeconds']}s")
if __name__=="__main__":asyncio.run(main())
