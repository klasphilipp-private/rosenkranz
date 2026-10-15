# Automobile Rosenkranz · Website-Vorschau

Statische, WordPress-freie Designvorschau. Einstieg: `index.html`; die Fahrzeugübersicht liegt auf `angebote.html`. Alle verwendeten Bilddateien liegen unter `assets/`.

## Enthalten

- dunkle Gestaltung mit Montserrat, größerer Wortmarke, Hauptnavigation und ausklappbaren Schnellzugriffen
- Fahrzeugkarussell mit Modellen aus dem öffentlichen Medienbestand
- Fahrzeugangebote mit Markenfilter und eigene Angebotsseite mit Sortierung
- Citroën-, Subaru- und Gewerbe-Kacheln, Serviceleistungen zum Aufklappen, Probefahrt-Auswahl, Kontakt- und Autohausinhalte
- eigenständiges Werkstattfoto, generiert für diese Vorschau

## Mobile.de-Bestand

`scripts/sync-mobile-inventory.py` liest die öffentliche Händlerseite aus und aktualisiert `inventory.json`. Die GitHub-Actions-Datei im Repository aktualisiert den Snapshot alle 12 Stunden und bei manuellem Start. GitHub führt geplante Workflows nur auf dem Standardbranch aus; auf diesem Vorschau-Branch startet die Aktualisierung erst, wenn der Workflow im Standardbranch verfügbar ist. Für einen stabilen Produktivbetrieb ist ein autorisierter Händlerfeed vorzuziehen, falls mobile.de einen bereitstellt.

## Google Places

`scripts/sync-google-reviews.py` fragt die Places API serverseitig ab und schreibt Rating und Rezensionstexte nach `google-reviews.json`. Die API ist inzwischen erreichbar; die aktuelle Vorschau zeigt den Places-Stand mit 4,7 Sternen und 346 Bewertungen. Der API-Schlüssel liegt nicht im HTML oder Repository. Für regelmäßige Aktualisierungen muss `GOOGLE_PLACES_API_KEY` als GitHub Actions Repository Secret gesetzt sein.

## Noch für den vollständigen Abgleich nötig

Der lokale WordPress-Export unter `/Users/philipp/Downloads/Rosenkranz Webseite` ist aus der Ausführungsumgebung nicht erreichbar. Für den Abgleich von Datenbank, Originaltexten, Teamfotos und vollständigem `wp-content/uploads/2026` den Ordner bitte als ZIP in den Projekt-Workspace hochladen. Zugangsdaten sind für die öffentliche Vorschauseite nicht nötig.

## Vorschauhinweise

Probefahrtformulare sind Demos und senden keine Daten. Rechtstexte und Öffnungszeiten sind vor Veröffentlichung zu bestätigen. Die Repository-Sichtbarkeit ist privat; externe Kunden können die Vorschau erst sehen, wenn ein öffentlicher oder kundenzugänglicher Preview-Link eingerichtet wurde.
