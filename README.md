# Ingredora Content Studio

## 📘 Guía principal: cómo producir videos

**[Abrir la Guía Maestra de Producción de Video](docs/GUIA_MAESTRA_PRODUCCION_VIDEO.md)**

Incluye el flujo completo desde la idea hasta el MP4 aprobado, el template para pedir nuevas producciones a ChatGPT, storyboard segundo a segundo, estructura del Production Package, render Three.js, audio/subtítulos, control de calidad, metadatos TXT y aprobación/subida a GitHub.

---

## Operación del estudio: producción desde ChatGPT

Ingredora Content Studio combina la preparación creativa desde ChatGPT con la ejecución y revisión en la aplicación. El usuario no tiene que completar briefs, prompts ni storyboards manualmente dentro de la web.

- La dirección creativa, guiones, storyboards, escenas, assets, audio, subtítulos y metadatos se preparan desde la conversación y se entregan como paquetes versionados.
- El motor del Studio valida y ejecuta las producciones, renderiza en el navegador y permite obtener el video para revisión.
- El render base genera WebM. La conversión a MP4 es un paso adicional y conserva el WebM original.
- Supabase se utiliza para persistir datos y recursos; no es el motor de render.
- GitHub mantiene el código y la documentación. La carpeta `Contenido a subir` es el destino acordado para los archivos aprobados.
- La aprobación es manual y requiere la contraseña en la aplicación. No se guardan secretos en el frontend ni se comparten por chat.
- La función de aprobación actual sube el MP4 y verifica la existencia del TXT asociado; comprobar su implementación antes de asumir que también sube el TXT.
- No hay publicación automática en redes sociales. Aprobar y subir a GitHub no equivale a publicar.

### Manifiesto de producciones

El manifiesto `public/studio/productions.json` conecta las producciones preparadas con la aplicación de exhibición. El esquema inicial es `schemaVersion: 1`. Cada elemento incluye `id`, `title` y `status` (`planned`, `rendering` o `ready`). Para que aparezca como video listo debe tener `status: "ready"` y una URL `videoUrl` reproducible. Los campos opcionales incluyen `description`, `posterUrl`, `durationSeconds`, `aspectRatio`, `language`, `platforms`, `version`, `createdAt` y `caption`.

Si la documentación y el comportamiento del código difieren, manda el código vigente: actualizar la guía en el mismo cambio.
