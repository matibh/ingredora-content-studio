# Auditoría transversal — Ingredora Content Studio

**Fecha:** 2026-11-19  
**Alcance:** revisión documental de README, CHANGELOG y documentos 00–15.  
**Estado:** auditoría inicial; hallazgos y recomendaciones pendientes de aprobación.  
**Importante:** esta revisión no es una auditoría de código ni una prueba de rendimiento. La aplicación todavía no está implementada.

## 1. Resultado ejecutivo

La documentación tiene una arquitectura conceptual coherente: ChatGPT prepara paquetes; la aplicación los valida y ejecuta; Three.js produce escenas; el navegador renderiza; Supabase persiste; GitHub versiona código; la publicación requiere aprobación humana.

No recomiendo comenzar a programar todavía. Hay decisiones que deben cerrarse para que el primer prototipo no se construya sobre supuestos incompatibles con el presupuesto o con los límites reales de navegador y almacenamiento.

**Resultado:** documentación completa como borrador, pero Fase 0 todavía no aprobada.

## 2. Hallazgos bloqueantes

### A-01 — Prioridad de plataformas contradictoria

**Severidad:** bloqueante documental.  
**Documentos:** 01 y 13.

- Documento 01 prioriza YouTube Shorts, Instagram Reels y Facebook Reels; deja TikTok para publicación manual.
- Documento 13 prioriza TikTok, Instagram Reels y YouTube Shorts; no incluye Facebook como canal inicial.

**Riesgo:** se construyen perfiles de exportación, Social Packages y métricas para un conjunto distinto del que se usa en el piloto.

**Recomendación:** adoptar como canales iniciales TikTok, Instagram Reels y YouTube Shorts, con publicación manual en los tres. Dejar Facebook fuera del MVP y evaluar su incorporación después del piloto. Esta recomendación sigue el documento 13, pero requiere confirmación del propietario del proyecto.

### A-02 — Supabase Storage no permite una biblioteca audiovisual ilimitada

**Severidad:** bloqueante de viabilidad operativa.  
**Documentos:** 02, 10, 11 y 15.

La documentación oficial consultada el 19/11/2026 indica:
- 1 GB de almacenamiento de archivos en el plan Free.
- Límite global de 50 MB por archivo en Free.
- 10 GB de transferencia total en Free: 5 GB cached y 5 GB uncached.
- Proyectos Free susceptibles de pausa cuando tienen baja actividad de base de datos durante una semana.
- Ventana de restauración de un proyecto pausado: hasta un año.

Fuentes oficiales:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/storage/uploads/file-limits
- https://supabase.com/docs/guides/storage/serving/bandwidth
- https://supabase.com/docs/guides/platform/free-project-pausing

**Riesgo:** un video que exceda el límite por archivo no puede guardarse como un único entregable; una biblioteca de videos y reproducciones repetidas pueden agotar Storage o egress rápidamente. La obligación del proyecto de almacenar y reproducir videos finales desde la app sigue siendo posible solo bajo límites estrictos y un volumen piloto pequeño.

**Recomendaciones:**
1. Probar una campaña real antes de aprobar el diseño de almacenamiento.
2. Establecer un límite interno de archivo inferior a 50 MB; 45 MB puede utilizarse como techo inicial de prueba, no como garantía hasta medir.
3. Medir tamaño de master, audio, thumbnail, assets y versiones; reservar margen para metadata y recursos.
4. Limitar retención de previews y versiones intermedias.
5. Establecer un presupuesto mensual conservador de reproducción/egress.
6. No dividir archivos para eludir el límite global.
7. Si la prueba real no entra en los límites sin degradación inaceptable, detener y revisar duración, bitrate, codec o alcance. No activar otro proveedor pago.

**Conclusión:** Supabase Free puede servir para un piloto controlado; no debe presentarse como archivo audiovisual permanente de alto volumen.

### A-03 — El formato de exportación no está resuelto

**Severidad:** bloqueante técnico.  
**Documentos:** 02, 09, 10, 13 y 15.

WebCodecs no crea por sí solo un archivo MP4/WebM completo; se necesita codificación y muxing. El soporte de encoder y codecs depende del navegador, sistema operativo y hardware. La documentación de MDN advierte, entre otras brechas, que AAC encoding no está soportado en Firefox ni en navegadores de escritorio Linux, y que el soporte en Safari depende de versiones recientes.

Fuente:
- https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API
- https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection
- https://mediabunny.dev/guide/introduction

**Riesgo:** no se puede prometer un master MP4/H.264/AAC que funcione en todos los navegadores ni que sea aceptado por todos los canales.

