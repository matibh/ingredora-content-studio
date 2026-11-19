# Ingredora Originals 002 — Coca-Cola: un día de playa, una Coca bien fría

**Versión vigente:** 4.0 · **Fecha:** 19 de noviembre de 2026  
**Package:** `ingredora-coca-cola-poolside-002`  
**Engine:** Three.js · **Formato:** 720 × 1280 · 60 FPS · 9:16  
**Duración:** 34 segundos · **Desafío vigente:** 6 segundos  
**Estado:** primer render técnico en preparación; requiere revisión visual humana.

## 1. Objetivo creativo

Convertir un momento clásico del verano argentino —pileta, calor y una Coca-Cola bien fría servida en un vaso con hielo— en una experiencia de Ingredora. Cuando el espectador espera el primer sorbo, la escena se congela y aparece la pregunta:

> ¿Sabés qué tiene adentro?

El video no acusa, juzga ni aconseja sobre el consumo del producto. Presenta una composición declarada por el fabricante como un desafío de adivinanza.

## 2. Producto y datos de referencia

- **Producto:** Coca-Cola Sabor Original.
- **ID de producto:** `coca-cola-original-ar`.
- **Marca:** Coca-Cola.
- **Mercado:** Argentina.
- **Categoría:** gaseosa cola.
- **Presentación:** referencia argentina; el registro maestro no fija tamaño.
- **Código de barras:** no registrado.
- **Fuente principal de ingredientes:** sitio oficial de Coca-Cola Argentina.
- **Referencia visual de envase:** publicación de Hiper Libertad para Coca-Cola Sabor Original 500 ml. Esta referencia no convierte el tamaño en un dato confirmado del registro maestro ni implica que el modelo 3D sea una reproducción exacta del envase.

### Declaración de ingredientes utilizada

Transcripción del registro de producto:

`AGUA CARBONATADA, AZÚCAR o JMAF, COL 150 d, ACI 338, ARO, EDU SUCRALOSA (4,3 mg/100 ml). CONTIENE CAFEÍNA.`

Desarrollo editorial legible, conservando el sentido de la declaración:

1. Agua carbonatada.
2. Azúcar o jarabe de maíz de alta fructosa (JMAF).
3. Colorante caramelo IV (E150d).
4. Ácido fosfórico (E338).
5. Aromatizantes.
6. Sucralosa (4,3 mg/100 ml).

**Declaración separada:** contiene cafeína. No se cuenta como un séptimo ingrediente en la lista de seis respuestas aceptadas.

### Respuestas aceptadas por el juego

La ficha del producto en el catálogo de Ingredora registra seis respuestas aceptadas en español e inglés. La producción en español usa los seis nombres anteriores. No agregar otros ingredientes, trazas, alérgenos o claims no presentes en la declaración.

## 3. Fuentes y alcance

1. Coca-Cola Argentina — https://www.coca-cola.com/ar/es/brands/coca-cola  
   **Alcance:** declaración oficial de ingredientes para Coca-Cola Sabor Original.
2. Hiper Libertad — https://www.hiperlibertad.com.ar/coca-cola-sabor-original-500-ml/p  
   **Alcance:** referencia comercial y visual del producto.
3. Imagen de producto — https://hiperlibertad.vtexassets.com/arquivos/ids/210159-800-auto?aspect=true&height=auto&v=638210685969170000&width=800  
   **Alcance:** referencia visual para la forma y colores del envase.

La declaración de ingredientes procede del fabricante. La imagen comercial sirve como referencia de arte; no se utiliza para inferir ingredientes, volumen ni composición.

## 4. Guion y timeline

| Tiempo | Imagen / acción | Texto en pantalla |
|---|---|---|
| 00:00–00:03 | Plano general de verano: pileta, sol, deck y vegetación. | UN DÍA DE CALOR… / PILETA, SOL Y ALGO BIEN FRÍO |
| 00:03–00:07 | La botella se inclina y sirve Coca-Cola en un vaso con hielo. Burbujas y condensación. | EL VASO MÁS ESPERADO DEL VERANO |
| 00:07–00:10 | La acción se congela. El sonido cae y aparece el impacto. | PERO PARÁ… ¿SABÉS QUÉ TIENE ADENTRO? |
| 00:10–00:25 | Desafío completo con cuenta regresiva de 15 a 0. | TENÉS 15 SEGUNDOS / ADIVINÁ SUS INGREDIENTES |
| 00:25–00:31 | Revelación de los seis ingredientes completos. | ESTOS SON SUS INGREDIENTES + lista completa + CONTIENE CAFEÍNA |
| 00:31–00:34 | End card de Ingredora. | ¿CUÁNTOS ACERTASTE? / INGREDORA.COM / ENTRÁ Y JUGÁ |

El contador ocupa exactamente 15 segundos: de 00:10 a 00:25. La revelación no comienza antes.

