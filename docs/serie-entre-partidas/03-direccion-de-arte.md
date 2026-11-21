# 03 — Dirección de arte y consistencia visual

## Decisión visual aprobada

- **Técnica:** ilustración 2D vectorial moderna.
- **Contorno:** medio, limpio y definido.
- **Paleta:** cálida y colorida.
- **Personalidad gráfica:** expresiva, amigable, contemporánea y reconocible.
- **Objetivo:** que cada protagonista sea identificable por su silueta, rostro, vestuario y color incluso en una pantalla pequeña.

No buscar un aspecto infantil genérico ni copiar el lenguaje visual exacto de una serie existente. Crear una identidad original para Ingredora.

## Prototipo visual v0 — referencia no canónica

Se generó un primer animatic vertical de 9 segundos para probar composición, paleta, lectura del elenco y ritmo de una conversación en el departamento. El prototipo y su fotograma vectorial fuente están registrados en [05 — Prototipo visual y prepiloto v0](./05-prototipo-visual-v0.md).

**Importante:** los cinco diseños que aparecen son exploratorios. No reemplazan las fichas de personajes ni constituyen modelos maestros aprobados. No deben copiarse automáticamente a episodios futuros. La paleta y las proporciones finales siguen pendientes de aprobación.

## Lámina maestra preliminar v1

El primer rediseño de siluetas ya está en el repositorio:

- [Lámina maestra vectorial v1](../../public/studio/series/entre-partidas/characters/lineup-v1.svg)

La hoja diferencia la silueta de cada protagonista:
- Martina: cintura más definida y cadera suavemente más ancha; blusa prolija y pantalón recto.
- Bruno: hombros anchos, torso deportivo y buzo con capucha.
- Tomás: el más alto y delgado, brazos y piernas largos, camisa abierta sobre remera.
- Valentina: chaqueta entallada, cintura marcada y pelo largo ondulado.
- Ernesto: más bajo y robusto, cardigan, pelo gris, barba corta y anteojos.

**Estado:** primer diseño de trabajo; no constituye aprobación definitiva. La cara, el pelo, el vestuario y las proporciones podrán ajustarse después de revisar la lámina y el primer render animado.

## 1. Lenguaje visual

- Formas claras y simplificadas, con personalidad.
- Siluetas diferenciadas; evitar que los cinco tengan el mismo cuerpo y solo cambie el pelo.
- Rostros expresivos y legibles a tamaño móvil.
- Ojos, cejas y boca con rango suficiente para sostener comedia.
- Manos y gestos legibles, sin detalle innecesario.
- Fondos cálidos con menos contraste que los personajes para priorizar la lectura.
- Composición pensada desde el inicio para 9:16.
- Evitar texturas complejas, ruido visual y detalles que no sobrevivan a la compresión de redes.

## 2. Paleta global

La paleta final se definirá en tokens HEX al aprobar el primer escenario y los cinco personajes. Como guía inicial:

- Crema cálido para paredes y fondos claros.
- Terracota y coral para acentos.
- Amarillo mostaza para energía y objetos destacados.
- Verde hoja y verde Ingredora como acentos de marca.
- Azul petróleo o azul medio para equilibrar.
- Marrones cálidos y grafito para contornos y elementos neutros.

La paleta debe ser colorida, pero no saturar cada plano. Reservar el verde de Ingredora para elementos de juego, marca o detalles narrativos; no vestir a todos los personajes de verde.

## 3. Contorno

Contorno de grosor medio, consistente entre personajes y objetos. Evitar:
- Contornos negros demasiado gruesos que infantilicen la estética.
- Líneas ultrafinas que desaparezcan en móvil.
- Cambios arbitrarios de grosor entre episodios.
- Doble contorno o sombras que ensucien las siluetas.

El grosor exacto se fijará en unidades del documento vectorial maestro y se probará en el tamaño final 9:16.

## 4. Diseño maestro: una fuente de verdad

Cada protagonista tendrá un archivo vectorial fuente editable y una versión optimizada para render. El diseño no debe regenerarse libremente para cada capítulo.

Estructura sugerida de assets:

