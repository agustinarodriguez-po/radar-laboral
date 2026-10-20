# Radar Laboral · MVP

Buscador personal de ofertas laborales verificables, con filtros para trabajo remoto desde Argentina, análisis orientativo de términos ATS, CV privado y aprobación individual antes de cada postulación.

## Estado
- Frontend: aplicación estática, prevista para GitHub Pages.
- Supabase: proyecto independiente `gmzdhonubpbywlwaplok`.
- Base de datos: esquema con RLS y almacenamiento privado ya implementado en Supabase.
- Backend: Edge Function `buscar-ofertas` desplegada; consulta Arbeitnow, Get on Board y bolsas de empresas añadidas de Greenhouse/Lever. La disponibilidad de cada fuente depende de sus APIs.
- **No envía postulaciones de manera automática.** La aprobación habilita la preparación y apertura de la oferta, nunca un envío sin permiso.
- El análisis ATS compara el texto de las ofertas con habilidades declaradas; aún no modifica archivos de CV.
- La compatibilidad geográfica o el idioma se consideran pendientes cuando las publicaciones no son explícitas.
- No contiene empleos ficticios. Una API fallida presenta errores y no se reemplaza por datos inventados.

## Publicación
1. GitHub > Settings > Pages > Build and deployment > Deploy from a branch > main > /(root).
2. En Supabase > Authentication > URL Configuration, añadir la URL real de GitHub Pages en Site URL y Redirect URLs. **No asumir que GitHub Pages ya está publicado** hasta ver el enlace de confirmación de GitHub.
3. En la web, registrarse con correo propio; completar el perfil con habilidades acreditadas y subir un CV PDF o Word (máximo 8 MB).
4. Pulsar **Iniciar búsqueda de hoy**. Inspeccionar los resultados: fuente, URL, fechas y elegibilidad.
5. Para preparar una postulación, seleccionar el CV, abrir y revisar la publicación original y confirmar expresamente. El envío al portal es manual.

## Seguridad
No subir CV ni credenciales a GitHub. `config.js` solo tiene una clave **publicable** de Supabase. Los datos personales se aíslan mediante RLS y los CV se almacenan en bucket privado. Jamás colocar `service_role`, `sb_secret` o passwords en archivos públicos.

## Archivos
- `index.html`: estructura visual
- `styles.css`: estilos adaptables
- `app.js`: login, consulta, filtros, CV, revisión y registro de autorizaciones
- `config.js`: identificación pública del proyecto Supabase

## Pendiente para producción
Prueba integral con cuenta autenticada y APIs activas; verificar las redirecciones de login de Supabase; validar la cobertura regional real de las fuentes; mejorar la extracción de requisitos y la generación de versiones ATS; añadir integraciones de postulación solamente donde estén autorizadas.