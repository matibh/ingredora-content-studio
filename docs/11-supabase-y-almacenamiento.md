# 11 — Supabase y almacenamiento

**Estado:** especificación funcional y de seguridad inicial. Cuotas verificadas contra documentación pública el 2026-11-19; deben revalidarse antes de implementar y periódicamente.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Definir cómo Ingredora Content Studio utiliza Supabase para autenticación, base de datos, metadata, estado de producción y almacenamiento de archivos, manteniendo el presupuesto permanente de USD 0.

Supabase no será un motor de render ni un lugar para ejecutar código creativo. El navegador renderiza; Supabase persiste y sirve los datos y archivos autorizados.

## 2. Reglas económicas no negociables

- Mantener el proyecto en el plan Free mientras sea compatible con el presupuesto.
- No introducir tarjeta, billing, upgrade automático, plan pago ni servicios complementarios pagos.
- No permitir cargos por exceso: si una cuota o límite se alcanza, bloquear la operación que la consume.
- No confiar en alertas de uso como único mecanismo de protección.
- No asumir que las cuotas gratuitas son permanentes o que no cambiarán.
- Antes de producción, revisar pricing, límites, facturación, egress, Storage y políticas de pausa.
- Si el proyecto deja de ser viable dentro del nivel gratuito, reducir alcance o detener la función; nunca migrar a un servicio pago sin decisión explícita del usuario.

**Referencia de cuotas publicadas consultada el 2026-11-19:** Free indica 500 MB de base de datos por proyecto, 1 GB de Storage, 5 GB de egress y 5 GB de cached egress, límite global de 50 MB por archivo, y pausa por inactividad de una semana. Son valores de referencia sujetos a cambios y condiciones del proveedor. No son una promesa de disponibilidad ni un presupuesto de consumo.

Fuentes oficiales:
- Pricing: https://supabase.com/pricing
- Billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Manage usage: https://supabase.com/docs/guides/platform/manage-your-usage
- Storage pricing: https://supabase.com/docs/guides/storage/pricing
- Storage egress: https://supabase.com/docs/guides/storage/serving/bandwidth
- Upload limits: https://supabase.com/docs/guides/storage/uploads/file-limits
- Free project pausing: https://supabase.com/docs/guides/platform/free-project-pausing

## 3. Responsabilidades de Supabase

Supabase puede gestionar:
- Auth y sesiones de usuario.
- Datos de campañas, proyectos, escenas y versiones.
- Metadata de assets y entregables.
- Estados de importación, validación y render.
- Historial de cambios y aprobaciones.
- Referencias a objetos de Storage.
- Configuración y preferencias del workspace.

Supabase no debe:
- Renderizar frames o codificar videos.
- Ejecutar scripts importados.
- Generar imágenes, música, voz o modelos.
- Ser un sistema de distribución social automática en el MVP.
- Almacenar videos finales en la base de datos.
- Ser usado como sustituto de un backup externo garantizado.

## 4. Modelo lógico de datos

El esquema final se implementará mediante migraciones versionadas. Entidades conceptuales:

### 4.1 profiles

- user_id vinculado a Auth.
- display_name opcional.
- preferencias de idioma y UI.
- timestamps.

No almacenar secretos, contraseñas ni datos innecesarios.

### 4.2 campaigns

- id.
- owner_id.
- name.
- objective.
- editorial_pillar.
- status.
- created_at / updated_at.

### 4.3 productions

Representa una pieza/version de contenido dentro de una campaña:
- id y campaign_id.
- owner_id.
- package_id y package_version.
- schema_version y engine_version.
- language.
- aspect_ratio, resolution y fps.
- target_duration.
- status.
- source_manifest o referencia versionada.
- timestamps.

### 4.4 scenes

- id y production_id.
- scene_key.
- order_index.
- duration_frames.
- scene_version.
- declarative_config.
- dependency_hash.
- status.

El contenido de configuración debe ser declarativo y validado. No almacenar funciones o scripts para evaluación dinámica.

### 4.5 assets

- id y owner_id.
- asset_type.
- source_type.
- storage_path o referencia externa permitida.
- MIME type.
- file_size.
- checksum.
- license_status y rights_metadata.
- version.
- approval_status.

### 4.6 render_jobs

- id y owner_id.
- production_id y snapshot_version.
- status.
- render_profile.
- total_frames y current_frame.
- current_scene_id.
- error_code y error_summary.
- started_at, updated_at, completed_at.
- output_id opcional.

La fila registra estado; no contiene frames ni archivos de video binarios.

### 4.7 deliverables

