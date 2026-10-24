// Texterkennung im Hintergrund (Web Worker)
// Liest Text aus einem Bild – z. B. einem Bildschirmfoto einer Instagram-Beschreibung.
// Nutzt Tesseract (Apache-Lizenz, siehe LICENSE-tesseract.txt) mit deutschen Sprachdaten.
// Alles läuft auf dem Gerät: Bilder werden nirgendwohin geschickt.
"use strict";

let Modul = null;
let api = null;
let bereit = null;
let aktuelleAufgabe = null;

// Kann dieses Gerät WebAssembly-SIMD? Dann die schnellere Fassung laden.
const SIMD_TEST = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);

function starten() {
  if (!bereit) {
    bereit = (async () => {
      const simd = (() => { try { return WebAssembly.validate(SIMD_TEST); } catch (e) { return false; } })();
      importScripts(simd ? "tesseract-core-simd-lstm.js" : "tesseract-core-lstm.js");
      Modul = await self.TesseractCore({
        // Fortschritt beim Lesen (0–100) an die Seite melden
        TesseractProgress(prozent) {
          if (aktuelleAufgabe !== null) self.postMessage({ id: aktuelleAufgabe, fortschritt: prozent });
        }
      });
      const antwort = await fetch("deu.traineddata");
      if (!antwort.ok) throw new Error("Sprachdaten nicht gefunden");
      Modul.FS.writeFile("deu.traineddata", new Uint8Array(await antwort.arrayBuffer()));
      api = new Modul.TessBaseAPI();
      if (api.Init(null, "deu", 1) !== 0) throw new Error("Texterkennung konnte nicht starten");
      api.SetVariable("tessedit_pageseg_mode", "3");     // Seite automatisch in Blöcke aufteilen
      api.SetVariable("preserve_interword_spaces", "1");
    })();
  }
  return bereit;
}

function lesen(bytes) {
  Modul.FS.writeFile("/input", bytes);
  if (api.SetImageFile(1, 0) === 1) throw new Error("Bild konnte nicht gelesen werden");
  api.Recognize(null);
  const text = api.GetUTF8Text();
  api.Clear();
  return text;
}

self.onmessage = async e => {
  const { id, art, bild } = e.data;
  try {
    await starten();
    if (art === "lesen") {
      aktuelleAufgabe = id;
      const text = lesen(new Uint8Array(bild));
      aktuelleAufgabe = null;
      self.postMessage({ id, text });
    } else {
      self.postMessage({ id, bereit: true });
    }
  } catch (err) {
    aktuelleAufgabe = null;
    self.postMessage({ id, fehler: String((err && err.message) || err) });
  }
};
