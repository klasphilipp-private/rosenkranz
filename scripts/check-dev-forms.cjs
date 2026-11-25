// Sends four explicitly marked test requests to the dealership's own mailbox.
const { chromium } = require('playwright');
const base = 'https://test1.automobile-rosenkranz.de';
const endpoint = 'https://rosenkranz-forms-staging.rough-hill-9dd9.workers.dev/submit';
const username = process.env.DEV_TEST_USER, password = process.env.DEV_TEST_PASSWORD;
if (!username || !password) { console.error('DEV_TEST credentials missing.'); process.exit(1); }
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ httpCredentials: { username, password, origin: base }, viewport: { width: 390, height: 900 } });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === base || url.href.startsWith(endpoint) || url.hostname === 'challenges.cloudflare.com' || url.hostname.endsWith('.challenges.cloudflare.com')) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  const cases = [
    ['index.html', '#contact-form', 'Kontakt'],
    ['index.html', '#test-form', 'Probefahrt'],
    ['camping-tuning.html', '.project-form', 'Camping und Tuning'],
    ['vanderer.html', '.project-form', 'VANDERER']
  ];
  for (const [path, selector, label] of cases) {
    await page.goto(`${base}/${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const notice = page.locator('[data-consent-reject]');
    if (await notice.isVisible().catch(() => false)) await notice.click();
    const form = page.locator(selector);
    await form.waitFor({ timeout: 15000 });
    await form.locator('[name="name"]').fill('TEST DEV_TEST – ' + label);
    await form.locator('[name="email"]').fill('anfragen@automobile-rosenkranz.de');
    if (await form.locator('[name="message"]').count()) await form.locator('[name="message"]').fill('TEST DEV_TEST – Bitte ignorieren. Automatisierter Formularfunktionstest; keine Kundenanfrage.');
    if (selector === '#test-form') await form.locator('[name="vehicle"]').selectOption({ index: 1 });
    const uncheckedValid = await form.evaluate(f => f.checkValidity());
    if (uncheckedValid) throw new Error(label + ': Datenschutzhinweis lässt sich ohne Bestätigung absenden');
    await form.locator('[name="privacyAccepted"]').check();
    try {
      await page.waitForFunction(selector => {
        const token = document.querySelector(selector)?.querySelector('[name="cf-turnstile-response"]');
        return token && token.value.length > 0;
      }, selector, { timeout: 25000 });
    } catch {
      throw new Error(label + ': Turnstile konnte im automatisierten Browser nicht gelöst werden; bitte den Formularversand manuell im Browser prüfen');
    }
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url() === endpoint && r.request().method() === 'POST', { timeout: 30000 }),
      form.locator('[type="submit"]').click()
    ]);
    const result = await response.json();
    if (!response.ok() || !result.ok || !result.customerConfirmationSent) throw new Error(label + ': Versand oder Bestätigung nicht angenommen');
    await form.locator('.form-status.is-success').waitFor({ timeout: 10000 });
    console.log('OK: ' + label + ' – interne E-Mail und Bestätigung vom Versanddienst angenommen');
  }
  await browser.close();
  console.log('Alle vier DEV_TEST-Formulare wurden getestet; der Versanddienst hat die gekennzeichneten Testnachrichten angenommen. Die Zustellung im Postfach ist separat zu prüfen.');
})().catch(error => { console.error('Formulartest fehlgeschlagen: ' + error.message.replace(/https?:\/\/\S+/g, '[URL]')); process.exit(1); });
