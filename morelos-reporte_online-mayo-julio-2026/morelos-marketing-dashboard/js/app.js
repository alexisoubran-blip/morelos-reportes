(() => {
  'use strict';

  const PLATFORM_COLORS = {
    Meta: '#1877F2',
    Facebook: '#1877F2',
    Instagram: '#E1306C',
    TikTok: '#111111',
    Google: '#0d7b4b'
  };

  const state = {
    mode: 'months',
    week: '2026-06-01',
    month: '2026-07',
    fromMonth: '2026-06',
    toMonth: '2026-07',
    campaign: 'all',
    channel: 'all',
    socialPlatform: 'all',
    performanceMetric: 'spend',
    socialMetric: 'follows',
    analyticsMetric: 'active_users'
  };

  let DATA = null;
  const $ = (id) => document.getElementById(id);
  const money = (v) => v == null ? '—' : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
  const moneyExact = (v) => v == null ? '—' : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v);
  const integer = (v) => v == null ? '—' : new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(v);
  const exact = (v) => v == null ? '—' : new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v);
  const compact = (v) => {
    if (v == null || Number.isNaN(v)) return '—';
    if (Math.abs(v) >= 1e6) return `${(v/1e6).toFixed(v>=1e7?1:2).replace(/\.0$/,'')}M`;
    if (Math.abs(v) >= 1e3) return `${(v/1e3).toFixed(v>=1e5?0:1).replace(/\.0$/,'')}K`;
    return integer(v);
  };
  const pct = (v, d=1) => v == null || !Number.isFinite(v) ? '—' : `${(v*100).toFixed(d)}%`;
  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const parseDate = (s) => new Date(`${s}T12:00:00`);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const monthLabel = (key) => new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(parseDate(`${key}-01`)).replace(/^./,c=>c.toUpperCase());
  const shortDate = (d) => new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short'}).format(d).replace('.','');
  const inRange = (date, r) => date >= r.start && date <= r.end;

  function addDays(d, n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function endOfMonth(key){ const [y,m]=key.split('-').map(Number); return new Date(y,m,0,12); }
  function monday(d){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); return x; }

  function getRange(){
    if(state.mode==='week'){
      const start=parseDate(state.week); return {start,end:addDays(start,6),label:`${shortDate(start)}–${shortDate(addDays(start,6))}`};
    }
    if(state.mode==='month'){
      return {start:parseDate(`${state.month}-01`),end:endOfMonth(state.month),label:monthLabel(state.month)};
    }
    const from=state.fromMonth <= state.toMonth ? state.fromMonth : state.toMonth;
    const to=state.fromMonth <= state.toMonth ? state.toMonth : state.fromMonth;
    return {start:parseDate(`${from}-01`),end:endOfMonth(to),label:from===to?monthLabel(from):`${monthLabel(from)} → ${monthLabel(to)}`};
  }

  function allMonths(){
    const out=[]; let d=parseDate(DATA.metadata.export_start); const end=parseDate(DATA.metadata.export_end);
    d=new Date(d.getFullYear(),d.getMonth(),1,12);
    while(d<=end){out.push(monthKey(d));d=new Date(d.getFullYear(),d.getMonth()+1,1,12)}
    return out;
  }

  function allWeeks(){
    const out=[]; let d=monday(parseDate(DATA.metadata.export_start)); const end=parseDate(DATA.metadata.export_end);
    while(d<=end){out.push(iso(d));d=addDays(d,7)}
    return out;
  }

  function renderPeriodControls(){
    document.querySelectorAll('#period-mode button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
    const el=$('period-controls');
    if(state.mode==='week'){
      el.innerHTML=`<select id="week-select">${allWeeks().map(w=>{const d=parseDate(w);return `<option value="${w}" ${w===state.week?'selected':''}>Semana ${shortDate(d)}–${shortDate(addDays(d,6))}</option>`}).join('')}</select>`;
      $('week-select').addEventListener('change',e=>{state.week=e.target.value;renderAll()});
    } else if(state.mode==='month'){
      el.innerHTML=`<select id="month-select">${allMonths().map(m=>`<option value="${m}" ${m===state.month?'selected':''}>${monthLabel(m)}</option>`).join('')}</select>`;
      $('month-select').addEventListener('change',e=>{state.month=e.target.value;renderAll()});
    } else {
      el.innerHTML=`<select id="from-month">${allMonths().map(m=>`<option value="${m}" ${m===state.fromMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}</select><select id="to-month">${allMonths().map(m=>`<option value="${m}" ${m===state.toMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}</select>`;
      $('from-month').addEventListener('change',e=>{state.fromMonth=e.target.value;renderAll()});
      $('to-month').addEventListener('change',e=>{state.toMonth=e.target.value;renderAll()});
    }
  }

  function metaScope(range){
    const expStart=parseDate(DATA.metadata.export_start), expEnd=parseDate(DATA.metadata.export_end), agencyStart=parseDate(DATA.metadata.agency_start);
    const exactExport=iso(range.start)===iso(expStart) && iso(range.end)===iso(expEnd);
    const exactWDM=iso(range.start)===iso(agencyStart) && iso(range.end)===iso(expEnd);
    if(exactExport) return {usable:true,agency:'all',reason:'Meta disponible como total del export May–Jul.'};
    if(exactWDM) return {usable:true,agency:'WDM',reason:'Meta WDM válido como total Jun–Jul porque WDM inicia el 1 de junio.'};
    return {usable:false,agency:null,reason:'Meta no se muestra en este corte: el CSV recibido no trae breakdown semanal/mensual.'};
  }

  function filteredMeta(range){
    const scope=metaScope(range); if(!scope.usable || state.channel==='Google') return [];
    return DATA.paid.meta_campaigns.filter(r =>
      (scope.agency==='all' || r.agency===scope.agency) &&
      (state.campaign==='all' || r.campaign_group===state.campaign)
    );
  }

  function filteredGoogle(range){
    if(state.channel==='Meta' || state.campaign!=='all') return [];
    return DATA.paid.google_weekly.filter(r=>inRange(parseDate(r.week_start),range));
  }

  function paidSummary(range){
    const meta=filteredMeta(range), google=filteredGoogle(range), scope=metaScope(range);
    const metaSpend=meta.reduce((s,r)=>s+r.spend,0), googleSpend=google.reduce((s,r)=>s+r.spend,0);
    const metaClicks=meta.reduce((s,r)=>s+r.link_clicks,0), metaImpressions=meta.reduce((s,r)=>s+r.impressions,0);
    const coverage=[];
    if(state.channel!=='Google') coverage.push(scope.usable?'Meta agregado disponible':'Meta temporal no disponible');
    if(state.channel!=='Meta') coverage.push(state.campaign==='all'?'Google semanal disponible':'Google excluido: export sin campaña');
    return {meta,google,metaSpend,googleSpend,spend:metaSpend+googleSpend,clicks:metaClicks,impressions:metaImpressions,scope,coverage};
  }

  function filteredContent(range){
    return DATA.social.content.filter(r=>
      inRange(parseDate(r.date),range) &&
      (state.campaign==='all'||r.campaign_group===state.campaign) &&
      (state.socialPlatform==='all'||r.platform===state.socialPlatform)
    );
  }
  function filteredFollows(range){
    if(state.campaign!=='all') return [];
    return DATA.social.follows_daily.filter(r=>
      inRange(parseDate(r.date),range) &&
      (state.socialPlatform==='all'||r.platform===state.socialPlatform)
    );
  }
  function filteredAnalytics(range){ return DATA.analytics.daily.filter(r=>inRange(parseDate(r.date),range)); }

  function setText(id,val){ $(id).textContent=val; }

  function renderCoverage(range, paid){
    const notes=[];
    if(range.end < parseDate(DATA.metadata.agency_start)) notes.push('<strong>Periodo pre-WDM.</strong> Este corte funciona como baseline anterior a la entrada de WDM.');
    else notes.push(`<strong>${esc(range.label)}.</strong> WDM entra el 1 de junio de 2026.`);
    notes.push(paid.scope.reason);
    notes.push('Social = performance Lifetime del contenido publicado en el periodo.');
    if(state.socialPlatform!=='all') notes.push(`Social filtrado por ${esc(state.socialPlatform)}.`);
    if(state.campaign!=='all') notes.push('El filtro de campaña aplica a Meta y al contenido social clasificado; GA4 y Google no tienen campaign mapping suficiente en los archivos actuales.');
    $('coverage-banner').innerHTML=notes.join(' &nbsp;·&nbsp; ');
  }

  function renderOverview(range, paid){
    setText('kpi-spend',money(paid.spend));
    setText('kpi-spend-note',paid.coverage.join(' · '));
    setText('kpi-campaigns',paid.meta.length ? integer(paid.meta.filter(x=>x.spend>0).length) : '—');

    renderCampaignSplit(paid);
    renderChannelInvestment(paid);
  }

  function renderInvestmentTime(range, paid){
    const rows=paid.google;
    if(!rows.length){ $('investment-time-chart').innerHTML=empty('Sin serie temporal de inversión disponible para este filtro.'); return; }
    const labels=rows.map(r=>shortDate(parseDate(r.week_start)));
    const vals=rows.map(r=>r.spend);
    $('investment-time-chart').innerHTML=barChart(labels,vals,{money:true,tooltipPrefix:'Google Ads',caption:'Google Ads · inversión semanal disponible. Meta requiere export temporal para entrar a esta gráfica.'});
  }

  function groupMeta(meta){
    const map=new Map();
    meta.forEach(r=>{
      const x=map.get(r.campaign_group)||{group:r.campaign_group,spend:0,impressions:0,clicks:0,campaigns:0};
      x.spend+=r.spend;x.impressions+=r.impressions;x.clicks+=r.link_clicks;x.campaigns+=r.spend>0?1:0;map.set(r.campaign_group,x);
    });
    return [...map.values()].sort((a,b)=>b.spend-a.spend);
  }

  function renderCampaignSplit(paid){
    const rows=groupMeta(paid.meta).filter(x=>x.spend>0).slice(0,7);
    if(!rows.length){$('campaign-split').innerHTML=empty('Meta no tiene temporalidad suficiente para este corte o el filtro no tiene registros.');return}
    const max=Math.max(...rows.map(r=>r.spend),1);
    $('campaign-split').innerHTML=rows.map(r=>`<div class="rank-row"><div class="rank-label">${esc(r.group)}</div><div class="rank-track"><div class="rank-fill" title="${esc(r.group)} · ${moneyExact(r.spend)}" style="width:${r.spend/max*100}%;background:${PLATFORM_COLORS.Meta}"></div></div><div class="rank-value">${money(r.spend)}</div></div>`).join('');
  }

  function renderChannelInvestment(paid){
    const total=Math.max(paid.spend,1);
    const channels=[
      {name:'Meta',value:paid.metaSpend,note:paid.scope.usable?'Total disponible para el corte':'Sin grain temporal suficiente'},
      {name:'Google',value:paid.googleSpend,note:state.campaign==='all'?'Cost semanal':'Sin campaign mapping'},
      {name:'TikTok',value:null,note:'Input preparado · sin fuente'}
    ];
    $('channel-investment').innerHTML=channels.map(c=>`<div class="channel-card"><div class="channel-name"><span>${c.name}</span><span>${c.value==null?'—':pct(c.value/total,0)}</span></div><strong>${c.value==null?'—':money(c.value)}</strong><small>${esc(c.note)}</small><div class="channel-progress"><i title="${c.value==null?esc(c.name+' · sin fuente'):esc(c.name+' · '+moneyExact(c.value))}" style="width:${c.value==null?0:c.value/total*100}%;background:${PLATFORM_COLORS[c.name]||'#0d7b4b'}"></i></div></div>`).join('');
  }

  function renderPerformance(paid){
    setText('perf-spend',money(paid.spend));
    setText('perf-spend-note',paid.coverage.join(' · '));
    setText('perf-clicks',paid.meta.length?compact(paid.clicks):'—');
    renderPlatformPerformance(paid);
    renderCampaignCards(paid);
  }

  function renderPlatformPerformance(paid){
    const metric=state.performanceMetric;
    const metaValue=metric==='spend'?paid.metaSpend:metric==='impressions'?paid.impressions:paid.clicks;
    const googleValue=metric==='spend'?paid.googleSpend:null;
    const label=metric==='spend'?'Inversión':metric==='impressions'?'Impresiones':'Link clicks';
    const fmt=metric==='spend'?money:compact;
    const cards=[
      {name:'Meta',value:paid.scope.usable&&state.channel!=='Google'?metaValue:null,note:paid.scope.usable?'Fuente: Meta Ads':'Export agregado May–Jul'},
      {name:'Google',value:state.channel!=='Meta'&&state.campaign==='all'?googleValue:null,note:metric==='spend'?'Fuente: Google Ads semanal':'El export solo contiene Cost'},
      {name:'TikTok',value:null,note:'Input preparado · sin fuente'}
    ];
    $('platform-performance').innerHTML=cards.map(c=>{
      const style=c.value==null?'':`background:${PLATFORM_COLORS[c.name]||'#064a31'}`;
      return `<div class="platform-card ${c.value==null?'muted-platform':''}" style="${style}"><div class="platform-top"><h4>${c.name}</h4><span class="status-chip ${c.value==null?'muted':''}">${label}</span></div><div class="platform-value">${c.value==null?'—':fmt(c.value)}</div><p>${esc(c.note)}</p></div>`;
    }).join('');
  }

  function renderCampaignCards(paid){
    const rows=groupMeta(paid.meta).filter(x=>x.spend>0).slice(0,9);
    if(!rows.length){$('campaign-cards').innerHTML=empty('Campañas preparadas. Este filtro requiere un export Meta con temporalidad compatible.');return}
    $('campaign-cards').innerHTML=rows.map(r=>{
      const ctr=r.impressions?r.clicks/r.impressions:null, cpc=r.clicks?r.spend/r.clicks:null, cpm=r.impressions?r.spend/r.impressions*1000:null;
      return `<article class="campaign-card"><h4>${esc(r.group)}</h4><div class="big">${money(r.spend)}</div><div class="metric-row"><div class="mini-metric"><span>Impressions</span><strong>${compact(r.impressions)}</strong></div><div class="mini-metric"><span>Clicks</span><strong>${compact(r.clicks)}</strong></div><div class="mini-metric"><span>CTR</span><strong>${pct(ctr)}</strong></div><div class="mini-metric"><span>CPC / CPM</span><strong>${cpc==null?'—':money(cpc)} / ${cpm==null?'—':money(cpm)}</strong></div></div></article>`
    }).join('');
  }

  function renderSocial(range){
    document.querySelectorAll('#social-platform-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.platform===state.socialPlatform));
    const content=filteredContent(range), follows=filteredFollows(range);
    const views=content.reduce((s,r)=>s+r.views,0), interactions=content.reduce((s,r)=>s+r.interactions,0), reach=content.reduce((s,r)=>s+r.reach,0), followCount=follows.reduce((s,r)=>s+r.follows,0);
    const platformLabel=state.socialPlatform==='all'?'Facebook + Instagram':state.socialPlatform;
    const platformNote=state.socialPlatform==='all'?'TikTok preparado, sin fuente':state.socialPlatform==='TikTok'?'Fuente aún no integrada':'Filtro activo';
    setText('social-platforms',platformLabel);
    setText('social-platforms-note',platformNote);
    setText('social-follows',state.campaign==='all'&&follows.length?compact(followCount):'—');
    setText('social-views',content.length?compact(views):'—');
    setText('social-interactions',content.length?compact(interactions):'—');
    setText('social-er',content.length&&reach?pct(interactions/reach):'—');
    renderSocialChart(range,content,follows);
    renderBoosted(content);
    renderTopContent(content);
    return {content,follows,views,interactions,reach,followCount};
  }

  function bucketKey(date, grain){
    if(grain==='day') return iso(date);
    if(grain==='month') return monthKey(date);
    return iso(monday(date));
  }
  function bucketLabel(key,grain){
    if(grain==='month') return monthLabel(key).replace(' 2026','');
    return shortDate(parseDate(key));
  }
  function grainForTrend(){ return state.mode==='week'?'day':'week'; }

  function renderSocialChart(range,content,follows){
    const metric=state.socialMetric, grain=grainForTrend();
    if(metric==='follows' && state.campaign!=='all'){
      $('social-chart').innerHTML=empty('Follows no tiene dimensión de campaña en el export.');
      return;
    }
    const source=metric==='follows'?follows:content;
    if(!source.length){
      $('social-chart').innerHTML=empty(state.socialPlatform==='TikTok'?'TikTok está preparado como filtro, pero todavía no existe una fuente integrada.':'Sin registros sociales para este filtro.');
      return;
    }
    const valueFor=(r)=>metric==='follows'?r.follows:metric==='views'?r.views:r.interactions;
    const caption=metric==='follows'?'Follows obtenidos por fecha.':'Métrica Lifetime agrupada por fecha de publicación.';

    if(state.socialPlatform!=='all'){
      const map=new Map();
      source.forEach(r=>{const k=bucketKey(parseDate(r.date),grain);map.set(k,(map.get(k)||0)+valueFor(r))});
      const rows=[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
      $('social-chart').innerHTML=barChart(
        rows.map(x=>bucketLabel(x[0],grain)),
        rows.map(x=>x[1]),
        {color:PLATFORM_COLORS[state.socialPlatform],tooltipPrefix:state.socialPlatform,caption}
      );
      return;
    }

    const platformMaps=new Map();
    const keys=new Set();
    source.forEach(r=>{
      const k=bucketKey(parseDate(r.date),grain); keys.add(k);
      if(!platformMaps.has(r.platform)) platformMaps.set(r.platform,new Map());
      const m=platformMaps.get(r.platform); m.set(k,(m.get(k)||0)+valueFor(r));
    });
    const orderedKeys=[...keys].sort();
    const platforms=['Facebook','Instagram','TikTok'].filter(p=>platformMaps.has(p));
    const series=platforms.map(p=>({name:p,color:PLATFORM_COLORS[p],values:orderedKeys.map(k=>platformMaps.get(p).get(k)||0)}));
    $('social-chart').innerHTML=groupedBarChart(orderedKeys.map(k=>bucketLabel(k,grain)),series,{caption});
  }

  function renderBoosted(content){
    if(state.socialPlatform==='TikTok'){
      $('boosted-summary').innerHTML=empty('TikTok sin fuente integrada.');
      return;
    }
    if(state.socialPlatform==='Instagram'){
      $('boosted-summary').innerHTML=`<div class="boosted-box"><div class="boosted-stat"><span>Boosted views</span><strong>—</strong></div><div class="boosted-stat"><span>Boosted reach</span><strong>—</strong></div></div><p class="micro-note">Instagram Organic n Boosts llega combinado; no se fuerza un split inexistente.</p>`;
      return;
    }
    const fb=content.filter(r=>r.platform==='Facebook');
    const boostedViews=fb.reduce((s,r)=>s+(r.boosted_views||0),0), boostedReach=fb.reduce((s,r)=>s+(r.boosted_reach||0),0);
    $('boosted-summary').innerHTML=`<div class="boosted-box"><div class="boosted-stat"><span>FB boosted views</span><strong>${compact(boostedViews)}</strong></div><div class="boosted-stat"><span>FB boosted reach</span><strong>${compact(boostedReach)}</strong></div></div><p class="micro-note">${state.socialPlatform==='Facebook'?'Facebook permite separar Organic vs Boosted.':'Instagram Organic n Boosts llega combinado; el split mostrado corresponde únicamente a Facebook.'}</p>`;
  }

  function renderTopContent(content){
    const rows=[...content].sort((a,b)=>b.views-a.views).slice(0,5);
    if(!rows.length){$('top-content').innerHTML=empty(state.socialPlatform==='TikTok'?'TikTok sin fuente integrada.':'Sin contenido en este filtro.');return}
    $('top-content').innerHTML=rows.map((r,i)=>`<div class="content-row"><div class="content-index">${String(i+1).padStart(2,'0')}</div><div class="content-copy"><strong>${esc(r.label||r.format||'Contenido')}</strong><small>${r.platform} · ${r.campaign_group} · ${r.date}</small></div><div class="content-value">${compact(r.views)}<br><small>views</small></div></div>`).join('');
  }

  function renderAnalytics(range){
    const rows=filteredAnalytics(range); const n=rows.length;
    const avgUsers=n?rows.reduce((s,r)=>s+r.active_users,0)/n:0, views=rows.reduce((s,r)=>s+r.views,0), events=rows.reduce((s,r)=>s+r.event_count,0);
    setText('ga-users',n?compact(avgUsers):'—'); setText('ga-views',n?compact(views):'—'); setText('ga-events',n?compact(events):'—');
    renderAnalyticsChart(rows); renderTrafficSources(); renderPages();
    return {rows,avgUsers,views,events};
  }

  function renderAnalyticsChart(rows){
    if(!rows.length){$('analytics-chart').innerHTML=empty('Sin registros GA4 para este filtro.');return}
    const metric=state.analyticsMetric, grain=grainForTrend(), map=new Map(), counts=new Map();
    rows.forEach(r=>{const k=bucketKey(parseDate(r.date),grain);map.set(k,(map.get(k)||0)+r[metric]);counts.set(k,(counts.get(k)||0)+1)});
    const series=[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>[k,metric==='active_users'?v/counts.get(k):v]);
    $('analytics-chart').innerHTML=lineChart(series.map(x=>bucketLabel(x[0],grain)),series.map(x=>x[1]),{caption:metric==='active_users'?'Promedio de usuarios activos dentro de cada bucket.':'Suma de la métrica dentro de cada bucket.'});
  }

  function renderTrafficSources(){
    const rows=(DATA.analytics.channels.sessions_by_channel||[]).slice(0,7); const max=Math.max(...rows.map(r=>r.value),1);
    $('traffic-sources').innerHTML=rows.map(r=>`<div class="rank-row"><div class="rank-label">${esc(r.channel)}</div><div class="rank-track"><div class="rank-fill" title="${esc(r.channel)} · ${exact(r.value)}" style="width:${r.value/max*100}%"></div></div><div class="rank-value">${compact(r.value)}</div></div>`).join('');
  }
  function renderPages(){
    const rows=(DATA.analytics.pages||[]).slice(0,7); const max=Math.max(...rows.map(r=>r.views),1);
    $('top-pages').innerHTML=rows.map(r=>`<div class="rank-row"><div class="rank-label" title="${esc(r.page)}">${esc(r.page)}</div><div class="rank-track"><div class="rank-fill" title="${esc(r.page)} · ${exact(r.views)} views" style="width:${r.views/max*100}%"></div></div><div class="rank-value">${compact(r.views)}</div></div>`).join('');
  }

  function renderInsights(paid,social,analytics){
    const groups=groupMeta(paid.meta).filter(x=>x.spend>0); const top=groups[0];
    const cards=[];
    if(paid.spend>0) cards.push({title:'Inversión visible en el corte',body:`Las fuentes disponibles suman ${money(paid.spend)}. ${paid.scope.usable?'Meta entra como total válido para este rango.':'Meta queda fuera por falta de temporalidad.'}`});
    if(top) cards.push({title:`${top.group} concentra la mayor inversión Meta`,body:`Representa ${pct(top.spend/Math.max(paid.metaSpend,1))} del spend Meta visible en el filtro (${money(top.spend)}).`});
    if(social.views>0) cards.push({title:`Social${state.socialPlatform==='all'?'':` · ${state.socialPlatform}`} mantiene una base de lectura por contenido`,body:`El contenido publicado en el periodo acumula ${compact(social.views)} views Lifetime y ${compact(social.interactions)} interacciones.`});
    if(social.followCount>0 && state.campaign==='all') cards.push({title:'Crecimiento social medible por fecha',body:`${state.socialPlatform==='all'?'Facebook + Instagram':state.socialPlatform} registra ${integer(social.followCount)} nuevos follows dentro del periodo seleccionado.`});
    if(analytics.views>0) cards.push({title:'GA4 sí soporta lectura temporal',body:`El periodo registra ${compact(analytics.views)} views y ${compact(analytics.events)} eventos con grain diario.`});
    cards.push({title:'Ventas y offline siguen fuera del modelo',body:'Los módulos permanecen visibles como inputs preparados, pero no se calculan KPIs sin una fuente válida.'});
    $('insights-grid').innerHTML=cards.slice(0,6).map((c,i)=>`<article class="insight-card"><b>${String(i+1).padStart(2,'0')}</b><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p></article>`).join('');
  }

  function empty(text){return `<div class="empty-state">${esc(text)}</div>`}

  function barChart(labels,values,opts={}){
    const W=900,H=240,p={l:52,r:14,t:14,b:44}; const max=Math.max(...values,1); const iw=W-p.l-p.r, ih=H-p.t-p.b; const step=iw/Math.max(values.length,1); const bw=Math.max(10,Math.min(64,step*.62));
    const grid=[0,.25,.5,.75,1].map(t=>{const y=p.t+ih*(1-t);return `<line class="grid" x1="${p.l}" y1="${y}" x2="${W-p.r}" y2="${y}"/><text x="${p.l-8}" y="${y+3}" text-anchor="end">${opts.money?money(max*t):compact(max*t)}</text>`}).join('');
    const bars=values.map((v,i)=>{
      const h=v/max*ih,x=p.l+i*step+(step-bw)/2,y=p.t+ih-h;
      const fill=opts.color?` style="fill:${opts.color};cursor:pointer"`:'';
      const tip=`${opts.tooltipPrefix?opts.tooltipPrefix+' · ':''}${labels[i]}: ${opts.money?moneyExact(v):exact(v)}`;
      return `<rect class="bar ${opts.color?'':(i%2?'alt':'')}" x="${x}" y="${y}" width="${bw}" height="${h}" rx="4"${fill}><title>${esc(tip)}</title></rect><text x="${x+bw/2}" y="${H-18}" text-anchor="middle">${esc(labels[i])}</text>`;
    }).join('');
    const legendColor=opts.color||'#0d7b4b';
    return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img">${grid}<line class="axis" x1="${p.l}" y1="${p.t+ih}" x2="${W-p.r}" y2="${p.t+ih}"/>${bars}</svg>${opts.caption?`<div class="chart-legend"><span><i class="legend-dot" style="background:${legendColor}"></i>${esc(opts.caption)}</span></div>`:''}`;
  }

  function groupedBarChart(labels,series,opts={}){
    const W=900,H=240,p={l:52,r:14,t:14,b:44};
    const allValues=series.flatMap(s=>s.values); const max=Math.max(...allValues,1); const iw=W-p.l-p.r, ih=H-p.t-p.b; const step=iw/Math.max(labels.length,1);
    const groupWidth=Math.min(step*.78,92); const bw=Math.max(5,groupWidth/Math.max(series.length,1)-3);
    const grid=[0,.25,.5,.75,1].map(t=>{const y=p.t+ih*(1-t);return `<line class="grid" x1="${p.l}" y1="${y}" x2="${W-p.r}" y2="${y}"/><text x="${p.l-8}" y="${y+3}" text-anchor="end">${compact(max*t)}</text>`}).join('');
    const bars=labels.map((label,i)=>{
      const start=p.l+i*step+(step-groupWidth)/2;
      const rects=series.map((s,si)=>{
        const v=s.values[i]||0,h=v/max*ih,x=start+si*(groupWidth/series.length)+(groupWidth/series.length-bw)/2,y=p.t+ih-h;
        return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" style="fill:${s.color};cursor:pointer"><title>${esc(`${s.name} · ${label}: ${exact(v)}`)}</title></rect>`;
      }).join('');
      return `${rects}<text x="${p.l+i*step+step/2}" y="${H-18}" text-anchor="middle">${esc(label)}</text>`;
    }).join('');
    const legend=series.map(s=>`<span><i class="legend-dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');
    return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img">${grid}<line class="axis" x1="${p.l}" y1="${p.t+ih}" x2="${W-p.r}" y2="${p.t+ih}"/>${bars}</svg><div class="chart-legend">${legend}${opts.caption?`<span>${esc(opts.caption)}</span>`:''}</div>`;
  }

  function lineChart(labels,values,opts={}){
    const W=900,H=240,p={l:52,r:14,t:14,b:44}; const max=Math.max(...values,1); const min=Math.min(0,...values); const iw=W-p.l-p.r, ih=H-p.t-p.b; const range=Math.max(max-min,1); const x=i=>p.l+(labels.length<=1?iw/2:i*iw/(labels.length-1)); const y=v=>p.t+ih-(v-min)/range*ih;
    const grid=[0,.25,.5,.75,1].map(t=>{const val=min+range*t, yy=y(val);return `<line class="grid" x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}"/><text x="${p.l-8}" y="${yy+3}" text-anchor="end">${compact(val)}</text>`}).join('');
    const points=values.map((v,i)=>`${x(i)},${y(v)}`).join(' '); const area=`${p.l},${p.t+ih} ${points} ${W-p.r},${p.t+ih}`;
    const ticks=labels.map((l,i)=>`<text x="${x(i)}" y="${H-18}" text-anchor="middle">${esc(l)}</text>`).join('');
    const dots=values.map((v,i)=>`<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="4" style="cursor:pointer"><title>${esc(`${labels[i]}: ${exact(v)}`)}</title></circle>`).join('');
    return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img">${grid}<polygon class="area" points="${area}"/><polyline class="line" points="${points}"/>${dots}${ticks}</svg>${opts.caption?`<div class="chart-legend"><span><i class="legend-dot"></i>${esc(opts.caption)}</span></div>`:''}`;
  }

  function renderAll(){
    const range=getRange(), paid=paidSummary(range);
    renderPeriodControls(); renderCoverage(range,paid); renderOverview(range,paid); renderPerformance(paid); const social=renderSocial(range); const analytics=renderAnalytics(range); renderInsights(paid,social,analytics);
  }

  function bindTabs(containerId,key){
    $(containerId).addEventListener('click',e=>{
      const b=e.target.closest('button[data-metric]'); if(!b)return;
      state[key]=b.dataset.metric; [...$(containerId).querySelectorAll('button')].forEach(x=>x.classList.toggle('active',x===b)); renderAll();
    });
  }

  async function init(){
    try{
      const res=await fetch('./data/dashboard-data.json',{cache:'no-store'}); DATA=await res.json();
      $('campaign-filter').innerHTML=`<option value="all">Todas</option>`+DATA.taxonomy.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
      document.querySelectorAll('#period-mode button').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;renderAll()}));
      $('campaign-filter').addEventListener('change',e=>{state.campaign=e.target.value;renderAll()});
      $('channel-filter').addEventListener('change',e=>{state.channel=e.target.value;renderAll()});
      $('social-platform-tabs').addEventListener('click',e=>{
        const b=e.target.closest('button[data-platform]'); if(!b)return;
        state.socialPlatform=b.dataset.platform; renderAll();
      });
      $('reset-filters').addEventListener('click',()=>{
        Object.assign(state,{mode:'months',week:'2026-06-01',month:'2026-07',fromMonth:'2026-06',toMonth:'2026-07',campaign:'all',channel:'all',socialPlatform:'all'});
        $('campaign-filter').value='all'; $('channel-filter').value='all'; renderAll();
      });
      bindTabs('performance-tabs','performanceMetric'); bindTabs('social-tabs','socialMetric'); bindTabs('analytics-tabs','analyticsMetric');
      renderAll();
    } catch(err){
      console.error(err); document.body.innerHTML=`<main class="page-shell"><div class="coverage-banner"><strong>No se pudo cargar dashboard-data.json.</strong> Sirve esta carpeta con un servidor local o despliega en Vercel.</div></main>`;
    }
  }
  init();
})();
