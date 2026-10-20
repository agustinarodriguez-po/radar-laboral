import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8');
const css=readFileSync('radar-v2.css','utf8');
const backend=readFileSync('supabase/functions/buscar-ofertas/index.ts','utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'El frontend debe cargar su módulo JS');
for(const name of ['ofertas','analizar','guardados','pipeline','cvs','perfil','automation','portales','historial']){
 assert.ok(html.includes('id="'+name+'"'), 'Falta pantalla: '+name);
 assert.ok(html.includes('data-screen="'+name+'"'), 'Falta acceso lateral a: '+name);
}
for(const id of ['jobPreview','jobList','pipelineBoard','savedList','autoForm','autoDailyLimit','autoConsent','autoPreparation']){
 assert.ok(html.includes('id="'+id+'"'),'No se encontró: '+id);
}
for (const id of ['jdForm','jdTitle','jdCompany','jdDescription','jdLanguage','jdGeo','jdResult','favoriteTasks','avoidTasks','priorityRole']) {
 assert.ok(html.includes('id="'+id+'"'),'Falta control de asistente personalizado: '+id);
}
assert.ok(script.includes("careerProfile=p;"),'No se cargan las preferencias laborales personales');
assert.ok(script.includes("adviceHTML(job)"),'La interfaz no ejecuta el asistente');
assert.ok(script.includes("extractJDKeywords(title+' '+description)"),'No se analizan descripciones compartidas');
assert.ok(script.includes("favorite_tasks:$('favoriteTasks').value.trim()"),'No se guardan tareas favoritas');
assert.ok(script.includes("avoid_tasks:$('avoidTasks').value.trim()"),'No se guardan tareas que preferís evitar');
assert.ok(css.includes('.job-explorer{display:grid;grid-template-columns:'),'Falta explorador tres columnas');
assert.ok(css.includes('@media(max-width:760px)'),'Sin diseño para celular');
assert.ok(script.includes("jobs.filter(j=>j.language_status==='confirmed')"),'El filtro obligatorio de español desapareció');
assert.ok(script.includes("get('radar_job_pipeline','updated_at')"),'No se carga el seguimiento privado');
assert.ok(script.includes("sb.from('radar_automation_settings').upsert"),'No se guardan preferencias de seguridad');
assert.ok(script.includes('individual_approval_required:true'),'Aprobación individual debe seguir habilitada');
assert.ok(script.includes('auto_send_enabled:false'),'El envío automático NO debe quedar activado');
assert.ok(script.includes('authorized_provider_codes:[]'),'No pueden inventarse autorizaciones de proveedores');
assert.ok(!/fetch\(\s*['"`][^\n]*\{\s*method\s*:\s*['"`]POST/i.test(script),'No se permiten transmisiones POST directas a empresas');
assert.ok(script.includes("stage==='applied'&&!confirm("),'Un envío declarado requiere confirmación');
assert.ok(script.includes("stage==='ready'&&!approvals.some("),'No se puede pasar a CV aprobado sin aprobación');
assert.ok(script.includes('async function updatePipeline('),'Falta guardar/archivar candidatura');
assert.ok(script.includes('function renderPreview('),'Falta vista previa');
assert.ok(backend.includes("assessment.language_status!=='confirmed'"),'El backend debe ignorar otros idiomas');
console.log('Radar 2.0: navegación, responsive, ofertas en español, estados y guardarraíles Auto Apply validados (pruebas estáticas).');
