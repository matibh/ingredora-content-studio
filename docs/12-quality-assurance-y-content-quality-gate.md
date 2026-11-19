# 12 — Quality Assurance y Content Quality Gate

**Estado:** especificación funcional inicial. Reglas automatizables, umbrales y pruebas de aceptación deben calibrarse con campañas reales.  
**Última actualización:** 2026-11-19.

## 1. Objetivo

Establecer un sistema de control de calidad para cada pieza producida por Ingredora Content Studio. El objetivo es evitar que un error de contenido, producto, idioma, diseño, render, audio, derechos o seguridad llegue a una publicación.

El Quality Gate es independiente del Render Engine: un archivo puede renderizarse correctamente y aun así no ser apto para aprobación o publicación.

## 2. Principios

- La calidad es responsabilidad de todo el flujo, no una revisión cosmética al final.
- Las validaciones automáticas detectan problemas medibles; no sustituyen el criterio humano.
- Los errores críticos bloquean el avance.
- Toda aprobación está vinculada a una versión concreta de la producción y sus entregables.
- No inventar hechos, ingredientes, cifras, características de productos ni resultados del juego.
- No revelar respuestas, contenido de desafíos activos ni información interna sensible.
- No publicar automáticamente.
- Mantener el presupuesto de USD 0: controles locales y herramientas gratuitas ya disponibles; no depender de servicios pagos de moderación, análisis o transcripción.
- Si una comprobación no puede realizarse, declarar la limitación; no marcarla como aprobada.

## 3. Etapas del Quality Gate

Cada producción atraviesa estas etapas:

1. **Brief Gate:** objetivo, audiencia, producto, mensaje y CTA aprobados.
2. **Research & Claims Gate:** fuentes, exactitud, afirmaciones y derechos.
3. **Package Gate:** estructura, schema, dependencias y compatibilidad.
4. **Creative Gate:** guion, storyboard, identidad, idioma y coherencia.
5. **Pre-render Gate:** composición, assets, audio, safe zones y parámetros.
6. **Render Gate:** integridad del archivo, duración, codecs y sincronización.
7. **Post-render Gate:** inspección visual y auditiva, textos y errores.
8. **Publication Gate:** aprobación humana final, metadata y destino.

Un gate posterior no puede borrar un fallo anterior sin una resolución documentada.

## 4. Severidad de hallazgos

### Blocker — Bloqueante
Impide render final, aprobación o publicación según el tipo de riesgo:
- Respuesta secreta o solución de desafío filtrada.
- Información falsa o afirmación material no verificada.
- Producto equivocado o presentación engañosa.
- Uso de asset sin derechos suficientes.
- Riesgo de privacidad o seguridad.
- Audio/video corrupto o incompleto.
- CTA que promete una función inexistente.
- Violación grave de identidad o contenido.

### Major — Importante
Requiere corrección antes de aprobar:
- Subtítulos ilegibles.
- Audio saturado o desincronizado.
- Logo, packaging o texto incorrecto.
- Composición que oculta información esencial.
- Idioma inadecuado para el mercado.
- Duración o formato fuera del brief.

### Minor — Menor
Puede aceptarse con registro:
- Detalle visual menor.
- Microinconsistencia no engañosa.
- Variación de timing que no afecta comprensión.
- Diferencia estética no esencial.

### Info — Observación
No bloquea, pero queda registrada como oportunidad o contexto.

## 5. Veracidad y claims

Toda afirmación factual debe tener una fuente o estar marcada como opinión/ficción creativa.

Comprobar:
- Nombre comercial y variante exacta del producto.
- Marca y fabricante, si se mencionan.
- Ingredientes declarados.
- Peso, volumen y presentación.
- Información nutricional, solo si se cuenta con fuente oficial y contexto adecuado.
- Origen, certificaciones y claims impresos.
- Precio, disponibilidad o promoción, si se mencionan.
- Datos de Ingredora: reglas, modos, rankings, streaks, premios y funcionalidades.

No inferir que un ingrediente está presente por la apariencia del packaging o por conocimiento general. No convertir una descripción de marketing en un hecho probado.

