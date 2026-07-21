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
            "numero": "string (es: '5', '12/A')",
            "data": "string (es: '15/09/2025')",
            "oggetto": "string (Estrai il testo che segue parole chiave come 'OGGETTO:', 'Oggetto:', 'Oggetto' o che rappresenta il tema principale. Se non è esplicito, riassumi brevemente il tema in una frase. NON lasciare mai vuoto!)",
            "destinatari": ["array di stringhe (es: 'Docenti', 'Personale ATA', 'Genitori')"]
          },
          "eventi": [
            {
              "title": "string (es: 'Convocazione Collegio dei Docenti', 'Consiglio di Classe 5A IPSASR')",
              "type": "string (es: 'Collegio dei Docenti', 'Consigli di Classe', 'GLO', 'Dipartimenti', 'Scrutini', 'Colloqui')",
              "sede": "string (Nome COMPLETO dell'istituto, es: 'Liceo Scientifico', 'IPSASR')",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (es: '5A IPSASR', '1AS', 'Tutte' se evento generale)"
            }
          ],
          "ordineDelGiorno": ["array di stringhe (punti numerati o elencati)"]
        }

        REGOLE FONDAMENTALI:

        1. OGGETTO: Cerca attentamente parole come "OGGETTO:", "Oggetto:", "Oggetto". Se il testo inizia direttamente con il tema (es. "Convocazione del Collegio dei Docenti"), usa quello come oggetto. È VIETATO lasciare questo campo vuoto o nullo.

        2. ORDINE DEL GIORNO: Estrai tutti i punti numerati o elencati nell'array "ordineDelGiorno".

        3. COERENZA DELLE DATE:
           ✅ Controlla l'anno della circolare o della data di emissione.
           ✅ Se una riga della tabella ha un anno mancante o palesemente sbagliato, CORREGGILO automaticamente in base al contesto.

        4. ORARI - REGOLA CRITICA E INTELLIGENTE:
           
           CASO A - La tabella mostra ENTRAMBI gli orari (es. "15:00 - 16:00" o "15:00 – 16:00"):
              → Usa quelli esatti.
           
           CASO B - La tabella mostra SOLO l'orario di inizio (es. "15:00", "15:30", "16:00"):
              → DEVI calcolare la durata guardando il PATTERN degli orari nella tabella.
              → Calcola la differenza tra l'orario di inizio di un evento e quello dell'evento SUCCESSIVO.
              → Usa quella differenza come durata per tutti gli eventi della stessa sezione.
              
              ESEMPI:
              - Se vedi: 15:00, 15:45, 16:30 → differenza = 45 minuti → durata = 45 min
                → 15:00-15:45, 15:45-16:30, 16:30-17:15
              
              - Se vedi: 15:00, 15:30, 16:00 → differenza = 30 minuti → durata = 30 min
                → 15:00-15:30, 15:30-16:00, 16:00-16:30
              
              - Se c'è SOLO UN evento nella sezione e non puoi calcolare la differenza:
                → Usa 60 minuti (1 ora) come durata di default per eventi come Collegi o Consigli, 45 minuti per altri.
           
           ✅ VERIFICA SEMPRE che oraInizio < oraFine. MAI mettere lo stesso orario per inizio e fine!

        5. ESTRAZIONE DA TABELLE:
           ✅ LEGGI la tabella dall'INIZIO ALLA FINE, riga per riga.
           ✅ Crea UN evento per OGNI SINGOLA RIGA.
           ✅ Se la sezione è "Istituto Professionale per l'Agricoltura" (o IPSASR), aggiungi " IPSASR" al campo "classe" o "sede".
           ✅ Se la sezione è "Liceo Scientifico", aggiungi "S" alla classe (es: "1A" → "1AS").
           ✅ Per eventi generali (es. Collegio dei Docenti), imposta "classe": "Tutte".

        6. Restituisci SOLO JSON valido. Niente markdown, niente testo extra. Inizia direttamente con { e termina con }.
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
  return JSON.parse(content);
}