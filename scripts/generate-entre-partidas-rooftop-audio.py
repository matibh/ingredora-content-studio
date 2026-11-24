#!/usr/bin/env python3
"""Genera voces, música de ambiente, tiempos y paquete audiovisual de EP-S08."""
from __future__ import annotations
import asyncio
import json
import math
import subprocess
from pathlib import Path
import edge_tts

AUDIO = Path("public/studio/audio/entre-partidas/rooftop-08")
PACKAGE = Path("public/studio/packages/entre-partidas-rooftop.v1.json")
OUTRO = AUDIO / "risa-y-outro.mp3"
VOICE_TRACK = AUDIO / "voice-track.mp3"
TIMINGS = AUDIO / "word-timings.json"
FPS = 24

CAST = {
    "bruno": {"voice": "es-AR-TomasNeural", "rate": "+4%", "pitch": "+2Hz", "volume": "+5%"},
    "nutritionist": {"voice": "es-AR-ElenaNeural", "rate": "-3%", "pitch": "-1Hz", "volume": "+5%"},
    "ernesto": {"voice": "es-CL-LorenzoNeural", "rate": "-12%", "pitch": "-6Hz", "volume": "+6%"},
}

SEGMENTS = [
    {"id":"01-bruno-pregunta","speaker":"bruno","text":"Che, ¿vos nunca jugaste a Ingredora?","shot":"wide","look":"nutritionist","pause":0.28},
    {"id":"02-nutri-no","speaker":"nutritionist","text":"No. ¿Por?","shot":"nutritionist","look":"bruno","pause":0.25},
    {"id":"03-bruno-invita","speaker":"bruno","text":"Porque está buenísimo. Vení, te enseño. Es fácil cuando le agarrás la mano.","shot":"bruno","look":"nutritionist","pause":0.32},
    {"id":"04-bruno-explica","speaker":"bruno","text":"Mirá, te aparece un producto y tenés que reconocer los ingredientes. Yo te voy guiando.","shot":"group","look":"nutritionist","pause":0.30},
    {"id":"05-nutri-responde","speaker":"nutritionist","text":"Ah, este tiene jarabe de maíz, maltodextrina y tres conservantes.","shot":"nutritionist","look":"bruno","pause":0.28},
    {"id":"06-bruno-trampa","speaker":"bruno","text":"¡Pará! ¿Cómo sabías eso? ¿Tenés algo abierto que te pasa las respuestas?","shot":"bruno","look":"nutritionist","pause":0.30},
    {"id":"07-nutri-profesion","speaker":"nutritionist","text":"Bruno, soy nutricionista. Conozco los ingredientes.","shot":"nutritionist","look":"bruno","pause":0.24},
    {"id":"08-bruno-sospecha","speaker":"bruno","text":"Sí, bueno... pero una cosa es conocerlos y otra es saberlos todos. Algo raro hay.","shot":"bruno","look":"nutritionist","pause":0.38},
    {"id":"09-nutri-otra","speaker":"nutritionist","text":"¿Jugamos otra?","shot":"nutritionist","look":"bruno","pause":0.25},
    {"id":"10-bruno-dificil","speaker":"bruno","text":"Bueno, esa era fácil. Ahora viene una difícil.","shot":"bruno","look":"nutritionist","pause":0.25},
    {"id":"11-nutri-gana","speaker":"nutritionist","text":"Listo. Gané otra.","shot":"nutritionist","look":"bruno","pause":0.28},
    {"id":"12-bruno-juego","speaker":"bruno","text":"Qué raro está funcionando este juego hoy...","shot":"bruno","look":"nutritionist","pause":0.34},
    {"id":"13-bruno-ventaja","speaker":"bruno","text":"Vos tenés ventaja porque sos nutricionista.","shot":"bruno","look":"nutritionist","pause":0.25},
    {"id":"14-nutri-ventaja","speaker":"nutritionist","text":"¿Y vos qué ventaja tenés?","shot":"nutritionist","look":"bruno","pause":0.22},
    {"id":"15-bruno-experiencia","speaker":"bruno","text":"Experiencia.","shot":"bruno","look":"nutritionist","pause":0.20},
    {"id":"16-nutri-anos","speaker":"nutritionist","text":"¿Cuántos años?","shot":"nutritionist","look":"bruno","pause":0.18},
    {"id":"17-bruno-muchos","speaker":"bruno","text":"Muchos.","shot":"bruno","look":"nutritionist","pause":0.20},
    {"id":"18-nutri-trayectoria","speaker":"nutritionist","text":"Bueno, por lo menos tenés trayectoria.","shot":"nutritionist","look":"bruno","pause":0.46},
    {"id":"19-ernesto-profesor","speaker":"ernesto","text":"Bruno, ¿no eras vos el que le iba a enseñar?","shot":"ernesto","look":"bruno","pause":0.25},
    {"id":"20-bruno-dificil","speaker":"bruno","text":"Le estoy enseñando. Está aprendiendo a jugar contra alguien difícil.","shot":"bruno","look":"ernesto","pause":0.26},
    {"id":"21-nutri-como-vos","speaker":"nutritionist","text":"Ah, ¿como vos?","shot":"nutritionist","look":"bruno","pause":0.42},
    {"id":"22-bruno-revancha","speaker":"bruno","text":"Dale, una más. Esta la gano yo.","shot":"bruno","look":"nutritionist","pause":0.26},
    {"id":"23-nutri-ranking","speaker":"nutritionist","text":"Listo. ¿Cómo veo el ranking?","shot":"nutritionist","look":"bruno","pause":0.32},
    {"id":"24-bruno-mira","speaker":"bruno","text":"A ver... entrá acá... Pará...","shot":"phone","look":"nutritionist","pause":0.32},
    {"id":"25-bruno-superada","speaker":"bruno","text":"¡No puede ser! ¡Me pasaste en el ranking!","shot":"bruno","look":"nutritionist","pause":0.28},
    {"id":"26-nutri-bueno","speaker":"nutritionist","text":"¿Eso es bueno?","shot":"nutritionist","look":"bruno","pause":0.25},
    {"id":"27-bruno-delicada","speaker":"bruno","text":"¡No! Bueno, para vos sí. Para mí es una situación bastante delicada.","shot":"bruno","look":"nutritionist","pause":0.54},
    {"id":"28-ernesto-pide","speaker":"ernesto","text":"Che, ¿me enseñás a mí también?","shot":"ernesto","look":"bruno","pause":0.24},
    {"id":"29-bruno-clase","speaker":"bruno","text":"¡No! ¡Se terminó la clase!","shot":"bruno","look":"ernesto","pause":0.80}
]

