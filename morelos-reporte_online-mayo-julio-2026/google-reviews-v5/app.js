const fmt=new Intl.NumberFormat('es-MX'),$=id=>document.getElementById(id),pct=(n,d)=>d?`${(n/d*100).toFixed(1)}%`:'—',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const order=['59th','50th','NW 23rd','MacArthur','Moore','Admiral','Garnett','Harvard','129th','Peoria','Broken Arrow'];
let stores=[],listening={},cloudMode='all';

const admiral={
 branch:'Admiral',slug:'admiral',title:'Supermercado Morelos',city:'Tulsa',market:'Tulsa Metro',
 rating:4.0,google_total:23,qualitative:true,text_reviews:17,
 positive_n:10,neutral_n:2,negative_n:5,positive_pct:10/17,neutral_pct:2/17,negative_pct:5/17,
 first_date:'aprox. feb 2026',last_date:'aprox. jul 2026'
};
const admiralListening={text_reviews:17,topics:{
 'Servicio y trato':{mentions:6,positive:2,neutral:1,negative:3},
 'Carnicería / carne':{mentions:5,positive:3,neutral:0,negative:2},
 'Frescos / produce':{mentions:5,positive:4,neutral:0,negative:1},
 'Surtido / variedad':{mentions:4,positive:4,neutral:0,negative:0},
 'Food service / comida preparada':{mentions:4,positive:3,neutral:1,negative:0},
 'Limpieza / higiene':{mentions:3,positive:2,neutral:1,negative:0},
 'Baños / acceso':{mentions:2,positive:0,neutral:0,negative:2}
},terms:[
 {term:'service',mentions:6,positive:2,neutral:1,negative:3},
 {term:'meat',mentions:5,positive:3,neutral:0,negative:2},
 {term:'produce',mentions:5,positive:4,neutral:0,negative:1},
 {term:'fresh',mentions:5,positive:4,neutral:0,negative:1},
 {term:'selection',mentions:4,positive:4,neutral:0,negative:0},
 {term:'clean',mentions:3,positive:2,neutral:1,negative:0},
 {term:'tamales',mentions:1,positive:1,neutral:0,negative:0},
 {term:'deli',mentions:1,positive:1,neutral:0,negative:0},
 {term:'bathroom',mentions:2,positive:0,neutral:0,negative:2},
 {term:'rude',mentions:2,positive:0,neutral:0,negative:2}
]};

const topicShort={
 'Food service / comida preparada':'Comida preparada','Servicio y trato':'Servicio','Surtido / variedad':'Surtido',
 'Carnicería / carne':'Carnicería','Frescos / produce':'Frescos','Precio y valor':'Precio',
 'Limpieza / higiene':'Limpieza','Panadería / postres':'Panadería','Checkout / cajas':'Cajas',
 'Idioma / atención bilingüe':'Atención bilingüe','Baños / acceso':'Baños'
};
const termMap={
 'tamales':'Tamales','pan':'Panadería','friendly':'Personal amable','helpful':'Personal amable',
 'mexican':'Autenticidad mexicana','authentic':'Autenticidad mexicana','fresh':'Frescura',
 'produce':'Frutas y verduras','rude':'Trato poco amable','bathroom':'Baños','restroom':'Baños',
 'deli':'Deli','tacos':'Tacos','delicious':'Sabor','clean':'Limpieza','limpio':'Limpieza','prices':'Precio','precio':'Precio'
};
const skipTerms=new Set(['food','meat','service','servicio','staff','personal','atencion','selection','variety','products','productos','items','find','excelente']);

function totals(arr){return arr.reduce((a,s)=>{a.reviews+=s.scraped_reviews||0;a.pos+=s.positive_n||0;a.neu+=s.neutral_n||0;a.neg+=s.negative_n||0;a.text+=s.text_reviews||0;return a},{reviews:0,pos:0,neu:0,neg:0,text:0})}
function publicRating(arr){const valid=arr.filter(s=>Number.isFinite(s.rating)&&Number.isFinite(s.google_total)&&s.google_total>0);const n=valid.reduce((a,s)=>a+s.google_total,0);return{rating:n?valid.reduce((a,s)=>a+s.rating*s.google_total,0)/n:0,count:n,stores:valid.length}}
function selectedAll(){
 const market=$('marketFilter').value,rating=$('ratingFilter').value,neg=$('negFilter').value;
 return stores.filter(s=>{
  if(market!=='all'&&s.market!==market)return false;
  if(rating==='high'&&s.rating<4.4)return false;if(rating==='mid'&&s.rating!==4.3)return false;if(rating==='low'&&s.rating>4.2)return false;
  const np=s.negative_pct||0;if(neg==='high'&&np<.12)return false;if(neg==='mid'&&(np<.09||np>=.12))return false;if(neg==='low'&&np>=.09)return false;
  return true;
 });
}
const selectedQuant=()=>selectedAll().filter(s=>!s.qualitative);

