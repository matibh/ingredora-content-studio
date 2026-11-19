# Ingredora Content Studio

**Documentación maestra, visión, arquitectura y especificaciones de la fábrica audiovisual de Ingredora.**

Ingredora Content Studio es el proyecto de una herramienta web para planificar, producir, renderizar, organizar y, en una fase posterior, distribuir contenido audiovisual de Ingredora.

La dirección elegida es una fábrica audiovisual basada en escenas 3D programáticas con Three.js, edición y composición en navegador, proyectos estructurados y almacenamiento controlado. ChatGPT, desde la conversación de trabajo, actúa como director creativo, guionista, diseñador audiovisual y programador de los materiales de cada producción. La aplicación ejecuta proyectos preparados y validados; no incorpora un agente generativo propio ni depende de una API de IA paga.

> **Estado del proyecto: PLANIFICACIÓN.** Este repositorio documenta y especifica el sistema. La implementación de la aplicación no debe comenzar hasta que se aprueben la arquitectura, las decisiones técnicas críticas, los límites gratuitos y el plan de pruebas.

## Principios no negociables

1. **Presupuesto permanente: USD 0.** No contratar planes, APIs, servicios, créditos, almacenamiento ni infraestructura de pago. No habilitar billing. Si una cuota gratuita se agota, detener o posponer la operación.
2. **Uso desde navegador.** La experiencia objetivo es online, sin exigir instalaciones locales de software al usuario.
3. **ChatGPT como único cerebro creativo.** Estrategia, investigación, ideas, guiones, storyboards, dirección, código y adaptación editorial se preparan desde la conversación. No añadir otro modelo generativo para esas tareas.
4. **Sin dependencia de OpenAI API paga.** La aplicación no puede invocar automáticamente esta conversación. El intercambio se realizará mediante proyectos, manifiestos y archivos versionados que ChatGPT prepara y la aplicación consume.
5. **Producción visual propia.** Three.js y código determinista construirán escenarios, objetos, packaging recreado, personajes y animaciones. Las referencias y texturas de productos reales deberán ser legítimas y verificadas.
6. **Datos y secretos protegidos.** Las respuestas de juego, Daily activos, claves y datos privados no deben filtrarse a campañas, assets públicos ni frontend.
7. **Aprobación humana.** Ninguna publicación externa debe ocurrir sin revisión y confirmación humana.
8. **Trazabilidad.** Cada campaña, escena, asset, render y decisión importante debe tener versión, estado y procedencia.

## Documentos

| Documento | Propósito | Estado |
|---|---|---|
| [00 — Visión y alcance](docs/00-vision-y-alcance.md) | Objetivos, principios, límites y definición del producto | Borrador inicial |
| [01 — Estrategia de contenido](docs/01-estrategia-de-contenido.md) | Audiencia, idiomas, pilares, campañas y medición | Borrador inicial |
| [02 — Arquitectura general](docs/02-arquitectura-general.md) | Componentes, flujos, render, almacenamiento, seguridad y límites gratuitos | Borrador inicial |
| [03 — ChatGPT: producción y protocolo](docs/03-chatgpt-produccion-y-protocolo.md) | Paquetes de producción, roles, validación, feedback y versionado | Borrador inicial |
| [04 — Identidad visual](docs/04-identidad-visual.md) | Sistema de marca, packaging, gráfica y dirección artística | Borrador inicial |
| [05 — Product Library](docs/05-product-library.md) | Catálogo, fuentes, verificación, packaging y derechos | Borrador inicial |
| [06 — 3D Product Studio](docs/06-3d-product-studio.md) | Envases paramétricos, materiales, texturas y modelos 3D | Borrador inicial |
| [07 — Personajes y animaciones](docs/07-personajes-y-animaciones.md) | Personajes estilizados, rigs, expresiones e interacciones | Borrador inicial |
| [08 — Cinematic Scene Engine](docs/08-cinematic-scene-engine.md) | Escenarios, cámara, iluminación, partículas y composición | Borrador inicial |
| [09 — Audio y Voice Studio](docs/09-audio-y-voice-studio.md) | Música procedural, SFX, ambientes, voz, mezcla y sincronización | Borrador inicial |
| [10 — Editor y Render Engine](docs/10-editor-y-render-engine.md) | Timeline, previsualización, render por escenas y exportación | Borrador inicial |
| [11 — Supabase y almacenamiento](docs/11-supabase-y-almacenamiento.md) | Datos, Storage, cuotas, RLS y recuperación | Borrador inicial |
| [12 — Quality Assurance y Content Quality Gate](docs/12-quality-assurance-y-content-quality-gate.md) | Validaciones, derechos, veracidad y aprobación | Borrador inicial |
| [13 — Distribución y publicación social](docs/13-distribucion-y-publicacion-social.md) | Adaptaciones, metadatos, publicación manual e integraciones | Borrador inicial |
| 14 — Seguridad y presupuesto cero | Límites de gasto, secretos, licencias y operación segura | Pendiente |
| 15 — Roadmap y pruebas | Fases, hitos, criterios de aceptación y piloto | Pendiente |

