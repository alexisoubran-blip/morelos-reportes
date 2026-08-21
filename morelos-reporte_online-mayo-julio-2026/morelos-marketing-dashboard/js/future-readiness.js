(() => {
  'use strict';

  const EXPECTED_PAID = [
    ['Meta', '#1877F2'],
    ['Google', '#0d7b4b'],
    ['YouTube / CTV', '#FF0033'],
    ['TikTok', '#111111']
  ];
  let REVIEW_DATA = [];
  let OFFLINE_DATA = [];

  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const integer = v => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(v || 0);
  const exact = (v,d=2) => Number(v || 0).toFixed(d);
  const pct = (v,d=1) => `${(Number(v || 0) * 100).toFixed(d)}%`;
  const money = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(v || 0));
  const parseDate = s => new Date(`${s}T12:00:00`);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  function ensureSelectOption(select, value, label=value) {
    if (!select || [...select.options].some(o => o.value === value)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  function ensureFutureChannels() {
    const select = document.getElementById('channel-filter');
    if (!select) return;
    EXPECTED_PAID.forEach(([name]) => ensureSelectOption(select, name));
    ensureSelectOption(select, 'Spotify');
  }

  function mutedPlatformCard(name, color) {
    return `<div class="platform-card muted-platform future-platform" data-future-platform="${esc(name)}" style="border-top:4px solid ${color}">
      <div class="platform-top"><h4>${esc(name)}</h4><span class="status-chip muted">Preparado</span></div>
      <div class="platform-value">—</div>
      <p>Sin data en 03_PAID_MEDIA para el periodo seleccionado.</p>
    </div>`;
  }

  function ensurePaidPlaceholders() {
    const wrap = document.getElementById('platform-performance');
    const select = document.getElementById('channel-filter');
    if (!wrap || !select) return;
    const selected = select.value || 'all';
    const futureCards = () => [...wrap.querySelectorAll('.future-platform')];
    const realText = () => [...wrap.children].filter(el=>!el.classList.contains('future-platform')).map(el=>el.textContent||'').join(' ');

    if (selected === 'all') {
      const text = realText();
      EXPECTED_PAID.forEach(([name, color]) => {
        const existing = futureCards().find(el=>el.dataset.futurePlatform===name);
        if (text.includes(name)) { if (existing) existing.remove(); return; }
        if (!existing) wrap.insertAdjacentHTML('beforeend', mutedPlatformCard(name, color));
      });
      return;
    }

    const expected = EXPECTED_PAID.find(([name]) => name === selected);
    if (!expected) return;
    const hasReal = realText().includes(expected[0]) && !wrap.querySelector('.empty-state');
    const existing = futureCards().find(el=>el.dataset.futurePlatform===expected[0]);
    futureCards().filter(el=>el.dataset.futurePlatform!==expected[0]).forEach(el=>el.remove());
    if (hasReal) { if (existing) existing.remove(); return; }
    if (!existing) {
      const emptyState=wrap.querySelector('.empty-state'); if(emptyState) emptyState.remove();
      wrap.insertAdjacentHTML('beforeend', mutedPlatformCard(expected[0], expected[1]));
    }
  }

  function ensureSocialTikTokTab() {
    const tabs = document.getElementById('social-platform-tabs');
    if (!tabs) return;
    if (![...tabs.querySelectorAll('button[data-platform]')].some(b => b.dataset.platform === 'TikTok')) {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.platform = 'TikTok'; b.textContent = 'TikTok'; tabs.appendChild(b);
    }
  }

  function activeRange() {
    const mode = document.querySelector('#period-mode button.active')?.dataset.mode || 'months';
    if (mode === 'week') {
      const start = parseDate(document.getElementById('week-select')?.value || '2026-06-01');
      const end = new Date(start); end.setDate(end.getDate()+6);
      return {start,end,label:`${iso(start)} → ${iso(end)}`,mode};
    }
    if (mode === 'month') {
      const value = document.getElementById('month-select')?.value || '2026-07';
      const [y,m] = value.split('-').map(Number);
      return {start:new Date(y,m-1,1,12),end:new Date(y,m,0,12),label:value,mode};
    }
    let from = document.getElementById('from-month')?.value || '2026-06';
    let to = document.getElementById('to-month')?.value || '2026-07';
    if (from > to) [from,to] = [to,from];
    const [fy,fm] = from.split('-').map(Number), [ty,tm] = to.split('-').map(Number);
    return {start:new Date(fy,fm-1,1,12),end:new Date(ty,tm,0,12),label:from===to?from:`${from} → ${to}`,mode};
  }

  function reviewRows(range) {
    return REVIEW_DATA.filter(r => { const d=parseDate(r.date); return d>=range.start && d<=range.end; });
  }

  function offlineRows(range) {
    if (range.mode === 'week') return [];
    const campaign = document.getElementById('campaign-filter')?.value || 'all';
    return OFFLINE_DATA.filter(r => {
      const d=parseDate(`${r.month}-01`);
      return d>=new Date(range.start.getFullYear(),range.start.getMonth(),1,12) &&
        d<=new Date(range.end.getFullYear(),range.end.getMonth(),1,12) &&
        (campaign==='all' || r.campaign_tag===campaign);
    });
  }

  function rankRows(rows, formatter=integer) {
    if (!rows.length) return '<div class="empty-state">Sin datos para este periodo.</div>';
    const max = Math.max(...rows.map(r=>r.value),1);
    return rows.map(r=>`<div class="rank-row">
      <div class="rank-label" title="${esc(r.name)}">${esc(r.name)}</div>
      <div class="rank-track"><div class="rank-fill" data-tooltip="${esc(`${r.name}: ${formatter(r.value)}`)}" style="width:${r.value/max*100}%"></div></div>
      <div class="rank-value">${formatter(r.value)}</div>
    </div>`).join('');
  }

  function renderReviews() {
    const section = document.getElementById('listening');
    if (!section || !REVIEW_DATA.length) return;
    const range = activeRange(), rows = reviewRows(range), total=rows.length;
    const avg = total ? rows.reduce((s,r)=>s+(Number(r.rating)||0),0)/total : null;
    const withText = rows.reduce((s,r)=>s+(Number(r.has_text)||0),0);
    const sentiment = {Positive:0,Neutral:0,Negative:0};
    const stars = {1:0,2:0,3:0,4:0,5:0};
    const topics = new Map(), stores = new Map();
    rows.forEach(r=>{
      if (sentiment[r.sentiment] != null) sentiment[r.sentiment]++;
      const star=Math.round(Number(r.rating)||0); if (stars[star] != null) stars[star]++;
      [r.topic_primary,r.topic_secondary].filter(Boolean).filter(t=>t!=='Otros').forEach(t=>topics.set(t,(topics.get(t)||0)+1));
      stores.set(r.store,(stores.get(r.store)||0)+1);
    });
    const topicRows=[...topics.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,8);
    const storeRows=[...stores.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10);
    const campaignActive=(document.getElementById('campaign-filter')?.value||'all')!=='all';
    section.innerHTML=`
      <div class="section-heading">
        <div><p class="eyebrow">04 · LISTENING</p><h2>Google Reviews</h2></div>
        <p class="section-note">Fuente: 08_REVIEWS · Google Maps Reviews Scraper. Responde al filtro de tiempo; Reviews no tiene Campaign_Tag.${campaignActive?' El filtro de campaña se ignora en este módulo.':''}</p>
      </div>
      <div class="kpi-grid kpi-grid-4">
        <article class="kpi-card"><span>Reviews del periodo</span><strong>${total?integer(total):'—'}</strong><small>Reviews publicados dentro del rango</small></article>
        <article class="kpi-card"><span>Rating promedio</span><strong>${avg==null?'—':exact(avg,2)}</strong><small>Promedio simple de estrellas</small></article>
        <article class="kpi-card"><span>Reviews con texto</span><strong>${total?integer(withText):'—'}</strong><small>${total?pct(withText/total):'—'} del periodo</small></article>
        <article class="kpi-card"><span>Sentimiento positivo</span><strong>${total?pct(sentiment.Positive/total):'—'}</strong><small>4–5★ = Positive · 3★ = Neutral · 1–2★ = Negative</small></article>
      </div>
      <div class="analytics-grid">
        <article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Rating</span><h3>Distribución por estrellas</h3></div><span class="status-chip">${esc(range.label)}</span></div><div class="rank-list">${rankRows([5,4,3,2,1].map(s=>({name:`${s}★`,value:stars[s]})))}</div></article>
        <article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Sentiment</span><h3>Lectura por rating</h3></div></div><div class="rank-list">${rankRows([{name:'Positive',value:sentiment.Positive},{name:'Neutral',value:sentiment.Neutral},{name:'Negative',value:sentiment.Negative}])}</div></article>
      </div>
      <div class="analytics-grid">
        <article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Temas</span><h3>Conceptos dominantes</h3></div><span class="status-chip muted">Heurística keyword</span></div><div class="rank-list">${rankRows(topicRows)}</div><p class="micro-note">Los topics se asignan por keywords sobre el texto de la reseña; sirven como clasificación descriptiva, no como modelo de NLP.</p></article>
        <article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Sucursales</span><h3>Volumen de reviews</h3></div></div><div class="rank-list">${rankRows(storeRows)}</div></article>
      </div>`;
  }

  function renderOffline() {
    const section=document.getElementById('offline');
    if(!section || !OFFLINE_DATA.length) return;
    const range=activeRange();
    if(range.mode==='week'){
      section.innerHTML=`<div class="section-heading"><div><p class="eyebrow">05 · OFFLINE</p><h2>Offline Media</h2></div><p class="section-note">Fuente: 09_OFFLINE_MEDIA. El postbuy recibido tiene grain mensual, por lo que no se distribuye artificialmente por semana.</p></div><article class="panel placeholder-panel"><div class="empty-state">Disponible por mes o rango de meses. Selecciona “Mes” o “Meses” para ver TV, Radio y Streaming.</div></article>`;
      return;
    }
    const rows=offlineRows(range);
    const total=rows.reduce((s,r)=>s+(Number(r.actual_spend)||0),0);
    const spots=rows.reduce((s,r)=>s+(Number(r.spots)||0),0);
    const impressions=rows.reduce((s,r)=>s+(Number(r.impressions)||0),0);
    const mediumMap=new Map(), campaignMap=new Map();
    rows.forEach(r=>{
      mediumMap.set(r.medium,(mediumMap.get(r.medium)||0)+(Number(r.actual_spend)||0));
      campaignMap.set(r.campaign_tag,(campaignMap.get(r.campaign_tag)||0)+(Number(r.actual_spend)||0));
    });
    const tv=mediumMap.get('TV')||0, radio=mediumMap.get('Radio')||0, streaming=mediumMap.get('Streaming Radio')||0;
    const mediumRows=[...mediumMap.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    const campaignRows=[...campaignMap.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    const campaign=document.getElementById('campaign-filter')?.value||'all';
    section.innerHTML=`
      <div class="section-heading"><div><p class="eyebrow">05 · OFFLINE</p><h2>Offline Media</h2></div><p class="section-note">Fuente: 09_OFFLINE_MEDIA · postbuy TV/Radio. Responde a tiempo y Campaign_Tag.${campaign!=='all'?` Filtro actual: ${esc(campaign)}.`:''} Spots incluyen bonificaciones registradas por la fuente.</p></div>
      <div class="kpi-grid kpi-grid-3">
        <article class="kpi-card"><span>Inversión offline</span><strong>${rows.length?money(total):'—'}</strong><small>TV + Radio + Streaming</small></article>
        <article class="kpi-card"><span>TV</span><strong>${rows.length?money(tv):'—'}</strong><small>Inversión registrada</small></article>
        <article class="kpi-card"><span>Radio</span><strong>${rows.length?money(radio):'—'}</strong><small>Radio terrestre</small></article>
        <article class="kpi-card"><span>Streaming</span><strong>${rows.length?money(streaming):'—'}</strong><small>iHeart streaming</small></article>
        <article class="kpi-card"><span>Spots / unidades</span><strong>${rows.length?integer(spots):'—'}</strong><small>Paid + bonus en TV/Radio</small></article>
        <article class="kpi-card"><span>Streaming impressions</span><strong>${rows.length?integer(impressions):'—'}</strong><small>Solo cuando la fuente reporta impresiones</small></article>
      </div>
      <div class="analytics-grid">
        <article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Media mix</span><h3>Inversión por medio</h3></div><span class="status-chip">${esc(range.label)}</span></div><div class="rank-list">${rankRows(mediumRows,money)}</div></article>
        <article class="panel full-panel"><div class="panel-head"><div><span class="panel-kicker">Campaign_Tag</span><h3>Inversión offline por campaña</h3></div></div><div class="rank-list">${rankRows(campaignRows,money)}</div></article>
      </div>`;
  }

  function refreshFutureUi() {
    ensureFutureChannels(); ensurePaidPlaceholders(); ensureSocialTikTokTab(); renderReviews(); renderOffline();
  }

  async function loadReviews() {
    try {
      const res=await fetch('./data/reviews-v2.json',{cache:'no-store'}); if(!res.ok) throw new Error('reviews-v2.json');
      const data=await res.json();
      REVIEW_DATA=(data.rows||[]).map(a=>Object.fromEntries((data.schema||[]).map((f,i)=>[f,a[i]])));
      renderReviews();
    } catch (err) { console.error('No se pudo cargar Reviews V2',err); }
  }

  async function loadOffline() {
    try {
      const res=await fetch('./data/offline-v2.json',{cache:'no-store'}); if(!res.ok) throw new Error('offline-v2.json');
      const data=await res.json();
      OFFLINE_DATA=(data.rows||[]).map(a=>Object.fromEntries((data.schema||[]).map((f,i)=>[f,a[i]])));
      renderOffline();
    } catch (err) { console.error('No se pudo cargar Offline V2',err); }
  }

  const observer = new MutationObserver(() => requestAnimationFrame(refreshFutureUi));
  document.addEventListener('DOMContentLoaded', () => {
    refreshFutureUi(); loadReviews(); loadOffline();
    ['channel-filter','platform-performance','social-platform-tabs','period-controls'].forEach(id => {
      const el=document.getElementById(id); if(el) observer.observe(el,{childList:true,subtree:true});
    });
    document.addEventListener('change', e => {
      if(e.target.closest?.('#period-controls,#campaign-filter,#channel-filter')) requestAnimationFrame(refreshFutureUi);
    });
    document.getElementById('period-mode')?.addEventListener('click',()=>setTimeout(refreshFutureUi,0));
    document.getElementById('reset-filters')?.addEventListener('click',()=>setTimeout(refreshFutureUi,0));
  });
})();