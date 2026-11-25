import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const source = await readFile(new URL('../workers/forms/src/index.js', import.meta.url), 'utf8');
const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const origin = 'https://test1.automobile-rosenkranz.de';
const env = { ALLOWED_ORIGINS: origin, RESEND_API_KEY: 'test-key', TURNSTILE_SECRET: 'test-secret', FROM_EMAIL: 'Test <test@example.test>', INTERNAL_RECIPIENT: 'anfragen@example.test', CUSTOMER_CONFIRMATION: 'true', FORM_RATE_LIMITER: { limit: async () => ({ success: true }) } };
const requests = [];
let verifiedAction = 'contact';
globalThis.fetch = async (url, options) => {
  if (String(url).includes('/siteverify')) {
    const fields = new URLSearchParams(options.body);
    assert.equal(fields.get('secret'), env.TURNSTILE_SECRET);
    assert.equal(fields.get('response'), 'valid-token');
    return Response.json({ success: true, hostname: new URL(origin).hostname, action: verifiedAction });
  }
  requests.push(JSON.parse(options.body));
  return new Response('{}', { status: 200 });
};
const send = (data, override = {}) => worker.fetch(new Request('https://worker.test/submit', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.10' }, body: JSON.stringify(data) }), { ...env, ...override });
const base = { name: '<Test>', email: 'person@example.test', phone: '01234 56789', message: 'Hallo\n<b>Test</b>', privacyAccepted: true, turnstileToken: 'valid-token' };
for (const data of [{ ...base, type: 'contact' }, { ...base, type: 'test_drive', vehicle: 'Citroën C3' }, { ...base, type: 'project', interest: 'VANDERER One' }]) {
  verifiedAction = data.type;
  requests.length = 0;
  const response = await send(data);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).customerConfirmationSent, true);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].to[0], env.INTERNAL_RECIPIENT);
  assert.match(requests[0].text, /schemaVersion/);
  assert.ok(!requests[0].html.includes('<Test>'));
  assert.match(requests[1].html, /Mit uns zum Ziel\. Seit 1992\./);
  assert.match(requests[1].html, /schnellstmöglich/);
  assert.doesNotMatch(requests[1].html, /48 Stunden/);
  assert.match(requests[1].html, /&lt;Test&gt;/);
  assert.match(requests[1].html, /Hallo<br>&lt;b&gt;Test&lt;\/b&gt;/);
  assert.match(requests[1].text, /Name: <Test>/);
  assert.match(requests[1].text, /E-Mail: person@example\.test/);
  assert.match(requests[1].text, /Telefon: 01234 56789/);
  assert.match(requests[1].text, /Nachricht: Hallo\n<b>Test<\/b>/);
  if (data.vehicle) assert.match(requests[1].text, /Citroën C3/);
  if (data.interest) assert.match(requests[1].text, /VANDERER One/);
}
requests.length = 0;
assert.equal((await send({ ...base, type: 'contact', turnstileToken: '' })).status, 400);
assert.equal((await send({ ...base, type: 'contact' }, { TURNSTILE_SECRET: '' })).status, 503);
assert.equal(requests.length, 0);
verifiedAction = 'wrong-action';
assert.equal((await send({ ...base, type: 'contact' })).status, 400);
assert.equal(requests.length, 0);
verifiedAction = 'contact';
assert.equal((await send({ ...base, type: 'project', interest: 'Tuning', privacyAccepted: false })).status, 400);
assert.equal(requests.length, 0);
assert.equal((await send({ ...base, type: 'contact' }, { FORM_RATE_LIMITER: { limit: async () => ({ success: false }) } })).status, 429);
assert.equal(requests.length, 0);
const forbidden = await worker.fetch(new Request('https://worker.test/submit', { method: 'OPTIONS', headers: { Origin: 'https://unknown.example' } }), env);
assert.equal(forbidden.status, 403);
requests.length = 0;
globalThis.fetch = async (url, options) => {
  if (String(url).includes('/siteverify')) return Response.json({ success: true, hostname: new URL(origin).hostname, action: 'contact' });
  requests.push(JSON.parse(options.body));
  return new Response('{}', { status: requests.length === 1 ? 200 : 500 });
};
const partial = await send({ ...base, type: 'contact' });
assert.equal((await partial.json()).customerConfirmationSent, false);
console.log('Worker: contact, test drive, project, validation, rate limit, CORS and confirmation errors passed.');
