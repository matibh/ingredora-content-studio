# 08 — Cinematic Scene Engine

**Estado:** especificación funcional inicial. Arquitectura interna, presets visuales y límites de rendimiento sujetos a prototipo.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Definir el motor que compone escenas audiovisuales de Ingredora a partir de personajes, productos, props, entornos, cámaras, iluminación, animaciones, partículas, gráficos y audio.

El Scene Engine transforma elementos reutilizables en planos con intención narrativa. No debe limitarse a mostrar un producto girando: debe permitir construir secuencias con presentación, descubrimiento, tensión, interacción, reveal y cierre.

El motor será ejecutado en el navegador y deberá poder renderizar cualquier frame solicitado de forma reproducible.

## 2. Principios no negociables

- **USD 0:** sin servicios de render pagos, APIs con facturación, assets de pago obligatorios ni fallback que pueda generar cargos.
- **Browser-first:** escena, preview, edición y render se ejecutan en navegador.
- **Three.js:** base 3D prevista; UI y overlays con HTML/CSS/SVG/Canvas.
- **Composición modular:** escenas construidas con componentes registrados y parámetros validados.
- **Determinismo:** cámaras, animaciones, luces, partículas y transiciones deben evaluarse a un tiempo absoluto.
- **Narrativa:** cada plano debe tener objetivo, sujeto, acción y punto de atención.
- **Reutilización:** entornos, rigs, cámaras, luces, materiales y transiciones se guardan como presets versionados.
- **Rendimiento medido:** límites reales por navegador y dispositivo; no asumir capacidad ilimitada.
- **Seguridad:** no ejecutar scripts arbitrarios importados desde paquetes o base de datos.
- **Trazabilidad:** cada escena fija versiones de sus dependencias para reproducir el render.

## 3. Modelo conceptual de escena

Una escena es una unidad temporal y visual dentro de una producción. Contiene:

- Identidad y versión.
- Duración y frame rate de proyecto.
- Objetivo narrativo.
- Entorno y configuración espacial.
- Objetos, productos, personajes y props.
- Cámara o secuencia de cámaras.
- Iluminación y ambiente.
- Animaciones y eventos.
- Partículas y efectos.
- Elementos gráficos y textos.
- Audio asociado.
- Transición de entrada y salida.
- Reglas de calidad y dependencias.

Una producción se compone de una o más escenas. Cada escena puede contener varios planos, pero el MVP puede comenzar con una cámara principal por escena y cortes explícitos entre planos.

## 4. Entornos y Environment Library

### 4.1 Entornos iniciales

La biblioteca debe contemplar presets reutilizables, priorizando los que sirven a campañas de productos:

- Estudio de marca.
- Mesa de presentación.
- Cocina doméstica estilizada.
- Cocina/estudio gastronómico.
- Superficie macro para packaging.
- Fondo de color o gradiente.
- Escenario de concurso/desafío.
- Supermercado estilizado.
- Mesa de ingredientes.
- Set abstracto para reveal.

Cada entorno incluye geometría, materiales, iluminación base, posiciones sugeridas de cámara, puntos de apoyo para objetos y límites de composición.

### 4.2 Construcción

Los entornos se crearán con geometría procedural y componentes del motor. Los assets externos solo se incorporarán si su licencia permite uso comercial y están documentados.

Los entornos deberán:
- Tener variantes de color y material.
- Permitir reemplazar superficies y props.
- Definir escala coherente.
- Evitar fondos visualmente ruidosos.
- Mantener el producto como foco cuando el objetivo lo requiera.
- Ofrecer versiones simplificadas para preview y dispositivos limitados.

### 4.3 Anchors espaciales

Los presets pueden definir anchors con ID estable:
- Product placement.
- Character placement.
- Camera target.
- Table/surface contact.
- Prop placement.
- Light placement.
- Graphic safe area reference.

Los anchors permiten reemplazar un producto o personaje sin reconstruir la composición completa.

## 5. Camera Director

### 5.1 Objetivo

