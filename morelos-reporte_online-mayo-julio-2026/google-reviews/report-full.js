const fmt = new Intl.NumberFormat('es-MX');
const pct = v => `${(v * 100).toFixed(1)}%`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const order = ['59th','50th','NW 23rd','MacArthur','Moore','Admiral','Garnett','Harvard','129th','Peoria','Broken Arrow'];
let summary;
let cards = [];

function kpi(label, value, note, cls = '') {
  return `<article class="kpi ${cls}"><span>${label}</span><b>${value}</b><small>${note}</small></article>`;
}

function weightedRating(stores) {
  const total = stores.reduce((a, s) => a + s.google_total, 0);
  if (!total) return null;
  return stores.reduce((a, s) => a + (s.rating * s.google_total), 0) / total;
}

function aggregate(stores) {
  const reviews = stores.reduce((a, s) => a + s.scraped_reviews, 0);
  const positive = stores.reduce((a, s) => a + s.positive_n, 0);
  const neutral = stores.reduce((a, s) => a + s.neutral_n, 0);
  const negative = stores.reduce((a, s) => a + s.negative_n, 0);
  const text = stores.reduce((a, s) => a + s.text_reviews, 0);
  const publicTotal = stores.reduce((a, s) => a + s.google_total, 0);
  return {
    stores: stores.length,
    reviews,
    positive,
    neutral,
    negative,
    text,
    publicTotal,
    positivePct: reviews ? positive / reviews : 0,
    neutralPct: reviews ? neutral / reviews : 0,
    negativePct: reviews ? negative / reviews : 0,
    rating: weightedRating(stores)
  };
}

function renderKpis(stores) {
  const a = aggregate(stores);
  const scope = a.stores === 1 ? '1 ficha visible' : `${a.stores} fichas visibles`;
  document.getElementById('kpis').innerHTML =
    kpi('Reviews analizadas', fmt.format(a.reviews), `${fmt.format(a.reviews)} review IDs · filtro actual`) +
    kpi('Rating público ponderado', a.rating == null ? '—' : `${a.rating.toFixed(2)} ★`, scope) +
    kpi('Positivo', a.reviews ? pct(a.positivePct) : '—', `${fmt.format(a.positive)} reviews 4–5★`, 'pos') +
    kpi('Neutral', a.reviews ? pct(a.neutralPct) : '—', `${fmt.format(a.neutral)} reviews 3★`) +
    kpi('Negativo', a.reviews ? pct(a.negativePct) : '—', `${fmt.format(a.negative)} reviews 1–2★`, 'neg');
}

function renderMarkets(stores) {
  const marketFilter = document.getElementById('marketFilter').value;
  const markets = [
    ['OKC Metro', stores.filter(s => s.market === 'OKC Metro')],
    ['Tulsa Metro', stores.filter(s => s.market === 'Tulsa Metro')]
  ].filter(([name]) => marketFilter === 'all' || (marketFilter === 'OKC' && name === 'OKC Metro') || (marketFilter === 'Tulsa' && name === 'Tulsa Metro'));

  const grid = document.getElementById('marketGrid');
  if (!markets.length) {
    grid.innerHTML = '<article class="market-card"><b>Sin sucursales visibles con estos filtros.</b></article>';
    return;
  }

  grid.innerHTML = markets.map(([name, list]) => {
    const a = aggregate(list);
    const rating = a.rating == null ? '—' : `${a.rating.toFixed(2)} ★`;
    const note = name === 'Tulsa Metro' ? `${a.stores} sucursales visibles · Admiral sin registros` : `${a.stores} sucursales visibles`;
    return `<article class="market-card">
      <div class="market-top"><div><span class="market-name">${name}</span><small>${note}</small></div><div class="market-rating">${rating}<small>rating público ponderado</small></div></div>
      <div class="market-kpis">
        <div><span>Reviews</span><b>${fmt.format(a.reviews)}</b></div>
        <div><span>Positivo</span><b>${a.reviews ? pct(a.positivePct) : '—'}</b></div>
        <div><span>Neutral</span><b>${a.reviews ? pct(a.neutralPct) : '—'}</b></div>
        <div><span>Negativo</span><b>${a.reviews ? pct(a.negativePct) : '—'}</b></div>
      </div>
      ${a.reviews ? `<div class="market-bar"><i class="p" style="width:${a.positivePct * 100}%"></i><i class="m" style="width:${a.neutralPct * 100}%"></i><i class="n" style="width:${a.negativePct * 100}%"></i></div>` : ''}
    </article>`;
  }).join('');
}

