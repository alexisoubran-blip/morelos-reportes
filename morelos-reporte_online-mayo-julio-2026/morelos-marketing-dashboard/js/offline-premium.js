(() => {
  'use strict';

  let OFFLINE = [];
  let ready = false;
  let queued = false;
  const PLACEMENT_INDEX = [{"medium":"Radio","placement":"El Patrón | KOKQ-F2","market":"Oklahoma","vendor":"iHeartMedia","months":["2026-06","2026-07"],"tags":["Marinados","Mundial","Oferton","Product","Taco Tuesday"],"programs":[]},{"medium":"Radio","placement":"KJYO-FM | KJYO-FM","market":"Oklahoma","vendor":"iHeartMedia","months":["2026-07"],"tags":["Product"],"programs":[]},{"medium":"Radio","placement":"La Z | KTUZ-FM","market":"Oklahoma","vendor":"Tyler Media","months":["2026-06","2026-07"],"tags":["Marinados","Mundial","Oferton","Product","Taco Tuesday"],"programs":["Control Remoto"]},{"medium":"Radio","placement":"Ritmo | ORXO-FM","market":"Oklahoma","vendor":"Tyler Media","months":["2026-06","2026-07"],"tags":["Marinados","Mundial","Oferton","Product","Taco Tuesday"],"programs":[]},{"medium":"Radio","placement":"The Twister | KTST-FM","market":"Oklahoma","vendor":"iHeartMedia","months":["2026-07"],"tags":["Product"],"programs":[]},{"medium":"Radio","placement":"El Patrón | KIZS-FM","market":"Tulsa","vendor":"iHeartMedia","months":["2026-06","2026-07"],"tags":["Marinados","Mundial","Oferton","Product","Taco Tuesday"],"programs":[]},{"medium":"Radio","placement":"La Que Buena | KCXR  KXTD","market":"Tulsa","vendor":"Key Plus Broadcasting, LLC","months":["2026-06","2026-07"],"tags":["Marinados","Mundial","Oferton","Product","Taco Tuesday"],"programs":[]},{"medium":"Radio","placement":"La Z | KTUZ-AM","market":"Tulsa","vendor":"Tyler Media","months":["2026-06","2026-07"],"tags":["Marinados","Mundial","Oferton","Product","Taco Tuesday"],"programs":["Control Remoto"]},{"medium":"Radio","placement":"Ritmo | KOKQ-F2","market":"Tulsa","vendor":"Tyler Media","months":["2026-06","2026-07"],"tags":["Oferton"],"programs":[]},{"medium":"Radio","placement":"Ritmo | KRXO-AM","market":"Tulsa","vendor":"Tyler Media","months":["2026-06","2026-07"],"tags":["Marinados","Mundial","Product","Taco Tuesday"],"programs":[]},{"medium":"Radio","placement":"The  Jet | KTGX-FM HD2","market":"Tulsa","vendor":"iHeartMedia","months":["2026-07"],"tags":["Product"],"programs":[]},{"medium":"Radio","placement":"The Beat | KTBT-FM","market":"Tulsa","vendor":"iHeartMedia","months":["2026-07"],"tags":["Mundial","Oferton","Product"],"programs":[]},{"medium":"Radio","placement":"Viva | KTFR","market":"Tulsa","vendor":"Key Plus Broadcasting, LLC","months":["2026-06","2026-07"],"tags":["Marinados","Oferton","Product","Taco Tuesday"],"programs":[]},{"medium":"TV","placement":"Telemundo | KTUZ -TV 30","market":"Oklahoma","vendor":"Tyler Media","months":["2026-06","2026-07"],"tags":["Marinados","Mundial","Oferton","Product","Taco Tuesday"],"programs":[]},{"medium":"TV","placement":"Univisión | KUOK-TV 36","market":"Oklahoma","vendor":"Tyler Media","months":["2026-06","2026-07"],"tags":["Marinados","Mundial","Oferton","Product","Taco Tuesday"],"programs":[]},{"medium":"TV","placement":"Telemundo | KTUZ -TV 30","market":"Tulsa","vendor":"Tyler Media","months":["2026-06"],"tags":["Marinados","Product"],"programs":[]},{"medium":"TV","placement":"Telemundo | MUTU-TV 25.3","market":"Tulsa","vendor":"Tyler Media","months":["2026-06","2026-07"],"tags":["Mundial","Oferton","Taco Tuesday"],"programs":[]},{"medium":"TV","placement":"Univisión | KUOK-TV 36","market":"Tulsa","vendor":"Tyler Media","months":["2026-06"],"tags":["Marinados","Product"],"programs":[]},{"medium":"TV","placement":"Univisión | KUTU-TV 25","market":"Tulsa","vendor":"Tyler Media","months":["2026-06","2026-07"],"tags":["Mundial","Oferton","Taco Tuesday"],"programs":[]}];

  const $ = id => document.getElementById(id);
  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(v)||0);
  const integer = v => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Number(v)||0);
  const parseDate = s => new Date(`${s}T12:00:00`);

  function injectStyles(){
    if ($('offline-premium-style')) return;
    const style = document.createElement('style');
    style.id = 'offline-premium-style';
    style.textContent = `
      #listening>.section-heading>.section-note,
      #offline>.section-heading>.section-note{display:none!important}
      #offline .filter-support{margin-left:auto}

      .offline-premium-layout{display:grid;gap:12px}
      .offline-premium-kpis{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px}
      .offline-premium-kpis .kpi-card{min-width:0;min-height:118px;padding:16px}
      .offline-premium-kpis .kpi-card strong{font-size:25px;letter-spacing:-.04em;white-space:nowrap}
      .offline-premium-kpis .offline-hero{grid-column:span 4;min-height:146px;background:linear-gradient(135deg,#063f2b 0%,#075d3b 72%,#0b7751 100%)!important;color:#fff;box-shadow:0 20px 48px rgba(6,63,43,.18)!important}
      .offline-premium-kpis .offline-hero:before{background:#d4a72c!important;opacity:1!important}
      .offline-premium-kpis .offline-hero>span,.offline-premium-kpis .offline-hero small{color:rgba(255,255,255,.72)!important}
      .offline-premium-kpis .offline-hero strong{font-size:42px;margin-top:23px}
      .offline-premium-kpis .offline-major{grid-column:span 2}
      .offline-premium-kpis .offline-cps{grid-column:span 2;background:linear-gradient(145deg,#fff,#f7f3e6)!important}
      .offline-premium-kpis .offline-cps strong{color:#604f17}
      .offline-premium-kpis .offline-support{grid-column:span 2}
      .offline-premium-kpis .offline-total-spots{background:linear-gradient(145deg,#eef7f1,#fff)!important}
      .offline-premium-kpis small{font-size:10px;line-height:1.4}

      .offline-station-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:2px}
      .offline-station-panel{padding:20px!important}
      .offline-station-list{display:grid;gap:7px}
      .offline-station-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(7,93,59,.07)}
      .offline-station-row:last-child{border-bottom:0}
      .offline-station-copy{min-width:0}
      .offline-station-copy strong{display:block;font-size:12px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .offline-station-copy small{display:block;color:#788079;font-size:9px;margin-top:3px}
      .offline-station-value{text-align:right;font-size:10px;color:#667168;white-space:nowrap}
      .offline-station-value b{display:block;color:#173428;font-size:11px}
      .offline-programs{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
      .offline-program-tag{display:inline-flex;align-items:center;border-radius:999px;background:#edf6f0;color:#075d3b;padding:3px 7px;font-size:8px;font-weight:800;letter-spacing:.02em}
      .offline-empty-list{padding:18px 0;color:#8a928c;font-size:10px}

      @media(max-width:1179px) and (min-width:761px){
        .offline-premium-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
        .offline-premium-kpis .offline-hero{grid-column:span 2}
        .offline-premium-kpis .offline-major,.offline-premium-kpis .offline-cps,.offline-premium-kpis .offline-support{grid-column:span 1}
        .offline-premium-kpis .offline-hero strong{font-size:36px}
        .offline-premium-kpis .kpi-card strong{font-size:22px}
      }
      @media(max-width:760px){
        .offline-premium-layout{gap:9px}
        .offline-premium-kpis{grid-template-columns:1fr 1fr;gap:8px}
        .offline-premium-kpis .offline-hero{grid-column:1/-1;min-height:132px}
        .offline-premium-kpis .offline-major,.offline-premium-kpis .offline-cps,.offline-premium-kpis .offline-support{grid-column:span 1}
        .offline-premium-kpis .kpi-card{min-height:100px;padding:13px;border-radius:16px}
        .offline-premium-kpis .offline-hero strong{font-size:36px}
        .offline-premium-kpis .kpi-card:not(.offline-hero) strong{font-size:22px;white-space:normal}
        .offline-premium-kpis small{font-size:8px}
        .offline-station-grid{grid-template-columns:1fr;gap:9px}
        .offline-station-panel{padding:14px!important}
        .offline-station-copy strong{font-size:11px}
      }
    `;
    document.head.appendChild(style);
  }

  function activeRange(){
    const mode=document.querySelector('#period-mode button.active')?.dataset.mode||'months';
    if(mode==='week'){
      const start=parseDate($('week-select')?.value||'2026-06-01'), end=new Date(start); end.setDate(end.getDate()+6); return {start,end,mode};
    }
    if(mode==='month'){
      const value=$('month-select')?.value||'2026-07', [y,m]=value.split('-').map(Number); return {start:new Date(y,m-1,1,12),end:new Date(y,m,0,12),mode};
    }
    let from=$('from-month')?.value||'2026-06',to=$('to-month')?.value||'2026-07'; if(from>to)[from,to]=[to,from];
    const [fy,fm]=from.split('-').map(Number),[ty,tm]=to.split('-').map(Number); return {start:new Date(fy,fm-1,1,12),end:new Date(ty,tm,0,12),mode};
  }

  function monthInRange(month,range){
    const d=parseDate(`${month}-01`), start=new Date(range.start.getFullYear(),range.start.getMonth(),1,12), end=new Date(range.end.getFullYear(),range.end.getMonth(),1,12);
    return d>=start&&d<=end;
  }
  function campaign(){ return $('campaign-filter')?.value||'all'; }
  function channel(){ return $('channel-filter')?.value||'all'; }

  function filteredOffline(range){
    const c=campaign(), ch=channel();
    return OFFLINE.filter(r=>monthInRange(r.month,range)&&(c==='all'||r.campaign_tag===c)&&(ch==='all'||r.medium===ch));
  }
  function filteredPlacements(range){
    const c=campaign(), ch=channel();
    const months=[]; let d=new Date(range.start.getFullYear(),range.start.getMonth(),1,12), end=new Date(range.end.getFullYear(),range.end.getMonth(),1,12);
    while(d<=end){months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);d=new Date(d.getFullYear(),d.getMonth()+1,1,12)}
    return PLACEMENT_INDEX.filter(r=>r.months.some(m=>months.includes(m))&&(c==='all'||r.tags.includes(c))&&(ch==='all'||r.medium===ch));
  }
  const sum=(rows,key)=>rows.reduce((s,r)=>s+(Number(r[key])||0),0);

  function stationPanel(medium,rows){
    const items=rows.filter(r=>r.medium===medium).sort((a,b)=>a.market.localeCompare(b.market)||a.placement.localeCompare(b.placement));
    const label=medium==='TV'?'TV':'Radio';
    return `<article class="panel offline-station-panel"><div class="panel-head"><div><span class="panel-kicker">Inventario ${label}</span><h3>Estaciones / programas</h3></div><span class="status-chip">${integer(items.length)}</span></div><div class="offline-station-list">${items.length?items.map(x=>`<div class="offline-station-row"><div class="offline-station-copy"><strong title="${esc(x.placement)}">${esc(x.placement)}</strong><small>${esc(x.market)} · ${esc(x.vendor)}</small>${x.programs.length?`<div class="offline-programs">${x.programs.map(p=>`<span class="offline-program-tag">${esc(p)}</span>`).join('')}</div>`:''}</div><div class="offline-station-value"><b>${esc(x.market)}</b>${esc(label)}</div></div>`).join(''):`<div class="offline-empty-list">Sin inventario bajo este filtro.</div>`}</div></article>`;
  }

  function render(){
    injectStyles();
    const section=$('offline');
    if(!section||!ready)return;
    const range=activeRange();
    if(range.mode==='week') return;
    const rows=filteredOffline(range), placements=filteredPlacements(range);
    const key=[range.start.toISOString().slice(0,7),range.end.toISOString().slice(0,7),campaign(),channel(),rows.length,placements.length].join('|');
    if(section.dataset.offlinePremiumKey===key&&section.querySelector('.offline-premium-layout'))return;

    const total=sum(rows,'actual_spend'), spots=sum(rows,'spots'), paid=sum(rows,'paid_spots'), bonus=sum(rows,'bonus_spots'), impressions=sum(rows,'impressions');
    const tvRows=rows.filter(r=>r.medium==='TV'), radioRows=rows.filter(r=>r.medium==='Radio'), streamRows=rows.filter(r=>r.medium==='Streaming Radio');
    const tv=sum(tvRows,'actual_spend'), radio=sum(radioRows,'actual_spend'), streaming=sum(streamRows,'actual_spend');
    const tvSpots=sum(tvRows,'spots'), radioSpots=sum(radioRows,'spots');
    const cps=spots?total/spots:null, tvCps=tvSpots?tv/tvSpots:null, radioCps=radioSpots?radio/radioSpots:null;

    section.innerHTML=`<div class="section-heading"><div><p class="eyebrow">05 · OFFLINE</p><h2>Offline Media</h2></div></div>
      <div class="offline-premium-layout">
        <div class="offline-premium-kpis">
          <article class="kpi-card offline-hero"><span>Inversión offline</span><strong>${rows.length?money(total):'—'}</strong><small>TV + Radio + Streaming</small></article>
          <article class="kpi-card offline-major"><span>TV</span><strong>${rows.length?money(tv):'—'}</strong><small>${integer(tvSpots)} spots entregados</small></article>
          <article class="kpi-card offline-major"><span>Radio</span><strong>${rows.length?money(radio):'—'}</strong><small>${integer(radioSpots)} spots entregados</small></article>
          <article class="kpi-card offline-cps"><span>Costo por spot</span><strong>${cps==null?'—':money(cps)}</strong><small>Blended · inversión offline / spots</small></article>
          <article class="kpi-card offline-support offline-total-spots"><span>Total spots</span><strong>${rows.length?integer(spots):'—'}</strong><small>Paid + bonus</small></article>
          <article class="kpi-card offline-cps"><span>Costo por spot TV</span><strong>${tvCps==null?'—':money(tvCps)}</strong><small>Blended TV</small></article>
          <article class="kpi-card offline-cps"><span>Costo por spot Radio</span><strong>${radioCps==null?'—':money(radioCps)}</strong><small>Blended Radio</small></article>
          <article class="kpi-card offline-support"><span>Paid spots</span><strong>${rows.length?integer(paid):'—'}</strong><small>Spots comprados</small></article>
          <article class="kpi-card offline-support"><span>Bonus spots</span><strong>${rows.length?integer(bonus):'—'}</strong><small>${paid+bonus?`${((bonus/(paid+bonus))*100).toFixed(1)}% del inventario`:'—'}</small></article>
          <article class="kpi-card offline-support"><span>Streaming</span><strong>${rows.length?money(streaming):'—'}</strong><small>iHeart streaming</small></article>
          <article class="kpi-card offline-support"><span>Streaming impressions</span><strong>${rows.length?integer(impressions):'—'}</strong><small>Impresiones reportadas</small></article>
        </div>
        <div class="offline-station-grid">${stationPanel('TV',placements)}${stationPanel('Radio',placements)}</div>
      </div>`;
    section.dataset.offlinePremiumKey=key;
  }

  function queueRender(delay=0){
    if(queued)return;queued=true;
    setTimeout(()=>{queued=false;render();},delay);
  }

  async function load(){
    try{
      const a=await fetch('./data/offline-v2.json',{cache:'no-store'});
      if(!a.ok)throw new Error('Offline premium data unavailable');
      const ad=await a.json();
      const hydrate=d=>(d.rows||[]).map(row=>Object.fromEntries((d.schema||[]).map((f,i)=>[f,row[i]])));
      OFFLINE=hydrate(ad);ready=true;queueRender(40);
    }catch(err){console.error('No se pudo cargar la vista premium de Offline',err);}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    injectStyles();load();
    const section=$('offline');
    if(section)new MutationObserver(()=>{if(!section.querySelector('.offline-premium-layout'))queueRender(20);}).observe(section,{childList:true,subtree:true});
    document.addEventListener('change',e=>{if(e.target.closest?.('#period-controls,#campaign-filter,#channel-filter'))queueRender(90);});
    document.addEventListener('click',e=>{if(e.target.closest?.('#period-mode button,#reset-filters'))queueRender(120);});
    setTimeout(()=>queueRender(0),700);
  });
})();
