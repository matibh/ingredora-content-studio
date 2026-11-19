# 13 — Distribución y publicación social

**Estado:** estrategia y especificación inicial. Requisitos de plataformas consultados el 2026-11-19; verificar nuevamente antes de integrar o publicar.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Definir cómo Ingredora Content Studio prepara, adapta, organiza y distribuye contenido en redes sociales sin romper las restricciones de USD 0, browser-first y aprobación humana.

La fábrica debe producir entregables listos para publicación, con versiones y metadatos por plataforma. La publicación automática no es requisito del MVP.

## 2. Principios

- Producir una pieza master y adaptar únicamente lo necesario para cada canal.
- No publicar sin aprobación humana explícita.
- No depender de APIs pagas, herramientas SaaS de scheduling ni servicios externos de distribución.
- La distribución manual es el camino inicial.
- No automatizar navegadores para simular acciones humanas ni eludir reglas de las plataformas.
- No asumir que una API gratuita permite cualquier uso comercial, interno o automatizado.
- No subir a una plataforma sin consentimiento del titular de la cuenta.
- No incorporar marcas de agua o overlays incompatibles con las reglas del canal.
- Separar el video, el copy, los hashtags, la portada, el CTA y los datos de tracking.
- Registrar plataforma, cuenta, idioma, versión y fecha de publicación.

## 3. Canales prioritarios

### 3.1 TikTok

Canal prioritario para videos verticales cortos y contenido de descubrimiento.

Formato creativo:
- 9:16 como formato principal.
- Hook inmediato.
- Producto reconocible y reveal claro.
- Subtítulos legibles.
- CTA breve a jugar Ingredora.
- Una sola idea por pieza.

**Publicación inicial:** manual desde la aplicación oficial. Exportar el archivo final y el copy correspondiente.

**API:** no incluir Direct Post en el MVP. La documentación de TikTok exige app registrada, aprobación del scope `video.publish`, autorización del usuario y auditoría para quitar la restricción de visibilidad privada. Además, las directrices indican que el producto debe servir a creadores de forma amplia y no ser una herramienta limitada a gestionar las cuentas propias o de un equipo. Esto vuelve incierta su adecuación a una fábrica interna de Ingredora. No asumir que crear una app y conseguir un token habilita publicación pública.  
Fuentes:
- https://developers.tiktok.com/docs/en/content-posting-api-get-started
- https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post
- https://developers.tiktok.com/docs/en/content-sharing-guidelines

**Watermark:** las directrices de TikTok restringen marcas de agua, logos, branding promocional, links y textos promocionales superpuestos no permitidos. Por eso se debe preparar una exportación limpia, sin marca de agua de la fábrica. El branding que forme parte legítima del contenido debe revisarse según la política vigente y no confundirse con un watermark añadido por la herramienta.

### 3.2 Instagram Reels

Canal prioritario para reutilizar piezas verticales, con copy y portada adaptados.

Formato:
- Vertical 9:16.
- Texto dentro de safe zones.
- Portada legible en el grid.
- Copy adaptado al contexto de Instagram.
- CTA y enlace según posibilidades de la cuenta.

**Publicación inicial:** manual.

**API:** no implementar en MVP. Las APIs oficiales están orientadas a cuentas profesionales (Business/Creator), requieren configuración de Meta y permisos; algunos flujos de publicación de Reels requieren que el video esté accesible desde una URL pública para que Meta lo obtenga. Esto no encaja automáticamente con los buckets privados de Supabase y URLs firmadas de corta duración. Antes de considerarlo, habría que verificar el flujo oficial exacto, requisitos de cuenta, permisos, revisión de app y privacidad.  
Fuentes:
- https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-3fe78620-2258-44b6-893f-42d76c7200d7

No hacer público un bucket de Supabase solo para resolver una integración social.

### 3.3 YouTube Shorts

Canal secundario para reutilizar videos verticales y construir una biblioteca de piezas.

Preparación:
- Archivo vertical.
- Título específico y descriptivo.
- Descripción y CTA.
- Miniatura o frame de portada si corresponde.
- Idioma y metadatos.
- Verificar reglas actuales de Shorts y duración permitida al publicar.

**Publicación inicial:** manual desde YouTube Studio.

**API:** la YouTube Data API dispone de cuotas diarias publicadas, con buckets específicos para `videos.insert` y otros métodos. La cuota es un límite técnico, no una garantía de que todo el flujo de integración esté libre de costos o de requisitos de Google Cloud. Se pospone hasta verificar condiciones de proyecto, OAuth, cuotas y billing. No activar billing para obtener cuota adicional.  
Fuentes:
- https://developers.google.com/youtube/data/determine_quota_cost
- https://developers.google.com/youtube/data/getting-started
- https://developers.google.com/youtube/v3/docs/videos/insert

### 3.4 X

Canal opcional para anuncios, clips, novedades y conversación.

