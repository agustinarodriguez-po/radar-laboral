// Comprobación acotada de API pública. Nunca envía postulaciones ni credenciales.
const controller=new AbortController();
const timer=setTimeout(()=>controller.abort(),15000);
try{
 const endpoint='https://himalayas.app/jobs/api/search?q='+encodeURIComponent('customer success')+'&country=AR&sort=recent&page=1';
 const response=await fetch(endpoint,{headers:{Accept:'application/json'},signal:controller.signal});
 console.log('Himalayas HTTP status:',response.status);
 if(response.status===429){console.log('Límite temporal de API pública (sin clave): verificar en otra ejecución');process.exit(0);}
 if(!response.ok)throw new Error('API respondió '+response.status);
 const data=await response.json();
 if(!Array.isArray(data.jobs))throw new Error('El resultado no incluye jobs[]');
 console.log('Vacantes en primera página:',data.jobs.length);
 if(data.jobs.length){
  const sample=data.jobs[0];
  console.log('Campos del anuncio:',Object.keys(sample).sort().join(', '));
  for(const required of ['guid','title','description','applicationLink'])if(!sample[required])throw new Error('Falta campo '+required);
  console.log('Enlace de aplicación:',new URL(sample.applicationLink).hostname);
 }
 console.log('Smoke test Himalayas finalizado; la detección de idioma continúa en el backend.');
}catch(error){console.error('No se pudo verificar Himalayas en vivo:',error.message);process.exitCode=1;}finally{clearTimeout(timer);}