- id y owner_id.
- campaign_id y production_id.
- render_job_id.
- storage_bucket y storage_path.
- MIME type.
- file_size.
- duration.
- resolution y fps.
- codec y container.
- language.
- checksum.
- review_status.
- created_at.

### 4.8 approvals y audit_events

Registrar aprobaciones humanas, actor, fecha, versión aprobada y cambios sensibles. No convertir una aprobación de render en autorización de publicación.

## 5. Organización de Storage

Buckets privados por defecto. Separar tipos de contenido para aplicar límites y permisos específicos.

Buckets conceptuales:
- `project-assets`: referencias, imágenes autorizadas, texturas y recursos.
- `production-packages`: paquetes importados y manifiestos.
- `render-previews`: previews temporales que deban persistirse.
- `final-deliverables`: videos finales aprobados o pendientes de revisión.
- `thumbnails`: posters y miniaturas.

La cantidad real de buckets se decidirá en implementación; no crear buckets por cada campaña.

### 5.1 Convención de rutas

Usar rutas opacas y estables, separadas por propietario:
`{owner_id}/{campaign_id}/{production_id}/{asset_or_deliverable_id}/{filename}`

No confiar en el nombre de archivo ni en IDs proporcionados por el cliente como prueba de propiedad. La política debe validar owner y bucket.

### 5.2 Límites por bucket

Cada bucket debe tener:
- MIME types permitidos.
- Límite de tamaño por archivo.
- Visibilidad privada.
- Política RLS específica.
- Política de retención si aplica.

El límite por bucket nunca puede exceder el límite global del plan. En Free, la documentación consultada indica un máximo global de 50 MB por archivo. El sistema debe imponer un límite de aplicación inferior con margen de seguridad; el valor exacto se fijará tras probar tamaños reales y métodos de carga.

## 6. Presupuesto de almacenamiento audiovisual

El límite de 1 GB de Storage es muy pequeño para una biblioteca de videos. Por lo tanto:
- No guardar renders intermedios completos si no aportan valor.
- No guardar todas las versiones draft indefinidamente.
- No duplicar el mismo asset por campaña.
- Reutilizar assets aprobados mediante referencias.
- Comprimir miniaturas y recursos de preview.
- Medir el tamaño del video antes de subirlo.
- Mantener una cuota interna de seguridad inferior a la cuota máxima del proveedor.
- Reservar espacio para metadata y archivos auxiliares.
- Bloquear nuevas cargas cuando no haya espacio suficiente.

El límite interno inicial debe ser configurable y conservador; no fijar un porcentaje definitivo hasta observar el uso real.

**Regla de seguridad:** si un entregable supera el máximo permitido, no intentar dividirlo en objetos para eludir el límite de archivo. Revisar perfil de exportación, bitrate, duración o codec compatible. Si no puede reducirse sin degradación inaceptable, informar que no es posible almacenarlo bajo las restricciones actuales.

## 7. Egress y reproducción

Cada reproducción o descarga puede consumir transferencia. El egress puede incluir datos de Storage, Database, Auth y otros servicios, y se contabiliza según las reglas del plan.

Medidas:
- Reproducir previews de baja resolución cuando sea suficiente.
- Evitar autoplay y loops innecesarios.
- No descargar el mismo video repetidamente sin necesidad.
- Generar thumbnails ligeros.
- Mostrar tamaño de archivo antes de reproducir o descargar.
- Evitar cargar videos completos para mostrar una miniatura.
- Usar URLs firmadas de duración limitada para objetos privados cuando corresponda.
- Medir cached y uncached egress por separado.
- Aplicar un presupuesto interno mensual con margen.

No asumir que el CDN vuelve ilimitada la reproducción ni que toda transferencia será cached. La app debe poder detener reproducciones o descargas si se aproxima al umbral interno.

## 8. Autenticación y autorización

Auth gestiona identidad y sesiones. Toda operación sobre datos privados requiere usuario autenticado y políticas de autorización.

Principios:
- No confiar en datos enviados por el frontend para definir ownership.
- No usar user_metadata editable por el usuario como fuente de autorización.
- Guardar permisos administrativos en claims confiables o tablas protegidas.
- No exponer service_role ni claves secretas en frontend.
- Usar publishable/anon key según la configuración vigente.
- Mantener sesiones seguras y cerrar sesión en dispositivos compartidos.
- Minimizar datos personales almacenados.

El MVP puede comenzar con un solo usuario propietario, pero el esquema debe dejar claro el owner_id para evitar que una futura ampliación abra acceso entre usuarios.

## 9. Row Level Security (RLS)

RLS debe estar habilitado en todas las tablas expuestas del esquema público.

