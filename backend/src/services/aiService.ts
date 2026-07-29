import OpenAI from "openai";

export async function analyzeCircularText(text: string, userClasses: string[] = []) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", 
  });

  const classesInstruction = userClasses.length > 0
    ? `\n\n🎯 CLASSI DI INTERESSE DELL'UTENTE: ${userClasses.join(', ')}\n` +
      `ISTRUZIONE CRITICA DI FILTRO: Estrai SOLO gli eventi relativi a queste classi specifiche. ` +
      `IGNORA completamente qualsiasi altra classe menzionata nel testo. ` +
      `ECCEZIONE OBBLIGATORIA: Se l'evento è GENERALE (es. "Collegio dei Docenti", "Formazione"), includilo SEMPRE impostando "classe": "Tutte".`
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
    "numero": "string (es: '52', 'N/D' se non presente)",
    "data": "string (es: '13/10/2025')",
    "oggetto": "string (NON lasciare mai vuoto!)",
    "destinatari": ["array di stringhe"]
  },
  "eventi": [
    {
      "title": "string (es: 'Consiglio di Classe 1AOR', 'Convocazione Collegio plenario')",
      "type": "string (es: 'Consigli di Classe', 'Collegio dei Docenti')",
      "sede": "string (es: 'Sede Orosei', 'Sede Biscollai', 'Liceo Scientifico Siniscola')",
      "data": "DD/MM/YYYY",
      "oraInizio": "HH:MM",
      "oraFine": "HH:MM",
      "classe": "string (es: '1AOR', 'Tutte' se evento generale)"
    }
  ],
  "ordineDelGiorno": ["array di stringhe (punti numerati)"]
}

REGOLE FONDAMENTALI (LEGGI ATTENTAMENTE):

1. OGGETTO: È VIETATO lasciare vuoto. Cerca "OGGETTO:" o usa la prima frase significativa.

2. DISTINZIONE CRITICA TRA ODG ED EVENTI (IMPORTANTE):
   - L'Ordine del Giorno (Odg) è una LISTA DI ARGOMENTI da discutere, NON sono eventi calendario!
   - Esempio: se l'Odg ha 7 punti, NON creare 7 eventi. Crea UN SOLO evento per la riunione.
   - Gli eventi calendario sono SOLO le riunioni/convocazioni con data, ora inizio e ora fine.
   - Se la circolare dice "Convocazione Collegio plenario il 1 settembre alle 10:30", crea UN evento:
     * title: "Convocazione Collegio plenario"
     * data: "01/09/2025"
     * oraInizio: "10:30"
     * oraFine: "12:00" (aggiungi 1h30m per Collegi)
   - I punti dell'Odg vanno nell'array "ordineDelGiorno", NON nell'array "eventi"!

3. ORDINE DEL GIORNO:
   - Estrai TUTTI i punti numerati (1., 2., 3., ecc.) o elencati dopo "Odg:" o "per discutere".
   - Mantieni il testo originale, non riassumere.

4. ESTRAZIONE EVENTI DA TABELLE:
   - ${classesInstruction}
   - Per le tabelle: ogni riga = UN evento.
   - NON confondere le righe della tabella con i punti dell'Odg!

5. NORMALIZZAZIONE NOMI CLASSI:
   - "1 OR" → "1AOR" (aggiungi "A" prima di "OR")
   - "2 OR" → "2AOR"
   - "3 OR" → "3AOR"
   - "4 OR" → "4AOR"
   - "5A OR" → "5AOR" (rimuovi spazio)
   - "5B OR" → "5BOR" (rimuovi spazio)

6. ASSOCIAZIONE SEDI (CRITICO):
   - Se la classe contiene "OR" (es: 1AOR, 2AOR, 3AOR, 4AOR, 5AOR, 5BOR), la sede DEVE essere "Sede Orosei"
   - Se la classe contiene "AS" o "BS" (es: 1AS, 2BS), la sede DEVE essere "Sede Biscollai"
   - Se la classe contiene "ETU", "RIMS", "SIAS", "AFM", la sede DEVE essere "Via Toscana"
   - NON associare automaticamente tutto a "Sede Biscollai" solo perché è menzionata nell'intestazione!

7. GESTIONE ORARI:
   - Se manca l'ora di fine, aggiungi 1h30m per Collegi dei Docenti o Consigli di Classe.
   - Aggiungi 1h per Dipartimenti o GLO.
   - VERIFICA SEMPRE che oraInizio < oraFine.

8. Restituisci SOLO JSON valido. Niente markdown (no \`\`\`json), niente testo extra. Inizia direttamente con { e termina con }.
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