function renderKPIs(q,all){
 const t=totals(q),pr=publicRating(all),ad=all.find(s=>s.qualitative);
 $('kpis').innerHTML=[
  ['Reviews analizadas',fmt.format(t.reviews),ad?`+ ${ad.text_reviews} comentarios Admiral clasificados por texto`:`${q.length} fichas con estrellas individuales`,''],
  ['Rating público ponderado',pr.rating?`${pr.rating.toFixed(2)} ★`:'—',`${pr.stores} ficha${pr.stores===1?'':'s'} · ${fmt.format(pr.count)} calificaciones públicas`,''],
  ['Positivo',pct(t.pos,t.reviews),`${fmt.format(t.pos)} reviews 4–5★`,'pos'],
  ['Neutral',pct(t.neu,t.reviews),`${fmt.format(t.neu)} reviews 3★`,''],
  ['Negativo',pct(t.neg,t.reviews),`${fmt.format(t.neg)} reviews 1–2★`,'neg']
 ].map(x=>`<article class="kpi ${x[3]}"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></article>`).join('');
}

function marketCard(name,all){
 const visible=all.filter(s=>s.market===name),q=visible.filter(s=>!s.qualitative);
 if(!visible.length)return `<article class="market-card empty">Sin sucursales visibles en ${name}</article>`;
 const t=totals(q),pr=publicRating(visible),ad=visible.find(s=>s.qualitative);
 return `<article class="market-card"><div class="market-top"><div><div class="market-name">${name}</div><small>${pr.stores} sucursal${pr.stores===1?'':'es'} con rating público${ad?' · Admiral incluido':''}</small></div><div class="market-rating">${pr.rating.toFixed(2)} ★<small>rating público ponderado</small></div></div>
 <div class="market-kpis"><div><span>Reviews con estrella</span><b>${fmt.format(t.reviews)}</b></div><div><span>Positivo</span><b>${pct(t.pos,t.reviews)}</b></div><div><span>Neutral</span><b>${pct(t.neu,t.reviews)}</b></div><div><span>Negativo</span><b>${pct(t.neg,t.reviews)}</b></div></div>
 ${t.reviews?`<div class="market-bar"><i class="p" style="width:${t.pos/t.reviews*100}%"></i><i class="m" style="width:${t.neu/t.reviews*100}%"></i><i class="n" style="width:${t.neg/t.reviews*100}%"></i></div>`:''}
 ${ad?`<small style="margin-top:10px">Admiral: 4.0★ / 23 públicas · sentiment textual estimado 58.8% positivo / 11.8% mixto / 29.4% negativo.</small>`:''}</article>`;
}
function renderMarkets(all){const m=$('marketFilter').value;$('marketTitle').textContent=m==='all'?'OKC Metro vs Tulsa Metro':m;$('marketGrid').innerHTML=(m==='all'?['OKC Metro','Tulsa Metro']:[m]).map(x=>marketCard(x,all)).join('')}

