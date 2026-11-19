# 15 — Seguridad, presupuesto cero, roadmap y pruebas

**Estado:** documento de cierre de especificaciones y plan de ejecución.  
**Última actualización:** 2026-11-19.  
**Regla de aprobación:** ninguna fase puede introducir costos, exposición de datos, dependencia técnica no aprobada o funcionalidades que no hayan superado sus pruebas.

## 1. Propósito

Este documento consolida las reglas transversales de seguridad, licencias, control de costos, operación y calidad, y define un roadmap incremental para construir Ingredora Content Studio.

El proyecto permanece en **PLANIFICACIÓN** hasta que se revisen los documentos 00–14, se resuelvan las decisiones bloqueantes y se aprueben los contratos de datos.

## 2. Reglas no negociables

1. **USD 0 permanente.** Sin planes pagos, créditos, suscripciones, billing, tarjetas ni cargos por exceso.
2. **Detener antes de exceder.** Si una cuota, límite o condición gratuita es insuficiente, se pausa la función; nunca se escala automáticamente a un plan pago.
3. **Navegador como entorno de uso.** No exigir al usuario instalar servidores, modelos locales, herramientas de render ni software auxiliar.
4. **ChatGPT como único cerebro creativo.** La aplicación ejecuta Production Packages preparados; no llama a una API de IA paga ni simula una conexión autónoma con esta conversación.
5. **Render en navegador.** No render remoto, workers pagos ni Supabase Functions para procesar video.
6. **Aprobación humana.** Ninguna publicación externa se realiza sin revisión y confirmación.
7. **Privacidad por defecto.** Minimizar datos, proteger secretos y limitar accesos.
8. **Derechos verificables.** No usar assets, música, voces, marcas o packaging reproducido sin base legítima para el uso previsto.
9. **Versionado y trazabilidad.** Código, schemas, paquetes, assets, renders y aprobaciones deben poder relacionarse.
10. **No prometer disponibilidad gratuita ilimitada.** Los planes gratuitos tienen cuotas, restricciones, pausas y cambios de condiciones.

## 3. Política de presupuesto cero

### 3.1 Qué significa USD 0

El costo monetario incremental permitido para operar y desarrollar la fábrica es cero. Esto incluye:
- Hosting.
- Base de datos y almacenamiento.
- Transferencia de datos.
- Render y codificación.
- APIs y servicios externos.
- Modelos generativos y TTS.
- Distribución y scheduling.
- CI/CD y runners.
- Fuentes, música, efectos y assets.
- Dominios nuevos, certificados o add-ons pagos.
- Herramientas de monitoreo y analytics.

El tiempo de trabajo y los límites gratuitos de herramientas ya disponibles no son una autorización para incurrir en cargos.

### 3.2 Política de proveedores

Cada proveedor debe tener una ficha antes de integrarse:
- Servicio y propósito.
- URL oficial de precios y límites.
- Plan exacto utilizado.
- Cuotas incluidas y cómo se calculan.
- Qué ocurre al alcanzar cada límite.
- Si requiere tarjeta, billing o método de pago.
- Riesgo de consumo inesperado.
- Restricciones comerciales y de uso.
- Fecha de verificación.
- Responsable de revisar cambios.
- Decisión: aprobado, condicionado o rechazado.

**Aprobado** significa que el flujo concreto puede operar a USD 0, no que el proveedor sea gratuito en todos sus productos.

### 3.3 Revalidación de cuotas

Revisar límites:
- Antes de seleccionar un proveedor.
- Antes de desplegar producción.
- Antes de habilitar una nueva función.
- Mensualmente durante el piloto.
- Ante cualquier aviso de cambio de plan, precio o política.

Las cifras que aparezcan en otros documentos son referencias fechadas, no garantías contractuales.

### 3.4 Supabase

Supabase Free es candidato, no garantía de operación continua. La documentación consultada el 19/11/2026 indica límites de cuota y pausa por inactividad; los excesos y restricciones deben revisarse en la documentación vigente. Un proyecto Free puede pausarse tras siete días con actividad insuficiente. No contratar Pro para evitar la pausa. Si se pausa, se acepta la interrupción y se restaura manualmente cuando corresponda.

Fuentes oficiales:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/platform/cost-control

### 3.5 GitHub y CI