```text
public/studio/series/entre-partidas/
  README.md
  characters/
    martina/
      model.svg
      expressions.svg
      poses.svg
      character.json
    bruno/
      model.svg
      expressions.svg
      poses.svg
      character.json
    tomas/
      model.svg
      expressions.svg
      poses.svg
      character.json
    valentina/
      model.svg
      expressions.svg
      poses.svg
      character.json
    ernesto/
      model.svg
      expressions.svg
      poses.svg
      character.json
  backgrounds/
    apartment-living-room.svg
    apartment-kitchen.svg
  props/
  audio/
  episodes/
```

Esta es una estructura objetivo sugerida; no implica que los archivos o el motor 2D ya estén implementados.

## 5. Componentes y animación

Preferir personajes vectoriales por capas, con piezas reutilizables:
- Torso y ropa.
- Cabeza y pelo.
- Ojos, cejas y boca.
- Brazos y manos.
- Piernas y pies.
- Accesorios.

Las articulaciones deben mantener proporciones y evitar deformaciones accidentales. Las animaciones iniciales necesarias:
- Respiración o idle.
- Parpadeo.
- Hablar.
- Escuchar y reaccionar.
- Mirar a otro personaje.
- Señalar.
- Encogerse de hombros.
- Reír.
- Sorprenderse.
- Sentarse y levantarse.
- Usar un celular.

No hace falta animar todo de forma continua. Cortes, poses, cambios de expresión y timing cómico pueden generar una sensación de animación más cuidada con un costo de producción menor.

## 5.1 Movimiento natural y apoyo corporal

- Los pies mantienen una línea base estable mientras el personaje está parado; no usar flotación ni rebote continuo del cuerpo.
- Respiración casi imperceptible, parpadeos no sincronizados y pequeñas inclinaciones de cabeza.
- Los gestos de brazos deben responder al diálogo: abrir una mano, señalar, encogerse de hombros o acompañar una idea.
- El personaje que escucha mira al hablante; el hablante mira al interlocutor o al objetivo dramático.
- La cámara solo recibe miradas cuando el guion lo indica. No poner a todo el elenco mirando al espectador de forma permanente.
- Evitar que los cinco gesticulen simultáneamente. Las pausas y reacciones silenciosas son parte de la actuación.
- Los cambios de pose deben conservar el peso del cuerpo y el contacto con el suelo o el asiento.

## 6. Fondos y cámara

El departamento principal debe tener un plano general reutilizable y zonas de acción claras. Crear variaciones de cámara a partir de los mismos fondos:
- Plano general del grupo.
- Plano medio de dos personajes.
- Primer plano de reacción.
- Sobre el hombro para ver un celular.
- Plano detalle de un objeto.

Diseñar el set pensando en continuidad espacial: puertas, ventanas, sofá, mesa y cocina deben permanecer en el mismo lugar entre tomas.

## 7. Integración del celular y del juego

La interfaz real de Ingredora debe conservar legibilidad. Siempre que se muestre gameplay:
- Capturar el juego real o validar cada detalle contra la versión vigente.
- No redibujar textos pequeños de memoria.
- Respetar el contador de 15 segundos, indicadores de acierto/error y pantalla de resultados.
- No mostrar una respuesta del Desafío Diario que deba mantenerse secreta.
- No inventar puntuaciones o ingredientes.

Se puede componer una captura real dentro del teléfono ilustrado, manteniendo la interfaz original sin deformarla.

## 8. Reglas de consistencia

1. No cambiar peinado, color de pelo, ojos, proporciones, vestuario base o accesorios sin actualizar el modelo maestro.
2. No alterar los colores individuales por conveniencia de una escena.
3. No cambiar la altura relativa entre protagonistas.
4. No introducir un personaje nuevo como protagonista sin actualizar la biblia.
5. Toda pose nueva debe respetar el modelo.
6. Mantener el mismo diseño en portada, video, miniatura y material promocional.
7. No usar imágenes generadas distintas como sustituto de los modelos canónicos.
8. Guardar los fuentes editables, no solamente PNG renderizados.

## 9. Aprobación visual

Antes del primer episodio terminado, aprobar:
- Los cinco diseños en una lámina de elenco.
- Vista frontal y tres cuartos de cada uno.
- Hoja de expresiones.
- Paleta y contorno.
- Escenario principal.
- Una prueba de animación con dos personajes dialogando.
- Una prueba de render en 9:16.

Una vez aprobado, congelar versión de los modelos (por ejemplo, `character-design-v1`). Toda modificación posterior debe ser intencional y documentada.
