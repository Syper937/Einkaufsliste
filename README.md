# Einkaufsliste

Eine interaktive Einkaufsliste im Look eines linierten Notizblocks – gebaut mit Vibe Coding und Claude.

**Live:** https://syper937.github.io/Einkaufsliste/

## Funktionen
- Artikel mit Kategorie und Menge eintragen (grüner Knopf „hinzufügen“), abhaken, mit der roten Mülltonne löschen
- Erledigte Artikel lassen sich mit dem Kreispfeil ↺ wieder auf „offen“ setzen
- Artikel und Kategorien per Ziehen am Griff ⠿ verschieben (auch mit dem Finger)
- Doppeltippen auf einen Artikel benennt ihn um
- Die Liste wird im Browser des Geräts gespeichert – sie bleibt privat und wird nicht ins Internet hochgeladen
- Funktioniert nach dem ersten Öffnen auch offline

## Rezeptbuch
Oben rechts auf **„Rezepte →“** tippen. Das Rezeptbuch hat bewusst ein schlichtes, klares Design – der Notizblock-Look bleibt der Einkaufsliste vorbehalten.
- Neues Rezept mit zwei Reitern: **Selbst eintippen** oder **Aus Foto oder Text**
- **Aus Bildschirmfoto lesen:** Bildschirmfoto einer Rezeptbeschreibung (z. B. Instagram) auswählen – die App liest den Text auf dem Gerät heraus (Tesseract, deutsche Sprachdaten) und füllt das Rezept aus. Instagram-Oberfläche wie Likes und Kommentare wird herausgefiltert, überlappende Bildschirmfotos werden zusammengeführt
- Symbole oben rechts: Rezeptbuch sichern, Sicherung laden, Hilfe – jede Aktion fragt vorher mit Ja/Nein nach
- Rezepte mit Zutaten (Menge + Kategorie) und nummerierten Zubereitungsschritten aufschreiben, ändern, löschen
- Neue Rezepte starten mit drei Schritten, „+ weiteren Schritt“ hängt den nächsten an; leere Schritte fallen beim Speichern weg
- Portionen mit − / + umstellen – die Mengen rechnen sich mit
- Haken weg bei allem, was schon zu Hause ist, dann **„auf die Einkaufsliste“**: die Zutaten landen in der richtigen Kategorie; was schon offen auf der Liste steht, kommt nicht doppelt dazu
- **Rezepttext einfügen & erkennen:** kompletten Text (z. B. Instagram-Beschreibung) einfügen – Titel, Portionen, Link, Zutaten mit Menge und Kategorie sowie die Schritte füllen sich von selbst. Läuft offline, nur mit Regeln, danach kurz prüfen
- Link-Feld pro Rezept: im Rezept steht dann „▶ Video auf Instagram ansehen“
- **Fotos** pro Rezept (Kamera oder Mediathek, mehrere möglich): werden verkleinert gespeichert, antippen vergrößert, in der Liste als Vorschaubild
- **Rezeptbuch sichern / Sicherung laden:** eine Datei mit allen Rezepten und Fotos – zum Aufheben, für ein neues Handy oder für Freunde
- **Instagram:** Knopf „aus Zwischenablage“ legt sofort ein neues Rezept aus kopiertem Text an. Anleitung für einen iPhone-Kurzbefehl, der Beschreibung und Link zusammen kopiert, steht in der App unter „So holst du Rezepte aus Instagram“
- Suchfeld über den Rezepten findet Titel, Zutaten und Zubereitung („kase“ findet auch „Käse“)
- Zutaten, die schon als erledigt auf der Einkaufsliste stehen, werden wieder auf offen gesetzt statt doppelt eingetragen (gilt auch beim Eintippen in der Einkaufsliste)
- Beide Teile teilen sich den Speicher im Browser – kein Server, kein Konto

## Auf dem iPhone als App
In Safari öffnen → Teilen-Symbol → **„Zum Home-Bildschirm“**.

Wichtig: Die App immer über das Symbol auf dem Home-Bildschirm öffnen. Safari löscht Daten von Websites, die 7 Tage nicht im Browser geöffnet wurden – für Apps auf dem Home-Bildschirm gilt das nicht. Ab und zu „Rezeptbuch sichern“ schadet trotzdem nicht.

## Dateien
| Datei | Wozu |
| --- | --- |
| `index.html` | Die Einkaufsliste (Design und Logik) |
| `rezepte/index.html` | Das Rezeptbuch |
| `rezepte/bildtext.js` | Bereitet Bildschirmfotos vor und schickt sie an die Texterkennung |
| `rezepte/ocr/` | Texterkennung: Tesseract-Engine (WebAssembly), deutsche Sprachdaten, Hintergrund-Worker `leser.js` |
| `rezepte/fotos.js` | Speichert die Fotos in IndexedDB (größerer Speicher im Browser) |
| `rezepte/erkennen.js` | Erkennt Zutaten und Schritte in eingefügtem Text |
| `schrift.woff` | Die Handschrift, von beiden Seiten genutzt |
| `manifest.webmanifest` | Name und Symbol für den Home-Bildschirm |
| `sw.js` | Speichert die App zwischen, damit sie offline startet |
| `icon-180.png`, `icon-512.png` | App-Symbole |

## Texterkennung
[Tesseract](https://github.com/tesseract-ocr/tesseract) über [tesseract.js-core](https://github.com/naptha/tesseract.js-core) und die Sprachdaten aus [tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast), jeweils Apache License 2.0 (siehe `rezepte/ocr/LICENSE-*.txt`).

## Schrift
Handschrift „Caveat“ von Pablo Impallari, lizenziert unter der [SIL Open Font License 1.1](https://openfontlicense.org).