El Camera Director permite dirigir la atención y construir lenguaje cinematográfico mediante movimientos y encuadres controlados. Cada movimiento debe tener una motivación narrativa.

### 5.2 Tipos de cámara y planos

- Wide / establishing: presenta el entorno.
- Medium: personaje y acción.
- Close-up: rostro o interacción.
- Macro: textura, etiqueta y detalle de packaging.
- Top-down: mesa, ingredientes y composición cenital.
- Low/high angle: variar percepción y jerarquía.
- Over-the-shoulder: punto de vista de personaje.
- Product hero: producto como sujeto principal.

### 5.3 Movimientos

- Static hold.
- Dolly in/out.
- Truck left/right.
- Pan y tilt.
- Orbit controlado.
- Zoom óptico simulado mediante focal, evitando sustituir todos los movimientos por zoom digital.
- Tracking de personaje/objeto.
- Rack focus simulado si el pipeline de postprocesado lo permite.
- Crane up/down.
- Reveal desde o detrás de un elemento.
- Handheld estilizado solo como recurso intencional.

Cada movimiento se define con estado inicial/final, duración, curva de easing, target y límites. Debe evitar movimientos bruscos, clipping, atravesar geometría y perder el sujeto.

### 5.4 Parámetros de cámara

- Position y target.
- Focal length / field of view.
- Near/far planes.
- Depth of field si está habilitado.
- Aperture/focus distance simulados.
- Path o keyframes.
- Easing.
- Límites de desplazamiento.
- Safe framing y formato final.

La cámara debe considerar el recorte 9:16 y las safe zones de plataformas. Una composición 16:9 no se debe recortar automáticamente y asumir que sigue siendo válida.

## 6. Lighting Director

### 6.1 Objetivo

Crear iluminación coherente, legible y reproducible con un coste gráfico razonable.

### 6.2 Esquemas base

- Key + fill + rim.
- Soft studio.
- High-key limpio.
- Low-key dramático.
- Luz cálida de cocina.
- Luz fría de estudio.
- Contraluz de reveal.
- Luz macro para materiales.
- Ambiente natural estilizado.

Los presets son puntos de partida, no reglas rígidas. Deben integrarse con la identidad visual del documento 04.

### 6.3 Controles

- Intensidad y color.
- Posición, orientación y alcance.
- Tamaño aparente cuando la técnica lo soporte.
- Sombras habilitadas/deshabilitadas.
- Ambient/fill.
- Fog y color de fondo.
- Exposición y tone mapping del renderer.

No depender de múltiples sombras dinámicas costosas. Evaluar luces baked/procedurales o soluciones simplificadas para entornos estáticos.

## 7. Animation Timeline

La timeline coordina:
- Transformaciones de objetos.
- Clips de personajes.
- Animaciones de producto.
- Movimiento de cámara.
- Intensidad/color de luces.
- Partículas.
- Elementos gráficos.
- Transiciones.
- Marcadores de audio.

Cada track debe tener IDs estables, versión, start time, duración, parámetros, easing y política de mezcla. Las dependencias entre tracks deben ser explícitas.

### 7.1 Tiempo determinista

El motor debe evaluar el estado completo en función de un tiempo absoluto `t` y no depender de que se hayan reproducido todos los frames anteriores.

Para un frame `n` a FPS `f`:

`t = n / f`

Las funciones de animación, cámara y efectos deben devolver el mismo estado para el mismo timestamp, paquete y versión del engine.

### 7.2 Eventos

Los eventos de timeline pueden activar:
- Contacto mano-producto.
- Cambio de expresión.
- Inicio de partículas.
- Reveal de texto.
- Sonido.
- Cambio de cámara.
- Transición.

Los eventos deben estar versionados y ser idempotentes al evaluar un frame. No deben ejecutar acciones acumulativas cada vez que se solicita el mismo timestamp.

## 8. Particle System

### 8.1 Usos

- Confeti de celebración.
- Polvo o motas ambientales.
- Destellos de reveal.
- Burbujas o partículas estilizadas.
- Migas o pequeños elementos de ingredientes cuando el concepto lo justifique.
- Líneas de movimiento y acentos gráficos.

