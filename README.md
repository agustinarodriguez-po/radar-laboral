# Radar Laboral — asistente personal de búsqueda de empleo

**Aplicación:** https://agustinarodriguez-po.github.io/radar-laboral/  
**Backend:** Supabase, Edge Function `buscar-ofertas`.

Herramienta privada para revisar vacantes reales **redactadas principalmente en español y sin inglés obligatorio**, analizar términos ATS sin inventar experiencia, preparar postulaciones y registrar manualmente las enviadas. Las publicaciones en inglés, portugués o de idioma no confirmado se ocultan.

## Estado real del MVP

| Función | Estado |
|---|---|
| Inicio de sesión con Supabase Auth | Implementado |
| Consulta bajo demanda a APIs | Implementada (Jobicy, Arbeitnow, Get on Board, fuentes configuradas de Greenhouse y Lever). Get on Board consulta hasta dos páginas de las categorías seleccionadas de operaciones, soporte y otras relacionadas. |
| Accesos a Computrabajo, Indeed, LinkedIn y Bumeran | Implementados como **búsquedas externas abiertas por el usuario**, no como integraciones automáticas de vacantes |
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
