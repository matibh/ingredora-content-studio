# 07 — Personajes y animaciones

**Estado:** especificación funcional y técnica inicial; estilo, rig y rendimiento pendientes de prototipo.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Definir un sistema de personajes 3D estilizados, modulares y reutilizables para las producciones audiovisuales de Ingredora. Los personajes deben poder participar en escenas, interactuar con productos y comunicar emociones mediante acciones comprensibles, sin exigir animación manual desde cero para cada campaña.

La primera versión prioriza personajes estilizados de baja complejidad, con siluetas claras, expresiones legibles y animaciones procedurales o keyframe ejecutables en Three.js. No se busca realismo humano ni simulación corporal avanzada.

## 2. Principios

1. **USD 0 y navegador:** crear, configurar, previsualizar y renderizar personajes en el navegador sin servicios pagos ni software local obligatorio.
2. **Diseño original:** no copiar personajes reconocibles, diseños protegidos, celebridades ni identidades visuales de terceros.
3. **Consistencia:** los personajes comparten reglas de proporción, materiales, ojos, manos, vestuario y acabado.
4. **Modularidad:** cuerpo, cabeza, pelo, ropa y accesorios son piezas reemplazables cuando la estructura lo permita.
5. **Acciones reutilizables:** cada animación debe poder invocarse desde la timeline con parámetros acotados.
6. **Expresión clara:** priorizar lectura emocional en pantalla pequeña y a distancia.
7. **Interacción creíble:** manos, mirada, postura y objeto deben coordinarse; no basta con mover el brazo cerca del producto.
8. **Rendimiento controlado:** limitar huesos, mallas, materiales, texturas y luces según benchmarks reales.
9. **No prometer lo que no existe:** una acción o personaje solo se usa si está implementado, probado y disponible en el registro del motor.

## 3. Dirección de estilo inicial

### 3.1 Tratamiento

La dirección inicial propuesta es **estilizada y simplificada**, con:
- Siluetas reconocibles.
- Proporciones ligeramente caricaturizadas.
- Geometría de baja o media complejidad.
- Rostros legibles con pocos elementos.
- Materiales limpios y controlados.
- Vestuario y accesorios simples.
- Gestos amplios, pero no exagerados sin motivo.

No se fija aún una estética final ni una referencia de franquicia. El diseño deberá integrarse con la identidad visual aprobada en el documento 04 y no imitar estilos protegidos o personajes existentes.

### 3.2 Legibilidad

- La silueta debe leerse contra el fondo.
- Manos y objetos no deben fusionarse visualmente.
- Ojos y boca deben ser visibles en el tamaño final.
- Evitar detalles pequeños que desaparezcan al reducir el video.
- La pose debe comunicar la acción aun si el espectador mira brevemente.

## 4. Roles de personajes

Roles funcionales iniciales:
- **Host/presentador:** introduce el desafío, señala información y mira a cámara.
- **Participante:** observa, piensa, elige o reacciona.
- **Consumidor:** interactúa con productos en situaciones cotidianas.
- **Cocinero:** manipula envases o utensilios en una cocina.
- **Mascota/figura de marca:** recurso opcional, sujeto a aprobación de identidad.
- **Extra/fondo:** personaje secundario para dar vida a una escena sin robar protagonismo.

Son roles, no personajes cerrados. El mismo rig puede admitir variaciones de vestuario, pelo, tonos y accesorios, siempre que los cambios no impliquen estereotipos ni representaciones engañosas.

## 5. Anatomía modular

### 5.1 Componentes

Un personaje podrá componerse de:
- Root y controlador general.
- Pelvis/torso.
- Pecho y espalda.
- Cabeza y cuello.
- Brazos, antebrazos y manos.
- Piernas, pies.
- Ojos, cejas y boca.
- Pelo y accesorios.
- Vestuario.
- Props asociados a una acción.

### 5.2 Proporciones

Definir perfiles de proporción versionados, no valores improvisados por escena:
- Altura total.
- Relación cabeza/cuerpo.
- Ancho de hombros y cadera.
- Longitud de brazos y piernas.
- Tamaño de manos y pies.
- Posición de ojos y boca.

Las proporciones deberán facilitar expresividad y agarre de objetos. Se probarán en plano entero, medio y primer plano.

### 5.3 Variantes

Variantes controladas:
- Forma de pelo.
- Vestuario.
- Paleta de ropa.
- Accesorios.
- Rasgos faciales estilizados.
- Variaciones de complexión no caricaturizadas de forma ofensiva.

No generar variaciones aleatorias que rompan la continuidad entre planos. Una campaña debe fijar IDs y versiones de personaje.

## 6. Rostro y expresiones