Claims de salud, nutrición, pérdida de peso, prevención, tratamiento o beneficios médicos quedan excluidos salvo revisión especializada y evidencia suficiente; la política inicial es no utilizarlos.

Las afirmaciones deben almacenarse con:
- Texto exacto del claim.
- Fuente y URL o documento.
- Fecha de consulta.
- Alcance y contexto.
- Estado: verified, unverified, rejected o expired.
- Revisor y fecha de aprobación.

Si una fuente cambia o deja de respaldar el claim, las piezas pendientes deben revisarse.

## 6. Product Accuracy Gate

Validar que el producto mostrado y mencionado corresponde a la ficha aprobada de Product Library:
- Marca.
- Variante.
- Tipo de envase.
- Colores y elementos visuales relevantes.
- Texto de etiqueta cuando se represente como legible.
- Idioma del packaging.
- Nivel de fidelidad declarado.
- Fuentes y referencias.
- Derechos de las imágenes/texturas.

Una recreación 3D aproximada no debe presentarse como fotografía oficial ni como packaging exacto.

Si el modelo es F0/F1/F2, indicar internamente su nivel de fidelidad. Para claims visuales de alta precisión, exigir referencia autorizada F3.

No agregar logos, sellos, certificaciones, premios ni textos no verificados.

## 7. Ingredora Product & Gameplay Accuracy

La comunicación del juego debe reflejar únicamente funciones existentes y verificadas en la versión publicada.

Checklist:
- Nombre y branding correctos.
- Mecánica representada fielmente.
- Capturas o gameplay auténticos cuando se presenta como gameplay real.
- No mostrar una UI inventada como si estuviera disponible.
- No prometer premios, recompensas o beneficios inexistentes.
- No insinuar patrocinio de marcas o fabricantes.
- No afirmar que un desafío está activo si no lo está.
- No mostrar respuestas válidas, listas internas ni contenido secreto.
- No revelar el Daily Challenge futuro ni su solución.
- No mostrar datos privados, cuentas, tokens o información de usuarios.
- CTA y destino correctos.

Si se usa una escena 3D dramatizada, debe quedar claro que es una representación visual y no gameplay real.

## 8. Rights & Legal Gate

Cada asset y fuente debe tener trazabilidad:
- Autor o titular conocido.
- Origen.
- Licencia o permiso.
- Uso comercial permitido.
- Modificaciones permitidas.
- Atribución requerida.
- Territorio y duración, cuando corresponda.
- Fecha de verificación.
- Evidencia o documento de autorización.
- Estado actual.

Estados sugeridos:
- approved.
- approved_with_conditions.
- pending.
- rejected.
- expired.
- revoked.

No asumir que una imagen, música, tipografía, video, logo o modelo puede utilizarse comercialmente por estar disponible en Internet.

No copiar música, clips, personajes, campañas ni estilos identificables de terceros. La música procedural debe ser original y los sonidos grabados deben tener derechos suficientes.

Un permiso revocado invalida el asset para nuevas producciones. Las piezas existentes deben evaluarse y retirarse o corregirse si corresponde.

## 9. Creative & Brand Gate

Revisar:
- Coherencia con el objetivo de campaña.
- Pilar editorial adecuado.
- Hook claro en los primeros segundos.
- Una idea principal por pieza.
- Producto visible y correctamente presentado.
- Ritmo y progresión narrativa.
- Reveal comprensible.
- CTA específico y verdadero.
- Identidad visual consistente.
- Tratamiento adecuado para cada idioma.
- Ausencia de estereotipos o representaciones degradantes.
- No saturar de textos, logos ni efectos.
- No confundir curiosidad con engaño.

La creatividad debe captar atención sin fabricar controversias, falsas urgencias ni resultados falsos.

## 10. Localization Gate

Cada variante lingüística se revisa como una pieza propia:
- Naturalidad del español argentino y comprensión regional.
- Inglés adaptado, no traducido literalmente.
- Ortografía, puntuación y gramática.
- Nombres propios y marcas intactos.
- CTA correcto para idioma y destino.
- Subtítulos coincidentes con el audio.
- Textos dentro de safe zones.
- Formato de números, unidades y fechas adecuado.
- No mezclar idiomas sin intención creativa.

