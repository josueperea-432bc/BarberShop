/* BarberShop V9 — herramientas de gestión y barbero, DEMOSTRACIÓN LOCAL. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const dinero=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
const precios={corte:150,barba:100,combo:220};
const nombres={corte:'Corte clásico',barba:'Arreglo de barba',combo:'Corte + barba'};
const actualizar=()=>{window.dispatchEvent(new Event('barbershop:update'));};
const hoy=hoyISO();
function estadisticas(){
 const citas=leerCitas(),activas=citas.filter(c=>c.estado!=='Cancelada'),terminadas=citas.filter(c=>c.estado==='Completada');
 const resumen=$('v9-resumen');if(resumen){
  const total=terminadas.reduce((a,c)=>a+(precios[c.servicio]||0),0);
  const cards=[['Citas totales',citas.length],['Programadas',activas.filter(c=>['Pendiente','Confirmada'].includes(c.estado)).length],['Completadas',terminadas.length],['Valor de servicios realizados',dinero(total)],['Pagos acreditados',dinero(0)],['Saldo sin acreditar',dinero(total)]];
  resumen.innerHTML=cards.map(([a,b])=>`<article><span>${safe(a)}</span><strong>${safe(b)}</strong></article>`).join('');
 }
 const tabla=$('v9-servicios');if(tabla){tabla.innerHTML=Object.entries(nombres).map(([k,n])=>`<tr><td>${safe(n)}</td><td>${activas.filter(c=>c.servicio===k).length}</td><td>${terminadas.filter(c=>c.servicio===k).length}</td><td>${dinero(terminadas.filter(c=>c.servicio===k).length*precios[k])}</td></tr>`).join('');}
 const resumenBarberos=$('v9-rendimiento');if(resumenBarberos){resumenBarberos.innerHTML=leerStaff().map(p=>{const m=terminadas.filter(c=>c.barbero===p.id);return `<tr><td>${safe(p.nombre)}</td><td>${activas.filter(c=>c.barbero===p.id).length}</td><td>${m.length}</td><td>${dinero(m.reduce((a,c)=>a+(precios[c.servicio]||0),0))}</td></tr>`}).join('');}
}
function pintarBarberos(){const tbody=$('v9-lista-barberos');if(!tbody)return;
 tbody.innerHTML=leerStaff().map(p=>`<tr><td><strong>${safe(p.nombre)}</strong><small>${safe(p.especialidad||'General')}</small></td><td>${safe(p.inicio)}–${safe(p.fin)}</td><td>${safe(p.descansoInicio)}–${safe(p.descansoFin)}</td><td>${p.activo?'Activo':'Inactivo'}</td><td><button type="button" data-editar="${safe(p.id)}">Editar</button></td></tr>`).join('');
}
function administrar(){const form=$('v9-form-barbero');if(!form)return;
 function reset(){form.reset();form.elements.id.value='';$('v9-guardar').textContent='Guardar profesional';}
 $('v9-nuevo').addEventListener('click',reset);
 $('v9-lista-barberos').addEventListener('click',e=>{const b=e.target.closest('[data-editar]');if(!b)return;const p=leerStaff().find(p=>p.id===b.dataset.editar);if(!p)return;Object.entries(p).forEach(([k,v])=>{if(form.elements[k]&&k!=='activo')form.elements[k].value=Array.isArray(v)?v.join(', '):v});form.elements.activo.checked=p.activo;$('v9-guardar').textContent='Actualizar profesional';form.scrollIntoView({behavior:'smooth',block:'nearest'});});
 form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const d=Object.fromEntries(new FormData(form));const ini=minutos(d.inicio),fin=minutos(d.fin),di=minutos(d.descansoInicio),df=minutos(d.descansoFin);
 if(!(ini<fin&&di>=ini&&df<=fin&&di<df)){alert('Revisa los horarios: el descanso debe estar dentro de la jornada.');return;}
 let a=leerStaff();const id=d.id||'barbero-'+Date.now().toString(36);const p={id,nombre:d.nombre.trim(),especialidad:d.especialidad.trim(),activo:form.elements.activo.checked,inicio:d.inicio,fin:d.fin,descansoInicio:d.descansoInicio,descansoFin:d.descansoFin,diasLibres:a.find(x=>x.id===id)?.diasLibres||[]};
 if(a.some(x=>x.id===id))a=a.map(x=>x.id===id?p:x);else a.push(p);guardarStaff(a);pintarBarberos();estadisticas();reset();$('v9-aviso').textContent='Profesional guardado en este navegador.';
 });pintarBarberos();estadisticas();
}
function barbero(){const sel=$('v9-mi-barbero');if(!sel)return;
 const p=leerStaff();sel.innerHTML=p.map(x=>`<option value="${safe(x.id)}">${safe(x.nombre)}</option>`).join('');
 function render(){const id=sel.value;const perfil=leerStaff().find(x=>x.id===id);if(!perfil)return;
 $('v9-perfil').textContent=`${perfil.especialidad} · ${perfil.inicio}–${perfil.fin} · Descanso ${perfil.descansoInicio}–${perfil.descansoFin}`;
 const citas=leerCitas().filter(c=>c.barbero===id&&c.fecha===$('v9-fecha').value).sort((a,b)=>a.hora.localeCompare(b.hora));
 $('v9-mis-stats').innerHTML=[['Citas del día',citas.filter(c=>c.estado!=='Cancelada').length],['Pendientes',citas.filter(c=>c.estado==='Pendiente').length],['Completadas',citas.filter(c=>c.estado==='Completada').length],['Valor realizado',dinero(citas.filter(c=>c.estado==='Completada').reduce((n,c)=>n+(precios[c.servicio]||0),0))]].map(([k,v])=>`<article><span>${k}</span><strong>${v}</strong></article>`).join('');
 $('v9-mis-citas').innerHTML=citas.length?citas.map(c=>`<tr><td>${safe(c.hora)}</td><td>${safe(c.nombre)}<small>${safe(c.telefono)}</small></td><td>${safe(nombres[c.servicio]||c.servicio)}<small>${dinero(precios[c.servicio]||0)}</small></td><td><span class="estado">${safe(c.estado)}</span></td><td>${c.estado==='Pendiente'?`<button data-id="${safe(c.id)}" data-estado="Confirmada">Confirmar</button>`:''} ${c.estado==='Confirmada'?`<button data-id="${safe(c.id)}" data-estado="En atención">Iniciar</button>`:''} ${c.estado==='En atención'?`<button data-id="${safe(c.id)}" data-estado="Completada">Completar</button>`:''} ${!['Cancelada','Completada'].includes(c.estado)?`<button data-id="${safe(c.id)}" data-estado="Cancelada">Cancelar</button>`:''}</td></tr>`).join(''):'<tr><td colspan="5">No hay citas para este día.</td></tr>';
 const libre=$('v9-dias-libres');libre.innerHTML=(perfil.diasLibres||[]).map(f=>`<span class="v9-chip">${safe(f)} <button type="button" data-libre="${safe(f)}" aria-label="Quitar día libre ${safe(f)}">×</button></span>`).join('')||'<span class="muted">Sin días libres registrados.</span>';
 }
 $('v9-fecha').value=hoy;sel.addEventListener('change',render);$('v9-fecha').addEventListener('change',render);
 $('v9-mis-citas').addEventListener('click',e=>{const b=e.target.closest('[data-estado]');if(!b)return;const a=leerCitas(),c=a.find(x=>x.id===b.dataset.id&&x.barbero===sel.value);if(!c)return;const permitidos={'Pendiente':'Confirmada','Confirmada':'En atención','En atención':'Completada'};if(b.dataset.estado!=='Cancelada'&&permitidos[c.estado]!==b.dataset.estado)return;if(['Cancelada','Completada'].includes(c.estado))return;if(b.dataset.estado==='Cancelada'&&!confirm('¿Cancelar esta cita de demostración?'))return;c.estado=b.dataset.estado;guardarCitas(a);render();});
 $('v9-agregar-libre').addEventListener('click',()=>{const f=$('v9-dia-libre').value;if(!f)return;const a=leerStaff(),p=a.find(x=>x.id===sel.value);const perfilLocal=leerStaff().find(x=>x.id===sel.value);if(!p)return;if(leerCitas().some(c=>c.barbero===p.id&&c.fecha===f&&!['Cancelada','Completada'].includes(c.estado))){alert('Ya existen citas activas ese día. Reprográmalas o cancélalas antes de bloquearlo.');return;}p.diasLibres=[...new Set([...(p.diasLibres||[]),f])].sort();guardarStaff(a);render();});
 $('v9-dias-libres').addEventListener('click',e=>{const b=e.target.closest('[data-libre]');if(!b)return;const a=leerStaff(),p=a.find(x=>x.id===sel.value);p.diasLibres=(p.diasLibres||[]).filter(x=>x!==b.dataset.libre);guardarStaff(a);const local=p.diasLibres;const perfilActual=p;const cache=perfilActual; /* actualizar referencia en sesión */ const i=leerStaff().find(x=>x.id===sel.value);Object.assign(perfil,i);render();});
 render();
}
administrar();barbero();estadisticas();window.addEventListener('storage',estadisticas);window.addEventListener('focus',estadisticas);window.addEventListener('barbershop:update',estadisticas);
})();