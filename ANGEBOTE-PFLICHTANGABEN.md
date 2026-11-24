# Angebote: Datenlage und offener Umgang mit Pflichtangaben

## Befund

- Bestandsdatei `inventory.json`, Stand 24.11.2026, 19:40 UTC: 32 Fahrzeuge mit Bild; davon 23 `USED`/`Car`, sieben `NEW`/`Car` und zwei `NEW`/`VanUpTo7500`. Diese API-Kennzeichnung ersetzt keine rechtliche Einzelfallprüfung.
- Der gegenwärtige Import fragt Search API und Einzelinserate ab, speichert aber keine strukturierten WLTP-, Energieverbrauchs-, CO₂-Klassen- oder Reichweitenfelder. Die Angebotskacheln und generierten Detailseiten können diese Daten deshalb nicht zuverlässig ausgeben.
- Die Search-API-Dokumentation beschreibt unter anderem `wltpValues`, `consumptions`, `emissions`, `costModel` und `range`. Die Verfügbarkeit für den aktuellen Bestand wurde am 24.11.2026 mit der Aktion „Audit mobile.de energy fields“ geprüft; das Ergebnis steht unten. Die Dokumentation beschreibt ein mögliches Datenmodell, keine Garantie für konkrete Datensätze.
- Die Einstufung als neuer Pkw und die jeweils einschlägigen Angaben ergeben sich nicht allein aus `condition`, `vehicleClass`, Kilometerstand oder einem Leistungshinweis. Insbesondere Plug-in-Hybride und elektrische Fahrzeuge benötigen eine gesonderte Prüfung der verfügbaren Werte und der anwendbaren Kennzeichnung.

## Ergebnis des API-Abrufs vom 24.11.2026

Die schreibgeschützte Prüfung rief 32 Inserate und alle 32 Detailantworten ab. Die Einteilung beruht ausschließlich auf API-Feldern; sie ist keine rechtliche Einordnung.

| API-Gruppe | Anzahl | Kombinierter CO₂-Wert | CO₂-Klasse | Kombinierter Kraftstoffverbrauch | Kostenmodell vorhanden |
| --- | ---: | ---: | ---: | ---: | ---: |
| `NEW` / `Car` / `HYBRID` | 5 | 5/5 | 5/5 | 5/5 | 5/5 |
| `NEW` / `Car` / `PETROL` | 1 | 1/1 | 1/1 | 1/1 | 0/1 |
| `NEW` / `Car` / `DIESEL` | 1 | 0/1 | 0/1 | 0/1 | 0/1 |

Gezählt wurde die Existenz der jeweiligen strukturierten Felder (`emissions.combined.co2`, `emissions.combined.co2Class`, `consumptions.fuel.combined`, `costModel`); ein vorhandenes Kostenmodell ist nicht automatisch vollständig oder rechtlich ausreichend. Werte null sind als vorhanden gewertet. Freitexte und weitere mögliche ältere Felder wurden nicht als Ersatz für diese Felder interpretiert. Bei als gebraucht gekennzeichneten Fahrzeugen sind entsprechende Angaben je nach Inserat teilweise vorhanden. Der Import und die Website übernehmen die genannten strukturierten Felder weiterhin noch nicht.

Vollständige gruppierte Zählung: https://github.com/klasphilipp-private/rosenkranz/actions/runs/45490504149

## Vorschlag vor Produktivbetrieb

1. Die vorhandenen Energie- und Emissionsfelder aus den Einzelinseraten strukturiert übernehmen; Quelle, Einheit, Fahrzeugart und Antriebsart dokumentieren. Keine Werte aus anderen Fahrzeugen übernehmen oder schätzen.
2. Ein mit dem Auftraggeber und fachlicher Beratung abgestimmtes Regelwerk für Neufahrzeuge, Grenzfälle und Antriebsarten festlegen. Verbrauch, CO₂-Werte und Klassen dort anzeigen, wo sie für die jeweilige Werbung erforderlich sind. Darstellung und Auffindbarkeit fachlich prüfen lassen.
3. Bei erforderlichen, aber fehlenden oder widersprüchlichen Werten das betroffene Angebot bis zur Korrektur nicht veröffentlichen; direkt erreichbare Detailseiten und maschinenlesbare Daten dabei ebenfalls berücksichtigen. Einen internen Bericht mit Inserat-ID und fehlenden Feldern erzeugen. Keine pauschale Aussage zur Rechtssicherheit durch einen allgemeinen Hinweis.
4. Fehlende Werte in mobile.de ergänzen und beim nächsten stündlichen Abruf übernehmen. Für Fehler beim Abruf die letzte erfolgreiche Fassung beibehalten und einen Warnhinweis an die Betreuung vorsehen; eine kurzfristige Deaktivierung einzelner Inserate muss dabei berücksichtigt werden.
5. Vor der Freischaltung Angebot, Detailseiten und weitere Werbeflächen einschließlich Startseite, Suchmaschinen-Metadaten und strukturierter Daten prüfen. Die Modellwelt mit allgemeinen Herstellerdaten ist gesondert zu betrachten.

## Fragen an den Auftraggeber

- Wer ergänzt und pflegt die verbindlichen Fahrzeugwerte in mobile.de und kontrolliert fehlende oder fehlerhafte Angaben?
- Soll ein Angebot bei fehlenden erforderlichen Werten bis zur Korrektur automatisch vollständig ausgeblendet werden? Welche Ersatzdarstellung und Benachrichtigung sind gewünscht?
- Wer übernimmt die fachliche Prüfung des anzuwendenden Regelwerks und der Darstellung vor dem Livegang?

## Quellen

- Pkw-EnVKV § 5 und Anlage 4: https://www.gesetze-im-internet.de/pkw-envkv/__5.html und https://www.gesetze-im-internet.de/pkw-envkv/anlage_4.html
- mobile.de Search API: https://services.mobile.de/docs/search-api.html
