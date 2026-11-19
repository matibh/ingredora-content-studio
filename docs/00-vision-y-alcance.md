# 00 — Visión y alcance

- **Proyecto:** Ingredora Content Studio
- **Tipo:** fábrica audiovisual web para contenido de Ingredora
- **Estado:** planificación
- **Documento:** visión, objetivos, alcance y principios rectores
- **Última actualización:** 2026-11-19

## 1. Resumen ejecutivo

Ingredora Content Studio será una aplicación web orientada a producir contenido audiovisual de marca de forma repetible y organizada. Su núcleo será un motor visual programático basado en Three.js, con bibliotecas reutilizables de productos, packaging 3D, personajes, escenarios, cámaras, iluminación, animaciones, gráficos y audio.

La dirección creativa y la preparación inteligente de cada producción se realizarán desde ChatGPT en la conversación de trabajo. ChatGPT preparará la estrategia de campaña, el concepto, los guiones, el storyboard, la dirección de arte, las especificaciones de escena, los manifiestos, los textos, las adaptaciones lingüísticas y, cuando corresponda, el código de componentes visuales. La aplicación web no será un segundo cerebro creativo: será el entorno determinista que valida, previsualiza, ejecuta, renderiza, organiza y almacena los proyectos preparados.

La meta no es generar simples placas con texto ni ensamblar diapositivas. Se busca producir piezas audiovisuales con puesta en escena, profundidad, movimiento, producto reconocible, narrativa y acabado consistente.

## 2. Problema que resuelve

La producción de contenido para redes suele fragmentarse entre herramientas, archivos, decisiones creativas y procesos manuales. Esto dificulta mantener identidad visual, reutilizar activos, producir variantes por idioma y corregir una escena sin rehacer una pieza completa.

Ingredora Content Studio busca centralizar el proceso y convertir las producciones en proyectos estructurados, versionados y reproducibles.

## 3. Visión del producto

Construir una fábrica audiovisual propia que permita:

- Planificar campañas y series de contenido.
- Mantener un catálogo de productos con información y referencias verificadas.
- Crear y reutilizar envases 3D que respeten la apariencia de los productos reales en el nivel de fidelidad documentado.
- Crear personajes estilizados y acciones reutilizables.
- Construir escenarios 3D cinematográficos con Three.js.
- Dirigir cámaras, iluminación, animaciones, partículas y transiciones.
- Componer títulos, gráficos, subtítulos y elementos de marca.
- Incorporar música, efectos y, si se aprueba, narración.
- Editar una producción mediante una línea de tiempo.
- Previsualizar, renderizar y volver a renderizar escenas individuales.
- Guardar proyectos, recursos y videos finales en almacenamiento remoto sujeto a cuotas.
- Preparar paquetes de publicación por red e idioma.
- En una fase posterior, facilitar distribución mediante integraciones oficiales, siempre con confirmación humana.

## 4. Objetivos

### 4.1 Objetivos principales

1. Producir videos verticales de calidad visual consistente para promocionar Ingredora.
2. Diferenciar el contenido mediante escenas 3D, packaging, personajes y dirección cinematográfica.
3. Reutilizar modelos, escenas, animaciones y plantillas para reducir trabajo repetido.
4. Mantener la dirección creativa centralizada en ChatGPT.
5. Poder revisar y corregir una parte de una producción sin repetir todo el render.
6. Mantener un historial verificable de campañas, assets, versiones y resultados.
7. Operar sin gastos: USD 0 de forma permanente.

### 4.2 Objetivos secundarios

- Preparar versiones en español e inglés.
- Adaptar textos, descripciones, títulos y CTA por plataforma.
- Medir resultados y relacionarlos con visitas y partidas de Ingredora.
- Incorporar publicación asistida o directa cuando las APIs oficiales y sus condiciones lo permitan sin costos.

## 5. No objetivos y exclusiones

La primera versión no será:

- Un generador autónomo de ideas basado en una API de IA.
- Un clon de un editor profesional generalista.
- Un servicio de generación de video mediante modelos generativos externos.
- Una plataforma de hosting de video público.
- Un sistema de publicación automática sin aprobación.
- Un reemplazo de un estudio de captura de movimiento o animación cinematográfica de personajes realistas.
- Un sistema que invente datos, ingredientes, características o claims de productos.
- Un mecanismo para acceder o extraer respuestas secretas del juego.
- Una aplicación que requiera instalar programas locales para operar.

