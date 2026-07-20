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

        2. COERENZA DELLE DATE - REGOLA CRITICA:
           ✅ Controlla l'anno della circolare (es. "ottobre 2025").
           ✅ Se una riga della tabella ha un anno palesemente sbagliato (es. 2024 in una circolare del 2025), CORREGGILO automaticamente usando l'anno della circolare.
           ✅ NON generare date con anni passati o futuri di 10 anni rispetto al contesto della circolare.

        3. ESTRAZIONE DA TABELLE:
           ✅ LEGGI la tabella dall'INIZIO ALLA FINE, riga per riga.
           ✅ Crea UN evento per OGNI SINGOLA RIGA.
           ✅ Se la sezione è "Istituto Professionale per l'Agricoltura" (IPSASR), aggiungi " IPSASR" al campo "classe" (es: "5A" → "5A IPSASR").
           ✅ Se la sezione è "Liceo Scientifico", aggiungi "S" alla sezione (es: "1A" → "1AS").

        4. Restituisci SOLO JSON valido. Niente markdown, niente testo extra.`
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