# 03 — ChatGPT: producción y protocolo

**Estado:** especificación inicial del flujo humano-asistido.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Definir cómo se trabaja entre ChatGPT y Ingredora Content Studio para transformar una idea en una producción estructurada, verificable, editable y renderizable.

El contrato operativo involucra:
- **Usuario:** define objetivos, aporta contexto, revisa y aprueba.
- **ChatGPT:** investiga, propone, dirige, diseña y prepara artefactos.
- **GitHub:** conserva documentación, código, plantillas y versiones.
- **Ingredora Content Studio:** importa, valida, organiza, previsualiza, renderiza y almacena.
- **Supabase:** persiste proyectos, metadatos, assets y outputs autorizados.

## 2. Principio fundamental: no existe una conexión automática con esta conversación

ChatGPT en esta conversación no es un servicio backend invocable por la aplicación. Sin una API o servicio externo, la app no puede pedirle a esta conversación que genere ideas, código, voz o campañas en segundo plano.

Por tanto:
- ChatGPT prepara materiales durante una interacción explícita con el usuario.
- Los resultados se entregan como archivos, manifiestos, instrucciones, código versionado o paquetes importables.
- El usuario inicia la importación en la aplicación.
- La aplicación no inventa ni completa contenido creativo que falte.
- La aplicación no muestra que ChatGPT está trabajando si no recibió un paquete real.
- La aplicación no realiza llamadas ocultas a APIs generativas ni proveedores pagos.

El paquete debe incluir contexto suficiente para reconstruir la producción aunque la conversación termine y se retome más adelante. No puede depender de frases como “hacé lo mismo que antes”.

## 3. Responsabilidades y límites

### 3.1 ChatGPT

ChatGPT puede preparar investigación de producto, marca y plataformas; brief, objetivo, audiencia, mensaje y CTA; guion, storyboard, duración y ritmo; dirección de arte; shot list, cámara e iluminación; escenas Three.js, geometrías, materiales y animaciones; personajes y acciones; packaging aproximado o fiel según fuentes y derechos; títulos, overlays, subtítulos, copies, hashtags y metadatos; adaptaciones por idioma, formato y plataforma; checklist de calidad, riesgos y supuestos; y código nuevo o cambios al motor cuando haga falta.

ChatGPT debe distinguir hechos verificados, hipótesis creativas y datos aportados por el usuario. No debe inventar características del producto, ingredientes, claims, patrocinios, resultados del juego, ni permisos de uso.

### 3.2 Usuario

El usuario define objetivo y restricciones; proporciona o aprueba fuentes oficiales, logos, fotografías y derechos; decide si una propuesta se produce; revisa previews y resultados; aprueba la versión final y cualquier publicación; y decide qué assets se conservan o eliminan.

### 3.3 Aplicación

La aplicación importa y valida paquetes; verifica versiones y dependencias; resuelve componentes permitidos; muestra errores accionables; permite editar parámetros soportados; ejecuta preview y render; y guarda outputs y metadatos.

La aplicación no crea claims ni rellena campos creativos faltantes. No ejecuta código arbitrario recibido desde una base de datos o paquete no confiable.

## 4. Unidad de intercambio: Production Package

Cada producción se entrega como un **Production Package** versionado. Puede representar una campaña completa, un master audiovisual o una variante de idioma/formato.

Estructura lógica propuesta (no todos los archivos son obligatorios):

- package-manifest.json
- brief.md
- script.md
- storyboard.md
- quality-checklist.md
- metadata/ (copies y metadatos por idioma/plataforma)
- scenes/ (una especificación por escena)
- assets/references/
- assets/textures/
- assets/audio/
- assets/graphics/
- code/README.md (notas de cambios del motor, si aplica)

El paquete debe ser autocontenido en instrucciones y referencias. Los archivos requeridos dependen de las capacidades utilizadas y deben declararse en el manifiesto.

### 4.1 Manifiesto

El manifiesto es el punto de entrada y debe declarar como mínimo conceptual:

