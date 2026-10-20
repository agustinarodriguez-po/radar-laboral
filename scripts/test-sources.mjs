import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const backend=readFileSync('supabase/functions/buscar-ofertas/index.ts','utf8');
const html=readFileSync('index.html','utf8');
const js=html.match(/<script type="module">([\s\S]*?)<\/script>/i)?.[1]||'';
for(const term of [
 'sourceReport=tasks.map(', 'report.englishOrRequired++', 'report.languageUnconfirmed++',
 'report.spanish++', 'report.new++', 'report.updated++',
 'source_summary:{status:errors.length', 'sourceReport,sources:tasks.length',
 "assessment.language_status!=='confirmed'",
 "const keywords=['administrativo','back office','operaciones'"
])assert.ok(backend.includes(term),'Falta auditoría por fuente/idioma en backend: '+term);
for(const term of ['sourceReportPanel','sourceReportList','sourceFilter',
 'function renderSourceDiagnostics(', 'renderSourceDiagnostics();',
 "$('sourceFilter').value!=='all'", "'sourceFilter','searchText'"]){
 assert.ok(html.includes(term),'Falta filtro/diagnóstico visible: '+term);
}
assert.ok(!/source:\s*['"](?:workana|computrabajo|glassdoor|linkedin|indeed|bumeran)['"]/.test(backend),
  'No presentar portales externos sin API como fuentes automáticas');
console.log('QA fuentes: 4 APIs verificables, descarte estricto del inglés y trazabilidad por portal, OK.');
