# 09 — Audio y Voice Studio

**Estado:** especificación funcional inicial. Pipeline de exportación, perfiles de audio y decisión de voz pendientes de pruebas.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Definir el sistema de audio de Ingredora Content Studio: música, efectos sonoros, ambientes, voz, sincronización con escenas, mezcla, masterización básica y exportación junto al video.

El sistema debe ofrecer identidad sonora coherente y facilitar piezas atractivas sin depender de bibliotecas pagas, servicios de generación de audio ni APIs con facturación.

## 2. Principios no negociables

- **USD 0 permanente:** no contratar servicios, APIs, librerías, voces, música ni efectos de pago. No habilitar billing ni aceptar cargos por exceso.
- **Navegador:** generación procedural, edición, preview y mezcla deben funcionar online en el navegador.
- **ChatGPT como único cerebro creativo:** dirección sonora, conceptos, estructura musical, guiones de voz, timing y especificaciones se preparan en esta conversación. El motor ejecuta assets y parámetros aprobados.
- **Sin generación externa automática:** no integrar otro modelo generativo de texto, música o voz sin una decisión explícita que respete las restricciones del proyecto.
- **Derechos trazables:** cada archivo de audio debe tener origen, licencia, permiso, versión y atribución cuando corresponda.
- **Determinismo:** música procedural, eventos y automatizaciones deben poder reconstruirse desde el tiempo absoluto.
- **Mezcla controlable:** niveles, ducking, fades y sincronización deben ser explícitos y previsualizables.
- **No publicar sin revisión:** todo audio final debe pasar controles técnicos y aprobación humana.

## 3. Alcance funcional

El sistema contempla cinco familias:

1. Música y beds.
2. Efectos sonoros (SFX).
3. Ambientes y room tone.
4. Voz y narración.
5. Mezcla, masterización básica y sincronización audiovisual.

El MVP puede operar sin voz: música procedural, SFX y textos en pantalla deben ser suficientes para producir una pieza completa. La voz humana grabada será una opción compatible, no una obligación.

## 4. Música

### 4.1 Música procedural

El motor podrá generar composiciones originales mediante Web Audio API y secuencias declarativas:
- Tempo y compás.
- Tonalidad o centro tonal.
- Progresiones armónicas.
- Patrones rítmicos.
- Instrumentos/sintetizadores disponibles.
- Melodía y motivos breves.
- Percusión y acentos.
- Variaciones y fills.
- Inicio, desarrollo, climax y cierre.

Las composiciones deben diseñarse para el objetivo de la pieza: curiosidad, desafío, suspenso, energía, celebración, reveal o identidad de marca.

No se deben copiar melodías, hooks, grabaciones ni arreglos reconocibles de obras protegidas. Las referencias describen emoción, tempo o instrumentación general, no instrucciones para imitar una canción concreta.

### 4.2 Composición por duración

La música debe poder ajustarse a duraciones variables sin cortes accidentales:
- Intro breve.
- Loop controlado.
- Variación por sección.
- Build-up.
- Stinger/reveal.
- Ending o resolución.

Los puntos de loop deben evitar clicks y saltos armónicos. Cuando se acorte una pieza, el sistema debe seleccionar un cierre musical válido, no cortar de forma arbitraria.

### 4.3 Instrumentos y síntesis

La primera versión puede utilizar síntesis básica, osciladores, envolventes, filtros y ruido procesado. Los presets deben ser originales y suficientemente variados, sin pretender reemplazar una orquesta o una producción musical profesional.

La complejidad debe mantenerse baja para que la generación y preview no saturen CPU. El render final puede procesar el audio a tiempo de exportación sin reproducirlo en tiempo real, siempre que el resultado sea determinista y la API lo permita.

## 5. Sound Effects (SFX)

Biblioteca inicial de categorías:
- UI: click, confirmación, error, selección, countdown.
- Transiciones: whoosh, sweep, impact.
- Reveal: sparkle, chime, hit.
- Reacciones: pop, boing, comic accent.
- Producto: colocar paquete, abrir envase, tapa, bolsa, vertido.
- Cocina: mezclar, cortar, servir, burbujeo.
- Celebración: confeti, aplauso estilizado, fanfarria breve.
- Ambientes: supermercado, cocina, estudio, exterior.

Cada SFX debe ser:
- Original procedural o un archivo con licencia y procedencia verificadas.
- De duración controlada.
- Normalizado y libre de clipping.
- Etiquetado por función, intensidad y contexto.
- Compatible con ducking y mezcla.
- Reutilizable y versionado.

No usar efectos que impliquen una acción que no ocurre visualmente. El sonido de abrir un envase debe coincidir con la animación y el tipo de packaging.

## 6. Ambientes y sonido espacial

