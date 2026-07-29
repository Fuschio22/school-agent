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
      "title": "string (TITOLO COMPLETO E CHIARO)",
      "type": "string (CATEGORIA FISSA - vedi lista sotto)",
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

3. CAMPO "type" - CATEGORIE FISSE OBBLIGATORIE:
   Il campo "type" DEVE essere UNA DI QUESTE CATEGORIE ESATTE (non inventare altre categorie!):
   - "Consigli di Classe"
   - "Collegio dei Docenti"
   - "Collegio di Plesso"
   - "Dipartimenti"
   - "GLO"
   - "Colloqui"
   
   ❌ SBAGLIATO: "per area disciplinare", "plenario", "dipartimenti disciplinari"
   ✅ CORRETTO: "Dipartimenti", "Collegio dei Docenti", "Collegio di Plesso"
   
   Il campo "type" serve per il badge colorato nel calendario. Deve essere UNA SOLA PAROLA CATEGORIA.

4. CAMPO "title" - TITOLO COMPLETO:
   - Il titolo deve essere descrittivo e completo:
     ✅ "Dipartimenti disciplinari ITC Chironi-Satta"
     ✅ "Collegio dei Docenti plenario"
     ✅ "Consiglio di Classe 1AOR"
     ❌ "per area disciplinare" (troppo generico)
     ❌ "plenario" (troncato)

5. LETTURA LISTE DI EVENTI:
   - Quando vedi una lista con orari diversi, crea UN EVENTO PER OGNI RIGA

6. FILTRO EVENTI DA ESCLUDERE:
   - ESCLUDI eventi che contengono: "sostegno", "inclusione"

7. TITOLI EVENTI - AGGIUNGI ISTITUTO SE NECESSARIO:
   - Se il titolo è troppo generico, aggiungi il nome dell'istituto

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
  console.log(" Scuola identificata:", isChironi ? "Chironi-Satta" : isPira ? "Pira" : "Sconosciuta");
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