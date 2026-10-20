import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync('supabase/functions/buscar-ofertas/index.ts','utf8');
const start=source.indexOf('function detectSpanish('),end=source.indexOf('\ntype Evidence =',start);
if(start<0||end<0)throw new Error('No se encontró el detector de idioma');
const code=source.slice(start,end).replace(/function detectSpanish\(text: string\):\s*'confirmed'\|'excluded'\|'pending'\s*\{/,'function detectSpanish(text) {');
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const detect=runInNewContext(code+'\ndetectSpanish',{normalize},{timeout:2000});
const cases=[
 ['español administrativo','Buscamos una persona para la administración y las operaciones de nuestra empresa. Nuestro equipo necesita experiencia en facturación, gestión de clientes, organización de procesos, liquidaciones y atención para los clientes. Ofrecemos trabajo remoto con horario flexible para que puedas colaborar con nuestro equipo y realizar tareas administrativas.','confirmed'],
 ['español mixto tech','Somos una empresa de software y buscamos a una persona para Customer Success. Entre los requisitos se incluye experiencia con CRM, Excel y gestión de clientes. Buscamos conocimientos de procesos de onboarding para trabajar de forma remota con el equipo y apoyar a nuestros clientes.','confirmed'],
 ['inglés','We are looking for a customer success manager with strong communication skills and years of experience working with our business team. The ideal candidate will work with clients and support our product across remote teams. You will deliver excellent service and collaborate with other members of our team.','excluded'],
 ['inglés técnico','The requirements for this role include technical support, customer service, and strong professional English. Applicants must work with our team, provide solutions for our customers, and have years of experience in operations and service delivery. We look for a candidate who can ensure support for the business.','excluded'],
 ['incierto / breve','Customer Success - Remote','pending'],
 ['portugués','Estamos procurando uma pessoa para trabalhar com nossa equipe e prestar atendimento aos nossos clientes. Você terá responsabilidades relacionadas ao trabalho de suporte, comunicação, operações e relacionamento com clientes da empresa. Precisamos de experiência profissional e capacidade para resolver problemas.','pending']
];
for (const [label,body,want] of cases){
 const got=detect(body);
 assert.equal(got,want,label+'; se obtuvo '+got+', se esperaba '+want);
}
if(!source.includes("assessment.language_status!=='confirmed'"))throw Error('No se descartan avisos fuera del idioma español');
if(!source.includes('const requiresEnglish='))throw Error('No se evalúa el inglés obligatorio');
const html=readFileSync('index.html','utf8');
if(!html.includes("jobs.filter(j=>j.language_status==='confirmed')"))throw Error('La UI no aplica el filtro fijo de español');
console.log('QA idioma: 6 escenarios y filtro fijo en UI/backend aprobados');
