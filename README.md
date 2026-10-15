# Automobile Rosenkranz · Website-Vorschau

Statische, WordPress-freie Designvorschau. Einstieg: `index.html`; aktuelle Angebote stehen auf `angebote.html`, die Modellübersicht auf `modelle.html`. Einzelne Fahrzeugseiten nutzen `modell.html?modell=<slug>`.

## Enthalten

- dunkle Gestaltung mit Montserrat, größerer Wortmarke, Hauptnavigation und ausklappbaren Schnellzugriffen
- Fahrzeugkarussell und Modellübersicht mit den 20 veröffentlichten Citroën- und Subaru-Modellen aus dem WordPress-Export
- Fahrzeugangebote mit Markenfilter und eigene Angebotsseite mit Sortierung
- Citroën-, Subaru- und Gewerbe-Kacheln, Serviceleistungen zum Aufklappen, Probefahrt-Auswahl, Kontakt- und Autohausinhalte
- eigenständiges Werkstattfoto, generiert für diese Vorschau

`models.json` enthält ausschließlich die freigegebenen Modelltexte aus den veröffentlichten Fahrzeugbeiträgen. Der vollständige SQL-Export und WordPress-Formular-/Sicherheitsdaten sind nicht Bestandteil des öffentlichen Repositories.

## Mobile.de-Bestand

`scripts/sync-mobile-inventory.py` liest aktuell nur die erste Ergebnisseite aus und aktualisiert `inventory.json` (höchstens 20 Inserate). Die öffentliche mobile.de-Seite zeigt derzeit „33 Pkw von 36 Angeboten“. Für den vollständigen Bestand ist die offizielle mobile.de Search API / Ad-Integration vorgesehen; sie erfordert API-Zugang und HTTP-Basic-Auth. Zugangsdaten gehören ausschließlich in GitHub Actions Secrets, nie in HTML oder Git. Siehe [offizielle API-Übersicht](https://services.mobile.de/manual/index.html) und [Search-API-Dokumentation](https://services.mobile.de/docs/search-api.html).

## Google Places

`scripts/sync-google-reviews.py` fragt die Places API serverseitig ab und schreibt Rating und Rezensionstexte nach `google-reviews.json`. Die API ist inzwischen erreichbar; die aktuelle Vorschau zeigt den Places-Stand mit 4,7 Sternen und 346 Bewertungen. Der API-Schlüssel liegt nicht im HTML oder Repository. Für regelmäßige Aktualisierungen muss `GOOGLE_PLACES_API_KEY` als GitHub Actions Repository Secret gesetzt sein.

## Medienbestand

Die neu gelieferten Bildpakete enthalten Modellbilder, ein Autohausfoto und ein Foto von Rico Rosenkranz. Ein Bild mit dem Namen `citroen_sign-scaled` war in den Paketen nicht enthalten; für die Citroën-Kachel wird deshalb ein aktuelles Modellbild verwendet. Weitere Teamfotos lagen in den gelieferten Medien nicht vor.

## Vorschauhinweise

Probefahrtformulare sind Demos und senden keine Daten. Rechtstexte und Öffnungszeiten sind vor Veröffentlichung zu bestätigen. Öffentliche, nicht indexierte Vorschau: https://klasphilipp-private.github.io/rosenkranz/
