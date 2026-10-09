import OpenAI from "openai";



/**

 * Normalizza una classe dell'IIS Pira.

 *

 * Esempi:

 * 1AS

 * 1A Liceo Scientifico

 * 1A LICEO SINISCOLA

 * 1^A LICEO SINISCOLA

 * 1^A LICEO SCIENTIFICO SINISCOLA

 *

 * diventano tutti:

 * 1AS

 *

 * La stessa logica vale per A/B e per tutte le classi 1-5.

 */

function normalizePiraClass(value: unknown): string {

  if (value === null || value === undefined) {

    return "";

  }



  let normalized = String(value)

    .toUpperCase()

    .replace(/°/g, "")

    .replace(/\^/g, "")

    .replace(/[.\_-]/g, " ")

    .replace(/\s+/g, " ")

    .trim();



  if (!normalized) {

    return "";

  }



  /*

   * Rimuove prefissi molto comuni nei titoli:

   *

   * "CONSIGLIO DI CLASSE 1A LICEO SINISCOLA"

   * "GLO 1^A LICEO SCIENTIFICO"

   */

  normalized = normalized

    .replace(/^CONSIGLIO DI CLASSE\s+/i, "")

    .replace(/^GLO\s+/i, "")

    .replace(/^GRUPPO DI LAVORO OPERATIVO\s+/i, "")

    .trim();



  /*

   * LICEO SCIENTIFICO SINISCOLA

   *

   * Riconosce:

   * 1A LICEO SCIENTIFICO

   * 1A LICEO SCIENTIFICO SINISCOLA

   * 1A LICEO SINISCOLA

   * 1 A LICEO SINISCOLA

   * 1^A LICEO SINISCOLA

   * 1^A LICEO SCIENTIFICO SINISCOLA

   */

  const liceoMatch = normalized.match(

    /^([1-5])\s*(?:A|B)\s+(?:LICEO\s+SCIENTIFICO(?:\s+DI)?(?:\s+SINISCOLA)?|LICEO\s+SINISCOLA)(?:\s+.*)?$/

  );



  if (liceoMatch) {

    const number = liceoMatch[1];



    const letterMatch = normalized.match(

      /^([1-5])\s*(A|B)\s+/

    );



    if (letterMatch) {

      return `${number}${letterMatch[2]}S`;

    }

  }



  /*

   * Forma con "^":

   *

   * 1^A LICEO SINISCOLA

   * 2^B LICEO SCIENTIFICO SINISCOLA

   */

  const liceoCaretMatch = normalized.match(

    /^([1-5])\s*(A|B)\s+(?:LICEO\s+SCIENTIFICO|LICEO)\b.*SINISCOLA.*$/

  );



  if (liceoCaretMatch) {

    return `${liceoCaretMatch[1]}${liceoCaretMatch[2]}S`;

  }



  /*

   * Formato interno già normalizzato:

   *

   * 1AS

   * 2AS

   * 3BS

   * ecc.

   */

  const shortLiceoMatch = normalized.match(

    /^([1-5])\s*(A|B)S$/

  );



  if (shortLiceoMatch) {

    return `${shortLiceoMatch[1]}${shortLiceoMatch[2]}S`;

  }



  /*

   * Varianti:

   *

   * 1AS LICEO SCIENTIFICO

   * 1AS LICEO SINISCOLA

   */

  const shortLiceoWithTextMatch = normalized.match(

    /^([1-5])\s*(A|B)S\s+(?:LICEO|SCIENTIFICO|SINISCOLA).*$/ 

  );



  if (shortLiceoWithTextMatch) {

    return `${shortLiceoWithTextMatch[1]}${shortLiceoWithTextMatch[2]}S`;

  }



  /*

   * IPSASR

   *

   * 4A IPSASR

   * 4^A IPSASR

   * 5B IPSASR

   */

  const ipsasrMatch = normalized.match(

    /^([1-5])\s*(A|B)\s+IPSASR\b.*$/

  );



  if (ipsasrMatch) {

    return `${ipsasrMatch[1]}${ipsasrMatch[2]} IPSASR`;

  }



  /*

   * Se la classe è già nel formato:

   * 4A IPSASR / 5A IPSASR

   */

  if (/^[1-5]\s*[AB]\s+IPSASR$/.test(normalized)) {

    return normalized.replace(

      /^([1-5])\s*([AB])\s+IPSASR$/,

      "$1$2 IPSASR"

    );

  }



  /*

   * Non modifichiamo classi che non possiamo identificare

   * con certezza.

   */

  return String(value).trim();

}



/**

 * Restituisce il codice interno normalizzato della classe.

 */

function getPiraCanonicalClass(value: unknown): string {

  const normalized = normalizePiraClass(value);



  if (/^[1-5][AB]S$/.test(normalized)) {

    return normalized;

  }



  if (/^[1-5][AB] IPSASR$/.test(normalized)) {

    return normalized;

  }



  return normalized;

}



/**

 * Normalizza le classi configurate dall'utente.

 */

