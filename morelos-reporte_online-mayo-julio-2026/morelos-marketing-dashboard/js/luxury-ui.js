(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
  let queued = false;

  function patchOverviewCopy(){
    const paidPanel = $('campaign-split')?.closest('.panel');
    if (paidPanel){
      const h = paidPanel.querySelector('h3');
      const chip = paidPanel.querySelector('.status-chip');
      if (h && h.textContent !== 'Split de inversión Digital Media') h.textContent = 'Split de inversión Digital Media';
      if (chip && chip.textContent !== 'Digital') chip.textContent = 'Digital';
    }
    const combined = $('marketing-allocation-panel');
    if (combined){
      const h = combined.querySelector('h3');
      const chip = combined.querySelector('.status-chip');
      if (h && h.textContent !== 'Digital + Offline') h.textContent = 'Digital + Offline';
      if (chip && chip.textContent !== 'Digital + Offline') chip.textContent = 'Digital + Offline';
      combined.classList.add('combined-allocation');
    }
    const redundant = $('channel-investment')?.closest('.panel');
    if (redundant) redundant.style.display = 'none';
  }

  function markHierarchy(){
    $('kpi-spend')?.closest('.kpi-card')?.classList.add('hero-kpi','lux-hero-kpi');
    $('social-views')?.closest('.kpi-card')?.classList.add('lux-social-views');
    $('social-er')?.closest('.kpi-card')?.classList.add('lux-social-er');
    $('ga-users')?.closest('.kpi-card')?.classList.add('lux-ga-users');

    const listening = $('listening');
    qsa('.kpi-card', listening || document).forEach(card => {
      const label = card.querySelector(':scope > span')?.textContent?.trim().toLowerCase() || '';
      if (label.includes('rating promedio')) card.classList.add('lux-rating');
      if (label.includes('sentimiento positivo')) card.classList.add('lux-sentiment');
    });

    const offline = $('offline');
    qsa('.kpi-card', offline || document).forEach(card => {
      const label = card.querySelector(':scope > span')?.textContent?.trim().toLowerCase() || '';
      if (label === 'inversión offline') card.classList.add('lux-offline-total');
    });

    $('insights-grid')?.closest('.insights-section')?.classList.add('executive-editorial');
    document.querySelector('.methodology')?.classList.add('quiet-methodology');
  }

  function quietTechnicalCopy(){
    const sourcePattern = /(?:^|\b)(03_PAID_MEDIA|04_SOCIAL_ACCOUNTS|05_SOCIAL_CONTENT|06_GA4|07_GA4_PAGES|08_REVIEWS|09_OFFLINE_MEDIA)(?:\b|$)|^Fuente:\s|^Source:\s/i;
    qsa('.kpi-card small,.platform-card p').forEach(el => {
      const txt = el.textContent.trim();
      if (!txt || !sourcePattern.test(txt)) return;
      if (!el.classList.contains('tech-detail')){
        el.classList.add('tech-detail');
        const card = el.closest('.kpi-card,.platform-card');
        if (card && !card.title) card.title = txt;
      }
    });
  }

  function enrichTopContent(){
    qsa('#top-content .content-row').forEach(row => {
      row.classList.add('content-premium');
      const badge = row.querySelector('.platform-badge');
      if (!badge) return;
      if (badge.classList.contains('fb') || /facebook|\bfb\b/i.test(badge.getAttribute('aria-label') || badge.textContent)) row.classList.add('content-fb');
      else if (badge.classList.contains('ig') || /instagram|\big\b/i.test(badge.getAttribute('aria-label') || badge.textContent)) row.classList.add('content-ig');
      else if (badge.classList.contains('tt') || /tiktok|\btt\b/i.test(badge.getAttribute('aria-label') || badge.textContent)) row.classList.add('content-tt');
    });
  }

  function markPrimaryPanels(){
    $('campaign-split')?.closest('.panel')?.classList.add('lux-primary-panel');
    $('marketing-allocation-panel')?.classList.add('lux-primary-panel');
    $('offline-allocation-panel')?.classList.add('lux-primary-panel');
    $('platform-performance')?.closest('.panel')?.classList.add('lux-platform-panel');
    $('social-chart')?.closest('.panel')?.classList.add('lux-chart-panel');
    $('analytics-chart')?.closest('.panel')?.classList.add('lux-chart-panel');
  }

  function patchAll(){
    queued = false;
    patchOverviewCopy();
    markHierarchy();
    quietTechnicalCopy();
    enrichTopContent();
    markPrimaryPanels();
  }

  function queuePatch(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(patchAll);
  }

  function setupDesktopNav(){
    if (!('IntersectionObserver' in window)) return;
    const links = qsa('.top-nav a[href^="#"]:not(.nav-pill)');
    const pairs = links.map(link => ({link, section: document.querySelector(link.getAttribute('href'))})).filter(x => x.section);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      pairs.forEach(({link,section}) => link.classList.toggle('active', section === visible.target));
    }, {rootMargin:'-22% 0px -68% 0px',threshold:[.04,.18,.4]});
    pairs.forEach(({section}) => observer.observe(section));
  }

  function loadOfflinePremium(){
    if (document.getElementById('offline-premium-script')) return;
    const script = document.createElement('script');
    script.id = 'offline-premium-script';
    script.src = './js/offline-premium.js';
    script.defer = true;
    document.head.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', () => {
    patchAll();
    setupDesktopNav();
    loadOfflinePremium();
    const main = document.querySelector('main');
    if (main) new MutationObserver(queuePatch).observe(main,{childList:true,subtree:true});
    document.addEventListener('change', e => { if (e.target.closest?.('#filters-panel,#campaign-filter,#channel-filter,#period-controls')) setTimeout(queuePatch,20); });
    document.addEventListener('click', e => { if (e.target.closest?.('#period-mode button,#reset-filters,#social-platform-tabs button,#performance-tabs button,#analytics-tabs button')) setTimeout(queuePatch,30); });
    setTimeout(queuePatch,450);
  });
})();
