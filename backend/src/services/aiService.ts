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
      "title": "string (es: 'Consiglio di Classe 1AOR')",
      "type": "string (es: 'Consigli di Classe')",
      "sede": "string (es: 'Sede Orosei', 'Sede Biscollai')",
      "data": "DD/MM/YYYY",
      "oraInizio": "HH:MM",
      "oraFine": "HH:MM",
      "classe": "string (es: '1AOR')"
    }
  ],
  "ordineDelGiorno": ["array di stringhe"]
}

REGOLE FONDAMENTALI (LEGGI ATTENTAMENTE):

1. OGGETTO: È VIETATO lasciare vuoto. Cerca "OGGETTO:" o usa la prima frase significativa.

2. DISTINZIONE CRITICA TRA ODG ED EVENTI:
   - L'Ordine del Giorno (Odg) è una LISTA DI ARGOMENTI, NON sono eventi calendario!
   - Se l'Odg ha 7 punti, NON creare 7 eventi. Crea UN SOLO evento per la riunione.
   - I punti dell'Odg vanno nell'array "ordineDelGiorno", NON in "eventi"!

3. LETTURA TABELLE (REGOLA CRITICA):
   - Molte circolari hanno tabelle dove L'INTESTAZIONE DELLA COLONNA contiene l'orario.
   - FORMATO TABELLA TIPICO:
     | Intestazione colonna | 15.00/15.45 | 15.45/16.30 | 16.30/17.15 |
     |----------------------|-------------|-------------|-------------|
     | Martedì 21/10/2025   | 1ASA        | 2ASA        | 3ASA        |
   
   - COME LEGGERE:
     * L'intestazione "15.00/15.45" significa: oraInizio=15:00, oraFine=15:45
     * La cella "1ASA" sotto quella colonna significa: classe=1ASA, data=Martedì 21/10/2025
     * Quindi l'evento è: classe 1ASA, data 21/10/2025, orario 15:00-15:45
   
   - PROCEDURA OBBLIGATORIA:
     1. Identifica l'intestazione della prima colonna (di solito contiene le date)
     2. Identifica le intestazioni delle altre colonne (contengono gli orari in formato "HH.MM/HH.MM")
     3. Per OGNI cella della tabella:
        - Prendi la data dalla prima colonna della stessa riga
        - Prendi l'orario dall'intestazione della colonna
        - Prendi la classe dal contenuto della cella
     4. Crea UN evento per ogni cella non vuota

4. NORMALIZZAZIONE NOMI CLASSI:
   - "1 OR" → "1AOR" (aggiungi "A" prima di "OR")
   - "2 OR" → "2AOR"
   - "3 OR" → "3AOR"
   - "4 OR" → "4AOR"
   - "5A OR" → "5AOR" (rimuovi spazio)
   - "5B OR" → "5BOR" (rimuovi spazio)
   - "1ASA" → "1AS" (rimuovi la "A" finale se presente)
   - "2BSA" → "2BS" (rimuovi la "A" finale se presente)

5. ASSOCIAZIONE SEDI:
   - Se la classe contiene "OR" → sede = "Sede Orosei"
   - Se la classe contiene "AS" o "BS" → sede = "Sede Biscollai"
   - Se la classe contiene "ETU", "RIMS", "SIAS", "AFM" → sede = "Via Toscana"

6. GESTIONE ORARI:
   - Se la tabella fornisce ENTRAMBI gli orari (es. "15.00/15.45"), usa quelli ESATTI.
   - Se manca l'ora di fine, aggiungi 1h30m per Collegi/Consigli, 1h per Dipartimenti/GLO.
   - VERIFICA SEMPRE che oraInizio < oraFine.

7. ${classesInstruction}

8. Restituisci SOLO JSON valido. Niente markdown. Inizia con { e termina con }.
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