El repositorio privado es la fuente de verdad del código y documentación. GitHub Actions no debe ejecutar tareas pesadas ni renders.

En repositorios privados, Actions puede consumir la cuota incluida del plan y el uso elegible que exceda esa cuota puede generar cargos. Por lo tanto:
- Mantener workflows mínimos.
- No ejecutar Actions en cada cambio si no es necesario.
- No guardar artefactos de video.
- No habilitar billing ni comprar minutos.
- Revisar límites de cuenta y detener workflows antes de agotar el uso incluido.
- Si no se puede garantizar que un workflow no genere cargos, deshabilitarlo.

Fuentes oficiales:
- https://docs.github.com/en/actions/concepts/billing-and-usage
- https://docs.github.com/en/billing/concepts/product-billing/github-actions

### 3.6 Hosting

Cloudflare Pages es candidato a evaluar, no una decisión aprobada. Los límites de Pages Free no deben extrapolarse a Workers, Functions, R2, Images u otros productos que puedan tener facturación separada.

No habilitar:
- Workers pagos o consumo que pueda generar cargos.
- R2 u otros productos de almacenamiento sin auditoría de precio y límites.
- Custom domains de pago.
- Add-ons o planes superiores.

Mientras no se valide el proveedor, no se declara elegido el hosting. El subdominio gratuito del proveedor es preferible a comprar un dominio nuevo si el presupuesto debe seguir en USD 0.

Fuente oficial de límites Pages:
- https://developers.cloudflare.com/pages/platform/limits/

### 3.7 Kill switches de costo

La aplicación debe poder desactivar de forma independiente:
- Uploads nuevos.
- Renders nuevos.
- Exportaciones pesadas.
- Descargas y reproducciones de entregables.
- Ingesta de eventos analytics.
- Integraciones sociales.
- Cualquier API externa.

Los límites se controlan antes de iniciar una operación, no después de superar la cuota. Si no se puede conocer el consumo en tiempo real, utilizar límites conservadores y detener preventivamente.

## 4. Seguridad de aplicación

### 4.1 Autenticación y autorización

- Usar Supabase Auth solo si el caso de uso necesita cuentas.
- Aplicar principio de mínimo privilegio.
- Todas las tablas expuestas deben tener RLS.
- Verificar ownership en cada lectura y mutación.
- No confiar en IDs enviados por el cliente como prueba de autorización.
- Las operaciones administrativas deben ser explícitas y restringidas.
- No incluir secretos en frontend, bundles, repositorio ni logs.

### 4.2 Secretos

- Nunca incluir `service_role`, claves privadas, tokens OAuth ni credenciales en el cliente.
- No guardar secretos en archivos versionados.
- Usar variables de entorno seguras del proveedor solo si la función que las necesita está aprobada y opera a USD 0.
- No guardar tokens sociales en localStorage.
- No mostrar tokens, headers de autorización o URLs firmadas completas en logs.
- Revocar credenciales expuestas y documentar el incidente.
- La anon/publishable key de Supabase no reemplaza RLS ni es un secreto de autorización.

### 4.3 Production Packages y código ejecutable

- Los paquetes importados son datos no confiables hasta validarlos.
- JSON Schema valida estructura, tipos, enumeraciones, rangos y referencias.
- Limitar tamaños, cantidad de escenas, duración, assets y parámetros.
- Resolver componentes mediante un registro interno versionado.
- No ejecutar JavaScript arbitrario recibido desde Supabase, Storage o un paquete importado.
- No usar `eval`, `Function`, scripts remotos dinámicos ni imports arbitrarios.
- El código nuevo del motor entra por GitHub, revisión y pruebas; no por datos de campaña.
- Validar rutas y URLs de assets, bloquear esquemas no permitidos y evitar traversal.

### 4.4 Storage y archivos

- Buckets privados por defecto.
- Políticas RLS de Storage alineadas con ownership.
- URLs firmadas de corta duración cuando sea necesario.
- Verificar MIME real, extensión, tamaño y checksum.
- Rechazar archivos no esperados.
- No confiar solo en el Content-Type enviado por el navegador.
- Evitar nombres de archivo con datos personales.
- Limpiar temporales y objetos huérfanos mediante un proceso revisado.
- No borrar entregables aprobados automáticamente.
- Nunca publicar un bucket privado para resolver una integración social.