La revisión de una versión ES no aprueba automáticamente la versión EN.

## 11. Visual Quality Gate

Controles automáticos cuando sea posible:
- Resolución y aspect ratio.
- FPS y duración.
- Frames negros inesperados.
- Frames faltantes o duplicados.
- Escenas vacías.
- Texturas ausentes.
- Objetos fuera de cámara.
- Z-fighting o clipping visible.
- Cámara atravesando geometría.
- Overlays fuera de safe zones.
- Texto cortado o superpuesto.
- Subtítulos demasiado pequeños.
- Parpadeos y cambios bruscos.
- Errores de color o alpha.
- Transiciones con saltos.

Controles humanos:
- Jerarquía y legibilidad en pantalla móvil.
- Calidad del packaging y personajes.
- Coherencia de iluminación.
- Movimiento natural y sin mareo.
- Composición equilibrada.
- Claridad del mensaje sin audio.
- Calidad del reveal y CTA.
- Consistencia entre planos.

No depender exclusivamente de detección automática de frames negros o texto: los resultados deben poder revisarse manualmente.

## 12. Audio Quality Gate

Validar:
- Presencia de audio cuando el brief lo requiere.
- Sin clipping ni distorsión evidente.
- Niveles equilibrados entre música, voz, SFX y ambiente.
- Ducking correcto cuando hay voz.
- Sin silencios involuntarios.
- Sin cortes abruptos.
- Sin desfase audio/video.
- Duración y fade de salida adecuados.
- Música y efectos con derechos aprobados.
- Subtítulos coincidentes con la voz.
- Mezcla inteligible en altavoces móviles y auriculares.

La medición técnica de loudness y true peak se incorporará si las herramientas del navegador y el pipeline lo permiten; no marcar como medida si no se calculó.

## 13. Technical Render Gate

Verificar el archivo generado:
- Contenedor y codec declarados.
- Archivo reproducible en el navegador objetivo.
- Resolución y FPS efectivos.
- Duración y número de frames.
- Pistas de audio presentes y sincronizadas.
- Tamaño y checksum.
- Integridad de metadata.
- Ausencia de truncamiento.
- Reproducción completa.
- Poster/thumbnail correcta.
- Correspondencia con la versión aprobada para render.

La extensión del archivo no demuestra el codec. Validar el contenido real con las capacidades disponibles.

Si el archivo no puede verificarse, no avanzar a publicación.

## 14. Safety, Privacy & Platform Gate

Comprobar:
- No mostrar información personal sin permiso.
- No exponer credenciales, tokens, URLs firmadas o datos internos.
- No revelar respuestas del juego ni datos secretos.
- No usar contenido discriminatorio, acosador o engañoso.
- No presentar publicidad como recomendación independiente.
- No afirmar asociaciones comerciales inexistentes.
- No incluir claims médicos/nutricionales.
- Revisar las políticas vigentes de la plataforma de destino antes de publicar.

Los requisitos de plataformas cambian. La revisión debe registrar plataforma, fecha y versión o URL de la política consultada.

## 15. Automatización vs revisión humana

### Automatizable en el MVP
- Schema y referencias.
- Campos requeridos.
- Versiones y dependencias.
- Resolución, FPS, duración y tamaño.
- Assets faltantes.
- Estado de permisos registrado.
- Safe zones geométricas.
- Textos y metadatos requeridos.
- Presencia de audio.
- Checksum e integridad básica.
- Lista de palabras o claims prohibidos conocidos.
- Referencias a Daily o respuestas secretas declaradas en manifests.
- Estado de cuota antes de subir.

### Revisión humana obligatoria
- Veracidad de claims y fuentes.
- Fidelidad de producto.
- Derechos ambiguos.
- Naturalidad lingüística.
- Calidad creativa.
- Calidad visual y sonora.
- Representación de gameplay.
- Contexto de marca y posibles implicaciones de patrocinio.
- Adecuación a políticas de plataforma.
- Aprobación final.

No afirmar que una búsqueda de palabras o un validador de schema garantiza que el video no filtre una respuesta secreta. La revisión visual y contextual sigue siendo necesaria.

