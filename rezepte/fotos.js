// Fotos zu den Rezepten
// Fotos sind zu groß für den normalen Speicher (localStorage, ca. 5 MB).
// Deshalb liegen sie in IndexedDB – einer Datenbank im Browser, die viel mehr Platz hat.
// Die Rezepte selbst merken sich nur die Nummern (IDs) ihrer Fotos.
(function (global) {
  "use strict";

  const DB_NAME = "rezeptbuch-fotos";
  const STORE = "fotos";
  let dbVersprechen = null;

  function db() {
    if (!dbVersprechen) {
      dbVersprechen = new Promise((ok, fehler) => {
        const anfrage = indexedDB.open(DB_NAME, 1);
        anfrage.onupgradeneeded = () => anfrage.result.createObjectStore(STORE);
        anfrage.onsuccess = () => ok(anfrage.result);
        anfrage.onerror = () => fehler(anfrage.error);
      });
    }
    return dbVersprechen;
  }

  async function aktion(modus, arbeit) {
    const d = await db();
    return new Promise((ok, fehler) => {
      const tx = d.transaction(STORE, modus);
      const ergebnis = arbeit(tx.objectStore(STORE));
      tx.oncomplete = () => ok(ergebnis && "result" in ergebnis ? ergebnis.result : undefined);
      tx.onerror = () => fehler(tx.error);
      tx.onabort = () => fehler(tx.error);
    });
  }

  // ---------- Bild verkleinern ----------
  // Handyfotos haben oft 3–5 MB. Verkleinert auf 1600 Pixel sind es ca. 200 KB – sieht genauso gut aus.
  function bildLaden(quelle) {
    return new Promise((ok, fehler) => {
      const url = typeof quelle === "string" ? quelle : URL.createObjectURL(quelle);
      const img = new Image();
      img.onload = () => { if (typeof quelle !== "string") URL.revokeObjectURL(url); ok(img); };
      img.onerror = () => fehler(new Error("Bild konnte nicht gelesen werden"));
      img.src = url;
    });
  }

  function aufCanvas(img, max, qualitaet) {
    const f = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * f);
    c.height = Math.round(img.naturalHeight * f);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";                       // durchsichtige PNGs bekommen weißen Grund
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return new Promise(ok => c.toBlob(ok, "image/jpeg", qualitaet));
  }

  async function vorbereiten(quelle) {
    const img = await bildLaden(quelle);
    const [gross, mini] = await Promise.all([aufCanvas(img, 1600, 0.82), aufCanvas(img, 200, 0.75)]);
    return { gross, mini };
  }

  // ---------- Öffentliche Funktionen ----------
  const neueId = () => "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const urls = new Map();   // schon erzeugte Bild-Adressen wiederverwenden

  const Fotos = {
    // Datei (vom Handy) → verkleinerte Fassung, noch nicht gespeichert
    vorbereiten,

    async speichern(fassung, id = neueId()) {
      await aktion("readwrite", s => s.put(fassung, id));
      return id;
    },

    async laden(id) {
      return aktion("readonly", s => s.get(id));
    },

    // Adresse für <img src="…">, groesse = "gross" oder "mini"
    async url(id, groesse = "mini") {
      const schluessel = id + "|" + groesse;
      if (urls.has(schluessel)) return urls.get(schluessel);
      const f = await Fotos.laden(id);
      if (!f || !f[groesse]) return null;
      const u = URL.createObjectURL(f[groesse]);
      urls.set(schluessel, u);
      return u;
    },

    async loeschen(ids) {
      ids = [].concat(ids || []).filter(Boolean);
      if (!ids.length) return;
      ids.forEach(id => ["gross", "mini"].forEach(g => {
        const u = urls.get(id + "|" + g);
        if (u) { URL.revokeObjectURL(u); urls.delete(id + "|" + g); }
      }));
      await aktion("readwrite", s => ids.forEach(id => s.delete(id)));
    },

    // Für die Sicherung: Foto als Text (data-URL), damit es in eine JSON-Datei passt
    async alsText(id) {
      const f = await Fotos.laden(id);
      if (!f || !f.gross) return null;
      return new Promise((ok, fehler) => {
        const r = new FileReader();
        r.onload = () => ok(r.result);
        r.onerror = () => fehler(r.error);
        r.readAsDataURL(f.gross);
      });
    },

    // Aus der Sicherung zurück: Text → Foto (Miniatur wird neu erzeugt)
    async ausText(id, text) {
      const fassung = await vorbereiten(text);
      return Fotos.speichern(fassung, id);
    },

    // Den Browser bitten, die Daten nicht bei Platzmangel zu löschen
    async dauerhaft() {
      try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
    }
  };

  global.Fotos = Fotos;
})(this);
