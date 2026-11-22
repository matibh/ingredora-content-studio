#!/usr/bin/env python3
"""Create five differentiated voices, short punchline laughs and the user-supplied credits outro."""
from __future__ import annotations
import asyncio, io, json, math
from datetime import datetime, timezone
from pathlib import Path
import edge_tts
from pydub import AudioSegment

AUDIO_DIR=Path("public/studio/audio/entre-partidas/dinner-02")
PACKAGE_PATH=Path("public/studio/packages/entre-partidas-dinner.v1.json")
LAUGH_PATH=AUDIO_DIR/"risa.mp3"
OUTRO_PATH=AUDIO_DIR/"risa-y-outro.mp3"
VOICE_PATH=AUDIO_DIR/"voice-track.mp3"
TIMINGS_PATH=AUDIO_DIR/"word-timings.json"
FPS=30
LAUGH_MS=2200
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

async def synthesize(segment):
    voice=CAST[segment["speaker"]]
    communicate=edge_tts.Communicate(segment["text"],voice["voice"],rate=voice["rate"],pitch=voice["pitch"],volume=voice["volume"],boundary="WordBoundary")
    chunks=[];words=[]
    async for event in communicate.stream():
        if event["type"]=="audio": chunks.append(event["data"])
        elif event["type"]=="WordBoundary":
            words.append({"text":event["text"],"start":event["offset"]/10_000_000,"end":(event["offset"]+event["duration"])/10_000_000})
    if not chunks or not words: raise RuntimeError("Edge TTS no generó voz sincronizable: "+segment["id"])
    audio=AudioSegment.from_file(io.BytesIO(b"".join(chunks)),format="mp3").set_frame_rate(48_000).set_channels(2)
    if len(audio)<250 or audio.rms<100: raise RuntimeError("La voz quedó vacía: "+segment["id"])
    return audio,words

async def main():
    AUDIO_DIR.mkdir(parents=True,exist_ok=True)
    for path in (LAUGH_PATH,OUTRO_PATH):
        if not path.is_file() or path.stat().st_size<100: raise SystemExit("Falta el MP3 subido: "+str(path))
    laugh_source=AudioSegment.from_file(LAUGH_PATH).set_frame_rate(48_000).set_channels(2)
    outro=AudioSegment.from_file(OUTRO_PATH).set_frame_rate(48_000).set_channels(2)
    if len(laugh_source)<LAUGH_MS: raise RuntimeError(f"risa.mp3 dura {len(laugh_source)/1000:.2f}s; se requieren {LAUGH_MS/1000:.2f}s.")
    if len(outro)<2000: raise RuntimeError("El outro subido es demasiado corto.")
    laugh=laugh_source[:LAUGH_MS].apply_gain(LAUGH_GAIN_DB).fade_in(55).fade_out(300)
    outro=outro.apply_gain(OUTRO_GAIN_DB).fade_in(100).fade_out(650)
    master=AudioSegment.silent(duration=320,frame_rate=48_000).set_channels(2)
    cues=[];word_timings=[];segment_timings=[];laugh_marks=[]
    for segment in SEGMENTS:
        audio,words=await synthesize(segment)
        start_ms=len(master);end_ms=start_ms+len(audio)
        cues.append({"id":segment["id"],"speaker":segment["speaker"],"text":segment["text"],"start":round(start_ms/1000,4),"end":round(end_ms/1000,4),"look":segment["look"]})
        segment_timings.append({"id":segment["id"],"speaker":segment["speaker"],"text":segment["text"],"start":round(start_ms/1000,4),"end":round(end_ms/1000,4),"voice":CAST[segment["speaker"]]["voice"]})
        word_timings.extend({"text":w["text"],"start":round(start_ms/1000+w["start"],4),"end":round(start_ms/1000+w["end"],4),"speaker":segment["speaker"],"segmentId":segment["id"]} for w in words)
        master+=audio
        if segment["laugh"]:
            laugh_start=len(master)/1000;master+=laugh
            laugh_marks.append({"segmentId":segment["id"],"start":round(laugh_start,4),"duration":round(len(laugh)/1000,4)})
            master+=AudioSegment.silent(duration=280,frame_rate=48_000).set_channels(2)
        else:
            master+=AudioSegment.silent(duration=240,frame_rate=48_000).set_channels(2)
    end_card_start=len(master)/1000
    master+=outro
    frame_count=math.ceil(len(master)/1000*FPS)
    duration=frame_count/FPS
    target_ms=round(duration*1000)
    if len(master)<target_ms: master+=AudioSegment.silent(duration=target_ms-len(master),frame_rate=48_000).set_channels(2)
    if master.rms<100: raise RuntimeError("La mezcla quedó prácticamente muda.")
    master.export(VOICE_PATH,format="mp3",bitrate="192k")
    package=json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))
    package["createdAt"]=datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00","Z")
    package["dialogue"]=cues;package["durationSeconds"]=duration;package["endCardStart"]=round(end_card_start,4)
    package["voiceoverUrl"]="studio/audio/entre-partidas/dinner-02/voice-track.mp3"
    package["wordTimingsUrl"]="studio/audio/entre-partidas/dinner-02/word-timings.json"
    package["voiceoverOffsetSeconds"]=0
    for scene in package["scenes"]: scene["durationFrames"]=frame_count
    PACKAGE_PATH.write_text(json.dumps(package,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    TIMINGS_PATH.write_text(json.dumps({"engine":"edge-tts","durationSeconds":duration,"words":word_timings,"segments":segment_timings,"laughs":laugh_marks,"endCardStart":round(end_card_start,4)},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    if not VOICE_PATH.exists() or VOICE_PATH.stat().st_size<100_000: raise RuntimeError("No se pudo guardar la pista de cinco voces.")
    print(f"DINNER_AUDIO_OK segments={len(cues)} speakers={len(CAST)} laughs={len(laugh_marks)} laugh_clip={len(laugh)/1000:.2f}s outro={len(outro)/1000:.2f}s credits_start={end_card_start:.2f}s duration={duration:.2f}s")
    for cue in cues: print(f"{cue['start']:.2f}-{cue['end']:.2f} {cue['speaker']}: {cue['text']}")

if __name__=="__main__": asyncio.run(main())
