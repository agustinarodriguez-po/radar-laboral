# Radar Laboral — asistente personal de búsqueda de empleo

**Aplicación:** https://agustinarodriguez-po.github.io/radar-laboral/  
**Backend:** Supabase, Edge Function `buscar-ofertas`.

Herramienta privada para revisar vacantes reales **redactadas principalmente en español y sin inglés obligatorio**, analizar términos ATS sin inventar experiencia, preparar postulaciones y registrar manualmente las enviadas. Las publicaciones en inglés, portugués o de idioma no confirmado se ocultan.

## Radar Laboral 2.0 — rediseño inspirado en el flujo de Landeo

Se conservó el proyecto original, la autenticación, los CV y las ofertas almacenadas. La navegación ahora dispone de: **Empleos para mí** (filtros + lista + vista previa), **Guardados**, **Mis candidaturas** (seguimiento por etapas), **Mis currículums**, **Mi perfil laboral**, **Automatización**, **Portales externos** e **Historial**.

**Auto Apply: NO disponible para enviar.** La pantalla de automatización guarda preferencias y límites para una integración futura, pero no genera una cola ejecutable ni envía CVs. Las tablas `radar_automation_settings` y `radar_job_pipeline` aplican RLS; se exige idioma español, aprobación individual y `auto_send_enabled=false` por restricción de base de datos. No existe ningún proveedor autorizado con privilegios de envío en el proyecto. La eventual integración requerirá API del proveedor explícitamente autorizada, credenciales del integrador mantenidas solo en el servidor, confirmación del candidato por vacante y CV, idempotencia, cuotas, recibo verificable y mecanismo de revocación.

- Greenhouse Job Board API permite envíos **solo con clave de la empresa**: https://docs.greenhouse.io/job-board
- Lever Postings API requiere **clave generada por administradores del empleador**: https://github.com/lever/postings-api
- Himalayas es una API **de lectura**, no de envíos; cada enlace Apply debe pasar por `applicationLink`: https://himalayas.app/docs/remote-jobs-api
- No se evaden captchas, restricciones, cuotas de terceros ni controles de privacidad.
- El límite diario en Configuración es una **preferencia futura**, no un límite operativo aún.
- Las candidaturas «enviadas» y «entrevistas» se anotan manualmente, no se infieren de la apertura de un formulario.
- Los resultados ATS siguen siendo orientativos y no implican experiencia acreditada si la persona no añadió evidencia.

La base de datos se documenta en `supabase/migrations/20261020_radar_v2.sql`. La capa visual se implementa en `radar-v2.css` y el resto del código continúa en `index.html`. Pruebas de código: `node scripts/verify.mjs`, `node scripts/test-workspace.mjs` y `node scripts/test-language.mjs`. Aún falta QA integral con sesión real y carga de CV.


## Asistente personal de carrera (requisitos de la única usuaria)

- El perfil personal incluye `favorite_tasks`, `avoid_tasks` y `priority_role`. Preferencias confirmadas: **le gustan las tareas administrativas**; **prefiere evitar atención constante o masiva a muchas personas**. Prioridad: Administración / Back Office. No asumir que disfruta tareas específicas que no haya confirmado.
- El explorador usa estos datos para ordenar por recomendación cualitativa y después por fecha. El detector de alto volumen necesita señales explícitas (call center, llamadas masivas, etc.). **No descarta todos los puestos de Customer Success por su nombre.**
- El asesor compara título, idioma, modalidad y descripción con habilidades que la usuaria confirmó mediante evidencia. Marca las palabras clave no respaldadas como **pendientes**, nunca inventa experiencia ni valores de sueldo.
- En **Analizar una oferta** la usuaria puede pegar una descripción laboral. La evaluación ocurre localmente en el navegador, sin guardarla ni consultar un servicio de IA. Los estados de idioma y geografía se indican manualmente y, si se desconocen, no se marcan como confirmados.
- Entrevistas: sugiere preguntas orientadas al puesto para que las practique con experiencias verdaderas. Las ideas de presentación son **solo temas a considerar**: queda estrictamente prohibido generar cartas completas o enviarlas.
- Este asistente es **un motor determinista de recomendaciones**, no un sistema de IA generativa y no predice el resultado de una selección. Antes de publicitar funciones de IA generativa habrá que implementar y probar un proveedor, permisos y privacidad explícitos.
- No envía postulaciones ni CVs sin su aprobación individual. Auto Apply continúa bloqueado por restricciones de base de datos.