**API:** excluida del MVP. La plataforma X presenta precios pay-per-use para operaciones como crear posts y leer recursos. Aunque el importe por operación pueda parecer pequeño, contradice el presupuesto permanente de USD 0. No conectar ni habilitar consumo.  
Fuente oficial:
- https://developer.x.com/

Publicación manual, solo si aporta valor editorial.

## 4. Matriz inicial de distribución

| Canal | Uso inicial | Publicación | Integración API |
|---|---|---|---|
| TikTok | Descubrimiento y desafíos cortos | Manual | No aprobada |
| Instagram Reels | Reutilización y comunidad | Manual | Pospuesta |
| YouTube Shorts | Archivo y descubrimiento | Manual | Pospuesta |
| X | Novedades y conversación | Manual | Excluida por costo |

La matriz es una decisión de alcance del proyecto, no una garantía de aceptación por parte de las plataformas.

## 5. Master y adaptaciones

Cada campaña parte de un master creativo. A partir de él pueden generarse:
- Master ES.
- Master EN.
- Exportación sin watermark.
- Variantes de duración.
- Variantes de hook.
- Portadas por canal.
- Copy por canal.
- Subtítulos y archivo de captions.
- Metadata y tracking.

No generar un video completamente distinto para cada red si una adaptación de formato, duración, subtítulos o CTA es suficiente.

Cada adaptación conserva referencia a la campaña y versión de origen.

## 6. Formatos de exportación social

El perfil inicial preferido:
- 1080 × 1920.
- 9:16.
- 30 FPS.
- Audio estéreo cuando corresponda.
- Subtítulos integrados y/o archivo de captions si el flujo lo soporta.
- Sin watermark de Content Studio.
- Codec y contenedor elegidos entre perfiles probados por el Render Engine.

No asumir que un único archivo sirve para todas las plataformas. Las especificaciones de archivo, duración, bitrate, audio, dimensiones y límites cambian y deben revisarse antes de publicar.

Crear perfiles independientes:
- TikTok vertical.
- Instagram Reels vertical.
- YouTube Shorts vertical.
- Archivo master.

Los perfiles se documentan con fecha de verificación y se versionan.

## 7. Metadata y Social Package

Cada pieza publicada o lista para publicar tendrá un Social Package:
- campaign_id.
- production_id y versión.
- deliverable_id y checksum.
- plataforma destino.
- cuenta destino (referencia, no contraseña).
- idioma.
- título o caption.
- descripción.
- hashtags.
- CTA.
- portada/thumbnail.
- subtítulos.
- enlace de destino.
- UTM parameters cuando correspondan.
- fecha objetivo y zona horaria.
- estado de aprobación.
- checklist específico de plataforma.

La metadata debe estar separada del video para poder corregir copy sin volver a renderizar.

## 8. Copywriting y hashtags

ChatGPT prepara:
- Variantes de caption.
- Hooks y títulos.
- CTA.
- Hashtags relevantes y moderados.
- Adaptaciones ES/EN.
- Descripciones y texto alternativo cuando aplique.

Reglas:
- No usar hashtags irrelevantes solo para perseguir alcance.
- No prometer premios, beneficios o funcionalidades inexistentes.
- No usar afirmaciones falsas de escasez o urgencia.
- No insinuar colaboración con marcas sin autorización.
- No afirmar que un producto patrocina Ingredora.
- No usar claims médicos o nutricionales.
- No incluir respuestas del juego ni información de desafíos activos.
- No publicar links que no hayan sido verificados.

## 9. Calendario editorial y cola de publicación

La app puede ofrecer un calendario interno y una cola editorial sin publicar automáticamente.

Estados:
- Draft.
- Ready for review.
- Approved.
- Scheduled manually.
- Published manually.
- Published via approved integration (futuro).
- Rejected.
- Archived.

Cada ítem incluye canal, fecha objetivo, idioma, entregable y copy.

Una fecha programada dentro del Content Studio es un recordatorio organizativo, no significa que la app vaya a publicar en segundo plano.

No implementar un scheduler remoto que dependa de una Function, cron pago o servicio de terceros.

## 10. Flujo manual de publicación

1. Seleccionar campaña y variante aprobada.
2. Verificar checksum y estado del entregable.
3. Abrir Social Package.
4. Revisar copy, portada, hashtags, link y cuenta destino.
5. Exportar o abrir el archivo guardado.
6. Publicar desde la aplicación oficial de la plataforma.
7. Registrar URL pública de la publicación.
8. Registrar fecha y hora local.
9. Marcar como publicada manualmente.
10. Verificar que el post esté visible y correcto.

La app no debe marcar una pieza como publicada por el solo hecho de haber abierto un enlace externo.

## 11. Integraciones futuras

