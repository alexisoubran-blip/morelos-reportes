(() => {
  'use strict';

  const PLATFORM_COLORS = {
    Meta:'#1877F2', Facebook:'#1877F2', Instagram:'#E1306C', TikTok:'#111111',
    Google:'#0d7b4b', 'YouTube / CTV':'#FF0033', Spotify:'#1DB954'
  };
  const MASTER_SOCIAL_VIEWS = {'2026-06':142283,'2026-07':223758};
  const state = {
    mode:'months', week:'2026-06-01', month:'2026-07', fromMonth:'2026-06', toMonth:'2026-07',
    campaign:'all', channel:'all', socialPlatform:'all', performanceMetric:'spend', socialMetric:'follows', analyticsMetric:'active_users'
  };
  let DATA=null, SOI=null;
  const $=id=>document.getElementById(id);
  const money=v=>v==null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
  const moneyExact=v=>v==null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v);
  const integer=v=>v==null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(v);
  const exact=v=>v==null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v);
  const compact=v=>{
    if(v==null||Number.isNaN(v))return '—';
    if(Math.abs(v)>=1e6)return `${(v/1e6).toFixed(v>=1e7?1:2).replace(/\.0$/,'')}M`;
    if(Math.abs(v)>=1e3)return `${(v/1e3).toFixed(v>=1e5?0:1).replace(/\.0$/,'')}K`;
    return integer(v);
  };
  const pct=(v,d=1)=>v==null||!Number.isFinite(v)?'—':`${(v*100).toFixed(d)}%`;
  const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const parseDate=s=>new Date(`${s}T12:00:00`);
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const monthLabel=key=>new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(parseDate(`${key}-01`)).replace(/^./,c=>c.toUpperCase());
  const shortDate=d=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short'}).format(d).replace('.','');
  const inRange=(d,r)=>d>=r.start&&d<=r.end;
  const setText=(id,val)=>{$(id).textContent=val};

  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function endOfMonth(key){const [y,m]=key.split('-').map(Number);return new Date(y,m,0,12)}
  function monday(d){const x=new Date(d),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x}
  function getRange(){
    if(state.mode==='week'){const start=parseDate(state.week);return {start,end:addDays(start,6),label:`${shortDate(start)}–${shortDate(addDays(start,6))}`}}
    if(state.mode==='month')return {start:parseDate(`${state.month}-01`),end:endOfMonth(state.month),label:monthLabel(state.month)};
    const from=state.fromMonth<=state.toMonth?state.fromMonth:state.toMonth,to=state.fromMonth<=state.toMonth?state.toMonth:state.fromMonth;
    return {start:parseDate(`${from}-01`),end:endOfMonth(to),label:from===to?monthLabel(from):`${monthLabel(from)} → ${monthLabel(to)}`};
  }
  function allMonths(){return Object.keys(SOI.months).sort()}
  function allWeeks(){const out=[];let d=monday(parseDate(DATA.metadata.export_start)),end=parseDate(DATA.metadata.export_end);while(d<=end){out.push(iso(d));d=addDays(d,7)}return out}
  function renderPeriodControls(){
    document.querySelectorAll('#period-mode button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
    const el=$('period-controls');
    if(state.mode==='week'){
      el.innerHTML=`<select id="week-select">${allWeeks().map(w=>{const d=parseDate(w);return `<option value="${w}" ${w===state.week?'selected':''}>Semana ${shortDate(d)}–${shortDate(addDays(d,6))}</option>`}).join('')}</select>`;
      $('week-select').addEventListener('change',e=>{state.week=e.target.value;renderAll()});
    }else if(state.mode==='month'){
      el.innerHTML=`<select id="month-select">${allMonths().map(m=>`<option value="${m}" ${m===state.month?'selected':''}>${monthLabel(m)}</option>`).join('')}</select>`;
      $('month-select').addEventListener('change',e=>{state.month=e.target.value;renderAll()});
    }else{
      el.innerHTML=`<select id="from-month">${allMonths().map(m=>`<option value="${m}" ${m===state.fromMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}</select><select id="to-month">${allMonths().map(m=>`<option value="${m}" ${m===state.toMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}</select>`;
      $('from-month').addEventListener('change',e=>{state.fromMonth=e.target.value;renderAll()});
      $('to-month').addEventListener('change',e=>{state.toMonth=e.target.value;renderAll()});
    }
  }

  function businessGroup(group=''){
    if(SOI?.campaign_groups?.includes(group))return group;
    if(group==='Mundial'||group==='Mundial / Fútbol')return 'Mundial / Sellos / Futbolito';
    if(group==='AON Store Visits'||group==='AON / Store')return 'AON / Store visits';
    if(group==='Oferton'||group==='Ofertón')return 'Lead ads / Ofertón';
    if(group==='Taco Tuesday')return 'Taco Tuesday';
    return 'Productos / Boost';
  }
  function filteredMeta(range){
    if(!['all','Meta'].includes(state.channel))return [];
    return (DATA.paid.meta_campaigns||[]).filter(r=>inRange(parseDate(r.reporting_start),range)&&(state.campaign==='all'||businessGroup(r.campaign_group)===state.campaign));
  }
  function filteredGoogle(range){
    if(!['all','Google'].includes(state.channel)||state.campaign!=='all')return [];
    return (DATA.paid.google_weekly||[]).filter(r=>inRange(parseDate(r.week_start),range));
  }
  function paidSummary(range){
    const meta=filteredMeta(range),google=filteredGoogle(range);
    const metaSpend=meta.reduce((s,r)=>s+(r.spend||0),0),googleSpend=google.reduce((s,r)=>s+(r.spend||0),0);
    const clicks=meta.reduce((s,r)=>s+(r.link_clicks||0),0),impressions=meta.reduce((s,r)=>s+(r.impressions||0),0);
    return {meta,google,metaSpend,googleSpend,spend:metaSpend+googleSpend,clicks,impressions,coverage:'Meta y Google/YouTube cargados con temporalidad semanal desde el Data Hub. El split Google vs YouTube/CTV se conserva en Overview.'};
  }

  function aggregateNullable(values){const known=values.filter(v=>v!=null);return known.length?values.reduce((s,v)=>s+(v||0),0):null}
  function soiMonthKeys(range){
    if(state.mode==='week')return [];
    const keys=[];let c=new Date(range.start.getFullYear(),range.start.getMonth(),1,12),e=new Date(range.end.getFullYear(),range.end.getMonth(),1,12);
    while(c<=e){keys.push(monthKey(c));c=new Date(c.getFullYear(),c.getMonth()+1,1,12)}
    return keys.every(k=>SOI.months[k])?keys:[];
  }
  function soiSummary(range){
    const keys=soiMonthKeys(range);
    if(!keys.length)return {usable:false,reason:'Cierre real disponible por mes para junio y julio de 2026.',blocks:[],channels:{},actual:null,campaigns:null};
    const months=keys.map(k=>SOI.months[k]);
    const allBlocks=SOI.campaign_groups.map(name=>({name,actual:aggregateNullable(months.map(m=>m.blocks.find(b=>b.name===name)?.actual??null))}));
    const channels=Object.fromEntries(SOI.channels.map(name=>[name,aggregateNullable(months.map(m=>m.channels_actual[name]??null))]));
    const blocks=state.campaign==='all'?allBlocks:allBlocks.filter(b=>b.name===state.campaign);
    let actual;if(state.channel!=='all')actual=channels[state.channel]??null;else if(state.campaign!=='all')actual=blocks[0]?.actual??null;else actual=months.reduce((s,m)=>s+m.actual,0);
    return {usable:true,reason:`Cierre Data Hub · ${keys.map(monthLabel).join(' + ')}`,blocks:state.channel==='all'?blocks:[],channels,actual,campaigns:state.channel==='all'?blocks.filter(b=>(b.actual||0)>0).length:null};
  }

  function filteredContent(range){return (DATA.social.content||[]).filter(r=>inRange(parseDate(r.date),range)&&(state.campaign==='all'||businessGroup(r.campaign_group)===state.campaign)&&(state.socialPlatform==='all'||r.platform===state.socialPlatform))}
  function filteredFollows(range){if(state.campaign!=='all')return [];return (DATA.social.follows_daily||[]).filter(r=>inRange(parseDate(r.date),range)&&(state.socialPlatform==='all'||r.platform===state.socialPlatform))}
  function filteredAnalytics(range){return (DATA.analytics.daily||[]).filter(r=>inRange(parseDate(r.date),range))}
  function exactAggregateRange(range){return iso(range.start)===DATA.metadata.export_start&&iso(range.end)===DATA.metadata.export_end}
  function aggregateGa4(){const rows=DATA.analytics.daily||[];return {views:rows.reduce((s,r)=>s+(r.views||0),0),events:rows.reduce((s,r)=>s+(r.event_count||0),0)}}
  function masterSocialViews(range){
    if(state.socialPlatform!=='all'||state.campaign!=='all')return null;
    if(state.mode==='month')return MASTER_SOCIAL_VIEWS[state.month]??null;
    if(state.mode==='months'){
      const keys=soiMonthKeys(range);if(keys.length)return keys.reduce((s,k)=>s+(MASTER_SOCIAL_VIEWS[k]||0),0);
    }
    return null;
  }

  function renderCoverage(range,paid){
    const notes=[`<strong>${esc(range.label)}.</strong> Fuente operativa: Morelos Marketing Data Hub.`,paid.coverage,'Social combinado usa el rollup validado para evitar duplicar Views de crossposts.'];
    if(!exactAggregateRange(range))notes.push('GA4: Page Views y Events solo están validados como agregado Jun–Jul; no se imputan a meses individuales.');
    if(state.campaign!=='all')notes.push('El filtro de campaña usa la taxonomía canónica del Data Hub.');
    $('coverage-banner').innerHTML=notes.join(' &nbsp;·&nbsp; ');
  }
  function renderOverview(soi){setText('kpi-spend',moneyExact(soi.actual));setText('kpi-spend-note',soi.reason);setText('kpi-campaigns',soi.campaigns==null?'—':integer(soi.campaigns));renderCampaignSplit(soi);renderChannelInvestment(soi)}
  function renderCampaignSplit(soi){
    if(!soi.usable){$('campaign-split').innerHTML=empty(soi.reason);return}if(state.channel!=='all'){$('campaign-split').innerHTML=empty('El cierre mensual no cruza campaña × canal.');return}
    const rows=soi.blocks;if(!rows.length){$('campaign-split').innerHTML=empty('Sin inversión registrada.');return}const max=Math.max(...rows.map(r=>r.actual||0),1);
    $('campaign-split').innerHTML=rows.map(r=>`<div class="rank-row"><div class="rank-label">${esc(r.name)}</div><div class="rank-track"><div class="rank-fill" title="${esc(r.name)} · ${moneyExact(r.actual)}" style="width:${(r.actual||0)/max*100}%;background:${PLATFORM_COLORS.Meta}"></div></div><div class="rank-value">${moneyExact(r.actual)}</div></div>`).join('')+`<div class="rank-row total-row"><div class="rank-label">TOTAL</div><div class="rank-track"><div class="rank-fill" style="width:100%;background:var(--green)"></div></div><div class="rank-value">${moneyExact(soi.actual)}</div></div>`;
  }
  function renderChannelInvestment(soi){
    if(!soi.usable){$('channel-investment').innerHTML=empty(soi.reason);return}if(state.campaign!=='all'){$('channel-investment').innerHTML=empty('El cierre mensual no cruza campaña × canal.');return}
    const total=Math.max(soi.actual||0,1),names=state.channel==='all'?SOI.channels:SOI.channels.filter(n=>n===state.channel);
    $('channel-investment').innerHTML=names.map(name=>{const v=soi.channels[name];return `<div class="channel-card"><div class="channel-name"><span>${esc(name)}</span><span>${v==null?'—':pct(v/total)}</span></div><strong>${moneyExact(v)}</strong><small>${v==null?'Sin inversión registrada':'Cierre Data Hub'}</small><div class="channel-progress"><i style="width:${v==null?0:v/total*100}%;background:${PLATFORM_COLORS[name]||'#0d7b4b'}"></i></div></div>`}).join('');
  }

  function groupMeta(meta){const map=new Map();meta.forEach(r=>{const group=businessGroup(r.campaign_group),x=map.get(group)||{group,spend:0,impressions:0,clicks:0};x.spend+=r.spend||0;x.impressions+=r.impressions||0;x.clicks+=r.link_clicks||0;map.set(group,x)});return [...map.values()].sort((a,b)=>b.spend-a.spend)}
  function renderPerformance(paid){setText('perf-spend',money(paid.spend));setText('perf-spend-note',paid.coverage);setText('perf-clicks',paid.meta.length?compact(paid.clicks):'—');renderPlatformPerformance(paid);renderCampaignCards(paid)}
  function renderPlatformPerformance(paid){
    const metric=state.performanceMetric,label=metric==='spend'?'Inversión':metric==='impressions'?'Impresiones':'Link clicks',fmt=metric==='spend'?money:compact;
    const metaValue=metric==='spend'?paid.metaSpend:metric==='impressions'?paid.impressions:paid.clicks,googleValue=metric==='spend'?paid.googleSpend:null;
    const cards=[{name:'Meta',value:['all','Meta'].includes(state.channel)?metaValue:null,note:'Fuente: Meta Ads / Data Hub'},{name:'Google',value:['all','Google'].includes(state.channel)&&state.campaign==='all'?googleValue:null,note:metric==='spend'?'Google ecosystem semanal':'Sin breakdown de eficiencia para Google ecosystem'},{name:'TikTok',value:null,note:'Sin fuente integrada'}];
    $('platform-performance').innerHTML=cards.map(c=>`<div class="platform-card ${c.value==null?'muted-platform':''}" style="${c.value!=null?`background:${PLATFORM_COLORS[c.name]||'#064a31'}`:''}"><div class="platform-top"><h4>${c.name}</h4><span class="status-chip ${c.value==null?'muted':''}">${label}</span></div><div class="platform-value">${c.value==null?'—':fmt(c.value)}</div><p>${esc(c.note)}</p></div>`).join('');
  }
  function renderCampaignCards(paid){
    const rows=groupMeta(paid.meta).filter(x=>x.spend>0).slice(0,9);if(!rows.length){$('campaign-cards').innerHTML=empty('Sin campañas Meta con inversión para este filtro.');return}
    $('campaign-cards').innerHTML=rows.map(r=>{const ctr=r.impressions?r.clicks/r.impressions:null,cpc=r.clicks?r.spend/r.clicks:null,cpm=r.impressions?r.spend/r.impressions*1000:null;return `<article class="campaign-card"><h4>${esc(r.group)}</h4><div class="big">${money(r.spend)}</div><div class="metric-row"><div class="mini-metric"><span>Impressions</span><strong>${compact(r.impressions)}</strong></div><div class="mini-metric"><span>Clicks</span><strong>${compact(r.clicks)}</strong></div><div class="mini-metric"><span>CTR</span><strong>${pct(ctr)}</strong></div><div class="mini-metric"><span>CPC / CPM</span><strong>${cpc==null?'—':money(cpc)} / ${cpm==null?'—':money(cpm)}</strong></div></div></article>`}).join('');
  }

  function renderSocial(range){
    document.querySelectorAll('#social-platform-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.platform===state.socialPlatform));
    const content=filteredContent(range),follows=filteredFollows(range),validatedViews=masterSocialViews(range),rawViews=content.reduce((s,r)=>s+(r.views||0),0),views=validatedViews??rawViews,interactions=content.reduce((s,r)=>s+(r.interactions||0),0),reach=content.reduce((s,r)=>s+(r.reach||0),0),followCount=follows.reduce((s,r)=>s+(r.follows||0),0);
    setText('social-platforms',state.socialPlatform==='all'?'Facebook + Instagram':state.socialPlatform);setText('social-platforms-note',state.socialPlatform==='TikTok'?'Fuente aún no integrada':'Meta Business Suite');setText('social-follows',state.campaign==='all'&&follows.length?compact(followCount):'—');setText('social-views',content.length||validatedViews!=null?compact(views):'—');setText('social-interactions',content.length?compact(interactions):'—');setText('social-er',content.length&&reach?pct(interactions/reach):'—');renderSocialChart(content,follows);renderBoosted(content);renderTopContent(content);return {content,follows,views,interactions,reach,followCount};
  }
  function bucketKey(date,grain){if(grain==='day')return iso(date);if(grain==='month')return monthKey(date);return iso(monday(date))}
  function bucketLabel(key,grain){return grain==='month'?monthLabel(key).replace(' 2026',''):shortDate(parseDate(key))}
  function grainForTrend(){return state.mode==='week'?'day':'week'}
  function renderSocialChart(content,follows){
    const metric=state.socialMetric,grain=grainForTrend();if(metric==='follows'){$('social-chart').innerHTML=empty('El Data Hub aún no tiene el export de nuevos seguidores por fecha.');return}if(!content.length){$('social-chart').innerHTML=empty(state.socialPlatform==='TikTok'?'TikTok sin fuente integrada.':'Sin registros sociales para este filtro.');return}
    const valueFor=r=>metric==='views'?r.views:r.interactions;
    if(state.socialPlatform!=='all'){const map=new Map();content.forEach(r=>{const k=bucketKey(parseDate(r.date),grain);map.set(k,(map.get(k)||0)+valueFor(r))});const rows=[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]));$('social-chart').innerHTML=barChart(rows.map(x=>bucketLabel(x[0],grain)),rows.map(x=>x[1]),{color:PLATFORM_COLORS[state.socialPlatform],caption:'Business Suite por plataforma.'});return}
    const pm=new Map(),keys=new Set();content.forEach(r=>{const k=bucketKey(parseDate(r.date),grain);keys.add(k);if(!pm.has(r.platform))pm.set(r.platform,new Map());const m=pm.get(r.platform);m.set(k,(m.get(k)||0)+valueFor(r))});const ordered=[...keys].sort(),platforms=['Facebook','Instagram'].filter(p=>pm.has(p)),series=platforms.map(p=>({name:p,color:PLATFORM_COLORS[p],values:ordered.map(k=>pm.get(p).get(k)||0)}));$('social-chart').innerHTML=groupedBarChart(ordered.map(k=>bucketLabel(k,grain)),series,{caption:metric==='views'?'La gráfica conserva raw por plataforma; el KPI combinado usa el rollup deduplicado del Data Hub.':'Interacciones por plataforma.'});
  }
  function renderBoosted(content){
    if(state.socialPlatform==='TikTok'){$('boosted-summary').innerHTML=empty('TikTok sin fuente integrada.');return}const fb=content.filter(r=>r.platform==='Facebook'),bv=fb.reduce((s,r)=>s+(r.boosted_views||0),0),br=fb.reduce((s,r)=>s+(r.boosted_reach||0),0);$('boosted-summary').innerHTML=`<div class="boosted-box"><div class="boosted-stat"><span>FB boosted views</span><strong>${bv?compact(bv):'—'}</strong></div><div class="boosted-stat"><span>FB boosted reach</span><strong>${br?compact(br):'—'}</strong></div></div><p class="micro-note">Señal paid reportada por Business Suite; no sustituye el spend de Ads Manager.</p>`;
  }
  function renderTopContent(content){const rows=[...content].sort((a,b)=>b.views-a.views).slice(0,5);if(!rows.length){$('top-content').innerHTML=empty('Sin contenido para este filtro.');return}$('top-content').innerHTML=rows.map((r,i)=>`<div class="content-row"><div class="content-index">${String(i+1).padStart(2,'0')}</div><div class="content-copy"><strong>${esc(r.label||'Contenido')}</strong><small>${r.platform} · ${r.campaign_group||'Always-on'} · ${r.date}</small></div><div class="content-value">${compact(r.views)}<br><small>views</small></div></div>`).join('')}

  function renderAnalytics(range){
    const rows=filteredAnalytics(range),n=rows.length,avgUsers=n?rows.reduce((s,r)=>s+(r.active_users||0),0)/n:0,full=exactAggregateRange(range),tot=aggregateGa4(),views=full?tot.views:null,events=full?tot.events:null;
    setText('ga-users',n?compact(avgUsers):'—');setText('ga-views',views==null?'—':compact(views));setText('ga-events',events==null?'—':compact(events));renderAnalyticsChart(rows,full,tot);renderTrafficSources(full);renderPages(full);return {rows,avgUsers,views,events,full};
  }
  function renderAnalyticsChart(rows,full,tot){
    if(!rows.length){$('analytics-chart').innerHTML=empty('Sin registros GA4 para este filtro.');return}const metric=state.analyticsMetric;if(metric!=='active_users'){if(!full){$('analytics-chart').innerHTML=empty('Page Views y Events están disponibles solo como agregado Jun–Jul. No se distribuyen artificialmente por mes o semana.');return}const v=metric==='views'?tot.views:tot.events;$('analytics-chart').innerHTML=barChart(['Jun–Jul'],[v],{caption:'Total agregado del export GA4.'});return}
    const grain=grainForTrend(),map=new Map(),counts=new Map();rows.forEach(r=>{const k=bucketKey(parseDate(r.date),grain);map.set(k,(map.get(k)||0)+(r.active_users||0));counts.set(k,(counts.get(k)||0)+1)});const series=[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>[k,v/counts.get(k)]);$('analytics-chart').innerHTML=lineChart(series.map(x=>bucketLabel(x[0],grain)),series.map(x=>x[1]),{caption:'Promedio de usuarios activos dentro de cada bucket.'});
  }
  function renderTrafficSources(full){if(!full){$('traffic-sources').innerHTML=empty('Disponible únicamente para el agregado Jun–Jul.');return}const rows=(DATA.analytics.channels.sessions_by_channel||[]).slice(0,7),max=Math.max(...rows.map(r=>r.value),1);$('traffic-sources').innerHTML=rows.map(r=>`<div class="rank-row"><div class="rank-label">${esc(r.channel)}</div><div class="rank-track"><div class="rank-fill" style="width:${r.value/max*100}%"></div></div><div class="rank-value">${compact(r.value)}</div></div>`).join('')}
  function renderPages(full){if(!full){$('top-pages').innerHTML=empty('Disponible únicamente para el agregado Jun–Jul.');return}const rows=(DATA.analytics.pages||[]).slice(0,7),max=Math.max(...rows.map(r=>r.views),1);$('top-pages').innerHTML=rows.map(r=>`<div class="rank-row"><div class="rank-label" title="${esc(r.page)}">${esc(r.page)}</div><div class="rank-track"><div class="rank-fill" style="width:${r.views/max*100}%"></div></div><div class="rank-value">${compact(r.views)}</div></div>`).join('')}

  function renderInsights(soi,paid,social,analytics){
    const groups=groupMeta(paid.meta).filter(x=>x.spend>0),top=groups[0],cards=[];if(soi.actual!=null)cards.push({title:'Inversión real conciliada',body:`El Data Hub registra ${moneyExact(soi.actual)} en el periodo seleccionado.`});if(top)cards.push({title:`${top.group} concentra la mayor inversión Meta`,body:`Representa ${pct(top.spend/Math.max(paid.metaSpend,1))} del spend Meta visible (${money(top.spend)}).`});if(social.views>0)cards.push({title:'Social consolidado con control de crossposts',body:`El periodo acumula ${compact(social.views)} views reportables y ${compact(social.interactions)} interacciones.`});if(analytics.full)cards.push({title:'GA4 agregado Jun–Jul',body:`El periodo registra ${compact(analytics.views)} page views y ${compact(analytics.events)} eventos.`});else if(analytics.rows.length)cards.push({title:'GA4 Active Users sí tiene temporalidad',body:`El promedio diario del corte es ${compact(analytics.avgUsers)} usuarios activos; views/events permanecen sin imputar.`});cards.push({title:'Ventas y offline siguen fuera del modelo',body:'No se calculan KPIs de revenue o incrementalidad sin una fuente válida.'});$('insights-grid').innerHTML=cards.slice(0,6).map((c,i)=>`<article class="insight-card"><b>${String(i+1).padStart(2,'0')}</b><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p></article>`).join('');
  }

  function empty(text){return `<div class="empty-state">${esc(text)}</div>`}
  function barChart(labels,values,opts={}){const W=900,H=240,p={l:52,r:14,t:14,b:44},max=Math.max(...values,1),iw=W-p.l-p.r,ih=H-p.t-p.b,step=iw/Math.max(values.length,1),bw=Math.max(10,Math.min(64,step*.62));const grid=[0,.25,.5,.75,1].map(t=>{const y=p.t+ih*(1-t);return `<line class="grid" x1="${p.l}" y1="${y}" x2="${W-p.r}" y2="${y}"/><text x="${p.l-8}" y="${y+3}" text-anchor="end">${opts.money?money(max*t):compact(max*t)}</text>`}).join('');const bars=values.map((v,i)=>{const h=v/max*ih,x=p.l+i*step+(step-bw)/2,y=p.t+ih-h,fill=opts.color?` style="fill:${opts.color};cursor:pointer"`:'';return `<rect class="bar ${opts.color?'':(i%2?'alt':'')}" x="${x}" y="${y}" width="${bw}" height="${h}" rx="4"${fill}><title>${esc(`${labels[i]}: ${opts.money?moneyExact(v):exact(v)}`)}</title></rect><text x="${x+bw/2}" y="${H-18}" text-anchor="middle">${esc(labels[i])}</text>`}).join('');return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}">${grid}<line class="axis" x1="${p.l}" y1="${p.t+ih}" x2="${W-p.r}" y2="${p.t+ih}"/>${bars}</svg>${opts.caption?`<div class="chart-legend"><span><i class="legend-dot" style="background:${opts.color||'#0d7b4b'}"></i>${esc(opts.caption)}</span></div>`:''}`}
  function groupedBarChart(labels,series,opts={}){const W=900,H=240,p={l:52,r:14,t:14,b:44},all=series.flatMap(s=>s.values),max=Math.max(...all,1),iw=W-p.l-p.r,ih=H-p.t-p.b,step=iw/Math.max(labels.length,1),gw=Math.min(step*.78,92),bw=Math.max(5,gw/Math.max(series.length,1)-3);const grid=[0,.25,.5,.75,1].map(t=>{const y=p.t+ih*(1-t);return `<line class="grid" x1="${p.l}" y1="${y}" x2="${W-p.r}" y2="${y}"/><text x="${p.l-8}" y="${y+3}" text-anchor="end">${compact(max*t)}</text>`}).join('');const bars=labels.map((label,i)=>{const start=p.l+i*step+(step-gw)/2,rects=series.map((s,si)=>{const v=s.values[i]||0,h=v/max*ih,x=start+si*(gw/series.length)+(gw/series.length-bw)/2,y=p.t+ih-h;return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" style="fill:${s.color};cursor:pointer"><title>${esc(`${s.name} · ${label}: ${exact(v)}`)}</title></rect>`}).join('');return `${rects}<text x="${p.l+i*step+step/2}" y="${H-18}" text-anchor="middle">${esc(label)}</text>`}).join('');const legend=series.map(s=>`<span><i class="legend-dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}">${grid}<line class="axis" x1="${p.l}" y1="${p.t+ih}" x2="${W-p.r}" y2="${p.t+ih}"/>${bars}</svg><div class="chart-legend">${legend}${opts.caption?`<span>${esc(opts.caption)}</span>`:''}</div>`}
  function lineChart(labels,values,opts={}){const W=900,H=240,p={l:52,r:14,t:14,b:44},max=Math.max(...values,1),min=Math.min(0,...values),iw=W-p.l-p.r,ih=H-p.t-p.b,range=Math.max(max-min,1),x=i=>p.l+(labels.length<=1?iw/2:i*iw/(labels.length-1)),y=v=>p.t+ih-(v-min)/range*ih;const grid=[0,.25,.5,.75,1].map(t=>{const val=min+range*t,yy=y(val);return `<line class="grid" x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}"/><text x="${p.l-8}" y="${yy+3}" text-anchor="end">${compact(val)}</text>`}).join(''),points=values.map((v,i)=>`${x(i)},${y(v)}`).join(' '),area=`${p.l},${p.t+ih} ${points} ${W-p.r},${p.t+ih}`,ticks=labels.map((l,i)=>`<text x="${x(i)}" y="${H-18}" text-anchor="middle">${esc(l)}</text>`).join(''),dots=values.map((v,i)=>`<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="4"><title>${esc(`${labels[i]}: ${exact(v)}`)}</title></circle>`).join('');return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}">${grid}<polygon class="area" points="${area}"/><polyline class="line" points="${points}"/>${dots}${ticks}</svg>${opts.caption?`<div class="chart-legend"><span><i class="legend-dot"></i>${esc(opts.caption)}</span></div>`:''}`}

  function renderAll(){const range=getRange(),paid=paidSummary(range),soi=soiSummary(range);renderPeriodControls();renderCoverage(range,paid);renderOverview(soi);renderPerformance(paid);const social=renderSocial(range),analytics=renderAnalytics(range);renderInsights(soi,paid,social,analytics)}
  function bindTabs(containerId,key){$(containerId).addEventListener('click',e=>{const b=e.target.closest('button[data-metric]');if(!b)return;state[key]=b.dataset.metric;[...$(containerId).querySelectorAll('button')].forEach(x=>x.classList.toggle('active',x===b));renderAll()})}
  async function init(){
    try{const [dataRes,soiRes]=await Promise.all([fetch('./data/dashboard-data.json',{cache:'no-store'}),fetch('./config/soi-investment.json',{cache:'no-store'})]);if(!dataRes.ok||!soiRes.ok)throw new Error('No se pudieron cargar las fuentes.');[DATA,SOI]=await Promise.all([dataRes.json(),soiRes.json()]);$('campaign-filter').innerHTML=`<option value="all">Todas</option>`+SOI.campaign_groups.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');document.querySelectorAll('#period-mode button').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;renderAll()}));$('campaign-filter').addEventListener('change',e=>{state.campaign=e.target.value;renderAll()});$('channel-filter').addEventListener('change',e=>{state.channel=e.target.value;renderAll()});$('social-platform-tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-platform]');if(!b)return;state.socialPlatform=b.dataset.platform;renderAll()});$('reset-filters').addEventListener('click',()=>{Object.assign(state,{mode:'months',week:'2026-06-01',month:'2026-07',fromMonth:'2026-06',toMonth:'2026-07',campaign:'all',channel:'all',socialPlatform:'all'});$('campaign-filter').value='all';$('channel-filter').value='all';renderAll()});bindTabs('performance-tabs','performanceMetric');bindTabs('social-tabs','socialMetric');bindTabs('analytics-tabs','analyticsMetric');renderAll();}catch(err){console.error(err);document.body.innerHTML=`<main class="page-shell"><div class="coverage-banner"><strong>No se pudieron cargar las fuentes del dashboard.</strong></div></main>`}
  }
  init();
})();
