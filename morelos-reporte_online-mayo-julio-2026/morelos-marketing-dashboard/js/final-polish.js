(() => {
  'use strict';

  const ICONS = {
    Meta: `<svg viewBox="0 0 32 20" aria-hidden="true"><path d="M3 16.5C5.2 7.7 8.5 3.3 12 3.3c4.8 0 7.2 13.4 10.8 13.4 2.5 0 4.1-3.6 6.2-10" fill="none" stroke="#1686ff" stroke-width="3.1" stroke-linecap="round"/><path d="M3 16.5C5.4 6.6 8.4 3.3 12 3.3c4.5 0 7.4 13.4 10.8 13.4" fill="none" stroke="#0a66ff" stroke-width="3.1" stroke-linecap="round"/></svg>`,
    Google: `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M8.2 22.5a4.8 4.8 0 0 1-4.2-7.2L10.8 3.8a4.8 4.8 0 0 1 8.3 0l6.8 11.5a4.8 4.8 0 0 1-4.2 7.2 4.8 4.8 0 0 1-4.1-2.4L14 14 10.4 20a4.8 4.8 0 0 1-2.2 2.5Z" fill="#4285F4"/><path d="M10.8 3.8a4.8 4.8 0 0 1 8.3 0l2.7 4.6-4.6 7.8L10.8 5.3a4.8 4.8 0 0 1 0-1.5Z" fill="#34A853"/><circle cx="8.1" cy="18" r="4.6" fill="#FBBC04"/></svg>`,
    'YouTube / CTV': `<svg viewBox="0 0 32 23" aria-hidden="true"><rect x="1" y="2" width="30" height="19" rx="6" fill="#ff0033"/><path d="m13 7.3 8.3 4.2L13 15.7Z" fill="#fff"/></svg>`,
    Facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.2-1.5 1.6-1.5H17V4a22 22 0 0 0-2.4-.1c-2.4 0-4.1 1.5-4.1 4.2V10H7.8v3h2.7v8Z" fill="#fff"/></svg>`,
    Instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="ig-g" x1="0" y1="24" x2="24" y2="0"><stop stop-color="#ffd600"/><stop offset=".32" stop-color="#ff7a00"/><stop offset=".58" stop-color="#ff0169"/><stop offset=".82" stop-color="#d300c5"/><stop offset="1" stop-color="#7638fa"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig-g)"/><rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="16.8" cy="7.4" r="1.1" fill="#fff"/></svg>`,
    TikTok: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#111"/><path d="M13.7 5.2v8.1a3.7 3.7 0 1 1-3.1-3.6" fill="none" stroke="#25F4EE" stroke-width="2.7" stroke-linecap="round"/><path d="M14.6 4.6c.4 2 1.6 3.3 3.7 3.8" fill="none" stroke="#FE2C55" stroke-width="2.7" stroke-linecap="round"/><path d="M14.1 4.8v8.5a3.7 3.7 0 1 1-3-3.6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>`
  };

  function addStyles() {
    if (document.getElementById('final-polish-style')) return;
    const style = document.createElement('style');
    style.id = 'final-polish-style';
    style.textContent = `
      .redundant-channel-panel{display:none!important}
      @media(min-width:761px){
        .site-header{height:72px!important;padding-top:0!important;padding-bottom:0!important;align-items:center!important}
        .site-header .brand{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:116px!important;height:56px!important;overflow:hidden!important;flex:0 0 116px!important}
        .site-header .brand img{display:block!important;width:108px!important;height:auto!important;max-height:52px!important;object-fit:contain!important;object-position:left center!important}
      }
      .brand-platform-title{display:flex;align-items:center;gap:9px;min-width:0}
      .brand-platform-title h4{margin:0}
      .brand-mark-paid{width:29px;height:29px;display:grid;place-items:center;flex:0 0 29px;padding:4px;border-radius:9px;background:rgba(255,255,255,.96);box-shadow:0 4px 12px rgba(0,0,0,.11)}
      .brand-mark-paid svg{width:100%;height:100%;display:block}
      .platform-badge{padding:0!important;width:24px!important;min-width:24px!important;height:24px!important;background:transparent!important;overflow:visible!important}
      .platform-badge .brand-social-icon{width:22px;height:22px;display:block}
      .social-brand-tab{display:inline-flex!important;align-items:center!important;gap:5px!important}
      .social-brand-tab .brand-tab-icon{width:15px;height:15px;display:block}
      @media(max-width:760px){.brand-mark-paid{width:25px;height:25px;flex-basis:25px}.brand-platform-title{gap:7px}}
    `;
    document.head.appendChild(style);
  }

  function patchOverview() {
    const paidPanel = document.getElementById('campaign-split')?.closest('.panel');
    if (paidPanel) {
      const h = paidPanel.querySelector('h3');
      const chip = paidPanel.querySelector('.status-chip');
      if (h) h.textContent = 'Split de inversión Paid';
      if (chip) chip.textContent = 'Paid';
    }
    const combined = document.getElementById('marketing-allocation-panel');
    if (combined) {
      const h = combined.querySelector('h3');
      if (h) h.textContent = 'Paid + Offline';
    }
    const redundant = document.getElementById('channel-investment')?.closest('.panel');
    if (redundant) redundant.classList.add('redundant-channel-panel');
  }

  function paidName(card) {
    const title = card.querySelector('h4');
    return title?.textContent?.trim() || '';
  }

  function patchPaidCards() {
    document.querySelectorAll('#platform-performance .platform-card').forEach(card => {
      const title = card.querySelector('h4');
      const name = paidName(card);
      if (!title || !ICONS[name]) return;
      let wrap = title.closest('.brand-platform-title');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'brand-platform-title';
        title.parentNode.insertBefore(wrap, title);
        wrap.appendChild(title);
      }
      if (!wrap.querySelector('.brand-mark-paid')) {
        const icon = document.createElement('span');
        icon.className = 'brand-mark-paid';
        icon.innerHTML = ICONS[name];
        wrap.insertBefore(icon, title);
      }
    });
  }

  function socialName(badge) {
    if (badge.classList.contains('fb')) return 'Facebook';
    if (badge.classList.contains('ig')) return 'Instagram';
    if (badge.classList.contains('tt')) return 'TikTok';
    return badge.textContent.trim();
  }

  function patchSocial() {
    document.querySelectorAll('.platform-badge').forEach(badge => {
      const name = socialName(badge);
      if (!ICONS[name] || badge.querySelector('.brand-social-icon')) return;
      badge.textContent = '';
      badge.setAttribute('aria-label', name);
      const icon = document.createElement('span');
      icon.className = 'brand-social-icon';
      icon.innerHTML = ICONS[name];
      badge.appendChild(icon);
    });

    document.querySelectorAll('#social-platform-tabs button[data-platform]').forEach(btn => {
      const name = btn.dataset.platform;
      if (!ICONS[name] || btn.querySelector('.brand-tab-icon')) return;
      const label = btn.textContent.trim();
      btn.textContent = '';
      btn.classList.add('social-brand-tab');
      const icon = document.createElement('span');
      icon.className = 'brand-tab-icon';
      icon.innerHTML = ICONS[name];
      const text = document.createElement('span');
      text.textContent = label;
      btn.append(icon, text);
    });
  }

  let queued = false;
  function patchAll() {
    queued = false;
    addStyles();
    patchOverview();
    patchPaidCards();
    patchSocial();
  }
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(patchAll);
  }
  function boot() {
    queue();
    new MutationObserver(queue).observe(document.body, {subtree:true, childList:true});
    document.addEventListener('change', queue);
    document.addEventListener('click', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
