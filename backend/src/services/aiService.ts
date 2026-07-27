import OpenAI from "openai";

export async function analyzeCircularText(text: string, userClasses: string[] = []) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", 
  });

  // ✅ Istruzione dinamica basata sulle classi dell'utente
  const classesInstruction = userClasses.length > 0
    ? `\n\n🎯 CLASSI DI INTERESSE DELL'UTENTE: ${userClasses.join(', ')}\n` +
      `ISTRUZIONE CRITICA DI FILTRO: Estrai SOLO gli eventi relativi a queste classi specifiche. ` +
      `IGNORA completamente qualsiasi altra classe menzionata nel testo (es. 1ASA, 3RIMS, ecc.). ` +
      `ECCEZIONE OBBLIGATORIA: Se l'evento è GENERALE (es. "Collegio dei Docenti", "Formazione", "Scrutini finali", "Riunione di Dipartimento", "Collegio plenario"), includilo SEMPRE impostando il campo "classe" come "Tutte".`
    : `\n\n⚠️ Nessuna classe specifica indicata: estrai tutti gli eventi presenti.`;

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
    "numero": "string (es: '52', '12/A', o 'N/D' se non presente)",
    "data": "string (es: '13/10/2025')",
    "oggetto": "string (Estrai il testo che segue 'OGGETTO:' o riassumi il tema. NON lasciare mai vuoto!)",
    "destinatari": ["array di stringhe"]
  },
  "eventi": [
    {
      "title": "string (es: 'Consiglio di Classe 1AOR', 'Convocazione Collegio plenario')",
      "type": "string (es: 'Consigli di Classe', 'Collegio dei Docenti', 'GLO', 'Dipartimenti', 'Scrutini', 'Colloqui')",
      "sede": "string (es: 'Sede Biscollai', 'Auditorium')",
      "data": "DD/MM/YYYY",
      "oraInizio": "HH:MM",
      "oraFine": "HH:MM",
      "classe": "string (es: '1AOR', 'Tutte' se evento generale)"
    }
  ],
  "ordineDelGiorno": ["array di stringhe (punti numerati o elencati)"]
}

REGOLE FONDAMENTALI PER L'ESTRAZIONE:

1. OGGETTO: È VIETATO lasciare questo campo vuoto. Cerca "OGGETTO:" o usa la prima frase significativa.

2. ORDINE DEL GIORNO (CRITICO):
   - Cerca sezioni con frasi come "per discutere il seguente Odg:", "Ordine del Giorno", "Odg:".
   - Estrai TUTTI i punti numerati (1., 2., 3., ecc.) o elencati immediatamente dopo.
   - Mantieni il testo originale dei punti, non riassumerli.
   - Se non trovi un OdG esplicito, lascia l'array vuoto [].

3. ESTRAZIONE EVENTI (TESTO O TABELLA):
   - NON cercare solo nelle tabelle! Leggi tutto il testo discorsivo.
   - Se trovi frasi come "convocata per il giorno X alle ore Y", crea un evento.
   - ${classesInstruction}

4. GESTIONE ORARI:
   - Se nel testo c'è SOLO l'ora di inizio (es. "h. 10.30") e manca l'ora di fine:
     → AGGIUNGI 1 ora e 30 minuti per Collegi dei Docenti o Consigli di Classe.
     → AGGIUNGI 1 ora per Dipartimenti o GLO.
   - VERIFICA SEMPRE che oraInizio < oraFine.

5. Restituisci SOLO JSON valido. Niente markdown (no \`\`\`json), niente testo extra. Inizia direttamente con { e termina con }.
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
    return {
      circolare: { numero: "N/D", data: "N/D", oggetto: "Errore parsing AI", destinatari: [] },
      eventi: [],
      ordineDelGiorno: []
    };
  }
}