Políticas por entidad:
- SELECT: solo propietario o rol explícitamente autorizado.
- INSERT: owner_id debe corresponder al usuario autenticado.
- UPDATE: validar propiedad tanto en USING como en WITH CHECK.
- DELETE: restringido al propietario y a acciones explícitas.

No usar una política genérica que permita a cualquier usuario autenticado leer todas las filas.

Las tablas relacionadas deben validar ownership a través de relaciones confiables. Una escena no puede quedar accesible solo porque el usuario conoce su ID.

Las vistas deben revisarse por su comportamiento frente a RLS; cuando corresponda, usar seguridad de invocador y no exponer vistas privilegiadas accidentalmente.

## 10. Storage RLS

Las operaciones de Storage se autorizan mediante políticas sobre `storage.objects`.

- Buckets privados.
- SELECT limitado al propietario y a operaciones necesarias.
- INSERT valida bucket y carpeta de owner.
- UPDATE limitado al propietario; necesario si se usa upsert.
- DELETE solo mediante acción explícita y autorizada.
- No permitir listados públicos de buckets privados.
- No usar service_role en navegador.
- No modificar directamente tablas internas de Storage por SQL para mover, borrar o subir archivos: usar la API de Storage.

El acceso de lectura puede utilizar JWT del usuario o signed URLs temporales. Una URL firmada es un enlace portador: quien la posee puede acceder durante su vigencia. Usar expiraciones cortas y no compartirlas en logs o metadatos públicos.

Documentación:
- Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Storage schema: https://supabase.com/docs/guides/storage/schema/design

## 11. Uploads y consistencia

Flujo de subida:
1. Validar sesión y permisos.
2. Verificar MIME type, tamaño y checksum local.
3. Confirmar que el presupuesto interno permite la carga.
4. Subir al bucket privado.
5. Verificar resultado y metadata del objeto.
6. Registrar o actualizar la fila deliverables.
7. Confirmar integridad y reproducibilidad.
8. Marcar como disponible.

Si falla el registro después de subir el archivo, debe existir un procedimiento de reconciliación para detectar objetos huérfanos. Si falla la subida, no registrar un entregable como disponible.

Evaluar uploads reanudables para archivos suficientemente grandes y compatibilidad real del SDK/navegador. No asumir que reanudar es automático ni que resuelve el límite máximo por archivo.

Los cambios de metadata y objetos no forman una única transacción distribuida. Diseñar estados intermedios y reconciliación.

## 12. Retención, versiones y eliminación

Política inicial:
- Packages importados: conservar versiones necesarias para reproducibilidad.
- Assets aprobados: reutilizables entre campañas.
- Previews: temporales, con limpieza manual o política configurable y confirmada.
- Renders fallidos: conservar logs/metadata; descartar archivos parciales no válidos con confirmación o política segura.
- Entregables finales: conservar hasta que el usuario solicite eliminarlos.
- Entregables aprobados: nunca borrar automáticamente.

Toda eliminación de objeto debe pasar por Storage API y actualizar metadata asociada. No borrar filas de metadata sin eliminar o reconciliar el objeto real.

La limpieza masiva requiere vista previa de lo que se eliminará y confirmación humana.

## 13. Cuotas y protección contra cargos

El dashboard del proveedor no debe ser la única defensa. Implementar controles internos:
- Presupuesto estimado de Storage.
- Presupuesto estimado de egress.
- Conteo y tamaño de objetos.
- Tamaño de base de datos.
- Uso de Auth y otros recursos relevantes.
- Fecha de última comprobación de cuotas.
- Umbrales de advertencia y bloqueo.
- Estado de protección económica.

Los valores exactos de umbral se configuran por debajo de la cuota oficial, con margen. No esperar al 100%.

Si el uso no puede medirse con fiabilidad, adoptar el comportamiento seguro: bloquear nuevas cargas/renderizados que requieran almacenamiento y advertir que se necesita revisión manual.

No depender de una función Edge para monitorear el consumo si ello introduce una dependencia de cuota o ejecución adicional. El panel puede mostrar datos disponibles del proveedor y registrar comprobaciones manuales.

## 14. Inactividad y continuidad

Supabase Free puede pausar proyectos con actividad insuficiente durante una semana. Esto puede interrumpir Auth, base de datos y Storage hasta restaurar el proyecto.

La aplicación debe:
- Mostrar estado de backend inaccesible sin perder el borrador local.
- Distinguir un proyecto pausado de un error de red cuando la información esté disponible.
- No prometer disponibilidad continua ni SLA.
- Documentar el proceso de reactivación.
- No generar actividad artificial para eludir políticas del proveedor.
- No recomendar upgrade pago para resolver la pausa.