## 16. Scorecard

Se puede mostrar una puntuación orientativa por dimensiones:
- Content accuracy.
- Product accuracy.
- Creative quality.
- Visual quality.
- Audio quality.
- Localization.
- Rights & compliance.
- Technical integrity.

El score no reemplaza severidad ni bloqueos. Un promedio alto no puede compensar un blocker. Los pesos y umbrales quedan pendientes de calibración; evitar un número global engañoso.

## 17. Registro de hallazgos y resolución

Cada finding debe incluir:
- Finding ID.
- Producción y versión.
- Gate.
- Categoría y severidad.
- Descripción.
- Evidencia o frame/timecode.
- Responsable.
- Acción correctiva.
- Estado.
- Fecha de resolución.
- Revisor que acepta la resolución.

Estados:
- Open.
- In progress.
- Fixed.
- Accepted with rationale.
- Rejected.
- Reopened.

Un finding blocker solo puede cerrarse con evidencia de corrección y revalidación. Las excepciones deben tener justificación y aprobación humana identificable.

## 18. Aprobación y publicación

La aprobación final se vincula a:
- Production Package y versión.
- Engine version.
- Assets y versiones.
- Render profile.
- Checksum del archivo final.
- Idioma y plataforma destino.
- Metadata y copy.
- Revisor y fecha.

Si cambia cualquiera de los elementos que afectan el entregable, la aprobación puede quedar invalidada y requerir nueva revisión.

El botón de publicar debe estar separado del de renderizar. En el MVP, la distribución es manual y requiere confirmación explícita.

## 19. Criterios de aceptación

- [ ] Existen gates definidos desde brief hasta publicación.
- [ ] Los findings tienen severidad y evidencia.
- [ ] Los blockers impiden avanzar.
- [ ] Los claims tienen fuente, fecha y estado.
- [ ] Los productos se comparan con Product Library.
- [ ] Los derechos de assets se verifican por recurso.
- [ ] Se revisa la fidelidad del gameplay.
- [ ] Se detectan referencias a Daily y respuestas secretas.
- [ ] Se revisan versiones lingüísticas de forma independiente.
- [ ] Se validan parámetros e integridad del render.
- [ ] La revisión humana puede inspeccionar el video completo.
- [ ] La aprobación queda vinculada a un checksum y versión.
- [ ] Render y publicación son acciones separadas.
- [ ] Ninguna automatización afirma garantizar calidad legal o factual.

## 20. Fuera del MVP

- Moderación automatizada mediante servicios externos.
- Reconocimiento de voz o visión en la nube.
- Análisis legal automatizado.
- Publicación automática.
- A/B testing automatizado.
- Score de calidad generado por modelos externos.
- Revisión colaborativa avanzada.

## 21. Decisiones pendientes

1. Matriz exacta de reglas bloqueantes y advertencias.
2. Plantillas de checklist por tipo de campaña.
3. Umbrales técnicos de audio y video.
4. Método de detección de frames negros y texto cortado.
5. Formato de findings y evidencia temporal.
6. Modelo de approvals y permisos.
7. Revisión de políticas de cada plataforma objetivo.
8. Definición de scorecard sin ocultar blockers.
9. Proceso de revisión y expiración de derechos.

## 22. Relación con otros documentos

- **01 — Estrategia de contenido:** objetivo, audiencia, pilares y métricas.
- **03 — ChatGPT: producción y protocolo:** fuentes, manifiestos y paquetes.
- **04 — Identidad visual:** consistencia gráfica y safe zones.
- **05 — Product Library:** exactitud de producto, fuentes y derechos.
- **06/07/08/09:** packaging, personajes, escenas, cámara y audio.
- **10 — Editor y Render Engine:** validación técnica y entregables.
- **11 — Supabase y almacenamiento:** persistencia de findings, permisos y approvals.
- **13 — Distribución social:** plataformas, formatos, copy y publicación.

---

**Estado:** especificación inicial. Ningún gate automatizado garantiza por sí solo veracidad, legalidad, seguridad o calidad creativa. La revisión humana y la aprobación explícita siguen siendo obligatorias.
