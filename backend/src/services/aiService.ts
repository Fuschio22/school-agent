import OpenAI from "openai";

export async function analyzeCircularText(text: string, userClasses: string[] = []) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", 
  });

  const isChironi = text.toUpperCase().includes("CHIRONI") || 
                    text.toUpperCase().includes("NUTD110002") ||
                    text.toUpperCase().includes("NUORO");
  
  const isPira = text.toUpperCase().includes("PIRA") || 
                 text.toUpperCase().includes("SINISCOLA") ||
                 text.toUpperCase().includes("LICEO SCIENTIFICO");

  let relevantClasses = userClasses;
  let schoolContext = "";
  let schoolName = "";
  
  if (isChironi && !isPira) {
    relevantClasses = userClasses.filter(c => c.toUpperCase().includes("OR"));
    schoolContext = "\n\n🏫 SCUOLA: CHIRONI-SATTA (Nuoro)\n" +
                   `CLASSI RILEVANTI: ${relevantClasses.join(', ')}\n` +
                   "ISTRUZIONE: Estrai SOLO eventi per queste classi OR. Ignora tutte le altre.";
    schoolName = "ITC Chironi-Satta";
  } else if (isPira && !isChironi) {
    relevantClasses = userClasses.filter(c => 
      c.toUpperCase().includes("AS") || 
      c.toUpperCase().includes("BS") || 
      c.toUpperCase().includes("IPSASR")
    );
    schoolContext = "\n\n🏫 SCUOLA: IIS PIRA (Liceo Scientifico Siniscola)\n" +
                   `CLASSI RILEVANTI: ${relevantClasses.join(', ')}\n` +
                   "ISTRUZIONE: Estrai SOLO eventi per queste classi. Ignora tutte le altre.";
    schoolName = "IIS Pira";
  } else {
    schoolContext = "\n\n⚠️ SCUOLA NON IDENTIFICATA: estrai eventi per tutte le classi configurate.";
    schoolName = "Istituto";
  }

  const response = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
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
      "title": "string (TITOLO COMPLETO E CHIARO, non troncare!)",
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

1. OGGETTO: Mai vuoto.

2. DISTINZIONE ODG/EVENTI:
   - OdG = argomenti (NON eventi)
   - Eventi = riunioni con data/ora

3. TITOLI DEGLI EVENTI (REGOLA CRITICA):
   - I titoli DEVONO essere COMPLETI e CHIARI, non frammenti!
   - ❌ SBAGLIATO: "plenario", "per area disciplinare", "dipartimenti"
   - ✅ CORRETTO: "Collegio dei Docenti plenario", "Dipartimenti disciplinari per area disciplinare", "Dipartimenti disciplinari"
   
   - Costruisci il titolo così:
     * TIPO EVENTO + DETTAGLIO (se presente nel testo)
     * Esempi:
       - "Collegio dei Docenti plenario" (non solo "plenario")
       - "Dipartimenti disciplinari per area disciplinare" (non solo "per area disciplinare")
       - "Collegio dei Docenti di Plesso IPSASR" (non solo "IPSASR")
       - "Consiglio di Classe 1AOR" (non solo "1AOR")
   
   - Se il testo dice "Collegio dei Docenti in seduta plenaria", il titolo deve essere "Collegio dei Docenti plenario"
   - Se il testo dice "Dipartimenti disciplinari per area disciplinare", il titolo deve essere "Dipartimenti disciplinari per area disciplinare"
   - NON troncare mai il titolo a una sola parola generica!

4. LETTURA LISTE DI EVENTI:
   - Quando vedi una lista con orari diversi, crea UN EVENTO PER OGNI RIGA:
     "9.30 – 11.00 Dipartimento per l'inclusione (sostegno)"
     "10.00 – 12.30 Dipartimenti disciplinari"
     → Crea DUE eventi separati

5. FILTRO EVENTI DA ESCLUDERE:
   - ESCLUDI eventi che contengono: "sostegno", "inclusione" (a meno che non siano esplicitamente per le classi configurate)

6. TITOLI EVENTI - AGGIUNGI ISTITUTO SE NECESSARIO:
   - Se il titolo è troppo generico, aggiungi il nome dell'istituto:
     * "Dipartimenti disciplinari" → "Dipartimenti disciplinari ITC Chironi-Satta"

7. TIPOLOGIA EVENTI:
   - "Collegio dei Docenti" → plenario
   - "Collegio di Plesso" → separato per sede
   - "Dipartimenti" → per area disciplinare

8. NORMALIZZAZIONE CLASSI:
   - "1 OR" → "1AOR"
   - "5A OR" → "5AOR"

9. ASSOCIAZIONE SEDI:
   - Classi OR → "Sede Orosei"
   - Classi AS/BS → "Sede Biscollai"
   - IPSASR → "Via Toscana"

10. ${schoolContext}

11. JSON valido, niente markdown.
`
      },
      {
        role: "user",
        content: `Analizza questa circolare:\n\n${text}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log("🤖 RAW AI JSON OUTPUT:", content);
  console.log("🏫 Scuola identificata:", isChironi ? "Chironi-Satta" : isPira ? "Pira" : "Sconosciuta");
  console.log("📚 Classi rilevanti:", relevantClasses);
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Errore parsing JSON:", error);
    return {
      circolare: { numero: "N/D", data: "N/D", oggetto: "Errore", destinatari: [] },
      eventi: [],
      ordineDelGiorno: []
    };
  }
}