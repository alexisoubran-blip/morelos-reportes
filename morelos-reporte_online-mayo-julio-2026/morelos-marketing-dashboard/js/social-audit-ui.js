(() => {
  'use strict';

  let contentRows = [];
  let followerRows = [];
  let queued = false;
  let observer = null;
  const $ = id => document.getElementById(id);
  const parseDate = s => new Date(`${s}T12:00:00`);
  const compact = v => {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2).replace(/\.00$/, '')}M`;
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '')}K`;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  };
  const integer = v => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v) || 0);
  const pct = v => Number.isFinite(v) ? `${(v * 100).toFixed(2)}%` : '—';

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
    let from = $('from-month')?.value || '2026-06';
    let to = $('to-month')?.value || '2026-07';
    if (from > to) [from, to] = [to, from];
    const [fy, fm] = from.split('-').map(Number);
    const [ty, tm] = to.split('-').map(Number);
    return { start: new Date(fy, fm - 1, 1, 12), end: new Date(ty, tm, 0, 12) };
  }

  function activePlatform() {
    return document.querySelector('#social-platform-tabs button.active')?.dataset.platform || 'all';
  }

  function activeCampaign() {
    return $('campaign-filter')?.value || 'all';
  }

  function hydrate(data) {
    return (data.rows || []).map(row => Object.fromEntries((data.schema || []).map((field, i) => [field, row[i]])));
  }

  function setText(id, value) {
    const el = $(id);
    if (el && el.textContent !== value) el.textContent = value;
  }

  function setNote(id, value) {
    const el = $(id)?.closest('.kpi-card')?.querySelector('small');
    if (el && el.textContent !== value) el.textContent = value;
  }

  function patchStaticCopy() {
    const note = document.querySelector('#social .section-note');
    if (note) note.textContent = 'Posts y métricas provienen de 05_SOCIAL_CONTENT; followers de 04_SOCIAL_ACCOUNTS. Views y Engagement Rate usan la misma lógica aditiva en Facebook, Instagram y TikTok.';
    document.querySelectorAll('.methodology .method-grid p').forEach(p => {
      const text = p.textContent || '';
      if (text.startsWith('Social Views.')) p.innerHTML = '<strong>Social Views.</strong> El total suma directamente las views reportadas por Facebook + Instagram + TikTok bajo el filtro actual.';
      if (text.startsWith('Social ER.')) p.innerHTML = '<strong>Social ER.</strong> Fórmula estandarizada: (Likes + Comments + Shares + Saves) / suma de Views bajo el mismo filtro.';
    });
  }

  function renderCanonical() {
    queued = false;
    if (!contentRows.length) return;

    const range = activeRange();
    const platform = activePlatform();
    const campaign = activeCampaign();
    const filtered = contentRows.filter(r => {
      const d = parseDate(r.date);
      return d >= range.start && d <= range.end &&
        (platform === 'all' || r.platform === platform) &&
        (campaign === 'all' || r.campaign_tag === campaign);
    });

    const followers = campaign === 'all' ? followerRows.filter(r => {
      const d = parseDate(r.date);
      return d >= range.start && d <= range.end &&
        (platform === 'all' || r.platform === platform);
    }) : [];

    const sum = key => filtered.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    const views = sum('views');
    const likes = sum('likes');
    const comments = sum('comments');
    const shares = sum('shares');
    const saves = sum('saves');
    const interactions = likes + comments + shares + saves;
    const follows = followers.reduce((s, r) => s + (Number(r.follows) || 0), 0);
    const er = views ? interactions / views : null;

    setText('social-follows', campaign === 'all' ? compact(follows) : '—');
    setText('social-views', compact(views));
    setText('social-posts', integer(filtered.length));
    setText('social-likes', compact(likes));
    setText('social-comments', compact(comments));
    setText('social-shares', compact(shares));
    setText('social-saves', compact(saves));
    setText('social-er', er == null ? '—' : pct(er));

    setNote('social-follows', campaign === 'all' ? 'No atribuible por campaña' : 'No disponible con filtro de campaña');
    setNote('social-views', platform === 'all' ? 'Facebook + Instagram + TikTok' : `Views reportadas por ${platform}`);
    setNote('social-posts', 'Publicaciones bajo el filtro actual');
    setNote('social-likes', 'Total en posts filtrados');
    setNote('social-comments', 'Total en posts filtrados');
    setNote('social-shares', 'Total en posts filtrados');
    setNote('social-saves', 'Total en posts filtrados');
    setNote('social-er', views ? `Interacciones / views · ${integer(interactions)} / ${integer(views)}` : 'Sin views para este filtro');

    const viewsCard = $('social-views')?.closest('.kpi-card');
    if (viewsCard) viewsCard.title = `${integer(views)} views bajo el filtro actual.`;
    const erCard = $('social-er')?.closest('.kpi-card');
    if (erCard) erCard.title = views ? `ER = ${integer(interactions)} / ${integer(views)} = ${pct(er)}` : '';

    patchStaticCopy();
    window.__MORELOS_SOCIAL_CANONICAL__ = true;
  }

  function queue(delay = 40) {
    if (queued) return;
    queued = true;
    setTimeout(renderCanonical, delay);
  }

  function observeSocial() {
    const social = $('social');
    if (!social || observer) return;
    observer = new MutationObserver(mutations => {
      const touched = mutations.some(m => {
        const target = m.target?.nodeType === 1 ? m.target : m.target?.parentElement;
        return target?.closest?.('#social-follows,#social-views,#social-posts,#social-likes,#social-comments,#social-shares,#social-saves,#social-er');
      });
      if (touched) queue(25);
    });
    observer.observe(social, { childList: true, subtree: true, characterData: true });
  }

  async function load() {
    try {
      const [aRes, bRes, fRes] = await Promise.all([
        fetch('./data/social-content-1.json', { cache: 'no-store' }),
        fetch('./data/social-content-2.json', { cache: 'no-store' }),
        fetch('./data/followers-v2.json', { cache: 'no-store' })
      ]);
      if (!aRes.ok || !bRes.ok || !fRes.ok) throw new Error('Social canonical sources unavailable');
      const [a, b, f] = await Promise.all([aRes.json(), bRes.json(), fRes.json()]);
      contentRows = [...hydrate(a), ...hydrate(b)];
      followerRows = hydrate(f);
      patchStaticCopy();
      observeSocial();
      queue(10);
      [150, 500, 1000].forEach(ms => setTimeout(() => queue(0), ms));
    } catch (err) {
      console.error('No se pudo cargar el cierre canónico de Social', err);
    }
  }

  function boot() {
    patchStaticCopy();
    load();
    document.addEventListener('click', e => {
      if (e.target.closest?.('#social-platform-tabs button,#period-mode button,#reset-filters')) setTimeout(() => queue(0), 100);
    });
    document.addEventListener('change', e => {
      if (e.target.closest?.('#period-controls,#campaign-filter')) setTimeout(() => queue(0), 80);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
