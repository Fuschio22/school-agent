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

1. OGGETTO: Mai vuoto.

2. DISTINZIONE ODG/EVENTI:
   - OdG = argomenti (NON eventi)
   - Eventi = riunioni con data/ora

3. LETTURA TABELLE CON PIÙ COLONNE/SEDI (REGOLA CRITICA):
   
   Quando trovi una tabella con più colonne per sedi diverse (es: Biscollai, Orosei, V. Toscana):
   
   ESEMPIO DI TABELLA:
   | Biscollai | Orosei | V. Toscana |
   |-----------|--------|------------|
   | 5E  14.45/15.15 | 5A OR  14.45/15.15 | 5SIA  15.00/15.30 |
   | 4E  15.15/15.45 | 4 OR  15.15/15.45 | 4SIA  15.30/16.00 |
   
   PROCEDURA OBBLIGATORIA:
   
   Passo 1: Identifica le tre colonne separate per sede
   - Colonna 1: Biscollai (classi AS/BS/ETU)
   - Colonna 2: Orosei (classi OR)
   - Colonna 3: V. Toscana (classi IPSASR/SIA/MSB)
   
   Passo 2: Per OGNI riga, estrai TUTTE le celle da tutte le colonne
   - NON saltare nessuna cella!
   - NON sovrapporre le classi tra colonne diverse!
   - Ogni colonna è indipendente dalle altre
   
   Passo 3: Per ogni cella, estrai:
   - Classe: il testo a sinistra (es: "5A OR", "1 OR", "4 OR")
   - Orario: il testo a destra (es: "14.45/15.15", "17.00/17.45")
   
   Passo 4: Gli orari vanno usati ESATTAMENTE come scritti, NON inventarli!
   - Se la tabella dice "1 OR  17.00/17.45" → oraInizio: "17:00", oraFine: "17:45"
   - Se la tabella dice "5A OR  14.45/15.15" → oraInizio: "14:45", oraFine: "15:15"
   - NON calcolare orari basandoti sulle classi precedenti!
   
   ⚠️ ATTENZIONE:
   - Ogni riga può contenere FINO A 3 eventi diversi (uno per colonna)
   - NON sovrapporre gli orari tra colonne diverse
   - LEGGI TUTTE le celle, anche quelle evidenziate in rosso!

4. CAMPO "type" - CATEGORIE FISSE:
   - "Consigli di Classe"
   - "Collegio dei Docenti"
   - "Collegio di Plesso"
   - "Dipartimenti"
   - "GLO"
   - "Colloqui"

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
   - IPSASR/SIA/MSB → "Via Toscana"

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