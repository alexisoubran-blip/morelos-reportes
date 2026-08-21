(() => {
  'use strict';

  const EXPECTED_PAID = [
    ['Meta', '#1877F2'],
    ['Google', '#0d7b4b'],
    ['YouTube / CTV', '#FF0033'],
    ['TikTok', '#111111']
  ];
  const OFFLINE_CHANNELS = ['TV','Radio','Streaming Radio'];
  let REVIEW_DATA = [];
  let OFFLINE_DATA = [];
  let PAID_DATA = [];
  let CAMPAIGNS_EXPANDED = false;

  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const integer = v => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Number(v)||0);
  const compact = v => { const n=Number(v)||0; if(Math.abs(n)>=1e6)return `${(n/1e6).toFixed(2).replace(/\.00$/,'')}M`; if(Math.abs(n)>=1e3)return `${(n/1e3).toFixed(n>=1e5?0:1).replace(/\.0$/,'')}K`; return integer(n); };
  const exact = (v,d=2) => Number(v || 0).toFixed(d);
  const pct = (v,d=1) => `${(Number(v || 0) * 100).toFixed(d)}%`;
  const money = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(v || 0));
  const parseDate = s => new Date(`${s}T12:00:00`);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  function ensureSelectOption(select, value, label=value) {
    if (!select || [...select.options].some(o => o.value === value)) return;
    const option = document.createElement('option'); option.value=value; option.textContent=label; select.appendChild(option);
  }

  function ensureFutureChannels() {
    const select=document.getElementById('channel-filter'); if(!select)return;
    EXPECTED_PAID.forEach(([name])=>ensureSelectOption(select,name));
    ensureSelectOption(select,'Spotify');
    OFFLINE_CHANNELS.forEach(name=>ensureSelectOption(select,name));
  }

  function mutedPlatformCard(name,color) {
    return `<div class="platform-card muted-platform future-platform" data-future-platform="${esc(name)}" style="border-top:4px solid ${color}"><div class="platform-top"><h4>${esc(name)}</h4><span class="status-chip muted">Preparado</span></div><div class="platform-value">—</div><p>Sin data en 03_PAID_MEDIA para el periodo seleccionado.</p></div>`;
  }

  function ensurePaidPlaceholders() {
    const wrap=document.getElementById('platform-performance'), select=document.getElementById('channel-filter');
    if(!wrap||!select)return;
    const selected=select.value||'all', futureCards=()=>[...wrap.querySelectorAll('.future-platform')];
    const realText=()=>[...wrap.children].filter(el=>!el.classList.contains('future-platform')).map(el=>el.textContent||'').join(' ');
    if(OFFLINE_CHANNELS.includes(selected)){ futureCards().forEach(el=>el.remove()); return; }
    if(selected==='all'){
      const text=realText();
      EXPECTED_PAID.forEach(([name,color])=>{
        const existing=futureCards().find(el=>el.dataset.futurePlatform===name);
        if(text.includes(name)){ if(existing)existing.remove(); return; }
        if(!existing)wrap.insertAdjacentHTML('beforeend',mutedPlatformCard(name,color));
      });
      return;
    }
    const expected=EXPECTED_PAID.find(([name])=>name===selected); if(!expected)return;
    const hasReal=realText().includes(expected[0])&&!wrap.querySelector('.empty-state');
    const existing=futureCards().find(el=>el.dataset.futurePlatform===expected[0]);
    futureCards().filter(el=>el.dataset.futurePlatform!==expected[0]).forEach(el=>el.remove());
    if(hasReal){ if(existing)existing.remove(); return; }
    if(!existing){ const emptyState=wrap.querySelector('.empty-state'); if(emptyState)emptyState.remove(); wrap.insertAdjacentHTML('beforeend',mutedPlatformCard(expected[0],expected[1])); }
  }

  function ensureSocialTikTokTab(){
    const tabs=document.getElementById('social-platform-tabs'); if(!tabs)return;
    if(![...tabs.querySelectorAll('button[data-platform]')].some(b=>b.dataset.platform==='TikTok')){
      const b=document.createElement('button'); b.type='button'; b.dataset.platform='TikTok'; b.textContent='TikTok'; tabs.appendChild(b);
    }
  }

  function activeRange(){
    const mode=document.querySelector('#period-mode button.active')?.dataset.mode||'months';
    if(mode==='week'){
      const start=parseDate(document.getElementById('week-select')?.value||'2026-06-01'), end=new Date(start); end.setDate(end.getDate()+6); return {start,end,label:`${iso(start)} → ${iso(end)}`,mode};
    }
    if(mode==='month'){
      const value=document.getElementById('month-select')?.value||'2026-07', [y,m]=value.split('-').map(Number); return {start:new Date(y,m-1,1,12),end:new Date(y,m,0,12),label:value,mode};
    }
    let from=document.getElementById('from-month')?.value||'2026-06', to=document.getElementById('to-month')?.value||'2026-07'; if(from>to)[from,to]=[to,from];
    const [fy,fm]=from.split('-').map(Number), [ty,tm]=to.split('-').map(Number); return {start:new Date(fy,fm-1,1,12),end:new Date(ty,tm,0,12),label:from===to?from:`${from} → ${to}`,mode};
  }

  function selectedCampaign(){ return document.getElementById('campaign-filter')?.value||'all'; }
  function selectedChannel(){ return document.getElementById('channel-filter')?.value||'all'; }

  function paidRows(range){
    const campaign=selectedCampaign(), channel=selectedChannel();
    return PAID_DATA.filter(r=>{
      const d=parseDate(r.date);
      const channelOk=channel==='all'||r.platform===channel;
      return d>=range.start&&d<=range.end&&(campaign==='all'||r.campaign_tag===campaign)&&channelOk;
    });
  }

  function offlineRows(range){
    if(range.mode==='week')return [];
    const campaign=selectedCampaign(), channel=selectedChannel();
    return OFFLINE_DATA.filter(r=>{
      const d=parseDate(`${r.month}-01`), start=new Date(range.start.getFullYear(),range.start.getMonth(),1,12), end=new Date(range.end.getFullYear(),range.end.getMonth(),1,12);
      const channelOk=channel==='all'||r.medium===channel;
      return d>=start&&d<=end&&(campaign==='all'||r.campaign_tag===campaign)&&channelOk;
    });
  }

  function reviewRows(range){ return REVIEW_DATA.filter(r=>{const d=parseDate(r.date); return d>=range.start&&d<=range.end;}); }

  function rankRows(rows,formatter=integer){
    if(!rows.length)return '<div class="empty-state">Sin datos para este periodo.</div>';
    const max=Math.max(...rows.map(r=>r.value),1);
    return rows.map(r=>`<div class="rank-row"><div class="rank-label" title="${esc(r.name)}">${esc(r.name)}</div><div class="rank-track"><div class="rank-fill" data-tooltip="${esc(`${r.name}: ${formatter(r.value)}`)}" style="width:${r.value/max*100}%"></div></div><div class="rank-value">${formatter(r.value)}</div></div>`).join('');
  }

  function filterSupport(items){ return `<div class="filter-support">${items.map(([label,state])=>`<span class="support-${state}">${esc(label)} ${state==='yes'?'✓':state==='partial'?'△':'—'}</span>`).join('')}</div>`; }

  function ensureStaticFilterSupport(){
    const specs={overview:[['Tiempo','yes'],['Campaña','yes'],['Canal','yes']],performance:[['Tiempo','yes'],['Campaña','yes'],['Canal','yes']],social:[['Tiempo','yes'],['Campaña','yes'],['Red','yes']],analytics:[['Tiempo','partial'],['Campaña','partial'],['Canal','no']]};
    Object.entries(specs).forEach(([id,items])=>{
      const section=document.getElementById(id), heading=section?.querySelector('.section-heading'); if(!heading||heading.querySelector('.filter-support'))return;
      heading.insertAdjacentHTML('beforeend',filterSupport(items));
    });
  }

  function renderOverviewEnhancements(){
    if(!PAID_DATA.length||!OFFLINE_DATA.length)return;
    const section=document.getElementById('overview'); if(!section)return;
    const range=activeRange(), paid=paidRows(range), offline=offlineRows(range);
    const paidSpend=paid.reduce((s,r)=>s+(Number(r.spend)||0),0), offlineSpend=offline.reduce((s,r)=>s+(Number(r.actual_spend)||0),0), total=paidSpend+offlineSpend;
    const tags=new Set([...paid.map(r=>r.campaign_tag),...offline.map(r=>r.campaign_tag)].filter(Boolean));

    const grid=section.querySelector('.kpi-grid');
    if(grid){
      grid.classList.remove('kpi-grid-2'); grid.classList.add('kpi-grid-4','marketing-overview-kpis');
      const totalCard=document.getElementById('kpi-spend')?.closest('.kpi-card');
      if(totalCard){ totalCard.querySelector('span').textContent='Marketing investment'; document.getElementById('kpi-spend').textContent=money(total); document.getElementById('kpi-spend-note').textContent=range.mode==='week'?'Paid only · Offline disponible a grain mensual':'Paid + Offline'; }
      if(!document.getElementById('kpi-paid-spend')){
        const campaignCard=document.getElementById('kpi-campaigns')?.closest('.kpi-card');
        campaignCard?.insertAdjacentHTML('beforebegin',`<article class="kpi-card"><span>Paid Media</span><strong id="kpi-paid-spend">—</strong><small>03_PAID_MEDIA</small></article><article class="kpi-card"><span>Offline Media</span><strong id="kpi-offline-spend">—</strong><small>09_OFFLINE_MEDIA</small></article>`);
      }
      const paidEl=document.getElementById('kpi-paid-spend'), offEl=document.getElementById('kpi-offline-spend'); if(paidEl)paidEl.textContent=money(paidSpend); if(offEl)offEl.textContent=range.mode==='week'?'—':money(offlineSpend);
      const campEl=document.getElementById('kpi-campaigns'); if(campEl)campEl.textContent=integer(tags.size);
      const campCard=document.getElementById('kpi-campaigns')?.closest('.kpi-card'); if(campCard){ campCard.querySelector('span').textContent='Campaign Tags activos'; campCard.querySelector('small').textContent='Paid + Offline bajo el filtro actual'; }
    }

    const paidPanel=section.querySelector('#campaign-split')?.closest('.panel');
    if(paidPanel){ const h=paidPanel.querySelector('h3'); if(h)h.textContent='Split de inversión Paid por Campaign_Tag'; }
    let panel=document.getElementById('marketing-allocation-panel');
    if(!panel&&paidPanel){
      paidPanel.insertAdjacentHTML('afterend',`<article class="panel" id="marketing-allocation-panel"><div class="panel-head"><div><span class="panel-kicker">Capital total</span><h3>Marketing allocation por Campaign_Tag</h3></div><span class="status-chip">Paid + Offline</span></div><div id="marketing-allocation" class="rank-list"></div></article>`);
      panel=document.getElementById('marketing-allocation-panel');
    }
    const map=new Map(); paid.forEach(r=>map.set(r.campaign_tag,(map.get(r.campaign_tag)||0)+(Number(r.spend)||0))); offline.forEach(r=>map.set(r.campaign_tag,(map.get(r.campaign_tag)||0)+(Number(r.actual_spend)||0)));
    const rows=[...map.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    const out=document.getElementById('marketing-allocation'); if(out)out.innerHTML=rankRows(rows,money);
  }

  function trimCampaignCards(){
    const wrap=document.getElementById('campaign-cards'); if(!wrap)return;
    const cards=[...wrap.querySelectorAll('.campaign-card')];
    cards.forEach((card,i)=>{card.style.display=(CAMPAIGNS_EXPANDED||i<6)?'':'none';});
    let btn=document.getElementById('campaign-toggle');
    if(cards.length<=6){ if(btn)btn.remove(); return; }
    if(!btn){ btn=document.createElement('button'); btn.type='button'; btn.id='campaign-toggle'; btn.className='secondary-toggle'; wrap.insertAdjacentElement('afterend',btn); btn.onclick=()=>{CAMPAIGNS_EXPANDED=!CAMPAIGNS_EXPANDED; trimCampaignCards();}; }
    btn.textContent=CAMPAIGNS_EXPANDED?'Ver menos':`Ver todas (${cards.length})`;
  }

  function renderReviews(){
    const section=document.getElementById('listening'); if(!section||!REVIEW_DATA.length)return;
    const range=activeRange(), rows=reviewRows(range), total=rows.length, avg=total?rows.reduce((s,r)=>s+(Number(r.rating)||0),0)/total:null, withText=rows.reduce((s,r)=>s+(Number(r.has_text)||0),0);
    const sentiment={Positive:0,Neutral:0,Negative:0}, stars={1:0,2:0,3:0,4:0,5:0}, topics=new Map(), stores=new Map();
    rows.forEach(r=>{if(sentiment[r.sentiment]!=null)sentiment[r.sentiment]++; const star=Math.round(Number(r.rating)||0); if(stars[star]!=null)stars[star]++; [r.topic_primary,r.topic_secondary].filter(Boolean).filter(t=>t!=='Otros').forEach(t=>topics.set(t,(topics.get(t)||0)+1)); stores.set(r.store,(stores.get(r.store)||0)+1);});
    const topicRows=[...topics.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,8), storeRows=[...stores.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10);
    section.innerHTML=`<div class="section-heading"><div><p class="eyebrow">04 · LISTENING</p><h2>Google Reviews</h2></div><p class="section-note">Fuente: 08_REVIEWS. Responde al filtro de tiempo; no existe atribución de Campaign_Tag para reseñas.</p>${filterSupport([['Tiempo','yes'],['Campaña','no'],['Canal','no']])}</div>
    <div class="kpi-grid kpi-grid-4"><article class="kpi-card"><span>Reviews del periodo</span><strong>${total?integer(total):'—'}</strong><small>Publicadas dentro del rango</small></article><article class="kpi-card"><span>Rating promedio</span><strong>${avg==null?'—':exact(avg,2)}</strong><small>Promedio simple de estrellas</small></article><article class="kpi-card"><span>Reviews con texto</span><strong>${total?integer(withText):'—'}</strong><small>${total?pct(withText/total):'—'} del periodo</small></article><article class="kpi-card"><span>Sentimiento positivo</span><strong>${total?pct(sentiment.Positive/total):'—'}</strong><small>4–5★ Positive · 3★ Neutral · 1–2★ Negative</small></article></div>
    <div class="analytics-grid"><article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Rating</span><h3>Distribución por estrellas</h3></div><span class="status-chip">${esc(range.label)}</span></div><div class="rank-list">${rankRows([5,4,3,2,1].map(s=>({name:`${s}★`,value:stars[s]})))}</div></article><article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Sentiment</span><h3>Lectura por rating</h3></div></div><div class="rank-list">${rankRows([{name:'Positive',value:sentiment.Positive},{name:'Neutral',value:sentiment.Neutral},{name:'Negative',value:sentiment.Negative}])}</div></article></div>
    <div class="analytics-grid"><article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Temas</span><h3>Conceptos dominantes</h3></div><span class="status-chip muted">Heurística keyword</span></div><div class="rank-list">${rankRows(topicRows)}</div><p class="micro-note">Clasificación descriptiva por keywords, no modelo NLP.</p></article><article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Sucursales</span><h3>Volumen de reviews</h3></div></div><div class="rank-list">${rankRows(storeRows)}</div></article></div>`;
  }

  function renderOffline(){
    const section=document.getElementById('offline'); if(!section||!OFFLINE_DATA.length)return;
    const range=activeRange();
    if(range.mode==='week'){
      section.innerHTML=`<div class="section-heading"><div><p class="eyebrow">05 · OFFLINE</p><h2>Offline Media</h2></div><p class="section-note">Fuente: 09_OFFLINE_MEDIA. El postbuy tiene grain mensual; no se distribuye artificialmente por semana.</p>${filterSupport([['Mes','yes'],['Campaña','yes'],['Canal','yes'],['Semana','no']])}</div><article class="panel placeholder-panel"><div class="empty-state">Disponible por mes o rango de meses.</div></article>`; return;
    }
    const rows=offlineRows(range), total=rows.reduce((s,r)=>s+(Number(r.actual_spend)||0),0), spots=rows.reduce((s,r)=>s+(Number(r.spots)||0),0), paidSpots=rows.reduce((s,r)=>s+(Number(r.paid_spots)||0),0), bonusSpots=rows.reduce((s,r)=>s+(Number(r.bonus_spots)||0),0), impressions=rows.reduce((s,r)=>s+(Number(r.impressions)||0),0);
    const mediumMap=new Map(), campaignMap=new Map(); rows.forEach(r=>{mediumMap.set(r.medium,(mediumMap.get(r.medium)||0)+(Number(r.actual_spend)||0)); campaignMap.set(r.campaign_tag,(campaignMap.get(r.campaign_tag)||0)+(Number(r.actual_spend)||0));});
    const tv=mediumMap.get('TV')||0, radio=mediumMap.get('Radio')||0, streaming=mediumMap.get('Streaming Radio')||0, mediumRows=[...mediumMap.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value), campaignRows=[...campaignMap.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    section.innerHTML=`<div class="section-heading"><div><p class="eyebrow">05 · OFFLINE</p><h2>Offline Media</h2></div><p class="section-note">Fuente: 09_OFFLINE_MEDIA · postbuy TV/Radio/Streaming. Paid y bonus spots están separados para lectura de eficiencia.</p>${filterSupport([['Mes','yes'],['Campaña','yes'],['Canal','yes'],['Semana','no']])}</div>
    <div class="kpi-grid kpi-grid-4 offline-kpis"><article class="kpi-card"><span>Inversión offline</span><strong>${rows.length?money(total):'—'}</strong><small>TV + Radio + Streaming</small></article><article class="kpi-card"><span>TV</span><strong>${rows.length?money(tv):'—'}</strong><small>Inversión registrada</small></article><article class="kpi-card"><span>Radio</span><strong>${rows.length?money(radio):'—'}</strong><small>Radio terrestre</small></article><article class="kpi-card"><span>Streaming</span><strong>${rows.length?money(streaming):'—'}</strong><small>iHeart streaming</small></article><article class="kpi-card"><span>Paid spots</span><strong>${rows.length?integer(paidSpots):'—'}</strong><small>Spots comprados</small></article><article class="kpi-card"><span>Bonus spots</span><strong>${rows.length?integer(bonusSpots):'—'}</strong><small>${paidSpots+bonusSpots?pct(bonusSpots/(paidSpots+bonusSpots)):'—'} del inventario</small></article><article class="kpi-card"><span>Total spots</span><strong>${rows.length?integer(spots):'—'}</strong><small>Paid + bonus</small></article><article class="kpi-card"><span>Streaming impressions</span><strong>${rows.length?integer(impressions):'—'}</strong><small>Solo donde la fuente reporta impressions</small></article></div>
    <div class="analytics-grid"><article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Media mix</span><h3>Inversión por medio</h3></div><span class="status-chip">${esc(range.label)}</span></div><div class="rank-list">${rankRows(mediumRows,money)}</div></article><article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Campaign_Tag</span><h3>Inversión offline por campaña</h3></div></div><div class="rank-list">${rankRows(campaignRows,money)}</div></article></div>`;
  }

  function renderExecutiveInsights(){
    const box=document.getElementById('insights-grid'); if(!box||!PAID_DATA.length||!OFFLINE_DATA.length)return;
    const range=activeRange(), paid=paidRows(range), offline=offlineRows(range), paidSpend=paid.reduce((s,r)=>s+(Number(r.spend)||0),0), offSpend=offline.reduce((s,r)=>s+(Number(r.actual_spend)||0),0), total=paidSpend+offSpend;
    const map=new Map(); paid.forEach(r=>map.set(r.campaign_tag,(map.get(r.campaign_tag)||0)+(Number(r.spend)||0))); offline.forEach(r=>map.set(r.campaign_tag,(map.get(r.campaign_tag)||0)+(Number(r.actual_spend)||0)));
    const top=[...map.entries()].sort((a,b)=>b[1]-a[1])[0];
    const paidSpots=offline.reduce((s,r)=>s+(Number(r.paid_spots)||0),0), bonus=offline.reduce((s,r)=>s+(Number(r.bonus_spots)||0),0);
    const reviews=reviewRows(range), pos=reviews.filter(r=>r.sentiment==='Positive').length;
    const items=[];
    if(total>0&&range.mode!=='week')items.push({t:'Capital mix',b:`Offline representa ${pct(offSpend/total)} de la inversión de marketing del filtro actual (${money(offSpend)} de ${money(total)}).`});
    if(top)items.push({t:'Campaña con mayor capital',b:`${top[0]} concentra ${money(top[1])}${total?` (${pct(top[1]/total)})`:''} combinando Paid + Offline.`});
    if(paidSpots+bonus>0)items.push({t:'Valor de bonificación offline',b:`${integer(bonus)} bonus spots equivalen a ${pct(bonus/(paidSpots+bonus))} del inventario TV/Radio del filtro actual.`});
    if(reviews.length)items.push({t:'Señal de reputación',b:`${pct(pos/reviews.length)} de las ${integer(reviews.length)} reviews del periodo son positivas por rating.`});
    box.innerHTML=items.slice(0,4).map((r,i)=>`<article class="insight-card"><b>0${i+1}</b><h3>${esc(r.t)}</h3><p>${esc(r.b)}</p></article>`).join('');
  }

  function refreshFutureUi(){
    ensureFutureChannels(); ensurePaidPlaceholders(); ensureSocialTikTokTab(); ensureStaticFilterSupport(); renderOverviewEnhancements(); trimCampaignCards(); renderReviews(); renderOffline(); renderExecutiveInsights();
  }

  async function loadData(){
    try{
      const [reviewRes,offlineRes,paidRes]=await Promise.all(['./data/reviews-v2.json','./data/offline-v2.json','./data/paid-v2.json'].map(u=>fetch(u,{cache:'no-store'})));
      const [reviews,offline,paid]=await Promise.all([reviewRes.json(),offlineRes.json(),paidRes.json()]);
      REVIEW_DATA=(reviews.rows||[]).map(a=>Object.fromEntries((reviews.schema||[]).map((f,i)=>[f,a[i]])));
      OFFLINE_DATA=(offline.rows||[]).map(a=>Object.fromEntries((offline.schema||[]).map((f,i)=>[f,a[i]])));
      PAID_DATA=(paid.rows||[]).map(a=>Object.fromEntries((paid.schema||[]).map((f,i)=>[f,a[i]])));
      refreshFutureUi();
    }catch(err){ console.error('No se pudo cargar la capa future-ready',err); }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    loadData(); refreshFutureUi();
    const observer=new MutationObserver(()=>requestAnimationFrame(refreshFutureUi));
    ['platform-performance','social-platform-tabs','period-controls','campaign-cards','campaign-split'].forEach(id=>{const el=document.getElementById(id); if(el)observer.observe(el,{childList:true,subtree:true});});
    document.addEventListener('change',e=>{if(e.target.closest?.('#period-controls,#campaign-filter,#channel-filter'))requestAnimationFrame(refreshFutureUi);});
    document.getElementById('period-mode')?.addEventListener('click',()=>setTimeout(refreshFutureUi,0));
    document.getElementById('reset-filters')?.addEventListener('click',()=>setTimeout(()=>{CAMPAIGNS_EXPANDED=false; refreshFutureUi();},0));
  });
})();