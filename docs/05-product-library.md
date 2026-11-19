# 05 — Product Library

**Estado:** especificación funcional inicial; fuentes, catálogo y derechos deben validarse con productos reales.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Definir una biblioteca central de productos que funcione como fuente de verdad para las campañas y para el 3D Product Studio. Cada producto se registra una sola vez, con información verificable, referencias visuales, derechos, packaging, variantes y relación con sus modelos 3D.

La biblioteca evita reconstruir productos en cada campaña, reduce errores y permite saber qué se conoce, qué se supone y qué está autorizado para publicarse.

## 2. Alcance

La Product Library administra:
- Identidad del producto y su marca.
- Categoría, mercado y disponibilidad conocida.
- Datos descriptivos verificados y su fuente.
- Variantes, tamaños y presentaciones.
- Referencias visuales y archivos autorizados.
- Colores y características observables del packaging.
- Nivel de fidelidad de la recreación 3D.
- Derechos, permisos, restricciones y atribución.
- Versiones, revisión y estado de aprobación.
- Enlaces a modelos, materiales y escenas reutilizables.

No es un sistema para inventar datos nutricionales, ingredientes, claims, composición o información legal. Tampoco implica que Ingredora tenga patrocinio, asociación comercial o permiso de una marca por el mero hecho de representar visualmente un producto.

## 3. Principios de datos

1. **Una entidad por producto y presentación:** distinguir producto, marca, variante y tamaño cuando sean relevantes.
2. **Fuente por dato:** los datos importantes deben tener procedencia, fecha de consulta y nivel de confianza.
3. **Desconocido no significa falso:** permitir campos vacíos o estado “no verificado”; nunca completar por intuición.
4. **Separar dato y observación:** una descripción oficial no es lo mismo que una característica inferida de una fotografía.
5. **Separar producto de asset:** el producto puede tener varias fotos, etiquetas, envases y modelos, cada uno con su licencia y versión.
6. **No confundir aproximación con oficialidad:** el nivel de fidelidad debe ser visible para el equipo.
7. **Cambios auditables:** no sobrescribir silenciosamente datos que ya fueron usados en una campaña.
8. **Presupuesto cero:** priorizar carga manual y fuentes públicas legítimas; no depender de APIs pagas ni servicios de scraping de pago.

## 4. Modelo conceptual

### 4.1 Producto

Campos conceptuales:
- product_id: identificador interno estable.
- canonical_name: nombre canónico.
- brand_id: referencia a marca.
- category_id: categoría.
- country/market: país o mercado al que corresponde.
- description: descripción factual breve.
- status: estado editorial del registro.
- created_at / updated_at.
- current_version.

### 4.2 Marca

- brand_id.
- official_name.
- aliases: variantes conocidas del nombre, si se verifican.
- official_website: solo si se confirmó.
- market/country.
- logo_asset_id: opcional y sujeto a derechos.
- notes.

Una marca no debe tratarse como patrocinadora ni asociada a Ingredora sin acuerdo explícito.

### 4.3 Presentación o SKU

Una misma línea puede tener diferentes tamaños, sabores, variedades, ediciones o diseños de envase. Registrar cada presentación relevante por separado:
- variant_id.
- product_id.
- variant_name.
- package_type.
- net_quantity y unit, solo si están verificados.
- market.
- packaging_revision o período de diseño, si se conoce.
- status.

No fusionar presentaciones que tengan packaging o datos distintos. No inferir que una presentación sigue a la venta porque aparece en una foto antigua.

### 4.4 Fuentes y afirmaciones

Cada dato factual debe poder vincularse a una fuente o marcarse como observación:
- source_id.
- source_type: sitio oficial, ficha oficial, fotografía autorizada, documento, observación visual, aporte del usuario u otra fuente documentada.
- source_name y source_location.
- accessed_at.
- publisher/owner, cuando se conozca.
- evidence_asset_id, opcional.
- rights_status.
- notes.

Para afirmaciones relevantes, conservar:
- field_path: campo respaldado.
- value o referencia al dato.
- source_id.
- confidence/status.
- reviewed_by y reviewed_at, si aplica.

La biblioteca debe poder indicar que una fuente respalda solo parte del registro. Una fotografía puede respaldar color y forma, pero no ingredientes, peso o composición.

## 5. Estados de verificación y aprobación

Estados recomendados para el producto:
- **draft:** registro incompleto en preparación.
- **needs_sources:** faltan fuentes o evidencias.
- **under_review:** pendiente de revisión.
- **verified:** datos seleccionados contrastados con fuentes.
- **approved_for_content:** apto para utilizarse en contenido dentro de los permisos registrados.
- **archived:** ya no se recomienda para nuevas producciones.

Los estados de los assets y permisos son independientes. Un producto verificado puede tener una fotografía sin derechos de publicación. Un modelo 3D puede estar aprobado como recreación aproximada aunque el producto no tenga datos descriptivos completos.

