# 06 — 3D Product Studio

**Estado:** especificación funcional y técnica inicial; geometrías y rendimiento pendientes de prototipo.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Definir un sistema propio para crear, configurar, revisar, guardar y reutilizar modelos 3D de productos y packaging mediante Three.js, ejecutado en el navegador.

El Product Studio convierte fichas verificadas de Product Library en activos 3D consistentes. Debe permitir construir desde envases genéricos hasta recreaciones de alta fidelidad basadas en referencias autorizadas, sin confundir aproximaciones con modelos oficiales.

## 2. Principios no negociables

1. **Three.js y código propio:** la geometría y la escena se construyen con código determinista; no se requiere un generador de modelos externo.
2. **USD 0:** no depender de APIs pagas, créditos, servicios de modelado ni render remoto.
3. **Navegador:** modelado, preview y render deben funcionar online sin instalación local.
4. **Reutilización:** un modelo aprobado se referencia desde muchas campañas; no se duplica ni reconstruye sin necesidad.
5. **Fidelidad declarada:** cada modelo muestra su nivel F0–F3 y desviaciones conocidas.
6. **Separación de datos y motor:** las fichas describen parámetros y assets; solo componentes de código revisados y versionados pueden ejecutarse.
7. **Procedencia y derechos:** texturas, logos y etiquetas mantienen referencia a Product Library y sus permisos.
8. **Calidad proporcional al plano:** no gastar polígonos o texturas en detalles que no se ven; priorizar silueta, proporción, etiqueta y luz.

## 3. Alcance funcional

El módulo deberá permitir:
- Crear modelos a partir de plantillas paramétricas de envases.
- Ajustar dimensiones, proporciones, perfiles y partes del packaging.
- Asignar materiales físicos visuales y presets.
- Incorporar etiquetas/texturas autorizadas.
- Crear variantes de color y presentación.
- Configurar tapa, base, costuras, pliegues y detalles.
- Previsualizar con cámaras e iluminación de producto.
- Ejecutar animaciones básicas de presentación.
- Comparar el modelo con referencias visuales.
- Guardar versiones y registrar desviaciones.
- Exportar o empaquetar un activo compatible con el Scene Engine.
- Reutilizar modelos y materiales en campañas.

No pretende reemplazar un software DCC profesional ni construir modelos orgánicos complejos en la primera versión. La prioridad son envases y packaging de alimentos y bebidas.

## 4. Familias de envases

### 4.1 Paquetes flexibles

Ejemplos: yerba, café, snacks, galletitas, arroz, harina y productos secos.

Características geométricas:
- Frente y dorso con volumen.
- Laterales y fuelles cuando correspondan.
- Base expandida o plegada.
- Sellos superior e inferior.
- Esquinas redondeadas o irregulares.
- Deformación sutil y controlada para evitar aspecto de bloque rígido.
- Variación de ancho, alto, profundidad y perfil.

El sistema debe ofrecer perfiles de bolsa vertical, paquete almohada, doypack y bolsa con fuelle como plantillas candidatas. No asumir que todos los productos usan la misma construcción.

### 4.2 Cajas y cartones

- Panel frontal, trasero y laterales.
- Solapas y pliegues visibles cuando el plano lo requiera.
- Bordes ligeramente redondeados según referencia.
- Posibilidad de caja prismática, cartonera o estuche.
- Textura impresa alineada por panel.

### 4.3 Botellas

- Perfil paramétrico por secciones.
- Cuello, hombro, cuerpo, base y tapa.
- Variación de sección circular, ovalada o perfil especial.
- Transparencia y refracción solo cuando sea viable en el navegador.
- Etiqueta envolvente y tapa como piezas separadas.

### 4.4 Latas

- Cilindro con radios y bordes superior/inferior.
- Tapa metálica y anilla cuando el detalle sea relevante.
- Etiqueta o impresión envolvente.
- Variación de altura, diámetro y curvatura.
- Reflejos metálicos controlados.

### 4.5 Frascos y potes

- Cuerpo por perfil, cuello y boca.
- Tapa independiente.
- Materiales de vidrio, plástico o metal según referencia.
- Etiqueta frontal o envolvente.
- Contenido interior solo si la transparencia y el plano lo justifican.

### 4.6 Otros formatos

El sistema debe poder incorporar nuevas plantillas (tubos, bandejas, sachets, blisters, envases compuestos) sin modificar el contrato de los modelos ya existentes. Cada nueva familia requiere pruebas de geometría, materiales y exportación.

## 5. Arquitectura de un modelo

Un producto 3D se compone de piezas identificables y jerárquicas:
- Root: escala, orientación y transform general.
- Body: geometría principal.
- Front/back/side panels: paneles o superficies de impresión cuando aplique.
- Seals/folds/rims: detalles estructurales.
- Cap/closure: tapas, picos o cierres.
- Label/graphics: capas gráficas y texturas.
- Contents: contenido interior opcional.
- Detail meshes: piezas secundarias.

Las piezas deben tener nombres estables para permitir animación, reemplazo de materiales y ajustes sin reconstruir todo el modelo. Los modelos deben declarar unidades, origen, orientación y escala de referencia.