### 4.5 Frontend y navegador

- Política CSP restrictiva cuando el hosting lo permita.
- Evitar scripts de terceros innecesarios.
- Dependencias fijadas por versión y lockfile.
- Sanitizar texto importado antes de renderizarlo como HTML.
- No insertar contenido no confiable mediante `innerHTML`.
- Validar mensajes y datos entre módulos.
- Proteger rutas y acciones sensibles.
- No exponer información de otros proyectos o usuarios.
- No permitir que un paquete modifique configuración global del navegador.

### 4.6 Datos de Ingredora

- Nunca exportar respuestas secretas, solución de Daily, contenido interno de desafíos activos, credenciales ni información privada del juego.
- Usar únicamente gameplay, capturas y datos autorizados.
- Los eventos de analytics deben respetar el Documento 14.
- No copiar datos reales de usuarios a paquetes creativos.
- Los ejemplos de documentación deben usar datos ficticios o públicos y verificables.

## 5. Seguridad operativa y respuesta a incidentes

Ante una filtración, acceso indebido, costo inesperado o publicación incorrecta:
1. Detener la función afectada.
2. Revocar tokens o credenciales comprometidos.
3. Restringir accesos y URLs públicas.
4. Preservar evidencia técnica necesaria sin ampliar datos personales.
5. Identificar alcance y periodo.
6. Corregir causa raíz.
7. Verificar que no persista exposición.
8. Evaluar obligaciones de notificación y derechos de titulares.
9. Registrar incidente, impacto y acciones preventivas.
10. Rehabilitar solo tras pruebas y aprobación.

Incidentes que disparan parada inmediata:
- Cargo o intento de billing.
- Exposición de secretos.
- Exposición de respuestas o Daily activo.
- Publicación sin aprobación.
- Asset sin derechos claros.
- Acceso entre usuarios o proyectos.
- Corrupción de entregables o pérdida no recuperable.

## 6. Licencias y propiedad intelectual

Antes de incorporar una dependencia o asset, registrar:
- Nombre y versión.
- URL de origen.
- Licencia exacta.
- Copyright/atribución requerida.
- Restricciones comerciales.
- Restricciones de redistribución y modificación.
- Dependencias transitivas relevantes.
- Fecha de revisión.

Reglas:
- Preferir licencias permisivas compatibles con uso comercial.
- Conservar avisos y textos de licencia.
- No asumir que “gratis” significa libre de derechos.
- No copiar logos, fotos, packagings, personajes, música o voces sin autorización.
- Las marcas y productos reales se representan solo con fuentes y derechos documentados.
- Las recreaciones visuales deben identificarse como aproximadas cuando corresponda.
- Las licencias de fuentes, tipografías, música y assets deben verificarse por separado.
- No usar material extraído de redes sociales como asset por el mero hecho de ser público.

Three.js publica su código bajo licencia MIT; conservar los avisos correspondientes y revisar cada dependencia adicional por separado:
- https://github.com/mrdoob/three.js/blob/dev/LICENSE

La licencia de una biblioteca no otorga derechos sobre marcas, fotografías, música ni contenido de terceros utilizado dentro de una producción.

## 7. Dependencias y cadena de suministro

- Mantener lockfile versionado.
- Evitar dependencias innecesarias.
- Revisar mantenimiento, licencia y vulnerabilidades conocidas.
- Fijar versiones en producción.
- Actualizar de forma controlada, no automáticamente sin pruebas.
- Revisar scripts de instalación y dependencias transitivas.
- No incluir paquetes abandonados o con comportamiento opaco sin justificación.
- No descargar ejecutables ni modelos en runtime.
- No permitir que contenido importado instale dependencias.
- Documentar reemplazo o retirada de dependencias críticas.

## 8. Roadmap de implementación

El orden es incremental. No se avanza por calendario, sino por gates de aceptación.

### Fase 0 — Cierre de especificaciones

Entregables:
- Documentos 00–15 revisados.
- Decisiones críticas resueltas.
- Proveedor de hosting evaluado.
- Supabase Free confirmado como viable para el volumen piloto.
- Licencias y dependencias candidatas auditadas.
- Riesgos y límites documentados.
- Contratos de datos aprobados.

