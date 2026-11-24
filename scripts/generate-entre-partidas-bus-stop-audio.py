#!/usr/bin/env python3
"""Genera voces, risas y tiempos exactos para Entre Partidas EP-S09: La parada."""
from __future__ import annotations
import asyncio, json, math, subprocess, tempfile
from pathlib import Path
import edge_tts

AUDIO = Path("public/studio/audio/entre-partidas/bus-stop-09")
PACKAGE = Path("public/studio/packages/entre-partidas-bus-stop.v1.json")
INTRO = AUDIO / "chapter-2-intro-music.wav"
LAUGH = AUDIO / "risa.mp3"
OUTRO = AUDIO / "risa-y-outro.mp3"
VOICE = AUDIO / "voice-track.mp3"
TIMINGS = AUDIO / "word-timings.json"
FPS = 24
INTRO_SECONDS = 3.15
CAST = {
    "bruno": {"voice": "es-AR-TomasNeural", "rate": "+5%", "pitch": "+3Hz", "volume": "+6%"},
    "tomas": {"voice": "es-UY-MateoNeural", "rate": "+8%", "pitch": "+7Hz", "volume": "+5%"},
    "valentina": {"voice": "es-UY-ValentinaNeural", "rate": "-4%", "pitch": "-1Hz", "volume": "+5%"},
}
# The camera coverage alternates between selected close-ups and shared frames.
# Wide/master lines are intentional spoken coverage, not cutaways between lines.
SEGMENTS = [
    {"id":"01-bruno-espera","speaker":"bruno","text":"Hace media hora que estamos esperando.","look":"tomas","shot":"master","pause":.24},
    {"id":"02-tomas-ocho-minutos","speaker":"tomas","text":"Ocho minutos, Bruno. Miré el reloj.","look":"bruno","shot":"master","pause":.22},
    {"id":"03-bruno-se-sintio","speaker":"bruno","text":"Bueno, pero se sintieron como media hora.","look":"tomas","shot":"bruno","pause":.23},
    {"id":"04-valentina-horario","speaker":"valentina","text":"¿No miraste el horario?","look":"bruno","shot":"master","pause":.20},
    {"id":"05-bruno-diez-minutos","speaker":"bruno","text":"Sí. Dice que pasa cada diez minutos.","look":"valentina","shot":"bruno","pause":.22},
    {"id":"06-tomas-ya-llega","speaker":"tomas","text":"Entonces ya tendría que estar llegando.","look":"bruno","shot":"master","pause":.23},
    {"id":"07-bruno-hace-un-rato","speaker":"bruno","text":"Eso mismo dijiste hace un rato.","look":"tomas","shot":"bruno","laugh":True,"pause":.34},
    {"id":"08-valentina-mientras","speaker":"valentina","text":"¿Y si hacemos algo mientras esperamos?","look":"bruno","shot":"master","pause":.20},
    {"id":"09-bruno-desafio","speaker":"bruno","text":"Estoy con el desafío diario de Ingredora.","look":"tomas","shot":"master","pause":.24},
    {"id":"10-tomas-sin-jugar","speaker":"tomas","text":"¿No podés esperar el colectivo sin jugar?","look":"bruno","shot":"tomas","pause":.20},
    {"id":"11-bruno-prefiero","speaker":"bruno","text":"Puedo. Pero prefiero no hacerlo.","look":"tomas","shot":"bruno","laugh":True,"pause":.38},
    {"id":"12-valentina-ahiviene","speaker":"valentina","text":"Mirá, ahí viene.","look":"bruno","shot":"master","pause":.20},
    {"id":"13-tomas-celular","speaker":"tomas","text":"Bruno, guardá el celular. Es el nuestro.","look":"bruno","shot":"master","pause":.20},
    {"id":"14-bruno-un-segundo","speaker":"bruno","text":"Un segundo, estoy por terminar.","look":"tomas","shot":"bruno","pause":.22},
    {"id":"15-valentina-puertas","speaker":"valentina","text":"¡Dale, que ya abrió las puertas!","look":"bruno","shot":"master","pause":.18},
    {"id":"16-tomas-vamos","speaker":"tomas","text":"¡Vamos, Bruno, subí!","look":"bruno","shot":"master","pause":.18},
    {"id":"17-bruno-yavoy","speaker":"bruno","text":"¡Ya voy, ya voy!","look":"tomas","shot":"bruno","pause":.26},
    {"id":"18-bruno-ya-se-fue","speaker":"bruno","text":"¿Eh? ¿Ya se fue?","look":"valentina","shot":"master","pause":.25},
    {"id":"19-bruno-por-lo-menos","speaker":"bruno","text":"Bueno... por lo menos gané.","look":"tomas","shot":"master","laugh":True,"pause":.40},
]

def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return result.stdout.strip()

def duration(path: Path) -> float:
    return float(run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)]))