No habilitar publicación automática basándose únicamente en el estado del producto.

## 6. Fuentes de información

### 6.1 Orden de preferencia

1. Material oficial del fabricante o titular de marca.
2. Fichas y catálogos oficiales del producto.
3. Fotografías propias tomadas con autorización.
4. Material entregado directamente por el usuario o titular, con permiso de uso aclarado.
5. Fuentes de terceros confiables para datos puntuales, con atribución y verificación adicional.

Los marketplaces, redes sociales, buscadores de imágenes y bases comunitarias pueden servir como pistas de investigación, pero no deben considerarse automáticamente fuentes oficiales ni otorgar derechos de reutilización.

### 6.2 Investigación

Para cada producto:
- Confirmar nombre y marca.
- Identificar presentación, tamaño y mercado.
- Buscar una referencia visual suficientemente clara.
- Registrar URL o referencia de origen y fecha de consulta.
- Verificar los datos que se quieran mostrar en pantalla.
- Distinguir información oficial de inferencias visuales.
- Comprobar permisos de uso del material antes de incorporarlo al render.

No descargar en masa ni realizar scraping que infrinja condiciones de uso. No automatizar consultas a servicios externos sin revisar términos, límites y costos.

### 6.3 Aportes del usuario

El usuario puede aportar fotografías, imágenes de referencia, archivos de packaging o enlaces. La biblioteca debe registrar:
- Quién proporcionó el material (sin guardar datos personales innecesarios).
- Qué uso autorizó.
- Si el permiso cubre modificación, texturizado, publicación y redistribución.
- Restricciones de territorio, plazo o canal, si existen.
- Fecha y evidencia del permiso.

La entrega de un archivo no demuestra por sí sola que se posean los derechos sobre él.

## 7. Assets visuales y derechos

Cada asset tendrá registro propio:
- asset_id.
- product_id / variant_id, si aplica.
- asset_type: foto, logo, etiqueta, textura, referencia, modelo, render u otro.
- storage_path o referencia controlada.
- source_id.
- creator/rights_holder, cuando se conozca.
- license_or_permission.
- permitted_uses.
- restrictions.
- attribution_text, si corresponde.
- checksum, mime_type, dimensions y file_size cuando sea posible.
- version, status y timestamps.

Estados mínimos de derechos:
- **unknown:** derechos no aclarados; no publicar ni usar como textura final.
- **reference_only:** puede consultarse internamente, no redistribuirse ni incorporarse al contenido final.
- **licensed:** licencia identificada y compatible con el uso previsto.
- **permission_granted:** permiso documentado para los usos especificados.
- **owned:** creado por el equipo o usuario con titularidad confirmada.
- **restricted/expired/revoked:** uso prohibido o permiso vencido/revocado.

No asumir que una imagen encontrada públicamente es libre de derechos. No borrar el historial de permisos revocados: marcar el asset como no utilizable y detectar campañas que lo hayan incorporado.

## 8. Nivel de fidelidad del producto 3D

Cada modelo o recreación tendrá una clasificación visible:

| Nivel | Nombre | Qué significa | Uso |
|---|---|---|---|
| F0 | Conceptual | Envase genérico sin representar fielmente un producto real | Boceto interno; no presentarlo como producto exacto |
| F1 | Silueta y paleta | Forma aproximada y colores principales observados | Concepto visual, con aclaración si puede confundirse |
| F2 | Recreación visual | Forma, proporciones, paneles y diseño aproximados basados en referencias | Contenido sujeto a revisión y derechos |
| F3 | Alta fidelidad autorizada | Modelo y textura basados en referencias oficiales/autorizadas y revisadas | Publicación dentro del permiso registrado |

El nivel de fidelidad no sustituye la aprobación de derechos. Un F3 no implica automáticamente permiso de publicación; un F1 no debe presentarse como réplica exacta.

Para cada modelo registrar:
- model_id y product/variant asociado.
- fidelity_level.
- reference_assets.
- geometry_notes.
- texture_assets.
- known_deviations.
- review_status.
- engine compatibility/version.

## 9. Variantes, cambios y vigencia

Los productos pueden cambiar de packaging, nombre, tamaño o diseño con el tiempo:
- No reemplazar una variante histórica por la nueva.
- Registrar fecha de vigencia cuando se conozca.
- Mantener el diseño que corresponde a la campaña o período representado.
- Marcar la vigencia como desconocida si no hay evidencia.
- No afirmar que un producto está actualmente disponible sin una fuente reciente.
- Permitir alias y nombres locales sin duplicar entidades cuando se trate del mismo producto.

## 10. Flujo operativo