**Gate:** no quedan contradicciones bloqueantes entre arquitectura, costos, almacenamiento, render y seguridad.

### Fase 1 — Fundaciones y contratos

Entregables:
- Estructura del repositorio de aplicación.
- React + TypeScript + Vite, si se confirma en la decisión técnica.
- Sistema de configuración y entornos.
- Design tokens y layout base.
- JSON Schemas iniciales.
- Versionado de package/schema/engine.
- Validación de paquetes.
- Registro de componentes.
- Manejo de errores y logging sin secretos.

**Gate:** paquete válido se importa; paquete inválido se rechaza con errores legibles; no se ejecuta código arbitrario.

### Fase 2 — Producción visual mínima

Entregables:
- Three.js integrado.
- Scene Engine mínimo.
- Cámara, iluminación y timeline determinista.
- Un entorno reutilizable.
- Un modelo de packaging paramétrico.
- Overlays 2D y subtítulos.
- Preview de escena.
- Render de frames en navegador.

**Gate:** misma escena, mismos parámetros y mismo seed producen resultados visuales reproducibles dentro de tolerancias definidas.

### Fase 3 — Render y entregables

Entregables:
- Pipeline frame-by-frame.
- Codificación y muxing en navegador.
- Detección de soporte de codecs.
- Perfiles draft/preview/final.
- Render por escena y rango.
- Cancelación y recuperación.
- Gestión de memoria y errores.
- Guardado y reproducción desde Supabase Storage.

**Gate:** exportación de prueba completa, reproducible y verificable en navegadores objetivo. No se habilita producción hasta confirmar formato, límites y reproducción real.

### Fase 4 — Product Library y editor

Entregables:
- Catálogo de productos.
- Fichas de marca, variante, fuente, derechos y fidelidad.
- Modelos 3D reutilizables.
- Editor de escenas y timeline.
- Reemplazo de producto.
- Re-render de escena.
- Versionado y autosave.

**Gate:** campaña puede reutilizar un producto aprobado sin reconstruirlo y conserva trazabilidad de sus fuentes.

### Fase 5 — Audio y personajes

Entregables:
- Música procedural.
- SFX y ambientes.
- Mezcla y sincronización.
- Personajes estilizados básicos.
- Acciones y expresiones iniciales.
- Interacción con productos.

**Gate:** pieza audiovisual sincronizada y utilizable sin TTS. La voz sintética sigue fuera hasta decisión separada.

### Fase 6 — Quality Gate y producción piloto

Entregables:
- Validaciones técnicas y editoriales.
- Derechos, claims y revisión humana.
- Social Packages.
- Campaña piloto de yerba mate.
- Variantes ES/EN cuando se justifique.
- Render final, almacenamiento y reproducción.
- Registro de aprobación.

**Gate:** una campaña completa se produce desde paquete hasta entregable aprobado sin costos y sin filtrar datos protegidos.

### Fase 7 — Analítica y distribución operativa

Entregables:
- Registro manual de publicaciones.
- UTM.
- Eventos first-party mínimos.
- Dashboard inicial.
- Captura manual de métricas.
- Informe de campaña.
- Cola editorial sin auto-publicación.

**Gate:** el informe puede relacionar campaña, publicación, visitas y partidas con limitaciones de atribución explícitas.

### Fase 8 — Optimización

Solo después de uso real:
- Mejoras de performance.
- Más familias de envases.
- Más entornos y personajes.
- Nuevos perfiles de exportación.
- Experimentos creativos.
- Evaluación de integraciones oficiales.

**Gate:** cada mejora demuestra valor y no agrega costo, complejidad o riesgo desproporcionado.

## 9. Estrategia de pruebas

### 9.1 Unit tests

- Validadores y schemas.
- Serialización y versionado.
- Matemática de timeline.
- Transformaciones y geometría paramétrica.
- Seeds y determinismo.
- UTM y normalización.
- Fórmulas de métricas.
- Reglas de permisos y ownership.
- Cálculo de límites de render.

### 9.2 Integration tests

- Importación de Production Package.
- Resolución de componentes.
- Product Library y assets.
- Timeline con cámara, luces y animaciones.
- Audio y video sincronizados.
- Upload y descarga de Storage.
- URLs firmadas y expiración.
- RLS en cada tabla y bucket.
- Guardado y recuperación de campañas.
- Registro de aprobación.