**Recomendación:**
1. Definir un navegador de producción inicial (propuesta: Chrome o Edge de escritorio en Windows).
2. Crear una prueba técnica mínima de WebCodecs + muxer antes de desarrollar el editor.
3. Probar encoder real de video y audio, contenedor, sincronización, reproducción y upload.
4. Probar el archivo exportado en las tres plataformas elegidas.
5. Seleccionar un solo perfil final de MVP. Los demás navegadores pueden quedar inicialmente en preview o compatibilidad no garantizada.

### A-04 — La analítica del juego y la analítica de Content Studio no tienen una frontera definida

**Severidad:** bloqueante de integración.  
**Documentos:** 02, 11, 13 y 14.

El documento 14 define eventos como `game_attempt_start` y `game_attempt_complete`, pero Content Studio es una aplicación distinta del juego Ingredora. No está definido si los eventos se registrarán en la infraestructura actual del juego, si se exportarán como agregados o si se replicarán en el proyecto Supabase de Content Studio.

**Riesgo:** duplicar bases, exponer datos de jugadores, acoplar dos proyectos y gastar cuota de Storage/DB innecesariamente.

**Recomendación:** el juego debe seguir siendo la fuente de verdad de los eventos de gameplay. Content Studio debe importar o recibir solo métricas agregadas por campaña/periodo, si el juego puede atribuirlas de manera legítima. No crear una segunda telemetría de gameplay hasta revisar la arquitectura real del juego y su privacidad.

### A-05 — Retención D1/D7 no es calculable con un ID de sesión efímero

**Severidad:** bloqueante de medición.  
**Documento:** 14.

El esquema propone `anonymous_session_id`, pero si cambia en cada sesión no permite saber si el mismo navegador volvió al día siguiente o a los siete días.

**Recomendación:** elegir explícitamente una de estas opciones:
- Retención basada en una identidad de usuario que el juego ya utilice, con permisos y finalidad definidos.
- Identificador seudónimo persistente, solo si se justifica, informa y protege adecuadamente.
- No medir retención de personas en el MVP; limitarse a sesiones y partidas agregadas.

No implementar fingerprinting ni crear un identificador persistente oculto.

### A-06 — Los controles de cuota no pueden prometer bloqueo automático perfecto

**Severidad:** bloqueante de seguridad económica.  
**Documentos:** 11 y 15.

La app puede contar sus propios uploads y reproducciones, pero esos contadores no equivalen necesariamente al consumo completo del proyecto Supabase. Egress y uso de servicios incluyen otras solicitudes, y la disponibilidad de métricas del proveedor puede tener retrasos.

La función Spend Cap documentada por Supabase está disponible en Pro, no en Free; no debe considerarse un mecanismo que el proyecto pueda activar sin costo. El plan Free es de USD 0, pero conserva cuotas y restricciones.

Fuente:
- https://supabase.com/docs/guides/platform/cost-control
- https://supabase.com/docs/guides/platform/billing-on-supabase

**Recomendación:** combinar límites internos conservadores con revisión manual del panel de uso del proveedor. La app debe bloquear operaciones al alcanzar sus propios umbrales, pero la documentación debe aclarar que esto no equivale a un medidor instantáneo de cuota real del proveedor.

## 3. Hallazgos importantes no bloqueantes

### A-07 — Logs y observabilidad de Supabase

El changelog oficial informó que Supabase Logs pasa a precios basados en uso, con periodo de transición durante 2026. No se debe diseñar la operación alrededor de Log Drains, exportaciones o servicios de observabilidad pagos.

Fuente:
- https://supabase.com/changelog/50925-logs-usage-based-pricing

**Recomendación:** logging mínimo, sin Log Drains ni servicios externos. Para el piloto, revisar uso desde el Dashboard y guardar solo eventos de auditoría funcional estrictamente necesarios.

### A-08 — README tiene una línea duplicada

**Severidad:** menor.  
**Documento:** README.

La sección de estado actual repite dos veces el resumen de Seguridad, presupuesto cero, roadmap y pruebas. Debe eliminarse la repetición y ordenar el resumen de documentos 13–15.

### A-09 — Fórmula de CTR mezcla denominadores

**Severidad:** importante para la calidad de datos.  
**Documento:** 14.

La fórmula actual permite dividir clics por impresiones o views compatibles. Son denominadores distintos y no deben agruparse bajo una única métrica.

**Recomendación:**
- CTR de enlace = clics de enlace / impresiones, cuando la plataforma ofrece ambos con definiciones compatibles.
- Clics por 1.000 views = clics / views × 1.000, como indicador separado.
- No comparar entre plataformas sin documentar la definición de view e impresión.