La continuidad del servicio es una limitación aceptada del nivel gratuito.

## 15. Backups y recuperación

El nivel gratuito consultado no incluye backups automáticos de base de datos equivalentes a los planes pagos. Por eso:
- Versionar schemas y migraciones en GitHub.
- Exportar periódicamente metadata crítica de forma manual y segura.
- Mantener manifests de producción y checksums.
- No considerar GitHub como backup de videos.
- No prometer recuperación de objetos borrados sin una copia real.
- Definir una rutina de exportación y prueba de restauración antes de producción.

Los backups no deben incorporar secretos ni archivos de usuario sin control de acceso.

## 16. Observabilidad y auditoría

Registrar:
- Errores de Auth y permisos.
- Fallos de RLS.
- Errores de carga y descarga.
- Tamaños y conteos de objetos.
- Estado de jobs y deliverables.
- Acciones de aprobación y eliminación.
- Cambios de ownership o permisos.
- Comprobaciones de cuotas.

No guardar tokens, signed URLs completas, secretos, contraseñas ni contenido sensible en logs.

Los logs y su retención también consumen recursos y pueden tener límites en el plan gratuito.

## 17. Entornos y secretos

- Separar desarrollo y producción si el número de proyectos gratuitos lo permite.
- No crear proyectos adicionales sin comprobar el límite de proyectos Free.
- Mantener migraciones versionadas.
- Claves públicas en configuración del frontend; secretos solo en entorno seguro de servidor cuando realmente sean necesarios.
- No usar service_role en React, Vite ni código entregado al navegador.
- No subir archivos .env con secretos al repositorio.
- Rotar credenciales ante exposición.
- Restringir permisos de GitHub y Supabase al mínimo necesario.

## 18. Criterios de aceptación

- [ ] Esquema de datos documentado y versionado.
- [ ] RLS habilitado en todas las tablas expuestas.
- [ ] Policies verificadas con usuario propietario y usuario ajeno.
- [ ] Buckets privados por defecto.
- [ ] Policies de Storage verificadas para SELECT, INSERT, UPDATE y DELETE.
- [ ] Ninguna clave service_role expuesta al cliente.
- [ ] Subida y reproducción de un video final desde la app.
- [ ] Metadata y checksum coinciden con el objeto almacenado.
- [ ] Límite de archivo y MIME type comprobados.
- [ ] Umbrales internos bloquean nuevas cargas antes de la cuota.
- [ ] No se generan cargos ni se activa billing.
- [ ] La eliminación requiere confirmación.
- [ ] Los entregables aprobados no se eliminan automáticamente.
- [ ] Existe procedimiento de reconciliación de objetos huérfanos.
- [ ] Se documentó el riesgo de pausa por inactividad y la ausencia de backup automático en Free.

## 19. Fuera del MVP

- Multi-tenant comercial y equipos con roles complejos.
- Colaboración simultánea.
- Edge Functions para procesos de medios.
- Automatización de limpieza destructiva.
- Replicación y backups pagos.
- CDN externo pago.
- Distribución pública de una biblioteca de videos.
- Analytics avanzados que aumenten consumo innecesario.

## 20. Decisiones pendientes

1. Confirmar si habrá uno o dos proyectos Supabase dentro del límite gratuito vigente.
2. Definir schema SQL y migraciones.
3. Definir buckets y límites exactos.
4. Elegir umbrales internos de Storage y egress.
5. Definir tamaño máximo interno de video, inferior al límite del proveedor.
6. Probar carga reanudable y reproducción de archivos reales.
7. Diseñar políticas RLS y tests de acceso cruzado.
8. Definir exportación y restauración de metadata.
9. Definir política de retención de previews y renders fallidos.
10. Establecer revisión mensual de cuotas y términos.

## 21. Relación con otros documentos

- **02 — Arquitectura general:** separación entre navegador, Supabase y GitHub.
- **03 — ChatGPT: producción y protocolo:** packages y manifests.
- **05/06/07/08/09:** metadata y assets de productos, personajes, escenas y audio.
- **10 — Editor y Render Engine:** jobs, uploads y deliverables.
- **12 — Control de calidad:** aprobación, permisos y validaciones.
- **13 — Distribución social:** límites de reproducción, exportación y publicación.

---

**Estado:** especificación inicial. Los límites gratuitos citados reflejan la documentación pública consultada el 2026-11-19 y deben comprobarse en el dashboard y la documentación oficial antes de implementar. El proyecto debe detener operaciones antes de cualquier posibilidad de cargo; USD 0 tiene prioridad sobre disponibilidad o escala.