def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, check=True, text=True, capture_output=True)
    return result.stdout.strip()

def duration(path: Path) -> float:
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]))

async def make_voice(segment: dict, dest: Path) -> None:
    voice = CAST[segment["speaker"]]
    communicate = edge_tts.Communicate(
        segment["text"], voice["voice"], rate=voice["rate"],
        pitch=voice["pitch"], volume=voice["volume"]
    )
    await communicate.save(str(dest))

async def main():
    AUDIO.mkdir(parents=True, exist_ok=True)
    if not OUTRO.is_file() or OUTRO.stat().st_size < 100:
        raise FileNotFoundError("Falta el audio original combinado risa y outro.")
    clips = []
    cues = []
    cursor = 3.25
    for index, segment in enumerate(SEGMENTS, start=1):
        path = AUDIO / ("line-" + str(index).zfill(2) + ".mp3")
        await make_voice(segment, path)
        clip_duration = duration(path)
        start = cursor
        end = start + clip_duration
        cue = {key: segment[key] for key in ("id", "speaker", "text", "shot", "look")}
        cue.update({"start": round(start, 3), "end": round(end, 3)})
        cues.append(cue)
        clips.append((path, start, 1.0))
        cursor = end + float(segment.get("pause", .28))

    end_card_start = round(cues[-1]["end"] + .90, 3)
    outro_duration = duration(OUTRO)
    total = math.ceil((end_card_start + outro_duration + .45) * FPS) / FPS
    bed_duration = end_card_start + .9
    bed = AUDIO / "party-bed.mp3"
    expression = (
        "0.055*sin(2*PI*55*t)*(0.55+0.45*cos(2*PI*1.82*t))"
        "+0.018*sin(2*PI*110*t)"
        "+0.012*sin(2*PI*220*t)*pow(max(0,sin(2*PI*0.455*t)),8)"
        "+0.004*sin(2*PI*880*t)*pow(max(0,sin(2*PI*1.82*t+1.1)),20)"
    )
    run([
        "ffmpeg", "-y", "-f", "lavfi", "-i",
        "aevalsrc=" + expression + ":s=48000:d=" + str(bed_duration),
        "-af", "lowpass=f=9000,afade=t=out:st=" + str(end_card_start) + ":d=0.75,volume=0.72",
        "-c:a", "libmp3lame", "-b:a", "160k", str(bed)
    ])
    mix_inputs = [(bed, 0.0, .20)] + clips + [(OUTRO, end_card_start, .76)]
    cmd = ["ffmpeg", "-y"]
    for path, _, _ in mix_inputs:
        cmd += ["-i", str(path)]
    filters = []
    for index, (_, start, gain) in enumerate(mix_inputs):
        delay = round(start * 1000)
        filters.append(f"[{index}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume={gain},adelay={delay}|{delay}[a{index}]")
    labels = "".join(f"[a{index}]" for index in range(len(mix_inputs)))
    filters.append(labels + f"amix=inputs={len(mix_inputs)}:duration=longest:dropout_transition=0:normalize=0,atrim=duration={total:.3f},alimiter=limit=0.94[aout]")
    cmd += ["-filter_complex", ";".join(filters), "-map", "[aout]", "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000", "-ac", "2", str(VOICE_TRACK)]
    run(cmd)
    if not VOICE_TRACK.is_file() or VOICE_TRACK.stat().st_size < 100000:
        raise RuntimeError("La mezcla final de audio quedó vacía o incompleta.")
    package = {
        "schemaVersion": 1,
        "engineVersion": "entre-partidas-rooftop-1.0.0",
        "id": "ingredora-entre-partidas-rooftop-008",
        "title": "Entre Partidas — La alumna",
        "createdAt": "2026-11-24T00:00:00-03:00",
        "fps": FPS, "width": 720, "height": 1280,
        "durationSeconds": total,
        "endCardStart": end_card_start,
        "chapterNumber": 8,
        "dialogue": cues,
        "voiceoverUrl": "studio/audio/entre-partidas/rooftop-08/voice-track.mp3",
        "wordTimingsUrl": "studio/audio/entre-partidas/rooftop-08/word-timings.json"
    }
    PACKAGE.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    TIMINGS.write_text(json.dumps({
        "schemaVersion": 1, "fps": FPS, "durationSeconds": total,
        "cues": [{"id": c["id"], "speaker": c["speaker"], "start": c["start"], "end": c["end"], "text": c["text"]} for c in cues]
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("ROOFTOP_AUDIO_OK lines=" + str(len(cues)) + " outro=" + str(round(outro_duration, 2)) + "s")
    print("PACKAGE_DURATION=" + str(total) + " ENDCARD=" + str(end_card_start) + " CUES=" + str(len(cues)))

if __name__ == "__main__":
    asyncio.run(main())
