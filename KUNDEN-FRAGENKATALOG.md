# Automobile Rosenkranz – offene Fragen und nächste Zulieferungen

Stand: 24.11.2026. Arbeitsdokument für die Abstimmung; die bestehende Vorschau bleibt nutzbar. Bereits abgestimmte Punkte wie die Verwendung der gelieferten Dokumente und der Schrift BEHATRICE werden hier nicht erneut abgefragt.

## 1. Startseite: fester Aktions-Slide

Der erste Slide zeigt derzeit das Autohaus bei Nacht. Das Drohnenbild und fünf zufällig gewählte Fahrzeugmodelle folgen. Im gelieferten Paket sind Veranstaltungs- und Fahrzeugmotive vorhanden; eine eindeutige Zuordnung zu einer konkreten aktuellen Aktion einschließlich Text und Ziel war nicht erkennbar.

- Welches Motiv soll für die erste Aktion beziehungsweise Veranstaltung verwendet werden? Bitte Überschrift, kurzen Text, Linkziel und gegebenenfalls Zeitraum nennen.
- Vorschlag: Wenn keine Aktion aktiv ist, bleibt der derzeitige allgemeine Autohaus-Slide als erste Folie stehen. Aktionen lassen sich bei Bedarf ersetzen.

## 2. Angebote: fehlende Fahrzeugdaten

Die vorhandenen strukturierten Verbrauchs- und Emissionswerte aus mobile.de werden angezeigt. Einzelne Inserate enthalten nicht alle Felder. Wie abgestimmt bleiben auch Angebote mit fehlenden Daten in der Vorschau sichtbar; Werte werden nicht geschätzt. Die konkrete Datenlage und der vorgeschlagene Umgang stehen in `ANGEBOTE-PFLICHTANGABEN.md`.

- Wer pflegt fehlende und fehlerhafte Fahrzeugdaten in mobile.de und kontrolliert sie regelmäßig?
- Soll vor dem Livegang ein Angebot automatisch vollständig ausgeblendet werden, wenn für die jeweilige Darstellung erforderliche Angaben fehlen? Vorschlag: fehlende Werte intern mit Inserat-ID melden und nach fachlich abgestimmten Regeln betroffene Angebote einschließlich Detailseite und weiterer Werbeflächen zurückhalten, bis sie ergänzt sind.
- Wer prüft vor dem Livegang, welche Angaben für welche Fahrzeuge und Werbeflächen erforderlich sind?

## 3. Team und Kontakt

Für Personen ohne verfügbares Foto werden derzeit neutrale Platzhalter angezeigt; fehlende Kontaktdaten bleiben wie abgestimmt weg.

- Können passende Porträts für die noch mit Platzhalter dargestellten Teammitglieder nachgereicht werden?
- Welche direkten Telefonnummern und E-Mail-Adressen sollen nach Einrichtung der neuen Telefonanlage für Geschäftsführung, Verkauf und Kundendienst angezeigt werden? Bis dahin bleiben die vorhandenen beziehungsweise ausdrücklich gelieferten Angaben bestehen.

## 4. Referenzen und Karriere

- Sollen Firmenreferenzen ergänzt werden? Vorschlag: eine kleine Auswahl konkreter Zusammenarbeit mit Name und kurzer Leistungsbeschreibung aufnehmen, sobald die betreffenden Unternehmen und Inhalte feststehen.
- Die bestehenden Stellenhinweise sind bereits enthalten. Soll später eine eigene Karriereseite entstehen? Dafür wären je Stelle Aufgaben, Anforderungen, Leistungen, Ansprechpartner und Bewerbungsweg nötig.

## 5. Camping & Tuning: Projektgalerie

- Welche bereits umgebauten Fahrzeuge sollen später gezeigt werden? Bitte pro Projekt Fotos, eine kurze Beschreibung der Arbeiten und – falls gewünscht – Modell und Baujahr bereitstellen.

## 6. Formulare und Testbetrieb

Die Anbindung und End-to-End-Prüfung von Formularen und E-Mail-Versand gehören zum separaten Cloudflare-/Resend-Paket. Die Vorschauhinweise auf den betreffenden Formularen dürfen erst entfallen, wenn das jeweilige Formular in der Zielumgebung tatsächlich funktioniert. Siehe `workers/forms/README.md`.

- Für die Abnahme: Wer erhält die internen Testanfragen, und welche kontrollierte Testadresse soll die Eingangsbestätigung erhalten?
- Sollen die Zusagen zur Rückmeldung innerhalb von 48 Stunden auch an Wochenenden und Feiertagen gelten oder nur an Werktagen?

## 7. Vor dem Livegang

- Öffnungszeiten, Kontaktdaten und Rechtstexte fachlich bestätigen und die endgültigen URLs samt Weiterleitungen in DEV_TEST prüfen; siehe `URL-KONZEPT.md`.
- Erst nach Test der gewünschten Funktionen und ausdrücklicher Freigabe die Veröffentlichung auf der Produktivumgebung vornehmen.
