# 10 — Editor y Render Engine

**Estado:** especificación funcional inicial. UI, contratos, codecs, límites de memoria y estrategia de recuperación pendientes de prototipo.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Definir el espacio de trabajo donde se importan, organizan, editan, previsualizan, validan y renderizan las producciones de Ingredora Content Studio.

El Editor coordina campañas, escenas, planos, personajes, productos, gráficos y audio. El Render Engine convierte la composición aprobada en archivos audiovisuales finales, ejecutándose en el navegador y guardando los entregables en Supabase Storage.

No es un editor generalista para competir con herramientas profesionales. Es una interfaz especializada en producir piezas cortas y repetibles para Ingredora.

## 2. Principios no negociables

- **USD 0 permanente:** no activar billing, contratar planes, consumir APIs pagas ni permitir cargos automáticos.
- **Browser-first:** edición, preview y render en el navegador; sin exigir instalaciones locales.
- **ChatGPT prepara, la app ejecuta:** no se presupone conexión automática con esta conversación ni una API generativa.
- **Producciones declarativas:** importar paquetes versionados y validados; nunca ejecutar JavaScript arbitrario desde un proyecto o desde Supabase.
- **Render local al navegador:** el procesamiento audiovisual ocurre en el dispositivo del usuario; no usar Functions ni servidores remotos para render.
- **Persistencia controlada:** los videos finales y recursos aprobados se almacenan en Supabase Storage, sujeto a cuotas gratuitas verificadas.
- **Determinismo:** el mismo paquete, engine, assets y parámetros deben reproducir el mismo resultado visual y temporal dentro de las tolerancias definidas.
- **Aprobación humana:** renderizar no equivale a aprobar ni publicar.
- **Recuperación:** guardar estado y progreso para no perder una producción ante recarga, cierre o fallo del navegador.

## 3. Mapa funcional del Editor

El espacio de trabajo tendrá áreas especializadas:

1. **Campaign Workspace:** campañas, briefs, idiomas, versiones y entregables.
2. **Asset Browser:** productos, personajes, escenarios, props, gráficos y audio.
3. **Scene/Shot Editor:** composición visual, cámara, luces, acciones y overlays.
4. **Timeline:** escenas, tracks visuales y pistas de audio.
5. **Preview Monitor:** reproducción, scrub, calidad y safe zones.
6. **Inspector:** parámetros del elemento seleccionado.
7. **Validation Panel:** errores, advertencias, derechos y dependencias.
8. **Render Queue:** trabajos, prioridad, progreso, cancelación y reanudación.
9. **Deliverables Library:** videos y recursos finales almacenados.
10. **Version History:** paquetes, escenas, assets y renders anteriores.

La interfaz debe priorizar la claridad y el flujo de campaña, no exponer todos los parámetros técnicos de Three.js al usuario.

## 4. Campaign Workspace

Cada campaña contiene:
- ID y nombre.
- Objetivo y pilar editorial.
- Brief aprobado.
- Idiomas y variantes.
- Productos y personajes referenciados.
- Production Packages y versiones.
- Escenas y orden.
- Entregables esperados.
- Estado de producción.
- Estado de revisión/aprobación.
- Métricas o links de distribución, si existen posteriormente.
- Historial de cambios.

Estados sugeridos:
- Draft.
- Package imported.
- Validation required.
- Ready for preview.
- Preview approved.
- Ready to render.
- Rendering.
- Render interrupted.
- Render complete.
- Review required.
- Approved.
- Archived.

Un estado no debe avanzar si faltan dependencias críticas o verificaciones obligatorias.

## 5. Importación de Production Packages

El Editor importará paquetes definidos en el documento 03.

### 5.1 Canales de importación posibles

- Archivo descargado y seleccionado por el usuario.
- ZIP con manifest y archivos declarativos.
- Repositorio GitHub mediante mecanismo autorizado y permisos explícitos.
- Importación manual de JSON para pruebas.

No se asume que la app puede leer automáticamente mensajes de ChatGPT o acceder a esta conversación.

### 5.2 Validación inicial

Al importar:
1. Verificar estructura y versión de schema.
2. Validar IDs, referencias y campos requeridos.
3. Comprobar compatibilidad con la versión del engine.
4. Resolver assets y dependencias.
5. Verificar rutas, tamaño y tipos MIME.
6. Comprobar derechos y estado de aprobación.
7. Rechazar scripts, HTML ejecutable o código desconocido.
8. Generar un informe de importación.

Los paquetes incompatibles deben rechazarse con errores accionables. No se deben corregir silenciosamente datos creativos que puedan alterar el resultado.

### 5.3 Versiones

