// Radar Laboral · asistente personal de orientación laboral (reglas deterministas).
// No contiene un modelo generativo. NO redacta cartas ni envía postulaciones.
export const roleNames=Object.freeze({
  administracion:'Administración / Back Office',
  procesos:'Procesos / Operaciones',
  soporte_funcional:'Soporte / Análisis funcional',
  customer:'Customer Success',
  sin_definir:'Sin prioridad establecida'
});
const roleExpressions=[
 ['administracion',/\badministra|back[\s-]?office|\bfactur|\bcobranz|\bbilling|\baccounts receivable|\btesorer/i],
 ['procesos',/\bproces|\boperacion|\boperativ|\boperations|\bprocess|\bconciliac|\breconciliation/i],
 ['soporte_funcional',/\bsoporte funcional|\banalista funcional|\bfunctional analyst|\bbusiness analyst|\bapplication support|\bimplementaci[oó]n de sistemas/i],
 ['customer',/\bcustomer success|\bcustomer support|\bcustomer experience|\batenci[oó]n al cliente|\bclient success|\bonboarding/i]
];
export function normalizeText(value=''){
 return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
}
export function splitPreferences(value){
 return String(value||'').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean).slice(0,25);
}
export function roleFor(title){
 return roleExpressions.find(([,re])=>re.test(String(title||'')))?.[0]||null;
}
export function mentionsHighVolumeAttention(title,body){
 const text=normalizeText([title,body].join(' '));
 return /(?:call[\s-]?center|contact[\s-]?center|telemarketing|atencion\s+(?:masiva|continua|constante)\s+(?:al publico|a clientes|a personas)|alto volumen de (?:llamadas|clientes|consultas|tickets)|gran volumen de (?:llamadas|clientes|consultas)|mas de \d+ llamadas (?:al dia|diarias)|atender \d+ (?:llamadas|clientes) diari)/i.test(text);
}
const interviewByRole={
 administracion:[
  '¿Qué controles utilizás para evitar errores en planillas, registros o liquidaciones?',
  '¿Cómo organizás prioridades cuando hay cierres, vencimientos y tareas simultáneas?',
  '¿Podés describir una mejora administrativa que hayas implementado realmente?'
 ],
 procesos:[
  '¿Cómo documentarías un proceso actual y sus oportunidades de mejora?',
  '¿Qué indicadores revisarías para identificar demoras o errores en una operación?',
  '¿Cómo gestionarías una diferencia entre el procedimiento documentado y lo que ocurre en la práctica?'
 ],
 soporte_funcional:[
  '¿Cómo relevarías y validarías un requerimiento con usuarios y desarrollo?',
  '¿Qué información incluirías en una historia de usuario y sus criterios de aceptación?',
  '¿Cómo investigarías una incidencia sin asumir que conocés su causa?'
 ],
 customer:[
  '¿Cómo organizarías el seguimiento de una cartera de clientes sin perder tareas pendientes?',
  '¿Cómo comunicarías a un cliente una demora o incidencia operativa?',
  '¿Cómo diferenciarías atención personalizada de un puesto de alto volumen de consultas?'
 ]
};
export function extractJDKeywords(text=''){
 const terms=['Excel','Google Sheets','Jira','Confluence','Power BI','SAP','SQL','API','CRM','back office','administración','facturación','liquidaciones','cobranzas','cuentas corrientes','conciliación','historias de usuario','documentación funcional','soporte funcional','atención al cliente','customer success','onboarding','gestión de clientes','mejora continua','procesos','operaciones','reportes','análisis de datos'];
 const plain=normalizeText(text);
 return terms.filter(term=>{
  const phrase=normalizeText(term).replace(/[.*+?^$()|[\]{}\\]/g,'\\export function evaluateJob(job={},profile={},evidence=[],cvs=[]){');
  return new RegExp('(?:^|[^a-z])'+phrase+'(?:$|[^a-z])').test(plain);
 }).slice(0,30);
}
export function evaluateJob(job={},profile={},evidence=[],cvs=[]){
 const title=String(job.title||'Puesto no informado');
 const company=String(job.company||'Empresa no informada');
 const desc=String(job.description_text||job.description||'');
 const role=roleFor(title);
 const desired=profile.priority_role||'sin_definir';
 const language=job.language_status||'pending';
 const geography=job.geography_status||'pending';
 const preferences=splitPreferences(profile.favorite_tasks);
 const avoid=splitPreferences(profile.avoid_tasks);
 const highVolume=mentionsHighVolumeAttention(title,desc);
 const rolePriority=(desired==='administracion' && role==='administracion')||role===desired;
 const verified=(Array.isArray(evidence)?evidence:[]).filter(e=>e?.confirmed===true && String(e.evidence||'').trim().length>=15);
 const terms=[...new Set((Array.isArray(job.ats_found)?job.ats_found:[]).filter(t=>typeof t==='string'))].slice(0,45);
 const strengths=terms.filter(t=>verified.some(e=>normalizeText(e.skill)===normalizeText(t)));
 const unverified=terms.filter(t=>!strengths.includes(t));
 const matches=(Array.isArray(cvs)?cvs:[]).filter(c=>role&&c.profile_type===role);
 const positive=[];
 const missing=[];
 const blockers=[];
 if(language!=='confirmed')blockers.push(language==='excluded'?'Idioma de la publicación incompatible':'No se confirmó que el aviso esté en español y sin inglés obligatorio');
 else positive.push('Aviso clasificado como redactado en español');
 if(geography==='excluded')blockers.push('Modalidad o ubicación incompatible');
 else if(geography==='confirmed')positive.push('Ubicación indicada como compatible con Argentina');
 else missing.push('Confirmar que la empresa acepta trabajo desde Argentina o híbrido en Mar del Plata');
 if(role==='administracion')positive.push('El puesto se relaciona con funciones administrativas');
 else if(role==='procesos')positive.push('Puesto orientado a operaciones o procesos');
 else if(role==='soporte_funcional')positive.push('Puesto vinculado a soporte o análisis funcional');
 else if(role==='customer')positive.push('Puesto de Customer Success: verificar proporción de contacto con clientes');
 if(rolePriority)positive.push('Coincide con tu perfil profesional prioritario');
 if(strengths.length)positive.push('Hay palabras clave respaldadas por experiencias que confirmaste');
 if(!job.published_at)missing.push('Verificar fecha de publicación y si sigue abierta');
 if(!job.salary_text)missing.push('Consultar salario, moneda y periodicidad');
 if(!role)missing.push('Revisar las funciones del puesto: el título no permite clasificarlo con seguridad');
 if(!preferences.length)missing.push('Indicar qué tareas te gustan para mejorar la priorización');
 if(!verified.length)missing.push('Registrar experiencia comprobable para evaluar requisitos del puesto');
 if(unverified.length)missing.push('Confirmar las palabras clave sin evidencia antes de incorporarlas al CV');
 if(!matches.length)missing.push('Elegir cuál de tus CV es adecuado para esta oferta');
 if(highVolume)missing.push('El aviso menciona atención de alto volumen, una tarea que preferís evitar');
 // Los puestos de Customer Success no se descartan solo por ese título.
 // "No lo disfruto mucho" es preferencia, no incompatibilidad absoluta.
 const rating=blockers.length?'No compatible':highVolume?'Menor prioridad':geography==='pending'?'Revisar requisitos':rolePriority?'Prioritaria':role==='administracion'||role==='procesos'||role==='soporte_funcional'?'Interesante':'Evaluar tareas';
 const priority=blockers.length?0:highVolume?1:rolePriority&&geography==='confirmed'?5:rolePriority?4:role&&role!=='customer'?3:role==='customer'?2:1;
 const confirmedDetails=strengths.slice(0,5).map(skill=>({
  skill,evidence:verified.find(e=>normalizeText(e.skill)===normalizeText(skill))?.evidence||''
 }));
 const questions=role ? interviewByRole[role] : [
  '¿Qué tareas concretas harías durante una jornada habitual?',
  '¿Qué competencias exige el puesto y cuáles podés demostrar con ejemplos reales?',
  '¿Cómo describirías tu experiencia que sea relevante para este puesto?'
 ];
 const clarification=missing.slice(0,5);
 if(role==='customer'&&!highVolume)clarification.unshift('¿Cuántos clientes atenderías por día y el contacto sería individual o masivo?');
 if(highVolume)clarification.unshift('¿Qué proporción del trabajo consiste en atención masiva o llamadas?');
 const talkingPoints=[
  ...(role==='administracion'?['Tu experiencia concreta organizando tareas y controles administrativos']:[]),
  ...(role==='procesos'?['Un proceso real que hayas documentado o mejorado']:[]),
  ...(role==='soporte_funcional'?['Una necesidad de usuario que hayas relevado o documentado']:[]),
  ...(role==='customer'?['Cómo organizás el seguimiento de tareas y relaciones profesionales']:[]),
  ...confirmedDetails.slice(0,2).map(x=>'Un ejemplo verdadero de uso de '+x.skill),
  'Por qué te interesa la organización y las tareas particulares de esta empresa',
  'Qué podés aportar en este puesto sin afirmar experiencia que no tengas'
 ];
 return {
  title,company,role,roleName:roleNames[role]||'Perfil por definir',
  rating,priority,highVolume,positives:positive.slice(0,5),blocking:blockers,
  questionsToClarify:[...new Set(clarification)],
  verifiedKeywords:strengths,unverifiedKeywords:unverified,
  evidenceExamples:confirmedDetails,suggestedCVs:matches.map(c=>({id:c.id,title:c.display_name||c.file_name||'CV sin nombre'})),
  interviewQuestions:questions,
  coverLetterIdeas:[...new Set(talkingPoints)]
 };
}
