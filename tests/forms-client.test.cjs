const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
let requests = [];
let failNext = false;
const server = http.createServer(async (request, response) => {
  if (request.url === '/submit' && request.method === 'POST') {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push(JSON.parse(Buffer.concat(chunks).toString()));
    response.writeHead(failNext ? 500 : 200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(failNext ? { ok: false, message: 'Versand fehlgeschlagen.' } : { ok: true, customerConfirmationSent: true }));
    failNext = false;
    return;
  }
  const pathname = new URL(request.url, 'http://localhost').pathname;
  let file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (file.startsWith(root + path.sep) && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404); response.end(); return;
  }
  response.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'text/javascript' : 'text/plain' });
  fs.createReadStream(file).pipe(response);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'],
    ...(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}) });
  try {
    const page = await browser.newPage();
    await page.route('**/forms-config.json*', route => route.fulfill({ json: {
      endpoints: { [origin]: `${origin}/submit` }, turnstileSiteKeys: { [origin]: 'test-key' }
    } }));
    await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', route => route.fulfill({
      contentType: 'text/javascript', body: `window.turnstile = {
        render(element, options) { window.testTurnstileOptions = options; element.textContent = 'Sicherheitsprüfung'; return 7; },
        getResponse() { return window.testToken || ''; },
        remove() { window.testTurnstileRemoved = true; window.testToken = ''; }
      };`
    }));
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.locator('#contact-name').waitFor();
    await page.waitForFunction(() => document.querySelector('[data-form-pending-notice]')?.hidden);
    await page.locator('#contact-name').focus();
    assert.equal(await page.locator('.turnstile-widget').count(), 0, 'Turnstile must not appear while filling');
    await page.locator('#contact-name').fill('Max Muster');
    await page.locator('#contact-email').fill('max@example.invalid');
    await page.locator('#contact-message').fill('Bitte rufen Sie zurück.');
    await page.locator('#contact-form [name="privacyAccepted"]').check({ force: true });
    await page.evaluate(() => document.querySelector('#contact-form').requestSubmit());
    await page.locator('#contact-form .turnstile-widget').waitFor();
    assert.equal(requests.length, 0, 'No request before security verification');
    await page.evaluate(() => {
      window.testToken = 'verified-token';
      window.testTurnstileOptions.callback(window.testToken);
    });
    await page.locator('#contact-status.is-success').waitFor();
    assert.equal(requests.length, 1, 'Exactly one request after verification');
    assert.equal(requests[0].turnstileToken, 'verified-token');
    assert.equal(requests[0].name, 'Max Muster');
    assert.equal(await page.locator('#contact-name').inputValue(), '');
    assert.equal(await page.locator('#contact-email').inputValue(), '');
    assert.equal(await page.locator('#contact-message').inputValue(), '');
    assert.equal(await page.locator('#contact-form [name="privacyAccepted"]').isChecked(), false);
    assert.equal(await page.locator('.turnstile-widget').count(), 0, 'Widget removed after success');
    failNext = true;
    await page.locator('#contact-name').fill('Zweiter Versuch');
    await page.locator('#contact-email').fill('max@example.invalid');
    await page.locator('#contact-message').fill('Bitte nochmals versuchen.');
    await page.locator('#contact-form [name="privacyAccepted"]').check({ force: true });
    await page.evaluate(() => document.querySelector('#contact-form').requestSubmit());
    await page.locator('#contact-form .turnstile-widget').waitFor();
    await page.evaluate(() => { window.testToken = 'another-token'; window.testTurnstileOptions.callback(window.testToken); });
    await page.locator('#contact-status.is-error').waitFor();
    assert.equal(await page.locator('#contact-name').inputValue(), 'Zweiter Versuch', 'Fields remain on delivery failure');
    const vehicle = JSON.parse(fs.readFileSync(path.join(root, 'inventory.json'), 'utf8')).vehicles[0];
    await page.goto(`${origin}/${vehicle.detailPath}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('.vehicle-inquiry-form [data-form-pending-notice]')?.hidden);
    await page.locator('#vehicle-inquiry-name').fill('Max Muster');
    await page.locator('#vehicle-inquiry-email').fill('max@example.invalid');
    await page.locator('#vehicle-inquiry-message').fill('Ist dieses Fahrzeug noch verfügbar?');
    await page.locator('.vehicle-inquiry-form [name="privacyAccepted"]').check({ force: true });
    await page.evaluate(() => document.querySelector('.vehicle-inquiry-form').requestSubmit());
    await page.locator('.vehicle-inquiry-form .turnstile-widget').waitFor();
    assert.equal(await page.evaluate(() => window.testTurnstileOptions.action), 'vehicle_inquiry');
    await page.evaluate(() => { window.testToken = 'vehicle-token'; window.testTurnstileOptions.callback(window.testToken); });
    await page.locator('.vehicle-inquiry-form .form-status.is-success').waitFor();
    assert.equal(requests.at(-1).vehicle, vehicle.title);
    assert.equal(requests.at(-1).vehicleId, String(vehicle.id));
    assert.equal(requests.at(-1).message, 'Ist dieses Fahrzeug noch verfügbar?');
    assert.equal(await page.locator('#vehicle-inquiry-name').inputValue(), '');
    assert.equal(await page.locator('.vehicle-inquiry-form [name="vehicleId"]').inputValue(), String(vehicle.id));
    console.log('Form client: verification starts on submit, one request, fields cleared.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