function normalizeUserClasses(

  userClasses: string[],

  isPira: boolean

): string[] {

  if (!isPira) {

    return userClasses.map((c) => String(c).trim()).filter(Boolean);

  }



  return userClasses

    .map((c) => getPiraCanonicalClass(c))

    .filter(Boolean);

}



/**

 * Cerca una classe Pira dentro una stringa più lunga.

 *

 * Serve come ulteriore sicurezza quando l'AI restituisce,

 * per esempio:

 *

 * "Consiglio di Classe 1^A LICEO SINISCOLA"

 */

function extractPiraClassFromText(value: unknown): string {

  if (value === null || value === undefined) {

    return "";

  }



  const text = String(value)

    .toUpperCase()

    .replace(/°/g, "")

    .replace(/\^/g, "")

    .replace(/[.\_-]/g, " ")

    .replace(/\s+/g, " ")

    .trim();



  if (!text) {

    return "";

  }



  /*

   * Liceo Scientifico / Siniscola.

   */

  const liceoMatch = text.match(

    /(?:^|\s)([1-5])\s*(A|B)\s+(?:LICEO\s+SCIENTIFICO(?:\s+DI)?(?:\s+SINISCOLA)?|LICEO\s+SINISCOLA)(?:\s|$)/

  );



  if (liceoMatch) {

    return `${liceoMatch[1]}${liceoMatch[2]}S`;

  }



  /*

   * Forma 1AS / 1BS.

   */

  const shortMatch = text.match(

    /(?:^|\s)([1-5])\s*(A|B)S(?:\s|$)/

  );



  if (shortMatch) {

    return `${shortMatch[1]}${shortMatch[2]}S`;

  }



  /*

   * IPSASR.

   */

  const ipsasrMatch = text.match(

    /(?:^|\s)([1-5])\s*(A|B)\s+IPSASR(?:\s|$)/

  );



  if (ipsasrMatch) {

    return `${ipsasrMatch[1]}${ipsasrMatch[2]} IPSASR`;

  }



  return "";

}



/**
 * Recupera in modo deterministico gli eventi IPSASR dal testo della circolare.
 */
function normalizeScheduleText(text: string): string {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[–—−]/g, "-")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ");
}

function canonicalizeScheduleDate(value: string): string {
  const parts = String(value).split(/[\/.\-]/).map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return String(value).trim();
  const [day, month, year] = parts;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function canonicalizeScheduleTime(value: string): string {
  const cleaned = String(value).replace(/[.,]/g, ":");
  const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return String(value).trim();
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
}

function extractPiraDateMatches(text: string): Array<{ value: string; index: number }> {
  const results: Array<{ value: string; index: number }> = [];
  const numeric = /\b(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4})\b/g;
  for (const match of text.matchAll(numeric)) {
    results.push({ value: match[1], index: match.index ?? 0 });
  }
  return results;
}

function extractPiraScheduleEventsFromSection(
  sectionText: string,
  sectionType: "liceo" | "ipsasr"
): any[] {
  const section = normalizeScheduleText(sectionText);
  const dates = extractPiraDateMatches(section);
  const events: any[] = [];

  const classPattern = sectionType === "liceo"
    ? "([1-5])\\s*\\^?\\s*([AB])\\s+(?:LICEO\\s+SCIENTIFICO(?:\\s+DI)?(?:\\s+SINISCOLA)?|LICEO\\s+SINISCOLA)\\b"
    : "([45])\\s*\\^?\\s*(A)\\s+IPSASR\\b";

  const timeRegex = /(\d{1,2}[\.:]\d{2})\s*-\s*(\d{1,2}[\.:]\d{2})/g;
  const classRegex = new RegExp(classPattern, "gi");

  const addEvent = (
    date: string,
    startTime: string,
    endTime: string,
    classNumber: string,
    classLetter: string
  ) => {
    const canonicalClass = sectionType === "liceo"
      ? `${classNumber}${classLetter.toUpperCase()}S`
      : `${classNumber}A IPSASR`;

    if (sectionType === "ipsasr" && canonicalClass !== "4A IPSASR" && canonicalClass !== "5A IPSASR") {
      return;
    }

    events.push({
      title: `Consiglio di Classe ${canonicalClass}`,
      type: "Consigli di Classe",
      sede: sectionType === "ipsasr" ? "Sede Agrario" : "Sede Centrale",
      data: canonicalizeScheduleDate(date),
      oraInizio: canonicalizeScheduleTime(startTime),
      oraFine: canonicalizeScheduleTime(endTime),
      classe: canonicalClass,
    });
  };

  for (let i = 0; i < dates.length; i++) {
    const current = dates[i];
    const next = dates[i + 1];
    const blockStart = current.index + current.value.length;
    const blockEnd = next ? next.index : section.length;
    const block = section.slice(blockStart, blockEnd);

    const classMatches = [...block.matchAll(classRegex)];
    const timeMatches = [...block.matchAll(timeRegex)];

    for (const classMatch of classMatches) {
      const groups = classMatch.slice(1);
      const classNumber = groups[0];
      const classLetter = groups[1];
      const classStart = classMatch.index ?? 0;
      const classEnd = classStart + classMatch[0].length;

      const previousTimes = timeMatches.filter((timeMatch) =>
        (timeMatch.index ?? 0) + timeMatch[0].length <= classStart
      );
      const nextTimes = timeMatches.filter((timeMatch) =>
        (timeMatch.index ?? 0) >= classEnd
      );

      const previous = previousTimes.length > 0
        ? previousTimes[previousTimes.length - 1]
        : undefined;
      const following = nextTimes.length > 0
        ? nextTimes[0]
        : undefined;

      let selected = previous;
      if (following) {
        const previousDistance = previous
          ? classStart - ((previous.index ?? 0) + previous[0].length)
          : Number.POSITIVE_INFINITY;
        const followingDistance = (following.index ?? 0) - classEnd;

        if (followingDistance < previousDistance) {
          selected = following;
        }
      }

      if (!selected) continue;

      const timeGroups = selected.slice(1);
      addEvent(
        current.value,
        timeGroups[0],
        timeGroups[1],
        classNumber,
        classLetter
      );
    }
  }

  const unique = new Map<string, any>();
  for (const event of events) {
    const key = `${event.classe}|${event.data}|${event.oraInizio}|${event.oraFine}`;
    if (!unique.has(key)) unique.set(key, event);
  }

  return [...unique.values()];
}

