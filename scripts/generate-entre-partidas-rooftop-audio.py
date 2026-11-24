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
LAUGH = AUDIO / "risa.mp3"
INTRO = AUDIO / "chapter-2-intro-music.wav"
VOICE_TRACK = AUDIO / "voice-track.mp3"
TIMINGS = AUDIO / "word-timings.json"
FPS = 24

CAST = {
    "bruno": {"voice": "es-AR-TomasNeural", "rate": "+4%", "pitch": "+2Hz", "volume": "+5%"},
    "martina": {"voice": "es-AR-ElenaNeural", "rate": "-3%", "pitch": "-1Hz", "volume": "+5%"},
    "ernesto": {"voice": "es-CL-LorenzoNeural", "rate": "-12%", "pitch": "-6Hz", "volume": "+6%"},
}

SEGMENTS = [
    {"id":"01-bruno-invita","speaker":"bruno","text":"¿Por qué no jugás Ingredora? Está buenísimo.","shot":"pair","look":"martina","pause":0.24},
    {"id":"02-martina-no","speaker":"martina","text":"Nunca me descargué la aplicación.","shot":"pair","look":"bruno","pause":0.25},
    {"id":"03-bruno-explica","speaker":"bruno","text":"Dale, descargala, que te enseño. Te aparece un producto y tenés que reconocer los ingredientes.","shot":"pair","look":"martina","pause":0.32},
    {"id":"04-martina-responde","speaker":"martina","text":"Ah, este tiene jarabe de maíz, maltodextrina y tres conservantes.","shot":"martina","look":"bruno","pause":0.30},
    {"id":"05-bruno-sospecha","speaker":"bruno","text":"¡Pará! ¿Cómo sabías eso? ¿Tenés algo abierto que te pasa las respuestas?","shot":"bruno","look":"martina","pause":0.30},
    {"id":"06-martina-profesion","speaker":"martina","text":"Bruno, soy nutricionista. Conozco los ingredientes.","shot":"martina","look":"bruno","pause":0.24},
    {"id":"07-bruno-insiste","speaker":"bruno","text":"Sí, bueno... pero una cosa es conocerlos y otra es saberlos todos. Algo raro hay.","shot":"bruno","look":"martina","pause":0.34,"laugh_after":true},
    {"id":"08-martina-otra","speaker":"martina","text":"¿Jugamos otra?","shot":"martina","look":"bruno","pause":0.25},
    {"id":"09-bruno-dificil","speaker":"bruno","text":"Bueno, esa era fácil. Ahora viene una difícil.","shot":"bruno","look":"martina","pause":0.25},
    {"id":"10-martina-gana","speaker":"martina","text":"Listo. Gané otra.","shot":"martina","look":"bruno","pause":0.28},
    {"id":"11-bruno-juego","speaker":"bruno","text":"Qué raro está funcionando este juego hoy...","shot":"bruno","look":"martina","pause":0.34},
    {"id":"12-bruno-ventaja","speaker":"bruno","text":"Vos tenés ventaja porque sos nutricionista.","shot":"bruno","look":"martina","pause":0.25},
    {"id":"13-martina-ventaja","speaker":"martina","text":"¿Y vos qué ventaja tenés?","shot":"martina","look":"bruno","pause":0.22},
    {"id":"14-bruno-experiencia","speaker":"bruno","text":"Experiencia.","shot":"bruno","look":"martina","pause":0.20},
    {"id":"15-martina-anos","speaker":"martina","text":"¿Cuántos años?","shot":"martina","look":"bruno","pause":0.18},
    {"id":"16-bruno-muchos","speaker":"bruno","text":"Muchos.","shot":"bruno","look":"martina","pause":0.20},
    {"id":"17-martina-trayectoria","speaker":"martina","text":"Bueno, por lo menos tenés trayectoria.","shot":"martina","look":"bruno","pause":0.30,"laugh_after":true},
    {"id":"18-ernesto-profesor","speaker":"ernesto","text":"Bruno, ¿no eras vos el que le iba a enseñar?","shot":"ernesto","look":"bruno","pause":0.25},
    {"id":"19-bruno-dificil","speaker":"bruno","text":"Le estoy enseñando. Está aprendiendo a jugar contra alguien difícil.","shot":"bruno","look":"ernesto","pause":0.26},
    {"id":"20-martina-como-vos","speaker":"martina","text":"Ah, ¿como vos?","shot":"martina","look":"bruno","pause":0.38,"laugh_after":true},
    {"id":"21-bruno-revancha","speaker":"bruno","text":"Dale, una más. Esta la gano yo.","shot":"bruno","look":"martina","pause":0.26},
    {"id":"22-martina-ranking","speaker":"martina","text":"Listo. ¿Cómo veo el ranking?","shot":"martina","look":"bruno","pause":0.32},
    {"id":"23-bruno-mira","speaker":"bruno","text":"A ver... entrá acá... Pará...","shot":"phone","look":"martina","pause":0.32},
    {"id":"24-bruno-superada","speaker":"bruno","text":"¡No puede ser! ¡Me pasaste en el ranking!","shot":"bruno","look":"martina","pause":0.28},
    {"id":"25-martina-bueno","speaker":"martina","text":"¿Eso es bueno?","shot":"martina","look":"bruno","pause":0.25},
    {"id":"26-bruno-delicada","speaker":"bruno","text":"¡No! Bueno, para vos sí. Para mí es una situación bastante delicada.","shot":"bruno","look":"martina","pause":0.38,"laugh_after":true},
    {"id":"27-ernesto-pide","speaker":"ernesto","text":"Che, ¿me enseñás a mí también?","shot":"ernesto","look":"bruno","pause":0.24},
    {"id":"28-bruno-clase","speaker":"bruno","text":"¡No! ¡Se terminó la clase!","shot":"bruno","look":"ernesto","pause":0.25}
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
    if not LAUGH.is_file() or LAUGH.stat().st_size < 100:
        raise FileNotFoundError("Falta risa.mp3 para los remates del capítulo.")
    if not INTRO.is_file() or INTRO.stat().st_size < 100:
        raise FileNotFoundError("Falta la música original de apertura de Entre Partidas.")
    if duration(LAUGH) < 1.65:
        raise RuntimeError("risa.mp3 debe durar al menos 1.65 segundos.")
    clips = []
    laughs = []
    laugh_length = 1.65
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
        if segment.get("laugh_after"):
            laugh_start = end + .06
            laughs.append((LAUGH, laugh_start, .56, laugh_length))
            cursor = max(cursor, laugh_start + laugh_length + .12)

    final_line_end = cues[-1]["end"]
    outro_start = round(final_line_end + .04, 3)
    end_card_start = round(final_line_end + 1.00, 3)
    outro_duration = duration(OUTRO)
    total = math.ceil((outro_start + outro_duration + .45) * FPS) / FPS
    bed_duration = end_card_start + .9
    bed = AUDIO / "party-bed.mp3"
    # Base instrumental electrónica discreta construida con tonos y pulsos simples.
    # Se generan capas separadas para evitar expresiones complejas incompatibles entre builds de FFmpeg.
    tone_filter = (
        "[0:a]tremolo=f=1.82:d=0.88,volume=0.22[a0];"
        "[1:a]tremolo=f=1.82:d=0.34,volume=0.07[a1];"
        "[2:a]tremolo=f=0.91:d=0.42,volume=0.05[a2];"
        "[3:a]tremolo=f=3.64:d=0.72,volume=0.025[a3];"
        "[a0][a1][a2][a3]amix=inputs=4:duration=longest,lowpass=f=9000,"
        "afade=t=out:st=" + str(end_card_start) + ":d=0.75,volume=0.72[out]"
    )
    run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "sine=frequency=55:sample_rate=48000:duration=" + str(bed_duration),
        "-f", "lavfi", "-i", "sine=frequency=110:sample_rate=48000:duration=" + str(bed_duration),
        "-f", "lavfi", "-i", "sine=frequency=164.81:sample_rate=48000:duration=" + str(bed_duration),
        "-f", "lavfi", "-i", "sine=frequency=220:sample_rate=48000:duration=" + str(bed_duration),
        "-filter_complex", tone_filter, "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "160k", str(bed)
    ])
    mix_inputs = [(bed, 0.0, .20, None), (INTRO, 0.0, 1.0, 3.15)]
    mix_inputs += [(path, start, gain, None) for path, start, gain in clips]
    mix_inputs += laughs
    mix_inputs.append((OUTRO, outro_start, .78, None))
    cmd = ["ffmpeg", "-y"]
    for path, _, _, _ in mix_inputs:
        cmd += ["-i", str(path)]
    filters = []
    for index, (path, start, gain, trim) in enumerate(mix_inputs):
        delay = round(start * 1000)
        chain = f"[{index}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo"
        if trim is not None:
            chain += f",atrim=duration={trim:.3f}"
            if path == INTRO:
                chain += ",afade=t=in:st=0:d=0.12,afade=t=out:st=2.80:d=0.35"
            elif path == LAUGH:
                chain += ",afade=t=in:st=0:d=0.04,afade=t=out:st=1.35:d=0.30"
        chain += f",volume={gain},adelay={delay}|{delay}[a{index}]"
        filters.append(chain)
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
    print("ROOFTOP_AUDIO_OK lines=" + str(len(cues)) + " laughs=" + str(len(laughs)) + " outro=" + str(round(outro_duration, 2)) + "s")
    print("PACKAGE_DURATION=" + str(total) + " ENDCARD=" + str(end_card_start) + " CUES=" + str(len(cues)))

if __name__ == "__main__":
    asyncio.run(main())
