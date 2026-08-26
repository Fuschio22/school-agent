import OpenAI from "openai";

export async function analyzeCircularText(text: string, userClasses: string[] = []) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const isChironi =
    text.toUpperCase().includes("CHIRONI") ||
    text.toUpperCase().includes("NUTD110002") ||
    text.toUpperCase().includes("NUORO");

  const isPira =
    text.toUpperCase().includes("PIRA") ||
    text.toUpperCase().includes("SINISCOLA") ||
    text.toUpperCase().includes("LICEO SCIENTIFICO");

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
    relevantClasses = userClasses.filter(
      (c) =>
        c.toUpperCase().includes("AS") ||
        c.toUpperCase().includes("BS") ||
        c.toUpperCase().includes("IPSASR")
    );

    schoolContext =
      "\n\n🏫 SCUOLA: IIS PIRA (Liceo Scientifico Siniscola)\n" +
      `CLASSI RILEVANTI: ${relevantClasses.join(", ")}\n` +
      "ISTRUZIONE: Estrai SOLO eventi per queste classi. Ignora tutte le altre.";

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

1. OGGETTO

- Il campo "oggetto" NON deve MAI essere vuoto.
- Usa l'oggetto della circolare quando disponibile.
- Se l'oggetto non è esplicitamente indicato, ricavalo dal contenuto della circolare.

2. DISTINZIONE ODG / EVENTI

- "ordineDelGiorno" contiene gli ARGOMENTI da discutere.
- Gli argomenti dell'Ordine del Giorno NON sono eventi.
- "eventi" contiene invece le RIUNIONI, CONVOCAZIONI o ATTIVITÀ che hanno una data e un orario.
- Una riunione deve essere inserita in "eventi" anche se non è associata ad alcuna classe.

2A. EVENTO PRINCIPALE DELLA CIRCOLARE — REGOLA OBBLIGATORIA

Se la circolare riguarda la convocazione di una riunione o di un'attività scolastica con data e orario, devi creare l'evento corrispondente.

Questa regola vale in particolare per:

- Collegio dei Docenti
- Collegio dei Docenti Plenario
- Collegio di Plesso
- Dipartimenti
- Consigli di Classe
- GLO
- Colloqui
- altre riunioni scolastiche chiaramente convocate

IMPORTANTE:

Se la circolare contiene una convocazione con data e orario, NON puoi restituire:

"eventi": []

solo perché la riunione non è associata a una classe.

Per gli eventi generali:

- "classe" deve essere ""
- "type" deve indicare la categoria corretta
- "title" deve descrivere chiaramente la riunione
- "sede" deve essere estratta dalla circolare
- "data" deve essere estratta dalla circolare
- "oraInizio" deve essere estratta dalla circolare
- "oraFine" deve essere estratta dalla circolare

ESEMPIO:

Se l'oggetto della circolare è:

"Convocazione Collegio dei Docenti Plenario e presa di servizio A.S. 2026/2027"

e nel testo della circolare è indicata una data e un'ora per il Collegio dei Docenti, devi creare un evento come:

{
  "title": "Collegio dei Docenti Plenario",
  "type": "Collegio dei Docenti",
  "sede": "sede indicata nella circolare",
  "data": "DD/MM/YYYY",
  "oraInizio": "HH:MM",
  "oraFine": "HH:MM",
  "classe": ""
}

L'evento deve essere presente anche se la circolare contiene un lungo Ordine del Giorno.

L'Ordine del Giorno NON sostituisce l'evento.

2B. CONTROLLO OBBLIGATORIO PRIMA DEL JSON FINALE

Prima di restituire il JSON controlla sempre:

1. La circolare convoca una riunione?
2. La circolare indica una data?
3. La circolare indica un orario?

Se la risposta è sì, devi creare almeno un evento.

In particolare:

- Se è convocato un Collegio dei Docenti e sono presenti data e orario → crea l'evento.
- Se è convocato un Collegio di Plesso e sono presenti data e orario → crea l'evento.
- Se sono convocati Dipartimenti e sono presenti data e orario → crea l'evento.
- Se sono convocati Consigli di Classe e sono presenti data e orario → crea gli eventi relativi alle classi.
- Se sono convocati GLO e sono presenti data e orario → crea l'evento.
- Se sono previsti Colloqui e sono presenti data e orario → crea l'evento.

È VIETATO restituire "eventi":[] quando nel testo è chiaramente presente una riunione con data e orario.

3. LETTURA DI TABELLE CON PIÙ COLONNE / SEDI — REGOLA CRITICA

Quando trovi una tabella con più colonne per sedi diverse
(esempio: Biscollai, Orosei, V. Toscana), devi trattare ogni colonna come indipendente.

ESEMPIO:

| Biscollai | Orosei | V. Toscana |
|-----------|--------|------------|
| 5E  14.45/15.15 | 5A OR  14.45/15.15 | 5SIA  15.00/15.30 |
| 4E  15.15/15.45 | 4 OR  15.15/15.45 | 4SIA  15.30/16.00 |

PROCEDURA OBBLIGATORIA:

Passo 1: Identifica le tre colonne separate per sede.

- Colonna 1: Biscollai (classi AS/BS/ETU)
- Colonna 2: Orosei (classi OR)
- Colonna 3: V. Toscana (classi IPSASR/SIA/MSB)

