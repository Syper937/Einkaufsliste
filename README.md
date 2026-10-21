# Einkaufsliste

Eine interaktive Einkaufsliste im Look eines linierten Notizblocks – gebaut mit Vibe Coding und Claude.

**Live:** https://syper937.github.io/Einkaufsliste/

## Funktionen
- Artikel mit Kategorie und Menge eintragen (grünes +), abhaken, mit der roten Mülltonne löschen
- Artikel und Kategorien per Ziehen am Griff ⠿ verschieben (auch mit dem Finger)
- Doppeltippen auf einen Artikel benennt ihn um
- Die Liste wird im Browser des Geräts gespeichert – sie bleibt privat und wird nicht ins Internet hochgeladen
- Funktioniert nach dem ersten Öffnen auch offline

## Auf dem iPhone als App
In Safari öffnen → Teilen-Symbol → **„Zum Home-Bildschirm“**.

## Dateien
| Datei | Wozu |
| --- | --- |
| `index.html` | Die ganze App (Design, Logik, eingebettete Schrift) |
| `manifest.webmanifest` | Name und Symbol für den Home-Bildschirm |
| `sw.js` | Speichert die App zwischen, damit sie offline startet |
| `icon-180.png`, `icon-512.png` | App-Symbole |

## Schrift
Handschrift „Caveat“ von Pablo Impallari, lizenziert unter der [SIL Open Font License 1.1](https://openfontlicense.org).