Los ambientes aportan contexto sin competir con la música o la voz:
- Room tone de estudio.
- Cocina suave.
- Supermercado estilizado.
- Exterior/ambiente natural.
- Texturas abstractas.

Pueden ser loops procedurales o grabaciones autorizadas. La espacialización 3D es opcional: no es requisito del MVP y no debe complicar la mezcla de una pieza social estéreo.

## 7. Voz y narración

### 7.1 Opciones permitidas

El sistema puede contemplar:
1. Sin voz: narración mediante títulos, subtítulos, gráficos y acciones.
2. Voz humana grabada: archivo importado por el usuario con permiso y derechos.
3. Voz sintetizada: solo si se demuestra que la solución es compatible con uso comercial, español e inglés requeridos, ejecución online, privacidad y presupuesto cero real.

La opción 3 permanece **no aprobada** hasta una evaluación específica. No se debe integrar un proveedor que solicite tarjeta, habilite billing, cobre por caracteres/minutos o pueda generar cargos automáticos.

### 7.2 Guiones y dirección

ChatGPT prepara:
- Texto completo.
- Idioma y variante regional.
- Tono y ritmo.
- Pausas y énfasis.
- Duración estimada.
- Pronunciación de marcas y nombres.
- Marcadores temporales.
- Texto de subtítulos correspondiente.

El inglés debe adaptarse culturalmente, no traducirse de forma literal. El español debe ser natural y comprensible en Argentina y LatAm.

### 7.3 Grabaciones importadas

Cuando se use voz humana:
- El usuario debe tener derecho a utilizar la grabación.
- Se registra quién la aportó, permiso, idioma, fecha y versión.
- No se permite clonar ni imitar voces de terceros sin autorización.
- No presentar una voz sintética como una persona real.
- Se debe poder reemplazar la toma sin alterar el resto de la escena.

### 7.4 Pronunciación y sincronización

Cada pista puede incluir:
- Marcadores de frase.
- Pausas.
- Énfasis.
- Pronunciaciones alternativas.
- Subtítulos sincronizados.
- Eventos para gestos o cambios de cámara.

Lip-sync fonético avanzado queda fuera del MVP. Si se utiliza personaje con voz, se puede sincronizar una animación simple de boca mediante marcadores preparados, sin prometer precisión de visemas.

## 8. Audio Timeline

La timeline de audio debe admitir:
- Tracks separados para música, voz, SFX y ambientes.
- Clips con start time, duración, trim y offset.
- Fades de entrada y salida.
- Volumen y automatización.
- Pan estéreo.
- Ducking entre pistas.
- Marcadores de sincronización.
- Loops y puntos de corte.
- Mutear/solo por pista.
- Reemplazo de asset sin desplazar la sincronización.

La línea de tiempo debe usar una referencia temporal común con el video. Los clips no deben depender del reloj de reproducción del navegador para calcular el resultado final.

## 9. Mezcla y masterización básica

### 9.1 Jerarquía de mezcla

Orden orientativo:
1. Voz/narración cuando exista.
2. Música.
3. SFX principales.
4. Ambientes y texturas.

La jerarquía puede cambiar por intención narrativa, pero debe existir un control claro para que música y ambiente no tapen el mensaje.

### 9.2 Controles

- Ganancia por clip y track.
- Fades.
- Compresión ligera si el motor la soporta.
- Limitador de seguridad.
- Ducking sidechain o automatización equivalente.
- Pan.
- EQ básica.
- Medición de peak y loudness.
- Detección de clipping y silencio inesperado.

La masterización debe ser transparente y conservadora. No se fijan targets de loudness universales antes de definir plataformas y validar el pipeline de exportación.

### 9.3 Medición

El sistema debe informar:
- Peak sample.
- True peak si la implementación lo permite.
- Loudness integrado si se incorpora medición compatible.
- Duración.
- Canales.
- Sample rate.
- Clipping.
- Silencio inicial/final inesperado.

Los valores objetivo por plataforma se definirán en el documento 13 o en un perfil de exportación versionado.

## 10. Render de audio

El audio final debe poder producirse sin depender de que el usuario reproduzca la pieza en tiempo real:
- Evaluar eventos a tiempo absoluto.
- Renderizar o sintetizar segmentos por rango.
- Mantener continuidad entre bloques.
- Aplicar automatizaciones reproducibles.
- Sincronizar exactamente con frame rate y duración.
- Detectar fallos de decodificación o fuentes ausentes.
- Permitir re-render de una pista o segmento cuando sea posible.

La codificación final debe integrarse con el pipeline audiovisual del documento 10. No asumir que Web Audio exporta directamente un archivo compatible con todos los navegadores. Se deberá validar la combinación real de APIs y formatos.

## 11. Formatos y compatibilidad