| Campo | Propósito |
|---|---|
| package_id | Identificador estable y único |
| package_version | Versión del paquete |
| schema_version | Versión del contrato de datos |
| title | Nombre legible |
| campaign_id | Campaña relacionada |
| language | Idioma y variante regional |
| aspect_ratio | Relación de aspecto |
| resolution | Resolución objetivo |
| fps | Fotogramas por segundo |
| target_duration | Duración estimada o exacta |
| scenes | Orden y referencias a escenas |
| assets | Recursos requeridos y procedencia |
| engine_requirements | Versión mínima y componentes necesarios |
| deliverables | Outputs esperados |
| validation_profile | Perfil de validación |
| created_at | Fecha de preparación |
| change_summary | Cambios respecto de versión anterior |

El schema real definirá tipos, campos obligatorios, límites, enums y reglas. No se acepta un paquete solo porque el JSON sea sintácticamente válido.

## 5. Separación entre datos y código ejecutable

Esta es una regla de seguridad central.

### 5.1 Contenido declarativo

Los paquetes describen escenas usando datos: IDs de componentes, parámetros, referencias a assets, tiempos, textos, posiciones, materiales permitidos y acciones registradas.

Ejemplos conceptuales de identificadores: product.flexible-pouch.v1, macro-dolly-in, package.rotate-reveal. Son ilustrativos; no implican que esos componentes estén implementados.

### 5.2 Código del motor

Cuando una producción necesite una capacidad nueva:
1. ChatGPT prepara el código y explica alcance, dependencias y riesgos.
2. El código se incorpora al repositorio mediante un cambio versionado.
3. Se revisa y prueba.
4. La app se despliega con esa versión aprobada del motor.
5. El paquete declara la versión mínima compatible y referencia el componente registrado.

No descargar ni ejecutar JavaScript arbitrario desde Supabase, Storage o un paquete de campaña. No usar eval, Function, imports dinámicos no controlados ni scripts aportados por assets.

### 5.3 Parámetros seguros

- Validar tipos, rangos, unidades y valores permitidos.
- Rechazar propiedades desconocidas en campos sensibles.
- Limitar duración, escenas, resolución y recursos.
- Validar rutas y referencias para impedir path traversal.
- Rechazar URLs remotas no autorizadas.
- El manifiesto no puede sobrescribir configuración de seguridad.

## 6. Flujo completo de producción

### Fase A — Brief

El usuario plantea objetivo, producto, audiencia, plataforma o idea. ChatGPT hace las preguntas imprescindibles, investiga cuando corresponde y entrega:
- Objetivo de comunicación.
- Audiencia y mercado.
- Producto y datos verificados.
- Mensaje principal y concepto creativo.
- CTA.
- Idioma y variante regional.
- Plataforma y formato.
- Duración estimada.
- Restricciones, derechos y riesgos.
- Criterios de éxito.

Si falta información crítica (por ejemplo, autorización para usar el logo oficial), queda pendiente y no se asume.

### Fase B — Guion y storyboard

ChatGPT prepara guion completo y texto hablado si aplica; storyboard por escena y tramo temporal; qué se ve, qué ocurre y qué se escucha; producto y assets presentes; acción, cámara, iluminación y transición; texto en pantalla y subtítulos; duración, ritmo e intención narrativa.

Los tiempos de escenas deben sumar la duración total declarada, con tolerancia explícita si hay transiciones u overlays solapados.

### Fase C — Especificación técnica

Por cada escena se define:
- ID estable y orden.
- Duración y timestamps.
- Entorno y componentes.
- Productos/personajes requeridos.
- Cámara y movimientos.
- Iluminación y materiales.
- Animaciones y eventos.
- Textos, gráficos y subtítulos.
- Música, voz, SFX y niveles.
- Dependencias y assets.
- Parámetros de render y validación.

Los IDs no cambian por una corrección menor de texto o cámara; cambian si la escena pasa a representar una unidad creativa distinta.

### Fase D — Empaquetado

ChatGPT comprueba que los archivos referenciados estén presentes o declarados como dependencias externas autorizadas; actualiza manifiesto y resumen de cambios; declara versiones de schema y motor; incluye checklist y supuestos; registra origen, licencia y fidelidad de recursos; y entrega el paquete listo para importar o identifica claramente qué bloquea la entrega.

