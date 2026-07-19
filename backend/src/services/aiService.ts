import OpenAI from "openai";

export async function analyzeCircularText(text: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", 
  });

  const response = await openai.chat.completions.create({
    model: "llama-3.1-8b-instant",
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
            "oggetto": "string (Copia SOLO il testo dopo 'OGGETTO:' fino al punto fermo)",
            "destinatari": ["array di stringhe"]
          },
          "eventi": [
            {
              "title": "string (es: 'Consiglio di Classe 1AS Liceo Scientifico Siniscola')",
              "type": "string (es: 'Consigli di Classe', 'Scrutini', 'Collegio dei Docenti')",
              "sede": "string (Nome completo dell'istituto)",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (es: '1AS', '4A IPSASR')"
            }
          ],
          "ordineDelGiorno": ["array di stringhe - estrai i punti numerati 1., 2., 3., ecc."]
        }

        REGOLE FONDAMENTALI:

        1. OGGETTO: Copia solo il testo breve dopo "OGGETTO:", NON includere tutto il contenuto della circolare.

        2. ORDINE DEL GIORNO: Cerca punti numerati (1., 2., 3.) ed estraili in un array.

        3. TABELLE - ISTRUZIONE CRITICA:
           ✅ LEGGI la tabella dall'INIZIO ALLA FINE, riga per riga.
           ✅ NON fermarti dopo la prima sezione (es. IPSASR). CONTINUA a leggere anche le sezioni successive (Liceo Scientifico, ITTL, ecc.).
           ✅ Per OGNI riga con una classe, data e orario, crea un evento separato.
           ✅ Alla fine, FILTRA: tieni SOLO "Liceo Scientifico Siniscola" e "IPSASR". Scarta ITTL e Dorgali.

        4. NORMALIZZAZIONE:
           - Rimuovi "^" dalle classi (es: "1^A" → "1A")
           - Per il Liceo Scientifico, aggiungi "S" (es: "1A" → "1AS", "2B" → "2BS")
           - Per IPSASR, mantieni "1A IPSASR", "4A IPSASR"

        5. Restituisci SOLO JSON valido. Verifica che tutte le parentesi siano chiuse correttamente.`
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