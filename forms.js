(() => {
  const scriptUrl = document.currentScript && document.currentScript.src ? document.currentScript.src : location.href;
  const baseUrl = new URL('.', scriptUrl);
  const configRequest = fetch(new URL('forms-config.json?v=20261107-forms', baseUrl), { cache: 'no-store' })
    .then(response => response.ok ? response.json() : { endpoint: '' })
    .catch(() => ({ endpoint: '' }))
    .then(config => {
      if (String(config.endpoint || '').trim()) document.querySelectorAll('[data-form-pending-notice]').forEach(notice => { notice.hidden = true; });
      return config;
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
    if (!(form instanceof HTMLFormElement) || !form.matches('#contact-form, #test-form')) return;
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

    if (button) { button.disabled = true; button.textContent = 'Wird gesendet …'; }
    setFormStatus(status, 'Ihre Anfrage wird sicher übermittelt …');
    const values = Object.fromEntries(new FormData(form));
    const payload = {
      type: form.id === 'test-form' ? 'test_drive' : 'contact',
      name: String(values.name || '').trim(),
      email: String(values.email || '').trim(),
      phone: String(values.phone || '').trim(),
      vehicle: String(values.vehicle || '').trim(),
      message: String(values.message || '').trim(),
      privacyAccepted: values.privacyAccepted === 'true',
      company: String(values.company || '').trim()
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
      if (button) { button.disabled = false; button.textContent = originalLabel; }
    }
  });
})();
