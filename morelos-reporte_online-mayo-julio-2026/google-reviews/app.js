(async () => {
  const fmt = new Intl.NumberFormat('es-MX');
  const pct = v => v == null ? '—' : `${(v * 100).toFixed(1)}%`;
  const num = v => v == null || v === '' ? '—' : fmt.format(v);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const sentimentEs = s => ({Positive:'Positivo',Negative:'Negativo',Mixed:'Mixto'}[s] || s);
  const badgeSentiment = s => `<span class="badge ${s === 'Negative' ? 'negative' : s === 'Mixed' ? 'mixed' : ''}">${sentimentEs(s)}</span>`;
  const severityBadge = s => `<span class="badge sev ${Number(s) >= 4 ? 'high' : ''}">Severidad ${esc(s)}/5</span>`;

  function parseCsv(text){
    const rows=[]; let row=[], field='', quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i], n=text[i+1];
      if(c==='"' && quoted && n==='"'){field+='"';i++;continue}
      if(c==='"'){quoted=!quoted;continue}
      if(c===',' && !quoted){row.push(field);field='';continue}
      if((c==='\n'||c==='\r') && !quoted){if(c==='\r'&&n==='\n')i++;row.push(field);field='';if(row.some(v=>v!==''))rows.push(row);row=[];continue}
      field+=c;
    }
    if(field!==''||row.length){row.push(field);rows.push(row)}
    const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,''));
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
  }
  const n = v => v === '' || v == null ? null : Number(v);

  const topicMap = {
    'Carnicería / Value':'Carnicería / valor','Prepared Food Quality':'Calidad de comida preparada','Cleanliness / Assortment / Value':'Limpieza / surtido / valor',
    'Food Safety / Tortillas':'Inocuidad / tortillas','Assortment / Value / Fresh Prepared':'Surtido / valor / frescura preparada','Prepared Food / Authenticity':'Comida preparada / autenticidad',
    'Training / Juice Bar Service':'Capacitación / servicio en jugos','Carnicería Service':'Servicio de carnicería','Meat Freshness / Refund Policy':'Frescura de carne / política de reembolso',
    'Meat / Produce / Assortment':'Carnes / frutas y verduras / surtido','Service / Price / Meat Quality':'Servicio / precio / calidad de carne','Odor / Assortment':'Olor / surtido',
    'Service / Overall Quality':'Servicio / calidad general','Tortilla Quality / Service Recovery':'Calidad de tortillas / recuperación de servicio','Prepared Food / Value':'Comida preparada / valor',
    'Prepared Food / Bakery / Service':'Comida preparada / panadería / servicio','Assortment / Service':'Surtido / servicio','Prepared Food Quality / Availability':'Calidad / disponibilidad de comida preparada',
    'Staffing / Service Speed / Management':'Dotación / velocidad de servicio / gestión','Cleanliness / Service / Assortment / Prepared Food':'Limpieza / servicio / surtido / comida preparada',
    'Value / Service':'Valor / servicio','Price / Value':'Precio / valor','Produce / Meat':'Frutas y verduras / carnes','International Assortment':'Surtido internacional',
    'Crowding / Shopper Experience':'Saturación / experiencia de compra','Prepared Food / Bakery / Experience':'Comida preparada / panadería / experiencia','Meat / Produce Consistency':'Carne / consistencia de frutas y verduras',
    'Prepared Food':'Comida preparada','Assortment / Pantry':'Surtido / despensa'
  };
  const summariesEs = [
    'Destaca una carnicería sólida y verduras que suelen tener precios más bajos.',
    'Reporta que el chicharrón se enfrió, quedó aguado y perdió sabor pocos minutos después de la compra.',
    'Describe la tienda como limpia, variada y accesible; señala que el restaurante dentro de la tienda agrega valor.',
    'Reporta que tortillas compradas ese mismo día tenían moho visible y mal olor; lo plantea como una preocupación de salud.',
    'La considera una tienda de referencia para productos latinos; menciona buenos precios, personal atento, guacamole fresco y salsa hecha a mano.',
    'Destaca la autenticidad de la experiencia de comida mexicana dentro del supermercado.',
    'Señala que la persona del área de jugos no sabía preparar los productos solicitados y lo atribuye a falta de capacitación.',
    'Reporta trato descortés en carnicería después de interrumpir una conversación entre empleados.',
    'Reporta que la carne olía vieja o en mal estado y que gerencia no realizó el reembolso sin ticket pese a evidencia del mismo día.',
    'Destaca ingredientes mexicanos, cortes y marinados, además de frutas y verduras generalmente maduras y listas para usar.',
    'Percibe precios altos, critica el servicio y el incumplimiento de solicitudes en deli; considera que un competidor ofrece mejor calidad.',
    'Valora el surtido, pero señala un olor desagradable dentro de la tienda.',
    'Califica positivamente la tienda y el servicio desde la entrada hasta cajas.',
    'Critica la calidad de las tortillas y reporta que gerencia indicó que no podía hacer nada ante la queja.',
    'Señala que un burrito tenía poco relleno para el precio y que no había salsas disponibles; indica que no regresaría.',
    'Muy favorable hacia el área de comida, variedad, precios y panadería; también señala trato consistentemente amable.',
    'Valora el amplio surtido y describe al personal como amable.',
    'Señala que las carnitas ya no saben como antes y que un tipo de chicharrón no está disponible entre semana.',
    'Reporta varias personas del equipo sin atender mientras una sola persona servía comida lentamente; atribuye el problema a la gestión de la sucursal y afirma que no regresará.',
    'Describe el mercado como limpio y ordenado, con personal cordial, amplio surtido latino y buena comida preparada.',
    'Destaca buenos precios y servicio.',
    'Percibe los precios como altos frente a Walmart para productos comparables.',
    'Destaca la frescura y variedad de frutas, verduras y carnes.',
    'Valora poder encontrar productos de distintos países.',
    'Señala que la sucursal suele estar saturada y describe una experiencia incómoda con otros compradores.',
    'Describe la tienda como una experiencia de destino y destaca pan dulce, tamales y paletas.',
    'Destaca la carne fresca, pero señala inconsistencia en la calidad de las verduras.',
    'Destaca buenas opciones de comida durante el día.',
    'Muestra histórica de Google: la describe como un buen lugar para comprar alimentos y abastecer la despensa.'
  ];

  try{
    const [storeText, reviewText] = await Promise.all([
      fetch('data/store-level-google-data.csv').then(r => {if(!r.ok) throw new Error('store data'); return r.text()}),
      fetch('data/review-samples-google-only.csv').then(r => {if(!r.ok) throw new Error('review data'); return r.text()})
    ]);
    const stores = parseCsv(storeText).map(r => ({
      id:n(r.ID), store:r.Store, address:r.Address, phone:r.Phone, maps:r['Official Google Maps'], rating:n(r['Google Rating']), reviewCount:n(r['Google Review Count']), snapshot:r.Snapshot,
      stars:{'5':n(r['5★']),'4':n(r['4★']),'3':n(r['3★']),'2':n(r['2★']),'1':n(r['1★'])}, positive:n(r['Positive % (4–5★)']), neutral:n(r['Neutral % (3★)']), negative:n(r['Negative % (1–2★)']),
      coverage:r['Sentiment Coverage'], verification:r['Google-only Verification'], source:r['Source URL'], notes:r.Notes
    }));
    const reviews = parseCsv(reviewText).map((r,i) => ({
      store:r.Store, reviewer:r.Reviewer, date:r['Review Date / Recency'], stars:n(r.Stars), sentiment:r.Sentiment, topic:topicMap[r.Topic] || r.Topic,
      severity:n(r['Severity (1–5)']), relevance:n(r['Relevance (1–5)']), summary:summariesEs[i] || r['Analyst Summary (paraphrased)'], source:r['Google-only Source URL']
    }));
    const verified = stores.filter(s => s.verification === 'Verified Google aggregate');
    const full = stores.filter(s => s.positive != null);
    const verifiedReviewFootprint = verified.reduce((a,s)=>a+(s.reviewCount||0),0);
    const fullHistogramReviews = full.reduce((a,s)=>a+Object.values(s.stars).reduce((x,v)=>x+(v||0),0),0);
    const pos = full.reduce((a,s)=>a+(s.stars['5']||0)+(s.stars['4']||0),0);
    const neu = full.reduce((a,s)=>a+(s.stars['3']||0),0);
    const neg = full.reduce((a,s)=>a+(s.stars['2']||0)+(s.stars['1']||0),0);
    const summary = {officialStores:stores.length,verifiedAggregates:verified.length,verifiedReviewFootprint,fullHistogramStores:full.length,fullHistogramReviews,positive:pos/fullHistogramReviews,neutral:neu/fullHistogramReviews,negative:neg/fullHistogramReviews,sampleCount:reviews.length,highSeverity:reviews.filter(r=>r.severity>=4).length};

    document.getElementById('heroKpis').innerHTML=[
      ['Sucursales oficiales',summary.officialStores,'Universo del reporte'],['Aggregates verificados',summary.verifiedAggregates,'Google-only'],['Reviews observadas',fmt.format(summary.verifiedReviewFootprint),'Footprint · snapshots distintos'],['Muestra listening',summary.sampleCount,'Reviews visibles']
    ].map(([label,value,small])=>`<div class="hero-kpi"><span>${label}</span><b>${value}</b><small>${small}</small></div>`).join('');

    document.getElementById('sentimentOverview').innerHTML=`<article class="card sentiment-total"><h3>Distribución combinada con histograma disponible</h3><p>Base: ${fmt.format(summary.fullHistogramReviews)} reviews · ${summary.fullHistogramStores} sucursales. No representa las 11 tiendas.</p><div class="stacked"><i class="seg positive" style="width:${summary.positive*100}%"></i><i class="seg neutral" style="width:${summary.neutral*100}%"></i><i class="seg negative" style="width:${summary.negative*100}%"></i></div><div class="sentiment-labels"><div class="sentiment-label"><span>Positivo</span><b>${pct(summary.positive)}</b><small>4–5★</small></div><div class="sentiment-label neutral"><span>Neutral</span><b>${pct(summary.neutral)}</b><small>3★</small></div><div class="sentiment-label negative"><span>Negativo</span><b>${pct(summary.negative)}</b><small>1–2★</small></div></div></article><article class="card coverage-card"><div class="coverage-stat"><span>Tiendas con aggregate Google verificado</span><b>${summary.verifiedAggregates}/${summary.officialStores}</b></div><div class="coverage-stat"><span>Tiendas con histograma completo actual</span><b>${summary.fullHistogramStores}/${summary.officialStores}</b></div><div class="coverage-stat"><span>Reviews de listening visibles</span><b>${summary.sampleCount}</b></div><div class="coverage-stat"><span>Menciones de severidad 4–5 en la muestra</span><b>${summary.highSeverity}</b></div></article>`;

    document.getElementById('sentimentStores').innerHTML=full.map(store=>{
      const max=Math.max(...Object.values(store.stars).map(Number));
      const rows=['5','4','3','2','1'].map(star=>`<div class="star-row"><span>${star}★</span><div class="track"><i style="width:${(Number(store.stars[star])/max*100).toFixed(1)}%"></i></div><b>${num(store.stars[star])}</b></div>`).join('');
      return `<article class="card sentiment-store"><div class="sentiment-store-head"><div><h3>${esc(store.store)}</h3><div class="sentiment-store-meta">${esc(store.snapshot)} · ${num(store.reviewCount)} reviews</div></div><div class="rating">${store.rating.toFixed(1)} <small>★</small></div></div><div class="stacked"><i class="seg positive" style="width:${store.positive*100}%"></i><i class="seg neutral" style="width:${store.neutral*100}%"></i><i class="seg negative" style="width:${store.negative*100}%"></i></div><div class="sentiment-labels"><div class="sentiment-label"><span>Positivo</span><b>${pct(store.positive)}</b></div><div class="sentiment-label neutral"><span>Neutral</span><b>${pct(store.neutral)}</b></div><div class="sentiment-label negative"><span>Negativo</span><b>${pct(store.negative)}</b></div></div><div style="margin-top:14px">${rows}</div></article>`;
    }).join('');

    function coverageBadge(store){if(store.positive!=null)return '<span class="badge histogram">Histograma completo</span>';if(store.verification==='Verified Google aggregate')return '<span class="badge">Aggregate verificado</span>';return '<span class="badge gap">Brecha de cobertura</span>'}
    function renderStores(){
      const q=document.getElementById('storeSearch').value.trim().toLowerCase(), f=document.getElementById('coverageFilter').value;
      const rows=stores.filter(s=>{const searchOk=!q||`${s.store} ${s.address}`.toLowerCase().includes(q);const filterOk=f==='all'||(f==='verified'&&s.verification==='Verified Google aggregate')||(f==='histogram'&&s.positive!=null)||(f==='gap'&&s.verification!=='Verified Google aggregate');return searchOk&&filterOk});
      document.getElementById('storeTable').innerHTML=`<thead><tr><th>Sucursal</th><th>Rating</th><th class="num">Reviews</th><th>Sentiment</th><th>Cobertura</th><th>Snapshot</th><th>Fuente</th></tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(s.store)}</b><div class="muted">${esc(s.address)}</div></td><td>${s.rating==null?'—':`${s.rating.toFixed(1)} ★`}</td><td class="num">${num(s.reviewCount)}</td><td>${s.positive==null?'<span class="muted">No calculado</span>':`<b>${pct(s.positive)}</b> pos. · ${pct(s.negative)} neg.`}</td><td>${coverageBadge(s)}</td><td>${esc(s.snapshot||'—')}</td><td>${s.source?`<a class="link" target="_blank" rel="noopener" href="${esc(s.source)}">Fuente</a> · `:''}<a class="link" target="_blank" rel="noopener" href="${esc(s.maps)}">Maps</a></td></tr>`).join('')}</tbody>`;
    }

    function topicFamily(topic){const t=topic.toLowerCase();if(/inocuidad|tortilla/.test(t))return 'Inocuidad y tortillas';if(/servicio|capacitación|dotación|gestión/.test(t))return 'Servicio y operación';if(/comida preparada|panadería|autenticidad/.test(t))return 'Comida preparada';if(/carne|carnicería/.test(t))return 'Carnes y carnicería';if(/precio|valor/.test(t))return 'Precio y valor';if(/frutas|verduras|surtido|despensa/.test(t))return 'Surtido y frescos';if(/limpieza|olor/.test(t))return 'Condición de tienda';if(/saturación|experiencia/.test(t))return 'Experiencia de compra';return 'Otros'}
    const groups={};reviews.forEach(r=>{const k=topicFamily(r.topic);groups[k]??={count:0,Positive:0,Negative:0,Mixed:0,high:0};groups[k].count++;groups[k][r.sentiment]++;if(r.severity>=4)groups[k].high++});
    document.getElementById('topicGrid').innerHTML=Object.entries(groups).sort((a,b)=>b[1].count-a[1].count).map(([name,g])=>{const total=g.count||1;return `<article class="topic-card"><span>Muestra visible</span><h3>${esc(name)}</h3><div class="topic-count">${g.count}</div><div class="topic-mix"><i style="width:${g.Positive/total*100}%;background:var(--green-700)"></i><i style="width:${g.Mixed/total*100}%;background:var(--mustard)"></i><i style="width:${g.Negative/total*100}%;background:var(--red)"></i></div><div class="topic-foot"><span>${g.Positive} pos · ${g.Mixed} mixt · ${g.Negative} neg</span><span>${g.high} sev. 4–5</span></div></article>`}).join('');

    function reviewCard(r){return `<div class="review-item"><div class="review-item-head"><b>${esc(r.store)}</b><span>${esc(r.reviewer)} · ${esc(r.date)}</span></div><p>${esc(r.summary)}</p><div class="review-item-foot">${badgeSentiment(r.sentiment)}${severityBadge(r.severity)}<span class="badge">Relevancia ${esc(r.relevance)}/5</span><a target="_blank" rel="noopener" href="${esc(r.source)}">Ver fuente</a></div></div>`}
    document.getElementById('negativeHighlights').innerHTML=reviews.filter(r=>r.sentiment==='Negative').sort((a,b)=>(b.severity-a.severity)||(b.relevance-a.relevance)).slice(0,6).map(reviewCard).join('');
    document.getElementById('relevantHighlights').innerHTML=[...reviews].sort((a,b)=>(b.relevance-a.relevance)||(b.severity-a.severity)).slice(0,6).map(reviewCard).join('');

    const reviewStore=document.getElementById('reviewStore');reviewStore.innerHTML='<option value="all">Todas</option>'+[...new Set(reviews.map(r=>r.store))].sort().map(s=>`<option>${esc(s)}</option>`).join('');
    function renderReviews(){
      const store=reviewStore.value,sentiment=document.getElementById('reviewSentiment').value,sev=document.getElementById('reviewSeverity').value,q=document.getElementById('reviewSearch').value.trim().toLowerCase();
      const rows=reviews.filter(r=>(store==='all'||r.store===store)&&(sentiment==='all'||r.sentiment===sentiment)&&(sev==='all'||r.severity>=Number(sev))&&(!q||`${r.store} ${r.topic} ${r.summary} ${r.reviewer}`.toLowerCase().includes(q)));
      document.getElementById('reviewStatus').textContent=`${rows.length} de ${reviews.length} reseñas visibles`;
      document.getElementById('reviewTable').innerHTML=`<thead><tr><th>Sucursal</th><th>Fecha</th><th>Sentiment</th><th>Severidad</th><th>Relevancia</th><th>Tema</th><th>Resumen analítico</th><th>Fuente</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.store)}</b><div class="muted">${esc(r.reviewer)}</div></td><td>${esc(r.date)}</td><td>${badgeSentiment(r.sentiment)}</td><td>${severityBadge(r.severity)}</td><td>${esc(r.relevance)}/5</td><td>${esc(r.topic)}</td><td class="summary-cell">${esc(r.summary)}</td><td><a class="link" target="_blank" rel="noopener" href="${esc(r.source)}">Fuente</a></td></tr>`).join('')}</tbody>`;
    }
    renderStores();renderReviews();
    document.getElementById('storeSearch').addEventListener('input',renderStores);document.getElementById('coverageFilter').addEventListener('change',renderStores);
    ['reviewStore','reviewSentiment','reviewSeverity'].forEach(id=>document.getElementById(id).addEventListener('change',renderReviews));document.getElementById('reviewSearch').addEventListener('input',renderReviews);
  }catch(error){
    console.error(error);
    document.querySelector('main').insertAdjacentHTML('afterbegin','<div class="shell" style="margin-top:16px;padding:12px 14px;background:#f7e5e4;border:1px solid #e4c4c2;border-radius:12px">No fue posible cargar los archivos de datos del reporte.</div>');
  }
})();