### 8.2 Requisitos

- Sistemas basados en seed fija.
- Estado calculable desde tiempo absoluto.
- Límites de cantidad y vida.
- Presets reutilizables.
- Emisión y desaparición parametrizadas.
- Control de profundidad y clipping.
- Opción de desactivar en preview de baja calidad.

No usar partículas para decorar sin función narrativa. Evitar simulaciones físicas complejas como dependencia del MVP.

## 9. Transition System

Transiciones iniciales:
- Cut.
- Fade in/out.
- Dissolve.
- Wipe gráfico.
- Match cut preparado por composición.
- Whip pan simulado.
- Reveal por máscara.
- Transición mediante objeto/packaging en primer plano.

Las transiciones deben respetar duración, safe zones, continuidad de movimiento y legibilidad. Deben existir presets cortos y sobrios; no aplicar efectos llamativos a cada corte.

Una transición puede pertenecer a la escena saliente, entrante o a una pista global, pero su propiedad debe ser inequívoca para evitar doble duración o frames duplicados.

## 10. Postprocesado y acabado

Efectos potenciales:
- Tone mapping y color grading.
- Bloom moderado.
- Depth of field.
- Vignette.
- Antialiasing.
- Motion blur simulado, si su coste es aceptable.
- Grain sutil, solo si coincide con el estilo.

El postprocesado será opcional por preset y dispositivo. Cada efecto debe poder desactivarse individualmente. No se asumirá que todos los navegadores o GPUs soportan la misma cadena.

El MVP prioriza composición, iluminación, materiales y cámara antes que una cadena de postprocesado costosa.

## 11. Elementos 2D y overlays

Los elementos de UI y comunicación se compondrán preferentemente con HTML/CSS/SVG/Canvas por encima del render 3D:
- Títulos y titulares.
- Subtítulos.
- Labels y contadores.
- CTA.
- Logos autorizados.
- Marcos y acentos gráficos.
- Indicadores de tiempo o progreso.

Los overlays deben:
- Respetar safe zones y contraste.
- Mantener tipografía legible en móvil.
- Poder localizarse a ES/EN.
- Tener tiempos de entrada/salida definidos.
- Evitar tapar etiqueta o información relevante del producto.
- Mantener separación entre contenido editorial y datos de juego privados.

## 12. Composición y dirección narrativa

Cada escena debe declarar:
1. Qué debe entender el espectador.
2. Qué sujeto domina el plano.
3. Qué acción sucede.
4. Dónde mira el espectador.
5. Qué información aparece y cuándo.
6. Cómo se conecta con la escena siguiente.

Estructura narrativa orientativa para piezas cortas:
- Hook visual o pregunta.
- Presentación del producto o contexto.
- Acción/desafío.
- Reveal o resultado verificable.
- CTA.

No todas las piezas necesitan las cinco etapas. El ritmo y la duración se ajustan al concepto, no a una plantilla rígida.

## 13. Preview, calidad y render

El Scene Engine debe soportar:
- Preview interactivo en viewport.
- Preview en tiempo real o reducido.
- Render de frame individual.
- Render de rango de frames.
- Render de escena completa.
- Re-render de escena sin volver a producir las demás.
- Presets de calidad.
- Captura de errores y recuperación.

El preview puede reducir resolución, sombras, partículas y postprocesado, pero debe advertir cuando la imagen no representa exactamente la calidad final.

El motor no debe iniciar render final si faltan assets, versiones, fuentes, derechos o componentes requeridos.

## 14. Integración y contratos

El Scene Engine consume referencias versionadas de:
- Product Library y 3D Product Studio (docs 05 y 06).
- Personajes y animaciones (doc 07).
- Tokens de identidad visual (doc 04).
- Audio y voz (doc 09).
- Timeline/editor (doc 10).

Los paquetes de producción deben describir componentes registrados y parámetros permitidos. No se permite ejecutar JavaScript arbitrario desde Supabase, archivos de campaña o imports desconocidos.

