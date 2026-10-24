// Text aus Bildschirmfotos lesen
// Bereitet die Bilder vor (Graustufen, dunkler Modus wird umgedreht) und schickt sie
// an die Texterkennung im Hintergrund (ocr/leser.js). Läuft komplett auf dem Gerät.
(function (global) {
  "use strict";

  let worker = null;
  let zaehler = 0;
  const offen = new Map();

  function holen() {
    if (worker) return worker;
    worker = new Worker("ocr/leser.js");
    worker.onmessage = e => {
      const a = offen.get(e.data.id);
      if (!a) return;
      if ("fortschritt" in e.data) { if (a.fortschritt) a.fortschritt(e.data.fortschritt); return; }
      offen.delete(e.data.id);
      if (e.data.fehler) a.nein(new Error(e.data.fehler)); else a.ja(e.data);
    };
    worker.onerror = e => {
      offen.forEach(a => a.nein(new Error(e.message || "Texterkennung abgestürzt")));
      offen.clear();
      beenden();
    };
    return worker;
  }

  function senden(nachricht, fortschritt, transfer = []) {
    return new Promise((ja, nein) => {
      const id = ++zaehler;
      offen.set(id, { ja, nein, fortschritt });
      holen().postMessage({ ...nachricht, id }, transfer);
    });
  }

  function beenden() {
    if (worker) { worker.terminate(); worker = null; }
  }

  function bildLaden(datei) {
    return new Promise((ok, fehler) => {
      const url = URL.createObjectURL(datei);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); ok(img); };
      img.onerror = () => { URL.revokeObjectURL(url); fehler(new Error("Bild konnte nicht geöffnet werden")); };
      img.src = url;
    });
  }

  // Bild für die Erkennung aufbereiten: Graustufen, bei dunklem Hintergrund umkehren
  // (Tesseract liest dunkle Schrift auf hellem Grund am besten).
  async function vorbereiten(datei) {
    const img = await bildLaden(datei);
    const f = Math.min(1, 2600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * f);
    c.height = Math.round(img.naturalHeight * f);
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const daten = ctx.getImageData(0, 0, c.width, c.height);
    const p = daten.data;
    let summe = 0;
    for (let i = 0; i < p.length; i += 4) {
      const grau = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
      p[i] = p[i + 1] = p[i + 2] = grau;
      summe += grau;
    }
    if (summe / (p.length / 4) < 120) {
      for (let i = 0; i < p.length; i += 4) p[i] = p[i + 1] = p[i + 2] = 255 - p[i];
    }
    ctx.putImageData(daten, 0, 0);
    const blob = await new Promise(ok => c.toBlob(ok, "image/png"));
    return blob.arrayBuffer();
  }

  const Bildtext = {
    // dateien: Bilder; melden(text): kurze Statusmeldung für die Seite;
    // saeubern(text): wird auf jedes Bild einzeln angewendet, bevor doppelte Zeilen entfernt werden
    async lesen(dateien, melden = () => {}, saeubern = t => t) {
      try {
        melden("Texterkennung wird gestartet …");
        await senden({ art: "start" });
        const texte = [];
        for (let i = 0; i < dateien.length; i++) {
          const nr = dateien.length > 1 ? ` ${i + 1} von ${dateien.length}` : "";
          melden(`Lese Bild${nr} …`);
          const bytes = await vorbereiten(dateien[i]);
          const r = await senden({ art: "lesen", bild: bytes }, p => melden(`Lese Bild${nr} … ${p} %`), [bytes]);
          texte.push(saeubern(r.text || ""));
        }
        // Mehrere Bildschirmfotos überlappen beim Scrollen oft: Zeilen, die schon
        // auf einem vorigen Bild standen, nicht noch einmal übernehmen.
        const gesehen = new Set();
        const schluessel = z => z.toLowerCase().replace(/[^a-zäöüß0-9]/g, "");
        return texte.map(t => {
          const neu = t.split(/\r?\n/).filter(z => {
            const k = schluessel(z);
            return k.length < 4 || !gesehen.has(k);
          });
          neu.forEach(z => gesehen.add(schluessel(z)));
          return neu.join("\n");
        }).join("\n");
      } finally {
        beenden();          // Speicher wieder freigeben
      }
    }
  };

  global.Bildtext = Bildtext;
})(this);