## 6. Principios no negociables

### 6.1 Presupuesto cero

- No se contratarán planes, APIs, servicios, créditos ni recursos pagos.
- No se habilitará facturación automática ni se registrarán medios de pago para habilitar cuotas.
- Antes de adoptar un proveedor se comprobarán sus condiciones gratuitas, límites, vencimientos, requisitos de tarjeta y restricciones comerciales.
- Si se agota una cuota, se detendrá la operación afectada. No se buscará automáticamente un servicio pago alternativo.
- Los límites gratuitos pueden cambiar; toda decisión de proveedor debe registrar fecha y fuente de verificación.
- El presupuesto cero es una restricción del producto, no una preferencia que pueda sacrificarse para mejorar calidad.

### 6.2 Operación desde navegador

El usuario debe poder abrir la aplicación web y trabajar desde un navegador moderno. No se exigirá instalar un editor, motor 3D, runtime local ni modelo de IA. Puede haber descargas técnicas automáticas de recursos del sitio o modelos aprobados, pero deben explicarse su tamaño, almacenamiento y necesidad.

### 6.3 ChatGPT como único cerebro creativo

ChatGPT realizará desde la conversación:

- Investigación y estrategia.
- Ideación y selección de conceptos.
- Redacción de guiones y copies.
- Storyboards y timing.
- Dirección de arte y cinematografía.
- Diseño de escenas y animaciones.
- Especificaciones y manifiestos de campaña.
- Adaptación de idiomas y plataformas.
- Programación de componentes y módulos visuales.
- Revisión editorial y análisis de resultados cuando se aporten datos.

No se incorporarán otros modelos generativos para estas tareas. Un eventual modelo de texto a voz, como Kokoro, sería una herramienta especializada de síntesis y no un director creativo; aun así, su incorporación está pendiente de decisión porque supone ejecutar un modelo de IA adicional en el navegador.

### 6.4 Límite de integración con ChatGPT

La aplicación no podrá llamar libremente a esta conversación ni recibir automáticamente sus respuestas sin una integración/API externa. No se presupone el uso de OpenAI API ni se habilitará por el requisito de costo cero.

El flujo será explícito: ChatGPT prepara archivos y manifiestos estructurados; estos se versionan o guardan mediante los conectores autorizados; la aplicación consume esos artefactos y ejecuta las operaciones permitidas. La comunicación de resultados hacia ChatGPT se realizará compartiendo registros, estados, archivos o datos desde los canales disponibles. No se promete un agente persistente ni notificaciones espontáneas desde la aplicación.

### 6.5 Calidad visual y fidelidad

- Los productos deben ser reconocibles y estar basados en referencias verificables.
- Se distinguirá entre una recreación aproximada y una reproducción fiel.
- Los logotipos, fotografías, tipografías y diseños deben tener procedencia y derechos de uso documentados.
- No se presentará una recreación como fotografía oficial.
- Los personajes y escenas deben mantener coherencia entre campañas.
- La calidad debe medirse en dispositivos reales y no solo en una vista previa.

### 6.6 Seguridad y privacidad

- No almacenar secretos en código frontend ni repositorios.
- Aplicar autenticación y permisos mínimos.
- Separar los datos de producción de los datos internos y secretos del juego.
- No publicar assets o campañas en estado borrador.
- Aplicar políticas de acceso en almacenamiento y base de datos.
- Registrar operaciones destructivas y exigir confirmación cuando corresponda.

### 6.7 Aprobación humana

Toda publicación en redes requiere revisión y confirmación humana. Las automatizaciones futuras deben ser reversibles cuando sea posible y mostrar claramente qué cuenta, canal, contenido y fecha se utilizarán.

## 7. Usuarios y contexto de uso

El usuario principal es el responsable de Ingredora y de la dirección de marketing/contenido. ChatGPT participa como colaborador creativo y técnico. La aplicación será utilizada para organizar y ejecutar producciones, no para sustituir las decisiones editoriales humanas.

En una etapa futura podrán existir roles adicionales (editor, revisor, administrador), pero no se incorporará complejidad multiusuario hasta que exista una necesidad real.

## 8. Alcance por fases

