#!/usr/bin/env python3
"""Builds the Spanish-Argentina/Uruguay voices and exact timed package for EP-S03."""
from __future__ import annotations
import asyncio, json, math, subprocess
from pathlib import Path
import edge_tts

AUDIO = Path("public/studio/audio/entre-partidas/roadtrip-03")
PACKAGE = Path("public/studio/packages/entre-partidas-roadtrip.v1.json")
LAUGH = AUDIO / "risa.mp3"
OUTRO = AUDIO / "risa-y-outro.mp3"
INTRO = AUDIO / "intro-theme.mp3"
VOICE_TRACK = AUDIO / "voice-track.mp3"
TIMINGS = AUDIO / "word-timings.json"
FPS = 24

CAST = {
    "bruno": {"voice": "es-AR-TomasNeural", "rate": "+4%", "pitch": "+2Hz", "volume": "+5%"},
    "valentina": {"voice": "es-UY-ValentinaNeural", "rate": "-3%", "pitch": "-1Hz", "volume": "+5%"},
}
# A single connected scene: the first billboard starts the game; the second
# interrupts the practice run. Billboard views are deliberately brief inserts.
# Laughs are deliberately short and only after the strongest punchlines.
SEGMENTS = [
 {"id":"01-bruno-cartel-alfajor","speaker":"bruno","text":"Mirá ese cartel. Un alfajor. Ese lo conozco de toda la vida: me sé todos los ingredientes.","look":"valentina","shot":"billboardRight","pause":0.38},
 {"id":"02-valentina-nombramelos","speaker":"valentina","text":"¿Ah, sí? Nombramelos.","look":"bruno","shot":"valentina","pause":0.3},
 {"id":"03-bruno-lista","speaker":"bruno","text":"Chocolate, dulce de leche, harina...","look":"valentina","shot":"bruno","pause":0.28},
 {"id":"04-valentina-foto","speaker":"valentina","text":"Eso es lo que ves en la foto.","look":"bruno","shot":"valentina","pause":0.3},
 {"id":"05-bruno-arbol","speaker":"bruno","text":"¿Y qué querés? ¿Que le pida el árbol genealógico al alfajor?","look":"valentina","shot":"bruno","laugh":True,"pause":0.85},
 {"id":"06-bruno-cartel-oreo","speaker":"bruno","text":"Qué ricas unas Oreo. Ahora quiero un paquete.","look":"valentina","shot":"billboardLeft","pause":0.35},
 {"id":"07-valentina-prueba","speaker":"valentina","text":"Y vos sos la prueba de que funciona.","look":"bruno","shot":"valentina","pause":0.25},
 {"id":"08-bruno-por","speaker":"bruno","text":"¿Por?","look":"valentina","shot":"bruno","pause":0.2},
 {"id":"09-valentina-convencido","speaker":"valentina","text":"Porque todavía no sabemos qué tiene adentro y ya te convencieron.","look":"bruno","shot":"valentina","laugh":True,"pause":0.82},
 {"id":"10-bruno-marketing","speaker":"bruno","text":"Eso es marketing. Está hecho para llamar la atención.","look":"valentina","shot":"bruno","pause":0.25},
 {"id":"11-valentina-carteles","speaker":"valentina","text":"Y mirá cómo te tiene. No podés pasar por un cartel sin querer comerte algo.","look":"bruno","shot":"valentina","pause":0.3},
 {"id":"12-bruno-mercado","speaker":"bruno","text":"Estoy haciendo un análisis de mercado.","look":"valentina","shot":"bruno","pause":0.24},
 {"id":"13-valentina-foto","speaker":"valentina","text":"Estás babeando por una foto.","look":"bruno","shot":"valentina","laugh":True,"pause":0.85},
 {"id":"14-bruno-distraccion","speaker":"bruno","text":"Estoy jugando mal porque me distraen los carteles.","look":"valentina","shot":"bruno","pause":0.3},
 {"id":"15-valentina-ruta","speaker":"valentina","text":"Estamos en una ruta. Hay carteles.","look":"bruno","shot":"valentina","pause":0.22},
 {"id":"16-bruno-provocacion","speaker":"bruno","text":"¡Bueno, pero ponen comida! Es una provocación.","look":"valentina","shot":"bruno","pause":0.25},
 {"id":"17-valentina-verduras","speaker":"valentina","text":"¿Querés que la próxima ruta venga con carteles de verduras hervidas para que no te emociones?","look":"bruno","shot":"valentina","laugh":True,"pause":0.9},
 {"id":"18-bruno-extremo","speaker":"bruno","text":"No, tampoco hay que irse al otro extremo.","look":"valentina","shot":"bruno","pause":0.42},
 {"id":"19-valentina-recuperarte","speaker":"valentina","text":"¿Seguimos o te doy cinco minutos para recuperarte?","look":"bruno","shot":"valentina","pause":0.35},
 {"id":"20-bruno-parada","speaker":"bruno","text":"En la próxima estación paramos.","look":"valentina","shot":"master","pause":0.25},
 {"id":"21-valentina-descanso","speaker":"valentina","text":"¿Para que descanses?","look":"bruno","shot":"valentina","pause":0.22},
 {"id":"22-bruno-material","speaker":"bruno","text":"No. Voy a comprar un alfajor. Necesito estudiar el material en persona.","look":"valentina","shot":"bruno","pause":0.32},
 {"id":"23-valentina-metodo","speaker":"valentina","text":"Ah, claro. Tu método científico: comértelo hasta que te dé la respuesta.","look":"bruno","shot":"valentina","laugh":True,"pause":0.85},
 {"id":"24-bruno-empieza","speaker":"bruno","text":"Por algo se empieza.","look":"valentina","shot":"bruno","pause":0.35}
]

