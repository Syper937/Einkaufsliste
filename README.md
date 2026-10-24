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
Oben rechts auf **„Rezepte →“** tippen.
- Rezepte mit Zutaten (Menge + Kategorie) und nummerierten Zubereitungsschritten aufschreiben, ändern, löschen
- Neue Rezepte starten mit drei Schritten, „+ weiteren Schritt“ hängt den nächsten an; leere Schritte fallen beim Speichern weg
- Portionen mit − / + umstellen – die Mengen rechnen sich mit
- Haken weg bei allem, was schon zu Hause ist, dann **„auf die Einkaufsliste“**: die Zutaten landen in der richtigen Kategorie; was schon offen auf der Liste steht, kommt nicht doppelt dazu
- Suchfeld über den Rezepten findet Titel, Zutaten und Zubereitung („kase“ findet auch „Käse“)
- Beide Teile teilen sich den Speicher im Browser – kein Server, kein Konto

## Auf dem iPhone als App
In Safari öffnen → Teilen-Symbol → **„Zum Home-Bildschirm“**.

## Dateien
| Datei | Wozu |
| --- | --- |
| `index.html` | Die Einkaufsliste (Design und Logik) |
| `rezepte/index.html` | Das Rezeptbuch |
| `schrift.woff` | Die Handschrift, von beiden Seiten genutzt |
| `manifest.webmanifest` | Name und Symbol für den Home-Bildschirm |
| `sw.js` | Speichert die App zwischen, damit sie offline startet |
| `icon-180.png`, `icon-512.png` | App-Symbole |

## Schrift
Handschrift „Caveat“ von Pablo Impallari, lizenziert unter der [SIL Open Font License 1.1](https://openfontlicense.org).