1. **Alta:** crear producto, marca y presentación con datos mínimos.
2. **Investigación:** reunir fuentes y referencias.
3. **Verificación:** asociar cada afirmación con evidencia; marcar lo desconocido.
4. **Derechos:** determinar si cada asset es referencia interna o puede utilizarse en producción/publicación.
5. **Preparación 3D:** enviar ficha y referencias al 3D Product Studio.
6. **Revisión visual:** comparar el modelo con las referencias y registrar desviaciones.
7. **Aprobación:** validar producto, assets y usos por separado.
8. **Uso en campaña:** seleccionar una versión aprobada y fijar su versión dentro del Production Package.
9. **Mantenimiento:** registrar cambios, caducidad o revocación de permisos y nuevas presentaciones.

## 11. Integración con campañas y render

Una campaña no debe apuntar solamente al nombre de un producto. Debe referenciar IDs y versiones concretas:
- product_id.
- variant_id.
- product_version.
- model_id y model_version.
- asset_ids y versiones.
- fidelity_level.
- rights/use approval snapshot.

Esto permite reproducir un render antiguo y saber qué packaging, imagen y datos se utilizaron. Si un permiso se revoca, el sistema debe poder localizar las campañas afectadas y bloquear nuevas publicaciones o renders que reutilicen ese asset.

La aplicación debe consumir referencias de la biblioteca y no duplicar manualmente fichas completas en cada campaña.

## 12. Búsqueda y organización

La biblioteca deberá permitir filtrar por:
- Nombre de producto y marca.
- Categoría.
- País/mercado.
- Tipo de envase.
- Variante y tamaño verificado.
- Estado de verificación.
- Estado de derechos.
- Nivel de fidelidad 3D.
- Fecha de actualización.

Las vistas de catálogo deben mostrar alertas claras: falta de fuente, derecho desconocido, asset de solo referencia, modelo sin revisar o variante desactualizada.

## 13. Seguridad y privacidad

- No guardar credenciales ni tokens de sitios externos en fichas.
- No exponer assets privados mediante URLs públicas permanentes.
- Separar material interno de los archivos aprobados para publicación.
- Aplicar permisos de acceso y políticas de almacenamiento definidas en el documento 11.
- No almacenar datos personales de contactos de marcas salvo necesidad y base legítima.
- Tratar archivos importados como contenido no confiable; validar formato, tamaño y tipo real.
- No ejecutar código incluido en assets, metadatos o archivos de producto.

## 14. Presupuesto cero y límites

- La Product Library no dependerá de APIs comerciales ni bases de datos con suscripción.
- La carga manual y los enlaces a fuentes públicas son válidos para el primer MVP.
- El almacenamiento de fotos, texturas y modelos consume cuota; conservar solo los archivos necesarios y optimizar formatos/resolución.
- No descargar ni almacenar una colección masiva de imágenes “por las dudas”.
- Antes de incorporar una fuente automatizada, revisar licencia, términos, rate limits, privacidad y costo potencial.
- Si el almacenamiento gratuito se acerca al límite, detener nuevas cargas y revisar/limpiar solo assets que no estén referenciados; nunca borrar evidencia necesaria para reproducibilidad o derechos.

## 15. Criterios de aceptación

- [ ] Producto, marca y presentación pueden distinguirse.
- [ ] Los datos factuales tienen fuente o estado explícito de no verificados.
- [ ] Se distinguen hechos oficiales de observaciones visuales.
- [ ] Cada asset tiene procedencia y estado de derechos.
- [ ] Los permisos especifican usos permitidos y restricciones.
- [ ] Los niveles F0–F3 no se confunden con derechos de publicación.
- [ ] Variantes y versiones históricas se conservan.
- [ ] Campañas referencian IDs y versiones concretas.
- [ ] La biblioteca detecta assets restringidos o permisos revocados.
- [ ] La solución funciona sin servicios pagos ni scraping indiscriminado.
- [ ] No se inventan datos ni se presenta una recreación como packaging oficial.

## 16. Decisiones pendientes

1. Catálogo inicial de productos y categorías de Ingredora.
2. Campos exactos y normalización de marcas, variantes y unidades.
3. Fuentes públicas y oficiales aceptables para cada categoría.
4. Flujo y evidencia para registrar permisos.
5. Formatos, tamaños máximos y política de optimización de assets.
6. Relación física entre Product Library, Supabase Storage y repositorio Git.
7. Estrategia para cambios de packaging y disponibilidad temporal.
8. Criterios concretos de aprobación de F2 y F3.

## 17. Relación con otros documentos

- Documento 01: estrategia y selección editorial de productos.
- Documento 03: inclusión de productos y assets en Production Packages.
- Documento 04: identidad visual y fidelidad de packaging.
- Documento 06: geometría, materiales, texturas y modelos 3D.
- Documento 11: persistencia, Storage, cuotas y políticas de acceso.
- Documento 12: validaciones y Quality Gate.
- Documento 14: licencias, permisos y presupuesto cero.
