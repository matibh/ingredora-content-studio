# 14 — Analítica, métricas y experimentación

**Estado:** especificación inicial.  
**Última actualización:** 2026-11-19.  
**Principio rector:** medir adquisición y actividad real de jugadores, no optimizar únicamente por métricas de vanidad.

## 1. Objetivo

Definir cómo evaluar si las campañas de Ingredora generan visitas cualificadas, partidas, finalizaciones y retorno. La analítica debe conectar el contenido publicado con el comportamiento agregado dentro del juego, sin introducir servicios pagos ni recopilar datos innecesarios.

El sistema distingue:
- Rendimiento de contenido en cada plataforma.
- Tráfico que llega a Ingredora.
- Actividad real dentro del juego.
- Retención y recurrencia.
- Costos, límites y calidad de los datos.

## 2. Principios de medición

- Priorizar métricas accionables sobre volumen bruto.
- Mantener definiciones estables y documentadas.
- Separar métricas reportadas por plataformas de eventos first-party.
- No sumar métricas incompatibles como si fueran equivalentes.
- No atribuir causalidad cuando solo existe correlación.
- No identificar usuarios si una medición agregada es suficiente.
- No recopilar datos sensibles ni construir perfiles innecesarios.
- No utilizar analytics para revelar respuestas, desafíos activos o información competitiva del juego.
- No contratar herramientas, dashboards, CDP o proveedores de analytics.
- Mantener límites de almacenamiento y consultas compatibles con USD 0.

## 3. Embudo principal

El embudo de marketing se representa como:

1. **Exposición:** la plataforma muestra la pieza.
2. **Consumo:** la persona ve o interactúa con el contenido.
3. **Interés:** visita el perfil, toca el link o busca Ingredora.
4. **Visita:** llega a una landing o al sitio del juego.
5. **Inicio:** inicia una partida.
6. **Finalización:** completa una partida.
7. **Retorno:** vuelve a jugar en otra sesión o día.
8. **Hábito:** mantiene actividad recurrente, si el producto ofrece una mecánica real que lo permita.

No todos los pasos pueden medirse en todos los canales. La app debe mostrar explícitamente datos no disponibles y no estimarlos como si fueran observaciones.

## 4. Métricas por plataforma

Registrar las métricas que cada canal exponga en su interfaz o exportación oficial, según disponibilidad:
- Views / reproducciones.
- Reach / cuentas alcanzadas.
- Impresiones, cuando estén disponibles.
- Tiempo de visualización.
- Retención y porcentaje visto.
- Tasa de finalización, si la plataforma la ofrece.
- Likes.
- Comentarios.
- Compartidos.
- Guardados.
- Visitas al perfil.
- Clics en enlaces.

Cada registro debe indicar plataforma, definición, periodo, fecha de captura y origen (manual o API futura).

No comparar directamente views de distintas plataformas sin comprobar sus definiciones. Las plataformas pueden cambiar cómo cuentan reproducciones, impresiones y alcance.

## 5. Métricas first-party de Ingredora

La app del juego podrá registrar eventos mínimos para medir el embudo:
- `landing_view`
- `game_session_start`
- `game_attempt_start`
- `game_attempt_complete`
- `game_attempt_abandon`
- `return_session`

Eventos adicionales como registro, streak o daily return solo se incorporan si la funcionalidad existe, su definición es clara y la recolección está justificada.

Cada evento debe tener:
- event_id.
- event_name.
- occurred_at.
- schema_version.
- anonymous_session_id o identificador interno seudónimo cuando sea necesario.
- campaign attribution opcional.
- platform/referrer normalizado.
- propiedades estrictamente necesarias.

No guardar respuestas ingresadas, contenido de texto libre, credenciales, direcciones IP completas ni datos sensibles como propiedades de analytics. Evitar identificadores persistentes si un identificador de sesión temporal basta.

## 6. Modelo de atribución

### 6.1 UTM

Usar los parámetros definidos en el Documento 13:
- `utm_source`: plataforma.
- `utm_medium`: social.
- `utm_campaign`: campaña.
- `utm_content`: pieza o variante.
- `utm_term`: opcional.

