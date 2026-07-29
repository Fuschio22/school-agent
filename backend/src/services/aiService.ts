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
    schoolContext = "\n\n SCUOLA: CHIRONI-SATTA (Nuoro)\n" +
                   `CLASSI RILEVANTI: ${relevantClasses.join(', ')}\n` +
                   "ISTRUZIONE: Estrai SOLO eventi per queste classi OR. Ignora tutte le altre.";
    schoolName = "ITC Chironi-Satta";
  } else if (isPira && !isChironi) {
    relevantClasses = userClasses.filter(c => 
      c.toUpperCase().includes("AS") || 
      c.toUpperCase().includes("BS") || 
      c.toUpperCase().includes("IPSASR")
    );
    schoolContext = "\n\n SCUOLA: IIS PIRA (Liceo Scientifico Siniscola)\n" +
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

3. LETTURA TABELLE (REGOLA CRITICA - LEGGI ATTENTAMENTE):
   
   Quando trovi una tabella con questo formato:
   
   | | 15.00/15.45 | 15.45/16.30 | 16.30/17.15 | 17.15/18.00 | 18.00/18.45 | 18.45/19.30 |
   |---|---|---|---|---|---|---|
   | Venerdì 24/10/2025 | 2 OR | 1 OR | 3 OR | 4 OR | 5A OR | 5B OR |
   
   PROCEDURA OBBLIGATORIA:
   
   Passo 1: Identifica le intestazioni delle colonne (prima riga)
   - Colonna 1: "15.00/15.45" → oraInizio: "15:00", oraFine: "15:45"
   - Colonna 2: "15.45/16.30" → oraInizio: "15:45", oraFine: "16:30"
   - Colonna 3: "16.30/17.15" → oraInizio: "16:30", oraFine: "17:15"
   - Colonna 4: "17.15/18.00" → oraInizio: "17:15", oraFine: "18:00"
   - Colonna 5: "18.00/18.45" → oraInizio: "18:00", oraFine: "18:45"
   - Colonna 6: "18.45/19.30" → oraInizio: "18:45", oraFine: "19:30"
   
   Passo 2: Per ogni cella della tabella, associa l'orario della colonna alla classe
   - Cella "2 OR" sotto colonna "15.00/15.45" → classe: "2AOR", orario: 15:00-15:45
   - Cella "1 OR" sotto colonna "15.45/16.30" → classe: "1AOR", orario: 15:45-16:30
   - Cella "3 OR" sotto colonna "16.30/17.15" → classe: "3AOR", orario: 16:30-17:15
   - Cella "4 OR" sotto colonna "17.15/18.00" → classe: "4AOR", orario: 17:15-18:00
   - Cella "5A OR" sotto colonna "18.00/18.45" → classe: "5AOR", orario: 18:00-18:45
   - Cella "5B OR" sotto colonna "18.45/19.30" → classe: "5BOR", orario: 18:45-19:30
   
   ⚠️ NON ASSEGNARE LO STESSO ORARIO A TUTTE LE CLASSI! Ogni classe ha il suo orario specifico dalla colonna!
   
   Passo 3: La data viene dalla prima colonna della riga (es. "Venerdì 24/10/2025" → data: "24/10/2025")

4. CAMPO "type" - CATEGORIE FISSE:
   - "Consigli di Classe"
   - "Collegio dei Docenti"
   - "Collegio di Plesso"
   - "Dipartimenti"
   - "GLO"
   - "Colloqui"
   
   ❌ NON usare mai "Riunione"!

5. CAMPO "title" - TITOLO COMPLETO:
   - ✅ "Consiglio di Classe 1AOR"
   - ✅ "Dipartimenti disciplinari ITC Chironi-Satta"

6. NORMALIZZAZIONE CLASSI:
   - "1 OR" → "1AOR"
   - "2 OR" → "2AOR"
   - "3 OR" → "3AOR"
   - "4 OR" → "4AOR"
   - "5A OR" → "5AOR"
   - "5B OR" → "5BOR"

7. ASSOCIAZIONE SEDI:
   - Classi OR → "Sede Orosei"
   - Classi AS/BS → "Sede Biscollai"
   - IPSASR → "Via Toscana"

8. ${schoolContext}

9. JSON valido, niente markdown.
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
  console.log(" RAW AI JSON OUTPUT:", content);
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