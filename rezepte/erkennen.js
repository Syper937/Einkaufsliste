// Rezepttext erkennen
// Nimmt einen eingefügten Text (z. B. eine Instagram-Beschreibung) und sucht darin
// Titel, Portionen, Link, Zutaten (mit Menge und Kategorie) und Zubereitungsschritte.
// Läuft komplett auf dem Gerät – ohne Internet, ohne KI, nur mit Regeln.
(function (global) {
  "use strict";

  // ---------- Bausteine ----------
  const EINHEITEN = [
    "g", "gr", "gramm", "kg", "mg", "ml", "l", "liter", "cl", "dl",
    "el", "tl", "esslöffel", "teelöffel", "msp", "messerspitze", "messerspitzen",
    "prise", "prisen", "pck", "pkg", "päckchen", "packung", "packungen", "pack",
    "dose", "dosen", "becher", "bund", "stk", "stück", "zehe", "zehen",
    "scheibe", "scheiben", "tasse", "tassen", "cup", "cups", "tbsp", "tsp",
    "handvoll", "schuss", "spritzer", "glas", "gläser", "kugel", "kugeln",
    "blatt", "blätter", "zweig", "zweige", "stange", "stangen", "knolle", "knollen",
    "würfel", "tropfen", "beutel", "flasche", "flaschen", "stängel", "kopf", "köpfe",
    "pfund", "oz", "netz", "schale", "schalen"
  ];
  const SCHOEN = { gr: "g", gramm: "g", el: "EL", tl: "TL", esslöffel: "EL", teelöffel: "TL",
    stk: "Stück", pck: "Pck.", pkg: "Pck.", msp: "Msp.", liter: "l", tbsp: "EL", tsp: "TL" };

  const flucht = t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const EINH = "(?:" + [...EINHEITEN].sort((a, b) => b.length - a.length).map(flucht).join("|") + ")\\.?(?![a-zäöüß])";
  const ZAHL = "(?:\\d+\\s*[½¼¾⅓⅔]|\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?(?:\\s*(?:-|–|bis)\\s*\\d+(?:[.,]\\d+)?)?|[½¼¾⅓⅔⅛])";

  const MENGE_VORN = new RegExp(`^(${ZAHL})(?:\\s*x(?=\\s))?\\s*(${EINH})?\\s+(.+)$`, "i");
  const MENGE_HINTEN = new RegExp(`^(.+?)[\\s:,–-]+(${ZAHL})\\s*(${EINH})?$`, "i");
  const WORT_MENGE = /^(etwas|wenig|ein wenig|ein paar|einige|eine? Prise|eine? Handvoll|nach Belieben|nach Geschmack)\s+(.+)$/i;
  const WORT_MENGE_HINTEN = /^(.+?)[\s,(]+(nach Belieben|nach Geschmack|optional|zum (?:Braten|Bestreuen|Garnieren|Servieren))\)?$/i;

  const NUMMER = /^(?:schritt\s*)?(\d{1,2})\s*[.):]\s*(.+)$/i;
  const ZUTATEN_KOPF = /^(?:die\s+)?(zutaten|zutatenliste|ingredients|du brauchst|ihr braucht|was du brauchst|das brauchst du|einkaufsliste)\b/i;
  const SCHRITTE_KOPF = /^(zubereitung|zubereitungsschritte|anleitung|schritte|so geht'?s|und so geht'?s|so wird'?s gemacht|so machst du|instructions|method|directions|preparation)\b/i;
  const PORTIONEN = /(?:für|ergibt|reicht für|portionen:?|personen:?)?\s*(\d{1,2})\s*(?:portionen|personen|pers\.?|servings|portion)(?![a-zäöü])/i;
  const PORTIONEN_2 = /(?:portionen|personen|servings)\s*[:=]\s*(\d{1,2})/i;
  const FLOSKEL = /(link in (?:der |meiner )?bio|folg(?:e|t)? (?:mir|uns)|speicher(?:e|t)? (?:dir|euch|das)|teil(?:e|t)? (?:das|es|den beitrag)|kommentier|markier(?:e|t)?|guten appetit|enjoy|werbung|anzeige|unbezahlt|\bad\b|probier(?:t|e)? es aus|lass(?:t)? (?:mir|uns) .*wissen)/i;
  const LINK = /https?:\/\/[^\s<>"]+/gi;

  // ---------- Kategorien nach Stichwörtern ----------
  // Bei mehreren Treffern gewinnt das längste Wort ("Kokosmilch" → Vorrat, nicht "Milch" → Kühlregal).
  const STICHWORTE = {
    "Obst & Gemüse": "tomate tomaten kirschtomaten zwiebel zwiebeln schalotte knoblauch kartoffel kartoffeln süßkartoffel möhre möhren karotte karotten paprika zucchini gurke salat eisbergsalat rucola spinat babyspinat brokkoli blumenkohl lauch porree sellerie aubergine kürbis hokkaido pilze pilz champignon champignons avocado zitrone zitronen limette limetten orange orangen apfel äpfel banane bananen beeren erdbeeren himbeeren heidelbeeren blaubeeren birne mango ananas kräuter petersilie basilikum schnittlauch koriander minze dill rosmarin thymian salbei ingwer chili chilischote frühlingszwiebel frühlingszwiebeln lauchzwiebel radieschen kohl weißkohl rotkohl wirsing grünkohl rosenkohl fenchel spargel bohnen grüne bohnen erbsen zuckerschoten trauben kiwi pfirsich nektarine pflaume kirschen rote bete rhabarber mangold pak choi edamame gemüse obst",
    "Kühlregal": "milch vollmilch sahne schlagsahne kochsahne butter joghurt naturjoghurt griechischer joghurt quark magerquark käse bergkäse gouda emmentaler cheddar mozzarella burrata parmesan pecorino feta hirtenkäse halloumi frischkäse schmand saure sahne crème fraîche creme fraiche crème fraiche mascarpone ricotta hüttenkäse buttermilch kefir skyr eier eigelb eiweiß ei hackfleisch hack rinderhack hähnchen hähnchenbrust hühnchen pute putenbrust speck bacon schinken kochschinken wurst salami chorizo lachs thunfisch garnelen shrimps fisch tofu tempeh hefe frische hefe blätterteig pizzateig mürbeteig fleisch rind rindfleisch schwein schweinefleisch steak gnocchi",
    "Brot & Backwaren": "brot brötchen toast toastbrot baguette ciabatta fladenbrot pita wrap wraps tortilla tortillas laugenbrezel brezel croissant burger buns semmelbrösel paniermehl zwieback",
    "Vorrat": "mehl weizenmehl dinkelmehl zucker puderzucker brauner zucker rohrzucker vanillezucker salz pfeffer öl olivenöl rapsöl sonnenblumenöl sesamöl kokosöl essig balsamico reis basmatireis risottoreis nudeln pasta spaghetti penne fusilli tagliatelle lasagneplatten linsen kichererbsen kidneybohnen dose tomatenmark passierte tomaten gehackte tomaten brühe gemüsebrühe hühnerbrühe gewürz gewürze paprikapulver currypulver curry kurkuma kreuzkümmel kümmel zimt muskat muskatnuss oregano chiliflocken cayennepfeffer lorbeer lorbeerblatt vanille backpulver natron honig ahornsirup senf ketchup mayonnaise sojasauce sojasoße sojasosse fischsauce worcestersauce haferflocken nüsse mandeln walnüsse haselnüsse cashews pinienkerne sesam leinsamen chiasamen kakao schokolade zartbitterschokolade kuvertüre speisestärke stärke grieß couscous bulgur quinoa kokosmilch mais rosinen marmelade erdnussbutter tahini pesto oliven kapern sardellen gelatine agar pulver getrocknet",
    "Getränke": "wein weißwein rotwein bier sekt saft orangensaft apfelsaft rum likör wodka gin sprudel mineralwasser",
    "Drogerie": "backpapier alufolie frischhaltefolie"
  };
  const LISTE = [];
  for (const [kat, worte] of Object.entries(STICHWORTE)) {
    // Mehrteilige Stichworte stehen mit Leerzeichen dazwischen – die Liste ist nach Einzelwörtern
    // getrennt, daher bekannte Zweiwort-Begriffe zusammenführen.
    const teile = worte.replace(/(grüne|saure|griechischer|frische|rote|brauner|passierte|gehackte|crème|creme|pak) (\S+)/g, "$1_$2").split(" ");
    teile.forEach(w => LISTE.push({ wort: w.replace("_", " "), kat }));
  }

  const klein = t => String(t || "").toLowerCase().trim();

  function kategorie(name, gelernt) {
    const n = klein(name);
    if (gelernt && gelernt.has(n)) return gelernt.get(n);
    const woerter = n.split(/[^a-zäöüß]+/).filter(Boolean);
    let beste = null;
    for (const { wort, kat } of LISTE) {
      let passt;
      if (wort.length <= 3) {
        // kurze Wörter nur als ganzes Wort oder Wortende ("Olivenöl"), "ei" nur als ganzes Wort
        passt = woerter.some(w => w === wort || (wort !== "ei" && w.endsWith(wort)));
      } else {
        passt = n.includes(wort);
      }
      if (passt && (!beste || wort.length > beste.wort.length)) beste = { wort, kat };
    }
    return beste ? beste.kat : "Sonstiges";
  }

  // ---------- Zeilen säubern ----------
  function saeubern(zeile) {
    return zeile
      .replace(/(\d)️?⃣/gu, "$1.")                           // 1️⃣ → "1."
      .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍⃣]/gu, "")
      .replace(/^[\s•·*▪◦●○►▶➤✓✔☐□>\-–—]+/, "")                     // Aufzählungszeichen
      .replace(/\s+/g, " ")
      .trim();
  }
  const gross = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  const ohneSatzzeichen = t => t.replace(/^[\s,;:.]+|[\s,;:]+$/g, "").replace(/\.$/, "").trim();

  // ---------- Eine Zutatenzeile zerlegen ----------
  function einheit(e) {
    if (!e) return "";
    const roh = e.replace(/\.$/, "");
    return SCHOEN[roh.toLowerCase()] || (roh.length <= 3 ? roh.toLowerCase() : roh);
  }
  function zahl(z) { return z.replace(/\s+/g, " ").replace(/\s*\/\s*/, "/").replace(/\s*(-|–|bis)\s*/, "–"); }

  function zutat(zeile, gelernt) {
    let z = ohneSatzzeichen(zeile), name = z, qty = "", m;
    if ((m = z.match(MENGE_VORN))) {
      qty = [zahl(m[1]), einheit(m[2])].filter(Boolean).join(" ");
      name = m[3];
    } else if ((m = z.match(MENGE_HINTEN)) && !/^\d/.test(m[1])) {
      name = m[1];
      qty = [zahl(m[2]), einheit(m[3])].filter(Boolean).join(" ");
    } else if ((m = z.match(WORT_MENGE))) {
      qty = m[1].charAt(0).toLowerCase() + m[1].slice(1); name = m[2];
    } else if ((m = z.match(WORT_MENGE_HINTEN))) {
      name = m[1]; qty = m[2].charAt(0).toLowerCase() + m[2].slice(1);
    }
    name = gross(ohneSatzzeichen(name.replace(/^(?:von|vom)\s+/i, "")));
    return { name, qty, cat: kategorie(name, gelernt) };
  }

  // Sieht eine Zeile aus wie eine Zutat? (für Texte ohne Überschriften)
  function wieZutat(z) {
    if (z.length > 70 || NUMMER.test(z) && z.length > 40) return false;
    return new RegExp(`^${ZAHL}`, "i").test(z) || MENGE_HINTEN.test(z) || WORT_MENGE.test(z);
  }

  // ---------- Hauptfunktion ----------
  function erkennen(text, gelernt) {
    const ergebnis = { titel: "", portionen: null, quelle: "", zutaten: [], schritte: [] };
    text = String(text || "");

    // Link merken und aus dem Text nehmen
    const links = text.match(LINK) || [];
    ergebnis.quelle = (links.find(l => /instagram|tiktok|youtu|pinterest|facebook/i.test(l)) || links[0] || "")
      .replace(/[).,;]+$/, "");
    text = text.replace(LINK, " ");

    // Portionen
    const p = text.match(PORTIONEN) || text.match(PORTIONEN_2);
    if (p) ergebnis.portionen = Math.min(99, Math.max(1, parseInt(p[1], 10)));

    // Zeilen vorbereiten; Absätze mit "1. … 2. …" in einer Zeile auftrennen
    let zeilen = text.split(/\r?\n/)
      .flatMap(z => z.split(/\s+(?=(?:schritt\s*)?\d{1,2}[.)]\s+\D)/i))
      .map(saeubern)
      .filter(z => z && !/^(#\S+\s*)+$/.test(z) && !/^[@#]/.test(z));

    const hatKoepfe = zeilen.some(z => ZUTATEN_KOPF.test(z) || SCHRITTE_KOPF.test(z));
    let modus = "anfang";

    for (const roh of zeilen) {
      const z = roh.replace(/\s#\S+/g, "").trim();          // Hashtags am Zeilenende weg
      if (!z) continue;
      const ohneDoppelpunkt = z.replace(/:$/, "").trim();

      // Überschriften wechseln den Abschnitt
      if (ZUTATEN_KOPF.test(z) && z.length < 50) { modus = "zutaten"; continue; }
      if (SCHRITTE_KOPF.test(z) && z.length < 50) { modus = "schritte"; continue; }
      if (FLOSKEL.test(z) && z.length < 120) continue;

      // Unter-Überschriften wie "Für den Teig:" überspringen
      if (/:$/.test(z) && z.length < 40 && !/\d/.test(z) && modus !== "anfang") continue;

      if (modus === "anfang") {
        if (!ergebnis.titel && !wieZutat(z) && ohneDoppelpunkt.length <= 70 && !PORTIONEN.test(z)) {
          ergebnis.titel = gross(ohneDoppelpunkt.replace(/^rezept\s*[:\-–]\s*/i, ""));
          continue;
        }
        if (hatKoepfe) continue;                     // Einleitungstext vor "Zutaten" ignorieren
        // ohne Überschriften: selbst entscheiden
        modus = wieZutat(z) ? "zutaten" : "schritte";
        if (modus === "schritte" && !NUMMER.test(z) && z.length < 60) { modus = "anfang"; continue; }
      }

      if (modus === "zutaten") {
        const nr = z.match(NUMMER);
        const istSchritt = (nr && nr[2].length > 35) || z.length > 90 || (!hatKoepfe && !wieZutat(z) && z.length > 45);
        if (!istSchritt) {
          if (PORTIONEN.test(z) && !new RegExp(`^${ZAHL}\\s*${EINH}`, "i").test(z) && z.length < 30) continue;
          const zt = zutat(z, gelernt);
          if (zt.name) ergebnis.zutaten.push(zt);
          continue;
        }
        modus = "schritte";
      }

      if (modus === "schritte") {
        const nr = z.match(NUMMER);
        // Zeile beginnt klein und ohne Nummer → gehört noch zum vorigen Schritt (umgebrochene Zeile)
        if (!nr && /^[a-zäöüß(]/.test(z) && ergebnis.schritte.length) {
          const i = ergebnis.schritte.length - 1;
          ergebnis.schritte[i] = (ergebnis.schritte[i] + " " + z).replace(/\s+/g, " ").trim();
          continue;
        }
        const schritt = ohneSatzzeichen(nr ? nr[2] : z) + (/[.!?]$/.test(z) ? z.slice(-1) : "");
        if (schritt.length > 1) ergebnis.schritte.push(gross(schritt.replace(/^\s*[-–:]\s*/, "")));
      }
    }
    return ergebnis;
  }

  // ---------- Text aus einem Bildschirmfoto säubern ----------
  // Entfernt, was Instagram & Co. drumherum anzeigen (Uhrzeit, Likes, Kommentare …),
  // und typische Lesefehler bei Aufzählungszeichen und Emojis.
  const OBERFLAECHE = new RegExp([
    "^\\d{1,2}[:.]\\d{2}\\b.{0,12}$",                          // Uhrzeit oben
    "^(reels|beiträge|beitrag|folgen|gefolgt|nachricht|gesponsert|bearbeitet|original-?audio.*|mehr|weniger|antworten|teilen|senden)$",
    "^gef[äa]llt\\b.*",                                            // Gefällt 1.234 Mal
    "^[\\d.,]+\\s*(mal|likes?|kommentare?|aufrufe|views)\\b.*",
    "^alle\\s+[\\d.,]+\\s+kommentare.*",
    "^.{0,4}kommentar(e)? (ansehen|hinzuf[üu]gen).*",
    "^vor\\s+\\d+\\s+(sekunden|minuten|stunden|tagen|wochen|monaten|jahren)\\b.*",
    "^\\d+\\s*(std|min|tg|t|w|wo)\\.?$",
    "^[\\d. ]*(übersetzung|uebersetzung) anzeigen.*",
    "^gefällt .* und weiteren personen.*"
  ].join("|"), "i");

  function bildschirmText(text) {
    let zeilen = String(text || "").split(/\r?\n/).map(z => z
      .replace(/^[\s«»°•·*+~=\-–—>|©®@&%$"'„“”‚‘’^]+(?=\S)/, "")      // gelesene Aufzählungszeichen
      .replace(/^[^\s\d½¼¾⅓⅔]{1}\s+(?=\d)/, "")                     // einzelnes Störzeichen vor einer Zahl
      .replace(/(\d)\s*gq\b/g, "$1 g")                               // häufiger Lesefehler "50 gq"
      .replace(/\s+(…|\.\.\.)\s*mehr$/i, "")                       // "… mehr" am Ende
      .trim());
    zeilen = zeilen.filter(z => z.length > 1 && /[\p{L}\d]/u.test(z) && !OBERFLAECHE.test(z));
    // Benutzername vor der Beschreibung ("kochliebe_ Cremige Pasta …") entfernen
    const i = zeilen.findIndex(z => /^[a-z0-9._]{3,30}\s+\S/.test(z) && /[._\d]/.test(z.split(" ")[0]));
    if (i !== -1 && i < 4) zeilen[i] = zeilen[i].replace(/^\S+\s+/, "");
    return zeilen.join("\n");
  }

  const api = { erkennen, kategorie, bildschirmText };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.Rezepterkennung = api;
})(this);
