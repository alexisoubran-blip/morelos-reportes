(() => {
  const fmt = new Intl.NumberFormat('es-MX');
  const pct = v => `${(v * 100).toFixed(0)}%`;
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const stores = [
    {
      name:'Supermercados Morelos 59th', short:'59th', city:'Oklahoma City', market:'OKC Metro', rating:4.3, reviews:1145, pos:3, neg:1, mix:1,
      positives:['Se reconoce el surtido, el precio y la oferta de comida preparada como razones para preferir esta tienda.','Frutas, verduras, pan dulce y carnicería aparecen como atributos destacados en primeras visitas.'],
      negatives:['Una experiencia en food service reporta trato poco amable y una diferencia entre la foto del menú y el producto recibido.'],
      observed:'La muestra combina una percepción favorable de surtido, precio y frescos con una fricción localizada en atención y consistencia de food service.'
    },
    {
      name:'Supermercados Morelos 50th', short:'50th', city:'Oklahoma City', market:'OKC Metro', rating:4.3, reviews:880, pos:5, neg:0, mix:0,
      positives:['Las cinco reseñas codificadas son positivas; se repiten amabilidad, carnes marinadas, panadería y comida preparada.','También aparecen limpieza, rapidez en caja y buena distribución de la tienda.'],
      negatives:[],
      observed:'En la muestra codificada no aparecen reseñas negativas. La conversación se concentra en producto, servicio y experiencia de compra.'
    },
    {
      name:'Supermercados Morelos (NW 23rd)', short:'NW 23rd', city:'Oklahoma City', market:'OKC Metro', rating:4.2, reviews:611, pos:1, neg:2, mix:2,
      positives:['El surtido de botanas y abarrotes mexicanos recibe una valoración favorable.'],
      negatives:['Se reportan fricciones de trato en carnicería y food service.','También aparece una mención de mal olor y una percepción negativa sobre limpieza de equipo en la barra de comida.'],
      observed:'Es una de las muestras más divididas: conviven reconocimiento de surtido con observaciones sobre espacio, olor, servicio y food service.'
    },
    {
      name:'Supermercados Morelos MacArthur', short:'MacArthur', city:'Oklahoma City', market:'OKC Metro', rating:4.3, reviews:219, pos:3, neg:2, mix:0,
      positives:['La limpieza aparece como atributo distintivo, acompañada de frescos, tacos y buenos precios.','Una reseña la describe como tienda de cabecera por limpieza y amabilidad.'],
      negatives:['Dos reseñas describen experiencias negativas de trato: una vinculada con seguridad y otra con atención en la barra de comida.'],
      observed:'La muestra presenta un contraste claro entre una percepción muy favorable de limpieza y episodios puntuales de atención que generan evaluaciones negativas.'
    },
    {
      name:'Supermercados Morelos Moore', short:'Moore', city:'Moore', market:'OKC Metro', rating:4.4, reviews:1282, pos:3, neg:0, mix:2,
      positives:['Food service genera visitas de destino y aparece asociado con recomendaciones externas y regreso a tienda.','Pan dulce, nostalgia, limpieza y percepción de valor también aparecen de forma positiva.'],
      negatives:[],
      observed:'No hay negativas dentro de las cinco reseñas codificadas; las observaciones mixtas se relacionan con consistencia de guarniciones y variedad esperada en frescos.'
    },
    {
      name:'Supermercado Morelos (Admiral)', short:'Admiral', city:'Tulsa', market:'Tulsa Metro', rating:4.0, reviews:23, pos:4, neg:1, mix:0,
      positives:['Carnicería, limpieza, surtido y frescos reciben comentarios favorables.','Una reseña destaca atención paciente pese a una barrera de idioma.'],
      negatives:['Una reseña describe espera sin atención en carnicería mientras otra persona fue atendida primero.'],
      observed:'La ficha tiene un volumen de calificaciones considerablemente menor que el resto de la cadena; dentro de la muestra textual predomina el tono positivo.'
    },
    {
      name:'Supermercados Morelos Garnett', short:'Garnett', city:'Tulsa', market:'Tulsa Metro', rating:4.3, reviews:921, pos:5, neg:0, mix:0,
      positives:['Las cinco reseñas codificadas son positivas y combinan frescos, carnes, limpieza, precio y servicio.','Frutas y verduras se comparan favorablemente con otras tiendas de la ciudad.'],
      negatives:[],
      observed:'La muestra es consistentemente positiva y distribuye el reconocimiento entre frescos, carnicería, limpieza, valor y food service.'
    },
    {
      name:'Supermercados Morelos Harvard', short:'Harvard', city:'Tulsa', market:'Tulsa Metro', rating:4.2, reviews:996, pos:1, neg:3, mix:1,
      positives:['Una reseña la considera el mejor supermercado de Tulsa por servicio, ambiente, carnes y verduras.'],
      negatives:['Tres reseñas negativas se concentran en cajas, promociones, manejo de quejas y frescura de un producto lácteo.','También aparece una fricción de idioma y falta de ofrecimiento de ayuda en piso.'],
      observed:'Es la muestra con mayor proporción negativa entre las 11 sucursales codificadas. Los comentarios se concentran principalmente en front-end, políticas de tienda y servicio.'
    },
    {
      name:'Supermercados Morelos 129th', short:'129th', city:'Tulsa', market:'Tulsa Metro', rating:4.4, reviews:673, pos:4, neg:1, mix:0,
      positives:['Food service, frescos, surtido especializado y panadería aparecen como motivos de preferencia.','Una reseña describe la tienda como destino para productos que no encuentra en otros comercios.'],
      negatives:['Una reseña reporta problemas de frescura en guacamole, pico de gallo y carne comprados para una celebración.'],
      observed:'La muestra es mayoritariamente positiva, con una observación negativa concentrada en frescura de alimentos preparados y carne.'
    },
    {
      name:'Supermercados Morelos Peoria', short:'Peoria', city:'Tulsa', market:'Tulsa Metro', rating:4.4, reviews:657, pos:4, neg:1, mix:0,
      positives:['Se repiten limpieza, personal bilingüe, asesoría en producto, frescos y carnicería.','Una reseña describe la sucursal como un hallazgo poco conocido pese a una experiencia muy favorable.'],
      negatives:['Una reseña cuestiona la relación valor-precio de food service y menciona una comisión por pago con tarjeta.'],
      observed:'La muestra combina satisfacción alta con atención y producto, mientras la única negativa se concentra en food service y percepción de valor del ticket.'
    },
    {
      name:'Supermercados Morelos Broken Arrow', short:'Broken Arrow', city:'Broken Arrow', market:'Tulsa Metro', rating:4.6, reviews:611, pos:4, neg:1, mix:0,
      positives:['Surtido, carnes marinadas, limpieza, variedad multicultural y precio razonable aparecen de forma reiterada.','También se valora la disponibilidad de productos difíciles de encontrar en otros supermercados.'],
      negatives:['Una reseña describe una respuesta poco empática ante una solicitud de acceso a wifi de invitados.'],
      observed:'Es la sucursal con mayor rating Google del conjunto observado; la muestra textual es mayoritariamente positiva y se concentra en surtido, limpieza y producto.'
    }
  ];

  const topics = [
    ['Personal y trato',22,12,9,1],['Food service',19,12,5,2],['Carnicería',15,12,3,0],['Surtido y variedad',14,11,0,3],['Precio y valor',13,11,1,1],['Frutas y verduras',12,11,0,1],['Limpieza y orden',12,10,1,1],['Panadería',8,7,0,1],['Idioma y señalización',8,5,1,2],['Políticas de tienda',7,0,7,0],['Autenticidad y nostalgia',6,5,0,1],['Checkout y filas',4,2,2,0]
  ];

  const benchmark = [
    ['Feria Latina Supermarket · NW 23rd','Oklahoma City',4.3,2385],
    ['Feria Latina Supermarket · SW 47th','Oklahoma City',4.2,602],
    ['Feria Latina Supermarket · Garnett','Tulsa',4.5,172],
    ['Las Americas','Tulsa',4.0,1224],
    ['Supermercados Las Americas International','Tulsa',4.1,323],
    ['Supermercado La Cosecha & Restaurant Wholesale','Tulsa',4.5,30],
    ['Feria Latina Supermarket · SW 25th','Oklahoma City',4.7,14],
    ['Plaza del Caribe','Oklahoma City',4.9,23],
    ['Tienda Latina','Tulsa',3.5,15]
  ];

  const totalReviews = stores.reduce((a,s)=>a+s.reviews,0);
  const weighted = stores.reduce((a,s)=>a+s.rating*s.reviews,0)/totalReviews;
  const totalPos = stores.reduce((a,s)=>a+s.pos,0);
  const totalNeg = stores.reduce((a,s)=>a+s.neg,0);
  const totalMix = stores.reduce((a,s)=>a+s.mix,0);

  document.getElementById('heroKpis').innerHTML = [
    ['Rating ponderado',weighted.toFixed(2),'Cadena'],
    ['Calificaciones',fmt.format(totalReviews),'Google'],
    ['Muestra textual','55','5 por tienda'],
    ['Mix muestra',`${totalPos}/${totalMix}/${totalNeg}`,'Pos. / Mixtas / Neg.']
  ].map(([l,v,s])=>`<div class="hero-kpi"><span>${l}</span><b>${v}</b><small>${s}</small></div>`).join('');

  const marketFilter = document.getElementById('marketFilter');
  const ratingFilter = document.getElementById('ratingFilter');
  const sampleFilter = document.getElementById('sampleFilter');
  const resetFilters = document.getElementById('resetFilters');
  let filtered = [...stores];
  let current = 0;

  function samplePercent(store,key){ return store[key] / 5; }

  function applyFilters(){
    filtered = stores.filter(s => {
      const marketOk = marketFilter.value === 'all' || s.market === marketFilter.value;
      const ratingOk = ratingFilter.value === 'all' ||
        (ratingFilter.value === 'high' && s.rating >= 4.4) ||
        (ratingFilter.value === 'mid' && s.rating === 4.3) ||
        (ratingFilter.value === 'low' && s.rating <= 4.2);
      const sampleOk = sampleFilter.value === 'all' ||
        (sampleFilter.value === 'negative' && s.neg > 0) ||
        (sampleFilter.value === 'nonegative' && s.neg === 0);
      return marketOk && ratingOk && sampleOk;
    });
    current = 0;
    renderTabs();
    renderStore();
  }

  function renderTabs(){
    const tabs = document.getElementById('storeTabs');
    if(!filtered.length){ tabs.innerHTML=''; return; }
    tabs.innerHTML = filtered.map((s,i)=>`<button type="button" class="store-tab ${i===current?'active':''}" data-index="${i}"><span>${esc(s.short)}</span><b>${s.rating.toFixed(1)} ★</b></button>`).join('');
    tabs.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{current=Number(btn.dataset.index);renderTabs();renderStore();}));
  }

  function donutStyle(s){
    const p = samplePercent(s,'pos')*100;
    const m = samplePercent(s,'mix')*100;
    return `conic-gradient(var(--green-700) 0 ${p}%, var(--mustard) ${p}% ${p+m}%, var(--red) ${p+m}% 100%)`;
  }

  function examples(items, type){
    if(!items.length) return `<div class="empty-example">Sin ejemplos ${type === 'positive' ? 'negativos' : 'positivos'} dentro de las 5 reseñas codificadas.</div>`;
    return items.map(t=>`<div class="example-item ${type}"><span>${type==='positive'?'＋':'−'}</span><p>${esc(t)}</p></div>`).join('');
  }

  function renderStore(){
    const stage = document.getElementById('storeStage');
    const counter = document.getElementById('storeCounter');
    const dots = document.getElementById('carouselDots');
    const prev = document.getElementById('prevStore');
    const next = document.getElementById('nextStore');

    if(!filtered.length){
      stage.innerHTML='<div class="no-results"><b>No hay sucursales con esta combinación de filtros.</b><span>Restablece los filtros para ver nuevamente las 11 tiendas.</span></div>';
      counter.textContent='0 sucursales'; dots.innerHTML=''; prev.disabled=true; next.disabled=true; return;
    }

    const s = filtered[current];
    prev.disabled = filtered.length <= 1;
    next.disabled = filtered.length <= 1;
    const posPct = pct(samplePercent(s,'pos'));
    const mixPct = pct(samplePercent(s,'mix'));
    const negPct = pct(samplePercent(s,'neg'));

    stage.innerHTML = `
      <article class="store-profile">
        <div class="store-profile-head">
          <div>
            <span class="store-market">${esc(s.market)} · ${esc(s.city)}</span>
            <h3>${esc(s.name)}</h3>
            <div class="store-google-line"><b>${s.rating.toFixed(1)} ★</b><span>${fmt.format(s.reviews)} calificaciones Google</span></div>
          </div>
          <div class="store-position">${current+1}<span>/ ${filtered.length}</span></div>
        </div>

        <div class="store-main-grid">
          <div class="sentiment-panel">
            <div class="donut-wrap">
              <div class="donut" style="background:${donutStyle(s)}"><div class="donut-hole"><b>5</b><span>reviews<br>codificadas</span></div></div>
            </div>
            <div class="sentiment-legend">
              <div><i class="positive-dot"></i><span>Positivo</span><b>${posPct}</b><small>${s.pos} de 5</small></div>
              <div><i class="mixed-dot"></i><span>Mixto</span><b>${mixPct}</b><small>${s.mix} de 5</small></div>
              <div><i class="negative-dot"></i><span>Negativo</span><b>${negPct}</b><small>${s.neg} de 5</small></div>
            </div>
          </div>

          <div class="store-insight">
            <span class="mini-label">Lectura observada</span>
            <p>${esc(s.observed)}</p>
            <div class="sample-disclaimer">Los porcentajes corresponden a la muestra codificada de 5 reseñas, no a las ${fmt.format(s.reviews)} calificaciones totales.</div>
          </div>
        </div>

        <div class="examples-grid">
          <div class="examples-block positive-block"><div class="examples-title"><span>Ejemplos positivos</span><b>${s.pos} en la muestra</b></div>${examples(s.positives,'positive')}</div>
          <div class="examples-block negative-block"><div class="examples-title"><span>Ejemplos negativos</span><b>${s.neg} en la muestra</b></div>${examples(s.negatives,'negative')}</div>
        </div>
      </article>`;

    counter.textContent = `${current+1} de ${filtered.length} sucursales · desliza o usa las flechas`;
    dots.innerHTML = filtered.map((_,i)=>`<button type="button" aria-label="Ver sucursal ${i+1}" class="${i===current?'active':''}" data-index="${i}"></button>`).join('');
    dots.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{current=Number(btn.dataset.index);renderTabs();renderStore();}));
  }

  document.getElementById('prevStore').addEventListener('click',()=>{ if(!filtered.length)return; current=(current-1+filtered.length)%filtered.length; renderTabs();renderStore(); });
  document.getElementById('nextStore').addEventListener('click',()=>{ if(!filtered.length)return; current=(current+1)%filtered.length; renderTabs();renderStore(); });
  [marketFilter,ratingFilter,sampleFilter].forEach(el=>el.addEventListener('change',applyFilters));
  resetFilters.addEventListener('click',()=>{marketFilter.value='all';ratingFilter.value='all';sampleFilter.value='all';applyFilters();});

  let touchStartX = null;
  document.getElementById('storeStage').addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].clientX;},{passive:true});
  document.getElementById('storeStage').addEventListener('touchend',e=>{
    if(touchStartX==null || filtered.length<2) return;
    const delta=e.changedTouches[0].clientX-touchStartX;
    if(Math.abs(delta)>50){ current = delta<0 ? (current+1)%filtered.length : (current-1+filtered.length)%filtered.length; renderTabs();renderStore(); }
    touchStartX=null;
  },{passive:true});

  document.getElementById('topicGrid').innerHTML = topics.map(([name,total,pos,neg,mix])=>{
    const negShare = total ? neg/total : 0;
    return `<article class="topic-card ${negShare>=.6?'critical':negShare>=.3?'watch':''}">
      <div class="topic-head"><b>${esc(name)}</b><span>${total} menciones</span></div>
      <div class="topic-bar"><i style="width:${pos/total*100}%"></i><i class="mix" style="width:${mix/total*100}%"></i><i class="neg" style="width:${neg/total*100}%"></i></div>
      <div class="topic-numbers"><span>${pos} positivas</span><span>${mix} mixtas</span><span>${neg} negativas</span></div>
    </article>`;
  }).join('');

  const insights = [
    ['El rating de cadena se mantiene alto','El promedio ponderado observado es 4.33 estrellas sobre 8,018 calificaciones. Broken Arrow presenta el rating más alto (4.6), mientras Admiral muestra 4.0 con un volumen mucho menor de calificaciones.'],
    ['La muestra textual no es homogénea entre tiendas','50th y Garnett muestran 5 de 5 reseñas positivas dentro de la muestra; Harvard presenta 3 negativas de 5 y NW 23rd combina positivas, mixtas y negativas.'],
    ['Producto y servicio conviven como principales temas','Personal y trato es el tema con más menciones (22), seguido de food service (19) y carnicería (15). En los tres aparecen tanto comentarios favorables como desfavorables.'],
    ['Surtido, frescos y panadería aparecen de forma consistente','Surtido y variedad no registra menciones negativas dentro de la muestra temática. Frutas y verduras y panadería también aparecen principalmente asociadas con comentarios favorables.'],
    ['Las menciones negativas están más concentradas','Políticas de tienda y frescura/caducidad tienen pocas menciones totales, pero las observadas son negativas. Esto contrasta con temas de mayor volumen y mezcla de sentiment.'],
    ['OKC y Tulsa muestran ratings de mercado muy próximos','El rating ponderado observado es 4.32 en OKC Metro y 4.35 en Tulsa Metro. La diferencia es pequeña frente a los contrastes que sí aparecen entre sucursales individuales.']
  ];
  document.getElementById('insightGrid').innerHTML = insights.map((x,i)=>`<article class="insight-card"><span>0${i+1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('');

  document.getElementById('benchmarkTable').innerHTML = `<thead><tr><th>Competidor</th><th>Ciudad</th><th class="num">Rating</th><th class="num">Calificaciones</th></tr></thead><tbody>${benchmark.map(b=>`<tr><td><b>${esc(b[0])}</b></td><td>${esc(b[1])}</td><td class="num"><b>${b[2].toFixed(1)}</b></td><td class="num">${fmt.format(b[3])}</td></tr>`).join('')}</tbody>`;

  applyFilters();
})();
