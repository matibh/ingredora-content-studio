# 02 — Arquitectura general

**Estado:** especificación inicial; decisiones técnicas críticas sujetas a prototipo y pruebas.  
**Fecha de revisión de fuentes:** 2026-11-19.

## 1. Objetivo

Definir los componentes, fronteras, flujos y responsabilidades de Ingredora Content Studio. La arquitectura debe cumplir estas condiciones:

- Presupuesto permanente de USD 0: sin planes, APIs, créditos, infraestructura paga ni cargos por exceso.
- Uso online desde navegador, sin instalaciones locales obligatorias.
- ChatGPT es el único cerebro creativo; la app no incorpora un agente generativo.
- El render audiovisual ocurre en el navegador, no en Supabase Functions ni en servidores pagos.
- Proyectos, recursos y videos finales se guardan en Supabase Storage, dentro de cuotas gratuitas verificadas.
- Código y documentación se versionan en GitHub privado.
- Toda publicación externa requiere aprobación humana.
- Sistema modular, trazable, recuperable y con límites explícitos.

## 2. Decisión arquitectónica principal

Se propone una aplicación web estática con motor de producción cliente y servicios gestionados gratuitos solo para persistencia y autenticación. No será un editor generalista ni un servicio de render remoto: será una herramienta especializada en campañas de Ingredora, con productos, escenas, personajes, plantillas y operaciones audiovisuales reutilizables.

## 3. Componentes lógicos

| Componente | Responsabilidad | Ejecución |
|---|---|---|
| Web App / Workspace | Navegación, campañas, biblioteca, editor y configuración | Navegador |
| Project Manager | Crear, abrir, versionar y validar proyectos | Navegador + Supabase |
| ChatGPT Handoff | Importar/exportar paquetes preparados por ChatGPT | Conversación + GitHub/archivos + navegador |
| Campaign Orchestrator | Organizar escenas, assets, idioma y variantes | Navegador |
| Product Library | Catálogo, referencias, derechos y modelos | Navegador + Supabase |
| 3D Product Studio | Construcción y ajuste programático de packaging | Three.js |
| Character & Motion Library | Personajes estilizados, rigs y acciones | Three.js |
| Environment Library | Sets, fondos, mesas, cocinas, estudios | Three.js |
| Cinematic Scene Engine | Cámara, iluminación, composición, partículas y transiciones | Three.js |
| Timeline Editor | Orden y duración de escenas, textos, audio y overlays | Navegador |
| Audio Engine | Música, efectos, ambientes, voz y mezcla | Web Audio API |
| Render Engine | Render por frame/escena y codificación | Navegador |
| Quality Gate | Validaciones técnicas, editoriales, derechos y seguridad | Navegador |
| Storage Adapter | Subida, lectura, versionado y recuperación | Navegador + Supabase |
| Distribution Preparation | Copys, metadatos y paquetes por plataforma | Navegador; publicación futura |

Son módulos lógicos, no necesariamente microservicios ni paquetes separados desde el primer día. Evitar complejidad prematura.

## 4. Arquitectura de alto nivel

El flujo principal es:

1. ChatGPT prepara brief, guion, storyboard, dirección, escenas, assets y variantes.
2. Los artefactos se versionan en GitHub o se entregan como paquete importable.
3. El usuario importa el paquete al Workspace.
4. Project Manager valida schema, referencias, dependencias y recursos.
5. El editor orquesta bibliotecas 3D, cámara, audio y timeline.
6. Render Engine produce frames y codifica el resultado en el navegador.
7. Quality Gate valida la salida.
8. Storage Adapter sube el video y registra sus metadatos.
9. El usuario revisa y aprueba.
10. La distribución se prepara; la publicación automática queda fuera de la primera fase.

## 5. Stack tecnológico propuesto

