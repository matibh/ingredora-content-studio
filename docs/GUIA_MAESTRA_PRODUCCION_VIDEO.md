# Guía maestra de producción de video — Ingredora Content Studio

> Documento operativo principal. Usar esta guía cada vez que se planifique, genere, renderice, convierta y apruebe una producción.
>
> **Regla central:** ChatGPT prepara y dirige la producción; Ingredora Content Studio valida, ejecuta y renderiza; la persona revisa y aprueba; recién entonces se prepara el paquete para subir. Renderizar no significa aprobar ni publicar.

- **Proyecto:** Ingredora Content Studio
- **Repositorio:** `matibh/ingredora-content-studio`
- **Aplicación:** https://matibh.github.io/ingredora-content-studio/
- **Última actualización:** 19/11/2026

---

## 1. Principios que no se negocian

1. **Presupuesto objetivo: USD 0.** Priorizar herramientas gratuitas y ejecución en el navegador. No incorporar servicios pagos ni infraestructura que genere costos sin autorización expresa.
2. **Sin instalaciones locales obligatorias.** La producción debe poder prepararse y ejecutarse desde el navegador.
3. **El navegador renderiza.** Three.js se usa para las escenas visuales. Supabase persiste paquetes y recursos; no es el motor de render.
4. **ChatGPT es la dirección creativa y técnica.** No trasladar al usuario la tarea de completar briefs, prompts, storyboards o parámetros en la web.
5. **Paquetes versionados y reproducibles.** Cada producción debe tener identidad, versión, manifiesto, guion, storyboard, escenas, recursos y metadatos.
6. **No ejecutar código arbitrario descargado de Supabase.** Los datos persistidos deben ajustarse a un esquema validado. El motor de la aplicación interpreta estructuras conocidas; no debe evaluar JavaScript libre recibido desde la base.
7. **Render, aprobación y distribución son etapas distintas.** Nunca publicar automáticamente en redes.
8. **No destruir el original.** La conversión a MP4 es un paso adicional: el WebM original se conserva.

## 2. Flujo completo, de idea a archivo aprobado

```text
IDEA
  ↓
Brief creativo + objetivo + audiencia
  ↓
Guion final + locución + textos en pantalla
  ↓
Storyboard segundo a segundo
  ↓
Production Package (manifest + escenas + assets + audio + subtítulos)
  ↓
Validación del paquete
  ↓
Render en navegador (Three.js / frames / captura)
  ↓
WebM original
  ↓
Conversión adicional WebM → MP4 en el navegador
  ↓
Revisión humana de video, audio, textos y duración
  ↓
Generación/verificación del TXT de metadatos
  ↓
APROBACIÓN MANUAL con contraseña
  ↓
Subida del MP4 a GitHub y verificación del TXT
  ↓
Carpeta: `Contenido a subir`
  ↓
La publicación en redes queda a cargo de una acción humana posterior
```

### Responsabilidad de cada parte

| Parte | Responsabilidad |
|---|---|
| ChatGPT | Idea, enfoque, brief, guion, storyboard, dirección visual, escenas, assets necesarios, audio/locución, subtítulos, metadatos y paquete completo. |
| Studio | Leer el paquete, validar estructura y recursos, mostrar etapas, ejecutar escenas, renderizar y ofrecer la conversión. |
| Supabase | Persistir los datos y recursos de producción que correspondan. No renderiza el video. |
| GitHub | Código, documentación, versiones y destino de los archivos aprobados. |
| Usuario | Revisar el resultado y dar la aprobación explícita. |

## 3. Brief creativo: qué definir antes de producir

Cada producción debe comenzar con un brief breve pero completo:

- **ID / número:** identificador único y correlativo.
- **Nombre interno:** nombre corto, sin caracteres problemáticos para archivos.
- **Marca / serie:** por ejemplo, Ingredora Originals.
- **Objetivo:** qué debe lograr el video.
- **Audiencia:** a quién le habla.
- **Plataforma y formato:** Reels, Shorts, TikTok u otro.
- **Relación de aspecto:** vertical 9:16 por defecto si es contenido corto vertical.
- **Duración objetivo:** definirla antes de escribir el guion.
- **Idioma y variante:** por ejemplo, español rioplatense (es-AR).
- **Tono:** humorístico, intrigante, cálido, enérgico, educativo, etc.
- **Idea central:** una sola idea fácil de recordar.
- **Llamada a la acción:** qué queremos que haga la audiencia.
- **Restricciones:** afirmaciones que no se pueden hacer, elementos que no deben aparecer, límites de marca y derechos de uso.

No empezar por animar. Primero se cierra el mensaje; después se diseña cómo contarlo.

## 4. Guion y storyboard

### 4.1 Guion

El guion debe separar claramente:

- **Locución:** palabras que se escuchan.
- **Texto en pantalla:** palabras que efectivamente aparecen en el video.
- **Acción visual:** qué ve la persona.
- **Audio:** música, ambiente, efectos y silencios.
- **Duración:** tiempo asignado a cada bloque.

La locución y los subtítulos deben derivarse de una misma fuente de texto siempre que sea posible. Si el sistema sincroniza palabras con audio, debe tolerar diferencias de puntuación, espacios, contracciones y tokenización; no debe fallar toda la producción por una discrepancia menor entre el texto reconocido y el texto del subtítulo.

### 4.2 Storyboard segundo a segundo

Cada escena debe tener inicio y fin explícitos. No dejar transiciones importantes libradas a interpretación.

| Tiempo | Imagen / acción | Cámara | Locución | Texto en pantalla | Audio / transición |
|---|---|---|---|---|---|
| 00:00–00:02 | Gancho visual inmediato | Plano / movimiento | Frase inicial | Gancho breve | Impacto sonoro |
| 00:02–00:05 | Desarrollo de la idea | Movimiento definido | Frase siguiente | Una línea por bloque | Música / ambiente |
| 00:05–00:08 | Demostración o giro | Encuadre definido | Continuación | Texto de apoyo | Efecto puntual |
| 00:08–final | Resolución y CTA | Cierre legible | CTA | CTA | Cierre musical |

**Reglas de legibilidad:**
- Una idea por pantalla.
- Evitar que dos líneas o elementos compitan por el mismo espacio.
- Para textos que puedan solaparse, colocar cada frase en un renglón o bloque separado.
- Mantener márgenes seguros para interfaces de redes sociales.
- No ubicar texto importante pegado a los bordes.
- Verificar el video final completo, especialmente el último tercio y la pantalla final.
- Priorizar contraste alto y tipografía legible en móvil.

## 5. Dirección visual y escenas Three.js

Cada escena debe describirse de manera que pueda implementarse sin inventar decisiones fundamentales durante el render.

Para cada escena documentar:

1. **Escenario:** fondo, entorno, objetos y profundidad.
2. **Sujeto principal:** forma, materiales, colores, escala y posición.
3. **Composición:** qué ocupa el centro y qué queda en segundo plano.
4. **Cámara:** posición, objetivo, lente/encuadre y movimiento.
5. **Animación:** estado inicial, acción, estado final y easing.
6. **Iluminación:** dirección, intensidad, color y sombras.
7. **Texto:** contenido exacto, posición, tamaño relativo, entrada y salida.
8. **Audio sincronizado:** eventos y marcas temporales.
9. **Transición:** cómo entra y sale la escena.
10. **Rendimiento:** cantidad razonable de geometría, materiales y efectos para un navegador común.

### Reglas técnicas para escenas

- Mantener una resolución y una tasa de cuadros objetivo consistentes durante toda la producción.
- Evitar crear geometría, materiales o texturas innecesariamente en cada frame.
- Reutilizar recursos y liberar los que ya no se necesiten.
- Evitar dependencias externas frágiles; incluir o referenciar de forma explícita cada asset.
- La escena debe poder renderizarse de forma determinista a partir de sus datos y versión.
- No mezclar lógica de aprobación/subida con el motor visual.
- Si una escena falla, informar qué escena y etapa fallaron; no dejar al usuario esperando sin feedback.