Ejemplo conceptual:
`?utm_source=tiktok&utm_medium=social&utm_campaign=yerba-mate-001&utm_content=hook-a-es`

Los valores deben usar una convención estable, minúsculas, guiones y sin datos personales.

### 6.2 Persistencia de atribución

- Capturar los UTM al llegar a la landing.
- Validar y normalizar sus valores.
- Mantener atribución de primera visita y última visita solo si el producto necesita ambas.
- Definir una ventana de atribución explícita antes de calcular conversiones.
- No sobrescribir una atribución original sin conservar la regla de actualización.
- No enviar identificadores de jugador ni datos privados a redes sociales.

La ventana de atribución inicial queda pendiente de decisión y debe poder configurarse. No se debe presentar como estándar universal.

### 6.3 Límites de atribución

- Los clics no equivalen a usuarios únicos.
- Una visita puede provenir de una aplicación que elimina o modifica parámetros.
- El usuario puede abrir otro dispositivo o navegador.
- Los bloqueadores pueden impedir mediciones.
- Las vistas de plataforma no se pueden vincular individualmente con partidas.
- Los datos agregados de plataforma no demuestran que una publicación haya causado una conversión.

Los informes deben distinguir atribución observada, atribución declarada por la plataforma y estimaciones.

## 7. KPIs principales

### 7.1 Adquisición

- Visitas atribuidas por campaña.
- Sesiones de landing por canal.
- Clics salientes reportados por plataforma, si existen.
- Costo monetario de adquisición: debe permanecer en USD 0 en el MVP.

### 7.2 Activación

- Partidas iniciadas.
- Conversión visita → partida.
- Tiempo entre visita y primera partida, solo si se puede medir sin datos excesivos.

### 7.3 Engagement del juego

- Partidas completadas.
- Tasa de finalización.
- Abandonos.
- Repetición de partidas dentro de una sesión, si aplica.

### 7.4 Retención

- Usuarios o sesiones que regresan al día siguiente.
- Retorno a 7 días.
- Retorno a 30 días.
- Streak o hábito, únicamente si existe y se define correctamente.

Las métricas de retención requieren una definición de usuario o cohorte consistente. Si se mide por sesiones anónimas, no presentarlo como retención de personas.

### 7.5 Eficiencia creativa

- Visitas por cada 1.000 views, si ambas métricas son comparables.
- Partidas iniciadas por pieza.
- Finalizaciones por pieza.
- Conversión por idioma, hook, duración, formato y canal.

No declarar un ganador por diferencias mínimas con muestras pequeñas.

## 8. Definiciones y fórmulas

Las fórmulas deben aparecer junto a cada indicador:
- **CTR de enlace** = clics en enlace / impresiones o views compatibles, según definición de la fuente.
- **Conversión landing → partida** = sesiones atribuidas con partida iniciada / sesiones atribuidas de landing.
- **Tasa de finalización** = partidas completadas / partidas iniciadas.
- **Tasa de abandono** = partidas abandonadas / partidas iniciadas.
- **Retorno D1** = cohorte que vuelve dentro de la ventana D1 / cohorte inicial elegible.
- **Retorno D7** = cohorte que vuelve dentro de la ventana D7 / cohorte inicial elegible.
- **Partidas por visita** = partidas iniciadas / sesiones atribuidas.

Definir denominador, ventana temporal, zona horaria y exclusiones. No mezclar usuarios, sesiones, eventos y partidas.

## 9. Dashboard de campañas

El panel interno debe permitir filtrar por:
- Campaña.
- Pieza / variante.
- Plataforma.
- Idioma.
- País/mercado solo si se obtiene de forma legítima y agregada.
- Periodo.
- Pilar de contenido.
- Estado de publicación.

Vistas propuestas:
1. **Resumen:** inversión monetaria (USD 0 en MVP), publicaciones, alcance reportado, visitas, partidas y conversiones.
2. **Embudo:** visita → inicio → finalización → retorno.
3. **Comparación creativa:** hooks, formatos, duración e idioma.
4. **Plataformas:** rendimiento por canal con definiciones propias.
5. **Retención:** cohortes y retornos.
6. **Calidad de datos:** eventos faltantes, UTMs inválidos, duplicados y fuentes desconocidas.

