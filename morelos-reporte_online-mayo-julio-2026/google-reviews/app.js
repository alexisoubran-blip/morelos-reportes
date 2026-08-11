(() => {
  const fmt = new Intl.NumberFormat('es-MX');
  const pct = v => `${(v * 100).toFixed(1)}%`;
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const stores = [
    {name:'Supermercados Morelos Broken Arrow',city:'Broken Arrow',market:'Tulsa Metro',rating:4.6,reviews:611,coded:5,pos:4,neg:1,mix:0,net:.60,status:'Sano'},
    {name:'Supermercados Morelos Moore',city:'Moore',market:'OKC Metro',rating:4.4,reviews:1282,coded:5,pos:3,neg:0,mix:2,net:.60,status:'Sano'},
    {name:'Supermercados Morelos 129th',city:'Tulsa',market:'Tulsa Metro',rating:4.4,reviews:673,coded:5,pos:4,neg:1,mix:0,net:.60,status:'Sano'},
    {name:'Supermercados Morelos Peoria',city:'Tulsa',market:'Tulsa Metro',rating:4.4,reviews:657,coded:5,pos:4,neg:1,mix:0,net:.60,status:'Sano'},
    {name:'Supermercados Morelos 59th',city:'Oklahoma City',market:'OKC Metro',rating:4.3,reviews:1145,coded:5,pos:3,neg:1,mix:1,net:.40,status:'Estable'},
    {name:'Supermercados Morelos 50th',city:'Oklahoma City',market:'OKC Metro',rating:4.3,reviews:880,coded:5,pos:5,neg:0,mix:0,net:1.00,status:'Estable'},
    {name:'Supermercados Morelos MacArthur',city:'Oklahoma City',market:'OKC Metro',rating:4.3,reviews:219,coded:5,pos:3,neg:2,mix:0,net:.20,status:'Atención'},
    {name:'Supermercados Morelos Garnett',city:'Tulsa',market:'Tulsa Metro',rating:4.3,reviews:921,coded:5,pos:5,neg:0,mix:0,net:1.00,status:'Estable'},
    {name:'Supermercados Morelos (NW 23rd)',city:'Oklahoma City',market:'OKC Metro',rating:4.2,reviews:611,coded:5,pos:1,neg:2,mix:2,net:-.20,status:'Atención'},
    {name:'Supermercados Morelos Harvard',city:'Tulsa',market:'Tulsa Metro',rating:4.2,reviews:996,coded:5,pos:1,neg:3,mix:1,net:-.40,status:'Atención'},
    {name:'Supermercado Morelos (Admiral)',city:'Tulsa',market:'Tulsa Metro',rating:4.0,reviews:23,coded:5,pos:4,neg:1,mix:0,net:.60,status:'Atención'}
  ];
  const topics = [
    ['Personal y trato',12,9,1,22,.409,.147,'P2 - Vigilar'],['Food service',12,5,2,19,.263,.127,'P3 - Amplificar'],['Carnicería',12,3,0,15,.20,.10,'P3 - Amplificar'],['Surtido y variedad',11,0,3,14,0,.093,'P3 - Amplificar'],['Precio y valor',11,1,1,13,.077,.087,'P3 - Amplificar'],['Frutas y verduras',11,0,1,12,0,.08,'P3 - Amplificar'],['Limpieza y orden',10,1,1,12,.083,.08,'P3 - Amplificar'],['Panadería',7,0,1,8,0,.053,'P3 - Amplificar'],['Idioma y señalización',5,1,2,8,.125,.053,'P3 - Amplificar'],['Políticas de tienda',0,7,0,7,1,.047,'P1 - Crítica'],['Autenticidad y nostalgia',5,0,1,6,0,.04,'P4 - Mantener'],['Checkout y filas',2,2,0,4,.50,.027,'P2 - Vigilar'],['Amenidades y servicios',2,2,0,4,.50,.027,'P2 - Vigilar'],['Frescura y caducidad',0,2,0,2,1,.013,'P1 - Crítica'],['Layout y espacio',1,0,1,2,0,.013,'P4 - Mantener'],['Disponibilidad en anaquel',2,0,0,2,0,.013,'P4 - Mantener']
  ];
  const alerts = [
    ['Trato desigual percibido','Patrón de cadena','NW 23rd, MacArthur, Admiral','Tres reseñas independientes describen haber sido ignorados o atendidos después que otra persona llegada posteriormente.','Crítica'],
    ['Frescura y caducidad','Operación / Calidad','129th, Harvard','Dos reseñas reportan productos en mal estado; ambas incluyen intención de no regresar.','Crítica'],
    ['Cajas de Harvard','Operación / Front-end','Harvard','Tres de cinco reseñas codificadas de Harvard son negativas y apuntan a cajas, promociones o manejo de quejas.','Crítica'],
    ['Manejo de animal de servicio','Riesgo legal','MacArthur','Una reseña describe cuestionamiento y seguimiento por parte de seguridad ante un animal de servicio.','Crítica'],
    ['Barrera de idioma y señalización','Patrón de cadena','59th, Moore, Harvard, Broken Arrow','Cuatro reseñas mencionan fricción por idioma o señalización; Peoria muestra el contraste con atención bilingüe valorada.','Alta'],
    ['Consistencia de receta en food service','Producto','59th, Moore, Peoria','Aparecen quejas sobre sabor, gramajes y discrepancia entre foto de menú y producto servido.','Alta'],
    ['Mal olor reportado','Operación / Calidad','NW 23rd','Una reseña menciona mal olor y otra cuestiona limpieza percibida de equipo de cocción.','Alta'],
    ['Awareness local bajo','Marketing','Peoria','Una reseña identifica la sucursal como un hallazgo poco conocido pese a su rating de 4.4.','Media'],
    ['Ficha duplicada en corredor Admiral','GBP / Local SEO','Admiral','Se observan dos fichas activas cercanas con nombres y ratings distintos.','Alta'],
    ['Nomenclatura inconsistente','GBP / Local SEO','Cadena','Conviven nombres en singular/plural y descriptores distintos entre fichas.','Media'],
    ['Comisión por tarjeta en food service','Política comercial','Peoria','Una reseña negativa menciona la comisión como parte de la fricción de valor.','Media'],
    ['Escalamiento de decisiones','Operación / Servicio','Broken Arrow, Harvard','Dos situaciones potencialmente recuperables terminaron en reseñas negativas por falta de solución o escalamiento.','Media']
  ];
  const benchmark = [
    ['Feria Latina Supermarket','Oklahoma City',4.3,2385,-.03],['Feria Latina Supermarket','Oklahoma City',4.2,602,-.13],['Feria Latina Supermarket','Tulsa',4.5,172,.17],['Las Americas','Tulsa',4.0,1224,-.33],['Supermercados Las Americas International','Tulsa',4.1,323,-.23],['Supermercado La Cosecha & Restaurant Wholesale','Tulsa',4.5,30,.17],['Feria Latina Supermarket','Oklahoma City',4.7,14,.37],['Plaza del Caribe','Oklahoma City',4.9,23,.57],['Tienda Latina','Tulsa',3.5,15,-.83]
  ];
  const actions = [
    ['Protocolo de primer contacto en mostradores atendidos','0-30 días','Operaciones / RRHH','Las 11',5,2,2.50],['Intervención integral en Harvard: cajas, POS y coaching','0-30 días','Operaciones / Sistemas','Harvard',5,3,1.67],['Auditoría de frescura y cadena de frío','0-30 días','Calidad / Operaciones','Harvard, 129th, NW 23rd',5,3,1.67],['Capacitación ADA a seguridad tercerizada','0-30 días','Legal / Operaciones','Las 11',4,1,4.00],['Fusionar ficha duplicada del corredor Admiral','0-30 días','Marketing / Local SEO','Admiral',4,1,4.00],['Estandarizar nomenclatura, categorías, fotos y atributos de GBP','30-60 días','Marketing / Local SEO','Las 11',4,2,2.00],['Programa de solicitud de reseñas en punto de venta','30-60 días','Marketing','Las 11; piloto MacArthur y Peoria',5,2,2.50],['Señalización bilingüe con foto en carne y comida preparada','30-60 días','Operaciones / Marketing','Las 11',4,2,2.00],['Fichas técnicas y fotos de referencia por platillo','30-60 días','Food Service','Las 11',4,3,1.33],['Política de recuperación de servicio','30-60 días','Operaciones / RRHH','Las 11',4,2,2.00],['Responder 100% de reviews negativas en menos de 48h','30-60 días','Marketing','Las 11',4,2,2.00],['Campaña geolocalizada de notoriedad','60-90 días','Marketing / Medios','Peoria, MacArthur',3,2,1.50],['Piloto de ampliación de horario','60-90 días','Operaciones / Finanzas','Moore, Garnett',4,4,1.00],['Amplificar activos validados: panadería, carnes marinadas, surtido','60-90 días','Marketing / Contenido','Las 11',3,2,1.50],['Evaluar comisión por tarjeta en food service','60-90 días','Finanzas / Food Service','Las 11',2,1,2.00],['Explorar surtido caribeño y centroamericano','90+ días','Compras / Categoría','59th, Broken Arrow',3,4,.75],['Evaluar apertura en Jenks','90+ días','Expansión','Nueva unidad',4,5,.80]
  ];

  const weighted = stores.reduce((a,s)=>a+s.rating*s.reviews,0)/stores.reduce((a,s)=>a+s.reviews,0);
  const totalReviews = stores.reduce((a,s)=>a+s.reviews,0);
  const totalPos = stores.reduce((a,s)=>a+s.pos,0), totalNeg=stores.reduce((a,s)=>a+s.neg,0), totalMix=stores.reduce((a,s)=>a+s.mix,0);
  const net = (totalPos-totalNeg)/55;

  document.getElementById('heroKpis').innerHTML = [
    ['Rating ponderado',weighted.toFixed(2),'Cadena'],['Calificaciones',fmt.format(totalReviews),'11 fichas'],['Reviews codificadas','55','5 por sucursal'],['Net Sentiment',pct(net),'Muestra textual']
  ].map(([l,v,s])=>`<div class="hero-kpi"><span>${l}</span><b>${v}</b><small>${s}</small></div>`).join('');

  document.getElementById('summaryKpis').innerHTML = [
    ['Positivas',totalPos,'67.3% de la muestra','good'],['Negativas',totalNeg,'21.8% de la muestra','bad'],['Mixtas',totalMix,'10.9% de la muestra','neutral'],['Mejor rating','4.6','Broken Arrow','good'],['Mayor volumen',fmt.format(1282),'Moore',''],['Tema más mencionado','22','Personal y trato','']
  ].map(([l,v,s,c])=>`<div class="kpi-card ${c}"><span>${l}</span><b>${v}</b><small>${s}</small></div>`).join('');

  const markets=[['OKC Metro',5,4137,4.32,25,15,5,.40],['Tulsa Metro',6,3881,4.35,30,22,7,.50]];
  document.getElementById('marketGrid').innerHTML=markets.map(m=>`<article class="market-card"><div><span>${m[0]}</span><b>${m[3].toFixed(2)}</b><small>rating ponderado</small></div><div class="market-stats"><span>${m[1]} sucursales</span><span>${fmt.format(m[2])} calificaciones</span><span>${m[4]} reviews codificadas</span><span>Net ${pct(m[7])}</span></div></article>`).join('');

  function storeRows(){
    const q=document.getElementById('storeSearch').value.toLowerCase(); const market=document.getElementById('marketFilter').value;
    const rows=stores.filter(s=>(market==='all'||s.market===market)&&(`${s.name} ${s.city}`.toLowerCase().includes(q)));
    document.getElementById('storeTable').innerHTML=`<thead><tr><th>Sucursal</th><th>Mercado</th><th class="num">Rating</th><th class="num">Calificaciones</th><th class="num">Pos.</th><th class="num">Neg.</th><th class="num">Mixtas</th><th class="num">Net</th><th>Semáforo</th></tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(s.name)}</b><small>${esc(s.city)}</small></td><td>${s.market}</td><td class="num"><b>${s.rating.toFixed(1)}</b></td><td class="num">${fmt.format(s.reviews)}</td><td class="num">${s.pos}</td><td class="num">${s.neg}</td><td class="num">${s.mix}</td><td class="num ${s.net<0?'neg':''}">${pct(s.net)}</td><td><span class="status ${s.status==='Sano'?'good':s.status==='Atención'?'warn':''}">${s.status}</span></td></tr>`).join('')}</tbody>`;
  }
  document.getElementById('storeSearch').addEventListener('input',storeRows);document.getElementById('marketFilter').addEventListener('change',storeRows);storeRows();

  document.getElementById('topicGrid').innerHTML=topics.map(t=>`<article class="topic-card ${t[7].startsWith('P1')?'critical':t[7].startsWith('P2')?'watch':''}"><div class="topic-head"><b>${t[0]}</b><span>${t[7]}</span></div><div class="topic-total">${t[4]} <small>menciones · ${pct(t[6])} share</small></div><div class="sentiment-bar"><i style="width:${t[1]/t[4]*100}%"></i><i class="mix" style="width:${t[3]/t[4]*100}%"></i><i class="neg" style="width:${t[2]/t[4]*100}%"></i></div><div class="topic-foot"><span>${t[1]} positivas</span><span>${t[2]} negativas</span><strong>${pct(t[5])} negativo</strong></div></article>`).join('');

  document.getElementById('alertGrid').innerHTML=alerts.map((a,i)=>`<article class="alert-card ${a[4]==='Crítica'?'critical':''}"><div class="alert-index">${i+1}</div><div><div class="alert-meta"><span>${a[1]}</span><b>${a[4]}</b></div><h3>${a[0]}</h3><p>${a[3]}</p><small>${a[2]}</small></div></article>`).join('');

  document.getElementById('benchmarkTable').innerHTML=`<thead><tr><th>Competidor</th><th>Ciudad</th><th class="num">Rating</th><th class="num">Calificaciones</th><th class="num">Δ vs Morelos</th></tr></thead><tbody>${benchmark.map(b=>`<tr><td><b>${b[0]}</b></td><td>${b[1]}</td><td class="num">${b[2].toFixed(1)}</td><td class="num">${fmt.format(b[3])}</td><td class="num ${b[4]>0?'pos':'neg'}">${b[4]>0?'+':''}${b[4].toFixed(2)}</td></tr>`).join('')}</tbody>`;
  document.getElementById('benchmarkFindings').innerHTML=[
    ['NW 23rd','Feria Latina frente a Morelos NW 23rd registra 2,385 calificaciones y rating 4.3, frente a 611 y 4.2 de Morelos.'],
    ['Ventana horaria','El dataset señala que Feria Latina opera 6:00–22:00 y Morelos 7:00–21:00, una diferencia de tres horas diarias.'],
    ['Especialización','Morelos mantiene un rating ponderado sólido frente a jugadores de mayor volumen; varios formatos pequeños muestran ratings superiores con menor escala.']
  ].map(([h,p])=>`<article><b>${h}</b><p>${p}</p></article>`).join('');

  function renderActions(h='all'){
    const list=actions.filter(a=>h==='all'||a[1]===h).sort((a,b)=>b[6]-a[6]);
    document.getElementById('actionGrid').innerHTML=list.map((a,i)=>`<article class="action-card"><div class="action-top"><span>${a[1]}</span><b>Prioridad ${a[6].toFixed(2)}</b></div><h3>${a[0]}</h3><p>${a[2]} · ${a[3]}</p><div class="action-score"><span>Impacto <b>${a[4]}/5</b></span><span>Esfuerzo <b>${a[5]}/5</b></span></div></article>`).join('');
  }
  document.querySelectorAll('.filter-chip').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter-chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderActions(b.dataset.horizon)}));renderActions();
})();