Una integración solo puede pasar a evaluación si cumple todos estos requisitos:
- API oficial y documentación vigente.
- Uso permitido para el caso concreto.
- Costo total USD 0, sin tarjeta ni billing.
- Cuotas gratuitas suficientes y verificables.
- OAuth y permisos mínimos.
- Gestión segura de tokens.
- Requisitos de revisión/auditoría asumibles.
- Compatibilidad con almacenamiento privado.
- Consentimiento explícito antes de enviar contenido.
- Posibilidad de desactivar la integración sin afectar producción.

Si una condición no se cumple o no puede verificarse, la integración no se implementa.

No utilizar automatización de navegador, scraping, endpoints privados ni herramientas que simulen interacción humana para eludir APIs oficiales.

## 12. Tracking y atribución

Cada pieza puede incluir UTM:
- utm_source: plataforma.
- utm_medium: social.
- utm_campaign: campaign slug.
- utm_content: production/deliverable variant.
- utm_term: opcional y solo si aporta valor.

Los parámetros deben ser consistentes, legibles y sin datos personales.

La medición prioritaria:
- visitas al sitio desde cada canal.
- sesiones iniciadas.
- partidas iniciadas.
- partidas completadas.
- conversión visita → partida.
- retorno y recurrencia cuando el producto tenga datos confiables.

No confundir views o likes con usuarios adquiridos. No atribuir una conversión a una pieza si no existe evidencia de tracking suficiente.

La analítica de plataformas puede requerir APIs, permisos o cuotas; en el MVP se registran manualmente métricas disponibles y relevantes.

## 13. Reutilización y frecuencia

- Adaptar el master en lugar de duplicar producción.
- Evitar publicar el mismo video con watermark de otra plataforma.
- No hacer cross-post ciego: adaptar copy, portada y CTA.
- Mantener consistencia de marca.
- Probar hooks y enfoques sin multiplicar innecesariamente los renders.
- Registrar resultados por campaña y formato.
- No perseguir volumen si compromete calidad o presupuesto.

La cadencia inicial se define en el documento 01 y se ajusta con datos reales.

## 14. Seguridad y cuentas

- Nunca guardar contraseñas de redes sociales.
- No almacenar tokens de acceso en localStorage ni en repositorios.
- Si se implementa OAuth futuro, almacenar tokens solo en backend seguro y con alcance mínimo.
- No exponer tokens ni URLs firmadas en logs.
- Separar cuentas personales y de marca.
- Mantener autorización del titular de la cuenta.
- Revocar permisos cuando se desconecte una integración.
- No publicar en una cuenta distinta a la aprobada.

## 15. Criterios de aceptación

- [ ] Cada producción puede generar Social Packages por plataforma.
- [ ] Copy, hashtags, CTA y portada son independientes del video.
- [ ] Se pueden generar variantes ES/EN.
- [ ] Se puede validar el entregable y su checksum.
- [ ] Se exporta un master limpio sin watermark de la herramienta.
- [ ] Existe checklist específico por canal.
- [ ] La cola editorial no implica publicación automática.
- [ ] Publicación manual registra URL y fecha.
- [ ] UTM no contiene datos personales.
- [ ] No se guardan contraseñas ni tokens en cliente/repositorio.
- [ ] TikTok, Instagram y YouTube permanecen manuales en MVP.
- [ ] X API no se integra por su modelo de cobro.
- [ ] Ninguna integración se activa sin auditoría de costo, permisos y políticas.
- [ ] Toda publicación requiere aprobación humana.

## 16. Fuera del MVP

- Publicación automática.
- Scheduler en segundo plano.
- Gestión de comentarios y mensajes.
- Social listening.
- Compra de anuncios.
- A/B testing automatizado.
- Analytics multi-plataforma por API.
- Integración con agregadores de publicación de terceros.
- Gestión de múltiples clientes o cuentas como SaaS.

## 17. Decisiones pendientes

1. Canales definitivos de lanzamiento y orden de prioridad.
2. Perfiles técnicos de exportación vigentes por canal.
3. Plantillas de Social Package y metadata.
4. Convención final de UTM.
5. Calendario y cadencia de publicación.
6. Proceso de registro manual de métricas.
7. Revisión periódica de políticas de plataformas.
8. Evaluación individual de APIs solo si el presupuesto sigue siendo USD 0.

## 18. Relación con otros documentos

- **01 — Estrategia de contenido:** pilares, mercados, idiomas y cadencia.
- **03 — ChatGPT: producción y protocolo:** briefs, scripts y metadata.
- **04 — Identidad visual:** branding y exportaciones sin watermark.
- **10 — Editor y Render Engine:** perfiles de exportación y entregables.
- **11 — Supabase y almacenamiento:** archivos y metadata.
- **12 — Quality Assurance:** aprobación y checklist de plataforma.
- **14 — Analítica y métricas:** atribución y resultados.

---

**Estado:** especificación inicial. Las APIs y políticas de plataformas cambian. El MVP produce y prepara publicaciones; el usuario publica manualmente. Ninguna integración futura puede introducir cargos, billing o incumplir los términos del canal.
