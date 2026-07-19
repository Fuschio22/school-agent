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
              "title": "string (es: 'Colloqui Scuola-Famiglia Liceo Scientifico Siniscola')",
              "type": "string (es: 'Colloqui Scuola-Famiglia', 'Consigli di Classe', 'Scrutini')",
              "sede": "string (Nome COMPLETO dell'istituto, es: 'Istituto Professionale per l'Agricoltura')",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (es: '1AS', 'Tutte' se evento generale)"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI:

        1. ORDINE DEL GIORNO: Estrai tutti i punti numerati nell'array "ordineDelGiorno".

        2. ESTRAZIONE DA TABELLE - REGOLA D'ORO:
           ✅ LEGGI la tabella dall'INIZIO ALLA FINE, riga per riga.
           ✅ Crea UN evento per OGNI SINGOLA RIGA della tabella.
           ✅ NON saltare nessuna riga, anche se contiene ITTL o Dorgali.
           ✅ Estrai il nome dell'istituto ESATTAMENTE come scritto nella tabella.
           ✅ Se la riga non specifica classi, usa "classe": "Tutte".

        3. NORMALIZZAZIONE CLASSI:
           - Rimuovi "^" (es: "1^A" → "1A").
           - Liceo Scientifico: aggiungi "S" (es: "1A" → "1AS").
           - IPSASR: mantieni "1A IPSASR", "4A IPSASR".

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