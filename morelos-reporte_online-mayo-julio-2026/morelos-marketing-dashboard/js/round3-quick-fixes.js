(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let OFFLINE = [];
  let ready = false;
  let queued = false;

  const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(v)||0);
  const parseDate = s => new Date(`${s}T12:00:00`);

  function activeRange(){
    const mode=document.querySelector('#period-mode button.active')?.dataset.mode||'months';
    if(mode==='week'){
      const start=parseDate($('week-select')?.value||'2026-06-01'), end=new Date(start); end.setDate(end.getDate()+6);
      return {start,end,mode,label:'Semana'};
    }
    if(mode==='month'){
      const value=$('month-select')?.value||'2026-07', [y,m]=value.split('-').map(Number);
      return {start:new Date(y,m-1,1,12),end:new Date(y,m,0,12),mode,label:value};
    }
    let from=$('from-month')?.value||'2026-06',to=$('to-month')?.value||'2026-07';
    if(from>to)[from,to]=[to,from];
    const [fy,fm]=from.split('-').map(Number),[ty,tm]=to.split('-').map(Number);
    return {start:new Date(fy,fm-1,1,12),end:new Date(ty,tm,0,12),mode,label:from===to?from:`${from} → ${to}`};
  }

  function selectedCampaign(){ return $('campaign-filter')?.value||'all'; }
  function selectedChannel(){ return $('channel-filter')?.value||'all'; }

  function filteredOffline(range){
    if(range.mode==='week') return [];
    const campaign=selectedCampaign(), channel=selectedChannel();
    const start=new Date(range.start.getFullYear(),range.start.getMonth(),1,12);
    const end=new Date(range.end.getFullYear(),range.end.getMonth(),1,12);
    return OFFLINE.filter(r=>{
      const d=parseDate(`${r.month}-01`);
      const channelOk=channel==='all'||r.medium===channel;
      const campaignOk=campaign==='all'||r.campaign_tag===campaign;
      return d>=start&&d<=end&&channelOk&&campaignOk;
    });
  }

  function rankRows(rows){
    if(!rows.length) return '<div class="empty-state">Sin inversión offline para este filtro.</div>';
    const max=Math.max(...rows.map(r=>r.value),1);
    return rows.map(r=>`<div class="rank-row"><div class="rank-label" title="${esc(r.name)}">${esc(r.name)}</div><div class="rank-track"><div class="rank-fill" data-tooltip="${esc(`${r.name}: ${money(r.value)}`)}" style="width:${r.value/max*100}%"></div></div><div class="rank-value">${money(r.value)}</div></div>`).join('');
  }

  function patchDigitalNaming(){
    const performance=$('performance');
    const title=performance?.querySelector('.section-heading h2');
    if(title&&title.textContent!=='Digital Media') title.textContent='Digital Media';

    const paidKpi=$('kpi-paid-spend')?.closest('.kpi-card')?.querySelector(':scope > span');
    if(paidKpi&&paidKpi.textContent!=='Digital Media') paidKpi.textContent='Digital Media';

    const paidPanel=$('campaign-split')?.closest('.panel');
    if(paidPanel){
      const h=paidPanel.querySelector('h3');
      const chip=paidPanel.querySelector('.status-chip');
      if(h&&h.textContent!=='Split de inversión Digital Media') h.textContent='Split de inversión Digital Media';
      if(chip&&chip.textContent!=='Digital') chip.textContent='Digital';
    }
  }

  function renderOfflineOverviewSplit(){
    if(!ready) return;
    const overview=$('overview'), paidPanel=$('campaign-split')?.closest('.panel');
    if(!overview||!paidPanel) return;

    const grid=paidPanel.parentElement;
    const combined=$('marketing-allocation-panel');
    if(combined&&grid&&combined.parentElement===grid&&grid.firstElementChild!==combined){
      grid.insertBefore(combined,grid.firstElementChild);
    }

    const range=activeRange(), rows=filteredOffline(range);
    let panel=$('offline-allocation-panel');
    if(!panel){
      panel=document.createElement('article');
      panel.className='panel lux-primary-panel';
      panel.id='offline-allocation-panel';
      paidPanel.insertAdjacentElement('afterend',panel);
    } else if(panel.previousElementSibling!==paidPanel){
      paidPanel.insertAdjacentElement('afterend',panel);
    }

    const key=[range.mode,range.label,selectedCampaign(),selectedChannel(),rows.length,rows.reduce((s,r)=>s+(Number(r.actual_spend)||0),0)].join('|');
    if(panel.dataset.round3Key===key) return;
    panel.dataset.round3Key=key;

    if(range.mode==='week'){
      panel.innerHTML='<div class="panel-head"><div><span class="panel-kicker">Broadcasting</span><h3>Split de inversión Offline</h3></div><span class="status-chip">Offline</span></div><div class="empty-state">Offline está disponible por mes o rango de meses.</div>';
      return;
    }

    const map=new Map();
    rows.forEach(r=>{
      const name=r.campaign_tag||'Sin tag';
      map.set(name,(map.get(name)||0)+(Number(r.actual_spend)||0));
    });
    const ranked=[...map.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    panel.innerHTML=`<div class="panel-head"><div><span class="panel-kicker">Broadcasting</span><h3>Split de inversión Offline</h3></div><span class="status-chip">Offline</span></div><div class="rank-list">${rankRows(ranked)}</div>`;
  }

  function cleanStoreName(raw){
    const original=String(raw||'').trim();
    if(!original) return 'Sucursal no identificada';
    let cleaned=original.replace(/^Super\s*mercados?\s+Morelos\b[\s·|:\-–—]*/i,'').trim();
    cleaned=cleaned.replace(/^[-–—|·:\s]+/,'').trim();
    if(!cleaned||/^morelos$/i.test(cleaned)) return 'Sucursal no identificada';
    return cleaned;
  }

  function patchReviewStoreNames(){
    const listening=$('listening');
    if(!listening) return;
    const panels=[...listening.querySelectorAll('.panel')];
    const storePanel=panels.find(p=>/Volumen de reviews/i.test(p.querySelector('h3')?.textContent||''));
    if(!storePanel) return;
    storePanel.querySelectorAll('.rank-label').forEach(el=>{
      const source=el.dataset.originalStore||el.getAttribute('title')||el.textContent||'';
      if(!el.dataset.originalStore) el.dataset.originalStore=source;
      const cleaned=cleanStoreName(source);
      if(el.textContent!==cleaned) el.textContent=cleaned;
      el.setAttribute('title',cleaned);
    });
  }

  function patchAnalyticsEmptyState(){
    const traffic=$('traffic-sources')?.querySelector('.empty-state');
    const pages=$('top-pages')?.querySelector('.empty-state');
    const trafficText='Detalle mensual disponible al cargar Traffic Acquisition por fecha.';
    const pagesText='Detalle mensual disponible al cargar Pages & Screens por fecha.';
    if(traffic&&traffic.textContent!==trafficText) traffic.textContent=trafficText;
    if(pages&&pages.textContent!==pagesText) pages.textContent=pagesText;
  }

  function patch(){
    queued=false;
    patchDigitalNaming();
    renderOfflineOverviewSplit();
    patchReviewStoreNames();
    patchAnalyticsEmptyState();
  }

  function queue(delay=0){
    if(queued) return;
    queued=true;
    setTimeout(patch,delay);
  }

  async function load(){
    try{
      const res=await fetch('./data/offline-v2.json',{cache:'no-store'});
      if(!res.ok) throw new Error('offline-v2 unavailable');
      const data=await res.json();
      OFFLINE=(data.rows||[]).map(row=>Object.fromEntries((data.schema||[]).map((field,i)=>[field,row[i]])));
      ready=true;
      queue(20);
    }catch(err){
      console.error('No se pudo cargar el split Offline de Overview',err);
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    load();
    patch();
    const main=document.querySelector('main');
    if(main) new MutationObserver(()=>queue(20)).observe(main,{childList:true,subtree:true});
    document.addEventListener('change',e=>{if(e.target.closest?.('#period-controls,#campaign-filter,#channel-filter'))queue(80);});
    document.addEventListener('click',e=>{if(e.target.closest?.('#period-mode button,#reset-filters'))queue(100);});
    setTimeout(()=>queue(0),700);
  });
})();