def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, check=True, text=True, capture_output=True)
    return result.stdout.strip()

def duration(path: Path) -> float:
    return float(run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(path)]))

async def make_voice(segment: dict, dest: Path):
    voice = CAST[segment["speaker"]]
    communicate = edge_tts.Communicate(segment["text"], voice["voice"], rate=voice["rate"], pitch=voice["pitch"], volume=voice["volume"])
    await communicate.save(str(dest))

async def main():
    AUDIO.mkdir(parents=True, exist_ok=True)
    if not LAUGH.exists() or not OUTRO.exists():
        raise FileNotFoundError("Faltan los MP3 originales de risa y outro en el paquete de audio.")
    # Original short instrumental sting for the series opening; warm, restrained and royalty-free synthesis.
    run(["ffmpeg","-y","-f","lavfi","-i","aevalsrc=0.10*sin(2*PI*261.63*t)+0.08*sin(2*PI*329.63*t)+0.07*sin(2*PI*392.00*t)+0.04*sin(2*PI*523.25*t):s=48000:d=3.4","-af","afade=t=out:st=2.65:d=0.75,volume=0.75","-c:a","libmp3lame","-b:a","160k",str(INTRO)])
    cues=[]
    clips=[(INTRO,0.0,0.72)]
    cursor=3.25
    for index,segment in enumerate(SEGMENTS):
        path=AUDIO/f"line-{index+1:02d}.mp3"
        await make_voice(segment,path)
        clip_duration=duration(path)
        start=cursor
        end=start+clip_duration
        cue={k:segment[k] for k in ("id","speaker","text","look","shot") if k in segment}
        cue.update({"start":round(start,3),"end":round(end,3)})
        if segment.get("laugh"): cue["laugh"]=True
        cues.append(cue)
        clips.append((path,start,1.0))
        if segment.get("laugh"):
            # Reproducir el MP3 original completo; entra apenas antes de terminar el remate.
            # No se recorta, acelera ni sustituye el archivo de risas.
            laugh_start=max(start,end-.18)
            laugh_playback=duration(LAUGH)
            clips.append((LAUGH,laugh_start,.48))
            cursor=laugh_start+laugh_playback+.25
        else:
            cursor=end+float(segment.get("pause",.3))
    billboard_right_at=next(c["start"] for c in cues if c["id"]=="01-bruno-cartel-alfajor")
    billboard_left_at=next(c["start"] for c in cues if c["id"]=="06-bruno-cartel-oreo")
    end_card_start=cursor+.20
    clips.append((OUTRO,end_card_start,.74))
    outro_duration=duration(OUTRO)
    total=math.ceil(end_card_start+outro_duration+.5)
    cmd=["ffmpeg","-y"]
    for path,_,_ in clips: cmd += ["-i",str(path)]
    filters=[]
    for i,(path,start,gain) in enumerate(clips):
        delay=round(start*1000)
        filters.append(f"[{i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume={gain},adelay={delay}|{delay}[a{i}]")
    joined="".join(f"[a{i}]" for i in range(len(clips)))
    filters.append(f"{joined}amix=inputs={len(clips)}:duration=longest:dropout_transition=0:normalize=0,alimiter=limit=0.94,apad=pad_dur=0.35[aout]")
    cmd += ["-filter_complex",";".join(filters),"-map","[aout]","-c:a","libmp3lame","-b:a","192k","-ar","48000","-ac","2",str(VOICE_TRACK)]
    run(cmd)
    package={
      "schemaVersion":1,"engineVersion":"entre-partidas-roadtrip-1.0.0",
      "id":"ingredora-entre-partidas-roadtrip-003","title":"Entre Partidas — Lo sé todo",
      "createdAt":"2026-11-22T16:00:00-03:00","fps":24,"width":720,"height":1280,
      "durationSeconds":total,"endCardStart":round(end_card_start,3),
      "billboardRightAt":round(billboard_right_at,3),"billboardLeftAt":round(billboard_left_at,3),
      "dialogue":cues,
      "voiceoverUrl":"studio/audio/entre-partidas/roadtrip-03/voice-track.mp3",
      "wordTimingsUrl":"studio/audio/entre-partidas/roadtrip-03/word-timings.json"
    }
    PACKAGE.write_text(json.dumps(package,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    TIMINGS.write_text(json.dumps({"schemaVersion":1,"fps":FPS,"cues":[{"id":c["id"],"speaker":c["speaker"],"start":c["start"],"end":c["end"],"text":c["text"]} for c in cues]},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"AUDIO_FILE={VOICE_TRACK} DURATION={duration(VOICE_TRACK):.2f}s")
    print(f"PACKAGE_DURATION={total}s ENDCARD={end_card_start:.2f}s CUES={len(cues)}")
    print(f"BILLBOARDS right={billboard_right_at:.2f}s left={billboard_left_at:.2f}s")

if __name__=="__main__":
    asyncio.run(main())
