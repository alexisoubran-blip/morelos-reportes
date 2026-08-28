(() => {
  'use strict';

  let rows = [];
  let booted = false;
  const $ = id => document.getElementById(id);
  const parseDate = s => new Date(`${s}T12:00:00`);
  const compact = v => {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2).replace(/\.00$/, '')}M`;
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '')}K`;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  };
  const integer = v => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v) || 0);

  function activeRange() {
    const mode = document.querySelector('#period-mode button.active')?.dataset.mode || 'months';
    if (mode === 'week') {
      const start = parseDate($('week-select')?.value || '2026-06-01');
      const end = new Date(start); end.setDate(end.getDate() + 6);
      return { start, end };
    }
    if (mode === 'month') {
      const value = $('month-select')?.value || '2026-07';
      const [y, m] = value.split('-').map(Number);
      return { start: new Date(y, m - 1, 1, 12), end: new Date(y, m, 0, 12) };
    }
    let from = $('from-month')?.value || '2026-06', to = $('to-month')?.value || '2026-07';
    if (from > to) [from, to] = [to, from];
    const [fy, fm] = from.split('-').map(Number), [ty, tm] = to.split('-').map(Number);
    return { start: new Date(fy, fm - 1, 1, 12), end: new Date(ty, tm, 0, 12) };
  }

  function activePlatform() {
    return document.querySelector('#social-platform-tabs button.active')?.dataset.platform || 'all';
  }

  function updateViewsContext() {
    const viewsEl = $('social-views');
    if (!viewsEl || !rows.length) return;
    const card = viewsEl.closest('.kpi-card');
    const label = card?.querySelector(':scope > span');
    const note = card?.querySelector('small');
    const platform = activePlatform();
    const campaign = $('campaign-filter')?.value || 'all';
    const range = activeRange();
    const filtered = rows.filter(r => {
      const d = parseDate(r.date);
      return d >= range.start && d <= range.end &&
        (platform === 'all' || r.platform === platform) &&
        (campaign === 'all' || r.campaign_tag === campaign);
    });

    const raw = filtered.reduce((s, r) => s + (Number(r.views) || 0), 0);
    const dedup = filtered.reduce((s, r) => s + Number(platform === 'all' ? (r.views_rollup || 0) : (r.views || 0)), 0);

    if (label) label.textContent = platform === 'all' ? 'Views deduplicadas' : 'Views';
    if (note) note.textContent = platform === 'all'
      ? `Crossposts deduplicados · ${compact(raw)} views reportadas por plataforma`
      : `Views reportadas por ${platform}`;
    if (card) card.title = platform === 'all'
      ? `Views únicas para el rollup: ${integer(dedup)}. La suma bruta por plataforma es ${integer(raw)}; la diferencia corresponde principalmente a crossposts reportados en más de una red.`
      : `${integer(raw)} views reportadas por ${platform} bajo el filtro actual.`;
  }

  async function load() {
    try {
      const [aRes, bRes] = await Promise.all([
        fetch('./data/social-content-1.json', { cache: 'no-store' }),
        fetch('./data/social-content-2.json', { cache: 'no-store' })
      ]);
      if (!aRes.ok || !bRes.ok) throw new Error('Social content unavailable');
      const [a, b] = await Promise.all([aRes.json(), bRes.json()]);
      const hydrate = data => (data.rows || []).map(row => Object.fromEntries((data.schema || []).map((field, i) => [field, row[i]])));
      rows = [...hydrate(a), ...hydrate(b)];
      setTimeout(updateViewsContext, 80);
    } catch (err) {
      console.error('No se pudo cargar el contexto de Views Social', err);
    }
  }

  function boot() {
    if (booted) return;
    booted = true;
    load();
    document.addEventListener('click', e => {
      if (e.target.closest?.('#social-platform-tabs button,#period-mode button,#reset-filters')) setTimeout(updateViewsContext, 60);
    });
    document.addEventListener('change', e => {
      if (e.target.closest?.('#period-controls,#campaign-filter')) setTimeout(updateViewsContext, 60);
    });
    const tabs = $('social-platform-tabs');
    if (tabs) new MutationObserver(() => setTimeout(updateViewsContext, 50)).observe(tabs, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
