# Azure Speech F0 — configuración inicial de voz

Ingredora usa Azure Speech **Free F0** para sintetizar la locución. El nivel F0 incluye 500.000 caracteres al mes de voz neuronal estándar; el servicio no debe cambiarse a S0 ni habilitarse facturación de pago para este proyecto. La cuota y disponibilidad pueden cambiar; comprobar el nivel F0 en el portal antes de usarlo.

## Voz elegida

- Localidad: español de Argentina (`es-AR`)
- Voz: `es-AR-ElenaNeural`
- Salida: MP3 mono 24 kHz
- Uso inicial: una narración corta por producción

Microsoft documenta las voces `es-AR-ElenaNeural` y `es-AR-TomasNeural` como voces estándar neuronales.

## Alta única requerida

1. Crear una cuenta/suscripción Azure si todavía no existe.
2. Crear un recurso **Speech** y seleccionar el nivel gratuito **F0**. No seleccionar S0.
3. En el recurso, copiar la clave y el identificador de región.
4. En el repositorio GitHub, abrir **Settings → Secrets and variables → Actions → New repository secret**.
5. Crear estos dos secretos:
   - `AZURE_SPEECH_KEY`: clave del recurso Speech.
   - `AZURE_SPEECH_REGION`: región exacta del recurso (por ejemplo, `eastus`).
6. Abrir **Actions → Generate Nutella voiceover → Run workflow** una vez.

El workflow genera `public/studio/audio/nutella-v5-voice-es-AR.mp3` y lo guarda en el repositorio para que GitHub Pages pueda servirlo. La clave nunca se copia al código, al paquete ni al sitio público.

## Seguridad y presupuesto

- No introducir la clave en la web ni en un archivo del repositorio.
- No usar credenciales de Azure en el navegador.
- Mantener el recurso en F0 y revisar el consumo mensual en Azure Cost Management.
- No activar S0 ni recursos adicionales de pago.
- El workflow se ejecuta manualmente para evitar llamadas de voz inesperadas.

## Referencias oficiales

- [Precios de Azure Speech](https://azure.microsoft.com/pricing/details/speech/): F0 incluye 0,5 millones de caracteres mensuales de voz neuronal estándar.
- [Voces e idiomas](https://learn.microsoft.com/azure/ai-services/speech-service/language-support): voces argentinas Elena y Tomás.
- [API REST de texto a voz](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech): autenticación por clave y solicitud SSML.