| Área | Opción inicial | Estado |
|---|---|---|
| Aplicación | React + TypeScript + Vite | Propuesta |
| 3D | Three.js | Propuesta preferida |
| UI y overlays | React + HTML/CSS + SVG/Canvas | Propuesta |
| Audio | Web Audio API | Propuesta |
| Persistencia | Supabase Postgres | Condicionada a cuotas |
| Archivos y videos | Supabase Storage | Condicionada a cuotas |
| Autenticación | Supabase Auth | A evaluar según uso |
| Código y documentación | GitHub privado | Repositorio creado |
| Hosting frontend | Hosting estático gratuito con uso comercial permitido | Pendiente |
| Codificación/muxing | WebCodecs + Mediabunny cuando sea compatible | A validar |
| Render alternativo | Frames/formato intermedio cuando sea viable | Diseño pendiente |

### 5.1 Frontend

React, TypeScript y Vite son la base propuesta para una SPA. El frontend coordina los módulos de producción.

Requisitos:
- Carga diferida de editor, motor 3D, bibliotecas y render.
- Separar UI, estado de proyecto, escena 3D, audio y codificación.
- No cargar modelos o texturas de campañas que no estén abiertas.
- Mostrar memoria estimada, duración, resolución, FPS y progreso.
- No incluir secretos con privilegios elevados en el cliente.
- Mantener el motor de escenas desacoplado de la interfaz para poder probarlo.

### 5.2 Three.js

Three.js representará packaging, personajes, entornos, cámara, luces y animaciones. Geometría y animaciones se definirán mediante código y parámetros estructurados. Three.js publica licencia MIT; deben conservarse avisos y revisarse licencias de dependencias y assets. Fuente: https://github.com/mrdoob/three.js/blob/dev/LICENSE

### 5.3 Render y codificación

El motor separa dos tareas:

1. Render de imagen: evaluar la escena en un tiempo exacto y producir el frame correspondiente.
2. Codificación/muxing: convertir frames y audio en un archivo de video reproducible.

WebCodecs permite codificar/decodificar a bajo nivel, pero no crea por sí solo un archivo MP4/WebM completo: hace falta empaquetar los fragmentos. Mediabunny ofrece lectura, escritura y muxing en navegador; publica licencia MPL-2.0, que permite uso comercial y software cerrado bajo sus condiciones. Antes de adoptarla, revisar licencia, versión, APIs, codecs y compatibilidad.

Fuentes:
- https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API
- https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection
- https://mediabunny.dev/guide/introduction
- https://mediabunny.dev/

**No se garantiza MP4/H.264/AAC en todos los navegadores.** El soporte depende del navegador, sistema operativo, hardware y codec concreto. MDN documenta diferencias; por ejemplo, AAC encoding tiene brechas en Firefox y Linux desktop.

Por eso:
- Consultar soporte real antes de iniciar render final.
- Probar la configuración concreta del encoder, no solo la existencia de WebCodecs.
- Definir perfiles según capacidad detectada.
- Evaluar WebM/VP9 u Opus como alternativa si está soportada.
- Si no existe una salida aceptable, detener y explicar el motivo.
- Validar reproducción, sincronización y metadatos del archivo final.
- Permitir re-renderizar escenas sin recomponer toda la campaña.

## 6. Fronteras de ejecución

### 6.1 Navegador

Aquí se ejecuta todo lo que consume CPU/GPU para crear la pieza:
- Geometría, materiales y texturas procedurales.
- Escenarios, iluminación, cámaras y animaciones.
- Timeline, títulos, subtítulos y composición.
- Audio procedural, mezcla y sincronización.
- Render por frame/escena, codificación y previsualización.
- Validaciones de calidad.
- Compresión y carga de resultados.

El navegador es el límite de cómputo. No depender de un render server gratuito ni de funciones serverless.

### 6.2 Supabase

Se utiliza como persistencia, no como motor audiovisual:
- Metadatos de campañas y proyectos.
- Estado, versión y relaciones entre escenas.
- Catálogo de productos y procedencia de referencias.
- Índice de assets y renders.
- Archivos de proyecto, previews y videos finales.
- Autenticación y políticas de acceso, si se confirma su necesidad.

