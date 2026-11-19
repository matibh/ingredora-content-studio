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
| 04 — Identidad visual | Sistema de marca y dirección artística | Pendiente |
| 05 — Product Library | Catálogo, fuentes, verificación y derechos | Pendiente |
| 06 — 3D Product Studio | Envases, materiales, texturas y modelos reutilizables | Pendiente |
| 07 — Personajes y animaciones | Personajes, rigging, acciones y biblioteca de movimientos | Pendiente |
| 08 — Cinematic Scene Engine | Escenarios, cámara, iluminación, partículas y composición | Pendiente |
| 09 — Audio y Voice Studio | Música, efectos, voz y mezcla | Pendiente |
| 10 — Editor y Render Engine | Timeline, previsualización, render por escenas y exportación | Pendiente |
| 11 — Supabase y almacenamiento | Datos, Storage, cuotas, RLS y recuperación | Pendiente |
| 12 — Control de calidad | Validaciones automáticas y aprobación | Pendiente |
| 13 — Distribución social | Adaptaciones, metadatos y publicación futura | Pendiente |
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
- GitHub Pages: no se utilizará como hosting de la aplicación en esta etapa.
- GitHub Actions: se habilitará solo para validaciones ligeras y sin habilitar billing.
- Proveedor de hosting web: pendiente de evaluación y verificación de condiciones gratuitas.
- Supabase: arquitectura y proyecto de destino pendientes de definición.

## Próximo paso

Completar la especificación de visión, estrategia, arquitectura y protocolo de producción. Después se definirán los contratos JSON y recién entonces se iniciará el desarrollo.