## 6. Audio, locución y subtítulos

El paquete debe especificar:

- Archivo de audio y formato.
- Idioma, voz y variante regional.
- Duración real del audio.
- Volumen relativo de voz, música y efectos.
- Marcas de entrada y salida de cada elemento.
- Texto exacto de locución.
- Subtítulos con tiempos de inicio y fin.
- Pausas intencionales y silencios.

**Sincronización:** los subtítulos deben seguir el audio real, no una estimación basada solamente en cantidad de caracteres. Si se usa alineación por palabras, contemplar puntuación, tildes, apóstrofes, contracciones y diferencias entre tokens. Ante una discrepancia menor, aplicar una estrategia tolerante (normalizar/comparar por bloques o palabras cercanas) y mostrar una advertencia; reservar el error fatal para datos realmente irrecuperables.

## 7. Production Package: estructura de entrega

Cada video se prepara como un paquete autocontenido y versionado. La estructura lógica recomendada es:

```text
production/
  manifest.json
  brief.md
  script.md
  storyboard.md
  scenes/
    scene-01.json
    scene-02.json
  assets/
    images/
    models/
    textures/
  audio/
    voice.*
    music.*
    sfx/
  subtitles/
    captions.json
  metadata/
    upload.txt
  README.md
```

Los nombres y extensiones concretos deben coincidir con lo que admita el esquema vigente del Studio. Esta estructura es la organización conceptual del paquete; no implica que todos esos directorios deban existir si una producción no necesita esos recursos.

### Manifiesto mínimo conceptual

```json
{
  "schemaVersion": 1,
  "id": "001-nutella",
  "title": "Nutella",
  "version": "1.0.0",
  "status": "planned",
  "language": "es-AR",
  "aspectRatio": "9:16",
  "targetDurationSeconds": 20,
  "createdAt": "YYYY-MM-DD",
  "scenes": [],
  "assets": [],
  "audio": {},
  "subtitles": {},
  "metadataFile": "001-nutella.txt"
}
```

Este bloque es una **plantilla ilustrativa**, no una garantía de que cada campo coincida con el tipo exacto que valida la versión actual del código. Antes de cambiar el esquema, revisar el validador y los tipos reales del repositorio. Versionar los cambios de esquema y mantener compatibilidad con los paquetes anteriores cuando sea posible.

### Versionado

- No sobrescribir silenciosamente una producción ya aprobada.
- Incrementar la versión cuando cambie el contenido, la escena, el audio o la duración.
- Registrar qué cambió y por qué.
- Separar versión del paquete, versión del motor y versión del esquema.
- Un paquete debe indicar qué versión del motor necesita.

## 8. Renderizado en el navegador

El render se ejecuta en el navegador del usuario. Por lo tanto:

- La pestaña debe permanecer abierta mientras se procesa.
- La interfaz debe mostrar la etapa actual y el progreso real.
- No simular porcentajes si no se dispone de progreso medible.
- Informar el avance de frames cuando el motor lo permita.
- Mostrar duración transcurrida y errores concretos.
- Permitir reintentar una etapa fallida sin rehacer trabajo innecesariamente, cuando la arquitectura lo permita.
- Distinguir errores de carga de assets, audio, escenas, render y codificación.

### Etapas que debe comunicar la interfaz

1. Preparando producción.
2. Validando manifiesto y recursos.
3. Cargando escenas y assets.
4. Preparando audio y subtítulos.
5. Renderizando frames.
6. Codificando video WebM.
7. Video WebM listo.
8. Convirtiendo WebM a MP4.
9. MP4 listo para revisión.
10. Aprobación y subida (sólo después de la acción del usuario).