## 5. Dirección visual Three.js

### Entorno
- Pileta exterior en un día luminoso.
- Agua azul con ondulación procedural determinista.
- Deck de piedra clara, vegetación y sombrilla.
- Sol cálido, iluminación natural estilizada y reflejos.
- Profundidad suficiente para separar el producto del fondo.

### Producto
- Botella 3D procedural con líquido oscuro, tapa roja y etiqueta roja.
- Texto Coca-Cola recreado como elemento gráfico de referencia; no es un archivo oficial de marca.
- Gotas de condensación en la botella.
- Vaso de vidrio transparente, líquido cola, cubos de hielo y burbujas.
- Chorro de bebida animado durante el vertido.

### Cámara y animación
- Apertura amplia para establecer el contexto.
- Dolly-in progresivo hacia botella y vaso.
- Inclinación de botella y aparición del chorro.
- Congelamiento narrativo alrededor del segundo 7.2.
- Mantener el entorno detenido durante la pregunta y el desafío.
- Composición vertical 9:16 y textos dentro de zonas seguras.

### Revelación
- Fondo oscuro para legibilidad.
- Seis ingredientes en lista completa.
- Cafeína como declaración separada.
- No usar imágenes abstractas de ingredientes como evidencia de la composición; son solo recursos visuales si se incorporan más adelante.

## 6. Audio

La primera versión utiliza:
- Música procedural original sintetizada en navegador.
- Textura de burbujeo/vertido procedural durante la acción de servir.
- Dos acentos breves de hielo/vidrio.
- Impacto de congelamiento.
- Ticks del cronómetro.
- Acorde/chime de revelación.

**Voz en off:** no incluida en la primera versión técnica. El mensaje completo se entiende mediante texto en pantalla. Una locución humana autorizada puede agregarse en una versión posterior sin cambiar la estructura visual.

No utilizar música comercial ni grabaciones extraídas de anuncios de Coca-Cola.

## 7. Restricciones editoriales

- No presentar el video como campaña oficial, patrocinada o aprobada por Coca-Cola.
- No insinuar que los ingredientes son peligrosos.
- No utilizar frases alarmistas como “lo que no quieren que sepas”.
- No presentar la cafeína como séptimo ingrediente aceptado.
- No afirmar tamaño de botella en el video.
- No alterar el orden ni inventar ingredientes.
- No convertir el contenido en consejo médico o nutricional.
- La botella 3D es una recreación estilizada, no una fotografía oficial ni una reproducción exacta del packaging.

## 8. Metadatos de publicación

**Título:** El vaso más esperado del verano… pero ¿sabés qué tiene adentro?  
**Descripción:** Un día de calor, pileta y una Coca bien fría. Pero pará: ¿podés adivinar sus ingredientes en 15 segundos?  
**CTA:** ¿Cuántos acertaste? Jugá en Ingredora.com.  
**Hashtags:** #Ingredora #DesafioDeIngredientes #CocaCola #CuantoSabes  
**Plataformas:** TikTok, Instagram Reels, YouTube Shorts.  
**Formato:** vertical 9:16.

## 9. Control de calidad antes de aprobar

- [ ] Build de TypeScript y Vite exitoso.
- [ ] Render WebM generado en navegador.
- [ ] Verificar que la botella y el vaso no se solapen.
- [ ] Verificar que el chorro conecte visualmente la botella con el vaso.
- [ ] Verificar que el vaso y el hielo sean legibles en móvil.
- [ ] Verificar congelamiento y cronómetro de 15 segundos.
- [ ] Verificar lista completa, ortografía y legibilidad.
- [ ] Verificar cafeína separada de las seis respuestas.
- [ ] Escuchar música, vertido, hielo, ticks e impacto; comprobar ausencia de clipping.
- [ ] Revisar que no se afirme que el contenido es publicidad oficial.
- [ ] Aprobar manualmente antes de convertir a MP4 y subir a «Contenido a subir».

## 10. Archivos

- Paquete: `public/studio/packages/coca-cola-poolside.v1.json`
- Motor de escena: `src/engine/cocaColaPoolside.ts`
- Integración de render: `src/engine/renderer.ts`
- Diseño sonoro procedural: `src/engine/audio.ts`
- Catálogo de producciones: `public/studio/productions.json`

El render inicial es un borrador técnico. No se considera aprobado ni se publica automáticamente.

## 11. Revisión visual v2 — corrección de escena

La primera composición se consideró insuficiente porque el encuadre vertical alejaba demasiado la botella y el vaso, mientras que el fondo, la niebla y el agua compartían una gama celeste que reducía el contraste.