## Estado real del MVP

| Función | Estado |
|---|---|
| Inicio de sesión con Supabase Auth | Implementado |
| Consulta bajo demanda a APIs | Implementada (Himalayas, Jobicy, Arbeitnow, Get on Board, fuentes configuradas de Greenhouse y Lever). Get on Board consulta hasta dos páginas de las categorías seleccionadas de operaciones, soporte y otras relacionadas. |
| Accesos a Computrabajo, Indeed, LinkedIn, Bumeran, Workana y WeRemoto | Implementados como **búsquedas externas abiertas por el usuario**, no como integraciones automáticas de vacantes |
| Resultados con URL original y fecha publicada | Implementado cuando la fuente aporta los datos |
| Filtro obligatorio de anuncios en español | Implementado en el backend y la interfaz; clasificador conservador, sujeto a revisión manual |
| Filtros de antigüedad y elegibilidad | Implementación básica |
| Distinción entre remoto desde Argentina confirmado y pendiente | Implementado con heurísticas conservadoras; revisar siempre el anuncio |
| Habilidades ATS con evidencia confirmada por la persona | Implementado a nivel de términos; no verifica experiencia con terceros |
| Personalización automática del archivo CV | **Pendiente** |
| Biblioteca de CV por perfil (3 o más versiones) | Implementada: nombre editable, categoría, vista previa y elección explícita por vacante; requiere prueba funcional de carga |
| Aprobación individual antes de preparar la postulación | Implementado |
| Envío automático de CV en portales externos | **NO implementado ni activado** |
| Registro manual de envío declarado por usuario | Implementado, no constituye comprobante externo |
| Pruebas automáticas | Sintaxis y presencia de funciones/controles; no equivale a E2E |

## Cómo usar

1. Ingresar con cuenta propia y revisar los datos del perfil.
2. En **Mi perfil > Evidencia de mis habilidades**, agregar una descripción real para cada conocimiento que quieras considerar respaldado. Sin evidencia las coincidencias siguen pendientes.
3. En **Mis currículums**, subir tantas versiones como necesites (mínimo tres recomendado, sin límite fijo de tres). Para cada archivo indicá un perfil y nombre descriptivo: Administración / Back Office, Procesos, Customer Success, Soporte Funcional o General. Se admiten varias versiones del mismo perfil, hasta 8 MB por archivo y según la capacidad de almacenamiento disponible. Desde ahí podés verlos, renombrarlos y eliminarlos si no están asociados a una aprobación de postulación.
4. Pulsar **Iniciar búsqueda de hoy**. Se distinguirán fecha de publicación, fecha de consulta y ubicación no confirmada. Las fuentes pueden fallar; no se inventarán resultados.
5. Abrir el enlace de cada oferta y corroborar modalidad, país de contratación, idioma y requisitos.
6. Revisar el CV sugerido según el puesto y **elegir manualmente cuál versión usar** (siempre es obligatorio seleccionar uno). Después, **autorizar exclusivamente la preparación**. La aprobación no envía datos externos.
7. Abrir el formulario real de la oferta, postular manualmente y, solo después, usar «Registrar envío realizado por mí».

## Arquitectura y seguridad

