# SEO-Konzept und Umsetzung – Automobile Rosenkranz

Stand: 4. November 2026. Diese Liste beschreibt die statischen Vorschauseiten und das vorgesehene Live-Setup bei IONOS.

## Zentrale Korrektur: Preview, Canonical und Live

Ein Canonical ist **keine allgemeine Zieladresse für eine ganze Website**. Jede indexierbare Seite erhält im Live-Betrieb ein selbstreferenzielles Canonical auf ihre eigene, endgültige URL. Nur echte Duplikate oder reine Filter-/Sortier-Varianten verweisen auf die bevorzugte Haupt-URL. Das Canonical gehört nicht pauschal auf die Startseite.

Die GitHub-Pages-Seite bleibt eine geschützte Vorschau mit `noindex,nofollow`. Ihre Inhalte unterscheiden sich von der aktuellen WordPress-Website und die WordPress-Routen sind teilweise anders. Deshalb entfernt die Vorschau jetzt Canonical-Tags, die fälschlich auf einzelne Produktions-URLs gezeigt haben. Beim IONOS-Go-live werden Canonicals auf die in der Tabelle aufgeführten finalen URLs gesetzt. Gleichzeitig werden die alten WordPress-Routen per gezielter 301-Weiterleitung auf die passenden neuen Seiten geführt. `index.html` wird auf `/` normalisiert.

Für Filter wie `modelle.html?marke=citroen` bleibt die ungefilterte `modelle.html` die kanonische Übersichtsseite, solange diese Filtervarianten keine eigenständigen, redaktionell einzigartigen Zielseiten sind. Für die Suchanfrage „Citroën Händler Recklinghausen“ empfehle ich zusätzlich eigene, inhaltlich substanzielle Citroën- und Subaru-Landingpages statt eine Filter-URL als Marken-Landingpage zu verwenden.