### 5.1 Geometría paramétrica

Cada plantilla expone parámetros permitidos, por ejemplo:
- width, height, depth.
- corner_radius.
- body_profile.
- shoulder_height.
- neck_radius.
- cap_height.
- gusset_depth.
- fold_amount.
- seal_width.
- subdivision/detail_level.

Los rangos y unidades se validan por familia. No permitir valores arbitrarios que generen geometría degenerada, NaN, auto-intersecciones graves o consumo desmedido.

### 5.2 Construcción de mallas

- Priorizar geometría BufferGeometry eficiente.
- Compartir geometrías/materiales cuando sea seguro.
- Mantener normales y UVs consistentes.
- Evitar segmentos excesivos en curvas poco visibles.
- Usar geometría específica para pliegues y sellos en lugar de deformaciones globales improvisadas.
- Aplicar niveles de detalle solo cuando aporten valor y el motor los soporte.
- Liberar geometrías, materiales y texturas al retirar modelos de la escena.

No asumir que una bolsa flexible puede resolverse como una caja con una textura: la silueta, los laterales y los pliegues son parte de su reconocimiento.

## 6. Sistema de materiales

### 6.1 Materiales base

Presets reutilizables:
- Flexible plastic matte.
- Flexible plastic glossy.
- Printed paper.
- Printed cardboard.
- Transparent glass.
- Tinted glass.
- Clear plastic.
- Aluminum.
- Painted metal.
- Ceramic.

Cada preset define parámetros compatibles con el material elegido en Three.js, como color, roughness, metalness, opacity, transmission cuando proceda y mapas disponibles.

### 6.2 Reglas visuales

- Diferenciar material por respuesta a la luz, no solo por color.
- Mantener roughness y metalness dentro de rangos físicamente plausibles.
- Evitar reflejos tan fuertes que oculten la marca o etiqueta.
- No usar transparencia costosa si una solución opaca o estilizada comunica mejor el producto.
- Probar materiales sobre fondos claros y oscuros.
- Mantener iluminación y exposición comparables entre revisiones.

### 6.3 Presets y overrides

Los materiales se almacenan como presets versionados. Un modelo puede aplicar overrides explícitos por pieza, pero debe conservar referencia al preset base y registrar los cambios.

## 7. Etiquetas, gráficos y UVs

### 7.1 Fuentes de textura

Las texturas pueden proceder de:
- Arte oficial entregado con permiso.
- Fotografías propias autorizadas.
- Gráficos originales creados para una recreación conceptual.
- Capas generadas por el propio motor a partir de datos aprobados.

Una imagen de referencia encontrada en Internet no se convierte por eso en textura utilizable.

### 7.2 Aplicación

- UV mapping adecuado a la geometría.
- Panel frontal, dorso y laterales diferenciados cuando sea necesario.
- Etiqueta envolvente para botellas, latas y frascos.
- Resolución ajustada al tamaño del objeto en el render.
- Mipmaps y compresión compatibles con el navegador.
- Evitar estirar logos, textos o proporciones.
- Separar capas traducibles del contenido gráfico fijo.

### 7.3 Texto de packaging

- No inventar ingredientes, datos nutricionales, claims, sellos o textos legales.
- Si una recreación aproximada no permite leer el texto, no generar pseudo-texto que parezca información real.
- La información exacta debe provenir de una fuente autorizada.
- Para campañas bilingües, preferir capas de texto separadas y sustituibles.

## 8. Herramientas de edición y revisión

La interfaz de Product Studio deberá contemplar:
- Viewport 3D con orbit, pan y zoom.
- Vistas frontal, trasera, lateral y perspectiva.
- Controles paramétricos por familia de envase.
- Selector de materiales y presets.
- Gestión de etiquetas y texturas.
- Comparación lado a lado o superposición con referencia.
- Fondo e iluminación de revisión.
- Indicadores de escala, orientación y bounding box.
- Guardado como nueva versión.
- Historial y notas de revisión.

No es necesario exponer un editor de nodos ni una interfaz de modelado profesional. La UX debe estar guiada por tipos de envase y parámetros comprensibles.

## 9. Animaciones de producto

El modelo debe poder participar en acciones reutilizables:
- Aparecer o revelarse.
- Giro parcial o completo.
- Entrada con desplazamiento.
- Caída y aterrizaje.
- Elevación o flotación sutil.
- Apertura de tapa o cierre, si la geometría lo soporta.
- Separación de piezas para explicar el envase.
- Cambio entre variantes autorizadas.

Las animaciones deben ser deterministas y controlables por timeline. Evitar simulaciones físicas complejas en tiempo real cuando una animación keyframe o procedural sencilla sea suficiente. No deformar packaging de forma que sugiera una propiedad que el envase real no tiene.

## 10. Integración con Product Library

Cada modelo debe apuntar a:
- product_id y variant_id.
- product_version.
- fidelity_level F0–F3.
- reference_asset_ids.
- texture_asset_ids.
- rights status relevante.
- known_deviations.
- model_version.
- engine_version mínima compatible.

