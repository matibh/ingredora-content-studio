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
