(() => {
  'use strict';

  let DATA=null, queued=false, observer=null, rendering=false;
  const $=id=>document.getElementById(id);
  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const integer=v=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Number(v)||0);
  const compact=v=>{const n=Number(v)||0;if(Math.abs(n)>=1e6)return `${(n/1e6).toFixed(2).replace(/\.00$/,'')}M`;if(Math.abs(n)>=1e3)return `${(n/1e3).toFixed(n>=1e5?0:1).replace(/\.0$/,'')}K`;return integer(n)};
  const empty=t=>`<div class="empty-state">${esc(t)}</div>`;

  function activeMode(){return document.querySelector('#period-mode button.active')?.dataset.mode||'months'}
  function activeCampaign(){return $('campaign-filter')?.value||'all'}
  function currentBlock(){
    if(!DATA)return null;
    const mode=activeMode();
    if(mode==='week')return DATA.w?.[$('week-select')?.value||'2026-06-01']||null;
    if(mode==='month')return DATA.mo?.[$('month-select')?.value||'2026-07']||null;
    let a=$('from-month')?.value||'2026-06',b=$('to-month')?.value||'2026-07';
    if(a>b)[a,b]=[b,a];
    if(a===b)return DATA.mo?.[a]||null;
    if(a==='2026-06'&&b==='2026-07')return DATA.r;
    return null;
  }

  function rankHtml(rows){
    if(!rows.length)return empty('Sin datos para este filtro.');
    const max=Math.max(...rows.map(r=>Number(r.value)||0),1);
    return rows.map(r=>`<div class="rank-row"><div class="rank-label" title="${esc(r.name)}">${esc(r.name)}</div><div class="rank-track"><div class="rank-fill" data-tooltip="${esc(r.tip||`${r.name}: ${integer(r.value)}`)}" style="width:${(Number(r.value)||0)/max*100}%"></div></div><div class="rank-value">${integer(r.value)}</div></div>`).join('');
  }

  function patchLabels(){
    const section=$('analytics'); if(!section)return;
    const note=section.querySelector('.section-heading .section-note');
    if(note)note.textContent='Usuarios activos, fuentes de tráfico y páginas principales responden al filtro de tiempo con granularidad diaria de GA4.';
    section.querySelectorAll('.analytics-grid .status-chip').forEach(chip=>chip.textContent='Por fecha · GA4');
  }

  function render(){
    queued=false;
    if(!DATA||rendering)return;
    const block=currentBlock();
    if(!block)return;
    rendering=true;
    patchLabels();

    const campaign=activeCampaign();
    const traffic=block.t||[], pages=block.p||[], totals=block.x||[0,0,0,0];
    const pageRows=campaign==='all'?pages:pages.filter(r=>r[2]===campaign);
    const pageViews=campaign==='all'?Number(totals[2]||0):pageRows.reduce((s,r)=>s+(Number(r[1])||0),0);

    const gaViews=$('ga-views');
    if(gaViews)gaViews.textContent=(campaign==='all'||pageRows.length)?compact(pageViews):'—';
    const gaEvents=$('ga-events');
    if(gaEvents)gaEvents.textContent=campaign==='all'?compact(totals[1]||0):'—';

    const trafficEl=$('traffic-sources');
    if(trafficEl){
      trafficEl.innerHTML=campaign!=='all'
        ? empty('Fuentes de tráfico no tiene Campaign_Tag en este export de GA4.')
        : rankHtml(traffic.slice(0,8).map(r=>({name:r[0],value:r[1],tip:`${r[0]} · ${integer(r[1])} sessions`})));
    }

    const pagesEl=$('top-pages');
    if(pagesEl){
      const rows=pageRows.slice(0,8).map(r=>({name:r[0],value:r[1],tip:`${r[0]} · ${integer(r[1])} views${r[2]?` · ${r[2]}`:''}`}));
      pagesEl.innerHTML=rows.length?rankHtml(rows):empty(campaign==='all'?'Sin páginas para este periodo.':'No hay páginas mapeadas a esta campaña en el periodo.');
    }
    rendering=false;
  }

  function queue(ms=30){
    if(queued)return;
    queued=true;
    setTimeout(render,ms);
  }

  function observeAnalytics(){
    const analytics=$('analytics');
    if(!analytics||observer)return;
    observer=new MutationObserver(mutations=>{
      if(rendering)return;
      const wasOverwritten=mutations.some(m=>{
        const target=m.target?.nodeType===1?m.target:m.target?.parentElement;
        return target?.closest?.('#traffic-sources,#top-pages,#ga-views,#ga-events');
      });
      if(wasOverwritten)queue(10);
    });
    observer.observe(analytics,{childList:true,subtree:true,characterData:true});
  }

  async function boot(){
    try{
      const res=await fetch('./data/analytics-filtered-v2.json',{cache:'no-store'});
      if(!res.ok)throw new Error('analytics-filtered-v2 unavailable');
      DATA=await res.json();
      window.__MORELOS_GA4_DAILY__=true;
      observeAnalytics();
      queue(10);
      document.addEventListener('change',e=>{if(e.target.closest?.('#period-controls,#campaign-filter,#channel-filter'))setTimeout(()=>queue(0),80)});
      document.addEventListener('click',e=>{if(e.target.closest?.('#period-mode button,#reset-filters'))setTimeout(()=>queue(0),100)});
      [150,500,1000,1800].forEach(ms=>setTimeout(()=>queue(0),ms));
    }catch(err){console.error('No se pudo cargar GA4 diario para Analytics',err)}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
