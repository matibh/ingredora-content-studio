#!/usr/bin/env python3
"""Five-character voices, punchline laughter and supplied outro, mixed with FFmpeg only."""
from __future__ import annotations
import asyncio,json,math,shutil,subprocess,tempfile
from datetime import datetime,timezone
from pathlib import Path
import edge_tts

AUDIO_DIR=Path("public/studio/audio/entre-partidas/dinner-02")
PACKAGE_PATH=Path("public/studio/packages/entre-partidas-dinner.v1.json")
LAUGH_PATH=AUDIO_DIR/"risa.mp3"
OUTRO_PATH=AUDIO_DIR/"risa-y-outro.mp3"
VOICE_PATH=AUDIO_DIR/"voice-track.mp3"
TIMINGS_PATH=AUDIO_DIR/"word-timings.json"
FPS=30
LAUGH_SECONDS=2.20
SAMPLE_RATE=48_000
LAUGH_GAIN_DB=-5.5
OUTRO_GAIN_DB=-1.2
CAST={
 "martina":{"voice":"es-AR-ElenaNeural","rate":"-3%","pitch":"-2Hz","volume":"+5%"},
 "bruno":{"voice":"es-AR-TomasNeural","rate":"+7%","pitch":"+4Hz","volume":"+7%"},
 "tomas":{"voice":"es-UY-MateoNeural","rate":"+9%","pitch":"+7Hz","volume":"+5%"},
 "valentina":{"voice":"es-UY-ValentinaNeural","rate":"-5%","pitch":"-1Hz","volume":"+5%"},
 "ernesto":{"voice":"es-CL-LorenzoNeural","rate":"-12%","pitch":"-6Hz","volume":"+6%"},
}
SEGMENTS=[
    {"id":"01-bruno-ingredients-a","speaker":"bruno","text":"Agua carbonatada, azúcar o jarabe de maíz de alta fructosa, colorante caramelo ciento cincuenta D...","look":"martina","laugh":False},
    {"id":"02-bruno-ingredients-b","speaker":"bruno","text":"...acidulante tres treinta y ocho, aromas, edulcorante sucralosa. Contiene cafeína.","look":"bruno","laugh":False},
    {"id":"03-martina-analysis","speaker":"martina","text":"¿Podés pasar la Coca sin hacerle un análisis de laboratorio?","look":"bruno","laugh":False},
    {"id":"04-bruno-study","speaker":"bruno","text":"Estoy estudiando. Después de lo del supermercado, no quiero que me vuelva a pasar.","look":"martina","laugh":False},
    {"id":"05-valentina-gondola","speaker":"valentina","text":"¿Que te encontremos leyendo una góndola?","look":"bruno","laugh":False},
    {"id":"06-bruno-coca","speaker":"bruno","text":"Que me pregunten qué tiene una Coca y yo responda... Coca.","look":"valentina","laugh":True},
    {"id":"07-tomas-jmaf","speaker":"tomas","text":"Pará, ¿JMAF es un ingrediente o la patente de un auto?","look":"bruno","laugh":False},
    {"id":"08-bruno-explain","speaker":"bruno","text":"Jarabe de maíz de alta fructosa. Está abreviado en la etiqueta.","look":"tomas","laugh":False},
    {"id":"09-tomas-car","speaker":"tomas","text":"Ah. Pensé que era el modelo que estaciona afuera.","look":"valentina","laugh":True},
    {"id":"10-ernesto-soda","speaker":"ernesto","text":"En mis tiempos la gaseosa no traía tantas letras. Traía sifón y listo.","look":"martina","laugh":False},
    {"id":"11-martina-siphon","speaker":"martina","text":"Eso era soda, Ernesto.","look":"ernesto","laugh":False},
    {"id":"12-ernesto-label","speaker":"ernesto","text":"Exacto. Y alcanzaba para toda la mesa... si nadie se servía como Bruno.","look":"bruno","laugh":True},
    {"id":"13-valentina-share","speaker":"valentina","text":"Hablando de Bruno, ¿y el ingrediente que te hace compartir?","look":"bruno","laugh":False},
    {"id":"14-bruno-share","speaker":"bruno","text":"No lo encuentro.","look":"valentina","laugh":False},
    {"id":"15-valentina-formula","speaker":"valentina","text":"Claro. Ese no viene en la versión individual.","look":"bruno","laugh":True},
    {"id":"16-tomas-caffeine","speaker":"tomas","text":"¿Y la cafeína es para que las burbujas no se duerman?","look":"martina","laugh":False},
    {"id":"17-martina-bubbles","speaker":"martina","text":"Las burbujas no duermen, Tomás.","look":"tomas","laugh":False},
    {"id":"18-tomas-bubbles","speaker":"tomas","text":"Entonces, ¿por qué siempre están acostadas en el vaso?","look":"valentina","laugh":True},
    {"id":"19-bruno-list","speaker":"bruno","text":"Listo. Ya me aprendí toda la etiqueta: agua, azúcar, colorante, ácido, aromas y cafeína.","look":"martina","laugh":False},
    {"id":"20-ernesto-list","speaker":"ernesto","text":"Perfecto. Ahora aprendete la lista de tareas: cinco comensales, una pileta llena de platos.","look":"bruno","laugh":False},
    {"id":"21-bruno-defend","speaker":"bruno","text":"Pero yo traje la Coca del supermercado.","look":"ernesto","laugh":False},
    {"id":"22-valentina-quality","speaker":"valentina","text":"Y te la estás tomando vos solo.","look":"bruno","laugh":True},
    {"id":"23-bruno-quality","speaker":"bruno","text":"Estoy haciendo la prueba de calidad.","look":"valentina","laugh":False},
    {"id":"24-martina-empty","speaker":"martina","text":"La prueba terminó. La botella está vacía.","look":"bruno","laugh":False},
    {"id":"25-ernesto-result","speaker":"ernesto","text":"¿Y qué resultado dio?","look":"bruno","laugh":False},
    {"id":"26-bruno-result","speaker":"bruno","text":"Aprobada.","look":"ernesto","laugh":False},
    {"id":"27-ernesto-dishes","speaker":"ernesto","text":"Bueno, entonces aprobá también lavar los platos.","look":"bruno","laugh":True},
]

