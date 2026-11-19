# Ingredora Originals 002 — Coca-Cola: el vaso más esperado del verano

**Versión:** 1.0 · **Fecha:** 19 de noviembre de 2026  
**Package:** `ingredora-coca-cola-poolside-002`  
**Engine:** Three.js · **Formato:** 720 × 1280 · 30 FPS · 9:16  
**Duración:** 34 segundos · **Desafío:** 15 segundos  
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
| 00:31.05 | «¿Cuántos acertaste? Entrá a Ingredora punto com y jugá.» |

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