### Fase E — Importación y validación

La app valida en capas:
1. Integridad del paquete y archivos.
2. JSON/schema y versiones.
3. IDs, referencias y dependencias.
4. Compatibilidad del motor y componentes registrados.
5. Derechos y procedencia declarados.
6. Límites de duración, recursos y resolución.
7. Preflight de render y codecs.

Resultados:
- **Error bloqueante:** impide importar o renderizar.
- **Advertencia:** permite continuar con confirmación o revisión.
- **Información:** dato útil sin acción requerida.

La app no corrige silenciosamente el contenido creativo. Puede ofrecer una sugerencia técnica explícita, pero el cambio debe quedar visible y versionado.

### Fase F — Preview, feedback y revisión

1. La app genera preview de baja calidad.
2. El usuario revisa ritmo, producto, texto, cámara, audio y coherencia.
3. El usuario comunica cambios a ChatGPT o edita parámetros soportados.
4. ChatGPT devuelve nueva versión o parche identificado.
5. La app compara versiones y marca escenas/recursos modificados.
6. Solo se re-renderizan escenas afectadas y sus dependencias.

La versión anterior se conserva hasta confirmar que la nueva es válida.

### Fase G — Render final y aprobación

1. Preflight de capacidades.
2. Render por escena.
3. Codificación y muxing.
4. Validación del archivo final.
5. Subida a Storage y confirmación.
6. Quality Gate editorial/legal.
7. Aprobación humana.
8. Preparación de publicación o paquete de distribución.

Render completo no equivale a campaña aprobada. Campaña aprobada no equivale a publicada.

## 7. Contrato de comunicación y feedback

Cada pedido de cambio debe identificar:
- package_id y package_version actual.
- Escena o recurso afectado.
- Comportamiento observado.
- Cambio solicitado.
- Elementos que deben permanecer intactos.
- Prioridad: bloqueante, importante o cosmética.

ChatGPT responde con resumen de cambios, archivos/escenas afectados, elementos que no cambiarán, nueva versión y pruebas necesarias.

No se regenera toda la campaña por una corrección localizada. Si el pedido es cambiar solo el color del paquete, se conserva guion, escenas, cámara, audio y estructura salvo dependencia demostrable.

## 8. Versionado y compatibilidad

Se distinguen tres versiones independientes:

1. **Package version:** cambia cuando se modifica el contenido de una producción.
2. **Schema version:** cambia cuando cambia la estructura o significado del contrato.
3. **Engine version:** cambia cuando se modifica runtime, componentes o comportamiento.

Reglas:
- Todo paquete declara las tres versiones.
- La app rechaza schemas incompatibles y explica la versión requerida.
- Cambios compatibles pueden migrarse mediante transformación explícita y registrada.
- No modificar un paquete importado sin crear una nueva revisión.
- Mantener historial y poder volver a la última versión válida.
- Cada render conserva referencia exacta al paquete, schema y engine utilizados.

## 9. Investigación, fuentes y veracidad

Cuando la campaña se base en un producto real:
- Priorizar web oficial de la marca, envase oficial y fuentes primarias.
- Registrar URL, fecha de consulta y dato extraído.
- Diferenciar texto visible en packaging de información confirmada por otra fuente.
- No inferir ingredientes, peso, origen, certificaciones o claims desde una imagen borrosa.
- Documentar contradicciones y solicitar confirmación.
- No inventar logos ni presentar una recreación aproximada como packaging oficial.

Para tendencias, memes, noticias o referencias culturales: comprobar vigencia y contexto, revisar derechos de imagen/música/marcas/personajes y crear una composición original, no copiar piezas de terceros.

## 10. Idiomas y variantes

Cada paquete define idioma principal y variantes:
- Español argentino: natural, cercano y comprensible regionalmente.
- Inglés: adaptación creativa, no traducción palabra por palabra.
- No mezclar idiomas accidentalmente dentro de una pieza.
- Mantener sincronía entre guion, texto, subtítulos, metadata y CTA.
- Las variantes comparten identidad visual, pero pueden adaptar humor, ritmo y referencias.
- Cada master tiene validación propia de textos y subtítulos.

