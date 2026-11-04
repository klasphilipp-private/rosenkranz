# Automobile Rosenkranz · Website-Vorschau

Statische, WordPress-freie Designvorschau. Einstieg: `index.html`; aktuelle Angebote stehen auf `angebote.html`, die Modellübersicht auf `modelle.html`. Einzelne Fahrzeugseiten nutzen `modell.html?modell=<slug>`.

## Enthalten

- dunkle Gestaltung mit Montserrat, größerer Wortmarke, Hauptnavigation und ausklappbaren Schnellzugriffen
- Fahrzeugkarussell und Modellübersicht mit Citroën-, Subaru- und Gewerbemodellen sowie VANDERER One und Two
- Fahrzeugangebote mit Markenfilter und eigene Angebotsseite mit Sortierung
- Citroën-, Subaru- und Gewerbe-Kacheln, Serviceleistungen zum Aufklappen, Probefahrt-Auswahl, Kontakt- und Autohausinhalte
- eigenständiges Werkstattfoto, generiert für diese Vorschau

`models.json` enthält ausschließlich die freigegebenen Modelltexte aus den veröffentlichten Fahrzeugbeiträgen. Der vollständige SQL-Export und WordPress-Formular-/Sicherheitsdaten sind nicht Bestandteil des öffentlichen Repositories.

## Gemeinsame Navigation und Footer

`header.html` ist die einzige Vorlage für Header, Navigation und Schnellzugriffe. Seiten enthalten nur noch den leeren Mount-Punkt `#shared-header`; `site-shell.js` lädt und initialisiert die gemeinsame Vorlage. `footer.html` wird entsprechend über `footer.js` eingebunden. Änderungen an Menüeinträgen, Kontaktleisten oder Footer-Inhalten erfolgen daher jeweils an der Vorlage, nicht auf den einzelnen Seiten. Auch neu erzeugte Angebotsdetailseiten verwenden diese gemeinsamen Vorlagen.

## Mobile.de-Bestand

`scripts/sync-mobile-inventory.py` liest alle Ergebnisseiten der offiziellen mobile.de Search API aus, erstellt Angebotsdetailseiten und aktualisiert `inventory.json`. Der Workflow synchronisiert den Bestand stündlich und schließt Anzeigen ohne Fahrzeugfoto sowie exakte Dubletten aus. Zugangsdaten gehören ausschließlich in GitHub Actions Secrets, nie in HTML oder Git. Siehe [offizielle API-Übersicht](https://services.mobile.de/manual/index.html) und [Search-API-Dokumentation](https://services.mobile.de/docs/search-api.html).

## Google Places

`scripts/sync-google-reviews.py` fragt die Places API serverseitig ab und schreibt Rating und Rezensionstexte nach `google-reviews.json`. Der API-Schlüssel liegt nicht im HTML oder Repository; die Aktualisierung läuft über das GitHub-Actions-Secret `GOOGLE_PLACES_API_KEY`.

## Medienbestand

Die neu gelieferten Bildpakete enthalten Modellbilder, ein Autohausfoto und ein Foto von Rico Rosenkranz. Ein Bild mit dem Namen `citroen_sign-scaled` war in den Paketen nicht enthalten; für die Citroën-Kachel wird deshalb ein aktuelles Modellbild verwendet. Weitere Teamfotos lagen in den gelieferten Medien nicht vor.

## Vorschauhinweise

Probefahrtformulare sind Demos und senden keine Daten. Rechtstexte und Öffnungszeiten sind vor Veröffentlichung zu bestätigen. Öffentliche, nicht indexierte Vorschau: https://klasphilipp-private.github.io/rosenkranz/