Cambios aplicados al motor:
- Cámara más cercana y con movimiento de aproximación más contenido; el objetivo queda centrado en botella y vaso.
- Fondo y niebla en tono cálido de verano.
- Agua de pileta en teal profundo, sin transparencia que lave el color.
- Deck en arena cálida, líneas de pileta claras y vegetación verde.
- Iluminación de relleno cálida para separar el vidrio, el líquido oscuro y la etiqueta roja.
- El congelamiento usa un destello cálido suave en vez de cubrir toda la imagen con un velo celeste.

El diseño sonoro continúa siendo original y procedural: textura de efervescencia/vertido, acentos de hielo, golpe de congelamiento, ticks del contador y acorde de revelación. No se agregan grabaciones comerciales ni se presenta la pieza como publicidad oficial.

**Pendiente de validación visual:** volver a renderizar desde el navegador y revisar el WebM real en móvil. El cambio de código y el build de Pages no sustituyen la inspección del video. No aprobar ni subir hasta revisar el resultado.

## 12. Voz en off y subtítulos palabra por palabra — versión 3

La versión 3 incorpora locución femenina neuronal mediante **Edge TTS**, con la voz es-AR-ElenaNeural (español argentino), velocidad +10%, tono +4Hz y volumen +12%.

La narración se genera por bloques para respetar los cortes de imagen. La ventana de 15 segundos para adivinar y la revelación de ingredientes permanecen deliberadamente sin locución: la voz no lee la lista de ingredientes.

### Guion de locución

| Inicio previsto | Locución |
|---:|---|
| 00:00.22 | «Un día de calor…» |
| 00:03.10 | «Una Coca bien fría, con hielo y burbujas.» |
| 00:07.42 | «Pero pará… ¿sabés qué tiene adentro?» |
| 00:10.50 | «Tenés quince segundos para adivinar sus ingredientes.» |
| 00:29.45 | «¿Cuántos acertaste?» |\n| 00:31.60 | «¡Jugá en Ingredora!» |

### Sincronización

- Edge TTS entrega eventos WordBoundary; el generador conserva text, start y end de cada palabra.
- Cada bloque de voz se ubica en su instante de escena y se mezcla en una pista MP3 de 34 segundos.
- El renderizador dibuja subtítulos sobre el video, palabra por palabra: las palabras ya pronunciadas permanecen visibles y la palabra activa se resalta.
- La música baja de volumen automáticamente cuando hay narración. Los efectos originales permanecen en la mezcla.
- No se inventan tiempos manuales: las marcas se derivan de los eventos de Edge TTS.
- La pieza no se aprueba hasta revisar reproducción, pronunciación, sincronización y mezcla real.

### Archivos

- Generador: scripts/generate-coca-cola-poolside-voice.py
- Workflow: .github/workflows/generate-coca-cola-poolside-voice.yml
- Voz: public/studio/audio/coca-cola-poolside-v2-voice-es-AR.mp3
- Tiempos por palabra: public/studio/audio/coca-cola-poolside-v2-word-timings.json
- Paquete: public/studio/packages/coca-cola-poolside.v1.json
- Motor de subtítulos: src/engine/renderer.ts

El audio y el JSON de tiempos se generan en GitHub Actions usando el cliente gratuito de Edge TTS; no se exponen credenciales en el navegador. La generación no publica el video ni aprueba la producción.


## 13. Revisión integral 4.0 — playa, vertido realista, 60 FPS

La versión 4.0 sustituye el entorno de pileta por una escena de playa de mediodía. Esta sección prevalece sobre las direcciones visuales y los tiempos de las versiones anteriores.

### Escena y arte 3D

- Arena cálida con textura procedural de grano, vetas y pequeñas conchas.
- Mar turquesa con movimiento suave, espuma fina y franja de arena húmeda.
- Cielo azul con gradiente atmosférico, nubes delicadas con deriva lenta y sol con halo cálido.
- Iluminación direccional de mediodía, rebote de cielo, sombras suaves de alta resolución y materiales PBR con reflejos controlados.
- Elementos de playa integrados en segundo plano: palmera, sombrilla a paneles, toalla rayada, conservadora y accesorios.
- Botella 3D con silueta PET más trabajada, hombros, cuello abierto, etiqueta roja, tapa retirada y condensación.
- Vaso con paredes y borde de vidrio, base gruesa, cola, cubos de hielo facetados, burbujas y gotas de salpicadura.

### Vertido y cámara

- La botella se mantiene vertical en el inicio y rota progresivamente hacia una posición de servido natural.
- El chorro ya no es un cilindro fijo: su punto inicial se calcula transformando la posición real de la boca de la botella, y su punto final queda alineado con la boca del vaso. La orientación y la longitud del chorro se recalculan en cada fotograma.
- El nivel de líquido aumenta durante el vertido; el hielo reacciona sutilmente y se generan pequeñas salpicaduras.
- Cámara con apertura general de playa, acercamiento macro al cuello de la botella y al vaso durante el vertido, pausa de impacto al congelarse la escena y retirada suave para la revelación y el cierre.
- Composición vertical y foco visual en el producto; sin desenfoque artificial que comprometa la lectura.

