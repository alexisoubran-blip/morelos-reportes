(() => {
  'use strict';

  const EXPECTED_PAID = [
    ['Meta', '#1877F2'],
    ['Google', '#0d7b4b'],
    ['YouTube / CTV', '#FF0033'],
    ['TikTok', '#111111']
  ];

  function ensureSelectOption(select, value, label=value) {
    if (!select || [...select.options].some(o => o.value === value)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  function ensureFutureChannels() {
    const select = document.getElementById('channel-filter');
    if (!select) return;
    EXPECTED_PAID.forEach(([name]) => ensureSelectOption(select, name));
    ensureSelectOption(select, 'Spotify');
  }

  function mutedPlatformCard(name, color) {
    return `<div class="platform-card muted-platform future-platform" data-future-platform="${name}" style="border-top:4px solid ${color}">
      <div class="platform-top"><h4>${name}</h4><span class="status-chip muted">Preparado</span></div>
      <div class="platform-value">—</div>
      <p>Sin data en 03_PAID_MEDIA para el periodo seleccionado.</p>
    </div>`;
  }

  function ensurePaidPlaceholders() {
    const wrap = document.getElementById('platform-performance');
    const select = document.getElementById('channel-filter');
    if (!wrap || !select) return;

    const selected = select.value || 'all';
    wrap.querySelectorAll('.future-platform').forEach(el => el.remove());

    if (selected === 'all') {
      const currentText = wrap.textContent || '';
      EXPECTED_PAID.forEach(([name, color]) => {
        if (!currentText.includes(name)) wrap.insertAdjacentHTML('beforeend', mutedPlatformCard(name, color));
      });
      return;
    }

    const expected = EXPECTED_PAID.find(([name]) => name === selected);
    if (!expected) return;
    if (wrap.querySelector('.empty-state') || !wrap.textContent.trim()) {
      wrap.innerHTML = mutedPlatformCard(expected[0], expected[1]);
    }
  }

  function ensureSocialTikTokTab() {
    const tabs = document.getElementById('social-platform-tabs');
    if (!tabs) return;
    if (![...tabs.querySelectorAll('button[data-platform]')].some(b => b.dataset.platform === 'TikTok')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.platform = 'TikTok';
      b.textContent = 'TikTok';
      tabs.appendChild(b);
    }
  }

  function refreshFutureUi() {
    ensureFutureChannels();
    ensurePaidPlaceholders();
    ensureSocialTikTokTab();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(refreshFutureUi));
  document.addEventListener('DOMContentLoaded', () => {
    refreshFutureUi();
    ['channel-filter','platform-performance','social-platform-tabs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el, {childList:true, subtree:true});
    });
    document.getElementById('channel-filter')?.addEventListener('change', () => requestAnimationFrame(refreshFutureUi));
  });
})();