No utilizar Edge Functions para render, transcodificación pesada ni tareas que requieran infraestructura paga.

### 6.3 GitHub

El repositorio privado contiene código fuente, documentación, decisiones, schemas futuros, plantillas y presets versionados. No será el almacenamiento principal de videos finales ni assets binarios de campañas.

### 6.4 ChatGPT

ChatGPT prepara investigación, estrategia, briefs, guiones, storyboards, dirección de arte, escenas, código Three.js, textos, subtítulos, copies y metadatos.

La app no puede invocar esta conversación como un servicio automático. La transferencia será explícita mediante artefactos versionados/importados. El documento 03 definirá el protocolo y los formatos.

## 7. Flujos principales

### 7.1 Preparar campaña

1. El usuario define un objetivo o solicita una campaña.
2. ChatGPT investiga y prepara brief, guion, storyboard, variantes, escenas y assets.
3. Se guarda la especificación versionada.
4. El usuario importa el paquete.
5. Project Manager valida estructura, versión del schema, referencias, dependencias y recursos.
6. La campaña queda en borrador o revisión; nunca se publica automáticamente.

### 7.2 Preparar producto 3D

1. Seleccionar o crear ficha del producto.
2. Registrar marca, categoría, envase, colores, medidas aproximadas, referencias y permisos.
3. Definir fidelidad: recreación aproximada o reproducción con material oficial autorizado.
4. Construir modelo parametrizado en Three.js.
5. Revisar forma, proporciones, colores, etiquetas y materiales.
6. Guardar modelo reutilizable y metadatos.
7. Asociarlo a campañas.

### 7.3 Editar y previsualizar

1. Abrir campaña y resolver dependencias.
2. Cargar solo escenas y assets necesarios.
3. Editar duración, orden, cámara, animaciones, texto, subtítulos y audio.
4. Previsualizar a calidad reducida.
5. Ejecutar validaciones rápidas antes del render final.

### 7.4 Renderizar y recuperar

1. Ejecutar test de capacidades y memoria.
2. Seleccionar perfil viable.
3. Renderizar escena por escena y frame por frame con timestamps deterministas.
4. Mantener progreso, checkpoints y estado de cada escena.
5. Codificar y empaquetar el video.
6. Validar reproducción, duración, dimensiones, FPS, audio y tamaño.
7. Subir a Supabase Storage.
8. Confirmar la subida y registrar metadatos antes de marcar como completo.
9. Si falla una escena, reintentarla sin perder las demás.
10. Si se interrumpe el navegador, reanudar desde el último checkpoint válido.

La persistencia de checkpoints y el formato de frames intermedios se definirán en el documento 10.

### 7.5 Preparar publicación

1. Ejecutar Quality Gate.
2. Generar copys, títulos, descripciones, hashtags, subtítulos y enlaces.
3. Preparar variantes por plataforma e idioma.
4. Mostrar preview y checklist.
5. Requerir aprobación explícita.
6. En primera fase, publicación manual. APIs se evaluarán después, solo si son gratuitas, viables y autorizadas.

## 8. Modelo de datos conceptual

Esto no es todavía un contrato JSON ni un esquema SQL. Conceptos previstos:

- Campaign: objetivo, audiencia, idioma, estado, fechas y versiones.
- Production Package: brief, guion, storyboard, configuración y referencias.
- Scene: duración, orden, entorno, cámara, iluminación, acciones, textos, audio y dependencias.
- Product: ficha, envase, marca, colores, fuentes, derechos y fidelidad.
- Asset: archivo, tipo, tamaño, checksum, origen, licencia y ubicación.
- Render Job: configuración, capacidades del navegador, progreso, errores y estado.
- Render Output: archivo final, dimensiones, FPS, duración, codec, idioma y checksum.
- Approval: versión aprobada, responsable y fecha.
- Distribution Package: plataforma, copy, metadatos, CTA, URL y estado.

Los campos, relaciones, enums y reglas se definirán en documentos especializados y schemas posteriores.

## 9. Estados y trazabilidad