### Nuevo timeline

| Tiempo | Acción |
|---|---|
| 00:00–00:03 | Plano de playa de mediodía y producto |
| 00:03–00:07.2 | Acercamiento macro: botella inclinada y Coca-Cola cayendo desde la boca al vaso con hielo |
| 00:07.2–00:10 | Congelamiento y pregunta |
| 00:10–00:16 | Cuenta regresiva exacta de **6 segundos** |
| 00:16–00:29.35 | Revelación de seis ingredientes y declaración separada de cafeína |
| 00:29.35–00:34 | Cierre de Ingredora |

### Voz y subtítulos

La locución sigue siendo Edge TTS, Elena, español argentino. Se regenera el bloque de voz del desafío para decir «Tenés seis segundos para adivinar sus ingredientes». La locución no lee la lista de ingredientes.

Los subtítulos palabra por palabra se mantienen basados en los eventos reales WordBoundary de Edge TTS. El render calcula el ancho de cada palabra, envuelve frases en líneas, reduce tipografía si hace falta y mantiene el panel dentro de márgenes seguros. Ninguna palabra puede superar el ancho útil del panel; el panel se mantiene dentro del 94% inferior del cuadro.

### Render y control técnico

- 720 × 1280, 9:16, **60 FPS**, 2.040 fotogramas para 34 segundos.
- Oleaje y movimiento de nubes calculados desde el tiempo de la escena, no acumulados por fotograma; mantienen la misma velocidad visual a 60 FPS.
- Caché de render invalidada únicamente para Coca-Cola; el render de Nutella conserva su clave anterior.
- Build de TypeScript/Vite y despliegue de Pages obligatorios antes de revisar el render.
- Revisión visual y auditiva humana obligatoria antes de aprobar. La actualización técnica no implica aprobación ni subida automática.

### Archivos principales

- Escena de playa y modelos: `src/engine/cocaColaPoolside.ts`
- Cámara, sombras, render y subtítulos: `src/engine/renderer.ts`
- Música y efectos del contador: `src/engine/audio.ts`
- Guion Edge TTS: `scripts/generate-coca-cola-poolside-voice.py`
- Paquete de render: `public/studio/packages/coca-cola-poolside.v1.json`

**Estado:** revisión visual 4.0 en construcción. No aprobar ni subir hasta reproducir el WebM de 60 FPS y comprobar el macro del vertido, la orientación del envase, todos los subtítulos y el balance de audio.


## 14. Corrección del vertido y eliminación de la mano — versión 5

Se eliminó por completo el modelo de brazo, palma y dedos. La botella queda sin extremidad visible ni geometría humana improvisada.

### Origen del líquido

El chorro no se posiciona mediante un cilindro fijo ni se conecta a un punto externo arbitrario. Su primer anillo se ancla al centro de la abertura interior del cuello de la botella, transformado a coordenadas globales después de aplicar la inclinación de cada fotograma.

### Trayectoria bajo gravedad

- La velocidad inicial se orienta según el eje real de la boquilla de la botella.
- La trayectoria se calcula con movimiento balístico: posición inicial + velocidad de salida × tiempo + aceleración gravitatoria × tiempo² / 2.
- El tubo del chorro se deforma en cada fotograma siguiendo esa trayectoria; su sección transversal tiene una variación sutil para evitar el aspecto de tubo rígido.
- Las gotas secundarias nacen desde la misma boca y siguen la misma velocidad inicial y gravedad.
- El punto final de la trayectoria se transforma al espacio local del vaso y alimenta el efecto de impacto dentro del diámetro del vidrio.

### Reacción del vaso

- El nivel de Coca-Cola aumenta desde el momento en que comienza el vertido.
- La superficie del líquido tiene ondulación y pequeñas ondas de impacto.
- El hielo recibe una perturbación sutil mientras entra la bebida.
- La espuma y las gotas de impacto se ubican alrededor del punto de entrada dentro del vaso.
- El audio de efervescencia comienza junto con el vertido visible, a partir de 00:03.90.

### Precisión técnica

Esto es una simulación visual procedural determinista basada en cinemática balística, geometría deformable y partículas; no es un solver de dinámica de fluidos computacional (CFD). Busca representar de forma creíble el flujo, el impacto y la subida del líquido en un render reproducible a 60 FPS, sin depender de servicios externos.

**Control obligatorio:** inspeccionar el WebM a velocidad normal y cuadro a cuadro en el inicio del chorro, contacto con el líquido, gotas, nivel y cierre. Comprobar especialmente que ningún tramo del flujo empiece fuera de la boca ni termine fuera del vaso.