### 9.3 End-to-end

Recorrido de referencia:
1. Abrir aplicación.
2. Autenticarse si corresponde.
3. Importar paquete válido.
4. Ver validaciones.
5. Abrir preview.
6. Editar texto o producto permitido.
7. Renderizar una escena.
8. Renderizar campaña.
9. Guardar entregable.
10. Reproducirlo desde Storage.
11. Ejecutar Quality Gate.
12. Aprobar.
13. Generar Social Package.
14. Registrar publicación manual.
15. Revisar métricas.

### 9.4 Render y calidad visual

- Resolución y aspect ratio correctos.
- FPS constante.
- Duración exacta o dentro de tolerancia.
- Ausencia de frames negros inesperados.
- Sin clipping visual o textos fuera de safe zones.
- Cámara y animaciones deterministas.
- Partículas reproducibles con seed.
- Audio sin clipping.
- Sincronización de voz, texto y música cuando corresponda.
- Memoria liberada al cambiar escenas.
- Recuperación tras interrupción.
- Render de escena aislada coincide con el tramo correspondiente del master.

### 9.5 Compatibilidad

Probar en navegadores de escritorio y dispositivos objetivo:
- Chrome.
- Edge.
- Firefox.
- Safari cuando sea parte del público objetivo.
- Móviles Android e iOS.

La lista final depende de las capacidades reales de WebGL/WebGPU, WebCodecs, memoria y codecs. Si un navegador no soporta un perfil, mostrar una limitación clara y ofrecer un perfil compatible si existe; no afirmar compatibilidad universal.

### 9.6 Seguridad

- RLS: usuario A no accede a recursos de B.
- Usuario no autenticado no accede a datos privados.
- Storage privado y signed URLs.
- Tokens ausentes de bundles y logs.
- Paquetes malformados rechazados.
- HTML/script inyectado no ejecutado.
- URLs y rutas maliciosas bloqueadas.
- Límites de tamaño y cantidad aplicados.
- No se exponen respuestas secretas ni Daily activo.
- No se puede publicar sin aprobación.
- Pruebas de revocación de permisos.

### 9.7 Performance y límites

Medir:
- Tiempo de importación.
- Tiempo de preview.
- FPS interactivo.
- Memoria máxima observada.
- Tiempo por frame.
- Tiempo de render por minuto de video.
- Tamaño final.
- Tiempo y éxito de upload.
- Consumo de egress.
- Tiempo de reproducción desde Storage.

Definir presupuestos de performance después de medir dispositivos reales. No inventar umbrales antes del benchmark.

### 9.8 Pruebas de costo

Antes de habilitar una función:
- Confirmar plan y cuota.
- Estimar bytes y requests por producción.
- Estimar consumo de egress.
- Verificar límites de tamaño y frecuencia.
- Confirmar comportamiento al alcanzar cuota.
- Confirmar que no requiere billing.
- Ejecutar con límites de prueba.
- Documentar el resultado.

Probar explícitamente que los kill switches detienen nuevos renders, uploads y eventos.

## 10. Definition of Done

Una función se considera terminada únicamente cuando:
- Cumple el alcance documentado.
- Tiene pruebas automatizadas apropiadas.
- Tiene pruebas manuales en el navegador objetivo.
- Respeta seguridad y permisos.
- Tiene manejo de error y recuperación.
- No agrega costos ni dependencias no aprobadas.
- Tiene documentación y changelog actualizados.
- Está integrada sin romper módulos existentes.
- Tiene criterios de aceptación demostrables.
- No depende de una funcionalidad futura presentada como existente.

Una compilación exitosa no es suficiente.

## 11. Gates globales de salida

| Gate | Condición para avanzar |
|---|---|
| G0 — Especificaciones | Documentos y decisiones bloqueantes aprobados |
| G1 — Contratos | Schemas, versiones y validación robustos |
| G2 — Preview | Escena 3D y timeline reproducibles |
| G3 — Render | Archivo audiovisual válido y compatible |
| G4 — Persistencia | Guardado privado y reproducción desde Storage |
| G5 — Editor | Reutilización y edición de campaña |
| G6 — Quality | Veracidad, derechos, seguridad y aprobación |
| G7 — Piloto | Una campaña end-to-end a USD 0 |
| G8 — Operación | Métricas y distribución manual confiables |