Estados iniciales propuestos, sujetos a normalización:

- Campaña: draft, imported, needs_review, ready, rendering, rendered, approved, archived, error.
- Escena: draft, validated, rendering, rendered, error.
- Render: queued, preflight, running, paused, completed, failed, cancelled.
- Publicación: not_prepared, prepared, pending_approval, approved, published, rejected.

Cada render debe guardar conceptualmente:
- ID y versión de campaña.
- Versión del motor y plantillas.
- Versión del schema.
- Escenas y assets usados.
- Configuración de salida.
- Capacidades detectadas del navegador.
- Fecha/hora, resultado, errores y checksum.

## 10. Hosting de la aplicación

La aplicación necesita hosting estático para servir el frontend. GitHub Pages queda descartado como destino previsto para esta herramienta comercial. El repositorio permanece privado.

Cloudflare Pages se puede evaluar como candidato para frontend estático, no como decisión tomada. Su documentación publica límites gratuitos como 500 builds mensuales, 20.000 archivos por sitio y 25 MiB por archivo de sitio. Los límites, términos y condiciones de uso deben comprobarse antes de adoptarlo. Los videos de campaña no se subirán al hosting del frontend.

Fuente: https://developers.cloudflare.com/pages/platform/limits/

Condiciones para aprobar hosting:
- Plan USD 0 real, sin tarjeta ni obligación de activar billing.
- Uso comercial permitido por términos aplicables.
- Deploy desde repositorio privado.
- HTTPS y dominio de plataforma gratuito.
- Límites compatibles.
- Sin funciones server-side pagas requeridas.
- Si se alcanza un límite, detener deploy o reducir uso; nunca aceptar cargos.

No se selecciona proveedor en este documento.

## 11. Límites gratuitos y control de costos

### 11.1 Supabase Free

La página de precios y documentación consultadas el 19/11/2026 indican, entre otros límites, 500 MB de base de datos por proyecto, 1 GB de Storage, límite de 50 MB por archivo, transferencia gratuita acotada y pausa de proyectos por inactividad. La documentación de egress separa tráfico cacheado y no cacheado; los valores pueden cambiar.

Fuentes:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/storage/serving/bandwidth
- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://supabase.com/docs/guides/platform/billing-on-supabase

Implicaciones:
- Storage no alcanza para acumular indefinidamente videos 1080x1920.
- No asumir que un archivo grande puede subirse de una sola vez; probar mecanismo compatible con límites y recuperación.
- Mostrar consumo y espacio estimado antes de renderizar/subir.
- Definir cuotas internas más conservadoras que los topes publicados.
- Definir retención, archivado y borrado aprobado por el usuario.
- Controlar egress generado por previews y reproducciones.
- Detener la carga si no hay espacio suficiente.
- No habilitar un plan pago para superar límites.

### 11.2 GitHub Actions

GitHub Free publica 2.000 minutos mensuales y 500 MB de almacenamiento de artefactos para Actions en repositorios privados. La cuota puede cambiar y debe verificarse antes de habilitar workflows.

Uso previsto: validación liviana de Markdown, enlaces internos y JSON/schema cuando existan. No utilizar Actions para renderizar videos ni almacenar artefactos audiovisuales. No configurar billing ni gastos por exceso.

Fuente: https://docs.github.com/en/billing/concepts/product-billing/github-actions

### 11.3 Política global de presupuesto cero

- No registrar tarjetas ni métodos de pago.
- No activar billing.
- Desactivar mecanismos de sobreconsumo facturable cuando exista esa opción.
- No probar servicios con créditos que luego se conviertan en cargos.
- Mostrar avisos antes de operaciones que consuman almacenamiento o transferencia.
- Si cambian el plan gratuito o los términos, suspender el uso hasta revisar.
- Si una cuota se agota, pausar la función; nunca sustituir automáticamente por un servicio pago.

## 12. Seguridad y derechos

