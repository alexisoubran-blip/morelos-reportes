(() => {
  'use strict';

  let rows = [];
  const $ = id => document.getElementById(id);
  const parseDate = s => new Date(`${s}T12:00:00`);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const pct = v => Number.isFinite(v) ? `${(v*100).toFixed(2)}%` : '—';
  const integer = v => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Number(v)||0);

  function activeRange(){
    const mode=document.querySelector('#period-mode button.active')?.dataset.mode||'months';
    if(mode==='week'){
      const start=parseDate($('week-select')?.value||'2026-06-01');
      const end=new Date(start); end.setDate(end.getDate()+6);
      return {start,end};
    }
    if(mode==='month'){
      const value=$('month-select')?.value||'2026-07';
      const [y,m]=value.split('-').map(Number);
      return {start:new Date(y,m-1,1,12),end:new Date(y,m,0,12)};
    }
    let from=$('from-month')?.value||'2026-06', to=$('to-month')?.value||'2026-07';
    if(from>to)[from,to]=[to,from];
    const [fy,fm]=from.split('-').map(Number), [ty,tm]=to.split('-').map(Number);
    return {start:new Date(fy,fm-1,1,12),end:new Date(ty,tm,0,12)};
  }

  function activePlatform(){
    return document.querySelector('#social-platform-tabs button.active')?.dataset.platform||'all';
  }

  function updateTikTokER(){
    const erEl=$('social-er');
    if(!erEl)return;
    const note=erEl.closest('.kpi-card')?.querySelector('small');
    const platform=activePlatform();

    if(platform!=='TikTok'){
      if(note)note.textContent=platform==='all'
        ? 'Interacciones / suma de reach por post · TikTok usa Audience ER en su tab'
        : 'Interacciones / suma de reach por post';
      return;
    }

    if(($('campaign-filter')?.value||'all')!=='all'){
      erEl.textContent='—';
      if(note)note.textContent='TikTok Audience ER no es atribuible por Campaign_Tag';
      return;
    }

    const range=activeRange();
    const filtered=rows.filter(r=>r.platform==='TikTok'&&parseDate(r.date)>=range.start&&parseDate(r.date)<=range.end);
    const reach=filtered.reduce((s,r)=>s+(Number(r.reach)||0),0);
    const engaged=filtered.reduce((s,r)=>s+(Number(r.engaged_audience)||0),0);
    erEl.textContent=reach?pct(engaged/reach):'—';
    if(note)note.textContent=reach
      ? `Engaged audience / Reached audience · ${integer(engaged)} / ${integer(reach)}`
      : 'Sin Reached audience para este periodo';
    erEl.title=reach?`TikTok Audience Engagement Rate = ${engaged} / ${reach} = ${pct(engaged/reach)}`:'';
  }

  async function load(){
    try{
      const res=await fetch('./data/followers-v2.json',{cache:'no-store'});
      if(!res.ok)throw new Error('followers-v2 unavailable');
      const data=await res.json();
      rows=(data.rows||[]).map(a=>Object.fromEntries((data.schema||[]).map((f,i)=>[f,a[i]])));
      updateTikTokER();
    }catch(err){
      console.error('No se pudo calcular TikTok ER',err);
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    load();
    document.addEventListener('click',e=>{
      if(e.target.closest?.('#social-platform-tabs button,#period-mode button,#reset-filters'))setTimeout(updateTikTokER,0);
    });
    document.addEventListener('change',e=>{
      if(e.target.closest?.('#period-controls,#campaign-filter'))setTimeout(updateTikTokER,0);
    });
    const tabs=$('social-platform-tabs');
    if(tabs)new MutationObserver(()=>setTimeout(updateTikTokER,0)).observe(tabs,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    const period=$('period-controls');
    if(period)new MutationObserver(()=>setTimeout(updateTikTokER,0)).observe(period,{childList:true,subtree:true});
  });
})();