## 11. Derechos, privacidad y seguridad

- Registrar fuente y estado de autorización de cada asset.
- No importar recursos con derechos desconocidos como utilizables.
- No usar logos, fotos, música, tipografías, personajes o voces sin base legítima.
- No incorporar datos privados, credenciales ni secretos.
- No incluir respuestas secretas, pools de Daily ni información interna del juego.
- Tratar texto, nombres de archivo, metadata y recursos externos como datos no confiables.
- No ejecutar scripts de assets ni paquetes.
- La aprobación final corresponde al usuario.

## 12. Entregables mínimos de ChatGPT

Para una producción estándar:
- Brief.
- Guion.
- Storyboard temporizado.
- Manifiesto.
- Especificación de escenas.
- Lista de assets y procedencia.
- Copy y metadata por plataforma/idioma.
- Checklist de calidad.
- Notas de implementación y dependencias.
- Resumen de versión y cambios.

Para una modificación localizada:
- Paquete y versión base.
- Archivos y escenas afectados.
- Cambio propuesto.
- Elementos preservados.
- Nueva versión/parche.
- Validaciones necesarias.

Una campaña simple puede omitir entregables no aplicables, pero el manifiesto debe indicarlo.

## 13. Plantilla orientativa de solicitud

El usuario podrá iniciar una producción con una instrucción como esta:

> Prepará una producción para Ingredora. Objetivo: [objetivo]. Producto: [producto y fuente]. Audiencia/mercado: [audiencia]. Plataforma/formato: [plataforma, vertical u horizontal]. Idioma: [es-AR / en / otro]. Duración: [rango]. Recursos disponibles: [logos, fotos, modelos, audio]. Restricciones: presupuesto USD 0, derechos verificados, sin claims no comprobados y sin revelar respuestas secretas del juego. Entregá el Production Package completo según el protocolo de Ingredora Content Studio.

Es orientativa, no un formulario obligatorio. No hace falta tener todos los datos para explorar una idea.

## 14. Criterios de aceptación

- [ ] La app no depende de una llamada automática a esta conversación.
- [ ] Existe paquete explícito y versionado como unidad de intercambio.
- [ ] Manifiesto y schemas validan integridad y compatibilidad.
- [ ] Datos declarativos están separados del código ejecutable.
- [ ] La app solo ejecuta componentes registrados y aprobados.
- [ ] ChatGPT entrega brief, guion, storyboard, escenas, assets y checklist según corresponda.
- [ ] Se registran fuentes, derechos, idioma y supuestos.
- [ ] Errores bloqueantes impiden renderizar.
- [ ] Advertencias se muestran y requieren decisión cuando corresponde.
- [ ] Se puede revisar una nueva versión sin perder la anterior.
- [ ] Una modificación localizada no obliga a regenerar toda la campaña.
- [ ] Render, aprobación y publicación son estados distintos.
- [ ] No se incorporan APIs generativas pagas ni gastos automáticos.

## 15. Decisiones pendientes

1. JSON Schema formal de manifiesto, campaña, escena y producto.
2. Formato de archivo y mecanismo de importación/exportación.
3. Importación desde ZIP, GitHub o ambas opciones.
4. Convención final de IDs, nombres y checksums.
5. Estrategia de parches y comparación visual.
6. Catálogo inicial de componentes Three.js permitidos.
7. Política de migración entre versiones de schema y engine.
8. Qué metadatos se guardan en Supabase y qué queda en GitHub.
9. Procedimiento de aprobación de cambios del motor.

## 16. Relación con otros documentos

- Documento 00: visión, alcance y principios.
- Documento 01: estrategia editorial y objetivos.
- Documento 02: arquitectura, fronteras de ejecución y persistencia.
- Documento 04: identidad visual.
- Documento 05: catálogo de productos y procedencia.
- Documento 06: Product Studio.
- Documento 10: editor, render, checkpoints y recuperación.
- Documento 11: persistencia, buckets, cuotas y seguridad.
- Documento 12: Quality Gate.
- Documento 14: presupuesto cero, seguridad y licencias.
- Documento 15: roadmap, piloto y pruebas.