No construir un dashboard con decenas de gráficos antes de tener volumen suficiente. Empezar con tablas, KPIs y tendencias simples.

## 10. Registro manual y automatización

### MVP
- Registrar URL, fecha, canal y variante publicada.
- Ingresar manualmente métricas visibles en analytics nativo de cada plataforma.
- Guardar fecha de captura y periodo al que corresponden.
- Registrar observaciones cualitativas y cambios de formato.
- Importación CSV solo si aporta valor y puede validarse localmente en el navegador.

### Futuro
- APIs oficiales para métricas, únicamente después de revisar costo, cuota, permisos, privacidad y términos.
- No scraping ni automatización de interfaces.
- No usar APIs de terceros con cargos variables.
- No activar billing para aumentar cuotas.

## 11. Experimentación creativa

El objetivo es aprender qué contenido produce resultados, no hacer experimentos estadísticos artificialmente complejos.

Variables posibles:
- Hook inicial.
- Primer plano o encuadre.
- Producto y categoría.
- Duración.
- CTA.
- Idioma.
- Texto en pantalla.
- Tipo de reveal.
- Presencia de personaje.
- Ritmo y sonido.

Reglas:
- Cambiar una variable principal por experimento cuando sea posible.
- Mantener comparables plataforma, periodo y audiencia.
- Registrar hipótesis antes de publicar.
- Definir métrica primaria y métricas secundarias.
- Establecer duración mínima o volumen de observaciones antes de concluir.
- No detener un experimento solo por una fluctuación temprana.
- No presentar resultados de muestras pequeñas como evidencia concluyente.
- No usar pruebas que oculten información del juego o engañen a la audiencia.

Cada experimento tendrá:
- experiment_id.
- hypothesis.
- campaign_id.
- variants.
- primary_metric.
- secondary_metrics.
- start/end.
- audience/platform.
- observations.
- conclusion.
- confidence/limitations.
- next_action.

## 12. Cohortes

Agrupar sesiones o usuarios seudónimos por:
- Fecha de primera visita o actividad.
- Campaña de adquisición.
- Plataforma de origen.
- Idioma.
- Variante creativa.

Solo crear cohortes si la identificación es legítima, proporcional y necesaria. No combinar atributos que permitan reidentificar personas ni inferir datos sensibles.

## 13. Calidad e integridad de datos

- Eventos con schema_version.
- event_id para deduplicación.
- Timestamps UTC y visualización en zona horaria local.
- Nombres de eventos estables.
- Validación de propiedades permitidas.
- Rechazo de propiedades desconocidas o excesivas.
- Registro de eventos de prueba separado de producción.
- Detección de bots y tráfico interno con reglas documentadas, sin fingerprinting invasivo.
- No modificar históricos para hacer coincidir campañas.
- Mostrar vacíos como “sin datos”, no como cero.
- Documentar cambios de definición y recalcular solo con metodología explícita.

## 14. Privacidad y protección de datos

El proyecto se dirige inicialmente a Argentina y debe diseñarse con privacidad por defecto. La Ley 25.326 establece principios sobre calidad, pertinencia, finalidad y conservación de datos, además de derechos de información, acceso, rectificación y supresión. Antes del lanzamiento debe revisarse el tratamiento real y la información que se comunica a los usuarios con asesoramiento adecuado.

Medidas de diseño:
- Informar de manera clara qué datos se recopilan, para qué, quién es responsable y cómo ejercer derechos.
- Recopilar el mínimo necesario.
- No recolectar datos sensibles para marketing.
- Evitar tracking entre sitios o dispositivos.
- No fingerprinting.
- No vender ni ceder datos para publicidad.
- No usar datos de juego para segmentación publicitaria individual.
- Definir retención y eliminación.
- Proteger acceso a tablas y exports.
- Evitar datos personales en URLs, UTMs, logs y dashboards.
- Evaluar consentimiento y mecanismos de elección según tecnologías y finalidad concretas.
- Permitir medición agregada cuando sea suficiente.