- Frontend estático en `index.html`, publicado con GitHub Pages.
- Configuración pública de conexión a Supabase en `config.js`; **nunca** incluir secretos privados.
- Motor de búsqueda versionado en `supabase/functions/buscar-ofertas/index.ts`; la función desplegada debe sincronizarse expresamente al modificar el código.
- Tablas PostgreSQL protegidas por Row-Level Security (RLS).
- CV almacenados en un bucket privado.
- La elegibilidad geográfica se confirma solo ante señales explícitas sobre Argentina. La falta de un requisito no se trata como cumplimiento confirmado.
- El puntaje de afinidad es orientativo, **no predice si un ATS aceptará el CV**.
- La confirmación de envío exige recibo o comprobación de la plataforma externa; la opción actual es solo declaración manual.

## Por terminar (P0)

- Pruebas funcionales con sesión real y las tres APIs.
- Distinguir requisitos excluyentes de deseables con mayor precisión.
- Analizar contenido del CV autorizado para generar versiones ATS editables, sin inventar experiencia.
- Guardar un comprobante real del envío si se habilitan integraciones autorizadas.
- Manejar mejor tiempos de espera, rate limiting y consultas parciales.

## Qué no hace

No publica vacantes propias ni usa `JobPosting` para indexar anuncios ajenos; es un panel personal.
No navega cuentas externas automáticamente, no evita restricciones de portales y no envía postulaciones masivamente.

## Portales argentinos sin integración automática

En la sección **Portales argentinos y latinoamericanos** podés elegir Administración, Procesos, Customer Success o Soporte Funcional y abrir Computrabajo o Indeed en una búsqueda correspondiente. LinkedIn y Bumeran se abren en sus buscadores oficiales. Las publicaciones de esos cuatro portales **no se importan automáticamente** a Radar Laboral: revisar personalmente que la oferta siga abierta, esté escrita en español, no exija inglés y admita trabajo remoto desde Argentina o modalidad híbrida en Mar del Plata.

El motor automático de Get on Board usa su API pública documentada; no existe una conexión aprobada de Radar Laboral con las APIs de búsqueda de empleo de Computrabajo, LinkedIn, Indeed ni Bumeran. No se utilizan técnicas para evadir sus controles de acceso. Para obtener datos de esas plataformas dentro de Radar Laboral se necesitaría una API autorizada o una integración aprobada.

## Workana y WeRemoto

- **Workana**: acceso externo a proyectos freelance de Argentina, en `https://www.workana.com/es/jobs?country=AR`. Dentro de Workana hay que filtrar por idioma español y categoría profesional. La mayoría de propuestas son por proyecto o por horas, no puestos laborales tradicionales.
- **WeRemoto**: accesos externos a las secciones de Administración y Atención al Cliente, seleccionadas según el puesto objetivo. No todas las publicaciones de WeRemoto están redactadas en español, por lo que el idioma debe verificarse en la oferta original.
- El filtro de español del buscador de Radar Laboral **no puede aplicarse a los sitios que se abren en otra pestaña**. No se realiza scraping ni importación automática de Workana o WeRemoto.
- **Finvert**: sin integración hasta confirmar la URL o el nombre exacto de la plataforma; no se encontró un portal laboral verificable con ese nombre. No confundir con Fiverr sin confirmación del usuario.

## Himalayas y Glassdoor (2026-10-20)

- **Himalayas**: integración automática con API pública oficial `https://himalayas.app/jobs/api/search` sin clave. Se consultan puestos de administración, operaciones, Customer Success y soporte para Argentina y se almacenan **solo si la descripción principal está en español y no exige inglés obligatorio**. La API puede no devolver vacantes compatibles; no se crean datos ficticios. Los resultados atribuyen visiblemente a Himalayas, y el enlace de postulación utiliza exclusivamente el `applicationLink` provisto por su API, como exigen sus términos. Fuente: https://himalayas.app/docs/remote-jobs-api. Su listado completo se puede consultar en `https://himalayas.app/jobs`.
- **Glassdoor Argentina**: enlace externo en `https://www.glassdoor.com.ar/Job/index.htm`. No existe una integración automática implementada. Las vacantes externas deben revisarse manualmente para confirmar descripción en español, ausencia de inglés obligatorio, modalidad y contratación desde Argentina.
- Estos cambios solo afectan el proyecto Radar Laboral; no modifican otros proyectos o bases de datos.