### A-10 — MVP todavía puede interpretarse demasiado grande

**Severidad:** importante para alcance.  
**Documentos:** 06–10 y 15.

La documentación describe seis familias de envases, personajes, muchos escenarios, cámara cinematográfica, partículas, editor multipista, múltiples perfiles y analítica. El roadmap los separa por fases, pero las condiciones de MVP deberían expresarse como una única ruta de producción mínima.

**Recomendación de MVP reducido:**
- Un solo producto: paquete flexible de yerba mate.
- Un único entorno reutilizable.
- Una escena corta con cámara, iluminación y animación básicas.
- Textos y subtítulos en HTML/CSS/SVG.
- Música procedural/SFX simples; sin TTS ni personajes.
- Un solo perfil de exportación validado.
- Guardado privado en Supabase solo si cumple tamaño y cuota.
- Quality Gate humano y Social Package manual.
- Sin publicación por API ni dashboard avanzado.

El resto queda en fases posteriores.

### A-11 — Hosting Cloudflare Pages sigue siendo candidato, no aprobado

**Severidad:** pendiente de decisión.  
**Documentos:** 02 y 15.

La documentación actual de Cloudflare Pages Free publica 500 builds mensuales, hasta 20.000 archivos por sitio y 25 MiB por archivo de sitio. Las funciones de Pages se contabilizan bajo Workers, por lo que no deben añadirse como requisito sin auditar su costo.

Fuente:
- https://developers.cloudflare.com/pages/platform/limits/

**Recomendación:** validar uso comercial, integración con repositorio privado, despliegue estático, dominio `pages.dev` y límites. No almacenar videos en Pages ni incorporar Functions.

## 4. Aspectos coherentes que conviene preservar

- ChatGPT prepara; la app ejecuta paquetes declarativos.
- No existe ni se promete conexión automática con esta conversación.
- No se ejecuta JavaScript arbitrario desde paquetes o Supabase.
- Three.js y el render permanecen en el navegador.
- GitHub contiene código, documentación y schemas; no videos finales.
- Supabase persiste datos y entregables, sujeto a cuotas.
- No se habilita billing, tarjetas, créditos ni planes pagos.
- Voz sintética no está aprobada; el MVP puede funcionar sin voz.
- La publicación es manual y requiere aprobación humana.
- Rights & Legal y Gameplay Accuracy son gates bloqueantes.
- No se filtran respuestas secretas ni desafíos Daily activos.

## 5. Decisiones que debe aprobar el propietario

| ID | Decisión | Propuesta de auditoría |
|---|---|---|
| D-01 | Canales del piloto | TikTok + Instagram Reels + YouTube Shorts |
| D-02 | Navegador inicial de render | Chrome/Edge escritorio Windows |
| D-03 | Límite interno de archivo | Probar techo de 45 MB, sujeto a benchmark |
| D-04 | Persistencia audiovisual | Supabase Free solo para piloto controlado |
| D-05 | Fuente de analytics de gameplay | Juego Ingredora; Content Studio recibe agregados |
| D-06 | Retención | No medir D1/D7 hasta definir identidad legítima |
| D-07 | Alcance del MVP | Una campaña, un envase, una escena, un perfil |
| D-08 | Hosting | Evaluar Cloudflare Pages; no aprobado aún |

## 6. Plan de corrección documental

1. Alinear plataformas de documentos 01 y 13.
2. Actualizar documentos 02, 10, 11 y 15 con límites operativos de archivo/egress y condiciones de pausa/restauración.
3. Aclarar la frontera de analytics entre el juego y Content Studio en 02, 11 y 14.
4. Corregir definiciones y denominadores de KPIs en 14.
5. Reducir el alcance de MVP en 00 y 15, dejando explícito lo que queda fuera.
6. Limpiar README y mantener un único resumen de estado.
7. Tras aprobar lo anterior, crear schemas y contratos de importación/exportación.
8. Ejecutar un prototipo técnico de render y upload antes de construir el editor completo.

## 7. Conclusión

La arquitectura general es razonable, pero el principal riesgo no es Three.js: es la combinación de render en navegador, compatibilidad de codecs y persistencia audiovisual dentro de cuotas gratuitas pequeñas.

La recomendación es aprobar primero las decisiones D-01 a D-08, corregir los documentos afectados y realizar una prueba técnica vertical mínima. Solo si esa prueba funciona a USD 0 tiene sentido avanzar con los schemas y la aplicación.

**Estado de auditoría:** hallazgos documentados; aprobación del propietario pendiente. No se ha implementado código ni se han modificado servicios externos.
