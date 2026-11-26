# Projektanweisungen

- Statische Website; Einstieg `index.html`. Gemeinsame Navigation und Schnellzugriffe liegen in `header.html` und `site-shell.js`, der gemeinsame Footer in `footer.html` und `footer.js`.
- Änderungen in Codex Cloud auf einem Arbeitsbranch vom aktuellen `main` vornehmen. Layout und Funktionen manuell über `deploy-dev-test.yml` abnehmen und anschließend separat nach PROD bringen. `.github/workflows/refresh-preview-data.yml` darf ausschließlich generierte Fahrzeug- und Bewertungsdaten automatisch auf DEV_TEST und PROD aktualisieren; die Data-only-Sperren in beiden Deployments erhalten.
- Lokale Vorschau: `python3 -m http.server 4173` im Projektverzeichnis. Die Website verwendet relative URLs und JavaScript.
- Ein verbindlicher Build- oder Testbefehl ist nicht dokumentiert. Bei Änderungen relevante JavaScript-Syntax und HTML-Links sowie Desktop- und Mobilansichten prüfen. Für den Formular-Worker zusätzlich `workers/forms/README.md` beachten.
- Zugangsdaten gehören in GitHub Secrets bzw. Cloudflare Secrets, niemals in den Quellcode. Vorhandene Änderungen und erzeugte Inventardaten erhalten.