def run(command: list[str]) -> str:
    result=subprocess.run(command,check=True,capture_output=True,text=True)
    return result.stdout.strip()

def media_duration(path: Path) -> float:
    return float(run(["ffprobe","-v","error","-show_entries","format=duration",
                      "-of","default=noprint_wrappers=1:nokey=1",str(path)]))

def normalize_audio(source: Path,target: Path,filters: str="") -> None:
    command=["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(source)]
    if filters: command += ["-af",filters]
    command += ["-vn","-ac","2","-ar",str(SAMPLE_RATE),"-c:a","pcm_s16le",str(target)]
    run(command)

def create_silence(path: Path,seconds: float) -> None:
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","lavfi","-i",
         f"anullsrc=r={SAMPLE_RATE}:cl=stereo","-t",f"{max(seconds,.001):.6f}",
         "-c:a","pcm_s16le",str(path)])

def concat_wavs(items: list[Path],target: Path,work: Path) -> None:
    list_path=work/(target.stem+".concat.txt")
    lines=[]
    for path in items:
        escaped=str(path.resolve()).replace("'","'\\''")
        lines.append("file '"+escaped+"'")
    list_path.write_text("\n".join(lines)+"\n",encoding="utf-8")
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0",
         "-i",str(list_path),"-c:a","pcm_s16le","-ar",str(SAMPLE_RATE),"-ac","2",str(target)])

async def synthesize(segment: dict,work: Path,index: int):
    voice=CAST[segment["speaker"]]
    communicate=edge_tts.Communicate(segment["text"],voice["voice"],rate=voice["rate"],
        pitch=voice["pitch"],volume=voice["volume"],boundary="WordBoundary")
    chunks=[];words=[]
    async for event in communicate.stream():
        if event["type"]=="audio": chunks.append(event["data"])
        elif event["type"]=="WordBoundary":
            words.append({"text":event["text"],"start":event["offset"]/10_000_000,
                          "end":(event["offset"]+event["duration"])/10_000_000})
    if not chunks or not words: raise RuntimeError("Edge TTS no generó voz sincronizable: "+segment["id"])
    raw=work/f"voice-{index:02d}.mp3";raw.write_bytes(b"".join(chunks))
    wav=work/f"voice-{index:02d}.wav";normalize_audio(raw,wav)
    seconds=media_duration(wav)
    if seconds<.25 or wav.stat().st_size<5_000: raise RuntimeError("La voz quedó vacía: "+segment["id"])
    return wav,words,seconds

