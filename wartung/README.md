# Wartungsseite

`index.html`, `style.css` und der Ordner `assets` bilden eine eigenständige Wartungsseite ohne externe Schrift- oder Bilddienste. Die Vorschau ist unter `/wartung/` erreichbar. Die aktuelle Website wird dadurch nicht ersetzt.

Für den tatsächlichen Einsatz auf der bisherigen Website muss das zuständige Hosting die Wartungsseite gezielt ausliefern und Impressum sowie Datenschutz erreichbar halten. Für eine vorübergehende Wartung sollte der Server für betroffene Seiten HTTP 503 und einen passenden `Retry-After`-Header ausgeben; eine reine HTML-Datei kann diesen Status nicht selbst setzen. Die für die Vorschau gesetzte `noindex`-Angabe ist vor dem Einsatz entsprechend dem gewählten Serverkonzept zu prüfen. Den Einsatz und die Rückkehr zur regulären Website separat testen.
