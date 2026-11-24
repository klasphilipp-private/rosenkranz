# URL-Konzept für den IONOS-Livegang

Stand: 24.11.2026. Die bestehenden GitHub-Pages-URLs bleiben während der Vorschau erreichbar. Ein verständlicher Pfad hilft bei Orientierung und Wartung, eine bestimmte URL-Struktur garantiert kein besseres Ranking. Modellseiten besitzen bereits eigenständige URLs; die folgende Umstellung ist ein Vorschlag für den Livegang und noch nicht umgesetzt.

| Bereich | Beispiel heute | Vorgeschlagene endgültige URL |
| --- | --- | --- |
| Start | `/index.html` | `/` |
| Angebote | `/angebote.html` | `/angebote/` |
| Fahrzeug | `/angebote/c3-aircross-shine-pack-38676823732768/` | bestehendes Schema `/angebote/<fahrzeug>-<id>/` |
| Modellübersicht | `/modelle.html` | `/neuwagen/` |
| Citroën-Modell | `/citroen-c3.html` | `/neuwagen/citroen/c3/` |
| Subaru-Modell | `/subaru-forester.html` | `/neuwagen/subaru/forester/` |
| Gewerbemodell | `/citroen-jumpy.html` | `/neuwagen/gewerbe/citroen-jumpy/` |
| Campermodell | `/vanderer-one.html` | `/neuwagen/vanderer/one/` |
| Service | `/service.html` | `/service/` |
| Camping & Tuning | `/camping-tuning.html` | `/camping-tuning/` |
| Über uns | `/ueber-uns.html` | `/ueber-uns/` |
| Impressum, Datenschutz | bereits Verzeichnisse | `/impressum/`, `/datenschutz/` |

## Anforderungen vor der Umstellung

- Für jede bestehende URL und jede alte WordPress-Adresse das passende neue Ziel einzeln erfassen. Auf IONOS echte HTTP-301-Weiterleitungen einrichten, inklusive Query-Varianten dort, wo sie inhaltlich eindeutig zugeordnet werden können. Kein pauschaler Verweis aller alten Seiten auf die Startseite.
- Zielseiten real ausliefern; Navigation, interne Links, Formulare, relative Ressourcen, Sitemap, Social-Metadaten und strukturierte Daten aktualisieren. Für indexierbare Seiten ein Canonical auf die jeweilige endgültige URL setzen. Keine Vorschau pauschal auf die Live-Startseite kanonisieren.
- GitHub Pages kann die für den finalen Livegang benötigten serverseitigen 301-Regeln nicht selbst wie IONOS bereitstellen. Pfadmigration deshalb zunächst in DEV_TEST vorbereiten und Weiterleitungen dort serverseitig prüfen; öffentliche Vorschauadressen bleiben bis dahin unverändert.
- Angebote bleiben über die eindeutige mobile.de-ID zuordenbar. Falls Titelzeichen eine lesbarere URL ergeben, bisherige Pfade über eine dauerhafte ID-basierte Zuordnung und Redirects erhalten. Für verkaufte Fahrzeuge ist ein eigener Ablauf für Status und Weiterleitung festzulegen.
- Die Markenfilter `modelle.html?marke=…` sind aktuell Filteransichten. Eigenständige indexierbare Markenseiten benötigen eigenständigen Inhalt, eindeutige URLs und Canonicals; reine Filtervarianten bleiben Duplikate.
- Die Entwicklungsseite ist öffentlich und per `noindex` gekennzeichnet; das ist kein Passwortschutz. DEV_TEST separat gegen Zugriff absichern und ebenfalls nicht indexieren.

## Offene Freigaben und Festlegungen

1. Bevorzugte Pfade und Zuordnung für Gewerbe und VANDERER bestätigen.
2. Ziel und Status für ausgelaufene Fahrzeugangebote bestimmen.
3. Bestandsaufnahme der alten WordPress-URLs und einen vollständigen Redirect-Plan erstellen.
4. IONOS-Konfiguration und Übergang von DEV_TEST auf PROD durchgängig überprüfen.
