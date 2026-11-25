// Read-only smoke checks. Credentials are used only for the specified origin.
const { chromium, request } = require('playwright');
const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const base = 'https://test1.automobile-rosenkranz.de';
const user = process.env.DEV_TEST_USER, password = process.env.DEV_TEST_PASSWORD;
if (!user || !password) { console.error('DEV_TEST credentials missing from repository secrets.'); process.exit(1); }
const credentials = { username: user, password, origin: base };
const problems = [], warnings = [];
const ok = (message) => console.log(`OK: ${message}`);
const fail = (message) => { problems.push(message); console.log(`FEHLER: ${message}`); };
const warn = (message) => { warnings.push(message); console.log(`OFFEN: ${message}`); };
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
(async () => {
  const anonymous = await request.newContext();
  const initial = await anonymous.get(base + '/', { timeout: 20000 });
  if (initial.status() === 401) ok('Passwortschutz ohne Anmeldung aktiv'); else fail(`Ohne Anmeldung HTTP ${initial.status()}`);
  await anonymous.dispose();
  const api = await request.newContext({ httpCredentials: credentials });
  for (const file of ['index.html','modelle.html','angebote.html','camping-tuning.html','ueber-uns.html','service.html','galleries.js','galleries.css','model-page.js','model-documents-data.js','assets/galerien/historie/01.webp']) {
    const res = await api.get(`${base}/${file}`, { timeout: 30000 });
    if (res.status() !== 200) { fail(`${file}: HTTP ${res.status()}`); continue; }
    const data = await res.body();
    if (fs.existsSync(file) && hash(data) !== hash(fs.readFileSync(file))) warn(`${file}: weicht vom aktuellen Git-Stand ab`);
    else ok(`${file}: erreichbar und entspricht Git-Stand`);
    if (file.endsWith('.html') && !/noindex/i.test(data.toString())) fail(`${file}: noindex fehlt`);
  }
  const files = execFileSync('git', ['ls-files', '-z', '*.html'], { encoding: 'utf8' }).split('\0')
    .filter(file => file && !['header.html', 'footer.html'].includes(file));
  let checkedPages = 0;
  for (let i = 0; i < files.length; i += 6) {
    await Promise.all(files.slice(i, i + 6).map(async file => {
      try {
        const res = await api.get(`${base}/${file}`, { timeout: 30000 });
        if (res.status() !== 200) fail(`${file}: HTTP ${res.status()}`);
        else if (!/noindex/i.test(await res.text())) fail(`${file}: noindex fehlt`);
        else checkedPages++;
      } catch (_) { fail(`${file}: Seite nicht erreichbar`); }
    }));
  }
  ok(`${checkedPages} HTML-Seiten auf Erreichbarkeit und noindex geprüft`);
  const galleryImages = execFileSync('git', ['ls-files', '-z', 'assets/galerien/*.webp'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  let checkedImages = 0;
  for (let i = 0; i < galleryImages.length; i += 6) {
    await Promise.all(galleryImages.slice(i, i + 6).map(async file => {
      try {
        const res = await api.head(`${base}/${file}`, { timeout: 30000 });
        if (res.status() !== 200 || !(res.headers()['content-type'] || '').startsWith('image/')) fail(`${file}: Bild nicht erreichbar`);
        else checkedImages++;
      } catch (_) { fail(`${file}: Bild nicht erreichbar`); }
    }));
  }
  ok(`${checkedImages} neue Galeriebilder auf Erreichbarkeit geprüft`);
  const formConfig = await api.get(base + '/forms-config.json', { timeout: 15000 });
  if (formConfig.status() !== 200) fail(`Formularkonfiguration: HTTP ${formConfig.status()}`);
  else {
    const config = await formConfig.json();
    if (config.turnstileSiteKeys?.[base] && config.endpoints?.[base]?.includes('rosenkranz-forms-staging')) ok('Formularendpunkt und Turnstile Site Key für DEV_TEST vorhanden');
    else fail('Formularendpunkt oder Turnstile Site Key für DEV_TEST fehlt');
  }
  await api.dispose();
  const browser = await chromium.launch({ headless: true });
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, httpCredentials: credentials, reducedMotion: 'reduce', hasTouch: width === 390, isMobile: width === 390 });
    const externalBeforeConsent = new Set(), errors = new Set(), failedLocal = new Set();
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) { externalBeforeConsent.add(url.hostname); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', () => errors.add('JavaScript-Laufzeitfehler'));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) failedLocal.add(new URL(response.url()).pathname + ' (' + response.status() + ')'); });
    try {
      await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('#shared-header .site-navlinks').waitFor({ state: 'attached', timeout: 15000 });
      await page.locator('#shared-footer #contact-form').waitFor({ state: 'attached', timeout: 15000 });
      if (!await page.locator('.consent-panel:not([hidden])').count()) fail(`${width}px: Cookie-Hinweis nicht sichtbar`); else ok(`${width}px: Cookie-Hinweis sichtbar`);
      await page.locator('[data-consent-reject]').click();
      if ((await page.locator('#ueber-uns .about-image img').getAttribute('src')).includes('home-luftaufnahme.webp')) ok(`${width}px: neues Drohnenbild eingebunden`); else fail(`${width}px: falsches Drohnenbild`);
      if (width === 390) {
        await page.locator('.menu-toggle').click();
        if (await page.locator('.site-navlinks').evaluate(e => getComputedStyle(e).display !== 'none')) ok('Mobile Navigation öffnet'); else fail('Mobile Navigation öffnet nicht');
        await page.locator('.menu-toggle').click();
        const tabs = page.locator('.site-quick-rail a');
        await tabs.nth(1).click();
        if (await tabs.nth(1).getAttribute('aria-expanded') === 'true') ok('Mobiler Schnellzugriff klappt auf'); else fail('Mobiler Schnellzugriff klappt nicht auf');
      }
      const video = page.locator('[data-video-frame] iframe');
      if (await video.count() === 0) ok(`${width}px: Video nach Ablehnung gesperrt`); else fail(`${width}px: Video trotz Ablehnung eingebunden`);
      const specs = [['camping-tuning.html', [['rracing',11],['historie',8]]], ['ueber-uns.html', [['historie',8]]], ['service.html', [['service',3]]]];
      for (const [file, groups] of specs) {
        await page.goto(`${base}/${file}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        for (const [name, n] of groups) {
          const gallery = page.locator(`[data-gallery="${name}"]`);
          await gallery.locator('.gallery-controls').waitFor({ timeout: 10000 });
          if (await gallery.locator('img').count() !== n) { fail(`${file}: Galerie ${name} unvollständig`); continue; }
          await gallery.locator('.gallery-toggle').click();
          if (await gallery.locator('.gallery-toggle').getAttribute('aria-pressed') !== 'false') fail(`${file}: Play für ${name} funktioniert nicht`);
          await gallery.locator('.gallery-toggle').click();
          await gallery.getByRole('button', { name: 'Nächstes Bild' }).click();
          if (!(await gallery.locator('.gallery-count').textContent()).startsWith('02')) fail(`${file}: Navigation für ${name} funktioniert nicht`);
          else ok(`${width}px: ${file} Galerie ${name} (${n} Bilder) bedienbar`);
        }
        if (file === 'camping-tuning.html') {
          if (await page.locator('.camping-carousel img').count() === 7) ok(`${width}px: sieben Campingbilder vorhanden`); else fail(`${width}px: Campinggalerie unvollständig`);
        }
      }
      await page.goto(base + '/modelle.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('#catalog-grid .vehicle-card').first().waitFor({ timeout: 15000 });
      await page.locator('#brand-filter').selectOption('subaru');
      if ((await page.locator('#catalog-title').textContent()).toLowerCase().includes('subaru')) ok(`${width}px: Modellfilter funktioniert`); else fail(`${width}px: Modellfilter funktioniert nicht`);
      await page.goto(base + '/subaru-forester.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = page.locator('.model-document strong', { hasText: 'Subaru Forester · Zubehör Preisliste' });
      await title.waitFor({ timeout: 15000 });
      if (await title.textContent() === 'Subaru Forester · Zubehör Preisliste') ok(`${width}px: korrigierter Dokumenttitel sichtbar`);
      else fail(`${width}px: Dokumenttitel nicht korrekt`);
      await page.goto(base + '/index.html?modell=c3#probefahrt', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => document.querySelector('#vehicle')?.value === 'Citroën C3', null, { timeout: 15000 });
      await page.waitForTimeout(1200);
      const anchorTop = await page.locator('#probefahrt').evaluate(element => element.getBoundingClientRect().top);
      if (anchorTop >= 0 && anchorTop <= 160) ok(`${width}px: Probefahrtlink führt direkt zum vorausgewählten Formular`);
      else fail(`${width}px: Probefahrtformular nicht im sichtbaren Bereich`);
      if (width === 390) {
        const logoWidth = await page.locator('.site-header .logo').evaluate(element => element.getBoundingClientRect().width);
        if (Math.abs(logoWidth - 200) <= 1) ok('Mobiles Logo mit 200 px dargestellt');
        else fail(`Mobiles Logo hat ${Math.round(logoWidth)} px`);
      }
    } catch (error) { fail(`${width}px: Browserprüfung abgebrochen (${error.name})`); }
    if (errors.size) fail(`${width}px: JavaScript-Fehler aufgetreten`);
    if (failedLocal.size) warn(`${width}px: HTTP-Fehler bei lokalen Ressourcen: ${[...failedLocal].join(', ')}`);
    if (externalBeforeConsent.size) warn(`${width}px: Externe Anfragen vor/ohne Zustimmung beobachtet: ${[...externalBeforeConsent].join(', ')}`); else ok(`${width}px: keine externen Anfragen vor/ohne Zustimmung beobachtet`);
    await context.close();
  }
  await browser.close();
  console.log(`Ergebnis: ${problems.length} Fehler, ${warnings.length} offene Hinweise. Keine Formulardaten versendet.`);
  if (problems.length) process.exitCode = 1;
})().catch(error => { console.error(`Prüfung konnte nicht abgeschlossen werden (${error.name}).`); process.exitCode = 1; });