function admiralCard(s,index){
 return `<article class="store-card qualitative"><div class="store-top"><span class="store-num">${String(index+1).padStart(2,'0')}</span><div><h3>Admiral</h3><small>Tulsa · Tulsa Metro</small></div><div class="rating">4.0 ★<small>23 públicas</small></div></div>
 <div class="coverage-row"><span><b>17</b>comentarios clasificados</span><span><b>58.8%</b>positivo textual</span><span><b>29.4%</b>negativo textual</span></div>
 <div class="store-mid"><div class="donut" style="--pos:${s.positive_pct*100};--neu:${s.neutral_pct*100}"><span>17<small>comentarios</small></span></div><div class="legend"><div><i class="p"></i><span>Positivo<small>10 comentarios</small></span><b>58.8%</b></div><div><i class="m"></i><span>Mixto<small>2 comentarios</small></span><b>11.8%</b></div><div><i class="n"></i><span>Negativo<small>5 comentarios</small></span><b>29.4%</b></div></div></div>
 <span class="coverage-badge estimate">Sentiment textual estimado</span>
 <div class="qual-note"><b>La calificación pública sí se incorpora</b>El 4.0★ sobre 23 calificaciones entra al rating ponderado de Tulsa y de cadena. El donut se calcula únicamente a partir del contenido de los 17 comentarios compartidos, porque no contamos con su estrella individual.</div>
 <details data-slug="admiral"><summary>Ver comentarios recientes</summary><div class="reviews-panel three"></div></details></article>`;
}
function storeCard(s,index){
 if(s.qualitative)return admiralCard(s,index);
 return `<article class="store-card"><div class="store-top"><span class="store-num">${String(index+1).padStart(2,'0')}</span><div><h3>${s.branch}</h3><small>${s.city} · ${s.market}</small></div><div class="rating">${s.rating.toFixed(1)} ★<small>${fmt.format(s.google_total)} públicas</small></div></div><div class="coverage-row"><span><b>${fmt.format(s.scraped_reviews)}</b>reviews analizadas</span><span><b>${(s.coverage*100).toFixed(1)}%</b>del contador público</span><span><b>${fmt.format(s.text_reviews)}</b>con texto</span></div><div class="store-mid"><div class="donut" style="--pos:${s.positive_pct*100};--neu:${s.neutral_pct*100}"><span>${fmt.format(s.scraped_reviews)}<small>reviews</small></span></div><div class="legend"><div><i class="p"></i><span>Positivo<small>${fmt.format(s.positive_n)} reviews</small></span><b>${pct(s.positive_n,s.scraped_reviews)}</b></div><div><i class="m"></i><span>Neutral<small>${fmt.format(s.neutral_n)} reviews</small></span><b>${pct(s.neutral_n,s.scraped_reviews)}</b></div><div><i class="n"></i><span>Negativo<small>${fmt.format(s.negative_n)} reviews</small></span><b>${pct(s.negative_n,s.scraped_reviews)}</b></div></div></div><div class="date-range">Periodo recuperado: ${s.first_date} → ${s.last_date}</div>${s.scraped_reviews===500?'<span class="coverage-badge warn">Extracción topada en 500</span>':''}<details data-slug="${s.slug}"><summary>Ver comentarios recientes</summary><div class="reviews-panel"></div></details></article>`;
}
function renderStores(arr){$('storeGrid').innerHTML=arr.length?arr.map(s=>storeCard(s,order.indexOf(s.branch))).join(''):'<div class="no-data">No hay sucursales con esta combinación de filtros.</div>';const active=['marketFilter','ratingFilter','negFilter'].filter(id=>$(id).value!=='all').length;$('filterStatus').textContent=`Mostrando ${arr.length} de 11 sucursales${active?' · '+active+' filtro'+(active===1?'':'s')+' activo'+(active===1?'':'s'):''}`;attachComments()}
function renderRanking(q){const rank=[...q].sort((a,b)=>b.positive_pct-a.positive_pct);$('rankList').innerHTML=rank.length?rank.map(s=>`<div class="rank-row"><span>${s.branch}</span><i><b style="width:${s.positive_pct*100}%"></b></i><strong>${(s.positive_pct*100).toFixed(1)}%</strong><small>${fmt.format(s.scraped_reviews)} reviews</small></div>`).join(''):'<div class="no-data">Sin sucursales cuantificadas para comparar.</div>'}

