# 05 — Prototipo visual y prepiloto v0

**Fecha:** 21/11/2026  
**Estado:** prueba visual exploratoria; no aprobado como diseño canónico ni como episodio publicable.

## Objetivo

Ver por primera vez al elenco junto en un escenario recurrente y comprobar si el lenguaje 2D vectorial funciona en formato vertical. Esta prueba no cambia por sí sola la biblia, las personalidades ni las relaciones de los protagonistas.

## Render entregado

- **Archivo de revisión:** `entre-partidas-prepiloto-v0.mp4` (entregado en la conversación).
- **Duración:** 9 segundos.
- **Formato:** 720 × 1280, vertical 9:16.
- **Cadencia:** 24 FPS.
- **Codec de video:** H.264 / MP4.
- **Audio:** sin audio; los diálogos aparecen como texto para probar únicamente el ritmo visual.
- **Escenario:** primera versión del living del departamento.
- **Elenco visible:** Martina, Bruno, Tomás, Valentina y Ernesto.

## Secuencia de la prueba

1. Bruno presume: «Yo nunca pierdo».
2. Martina lo contradice: «Eso es discutible».
3. Tomás anuncia una teoría.
4. Valentina lo provoca.
5. Ernesto empieza una anécdota.
6. Bruno advierte que la cámara está grabando y el grupo reacciona.

Los diálogos son material de prueba, no frases canónicas nuevas. Las frases habituales siguen siendo las registradas en `02-personajes.md`.

## Qué se probó y qué no

**Probado en este artefacto:** composición 9:16, estilo vectorial con contorno medio, primera distribución del living, identificación preliminar por vestuario/silueta, pequeños movimientos, cambios de boca y paneles de diálogo.

**Todavía no probado:** motor PixiJS dentro de Ingredora Studio, rigs reutilizables finales, timeline de actuación, sincronización labial con voz real, casting de voces, mezcla de audio, exportación desde el nuevo motor 2D, ni render desde un Production Package del Studio.

El MP4 fue generado como animatic mediante composición SVG fotograma a fotograma y codificación H.264. Por eso **no debe describirse como un render PixiJS ni como una producción final del Content Studio**. PixiJS sigue siendo la tecnología propuesta para la integración del motor 2D.

## Fuente visual

- `../../public/studio/series/entre-partidas/prototypes/prepiloto-frame.svg`: fotograma vectorial editable de referencia.
- `../../public/studio/series/entre-partidas/prototypes/render-info.json`: parámetros y estado de este render.

El fotograma es una referencia compuesta de la escena, no sustituye los archivos individuales `model.svg`, `expressions.svg`, `poses.svg` y `character.json` que deberán crearse para cada personaje.

## Motor 2D y prepiloto v1 — integrado en rama de prototipo

La siguiente iteración técnica está desarrollada en la rama `prototype/entre-partidas-visual-v0` y no está publicada en el Studio de producción todavía.

### Cambios implementados en código

- PixiJS 8.23.0 como renderer 2D independiente.
- Three.js permanece como renderer de publicidad.
- El Studio separa las colecciones **Publicidad** y **Series originales**.
- Los paquetes indican `renderEngine: "pixi2d"` para utilizar el motor nuevo.
- El motor 2D compone el living, cinco rigs, diálogos, miradas, parpadeos, gestos y subtítulos.
- La animación se evalúa con tiempo absoluto por fotograma. Los pies permanecen apoyados y el root no rebota verticalmente.
- Mediabunny se reutiliza para crear el WebM con audio. La conversión MP4 sigue utilizando el módulo existente.
- El renderer valida que la pista de voces exista y no esté en silencio antes de empezar el render.

### Estado verificado de la generación de voces — 21/11/2026

La generación de Edge TTS terminó correctamente en GitHub Actions y los siguientes archivos quedaron confirmados en la rama de prototipo:

- Pista maestra de voces: `public/studio/audio/entre-partidas/prepilot-v1/voice-track.mp3`.
- Cinco pistas separadas: `martina.mp3`, `bruno.mp3`, `tomas.mp3`, `valentina.mp3` y `ernesto.mp3`.
- Cinco audiciones: `audition-martina.mp3`, `audition-bruno.mp3`, `audition-tomas.mp3`, `audition-valentina.mp3` y `audition-ernesto.mp3`.
- `voice-cast.json` y `word-timings.json`.

El paquete se actualizó con la duración de 35 segundos y las marcas de tiempo medidas. Los ocho diálogos quedan programados así:

| Personaje | Entrada | Salida |
|---|---:|---:|
| Bruno | 0,45 s | 5,274 s |
| Martina | 5,554 s | 9,850 s |
| Tomás | 10,200 s | 14,616 s |
| Valentina | 14,916 s | 18,324 s |
| Ernesto | 18,744 s | 23,616 s |
| Bruno | 23,936 s | 26,816 s |
| Martina | 27,166 s | 30,862 s |
| Ernesto | 31,612 s | 33,556 s |

El manifiesto quedó en estado `rendering`, con `renderEngine: "pixi2d"` y `collection: "series"`. Eso significa que las dependencias de audio están generadas y listas para el render; no significa todavía que el MP4 del Studio haya sido renderizado ni aprobado.

### Casting provisional de cinco voces

El paquete está preparado para cinco identidades de voz en español:
- Martina: Elena, es-AR.
- Bruno: Tomás, es-AR.
- Tomás: Mateo, es-UY.
- Valentina: Valentina, es-UY.
- Ernesto: Lorenzo, es-CL.

Se generan una mezcla de diálogo, cinco pistas individuales, cinco muestras cortas de audición y marcas de tiempo por palabra. El reparto es distinto, pero mezcla variedades del Cono Sur; no debe presentarse como cinco acentos argentinos. Las voces se consideran provisionales hasta escuchar y aprobar las muestras.

### Estado de la generación y publicación

El paquete del episodio está registrado inicialmente como `planned` para impedir un render silencioso. Un workflow de GitHub Actions genera las voces, valida los archivos y cambia el estado a `rendering`. Después, la publicación de Pages se vuelve a ejecutar para incluir los MP3 y el manifiesto actualizado.

**Pendiente de verificación:** la rama debe superar `npm run build`, el workflow de voces debe terminar correctamente, las cinco muestras deben escucharse y el renderer debe completar un WebM de prueba antes de integrar los cambios a `main`. Hasta entonces, la nueva versión no se considera publicada ni aprobada.

## Evaluación pendiente

Antes de bloquear los diseños, revisar:
- Diferenciación real de siluetas, rostros y edades.
- Vestuario y proporciones de cada protagonista.
- Legibilidad de manos y gestos en móvil.
- Consistencia del living desde distintos encuadres.
- Personalidad en la actuación; evitar que todos compartan la misma gestualidad.

Cualquier cambio aprobado en edades, personalidad, relaciones o frases recurrentes debe actualizarse primero en `01-biblia-de-la-serie.md` y/o `02-personajes.md`, y luego en este registro.

## Próxima etapa técnica

Implementar PixiJS como renderer independiente de la ruta Three.js, cargar assets vectoriales por capas, crear pivotes/articulaciones y animaciones deterministas por tiempo absoluto. Reutilizar Mediabunny para muxing/exportación una vez que el canvas 2D entregue cada fotograma. No modificar el render publicitario existente.