- WAV PCM puede servir como formato intermedio sin pérdida, sujeto a memoria y tamaño.
- AAC/MP4 o WebM/Opus pueden evaluarse como formatos finales según soporte del navegador y del contenedor elegido.
- No prometer MP4/H.264/AAC universal hasta probar codecs y encoder disponibles.
- El motor debe detectar compatibilidad antes de iniciar el render.
- Si el perfil solicitado no es soportado, informar y ofrecer solo una alternativa gratuita y verificada.
- No recurrir a conversiones remotas pagas.

## 12. Audio Library y metadatos

Cada recurso tendrá:
- ID estable y versión.
- Nombre y categoría.
- Tipo: music, sfx, ambience, voice.
- Origen: procedural, grabación propia, archivo autorizado.
- Licencia y permisos.
- Atribución requerida.
- Idioma, si corresponde.
- Duración y formato.
- Sample rate y canales.
- Tags de emoción, intensidad y uso.
- Hash/checksum para integridad.
- Estado: draft, review, approved, deprecated.

Los recursos procedurales deben guardar semilla, parámetros y versión del sintetizador para poder reconstruirse.

## 13. Presupuesto cero y derechos

- No usar servicios de música o voz con cuotas pagas o billing automático.
- No asumir que “royalty-free” significa libre para cualquier uso comercial.
- Verificar licencias de cada archivo y de cada biblioteca de audio.
- No extraer audio de videos, canciones o plataformas sin permiso.
- No imitar artistas, canciones, locutores ni voces reconocibles.
- Si la cuota gratuita de almacenamiento se agota, detener nuevas cargas y aplicar política de limpieza aprobada; no ampliar plan automáticamente.
- La voz humana importada requiere permiso documentado.
- No utilizar contenido de terceros como referencia para copiar una composición protegida.

## 14. Accesibilidad y experiencia

- Toda información importante expresada por voz debe aparecer también en texto/subtítulos cuando corresponda.
- No depender exclusivamente de sonidos para comunicar éxito, error o resultado.
- Ofrecer control de volumen y mute.
- Evitar picos repentinos y sonidos excesivamente estridentes.
- Mantener diálogos comprensibles.
- Los subtítulos deben poder corregirse manualmente y adaptarse a ES/EN.

## 15. Criterios de aceptación

- [ ] La escena puede reproducirse sin voz y seguir comunicando su mensaje.
- [ ] Existe generación procedural de una pieza musical simple y original.
- [ ] Los SFX pueden ubicarse con precisión en la timeline.
- [ ] La música puede loop-earse y cerrarse sin cortes audibles.
- [ ] Tracks de voz, música, SFX y ambiente son independientes.
- [ ] Fades, ganancia, mute y ducking son controlables.
- [ ] El audio se evalúa por tiempo absoluto y se reproduce de forma determinista.
- [ ] Se detectan clipping, assets faltantes y formatos no soportados.
- [ ] Los recursos registran procedencia, derechos y versión.
- [ ] La exportación se sincroniza con duración y FPS del video.
- [ ] No hay dependencia de APIs pagas ni billing.
- [ ] La voz sintética sigue deshabilitada hasta aprobación explícita y auditoría de costo/licencia.

## 16. Fuera del MVP

- Generación musical con modelos externos.
- TTS cloud con billing.
- Clonación de voz.
- Lip-sync fonético avanzado.
- Mastering profesional automático.
- Audio espacial/binaural complejo.
- Librería comercial de música como dependencia.
- Publicación directa a plataformas desde el motor.

## 17. Decisiones pendientes

1. Confirmar si el piloto será completamente sin voz o admitirá grabaciones humanas.
2. Definir sintetizador procedural y catálogo de instrumentos.
3. Establecer formato intermedio de audio y codec final.
4. Elegir biblioteca/encoder compatible y su licencia.
5. Definir medición de loudness y perfiles de exportación.
6. Determinar si la voz sintética tendrá evaluación futura independiente.
7. Definir esquema de Audio Library y almacenamiento.
8. Probar memoria y rendimiento en dispositivos objetivo.

## 18. Relación con otros documentos

- **03 — ChatGPT: producción y protocolo:** guiones, dirección creativa y paquetes de producción.
- **04 — Identidad visual:** identidad sonora y coherencia de marca.
- **07 — Personajes y animaciones:** gestos y sincronización simple de boca.
- **08 — Cinematic Scene Engine:** eventos de escena, timeline y composición.
- **10 — Editor y Render Engine:** mezcla, sincronización y exportación audiovisual.
- **11 — Supabase y almacenamiento:** persistencia de recursos y cuotas.
- **12 — Control de calidad:** clipping, duración, derechos y validación de entregables.
- **13 — Distribución social:** targets y especificaciones de audio por plataforma.

---

**Estado:** especificación inicial. La voz sintética no está aprobada. El MVP puede producir piezas completas con música procedural, SFX, ambientes, textos y subtítulos.