def silence(path: Path, seconds: float):
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","lavfi","-i","anullsrc=r=48000:cl=stereo","-t",f"{max(seconds,.001):.6f}","-c:a","pcm_s16le",str(path)])

def normalize(src: Path, dst: Path, filters: str = ""):
    cmd = ["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(src)]
    if filters:
        cmd += ["-af",filters]
    cmd += ["-vn","-ac","2","-ar","48000","-c:a","pcm_s16le",str(dst)]
    run(cmd)

async def synthesize(seg: dict, work: Path, index: int):
    voice = CAST[seg["speaker"]]
    talker = edge_tts.Communicate(seg["text"],voice["voice"],rate=voice["rate"],pitch=voice["pitch"],volume=voice["volume"],boundary="WordBoundary")
    chunks, words = [], []
    async for event in talker.stream():
        if event["type"] == "audio":
            chunks.append(event["data"])
        elif event["type"] == "WordBoundary":
            words.append({"text":event["text"],"start":event["offset"]/10_000_000,"end":(event["offset"]+event["duration"])/10_000_000})
    if not chunks:
        raise RuntimeError("Edge TTS no generó audio para " + seg["id"])
    raw = work / f"clip-{index:02d}.mp3"
    raw.write_bytes(b"".join(chunks))
    wav = work / f"clip-{index:02d}.wav"
    normalize(raw,wav)
    return wav, words, duration(wav)

def concat(items: list[Path], dst: Path, work: Path):
    listing = work / "concat.txt"
    listing.write_text("\n".join("file '"+str(p.resolve()).replace("'","'\\''")+"'" for p in items)+"\n",encoding="utf-8")
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(listing),"-c:a","pcm_s16le","-ar","48000","-ac","2",str(dst)])

async def main():
    AUDIO.mkdir(parents=True,exist_ok=True)
    for path in (INTRO,LAUGH,OUTRO):
        if not path.is_file() or path.stat().st_size < 100:
            raise SystemExit("Falta el recurso de audio original: " + str(path))
    if duration(OUTRO) < 1.0:
        raise SystemExit("El archivo risa y outro.mp3 no contiene un cierre suficiente.")
    if duration(LAUGH) < 1.65:
        raise SystemExit("risa.mp3 debe durar al menos 1.65 segundos.")
    with tempfile.TemporaryDirectory(prefix="bus-stop-09-",dir=AUDIO) as temp_dir:
        work = Path(temp_dir)
        parts, cues, words = [], [], []
        cursor = INTRO_SECONDS
        intro = work / "intro.wav"
        normalize(INTRO,intro,f"atrim=start=0:end={INTRO_SECONDS:.3f},volume=0dB,afade=t=in:st=0:d=0.12,afade=t=out:st={INTRO_SECONDS-.35:.3f}:d=0.35")
        parts.append(intro)
        laugh = work / "laugh.wav"
        normalize(LAUGH,laugh,"atrim=start=0:end=1.65,volume=-5dB,afade=t=in:st=0:d=0.04,afade=t=out:st=1.35:d=0.30")
        outro_track = work / "complete-outro.wav"
        normalize(OUTRO,outro_track)
        for index, seg in enumerate(SEGMENTS):
            clip, clip_words, seconds = await synthesize(seg,work,index)
            start, end = cursor, cursor + seconds
            cues.append({**{key:seg[key] for key in ("id","speaker","text","look","shot")}, "start":round(start,3),"end":round(end,3),"laugh":bool(seg.get("laugh"))})
            for word in clip_words:
                words.append({"segment":seg["id"],"speaker":seg["speaker"],"text":word["text"],"start":round(start+word["start"],3),"end":round(start+word["end"],3)})
            parts.append(clip)
            cursor = end
            if seg.get("laugh"):
                parts.append(laugh)
                cursor += 1.65
            pause_seconds = seg.get("pause",.22)
            pause = work / f"pause-{index:02d}.wav"
            silence(pause,pause_seconds)
            parts.append(pause)
            cursor += pause_seconds
        end_card = cursor
        parts.append(outro_track)
        total = cursor + duration(outro_track)
        combined = work / "combined.wav"
        concat(parts,combined,work)
        run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(combined),"-c:a","libmp3lame","-b:a","192k",str(VOICE)])
        pkg = json.loads(PACKAGE.read_text(encoding="utf-8"))
        pkg["dialogue"] = cues
        pkg["endCardStart"] = round(end_card,3)
        pkg["durationSeconds"] = math.ceil(total)
        PACKAGE.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        TIMINGS.write_text(json.dumps({"fps":FPS,"durationSeconds":pkg["durationSeconds"],"endCardStart":round(end_card,3),"dialogue":cues,"words":words},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print(f"VOICE={VOICE} duration={duration(VOICE):.2f}s; dialogue={len(cues)}; laugh_cues={sum(bool(s.get('laugh')) for s in SEGMENTS)}; total={pkg['durationSeconds']}s; endcard={end_card:.2f}s")

if __name__ == "__main__":
    asyncio.run(main())
