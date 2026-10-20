import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const html=readFileSync('index.html','utf8');
const match=html.match(/<script type="module">([\s\S]*?)<\/script>/i);
if(!match)throw new Error('No se encuentra el módulo JavaScript en index.html');
const js=match[1];
const parsed=spawnSync(process.execPath,['--input-type=module','--check'],{input:js,encoding:'utf8'});
if(parsed.status!==0)throw new Error('JavaScript inválido: '+(parsed.stderr||parsed.stdout));
const declared=new Set([...html.matchAll(/\bid="([\w-]+)"/g)].map(m=>m[1]));
const dynamic=new Set(['approve','chooseCV','confirmJob']);
const selected=[...js.matchAll(/\$\('([\w-]+)'\)/g)].map(m=>m[1]);
const missing=[...new Set(selected)].filter(x=>!declared.has(x)&&!dynamic.has(x));
if(missing.length)throw new Error('Controles referenciados sin elemento HTML: '+missing.join(', '));
for(const id of ['scan','resetFilters','profileForm','sourceForm','uploadForm','logout','showPassword']){
 if(!js.includes("$('"+id+"').on"))throw new Error('Falta conectar botón/formulario: '+id);
}

// Regression checks for code paths not caught by JavaScript's syntax checker.
for (const fn of ['signIn','refresh','render','openJob','viewCV','removeEvidence','removeSource']) {
  if (!new RegExp('(?:async\\s+)?function\\s+' + fn + '\\s*\\(').test(js)) {
    throw new Error('Falta función necesaria: ' + fn);
  }
}
for (const handler of ['evidenceForm','markApplied','salaryFilter']) {
  if (!js.includes(handler)) throw new Error('Falta el flujo: ' + handler);
}
for (const id of ['evidenceForm','evidenceList','evidenceSkill','evidenceText','evidenceConfirm','salary','salaryFilter']) {
  if (!declared.has(id)) throw new Error('Falta el control accesible: ' + id);
}
if (!js.includes("application_approvals") || !js.includes("user_reported_sent_at")) {
 throw new Error('Falta trazabilidad de la postulación manual');
}

for(const id of ['cvProfile','cvDisplayName','cvCount','uploadButton','cvFile']){
 if(!declared.has(id))throw new Error('Control de múltiples CV ausente: '+id);
}
for(const method of ['editCV','deleteCV','viewCV','cvLabel','cvTitle','suggestedCVProfile']){
 if(!new RegExp('(?:async\\s+)?function\\s+'+method+'\\s*\\(').test(js))throw new Error('Función de currículums ausente: '+method);
}
for(const id of ['data-cv-edit','data-cv-delete','chooseCV','previewSelectedCV']){
 if(!js.includes(id))throw new Error('Flujo de selección CV ausente: '+id);
}
if(!js.includes('profile_type:profile')||!js.includes('display_name:name'))throw new Error('La carga no guarda nombre y categoría del CV');
if(!js.includes('cvs.find(c=>c.id===cv)'))throw new Error('La autorización no asocia la versión seleccionada');

for(const id of ['cvEditor','cvEditForm','cvEditorName','cvEditorProfile','cvEditorSave','cvEditorCancel']){
 if(!declared.has(id))throw new Error('Falta el editor de CV: '+id);
}
if(!js.includes("$('cvEditForm').onsubmit"))throw new Error('No está conectado el botón de editar currículum');
if(js.includes("prompt('Nombre para identificar este CV:"))throw new Error('Edición antigua de CV todavía activa');

// El acceso a portales argentinos no debe confundirse con extracción automática.
for(const id of ['portales','portalRole','portal-computrabajo','portal-indeed','portal-linkedin','portal-bumeran']){
 if(!declared.has(id))throw new Error('Falta el acceso a portal argentino: '+id);
}
if(!js.includes('function renderPortalLinks(')||!js.includes('PORTAL_COMPUTRABAJO')){
 throw new Error('No funciona la elección de portal según el perfil');
}
for(const id of ['portal-workana','portal-weremoto']){
 if(!declared.has(id))throw new Error('Falta acceso verificado a '+id);
}
if(!js.includes('PORTAL_WEREMOTO')||!js.includes("$('portal-weremoto').href")){
 throw new Error('El enlace de WeRemoto no se adapta al perfil');
}
if(!html.includes('https://www.workana.com/es/jobs?country=AR')){
 throw new Error('No está disponible la búsqueda Workana Argentina');
}
if(!html.includes('el filtro obligatorio de español se aplica a las ofertas dentro de Radar Laboral')){
 throw new Error('Falta la advertencia de idioma en sitios externos');
}
if(!html.includes('Búsqueda externa, no automatizada')){
 throw new Error('Falta aclarar que estos portales no están integrados a la API');
}

// Himalayas puede alimentarse por API pública; Glassdoor solo vía enlace externo.
for(const id of ['portal-himalayas','portal-glassdoor']){
 if(!declared.has(id))throw new Error('No aparece el nuevo portal '+id);
}
if(!html.includes('https://www.glassdoor.com.ar/Job/index.htm'))throw new Error('Falta el enlace oficial a Glassdoor Argentina');
if(!html.includes('Datos proporcionados por Himalayas'))throw new Error('Falta atribución visible a Himalayas');
const backend=readFileSync('supabase/functions/buscar-ofertas/index.ts','utf8');
for(const item of ['async function himalayas()',"name:'Himalayas · Argentina'","country=AR&sort=recent&page=1","source:'himalayas'","assessment.language_status!=='confirmed'"]){
 if(!backend.includes(item))throw new Error('Falta integración segura de Himalayas: '+item);
}
if(!backend.includes('url:applicationLink,apply_url:applicationLink'))throw new Error('Se debe usar applicationLink de Himalayas para postular');
if(backend.includes("source:'glassdoor'"))throw new Error('Glassdoor no debe figurar como fuente automática sin autorización');
console.log('QA básico aprobado: sintaxis del JavaScript, '+declared.size+' elementos HTML y '+selected.length+' referencias de controles verificadas.');
