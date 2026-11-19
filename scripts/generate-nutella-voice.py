import asyncio
from pathlib import Path
import edge_tts

VOICE = "es-AR-ElenaNeural"
# Locución breve: acompaña los textos que aparecen en pantalla y cierra con una invitación.
# No enumera ni lee la lista de ingredientes.
TEXT = (
    "¡Lo reconocés enseguida! Pero… ¿sabés qué tiene realmente? "
    "¡Vamos a mirar el dorso del frasco! "
    "La etiqueta real tiene toda la información. "
    "¡Siete ingredientes! ¡Leelos y memorizalos! "
    "¡Ahora te toca a vos! ¿Cuántos recordabas? "
    "Comentá y jugá con Ingredora."
)
OUTPUT = Path("public/studio/audio/nutella-v6-voice-es-AR.mp3")

async def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(
        TEXT,
        VOICE,
        rate="+14%",
        pitch="+4Hz",
        volume="+12%",
    )
    await communicate.save(str(OUTPUT))
    data = OUTPUT.read_bytes()
    valid_mp3 = data[:3] == b"ID3" or (
        len(data) > 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0
    )
    if len(data) < 2048 or not valid_mp3:
        raise RuntimeError("La síntesis no produjo un MP3 válido.")
    print(f"Voz generada con {VOICE}: {len(data)} bytes -> {OUTPUT}")

if __name__ == "__main__":
    asyncio.run(main())