Si tarda, el usuario debe saber si está trabajando, esperando un recurso o si ocurrió un error. Nunca dejar una pantalla aparentemente congelada.

### Formato y conversión

- El render base produce un **WebM**.
- La conversión a **MP4** es un paso adicional en el navegador.
- La conversión no debe modificar ni borrar el WebM original.
- Detectar capacidades de codecs del navegador y comunicar si no son compatibles.
- Verificar que el MP4 resultante tenga tamaño mayor que cero y pueda leerse antes de habilitar aprobación.
- La función de aprobación tiene un límite operativo de 100 MB para el MP4; si se supera, informar el límite claramente y no iniciar una subida que vaya a fallar.
- No afirmar que un archivo está listo hasta comprobar que la conversión terminó.

## 9. Control de calidad antes de aprobar

Reproducir el archivo final completo, no solamente una vista previa.

### Checklist visual
- [ ] El video abre y se reproduce desde el inicio hasta el final.
- [ ] La relación de aspecto y resolución son correctas.
- [ ] No hay frames negros, congelados ni saltos inesperados.
- [ ] No hay objetos que atraviesen o tapen textos por error.
- [ ] Ningún texto queda cortado, superpuesto o fuera de márgenes seguros.
- [ ] Cada frase aparece en el momento correcto y permanece el tiempo suficiente.
- [ ] La pantalla final y el CTA se leen correctamente.

### Checklist de audio
- [ ] La voz se entiende y no está recortada.
- [ ] Música y efectos no tapan la voz.
- [ ] No hay silencios accidentales ni cortes abruptos.
- [ ] El audio está sincronizado con las escenas.
- [ ] Los subtítulos corresponden a lo que se escucha.

### Checklist de contenido y archivos
- [ ] El mensaje coincide con el brief.
- [ ] No hay errores ortográficos ni afirmaciones dudosas.
- [ ] Los recursos tienen permiso de uso.
- [ ] La duración coincide con lo previsto o la diferencia está justificada.
- [ ] Existe el MP4 final.
- [ ] Existe el TXT de metadatos con el mismo nombre base.
- [ ] Los nombres de archivos siguen la convención acordada.

Si falla algo, corregir y volver a renderizar la versión correspondiente. No aprobar un video con errores conocidos.

## 10. Metadatos TXT y nombres de archivo

Convención actual para la primera producción:

- Video: `001-nutella.mp4`
- Metadatos: `001-nutella.txt`

El TXT debe acompañar al MP4 y compartir exactamente el mismo nombre base. Debe incluir, como mínimo:

```text
TÍTULO:
DESCRIPCIÓN:
TEXTO / COPY:
HASHTAGS:
PLATAFORMAS:
IDIOMA:
DURACIÓN:
RELACIÓN DE ASPECTO:
ID DE PRODUCCIÓN:
VERSIÓN:
FECHA:
```

Completar los campos relevantes para cada plataforma. No inventar datos de producto, promociones, enlaces ni afirmaciones. Preparar el TXT junto con el paquete; no dejarlo para después de la aprobación.

## 11. Aprobación y subida a GitHub

La aprobación es siempre manual. El botón vigente del flujo es:

`✓ CONVERTIR A MP4 Y SUBIR A GITHUB`

El usuario introduce la contraseña de aprobación en el campo de la aplicación. **Nunca pedirla por chat ni guardarla en el código frontend.**

Comportamiento esperado del flujo:

1. Comprobar que existe una producción renderizada.
2. Convertir el WebM a MP4 si todavía no se hizo.
3. Verificar el MP4.
4. Verificar que el TXT correspondiente ya existe.
5. Mostrar claramente qué archivos se van a subir.
6. Exigir la contraseña de aprobación.
7. Enviar MP4 y datos de identificación a la Edge Function `approve-content-upload`.
8. La función valida la contraseña con el secreto `STUDIO_APPROVAL_KEY`.
9. La función usa `GITHUB_CONTENT_TOKEN` en el servidor para subir el MP4 al repositorio.
10. Confirmar el resultado y la ruta final.

