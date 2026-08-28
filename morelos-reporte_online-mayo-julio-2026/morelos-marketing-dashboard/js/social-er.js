(() => {
  'use strict';

  let rows = [];
  const $ = id => document.getElementById(id);
  const parseDate = s => new Date(`${s}T12:00:00`);
  const pct = v => Number.isFinite(v) ? `${(v * 100).toFixed(2)}%` : '—';
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

  function updateER() {
    const erEl = $('social-er');
    if (!erEl || !rows.length) return;
    const note = erEl.closest('.kpi-card')?.querySelector('small');
    const range = activeRange();
    const platform = activePlatform();
    const campaign = $('campaign-filter')?.value || 'all';

    const filtered = rows.filter(r => {
      const d = parseDate(r.date);
      return d >= range.start && d <= range.end &&
        (platform === 'all' || r.platform === platform) &&
        (campaign === 'all' || r.campaign_tag === campaign);
    });

    const interactions = filtered.reduce((s, r) => s +
      (Number(r.likes) || 0) +
      (Number(r.comments) || 0) +
      (Number(r.shares) || 0) +
      (Number(r.saves) || 0), 0);
    const views = filtered.reduce((s, r) => s + (Number(r.views) || 0), 0);
    const er = views ? interactions / views : null;

    erEl.textContent = er == null ? '—' : pct(er);
    if (note) note.textContent = views
      ? `Likes + comments + shares + saves / views · ${integer(interactions)} / ${integer(views)}`
      : 'Sin views para este filtro';
    erEl.title = views
      ? `Engagement Rate = ${integer(interactions)} interacciones / ${integer(views)} views = ${pct(er)}`
      : '';
  }

  async function load() {
    try {
      const [r1, r2] = await Promise.all([
        fetch('./data/social-content-1.json', { cache: 'no-store' }),
        fetch('./data/social-content-2.json', { cache: 'no-store' })
      ]);
      if (!r1.ok || !r2.ok) throw new Error('Social content unavailable');
      const [a, b] = await Promise.all([r1.json(), r2.json()]);
      const hydrate = (data) => (data.rows || []).map(row => Object.fromEntries((data.schema || []).map((f, i) => [f, row[i]])));
      rows = [...hydrate(a), ...hydrate(b)];
      setTimeout(updateER, 100);
    } catch (err) {
      console.error('No se pudo calcular el ER social estandarizado', err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    load();
    document.addEventListener('click', e => {
      if (e.target.closest?.('#social-platform-tabs button,#period-mode button,#reset-filters')) setTimeout(updateER, 100);
    });
    document.addEventListener('change', e => {
      if (e.target.closest?.('#period-controls,#campaign-filter')) setTimeout(updateER, 100);
    });
    const tabs = $('social-platform-tabs');
    if (tabs) new MutationObserver(() => setTimeout(updateER, 80)).observe(tabs, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    const period = $('period-controls');
    if (period) new MutationObserver(() => setTimeout(updateER, 80)).observe(period, { childList: true, subtree: true });
  });
})();

(() => {
  if (document.querySelector('script[src$="/final-polish.js"],script[src="./js/final-polish.js"]')) return;
  const script = document.createElement('script');
  script.src = './js/final-polish.js';
  script.dataset.finalPolish = 'true';
  document.head.appendChild(script);
})();

(() => {
  if (document.querySelector('script[src$="/social-audit-ui.js"],script[src="./js/social-audit-ui.js"]')) return;
  const script = document.createElement('script');
  script.src = './js/social-audit-ui.js';
  script.dataset.socialAuditUi = 'true';
  document.head.appendChild(script);
})();