function extractPiraScheduleEvents(text: string): any[] {
  const normalized = normalizeScheduleText(text);
  if (!normalized) return [];

  const events: any[] = [];

  const sectionDefinitions: Array<{
    type: "liceo" | "ipsasr";
    start: RegExp;
    end: RegExp;
  }> = [
    {
      type: "ipsasr",
      start: /ISTITUTO\s+PROFESSIONALE(?:\s+PER\s+L[’']AGRICOLTURA)?(?:\s+E\s+LO\s+SVILUPPO\s+RURALE|\s+SERVIZI\s+AGRICOLTURA\s+SVILUPPO\s+RURALE)[\s\S]*?Sede\s+(?:Centrale|Agrario)/i,
      end: /LICEO\s+SCIENTIFICO\s+DI?\s+SINISCOLA|LICEO\s+SCIENTIFICO\s+SINISCOLA|LICEO\s+SCIENTIFICO\s+DI?\s+DORGALI|ISTITUTO\s+TECNICO\s+TRASPORTI|ISTITUTO\s+PROFESSIONALE|IL\s+DIRIGENTE\s+SCOLASTICO/i,
    },
    {
      type: "liceo",
      start: /LICEO\s+SCIENTIFICO\s+(?:DI\s+)?SINISCOLA\b[\s\S]{0,80}?Sede\s+(?:Centrale|Siniscola)/i,
      end: /LICEO\s+SCIENTIFICO\s+(?:DI\s+)?DORGALI|ISTITUTO\s+TECNICO\s+TRASPORTI|ISTITUTO\s+PROFESSIONALE|IL\s+DIRIGENTE\s+SCOLASTICO/i,
    },
  ];

  for (const definition of sectionDefinitions) {
    const startMatch = normalized.match(definition.start);
    if (!startMatch || startMatch.index === undefined) continue;

    const sectionStart = startMatch.index;
    const afterStart = sectionStart + startMatch[0].length;
    const remainder = normalized.slice(afterStart);
    const endMatch = remainder.match(definition.end);
    const sectionEnd = endMatch && endMatch.index !== undefined
      ? afterStart + endMatch.index
      : normalized.length;

    const section = normalized.slice(sectionStart, sectionEnd);
    events.push(...extractPiraScheduleEventsFromSection(section, definition.type));
  }

  const unique = new Map<string, any>();
  for (const event of events) {
    const key = `${event.classe}|${event.data}|${event.oraInizio}|${event.oraFine}`;
    if (!unique.has(key)) unique.set(key, event);
  }

  return [...unique.values()];
}

function ensurePiraScheduleEvents(events: any[], text: string): any[] {
  const result = Array.isArray(events) ? [...events] : [];
  const extracted = extractPiraScheduleEvents(text);

  for (const event of extracted) {
    const exists = result.some((existing) =>
      getPiraCanonicalClass(existing?.classe || existing?.title) === event.classe &&
      String(existing?.data || "") === event.data &&
      String(existing?.oraInizio || "") === event.oraInizio &&
      String(existing?.oraFine || "") === event.oraFine
    );

    if (!exists) {
      result.push(event);
      console.log(
        `🛡️ Evento Pira recuperato automaticamente: ${event.classe} ${event.data} ${event.oraInizio}-${event.oraFine}`
      );
    }
  }

  return result;
}

function extractOrderOfDayFromText(text: string): string[] {
  const normalized = normalizeScheduleText(text)
    .replace(/\u2022/g, "•")
    .replace(/[\u2018\u2019]/g, "'");
  if (!normalized.trim()) return [];

  // Riconosce sia l'intestazione estesa sia le varianti ODG / O.D.G.
  const markerRegex = /\bORDINE\s+DEL\s+GIORNO\b\s*:?|\bO\s*\.?\s*D\s*\.?\s*G\s*\.?\s*:?/i;
  const markerMatch = markerRegex.exec(normalized);
  if (!markerMatch || markerMatch.index === undefined) return [];

  let section = normalized.slice(markerMatch.index + markerMatch[0].length);

  // L'ODG termina prima delle tabelle del calendario o della firma finale.
  const stopRegex = /\b(?:ISTITUTO\s+PROFESSIONALE|LICEO\s+SCIENTIFICO\s+(?:DI\s+)?SINISCOLA|LICEO\s+SCIENTIFICO\s+(?:DI\s+)?DORGALI|ISTITUTO\s+TECNICO\s+TRASPORTI|CALENDARIO\s+DEGLI\s+INCONTRI|SECONDO\s+IL\s+CALENDARIO|IL\s+DIRIGENTE\s+SCOLASTICO)\b/i;
  const stopMatch = stopRegex.exec(section);
  if (stopMatch && stopMatch.index > 0) section = section.slice(0, stopMatch.index);

  section = section
    .replace(/\r/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
  if (!section) return [];

  // Primo tentativo: elenco numerato, sia su più righe sia tutto su una riga.
  const itemStarts = [...section.matchAll(/(?:^|\s)(\d{1,2})\s*[.)]\s+/g)];
  const numberedItems: string[] = [];

  for (let i = 0; i < itemStarts.length; i++) {
    const match = itemStarts[i];
    const markerEnd = (match.index ?? 0) + match[0].length;
    const nextStart = i + 1 < itemStarts.length
      ? (itemStarts[i + 1].index ?? section.length)
      : section.length;
    const item = section
      .slice(markerEnd, nextStart)
      .replace(/^\s+|\s+$/g, "")
      .replace(/[\n\r]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/[;,.\s]+$/g, "")
      .trim();

    if (item.length > 2) numberedItems.push(item);
  }

  if (numberedItems.length > 0) {
    return [...new Set(numberedItems)];
  }

  // Fallback: elenchi con pallini o trattini, comuni nei testi estratti dai PDF.
  const bulletItems = section
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^[•●▪◦*-]\s+/.test(line))
    .map((line) => line.replace(/^[•●▪◦*-]\s+/, "").replace(/[;,.\s]+$/g, "").trim())
    .filter((item) => item.length > 2);

  if (bulletItems.length > 0) return [...new Set(bulletItems)];

  // Ultimo fallback per PDF che appiattiscono ogni punto su una riga senza numerazione.
  return [...new Set(
    section
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 8 && !/^\d{1,2}[.)]?$/.test(line))
  )];
}