## Estructura prevista

```text
.
├── README.md
├── CHANGELOG.md
├── docs/
├── schemas/
└── .github/
    └── workflows/
```

Los esquemas JSON se incorporarán cuando el modelo conceptual esté suficientemente definido. No se deben inventar contratos de datos antes de acordar los campos, estados, relaciones y reglas de validación.

## Cómo se gobierna la documentación

- Los documentos en `docs/` son la fuente de verdad funcional y técnica.
- Las decisiones pendientes se identifican explícitamente; no se presentan como hechos cerrados.
- Los cambios que afecten a varios módulos deben actualizar todos los documentos relacionados.
- Los cambios importantes deben registrarse en `CHANGELOG.md`.
- Las especificaciones deben incluir objetivo, alcance, comportamiento esperado, errores, seguridad, dependencias, restricciones de costo y criterios de aceptación.
- No se agregan dependencias, servicios o modelos sin evaluar licencia, compatibilidad con navegador, cuota gratuita y riesgo de costo.
- Los documentos no deben contener secretos, tokens, credenciales ni datos personales innecesarios.

## Estado actual

- Repositorio privado: confirmado.
- Rama principal: `main`.
- Aplicación: todavía no implementada.
- Arquitectura general: especificación inicial incorporada; hosting, codecs y límites operativos siguen sujetos a pruebas.
- Protocolo ChatGPT-app: especificación inicial incorporada; schemas y mecanismo de importación quedan pendientes.
- Identidad visual: sistema inicial de capas, dirección de arte 3D, composición y tokens; assets oficiales y decisiones de marca pendientes.
- Product Library: modelo conceptual de productos, marcas, variantes, fuentes, assets, derechos, fidelidad 3D y versionado incorporado.
- 3D Product Studio: familias de envases, geometría paramétrica, materiales, UVs, animaciones, revisión y rendimiento especificados.
- Personajes y animaciones: sistema modular de personajes estilizados, rigs, expresiones, acciones, agarres de producto y timeline especificado.
- Cinematic Scene Engine: entornos, dirección de cámara e iluminación, timeline, partículas, transiciones, overlays, composición narrativa y render determinista especificados.
- Audio y Voice Studio: música procedural, SFX, ambientes, pistas de voz opcionales, mezcla, sincronización, metadatos y restricciones de derechos especificados; voz sintética aún no aprobada.
- Editor y Render Engine: workspace de campañas, importación de paquetes, editor de escenas/timeline, preview, render determinista, cola, recuperación y almacenamiento de entregables especificados.
- Supabase y almacenamiento: modelo lógico de datos, buckets privados, RLS, cuotas Free, egress, límites de archivos, retención, recuperación y controles para impedir cargos.
- Quality Assurance y Content Quality Gate: gates desde brief hasta publicación, severidad de hallazgos, veracidad, precisión de producto, derechos, localización, calidad audiovisual, privacidad y aprobación humana.
- Distribución y publicación social: Social Packages por canal, variantes, copy, UTM, flujo manual y evaluación de APIs bajo la regla USD 0.
- GitHub Pages: no se utilizará como hosting de la aplicación en esta etapa.
- GitHub Actions: se habilitará solo para validaciones ligeras y sin habilitar billing.
- Proveedor de hosting web: pendiente de evaluación y verificación de condiciones gratuitas.
- Supabase: arquitectura y proyecto de destino pendientes de definición.

## Próximo paso

Completar la especificación de visión, estrategia, arquitectura y protocolo de producción. Después se definirán los contratos JSON y recién entonces se iniciará el desarrollo.
