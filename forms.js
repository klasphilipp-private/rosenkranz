(() => {
  const scriptUrl = document.currentScript && document.currentScript.src ? document.currentScript.src : location.href;
  const baseUrl = new URL('.', scriptUrl);
  const configRequest = fetch(new URL('forms-config.json?v=20261125-turnstile', baseUrl), { cache: 'no-store' })
    .then(response => response.ok ? response.json() : { endpoint: '' })
    .catch(() => ({ endpoint: '' }))
    .then(config => {
      const endpoint = config.endpoints?.[location.origin] || '';
      if (endpoint) document.querySelectorAll('[data-form-pending-notice]').forEach(notice => { notice.hidden = true; });
      return { endpoint, siteKey: config.turnstileSiteKeys?.[location.origin] || '' };
    });
  const widgets = new WeakMap();
  let turnstileLoader;
  function loadTurnstile() {
    if (!turnstileLoader) turnstileLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => reject(new Error('Turnstile timeout')), 12000);
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => { clearTimeout(timeout); window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable')); };
      script.onerror = () => { clearTimeout(timeout); reject(new Error('Turnstile unavailable')); };
      document.head.append(script);
    }).catch(error => { turnstileLoader = null; throw error; });
    return turnstileLoader;
  }
  function formType(form) {
    return form.id === 'test-form' ? 'test_drive' : form.classList.contains('project-form') ? 'project' : 'contact';
  }
  async function prepareTurnstile(form) {
    const { siteKey } = await configRequest;
    if (!siteKey) return null;
    if (!widgets.has(form)) {
      const setup = (async () => {
        const turnstile = await loadTurnstile();
        const container = document.createElement('div');
        container.className = 'turnstile-widget';
        container.setAttribute('aria-label', 'Sicherheitsprüfung');
        form.querySelector('[type="submit"]')?.before(container);
        return turnstile.render(container, { sitekey: siteKey, action: formType(form), theme: 'dark' });
      })();
      widgets.set(form, setup.catch(error => { widgets.delete(form); form.querySelector('.turnstile-widget')?.remove(); throw error; }));
    }
    return widgets.get(form);
  }
  document.addEventListener('focusin', event => {
    const form = event.target.closest?.('#contact-form, #test-form, .project-form');
    if (form) prepareTurnstile(form).catch(() => setFormStatus(form.querySelector('.form-status'), 'Die Sicherheitsprüfung konnte nicht geladen werden. Bitte versuchen Sie es später erneut.', 'error'));
  });

  function setFormStatus(status, message, kind = 'info') {
    if (!status) return;
    status.classList.remove('is-success', 'is-error');
    if (kind === 'success') {
      status.classList.add('is-success');
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-circle-check';
      icon.setAttribute('aria-hidden', 'true');
      status.replaceChildren(icon, document.createTextNode(' ' + message));
      return;
    }
    if (kind === 'error') status.classList.add('is-error');
    status.textContent = message;
  }

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('#contact-form, #test-form, .project-form')) return;
    event.preventDefault();

    const status = form.querySelector('.form-status');
    const button = form.querySelector('[type="submit"]');
    const originalLabel = button ? button.textContent : '';
    if (!form.reportValidity()) return;

    const config = await configRequest;
    const endpoint = String(config.endpoint || '').trim();
    if (!endpoint) {
      setFormStatus(status, 'Der Online-Versand ist noch nicht aktiviert. Bitte kontaktieren Sie uns telefonisch unter 02361 / 9149-0.', 'error');
      return;
    }

    let widgetId = null;
    let turnstileToken = '';
    if (config.siteKey) {
      try {
        widgetId = await prepareTurnstile(form);
        turnstileToken = window.turnstile.getResponse(widgetId);
      } catch {
        setFormStatus(status, 'Die Sicherheitsprüfung konnte nicht geladen werden. Bitte versuchen Sie es später erneut.', 'error');
        return;
      }
      if (!turnstileToken) {
        setFormStatus(status, 'Bitte schließen Sie die Sicherheitsprüfung ab und senden Sie die Anfrage erneut.', 'error');
        return;
      }
    }
    if (button) { button.disabled = true; button.textContent = 'Wird gesendet …'; }
    setFormStatus(status, 'Ihre Anfrage wird sicher übermittelt …');
    const values = Object.fromEntries(new FormData(form));
    const payload = {
      type: formType(form),
      name: String(values.name || '').trim(),
      email: String(values.email || '').trim(),
      phone: String(values.phone || '').trim(),
      vehicle: String(values.vehicle || '').trim(),
      interest: String(values.interest || '').trim(),
      source: location.pathname,
      message: String(values.message || '').trim(),
      privacyAccepted: values.privacyAccepted === 'true',
      company: String(values.company || '').trim(),
      turnstileToken
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Anfrage konnte nicht gesendet werden.');
      const confirmationMessage = result.customerConfirmationSent === false
        ? 'Ihre Anfrage ist eingegangen. Die Bestätigungs-E-Mail konnte gerade nicht versendet werden; unser Team kümmert sich um Ihr Anliegen.'
        : 'Vielen Dank. Ihre Anfrage ist eingegangen; eine Bestätigung wurde an Ihre E-Mail-Adresse gesendet.';
      setFormStatus(status, confirmationMessage, 'success');
    } catch {
      setFormStatus(status, 'Der Versand hat gerade nicht funktioniert. Bitte versuchen Sie es später erneut oder rufen Sie uns unter 02361 / 9149-0 an.', 'error');
    } finally {
      if (widgetId !== null) window.turnstile.reset(widgetId);
      if (button) { button.disabled = false; button.textContent = originalLabel; }
    }
  });
})();
