/* BarberShop V4 — demostración local; sin autenticación ni servidor. */
const KEY='barbershop_demo_citas_v3';
const leerCitas=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch{return []}};
const guardarCitas=a=>localStorage.setItem(KEY,JSON.stringify(a));
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hoyISO=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
// Reglas compartidas entre reservas, consulta y agenda. Datos de demostración locales.
const SLOT_MIN=30;
const APERTURA=9*60, CIERRE=19*60;
const DURACIONES={corte:30,barba:30,combo:60};
const PROFESIONALES=['profesional-a','profesional-b'];
const minutos=h=>{const [hh,mm]=String(h||'').split(':').map(Number);return hh*60+mm};
const formatoHora=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const horariosDemo=()=>Array.from({length:(CIERRE-APERTURA)/SLOT_MIN},(_,i)=>formatoHora(APERTURA+i*SLOT_MIN));
const duracionServicio=servicio=>DURACIONES[servicio]||30;
const ocupaIntervalo=(c,fecha,inicio,duracion,profesional)=>{
 if(c.fecha!==fecha||c.estado==='Cancelada'||c.barbero!==profesional)return false;
 const a=minutos(c.hora),b=a+duracionServicio(c.servicio);
 return inicio<b&&a<inicio+duracion;
};
const horaPasada=(fecha,hora)=>new Date(`${fecha}T${hora}:00`).getTime()<=Date.now();
const profesionalesLibres=(citas,fecha,hora,servicio)=>{
 const inicio=minutos(hora),duracion=duracionServicio(servicio);
 if(!fecha||!hora||!servicio||horaPasada(fecha,hora)||inicio+duracion>CIERRE)return [];
 return PROFESIONALES.filter(p=>!citas.some(c=>ocupaIntervalo(c,fecha,inicio,duracion,p)));
};
function actualizarDisponibilidad(form){
 const select=form.elements.hora, fecha=form.elements.fecha.value,barbero=form.elements.barbero.value,servicio=form.elements.servicio.value;
 const aviso=document.querySelector('#disponibilidad-mensaje');const previa=select.value;
 select.replaceChildren();const opt=document.createElement('option');opt.value='';opt.textContent='Selecciona un horario';select.append(opt);
 if(!fecha||!barbero||!servicio){select.disabled=true;opt.textContent='Selecciona servicio, fecha y profesional';aviso.textContent='Elige servicio, fecha y profesional para consultar horarios.';return;}
 const citas=leerCitas();let disponibles=0;
 for(const h of horariosDemo()){
  const libres=profesionalesLibres(citas,fecha,h,servicio);
  const bloqueado=barbero==='cualquiera'?!libres.length:!libres.includes(barbero);
  const o=document.createElement('option');o.value=h;o.textContent=h+(bloqueado?' — ocupado':'');o.disabled=bloqueado;select.append(o);if(!bloqueado)disponibles++;
 }
 select.disabled=!disponibles;
 if(disponibles&&Array.from(select.options).some(o=>o.value===previa&&!o.disabled))select.value=previa;
 aviso.textContent=disponibles?`${disponibles} horarios de inicio disponibles. Duración del servicio: ${duracionServicio(servicio)} minutos. Horario de 09:00 a 19:00.`:'No quedan horarios disponibles para esta selección.';
}
const form=document.querySelector('#form-reserva');
if(form){
 const fecha=form.elements.fecha;fecha.min=hoyISO();
 for(const nombre of ['servicio','fecha','barbero'])form.elements[nombre].addEventListener('change',()=>actualizarDisponibilidad(form));
 form.addEventListener('reset',()=>setTimeout(()=>actualizarDisponibilidad(form),0));
 actualizarDisponibilidad(form);
 form.addEventListener('submit',e=>{
  e.preventDefault();if(!form.reportValidity())return;
  if(fecha.value<hoyISO()){fecha.setCustomValidity('Selecciona una fecha de hoy en adelante.');fecha.reportValidity();return}fecha.setCustomValidity('');
  const d=Object.fromEntries(new FormData(form).entries());
  const libres=profesionalesLibres(leerCitas(),d.fecha,d.hora,d.servicio);
  const elegido=d.barbero==='cualquiera'?libres[0]:d.barbero;
  if(!horariosDemo().includes(d.hora)||!elegido||!libres.includes(elegido)){
   actualizarDisponibilidad(form);alert('Este horario ya no está disponible. Elige otro.');return;
  }
  const codigo='BS-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID().slice(0,8).toUpperCase():Math.random().toString(36).slice(2,10).toUpperCase());
  const cita={id:codigo,nombre:d.nombre,telefono:d.telefono,correo:d.correo,servicio:d.servicio,barbero:elegido,fecha:d.fecha,hora:d.hora,comentarios:d.comentarios||'',estado:'Pendiente',confirmacionCliente:false,creadaEn:new Date().toISOString()};
  guardarCitas([...leerCitas(),cita]);
  const msg=document.querySelector('#resultado-reserva');msg.hidden=false;
  msg.innerHTML=`Solicitud de prueba registrada. Código: <strong>${safe(codigo)}</strong>. Profesional asignado: <strong>${safe(elegido==='profesional-a'?'Profesional A':'Profesional B')}</strong>. <a href="mis-citas.html?codigo=${encodeURIComponent(codigo)}">Consultar mi cita</a>. Conserva el código y usa el mismo navegador.`;
  form.reset();actualizarDisponibilidad(form);msg.scrollIntoView({behavior:'smooth',block:'nearest'});
 });fecha.addEventListener('input',()=>fecha.setCustomValidity(''));
}
let semanaOffset=0;
function renderAdmin(){const lista=document.querySelector('#lista-citas');if(!lista)return;const q=document.querySelector('#buscar-cita').value.toLowerCase();const estado=document.querySelector('#filtrar-estado').value;const all=leerCitas();const citas=all.filter(c=>(!estado||c.estado===estado)&&(!q||[c.nombre,c.servicio,c.fecha].join(' ').toLowerCase().includes(q))).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));lista.innerHTML=citas.length?citas.map(c=>`<tr><td>${safe(c.fecha)}<small>${safe(c.hora)}</small></td><td>${safe(c.nombre)}<small>${safe(c.telefono)}</small></td><td>${safe(c.servicio)}</td><td><span class="estado estado-${safe(c.estado.toLowerCase())}">${safe(c.estado)}</span></td><td><button type="button" data-id="${safe(c.id)}" data-action="confirmar" ${c.estado==='Cancelada'?'disabled':''}>Confirmar</button> <button type="button" data-id="${safe(c.id)}" data-action="cancelar" ${c.estado==='Cancelada'?'disabled':''}>Cancelar</button></td></tr>`).join(''):'<tr><td colspan="5">No hay solicitudes para mostrar.</td></tr>';document.querySelector('#total-citas').textContent=all.length;document.querySelector('#pendientes').textContent=all.filter(c=>c.estado==='Pendiente').length;document.querySelector('#confirmadas').textContent=all.filter(c=>c.estado==='Confirmada').length;renderCalendar(all)}
const lista=document.querySelector('#lista-citas');if(lista){lista.addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(!b)return;const citas=leerCitas();const c=citas.find(c=>c.id===b.dataset.id);if(!c||c.estado==='Cancelada')return;c.estado=b.dataset.action==='confirmar'?'Confirmada':'Cancelada';guardarCitas(citas);renderAdmin()});document.querySelector('#buscar-cita').addEventListener('input',renderAdmin);document.querySelector('#filtrar-estado').addEventListener('change',renderAdmin);document.querySelector('#semana-anterior').addEventListener('click',()=>{semanaOffset--;renderAdmin()});document.querySelector('#semana-siguiente').addEventListener('click',()=>{semanaOffset++;renderAdmin()});document.querySelector('#semana-actual').addEventListener('click',()=>{semanaOffset=0;renderAdmin()});renderAdmin()}
function renderCalendar(citas){
 const grid=document.querySelector('#calendario-semanal');if(!grid)return;
 const filtro=document.querySelector('#filtrar-barbero');
 if(filtro){const current=filtro.value;const nombres=[...new Set([...PROFESIONALES,...citas.map(c=>c.barbero).filter(Boolean)])].sort();filtro.innerHTML='<option value="">Todos los profesionales</option>'+nombres.map(n=>`<option value="${safe(n)}">${safe(n==='profesional-a'?'Profesional A':n==='profesional-b'?'Profesional B':n)}</option>`).join('');filtro.value=nombres.includes(current)?current:'';}
 const elegidas=filtro?.value?citas.filter(c=>c.barbero===filtro.value):citas;
 const monday=new Date();monday.setHours(12,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7+7*semanaOffset);
 const dates=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d});
 const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 document.querySelector('#semana-etiqueta').textContent=dates[0].toLocaleDateString('es-MX',{day:'numeric',month:'short'})+' – '+dates[6].toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'});
 const today=hoyISO();
 let html='<div class="week-head time-head">Horario</div>'+dates.map(d=>`<div class="week-head ${iso(d)===today?'today':''}"><span>${safe(d.toLocaleDateString('es-MX',{weekday:'short'}))}</span><strong>${d.getDate()}</strong></div>`).join('');
 for(const hora of horariosDemo()){
 html+=`<div class="week-time">${hora}</div>`;
 for(const d of dates){const items=elegidas.filter(c=>c.fecha===iso(d)&&c.hora===hora);
 html+=`<div class="slot ${iso(d)===today?'slot-today':''}">${items.map(c=>`<button type="button" class="calendar-appointment ${safe(c.estado.toLowerCase())}" data-calendar-id="${safe(c.id)}" aria-label="Ver solicitud de ${safe(c.nombre)}"><strong>${safe(c.nombre)}</strong><small>${safe(c.hora)} · ${safe(c.servicio)}</small><em>${safe(c.estado)}</em></button>`).join('')}</div>`;}}
 grid.innerHTML=html;
}
const filtroBarbero=document.querySelector('#filtrar-barbero');if(filtroBarbero)filtroBarbero.addEventListener('change',()=>renderCalendar(leerCitas()));
const dialog=document.querySelector('#detalle-cita');let detalleId=null;
if(dialog){const cerrar=()=>dialog.close();document.querySelector('#cerrar-detalle').addEventListener('click',cerrar);dialog.addEventListener('click',e=>{if(e.target===dialog)cerrar()});
 document.querySelector('#calendario-semanal').addEventListener('click',e=>{const b=e.target.closest('[data-calendar-id]');if(!b)return;const c=leerCitas().find(x=>x.id===b.dataset.calendarId);if(!c)return;detalleId=c.id;document.querySelector('#detalle-contenido').innerHTML=`<dl class="detail-list"><div><dt>Cliente</dt><dd>${safe(c.nombre)}</dd></div><div><dt>Servicio</dt><dd>${safe(c.servicio)}</dd></div><div><dt>Profesional</dt><dd>${safe(c.barbero||'No especificado')}</dd></div><div><dt>Fecha y hora</dt><dd>${safe(c.fecha)} · ${safe(c.hora)}</dd></div><div><dt>Estado</dt><dd>${safe(c.estado)}</dd></div><div><dt>Código</dt><dd>${safe(c.id)}</dd></div></dl>`;document.querySelector('#detalle-confirmar').disabled=c.estado!=='Pendiente';document.querySelector('#detalle-cancelar').disabled=c.estado==='Cancelada';dialog.showModal()});
 for(const [id,estado] of [['detalle-confirmar','Confirmada'],['detalle-cancelar','Cancelada']])document.querySelector('#'+id).addEventListener('click',()=>{const a=leerCitas();const c=a.find(x=>x.id===detalleId);if(!c||c.estado==='Cancelada')return;if(estado==='Cancelada'&&!confirm('¿Cancelar esta solicitud de prueba?'))return;c.estado=estado;guardarCitas(a);cerrar();renderAdmin()});
}
const consulta=document.querySelector('#consulta-form');
if(consulta){
 const codigoInput=document.querySelector('#codigo-cita');
 const telInput=document.querySelector('#telefono-cita');
 const params=new URLSearchParams(location.search);
 if(params.get('codigo'))codigoInput.value=params.get('codigo');
 const msg=document.querySelector('#consulta-mensaje');
 const result=document.querySelector('#resultado-consulta');
 let citaConsultada=null;
 const telefonoNormalizado=t=>String(t||'').replace(/\D/g,'');
 const estados={Pendiente:'Pendiente de aprobación',Confirmada:'Confirmada por administración',Cancelada:'Cancelada'};
 function renderConsulta(){
  const codigo=codigoInput.value.trim().toUpperCase();
  const telefono=telefonoNormalizado(telInput.value);
  const c=leerCitas().find(x=>String(x.id).toUpperCase()===codigo&&telefonoNormalizado(x.telefono)===telefono);
  citaConsultada=c?.id||null;
  result.hidden=!c;
  if(!c){result.replaceChildren();msg.textContent='No se encontró una solicitud con ese código y teléfono en este navegador.';return;}
  msg.textContent='Solicitud encontrada. Puedes consultar su información a continuación.';
  const clase=['Pendiente','Confirmada','Cancelada'].includes(c.estado)?c.estado.toLowerCase():'pendiente';
  const detalle=[['Cliente',c.nombre],['Servicio',c.servicio],['Duración',duracionServicio(c.servicio)+' min'],['Profesional',c.barbero||'Por asignar'],['Fecha',c.fecha],['Hora',c.hora],['Duración',duracionServicio(c.servicio)+' min'],['Código',c.id]];
  result.innerHTML=`<div class="booking-result"><div class="booking-result-top"><div><span class="step-pill">TU RESERVACIÓN</span><h2>Detalles de la cita</h2></div><span class="booking-status ${clase}">${safe(estados[c.estado]||c.estado)}</span></div><div class="booking-fields">${detalle.map(([k,v])=>`<div><span>${safe(k)}</span><strong>${safe(v)}</strong></div>`).join('')}</div><div class="booking-note">${c.estado==='Cancelada'?'Esta solicitud fue cancelada y su horario se liberó en este navegador.':c.estado==='Confirmada'?'El administrador marcó esta solicitud como confirmada. Verifica directamente con la barbería antes de asistir.':c.confirmacionCliente?'Ya confirmaste tu interés en asistir. La solicitud sigue pendiente de aprobación administrativa.':'La solicitud está pendiente de aprobación. Puedes confirmar tu interés o cancelarla.'}</div><div class="client-actions"><button class="button" type="button" data-client-action="confirmar" ${c.estado!=='Pendiente'||c.confirmacionCliente?'disabled':''}>${c.confirmacionCliente?'Interés confirmado':'Confirmar mi asistencia'}</button><button class="outline-button" type="button" data-client-action="cancelar" ${c.estado==='Cancelada'?'disabled':''}>Cancelar solicitud</button><button class="outline-button" type="button" data-client-action="copiar">Copiar código</button></div><p id="accion-mensaje" role="status" aria-live="polite"></p></div>`;
 }
 consulta.addEventListener('submit',e=>{e.preventDefault();if(!consulta.reportValidity())return;renderConsulta()});
 for(const input of [codigoInput,telInput])input.addEventListener('input',()=>{result.hidden=true;result.replaceChildren();citaConsultada=null;msg.textContent='';});
 result.addEventListener('click',async e=>{
  const btn=e.target.closest('button[data-client-action]');if(!btn||!citaConsultada)return;
  const action=btn.dataset.clientAction;
  if(action==='copiar'){
   const feedback=document.querySelector('#accion-mensaje');
   try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(citaConsultada);feedback.textContent='Código copiado.'}else{feedback.textContent='Selecciona y copia el código mostrado en los detalles.'}}catch{feedback.textContent='No se pudo copiar automáticamente. Copia el código mostrado.'}return;
  }
  const citas=leerCitas(),c=citas.find(x=>x.id===citaConsultada);
  if(!c||telefonoNormalizado(c.telefono)!==telefonoNormalizado(telInput.value))return;
  if(action==='cancelar'){
   if(c.estado==='Cancelada'||!confirm('¿Deseas cancelar esta solicitud? Esta acción no se puede deshacer en la demostración.'))return;
   c.estado='Cancelada';
  }else if(action==='confirmar'){
   if(c.estado!=='Pendiente'||c.confirmacionCliente)return;
   c.confirmacionCliente=true;
  }
  guardarCitas(citas);renderConsulta();
 });
}