Biblioteca inicial de estados faciales:
- Neutral.
- Sonrisa.
- Sorpresa.
- Duda/concentración.
- Alegría.
- Decepción suave.
- Curiosidad.
- Esfuerzo.

La expresión puede implementarse mediante morph targets, cambios de malla, piezas faciales o parámetros procedurales, según el prototipo. No asumir que todos los navegadores/dispositivos soportan el mismo coste de morphing.

Reglas:
- No deformar el rostro de forma grotesca.
- Mantener continuidad facial entre expresiones.
- Evitar emociones ambiguas si la escena depende de una reacción.
- La mirada debe poder dirigirse a cámara, producto, interlocutor o punto de interés.
- Sincronizar expresión con pose y timing.

## 7. Rigging y sistema de movimiento

### 7.1 Rig inicial

El rig deberá cubrir movimientos esenciales:
- Root/hips.
- Spine/chest.
- Neck/head.
- Upper/lower arms.
- Hands.
- Upper/lower legs.
- Feet.

Un esqueleto simple y estable es preferible a un rig complejo difícil de mantener. El número final de huesos se determinará con prototipos y pruebas de rendimiento.

### 7.2 Enfoque técnico

- Three.js AnimationMixer y clips cuando resulte adecuado.
- Animaciones procedurales para gestos, mirada, respiración y ajustes sencillos.
- Keyframes para acciones con timing preciso.
- IK simplificada para alcanzar objetos y apoyar manos cuando el prototipo lo justifique.
- Transiciones suaves entre estados.
- Control determinista desde tiempo de timeline; no depender de delta time acumulado no reproducible.

No incorporar un sistema de captura de movimiento ni servicios externos como dependencia de la primera versión.

### 7.3 Retargeting y compatibilidad

Si se incorporan clips compartidos, deberán cumplir el mismo contrato de rig o pasar por un proceso de adaptación validado. No asumir que cualquier animación GLB funciona con cualquier personaje.

## 8. Biblioteca de acciones

Acciones iniciales a evaluar e implementar por etapas:

### 8.1 Presentación y comunicación
- Idle/respiración.
- Mirar a cámara.
- Saludar.
- Señalar izquierda/derecha/arriba/abajo.
- Presentar un producto con ambas manos.
- Explicar con gesto de manos.
- Asentir o negar.

### 8.2 Interacción con productos
- Acercar la mano.
- Agarrar un paquete.
- Levantar y sostener.
- Girar para mostrar el frente.
- Dejar sobre mesa.
- Abrir tapa o envase compatible.
- Servir o verter, cuando el objeto y la escena lo permitan.
- Oler u observar con curiosidad, si es apropiado.
- Soltar o devolver el producto.

### 8.3 Reacciones
- Sorpresa.
- Duda.
- Pensar.
- Celebrar.
- Reír de forma estilizada.
- Decepción suave.
- Descubrir/revelar.
- Mirar a otro personaje.

### 8.4 Acciones de cocina
- Sostener utensilio.
- Mezclar.
- Verter ingrediente.
- Servir en recipiente.
- Probar o presentar un plato, solo si el contenido y la escena lo requieren.

Cada acción deberá documentar duración base, parámetros, puntos de contacto, props requeridos, expresiones sugeridas, transiciones permitidas y limitaciones.

## 9. Interacción mano-producto

Es un requisito de calidad, no un detalle opcional:
- El personaje debe alcanzar el punto correcto del producto.
- La mano debe cerrar alrededor del objeto sin atravesarlo.
- El objeto debe seguir la mano durante el levantamiento.
- La orientación debe permanecer estable y legible.
- Al soltarlo, el producto debe quedar apoyado en la superficie.
- La acción debe tener anticipación, contacto, movimiento y asentamiento.
- Los puntos de agarre se guardan como anchors del modelo de producto.
- Las acciones deben validar compatibilidad entre tamaño del objeto y personaje.

Para la primera versión se pueden definir anchors manuales por familia de envase. La detección automática de agarre no es requisito.

## 10. Props y accesorios

Los props pueden ser:
- Productos de Product Library.
- Utensilios de cocina.
- Vasos, platos y recipientes.
- Elementos de escenario.
- Accesorios de vestuario.

Cada prop debe tener ID, versión, origen, escala, punto de pivote y estado de derechos cuando corresponda. No duplicar modelos de producto dentro de un personaje: se referencian desde su biblioteca.

## 11. Timeline y composición

Las acciones se invocan desde la timeline como clips:
- character_id y character_version.
- action_id y action_version.
- start_time y duration.
- parámetros permitidos.
- expression/facial state.
- target/prop IDs.
- blend_in y blend_out.
- priority o channel para resolver conflictos.