La especificación técnica no reemplaza una evaluación legal de privacidad. Fuentes oficiales:
- Ley 25.326, texto actualizado: https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790/actualizacion
- Derechos de las personas titulares: https://www.argentina.gob.ar/aaip/datospersonales/derechos
- Decreto reglamentario 1558/2001: https://www.argentina.gob.ar/normativa/nacional/decreto-1558-2001-70368/actualizacion

## 15. Arquitectura y costos

- Los eventos first-party pueden persistirse en Supabase si las cuotas gratuitas vigentes lo permiten.
- No incorporar proveedor externo de analytics en el MVP.
- No activar funciones pagas, billing ni planes de pago.
- Aplicar RLS y políticas de acceso; el dashboard no debe consultar tablas públicas sin autorización.
- Agregar límites de volumen, retención y agregación para evitar crecimiento ilimitado.
- Preferir agregados diarios por campaña y canal para dashboards.
- No guardar cada impresión de plataforma como evento individual: usar totales agregados capturados desde fuentes oficiales.
- Si se acerca un límite gratuito, pausar o reducir recolección antes de incurrir en costos.
- La analítica no puede degradar la experiencia ni impedir que el juego funcione.

## 16. Informes

Informe semanal:
- Piezas publicadas por canal.
- Views/reach reportados y fuente.
- Visitas atribuidas.
- Partidas iniciadas y completadas.
- Conversión visita → partida.
- Retorno disponible.
- Mejor y peor desempeño con limitaciones de muestra.
- Experimentos y aprendizajes.
- Próximas acciones.

Informe mensual:
- Evolución por campaña y canal.
- Comparación ES/EN.
- Tendencias de adquisición y activación.
- Cohortes de retorno si hay volumen suficiente.
- Calidad de atribución.
- Consumo de cuotas y almacenamiento.
- Recomendaciones editoriales.

No generar conclusiones automáticas sin mostrar tamaño de muestra, periodo y limitaciones.

## 17. Criterios de aceptación

- [ ] Embudo de exposición a retorno documentado.
- [ ] Métricas de plataforma separadas de first-party.
- [ ] Eventos de juego mínimos definidos.
- [ ] UTM consistente con Documento 13.
- [ ] Fórmulas y denominadores documentados.
- [ ] Dashboard permite filtrar por campaña, pieza, canal e idioma.
- [ ] Captura manual de métricas en MVP.
- [ ] Experimentos guardan hipótesis y conclusión.
- [ ] Muestras pequeñas se identifican como insuficientes.
- [ ] Eventos duplicados y pruebas se pueden identificar.
- [ ] Privacidad, retención y acceso están contemplados.
- [ ] No se incorporan servicios pagos ni APIs con cargos.
- [ ] La medición no bloquea el gameplay.
- [ ] Los informes distinguen datos observados, reportados y estimados.

## 18. Fuera del MVP

- Atribución probabilística o multi-touch avanzada.
- Identidad unificada entre dispositivos.
- Fingerprinting.
- Data warehouse externo.
- CDP o customer 360.
- Integraciones pagas de analytics.
- Modelos predictivos de churn o valor de vida.
- Optimización automática de campañas.
- Publicidad paga y medición de ROAS.

## 19. Decisiones pendientes

1. Definición final de usuario/sesión anónima y su duración.
2. Ventana de atribución.
3. Eventos exactos disponibles en el juego actual.
4. Política de retención y borrado.
5. Aviso de privacidad y mecanismo de elección.
6. KPIs definitivos del dashboard inicial.
7. Volumen mínimo para comparar creatividades.
8. Revisión de cuotas Supabase al implementar.

## 20. Relación con otros documentos

- **01 — Estrategia de contenido:** objetivos y métricas editoriales.
- **02 — Arquitectura general:** persistencia, seguridad y límites.
- **03 — ChatGPT: producción y protocolo:** metadatos y experimentos.
- **11 — Supabase y almacenamiento:** eventos, RLS y cuotas.
- **12 — Quality Assurance:** calidad e integridad de datos.
- **13 — Distribución y publicación social:** plataformas, Social Packages y UTM.
- **15 — Plan de implementación:** fases, prioridades y criterios de salida.

---

**Estado:** especificación inicial. La prioridad es una medición first-party mínima, transparente y gratuita que conecte contenido con partidas reales sin invadir la privacidad.
