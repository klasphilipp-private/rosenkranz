# Rosenkranz-Formularservice

Kontakt-, Probefahrt-, Camping-/Tuning- und VANDERER-Anfragen verwenden denselben Cloudflare-Worker-Code. Er validiert Eingaben, begrenzt Anfragen pro IP und sendet eine HTML-/Text-E-Mail mit JSON-Daten an `anfragen@automobile-rosenkranz.de` sowie eine Eingangsbestätigung an die anfragende Person. Der Worker speichert Anfragen nicht dauerhaft. Ein Fehler bei der Bestätigung wird getrennt vom erfolgreichen Eingang der Anfrage gemeldet.

## Umgebungen

- `staging`: GitHub-Vorschau und `https://test1.automobile-rosenkranz.de`.
- `production`: `https://automobile-rosenkranz.de` und `https://www.automobile-rosenkranz.de`.

`forms-config.json` ordnet jede Origin ausdrücklich ihrem Worker zu; unbekannte Origins erhalten keinen Endpunkt. Der IONOS-DEV_TEST-Workflow lädt die Konfiguration mit hoch. Das Produktivdeployment muss dieselbe Datei mit bereitstellen.

## Einrichtung und Deployment

1. `automobile-rosenkranz.de` bei Resend verifizieren und die zugewiesenen DNS-Einträge bei IONOS einrichten. Bestehende MX-Einträge für eingehende E-Mails erhalten; SPF-Einträge nicht doppelt anlegen.
2. Die GitHub-Actions-Secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` und `RESEND_API_KEY` bereitstellen. Keine Zugangsdaten im Repository oder Chat ablegen.
3. Workflow **Deploy Rosenkranz forms Worker** manuell mit `target=staging` oder `target=production` ausführen. Der Produktiv-Worker kann nur von `main` deployt werden. Beide Worker verwenden denselben Code, getrennte Origins und getrennte Ratenlimits.
4. Website auf der jeweiligen Umgebung bereitstellen. Mit einer kontrollierten E-Mail-Adresse je Formulartyp testen, ob interne HTML-/JSON-Mail und Eingangsbestätigung eingehen. Die API-Annahme allein bestätigt keine Zustellung im Postfach.
5. Vor dem Livegang Datenschutzhinweise und die Verwendung von Cloudflare und Resend fachlich prüfen. Bestehende Vorschauumgebungen nicht mit Produktivdaten testen.

Lokal: `node tests/forms-worker.test.mjs`. Der Test simuliert Resend und sendet keine E-Mails.