Package, schema, engine y assets tienen versiones independientes. El Editor debe informar incompatibilidades y ofrecer migraciones explícitas y versionadas cuando existan.

## 6. Scene/Shot Editor

Funciones previstas:
- Añadir, eliminar, duplicar y reordenar escenas.
- Dividir una escena en planos.
- Cambiar entorno, producto, personaje y props.
- Ajustar encuadre y movimiento de cámara.
- Modificar iluminación y efectos.
- Editar títulos, textos, subtítulos y CTA.
- Ajustar acciones y expresiones de personajes.
- Cambiar animaciones de producto.
- Reemplazar audio.
- Ajustar duración, cortes y transiciones.
- Re-renderizar una escena o plano sin rehacer toda la campaña.

Los cambios deben reflejarse en el estado del proyecto y generar una nueva revisión/versionado. No modificar silenciosamente el paquete fuente importado.

## 7. Timeline

### 7.1 Estructura

La timeline tendrá una pista de escenas o bloques temporales y tracks especializados:
- Background/environment.
- Products/props.
- Characters/animation.
- Camera.
- Lighting/effects.
- Titles/graphics.
- Subtitles.
- Music.
- Voice.
- SFX.
- Ambience.
- Transitions.

La representación visual puede agrupar tracks en capas plegables para evitar saturación.

### 7.2 Edición temporal

Debe permitir:
- Scrub y reproducción.
- Selección y desplazamiento de clips.
- Trim de inicio y final.
- Ajuste de duración.
- Snap a frames y marcadores.
- Zoom temporal.
- Marcadores de eventos.
- Bloqueo y mute de tracks.
- Duplicar y reemplazar clips.
- Undo/redo para operaciones relevantes.

### 7.3 Precisión

El proyecto define un FPS y una unidad temporal común. Para el objetivo inicial de 30 FPS, la unidad mínima de edición será el frame, aunque internamente puedan conservarse timestamps de mayor precisión para audio.

Los límites de clips y escenas deben validarse para impedir solapamientos no permitidos, huecos accidentales o transiciones de duración imposible.

## 8. Preview Monitor

El monitor debe ofrecer:
- Preview vertical 9:16 como formato prioritario.
- Alternativas de aspect ratio solo si el proyecto las declara.
- Reproducción, pausa, avance frame a frame y scrub.
- Safe zones y overlays de plataforma.
- Guías de composición.
- Vista de escena y vista de pieza completa.
- Controles de volumen.
- Indicador de resolución/calidad actual.
- Advertencia cuando el preview use assets simplificados o efectos reducidos.

Perfiles sugeridos:
- **Draft:** resolución reducida, sombras y postprocesado limitados.
- **Preview:** calidad intermedia para revisar timing, composición y legibilidad.
- **Final:** resolución y parámetros del entregable aprobado.

El preview no debe presentarse como equivalente al archivo final si utiliza aproximaciones.

## 9. Render Engine

### 9.1 Responsabilidad

El Render Engine toma una versión validada e inmutable de la producción y genera los frames y pistas de audio correspondientes, para después codificarlos en un contenedor soportado.

El render no debe cambiar el proyecto fuente. Cada trabajo queda vinculado a una revisión concreta.

### 9.2 Flujo

1. Congelar snapshot de producción y dependencias.
2. Validar assets, derechos, parámetros y perfil de exportación.
3. Calcular frames y duración.
4. Preparar escena y recursos.
5. Evaluar cada frame por timestamp absoluto.
6. Capturar frames en orden.
7. Procesar audio sincronizado.
8. Codificar video y audio.
9. Verificar archivo resultante.
10. Subir entregable a Supabase Storage.
11. Registrar metadata y checksum.
12. Marcar como pendiente de revisión humana.

### 9.3 Render determinista

Para frame (n) y FPS (f), el motor evalúa el estado en (t=n/f). Las animaciones, cámaras, partículas, luces y eventos deben poder calcularse sin reproducir frames previos.

El pipeline debe fijar:
- Engine version.
- Package version.
- Asset versions.
- FPS, resolución y duración.
- Semillas de sistemas procedurales.
- Parámetros de render.
- Perfil de color y codec cuando aplique.

La reproducibilidad exacta entre GPUs y navegadores puede tener diferencias numéricas; se deben definir tolerancias y pruebas visuales, sin prometer identidad bit a bit donde no sea viable.

## 10. Render por escenas y lotes

Se debe poder:
- Renderizar una escena aislada para revisión.
- Renderizar un rango de frames.
- Renderizar la campaña completa.
- Renderizar variantes de idioma.
- Renderizar varias adaptaciones en una cola secuencial.
- Rehacer solo escenas afectadas cuando sus dependencias no hayan cambiado.

