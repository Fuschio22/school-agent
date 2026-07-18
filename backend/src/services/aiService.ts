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
            "oggetto": "string",
            "destinatari": ["array di stringhe"]
          },
          "eventi": [
            {
              "title": "string (es: 'Consiglio di Classe 3A')",
              "type": "string (es: 'Consigli di Classe')",
              "sede": "string",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI:
        1. Crea UN evento per OGNI riga delle tabelle nel testo.
        2. Normalizza gli orari: se trovi '17.00', convertilo in '17:00'.
        3. Copia l'ordine del giorno ESATTAMENTE come nel testo, dividendolo in un array di stringhe.
        4. Restituisci SOLO il JSON, senza markdown o testo aggiuntivo.
        5. VIETATO usare abbreviazioni. Scrivi SEMPRE i nomi per esteso: usa "Consigli di Classe" (MAI "CDC"), "Collegio dei Docenti" (MAI "Collegio"), "Dipartimenti Disciplinari".
        6. FILTRO CLASSI OBBLIGATORIO: Estrai e crea eventi ESCLUSIVAMENTE per queste 12 classi: 5A IPSASR, 4A IPSASR, 1AS, 2AS, 3AS, 4AS, 5AS, 1BS, 2BS, 3BS, 4BS, 5BS (tutte del Liceo scientifico Siniscola). Se una riga della tabella riguarda un'altra classe, IGNORALA completamente e NON includerla nell'array "eventi".`
      },
      {
        role: "user",
        content: `Analizza questa circolare:\n\n${text}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}