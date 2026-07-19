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
              "title": "string (es: 'Colloqui Scuola-Famiglia Liceo Scientifico Siniscola' o 'Consiglio di Classe 1AS')",
              "type": "string (es: 'Colloqui Scuola-Famiglia', 'Consigli di Classe', 'Scrutini', 'Collegio dei Docenti')",
              "sede": "string (Nome completo dell'istituto)",
              "data": "DD/MM/YYYY",
              "oraInizio": "HH:MM",
              "oraFine": "HH:MM",
              "classe": "string (es: '1AS', '4A IPSASR', o 'Tutte' se evento generale)"
            }
          ],
          "ordineDelGiorno": ["array di stringhe"]
        }

        REGOLE FONDAMENTALI:

        1. ORDINE DEL GIORNO (ODG):
           ✅ Cerca elenchi numerati (1., 2., 3.) ed estraili tutti nell'array "ordineDelGiorno".

        2. ESTRAZIONE DA TABELLE - REGOLA BRUTALE:
           ✅ LEGGI la tabella dall'INIZIO ALLA FINE, riga per riga.
           ✅ Se la circolare riguarda i COLLOQUI e la tabella elenca solo "Istituto", "Data" e "Ora" (senza classi specifiche), crea COMUNQUE un evento distinto per ogni riga/istituto.
           ✅ NON saltare nessuna sezione. Leggi IPSASR, ITTL, Liceo Scientifico, Dorgali.
           ✅ Per ogni riga, estrai: Classe (o 'Tutte'), Data, Ora, Luogo/Sede.
           ✅ Nel JSON finale, includi eventi per "Liceo Scientifico Siniscola" e "IPSASR". Escludi ITTL e Dorgali.

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
  
  // 🔍 DEBUG: Stampiamo il JSON grezzo per vedere COSA HA ESTRATTO L'AI
  console.log("🤖 RAW AI JSON OUTPUT:", content);

  return JSON.parse(content);
}