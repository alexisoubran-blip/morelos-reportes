(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  function icon(name) {
    const icons = {
      overview: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
      paid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18V9m5 9V5m5 13v-6m5 6V3"/></svg>',
      social: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 21c.7-3 2.5-4.5 5-4.5S11.3 18 12 21M13 15c.6-1.7 1.9-2.6 4-2.6 2.2 0 3.7 1.2 4.3 3.6"/></svg>',
      digital: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16M7 15l3-3 3 2 5-6"/></svg>',
      more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>',
      filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
      close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
    };
    return icons[name] || '';
  }

  function injectMobileHeader() {
    const header = qs('.site-header');
    if (!header || qs('.mobile-header-meta', header)) return;
    const brand = qs('.brand', header);
    brand?.insertAdjacentHTML('afterend', '<div class="mobile-header-meta"><small>Morelos Analytics</small><strong>Marketing Overview</strong></div>');
    header.insertAdjacentHTML('beforeend', `<button class="mobile-filter-trigger" id="mobile-filter-trigger" type="button" aria-controls="filters-panel" aria-expanded="false">${icon('filter')}<span>Filtros</span><b id="mobile-filter-count">1</b></button>`);
  }

  function injectFilterDrawer() {
    const filters = qs('.filters-panel');
    if (!filters) return;
    filters.id = 'filters-panel';
    if (!qs('.mobile-drawer-head', filters)) {
      filters.insertAdjacentHTML('afterbegin', `<div class="mobile-drawer-head"><div><small>DATA VIEW</small><strong>Filtros</strong></div><button id="mobile-filter-close" type="button" aria-label="Cerrar filtros">${icon('close')}</button></div>`);
    }
    if (!$('mobile-filter-chips')) {
      const coverage = $('coverage-banner');
      coverage?.insertAdjacentHTML('afterend', '<div class="mobile-filter-chips" id="mobile-filter-chips" aria-live="polite"></div>');
    }
    if (!$('mobile-ux-backdrop')) document.body.insertAdjacentHTML('beforeend', '<button class="mobile-ux-backdrop" id="mobile-ux-backdrop" type="button" aria-label="Cerrar panel"></button>');
  }

  function injectBottomNav() {
    if ($('mobile-bottom-nav')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <nav class="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Navegación móvil">
        <a href="#overview" data-section="overview">${icon('overview')}<span>Overview</span></a>
        <a href="#performance" data-section="performance">${icon('paid')}<span>Paid</span></a>
        <a href="#social" data-section="social">${icon('social')}<span>Social</span></a>
        <a href="#analytics" data-section="analytics">${icon('digital')}<span>Digital</span></a>
        <button type="button" id="mobile-more-trigger">${icon('more')}<span>Más</span></button>
      </nav>
      <aside class="mobile-more-sheet" id="mobile-more-sheet" aria-hidden="true">
        <div class="mobile-drawer-head"><div><small>MORELOS DATA HUB</small><strong>Más secciones</strong></div><button id="mobile-more-close" type="button" aria-label="Cerrar menú">${icon('close')}</button></div>
        <a href="#listening"><span>04</span><strong>Google Reviews</strong><small>Reputación y listening</small></a>
        <a href="#offline"><span>05</span><strong>Offline Media</strong><small>TV, radio y streaming</small></a>
        <a href="#insights-grid"><span>AI</span><strong>Executive Insights</strong><small>Señales para decisión</small></a>
        <a href="#methodology"><span>QA</span><strong>Metodología</strong><small>Definiciones y cobertura</small></a>
      </aside>`);
    const methodology = qs('.methodology');
    if (methodology) methodology.id = 'methodology';
  }

  function injectExecutiveSnapshot() {
    if ($('mobile-exec-snapshot')) return;
    const overview = $('overview');
    if (!overview) return;
    overview.insertAdjacentHTML('afterend', `
      <section class="mobile-exec-snapshot" id="mobile-exec-snapshot">
        <div class="mobile-exec-head"><div><p class="eyebrow">EXECUTIVE SIGNALS</p><h2>Lo que importa ahora</h2></div><span>LIVE</span></div>
        <div class="mobile-exec-grid" id="mobile-exec-grid"></div>
      </section>`);
  }

  function syncExecutiveSnapshot() {
    const source = $('insights-grid'), target = $('mobile-exec-grid');
    if (!source || !target) return;
    const cards = qsa('.insight-card', source).slice(0, 4);
    target.innerHTML = cards.length ? cards.map(c => c.outerHTML).join('') : '<div class="mobile-exec-empty">Esperando señales del filtro actual.</div>';
  }

  function markPrimaryKpis() {
    qsa('.kpi-card').forEach(card => card.classList.add('premium-kpi'));
    const primaryIds = ['kpi-spend', 'social-views', 'social-er', 'ga-users'];
    primaryIds.forEach(id => $(id)?.closest('.kpi-card')?.classList.add('mobile-kpi-primary'));
    $('social-er')?.closest('.kpi-card')?.classList.add('mobile-kpi-accent');
    $('kpi-spend')?.closest('.kpi-card')?.classList.add('hero-kpi');
  }

  function periodLabel() {
    const mode = qs('#period-mode button.active')?.dataset.mode || 'months';
    if (mode === 'week') return $('week-select')?.selectedOptions?.[0]?.textContent?.replace(/^Semana\s*/i, '') || 'Semana';
    if (mode === 'month') return $('month-select')?.selectedOptions?.[0]?.textContent || 'Mes';
    const from = $('from-month')?.selectedOptions?.[0]?.textContent || '';
    const to = $('to-month')?.selectedOptions?.[0]?.textContent || '';
    return from === to ? from : `${from.replace(' de ', ' ')} → ${to.replace(' de ', ' ')}`;
  }

  function updateFilterChips() {
    const chips = $('mobile-filter-chips');
    if (!chips) return;
    const campaign = $('campaign-filter');
    const channel = $('channel-filter');
    const campaignValue = campaign?.value || 'all';
    const channelValue = channel?.value || 'all';
    const values = [
      { label: periodLabel(), active: true },
      { label: campaignValue === 'all' ? 'Todas las campañas' : campaign?.selectedOptions?.[0]?.textContent, active: campaignValue !== 'all' },
      { label: channelValue === 'all' ? 'Todos los canales' : channel?.selectedOptions?.[0]?.textContent, active: channelValue !== 'all' }
    ];
    chips.innerHTML = values.map(v => `<span class="${v.active ? 'active' : ''}">${v.label || '—'}</span>`).join('');
    const count = 1 + Number(campaignValue !== 'all') + Number(channelValue !== 'all');
    if ($('mobile-filter-count')) $('mobile-filter-count').textContent = String(count);
    const meta = qs('.mobile-header-meta small');
    if (meta) meta.textContent = periodLabel();
  }

  function openFilters(open) {
    document.body.classList.toggle('filters-open', open);
    $('mobile-filter-trigger')?.setAttribute('aria-expanded', String(open));
  }

  function openMore(open) {
    document.body.classList.toggle('more-open', open);
    $('mobile-more-sheet')?.setAttribute('aria-hidden', String(!open));
  }

  function setupMethodologyAccordion() {
    const method = qs('.methodology');
    if (!method || qs('.method-toggle', method)) return;
    const grid = qs('.method-grid', method);
    if (!grid) return;
    grid.insertAdjacentHTML('beforebegin', '<button class="method-toggle" type="button" aria-expanded="false"><span>Cómo se calcula este reporte</span><b>+</b></button>');
    const btn = qs('.method-toggle', method);
    btn?.addEventListener('click', () => {
      const open = method.classList.toggle('method-open');
      btn.setAttribute('aria-expanded', String(open));
      qs('b', btn).textContent = open ? '−' : '+';
    });
  }

  function setupSectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    const links = qsa('#mobile-bottom-nav [data-section]');
    const sections = links.map(l => $(l.dataset.section)).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(link => link.classList.toggle('active', link.dataset.section === visible.target.id));
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.5] });
    sections.forEach(s => observer.observe(s));
  }

  function setupInteractions() {
    $('mobile-filter-trigger')?.addEventListener('click', () => openFilters(true));
    $('mobile-filter-close')?.addEventListener('click', () => openFilters(false));
    $('mobile-more-trigger')?.addEventListener('click', () => openMore(true));
    $('mobile-more-close')?.addEventListener('click', () => openMore(false));
    $('mobile-ux-backdrop')?.addEventListener('click', () => { openFilters(false); openMore(false); });
    qsa('#mobile-more-sheet a').forEach(a => a.addEventListener('click', () => openMore(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { openFilters(false); openMore(false); } });
    document.addEventListener('change', e => {
      if (e.target.closest?.('#filters-panel')) setTimeout(updateFilterChips, 30);
    });
    document.addEventListener('click', e => {
      if (e.target.closest?.('#period-mode button,#reset-filters')) setTimeout(updateFilterChips, 50);
    });
  }

  function observeDynamicAreas() {
    const insight = $('insights-grid');
    if (insight) new MutationObserver(syncExecutiveSnapshot).observe(insight, { childList: true, subtree: true });
    const overviewGrid = qs('#overview .kpi-grid');
    const socialGrid = qs('#social .social-kpis');
    [overviewGrid, socialGrid].filter(Boolean).forEach(el => new MutationObserver(() => { markPrimaryKpis(); updateFilterChips(); }).observe(el, { childList: true, subtree: true }));
    const period = $('period-controls');
    if (period) new MutationObserver(updateFilterChips).observe(period, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectMobileHeader();
    injectFilterDrawer();
    injectBottomNav();
    injectExecutiveSnapshot();
    setupMethodologyAccordion();
    setupInteractions();
    setupSectionObserver();
    observeDynamicAreas();
    markPrimaryKpis();
    updateFilterChips();
    syncExecutiveSnapshot();
    setTimeout(() => { markPrimaryKpis(); updateFilterChips(); syncExecutiveSnapshot(); }, 500);
  });
})();