Los contratos exactos y schemas JSON se definirán después de completar las especificaciones de módulos y relaciones.

## 15. Rendimiento y límites

- Instancing para geometría repetida.
- Compartir materiales y recursos.
- Culling por cámara.
- LOD y simplificación cuando proceda.
- Limitar transparencias y overdraw.
- Control de sombras y postprocesado.
- Carga bajo demanda de entornos y assets.
- Liberación de GPU resources al cambiar de escena.
- Presets de preview y render.
- Medición en dispositivos reales.

Se registrarán al menos tiempo de carga, FPS de preview, tiempo de render por frame, memoria y fallos de contexto WebGL. No se fijan límites universales sin benchmark.

Si el navegador pierde el contexto gráfico o el dispositivo no puede sostener la escena, se debe informar, preservar el estado y permitir reducir calidad o reintentar. Nunca cambiar a un servicio remoto pago.

## 16. Seguridad, derechos y veracidad

- Registrar origen y licencia de assets externos.
- No usar logos, fotografías, packaging o música sin permisos adecuados.
- No presentar recreaciones como assets oficiales.
- No inventar información del producto.
- No incluir respuestas secretas, Daily activo ni información privada del juego.
- No cargar scripts ejecutables desde datos de campaña.
- Validar referencias y parámetros antes de instanciar componentes.
- La aprobación humana sigue siendo obligatoria.

## 17. Criterios de aceptación

- [ ] Una escena puede combinar entorno, producto y personaje.
- [ ] Un preset de entorno puede reutilizarse con distintos productos.
- [ ] La cámara soporta encuadres verticales y movimientos keyframe.
- [ ] Iluminación configurable con presets versionados.
- [ ] La timeline controla cámara, objetos, personajes, overlays y efectos.
- [ ] Las partículas son deterministas y tienen límites.
- [ ] Las transiciones tienen duración y ownership inequívocos.
- [ ] El render puede solicitar frames arbitrarios sin reproducir desde cero.
- [ ] Una escena puede re-renderizarse de forma aislada.
- [ ] Preview y render final tienen perfiles diferenciados.
- [ ] Las dependencias y derechos se validan antes del render.
- [ ] La misma versión produce el mismo resultado temporal.
- [ ] El funcionamiento se valida en dispositivos objetivo sin servicios pagos.

## 18. Fuera del MVP

- Simulación física generalista.
- Destrucción de escenarios.
- Multitudes complejas.
- Ray tracing obligatorio.
- Volumetría costosa.
- Motion capture.
- Editor 3D de propósito general.
- Render distribuido remoto.
- Efectos avanzados que no funcionen de forma consistente en navegador.

## 19. Decisiones pendientes

1. Estructura exacta de escena, plano y timeline.
2. Catálogo de entornos prioritarios para el piloto.
3. Presets de cámara e iluminación aprobados.
4. Estrategia de sombras y postprocesado por dispositivo.
5. Sistema de partículas determinista.
6. Formato de assets y serialización.
7. Límites cuantitativos tras benchmarks.
8. Política de render de frames y recuperación.
9. Relación entre tracks de audio y timeline audiovisual.

## 20. Relación con otros documentos

- **04 — Identidad visual:** estilo, composición, color y dirección de arte.
- **05 — Product Library:** datos y derechos de productos.
- **06 — 3D Product Studio:** geometría y materiales de packaging.
- **07 — Personajes y animaciones:** rigs, expresiones y acciones.
- **09 — Audio y Voice Studio:** música, voz, efectos y mezcla.
- **10 — Editor y Render Engine:** interfaz de timeline, preview y exportación.
- **12 — Control de calidad:** validaciones de escena y entregables.
- **03 — Protocolo ChatGPT:** paquetes de producción y componentes permitidos.

---

**Estado:** especificación inicial. No representa implementación terminada ni presets visuales aprobados. Los límites de rendimiento y las decisiones técnicas abiertas requieren prototipos en navegador.
