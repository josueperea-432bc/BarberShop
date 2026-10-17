/* BarberShop V12: seguimiento de pagos posterior al servicio (solo DEMO) */
(()=>{'use strict';
const precios={corte:150,barba:100,combo:220};
const pesos=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n);
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function pintar(){const tbody=document.getElementById('v12-tabla-pagos');if(!tbody)return;
 const citas=typeof leerCitas==='function'?leerCitas().filter(c=>c.estado==='Completada'):[];
 const pendiente=citas.filter(c=>!c.estadoPago||c.estadoPago==='Pendiente');
 const demo=citas.filter(c=>c.estadoPago==='En proceso (demo)');
 const pagados=citas.filter(c=>c.estadoPago==='Pagado');
 const suma=lista=>lista.reduce((n,c)=>n+(precios[c.servicio]||0),0);
 const personal=typeof leerStaff==='function'?leerStaff():[];const nombre=id=>personal.find(p=>p.id===id)?.nombre||id||'Sin asignar';
 const desglose=document.getElementById('v14-resumen-barberos');if(desglose){const ids=[...new Set([...personal.map(p=>p.id),...citas.map(c=>c.barbero||'')])].filter(Boolean);desglose.innerHTML=ids.map(id=>{const cs=citas.filter(c=>c.barbero===id);const noAcreditado=cs.filter(c=>c.estadoPago!=='Pagado');return `<tr><td>${esc(nombre(id))}</td><td>${cs.length}</td><td>${pesos(suma(cs))}</td><td>${pesos(suma(noAcreditado))}</td></tr>`}).join('')||'<tr><td colspan="4">Sin profesionales.</td></tr>';}
 document.getElementById('v12-resumen-pagos').innerHTML=[['Servicios completados',citas.length],['Valor de servicios realizados',pesos(suma(citas))],['Sin pago iniciado',pesos(suma(pendiente))],['Transferencias en proceso (demo)',pesos(suma(demo))],['Saldo sin acreditar',pesos(suma(citas)-suma(pagados))],['Ingresos acreditados',pesos(0)]].map(([k,v])=>`<article><span>${esc(k)}</span><strong>${esc(v)}</strong></article>`).join('');
 tbody.innerHTML=citas.length?citas.map(c=>`<tr><td>${esc(c.id)}</td><td>${esc(c.nombre)}</td><td>${esc(nombre(c.barbero))}</td><td>${esc(({corte:'Corte clásico',barba:'Arreglo de barba',combo:'Corte + barba'})[c.servicio]||c.servicio)}</td><td>${pesos(precios[c.servicio]||0)}</td><td>${esc(c.metodoPago||'No elegido')}</td><td>${esc(c.estadoPago||'Pendiente')}</td></tr>`).join(''):'<tr><td colspan="7">Todavía no hay servicios completados.</td></tr>';
}
pintar();window.addEventListener('storage',pintar);window.addEventListener('focus',pintar);window.addEventListener('barbershop:update',pintar);
})();