**Destino acordado:** carpeta de GitHub `Contenido a subir`.

### Estado técnico conocido

- Edge Function: `approve-content-upload`.
- Endpoint: `https://xblqghhhchffuqkmzgta.supabase.co/functions/v1/approve-content-upload`.
- La función utiliza los secretos del lado servidor `STUDIO_APPROVAL_KEY` y `GITHUB_CONTENT_TOKEN`.
- La versión restaurada del flujo usa contraseña, no GitHub OAuth.
- La función implementada verifica que el TXT exista, pero la subida descrita hasta ahora sube el MP4. **No asumir que la función también sube el TXT:** comprobarlo en el código antes de modificar o dar por completado el flujo de ambos archivos.
- Límite conocido de MP4 en la función: 100 MB.
- No incluir tokens, contraseñas ni secretos en este documento, en el frontend, en el manifiesto ni en commits.

La aprobación significa que el usuario autoriza preparar los archivos en la carpeta de entrega. **No significa que el video se publique automáticamente en ninguna red social.**

## 12. Supabase, GitHub y límites operativos

### Supabase
- Se utiliza para persistir datos y recursos de producción.
- No utilizarlo como servidor de render.
- Vigilar el espacio disponible, tamaño por archivo y cuotas del plan gratuito.
- La referencia de límites considerada al diseñar fue 1 GB de Storage y 50 MB por archivo; verificar los límites vigentes antes de depender de ellos.
- No guardar secretos dentro de tablas o archivos accesibles públicamente.
- Validar esquema, versión y referencias antes de consumir un paquete.

### GitHub
- Repositorio: `matibh/ingredora-content-studio`.
- Mantener código y documentación versionados.
- La carpeta `Contenido a subir` es el destino de los archivos aprobados.
- Evitar subir archivos pesados o duplicados al repositorio salvo que el flujo de distribución lo requiera.
- La publicación de la web se realiza mediante GitHub Actions / GitHub Pages.

## 13. Plantilla para pedir una nueva producción a ChatGPT

Copiar y completar este bloque en la conversación. ChatGPT debe devolver el paquete completo, no solamente una idea o un guion.

```text
NUEVA PRODUCCIÓN — INGREDORA CONTENT STUDIO

Número / ID:
Producto o tema:
Objetivo:
Audiencia:
Plataformas:
Duración objetivo:
Formato (por defecto 9:16):
Idioma / variante:
Tono:
Idea central:
CTA:
Restricciones / afirmaciones que evitar:
Referencias visuales o de marca:
Recursos disponibles:
Fecha o campaña (si aplica):

ENTREGABLES OBLIGATORIOS:
1. Brief creativo cerrado.
2. Guion completo con locución y textos exactos en pantalla.
3. Storyboard segundo a segundo, con cámara, acción, transiciones y audio.
4. Dirección visual y especificación de cada escena.
5. Production Package compatible con el esquema vigente del Studio.
6. Código/datos de escenas Three.js necesarios, sin pseudocódigo incompleto.
7. Lista de assets y archivos de audio requeridos, indicando cuáles hay que generar.
8. Subtítulos temporizados y sincronizados con la locución.
9. TXT final de metadatos para la plataforma.
10. Checklist de validación y criterios para dar la producción por terminada.

REGLAS:
- No cambiar el motor existente si no es necesario.
- No introducir costos ni dependencias pagas.
- Mantener el WebM original al convertir a MP4.
- No aprobar ni publicar automáticamente.
- Antes de entregar, comprobar compatibilidad con el esquema y motor actuales del repositorio.
- Si falta un dato crítico, preguntar una sola cosa concreta; para el resto, proponer una decisión razonable y dejarla documentada.
```

## 14. Plantilla de ficha por escena

