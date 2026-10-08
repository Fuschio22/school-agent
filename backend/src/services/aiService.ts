import OpenAI from "openai";

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
      "ISTRUZIONE: estrai gli eventi delle classi OR pertinenti alla scuola. " +
      "Non eliminare eventi generali come Collegi, Dipartimenti o altre riunioni senza classe.";

    schoolName = "ITC Chironi-Satta";
  } else if (isPira && !isChironi) {
    /*
     * Per il Pira utilizziamo tutte le classi effettivamente configurate
     * dall'utente che possono appartenere alla scuola.
     *
     * IMPORTANTE:
     * il Liceo Scientifico di Siniscola può essere scritto nella circolare
     * in molti modi diversi:
     *
     * 1^A LICEO SINISCOLA
     * 1^A LICEO SCIENTIFICO SINISCOLA
     * 1A LICEO SINISCOLA
     * 1AS
     * 1A Liceo Scientifico
     *
     * Le classi 1AS-5AS e 1BS-5BS sono quindi esplicitamente incluse.
     */

    relevantClasses = userClasses.filter((c) => {
      const normalized = c
        .toUpperCase()
        .replace(/\s+/g, " ")
        .trim();

      return (
        normalized.includes("AS") ||
        normalized.includes("BS") ||
        normalized.includes("IPSASR") ||
        normalized.includes("LICEO SCIENTIFICO") ||
        normalized.includes("LICEO SINISCOLA")
      );
    });

    schoolContext =
      "\n\n🏫 SCUOLA: IIS PIRA - SINISCOLA\n" +
      `CLASSI CONFIGURATE DALL'UTENTE: ${relevantClasses.join(", ")}\n\n` +
      "IMPORTANTE: la circolare può utilizzare denominazioni diverse " +
      "da quelle presenti nelle impostazioni dell'utente.\n\n" +
      "Per il LICEO SCIENTIFICO DI SINISCOLA devi riconoscere come equivalenti:\n" +
      "- 1^A LICEO SINISCOLA = 1AS\n" +
      "- 1^B LICEO SINISCOLA = 1BS\n" +
      "- 2^A LICEO SINISCOLA = 2AS\n" +
      "- 2^B LICEO SINISCOLA = 2BS\n" +
      "- 3^A LICEO SINISCOLA = 3AS\n" +
      "- 3^B LICEO SINISCOLA = 3BS\n" +
      "- 4^A LICEO SINISCOLA = 4AS\n" +
      "- 4^B LICEO SINISCOLA = 4BS\n" +
      "- 5^A LICEO SINISCOLA = 5AS\n" +
      "- 5^B LICEO SINISCOLA = 5BS\n\n" +
      "Sono equivalenti anche forme come '1A LICEO SCIENTIFICO', " +
      "'1A LICEO SCIENTIFICO SINISCOLA' e '1A LICEO SINISCOLA'.\n\n" +
      "REGOLA FONDAMENTALE: se nel testo della circolare trovi una tabella " +
      "con i Consigli di Classe del Liceo Scientifico di Siniscola, " +
      "DEVI estrarre TUTTI gli eventi delle classi 1A, 1B, 2A, 2B, " +
      "3A, 3B, 4A, 4B, 5A e 5B presenti nella tabella.\n\n" +
      "Non fermarti ai primi eventi trovati e non limitarti alle classi IPSASR.\n" +
      "La presenza di IPSASR non deve impedire l'estrazione degli eventi del Liceo.\n\n" +
      "Per le classi estratte usa nel campo 'classe' il codice della classe " +
      "quando è chiaramente riconoscibile, preferibilmente nella forma " +
      "1AS, 1BS, 2AS, 2BS, 3AS, 3BS, 4AS, 4BS, 5AS, 5BS.\n\n" +
      "Le classi IPSASR devono invece essere mantenute come 4A IPSASR, " +
      "5A IPSASR, ecc.\n\n" +
      "Non eliminare eventi generali come Collegi, Dipartimenti o altre " +
      "riunioni senza classe.";

    schoolName = "IIS Pira";
  } else {
    schoolContext =
      "\n\n⚠️ SCUOLA NON IDENTIFICATA: estrai gli eventi per tutte le classi configurate.";

    schoolName = "Istituto";
  }

  const systemPrompt = `Sei SchoolAgent, un esperto nell'analisi di circolari scolastiche italiane.

Il tuo compito è leggere attentamente una circolare scolastica e restituire UN SOLO oggetto JSON valido.

STRUTTURA JSON OBBLIGATORIA:

{
  "circolare": {
    "numero": "string",
    "data": "string",
    "oggetto": "string",
    "destinatari": []
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
  "ordineDelGiorno": []
}

REGOLE FONDAMENTALI

1. OGGETTO

Il campo "oggetto" non deve mai essere vuoto.
Usa l'oggetto della circolare quando disponibile.
Se non è esplicitamente indicato, ricavalo dal contenuto.

2. EVENTI

"eventi" contiene riunioni, convocazioni o attività con data e orario.

"ordineDelGiorno" contiene esclusivamente gli argomenti da discutere.

Gli argomenti dell'Ordine del Giorno NON sono eventi.

Se una circolare contiene una convocazione con data e orario, devi creare almeno un evento.

3. CONSIGLI DI CLASSE

Se la circolare riguarda Consigli di Classe e contiene una tabella con più classi:

- leggi TUTTE le righe;
- leggi TUTTE le colonne;
- estrai TUTTE le classi;
- estrai TUTTI gli orari;
- crea un evento separato per ogni classe.

NON fermarti al primo evento.
NON fermarti alla prima sede.
NON fermarti alle sole classi IPSASR.

4. TABELLE CON PIÙ SEDI

Quando trovi una tabella con più colonne relative a sedi diverse, ogni colonna è indipendente.

Per ogni riga devi leggere tutte le celle.

NON saltare celle.
NON sovrapporre gli orari tra colonne.
NON assumere che una colonna continui automaticamente nell'altra.

5. ORARI

Usa gli orari esattamente come indicati nella circolare.

Converti:

10.30 - 11.30

in:

"oraInizio": "10:30",
"oraFine": "11:30"

Non inventare orari.

Se manca l'orario di fine:

"oraFine": ""

6. DATE

Tutte le date degli eventi devono essere nel formato DD/MM/YYYY.

Esempio:

"08/10/2026"

7. CATEGORIE EVENTI

Quando applicabile usa esclusivamente:

- "Consigli di Classe"
- "Collegio dei Docenti"
- "Collegio di Plesso"
- "Dipartimenti"
- "GLO"
- "Colloqui"

8. TITOLO

Per i Consigli di Classe usa titoli chiari come:

"Consiglio di Classe 1AS"
"Consiglio di Classe 2BS"
"Consiglio di Classe 4A IPSASR"

Per eventi generali usa titoli descrittivi.

9. CLASSI DEL LICEO SCIENTIFICO DI SINISCOLA

ATTENZIONE: il nome della classe può cambiare nella circolare.

Considera equivalenti:

"1^A LICEO SINISCOLA" → "1AS"
"1^B LICEO SINISCOLA" → "1BS"
"2^A LICEO SINISCOLA" → "2AS"
"2^B LICEO SINISCOLA" → "2BS"
"3^A LICEO SINISCOLA" → "3AS"
"3^B LICEO SINISCOLA" → "3BS"
"4^A LICEO SINISCOLA" → "4AS"
"4^B LICEO SINISCOLA" → "4BS"
"5^A LICEO SINISCOLA" → "5AS"
"5^B LICEO SINISCOLA" → "5BS"

Considera equivalenti anche:

"1A LICEO SCIENTIFICO"
"1A LICEO SCIENTIFICO SINISCOLA"
"1A LICEO SINISCOLA"

e le corrispondenti classi dalla 1A alla 5B.

Quando riconosci una di queste classi, nel campo "classe" usa il codice normalizzato:

1AS, 1BS, 2AS, 2BS, 3AS, 3BS, 4AS, 4BS, 5AS, 5BS.

10. IPSASR

Mantieni le classi IPSASR nella forma presente nella circolare, ad esempio:

"4A IPSASR"
"5A IPSASR"

11. EVENTI GENERALI

Per Collegio dei Docenti, Collegio di Plesso, Dipartimenti o altre riunioni generali:

"classe": ""

Non eliminare l'evento solo perché non ha una classe.

12. EVENTI MULTIPLI

Una circolare può contenere molti eventi.

Devi estrarre TUTTI gli eventi pertinenti.

Non limitarti ai primi eventi trovati.

13. CONTROLLO FINALE

Prima di restituire il JSON controlla:

- numero circolare
- data circolare
- oggetto
- destinatari
- tutti gli eventi
- tutte le date
- tutti gli orari
- tutte le classi
- tutte le sedi
- Ordine del Giorno

Se trovi una tabella di Consigli di Classe del Liceo Scientifico di Siniscola, verifica esplicitamente di avere considerato tutte le classi presenti nella tabella.

14. FORMATO

Restituisci ESCLUSIVAMENTE JSON valido.

Non usare Markdown.
Non usare blocchi di codice.
Non aggiungere spiegazioni prima o dopo il JSON.

${schoolContext}`;

  const response = await openai.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Analizza questa circolare:\n\n${text}`,
      },
    ],
    response_format: {
      type: "json_object",
    },
  });

  const content = response.choices[0]?.message?.content || "{}";

  console.log("🤖 RAW AI JSON OUTPUT:", content);
  console.log(
    "🏫 Scuola identificata:",
    isChironi ? "Chironi-Satta" : isPira ? "Pira" : "Sconosciuta"
  );
  console.log("📚 Classi rilevanti:", relevantClasses);

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Errore parsing JSON:", error);

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