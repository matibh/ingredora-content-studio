# Voz argentina gratuita — configuración automática

Ingredora genera la locución con **Edge TTS** desde GitHub Actions. No hace falta crear una cuenta de Azure, configurar una suscripción, cargar una tarjeta ni guardar claves.

## Voz elegida

- Voz: `es-AR-ElenaNeural` (español argentino, femenina).
- Alternativa posible: `es-AR-TomasNeural` (español argentino, masculina).
- Salida: MP3.
- Generación: workflow manual de GitHub Actions.
- La web no necesita formularios ni intervención del usuario.

## Cómo funciona

1. GitHub Actions instala el cliente abierto `edge-tts`.
2. El script envía el guion al servicio de voz en línea de Microsoft Edge y recibe el audio.
3. El workflow guarda el MP3 en `public/studio/audio/nutella-v5-voice-es-AR.mp3`.
4. Una vez disponible el archivo, se activa el paquete V5 y el renderizador mezcla voz y música dentro del WebM.

## Importante: gratuidad y disponibilidad

Esta alternativa no requiere API key ni una cuenta Azure y no genera un cargo de Azure. Utiliza el servicio de voz en línea para consumidores de Microsoft Edge mediante un cliente comunitario no oficial; no es una API empresarial con SLA, cuota garantizada ni soporte contractual. Microsoft puede cambiar el servicio o limitar el acceso, por lo que el workflow valida la respuesta y fallará de forma visible si el servicio deja de estar disponible.

No se instala ningún secreto y no se publica ninguna credencial.

## Referencias

- [Cliente Edge TTS para Python](https://github.com/rany2/edge-tts)
- [Voces disponibles: Elena y Tomás en español argentino](https://github.com/bytectlgo/edge-tts/blob/main/voice-list.md)
- [Información del cliente Node/TypeScript alternativo](https://github.com/andresayac/edge-tts)