Passo 2: Per OGNI riga, estrai TUTTE le celle da tutte le colonne.

- NON saltare nessuna cella.
- NON sovrapporre le classi tra colonne diverse.
- Ogni colonna è indipendente dalle altre.

Passo 3: Per ogni cella, estrai:

- Classe: il testo a sinistra.
- Orario: il testo a destra.

Esempi:

"5A OR 14.45/15.15"

→ classe: "5A OR"
→ oraInizio: "14:45"
→ oraFine: "15:15"

"1 OR 17.00/17.45"

→ classe: "1 OR"
→ oraInizio: "17:00"
→ oraFine: "17:45"

Passo 4: Gli orari devono essere usati ESATTAMENTE come scritti.

NON inventare gli orari.

NON calcolare gli orari basandoti sulle classi precedenti.

NON assumere che gli orari siano consecutivi se la circolare non lo dice.

⚠️ ATTENZIONE:

- Ogni riga può contenere FINO A 3 eventi diversi.
- NON sovrapporre gli orari tra colonne diverse.
- LEGGI TUTTE le celle.
- LEGGI anche le celle evidenziate o formattate diversamente.

4. CAMPO "type" — CATEGORIE FISSE

Usa esclusivamente una delle seguenti categorie quando applicabile:

- "Consigli di Classe"
- "Collegio dei Docenti"
- "Collegio di Plesso"
- "Dipartimenti"
- "GLO"
- "Colloqui"

Non inventare nuove categorie se una delle categorie sopra è appropriata.

5. CAMPO "title" — TITOLO COMPLETO

Il titolo deve identificare chiaramente l'evento.

Esempi corretti:

- "Consiglio di Classe 1AOR"
- "Consiglio di Classe 5AS"
- "Collegio dei Docenti Plenario"
- "Collegio dei Docenti"
- "Collegio di Plesso"
- "Dipartimenti disciplinari"
- "Dipartimenti disciplinari ITC Chironi-Satta"
- "GLO 3AS"
- "Colloqui con le famiglie"

Non usare titoli generici come:

- "Riunione"
- "Evento"
- "Attività"

quando il tipo di riunione è riconoscibile dal testo.

6. NORMALIZZAZIONE CLASSI

Normalizza le classi OR nel seguente modo:

- "1 OR" → "1AOR"
- "2 OR" → "2AOR"
- "3 OR" → "3AOR"
- "4 OR" → "4AOR"
- "5A OR" → "5AOR"
- "5B OR" → "5BOR"

Mantieni le altre classi nel formato corretto indicato dalla circolare.

7. ASSOCIAZIONE SEDI

Quando possibile, associa automaticamente la sede:

- Classi OR → "Sede Orosei"
- Classi AS/BS → "Sede Biscollai"
- IPSASR/SIA/MSB → "Via Toscana"

Per eventi generali come Collegio dei Docenti o Collegio di Plesso, NON inventare la sede.

Se la sede è indicata nella circolare, riportala.

Se la sede non è indicata, usa:

"sede": ""

8. EVENTI SENZA CLASSE

Non tutti gli eventi devono avere una classe.

Per:

- Collegio dei Docenti
- Collegio di Plesso
- Dipartimenti generali
- altre riunioni generali

il campo:

"classe": ""

è corretto e obbligatorio.

NON eliminare un evento solo perché "classe" è vuota.

9. DATE

Tutte le date degli eventi devono essere nel formato:

DD/MM/YYYY

Esempio:

"01/09/2026"

Se la circolare utilizza una data testuale come:

"martedì 1° settembre 2026"

deve essere convertita in:

"01/09/2026"

Non inventare date.

10. ORARI

Gli orari devono essere nel formato:

HH:MM

Esempio:

"10:30"

Se la circolare indica un intervallo:

"10.30 - 11.30"

restituisci:

"oraInizio": "10:30",
"oraFine": "11:30"

Se viene indicato soltanto un orario di inizio e NON è possibile determinare l'orario di fine dalla circolare, NON inventare una durata.

In quel caso usa:

"oraFine": ""

11. ORDINE DEL GIORNO

Tutti gli argomenti dell'Ordine del Giorno devono essere inseriti nell'array:

"ordineDelGiorno"

Ogni argomento deve essere un elemento separato dell'array.

L'Ordine del Giorno NON deve essere trasformato in eventi.

MA la riunione a cui si riferisce l'Ordine del Giorno deve comunque essere inserita in "eventi" se sono disponibili data e orario.

12. EVENTI MULTIPLI

Se una circolare contiene più riunioni con date/orari differenti, crea un evento separato per ciascuna riunione.

Se una circolare contiene:

- un Collegio dei Docenti
- e successivamente Consigli di Classe

crea tutti gli eventi pertinenti.

Non limitarti al primo evento trovato.

13. FILTRO DELLE CLASSI

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

14. CONTROLLO FINALE

Prima di restituire il JSON verifica attentamente:

- numero della circolare
- data della circolare
- oggetto
- destinatari
- eventi
- date degli eventi
- orari degli eventi
- classi
- sedi
- Ordine del Giorno

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

15. FORMATO DELLA RISPOSTA

Restituisci ESCLUSIVAMENTE JSON valido.

NON usare markdown.

NON usare blocchi di codice.

NON aggiungere spiegazioni prima o dopo il JSON.

${schoolContext}
`,
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