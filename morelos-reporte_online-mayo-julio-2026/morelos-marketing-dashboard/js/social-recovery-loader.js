(() => {
  'use strict';

  const nativeFetch = window.fetch.bind(window);
  let recoveryPromise = null;

  function isSocialContent2(input) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    return /(?:^|\/)social-content-2\.json(?:\?|$)/.test(url);
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

  window.fetch = async function patchedFetch(input, init) {
    const response = await nativeFetch(input, init);
    if (!isSocialContent2(input) || !response.ok) return response;

    try {
      const [base, recovery] = await Promise.all([response.clone().json(), getRecovery()]);
      if (!Array.isArray(recovery?.rows) || !recovery.rows.length) return response;
      const merged = { ...base, rows: [...(base.rows || []), ...recovery.rows] };
      const headers = new Headers(response.headers);
      headers.set('content-type', 'application/json; charset=utf-8');
      headers.delete('content-length');
      return new Response(JSON.stringify(merged), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (err) {
      console.error('No se pudo aplicar la recuperación Social de junio', err);
      return response;
    }
  };
})();