```text
ESCENA: [número y nombre]
PAQUETE / VERSIÓN:
INICIO:
FIN:
DURACIÓN:

OBJETIVO NARRATIVO:
QUÉ VE LA AUDIENCIA:
ESCENARIO / FONDO:
SUJETO / OBJETOS:
COMPOSICIÓN:
CÁMARA (posición, encuadre, movimiento):
ANIMACIÓN (inicio → acción → final):
ILUMINACIÓN / MATERIALES:
TEXTO EXACTO EN PANTALLA:
POSICIÓN Y MÁRGENES DEL TEXTO:
LOCUCIÓN:
AUDIO / EFECTOS:
TRANSICIÓN DE ENTRADA:
TRANSICIÓN DE SALIDA:
ASSETS Y DEPENDENCIAS:
CRITERIO DE ACEPTACIÓN:
```

## 15. Plantilla de registro de render

```text
PRODUCCIÓN:
VERSIÓN DEL PAQUETE:
VERSIÓN DEL MOTOR:
NAVEGADOR:
RESOLUCIÓN:
FPS OBJETIVO:
DURACIÓN:
INICIO DEL RENDER:
FIN DEL RENDER:
FRAMES ESPERADOS / GENERADOS:
WEBM: [ruta / tamaño / resultado]
MP4: [ruta / tamaño / resultado]
AUDIO: [resultado]
SUBTÍTULOS: [resultado]
ERRORES / ADVERTENCIAS:
REVISIÓN HUMANA: [pendiente / aprobado / rechazado]
OBSERVACIONES:
```

## 16. Problemas conocidos y cómo prevenirlos

| Problema | Prevención / respuesta |
|---|---|
| Render largo sin feedback | Mostrar etapa actual, progreso de frames, tiempo y error concreto. |
| Texto superpuesto | Diseñar cada línea en su propio bloque/renglón, usar márgenes seguros y revisar el video final. |
| Subtítulo no coincide exactamente con tokens de voz | Normalizar texto y tolerar diferencias menores de puntuación/tokenización. |
| Audio o asset 404 | Validar todas las rutas antes del render y reportar el recurso faltante. |
| MP4 no compatible | Detectar codecs antes de convertir y explicar el requisito. |
| Archivo demasiado grande | Comprobar tamaño antes de subir; límite conocido de la función: 100 MB. |
| Contraseña incorrecta o ausente | Mostrar error claro; no registrar la contraseña ni incluirla en logs. |
| TXT inexistente | Bloquear aprobación y señalar el nombre/ruta que falta. |
| WebM reemplazado por MP4 | Mantener ambos archivos; la conversión es una etapa adicional. |
| Se confunde aprobación con publicación | Confirmar que sólo se prepara el contenido en GitHub; no hay publicación automática. |

## 17. Definition of Done: cuándo una producción está terminada

Una producción sólo puede considerarse **lista para aprobación** cuando:

- [ ] Brief, guion y storyboard están cerrados.
- [ ] El paquete está versionado y valida contra el esquema vigente.
- [ ] Todas las escenas y dependencias cargan.
- [ ] El render WebM terminó correctamente.
- [ ] El WebM original está conservado.
- [ ] La conversión MP4 terminó y el archivo se puede reproducir.
- [ ] El video fue revisado completo, imagen y sonido.
- [ ] Los textos no se pisan ni quedan cortados.
- [ ] Los subtítulos están sincronizados.
- [ ] El TXT está generado y coincide en nombre base con el MP4.
- [ ] La persona responsable dio su aprobación explícita.

Después de la aprobación, la subida debe devolver una confirmación verificable con los nombres y rutas de los archivos. La distribución en redes sigue siendo una tarea separada.

---

**Mantenimiento de esta guía:** actualizarla cuando cambie el esquema del Production Package, el motor de render, la conversión, el almacenamiento o el procedimiento de aprobación. Si la documentación y el código difieren, el código vigente define el comportamiento real; corregir esta guía en el mismo cambio.
