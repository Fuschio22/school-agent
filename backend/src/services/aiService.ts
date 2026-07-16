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
            "numero": "string (es. '102')",
            "data": "string (es. '31 ottobre 2025')",
            "oggetto": "string",
            "destinatari": ["array di stringhe"]
          },
          "eventi": [
            {
              "sede": "Nome completo della sede (es. 'ISTITUTO PROFESSIONALE... Sede La Caletta')",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM (normalizza i punti in due punti, es. 17.00 -> 17:00)",
              "oraFine": "HH:MM",
              "classe": "Nome esatto della classe (es. '1^ A IPSASR')"
            }
          ],
          "ordineDelGiorno": [
            "1. insediamento della componente studenti e genitori",
            "2. andamento didattico disciplinare"
          ]
        }

        REGOLE FONDAMENTALI:
        1. Crea UN evento per OGNI riga delle tabelle nel testo (es. 15:00-16:00 1^A è un evento).
        2. Normalizza gli orari: se trovi '17.00', convertilo in '17:00'.
        3. Copia l'ordine del giorno ESATTAMENTE come nel testo, dividendolo in un array di stringhe in ORDINE CRESCENTE (da 1 a 8).
        4. Non omettere nessuna classe.
        5. Restituisci SOLO il JSON, senza markdown o testo aggiuntivo.`
      },
      {
        role: "user",
        content: `Analizza questa circolare:\n\n${text}`
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}