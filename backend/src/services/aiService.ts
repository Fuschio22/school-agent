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

3. GESTIONE ORARI (REGOLA CRITICA):
   - Se la circolare specifica ENTRAMBI gli orari (inizio E fine), usali ESATTAMENTE come scritti
   - Se la circolare specifica SOLO l'ora di inizio, AGGIUNGI la durata standard:
     * Collegio dei Docenti → aggiungi 1h30m (es: 10:30 → 12:00)
     * Consiglio di Classe → aggiungi 1h30m (es: 15:00 → 16:30)
     * Collegio di Plesso → aggiungi 1h (es: 10:00 → 11:00)
     * Dipartimenti → aggiungi 1h (es: 10:00 → 11:00)
     * GLO → aggiungi 1h (es: 15:00 → 16:00)
   
   - ESEMPIO CORRETTO:
     * Testo: "alle h.10.30" (solo inizio)
     * Tipo: "Collegio dei Docenti"
     * Risultato: oraInizio: "10:30", oraFine: "12:00" (NON "16:00"!)
   
   - VERIFICA SEMPRE: oraFine deve essere circa 1-1.5 ore dopo oraInizio, NON 5-6 ore dopo!

4. CAMPO "type" - CATEGORIE FISSE:
   Il campo "type" DEVE essere UNA DI QUESTE CATEGORIE ESATTE:
   - "Consigli di Classe"
   - "Collegio dei Docenti"
   - "Collegio di Plesso"
   - "Dipartimenti"
   - "GLO"
   - "Colloqui"
   
   ❌ SBAGLIATO: "per area disciplinare", "plenario", "dipartimenti disciplinari"
   ✅ CORRETTO: "Dipartimenti", "Collegio dei Docenti", "Collegio di Plesso"

5. CAMPO "title" - TITOLO COMPLETO:
   - Il titolo deve essere descrittivo e completo:
     ✅ "Dipartimenti disciplinari ITC Chironi-Satta"
     ✅ "Collegio dei Docenti plenario"
     ✅ "Consiglio di Classe 1AOR"
     ❌ "per area disciplinare" (troppo generico)
     ❌ "plenario" (troncato)

6. LETTURA LISTE DI EVENTI:
   - Quando vedi una lista con orari diversi, crea UN EVENTO PER OGNI RIGA

7. FILTRO EVENTI DA ESCLUDERE:
   - ESCLUDI eventi che contengono: "sostegno", "inclusione"

8. TITOLI EVENTI - AGGIUNGI ISTITUTO SE NECESSARIO:
   - Se il titolo è troppo generico, aggiungi il nome dell'istituto

9. NORMALIZZAZIONE CLASSI:
   - "1 OR" → "1AOR"
   - "5A OR" → "5AOR"

10. ASSOCIAZIONE SEDI:
    - Classi OR → "Sede Orosei"
    - Classi AS/BS → "Sede Biscollai"
    - IPSASR → "Via Toscana"

11. ${schoolContext}

12. JSON valido, niente markdown.
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
  console.log(" Classi rilevanti:", relevantClasses);
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(" Errore parsing JSON:", error);
    return {
      circolare: { numero: "N/D", data: "N/D", oggetto: "Errore", destinatari: [] },
      eventi: [],
      ordineDelGiorno: []
    };
  }
}