import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

type Offer = {source:string;source_slug:string;external_id:string;company:string;title:string;location_text:string;workplace:string;url:string;apply_url:string;description_text:string;published_at:string|null;updated_at_source:string|null};
const hdr={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:hdr});
const target=/administrati|administrativ|back.?office|operaci[oó]n|operations|process|procesos|analista funcional|functional analyst|business analyst|customer success|customer support|soporte|support|billing|factur|cobranz|collection|accounts receivable|reconciliation|onboarding|account specialist/i;
const tooSenior=/\b(senior|sr\.?|lead|head|director|chief|vp)\b/i;
const terms=['Excel','Google Sheets','Jira','Confluence','SAP','Power BI','Qlik Sense','administración','Back Office','Customer Success','onboarding','facturación','cuentas corrientes','conciliaciones','cobranzas','liquidaciones','procesos','operations','mejora continua','reportes','documentación funcional','requerimientos','historias de usuario','Agile','Scrum','SQL','API','CRM','análisis funcional','gestión de clientes'];
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const isRelevant=(title:string)=>target.test(title)&&!tooSenior.test(title);
const slugOK=(s:string)=>/^[a-z0-9-]{2,60}$/.test(s);
const validURL=(u:string)=>{try{const v=new URL(u);return v.protocol==='https:' && !!v.hostname && !v.username && !v.password;}catch{return false;}};
const strip=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const iso=(v:unknown)=>{if(!v)return null;const d=new Date(typeof v==='number'?(v<1e11?v*1000:v):String(v));return Number.isNaN(+d)?null:d.toISOString();};
async function get(u:string):Promise<any>{const r=await fetch(u,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(11000)});if(!r.ok)throw new Error('API HTTP '+r.status);return r.json();}
type Evidence = {skill:string,evidence:string,confirmed:boolean};
function classify(j:Offer,evidences:Evidence[],roles:string){
 const area=normalize(j.location_text+' '+j.workplace);
 const description=normalize(j.description_text);
 const name=normalize(j.title);
 let geography_status:'confirmed'|'pending'|'excluded'='pending';
 let language_status:'confirmed'|'pending'|'excluded'='pending';
 const reasons:string[]=[];
 const hybrid=/(h[ií]brid|hybrid|onsite|on.site|presencial)/.test(area);
 const remote=/(remote|remoto|teletrabajo|anywhere)/.test(area);
 const mentionsArg=/(^|[^a-z])argentina([^a-z]|$)/.test(area);
 const excludesArg=/(except|excepto|excluding|excluye|no contractors? from|not available in|not available for|fuera de|except:).{0,42}argentina/.test(description+' '+area);
 if(hybrid && !/mar del plata/.test(area)){
   geography_status='excluded';reasons.push('Modalidad presencial o híbrida fuera de Mar del Plata');
 } else if (hybrid && /mar del plata/.test(area)){
   geography_status='confirmed';reasons.push('Modalidad en Mar del Plata');
 } else if (excludesArg){
   geography_status='excluded';reasons.push('La publicación excluye explícitamente Argentina');
 } else if(remote && mentionsArg){
   geography_status='confirmed';reasons.push('La ubicación publicada menciona Argentina y trabajo remoto');
 } else if(/remote|remoto|teletrabajo|anywhere/.test(area)){
   reasons.push('Es remota, pero falta confirmar contratación desde Argentina');
 } else {
   reasons.push('Ubicación y modalidad no suficientemente documentadas');
 }
 if(/english (required|mandatory|fluency|proficiency)|fluent (in )?english|advanced english|c1 (level )?english|must (be )?(fluent|proficient).{0,20}english|ingles (obligatorio|excluyente|avanzado|fluido)|dominio del ingles|bilingual.{0,20}english/.test(description)){
   language_status='excluded';reasons.push('Requiere inglés avanzado o fluido');
 } else if(/idioma espanol|spanish speaking|trabajo en espanol|solo espanol|spanish required|espanol nativo/.test(description)){
   language_status='confirmed';
 } else {
   reasons.push('Idioma laboral no confirmado');
 }
 const profile=normalize(roles);
 const roleClusters=[
  [/administra|back.?office|billing|factur|cobranz|collection|accounts receivable/i,/administra|back.?office|factur|cobranz|administrativ/],
  [/process|proceso|operations|operaci[oó]n|reconciliation/i,/proces|operaci|operations|liquida/],
  [/analista funcional|functional analyst|business analyst/i,/analista funcional|functional analyst|business analyst/],
  [/customer success|customer support|onboarding|soporte|support/i,/customer success|soporte|support/],
 ];
 const roleMatch=roleClusters.some(([jobRe,roleRe])=>jobRe.test(name)&&roleRe.test(profile));
 const role_match=roleMatch?'matched':'pending';
 if(!roleMatch)reasons.push('El nombre del puesto necesita evaluación individual');
 const full=normalize(j.title+' '+j.description_text);
 const found=terms.filter(t=>full.includes(normalize(t)));
 // Únicamente se marcan como respaldadas las habilidades que la persona CONFIRMÓ CON EVIDENCIA.
 const matched=found.filter(t=>evidences.some(e=>e.confirmed&&normalize(e.skill.trim())===normalize(t)&&e.evidence.trim().length>=15));
 const score=Math.max(0,Math.min(100,Math.round(12+(roleMatch?24:0)+matched.length*4+(geography_status==='confirmed'?25:0)+(language_status==='confirmed'?12:0)-(language_status==='excluded'?45:0)-(geography_status==='excluded'?45:0))));
 return {geography_status,language_status,role_match,eligibility_reason:reasons.join('. '),suitability_score:score,ats_found:found,ats_matched:matched,ats_pending:found.filter(t=>!matched.includes(t))};
}
async function arbeitnow():Promise<Offer[]>{
 const v=await get('https://www.arbeitnow.com/api/job-board-api');
 if(!Array.isArray(v.data))throw Error('Respuesta inválida de Arbeitnow');
 return v.data.filter((x:any)=>x.remote===true&&isRelevant(String(x.title||''))).slice(0,75).flatMap((x:any)=>{
  const url=String(x.url||'');if(!validURL(url))return [];
  return [{source:'arbeitnow',source_slug:'europe',external_id:String(x.slug||url),company:String(x.company_name||'Empresa no informada'),title:String(x.title),location_text:String(x.location||''),workplace:'remote',url,apply_url:url,description_text:strip(String(x.description||'')),published_at:iso(x.created_at),updated_at_source:null}];
 });
}
async function jobicy():Promise<Offer[]>{
 // API pública documentada: solo ofertas publicadas en los últimos siete días.
 const response=await get('https://jobicy.com/api/v2/remote-jobs?count=200');
 if(!Array.isArray(response.jobs))throw Error('No se obtuvo una lista válida de Jobicy');
 return response.jobs.filter((x:any)=>isRelevant(String(x.jobTitle||''))).slice(0,75).flatMap((x:any)=>{
   const url=String(x.url||'');
   if(!validURL(url)||!['jobicy.com','www.jobicy.com'].includes(new URL(url).hostname))return [];
   const geo=String(x.jobGeo||'');
   return [{source:'jobicy',source_slug:'public',external_id:String(x.id),company:String(x.companyName||'Empresa no informada'),title:String(x.jobTitle||''),location_text:geo,workplace:'remote',url,apply_url:url,description_text:strip(String(x.jobDescription||x.jobExcerpt||'')),published_at:iso(x.pubDate),updated_at_source:null}];
 });
}
async function getonbrd():Promise<Offer[]>{
 const v=await get('https://www.getonbrd.com/api/v0/categories');
 if(!Array.isArray(v.data))throw Error('Categorías no disponibles');
 const ids=v.data.filter((x:any)=>/administr|support|soporte|business|customer|operations|operac|finance|management|other/i.test(String(x.attributes?.name||x.id))).map((x:any)=>String(x.id)).filter(slugOK).slice(0,5);
 if(!ids.length)throw Error('Ninguna categoría compatible');
 const batches=await Promise.allSettled(ids.map(async id=>{
  const b=await get('https://www.getonbrd.com/api/v0/categories/'+id+'/jobs?per_page=120&page=1&expand[]=company');
  if(!Array.isArray(b.data))throw Error('Vacantes no disponibles');
  return b.data.filter((x:any)=>x.attributes?.remote===true && isRelevant(String(x.attributes.title||''))).flatMap((x:any)=>{
    const a=x.attributes||{},url=String(x.links?.public_url||'');
    if(!validURL(url)||!/^(\w+\.)?getonbrd\.(com|cl|com\.ar)$/.test(new URL(url).hostname))return [];
    const company=a.company?.data?.attributes?.name||a.company?.data?.id||'Empresa en Get on Board';
    return [{source:'getonbrd',source_slug:id,external_id:String(x.id),company:String(company),title:String(a.title),location_text:String(a.remote_zone||'')+' '+(Array.isArray(a.countries)?a.countries.join(', '):''),workplace:'remote',url,apply_url:url,description_text:strip(String(a.description||'')+' '+String(a.functions||'')+' '+String(a.desirable||'')),published_at:iso(a.published_at),updated_at_source:null}];
  });
 }));
 const good=batches.filter((x):x is PromiseFulfilledResult<Offer[]>=>x.status==='fulfilled');
 if(!good.length)throw Error('Error consultando categorías');
 return good.flatMap(x=>x.value);
}
async function greenhouse(id:string):Promise<Offer[]>{
 const [v,board]=await Promise.all([get('https://boards-api.greenhouse.io/v1/boards/'+id+'/jobs?content=true'),get('https://boards-api.greenhouse.io/v1/boards/'+id)]);
 if(!Array.isArray(v.jobs))throw Error('No hay vacantes');
 return v.jobs.filter((x:any)=>x.internal_job_id!=null&&isRelevant(String(x.title||''))).slice(0,120).flatMap((x:any)=>{
  const url=String(x.absolute_url||'');if(!validURL(url))return [];
  const location=String(x.location?.name||'');
  return [{source:'greenhouse',source_slug:id,external_id:String(x.id),company:String(board.name||id),title:String(x.title),location_text:location,workplace:location,url,apply_url:url,description_text:strip(String(x.content||'')),published_at:null,updated_at_source:iso(x.updated_at)}];
 });
}
async function lever(id:string):Promise<Offer[]>{
 const v=await get('https://api.lever.co/v0/postings/'+id+'?mode=json&limit=100');
 if(!Array.isArray(v))throw Error('Respuesta inválida de Lever');
 return v.filter((x:any)=>isRelevant(String(x.text||''))).flatMap((x:any)=>{
  const url=String(x.hostedUrl||'');if(!validURL(url))return [];
  const location=String(x.categories?.allLocations?.join(', ')||x.categories?.location||'');
  return [{source:'lever',source_slug:id,external_id:String(x.id),company:id,title:String(x.text),location_text:location,workplace:String(x.workplaceType||''),url,apply_url:validURL(String(x.applyUrl||''))?String(x.applyUrl):url,description_text:strip(String(x.descriptionPlain||x.descriptionBodyPlain||x.description||'')),published_at:iso(x.createdAt),updated_at_source:null}];
 });
}
async function listFor(j:any):Promise<Offer[]>{
 if(j.source==='greenhouse'&&slugOK(j.source_slug))return greenhouse(j.source_slug);
 if(j.source==='lever'&&slugOK(j.source_slug))return lever(j.source_slug);
 if(j.source==='getonbrd')return getonbrd();
 if(j.source==='arbeitnow')return arbeitnow();
 if(j.source==='jobicy')return jobicy();
 return [];
}
Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{headers:hdr});
 if(request.method!=='POST')return respond({error:'Método no admitido'},405);
 const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
 if(!token)return respond({error:'Iniciá sesión'},401);
 const base=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||'';
 if(!base||!key)return respond({error:'Configuración del servicio incompleta'},500);
 const sb=createClient(base,key,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:who}=await sb.auth.getUser(token);
 if(who||!user)return respond({error:'Sesión inválida'},401);
 let body:any;try{body=await request.json()}catch{return respond({error:'JSON inválido'},400)}
 if(body.action==='verify'){
  if(!/^[0-9a-f-]{36}$/i.test(String(body.job_id||'')))return respond({error:'Identificador inválido'},400);
  const {data:j,error}=await sb.from('jobs').select('*').eq('user_id',user.id).eq('id',body.job_id).single();
  if(error||!j)return respond({error:'Oferta no encontrada'},404);
  let active=false;try{const offers=await listFor(j);active=offers.some(x=>x.external_id===j.external_id&&x.source_slug===j.source_slug&&x.url===j.url)}catch{}
  if(active)await sb.from('jobs').update({checked_at:new Date().toISOString(),verified_at:new Date().toISOString()}).eq('id',j.id).eq('user_id',user.id);
  return respond({active,source:j.source,url:j.url,message:active?'La publicación continúa listada en la fuente; abrí el enlace para confirmar que reciba postulaciones.':'No figura en la muestra consultada o la fuente no respondió; no se autoriza la preparación.'});
 }
 if(body.action!=='scan')return respond({error:'Acción desconocida'},400);
 const [{data:profile,error:profileError},{data:evidence,error:evidenceError}]=await Promise.all([
  sb.from('profiles').select('roles').eq('user_id',user.id).maybeSingle(),
  sb.from('experience_evidence').select('skill,evidence,confirmed').eq('user_id',user.id).eq('confirmed',true).limit(150)
 ]);
 if(profileError||evidenceError)return respond({error:'No se pudo leer el perfil o la experiencia acreditada'},500);
 const evidences=(evidence||[]) as Evidence[];
 const roles=String(profile?.roles||'');
 const {data:sources,error:sourceError}=await sb.from('job_sources').select('provider,slug').eq('user_id',user.id).eq('enabled',true).limit(15);
 if(sourceError)return respond({error:sourceError.message},500);
 const tasks=[{name:'Jobicy · últimos 7 días',fetch:jobicy},{name:'Arbeitnow',fetch:arbeitnow},{name:'Get on Board',fetch:getonbrd},...(sources||[]).filter((s:any)=>slugOK(s.slug)).map((s:any)=>({name:s.provider+'/'+s.slug,fetch:()=>s.provider==='greenhouse'?greenhouse(s.slug):lever(s.slug)}))];
 const {data:runRecord}=await sb.from('search_runs').insert({user_id:user.id,source_summary:{status:'started'}}).select('id').single();
 const res=await Promise.allSettled(tasks.map(t=>t.fetch()));
 let imported=0,updated=0,matched=0;const errors:string[]=[];
 for(let i=0;i<res.length;i++){
  if(res[i].status==='rejected'){errors.push(tasks[i].name+': '+String((res[i] as PromiseRejectedResult).reason).slice(0,110));continue}
  const arr=(res[i] as PromiseFulfilledResult<Offer[]>).value;
  matched+=arr.length;
  for(const j of arr){
   if(!validURL(j.url)||!validURL(j.apply_url))continue;
   const keys={user_id:user.id,source:j.source,source_slug:j.source_slug,external_id:j.external_id};
   const {data:old,error:lookupErr}=await sb.from('jobs').select('id').match(keys).maybeSingle();
   if(lookupErr){errors.push(tasks[i].name+': consulta fallida');break}
   const data={...j,...classify(j,evidences,roles),original_url:j.url,source_job_id:j.external_id,description:j.description_text,employment_location:j.location_text,verified_at:new Date().toISOString(),verification_status:'verified',source_checked_at:new Date().toISOString(),checked_at:new Date().toISOString()};
   const result=old?await sb.from('jobs').update(data).eq('user_id',user.id).eq('id',old.id):await sb.from('jobs').insert({...keys,...data});
   if(result.error){errors.push(tasks[i].name+': '+result.error.message.slice(0,115));break}
   if(old)updated++;else imported++;
  }
 }
 if(runRecord?.id){await sb.from('search_runs').update({finished_at:new Date().toISOString(),found_count:imported+updated,source_summary:{status:'completed',sources:tasks.map((task,i)=>({name:task.name,status:res[i].status,count:res[i].status==='fulfilled'?(res[i] as PromiseFulfilledResult<Offer[]>).value.length:0})),errors}}).eq('id',runRecord.id).eq('user_id',user.id)}
 return respond({imported,updated,matched,sources:tasks.length,errors,at:new Date().toISOString(),notice:'No enviamos CV. Revisa fecha, geografía y lenguaje antes de aprobar.'});
});