Google beschreibt Canonicals als Hinweis für Duplikate und wählt letztlich selbst, welche URL angezeigt wird. Es gibt keine Garantie, dass ein gesetztes Canonical übernommen wird. [Google: Canonicalisierung](https://developers.google.com/search/docs/crawling-indexing/canonicalization)

## Snippet-Texte

Alle unten aufgeführten Seitentitel und Meta Descriptions wurden überarbeitet. Die Descriptions sind einzigartig und liegen hier redaktionell zwischen 140 und 160 Zeichen. Das ist ein Arbeitsziel, kein Google-Limit: Google kann den Snippettext je nach Suchanfrage kürzen oder aus dem Seiteninhalt neu zusammensetzen. Die Beschreibung soll den tatsächlichen Seiteninhalt konkret zusammenfassen und einen passenden nächsten Schritt nennen, nicht Keywords aneinanderreihen.

Open-Graph- und Twitter-Titel sowie Beschreibungen stimmen mit den jeweiligen Seitensnippets überein. Die Hero-/Seitenbilder werden als Social Preview verwendet.

## Strukturierte Daten und KI-Suchsysteme

Die Vorschau enthält nun JSON-LD mit klaren Beziehungen zwischen Seite, Autohaus und Modell:

- Startseite: `AutoDealer`, `WebSite` und `WebPage` mit bestätigter Adresse, Kontakt und Verkaufsöffnungszeiten.
- Modell-Unterseiten: `WebPage` plus `Vehicle`, mit Modellname, Marke, Beschreibung und den zur Seite gehörenden Bildern.
- Angebote, Modellübersicht und VANDERER-Übersicht: `CollectionPage`; Service: zusätzlich `Service`; Über uns: `AboutPage`.
- Aktive mobile.de-Fahrzeugdetails behalten ein eigenes `Vehicle`-Objekt aus den aktuellen Fahrzeugdaten. Preis und Angebot werden nur ausgezeichnet, wenn sie tatsächlich aus dem aktiven Datensatz vorliegen.
- Es gibt absichtlich **kein** `AggregateRating` für Google-Bewertungen und kein FAQ-/Breadcrumb-Markup ohne sichtbare, passende Inhalte.

JSON-LD hilft Suchsystemen und anderen Crawlern, Entitäten und Fakten strukturiert einzuordnen. Es ersetzt weder sichtbare, hilfreiche Texte noch interne Verlinkungen. Google verlangt, dass strukturierte Daten mit dem sichtbaren Inhalt übereinstimmen; gültiges Markup garantiert keine besondere Darstellung. [Google: strukturierte Daten](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

**Wichtig:** Google hat die spezielle Darstellung für `Vehicle Listing`-Markup eingestellt. Die Fahrzeugdaten unten bleiben als allgemeines `Vehicle`-Schema für maschinenlesbare Produktfakten gedacht; sie versprechen kein Google-Fahrzeug-Rich-Result. [Google: Einstellung der Vehicle-Listing-Darstellung](https://developers.google.com/search/blog/2025/06/simplifying-search-results)

Google nennt für AI Overviews und AI Mode keine speziellen Schema- oder KI-Meta-Tags. Entscheidend bleiben indexierbare Seiten, hilfreiche Inhalte, interne Links, gut crawlbare Texte und mit dem sichtbaren Inhalt übereinstimmende strukturierte Daten. [Google: AI Features and Your Website](https://developers.google.com/search/docs/appearance/ai-features)

## Seitenliste

Die Canonical-Spalte zeigt jeweils die **endgültige Live-URL**. In der aktuellen GitHub-Vorschau steht absichtlich kein Canonical; alle Preview-Seiten bleiben `noindex,nofollow`.

| Seite | Bildmotiv | Title | Meta Description | Finales Canonical | Strukturierte Daten |
|---|---|---|---|---|---|
| `index.html` | `assets/models/citroen-ami.jpg` | Citroën & Subaru in Recklinghausen | Rosenkranz | Citroën und Subaru in Recklinghausen: Rosenkranz berät zu Neu- und Gebrauchtwagen, Gewerbefahrzeugen, Probefahrt, Werkstattservice und Wartung. (143 Zeichen) | `https://www.automobile-rosenkranz.de/` | AutoDealer + WebSite + WebPage |
| `angebote.html` | `assets/logo-header.png` | Gebrauchtwagen & Jahreswagen Recklinghausen | Rosenkranz | Aktuelle Gebrauchtwagen, Jahreswagen und Vorführwagen in Recklinghausen. Vergleichen Sie Preis, Laufleistung, Antrieb und Getriebe für Ihre Auswahl. (148 Zeichen) | `https://www.automobile-rosenkranz.de/angebote.html` | CollectionPage + WebPage |
| `modelle.html` | `assets/vanderer/one.webp` | Citroën & Subaru Neuwagen Recklinghausen | Rosenkranz | Entdecken Sie Citroën und Subaru Neuwagen in Recklinghausen: Kleinwagen, SUVs, Familien-Vans und Nutzfahrzeuge. Finden Sie Ihr Modell mit persönlicher Beratung. (160 Zeichen) | `https://www.automobile-rosenkranz.de/modelle.html` | CollectionPage + WebPage |
| `camping-tuning.html` | `assets/camping/wohnmobil-unterwegs.webp` | Camping, VANDERER & Tuning Recklinghausen | Rosenkranz | VANDERER One und Two, Camping und RRacing: Rosenkranz berät in Recklinghausen zu kompakten Campern, Tuning und individuellen Fahrzeugprojekten. (143 Zeichen) | `https://www.automobile-rosenkranz.de/camping-tuning.html` | WebPage |
| `service.html` | `assets/service-workshop.png` | Kfz-Service, Wartung & Reifenwechsel Recklinghausen | Rosenkranz | Wartung, Reparatur, Räderwechsel oder Teilekauf in Recklinghausen: Das Serviceteam von Automobile Rosenkranz unterstützt Sie persönlich rund ums Fahrzeug. (154 Zeichen) | `https://www.automobile-rosenkranz.de/service.html` | WebPage + Service |
| `ueber-uns.html` | `assets/autohaus-background.jpg` | Autohaus Rosenkranz Recklinghausen | Team & Geschichte | Lernen Sie Automobile Rosenkranz kennen: Ihr Autohaus in Recklinghausen mit persönlicher Beratung, erfahrenem Team und Markenvielfalt seit 1992. (144 Zeichen) | `https://www.automobile-rosenkranz.de/ueber-uns.html` | AboutPage |
| `impressum/index.html` | `assets/logo-header.png` | Impressum | Automobile Rosenkranz Recklinghausen | Impressum der Automobile Rosenkranz GmbH in Recklinghausen mit Anschrift, Handelsregister, Geschäftsführung, Umsatzsteuer-ID sowie Telefon und E-Mail. (150 Zeichen) | `https://www.automobile-rosenkranz.de/impressum/` | WebPage |
| `datenschutz/index.html` | `assets/logo-header.png` | Datenschutz | Automobile Rosenkranz Recklinghausen | Erfahren Sie, welche personenbezogenen Daten Automobile Rosenkranz verarbeitet, wofür Formularangaben genutzt werden und wann diese wieder gelöscht werden. (155 Zeichen) | `https://www.automobile-rosenkranz.de/datenschutz/` | WebPage |
| `vanderer.html` | `assets/vanderer/hero.webp` | VANDERER Camper One & Two Recklinghausen | Rosenkranz | Entdecken Sie VANDERER One und Two bei Automobile Rosenkranz in Recklinghausen: Camper mit Schlafdach oder flexiblem Sleep & Storage Konzept. (141 Zeichen) | `https://www.automobile-rosenkranz.de/vanderer.html` | CollectionPage + WebPage |
| `vanderer-one.html` | `assets/vanderer/one.webp` | VANDERER One mit Schlafdach | Recklinghausen | Rosenkranz | Der VANDERER One kombiniert Alltagstauglichkeit mit serienmäßigem Schlafdach. Entdecken Sie Ausstattung, Innenraumlösungen und Beratung bei Rosenkranz. (151 Zeichen) | `https://www.automobile-rosenkranz.de/vanderer-one.html` | WebPage |
| `vanderer-two.html` | `assets/vanderer/two.webp` | VANDERER Two Sleep & Storage | Recklinghausen | Rosenkranz | Der VANDERER Two bietet ein serienmäßiges Sleep & Storage Modul, Kühlbox und flexible Nutzung. Beratung bei Automobile Rosenkranz in Recklinghausen. (148 Zeichen) | `https://www.automobile-rosenkranz.de/vanderer-two.html` | WebPage |
| `citroen-ami.html` | `assets/models/gallery/ami/01.webp` | Citroën Ami | Elektro-Stadtmobil Recklinghausen | Rosenkranz | Der elektrische Citroën Ami ist kompakt und wendig für kurze Wege. Informieren Sie sich bei Rosenkranz in Recklinghausen zu Ausstattung und Probefahrt. (151 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-ami.html` | WebPage + Vehicle |
| `citroen-berlingo-kastenwagen.html` | `assets/models/gallery/berlingo-kastenwagen/01.webp` | Citroën Berlingo Kastenwagen | Gewerbe Recklinghausen | Der Citroën Berlingo Kastenwagen verbindet kompakten Laderaum mit Wendigkeit im Stadtverkehr. Rosenkranz berät Gewerbekunden in Recklinghausen zu Varianten. (156 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-berlingo-kastenwagen.html` | WebPage + Vehicle |
| `citroen-berlingo.html` | `assets/models/gallery/berlingo/01.webp` | Citroën Berlingo Familienvan | Recklinghausen | Rosenkranz | Der Citroën Berlingo bietet Platz für Familie, Gepäck und Freizeit. Entdecken Sie flexible Sitz- und Stauraumlösungen bei Rosenkranz in Recklinghausen. (151 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-berlingo.html` | WebPage + Vehicle |
| `citroen-c3-aircross.html` | `assets/models/gallery/c3-aircross/01.webp` | Citroën C3 Aircross | SUV Recklinghausen | Rosenkranz | Der Citroën C3 Aircross verbindet erhöhte Sitzposition, flexible Innenraumlösungen und moderne Antriebe. Entdecken Sie das SUV bei Rosenkranz in Recklinghausen. (160 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-c3-aircross.html` | WebPage + Vehicle |
| `citroen-c3.html` | `assets/models/gallery/c3/01.webp` | Citroën C3 | Kleinwagen & Probefahrt Recklinghausen | Der Citroën C3 verbindet kompaktes Format mit Komfort für Stadt und Alltag. Informieren Sie sich bei Rosenkranz und fragen Sie Ihre Probefahrt an. (146 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-c3.html` | WebPage + Vehicle |
| `citroen-c4-x.html` | `assets/models/gallery/c4x/01.webp` | Citroën C4 X | Fastback Recklinghausen | Rosenkranz | Der Citroën C4 X kombiniert Fastback-Design mit großzügigem Innenraum und Reisekomfort. Lernen Sie das Modell bei Rosenkranz in Recklinghausen kennen. (150 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-c4-x.html` | WebPage + Vehicle |
| `citroen-c4.html` | `assets/models/gallery/c4/01.webp` | Citroën C4 | Komfort & Beratung Recklinghausen | Der Citroën C4 verbindet eigenständiges Design mit Komfort und moderner Technik. Entdecken Sie verfügbare Antriebe und lassen Sie sich beraten. (143 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-c4.html` | WebPage + Vehicle |
| `citroen-c5-aircross.html` | `assets/models/gallery/der-neue-c5-aircross/01.webp` | Citroën C5 Aircross | SUV Recklinghausen | Rosenkranz | Der Citroën C5 Aircross bietet großzügigen Platz, Komfort und moderne Antriebe für Familie und Reise. Informieren Sie sich bei Rosenkranz in Recklinghausen. (156 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-c5-aircross.html` | WebPage + Vehicle |
| `citroen-e-c3-van.html` | `assets/models/gallery/c3-van/01.webp` | Citroën ë-C3 Van | Elektro-Nutzfahrzeug Recklinghausen | Der elektrische Citroën ë-C3 Van kombiniert kompakte Maße mit abgetrenntem Laderaum für Gewerbe und Stadtverkehr. Beratung in Recklinghausen anfragen. (150 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-e-c3-van.html` | WebPage + Vehicle |
| `citroen-holidays.html` | `assets/models/gallery/citroen-holiday/01.webp` | Citroën Holidays Camper Van | Recklinghausen | Rosenkranz | Der Citroën Holidays verbindet Van-Alltag mit Aufstelldach und Reisemobil-Ausstattung. Entdecken Sie den Camper bei Rosenkranz in Recklinghausen. (145 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-holidays.html` | WebPage + Vehicle |
| `citroen-jumper.html` | `assets/models/gallery/jumper/01.webp` | Citroën Jumper Transporter | Gewerbe Recklinghausen | Der Citroën Jumper bietet verschiedene Längen, Dachhöhen und Aufbauoptionen für Handwerk und Gewerbe. Rosenkranz berät Sie persönlich in Recklinghausen. (152 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-jumper.html` | WebPage + Vehicle |
| `citroen-jumpy.html` | `assets/models/gallery/jumpy/01.webp` | Citroën Jumpy Transporter | Recklinghausen | Rosenkranz | Der Citroën Jumpy bietet variablen Laderaum für Handwerk, Service und Lieferverkehr. Entdecken Sie Varianten und Gewerbeberatung bei Rosenkranz. (144 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-jumpy.html` | WebPage + Vehicle |
| `citroen-spacetourer.html` | `assets/models/gallery/spacetourer/01.webp` | Citroën SpaceTourer | Van Recklinghausen | Rosenkranz | Der Citroën SpaceTourer bietet variablen Raum für Familie, Freizeit und Personentransport. Informieren Sie sich bei Rosenkranz zu Ausstattung und Beratung. (155 Zeichen) | `https://www.automobile-rosenkranz.de/citroen-spacetourer.html` | WebPage + Vehicle |
| `subaru-crosstrek.html` | `assets/models/gallery/subaru-crosstrek-kompakter-suv-mit-allrad/01.webp` | Subaru Crosstrek Allrad-SUV | Recklinghausen | Rosenkranz | Der Subaru Crosstrek verbindet kompaktes SUV-Format, e-BOXER und permanenten Allrad. Entdecken Sie das Modell und Beratung in Recklinghausen. (141 Zeichen) | `https://www.automobile-rosenkranz.de/subaru-crosstrek.html` | WebPage + Vehicle |
| `subaru-e-outback.html` | `assets/models/gallery/subaru-e-outback-elektrischer-allrad-suv/01.webp` | Subaru E-OUTBACK Elektro-SUV | Recklinghausen | Rosenkranz | Der Subaru E-OUTBACK ergänzt die Modellwelt um einen elektrischen SUV mit Allrad. Erfahren Sie bei Rosenkranz mehr zu Modell und Verfügbarkeit. (143 Zeichen) | `https://www.automobile-rosenkranz.de/subaru-e-outback.html` | WebPage + Vehicle |
| `subaru-forester.html` | `assets/models/gallery/subaru-forester-vielseitiger-suv-mit-allrad/01.webp` | Subaru Forester Allrad-SUV | Recklinghausen | Rosenkranz | Der Subaru Forester kombiniert Allrad, Raumangebot und moderne Sicherheit für Alltag und Reise. Lernen Sie das Modell bei Rosenkranz kennen. (140 Zeichen) | `https://www.automobile-rosenkranz.de/subaru-forester.html` | WebPage + Vehicle |
| `subaru-impreza.html` | `assets/models/gallery/subaru-impreza-kompakter-allradler-mit-hybrid/01.webp` | Subaru Impreza | Kompakt & Allrad Recklinghausen | Der Subaru Impreza kombiniert kompaktes Format, e-BOXER und permanenten Allrad für Alltag und Reise. Entdecken Sie Ausstattung und Beratung bei Rosenkranz. (155 Zeichen) | `https://www.automobile-rosenkranz.de/subaru-impreza.html` | WebPage + Vehicle |
| `subaru-outback.html` | `assets/models/gallery/subaru-outback-crossover-fuer-alltag-und-abenteuer/01.webp` | Subaru Outback | Allrad Crossover Recklinghausen | Der Subaru Outback verbindet Kombi-Komfort mit SUV-Bodenfreiheit und Allradantrieb. Informieren Sie sich zu Ausstattung und Probefahrt in Recklinghausen. (153 Zeichen) | `https://www.automobile-rosenkranz.de/subaru-outback.html` | WebPage + Vehicle |
| `subaru-solterra.html` | `assets/models/gallery/subaru-solterra-vollelektrischer-suv-mit-allrad/01.webp` | Subaru Solterra Elektro-SUV | Recklinghausen | Rosenkranz | Der vollelektrische Subaru Solterra verbindet SUV-Alltagstauglichkeit mit Allradkompetenz. Entdecken Sie das Modell bei Rosenkranz in Recklinghausen. (149 Zeichen) | `https://www.automobile-rosenkranz.de/subaru-solterra.html` | WebPage + Vehicle |
| `subaru-uncharted.html` | `assets/models/gallery/subaru-uncharted-elektrischer-kompakt-suv/01.webp` | Subaru Uncharted Elektro-SUV | Recklinghausen | Rosenkranz | Der Subaru Uncharted ist ein kompakter Elektro-SUV mit dynamischem Design und wahlweisem Allrad. Informieren Sie sich bei Rosenkranz in Recklinghausen. (151 Zeichen) | `https://www.automobile-rosenkranz.de/subaru-uncharted.html` | WebPage + Vehicle |

## Fahrzeugdetailseiten aus mobile.de

Jedes aktive Fahrzeug erhält eine eigene sprechende Detail-URL nach dem Muster `/angebote/[modell-ausstattung-anzeigen-id]/`. Das finale Canonical zeigt exakt auf dieselbe Detailseite; weder auf mobile.de noch auf die Angebotsübersicht. Title und Description werden aus tatsächlichem Modell, Zustand, Erstzulassung, Kilometerstand, Antrieb und Preis erzeugt. Nicht vorhandene Fakten werden weggelassen. Der nächtliche bzw. stündliche mobile.de-Sync soll nur aktive Fahrzeuge mit Bildern in Angebotsübersicht, interner Suche, Dropdowns und Sitemap führen.

Wenn ein Fahrzeug dauerhaft aus mobile.de entfernt wird, verschwindet es aus den Listen und aus der Sitemap. Beim Go-live muss die Detail-URL dann passend behandelt werden: 410 bei dauerhaft entfallenem Fahrzeug oder 301 auf ein wirklich gleichwertiges Ersatzangebot. Kein pauschaler Redirect zur Startseite. Die Preview-Seiten erzeugen weiterhin `noindex,nofollow` und erhalten kein Produktions-Canonical.

## URL-Migration von WordPress zu IONOS

Bekannte alte WordPress-Routen, die beim Go-live gezielt abgebildet werden müssen:

- `/neuwagen/` → `/modelle.html`
- `/neuwagen/citroen/` → vorerst `/modelle.html?marke=citroen`; besser: neue eigenständige Citroën-Landingpage
- `/neuwagen/subaru/` → vorerst `/modelle.html?marke=subaru`; besser: neue eigenständige Subaru-Landingpage
- `/angebote/` → `/angebote.html`
- `/service/` → `/service.html`
- `/infos/team/` → `/ueber-uns.html`
- `/impressum/` und `/datenschutz/` bleiben unter ihren bisherigen URLs

Vor dem Go-live muss diese Liste anhand des WordPress-Sitemaps, der Search Console und gegebenenfalls externer Backlinks vervollständigt werden. Alte URLs nicht gesammelt zur Startseite umleiten. Canonical, Sitemap-URL und Ziel einer 301-Weiterleitung müssen für jede Route dieselbe finale URL nennen.

## Indexierung, Sitemap und Qualitätssicherung

- GitHub Pages bleibt `noindex,nofollow`; damit wird die Vorschau nicht als zweite Website indexiert.
- Auf IONOS wird die Indexierung erst nach Domain- und Weiterleitungstest freigegeben. Dort muss `robots.txt` das Crawling zulassen.
- Die Live-Sitemap enthält ausschließlich endgültige, indexierbare URLs: keine Vorschau-, Filter-, Redirect-, Platzhalter- oder dauerhaft entfernten Fahrzeugseiten.
- Nach Go-live: Sitemap in der Google Search Console einreichen; URL-Prüfung auf Startseite, Modell-Unterseite und Fahrzeugdetail; JSON-LD mit Rich Results Test/Schema Validator prüfen.
- Search Console sowie lokale Suchanfragen, organische Klicks, Impressionen und Kontaktaktionen nach 2–4 Wochen und danach monatlich auswerten.
- Schema-Daten aus Google Places dürfen die Adresse/Öffnungszeiten nur ergänzen, wenn sie mit Website und Google Unternehmensprofil übereinstimmen.

## Empfohlene zusätzliche Landingpages

1. `/citroen-recklinghausen.html`: Citroën-Verkauf in Recklinghausen, Beratung, Probefahrt, aktuelle Modellfamilie und Links zu allen Citroën-Unterseiten.
2. `/subaru-recklinghausen.html`: Subaru in Recklinghausen, Allrad-/Hybrid-/Elektromodellwelt, Beratung und Probefahrt.
3. Separate Service-Zielseiten nur für tatsächlich angebotene Leistungen wie Inspektion, Wartung, Reifenservice und Teile/Zubehör; jede mit eigener Erklärung, Ablauf, Kontaktmöglichkeit und lokalem Bezug.

Diese Seiten erst mit eigenem Nutzwert statt austauschbaren Orts- oder Keywordvarianten veröffentlichen. Interne Links aus Navi, Modellseiten, Service und Footer ergänzen.

## Vor Go-live

Die Texte und Schema-Objekte sind in der Vorschau aktualisiert, aber deren Seiten bleiben absichtlich nicht indexierbar. Vor dem produktiven Wechsel sind Canonicals auf den IONOS-Seiten zu setzen, `noindex` zu entfernen, die bestätigte URL-Migrationsliste als 301s umzusetzen und die finale Sitemap bei Google einzureichen. Gute Rankings oder eine Aufnahme in KI-Antworten können nicht zugesichert werden.