- Claves service_role, secretos administrativos y tokens privados nunca se incluyen en frontend.
- RLS limita cada registro al propietario/usuarios autorizados.
- Buckets privados para proyectos y renders hasta definir qué outputs serán públicos.
- URLs firmadas con expiración y alcance limitado cuando corresponda.
- No guardar respuestas secretas del juego ni datos del Daily activo en proyectos, escenas, prompts públicos, subtítulos o metadatos.
- Paquetes importados se validan como datos; no ejecutar JavaScript arbitrario desde Supabase.
- El motor ejecuta solo componentes y acciones permitidos por schema y catálogo.
- Cada referencia de packaging, logo, fotografía, música, tipografía y modelo registra origen y derechos.
- Modelos recreados de packaging se identifican como recreaciones, no assets oficiales.
- Toda publicación requiere aprobación humana.

## 13. Rendimiento y resiliencia

El render puede ser pesado y la pestaña puede cerrarse, suspenderse o quedarse sin memoria.

Requisitos:
- Preflight de resolución, FPS, duración, frames, tamaño estimado y codecs.
- Preview de baja resolución/calidad.
- Render por escenas con checkpoints.
- Límite de memoria y recursos simultáneos.
- Liberación explícita de geometrías, materiales, texturas, buffers, frames y recursos cuando ya no se usan.
- Carga diferida de assets.
- Posibilidad de cancelar.
- Errores recuperables y mensajes accionables.
- No perder escenas completadas por fallo posterior.
- No marcar éxito sin verificar archivo y metadatos.

## 14. Decisiones abiertas

1. Hosting estático definitivo y confirmación de uso comercial gratuito.
2. Versiones exactas de React, TypeScript, Vite y Three.js.
3. Modelo de autenticación y acceso individual.
4. Buckets, rutas y políticas RLS.
5. Formato canónico de proyecto y versionado de schemas.
6. Formato de intercambio ChatGPT-app.
7. Codecs de salida admitidos por perfil y navegador.
8. Si WebM será formato base y MP4 solo para entornos compatibles.
9. Estrategia de frames intermedios, checkpoints y recuperación.
10. Tamaño objetivo de video y retención bajo 1 GB de Storage.
11. Estrategia de carga de archivos cercanos o superiores a 50 MB.
12. TTS: voz humana grabada, sin voz o motor especializado; decisión pendiente.
13. Capacidades de publicación social realmente gratuitas.
14. Compatibilidad mínima de navegador y hardware.

## 15. Criterios de aceptación

- [ ] Componentes con responsabilidades y fronteras claras.
- [ ] Render definido como tarea del navegador.
- [ ] Supabase limitado a persistencia y servicios ligeros.
- [ ] Intercambio explícito ChatGPT-app, sin falsa integración automática.
- [ ] Videos finales con destino persistente y política de cuota.
- [ ] Detección de codecs y fallback.
- [ ] No depender de GitHub Pages para hosting.
- [ ] Hosting alternativo con términos, plan y límites verificados.
- [ ] Ninguna ruta permite gastos automáticos.
- [ ] Seguridad, RLS, secretos y derechos especificados.
- [ ] Puntos abiertos asignados a prototipos o documentos posteriores.

## 16. Fuentes técnicas consultadas

Consultadas el 19/11/2026. Revisar nuevamente antes de implementar porque planes, límites, versiones y compatibilidad cambian.

- Supabase Pricing: https://supabase.com/pricing
- Supabase Storage Bandwidth: https://supabase.com/docs/guides/storage/serving/bandwidth
- Supabase Egress: https://supabase.com/docs/guides/platform/manage-your-usage/egress
- Supabase Billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Cloudflare Pages Limits: https://developers.cloudflare.com/pages/platform/limits/
- GitHub Actions Billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Three.js License: https://github.com/mrdoob/three.js/blob/dev/LICENSE
- MDN WebCodecs API: https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API
- MDN WebCodecs Codec Selection: https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection
- Mediabunny Introduction: https://mediabunny.dev/guide/introduction
- Mediabunny: https://mediabunny.dev/