/**
 * Normalizza gli eventi restituiti dall'AI.
 *
 * Questa è la seconda protezione: anche se Groq restituisce una variante
 * testuale della classe, nel DB finirà con il codice canonico.
 */
function normalizePiraEvents(events: any[]): any[] {

  if (!Array.isArray(events)) {

    return [];

  }



  return events.map((event) => {

    const normalizedEvent = {

      ...event,

    };



    const classFromField = extractPiraClassFromText(

      event?.classe

    );



    const classFromTitle = extractPiraClassFromText(

      event?.title

    );



    const canonicalClass =

      classFromField ||

      classFromTitle ||

      normalizePiraClass(event?.classe);



    if (canonicalClass) {

      normalizedEvent.classe = canonicalClass;



      /*

       * Per i Consigli di Classe rendiamo il titolo

       * coerente con la classe normalizzata.

       */

      const type = String(event?.type || "").toLowerCase();



      if (

        type.includes("consiglio di classe") ||

        type.includes("consigli di classe")

      ) {

        normalizedEvent.title =

          `Consiglio di Classe ${canonicalClass}`;

      }



      if (

        type.includes("glo") ||

        type.includes("gruppi di lavoro operativi")

      ) {

        normalizedEvent.title =

          `GLO ${canonicalClass}`;

      }

    }



    return normalizedEvent;

  });

}



