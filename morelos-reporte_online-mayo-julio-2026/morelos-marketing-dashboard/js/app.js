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
  let SOI = null;
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

  function businessGroup(group=''){
    if(group==='Mundial / Fútbol') return 'Mundial / Sellos / Futbolito';
    if(group==='AON / Store') return 'AON / Store visits';
    if(group==='Ofertón') return 'Lead ads / Ofertón';
    if(group==='Taco Tuesday') return 'Taco Tuesday';
    return 'Productos / Boost';
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
    const scope=metaScope(range); if(!scope.usable || !['all','Meta'].includes(state.channel)) return [];
    return DATA.paid.meta_campaigns.filter(r =>
      (scope.agency==='all' || r.agency===scope.agency) &&
      (state.campaign==='all' || businessGroup(r.campaign_group)===state.campaign)
    );
  }

  function filteredGoogle(range){
    if(!['all','Google'].includes(state.channel) || state.campaign!=='all') return [];
    return DATA.paid.google_weekly.filter(r=>inRange(parseDate(r.week_start),range));
  }

  function paidSummary(range){
    const meta=filteredMeta(range), google=filteredGoogle(range), scope=metaScope(range);
    const metaSpend=meta.reduce((s,r)=>s+r.spend,0), googleSpend=google.reduce((s,r)=>s+r.spend,0);
    const metaClicks=meta.reduce((s,r)=>s+r.link_clicks,0), metaImpressions=meta.reduce((s,r)=>s+r.impressions,0);
    const coverage=[];
    if(['all','Meta'].includes(state.channel)) coverage.push(scope.usable?'Meta agregado disponible':'Meta temporal no disponible');
    if(['all','Google'].includes(state.channel)) coverage.push(state.campaign==='all'?'Google semanal disponible':'Google excluido: export sin campaña');
    if(!['all','Meta','Google'].includes(state.channel)) coverage.push(`${state.channel}: sin fuente de performance integrada`);
    return {meta,google,metaSpend,googleSpend,spend:metaSpend+googleSpend,clicks:metaClicks,impressions:metaImpressions,scope,coverage};
  }

  function soiMonthKeys(range){
    if(state.mode==='week') return [];
    const expected=[]; let cursor=new Date(range.start.getFullYear(),range.start.getMonth(),1,12);
    while(cursor<=range.end){expected.push(monthKey(cursor));cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1,12)}
    if(expected.some(key=>!SOI.months[key])) return [];
    const keys=[];
    Object.keys(SOI.months).sort().forEach(key=>{
      const start=parseDate(`${key}-01`), end=endOfMonth(key);
      if(start>=range.start && end<=range.end) keys.push(key);
    });
    return keys;
  }

  function soiSummary(range){
    const keys=soiMonthKeys(range);
    if(!keys.length) return {usable:false,reason:'SOI solo está disponible con corte mensual para junio y julio de 2026.',months:[],blocks:[],channels:{},plannedChannels:{},budget:null,actual:null,campaigns:null};
    const months=keys.map(key=>({key,...SOI.months[key]}));
    const blockMap=new Map(SOI.campaign_groups.map(name=>[name,{name,budget:0,actual:0}]));
    months.forEach(month=>month.blocks.forEach(block=>{
      const row=blockMap.get(block.name); row.budget+=block.budget; row.actual+=block.actual;
    }));
    let blocks=[...blockMap.values()];
    if(state.campaign!=='all') blocks=blocks.filter(row=>row.name===state.campaign);

    const channelNames=['Meta','Google','YouTube / CTV','TikTok','Spotify'];
    const channels={}, plannedChannels={};
    channelNames.forEach(name=>{
      const actuals=months.map(month=>month.channels_actual[name]);
      channels[name]=actuals.every(value=>value!=null)?actuals.reduce((sum,value)=>sum+value,0):null;
      plannedChannels[name]=months.reduce((sum,month)=>sum+(month.channels_planned[name]||0),0);
    });
    if(state.campaign!=='all') channelNames.forEach(name=>{channels[name]=null;plannedChannels[name]=null});

    let budget=blocks.reduce((sum,row)=>sum+row.budget,0);
    let actual=blocks.reduce((sum,row)=>sum+row.actual,0);
    let reason=`SOI conciliado para ${keys.map(monthLabel).join(' + ')}.`;
    if(state.channel!=='all'){
      budget=state.campaign==='all'?plannedChannels[state.channel]:null;
      actual=state.campaign==='all'?channels[state.channel]:null;
      blocks=[];
      reason=state.campaign!=='all'?'El SOI recibido no incluye cruce bloque × canal.':actual==null?`El cierre real de ${state.channel} no está disponible para todo el periodo seleccionado.`:`Cierre real disponible para ${state.channel}.`;
    }
    return {usable:true,reason,months,blocks,channels,plannedChannels,budget,actual,campaigns:state.channel==='all'?blocks.filter(row=>row.actual>0).length:null};
  }

  function filteredContent(range){
    return DATA.social.content.filter(r=>
      inRange(parseDate(r.date),range) &&
      (state.campaign==='all'||businessGroup(r.campaign_group)===state.campaign) &&
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

  function renderOverview(range, soi){
    const channelValue=(name)=>state.channel==='all'||state.channel===name?soi.channels[name]:null;
    setText('kpi-marketing-total','—');
    setText('kpi-spend',soi.actual==null?'—':moneyExact(soi.actual));
    setText('kpi-spend-note',soi.reason);
    setText('kpi-campaigns',soi.campaigns==null?'—':integer(soi.campaigns));
    setText('kpi-digital-meta',channelValue('Meta')==null?'—':moneyExact(channelValue('Meta')));
    setText('kpi-digital-google',channelValue('Google')==null?'—':moneyExact(channelValue('Google')));
    setText('kpi-digital-youtube',channelValue('YouTube / CTV')==null?'—':moneyExact(channelValue('YouTube / CTV')));
    setText('kpi-digital-tiktok',channelValue('TikTok')==null?'—':moneyExact(channelValue('TikTok')));

    renderInvestmentTime(soi);
    renderCampaignSplit(soi);
    renderChannelInvestment(soi);
    renderReconciliation(soi);
  }

  function renderInvestmentTime(soi){
    if(!soi.months.length){ $('investment-time-chart').innerHTML=empty(soi.reason); return; }
    const rows=soi.months.map(month=>{
      if(state.campaign==='all') return {label:monthLabel(month.key).replace(' 2026',''),budget:month.budget,actual:month.actual};
      const block=month.blocks.find(row=>row.name===state.campaign);
      return {label:monthLabel(month.key).replace(' 2026',''),budget:block?.budget||0,actual:block?.actual||0};
    });
    if(state.channel!=='all'){
      const actuals=soi.months.map(month=>month.channels_actual[state.channel]);
      if(actuals.some(value=>value==null)){ $('investment-time-chart').innerHTML=empty(soi.reason); return; }
      rows.forEach((row,index)=>{row.budget=soi.months[index].channels_planned[state.channel]||0;row.actual=actuals[index]});
    }
    $('investment-time-chart').innerHTML=groupedBarChart(
      rows.map(row=>row.label),
      [
        {name:'Presupuesto',color:'#b7d4c2',values:rows.map(row=>row.budget)},
        {name:'Real',color:'#075d3b',values:rows.map(row=>row.actual)}
      ],
      {caption:'Fuente: SOI Digital. Valores en USD.',money:true}
    );
  }

  function groupMeta(meta){
    const map=new Map();
    meta.forEach(r=>{
      const group=businessGroup(r.campaign_group);
      const x=map.get(group)||{group,spend:0,impressions:0,clicks:0,campaigns:0};
      x.spend+=r.spend;x.impressions+=r.impressions;x.clicks+=r.link_clicks;x.campaigns+=r.spend>0?1:0;map.set(group,x);
    });
    return [...map.values()].sort((a,b)=>b.spend-a.spend);
  }

  function renderCampaignSplit(soi){
    const rows=soi.blocks.filter(row=>row.actual>0).sort((a,b)=>b.actual-a.actual);
    if(!rows.length){$('campaign-split').innerHTML=empty(state.channel!=='all'?'El SOI recibido no cruza canal con bloque de campaña.':soi.reason);return}
    const max=Math.max(...rows.map(row=>row.actual),1), total=rows.reduce((sum,row)=>sum+row.actual,0);
    $('campaign-split').innerHTML=rows.map(row=>`<div class="rank-row"><div class="rank-label">${esc(row.name)}</div><div class="rank-track"><div class="rank-fill" title="${esc(row.name)} · ${moneyExact(row.actual)}" style="width:${row.actual/max*100}%;background:${PLATFORM_COLORS.Meta}"></div></div><div class="rank-value">${moneyExact(row.actual)}</div></div>`).join('')+`<div class="rank-row"><div class="rank-label">TOTAL</div><div class="rank-track"><div class="rank-fill" style="width:100%"></div></div><div class="rank-value">${moneyExact(total)}</div></div>`;
  }

  function renderChannelInvestment(soi){
    const names=['Meta','Google','YouTube / CTV','TikTok','Spotify'];
    const visible=state.channel==='all'?names:names.filter(name=>name===state.channel);
    const total=Math.max(...Object.values(soi.channels).filter(value=>value!=null),1);
    $('channel-investment').innerHTML=visible.map(name=>{
      const value=soi.channels[name], planned=soi.plannedChannels[name];
      const note=planned==null?'Sin desglose bloque × canal':value==null?`Presupuesto ${moneyExact(planned)} · cierre real pendiente`:`Presupuesto ${moneyExact(planned)} · real conciliado`;
      return `<div class="channel-card"><div class="channel-name"><span>${esc(name)}</span><span>${value==null?'—':pct(value/Math.max(soi.actual||value,1),0)}</span></div><strong>${value==null?'—':moneyExact(value)}</strong><small>${esc(note)}</small><div class="channel-progress"><i title="${value==null?esc(name+' · cierre pendiente'):esc(name+' · '+moneyExact(value))}" style="width:${value==null?0:value/total*100}%;background:${PLATFORM_COLORS[name]||'#0d7b4b'}"></i></div></div>`;
    }).join('');
  }

  function renderReconciliation(soi){
    if(!soi.blocks.length){$('soi-reconciliation').innerHTML=empty(state.channel!=='all'?'La referencia SOI no incluye cruce canal × bloque. Restablece Canal para ver la conciliación por campaña.':soi.reason);setText('soi-reconciliation-status','No disponible');return}
    const totalBudget=soi.blocks.reduce((sum,row)=>sum+row.budget,0), totalActual=soi.blocks.reduce((sum,row)=>sum+row.actual,0);
    const rows=soi.blocks.map(row=>{
      const variance=row.actual-row.budget, ratio=row.budget?variance/row.budget:null, mix=totalActual?row.actual/totalActual:null;
      return `<tr><td>${esc(row.name)}</td><td>${moneyExact(row.budget)}</td><td>${moneyExact(row.actual)}</td><td class="${variance<0?'variance-negative':'variance-positive'}">${moneyExact(variance)}</td><td class="${variance<0?'variance-negative':'variance-positive'}">${ratio==null?'n/a':pct(ratio)}</td><td>${pct(mix)}</td></tr>`;
    }).join('');
    const variance=totalActual-totalBudget;
    $('soi-reconciliation').innerHTML=`<table class="reconciliation-table"><thead><tr><th>Bloque / campaña</th><th>Presupuesto</th><th>Real</th><th>Variación $</th><th>Variación %</th><th>% real del periodo</th></tr></thead><tbody>${rows}<tr><td>TOTAL</td><td>${moneyExact(totalBudget)}</td><td>${moneyExact(totalActual)}</td><td class="${variance<0?'variance-negative':'variance-positive'}">${moneyExact(variance)}</td><td class="${variance<0?'variance-negative':'variance-positive'}">${pct(variance/Math.max(totalBudget,1))}</td><td>100.0%</td></tr></tbody></table>`;
    setText('soi-reconciliation-status',Math.abs(totalActual-(soi.actual||0))<.01?'Conciliado':'Revisar');
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
      {name:'Meta',value:paid.scope.usable&&['all','Meta'].includes(state.channel)?metaValue:null,note:paid.scope.usable?'Fuente: Meta Ads':'Export agregado May–Jul'},
      {name:'Google',value:['all','Google'].includes(state.channel)&&state.campaign==='all'?googleValue:null,note:metric==='spend'?'Fuente: Google Ads semanal':'El export solo contiene Cost'},
      {name:'YouTube / CTV',value:null,note:'Sin fuente de performance integrada'},
      {name:'TikTok',value:null,note:'Input preparado · sin fuente'}
    ].filter(card=>state.channel==='all'||card.name===state.channel);
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
      $('boosted-detail').innerHTML='';
      return;
    }
    if(state.socialPlatform==='Instagram'){
      $('boosted-summary').innerHTML=`<div class="boosted-box"><div class="boosted-stat"><span>Boosted views</span><strong>—</strong></div><div class="boosted-stat"><span>Boosted reach</span><strong>—</strong></div><div class="boosted-stat"><span>Inversión boosts</span><strong>—</strong></div></div><p class="micro-note">Instagram Organic + Boosts llega combinado; no se fuerza un split inexistente.</p>`;
      $('boosted-detail').innerHTML='';
      return;
    }
    const fb=content.filter(r=>r.platform==='Facebook');
    const boostedViews=fb.reduce((s,r)=>s+(r.boosted_views||0),0), boostedReach=fb.reduce((s,r)=>s+(r.boosted_reach||0),0);
    const boostedRows=fb.filter(r=>(r.boosted_views||0)>0||(r.boosted_reach||0)>0).sort((a,b)=>(b.boosted_views||0)-(a.boosted_views||0));
    $('boosted-summary').innerHTML=`<div class="boosted-box"><div class="boosted-stat"><span>FB boosted views</span><strong>${compact(boostedViews)}</strong></div><div class="boosted-stat"><span>FB boosted reach</span><strong>${compact(boostedReach)}</strong></div><div class="boosted-stat"><span>Inversión boosts</span><strong>—</strong></div></div><p class="micro-note">${state.socialPlatform==='Facebook'?'Facebook permite separar Organic vs Boosted.':'Instagram Organic + Boosts llega combinado; el split mostrado corresponde únicamente a Facebook.'} El gasto por publicación no viene en la fuente.</p>`;
    $('boosted-detail').innerHTML=boostedRows.length?boostedRows.map(row=>`<div class="boosted-detail-row"><div><strong>${esc(row.label||'Publicación amplificada')}</strong><small>${row.date} · <a class="content-link" href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">Abrir publicación ↗</a></small></div><div><strong>${compact(row.boosted_views)} views</strong><small>${compact(row.boosted_reach)} reach</small></div></div>`).join(''):empty('No hay publicaciones de Facebook con boost identificable en este filtro.');
  }

  function renderTopContent(content){
    const rows=[...content].sort((a,b)=>b.views-a.views).slice(0,5);
    if(!rows.length){$('top-content').innerHTML=empty(state.socialPlatform==='TikTok'?'TikTok sin fuente integrada.':'Sin contenido en este filtro.');return}
    $('top-content').innerHTML=rows.map((r,i)=>{
      const type=r.platform==='Instagram'?'Combinado':(r.boosted_views||0)>0?'Boosted':'Orgánico';
      const cls=type==='Boosted'?'boosted':type==='Combinado'?'combined':'';
      return `<div class="content-row"><div class="content-index">${String(i+1).padStart(2,'0')}</div><div class="content-copy"><strong>${esc(r.label||r.format||'Contenido')}</strong><span class="content-type ${cls}">${type}</span><small>${r.platform} · ${esc(businessGroup(r.campaign_group))} · ${r.date}</small>${r.url?`<a class="content-link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Abrir publicación ↗</a>`:''}</div><div class="content-value">${compact(r.views)}<br><small>views</small></div></div>`;
    }).join('');
  }

  function renderAnalytics(range){
    const rows=filteredAnalytics(range); const n=rows.length;
    const avgUsers=n?rows.reduce((s,r)=>s+r.active_users,0)/n:0, views=rows.reduce((s,r)=>s+r.views,0), events=rows.reduce((s,r)=>s+r.event_count,0);
    const full=isFullExportRange(range), channels=DATA.analytics.channels.sessions_by_channel||[];
    const sessions=full?channels.reduce((sum,row)=>sum+row.value,0):null;
    setText('ga-users',n?compact(avgUsers):'—'); setText('ga-views',n?compact(views):'—'); setText('ga-events',n?compact(events):'—');
    setText('ga-sessions',sessions==null?'—':compact(sessions)); setText('ga-sources',full?integer(channels.length):'—');
    renderAnalyticsChart(rows); renderTrafficSources(range); renderPages(range);
    return {rows,avgUsers,views,events};
  }

  function isFullExportRange(range){
    return iso(range.start)===DATA.metadata.export_start && iso(range.end)===DATA.metadata.export_end;
  }

  function renderAnalyticsChart(rows){
    if(!rows.length){$('analytics-chart').innerHTML=empty('Sin registros GA4 para este filtro.');return}
    const metric=state.analyticsMetric, grain=grainForTrend(), map=new Map(), counts=new Map();
    rows.forEach(r=>{const k=bucketKey(parseDate(r.date),grain);map.set(k,(map.get(k)||0)+r[metric]);counts.set(k,(counts.get(k)||0)+1)});
    const series=[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>[k,metric==='active_users'?v/counts.get(k):v]);
    $('analytics-chart').innerHTML=lineChart(series.map(x=>bucketLabel(x[0],grain)),series.map(x=>x[1]),{caption:metric==='active_users'?'Promedio de usuarios activos dentro de cada bucket.':'Suma de la métrica dentro de cada bucket.'});
  }

  function renderTrafficSources(range){
    if(!isFullExportRange(range)){
      $('traffic-sources').innerHTML=empty('El export de fuentes solo existe como total May–Jul. Selecciona mayo → julio para mostrarlo sin distorsión.');
      setText('traffic-period','No compatible con el corte');
      return;
    }
    const rows=(DATA.analytics.channels.sessions_by_channel||[]).slice(0,7); const max=Math.max(...rows.map(r=>r.value),1);
    $('traffic-sources').innerHTML=rows.map(r=>`<div class="rank-row"><div class="rank-label">${esc(r.channel)}</div><div class="rank-track"><div class="rank-fill" title="${esc(r.channel)} · ${exact(r.value)}" style="width:${r.value/max*100}%"></div></div><div class="rank-value">${compact(r.value)}</div></div>`).join('');
    setText('traffic-period','May–Jul total');
  }
  function renderPages(range){
    if(!isFullExportRange(range)){
      $('top-pages').innerHTML=empty('El ranking de páginas solo existe como total May–Jul. Selecciona mayo → julio para mostrarlo sin distorsión.');
      setText('pages-period','No compatible con el corte');
      return;
    }
    const rows=(DATA.analytics.pages||[]).slice(0,7); const max=Math.max(...rows.map(r=>r.views),1);
    $('top-pages').innerHTML=rows.map(r=>`<div class="rank-row"><div class="rank-label" title="${esc(r.page)}">${esc(r.page)}</div><div class="rank-track"><div class="rank-fill" title="${esc(r.page)} · ${exact(r.views)} views" style="width:${r.views/max*100}%"></div></div><div class="rank-value">${compact(r.views)}</div></div>`).join('');
    setText('pages-period','May–Jul total');
  }

  function renderInsights(paid,social,analytics,soi){
    const groups=groupMeta(paid.meta).filter(x=>x.spend>0); const top=groups[0];
    const cards=[];
    if(soi.actual!=null) cards.push({title:'Overview conciliado con SOI',body:soi.campaigns==null?`La inversión digital real del corte suma ${moneyExact(soi.actual)} para el canal seleccionado.`:`La inversión digital real del corte suma ${moneyExact(soi.actual)} en ${integer(soi.campaigns)} bloques ejecutivos con inversión.`});
    if(paid.spend>0) cards.push({title:'Performance conserva fuente de plataforma',body:`Meta + Google visibles suman ${moneyExact(paid.spend)}. ${soi.actual!=null?`La diferencia contra SOI es ${moneyExact(paid.spend-soi.actual)} y no se oculta ni se imputa.`:paid.scope.usable?'Meta entra como total válido para este rango.':'Meta queda fuera por falta de temporalidad.'}`});
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
    const grid=[0,.25,.5,.75,1].map(t=>{const y=p.t+ih*(1-t);return `<line class="grid" x1="${p.l}" y1="${y}" x2="${W-p.r}" y2="${y}"/><text x="${p.l-8}" y="${y+3}" text-anchor="end">${opts.money?money(max*t):compact(max*t)}</text>`}).join('');
    const bars=labels.map((label,i)=>{
      const start=p.l+i*step+(step-groupWidth)/2;
      const rects=series.map((s,si)=>{
        const v=s.values[i]||0,h=v/max*ih,x=start+si*(groupWidth/series.length)+(groupWidth/series.length-bw)/2,y=p.t+ih-h;
        return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" style="fill:${s.color};cursor:pointer"><title>${esc(`${s.name} · ${label}: ${opts.money?moneyExact(v):exact(v)}`)}</title></rect>`;
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
    const range=getRange(), paid=paidSummary(range), soi=soiSummary(range);
    renderPeriodControls(); renderCoverage(range,paid); renderOverview(range,soi); renderPerformance(paid); const social=renderSocial(range); const analytics=renderAnalytics(range); renderInsights(paid,social,analytics,soi);
  }

  function bindTabs(containerId,key){
    $(containerId).addEventListener('click',e=>{
      const b=e.target.closest('button[data-metric]'); if(!b)return;
      state[key]=b.dataset.metric; [...$(containerId).querySelectorAll('button')].forEach(x=>x.classList.toggle('active',x===b)); renderAll();
    });
  }

  async function init(){
    try{
      const [dataRes,soiRes]=await Promise.all([
        fetch('./data/dashboard-data.json',{cache:'no-store'}),
        fetch('./config/soi-reference.json',{cache:'no-store'})
      ]);
      if(!dataRes.ok||!soiRes.ok) throw new Error('No se pudieron cargar las fuentes del dashboard.');
      [DATA,SOI]=await Promise.all([dataRes.json(),soiRes.json()]);
      $('campaign-filter').innerHTML=`<option value="all">Todas</option>`+SOI.campaign_groups.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
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
      console.error(err); document.body.innerHTML=`<main class="page-shell"><div class="coverage-banner"><strong>No se pudieron cargar las fuentes del dashboard.</strong> Sirve esta carpeta con un servidor local o despliega en Vercel.</div></main>`;
    }
  }
  init();
})();