### Fase 0 — Planificación y especificación

- Visión y alcance.
- Estrategia de contenido.
- Arquitectura.
- Protocolo de producción ChatGPT.
- Identidad visual.
- Product Library y derechos.
- Product Studio 3D.
- Personajes y escenas.
- Audio.
- Editor y render.
- Almacenamiento y seguridad.
- Control de calidad.
- Roadmap y pruebas.
- Verificación actual de licencias, límites y proveedores.

**Criterio de salida:** no quedan decisiones críticas de arquitectura, costo o seguridad sin resolver; los contratos de datos están definidos y existe un piloto acotado.

### Fase 1 — Núcleo de producción

- Aplicación web y autenticación.
- Proyectos y campañas.
- Catálogo mínimo de productos y assets.
- Motor Three.js.
- Escenas y componentes reutilizables.
- Composición 2D.
- Audio básico.
- Previsualización y render por escenas.
- Exportación y almacenamiento con límites.
- Validaciones y aprobación.

**Criterio de salida:** una campaña piloto puede pasar de manifiesto a video final reproducible y revisable sin servicios pagos.

### Fase 2 — Producción avanzada

- Biblioteca ampliada de packaging.
- Personajes y animaciones.
- Timeline y edición avanzada.
- Narración, si se aprueba.
- Batch rendering controlado.
- Variantes por idioma y formato.
- Versionado y recuperación más completos.

### Fase 3 — Distribución y medición

- Paquetes de publicación por plataforma.
- Integraciones oficiales gratuitas que sean viables.
- Confirmación humana previa a publicar.
- Calendario.
- Analítica y atribución mediante enlaces/UTM.
- Evaluación de resultados y retroalimentación de campañas.

La distribución no debe retrasar ni encarecer la primera fase de producción.

## 9. Definición de éxito

El proyecto será exitoso cuando:

- Se pueda producir una campaña completa desde un proyecto estructurado.
- Los assets 3D se reutilicen sin reconstrucción manual.
- Las escenas sean deterministas y reproducibles con versiones fijadas.
- Se pueda corregir una escena y renderizarla nuevamente sin rehacer todo el video.
- Los videos finales y sus metadatos queden organizados y accesibles en almacenamiento.
- Los controles de cuota impidan exceder el presupuesto.
- La revisión de calidad detecte errores técnicos y de contenido antes de aprobar.
- No exista dependencia de una API generativa paga.
- La operación real se haya probado en el navegador y hardware objetivo.

## 10. Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Cuotas gratuitas cambian o se agotan | Verificación periódica, límites y detención segura |
| Render 3D pesado en navegador | Pruebas de capacidad, render por escenas, calidad configurable |
| Códecs no soportados | Detección previa y formatos alternativos |
| Packaging inexacto | Referencias verificadas y nivel de fidelidad explícito |
| Derechos de marcas y assets | Registro de fuente, licencia y permiso |
| Desconexión ChatGPT-app | Manifiestos versionados y protocolo explícito |
| Pérdida de trabajos | Guardado incremental, estados y recuperación |
| Exposición de secretos del juego | Separación de datos, RLS y revisión de contenidos |
| Complejidad excesiva | Piloto mínimo y entregas por fases |

## 11. Decisiones pendientes

Estas decisiones no deben considerarse resueltas hasta documentar evidencia y aprobarlas:

- Hosting gratuito compatible con uso comercial y repositorios privados.
- Proyecto Supabase independiente y límites vigentes.
- Sistema de render/exportación y compatibilidad de códecs.
- Estrategia de audio y decisión sobre TTS.
- Alcance de personajes y complejidad de rigging.
- Formatos y tamaño máximo de assets.
- Sistema de autenticación y roles.
- Política de retención y limpieza de videos.
- Método concreto de intercambio de proyectos entre ChatGPT y la aplicación.
- Formatos de entrega y calidad objetivo del piloto.

## 12. Regla de cambios

Toda modificación de alcance debe indicar:
1. Qué problema resuelve.
2. Qué documentos afecta.
3. Qué costo o cuota introduce.
4. Qué dependencias agrega.
5. Qué riesgos nuevos genera.
6. Cómo se prueba.
7. Si mantiene los principios no negociables.

Una mejora que implique gastos, facturación automática o una dependencia incompatible con USD 0 no se incorpora.