async def main():
    AUDIO_DIR.mkdir(parents=True,exist_ok=True)
    for path in (LAUGH_PATH,OUTRO_PATH):
        if not path.is_file() or path.stat().st_size<100: raise SystemExit("Falta el MP3 subido: "+str(path))
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("FFmpeg y ffprobe deben estar instalados.")
    laugh_seconds=media_duration(LAUGH_PATH);outro_seconds=media_duration(OUTRO_PATH)
    if laugh_seconds<LAUGH_SECONDS: raise RuntimeError(f"risa.mp3 dura {laugh_seconds:.2f}s; se requieren {LAUGH_SECONDS:.2f}s.")
    if outro_seconds<2: raise RuntimeError("El outro subido es demasiado corto.")
    with tempfile.TemporaryDirectory(prefix="entre-partidas-dinner-",dir=AUDIO_DIR) as tmp:
        work=Path(tmp)
        laugh_wav=work/"laugh.wav"
        normalize_audio(LAUGH_PATH,laugh_wav,
          f"atrim=0:{LAUGH_SECONDS:.3f},volume={LAUGH_GAIN_DB}dB,afade=t=in:st=0:d=0.055,afade=t=out:st={LAUGH_SECONDS-.30:.3f}:d=0.30,aresample={SAMPLE_RATE}")
        outro_wav=work/"outro.wav"
        normalize_audio(OUTRO_PATH,outro_wav,
          f"volume={OUTRO_GAIN_DB}dB,afade=t=in:st=0:d=0.10,afade=t=out:st={max(0.0,outro_seconds-.65):.3f}:d=0.65,aresample={SAMPLE_RATE}")
        pause=work/"pause-240ms.wav";reaction=work/"pause-after-laugh.wav";opening=work/"opening-pad.wav"
        create_silence(pause,.24);create_silence(reaction,.28);create_silence(opening,.32)
        parts=[opening];cues=[];word_timings=[];segment_timings=[];laugh_marks=[];cursor=.32
        for index,segment in enumerate(SEGMENTS):
            wav,words,seconds=await synthesize(segment,work,index)
            start=cursor;end=start+seconds
            cues.append({"id":segment["id"],"speaker":segment["speaker"],"text":segment["text"],
                         "start":round(start,4),"end":round(end,4),"look":segment["look"]})
            segment_timings.append({"id":segment["id"],"speaker":segment["speaker"],"text":segment["text"],
                "start":round(start,4),"end":round(end,4),"voice":CAST[segment["speaker"]]["voice"]})
            for word in words:
                word_timings.append({"text":word["text"],"start":round(start+word["start"],4),
                    "end":round(start+word["end"],4),"speaker":segment["speaker"],"segmentId":segment["id"]})
            parts.append(wav);cursor=end
            if segment["laugh"]:
                laugh_marks.append({"segmentId":segment["id"],"start":round(cursor,4),"duration":LAUGH_SECONDS})
                parts.extend([laugh_wav,reaction]);cursor+=LAUGH_SECONDS+.28
            else:
                parts.append(pause);cursor+=.24
        end_card_start=cursor
        parts.append(outro_wav)
        estimated=cursor+outro_seconds
        frame_count=math.ceil(estimated*FPS);duration=frame_count/FPS
        final_pad=max(0.0,duration-estimated)
        if final_pad>.001:
            pad=work/"final-frame-pad.wav";create_silence(pad,final_pad);parts.append(pad)
        mixed=work/"voice-track.wav";concat_wavs(parts,mixed,work)
        actual=media_duration(mixed)
        if abs(actual-duration)>.06: raise RuntimeError(f"Audio desincronizado: {actual:.3f}s frente a {duration:.3f}s.")
        run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(mixed),
             "-c:a","libmp3lame","-b:a","192k","-ar",str(SAMPLE_RATE),"-ac","2",str(VOICE_PATH)])
    package=json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))
    package["createdAt"]=datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00","Z")
    package["dialogue"]=cues;package["durationSeconds"]=duration;package["endCardStart"]=round(end_card_start,4)
    package["voiceoverUrl"]="studio/audio/entre-partidas/dinner-02/voice-track.mp3"
    package["wordTimingsUrl"]="studio/audio/entre-partidas/dinner-02/word-timings.json"
    package["voiceoverOffsetSeconds"]=0
    for scene in package["scenes"]: scene["durationFrames"]=frame_count
    PACKAGE_PATH.write_text(json.dumps(package,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    TIMINGS_PATH.write_text(json.dumps({"engine":"edge-tts","durationSeconds":duration,"words":word_timings,
      "segments":segment_timings,"laughs":laugh_marks,"endCardStart":round(end_card_start,4)},
      ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    if not VOICE_PATH.exists() or VOICE_PATH.stat().st_size<100_000: raise RuntimeError("No se pudo guardar la pista final de cinco voces.")
    print(f"DINNER_AUDIO_OK segments={len(cues)} speakers={len(CAST)} laughs={len(laugh_marks)} laugh_clip={LAUGH_SECONDS:.2f}s outro={outro_seconds:.2f}s credits_start={end_card_start:.2f}s duration={duration:.2f}s")
    for cue in cues: print(f"{cue['start']:.2f}-{cue['end']:.2f} {cue['speaker']}: {cue['text']}")

if __name__=="__main__": asyncio.run(main())
