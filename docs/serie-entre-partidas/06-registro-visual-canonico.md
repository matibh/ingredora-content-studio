# Registro visual canónico — Entre Partidas

**Estado:** reglas de continuidad activas desde el capítulo 2.  
**Fuente de verdad:** modelos Three.js existentes en `src/engine/entrePartidas.ts` y `src/engine/entrePartidasDinner.ts`. No rediseñar ni reinterpretar los personajes por episodio.

## Regla inviolable de personajes

Cada protagonista conserva siempre la misma identidad visual: rostro, tono de piel, pelo, proporciones, altura relativa, ropa, colores y accesorios. Los modelos y materiales deben reutilizarse entre capítulos. No generar un personaje nuevo "parecido" al anterior ni cambiarle la ropa para que combine con el escenario.

### Vestuario y rasgos que se deben conservar

| Personaje | Vestuario fijo | Paleta de referencia | Rasgos identificatorios |
|---|---|---|---|
| Bruno | Remera naranja/terracota, pantalón gris carbón y zapatillas oscuras | Remera `#C46A43`, pantalón `#35414A` | Pelo castaño muy oscuro, cuerpo más ancho/deportivo |
| Martina | Blusa rosa tostado, pantalón gris carbón y calzado oscuro | Blusa `#BD7958`, pantalón `#35414A` | Pelo oscuro recogido en coleta alta con detalle dorado |
| Tomás | Camisa/remera verde petróleo, pantalón gris carbón y calzado oscuro | Parte superior `#527C78`, pantalón `#35414A` | Pelo castaño, silueta alta y delgada |
| Valentina | Parte superior azul petróleo, pantalón gris carbón y calzado oscuro | Parte superior `#47788A`, pantalón `#35414A` | Pelo negro largo/recogido, silueta femenina |
| Ernesto | Cárdigan verde oliva con detalle frontal claro, pantalón verde grisáceo y calzado oscuro | Cárdigan `#718064`, pantalón `#4B5148` | Pelo gris, barba gris corta, aspecto más bajo y robusto |

Los HEX son valores de materiales ya presentes en los rigs actuales. Si se corrige un diseño, se actualiza primero este registro y el modelo maestro; después se propaga el cambio a todos los episodios. Nunca se hace un cambio local solo para una toma.

## Biblioteca de escenarios y planos reutilizables

Los escenarios se tratan como sets maestros persistentes, no como fondos descartables por episodio.

| ID de set | Recurso maestro | Regla de continuidad |
|---|---|---|
| Supermercado exterior | Exterior del capítulo 1, Bruno — `createEntrePartidasSet()`, grupo `exterior` | Reutilizar exactamente el mismo modelo, fachada, cartel, luces, calle, vereda, edificio vecino, autos, bicicleta y utilería. Para el plano de apertura repetir también la cámara, encuadre, perspectiva, duración y movimiento del original. No reconstruirlo ni hacer una variante aproximada. |
| Supermercado interior | Set del capítulo 1 | Mantener arquitectura, iluminación, góndolas, piso y lenguaje de materiales. Se permite cambiar el sector/ángulo de góndola para que el episodio no parezca filmado en el mismo pasillo; no cambiar el supermercado. |
| Departamento / living-comedor | Set maestro de la cena | Reutilizar distribución, puertas, ventanas, muebles, mesa, cocina, iluminación y escala. |
| Calle y edificio | Geometría del exterior del capítulo 1 | Repetir los mismos modelos, ubicación, alturas, texturas y luces. |

### Cómo reutilizar los planos

1. Buscar y reutilizar el grupo/función original del set, no modelar una copia.
2. Para el exterior del supermercado, conservar la toma original de Bruno: mismo encuadre y cámara. Se puede ajustar solamente el momento de corte para adaptarlo al nuevo diálogo; no cambiar el plano.
3. Para una góndola distinta, cambiar la posición de cámara y el tramo visible del mismo interior, o incorporar una góndola/sector adicional dentro del set existente. No sustituir la fachada ni el diseño general.
4. Guardar cualquier plano nuevo aprobado con un ID estable y registrarlo aquí para los siguientes capítulos.
5. Los cambios globales de escenario se hacen en el maestro y se reflejan en todos los episodios futuros; nunca se bifurca una versión por capítulo sin motivo narrativo.

## Control antes de cada render

- [ ] Tomás, Ernesto y cualquier otro personaje usan el rig maestro y su vestuario canónico.
- [ ] No cambió el color de ropa, pelo, piel, rostro, altura ni proporciones.
- [ ] El exterior es el mismo plano original de Bruno, no una recreación.
- [ ] El supermercado interior mantiene el mismo set; solo cambia la góndola/ángulo requerido.
- [ ] Calle, edificio y departamento mantienen continuidad espacial.
- [ ] Los nuevos assets se guardan como recursos maestros reutilizables.
- [ ] Se revisan fotogramas de comparación con los episodios anteriores antes de aprobar.

## Regla de producción

**La continuidad tiene prioridad sobre la novedad visual.** La novedad de cada capítulo debe venir de la historia, la actuación, los props y los encuadres secundarios; no de cambiar el aspecto de los personajes ni reconstruir lugares ya establecidos.