La Product Library conserva fuentes, hechos y permisos. Product Studio conserva geometría, materiales, UVs, texturas aplicadas, parámetros y revisiones. La campaña fija las versiones concretas utilizadas.

Si un asset pierde autorización, el sistema debe detectar modelos que lo usan y bloquear su nuevo uso publicable hasta resolverlo.

## 11. Guardado, formatos y versionado

- Guardar parámetros y referencias de forma declarativa.
- Los componentes de geometría pertenecen al motor versionado en Git.
- Los modelos y assets finales pueden almacenarse en Supabase Storage, sujeto a cuotas y políticas del documento 11.
- Evaluar GLB/glTF para intercambio y carga eficiente, sin convertirlo en requisito antes de validar exportación/importación y materiales.
- No almacenar binarios pesados en Git.
- No ejecutar scripts adjuntos a modelos o texturas.
- Registrar checksums, tamaño, versión, fecha y procedencia cuando corresponda.

Un modelo debe poder reconstruirse con la misma versión de motor y los mismos parámetros/assets. Cambios de motor que alteren la apariencia requieren pruebas de regresión visual.

## 12. Rendimiento en navegador

- Diseñar para móvil y desktop; validar primero el dispositivo objetivo real.
- Controlar polígonos, draw calls, tamaño de texturas y transparencias.
- Reutilizar materiales y geometrías.
- Limitar luces dinámicas y sombras en tiempo real.
- Usar sombras horneadas o aproximadas cuando sea adecuado.
- Cargar assets bajo demanda.
- Liberar recursos GPU al cerrar o reemplazar modelos.
- Ofrecer preview de menor calidad y render final con calidad superior, si el dispositivo lo permite.
- Mostrar advertencia y permitir reducir calidad cuando falten memoria o capacidad GPU.
- Evitar que el editor cargue todo el catálogo simultáneamente.

No fijar todavía límites universales de polígonos o memoria: deben surgir de pruebas en dispositivos representativos y del presupuesto de almacenamiento.

## 13. Seguridad y robustez

- Validar tipo real, dimensiones y tamaño de archivos importados.
- Sanitizar nombres y metadatos.
- No interpretar archivos de texto o metadata como código ejecutable.
- No permitir que parámetros importados seleccionen módulos arbitrarios.
- Usar un registro de plantillas y materiales permitidos.
- Controlar rangos numéricos y límites de complejidad.
- Tratar modelos externos como datos no confiables.
- No exponer claves privadas en frontend ni en assets.

## 14. Presupuesto cero

- No contratar modeladores, APIs de generación 3D ni render farms.
- No depender de bibliotecas o assets de pago.
- Verificar licencias de cualquier dependencia y asset de terceros antes de incorporarlo.
- El coste operativo debe ser cero; el uso de GPU y almacenamiento se mantiene dentro de cuotas gratuitas verificadas.
- Si el dispositivo no puede renderizar una escena con seguridad, reducir calidad o detener el render; nunca derivarlo a un servicio pago automáticamente.

## 15. Criterios de aceptación

- [ ] Hay plantillas paramétricas para paquetes flexibles, cajas, botellas, latas y frascos.
- [ ] Las plantillas respetan silueta y construcción del tipo de envase.
- [ ] Geometría, materiales y texturas son componentes reutilizables.
- [ ] UVs y etiquetas mantienen proporciones y legibilidad.
- [ ] Se distingue recreación aproximada de alta fidelidad autorizada.
- [ ] Derechos de texturas y logos se comprueban antes del uso publicable.
- [ ] Los modelos pueden versionarse y reutilizarse en campañas.
- [ ] Las animaciones son deterministas y controlables por timeline.
- [ ] El editor permite revisar el modelo desde múltiples ángulos y compararlo con referencias.
- [ ] El rendimiento se valida en dispositivos reales y no se presupone.
- [ ] No se ejecuta código arbitrario importado.
- [ ] No hay dependencia de APIs pagas, modelado externo ni render remoto.

## 16. Decisiones pendientes

1. Plantillas exactas para el primer catálogo de productos.
2. Esquema de parámetros por familia y límites seguros.
3. Estrategia de deformación de bolsas flexibles.
4. Pipeline UV y tratamiento de etiquetas.
5. Formato de persistencia y eventual exportación GLB/glTF.
6. Compatibilidad de materiales y transparencias entre navegadores.
7. Presets de iluminación de revisión.
8. Benchmarks de polígonos, draw calls, texturas y memoria en móvil.
9. Política de thumbnails, previews y versiones históricas.
10. Flujo de aprobación visual y bloqueo por revocación de derechos.

## 17. Relación con otros documentos

- Documento 04: identidad visual, materiales y tratamiento de packaging.
- Documento 05: datos, referencias, variantes y derechos del producto.
- Documento 07: personajes y rigging.
- Documento 08: Scene Engine, cámaras, iluminación y entornos.
- Documento 10: timeline, preview y render.
- Documento 11: almacenamiento, cuotas y permisos.
- Documento 12: control de calidad.
- Documento 14: licencias, seguridad y presupuesto cero.