Una escena renderizada puede reutilizarse solo si package, engine, assets, parámetros y dependencias coinciden exactamente. Si cambia un elemento compartido, se deben invalidar los resultados afectados.

El MVP no requiere render paralelo en múltiples pestañas ni en servidores. Priorizar estabilidad y memoria controlada.

## 11. Gestión de memoria y recursos

El render puede consumir mucha memoria, especialmente en 1080x1920. El motor debe:
- Procesar frames o bloques acotados.
- Evitar acumular todos los frames en RAM.
- Liberar texturas, buffers y recursos GPU al cambiar de escena.
- Controlar resolución y calidad.
- Evitar copias innecesarias entre CPU y GPU.
- Monitorear errores de memoria y pérdida de contexto.
- Permitir detener el trabajo sin corromper el proyecto.
- Mantener un límite configurable de tamaño temporal de buffers.

La estrategia de buffering y codificación debe validarse con benchmarks. No se presupone que un navegador pueda sostener cualquier duración o resolución.

## 12. Codificación y formatos

El pipeline debe evaluar APIs nativas del navegador, como WebCodecs, junto con una biblioteca compatible de muxing/encoding si resulta necesaria y su licencia lo permite.

No asumir:
- Que todos los navegadores ofrecen el mismo encoder.
- Que H.264/AAC estará disponible en cualquier dispositivo.
- Que WebM/VP9/Opus es aceptado por todas las plataformas.
- Que el contenedor y el codec son lo mismo.
- Que el preview garantiza que la exportación funcionará.

Antes de render final se ejecutará una prueba de capacidades. El perfil de salida se selecciona solo entre combinaciones probadas. Si no existe un perfil compatible, se detiene con explicación; nunca se deriva a un servicio pago.

## 13. Persistencia y Supabase Storage

Los entregables finales y recursos aprobados deben guardarse en Supabase Storage. No basta con ofrecer descarga local.

La app debe:
- Subir el archivo final mediante el flujo autenticado.
- Verificar tamaño y respuesta de carga.
- Registrar ruta, MIME, duración, resolución, FPS, idioma, campaña, versión y checksum.
- Mostrar estado de carga y errores.
- Reintentar cargas interrumpidas cuando sea posible.
- Evitar duplicados mediante IDs/checksums.
- Permitir reproducir el video guardado desde la app.
- Respetar RLS y permisos del usuario.

Los videos finales no deben guardarse en GitHub. La cuota gratuita de Supabase, egress, límites de tamaño y retención deben auditarse antes de fijar formatos o volumen de producción.

Si no hay espacio o cuota disponible, detener nuevas cargas y mostrar el motivo. No activar plan pago ni borrar entregables aprobados automáticamente.

## 14. Render Queue y recuperación

Cada job registra:
- Job ID.
- Snapshot de producción.
- Estado.
- Perfil de exportación.
- Frame actual y total.
- Escena actual.
- Errores y advertencias.
- Inicio, pausa y finalización.
- Resultado y checksum.

Estados:
- Queued.
- Preparing.
- Rendering.
- Encoding.
- Uploading.
- Interrupted.
- Failed.
- Completed.
- Cancelled.

La recuperación puede continuar desde una escena o bloque seguro si los artefactos parciales son válidos. Si no es posible verificar el estado, reiniciar el bloque afectado en lugar de producir un archivo corrupto.

La cola debe ser secuencial en el MVP. El usuario puede pausar o cancelar. Una recarga no debe hacer creer que un render sigue activo si el proceso del navegador terminó.

## 15. Autosave, historial y undo/redo

- Guardar cambios de edición de forma periódica y ante acciones relevantes.
- Diferenciar borrador, revisión importada, snapshot de render y versión aprobada.
- Mantener historial de cambios.
- Permitir restaurar una revisión.
- No sobrescribir el paquete fuente original.
- Undo/redo para acciones del editor, con límites explícitos.
- Indicar claramente cuándo los cambios están sincronizados con el backend.

La persistencia local del navegador puede usarse como caché temporal, nunca como única copia de un entregable final.

## 16. Deliverables Library

La biblioteca presenta:
- Miniatura/preview.
- Nombre de campaña y pieza.
- Idioma y formato.
- Duración.
- Resolución y FPS.
- Tamaño.
- Fecha de render.
- Versión de producción y engine.
- Estado de revisión.
- Ubicación en Storage.
- Acciones para reproducir, revisar, archivar o eliminar con confirmación.

La eliminación debe ser explícita, autorizada y auditable. No aplicar limpieza automática a videos aprobados.

## 17. Validaciones antes del render

