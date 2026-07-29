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
  
  if (isChironi && !isPira) {
    relevantClasses = userClasses.filter(c => c.toUpperCase().includes("OR"));
    schoolContext = "\n\n🏫 SCUOLA: CHIRONI-SATTA (Nuoro)\n" +
                   `CLASSI RILEVANTI: ${relevantClasses.join(', ')}\n` +
                   "ISTRUZIONE: Estrai SOLO eventi per queste classi OR. Ignora tutte le altre.";
  } else if (isPira && !isChironi) {
    relevantClasses = userClasses.filter(c => 
      c.toUpperCase().includes("AS") || 
      c.toUpperCase().includes("BS") || 
      c.toUpperCase().includes("IPSASR")
    );
    schoolContext = "\n\n🏫 SCUOLA: IIS PIRA (Liceo Scientifico Siniscola)\n" +
                   `CLASSI RILEVANTI: ${relevantClasses.join(', ')}\n` +
                   "ISTRUZIONE: Estrai SOLO eventi per queste classi. Ignora tutte le altre.";
  } else {
    schoolContext = "\n\n⚠️ SCUOLA NON IDENTIFICATA: estrai eventi per tutte le classi configurate.";
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

1. OGGETTO: Mai vuoto.

2. DISTINZIONE ODG/EVENTI:
   - OdG = argomenti (NON eventi)
   - Eventi = riunioni con data/ora
   - 7 punti OdG ≠ 7 eventi!

3. LETTURA TABELLE (REGOLA CRITICA):
   
   FORMATO TABELLA TIPICO:
   | | 15.00/15.45 | 15.45/16.30 | 16.30/17.15 | 17.15/18.00 | 18.00/18.45 | 18.45/19.30 |
   |---|---|---|---|---|---|---|
   | Venerdì 24/10/2025 | 2 OR | 1 OR | 3 OR | 4 OR | 5A OR | 5B OR |
   
   PROCEDURA OBBLIGATORIA:
   1. L'intestazione della PRIMA riga contiene gli orari (es. "15.00/15.45")
   2. La PRIMA colonna contiene le date (es. "Venerdì 24/10/2025")
   3. Per OGNI cella:
      - Data = dalla prima colonna della stessa riga
      - Orario = dall'intestazione della colonna (es. "15.00/15.45" → oraInizio: "15:00", oraFine: "15:45")
      - Classe = dal contenuto della cella (es. "2 OR" → "2AOR")
   
   ⚠️ ATTENZIONE ALL'ORDINE:
   - Leggi le colonne DA SINISTRA A DESTRA nell'ordine esatto in cui appaiono
   - NON riordinare le classi! Mantieni l'ordine originale della tabella
   - Esempio: se la tabella dice "15.00/15.45 = 2 OR", allora l'evento è 2AOR alle 15:00-15:45
   - NON invertire mai classe e orario!

4. NORMALIZZAZIONE CLASSI:
   - "1 OR" → "1AOR"
   - "2 OR" → "2AOR"
   - "3 OR" → "3AOR"
   - "4 OR" → "4AOR"
   - "5A OR" → "5AOR"
   - "5B OR" → "5BOR"

5. ASSOCIAZIONE SEDI:
   - Classi OR → "Sede Orosei"
   - Classi AS/BS → "Sede Biscollai"
   - IPSASR/ETU/RIMS → "Via Toscana"

6. ${schoolContext}

7. JSON valido, niente markdown.
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