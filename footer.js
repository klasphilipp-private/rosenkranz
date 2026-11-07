const footerScript = document.currentScript;
const appBase = new URL('.', footerScript?.src || location.href);
fetch(new URL('footer.html?v=20261107-forms', appBase)).then(response => {
  if (!response.ok) throw new Error('Footer konnte nicht geladen werden');
  return response.text();
}).then(markup => {
  const holder = document.createElement('div');
  holder.innerHTML = markup;
  holder.querySelectorAll('[href], [src]').forEach(node => {
    for (const attribute of ['href', 'src']) {
      const value = node.getAttribute(attribute);
      if (!value || value.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value)) continue;
      node.setAttribute(attribute, new URL(value, appBase).href);
    }
  });
  document.querySelector('#shared-footer').replaceChildren(...holder.childNodes);
  if (location.hash === '#kontakt') requestAnimationFrame(() => document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  const formClient = document.createElement('script');
  formClient.src = new URL('forms.js?v=20261107-forms', appBase).href;
  document.head.append(formClient);
  return fetch(new URL('google-reviews.json?v=latest', appBase), { cache: 'no-store' });
}).then(response => response?.ok ? response.json() : null).then(data => {
  if (!data?.configured) return;
  const rating = document.querySelector('#google-rating-label');
  if (rating) rating.textContent = `${data.rating?.toLocaleString('de-DE')} von 5 · ${data.reviewCount} Google Bewertungen`;
  const updated = document.querySelector('#google-updated');
  if (updated) updated.textContent = `Stand: ${new Date(data.updated).toLocaleDateString('de-DE')}`;
  const grid = document.querySelector('#reviews-live');
  if (grid) {
    const eligible = (data.reviews || []).filter(review => Number(review.rating) >= 4);
    let offset = 0;
    try { offset = Number(localStorage.getItem('rosenkranz-review-offset') || 0) % Math.max(eligible.length, 1); localStorage.setItem('rosenkranz-review-offset', String(offset + 2)); } catch {}
    const selected = eligible.length ? Array.from({length: Math.min(2, eligible.length)}, (_, index) => eligible[(offset + index) % eligible.length]) : [];
    grid.innerHTML = selected.map(review => `<article class="review-card"><span class="stars" aria-label="${review.rating} von 5 Sternen">${'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating || 0))))}</span><p>${escapeHtml(review.text)}</p><strong>${escapeHtml(review.author)}</strong>${review.date ? `<div class="offer-meta">${escapeHtml(review.date)}</div>` : ''}</article>`).join('');
  }
}).catch(() => {});

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