export async function analyzeCircularText(

  text: string,

  userClasses: string[] = []

) {

  const openai = new OpenAI({

    apiKey: process.env.OPENAI_API_KEY,

    baseURL: "https://api.groq.com/openai/v1",

  });



  const upperText = text.toUpperCase();



  const isChironi =

    upperText.includes("CHIRONI") ||

    upperText.includes("NUTD110002") ||

    upperText.includes("NUORO");



  const isPira =

    upperText.includes("PIRA") ||

    upperText.includes("SINISCOLA") ||

    upperText.includes("LICEO SCIENTIFICO");



  let relevantClasses = userClasses;

  let schoolContext = "";

  let schoolName = "";



  if (isChironi && !isPira) {

    relevantClasses = userClasses.filter((c) =>

      c.toUpperCase().includes("OR")

    );



    schoolContext =

      "\n\n🏫 SCUOLA: CHIRONI-SATTA (Nuoro)\n" +

      `CLASSI RILEVANTI: ${relevantClasses.join(", ")}\n` +

      "ISTRUZIONE: Estrai SOLO eventi per queste classi OR. Ignora tutte le altre.";



    schoolName = "ITC Chironi-Satta";

  } else if (isPira && !isChironi) {

    /*

     * IMPORTANTE:

     *

     * Non cerchiamo più semplicemente AS/BS/IPSASR

     * dentro la stringa originale.

     *

     * Prima normalizziamo tutte le classi.

     */

    const normalizedConfiguredClasses =

      normalizeUserClasses(userClasses, true);



    relevantClasses = normalizedConfiguredClasses.filter(

      (c) =>

        /^[1-5][AB]S$/.test(c) ||

        /^[1-5][AB] IPSASR$/.test(c)

    );



    /*

     * Se per qualche motivo la configurazione utente

     * non contiene le classi Liceo ma la circolare

     * è chiaramente del Liceo di Siniscola, manteniamo

     * comunque disponibili tutti i codici canonici.

     */

    const canonicalPiraClasses = [
      "1AS",
    "2AS",
    "3AS",
    "4AS",
    "5AS",
    "1BS",
    "2BS",
    "3BS",
    "4BS",
    "5BS",
    "4A IPSASR",
      "5A IPSASR",
    ];

    for (const classCode of canonicalPiraClasses) {
      if (!relevantClasses.includes(classCode)) {
        relevantClasses.push(classCode);
      }
    }



    schoolContext =

      "\n\n🏫 SCUOLA: IIS PIRA - LICEO SCIENTIFICO DI SINISCOLA\n" +

      `CLASSI RILEVANTI: ${relevantClasses.join(", ")}\n\n` +



      "NORMALIZZAZIONE OBBLIGATORIA DELLE CLASSI:\n" +

      "- 1AS = 1A LICEO SCIENTIFICO = 1A LICEO SINISCOLA = 1^A LICEO SINISCOLA = 1^A LICEO SCIENTIFICO SINISCOLA\n" +

      "- 1BS = 1B LICEO SCIENTIFICO = 1B LICEO SINISCOLA = 1^B LICEO SINISCOLA = 1^B LICEO SCIENTIFICO SINISCOLA\n" +

      "- 2AS = 2A LICEO SCIENTIFICO = 2A LICEO SINISCOLA = 2^A LICEO SINISCOLA = 2^A LICEO SCIENTIFICO SINISCOLA\n" +

      "- 2BS = 2B LICEO SCIENTIFICO = 2B LICEO SINISCOLA = 2^B LICEO SINISCOLA = 2^B LICEO SCIENTIFICO SINISCOLA\n" +

      "- 3AS = 3A LICEO SCIENTIFICO = 3A LICEO SINISCOLA = 3^A LICEO SINISCOLA = 3^A LICEO SCIENTIFICO SINISCOLA\n" +

      "- 3BS = 3B LICEO SCIENTIFICO = 3B LICEO SINISCOLA = 3^B LICEO SINISCOLA = 3^B LICEO SCIENTIFICO SINISCOLA\n" +

      "- 4AS = 4A LICEO SCIENTIFICO = 4A LICEO SINISCOLA = 4^A LICEO SINISCOLA = 4^A LICEO SCIENTIFICO SINISCOLA\n" +

      "- 4BS = 4B LICEO SCIENTIFICO = 4B LICEO SINISCOLA = 4^B LICEO SINISCOLA = 4^B LICEO SCIENTIFICO SINISCOLA\n" +

      "- 5AS = 5A LICEO SCIENTIFICO = 5A LICEO SINISCOLA = 5^A LICEO SINISCOLA = 5^A LICEO SCIENTIFICO SINISCOLA\n" +

      "- 5BS = 5B LICEO SCIENTIFICO = 5B LICEO SINISCOLA = 5^B LICEO SINISCOLA = 5^B LICEO SCIENTIFICO SINISCOLA\n" +

      "- 4A IPSASR e 5A IPSASR devono rimanere distinti dalle classi del Liceo.\n" +
      "- Nella tabella 'ISTITUTO PROFESSIONALE SERVIZI AGRICOLTURA SVILUPPO RURALE - Sede Agrario', leggi ogni riga e crea un evento per ogni classe IPSASR presente.\n" +
      "- '4^A IPSASR', '4 A IPSASR' e '4A IPSASR' sono la stessa classe canonica '4A IPSASR'. Lo stesso vale per '5^A IPSASR', '5 A IPSASR' e '5A IPSASR'.\n" +
      "- NON saltare la tabella IPSASR anche se l'Ordine del Giorno contiene già riferimenti all'IPSASR.\n\n" +



      "REGOLE IMPORTANTI PER LE CLASSI DEL LICEO:\n" +

      "- La dicitura può cambiare da una circolare all'altra.\n" +

      "- NON usare la forma testuale trovata nel PDF come identificatore interno.\n" +

      "- Converti sempre le classi del Liceo di Siniscola nel codice canonico 1AS-5AS o 1BS-5BS.\n" +

      "- Una tabella con intestazione 'LICEO SCIENTIFICO DI SINISCOLA' o 'LICEO SCIENTIFICO SINISCOLA' stabilisce il contesto per tutte le classi presenti sotto quell'intestazione.\n" +

      "- Per esempio, se trovi '2^B LICEO SINISCOLA', la classe canonica è 2BS.\n" +

      "- NON ignorare una classe solo perché il suo testo non coincide esattamente con la configurazione dell'utente.\n\n" +



      "ESTRAZIONE IPSASR:\n" +
      "- Devi estrarre anche gli eventi della tabella dell'Istituto Professionale Servizi Agricoltura Sviluppo Rurale (Sede Agrario).\n" +
      "- Per le classi 4^A IPSASR e 5^A IPSASR, restituisci rispettivamente 4A IPSASR e 5A IPSASR.\n" +
      "- Non considerare la presenza nell'Ordine del Giorno come sostitutiva delle righe della tabella.\n" +
      "- Mantieni data e orari esattamente indicati nella tabella.\n\n" +

      "ESTRAZIONE DEL LICEO:\n" +

      "- Devi estrarre TUTTI gli eventi del Liceo Scientifico di Siniscola presenti nella circolare.\n" +

      "- Non fermarti agli eventi IPSASR.\n" +

      "- Se una tabella contiene 10 Consigli di Classe del Liceo, devono essere restituiti tutti e 10.\n" +

      "- Mantieni data, ora di inizio, ora di fine e sede esattamente corrispondenti alla tabella.\n\n" +



      "ISTRUZIONE GENERALE: estrai gli eventi pertinenti al IIS Pira. " +

      "Gli eventi relativi a classi di altre scuole o sedi non pertinenti devono essere ignorati.";



    schoolName = "IIS Pira";

  } else {

    schoolContext =

      "\n\n⚠️ SCUOLA NON IDENTIFICATA: estrai eventi per tutte le classi configurate.";



    schoolName = "Istituto";

  }



  const response = await openai.chat.completions.create({

    model: "openai/gpt-oss-120b",



    messages: [

      {

        role: "system",



        content: `Sei SchoolAgent, un esperto nell'analisi di circolari scolastiche italiane.



Il tuo compito è estrarre i dati da una circolare testuale e restituire UN SOLO oggetto JSON valido.



STRUTTURA JSON OBBLIGATORIA:



{

  "circolare": {

    "numero": "string",

    "data": "string",

    "oggetto": "string (NON vuoto!)",

    "destinatari": ["array"]

  },

  "eventi": [

    {

      "title": "string",

      "type": "string",

      "sede": "string",

      "data": "DD/MM/YYYY",

      "oraInizio": "HH:MM",

      "oraFine": "HH:MM",

      "classe": "string"

    }

  ],

  "ordineDelGiorno": ["array"]

}



REGOLE FONDAMENTALI:



1\. OGGETTO



\- Il campo "oggetto" NON deve MAI essere vuoto.

\- Usa l'oggetto della circolare quando disponibile.

\- Se l'oggetto non è esplicitamente indicato, ricavalo dal contenuto della circolare.



2\. DISTINZIONE ODG / EVENTI



\- "ordineDelGiorno" contiene gli ARGOMENTI da discutere.

\- Gli argomenti dell'Ordine del Giorno NON sono eventi.

\- "eventi" contiene invece le RIUNIONI, CONVOCAZIONI o ATTIVITÀ che hanno una data e un orario.

\- Una riunione deve essere inserita in "eventi" anche se non è associata ad alcuna classe.



2A. EVENTO PRINCIPALE DELLA CIRCOLARE — REGOLA OBBLIGATORIA



Se la circolare riguarda la convocazione di una riunione o di un'attività scolastica con data e orario, devi creare l'evento corrispondente.



Questa regola vale in particolare per:



\- Collegio dei Docenti

\- Collegio dei Docenti Plenario

\- Collegio di Plesso

\- Dipartimenti

\- Consigli di Classe

\- GLO

\- Colloqui

\- altre riunioni scolastiche chiaramente convocate



IMPORTANTE:



Se la circolare contiene una convocazione con data e orario, NON puoi restituire:



"eventi": []



solo perché la riunione non è associata ad una classe.



Per gli eventi generali:



\- "classe" deve essere ""

\- "type" deve indicare la categoria corretta

\- "title" deve descrivere chiaramente la riunione

\- "sede" deve essere estratta dalla circolare

\- "data" deve essere estratta dalla circolare

\- "oraInizio" deve essere estratta dalla circolare

\- "oraFine" deve essere estratta dalla circolare



L'evento deve essere presente anche se la circolare contiene un lungo Ordine del Giorno.



L'Ordine del Giorno NON sostituisce l'evento.



2B. CONTROLLO OBBLIGATORIO PRIMA DEL JSON FINALE



Prima di restituire il JSON controlla sempre:



1\. La circolare convoca una riunione?

2\. La circolare indica una data?

3\. La circolare indica un orario?



Se la risposta è sì, devi creare almeno un evento.



In particolare:



\- Se è convocato un Collegio dei Docenti e sono presenti data e orario → crea l'evento.

\- Se è convocato un Collegio di Plesso e sono presenti data e orario → crea l'evento.

\- Se sono convocati Dipartimenti e sono presenti data e orario → crea l'evento.

\- Se sono convocati Consigli di Classe e sono presenti data e orario → crea gli eventi relativi alle classi.

\- Se sono convocati GLO e sono presenti data e orario → crea l'evento.

\- Se sono previsti Colloqui e sono presenti data e orario → crea l'evento.



È VIETATO restituire "eventi":[] quando nel testo è chiaramente presente una riunione con data e orario.



3\. LETTURA DI TABELLE CON PIÙ COLONNE / SEDI — REGOLA CRITICA



Quando trovi una tabella con più colonne per sedi diverse

(esempio: Biscollai, Orosei, V. Toscana), devi trattare ogni colonna come indipendente.



PROCEDURA OBBLIGATORIA:



Passo 1: Identifica le colonne separate per sede.



Passo 2: Per OGNI riga, estrai TUTTE le celle da tutte le colonne.



\- NON saltare nessuna cella.

\- NON sovrapporre le classi tra colonne diverse.

\- Ogni colonna è indipendente dalle altre.



Passo 3: Per ogni cella, estrai:



\- Classe

\- Orario



Passo 4: Gli orari devono essere usati ESATTAMENTE come scritti.



NON inventare gli orari.



NON calcolare gli orari basandoti sulle classi precedenti.



NON assumere che gli orari siano consecutivi se la circolare non lo dice.



ATTENZIONE:



\- Ogni riga può contenere più eventi diversi.

\- NON sovrapporre gli orari tra colonne diverse.

\- LEGGI TUTTE le celle.

\- LEGGI anche le celle evidenziate o formattate diversamente.



4\. CAMPO "type" — CATEGORIE FISSE



Usa esclusivamente una delle seguenti categorie quando applicabile:



\- "Consigli di Classe"

\- "Collegio dei Docenti"

\- "Collegio di Plesso"

\- "Dipartimenti"

\- "GLO"

\- "Colloqui"



Non inventare nuove categorie se una delle categorie sopra è appropriata.



5\. CAMPO "title" — TITOLO COMPLETO



Il titolo deve identificare chiaramente l'evento.



Esempi corretti:



\- "Consiglio di Classe 1AOR"

\- "Consiglio di Classe 5AS"

\- "Collegio dei Docenti Plenario"

\- "Collegio dei Docenti"

\- "Collegio di Plesso"

\- "Dipartimenti disciplinari"

\- "GLO 3AS"

\- "Colloqui con le famiglie"



Non usare titoli generici come "Riunione", "Evento" o "Attività" quando il tipo di riunione è riconoscibile dal testo.



6\. NORMALIZZAZIONE CLASSI



Per IIS Pira, quando il contesto è Liceo Scientifico di Siniscola:



\- "1A LICEO SCIENTIFICO" → "1AS"

\- "1A LICEO SCIENTIFICO SINISCOLA" → "1AS"

\- "1A LICEO SINISCOLA" → "1AS"

\- "1^A LICEO SINISCOLA" → "1AS"

\- "1^A LICEO SCIENTIFICO SINISCOLA" → "1AS"



La stessa regola vale per tutte le classi da 1 a 5 e per A/B.



Esempio:

"2^B LICEO SINISCOLA" → "2BS"



Non eliminare eventi perché la forma della classe differisce dalla configurazione dell'utente.



7\. ASSOCIAZIONE SEDI



Quando possibile, associa automaticamente la sede:



\- Classi OR → "Sede Orosei"

\- Classi AS/BS → "Sede Biscollai"

\- IPSASR/SIA/MSB → "Via Toscana"



Per eventi generali come Collegio dei Docenti o Collegio di Plesso, NON inventare la sede.



Se la sede è indicata nella circolare, riportala.



Se la sede non è indicata, usa:



"sede": ""



8\. EVENTI SENZA CLASSE



Non tutti gli eventi devono avere una classe.



Per:



\- Collegio dei Docenti

\- Collegio di Plesso

\- Dipartimenti generali

\- altre riunioni generali



il campo "classe" deve essere "".



NON eliminare un evento solo perché "classe" è vuota.



9\. DATE



Tutte le date degli eventi devono essere nel formato:



DD/MM/YYYY



Non inventare date.



10\. ORARI



Gli orari devono essere nel formato:



HH:MM



Se la circolare indica un intervallo, usa esattamente l'intervallo indicato.



Se viene indicato soltanto un orario di inizio e NON è possibile determinare l'orario di fine dalla circolare, usa:



"oraFine": ""



NON inventare una durata.



11\. ORDINE DEL GIORNO



Tutti gli argomenti dell'Ordine del Giorno devono essere inseriti nell'array "ordineDelGiorno".



Ogni argomento deve essere un elemento separato dell'array.



L'Ordine del Giorno NON deve essere trasformato in eventi.



MA la riunione a cui si riferisce l'Ordine del Giorno deve comunque essere inserita in "eventi" se sono disponibili data e orario.



Se nel documento è presente una sezione "Ordine del Giorno", "ODG", "Ordine del giorno" o un elenco di punti da discutere, devi estrarre tutti i punti pertinenti.



12\. EVENTI MULTIPLI



Se una circolare contiene più riunioni con date/orari differenti, crea un evento separato per ciascuna riunione.



Se una circolare contiene un Collegio dei Docenti e successivamente Consigli di Classe, crea tutti gli eventi pertinenti.



Non limitarti al primo evento trovato.



13\. FILTRO DELLE CLASSI



${schoolContext}



IMPORTANTE:



Il filtro delle classi si applica agli eventi associati a una specifica classe.



NON eliminare gli eventi generali solo perché "classe" è vuota.



Per esempio:



{

  "title": "Collegio dei Docenti",

  "type": "Collegio dei Docenti",

  "classe": ""

}



deve rimanere un evento valido.



14\. CONTROLLO FINALE



Prima di restituire il JSON verifica attentamente:



\- numero della circolare

\- data della circolare

\- oggetto

\- destinatari

\- eventi

\- TUTTI gli eventi presenti nelle tabelle

\- date degli eventi

\- orari degli eventi

\- classi

\- normalizzazione delle classi

\- sedi

\- Ordine del Giorno



CONTROLLO SPECIALE:



Se nell'oggetto o nel testo compare una convocazione di:



"Collegio dei Docenti",

"Collegio dei Docenti Plenario",

"Collegio di Plesso",

"Dipartimenti",

"Consiglio di Classe",

"GLO",

"Colloqui"



e sono presenti data e orario della riunione, assicurati che esista almeno un elemento corrispondente nell'array "eventi".



NON restituire un array "eventi" vuoto in questo caso.



15\. FORMATO DELLA RISPOSTA



Restituisci ESCLUSIVAMENTE JSON valido.



NON usare markdown.



NON usare blocchi di codice.



NON aggiungere spiegazioni prima o dopo il JSON.



${schoolContext}

`,

      },

      {

        role: "user",

        content: `Analizza questa circolare:



${text}`,

      },

    ],



    response_format: {

      type: "json_object",

    },

  });



  const content =

    response.choices[0]?.message?.content || "{}";



  console.log("🤖 RAW AI JSON OUTPUT:", content);



  console.log(

    "🏫 Scuola identificata:",

    isChironi

      ? "Chironi-Satta"

      : isPira

        ? "Pira"

        : "Sconosciuta"

  );



  console.log(

    "📚 Classi configurate dall'utente:",

    userClasses

  );



  console.log(

    "📚 Classi rilevanti normalizzate:",

    relevantClasses

  );



  try {

    const parsed = JSON.parse(content);



    /*

     * Secondo livello di protezione:

     * normalizziamo gli eventi DOPO la risposta AI.

     */

    if (isPira) {
      parsed.eventi = normalizePiraEvents(Array.isArray(parsed.eventi) ? parsed.eventi : []);
      parsed.eventi = ensurePiraScheduleEvents(parsed.eventi, text);
      parsed.eventi = normalizePiraEvents(parsed.eventi);

      if (!Array.isArray(parsed.ordineDelGiorno) || parsed.ordineDelGiorno.length === 0) {
        const recoveredOrderOfDay = extractOrderOfDayFromText(text);
        if (recoveredOrderOfDay.length > 0) {
          parsed.ordineDelGiorno = recoveredOrderOfDay;
          console.log(
            `🛡️ Ordine del Giorno recuperato automaticamente: ${recoveredOrderOfDay.length} punti`
          );
        }
      }
    }



    /*

     * Log utile per verificare esattamente cosa arriva

     * al controller dopo la normalizzazione.

     */

    console.log(

      "✅ EVENTI DOPO NORMALIZZAZIONE:",

      JSON.stringify(parsed.eventi, null, 2)

    );



    console.log(

      "📋 ORDINE DEL GIORNO ESTRATTO:",

      JSON.stringify(

        parsed.ordineDelGiorno || [],

        null,

        2

      )

    );



    return parsed;

  } catch (error) {

    console.error(

      "❌ Errore parsing JSON:",

      error

    );



    return {

      circolare: {

        numero: "N/D",

        data: "N/D",

        oggetto: "Errore",

        destinatari: [],

      },

      eventi: [],

      ordineDelGiorno: [],

    };

  }

}