function aggregateListening(all){
 const topic={},term={};let text=0;
 all.forEach(s=>{
  const d=s.qualitative?admiralListening:listening[s.branch];if(!d)return;text+=d.text_reviews||0;
  Object.entries(d.topics||{}).forEach(([k,v])=>{topic[k]??={mentions:0,positive:0,neutral:0,negative:0};['mentions','positive','neutral','negative'].forEach(x=>topic[k][x]+=v[x]||0)});
  (d.terms||[]).forEach(v=>{term[v.term]??={mentions:0,positive:0,neutral:0,negative:0};['mentions','positive','neutral','negative'].forEach(x=>term[v.term][x]+=v[x]||0)});
 });
 return{topic,term,text};
}
function renderTopics(all){
 const a=aggregateListening(all),rows=Object.entries(a.topic).map(([topic,v])=>({topic,...v})).sort((x,y)=>y.mentions-x.mentions).slice(0,8);
 $('topicEyebrow').textContent=`${fmt.format(a.text)} comentarios con texto · selección activa`;
 $('topicGrid').innerHTML=rows.length?rows.map(t=>`<article class="topic-card"><div class="topic-head"><b>${t.topic}</b><span>${fmt.format(t.mentions)}</span></div><div class="topic-bar"><i class="p" style="width:${t.positive/t.mentions*100}%"></i><i class="m" style="width:${t.neutral/t.mentions*100}%"></i><i class="n" style="width:${t.negative/t.mentions*100}%"></i></div><small>${fmt.format(t.positive)} positivas · ${fmt.format(t.neutral)} mixtas/neutrales · ${fmt.format(t.negative)} negativas</small></article>`).join(''):'<div class="no-data">No hay texto suficiente para esta selección.</div>';
}
function buildConcepts(all){
 const a=aggregateListening(all),out={};
 const add=(label,v,source='topic')=>{out[label]??={label,mentions:0,positive:0,neutral:0,negative:0,sources:new Set};out[label].mentions+=v.mentions||0;out[label].positive+=v.positive||0;out[label].neutral+=v.neutral||0;out[label].negative+=v.negative||0;out[label].sources.add(source)};
 Object.entries(a.topic).forEach(([k,v])=>add(topicShort[k]||k,v,'tema'));
 Object.entries(a.term).forEach(([term,v])=>{const key=term.toLowerCase();if(skipTerms.has(key))return;const label=termMap[key];if(label&&!out[label])add(label,v,'término')});
 return{concepts:Object.values(out),text:a.text};
}
function renderCloud(all){
 const {concepts,text}=buildConcepts(all);
 const metric=x=>cloudMode==='positive'?x.positive:cloudMode==='negative'?x.negative:cloudMode==='neutral'?x.neutral:x.mentions;
 let rows=concepts.filter(x=>metric(x)>0).sort((a,b)=>metric(b)-metric(a)).slice(0,28);
 if(!rows.length){$('wordCloud').innerHTML='<div class="no-data">No hay conceptos suficientes para esta selección.</div>';$('cloudNote').textContent='';return}
 const max=Math.max(...rows.map(metric)),min=Math.min(...rows.map(metric));
 $('wordCloud').innerHTML=rows.map(t=>{
  const val=metric(t),size=17+(max===min?12:Math.sqrt((val-min)/(max-min))*36),neg=t.mentions?t.negative/t.mentions:0,pos=t.mentions?t.positive/t.mentions:0;
  const cls=cloudMode==='positive'?'positive':cloudMode==='negative'?'negative':cloudMode==='neutral'?'neutral':neg>=.28?'negative':pos>=.72?'positive':'neutral';
  return `<button class="${cls}" style="font-size:${size.toFixed(1)}px" title="${t.mentions} menciones · ${pct(t.positive,t.mentions)} positivo · ${pct(t.neutral,t.mentions)} mixto/neutral · ${pct(t.negative,t.mentions)} negativo">${esc(t.label)}</button>`;
 }).join('');
 const modeLabel={all:'balance total',positive:'menciones positivas',negative:'menciones negativas',neutral:'menciones mixtas/neutrales'}[cloudMode];
 $('cloudNote').textContent=`Nube normalizada por conceptos sobre ${fmt.format(text)} comentarios con texto. Vista: ${modeLabel}.`;
 document.querySelectorAll('#cloudControls button').forEach(b=>b.classList.toggle('active',b.dataset.mode===cloudMode));
}
function renderInsights(q,all){
 const cards=[];if(q.length){const t=totals(q),best=[...q].sort((a,b)=>b.positive_pct-a.positive_pct)[0],worst=[...q].sort((a,b)=>b.negative_pct-a.negative_pct)[0],a=aggregateListening(all),top=Object.entries(a.topic).sort((x,y)=>y[1].mentions-x[1].mentions)[0];
 cards.push([`El corpus cuantitativo visible es mayoritariamente ${t.pos/t.reviews>=.7?'positivo':'mixto'}`,`${pct(t.pos,t.reviews)} de las ${fmt.format(t.reviews)} reviews con estrella son 4–5★; ${pct(t.neg,t.reviews)} son 1–2★.`]);
 cards.push([`${best.branch} registra la mayor proporción positiva`,`${(best.positive_pct*100).toFixed(1)}% positivo sobre ${fmt.format(best.scraped_reviews)} reviews recuperadas.`]);
 cards.push([`${worst.branch} concentra la mayor proporción negativa`,`${(worst.negative_pct*100).toFixed(1)}% negativo sobre ${fmt.format(worst.scraped_reviews)} reviews recuperadas.`]);
 if(top)cards.push([`El tema más presente es “${top[0]}”`,`${fmt.format(top[1].mentions)} menciones dentro de la selección activa.`]);}
 const ad=all.find(s=>s.qualitative);if(ad)cards.push(['Admiral combina dos señales distintas','4.0★ sobre 23 calificaciones públicas; en 17 comentarios clasificados por texto, 58.8% son positivos, 11.8% mixtos y 29.4% negativos.']);
 $('insightGrid').innerHTML=cards.length?cards.map((x,i)=>`<article><span>${String(i+1).padStart(2,'0')}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join(''):'<div class="no-data">No hay datos para esta selección.</div>';
}
function reviewItem(x,cls){const star=x.stars?'★'.repeat(x.stars):(x.ratingLabel||'Sin rating individual');return `<article class="review-item ${cls}"><div class="review-meta"><span>${esc(x.date)}</span><span>${esc(star)}</span><span>${esc(x.reviewer)}</span></div><p>${esc(x.text)}</p><a href="${esc(x.url)}" target="_blank" rel="noopener">Abrir en Google ↗</a></article>`}
function attachComments(){
 document.querySelectorAll('details[data-slug]').forEach(d=>d.addEventListener('toggle',async()=>{
  if(!d.open||d.dataset.loaded==='1')return;const p=d.querySelector('.reviews-panel');p.innerHTML='<p>Cargando comentarios…</p>';
  try{const res=await fetch(`/google-reviews/data/comments/${d.dataset.slug}.json?v=20260819-6`);if(!res.ok)throw new Error(res.status);const data=await res.json(),pos=data.positive||[],mix=data.mixed||[],neg=data.negative||[];
   p.classList.toggle('three',mix.length>0);
   p.innerHTML=`<section><div class="review-title"><b>Positivos recientes</b><span>${pos.length}</span></div>${pos.length?pos.map(x=>reviewItem(x,'positive')).join(''):'<p>Sin positivos con texto.</p>'}</section>${mix.length?`<section><div class="review-title"><b>Mixtos recientes</b><span>${mix.length}</span></div>${mix.map(x=>reviewItem(x,'neutral')).join('')}</section>`:''}<section><div class="review-title"><b>Negativos recientes</b><span>${neg.length}</span></div>${neg.length?neg.map(x=>reviewItem(x,'negative')).join(''):'<p>Sin negativos con texto.</p>'}</section>`;
   d.dataset.loaded='1';
  }catch(e){p.innerHTML='<p>No se pudieron cargar los comentarios recientes.</p>'}
 }))
}
function applyFilters(){
 const all=selectedAll(),q=all.filter(s=>!s.qualitative);renderKPIs(q,all);renderMarkets(all);renderStores(all);renderRanking(q);renderTopics(all);renderCloud(all);renderInsights(q,all);
 const active=['marketFilter','ratingFilter','negFilter'].filter(id=>$(id).value!=='all').length;$('resetFilters').textContent=active?`Restablecer (${active})`:'Restablecer';
}
async function init(){
 try{
  const [s,l]=await Promise.all([fetch('/google-reviews/data/summary.json?v=20260819-6').then(r=>{if(!r.ok)throw new Error('summary');return r.json()}),fetch('/google-reviews/data/listening-mini.json?v=20260819-6').then(r=>{if(!r.ok)throw new Error('listening');return r.json()})]);
  listening=l.stores;stores=s.stores.map(x=>({...x,qualitative:false}));stores.push(admiral);stores.sort((a,b)=>order.indexOf(a.branch)-order.indexOf(b.branch));
  ['marketFilter','ratingFilter','negFilter'].forEach(id=>$(id).addEventListener('change',applyFilters));$('resetFilters').addEventListener('click',()=>{['marketFilter','ratingFilter','negFilter'].forEach(id=>$(id).value='all');applyFilters()});
  $('cloudControls').addEventListener('click',e=>{const b=e.target.closest('button[data-mode]');if(!b)return;cloudMode=b.dataset.mode;renderCloud(selectedAll())});
  applyFilters();
 }catch(e){$('kpis').innerHTML='<div class="no-data">No se pudo cargar la base procesada. Recarga la página o revisa la ruta de datos.</div>';console.error(e)}
}
init();