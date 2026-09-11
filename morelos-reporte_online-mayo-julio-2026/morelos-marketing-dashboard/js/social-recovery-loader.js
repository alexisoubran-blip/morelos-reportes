(() => {
  'use strict';

  const nativeFetch = window.fetch.bind(window);
  let recoveryPromise = null;
  const extensionPromises = new Map();
  let defaultApplied = false;

  const urlOf = input => typeof input === 'string' ? input : (input && input.url) || '';
  const matches = (input, file) => new RegExp(`(?:^|/)${file.replace('.', '\\.')}(?:\\?|$)`).test(urlOf(input));

  function getJSON(path) {
    if (!extensionPromises.has(path)) {
      extensionPromises.set(path, nativeFetch(path, { cache: 'no-store' }).then(r => {
        if (!r.ok) throw new Error(`Data source unavailable: ${path}`);
        return r.json();
      }));
    }
    return extensionPromises.get(path);
  }

  function getRecovery() {
    if (!recoveryPromise) {
      recoveryPromise = nativeFetch('./data/social-content-recovery.json', { cache: 'no-store' })
        .then(r => {
          if (!r.ok) throw new Error('Social recovery source unavailable');
          return r.json();
        });
    }
    return recoveryPromise;
  }

  function jsonResponse(response, body) {
    const headers = new Headers(response.headers);
    headers.set('content-type', 'application/json; charset=utf-8');
    headers.delete('content-length');
    return new Response(JSON.stringify(body), {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  window.fetch = async function patchedFetch(input, init) {
    const response = await nativeFetch(input, init);
    if (!response.ok) return response;

    try {
      if (matches(input, 'social-content-2.json')) {
        const [base, recovery, fb, ig] = await Promise.all([
          response.clone().json(),
          getRecovery(),
          getJSON('./data/social-august-facebook-2026.json'),
          getJSON('./data/social-august-instagram-2026.json')
        ]);
        return jsonResponse(response, {
          ...base,
          rows: [...(base.rows || []), ...(recovery.rows || []), ...(fb.rows || []), ...(ig.rows || [])]
        });
      }

      if (matches(input, 'paid-v2.json')) {
        const [base, august] = await Promise.all([
          response.clone().json(),
          getJSON('./data/paid-august-2026.json')
        ]);
        return jsonResponse(response, {
          ...base,
          rows: [...(base.rows || []), ...(august.rows || [])]
        });
      }

      if (matches(input, 'offline-v2.json')) {
        const [base, august] = await Promise.all([
          response.clone().json(),
          getJSON('./data/offline-august-2026.json')
        ]);
        return jsonResponse(response, {
          ...base,
          metadata: { ...(base.metadata || {}), export_end: '2026-08-31', loaded_at: '2026-09-11' },
          rows: [...(base.rows || []), ...(august.rows || [])]
        });
      }

      if (matches(input, 'analytics-v2.json')) {
        const base = await response.clone().json();
        return jsonResponse(response, {
          ...base,
          metadata: { ...(base.metadata || {}), export_end: '2026-08-31', dashboard_coverage_end: '2026-08-31' }
        });
      }
    } catch (err) {
      console.error('No se pudo aplicar la extensión de datos de agosto', err);
    }

    return response;
  };

  function includesAugust() {
    const active = document.querySelector('#period-mode button.active')?.dataset.mode;
    if (active === 'month') return document.querySelector('#month-select')?.value === '2026-08';
    if (active === 'week') {
      const v = document.querySelector('#week-select')?.value || '';
      return v.startsWith('2026-08') || v === '2026-07-27';
    }
    const from = document.querySelector('#from-month')?.value;
    const to = document.querySelector('#to-month')?.value;
    return Boolean(from && to && from <= '2026-08' && to >= '2026-08');
  }

  function setText(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }

  function setGap(el, text) {
    if (el && !el.querySelector('.august-source-gap')) {
      el.innerHTML = `<div class="empty-state august-source-gap">${text}</div>`;
    }
  }

  function patchUI() {
    setText(document.querySelector('.hero-badge strong'), 'Jun–Ago 2026');
    setText(
      document.querySelector('#analytics .section-heading .section-note'),
      'GA4 está disponible hasta julio. Agosto queda pendiente hasta recibir el export de Analytics; Paid, Social y Offline sí incluyen agosto.'
    );

    const gap = includesAugust();
    const follow = document.querySelector('#social-follows');
    const followNote = follow?.parentElement?.querySelector('small');

    if (gap) {
      setText(follow, '—');
      setText(followNote, 'Fuente followers de agosto no recibida');
      ['ga-users','ga-views','ga-events'].forEach(id => setText(document.getElementById(id), '—'));
      setText(document.querySelector('#ga-users')?.parentElement?.querySelector('small'), 'GA4 agosto pendiente');
      setText(document.querySelector('#ga-views')?.parentElement?.querySelector('small'), 'GA4 agosto pendiente');
      setText(document.querySelector('#ga-events')?.parentElement?.querySelector('small'), 'GA4 agosto pendiente');
      setGap(document.querySelector('#analytics-chart'), 'GA4 de agosto no fue incluido en esta actualización.');
      setGap(document.querySelector('#traffic-sources'), 'Fuentes de tráfico disponibles hasta julio.');
      setGap(document.querySelector('#top-pages'), 'Páginas principales disponibles hasta julio.');
      document.querySelectorAll('#offline .offline-empty-list').forEach(el =>
        setText(el, 'KPIs y spots de agosto conciliados; el detalle por estación aún no está indexado en esta vista.')
      );
      const banner = document.querySelector('#coverage-banner');
      if (banner && !banner.querySelector('.august-gap-inline')) {
        banner.insertAdjacentHTML(
          'beforeend',
          ' &nbsp;·&nbsp; <span class="august-gap-inline"><strong>Coverage gap:</strong> GA4, followers y TikTok performance de agosto pendientes.</span>'
        );
      }
    } else {
      setText(followNote, 'No atribuible por campaña');
      setText(document.querySelector('#ga-users')?.parentElement?.querySelector('small'), 'Promedio diario');
      setText(document.querySelector('#ga-views')?.parentElement?.querySelector('small'), '07_GA4_PAGES');
      setText(document.querySelector('#ga-events')?.parentElement?.querySelector('small'), '06_GA4 · Period Channel');
    }

    const reset = document.querySelector('#reset-filters');
    if (reset && !reset.dataset.augustResetPatch) {
      reset.dataset.augustResetPatch = '1';
      reset.addEventListener('click', () => {
        setTimeout(() => {
          defaultApplied = false;
          applyDefaultAugust();
        }, 0);
      }, true);
    }
  }

  function applyDefaultAugust() {
    if (defaultApplied) return;
    const monthButton = document.querySelector('#period-mode button[data-mode="month"]');
    const anyMonthControl = document.querySelector('#month-select, #to-month');
    if (!monthButton || !anyMonthControl) return;
    const hasAugust = Array.from(document.querySelectorAll('#month-select option, #to-month option')).some(o => o.value === '2026-08');
    if (!hasAugust) return;

    defaultApplied = true;
    if (!monthButton.classList.contains('active')) monthButton.click();
    setTimeout(() => {
      const select = document.querySelector('#month-select');
      if (select && Array.from(select.options).some(o => o.value === '2026-08')) {
        select.value = '2026-08';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      patchUI();
    }, 0);
  }

  const observer = new MutationObserver(() => {
    applyDefaultAugust();
    patchUI();
  });

  window.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    applyDefaultAugust();
    patchUI();
    setTimeout(() => { applyDefaultAugust(); patchUI(); }, 120);
  });
})();