function renderRanking(stores) {
  const target = document.getElementById('rankList');
  const rank = [...stores].sort((a, b) => b.positive_pct - a.positive_pct);
  if (!rank.length) {
    target.innerHTML = '<p class="empty">No hay sucursales con esta combinación de filtros.</p>';
    return;
  }
  target.innerHTML = rank.map(s => `<div class="rank-row"><span>${esc(s.branch)}</span><i><b style="width:${s.positive_pct * 100}%"></b></i><strong>${pct(s.positive_pct)}</strong><small>${fmt.format(s.scraped_reviews)} reviews</small></div>`).join('');
}

function renderInsights(stores) {
  const target = document.getElementById('insightGrid');
  if (!stores.length) {
    target.innerHTML = '<article><span>01</span><h3>Sin datos visibles</h3><p>La combinación actual de filtros no contiene sucursales con registros en el CSV.</p></article>';
    return;
  }

  const a = aggregate(stores);
  const best = [...stores].sort((x, y) => y.positive_pct - x.positive_pct)[0];
  const mostNegative = [...stores].sort((x, y) => y.negative_pct - x.negative_pct)[0];
  const okc = stores.filter(s => s.market === 'OKC Metro');
  const tulsa = stores.filter(s => s.market === 'Tulsa Metro');
  const insights = [
    ['El universo visible cambia con los filtros', `${fmt.format(a.reviews)} reviews recuperadas permanecen en la vista actual; ${pct(a.positivePct)} son positivas y ${pct(a.negativePct)} negativas.`],
    ['Mayor proporción positiva en la selección', `${best.branch} registra ${pct(best.positive_pct)} positivo sobre ${fmt.format(best.scraped_reviews)} reviews recuperadas.`],
    ['Mayor proporción negativa en la selección', `${mostNegative.branch} registra ${pct(mostNegative.negative_pct)} negativo sobre ${fmt.format(mostNegative.scraped_reviews)} reviews recuperadas.`]
  ];
  if (okc.length && tulsa.length) {
    const ao = aggregate(okc), at = aggregate(tulsa);
    insights.push(['OKC y Tulsa dentro del filtro actual', `OKC registra ${pct(ao.positivePct)} positivo y Tulsa ${pct(at.positivePct)} sobre las sucursales visibles.`]);
  }
  target.innerHTML = insights.map((x, i) => `<article><span>0${i + 1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('');
}

function renderReview(r, cls) {
  return `<article class="review-item ${cls}"><div class="review-meta"><span>${esc(r.date)}</span><span>${'★'.repeat(r.stars)}</span><span>${esc(r.reviewer)}</span></div><p>${esc(r.text)}</p><a href="${esc(r.url)}" target="_blank" rel="noopener">Abrir en Google ↗</a></article>`;
}

async function loadComments(slug, details) {
  if (details.dataset.loaded === '1') return;
  const panel = details.querySelector('.reviews-panel');
  panel.innerHTML = '<div class="loading-card">Cargando comentarios…</div>';
  try {
    const r = await fetch(`/google-reviews/data/comments/${slug}.json?v=20260819-2`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const pos = d.positive.length ? d.positive.map(x => renderReview(x, 'positive')).join('') : '<p class="empty">No hay positivos con texto.</p>';
    const neg = d.negative.length ? d.negative.map(x => renderReview(x, 'negative')).join('') : '<p class="empty">No hay negativos con texto.</p>';
    panel.innerHTML = `<section><div class="review-col-title"><b>Positivos recientes</b><span>${d.positive.length}/10</span></div>${pos}</section><section><div class="review-col-title"><b>Negativos recientes</b><span>${d.negative.length}/10</span></div>${neg}</section>`;
    details.dataset.loaded = '1';
  } catch (e) {
    panel.innerHTML = '<p class="empty">No se pudieron cargar los comentarios recientes.</p>';
  }
}

function storeCard(s, index) {
  const market = s.market === 'OKC Metro' ? 'OKC' : 'Tulsa';
  const capped = s.scraped_reviews === 500 ? '<span class="badge warn">Extracción topada en 500</span>' : '';
  return `<article class="store-card" data-branch="${esc(s.branch)}" data-market="${market}" data-rating="${s.rating}" data-neg="${(s.negative_pct * 100).toFixed(2)}">
    <div class="store-top"><span class="store-num">${String(index).padStart(2, '0')}</span><div><h3>${esc(s.branch)}</h3><small>${esc(s.city)} · ${esc(s.market)}</small></div><div class="rating">${s.rating.toFixed(1)} ★<small>${fmt.format(s.google_total)} públicas</small></div></div>
    <div class="coverage-row"><span><b>${fmt.format(s.scraped_reviews)}</b>reviews analizadas</span><span><b>${pct(s.coverage)}</b>del contador público</span><span><b>${fmt.format(s.text_reviews)}</b>con texto</span></div>
    <div class="store-mid"><div class="donut" style="--pos:${s.positive_pct * 100};--neu:${s.neutral_pct * 100}"><span>${fmt.format(s.scraped_reviews)}<small>reviews</small></span></div><div class="legend"><div><i class="p"></i><span>Positivo<small>${fmt.format(s.positive_n)} reviews</small></span><b>${pct(s.positive_pct)}</b></div><div><i class="m"></i><span>Neutral<small>${fmt.format(s.neutral_n)} reviews</small></span><b>${pct(s.neutral_pct)}</b></div><div><i class="n"></i><span>Negativo<small>${fmt.format(s.negative_n)} reviews</small></span><b>${pct(s.negative_pct)}</b></div></div></div>
    <div class="date-range">Periodo recuperado: ${s.first_date} → ${s.last_date}</div>${capped}
    <details data-slug="${s.slug}"><summary>Ver comentarios recientes</summary><div class="reviews-panel"></div></details>
  </article>`;
}

function missingCard(index) {
  return `<article class="store-card missing" data-market="Tulsa"><div class="store-top"><span class="store-num">${String(index).padStart(2, '0')}</span><div><h3>Admiral</h3><small>Tulsa · Tulsa Metro</small></div><div class="badge unavailable">Sin datos</div></div><div class="missing-body"><b>Esta sucursal no viene en el CSV recibido.</b><p>No se incluye en sentiment ni comparativas.</p></div></article>`;
}

function selectedStores() {
  const m = document.getElementById('marketFilter').value;
  const r = document.getElementById('ratingFilter').value;
  const n = document.getElementById('negFilter').value;
  return summary.stores.filter(s => {
    if (m !== 'all') {
      const market = s.market === 'OKC Metro' ? 'OKC' : 'Tulsa';
      if (market !== m) return false;
    }
    if (r === 'high' && s.rating < 4.4) return false;
    if (r === 'mid' && s.rating !== 4.3) return false;
    if (r === 'low' && s.rating > 4.2) return false;
    const neg = s.negative_pct * 100;
    if (n === 'high' && neg < 12) return false;
    if (n === 'mid' && (neg < 9 || neg >= 12)) return false;
    if (n === 'low' && neg >= 9) return false;
    return true;
  });
}

function applyFilters() {
  const selected = selectedStores();
  const selectedBranches = new Set(selected.map(s => s.branch));
  const m = document.getElementById('marketFilter').value;
  const r = document.getElementById('ratingFilter').value;
  const n = document.getElementById('negFilter').value;

  let visible = 0;
  cards.forEach(c => {
    if (c.classList.contains('missing')) {
      const showMissing = (m === 'all' || m === 'Tulsa') && r === 'all' && n === 'all';
      c.hidden = !showMissing;
      if (showMissing) visible++;
      return;
    }
    const show = selectedBranches.has(c.dataset.branch);
    c.hidden = !show;
    if (show) visible++;
  });

  const active = [m, r, n].filter(v => v !== 'all').length;
  document.getElementById('filterStatus').textContent = `Mostrando ${visible} de ${cards.length} sucursales${active ? ` · ${active} filtro${active === 1 ? '' : 's'} activo${active === 1 ? '' : 's'}` : ''}`;
  document.getElementById('resetFilters').textContent = active ? `Restablecer (${active})` : 'Restablecer';

  renderKpis(selected);
  renderMarkets(selected);
  renderRanking(selected);
  renderInsights(selected);
}

async function init() {
  const res = await fetch('/google-reviews/data/summary.json?v=20260819-2');
  if (!res.ok) throw new Error(`Summary HTTP ${res.status}`);
  summary = await res.json();
  const o = summary.overall;

  document.getElementById('heroCopy').textContent = `Sentiment calculado sobre todos los registros únicos recuperados en el CSV recibido. Los filtros recalculan en tiempo real reviews, rating ponderado y sentiment.`;
  const coverage = o.scraped_reviews / o.google_total_dataset_stores;
  document.getElementById('integrityNote').innerHTML = `<b>Cobertura del archivo:</b> ${fmt.format(o.scraped_reviews)} reviews recuperadas de ${fmt.format(o.google_total_dataset_stores)} calificaciones públicas reportadas en las 10 fichas presentes (${pct(coverage)}). Admiral no viene en el CSV y varias tiendas parecen topadas por el scraper.`;

  const map = Object.fromEntries(summary.stores.map(s => [s.branch, s]));
  document.getElementById('storeGrid').innerHTML = order.map((b, i) => b === 'Admiral' ? missingCard(i + 1) : storeCard(map[b], i + 1)).join('');
  cards = [...document.querySelectorAll('.store-card')];
  cards.forEach(c => {
    const d = c.querySelector('details');
    if (d) d.addEventListener('toggle', () => { if (d.open) loadComments(d.dataset.slug, d); });
  });

  document.getElementById('topicEyebrow').textContent = `${fmt.format(o.text_reviews)} reviews con texto · lectura global`;
  document.getElementById('topicGrid').innerHTML = summary.topics.slice(0, 8).map(t => `<article class="topic-card"><div class="topic-head"><b>${t.topic}</b><span>${fmt.format(t.mentions)}</span></div><div class="topic-bar"><i class="p" style="width:${t.positive_n / t.mentions * 100}%"></i><i class="m" style="width:${t.neutral_n / t.mentions * 100}%"></i><i class="n" style="width:${t.negative_n / t.mentions * 100}%"></i></div><small>${fmt.format(t.positive_n)} positivas · ${fmt.format(t.neutral_n)} neutrales · ${fmt.format(t.negative_n)} negativas</small></article>`).join('');

  document.getElementById('methodCopy').innerHTML = `<b>Sentiment:</b> 4–5★ = positivo, 3★ = neutral, 1–2★ = negativo. Los KPIs y la comparativa de mercados se recalculan sobre las sucursales visibles según los filtros. <b>Temas:</b> permanecen globales porque el archivo procesado de tags no está desagregado por tienda.`;

  ['marketFilter', 'ratingFilter', 'negFilter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  document.getElementById('resetFilters').addEventListener('click', () => {
    ['marketFilter', 'ratingFilter', 'negFilter'].forEach(id => document.getElementById(id).value = 'all');
    applyFilters();
  });
  applyFilters();
}

init().catch(err => {
  console.error(err);
  document.getElementById('heroCopy').textContent = 'No se pudo cargar la base procesada.';
});