- Schema y compatibilidad del paquete.
- Assets presentes y accesibles.
- Derechos y permisos vigentes.
- Productos y versiones correctos.
- Resolución, FPS y duración dentro de límites.
- Textos, subtítulos y safe zones.
- Idioma y metadatos.
- Ausencia de respuestas secretas o Daily activo.
- Ausencia de claims no verificados.
- Audio sin clipping y sincronizado.
- Componentes y parámetros registrados.
- Compatibilidad de codec y memoria estimada.
- Cuota de almacenamiento disponible.

Los errores bloqueantes impiden el render final. Las advertencias requieren reconocimiento explícito o resolución según su severidad.

## 18. Seguridad y aislamiento

- No evaluar código importado con eval, Function o mecanismos equivalentes.
- No cargar scripts de campañas desde Storage.
- Componentes del engine registrados y versionados en el repositorio.
- Validación de inputs y límites de tamaño.
- Separar claves públicas de secretos de servidor.
- RLS y permisos mínimos para datos y Storage.
- No exponer respuestas de juego, tokens ni datos privados.
- Verificar origen de paquetes y assets.
- Mantener revisión humana antes de publicación.

## 19. Rendimiento y compatibilidad

El prototipo debe medir:
- Tiempo de inicialización.
- FPS de preview.
- Tiempo de render por frame.
- Memoria estimada y picos.
- Duración máxima estable.
- Tiempo de codificación.
- Tiempo y tasa de éxito de subida.
- Comportamiento ante suspensión de pestaña y pérdida de contexto.

Se probarán navegadores y dispositivos objetivo. No se establecerá un límite máximo universal antes de medir. El sistema debe comunicar requisitos y permitir perfiles reducidos.

## 20. Criterios de aceptación

- [ ] Importar un Production Package y validar su estructura.
- [ ] Editar y reordenar escenas sin alterar el paquete original.
- [ ] Timeline con tracks visuales y de audio.
- [ ] Preview vertical con scrub y revisión frame a frame.
- [ ] Diferenciar claramente Draft, Preview y Final.
- [ ] Render de una escena, rango de frames y campaña completa.
- [ ] Evaluación temporal determinista.
- [ ] Render secuencial por lotes con progreso visible.
- [ ] Pausa, cancelación y recuperación segura.
- [ ] Prueba de compatibilidad de codec antes del render.
- [ ] Liberación de memoria y manejo de errores GPU.
- [ ] Subida de videos finales a Supabase Storage.
- [ ] Reproducción del entregable desde la app.
- [ ] Registro de metadata, versiones y checksum.
- [ ] Validaciones bloqueantes antes del render.
- [ ] Ninguna ruta de procesamiento requiere servidor pago o billing.
- [ ] Aprobación humana separada del estado de render completo.

## 21. Fuera del MVP

- Edición multipista profesional avanzada.
- Colaboración simultánea en tiempo real.
- Render distribuido o cloud rendering.
- Exportación masiva paralela.
- Conversión remota de codecs.
- Publicación automática a redes.
- Aplicación de escritorio o render local instalado.
- Efectos avanzados de composición que no sean sostenibles en navegador.

## 22. Decisiones pendientes

1. Layout y navegación final del editor.
2. Contrato definitivo de Production Package y schema.
3. Modelo de datos para campañas, revisiones, jobs y entregables.
4. Biblioteca y estrategia de encoding/muxing.
5. Matriz de codecs por navegador y dispositivo.
6. Estrategia de buffering, chunks y recuperación.
7. Límites de duración, resolución, memoria y tamaño.
8. Modelo de subida y reintentos en Supabase Storage.
9. Política de retención y capacidad gratuita.
10. Estrategia de autosave e historial.
11. Benchmarks de render y exportación en equipos reales.

## 23. Relación con otros documentos

- **02 — Arquitectura general:** límites de ejecución, navegador, Supabase y almacenamiento.
- **03 — ChatGPT: producción y protocolo:** importación y versionado de Production Packages.
- **04 — Identidad visual:** safe zones, overlays y perfiles gráficos.
- **05/06 — Product Library y 3D Product Studio:** productos y packaging.
- **07 — Personajes y animaciones:** rigs, acciones y clips.
- **08 — Cinematic Scene Engine:** escenas, cámaras, luces, partículas y timeline visual.
- **09 — Audio y Voice Studio:** tracks, mezcla y sincronización.
- **11 — Supabase y almacenamiento:** cuotas, RLS, políticas y persistencia.
- **12 — Control de calidad:** gates y aprobación.
- **13 — Distribución social:** formatos y perfiles de exportación.

---

**Estado:** especificación inicial. No constituye implementación ni garantiza que todos los navegadores puedan renderizar 1080x1920 o exportar MP4. Los codecs, límites, almacenamiento y recuperación requieren pruebas reales antes del desarrollo.
