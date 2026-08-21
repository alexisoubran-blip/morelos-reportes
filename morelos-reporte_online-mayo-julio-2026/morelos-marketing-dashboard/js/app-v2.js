(() => {
  'use strict';

  const COLORS={Meta:'#1877F2',Google:'#0d7b4b','YouTube / CTV':'#FF0033',Facebook:'#1877F2',Instagram:'#E1306C',TikTok:'#111111'};
  const state={mode:'months',week:'2026-06-01',month:'2026-07',fromMonth:'2026-06',toMonth:'2026-07',campaign:'all',channel:'all',socialPlatform:'all',performanceMetric:'spend',socialMetric:'follows',analyticsMetric:'active_users'};
  let DATA=null;
  const $=id=>document.getElementById(id);
  const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const parseDate=s=>new Date(`${s}T12:00:00`);
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const shortDate=d=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short'}).format(d).replace('.','');
  const longDate=s=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',year:'numeric'}).format(parseDate(s)).replace('.','');
  const monthLabel=k=>new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(parseDate(`${k}-01`)).replace(/^./,c=>c.toUpperCase());
  const money=v=>v==null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
  const moneyExact=v=>v==null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v);
  const integer=v=>v==null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(v);
  const compact=v=>{if(v==null||Number.isNaN(v))return '—';if(Math.abs(v)>=1e6)return `${(v/1e6).toFixed(2).replace(/\.00$/,'')}M`;if(Math.abs(v)>=1e3)return `${(v/1e3).toFixed(v>=1e5?0:1).replace(/\.0$/,'')}K`;return integer(v)};
  const pct=(v,d=1)=>v==null||!Number.isFinite(v)?'—':`${(v*100).toFixed(d)}%`;
  const inRange=(s,r)=>{const d=parseDate(s);return d>=r.start&&d<=r.end};
  const sum=(a,key)=>a.reduce((s,r)=>s+(Number(r[key])||0),0);
  const empty=text=>`<div class="empty-state">${esc(text)}</div>`;
  const setText=(id,v)=>{const el=$(id);if(el)el.textContent=v};
  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function endOfMonth(k){const [y,m]=k.split('-').map(Number);return new Date(y,m,0,12)}
  function monday(d){const x=new Date(d),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x}
  function getRange(){
    if(state.mode==='week'){const start=parseDate(state.week);return {start,end:addDays(start,6),label:`${shortDate(start)}–${shortDate(addDays(start,6))}`}}
    if(state.mode==='month')return {start:parseDate(`${state.month}-01`),end:endOfMonth(state.month),label:monthLabel(state.month)};
    const a=state.fromMonth<=state.toMonth?state.fromMonth:state.toMonth,b=state.fromMonth<=state.toMonth?state.toMonth:state.fromMonth;
    return {start:parseDate(`${a}-01`),end:endOfMonth(b),label:a===b?monthLabel(a):`${monthLabel(a)} → ${monthLabel(b)}`};
  }
  function allMonths(){const out=[];let d=new Date(parseDate(DATA.metadata.export_start).getFullYear(),parseDate(DATA.metadata.export_start).getMonth(),1,12),e=parseDate(DATA.metadata.export_end);while(d<=e){out.push(monthKey(d));d=new Date(d.getFullYear(),d.getMonth()+1,1,12)}return out}
  function allWeeks(){const out=[];let d=monday(parseDate(DATA.metadata.export_start)),e=parseDate(DATA.metadata.export_end);while(d<=e){out.push(iso(d));d=addDays(d,7)}return out}
  function exactAggregateRange(r){return iso(r.start)===DATA.metadata.export_start&&iso(r.end)===DATA.metadata.export_end}

  function renderPeriodControls(){
    document.querySelectorAll('#period-mode button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
    const el=$('period-controls');
    if(state.mode==='week'){
      el.innerHTML=`<select id="week-select">${allWeeks().map(w=>`<option value="${w}" ${w===state.week?'selected':''}>Semana ${shortDate(parseDate(w))}–${shortDate(addDays(parseDate(w),6))}</option>`).join('')}</select>`;
      $('week-select').onchange=e=>{state.week=e.target.value;renderAll()};
    }else if(state.mode==='month'){
      el.innerHTML=`<select id="month-select">${allMonths().map(m=>`<option value="${m}" ${m===state.month?'selected':''}>${monthLabel(m)}</option>`).join('')}</select>`;
      $('month-select').onchange=e=>{state.month=e.target.value;renderAll()};
    }else{
      el.innerHTML=`<select id="from-month">${allMonths().map(m=>`<option value="${m}" ${m===state.fromMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}</select><select id="to-month">${allMonths().map(m=>`<option value="${m}" ${m===state.toMonth?'selected':''}>${monthLabel(m)}</option>`).join('')}</select>`;
      $('from-month').onchange=e=>{state.fromMonth=e.target.value;renderAll()};$('to-month').onchange=e=>{state.toMonth=e.target.value;renderAll()};
    }
  }

  function paidRows(range){return DATA.paid.filter(r=>inRange(r.date,range)&&(state.campaign==='all'||r.campaign_tag===state.campaign)&&(state.channel==='all'||r.platform===state.channel))}
  function socialRows(range){return DATA.social.content.filter(r=>inRange(r.date,range)&&(state.campaign==='all'||r.campaign_tag===state.campaign)&&(state.socialPlatform==='all'||r.platform===state.socialPlatform))}
  function followerRows(range){if(state.campaign!=='all')return [];return DATA.social.followers.filter(r=>inRange(r.date,range)&&(state.socialPlatform==='all'||r.platform===state.socialPlatform))}
  function analyticsDaily(range){if(state.campaign!=='all')return [];return DATA.analytics.daily.filter(r=>inRange(r.date,range))}
  function unique(a){return [...new Set(a.filter(Boolean))]}
  function by(rows,key){const m=new Map();rows.forEach(r=>{const k=r[key]||'Sin tag';if(!m.has(k))m.set(k,[]);m.get(k).push(r)});return m}

  function renderCoverage(range){
    const notes=[`<strong>${esc(range.label)}.</strong> Fuente única: Morelos Marketing Data Hub.`,`Paid y Social responden a tiempo + Campaign_Tag.`];
    if(!exactAggregateRange(range))notes.push('GA4 Sources/Pages están agregados Jun–Jul; no se distribuyen artificialmente.');
    if(state.campaign!=='all')notes.push('Followers y usuarios activos no tienen dimensión de campaña y se muestran como no atribuibles.');
    $('coverage-banner').innerHTML=notes.join(' &nbsp;·&nbsp; ');
  }

  function renderOverview(rows){
    const spend=sum(rows,'spend'),groups=by(rows,'campaign_tag'),platforms=by(rows,'platform');
    setText('kpi-spend',moneyExact(spend));setText('kpi-spend-note','Suma directa de 03_PAID_MEDIA');setText('kpi-campaigns',integer([...groups.keys()].filter(k=>k!=='Sin tag').length));
    const crows=[...groups.entries()].map(([name,x])=>({name,value:sum(x,'spend')})).sort((a,b)=>b.value-a.value);
    renderRankList('campaign-split',crows,'money');
    const pRows=[...platforms.entries()].map(([name,x])=>({name,value:sum(x,'spend')})).sort((a,b)=>b.value-a.value),total=Math.max(spend,1);
    $('channel-investment').innerHTML=pRows.length?pRows.map(r=>`<div class="channel-card"><div class="channel-name"><span>${esc(r.name)}</span><span>${pct(r.value/total)}</span></div><strong>${moneyExact(r.value)}</strong><small>03_PAID_MEDIA</small><div class="channel-progress"><i style="width:${r.value/total*100}%;background:${COLORS[r.name]||'#0d7b4b'}"></i></div></div>`).join(''):empty('Sin inversión para este filtro.');
  }

  function paidSummary(rows){return {spend:sum(rows,'spend'),impressions:sum(rows,'impressions'),clicks:sum(rows,'clicks')}}
  function renderPerformance(rows){
    const s=paidSummary(rows),plats=unique(rows.map(r=>r.platform));
    setText('perf-platforms',plats.length?plats.join(' + '):'—');setText('perf-spend',moneyExact(s.spend));setText('perf-impressions',compact(s.impressions));setText('perf-clicks',compact(s.clicks));
    const groups=by(rows,'platform');
    $('platform-performance').innerHTML=[...groups.entries()].map(([name,x])=>{const m=state.performanceMetric,v=m==='spend'?sum(x,'spend'):m==='impressions'?sum(x,'impressions'):sum(x,'clicks'),label=m==='spend'?'Inversión':m==='impressions'?'Impresiones':'Link clicks',fmt=m==='spend'?moneyExact:compact;return `<div class="platform-card" style="background:${COLORS[name]||'#064a31'}"><div class="platform-top"><h4>${esc(name)}</h4><span class="status-chip">${label}</span></div><div class="platform-value">${fmt(v)}</div><p>Fuente: 03_PAID_MEDIA</p></div>`}).join('')||empty('Sin datos de plataforma para este filtro.');
    const campaigns=[...by(rows,'campaign_tag').entries()].map(([tag,x])=>({tag,x,spend:sum(x,'spend')})).sort((a,b)=>b.spend-a.spend);
    $('campaign-cards').innerHTML=campaigns.length?campaigns.map(({tag,x,spend})=>{const imp=sum(x,'impressions'),clicks=sum(x,'clicks'),ctr=imp?clicks/imp:null,cpc=clicks?spend/clicks:null,cpm=imp?spend/imp*1000:null;return `<article class="campaign-card"><h4>${esc(tag)}</h4><div class="big">${moneyExact(spend)}</div><div class="metric-row"><div class="mini-metric"><span>Impressions</span><strong>${compact(imp)}</strong></div><div class="mini-metric"><span>Clicks</span><strong>${compact(clicks)}</strong></div><div class="mini-metric"><span>CTR</span><strong>${pct(ctr)}</strong></div><div class="mini-metric"><span>CPC / CPM</span><strong>${cpc==null?'—':moneyExact(cpc)} / ${cpm==null?'—':moneyExact(cpm)}</strong></div></div></article>`}).join(''):empty('Sin campañas para este filtro.');
  }

  function socialMetrics(content,follows){
    const allPlatform=state.socialPlatform==='all';
    const views=content.reduce((s,r)=>s+(allPlatform?(r.views_rollup||0):(r.views||0)),0);
    const likes=sum(content,'likes'),comments=sum(content,'comments'),shares=sum(content,'shares'),saves=sum(content,'saves'),interactions=likes+comments+shares+saves,reach=sum(content,'reach');
    return {views,likes,comments,shares,saves,interactions,reach,posts:content.length,follows:sum(follows,'follows')};
  }
  function renderSocial(range){
    document.querySelectorAll('#social-platform-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.platform===state.socialPlatform));
    const content=socialRows(range),follows=followerRows(range),m=socialMetrics(content,follows);
    setText('social-follows',state.campaign==='all'?compact(m.follows):'—');setText('social-views',compact(m.views));setText('social-posts',integer(m.posts));setText('social-likes',compact(m.likes));setText('social-comments',compact(m.comments));setText('social-shares',compact(m.shares));setText('social-saves',compact(m.saves));setText('social-er',m.reach?pct(m.interactions/m.reach):'—');
    renderSocialChart(content,follows);renderContentMix(content);renderTopContent(content);return m;
  }
  function grain(){return state.mode==='week'?'day':'week'}
  function bucket(date,g){return g==='day'?iso(date):iso(monday(date))}
  function bucketLabel(k){return shortDate(parseDate(k))}
  function renderSocialChart(content,follows){
    const metric=state.socialMetric,source=metric==='follows'?follows:content;if(!source.length){$('social-chart').innerHTML=empty(metric==='follows'&&state.campaign!=='all'?'Followers no tiene Campaign_Tag.':'Sin registros para este filtro.');return}
    const g=grain(),platforms=state.socialPlatform==='all'?unique(source.map(r=>r.platform)):[state.socialPlatform],keys=new Set(),maps={};platforms.forEach(p=>maps[p]=new Map());
    source.forEach(r=>{const k=bucket(parseDate(r.date),g);keys.add(k);let v=0;if(metric==='follows')v=r.follows||0;else if(metric==='views')v=r.views||0;else v=(r.likes||0)+(r.comments||0)+(r.shares||0)+(r.saves||0);const p=r.platform;if(!maps[p])maps[p]=new Map();maps[p].set(k,(maps[p].get(k)||0)+v)});
    const ordered=[...keys].sort(),series=platforms.filter(p=>maps[p]).map(p=>({name:p,color:COLORS[p]||'#0d7b4b',values:ordered.map(k=>maps[p].get(k)||0)}));
    $('social-chart').innerHTML=groupedBarChart(ordered.map(bucketLabel),series,{suffix:metric==='follows'?'followers':metric==='views'?'views':'interacciones'});
  }
  function renderContentMix(content){
    const rows=[...by(content,'pillar').entries()].map(([name,x])=>({name,value:x.length})).sort((a,b)=>b.value-a.value).slice(0,7);renderRankList('content-mix',rows,'integer');
  }
  function platformBadge(p){const c=p==='Facebook'?'fb':p==='Instagram'?'ig':p==='TikTok'?'tt':'other';return `<span class="platform-badge ${c}">${esc(p==='Facebook'?'FB':p==='Instagram'?'IG':p==='TikTok'?'TT':p)}</span>`}
  function renderTopContent(content){
    const rows=[...content].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,6);if(!rows.length){$('top-content').innerHTML=empty('Sin contenido para este filtro.');return}
    $('top-content').innerHTML=rows.map((r,i)=>`<div class="content-row"><div class="content-index">${String(i+1).padStart(2,'0')}</div><div class="content-copy"><div class="content-meta">${platformBadge(r.platform)}<span>${esc(longDate(r.date))}</span>${r.campaign_tag?`<span>· ${esc(r.campaign_tag)}</span>`:''}</div><strong title="${esc(r.caption)}">${esc(r.caption)}</strong><small>${esc(r.pillar||'Sin pilar')} · ${esc(r.format||'Post')}</small></div><div class="content-value">${compact(r.views)}<br><small>views</small></div></div>`).join('');
  }

  function renderAnalytics(range){
    const daily=analyticsDaily(range),full=exactAggregateRange(range),avg=daily.length?sum(daily,'active_users')/daily.length:null;
    const pageRows=full?(state.campaign==='all'?DATA.analytics.pages:DATA.analytics.pages.filter(r=>r.campaign_tag===state.campaign)):[];
    const pageViews=full&&pageRows.length?sum(pageRows,'views'):null;
    const events=full&&state.campaign==='all'?sum(DATA.analytics.channels,'events'):null;
    setText('ga-users',avg==null?'—':compact(avg));setText('ga-views',pageViews==null?'—':compact(pageViews));setText('ga-events',events==null?'—':compact(events));
    renderAnalyticsChart(daily,full,pageViews,events);renderTrafficSources(full);renderPages(full,pageRows);return {avg,pageViews,events};
  }
  function renderAnalyticsChart(daily,full,pageViews,events){
    if(state.analyticsMetric!=='active_users'){
      if(!full){$('analytics-chart').innerHTML=empty('Views y Events están agregados Jun–Jul en el Sheet; no se reparten por mes/semana.');return}
      if(state.campaign!=='all'&&state.analyticsMetric==='event_count'){$('analytics-chart').innerHTML=empty('Events no tiene cruce Campaign_Tag × periodo en el export actual.');return}
      const v=state.analyticsMetric==='views'?pageViews:events;if(v==null){$('analytics-chart').innerHTML=empty('Sin valor atribuible para este filtro.');return}$('analytics-chart').innerHTML=barChart(['Jun–Jul'],[v],{caption:state.analyticsMetric==='views'?'Page Views':'Events'});return;
    }
    if(state.campaign!=='all'){$('analytics-chart').innerHTML=empty('Usuarios activos no tiene Campaign_Tag en GA4.');return}
    if(!daily.length){$('analytics-chart').innerHTML=empty('Sin usuarios activos para este periodo.');return}
    const g=grain(),m=new Map(),n=new Map();daily.forEach(r=>{const k=bucket(parseDate(r.date),g);m.set(k,(m.get(k)||0)+(r.active_users||0));n.set(k,(n.get(k)||0)+1)});const rows=[...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>[k,v/n.get(k)]);$('analytics-chart').innerHTML=lineChart(rows.map(x=>bucketLabel(x[0])),rows.map(x=>x[1]),{caption:'Promedio de usuarios activos'});
  }
  function renderTrafficSources(full){
    if(!full){$('traffic-sources').innerHTML=empty('Disponible para Jun–Jul completo.');return}
    if(state.campaign!=='all'){$('traffic-sources').innerHTML=empty('El export de Channels no cruza fuente × Campaign_Tag.');return}
    const rows=[...DATA.analytics.channels].sort((a,b)=>b.sessions-a.sessions).slice(0,8).map(r=>({name:r.channel,value:r.sessions}));renderRankList('traffic-sources',rows,'integer');
  }
  function renderPages(full,rows){
    if(!full){$('top-pages').innerHTML=empty('Disponible para Jun–Jul completo.');return}
    const out=[...rows].sort((a,b)=>b.views-a.views).slice(0,8).map(r=>({name:r.page,value:r.views,tooltip:`${r.page} · ${integer(r.views)} views${r.campaign_tag?` · ${r.campaign_tag}`:''}`}));
    if(!out.length){$('top-pages').innerHTML=empty(state.campaign==='all'?'Sin páginas en la fuente.':'No hay páginas mapeadas a esta campaña.');return}renderRankList('top-pages',out,'integer');
  }

  function renderRankList(id,rows,fmt='integer'){
    const el=$(id);if(!rows.length){el.innerHTML=empty('Sin datos para este filtro.');return}const max=Math.max(...rows.map(r=>r.value),1),formatter=fmt==='money'?moneyExact:fmt==='integer'?compact:integer;
    el.innerHTML=rows.map(r=>`<div class="rank-row"><div class="rank-label" title="${esc(r.name)}">${esc(r.name)}</div><div class="rank-track"><div class="rank-fill" data-tooltip="${esc(r.tooltip||`${r.name}: ${formatter(r.value)}`)}" style="width:${r.value/max*100}%"></div></div><div class="rank-value">${formatter(r.value)}</div></div>`).join('');
  }

  function barChart(labels,values,opts={}){const W=900,H=240,p={l:52,r:14,t:14,b:44},max=Math.max(...values,1),iw=W-p.l-p.r,ih=H-p.t-p.b,step=iw/Math.max(values.length,1),bw=Math.max(10,Math.min(64,step*.62));const grid=[0,.25,.5,.75,1].map(t=>{const y=p.t+ih*(1-t);return `<line class="grid" x1="${p.l}" y1="${y}" x2="${W-p.r}" y2="${y}"/><text x="${p.l-8}" y="${y+3}" text-anchor="end">${compact(max*t)}</text>`}).join('');const bars=values.map((v,i)=>{const h=v/max*ih,x=p.l+i*step+(step-bw)/2,y=p.t+ih-h;return `<rect class="bar" x="${x}" y="${y}" width="${bw}" height="${h}" rx="4" data-tooltip="${esc(`${labels[i]} · ${integer(v)} ${opts.caption||''}`)}"></rect><text x="${x+bw/2}" y="${H-18}" text-anchor="middle">${esc(labels[i])}</text>`}).join('');return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}">${grid}<line class="axis" x1="${p.l}" y1="${p.t+ih}" x2="${W-p.r}" y2="${p.t+ih}"/>${bars}</svg>`}
  function groupedBarChart(labels,series,opts={}){const W=900,H=240,p={l:52,r:14,t:14,b:44},all=series.flatMap(s=>s.values),max=Math.max(...all,1),iw=W-p.l-p.r,ih=H-p.t-p.b,step=iw/Math.max(labels.length,1),gw=Math.min(step*.78,92),bw=Math.max(5,gw/Math.max(series.length,1)-3);const grid=[0,.25,.5,.75,1].map(t=>{const y=p.t+ih*(1-t);return `<line class="grid" x1="${p.l}" y1="${y}" x2="${W-p.r}" y2="${y}"/><text x="${p.l-8}" y="${y+3}" text-anchor="end">${compact(max*t)}</text>`}).join('');const bars=labels.map((label,i)=>{const start=p.l+i*step+(step-gw)/2,rects=series.map((s,si)=>{const v=s.values[i]||0,h=v/max*ih,x=start+si*(gw/series.length)+(gw/series.length-bw)/2,y=p.t+ih-h;return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" style="fill:${s.color}" data-tooltip="${esc(`${s.name} · ${label} · ${integer(v)} ${opts.suffix||''}`)}"></rect>`}).join('');return `${rects}<text x="${p.l+i*step+step/2}" y="${H-18}" text-anchor="middle">${esc(label)}</text>`}).join('');const legend=series.map(s=>`<span><i class="legend-dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}">${grid}<line class="axis" x1="${p.l}" y1="${p.t+ih}" x2="${W-p.r}" y2="${p.t+ih}"/>${bars}</svg><div class="chart-legend">${legend}</div>`}
  function lineChart(labels,values,opts={}){const W=900,H=240,p={l:52,r:14,t:14,b:44},max=Math.max(...values,1),min=Math.min(0,...values),iw=W-p.l-p.r,ih=H-p.t-p.b,range=Math.max(max-min,1),x=i=>p.l+(labels.length<=1?iw/2:i*iw/(labels.length-1)),y=v=>p.t+ih-(v-min)/range*ih;const grid=[0,.25,.5,.75,1].map(t=>{const val=min+range*t,yy=y(val);return `<line class="grid" x1="${p.l}" y1="${yy}" x2="${W-p.r}" y2="${yy}"/><text x="${p.l-8}" y="${yy+3}" text-anchor="end">${compact(val)}</text>`}).join(''),points=values.map((v,i)=>`${x(i)},${y(v)}`).join(' '),area=`${p.l},${p.t+ih} ${points} ${W-p.r},${p.t+ih}`,ticks=labels.map((l,i)=>`<text x="${x(i)}" y="${H-18}" text-anchor="middle">${esc(l)}</text>`).join(''),dots=values.map((v,i)=>`<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="5" data-tooltip="${esc(`${labels[i]} · ${integer(v)} ${opts.caption||''}`)}"></circle>`).join('');return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}">${grid}<polygon class="area" points="${area}"/><polyline class="line" points="${points}"/>${dots}${ticks}</svg>`}

  function renderInsights(paid,social,analytics){
    const rows=[];const p=paidSummary(paid);if(p.spend)rows.push({t:'Inversión conciliada',b:`${moneyExact(p.spend)} en el filtro actual, calculado exclusivamente desde 03_PAID_MEDIA.`});if(social.posts)rows.push({t:'Volumen editorial',b:`${integer(social.posts)} publicaciones y ${compact(social.views)} views bajo el filtro actual.`});if(analytics.avg!=null)rows.push({t:'Actividad digital',b:`${compact(analytics.avg)} usuarios activos diarios promedio en el periodo seleccionado.`});$('insights-grid').innerHTML=rows.length?rows.map((r,i)=>`<article class="insight-card"><b>0${i+1}</b><h3>${esc(r.t)}</h3><p>${esc(r.b)}</p></article>`).join(''):empty('Sin señales comparables para este filtro.');
  }

  function renderAll(){const range=getRange();renderPeriodControls();renderCoverage(range);const paid=paidRows(range);renderOverview(paid);renderPerformance(paid);const social=renderSocial(range);const analytics=renderAnalytics(range);renderInsights(paid,social,analytics)}
  function bindTabs(id,key){$(id).addEventListener('click',e=>{const b=e.target.closest('button[data-metric]');if(!b)return;state[key]=b.dataset.metric;[...$(id).querySelectorAll('button')].forEach(x=>x.classList.toggle('active',x===b));renderAll()})}
  function setupTooltip(){const tip=document.createElement('div');tip.className='chart-tooltip';document.body.appendChild(tip);document.addEventListener('pointermove',e=>{const t=e.target.closest?.('[data-tooltip]');if(!t){tip.classList.remove('show');return}tip.textContent=t.dataset.tooltip;tip.classList.add('show');tip.style.left=`${e.clientX+14}px`;tip.style.top=`${e.clientY+14}px`});document.addEventListener('pointerleave',()=>tip.classList.remove('show'))}
  async function init(){
    try{
      const [paidRes,followersRes,s1Res,s2Res,analyticsRes]=await Promise.all(['./data/paid-v2.json','./data/followers-v2.json','./data/social-content-1.json','./data/social-content-2.json','./data/analytics-v2.json'].map(u=>fetch(u,{cache:'no-store'})));if([paidRes,followersRes,s1Res,s2Res,analyticsRes].some(r=>!r.ok))throw new Error('No se pudieron cargar las fuentes V2');const [pd,fo,s1,s2,an]=await Promise.all([paidRes.json(),followersRes.json(),s1Res.json(),s2Res.json(),analyticsRes.json()]);const hydrate=(rows,fields)=>rows.map(a=>Object.fromEntries(fields.map((f,i)=>[f,a[i]])));DATA={metadata:an.metadata,paid:hydrate(pd.rows,pd.schema),social:{followers:hydrate(fo.rows,fo.schema),content:hydrate([...s1.rows,...s2.rows],s1.schema)},analytics:{daily:hydrate(an.daily,an.schema.daily),channels:hydrate(an.channels,an.schema.channels),pages:hydrate(an.pages,an.schema.pages)}};
      const tags=unique([...DATA.paid.map(r=>r.campaign_tag),...DATA.social.content.map(r=>r.campaign_tag),...DATA.analytics.pages.map(r=>r.campaign_tag)]).sort();$('campaign-filter').innerHTML=`<option value="all">Todas</option>`+tags.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
      const channels=unique(DATA.paid.map(r=>r.platform));$('channel-filter').innerHTML=`<option value="all">Todos</option>`+channels.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
      const sp=unique(DATA.social.content.map(r=>r.platform));$('social-platform-tabs').innerHTML=`<button class="active" data-platform="all">Todas</button>`+sp.map(x=>`<button data-platform="${esc(x)}">${esc(x)}</button>`).join('');
      document.querySelectorAll('#period-mode button').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;renderAll()});$('campaign-filter').onchange=e=>{state.campaign=e.target.value;renderAll()};$('channel-filter').onchange=e=>{state.channel=e.target.value;renderAll()};$('social-platform-tabs').onclick=e=>{const b=e.target.closest('button[data-platform]');if(!b)return;state.socialPlatform=b.dataset.platform;renderAll()};$('reset-filters').onclick=()=>{Object.assign(state,{mode:'months',week:'2026-06-01',month:'2026-07',fromMonth:'2026-06',toMonth:'2026-07',campaign:'all',channel:'all',socialPlatform:'all',performanceMetric:'spend',socialMetric:'follows',analyticsMetric:'active_users'});$('campaign-filter').value='all';$('channel-filter').value='all';renderAll()};
      bindTabs('performance-tabs','performanceMetric');bindTabs('social-tabs','socialMetric');bindTabs('analytics-tabs','analyticsMetric');setupTooltip();renderAll();
    }catch(err){console.error(err);document.body.innerHTML=`<main class="page-shell"><div class="coverage-banner"><strong>No se pudo cargar la capa de datos del Sheet.</strong></div></main>`}
  }
  init();
})();
