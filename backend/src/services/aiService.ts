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
            "numero": "string",
            "data": "string",
            "oggetto": "string (Copia ESATTAMENTE il testo dopo 'OGGETTO:')",
            "destinatari": ["array di stringhe"]
          },
          "eventi": [
            {
              "title": "string (es: 'Consiglio di Classe 5A IPSASR')",
              "type": "string (es: 'Consigli di Classe', 'Scrutini')",
              "sede": "string (Nome COMPLETO dell'istituto)",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (es: '5A IPSASR', '1AS', 'Tutte' se evento generale)"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI:

        1. ORDINE DEL GIORNO: Estrai tutti i punti numerati nell'array "ordineDelGiorno".

        2. COERENZA DELLE DATE:
           ✅ Controlla l'anno della circolare (es. "ottobre 2025").
           ✅ Se una riga ha un anno sbagliato, CORREGGILO automaticamente.

        3. ORARI - REGOLA CRITICA E INTELLIGENTE:
           
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
              
              - Se vedi: 14:30, 15:00, 15:30, 16:00 → differenza = 30 minuti → durata = 30 min
                → 14:30-15:00, 15:00-15:30, 15:30-16:00, 16:00-16:30
              
              - Se c'è SOLO UN evento nella sezione e non puoi calcolare la differenza:
                → Usa 45 minuti come durata di default.
           
           ✅ VERIFICA SEMPRE che oraInizio < oraFine. MAI mettere lo stesso orario per inizio e fine!

        4. ESTRAZIONE DA TABELLE:
           ✅ LEGGI la tabella dall'INIZIO ALLA FINE, riga per riga.
           ✅ Crea UN evento per OGNI SINGOLA RIGA.
           ✅ Se la sezione è "Istituto Professionale per l'Agricoltura" (IPSASR), aggiungi " IPSASR" al campo "classe".
           ✅ Se la sezione è "Liceo Scientifico", aggiungi "S" alla sezione (es: "1A" → "1AS").

        5. Restituisci SOLO JSON valido. Niente markdown, niente testo extra.`
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