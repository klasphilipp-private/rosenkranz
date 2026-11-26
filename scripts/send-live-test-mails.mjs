// Manual smoke test: use the production mail templates and real Resend,
// while simulating Turnstile verification inside this one-off runner only.
import { readFile } from 'node:fs/promises';

if (process.env.LIVE_MAIL_TEST !== 'YES' || process.env.GITHUB_ACTIONS !== 'true' || !process.env.RESEND_API_KEY) {
  throw new Error('Manual GitHub Actions test and RESEND_API_KEY required');
}

const source = await readFile(new URL('../workers/forms/src/index.js', import.meta.url), 'utf8');
const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const vehicles = JSON.parse(await readFile(new URL('../inventory.json', import.meta.url), 'utf8')).vehicles;
const vehicle = vehicles.find(item => item.id && item.detailPath && item.title);
if (!vehicle || !new RegExp(`-${vehicle.id}/$`).test(vehicle.detailPath)) throw new Error('No suitable current vehicle offer');

const origin = 'https://automobile-rosenkranz.de';
const mailbox = 'anfragen@automobile-rosenkranz.de';
const runId = String(process.env.GITHUB_RUN_ID || 'manual').replace(/[^0-9]/g, '');
const env = {
  ALLOWED_ORIGINS: origin,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  TURNSTILE_SECRET: 'simulated-in-runner',
  FROM_EMAIL: `Automobile Rosenkranz <${mailbox}>`,
  INTERNAL_RECIPIENT: mailbox,
  REPLY_TO_EMAIL: 'info@automobile-rosenkranz.de',
  CUSTOMER_CONFIRMATION: 'true',
  SITE_URL: origin,
  FORM_RATE_LIMITER: { limit: async () => ({ success: true }) }
};
const realFetch = globalThis.fetch;
let action = '';
globalThis.fetch = (url, options) => String(url).includes('/siteverify')
  ? Promise.resolve(Response.json({ success: true, hostname: 'automobile-rosenkranz.de', action }))
  : realFetch(url, options);

const base = {
  name: `TEST PROD ${runId}`,
  email: mailbox,
  message: `TEST PROD ${runId}: Bitte ignorieren; automatisierter Versandtest, keine Kundenanfrage.`,
  privacyAccepted: true,
  turnstileToken: 'simulated-in-runner'
};
const cases = [
  ['Kontakt', { ...base, type: 'contact', source: '/' }],
  ['Probefahrt', { ...base, type: 'test_drive', vehicle: 'Citroën C3', source: '/' }],
  ['Camping & Tuning', { ...base, type: 'project', interest: 'Camping & Wohnmobil', source: '/camping-tuning.html' }],
  ['VANDERER', { ...base, type: 'project', interest: 'VANDERER One', source: '/vanderer.html' }],
  ['Fahrzeugangebot', { ...base, type: 'vehicle_inquiry', vehicle: vehicle.title, vehicleId: vehicle.id, source: '/' + vehicle.detailPath }]
];

for (const [label, data] of cases) {
  action = data.type;
  const response = await worker.fetch(new Request('https://forms-test.invalid/submit', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.10' },
    body: JSON.stringify(data)
  }), env);
  const result = await response.json();
  if (!response.ok || !result.ok || result.customerConfirmationSent !== true) {
    throw new Error(`${label}: internal or confirmation mail was not accepted by Resend`);
  }
  console.log(`${label}: internal and confirmation mail accepted by Resend`);
  await new Promise(resolve => setTimeout(resolve, 1200));
}
