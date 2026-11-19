

## Operación del estudio: producción desde ChatGPT

Ingredora Content Studio es una **pantalla de reproducción y exhibición**, no una herramienta de carga o edición manual. El usuario no debe completar briefs, prompts, formularios, storyboards ni parámetros dentro de la web.

- La dirección creativa, los guiones, storyboards, escenas, assets, metadatos y paquetes de producción se preparan en la conversación de ChatGPT.
- Los archivos versionados del repositorio y el manifiesto `public/studio/productions.json` son el puente de entrega hacia la aplicación.
- La página lee el manifiesto automáticamente al abrirse, al recuperar el foco y cada 60 segundos.
- Los videos listos se muestran en el reproductor HTML5. La única acción de usuario prevista en la web es reproducir/pausar y controlar la visualización.
- Los proyectos que todavía no tienen video pueden figurar como `planned` o `rendering`; nunca se muestran como terminados si no existe un archivo reproducible.
- Los videos finales y posters se alojarán en almacenamiento aprobado para el proyecto. No se deben introducir claves privadas ni credenciales en el frontend público.
- No hay publicación automática en redes sociales. Cualquier distribución externa queda fuera del reproductor y requiere aprobación explícita.

### Manifiesto de producciones

El esquema inicial es `schemaVersion: 1`. Cada elemento de `productions` incluye un `id`, `title` y `status` (`planned`, `rendering` o `ready`). Para que aparezca el reproductor debe tener `status: "ready"` y una URL `videoUrl` reproducible. Los campos opcionales incluyen `description`, `posterUrl`, `durationSeconds`, `aspectRatio`, `language`, `platforms`, `version`, `createdAt` y `caption`.

La aplicación no inventa ni genera contenido por sí misma: refleja lo que se preparó y entregó desde la conversación. El manifiesto vacío inicial es intencional; se completará cuando exista la primera producción real renderizada y validada.
