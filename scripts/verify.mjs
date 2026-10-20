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
console.log('QA básico aprobado: sintaxis del JavaScript, '+declared.size+' elementos HTML y '+selected.length+' referencias de controles verificadas.');