## 12. Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cuotas gratuitas insuficientes | Alto | Límites conservadores, kill switches y pausa |
| Supabase Free pausado | Medio/alto | Aceptar interrupción, procedimiento de reactivación |
| Browser sin codec compatible | Alto | Detección, perfiles alternativos y pruebas |
| Memoria insuficiente al renderizar | Alto | Chunks, render por escena y límites |
| Egress elevado por video | Alto | Compresión, control de reproducciones y monitoreo |
| Packaging inexacto | Medio | Ficha de fidelidad, referencias y aprobación |
| Asset sin licencia adecuada | Alto | Registro de derechos y bloqueo del Quality Gate |
| API social restringida o paga | Medio | Publicación manual |
| Pérdida de tokens | Alto | Revocación y almacenamiento seguro |
| Atribución incompleta | Medio | Informes con limitaciones explícitas |
| Scope creep | Alto | Roadmap por gates y MVP estricto |
| Dependencia de proveedor gratuito | Alto | Exportabilidad, documentación y plan de pausa |

## 13. Operación y mantenimiento

- Revisar cuotas y avisos de proveedores mensualmente.
- Revisar dependencias y vulnerabilidades antes de releases.
- Revisar licencias cuando se actualice una dependencia.
- Mantener backups/exportaciones de configuración y metadata dentro de límites gratuitos.
- No afirmar que Supabase Free ofrece backups automáticos equivalentes a planes pagos.
- Probar restauración cuando el mecanismo esté definido.
- Mantener changelog y notas de release.
- Registrar cambios de schema y migraciones.
- Tener procedimiento de rollback de frontend y migraciones.
- Mantener un modo de solo lectura o pausa si Storage/DB se acerca al límite.

## 14. Decisiones bloqueantes antes de programar

1. Hosting final y límites del plan gratuito.
2. Confirmación de Supabase Free y estrategia de pausa.
3. Esquemas JSON y política de versionado.
4. Mecanismo de importación/exportación de Production Packages.
5. Pipeline de codificación y muxing que funcione en navegadores objetivo.
6. Política de límites de render, almacenamiento y egress.
7. Diseño de autenticación y ownership.
8. Retención y borrado de datos.
9. Catálogo inicial de dependencias y licencias.
10. Primer dispositivo de referencia y criterios de performance.
11. Flujo exacto de aprobación y publicación manual.
12. Benchmark del piloto antes de escalar el editor.

## 15. Condiciones para declarar el MVP terminado

El MVP no necesita todos los escenarios, personajes, formatos o integraciones imaginados. Debe poder:

- Importar un Production Package válido.
- Validarlo y rechazar contenido inválido.
- Crear o reutilizar un producto 3D sencillo.
- Construir una escena cinematográfica.
- Componer texto, subtítulos y audio básico.
- Previsualizar y renderizar en navegador.
- Exportar un video compatible con el perfil validado.
- Guardar y reproducir el entregable desde Supabase Storage.
- Ejecutar controles de calidad y derechos.
- Obtener aprobación humana.
- Preparar un Social Package.
- Registrar la publicación manual y sus métricas.
- Completar una campaña piloto de principio a fin con USD 0 de gasto incremental.

## 16. Cierre de documentación

Con este documento queda definida la estructura documental inicial de Ingredora Content Studio:
- 00–15: visión, estrategia, arquitectura, protocolo, identidad, catálogo, producción 3D, personajes, escenas, audio, editor/render, almacenamiento, calidad, distribución, analítica y seguridad/roadmap/pruebas.
- README y CHANGELOG: índice y registro de cambios.
- Schemas y código: próximos artefactos, todavía no implementados.

**No comenzar a programar hasta realizar una auditoría integral de coherencia entre los 16 documentos.** La siguiente etapa es revisar contradicciones, resolver decisiones bloqueantes y aprobar los contratos JSON. Después se puede abrir la fase de implementación.

---

**Estado final de especificaciones:** borrador completo 00–15. La aprobación del conjunto requiere auditoría transversal; no implica que la aplicación esté construida ni que los proveedores estén contratados o configurados.
