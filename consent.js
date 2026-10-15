(function () {
  const STORAGE_KEY = 'rosenkranz-consent-v1';
  const POLICY_VERSION = 1;
  const safeRead = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return value?.version === POLICY_VERSION ? value : null;
    } catch (_) { return null; }
  };
  let choice = safeRead();

  function hydrateExternalMedia() {
    if (!choice?.externalMedia) return;
    document.querySelectorAll('[data-external-src]').forEach((node) => {
      if (!node.getAttribute('src')) node.setAttribute('src', node.dataset.externalSrc);
      node.closest('.offer-photo')?.classList.add('has-external-media');
      node.removeAttribute('data-external-src');
    });
    document.querySelectorAll('[data-video-frame]').forEach((container) => {
      if (container.querySelector('iframe')) return;
      const frame = document.createElement('iframe');
      frame.src = container.dataset.videoSrc;
      frame.title = container.dataset.videoTitle || 'Automobile Rosenkranz – Unternehmensvideo';
      frame.loading = 'lazy';
      frame.allow = 'encrypted-media; picture-in-picture';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allowFullscreen = true;
      container.replaceChildren(frame);
    });
    document.querySelectorAll('.media-consent-placeholder').forEach((node) => node.remove());
  }

  window.RosenkranzConsent = {
    get choice() { return choice; },
    hasExternalMedia() { return Boolean(choice?.externalMedia); },
    hydrateExternalMedia,
    openSettings() { showPanel(true); },
    save(next) {
      const wasAllowed = Boolean(choice?.externalMedia);
      choice = { version: POLICY_VERSION, necessary: true, externalMedia: Boolean(next.externalMedia), savedAt: new Date().toISOString() };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(choice)); } catch (_) {}
      document.documentElement.dataset.externalMedia = choice.externalMedia ? 'allowed' : 'blocked';
      if (choice.externalMedia) hydrateExternalMedia();
      document.dispatchEvent(new CustomEvent('rosenkranz:consent-change', { detail: choice }));
      closePanel();
      if (wasAllowed && !choice.externalMedia) window.location.reload();
    }
  };
  document.documentElement.dataset.externalMedia = choice?.externalMedia ? 'allowed' : 'blocked';

  let panel;
  function closePanel() {
    if (!panel) return;
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
  }
  function showPanel(settings) {
    if (!panel) return;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('is-settings', Boolean(settings));
    const settingsButton = panel.querySelector('[data-consent-settings]');
    if (settingsButton) settingsButton.textContent = settings ? 'Auswahl speichern' : 'Einstellungen';
    const toggle = panel.querySelector('#consent-external-media');
    if (toggle) toggle.checked = Boolean(choice?.externalMedia);
    panel.querySelector('.consent-details')?.setAttribute('aria-hidden', settings ? 'false' : 'true');
    panel.querySelector('[data-consent-close]')?.focus();
  }
  function mountPanel() {
    if (document.querySelector('.consent-panel')) return;
    panel = document.createElement('section');
    panel.className = 'consent-panel';
    panel.hidden = Boolean(choice);
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'consent-title');
    panel.setAttribute('aria-hidden', choice ? 'true' : 'false');
    panel.innerHTML = `
      <div class="consent-heading"><span class="consent-kicker">Ihre Privatsphäre</span><button class="consent-close" type="button" data-consent-close aria-label="Cookie-Hinweis schließen">×</button></div>
      <h2 id="consent-title">Ihre Auswahl zu Cookies &amp; externen Inhalten</h2>
      <p>Notwendige Funktionen sind immer aktiv. Externe Medien von YouTube und mobile.de laden wir erst, wenn Sie zustimmen. Ihre Auswahl können Sie jederzeit ändern.</p>
      <div class="consent-details" aria-hidden="true">
        <div class="consent-option"><div><strong>Notwendig</strong><small>Speichert ausschließlich Ihre Datenschutz-Auswahl. Immer aktiv.</small></div><span class="consent-fixed">Immer aktiv</span></div>
        <label class="consent-option" for="consent-external-media"><span><strong>Externe Medien</strong><small>YouTube-Video und Fahrzeugfotos von mobile.de. Dabei wird Ihre IP-Adresse an den jeweiligen Anbieter übertragen.</small></span><input id="consent-external-media" type="checkbox"></label>
        <p class="consent-future">Statistik- und Marketingdienste sind derzeit nicht eingebunden.</p>
      </div>
      <div class="consent-actions"><button class="consent-button consent-reject" type="button" data-consent-reject>Nur notwendige</button><button class="consent-button consent-settings" type="button" data-consent-settings>Einstellungen</button><button class="consent-button consent-accept" type="button" data-consent-accept>Alle akzeptieren</button></div>
      <div class="consent-meta"><span>Ihre Auswahl wird nur auf diesem Gerät gespeichert.</span><a href="datenschutz/">Datenschutz</a></div>`;
    document.body.append(panel);
    panel.querySelector('[data-consent-close]').addEventListener('click', () => choice ? closePanel() : window.RosenkranzConsent.save({ externalMedia: false }));
    panel.querySelector('[data-consent-reject]').addEventListener('click', () => window.RosenkranzConsent.save({ externalMedia: false }));
    panel.querySelector('[data-consent-accept]').addEventListener('click', () => window.RosenkranzConsent.save({ externalMedia: true }));
    panel.querySelector('[data-consent-settings]').addEventListener('click', () => {
      if (!panel.classList.contains('is-settings')) { showPanel(true); return; }
      window.RosenkranzConsent.save({ externalMedia: panel.querySelector('#consent-external-media').checked });
    });
    if (choice?.externalMedia) hydrateExternalMedia();
  }
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-consent]');
    if (!trigger) return;
    event.preventDefault();
    showPanel(true);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountPanel, { once: true });
  else mountPanel();
}());
