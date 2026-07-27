import OpenAI from "openai";

export async function analyzeCircularText(text: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", 
  });

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
            "numero": "string (es: '5', '12/A', o 'N/D' se non presente)",
            "data": "string (es: '26/08/2025')",
            "oggetto": "string (Estrai il testo che segue 'OGGETTO:' o riassumi il tema principale. NON lasciare mai vuoto!)",
            "destinatari": ["array di stringhe (es: 'Docenti', 'Personale ATA', 'Genitori')"]
          },
          "eventi": [
            {
              "title": "string (es: 'Convocazione Collegio dei Docenti', 'Consiglio di Classe 5A')",
              "type": "string (es: 'Collegio dei Docenti', 'Consigli di Classe', 'GLO', 'Dipartimenti', 'Scrutini', 'Colloqui')",
              "sede": "string (Nome dell'istituto o luogo specifico, es: 'Auditorium sede Biscollai')",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (es: '5A', '1AS', 'Tutte' se evento generale)"
            }
          ],
          "ordineDelGiorno": ["array di stringhe (punti numerati o elencati)"]
        }

        REGOLE FONDAMENTALI PER L'ESTRAZIONE:

        1. OGGETTO: È VIETATO lasciare questo campo vuoto. Cerca "OGGETTO:" o usa la prima frase significativa.

        2. ESTRAZIONE EVENTI (TESTO O TABELLA):
           - NON cercare solo nelle tabelle! Leggi tutto il testo discorsivo.
           - Se trovi frasi come "convocata per il giorno X alle ore Y", "riunione il giorno Z", crea un evento.
           - Esempio: "convocata per il giorno 1 Settembre alle h. 10.30. nell’Auditorium" → Crea un evento con data "01/09/YYYY", oraInizio "10:30".

        3. GESTIONE ORARI (CRITICO):
           - Se nel testo c'è SOLO l'ora di inizio (es. "h. 10.30") e manca l'ora di fine:
             → AGGIUNGI 1 ora e 30 minuti per Collegi dei Docenti o Consigli di Classe (es. 10:30 → 12:00).
             → AGGIUNGI 1 ora per Dipartimenti o GLO (es. 15:00 → 16:00).
           - VERIFICA SEMPRE che oraInizio < oraFine. Non mettere mai lo stesso orario.

        4. COERENZA DELLE DATE:
           - Usa l'anno della data di emissione della circolare per correggere eventuali date incomplete negli eventi.

        5. DESTINATARI E CLASSI:
           - Per eventi generali (Collegio, Formazione), imposta "classe": "Tutte".
           - Se specifico per un indirizzo (es. IPSASR, Liceo), aggiungilo al campo "classe" o "sede".

        6. Restituisci SOLO JSON valido. Niente markdown (no \`\`\`json), niente testo extra. Inizia direttamente con { e termina con }.
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
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Errore nel parsing del JSON AI:", error);
    // Fallback di sicurezza in caso di JSON malformato
    return {
      circolare: { numero: "N/D", data: "N/D", oggetto: "Errore parsing AI", destinatari: [] },
      eventi: [],
      ordineDelGiorno: []
    };
  }
}