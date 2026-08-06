(() => {
  'use strict';
  const DATA = window.REPORT_DATA;
  const rows = DATA.rows;
  const creatives = DATA.creatives;
  const SOCIAL = window.SOCIAL_DATA || {meta:{},posts:[]};
  const socialPosts = SOCIAL.posts || [];
  const state = {month:'All',agency:'All',platform:'All',objective:'All',category:'All',search:'',sort:'Spend',dir:'desc'};
  const socialState = {month:'All',platform:'All',format:'All',search:''};
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('en-US');
  const moneyFmt = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
  const money2Fmt = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2});
  const money = v => moneyFmt.format(Number(v)||0);
  const money2 = v => money2Fmt.format(Number(v)||0);
  const compact = new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1});
  const pct = (v,d=2) => Number.isFinite(v) ? `${(v*100).toFixed(d)}%` : '—';
  const safe = (a,b) => b ? a/b : 0;
  const sum = (items,key) => items.reduce((acc,row)=>acc+(Number(row[key])||0),0);
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const monthLabel = m => ({'2026-05':'Mayo','2026-06':'Junio','2026-07':'Julio'})[m] || m;
  const colors = {WDM:'var(--green-800)',Sensis:'var(--mustard)'};
  const tooltip = document.createElement('div'); tooltip.className='tooltip'; document.body.appendChild(tooltip);

  function showTip(event, html){tooltip.innerHTML=html;tooltip.classList.add('visible');moveTip(event)}
  function moveTip(event){tooltip.style.left=`${event.clientX}px`;tooltip.style.top=`${event.clientY}px`}
  function hideTip(){tooltip.classList.remove('visible')}
  function bindTips(root=document){root.querySelectorAll('[data-tip]').forEach(el=>{el.onmouseenter=e=>showTip(e,el.dataset.tip);el.onmousemove=moveTip;el.onmouseleave=hideTip})}

  function activeRows(){
    return rows.filter(r =>
      (state.month==='All'||r.Month===state.month) &&
      (state.agency==='All'||r.Agency===state.agency) &&
      (state.platform==='All'||r.Platform===state.platform) &&
      (state.objective==='All'||r['Campaign Objective']===state.objective) &&
      (state.category==='All'||r.Category===state.category)
    );
  }
  function aggregate(items, keys){
    const map=new Map();
    items.forEach(r=>{
      const id=keys.map(k=>r[k]).join('¦');
      if(!map.has(id)){
        const base={}; keys.forEach(k=>base[k]=r[k]);
        Object.assign(base,{Spend:0,Impressions:0,Reach:0,Clicks:0,Results:0,Conversions:0,VideoViews:0});
        map.set(id,base);
      }
      const a=map.get(id); ['Spend','Impressions','Reach','Clicks','Results','Conversions','VideoViews'].forEach(k=>a[k]+=Number(r[k])||0);
    });
    return [...map.values()];
  }
  function totals(items){
    const t={Spend:sum(items,'Spend'),Impressions:sum(items,'Impressions'),Reach:sum(items,'Reach'),Clicks:sum(items,'Clicks'),Results:sum(items,'Results'),Conversions:sum(items,'Conversions'),VideoViews:sum(items,'VideoViews')};
    t.CPM=safe(t.Spend*1000,t.Impressions);t.CTR=safe(t.Clicks,t.Impressions);t.CPC=safe(t.Spend,t.Clicks);t.CPA=safe(t.Spend,t.Conversions);return t;
  }

  function fillSelect(id, values, allLabel){
    const el=$(id); el.innerHTML=`<option value="All">${allLabel}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v==='2026-05'?'Mayo 2026':v==='2026-06'?'Junio 2026':v==='2026-07'?'Julio 2026':v)}</option>`).join('');
    el.addEventListener('change',()=>{const key={filterMonth:'month',filterAgency:'agency',filterPlatform:'platform',filterObjective:'objective',filterCategory:'category'}[id];state[key]=el.value;render()});
  }

  function renderHero(t){
    const kpis=[
      ['Inversión',money(t.Spend),'Total media spend'],
      ['Impresiones',compact.format(t.Impressions),'Delivery reportado'],
      ['Clicks',compact.format(t.Clicks),`CTR ${pct(t.CTR)}`],
      ['Conversiones',fmt.format(Math.round(t.Conversions)),'Evento reportado, no ventas']
    ];
    $('heroKpis').innerHTML=kpis.map(([l,v,s])=>`<div class="hero-kpi"><span>${l}</span><b>${v}</b><small>${s}</small></div>`).join('');
  }

  function renderKpis(t){
    const cards=[
      ['Spend',money(t.Spend),'Capital invertido','accent'],
      ['Impresiones',compact.format(t.Impressions),'Delivery',''],
      ['Clicks',compact.format(t.Clicks),'Respuesta',''],
      ['CTR',pct(t.CTR),'Clicks / impressions','accent'],
      ['CPC',money2(t.CPC),'Spend / clicks',''],
      ['Conversiones',fmt.format(Math.round(t.Conversions)),t.Conversions?`CPA ${money2(t.CPA)}`:'Sin señal comparable','caution'],
      ['CPM',money2(t.CPM),'Costo por mil',''],
      ['Reach reportado',compact.format(t.Reach),'No deduplicado','caution'],
      ['Results*',compact.format(t.Results),'Métrica heterogénea','caution'],
      ['Video views',compact.format(t.VideoViews),'Google video',''],
      ['Spend / result',money2(safe(t.Spend,t.Results)),'Solo lectura contextual',''],
      ['Click share',pct(safe(t.Clicks,DATA.meta.initialTotals.clicks),1),'Vs total May–Jul','']
    ];
    $('kpiGrid').innerHTML=cards.map(([l,v,s,c])=>`<div class="kpi-card ${c}"><span>${l}</span><b>${v}</b><small>${s}</small></div>`).join('');
  }

  function renderInsightStrip(items,t){
    const cats=aggregate(items,['Category']).filter(x=>x.Spend>0).sort((a,b)=>b.Spend-a.Spend);
    const agencies=aggregate(items,['Agency']).filter(x=>x.Spend>0);
    const bestClick=[...cats].filter(x=>x.Clicks>=100).sort((a,b)=>safe(a.Spend,a.Clicks)-safe(b.Spend,b.Clicks))[0];
    const conv=[...cats].sort((a,b)=>b.Conversions-a.Conversions)[0];
    const leader=cats[0];
    const wdm=agencies.find(x=>x.Agency==='WDM');
    const pills=[];
    if(leader)pills.push(`<div class="insight-pill"><b>${esc(leader.Category)}</b> concentra ${pct(safe(leader.Spend,t.Spend),1)} del spend filtrado.</div>`);
    if(bestClick)pills.push(`<div class="insight-pill"><b>${esc(bestClick.Category)}</b> registra el CPC de referencia: ${money2(safe(bestClick.Spend,bestClick.Clicks))}.</div>`);
    if(conv&&conv.Conversions>0)pills.push(`<div class="insight-pill"><b>${esc(conv.Category)}</b> concentra ${fmt.format(Math.round(conv.Conversions))} conversiones reportadas.</div>`);
    else pills.push(`<div class="insight-pill warn"><b>Conversión:</b> el corte actual no contiene una señal suficiente para optimizar por revenue.</div>`);
    if(wdm&&t.Conversions>0)pills.push(`<div class="insight-pill"><b>WDM</b> concentra ${pct(safe(wdm.Conversions,t.Conversions),1)} de la señal de conversión del corte.</div>`);
    $('insightStrip').innerHTML=pills.slice(0,4).join('');
  }

  function svgEmpty(){return '<div class="empty-state">No hay datos con los filtros seleccionados.</div>'}

  function parseDate(value){const [y,m,d]=String(value).split('-').map(Number);return new Date(Date.UTC(y,m-1,d))}
  function isoDate(d){return d.toISOString().slice(0,10)}
  function weekStart(value){const d=parseDate(value);const offset=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-offset);return d}
  function shortDate(d){const months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`}
  function weekLabel(start){const end=new Date(start);end.setUTCDate(end.getUTCDate()+6);return `${shortDate(start)}–${shortDate(end)}`}
  function linePath(data,x,y,key){return data.map((d,i)=>`${i?'L':'M'} ${x(i).toFixed(2)} ${y(d[key]).toFixed(2)}`).join(' ')}

  function renderWeekly(items){
    const grouped=new Map();
    items.forEach(row=>{const start=weekStart(row.Date),key=isoDate(start);if(!grouped.has(key))grouped.set(key,{Week:key,Spend:0,Impressions:0,Clicks:0});const d=grouped.get(key);d.Spend+=Number(row.Spend)||0;d.Impressions+=Number(row.Impressions)||0;d.Clicks+=Number(row.Clicks)||0});
    const data=[...grouped.values()].sort((a,b)=>a.Week.localeCompare(b.Week));
    const root=$('weeklyChart');if(!data.length){root.innerHTML=svgEmpty();return}
    const width=850,height=320,pad={l:58,r:92,t:22,b:48},plotW=width-pad.l-pad.r,plotH=height-pad.t-pad.b;
    const maxSpend=Math.max(...data.map(d=>d.Spend),1),maxImp=Math.max(...data.map(d=>d.Impressions),1),maxClicks=Math.max(...data.map(d=>d.Clicks),1);
    const x=i=>pad.l+(data.length===1?plotW/2:plotW*i/(data.length-1));
    const ySpend=v=>pad.t+plotH*(1-v/maxSpend),yImp=v=>pad.t+plotH*(1-v/maxImp),yClicks=v=>pad.t+plotH*(1-v/maxClicks);
    let html=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Tendencia semanal de inversión, impresiones y clicks">`;
    for(let i=0;i<=4;i++){const yy=pad.t+plotH*i/4;html+=`<line class="grid-line" x1="${pad.l}" x2="${width-pad.r}" y1="${yy}" y2="${yy}"/><text class="axis-label axis-spend" x="${pad.l-7}" y="${yy+3}" text-anchor="end">${money(maxSpend*(1-i/4))}</text><text class="axis-label axis-impressions" x="${width-pad.r+8}" y="${yy+3}">${compact.format(maxImp*(1-i/4))}</text><text class="axis-label axis-clicks" x="${width-4}" y="${yy+3}" text-anchor="end">${compact.format(maxClicks*(1-i/4))}</text>`}
    data.forEach((d,i)=>{html+=`<text class="axis-label" x="${x(i)}" y="${height-18}" text-anchor="middle">${shortDate(parseDate(d.Week))}</text>`});
    html+=`<path class="weekly-line spend-line" d="${linePath(data,x,ySpend,'Spend')}"/><path class="weekly-line impressions-line" d="${linePath(data,x,yImp,'Impressions')}"/><path class="weekly-line clicks-line" d="${linePath(data,x,yClicks,'Clicks')}"/>`;
    data.forEach((d,i)=>{const label=weekLabel(parseDate(d.Week));html+=`<circle class="weekly-dot spend-dot" cx="${x(i)}" cy="${ySpend(d.Spend)}" r="4.5" data-tip="<b>${label}</b><br>Inversión: ${money2(d.Spend)}"/><circle class="weekly-dot impressions-dot" cx="${x(i)}" cy="${yImp(d.Impressions)}" r="4.5" data-tip="<b>${label}</b><br>Impresiones: ${fmt.format(Math.round(d.Impressions))}"/><circle class="weekly-dot clicks-dot" cx="${x(i)}" cy="${yClicks(d.Clicks)}" r="4.5" data-tip="<b>${label}</b><br>Clicks: ${fmt.format(Math.round(d.Clicks))}"/>`});
    html+=`</svg><div class="weekly-legend"><span><i class="spend"></i>Inversión</span><span><i class="impressions"></i>Impresiones</span><span><i class="clicks"></i>Clicks</span></div>`;
    root.innerHTML=html;bindTips(root);
  }

  function renderHorizontal(containerId, data, labelKey, valueKey, maxItems=8, splitKey=null){
    const root=$(containerId); const filtered=data.filter(d=>(d[valueKey]||0)>0).sort((a,b)=>b[valueKey]-a[valueKey]).slice(0,maxItems);
    if(!filtered.length){root.innerHTML=svgEmpty();return}
    const width=560,rowH=34,pad={l:170,r:70,t:12,b:12},height=filtered.length*rowH+pad.t+pad.b;
    const max=Math.max(...filtered.map(d=>d[valueKey]),1);
    let html=`<svg viewBox="0 0 ${width} ${height}">`;
    filtered.forEach((d,i)=>{
      const y=pad.t+i*rowH+6;const w=(width-pad.l-pad.r)*d[valueKey]/max;
      html+=`<text class="chart-label" x="${pad.l-8}" y="${y+11}" text-anchor="end">${esc(d[labelKey].length>25?d[labelKey].slice(0,24)+'…':d[labelKey])}</text>`;
      html+=`<rect class="${splitKey?`bar-${String(d[splitKey]).toLowerCase()}`:'bar-wdm'}" data-tip="<b>${esc(d[labelKey])}</b><br>${money2(d[valueKey])}" x="${pad.l}" y="${y}" width="${Math.max(w,1)}" height="16" rx="4"/>`;
      html+=`<text class="chart-value" x="${pad.l+w+7}" y="${y+11}">${money(d[valueKey])}</text>`;
    });
    html+='</svg>';root.innerHTML=html;bindTips(root);
  }

  function renderCategory(items){renderHorizontal('categoryChart',aggregate(items,['Category']),'Category','Spend',8)}

  function renderChannel(items){
    const data=aggregate(items,['Platform']).filter(x=>x.Spend>0);
    if(!data.length){$('channelComparison').innerHTML=svgEmpty();return}
    data.forEach(d=>{d.CPM=safe(d.Spend*1000,d.Impressions);d.CTR=safe(d.Clicks,d.Impressions);d.CPC=safe(d.Spend,d.Clicks)});
    const meta=data.find(d=>d.Platform==='Meta Ads')||{Spend:0,Clicks:0,Impressions:0,Conversions:0,CPM:0,CTR:0,CPC:0};
    const google=data.find(d=>d.Platform==='Google Ads')||{Spend:0,Clicks:0,Impressions:0,Conversions:0,CPM:0,CTR:0,CPC:0};
    const metrics=[['Spend','Spend',money],['Impresiones','Impressions',compact.format.bind(compact)],['Clicks','Clicks',compact.format.bind(compact)],['CTR','CTR',pct],['CPC','CPC',money2],['CPM','CPM',money2]];
    $('channelComparison').innerHTML=`<div class="metric-comparison">${metrics.map(([label,key,formatter])=>{const a=meta[key]||0,b=google[key]||0,total=a+b||1;return `<div class="comparison-row"><span>${label}</span><div class="comparison-track"><i class="meta" style="width:${a/total*100}%" data-tip="Meta Ads: ${formatter(a)}"></i><i class="google" style="width:${b/total*100}%" data-tip="Google Ads: ${formatter(b)}"></i></div><div class="comparison-values">${formatter(a)} / ${formatter(b)}</div></div>`}).join('')}</div><div class="channel-summary"><div class="channel-box"><img src="assets/meta-ads.png" alt="Meta Ads"><div><b>Meta Ads</b><p>${money(meta.Spend)} · ${pct(meta.CTR)} CTR · ${money2(meta.CPC)} CPC · ${fmt.format(Math.round(meta.Conversions))} conv.</p></div></div><div class="channel-box google"><img src="assets/google-ads.png" alt="Google Ads"><div><b>Google Ads</b><p>${money(google.Spend)} · ${pct(google.CTR)} CTR · ${money2(google.CPC)} CPC · ${fmt.format(Math.round(google.Conversions))} conv.</p></div></div></div><div class="legend"><span><i class="wdm"></i>Meta Ads</span><span><i class="sensis"></i>Google Ads</span></div>`;
    bindTips($('channelComparison'));
  }

  function renderScatter(items){
    const campaigns=aggregate(items,['Agency','Campaign','Category','Campaign Objective']).filter(x=>x.Spend>0&&x.Impressions>0);
    const root=$('scatterChart'); if(!campaigns.length){root.innerHTML=svgEmpty();return}
    campaigns.forEach(d=>{d.CTR=safe(d.Clicks,d.Impressions)});
    const width=600,height=315,pad={l:55,r:22,t:18,b:48};
    const maxX=Math.max(...campaigns.map(d=>d.Spend),1),maxY=Math.max(...campaigns.map(d=>d.CTR),.01);
    const x=v=>pad.l+(width-pad.l-pad.r)*Math.sqrt(v/maxX); const y=v=>height-pad.b-(height-pad.t-pad.b)*(v/maxY);
    let html=`<svg viewBox="0 0 ${width} ${height}">`;
    for(let i=0;i<=4;i++){const yy=pad.t+(height-pad.t-pad.b)*i/4;const val=maxY*(1-i/4);html+=`<line class="grid-line" x1="${pad.l}" x2="${width-pad.r}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${pad.l-8}" y="${yy+3}" text-anchor="end">${pct(val,1)}</text>`}
    for(let i=0;i<=4;i++){const xx=pad.l+(width-pad.l-pad.r)*i/4;const val=maxX*(i/4)**2;html+=`<text class="axis-label" x="${xx}" y="${height-22}" text-anchor="middle">${compact.format(val)}</text>`}
    campaigns.forEach(d=>{const r=Math.min(16,Math.max(4,4+Math.sqrt(d.Conversions||0)/5));html+=`<circle class="dot-${d.Agency.toLowerCase()}" data-tip="<b>${esc(d.Campaign)}</b><br>${esc(d.Agency)} · ${esc(d.Category)}<br>Spend ${money2(d.Spend)} · CTR ${pct(d.CTR)} · Conv. ${fmt.format(Math.round(d.Conversions))}" cx="${x(d.Spend)}" cy="${y(d.CTR)}" r="${r}"/>`});
    html+=`<text class="axis-label" x="${(pad.l+width-pad.r)/2}" y="${height-4}" text-anchor="middle">Spend (escala raíz)</text></svg><div class="legend"><span><i class="wdm"></i>WDM</span><span><i class="sensis"></i>Sensis</span></div>`;
    root.innerHTML=html;bindTips(root);
  }

  function renderAgency(items,t){
    const data=aggregate(items,['Agency']).filter(x=>x.Spend>0).sort((a,b)=>b.Spend-a.Spend);
    $('agencyCards').innerHTML=['WDM','Sensis'].map(a=>{
      const d=data.find(x=>x.Agency===a)||{Spend:0,Impressions:0,Clicks:0,Conversions:0,Results:0};
      const cpm=safe(d.Spend*1000,d.Impressions),ctr=safe(d.Clicks,d.Impressions),cpc=safe(d.Spend,d.Clicks),conversionShare=safe(d.Conversions,t.Conversions);
      const highlight=a==='WDM'&&d.Conversions>0?`${pct(conversionShare,1)} de las conversiones reportadas`:a==='Sensis'?`${compact.format(d.Clicks)} clicks de cobertura y tráfico`:`${pct(safe(d.Results,t.Results),1)} de los results*`;
      const note=a==='WDM'?'Mayor contribución de conversiones, contenido y outcomes de intención dentro del periodo.':'Cobertura complementaria en awareness, display, search y campañas legacy.';
      return `<article class="agency-card ${a.toLowerCase()}"><div class="agency-head"><h3>${a}</h3><span>${pct(safe(d.Spend,t.Spend),1)} del spend</span></div><div class="agency-highlight"><b>${highlight}</b><small>${a==='WDM'?'Performance + creatividad + conversión':'Awareness + cobertura + tráfico'}</small></div><div class="agency-metrics"><div class="agency-metric"><span>Spend</span><b>${money(d.Spend)}</b></div><div class="agency-metric"><span>Impresiones</span><b>${compact.format(d.Impressions)}</b></div><div class="agency-metric"><span>CTR</span><b>${pct(ctr)}</b></div><div class="agency-metric"><span>CPC</span><b>${money2(cpc)}</b></div><div class="agency-metric"><span>Clicks</span><b>${compact.format(d.Clicks)}</b></div><div class="agency-metric"><span>CPM</span><b>${money2(cpm)}</b></div><div class="agency-metric"><span>Conv.</span><b>${fmt.format(Math.round(d.Conversions))}</b></div><div class="agency-metric"><span>Results*</span><b>${compact.format(d.Results)}</b></div></div><p class="agency-foot">${note}</p></article>`
    }).join('');

    const byCat=aggregate(items,['Agency','Category']).filter(x=>x.Spend>0).sort((a,b)=>b.Spend-a.Spend);
    renderAgencyCategory(byCat);
    const meta=aggregate(items.filter(x=>x.Platform==='Meta Ads'),['Agency']);
    const w=meta.find(x=>x.Agency==='WDM')||{Spend:0,Impressions:0,Clicks:0,Conversions:0,Results:0};
    const s=meta.find(x=>x.Agency==='Sensis')||{Spend:0,Impressions:0,Clicks:0,Conversions:0,Results:0};
    const wm={CTR:safe(w.Clicks,w.Impressions),CPC:safe(w.Spend,w.Clicks),CPM:safe(w.Spend*1000,w.Impressions)},sm={CTR:safe(s.Clicks,s.Impressions),CPC:safe(s.Spend,s.Clicks),CPM:safe(s.Spend*1000,s.Impressions)};
    $('agencyOutcome').innerHTML=`<div class="outcome-grid"><div class="outcome-card"><span>WDM · Meta Ads</span><b>${pct(wm.CTR)} CTR</b><small>${money2(wm.CPC)} CPC · ${fmt.format(Math.round(w.Conversions))} conversiones · ${compact.format(w.Results)} results*</small></div><div class="outcome-card sensis"><span>Sensis · Meta Ads</span><b>${pct(sm.CTR)} CTR</b><small>${money2(sm.CPC)} CPC · ${fmt.format(Math.round(s.Conversions))} conversiones · ${compact.format(s.Results)} results*</small></div></div><div class="insight-pill" style="margin-top:10px"><b>Lectura equivalente:</b> en Meta Ads, WDM combina mayor CTR, menor CPC y la señal de conversión del periodo; Sensis aporta cobertura de awareness con menor presión de inversión.</div>`;
  }

  function renderAgencyCategory(data){
    const root=$('agencyCategoryChart');if(!data.length){root.innerHTML=svgEmpty();return}
    const cats=[...new Set(data.map(x=>x.Category))].map(cat=>({cat,total:data.filter(x=>x.Category===cat).reduce((s,x)=>s+x.Spend,0)})).sort((a,b)=>b.total-a.total).slice(0,7);
    const width=620,height=300,pad={l:170,r:45,t:12,b:14},rowH=(height-pad.t-pad.b)/cats.length,max=Math.max(...cats.map(c=>c.total),1);
    let html=`<svg viewBox="0 0 ${width} ${height}">`;
    cats.forEach((c,i)=>{const y=pad.t+i*rowH+7;let cursor=pad.l;html+=`<text class="chart-label" x="${pad.l-8}" y="${y+12}" text-anchor="end">${esc(c.cat.length>24?c.cat.slice(0,23)+'…':c.cat)}</text>`;['WDM','Sensis'].forEach(a=>{const v=data.find(x=>x.Category===c.cat&&x.Agency===a)?.Spend||0;const w=(width-pad.l-pad.r)*v/max;if(v>0)html+=`<rect class="bar-${a.toLowerCase()}" data-tip="<b>${esc(c.cat)}</b><br>${a}: ${money2(v)}" x="${cursor}" y="${y}" width="${Math.max(w,1)}" height="18" rx="3"/>`;cursor+=w});html+=`<text class="chart-value" x="${cursor+6}" y="${y+12}">${money(c.total)}</text>`});
    html+='</svg><div class="legend"><span><i class="wdm"></i>WDM</span><span><i class="sensis"></i>Sensis</span></div>';root.innerHTML=html;bindTips(root);
  }

  function renderObjectives(items){
    const data=aggregate(items,['Campaign Objective']).filter(x=>x.Spend>0).sort((a,b)=>b.Spend-a.Spend);
    data.forEach(d=>{d.CPM=safe(d.Spend*1000,d.Impressions);d.CTR=safe(d.Clicks,d.Impressions);d.CPC=safe(d.Spend,d.Clicks)});
    $('objectiveCards').innerHTML=data.slice(0,8).map(d=>`<article class="objective-card"><h3>${esc(d['Campaign Objective'])}</h3><div class="big">${money(d.Spend)}</div><div class="micro"><span>${compact.format(d.Impressions)} impr.</span><span>${compact.format(d.Clicks)} clicks</span></div><div class="micro"><span>CTR ${pct(d.CTR)}</span><span>CPC ${money2(d.CPC)}</span></div></article>`).join('')||svgEmpty();
    const headers=[['Objetivo','Campaign Objective'],['Spend','Spend'],['Impresiones','Impressions'],['Clicks','Clicks'],['Results*','Results'],['Conv.','Conversions'],['CPM','CPM'],['CTR','CTR'],['CPC','CPC']];
    $('objectiveTable').innerHTML=`<thead><tr>${headers.map(([l])=>`<th class="${['Spend','Impresiones','Clicks','Results*','Conv.','CPM','CTR','CPC'].includes(l)?'num':''}">${l}</th>`).join('')}</tr></thead><tbody>${data.map(d=>`<tr><td><b>${esc(d['Campaign Objective'])}</b></td><td class="num">${money2(d.Spend)}</td><td class="num">${fmt.format(Math.round(d.Impressions))}</td><td class="num">${fmt.format(Math.round(d.Clicks))}</td><td class="num">${fmt.format(Math.round(d.Results))}</td><td class="num">${fmt.format(Math.round(d.Conversions))}</td><td class="num">${money2(d.CPM)}</td><td class="num">${pct(d.CTR)}</td><td class="num">${money2(d.CPC)}</td></tr>`).join('')}</tbody>`;
  }

  function renderSocial(items){
    const allowedCampaigns=new Set(aggregate(items.filter(x=>x.Platform==='Meta Ads'),['Campaign']).map(x=>x.Campaign));
    const list=creatives.filter(c=>allowedCampaigns.has(c.Campaign)&&(state.agency==='All'||c.Agency===state.agency)&&(state.objective==='All'||c['Campaign Objective']===state.objective)&&(state.category==='All'||c.Category===state.category)).sort((a,b)=>b.Spend-a.Spend).slice(0,10);
    $('creativeList').innerHTML=list.map((c,i)=>{const ctr=safe(c.Clicks,c.Impressions),cpc=safe(c.Spend,c.Clicks);return `<div class="creative-item"><div class="creative-rank">${i+1}</div><div class="creative-copy"><b>${esc(c.Ad)}</b><span>${esc(c.Agency)} · ${esc(c.Category)} · ${esc(c['Campaign Objective'])}</span></div><div class="creative-metrics"><b>${money(c.Spend)}</b><span>${pct(ctr)} CTR · ${money2(cpc)} CPC · ${fmt.format(Math.round(c.Conversions))} conv.</span></div></div>`}).join('')||'<div class="empty-state">No hay creativos Meta con este filtro.</div>';
    const social=aggregate(items.filter(x=>x.Platform==='Meta Ads'),['Category']);renderHorizontal('socialCategoryChart',social,'Category','Spend',8);
  }

  function campaignRows(items){
    const data=aggregate(items,['Agency','Platform','Campaign Objective','Category','Campaign']).filter(x=>x.Spend>0||x.Impressions>0);
    data.forEach(d=>{d.CPM=safe(d.Spend*1000,d.Impressions);d.CTR=safe(d.Clicks,d.Impressions);d.CPC=safe(d.Spend,d.Clicks)});
    const q=state.search.trim().toLowerCase();
    const filtered=q?data.filter(d=>[d.Agency,d.Platform,d['Campaign Objective'],d.Category,d.Campaign].join(' ').toLowerCase().includes(q)):data;
    filtered.sort((a,b)=>{const av=a[state.sort],bv=b[state.sort];if(typeof av==='string')return state.dir==='asc'?av.localeCompare(bv):bv.localeCompare(av);return state.dir==='asc'?av-bv:bv-av});
    return filtered;
  }

  function renderCampaignTable(items){
    const data=campaignRows(items);$('campaignCount').textContent=`${data.length} campañas`;
    const cols=[['Agencia','Agency'],['Canal','Platform'],['Objetivo','Campaign Objective'],['Categoría','Category'],['Campaña','Campaign'],['Spend','Spend'],['Impr.','Impressions'],['Clicks','Clicks'],['Results*','Results'],['Conv.','Conversions'],['CPM','CPM'],['CTR','CTR'],['CPC','CPC']];
    $('campaignTable').innerHTML=`<thead><tr>${cols.map(([label,key])=>`<th data-sort="${key}" class="${['Spend','Impressions','Clicks','Results','Conversions','CPM','CTR','CPC'].includes(key)?'num':''}">${label}${state.sort===key?(state.dir==='asc'?' ↑':' ↓'):''}</th>`).join('')}</tr></thead><tbody>${data.map(d=>`<tr><td><span class="badge ${d.Agency.toLowerCase()}">${esc(d.Agency)}</span></td><td><span class="badge ${d.Platform==='Meta Ads'?'meta':'google'}">${esc(d.Platform)}</span></td><td>${esc(d['Campaign Objective'])}</td><td>${esc(d.Category)}</td><td><b>${esc(d.Campaign)}</b></td><td class="num">${money2(d.Spend)}</td><td class="num">${fmt.format(Math.round(d.Impressions))}</td><td class="num">${fmt.format(Math.round(d.Clicks))}</td><td class="num">${fmt.format(Math.round(d.Results))}</td><td class="num">${fmt.format(Math.round(d.Conversions))}</td><td class="num">${money2(d.CPM)}</td><td class="num">${pct(d.CTR)}</td><td class="num">${money2(d.CPC)}</td></tr>`).join('')}</tbody>`;
    $('campaignTable').querySelectorAll('th[data-sort]').forEach(th=>th.addEventListener('click',()=>{const key=th.dataset.sort;if(state.sort===key)state.dir=state.dir==='asc'?'desc':'asc';else{state.sort=key;state.dir=typeof data[0]?.[key]==='string'?'asc':'desc'}renderCampaignTable(items)}));
  }

  function fillSocialSelect(id, values, allLabel, stateKey){
    const el=$(id);
    el.innerHTML=`<option value="All">${allLabel}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v==='2026-05'?'Mayo 2026':v==='2026-06'?'Junio 2026':v==='2026-07'?'Julio 2026':v)}</option>`).join('');
    el.addEventListener('change',()=>{socialState[stateKey]=el.value;renderSocialDashboard()});
  }

  function activeSocialPosts(){
    const q=socialState.search.trim().toLowerCase();
    return socialPosts.filter(p=>
      (socialState.month==='All'||p.Month===socialState.month) &&
      (socialState.platform==='All'||p.Platform===socialState.platform) &&
      (socialState.format==='All'||p.Format===socialState.format) &&
      (!q||[p.Caption,p.Platform,p.Format,p.Account].join(' ').toLowerCase().includes(q))
    );
  }

  function socialTotals(items){
    const t={Posts:items.length,Views:sum(items,'Views'),Reach:sum(items,'Reach'),Engagement:sum(items,'Engagement'),Likes:sum(items,'Likes'),Comments:sum(items,'Comments'),Saves:sum(items,'Saves'),Shares:sum(items,'Shares'),PaidViews:sum(items,'PaidViews'),PaidEngagement:sum(items,'PaidEngagement')};
    t.ER=safe(t.Engagement,t.Views);t.ViewsPerPost=safe(t.Views,t.Posts);t.PaidViewShare=safe(t.PaidViews,t.Views);return t;
  }

  function socialAggregate(items,key){
    const map=new Map();
    items.forEach(p=>{
      const label=p[key]||'Sin clasificar';
      if(!map.has(label))map.set(label,{Label:label,Posts:0,Views:0,Reach:0,Engagement:0,Likes:0,Comments:0,Saves:0,Shares:0,PaidViews:0,PaidEngagement:0});
      const d=map.get(label);d.Posts+=1;['Views','Reach','Engagement','Likes','Comments','Saves','Shares','PaidViews','PaidEngagement'].forEach(k=>d[k]+=Number(p[k])||0);
    });
    return [...map.values()].map(d=>({...d,ER:safe(d.Engagement,d.Views),ViewsPerPost:safe(d.Views,d.Posts),PaidViewShare:safe(d.PaidViews,d.Views)}));
  }

  function socialPlatformClass(label){
    if(label==='Instagram')return 'instagram';
    if(label==='Facebook')return 'facebook';
    if(label==='TikTok')return 'tiktok';
    return 'crossposted';
  }

  function socialPlatformMark(label){
    if(label==='Instagram')return 'IG';
    if(label==='Facebook')return 'FB';
    if(label==='TikTok')return 'TT';
    return 'META';
  }

  function renderSocialKpis(items){
    const t=socialTotals(items);
    const cards=[
      ['Posts',fmt.format(t.Posts),'Publicaciones'],
      ['Views',compact.format(t.Views),`${fmt.format(Math.round(t.ViewsPerPost))} por post`],
      ['Engagement',compact.format(t.Engagement),'Likes + comments + saves + shares'],
      ['Engagement Rate',pct(t.ER),'Interacciones / views'],
      ['Reach',compact.format(t.Reach),'No disponible en TikTok'],
      ['Saves + Shares',compact.format(t.Saves+t.Shares),'Señal de utilidad y distribución']
    ];
    $('socialKpis').innerHTML=cards.map(([l,v,s],i)=>`<div class="social-kpi-card ${i===3?'featured':''}"><span>${l}</span><b>${v}</b><small>${s}</small></div>`).join('');
  }

  function renderSocialPlatformCards(items){
    const order={'Instagram':1,'Facebook':2,'Facebook + Instagram':3,'TikTok':4};
    const data=socialAggregate(items,'Platform').sort((a,b)=>(order[a.Label]||9)-(order[b.Label]||9));
    $('socialPlatformCards').innerHTML=data.map(d=>`<article class="platform-performance-card ${socialPlatformClass(d.Label)}"><div class="platform-card-head"><span class="platform-mark">${socialPlatformMark(d.Label)}</span><div><h3>${esc(d.Label)}</h3><small>${fmt.format(d.Posts)} posts</small></div></div><div class="platform-primary"><b>${compact.format(d.Views)}</b><span>views</span></div><div class="platform-metrics"><div><span>ER</span><b>${pct(d.ER)}</b></div><div><span>Engagement</span><b>${compact.format(d.Engagement)}</b></div><div><span>Views / post</span><b>${fmt.format(Math.round(d.ViewsPerPost))}</b></div><div><span>Reach</span><b>${compact.format(d.Reach)}</b></div></div>${d.PaidViews>0?`<div class="paid-share"><span>Views con contribución paid</span><b>${pct(d.PaidViewShare,1)}</b></div>`:''}</article>`).join('')||svgEmpty();
  }

  function renderSocialTimeline(items){
    const grouped=new Map();
    items.forEach(p=>{const start=weekStart(p.Date),key=isoDate(start);if(!grouped.has(key))grouped.set(key,{Week:key,Posts:0,Views:0,Engagement:0});const d=grouped.get(key);d.Posts+=1;d.Views+=Number(p.Views)||0;d.Engagement+=Number(p.Engagement)||0});
    const data=[...grouped.values()].sort((a,b)=>a.Week.localeCompare(b.Week)).map(d=>({...d,ER:safe(d.Engagement,d.Views)}));
    const root=$('socialTimelineChart');if(!data.length){root.innerHTML=svgEmpty();return}
    const width=850,height=330,pad={l:58,r:100,t:25,b:50},plotW=width-pad.l-pad.r,plotH=height-pad.t-pad.b;
    const maxViews=Math.max(...data.map(d=>d.Views),1),maxPosts=Math.max(...data.map(d=>d.Posts),1),maxER=Math.max(...data.map(d=>d.ER),.01);
    const x=i=>pad.l+(data.length===1?plotW/2:plotW*i/(data.length-1));
    const yViews=v=>pad.t+plotH*(1-v/maxViews),yPosts=v=>pad.t+plotH*(1-v/maxPosts),yER=v=>pad.t+plotH*(1-v/maxER);
    let html=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Timeline semanal de publicaciones, views y engagement rate">`;
    for(let i=0;i<=4;i++){const yy=pad.t+plotH*i/4;html+=`<line class="grid-line" x1="${pad.l}" x2="${width-pad.r}" y1="${yy}" y2="${yy}"/><text class="axis-label social-axis-views" x="${pad.l-7}" y="${yy+3}" text-anchor="end">${compact.format(maxViews*(1-i/4))}</text><text class="axis-label social-axis-posts" x="${width-pad.r+8}" y="${yy+3}">${Math.round(maxPosts*(1-i/4))}</text><text class="axis-label social-axis-er" x="${width-4}" y="${yy+3}" text-anchor="end">${pct(maxER*(1-i/4),1)}</text>`}
    data.forEach((d,i)=>{html+=`<text class="axis-label" x="${x(i)}" y="${height-18}" text-anchor="middle">${shortDate(parseDate(d.Week))}</text>`});
    html+=`<path class="weekly-line social-views-line" d="${linePath(data,x,yViews,'Views')}"/><path class="weekly-line social-posts-line" d="${linePath(data,x,yPosts,'Posts')}"/><path class="weekly-line social-er-line" d="${linePath(data,x,yER,'ER')}"/>`;
    data.forEach((d,i)=>{const label=weekLabel(parseDate(d.Week));html+=`<circle class="weekly-dot social-views-dot" cx="${x(i)}" cy="${yViews(d.Views)}" r="4.5" data-tip="<b>${label}</b><br>Views: ${fmt.format(Math.round(d.Views))}"/><circle class="weekly-dot social-posts-dot" cx="${x(i)}" cy="${yPosts(d.Posts)}" r="4.5" data-tip="<b>${label}</b><br>Posts: ${d.Posts}"/><circle class="weekly-dot social-er-dot" cx="${x(i)}" cy="${yER(d.ER)}" r="4.5" data-tip="<b>${label}</b><br>ER: ${pct(d.ER)}"/>`});
    html+=`</svg><div class="weekly-legend social-legend"><span><i class="social-views"></i>Views</span><span><i class="social-posts"></i>Posts</span><span><i class="social-er"></i>Engagement Rate</span></div>`;
    root.innerHTML=html;bindTips(root);
  }

  function renderFormatPerformance(items){
    const data=socialAggregate(items,'Format').sort((a,b)=>b.ER-a.ER);
    const eligible=data.filter(d=>d.Posts>=3);
    const best=eligible[0]||data[0];
    $('bestFormatSummary').innerHTML=best?`<div class="best-format"><span class="format-symbol">${esc(best.Label.slice(0,2).toUpperCase())}</span><div><small>Mejor formato por ER ponderado</small><h3>${esc(best.Label)}</h3><p><b>${pct(best.ER)}</b> ER · ${fmt.format(best.Posts)} posts · ${compact.format(best.Views)} views</p></div></div>`:svgEmpty();
    const maxER=Math.max(...data.map(d=>d.ER),.01);
    $('formatPerformanceChart').innerHTML=data.map(d=>`<div class="format-row"><div class="format-row-label"><b>${esc(d.Label)}</b><span>${d.Posts} posts · ${compact.format(d.Views)} views</span></div><div class="format-track"><i style="width:${Math.max(2,d.ER/maxER*100)}%"></i></div><strong>${pct(d.ER)}</strong></div>`).join('')||svgEmpty();
  }

  function socialPostTitle(caption){
    const clean=String(caption||'Post sin caption').replace(/\s+/g,' ').trim();
    return clean.length>105?clean.slice(0,102)+'…':clean;
  }

  function renderSocialPostList(id,data,metric){
    const root=$(id);
    root.innerHTML=data.slice(0,7).map((p,i)=>`<div class="social-post-item"><div class="social-rank">${i+1}</div><div class="social-post-copy"><div class="social-post-meta"><span class="platform-chip ${socialPlatformClass(p.Platform)}">${esc(p.Platform)}</span><span>${esc(p.Format)}</span><span>${shortDate(parseDate(p.Date))}</span></div><b>${esc(socialPostTitle(p.Caption))}</b><small>${compact.format(p.Views)} views · ${compact.format(p.Engagement)} engagement · ${pct(p.EngagementRate)} ER</small></div><div class="social-post-value"><b>${metric==='Views'?compact.format(p.Views):pct(p.EngagementRate)}</b><span>${metric==='Views'?'views':'ER'}</span></div></div>`).join('')||svgEmpty();
  }

  function renderSocialPostTable(items){
    const data=[...items].sort((a,b)=>b.Date.localeCompare(a.Date)||b.Views-a.Views);
    $('socialPostCount').textContent=`${data.length} posts`;
    $('socialPostTable').innerHTML=`<thead><tr><th>Fecha</th><th>Plataforma</th><th>Formato</th><th>Caption</th><th class="num">Views</th><th class="num">Reach</th><th class="num">Engagement</th><th class="num">ER</th><th class="num">Paid views</th></tr></thead><tbody>${data.map(p=>`<tr><td>${esc(shortDate(parseDate(p.Date)))}</td><td><span class="platform-chip ${socialPlatformClass(p.Platform)}">${esc(p.Platform)}</span></td><td>${esc(p.Format)}</td><td><b>${esc(socialPostTitle(p.Caption))}</b></td><td class="num">${fmt.format(Math.round(p.Views))}</td><td class="num">${fmt.format(Math.round(p.Reach))}</td><td class="num">${fmt.format(Math.round(p.Engagement))}</td><td class="num">${pct(p.EngagementRate)}</td><td class="num">${fmt.format(Math.round(p.PaidViews||0))}</td></tr>`).join('')}</tbody>`;
  }

  function renderSocialStatus(items){
    const t=socialTotals(items);
    const labels=[socialState.month!=='All'?monthLabel(socialState.month):'Mayo–Julio',socialState.platform!=='All'?socialState.platform:'Todas las plataformas',socialState.format!=='All'?socialState.format:'Todos los formatos'];
    $('socialFilterStatus').textContent=`${labels.join(' · ')} · ${t.Posts} posts · ${compact.format(t.Views)} views · ${pct(t.ER)} ER`;
  }

  function renderSocialDashboard(){
    const items=activeSocialPosts();
    renderSocialKpis(items);renderSocialPlatformCards(items);renderSocialTimeline(items);renderFormatPerformance(items);
    renderSocialPostList('topPostsViews',[...items].sort((a,b)=>b.Views-a.Views),'Views');
    renderSocialPostList('topPostsEr',[...items].filter(p=>p.Views>=250).sort((a,b)=>b.EngagementRate-a.EngagementRate||b.Views-a.Views),'ER');
    renderSocialPostTable(items);renderSocialStatus(items);bindTips();
  }

  function exportSocialCsv(){
    const data=activeSocialPosts();
    const headers=['Date','Platform','Format','Caption','Views','Reach','Likes','Comments','Saves','Shares','Engagement','EngagementRate','PaidViews','PaidReach','PaidEngagement'];
    const csv=[headers.join(','),...data.map(r=>headers.map(h=>`"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='morelos-social-media-filtered.csv';a.click();URL.revokeObjectURL(url);
  }

  function renderStatus(items,t){
    const labels=[state.month!=='All'?monthLabel(state.month):'Mayo–Julio',state.agency!=='All'?state.agency:'WDM + Sensis',state.platform!=='All'?state.platform:'Meta + Google',state.objective!=='All'?state.objective:'Todos los objetivos',state.category!=='All'?state.category:'Todas las campañas'];
    $('filterStatus').textContent=`${labels.join(' · ')} · ${items.length} cortes activos · ${money2(t.Spend)} de inversión`;
  }

  function render(){
    const items=activeRows(),t=totals(items);
    renderHero(t);renderKpis(t);renderInsightStrip(items,t);renderWeekly(items);renderCategory(items);renderChannel(items);renderScatter(items);renderAgency(items,t);renderObjectives(items);renderSocial(items);renderCampaignTable(items);renderStatus(items,t);renderSocialDashboard();bindTips();
  }

  function exportCsv(){
    const data=campaignRows(activeRows());
    const headers=['Agency','Platform','Campaign Objective','Category','Campaign','Spend','Impressions','Clicks','Results','Conversions','CPM','CTR','CPC'];
    const csv=[headers.join(','),...data.map(r=>headers.map(h=>{const v=r[h]??'';return `"${String(v).replace(/"/g,'""')}"`}).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='morelos-performance-filtered.csv';a.click();URL.revokeObjectURL(url);
  }

  fillSelect('filterMonth',DATA.meta.months,'Todos los meses');
  fillSelect('filterAgency',[...new Set(rows.map(r=>r.Agency))].sort(),'Todas las agencias');
  fillSelect('filterPlatform',[...new Set(rows.map(r=>r.Platform))].sort(),'Todos los canales');
  fillSelect('filterObjective',[...new Set(rows.map(r=>r['Campaign Objective']))].sort(),'Todos los objetivos');
  fillSelect('filterCategory',[...new Set(rows.map(r=>r.Category))].sort(),'Todas las categorías');
  $('resetFilters').addEventListener('click',()=>{Object.assign(state,{month:'All',agency:'All',platform:'All',objective:'All',category:'All',search:'',sort:'Spend',dir:'desc'});['filterMonth','filterAgency','filterPlatform','filterObjective','filterCategory'].forEach(id=>$(id).value='All');$('campaignSearch').value='';render()});
  $('campaignSearch').addEventListener('input',e=>{state.search=e.target.value;renderCampaignTable(activeRows())});
  $('downloadCsv').addEventListener('click',exportCsv);
  fillSocialSelect('socialFilterMonth',[...new Set(socialPosts.map(p=>p.Month))].sort(),'Todos los meses','month');
  fillSocialSelect('socialFilterPlatform',[...new Set(socialPosts.map(p=>p.Platform))].sort(),'Todas las plataformas','platform');
  fillSocialSelect('socialFilterFormat',[...new Set(socialPosts.map(p=>p.Format))].sort(),'Todos los formatos','format');
  $('socialSearch').addEventListener('input',e=>{socialState.search=e.target.value;renderSocialDashboard()});
  $('socialResetFilters').addEventListener('click',()=>{Object.assign(socialState,{month:'All',platform:'All',format:'All',search:''});['socialFilterMonth','socialFilterPlatform','socialFilterFormat'].forEach(id=>$(id).value='All');$('socialSearch').value='';renderSocialDashboard()});
  $('downloadSocialCsv').addEventListener('click',exportSocialCsv);
  render();
})();