Los canales de cuerpo, rostro, mirada y manos deben poder combinarse con reglas explícitas. Dos clips no deben controlar simultáneamente el mismo hueso sin política de mezcla definida.

La timeline debe permitir ajustar el timing sin modificar el código del rig.

## 12. Audio y sincronización

- Gestos y reacciones pueden sincronizarse con voz, música o SFX.
- No crear lip-sync automático complejo como requisito inicial.
- Si se usa voz, se podrá alinear una animación simple de boca mediante marcadores o curvas preparadas.
- La acción debe comunicar incluso sin audio.
- La decisión de TTS y voz se mantiene en el documento 09; este documento no asume proveedor ni motor de voz.

## 13. Rendimiento y calidad

- Reutilizar geometrías y materiales.
- Limitar personajes simultáneos según pruebas reales.
- Evitar sombras dinámicas por personaje si no aportan.
- Usar texturas pequeñas cuando el plano lo permita.
- Cargar personajes bajo demanda.
- Liberar recursos al retirar instancias.
- Medir FPS, tiempo de carga, memoria GPU y estabilidad en dispositivos representativos.
- Ofrecer variantes de calidad si se validan técnicamente.
- Revisar clipping, penetración de mallas, pies flotantes, manos atravesando props y cambios bruscos de pose.

No establecer una cantidad máxima universal de personajes hasta medir el motor en hardware objetivo.

## 14. Accesibilidad, representación y seguridad

- Evitar gestos que puedan resultar ofensivos en distintos contextos culturales.
- No asociar rasgos físicos con roles, inteligencia, estatus o atributos negativos.
- No usar semejanzas con personas reales sin autorización.
- No generar avatares que simulen testimonios reales o recomendaciones personales inexistentes.
- Mantener expresiones legibles sin depender exclusivamente del color.
- Revisar el tono de humor y la representación antes de publicar.

## 15. Versionado y almacenamiento

Cada personaje y clip tendrá:
- ID estable.
- Versión.
- Compatibilidad de rig.
- Componentes y materiales.
- Dependencias de assets.
- Acciones disponibles.
- Notas de revisión.
- Estado: draft, review, approved, deprecated.

Los parámetros y metadatos se almacenan de forma declarativa. El código del rig, controladores y acciones reside en el motor versionado en Git. Los assets binarios se almacenan según la política del documento 11, sujetos a cuotas gratuitas.

Una campaña fija versiones de personaje, rig y acciones para que el render pueda reproducirse.

## 16. Presupuesto cero

- No contratar animadores externos, motion capture, APIs generativas ni servicios de rigging.
- No depender de bibliotecas o modelos de pago.
- Verificar licencias comerciales de assets y dependencias.
- Render y animación en navegador; sin granjas de render ni funciones pagas.
- Si un dispositivo no puede sostener la escena, reducir complejidad o detener el render. Nunca activar un fallback pago.

## 17. Criterios de aceptación

- [ ] Existe una dirección estilizada original pendiente de aprobación visual.
- [ ] Los personajes son modulares y versionables.
- [ ] El rig permite cuerpo, cabeza, manos, piernas y mirada.
- [ ] Hay expresiones faciales legibles en móvil.
- [ ] La biblioteca de acciones tiene contratos y compatibilidades.
- [ ] Las interacciones mano-producto usan anchors y evitan clipping visible.
- [ ] Los clips se controlan desde la timeline y son deterministas.
- [ ] Se pueden combinar acciones sin conflictos de huesos.
- [ ] Props y productos se reutilizan por referencia.
- [ ] El rendimiento se valida en dispositivos reales.
- [ ] No se imitan personajes protegidos ni se simulan testimonios.
- [ ] No hay servicios pagos ni dependencias locales obligatorias.

## 18. Decisiones pendientes

1. Diseño visual final de personajes y proporciones.
2. Cantidad de rigs base y variantes iniciales.
3. Implementación concreta de rig procedural o clips.
4. Uso de morph targets versus piezas faciales.
5. Acciones prioritarias para el primer prototipo.
6. Sistema de IK y anchors mano-producto.
7. Compatibilidad con modelos GLB/glTF si se adopta ese formato.
8. Límites de personajes simultáneos y benchmarks.
9. Política de lip-sync y relación con el documento 09.
10. Proceso de aprobación de personajes y vestuario.

## 19. Relación con otros documentos

- Documento 04: identidad visual y dirección artística.
- Documento 05: Product Library y assets de producto.
- Documento 06: modelos 3D y anchors de agarre.
- Documento 08: escenarios, cámara e iluminación.
- Documento 09: audio, voz y sincronización.
- Documento 10: timeline, editor y render.
- Documento 12: Quality Gate.
- Documento 14: licencias, seguridad y presupuesto cero.
