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
      "type": "string (CATEGORIA FISSA OBBLIGATORIA - vedi lista sotto)",
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

3. CAMPO "type" - CATEGORIE FISSE OBBLIGATORIE (REGOLA CRITICA):
   ️ IL CAMPO "type" DEVE ESSERE ESATTAMENTE UNA DI QUESTE 6 CATEGORIE. NON INVENTARE ALTRE CATEGORIE!
   
   ✅ CATEGORIE PERMESSE (usa SOLO queste):
   - "Consigli di Classe" (per consigli di classe, riunioni di classe)
   - "Collegio dei Docenti" (per collegi plenario, collegi docenti)
   - "Collegio di Plesso" (per collegi di plesso separati per sede)
   - "Dipartimenti" (per dipartimenti disciplinari, riunioni di dipartimento)
   - "GLO" (per gruppi di lavoro operativi)
   - "Colloqui" (per colloqui scuola-famiglia, ricevimenti)
   
   ❌ CATEGORIE VIETATE (NON usare mai):
   - "Riunione" ← VIETATO! Usa "Consigli di Classe" o "Collegio dei Docenti"
   - "Meeting" ← VIETATO!
   - "Assemblea" ← VIETATO!
   - "per area disciplinare" ← VIETATO! Usa "Dipartimenti"
   - "plenario" ← VIETATO! Usa "Collegio dei Docenti"
   
   ESEMPI CORRETTI:
   - Evento: "Consiglio di Classe 1AOR" → type: "Consigli di Classe"
   - Evento: "Collegio dei Docenti plenario" → type: "Collegio dei Docenti"
   - Evento: "Dipartimenti disciplinari" → type: "Dipartimenti"
   - Evento: "Collegio di Plesso IPSASR" → type: "Collegio di Plesso"
   
   ⚠️ NON USARE MAI "Riunione" COME TYPE! Anche se il testo dice "riunione", il type deve essere la categoria corretta!

4. GESTIONE ORARI:
   - Se la circolare specifica ENTRAMBI gli orari (inizio E fine), usali ESATTAMENTE
   - Se specifica SOLO l'ora di inizio, aggiungi la durata standard:
     * Collegio dei Docenti → +1h30m
     * Consiglio di Classe → +1h30m
     * Collegio di Plesso → +1h
     * Dipartimenti → +1h
     * GLO → +1h
   - VERIFICA: oraFine deve essere 1-1.5 ore dopo oraInizio, NON 5-6 ore!

5. CAMPO "title" - TITOLO COMPLETO:
   - Titolo descrittivo completo con istituto se necessario
   - ✅ "Consiglio di Classe 1AOR"
   - ✅ "Dipartimenti disciplinari ITC Chironi-Satta"
   - ❌ "1 OR" (troppo breve)
   - ❌ "Riunione" (generico)

6. LETTURA LISTE DI EVENTI:
   - Quando vedi una lista con orari diversi, crea UN EVENTO PER OGNI RIGA

7. FILTRO EVENTI DA ESCLUDERE:
   - ESCLUDI eventi che contengono: "sostegno", "inclusione"

8. NORMALIZZAZIONE CLASSI:
   - "1 OR" → "1AOR"
   - "2 OR" → "2AOR"
   - "3 OR" → "3AOR"
   - "4 OR" → "4AOR"
   - "5A OR" → "5AOR"
   - "5B OR" → "5BOR"

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